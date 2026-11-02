// AURA — THOUGHT MAP, phase 1: pickBranches (John, 2/11/2026; ADR «2 Νοεμβρίου»). «Τα λόγια σου στη διαδρομή»: up to 4 phrases the
// user typed on the way to the root, picked by code from `messages` — verbatim, never paraphrased, never from the model. Phase 1 only:
// NOTHING in the app calls pickBranches yet (the screen is phase 2, after John's approval of 10 examples).
//  (Α) AURA's last sentence is a question — and only then   (Β) the user's phrase: exact, first sentence of ≥ 4 words, ≤ 200 chars
//  (Γ) what is left out (safety first, dismissals, the entrance, the root, «Τι ήξερες»)   (Δ) repeats (Jaccard ≥ 0.6)
//  (Ε) how many: 0 / 2–3 / the first, the middle and the last   (ΣΤ) never throws, never changes its input, never null
// CHANGED (John, 2/11, after his review of phase 1): at most 3 (was 4); a «δεν ξέρω / τίποτα / άστο…» start leaves a phrase out only
// when no word with content follows (αν, εάν, γιατί, τι, πώς, ποιος/ποια/ποιο, πότε, πού, ή, αλλά, ότι).
//  (Ζ) phase 1 touched nothing else: not called, no storage / log / network inside, prompt and api unchanged, the rest of the file
//      byte-identical to main 24aab8e
// All text here is synthetic; no words of any real session.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const raw = fs.readFileSync(path.join(ROOT, 'src', 'App.jsx'), 'utf8');
let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }
const sha = s => crypto.createHash('sha256').update(s || '').digest('hex');
const fnSrc = n => { const a = raw.indexOf('\nfunction ' + n + '('); return a < 0 ? '' : raw.slice(a + 1, raw.indexOf('\n}', a + 1) + 2); };
const constSrc = n => { const a = raw.indexOf('\nconst ' + n + ' = '); if (a < 0) return ''; const eol = raw.indexOf('\n', a + 1);
  const line = raw.slice(a + 1, eol); if (/;\s*(?:\/\/.*)?$/.test(line)) return line; return raw.slice(a + 1, raw.indexOf('\n];', a) + 3); };
const CONSTS = ['HELPLINES', 'KNEW_MIN_SUBSTANCE_WORDS', 'ROOT_DISMISSALS', 'BRANCH_MAX', 'BRANCH_MAX_CHARS', 'BRANCH_JACCARD', 'BRANCH_ABBREVIATIONS',
  'BRANCH_DISMISS_START', 'BRANCH_HEAVY_WORDS', 'BRANCH_CONTENT_WORDS'];
const FNS = ['lookBehind', 'detectSafetySignal', 'classifyCrisisTier', 'detectsDangerFromOther', 'detectsMentalHealthReferral', 'mergeRiskKind',
  'stageASafetyHold', 'rootAnswerIsDismissal', 'rootAnswerIsUnsure', 'isExplicitClosure', 'declaresClosing', 'matchesClosingWord',
  'substanceOfSentence', 'splitSentences', 'pickKnewSnippet', 'branchSentenceSpans', 'branchAuraEndsWithQuestion', 'branchWords',
  'branchJaccard', 'branchSessionSafe', 'pickBranches']; // UPDATED (2/11, phase 2): the session's safety check moved, unchanged, into branchSessionSafe
let F = {};
try {
  F = new Function([...CONSTS.map(n => constSrc(n) || `const ${n} = undefined;`),
    ...FNS.map(n => fnSrc(n) || `function ${n}(){ throw new Error('missing ${n}'); }`),
    'return { ' + FNS.join(', ') + ', BRANCH_MAX, BRANCH_MAX_CHARS, BRANCH_JACCARD };'].join('\n'))();
} catch (e) { console.log('LOAD ERROR — ' + e.message); }
const call = (n, ...a) => { try { return F[n](...a); } catch (e) { return 'threw: ' + e.message; } };

