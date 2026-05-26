export type Rarity = 'legendary' | 'epic' | 'rare' | 'common';

export interface Player {
  id:          string;
  name:        string;
  team:        string;
  game:        string;
  role:        string;
  rarity:      Rarity;
  nationality: string;
  image_url?:  string;
}

export const players: Player[] = [
  // ── LEGENDARY ──────────────────────────────────────────────────────────────
  // CS2
  { id: 's1mple',    name: 's1mple',    team: 'NAVI',              game: 'CS2',                  role: 'AWPer',        rarity: 'legendary', nationality: '🇺🇦 Ucraniano'      },
  { id: 'zywoo',     name: 'ZywOo',     team: 'Team Vitality',     game: 'CS2',                  role: 'AWPer',        rarity: 'legendary', nationality: '🇫🇷 Francés'        },
  // League of Legends
  { id: 'faker',     name: 'Faker',     team: 'T1',                game: 'League of Legends',    role: 'Mid',          rarity: 'legendary', nationality: '🇰🇷 Surcoreano'     },
  { id: 'uzi',       name: 'Uzi',       team: 'Royal Never Give Up',game: 'League of Legends',   role: 'ADC',          rarity: 'legendary', nationality: '🇨🇳 Chino'          },
  // Dota 2
  { id: 'n0tail',    name: 'N0tail',    team: 'OG',                game: 'Dota 2',               role: 'Carry/Support',rarity: 'legendary', nationality: '🇩🇰 Danés'          },
  { id: 'miracle',   name: 'Miracle-',  team: 'Nigma Galaxy',      game: 'Dota 2',               role: 'Carry',        rarity: 'legendary', nationality: '🇯🇴 Jordano'        },
  // Valorant
  { id: 'tenz',      name: 'TenZ',      team: 'Sentinels',         game: 'Valorant',             role: 'Duelist',      rarity: 'legendary', nationality: '🇨🇦 Canadiense'     },
  // Fortnite
  { id: 'bugha',     name: 'Bugha',     team: 'Sentinels',         game: 'Fortnite',             role: 'Solo',         rarity: 'legendary', nationality: '🇺🇸 Estadounidense' },

  // ── EPIC ───────────────────────────────────────────────────────────────────
  // CS2
  { id: 'niko',      name: 'NiKo',      team: 'G2 Esports',        game: 'CS2',                  role: 'Rifler',       rarity: 'epic', nationality: '🇧🇦 Bosnio'          },
  { id: 'device',    name: 'device',    team: 'Astralis',           game: 'CS2',                  role: 'AWPer',        rarity: 'epic', nationality: '🇩🇰 Danés'            },
  { id: 'electronic',name: 'electronic',team: 'NAVI',               game: 'CS2',                  role: 'Rifler',       rarity: 'epic', nationality: '🇷🇺 Ruso'             },
  { id: 'ropz',      name: 'ropz',      team: 'FaZe Clan',          game: 'CS2',                  role: 'Rifler',       rarity: 'epic', nationality: '🇪🇪 Estonio'          },
  { id: 'broky',     name: 'broky',     team: 'FaZe Clan',          game: 'CS2',                  role: 'AWPer',        rarity: 'epic', nationality: '🇱🇻 Letón'            },
  // League of Legends
  { id: 'caps',      name: 'Caps',      team: 'G2 Esports',         game: 'League of Legends',    role: 'Mid',          rarity: 'epic', nationality: '🇩🇰 Danés'            },
  { id: 'rekkles',   name: 'Rekkles',   team: 'Various',            game: 'League of Legends',    role: 'ADC',          rarity: 'epic', nationality: '🇸🇪 Sueco'            },
  { id: 'perkz',     name: 'Perkz',     team: 'Various',            game: 'League of Legends',    role: 'Mid/ADC',      rarity: 'epic', nationality: '🇭🇷 Croata'           },
  { id: 'ruler',     name: 'Ruler',     team: 'Gen.G',              game: 'League of Legends',    role: 'ADC',          rarity: 'epic', nationality: '🇰🇷 Surcoreano'       },
  { id: 'chovy',     name: 'Chovy',     team: 'Gen.G',              game: 'League of Legends',    role: 'Mid',          rarity: 'epic', nationality: '🇰🇷 Surcoreano'       },
  { id: 'gumayusi',  name: 'Gumayusi',  team: 'T1',                 game: 'League of Legends',    role: 'ADC',          rarity: 'epic', nationality: '🇰🇷 Surcoreano'       },
  { id: 'zeus',      name: 'Zeus',      team: 'T1',                 game: 'League of Legends',    role: 'Top',          rarity: 'epic', nationality: '🇰🇷 Surcoreano'       },
  // Dota 2
  { id: 'topson',    name: 'Topson',    team: 'OG',                 game: 'Dota 2',               role: 'Mid',          rarity: 'epic', nationality: '🇫🇮 Finlandés'        },
  { id: 'ana',       name: 'ana',       team: 'OG',                 game: 'Dota 2',               role: 'Carry',        rarity: 'epic', nationality: '🇦🇺 Australiano'      },
  // Valorant
  { id: 'yay',       name: 'yay',       team: 'Cloud9',             game: 'Valorant',             role: 'Operator',     rarity: 'epic', nationality: '🇺🇸 Estadounidense'   },
  { id: 'aspas',     name: 'aspas',     team: 'LOUD',               game: 'Valorant',             role: 'Duelist',      rarity: 'epic', nationality: '🇧🇷 Brasileño'        },
  { id: 'derke',     name: 'Derke',     team: 'Fnatic',             game: 'Valorant',             role: 'Duelist',      rarity: 'epic', nationality: '🇫🇮 Finlandés'        },
  // Rocket League
  { id: 'jstn',      name: 'jstn',      team: 'NRG',                game: 'Rocket League',        role: 'Scorer',       rarity: 'epic', nationality: '🇺🇸 Estadounidense'   },
  // Overwatch 2
  { id: 'gesture',   name: 'Gesture',   team: 'LA Gladiators',      game: 'Overwatch 2',          role: 'Tank',         rarity: 'epic', nationality: '🇰🇷 Surcoreano'       },

  // ── RARE ───────────────────────────────────────────────────────────────────
  // CS2
  { id: 'hunter',    name: 'HUNTer-',   team: 'G2 Esports',         game: 'CS2',                  role: 'Rifler',       rarity: 'rare', nationality: '🇧🇦 Bosnio'          },
  { id: 'jame',      name: 'Jame',      team: 'VP',                 game: 'CS2',                  role: 'AWPer/IGL',    rarity: 'rare', nationality: '🇰🇿 Kazajo'           },
  { id: 'blamef',    name: 'blameF',    team: 'Astralis',           game: 'CS2',                  role: 'IGL',          rarity: 'rare', nationality: '🇩🇰 Danés'            },
  { id: 'ax1le',     name: 'Ax1Le',     team: 'Cloud9',             game: 'CS2',                  role: 'Rifler',       rarity: 'rare', nationality: '🇷🇺 Ruso'             },
  { id: 'karrigan',  name: 'karrigan',  team: 'FaZe Clan',          game: 'CS2',                  role: 'IGL',          rarity: 'rare', nationality: '🇩🇰 Danés'            },
  { id: 'twistzz',   name: 'Twistzz',   team: 'FaZe Clan',          game: 'CS2',                  role: 'Rifler',       rarity: 'rare', nationality: '🇨🇦 Canadiense'       },
  { id: 'rain',      name: 'rain',      team: 'FaZe Clan',          game: 'CS2',                  role: 'Rifler',       rarity: 'rare', nationality: '🇳🇴 Noruego'          },
  { id: 'spinx',     name: 'Spinx',     team: 'Team Vitality',      game: 'CS2',                  role: 'Rifler',       rarity: 'rare', nationality: '🇮🇱 Israelí'          },
  { id: 'xantares',  name: 'XANTARES',  team: 'Spirit',             game: 'CS2',                  role: 'Rifler',       rarity: 'rare', nationality: '🇹🇷 Turco'            },
  // League of Legends
  { id: 'showmaker', name: 'ShowMaker', team: 'Dplus KIA',          game: 'League of Legends',    role: 'Mid',          rarity: 'rare', nationality: '🇰🇷 Surcoreano'       },
  { id: 'berserker', name: 'Berserker', team: 'Cloud9',             game: 'League of Legends',    role: 'ADC',          rarity: 'rare', nationality: '🇰🇷 Surcoreano'       },
  { id: 'jankos',    name: 'Jankos',    team: 'Various',            game: 'League of Legends',    role: 'Jungle',       rarity: 'rare', nationality: '🇵🇱 Polaco'           },
  { id: 'humanoid',  name: 'Humanoid',  team: 'MAD Lions',          game: 'League of Legends',    role: 'Mid',          rarity: 'rare', nationality: '🇨🇿 Checo'            },
  { id: 'bin',       name: 'Bin',       team: 'BLG',                game: 'League of Legends',    role: 'Top',          rarity: 'rare', nationality: '🇨🇳 Chino'            },
  { id: 'knight',    name: 'Knight',    team: 'TES',                game: 'League of Legends',    role: 'Mid',          rarity: 'rare', nationality: '🇨🇳 Chino'            },
  { id: 'inspired',  name: 'Inspired',  team: 'Various',            game: 'League of Legends',    role: 'Jungle',       rarity: 'rare', nationality: '🇵🇱 Polaco'           },
  { id: 'upset',     name: 'Upset',     team: 'Fnatic',             game: 'League of Legends',    role: 'ADC',          rarity: 'rare', nationality: '🇩🇪 Alemán'           },
  // Valorant
  { id: 'chronicle', name: 'Chronicle', team: 'Team Liquid',        game: 'Valorant',             role: 'Sentinel',     rarity: 'rare', nationality: '🇷🇺 Ruso'             },
  { id: 'sacy',      name: 'SACY',      team: 'Sentinels',          game: 'Valorant',             role: 'Initiator',    rarity: 'rare', nationality: '🇧🇷 Brasileño'        },
  { id: 'less',      name: 'LESS',      team: 'LOUD',               game: 'Valorant',             role: 'Initiator',    rarity: 'rare', nationality: '🇧🇷 Brasileño'        },
  { id: 'boostio',   name: 'Boostio',   team: 'Cloud9',             game: 'Valorant',             role: 'IGL',          rarity: 'rare', nationality: '🇺🇸 Estadounidense'   },
  // Dota 2
  { id: 'sumail',    name: 'SumaiL',    team: 'Various',            game: 'Dota 2',               role: 'Mid',          rarity: 'rare', nationality: '🇵🇰 Pakistaní'        },
  { id: 'ceb',       name: 'Ceb',       team: 'OG',                 game: 'Dota 2',               role: 'Offlane',      rarity: 'rare', nationality: '🇫🇷 Francés'          },
  // Rocket League
  { id: 'vatira',    name: 'Vatira',    team: 'Karmine Corp',       game: 'Rocket League',        role: 'Scorer',       rarity: 'rare', nationality: '🇫🇷 Francés'          },
  { id: 'miztik',    name: 'Miztik',    team: 'Team Falcons',       game: 'Rocket League',        role: 'Scorer',       rarity: 'rare', nationality: '🇬🇧 Británico'        },
  // Overwatch 2
  { id: 'profit',    name: 'Profit',    team: 'Seoul Dynasty',      game: 'Overwatch 2',          role: 'DPS',          rarity: 'rare', nationality: '🇰🇷 Surcoreano'       },

  // ── COMMON ─────────────────────────────────────────────────────────────────
  // CS2
  { id: 'magisk',    name: 'Magisk',    team: 'Astralis',           game: 'CS2',                  role: 'Rifler',       rarity: 'common', nationality: '🇩🇰 Danés'          },
  { id: 'glaive',    name: 'gla1ve',    team: 'Astralis',           game: 'CS2',                  role: 'IGL',          rarity: 'common', nationality: '🇩🇰 Danés'          },
  { id: 'stewie2k',  name: 'Stewie2K',  team: 'Various',            game: 'CS2',                  role: 'IGL',          rarity: 'common', nationality: '🇺🇸 Estadounidense' },
  { id: 'naf',       name: 'NAF',       team: 'Team Liquid',        game: 'CS2',                  role: 'Rifler',       rarity: 'common', nationality: '🇨🇦 Canadiense'     },
  { id: 'cerq',      name: 'CeRq',      team: 'Various',            game: 'CS2',                  role: 'AWPer',        rarity: 'common', nationality: '🇧🇬 Búlgaro'        },
  { id: 'mezii',     name: 'mezii',     team: 'Team Vitality',      game: 'CS2',                  role: 'Rifler',       rarity: 'common', nationality: '🇬🇧 Británico'      },
  { id: 'dupreeh',   name: 'dupreeh',   team: 'Various',            game: 'CS2',                  role: 'Rifler',       rarity: 'common', nationality: '🇩🇰 Danés'          },
  { id: 'bodyy',     name: 'bodyy',     team: 'Various',            game: 'CS2',                  role: 'Rifler',       rarity: 'common', nationality: '🇫🇷 Francés'        },
  { id: 'jks',       name: 'jks',       team: 'Various',            game: 'CS2',                  role: 'Rifler',       rarity: 'common', nationality: '🇦🇺 Australiano'    },
  // League of Legends
  { id: 'alphari',   name: 'Alphari',   team: 'Various',            game: 'League of Legends',    role: 'Top',          rarity: 'common', nationality: '🇷🇺 Ruso'           },
  { id: 'wunder',    name: 'wunder',    team: 'Various',            game: 'League of Legends',    role: 'Top',          rarity: 'common', nationality: '🇩🇰 Danés'          },
  { id: 'larssen',   name: 'Larssen',   team: 'Various',            game: 'League of Legends',    role: 'Mid',          rarity: 'common', nationality: '🇸🇪 Sueco'          },
  { id: 'mikyx',     name: 'Mikyx',     team: 'G2 Esports',         game: 'League of Legends',    role: 'Support',      rarity: 'common', nationality: '🇸🇮 Esloveno'       },
  { id: 'nemesis',   name: 'Nemesis',   team: 'Various',            game: 'League of Legends',    role: 'Mid',          rarity: 'common', nationality: '🇸🇮 Esloveno'       },
  { id: 'selfmade',  name: 'Selfmade',  team: 'Various',            game: 'League of Legends',    role: 'Jungle',       rarity: 'common', nationality: '🇷🇺 Ruso'           },
  { id: 'bwipo',     name: 'Bwipo',     team: 'Various',            game: 'League of Legends',    role: 'Top/Support',  rarity: 'common', nationality: '🇧🇪 Belga'          },
  { id: 'treatz',    name: 'Treatz',    team: 'Various',            game: 'League of Legends',    role: 'Support',      rarity: 'common', nationality: '🇸🇪 Sueco'          },
  { id: 'elk',       name: 'Elk',       team: 'BLG',                game: 'League of Legends',    role: 'ADC',          rarity: 'common', nationality: '🇨🇳 Chino'          },
  // Valorant
  { id: 'leaf',      name: 'leaf',      team: 'NRG',                game: 'Valorant',             role: 'Duelist',      rarity: 'common', nationality: '🇺🇸 Estadounidense' },
  { id: 'bang',      name: 'bang',      team: 'EG',                 game: 'Valorant',             role: 'Sentinel',     rarity: 'common', nationality: '🇺🇸 Estadounidense' },
  { id: 'xeppaa',    name: 'xeppaa',    team: 'Cloud9',             game: 'Valorant',             role: 'Initiator',    rarity: 'common', nationality: '🇺🇸 Estadounidense' },
  { id: 'cauanzin',  name: 'cauanzin',  team: 'LOUD',               game: 'Valorant',             role: 'IGL',          rarity: 'common', nationality: '🇧🇷 Brasileño'      },
  { id: 'heat',      name: 'heat',      team: 'LOUD',               game: 'Valorant',             role: 'Initiator',    rarity: 'common', nationality: '🇧🇷 Brasileño'      },
  { id: 'cryocells', name: 'cryo',      team: 'Sentinels',          game: 'Valorant',             role: 'Sentinel',     rarity: 'common', nationality: '🇺🇸 Estadounidense' },
  // Dota 2
  { id: 'cr1t',      name: 'Cr1t-',     team: 'EG',                 game: 'Dota 2',               role: 'Support',      rarity: 'common', nationality: '🇩🇰 Danés'          },
  { id: 'resolut1on',name: 'Resolut1on',team: 'Various',            game: 'Dota 2',               role: 'Carry',        rarity: 'common', nationality: '🇺🇦 Ucraniano'      },
  { id: 'pieliedie', name: 'pieliedie', team: 'Various',            game: 'Dota 2',               role: 'Support',      rarity: 'common', nationality: '🇸🇪 Sueco'          },
  // Rocket League
  { id: 'monkey_moon',name:'Monkey Moon',team: 'Karmine Corp',      game: 'Rocket League',        role: 'Scorer',       rarity: 'common', nationality: '🇫🇷 Francés'        },
  { id: 'zen',       name: 'Zen',       team: 'Team BDS',           game: 'Rocket League',        role: 'Playmaker',    rarity: 'common', nationality: '🇩🇪 Alemán'         },
  { id: 'firstkiller',name:'FirstKiller',team: 'Team BDS',          game: 'Rocket League',        role: 'Scorer',       rarity: 'common', nationality: '🇫🇷 Francés'        },
  // Fortnite
  { id: 'clix',      name: 'Clix',      team: 'NRG',                game: 'Fortnite',             role: 'Zone Wars',    rarity: 'common', nationality: '🇺🇸 Estadounidense' },
  { id: 'benjyfishy',name: 'benjyfishy',team: 'NRG',                game: 'Fortnite',             role: 'Solo',         rarity: 'common', nationality: '🇬🇧 Británico'      },
  // Overwatch 2
  { id: 'super',     name: 'super',     team: 'SF Shock',           game: 'Overwatch 2',          role: 'Tank',         rarity: 'common', nationality: '🇺🇸 Estadounidense' },
  { id: 'sinatraa',  name: 'Sinatraa',  team: 'Various',            game: 'Valorant',             role: 'Duelist',      rarity: 'common', nationality: '🇺🇸 Estadounidense' },
];
