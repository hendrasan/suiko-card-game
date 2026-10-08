// Battle rules engine. Async: controllers return promises for every decision.
// Controller API (see ai.js and ui.js):
//   mulligan(g, p) -> [hand cards to return]
//   coin(g, p) -> 'heads' | 'tails'
//   main(g, p) -> {type:'discard', cards} | {type:'play', card, mode} | {type:'continue', mission} | {type:'trade', card}
//   deploy(g, p, m, opts) -> {type:'deploy', card} | {type:'pass'} | {type:'luca', inst}
//   unite(g, p, m, options) -> card | null
//   choose(g, p, req) -> [items]   req: {title, items, min, max, kind:'inst'|'card', hint}
//   confirm(g, p, text, hint, ctx) -> bool
//   duel(g, p, m) -> hand card

import { CARDS, SQUIRRELS, fxOf } from './cards.js';

let UID = 1;

export class Game {
  constructor(cfg) {
    // cfg: {players:[{name, deck:[ids], mm, vpTarget, ctl}], onUpdate, delay}
    this.P = cfg.players.map((c, i) => ({
      idx: i, name: c.name, deck: shuffle(c.deck.slice()), hand: [], discard: [], mm: c.mm || null,
      resolved: [], vp: 0, vpTarget: c.vpTarget || 5, ctl: c.ctl, reshuffled: false, appearBlock: false,
      revealed: false, peek: [], lucaUsed: false, tradeUsed: false,
    }));
    this.missions = [];
    this.turn = 0;
    this.turnNo = 0;
    this.logs = [];
    this.over = false;
    this.winner = null;
    this.deciding = null;
    this.onUpdate = cfg.onUpdate || (() => {});
    this.delay = cfg.delay == null ? 450 : cfg.delay;
    this.active = null; // mission in battle
  }

  // ---------- basic helpers ----------
  def(x) { return CARDS[typeof x === 'number' ? x : x.id]; }
  fx(x) { return fxOf(typeof x === 'number' ? x : x.id); }
  log(msg) { this.logs.push(msg); if (this.logs.length > 200) this.logs.shift(); this.update(); }
  update() { this.onUpdate(this); }
  pause(ms) { return new Promise(r => setTimeout(r, ms == null ? this.delay : ms)); }
  card(id) { return { uid: UID++, id, tmp: { atk: 0, mil: 0, bld: 0 } }; }
  handLimit(p) { return this.builtCount(p, 183) ? 7 : 6; }

  // All character instances of player p in play (missions + stationed).
  inPlayOf(p) {
    const r = [];
    for (const m of this.missions) r.push(...m.sides[p]);
    for (const res of this.P[p].resolved) if (res.stationed) r.push(res.stationed);
    return r;
  }
  allInPlay() { return this.inPlayOf(0).concat(this.inPlayOf(1)); }
  anyKeyInPlay(key) { return this.allInPlay().some(x => this.def(x).key === key); }
  anyCardInPlay(base) {
    return this.missions.some(m => this.def(m.card).base === base) || this.P.some(P => P.resolved.some(r => this.def(r.card).base === base));
  }
  stationedKey(p, key) { return this.P[p].resolved.some(r => r.stationed && this.def(r.stationed).key === key); }
  builtCount(p, base) {
    return this.P[p].resolved.filter(r => r.kind === 'facility' && (base == null || this.def(r.card).base === base)).length;
  }
  linksWith(a, b) {
    const la = this.def(a).links, lb = this.def(b).links;
    return [...la].some(ch => lb.includes(ch));
  }
  missionOf(inst) { return this.missions.find(m => m.sides[inst.owner].includes(inst)) || null; }

  // Is the card's text active where it is?
  textOn(inst) {
    const m = this.missionOf(inst);
    if (m && this.def(m.card).base === 160) return false;
    if (this.def(inst).key === 'Chaco' && m && m.sides[inst.owner].some(x => this.def(x).key === 'Sid')) return false;
    return true;
  }

  // Sources of auras: active chars in play, masterminds, built facilities with text.
  auraSources() {
    const r = [];
    for (const m of this.missions) for (const s of m.sides) for (const x of s) if (this.textOn(x)) { x.mission = m; x.stationedOn = null; r.push(x); }
    for (const P of this.P) {
      for (const res of P.resolved) {
        if (res.stationed) { const x = res.stationed; x.mission = null; x.stationedOn = this.def(res.card).base; r.push(x); }
        if (res.kind === 'facility' && !res.noText) r.push({ uid: 'f' + res.card + res.uid, id: res.card, owner: P.idx, isFacility: true });
      }
      if (P.mm) r.push({ uid: 'mm' + P.idx, id: P.mm, owner: P.idx, isMM: true });
    }
    return r;
  }

