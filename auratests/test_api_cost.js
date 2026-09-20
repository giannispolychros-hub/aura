// AURA — API COST WIRING GUARD
//
// WHY THIS FILE EXISTS. A full cost audit measured where the money actually goes, and the answer
// was not conversation length: AURA_CORE_PERSONALITY is ~291,000 characters (~75,000 tokens, the
// estimate — no tokenizer is available here), roughly EIGHT TIMES the capped conversation history.
// At Sonnet 4.6 rates a cache READ of that block costs ~$0.0225 and a 1-hour-TTL cache WRITE costs
// ~$0.45. One write is worth twenty reads. So the only cost question that matters is: how many
// DISTINCT cached blocks does one session create?
//
// THE BUG THIS FILE NOW GUARDS AGAINST. The main conversational path — the one that runs on every
// single turn — built its own system array and put the cache breakpoint AFTER the lens suffix:
//   [{ text: AURA_CORE_PERSONALITY + lensSuffix, cache_control: ... }, { text: dynamicSuffix }]
// Caching is a byte-exact prefix match, so each of the four lenses, plus COMPRESSION, plus the
// CORE-only block that callAura builds for every OTHER path, was a SEPARATE cache entry: seven
// distinct cached contents, six of them ~292,000 characters, each costing its own ~$0.45 write.
// Measured consequences: a returning user pays two writes every session guaranteed (First-WHY
// writes the CORE-only entry at the second message, then every main-path turn writes the
// CORE+lens entry), and every lens switch costs another.
//
// The irony the fix removes: callAura ALREADY split correctly, at the end of CORE, for all six
// other call sites. The one path that runs every turn was the only one bypassing it.
//
// WHAT THE ASSERTIONS HOLD: that every CORE-prefixed system prompt produces ONE identical cached
// block, whatever lens or mode is active. They are behavioural — the real systemBlocks expression
// is lifted out of App.jsx and evaluated against the real prompt values, not re-implemented here.
// A structural "the array literal is gone" check would pass on a fix that merely moved the bug.

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

// ── Pull the REAL prompt values out of the source ────────────────────────────
function tpl(name) {
  const i = raw.indexOf('const ' + name + ' =');
  if (i < 0) return null;
  const s = raw.indexOf('`', i) + 1;
  return raw.slice(s, raw.indexOf('`;', s));
}
const AURA_CORE_PERSONALITY = PROMPT;
const LENS = {
  SIMPLIFY:    AURA_CORE_PERSONALITY + tpl('SYSTEM_LENS_SIMPLIFY'),
  CHALLENGE:   AURA_CORE_PERSONALITY + tpl('SYSTEM_LENS_CHALLENGE'),
  PERSPECTIVE: AURA_CORE_PERSONALITY + tpl('SYSTEM_LENS_PERSPECTIVE'),
  EXPLORE:     AURA_CORE_PERSONALITY + tpl('SYSTEM_LENS_EXPLORE'),
};
const SYSTEM_COMPRESSION = AURA_CORE_PERSONALITY + tpl('SYSTEM_COMPRESSION');
const SYSTEM_SUPPORTIVE  = tpl('SYSTEM_SUPPORTIVE');
const SYSTEM_TERMINATION = tpl('SYSTEM_TERMINATION');
assert('All seven system-prompt values located in the source',
  [SYSTEM_COMPRESSION, SYSTEM_SUPPORTIVE, SYSTEM_TERMINATION, ...Object.values(LENS)].every(v => v && v.length > 100));

// ── Lift the REAL systemBlocks expression out of callAura and evaluate it ────
// Anchored on CACHEABLE_MIN_CHARS, not on `const systemBlocks`: the threshold constant is
// declared immediately above the expression and is referenced inside it, so an extraction that
// starts at the expression itself throws ReferenceError — which surfaces as a SILENT SUITE, not
// as a failure. Same extraction-precision trap that has bitten this test suite before.
const _sbStart = CODE.indexOf('const CACHEABLE_MIN_CHARS');
const _sbEnd = CODE.indexOf('\n  if (_activeCall', _sbStart);
assert('systemBlocks expression located in callAura', _sbStart >= 0 && _sbEnd > _sbStart);
const _sbSrc = CODE.slice(_sbStart, _sbEnd);
let buildBlocks = null;
try {
  eval('buildBlocks = function (systemPrompt) { ' + _sbSrc + ' return systemBlocks; };');
} catch (err) {
  assert('systemBlocks expression evaluates (it did not: ' + err.message + ')', false);
}
assert('systemBlocks is evaluable against the real prompt values', typeof buildBlocks === 'function');

