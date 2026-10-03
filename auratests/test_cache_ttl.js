// AURA — CACHE TTL OF THE CORE PROMPT (founder decision, 2026-10-03)
//
// WHY THIS FILE EXISTS. The founder topped the API account up with ~0.45€ and it ran out at the
// THIRD reply of a session. That matches the cost estimate in AURA_COST_MEASUREMENT.md almost
// exactly: the first reply pays the cache WRITE of AURA_CORE_PERSONALITY (~75,000–80,000 tokens),
// and with the 1-hour TTL that write is billed at 2x input price (~$0.46–0.50). Every later reply
// only reads the cache (~$0.044 each). One write ≈ ten replies.
//
// THE DECISION. The CORE block now uses the DEFAULT 5-minute TTL, whose write is billed at 1.25x
// instead of 2x (~$0.29 instead of ~$0.46 for the first reply). This changes BILLING ONLY: the model
// receives byte-for-byte the same system text, in the same blocks, so AURA's behaviour cannot change.
// The cost of the trade: a pause of more than 5 minutes between two messages of the same session
// lets the entry expire and the next reply pays the (1.25x) write again. The usage counters already
// logged by callAura (cacheWrite > 0 on a turn after the first) are what show how often that happens.
//
// WHAT THE ASSERTIONS HOLD. The real systemBlocks expression is lifted out of callAura and evaluated
// against the real prompt values (same extraction as test_api_cost.js), so this checks what is
// actually sent, not a re-implementation.

const fs = require('fs');
const path = require('path');
const raw = (() => {
  for (const c of ['/App.jsx','/../src/App.jsx','/src/App.jsx','/../App.jsx','/../../src/App.jsx']) {
    const x = path.join(__dirname, c);
    if (fs.existsSync(x)) return fs.readFileSync(x, 'utf8');
  }
  throw new Error('App.jsx not found.');
})();
const proxy = (() => {
  for (const c of ['/../api/aura.js','/api/aura.js','/../../api/aura.js']) {
    const x = path.join(__dirname, c);
    if (fs.existsSync(x)) return fs.readFileSync(x, 'utf8');
  }
  return null;
})();

const _i = raw.indexOf('const AURA_CORE_PERSONALITY');
const _s = raw.indexOf('`', _i) + 1;
const _e = raw.indexOf('`;', _s);
const AURA_CORE_PERSONALITY = raw.slice(_s, _e);
const CODE = raw.slice(0, _i) + raw.slice(_e);

let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log('PASS — ' + label); }
  else { failed++; console.log('FAIL — ' + label); }
}

function tpl(name) {
  const i = raw.indexOf('const ' + name + ' =');
  if (i < 0) return null;
  const s = raw.indexOf('`', i) + 1;
  return raw.slice(s, raw.indexOf('`;', s));
}
const SIMPLIFY = AURA_CORE_PERSONALITY + tpl('SYSTEM_LENS_SIMPLIFY');
const SYSTEM_TERMINATION = tpl('SYSTEM_TERMINATION');
const SYSTEM_SUPPORTIVE = tpl('SYSTEM_SUPPORTIVE');
assert('Prompt values located in the source',
  AURA_CORE_PERSONALITY.length > 100000 && [SIMPLIFY, SYSTEM_TERMINATION, SYSTEM_SUPPORTIVE].every(v => v && v.length > 100));

// ── Lift the REAL systemBlocks expression out of callAura ────────────────────
const _sbStart = CODE.indexOf('const CACHEABLE_MIN_CHARS');
const _sbEnd = CODE.indexOf('\n  if (_activeCall', _sbStart);
assert('systemBlocks expression located in callAura', _sbStart >= 0 && _sbEnd > _sbStart);
let buildBlocks = null;
try {
  eval('buildBlocks = function (systemPrompt) { ' + CODE.slice(_sbStart, _sbEnd) + ' return systemBlocks; };');
} catch (err) {
  assert('systemBlocks expression evaluates (it did not: ' + err.message + ')', false);
}
assert('systemBlocks is evaluable against the real prompt values', typeof buildBlocks === 'function');

