<script>
  import { cardHover } from '../hover.js';
  import { ui, sceneOf } from '../battle.svelte.js';
  import CardDetail from '../components/CardDetail.svelte';
  import Side from '../battle/Side.svelte';
  import Missions from '../battle/Missions.svelte';
  import Scene from '../battle/Scene.svelte';
  import HandBar from '../battle/HandBar.svelte';
  import Modal from '../battle/Modal.svelte';

  // New scene data after each engine update (ui.version). The Scene stays mounted,
  // so units animate only when they arrive and totals count up from the last value.
  const scene = $derived.by(() => { ui.version; return sceneOf(ui.g); });
  const scrollToEnd = el => { el.scrollTop = el.scrollHeight; };
</script>

<div class="screen" {@attach cardHover(id => (ui.detail = id))}>
  <!-- The engine changes its objects in place. Draw these parts again on each engine update. -->
  <div id="board">
    {#key ui.version}<Side p={1} />{/key}
    {#if scene}
      <div class="scene-slot">
        {#key scene.uid}<Scene card={scene.card} theme={scene.theme} label={scene.label} sides={scene.sides} />{/key}
      </div>
    {:else}
      {#key ui.version}<Missions />{/key}
    {/if}
    {#key ui.version}<Side p={0} /><HandBar />{/key}
  </div>
  {#key ui.version}
    <div id="panel">
      <div class="detail win"><CardDetail id={ui.detail} /></div>
      <div class="log win" {@attach scrollToEnd}>
        {#each ui.g.logs.slice(-60) as line}<div>{line}</div>{/each}
      </div>
    </div>
  {/key}
  <Modal />
</div>
