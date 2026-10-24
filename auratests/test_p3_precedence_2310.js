// Π3 (John, 23/10/2026, branch p3-prompt — a prompt change, not on main): a precedence clause in the six rules that gave facts or named
// organisations before the root — PROACTIVE RESOURCE POINTER (35), ANSWER BEFORE INTERPRETATION (37), CRITICAL CORRECTION (39), EXTERNAL
// CONSTRAINT RECOGNITION (40), PIPELINE PRINCIPLE (41), SOURCE HANDLING (42). Each rule now yields: SAFETY first; then the content limit
// (no facts about law, money or health; no technique for health, mental health, sleep or food; the kind of professional may be named, an
// organisation only if the user wrote its name, a help line only from the app's own table); then, with the Stage A marker, Stage A rule (2).
// The organisation names leave those six lines (ΕΣΥ, ΕΣΠΑ, ΔΥΠΑ, dypa.gov.gr, Gumroad); 35β and 37β are John's examples.
// The model's behaviour is not tested here — only that the text is what was approved (real-model plan: the report of 23/10).
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const raw = fs.readFileSync(path.join(__dirname, '..', 'src', 'App.jsx'), 'utf8');
const ci = raw.indexOf('const AURA_CORE_PERSONALITY'), cs = raw.indexOf('`', ci) + 1, ce = raw.indexOf('`;', cs);
const PROMPT = raw.slice(cs, ce);
let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }
const h = s => crypto.createHash('sha256').update(s || '').digest('hex').slice(0, 16);
const count = (s, sub) => s.split(sub).length - 1;

const LONG = 'PRECEDENCE (this rule yields; nothing is added to it): SAFETY (MASTER PRIORITY RULE, step 1) comes first; then the content limit — no facts about law, money or health, and no technique for health, mental health, sleep or food (what a law, a court, a tax, a loan, a treatment or a dose does is not said; saying plainly that this is a question for a lawyer, an accountant or a doctor IS allowed; an organisation is named only if the user wrote its name; a help line only from the app\'s own table, never another number or name); then, while [FREE PART: ENDS AT ROOT] is present, STAGE A rule (2) below. Where any of these conflicts with this rule, it wins and this rule does not apply. ';
const SHORT = 'PRECEDENCE (as in PROACTIVE RESOURCE POINTER above — this rule yields): SAFETY, then the content limit (no facts about law, money or health; the kind of professional may be named; an organisation only if the user wrote its name; a help line only from the app\'s own table), then, while [FREE PART: ENDS AT ROOT] is present, STAGE A rule (2) below. ';
const RULES = {
  'PROACTIVE RESOURCE POINTER': LONG, 'ANSWER BEFORE INTERPRETATION': SHORT, 'CRITICAL CORRECTION on what counts as answerable': SHORT,
  'EXTERNAL CONSTRAINT RECOGNITION': SHORT, 'PIPELINE PRINCIPLE': SHORT, 'SOURCE HANDLING': SHORT,
};
const lines = PROMPT.split('\n');
const lineOf = head => lines.filter(l => l.startsWith(head + ' ('));

// ── 1. The clause: in each of the six rules, once, right after the rule's own opening parenthesis ────────────────────────
for (const [head, clause] of Object.entries(RULES)) {
  const L = lineOf(head);
  const i = L.length === 1 ? L[0].indexOf('): ') : -1;
  assert(`CLAUSE: ${head} — one line, the clause right after its opening note, once`, L.length === 1 && i > 0 && L[0].slice(i + 3).startsWith(clause) && count(L[0], 'PRECEDENCE (') === 1);
}
// UPDATED (24/10, Π3, tests only): later Π3 commits add a clause of their own, each in its own slot below, and count it there — so each
// commit can be reverted on its own and a clause nobody counted still fails.
let MORE_SHORT = 0, MORE_CLAUSES = 0;
// Π3 (ζ):
// Π3 (η):
// Π3 (γ):
MORE_CLAUSES += 1; // (γ) line 315 — at the end of the line, so not counted as SHORT (which ends in a space)
{ const F = lines.filter(l => l.startsWith('FACT: '));
  assert('(γ) FACT: the short clause right after «answer immediately.», once — the classification yields to the content limit',
    F.length === 1 && F[0] === 'FACT: direct knowledge → answer immediately. ' + SHORT.trimEnd());
  assert('(γ) SCOPE LIMIT ON FACT ANSWERS (321) is unchanged — it only narrows «answer immediately», it grants nothing',
    h(lines.find(l => l.startsWith('SCOPE LIMIT ON FACT ANSWERS (')) || '') === '42713032f7bd93fa'); }
