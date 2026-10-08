// Save data, shop and deck rules.
import { CARDS, CAMP_NAMES } from './game/cards.js';
import { parseDeck, STARTER_DECK } from './game/decks.js';
import { shuffle } from './game/engine.js';

const SAVE_KEY = 'suikoCS.save.v1';
export const MM_CAMPS = { 1: ['TR', 'NA'], 2: ['NA', 'CS'], 3: ['NA'], 4: ['CS', 'NA'], 5: ['CS', 'HL'], 6: ['HL'], 7: ['HL'] };
export const PACK_PRICE = 500;

// The current save. game.S is null until a game is started or loaded.
export const game = $state({ S: null });

export function newGame(name) {
  const deck = parseDeck(STARTER_DECK);
  const coll = {};
  deck.forEach(id => { coll[id] = (coll[id] || 0) + 1; });
  const seen = {};
  deck.forEach(id => { seen[id] = 1; });
  game.S = { name, potch: 1000, coll, deck, mm: null, beaten: {}, wins: 0, losses: 0, seen, shop: rollShop() };
  save();
}
export function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(game.S)); } catch (e) { /* storage blocked */ } }
export function load() { try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return null; } }
export function addCard(id, n = 1) { const S = game.S; S.coll[id] = (S.coll[id] || 0) + n; S.seen[id] = 1; }

export function rollShop() {
  const pool = [];
  for (let id = 8; id <= 191; id++) pool.push(id);
  return shuffle(pool).slice(0, 12).sort((a, b) => a - b);
}

// Random pack: mostly 8-191, small chance of mastermind or silver.
export function openPack() {
  const r = [];
  for (let k = 0; k < 5; k++) {
    const x = Math.random();
    let id;
    if (x < 0.04) id = 1 + Math.floor(Math.random() * 7);
    else if (x < 0.12) id = 192 + Math.floor(Math.random() * 59);
    else id = 8 + Math.floor(Math.random() * 184);
    r.push(id);
  }
  return r;
}

export function deckProblems(deck, mm) {
  const p = [];
  if (deck.length !== 50) p.push(`The deck must have 50 cards (now ${deck.length}).`);
  const cnt = {};
  deck.forEach(id => { cnt[id] = (cnt[id] || 0) + 1; });
  for (const id in cnt) if (cnt[id] > 3) p.push(`Max 3 copies of ${CARDS[id].name}.`);
  if (!deck.some(id => CARDS[id].cls === 'L')) p.push('The deck needs Leaders.');
  if (!deck.some(id => CARDS[id].type === 'mission' || CARDS[id].type === 'facility')) p.push('The deck needs missions.');
  if (mm) {
    const ok = MM_CAMPS[CARDS[mm].base];
    const bad = [...new Set(deck.filter(id => CARDS[id].type === 'char' && CARDS[id].camp !== 'IN' && !ok.includes(CARDS[id].camp)))];
    if (bad.length) p.push(`${CARDS[mm].name} allows only ${ok.map(c => CAMP_NAMES[c]).join(' / ')} (and Independent) characters. Remove: ${bad.slice(0, 4).map(id => CARDS[id].name).join(', ')}${bad.length > 4 ? '…' : ''}`);
  }
  return p;
}

// Rewards after a battle. Returns {lines, got} for the result screen.
export function afterBattle(o, w, g) {
  const S = game.S;
  const lines = [];
  const got = [];
  if (w === 0) {
    const first = !S.beaten[o.id];
    const pot = first ? o.reward : Math.round(o.reward / 2);
    S.potch += pot; S.wins++;
    lines.push(`You win ${pot} potch.`);
    const pool = parseDeck(o.deck);
    for (let k = 0; k < 2; k++) got.push(pool[Math.floor(Math.random() * pool.length)]);
    if (first) got.push(o.prize);
    S.beaten[o.id] = true;
  } else {
    S.potch += 50; S.losses++;
    lines.push('You lose... You get 50 potch for the effort.');
  }
  got.forEach(id => addCard(id));
  // Cards you saw in battle are logged in the card file.
  g.P.forEach(P => P.resolved.forEach(r => { S.seen[r.card] = 1; }));
  parseDeck(o.deck).forEach(id => { if (Math.random() < 0.3) S.seen[id] = 1; });
  S.shop = rollShop();
  save();
  return { lines, got };
}

// Screen navigation. nav.screen: title | name | hub | deck | file | rules | battle | result
export const nav = $state({ screen: 'title', tab: 'campaign', props: {} });
export function go(screen, props = {}) {
  nav.screen = screen;
  nav.props = props;
  if (screen === 'hub' && props.tab) nav.tab = props.tab;
}
