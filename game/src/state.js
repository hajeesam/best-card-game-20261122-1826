// Emberfall Duel — game state, turns, Resonance combos, win and loss.
import { buildDeck, drawCards } from './deck.js';
import { mulberry32 } from './seed.js';
import { cinderIntent, chooseAiPlays } from './ai.js';

export const MAX_LIFE = 30;
export const MAX_HAND = 7;
export const MAX_EMBERS = 10;
export const START_HAND = 4;

/** Fresh duel. seed drives every shuffle, so the same seed replays the same duel. */
export function createGame(seed) {
  const rng = mulberry32(seed);
  const game = {
    seed,
    rng,
    screen: 'title',
    turn: 1,
    phase: 'player',
    winner: null,
    log: [],
    resonanceFlashes: [],
    stats: { damageDealt: 0, damageTaken: 0, cardsPlayed: 0, heals: 0, shields: 0, turns: 0 },
    player: freshSide(rng, 'You'),
    cinder: freshSide(rng, 'Cinder'),
    intent: null,
  };
  game.intent = cinderIntent(game);
  return game;
}

function freshSide(rng, name) {
  const pile = { deck: buildDeck(rng), discard: [] };
  const hand = [];
  drawCards(rng, pile, hand, START_HAND);
  return {
    name, life: MAX_LIFE, maxLife: MAX_LIFE, shield: 0,
    embers: 1, maxEmbers: 1, pile, hand, playedSuits: [],
  };
}

export function otherSide(game, side) {
  return side === game.player ? game.cinder : game.player;
}

/** Embers for a turn number: the turn number itself, capped at ten. */
export function embersForTurn(turn) {
  return Math.min(turn, MAX_EMBERS);
}

/** Begin a player's turn: old shield fades, embers refill, Resonance clears, draw one. */
export function beginTurn(game, side) {
  side.shield = 0;
  side.embers = embersForTurn(game.turn);
  side.maxEmbers = side.embers;
  side.playedSuits = [];
  const drawn = drawCards(game.rng, side.pile, side.hand, 1);
  return drawn;
}

/** Start the duel from the title screen. */
export function startDuel(game) {
  game.screen = 'table';
  game.turn = 1;
  game.phase = 'player';
  beginTurn(game, game.player);
  pushLog(game, 'The duel begins — <b>you</b> hold the first ember.');
}

/** Resonance bonus for a card: +2 to its number, +1 if it draws. */
export function resonanceBonus(game, side, card) {
  if (!side.playedSuits.includes(card.face.suit)) return 0;
  return card.face.kind === 'draw' ? 1 : 2;
}

function pushLog(game, text) {
  game.log.unshift(text);
  if (game.log.length > 5) game.log.length = 5;
}

/** Apply damage, shield soaking first. Returns the life damage that got through. */
export function dealDamage(game, target, amount) {
  let left = amount;
  if (target.shield > 0) {
    const soaked = Math.min(target.shield, left);
    target.shield -= soaked;
    left -= soaked;
  }
  target.life = Math.max(0, target.life - left);
  return left;
}

/**
 * Play one card from a side's hand. Returns an event describing what happened,
 * or null when the card cannot be played. Resonance is checked before the play.
 */
