// Scenario tests for Response/Selection abilities (Pohl, Elza, Boris, Ridley, Stallion, Huan, Tuta,
// Karen, Inn, Kinnison, Oulan, Gambling Hall, Raura, Tenkou). Run: npm test
import assert from 'node:assert/strict';
import { CARDS } from '../src/lib/game/cards.js';
import { Game } from '../src/lib/game/engine.js';

const id = key => +Object.keys(CARDS).find(k => (CARDS[k].key === key || CARDS[k].name === key) && !CARDS[k].silver);
const anyId = f => +Object.keys(CARDS).find(k => !CARDS[k].silver && f(CARDS[k]));
// Test controller: says yes, picks the first item(s).
const ctl = { confirm: async () => true, choose: async (g, p, r) => r.items.slice(0, Math.max(r.min, Math.min(r.max, r.items.length))), unite: async () => null };
const filler = Array(30).fill(id('Bob'));
function setup() {
  const g = new Game({ delay: 0, players: [{ name: 'A', deck: filler.slice(), ctl }, { name: 'B', deck: filler.slice(), ctl }] });
  g.turnNo = 1;
  return g;
}
const inst = (g, key, p) => Object.assign(g.card(typeof key === 'number' ? key : id(key)), { owner: p });
const mission = (g, card, mode, owner = 0) => { const m = { uid: 9000 + g.missions.length, card, owner, sides: [[], []], mode, forceEnd: false }; g.missions.push(m); return m; };
const SWORD = anyId(c => c.type === 'mission' && c.mode === 'atk' && c.atk >= 8 && !c.text);
const SWORD2 = anyId(c => c.type === 'mission' && c.mode === 'atk' && c.id !== SWORD && !c.text);
const ARMY = anyId(c => c.type === 'mission' && c.mode === 'mil' && !c.text);
const BEAST = anyId(c => c.type === 'char' && c.sex === 'B');
const BIG = anyId(c => c.type === 'char' && c.mil >= 2000);
const names = list => list.map(x => CARDS[x.id ?? x].key);
const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test('Pohl: discarded instead of a random card', async () => {
  const g = setup(); g.P[0].hand = [inst(g, 'Pohl', 0), inst(g, 'Camus', 0), inst(g, 'Flik', 0)];
  await g.discardRandom(0, 1);
  assert.deepEqual(names(g.P[0].hand), ['Camus', 'Flik']);
});
test('Elza: saves the character, the enemy source is discarded', async () => {
  const g = setup(); const m = mission(g, SWORD, 'atk');
  const v = inst(g, 'Camus', 0), src = inst(g, 'Rina', 1);
  m.sides[0].push(v); m.sides[1].push(src); g.P[0].hand = [inst(g, 'Elza', 0)];
  g.appearing = src;
  await g.kill(v, 1, false);
  assert.ok(m.sides[0].includes(v)); assert.equal(m.sides[1].length, 0); assert.equal(g.P[0].hand.length, 0);
});
test('Elza: not used for own or self effects', async () => {
  const g = setup(); const m = mission(g, SWORD, 'atk');
  const v = inst(g, 'Camus', 0); m.sides[0].push(v); g.P[0].hand = [inst(g, 'Elza', 0)];
  await g.kill(v, 0, true);
  assert.equal(m.sides[0].length, 0); assert.equal(g.P[0].hand.length, 1);
});
test('Boris: replaces a discarded Ridley; army battle ends at once', async () => {
  const g = setup(); const m = mission(g, ARMY, 'mil');
  const r = inst(g, 'Ridley', 0); m.sides[0].push(r); g.P[0].hand = [inst(g, 'Boris', 0)];
  await g.kill(r, 1, false);
  assert.deepEqual(names(m.sides[0]), ['Boris']); assert.equal(m.forceEnd, true);
});
test('Ridley: returns to the hand before the clash', async () => {
  const g = setup(); const m = mission(g, ARMY, 'mil');
  m.sides[0].push(inst(g, 'Ridley', 0)); m.sides[1].push(inst(g, BIG, 1)); g.P[0].hand = [];
  await g.decide(m);
  assert.deepEqual(names(g.P[0].hand), ['Ridley']);
});
test('Stallion: losing army goes into the deck, not the discard pile', async () => {
  const g = setup(); const m = mission(g, ARMY, 'mil');
  m.sides[0].push(inst(g, 'Stallion', 0), inst(g, 'Camus', 0)); m.sides[1].push(inst(g, BIG, 1), inst(g, BIG === id('Culgan') ? 'Seed' : 'Culgan', 1));
  const deck0 = g.P[0].deck.length;
  await g.decide(m);
  assert.equal(g.P[0].discard.length, 0); assert.equal(g.P[0].deck.length, deck0 + 2);
});
test('Huan: losing army goes into the deck, Huan is discarded', async () => {
  const g = setup(); const m = mission(g, ARMY, 'mil');
  m.sides[0].push(inst(g, 'Camus', 0)); m.sides[1].push(inst(g, BIG, 1)); g.P[0].hand = [inst(g, 'Huan', 0)];
  const deck0 = g.P[0].deck.length;
  await g.decide(m);
  assert.deepEqual(g.P[0].discard.map(i => CARDS[i].key), ['Huan']); assert.equal(g.P[0].deck.length, deck0 + 1);
});
test('Huan: also works when a mission is scrapped', async () => {
  const g = setup(); const m = mission(g, SWORD, 'atk');
  m.sides[0].push(inst(g, 'Camus', 0)); g.P[0].hand = [inst(g, 'Huan', 0)];
  await g.scrapMission(m);
  assert.ok(!g.P[0].discard.includes(id('Camus')));
});
test('Tuta: one character lost in the clash goes under the deck', async () => {
  const g = setup(); const m = mission(g, ARMY, 'mil');
  m.sides[0].push(inst(g, 'Tuta', 0), inst(g, 'Camus', 0)); m.sides[1].push(inst(g, BIG, 1));
  await g.decide(m);
  assert.equal(g.P[0].discard.length, 1); assert.equal(CARDS[g.P[0].deck.at(-1)].key, 'Tuta');
});
test('Karen: next card here must have the same Sword', async () => {
  const g = setup(); const m = mission(g, SWORD, 'atk');
  m.sides[0].push(inst(g, 'Camus', 0));
  const karen = inst(g, 'Karen', 0); g.P[0].hand = [karen];
  await g.deploy(0, karen, m);
  const sameSword = anyId(c => c.type === 'char' && c.cls === 'L' && c.atk === CARDS[id('Karen')].atk && c.links.includes('E'));
  const otherSword = anyId(c => c.type === 'char' && c.cls === 'L' && c.atk !== CARDS[id('Karen')].atk && c.links.includes('E'));
  assert.match(g.whyNot(1, inst(g, otherSword, 1), m) || '', /Karen/);
  assert.ok(!/Karen/.test(g.whyNot(1, inst(g, sameSword, 1), m) || ''));
  const next = inst(g, sameSword, 1); g.P[1].hand = [next]; await g.deploy(1, next, m);
  assert.ok(!/Karen/.test(g.whyNot(0, inst(g, otherSword, 0), m) || ''), 'only the next card');
});
test('Inn: a character moves to the Inn; the old one goes to the hand', async () => {
  const g = setup(); const m = mission(g, SWORD, 'atk');
  const old = inst(g, 'Flik', 0);
  g.P[0].resolved.push({ uid: 1, card: id('Inn'), kind: 'facility', stationed: old, owner: 0 });
  m.sides[0].push(inst(g, 'Camus', 0), inst(g, 'Miklotov', 0)); g.P[0].hand = [];
  await g.resolveWin(m, 0);
  const innR = g.P[0].resolved.find(r => r.card === id('Inn'));
  assert.equal(CARDS[innR.stationed.id].key, 'Miklotov'); assert.deepEqual(names(g.P[0].hand), ['Flik']);
});
test('Kinnison: a beast here goes back into the deck', async () => {
  const g = setup(); const m = mission(g, SWORD, 'atk');
  m.sides[0].push(inst(g, 'Camus', 0), inst(g, 'Kinnison', 0), inst(g, BEAST, 0));
  const deck0 = g.P[0].deck.length;
  await g.resolveWin(m, 0);
  assert.equal(g.P[0].deck.length, deck0 + 1); assert.ok(g.P[0].deck.includes(BEAST));
});
test('Tuta: Sword clear puts 1 character under the deck', async () => {
  const g = setup(); const m = mission(g, SWORD, 'atk');
  m.sides[0].push(inst(g, 'Camus', 0), inst(g, 'Tuta', 0), inst(g, 'Flik', 0));
  await g.resolveWin(m, 0);
  assert.equal(CARDS[g.P[0].deck.at(-1)].key, 'Tuta');
});
test('Oulan: discard Oulan, take 2 characters back', async () => {
  const g = setup(); const m = mission(g, SWORD, 'atk');
  m.sides[0].push(inst(g, 'Camus', 0), inst(g, 'Flik', 0), inst(g, 'Miklotov', 0)); g.P[0].hand = [inst(g, 'Oulan', 0)];
  await g.resolveWin(m, 0);
  assert.deepEqual(names(g.P[0].hand).sort(), ['Flik', 'Miklotov']);
  assert.ok(g.P[0].discard.includes(id('Oulan')));
});
test('Stallion: Sword clear, fewer troops: losers go into the deck', async () => {
  const g = setup(); const m = mission(g, SWORD, 'atk');
  m.sides[0].push(inst(g, BIG, 0)); m.sides[1].push(inst(g, 'Stallion', 1), inst(g, 'Camus', 1));
  const deck1 = g.P[1].deck.length;
  await g.resolveWin(m, 0);
  assert.equal(g.P[1].discard.length, 0); assert.equal(g.P[1].deck.length, deck1 + 2);
});
test('Gambling Hall: a usable top card is deployed', async () => {
  const g = setup(); const m = mission(g, SWORD, 'atk');
  g.P[0].resolved.push({ uid: 1, card: id('Gambling Hall'), kind: 'facility', stationed: null, owner: 0 });
  g.P[0].hand = []; g.P[0].deck.unshift(id('Camus'));
  assert.ok(g.canGamble(0));
  const c = await g.gamble(0, m);
  assert.equal(CARDS[c.id].key, 'Camus'); assert.ok(m.sides[0].includes(c));
});
test('Gambling Hall: an unusable top card is discarded with the next one', async () => {
  const g = setup(); const m = mission(g, SWORD, 'atk');
  g.P[0].resolved.push({ uid: 1, card: id('Gambling Hall'), kind: 'facility', stationed: null, owner: 0 });
  g.P[0].hand = []; g.P[0].deck.unshift(SWORD2);
  const c = await g.gamble(0, m);
  assert.equal(c, null); assert.equal(g.P[0].discard.length, 2);
});
test('Raura: goes to another mission and the battle moves there', async () => {
  const g = setup(); const m = mission(g, SWORD, 'atk', 1); const m2 = mission(g, SWORD2, 'atk', 0);
  m2.sides[0].push(inst(g, 'Camus', 0));
  const raura = inst(g, 'Raura', 0); g.P[0].hand = [raura]; g.P[1].hand = [];
  let asked = 0;
  g.P[0].ctl = { ...ctl, deploy: async (g2, p, mm) => (asked++ === 0 ? { type: 'raura', card: raura, mission: m2 } : { type: 'pass' }) };
  g.P[1].ctl = { ...ctl, deploy: async () => ({ type: 'pass' }) };
  assert.equal(g.rauraTargets(0, m).length, 1);
  await g.battle(m, 0, false);
  assert.ok(m2.sides[0].includes(raura) || !g.missions.includes(m2)); assert.ok(g.missions.includes(m));
});
test('Tenkou: swaps your characters between two missions', async () => {
  const g = setup(); const m = mission(g, SWORD, 'atk'); const m2 = mission(g, SWORD2, 'atk');
  const a = inst(g, 'Camus', 0), b = inst(g, 'Flik', 0);
  m.sides[0].push(a); m2.sides[0].push(b);
  const t = inst(g, 'Tenkou', 0); g.P[0].hand = [t];
  await g.deploy(0, t, m);
  assert.ok(m.sides[0].includes(b) && m2.sides[0].includes(a));
});

let fail = 0;
for (const [name, fn] of tests) {
  try { await fn(); console.log('ok  ', name); }
  catch (e) { fail++; console.log('FAIL', name, '\n     ', e.message.split('\n')[0]); }
}
console.log(`${tests.length - fail}/${tests.length} passed`);
process.exit(fail ? 1 : 0);
