// PandaScore API v2 — requires a free API key
// Register at: https://pandascore.co
// Docs: https://developers.pandascore.co/docs
// Free tier: 500 req/hour

const BASE_URL = 'https://api.pandascore.co';
const API_KEY  = process.env.PANDASCORE_API_KEY ?? '';

// PandaScore route slugs — used as /{slug}/players
// Verified against https://api.pandascore.co/videogames
export const GAME_SLUGS: Record<string, string> = {
  'CS2':               'csgo',
  'League of Legends': 'lol',
  'Valorant':          'valorant',
  'Dota 2':            'dota2',
  'Rocket League':     'rl',
  'Overwatch 2':       'ow',
};

const DEFAULT_ROLES: Record<string, string[]> = {
  'CS2':               ['Rifler', 'AWPer', 'IGL', 'Support', 'Entry'],
  'League of Legends': ['Top', 'Jungle', 'Mid', 'ADC', 'Support'],
  'Valorant':          ['Duelist', 'Controller', 'Sentinel', 'Initiator'],
  'Dota 2':            ['Carry', 'Mid', 'Offlaner', 'Soft Support', 'Hard Support'],
  'Rocket League':     ['Striker', 'Midfielder', 'Defender'],
  'Overwatch 2':       ['Tank', 'Support', 'DPS'],
};

interface PandaPlayer {
  id:            number;
  name:          string;
  nationality?:  string;
  role?:         string | null;
  current_team?: { name: string } | null;
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

function pickRole(gameName: string, handle: string, fromApi?: string | null): string {
  if (fromApi?.trim()) {
    const r = fromApi.trim();
    return r.charAt(0).toUpperCase() + r.slice(1);
  }
  const roles = DEFAULT_ROLES[gameName] ?? ['Pro Player'];
  const hash   = [...handle].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return roles[hash % roles.length];
}

async function fetchPage(slug: string, pageSize: number, pageNum: number): Promise<PandaPlayer[]> {
  const params = new URLSearchParams({
    'page[size]':   String(pageSize),
    'page[number]': String(pageNum),
  });

  const res = await fetch(`${BASE_URL}/${slug}/players?${params}`, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      Accept:        'application/json',
    },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status} — ${await res.text()}`);
  return await res.json() as PandaPlayer[];
}

export async function fetchPlayersForGame(gameName: string, maxPlayers = 100): Promise<FetchedPlayer[]> {
  if (!API_KEY) throw new Error('PANDASCORE_API_KEY no configurada');

  const slug      = GAME_SLUGS[gameName];
  const results:  FetchedPlayer[] = [];
  const pageSize  = Math.min(maxPlayers, 100); // PandaScore max page size is 100
  let   pageNum   = 1;

  while (results.length < maxPlayers) {
    const batch = await fetchPage(slug, pageSize, pageNum);
    if (batch.length === 0) break;

    for (const p of batch) {
      if (!p.name) continue;

      results.push({
        id:          `pandascore:${p.id}`,
        name:        p.name,
        team:        p.current_team?.name ?? 'Free Agent',
        game:        gameName,
        role:        pickRole(gameName, p.name, p.role),
        nationality: p.nationality ?? 'Unknown',
        earnings:    0, // PandaScore doesn't expose earnings data
      });
    }

    if (batch.length < pageSize) break;
    pageNum++;
  }

  return results.slice(0, maxPlayers);
}
