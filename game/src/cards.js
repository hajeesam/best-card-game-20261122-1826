// Emberfall Duel — the four original suits and the twelve card faces.
// Suits are told apart by colour AND by shape (inline SVG, never text alone).
export const SUITS = {
  flame: {
    key: 'flame', label: 'FLAME', colour: '#c1272d', colour2: '#ff7a1a',
    verb: 'burns', blurb: 'Direct damage to Cinder.',
  },
  tide: {
    key: 'tide', label: 'TIDE', colour: '#14568f', colour2: '#2aa7d8',
    verb: 'flows', blurb: 'Draw extra cards.',
  },
  leaf: {
    key: 'leaf', label: 'LEAF', colour: '#1e7a34', colour2: '#58b368',
    verb: 'grows', blurb: 'Restore your life.',
  },
  stone: {
    key: 'stone', label: 'STONE', colour: '#8a6414', colour2: '#d8a93c',
    verb: 'stands', blurb: 'Raise shield that soaks damage.',
  },
};

/**
 * Card faces. kind: damage | draw | heal | shield.
 * value is the base number; draw cards may also carry bonusDamage.
 * Twelve faces, each printed twice, make the 24-card deck.
 */
export const CARD_FACES = [
  { id: 'spark', name: 'Spark', suit: 'flame', cost: 1, kind: 'damage', value: 2 },
  { id: 'blaze', name: 'Blaze', suit: 'flame', cost: 3, kind: 'damage', value: 5 },
  { id: 'inferno', name: 'Inferno', suit: 'flame', cost: 5, kind: 'damage', value: 8 },
  { id: 'current', name: 'Current', suit: 'tide', cost: 2, kind: 'draw', value: 2 },
  { id: 'surge', name: 'Surge', suit: 'tide', cost: 3, kind: 'draw', value: 2, bonusDamage: 1 },
  { id: 'deluge', name: 'Deluge', suit: 'tide', cost: 4, kind: 'draw', value: 3 },
  { id: 'sprout', name: 'Sprout', suit: 'leaf', cost: 2, kind: 'heal', value: 3 },
  { id: 'bloom', name: 'Bloom', suit: 'leaf', cost: 3, kind: 'heal', value: 5 },
  { id: 'grove', name: 'Grove', suit: 'leaf', cost: 4, kind: 'heal', value: 7 },
  { id: 'pebble', name: 'Pebble', suit: 'stone', cost: 1, kind: 'shield', value: 3 },
  { id: 'wall', name: 'Wall', suit: 'stone', cost: 2, kind: 'shield', value: 5 },
  { id: 'bastion', name: 'Bastion', suit: 'stone', cost: 4, kind: 'shield', value: 9 },
];

/** Plain-language effect line shown on each card face. */
export function describeCard(face) {
  if (face.kind === 'damage') return `Deal ${face.value} damage.`;
  if (face.kind === 'draw') {
    return face.bonusDamage
      ? `Draw ${face.value} cards, deal ${face.bonusDamage} damage.`
      : `Draw ${face.value} cards.`;
  }
  if (face.kind === 'heal') return `Restore ${face.value} life.`;
  return `Gain ${face.value} shield.`;
}

/** Short value line for the big number on the card face. */
export function valueLabel(face) {
  if (face.kind === 'damage') return { text: `${face.value}`, unit: 'DMG' };
  if (face.kind === 'draw') return { text: `+${face.value}`, unit: 'DRAW' };
  if (face.kind === 'heal') return { text: `+${face.value}`, unit: 'HEAL' };
  return { text: `${face.value}`, unit: 'SHIELD' };
}

// Twelve faces, four suits: every duel draws from the same honest deck.
