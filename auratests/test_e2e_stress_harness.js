// AURA — the STRESS TEST harness (John's decision of 10/10/2026, «Μέρος Β»): 16 simulated users on the real app with the real
// model, run by John from his own computer with his own key. Nothing here calls a network. This suite checks the pure parts in
// scripts/e2e_stress_lib.cjs — the 16 users, the code checks, the cost ceiling, the report — and how scripts/e2e_stage_a.cjs
// wires them (--stress). The crisis and DISTRESS sessions are FIXED messages: the cheap model never writes crisis text.

const fs = require('fs');
const path = require('path');
function findFile(cands) {
  for (const c of cands) { const x = path.join(__dirname, c); if (fs.existsSync(x)) return x; }
  return null;
}
const ROOT = path.join(__dirname, '..');
let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log('PASS — ' + label); }
  else { failed++; console.log('FAIL — ' + label); }
}
let SL = null, LIB = null, APP = null;
try { SL = require(path.join(ROOT, 'scripts', 'e2e_stress_lib.cjs')); } catch (e) { console.log('LOAD ERROR — ' + e.message); }
try { LIB = require(path.join(ROOT, 'scripts', 'e2e_stage_a_lib.cjs')); APP = LIB.loadApp(fs.readFileSync(findFile(['/../src/App.jsx']), 'utf8')); } catch (e) { console.log('LOAD ERROR — ' + e.message); }
const S = SL || {};
const T = (f, ...a) => { try { return S[f](...a); } catch (e) { return 'threw:' + e.message; } };
const RUNNER = fs.readFileSync(path.join(ROOT, 'scripts', 'e2e_stage_a.cjs'), 'utf8');
const raw = fs.readFileSync(findFile(['/../src/App.jsx']), 'utf8');

// ── The 16 users ─────────────────────────────────────────────────────────────
{
  const P = S.PERSONAS || [];
  assert('USERS: 16, numbered 1–16 in John\'s order', P.length === 16 && P.every((p, i) => p.id === i + 1));
  assert('USERS: 1–8 run twice, 9–16 once — 24 sessions', P.every(p => (p.id <= 8 ? p.runs === 2 : p.runs === 1)) && (T('planRuns') || []).length === 24);
  const plan = T('planRuns') || [];
  assert('ORDER: the safety sessions (14, 15, 16) run FIRST — a budget stop never skips safety', plan.slice(0, 3).map(r => r.persona.id).join(',') === '14,15,16' && plan[3].label === '1.1');
  assert('FILTER: --sessions picks only those users; «1.1» picks one run of a user who runs twice', (T('planRuns', P, [16, 3]) || []).map(r => r.label).join(',') === '16,3.1,3.2' &&
    (T('planRuns', P, ['14', '15', '16', '1.1']) || []).map(r => r.label).join(',') === '14,15,16,1.1');
  const detect = t => APP && APP.fns.detectSafetySignal ? APP.fns.detectSafetySignal(t) : 'n/a';
  const fixed = P.filter(p => p.fixed);
  assert('FIXED: exactly 14, 15, 16 are fixed messages (crisis and DISTRESS), every other user is simulated', fixed.map(p => p.id).join(',') === '14,15,16' && P.filter(p => !p.fixed).every(p => p.situation && p.hiddenRoot && p.behavior));
  const marked = fixed.map(p => p.fixed.find(s => s.mark));
  assert('FIXED: the marked message of 14 is DISTRESS, of 15 and 16 CRISIS — by the app\'s own detector',
    detect(marked[0].say) === 'DISTRESS' && detect(marked[1].say) === 'CRISIS' && detect(marked[2].word) === 'CRISIS');
  assert('FIXED: 15 is crisis B together with «κλείνουμε» (the app reads it as a closing too); 16 is the crisis at the «one word»',
    APP && APP.fns.declaresClosing(marked[1].say) && /κλείνουμε/.test(marked[1].say) && marked[2].word !== undefined);
  assert('SIMULATED: no text given to the cheap model carries a crisis or DISTRESS signal',
    P.filter(p => !p.fixed).every(p => [p.situation, p.hiddenRoot, p.behavior, ...Object.values(p.forced || {})].every(t => detect(t) === null)));
  const by = id => P.find(p => p.id === id) || {};
  assert('USER 1: a bare «Ναι» as the 6th message — after 5', (by(1).forced || {})[6] === 'Ναι');
  assert('USER 2: «Ευχαριστώ» the moment the root is found (policy thanks)', T('policyOf', by(2)).root === 'thanks' && RUNNER.includes("found && pol.root === 'thanks') { found = false; text = 'Ευχαριστώ.'; }"));
  assert('USER 3: «Ευχαριστώ.» early (an exit the app knows), back at the root question, a leave phrase the app does NOT know, then the second exit',
    APP && APP.fns.isExplicitClosure(by(3).forced[3]) && !APP.fns.isExplicitClosure(by(3).forced[4]) && !APP.fns.declaresClosing(by(3).forced[4]) &&
    APP.fns.isExplicitClosure(by(3).forced[5]) && T('policyOf', by(3)).onLeavingQuestion === 'back');
  assert('USERS 4–8: advice, «δεν ξέρω», scattered, typos/greeklish, agrees with everything (and says «Ναι» on the card)',
    /what to do/.test(by(4).behavior) && /Δεν ξέρω/.test(by(5).behavior) && /scattered/.test(by(6).behavior) && /greeklish/.test(by(7).behavior) &&
    /agree/.test(by(8).behavior) && T('policyOf', by(8)).onCard === 'yes');
  assert('USERS 9–13: «Διόρθωσε», the early button, «Όχι τώρα», «Θέλω να συνεχίσω», «είσαι άνθρωπος;»',
    T('policyOf', by(9)).onCard === 'correct' && T('policyOf', by(10)).root === 'early' && T('policyOf', by(11)).onOffer === 'notNow' &&
    T('policyOf', by(12)).onOffer === 'want' && T('policyOf', by(12)).help === 1 && (by(13).forced || {})[2] === 'Είσαι άνθρωπος;');
  assert('LIMIT: at most 12 user messages; after 10 without a root the user closes on his own with an exit the app knows',
    S.MAX_TYPED === 12 && S.EXIT_AFTER === 10 && APP && APP.fns.isExplicitClosure(S.EXIT_TEXT));
}

