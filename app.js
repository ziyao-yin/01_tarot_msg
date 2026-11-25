// DOM references are collected once, after the HTML and card catalog load.
const ui = {};
for (const id of [
  'shuffle', 'reshuffle', 'cut', 'restart', 'deck-stack', 'shuffle-field', 'preparation',
  'shuffle-controls', 'cut-controls', 'cut-deck', 'cut-gaps', 'red-cut-card', 'cut-value', 'draw-area',
  'card-spread', 'empty-deck', 'stage-title', 'stage-label', 'stage-copy',
  'deck-count', 'status', 'reading-empty', 'reading-grid', 'reading-count',
  'restart-dialog', 'cancel-restart', 'confirm-restart', 'language',
]) {
  ui[id] = document.getElementById(id);
}

// Each deck entry holds a catalog card and its orientation for this reading.
// A draw transfers the same entry to drawnCards; it never randomizes it again.
let deck = [];
let drawnCards = [];
let phase = 'shuffle';
let busy = false;
let cutPosition = 39;

// Each gap is a real insertion point, after cards 1–77. The last card must
// stay in the bottom pile, so a cut after card 78 is intentionally unavailable.
function renderCutDeck() {
  ui['cut-gaps'].replaceChildren();
  cutLayoutKey = '';
  cutPileKey = '';
  cutRowWrite = [];
  selectedGap = -1;
  for (let position = 1; position <= 78; position++) {
    const gap = element('button', 'cut-gap back');
    gap.type = 'button';
    gap.tabIndex = -1;
    gap.style.setProperty('--cut-layer', String(position - 1));
    gap.setAttribute('aria-label', position === 78 ? t('Last card in the deck') : t('Cut after card {position} of 78', { position }));
    gap.addEventListener('click', (event) => {
      if (event.detail === 0 && position < 78) {
        selectCutPosition(position);
        confirmCut();
      }
    });
    gap.addEventListener('focus', () => { if (position < 78) selectCutPosition(position); });
    ui['cut-gaps'].append(gap);
  }
  selectCutPosition(cutPosition);
}

function selectCutPosition(position) {
  if (busy) return;
  cutPosition = Math.max(1, Math.min(77, position));
  if (ui['cut-value'].textContent !== `${cutPosition} / 78`) {
    ui['cut-value'].textContent = `${cutPosition} / 78`;
  }
  layoutCutDeck();
  // Only the gap that lost selection and the one that gained it are touched.
  const gaps = ui['cut-gaps'].children;
  const next = cutPosition - 1;
  if (selectedGap === next) return;
  if (gaps[selectedGap]) {
    gaps[selectedGap].tabIndex = -1;
    gaps[selectedGap].setAttribute('aria-pressed', 'false');
  }
  if (gaps[next]) {
    gaps[next].tabIndex = 0;
    gaps[next].setAttribute('aria-pressed', 'true');
  }
  selectedGap = next;
}

// Use the same adaptive overlapping row as the drawing stage. The red card
// rests at the chosen boundary until pointer movement picks it up again.
// Dragging only repositions the row, and only the gaps that actually move.
function layoutCutDeck() {
  const deckElement = ui['cut-deck'];
  const width = deckElement.clientWidth;
  if (!width) return;
  const key = `${width}|${cutPosition}`;
  if (key === cutLayoutKey) return;
  cutLayoutKey = key;
  const layout = getDeckLayout(width, 78, cutPosition - .5);
  deckElement.style.setProperty('--cut-card-width', `${layout.cardWidth}px`);
  const gaps = ui['cut-gaps'].children;
  for (let index = 0; index < gaps.length; index++) {
    const left = Math.round(layout.positions[index]);
    if (cutRowWrite[index] === left) continue;
    cutRowWrite[index] = left;
    gaps[index].style.setProperty('--row-left', `${left}px`);
  }
  ui['red-cut-card'].style.setProperty('--red-x', `${layout.positions[Math.min(77, cutPosition)]}px`);
  ui['red-cut-card'].style.setProperty('--red-y', '15px');
}

