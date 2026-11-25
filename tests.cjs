// Run with `node tests.cjs`. No packages or browser installation required.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');

// Minimal DOM adapter for testing the application state and rendered content.
class Element {
  constructor() {
    this.children = [];
    this.value = '39';
    this.scrollTop = 0;
    this.clientWidth = 900;
    this.classList = { add() {}, remove() {} };
    this.attributes = {};
    this.style = {
      values: {},
      setProperty(name, value) { this.values[name] = value; },
    };
  }
  append(...children) { this.children.push(...children); }
  replaceChildren() { this.children = []; }
  setAttribute(name, value) { this.attributes[name] = value; }
  removeAttribute(name) { delete this.attributes[name]; }
  addEventListener() {}
  querySelectorAll() { return this.children; }
  querySelector() { return this.children[0]; }
  focus() {}
  scrollIntoView() {}
  getBoundingClientRect() { return { left: 0, top: 0, width: 96, height: 150 }; }
  animate() { this.didAnimate = true; return { finished: Promise.resolve() }; }
  remove() { this.removed = true; }
}
const elements = {};
const context = vm.createContext({
  document: {
    body: new Element(),
    documentElement: new Element(),
    querySelectorAll: () => [],
    getElementById: (id) => elements[id] ??= new Element(),
    querySelector: (selector) => elements[selector] ??= new Element(),
    createElement: () => new Element(),
  },
  crypto: webcrypto,
  window: { matchMedia: () => ({ matches: true }) },
  setTimeout: (callback) => callback(),
  console,
  ResizeObserver: class { observe() {} },
});
vm.runInContext(fs.readFileSync('cards.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('cards-zh.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('i18n.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('app.js', 'utf8'), context);
const evaluate = (code) => vm.runInContext(code, context);

async function run() {
  // The rotated card corners remain inside the circle's square container.
  for (const size of [240, 320, 600]) {
    for (const highlighted of [-1, 0, 39, 77]) {
      const circle = context.getCircleLayout(size, 78, highlighted);
      assert.equal(circle.positions.length, 78);
      for (const position of circle.positions) {
        const angle = position.rotation * Math.PI / 180;
        const halfWidth = (Math.abs(Math.cos(angle)) * circle.cardWidth + Math.abs(Math.sin(angle)) * circle.cardHeight) / 2;
        const halfHeight = (Math.abs(Math.sin(angle)) * circle.cardWidth + Math.abs(Math.cos(angle)) * circle.cardHeight) / 2;
        const x = position.x + circle.cardWidth / 2;
        const y = position.y + circle.cardHeight / 2;
        assert.ok(x - halfWidth >= 0 && x + halfWidth <= size);
        assert.ok(y - halfHeight >= 0 && y + halfHeight <= size);
      }
    }
  }
  // Every card stays in bounds at phone and desktop widths, including a
  // magnified selection at either end and a nearly exhausted deck.
  for (const width of [240, 320, 900, 1400]) {
    for (const count of [1, 2, 78]) {
      for (const selected of [-1, 0, Math.floor(count / 2), count - 1]) {
        const layout = context.getDeckLayout(width, count, selected);
        assert.equal(layout.positions.length, count);
        assert.ok(layout.positions.every((x) => x >= 0 && x + layout.cardWidth <= width + .00001));
        assert.ok(layout.positions.every((x, i) => i === 0 || x >= layout.positions[i - 1]));
      }
    }
  }
  assert.equal(evaluate('TAROT_CARDS.length'), 78);
  assert.equal(evaluate('new Set(TAROT_CARDS.map(card => card.id)).size'), 78);
  assert.equal(evaluate('new Set(TAROT_CARDS.map(card => card.name)).size'), 78);
  assert.equal(evaluate("TAROT_CARDS.filter(card => card.family === 'Major Arcana').length"), 22);
  for (const suit of ['Wands', 'Cups', 'Swords', 'Pentacles']) {
    assert.equal(evaluate(`TAROT_CARDS.filter(card => card.family === '${suit}').length`), 14);
  }
  assert.ok(evaluate('TAROT_CARDS.every(card => card.upright && card.reversed && card.symbol)'));
  assert.equal(evaluate('Object.keys(ZH_CARDS).length'), 78);
  assert.ok(evaluate('TAROT_CARDS.every(card => ZH_CARDS[card.id]?.name && ZH_CARDS[card.id]?.upright && ZH_CARDS[card.id]?.reversed)'));
  // Every static HTML translation key must have Chinese copy.
  const keys = [...fs.readFileSync('index.html', 'utf8').matchAll(/data-i18n(?:-aria)?="([^"]+)"/g)];
  for (const [, key] of keys) {
    const decoded = key.replaceAll('&amp;', '&').replaceAll('&quot;', '"');
    assert.ok(evaluate(`Object.hasOwn(ZH_UI, ${JSON.stringify(decoded)})`), decoded);
  }
  context.changeLanguage('zh-CN');
  assert.equal(context.document.documentElement.lang, 'zh-CN');
  assert.equal(elements['stage-title'].textContent, '从洗牌开始。');
  context.changeLanguage('en');

  // Check rejection sampling with a value beyond the largest unbiased interval.
  const samples = [0xffffffff, 8];
  context.crypto = { getRandomValues: (buffer) => { buffer[0] = samples.shift(); return buffer; } };
  assert.equal(evaluate('randomInteger(3)'), 2);
  assert.equal(samples.length, 0);
  context.crypto = { getRandomValues: (buffer) => { buffer[0] = 0; return buffer; } };
  assert.ok(evaluate('makeShuffledDeck().every(entry => !entry.isReversed)'));
  context.crypto = { getRandomValues: (buffer) => { buffer[0] = 1; return buffer; } };
  assert.ok(evaluate('makeShuffledDeck().every(entry => entry.isReversed)'));
  context.crypto = webcrypto;

  const deck = evaluate('makeShuffledDeck()');
  assert.equal(new Set(deck.map((entry) => entry.card.id)).size, 78);
  for (const position of [1, 39, 77]) {
    const cut = context.cutDeck(deck, position);
    // Strict identity checks ensure no orientation or card is replaced on cutting.
    for (let index = 0; index < 78; index++) {
      assert.equal(cut[index], deck[(index + position) % 78]);
    }
  }
  assert.throws(() => context.cutDeck(deck, 0));
  assert.throws(() => context.cutDeck(deck, 78));

  // Every catalog card gets its own animation node and the correct final layer.
  const nextDeck = context.makeShuffledDeck();
  context.buildShuffleAnimation(deck, nextDeck);
  assert.equal(elements['shuffle-field'].children.length, 78);
  deck.forEach((entry, index) => {
    const destination = nextDeck.findIndex((candidate) => candidate.card.id === entry.card.id);
    const properties = elements['shuffle-field'].children[index].style.values;
    assert.equal(properties['--end-layer'], String(78 - destination));
    assert.equal(properties['--end-angle'], nextDeck[destination].isReversed ? '540deg' : '360deg');
  });

  // Exercise the actual shuffle → cut → draw path and lock out invalid actions.
  await context.confirmCut();
  assert.equal(evaluate('phase'), 'shuffle');
  await context.shuffleDeck();
  assert.equal(evaluate('phase'), 'cut');
  assert.equal(evaluate('deck.length'), 78);
  assert.equal(elements['shuffle-field'].hidden, true);
  assert.equal(elements['shuffle-field'].children.length, 0);
  assert.equal(elements['deck-stack'].hidden, true);
  assert.equal(elements['cut-gaps'].children.length, 78);
  context.selectCutPosition(1);
  assert.equal(elements['cut-value'].textContent, '1 / 78');
  context.selectCutPosition(78);
  assert.equal(evaluate('cutPosition'), 77);
  assert.ok(elements['red-cut-card'].style.values['--red-x']);
  context.selectCutPosition(39);
  await context.confirmCut();
  assert.equal(evaluate('phase'), 'draw');
  assert.equal(elements['cut-gaps'].children[0].style.values['--pile-lift'], '25px');
  assert.equal(elements['cut-gaps'].children[39].style.values['--pile-lift'], '-25px');
  assert.ok(elements['card-spread'].children.every((button) => button.disabled === false));
  assert.equal(elements['card-spread'].children.length, 78);
  // Mock bounds are 96px wide: the top, right, bottom and left map clockwise.
  assert.equal(context.cardIndexAt(48, 48), -1);
  assert.equal(context.cardIndexAt(48, 10), 0);
  assert.equal(context.cardIndexAt(86, 48), 20);
  assert.equal(context.cardIndexAt(48, 86), 39);
  assert.equal(context.cardIndexAt(10, 48), 59);
  const selected = evaluate('deck[30]');
  // Exercise the flying-card branch as well as the reduced-motion fallback.
  context.window.matchMedia = () => ({ matches: false });
  const drawing = context.drawCard(selected);
  context.changeLanguage('zh-CN');
  assert.equal(evaluate('language'), 'en'); // Switching is disabled during motion.
  await context.drawCard(selected);
  await drawing;
  const flyingCard = context.document.body.children.at(-1);
  assert.equal(flyingCard.didAnimate, true);
  assert.equal(flyingCard.removed, true);
  assert.equal(evaluate('busy'), false);
  context.window.matchMedia = () => ({ matches: true });
  await context.drawCard(selected);
  assert.equal(evaluate('drawnCards.length'), 1);
  assert.equal(evaluate('deck.length'), 77);
  const rendered = elements['reading-grid'].children[0];
  assert.equal(rendered.children[2].textContent, selected.card.name);
  assert.equal(rendered.children[4].textContent, selected.isReversed ? selected.card.reversed : selected.card.upright);
  const face = rendered.children[1].children[0].children[1].children[0];
  assert.equal(face.className.includes('reversed'), selected.isReversed);
  const orderBeforeLanguageSwitch = evaluate('deck.map(entry => entry.card.id).join()');
  context.changeLanguage('zh-CN');
  assert.equal(evaluate('deck.map(entry => entry.card.id).join()'), orderBeforeLanguageSwitch);
  assert.equal(evaluate('drawnCards[0]'), selected);
  const chineseCard = context.localizeCard(selected.card);
  assert.equal(elements['reading-grid'].children[0].children[2].textContent, chineseCard.name);
  assert.equal(elements['reading-grid'].children[0].children[4].textContent, selected.isReversed ? chineseCard.reversed : chineseCard.upright);
  assert.ok(elements['card-spread'].children.every((button) => button.disabled));
  context.changeLanguage('en');
  assert.equal(elements['reading-grid'].children[0].children[2].textContent, selected.card.name);
  await context.shuffleDeck();
  assert.equal(evaluate('deck.length'), 77);
  await context.drawCard(evaluate('deck[0]'));
  assert.equal(evaluate('drawnCards.length'), 1);
  assert.equal(evaluate('deck.length'), 77);
  assert.ok(elements['card-spread'].children.every((button) => button.disabled));
  assert.equal(elements['reading-grid'].children.length, 1);
  context.resetReading();
  assert.equal(evaluate('phase'), 'shuffle');
  assert.equal(evaluate('drawnCards.length'), 0);
  assert.equal(elements['reading-grid'].children.length, 0);
  context.changeLanguage('zh-CN');
  await context.shuffleDeck();
  assert.equal(elements['stage-title'].textContent, '找到想切牌的位置。');
  await context.confirmCut();
  assert.equal(elements['stage-title'].textContent, '有一张牌正等着你。');
  await context.drawCard(evaluate('deck[0]'));
  assert.equal(evaluate('drawnCards.length'), 1);
  assert.equal(elements['stage-title'].textContent, '你的牌已揭晓。');
  assert.equal(elements['reading-count'].textContent, '已抽取 1 张牌');
  console.log('Passed: deck behavior, animations, one-card limit, all 78 Chinese translations, language switching without state changes, and full Chinese reading flow.');
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
