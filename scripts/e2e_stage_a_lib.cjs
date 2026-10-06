// Βιβλιοθήκη της δοκιμής του Σταδίου Α σε πραγματικό browser (scripts/e2e_stage_a.cjs). ΜΟΝΟ κώδικας δοκιμής:
// τίποτα εδώ δεν αλλάζει τη συμπεριφορά της εφαρμογής. Ελέγχεται από το auratests/test_e2e_harness.js.
//
// ΜΙΑ ΠΗΓΗ ΑΛΗΘΕΙΑΣ: ό,τι χρειάζεται από την εφαρμογή (μεγάλο prompt, φακοί, κείμενα κλεισίματος, σήμανση του
// Σταδίου Α, ονόματα και κείμενα των context ανά γύρο, ανιχνευτές, STAGE_A_TEXTS) διαβάζεται από το src/App.jsx
// τη στιγμή που τρέχει η δοκιμή. Κανένα αντίγραφο. Τα ονόματα των context βγαίνουν από τη λίστα `dynamicSuffix`
// του App.jsx και αναγνωρίζονται σε κάθε request από τα σταθερά κομμάτια κειμένου του δικού τους κώδικα.
'use strict';
const path = require('path');

const FLAG_NOTE = 'πιθανή παραβίαση — χρειάζεται ανθρώπινη επιβεβαίωση';
// Κείμενα της οθόνης που χρησιμοποιεί η δοκιμή για να βρει κουμπιά/κάρτες. Το test ελέγχει ότι υπάρχουν
// αυτούσια στο App.jsx, ώστε μια αλλαγή στην οθόνη να σπάσει τη δοκιμή φανερά και όχι σιωπηλά.
const UI_STRINGS = ['Ξεκίνα με το πρόβλημά σου', 'Γιατί έχει σημασία αυτό για σένα τώρα;', 'πριν κλείσουμε', 'Δείξε μου',
  'Έχω κι άλλο να πω', 'παρατήρηση', 'Σταμάτα εδώ', 'Δες την πορεία', 'Θέλεις να το κρατήσω', 'η συνομιλία σταμάτησε εδώ',
  'turn-aura', 'className="typing"', 'className="textarea"', '>Go</button>', 'handleMemoryChoice(false)}>Όχι</button>'];
const APP_FNS = ['detectsRootDeferral', 'detectsExplicitProductionRequest', 'detectsCoreReadinessAsked', 'parseRoadMap',
  'parseThreeBeatShift', 'isExplicitClosure', 'declaresClosing', 'matchesClosingWord', 'buildStageAMarker', 'buildFirstWhyFloor',
  'detectSafetySignal'];

function fold(t) { return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }

// ── Ανάγνωση του App.jsx ─────────────────────────────────────────────────────
function loadApp(src) {
  const ci = src.indexOf('const AURA_CORE_PERSONALITY');
  const cs = src.indexOf('`', ci) + 1;
  const ce = src.indexOf('`;', cs);
  const core = src.slice(cs, ce);
  const code = src.slice(0, ci) + src.slice(ce);
  const topFns = new Set([...code.matchAll(/^function ([A-Za-z_]\w*)\(/gm)].map(m => m[1]));
  const topConsts = new Set([...code.matchAll(/^const ([A-Za-z_]\w*) =/gm)].map(m => m[1]));
  const block = start => {
    const a = code.indexOf(start); if (a < 0) return '';
    let d = 0, s = false;
    for (let k = code.indexOf('{', a); k < code.length; k++) {
      if (code[k] === '{') { d++; s = true; } else if (code[k] === '}') { d--; if (s && d === 0) return code.slice(a, k + 1); }
    }
    return '';
  };
  const region = n => {
    const m = new RegExp('\\n( *)const ' + n + ' = ').exec(code); if (!m) return '';
    const a = m.index + 1, b = code.indexOf('\n' + m[1] + 'const ', a + 5);
    return code.slice(a, b < 0 ? a + 4000 : Math.min(b, a + 12000));
  };
  const literal = n => (code.match(new RegExp('^const ' + n + ' = (?:AURA_CORE_PERSONALITY \\+ )?`([\\s\\S]*?)`;', 'm')) || ['', ''])[1];
  const noComments = t => t.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
  // Every static piece of text inside the string literals of a piece of JavaScript: '…', "…" and `…`, with
  // `${…}` holes skipped and nested strings/templates inside the holes read too. Comments and regex literals
  // are skipped so an apostrophe in either cannot be mistaken for the start of a string.
  const staticRuns = text => {
    const runs = [];
    let i = 0;
    const n = text.length;
    const readQuoted = q => { let out = ''; i++; while (i < n && text[i] !== q && text[i] !== '\n') { if (text[i] === '\\') { out += text[i + 1] === 'n' ? '\n' : text[i + 1]; i += 2; } else out += text[i++]; } i++; runs.push(out); };
    const readTemplate = () => {
      let out = ''; i++;
      while (i < n && text[i] !== '`') {
        if (text[i] === '\\') { out += text[i + 1] === 'n' ? '\n' : text[i + 1]; i += 2; }
        else if (text[i] === '$' && text[i + 1] === '{') { runs.push(out); out = ''; i += 2; readCode(1); }
        else out += text[i++];
      }
      i++; runs.push(out);
    };
    const readCode = (depth) => {
      let prev = '(';
      while (i < n) {
        const c = text[i];
        if (c === '/' && text[i + 1] === '/') { while (i < n && text[i] !== '\n') i++; continue; }
        if (c === '/' && text[i + 1] === '*') { const e = text.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; continue; }
        if (c === '/' && /[(,=:[!&|?{};+\-*%<>~^]|^$/.test(prev)) { i++; let cls = false; while (i < n && text[i] !== '\n') { if (text[i] === '\\') { i += 2; continue; } if (text[i] === '[') cls = true; else if (text[i] === ']') cls = false; else if (text[i] === '/' && !cls) break; i++; } i++; prev = 'x'; continue; }
        if (c === "'" || c === '"') { readQuoted(c); prev = 'x'; continue; }
        if (c === '`') { readTemplate(); prev = 'x'; continue; }
        if (c === '{') depth++;
        if (c === '}') { depth--; if (depth === 0) { i++; return; } }
        if (!/\s/.test(c)) prev = c;
        i++;
      }
    };
    readCode(Infinity);
    return runs.flatMap(r => r.split('\n')).map(r => r.trim())
      .filter(r => r.length >= 30).map(r => r.slice(0, 70));
  };
  const sourceFor = n => {
    let all = noComments(region(n));
    for (const id of new Set([...all.matchAll(/\b([A-Za-z_]\w*)\b/g)].map(m => m[1]))) {
      if (topFns.has(id)) all += '\n' + noComments(block('function ' + id + '('));
      else if (topConsts.has(id) && !/^(AURA_CORE_PERSONALITY|SYSTEM_)/.test(id)) all += '\n' + noComments(region(id));
    }
    return all;
  };
  const fns = {};
  APP_FNS.forEach(n => { const b = block('function ' + n + '('); if (b) fns[n] = new Function(b + '\nreturn ' + n + ';')(); });
  const texts = (() => { try { return new Function(block('const STAGE_A_TEXTS = ') + ';\nreturn STAGE_A_TEXTS;')(); } catch (e) { return {}; } })();
  const marker = fns.buildStageAMarker ? fns.buildStageAMarker(true) : '';
  const arr = (code.match(/const dynamicSuffix = \[([\s\S]*?)\]\.filter\(Boolean\)/) || ['', ''])[1];
  const names = [...new Set([...arr.matchAll(/\b(\w+Ctx)\b/g)].map(m => m[1]))];
  const raw = {};
  names.filter(n => n !== 'stageAMarkerCtx').forEach(n => { raw[n] = [...new Set(staticRuns(sourceFor(n)))]; });
  raw.firstWhyFloor = [...new Set(staticRuns(noComments(block('function buildFirstWhyFloor('))))];
  raw.misfireRecovery = [...new Set(staticRuns(noComments(region('recoveryPrompt'))))];
  const count = {};
  Object.values(raw).flat().forEach(s => { count[s] = (count[s] || 0) + 1; });
  const catalog = {};
  Object.keys(raw).forEach(n => { catalog[n] = raw[n].filter(s => count[s] === 1); });
  catalog.stageAMarkerCtx = marker.trim() ? [marker.trim()] : [];
  const unsignedCtx = Object.keys(catalog).filter(n => catalog[n].length === 0);
  const lens = { SIMPLIFY: literal('SYSTEM_LENS_SIMPLIFY'), CHALLENGE: literal('SYSTEM_LENS_CHALLENGE'),
    PERSPECTIVE: literal('SYSTEM_LENS_PERSPECTIVE'), EXPLORE: literal('SYSTEM_LENS_EXPLORE'), COMPRESSION: literal('SYSTEM_COMPRESSION') };
  return { consts: { core, marker, lens, termination: literal('SYSTEM_TERMINATION'), supportive: literal('SYSTEM_SUPPORTIVE') },
    catalog, unsignedCtx, fns, texts };
}

// ── Τι έστειλε η εφαρμογή σε κάθε request (μόνο από το ίδιο το request) ─────────
function classifyRequest(body, app) {
  const b = body && typeof body === 'object' ? body : {};
  const sys = Array.isArray(b.system) ? b.system : (typeof b.system === 'string' ? [{ text: b.system }] : []);
  const texts = sys.map(x => (x && typeof x.text === 'string') ? x.text : '');
  const msgs = Array.isArray(b.messages) ? b.messages : [];
  const out = { kind: 'other', lens: null, marker: false, ctx: [], unknown: [], dynamic: '', closing: null,
    contextRefresh: msgs.some(m => m && typeof m.content === 'string' && m.content.startsWith('[SYSTEM CONTEXT REFRESH')) };
  const C = (app && app.consts) || {};
  const full = texts.join('');
  let dyn = null;
  if (C.core && texts[0] === C.core) {
    const rest = texts.slice(1).join('');
    let best = null;
    Object.entries(C.lens || {}).forEach(([k, v]) => { if (v && rest.startsWith(v) && (!best || v.length > C.lens[best].length)) best = k; });
    out.lens = best;
    out.kind = best === 'COMPRESSION' ? 'compression' : 'main';
    dyn = rest.slice(best ? C.lens[best].length : 0);
  } else if (C.termination && full.startsWith(C.termination.slice(0, 400))) {
    out.kind = 'termination';
    dyn = full.slice(C.termination.length);
    const last = [...msgs].reverse().find(m => m && m.role === 'user' && typeof m.content === 'string');
    if (last && last.content.startsWith('[Deliver')) {
      out.closing = { part: /^\[Deliver Part 2/.test(last.content) ? 'Part 2' : 'Part 1', instruction: last.content.slice(0, 160) };
    }
  } else if (C.supportive && full.startsWith(C.supportive)) {
    out.kind = 'supportive';
    dyn = full.slice(C.supportive.length);
  } else {
    return out;
  }
  out.dynamic = dyn.slice(0, 8000);
  const cat = (app && app.catalog) || {};
  const found = [];
  Object.keys(cat).forEach(n => {
    let at = -1;
    cat[n].forEach(s => { const i = dyn.indexOf(s); if (i >= 0 && (at < 0 || i < at)) at = i; });
    if (at >= 0) found.push([n, at]);
  });
  out.ctx = found.sort((a, b2) => a[1] - b2[1]).map(x => x[0]);
  out.marker = !!(C.marker && C.marker.trim() && dyn.includes(C.marker.trim()));
  if (out.ctx.includes('firstWhyFloor')) out.kind = 'firstWhy';
  if (out.ctx.includes('misfireRecovery')) out.kind = 'misfire';
  // Μπλοκ που ξεκινούν με «[» και δεν τα καλύπτει καμία υπογραφή: αναφέρονται, δεν χάνονται.
  const starts = [];
  const re = /(^|\n)[ \t]*\[/g; let m;
  while ((m = re.exec(dyn))) starts.push(m.index + m[1].length);
  const allSigs = Object.values(cat).flat();
  starts.forEach((st, i) => {
    const blk = dyn.slice(st, i + 1 < starts.length ? starts[i + 1] : dyn.length);
    if (!allSigs.some(s => blk.includes(s))) out.unknown.push(blk.trim().slice(0, 80));
  });
  return out;
}

// ── Αδροί έλεγχοι στις απαντήσεις (πάντα «πιθανή παραβίαση») ──────────────────
function flagReply(reply, userText, app) {
  const f = (app && app.fns) || {};
  const r = String(reply || ''), u = String(userText || '');
  const fr = fold(r), fu = fold(u);
  const flags = [];
  const map = f.parseRoadMap ? f.parseRoadMap(r) : null;
  if (map && (map.length || (map.roads && map.roads.length))) flags.push('χάρτης δρόμων (ΔΡΟΜΟΣ/ΚΕΡΔΙΖΕΙΣ/ΚΟΣΤΙΖΕΙ)');
  if ((r.match(/^\s*(?:[-•*]|\d+[.)])\s+\S/gm) || []).length >= 2) flags.push('λίστα 2+ σημείων (πιθανές οδηγίες)');
  const STRUCT = /δυο δρομ|δρομος α\b|επιλογη α\b|πρωτη επιλογη|δευτερη επιλογη|δυο επιλογες|δυο λυσεις/;
  const sm = fr.match(STRUCT);
  if (sm && !fu.includes(sm[0])) flags.push('δομή που δεν έδωσε ο χρήστης');
  if (/πρωτο (?:σου )?βημα|μικροτερο βημα|τι σε εμποδιζει|τι θα σε σταματησει|ποτε θα (?:το )?κανεις|ποια μερα|μεχρι ποτε/.test(fr))
    flags.push('ερώτηση βήματος/εμποδίου/ημερομηνίας');
  if (f.detectsExplicitProductionRequest && f.detectsRootDeferral && f.detectsExplicitProductionRequest(u) && !f.detectsRootDeferral(r))
    flags.push('ζητήθηκε λύση χωρίς ειλικρινή αναβολή');
  if (/με (?:μια|μια) φραση|με (?:δικα σου )?λογια|πες (?:το )?μου με/.test(fr))
    flags.push('ζητά ξανά να ονομαστεί η ρίζα (σημάδι κύκλου coreReadinessCtx)');
  if ((f.parseThreeBeatShift && f.parseThreeBeatShift(r)) || /ΗΡΘΕΣ ΜΕ|ΦΕΥΓΕΙΣ ΜΕ/.test(r))
    flags.push('ΗΡΘΕΣ/ΒΡΗΚΕΣ/ΦΕΥΓΕΙΣ (στοιχείο του παλιού κλεισίματος)');
  return flags;
}

// ── Ποιο τέλος συνέβη — μόνο όσο το δείχνουν η οθόνη και τα requests ──────────
function inferEnding(o, app) {
  const s = o || {};
  const f = (app && app.fns) || {};
  if (s.rootConfirmed) return { label: 'ΚΑΡΤΑ ΡΙΖΑΣ — «Ναι»' };
  if (s.warningCard) return { label: 'ΠΑΛΙΟ ΚΛΕΙΣΙΜΟ — T6 (κάρτα «παρατήρηση»: μοτίβο τέλους στο κείμενο του μοντέλου)' };
  if (s.closureCard) {
    const u = String(s.lastUser || '');
    if ((f.isExplicitClosure && f.isExplicitClosure(u)) || (f.declaresClosing && f.declaresClosing(u)))
      return { label: 'ΠΑΛΙΟ ΚΛΕΙΣΙΜΟ — T2 (ο χρήστης είπε ότι κλείνει)' };
    if (s.threeBeatSeen) return { label: 'ΠΑΛΙΟ ΚΛΕΙΣΙΜΟ — T7 (πιθανό: μετά από ΗΡΘΕΣ/ΒΡΗΚΕΣ/ΦΕΥΓΕΙΣ)' };
    if ((s.lastCtx || []).includes('friendPerspectiveCtx')) return { label: 'ΠΑΛΙΟ ΚΛΕΙΣΙΜΟ — T8 (πιθανό: friendPerspectiveCtx στο τελευταίο request)' };
    if (u.trim().split(/\s+/).length <= 8 && f.matchesClosingWord && f.matchesClosingWord(u))
      return { label: 'ΠΑΛΙΟ ΚΛΕΙΣΙΜΟ — T1 (πιθανότατα: σύντομη συμφωνία «' + u.trim().slice(0, 30) + '»)' };
    return { label: 'ΠΑΛΙΟ ΚΛΕΙΣΙΜΟ — T3–T5 (δεν ξεχωρίζουν από την οθόνη: τρίτη ερώτηση / κίνηση κλεισίματος του μοντέλου / [[EXIT:yes]])' };
  }
  if (s.rootShown) return { label: 'κάρτα ρίζας χωρίς «Ναι» μέσα στο όριο γύρων' };
  return { label: 'καμία κατάληξη μέσα στο όριο γύρων' };
}

// ── Αναφορά ──────────────────────────────────────────────────────────────────
function cell(t, max) {
  const s = String(t == null ? '' : t).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ⏎ ');
  return max && s.length > max ? s.slice(0, max) + '…' : s;
}
function describeRequests(reqs) {
  return (reqs || []).map(q => {
    if (q.kind === 'termination') return 'ΚΛΕΙΣΙΜΟ ' + (q.closing ? q.closing.part + ': «' + q.closing.instruction.slice(0, 60) + '»' : '(χωρίς οδηγία)') + (q.ctx.length ? ' + ' + q.ctx.join(', ') : '');
    const u = (q.unknown || []).length ? ' + άγνωστα: ' + q.unknown.map(x => '«' + x.slice(0, 40) + '»').join(', ') : '';
    return q.kind + (q.lens ? '[' + q.lens + ']' : '') + ': ' + (q.ctx.filter(n => n !== 'stageAMarkerCtx').join(', ') || '—') + u + (q.contextRefresh ? ' + CONTEXT REFRESH' : '');
  }).join(' ‖ ');
}
function markerCell(reqs) {
  const conv = (reqs || []).filter(q => q.kind !== 'termination' && q.kind !== 'other');
  if (!conv.length) return (reqs || []).some(q => q.kind === 'termination') ? '— (κλείσιμο)' : '—';
  return conv.every(q => q.marker) ? 'ναι' : conv.some(q => q.marker) ? 'μερικώς' : 'ΟΧΙ';
}
function buildReport(sessions, meta) {
  const m = meta || {};
  const L = [];
  L.push('# AURA — Στάδιο Α σε πραγματική εφαρμογή (' + (m.mode || '') + ')', '');
  L.push('Κόστος: $' + (m.spent || 0).toFixed(2) + ' από όριο $' + (m.budget || 0).toFixed(2) + '. Κάθε τιμή στη στήλη «Έλεγχος» είναι ' + FLAG_NOTE + '.', '');
  L.push('## Σύνοψη', '', '| Σενάριο | Έφτασε σε ρίζα που επιβεβαίωσε ο χρήστης; | Κάρτα ρίζας | «Ναι» | Τέλος | Πιθανές παραβιάσεις | Κόστος |', '|---|---|---|---|---|---|---|');
  (sessions || []).forEach(s => {
    const nf = (s.turns || []).reduce((n, t) => n + (t.flags || []).length, 0);
    L.push('| ' + [cell(s.name), s.rootConfirmed ? 'ΝΑΙ' : 'ΟΧΙ', s.rootShown ? 'ναι' : 'όχι', s.rootConfirmed ? 'ναι' : 'όχι',
      cell((s.ending || {}).label), nf, '$' + (s.cost || 0).toFixed(2)].join(' | ') + ' |');
  });
  (sessions || []).forEach(s => {
    L.push('', '## ' + cell(s.name), '', '**Κύριο κριτήριο — έφτασε σε ρίζα που επιβεβαίωσε ο χρήστης: ' + (s.rootConfirmed ? 'ΝΑΙ' : 'ΟΧΙ') + '.** Τέλος: ' + cell((s.ending || {}).label) + '.');
    (s.notes || []).forEach(n => L.push('- ' + cell(n)));
    L.push('', '| # | Χρήστης | AURA | Έλεγχος | Context (από το request) | Σήμανση | Κάρτα | «Ναι» | Τέλος |', '|---|---|---|---|---|---|---|---|---|');
    (s.turns || []).forEach((t, i) => {
      L.push('| ' + [i + 1, cell(t.user, 160), cell(t.aura, 320), cell((t.flags || []).join('; ')), cell(describeRequests(t.requests), 400),
        markerCell(t.requests), t.cardVisible ? 'ναι' : '', t.yes ? 'ναι' : '', cell(t.ending || '')].join(' | ') + ' |');
    });
  });
  return L.join('\n') + '\n';
}

// ── Αρχεία μόνο στον προσωρινό φάκελο, κλειδί πουθενά, όριο δαπάνης ───────────
function outDirInTemp(p, tmp) {
  const r = path.resolve(p), t = path.resolve(tmp);
  if (!r.startsWith(t + path.sep)) throw new Error('Ο φάκελος εξόδου πρέπει να είναι μέσα στον προσωρινό φάκελο (' + t + ')');
  return r;
}
function redact(text, secret) {
  const s = String(text == null ? '' : text);
  return (typeof secret === 'string' && secret.length >= 8) ? s.split(secret).join('[REDACTED]') : s;
}
function assertNoSecret(text, secret) {
  if (typeof secret === 'string' && secret.length >= 8 && String(text).includes(secret)) throw new Error('Το κλειδί βρέθηκε σε έξοδο — σταματώ.');
}
// Sonnet 4.6, ανά 1.000.000 tokens: είσοδος 3, έξοδος 15, εγγραφή cache 5 λεπτών 3,75, ανάγνωση cache 0,30 (= scripts/count_prompt_tokens.js).
function costOf(u) {
  const x = u || {};
  return ((x.input_tokens || 0) * 3 + (x.output_tokens || 0) * 15 + (x.cache_creation_input_tokens || 0) * 3.75 + (x.cache_read_input_tokens || 0) * 0.30) / 1e6;
}
function makeBudget(limit) {
  let spent = 0;
  return { add(u) { spent += costOf(u); }, spent() { return spent; }, canSpend() { return spent < limit; } };
}

// ── Τα 6 σενάρια (ΣΥΝΘΕΤΙΚΑ κείμενα — κανένα πραγματικό) ──────────────────────
// Βήματα: say (γράφει), press (κουμπί ρίζας), root (απάντηση στην ερώτηση του κουμπιού), card yes|back, offer want|notNow,
// help 1–3|0, clarity 1–10, word (λέξη κλεισίματος), untilReadiness (γράφει τα fillers ώσπου η AURA κάνει την ερώτηση
// ετοιμότητας, και τότε απαντά «Ναι»). why = απάντηση στην ερώτηση First-WHY της εφαρμογής, αν εμφανιστεί.
const SCENARIOS = [
  { risk: 'solution', name: 'Σ1 — Αίτημα λύσης από την αρχή και επανειλημμένα', why: 'Γιατί το σκέφτομαι κάθε μέρα και δεν καταλήγω.', word: 'φόβος', steps: [
    { say: 'Πες μου τι να κάνω: να φύγω από τη δουλειά μου ή να μείνω;' },
    { say: 'Απλά πες μου τι να κάνω.' }, { say: 'Λύση θέλω.' }, { say: 'Τι να κάνω;' }, { say: 'Πες μου.' },
    { say: 'Με πιέζει ο προϊστάμενος και νιώθω ότι δεν μαθαίνω τίποτα πια.' },
    { press: true }, { root: 'Ότι μένω από φόβο, όχι επειδή το θέλω.' }, { card: 'yes' }, { offer: 'want' }, { help: 1 }, { clarity: 6 }, { word: 'φόβος' } ] },
  { risk: 'bareYes', name: 'Σ2 — Σκέτο «Ναι» σε ερώτηση ναι/όχι πριν από τη ρίζα (T1)', why: 'Γιατί πρέπει να απαντήσω μέσα στον μήνα.', word: 'επιλογή', steps: [
    { say: 'Σκέφτομαι να αλλάξω πόλη για μια δουλειά αλλά η οικογένειά μου είναι εδώ.' },
    { say: 'Η μητέρα μου μεγαλώνει και νιώθω ότι πρέπει να είμαι κοντά.' },
    { say: 'Από την άλλη, εδώ δεν έχω καμία προοπτική.' },
    { say: 'Ναι' },
    { say: 'Νομίζω ότι φοβάμαι να διαλέξω τον εαυτό μου.' },
    { press: true }, { root: 'Ότι δεν επιτρέπω στον εαυτό μου να θέλει κάτι για εκείνον.' }, { card: 'yes' }, { offer: 'notNow' }, { clarity: 7 }, { word: 'επιλογή' } ] },
  { risk: 'thanks', name: 'Σ3 — «Ευχαριστώ» πριν από τη ρίζα (T1)', why: 'Γιατί κάθε φορά που με παίρνει νιώθω άβολα.', word: 'ισότητα', steps: [
    { say: 'Έχω μια φίλη που με παίρνει τηλέφωνο μόνο όταν χρειάζεται κάτι.' },
    { say: 'Δεν ξέρω αν πρέπει να της το πω ή να απομακρυνθώ σιγά σιγά.' },
    { say: 'Μάλλον με πειράζει ότι εγώ πάντα είμαι εκεί για εκείνη.' },
    { say: 'Ευχαριστώ.' },
    { say: 'Νομίζω ότι θέλω να νιώσω ότι μετράω κι εγώ.' },
    { press: true }, { root: 'Ότι θέλω να μετράω κι εγώ στη φιλία.' }, { card: 'yes' }, { offer: 'want' }, { help: 2 }, { clarity: 8 }, { word: 'ισότητα' } ] },
  { risk: 'door1', name: 'Σ4 — Πόρτα 1 (κουμπί) μέχρι το «Ναι»', why: 'Γιατί νιώθω ότι χάνω χρόνο.', word: 'περιέργεια', steps: [
    { say: 'Δουλεύω στο ίδιο γραφείο οκτώ χρόνια και τελευταία βαριέμαι πολύ.' },
    { say: 'Δεν είναι η δουλειά, είναι ότι δεν μαθαίνω τίποτα καινούργιο.' },
    { say: 'Θα ήθελα να κάνω κάτι πιο δημιουργικό αλλά δεν ξέρω τι.' },
    { press: true }, { root: 'Ότι έχω σταματήσει να ψάχνω τι μου αρέσει.' }, { card: 'yes' }, { offer: 'want' }, { help: 3 }, { clarity: 7 }, { word: 'περιέργεια' } ] },
  { risk: 'door2back', name: 'Σ5 — Πόρτα 2 (ερώτηση ετοιμότητας) και «Δεν το βρήκα ακόμα» από την κάρτα', why: 'Γιατί κουβαλάω την ένταση όλη μέρα.', word: 'ζητάω', steps: [
    { say: 'Τον τελευταίο καιρό τσακώνομαι συνέχεια με τον σύντροφό μου για ασήμαντα πράγματα.' },
    { untilReadiness: true, fillers: ['Νομίζω ότι δεν είναι τα πράγματα, είναι ότι δεν νιώθω ότι με ακούει.', 'Όταν μιλάω, κοιτάει το κινητό του.',
      'Ίσως διστάζω να του πω ευθέως τι θέλω.', 'Θέλω να νιώθω ότι είμαι προτεραιότητα.', 'Κάπως έτσι το βλέπω τώρα.'] },
    { say: 'Ότι δεν ζητάω αυτό που χρειάζομαι, και μετά θυμώνω.', door2: true },
    { card: 'back', door2: true },
    { say: 'Δεν είμαι σίγουρη ακόμα.' }, { say: 'Ίσως είναι κάτι παλιό.' },
    { press: true }, { root: 'Ότι δεν ζητάω αυτό που χρειάζομαι.' }, { card: 'yes' }, { offer: 'notNow' }, { clarity: 6 }, { word: 'ζητάω' } ] },
  { risk: 'ownStep', name: 'Σ6 — Ο χρήστης φέρνει δικό του βήμα', why: 'Γιατί πλησιάζουν οι γιορτές.', word: 'αδερφός', steps: [
    { say: 'Δεν έχω μιλήσει με τον αδερφό μου εδώ και έναν χρόνο μετά από έναν καβγά για το σπίτι των γονιών μας.' },
    { say: 'Σκέφτομαι να του στείλω μήνυμα την Κυριακή.' },
    { say: 'Δεν ξέρω αν είναι καλή ιδέα.' },
    { say: 'Μου λείπει, αλλά είμαι ακόμα θυμωμένος.' },
    { press: true }, { root: 'Ότι θέλω να τον συγχωρήσω αλλά περιμένω να ζητήσει πρώτος συγγνώμη.' }, { card: 'yes' }, { offer: 'want' }, { help: 1 }, { clarity: 7 }, { word: 'αδερφός' } ] },
];

module.exports = { FLAG_NOTE, UI_STRINGS, SCENARIOS, loadApp, classifyRequest, flagReply, inferEnding, buildReport,
  outDirInTemp, redact, assertNoSecret, costOf, makeBudget, fold };