// Pile geometry is only read by the split and rejoin animations, so it is
// written once when the cut begins instead of on every pointer move.
function layoutCutPiles() {
  const width = ui['cut-deck'].clientWidth;
  if (!width) return;
  const key = `${width}|${cutPosition}`;
  if (key === cutPileKey) return;
  cutPileKey = key;
  const { cardWidth } = getDeckLayout(width, 78, cutPosition - .5);
  const centered = (width - cardWidth) / 2;
  const gaps = ui['cut-gaps'].children;
  for (let index = 0; index < gaps.length; index++) {
    const style = gaps[index].style;
    style.setProperty('--pile-left', `${Math.max(0, centered + (index < cutPosition ? -1 : 1) * cardWidth * .6)}px`);
    style.setProperty('--final-left', `${centered}px`);
    style.setProperty('--pile-lift', index < cutPosition ? '25px' : '-25px');
    style.setProperty('--final-layer', String(index < cutPosition ? index : index + 78));
  }
}

function pointCutCard(clientX, clientY) {
  const bounds = ui['cut-deck'].getBoundingClientRect();
  const fraction = Math.max(0, Math.min(1, (clientX - bounds.left) / Math.max(1, bounds.width)));
  selectCutPosition(1 + Math.floor(fraction * 76));
  const cardWidth = Math.min(96, bounds.width * .28);
  ui['red-cut-card'].style.setProperty('--red-x', `${Math.max(0, Math.min(bounds.width - cardWidth, clientX - bounds.left - cardWidth / 2))}px`);
  ui['red-cut-card'].style.setProperty('--red-y', `${Math.max(0, Math.min(95, clientY - bounds.top - 70))}px`);
}

/*
 * Rejection sampling avoids modulo bias. Fisher–Yates needs a uniformly
 * distributed integer at each step, including when the bound is not a power of 2.
 */
function randomInteger(bound) {
  if (!Number.isInteger(bound) || bound < 1 || bound > 0x100000000) {
    throw new RangeError('Random bound must be an integer from 1 to 2^32.');
  }
  const limit = Math.floor(0x100000000 / bound) * bound;
  const buffer = new Uint32Array(1);
  do {
    crypto.getRandomValues(buffer);
  } while (buffer[0] >= limit);
  return buffer[0] % bound;
}

function makeShuffledDeck() {
  const shuffled = TAROT_CARDS.map((card) => ({
    card,
    isReversed: randomInteger(2) === 1,
  }));

  // Unbiased Fisher–Yates shuffle; never sort using a random comparator.
  for (let index = shuffled.length - 1; index > 0; index--) {
    const otherIndex = randomInteger(index + 1);
    [shuffled[index], shuffled[otherIndex]] = [shuffled[otherIndex], shuffled[index]];
  }
  return shuffled;
}

function cutDeck(cards, position) {
  if (!Number.isInteger(position) || position < 1 || position >= cards.length) {
    throw new RangeError('The cut must leave at least one card in each pile.');
  }
  return [...cards.slice(position), ...cards.slice(0, position)];
}

function setPhase(nextPhase) {
  phase = nextPhase;
  for (const step of ['shuffle', 'cut', 'draw']) {
    const element = document.getElementById(`step-${step}`);
    if (step === phase) element.setAttribute('aria-current', 'step');
    else element.removeAttribute('aria-current');
  }
  ui['shuffle-controls'].hidden = phase !== 'shuffle';
  ui['cut-controls'].hidden = phase !== 'cut';
  ui.preparation.hidden = phase === 'draw';
  ui['draw-area'].hidden = phase !== 'draw';
  ui['deck-stack'].hidden = phase !== 'shuffle';
}

function setBusy(value) {
  busy = value;
  for (const id of ['shuffle', 'reshuffle', 'cut', 'restart', 'language']) {
    ui[id].disabled = value;
  }
  for (const gap of ui['cut-gaps'].children) gap.disabled = value;
  for (const card of ui['card-spread'].children) card.disabled = value || drawnCards.length >= 1;
}

