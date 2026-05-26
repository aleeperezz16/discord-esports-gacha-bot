import pool from './pool';
import { Player, Rarity } from '../data/players';
import { config } from '../config';

export interface DbPlayer {
  id:             string;
  name:           string;
  team:           string;
  game:           string;
  role:           string;
  nationality:    string;
  rarity:         Rarity;
  earnings:       number;
  image_url:      string;
  last_synced_at: number;
}

export interface ClaimedPlayer {
  player_id:   string;
  claimed_at:  string;
  name:        string | null;
  team:        string | null;
  game:        string | null;
  role:        string | null;
  nationality: string | null;
  rarity:      Rarity | null;
}

export interface GuildPlayer {
  id:         string;
  name:       string;
  team:       string;
  game:       string;
  role:       string;
  rarity:     Rarity;
  claimed_by: string | null;
}

export const playerRepository = {
  async getAvailablePlayers(guildId: string): Promise<Player[]> {
    const { rows } = await pool.query<Player>(`
      SELECT id, name, team, game, role, nationality, rarity, image_url
      FROM players
      WHERE id NOT IN (
        SELECT player_id FROM player_claims WHERE guild_id = $1
      )
    `, [guildId]);
    return rows;
  },

  async upsertPlayer(p: DbPlayer): Promise<void> {
    await pool.query(`
      INSERT INTO players (id, name, team, game, role, nationality, rarity, earnings, image_url, last_synced_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE SET
        name           = EXCLUDED.name,
        team           = EXCLUDED.team,
        game           = EXCLUDED.game,
        role           = EXCLUDED.role,
        nationality    = EXCLUDED.nationality,
        rarity         = EXCLUDED.rarity,
        earnings       = EXCLUDED.earnings,
        image_url      = EXCLUDED.image_url,
        last_synced_at = EXCLUDED.last_synced_at
    `, [p.id, p.name, p.team, p.game, p.role, p.nationality, p.rarity, p.earnings, p.image_url, p.last_synced_at]);
  },

  async countPlayers(): Promise<number> {
    const { rows } = await pool.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM players');
    return parseInt(rows[0].count, 10);
  },

  async getGuildPlayerList(guildId: string, game: string | null): Promise<GuildPlayer[]> {
    const { rows } = await pool.query<GuildPlayer>(`
      SELECT p.id, p.name, p.team, p.game, p.role, p.rarity,
             pc.user_id AS claimed_by
      FROM players p
      LEFT JOIN player_claims pc ON pc.player_id = p.id AND pc.guild_id = $1
      WHERE ($2::text IS NULL OR p.game = $2)
      ORDER BY
        CASE p.rarity WHEN 'legendary' THEN 1 WHEN 'epic' THEN 2 WHEN 'rare' THEN 3 ELSE 4 END,
        p.name ASC
    `, [guildId, game]);
    return rows;
  },
};

export const rollRepository = {
  async countRecentRolls(userId: string, guildId: string): Promise<number> {
    const since = Date.now() - config.rolls.windowMs;
    const { rows } = await pool.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM roll_history WHERE user_id=$1 AND guild_id=$2 AND rolled_at>$3',
      [userId, guildId, since],
    );
    return parseInt(rows[0].count, 10);
  },

  async addRoll(userId: string, guildId: string): Promise<void> {
    await pool.query(
      'INSERT INTO roll_history (user_id, guild_id, rolled_at) VALUES ($1, $2, $3)',
      [userId, guildId, Date.now()],
    );
  },

  async getNextResetTime(userId: string, guildId: string): Promise<number> {
    const since = Date.now() - config.rolls.windowMs;
    const { rows } = await pool.query<{ rolled_at: string }>(
      'SELECT rolled_at FROM roll_history WHERE user_id=$1 AND guild_id=$2 AND rolled_at>$3 ORDER BY rolled_at ASC LIMIT 1',
      [userId, guildId, since],
    );
    return rows[0] ? Number(rows[0].rolled_at) + config.rolls.windowMs : Date.now();
  },
};

