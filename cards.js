/*
 * Complete 78-card deck: 22 Major Arcana and 14 cards in each of four suits.
 * Meanings are original, brief reflection prompts, not predictions.
 * Each entry stores [name/rank, upright meaning, reversed meaning].
 */
const MAJOR_CARDS = [
  ['The Fool', 'Welcome a fresh start with curiosity and a little trust.', 'Pause before leaping. Check whether freedom has become avoidance.'],
  ['The Magician', 'Bring your tools, attention, and intention together. Begin.', 'Notice scattered effort or promises that lack a practical foundation.'],
  ['The High Priestess', 'Make space for quiet observation and your inner knowing.', 'Outside noise may be drowning out a quieter truth. Listen inward.'],
  ['The Empress', 'Nurture creativity, comfort, and the things you want to grow.', 'Care for your own needs before giving more than you can sustain.'],
  ['The Emperor', 'Create steady boundaries and a structure that supports you.', 'Notice where control is too tight, or where structure is missing.'],
  ['The Hierophant', 'Learn from a trusted tradition, teacher, or shared practice.', 'Question inherited rules and decide which values are truly yours.'],
  ['The Lovers', 'Choose in alignment with your values and practice mutual care.', 'Explore a mismatch between your choices, relationships, and values.'],
  ['The Chariot', 'Gather your focus and move forward with deliberate direction.', 'Pause to recover direction instead of forcing competing impulses.'],
  ['Strength', 'Meet difficulty with patient courage and a gentle, steady hand.', 'Self-doubt may be loud. Replace harshness with compassionate practice.'],
  ['The Hermit', 'Step back from the noise and let reflection illuminate your next step.', 'Notice whether solitude is restoring you or becoming isolation.'],
  ['Wheel of Fortune', 'Life is shifting. Stay responsive to changes and new openings.', 'A repeating cycle invites you to notice what is within your control.'],
  ['Justice', 'Look honestly at the facts, your choices, and their consequences.', 'Check for bias, imbalance, or responsibility that has been avoided.'],
  ['The Hanged Man', 'Allow a pause. A different perspective may change the question.', 'Ask whether waiting is useful reflection or resistance to a decision.'],
  ['Death', 'Let an ending make room for a different chapter. Release what is finished.', 'Clinging to an old chapter may be making change harder than necessary.'],
  ['Temperance', 'Blend patience and moderation. Find a rhythm you can maintain.', 'Look for extremes and make one small adjustment toward balance.'],
  ['The Devil', 'Notice an attachment or habit that is narrowing your choices.', 'Recognize a limiting pattern and reclaim a little of your freedom.'],
  ['The Tower', 'A shaken assumption can reveal what needs a stronger foundation.', 'An avoided change may still need attention. Make room for honest repair.'],
  ['The Star', 'Let hope return through small acts of renewal and openness.', 'Reconnect with something that restores trust when hope feels distant.'],
  ['The Moon', 'Move gently through uncertainty. Distinguish feelings from known facts.', 'Confusion can begin to clear when you name a fear and examine it.'],
  ['The Sun', 'Enjoy clarity, warmth, and the simple pleasure of being present.', 'Let small joys count, even when confidence or energy feels muted.'],
  ['Judgement', 'Reflect on what you have learned and answer a meaningful call to change.', 'Notice self-criticism or hesitation that keeps you from a fresh response.'],
  ['The World', 'Acknowledge completion and integrate what the journey has taught you.', 'Attend to unfinished details before rushing into the next chapter.'],
];