// conversation builders: the first user message is the entrance, the last is the root's own message
const U = t => ({ role: 'user', content: t });
const A = t => ({ role: 'assistant', msgMode: 'ANSWER', content: t });
const ASK = { role: 'assistant', msgMode: 'STAGE_A', content: 'Πες το με μία φράση: τι είναι αυτό που πραγματικά σε απασχολεί;' };
const ENTRY = 'Δεν ξέρω τι να κάνω με τη δουλειά μου, νιώθω κολλημένη εδώ και μήνες.';
const ROOT_T = 'Φοβάμαι να αφήσω τη σιγουριά.';
const conv = (...middle) => [U(ENTRY), ...middle, ASK, U(ROOT_T)];
const pick = (msgs, found = ROOT_T, knew = null, risk = null, tr = null) => call('pickBranches', msgs, found, knew, risk, tr);
const texts = r => Array.isArray(r) ? r.map(x => x.text) : r;
const P1 = 'Ο μισθός είναι καλός και φοβάμαι την αλλαγή.';
const P2 = 'Θα έχανα τη σιγουριά που μου δίνει ο σταθερός μισθός.';
const P3 = 'Η μητέρα μου πιστεύει ότι πρέπει να μείνω εκεί για πάντα.';
const P4 = 'Κάθε πρωί σηκώνομαι με βάρος στο στομάχι για το γραφείο.';
const P5 = 'Ονειρευόμουν να ανοίξω ένα μικρό εργαστήρι κεραμικής στο χωριό.';
const P6 = 'Ο προϊστάμενος δεν αναγνωρίζει ποτέ τη δουλειά που κάνω.';

assert('(load) all functions and constants load from src/App.jsx', FNS.every(n => typeof F[n] === 'function') && F.BRANCH_MAX === 3 && F.BRANCH_MAX_CHARS === 200 && F.BRANCH_JACCARD === 0.6);

// ── (Α) AURA's LAST sentence is a question ─────────────────────────────────────────────────────────────────────────────────────
const Q = t => call('branchAuraEndsWithQuestion', t);
assert('(Α) a question with the Greek «;» (U+003B) and with U+037E, and with «?»', Q('Τι σε απασχολεί;') === true && Q('Τι σε απασχολεί;') === true && Q('What do you want?') === true);
assert('(Α) a statement and then a question: the last sentence is the question → yes', Q('Κατάλαβα. Τι θα έχανες αν έφευγες;') === true);
assert('(Α) several questions, the last one a question → yes', Q('Τι θέλεις; Και τι φοβάσαι;') === true);
assert('(Α) a question followed by an explanation → no', Q('Τι θέλεις; Ρωτάω γιατί είπες κάτι σημαντικό.') === false);
assert('(Α) a question in the middle, not the last sentence → no', Q('Τι θέλεις; Πες μου ό,τι σκέφτεσαι.') === false);
assert('(Α) a question with no question mark → no', Q('Πες μου τι σε απασχολεί') === false && Q('Τι σε απασχολεί') === false && Q('Πες μου τι σε απασχολεί.') === false);
assert('(Α) uncertain end → no: a quote after the mark, «?!», «;!»', Q('Είπες «γιατί εγώ;»') === false && Q('Τι λες?!') === false && Q('Τι λες;!') === false && Q('(τι λες;)') === false);
assert('(Α) uncertain cut in the message → no («π.χ.», «δηλ.», a lone letter)', Q('Π.χ. τι θα έκανες;') === false && Q('Δηλ. τι εννοείς;') === false && Q('Το σχέδιο Α. Ποιο προτιμάς;') === false);
assert('(Α) «!?» at the end is uncertain → no', Q('Τι λες!?') === false);
assert('(Α) spaces and a line break after the mark do not matter', Q('Τι θέλεις;  \n') === true);
assert('(Α) nothing, a mark alone, not a string → no', Q('') === false && Q(';') === false && Q('  ?') === false && Q(null) === false && Q(42) === false);

