import { GAME_WIKIS, fetchPlayersForGame } from './liquipedia';
import { playerRepository } from '../database/queries';
import { players as hardcodedPlayers } from '../data/players';
import { Rarity } from '../data/players';

const EARNINGS_THRESHOLDS: [number, Rarity][] = [
  [500_000, 'legendary'],
  [50_000,  'epic'],
  [5_000,   'rare'],
];

function assignRarity(earnings: number): Rarity {
  for (const [threshold, rarity] of EARNINGS_THRESHOLDS) {
    if (earnings >= threshold) return rarity;
  }
  return 'common';
}

async function seedFromHardcoded(): Promise<void> {
  const count = await playerRepository.countPlayers();
  if (count > 0) return;

  console.log('🌱 Sembrando roster inicial en la base de datos…');
  for (const p of hardcodedPlayers) {
    await playerRepository.upsertPlayer({
      id:             p.id,
      name:           p.name,
      team:           p.team,
      game:           p.game,
      role:           p.role,
      nationality:    p.nationality,
      rarity:         p.rarity,
      earnings:       0,
      last_synced_at: Date.now(),
    });
  }
  console.log(`✅ ${hardcodedPlayers.length} jugadores sembrados`);
}

export async function syncFromLiquipedia(): Promise<void> {
  if (!process.env.LIQUIPEDIA_API_KEY) {
    console.warn('⚠️  LIQUIPEDIA_API_KEY no configurada — usando roster inicial como fallback');
    await seedFromHardcoded();
    return;
  }

  console.log('🔄 Sincronizando jugadores desde Liquipedia…');
  let total = 0;

  for (const gameName of Object.keys(GAME_WIKIS)) {
    try {
      process.stdout.write(`  ↳ ${gameName}… `);
      const fetched = await fetchPlayersForGame(gameName);

      for (const p of fetched) {
        await playerRepository.upsertPlayer({
          ...p,
          rarity:         assignRarity(p.earnings),
          last_synced_at: Date.now(),
        });
        total++;
      }

      console.log(`${fetched.length} jugadores`);
    } catch (err) {
      console.error(`error: ${(err as Error).message}`);
    }
  }

  if (total === 0) {
    console.warn('⚠️  Sin datos de Liquipedia — usando roster inicial como fallback');
    await seedFromHardcoded();
  } else {
    console.log(`✅ Sincronización completada — ${total} jugadores actualizados`);
  }
}

const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;

export function scheduleDailySync(): void {
  setInterval(() => {
    void syncFromLiquipedia().catch(err =>
      console.error('❌ Error en sync automático:', err),
    );
  }, SYNC_INTERVAL_MS);
}
