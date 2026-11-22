// Emberfall Duel — tiny WebAudio sounds, oscillator only, no audio files.
let audioContext = null;
let muted = false;

/** True while sound is on. */
export function soundOn() {
  return !muted;
}

/** Flip the mute switch; returns the new state. */
export function toggleSound() {
  muted = !muted;
  return !muted;
}

function ensureContext() {
  if (audioContext) return audioContext;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  audioContext = new Ctor();
  return audioContext;
}

/** One short oscillator note. */
export function tone(freq, seconds, type, volume) {
  if (muted) return;
  const ctx = ensureContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') void ctx.resume();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume || 0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + seconds);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + seconds);
}

/** Two-note chime, second note higher. */
export function chime(first, second) {
  tone(first, 0.16, 'triangle', 0.12);
  window.setTimeout(() => tone(second, 0.22, 'triangle', 0.12), 90);
}

/** Sound for playing a card, pitched by suit. */
export function playCardSound(suit) {
  const base = { flame: 220, tide: 330, leaf: 262, stone: 175 }[suit] || 220;
  chime(base, base * 1.5);
}

/** Thud for damage; bigger hits rumble lower and longer. */
export function hitSound(big) {
  tone(big ? 90 : 130, big ? 0.35 : 0.18, 'sawtooth', big ? 0.2 : 0.12);
  if (big) window.setTimeout(() => tone(65, 0.3, 'sawtooth', 0.15), 60);
}

/** Soft rising notes for a heal. */
export function healSound() {
  chime(392, 523);
}

/** Bright arpeggio for victory. */
export function winSound() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => window.setTimeout(() => tone(freq, 0.3, 'triangle', 0.14), i * 130));
}

/** Low falling notes for defeat. */
export function loseSound() {
  const notes = [392, 330, 262, 196];
  notes.forEach((freq, i) => window.setTimeout(() => tone(freq, 0.32, 'sine', 0.13), i * 150));
}

// Every sound here is a live oscillator — the game ships no audio files at all.
