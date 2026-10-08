<script>
  import Card from '../components/Card.svelte';
  import { CARDS } from '../game/cards.js';
  import { OPPONENTS, parseDeck } from '../game/decks.js';
  import { game, deckProblems } from '../save.svelte.js';
  import { startBattle } from '../battle.svelte.js';

  const S = game.S;
  const probs = $derived(deckProblems(S.deck, S.mm));
  // Picture for an opponent: its mastermind, else its first leader.
  const face = o => o.mm || parseDeck(o.deck).find(id => CARDS[id].cls === 'L');
</script>

<h2>Battle</h2>
{#if probs.length}<div class="warnmsg">Your deck is not legal: {probs[0]} Fix it in Edit Deck.</div>{/if}
<div class="opplist">
  {#each OPPONENTS as o, i (o.id)}
    {@const open = i === 0 || S.beaten[OPPONENTS[i - 1].id]}
    {@const done = S.beaten[o.id]}
    <div class="foe" class:locked={!open}>
      <Card id={face(o)} s={0.6} small />
      <div class="fn">
        <b>{i + 1}. {o.name}</b> {#if done}<span class="badge">Cleared</span>{/if}
        <small>{o.where} — {o.intro}</small>
        <small>You need {o.vp[0]} VP · Enemy needs {o.vp[1]} VP · Reward {done ? Math.round(o.reward / 2) : o.reward} potch{done ? '' : ' + rare card'}</small>
      </div>
      <button class="btn" disabled={!open || probs.length > 0} onclick={() => startBattle(o)}>Fight</button>
    </div>
  {/each}
</div>
