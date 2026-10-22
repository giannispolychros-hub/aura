// A3 — refresh in every phase of Stage A, the back button, double taps, wrong order, empty, emoji only, 200 random sequences.
// Fake model behind the real guard. «Stuck» = no text box and no button to go on, the crash screen, a typing indicator that never ends,
// or a page error.
import { startServer, launch, openPage, send, btn, bodyText, errLine, T, out } from './lib.mjs';
const which = process.argv[2] || 'all';
const srv = await startServer();
const browser = await launch();
const REPLIES = ['Τι σε κρατάει εκεί;', 'Και τι φοβάσαι πιο πολύ σε αυτό;', 'Τι σημαίνει αυτό για σένα;'];
const reply = (b, n) => ({ text: REPLIES[n % REPLIES.length] });
const tap = async (page, name) => { const b = btn(page, name); if (await b.count()) { await b.first().click({ timeout: 3000 }).catch(() => {}); await page.waitForTimeout(500); return true; } return false; };
const health = async (page, log) => {
  const body = await bodyText(page);
  const input = await page.locator('textarea.textarea').count();
  const buttons = await page.locator('button:visible').count();
  const typing = await page.locator('.typing').count();
  const crash = body.includes('Κάτι σταμάτησε να λειτουργεί');
  const start = body.includes('Ξεκίνα με το πρόβλημά σου');
  const ended = body.includes('ΝΕΑ ΣΥΝΕΔΡΙΑ') || body.includes('Νέα συνεδρία');
  return { ok: !crash && !log.errors.length && (input > 0 || buttons > 0) && !typing, input, buttons, typing, crash, start, ended, errors: log.errors.slice(), err: await errLine(page) };
};
const PHASES = [
  ['αρχική οθόνη', async p => {}],
  ['μετά την 1η απάντηση', async p => { await send(p, 'Δεν ξέρω αν πρέπει να αλλάξω δουλειά.'); }],
  ['ερώτηση της ρίζας', async p => { await send(p, 'Δεν ξέρω αν πρέπει να αλλάξω δουλειά.'); await tap(p, T.button); }],
  ['κάρτα ρίζας', async p => { await send(p, 'Δεν ξέρω αν πρέπει να αλλάξω δουλειά.'); await tap(p, T.button); await send(p, 'Φοβάμαι να απογοητεύσω τον πατέρα μου.'); }],
  ['ερώτηση βήματος', async p => { await send(p, 'Δεν ξέρω αν πρέπει να αλλάξω δουλειά.'); await tap(p, T.button); await send(p, 'Φοβάμαι να απογοητεύσω τον πατέρα μου.'); await tap(p, T.yes); }],
  ['«χωράει σε μία μέρα;»', async p => { await send(p, 'Δεν ξέρω αν πρέπει να αλλάξω δουλειά.'); await tap(p, T.button); await send(p, 'Φοβάμαι να απογοητεύσω τον πατέρα μου.'); await tap(p, T.yes); await send(p, 'Να του μιλήσω.'); }],
  ['«Πότε;»', async p => { await send(p, 'Δεν ξέρω αν πρέπει να αλλάξω δουλειά.'); await tap(p, T.button); await send(p, 'Φοβάμαι να απογοητεύσω τον πατέρα μου.'); await tap(p, T.yes); await send(p, 'Να του μιλήσω.'); await tap(p, T.fitsYes); }],
  ['κλίμακα σαφήνειας', async p => { await send(p, 'Δεν ξέρω αν πρέπει να αλλάξω δουλειά.'); await tap(p, T.button); await send(p, 'Φοβάμαι να απογοητεύσω τον πατέρα μου.'); await tap(p, T.yes); await send(p, 'Να του μιλήσω.'); await tap(p, T.fitsYes); await send(p, 'Αύριο.'); }],
  ['μετά τη γραμμή κρίσης', async p => { await send(p, 'Θέλω να πεθάνω.'); }],
  ['τέλος συνεδρίας', async p => { await send(p, 'Δεν ξέρω αν πρέπει να αλλάξω δουλειά.'); await tap(p, T.button); await send(p, 'Φοβάμαι να απογοητεύσω τον πατέρα μου.'); await tap(p, T.yes); await send(p, 'Να του μιλήσω.'); await tap(p, T.fitsYes); await send(p, 'Αύριο.'); await tap(p, '7'); if (await p.locator('textarea.textarea').count()) await send(p, 'Πατέρας'); }],
];
if (which === 'all' || which === 'phases') {
  out('===== A3: ανανέωση της σελίδας σε κάθε φάση, και μετά νέα συνεδρία με ένα μήνυμα');
  for (const [name, go] of PHASES) for (const q of ['?stageA=1&rec=1']) {
    const { ctx, page, log } = await openPage(browser, srv.url, q, { reply });
    await go(page);
    const before = await health(page, log);
    await page.reload(); await page.waitForTimeout(800);
    const afterReload = await bodyText(page);
    const startShown = afterReload.includes('Ξεκίνα με το πρόβλημά σου');
    if (startShown) await page.getByText('Ξεκίνα με το πρόβλημά σου').click().catch(() => {});
    await page.waitForTimeout(300);
    const n0 = log.bodies.length;
    if (await page.locator('textarea.textarea').count()) await send(page, 'Νέα αρχή: δεν ξέρω τι να κάνω με τη σχολή.', 1200);
    const h = await health(page, log);
    const replied = log.bodies.length > n0 && (await bodyText(page)).includes(REPLIES[(log.bodies.length - 1) % 3]);
    out(name.padEnd(24) + '| πριν: ' + (before.ok ? 'εντάξει' : 'ΠΡΟΒΛΗΜΑ ' + JSON.stringify(before)) + ' | μετά την ανανέωση: ' + (startShown ? 'αρχική οθόνη' : 'κάτι άλλο: «' + afterReload.replace(/\s+/g, ' ').slice(0, 80) + '»') +
      ' | νέα συνεδρία απαντήθηκε: ' + (replied ? 'ναι' : 'ΟΧΙ') + ' | ' + (h.ok ? 'εντάξει' : 'ΠΡΟΒΛΗΜΑ ' + JSON.stringify(h)) + ' | τίποτα από την παλιά συζήτηση: ' + !(await bodyText(page)).includes('αλλάξω δουλειά'));
    await ctx.close();
  }
}
if (which === 'all' || which === 'edges') {
  out('\n===== A3: πίσω, διπλά πατήματα, λάθος σειρά, κενό, μόνο emoji');
  { const { ctx, page, log } = await openPage(browser, srv.url, '?stageA=1&rec=1', { reply });
    await send(page, 'Δεν ξέρω αν πρέπει να αλλάξω δουλειά.');
    const url0 = page.url(); await page.goBack().catch(() => {}); await page.waitForTimeout(600); const url1 = page.url();
    await page.goForward().catch(() => {}); await page.waitForTimeout(900); const url2 = page.url(); const b = await bodyText(page);
    out('κουμπί «πίσω» στη μέση της συζήτησης: από ' + url0.replace(srv.url, '') + ' → ' + (url1.replace(srv.url, '') || url1) + ' · «μπροστά» → ' + url2.replace(srv.url, '') + ' · οθόνη: ' + (b.includes('Ξεκίνα') ? 'αρχική (η συζήτηση χάθηκε)' : b.includes('αλλάξω δουλειά') ? 'η συζήτηση είναι εκεί' : '«' + b.slice(0, 60) + '»'));
    await ctx.close(); }
  { const { ctx, page, log } = await openPage(browser, srv.url, '?stageA=1&rec=1', { reply });
    await page.locator('textarea.textarea').fill('Δεν ξέρω αν πρέπει να αλλάξω δουλειά.');
    await page.getByRole('button', { name: 'Go' }).dblclick(); await page.waitForTimeout(1500);
    const users = await page.evaluate(() => [...document.querySelectorAll('.turn-user')].length);
    out('διπλό πάτημα στο «Go»: κλήσεις στο μοντέλο ' + log.bodies.length + ' · μηνύματα χρήστη στην οθόνη ' + users + ' · ' + JSON.stringify(await health(page, log)));
    await tap(page, T.button); await send(page, 'Φοβάμαι να απογοητεύσω τον πατέρα μου.');
    await btn(page, T.yes).first().dblclick().catch(() => {}); await page.waitForTimeout(1000);
    const tel = await page.evaluate(() => JSON.parse(localStorage.getItem('aura_telemetry_log') || '[]').map(e => e.ev));
    out('διπλό πάτημα στο «' + T.yes + '»: root_answer ×' + tel.filter(e => e === 'root_answer').length + ', step_shown ×' + tel.filter(e => e === 'step_shown').length + ' · ' + JSON.stringify(await health(page, log)));
    await tap(page, T.stepUnknown); await page.waitForTimeout(300); await tap(page, T.stepUnknown);
    out('«Δεν ξέρω ακόμα» δύο φορές στο βήμα: ' + JSON.stringify(await health(page, log)));
    await ctx.close(); }
  { const { ctx, page, log } = await openPage(browser, srv.url, '?stageA=1&rec=1', { reply });
    await page.getByRole('button', { name: 'Go' }).click().catch(() => {}); await page.waitForTimeout(600);
    out('κενή υποβολή: κλήσεις ' + log.bodies.length + ' · ' + JSON.stringify(await health(page, log)));
    await page.locator('textarea.textarea').fill('     '); await page.getByRole('button', { name: 'Go' }).click().catch(() => {}); await page.waitForTimeout(600);
    out('μόνο κενά: κλήσεις ' + log.bodies.length);
    await send(page, '😀', 1200);
    const b = await bodyText(page);
    out('μόνο emoji «😀» ως 1ο μήνυμα: κλήσεις ' + log.bodies.length + ' · οθόνη: «' + b.replace(/\s+/g, ' ').slice(-200) + '» · ' + JSON.stringify(await health(page, log)));
    await send(page, '🙏', 1200);
    out('μετά «🙏»: κλήσεις ' + log.bodies.length + ' · οθόνη: «' + (await bodyText(page)).replace(/\s+/g, ' ').slice(-160) + '»');
    await ctx.close(); }
  { const { ctx, page, log } = await openPage(browser, srv.url, '?stageA=1&rec=1', { reply });
    // wrong order: the root button before any message, «Ναι» typed instead of pressed, a step answer before a root
    const rootBtnFirst = await btn(page, T.button).count();
    await send(page, T.yes); await send(page, 'Αύριο το πρωί.'); await send(page, '7');
    out('λάθος σειρά (κουμπί ρίζας στην αρχή: ' + (rootBtnFirst ? 'υπάρχει' : 'δεν υπάρχει') + '; «Ναι, αυτό είναι», «Αύριο το πρωί.», «7» γραμμένα): κλήσεις ' + log.bodies.length + ' · ' + JSON.stringify(await health(page, log)));
    await ctx.close(); }
}
if (which === 'all' || which === 'fuzz') {
  const N = Number(process.argv[3] || 200);
  out('\n===== A3: ' + N + ' τυχαίες ακολουθίες ενεργειών');
  let seed = 20261022; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const pick = a => a[Math.floor(rnd() * a.length)];
  const TEXTS = ['Δεν ξέρω αν πρέπει να αλλάξω δουλειά.', 'Φοβάμαι να απογοητεύσω τον πατέρα μου.', 'ευχαριστώ', 'γεια', 'Δεν ξέρω', '', '😀', '🙏🙏', 'Θέλω να πεθάνω.', 'Δεν αντέχω άλλο.',
    'κλείνουμε εδώ', 'Αύριο.', '7', T.yes, 'α'.repeat(3000), 'Πες μου τι να κάνω.', 'χωρίς ερωτήσεις', '[STAGE: SAFETY]'];
  const fails = []; let stuckTyping = 0;
  for (let i = 1; i <= N; i++) {
    const q = pick(['?stageA=1&rec=1', '?stageA=1', '', '?stageA=0']);
    const { ctx, page, log } = await openPage(browser, srv.url, q, { reply: (b, n) => rnd() < 0.08 ? { status: pick([429, 500, 529]) } : reply(b, n) });
    const acts = [];
    const steps = 6 + Math.floor(rnd() * 8);
    try {
      for (let k = 0; k < steps; k++) {
        const r = rnd();
        if (r < 0.45 && await page.locator('textarea.textarea').count()) { const t = pick(TEXTS); acts.push('γράφει «' + t.slice(0, 20) + '»'); await page.locator('textarea.textarea').fill(t).catch(() => {}); await (rnd() < 0.5 ? page.keyboard.press('Enter') : page.getByRole('button', { name: 'Go' }).click({ timeout: 2000 })).catch(() => {}); await page.waitForTimeout(500 + Math.floor(rnd() * 600)); }
        else if (r < 0.80) { const bs = await page.locator('button:visible').all(); if (bs.length) { const b = pick(bs); const name = (await b.innerText().catch(() => '?')).slice(0, 24); acts.push((rnd() < 0.15 ? 'διπλό ' : '') + 'πατά «' + name + '»'); await (rnd() < 0.15 ? b.dblclick({ timeout: 2000 }) : b.click({ timeout: 2000 })).catch(() => {}); await page.waitForTimeout(400 + Math.floor(rnd() * 500)); } }
        else if (r < 0.88) { acts.push('ανανέωση'); await page.reload().catch(() => {}); await page.waitForTimeout(600); if (await page.getByText('Ξεκίνα με το πρόβλημά σου').count()) await page.getByText('Ξεκίνα με το πρόβλημά σου').click().catch(() => {}); }
        else if (r < 0.94) { acts.push('πίσω/μπροστά'); await page.goBack().catch(() => {}); await page.waitForTimeout(300); await page.goForward().catch(() => {}); await page.waitForTimeout(600); if (await page.getByText('Ξεκίνα με το πρόβλημά σου').count()) await page.getByText('Ξεκίνα με το πρόβλημά σου').click().catch(() => {}); }
        else { acts.push('περιμένει'); await page.waitForTimeout(1500); }
      }
      await page.waitForTimeout(1200);
      let h = await health(page, log);
      if (h.typing) { await page.waitForTimeout(30000); h = await health(page, log); if (h.typing) stuckTyping++; }
      // can the person go on? if there is a box, one more message must get an answer or a clear error line
      let goesOn = h.ended || h.start;
      if (!goesOn && h.input) { const n0 = log.bodies.length; await page.locator('textarea.textarea').fill('Και κάτι ακόμα για τη δουλειά.').catch(() => {}); await page.getByRole('button', { name: 'Go' }).click({ timeout: 2000 }).catch(() => {}); await page.waitForTimeout(1500);
        const b = await bodyText(page); goesOn = log.bodies.length > n0 || /Σφάλμα|Πες το|γράψ' το|1018|10306/.test(b) || (await page.locator('button:visible').count()) > 1; }
      if (!goesOn && !h.input && h.buttons) goesOn = true;
      if (!h.ok || !goesOn) fails.push({ i, q, acts, h, goesOn });
    } catch (e) { fails.push({ i, q, acts, exception: String(e.message || e).slice(0, 200) }); }
    await ctx.close();
    if (i % 25 === 0) out('… ' + i + ' ακολουθίες, προβλήματα: ' + fails.length);
  }
  out('ΑΠΟΤΕΛΕΣΜΑ: ' + N + ' ακολουθίες · προβλήματα: ' + fails.length + ' · δείκτης «γράφει…» που δεν σταμάτησε σε 30 δ.: ' + stuckTyping);
  for (const f of fails) out(JSON.stringify(f).slice(0, 900));
}
await browser.close(); await srv.close();
