<script>
  import { cardHover } from '../hover.js';
  import { ui } from '../battle.svelte.js';
  import CardDetail from '../components/CardDetail.svelte';
  import Side from '../battle/Side.svelte';
  import Missions from '../battle/Missions.svelte';
  import HandBar from '../battle/HandBar.svelte';
  import Modal from '../battle/Modal.svelte';

  const scrollToEnd = el => { el.scrollTop = el.scrollHeight; };
</script>

<div class="screen" {@attach cardHover(id => (ui.detail = id))}>
  <!-- The engine changes its objects in place. Draw the board again on each engine update. -->
  {#key ui.version}
    <div id="board">
      <Side p={1} />
      <Missions />
      <Side p={0} />
      <HandBar />
    </div>
    <div id="panel">
      <div class="detail win"><CardDetail id={ui.detail} /></div>
      <div class="log win" {@attach scrollToEnd}>
        {#each ui.g.logs.slice(-60) as line}<div>{line}</div>{/each}
      </div>
    </div>
  {/key}
  <Modal />
</div>
