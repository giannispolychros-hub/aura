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
assert('CLAUSE: the long one once and the short one five times, nowhere else in the prompt', count(PROMPT, LONG) === 1 && count(PROMPT, SHORT) === 5 && count(PROMPT, 'PRECEDENCE (') === 6);
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
assert('35β: the example is «δωρεάν ιατρεία διακοπής καπνίσματος» only — no techniques, no «στο ΕΣΥ»',
  P.includes('(e.g. "δωρεάν ιατρεία διακοπής καπνίσματος")') && !P.includes('σταδιακή μείωση') && !P.includes('φαρμακευτική υποστήριξη'));
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
for (const head of Object.keys(RULES)) assert(`UNCHANGED otherwise: ${head} is the line before Π3, byte for byte`, h(back(lineOf(head)[0] || '')) === SHA_BEFORE[head]);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
