import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS roll_history (
      id         SERIAL PRIMARY KEY,
      user_id    VARCHAR(20) NOT NULL,
      guild_id   VARCHAR(20) NOT NULL,
      rolled_at  BIGINT      NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS player_claims (
      id         SERIAL PRIMARY KEY,
      player_id  VARCHAR(100) NOT NULL,
      guild_id   VARCHAR(20)  NOT NULL,
      user_id    VARCHAR(20)  NOT NULL,
      claimed_at BIGINT       NOT NULL,
      UNIQUE (player_id, guild_id)
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_roll_user_guild_time
    ON roll_history (user_id, guild_id, rolled_at)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_claims_user_guild
    ON player_claims (user_id, guild_id)
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS players (
      id             VARCHAR(200) PRIMARY KEY,
      name           VARCHAR(100) NOT NULL,
      team           VARCHAR(100) NOT NULL DEFAULT 'Free Agent',
      game           VARCHAR(50)  NOT NULL,
      role           VARCHAR(50)  NOT NULL DEFAULT 'Pro Player',
      nationality    VARCHAR(100) NOT NULL DEFAULT 'Unknown',
      rarity         VARCHAR(20)  NOT NULL DEFAULT 'common',
      earnings       INTEGER      NOT NULL DEFAULT 0,
      last_synced_at BIGINT       NOT NULL
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_players_game
    ON players (game)
  `);

  // Widen player_id to support Liquipedia IDs (wiki:pagename format)
  await pool.query(`
    ALTER TABLE player_claims ALTER COLUMN player_id TYPE VARCHAR(200)
  `);
}

export default pool;
