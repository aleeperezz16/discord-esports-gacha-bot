import type { Rarity } from './data/players';

export const config = {
  // ── Rate limits ──────────────────────────────────────────────────────────────

  rolls: {
    maxPerHour:    10,              // Tiradas máximas permitidas por hora por usuario/servidor
    windowMs:      60 * 60 * 1000, // Duración de la ventana del rate limit (ms)
    claimWindowMs: 60_000,         // Tiempo que el botón "Reclamar" permanece activo (ms)
  },

  claims: {
    maxPerHour: 1,               // Reclamos máximos permitidos por hora por usuario/servidor
    windowMs:   60 * 60 * 1000, // Duración de la ventana del rate limit (ms)
  },

  // ── Colección ────────────────────────────────────────────────────────────────

  collection: {
    pageSize:            8,       // Jugadores por página en el comando colección
    paginationTimeoutMs: 120_000, // Tiempo que los botones de paginación permanecen activos (ms)
  },

  list: {
    pageSize: 15, // Jugadores por página en el comando lista
  },

  // ── Rareza ───────────────────────────────────────────────────────────────────

  rarityWeights: {
    legendary: 5,   // % relativo de probabilidad al tirar
    epic:      20,
    rare:      35,
    common:    40,
  } as Record<Rarity, number>,

  rarityColors: {
    legendary: 0xFFD700,
    epic:      0x9B59B6,
    rare:      0x3498DB,
    common:    0x95A5A6,
  } as Record<Rarity, number>,

  rarityStars: {
    legendary: '⭐⭐⭐⭐⭐',
    epic:      '⭐⭐⭐⭐',
    rare:      '⭐⭐⭐',
    common:    '⭐⭐',
  } as Record<Rarity, string>,

  rarityLabels: {
    legendary: '🟡 Legendario',
    epic:      '🟣 Épico',
    rare:      '🔵 Raro',
    common:    '⚪ Común',
  } as Record<Rarity, string>,

  // Umbrales de ganancias (USD) para asignar rareza al sincronizar desde Liquipedia
  earningsThresholds: [
    [500_000, 'legendary'],
    [50_000,  'epic'],
    [5_000,   'rare'],
    // Por debajo de 5 000 → common
  ] as [number, Rarity][],

  // ── Sincronización Liquipedia ─────────────────────────────────────────────

  sync: {
    intervalMs:        24 * 60 * 60 * 1000, // Intervalo entre sincronizaciones automáticas (ms)
    maxPlayersPerGame: 500,                  // Máximo de jugadores traídos por juego
  },

  // ── Nombres y descripciones de comandos ─────────────────────────────────────
  // Cambiar el nombre requiere volver a ejecutar `yarn deploy`.

  commands: {
    roll:       { name: 'roll',      description: '¡Tira para obtener un jugador de Esports aleatorio!' },
    collection: { name: 'coleccion', description: 'Muestra tu colección de jugadores o la de otro usuario.' },
    ranking:    { name: 'ranking',   description: 'Muestra el ranking de coleccionistas del servidor.' },
    lista:      { name: 'lista',     description: 'Lista todos los jugadores disponibles en el servidor.' },
    admin:      { name: 'admin',     description: '[DEV] Comandos de mantenimiento de la base de datos.' },
  },
};
