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
import { rollPlayer, rarityColor, rarityStars, rarityLabel } from '../utils/helpers';
import { config } from '../config';
import { Player } from '../data/players';

// ── Shared UI builders ────────────────────────────────────────────────────────

function buildRollEmbed(player: Player, title: string, footer: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(rarityColor(player.rarity))
    .setTitle(title)
    .addFields(
      { name: '🎮 Juego',        value: player.game,                inline: true },
      { name: '🏆 Equipo',       value: player.team,                inline: true },
      { name: '⚔️ Rol',          value: player.role,                inline: true },
      { name: '🌍 Nacionalidad', value: player.nationality,         inline: true },
      { name: '✨ Rareza',       value: rarityLabel(player.rarity), inline: true },
    )
    .setFooter({ text: footer })
    .setTimestamp();
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
    if (recentClaims >= config.claims.maxPerHour) {
      const reset = await claimRepository.getNextClaimResetTime(userId, guildId);
      await btn.reply({
        content: `⏰ Solo puedes reclamar **${config.claims.maxPerHour} jugador por hora**.\nPodrás reclamar de nuevo <t:${Math.floor(reset / 1000)}:R>.`,
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

    const claimedEmbed = buildRollEmbed(
      player,
      `${rarityStars(player.rarity)}  ${player.name} — ¡Reclamado! 🎉`,
      `Reclamado por ${btn.user.tag}`,
    ).setDescription(`**${btn.user.displayName}** añadió a **${player.name}** a su colección.`);

    await btn.update({ embeds: [claimedEmbed], components: [disabledBtn(player.id, '¡Reclamado!', '✅')] });
  });

  collector.on('end', async (_, reason) => {
    if (reason === 'claimed') return;

    const expiredEmbed = new EmbedBuilder()
      .setColor(0x808080)
      .setTitle(`⌛ Tirada expirada — ${player.name}`)
      .setDescription('Nadie reclamó este jugador a tiempo.')
      .setTimestamp();

    // response.edit exists on both InteractionResponse and Message
    await (response as unknown as { edit: (d: unknown) => Promise<unknown> })
      .edit({ embeds: [expiredEmbed], components: [disabledBtn(player.id, 'Expirado', '⌛')] })
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

  const recentRolls = await rollRepository.countRecentRolls(userId, guildId);
  if (recentRolls >= config.rolls.maxPerHour) {
    const reset = await rollRepository.getNextResetTime(userId, guildId);
    await interaction.reply({
      content: `⏰ Alcanzaste el límite de **${config.rolls.maxPerHour} tiradas por hora**.\nPodrás tirar de nuevo <t:${Math.floor(reset / 1000)}:R>.`,
      ephemeral: true,
    });
    return;
  }

  const available = await playerRepository.getAvailablePlayers(guildId);
  if (available.length === 0) {
    await interaction.reply({
      content: '🏆 ¡Todos los jugadores ya han sido reclamados en este servidor!',
      ephemeral: true,
    });
    return;
  }

  const player    = rollPlayer(available);
  const remaining = config.rolls.maxPerHour - recentRolls - 1;

  await rollRepository.addRoll(userId, guildId);

  const response = await interaction.reply({
    content: `🎲 **${interaction.user.displayName}** realizó una tirada…`,
    embeds: [buildRollEmbed(
      player,
      `${rarityStars(player.rarity)}  ${player.name}`,
      `Tiradas restantes esta hora: ${remaining}/${config.rolls.maxPerHour} · Expira en ${config.rolls.claimWindowMs / 1000}s`,
    )],
    components: [claimBtn(player.id)],
  });

  attachCollector(response, player, userId, guildId, interaction.user.displayName);
}

// ── Prefix command (!tirar) ───────────────────────────────────────────────────

export async function executeFromMessage(message: Message): Promise<void> {
  const userId  = message.author.id;
  const guildId = message.guildId;
  if (!guildId) return;

  const recentRolls = await rollRepository.countRecentRolls(userId, guildId);
  if (recentRolls >= config.rolls.maxPerHour) {
    const reset = await rollRepository.getNextResetTime(userId, guildId);
    await message.reply(`⏰ Alcanzaste el límite de **${config.rolls.maxPerHour} tiradas por hora**.\nPodrás tirar de nuevo <t:${Math.floor(reset / 1000)}:R>.`);
    return;
  }

  const available = await playerRepository.getAvailablePlayers(guildId);
  if (available.length === 0) {
    await message.reply('🏆 ¡Todos los jugadores ya han sido reclamados en este servidor!');
    return;
  }

  const player      = rollPlayer(available);
  const remaining   = config.rolls.maxPerHour - recentRolls - 1;
  const displayName = message.member?.displayName ?? message.author.username;

  await rollRepository.addRoll(userId, guildId);

  const response = await message.reply({
    content: `🎲 **${displayName}** realizó una tirada…`,
    embeds: [buildRollEmbed(
      player,
      `${rarityStars(player.rarity)}  ${player.name}`,
      `Tiradas restantes esta hora: ${remaining}/${config.rolls.maxPerHour} · Expira en ${config.rolls.claimWindowMs / 1000}s`,
    )],
    components: [claimBtn(player.id)],
  });

  attachCollector(response, player, userId, guildId, displayName);
}
