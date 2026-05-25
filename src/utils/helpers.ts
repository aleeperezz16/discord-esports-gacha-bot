import { Player, Rarity } from '../data/players';
import { config } from '../config';

export function rollPlayer(availablePlayers: Player[]): Player {
  const byRarity: Record<Rarity, Player[]> = {
    legendary: availablePlayers.filter(p => p.rarity === 'legendary'),
    epic:      availablePlayers.filter(p => p.rarity === 'epic'),
    rare:      availablePlayers.filter(p => p.rarity === 'rare'),
    common:    availablePlayers.filter(p => p.rarity === 'common'),
  };

  const weights = (Object.keys(config.rarityWeights) as Rarity[]).map(r => ({
    rarity: r,
    weight: byRarity[r].length > 0 ? config.rarityWeights[r] : 0,
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

export function rarityColor(rarity: Rarity): number  { return config.rarityColors[rarity]; }
export function rarityStars(rarity: Rarity): string  { return config.rarityStars[rarity]; }
export function rarityLabel(rarity: Rarity): string  { return config.rarityLabels[rarity]; }