if (typeof buildBlocks === 'function') {
  // ── 1. THE DECISION: CORE is still cached, with the default 5-minute TTL ──
  const blocks = buildBlocks(SIMPLIFY + '\n[CTX FOR THIS TURN]');
  const marked = blocks.filter(b => b.cache_control);
  assert('CORE: exactly one block is marked for caching', marked.length === 1);
  assert('CORE: the marked block is exactly AURA_CORE_PERSONALITY (the shared prefix is unchanged)',
    marked.length === 1 && marked[0].text === AURA_CORE_PERSONALITY);
  assert('CORE: the marker is still an ephemeral cache breakpoint',
    marked.length === 1 && marked[0].cache_control.type === 'ephemeral');
  assert('CORE: it uses the DEFAULT 5-minute TTL (write 1.25x), not "1h" (write 2x)',
    marked.length === 1 && marked[0].cache_control.ttl === undefined);
  assert('CORE: the marker carries nothing but its type (no other cache option was added)',
    marked.length === 1 && Object.keys(marked[0].cache_control).join(',') === 'type');

  // ── 2. BILLING ONLY: the model receives exactly the same text ──
  assert('Same text reaches the model: the blocks rejoin to the original system prompt',
    blocks.map(b => b.text).join('') === SIMPLIFY + '\n[CTX FOR THIS TURN]');
  assert('Same block layout: CORE first, then ONE uncached block with the rest',
    blocks.length === 2 && !blocks[1].cache_control);
  assert('A turn with no ctx produces the same cached entry (no trailing variant)',
    (() => { const b = buildBlocks(SIMPLIFY).filter(x => x.cache_control);
             return b.length === 1 && b[0].text === AURA_CORE_PERSONALITY && b[0].cache_control.ttl === undefined; })());

  // ── 3. The other prompts are unchanged ──
  const term = buildBlocks(SYSTEM_TERMINATION);
  assert('TERMINATION: still marked, still the default 5-minute TTL, text untouched',
    term.length === 1 && !!term[0].cache_control && term[0].cache_control.ttl === undefined && term[0].text === SYSTEM_TERMINATION);
  const sup = buildBlocks(SYSTEM_SUPPORTIVE);
  assert('SUPPORTIVE: still too short to cache, still unmarked, text untouched',
    sup.length === 1 && !sup[0].cache_control && sup[0].text === SYSTEM_SUPPORTIVE);
}

// ── 4. Source-level: no 1-hour TTL is requested anywhere ─────────────────────
assert('No "ttl: 1h" remains anywhere in App.jsx',
  !/ttl\s*:\s*["'`]1h["'`]/.test(CODE));
assert('No ttl option of any kind is set on a cache_control in App.jsx',
  !/cache_control\s*:\s*\{[^}]*\bttl\b/.test(CODE));

// ── 5. Nothing else about the request moved ─────────────────────────────────
const _cbStart = CODE.indexOf('async function callAura(');
const _cbEnd = CODE.indexOf('\n}\n', _cbStart);
const callAuraSrc = (_cbStart >= 0 && _cbEnd > _cbStart) ? CODE.slice(_cbStart, _cbEnd) : '';
assert('callAura located', callAuraSrc.length > 1000);
assert('Same model requested by the client', /model:\s*"claude-sonnet-4-6"/.test(callAuraSrc));
assert('Same output cap (max_tokens 1000)', /max_tokens:\s*1000/.test(callAuraSrc));
assert('The system blocks are still what is sent', /system:\s*systemBlocks/.test(callAuraSrc));
assert('The proxy still pins the same model server-side',
  proxy !== null && /ALLOWED_MODEL\s*=\s*"claude-sonnet-4-6"/.test(proxy));
assert('The proxy still forwards system untouched (the TTL travels inside it)',
  proxy !== null && /system:\s*body\.system/.test(proxy));

// ── 6. The decision stays checkable: the cache-write counter is still recorded ──
const _ubStart = CODE.indexOf('const _u = data.usage');
const _ubEnd = CODE.indexOf('/* instrumentation must never affect a session */', _ubStart);
const usageBlock = (_ubStart >= 0 && _ubEnd > _ubStart) ? CODE.slice(_ubStart, _ubEnd) : '';
assert('USAGE: cache writes are still counted (cacheWrite > 0 after the first turn = a pause over 5 minutes)',
  /cacheWrite:\s*_u\.cache_creation_input_tokens/.test(usageBlock));
assert('USAGE: cache reads are still counted', /cacheRead:\s*_u\.cache_read_input_tokens/.test(usageBlock));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
