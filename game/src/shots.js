// Emberfall Duel — screenshot scenes behind ?shot=title|table|win|loss.
// Each scene plays the real rules forward from a fresh seeded duel, steered by
// a simple autopilot, so the frame is what a short real game looks like and
// the same seed always gives the same frame.
import { createGame, startDuel, playCard, endPlayerTurn } from './state.js';
import { chooseAiPlays } from './ai.js';
import { SCREEN_TITLE, SCREEN_TABLE, SCREEN_WIN, SCREEN_LOSS } from './render.js';

/** Score a card for the table/win pilot: damage and value first, heal when hurt. */
export function pilotScore(game, card) {
  const face = card.face;
  const me = game.player;
  const foe = game.cinder;
  if (face.kind === 'damage') {
    const bonus = me.playedSuits.includes(face.suit) ? 2 : 0;
    return 60 + (face.value + bonus) * 6 - face.cost * 2;
  }
  if (face.kind === 'heal') {
    if (me.life >= me.maxLife) return -5;
    return me.life <= 12 ? 50 + face.value * 4 : 8 + face.value * 2;
  }
  if (face.kind === 'shield') return foe.life <= 10 ? 20 + face.value * 2 : 15 + face.value * 2;
  return me.hand.length <= 4 ? 35 + face.value * 4 : 12 + face.value * 3;
}

/** The pilot plays its best affordable card, up to twice, then ends the turn. */
export function pilotTurn(game, plays) {
  for (let round = 0; round < plays; round += 1) {
    let best = null;
    let bestScore = 0;
    for (const card of game.player.hand) {
      if (card.face.cost > game.player.embers) continue;
      const score = pilotScore(game, card);
      if (score > bestScore) {
        bestScore = score;
        best = card;
      }
    }
    if (!best) break;
    playCard(game, game.player, best.uid);
    if (game.screen !== 'table') return;
  }
  endPlayerTurn(game);
}

/**
 * Stage a scene on a fresh game and return the screen to draw over it.
 * title: untouched title screen. table: six honest turns in. win: a strong
 * pilot against a cautious Cinder until she falls. loss: a passive player
 * against a bold Cinder until the player's ember goes out.
 */
export function stageShot(name, seed) {
  const game = createGame(seed);
  if (name === 'title') return { game, screen: SCREEN_TITLE };
  startDuel(game);
  if (name === 'table') {
    for (let turn = 0; turn < 6 && game.screen === 'table'; turn += 1) pilotTurn(game, 2);
    return { game, screen: game.screen === 'table' ? SCREEN_TABLE : game.screen };
  }
  if (name === 'win') {
    // The pilot spends every ember on its best cards, so the duel ends in victory.
    for (let turn = 0; turn < 60 && game.screen === 'table'; turn += 1) pilotTurn(game, 5);
    return { game, screen: game.screen === 'win' ? SCREEN_WIN : SCREEN_TABLE };
  }
  // loss: the player never plays a card, Cinder plays boldly.
  for (let turn = 0; turn < 60 && game.screen === 'table'; turn += 1) {
    endPlayerTurn(game);
  }
  return { game, screen: game.screen === 'loss' ? SCREEN_LOSS : SCREEN_TABLE };
}
