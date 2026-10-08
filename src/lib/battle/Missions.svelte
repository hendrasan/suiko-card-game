<script>
  // The 4 mission slots. Enemy units on top, your units below.
  import Card from '../components/Card.svelte';
  import Icon from '../components/Icon.svelte';
  import { ui } from '../battle.svelte.js';

  const g = ui.g;
  const canContinue = m => ui.req?.type === 'main' && g.canContinue(0, m);
  const kind = m => (m.mode === 'fac' ? 'facility' : m.mode === 'mil' ? 'army battle' : 'mission');
</script>

{#snippet total(m, p, cls)}
  {@const n = g.need(m, p)}
  <div class="t {cls}"><Icon k={n.key} /><span class="px-num">{g.total(m, p, n.key)}</span><small>/{n.target}</small></div>
{/snippet}

{#snippet units(m, p)}
  {@const key = g.need(m, p).key}
  <div class="mside" class:crowd={m.sides[p].length > 4}>
    {#each m.sides[p] as x (x.uid)}
      {@const base = g.def(x)[key]}
      {@const v = g.stat(x, m)[key]}
      <div class="unit">
        <Card id={x.id} s={0.6} small />
        <div class="v px-num" class:up={v > base} class:down={v < base}>{v}</div>
      </div>
    {/each}
  </div>
{/snippet}

<div class="missions win">
  {#each [0, 1, 2, 3] as k}
    {@const m = g.missions[k]}
    {#if !m}
      <div class="mslot"></div>
    {:else}
      <div class="mslot" class:active={g.active === m} class:can={canContinue(m)}>
        {@render units(m, 1)}
        <div class="mcenter">
          <div class="tots">{@render total(m, 1, 'o')}{@render total(m, 0, 'm')}</div>
          <Card id={m.card} s={0.9} />
        </div>
        <div class="mtag">{m.owner === 0 ? 'Your' : 'Enemy'} {kind(m)}</div>
        {@render units(m, 0)}
        {#if canContinue(m)}
          <button class="btn cont" onclick={() => ui.answer({ type: 'continue', mission: m })}>Continue</button>
        {/if}
      </div>
    {/if}
  {/each}
</div>
