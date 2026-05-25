import { Client, Collection, GatewayIntentBits, Events } from 'discord.js';
import { ExtendedClient, Command } from './types';
import * as roll       from './commands/roll';
import * as collection from './commands/collection';
import * as ranking    from './commands/ranking';
import { config } from './config';

const COMMANDS: Command[] = [
  { data: roll.data,       execute: roll.execute },
  { data: collection.data, execute: collection.execute },
  { data: ranking.data,    execute: ranking.execute },
];

export function createBot(): ExtendedClient {
  const intents = [GatewayIntentBits.Guilds];

  // MessageContent is a privileged intent — only enable it when prefix is active.
  // Requires "Message Content Intent" toggled ON in Discord Developer Portal → Bot.
  if (config.prefix.enabled) {
    intents.push(GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent);
  }

  const client = new Client({ intents }) as ExtendedClient;
  client.commands = new Collection<string, Command>();

  for (const cmd of COMMANDS) {
    client.commands.set(cmd.data.name, cmd);
  }

  // ── Ready ──────────────────────────────────────────────────────────────────

  client.once(Events.ClientReady, c => {
    const prefixInfo = config.prefix.enabled ? ` · Prefijo: "${config.prefix.char}"` : '';
    console.log(`✅ Bot listo como ${c.user.tag} — ${c.guilds.cache.size} servidor(es)${prefixInfo}`);
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

  if (config.prefix.enabled) {
    const PREFIX_COMMANDS: Record<string, (msg: Parameters<typeof roll.executeFromMessage>[0]) => Promise<void>> = {
      [config.commands.roll.name]:       roll.executeFromMessage,
      [config.commands.collection.name]: collection.executeFromMessage,
      [config.commands.ranking.name]:    ranking.executeFromMessage,
    };

    client.on(Events.MessageCreate, async message => {
      if (message.author.bot) return;
      if (!message.content.startsWith(config.prefix.char)) return;

      const commandName = message.content
        .slice(config.prefix.char.length)
        .trim()
        .split(/\s+/)[0]
        ?.toLowerCase();

      if (!commandName) return;

      const handler = PREFIX_COMMANDS[commandName];
      if (!handler) return;

      try {
        await handler(message);
      } catch (err) {
        console.error(`Error en ${config.prefix.char}${commandName}:`, err);
        await message.reply('❌ Ocurrió un error al ejecutar este comando.').catch(() => undefined);
      }
    });
  }

  return client;
}