  // Current stats of a character instance. m = mission it is on (or null).
  stat(inst, m, opts = {}) {
    const d = this.def(inst);
    const s = { atk: d.atk, mil: d.mil, bld: d.bld };
    const add = r => { if (r) { s.atk += r.atk || 0; s.mil += r.mil || 0; s.bld += r.bld || 0; } };
    if (m === undefined) m = this.missionOf(inst);
    const fx = this.fx(inst);
    if (!opts.noSelf && fx.mod && this.textOn(inst)) add(fx.mod(this, inst, m));
    for (const src of this.auraSources()) {
      const f = this.fx(src);
      if (f.aura) add(f.aura(this, src, inst, m));
    }
    add(inst.tmp);
    if (m) {
      const mb = this.def(m.card).base;
      if (mb === 150) s.atk = 1 + (d.key === 'Hai Yo' ? 1 : 0);
      if (mb === 162 && d.camp === 'TR') s.atk += 1;
      if (this.deciding === m && d.key === 'Kiba' && inst.survived) s.mil = Math.max(s.mil, 2000);
    }
    s.atk = Math.max(0, s.atk); s.mil = Math.max(0, s.mil); s.bld = Math.max(0, s.bld);
    return s;
  }
  total(m, p, key) { return m.sides[p].reduce((a, x) => a + this.stat(x, m)[key], 0); }

  // What player p needs on mission m, and which stat counts.
  need(m, p) {
    const d = this.def(m.card);
    let key, base;
    if (m.mode === 'fac') { key = p === m.owner ? 'bld' : 'atk'; base = p === m.owner ? d.bld : d.atk; }
    else if (m.mode === 'mil') { key = 'mil'; base = m.milTarget || d.mil; }
    else { key = 'atk'; base = d.atk; }
    let t = base;
    for (const src of this.auraSources()) {
      const f = this.fx(src);
      if (f.target) t += f.target(this, src, m, p);
    }
    if (key === 'mil') return { key, target: Math.max(100, t) };
    return { key, target: Math.max(1, t) };
  }

  // ---------- card movement ----------
  draw(p, n) {
    const P = this.P[p];
    for (let k = 0; k < n; k++) {
      if (P.hand.length >= this.handLimit(p)) break;
      if (!P.deck.length) {
        if (P.mm && this.def(P.mm).base === 1 && !P.reshuffled && P.discard.length) {
          P.reshuffled = true; P.deck = shuffle(P.discard.splice(0)); this.log(`${P.name}: McDohl reshuffles the discard pile into a new deck.`);
        } else break;
      }
      P.hand.push(this.card(P.deck.shift()));
    }
    this.update();
  }
  refill(p) { this.draw(p, this.handLimit(p) - this.P[p].hand.length); }
  toDiscard(p, id) { this.P[p].discard.push(id); }
  removeFromHand(p, c) { const h = this.P[p].hand; const i = h.indexOf(c); if (i >= 0) h.splice(i, 1); }
  discardFromHand(p, c) { this.removeFromHand(p, c); this.toDiscard(p, c.id); }
  discardHand(p) { const P = this.P[p]; P.hand.forEach(c => this.toDiscard(p, c.id)); P.hand = []; this.log(`${P.name} discards the whole hand.`); }
  discardRandom(p, n) {
    const P = this.P[p];
    for (let k = 0; k < n && P.hand.length; k++) {
      const c = P.hand[Math.floor(Math.random() * P.hand.length)];
      this.discardFromHand(p, c); this.log(`${P.name} discards ${this.def(c).name} (random).`);
    }
  }
  millTop(p, n) {
    const P = this.P[p];
    for (let k = 0; k < n && P.deck.length; k++) { const id = P.deck.shift(); this.toDiscard(p, id); this.log(`${P.name} loses ${CARDS[id].name} from the top of the deck.`); }
  }
  async discardChoice(p, title) {
    const P = this.P[p];
    if (!P.hand.length) return null;
    const [c] = await P.ctl.choose(this, p, { title, items: P.hand.slice(), min: 1, max: 1, kind: 'card', hint: 'discard' });
    this.discardFromHand(p, c); this.log(`${P.name} discards ${this.def(c).name}.`);
    return c;
  }

  // Remove a character from its mission. by = player who caused it. self = own effect, ignore Chaco.
  async kill(inst, by, self) {
    const m = this.missionOf(inst);
    if (!m) return false;
    const side = m.sides[inst.owner];
    if (!self && by !== inst.owner && side.some(x => this.def(x).key === 'Chaco' && this.textOn(x))) {
      this.log(`Chaco protects ${this.def(inst).name}.`); return false;
    }
    side.splice(side.indexOf(inst), 1);
    this.leaveMission(inst);
    this.log(`${this.def(inst).name} (${this.P[inst.owner].name}) is discarded.`);
    if (this.def(inst).key === 'Tengaar') {
      for (const x of this.inPlayOf(inst.owner)) if (this.def(x).key === 'Hix' && !x.hixDone) { x.tmp.atk += 4; x.hixDone = true; }
    }
    return true;
  }
  leaveMission(inst) {
    const P = this.P[inst.owner];
    if (this.def(inst).key === 'Neclord') P.deck.push(inst.id);
    else P.discard.push(inst.id);
  }
  async killChoice(p, list, title, optional, causer) {
    if (!list.length) return null;
    const [x] = await this.P[p].ctl.choose(this, p, { title, items: list, min: optional ? 0 : 1, max: 1, kind: 'inst', hint: causer != null ? 'ownLoss' : 'harm' });
    if (!x) return null;
    await this.kill(x, causer != null ? causer : p);
    return x;
  }