// Π3 (δ):
{ const C = lineOf('CRITICAL CORRECTION on what counts as answerable')[0] || '';
  assert('(δ) CRITICAL CORRECTION (39): no permission for health statistics — «can be stated factually» and «health-related or not» are gone',
    !C.includes('can be stated factually') && !C.includes('health-related or not') && !C.includes('factual/statistical'));
  assert('(δ) CRITICAL CORRECTION (39): the two new sentences, word for word', C.includes('Neither is stated as a fact here (the content limit in PROACTIVE RESOURCE POINTER above), and the latter is genuinely EXTERNAL CONSTRAINT territory below, not this one)') &&
    C.includes('Apply ANSWER BEFORE INTERPRETATION normally to general factual questions that are not about law, money or health;')); }
// Π3 (ε):
// Π3 (στ):
MORE_SHORT += 2; MORE_CLAUSES += 3; // (στ) lines 38 and 613 (inside the line), 353 (at its end)
{ const one = (start, after, clause) => { const L = lines.filter(l => l.startsWith(start)); return L.length === 1 && L[0].split(after + clause).length === 2; };
  assert('(στ) REAL-TIME DATA LIMIT (38): the short clause right after its opening note — «general, stable knowledge» yields to the content limit',
    one('REAL-TIME DATA LIMIT (', 'a practical gap not previously covered): ', SHORT));
  assert('(στ) ANALYSIS WITH POTENTIAL PERSONAL IMPACT (353–360): the short clause on its heading, so the «γενικά τα δεδομένα» branch yields',
    lines.filter(l => l === 'ANALYSIS WITH POTENTIAL PERSONAL IMPACT: ' + SHORT.trimEnd()).length === 1);
  assert('(στ) OPTIONAL RESEARCH OFFER (613): the short clause right after its opening note', one('OPTIONAL RESEARCH OFFER (', "not AURA's internal rules): ", SHORT));
  assert('(στ) NOT changed, on purpose: FACT/ANALYSIS-ONLY CLOSURE (362) and CONDITIONAL LEAN (367) — before the root Stage A (912 (2), (3), (6)) already stops them',
    h(lines.find(l => l.startsWith('FACT/ANALYSIS-ONLY CLOSURE (')) || '') === 'ccd9eb8dda91e756' && h(lines.find(l => l.startsWith('CONDITIONAL LEAN, NOT REFUSAL (')) || '') === 'babb070e2c07cf4c'); }
assert('CLAUSE: the long one once and the short one five times, nowhere else in the prompt — apart from the clauses the later Π3 commits count above',
  count(PROMPT, LONG) === 1 && count(PROMPT, SHORT) === 5 + MORE_SHORT && count(PROMPT, 'PRECEDENCE (') === 6 + MORE_CLAUSES);
assert('CLAUSE: every rule it names is in the prompt — MASTER PRIORITY RULE, the Stage A marker, STAGE A rule (2) — and Stage A is below the six',
  PROMPT.includes('MASTER PRIORITY RULE — sequence for every session') && PROMPT.includes('[FREE PART: ENDS AT ROOT]') &&
  PROMPT.includes('(2) Never propose roads, steps, ways, methods or techniques') &&
  PROMPT.indexOf('STAGE A — FREE PART ENDS AT THE ROOT') > PROMPT.indexOf(lineOf('SOURCE HANDLING')[0] || '\u0000'));

// ── 2. No organisation is named in the six lines, and none is said to be allowed ───────────────────────────────────────
const SIX = Object.keys(RULES).map(k => lineOf(k)[0] || '').join('\n');
for (const name of ['ΕΣΥ', 'ΕΣΠΑ', 'ΔΥΠΑ', 'dypa', 'gov.gr', 'Gumroad'])
  assert(`ORGANISATIONS: «${name}» is not in the six lines`, !SIX.includes(name));
assert('ORGANISATIONS: no capitalised Greek acronym is left in the six lines', !/(^|[^Α-Ωα-ωA-Za-z])[Α-ΩΆΈΉΊΌΎΏ]{2,}(?![Α-Ωα-ω])/.test(SIX));
for (const gone of ['naming the official organization', 'naming the specific OFFICIAL ORGANIZATION', 'name the organization plainly', 'organization names don\'t go stale'])
  assert(`ORGANISATIONS: «${gone}» is gone`, !SIX.includes(gone));
assert('ORGANISATIONS: SOURCE HANDLING names the kind of professional instead', lineOf('SOURCE HANDLING')[0].includes('Name the kind of professional who knows it (e.g. "δικηγόρος", "λογιστής", "γιατρός"); an organisation only if the user wrote its name.') &&
  lineOf('SOURCE HANDLING')[0].includes('name the kind of professional plainly, then return to the user\'s own next step'));
assert('ORGANISATIONS: PIPELINE PRINCIPLE names the kind of professional, not ΕΣΠΑ/ΔΥΠΑ', lineOf('PIPELINE PRINCIPLE')[0].includes('naming the kind of professional who knows this, categorically, is not deciding anything'));

