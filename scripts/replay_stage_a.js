// ⚠ ΔΕΝ ΧΡΗΣΙΜΟΠΟΙΕΙΤΑΙ ΓΙΑ ΑΠΟΦΑΣΕΙΣ (John, 6/10). Στέλνει μόνο το μεγάλο prompt, τον φακό SIMPLIFY και τη σήμανση —
// ΟΧΙ τα context ανά γύρο, το First-WHY, τις αλλαγές φακού ή το κλείσιμο της εφαρμογής — άρα είναι αισιόδοξο. Η δοκιμή που
// μετράει είναι η scripts/e2e_stage_a.cjs --real, πάνω στην ίδια την εφαρμογή.
//
// Δοκιμή του κανόνα «όχι δρόμοι, βήματα, τρόποι» (Στάδιο Α, SPEC_FREE_END.md 3.1.4 σημείο 3) με το ΠΡΑΓΜΑΤΙΚΟ μοντέλο.
// Εγκρίθηκε από τον John (ADR «6 Οκτωβρίου (στ)», σημείο 4): ~6 συνθετικές συνεδρίες, εκτίμηση $4–6 (μάλλον λιγότερο).
//
// ΤΙ ΚΑΝΕΙ: στέλνει 6 ΣΥΝΘΕΤΙΚΕΣ συνεδρίες (κείμενα γραμμένα εδώ, όχι πραγματικοί χρήστες) στο μοντέλο του server
// (api/aura.js), με το μεγάλο prompt στην cache και τη σήμανση [FREE PART: ENDS AT ROOT] στο κομμάτι εκτός cache —
// ακριβώς όπως η εφαρμογή με ανοιχτό διακόπτη. Ελέγχει κάθε απάντηση: χάρτης; λίστα οδηγιών; δομή που δεν έδωσε ο
// χρήστης («δύο δρόμους»); ερώτηση για βήμα/εμπόδιο/ημερομηνία; ειλικρινής αναβολή όταν ζητείται λύση;
// ΤΙ ΔΕΝ ΚΑΝΕΙ: δεν στέλνει τίποτα πραγματικό, δεν αποθηκεύει κλειδί, δεν γράφει στο repo. Τα αποτελέσματα πάνε
// στην οθόνη και σε ένα αρχείο στον προσωρινό φάκελο του υπολογιστή σου (η διαδρομή τυπώνεται στο τέλος).
// ΣΗΜΕΙΩΣΗ: η εφαρμογή στέλνει και άλλες σημειώσεις του κώδικα ανά γύρο· εδώ στέλνεται μόνο η σήμανση, άρα είναι
// προσέγγιση. Οι αυτόματοι έλεγχοι πιάνουν τις χοντρές παραβιάσεις· οι απαντήσεις χρειάζονται και ανάγνωση.
//
// ΧΡΗΣΗ:   node scripts/replay_stage_a.js --dry     (τυπώνει τα σενάρια και το κόστος, ΚΑΜΙΑ κλήση)
//          node scripts/replay_stage_a.js --yes     (τρέχει — ξοδεύει χρήματα· χωρίς --yes δεν τρέχει)
// Το κλειδί διαβάζεται ΜΟΝΟ από τη μεταβλητή ANTHROPIC_API_KEY της δικής σου κονσόλας. Raw fetch, όπως ο api/aura.js.
const fs = require('fs');
const os = require('os');
const path = require('path');

const MODEL = 'claude-sonnet-4-6';          // = api/aura.js
const raw = fs.readFileSync(path.join(__dirname, '..', 'src', 'App.jsx'), 'utf8');
const ci = raw.indexOf('const AURA_CORE_PERSONALITY');
const CORE = raw.slice(raw.indexOf('`', ci) + 1, raw.indexOf('`;', raw.indexOf('`', ci) + 1));
const li = raw.indexOf('const SYSTEM_LENS_SIMPLIFY = AURA_CORE_PERSONALITY + `');
const LENS = raw.slice(raw.indexOf('`', li) + 1, raw.indexOf('`;', raw.indexOf('`', li) + 1));
if (!CORE.includes('STAGE A — FREE PART ENDS AT THE ROOT')) { console.error('Ο κανόνας του Σταδίου Α δεν βρέθηκε στο prompt.'); process.exit(1); }
// Η σήμανση διαβάζεται από το App.jsx (buildStageAMarker), όπως και το μεγάλο prompt — όχι αντίγραφο.
const markerSrc = raw.slice(raw.indexOf('function buildStageAMarker('), raw.indexOf('\n}\n', raw.indexOf('function buildStageAMarker(')) + 2);
const MARKER = new Function(markerSrc + '\nreturn buildStageAMarker;')()(true);
if (!MARKER.includes('[FREE PART: ENDS AT ROOT]')) { console.error('Δεν βρέθηκε η σήμανση του Σταδίου Α στο App.jsx.'); process.exit(1); }
const deferralSrc = raw.slice(raw.indexOf('function detectsRootDeferral('), raw.indexOf('\n}\n', raw.indexOf('function detectsRootDeferral(')) + 2);
const detectsRootDeferral = new Function(deferralSrc + '\nreturn detectsRootDeferral;')();