function pauseForAnimation(milliseconds) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return new Promise((resolve) => setTimeout(resolve, reducedMotion ? 0 : milliseconds));
}

// Render every card once. The final layering matches the newly shuffled deck.
// Random travel paths are decorative; they never alter the actual deck order.
function buildShuffleAnimation(previousDeck, nextDeck) {
  const field = ui['shuffle-field'];
  const finalPositions = new Map(nextDeck.map((entry, index) => [entry.card.id, index]));

  const backs = previousDeck.map((entry, index) => {
    const back = element('div', 'mix-card back');
    const finalIndex = finalPositions.get(entry.card.id);
    const target = nextDeck[finalIndex];
    const properties = {
      '--end-layer': String(78 - finalIndex),
      '--x-one': String((randomInteger(2001) - 1000) / 1000),
      '--x-two': String((randomInteger(2001) - 1000) / 1000),
      '--y-one': `${randomInteger(161) - 80}px`,
      '--y-two': `${randomInteger(161) - 80}px`,
      '--spin': `${randomInteger(361) - 180}deg`,
      '--start-angle': entry.isReversed ? '180deg' : '0deg',
      '--end-angle': target.isReversed ? '540deg' : '360deg',
      '--delay': `${index * 5}ms`,
    };
    for (const [property, value] of Object.entries(properties)) {
      back.style.setProperty(property, value);
    }
    return back;
  });
  // One insertion instead of 78 keeps the first frame of the mix hitch-free.
  field.replaceChildren();
  field.append(...backs);
}

async function shuffleDeck() {
  if (busy || phase === 'draw') return;
  setBusy(true);
  ui.status.textContent = t('Shuffling all 78 cards and their orientations…');

  try {
    const previousDeck = deck.length
      ? deck
      : TAROT_CARDS.map((card) => ({ card, isReversed: false }));
    const nextDeck = makeShuffledDeck();
    buildShuffleAnimation(previousDeck, nextDeck);
    ui['deck-stack'].hidden = true;
    ui['shuffle-field'].hidden = false;
    // Include the last card's staggered start before enabling cut controls.
    await pauseForAnimation(3600);
    deck = nextDeck;
    setPhase('cut');
    ui['stage-label'].textContent = t('MAKE IT YOUR OWN');
    ui['stage-title'].textContent = t('Find your place in the deck.');
    ui['stage-copy'].textContent = t('Choose a gap in the deck and insert the red card.');
    ui.status.textContent = t('Shuffled. Each card has an independent 50/50 chance of being reversed.');
  } catch (error) {
    ui.status.textContent = t('Could not shuffle securely. Please try a modern browser.');
    console.error(error);
  } finally {
    ui['shuffle-field'].hidden = true;
    ui['shuffle-field'].replaceChildren();
    ui['deck-stack'].hidden = phase !== 'shuffle';
    setBusy(false);
    if (phase === 'cut') layoutCutDeck();
  }
}

