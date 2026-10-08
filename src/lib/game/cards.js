// Card data for Genso Suikoden Card Stories (GBA numbering 001-250).
// Stats come from the GameFAQs card list. Values marked "est" in EST are estimates.
// Ability texts are short own-words summaries; logic lives in FX below.

import { shuffle } from './engine.js';

export const SHEETS = ['cards_001-050', 'cards_051-100', 'cards_101-150', 'cards_151-200', 'cards_201-250'];

// id|name|class|sex|camp|atk|mil|bld|links|unite partners (comma list of names)
// class: M=mastermind L=leader C=commoner R=craftsman F=free
// sex: M, F, B=beast, K=kobold, O=other (non-human)
const CHAR_ROWS = `
1|McDohl|M|M|TR|0|0|0||
2|Riou|M|M|NA|0|0|0||
3|Adlai|M|M|NA|0|0|0||
4|Annabelle|M|F|CS|0|0|0||
5|Gorudo|M|M|CS|0|0|0||
6|Jowy|M|M|HL|0|0|0||
7|Luca Blight|M|M|HL|0|0|0||
8|Riou|L|M|NA|3|1000|2|ABEG|
9|Agares Blight|L|M|HL|0|1000|1|CE|
10|Camus|L|M|CS|3|800|1|BE|Miklotov
11|Gijimu|L|M|NA|2|200|1|BF|
12|Kiba|L|M|HL|2|1000|0|ACF|
13|Gustav|L|M|CS|1|0|1|BDF|
14|Granmeyer|L|M|NA|0|0|3|BD|
15|Culgan|L|M|HL|4|2000|0|CDH|
16|Gengen|L|K|NA|1|0|2|AG|
17|Seed|L|M|HL|5|1500|0|CE|
18|Jowy|L|M|HL|5|1500|1|AE|
19|Solon Jee|L|M|HL|0|2500|0|CF|
20|Teresa|L|F|CS|0|500|2|ABD|
21|Han|L|M|CS|2|2000|1|C|
22|Hauser|L|M|NA|2|1000|1|BF|
23|Valeria|L|F|TR|3|1000|1|AE|
24|Viktor|L|M|NA|4|500|1|ABDF|
25|Flik|L|M|NA|3|1000|2|AEI|
26|Miklotov|L|M|CS|3|800|1|ABF|Camus
27|Makai|L|M|NA|0|600|1|BD|
28|Maximillian|L|M|CS|0|1000|0|AF|
29|Rina|L|F|NA|2|0|1|AE|
30|Ridley|L|M|NA|2|1500|1|BG|
31|Luca Blight|L|M|HL|6|2000|0|CF|
32|Lepant|L|M|TR|2|900|1|ADF|
33|Eilie|C|F|NA|3|0|1|AE|Rina,Bolgan
34|Apple|C|F|NA|0|200|1|AE|
35|Vincent|C|M|NA|3|0|0|A|Simone
36|Emilia|C|F|NA|0|0|3|BDE|
37|Kasumi|C|F|TR|3|500|1|AEH|
38|Gabocha|C|K|NA|1|0|1|AGI|Gengen,Shiro
39|Klaus|C|M|HL|0|500|0|AC|
40|Koyu|C|M|NA|2|0|0|BF|
41|Sasarai|C|M|IN|2|500|0|CH|
42|Sheena|C|M|NA|2|500|0|AE|
43|Jess|C|M|CS|0|500|2|BD|
44|Simone|C|M|NA|3|0|0|A|Vincent
45|Shu|C|M|NA|0|1600|1|AH|
46|Jude|C|M|NA|0|0|3|BD|
47|Jillia|C|F|HL|0|0|2|ACE|
48|Shin|C|M|CS|3|100|0|BF|Genshu
49|Stallion|C|M|NA|1|0|0|AB|
50|Tai Ho|C|M|NA|2|200|0|AEF|
51|Chaco|C|M|NA|2|100|0|ABD|
52|Tsai|C|M|NA|3|500|0|ABF|
53|Tengaar|C|F|NA|2|0|1|AEI|Hix
54|Tomo|C|F|NA|3|0|1|ABE|Tsai
55|Nanami|C|F|NA|3|0|1|AE|Riou,Jowy
56|Nina|C|F|NA|2|0|1|ABE|Flik
57|Barbara|C|F|NA|0|0|2|ADE|
58|Viki|C|F|NA|1|0|1|I|
59|Hix|C|M|NA|2|0|1|AE|
60|Pilika|C|F|NA|0|0|0|ACG|
61|Fitcher|C|M|CS|0|0|1|ABDEF|
62|Freed Y|C|M|NA|3|500|0|BE|
63|Pohl|C|M|NA|1|0|2|ADG|
64|Boris|C|M|NA|0|1500|1|BG|
65|Bolgan|C|M|NA|3|0|0|AEFG|
66|Marlowe|C|M|NA|0|0|1|ABD|
67|Mondo|C|M|NA|3|0|0|AF|Kasumi
68|Yam Koo|C|M|NA|2|100|1|AD|Tai Ho
69|Yuber|C|M|IN|3|500|0|CH|
70|Yoshino|C|F|NA|2|0|1|BE|Freed Y
71|Rowd|C|M|HL|2|1000|0|BCG|
72|Lily|C|F|CS|0|0|0|BEG|Gustav
73|Lucia|C|F|NA|2|200|0|CI|
74|Luc|C|M|NA|2|300|0|HI|
75|Leona|C|F|NA|0|0|1|ADE|
76|Leon|C|M|NA|0|500|2|CH|
77|Lo Wen|C|F|NA|2|200|0|BE|Koyu
78|Adlai|R|M|NA|4|100|2|ADH|
79|Karen|R|F|NA|2|0|2|E|
80|Gordon|R|M|CS|0|0|2|AD|
81|Connell|R|M|NA|0|0|2|ABD|
82|Shilo|R|M|NA|3|0|1|DF|
83|Taki|R|F|NA|0|0|1|ABE|
84|Tetsu|R|M|NA|0|0|3|DF|
85|Tessai|R|M|NA|0|0|3|DF|
86|Tenkou|R|M|NA|0|0|1|DH|
87|Templeton|R|M|NA|0|100|2|AD|
88|Tuta|R|M|NA|1|0|1|AB|
89|Tony|R|M|NA|0|0|2|DG|
90|Hai Yo|R|M|NA|1|0|1|D|
91|Hans|R|M|NA|0|0|2|ABD|
92|Huan|R|M|NA|0|100|2|BD|
93|Yuzu|R|F|NA|0|0|2|DEG|
94|Raura|R|F|NA|0|0|1|ADE|
95|Lebrante|R|M|NA|0|0|2|BD|
96|Anita|F|F|TR|3|0|0|ABE|
97|Abizboah|F|B|NA|7|0|0|G|
98|Amada|F|M|NA|2|0|1|ABF|
99|Alberto|F|M|NA|0|0|2|BD|
100|Alex|F|M|NA|1|0|1|DEF|
101|Annallee|F|F|NA|0|0|1|BDE|Pico,Alberto
102|Ayda|F|F|NA|3|300|0|AEG|
103|Elza|F|F|NA|2|0|0|HI|
104|Oulan|F|F|NA|3|200|0|AEF|
105|Kahn|F|M|NA|2|0|0|ABF|
106|Gadget|F|O|NA|2|0|1|AH|Meg
107|Gantetsu|F|M|NA|3|0|0|ABF|
108|Kinnison|F|M|NA|2|0|0|AG|
109|Killey|F|M|NA|3|0|0|DF|
110|Gilbert|F|M|HL|1|1500|0|ABC|
111|Clive|F|M|NA|2|0|0|H|
112|Georg|F|M|NA|3|1000|0|AF|
113|Genshu|F|M|NA|3|0|0|BF|
114|Sasuke|F|M|NA|3|0|1|AEH|
115|Zamza|F|M|NA|2|0|0|AB|
116|Sigfried|F|B|NA|3|0|0|EG|
117|Jeane|F|F|NA|1|200|2|EI|
118|Sierra|F|F|IN|3|0|0|BE|
119|Sid|F|M|NA|3|0|0|BG|Chaco
120|Sgt. Joe|F|O|NA|2|0|1|ABG|
121|Shiro|F|B|NA|3|0|0|GH|Kinnison
122|Star Dragon Sword|F|O|NA|3|0|0|FHI|
123|Nash|F|M|IN|2|0|1|E|
124|Neclord|F|M|IN|5|0|0|EG|
125|Badeaux|F|M|NA|2|0|1|ABG|
126|Hanna|F|F|NA|3|100|1|AEF|Oulan
127|Humphrey|F|M|TR|3|500|0|AF|
128|Pico|F|M|NA|1|0|0|BE|
129|Hilda|F|F|NA|0|0|2|DE|
130|Feather|F|B|NA|3|0|0|G|Ayda,Sigfried
131|Futch|F|M|TR|3|0|1|AEG|Humphrey
132|Pesmerga|F|M|IN|4|500|0|F|
133|Hoi|F|M|NA|1|0|0|AI|Riou
134|Bob|F|M|NA|1|0|0|BG|
135|Makumaku|F|B|NA|1|0|1|ABG|
136|Mikumiku|F|B|NA|1|0|0|ABEG|Makumaku,Mukumuku,Mekumeku,Mokumoku
137|Millie|F|F|NA|1|0|1|AEG|
138|Mukumuku|F|B|NA|1|0|1|ABDEFG|
139|Mazus|F|M|NA|2|1000|0|AB|
140|Meg|F|F|NA|1|0|2|AE|
141|Mekumeku|F|B|NA|1|0|2|ABGI|
142|Mokumoku|F|B|NA|2|0|0|ABG|
143|Rikimaru|F|M|NA|2|0|1|ABCF|Amada
144|Richmond|F|M|NA|0|0|2|ABCD|
145|Leknaat|F|F|IN|0|0|0|I|
146|Lorelai|F|F|NA|3|100|1|AE|
147|Long Chan Chan|F|M|NA|4|0|0|DF|
148|Wakaba|F|F|NA|3|0|1|ABDE|Long Chan Chan
`;

