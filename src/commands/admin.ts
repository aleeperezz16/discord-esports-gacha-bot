import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} from 'discord.js';
import { adminRepository } from '../database/queries';
import { syncPlayers } from '../services/sync';
import { config } from '../config';

const isDev = process.env.NODE_ENV !== 'production';

export const data = new SlashCommandBuilder()
  .setName(config.commands.admin.name)
  .setDescription(config.commands.admin.description)
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand(sub =>
    sub.setName('stats')
      .setDescription('Estadísticas de la base de datos.'),
  )
  .addSubcommand(sub =>
    sub.setName('check-images')
      .setDescription('Muestra cuántos jugadores tienen imagen y ejemplos de URLs.'),
  )
  .addSubcommand(sub =>
    sub.setName('sync')
      .setDescription('Fuerza una re-sincronización completa desde PandaScore.'),
  )
  .addSubcommand(sub =>
    sub.setName('reset-claims')
      .setDescription('Borra todos los reclamos de este servidor.'),
  )
  .addSubcommand(sub =>
    sub.setName('reset-rolls')
      .setDescription('Borra el historial de tiradas de este servidor.'),
  )
  .addSubcommand(sub =>
    sub.setName('reset-players')
      .setDescription('⚠️ Borra TODOS los jugadores, reclamos e historial globalmente.'),
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!isDev) {
    await interaction.reply({
      content: '❌ Comandos de admin solo disponibles en modo desarrollo (`NODE_ENV !== production`).',
      ephemeral: true,
    });
    return;
  }

  const sub     = interaction.options.getSubcommand();
  const guildId = interaction.guildId!;

  await interaction.deferReply({ ephemeral: true });

  switch (sub) {
    case 'stats': {
      const s = await adminRepository.getStats(guildId);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle('📊 Estadísticas de la DB')
            .addFields(
              { name: 'Jugadores totales', value: String(s.players),                  inline: true },
              { name: 'Con imagen',        value: String(s.withImages),               inline: true },
              { name: 'Sin imagen',        value: String(s.players - s.withImages),   inline: true },
              { name: 'Reclamos (guild)',  value: String(s.claims),                   inline: true },
              { name: 'Tiradas (guild)',   value: String(s.rolls),                    inline: true },
            )
            .setTimestamp(),
        ],
      });
      break;
    }

    case 'check-images': {
      const s       = await adminRepository.getStats(guildId);
      const samples = await adminRepository.getSampleImages(5);
      const lines   = samples.map(p => `**${p.name}**\n\`${p.image_url}\``).join('\n\n') || '*(ninguno)*';
      await interaction.editReply(
        `🖼️ **${s.withImages} / ${s.players}** jugadores tienen imagen en la DB.\n\n**Ejemplos:**\n${lines}`,
      );
      break;
    }

    case 'sync': {
      await interaction.editReply('🔄 Sincronizando desde PandaScore…');
      await syncPlayers();
      const s = await adminRepository.getStats(guildId);
      await interaction.editReply(`✅ Sync completado — **${s.players}** jugadores en DB, **${s.withImages}** con imagen.`);
      break;
    }

    case 'reset-claims': {
      const n = await adminRepository.resetClaims(guildId);
      await interaction.editReply(`🗑️ **${n}** reclamos eliminados de este servidor.`);
      break;
    }

    case 'reset-rolls': {
      const n = await adminRepository.resetRolls(guildId);
      await interaction.editReply(`🗑️ **${n}** registros de tiradas eliminados de este servidor.`);
      break;
    }

    case 'reset-players': {
      const n = await adminRepository.resetPlayers();
      await interaction.editReply(`💥 **${n}** jugadores eliminados. Todos los reclamos e historial también borrados.`);
      break;
    }
  }
}
