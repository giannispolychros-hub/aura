// A6 (what stays on the device), A7 (what the tester's «Στείλε τα στοιχεία» gives out), A8 (every domain the page talks to).
import fs from 'fs';
import { startServer, launch, openPage, send, btn, bodyText, T, out } from './lib.mjs';
const M = { msg: 'zqxmsg4417', root: 'zqxroot5521', step: 'zqxstep6633', when: 'zqxwhen7741', word: 'zqxword8853', corr: 'zqxcorr9962' };
const MG = { msg: 'ΔΕΙΚΤΗΣΜΗΝΥΜΑ', root: 'ΔΕΙΚΤΗΣΡΙΖΑ', step: 'ΔΕΙΚΤΗΣΒΗΜΑ', when: 'ΔΕΙΚΤΗΣΠΟΤΕ', word: 'ΔΕΙΚΤΗΣΛΕΞΗ' };
const ALL = [...Object.values(M), ...Object.values(MG)];
const srv = await startServer();
const browser = await launch();
const tap = async (page, name) => { const b = btn(page, name); if (await b.count()) { await b.first().click({ timeout: 4000 }).catch(() => {}); await page.waitForTimeout(600); return true; } return false; };

async function fullSession(query) {
  const { ctx, page, log } = await openPage(browser, srv.url, query, { permissions: ['clipboard-read', 'clipboard-write'],
    reply: (b, n) => ({ text: ['Τι σε κρατάει εκεί;', 'Και τι φοβάσαι πιο πολύ σε αυτό;', 'Τι σημαίνει αυτό για σένα;'][Math.min(n, 2)] }) });
  await send(page, 'Δουλεύω σε τράπεζα και σκέφτομαι να φύγω ' + M.msg + ' ' + MG.msg + '.');
  await send(page, 'Κάθε μέρα νιώθω πιο άδειος εκεί μέσα.');
  await tap(page, T.button);
  await send(page, 'Φοβάμαι να απογοητεύσω τον πατέρα μου ' + M.root + ' ' + MG.root + '.');
  const card = await bodyText(page);
  await tap(page, T.yes);
  // the step: answer, «fits?» → Ναι, «Πότε;»
  await send(page, 'Να του μιλήσω ' + M.step + ' ' + MG.step + '.');
  await tap(page, T.fitsYes);
  await send(page, 'Αύριο το βράδυ ' + M.when + ' ' + MG.when + '.');
  // whatever comes next: the clarity scale, the one-tap question, the word
  for (let i = 0; i < 6; i++) {
    const b = await bodyText(page);
    if (b.includes(T.clarityQ)) { await tap(page, '7'); continue; }
    if (b.includes(T.word) && await page.locator('textarea.textarea').count()) { await send(page, 'Πατέρας ' + M.word + ' ' + MG.word); continue; }
    if (await btn(page, '4').count() && !b.includes(T.clarityQ)) { await tap(page, '4'); continue; }
    break;
  }
  await page.waitForTimeout(800);
  const end = await bodyText(page);
  return { ctx, page, log, card, end };
}

async function dumpStorage(page, ctx) {
  const local = await page.evaluate(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); } return o; });
  const session = await page.evaluate(() => { const o = {}; for (let i = 0; i < sessionStorage.length; i++) { const k = sessionStorage.key(i); o[k] = sessionStorage.getItem(k); } return o; });
  const idb = await page.evaluate(async () => {
    if (!indexedDB.databases) return 'indexedDB.databases() not available';
    const dbs = await indexedDB.databases(); const out = {};
    for (const d of dbs) out[d.name] = await new Promise(res => { const r = indexedDB.open(d.name); r.onsuccess = () => { const db = r.result; const names = [...db.objectStoreNames]; const data = {};
      if (!names.length) { db.close(); return res({}); }
      const tx = db.transaction(names, 'readonly'); let left = names.length;
      for (const n of names) { const q = tx.objectStore(n).getAll(); q.onsuccess = () => { data[n] = q.result; if (--left === 0) { db.close(); res(data); } }; } };
      r.onerror = () => res('error'); });
    return out; });
  const caches_ = await page.evaluate(async () => (self.caches ? await caches.keys() : 'no Cache API'));
  const sw = await page.evaluate(async () => (navigator.serviceWorker ? (await navigator.serviceWorker.getRegistrations()).length : 'none'));
  const cookies = await ctx.cookies();
  return { local, session, idb, caches: caches_, serviceWorkers: sw, cookies, documentCookie: await page.evaluate(() => document.cookie) };
}
const found = s => ALL.filter(m => JSON.stringify(s).includes(m));

