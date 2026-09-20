// AURA — ONE FAILED TURN MUST NOT END THE SESSION
//
// PRODUCTION EVIDENCE, 2026-09-20, the founder's own phone. Vercel logs, one session:
//
//   11:07:21  POST 200
//   11:07:54  POST 400   ← first failure, cause unknown
//   11:08:20  POST 400
//   11:10:17  POST 400   ← never recovered
//
// The last two were GUARANTEED by the app itself. handleSubmit commits the user's message to
// state (App.jsx) and only then awaits the call; when the call fails, generateResponse catches,
// shows an error, and LEAVES THE MESSAGE IN HISTORY with no reply under it. The next send
// therefore produces two consecutive user messages, and the Anthropic Messages API rejects that
// with 400 — for the rest of the session. Only "Νέα συνεδρία" clears it. A single network hiccup
// costs a real person their whole session.
//
// Confirmed by reading, not inferred: api/aura.js returns 405/429/413/500/502 and NEVER 400, so
// every one of those three came straight from Anthropic, rejected in 185–339ms — validation
// speed, not processing. That is the signature of a malformed messages array.
//
// THREE FIXES, three pure functions, following decideTermination's precedent so the logic is
// testable instead of buried in a closure nobody can run:
//
//   A  rollbackFailedTurn   — take the message back out, hand the text back to the person
//   B  isEmptyModelResponse — an empty reply never enters history (it poisons it the same way)
//   C  apiErrorReasonCode   — the reason reached the phone and we threw it away; keep it as a
//                             SMALL INTEGER, so the next occurrence is diagnosable and no
//                             conversation content is ever recorded
//
// C exists because of a measured blind spot: api/aura.js passes Anthropic's error body straight
// through to the browser but never logs it, and callAura looks only at the status number. The
// exact reason for the 11:07:54 failure was delivered to the device and discarded.

const fs = require('fs');
const path = require('path');
const raw = (() => {
  for (const c of ['/App.jsx','/../src/App.jsx','/src/App.jsx','/../App.jsx','/../../src/App.jsx']) {
    const x = path.join(__dirname, c);
    if (fs.existsSync(x)) return fs.readFileSync(x, 'utf8');
  }
  throw new Error('App.jsx not found.');
})();
const _i = raw.indexOf('const AURA_CORE_PERSONALITY');
const _s = raw.indexOf('`', _i) + 1;
const _e = raw.indexOf('`;', _s);
const PROMPT = raw.slice(_s, _e);
const CODE = raw.slice(0, _i) + raw.slice(_e);

let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log('PASS — ' + label); }
  else { failed++; console.log('FAIL — ' + label); }
}
function extract(name) {
  const s = CODE.indexOf('function ' + name + '(');
  if (s < 0) return null;
  const e = CODE.indexOf('\n}', s);
  return e < 0 ? null : CODE.slice(s, e + 2);
}
function load(name) {
  const src = extract(name);
  assert(name + ' is defined', !!src);
  if (!src) return null;
  try { const f = eval('(' + src + ')'); assert(name + ' evaluates standalone', typeof f === 'function'); return f; }
  catch (err) { console.log('FAIL — ' + name + ' eval: ' + err.message); failed++; return null; }
}

const rollbackFailedTurn   = load('rollbackFailedTurn');
const isEmptyModelResponse = load('isEmptyModelResponse');
const apiErrorReasonCode   = load('apiErrorReasonCode');

const U = c => ({ role: 'user', content: c });
const A = c => ({ role: 'assistant', content: c });

