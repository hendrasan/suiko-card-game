// Deck lists. Format: "id:count id:count ...". Every deck has 50 cards, max 3 copies of a card.

export function parseDeck(spec) {
  const r = [];
  spec.trim().split(/\s+/).forEach(t => { const [id, n] = t.split(':'); for (let k = 0; k < +(n || 1); k++) r.push(+id); });
  return r;
}

export const STARTER_DECK = `
10:2 26:2 25:1 24:1 29:2 16:2 22:2
33:2 38:2 53:2 59:2 56:2 96:2 105:2 115:2 134:2 128:2 137:2
149:2 151:2 152:1 153:1 154:1 157:1 158:1 167:2 168:1 174:1
176:1 180:1 181:1`;

// Campaign. vp = [player target, opponent target].
export const OPPONENTS = [
  { id: 'scouts', name: 'Highland Scouts', where: 'Tenzan Pass', vp: [3, 3], reward: 300, prize: 8,
    intro: 'A Highland patrol blocks the mountain path.',
    deck: `12:3 9:3 11:3 22:2 71:3 39:2 40:3 49:3 115:3 134:3 108:2 88:2 105:2 149:3 151:3 152:2 167:3 168:2 174:1 176:2` },
  { id: 'bandits', name: 'Kuskus Bandits', where: 'Kuskus', vp: [4, 3], reward: 400, prize: 133,
    intro: 'Gijimu and his gang want your potch.',
    deck: `11:3 22:3 30:2 29:2 77:3 40:3 33:2 65:2 107:3 147:2 148:2 52:2 54:2 105:2 149:2 150:2 152:2 153:2 156:2 158:2 167:2 180:3` },
  { id: 'muse', name: 'Muse Guard', where: 'Muse', vp: [4, 4], reward: 500, prize: 4, mm: 4,
    intro: 'The City-State army tests the strength of the mercenaries.',
    deck: `10:3 26:3 20:2 13:2 28:2 72:2 48:3 43:2 61:2 80:2 34:2 45:2 64:2 112:2 62:2 70:2 155:2 158:2 163:2 168:2 170:2 169:2 154:1 183:2` },
  { id: 'kiba', name: 'Kiba & Klaus', where: 'South Window', vp: [5, 4], reward: 600, prize: 200,
    intro: 'General Kiba marches on the city with his son Klaus.',
    deck: `12:3 9:3 17:2 21:2 39:3 71:3 110:3 47:3 73:2 69:2 41:2 76:2 60:2 144:2 167:3 169:3 171:2 172:2 189:3 186:3` },
  { id: 'neclord', name: 'Neclord', where: 'Tinto', vp: [5, 5], reward: 700, prize: 145,
    intro: 'The vampire lord waits in the mines of Tinto.',
    deck: `203:1 22:3 27:3 32:3 124:3 118:2 116:3 130:2 102:2 97:2 125:2 121:2 108:2 117:2 164:2 157:2 159:3 162:2 153:2 175:1 182:3 181:3` },
  { id: 'solon', name: 'Solon Jee', where: 'Radat', vp: [5, 5], reward: 800, prize: 2,
    intro: 'Solon Jee leads a large Highland army.',
    deck: `19:3 21:3 9:3 15:2 71:3 110:3 39:3 64:3 45:2 112:2 52:2 132:1 87:2 167:3 168:2 169:3 170:2 171:2 172:2 189:2 190:2` },
  { id: 'seed', name: 'Seed & Culgan', where: 'Muse', vp: [5, 5], reward: 900, prize: 196,
    intro: 'The two Highland generals hold Muse.',
    deck: `17:3 15:3 18:2 9:2 69:2 47:3 39:2 110:2 71:2 41:2 76:2 74:2 37:2 114:2 67:2 165:2 172:2 173:1 160:2 161:2 169:2 186:3 185:3` },
  { id: 'jowy', name: 'Jowy', where: 'L\'Renouille', vp: [5, 5], reward: 1000, prize: 6, mm: 6,
    intro: 'Your best friend now leads the Highland army.',
    deck: `18:3 17:2 15:2 12:2 9:2 31:1 39:3 47:3 71:3 110:3 69:2 41:2 124:2 132:2 118:2 123:2 172:2 173:2 165:2 161:2 170:2 186:2 189:2` },
  { id: 'luca', name: 'Luca Blight', where: 'Highland Camp', vp: [5, 5], reward: 1500, prize: 1, mm: 7,
    intro: 'The Mad Prince of Highland. This is the final battle.',
    deck: `31:3 18:2 17:2 15:2 9:2 12:2 39:3 47:3 71:3 110:3 69:3 41:2 145:1 124:2 166:2 173:2 172:2 165:2 167:2 171:1 186:3 189:3` },
];
