<script>
  import Card from '../components/Card.svelte';
  import { CARDS, cardPrice } from '../game/cards.js';
  import { game, save, addCard, openPack, PACK_PRICE } from '../save.svelte.js';
  import { fx } from '../sound.svelte.js';

  const S = game.S;
  let msg = $state('');
  let pack = $state(null); // cards from the last pack

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
</script>

{#if pack}<div class="mcards">{#each pack as id}<Card {id} s={1.2} />{/each}</div>{/if}
<h2>Card Shop</h2>
{#if msg}<div class="okmsg">{msg}</div>{/if}
<div style="display:flex;gap:16px;align-items:center;margin:8px 0 14px">
  <button class="btn" disabled={S.potch < PACK_PRICE} onclick={buyPack}>Buy a pack of 5 cards ({PACK_PRICE} potch)</button>
  <span class="label">The stock changes after each battle.</span>
</div>
<div class="label">For sale</div>
<div class="grid" style="margin-bottom:16px">
  {#each S.shop as id}
    <div class="gcell">
      <Card {id} s={0.9} />
      <button class="btn" style="font-size:13px;padding:2px 6px" disabled={S.potch < cardPrice(id)} onclick={() => buy(id)}>{cardPrice(id)}</button>
    </div>
  {/each}
</div>
<div class="label">Sell spare cards (cards not in your deck) for 1/4 of the price</div>
<div class="grid">
  {#each spare as { id, n } (id)}
    <div class="gcell">
      <Card {id} s={0.7} small />
      <div class="cnt">{n}</div>
      <button class="btn" style="font-size:12px;padding:1px 5px" onclick={() => sell(id)}>{sellPrice(id)}</button>
    </div>
  {/each}
</div>