// ── (Β) the user's phrase ───────────────────────────────────────────────────────────────────────────────────────────────────────────
const S = t => call('branchSentenceSpans', t);
{
  const t = 'Πρώτα αυτό. Μετά… ίσως να φύγω! Και 3.5 χρόνια εκεί;\nΤέλος';
  const r = S(t);
  const parts = r.spans.map(([a, b]) => t.slice(a, b));
  assert('(Β) sentences as exact pieces of the text, end mark kept; «…» and «3.5» are not boundaries; a line break is',
    !r.uncertain && JSON.stringify(parts) === JSON.stringify(['Πρώτα αυτό.', 'Μετά… ίσως να φύγω!', 'Και 3.5 χρόνια εκεί;', 'Τέλος']));
  assert('(Β) «...» is not a boundary', JSON.stringify(S('Δεν ξέρω... ίσως να φύγω.').spans.length) === '1');
  assert('(Β) an abbreviation, a lone letter or a bare number before a dot → the cut is uncertain',
    S('Θέλω π.χ. να φύγω.').uncertain === true && S('Είπε κ.λπ. και έφυγε.').uncertain === true && S('1. Θέλω να φύγω.').uncertain === true &&
    S('Είμαι 35. Δουλεύω εκεί.').uncertain === false);
}
{
  const r = pick(conv(A('Τι σε κρατάει εκεί;'), U('Ο μισθός είναι καλός και φοβάμαι την αλλαγή. Αλλά βαριέμαι πολύ.'),
    A('Τι θα έχανες αν έφευγες;'), U('Θα έχανα τη σιγουριά που μου δίνει ο σταθερός μισθός.')));
  assert('(Β) the FIRST sentence with ≥ 4 words, whole, end mark kept — not the rest of the message', JSON.stringify(texts(r)) === JSON.stringify([P1, P2]));
  const m = conv(A('Τι σε κρατάει εκεί;'), U('Ναι. Ο μισθός είναι καλός και φοβάμαι την αλλαγή.'), A('Τι θα έχανες;'), U(P2));
  assert('(Β) a first sentence with fewer than 4 words is skipped, the next one is taken', JSON.stringify(texts(pick(m))) === JSON.stringify([P1, P2]));
  const m1 = conv(A('Τι σε κρατάει εκεί;'), U('Ο μισθός είναι καλός και φοβάμαι την αλλαγή. Αλλά βαριέμαι πολύ.'), A('Τι θα έχανες αν έφευγες;'), U('Θα έχανα τη σιγουριά που μου δίνει ο σταθερός μισθός.'));
  const exact = (msgs, out) => out.length > 0 && out.every(b => msgs[b.msg].role === 'user' && msgs[b.msg].content.slice(b.start, b.end) === b.text && msgs[b.msg].content.includes(b.text));
  assert('(Β) fidelity: every phrase === messages[msg].content.slice(start, end), a user message, as typed', exact(m1, pick(m1)) && exact(m, pick(m)));
  const spaced = 'Ο μισθός   είναι καλός, και — φοβάμαι   την αλλαγή!';
  const r2 = pick(conv(A('Τι σε κρατάει;'), U(spaced), A('Και τι θα έχανες;'), U(P2)));
  assert('(Β) nothing inside the phrase is changed (double spaces, dash, «!» stay as typed)', texts(r2)[0] === spaced);
  const long = 'Η κατάσταση στη δουλειά ' + 'είναι πολύ δύσκολη και κουραστική '.repeat(6) + 'για μένα.';
  assert('(Β) a first sentence over 200 characters is never cut — the message is left out', long.length > 200 &&
    texts(pick(conv(A('Τι συμβαίνει;'), U(long + ' Αυτό.'), A('Και μετά;'), U(P2), A('Τι άλλο;'), U(P3)))).join('|') === [P2, P3].join('|'));
  assert('(Β) an uncertain cut in the user\'s message → the message is left out (no phrase that starts or ends at a doubtful dot)',
    texts(pick(conv(A('Τι σε κρατάει;'), U('Θέλω π.χ. να φύγω από τη δουλειά αυτή τη χρονιά.'), A('Και τι θα έχανες;'), U(P2), A('Τι άλλο;'), U(P3)))).join('|') === [P2, P3].join('|'));
  // 2 and 3 words with substance: a looser rule (2 or 3 words) would keep two of them — the rule of 4 keeps none
  assert('(Β) sentences shorter than 4 words are never picked', pick(conv(A('Τι σε κρατάει;'), U('Η ασφάλεια, ίσως.'), A('Και τι άλλο;'), U('Ο μισθός μετράει αρκετά.'), A('Κάτι άλλο;'), U('Η οικογένεια πιέζει σήμερα.'))).length === 0);
}

