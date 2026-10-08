// Title, campaign hub, deck builder, shop, card file, save data.

const SAVE_KEY = 'suikoCS.save.v1';
const MM_CAMPS = { 1: ['TR', 'NA'], 2: ['NA', 'CS'], 3: ['NA'], 4: ['CS', 'NA'], 5: ['CS', 'HL'], 6: ['HL'], 7: ['HL'] };
const PACK_PRICE = 500;

let S = null; // save data

function newSave(name) {
  const deck = parseDeck(STARTER_DECK);
  const coll = {};
  deck.forEach(id => { coll[id] = (coll[id] || 0) + 1; });
  const seen = {};
  deck.forEach(id => { seen[id] = 1; });
  return { name, potch: 1000, coll, deck, mm: null, beaten: {}, wins: 0, losses: 0, seen, shop: rollShop() };
}
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* storage blocked */ } }
function load() { try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return null; } }
function addCard(id, n = 1) { S.coll[id] = (S.coll[id] || 0) + n; S.seen[id] = 1; }

function rollShop() {
  const pool = [];
  for (let id = 8; id <= 191; id++) pool.push(id);
  return shuffle(pool).slice(0, 12).sort((a, b) => a - b);
}

// Random pack: mostly 8-191, small chance of mastermind or silver.
function openPack() {
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

function deckProblems(deck, mm) {
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

const Meta = {
  st() { return document.getElementById('stage'); },

  title() {
    UI.g = null;
    const s = load();
    const art = [25, 8, 18, 55, 31].map(id => cardHTML(id, 1.3)).join('');
    this.st().onclick = null; this.st().ondblclick = null; this.st().onmouseover = null;
    this.st().innerHTML = `<div class="screen title">
      <div class="logo"><div class="a">GENSO SUIKODEN</div><div class="b">CARD STORIES</div><div class="c">a fan-made web remake</div></div>
      <div class="titlecards">${art}</div>
      <button class="btn big" id="t-new">New Game</button>
      <button class="btn big" id="t-cont" ${s ? '' : 'disabled'}>Continue</button>
      <button class="btn big" id="t-rules">How to Play</button>
    </div>`;
    document.getElementById('t-new').onclick = () => this.nameEntry();
    document.getElementById('t-cont').onclick = () => { S = load(); this.hub(); };
    document.getElementById('t-rules').onclick = () => this.rules(() => this.title());
  },

  nameEntry() {
    this.st().innerHTML = `<div class="screen title"><div class="win mbox"><h2>Enter your name</h2>
      <input class="name" id="nm" maxlength="12" value="Riou"><button class="btn big" id="go">Start</button></div></div>`;
    const nm = document.getElementById('nm');
    nm.focus(); nm.select();
    const go = () => {
      if (load() && !confirm('This will replace your saved game. Continue?')) return;
      S = newSave(nm.value.trim() || 'Riou'); save(); this.hub('campaign');
    };
    document.getElementById('go').onclick = go;
    nm.onkeydown = e => { if (e.key === 'Enter') go(); };
  },

  hub(tab = 'campaign') {
    this.tab = tab;
    const owned = Object.values(S.coll).reduce((a, b) => a + b, 0);
    const seen = Object.keys(S.seen).length;
    this.st().onmouseover = null;
    this.st().innerHTML = `<div class="screen hub">
      <div class="hubtop win"><span>${esc(S.name)}'s Army</span><span>Wins ${S.wins} · Losses ${S.losses}</span>
        <span>Cards ${owned} · File ${seen}/250</span><span class="gold">${S.potch} potch</span></div>
      <div class="hubgrid">
        <div class="menu win">
          <button class="btn" data-tab="campaign">⚔ Battle</button>
          <button class="btn" data-tab="deck">▤ Edit Deck</button>
          <button class="btn" data-tab="shop">◈ Card Shop</button>
          <button class="btn" data-tab="file">▦ Card File</button>
          <button class="btn" data-tab="rules">? How to Play</button>
          <button class="btn" data-tab="title">⏻ Title Screen</button>
        </div>
        <div class="pane win" id="pane"></div>
      </div></div>`;
    this.st().querySelectorAll('[data-tab]').forEach(b => {
      b.onclick = () => {
        const t = b.dataset.tab;
        if (t === 'deck') return this.deckEditor();
        if (t === 'file') return this.cardFile();
        if (t === 'title') return this.title();
        if (t === 'rules') return this.rules(() => this.hub());
        this.hub(t);
      };
    });
    if (tab === 'campaign') this.campaign();
    if (tab === 'shop') this.shop();
  },

  campaign() {
    const pane = document.getElementById('pane');
    const probs = deckProblems(S.deck, S.mm);
    let h = '<h2>Battle</h2>';
    if (probs.length) h += `<div class="warnmsg">Your deck is not legal: ${esc(probs[0])} Fix it in Edit Deck.</div>`;
    h += '<div class="opplist">';
    OPPONENTS.forEach((o, i) => {
      const open = i === 0 || S.beaten[OPPONENTS[i - 1].id];
      const done = S.beaten[o.id];
      const face = CARDS[parseDeck(o.deck).find(id => CARDS[id].cls === 'L')];
      h += `<div class="foe ${open ? '' : 'locked'}">${cardHTML(o.mm || face.id, 0.6, { small: true })}
        <div class="fn"><b>${i + 1}. ${esc(o.name)}</b> ${done ? '<span class="badge">Cleared</span>' : ''}
        <small>${esc(o.where)} — ${esc(o.intro)}</small>
        <small>You need ${o.vp[0]} VP · Enemy needs ${o.vp[1]} VP · Reward ${done ? Math.round(o.reward / 2) : o.reward} potch${done ? '' : ' + rare card'}</small></div>
        <button class="btn" data-opp="${i}" ${open && !probs.length ? '' : 'disabled'}>Fight</button></div>`;
    });
    pane.innerHTML = h + '</div>';
    pane.querySelectorAll('[data-opp]').forEach(b => { b.onclick = () => this.battle(OPPONENTS[+b.dataset.opp]); });
  },

  battle(o) {
    const g = new Game({
      players: [
        { name: S.name, deck: S.deck.slice(), mm: S.mm, vpTarget: o.vp[0], ctl: Human },
        { name: o.name, deck: parseDeck(o.deck), mm: o.mm, vpTarget: o.vp[1], ctl: AI },
      ],
    });
    UI.start(g);
    UI.onLeave = w => this.afterBattle(o, w, g);
    g.run().catch(e => { console.error(e); g.log('Error: ' + e.message); });
  },

  afterBattle(o, w, g) {
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
    this.st().innerHTML = `<div class="screen title"><div class="win mbox"><h2>${w === 0 ? 'Victory!' : 'Defeat'}</h2>
      <div>${lines.join('<br>')}</div>
      ${got.length ? `<div>New cards:</div><div class="mcards">${got.map(id => cardHTML(id, 1.3)).join('')}</div>` : ''}
      <button class="btn big" id="ok">Return</button></div></div>`;
    document.getElementById('ok').onclick = () => this.hub('campaign');
  },

  // ---------- Deck editor ----------
  deckEditor() {
    this.ed = { deck: S.deck.slice(), mm: S.mm, filter: 'all', sort: 'num' };
    this.st().innerHTML = `<div class="screen deckscreen"><div class="dk">
      <div class="pane win" id="coll"></div>
      <div class="pane win" id="dl"></div>
      <div class="win detail" id="dd" style="height:auto"></div></div></div>`;
    const st = this.st();
    st.onmouseover = e => { const t = e.target.closest('[data-cid]'); if (t) document.getElementById('dd').innerHTML = detailHTML(+t.dataset.cid); };
    document.getElementById('dd').innerHTML = detailHTML(null);
    this.drawEditor();
  },

  drawEditor() {
    const ed = this.ed;
    const inDeck = id => ed.deck.filter(x => x === id).length;
    const filters = { all: 'All', L: 'Leaders', C: 'Others', mission: 'Missions', facility: 'Facilities', mm: 'Masterminds' };
    const ids = Object.keys(S.coll).map(Number).filter(id => S.coll[id] > 0).filter(id => {
      const c = CARDS[id];
      if (ed.filter === 'all') return true;
      if (ed.filter === 'L') return c.cls === 'L';
      if (ed.filter === 'C') return c.type === 'char' && c.cls !== 'L';
      return c.type === ed.filter;
    }).sort((a, b) => a - b);
    let h = `<div class="filters">${Object.entries(filters).map(([k, v]) => `<button class="btn ${ed.filter === k ? 'on' : ''}" data-f="${k}">${v}</button>`).join('')}
      <span class="label">Click a card to add it.</span></div><div class="grid">`;
    h += ids.map(id => {
      const left = S.coll[id] - (CARDS[id].type === 'mm' ? (ed.mm === id ? 1 : 0) : inDeck(id));
      return `<div class="gcell" data-add="${id}">${cardHTML(id, 0.9, { cls: left > 0 ? '' : 'dim' })}<div class="cnt">${left}/${S.coll[id]}</div></div>`;
    }).join('');
    document.getElementById('coll').innerHTML = h + '</div>';

    const counts = {};
    ed.deck.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
    const groups = [['Leaders', id => CARDS[id].cls === 'L'], ['Characters', id => CARDS[id].type === 'char' && CARDS[id].cls !== 'L'],
      ['Missions', id => CARDS[id].type === 'mission'], ['Facilities', id => CARDS[id].type === 'facility']];
    const probs = deckProblems(ed.deck, ed.mm);
    let d = `<div style="display:flex;justify-content:space-between;align-items:center;gap:6px"><h2 style="margin:0;white-space:nowrap;font-size:22px">Deck ${ed.deck.length}/50</h2>` +
      `<div class="mbtns" style="gap:6px"><button class="btn" id="dsave" ${probs.length ? 'disabled' : ''}>Save</button><button class="btn" id="dback">Back</button></div></div>`;
    d += probs.length ? probs.map(p => `<div class="warnmsg">${esc(p)}</div>`).join('') : '<div class="okmsg">The deck is legal.</div>';
    d += `<div class="dlist"><div class="sec">Mastermind (optional)</div>`;
    d += ed.mm ? `<div class="it" data-rmm="1" data-cid="${ed.mm}"><span>${esc(CARDS[ed.mm].name)}</span><span>×</span></div>` : '<div class="label">none</div>';
    for (const [name, f] of groups) {
      const ids2 = Object.keys(counts).map(Number).filter(f).sort((a, b) => a - b);
      const n = ids2.reduce((a, id) => a + counts[id], 0);
      d += `<div class="sec">${name} (${n})</div>`;
      d += ids2.map(id => `<div class="it" data-rm="${id}" data-cid="${id}"><span>${String(id).padStart(3, '0')} ${esc(CARDS[id].name)}</span><span>×${counts[id]}</span></div>`).join('');
    }
    d += '</div>';
    document.getElementById('dl').innerHTML = d;

    const root = this.st();
    root.querySelectorAll('[data-f]').forEach(b => { b.onclick = () => { ed.filter = b.dataset.f; this.drawEditor(); }; });
    root.querySelectorAll('[data-add]').forEach(b => {
      b.onclick = () => {
        const id = +b.dataset.add;
        if (CARDS[id].type === 'mm') { ed.mm = id; }
        else if (inDeck(id) < S.coll[id] && inDeck(id) < 3 && ed.deck.length < 50) ed.deck.push(id);
        this.drawEditor();
      };
    });
    root.querySelectorAll('[data-rm]').forEach(b => { b.onclick = () => { ed.deck.splice(ed.deck.indexOf(+b.dataset.rm), 1); this.drawEditor(); }; });
    root.querySelectorAll('[data-rmm]').forEach(b => { b.onclick = () => { ed.mm = null; this.drawEditor(); }; });
    document.getElementById('dsave').onclick = () => { S.deck = ed.deck.slice(); S.mm = ed.mm; save(); this.hub(); };
    document.getElementById('dback').onclick = () => {
      if ((ed.deck.join() !== S.deck.join() || ed.mm !== S.mm) && !confirm('Leave without saving?')) return;
      this.hub();
    };
  },

  // ---------- Shop ----------
  shop(msg) {
    const pane = document.getElementById('pane');
    const used = {};
    S.deck.forEach(id => { used[id] = (used[id] || 0) + 1; });
    if (S.mm) used[S.mm] = (used[S.mm] || 0) + 1;
    const spare = Object.keys(S.coll).map(Number).filter(id => S.coll[id] - (used[id] || 0) > 0).sort((a, b) => a - b);
    let h = `<h2>Card Shop</h2>${msg ? `<div class="okmsg">${msg}</div>` : ''}
      <div style="display:flex;gap:16px;align-items:center;margin:8px 0 14px"><button class="btn" id="pack" ${S.potch >= PACK_PRICE ? '' : 'disabled'}>Buy a pack of 5 cards (${PACK_PRICE} potch)</button>
      <span class="label">The stock changes after each battle.</span></div>
      <div class="label">For sale</div><div class="grid" style="margin-bottom:16px">`;
    h += S.shop.map(id => `<div class="gcell">${cardHTML(id, 0.9)}<button class="btn" style="font-size:13px;padding:2px 6px" data-buy="${id}" ${S.potch >= cardPrice(id) ? '' : 'disabled'}>${cardPrice(id)}</button></div>`).join('');
    h += `</div><div class="label">Sell spare cards (cards not in your deck) for 1/4 of the price</div><div class="grid">`;
    h += spare.map(id => `<div class="gcell">${cardHTML(id, 0.7, { small: true })}<div class="cnt">${S.coll[id] - (used[id] || 0)}</div><button class="btn" style="font-size:12px;padding:1px 5px" data-sell="${id}">${Math.round(cardPrice(id) / 4)}</button></div>`).join('');
    pane.innerHTML = h + '</div>';
    this.st().onmouseover = null;
    document.getElementById('pack').onclick = () => {
      S.potch -= PACK_PRICE;
      const got = openPack(); got.forEach(id => addCard(id)); save();
      this.hub('shop');
      document.getElementById('pane').insertAdjacentHTML('afterbegin', `<div class="mcards">${got.map(id => cardHTML(id, 1.2)).join('')}</div>`);
    };
    pane.querySelectorAll('[data-buy]').forEach(b => { b.onclick = () => { const id = +b.dataset.buy; S.potch -= cardPrice(id); addCard(id); save(); this.hub('shop'); this.shop(`Bought ${CARDS[id].name}.`); }; });
    pane.querySelectorAll('[data-sell]').forEach(b => { b.onclick = () => { const id = +b.dataset.sell; S.coll[id]--; S.potch += Math.round(cardPrice(id) / 4); save(); this.hub('shop'); this.shop(`Sold ${CARDS[id].name}.`); }; });
  },

  // ---------- Card file ----------
  cardFile() {
    let h = `<div class="screen deckscreen"><div class="dk" style="grid-template-columns:1fr 312px">
      <div class="pane win"><h2>Card File — ${Object.keys(S.seen).length}/250 seen</h2><div class="grid">`;
    for (let id = 1; id <= 250; id++) {
      const seen = S.seen[id];
      h += `<div class="gcell" ${seen ? `data-cid="${id}"` : ''}>${seen ? cardHTML(id, 0.62, { small: true }) : `<div class="cardback unseen" style="--s:.62"></div>`}<span class="num">${String(id).padStart(3, '0')}</span></div>`;
    }
    h += `</div></div><div class="win detail" id="dd" style="height:auto"></div></div>
      <button class="btn" id="fback" style="position:absolute;right:20px;bottom:20px">Back</button></div>`;
    this.st().innerHTML = h;
    document.getElementById('dd').innerHTML = detailHTML(null);
    this.st().onmouseover = e => { const t = e.target.closest('[data-cid]'); if (t) document.getElementById('dd').innerHTML = detailHTML(+t.dataset.cid); };
    document.getElementById('fback').onclick = () => this.hub();
  },

  rules(back) {
    this.st().onmouseover = null;
    this.st().innerHTML = `<div class="screen hub"><div class="pane win rules" style="width:1000px;flex:1">
      <h2>How to Play</h2>
      <p>Win Victory Points (VP) by clearing missions. The first player to reach their VP target wins. Each deck has 50 cards. You hold up to 6 cards.</p>
      <h3>Cards</h3>
      <ul><li><b>Characters</b> have ${ICON.atk} Sword (attack), ${ICON.mil} Flag (troops) and ${ICON.bld} Hammer (building), plus link letters A–I.</li>
      <li><b>Missions</b> (blue) need Sword or troops. VP a/b: the player who played it gets a, the other player gets b.</li>
      <li><b>Facilities</b> (yellow): the owner builds them with Hammer; the enemy destroys them with Sword. A built facility gives a bonus.</li>
      <li><b>Mastermind</b> (optional, not in the deck) gives an effect for the whole battle but limits your deck to its camps.</li></ul>
      <h3>Your turn — do one thing</h3>
      <ul><li><b>Play a mission or facility</b> (max 2 open of yours). The opponent may send a character first.</li>
      <li><b>Continue</b> an open mission. You must send a character first.</li>
      <li><b>Discard</b> 1 or more cards.</li></ul>
      <p>At the end of the turn, both players draw back to 6 cards.</p>
      <h3>Battle</h3>
      <ul><li>Players take turns to send 1 character or pass. Two passes in a row end the battle.</li>
      <li>The first character on your side must be a <b>Leader</b>. Each next character must share at least 1 link letter with a card on your side.</li>
      <li><b>Unite</b>: right after a character, you may send its Unite partner at once, ignoring links.</li>
      <li><b>Unique</b>: only one copy of a character can be in play (both sides). <b>Betrayal</b> characters can take the opponent's copy out.</li>
      <li><b>Sword missions</b>: the first side to reach the target wins at once.</li>
      <li><b>Army battles</b>: after both pass, the smaller army is destroyed and the bigger army loses the same number of troops. If the troops left reach the target, that side wins.</li>
      <li><b>Duels</b>: each player chooses a card; the higher Sword wins.</li>
      <li>The winner <b>stations</b> one character on the cleared card. It stays in play. The other characters are discarded.</li></ul>
      <h3>Controls</h3>
      <p>Point at a card to see it on the right. Click hand cards to select them. Double-click a card to send it quickly.</p>
      <button class="btn" id="rback">Back</button></div></div>`;
    document.getElementById('rback').onclick = back;
  },
};

fitStage();
Meta.title();
