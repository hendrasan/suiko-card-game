// Sound. Two small synths, no audio files:
// - cuelume (sfx): soft interface cues — buttons, select, pop-ups, count-up.
// - ZzFX (fx): 8-bit game sounds — units, clashes, VP, win/lose tunes.
// The on/off setting is kept in localStorage.
import { play, setEnabled, setVolume } from 'cuelume';
import { ZZFX, zzfx } from 'zzfx';

const KEY = 'suikoCS.sound';
let saved = null;
try { saved = localStorage.getItem(KEY); } catch (e) { /* storage blocked */ }

export const sound = $state({ on: saved !== 'off' });
setEnabled(sound.on);
setVolume(0.6);
ZZFX.volume = 0.25;

export function toggleSound() {
  sound.on = !sound.on;
  setEnabled(sound.on);
  try { localStorage.setItem(KEY, sound.on ? 'on' : 'off'); } catch (e) { /* storage blocked */ }
  if (sound.on) play('toggle');
}

export function sfx(name, opts) { play(name, opts); }

// ZzFX parameters: volume, randomness, frequency, attack, sustain, release, shape, shapeCurve,
// slide, deltaSlide, pitchJump, pitchJumpTime, repeatTime, noise, modulation, bitCrush, delay,
// sustainVolume, decay, tremolo, filter. Make or tune sounds at https://killedbyapixel.github.io/ZzFX/
export const FX = {
  swoosh: [, .1, 500, .01, .02, .12, 4, 1, -30, , , , , 2, , , , .6, .04],  // Sword unit arrives
  drum:   [1.2, .05, 129, .01, , .15, , , , , , , .07, 5],                    // army unit arrives
  clank:  [, .05, 1100, , .01, .08, 3, 2, , , , , , .4, 40],                  // Hammer unit arrives
  clash:  [1.5, .1, 333, .01, , .9, 4, 1.9, , , , , , .5, , .6],             // units destroyed
  clang:  [, .05, 1400, , .03, .4, 1, 2.5, , , 300, .02, , .2, 60],           // duel cards meet
  coin:   [, , 1675, , .06, .24, 1, 1.82, , , 837, .06],                      // you get VP
  down:   [, , 420, .02, .06, .3, 1, 1.5, -3],                                // enemy gets VP
};
// Note tunes: semitones above C5, one note every `step` ms.
export const TUNES = {
  win:  { notes: [0, 4, 7, 12, 7, 12], step: 110 },
  lose: { notes: [7, 3, 0, -5], step: 220 },
  pack: { notes: [0, 7, 12, 16, 19], step: 60 },
};

// The browser starts audio suspended until the first click; ZzFX does not resume it.
const resume = () => { if (ZZFX.audioContext.state !== 'running') ZZFX.audioContext.resume(); };

export function fx(name) {
  if (!sound.on) return;
  resume();
  if (FX[name]) { zzfx(...FX[name]); return; }
  const t = TUNES[name];
  if (t) t.notes.forEach((n, i) => setTimeout(() => zzfx(.8, 0, ZZFX.getNote(n, 523.25), .01, .06, .18, 1), i * t.step));
}

// Battle sounds from the change between two engine updates.
const ARRIVE = { atk: 'swoosh', mil: 'drum', bld: 'clank' };
let last = null;
export function resetBattleSounds() { last = null; }
export function battleSounds(g) {
  const now = {
    vp: g.P.map(P => P.vp),
    over: g.over,
    duel: !!g.duelShow,
    units: g.missions.reduce((a, m) => a + m.sides[0].length + m.sides[1].length, 0),
    sides: new Map(g.missions.map(m => [m.uid, m.sides.map(s => s.length)])),
  };
  if (last) {
    if (now.over && !last.over) fx(g.winner === 0 ? 'win' : 'lose');
    else {
      if (now.duel && !last.duel) fx('clang');
      if (now.units <= last.units - 2) fx('clash');
      else if (now.units > last.units) {
        // The first mission side with a new unit decides the sound.
        const m = g.missions.find(m => [0, 1].some(p => m.sides[p].length > (last.sides.get(m.uid)?.[p] ?? 0)));
        const p = m && (m.sides[0].length > (last.sides.get(m.uid)?.[0] ?? 0) ? 0 : 1);
        if (m) fx(ARRIVE[g.need(m, p).key]);
      }
      if (now.vp[0] > last.vp[0]) fx('coin');
      if (now.vp[1] > last.vp[1]) fx('down');
    }
  }
  last = now;
}