// ── (Γ) left out ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
{
  assert('(Γ) a message with no AURA message right before it (two user messages in a row) → not picked',
    texts(pick(conv(A('Τι σε κρατάει;'), U(P1), U(P4), A('Τι θα έχανες;'), U(P2)))).join('|') === [P1, P2].join('|'));
  assert('(Γ) an AURA statement before it (no question) → not picked', texts(pick(conv(A('Κατάλαβα.'), U(P1), A('Τι θα έχανες;'), U(P2), A('Και η οικογένεια;'), U(P3)))).join('|') === [P2, P3].join('|'));
  assert('(Γ) the app\'s own question (STAGE_A) is not a question of AURA', texts(pick([U(ENTRY), ASK, U(P1), A('Τι θα έχανες;'), U(P2), A('Και η οικογένεια;'), U(P3), ASK, U(ROOT_T)])).join('|') === [P2, P3].join('|'));
  const r = pick([U(P1), A('Τι θα έχανες;'), U(P2), A('Και η οικογένεια;'), U(P3), A('Και κάθε πρωί;'), U(P4)], P4);
  assert('(Γ) the first message (the entrance) and the last (the root\'s own message) are never picked', JSON.stringify(texts(r)) === JSON.stringify([P2, P3]));
  // AURA spoke first and the root was corrected («Διόρθωσε»), so neither the first nor the last message is out for any other reason
  const iso = pick([A('Τι σε φέρνει εδώ;'), U(P1), A('Τι θα έχανες;'), U(P2), A('Και η οικογένεια;'), U(P3), A('Τι σε απασχολεί;'), U(P5)], 'Κάτι εντελώς άλλο που διόρθωσα μετά.');
  assert('(Γ) the first and the last user message are out by position alone (AURA spoke first; a corrected root)', JSON.stringify(texts(iso)) === JSON.stringify([P2, P3]));
  assert('(Γ) a closing message with ≥ 4 words («Αρκετά για σήμερα, κλείνουμε εδώ.») → not picked',
    texts(pick(conv(A('Τι σε κρατάει;'), U('Αρκετά για σήμερα, κλείνουμε εδώ.'), A('Τι θα έχανες;'), U(P2), A('Και η οικογένεια;'), U(P3)))).join('|') === [P2, P3].join('|'));
  // CHANGED (John, 2/11): John's own examples — these two are TAKEN …
  const KEEP1 = 'Δεν ξέρω αν θέλω να μείνω στη δουλειά.', KEEP2 = 'Δεν ξέρω αν φοβάμαι περισσότερο την αποτυχία ή την αλλαγή.';
  assert('(Γ) John\'s examples that must pass: «Δεν ξέρω αν θέλω να μείνω στη δουλειά.», «Δεν ξέρω αν φοβάμαι περισσότερο την αποτυχία ή την αλλαγή.»',
    texts(pick(conv(A('Τι σε κρατάει;'), U(KEEP1), A('Και τι φοβάσαι;'), U(KEEP2)))).join('|') === [KEEP1, KEEP2].join('|'));
  // … and these four are left out
  assert('(Γ) John\'s examples that must be left out: «Δεν ξέρω.», «Δεν ξέρω, άστο.», «Δεν ξέρω, δεν έχω καμία ιδέα.», «Δεν είμαι σίγουρη.»',
    texts(pick(conv(A('α;'), U('Δεν ξέρω.'), A('β;'), U('Δεν ξέρω, άστο.'), A('γ;'), U('Δεν ξέρω, δεν έχω καμία ιδέα.'), A('δ;'), U('Δεν είμαι σίγουρη.'), A('Τι θα έχανες;'), U(P2), A('Και η οικογένεια;'), U(P3)))).join('|') === [P2, P3].join('|'));
  // the new rule on its own: ≥ 4 words with substance, a «δεν ξέρω / δεν είμαι σίγουρη / τίποτα» start and no word of content after it
  assert('(Γ) a «δεν ξέρω / δεν είμαι σίγουρη / τίποτα» start with ≥ 4 words but nothing of content after it → left out',
    texts(pick(conv(A('α;'), U('Δεν ξέρω, ειλικρινά δεν έχω καμία απολύτως ιδέα πια.'), A('β;'), U('Δεν είμαι σίγουρη, έχω μπερδευτεί τελείως σήμερα.'), A('γ;'), U('Τίποτα, απλώς είμαι πολύ κουρασμένη σήμερα.'), A('Τι θα έχανες;'), U(P2), A('Και η οικογένεια;'), U(P3)))).join('|') === [P2, P3].join('|'));
  assert('(Γ) each word of content after such a start lets the phrase in (αν, εάν, γιατί, τι, πώς, ποιος, ποια, ποιο, πότε, πού, ή, αλλά, ότι)',
    ['αν', 'εάν', 'γιατί', 'τι', 'πώς', 'ποιος', 'ποια', 'ποιο', 'πότε', 'πού', 'ή', 'αλλά', 'ότι'].every(w => {
      const y = 'Δεν ξέρω ' + w + ' δουλειά αυτή θα κρατήσει πολύ ακόμα.';
      return texts(pick(conv(A('Τι σε κρατάει;'), U(y), A('Και τι φοβάσαι;'), U(P2)))).join('|') === [y, P2].join('|'); }) &&
    texts(pick(conv(A('Τι σε κρατάει;'), U('Δεν ξέρω, δουλειά αυτή θα κρατήσει πολύ ακόμα.'), A('Και τι φοβάσαι;'), U(P2)))).length === 0);
  assert('(Γ) the app\'s own «δεν ξέρω» check still leaves out what it did («Ειλικρινά δεν ξέρω τι να πω.»)',
    texts(pick(conv(A('α;'), U('Ειλικρινά δεν ξέρω τι να πω.'), A('Τι θα έχανες;'), U(P2), A('Και η οικογένεια;'), U(P3)))).join('|') === [P2, P3].join('|'));
  assert('(Γ) a phrase that is the root or inside it → not picked', texts(pick(conv(A('Τι σε κρατάει;'), U(P1), A('Τι θα έχανες;'), U(P2), A('Και η οικογένεια;'), U(P3)), P2 + ' Και ' + P3)).join('|') === '');
  assert('(Γ) a phrase that is «Τι ήξερες» or inside it → not picked', texts(pick(conv(A('Τι σε κρατάει;'), U(P1), A('Τι θα έχανες;'), U(P2), A('Και η οικογένεια;'), U(P3)), ROOT_T, P1)).join('|') === [P2, P3].join('|'));
  assert('(Γ) dismissals and «I don\'t know» → not picked («τίποτα, άστο», «Δεν ξέρω.», «άστο, δεν αντέχω»)',
    texts(pick(conv(A('Τι σε κρατάει;'), U('τίποτα, άστο'), A('Και;'), U('Δεν ξέρω.'), A('Και τότε;'), U('άστο, δεν αντέχω'), A('Τι θα έχανες;'), U(P2), A('Και η οικογένεια;'), U(P3)))).join('|') === [P2, P3].join('|'));
  // CHANGED (John, 2/11): «Άστο, … τι …» has a word of content after the start, so it is taken now; «δεν αντέχω» still leaves a message out
  assert('(Γ) a message with «δεν αντέχω» is left out even with ≥ 4 words; «Άστο, δεν έχει σημασία τι θέλω…» (a word of content) is taken',
    texts(pick(conv(A('Τι σε κρατάει;'), U('Άστο, δεν έχει σημασία τι θέλω εγώ στη ζωή μου.'), A('Και;'), U('Η δουλειά είναι καλή, αλλά δεν αντέχω τον προϊστάμενο πια.'), A('Τι θα έχανες;'), U(P2), A('Και η οικογένεια;'), U(P3)))).join('|') === ['Άστο, δεν έχει σημασία τι θέλω εγώ στη ζωή μου.', P2, P3].join('|'));
  assert('(Γ) a closing message («Ευχαριστώ, κλείνουμε εδώ.») → not picked', texts(pick(conv(A('Τι σε κρατάει;'), U('Ευχαριστώ, κλείνουμε εδώ.'), A('Τι θα έχανες;'), U(P2), A('Και η οικογένεια;'), U(P3)))).join('|') === [P2, P3].join('|'));
  // safety first: the whole session gives nothing
  const crisisMid = conv(A('Τι σε κρατάει;'), U(P1), A('Πώς νιώθεις τελευταία;'), U('Δεν θέλω να ζω άλλο.'), A('Τι θα έχανες;'), U(P2), A('Και η οικογένεια;'), U(P3));
  assert('(Γ) SAFETY: a crisis message anywhere in between → nothing at all for the session (the step is not shown either)', JSON.stringify(pick(crisisMid)) === '[]');
  const dangerSecond = conv(A('Τι σε κρατάει;'), U('Η δουλειά με κουράζει πολύ τελευταία. Ο σύντροφός μου με χτυπάει όταν πίνει.'), A('Τι θα έχανες;'), U(P2), A('Και η οικογένεια;'), U(P3));
  assert('(Γ) SAFETY: danger in the SECOND sentence of a message whose first looks harmless → nothing at all', JSON.stringify(pick(dangerSecond)) === '[]');
  const crisisSecond = conv(A('Τι σε κρατάει;'), U('Η δουλειά με κουράζει πολύ τελευταία. Σκέφτομαι να βάλω τέλος στη ζωή μου.'), A('Τι θα έχανες;'), U(P2), A('Και η οικογένεια;'), U(P3));
  assert('(Γ) SAFETY: a crisis in the second sentence → nothing at all', JSON.stringify(pick(crisisSecond)) === '[]');
  assert('(Γ) SAFETY: the messages used above ARE caught by the app\'s unchanged detectors (crisis, danger in a second sentence)',
    call('detectSafetySignal', 'Δεν θέλω να ζω άλλο.') === 'CRISIS' && !!call('detectsDangerFromOther', dangerSecond[2].content) && call('detectSafetySignal', crisisSecond[2].content) === 'CRISIS');
  const ok = conv(A('Τι σε κρατάει;'), U(P1), A('Τι θα έχανες;'), U(P2), A('Και η οικογένεια;'), U(P3));
  assert('(Γ) SAFETY: the app\'s latch passed in — crisis A, crisis B, DISTRESS, danger from another, safety mode → nothing; none → the phrases',
    [{ riskKind: 1 }, { riskKind: 2 }, { riskKind: 3 }, { dangerFromOther: true }, { safetyMode: true }].every(rk => JSON.stringify(pick(ok, ROOT_T, null, rk)) === '[]') &&
    pick(ok, ROOT_T, null, { riskKind: 0, dangerFromOther: false, safetyMode: false }).length === 3);
  assert('(Γ) SAFETY: AURA\'s own referral, a help-line number in an AURA message, a supportive reply → nothing',
    JSON.stringify(pick(conv(A('Ίσως ένας ψυχολόγος θα βοηθούσε. Τι σε κρατάει;'), U(P1), A('Τι θα έχανες;'), U(P2)))) === '[]' &&
    JSON.stringify(pick(conv(A('Υπάρχει η γραμμή 10306. Τι σε κρατάει;'), U(P1), A('Τι θα έχανες;'), U(P2)))) === '[]' &&
    JSON.stringify(pick(conv({ role: 'assistant', msgMode: 'SUPPORTIVE', content: 'Είμαι εδώ. Τι σε κρατάει;' }, U(P1), A('Τι θα έχανες;'), U(P2)))) === '[]');
  const all = [ok, crisisMid, dangerSecond, crisisSecond].map(m => pick(m)).flat();
  assert('(Γ) SAFETY: no phrase ever picked trips detectSafetySignal or detectsDangerFromOther', all.every(b => !call('detectSafetySignal', b.text) && !call('detectsDangerFromOther', b.text)));
}

