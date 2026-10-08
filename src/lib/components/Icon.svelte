<script>
  // Stat icon: atk (Sword), mil (Flag/troops), bld (Hammer).
  const ICONS = { atk: '⚔', mil: '⚑', bld: '⚒' };
  let { k } = $props();
</script>

<span class="ic">{ICONS[k]}</span>