// ── 3. John's two examples ───────────────────────────────────────────────────────────────────────────────────────────────
const P = lineOf('PROACTIVE RESOURCE POINTER')[0], A = lineOf('ANSWER BEFORE INTERPRETATION')[0];
// UPDATED (24/10, Π3 (ε), John): 35β has no example at all now — the smoking-cessation clinics are a health example
assert('35β: no example — no smoking-cessation clinics, no techniques, no «στο ΕΣΥ»',
  P.includes('factually and without personalizing, then return the question') && !P.includes('ιατρεία διακοπής καπνίσματος') &&
  !P.includes('σταδιακή μείωση') && !P.includes('φαρμακευτική υποστήριξη'));
assert('37β: the example is the master\'s question, not the cost of a trip', A.includes('Example: "Πόσο κρατάει συνήθως ένα μεταπτυχιακό;" → answer it.') && !PROMPT.includes('Ιαπωνία'));

// ── 4. Nothing else in the six rules moved: the clause and the edits taken out, each line is the one before Π3 ─────────────
const TEXT_BACK = [
  ['before AURA mentioned that free smoking-cessation clinics exist;', 'before AURA mentioned that free ΕΣΥ smoking-cessation clinics exist;'],
  ["a founder didn't know one-time-payment platforms existed as a category", "a founder didn't know one-time-payment platforms like Gumroad existed as a category"],
  ['(e.g. "δωρεάν ιατρεία διακοπής καπνίσματος")', '(e.g. "σταδιακή μείωση, απότομη διακοπή, υποκατάστατα, ιατρεία διακοπής, φαρμακευτική υποστήριξη" or "δωρεάν ιατρεία διακοπής καπνίσματος στο ΕΣΥ")'],
  ['Example: "Πόσο κρατάει συνήθως ένα μεταπτυχιακό;" → answer it.', 'Example: "Πόσο κοστίζει περίπου ένα ταξίδι στην Ιαπωνία;" → answer it.'],
  ['naming the kind of professional who knows this, categorically, is not deciding anything', 'naming that ΕΣΠΑ and ΔΥΠΑ exist, categorically, is not deciding anything'],
  ['after being told two organisations exist): Name the kind of professional who knows it (e.g. "δικηγόρος", "λογιστής", "γιατρός"); an organisation only if the user wrote its name.',
    'after being told ΕΣΠΑ/ΔΥΠΑ exist): naming the specific OFFICIAL ORGANIZATION (e.g. "ΔΥΠΑ", "δες dypa.gov.gr") is safe and sufficient — organization names don\'t go stale.'],
  ['When a source is asked for or genuinely essential, name the kind of professional plainly,', 'When a source is asked for or genuinely essential, name the organization plainly,']];
const back = l => TEXT_BACK.reduce((x, [now, before]) => (x.includes(now) ? x.replace(now, before) : x), l.replace(LONG, '').replace(SHORT, ''));
// sha256 of each line before Π3 (main ede7ce7)
const SHA_BEFORE = { 'PROACTIVE RESOURCE POINTER': '50d31f82baaa3747', 'ANSWER BEFORE INTERPRETATION': '0fd0d886977cf51d', 'CRITICAL CORRECTION on what counts as answerable': '1169a0362f5da0e2',
  'EXTERNAL CONSTRAINT RECOGNITION': 'eb785604836b1876', 'PIPELINE PRINCIPLE': '364209d0f349a676', 'SOURCE HANDLING': '9e815860c2ffb495' };
// UPDATED (24/10, Π3, tests only): a later Π3 commit that edits one of the six lines puts its own pair in its slot (unshift: the newest
// edit is taken back first).
// Π3 (η) back:
// Π3 (δ) back:
TEXT_BACK.unshift(['Neither is stated as a fact here (the content limit in PROACTIVE RESOURCE POINTER above), and the latter is genuinely EXTERNAL CONSTRAINT territory below, not this one)', 'The former can be stated factually and accurately, with the same care Claude already applies to health topics generally — the latter cannot, and that is genuinely EXTERNAL CONSTRAINT territory below, not this one)']); // (δ) line 39
TEXT_BACK.unshift(['Apply ANSWER BEFORE INTERPRETATION normally to general factual questions that are not about law, money or health;', 'Apply ANSWER BEFORE INTERPRETATION normally to general factual/statistical questions, health-related or not;']); // (δ) line 39
// Π3 (ε) back:
TEXT_BACK.unshift(['factually and without personalizing, then return the question', 'factually and without personalizing (e.g. "δωρεάν ιατρεία διακοπής καπνίσματος"), then return the question']); // (ε) line 35
for (const head of Object.keys(RULES)) assert(`UNCHANGED otherwise: ${head} is the line before Π3, byte for byte`, h(back(lineOf(head)[0] || '')) === SHA_BEFORE[head]);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
