// Battle screen + human controller.

const ICON = { atk: '<span class="ic">⚔</span>', mil: '<span class="ic">⚑</span>', bld: '<span class="ic">⚒</span>' };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function fitStage() {
  const st = document.getElementById('stage');
  const k = Math.min(window.innerWidth / 1280, window.innerHeight / 800);
  st.style.transform = `scale(${k})`;
}
window.addEventListener('resize', fitStage);

// HTML for one card. o: {uid, cls, stats:{atk,mil,bld}, small}
function cardHTML(id, s, o = {}) {
  const c = CARDS[id], sp = cardSprite(id);
  const bg = `background-image:url(assets/${sp.sheet}.png);background-size:${822 * s}px ${612 * s}px;` +
    `background-position:${-(2 + 82 * sp.col) * s}px ${-(2 + 112 * sp.row) * s}px`;
  let ov = '';
  if (!o.small && s >= 0.9) {
    ov += `<div class="ov name">${esc(c.name)}</div>`;
    const box = (x0, x1, y0, y1, v, cls = '') =>
      `<div class="ov ${cls}" style="left:${x0 / .8}%;width:${(x1 - x0) / .8}%;top:${y0 / 1.1}%;height:${(y1 - y0) / 1.1}%">${v}</div>`;
    const cmp = k => (o.stats ? (o.stats[k] > c[k] ? 'up' : o.stats[k] < c[k] ? 'down' : '') : '');
    const val = k => (o.stats ? o.stats[k] : c[k]);
    if (c.type === 'char') {
      ov += box(10, 28, 80.5, 88.5, val('atk'), cmp('atk')) + box(29, 52.5, 80.5, 88.5, val('mil'), cmp('mil')) + box(53.5, 73, 80.5, 88.5, val('bld'), cmp('bld'));
      ov += `<div class="ov tag">${c.cls === 'L' ? 'LEADER ' : ''}${c.links}</div>`;
    } else if (c.type === 'mission') {
      const t = c.mode === 'duel' ? 'DUEL' : [c.atk ? ICON.atk + c.atk : '', c.mil ? ICON.mil + c.mil : ''].filter(Boolean).join(' ');
      ov += box(10, 46, 79, 87.5, t) + box(50, 73, 79, 87.5, `VP ${c.vp[0]}/${c.vp[1]}`);
    } else if (c.type === 'facility') {
      ov += box(10, 46, 79, 87.5, ICON.bld + c.bld) + box(50, 73, 79, 87.5, ICON.atk + c.atk);
    } else {
      ov += `<div class="ov tag">MASTERMIND</div>`;
    }
  }
  return `<div class="card ${o.cls || ''} ${o.small ? 'small' : ''}" style="--s:${s}" data-cid="${id}"${o.uid != null ? ` data-uid="${o.uid}"` : ''}${o.act ? ` data-act="${o.act}"` : ''}${o.i != null ? ` data-i="${o.i}"` : ''}><div class="art" style="${bg}"></div>${ov}</div>`;
}

function detailHTML(id) {
  if (!id) return '<div class="label">Point at a card to see it here.</div>';
  const c = CARDS[id];
  let info = `<div class="dn">${esc(c.name)}</div><div class="label">No. ${String(id).padStart(3, '0')}${c.silver ? ' · Silver' : ''}</div>`;
  if (c.type === 'char' || c.type === 'mm') {
    info += `<div>${CLASS_NAMES[c.cls]} · ${CAMP_NAMES[c.camp] || ''}${c.sex === 'B' ? ' · Beast' : c.sex === 'K' ? ' · Kobold' : ''}</div>`;
    if (c.type === 'char') info += `<div class="row"><span>${ICON.atk} ${c.atk}</span><span>${ICON.mil} ${c.mil}</span><span>${ICON.bld} ${c.bld}</span><span>Link ${c.links || '-'}</span></div>`;
    if (c.unite.length) info += `<div>Unite: ${esc(c.unite.join(', '))}</div>`;
  } else if (c.type === 'mission') {
    const kind = { atk: 'Sword battle', mil: 'Army battle', choose: 'Sword or Army battle', duel: 'Duel' }[c.mode];
    info += `<div>Mission · ${kind}</div><div class="row">${c.atk ? `<span>Need ${ICON.atk} ${c.atk}</span>` : ''}${c.mil ? `<span>Need ${ICON.mil} ${c.mil}</span>` : ''}<span>VP ${c.vp[0]} (owner) / ${c.vp[1]} (other)</span></div>`;
  } else {
    info += `<div>Facility</div><div class="row"><span>Build ${ICON.bld} ${c.bld}</span><span>Destroy ${ICON.atk} ${c.atk}</span></div>`;
  }
  if (c.est) info += '<div class="label">Stats estimated.</div>';
  if (c.text) info += `<div class="txt">${esc(c.text)}</div>`;
  return cardHTML(id, 2.6) + `<div class="info">${info}</div>`;
}

