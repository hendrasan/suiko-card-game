<script>
  // Card detail panel in GBA style: number, name plate, card, stats, camp row, link grid, text bubble.
  // counts: optional [in deck, owned] (deck editor).
  import { CARDS, CLASS_NAMES, CAMP_NAMES } from '../game/cards.js';
  import { MM_CAMPS } from '../save.svelte.js';
  import Card from './Card.svelte';
  import Icon from './Icon.svelte';

  let { id, counts = null } = $props();

  const CAMPS = ['NA', 'CS', 'HL', 'TR', 'IN'];
  const LINKS = [['A', 'B', 'C', 'D', 'E'], ['F', 'G', 'H', 'I']];
  const SEX = { M: 'Male', F: 'Female', B: 'Beast', K: 'Kobold', O: 'Other' };
  const KIND = { atk: 'Sword battle', mil: 'Army battle', choose: 'Sword or Army', duel: 'Duel' };

  const c = $derived(id ? CARDS[id] : null);
  // Lit camp boxes: the card's camp. For a mastermind: the camps it allows.
  const camps = $derived(!c ? [] : c.type === 'mm' ? [...MM_CAMPS[c.base], 'IN'] : [c.camp]);
</script>

{#if !c}
  <div class="cd-empty">Point at a card to see it here.</div>
{:else}
  <div class="cd">
    <div class="cd-head">
      <div class="cd-no">NO.<span class="px-num">{String(id).padStart(3, '0')}</span></div>
      <div class="cd-name">{c.name}</div>
    </div>

    <div class="cd-main">
      <div class="cd-card">
        <Card {id} s={1.8} />
        {#if counts}<div class="cd-count"><span class="px-num">{counts[0]}/{counts[1]}</span><small>deck/owned</small></div>{/if}
      </div>
      <div class="cd-side">
        {#if c.type === 'char'}
          <div class="cd-stat"><Icon k="atk" /><span class="px-num">{c.atk}</span></div>
          <div class="cd-stat"><Icon k="mil" /><span class="px-num">{c.mil}</span></div>
          <div class="cd-stat"><Icon k="bld" /><span class="px-num">{c.bld}</span></div>
          <div class="cd-badges">
            <span class="badge2 cls-{c.cls}">{CLASS_NAMES[c.cls]}</span>
            <span class="badge2 sex">{SEX[c.sex]}</span>
          </div>
        {:else if c.type === 'mm'}
          <div class="cd-badges"><span class="badge2 cls-M">Mastermind</span><span class="badge2 sex">{SEX[c.sex]}</span></div>
          <div class="cd-note">Not in the deck. Your deck may use only the lit camps.</div>
        {:else if c.type === 'mission'}
          <div class="cd-badges"><span class="badge2 mission">Mission</span></div>
          <div class="cd-note">{KIND[c.mode]}</div>
          {#if c.atk}<div class="cd-stat"><Icon k="atk" /><span class="px-num">{c.atk}</span></div>{/if}
          {#if c.mil}<div class="cd-stat"><Icon k="mil" /><span class="px-num">{c.mil}</span></div>{/if}
          <div class="cd-note">VP <span class="px-num">{c.vp[0]}</span> owner<br>VP <span class="px-num">{c.vp[1]}</span> other</div>
        {:else}
          <div class="cd-badges"><span class="badge2 facility">Facility</span></div>
          <div class="cd-stat" title="Build"><Icon k="bld" /><span class="px-num">{c.bld}</span></div>
          <div class="cd-stat" title="Destroy"><Icon k="atk" /><span class="px-num">{c.atk}</span></div>
          <div class="cd-note">Build with Hammer.<br>Enemy destroys with Sword.</div>
        {/if}
        {#if c.silver}<div class="badge2 silver">Silver</div>{/if}
      </div>
    </div>

    {#if c.type === 'char' || c.type === 'mm'}
      <div class="cd-row">
        <span class="cd-lbl camp">Camp</span>
        <div class="boxes">
          {#each CAMPS as k}<span class="box" class:on={camps.includes(k)} title={CAMP_NAMES[k]}>{k}</span>{/each}
        </div>
      </div>
    {/if}
    {#if c.type === 'char'}
      <div class="cd-row">
        <span class="cd-lbl link">Link</span>
        <div class="boxes grid">
          {#each LINKS as row}
            <div>{#each row as L}<span class="box" class:on={c.links.includes(L)}>{L}</span>{/each}</div>
          {/each}
        </div>
      </div>
    {/if}

    {#if c.text || c.est}
      <div class="bubble">
        {c.text}
        {#if c.est}<div class="cd-est">Stats estimated.</div>{/if}
      </div>
    {/if}
  </div>
{/if}
