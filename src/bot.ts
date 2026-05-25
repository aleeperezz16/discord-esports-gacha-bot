import { Client, Collection, GatewayIntentBits, Events } from 'discord.js';
import { ExtendedClient, Command } from './types';
import * as roll       from './commands/roll';
import * as collection from './commands/collection';
import * as ranking    from './commands/ranking';
import * as configurar from './commands/configurar';
import { guildConfigRepository } from './database/guildConfig';
import { config } from './config';

const COMMANDS: Command[] = [
  { data: roll.data,       execute: roll.execute },
  { data: collection.data, execute: collection.execute },
  { data: ranking.data,    execute: ranking.execute },
  { data: configurar.data, execute: configurar.execute },
];

const PREFIX_COMMANDS: Record<string, (msg: Parameters<typeof roll.executeFromMessage>[0]) => Promise<void>> = {
  [config.commands.roll.name]:       roll.executeFromMessage,
  [config.commands.collection.name]: collection.executeFromMessage,
  [config.commands.ranking.name]:    ranking.executeFromMessage,
};

export function createBot(): ExtendedClient {
  // GuildMessages + MessageContent are always requested so per-guild prefix works
  // without a restart. MessageContent is a privileged intent — enable it once in
  // Discord Developer Portal → Bot → Privileged Gateway Intents.
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  }) as ExtendedClient;

  client.commands = new Collection<string, Command>();
  for (const cmd of COMMANDS) {
    client.commands.set(cmd.data.name, cmd);
  }

  // ── Ready ──────────────────────────────────────────────────────────────────

  client.once(Events.ClientReady, c => {
    console.log(`✅ Bot listo como ${c.user.tag} — ${c.guilds.cache.size} servidor(es)`);
  });

  // ── Slash commands ─────────────────────────────────────────────────────────

  client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (err) {
      console.error(`Error en /${interaction.commandName}:`, err);
      const msg = { content: '❌ Ocurrió un error al ejecutar este comando.', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(msg);
      } else {
        await interaction.reply(msg);
      }
    }
  });

  // ── Prefix commands ────────────────────────────────────────────────────────

  client.on(Events.MessageCreate, async message => {
    if (message.author.bot || !message.guildId) return;

    const guildCfg = await guildConfigRepository.get(message.guildId);
    if (!guildCfg.prefix_enabled) return;
    if (!message.content.startsWith(guildCfg.prefix_char)) return;

    const commandName = message.content
      .slice(guildCfg.prefix_char.length)
      .trim()
      .split(/\s+/)[0]
      ?.toLowerCase();

    if (!commandName) return;

    const handler = PREFIX_COMMANDS[commandName];
    if (!handler) return;

    try {
      await handler(message);
    } catch (err) {
      console.error(`Error en ${guildCfg.prefix_char}${commandName}:`, err);
      await message.reply('❌ Ocurrió un error al ejecutar este comando.').catch(() => undefined);
    }
  });

  return client;
}
