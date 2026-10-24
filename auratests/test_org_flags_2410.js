// AURA — John, 24/10/2026, Π3 step 2 (stress tool only): the FLAG LIST of organisation names, acronyms, web addresses and help
// numbers in the model's RAW text that the user did not write and that are not in the app's own help-line table
// (scripts/org_flags.cjs), and the three layers every reply keeps apart in a stress run: RAW (`modelTexts[].text`), AFTER FILTERS
// (`modelTexts[].filtered`) and SCREEN (`turns`). It is for a person to read: never a pass/fail check, never a complete detector, and
// it says nothing about legal facts, health statistics or plans. Nothing here calls a network or a model.

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log('PASS — ' + label); }
  else { failed++; console.log('FAIL — ' + label); }
}
let O = null, SL = null;
try { O = require(path.join(ROOT, 'scripts', 'org_flags.cjs')); } catch (e) { console.log('LOAD ERROR — ' + e.message); }
try { SL = require(path.join(ROOT, 'scripts', 'e2e_stress_lib.cjs')); } catch (e) { console.log('LOAD ERROR — ' + e.message); }
const APP_SRC = fs.readFileSync(path.join(ROOT, 'src', 'App.jsx'), 'utf8');
const TOOL_SRC = fs.readFileSync(path.join(ROOT, 'scripts', 'org_flags.cjs'), 'utf8');
const RUNNER = fs.readFileSync(path.join(ROOT, 'scripts', 'e2e_stage_a.cjs'), 'utf8');
const LIBSRC = fs.readFileSync(path.join(ROOT, 'scripts', 'e2e_stress_lib.cjs'), 'utf8');
const T = (f, ...a) => { try { return f(...a); } catch (e) { return 'threw:' + e.message; } };

let F = null, H = [];
try { F = O.loadFilters(APP_SRC); H = O.loadHelplines(APP_SRC); } catch (e) { console.log('LOAD ERROR — ' + e.message); }
const flags = (raw, user, extra) => T(() => O.orgFlags(Object.assign({ raw, filtered: raw, screen: raw, userTexts: [user || ''], helplines: H }, extra || {})));
const toks = (raw, user) => { const f = flags(raw, user); return Array.isArray(f) ? f.map(x => x.token) : ['threw']; };

