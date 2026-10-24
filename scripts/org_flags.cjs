// AURA stress tool only (never loaded by the app) — John, 24/10/2026, Π3 step 2.
// A FLAG LIST of organisation names, acronyms, web addresses and help numbers in the model's RAW text that the user did not write and
// that are not in the app's own help-line table — for a person to read. It is NOT a pass/fail check and NOT a complete detector of
// organisations: it misses names written in small letters without a tell-tale word ("το νοσοκομείο", "ο δήμος", "η πολεοδομία"), names
// given only by role ("η αρμόδια υπηρεσία"), misspellings and paraphrases. It also says nothing about legal facts, health statistics,
// money facts or plans: those are judged separately, by reading the raw text.
// Three layers, kept apart: RAW (what the model wrote), AFTER FILTERS (the app's own text filters, lifted out of App.jsx — see below)
// and SCREEN (what the user saw). Each flag says in which layers it is still there.
'use strict';
const fs = require('fs');
const path = require('path');

// ── 1. The app's own text filters, lifted out of App.jsx with everything they call ─────────────────────────────────────────────
// The chain of cleanLabels on the main reply, in the app's order: stripInternalLabels → stripForeignHelplines → stripRootDeclaration →
// stripPressurePhrases, then stripAraDeclarative; the [[…]] tags are taken out first, as rawText does. NOT included, because they read
// the session's state: stripRepeatedThreeBeat, guardStopMoment, and the lines the app adds itself (crisis line, danger line, AI line)
// — those are in SCREEN. So AFTER FILTERS is a reconstruction from the app's code, not the app's own variable.
const FILTER_CHAIN = ['stripInternalLabels', 'stripForeignHelplines', 'stripRootDeclaration', 'stripPressurePhrases', 'stripAraDeclarative'];
function loadFilters(src) {
  const ci = src.indexOf('const AURA_CORE_PERSONALITY'), ce = src.indexOf('`;', src.indexOf('`', ci) + 1) + 2;
  const code = src.slice(0, ci) + src.slice(ce);
  const starts = [...code.matchAll(/^(?:function ([A-Za-z_]\w*)\(|const ([A-Za-z_]\w*) = )/gm)].map(m => ({ name: m[1] || m[2], at: m.index }));
  const next = [...code.matchAll(/^(?:function |const |let |var |class |export |async function )/gm)].map(m => m.index);
  const chunk = {};
  for (const s of starts) {
    if (chunk[s.name]) continue;
    const end = next.find(i => i > s.at) || code.length;
    let text = code.slice(s.at, end);
    if (/^function /.test(text)) text = text.slice(0, text.indexOf('\n}') + 2);
    chunk[s.name] = { text, at: s.at };
  }
  const need = new Set(), todo = [...FILTER_CHAIN];
  while (todo.length) {
    const n = todo.pop(); if (need.has(n) || !chunk[n]) continue; need.add(n);
    for (const id of new Set(chunk[n].text.match(/[A-Za-z_]\w*/g) || [])) if (id !== n && chunk[id] && !need.has(id)) todo.push(id);
  }
  const ordered = [...need].sort((a, b) => chunk[a].at - chunk[b].at);
  const lib = new Function(ordered.map(n => chunk[n].text).join('\n') + '\nreturn { ' + FILTER_CHAIN.join(', ') + ' };')();
  return {
    names: ordered,
    afterFilters: raw => {
      let t = String(raw || '').replace(/\s*\[\[EARLY_WORD:yes\]\]\s*/gi, '\n').trim().replace(/\s*\[\[EXIT:(yes|no)\]\]\s*$/i, '');
      const r = lib.stripInternalLabels(t); t = r && typeof r === 'object' ? r.text : r;
      return lib.stripAraDeclarative(lib.stripPressurePhrases(lib.stripRootDeclaration(lib.stripForeignHelplines(t))));
    },
  };
}
// the app's help-line table: numbers and names — allowed (John, 24/10: «ΕΚΑΒ, 166» counts as allowed)
function loadHelplines(src) {
  const m = src.match(/\nconst HELPLINES = \[([\s\S]*?)\n\];/);
  return m ? [...m[1].matchAll(/number: "(\d+)", name: "([^"]+)"/g)].map(x => ({ number: x[1], name: x[2] })) : [];
}

// ── 2. The flags ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
const plain = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/ς/g, 'σ');
const noAcc = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC');
const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// where `needle` stands as whole words in `hay` (-1 if nowhere); both already in the same form (plain or noAcc)
function wordAt(hay, needle) { if (!needle) return -1; const m = new RegExp('(^|[^\\p{L}\\p{N}])' + escRe(needle) + '(?![\\p{L}\\p{N}])', 'u').exec(hay); return m ? m.index + m[1].length : -1; }
const wordIn = (hay, needle) => wordAt(hay, needle) >= 0;
// words in capitals that are the app's own format or ordinary words, not names (kept short on purpose: a false flag costs a glance)
const NOT_NAMES = new Set(['AURA', 'ΗΡΘΕΣ', 'ΜΕ', 'ΒΡΗΚΕΣ', 'ΦΕΥΓΕΙΣ', 'ΔΡΟΜΟΣ', 'ΚΕΡΔΙΖΕΙΣ', 'ΚΟΣΤΙΖΕΙ', 'ΑΓΝΩΣΤΟ', 'ΟΚ', 'OK', 'AI', 'ΤΙ', 'ΔΕΝ', 'ΚΑΙ', 'ΝΑ',
  'ΠΡΙΝ', 'ΤΩΡΑ', 'ΕΔΩ', 'ΟΧΙ', 'ΝΑΙ', 'Ι', 'II', 'III']);
