<script>
  // Pop-up for card choices (items) or plain questions (buttons).
  import Card from '../components/Card.svelte';
  import { ui } from '../battle.svelte.js';

  const md = $derived(ui.modal);
  const n = $derived(md ? md.picked.length : 0);
</script>

<div id="modal" class:on={!!md}>
  {#if md}
    <div class="mbox win">
      <h2>{md.title}</h2>
      {#if md.items}
        <div class="mcards">
          {#each md.items as x, i}
            <Card id={x.id} s={1.3} cls={md.picked.includes(i) ? 'sel' : ''}
              stats={md.kind === 'inst' ? ui.g.stat(x) : null} onclick={() => ui.pick(i)} />
          {/each}
        </div>
        <div class="mbtns">
          <button class="btn" disabled={n < md.min || n > md.max} onclick={() => ui.closeModal(md.picked.map(i => md.items[i]))}>{md.okLabel || 'OK'}</button>
          {#if md.min === 0}<button class="btn" onclick={() => ui.closeModal([])}>{md.skipLabel || 'Skip'}</button>{/if}
        </div>
      {/if}
      {#if md.buttons}
        <div class="mbtns">
          {#each md.buttons as b, i}<button class="btn" onclick={() => ui.closeModal(i)}>{b}</button>{/each}
        </div>
      {/if}
    </div>
  {/if}
</div>
