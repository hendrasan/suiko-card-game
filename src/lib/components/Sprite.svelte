<script module>
  // battle_sprites.png: 144 chibi sprites (ripped by James816), 32×32 each,
  // 10 per row at x = 11 + 42·col, y = 11 + 42·row. They are in card order:
  // one sprite per character, at the first card of that character.
  import { CARDS } from '../game/cards.js';

  const INDEX = {};
  Object.values(CARDS)
    .filter(c => (c.type === 'char' || c.type === 'mm') && !c.silver)
    .sort((a, b) => a.id - b.id)
    .forEach(c => { if (!(c.key in INDEX)) INDEX[c.key] = Object.keys(INDEX).length; });
</script>

<script>
  // Chibi sprite of a character card. scale 2 = 64×64 px. flip: face right (sprites face left).
  let { id, scale = 2, flip = false } = $props();

  const i = $derived(INDEX[CARDS[id].key]);
  const size = $derived(32 * scale);
  const bg = $derived(`background-image:url(assets/battle_sprites.png);background-size:${433 * scale}px ${643 * scale}px;` +
    `background-position:${-(11 + 42 * (i % 10)) * scale}px ${-(11 + 42 * Math.floor(i / 10)) * scale}px`);
</script>

<div class="sprite" class:flip style="width:{size}px;height:{size}px;{bg}" data-cid={id}></div>

<style>
  .sprite { flex: none; background-repeat: no-repeat;
    image-rendering: pixelated; cursor: pointer; }
  .flip { transform: scaleX(-1); }
</style>
