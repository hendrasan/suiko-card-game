// AI against AI for all campaign decks. Usage: node tools/sim.js [games]
import { CARDS } from '../src/lib/game/cards.js';
import { parseDeck, STARTER_DECK, OPPONENTS } from '../src/lib/game/decks.js';
import { Game } from '../src/lib/game/engine.js';
import { AI } from '../src/lib/game/ai.js';

const N = +process.argv[2] || 50;

const problems = [];
function check(name, ids) {
  if (ids.length !== 50) problems.push(name + ' size ' + ids.length);
  const c = {};
  ids.forEach(i => { c[i] = (c[i] || 0) + 1; if (!CARDS[i]) problems.push(name + ' bad id ' + i); });
  for (const k in c) if (c[k] > 3) problems.push(name + ' >3 of ' + k);
}
check('starter', parseDeck(STARTER_DECK));
OPPONENTS.forEach(o => check(o.id, parseDeck(o.deck)));
for (let i = 1; i <= 250; i++) if (!CARDS[i]) problems.push('missing card ' + i);
console.log('problems', problems);

const stats = {};
let turns = 0, errs = 0;
for (let k = 0; k < N; k++) {
  const o = OPPONENTS[k % OPPONENTS.length];
  const g = new Game({ delay: 0, players: [
    { name: 'P', deck: parseDeck(STARTER_DECK), vpTarget: o.vp[0], ctl: AI },
    { name: o.name, deck: parseDeck(o.deck), mm: o.mm, vpTarget: o.vp[1], ctl: AI }] });
  try {
    const w = await g.run();
    stats[o.id] = stats[o.id] || [0, 0]; stats[o.id][w]++; turns += g.turnNo;
  } catch (e) {
    errs++; if (errs < 4) console.log('ERR', o.id, e.stack.split('\n').slice(0, 5).join('\n'), g.logs.slice(-6));
  }
}
console.log(JSON.stringify(stats), 'avg turns', (turns / N).toFixed(1), 'errors', errs);