// ── (Δ) repeats ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
{
  const J = (a, b) => call('branchJaccard', a, b);
  assert('(Δ) Jaccard: the same words → 1; none shared → 0; case, punctuation and spaces do not count', J('Είμαι κουρασμένη.', 'είμαι  κουρασμένη!') === 1 && J('Ένα δύο', 'τρία τέσσερα') === 0 && J('', 'κάτι') === 0);
  assert('(Δ) Jaccard is computed on unique words (shared / all)', Math.abs(J('α β γ δ', 'α β γ ε') - 3 / 5) < 1e-9);
  const near = 'Ο μισθός είναι καλός και φοβάμαι πολύ την αλλαγή.';
  const r = pick(conv(A('Τι σε κρατάει;'), U(P1), A('Και πάλι, τι σε κρατάει;'), U(near), A('Τι θα έχανες;'), U(P2)));
  assert('(Δ) two very similar phrases (≥ 0.6) → only the first in time stays', J(P1, near) >= 0.6 && JSON.stringify(texts(r)) === JSON.stringify([P1, P2]));
  const out = pick(conv(A('Τι σε κρατάει;'), U(P1), A('α;'), U(near), A('β;'), U(P2), A('γ;'), U(P3), A('δ;'), U(P4)));
  assert('(Δ) in every result, no two phrases are ≥ 0.6 alike', out.every((x, i) => out.every((y, j) => j <= i || J(x.text, y.text) < 0.6)));
}