  // ---------- deploy rules ----------
  isUniqueBlocked(p, d) {
    // returns null if free, 'own' if own copy in play, 'opp' if opponent copy in play
    for (const x of this.allInPlay()) if (this.def(x).key === d.key) return x.owner === p ? 'own' : 'opp';
    return null;
  }
  hasBetrayal(p, d) { return !!fxOf(d.id).betrayal || (this.P[p].mm && this.def(this.P[p].mm).base === 5); }

  // Why card c (in hand) cannot go on mission m for player p. Returns null if legal.
  whyNot(p, c, m, opts = {}) {
    const d = this.def(c);
    if (d.type !== 'char') return 'Not a character';
    if (m.mode === 'duel') return 'Duel';
    const u = this.isUniqueBlocked(p, d);
    if (u === 'own' || (u === 'opp' && !this.hasBetrayal(p, d))) return 'Unique: already in play';
    const side = m.sides[p];
    const mb = this.def(m.card).base;
    const fx = this.fx(c);
    if (!side.length && !opts.ignoreLinks) {
      const adlai = this.P[p].mm && this.def(this.P[p].mm).base === 3 && d.cls === 'R';
      const haiyo = mb === 150 && d.key === 'Hai Yo';
      if (d.cls !== 'L' && !adlai && !haiyo) return 'Needs a Leader first';
    } else if (side.length && !opts.ignoreLinks) {
      const taki = side.some(x => this.def(x).key === 'Taki' && this.textOn(x));
      const letters = new Set(side.flatMap(x => [...this.def(x).links]));
      if (!taki && ![...d.links].some(ch => letters.has(ch))) return 'No matching link';
    }
    const mfx = fxOf(m.card);
    if (mfx.canUse && !mfx.canUse(this, d, m, p)) return 'Not allowed on this mission';
    if (mfx.oneLeader && d.cls === 'L' && side.some(x => this.def(x).cls === 'L')) return 'Only 1 Leader here';
    if (mb === 154 && d.sex !== 'F' && side.some(x => this.def(x).sex !== 'F')) return 'Only 1 non-female here';
    if (mb === 158 && opts.united && p !== m.owner) return 'No Unite here';
    if (fx.can && mb !== 160 && !fx.can(this, p, m)) return 'Condition not met';
    return null;
  }
  legalCards(p, m, opts) { return this.P[p].hand.filter(c => !this.whyNot(p, c, m, opts)); }

  async deploy(p, c, m, opts = {}) {
    const P = this.P[p];
    this.removeFromHand(p, c);
    const inst = c;
    inst.owner = p; inst.united = !!opts.united; inst.tmp = { atk: 0, mil: 0, bld: 0 };
    const d = this.def(inst);
    // Betrayal: opponent's copy leaves play.
    const u = this.isUniqueBlocked(p, d);
    if (u === 'opp') {
      const other = this.allInPlay().find(x => this.def(x).key === d.key);
      this.log(`${d.name} betrays ${this.P[other.owner].name}!`);
      await this.killAny(other);
    }
    m.sides[p].push(inst);
    this.log(`${P.name} sends ${d.name} to ${this.def(m.card).name}${inst.united ? ' (Unite!)' : ''}.`);
    // Rowd leaves if a 1500+ military character joins against him.
    for (const x of m.sides[1 - p].slice()) {
      if (this.def(x).key === 'Rowd' && this.textOn(x) && this.stat(inst, m).mil >= 1500) { this.log('Rowd runs away!'); await this.kill(x, x.owner, true); }
    }
    this.update();
    await this.pause();
    await this.appear(inst, m);
  }
  async killAny(inst) {
    const m = this.missionOf(inst);
    if (m) { await this.kill(inst, 1 - inst.owner, true); return; }
    for (const P of this.P) for (const r of P.resolved) if (r.stationed === inst) { r.stationed = null; this.leaveMission(inst); this.log(`${this.def(inst).name} leaves the post.`); }
  }
  async appear(inst, m) {
    const f = this.fx(inst);
    if (!f.appear) return;
    const mb = this.def(m.card).base;
    if (mb === 160 || mb === 170) return;
    if (m.sides.flat().some(x => x !== inst && this.def(x).key === 'Sierra' && this.textOn(x))) { this.log('Sierra blocks the Appearance ability.'); return; }
    const P = this.P[inst.owner];
    if (P.appearBlock) { P.appearBlock = false; this.log(`Mazus cancels ${this.def(inst).name}'s ability.`); return; }
    if (!this.missionOf(inst)) return;
    await f.appear(this, inst, m);
    this.update();
  }

  // ---------- turn flow ----------
  async run() {
    for (const p of [0, 1]) this.refill(p);
    this.log('Coin toss!');
    const call = await this.P[0].ctl.coin(this, 0);
    const flip = Math.random() < 0.5 ? 'heads' : 'tails';
    this.turn = call === flip ? 0 : 1;
    this.log(`The coin shows ${flip}. ${this.P[this.turn].name} goes first.`);
    for (const p of [0, 1]) {
      const back = await this.P[p].ctl.mulligan(this, p);
      if (back.length) {
        const P = this.P[p];
        back.slice(0, 3).forEach(c => { this.removeFromHand(p, c); P.deck.push(c.id); });
        P.deck = shuffle(P.deck);
        this.refill(p);
        this.log(`${P.name} returns ${back.length} card(s) and draws again.`);
      }
    }
    while (!this.over) {
      await this.takeTurn(this.turn);
      if (this.over) break;
      this.turn = 1 - this.turn;
      if (this.turnNo > 400) this.endByCount();
    }
    this.update();
    return this.winner;
  }

