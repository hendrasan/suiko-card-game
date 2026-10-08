// Sound. Two small synths for effects (no audio files):
// - cuelume (sfx): soft interface cues — buttons, select, pop-ups, count-up.
// - ZzFX (fx): 8-bit game sounds — units, clashes, VP, win/lose tunes.
// Music: two looped CC0 tracks (public/assets/music/CREDITS.txt).
// The on/off settings are kept in localStorage.
import { play, setEnabled, setVolume } from 'cuelume';
import { ZZFX, zzfx } from 'zzfx';

const KEY = 'suikoCS.sound', MUSIC_KEY = 'suikoCS.music';
const load = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const store = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } };

export const sound = $state({ on: load(KEY) !== 'off', music: load(MUSIC_KEY) !== 'off' });
setEnabled(sound.on);
setVolume(0.6);
ZZFX.volume = 0.25;

export function toggleSound() {
  sound.on = !sound.on;
  setEnabled(sound.on);
  store(KEY, sound.on ? 'on' : 'off');
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

// ---------- Music ----------
const TRACKS = { menu: 'assets/music/home-town.mp3', battle: 'assets/music/army-approaching.mp3' };
const MUSIC_VOLUME = 0.4, FADE_MS = 800;
const players = {};
let current = null;

function player(name) {
  if (!players[name]) { const a = new Audio(TRACKS[name]); a.loop = true; a.volume = 0; players[name] = a; }
  return players[name];
}
// Change the volume of a to v in FADE_MS; pause it at 0.
function fade(a, v) {
  clearInterval(a.fadeTimer);
  const from = a.volume, t0 = performance.now();
  a.fadeTimer = setInterval(() => {
    const k = Math.min(1, (performance.now() - t0) / FADE_MS);
    a.volume = from + (v - from) * k;
    if (k === 1) { clearInterval(a.fadeTimer); if (v === 0) a.pause(); }
  }, 30);
}
function startCurrent() {
  if (!sound.music || !current) return;
  const a = player(current);
  // Before the first click the browser blocks play(); the click listener below tries again.
  a.play().then(() => fade(a, MUSIC_VOLUME)).catch(() => {});
}

// Play track 'menu' or 'battle' with a crossfade.
export function music(name) {
  if (name === current) return;
  if (current && players[current]) fade(players[current], 0);
  current = name;
  startCurrent();
}
export function toggleMusic() {
  sound.music = !sound.music;
  store(MUSIC_KEY, sound.music ? 'on' : 'off');
  if (sound.music) startCurrent(); else if (players[current]) fade(players[current], 0);
}
addEventListener('pointerdown', () => { if (current && players[current]?.paused) startCurrent(); });
