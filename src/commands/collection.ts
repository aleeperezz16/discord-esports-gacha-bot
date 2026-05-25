import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  User,
} from 'discord.js';
import { players } from '../data/players';
import { claimRepository } from '../database/queries';
import { rarityLabel, rarityStars } from '../utils/helpers';

const PAGE_SIZE = 8;

export const data = new SlashCommandBuilder()
  .setName('coleccion')
  .setDescription('Muestra tu colección de jugadores o la de otro usuario.')
  .addUserOption(opt =>
    opt.setName('usuario')
      .setDescription('Usuario cuya colección quieres ver')
      .setRequired(false),
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const target: User = interaction.options.getUser('usuario') ?? interaction.user;
  const guildId = interaction.guildId!;

  const collection = await claimRepository.getUserCollection(target.id, guildId);

  if (collection.length === 0) {
    const isOwn = target.id === interaction.user.id;
    await interaction.reply({
      content: isOwn
        ? '📭 Aún no tienes jugadores. ¡Usa `/tirar` para conseguir uno!'
        : `📭 **${target.displayName}** no tiene jugadores en su colección.`,
      ephemeral: true,
    });
    return;
  }

  const playerMap = new Map(players.map(p => [p.id, p]));
  const items = collection
    .map(c => ({ player: playerMap.get(c.player_id), claimedAt: Number(c.claimed_at) }))
    .filter((c): c is { player: NonNullable<typeof c.player>; claimedAt: number } => !!c.player);

  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  let page = 0;

  const buildEmbed = (p: number) => {
    const slice = items.slice(p * PAGE_SIZE, (p + 1) * PAGE_SIZE);
    const desc  = slice.map(({ player, claimedAt }, i) =>
      `**${p * PAGE_SIZE + i + 1}.** ${rarityStars(player.rarity)} **${player.name}** — ${player.game}\n` +
      `└ ${player.team} · ${rarityLabel(player.rarity)} · <t:${Math.floor(claimedAt / 1000)}:d>`,
    ).join('\n\n');

    return new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`📁 Colección de ${target.displayName}`)
      .setDescription(desc)
      .setThumbnail(target.displayAvatarURL())
      .setFooter({ text: `Página ${p + 1}/${totalPages} · ${items.length} jugadores en total` });
  };

  const buildRow = (p: number) =>
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('prev').setLabel('◀').setStyle(ButtonStyle.Secondary).setDisabled(p === 0),
      new ButtonBuilder().setCustomId('next').setLabel('▶').setStyle(ButtonStyle.Secondary).setDisabled(p === totalPages - 1),
    );

  if (totalPages === 1) {
    await interaction.reply({ embeds: [buildEmbed(0)] });
    return;
  }

  const response = await interaction.reply({ embeds: [buildEmbed(page)], components: [buildRow(page)] });

  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 120_000,
    filter: i => i.user.id === interaction.user.id,
  });

  collector.on('collect', async btn => {
    if (btn.customId === 'prev') page = Math.max(0, page - 1);
    if (btn.customId === 'next') page = Math.min(totalPages - 1, page + 1);
    await btn.update({ embeds: [buildEmbed(page)], components: [buildRow(page)] });
  });

  collector.on('end', () => response.edit({ components: [] }).catch(() => undefined));
}
