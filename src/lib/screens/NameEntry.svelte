<script>
  import { load, newGame, go } from '../save.svelte.js';

  let name = $state('Riou');

  function start() {
    if (load() && !confirm('This will replace your saved game. Continue?')) return;
    newGame(name.trim() || 'Riou');
    go('hub', { tab: 'campaign' });
  }
  const focus = el => { el.focus(); el.select(); };
</script>

<div class="screen title">
  <div class="win mbox">
    <h2>Enter your name</h2>
    <input class="name" maxlength="12" bind:value={name} {@attach focus} onkeydown={e => { if (e.key === 'Enter') start(); }}>
    <button class="btn big" onclick={start}>Start</button>
  </div>
</div>