const UI = {
  g: null, req: null, sel: [], detail: null, modal: null, raf: 0,

  start(game) {
    this.g = game; this.req = null; this.sel = []; this.modal = null; this.detail = null;
    const st = document.getElementById('stage');
    st.innerHTML = `<div id="board"></div><div id="panel"><div class="detail win"></div><div class="log win"></div></div><div id="modal"></div>`;
    st.onclick = e => this.click(e);
    st.ondblclick = e => this.dbl(e);
    st.onmouseover = e => { const t = e.target.closest('[data-cid]'); if (t) this.showDetail(+t.dataset.cid); };
    game.onUpdate = () => this.schedule();
    this.render();
  },

  schedule() { if (!this.raf) this.raf = requestAnimationFrame(() => { this.raf = 0; this.render(); }); },
  showDetail(id) { if (id === this.detail) return; this.detail = id; const d = document.querySelector('#panel .detail'); if (d) d.innerHTML = detailHTML(id); },

  render() {
    const g = this.g; if (!g) return;
    const b = document.getElementById('board'); if (!b) return;
    b.innerHTML = this.sideHTML(1) + this.missionsHTML() + this.sideHTML(0) + this.handHTML();
    const log = document.querySelector('#panel .log');
    log.innerHTML = g.logs.slice(-60).map(l => `<div>${esc(l)}</div>`).join('');
    log.scrollTop = log.scrollHeight;
    document.querySelector('#panel .detail').innerHTML = detailHTML(this.detail);
    this.renderModal();
  },

  sideHTML(p) {
    const g = this.g, P = g.P[p], me = p === 0;
    const pips = Array.from({ length: P.vpTarget }, (_, i) => `<div class="pip ${i < P.vp ? 'on' : ''}"></div>`).join('');
    let h = `<div class="side ${me ? 'me' : 'opp'} win"><div class="pinfo"><div class="nm">${esc(P.name)}</div><div class="pips">${pips}</div>` +
      `<div class="label">VP ${P.vp}/${P.vpTarget} · Deck ${P.deck.length} · Discard ${P.discard.length}</div></div>`;
    if (P.mm) h += cardHTML(P.mm, 0.72);
    if (!me) {
      const show = P.revealed || g.over;
      const peek = g.P[0].peek || [];
      h += `<div class="ohand">${P.hand.map(c => (show || peek.includes(c.uid) ? cardHTML(c.id, 0.62, { small: true }) : '<div class="cardback" style="--s:.62"></div>')).join('')}</div>`;
    }
    h += `<div class="resolved">${P.resolved.map(r => `<div class="res">${cardHTML(r.card, 0.66, { small: true })}${r.stationed ? cardHTML(r.stationed.id, 0.5, { small: true }) : ''}</div>`).join('')}</div>`;
    return h + '</div>';
  },

  missionsHTML() {
    const g = this.g, req = this.req;
    let h = '<div class="missions win">';
    for (let k = 0; k < 4; k++) {
      const m = g.missions[k];
      if (!m) { h += '<div class="mslot"></div>'; continue; }
      const can = req && req.type === 'main' && g.canContinue(0, m);
      h += `<div class="mslot ${g.active === m ? 'active' : ''} ${can ? 'can' : ''}">`;
      h += this.unitsHTML(m, 1);
      const n0 = g.need(m, 0), n1 = g.need(m, 1);
      const tot = (p, n) => `${ICON[n.key]} ${g.total(m, p, n.key)}/${n.target}`;
      h += `<div class="mcenter"><div class="tots"><div class="t o">${tot(1, n1)}</div><div class="t m">${tot(0, n0)}</div></div>` +
        cardHTML(m.card, 0.9) + '</div>';
      h += `<div class="mtag">${m.owner === 0 ? 'Your' : 'Enemy'} ${m.mode === 'fac' ? 'facility' : m.mode === 'mil' ? 'army battle' : 'mission'}</div>`;
      h += this.unitsHTML(m, 0);
      if (can) h += `<button class="btn cont" data-act="continue" data-mid="${m.uid}">Continue</button>`;
      h += '</div>';
    }
    return h + '</div>';
  },

  unitsHTML(m, p) {
    const g = this.g, n = g.need(m, p), s = m.sides[p];
    return `<div class="mside ${s.length > 4 ? 'crowd' : ''}">` + s.map(x => {
      const st = g.stat(x, m), base = g.def(x)[n.key], v = st[n.key];
      return `<div class="unit">${cardHTML(x.id, 0.6, { small: true, uid: x.uid })}<div class="v ${v > base ? 'up' : v < base ? 'down' : ''}">${ICON[n.key]}${v}</div></div>`;
    }).join('') + '</div>';
  },

  handHTML() {
    const g = this.g, P = g.P[0], req = this.req;
    const legal = new Set();
    if (req && req.type === 'deploy') g.legalCards(0, req.m).forEach(c => legal.add(c.uid));
    if (req && req.type === 'main') P.hand.forEach(c => { if (g.canPlayMission(0, c)) legal.add(c.uid); });
    const cards = P.hand.map(c => {
      let cls = this.sel.includes(c) ? 'sel' : '';
      if (req && req.type === 'deploy') cls += legal.has(c.uid) ? ' legal' : ' dim';
      else if (req && req.type === 'main' && legal.has(c.uid)) cls += ' legal';
      return cardHTML(c.id, 1.2, { uid: c.uid, cls, act: 'hand' });
    }).join('');
    return `<div class="handbar win"><div class="hand">${cards}</div><div class="actions">${this.actionsHTML()}</div></div>`;
  },

  actionsHTML() {
    const g = this.g, req = this.req, P = g.P[0];
    if (g.over) return `<div class="prompt">${g.winner === 0 ? 'Victory!' : 'Defeat...'}</div><button class="btn" data-act="leave">Continue</button>`;
    if (!req) return `<div class="prompt" style="color:var(--dim)">${g.turn === 1 ? esc(g.P[1].name) + ' is thinking...' : '...'}</div>`;
    const btn = (act, label, on = true, cls = '') => `<button class="btn ${cls}" data-act="${act}" ${on ? '' : 'disabled'}>${label}</button>`;
    if (req.type === 'mulligan') {
      return `<div class="prompt">Select up to 3 cards to return and draw again.</div>` +
        btn('redraw', `Return ${this.sel.length} card(s)`, this.sel.length > 0 && this.sel.length <= 3) + btn('keep', 'Keep this hand');
    }
    if (req.type === 'main') {
      const one = this.sel.length === 1 ? this.sel[0] : null;
      const d = one && g.def(one);
      const min = g.minDiscard(0);
      let h = `<div class="prompt">Your turn. Play a mission, continue a battle, or discard cards.</div>`;
      if (d && g.canPlayMission(0, one)) {
        if (d.mode === 'choose') h += btn('play-atk', `Play as Sword battle`) + btn('play-mil', `Play as Army battle`);
        else h += btn('play', `Play ${esc(d.name)}`);
      }
      if (!P.hand.length) h += btn('discard', 'End turn');
      else h += btn('discard', `Discard ${this.sel.length} card(s)${min > 1 ? ` (min ${min})` : ''}`, this.sel.length >= min, 'warn');
      return h;
    }
    if (req.type === 'deploy') {
      const m = req.m, d = g.def(m.card), n = g.need(m, 0);
      const one = this.sel[0];
      let h = `<div class="prompt">${esc(d.name)}: you need ${ICON[n.key]} ${n.target}. Send a character or pass.</div>`;
      h += btn('send', one ? `Send ${esc(g.def(one).name)}` : 'Send', !!one && !g.whyNot(0, one, m));
      if (P.mm && g.def(P.mm).base === 7 && !P.lucaUsed && m.sides[0].length) h += btn('luca', 'Luca: sacrifice an ally');
      h += btn('pass', 'Pass', !req.opts.mustPlay);
      if (one) { const why = g.whyNot(0, one, m); if (why) h += `<div class="warnmsg">${esc(why)}</div>`; }
      return h;
    }
    return '<div class="prompt">Choose...</div>';
  },

  renderModal() {
    const el = document.getElementById('modal');
    const md = this.modal;
    if (!md) { el.className = ''; el.innerHTML = ''; return; }
    el.className = 'on';
    const g = this.g;
    let h = `<div class="mbox win"><h2>${esc(md.title)}</h2>`;
    if (md.items) {
      h += '<div class="mcards">' + md.items.map((x, i) => {
        const inst = md.kind === 'inst';
        const cls = md.picked.includes(i) ? 'sel' : '';
        return cardHTML(x.id, 1.3, { i, act: 'mpick', cls, stats: inst && g ? g.stat(x) : null });
      }).join('') + '</div>';
      const n = md.picked.length;
      h += `<div class="mbtns"><button class="btn" data-act="mok" ${n >= md.min && n <= md.max ? '' : 'disabled'}>${md.okLabel || 'OK'}</button>` +
        (md.min === 0 ? `<button class="btn" data-act="mskip">${md.skipLabel || 'Skip'}</button>` : '') + '</div>';
    }
    if (md.buttons) h += '<div class="mbtns">' + md.buttons.map((b, i) => `<button class="btn" data-act="mbtn" data-i="${i}">${esc(b)}</button>`).join('') + '</div>';
    el.innerHTML = h + '</div>';
  },

  ask(req) {
    return new Promise(res => { this.req = Object.assign(req, { resolve: res }); this.sel = []; this.render(); });
  },
  answer(v) { const r = this.req; this.req = null; this.sel = []; this.render(); r.resolve(v); },
  askModal(md) {
    return new Promise(res => { this.modal = Object.assign({ picked: [] }, md, { resolve: res }); this.renderModal(); });
  },
  closeModal(v) { const md = this.modal; this.modal = null; this.renderModal(); md.resolve(v); },

  findHand(uid) { return this.g.P[0].hand.find(c => c.uid === uid); },

  click(e) {
    const t = e.target.closest('[data-act]');
    if (!t) { const c = e.target.closest('[data-cid]'); if (c) this.showDetail(+c.dataset.cid); return; }
    const act = t.dataset.act, g = this.g, req = this.req;
    if (t.dataset.cid) this.showDetail(+t.dataset.cid);
    if (act === 'leave') { if (this.onLeave) this.onLeave(g.winner); return; }
    if (act === 'mpick') {
      const md = this.modal, i = +t.dataset.i;
      if (md.picked.includes(i)) md.picked = md.picked.filter(x => x !== i);
      else if (md.max === 1) md.picked = [i];
      else if (md.picked.length < md.max) md.picked.push(i);
      this.renderModal(); return;
    }
    if (act === 'mok') { this.closeModal(this.modal.picked.map(i => this.modal.items[i])); return; }
    if (act === 'mskip') { this.closeModal([]); return; }
    if (act === 'mbtn') { this.closeModal(+t.dataset.i); return; }
    if (!req) return;
    if (act === 'hand') {
      const c = this.findHand(+t.dataset.uid);
      if (req.type === 'deploy') this.sel = this.sel[0] === c ? [] : [c];
      else if (this.sel.includes(c)) this.sel = this.sel.filter(x => x !== c);
      else this.sel.push(c);
      this.render(); return;
    }
    if (act === 'redraw') return this.answer(this.sel.slice());
    if (act === 'keep') return this.answer([]);
    if (act === 'play') return this.answer({ type: 'play', card: this.sel[0] });
    if (act === 'play-atk') return this.answer({ type: 'play', card: this.sel[0], mode: 'atk' });
    if (act === 'play-mil') return this.answer({ type: 'play', card: this.sel[0], mode: 'mil' });
    if (act === 'discard') return this.answer({ type: 'discard', cards: this.sel.slice() });
    if (act === 'continue') return this.answer({ type: 'continue', mission: g.missions.find(m => m.uid === +t.dataset.mid) });
    if (act === 'send') return this.answer({ type: 'deploy', card: this.sel[0] });
    if (act === 'pass') return this.answer({ type: 'pass' });
    if (act === 'luca') {
      this.askModal({ title: 'Luca: sacrifice which ally?', items: req.m.sides[0].slice(), kind: 'inst', min: 0, max: 1 })
        .then(r => { if (r.length) this.answer({ type: 'luca', inst: r[0] }); });
    }
  },

  dbl(e) {
    const t = e.target.closest('[data-act="hand"]');
    if (!t || !this.req || this.req.type !== 'deploy') return;
    const c = this.findHand(+t.dataset.uid);
    if (c && !this.g.whyNot(0, c, this.req.m)) this.answer({ type: 'deploy', card: c });
  },
};

