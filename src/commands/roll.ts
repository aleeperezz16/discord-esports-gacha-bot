import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  Message,
} from 'discord.js';
import { playerRepository, rollRepository, claimRepository } from '../database/queries';
import { guildConfigRepository } from '../database/guildConfig';
import { rollPlayer, rarityColor } from '../utils/helpers';
import { config } from '../config';
import { Player } from '../data/players';

// Prevents concurrent double-rolls from the same user in the same guild.
const pendingRolls = new Set<string>();

// ── Shared UI builders ────────────────────────────────────────────────────────

function buildRollEmbed(player: Player, remaining: number): EmbedBuilder {
  const footerText = remaining <= 0
    ? '⚠️ SIN TIRADAS RESTANTES ⚠️'
    : `⚠️ ${remaining} ROLL${remaining === 1 ? '' : 'S'} RESTANTE${remaining === 1 ? '' : 'S'} ⚠️`;

  const embed = new EmbedBuilder()
    .setColor(rarityColor(player.rarity))
    .setTitle(player.name)
    .setDescription(`${player.team} · ${player.game}`)
    .addFields(
      { name: 'Nacionalidad', value: player.nationality || 'Desconocida', inline: true },
      { name: 'Rol',          value: player.role        || 'Pro Player',  inline: true },
    )
    .setFooter({ text: footerText });

  if (player.image_url) embed.setImage(player.image_url);
  return embed;
}

function buildClaimedEmbed(player: Player, claimerTag: string): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(rarityColor(player.rarity))
    .setTitle(player.name)
    .setDescription(`${player.team} · ${player.game}`)
    .addFields(
      { name: 'Nacionalidad', value: player.nationality || 'Desconocida', inline: true },
      { name: 'Rol',          value: player.role        || 'Pro Player',  inline: true },
    )
    .setFooter({ text: `¡Reclamado por ${claimerTag}! 🎉` });

  if (player.image_url) embed.setImage(player.image_url);
  return embed;
}

function buildExpiredEmbed(player: Player): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(0x808080)
    .setTitle(player.name)
    .setDescription(`${player.team} · ${player.game}`)
    .addFields(
      { name: 'Nacionalidad', value: player.nationality || 'Desconocida', inline: true },
      { name: 'Rol',          value: player.role        || 'Pro Player',  inline: true },
    )
    .setFooter({ text: '⌛ Tirada expirada — nadie reclamó a tiempo.' });

  if (player.image_url) embed.setImage(player.image_url);
  return embed;
}

function claimBtn(playerId: string): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`claim:${playerId}`)
      .setLabel('¡Reclamar!')
      .setStyle(ButtonStyle.Success)
      .setEmoji('✋'),
  );
}

function disabledBtn(playerId: string, label: string, emoji: string): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`claim:${playerId}:done`)
      .setLabel(label)
      .setStyle(ButtonStyle.Secondary)
      .setEmoji(emoji)
      .setDisabled(true),
  );
}

// ── Collector logic (shared between slash and prefix) ─────────────────────────

function attachCollector(
  response: { createMessageComponentCollector: Message['createMessageComponentCollector'] },
  player: Player,
  userId: string,
  guildId: string,
  displayName: string,
  maxClaims: number,
): void {
  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: config.rolls.claimWindowMs,
  });

  collector.on('collect', async btn => {
    if (btn.user.id !== userId) {
      await btn.reply({
        content: `❌ Solo **${displayName}** puede reclamar su propia tirada.`,
        ephemeral: true,
      });
      return;
    }

    const recentClaims = await claimRepository.countRecentClaims(userId, guildId);
    if (recentClaims >= maxClaims) {
      const reset = await claimRepository.getNextClaimResetTime(userId, guildId);
      await btn.reply({
        content: `⏰ Solo puedes reclamar **${maxClaims} jugador por hora**.\nPodrás reclamar de nuevo <t:${Math.floor(reset / 1000)}:R>.`,
        ephemeral: true,
      });
      return;
    }

    const success = await claimRepository.claimPlayer(player.id, guildId, userId);
    if (!success) {
      await btn.reply({ content: '❌ Este jugador ya fue reclamado por otro usuario.', ephemeral: true });
      return;
    }

    collector.stop('claimed');
    await btn.update({
      embeds:     [buildClaimedEmbed(player, btn.user.tag)],
      components: [disabledBtn(player.id, '¡Reclamado!', '✅')],
    });
  });

  collector.on('end', async (_, reason) => {
    if (reason === 'claimed') return;
    await (response as unknown as { edit: (d: unknown) => Promise<unknown> })
      .edit({ embeds: [buildExpiredEmbed(player)], components: [disabledBtn(player.id, 'Expirado', '⌛')] })
      .catch(() => undefined);
  });
}

