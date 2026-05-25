import { Client, Collection, GatewayIntentBits, Events } from 'discord.js';
import { ExtendedClient, Command } from './types';
import * as roll       from './commands/roll';
import * as collection from './commands/collection';
import * as ranking    from './commands/ranking';

const COMMANDS: Command[] = [
  { data: roll.data,       execute: roll.execute },
  { data: collection.data, execute: collection.execute },
  { data: ranking.data,    execute: ranking.execute },
];

export function createBot(): ExtendedClient {
  const client = new Client({ intents: [GatewayIntentBits.Guilds] }) as ExtendedClient;
  client.commands = new Collection<string, Command>();

  for (const cmd of COMMANDS) {
    client.commands.set(cmd.data.name, cmd);
  }

  client.once(Events.ClientReady, c => {
    console.log(`✅ Bot listo como ${c.user.tag} — ${c.guilds.cache.size} servidor(es)`);
  });

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

  return client;
}
