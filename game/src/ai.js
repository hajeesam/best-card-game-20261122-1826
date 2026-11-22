// Emberfall Duel — Cinder, the rival. Greedy and readable: her intent is shown
// every turn so the player can read her plan and counter it.
import { SUITS } from './cards.js';

/** Readable intent banner for Cinder's next turn, from the real board state. */
export function cinderIntent(game) {
  const me = game.cinder;
  const foe = game.player;
  const lethal = me.hand.some((c) => affordable(me, c) && c.face.kind === 'damage'
    && damageOf(c, me) >= foe.life + foe.shield);
  if (lethal) return { text: 'Cinder smells victory — a killing blow is coming!', hint: 'Shield up or finish her first.' };
  if (me.life <= 10 && me.hand.some((c) => c.face.kind === 'heal' && affordable(me, c))) {
    return { text: 'Cinder tends her own embers.', hint: 'She will heal — press the attack now.' };
  }
  const bigFlame = me.hand.filter((c) => c.face.suit === 'flame' && affordable(me, c)).length;
  if (bigFlame >= 2) return { text: 'Cinder gathers flame — a big attack is coming.', hint: 'Raise stone shield or heal.' };
  if (foe.life <= 12) return { text: 'Cinder presses the hunt.', hint: 'You are low — Leaf or Stone will save you.' };
  if (me.hand.some((c) => c.face.kind === 'shield' && affordable(me, c))) {
    return { text: 'Cinder raises a stone guard.', hint: 'Her shield will soak your next hit.' };
  }
  return { text: 'Cinder gathers embers, watching you.', hint: 'She is saving up — strike while she waits.' };
}

function affordable(side, card) {
  return card.face.cost <= side.embers;
}

/** Resonance-boosted damage of a card for this side this turn. */
export function damageOf(card, side) {
  const bonus = side.playedSuits.includes(card.face.suit) ? 2 : 0;
  return card.face.value + bonus;
}

/** Score one card for Cinder: lethal first, then survival, then raw value. */
export function scoreCardForAi(game, card) {
  const me = game.cinder;
  const foe = game.player;
  const face = card.face;
  if (face.kind === 'damage') {
    const dmg = damageOf(card, me);
    if (dmg >= foe.life + foe.shield) return 1000 + dmg;
    return 40 + dmg * 6 - face.cost * 3;
  }
  if (face.kind === 'heal') {
    if (me.life >= me.maxLife) return -10;
    const missing = me.maxLife - me.life;
    const healed = Math.min(face.value + (me.playedSuits.includes(face.suit) ? 2 : 0), missing);
    if (me.life <= 10) return 150 + healed * 5;
    if (me.life <= 16) return 30 + healed * 3 - face.cost * 2;
    return -5;
  }
  if (face.kind === 'shield') {
    const value = face.value + (me.playedSuits.includes(face.suit) ? 2 : 0);
    return foe.life <= 12 || me.life <= 12 ? 60 + value * 4 : 15 + value * 2 - face.cost * 2;
  }
  // draw: worth it when her hand is thin or she needs an answer
  if (face.kind === 'draw') {
    const draw = face.value + (me.playedSuits.includes(face.suit) ? 1 : 0);
    const bonus = face.bonusDamage ? damageOf({ face: { ...face, kind: 'damage', value: face.bonusDamage } }, me) * 4 : 0;
    return me.hand.length <= 3 ? 70 + draw * 8 + bonus : 20 + draw * 4 + bonus - face.cost * 3;
  }
  return 0;
}

/**
 * Pick the cards Cinder plays this turn: at most two, best first, re-scored
 * after each play because Resonance changes the second card's value.
 * `bold` plays two cards when she can; a cautious Cinder plays at most one.
 */
export function chooseAiPlays(game, bold) {
  const picks = [];
  const limit = bold ? 2 : 1;
  for (let round = 0; round < limit; round += 1) {
    let best = null;
    let bestScore = 0;
    for (const card of game.cinder.hand) {
      if (!affordable(game.cinder, card)) continue;
      const score = scoreCardForAi(game, card);
      if (score > bestScore) {
        bestScore = score;
        best = card;
      }
    }
    if (best === null) break;
    picks.push(best);
    // Pretend-play it so the second pick sees the Resonance bonus.
    game.cinder.embers -= best.face.cost;
    game.cinder.playedSuits.push(best.face.suit);
  }
  // Undo the pretend spend; the real play re-applies it.
  for (const card of picks) game.cinder.embers += card.face.cost;
  game.cinder.playedSuits = [];
  return picks;
}

/** The suit Cinder leans on most in her hand — shown as her tell. */
export function cinderTell(game) {
  const counts = {};
  for (const card of game.cinder.hand) counts[card.face.suit] = (counts[card.face.suit] || 0) + 1;
  let top = 'flame';
  let topCount = 0;
  for (const suit of Object.keys(SUITS)) {
    if ((counts[suit] || 0) > topCount) {
      top = suit;
      topCount = counts[suit] || 0;
    }
  }
  return topCount >= 2 ? top : null;
}

// Cinder never hides: her intent banner always names what she is about to do.