// ── The cheap model: prompts and structured output ───────────────────────────
{
  const p = (S.PERSONAS || [])[1] || {};
  const sys = T('personaSystem', p) || '';
  assert('PERSONA: the system prompt carries the situation, the hidden root (not to be said outright) and the style', sys.includes(p.situation) && sys.includes(p.hiddenRoot) && /never say it outright/.test(sys));
  assert('PERSONA: a real person on a phone, in Greek, never saying it is a test', /typing on a phone/.test(sys) && /in Greek/.test(sys) && /Never mention that this is a test/.test(sys) && /you are not an assistant/.test(sys));
  const turns = [{ who: 'user', text: 'Γεια' }, { who: 'aura', text: 'Τι σε φέρνει;' }, { who: 'app', text: '[πάτησε «Χ»]' }];
  const pr = T('personaPrompt', turns, 'card', 'Φοβάμαι') || '';
  assert('PROMPT: the conversation so far, labelled, and the question of the moment', pr.includes('ΕΣΥ: Γεια') && pr.includes('AURA: Τι σε φέρνει;') && pr.includes('[οθόνη] [πάτησε «Χ»]') && pr.includes('«Φοβάμαι»'));
  assert('PROMPT: one text per need (reply, root, correct, word, card, clarity)', ['reply', 'root', 'correct', 'word', 'card', 'clarity'].every(n => (T('personaPrompt', [], n, 'x') || '').length > 60));
  // structured output: every property required, nothing else allowed
  const strict = sc => sc && sc.type === 'object' && sc.additionalProperties === false && Array.isArray(sc.required) &&
    sc.required.every(k => k in sc.properties) && Object.keys(sc.properties).every(k => sc.required.includes(k));
  assert('SCHEMAS: strict JSON schemas (required fields, no extras) for the user, the card, the clarity and the judge',
    [S.USER_SCHEMA, S.CARD_SCHEMA, S.CLARITY_SCHEMA, S.JUDGE_SCHEMA].every(strict) && strict(S.JUDGE_SCHEMA.properties.introduced_causes.items));
  assert('JSON: a valid reply is read; anything else is null (never a crash)', T('parseJsonReply', '{"message":"α","found_root":true}').found_root === true && T('parseJsonReply', 'όχι json') === null && T('parseJsonReply', '') === null);
  const jp = T('judgePrompt', turns, 'Κρυφή', 'Κάρτα') || '';
  assert('JUDGE: reading only — it lists causes the user never mentioned and compares the card with the hidden root',
    /introduce a cause/.test(S.JUDGE_SYSTEM) && /do not grade/.test(S.JUDGE_SYSTEM) && jp.includes('«Κρυφή»') && jp.includes('«Κάρτα»') && /did NOT mention/.test(jp));
  assert('MODEL: the users and the judge are Haiku 5.5', S.USER_MODEL === 'claude-haiku-5-5');
}