// id|name|atk|mil|vpOwner|vpOther   (missions)
const MISSION_ROWS = `
149|Reconnaissance|5|0|1|1
150|Cooking Match|5|0|1|2
151|Odd Jobs|6|0|1|1
152|Highland Reconnaissance|7|0|1|1
153|Mist Monster|8|0|1|1
154|New Leaf Academy|8|0|1|1
155|Rescue of Teresa|8|2000|1|2
156|Enemy Facility Raid|9|0|1|2
157|Futch's Dragon|10|0|1|1
158|Escape from Muse|9|0|1|2
159|Sindar Treasure|10|0|1|2
160|Front Line Base|10|0|1|2
161|Base Recovery|10|2500|1|2
162|Road to Toran|11|0|1|2
163|North Window|11|0|1|2
164|Suppress Neclord|12|0|1|1
165|Capture of Two River|15|0|2|2
166|The Beast Rune|25|0|3|3
167|Mercenary Fort|0|1500|1|1
168|Greenhill Liberation|0|1500|1|1
169|Occupation of Radat|0|2000|1|2
170|Matilda Capture|0|2500|1|1
171|South Window Invasion|0|2500|1|1
172|Capture of Muse|0|4000|2|2
173|L'Renouille Raid|0|5000|3|4
174|Single Combat|0|0|1|1
175|Single Combat 2|0|0|1|1
`;

// id|name|atk(obstruct)|bld(build)
const FACILITY_ROWS = `
176|Ranch|6|4
177|Trading Post|7|4
178|Inn|7|4
179|Appraiser|7|4
180|Restaurant|7|4
181|Bath|7|5
182|Rune Shop|7|5
183|Library|8|5
184|Warehouse|8|5
185|Item Shop|7|7
186|Blacksmith|7|6
187|Bar|7|6
188|Gambling Hall|7|6
189|Armor Shop|8|6
190|Scroll Shop|8|6
191|Teleporter|7|7
`;

// Silver cards: id -> [base id, atk, mil, bld, links, class override?]. null stats = estimate from base.
const SILVER = {
  192: [8], 193: [31], 194: [18], 195: [24], 196: [25, 3, 1500, 2, 'AEI'], 197: [17], 198: [15], 199: [47],
  200: [55, 4, 300, 2, 'AEI'], 201: [118], 202: [139, 3, 1600, 2, 'ABDF'], 203: [124, null, null, null, null, 'L'],
  204: [138, 2, 500, 2, 'ABDEFG', 'L'], 205: [4], 206: [20], 207: [106, 2, 400, 2, 'AGH'], 208: [140], 209: [137],
  210: [53], 211: [59], 212: [123], 213: [26], 214: [10], 215: [60], 216: [93], 217: [34, 0, 300, 2, 'ADE'],
  218: [45, 1, 2100, 1, 'ADH'], 219: [58, 2, 0, 2, 'I'], 220: [111, 4, 0, 0, 'FH'], 221: [103], 222: [74, 2, 900, 2, 'AHI'],
  223: [41, 2, 700, 2, 'CH'], 224: [1, 4, 1500, 1, 'ABDI', 'L'], 225: [16], 226: [38], 227: [122], 228: [125, 2, 500, 2, 'ABGI', 'L'],
  229: [2], 230: [6], 231: [145], 232: [69, 4, 700, 0, 'CFH'], 233: [132, 5, 800, 0, 'FI'], 234: [21], 235: [76], 236: [7],
  237: [1], 238: [35], 239: [44], 240: [68], 241: [50, 2, 800, 1, 'AEF'], 242: [78, 4, 400, 4, 'ADFH'], 243: [5], 244: [19],
  245: [22], 246: [109, 4, 0, 1, 'BDFH'], 247: [146], 248: [13, 2, 900, 2, 'ABDFG'], 249: [37], 250: [49],
};

