<script>
  // One player's row: name plate with VP, deck/discard counters, mastermind, hand (enemy only), cleared cards.
  import Card from '../components/Card.svelte';
  import Icon from '../components/Icon.svelte';
  import { ui } from '../battle.svelte.js';

  let { p } = $props();

  const g = ui.g;
  const P = $derived(g.P[p]);
  const me = $derived(p === 0);
  const showHand = $derived(P.revealed || g.over);
  const peek = $derived(g.P[0].peek || []);
</script>

<div class="side" class:me class:opp={!me}>
  <div class="plate">
    <div class="nm">{P.name}</div>
    <div class="vp">
      <span class="vpl">VP</span>
      {#each { length: P.vpTarget }, i}<span class="pip" class:on={i < P.vp}></span>{/each}
    </div>
  </div>
  <div class="counts">
    <div title="Cards in deck"><Icon k="deck" /><span class="px-num">×{P.deck.length}</span></div>
    <div title="Cards in discard pile"><Icon k="disc" /><span class="px-num">×{P.discard.length}</span></div>
  </div>
  {#if P.mm}<Card id={P.mm} s={0.72} />{/if}
  {#if !me}
    <div class="ohand">
      {#each P.hand as c (c.uid)}
        {#if showHand || peek.includes(c.uid)}<Card id={c.id} s={0.62} small />{:else}<div class="cardback" style="--s:.62"></div>{/if}
      {/each}
    </div>
  {/if}
  <div class="resolved">
    {#each P.resolved as r (r.uid)}
      <div class="res">
        <Card id={r.card} s={0.66} small />
        {#if r.stationed}<Card id={r.stationed.id} s={0.5} small />{/if}
      </div>
    {/each}
  </div>
</div>
