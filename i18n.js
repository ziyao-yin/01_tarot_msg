// English source phrases are stable translation keys for this small offline app.
let language = 'en';
const ZH_UI = {
  'Arcana — a tarot ritual': 'Arcana — 塔罗时光',
  'A LITTLE SPACE FOR POSSIBILITY': '为可能性留一点空间',
  'New reading': '重新抽牌',
  'THE FULL 78-CARD DECK': '完整的 78 张塔罗牌',
  'Let the cards unfold.': '让牌面慢慢展开。',
  'A quiet question. A shuffled deck. A new perspective.': '一个安静的问题，一副洗好的牌，一个新的视角。',
  'Shuffle': '洗牌', 'Cut the deck': '切牌', 'Draw your cards': '抽牌',
  'BEGIN YOUR RITUAL': '开启你的塔罗时光',
  'Start with a shuffle.': '从洗牌开始。',
  '78 cards · Full deck': '78 张牌 · 完整牌组',
  'Bring a question to mind, or simply stay curious.': '在心中想一个问题，或只是保持好奇。',
  'Shuffle the deck': '开始洗牌',
  'Insert the red cut card': '插入红色切牌卡',
  'CUT': '切牌',
  'Move the red card across the deck. Click or tap to insert it and cut. Keyboard: arrow keys, then Enter.': '移动红卡选择位置，点击或轻触即可插入并切牌。键盘：方向键选择，回车确认。',
  'The bottom pile moves to the top. Order and orientations stay intact.': '下方牌堆移到上方，保留每叠牌的顺序与正逆位。',
  'Shuffle again': '重新洗牌',
  'Insert at selected position': '在此位置插入',
  'Choose one card from the circle. Move around the ring to lift nearby cards, then click to draw. On touch screens, slide around the ring and release. Keyboard: arrow keys, then Enter.': '从圆环中选择一张牌。沿圆环移动可抬起附近的牌，点击抽取。触屏可沿圆环滑动后松手。键盘：方向键选择，回车抽牌。',
  'You’ve drawn the entire deck. Start a new reading whenever you’re ready.': '牌组已抽完，准备好后可以重新开始。',
  'Upright & reversed · Randomized with every shuffle': '包含正位与逆位 · 每次洗牌随机决定',
  'WHAT COMES TO LIGHT': '此刻的启示',
  'Your reading': '你的牌面解读',
  'No cards drawn yet': '尚未抽牌',
  'Your card will find its place here.': '你抽到的牌将在这里呈现。',
  'Draw one card for a moment of reflection.': '抽一张牌，给自己片刻思考。',
  'ARCANA / A LOCAL TAROT EXPERIENCE': 'ARCANA / 本地塔罗体验',
  'A tool for reflection, not a prediction.': '用于自我思考，而非预测未来。',
  'Begin a new reading?': '开始新的抽牌？',
  'Your current cards will be cleared.': '当前牌面将被清除。',
  'Keep this reading': '保留当前牌面', 'Start fresh': '重新开始',
  'Reading progress': '抽牌进度', 'Choose a gap in the deck': '选择切牌位置',
  'Face-down cards available to draw': '可抽取的背面朝上牌组',
  'Last card in the deck': '牌组的最后一张牌',
  'Cut after card {position} of 78': '在第 {position} 张牌后切牌，共 78 张',
  'Draw card {position} of {total}': '抽取第 {position} 张牌，共 {total} 张',
  'Shuffling all 78 cards and their orientations…': '正在随机洗牌，调整全部 78 张牌的顺序与正逆位……',
  'MAKE IT YOUR OWN': '选择你的切牌位置',
  'Find your place in the deck.': '找到想切牌的位置。',
  'Choose a gap in the deck and insert the red card.': '选择牌间的位置，插入红卡。',
  'Shuffled. Each card has an independent 50/50 chance of being reversed.': '洗牌完成。每张牌独立随机决定正逆位，各有 50% 的概率。',
  'Could not shuffle securely. Please try a modern browser.': '无法安全生成随机牌组，请使用较新的浏览器重试。',
  'Inserting the red card after card {position} of 78…': '正在第 {position} 张牌后插入红卡，共 78 张……',
  'Cutting into piles of {top} and {bottom} cards…': '正在分成 {top} 张与 {bottom} 张的两叠牌……',
  'Moving the bottom {bottom} cards above the top {top}…': '正在将下方的 {bottom} 张牌移到上方的 {top} 张牌之上……',
  'FOLLOW YOUR CURIOSITY': '跟随你的好奇心',
  'A card is waiting for you.': '有一张牌正等着你。',
  'Laying out all 78 cards…': '正在展开全部 78 张牌……',
  'Deck cut. Choose any face-down card to reveal it below.': '切牌完成。选择一张牌，在下方翻开。',
  '{remaining} remaining · {drawn} drawn': '剩余 {remaining} 张 · 已抽 {drawn} 张',
  'Upright': '正位', 'Reversed': '逆位',
  'DRAW {number} / {family}': '第 {number} 张 / {family}',
  'Drawing your card…': '正在抽取你的牌……',
  '1 card drawn': '已抽取 1 张牌',
  '{name} · {orientation}. Reading complete. Start a new reading to draw again.': '{name} · {orientation}。本次抽牌完成，重新开始即可再次抽牌。',
  'Your card has been drawn.': '你的牌已揭晓。',
  'One card, one reading. Choose New reading when you’re ready to begin again.': '每次只抽一张牌。准备好后，点击“重新抽牌”开始新的体验。',
};
function t(source, values = {}) {
  const template = language === 'zh-CN' ? (ZH_UI[source] || source) : source;
  return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? `{${key}}`));
}
function localizeCard(card) {
  if (language !== 'zh-CN') return card;
  const rankIndex = ['Page', 'Knight', 'Queen', 'King'].indexOf(card.rank);
  return {
    ...card,
    ...ZH_CARDS[card.id],
    family: ZH_FAMILIES[card.family],
    rank: rankIndex < 0 ? card.rank : ZH_RANKS[rankIndex + 10],
  };
}

// Marked static copy can be translated without replacing controls or their events.
function translateStaticContent() {
  document.documentElement.lang = language;
  document.title = t('Arcana — a tarot ritual');
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    node.textContent = t(node.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-aria]').forEach((node) => {
    node.setAttribute('aria-label', t(node.getAttribute('data-i18n-aria')));
  });
}
