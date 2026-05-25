import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from 'discord.js';
import { playerRepository, rollRepository, claimRepository } from '../database/queries';
import { rollPlayer, rarityColor, rarityStars, rarityLabel } from '../utils/helpers';

const MAX_ROLLS = 10;
const CLAIM_MS  = 60_000;

export const data = new SlashCommandBuilder()
  .setName('tirar')
  .setDescription('¡Tira para obtener un jugador de Esports aleatorio!');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const userId  = interaction.user.id;
  const guildId = interaction.guildId!;

  const recentRolls = await rollRepository.countRecentRolls(userId, guildId);
  if (recentRolls >= MAX_ROLLS) {
    const reset = await rollRepository.getNextResetTime(userId, guildId);
    await interaction.reply({
      content: `⏰ Alcanzaste el límite de **${MAX_ROLLS} tiradas por hora**.\nPodrás tirar de nuevo <t:${Math.floor(reset / 1000)}:R>.`,
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
  const remaining = MAX_ROLLS - recentRolls - 1;

  await rollRepository.addRoll(userId, guildId);

  const buildEmbed = (title: string, footer: string) =>
    new EmbedBuilder()
      .setColor(rarityColor(player.rarity))
      .setTitle(title)
      .addFields(
        { name: '🎮 Juego',        value: player.game,              inline: true },
        { name: '🏆 Equipo',       value: player.team,              inline: true },
        { name: '⚔️ Rol',          value: player.role,              inline: true },
        { name: '🌍 Nacionalidad', value: player.nationality,       inline: true },
        { name: '✨ Rareza',       value: rarityLabel(player.rarity), inline: true },
      )
      .setFooter({ text: footer })
      .setTimestamp();

  const activeEmbed = buildEmbed(
    `${rarityStars(player.rarity)}  ${player.name}`,
    `Tiradas restantes esta hora: ${remaining}/${MAX_ROLLS} · Expira en 60s`,
  );

  const claimBtn = () =>
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`claim:${player.id}`)
        .setLabel('¡Reclamar!')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✋'),
    );

  const disabledBtn = (label: string, emoji: string) =>
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`claim:${player.id}:done`)
        .setLabel(label)
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(emoji)
        .setDisabled(true),
    );

  const response = await interaction.reply({
    content: `🎲 **${interaction.user.displayName}** realizó una tirada…`,
    embeds: [activeEmbed],
    components: [claimBtn()],
  });

  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: CLAIM_MS,
  });

  collector.on('collect', async btn => {
    if (btn.user.id !== userId) {
      await btn.reply({
        content: `❌ Solo **${interaction.user.displayName}** puede reclamar su propia tirada.`,
        ephemeral: true,
      });
      return;
    }

    const recentClaims = await claimRepository.countRecentClaims(userId, guildId);
    if (recentClaims >= 1) {
      const reset = await claimRepository.getNextClaimResetTime(userId, guildId);
      await btn.reply({
        content: `⏰ Solo puedes reclamar **1 jugador por hora**.\nPodrás reclamar de nuevo <t:${Math.floor(reset / 1000)}:R>.`,
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

    const claimedEmbed = buildEmbed(
      `${rarityStars(player.rarity)}  ${player.name} — ¡Reclamado! 🎉`,
      `Reclamado por ${btn.user.tag}`,
    ).setDescription(`**${btn.user.displayName}** añadió a **${player.name}** a su colección.`);

    await btn.update({ embeds: [claimedEmbed], components: [disabledBtn('¡Reclamado!', '✅')] });
  });

  collector.on('end', async (_, reason) => {
    if (reason === 'claimed') return;

    const expiredEmbed = new EmbedBuilder()
      .setColor(0x808080)
      .setTitle(`⌛ Tirada expirada — ${player.name}`)
      .setDescription('Nadie reclamó este jugador a tiempo.')
      .setTimestamp();

    await response.edit({ embeds: [expiredEmbed], components: [disabledBtn('Expirado', '⌛')] })
      .catch(() => undefined);
  });
}