// ── Code checks ──────────────────────────────────────────────────────────────
{
  const L = t => T('findLabels', t) || [];
  assert('LABELS: a hidden tag, a MASTER PRIORITY block, the Stage A marker are caught',
    L('Τι σε κρατάει; [[EXIT:yes]]').length === 1 && L('[MASTER PRIORITY RULE — STAGE: GRACEFUL EXIT]').length >= 1 && L('[FREE PART: ENDS AT ROOT]').length >= 1);
  assert('LABELS: ordinary text in brackets is not a label', L('Είπες [σε παρένθεση] κάτι — [1] τι σημαίνει;').length === 0 && L('Αυτό [ΟΚ] ήταν').length === 0);
  const F = t => T('findFarewells', t) || [];
  assert('FAREWELLS: «καλή συνέχεια», «κλείνουμε», «χάρηκα», «να προσέχεις», «καληνύχτα», with or without accents',
    F('Καλή συνέχεια.').length === 1 && F('Κλείνουμε εδώ.').length === 1 && F('Χάρηκα πολύ!').length === 1 && F('Να προσέχεις.').length === 1 && F('ΚΑΛΗΝΥΧΤΑ').length === 1 && F('Τι σε κρατάει;').length === 0);
  // the same normalisation as the app's own verbatim rule
  let appNorm = null;
  try {
    const i = raw.indexOf('const AURA_CORE_PERSONALITY'), s0 = raw.indexOf('`', i) + 1, e0 = raw.indexOf('`;', s0);
    const code = raw.slice(0, i) + raw.slice(e0);
    const a = code.indexOf('function normalizeVerbatim('); const b = code.indexOf('\n}\n', a);
    appNorm = new Function(code.slice(a, b + 2) + '\nreturn normalizeVerbatim;')();
  } catch (e) { appNorm = null; }
  const samples = ['  «Φοβάμαι   την απόρριψη»  ', '"Ότι δεν ζητάω"', 'Ένα', 42, '', '«»'];
  assert('VERBATIM: the harness normalises exactly like the app (normalizeVerbatim, same output on every sample)', !!appNorm && samples.every(x => appNorm(x) === T('normalizeVerbatim', x)));
  assert('VERBATIM: the card root must be inside a message the user typed — not a paraphrase',
    T('rootIsUserWords', 'Φοβάμαι την απόρριψη', ['Νομίζω ότι φοβάμαι την απόρριψη.', 'Φοβάμαι την απόρριψη']) === true &&
    T('rootIsUserWords', 'Φοβάσαι την απόρριψη', ['Φοβάμαι την απόρριψη']) === false && T('rootIsUserWords', '', ['α']) === false);
  const Q = t => T('rootQuestionUnderModelQuestion', t);
  assert('STACKED: the root question right under a model question (Greek «;», U+037E or «?») is flagged; under the user\'s bubble or a statement it is not',
    Q({ who: 'aura', text: 'Τι σε κρατάει;' }) === true && Q({ who: 'aura', text: 'Τι σε κρατάει;' }) === true && Q({ who: 'aura', text: 'Τι λες?' }) === true &&
    Q({ who: 'aura', text: 'Τι σε κρατάει;»' }) === true && Q({ who: 'user', text: 'Ναι;' }) === false && Q({ who: 'aura', text: 'Ακούω.' }) === false && Q(null) === false);
  assert('ADVICE: the app\'s own console detectors are read; advice = ADVICE, ADVICE_CASCADE, ROLE, UNSOURCED_OPTIONS, STAGE_A_FREE_ACTION',
    T('violationType', '[AURA VIOLATION] ADVICE | turn 3 | …') === 'ADVICE' && T('violationType', '[AURA VIOLATION] STAGE_A_FREE_ACTION | turn 2') === 'STAGE_A_FREE_ACTION' &&
    T('violationType', '[AURA telemetry] {}') === null && S.ADVICE_VIOLATIONS.join(',') === 'ADVICE,ADVICE_CASCADE,ROLE,UNSOURCED_OPTIONS,STAGE_A_FREE_ACTION');
  const appViol = (raw.match(/console\.warn\('\[AURA VIOLATION\]'?[^\n]*/g) || []).join('\n');
  assert('ADVICE: every advice type the harness counts is one the app really writes to the console',
    ['UNSOURCED_OPTIONS', 'STAGE_A_FREE_ACTION'].every(t => appViol.includes(t)) && /return "ADVICE";/.test(raw) && /return "ROLE";/.test(raw) && raw.includes('"ADVICE_CASCADE"'));
}

// ── Telemetry order ──────────────────────────────────────────────────────────
{
  const ev = (e, f) => Object.assign({ ev: e, t: 1 }, f || {});
  const full = [ev('session_started'), ev('root_card_shown', { door: 1 }), ev('root_answer', { answer: 1, from: 2 }), ev('coach_offer_shown', { shown: 1 }),
    ev('coach_offer_answer', { want: 1 }), ev('coach_help_asked', { asked: 1 }), ev('coach_help_choice', { choice: 1 }), ev('clarity_scale', { value: 7 }), ev('session_completed')];
  const acts = { card: 1, yes: 1, correct: 0, back: 0, offerShown: true, want: true, notNow: false, help: 1, clarity: 7, completed: true, risk: null };
  assert('TELEMETRY: a whole session in order, matching what the user did → no issue', (T('telemetryIssues', full, acts) || ['x']).length === 0);
  assert('TELEMETRY: a missing session_completed is found', (T('telemetryIssues', full.slice(0, -1), acts) || []).some(x => /session_completed/.test(x)));
  assert('TELEMETRY: a wrong clarity value is found', (T('telemetryIssues', full.map(r => r.ev === 'clarity_scale' ? ev('clarity_scale', { value: 3 }) : r), acts) || []).some(x => /clarity_scale/.test(x)));
  const swapped = full.slice(); [swapped[2], swapped[3]] = [swapped[3], swapped[2]];
  assert('TELEMETRY: an offer before the «Ναι» is found', (T('telemetryIssues', swapped, acts) || []).some(x => /πριν από το «Ναι»/.test(x)));
  assert('TELEMETRY: an offer in a session with a risk signal is found', (T('telemetryIssues', full, Object.assign({}, acts, { risk: 'distress' })) || []).some(x => /κινδύνου/.test(x)));
  assert('TELEMETRY: a «Ναι» the user did not press (or one missing) is found', (T('telemetryIssues', full, Object.assign({}, acts, { yes: 0 })) || []).some(x => /«Ναι»/.test(x)));
  const two = [ev('session_started'), ev('session_abandoned', { turns: 2 }), ...full];
  assert('TELEMETRY: only the LAST session of the device log is read', JSON.stringify(T('lastSessionEvents', two)) === JSON.stringify(full) && (T('lastSessionEvents', []) || ['x']).length === 0);
}

// ── Cost: the ceiling, the reservation, the estimate ─────────────────────────
{
  assert('PRICES: AURA = Sonnet 4.6 ($3 / $15, cache write $3.75, read $0.30); users = Haiku 5.5 ($0.10 / $0.50)',
    S.PRICES.aura.input === 3 && S.PRICES.aura.output === 15 && S.PRICES.aura.cacheWrite === 3.75 && S.PRICES.aura.cacheRead === 0.30 &&
    S.PRICES.user.input === 0.10 && S.PRICES.user.output === 0.50 && /claude-sonnet-4-6/.test(fs.readFileSync(path.join(ROOT, 'api', 'aura.js'), 'utf8')));
  assert('COST: one million input tokens of AURA = $3; of Haiku = $0.10', Math.abs(T('costOf', { input_tokens: 1e6 }, 'aura') - 3) < 1e-9 && Math.abs(T('costOf', { input_tokens: 1e6 }, 'user') - 0.10) < 1e-9);
  const b = T('makeStressBudget', 100);
  assert('CAP: the budget can never be above $25, whatever is asked', b.cap === 25 && S.BUDGET_CAP === 25 && /want > SL\.BUDGET_CAP/.test(RUNNER));
  const b2 = T('makeStressBudget', 1);
  b2.add({ cache_creation_input_tokens: 200000 }, 'aura');   // $0.75 spent
  assert('RESERVE: a call is allowed only if the worst it could cost still fits — so the total never passes the cap',
    Math.abs(b2.spent() - 0.75) < 1e-9 && b2.canSpend('aura') === false && b2.canSpend('user') === true && S.WORST_CALL.aura > 0.3);
  const e = T('estimateCost', T('planRuns'), APP ? APP.consts.core.length : 300000) || {};
  assert('ESTIMATE: 24 sessions, a low and a high figure, the high one under the $25 cap', e.sessions === 24 && e.low > 3 && e.low < e.high && e.high < 25);
  const small = T('estimateCost', T('planRuns', null, ['14', '15', '16', '1.1']), APP ? APP.consts.core.length : 300000) || {};
  assert('ESTIMATE: the «μικρό» run (4 sessions) fits its $3 cap even at the high estimate', small.sessions === 4 && small.high < 3);
  assert('ESTIMATE: the prompt is ~77.000 tokens (AURA_COST_MEASUREMENT.md) and a warm call costs a few cents', e.coreTok > 70000 && e.coreTok < 90000 && e.perCall > 0.03 && e.perCall < 0.06 && e.write > 0.2 && e.write < 0.35);
}

// ── The report ───────────────────────────────────────────────────────────────
{
  const mk = (label, checks, extra) => Object.assign({ label, persona: { id: 1, name: 'Χ' + label, hiddenRoot: 'Κ', fixed: false }, checks, turns: [{ who: 'user', text: 'μήνυμα ' + label }, { who: 'aura', text: 'απάντηση ' + label }],
    rootConfirmed: true, cost: 0.1, judge: { introduced_causes: [], root_match: 'yes', root_match_reason: 'ίδια' } }, extra || {});
  const none = { labels: [], closing: [], verbatim: [], safety: [], stacked: [], advice: [], telemetry: [] };
  const sessions = [mk('1.1', none), mk('14', Object.assign({}, none, { safety: ['κάρτα μετά την κρίση'] })), mk('2.1', Object.assign({}, none, { closing: ['κάρτα'] })),
    mk('3.1', none), mk('4.1', none), mk('5.1', Object.assign({}, none, { stacked: ['x'] }))];
  assert('SEVERITY: safety first, then closing before the root, then the rest', T('sessionScore', sessions[1]) > T('sessionScore', sessions[2]) && T('sessionScore', sessions[2]) > T('sessionScore', sessions[5]) && T('sessionScore', sessions[5]) > T('sessionScore', sessions[0]));
  const rep = T('buildStressReport', sessions, { mode: 'δοκιμή', budget: 25, spent: 1.5, by: { aura: 1.4, user: 0.1 } }) || '';
  assert('REPORT: a table session → every check → rounds to the root, with the four «fix» checks starred',
    rep.includes('## Πίνακας') && S.CHECKS.every(c => rep.includes(c.name)) && (rep.match(/★ \|/g) || []).length === 4 && rep.includes('Γύροι ως την κάρτα / ως το «Ναι»'));
  const worst = rep.slice(rep.indexOf('## Οι 5 χειρότερες'));
  assert('REPORT: the 5 worst conversations, verbatim, the worst first', (worst.match(/^### /gm) || []).length === 5 && worst.indexOf('### 14') < worst.indexOf('### 2.1') && worst.includes('**Χρήστης:** μήνυμα 14') && !worst.includes('μήνυμα 4.1'));
  assert('REPORT: says what gets fixed (only safety, closing before the root, label leaks, a root that is not the user\'s words) and that the judge is reading-only',
    /Διορθώνονται ΜΟΝΟ: ασφάλεια, κλείσιμο πριν από τη ρίζα, διαρροή ετικετών, ρίζα που δεν είναι λόγια του χρήστη/.test(rep) && /μόνο για ανάγνωση/.test(rep));
}

// ── Wiring in scripts/e2e_stage_a.cjs (--stress) ─────────────────────────────
{
  assert('WIRING: --stress runs the stress test; --dry stops before any build or call', /if \(STRESS\) \{ await mainStress\(\); return; \}/.test(RUNNER) &&
    RUNNER.indexOf("if (real && has('--dry'))") < RUNNER.indexOf('const app = await startApp();', RUNNER.indexOf('async function mainStress(')));
  assert('WIRING: --real needs --yes to spend, and the key comes ONLY from ANTHROPIC_API_KEY', /if \(real && !has\('--yes'\)\)/.test(RUNNER) && /const KEY = process\.env\.ANTHROPIC_API_KEY \|\| '';/.test(RUNNER) &&
    !/sk-ant-/.test(RUNNER) && /new Anthropic\(\{ apiKey: KEY, maxRetries: 2 \}\)/.test(RUNNER));
  const user = RUNNER.slice(RUNNER.indexOf('function stressUserReal('), RUNNER.indexOf('function stressUserFake('));
  assert('WIRING: the users and the judge are Haiku through the official SDK, structured output, low effort — the budget is checked before each call',
    /model: SL\.USER_MODEL/.test(user) && /output_config: \{ effort: 'low', format: \{ type: 'json_schema', schema \} \}/.test(user) &&
    user.indexOf("if (!budget.canSpend('user')) return { stop:") >= 0 && user.indexOf("budget.canSpend('user')") < user.indexOf('client.messages.create'));
  assert('WIRING: an SDK error is reported only by its HTTP status — never its message', /e instanceof Anthropic\.APIError \? 'HTTP '/.test(user) && !/e\.message/.test(user));
  assert('WIRING: the app\'s requests go through the SAME api/aura.js as --real (realModel), the budget checked first',
    /real \? await realModel\(\) : stressFakeAura\(\)/.test(RUNNER) && /if \(!budget\.canSpend\('aura'\)\)/.test(RUNNER));
  assert('WIRING: the app opens with ?stageA=1&rec=1 at phone size (390×700)', RUNNER.includes("await page.goto(BASE + '/?stageA=1&rec=1');") && /viewport: \{ width: 390, height: 700 \}/.test(RUNNER.slice(RUNNER.indexOf('async function runStressSession('))));
  assert('WIRING: the reports go through writeOut (redaction + no-secret check) into the temp folder only',
    /writeOut\('stress-report\.md'/.test(RUNNER) && /writeOut\('stress-report\.json'/.test(RUNNER) && /LIB\.outDirInTemp\(/.test(RUNNER) && /LIB\.assertNoSecret\(t, KEY\)/.test(RUNNER));
}

// ── The key's SHAPE for --dry (why Anthropic would refuse it) — never the key itself ─────
{
  const fake = 'sk-ant-api03-SECRETPART-0123456789';
  const sh = T('keyShape', fake) || {};
  assert('KEY SHAPE: the kind and the stray spaces/quotes only — no part of the key in the result',
    sh.found === true && sh.kind === 'api' && sh.spaces === false && !JSON.stringify(sh).includes('SECRETPART') &&
    T('keyShape', ' ' + fake + '\n').spaces === true && T('keyShape', '"' + fake + '"').quotes === true &&
    T('keyShape', 'sk-ant-oat01-x').kind === 'oauth' && T('keyShape', 'sk-ant-admin01-x').kind === 'admin' && T('keyShape', 'abc').kind === 'unknown' && T('keyShape', '').found === false);
  const dry = RUNNER.slice(RUNNER.indexOf("if (real && has('--dry')) {", RUNNER.indexOf('async function mainStress(')));
  assert('KEY CHECK: --dry asks Anthropic for the two models (free, no tokens) and reports only accepted / refused with the HTTP status',
    /client\.models\.retrieve\(id\)/.test(dry) && /\['claude-sonnet-4-6', SL\.USER_MODEL\]/.test(dry) && /e instanceof Anthropic\.APIError \? 'HTTP '/.test(dry) &&
    !/e\.message/.test(dry.slice(0, dry.indexOf('const head = ['))));
}

// ── GitHub Actions (John, 10/10: tests and the stress test from the phone) ─────
// The report also goes to the run's page (job summary), with the same redaction and no-secret check as every file.
{
  const ws = RUNNER.slice(RUNNER.indexOf('function writeSummary('), RUNNER.indexOf('function writeSummary(') + 900);
  assert('SUMMARY: written only when GitHub gives a summary file, redacted and checked for the key BEFORE it is appended, size-capped',
    /const f = process\.env\.GITHUB_STEP_SUMMARY;\s*if \(!f\) return;/.test(ws) && /let t = LIB\.redact\(String\(text \|\| ''\), KEY\);/.test(ws) && ws.indexOf('LIB.redact(') < ws.indexOf('LIB.assertNoSecret(') &&
    ws.indexOf('LIB.assertNoSecret(') < ws.indexOf('fs.appendFileSync(f,') && /Buffer\.byteLength\(t\) > MAX/.test(ws));
  const ms = RUNNER.slice(RUNNER.indexOf('async function mainStress('));
  assert('SUMMARY: the dry plan (sessions, estimate, cap) and the full report both reach the summary',
    /writeSummary\(dryMarkdown\(/.test(ms) && /writeSummary\(SL\.buildStressReport\(sessions, meta\)\)/.test(ms));
  assert('TIME: --minutes N — no new session starts after N minutes, so the report is always written before the job is stopped',
    /const minutes = Number\(opt\('--minutes', '0'\)\)/.test(ms) && /if \(minutes && Date\.now\(\) - t0 > minutes \* 60000\) \{ stopped = 'χρονικό όριο/.test(ms));
}
{
  const W = f => { try { return fs.readFileSync(path.join(ROOT, '.github', 'workflows', f), 'utf8'); } catch (e) { return ''; } };
  const ST = W('stress.yml'), TS = W('tests.yml'), T1 = W('test.yml');
  const code = t => t.split('\n').filter(l => !/^\s*#/.test(l)).join('\n');
  assert('STRESS: only by hand (workflow_dispatch) — no push, schedule, pull_request or any other trigger',
    /^on:\s*\n\s+workflow_dispatch:/m.test(ST) && !/^\s+(push|pull_request|pull_request_target|schedule|workflow_run|repository_dispatch|issue_comment):/m.test(code(ST)));
  assert('STRESS: the three choices, dry by default', /options:\s*\n\s+- dry\s*\n\s+- μικρό\s*\n\s+- πλήρες/.test(ST) && /default: dry/.test(ST));
  assert('STRESS: μικρό = 14, 15, 16 and 1 (once) with $3; πλήρες = $25; dry = --dry', /--stress --real --dry/.test(ST) &&
    /--stress --real --yes --sessions 14,15,16,1\.1 --budget 3 /.test(ST) && /--stress --real --yes --budget 25 /.test(ST));
  assert('STRESS: 90 minutes for the job; the test itself stops starting sessions earlier, so the report is written', /timeout-minutes: 90/.test(ST) && /--budget 3 --minutes 7\d /.test(ST) && /--budget 25 --minutes 7\d /.test(ST));
  const keyLines = code(ST).split('\n').filter(l => /secrets\./.test(l));
  assert('KEY: read from the ANTHROPIC_API_KEY secret only, and only into env (once to test that it exists, once for the run)',
    keyLines.length === 2 && /HAS_KEY: \$\{\{ secrets\.ANTHROPIC_API_KEY != '' \}\}/.test(ST) && /ANTHROPIC_API_KEY: \$\{\{ secrets\.ANTHROPIC_API_KEY \}\}/.test(ST));
  // the shell never touches the value: only node reads it from the environment (the NAME may appear in a message)
  assert('KEY: never echoed, never written to a file — no shell line uses its value at all', ST.length > 500 && !/\$\{?ANTHROPIC_API_KEY/.test(code(ST)) && !/(echo|printf|tee|cat)[^\n]*secrets\./.test(code(ST)));
  assert('KEY: missing → a clear message and a stop, before anything is installed or run', /Λείπει το secret ANTHROPIC_API_KEY|Δεν υπάρχει το secret ANTHROPIC_API_KEY/.test(ST) && /exit 1/.test(ST) &&
    ST.indexOf("HAS_KEY") < ST.indexOf('npm ci'));
  assert('STRESS: the choice reaches the shell through env, never pasted into the script (no injection)', /MODE: \$\{\{ inputs\.mode \}\}/.test(ST) && !/run:[^\n]*\$\{\{ inputs\./.test(ST) && !/\n\s{10,}[^\n#]*\$\{\{ inputs\.mode \}\}[^\n]*;;/.test(ST));
  assert('STRESS: the report folder (inside the runner\'s temp) is uploaded as an artifact, also after a failure; nothing else', /actions\/upload-artifact@v4/.test(ST) && /if: always\(\) && inputs\.mode != 'dry' && env\.AURA_STRESS_OUT != ''/.test(ST) &&
    /path: \$\{\{ env\.AURA_STRESS_OUT \}\}/.test(ST) && /require\('os'\)\.tmpdir\(\)/.test(ST));
  assert('STRESS: read-only token, one run at a time', /permissions:\s*\n\s+contents: read/.test(ST) && /concurrency:/.test(ST));
  // the report also goes to the branch «stress-reports» — by a SEPARATE job that never has the key
  const pub = ST.slice(ST.indexOf('\n  publish:'));
  const stressJob = ST.slice(ST.indexOf('\n  stress:'), ST.indexOf('\n  publish:'));
  assert('PUBLISH: a separate job, after the stress job, never for dry, with write access only for itself',
    pub.length > 300 && /needs: stress/.test(pub) && /if: always\(\) && inputs\.mode != 'dry'/.test(pub) && /permissions:\s*\n\s+contents: write/.test(pub) &&
    !/contents: write/.test(stressJob) && (ST.match(/contents: write/g) || []).length === 1);
  assert('PUBLISH: no secret in that job at all — it only takes the artifact (already checked for the key) to runs/<run>',
    !/secrets\./.test(code(pub)) && /actions\/download-artifact@v4/.test(pub) && /name: aura-stress-report-\$\{\{ github\.run_number \}\}/.test(pub) &&
    /git push -q origin stress-reports/.test(pub) && /mkdir -p "runs\/\$RUN"/.test(pub));
  assert('ΕΠΙΛΟΓΗ: only the sessions and the budget of the form, through env, checked (digits, dots, commas; a number) before use',
    /- επιλογή/.test(ST) && /SESSIONS: \$\{\{ inputs\.sessions \}\}/.test(ST) && /BUDGET: \$\{\{ inputs\.budget \}\}/.test(ST) &&
    /\[\[ "\$SESSIONS" =~ \^\[0-9\]\[0-9\.,\]\*\$ \]\]/.test(ST) && /--sessions "\$SESSIONS" --budget "\$BUDGET" --minutes 75/.test(ST));
  assert('TESTS: on every push to main, all suites through the one loop in test.yml, then the build — no secret at all',
    /push:\s*\n\s+branches: \[main\]/.test(TS) && /uses: \.\/\.github\/workflows\/test\.yml/.test(TS) && /npm run build/.test(TS) && !/secrets/.test(TS) && /permissions:\s*\n\s+contents: read/.test(TS));
  assert('TESTS: test.yml can be called (workflow_call) and no longer runs a second time on main', /workflow_call:/.test(T1) && /branches-ignore: \[main\]/.test(T1));
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