// Human controller
const Human = {
  async coin() {
    const i = await UI.askModal({ title: 'Coin toss! Call it.', buttons: ['Heads ★', 'Tails'] });
    return i === 0 ? 'heads' : 'tails';
  },
  mulligan(g, p) { return UI.ask({ type: 'mulligan' }); },
  main(g, p) { return UI.ask({ type: 'main' }); },
  deploy(g, p, m, opts) { return UI.ask({ type: 'deploy', m, opts }); },
  async unite(g, p, m, options, last) {
    const r = await UI.askModal({ title: `Unite with ${g.def(last).name}! Send another card at once?`, items: options, kind: 'card', min: 0, max: 1, okLabel: 'Unite!', skipLabel: 'No' });
    return r[0] || null;
  },
  async choose(g, p, req) {
    if (req.min === 1 && req.max === 1 && req.items.length === 1 && req.hint !== 'discard') return req.items.slice();
    return UI.askModal({ title: req.title, items: req.items, kind: req.kind, min: req.min, max: req.max });
  },
  async confirm(g, p, text) {
    return (await UI.askModal({ title: text, buttons: ['Yes', 'No'] })) === 0;
  },
  async duel(g, p, m) {
    const r = await UI.askModal({ title: 'Single combat: choose a card to fight with', items: g.P[p].hand.slice(), kind: 'card', min: 1, max: 1 });
    return r[0];
  },
};
