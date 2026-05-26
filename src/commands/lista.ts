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
import { playerRepository, GuildPlayer } from '../database/queries';
import { config } from '../config';

const GAME_CHOICES = [
  { name: 'CS2',               value: 'CS2' },
  { name: 'League of Legends', value: 'League of Legends' },
  { name: 'Valorant',          value: 'Valorant' },
  { name: 'Dota 2',            value: 'Dota 2' },
  { name: 'Rocket League',     value: 'Rocket League' },
  { name: 'Overwatch 2',       value: 'Overwatch 2' },
];

// ── Shared display logic ──────────────────────────────────────────────────────

function buildListEmbed(
  players: GuildPlayer[],
  page:    number,
  total:   number,
  filter:  string | null,
): EmbedBuilder {
  const pageSize = config.list.pageSize;
  const start    = page * pageSize;
  const slice    = players.slice(start, start + pageSize);

  const desc = slice.map((p, i) => {
    const num   = start + i + 1;
    const claim = p.claimed_by ? ` — <@${p.claimed_by}>` : '';
    return `**#${num}** — **${p.name}** — ${p.team} · ${p.game}${claim}`;
  }).join('\n');

  const title = filter ? `📋 Jugadores — ${filter}` : '📋 Todos los jugadores';

  return new EmbedBuilder()
    .setColor(0x2ECC71)
    .setTitle(title)
    .setDescription(desc)
    .setFooter({ text: `Página ${page + 1}/${total} · ${players.length} jugadores` });
}

function buildPageRow(page: number, totalPages: number): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('prev').setLabel('◀').setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
    new ButtonBuilder().setCustomId('next').setLabel('▶').setStyle(ButtonStyle.Secondary).setDisabled(page === totalPages - 1),
  );
}

async function runPaginatedList(
  players:     GuildPlayer[],
  filter:      string | null,
  sendInitial: (embed: EmbedBuilder, row?: ActionRowBuilder<ButtonBuilder>) => Promise<Message>,
): Promise<void> {
  if (players.length === 0) {
    const msg = filter
      ? `📭 No hay jugadores de **${filter}** en la base de datos.`
      : '📭 No hay jugadores en la base de datos todavía.';
    await sendInitial(new EmbedBuilder().setDescription(msg).setColor(0x95A5A6));
    return;
  }

  const totalPages = Math.ceil(players.length / config.list.pageSize);
  let page = 0;

  const response = totalPages === 1
    ? await sendInitial(buildListEmbed(players, 0, 1, filter))
    : await sendInitial(
        buildListEmbed(players, page, totalPages, filter),
        buildPageRow(page, totalPages),
      );

  if (totalPages === 1) return;

  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time:          config.collection.paginationTimeoutMs,
  });

  collector.on('collect', async btn => {
    if (btn.customId === 'prev') page = Math.max(0, page - 1);
    if (btn.customId === 'next') page = Math.min(totalPages - 1, page + 1);
    await btn.update({
      embeds:     [buildListEmbed(players, page, totalPages, filter)],
      components: [buildPageRow(page, totalPages)],
    });
  });

  collector.on('end', () => response.edit({ components: [] }).catch(() => undefined));
}

// ── Slash command ─────────────────────────────────────────────────────────────

export const data = new SlashCommandBuilder()
  .setName(config.commands.lista.name)
  .setDescription(config.commands.lista.description)
  .addStringOption(opt =>
    opt.setName('juego')
      .setDescription('Filtrar por juego')
      .setRequired(false)
      .addChoices(...GAME_CHOICES),
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  const filter  = interaction.options.getString('juego');
  const players = await playerRepository.getGuildPlayerList(interaction.guildId!, filter);

  await runPaginatedList(
    players,
    filter,
    async (embed, row) => {
      const msg = await interaction.editReply({ embeds: [embed], components: row ? [row] : [] });
      return msg as unknown as Message;
    },
  );
}

// ── Prefix command (!lista [juego]) ──────────────────────────────────────────

export async function executeFromMessage(message: Message): Promise<void> {
  const guildId = message.guildId;
  if (!guildId) return;

  const args   = message.content.trim().split(/\s+/).slice(1);
  const filter = args.length > 0 ? args.join(' ') : null;

  const players = await playerRepository.getGuildPlayerList(guildId, filter);

  await runPaginatedList(
    players,
    filter,
    async (embed, row) => message.reply({ embeds: [embed], components: row ? [row] : [] }),
  );
}