export const claimRepository = {
  async countRecentClaims(userId: string, guildId: string): Promise<number> {
    const since = Date.now() - config.claims.windowMs;
    const { rows } = await pool.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM player_claims WHERE user_id=$1 AND guild_id=$2 AND claimed_at>$3',
      [userId, guildId, since],
    );
    return parseInt(rows[0].count, 10);
  },

  async getNextClaimResetTime(userId: string, guildId: string): Promise<number> {
    const since = Date.now() - config.claims.windowMs;
    const { rows } = await pool.query<{ claimed_at: string }>(
      'SELECT claimed_at FROM player_claims WHERE user_id=$1 AND guild_id=$2 AND claimed_at>$3 ORDER BY claimed_at ASC LIMIT 1',
      [userId, guildId, since],
    );
    return rows[0] ? Number(rows[0].claimed_at) + config.claims.windowMs : Date.now();
  },

  async claimPlayer(playerId: string, guildId: string, userId: string): Promise<boolean> {
    try {
      await pool.query(
        'INSERT INTO player_claims (player_id, guild_id, user_id, claimed_at) VALUES ($1, $2, $3, $4)',
        [playerId, guildId, userId, Date.now()],
      );
      return true;
    } catch {
      return false; // unique constraint → ya reclamado
    }
  },

  async getUserCollection(userId: string, guildId: string): Promise<ClaimedPlayer[]> {
    const { rows } = await pool.query<ClaimedPlayer>(`
      SELECT pc.player_id, pc.claimed_at,
             p.name, p.team, p.game, p.role, p.nationality, p.rarity
      FROM player_claims pc
      LEFT JOIN players p ON p.id = pc.player_id
      WHERE pc.user_id = $1 AND pc.guild_id = $2
      ORDER BY pc.claimed_at DESC
    `, [userId, guildId]);
    return rows;
  },

  async getServerRanking(guildId: string): Promise<{ user_id: string; count: number }[]> {
    const { rows } = await pool.query<{ user_id: string; count: string }>(
      'SELECT user_id, COUNT(*)::text AS count FROM player_claims WHERE guild_id=$1 GROUP BY user_id ORDER BY count DESC LIMIT 10',
      [guildId],
    );
    return rows.map(r => ({ user_id: r.user_id, count: parseInt(r.count, 10) }));
  },
};

export const adminRepository = {
  async getStats(guildId: string): Promise<{ players: number; withImages: number; claims: number; rolls: number }> {
    const [p, img, c, r] = await Promise.all([
      pool.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM players'),
      pool.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM players WHERE image_url IS NOT NULL AND image_url != ''`),
      pool.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM player_claims WHERE guild_id = $1', [guildId]),
      pool.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM roll_history WHERE guild_id = $1', [guildId]),
    ]);
    return {
      players:    parseInt(p.rows[0].count,   10),
      withImages: parseInt(img.rows[0].count, 10),
      claims:     parseInt(c.rows[0].count,   10),
      rolls:      parseInt(r.rows[0].count,   10),
    };
  },

  async getSampleImages(limit = 3): Promise<{ name: string; image_url: string }[]> {
    const { rows } = await pool.query<{ name: string; image_url: string }>(
      `SELECT name, image_url FROM players WHERE image_url IS NOT NULL AND image_url != '' LIMIT $1`,
      [limit],
    );
    return rows;
  },

  async resetClaims(guildId: string): Promise<number> {
    const { rowCount } = await pool.query('DELETE FROM player_claims WHERE guild_id = $1', [guildId]);
    return rowCount ?? 0;
  },

  async resetRolls(guildId: string): Promise<number> {
    const { rowCount } = await pool.query('DELETE FROM roll_history WHERE guild_id = $1', [guildId]);
    return rowCount ?? 0;
  },

  async resetPlayers(): Promise<number> {
    await pool.query('DELETE FROM player_claims');
    await pool.query('DELETE FROM roll_history');
    const { rowCount } = await pool.query('DELETE FROM players');
    return rowCount ?? 0;
  },
};
