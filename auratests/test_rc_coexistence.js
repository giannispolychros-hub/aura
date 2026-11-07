// AURA — RELEASE CANDIDATE: THE TWO BRANCHES TOGETHER (John, 7/11/2026, round 6, ADR «7 Νοεμβρίου (γ)»).
//
// release-candidate = hardening-2026-11-a1-local (the final check, the error screen, 142, 143, the timeout text, A1) + candidate-tm (the
// safety detectors with the fixes of 31/10, 2/11 and 3/11 — finding 130 — and the Thought Map). John asked for three things to be checked
// explicitly where the two meet:
//  (1) the Thought Map shows ONLY at the very end of Stage A («done») — no other phase, never while a reply is on its way;
//  (2) the final check does not break the map — the map is not a chat message: the bubble guard of the final check never sees it, and
//      neither the exit (finishReply) nor the guard is part of it;
//  (3) the detectors of candidate-tm WITH the final check — every phrase the fixed detectors must catch gets the app's line from the exit
//      (finishReply), every everyday phrase they must not catch gets nothing, and the passive-ideation gap closed on 31/10 gets the crisis
//      line from the exit; on those sessions the map stays hidden.
// The phrases are READ from the locked phrase files of candidate-tm (auratests/phrases_*.json) — no danger phrase is written here (the
// rule (Λ) of test_danger_from_other_2310.js). On the screen: the full browser run of the release-candidate (sections TM, SD, O5, FK, TO).
const fs = require('fs');
const path = require('path');