  async takeTurn(p) {
    const P = this.P[p], O = this.P[1 - p];
    this.turnNo++;
    P.lucaUsed = false; P.tradeUsed = false; O.appearBlock = false;
    for (const x of this.allInPlay()) { x.tmp = { atk: 0, mil: 0, bld: 0 }; x.hixDone = false; }
    this.log(`— Turn ${this.turnNo}: ${P.name} —`);
    if (!P.hand.length && !P.deck.length) { this.log(`${P.name} has no cards left.`); return this.finish(1 - p); }
    await this.startOfTurn(p);
    if (this.over) return;
    const act = await P.ctl.main(this, p);
    if (act.type === 'discard') {
      act.cards.forEach(c => this.discardFromHand(p, c));
      this.log(`${P.name} discards ${act.cards.length} card(s).`);
    } else if (act.type === 'play') {
      await this.playMission(p, act.card, act.mode);
    } else if (act.type === 'continue') {
      this.log(`${P.name} continues ${this.def(act.mission.card).name}.`);
      await this.battle(act.mission, p, true);
    }
    if (this.over) return;
    // Replenish phase
    this.refill(p); this.refill(1 - p);
    if (P.mm && this.def(P.mm).base === 4) await this.optSwap(p, 'Annabelle');
    for (let k = 0; k < this.builtCount(p, 187); k++) await this.optSwap(p, 'Bar');
    this.update();
    await this.pause();
  }

  async startOfTurn(p) {
    const P = this.P[p], o = 1 - p;
    // Gordon on an unsolved mission played by p (owned by the other player? Gordon belongs to opponent)
    for (const m of this.missions) {
      if (m.owner === p && m.sides[o].some(x => this.def(x).key === 'Gordon' && this.textOn(x))) { this.log('Gordon causes trouble!'); this.discardRandom(p, 1); }
    }
    for (let k = 0; k < this.builtCount(p, 184); k++) {
      if (P.discard.length) { const id = P.discard.pop(); P.deck.push(id); this.log(`Warehouse: ${CARDS[id].name} goes to the bottom of the deck.`); }
    }
    P.peek = [];
    const n = this.builtCount(p, 179);
    if (n) P.peek = shuffle(this.P[o].hand.slice()).slice(0, n).map(c => c.uid);
    if (this.builtCount(p, 177)) await this.optSwap(p, 'Trading Post');
    this.update();
  }

  minDiscard(p) { return Math.min(this.P[p].hand.length, 1 + this.builtCount(1 - p, 190)); }
  canPlayMission(p, c) {
    const d = this.def(c);
    if (d.type !== 'mission' && d.type !== 'facility') return false;
    if (this.missions.filter(m => m.owner === p).length >= 2) return false;
    if (this.missions.length >= 4) return false;
    if (d.base === 161 && !this.P[1 - p].resolved.some(r => r.kind === 'mission')) return false;
    return true;
  }
  canContinue(p, m) { return this.legalCards(p, m).length > 0; }

  async playMission(p, c, mode) {
    const P = this.P[p], d = this.def(c);
    this.removeFromHand(p, c);
    const m = { uid: UID++, card: d.id, owner: p, sides: [[], []], mode: d.mode, forceEnd: false };
    if (d.mode === 'choose') { m.mode = mode === 'mil' ? 'mil' : 'atk'; if (d.base === 161 && m.mode === 'mil') m.milTarget = 2500; }
    this.missions.push(m);
    this.log(`${P.name} plays ${d.name}${d.mode === 'choose' ? (m.mode === 'mil' ? ' (army battle)' : ' (Sword battle)') : ''}.`);
    this.update();
    await this.pause();
    // Klaus response
    const o = 1 - p, O = this.P[o];
    const klaus = O.hand.find(h => this.def(h).key === 'Klaus');
    const other = O.hand.find(h => this.def(h).type !== 'char');
    if (klaus && other && O.vp < P.vp && await O.ctl.confirm(this, o, `Klaus: cancel ${d.name}?`, 'klaus', m)) {
      this.discardFromHand(o, klaus); this.discardFromHand(o, other);
      this.missions.splice(this.missions.indexOf(m), 1); this.toDiscard(p, d.id);
      this.log(`Klaus cancels ${d.name}!`);
      return;
    }
    const f = fxOf(d.id);
    if (f.onPlay) await f.onPlay(this, m);
    if (m.mode === 'duel') return this.duel(m);
    await this.battle(m, 1 - p, false);
  }