for (const q of ['?stageA=1', '?stageA=1&rec=1']) {
  const s = await fullSession(q);
  const st = await dumpStorage(s.page, s.ctx);
  out('\n===== A6: πλήρης συνεδρία Σταδίου Α, ' + q + ' — η κάρτα ρίζας φάνηκε: ' + s.card.includes(M.root) + ' · τέλος: «' + s.end.replace(/\s+/g, ' ').slice(-160) + '»');
  out('localStorage κλειδιά: ' + JSON.stringify(Object.keys(st.local)));
  for (const [k, v] of Object.entries(st.local)) out('  ' + k + ' (' + v.length + ' χαρ.): ' + v.slice(0, 1500));
  out('sessionStorage: ' + JSON.stringify(st.session) + ' · IndexedDB: ' + JSON.stringify(st.idb).slice(0, 400) + ' · Cache API: ' + JSON.stringify(st.caches) + ' · service workers: ' + st.serviceWorkers);
  out('cookies: ' + JSON.stringify(st.cookies) + ' · document.cookie: «' + st.documentCookie + '»');
  out('ΔΕΙΚΤΕΣ κειμένου χρήστη μέσα στην αποθήκευση: ' + JSON.stringify(found(st)));
  if (q.includes('rec=1')) {
    // A7: the tester's button — the file and the clipboard
    let file = null;
    const dl = s.page.waitForEvent('download', { timeout: 6000 }).then(async d => { file = { name: d.suggestedFilename(), text: fs.readFileSync(await d.path(), 'utf8') }; }).catch(() => {});
    const clicked = await tap(s.page, 'Στείλε τα στοιχεία της δοκιμής');
    await dl; await s.page.waitForTimeout(700);
    const clip = await s.page.evaluate(() => navigator.clipboard.readText().catch(() => null));
    const shown = await s.page.locator('textarea[readonly]').count() ? await s.page.locator('textarea[readonly]').first().inputValue() : null;
    out('\n===== A7: «Στείλε τα στοιχεία της δοκιμής» — πατήθηκε: ' + clicked);
    out('αρχείο: ' + (file ? file.name + ' (' + file.text.length + ' χαρ.)' : 'κανένα'));
    out('ΤΟ ΑΡΧΕΙΟ ΑΥΤΟΥΣΙΟ:\n' + (file ? file.text : '—'));
    out('ΠΡΟΧΕΙΡΟ (clipboard) ίδιο με το αρχείο: ' + (clip === (file && file.text)) + (clip && file && clip !== file.text ? '\nΠΡΟΧΕΙΡΟ:\n' + clip : ''));
    out('κουτί ανάγνωσης στην οθόνη: ' + (shown === null ? 'όχι' : 'ναι, ίδιο με το αρχείο: ' + (shown === (file && file.text))));
    out('ΔΕΙΚΤΕΣ μέσα στο αρχείο / πρόχειρο: ' + JSON.stringify(found({ f: file && file.text, c: clip, s: shown })));
  }
  await s.ctx.close();
}

// A8: every domain, at the four addresses, over a short session (first screen, start, one message)
out('\n===== A8: τομείς σε κάθε διεύθυνση');
for (const q of ['', '?stageA=1', '?stageA=1&rec=1', '?stageA=0']) {
  const { ctx, page, log } = await openPage(browser, srv.url, q);
  await send(page, 'Δεν ξέρω αν πρέπει να αλλάξω δουλειά.');
  if (q === '?stageA=0') await send(page, 'Γιατί κουράστηκα.');
  const hosts = {}; for (const u of log.requests) { try { const h = new URL(u).host; hosts[h] = (hosts[h] || 0) + 1; } catch (e) { hosts[u.slice(0, 30)] = (hosts[u.slice(0, 30)] || 0) + 1; } }
  out('«' + (q || 'σκέτο λινκ') + '»: ' + JSON.stringify(hosts) + ' · διαδρομές: ' + [...new Set(log.requests.map(u => { try { return new URL(u).pathname.replace(/index-[^.]+/, 'index-*'); } catch (e) { return u; } }))].join(' '));
  await ctx.close();
}
await browser.close(); await srv.close();
