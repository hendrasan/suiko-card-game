<script>
  // Battle scene for one mission: background, mission card in the centre,
  // your units on the left, enemy units on the right, big totals.
  // sides[0] = you, sides[1] = enemy: {key, total, target, units: [{uid, id, v, base}], pick}
  //   key: the stat that counts for that side (atk | mil | bld). pick: duel card id (duel only).
  // theme: forest | desert | mountain | castle. label: text under the mission card.
  import Card from '../components/Card.svelte';
  import Face from '../components/Face.svelte';
  import Icon from '../components/Icon.svelte';

  let { theme = 'forest', card, label = '', sides } = $props();

  // Animate a number from its last value to v.
  const countTo = v => el => {
    const from = +(el.dataset.v || 0);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || from === v) { el.textContent = v; el.dataset.v = v; return; }
    const t0 = performance.now(), dur = 500;
    let raf;
    const step = now => {
      const k = Math.min(1, (now - t0) / dur);
      el.textContent = Math.round(from + (v - from) * k);
      if (k < 1) raf = requestAnimationFrame(step); else el.dataset.v = v;
    };
    raf = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(raf); el.dataset.v = el.textContent; };
  };
</script>

<div class="scene {theme}">
  <div class="cloud c1"></div><div class="cloud c2"></div><div class="cloud c3"></div>
  <div class="far"></div>
  <div class="ground"></div>

  {#each sides as s, p}
    <div class="total" class:me={p === 0} class:opp={p === 1}>
      <Icon k={s.key} /><span class="px-num big" {@attach countTo(s.total)}>0</span>{#if s.target != null}<span class="px-num tgt">/{s.target}</span>{/if}
    </div>
    <div class="units" class:me={p === 0} class:opp={p === 1}>
      {#if s.pick}<div class="unit"><Card id={s.pick} s={1.3} /></div>{/if}
      {#each s.units as u (u.uid)}
        <div class="unit">
          <Face id={u.id} size={54} />
          <span class="px-num v" class:up={u.v > u.base} class:down={u.v < u.base}>{u.v}</span>
        </div>
      {/each}
    </div>
  {/each}

  <div class="mcard"><Card id={card} s={2} />{#if label}<div class="mlabel">{label}</div>{/if}</div>
</div>

<style>
  .scene { position: relative; height: 100%; overflow: hidden; border: 3px solid var(--ink); border-radius: 3px;
    background: linear-gradient(180deg, var(--s1) 0%, var(--s2) 55%); }
  .forest   { --s1: #4f94e0; --s2: #a8d8f4; --g1: #9a6a44; --g2: #7e5434; }
  .desert   { --s1: #e89a4a; --s2: #f8d898; --g1: #c8945a; --g2: #a87444; }
  .mountain { --s1: #6a9ad0; --s2: #c8e0f0; --g1: #8a8070; --g2: #6a6052; }
  .castle   { --s1: #6a5a9a; --s2: #e8a090; --g1: #7a6a5a; --g2: #5a4a3e; }

  /* Pixel clouds: three stacked blocks */
  .cloud { position: absolute; width: 120px; height: 24px; background: #fff; border-radius: 4px; opacity: .9;
    box-shadow: 20px -14px 0 -2px #fff, 50px -22px 0 -4px #fff, 0 4px 0 #d8e4ec; }
  .c1 { left: 60px; top: 46px; } .c2 { left: 420px; top: 30px; transform: scale(.8); } .c3 { left: 760px; top: 60px; transform: scale(1.1); }

  /* Far layer: one silhouette per theme */
  .far { position: absolute; left: 0; right: 0; bottom: 42%; height: 120px; }
  .forest .far { background:
      radial-gradient(circle at 50% 100%, #3f8a3a 0 44px, #2f6e2c 44px 48px, transparent 49px) 0 100% / 96px 96px repeat-x,
      radial-gradient(circle at 50% 100%, #56a04a 0 36px, transparent 37px) 48px 100% / 96px 70px repeat-x; }
  .desert .far { background: #b0683e; clip-path: polygon(0 100%, 0 55%, 8% 55%, 12% 30%, 26% 30%, 30% 60%, 48% 60%, 52% 100%,
      60% 100%, 63% 40%, 70% 20%, 84% 20%, 88% 50%, 100% 50%, 100% 100%); }
  .mountain .far { background: linear-gradient(180deg, #f4f8fc 0 18%, #7a8aa0 18%); clip-path: polygon(0 100%, 14% 20%, 26% 70%,
      40% 0, 56% 80%, 70% 15%, 86% 65%, 100% 25%, 100% 100%); }
  .castle .far { height: 140px; background:
      repeating-linear-gradient(90deg, #4a3e52 0 26px, transparent 26px 44px) 0 0 / 100% 22px no-repeat,
      linear-gradient(#4a3e52, #3a3042) 0 22px / 100% 100% no-repeat; }

  /* Ground: dirt with dots and a dark top edge */
  .ground { position: absolute; left: 0; right: 0; bottom: 0; height: 42%; border-top: 4px solid var(--g2);
    background: radial-gradient(circle, #0002 2px, transparent 2.5px) 0 0 / 18px 18px, linear-gradient(180deg, var(--g1), var(--g2)); }

  .mcard { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .mcard > :global(.card) { filter: drop-shadow(0 6px 0 #0005); }
  .mlabel { font-size: 13px; padding: 2px 8px; background: #0007; border-radius: 2px; white-space: nowrap; }

  .total { position: absolute; top: 12px; display: flex; align-items: baseline; gap: 8px; }
  .total.me { left: 16px; } .total.opp { right: 16px; flex-direction: row-reverse; }
  .total :global(.ic) { height: 34px; align-self: center; }
  .total .big { font-size: 40px; line-height: 1; }
  .total.me .big { color: var(--me); } .total.opp .big { color: var(--opp); }
  .total .tgt { font-size: 14px; }
  .total.opp .tgt { order: -1; }

  .units { position: absolute; bottom: 8px; width: 330px; display: flex; flex-wrap: wrap-reverse; gap: 2px 6px; }
  .units.me { left: 14px; justify-content: flex-end; }
  .units.opp { right: 14px; justify-content: flex-start; }
  .unit { display: flex; flex-direction: column; align-items: center; animation: stepin .48s steps(4) both; }
  .units.opp .unit { animation-name: stepin-r; }
  .unit .v { font-size: 11px; line-height: 1; margin-top: 4px; }
  .unit .v.up { color: var(--ok); } .unit .v.down { color: var(--bad); }
  @keyframes stepin { from { transform: translateX(-80px); opacity: 0; } }
  @keyframes stepin-r { from { transform: translateX(80px); opacity: 0; } }
  @media (prefers-reduced-motion: reduce) { .unit { animation: none; } }
</style>