// ── (Ε) how many ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
{
  const mk = n => conv(...[P1, P2, P3, P4, P5, P6].slice(0, n).flatMap((p, i) => [A('Ερώτηση ' + (i + 1) + ';'), U(p)]));
  assert('(Ε) 0 or 1 fitting phrase → nothing (never a lone branch)', pick(mk(0)).length === 0 && pick(mk(1)).length === 0);
  // CHANGED (John, 2/11): at most 3 — the first, the middle (position round((n − 1) / 2)) and the last
  assert('(Ε) 2, 3 → all of them, in time order', [2, 3].every(n => JSON.stringify(texts(pick(mk(n)))) === JSON.stringify([P1, P2, P3, P4, P5, P6].slice(0, n))));
  assert('(Ε) 4 → the first, the middle, the last: 1st, 3rd, 4th', JSON.stringify(texts(pick(mk(4)))) === JSON.stringify([P1, P3, P4]));
  assert('(Ε) 5 → 1st, 3rd, 5th', JSON.stringify(texts(pick(mk(5)))) === JSON.stringify([P1, P3, P5]));
  assert('(Ε) 6 → 1st, 4th, 6th — never the last three', JSON.stringify(texts(pick(mk(6)))) === JSON.stringify([P1, P4, P6]));
  assert('(Ε) the same input gives the same output (deterministic)', JSON.stringify(pick(mk(6))) === JSON.stringify(pick(mk(6))));
  const tr = {};
  pick(conv(A('Τι σε κρατάει;'), U('Ο μισθός.'), A('Κατάλαβα.'), U(P1), A('Τι θα έχανες;'), U(P2), A('Και η οικογένεια;'), U(P3)), ROOT_T, null, null, tr);
  assert('(Ε) the measurement trace counts each reason a candidate was left out', tr.no_sentence_4_words === 1 && tr.aura_last_sentence_not_question === 1);
}