// a short, non-exhaustive list of names that are not capital acronyms (a capital acronym is caught anyway)
const KNOWN = ['Συνήγορος του Πολίτη', 'Κλίμακα', 'Σαμαρείτες', 'Γιατροί του Κόσμου', 'Ερυθρός Σταυρός', 'Επιθεώρηση Εργασίας', 'Εφορία',
  'Gumroad', 'Stripe', 'Patreon', 'PayPal', 'Etsy', 'Shopify', 'Upwork', 'Fiverr', 'LinkedIn', 'Indeed', 'Kariera', 'Workable', 'Google', 'Facebook',
  'Instagram', 'TikTok', 'YouTube', 'ChatGPT', 'Headspace', 'Calm', 'BetterHelp'];
const CAPITAL_ONLY = new Set(['Κλίμακα', 'Calm', 'Indeed']);
// a tell-tale word followed by a name in capitals: «Κέντρα Προώθησης Απασχόλησης», «Υπηρεσία Ασύλου», «Ταμείο Ανεργίας»
const ORG_WORD = /(?:^|[^Α-Ωα-ωά-ώΆ-Ώ])((?:Κέντρ|Υπηρεσί|Οργανισμ|Ίδρυμ|Σύλλογ|Ένωσ|Ινστιτούτ|Υπουργεί|Ταμεί|Επιμελητήρι|Γραμματεί|Αρχ[ήή] |Φορέ|Πρόγραμμ|Πλατφόρμ|Εισαγγελ|Δικαστήρι|Πανεπιστήμι|Νοσοκομεί|Δήμ)[α-ωά-ώ]*(?:\s+(?:του|της|των|για|στο|στη)?\s*[Α-ΩΆ-Ώ][α-ωά-ώΑ-ΩΆ-Ώ]+){1,4})/g;
const ACRONYM = /(?:^|[^Α-Ωα-ωά-ώΆ-ΏA-Za-z])([Α-ΩΆΈΉΊΌΎΏA-Z]{2,8})(?![Α-Ωα-ωά-ώΆ-ΏA-Za-z])/g;
const WEB = /\b((?:https?:\/\/|www\.)\S+|[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:gr|com|org|eu|net|gov|info|io)\b)/gi;
// a help-line-like number: 3–6 digits starting with 1 (Greek lines: 100, 1056, 10306, 116111 …) or a 10-digit phone — not an amount with
// a unit right after it («1000mg»), not a year 1900–1999
const PHONE = /(?:^|[^\d])(1\d{2,5}|2\d{9}|69\d{8})(?![\d.,]?\d)(?!\s?[A-Za-zΑ-Ωα-ωά-ώμ])/g;
// a Latin word with a capital letter inside Greek text (a name or a product: «Harvard», «freeCodeCamp», «The Odin Project»)
const LATIN_NAME = /(?:^|[^A-Za-z0-9])((?:[A-Z][A-Za-z0-9]*[a-z][A-Za-z0-9]*|[a-z]+[A-Z][A-Za-z0-9]*)(?:\s+[A-Z][A-Za-z0-9]+)*)(?![A-Za-z0-9])/g;
function excerpt(text, at, len) { const a = Math.max(0, at - 70), b = Math.min(text.length, at + len + 70); return (a ? '…' : '') + text.slice(a, b).replace(/\s+/g, ' ') + (b < text.length ? '…' : ''); }
function orgFlags({ raw, filtered, screen, userTexts, helplines }) { // eslint-disable-line no-param-reassign
  // whole words only: «ΕΣΥ» is not the user's «εσύ», «ΟΤΑ» is not «όταν»; an acronym counts as the user's only if the user wrote it in
  // capitals (accents aside) — so a user who types everything in capitals can hide one (a known miss)
  const userPlain = plain((userTexts || []).join('\n')), userCaps = noAcc((userTexts || []).join('\n'));
  const allowedNames = (helplines || []).map(h => plain(h.name)), allowedNumbers = new Set((helplines || []).map(h => h.number));
  const isUsers = tok => wordIn(userPlain, plain(tok));
  const isUsersCaps = tok => wordIn(userCaps, noAcc(tok));
  const isTable = tok => allowedNames.some(n => wordIn(n, plain(tok)) || wordIn(plain(tok), n));
  const out = [], seen = new Set();
  const add = (token, at, len, reason) => {
    const key = plain(token) + '|' + reason; if (seen.has(key)) return; seen.add(key);
    out.push({ token, reason, excerpt: excerpt(raw, at, len), inFiltered: filtered == null ? null : plain(filtered).includes(plain(token)),
      inScreen: screen == null ? null : plain(screen).includes(plain(token)) });
  };
  raw = String(raw || '').replace(/\[\[[^\]]*\]\]/g, ' '); // the app's own tags ([[EXIT:yes]] …) are not the model's words to the user
  for (const m of raw.matchAll(ACRONYM)) {
    const tok = m[1]; if (NOT_NAMES.has(tok) || isUsersCaps(tok) || isTable(tok)) continue;
    add(tok, m.index + m[0].indexOf(tok), tok.length, 'ακρωνύμιο / λέξη μόνο με κεφαλαία που δεν έγραψε ο χρήστης');
  }
  for (const m of raw.matchAll(ORG_WORD)) { const tok = m[1].trim(); if (!isUsers(tok) && !isTable(tok)) add(tok, m.index + m[0].indexOf(m[1]), tok.length, 'λέξη φορέα και όνομα με κεφαλαίο'); }
  for (const name of KNOWN) {
    // a name that is also an everyday word («κλίμακα» = scale) counts only with its capital; the others in any case
    const hay = CAPITAL_ONLY.has(name) ? noAcc(raw) : plain(raw), m = wordAt(hay, CAPITAL_ONLY.has(name) ? noAcc(name) : plain(name));
    if (m >= 0 && !isUsers(name) && !isTable(name)) add(name, m, name.length, 'γνωστό όνομα (σύντομη λίστα)');
  }
  for (const m of raw.matchAll(WEB)) if (!isUsers(m[1])) add(m[1], m.index, m[1].length, 'διεύθυνση ιστού');
  for (const m of raw.matchAll(LATIN_NAME)) { const tok = m[1].trim(); if (tok.length >= 3 && !NOT_NAMES.has(tok) && !isUsers(tok) && !isTable(tok)) add(tok, m.index + m[0].indexOf(m[1]), tok.length, 'λατινική λέξη με κεφαλαίο (πιθανό όνομα ή προϊόν)'); }
  for (const m of raw.matchAll(PHONE)) { const n = m[1]; if (/^19\d\d$/.test(n)) continue; if (!allowedNumbers.has(n) && !isUsers(n)) add(n, m.index + m[0].indexOf(n), n.length, 'αριθμός σαν τηλέφωνο, όχι του πίνακα της εφαρμογής'); }
  return out;
}

