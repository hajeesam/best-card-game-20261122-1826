// Emberfall Duel — deck building, shuffling and drawing.
import { CARD_FACES } from './cards.js';
import { shuffleInPlace } from './seed.js';

/** A fresh 24-card deck: each of the twelve faces printed twice, then shuffled. */
export function buildDeck(rng) {
  const deck = [];
  for (const face of CARD_FACES) {
    deck.push(makeCardInstance(face, 1));
    deck.push(makeCardInstance(face, 2));
  }
  return shuffleInPlace(rng, deck);
}

function makeCardInstance(face, copy) {
  return { uid: `${face.id}-copy${copy}`, face };
}

/** Draw up to n cards from deck into hand; reshuffle the discard pile when empty. */
export function drawCards(rng, pile, hand, n) {
  const drawn = [];
  for (let i = 0; i < n; i += 1) {
    if (hand.length >= 7) break;
    if (pile.deck.length === 0) {
      if (pile.discard.length === 0) break;
      pile.deck = shuffleInPlace(rng, pile.discard.splice(0));
    }
    const card = pile.deck.pop();
    hand.push(card);
    drawn.push(card);
  }
  return drawn;
}

/** Count of cards left in the draw pile. */
export function deckCount(pile) {
  return pile.deck.length;
}