// ── (ΣΤ) robustness ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
{
  const junk = [undefined, null, 42, 'κείμενο', {}, [], [null], [{}], [{ role: 'user' }], [{ role: 'user', content: 5 }, { role: 'assistant' }, { role: 'user', content: 'x' }]];
  assert('(ΣΤ) any input → an array, never null, never throws (an empty result means: no branches section)', junk.every(j => Array.isArray(call('pickBranches', j, null, null, null)) && call('pickBranches', j).length === 0));
  const m = conv(A('Τι σε κρατάει;'), U(P1), A('Τι θα έχανες;'), U(P2));
  const before = JSON.stringify(m);
  pick(m);
  assert('(ΣΤ) the messages are never changed', JSON.stringify(m) === before);
  assert('(ΣΤ) each result carries only the phrase and where it is (text, msg, start, end)', pick(m).every(b => JSON.stringify(Object.keys(b)) === '["text","msg","start","end"]'));
}

// ── (Ζ) phase 1 changed nothing else ────────────────────────────────────────────────────────────────────────────────────────────────
{
  const block = (() => { const a = raw.indexOf('// THOUGHT MAP, phase 1'); const b = raw.indexOf("// A root typed into the flow (door 1's answer"); return a < 0 || b < a ? '' : raw.slice(a, b); })();
  // UPDATED (2/11, phase 2): the block now also holds the screen's view (thoughtMapView), the one caller of pickBranches
  assert('(Ζ) pickBranches and its helpers are defined once, inside the block, and used nowhere else in the app (thoughtMapView, inside it, is the one caller)',
    (block.match(/\nfunction pickBranches\(/g) || []).length === 1 && !/pickBranches|branchSentenceSpans|branchAuraEndsWithQuestion|branchJaccard|branchWords|BRANCH_/.test(raw.replace(block, '')));
  // UPDATED (John, 2/11/2026, branchCount): the block's comments now NAME the app's telemetry function (thoughtMapRecFields builds the
  // map's one field, which the component — outside the block — passes to it); the check reads the CODE only, and the code calls nothing
  const blockCode = block.replace(/\/\/[^\n]*/g, '');
  assert('(Ζ) no storage, log, network or telemetry inside the new functions', !!block && blockCode.length > 1000 && /function thoughtMapRecFields\(/.test(blockCode) &&
    !/localStorage|sessionStorage|indexedDB|console\.|fetch\(|recordTelemetry|XMLHttpRequest|sendBeacon|navigator\./.test(blockCode));
  // UPDATED (2/11, phase 2, ADR «2 Νοεμβρίου (β)»): the screen added a few pieces outside the block (the screen itself, one number,
  // the view on render); without them — and without the block — the file is still byte-identical to main
  const stripThoughtMap = t => {
    const cut = (s, a, b) => { const i = s.indexOf(a); const j = i < 0 ? -1 : s.indexOf(b, i); return i < 0 || j < 0 ? s : s.slice(0, i) + s.slice(j); };
    let s = cut(t, '// THOUGHT MAP, phase 1', "// A root typed into the flow (door 1's answer");
    s = cut(s, '              {/* THOUGHT MAP (John, 2/11/2026', '              {/* ADR «17 Οκτωβρίου (δ)», (ε): not while');
    for (const line of ['  // THOUGHT MAP (John, 2/11/2026, ADR «2 Νοεμβρίου (β)»): how many messages there were when the root card opened — a number only, page\n' +
        '  // memory only; the screen reads `messages` up to it. Never stored, sent or logged.\n  const rootCardMsgCount = useRef(0);\n',
      '    if (stageARef.current.phase === "card") rootCardMsgCount.current = (msgsNow || []).length; // Thought Map (2/11): a number only\n',
      '    rootCardMsgCount.current = 0; // Thought Map (2/11)\n',
      // UPDATED (John, 2/11/2026, branchCount): the map's one record — the latch, its reset and the effect
      '  // THOUGHT MAP (John, 2/11/2026): the map\'s one record (branchCount, ?rec=1 only) is written once per session — reset with the session\n' +
        '  const thoughtMapLogged = useRef(false);\n',
      '    thoughtMapLogged.current = false; // Thought Map (2/11): the map\'s one record, once per session\n',
      '  // THOUGHT MAP (John, 2/11/2026): when the map first shows in a session and ?rec=1 is on — ONE integer, branchCount (0, 2 or 3).\n' +
        '  // Nothing without ?rec=1; nothing else ever (thoughtMapRecFields builds the only fields; recordTelemetry drops anything else).\n' +
        '  const thoughtMapShown = thoughtMap !== null;\n  useEffect(() => {\n    if (!thoughtMapShown || thoughtMapLogged.current) return;\n' +
        '    thoughtMapLogged.current = true;\n    const f = thoughtMapRecFields(thoughtMap, recMode.current);\n' +
        '    if (f) recordTelemetry("thought_map", f);\n  }, [thoughtMapShown]); // eslint-disable-line react-hooks/exhaustive-deps\n',
      '  // THOUGHT MAP (2/11): computed on every render from what the page already holds; nothing is kept\n' +
        '  const thoughtMap = thoughtMapView({ active: stageAActive.current, phase: stageAPhase, loading, stage: stageAView,\n' +
        '    messagesAtCard: messages.slice(0, rootCardMsgCount.current), allMessages: messages, riskKind: riskSignalKind.current,\n' +
        '    dangerFromOther: dangerFromOther.current, safetyMode, crisisFallback });\n']) s = s.split(line).join('');
    return s;
  };
  // RE-BASED (John, 2/11/2026, branch candidate-tm): the same strip, the same full sha256 — the reference is now src/App.jsx of 469e194
  // (main 24aab8e + safety-detectors), no longer of 24aab8e
  // RE-BASED again (John, 2/11/2026, ADR «2 Νοεμβρίου (δ)»): safety-detectors moved to 75a2aa9 (the football fix). Only the reference
  // moves, computed from 75a2aa9 itself; same list, same check, same purpose.
  assert('(Ζ) the rest of src/App.jsx is byte-identical to the base 75a2aa9 (main 24aab8e + safety-detectors with the fix of 2/11) (the block and the phase-2 pieces aside)',
    sha(stripThoughtMap(raw)) === '039f41c175228c978bdaf7ee4bdc29c46443c61518c6495ea60af53c59782e9c');
  const fp = fs.readFileSync(path.join(ROOT, 'api', 'aura.js'), 'utf8').match(/core: \{ length: \d+, sha256: "([0-9a-f]{16})/);
  assert('(Ζ) api/aura.js carries the prompt fingerprint b5f303cc9405aa21', !!fp && fp[1] === 'b5f303cc9405aa21');
  const ci = raw.indexOf('const AURA_CORE_PERSONALITY'), cs = raw.indexOf('`', ci) + 1, ce = raw.indexOf('`;', cs);
  assert('(Ζ) the prompt in src/App.jsx is the one api/aura.js accepts (b5f303cc9405aa21)', sha(raw.slice(cs, ce)).slice(0, 16) === 'b5f303cc9405aa21');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
