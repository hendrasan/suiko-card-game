<script>
  // Campaign hub: top bar, menu and the Battle / Shop pane.
  import { game, nav, go } from '../save.svelte.js';
  import Campaign from './Campaign.svelte';
  import Shop from './Shop.svelte';
  import SoundToggle from '../components/SoundToggle.svelte';
  import Icon from '../components/Icon.svelte';

  const S = game.S;
  const owned = $derived(Object.values(S.coll).reduce((a, b) => a + b, 0));
  const seen = $derived(Object.keys(S.seen).length);

  const MENU = [
    ['atk', 'Battle', () => go('hub', { tab: 'campaign' })],
    ['cards', 'Edit Deck', () => go('deck')],
    ['shop', 'Card Shop', () => go('hub', { tab: 'shop' })],
    ['book', 'Card File', () => go('file')],
    ['help', 'How to Play', () => go('rules', { back: 'hub' })],
    ['home', 'Title Screen', () => go('title')],
  ];
</script>

<div class="screen hub">
  <div class="hubtop win">
    <span>{S.name}'s Army</span><span>Wins {S.wins} · Losses {S.losses}</span>
    <span>Cards {owned} · File {seen}/250</span><span class="gold">{S.potch} potch</span>
  </div>
  <div class="hubgrid">
    <div class="menu win">
      {#each MENU as [icon, label, onclick]}<button class="btn" {onclick}><Icon k={icon} />{label}</button>{/each}
      <SoundToggle />
    </div>
    <div class="pane win">
      {#if nav.tab === 'shop'}<Shop />{:else}<Campaign />{/if}
    </div>
  </div>
</div>
