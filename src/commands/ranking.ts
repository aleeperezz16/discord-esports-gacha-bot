import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, Message } from 'discord.js';
import { claimRepository } from '../database/queries';
import { config } from '../config';

const MEDALS = ['🥇', '🥈', '🥉'];

async function buildRankingEmbed(
  guildId: string,
  client: { users: { fetch: (id: string) => Promise<{ displayName: string }> } },
): Promise<EmbedBuilder | string> {
  const ranking = await claimRepository.getServerRanking(guildId);

  if (ranking.length === 0) {
    return `📭 Nadie ha reclamado jugadores todavía. ¡Usa \`${config.prefix.enabled ? config.prefix.char : '/'}${config.commands.roll.name}\` para empezar!`;
  }

  const lines = await Promise.all(
    ranking.map(async ({ user_id, count }, i) => {
      const medal  = MEDALS[i] ?? `**${i + 1}.**`;
      const suffix = count === 1 ? 'jugador' : 'jugadores';
      try {
        const user = await client.users.fetch(user_id);
        return `${medal} **${user.displayName}** — ${count} ${suffix}`;
      } catch {
        return `${medal} <@${user_id}> — ${count} ${suffix}`;
      }
    }),
  );

  return new EmbedBuilder()
    .setColor(0xFFD700)
    .setTitle('🏆 Ranking de Coleccionistas')
    .setDescription(lines.join('\n'))
    .setFooter({ text: `Top ${ranking.length} del servidor` })
    .setTimestamp();
}

// ── Slash command ─────────────────────────────────────────────────────────────

export const data = new SlashCommandBuilder()
  .setName(config.commands.ranking.name)
  .setDescription(config.commands.ranking.description);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  const result = await buildRankingEmbed(interaction.guildId!, interaction.client);
  if (typeof result === 'string') {
    await interaction.editReply(result);
  } else {
    await interaction.editReply({ embeds: [result] });
  }
}

// ── Prefix command (!ranking) ─────────────────────────────────────────────────

export async function executeFromMessage(message: Message): Promise<void> {
  const guildId = message.guildId;
  if (!guildId) return;

  const result = await buildRankingEmbed(guildId, message.client);
  if (typeof result === 'string') {
    await message.reply(result);
  } else {
    await message.reply({ embeds: [result] });
  }
}
