# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn                 # Install dependencies
yarn dev             # Run with ts-node (development)
yarn build           # Compile TypeScript → dist/
yarn start           # Run compiled build
yarn deploy          # Register slash commands with Discord API
```

Before first run, copy `.env.example` to `.env` and fill in credentials. Start PostgreSQL with `docker compose up -d`.

## Architecture

**Entry flow**: `src/index.ts` → initializes PostgreSQL tables (`initDb`) → creates the Discord client (`createBot`) → logs in.

**Command system**: Each file in `src/commands/` exports `data` (SlashCommandBuilder) and `execute`. They are registered manually in `src/bot.ts` inside the `COMMANDS` array — adding a new command requires both creating the file and adding it there, then re-running `npm run deploy`.

**Database** (`src/database/`):
- `pool.ts` — PostgreSQL pool + `initDb()` which creates tables/indexes on startup (idempotent `CREATE IF NOT EXISTS`).
- `queries.ts` — all SQL via two repository objects: `rollRepository` (roll history, rate limiting) and `claimRepository` (player ownership, collections, ranking).

**Game logic**:
- `src/data/players.ts` — static player roster (~85 players across CS2, LoL, Valorant, Dota 2, Rocket League, Fortnite, OW2) with four rarities: `legendary | epic | rare | common`.
- `src/utils/helpers.ts` — `rollPlayer()` first picks a rarity tier by weight (legendary 5 / epic 20 / rare 35 / common 40), then picks uniformly within that tier. Also exports display helpers (`rarityColor`, `rarityStars`, `rarityLabel`).

**`/tirar` mechanic** (`src/commands/roll.ts`):
1. Check rate limit (10 rolls/hour per user per guild via `roll_history` table).
2. Exclude already-claimed players for this guild.
3. Roll a player, register the roll, reply with an embed + "¡Reclamar!" button.
4. A 60-second `MessageComponentCollector` listens for button clicks; only the roller can claim (others get an ephemeral error). Collector stops on claim or timeout, updating the embed accordingly.

**DB schema**:
- `roll_history (id, user_id, guild_id, rolled_at BIGINT)` — timestamps stored as Unix ms.
- `player_claims (id, player_id, guild_id, user_id, claimed_at BIGINT)` — UNIQUE on `(player_id, guild_id)` prevents double-claiming at DB level.

## Adding players

Append entries to the `players` array in `src/data/players.ts`. The `id` field must be globally unique (used as the DB key). No migration needed — the static array is the source of truth.
