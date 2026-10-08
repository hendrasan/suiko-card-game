# Suikoden Card Stories — web remake

Open `index.html` in a browser. No build step and no server needed. The game saves to `localStorage`.

## Files

- `assets/cards_*.png` — the 5 sprite sheets (10×5 cards, each card is 80×110 px at x = 2 + 82·col, y = 2 + 112·row).
- `js/cards.js` — card data (stats, links, camps) and ability logic (`FX`).
- `js/engine.js` — battle rules.
- `js/ai.js` — computer opponent.
- `js/ui.js` — battle screen and human input.
- `js/meta.js` — title, campaign, deck editor, shop, card file, save.
- `js/decks.js` — starter deck and campaign opponent decks.

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
node tools/sim.js . 200
```
