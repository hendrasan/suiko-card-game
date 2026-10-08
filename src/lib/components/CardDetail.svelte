<script>
  // Big card and its full data. Shown in the side panel.
  import { CARDS, CLASS_NAMES, CAMP_NAMES } from '../game/cards.js';
  import Card from './Card.svelte';
  import Icon from './Icon.svelte';

  let { id } = $props();

  const KIND = { atk: 'Sword battle', mil: 'Army battle', choose: 'Sword or Army battle', duel: 'Duel' };
  const c = $derived(id ? CARDS[id] : null);
</script>

{#if !c}
  <div class="label">Point at a card to see it here.</div>
{:else}
  <Card {id} s={2.6} />
  <div class="info">
    <div class="dn">{c.name}</div>
    <div class="label">No. {String(id).padStart(3, '0')}{c.silver ? ' · Silver' : ''}</div>
    {#if c.type === 'char' || c.type === 'mm'}
      <div>{CLASS_NAMES[c.cls]} · {CAMP_NAMES[c.camp] || ''}{c.sex === 'B' ? ' · Beast' : c.sex === 'K' ? ' · Kobold' : ''}</div>
      {#if c.type === 'char'}
        <div class="row">
          <span><Icon k="atk" /> {c.atk}</span><span><Icon k="mil" /> {c.mil}</span><span><Icon k="bld" /> {c.bld}</span>
          <span>Link {c.links || '-'}</span>
        </div>
      {/if}
      {#if c.unite.length}<div>Unite: {c.unite.join(', ')}</div>{/if}
    {:else if c.type === 'mission'}
      <div>Mission · {KIND[c.mode]}</div>
      <div class="row">
        {#if c.atk}<span>Need <Icon k="atk" /> {c.atk}</span>{/if}
        {#if c.mil}<span>Need <Icon k="mil" /> {c.mil}</span>{/if}
        <span>VP {c.vp[0]} (owner) / {c.vp[1]} (other)</span>
      </div>
    {:else}
      <div>Facility</div>
      <div class="row"><span>Build <Icon k="bld" /> {c.bld}</span><span>Destroy <Icon k="atk" /> {c.atk}</span></div>
    {/if}
    {#if c.est}<div class="label">Stats estimated.</div>{/if}
    {#if c.text}<div class="txt">{c.text}</div>{/if}
  </div>
{/if}