// ── Lift the MAIN PATH's own system construction too ────────────────────────
// THIS IS THE ASSERTION THAT ACTUALLY DISCRIMINATES, and the first draft of this file got it
// wrong: it fed strings straight into buildBlocks, which passed BEFORE the fix as well, because
// callAura's string branch was already correct. The bug was never in callAura — it was that the
// main path handed it a pre-built ARRAY that callAura passes through untouched. So the chain has
// to be evaluated end to end, from what generateResponse actually builds.
const _msStart = CODE.indexOf('const system =', CODE.indexOf('const generateResponse'));
const _msEnd = CODE.indexOf('const rawTextWithTags', _msStart);
assert('Main-path system construction located', _msStart >= 0 && _msEnd > _msStart);
let mainPathSystem = null;
try {
  eval('mainPathSystem = function (basePrompt, dynamicSuffix) { '
     + CODE.slice(_msStart, _msEnd) + ' return system; };');
} catch (err) {
  assert('Main-path system construction evaluates (it did not: ' + err.message + ')', false);
}
assert('Main-path system construction is evaluable', typeof mainPathSystem === 'function');

// ── 1. ONE CACHED BLOCK, whatever the lens ──────────────────────────────────
// This is the whole point. Before the fix these produced five different cached contents.
if (buildBlocks && mainPathSystem) {
  // THE REAL CHAIN: generateResponse builds `system`, hands it to callAura, callAura decides the
  // blocks. Anything short of running all three steps cannot see the bug.
  const cachedTextOf = sp => {
    const b = buildBlocks(sp);
    const marked = b.filter(x => x.cache_control);
    return marked.length === 1 ? marked[0].text : null;
  };
  const cachedTextMainPath = (basePrompt, ctx) => {
    const b = buildBlocks(mainPathSystem(basePrompt, ctx));
    const marked = b.filter(x => x.cache_control);
    return marked.length === 1 ? marked[0].text : null;
  };
  const mainPathPrompts = { ...LENS, COMPRESSION: SYSTEM_COMPRESSION };
  const distinct = new Set();
  for (const [name, sp] of Object.entries(mainPathPrompts)) {
    const t = cachedTextMainPath(sp, '\n[SOME DYNAMIC CTX FOR THIS TURN]');
    assert(`CACHED BLOCK for ${name} is exactly AURA_CORE_PERSONALITY — no lens bytes in it`,
      t === AURA_CORE_PERSONALITY);
    if (t !== null) distinct.add(t.length + ':' + t.slice(-40));
  }
  // A turn where nothing fired: dynamicSuffix is the empty string. The cached block must be the
  // same entry, not a variant — and the CORE text must not acquire a trailing separator.
  assert('CACHED BLOCK is the same entry on a turn where no ctx fired',
    cachedTextMainPath(LENS.SIMPLIFY, '') === AURA_CORE_PERSONALITY);
  // The other six call sites build a CORE-prefixed string too — same entry, not a seventh.
  const otherPaths = cachedTextOf(LENS.SIMPLIFY + '\n\nMISFIRE RECOVERY: ...');
  assert('CACHED BLOCK for the misfire/First-WHY/pivot paths is the SAME block', otherPaths === AURA_CORE_PERSONALITY);
  if (otherPaths !== null) distinct.add(otherPaths.length + ':' + otherPaths.slice(-40));
  assert(`ONE distinct cached block across every lens, mode and path (found ${distinct.size})`,
    distinct.size === 1);

  // The lens must still REACH the model — it moved out of the cached block, it was not deleted.
  const blocks = buildBlocks(mainPathSystem(LENS.CHALLENGE, '\n[CTX]'));
  const rejoined = blocks.map(b => b.text).join('');
  assert('The lens suffix still reaches the model, in the uncached block',
    rejoined === LENS.CHALLENGE + '\n[CTX]' && !blocks[0].text.includes('test assumptions'));
  assert('The per-turn dynamic ctx is in the UNCACHED block, never in the cached one',
    blocks[blocks.length - 1].text.includes('[CTX]') && !blocks[0].text.includes('[CTX]'));
  assert('The CORE block keeps its 1-hour TTL (this change does not decide the TTL question)',
    blocks[0].cache_control && blocks[0].cache_control.ttl === '1h');

  // ── 2. SYSTEM_TERMINATION is cacheable and must be marked ─────────────────
  // ~19,400 chars / ~6,000 tokens of completely static text, used by three call sites at the end
  // of a session, and it carried no cache_control at all — full price, every time.
  const termBlocks = buildBlocks(SYSTEM_TERMINATION);
  assert('TERMINATION: the block is marked for caching',
    termBlocks.length === 1 && !!termBlocks[0].cache_control);
  assert('TERMINATION: it uses the DEFAULT 5-minute TTL, not 1h — the calls are seconds apart',
    termBlocks[0].cache_control && termBlocks[0].cache_control.ttl === undefined);
  assert('TERMINATION: its text is untouched', termBlocks[0].text === SYSTEM_TERMINATION);

  // ── 3. SYSTEM_SUPPORTIVE must NOT be marked ───────────────────────────────
  // ~851 chars is far below the 1,024-token minimum cacheable prefix for Sonnet models. Marking it
  // would silently cache nothing while consuming one of the four breakpoints.
  const supBlocks = buildBlocks(SYSTEM_SUPPORTIVE);
  assert('SUPPORTIVE: too short to cache, so it carries no marker',
    supBlocks.length === 1 && !supBlocks[0].cache_control);
  assert('SUPPORTIVE: its text is untouched', supBlocks[0].text === SYSTEM_SUPPORTIVE);
}

