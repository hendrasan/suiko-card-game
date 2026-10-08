<script>
  // Shown after a battle. lines: reward text; got: new card ids.
  import Card from '../components/Card.svelte';
  import { go } from '../save.svelte.js';

  let { win, lines, got } = $props();
</script>

<div class="screen title">
  <div class="win mbox">
    <h2>{win ? 'Victory!' : 'Defeat'}</h2>
    <div>{#each lines as line}<div>{line}</div>{/each}</div>
    {#if got.length}
      <div>New cards:</div>
      <div class="mcards">{#each got as id}<Card {id} s={1.3} />{/each}</div>
    {/if}
    <button class="btn big" onclick={() => go('hub', { tab: 'campaign' })}>Return</button>
  </div>
</div>