// ΣΥΝΘΕΤΙΚΑ σενάρια. `ask: true` = ο χρήστης ζητά λύση σε αυτό το μήνυμα (αναμένεται ειλικρινής αναβολή).
const SCENARIOS = [
  { name: '1. Αίτημα λύσης από το πρώτο μήνυμα', turns: [
    { u: 'Πες μου τι να κάνω: να φύγω από τη δουλειά μου ή να μείνω;', ask: true },
    { u: 'Δεν θέλω ερωτήσεις, θέλω να μου πεις τι να κάνω.', ask: true },
    { u: 'Καλά. Με κουράζει ο προϊστάμενος και νιώθω ότι δεν προχωράω.' } ] },
  { name: '2. Επανειλημμένο αίτημα (σαν της Εύβοιας)', turns: [
    { u: 'Θέλω να πάω διακοπές στην Εύβοια αλλά δεν ξέρω πώς να το οργανώσω με τα παιδιά.' },
    { u: 'Πες μου απλά πώς να το κάνω.', ask: true },
    { u: 'Σου ζητάω λύση, όχι ερωτήσεις. Τι να κάνω;', ask: true },
    { u: 'Δώσε μου επιλογές, σε παρακαλώ.', ask: true },
    { u: 'Εντάξει. Νομίζω ότι με αγχώνει ότι θα τα κάνω όλα μόνη μου.' } ] },
  { name: '3. «Ποιο είναι το πρώτο βήμα;»', turns: [
    { u: 'Σκέφτομαι να ανοίξω δικό μου εργαστήριο κεραμικής αλλά φοβάμαι το ρίσκο.' },
    { u: 'Με φοβίζει ότι θα χάσω τις οικονομίες μου.' },
    { u: 'Ποιο είναι το πρώτο βήμα που πρέπει να κάνω;', ask: true } ] },
  { name: '4. Ο χρήστης φέρνει δικό του βήμα', turns: [
    { u: 'Δεν έχω μιλήσει με τον αδερφό μου εδώ και έναν χρόνο μετά τον καβγά για το σπίτι.' },
    { u: 'Σκέφτομαι να του στείλω μήνυμα την Κυριακή.' },
    { u: 'Δεν ξέρω αν είναι καλή ιδέα.' } ] },
  { name: '5. Δύο πράγματα — καθρέφτης, όχι δομή', turns: [
    { u: 'Ή μένω στην Αθήνα με τη δουλειά που έχω, ή γυρίζω στο χωριό να βοηθήσω τους γονείς μου.' },
    { u: 'Και τα δύο έχουν κάτι που με τραβάει και κάτι που με τρομάζει.' },
    { u: 'Τι λες εσύ;', ask: true } ] },
  { name: '6. Κανονική πορεία προς τη ρίζα', turns: [
    { u: 'Τελευταία δεν κοιμάμαι καλά και σκέφτομαι συνέχεια τη σχέση μου.' },
    { u: 'Νομίζω ότι δεν λέω αυτό που θέλω για να μη χαλάσω την ησυχία.' },
    { u: 'Ναι, κάπως έτσι. Φοβάμαι ότι αν μιλήσω θα με αφήσει.' },
    { u: 'Ναι.' } ] },
];

