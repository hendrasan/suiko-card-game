<script>
  // Prompt text and buttons for the open request.
  import Icon from '../components/Icon.svelte';
  import { ui } from '../battle.svelte.js';

  const g = ui.g;
  const P = g.P[0];
  const req = $derived(ui.req);
  const sel = $derived(ui.sel);

  // main: one selected card that you can play as a mission
  const one = $derived(sel.length === 1 ? sel[0] : null);
  const playable = $derived(req?.type === 'main' && one && g.canPlayMission(0, one) ? g.def(one) : null);
  const minDiscard = $derived(req?.type === 'main' ? g.minDiscard(0) : 0);

  // deploy: why the selected card cannot go to the mission ('' = it can)
  const why = $derived(req?.type === 'deploy' && sel[0] ? g.whyNot(0, sel[0], req.m) : '');

  // Raura (Response): other missions Raura can go to.
  const rauraTo = $derived(req?.type === 'deploy' ? g.rauraTargets(0, req.m) : []);
  function raura() {
    const items = rauraTo.map(m => ({ uid: 'm' + m.uid, id: m.card, m }));
    ui.askModal({ title: 'Raura: go to which mission?', items, kind: 'card', min: 0, max: 1 })
      .then(r => { if (r.length) ui.answer({ type: 'raura', card: g.handCard(0, 'Raura'), mission: r[0].m }); });
  }

  function luca() {
    const m = req.m;
    ui.askModal({ title: 'Luca: sacrifice which ally?', items: m.sides[0].slice(), kind: 'inst', min: 0, max: 1 })
      .then(r => { if (r.length) ui.answer({ type: 'luca', inst: r[0] }); });
  }
</script>

{#if g.over}
  <div class="prompt">{g.winner === 0 ? 'Victory!' : 'Defeat...'}</div>
  <button class="btn" onclick={() => ui.onLeave(g.winner)}>Continue</button>
{:else if !req}
  <div class="prompt" style="color:var(--dim)">{g.turn === 1 ? g.P[1].name + ' is thinking...' : '...'}</div>
{:else if req.type === 'mulligan'}
  <div class="prompt">Select up to 3 cards to return and draw again.</div>
  <button class="btn" disabled={!sel.length || sel.length > 3} onclick={() => ui.answer(sel.slice())}>Return {sel.length} card(s)</button>
  <button class="btn" onclick={() => ui.answer([])}>Keep this hand</button>
{:else if req.type === 'main'}
  <div class="prompt">Your turn. Play a mission, continue a battle, or discard cards.</div>
  {#if playable}
    {#if playable.mode === 'choose'}
      <button class="btn" onclick={() => ui.answer({ type: 'play', card: one, mode: 'atk' })}>Play as Sword battle</button>
      <button class="btn" onclick={() => ui.answer({ type: 'play', card: one, mode: 'mil' })}>Play as Army battle</button>
    {:else}
      <button class="btn" onclick={() => ui.answer({ type: 'play', card: one })}>Play {playable.name}</button>
    {/if}
  {/if}
  {#if !P.hand.length}
    <button class="btn" onclick={() => ui.answer({ type: 'discard', cards: [] })}>End turn</button>
  {:else}
    <button class="btn warn" disabled={sel.length < minDiscard} onclick={() => ui.answer({ type: 'discard', cards: sel.slice() })}>
      Discard {sel.length} card(s){minDiscard > 1 ? ` (min ${minDiscard})` : ''}
    </button>
  {/if}
{:else if req.type === 'deploy'}
  {@const n = g.need(req.m, 0)}
  <div class="prompt">{g.def(req.m.card).name}: you need <Icon k={n.key} /> {n.target}. Send a character or pass.</div>
  <button class="btn" disabled={!sel[0] || !!why} onclick={() => ui.answer({ type: 'deploy', card: sel[0] })}>
    {sel[0] ? `Send ${g.def(sel[0]).name}` : 'Send'}
  </button>
  {#if P.mm && g.def(P.mm).base === 7 && !P.lucaUsed && req.m.sides[0].length}
    <button class="btn" onclick={luca}>Luca: sacrifice an ally</button>
  {/if}
  {#if rauraTo.length}<button class="btn" onclick={raura}>Raura: go to another mission</button>{/if}
  {#if g.canGamble(0)}<button class="btn" onclick={() => ui.answer({ type: 'gamble' })}>Gambling Hall: play top card</button>{/if}
  <button class="btn" disabled={req.opts.mustPlay} onclick={() => ui.answer({ type: 'pass' })}>Pass</button>
  {#if why}<div class="warnmsg">{why}</div>{/if}
{:else}
  <div class="prompt">Choose...</div>
{/if}
