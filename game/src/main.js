// Emberfall Duel — bootstrap, mouse + keyboard input, screen switching.
import { createGame, startDuel, playCard, endPlayerTurn, rematch } from './state.js';
import { renderTitle, renderTable, renderEnd, floatNumber, shakeTable } from './render.js';
import { stageShot } from './shots.js';
import { playCardSound, hitSound, healSound, winSound, loseSound, toggleSound, soundOn } from './audio.js';

const stage = document.getElementById('stage');
const soundBtn = document.getElementById('sound-btn');
const rulesBtn = document.getElementById('rules-btn');
const rulesPanel = document.getElementById('rules-panel');
const rulesClose = document.getElementById('rules-close');

let game = createGame(20261122);
let selectedUid = null;

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') || '1', 10);
const shotSeed = Number.isFinite(seedParam) ? seedParam : 1;

/** Draw the current screen from the game state. */
export function drawScreen() {
  if (game.screen === 'title') renderTitle(game, stage);
  else if (game.screen === 'table') renderTable(game, stage);
  else renderEnd(game, stage, game.screen === 'win');
  wireScreen();
}

/** Attach the buttons and cards of the freshly drawn screen. */
function wireScreen() {
  const playBtn = document.getElementById('play-btn');
  if (playBtn) playBtn.addEventListener('click', () => beginDuel());
  const retryBtn = document.getElementById('retry-btn');
  if (retryBtn) retryBtn.addEventListener('click', () => beginRematch());
  const endBtn = document.getElementById('end-turn');
  if (endBtn) endBtn.addEventListener('click', () => finishTurn());
  for (const cardEl of stage.querySelectorAll('.card')) {
    cardEl.addEventListener('click', () => {
      if (cardEl.classList.contains('unplayable')) return;
      if (selectedUid === cardEl.dataset.uid) playSelected();
      else {
        selectedUid = cardEl.dataset.uid;
        drawScreen();
        const again = stage.querySelector(`[data-uid="${selectedUid}"]`);
        if (again) again.classList.add('selected');
      }
    });
  }
}

function beginDuel() {
  startDuel(game);
  playCardSound('flame');
  drawScreen();
}

function beginRematch() {
  game = rematch(game);
  selectedUid = null;
  drawScreen();
}

function playSelected() {
  if (!selectedUid) return;
  const card = game.player.hand.find((c) => c.uid === selectedUid);
  if (!card) {
    selectedUid = null;
    return;
  }
  const event = playCard(game, game.player, selectedUid);
  selectedUid = null;
  if (!event) {
    drawScreen();
    return;
  }
  playCardSound(event.suit);
  if (event.kind === 'damage') {
    hitSound(event.amount >= 8);
    floatNumber(`-${event.amount}`, 'damage', 62, 22);
    if (event.amount >= 8) shakeTable(stage);
  } else if (event.kind === 'heal') {
    healSound();
    floatNumber(`+${event.amount}`, 'heal', 30, 68);
  } else if (event.kind === 'shield') {
    floatNumber(`+${event.amount} shield`, 'shield', 30, 68);
  } else {
    floatNumber(`+${event.amount} cards`, 'draw', 30, 68);
  }
  if (game.screen === 'win') winSound();
  if (game.screen === 'loss') loseSound();
  drawScreen();
}

function finishTurn() {
  if (game.screen !== 'table') return;
  const before = game.cinder.life;
  endPlayerTurn(game);
  if (game.cinder.life < before) hitSound(false);
  if (game.screen === 'win') winSound();
  if (game.screen === 'loss') loseSound();
  selectedUid = null;
  drawScreen();
}

/** Keyboard: 1-7 pick a card, Enter plays it (or starts / retries), Space / E ends the turn. */
document.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    if (game.screen === 'title') beginDuel();
    else if (game.screen === 'win' || game.screen === 'loss') beginRematch();
    else playSelected();
    return;
  }
  if (game.screen !== 'table') return;
  if (event.key >= '1' && event.key <= '7') {
    const index = Number.parseInt(event.key, 10) - 1;
    const card = game.player.hand[index];
    if (!card) return;
    selectedUid = card.uid;
    drawScreen();
    const el = stage.querySelector(`[data-uid="${selectedUid}"]`);
    if (el) el.classList.add('selected');
    return;
  }
  if (event.key === ' ' || event.key === 'e' || event.key === 'E') {
    event.preventDefault();
    finishTurn();
  }
});

soundBtn.addEventListener('click', () => {
  const on = toggleSound();
  soundBtn.textContent = on ? 'Sound: On' : 'Sound: Off';
});
rulesBtn.addEventListener('click', () => {
  rulesPanel.hidden = false;
});
rulesClose.addEventListener('click', () => {
  rulesPanel.hidden = true;
});

// Screenshot scenes render their staged game and never wait for input.
if (shotName) {
  const staged = stageShot(shotName, shotSeed);
  game = staged.game;
  drawScreen();
} else {
  drawScreen();
}

// The duel starts on the title screen; a ?shot= query jumps straight to a scene.
