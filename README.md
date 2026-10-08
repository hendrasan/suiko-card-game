# Suikoden Card Stories — web remake

Built with [Svelte 5](https://svelte.dev) and [Vite](https://vite.dev). The game saves to `localStorage`.

```
npm install
npm run dev       # dev server with hot reload
npm run build     # static files in dist/ (put them on any static host)
npm run preview   # serve dist/ on localhost
```

## Files

- `public/assets/sprites.png` — chibi battle sprites (ripped by James816), 144 characters in card order. `battle_sprites.png` is the same sheet with a transparent background (the game uses this one).
- `public/assets/cards_*.png` — the 5 card sprite sheets (10×5 cards, each card is 80×110 px at x = 2 + 82·col, y = 2 + 112·row).
- `src/lib/game/` — game logic. Plain JS, no UI code (also runs in Node).
  - `cards.js` — card data (stats, links, camps) and ability logic (`FX`).
  - `engine.js` — battle rules.
  - `ai.js` — computer opponent.
  - `decks.js` — starter deck and campaign opponent decks.
- `src/lib/sound.svelte.js` — sound, made live with Web Audio (no audio files): [cuelume](https://github.com/danielwh2/cuelume) for interface cues, [ZzFX](https://github.com/KilledByAPixel/ZzFX) for 8-bit game sounds (`FX`, `TUNES`). Music: two looped CC0 tracks by Juhani Junkala in `public/assets/music/` (see `CREDITS.txt`), menu and battle, with a crossfade. M = sound effects on/off, N = music on/off (also buttons in the hub menu and the battle log). Try every sound on `/mockup.html`.
- `src/lib/save.svelte.js` — save data, shop, deck rules, screen navigation.
- `src/lib/battle.svelte.js` — battle screen state and the human controller.
- `src/lib/screens/` — one component per screen (title, hub, deck editor, shop, card file, rules, battle, result).
- `src/lib/battle/` — parts of the battle board (player row, missions, hand, actions, pop-up). `Scene.svelte` replaces the mission board while a battle or duel runs.
- `src/lib/components/` — `Card`, `CardDetail`, `Icon` (pixel icons from `pixelIcons.js`), `Sprite` (chibi battle sprite).
- `mockup.html`, `src/mockup/` — dev-only page with the battle scene and sample data (`npm run dev`, open `/mockup.html`). Not in the build.
- `src/app.css` — all styles.

## Assumptions (the sources do not say)

- Link rule: a new character must share 1 letter with any card already on your side of the mission.
- Rune characters (Jeane, Rune Shop) = characters with link letter `I`.
- Camps (Highland, New Alliance, City-State, Toran, Independent) are set from Suikoden II story roles.
- Silver cards 192–250 use the ability of their base card. Stats not listed in the FAQ are base + 1 Sword / +300 troops / +1 Hammer.
- Genshu (113) and Sgt. Joe (120) stats are estimates.
- Some "Response"/"Selection" abilities are not used (the card text says so).
- Max 3 copies of a card in a deck. You lose if your hand and deck are both empty at the start of your turn.

## Test

Run AI against AI for all campaign decks (no browser):

```
npm run sim
```
