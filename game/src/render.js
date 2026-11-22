// Emberfall Duel — DOM rendering, suit icons, card art and animations.
import { SUITS, describeCard, valueLabel } from './cards.js';
import { deckCount } from './deck.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_TABLE = 'table';
export const SCREEN_WIN = 'win';
export const SCREEN_LOSS = 'loss';

/** Inline SVG icons: one shape per suit, coloured by the suit. */
export function suitIcon(suit, colour) {
  const fill = colour || SUITS[suit].colour2;
  if (suit === 'flame') {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="${fill}" d="M12 2c1 3-2 4.5-2 7 0 1.2.8 2 1.8 2C11 10 11 8.5 12 7c2.5 1.5 5 4 5 8a5 5 0 0 1-10 0c0-2 1-3.5 2-5 .3 1 .8 1.8 1.6 2.2C10.4 9 10 5 12 2z"/></svg>`;
  }
  if (suit === 'tide') {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="${fill}" d="M2 14c2.5-2.5 5-2.5 7.5 0s5 2.5 7.5 0c1.5-1.5 3-1.5 5 0v3c-2-1.5-3.5-1.5-5 0s-5 1.5-7.5 0-5-1.5-7.5 0v-3z"/><path fill="${fill}" opacity="0.65" d="M2 8c2.5-2.5 5-2.5 7.5 0s5 2.5 7.5 0c1.5-1.5 3-1.5 5 0v3c-2-1.5-3.5-1.5-5 0s-5 1.5-7.5 0-5-1.5-7.5 0V8z"/></svg>`;
  }
  if (suit === 'leaf') {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="${fill}" d="M20 4C11 4 5 8 4 15c-.3 2 .5 4 1.5 5 .4-3 1.5-6 3.5-8.5C6 14 5 17 5 20c1.5.5 3.5.3 5.5-.5C17 17 20 11 20 4z"/><path fill="#ffffff" opacity="0.55" d="M7 17c3-5 7-8 11-9-4 2-8 5-11 9z"/></svg>`;
  }
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="${fill}" d="M3 20L9 7l3.5 6L15 9l6 11H3z"/><path fill="#ffffff" opacity="0.5" d="M9 7l1.8 3.5-1.4 1.2L7.4 9 9 7z"/></svg>`;
}

/** Hearts row: filled hearts for life, dim for lost life. */
export function heartsRow(life, maxLife) {
  let out = '';
  for (let i = 0; i < maxLife; i += 1) {
    out += i < life ? '♥' : '<span style="opacity:0.22">♥</span>';
  }
  return out;
}

/** Ember pips: lit embers for the current turn's mana. */
export function emberPips(embers, maxEmbers) {
  let out = '';
  const shown = Math.max(maxEmbers, 1);
  for (let i = 0; i < shown; i += 1) {
    out += `<span class="pip${i < embers ? ' lit' : ''}"></span>`;
  }
  return `${out}<span class="pip-num">${embers}/${maxEmbers}</span>`;
}

/** One playable card face. index gives its keyboard number. */
export function cardElement(card, index, playable, resonant) {
  const face = card.face;
  const suit = SUITS[face.suit];
  const value = valueLabel(face);
  const el = document.createElement('article');
  el.className = `card${playable ? '' : ' unplayable'}`;
  el.dataset.uid = card.uid;
  el.dataset.index = String(index + 1);
  el.style.animationDelay = `${index * 0.06}s`;
  el.innerHTML = `
    <span class="cost">${face.cost}</span>
    <div class="suit-band ${face.suit}">${suit.label}</div>
    <div class="suit-art">${suitIcon(face.suit)}</div>
    <div class="big-value">${value.text} <small>${value.unit}</small></div>
    <div class="card-name">${face.name}</div>
    <div class="card-text">${describeCard(face)}</div>
    <span class="key-hint">[${index + 1}]</span>
    ${resonant ? '<span class="resonance-tag">RESONANCE +2</span>' : ''}`;
  return el;
}

/** Fighter panel: avatar, name, hearts, shield and embers. */
export function fighterPanel(side, isYou) {
  const hearts = heartsRow(side.life, side.maxLife);
  const shield = side.shield > 0 ? `<span class="shield-badge">🛡 ${side.shield} shield</span>` : '';
  return `
    <div class="avatar ${isYou ? 'you' : 'cinder'}">${isYou ? 'Y' : 'C'}</div>
    <div>
      <div class="fighter-name">${side.name}</div>
      <div class="life-line"><span class="hearts">${hearts}</span>
        <span class="life-num">${side.life}<small> / ${side.maxLife}</small></span>${shield}</div>
      <div class="embers">${emberPips(side.embers, side.maxEmbers)}</div>
    </div>`;
}

/** The full table: rival on top, intent + log in the middle, your hand below. */
export function renderTable(game, stage) {
  const player = game.player;
  const cinder = game.cinder;
  const rivalBacks = cinder.hand.map(() => '<div class="mini-back"></div>').join('');
  const logItems = game.log.map((line) => `<li class="${line.includes('Resonance') ? 'resonance' : ''}">${line}</li>`).join('');
  const cards = player.hand.map((card, i) => {
    const playable = card.face.cost <= player.embers;
    const resonant = player.playedSuits.includes(card.face.suit);
    return cardElement(card, i, playable, resonant);
  });
  stage.innerHTML = `
    <div class="table" id="table">
      <div class="row">
        <div class="fighter">${fighterPanel(cinder, false)}</div>
        <div class="rival-hand">${rivalBacks}</div>
        <div><div class="deck-pile">${deckCount(cinder.pile)}</div><div class="deck-label">Cinder deck</div></div>
      </div>
      <div class="mid">
        <div class="intent-box">
          <div class="intent-label">CINDER'S INTENT</div>
          <div class="intent-text">${game.intent.text}</div>
          <div class="intent-sub">${game.intent.hint}</div>
        </div>
        <div class="log-box"><h3>BATTLE LOG</h3><ul>${logItems}</ul></div>
        <div class="turn-box">
          <div class="turn-num">TURN <b>${game.turn}</b></div>
          <button class="big-btn" id="end-turn" type="button">End Turn ⏎</button>
          <div class="hint">Keys 1–7 pick a card · Enter plays it<br>Space / E ends the turn</div>
        </div>
      </div>
      <div class="row">
        <div class="fighter">${fighterPanel(player, true)}</div>
        <div><div class="deck-pile">${deckCount(player.pile)}</div><div class="deck-label">Your deck</div></div>
      </div>
      <div class="hand" id="hand"></div>
    </div>`;
  const handEl = stage.querySelector('#hand');
  for (const cardEl of cards) handEl.appendChild(cardEl);
}

/** Title screen with the four suits and a preview fan of cards. */
export function renderTitle(game, stage) {
  const chips = Object.values(SUITS).map((suit) => `
    <div class="suit-chip">${suitIcon(suit.key)}<span>${suit.label}</span><span>${suit.blurb}</span></div>`).join('');
  stage.innerHTML = `
    <div class="splash">
      <h1>EMBER<span class="ember">FALL</span><br>DUEL</h1>
      <p class="tagline">A duel of burning cards. Outwit Cinder, keeper of the last ember —
        chain suits into Resonance, guard with stone, and burn her life to zero.</p>
      <div class="suit-row">${chips}</div>
      <button class="play-cta" id="play-btn" type="button">▶ &nbsp;PLAY THE DUEL</button>
      <div class="keys-note">Click / Enter to play · Mouse + keyboard · 30 life each · First to zero loses</div>
    </div>`;
}

/** Win or loss screen with stats and a retry button. */
export function renderEnd(game, stage, won) {
  const s = game.stats;
  const title = won ? 'VICTORY' : 'DEFEAT';
  const sub = won
    ? 'Cinder bows as her last ember fades into yours. The table is yours — the duel is won.'
    : 'The ember slips from your hand and Cinder gathers it up. Study her intent, chain your suits, and duel again.';
  stage.innerHTML = `
    <div class="splash">
      <div class="end-title ${won ? 'win' : 'lose'}">${title}</div>
      <p class="end-sub">${sub}</p>
      <div class="stats">
        <div class="stat"><div class="stat-num">${s.turns}</div><div class="stat-label">TURNS</div></div>
        <div class="stat"><div class="stat-num">${s.damageDealt}</div><div class="stat-label">DAMAGE DEALT</div></div>
        <div class="stat"><div class="stat-num">${s.cardsPlayed}</div><div class="stat-label">CARDS PLAYED</div></div>
        <div class="stat"><div class="stat-num">${game.player.life} / ${game.player.maxLife}</div><div class="stat-label">LIFE LEFT</div></div>
      </div>
      <button class="play-cta" id="retry-btn" type="button">↻ &nbsp;DUEL AGAIN</button>
      <div class="keys-note">Press Enter to duel again</div>
    </div>`;
  if (won) spawnEmbers(stage);
}

/** Rising ember particles over a victory screen. */
export function spawnEmbers(stage) {
  const splash = stage.querySelector('.splash');
  if (!splash) return;
  for (let i = 0; i < 42; i += 1) {
    const mote = document.createElement('span');
    mote.className = 'ember-particle';
    mote.style.left = `${8 + Math.random() * 84}%`;
    mote.style.bottom = `${2 + Math.random() * 12}%`;
    mote.style.animationDelay = `${Math.random() * 1.8}s`;
    const size = 6 + Math.random() * 9;
    mote.style.width = `${size}px`;
    mote.style.height = `${size}px`;
    splash.appendChild(mote);
  }
}

/** Floating damage / heal / shield number over the stage. */
export function floatNumber(text, kind, xPercent, yPercent) {
  const layer = document.getElementById('float-layer');
  if (!layer) return;
  const span = document.createElement('span');
  span.className = `float-num ${kind}`;
  span.textContent = text;
  span.style.left = `${xPercent}%`;
  span.style.top = `${yPercent}%`;
  layer.appendChild(span);
  window.setTimeout(() => span.remove(), 1200);
}

/** Shake the table after a big hit. */
export function shakeTable(stage) {
  const table = stage.querySelector('.table');
  if (!table) return;
  table.classList.remove('shake');
  void table.offsetWidth;
  table.classList.add('shake');
}