  // Deploy step: players alternate. first = who acts first.
  async battle(m, first, mustPlay) {
    this.active = m;
    let actor = first, passes = 0, mustPlayFor = mustPlay ? first : -1;
    m.forceEnd = false;
    while (!this.over && this.missions.includes(m)) {
      if (m.forceEnd) { this.log('The battle ends at once!'); break; }
      const P = this.P[actor];
      const legal = this.legalCards(actor, m);
      let act = { type: 'pass' };
      if (legal.length || (P.mm && this.def(P.mm).base === 7 && !P.lucaUsed && m.sides[actor].length)) {
        act = await P.ctl.deploy(this, actor, m, { mustPlay: mustPlayFor === actor && legal.length > 0 });
      }
      if (act.type === 'deploy') {
        passes = 0; mustPlayFor = -1;
        await this.deploy(actor, act.card, m);
        await this.uniteChain(actor, act.card, m);
        if (await this.checkClear(m)) break;
      } else if (act.type === 'luca') {
        P.lucaUsed = true; passes = 0;
        this.log('Luca Blight: "Fight to the death, pigs!"');
        await this.kill(act.inst, actor, true); this.discardRandom(1 - actor, 1);
        continue;
      } else {
        this.log(`${P.name} passes.`);
        passes++;
        if (passes >= 2) break;
      }
      actor = 1 - actor;
      await this.pause(this.delay / 2);
    }
    if (!this.over && this.missions.includes(m)) await this.decide(m);
    this.active = null;
    this.update();
  }

  async uniteChain(p, inst, m) {
    let last = inst;
    while (!this.over && this.missions.includes(m) && m.sides[p].includes(last)) {
      const names = this.def(last).unite;
      const lastKey = this.def(last).key;
      const opts = this.P[p].hand.filter(c => {
        const d = this.def(c);
        if (d.type !== 'char' || !(names.includes(d.key) || d.unite.includes(lastKey))) return false;
        return !this.whyNot(p, c, m, { ignoreLinks: true, united: true });
      });
      if (!opts.length) return;
      const c = await this.P[p].ctl.unite(this, p, m, opts, last);
      if (!c) return;
      await this.deploy(p, c, m, { united: true });
      last = c;
      if (await this.checkClear(m)) return;
    }
  }

  // Check Sword/Hammer clear conditions right away.
  async checkClear(m) {
    if (!this.missions.includes(m)) return true;
    // Squirrels
    for (const p of [0, 1]) {
      const keys = new Set(m.sides[p].map(x => this.def(x).key));
      if (SQUIRRELS.every(k => keys.has(k)) && m.sides[p].some(x => this.def(x).key === 'Mukumuku')) {
        this.log('All five squirrels! The mission is cleared!');
        await this.resolveWin(m, p, m.mode === 'fac' && p !== m.owner ? 'destroy' : null); return true;
      }
    }
    if (m.mode !== 'atk' && m.mode !== 'fac') return false;
    const order = this.active === m ? [0, 1] : [m.owner, 1 - m.owner];
    for (const p of order) {
      if (!m.sides[p].length) continue;
      const n = this.need(m, p);
      if (this.total(m, p, n.key) >= n.target) {
        if (m.mode === 'fac' && p !== m.owner) { await this.resolveWin(m, p, 'destroy'); return true; }
        await this.resolveWin(m, p); return true;
      }
    }
    return false;
  }

  // Decision step (after both pass).
  async decide(m) {
    if (m.mode !== 'mil') return this.checkClear(m);
    if (!m.sides[0].length && !m.sides[1].length) return;
    // Shu: send 1 opponent character back to hand
    for (const p of [0, 1]) {
      const shu = m.sides[p].find(x => this.def(x).key === 'Shu' && this.textOn(x));
      const o = 1 - p;
      if (shu && m.sides[o].length && this.P[o].hand.length < this.handLimit(o)) {
        const [x] = await this.P[p].ctl.choose(this, p, { title: 'Shu: send an enemy back to the hand?', items: m.sides[o].slice(), min: 0, max: 1, kind: 'inst', hint: 'harm' });
        if (x) { m.sides[o].splice(m.sides[o].indexOf(x), 1); x.tmp = { atk: 0, mil: 0, bld: 0 }; this.P[o].hand.push(x); this.log(`Shu sends ${this.def(x).name} back.`); }
      }
    }
    this.deciding = m;
    const A = this.total(m, 0, 'mil'), B = this.total(m, 1, 'mil');
    this.log(`Army clash! ${this.P[0].name} ${A} vs ${this.P[1].name} ${B}`);
    this.update();
    await this.pause(this.delay * 2);
    if (A === B) {
      for (const x of m.sides.flat()) await this.kill(x, x.owner, true);
      this.log('Both armies are wiped out.');
    } else {
      const w = A > B ? 0 : 1, lost = Math.min(A, B);
      for (const x of m.sides[1 - w].slice()) await this.kill(x, x.owner, true);
      if (lost > 0) {
        const rem = this.pickLosses(m, w, lost);
        for (const x of rem) await this.kill(x, x.owner, true);
      }
      m.sides[w].forEach(x => { x.survived = true; });
      const left = this.total(m, w, 'mil');
      const n = this.need(m, w);
      this.log(`${this.P[w].name} has ${left} troops left (needs ${n.target}).`);
      if (left >= n.target && m.sides[w].length) { this.deciding = null; await this.resolveWin(m, w); }
    }
    this.deciding = null;
    m.sides.flat().forEach(x => { x.survived = false; });
    this.update();
  }

