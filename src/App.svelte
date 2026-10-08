<script>
  // Fixed 1280×800 stage, scaled to fit the window. Shows the current screen.
  import { nav } from './lib/save.svelte.js';
  import Title from './lib/screens/Title.svelte';
  import NameEntry from './lib/screens/NameEntry.svelte';
  import Hub from './lib/screens/Hub.svelte';
  import DeckEditor from './lib/screens/DeckEditor.svelte';
  import CardFile from './lib/screens/CardFile.svelte';
  import Rules from './lib/screens/Rules.svelte';
  import Battle from './lib/screens/Battle.svelte';
  import Result from './lib/screens/Result.svelte';
  import { sfx, toggleSound, toggleMusic, music } from './lib/sound.svelte.js';

  const SCREENS = { title: Title, name: NameEntry, hub: Hub, deck: DeckEditor, file: CardFile, rules: Rules, battle: Battle, result: Result };

  let w = $state(1280), h = $state(800);
  const scale = $derived(Math.min(w / 1280, h / 800));
  const Screen = $derived(SCREENS[nav.screen]);

  $effect(() => music(nav.screen === 'battle' ? 'battle' : 'menu'));

  // A soft tap for every button. M: sound effects on/off. N: music on/off.
  function onclick(e) { if (e.target.closest('button:not(:disabled)')) sfx('tap', { volume: 0.5 }); }
  function onkeydown(e) {
    if (e.target.tagName === 'INPUT') return;
    const k = e.key.toLowerCase();
    if (k === 'm') toggleSound();
    if (k === 'n') toggleMusic();
  }
</script>

<svelte:window bind:innerWidth={w} bind:innerHeight={h} {onkeydown} />

<div id="wrap">
  <div id="stage" style="transform:scale({scale})" {onclick} role="presentation">
    {#key nav.screen}
      <Screen {...nav.props} />
    {/key}
  </div>
</div>
