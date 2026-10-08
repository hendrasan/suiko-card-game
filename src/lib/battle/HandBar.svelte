<script>
  // Your hand and the action buttons.
  import Card from '../components/Card.svelte';
  import Actions from './Actions.svelte';
  import { ui } from '../battle.svelte.js';

  const g = ui.g;
  const hand = g.P[0].hand;

  // Hand cards you can use now.
  const legal = $derived.by(() => {
    const req = ui.req, s = new Set();
    if (req?.type === 'deploy') g.legalCards(0, req.m).forEach(c => s.add(c.uid));
    if (req?.type === 'main') hand.forEach(c => { if (g.canPlayMission(0, c)) s.add(c.uid); });
    return s;
  });

  function cls(c) {
    let k = ui.sel.includes(c) ? 'sel' : '';
    if (ui.req?.type === 'deploy') k += legal.has(c.uid) ? ' legal' : ' dim';
    else if (ui.req?.type === 'main' && legal.has(c.uid)) k += ' legal';
    return k;
  }
</script>

<div class="handbar win">
  <div class="hand">
    {#each hand as c (c.uid)}
      <Card id={c.id} s={1.2} cls={cls(c)} onclick={() => ui.toggleHand(c)} ondblclick={() => ui.quickSend(c)} />
    {/each}
  </div>
  <div class="actions"><Actions /></div>
</div>