// ══ A — ROLLBACK ══════════════════════════════════════════════════════════
if (rollbackFailedTurn) {
  const base = [U('πρώτο'), A('απάντηση'), U('το μήνυμα που απέτυχε')];
  const r = rollbackFailedTurn(base);
  assert('A: the failed message is taken back out of history',
    r && r.messages.length === 2 && r.messages[r.messages.length - 1].role === 'assistant');
  assert('A: its text is handed back so the person can just press Go again',
    r && r.restored === 'το μήνυμα που απέτυχε');
  assert('A: the input array is never mutated',
    base.length === 3 && base[2].content === 'το μήνυμα που απέτυχε');

  // The guard is what makes this safe for all seven callers of generateResponse.
  const endsAssistant = [U('α'), A('β')];
  const r2 = rollbackFailedTurn(endsAssistant);
  assert('A: a history ending in an assistant reply is left alone',
    r2 && r2.messages.length === 2 && r2.restored === null);

  // ONLY ONE. A run of user messages means the damage already happened; removing the whole run
  // would silently delete things the person actually wrote.
  const runOfUsers = [U('α'), A('β'), U('γ'), U('δ')];
  const r3 = rollbackFailedTurn(runOfUsers);
  assert('A: exactly ONE message is removed, never a run',
    r3 && r3.messages.length === 3 && r3.restored === 'δ');

  const r4 = rollbackFailedTurn([U('μόνο ένα')]);
  assert('A: a single-message history rolls back to empty',
    r4 && r4.messages.length === 0 && r4.restored === 'μόνο ένα');

  let threw = false;
  try {
    for (const junk of [null, undefined, [], 'σκουπίδια', {}, [null], [{}]]) rollbackFailedTurn(junk);
  } catch (e) { threw = true; }
  assert('A: junk input never throws', !threw);
  assert('A: an empty history is returned unchanged, with nothing restored',
    (() => { const x = rollbackFailedTurn([]); return x && x.messages.length === 0 && x.restored === null; })());
  assert('A: a blank trailing message restores nothing to the box',
    (() => { const x = rollbackFailedTurn([A('β'), U('   ')]); return x && x.restored === null; })());
}