// Rune bearers: characters with link letter I (assumption, see README).
export const CLASS_NAMES = { M: 'Mastermind', L: 'Leader', C: 'Commoner', R: 'Craftsman', F: 'Free' };
export const CAMP_NAMES = { HL: 'Highland', NA: 'New Alliance', CS: 'City-State', TR: 'Toran', IN: 'Independent' };
export const SQUIRRELS = ['Makumaku', 'Mikumiku', 'Mukumuku', 'Mekumeku', 'Mokumoku'];

export const CARDS = {};

function parseRows(text, fn) {
  text.trim().split('\n').forEach(l => fn(l.trim().split('|')));
}

parseRows(CHAR_ROWS, r => {
  const [id, name, cls, sex, camp, atk, mil, bld, links, unite] = r;
  CARDS[+id] = {
    id: +id, name, key: name, type: cls === 'M' ? 'mm' : 'char', cls, sex, camp,
    atk: +atk, mil: +mil, bld: +bld, links: links || '', unite: unite ? unite.split(',') : [],
  };
});
parseRows(MISSION_ROWS, r => {
  const [id, name, atk, mil, a, b] = r;
  const dual = +atk > 0 && +mil > 0;
  CARDS[+id] = {
    id: +id, name, key: 'm' + id, type: 'mission', atk: +atk, mil: +mil, bld: 0, vp: [+a, +b],
    mode: +id >= 174 ? 'duel' : dual ? 'choose' : +mil > 0 ? 'mil' : 'atk',
  };
});
parseRows(FACILITY_ROWS, r => {
  const [id, name, atk, bld] = r;
  CARDS[+id] = { id: +id, name, key: 'f' + id, type: 'facility', atk: +atk, mil: 0, bld: +bld, mode: 'fac' };
});
for (const sid in SILVER) {
  const [baseId, atk, mil, bld, links, cls] = SILVER[sid];
  const b = CARDS[baseId];
  const est = atk == null;
  const c = Object.assign({}, b, {
    id: +sid, base: baseId, silver: true, est,
    atk: est ? (b.type === 'mm' ? 0 : b.atk + 1) : atk,
    mil: est ? (b.type === 'mm' ? 0 : b.mil > 0 ? b.mil + 300 : 0) : mil,
    bld: est ? (b.type === 'mm' ? 0 : b.bld + 1) : bld,
    links: links || b.links,
  });
  if (cls) { c.cls = cls; c.type = 'char'; }
  CARDS[sid] = c;
}
for (const id in CARDS) {
  const c = CARDS[id];
  c.rune = (c.links || '').includes('I');
  c.base = c.base || c.id;
  if (c.est === undefined) c.est = false;
}

// ---------- Ability logic ----------
// Hooks (all optional):
//   text: short description
//   mod(g, inst, m): self stat changes {atk, mil, bld}
//   aura(g, src, inst, m): changes to another card (src is a char instance, mm or facility record)
//   can(g, p, m): extra deploy check, return false to block
//   appear(g, inst, m): async, runs on deploy
//   target(g, src, m, p): change to the clear target for player p on mission m
//   betrayal: true
// Mission hooks: canUse(g, def, m, p), onPlay(g, m), onClear(g, m, p), stat(g, m, inst, s)
// Facility hooks: aura, target, onBuilt, handLimit

const sameSide = (g, inst, m) => (m ? m.sides[inst.owner] : []);
const onSide = (g, m, p, name) => !!m && m.sides[p].some(x => g.def(x).key === name);
const own = (g, p, name) => g.inPlayOf(p).some(x => g.def(x).key === name);
const isHuman = d => d.sex === 'M' || d.sex === 'F';
const notSelf = (src, inst) => src.uid !== inst.uid;