function check(reply, turn) {
  const issues = [];
  if (/ΔΡΟΜΟΣ[^\n]*\n\s*\**\s*ΚΕΡΔΙΖΕΙΣ|ΚΕΡΔΙΖΕΙΣ\s*:|ΚΟΣΤΙΖΕΙ\s*:/.test(reply)) issues.push('ΧΑΡΤΗΣ');
  if ((reply.match(/^\s*(?:[-•*]|\d+[.)])\s+\S/gm) || []).length >= 2) issues.push('ΛΙΣΤΑ (πιθανές οδηγίες)');
  const f = reply.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  if (/δυο δρομ|δρομος α\b|επιλογη α\b|πρωτη επιλογη|δευτερη επιλογη|δυο επιλογες/.test(f)) issues.push('ΔΟΜΗ που δεν έδωσε ο χρήστης');
  if (/πρωτο (?:σου )?βημα|τι σε εμποδιζει|τι θα σε σταματησει|ποτε θα (?:το )?κανεις|ποια μερα/.test(f)) issues.push('ΕΡΩΤΗΣΗ βήματος/εμποδίου/ημερομηνίας');
  if (turn.ask && !detectsRootDeferral(reply)) issues.push('ΧΩΡΙΣ ειλικρινή αναβολή (ζητήθηκε λύση)');
  return issues;
}

const totalTurns = SCENARIOS.reduce((n, s) => n + s.turns.length, 0);
console.log('Σενάρια:', SCENARIOS.length, '| γύροι:', totalTurns, '| μοντέλο:', MODEL);
console.log('Εκτίμηση κόστους: 1 εγγραφή cache (~$0,29) + ' + (totalTurns - 1) + ' αναγνώσεις (~$0,03 η καθεμία) ≈ $' +
  (0.29 + (totalTurns - 1) * 0.03 + totalTurns * 0.01).toFixed(2) + ' (αν τρέξει χωρίς παύσεις πάνω από 5 λεπτά).');
if (process.argv.includes('--dry')) { SCENARIOS.forEach(s => console.log('\n' + s.name + '\n  ' + s.turns.map(t => '«' + t.u + '»').join('\n  '))); process.exit(0); }
if (!process.argv.includes('--yes')) { console.log('\nΔεν έτρεξε τίποτα. Για να τρέξει (και να ξοδέψει): node scripts/replay_stage_a.js --yes'); process.exit(0); }
const key = process.env.ANTHROPIC_API_KEY;
if (!key) { console.error('\nΔεν βρέθηκε ANTHROPIC_API_KEY. Στα Windows: set ANTHROPIC_API_KEY=<το κλειδί σου>  και ξανά η εντολή.'); process.exit(2); }

async function callModel(messages) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: MODEL, max_tokens: 1000,
      system: [{ type: 'text', text: CORE, cache_control: { type: 'ephemeral' } }, { type: 'text', text: LENS + MARKER }],
      messages }),
  });
  if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + (await res.text()).slice(0, 300));
  const data = await res.json();
  return { text: (data.content || []).map(c => c.text || '').join(''), usage: data.usage || {} };
}

(async () => {
  const out = []; let bad = 0, usage = { in: 0, out: 0, cw: 0, cr: 0 };
  for (const sc of SCENARIOS) {
    const msgs = []; console.log('\n══ ' + sc.name);
    for (const t of sc.turns) {
      msgs.push({ role: 'user', content: t.u });
      const r = await callModel(msgs);
      msgs.push({ role: 'assistant', content: r.text });
      usage.in += r.usage.input_tokens || 0; usage.out += r.usage.output_tokens || 0;
      usage.cw += r.usage.cache_creation_input_tokens || 0; usage.cr += r.usage.cache_read_input_tokens || 0;
      const issues = check(r.text, t);
      if (issues.length) bad++;
      console.log((issues.length ? '  ✗ ' : '  ✓ ') + '«' + t.u.slice(0, 50) + '» → ' + (issues.join(', ') || 'εντάξει'));
      console.log('     AURA: ' + r.text.replace(/\s+/g, ' ').slice(0, 220));
      out.push({ scenario: sc.name, user: t.u, aura: r.text, issues });
    }
  }
  const cost = (usage.in * 3 + usage.out * 15 + usage.cw * 3.75 + usage.cr * 0.30) / 1e6;
  console.log('\nΑπαντήσεις με πιθανή παραβίαση: ' + bad + ' από ' + totalTurns + '.  Πραγματικό κόστος (από τα tokens): $' + cost.toFixed(2));
  const file = path.join(os.tmpdir(), 'aura_replay_stage_a.json');
  fs.writeFileSync(file, JSON.stringify(out, null, 2));
  console.log('Όλες οι απαντήσεις, για ανάγνωση: ' + file);
})().catch(err => { console.error('Σφάλμα:', err.message); process.exit(1); });
