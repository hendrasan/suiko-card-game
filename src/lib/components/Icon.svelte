<script>
  // Pixel icon: atk (Sword), mil (Flag/troops), bld (Hammer), deck, disc (discard pile),
  // and menu icons: cards, shop, book, help, home, note (sound), notes (music).
  import { ICON_URLS } from './pixelIcons.js';

  const NAMES = { atk: 'Sword', mil: 'Troops', bld: 'Hammer', deck: 'Deck', disc: 'Discard', cards: '', shop: '', book: '', help: '', home: '', note: '', notes: '' };
  let { k } = $props();
</script>

<img class="ic" src={ICON_URLS[k]} alt={NAMES[k]} draggable="false">