const FX = {
  // Masterminds
  1: { text: 'When your deck runs out, shuffle your discard pile into a new deck (one time).' },
  2: { text: 'Each facility you build also gives you 1 VP.' },
  3: { text: 'Craftsmen can start a mission without a Leader. Your characters get +1 Hammer.',
       aura: (g, src, inst) => inst.owner === src.owner ? { bld: 1 } : null },
  4: { text: 'After you refill your hand, you may discard 1 card and draw 1.' },
  5: { text: 'All your characters have Betrayal.' },
  6: { text: 'Your characters with military get +100 military.',
       aura: (g, src, inst) => inst.owner === src.owner && g.def(inst).mil > 0 ? { mil: 100 } : null },
  7: { text: 'Once per turn, during a battle, you may discard one of your characters on that mission to make the opponent discard a random card.' },

  // Leaders
  8: { text: 'Your New Alliance characters get +1 Sword (self too).',
       aura: (g, src, inst) => inst.owner === src.owner && g.def(inst).camp === 'NA' ? { atk: 1 } : null },
  9: { text: 'Your Highland characters with military get +100 military (self too).',
       aura: (g, src, inst) => inst.owner === src.owner && g.def(inst).camp === 'HL' && g.def(inst).mil > 0 ? { mil: 100 } : null },
  10: { text: 'Unite: Miklotov. +1 Sword if Flik is on your side of this mission.',
        mod: (g, i, m) => onSide(g, m, i.owner, 'Flik') ? { atk: 1 } : null },
  11: { text: 'On a Sword mission, the opponent needs +2 more to clear it.',
        target: (g, src, m, p) => src.mission === m && p !== src.owner && m.mode === 'atk' ? 2 : 0 },
  12: { text: 'If Kiba survives an army clash, his military counts as 2000.' },
  13: { text: '+2 Sword, +2 Hammer, +500 military with Lily on your side. Cannot be used if the opponent has Lily in play.',
        mod: (g, i, m) => onSide(g, m, i.owner, 'Lily') ? { atk: 2, bld: 2, mil: 500 } : null,
        can: (g, p) => !own(g, 1 - p, 'Lily') },
  14: { text: 'Appearance: the battle ends at once (go to the decision).',
        appear: async (g, i, m) => { m.forceEnd = true; } },
  15: { text: 'Appearance: if Seed is on this mission, discard 1 opponent character here.',
        appear: async (g, i, m) => {
          if (!m.sides.some(s => s.some(x => g.def(x).key === 'Seed'))) return;
          await g.killChoice(i.owner, m.sides[1 - i.owner], 'Culgan: discard 1 opponent character');
        } },
  16: { text: '+2 Sword, +2 Hammer if Gabocha is in play on your side.',
        mod: (g, i) => own(g, i.owner, 'Gabocha') ? { atk: 2, bld: 2 } : null },
  17: { text: '+1 Sword, +500 military with Culgan on your side.',
        mod: (g, i, m) => onSide(g, m, i.owner, 'Culgan') ? { atk: 1, mil: 500 } : null },
  18: { text: 'Your Highland characters get +1 Sword (self too).',
        aura: (g, src, inst) => inst.owner === src.owner && g.def(inst).camp === 'HL' ? { atk: 1 } : null },
  19: { text: 'Cannot be stationed on a cleared mission.', noStation: true },
  20: { text: 'Appearance: draw 1 card.', appear: async (g, i) => g.draw(i.owner, 1) },
  21: { text: '+1000 military at the army decision.', mod: (g, i, m) => m && g.deciding === m ? { mil: 1000 } : null },
  22: { text: '+4 Sword if you have fewer Leaders here. +1500 military if a Highland character is on the other side.',
        mod: (g, i, m) => {
          if (!m) return null;
          const L = p => m.sides[p].filter(x => g.def(x).cls === 'L').length;
          const r = {};
          if (L(i.owner) < L(1 - i.owner)) r.atk = 4;
          if (m.sides[1 - i.owner].some(x => g.def(x).camp === 'HL')) r.mil = 1500;
          return r;
        } },
  23: { text: '+3 Sword if a Highland character is on the other side.',
        mod: (g, i, m) => m && m.sides[1 - i.owner].some(x => g.def(x).camp === 'HL') ? { atk: 3 } : null },
  24: { text: '+1000 military with Flik on your side.',
        mod: (g, i, m) => onSide(g, m, i.owner, 'Flik') ? { mil: 1000 } : null },
  25: { text: '+2 Sword with Viktor on your side.',
        mod: (g, i, m) => onSide(g, m, i.owner, 'Viktor') ? { atk: 2 } : null },
  26: { text: 'Unite: Camus. +1 Sword with Camus on your side; +500 military with Camus and Flik.',
        mod: (g, i, m) => onSide(g, m, i.owner, 'Camus') ? { atk: 1, mil: onSide(g, m, i.owner, 'Flik') ? 500 : 0 } : null },
  27: { text: 'Appearance: take a random card from your discard pile into your hand.',
        appear: async (g, i) => g.fromDiscardRandom(i.owner) },
  28: { text: 'Army missions only. Appearance: you may discard a character with 300 military or less on this mission.',
        can: (g, p, m) => m.mode === 'mil',
        appear: async (g, i, m) => {
          const t = m.sides.flat().filter(x => x !== i && g.stat(x, m).mil <= 300);
          await g.killChoice(i.owner, t, 'Maximillian: discard a weak character', true);
        } },
  29: { text: 'Appearance: discard 1 male character on the other side.',
        appear: async (g, i, m) => g.killChoice(i.owner, m.sides[1 - i.owner].filter(x => g.def(x).sex === 'M'), 'Rina: discard a male character') },
  30: { text: '(Selection ability not used in this version.)' },
  31: { text: 'Cannot be used on facilities. Appearance: both players discard their whole hand.',
        can: (g, p, m) => m.mode !== 'fac',
        appear: async (g) => { g.discardHand(0); g.discardHand(1); } },
  32: { text: 'Your characters here that link with Lepant get +100 military.',
        aura: (g, src, inst, m) => src.mission && src.mission === m && inst.owner === src.owner && notSelf(src, inst) && g.linksWith(inst, src) ? { mil: 100 } : null },

  // Commoners
  33: { text: 'Unite: Rina, Bolgan.' },
  34: { text: 'Appearance: the opponent discards 1 card. If it is a character, they discard 1 more.',
        appear: async (g, i) => {
          const o = 1 - i.owner;
          const c = await g.discardChoice(o, 'Apple: discard 1 card');
          if (c && g.def(c).type === 'char') await g.discardChoice(o, 'Apple: discard 1 more card');
        } },
  35: { text: 'Unite: Simone. When united, the opponent discards a random card.',
        appear: async (g, i) => { if (i.united) g.discardRandom(1 - i.owner, 1); } },
  36: { text: 'Appearance: draw 2, keep 1, discard 1. +1 Hammer if a Library is built or in progress.',
        mod: (g, i) => g.anyCardInPlay(183) ? { bld: 1 } : null,
        appear: async (g, i) => g.emiliaDraw(i.owner) },
  37: { text: 'Appearance: the opponent shows you their hand.', appear: async (g, i) => g.reveal(1 - i.owner) },
  38: { text: 'Unite: Gengen, Shiro.' },
  39: { text: 'When the opponent plays a mission and you have fewer VP, you may discard Klaus and a non-character card from your hand to cancel it.' },
  40: { text: 'After you station a character here, you may return 1 of your other characters to your hand.' },
  41: { text: 'Appearance (Sword missions): discard 1 character on this mission.',
        appear: async (g, i, m) => { if (m.mode === 'atk') await g.killChoice(i.owner, m.sides.flat().filter(x => x !== i), 'Sasarai: discard a character'); } },
  42: { text: 'Needs a female character on your side. +2 Sword if no female is on the other side.',
        can: (g, p, m) => m.sides[p].some(x => g.def(x).sex === 'F'),
        mod: (g, i, m) => m && !m.sides[1 - i.owner].some(x => g.def(x).sex === 'F') ? { atk: 2 } : null },
  43: { text: 'Appearance: on army missions, the battle ends at once.',
        appear: async (g, i, m) => { if (m.mode === 'mil') m.forceEnd = true; } },
  44: { text: 'Unite: Vincent. When united, the opponent discards the top 2 cards of their deck.',
        appear: async (g, i) => { if (i.united) g.millTop(1 - i.owner, 2); } },
  45: { text: 'At the army decision, you may send 1 opponent character here back to their hand.' },
  46: { text: 'On a facility, the opponent needs +3 more to destroy it.',
        target: (g, src, m, p) => src.mission === m && m.mode === 'fac' && p !== m.owner && src.owner === m.owner ? 3 : 0 },
  47: { text: 'Your Highland characters get +1 Sword and +1 Hammer (self too).',
        aura: (g, src, inst) => inst.owner === src.owner && g.def(inst).camp === 'HL' ? { atk: 1, bld: 1 } : null },
  48: { text: 'Unite: Genshu. Cannot be used if Teresa is on the other side. +2 Sword with Teresa on your side.',
        can: (g, p) => !own(g, 1 - p, 'Teresa'),
        mod: (g, i) => own(g, i.owner, 'Teresa') ? { atk: 2 } : null },
  49: { text: '(Selection ability not used in this version.)' },
  50: { text: 'Appearance: discard the opponent character with the lowest Sword here.',
        appear: async (g, i, m) => {
          const t = m.sides[1 - i.owner]; if (!t.length) return;
          const min = Math.min(...t.map(x => g.stat(x, m).atk));
          await g.kill(t.find(x => g.stat(x, m).atk === min), i.owner);
        } },
  51: { text: 'Your characters on this mission are safe from opponent discard abilities.' },
  52: { text: 'Appearance: if the opponent has 2+ military characters here, they discard 1 of them.',
        appear: async (g, i, m) => {
          const t = m.sides[1 - i.owner].filter(x => g.stat(x, m).mil > 0);
          if (t.length >= 2) await g.killChoice(1 - i.owner, t, 'Tsai: discard one of your military characters', false, i.owner);
        } },
  53: { text: 'Unite: Hix. +1 Sword if Hix is in play.', mod: (g, i) => own(g, i.owner, 'Hix') ? { atk: 1 } : null },
  54: { text: 'Unite: Tsai. Tsai gets +1 Sword.',
        aura: (g, src, inst) => inst.owner === src.owner && g.def(inst).key === 'Tsai' ? { atk: 1 } : null },
  55: { text: 'Unite: Riou, Jowy.' },
  56: { text: 'Unite: Flik. +1 Sword with Flik on this mission.',
        mod: (g, i, m) => onSide(g, m, i.owner, 'Flik') ? { atk: 1 } : null },
  57: { text: 'Appearance: put up to 3 cards from your discard pile at the bottom of your deck.',
        appear: async (g, i) => g.recycle(i.owner, 3) },
  58: { text: 'Appearance: discard all characters on this mission (both sides).',
        appear: async (g, i, m) => { for (const x of m.sides.flat()) await g.kill(x, i.owner, true); } },
  59: { text: '+4 Sword this turn when Tengaar is discarded.' },
  60: { text: 'Appearance: you may discard this mission and everyone on it, if you played it.',
        appear: async (g, i, m) => {
          if (m.owner === i.owner && await g.confirm(i.owner, 'Pilika: discard this whole mission?', 'ai-pilika', m)) g.scrapMission(m);
        } },
  61: { text: 'Appearance: discard opponent characters here that link with their first character.',
        appear: async (g, i, m) => {
          const s = m.sides[1 - i.owner]; if (s.length < 2) return;
          const first = s[0];
          for (const x of s.slice(1)) if (g.linksWith(x, first)) await g.kill(x, i.owner);
        } },
  62: { text: '+2 Sword this turn when Yoshino unites with him.' },
  63: { text: '(Response ability not used in this version.)' },
  64: { text: '(Response ability not used in this version.)' },
  65: { text: 'Appearance: with Eilie and Rina on your side, the opponent discards 1 card and you discard 1 opponent character here.',
        appear: async (g, i, m) => {
          if (onSide(g, m, i.owner, 'Eilie') && onSide(g, m, i.owner, 'Rina')) {
            await g.discardChoice(1 - i.owner, 'Bolgan: discard 1 card');
            await g.killChoice(i.owner, m.sides[1 - i.owner], 'Bolgan: discard an opponent character');
          }
        } },
  66: { text: '+1 Hammer for each facility you have built.', mod: (g, i) => ({ bld: g.builtCount(i.owner) }) },
  67: { text: 'Unite: Kasumi. At the army decision, military = 200 x opponent characters here.',
        mod: (g, i, m) => m && g.deciding === m ? { mil: 200 * m.sides[1 - i.owner].length } : null },
  68: { text: 'Unite: Tai Ho. Tai Ho gets +1 Sword.',
        aura: (g, src, inst) => inst.owner === src.owner && g.def(inst).key === 'Tai Ho' ? { atk: 1 } : null },
  69: { text: 'Betrayal.', betrayal: true },
  70: { text: 'Unite: Freed Y.',
        appear: async (g, i, m) => { if (i.united) m.sides[i.owner].filter(x => g.def(x).key === 'Freed Y').forEach(x => x.tmp.atk += 2); } },
  71: { text: 'Betrayal. Discarded if the opponent adds a 1500+ military character to this mission.', betrayal: true },
  72: { text: 'Unite: Gustav. Your other City-State characters get +1 Sword.',
        aura: (g, src, inst) => inst.owner === src.owner && notSelf(src, inst) && g.def(inst).camp === 'CS' ? { atk: 1 } : null },
  73: { text: '+2 Sword, +100 military for each City-State character on the other side.',
        mod: (g, i, m) => { const n = m ? m.sides[1 - i.owner].filter(x => g.def(x).camp === 'CS').length : 0; return { atk: 2 * n, mil: 100 * n }; } },
  74: { text: 'Appearance (army missions): discard 1 character on this mission.',
        appear: async (g, i, m) => { if (m.mode === 'mil') await g.killChoice(i.owner, m.sides.flat().filter(x => x !== i), 'Luc: discard a character'); } },
  75: { text: 'If stationed at a Bar, your male characters get +1 Sword.',
        aura: (g, src, inst) => src.stationedOn === 187 && inst.owner === src.owner && g.def(inst).sex === 'M' ? { atk: 1 } : null },
  76: { text: 'Appearance: discard all characters on this mission with 0 military.',
        appear: async (g, i, m) => { for (const x of m.sides.flat()) if (g.stat(x, m).mil === 0) await g.kill(x, i.owner); } },
  77: { text: 'Unite: Koyu. +1 Sword with Gijimu here. With Gijimu and Koyu, the opponent discards a random card.',
        mod: (g, i, m) => onSide(g, m, i.owner, 'Gijimu') ? { atk: 1 } : null,
        appear: async (g, i, m) => { if (onSide(g, m, i.owner, 'Gijimu') && onSide(g, m, i.owner, 'Koyu')) g.discardRandom(1 - i.owner, 1); } },

  // Craftsmen
  78: { text: 'Can only be used on facilities.', can: (g, p, m) => m.mode === 'fac' },
  79: { text: '(Ability not used in this version.)' },
  80: { text: 'At the start of the opponent\'s turn, if Gordon is on a mission they played, they discard a random card.' },
  81: { text: 'Annallee, Pico and Alberto get +1 Hammer.',
        aura: (g, src, inst) => inst.owner === src.owner && ['Annallee', 'Pico', 'Alberto'].includes(g.def(inst).key) ? { bld: 1 } : null },
  82: { text: 'Appearance: discard every character here that has the same Sword as another one.',
        appear: async (g, i, m) => {
          const all = m.sides.flat().filter(x => x !== i);
          const v = all.map(x => g.stat(x, m).atk);
          for (const x of all.filter((x, k) => v.filter(a => a === v[k]).length > 1)) await g.kill(x, i.owner);
        } },
  83: { text: 'You ignore links on this mission. Appearance: play the top card of your deck here if you can, else discard it.',
        appear: async (g, i, m) => g.takiFlip(i, m) },
  84: { text: 'Stationed on a Bath: you get 1 VP.' },
  85: { text: 'Your characters here that link with Tessai get +1 Sword.',
        aura: (g, src, inst, m) => src.mission && src.mission === m && inst.owner === src.owner && notSelf(src, inst) && g.linksWith(inst, src) ? { atk: 1 } : null },
  86: { text: '(Ability not used in this version.)' },
  87: { text: 'Appearance: shuffle all missions and facilities from your discard pile into your deck.',
        appear: async (g, i) => g.templeton(i.owner) },
  88: { text: '(Selection ability not used in this version.)' },
  89: { text: 'Hai Yo gets +2 Sword.',
        aura: (g, src, inst) => inst.owner === src.owner && g.def(inst).key === 'Hai Yo' ? { atk: 2 } : null },
  90: { text: 'Can lead on Cooking Match (+1 Sword there). +1 Hammer on a Restaurant.',
        mod: (g, i, m) => m && m.card === 180 ? { bld: 1 } : null },
  91: { text: 'Your non-Highland characters with military get +100 military.',
        aura: (g, src, inst) => inst.owner === src.owner && g.def(inst).camp !== 'HL' && g.def(inst).mil > 0 ? { mil: 100 } : null },
  92: { text: '(Response ability not used in this version.)' },
  93: { text: 'Stationed on a Ranch: your missions and facilities need 1 less to clear.',
        target: (g, src, m, p) => src.stationedOn === 176 && p === src.owner ? -1 : 0 },
  94: { text: '(Response ability not used in this version.)' },
  95: { text: 'Appearance: if the opponent has no non-character card in hand, they discard the top 2 of their deck.',
        appear: async (g, i) => {
          const o = 1 - i.owner;
          if (!g.P[o].hand.some(h => g.def(h).type !== 'char')) g.millTop(o, 2);
          else g.log(`${g.P[o].name} shows a non-character card.`);
        } },

  // Free
  96: { text: '+1 Sword if Valeria is in play.', mod: (g, i) => g.anyKeyInPlay('Valeria') ? { atk: 1 } : null },
  97: { text: '' },
  98: { text: 'Appearance: compare Sword with the opponent\'s last character here. The lower one is discarded (both on a tie).',
        appear: async (g, i, m) => {
          const s = m.sides[1 - i.owner]; if (!s.length) return;
          const o = s[s.length - 1], a = g.stat(i, m).atk, b = g.stat(o, m).atk;
          if (a <= b) await g.kill(i, i.owner, true);
          if (b <= a) await g.kill(o, i.owner);
        } },
  99: { text: '+1 Hammer with Annallee, +2 Sword with Pico on your side.',
        mod: (g, i, m) => ({ bld: onSide(g, m, i.owner, 'Annallee') ? 1 : 0, atk: onSide(g, m, i.owner, 'Pico') ? 2 : 0 }) },
  100: { text: '+2 Sword if Hilda is stationed on your side. +1 Sword on Sindar Treasure.',
         mod: (g, i, m) => ({ atk: (g.stationedKey(i.owner, 'Hilda') ? 2 : 0) + (m && m.card === 159 ? 1 : 0) }) },
  101: { text: 'Unite: Pico, Alberto. Appearance: you must also play another human character from your hand here.',
         appear: async (g, i, m) => g.annallee(i, m) },
  102: { text: '-1 Sword if your side here has only human characters.',
         mod: (g, i, m) => m && m.sides[i.owner].every(x => isHuman(g.def(x))) ? { atk: -1 } : null },
  103: { text: '(Response ability not used in this version.)' },
  104: { text: '(Response ability not used in this version.)' },
  105: { text: '+4 Sword if Neclord is on the other side. +1 Sword on Suppress Neclord.',
         mod: (g, i, m) => ({ atk: (onSide(g, m, 1 - i.owner, 'Neclord') ? 4 : 0) + (m && m.card === 164 ? 1 : 0) }) },
  106: { text: 'Unite: Meg. +1 Sword this turn when united.',
         appear: async (g, i) => { if (i.united) i.tmp.atk += 1; } },
  107: { text: 'Needs a character with 3+ Sword on this mission. +3 Sword with Bolgan and Long Chan Chan on your side.',
         can: (g, p, m) => m.sides.flat().some(x => g.stat(x, m).atk >= 3),
         mod: (g, i, m) => onSide(g, m, i.owner, 'Bolgan') && onSide(g, m, i.owner, 'Long Chan Chan') ? { atk: 3 } : null },
  108: { text: '(Ability not used in this version.)' },
  109: { text: 'Cannot join a mission with Lorelai. +2 Sword on Sindar Treasure.',
         can: (g, p, m) => !m.sides.flat().some(x => g.def(x).key === 'Lorelai'),
         mod: (g, i, m) => m && m.card === 159 ? { atk: 2 } : null },
  110: { text: 'Betrayal. Appearance: discard the character with the most links on this mission.', betrayal: true,
         appear: async (g, i, m) => {
           const all = m.sides.flat().filter(x => x !== i); if (!all.length) return;
           const max = Math.max(...all.map(x => g.def(x).links.length));
           await g.killChoice(i.owner, all.filter(x => g.def(x).links.length === max), 'Gilbert: discard a character');
         } },
  111: { text: 'Appearance: you may discard 1 opponent character here. Then Clive is discarded.',
         appear: async (g, i, m) => {
           const t = m.sides[1 - i.owner];
           if (t.length && await g.killChoice(i.owner, t, 'Clive: discard an opponent character', true)) await g.kill(i, i.owner, true);
         } },
  112: { text: '+1 Sword for each opponent Leader here.',
         mod: (g, i, m) => ({ atk: m ? m.sides[1 - i.owner].filter(x => g.def(x).cls === 'L').length : 0 }) },
  113: { text: 'Appearance: the opponent discards 1 of their 3+ Sword characters here. Then Genshu is discarded. (Stats estimated.)',
         appear: async (g, i, m) => {
           const t = m.sides[1 - i.owner].filter(x => g.stat(x, m).atk >= 3);
           if (t.length) { await g.killChoice(1 - i.owner, t, 'Genshu: discard one of your characters', false, i.owner); await g.kill(i, i.owner, true); }
         } },
  114: { text: '+2 Sword if Kasumi is on your side.', mod: (g, i, m) => onSide(g, m, i.owner, 'Kasumi') ? { atk: 2 } : null },
  115: { text: '+2 Sword if Nanami is on your side, -1 if she is on the other side.',
         mod: (g, i) => ({ atk: (own(g, i.owner, 'Nanami') ? 2 : 0) - (own(g, 1 - i.owner, 'Nanami') ? 1 : 0) }) },
  116: { text: 'If no male is on your side, +1 Sword for each non-male character there.',
         mod: (g, i, m) => {
           if (!m) return null; const s = m.sides[i.owner];
           return s.some(x => g.def(x).sex === 'M') ? null : { atk: s.length };
         } },
  117: { text: 'Your rune characters (link I) get +1 Sword.',
         aura: (g, src, inst) => inst.owner === src.owner && g.def(inst).rune ? { atk: 1 } : null },
  118: { text: 'While Sierra is on a mission, Appearance abilities there do not work.' },
  119: { text: 'Unite: Chaco. Chaco loses his ability when with Sid.' },
  120: { text: 'Appearance: discard any number of cards from your hand and draw the same number. (Stats estimated.)',
         appear: async (g, i) => g.swapCards(i.owner) },
  121: { text: 'Unite: Kinnison. +1 Sword this turn when united.',
         appear: async (g, i) => { if (i.united) i.tmp.atk += 1; } },
  122: { text: 'Appearance: the opponent discards a random card. Viktor on your side gets +1 Sword.',
         aura: (g, src, inst, m) => src.mission === m && inst.owner === src.owner && g.def(inst).key === 'Viktor' ? { atk: 1 } : null,
         appear: async (g, i) => g.discardRandom(1 - i.owner, 1) },
  123: { text: 'Appearance: look at the opponent\'s hand and choose 1 card for them to discard.',
         appear: async (g, i) => g.nash(i.owner) },
  124: { text: 'When discarded from a mission, he goes to the bottom of your deck instead.' },
  125: { text: 'Beasts on your side get +1 Sword; beasts on the other side get -1.',
         aura: (g, src, inst, m) => src.mission && src.mission === m && g.def(inst).sex === 'B' ? { atk: inst.owner === src.owner ? 1 : -1 } : null },
  126: { text: 'Unite: Oulan. +1 Sword if your discard pile is bigger than the opponent\'s.',
         mod: (g, i) => g.P[i.owner].discard.length > g.P[1 - i.owner].discard.length ? { atk: 1 } : null },
  127: { text: 'Futch gets +1 Sword.',
         aura: (g, src, inst) => inst.owner === src.owner && g.def(inst).key === 'Futch' ? { atk: 1 } : null },
  128: { text: '+2 Sword with Annallee on your side.', mod: (g, i, m) => onSide(g, m, i.owner, 'Annallee') ? { atk: 2 } : null },
  129: { text: 'Appearance: swap Hilda with one of your stationed characters.', appear: async (g, i, m) => g.hilda(i, m) },
  130: { text: 'Unite: Ayda, Sigfried.' },
  131: { text: 'Unite: Humphrey. +3 Sword with Sasuke and Luc on your side. +3 Sword on Futch\'s Dragon.',
         mod: (g, i, m) => ({ atk: (onSide(g, m, i.owner, 'Sasuke') && onSide(g, m, i.owner, 'Luc') ? 3 : 0) + (m && m.card === 157 ? 3 : 0) }) },
  132: { text: '+4 Sword, +1000 military if Yuber is on the other side.',
         mod: (g, i, m) => onSide(g, m, 1 - i.owner, 'Yuber') ? { atk: 4, mil: 1000 } : null },
  133: { text: 'Unite: Riou. +1 Sword this turn when united. Goes back into your deck after the mission.',
         appear: async (g, i) => { if (i.united) i.tmp.atk += 1; } },
  134: { text: '+1 Sword for each other character on your side.', mod: (g, i, m) => ({ atk: m ? m.sides[i.owner].length - 1 : 0 }) },
  135: { text: '' },
  136: { text: 'Unite: Makumaku, Mukumuku, Mekumeku, Mokumoku.' },
  137: { text: '+2 Sword/+2 Hammer if no Millie is in either discard pile. +5 Sword with Tengaar and Meg on your side.',
         mod: (g, i, m) => {
           const r = { atk: 0, bld: 0 };
           if (!g.P.some(P => P.discard.some(d => g.def(d).key === 'Millie'))) { r.atk += 2; r.bld += 2; }
           if (onSide(g, m, i.owner, 'Tengaar') && onSide(g, m, i.owner, 'Meg')) r.atk += 5;
           return r;
         } },
  138: { text: 'If all five squirrels are on your side of a mission, you clear it at once.' },
  139: { text: 'Cancels the opponent\'s next Appearance ability this turn.',
         appear: async (g, i) => { g.P[1 - i.owner].appearBlock = true; } },
  140: { text: 'Appearance: you may take Gadget from your deck into your hand.', appear: async (g, i) => g.tutor(i.owner, 'Gadget') },
  141: { text: 'Needs another squirrel on your side.',
         can: (g, p, m) => m.sides[p].some(x => SQUIRRELS.includes(g.def(x).key)) },
  142: { text: 'The other squirrels get +1 Sword.',
         aura: (g, src, inst) => inst.owner === src.owner && notSelf(src, inst) && SQUIRRELS.includes(g.def(inst).key) && g.def(inst).key !== 'Mokumoku' ? { atk: 1 } : null },
  143: { text: 'Unite: Amada. +2 Sword for each Restaurant you built.', mod: (g, i) => ({ atk: 2 * g.builtCount(i.owner, 180) }) },
  144: { text: 'Appearance: look at the top card of your deck. Keep it or put it on the bottom.', appear: async (g, i) => g.richmond(i.owner) },
  145: { text: 'Appearance: both players shuffle hand, deck and discard pile together and draw a new hand.', appear: async (g) => g.leknaat() },
  146: { text: 'Cannot join a mission with Killey. +2 Sword on Sindar Treasure.',
         can: (g, p, m) => !m.sides.flat().some(x => g.def(x).key === 'Killey'),
         mod: (g, i, m) => m && m.card === 159 ? { atk: 2 } : null },
  147: { text: '-2 Sword if the opponent has built a Restaurant.', mod: (g, i) => g.builtCount(1 - i.owner, 180) ? { atk: -2 } : null },
  148: { text: 'Unite: Long Chan Chan. +1 Sword this turn when united.', appear: async (g, i) => { if (i.united) i.tmp.atk += 1; } },

  // Missions
  149: { text: 'After it is cleared, the loser discards a random card.', onClear: async (g, m, p) => g.discardRandom(1 - p, 1) },
  150: { text: 'Every character here has 1 Sword. Hai Yo can lead here.' },
  151: { text: 'Characters with 1000+ military cannot be used. The winner may discard 1 card and draw 1.',
         canUse: (g, d) => d.mil < 1000, onClear: async (g, m, p) => g.swapOne(p) },
  152: { text: 'Characters with 3+ Sword cannot be used. The winner\'s opponent discards a random card.',
         canUse: (g, d) => d.atk < 3, onClear: async (g, m, p) => g.discardRandom(1 - p, 1) },
  153: { text: 'Each side can use only 1 Leader here.', oneLeader: true },
  154: { text: 'Each side can use only 1 non-female character here.' },
  155: { text: 'The player who plays it chooses: Sword battle (8) or army battle (2000).' },
  156: { text: 'If the player who played it wins, they destroy 1 opponent facility.',
         onClear: async (g, m, p) => { if (p === m.owner) await g.destroyFacility(p); } },
  157: { text: 'Futch gets +3 Sword here and is stationed here if his side wins.' },
  158: { text: 'The opponent of the player who played it cannot Unite here. The winner may take 1 female character from here into their hand.',
         onClear: async (g, m, p) => g.takeBack(p, m, x => g.def(x).sex === 'F') },
  159: { text: 'The winner may take 1 of their characters from here into their hand.',
         onClear: async (g, m, p) => g.takeBack(p, m, () => true) },
  160: { text: 'Characters here lose their abilities.' },
  161: { text: 'Needs an opponent cleared mission. Owner chooses Sword (10) or army (2000+). If the owner wins, destroy 1 opponent cleared mission.',
         onClear: async (g, m, p) => { if (p === m.owner) await g.destroyCleared(p); } },
  162: { text: 'Toran characters get +1 Sword here. The winner may take a military character from their discard pile.',
         onClear: async (g, m, p) => g.fromDiscardPick(p, d => d.type === 'char' && d.mil > 0) },
  163: { text: 'The winner may build a facility from their hand at once (without its ability).',
         onClear: async (g, m, p) => g.northWindow(p) },
  164: { text: '' },
  165: { text: '' },
  166: { text: 'The player who plays it discards a random card.', onPlay: async (g, m) => g.discardRandom(m.owner, 1) },
  167: { text: '' },
  168: { text: 'Each side can use only 1 Leader here.', oneLeader: true },
  169: { text: 'The opponent discards a random card when this is played.', onPlay: async (g, m) => g.discardRandom(1 - m.owner, 1) },
  170: { text: 'Appearance abilities do not work here.' },
  171: { text: 'Characters with link H or I cannot be used.', canUse: (g, d) => !/[HI]/.test(d.links) },
  172: { text: '' },
  173: { text: '' },
  174: { text: 'Duel: each player picks a card from hand. Higher Sword wins. Non-characters count below 0; characters already in play count 0.' },
  175: { text: 'Duel: a random card from each hand. Higher Sword wins. On a tie, the player who played it wins.' },

  // Facilities
  176: { text: '' },
  177: { text: 'Once per turn, you may discard 1 card and draw 1.' },
  178: { text: '(Ability not used in this version.)' },
  179: { text: 'At the start of your turn, see 1 random card in the opponent\'s hand (per Appraiser).' },
  180: { text: '' },
  181: { text: '' },
  182: { text: 'Your rune characters (link I) get +1 Sword.',
         aura: (g, src, inst) => inst.owner === src.owner && g.def(inst).rune ? { atk: 1 } : null },
  183: { text: 'Your hand limit becomes 7.' },
  184: { text: 'At the start of your turn, put the top card of your discard pile at the bottom of your deck (per Warehouse).' },
  185: { text: 'Your facilities need 1 less Hammer (min 1). The opponent needs 1 more Sword to destroy yours.',
         target: (g, src, m, p) => m.mode !== 'fac' ? 0 : (p === src.owner && m.owner === p ? -1 : (p !== src.owner && m.owner === src.owner ? 1 : 0)) },
  186: { text: 'Your non-Leader characters get +1 Sword.',
         aura: (g, src, inst) => inst.owner === src.owner && g.def(inst).cls !== 'L' ? { atk: 1 } : null },
  187: { text: 'After you refill your hand, you may discard 1 card and draw 1.' },
  188: { text: '(Ability not used in this version.)' },
  189: { text: 'The first character you put on each mission gets +500 military.',
         aura: (g, src, inst, m) => m && inst.owner === src.owner && m.sides[inst.owner][0] === inst ? { mil: 500 } : null },
  190: { text: 'When the opponent discards in their main phase, they must discard 1 more card.' },
  191: { text: 'When built, the opponent discards their whole hand.' },
};

export function fxOf(id) { return FX[CARDS[id].base] || {}; }
for (const id in CARDS) CARDS[id].text = fxOf(+id).text || '';

export function cardSprite(id) {
  const i = id - 1;
  return { sheet: SHEETS[Math.floor(i / 50)], col: (i % 50) % 10, row: Math.floor((i % 50) / 10) };
}

// Simple price model (potch).
export function cardPrice(id) {
  const c = CARDS[id];
  let p;
  if (c.type === 'mm') p = 3000;
  else if (c.type === 'mission') p = 200 + 150 * (c.vp[0] + c.vp[1]);
  else if (c.type === 'facility') p = 600;
  else p = 120 + c.atk * 80 + c.mil / 8 + c.bld * 50 + (c.cls === 'L' ? 250 : 0);
  if (c.silver) p *= 4;
  return Math.round(p / 10) * 10;
}
