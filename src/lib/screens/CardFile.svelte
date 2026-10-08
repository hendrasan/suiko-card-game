<script>
  import { cardHover } from '../hover.js';
  import Card from '../components/Card.svelte';
  import CardDetail from '../components/CardDetail.svelte';
  import { game, go } from '../save.svelte.js';

  const seen = game.S.seen;
  const ALL = Array.from({ length: 250 }, (_, i) => i + 1);
  let detail = $state(null);
</script>

<div class="screen deckscreen" {@attach cardHover(id => (detail = id))}>
  <div class="dk" style="grid-template-columns:1fr 312px">
    <div class="pane win">
      <h2>Card File — {Object.keys(seen).length}/250 seen</h2>
      <div class="grid">
        {#each ALL as id}
          <div class="gcell">
            {#if seen[id]}<Card {id} s={0.62} small />{:else}<div class="cardback unseen" style="--s:.62"></div>{/if}
            <span class="num">{String(id).padStart(3, '0')}</span>
          </div>
        {/each}
      </div>
    </div>
    <div class="win detail" style="height:auto"><CardDetail id={detail} /></div>
  </div>
  <button class="btn" style="position:absolute;right:20px;bottom:20px" onclick={() => go('hub')}>Back</button>
</div>
