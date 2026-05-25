import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { claimRepository } from '../database/queries';

const MEDALS = ['🥇', '🥈', '🥉'];

export const data = new SlashCommandBuilder()
  .setName('ranking')
  .setDescription('Muestra el ranking de coleccionistas del servidor.');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const ranking = await claimRepository.getServerRanking(interaction.guildId!);

  if (ranking.length === 0) {
    await interaction.editReply('📭 Nadie ha reclamado jugadores todavía. ¡Usa `/tirar` para empezar!');
    return;
  }

  const lines = await Promise.all(
    ranking.map(async ({ user_id, count }, i) => {
      const medal = MEDALS[i] ?? `**${i + 1}.**`;
      const suffix = count === 1 ? 'jugador' : 'jugadores';
      try {
        const user = await interaction.client.users.fetch(user_id);
        return `${medal} **${user.displayName}** — ${count} ${suffix}`;
      } catch {
        return `${medal} <@${user_id}> — ${count} ${suffix}`;
      }
    }),
  );

  const embed = new EmbedBuilder()
    .setColor(0xFFD700)
    .setTitle('🏆 Ranking de Coleccionistas')
    .setDescription(lines.join('\n'))
    .setFooter({ text: `Top ${ranking.length} del servidor` })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