const SUIT_CARDS = {
  Wands: [
    ['Ace', 'Follow a spark of inspiration and give it a first practical step.', 'A creative spark needs space, patience, or a clearer purpose.'],
    ['Two', 'Look beyond the familiar and plan where you want to go.', 'Fear of the unknown may be keeping a plan smaller than it needs to be.'],
    ['Three', 'Let your preparation expand into exploration and collaboration.', 'Review expectations when progress or support takes longer than hoped.'],
    ['Four', 'Celebrate a milestone and the people who help you feel at home.', 'Give attention to belonging or an unsettled shared foundation.'],
    ['Five', 'Different viewpoints can sharpen an idea if everyone has room to speak.', 'Choose which disagreements matter and which you can release.'],
    ['Six', 'Acknowledge progress and accept recognition with gratitude.', 'Reconnect with your own measure of success instead of seeking applause.'],
    ['Seven', 'Stand by what matters while choosing your battles carefully.', 'Protect your energy when defending every position becomes exhausting.'],
    ['Eight', 'Momentum is building. Communicate clearly and stay responsive.', 'Slow down to untangle delays or messages sent too quickly.'],
    ['Nine', 'Draw on resilience while giving your boundaries a little care.', 'Rest before persistence turns into depletion or constant defensiveness.'],
    ['Ten', 'Notice the weight of your responsibilities and share what you can.', 'Set down an unnecessary burden or ask for practical support.'],
    ['Page', 'Explore a new interest with enthusiasm and a beginner’s openness.', 'Give restless enthusiasm one small, achievable direction.'],
    ['Knight', 'Act with courage and bring energy to an idea that excites you.', 'Temper haste so enthusiasm does not outrun consideration.'],
    ['Queen', 'Trust your warmth, creativity, and capacity to encourage others.', 'Reconnect with confidence without comparing yourself to others.'],
    ['King', 'Lead with a clear vision and make space for others to contribute.', 'Notice impatience or a vision that has become too controlling.'],
  ],
  Cups: [
    ['Ace', 'Make room for emotional openness, tenderness, and creative feeling.', 'Offer care inward when feelings are blocked or your reserves are low.'],
    ['Two', 'Build connection through reciprocity, honesty, and shared respect.', 'Name an imbalance and listen for what each person actually needs.'],
    ['Three', 'Enjoy friendship, shared joy, and the support of your community.', 'Consider whether your social circle leaves room for your real self.'],
    ['Four', 'Pause with dissatisfaction and notice an overlooked possibility.', 'Gently re-engage with an opportunity after a period of withdrawal.'],
    ['Five', 'Allow disappointment while remembering what remains available.', 'Make room for acceptance and the possibility of beginning again.'],
    ['Six', 'Let a kind memory reconnect you with simplicity and generosity.', 'Honor the past without asking the present to recreate it.'],
    ['Seven', 'Explore possibilities, then separate a workable choice from a fantasy.', 'Reduce distractions and choose one possibility to examine clearly.'],
    ['Eight', 'Leave behind what no longer nourishes you, with care and intention.', 'Ask whether staying reflects commitment or fear of moving on.'],
    ['Nine', 'Appreciate satisfaction and recognize the wishes already taking shape.', 'Look beneath appearances to what would bring deeper contentment.'],
    ['Ten', 'Nurture belonging through shared values and everyday emotional care.', 'Release the ideal picture and attend to the real needs of your relationships.'],
    ['Page', 'Receive a feeling or creative idea with gentle curiosity.', 'Give sensitive feelings a safe outlet instead of dismissing them.'],
    ['Knight', 'Let heartfelt intention guide a thoughtful gesture or creative pursuit.', 'Balance romantic expectations with consistency and practical care.'],
    ['Queen', 'Listen with empathy while respecting your own emotional boundaries.', 'Notice where absorbing others’ feelings leaves too little room for yours.'],
    ['King', 'Hold strong feelings with steadiness and compassionate perspective.', 'Return to emotional balance before responding from suppression or overwhelm.'],
  ],
  Swords: [
    ['Ace', 'Name a clear truth and use it to guide a considered decision.', 'Clarify assumptions before treating a thought as a certainty.'],
    ['Two', 'Give a difficult choice honest attention rather than avoiding it.', 'Reduce information overload and face the decision one part at a time.'],
    ['Three', 'Acknowledge a painful truth and make space for healing.', 'Let recovery unfold without requiring yourself to be over it already.'],
    ['Four', 'Rest your mind and create a little distance from demands.', 'Notice whether you need deeper rest or a gentle return to activity.'],
    ['Five', 'Consider the cost of winning and whether conflict serves your values.', 'Choose repair or disengagement instead of carrying a conflict forward.'],
    ['Six', 'Move toward calmer ground, taking what you have learned with you.', 'An unresolved concern may need attention before a transition feels complete.'],
    ['Seven', 'Think strategically, and examine where honesty or discretion is needed.', 'Bring an avoided truth into the open and reconsider evasive habits.'],
    ['Eight', 'Question a limiting belief and look for a small available choice.', 'Notice the freedom that becomes possible when an old belief loosens.'],
    ['Nine', 'Name an anxious thought and seek perspective rather than carrying it alone.', 'Offer yourself support as worry eases or asks to be spoken aloud.'],
    ['Ten', 'Recognize a difficult ending and give yourself room to recover.', 'Recovery can begin with small steps, without denying what was difficult.'],
    ['Page', 'Stay curious, ask questions, and verify what you think you know.', 'Slow down scattered thinking or words spoken before understanding.'],
    ['Knight', 'Bring decisive focus to a clear objective.', 'Check whether urgency is pushing you past useful nuance.'],
    ['Queen', 'Communicate honestly with discernment and clear boundaries.', 'Balance sharp judgement with context and compassion.'],
    ['King', 'Apply reason, fairness, and a broad perspective to your decision.', 'Examine rigid thinking or authority used without enough understanding.'],
  ],
  Pentacles: [
    ['Ace', 'Cultivate a practical opportunity with a small, grounded beginning.', 'Review the resources or preparation an opportunity still needs.'],
    ['Two', 'Adjust your priorities to find a workable balance in daily life.', 'Simplify competing demands before they become unsustainable.'],
    ['Three', 'Build something through teamwork, shared learning, and careful craft.', 'Clarify roles and expectations where collaboration feels uneven.'],
    ['Four', 'Create security while noticing what you are holding tightly.', 'Consider what you can release without abandoning useful boundaries.'],
    ['Five', 'Acknowledge a sense of scarcity and look for available support.', 'Let yourself receive help as a difficult period begins to shift.'],
    ['Six', 'Practice generosity with awareness of balance and mutual dignity.', 'Notice unequal exchanges or help that comes with unspoken conditions.'],
    ['Seven', 'Review patient effort and decide what is worth continuing to grow.', 'Reassess whether your effort is supporting the result you actually want.'],
    ['Eight', 'Develop your craft through attention, practice, and steady learning.', 'Refresh your approach when repetition becomes disengagement or perfectionism.'],
    ['Nine', 'Appreciate the independence and comfort your effort has supported.', 'Define enough for yourself instead of measuring worth through possessions.'],
    ['Ten', 'Consider long-term foundations, shared resources, and what you pass on.', 'Revisit inherited expectations about security, family, or success.'],
    ['Page', 'Approach a practical goal with curiosity and a willingness to learn.', 'Turn a vague ambition into one concrete step you can follow through on.'],
    ['Knight', 'Move reliably, with patience and attention to everyday commitments.', 'Adjust a routine that has become stuck, draining, or overly rigid.'],
    ['Queen', 'Create grounded care through comfort, resourcefulness, and attention.', 'Care for your own capacity alongside the practical needs of others.'],
    ['King', 'Use experience and resources to build stable, generous foundations.', 'Review whether control or material achievement is crowding out your values.'],
  ],
};

