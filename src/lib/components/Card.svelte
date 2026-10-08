<script>
  // One card from the sprite sheets. s = scale (1 = 80×110 px).
  // stats: current {atk, mil, bld} of an instance; shown green/red against the base value.
  // Other props (onclick, ondblclick, ...) go to the root element.
  import { CARDS, cardSprite } from '../game/cards.js';
  import Icon from './Icon.svelte';

  let { id, s, small = false, cls = '', stats = null, ...rest } = $props();

  const c = $derived(CARDS[id]);
  const sp = $derived(cardSprite(id));
  const bg = $derived(`background-image:url(assets/${sp.sheet}.png);background-size:${822 * s}px ${612 * s}px;` +
    `background-position:${-(2 + 82 * sp.col) * s}px ${-(2 + 112 * sp.row) * s}px`);

  // Position of a text box over the card art, in card pixels (80×110).
  const box = (x0, x1, y0, y1) => `left:${x0 / .8}%;width:${(x1 - x0) / .8}%;top:${y0 / 1.1}%;height:${(y1 - y0) / 1.1}%`;
  const cmp = k => (stats ? (stats[k] > c[k] ? 'up' : stats[k] < c[k] ? 'down' : '') : '');
  const val = k => (stats ? stats[k] : c[k]);
</script>

<div class="card {cls}" class:small style="--s:{s}" data-cid={id} {...rest}>
  <div class="art" style={bg}></div>
  {#if !small && s >= 0.9}
    <div class="ov name">{c.name}</div>
    {#if c.type === 'char'}
      <div class="ov {cmp('atk')}" style={box(10, 28, 80.5, 88.5)}>{val('atk')}</div>
      <div class="ov {cmp('mil')}" style={box(29, 52.5, 80.5, 88.5)}>{val('mil')}</div>
      <div class="ov {cmp('bld')}" style={box(53.5, 73, 80.5, 88.5)}>{val('bld')}</div>
      <div class="ov tag">{c.cls === 'L' ? 'LEADER ' : ''}{c.links}</div>
    {:else if c.type === 'mission'}
      <div class="ov" style={box(10, 46, 79, 87.5)}>
        {#if c.mode === 'duel'}DUEL{:else}
          {#if c.atk}<Icon k="atk" />{c.atk}{/if}
          {#if c.mil}<Icon k="mil" />{c.mil}{/if}
        {/if}
      </div>
      <div class="ov" style={box(50, 73, 79, 87.5)}>VP {c.vp[0]}/{c.vp[1]}</div>
    {:else if c.type === 'facility'}
      <div class="ov" style={box(10, 46, 79, 87.5)}><Icon k="bld" />{c.bld}</div>
      <div class="ov" style={box(50, 73, 79, 87.5)}><Icon k="atk" />{c.atk}</div>
    {:else}
      <div class="ov tag">MASTERMIND</div>
    {/if}
  {/if}
</div>