// ── 4. The main path no longer builds its own array ─────────────────────────
// Structural, as a second line of defence: cache_control must exist in exactly ONE place in the
// whole file, inside callAura. A second construction site is how the seven entries happened.
const ccSites = (CODE.match(/cache_control/g) || []).length;
assert(`cache_control appears in callAura only (found ${ccSites} occurrences, expected 2 — CORE + termination)`,
  ccSites === 2);
const genStart = CODE.indexOf('const generateResponse');
const genEnd = CODE.indexOf('const dynamicSuffix', genStart) + 4000;
assert('generateResponse does not construct cache_control itself',
  genStart >= 0 && !CODE.slice(genStart, genEnd).includes('cache_control'));
assert('The main path hands callAura a STRING, not a pre-built array',
  /const system =\s*\n?\s*basePrompt\s*\+\s*dynamicSuffix/.test(CODE));

// ── 5. USAGE LOGGING — counts only, strictly passive ────────────────────────
// The audit could not answer the three questions that decide the TTL — real cache hit rate, how
// often the lens switches, how often pauses exceed five minutes — because the API already returns
// usage on every response, the proxy passes it through untouched, and the client threw it away.
const _ulStart = CODE.indexOf('[AURA usage]');
assert('A usage log line exists', _ulStart >= 0);
// EXACT BLOCK, not a character window around the marker. A window big enough to contain the
// counters also swallowed the `return data.content?.map(b => b.text ...)` line right after the
// catch, so the counts-only assertion below failed on the return statement rather than on
// anything the logger does. The block is delimited by its own first and last statements.
const _ubStart = CODE.indexOf('const _u = data.usage');
const _ubEnd = CODE.indexOf('/* instrumentation must never affect a session */');
assert('Usage instrumentation block delimited', _ubStart >= 0 && _ubEnd > _ubStart);
const _ulBlock = (_ubStart >= 0 && _ubEnd > _ubStart) ? CODE.slice(_ubStart, _ubEnd) : '';
for (const field of ['cache_read_input_tokens', 'cache_creation_input_tokens', 'input_tokens', 'output_tokens']) {
  assert(`USAGE: «${field}» is recorded`, _ulBlock.includes(field));
}
assert('USAGE: it reads the real response object, not a re-implementation',
  /data\.usage/.test(_ulBlock));
assert('USAGE: it is wrapped so logging can never break a session',
  /try\s*\{[\s\S]{0,700}\[AURA usage\][\s\S]{0,400}\}\s*catch/.test(CODE));
assert('USAGE: it writes nothing to storage — no localStorage, no memory, no state',
  !/\[AURA usage\][\s\S]{0,400}(setItem|saveMemory|setMemory|setMessages)/.test(CODE));
// COUNTS ONLY, checked against the WHOLE block. The first version of this anchored the stoplist
// on `[AURA usage]` and looked 400 characters FORWARD — but the console.log is the block's last
// statement, so the regex scanned past the end and matched nothing no matter what the logger did.
// A mutation test caught it: adding `preview: messages[messages.length-1].content.slice(0,60)` to
// the counted object left this assertion green. It now scans the entire block, and that same
// mutation fails it. These are four integers reaching a log a real user can open — the assertion
// that keeps a person's own words out of it has to actually run.
assert('USAGE: COUNTS ONLY — no message, prompt or reply content is ever logged',
  _ulBlock.length > 0 && !/(systemPrompt|messages|data\.content|\btext\b|\.content\b)/.test(_ulBlock));
assert('USAGE: the logged values are reachable without a console (mobile has none)',
  /window\.__auraLastUsage/.test(CODE));
// RESTATED, NOT RELAXED (2026-09-20). This pinned the literal expression `return data.content?.map`,
// and broke when a deliberate and unrelated guard was added between the extraction and the return —
// an empty reply must never enter history, because the API then rejects every later request this
// session makes (see test_failure_recovery.js). The INTENT here is that the COST LOGGER is not in
// the data path, so it is now stated that way rather than by pinning one line of syntax.
assert('USAGE: the reply is still extracted from data.content, unchanged',
  /data\.content\?\.map\(b => b\.text \|\| ""\)\.join\(""\)/.test(CODE));
assert('USAGE: the usage block neither produces nor touches the returned reply — not in the data path',
  _ulBlock.length > 0 && !/_reply|return\s/.test(_ulBlock));

// ── 6. REGRESSION: nothing about the prompt itself moved ────────────────────
assert('AURA_CORE_PERSONALITY contains no interpolation — the cached prefix stays byte-stable',
  !/\$\{/.test(PROMPT));
assert('The four lens prompts still build on AURA_CORE_PERSONALITY',
  Object.values(LENS).every(v => v.startsWith(AURA_CORE_PERSONALITY)));
assert('capMessageHistory still caps the history (unchanged by this commit)',
  CODE.includes('function capMessageHistory'));
assert('max_tokens is still pinned at 1000 client-side', /max_tokens:\s*1000/.test(CODE));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
