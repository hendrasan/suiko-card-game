// Simple computer opponent.

const HARM_APPEAR = [15, 29, 34, 35, 41, 44, 50, 52, 61, 65, 74, 76, 98, 110, 111, 113, 122, 123];

function aiValue(g, c) {
  const d = g.def(c);
  if (d.type === 'mission') return 2 + d.vp[0];
  if (d.type === 'facility') return 2;
  return d.atk + d.mil / 600 + d.bld * 0.5 + (d.cls === 'L' ? 1.5 : 0);
}

function instValue(g, x) {
  if (x.r || g.def(x).type !== 'char') return aiValue(g, x);
  const s = g.stat(x);
  return s.atk + s.mil / 600 + s.bld * 0.5 + (g.def(x).cls === 'L' ? 1 : 0);
}

export const AI = {
  async coin() { return Math.random() < 0.5 ? 'heads' : 'tails'; },

  async mulligan(g, p) {
    const h = g.P[p].hand;
    const leaders = h.filter(c => g.def(c).cls === 'L');
    const missions = h.filter(c => g.def(c).type === 'mission' || g.def(c).type === 'facility');
    const byVal = arr => arr.slice().sort((a, b) => aiValue(g, a) - aiValue(g, b));
    let back = [];
    if (!leaders.length) back = byVal(h.filter(c => g.def(c).type === 'char')).slice(0, 2);
    if (missions.length > 3) back = back.concat(missions.slice(3));
    if (!missions.length) back = back.concat(byVal(h.filter(c => g.def(c).cls !== 'L')).slice(0, 1));
    return [...new Set(back)].slice(0, 3);
  },

  // Sum of what the hand could add to mission m for player p (rough).
  potential(g, p, m, key, exclude) {
    const hand = g.P[p].hand.filter(c => c !== exclude && g.def(c).type === 'char');
    const side = m ? m.sides[p] : [];
    let letters = new Set(side.flatMap(x => [...g.def(x).links]));
    let has = side.length > 0;
    let sum = 0;
    const pool = hand.slice().sort((a, b) => (g.def(b).cls === 'L') - (g.def(a).cls === 'L'));
    for (let pass = 0; pass < 2; pass++) {
      for (const c of pool) {
        if (c.used) continue;
        const d = g.def(c);
        if (g.isUniqueBlocked(p, d)) continue;
        if (!has && d.cls !== 'L') continue;
        if (has && ![...d.links].some(ch => letters.has(ch))) continue;
        c.used = true; has = true;
        [...d.links].forEach(ch => letters.add(ch));
        sum += d[key];
      }
    }
    pool.forEach(c => delete c.used);
    return sum;
  },

  async main(g, p) {
    const P = g.P[p];
    let best = null, bestScore = 0;
    for (const m of g.missions) {
      if (!g.canContinue(p, m)) continue;
      const n = g.need(m, p);
      const cur = g.total(m, p, n.key);
      const gap = Math.max(0, n.target - cur);
      const pot = this.potential(g, p, m, n.key);
      const d = g.def(m.card);
      const vp = m.mode === 'fac' ? 1.5 : (p === m.owner ? d.vp[0] : d.vp[1]);
      let s = (gap === 0 ? 1 : Math.min(1, pot / gap)) * 6 + vp;
      if (m.mode === 'mil') {
        const opp = g.total(m, 1 - p, 'mil');
        s = (cur + pot > opp + n.target * 0.5 ? 6 : 2) + vp;
      }
      if (s > bestScore) { bestScore = s; best = { type: 'continue', mission: m }; }
    }
    for (const c of P.hand) {
      if (!g.canPlayMission(p, c)) continue;
      const d = g.def(c);
      if (d.mode === 'duel') {
        const top = Math.max(0, ...P.hand.filter(h => g.def(h).type === 'char' && !g.isUniqueBlocked(p, g.def(h))).map(h => g.def(h).atk));
        const s = top >= 4 || d.base === 175 ? 4 + d.vp[0] : 1;
        if (s > bestScore) { bestScore = s; best = { type: 'play', card: c }; }
        continue;
      }
      let mode = d.mode, key, target;
      if (d.mode === 'choose') {
        const pa = this.potential(g, p, null, 'atk', c), pm = this.potential(g, p, null, 'mil', c);
        mode = pa / d.atk >= pm / d.mil ? 'atk' : 'mil';
      }
      if (mode === 'fac') { key = 'bld'; target = d.bld; }
      else if (mode === 'mil') { key = 'mil'; target = d.mil; }
      else { key = 'atk'; target = d.atk; }
      const fake = { card: d.id, owner: p, sides: [[], []], mode };
      const leader = P.hand.some(h => h !== c && !g.whyNot(p, h, fake));
      if (!leader) continue;
      const pot = this.potential(g, p, null, key, c);
      const ratio = pot / target;
      const vp = mode === 'fac' ? 2 : d.vp[0];
      const s = Math.min(1, ratio) * 6 + vp - (ratio < 0.6 ? 3 : 0);
      if (s > bestScore) { bestScore = s; best = { type: 'play', card: c, mode }; }
    }
    if (best && bestScore >= 4) return best;
    // Discard weak cards.
    const min = g.minDiscard(p);
    if (!min) return best || { type: 'discard', cards: [] };
    const sorted = P.hand.slice().sort((a, b) => aiValue(g, a) - aiValue(g, b));
    let n = Math.max(min, sorted.filter(c => aiValue(g, c) < 2).length);
    const leaders = P.hand.filter(c => g.def(c).cls === 'L').length;
    if (!leaders) n = Math.max(n, Math.min(3, P.hand.length));
    if (best && bestScore >= 2.5 && n <= 1) return best;
    return { type: 'discard', cards: sorted.slice(0, Math.min(n, P.hand.length)) };
  },

  gainOf(g, p, m, c, key) {
    const before = g.total(m, p, key);
    c.owner = p; c.tmp = c.tmp || { atk: 0, mil: 0, bld: 0 };
    m.sides[p].push(c);
    const after = g.total(m, p, key);
    m.sides[p].pop();
    return after - before;
  },

  async deploy(g, p, m, opts) {
    const legal = g.legalCards(p, m);
    if (!legal.length) return { type: 'pass' };
    const n = g.need(m, p);
    const cur = g.total(m, p, n.key);
    let best = null, bestScore = -Infinity;
    for (const c of legal) {
      let s = this.gainOf(g, p, m, c, n.key);
      if (HARM_APPEAR.includes(g.def(c).base) && m.sides[1 - p].length) s += 1.5;
      if (g.def(c).base === 58 || g.def(c).base === 31) s -= 4; // Viki / Luca wipe: avoid
      if (!m.sides[p].length) s += this.potential(g, p, m, n.key, c) > 0 ? 0.5 : 0;
      if (s > bestScore) { bestScore = s; best = c; }
    }
    if (opts.mustPlay) return { type: 'deploy', card: best };
    if (bestScore <= 0) return { type: 'pass' };
    if (m.mode === 'mil') {
      const opp = g.total(m, 1 - p, 'mil');
      if (cur > opp && cur - opp >= n.target) return { type: 'pass' };
    }
    return { type: 'deploy', card: best };
  },

  async unite(g, p, m, options) { return options[0]; },

  async choose(g, p, req) {
    const items = req.items.slice();
    const val = x => (req.kind === 'inst' ? instValue(g, x) : aiValue(g, x));
    switch (req.hint) {
      case 'ownLoss':
      case 'discard':
        items.sort((a, b) => val(a) - val(b)); break;
      case 'swap': {
        items.sort((a, b) => val(a) - val(b));
        const weak = items.filter(x => val(x) < 1.5);
        return weak.slice(0, req.max);
      }
      default:
        items.sort((a, b) => val(b) - val(a));
    }
    if (req.min === 0 && req.hint === 'harm' && items.length && items[0].owner === p) return [];
    return items.slice(0, Math.max(req.min, Math.min(1, req.max)));
  },

  async confirm(g, p, text, hint, ctx) {
    if (hint === 'klaus') return true;
    if (hint === 'ai-pilika') return g.total(ctx, 1 - p, 'atk') > g.total(ctx, p, 'atk');
    if (hint === 'richmond') return aiValue(g, ctx) >= 2;
    return true;
  },

  async duel(g, p) {
    const h = g.P[p].hand;
    const score = c => (g.def(c).type !== 'char' ? -1 : g.isUniqueBlocked(p, g.def(c)) ? 0 : g.def(c).atk);
    return h.slice().sort((a, b) => score(b) - score(a))[0];
  },
};