  // Choose the cheapest set of characters whose military covers `lost`.
  pickLosses(m, p, lost) {
    const s = m.sides[p].filter(x => this.stat(x, m).mil > 0);
    let best = null, bestSum = Infinity, bestN = Infinity;
    const n = s.length;
    for (let mask = 1; mask < (1 << n); mask++) {
      let sum = 0, cnt = 0;
      for (let k = 0; k < n; k++) if (mask & (1 << k)) { sum += this.stat(s[k], m).mil; cnt++; }
      if (sum >= lost && (sum < bestSum || (sum === bestSum && cnt < bestN))) { best = mask; bestSum = sum; bestN = cnt; }
    }
    if (best == null) return s;
    return s.filter((x, k) => best & (1 << k));
  }

  // Winner takes the mission. how = 'destroy' for a destroyed facility.
  async resolveWin(m, p, how) {
    const d = this.def(m.card), P = this.P[p];
    this.missions.splice(this.missions.indexOf(m), 1);
    if (how === 'destroy') {
      this.log(`${P.name} destroys ${d.name}!`);
      for (const x of m.sides.flat()) this.leaveMission(x);
      this.toDiscard(m.owner, d.id);
      this.update();
      return;
    }
    const isFac = m.mode === 'fac';
    this.log(isFac ? `${P.name} builds ${d.name}!` : `${P.name} clears ${d.name}!`);
    // Station a character
    let st = null;
    const can = m.sides[p].filter(x => !this.fx(x).noStation || !this.textOn(x));
    if (d.base === 157) st = can.find(x => this.def(x).key === 'Futch') || null;
    if (!st && can.length) {
      [st] = await P.ctl.choose(this, p, { title: `Station a character on ${d.name}`, items: can, min: 1, max: 1, kind: 'inst', hint: 'station' });
    }
    if (st) { m.sides[p].splice(m.sides[p].indexOf(st), 1); st.tmp = { atk: 0, mil: 0, bld: 0 }; }
    const res = { uid: UID++, card: d.id, kind: isFac ? 'facility' : 'mission', stationed: st, owner: m.owner };
    P.resolved.push(res);
    // Kouyu
    if (m.sides[p].some(x => this.def(x).key === 'Koyu' && this.textOn(x)) || (st && this.def(st).key === 'Koyu')) {
      const t = m.sides[p].filter(x => this.def(x).key !== 'Koyu');
      if (t.length && P.hand.length < this.handLimit(p)) {
        const [x] = await P.ctl.choose(this, p, { title: 'Koyu: return a character to your hand?', items: t, min: 0, max: 1, kind: 'inst', hint: 'keep' });
        if (x) { m.sides[p].splice(m.sides[p].indexOf(x), 1); P.hand.push(x); }
      }
    }
    const f = fxOf(d.id);
    if (f.onClear) await f.onClear(this, m, p);
    // Everyone else leaves.
    for (const x of m.sides.flat()) {
      if (this.def(x).key === 'Hoi') { this.P[x.owner].deck.push(x.id); this.P[x.owner].deck = shuffle(this.P[x.owner].deck); }
      else this.leaveMission(x);
    }
    m.sides = [[], []];
    // VP
    if (!isFac) {
      const vp = p === m.owner ? d.vp[0] : d.vp[1];
      this.addVP(p, vp, d.name);
    } else {
      if (P.mm && this.def(P.mm).base === 2) this.addVP(p, 1, 'Riou');
      if (d.base === 181 && st && this.def(st).key === 'Tetsu') this.addVP(p, 1, 'Tetsu at the Bath');
      if (d.base === 191) this.discardHand(1 - p);
    }
    this.update();
    await this.pause();
  }

  addVP(p, n, why) {
    const P = this.P[p];
    P.vp += n;
    this.log(`${P.name} gets ${n} VP (${why}). ${P.vp}/${P.vpTarget}`);
    if (P.vp >= P.vpTarget) this.finish(p);
  }
  finish(p) {
    if (this.over) return;
    this.over = true; this.winner = p;
    this.log(`${this.P[p].name} wins the battle!`);
    this.update();
  }
  endByCount() {
    const a = this.P[0].vpTarget - this.P[0].vp, b = this.P[1].vpTarget - this.P[1].vp;
    this.finish(a <= b ? 0 : 1);
  }

  // Duels (Single Combat)
  async duel(m) {
    const d = this.def(m.card), random = d.base === 175;
    const picks = [];
    for (const p of [0, 1]) {
      const P = this.P[p];
      if (!P.hand.length) { picks.push(null); continue; }
      let c;
      if (random) c = P.hand[Math.floor(Math.random() * P.hand.length)];
      else c = await P.ctl.duel(this, p, m);
      this.removeFromHand(p, c);
      picks.push(c);
    }
    const val = (p, c) => {
      if (!c) return -2;
      const cd = this.def(c);
      if (cd.type !== 'char') return -1;
      if (this.isUniqueBlocked(p, cd)) return 0;
      c.owner = p;
      return this.stat(c, null, { noSelf: true }).atk;
    };
    const v = [val(0, picks[0]), val(1, picks[1])];
    this.log(`Single combat: ${picks[0] ? this.def(picks[0]).name : '-'} (${v[0]}) vs ${picks[1] ? this.def(picks[1]).name : '-'} (${v[1]})`);
    this.duelShow = { picks, v };
    this.update();
    await this.pause(this.delay * 3);
    this.duelShow = null;
    picks.forEach((c, p) => c && this.toDiscard(p, c.id));
    this.missions.splice(this.missions.indexOf(m), 1);
    let w = null;
    if (v[0] !== v[1]) w = v[0] > v[1] ? 0 : 1;
    else if (random && picks[0] && picks[1] && this.def(picks[0]).key !== this.def(picks[1]).key && v[0] >= 0) w = m.owner;
    if (w == null) { this.log('A draw. The duel card is discarded.'); this.toDiscard(m.owner, d.id); this.update(); return; }
    this.P[w].resolved.push({ uid: UID++, card: d.id, kind: 'mission', stationed: null, owner: m.owner });
    this.addVP(w, w === m.owner ? d.vp[0] : d.vp[1], d.name);
    this.update();
  }

