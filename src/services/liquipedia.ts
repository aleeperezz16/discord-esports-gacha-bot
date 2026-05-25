// Liquipedia API v3 — requires a free API key
// Register at: https://api.liquipedia.net
// Docs: https://api.liquipedia.net/documentation/api/v3/player
// Rate limit: 60 req/min per key

const BASE_URL = 'https://api.liquipedia.net/api/v3';
const API_KEY  = process.env.LIQUIPEDIA_API_KEY ?? '';

export const GAME_WIKIS: Record<string, string> = {
  'CS2':               'counterstrike',
  'League of Legends': 'leagueoflegends',
  'Valorant':          'valorant',
  'Dota 2':            'dota2',
  'Rocket League':     'rocketleague',
  'Fortnite':          'fortnite',
  'Overwatch 2':       'overwatch',
};

const DEFAULT_ROLES: Record<string, string[]> = {
  'CS2':               ['Rifler', 'AWPer', 'IGL', 'Support', 'Entry'],
  'League of Legends': ['Top', 'Jungle', 'Mid', 'ADC', 'Support'],
  'Valorant':          ['Duelist', 'Controller', 'Sentinel', 'Initiator'],
  'Dota 2':            ['Carry', 'Mid', 'Offlaner', 'Soft Support', 'Hard Support'],
  'Rocket League':     ['Striker', 'Midfielder', 'Defender'],
  'Fortnite':          ['Solo', 'Duos'],
  'Overwatch 2':       ['Tank', 'Support', 'DPS'],
};

interface ApiPlayer {
  pagename?: string;
  id?:       string;
  name?:     string;
  team?:     string | { name?: string };
  country?:  string;
  earnings?: number;
  extradata?: { role?: string };
  type?:     string;
}

export interface FetchedPlayer {
  id:          string;
  name:        string;
  team:        string;
  game:        string;
  role:        string;
  nationality: string;
  earnings:    number;
}

function pickRole(gameName: string, pageName: string, fromApi?: string): string {
  if (fromApi?.trim()) return fromApi.trim();
  const roles = DEFAULT_ROLES[gameName] ?? ['Pro Player'];
  const hash   = [...pageName].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return roles[hash % roles.length];
}

function resolveTeam(raw: ApiPlayer['team']): string {
  if (!raw) return 'Free Agent';
  if (typeof raw === 'string') return raw || 'Free Agent';
  return raw.name || 'Free Agent';
}

async function fetchPage(wiki: string, limit: number, offset: number): Promise<ApiPlayer[]> {
  const params = new URLSearchParams({
    wiki,
    conditions: '[[status::Active]]',
    order:      'earnings desc',
    limit:      String(limit),
    offset:     String(offset),
  });

  const res = await fetch(`${BASE_URL}/player?${params}`, {
    headers: {
      Authorization:     `Liquipedia ${API_KEY}`,
      'Accept':          'application/json',
      'Accept-Encoding': 'gzip',
    },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status} — ${await res.text()}`);
  const data = await res.json() as { result?: ApiPlayer[] };
  return data.result ?? [];
}

export async function fetchPlayersForGame(gameName: string, maxPlayers = 100): Promise<FetchedPlayer[]> {
  if (!API_KEY) throw new Error('LIQUIPEDIA_API_KEY no configurada');

  const wiki    = GAME_WIKIS[gameName];
  const results: FetchedPlayer[] = [];
  const batchSize = Math.min(maxPlayers, 1000);
  let offset = 0;

  while (results.length < maxPlayers) {
    const batch = await fetchPage(wiki, batchSize, offset);
    if (batch.length === 0) break;

    for (const p of batch) {
      const pageName = p.pagename ?? p.id ?? '';
      const handle   = p.id || pageName;
      if (!handle) continue;

      results.push({
        id:          `${wiki}:${pageName}`,
        name:        handle,
        team:        resolveTeam(p.team),
        game:        gameName,
        role:        pickRole(gameName, pageName, p.extradata?.role),
        nationality: p.country || 'Unknown',
        earnings:    Math.round(p.earnings ?? 0),
      });
    }

    if (batch.length < batchSize) break;
    offset += batchSize;
  }

  return results.slice(0, maxPlayers);
}
