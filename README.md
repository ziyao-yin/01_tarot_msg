# Arcana — local tarot drawing app

Open `index.html` in a modern browser. No installation, server, API key, network connection, or account is needed.

Use the header’s language selector to switch between English and 简体中文 (Simplified Chinese). The interface, accessibility labels, and all 78 card names and upright/reversed meanings are translated. Switching preserves the deck, cut position, and current reading. The selector is temporarily disabled during animations. Language selection lasts for the current page session.

## Reading flow

1. Shuffle all 78 cards. Each card has its own animated back: the deck spreads, mixes, rotates, and gathers over about 3.6 seconds. You can shuffle again before cutting.
2. Move across the overlapping deck with a red card following your pointer. Click or tap to insert it and cut immediately. The readout shows the position out of 78. Arrow keys adjust by one card; Home/End select the first/last gap; Enter inserts. All cards gather into two piles before the bottom pile moves on top.
3. Watch the piles separate, exchange positions, and gather, then all 78 cards form an overlapping circle that fits the screen. Move around the ring to lift nearby cards; click to draw. On touch screens, slide around the ring and release; swipe outside the circle to scroll the page. Keyboard users can move with Left/Right or Home/End and draw with Enter. The empty center is not selectable.
4. Select a card to lift it out, move it into the reading, and flip it face up. Further selections are locked until the reveal finishes.
5. View your card, orientation, and brief meaning in Your reading. Each reading is limited to one card. Choose New reading to shuffle, cut, and draw again.

The deck contains 22 Major Arcana and 14 cards in each suit: Wands, Cups, Swords, and Pentacles. Cards use simple typographic artwork, not traditional illustrated scenes. Upright and reversed interpretations are original reflection prompts.

## Randomness and state

- `crypto.getRandomValues` supplies browser-generated random values.
- Rejection sampling produces unbiased bounded integers for a Fisher–Yates shuffle.
- Each card independently receives an upright or reversed orientation with equal probability. A deck is not forced to contain exactly 39 reversed cards.
- Cutting preserves the shuffled relative order and orientations within each pile.
- Drawing removes the selected card from the deck; no card can be drawn twice in a reading.
- Data stays in memory. Refreshing clears the reading.

## Source files

- `index.html`: reading steps, controls, card spread, and reading area.
- `style.css`: black-and-white design, card backs, animations, and mobile layout.
- `cards.js`: all 78 card definitions, symbols, and meanings.
- `cards-zh.js`: Simplified Chinese card names and meanings, keyed to the same card IDs.
- `i18n.js`: interface translations and localization helpers.
- `app.js`: randomization, state transitions, rendering, and input handling.
- `tests.cjs`: dependency-free checks for deck integrity, cutting, randomness boundaries, and drawing behavior. Run with `node tests.cjs`.

Animation respects reduced-motion preferences. Every face-down card is a keyboard-accessible button. Reversed cards rotate visually while their names and descriptions remain readable below.