// ── 1. The app's own filters, lifted out of App.jsx ───────────────────────────────────────────────
{
  assert('FILTERS: the five text filters of the reply, in the app\'s order', O && O.FILTER_CHAIN.join(',') ===
    'stripInternalLabels,stripForeignHelplines,stripRootDeclaration,stripPressurePhrases,stripAraDeclarative');
  assert('FILTERS: lifted out of App.jsx with what they call (every one of the five is there)', F && O.FILTER_CHAIN.every(n => F.names.includes(n)));
  assert('FILTERS: the prompt itself is not lifted (no AURA_CORE_PERSONALITY among the declarations)', F && !F.names.includes('AURA_CORE_PERSONALITY'));
  const a = F ? F.afterFilters('Πάρε το **1107** — είναι η γραμμή SOS για παιδιά. Τι σε κρατάει;') : '';
  assert('FILTERS: a help number that is not in the app\'s table is taken out (1107), as the app does', /Τι σε κρατάει;/.test(a) && !/1107/.test(a));
  const b = F ? F.afterFilters('Καταλαβαίνω. [[EXIT:no]]') : '';
  assert('FILTERS: the app\'s [[…]] tags are taken out first', !/\[\[/.test(b) && /Καταλαβαίνω/.test(b));
  const c = F ? F.afterFilters('Παρακεταμόλη 500mg, μέχρι 3 φορές την ημέρα. Πώς είσαι;') : '';
  assert('FILTERS: a drug-dose sentence is replaced, as the app does', !/500mg/.test(c) && /Πώς είσαι;/.test(c));
  assert('FILTERS: an ordinary reply is left as it is', F && F.afterFilters('Τι είναι αυτό που σε βαραίνει πιο πολύ;') === 'Τι είναι αυτό που σε βαραίνει πιο πολύ;');
}

// ── 2. The app's table: names and numbers are allowed (John, 24/10: «ΕΚΑΒ, 166») ─────────────────────────────────
{
  const nums = H.map(h => h.number).sort().join(',');
  assert('TABLE: read from the app\'s HELPLINES (112, 166, 100, 1018, 10306, 15900, 1056, 116111)', nums === ['100', '1018', '10306', '1056', '112', '116111', '15900', '166'].sort().join(','));
  assert('TABLE: «ΕΚΑΒ, 166» is not flagged', toks('Πάρε το 166, το ΕΚΑΒ.').length === 0);
  assert('TABLE: 1018 and 10306 with their names are not flagged', toks('Η γραμμή παρέμβασης για την αυτοκτονία, 1018, ή η Γραμμή Ψυχοκοινωνικής Υποστήριξης, 10306.').length === 0);
  assert('TABLE: «Χαμόγελο του Παιδιού, 1056» and 15900 are not flagged', toks('Το Χαμόγελο του Παιδιού (1056) ή η γραμμή SOS για τη βία κατά των γυναικών (15900).').length === 0);
  assert('TABLE: a number NOT in the table is flagged (1107)', toks('Κάλεσε το 1107.').includes('1107'));
}

// ── 3. What is flagged, and why ───────────────────────────────────────────────────────────────────
{
  const f = flags('Το ΚΕΠΑ (Κέντρα Προώθησης Απασχόλησης) έχει τέτοιες υπηρεσίες.');
  const t = Array.isArray(f) ? f.map(x => x.token) : [];
  assert('FLAG: an acronym the user did not write (ΚΕΠΑ)', t.includes('ΚΕΠΑ'));
  assert('FLAG: a tell-tale word with a capitalised name («Κέντρα Προώθησης Απασχόλησης»)', t.includes('Κέντρα Προώθησης Απασχόλησης'));
  assert('FLAG: every flag carries its reason and the exact excerpt of the raw text', Array.isArray(f) && f.length && f.every(x => x.reason && x.excerpt && x.excerpt.includes(x.token)));
  assert('FLAG: ΔΥΠΑ and ΣΕΠΕ', toks('Πήγαινε στη ΔΥΠΑ ή στο ΣΕΠΕ.').join(',') === 'ΔΥΠΑ,ΣΕΠΕ');
  assert('FLAG: a web address', toks('Δες το psychargos.gov.gr.').includes('psychargos.gov.gr'));
  assert('FLAG: a Latin name or product (Gumroad, freeCodeCamp)', toks('Βάλ\' το στο Gumroad ή μάθε στο freeCodeCamp.').join(',').includes('Gumroad') && toks('μάθε στο freeCodeCamp').includes('freeCodeCamp'));
  assert('FLAG: a known name in small letters («η εφορία»)', toks('Ρώτα στην εφορία.').includes('Εφορία'));
}

// ── 4. What is NOT flagged: the user's own words (whole words only), the app's own format, doses, years ──────────────
{
  assert('USER: an acronym the user wrote is not flagged (ΚΕΠ)', toks('Το ΚΕΠ θα σε βοηθήσει.', 'πήγα στο ΚΕΠ χθες').length === 0);
  assert('USER: «ΕΣΥ» is flagged although the user wrote «εσύ» (whole words, capitals)', toks('Μέσω ΕΣΥ;', 'Κι εσύ τι λες;').includes('ΕΣΥ'));
  assert('USER: «ΟΤΑ» is flagged although the user wrote «όταν»', toks('Ο ΟΤΑ σου.', 'όταν φύγω').includes('ΟΤΑ'));
  assert('USER: a number inside a bigger number the user wrote does not hide a flag (1107 vs «11070 ευρώ»)', toks('Κάλεσε το 1107.', 'χρωστάω 11070 ευρώ').includes('1107'));
  assert('USER: a name the user wrote is not flagged (Gumroad)', toks('Στο Gumroad;', 'σκέφτομαι το gumroad').length === 0);
  assert('EVERYDAY: «σε κλίμακα 1 έως 10» is not the help line «Κλίμακα»', toks('Σε κλίμακα 1 έως 10, πόσο;').length === 0 && toks('Πήρες την Κλίμακα;').includes('Κλίμακα'));
  assert('TAGS: [[EXIT:yes]] is not a name', toks('Καλή συνέχεια. [[EXIT:yes]]').length === 0);
  assert('DOSE: «1000mg» is not a phone number', !toks('έως 1000mg').includes('1000'));
  assert('YEAR: «1998» is not a phone number', !toks('Δουλεύω εκεί από το 1998.').includes('1998') && !toks('Από το 1998 δουλεύω εκεί.').includes('1998'));
  assert('FORMAT: the app\'s own capitals (AURA, ΔΡΟΜΟΣ) are not names', toks('AURA. ΔΡΟΜΟΣ 1').length === 0);
  assert('PROFESSION: the kind of professional is not flagged («δικηγόρος», «γιατρός»)', toks('Ένας δικηγόρος ή ένας γιατρός μπορεί να σου πει.').length === 0);
}

// ── 5. Known misses — written down, so nobody reads the list as complete ──────────────────────────────────────
{
  assert('MISS (known): «ο δήμος», «το νοσοκομείο» in small letters are not flagged', toks('Ρώτα στον δήμο ή στο νοσοκομείο.').length === 0);
  assert('MISS (known): a name given only by role («η αρμόδια υπηρεσία») is not flagged', toks('Ρώτα την αρμόδια υπηρεσία.').length === 0);
  assert('MISS (known): a number in words is not flagged («ένα ένα δύο»)', toks('Πάρε το ένα ένα δύο.').length === 0);
  assert('MISS (written): the tool\'s header names the misses and says it is not a complete detector',
    /NOT a pass\/fail check and NOT a complete detector/.test(TOOL_SRC) && /"το νοσοκομείο", "ο δήμος"/.test(TOOL_SRC) && /says nothing about legal facts, health statistics/.test(TOOL_SRC));
}

// ── 6. Three layers, kept apart ─────────────────────────────────────────────────────────────────────────
{
  const f = flags('Κάλεσε το 1107.', '', { filtered: 'Τι σε κρατάει;', screen: 'Τι σε κρατάει; Κάλεσε το 112.' });
  const x = Array.isArray(f) && f.find(y => y.token === '1107');
  assert('LAYERS: a flag says whether it is still there after the filters and on the screen (1107: gone, gone)', x && x.inFiltered === false && x.inScreen === false);
  const g = flags('Το ΚΕΠΑ.', '', { filtered: 'Το ΚΕΠΑ.', screen: 'Το ΚΕΠΑ.' });
  assert('LAYERS: …and when it stayed (ΚΕΠΑ: stays, shown)', Array.isArray(g) && g[0] && g[0].inFiltered === true && g[0].inScreen === true);
  const s = { label: 'X', turns: [{ who: 'aura', text: 'Γεια.' }, { who: 'user', text: 'έχω χρέη' }, { who: 'aura', text: 'Ρώτα το ΚΕΠΑ.' }],
    modelTexts: [{ kind: 'main', typed: 1, text: 'Ρώτα το ΚΕΠΑ. Πάρε το 1107.', filtered: 'Ρώτα το ΚΕΠΑ.' }] };
  const rows = F ? O.flagsForSession(s, F, H) : [];
  const r1107 = rows[0] && rows[0].flags.find(y => y.token === '1107'), rk = rows[0] && rows[0].flags.find(y => y.token === 'ΚΕΠΑ');
  assert('LAYERS: the run\'s own AFTER FILTERS text is used when the run wrote it (filteredFrom: run)', rows[0] && rows[0].filteredFrom === 'run' && r1107 && r1107.inFiltered === false && rk.inFiltered === true);
  assert('LAYERS: SCREEN is the turn shown after that many user messages', rk && rk.inScreen === true && r1107.inScreen === false);
  const old = { label: 'Y', turns: s.turns, modelTexts: [{ kind: 'main', typed: 1, text: 'Ρώτα το ΚΕΠΑ. Πάρε το 1107.' }] };
  const rows2 = F ? O.flagsForSession(old, F, H) : [];
  assert('LAYERS: an older run without the layer gets today\'s filters, and the row says so (filteredFrom: today)', rows2[0] && rows2[0].filteredFrom === 'today');
  assert('LAYERS: the user\'s words count only up to that reply (a word the user writes LATER does not hide a flag)',
    F && O.flagsForSession({ label: 'Z', turns: [{ who: 'user', text: 'α' }, { who: 'aura', text: 'ΚΕΠΑ' }, { who: 'user', text: 'ΚΕΠΑ;' }],
      modelTexts: [{ kind: 'main', typed: 1, text: 'Το ΚΕΠΑ.' }] }, F, H).length === 1);
  const ch = O ? O.filterChanges('Α. Β; Γ! [[EXIT:no]]', 'Α. Γ! Δ.') : null;
  assert('CHANGES: what the filters took out and put in, sentence by sentence', ch && ch.changed && ch.removed.join('|') === 'Β;' && ch.added.join('|') === 'Δ.');
  assert('CHANGES: an unchanged reply is not a change (tags aside)', O && O.filterChanges('Τι σε βαραίνει; [[EXIT:no]]', 'Τι σε βαραίνει;').changed === false);
  assert('CHANGES: no AFTER FILTERS layer → no claim (null)', O && O.filterChanges('Α.', null) === null);
}

// ── 7. The report: a list for reading, never a check ─────────────────────────────────────────────────
{
  const sess = [{ label: '101', persona: { name: 'x' }, turns: [{ who: 'user', text: 'δάνειο' }, { who: 'aura', text: 'Το ΚΕΠΑ.' }], checks: {}, applies: {},
    modelTexts: [{ kind: 'main', typed: 1, text: 'Το ΚΕΠΑ. Κάλεσε το 1107.', filtered: 'Το ΚΕΠΑ.' }] }];
  for (const s of sess) { s.orgFlags = O.flagsForSession(s, F, H); s.filterChanges = O.filterChangesForSession(s, F); }
  const md = SL ? SL.orgFlagReport(sess, { filters: true }).join('\n') : '';
  assert('REPORT: says it is for reading and NOT an automatic failure', /ανθρώπινη ανάγνωση/.test(md) && /\*\*Δεν\*\* είναι αυτόματη αποτυχία/.test(md));
  assert('REPORT: says it is NOT a complete detector, and names what it misses', /\*\*δεν\*\* είναι πλήρης ανιχνευτής φορέων/.test(md) && /«ο δήμος», «το νοσοκομείο»/.test(md) && /«η αρμόδια υπηρεσία»/.test(md));
  assert('REPORT: says name checking does NOT prove there were no legal facts, health statistics or plans', /\*\*δεν\*\* αποδεικνύει ότι δεν υπήρξαν γεγονότα για νόμο, στατιστικά υγείας/.test(md) && /διαβάζοντας το ακατέργαστο κείμενο/.test(md));
  assert('REPORT: names the three layers and where they are in the JSON', /`modelTexts\[\]\.text`/.test(md) && /`modelTexts\[\]\.filtered`/.test(md) && /`turns`/.test(md));
  assert('REPORT: each flag with its excerpt and its reason, and where it ended (filters, screen)', /\| 101 \| 1 \(main\) \| «ΚΕΠΑ» \| ακρωνύμιο/.test(md) && /\| 101 \| 1 \(main\) \| «1107» \|[^\n]*\| βγήκε \| δεν φάνηκε \|/.test(md));
  assert('REPORT: what the filters changed, per reply', /βγήκε: «Κάλεσε το 1107\.»/.test(md) && /1 απαντήσεις του μοντέλου, 1 άλλαξαν από τα φίλτρα/.test(md));
  const none = SL ? SL.orgFlagReport([{ label: 'A', persona: { name: 'x' }, turns: [], modelTexts: [{ kind: 'main', typed: 1, text: 'Τι σε βαραίνει;', filtered: 'Τι σε βαραίνει;' }], orgFlags: [], filterChanges: [] }], { filters: true }).join('\n') : '';
  assert('REPORT: no flags is never written as «clean»', /Καμία επισήμανση\. \(Δεν σημαίνει ότι δεν υπήρξε όνομα φορέα/.test(none));
  const miss = SL ? SL.orgFlagReport(sess, { filters: false }).join('\n') : '';
  assert('REPORT: if the filters could not be loaded, it says the layer is missing', /Τα φίλτρα δεν φορτώθηκαν σε αυτή την εκτέλεση/.test(miss));
  assert('REPORT: no ✗ and no ★ in the section (it is not a check)', md && !/[✗★]/.test(md));
  assert('REPORT: nothing when the run kept no model texts', SL && SL.orgFlagReport([{ label: 'A', modelTexts: [] }], {}).length === 0);
  const before = SL.sessionScore(Object.assign({}, sess[0], { orgFlags: [], filterChanges: [] }));
  assert('REPORT: flags never change a session\'s severity, its checks or the brake', SL.sessionScore(sess[0]) === before && !/orgFlags/.test(LIBSRC.slice(LIBSRC.indexOf('function sessionScore'), LIBSRC.indexOf('\n}\n', LIBSRC.indexOf('function sessionScore')))));
  assert('REPORT: the section is in the stress report, after the mechanisms', /L\.push\(\.\.\.mechanismReport\(S\)\);[^\n]*\n  L\.push\(\.\.\.orgFlagReport\(S, m\)\);/.test(LIBSRC));
}

// ── 8. Wiring in the stress run, and tool only ──────────────────────────────────────────────────
{
  assert('RUN: every model text keeps RAW and AFTER FILTERS side by side', /sess\.modelTexts\.push\(\{ kind: cls\.kind, typed: sess\.typed\.length, text: t, filtered: afterFilters\(t\) \}\)/.test(RUNNER));
  assert('RUN: the filters come from the same App.jsx the run tests', /const ORGF_SRC = fs\.readFileSync\(path\.join\(REPO, 'src', 'App\.jsx'\), 'utf8'\);/.test(RUNNER) && /ORGF\.loadFilters\(ORGF_SRC\)/.test(RUNNER));
  assert('RUN: a filter that throws gives no layer (null), never a made-up one', /try \{ return ORGF_FILTERS\.afterFilters\(t\); \} catch \(e\) \{ return null; \}/.test(RUNNER));
  const w = RUNNER.indexOf("writeOut('stress-report.md', SL.buildStressReport(sessions, meta));"), a = RUNNER.indexOf('s.orgFlags = ORGF.flagsForSession(s, ORGF_FILTERS, ORGF_HELPLINES)');
  assert('RUN: flags and filter changes are put on each session before the report is written', a > 0 && w > a && /meta\.filters = !!ORGF_FILTERS;/.test(RUNNER));
  assert('RUN: SCREEN stays the page\'s own turns (not rebuilt from the model text)', /sess\.turns/.test(RUNNER) && !/turns = .*modelTexts/.test(RUNNER));
  assert('TOOL ONLY: the app never loads the tool', !/org_flags/.test(APP_SRC));
  assert('TOOL ONLY: the tool calls no network and no model', !/require\(['"](https?|net|child_process)['"]\)|fetch\(|anthropic/i.test(TOOL_SRC));
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
