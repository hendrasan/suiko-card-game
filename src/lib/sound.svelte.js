// Sound effects with cuelume (Web Audio synthesis, no audio files).
// sfx(name) plays a cue if sound is on. The on/off setting is kept in localStorage.
import { play, setEnabled, setVolume } from 'cuelume';

const KEY = 'suikoCS.sound';
let saved = null;
try { saved = localStorage.getItem(KEY); } catch (e) { /* storage blocked */ }

export const sound = $state({ on: saved !== 'off' });
setEnabled(sound.on);
setVolume(0.6);

export function toggleSound() {
  sound.on = !sound.on;
  setEnabled(sound.on);
  try { localStorage.setItem(KEY, sound.on ? 'on' : 'off'); } catch (e) { /* storage blocked */ }
  if (sound.on) play('toggle');
}

export function sfx(name, opts) { play(name, opts); }

// Battle sounds from the change between two engine updates.
let last = null;
export function resetBattleSounds() { last = null; }
export function battleSounds(g) {
  const now = {
    vp: g.P.map(P => P.vp),
    units: g.missions.reduce((a, m) => a + m.sides[0].length + m.sides[1].length, 0),
    over: g.over,
  };
  if (last) {
    if (now.over && !last.over) sfx(g.winner === 0 ? 'success' : 'error', { emphasis: 'strong' });
    else if (now.vp[0] > last.vp[0]) sfx('success');
    else if (now.vp[1] > last.vp[1]) sfx('warning');
    else if (now.units > last.units) sfx('select', { emphasis: 'strong' });
  }
  last = now;
}
