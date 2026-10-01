// Μέτρηση tokens του prompt της AURA — ΧΩΡΙΣ ΚΟΣΤΟΣ για το μοντέλο (το count_tokens δεν παράγει κείμενο).
//
// ΤΙ ΚΑΝΕΙ: διαβάζει το AURA_CORE_PERSONALITY από το src/App.jsx και ρωτά το API της Anthropic πόσα tokens
// είναι, για το ίδιο μοντέλο που χρησιμοποιεί ο server (api/aura.js:69). Μετά τυπώνει το κόστος μιας
// συνεδρίας 13 γύρων με τα ΜΕΤΡΗΜΕΝΑ tokens.
//
// ΤΙ ΔΕΝ ΚΑΝΕΙ: δεν στέλνει καμία συνομιλία, δεν αποθηκεύει κλειδί, δεν γράφει τίποτα στο δίσκο.
// Το κλειδί διαβάζεται ΜΟΝΟ από τη μεταβλητή περιβάλλοντος ANTHROPIC_API_KEY της δικής σου κονσόλας.
//
// ΧΡΗΣΗ:   node scripts/count_prompt_tokens.js --dry      (μόνο χαρακτήρες, καμία κλήση δικτύου)
//          node scripts/count_prompt_tokens.js            (μέτρηση πραγματικών tokens)
// Raw fetch, όπως ο api/aura.js — το repo δεν έχει SDK της Anthropic ως dependency.
const fs = require('fs');
const path = require('path');

const MODEL = 'claude-sonnet-4-6';          // = api/aura.js, ALLOWED_MODEL
// Τιμές ανά 1.000.000 tokens, από τον πίνακα της τεκμηρίωσης (cached 2026-09-25). ΕΛΕΓΞΕ τες πριν εμπιστευτείς το κόστος.
const PRICE = { input: 3, output: 15, cacheWrite1h: 6, cacheRead: 0.30 };   // write 1h = 2x, read = 0.1x
// ΥΠΟΘΕΣΕΙΣ για ό,τι δεν μετράται εδώ (αλλάξτες): uncached tokens ανά γύρο (ιστορικό ≤20.000 χαρακτήρες + ctx), έξοδος ανά γύρο.
const ASSUME = { uncachedPerTurn: 6000, outPerTurn: 200, turns: 13, closingCalls: 2, closingInTokens: 12000, closingOutTokens: 300 };

const appPath = path.join(__dirname, '..', 'src', 'App.jsx');
const raw = fs.readFileSync(appPath, 'utf8');
const i = raw.indexOf('const AURA_CORE_PERSONALITY');
if (i < 0) { console.error('Δεν βρέθηκε το AURA_CORE_PERSONALITY στο src/App.jsx'); process.exit(1); }
const s = raw.indexOf('`', i) + 1;
const e = raw.indexOf('`;', s);
const PROMPT = raw.slice(s, e);
const greek = (PROMPT.match(/[Ͱ-Ͽἀ-῿]/g) || []).length;
console.log('Χαρακτήρες prompt:', PROMPT.length, '| bytes:', Buffer.byteLength(PROMPT), '| ελληνικά γράμματα:', greek,
  '(' + (greek / PROMPT.length * 100).toFixed(1) + '%)');
if (process.argv.includes('--dry')) { console.log('(--dry: καμία κλήση δικτύου)'); process.exit(0); }

const key = process.env.ANTHROPIC_API_KEY;
if (!key) {
  console.error('\nΔεν βρέθηκε ANTHROPIC_API_KEY στη δική σου κονσόλα. Στα Windows γράψε πρώτα:');
  console.error('   set ANTHROPIC_API_KEY=<το κλειδί σου>');
  console.error('και μετά ξανά: node scripts/count_prompt_tokens.js   (το κλειδί ΔΕΝ το γράφεις πουθενά αλλού)');
  process.exit(2);
}

async function count(system, userText) {
  const res = await fetch('https://api.anthropic.com/v1/messages/count_tokens', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: MODEL, system, messages: [{ role: 'user', content: userText }] }),
  });
  if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + (await res.text()).slice(0, 300));
  return (await res.json()).input_tokens;
}

(async () => {
  // Αφαιρούμε το σταθερό overhead μιας κλήσης (ένα μικρό system + ένα μικρό μήνυμα).
  const base = await count('x', 'ok');
  const full = await count(PROMPT, 'ok');
  const P = full - base + 1;
  console.log('\nΜΕΤΡΗΜΕΝΑ tokens του prompt (μοντέλο ' + MODEL + '):', P);
  console.log('Χαρακτήρες ανά token:', (PROMPT.length / P).toFixed(2));
  const M = 1e6, A = ASSUME;
  const first = (P * PRICE.cacheWrite1h + A.uncachedPerTurn * PRICE.input + A.outPerTurn * PRICE.output) / M;
  const later = (P * PRICE.cacheRead + A.uncachedPerTurn * PRICE.input + A.outPerTurn * PRICE.output) / M;
  const closing = A.closingCalls * (A.closingInTokens * PRICE.input + A.closingOutTokens * PRICE.output) / M;
  const cold = first + (A.turns - 1) * later + closing, warm = A.turns * later + closing;
  console.log('\nΣυνεδρία ' + A.turns + ' γύρων (υποθέσεις: ' + JSON.stringify(A) + '):');
  console.log('  πρώτος γύρος (εγγραφή cache 1h): $' + first.toFixed(3));
  console.log('  κάθε επόμενος γύρος (ανάγνωση cache): $' + later.toFixed(3));
  console.log('  συνεδρία με κρύα cache: $' + cold.toFixed(2) + '   |   με ζεστή cache: $' + warm.toFixed(2));
  const replayOne = first + (4 * A.turns - 1) * later + 4 * closing;
  const replayFour = 4 * first + (4 * A.turns - 4) * later + 4 * closing;
  console.log('\nReplay βαθμονόμησης (4 transcripts, 1 prompt, 1 επανάληψη):');
  console.log('  ένα μετά το άλλο μέσα σε 1 ώρα (1 εγγραφή cache): $' + replayOne.toFixed(2));
  console.log('  4 ξεχωριστές κρύες εκκινήσεις: $' + replayFour.toFixed(2));
})().catch(err => { console.error('Σφάλμα:', err.message); process.exit(1); });
