<script>
  import Card from '../components/Card.svelte';
  import { game, load, go } from '../save.svelte.js';

  const saved = load();

  function cont() { game.S = load(); go('hub'); }
</script>

<div class="screen title">
  <div class="logo"><div class="a">GENSO SUIKODEN</div><div class="b">CARD STORIES</div><div class="c">a fan-made web remake</div></div>
  <div class="titlecards">
    {#each [25, 8, 18, 55, 31] as id}<Card {id} s={1.3} />{/each}
  </div>
  <button class="btn big" onclick={() => go('name')}>New Game</button>
  <button class="btn big" disabled={!saved} onclick={cont}>Continue</button>
  <button class="btn big" onclick={() => go('rules', { back: 'title' })}>How to Play</button>
</div>
