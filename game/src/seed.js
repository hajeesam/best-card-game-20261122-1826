// Emberfall Duel — seeded random numbers (mulberry32) so a shot seed replays exactly.
/** Build a small fast seeded generator from any integer seed. */
export function mulberry32(seed) {
  let a = (seed >>> 0) || 1;
  return function nextRandom() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Integer in [0, n) from a generator. */
export function randomInt(rng, n) {
  return Math.floor(rng() * n);
}

/** Fisher-Yates shuffle, in place, driven by the seeded generator. */
export function shuffleInPlace(rng, list) {
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = randomInt(rng, i + 1);
    const held = list[i];
    list[i] = list[j];
    list[j] = held;
  }
  return list;
}

// One generator per duel: the same seed always shuffles the same deck order.
