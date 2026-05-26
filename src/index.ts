import 'dotenv/config';
import { createBot } from './bot';
import { initDb } from './database/pool';
import { syncPlayers, scheduleDailySync } from './services/sync';

async function main(): Promise<void> {
  const token = process.env.DISCORD_TOKEN;
  if (!token) throw new Error('DISCORD_TOKEN no está definido en las variables de entorno');

  await initDb();
  console.log('✅ Base de datos inicializada');

  await syncPlayers();
  scheduleDailySync();

  const client = createBot();
  await client.login(token);
}

main().catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
