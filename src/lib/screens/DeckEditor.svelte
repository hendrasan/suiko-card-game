<script>
  import { cardHover } from '../hover.js';
  import Card from '../components/Card.svelte';
  import CardDetail from '../components/CardDetail.svelte';
  import { CARDS } from '../game/cards.js';
  import { game, save, go, deckProblems } from '../save.svelte.js';

  const S = game.S;
  // Work copy. It goes to the save only when you click Save.
  let deck = $state(S.deck.slice());
  let mm = $state(S.mm);
  let filter = $state('all');
  let detail = $state(null);

  const FILTERS = { all: 'All', L: 'Leaders', C: 'Others', mission: 'Missions', facility: 'Facilities', mm: 'Masterminds' };
  const GROUPS = [
    ['Leaders', id => CARDS[id].cls === 'L'],
    ['Characters', id => CARDS[id].type === 'char' && CARDS[id].cls !== 'L'],
    ['Missions', id => CARDS[id].type === 'mission'],
    ['Facilities', id => CARDS[id].type === 'facility'],
  ];

  const inDeck = id => deck.filter(x => x === id).length;
  const counts = $derived(deck.reduce((o, id) => { o[id] = (o[id] || 0) + 1; return o; }, {}));
  const probs = $derived(deckProblems(deck, mm));

  // Owned cards that match the filter.
  const ids = $derived(Object.keys(S.coll).map(Number).filter(id => S.coll[id] > 0).filter(id => {
    const c = CARDS[id];
    if (filter === 'all') return true;
    if (filter === 'L') return c.cls === 'L';
    if (filter === 'C') return c.type === 'char' && c.cls !== 'L';
    return c.type === filter;
  }).sort((a, b) => a - b));
  const left = id => S.coll[id] - (CARDS[id].type === 'mm' ? (mm === id ? 1 : 0) : inDeck(id));

  function add(id) {
    if (CARDS[id].type === 'mm') mm = id;
    else if (inDeck(id) < S.coll[id] && inDeck(id) < 3 && deck.length < 50) deck.push(id);
  }
  function remove(id) { deck.splice(deck.indexOf(id), 1); }

  function saveDeck() { S.deck = deck.slice(); S.mm = mm; save(); go('hub'); }
  function back() {
    if ((deck.join() !== S.deck.join() || mm !== S.mm) && !confirm('Leave without saving?')) return;
    go('hub');
  }
</script>

<div class="screen deckscreen" {@attach cardHover(id => (detail = id))}>
  <div class="dk">
    <div class="pane win">
      <div class="filters">
        {#each Object.entries(FILTERS) as [k, v]}
          <button class="btn" class:on={filter === k} onclick={() => (filter = k)}>{v}</button>
        {/each}
        <span class="label">Click a card to add it.</span>
      </div>
      <div class="grid">
        {#each ids as id (id)}
          <div class="gcell" onclick={() => add(id)} role="presentation">
            <Card {id} s={0.9} cls={left(id) > 0 ? '' : 'dim'} />
            <div class="cnt">{left(id)}/{S.coll[id]}</div>
          </div>
        {/each}
      </div>
    </div>

    <div class="pane win">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:6px">
        <h2 style="margin:0;white-space:nowrap;font-size:22px">Deck {deck.length}/50</h2>
        <div class="mbtns" style="gap:6px">
          <button class="btn" disabled={probs.length > 0} onclick={saveDeck}>Save</button>
          <button class="btn" onclick={back}>Back</button>
        </div>
      </div>
      {#each probs as p}<div class="warnmsg">{p}</div>{:else}<div class="okmsg">The deck is legal.</div>{/each}
      <div class="dlist">
        <div class="sec">Mastermind (optional)</div>
        {#if mm}
          <div class="it" data-cid={mm} onclick={() => (mm = null)} role="presentation"><span>{CARDS[mm].name}</span><span>×</span></div>
        {:else}
          <div class="label">none</div>
        {/if}
        {#each GROUPS as [name, f]}
          {@const group = Object.keys(counts).map(Number).filter(f).sort((a, b) => a - b)}
          <div class="sec">{name} ({group.reduce((a, id) => a + counts[id], 0)})</div>
          {#each group as id (id)}
            <div class="it" data-cid={id} onclick={() => remove(id)} role="presentation">
              <span>{String(id).padStart(3, '0')} {CARDS[id].name}</span><span>×{counts[id]}</span>
            </div>
          {/each}
        {/each}
      </div>
    </div>

    <div class="win detail" style="height:auto"><CardDetail id={detail} /></div>
  </div>
</div>
