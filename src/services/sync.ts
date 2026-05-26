import * as pandascore from './pandascore';
import { playerRepository } from '../database/queries';
import { players as hardcodedPlayers } from '../data/players';
import { config } from '../config';
import { Rarity } from '../data/players';

// Deterministic by ID hash — same player always maps to the same rarity so
// re-syncs don't change rarity after a player has already been claimed.
function assignRarityByHash(id: string): Rarity {
  const hash    = [...id].reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) >>> 0, 0);
  const entries = Object.entries(config.rarityWeights) as [Rarity, number][];
  const total   = entries.reduce((sum, [, w]) => sum + w, 0);
  let   bucket  = hash % total;
  for (const [rarity, weight] of entries) {
    if (bucket < weight) return rarity;
    bucket -= weight;
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
      image_url:      '',
      last_synced_at: Date.now(),
    });
  }
  console.log(`✅ ${hardcodedPlayers.length} jugadores sembrados`);
}

export async function syncPlayers(): Promise<void> {
  if (!process.env.PANDASCORE_API_KEY) {
    console.warn('⚠️  PANDASCORE_API_KEY no configurada — usando roster inicial como fallback');
    await seedFromHardcoded();
    return;
  }

  console.log('🔄 Sincronizando jugadores desde PandaScore…');
  let total = 0;

  for (const gameName of Object.keys(pandascore.GAME_SLUGS)) {
    try {
      process.stdout.write(`  ↳ ${gameName}… `);
      const fetched = await pandascore.fetchPlayersForGame(gameName, config.sync.maxPlayersPerGame);

      for (const p of fetched) {
        await playerRepository.upsertPlayer({
          ...p,
          rarity:         assignRarityByHash(p.id),
          last_synced_at: Date.now(),
        });
        total++;
      }

      console.log(`${fetched.length} jugadores`);
    } catch (err) {
      console.error(`error: ${(err as Error).message}`);
    }
  }

  if (total > 0) {
    console.log(`✅ Sincronización completada — ${total} jugadores actualizados`);
  } else {
    console.warn('⚠️  Sin datos de PandaScore — usando roster inicial como fallback');
    await seedFromHardcoded();
  }
}

export function scheduleDailySync(): void {
  setInterval(() => {
    void syncPlayers().catch(err =>
      console.error('❌ Error en sync automático:', err),
    );
  }, config.sync.intervalMs);
}