export function playCard(game, side, cardUid) {
  const index = side.hand.findIndex((c) => c.uid === cardUid);
  if (index < 0) return null;
  const card = side.hand[index];
  const face = card.face;
  if (face.cost > side.embers) return null;
  const bonus = resonanceBonus(game, side, card);
  const resonant = bonus > 0;
  side.embers -= face.cost;
  side.hand.splice(index, 1);
  side.pile.discard.push(card);
  side.playedSuits.push(face.suit);
  game.stats.cardsPlayed += 1;

  const foe = otherSide(game, side);
  const event = { by: side.name, card: face.name, suit: face.suit, resonant, kind: face.kind, amount: 0, text: '' };
  if (face.kind === 'damage') {
    const amount = face.value + bonus;
    const through = dealDamage(game, foe, amount);
    event.amount = amount;
    event.text = `${side.name} hurls <b>${face.name}</b> for ${amount} damage${resonant ? ' — Resonance!' : ''}.`;
    if (side === game.player) game.stats.damageDealt += amount;
    else game.stats.damageTaken += amount;
    if (through === 0) event.text += ' The shield holds.';
  } else if (face.kind === 'draw') {
    const count = face.value + bonus;
    const drawn = drawCards(game.rng, side.pile, side.hand, count);
    event.amount = drawn.length;
    event.text = `${side.name} plays <b>${face.name}</b> and draws ${drawn.length} card${drawn.length === 1 ? '' : 's'}${resonant ? ' — Resonance!' : ''}.`;
    if (face.bonusDamage) {
      const extra = dealDamage(game, foe, face.bonusDamage);
      event.text += ` Surge splashes ${face.bonusDamage} damage.`;
      if (side === game.player) game.stats.damageDealt += face.bonusDamage;
      else game.stats.damageTaken += face.bonusDamage;
      void extra;
    }
  } else if (face.kind === 'heal') {
    const amount = face.value + bonus;
    const before = side.life;
    side.life = Math.min(side.maxLife, side.life + amount);
    const healed = side.life - before;
    event.amount = healed;
    event.text = `${side.name} plays <b>${face.name}</b> and restores ${healed} life${resonant ? ' — Resonance!' : ''}.`;
    if (side === game.player) game.stats.heals += healed;
  } else {
    const amount = face.value + bonus;
    side.shield += amount;
    event.amount = amount;
    event.text = `${side.name} raises <b>${face.name}</b> for ${amount} shield${resonant ? ' — Resonance!' : ''}.`;
    if (side === game.player) game.stats.shields += amount;
  }
  pushLog(game, event.text);
  if (resonant) {
    pushLog(game, '<b>Resonance!</b> Two cards of one suit — the second burns brighter.');
    game.resonanceFlashes.push(face.suit);
  }
  checkEnd(game);
  return event;
}

/** End the player's turn and run Cinder's whole turn. Returns her events. */
export function endPlayerTurn(game) {
  if (game.phase !== 'player' || game.screen !== 'table') return [];
  game.phase = 'cinder';
  game.stats.turns = game.turn;
  beginTurn(game, game.cinder);
  const events = runCinderTurn(game);
  if (game.screen !== 'table') return events;
  game.turn += 1;
  game.phase = 'player';
  beginTurn(game, game.player);
  game.intent = cinderIntent(game);
  pushLog(game, `Turn <b>${game.turn}</b> — your embers refill to ${game.player.embers}.`);
  checkEnd(game);
  return events;
}

/** Cinder's turn: announce intent, play up to two cards, then pass back. */
export function runCinderTurn(game) {
  const events = [];
  const intent = game.intent;
  pushLog(game, `Cinder: ${intent.text}`);
  const bold = game.cinder.life > 12 || game.player.life <= 12;
  const picks = chooseAiPlays(game, bold);
  for (const card of picks) {
    const event = playCard(game, game.cinder, card.uid);
    if (event) events.push(event);
    if (game.screen !== 'table') break;
  }
  if (picks.length === 0) pushLog(game, 'Cinder holds her cards and passes.');
  return events;
}

/** Decide whether the duel is over and set the end screen. */
export function checkEnd(game) {
  if (game.screen !== 'table') return;
  if (game.cinder.life <= 0) {
    game.screen = 'win';
    game.winner = 'player';
    game.stats.turns = game.turn;
    pushLog(game, '<b>Cinder\'s ember goes out. You win the duel!</b>');
  } else if (game.player.life <= 0) {
    game.screen = 'loss';
    game.winner = 'cinder';
    game.stats.turns = game.turn;
    pushLog(game, '<b>Your ember goes out. Cinder wins the duel.</b>');
  }
}

/** Reset for a rematch with the same seed. */
export function rematch(game) {
  const fresh = createGame(game.seed);
  fresh.screen = 'table';
  fresh.turn = 1;
  fresh.phase = 'player';
  beginTurn(fresh, fresh.player);
  return fresh;
}

// A duel ends the moment either life total reaches zero — no sudden-death round.