const raw = fs.readFileSync(path.join(__dirname, '..', 'src', 'App.jsx'), 'utf8');
let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }
function load(names) {
  const ci = raw.indexOf('const AURA_CORE_PERSONALITY'), ce = raw.indexOf('`;', raw.indexOf('`', ci) + 1);
  const code = raw.slice(0, ci) + 'const AURA_CORE_PERSONALITY = "";' + raw.slice(ce + 2);
  const top = code.slice(0, code.indexOf('\nexport default function AURAv2'));
  const re = /^(?:async )?function ([A-Za-z_$][\w$]*)\(|^(?:const|let) ([A-Za-z_$][\w$]*) =/gm;
  const starts = []; let m; while ((m = re.exec(top))) starts.push({ name: m[1] || m[2], at: m.index });
  const blocks = Object.create(null);
  for (let i = 0; i < starts.length; i++) { const b = top.slice(starts[i].at, i + 1 < starts.length ? starts[i + 1].at : top.length).replace(/(\n\/\/[^\n]*)+\s*$/, '\n');
    if (/return \(\s*</.test(b) || /^const [A-Za-z_$][\w$]* = memo\(/.test(b)) continue; blocks[starts[i].name] = b; }
  const seen = new Set(), order = [];
  const visit = n => { if (seen.has(n) || !blocks[n]) return; seen.add(n); for (const id of new Set(blocks[n].match(/\b[A-Za-z_$][\w$]*\b/g) || [])) if (id !== n && blocks[id]) visit(id); order.push(n); };
  names.forEach(visit);
  try { return new Function(order.map(n => blocks[n]).join('\n') + '\nreturn {' + names.filter(n => blocks[n]).join(',') + '};')(); } catch (e) { console.log('LOAD ERROR — ' + e.message); return {}; }
}
const F = load(['thoughtMapView', 'finishReply', 'dangerInMessages', 'detectSafetySignal', 'classifyCrisisTier', 'buildDangerLine', 'buildCrisisLine']);
const call = (n, ...a) => { try { return typeof F[n] === 'function' ? F[n](...a) : undefined; } catch (e) { return { threw: e && e.message }; } };
const blockFrom = start => { const a = raw.indexOf(start); if (a < 0) return ''; let d = 0, s = false;
  for (let k = raw.indexOf('{', a); k < raw.length; k++) { if (raw[k] === '{') { d++; s = true; } else if (raw[k] === '}') { d--; if (s && !d) return raw.slice(a, k + 1); } } return ''; };
const json = f => JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8'));
const ctx = o => Object.assign({ kind: 'model', mode: 'ANSWER', lastUserText: 'Δεν ξέρω.', modelText: '', safetyPath: false, danger: null, supportShown: false, dangerShown: [] }, o);
const contentOf = r => (r && typeof r.content === 'string') ? r.content : null;

// ── (1) the map only at «done» ───────────────────────────────────────────────────────────────────────────────────────────────────
const ROOT = 'Ότι φοβάμαι να απογοητεύσω τον πατέρα μου.';
const MSGS = [{ role: 'user', content: 'Θέλω να αλλάξω δουλειά αλλά δεν ξέρω αν πρέπει.' }, { role: 'assistant', content: 'Τι σε κρατάει εκεί;' },
  { role: 'user', content: 'Ο μισθός είναι καλός και φοβάμαι την αλλαγή.' }, { role: 'assistant', content: 'Και τι θα έχανες αν έφευγες;' },
  { role: 'user', content: 'Η μητέρα μου πιστεύει ότι πρέπει να μείνω εκεί για πάντα.' }];
const view = o => Object.assign({ active: true, phase: 'done', loading: false,
  stage: { stats: { rootConfirmed: 1 }, stepEnd: 'card', found: ROOT, step: 'Να στείλω μήνυμα στη Μαρία για καφέ.', when: 'Αύριο το απόγευμα.', knew: null },
  messagesAtCard: MSGS, allMessages: MSGS, riskKind: 0, dangerFromOther: false, safetyMode: false, crisisFallback: '' }, o);
{ const v = call('thoughtMapView', view({}));
  assert('(1) at «done», the map — the root word for word, the step and «Πότε» the user\'s own', !!v && v.root === ROOT && v.step === 'Να στείλω μήνυμα στη Μαρία για καφέ.' && v.when === 'Αύριο το απόγευμα.');
  const PHASES = ['ask', 'card', 'clarity', 'correct', 'fits', 'offer', 'smaller', 'step', 'stopped', 'when', 'word', null, undefined, ''];
  assert('(1) every other phase of Stage A (' + PHASES.filter(Boolean).join(', ') + ', none) — no map', PHASES.every(p => call('thoughtMapView', view({ phase: p })) === null));
  assert('(1) at «done» but a reply still on its way — no map', call('thoughtMapView', view({ loading: true })) === null);
  assert('(1) the switch closed (the old flow) — no map', call('thoughtMapView', view({ active: false })) === null); }

// ── (2) the final check does not break the map ───────────────────────────────────────────────────────────────────────────────────
{ const _mb = raw.indexOf('const MessageBubble = memo(function MessageBubble('); const MB = _mb < 0 ? '' : raw.slice(_mb, raw.indexOf('\n});', _mb));
  const MV = blockFrom('function thoughtMapView(');
  const at = raw.indexOf('{thoughtMap && (');
  assert('(2) the bubble guard of the final check (fkShownOk) is in the chat bubble — and only there', MB.includes('fkShownOk(visibleText(') && (raw.match(/fkShownOk\(/g) || []).length === 2);
  assert('(2) the map is drawn once, outside the chat bubble — the guard never sees it', at > 0 && raw.indexOf('{thoughtMap && (', at + 1) < 0 && !MB.includes('thoughtMap'));
  assert('(2) the map\'s view calls neither the exit nor the guard — what it shows is the user\'s words as the flow kept them',
    MV.length > 0 && !/finishReply|fkShownOk|fkPass|SAFE_FAIL_TEXTS/.test(MV));
  const SCREEN = raw.slice(at, raw.indexOf('\n              )}', at));
  assert('(2) … and so does the map\'s screen (no exit, no guard, no failure text in it)', SCREEN.length > 0 && !/finishReply|fkShownOk|fkPass|SAFE_FAIL_TEXTS/.test(SCREEN)); }

// ── (3) the detectors of candidate-tm with the final check ────────────────────────────────────────────────────────────────────────
const KIN = json('phrases_kin_sport_0311.json'), ND2 = json('phrases_no_danger_0211.json'), ND31 = json('phrases_no_danger_3110.json');
const REPLY = 'Σε ακούω. Τι γίνεται τώρα;';
{ const hits = KIN.must_catch.map(p => {
    const d = call('dangerInMessages', [{ role: 'user', content: p }]);
    const r = d ? call('finishReply', REPLY, ctx({ danger: d, safetyPath: true, lastUserText: p, modelText: REPLY })) : null;
    const line = d ? (call('buildDangerLine', d, REPLY, []) || {}).line : '';
    return !!d && !!r && r.failed === false && !!line && contentOf(r) === REPLY + '\n\n' + line && call('thoughtMapView', view({ dangerFromOther: true })) === null;
  });
  assert('(3) finding 130: all ' + KIN.must_catch.length + ' phrases the fixed detector must catch → the exit writes the app\'s danger line under the reply, word for word, once; no map',
    KIN.must_catch.length === 15 && hits.every(Boolean)); }
// The everyday phrases: candidate-tm KEEPS four known false alarms on purpose (John, 2/11 and 3/11: «αν μια αθώα φράση πιάνεται λόγω
// αυτού, ΔΕΝ την αφαιρείς») — in phrases_kin_sport_0311.json no_danger 1 and 9 (alarms already on main) and 13 (the expected false alarm of
// the fix of finding 130), all three named in test_kin_sport_0311.js; in phrases_no_danger_0211.json phrase 5 (the one outside the narrow
// football fix, counted in test_bruises_sport_0211.js). Named here by their place in the files, not written out (the rule (Λ)).
{ const everyday = [...KIN.no_danger, ...ND2.phrases, ...ND31.phrases];
  const KNOWN = new Set([KIN.no_danger[1], KIN.no_danger[9], KIN.no_danger[13], ND2.phrases[5]]);
  const alarmed = everyday.filter(p => call('dangerInMessages', [{ role: 'user', content: p }]) !== null);
  assert('(3) the everyday phrases (' + everyday.length + '): exactly the four known false alarms candidate-tm keeps on purpose alarm — the merge adds none',
    everyday.length === 65 && alarmed.length === 4 && alarmed.every(p => KNOWN.has(p)));
  const clean = everyday.filter(p => !KNOWN.has(p));
  assert('(3) … the other ' + clean.length + ' → no danger, and the exit leaves the reply exactly as it was',
    clean.length === 61 && clean.every(p => call('dangerInMessages', [{ role: 'user', content: p }]) === null &&
      (r => !!r && r.failed === false && contentOf(r) === REPLY)(call('finishReply', REPLY, ctx({ lastUserText: p, modelText: REPLY })))));
  assert('(3) … and on the four, the exit writes the app\'s danger line, as on any message the detector flags (consistent: detector and exit agree)',
    [...KNOWN].every(p => { const d = call('dangerInMessages', [{ role: 'user', content: p }]); const r = call('finishReply', REPLY, ctx({ danger: d, safetyPath: true, lastUserText: p, modelText: REPLY }));
      return !!d && !!r && r.failed === false && contentOf(r) === REPLY + '\n\n' + (call('buildDangerLine', d, REPLY, []) || {}).line; })); }
{ const P = 'θα ήταν πιο απλό να μην υπάρχω καθόλου';
  const tier = call('classifyCrisisTier', P);
  const r = call('finishReply', 'Είμαι εδώ.', ctx({ mode: 'SUPPORTIVE', lastUserText: P, modelText: 'Είμαι εδώ.', safetyPath: true }));
  const line = (call('buildCrisisLine', tier, '', false) || {}).line;
  assert('(3) the passive-ideation gap closed on 31/10 («' + P + '») → a crisis for the detector, and the exit writes that tier\'s line under the reply; no map',
    call('detectSafetySignal', P) === 'CRISIS' && !!line && !!r && r.failed === false && contentOf(r) === 'Είμαι εδώ.\n\n' + line && call('thoughtMapView', view({ riskKind: 1 })) === null); }

console.log(`\n${passed} passed, ${failed} failed`);