// ── Slash command ─────────────────────────────────────────────────────────────

export const data = new SlashCommandBuilder()
  .setName(config.commands.roll.name)
  .setDescription(config.commands.roll.description);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const userId  = interaction.user.id;
  const guildId = interaction.guildId!;
  const key     = `${userId}:${guildId}`;

  if (pendingRolls.has(key)) {
    await interaction.reply({ content: '⏳ Ya tienes una tirada en progreso.', ephemeral: true });
    return;
  }
  pendingRolls.add(key);

  try {
    const guildCfg    = await guildConfigRepository.get(guildId);
    const maxRolls    = guildCfg.max_rolls_per_hour;
    const recentRolls = await rollRepository.countRecentRolls(userId, guildId);

    if (recentRolls >= maxRolls) {
      const reset = await rollRepository.getNextResetTime(userId, guildId);
      await interaction.reply({
        content: `⏰ Alcanzaste el límite de **${maxRolls} tiradas por hora**.\nPodrás tirar de nuevo <t:${Math.floor(reset / 1000)}:R>.`,
        ephemeral: true,
      });
      return;
    }

    const available = await playerRepository.getAvailablePlayers(guildId);
    if (available.length === 0) {
      await interaction.reply({ content: '🏆 ¡Todos los jugadores ya han sido reclamados en este servidor!', ephemeral: true });
      return;
    }

    const player    = rollPlayer(available);
    const remaining = maxRolls - recentRolls - 1;

    await rollRepository.addRoll(userId, guildId);

    const response = await interaction.reply({
      embeds:     [buildRollEmbed(player, remaining)],
      components: [claimBtn(player.id)],
    });

    attachCollector(response, player, userId, guildId, interaction.user.displayName, guildCfg.max_claims_per_hour);
  } finally {
    pendingRolls.delete(key);
  }
}

// ── Prefix command (!roll) ────────────────────────────────────────────────────

export async function executeFromMessage(message: Message): Promise<void> {
  const userId  = message.author.id;
  const guildId = message.guildId;
  if (!guildId) return;

  const key = `${userId}:${guildId}`;
  if (pendingRolls.has(key)) return;
  pendingRolls.add(key);

  try {
    const guildCfg    = await guildConfigRepository.get(guildId);
    const maxRolls    = guildCfg.max_rolls_per_hour;
    const recentRolls = await rollRepository.countRecentRolls(userId, guildId);

    if (recentRolls >= maxRolls) {
      const reset = await rollRepository.getNextResetTime(userId, guildId);
      await message.reply(`⏰ Alcanzaste el límite de **${maxRolls} tiradas por hora**.\nPodrás tirar de nuevo <t:${Math.floor(reset / 1000)}:R>.`);
      return;
    }

    const available = await playerRepository.getAvailablePlayers(guildId);
    if (available.length === 0) {
      await message.reply('🏆 ¡Todos los jugadores ya han sido reclamados en este servidor!');
      return;
    }

    const player      = rollPlayer(available);
    const remaining   = maxRolls - recentRolls - 1;
    const displayName = message.member?.displayName ?? message.author.username;

    await rollRepository.addRoll(userId, guildId);

    const response = await message.reply({
      embeds:     [buildRollEmbed(player, remaining)],
      components: [claimBtn(player.id)],
    });

    attachCollector(response, player, userId, guildId, displayName, guildCfg.max_claims_per_hour);
  } finally {
    pendingRolls.delete(key);
  }
}