async function confirmCut() {
  if (busy || phase !== 'cut') return;
  setBusy(true);
  const position = cutPosition;
  layoutCutDeck();
  layoutCutPiles();
  ui['cut-deck'].classList.add('inserting');
  ui.status.textContent = t('Inserting the red card after card {position} of 78…', { position });
  await pauseForAnimation(600);
  ui['cut-deck'].classList.add('splitting');
  ui.status.textContent = t('Cutting into piles of {top} and {bottom} cards…', { top: position, bottom: 78 - position });
  await pauseForAnimation(900);
  ui['cut-deck'].classList.add('rejoining');
  ui.status.textContent = t('Moving the bottom {bottom} cards above the top {top}…', { top: position, bottom: 78 - position });
  await pauseForAnimation(900);
  deck = cutDeck(deck, position);
  ui['cut-deck'].classList.remove('inserting', 'splitting', 'rejoining');
  setPhase('draw');
  ui['stage-label'].textContent = t('FOLLOW YOUR CURIOSITY');
  ui['stage-title'].textContent = t('A card is waiting for you.');
  ui.status.textContent = t('Laying out all 78 cards…');
  renderSpread(true);
  await pauseForAnimation(1400);
  // Remove animation styles so subsequent draws do not replay the deal.
  for (const button of ui['card-spread'].children) {
    button.classList.remove('dealing');
    button.disabled = false;
  }
  ui.status.textContent = t('Deck cut. Choose any face-down card to reveal it below.');
  setBusy(false);
  ui['card-spread'].querySelector('button')?.focus({ preventScroll: true });
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

let highlightedCard = -1;
let pressedPointer = null;

/*
 * Smoothness: card positions are written as transforms so the compositor moves
 * promoted layers without layout or paint, pointer input is coalesced to one
 * update per displayed frame, and geometry is cached per shape. None of this
 * touches deck state.
 */
const nextFrame = (callback) => (typeof requestAnimationFrame === 'function'
  ? requestAnimationFrame(callback)
  : setTimeout(callback, 16));

function throttleFrame(callback) {
  let scheduled = false;
  let latest = null;
  return function (...args) {
    latest = args;
    if (scheduled) return;
    scheduled = true;
    nextFrame(() => {
      scheduled = false;
      callback(...latest);
    });
  };
}

const layoutCache = new Map();

function cachedLayout(key, compute) {
  const hit = layoutCache.get(key);
  if (hit) return hit;
  if (layoutCache.size >= 128) layoutCache.clear();
  const value = compute();
  layoutCache.set(key, value);
  return value;
}

let spreadWidth = -1;
let spreadCardWidth = -1;
let spreadFocus = -1;
let spreadWrite = [];
let cutLayoutKey = '';
let cutPileKey = '';
let cutRowWrite = [];
let selectedGap = -1;

// Fresh nodes need fresh positions, and only one card is a tab stop at a time.
function resetSpreadLayout() {
  spreadWidth = -1;
  spreadCardWidth = -1;
  spreadFocus = -1;
  spreadWrite = [];
  highlightedCard = -2;
}

// Distribute extra space near the highlighted card, then normalize all gaps.
// The first and last cards always stay inside the available width.
function getDeckLayout(width, count, highlighted = -1) {
  return cachedLayout(`row|${width}|${count}|${highlighted}`, () => computeDeckLayout(width, count, highlighted));
}

function computeDeckLayout(width, count, highlighted) {
  const cardWidth = Math.min(96, Math.max(1, width * .28));
  const travel = Math.max(0, width - cardWidth);
  const weights = Array.from({ length: Math.max(0, count - 1) }, (_, index) => {
    const distance = index + .5 - highlighted;
    return highlighted < 0 ? 1 : 1 + 9 * Math.exp(-(distance * distance) / 3);
  });
  const total = weights.reduce((sum, value) => sum + value, 0);
  let offset = 0;
  const positions = Array.from({ length: count }, (_, index) => {
    const position = count === 1 ? travel / 2 : offset;
    if (index < weights.length) offset += travel * weights[index] / total;
    return position;
  });
  return { cardWidth, positions };
}

// Place card centers around a ring. Reserve room for rotated corners and lift
// so the full circle stays inside the table, including on narrow screens.
function getCircleLayout(size, count, highlighted = -1) {
  return cachedLayout(`circle|${size}|${count}|${highlighted}`, () => computeCircleLayout(size, count, highlighted));
}

function computeCircleLayout(size, count, highlighted) {
  const cardWidth = Math.min(80, size * .15);
  const cardHeight = cardWidth * 150 / 96;
  const lift = size * .045;
  const radius = Math.max(0, size / 2 - Math.hypot(cardWidth, cardHeight) / 2 - lift - 8);
  const positions = Array.from({ length: count }, (_, index) => {
    const angle = index * 2 * Math.PI / count - Math.PI / 2;
    const difference = Math.abs(index - highlighted);
    const distance = Math.min(difference, count - difference);
    const offset = highlighted < 0 ? 0 : lift * Math.exp(-distance * distance / 4);
    return {
      x: size / 2 + Math.cos(angle) * (radius + offset) - cardWidth / 2,
      y: size / 2 + Math.sin(angle) * (radius + offset) - cardHeight / 2,
      rotation: index * 360 / count,
      distance,
    };
  });
  return { cardWidth, cardHeight, radius, positions };
}

// One write pass per actual change: the card width lives on the container, and
// a card is only restyled when its rounded position or layer really moved.
function layoutSpread(highlighted = -1) {
  const container = ui['card-spread'];
  const cards = container.children;
  const width = container.clientWidth;
  if (!width || !cards.length) return;
  const target = highlighted < 0 ? -1 : Math.min(highlighted, cards.length - 1);
  if (target === highlightedCard && width === spreadWidth && spreadWrite.length === cards.length) return;

  const { cardWidth, positions } = getCircleLayout(width, cards.length, target);
  if (cardWidth !== spreadCardWidth) {
    container.style.setProperty('--card-width', `${cardWidth}px`);
    spreadCardWidth = cardWidth;
  }
  spreadWidth = width;
  highlightedCard = target;

  // A rebuilt ring starts with no tab stop; the focused card is set below.
  if (spreadWrite.length !== cards.length) {
    spreadWrite = Array.from({ length: cards.length }, () => null);
    for (const card of cards) card.tabIndex = -1;
    spreadFocus = -1;
  }

  const focusTarget = Math.max(0, target);
  if (focusTarget !== spreadFocus) {
    if (cards[spreadFocus]) cards[spreadFocus].tabIndex = -1;
    if (cards[focusTarget]) cards[focusTarget].tabIndex = 0;
    spreadFocus = focusTarget;
  }

  for (let index = 0; index < cards.length; index++) {
    const position = positions[index];
    const x = Math.round(position.x);
    const y = Math.round(position.y);
    const rotation = Math.round(position.rotation * 100) / 100;
    // Only cards near the pointer are lifted, so the far field keeps its base
    // stacking order and is not restyled as the ring turns.
    const layer = target < 0 || position.distance > 14 ? index : 200 - position.distance;
    const previous = spreadWrite[index] || (spreadWrite[index] = { x: NaN, y: NaN, rotation: NaN, layer: NaN });
    const style = cards[index].style;
    // Whole-pixel positions keep distant cards unchanged as the ring turns.
    if (previous.x !== x || previous.y !== y) {
      style.setProperty('--card-x', `${x}px`);
      style.setProperty('--card-y', `${y}px`);
      previous.x = x;
      previous.y = y;
    }
    if (previous.rotation !== rotation) {
      style.setProperty('--card-rotation', `${rotation}deg`);
      previous.rotation = rotation;
    }
    if (previous.layer !== layer) {
      style.setProperty('--layer', String(layer));
      previous.layer = layer;
    }
  }
}

// Hit testing uses a fixed coordinate map, not moving card edges, so magnifying
// a card cannot make the selection oscillate under a stationary pointer.
function cardIndexAt(clientX, clientY) {
  const bounds = ui['card-spread'].getBoundingClientRect();
  const x = clientX - bounds.left - bounds.width / 2;
  const y = clientY - bounds.top - bounds.width / 2;
  const { cardHeight, radius } = getCircleLayout(bounds.width, deck.length);
  const distance = Math.hypot(x, y);
  // Empty center and corners are not selectable cards.
  if (!deck.length || distance < radius - cardHeight / 2 || distance > bounds.width / 2) return -1;
  const angle = (Math.atan2(y, x) + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2);
  return Math.round(angle / (Math.PI * 2) * deck.length) % deck.length;
}

function renderSpread(animate = false) {
  ui['card-spread'].replaceChildren();
  resetSpreadLayout();
  deck.forEach((entry, index) => {
    const button = element('button', 'draw-card back');
    button.type = 'button';
    button.style.setProperty('--card-index', String(index));
    if (animate) {
      button.classList.add('dealing');
      button.style.setProperty('--deal-delay', `${index * 10}ms`);
      button.disabled = true;
    }
    // Do not expose identity or orientation before the card has been chosen.
    button.setAttribute('aria-label', t('Draw card {position} of {total}', { position: index + 1, total: deck.length }));
    // Pointer selection is handled by the container; detail=0 is keyboard/AT.
    button.addEventListener('click', (event) => {
      if (event.detail === 0) drawCard(entry);
    });
    button.addEventListener('focus', () => { if (!busy) layoutSpread(index); });
    button.addEventListener('keydown', (event) => {
      if (busy) return;
      const offsets = { ArrowLeft: -1, ArrowRight: 1 };
      if (!(event.key in offsets) && event.key !== 'Home' && event.key !== 'End') return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? deck.length - 1 : Math.max(0, Math.min(deck.length - 1, index + offsets[event.key]));
      ui['card-spread'].children[next].focus({ preventScroll: true });
    });
    ui['card-spread'].append(button);
  });
  layoutSpread();
  ui['deck-count'].textContent = t('{remaining} remaining · {drawn} drawn', { remaining: deck.length, drawn: drawnCards.length });
  ui['empty-deck'].hidden = deck.length !== 0;
}

function createReadingCard(entry, number) {
  const { isReversed } = entry;
  const card = localizeCard(entry.card);
  const orientation = t(isReversed ? 'Reversed' : 'Upright');
  const article = element('article', 'reading-card');
  article.append(element('p', 'draw-number', t('DRAW {number} / {family}', { number: String(number).padStart(2, '0'), family: card.family.toUpperCase() })));

  // Rotate the whole card face while keeping the explanation below readable.
  const face = element('div', 'card-face' + (isReversed ? ' reversed' : ''));
  face.setAttribute('aria-hidden', 'true');
  face.append(
    element('span', 'face-rank', card.rank),
    element('span', 'face-art', card.symbol),
    element('span', 'face-name', card.name)
  );
  // Two sides of one 3D card: start on its back, then turn to its face.
  const reveal = element('div', 'card-reveal');
  const rotor = element('div', 'card-rotor');
  const front = element('div', 'reveal-front');
  front.append(face);
  rotor.append(element('div', 'reveal-back back'), front);
  reveal.append(rotor);
  article.append(
    reveal,
    element('h3', '', card.name),
    element('span', 'orientation', orientation),
    element('p', 'meaning', isReversed ? card.reversed : card.upright)
  );
  return article;
}

async function drawCard(entry) {
  // This version supports exactly one card per reading, including rapid clicks.
  if (busy || phase !== 'draw' || drawnCards.length >= 1) return;
  const index = deck.indexOf(entry);
  if (index === -1) return; // Ignore stale events for an already drawn card.
  setBusy(true);
  const source = ui['card-spread'].children[index];
  const sourceRect = source.getBoundingClientRect();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  source.classList.add('drawing');
  ui.status.textContent = t('Drawing your card…');
  await pauseForAnimation(300);
  deck.splice(index, 1);
  drawnCards.push(entry);
  ui['reading-empty'].hidden = true;
  const article = createReadingCard(entry, drawnCards.length);
  article.classList.add('awaiting-reveal');
  article.setAttribute('aria-hidden', 'true');
  ui['reading-grid'].append(article);
  const reveal = article.children[1];

  // Bring the destination into view before flying a temporary back into it.
  // Only the decoration moves; the selected deck entry stays unchanged.
  article.scrollIntoView({ behavior: 'instant', block: 'nearest' });
  if (!reducedMotion) {
    const destination = reveal.getBoundingClientRect();
    const flyingCard = element('div', 'flying-card back');
    flyingCard.setAttribute('aria-hidden', 'true');
    Object.assign(flyingCard.style, {
      left: `${sourceRect.left}px`,
      top: `${sourceRect.top}px`,
      width: `${sourceRect.width}px`,
      height: `${sourceRect.height}px`,
    });
    document.body.append(flyingCard);
    try {
      await flyingCard.animate([
        { transform: 'translateY(-30px) rotate(-5deg)' },
        { transform: `translate(${destination.left - sourceRect.left}px, ${destination.top - sourceRect.top}px) scale(${destination.width / sourceRect.width}, ${destination.height / sourceRect.height})` },
      ], { duration: 650, easing: 'cubic-bezier(.22,.7,.3,1)', fill: 'forwards' }).finished;
    } finally {
      flyingCard.remove();
    }
  }
  // Rebuild the ring only after the flight, so nothing repaints beneath it.
  renderSpread();
  for (const button of ui['card-spread'].children) button.disabled = true;
  article.classList.remove('awaiting-reveal');
  await pauseForAnimation(100);
  reveal.classList.add('is-flipped');
  await pauseForAnimation(750);
  article.classList.add('revealed');
  article.removeAttribute('aria-hidden');
  ui['reading-count'].textContent = t('1 card drawn');
  ui.status.textContent = completedReadingText(entry);
  ui['stage-title'].textContent = t('Your card has been drawn.');
  document.querySelector('.draw-instruction').textContent = t('One card, one reading. Choose New reading when you’re ready to begin again.');
  setBusy(false);
  layoutSpread();
  ui.restart.focus({ preventScroll: true });
}

function resetReading() {
  if (busy) return;
  deck = [];
  drawnCards = [];
  document.querySelector('.draw-instruction').textContent = t('Choose one card from the circle. Move around the ring to lift nearby cards, then click to draw. On touch screens, slide around the ring and release. Keyboard: arrow keys, then Enter.');
  setPhase('shuffle');
  ui['reading-grid'].replaceChildren();
  ui['card-spread'].replaceChildren();
  resetSpreadLayout();
  ui['reading-empty'].hidden = false;
  ui['empty-deck'].hidden = true;
  ui['reading-count'].textContent = t('No cards drawn yet');
  ui['deck-count'].textContent = t('78 cards · Full deck');
  ui['stage-label'].textContent = t('BEGIN YOUR RITUAL');
  ui['stage-title'].textContent = t('Start with a shuffle.');
  ui['stage-copy'].textContent = t('Bring a question to mind, or simply stay curious.');
  ui.status.textContent = t('Upright & reversed · Randomized with every shuffle');
  cutPosition = 39;
  renderCutDeck();
}

ui.shuffle.addEventListener('click', shuffleDeck);
const scheduleSpreadPointer = throttleFrame((clientX, clientY) => {
  if (busy || !deck.length || drawnCards.length) return;
  layoutSpread(cardIndexAt(clientX, clientY));
});
ui['card-spread'].addEventListener('pointermove', (event) => {
  if (!busy && deck.length && !drawnCards.length) scheduleSpreadPointer(event.clientX, event.clientY);
});
ui['card-spread'].addEventListener('pointerdown', (event) => {
  if (busy || drawnCards.length || !deck.length || event.button !== 0) return;
  if (cardIndexAt(event.clientX, event.clientY) < 0) return;
  pressedPointer = event.pointerId;
  ui['card-spread'].setPointerCapture(event.pointerId);
  layoutSpread(cardIndexAt(event.clientX, event.clientY));
});
ui['card-spread'].addEventListener('pointerup', (event) => {
  if (pressedPointer !== event.pointerId) return;
  pressedPointer = null;
  ui['card-spread'].releasePointerCapture(event.pointerId);
  const bounds = ui['card-spread'].getBoundingClientRect();
  if (!busy && event.clientX >= bounds.left && event.clientX <= bounds.right &&
      event.clientY >= bounds.top && event.clientY <= bounds.bottom) {
    const index = cardIndexAt(event.clientX, event.clientY);
    if (index >= 0) drawCard(deck[index]);
    else layoutSpread();
  } else layoutSpread();
});
ui['card-spread'].addEventListener('pointercancel', () => {
  pressedPointer = null;
  if (!busy) layoutSpread();
});
ui['card-spread'].addEventListener('pointerleave', () => {
  if (!busy && pressedPointer === null) layoutSpread();
});
new ResizeObserver(() => layoutSpread(highlightedCard)).observe(ui['card-spread']);
new ResizeObserver(() => { if (!busy) layoutCutDeck(); }).observe(ui['cut-deck']);
const scheduleCutPointer = throttleFrame((clientX, clientY) => {
  if (busy || phase !== 'cut') return;
  pointCutCard(clientX, clientY);
});
ui['cut-deck'].addEventListener('pointermove', (event) => {
  if (!busy && phase === 'cut') scheduleCutPointer(event.clientX, event.clientY);
});
ui['cut-deck'].addEventListener('pointerleave', () => { if (!busy) layoutCutDeck(); });
ui['cut-deck'].addEventListener('click', (event) => {
  if (event.detail === 0 || busy || phase !== 'cut') return;
  pointCutCard(event.clientX, event.clientY);
  confirmCut();
});
ui.reshuffle.addEventListener('click', shuffleDeck);
ui.cut.addEventListener('click', confirmCut);
ui['cut-deck'].addEventListener('keydown', (event) => {
  const changes = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
  if (!(event.key in changes) && event.key !== 'Home' && event.key !== 'End') return;
  if (busy) return;
  event.preventDefault();
  const position = event.key === 'Home' ? 1 : event.key === 'End' ? 77 : cutPosition + changes[event.key];
  selectCutPosition(position);
  ui['cut-gaps'].children[cutPosition - 1].focus({ preventScroll: true });
});
ui.restart.addEventListener('click', () => {
  if (busy) return;
  if (drawnCards.length) ui['restart-dialog'].showModal();
  else resetReading();
});
ui['cancel-restart'].addEventListener('click', () => ui['restart-dialog'].close());
ui['confirm-restart'].addEventListener('click', () => {
  ui['restart-dialog'].close();
  resetReading();
  ui.shuffle.focus();
});
resetReading();


// Language changes only re-render text and revealed cards, never deck state.
function completedReadingText(entry) {
  return t('{name} · {orientation}. Reading complete. Start a new reading to draw again.', {
    name: localizeCard(entry.card).name,
    orientation: t(entry.isReversed ? 'Reversed' : 'Upright'),
  });
}
function changeLanguage(nextLanguage) {
  if (busy || !['en', 'zh-CN'].includes(nextLanguage)) return;
  language = nextLanguage;
  ui.language.value = language;
  translateStaticContent();
  const stage = phase === 'shuffle'
    ? ['BEGIN YOUR RITUAL', 'Start with a shuffle.', 'Bring a question to mind, or simply stay curious.']
    : phase === 'cut'
      ? ['MAKE IT YOUR OWN', 'Find your place in the deck.', 'Choose a gap in the deck and insert the red card.']
      : ['FOLLOW YOUR CURIOSITY', drawnCards.length ? 'Your card has been drawn.' : 'A card is waiting for you.', ''];
  ['stage-label', 'stage-title', 'stage-copy'].forEach((id, index) => { ui[id].textContent = t(stage[index]); });
  renderCutDeck();
  if (phase === 'draw') renderSpread();
  ui['reading-grid'].replaceChildren();
  drawnCards.forEach((entry, index) => {
    const article = createReadingCard(entry, index + 1);
    article.classList.add('revealed');
    article.children[1].classList.add('is-flipped');
    ui['reading-grid'].append(article);
  });
  ui['reading-count'].textContent = t(drawnCards.length ? '1 card drawn' : 'No cards drawn yet');
  ui['deck-count'].textContent = phase === 'draw'
    ? t('{remaining} remaining · {drawn} drawn', { remaining: deck.length, drawn: drawnCards.length })
    : t('78 cards · Full deck');
  ui.status.textContent = drawnCards.length ? completedReadingText(drawnCards[0]) : t({
    shuffle: 'Upright & reversed · Randomized with every shuffle',
    cut: 'Shuffled. Each card has an independent 50/50 chance of being reversed.',
    draw: 'Deck cut. Choose any face-down card to reveal it below.',
  }[phase]);
  if (drawnCards.length) {
    document.querySelector('.draw-instruction').textContent = t('One card, one reading. Choose New reading when you’re ready to begin again.');
  }
  setBusy(false);
}
ui.language.addEventListener('change', () => changeLanguage(ui.language.value));
translateStaticContent();