// ══ B — AN EMPTY REPLY NEVER ENTERS HISTORY ═══════════════════════════════
if (isEmptyModelResponse) {
  assert('B: an empty string is an empty response', isEmptyModelResponse('') === true);
  assert('B: whitespace only is an empty response',
    isEmptyModelResponse('   ') === true && isEmptyModelResponse('\n\n') === true);
  assert('B: null / undefined / non-string are empty responses',
    [null, undefined, 0, {}, []].every(x => isEmptyModelResponse(x) === true));
  assert('B: real text is not', isEmptyModelResponse('Τι σε σταματά;') === false);
  assert('B: a single character is not', isEmptyModelResponse(';') === false);
}
assert('B: callAura refuses to return an empty reply instead of passing it on',
  /isEmptyModelResponse\(/.test(CODE.slice(CODE.indexOf('async function callAura'))));

// ══ C — KEEP THE REASON, AS A NUMBER ══════════════════════════════════════
if (apiErrorReasonCode) {
  const CODES = {};
  const cases = [
    ['roles alternate', 400, { error: { type: 'invalid_request_error', message: 'messages: roles must alternate between "user" and "assistant"' } }],
    ['empty content',   400, { error: { type: 'invalid_request_error', message: 'messages.3.content.0.text: text content blocks must be non-empty' } }],
    ['other invalid',   400, { error: { type: 'invalid_request_error', message: 'max_tokens: must be greater than 0' } }],
    ['auth',            401, { error: { type: 'authentication_error', message: 'invalid x-api-key' } }],
    ['unknown',         418, { error: { type: 'teapot', message: 'no idea' } }],
  ];
  for (const [label, status, body] of cases) {
    const code = apiErrorReasonCode(status, body);
    CODES[label] = code;
    assert('C: ' + label + ' maps to a small integer',
      Number.isInteger(code) && code >= 0 && code <= 99);
  }
  assert('C: the two failure modes we actually care about are DISTINCT codes',
    CODES['roles alternate'] !== CODES['empty content']);
  assert('C: neither collides with the generic invalid-request code',
    CODES['roles alternate'] !== CODES['other invalid'] && CODES['empty content'] !== CODES['other invalid']);

  // THE PRIVACY CONTRACT. This function sits between an upstream error body and the telemetry
  // log; if it can return text, conversation content could ride out on it. It cannot.
  const LEAK = 'ο χρήστης είπε ότι θέλει 4000 ευρώ τον μήνα';
  const leaky = apiErrorReasonCode(400, { error: { type: 'invalid_request_error', message: LEAK } });
  assert('C: a body full of conversation text still yields only a number',
    Number.isInteger(leaky));
  assert('C: nothing it returns contains any of that text',
    JSON.stringify(leaky).indexOf('4000') === -1 && JSON.stringify(leaky).indexOf('χρήστης') === -1);

  let threw = false;
  try {
    for (const junk of [[undefined, undefined], [400, null], [400, 'σκέτο κείμενο'], [null, {}], [400, { error: null }]])
      apiErrorReasonCode(junk[0], junk[1]);
  } catch (e) { threw = true; }
  assert('C: junk input never throws', !threw);
  assert('C: an unreadable body still yields a number, never undefined',
    Number.isInteger(apiErrorReasonCode(400, null)));
}

// ── Wiring ────────────────────────────────────────────────────────────────
// Scoped to the !res.ok branch. Searching the whole file passed a mutation that deleted the
// body-read entirely, because the EMPTY-REPLY guard also records an api_error and satisfied the
// same regex — a guard answered by a different feature guards nothing.
const NOTOK = (() => {
  const i = CODE.indexOf('if (!res.ok) {');
  if (i < 0) return '';
  const j = CODE.indexOf('throw new Error(friendlyApiError(res.status));', i);
  return j < 0 ? '' : CODE.slice(i, j);
})();
assert('C: the upstream-failure branch was located', NOTOK.length > 100);
assert('C: it reads the upstream body instead of looking only at the number',
  /res\.json\(\)/.test(NOTOK));
assert('C: it maps that body to a reason code',
  /apiErrorReasonCode\(/.test(NOTOK));
assert('C: and records it through the counts-only telemetry recorder',
  /recordTelemetry\(\s*["']api_error["']/.test(NOTOK));
assert('C: reading the body never replaces the retry path for 429 / 5xx',
  /retries > 0[\s\S]{0,200}return callAura\(/.test(NOTOK));
assert('C: only integers are handed to it — no message, no body, no text',
  (() => {
    const i = CODE.indexOf('recordTelemetry("api_error"');
    if (i < 0) return false;
    const args = CODE.slice(i, CODE.indexOf(')', i) + 1);
    return !/message|body|text|content|\.error\b/.test(args);
  })());
assert('C: the person still sees the same friendly wording — no raw API text on screen',
  /friendlyApiError\(/.test(CODE));

// Anchored on the block, not on a character window. A fixed {0,400} window failed the moment
// the explanatory comment grew past it — a guard that depends on comment length guards nothing.
const CATCH = (() => {
  const i = CODE.indexOf('} catch(e) {\n      setError(e.message);');
  if (i < 0) return '';
  const j = CODE.indexOf('} finally {', i);
  return j < 0 ? '' : CODE.slice(i, j);
})();
assert('A: generateResponse\'s catch block was located', CATCH.length > 40);
assert('A: the rollback runs where the failure is actually caught',
  /rollbackFailedTurn\(/.test(CATCH));
assert('A: the rolled-back history is what gets written to state',
  /setMessages\(\s*_rb\.messages\s*\)/.test(CATCH));
assert('A: the restored text goes back into the input box',
  /_rb\.restored/.test(CATCH) && /setInput\(/.test(CATCH));
assert('A: the person still sees the error — the rollback does not hide it',
  /setError\(/.test(CATCH));

// ── Nothing here touches the prompt ───────────────────────────────────────
assert('PASSIVE: none of this is wired into the prompt — cached prefix untouched',
  !/rollbackFailedTurn|isEmptyModelResponse|apiErrorReasonCode/.test(PROMPT));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
