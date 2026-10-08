<script>
  // Sound effects and music on/off buttons. compact: small icon buttons (battle screen).
  import { sound, toggleSound, toggleMusic } from '../sound.svelte.js';
  import Icon from './Icon.svelte';

  let { compact = false } = $props();
</script>

<div class:compact>
  <button class="btn" class:off={!sound.on} title="Sound effects on/off (M)" onclick={toggleSound}>
    <Icon k="note" />{#if !compact} Sound: {sound.on ? 'On' : 'Off'}{/if}
  </button>
  <button class="btn" class:off={!sound.music} title="Music on/off (N)" onclick={toggleMusic}>
    <Icon k="notes" />{#if !compact} Music: {sound.music ? 'On' : 'Off'}{/if}
  </button>
</div>

<style>
  div { display: flex; flex-direction: column; gap: 10px; }
  .compact { position: absolute; right: 16px; bottom: 14px; z-index: 5; flex-direction: row; gap: 4px; }
  .compact .btn { font-size: 14px; padding: 2px 8px; }
  .off :global(.ic) { opacity: .35; }
</style>
