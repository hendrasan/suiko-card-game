// Battle screen state + human controller.
//
// The engine changes plain objects in place and compares them by identity.
// Thus we do not put engine objects into deep $state (a proxy is a different object).
// We use $state.raw and set new values. For the board, the engine calls
// onUpdate; we then increase `version`, and Battle.svelte draws the board again.

import { Game } from './game/engine.js';
import { AI } from './game/ai.js';
import { parseDeck } from './game/decks.js';
import { game, go, afterBattle } from './save.svelte.js';
import { sfx, battleSounds, resetBattleSounds } from './sound.svelte.js';

class BattleUI {
  g = $state.raw(null);     // the Game
  version = $state(0);      // +1 after each engine update
  req = $state.raw(null);   // open request to the human: {type: mulligan|main|deploy, m, opts, resolve}
  sel = $state.raw([]);     // selected hand cards
  modal = $state.raw(null); // {title, items, kind, min, max, picked, buttons, okLabel, skipLabel, resolve}
  detail = $state(null);    // card id in the detail panel
  onLeave = null;           // called with the winner when the player leaves the battle
  #raf = 0;

  start(g, onLeave) {
    this.g = g; this.req = null; this.sel = []; this.modal = null; this.detail = null;
    this.onLeave = onLeave;
    resetBattleSounds();
    g.onUpdate = () => this.schedule();
  }

  schedule() {
    if (!this.#raf) this.#raf = requestAnimationFrame(() => { this.#raf = 0; this.version++; battleSounds(this.g); });
  }

  ask(req) {
    if (req.type === 'main') sfx('attention', { emphasis: 'subtle' }); // your turn
    return new Promise(resolve => { this.sel = []; this.req = { ...req, resolve }; });
  }
  answer(v) {
    const r = this.req; this.req = null; this.sel = []; this.schedule(); r.resolve(v);
  }

  askModal(md) {
    sfx('open');
    return new Promise(resolve => { this.modal = { picked: [], ...md, resolve }; });
  }
  closeModal(v) {
    const md = this.modal; this.modal = null; this.schedule(); md.resolve(v);
  }
  // Select or unselect item i in the modal.
  pick(i) {
    const md = this.modal;
    let picked = md.picked;
    sfx('select', { direction: picked.includes(i) ? 'back' : 'forward' });
    if (picked.includes(i)) picked = picked.filter(x => x !== i);
    else if (md.max === 1) picked = [i];
    else if (picked.length < md.max) picked = [...picked, i];
    this.modal = { ...md, picked };
  }

  // Click on a hand card. In deploy you select 1 card; else many.
  toggleHand(c) {
    const req = this.req;
    if (!req) return;
    sfx('select', { direction: this.sel.includes(c) ? 'back' : 'forward' });
    if (req.type === 'deploy') this.sel = this.sel[0] === c ? [] : [c];
    else if (this.sel.includes(c)) this.sel = this.sel.filter(x => x !== c);
    else this.sel = [...this.sel, c];
  }
  // Double-click on a hand card sends it at once.
  quickSend(c) {
    const req = this.req;
    if (req && req.type === 'deploy' && !this.g.whyNot(0, c, req.m)) this.answer({ type: 'deploy', card: c });
  }
}

export const ui = new BattleUI();

// Human controller (same API as AI in game/ai.js).
export const Human = {
  async coin() {
    const i = await ui.askModal({ title: 'Coin toss! Call it.', buttons: ['Heads ★', 'Tails'] });
    return i === 0 ? 'heads' : 'tails';
  },
  mulligan(g, p) { return ui.ask({ type: 'mulligan' }); },
  main(g, p) { return ui.ask({ type: 'main' }); },
  deploy(g, p, m, opts) { return ui.ask({ type: 'deploy', m, opts }); },
  async unite(g, p, m, options, last) {
    const r = await ui.askModal({ title: `Unite with ${g.def(last).name}! Send another card at once?`, items: options, kind: 'card', min: 0, max: 1, okLabel: 'Unite!', skipLabel: 'No' });
    return r[0] || null;
  },
  async choose(g, p, req) {
    if (req.min === 1 && req.max === 1 && req.items.length === 1 && req.hint !== 'discard') return req.items.slice();
    return ui.askModal({ title: req.title, items: req.items, kind: req.kind, min: req.min, max: req.max });
  },
  async confirm(g, p, text) {
    return (await ui.askModal({ title: text, buttons: ['Yes', 'No'] })) === 0;
  },
  async duel(g, p, m) {
    const r = await ui.askModal({ title: 'Single combat: choose a card to fight with', items: g.P[p].hand.slice(), kind: 'card', min: 1, max: 1 });
    return r[0];
  },
};

// Start a battle against campaign opponent o, then show the battle screen.
export function startBattle(o) {
  const S = game.S;
  const g = new Game({
    players: [
      { name: S.name, deck: S.deck.slice(), mm: S.mm, vpTarget: o.vp[0], ctl: Human },
      { name: o.name, deck: parseDeck(o.deck), mm: o.mm, vpTarget: o.vp[1], ctl: AI },
    ],
  });
  ui.start(g, w => go('result', { win: w === 0, ...afterBattle(o, w, g) }));
  go('battle');
  g.run().catch(e => { console.error(e); g.log('Error: ' + e.message); });
}

// Data for the battle scene (Scene.svelte), or null when no battle or duel runs.
const MODE_NAMES = { atk: 'sword battle', mil: 'army battle', fac: 'facility', duel: 'duel' };
export function sceneOf(g) {
  const duel = g.duelShow;
  const m = g.active || (duel && duel.m);
  if (!m) return null;
  const sides = [0, 1].map(p => {
    if (duel) return { key: 'atk', total: Math.max(0, duel.v[p]), target: null, units: [], pick: duel.picks[p]?.id };
    const n = g.need(m, p);
    const units = m.sides[p].map(x => ({ uid: x.uid, id: x.id, base: g.def(x)[n.key], v: g.stat(x, m)[n.key] }));
    return { key: n.key, total: g.total(m, p, n.key), target: n.target, units };
  });
  return {
    uid: m.uid,
    card: m.card,
    theme: m.mode === 'fac' ? 'castle' : ['forest', 'desert', 'mountain'][m.card % 3],
    label: `${m.owner === 0 ? 'Your' : 'Enemy'} ${MODE_NAMES[m.mode] || 'mission'}`,
    sides,
  };
}