  // ---------- helpers used by abilities ----------
  confirm(p, text, hint, ctx) { return this.P[p].ctl.confirm(this, p, text, hint, ctx); }
  async optSwap(p, who) {
    const P = this.P[p];
    if (!P.hand.length || !P.deck.length) return;
    const [c] = await P.ctl.choose(this, p, { title: `${who}: discard 1 card and draw 1?`, items: P.hand.slice(), min: 0, max: 1, kind: 'card', hint: 'swap' });
    if (c) { this.discardFromHand(p, c); this.draw(p, 1); this.log(`${P.name} swaps a card (${who}).`); }
  }
  swapOne(p) { return this.optSwap(p, 'Odd Jobs'); }
  async swapCards(p) {
    const P = this.P[p];
    if (!P.hand.length) return;
    const cs = await P.ctl.choose(this, p, { title: 'Sgt. Joe: discard any cards to draw new ones', items: P.hand.slice(), min: 0, max: P.hand.length, kind: 'card', hint: 'swap' });
    cs.forEach(c => this.discardFromHand(p, c));
    this.draw(p, cs.length);
  }
  fromDiscardRandom(p) {
    const P = this.P[p];
    if (!P.discard.length || P.hand.length >= this.handLimit(p)) return;
    const i = Math.floor(Math.random() * P.discard.length);
    const id = P.discard.splice(i, 1)[0];
    P.hand.push(this.card(id)); this.log(`${P.name} takes ${CARDS[id].name} from the discard pile.`);
  }
  async fromDiscardPick(p, filter) {
    const P = this.P[p];
    if (P.hand.length >= this.handLimit(p)) return;
    const items = P.discard.map((id, i) => ({ uid: 'd' + i, id, di: i })).filter(x => filter(CARDS[x.id]));
    if (!items.length) return;
    const [x] = await P.ctl.choose(this, p, { title: 'Take a card from your discard pile?', items, min: 0, max: 1, kind: 'card', hint: 'keep' });
    if (x) { P.discard.splice(x.di, 1); P.hand.push(this.card(x.id)); this.log(`${P.name} takes back ${CARDS[x.id].name}.`); }
  }
  async emiliaDraw(p) {
    const P = this.P[p];
    const two = P.deck.splice(0, 2).map(id => this.card(id));
    if (!two.length) return;
    let keep = two[0];
    if (two.length > 1) [keep] = await P.ctl.choose(this, p, { title: 'Emilia: keep 1 card (the other is discarded)', items: two, min: 1, max: 1, kind: 'card', hint: 'keep' });
    two.forEach(c => (c === keep && P.hand.length < this.handLimit(p) ? P.hand.push(c) : this.toDiscard(p, c.id)));
  }
  reveal(p) { this.P[p].revealed = true; this.log(`${this.P[p].name} shows the hand.`); }
  recycle(p, n) {
    const P = this.P[p];
    let k = 0;
    while (k < n && P.discard.length) { P.deck.push(P.discard.shift()); k++; }
    if (k) this.log(`${P.name} puts ${k} card(s) back under the deck.`);
  }
  templeton(p) {
    const P = this.P[p];
    const back = P.discard.filter(id => CARDS[id].type !== 'char' && CARDS[id].type !== 'mm');
    P.discard = P.discard.filter(id => !back.includes(id));
    P.deck = shuffle(P.deck.concat(back));
    this.log(`${P.name} shuffles ${back.length} mission/facility card(s) into the deck.`);
  }
  async nash(p) {
    const o = 1 - p, O = this.P[o];
    if (!O.hand.length) return;
    const [c] = await this.P[p].ctl.choose(this, p, { title: 'Nash: choose a card for the opponent to discard', items: O.hand.slice(), min: 1, max: 1, kind: 'card', hint: 'oppHand', reveal: true });
    this.discardFromHand(o, c); this.log(`${O.name} discards ${this.def(c).name}.`);
  }
  async richmond(p) {
    const P = this.P[p];
    if (!P.deck.length) return;
    const c = this.card(P.deck[0]);
    const keep = P.hand.length < this.handLimit(p) && await P.ctl.confirm(this, p, `Richmond: the top card is ${this.def(c).name}. Keep it?`, 'richmond', c);
    P.deck.shift();
    if (keep) P.hand.push(c); else P.deck.push(c.id);
  }
  async tutor(p, key) {
    const P = this.P[p];
    const i = P.deck.findIndex(id => CARDS[id].key === key);
    if (i < 0 || P.hand.length >= this.handLimit(p)) return;
    P.hand.push(this.card(P.deck.splice(i, 1)[0])); P.deck = shuffle(P.deck);
    this.log(`${P.name} finds ${key} in the deck.`);
  }
  async takiFlip(inst, m) {
    const p = inst.owner, P = this.P[p];
    if (!P.deck.length) return;
    const c = this.card(P.deck.shift());
    P.hand.push(c);
    if (!this.whyNot(p, c, m)) { await this.deploy(p, c, m); }
    else { this.discardFromHand(p, c); this.log(`Taki reveals ${this.def(c).name}; it is discarded.`); }
  }
  async annallee(inst, m) {
    const p = inst.owner;
    const opts = this.P[p].hand.filter(c => isHuman(this.def(c)) && !this.whyNot(p, c, m, { ignoreLinks: true }));
    if (!opts.length) return;
    const [c] = await this.P[p].ctl.choose(this, p, { title: 'Annallee: play another human character', items: opts, min: 1, max: 1, kind: 'card', hint: 'deploy' });
    await this.deploy(p, c, m);
  }
  async hilda(inst, m) {
    const p = inst.owner, P = this.P[p];
    const posts = P.resolved.filter(r => r.stationed);
    if (!posts.length) return;
    const [x] = await P.ctl.choose(this, p, { title: 'Hilda: swap with a stationed character', items: posts.map(r => r.stationed), min: 1, max: 1, kind: 'inst', hint: 'deploy' });
    const r = posts.find(r => r.stationed === x);
    m.sides[p].splice(m.sides[p].indexOf(inst), 1);
    r.stationed = inst; inst.tmp = { atk: 0, mil: 0, bld: 0 };
    m.sides[p].push(x);
    this.log(`Hilda takes the post. ${this.def(x).name} joins the battle.`);
    await this.appear(x, m);
  }
  leknaat() {
    for (const P of this.P) {
      P.deck = shuffle(P.deck.concat(P.discard, P.hand.map(c => c.id)));
      P.discard = []; P.hand = [];
      this.refill(P.idx);
    }
    this.log('Leknaat: both players start a new hand from a new deck.');
  }
  async destroyFacility(p) {
    const O = this.P[1 - p];
    const fac = O.resolved.filter(r => r.kind === 'facility');
    if (!fac.length) return;
    const [r] = await this.P[p].ctl.choose(this, p, { title: 'Destroy an enemy facility', items: fac.map(r => ({ uid: r.uid, id: r.card, r })), min: 1, max: 1, kind: 'card', hint: 'harm' });
    this.removeResolved(1 - p, r.r);
  }
  async destroyCleared(p) {
    const O = this.P[1 - p];
    const ms = O.resolved.filter(r => r.kind === 'mission');
    if (!ms.length) return;
    const [r] = await this.P[p].ctl.choose(this, p, { title: 'Destroy an enemy cleared mission', items: ms.map(r => ({ uid: r.uid, id: r.card, r })), min: 1, max: 1, kind: 'card', hint: 'harm' });
    this.removeResolved(1 - p, r.r);
  }
  removeResolved(p, r) {
    const P = this.P[p];
    P.resolved.splice(P.resolved.indexOf(r), 1);
    if (r.stationed) this.leaveMission(r.stationed);
    this.toDiscard(r.owner, r.card);
    this.log(`${CARDS[r.card].name} of ${P.name} is destroyed.`);
    // Library lost: trim hand
    while (P.hand.length > this.handLimit(p)) this.discardFromHand(p, P.hand[P.hand.length - 1]);
  }
  async takeBack(p, m, filter) {
    const P = this.P[p];
    const t = m.sides[p].filter(filter);
    if (!t.length || P.hand.length >= this.handLimit(p)) return;
    const [x] = await P.ctl.choose(this, p, { title: 'Take a character back into your hand?', items: t, min: 0, max: 1, kind: 'inst', hint: 'keep' });
    if (x) { m.sides[p].splice(m.sides[p].indexOf(x), 1); x.tmp = { atk: 0, mil: 0, bld: 0 }; P.hand.push(x); }
  }
  async northWindow(p) {
    const P = this.P[p];
    const fs = P.hand.filter(c => this.def(c).type === 'facility');
    if (!fs.length) return;
    const [c] = await P.ctl.choose(this, p, { title: 'North Window: build a facility from your hand?', items: fs, min: 0, max: 1, kind: 'card', hint: 'keep' });
    if (!c) return;
    this.removeFromHand(p, c);
    P.resolved.push({ uid: UID++, card: c.id, kind: 'facility', stationed: null, owner: p, noText: true });
    this.log(`${P.name} builds ${this.def(c).name} (no ability).`);
    if (P.mm && this.def(P.mm).base === 2) this.addVP(p, 1, 'Riou');
  }
  scrapMission(m) {
    this.missions.splice(this.missions.indexOf(m), 1);
    for (const x of m.sides.flat()) this.leaveMission(x);
    this.toDiscard(m.owner, m.card);
    this.log(`${this.def(m.card).name} is discarded with everyone on it.`);
  }
}

export function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
