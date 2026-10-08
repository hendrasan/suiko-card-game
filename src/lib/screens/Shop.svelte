<script>
  // Card shop: buy cards and packs, sell spare cards. Point at a card to see it on the right.
  // Every buy or sell asks for confirmation first.
  import Card from '../components/Card.svelte';
  import CardDetail from '../components/CardDetail.svelte';
  import { CARDS, cardPrice } from '../game/cards.js';
  import { game, save, addCard, openPack, PACK_PRICE } from '../save.svelte.js';
  import { fx } from '../sound.svelte.js';
  import { cardHover } from '../hover.js';

  const S = game.S;
  let msg = $state('');
  let pack = $state(null);       // cards from the last pack
  let detail = $state(S.shop[0]); // card in the detail panel
  let ask = $state(null);        // open confirmation: {kind: 'buy' | 'sell' | 'pack', id, price}

  // Cards you own that are not in the deck (or the mastermind slot).
  const spare = $derived.by(() => {
    const used = {};
    S.deck.forEach(id => { used[id] = (used[id] || 0) + 1; });
    if (S.mm) used[S.mm] = (used[S.mm] || 0) + 1;
    return Object.keys(S.coll).map(Number).filter(id => S.coll[id] - (used[id] || 0) > 0).sort((a, b) => a - b)
      .map(id => ({ id, n: S.coll[id] - (used[id] || 0) }));
  });
  const sellPrice = id => Math.round(cardPrice(id) / 4);

  function buyPack() {
    S.potch -= PACK_PRICE;
    pack = openPack(); pack.forEach(id => addCard(id)); save();
    fx('pack');
    msg = '';
  }
  function buy(id) { S.potch -= cardPrice(id); addCard(id); save(); pack = null; msg = `Bought ${CARDS[id].name}.`; }
  function sell(id) { S.coll[id]--; S.potch += sellPrice(id); save(); pack = null; msg = `Sold ${CARDS[id].name}.`; }

  function confirm() {
    const a = ask;
    if (!a) return;
    ask = null;
    if (a.kind === 'pack') buyPack();
    else if (a.kind === 'buy') buy(a.id);
    else sell(a.id);
  }
  // Enter = confirm, Escape = cancel.
  function onkeydown(e) {
    if (!ask || (e.key !== 'Enter' && e.key !== 'Escape')) return;
    e.preventDefault(); // else Enter also clicks the focused button
    if (e.key === 'Enter') confirm(); else ask = null;
  }
</script>

<svelte:window {onkeydown} />

<div class="shop" {@attach cardHover(id => (detail = id))}>
  <div class="list">
    {#if pack}<div class="mcards">{#each pack as id}<Card {id} s={1.2} />{/each}</div>{/if}
    <h2>Card Shop</h2>
    {#if msg}<div class="okmsg">{msg}</div>{/if}
    <div style="margin:8px 0 14px">
      <button class="btn" style="white-space:nowrap" disabled={S.potch < PACK_PRICE} onclick={() => (ask = { kind: 'pack', price: PACK_PRICE })}>Buy a pack of 5 cards ({PACK_PRICE} potch)</button>
      <div class="label" style="margin-top:4px">The stock changes after each battle.</div>
    </div>
    <div class="label">For sale — point at a card to see what it does</div>
    <div class="grid" style="margin-bottom:16px">
      {#each S.shop as id}
        <div class="gcell">
          <Card {id} s={0.9} cls={detail === id ? 'cur' : ''} />
          <button class="btn" style="font-size:13px;padding:2px 6px" disabled={S.potch < cardPrice(id)}
            onclick={() => (ask = { kind: 'buy', id, price: cardPrice(id) })}>{cardPrice(id)}</button>
        </div>
      {/each}
    </div>
    <div class="label">Sell spare cards (cards not in your deck) for 1/4 of the price</div>
    <div class="grid">
      {#each spare as { id, n } (id)}
        <div class="gcell">
          <Card {id} s={0.7} small />
          <div class="cnt">{n}</div>
          <button class="btn" style="font-size:12px;padding:1px 5px" onclick={() => (ask = { kind: 'sell', id, price: sellPrice(id) })}>{sellPrice(id)}</button>
        </div>
      {/each}
    </div>
  </div>
  <div class="win detail" style="height:auto"><CardDetail id={detail} /></div>
</div>

{#if ask}
  <div id="modal" class="on">
    <div class="mbox win">
      {#if ask.kind === 'pack'}
        <h2>Buy a pack of 5 random cards for {ask.price} potch?</h2>
      {:else}
        <h2>{ask.kind === 'buy' ? 'Buy' : 'Sell'} {CARDS[ask.id].name} for {ask.price} potch?</h2>
        <Card id={ask.id} s={1.6} />
      {/if}
      <div class="label">You have {S.potch} potch.</div>
      <div class="mbtns">
        <button class="btn" class:warn={ask.kind === 'sell'} onclick={confirm}>{ask.kind === 'sell' ? 'Sell' : 'Buy'}</button>
        <button class="btn" onclick={() => (ask = null)}>Cancel</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .shop { display: grid; grid-template-columns: 1fr 300px; gap: 14px; height: 100%; }
  .list { overflow-y: auto; min-height: 0; padding-right: 4px; }
  .detail { align-self: start; }
  .shop :global(.card.cur) { filter: drop-shadow(0 0 5px var(--gold)); }
</style>
