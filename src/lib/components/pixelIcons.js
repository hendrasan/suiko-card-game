// Pixel-art icons. Each map is rows of colour letters ('.' = empty).
// The dark outline is added in code. Each icon becomes one SVG data URL.

const COLORS = {
  k: '#1a1418', // outline
  w: '#f4f4f0', s: '#a8b4c8', g: '#7a7a8a', G: '#4a4a58', // white, steel, greys
  y: '#e8b84a', b: '#8a5228',                             // gold, wood
  r: '#d0453f', R: '#8e2a2a', p: '#f08a80',               // reds
  u: '#4f86d8', U: '#27508f',                             // blues
};

const MAPS = {
  atk: [ // sword
    'w...........',
    'ws..........',
    '.ws.........',
    '..ws........',
    '...ws.......',
    '....ws....y.',
    '.....ws..y..',
    '......wsy...',
    '.......yb...',
    '......y..b..',
    '.....y....b.',
    '...........y',
  ],
  mil: [ // flag
    '.y..........',
    '.grrrrrr....',
    '.grrrrrrrr..',
    '.gprrrrrrrR.',
    '.gpprrrrrRR.',
    '.grrrrRRR...',
    '.gRR........',
    '.g..........',
    '.g..........',
    '.g..........',
    '.g..........',
    'GGG.........',
  ],
  bld: [ // hammer
    '.ssssssss...',
    '.swwwwwws...',
    '.sggggggs...',
    '.GGGGGGGG...',
    '....bb......',
    '....bb......',
    '....bb......',
    '....bb......',
    '....bb......',
    '....bb......',
    '....bb......',
    '....GG......',
  ],
  deck: [ // red card: cards left in the deck
    'pppppppp',
    'prrrrrrr',
    'prrrrrrr',
    'prrrrrrr',
    'prrrrrrr',
    'prrrrrrr',
    'prrrrrrr',
    'prrrrrrr',
    'prrrrrrr',
    'prrrrrrR',
    'RRRRRRRR',
  ],
  disc: [ // blue/white card: discard pile
    'rrrrrrrr',
    'ruuuuuur',
    'rUUUUUUr',
    'ruuuuuur',
    'rwwwwwwr',
    'rwwwwwwr',
    'rwwwwwwr',
    'rwwwwwwr',
    'rwwwwwwr',
    'rwwwwwwr',
    'rrrrrrrr',
  ],
};

// Add a 1-pixel border on all sides, then outline every empty pixel next to a filled one.
function outline(map) {
  const h = map.length + 2, w = map[0].length + 2;
  const at = (r, c) => (map[r - 1] && map[r - 1][c - 1]) || '.';
  const out = [];
  for (let r = 0; r < h; r++) {
    let row = '';
    for (let c = 0; c < w; c++) {
      let ch = at(r, c);
      if (ch === '.') {
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if (at(r + dr, c + dc) !== '.') ch = 'k';
      }
      row += ch;
    }
    out.push(row);
  }
  return out;
}

function toUrl(map) {
  let rects = '';
  map.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch !== '.') rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${COLORS[ch]}"/>`;
  }));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${map[0].length} ${map.length}" shape-rendering="crispEdges">${rects}</svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

export const ICON_URLS = Object.fromEntries(Object.entries(MAPS).map(([k, m]) => [k, toUrl(outline(m))]));
