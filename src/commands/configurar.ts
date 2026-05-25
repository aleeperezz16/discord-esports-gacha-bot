import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} from 'discord.js';
import { guildConfigRepository } from '../database/guildConfig';
import { config } from '../config';

export const data = new SlashCommandBuilder()
  .setName('configurar')
  .setDescription('Configuración del bot para este servidor.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)

  .addSubcommand(sub =>
    sub.setName('ver')
      .setDescription('Muestra la configuración actual del servidor.'),
  )

  .addSubcommand(sub =>
    sub.setName('prefijo')
      .setDescription('Configura el prefijo de comandos por mensaje (ej: !tirar).')
      .addBooleanOption(opt =>
        opt.setName('activado')
          .setDescription('Activar o desactivar el prefijo')
          .setRequired(false),
      )
      .addStringOption(opt =>
        opt.setName('caracter')
          .setDescription('Carácter del prefijo (ej: !, $, ?)')
          .setMinLength(1)
          .setMaxLength(5)
          .setRequired(false),
      ),
  )

  .addSubcommand(sub =>
    sub.setName('limites')
      .setDescription('Configura los límites de tiradas y reclamos por hora.')
      .addIntegerOption(opt =>
        opt.setName('tiradas-por-hora')
          .setDescription(`Tiradas máximas por usuario por hora (default: ${config.rolls.maxPerHour})`)
          .setMinValue(1)
          .setMaxValue(100)
          .setRequired(false),
      )
      .addIntegerOption(opt =>
        opt.setName('reclamos-por-hora')
          .setDescription(`Reclamos máximos por usuario por hora (default: ${config.claims.maxPerHour})`)
          .setMinValue(1)
          .setMaxValue(10)
          .setRequired(false),
      ),
  );

function buildConfigEmbed(guildName: string, cfg: Awaited<ReturnType<typeof guildConfigRepository.get>>): EmbedBuilder {
  const prefixStatus = cfg.prefix_enabled
    ? `✅ Activado — carácter: \`${cfg.prefix_char}\``
    : '❌ Desactivado';

  return new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(`🔧 Configuración — ${guildName}`)
    .addFields(
      {
        name:   '💬 Prefijo de comandos',
        value:  [
          prefixStatus,
          cfg.prefix_enabled
            ? `Usá \`${cfg.prefix_char}${config.commands.roll.name}\`, \`${cfg.prefix_char}${config.commands.collection.name}\`, etc.`
            : `Activalo con \`/configurar prefijo activado:true\`.`,
        ].join('\n'),
        inline: false,
      },
      {
        name:   '🎲 Tiradas',
        value:  `Máximo por hora: **${cfg.max_rolls_per_hour}**`,
        inline: true,
      },
      {
        name:   '✋ Reclamos',
        value:  `Máximo por hora: **${cfg.max_claims_per_hour}**`,
        inline: true,
      },
    )
    .setFooter({ text: 'ℹ️ El prefijo requiere "Message Content Intent" en el Discord Developer Portal → Bot' })
    .setTimestamp();
}

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const guildId   = interaction.guildId!;
  const guildName = interaction.guild?.name ?? guildId;
  const sub       = interaction.options.getSubcommand();

  if (sub === 'ver') {
    const cfg = await guildConfigRepository.get(guildId);
    await interaction.reply({ embeds: [buildConfigEmbed(guildName, cfg)] });
    return;
  }

  if (sub === 'prefijo') {
    const activado = interaction.options.getBoolean('activado');
    const caracter = interaction.options.getString('caracter');

    if (activado === null && caracter === null) {
      const cfg = await guildConfigRepository.get(guildId);
      await interaction.reply({
        content: `Configuración actual del prefijo:\n- Estado: ${cfg.prefix_enabled ? '✅ Activado' : '❌ Desactivado'}\n- Carácter: \`${cfg.prefix_char}\`\n\nUsá las opciones \`activado\` y/o \`caracter\` para modificarlo.`,
        ephemeral: true,
      });
      return;
    }

    const patch: Parameters<typeof guildConfigRepository.set>[1] = {};
    if (activado !== null) patch.prefix_enabled = activado;
    if (caracter !== null) patch.prefix_char    = caracter;

    const cfg = await guildConfigRepository.set(guildId, patch);
    await interaction.reply({ embeds: [buildConfigEmbed(guildName, cfg)] });
    return;
  }

  if (sub === 'limites') {
    const tiradas  = interaction.options.getInteger('tiradas-por-hora');
    const reclamos = interaction.options.getInteger('reclamos-por-hora');

    if (tiradas === null && reclamos === null) {
      const cfg = await guildConfigRepository.get(guildId);
      await interaction.reply({
        content: `Límites actuales:\n- Tiradas/hora: **${cfg.max_rolls_per_hour}**\n- Reclamos/hora: **${cfg.max_claims_per_hour}**\n\nUsá las opciones \`tiradas-por-hora\` y/o \`reclamos-por-hora\` para modificarlos.`,
        ephemeral: true,
      });
      return;
    }

    const patch: Parameters<typeof guildConfigRepository.set>[1] = {};
    if (tiradas  !== null) patch.max_rolls_per_hour  = tiradas;
    if (reclamos !== null) patch.max_claims_per_hour = reclamos;

    const cfg = await guildConfigRepository.set(guildId, patch);
    await interaction.reply({ embeds: [buildConfigEmbed(guildName, cfg)] });
  }
}

// No prefix version — config is admin-only and slash-only by design.
