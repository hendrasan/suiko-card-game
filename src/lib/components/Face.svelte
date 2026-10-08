<script>
  // Face crop from the card art, in a pixel frame. size = width/height in px.
  import { cardSprite } from '../game/cards.js';

  let { id, size = 52 } = $props();

  // Crop window inside the 80×110 card (art area, upper middle).
  const X = 18, Y = 15, W = 44;
  const k = $derived(size / W);
  const sp = $derived(cardSprite(id));
  const bg = $derived(`background-image:url(assets/${sp.sheet}.png);background-size:${822 * k}px ${612 * k}px;` +
    `background-position:${-(2 + 82 * sp.col + X) * k}px ${-(2 + 112 * sp.row + Y) * k}px`);
</script>

<div class="face" style="width:{size}px;height:{size}px;{bg}" data-cid={id}></div>

<style>
  .face { flex: none; background-repeat: no-repeat; image-rendering: pixelated; cursor: pointer;
    border: 3px solid var(--ink); box-shadow: inset 0 0 0 2px #fff8; border-radius: 3px; }
</style>