// ── 3. A saved stress report: every model text, its three layers, and the flags ─────────────────────────────────────────────────
// A session keeps `modelTexts` (RAW `text`, one per call, with the number of typed messages before it, and — from 24/10 — the AFTER
// FILTERS `filtered`, written at run time with that run's own App.jsx) and `turns` (SCREEN, from the page). The SCREEN text of a reply
// is the AURA turn shown after that many user turns. An older run has no `filtered`: it is then computed here, with today's filters,
// and the row says so (`filteredFrom: 'today'`).
function afterFiltersOf(mt, filters) {
  if (typeof mt.filtered === 'string') return { filtered: mt.filtered, from: 'run' };
  try { return filters ? { filtered: filters.afterFilters(String(mt.text || '')), from: 'today' } : { filtered: null, from: null }; }
  catch (e) { return { filtered: null, from: null }; }
}
function screenAfter(s, k) { let u = 0; const out = []; for (const t of s.turns || []) { if (t.who === 'user') u++; else if (u === k) out.push(t.text); } return out.join('\n'); }
function flagsForSession(s, filters, helplines) {
  const userTexts = (s.turns || []).filter(t => t.who === 'user').map(t => t.text);
  const rows = [];
  for (const mt of s.modelTexts || []) {
    const raw = String(mt.text || ''), { filtered, from } = afterFiltersOf(mt, filters);
    const screen = screenAfter(s, mt.typed);
    const flags = orgFlags({ raw, filtered, screen, userTexts: userTexts.slice(0, Math.max(mt.typed, 1)), helplines });
    if (flags.length) rows.push({ kind: mt.kind, typed: mt.typed, filteredFrom: from, flags });
  }
  return rows;
}
// What the filters changed in one reply, sentence by sentence (the sentences of RAW that are not in AFTER FILTERS, and the reverse) —
// for reading; [[…]] tags are taken out of RAW first, since the app never shows them.
const sentences = t => String(t || '').replace(/\[\[[^\]]*\]\]/g, ' ').split(/(?<=[.;!?…])\s+|\n+/).map(x => x.replace(/\s+/g, ' ').trim()).filter(Boolean);
function filterChanges(raw, filtered) {
  if (filtered == null) return null;
  const a = sentences(raw), b = sentences(filtered);
  const n = a.length, m = b.length, L = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const removed = [], added = [];
  let i = 0, j = 0;
  while (i < n && j < m) { if (a[i] === b[j]) { i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) removed.push(a[i++]); else added.push(b[j++]); }
  while (i < n) removed.push(a[i++]); while (j < m) added.push(b[j++]);
  return { changed: removed.length > 0 || added.length > 0, removed, added };
}
function filterChangesForSession(s, filters) {
  const rows = [];
  for (const mt of s.modelTexts || []) {
    const { filtered, from } = afterFiltersOf(mt, filters), ch = filterChanges(mt.text, filtered);
    if (ch && ch.changed) rows.push({ kind: mt.kind, typed: mt.typed, filteredFrom: from, removed: ch.removed, added: ch.added });
  }
  return rows;
}
function reportRun(runJson, appSrc) {
  const filters = loadFilters(appSrc), helplines = loadHelplines(appSrc);
  return (runJson.sessions || []).map(s => ({ label: s.label, rows: flagsForSession(s, filters, helplines) })).filter(x => x.rows.length);
}
module.exports = { loadFilters, loadHelplines, orgFlags, flagsForSession, filterChanges, filterChangesForSession, reportRun, FILTER_CHAIN };

if (require.main === module) {
  // node scripts/org_flags.cjs <stress-report.json> [App.jsx] — prints the flag list, for reading
  const run = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const src = fs.readFileSync(process.argv[3] || path.join(__dirname, '..', 'src', 'App.jsx'), 'utf8');
  const res = reportRun(run, src);
  console.log('ΛΙΣΤΑ ΕΠΙΣΗΜΑΝΣΕΩΝ (για ανάγνωση — όχι πλήρης ανιχνευτής φορέων, όχι έλεγχος γεγονότων): ' + res.length + ' συνεδρίες με επισήμανση');
  for (const s of res) for (const r of s.rows) for (const f of r.flags)
    console.log(`${s.label} · απάντηση μετά το μήνυμα ${r.typed} (${r.kind}) · «${f.token}» — ${f.reason} · μετά τα φίλτρα: ${f.inFiltered === null ? '—' : f.inFiltered ? 'μένει' : 'σβήστηκε'} · οθόνη: ${f.inScreen ? 'φάνηκε' : 'δεν φάνηκε'}\n    ${f.excerpt}`);
}
