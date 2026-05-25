import pool from './pool';
import { config } from '../config';

export interface GuildConfig {
  guild_id:             string;
  prefix_enabled:       boolean;
  prefix_char:          string;
  max_rolls_per_hour:   number;
  max_claims_per_hour:  number;
}

// In-memory cache — invalidated on every write, populated on first read per guild.
const cache = new Map<string, GuildConfig>();

function defaults(guildId: string): GuildConfig {
  return {
    guild_id:            guildId,
    prefix_enabled:      false,
    prefix_char:         '!',
    max_rolls_per_hour:  config.rolls.maxPerHour,
    max_claims_per_hour: config.claims.maxPerHour,
  };
}

export const guildConfigRepository = {
  async get(guildId: string): Promise<GuildConfig> {
    if (cache.has(guildId)) return cache.get(guildId)!;

    const { rows } = await pool.query<GuildConfig>(
      'SELECT * FROM guild_config WHERE guild_id = $1',
      [guildId],
    );

    const cfg = rows[0] ?? defaults(guildId);
    cache.set(guildId, cfg);
    return cfg;
  },

  async set(guildId: string, patch: Partial<Omit<GuildConfig, 'guild_id'>>): Promise<GuildConfig> {
    const current = await this.get(guildId);
    const updated = { ...current, ...patch };

    await pool.query(`
      INSERT INTO guild_config (guild_id, prefix_enabled, prefix_char, max_rolls_per_hour, max_claims_per_hour)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (guild_id) DO UPDATE SET
        prefix_enabled      = EXCLUDED.prefix_enabled,
        prefix_char         = EXCLUDED.prefix_char,
        max_rolls_per_hour  = EXCLUDED.max_rolls_per_hour,
        max_claims_per_hour = EXCLUDED.max_claims_per_hour
    `, [updated.guild_id, updated.prefix_enabled, updated.prefix_char, updated.max_rolls_per_hour, updated.max_claims_per_hour]);

    cache.set(guildId, updated);
    return updated;
  },
};
