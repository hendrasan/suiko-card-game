<script>
  import Icon from '../components/Icon.svelte';
  import { go } from '../save.svelte.js';

  let { back = 'title' } = $props(); // screen to go back to
</script>

<div class="screen hub">
  <div class="pane win rules" style="width:1000px;flex:1">
    <h2>How to Play</h2>
    <p>Win Victory Points (VP) by clearing missions. The first player to reach their VP target wins. Each deck has 50 cards. You hold up to 6 cards.</p>
    <h3>Cards</h3>
    <ul>
      <li><b>Characters</b> have <Icon k="atk" /> Sword (attack), <Icon k="mil" /> Flag (troops) and <Icon k="bld" /> Hammer (building), plus link letters A–I.</li>
      <li><b>Missions</b> (blue) need Sword or troops. VP a/b: the player who played it gets a, the other player gets b.</li>
      <li><b>Facilities</b> (yellow): the owner builds them with Hammer; the enemy destroys them with Sword. A built facility gives a bonus.</li>
      <li><b>Mastermind</b> (optional, not in the deck) gives an effect for the whole battle but limits your deck to its camps.</li>
    </ul>
    <h3>Your turn — do one thing</h3>
    <ul>
      <li><b>Play a mission or facility</b> (max 2 open of yours). The opponent may send a character first.</li>
      <li><b>Continue</b> an open mission. You must send a character first.</li>
      <li><b>Discard</b> 1 or more cards.</li>
    </ul>
    <p>At the end of the turn, both players draw back to 6 cards.</p>
    <h3>Battle</h3>
    <ul>
      <li>Players take turns to send 1 character or pass. Two passes in a row end the battle.</li>
      <li>The first character on your side must be a <b>Leader</b>. Each next character must share at least 1 link letter with a card on your side.</li>
      <li><b>Unite</b>: right after a character, you may send its Unite partner at once, ignoring links.</li>
      <li><b>Unique</b>: only one copy of a character can be in play (both sides). <b>Betrayal</b> characters can take the opponent's copy out.</li>
      <li><b>Sword missions</b>: the first side to reach the target wins at once.</li>
      <li><b>Army battles</b>: after both pass, the smaller army is destroyed and the bigger army loses the same number of troops. If the troops left reach the target, that side wins.</li>
      <li><b>Duels</b>: each player chooses a card; the higher Sword wins.</li>
      <li>The winner <b>stations</b> one character on the cleared card. It stays in play. The other characters are discarded.</li>
    </ul>
    <h3>Controls</h3>
    <p>Point at a card to see it on the right. Click hand cards to select them. Double-click a card to send it quickly.</p>
    <button class="btn" onclick={() => go(back)}>Back</button>
  </div>
</div>