// Symbols are original typographic card art, not a traditional illustrated deck.
const MAJOR_SYMBOLS = ['○', '∞', '☾', '❀', '▣', '⌘', '♡', '◇', '∞', '✧', '☸', '⚖', '▽', '❦', '◒', '♧', 'ϟ', '☆', '☽', '☼', '♬', '◎'];
const ROMAN_NUMERALS = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];
const SUIT_SYMBOLS = { Wands: '⚒', Cups: '♜', Swords: '†', Pentacles: '✪' };

const TAROT_CARDS = [
  ...MAJOR_CARDS.map(([name, upright, reversed], index) => ({
    id: `major-${index}`,
    name,
    family: 'Major Arcana',
    rank: ROMAN_NUMERALS[index],
    symbol: MAJOR_SYMBOLS[index],
    upright,
    reversed,
  })),
  ...Object.entries(SUIT_CARDS).flatMap(([suit, entries]) => {
    return entries.map(([rank, upright, reversed], index) => ({
      id: `${suit.toLowerCase()}-${index + 1}`,
      name: `${rank} of ${suit}`,
      family: suit,
      rank: index < 10 ? ROMAN_NUMERALS[index + 1] : rank,
      symbol: SUIT_SYMBOLS[suit],
      upright,
      reversed,
    }));
  }),
];
