import { Player, Rarity } from '../data/players';

const RARITY_WEIGHTS: Record<Rarity, number> = {
  legendary: 5,
  epic: 20,
  rare: 35,
  common: 40,
};

export function rollPlayer(availablePlayers: Player[]): Player {
  const byRarity: Record<Rarity, Player[]> = {
    legendary: availablePlayers.filter(p => p.rarity === 'legendary'),
    epic:      availablePlayers.filter(p => p.rarity === 'epic'),
    rare:      availablePlayers.filter(p => p.rarity === 'rare'),
    common:    availablePlayers.filter(p => p.rarity === 'common'),
  };

  const weights = (Object.keys(RARITY_WEIGHTS) as Rarity[]).map(r => ({
    rarity: r,
    weight: byRarity[r].length > 0 ? RARITY_WEIGHTS[r] : 0,
  }));

  const total = weights.reduce((s, w) => s + w.weight, 0);
  let rand = Math.random() * total;

  let chosenRarity: Rarity = 'common';
  for (const { rarity, weight } of weights) {
    rand -= weight;
    if (rand <= 0) { chosenRarity = rarity; break; }
  }

  const pool = byRarity[chosenRarity];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function rarityColor(rarity: Rarity): number {
  return { legendary: 0xFFD700, epic: 0x9B59B6, rare: 0x3498DB, common: 0x95A5A6 }[rarity];
}

export function rarityStars(rarity: Rarity): string {
  return { legendary: '⭐⭐⭐⭐⭐', epic: '⭐⭐⭐⭐', rare: '⭐⭐⭐', common: '⭐⭐' }[rarity];
}

export function rarityLabel(rarity: Rarity): string {
  return { legendary: '🟡 Legendario', epic: '🟣 Épico', rare: '🔵 Raro', common: '⚪ Común' }[rarity];
}
