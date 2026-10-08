<script>
  // Sound on/off button. compact: small icon button (battle screen).
  import { sound, toggleSound } from '../sound.svelte.js';

  let { compact = false } = $props();
</script>

<button class="btn" class:compact title="Sound on/off (M)" onclick={toggleSound}>
  {sound.on ? '♪' : '✕'}{#if !compact} Sound: {sound.on ? 'On' : 'Off'}{/if}
</button>

<style>
  .compact { position: absolute; right: 16px; bottom: 14px; z-index: 5; font-size: 14px; padding: 2px 8px; }
</style>
