<script>
  // Campaign hub: top bar, menu and the Battle / Shop pane.
  import { game, nav, go } from '../save.svelte.js';
  import Campaign from './Campaign.svelte';
  import Shop from './Shop.svelte';

  const S = game.S;
  const owned = $derived(Object.values(S.coll).reduce((a, b) => a + b, 0));
  const seen = $derived(Object.keys(S.seen).length);

  const MENU = [
    ['⚔ Battle', () => go('hub', { tab: 'campaign' })],
    ['▤ Edit Deck', () => go('deck')],
    ['◈ Card Shop', () => go('hub', { tab: 'shop' })],
    ['▦ Card File', () => go('file')],
    ['? How to Play', () => go('rules', { back: 'hub' })],
    ['⏻ Title Screen', () => go('title')],
  ];
</script>

<div class="screen hub">
  <div class="hubtop win">
    <span>{S.name}'s Army</span><span>Wins {S.wins} · Losses {S.losses}</span>
    <span>Cards {owned} · File {seen}/250</span><span class="gold">{S.potch} potch</span>
  </div>
  <div class="hubgrid">
    <div class="menu win">
      {#each MENU as [label, onclick]}<button class="btn" {onclick}>{label}</button>{/each}
    </div>
    <div class="pane win">
      {#if nav.tab === 'shop'}<Shop />{:else}<Campaign />{/if}
    </div>
  </div>
</div>
