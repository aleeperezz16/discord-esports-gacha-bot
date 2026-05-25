import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import * as roll       from './commands/roll';
import * as collection from './commands/collection';
import * as ranking    from './commands/ranking';

const token    = process.env.DISCORD_TOKEN!;
const clientId = process.env.CLIENT_ID!;
const guildId  = process.env.GUILD_ID;

if (!token || !clientId) {
  console.error('❌ DISCORD_TOKEN y CLIENT_ID son requeridos');
  process.exit(1);
}

const commands = [roll.data, collection.data, ranking.data].map(c => c.toJSON());
const rest     = new REST().setToken(token);

(async () => {
  console.log(`🔄 Registrando ${commands.length} comandos…`);
  if (guildId) {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
    console.log(`✅ Comandos registrados en el servidor ${guildId} (instantáneo)`);
  } else {
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log('✅ Comandos registrados globalmente (puede tardar hasta 1 hora en propagarse)');
  }
})().catch(err => {
  console.error('❌ Error registrando comandos:', err);
  process.exit(1);
});
