import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  User,
  Message,
} from 'discord.js';
import { claimRepository, ClaimedPlayer } from '../database/queries';
import { rarityLabel, rarityStars } from '../utils/helpers';
import { config } from '../config';
import { Rarity } from '../data/players';

// ── Shared display logic ──────────────────────────────────────────────────────

function buildCollectionEmbed(
  items: ClaimedPlayer[],
  page: number,
  totalPages: number,
  targetDisplayName: string,
  targetAvatarUrl: string,
): EmbedBuilder {
  const start = page * config.collection.pageSize;
  const slice = items.slice(start, start + config.collection.pageSize);

  const desc = slice.map((c, i) => {
    const rarity = (c.rarity ?? 'common') as Rarity;
    return (
      `**${start + i + 1}.** ${rarityStars(rarity)} **${c.name ?? c.player_id}** — ${c.game ?? '?'}\n` +
      `└ ${c.team ?? 'Free Agent'} · ${rarityLabel(rarity)} · <t:${Math.floor(Number(c.claimed_at) / 1000)}:d>`
    );
  }).join('\n\n');

  return new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(`📁 Colección de ${targetDisplayName}`)
    .setDescription(desc)
    .setThumbnail(targetAvatarUrl)
    .setFooter({ text: `Página ${page + 1}/${totalPages} · ${items.length} jugadores en total` });
}

function buildPageRow(page: number, totalPages: number): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('prev').setLabel('◀').setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
    new ButtonBuilder().setCustomId('next').setLabel('▶').setStyle(ButtonStyle.Secondary).setDisabled(page === totalPages - 1),
  );
}

async function runPaginatedCollection(
  collection: ClaimedPlayer[],
  targetDisplayName: string,
  targetAvatarUrl: string,
  sendInitial: (embed: EmbedBuilder, row?: ActionRowBuilder<ButtonBuilder>) => Promise<Message>,
  isOwnCollection: boolean,
): Promise<void> {
  if (collection.length === 0) {
    const empty = isOwnCollection
      ? `📭 Aún no tienes jugadores. ¡Usa \`/${config.commands.roll.name}\` para conseguir uno!`
      : `📭 **${targetDisplayName}** no tiene jugadores en su colección.`;
    await sendInitial(new EmbedBuilder().setDescription(empty).setColor(0x95A5A6));
    return;
  }

  const totalPages = Math.ceil(collection.length / config.collection.pageSize);
  let page = 0;

  const response = totalPages === 1
    ? await sendInitial(buildCollectionEmbed(collection, 0, 1, targetDisplayName, targetAvatarUrl))
    : await sendInitial(
        buildCollectionEmbed(collection, page, totalPages, targetDisplayName, targetAvatarUrl),
        buildPageRow(page, totalPages),
      );

  if (totalPages === 1) return;

  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: config.collection.paginationTimeoutMs,
  });

  collector.on('collect', async btn => {
    if (btn.customId === 'prev') page = Math.max(0, page - 1);
    if (btn.customId === 'next') page = Math.min(totalPages - 1, page + 1);
    await btn.update({
      embeds:     [buildCollectionEmbed(collection, page, totalPages, targetDisplayName, targetAvatarUrl)],
      components: [buildPageRow(page, totalPages)],
    });
  });

  collector.on('end', () => response.edit({ components: [] }).catch(() => undefined));
}

// ── Slash command ─────────────────────────────────────────────────────────────

export const data = new SlashCommandBuilder()
  .setName(config.commands.collection.name)
  .setDescription(config.commands.collection.description)
  .addUserOption(opt =>
    opt.setName('usuario')
      .setDescription('Usuario cuya colección quieres ver')
      .setRequired(false),
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const target: User = interaction.options.getUser('usuario') ?? interaction.user;
  const guildId = interaction.guildId!;
  const collection = await claimRepository.getUserCollection(target.id, guildId);

  await interaction.deferReply();

  await runPaginatedCollection(
    collection,
    target.displayName,
    target.displayAvatarURL(),
    async (embed, row) => {
      const msg = await interaction.editReply({ embeds: [embed], components: row ? [row] : [] });
      return msg as unknown as Message;
    },
    target.id === interaction.user.id,
  );
}

// ── Prefix command (!coleccion [@mention]) ────────────────────────────────────

export async function executeFromMessage(message: Message): Promise<void> {
  const guildId = message.guildId;
  if (!guildId) return;

  const target      = message.mentions.users.first() ?? message.author;
  const guildMember = message.guild?.members.cache.get(target.id);
  const displayName = guildMember?.displayName ?? target.username;
  const avatarUrl   = target.displayAvatarURL();

  const collection = await claimRepository.getUserCollection(target.id, guildId);

  await runPaginatedCollection(
    collection,
    displayName,
    avatarUrl,
    async (embed, row) => message.reply({ embeds: [embed], components: row ? [row] : [] }),
    target.id === message.author.id,
  );
}
