<script>
  // Mockup of option C: the battle scene in place of the mission board. Sample data only.
  import { CARDS } from '../lib/game/cards.js';
  import Scene from '../lib/battle/Scene.svelte';
  import Card from '../lib/components/Card.svelte';
  import CardDetail from '../lib/components/CardDetail.svelte';
  import Icon from '../lib/components/Icon.svelte';

  let uid = 1;
  const units = (ids, key, bonus = {}) => ids.map(id => ({ uid: uid++, id, base: CARDS[id][key], v: CARDS[id][key] + (bonus[id] || 0) }));
  const side = (list, target, key) => ({ key, units: list, target, total: list.reduce((a, u) => a + u.v, 0) });

  const EXAMPLES = [
    { title: 'Sword battle — forest', theme: 'forest', card: 154, key: 'atk',
      me: units([26, 10, 25, 33], 'atk', { 26: 1 }), opp: units([12, 71, 40], 'atk'), target: 8, detail: 26 },
    { title: 'Army battle — desert', theme: 'desert', card: 169, key: 'mil',
      me: units([25, 26, 10], 'mil', { 26: 500 }), opp: units([15, 17, 9, 12, 21], 'mil'), target: 2000, detail: 15 },
  ];
  let detail = $state({});
  let replay = $state(0);

  const plate = (name, vp, of, deck, disc) => ({ name, vp, of, deck, disc });
</script>

<div class="page">
  <h1>Option C mockup — battle scene</h1>
  <p>The scene replaces the 4-mission board while a battle runs on a mission. When the battle ends, the board comes back.
    Units are face crops from the card art. Point at a unit or card to see it in the panel.
    <button class="btn" onclick={() => replay++}>Replay entry animation</button></p>

  {#each EXAMPLES as ex}
    <h2>{ex.title}</h2>
    <div class="frame">
      <div class="mock-stage" onmouseover={e => { const t = e.target.closest('[data-cid]'); if (t) detail[ex.title] = +t.dataset.cid; }} role="presentation">
        <div id="board">
          {@render sideRow(plate('Highland Scouts', 1, 4, 31, 9), false)}
          <div class="scene-slot">
            {#key replay}
              <Scene theme={ex.theme} card={ex.card} label="Your mission"
                sides={[side(ex.me, ex.target, ex.key), side(ex.opp, ex.target, ex.key)]} />
            {/key}
          </div>
          {@render sideRow(plate('Riou', 2, 4, 28, 12), true)}
          <div class="handbar win">
            <div class="hand">{#each [17, 38, 105, 151, 22] as id}<Card {id} s={1.2} />{/each}</div>
            <div class="actions">
              <div class="prompt">{CARDS[ex.card].name}: you need <Icon k={ex.key} /> {ex.target}. Send a character or pass.</div>
              <button class="btn" disabled>Send</button><button class="btn">Pass</button>
            </div>
          </div>
        </div>
        <div id="panel">
          <div class="detail win"><CardDetail id={detail[ex.title] || ex.detail} /></div>
          <div class="log win">
            <div>Riou sends Miklotov to {CARDS[ex.card].name}.</div>
            <div>Highland Scouts sends Kiba.</div>
            <div>Riou sends Camus. Unite!</div>
          </div>
        </div>
      </div>
    </div>
  {/each}

  <h2>Duel</h2>
  <div class="duel">
    <Scene theme="mountain" card={174} label="Your duel"
      sides={[{ key: 'atk', total: 5, target: null, units: [], pick: 17 }, { key: 'atk', total: 2, target: null, units: [], pick: 12 }]} />
  </div>

  <h2>The 4 background themes</h2>
  <div class="themes">
    {#each ['forest', 'desert', 'mountain', 'castle'] as t}
      <div class="thumb"><div class="thumb-in"><Scene theme={t} card={152} sides={[side([], 7, 'atk'), side([], 7, 'atk')]} /></div><span>{t}</span></div>
    {/each}
  </div>
</div>

{#snippet sideRow(P, me)}
  <div class="side" class:me class:opp={!me}>
    <div class="plate">
      <div class="nm">{P.name}</div>
      <div class="vp"><span class="vpl">VP</span>{#each { length: P.of }, i}<span class="pip" class:on={i < P.vp}></span>{/each}</div>
    </div>
    <div class="counts">
      <div><Icon k="deck" /><span class="px-num">×{P.deck}</span></div>
      <div><Icon k="disc" /><span class="px-num">×{P.disc}</span></div>
    </div>
    {#if !me}<div class="ohand">{#each { length: 5 } as _}<div class="cardback" style="--s:.62"></div>{/each}</div>{/if}
  </div>
{/snippet}

<style>
  :global(html), :global(body) { overflow: auto; height: auto; }
  .page { padding: 20px; max-width: 1320px; margin: 0 auto; }
  h1, h2 { font-weight: normal; color: var(--gold); text-shadow: 2px 2px 0 var(--ink); }
  p { max-width: 900px; line-height: 1.5; text-shadow: 1px 1px 0 var(--ink); }
  .frame { width: 1280px; height: 800px; }
  .mock-stage { position: relative; width: 1280px; height: 800px; overflow: hidden; border: 3px solid var(--ink);
    background: linear-gradient(180deg, var(--sky1) 0%, var(--sky1) 38%, var(--sky2) 62%, var(--grass) 100%); }
  .duel { width: 944px; height: 380px; }
  .themes { display: flex; gap: 16px; flex-wrap: wrap; }
  .thumb { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .thumb-in { width: 300px; height: 121px; overflow: hidden; }
  .thumb-in > :global(.scene) { width: 944px; height: 380px; transform: scale(.318); transform-origin: 0 0; }
</style>
