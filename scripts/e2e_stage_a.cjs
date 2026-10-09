// Δοκιμή του Σταδίου Α σε ΠΡΑΓΜΑΤΙΚΟ browser, πάνω στην ίδια την εφαρμογή (ίδιο src/App.jsx, ίδιο api/aura.js).
// ΜΟΝΟ κώδικας δοκιμής — τίποτα εδώ δεν αλλάζει τη συμπεριφορά της εφαρμογής. Δεν είναι μέρος των auratests (θέλει
// Playwright)· οι καθαρές συναρτήσεις του είναι στο scripts/e2e_stage_a_lib.cjs και ελέγχονται από το
// auratests/test_e2e_harness.js.
//
// Το script χτίζει την εφαρμογή όπως το Vercel (vite build, χωρίς το vite.config.js, άρα χωρίς τον proxy του dev
// server) σε φάκελο του %TEMP% και τη σερβίρει με vite preview. Κάθε κλήση της εφαρμογής στο /api/aura την πιάνει ο
// Playwright· στις λειτουργίες με ψεύτικο μοντέλο απαντά ο ίδιος, στην --real την περνά στο ΙΔΙΟ το api/aura.js του
// repo, που καλεί την Anthropic με το κλειδί της μεταβλητής ANTHROPIC_API_KEY. Κανένας άλλος δρόμος προς την Anthropic.
//
// ΛΕΙΤΟΥΡΓΙΕΣ (από τον φάκελο του repo):
//   node scripts/e2e_stage_a.cjs                      ψεύτικο μοντέλο: ροή (A–I), ασφάλεια (S), πόρτες 2–3 (T), κλείσιμο/κινητό (U), ετικέτες (V), κρυφά σήματα και «Καλή συνέχεια.» (W), αποφάσεις 8/10 (δ) (X), χωρίς κόστος
//   node scripts/e2e_stage_a.cjs --engine-check       ψεύτικο μοντέλο: τα 6 σενάρια της πραγματικής δοκιμής, χωρίς κόστος
//   node scripts/e2e_stage_a.cjs --real --dry         δείχνει τι θα γίνει και το όριο δαπάνης — καμία κλήση, κανένα build
//   node scripts/e2e_stage_a.cjs --real --yes         ΠΡΑΓΜΑΤΙΚΟ μοντέλο (ξοδεύει· σταματά στο --budget, προεπιλογή $6)
// Προαιρετικά: --budget 6   --url http://localhost:5199 (αντί για build)   --out <φάκελος μέσα στο %TEMP%>   --only W | --only X (μόνο η W ή η X)
// Αρχεία εξόδου (αναφορά, στιγμιότυπα) ΜΟΝΟ στον προσωρινό φάκελο. Το κλειδί δεν γράφεται ποτέ σε έξοδο.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const LIB = require('./e2e_stage_a_lib.cjs');
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright'); } })();

const REPO = path.join(__dirname, '..');
const ARGS = process.argv.slice(2);
const has = f => ARGS.includes(f);
const opt = (f, d) => { const i = ARGS.indexOf(f); return i >= 0 && ARGS[i + 1] ? ARGS[i + 1] : d; };
const MODE = has('--real') ? 'real' : has('--engine-check') ? 'engine-check' : 'mock';
const STAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const OUT = LIB.outDirInTemp(opt('--out', path.join(os.tmpdir(), 'aura_e2e_' + MODE + '_' + STAMP)), os.tmpdir());
const KEY = process.env.ANTHROPIC_API_KEY || '';
const APP = LIB.loadApp(fs.readFileSync(path.join(REPO, 'src', 'App.jsx'), 'utf8'));
let BASE = opt('--url', null);

async function launch() {
  return chromium.launch().catch(() => chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }));
}
// Build + preview like production. configFile:false → no dev proxy anywhere: a request the test does not
// intercept gets a 404, never a second path to Anthropic.
async function startApp() {
  if (BASE) return { url: BASE, close: async () => {} };
  const vite = await import('vite');
  const react = (await import('@vitejs/plugin-react')).default;
  const buildDir = path.join(os.tmpdir(), 'aura_e2e_build_' + STAMP);
  await vite.build({ configFile: false, root: REPO, logLevel: 'warn', plugins: [react()], build: { outDir: buildDir, emptyOutDir: true } });
  const server = await vite.preview({ configFile: false, root: REPO, logLevel: 'warn', build: { outDir: buildDir }, preview: { port: 5299, strictPort: false } });
  const url = (server.resolvedUrls && server.resolvedUrls.local && server.resolvedUrls.local[0] || 'http://localhost:5299/').replace(/\/$/, '');
  return { url, close: async () => { await new Promise(r => server.httpServer.close(r)); fs.rmSync(buildDir, { recursive: true, force: true }); } };
}
function writeOut(name, text) {
  const t = LIB.redact(text, KEY);
  LIB.assertNoSecret(t, KEY);
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, name), t);
}

// ═══ ΨΕΥΤΙΚΟ ΜΟΝΤΕΛΟ — ροή (A–I), ασφάλεια (S), πόρτες 2–3 (T), κλείσιμο/κινητό (U), ετικέτες (V), κρυφά σήματα (W), αποφάσεις του ADR «8 Οκτωβρίου (δ)» (X) ══
// A ολόκληρη η ροή (κουμπί → κάρτα → «Ναι» → πρόταση → ερώτηση → σαφήνεια → λέξη → τέλος, χωρίς 6€), B κλειστός
// διακόπτης (τίποτα από το Στάδιο Α, καμία σήμανση), C πόρτα 2 και «πίσω», D DISTRESS (κάρτα ναι, πρόταση όχι),
// E πρόταση κρίσης ως απάντηση (η ροή κλείνει, γραμμή 1018), F/F2 «Πριν φύγεις:» (T2 μία φορά, μετά το παλιό κλείσιμο·
// απάντηση-ρίζα και μέτρηση), G T1 «Ναι» χωρίς πόρτα, H T2 με κρίση επιπέδου Α χωρίς πόρτα, I κλειστός διακόπτης.
const results = [];
const ok = (label, cond) => { results.push((cond ? 'PASS' : 'FAIL') + ' — ' + label); };

async function session(query, script) {
  const browser = await launch();
  const page = await browser.newPage({ viewport: { width: 400, height: 860 } });
  const calls = [];
  let n = 0;
  await page.route('**/api/aura', async route => {
    const body = JSON.parse(route.request().postData() || '{}');
    calls.push(body);
    const reply = script[Math.min(n, script.length - 1)]; n++;
    await route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ content: [{ type: 'text', text: reply }], usage: { input_tokens: 10, output_tokens: 10 } }) });
  });
  await page.addInitScript(() => { try { localStorage.setItem('aura_intro_seen', '1'); } catch (e) {} });
  await page.goto(BASE + '/' + query);
  await page.getByText('Ξεκίνα με το πρόβλημά σου').click();
  return { browser, page, calls };
}
async function send(page, text) {
  await page.locator('textarea.textarea').fill(text);
  await page.getByRole('button', { name: 'Go' }).click();
  await page.waitForTimeout(700);
}
const systemText = b => (b.system || []).map(x => x.text).join('');


async function runMock() {
  // ── A: switch open for this visit ─────────────────────────────────────────
  {
    const { browser, page, calls } = await session('?stageA=1', [
      'Ακούω ότι σε βαραίνει η δουλειά. Τι είναι αυτό που σε κρατάει εκεί;',
      'Τι θα άλλαζε αν το έλεγες στον πατέρα σου;',
      'Η σκέψη σου παραμένει δική σου.',
    ]);
    await send(page, 'Γεια. Δεν ξέρω αν πρέπει να φύγω από τη δουλειά μου στην τράπεζα.');
    // First-WHY may ask its fixed question first (no API call); answer it if so.
    if (await page.getByText('Γιατί έχει σημασία αυτό για σένα τώρα;').count()) await send(page, 'Γιατί κάθε μέρα νιώθω πιο άδειος εκεί μέσα.');
    await page.waitForTimeout(500);
    ok('A: the root button appears after the first AURA reply', await page.getByRole('button', { name: 'Νομίζω βρήκα τι με απασχολεί' }).count() === 1);
    ok('A: the first request carries the marker in the UNCACHED block', calls.length >= 1 && (calls[0].system || []).length === 2 && calls[0].system[1].text.includes('[FREE PART: ENDS AT ROOT]') && !calls[0].system[0].text.includes('[FREE PART: ENDS AT ROOT]\n'));
    ok('A: the cached block is identical to the core prompt start (cache_control on block 0 only)', calls.length >= 1 && !!calls[0].system[0].cache_control && !calls[0].system[1].cache_control);
    { const c0 = LIB.classifyRequest(calls[0], APP);
      ok('A: the harness reads the first request as First-WHY, with the Stage A marker and the First-WHY floor', c0.kind === 'firstWhy' && c0.marker === true && c0.ctx.includes('firstWhyFloor') && c0.ctx.includes('stageAMarkerCtx'));
      ok('A: no unknown bracketed block in the first request', c0.unknown.length === 0); }
    await page.screenshot({ path: path.join(OUT, 'stageA-1-button.png'), fullPage: false });
    await page.getByRole('button', { name: 'Νομίζω βρήκα τι με απασχολεί' }).click();
    ok('A: the fixed question shows', await page.getByText('Πες το με μία φράση: τι είναι αυτό που πραγματικά σε απασχολεί;').count() >= 1);
    const callsBefore = calls.length;
    // Phone test 6/10: a reply without substance must not become the root.
    await send(page, 'Περίπου δηλαδή');
    ok('A: «Περίπου δηλαδή» is NOT accepted as a root — the app asks for more, no card', await page.getByText("Γράψ' το λίγο πιο ολοκληρωμένα").count() === 1 && await page.getByRole('button', { name: 'Ναι, αυτό είναι' }).count() === 0);
    await send(page, 'Ότι φοβάμαι να απογοητεύσω τον πατέρα μου, όχι τη δουλειά.');
    ok('A: the answer is NOT sent to the model', calls.length === callsBefore);
    ok('A: the card shows «Τι βρήκες» verbatim', await page.getByText('«Ότι φοβάμαι να απογοητεύσω τον πατέρα μου, όχι τη δουλειά.»').count() === 1);
    ok('A: the card shows «Τι ήξερες» from the first message, greeting stripped', await page.getByText('«Δεν ξέρω αν πρέπει να φύγω από τη δουλειά μου στην τράπεζα»').count() === 1);
    ok('A: the line above «Ναι»', await page.getByText('Με το "Ναι" ολοκληρώνεται το δωρεάν κομμάτι και σου δείχνω το επόμενο.').count() === 1);
    ok('A: the input box is hidden while the card is open', await page.locator('textarea.textarea').count() === 0);
    await page.screenshot({ path: path.join(OUT, 'stageA-2-card.png'), fullPage: false });
    // Correction with no substance: the previous root stays, the app asks for more; then a whole correction.
    await page.getByRole('button', { name: 'Διόρθωσε' }).click();
    ok('A: the correction asks for the whole root', await page.getByText('Γράψε τη ρίζα όπως θα την έλεγες εσύ, ολόκληρη.').count() === 1);
    await send(page, 'Περίπου δηλαδή');
    ok('A: «Περίπου δηλαδή» as a correction is refused and the previous root is kept', await page.getByText("Γράψ' το λίγο πιο ολοκληρωμένα").count() === 1 && await page.getByText('«Ότι φοβάμαι να απογοητεύσω τον πατέρα μου, όχι τη δουλειά.»').count() === 1);
    await send(page, 'Ότι φοβάμαι να απογοητεύσω τον πατέρα μου, όχι τη δουλειά.');
    // A SHORT phone screen, where the end text does not fit — the case the founder saw (the previous code left
    // «Η ρίζα σου» about 90px ABOVE the screen at this size).
    await page.setViewportSize({ width: 390, height: 520 });
    await page.getByRole('button', { name: 'Ναι, αυτό είναι' }).click();
    await page.waitForTimeout(900);
    { const top = await page.evaluate(() => { const el = document.querySelector('[data-stage-a-end="1"]'); return el ? el.getBoundingClientRect().top : null; });
      ok('A: after «Ναι», on a short phone screen, «Η ρίζα σου» is visible at the top (not scrolled away for the price)', top !== null && top >= 0 && top < 250); }
    await page.setViewportSize({ width: 400, height: 860 });
    await page.screenshot({ path: path.join(OUT, 'stageA-2b-after-yes.png'), fullPage: false });
    ok('A: «Η ρίζα σου» line with the whole root', await page.getByText('Η ρίζα σου: "Ότι φοβάμαι να απογοητεύσω τον πατέρα μου, όχι τη δουλειά.".').count() === 1);
    ok('A: price line', await page.getByText('AURA Coach · €6, μία φορά.').count() === 1);
    ok('A: offer buttons', await page.getByRole('button', { name: 'Θέλω να συνεχίσω' }).count() === 1 && await page.getByRole('button', { name: 'Όχι τώρα' }).count() === 1);
    ok('A: copy / download available after «Ναι»', await page.getByRole('button', { name: 'Αντίγραψε τη ρίζα' }).count() === 1 && await page.getByRole('button', { name: 'Κατέβασε τη ρίζα' }).count() === 1);
    await page.screenshot({ path: path.join(OUT, 'stageA-3-offer.png'), fullPage: true });
    await page.getByRole('button', { name: 'Θέλω να συνεχίσω' }).click();
    ok('A: not-ready text + the one-tap question', await page.getByText('Το AURA Coach δεν είναι ακόμα έτοιμο.').count() === 1 && await page.getByText('Τι θα σε βοηθούσε περισσότερο;').count() === 1);
    await page.screenshot({ path: path.join(OUT, 'stageA-4-notready.png'), fullPage: false });
    await page.getByRole('button', { name: 'Να κρατάω τη ρίζα και τα βήματά μου' }).click();
    ok('A: clarity question with 10 buttons', await page.getByText('Τώρα, πόσο ξεκάθαρο είναι ποιο ακριβώς είναι το πρόβλημα, από το 1 έως το 10;').count() === 1 && await page.getByRole('button', { name: '10', exact: true }).count() === 1);
    await page.getByRole('button', { name: '7', exact: true }).click();
    await page.waitForTimeout(300);
    ok('A: the word question', await page.getByText('Πριν φύγεις — μία λέξη, ή μια σύντομη φράση που θέλεις να κρατήσεις.').count() >= 1);
    ok('A: the root button is gone during the closing', await page.getByRole('button', { name: 'Νομίζω βρήκα τι με απασχολεί' }).count() === 0);
    await send(page, 'πατέρας');
    await page.waitForTimeout(800);
    ok('A: the session ended (closing reply shown)', await page.getByText('η συνομιλία σταμάτησε εδώ').count() === 1);
    ok('A: NO 6€ paywall', await page.getByText('ξεκλείδωσε').count() === 0);
    ok('A: «Νέα συνεδρία» is there', await page.getByRole('button', { name: 'Νέα συνεδρία' }).count() === 1);
    const tel = await page.evaluate(() => (window.__auraTelemetry || []).filter(r => r.ev === 'session_completed').pop() || null);
    ok('A: telemetry: stageA, door 1, shown, confirmed, offer clicked, help 3, clarity 7', !!tel && tel.stageA === 1 && tel.rootDoor === 1 && tel.rootShown === 1 && tel.rootConfirmed === 1 && tel.coachOfferClicked === 1 && tel.coachHelpChoice === 3 && tel.lateClarity === 7 && tel.stageReached === 5);
    await page.screenshot({ path: path.join(OUT, 'stageA-5-end.png'), fullPage: true });
    await browser.close();
  }
  // ── B: switch closed (no parameter) ───────────────────────────────────────
  {
    const { browser, page, calls } = await session('', ['Τι είναι αυτό που σε κρατάει εκεί;', 'Και τι σε τραβάει αλλού;']);
    await send(page, 'Γεια. Δεν ξέρω αν πρέπει να φύγω από τη δουλειά μου στην τράπεζα.');
    if (await page.getByText('Γιατί έχει σημασία αυτό για σένα τώρα;').count()) await send(page, 'Γιατί κάθε μέρα νιώθω πιο άδειος εκεί μέσα.');
    await page.waitForTimeout(500);
    ok('B: closed switch → no root button', await page.getByRole('button', { name: 'Νομίζω βρήκα τι με απασχολεί' }).count() === 0);
    ok('B: closed switch → no marker anywhere in what is sent', calls.length >= 1 && calls.every(c => !systemText(c).includes('[FREE PART: ENDS AT ROOT]\n')));
    await send(page, 'Η σταθερότητα κυρίως.');
    ok('B: closed switch → the conversation continues normally', calls.length >= 2);
    { const cs = calls.map(c => LIB.classifyRequest(c, APP));
      ok('B: the harness sees NO marker in any request with the switch closed', cs.length >= 2 && cs.every(c => c.marker === false));
      ok('B: the harness names the per-turn contexts of a main-path request (firstReplyFloorCtx or more)', cs.some(c => c.kind === 'main' && c.ctx.length >= 1));
      ok('B: no unknown bracketed block in any request', cs.every(c => c.unknown.length === 0)); }
    await browser.close();
  }

  // ── C: door 2 — readiness question → «ναι» → next message captured → «back» gets its reply ─
  {
    const { browser, page, calls } = await session('?stageA=1', [
      'Ακούω ότι σε βαραίνει η δουλειά. Τι σε κρατάει εκεί;',
      'Νιώθεις ότι έχει αρχίσει να ξεκαθαρίζει τι είναι αυτό που πραγματικά σε απασχολεί;',
      // UPDATED (8/10, ADR «8 Οκτωβρίου (δ)», 1): the «Ναι» no longer calls the model (door 2 shows the root question at once), so the
      // third reply is the one «back» gets; the old third reply («Πες μου με δικά σου λόγια…») used to answer the «Ναι».
      'Και τι θα σήμαινε αυτό για σένα;',
    ]);
    await send(page, 'Γεια. Δεν ξέρω αν πρέπει να φύγω από τη δουλειά μου στην τράπεζα.');
    if (await page.getByText('Γιατί έχει σημασία αυτό για σένα τώρα;').count()) await send(page, 'Γιατί κάθε μέρα νιώθω πιο άδειος εκεί μέσα.');
    await send(page, 'Η σταθερότητα, αλλά νιώθω ότι κάτι άλλο παίζει.');
    const beforeYes = calls.length;
    await send(page, 'Ναι');
    ok('C: door 2 — the «ναι» to the readiness question makes NO model call and shows the root question at once', calls.length === beforeYes && await page.getByText('Πες το με μία φράση: τι είναι αυτό που πραγματικά σε απασχολεί;', { exact: true }).count() >= 1);
    const before = calls.length;
    await send(page, 'Ότι δεν θέλω να παραδεχτώ ότι διάλεξα λάθος σπουδές.');
    ok('C: door 2 — the message after the «ναι» opens the card and is NOT sent', calls.length === before && await page.getByText('«Ότι δεν θέλω να παραδεχτώ ότι διάλεξα λάθος σπουδές.»').count() === 1);
    await page.getByRole('button', { name: 'Δεν το βρήκα ακόμα, συνέχισε' }).click();
    await page.waitForTimeout(800);
    ok('C: «back» from door 2 → that message gets its normal reply now', calls.length === before + 1 && await page.getByText('Και τι θα σήμαινε αυτό για σένα;').count() === 1);
    ok('C: the button is back after «back»', await page.getByRole('button', { name: 'Νομίζω βρήκα τι με απασχολεί' }).count() === 1);
    const last = calls[calls.length - 1];
    ok('C: the reply request ends with the captured message', last.messages[last.messages.length - 1].content === 'Ότι δεν θέλω να παραδεχτώ ότι διάλεξα λάθος σπουδές.');
    await browser.close();
  }
  // ── D: DISTRESS earlier in the session → card yes, NO offer ────────────────
  {
    const { browser, page, calls } = await session('?stageA=1', ['Είμαι εδώ. Τι είναι το πιο βαρύ αυτή τη στιγμή;', 'Τι σε κρατάει;']);
    await send(page, 'Το πένθος για τη μητέρα μου με έχει παραλύσει και δεν ξέρω αν να μείνω στη δουλειά.');
    if (await page.getByText('Γιατί έχει σημασία αυτό για σένα τώρα;').count()) await send(page, 'Γιατί δεν μπορώ να συγκεντρωθώ πουθενά.');
    await page.waitForTimeout(400);
    await page.getByRole('button', { name: 'Νομίζω βρήκα τι με απασχολεί' }).click();
    await send(page, 'Ότι δεν έχω επιτρέψει στον εαυτό μου να πενθήσει τη μητέρα μου.');
    ok('D: risk variant of the card line', await page.getByText('Με το "Ναι" ολοκληρώνεται αυτό το κομμάτι.').count() === 1);
    await page.getByRole('button', { name: 'Ναι, αυτό είναι' }).click();
    await page.waitForTimeout(300);
    ok('D: only the first two lines — no Coach, no price, no offer buttons',
      await page.getByText('AURA Coach · €6, μία φορά.').count() === 0 && await page.getByRole('button', { name: 'Θέλω να συνεχίσω' }).count() === 0 &&
      await page.getByText('Το πρώτο βήμα κάθε προβλήματος είναι ο πραγματικός ορισμός του — και τον βρήκες εσύ, χωρίς συμβουλές.').count() === 1);
    ok('D: straight to the clarity question', await page.getByText('Τώρα, πόσο ξεκάθαρο είναι ποιο ακριβώς είναι το πρόβλημα, από το 1 έως το 10;').count() === 1);
    await browser.close();
  }
  // ── E: a crisis sentence typed as the answer → the flow closes, the crisis path runs ─
  {
    const { browser, page, calls } = await session('?stageA=1', ['Τι σε κρατάει εκεί;', 'Είμαι εδώ μαζί σου. Είσαι ασφαλής αυτή τη στιγμή;']);
    await send(page, 'Γεια. Δεν ξέρω αν πρέπει να φύγω από τη δουλειά μου στην τράπεζα.');
    if (await page.getByText('Γιατί έχει σημασία αυτό για σένα τώρα;').count()) await send(page, 'Γιατί κάθε μέρα νιώθω πιο άδειος εκεί μέσα.');
    await page.waitForTimeout(400);
    await page.getByRole('button', { name: 'Νομίζω βρήκα τι με απασχολεί' }).click();
    const before = calls.length;
    await send(page, 'Δεν θέλω να ζω άλλο έτσι.');
    await page.waitForTimeout(600);
    ok('E: no card for a crisis sentence', await page.getByRole('button', { name: 'Ναι, αυτό είναι' }).count() === 0);
    ok('E: the message went to the model (crisis path)', calls.length === before + 1);
    ok('E: the code\'s crisis line is shown', await page.getByText(/1018/).count() >= 1);
    ok('E: tier A → the root button stays hidden', await page.getByRole('button', { name: 'Νομίζω βρήκα τι με απασχολεί' }).count() === 0);
    await browser.close();
  }
  // ── F: «Ευχαριστώ.» before the root (T2) → «Πριν φύγεις:» once; «Δεν το βρήκα ακόμα»; a 2nd T2 → the old closing ─
  const LEAVING = APP.texts.askLeaving; // the app's own text (ADR «8 Οκτωβρίου (β)»: «Αν κάτι σου ξεκαθάρισε, …»)
  {
    const { browser, page, calls } = await session('?stageA=1', ['Τι είναι αυτό που σε κρατάει εκεί;', 'Και τι σε τραβάει αλλού;', 'Τι θα σήμαινε αυτό για σένα;', 'Εντάξει. Είμαι εδώ αν θέλεις να συνεχίσουμε.', 'Εντάξει. Είμαι εδώ αν θέλεις να συνεχίσουμε.']);
    // NB: a BARE «Εντάξει.» to the first «Ευχαριστώ.» would make the existing «mutual close» rule of decideTermination
    // (assistantAlreadyClosed) hold back the old card at the second closing — reported, old closing not touched.
    await send(page, 'Γεια. Δεν ξέρω αν πρέπει να φύγω από τη δουλειά μου στην τράπεζα.');
    if (await page.getByText('Γιατί έχει σημασία αυτό για σένα τώρα;').count()) await send(page, 'Γιατί κάθε μέρα νιώθω πιο άδειος εκεί μέσα.');
    await send(page, 'Η σταθερότητα κυρίως.');
    await send(page, 'Μάλλον φοβάμαι την αλλαγή.');
    await send(page, 'Ευχαριστώ.');
    ok('F: first T2 → «Πριν φύγεις:» with «Δεν το βρήκα ακόμα», NOT the old closing card', await page.getByText(LEAVING).count() === 1 &&
      await page.getByRole('button', { name: 'Δεν το βρήκα ακόμα, συνέχισε' }).count() === 1 && await page.getByRole('button', { name: 'Δείξε μου' }).count() === 0);
    ok('F: the model\'s reply to «Ευχαριστώ.» is still on screen above it', await page.getByText('Τι θα σήμαινε αυτό για σένα;').count() === 1);
    await page.screenshot({ path: path.join(OUT, 'stageA-6-leaving.png'), fullPage: false });
    await page.getByRole('button', { name: 'Δεν το βρήκα ακόμα, συνέχισε' }).click();
    ok('F: «Δεν το βρήκα ακόμα» → the conversation continues, the button is back', await page.getByText(LEAVING).count() === 0 && await page.getByRole('button', { name: 'Νομίζω βρήκα τι με απασχολεί' }).count() === 1);
    await send(page, 'Ευχαριστώ, κλείνουμε εδώ.');
    ok('F: second T2 → the old closing card, no second «Πριν φύγεις:» (no loop)', await page.getByRole('button', { name: 'Δείξε μου' }).count() === 1 && await page.getByText(LEAVING).count() === 0);
    await browser.close();
  }
  // ── F2: «Πριν φύγεις:» answered with a root → the same card as door 1; telemetry counts it apart from the button ─
  {
    const { browser, page, calls } = await session('?stageA=1', ['Τι είναι αυτό που σε κρατάει εκεί;', 'Και τι σε τραβάει αλλού;', 'Τι θα σήμαινε αυτό για σένα;', 'Η σκέψη σου παραμένει δική σου.']);
    await send(page, 'Γεια. Δεν ξέρω αν πρέπει να φύγω από τη δουλειά μου στην τράπεζα.');
    if (await page.getByText('Γιατί έχει σημασία αυτό για σένα τώρα;').count()) await send(page, 'Γιατί κάθε μέρα νιώθω πιο άδειος εκεί μέσα.');
    await send(page, 'Η σταθερότητα κυρίως.');
    await send(page, 'Ευχαριστώ.');
    const before = calls.length;
    await send(page, 'Η αμφιβολία');
    ok('F2: «Η αμφιβολία» is not a root (asks for more)', await page.getByText("Γράψ' το λίγο πιο ολοκληρωμένα").count() === 1 && await page.getByRole('button', { name: 'Ναι, αυτό είναι' }).count() === 0);
    await send(page, 'Φοβάμαι την απόρριψη');
    ok('F2: «Φοβάμαι την απόρριψη» is a root → the card, nothing sent to the model', await page.getByText('«Φοβάμαι την απόρριψη»').count() === 1 && calls.length === before);
    await page.getByRole('button', { name: 'Ναι, αυτό είναι' }).click();
    await page.getByRole('button', { name: 'Όχι τώρα' }).click();
    await page.getByRole('button', { name: '6', exact: true }).click();
    await page.waitForTimeout(300);
    await send(page, 'απόρριψη');
    await page.waitForTimeout(800);
    const tel = await page.evaluate(() => (window.__auraTelemetry || []).filter(r => r.ev === 'session_completed').pop() || null);
    ok('F2: telemetry — rootDoorFromClosing 1, rootButtonPressed 0, door 1, confirmed', !!tel && tel.rootDoorFromClosing === 1 && tel.rootButtonPressed === 0 && tel.rootDoor === 1 && tel.rootConfirmed === 1);
    await browser.close();
  }
  // ── G: T1 «Ναι» → no door ─────────────────────────────────────────────────
  {
    const { browser, page, calls } = await session('?stageA=1', ['Τι είναι αυτό που σε κρατάει εκεί;', 'Και τι σε τραβάει αλλού;', 'Είναι η σταθερότητα αυτό που σε κρατάει;', 'Εντάξει.']);
    await send(page, 'Γεια. Δεν ξέρω αν πρέπει να φύγω από τη δουλειά μου στην τράπεζα.');
    if (await page.getByText('Γιατί έχει σημασία αυτό για σένα τώρα;').count()) await send(page, 'Γιατί κάθε μέρα νιώθω πιο άδειος εκεί μέσα.');
    await send(page, 'Η σταθερότητα κυρίως.');
    await send(page, 'Μάλλον φοβάμαι την αλλαγή.');
    await send(page, 'Ναι');
    ok('G: T1 «Ναι» → no «Πριν φύγεις:»', await page.getByText(LEAVING).count() === 0);
    await browser.close();
  }
  // ── H: T2 with a tier-A crisis signal → the safety path, no door ──────────
  {
    const { browser, page, calls } = await session('?stageA=1', ['Τι είναι αυτό που σε κρατάει εκεί;', 'Και τι σε τραβάει αλλού;', 'Είμαι εδώ μαζί σου. Είσαι ασφαλής αυτή τη στιγμή;']);
    await send(page, 'Γεια. Δεν ξέρω αν πρέπει να φύγω από τη δουλειά μου στην τράπεζα.');
    if (await page.getByText('Γιατί έχει σημασία αυτό για σένα τώρα;').count()) await send(page, 'Γιατί κάθε μέρα νιώθω πιο άδειος εκεί μέσα.');
    await send(page, 'Η σταθερότητα κυρίως.');
    await send(page, 'Κλείνουμε εδώ, δεν θέλω να ζω άλλο.');
    await page.waitForTimeout(500);
    ok('H: tier-A crisis T2 → the crisis line, no «Πριν φύγεις:», no root button', await page.getByText(/1018/).count() >= 1 && await page.getByText(LEAVING).count() === 0 &&
      await page.getByRole('button', { name: 'Νομίζω βρήκα τι με απασχολεί' }).count() === 0);
    await browser.close();
  }
  // ── I: switch closed, «Ευχαριστώ.» → the old closing exactly as before ─────
  {
    const { browser, page, calls } = await session('', ['Τι είναι αυτό που σε κρατάει εκεί;', 'Και τι σε τραβάει αλλού;', 'Τι θα σήμαινε αυτό για σένα;']);
    await send(page, 'Γεια. Δεν ξέρω αν πρέπει να φύγω από τη δουλειά μου στην τράπεζα.');
    if (await page.getByText('Γιατί έχει σημασία αυτό για σένα τώρα;').count()) await send(page, 'Γιατί κάθε μέρα νιώθω πιο άδειος εκεί μέσα.');
    await send(page, 'Η σταθερότητα κυρίως.');
    await send(page, 'Μάλλον φοβάμαι την αλλαγή.');
    await send(page, 'Ευχαριστώ.');
    ok('I: closed switch → «Ευχαριστώ.» opens the old closing card, no «Πριν φύγεις:»', await page.getByRole('button', { name: 'Δείξε μου' }).count() === 1 && await page.getByText(LEAVING).count() === 0);
    ok('I: closed switch → no marker in any request', calls.every(c => !systemText(c).includes('[FREE PART: ENDS AT ROOT]\n')));
    await browser.close();
  }  // ── S: SAFETY FIRST (ADR «7 Οκτωβρίου (β)») — the scenarios of the safety report, crisis A / B and DISTRESS,
  // switch closed and open. Fixtures: A «Δεν θέλω να ζω άλλο.» · B «Απελπισία. Δεν βλέπω νόημα σε τίποτα πια.» ·
  // DISTRESS «Το πένθος για τη μητέρα μου με έχει παραλύσει.»
  {
    const A = 'Δεν θέλω να ζω άλλο.', B = 'Απελπισία. Δεν βλέπω νόημα σε τίποτα πια.', D = 'Το πένθος για τη μητέρα μου με έχει παραλύσει.';
    const OPEN = ['Γεια. Δεν ξέρω αν πρέπει να φύγω από τη δουλειά μου στην τράπεζα.', 'Γιατί κάθε μέρα νιώθω πιο άδειος εκεί μέσα.', 'Η σταθερότητα κυρίως.', 'Μάλλον φοβάμαι την αλλαγή.'];
    const WQ = 'ΗΡΘΕΣ ΜΕ: α\nΒΡΗΚΕΣ: β\nΦΕΥΓΕΙΣ ΜΕ: γ\n\nΠριν φύγεις — μία λέξη, ή μια σύντομη φράση που θέλεις να κρατήσεις.';
    const SUP = 'Είμαι εδώ μαζί σου. Είσαι ασφαλής αυτή τη στιγμή;';
    const R4 = ['Τι σε κρατάει εκεί;', 'Και τι σε τραβάει αλλού;', 'Τι θα σήμαινε αυτό για σένα;', 'Εντάξει. Είμαι εδώ αν θέλεις να συνεχίσουμε.'];
    const say = async (page, list) => { for (const m of list) { if (!(await page.locator('textarea.textarea').count())) return false; await send(page, m); } return true; };
    const click = async (page, name) => { const b = page.getByRole('button', { name, exact: true }); if (!(await b.count())) return false; await b.first().click(); await page.waitForTimeout(1500); return true; };
    const has = async (page, name) => (await page.getByRole('button', { name, exact: true }).count()) > 0;
    const ended = async page => (await page.getByText('ξεκλείδωσε').count()) > 0 || await has(page, 'Νέα συνεδρία');
    const stageAToWord = async page => { await say(page, OPEN.slice(0, 3)); await click(page, 'Νομίζω βρήκα τι με απασχολεί');
      await send(page, 'Ότι φοβάμαι να απογοητεύσω τον πατέρα μου.'); await click(page, 'Ναι, αυτό είναι'); await click(page, 'Όχι τώρα'); await click(page, '6'); };
    // 1 — a crisis / DISTRESS message at the «μία λέξη» step: the next message is NOT the word, the session stays open
    for (const [lvl, msg, reply] of [['A', A, SUP], ['DISTRESS', D, 'Είμαι εδώ. Θέλεις να μου πεις λίγο περισσότερο;']]) {
      for (const sw of ['closed', 'open']) {
        const { browser, page, calls } = await session(sw === 'open' ? '?stageA=1' : '',
          sw === 'open' ? ['Τι σε κρατάει εκεί;', 'Και τι σε τραβάει αλλού;', reply, 'Πες μου τι γίνεται τώρα.'] : [...R4, WQ, reply, 'Πες μου τι γίνεται τώρα.']);
        if (sw === 'open') await stageAToWord(page); else { await say(page, [...OPEN, 'Ευχαριστώ.']); await click(page, 'Δείξε μου'); }
        const atWord = await page.getByText('Πριν φύγεις — μία λέξη').count() >= 1 && await page.locator('textarea.textarea').count() === 1;
        await send(page, msg);
        const before = calls.length;
        await send(page, 'Όχι');
        await page.waitForTimeout(900);
        ok(`S1 (${lvl}, switch ${sw}): at the word step, after «${msg.slice(0, 22)}…» the next «Όχι» is a message, not the word — session open`,
          atWord && !(await ended(page)) && calls.length === before + 1 && calls[calls.length - 1].messages.slice(-1)[0].content === 'Όχι' && await page.locator('textarea.textarea').count() === 1);
        await browser.close();
      }
    }
    // 2 — «ευχαριστώ / κλείνουμε» in the SAME message as a crisis: no closing decision on that turn
    for (const [lvl, msg, line] of [['A', 'Κλείνουμε εδώ, δεν θέλω να ζω άλλο.', /1018/], ['B', 'Ευχαριστώ, κλείνουμε. Δεν βλέπω νόημα σε τίποτα πια.', /10306/]]) {
      for (const sw of ['closed', 'open']) {
        const { browser, page } = await session(sw === 'open' ? '?stageA=1' : '', [...R4.slice(0, 3), SUP]);
        await say(page, [...OPEN, msg]);
        await page.waitForTimeout(600);
        ok(`S2 (${lvl}, switch ${sw}): crisis + closing in one message → the crisis line, and NO closing card, warning or «Πριν φύγεις:»`,
          await page.getByText(line).count() >= 1 && !(await has(page, 'Δείξε μου')) && !(await has(page, 'Σταμάτα εδώ')) && await page.getByText(LEAVING).count() === 0);
        if (lvl === 'B' && sw === 'open') {
          ok('S2 (B, switch open): the root button is still there on that turn', await has(page, 'Νομίζω βρήκα τι με απασχολεί'));
          await click(page, 'Νομίζω βρήκα τι με απασχολεί');
          await send(page, 'Ότι φοβάμαι να αφήσω τη σιγουριά της δουλειάς.');
          ok('S2 (B, switch open): pressing it still works — the question, then the root card (risk line, as decided in (λ))',
            await has(page, 'Ναι, αυτό είναι') && await page.getByText('Με το "Ναι" ολοκληρώνεται αυτό το κομμάτι.').count() === 1);
        }
        await browser.close();
      }
    }
    // 3 — the 6€ paywall after a session with a risk signal (switch closed; with the switch open there is none)
    for (const [lvl, msg] of [['B', B], ['DISTRESS', D], ['none', null]]) {
      const { browser, page } = await session('', ['Τι σε κρατάει εκεί;', 'Είμαι εδώ. Θέλεις να μου πεις λίγο περισσότερο;', 'Τι θα σήμαινε αυτό για σένα;', 'Εντάξει. Είμαι εδώ αν θέλεις να συνεχίσουμε.', WQ, 'Η σκέψη σου παραμένει δική σου.']);
      await say(page, [OPEN[0], OPEN[1], msg || 'Η σταθερότητα κυρίως.', OPEN[3], 'Ευχαριστώ.']);
      await click(page, 'Δείξε μου');
      await send(page, 'αλλαγή');
      await page.waitForTimeout(900);
      if (lvl === 'none') ok('S3 (no signal, switch closed): the paywall is still there exactly as before', await page.getByText('ξεκλείδωσε').count() === 1);
      else ok(`S3 (${lvl}, switch closed): the session ends WITHOUT the 6€ paywall, and «Νέα συνεδρία» is there`,
        await page.getByText('η συνομιλία σταμάτησε εδώ').count() + (await page.getByText('Η σκέψη σου παραμένει δική σου.').count()) >= 1 &&
        await page.getByText('ξεκλείδωσε').count() === 0 && await has(page, 'Νέα συνεδρία'));
      await browser.close();
    }
    // 4 — the early word: an answer with a safety signal is not kept, so the closing asks for the word normally
    const EW = ['Τι σε κρατάει εκεί;', 'Αν κρατούσες μία λέξη για αυτό που νιώθεις τώρα, ποια θα ήταν; [[EARLY_WORD:yes]]', SUP, 'Και τι σε κρατάει;',
      'Εντάξει. Είμαι εδώ αν θέλεις να συνεχίσουμε.', 'Εντάξει. Είμαι εδώ αν θέλεις να συνεχίσουμε.', WQ, 'Η σκέψη σου παραμένει δική σου.'];
    for (const [lvl, msg] of [['B', B], ['DISTRESS', D]]) {
      for (const sw of ['closed', 'open']) {
        // The closing's Part 1 is the 6th request either way: with the switch open the first «Ευχαριστώ.» no longer goes
        // to the model (ADR «8 Οκτωβρίου»), the second closing does.
        const { browser, page } = await session(sw === 'open' ? '?stageA=1' : '', [...EW.slice(0, 5), WQ, EW[7]]);
        await say(page, [OPEN[0], OPEN[1], OPEN[2], msg, OPEN[3], 'Ευχαριστώ.']);
        if (sw === 'open') { await click(page, 'Δεν το βρήκα ακόμα, συνέχισε'); await send(page, 'Ευχαριστώ, κλείνουμε εδώ.'); }
        await click(page, 'Δείξε μου');
        ok(`S4 (${lvl}, switch ${sw}): the answer «${msg.slice(0, 22)}…» was not kept as the early word — the closing asks for the word, the session is still open`,
          !(await ended(page)) && await page.getByText('Πριν φύγεις — μία λέξη').count() >= 1 && await page.locator('textarea.textarea').count() === 1);
        await browser.close();
      }
    }
  }  // ── T: doors 2 and 3 pass the root-substance rule (ADR «7 Οκτωβρίου (γ)») ──────────────────────────────
  {
    const F1 = 'Γεια. Δεν ξέρω αν πρέπει να φύγω από τη δουλειά μου στην τράπεζα.', WHY = 'Γιατί κάθε μέρα νιώθω πιο άδειος εκεί μέσα.';
    const RQ = 'Νιώθεις ότι έχει αρχίσει να ξεκαθαρίζει τι είναι αυτό που πραγματικά σε απασχολεί;';
    const ASK = 'Πες το με μία φράση: τι είναι αυτό που πραγματικά σε απασχολεί;';
    const LONG = 'Τώρα κατάλαβα: φοβάμαι ότι αν φύγω από την τράπεζα θα απογοητεύσω τον πατέρα μου, που πάντα ήθελε να έχω σιγουριά.';
    const SUPR = 'Είμαι εδώ μαζί σου. Είσαι ασφαλής αυτή τη στιγμή;';
    const card = async page => (await page.getByRole('button', { name: 'Ναι, αυτό είναι', exact: true }).count()) > 0;
    const askShown = async page => (await page.getByText(ASK, { exact: true }).count()) >= 1 && (await page.getByRole('button', { name: 'Δεν το βρήκα ακόμα, συνέχισε', exact: true }).count()) === 1;
    const door2 = async (phrase) => {
      const s = await session('?stageA=1', ['Ακούω ότι σε βαραίνει η δουλειά. Τι σε κρατάει εκεί;', RQ, 'Πες μου με δικά σου λόγια τι είναι αυτό που σε κρατάει.', 'Και τι θα σήμαινε αυτό για σένα;', SUPR]);
      await send(s.page, F1); if (await s.page.getByText('Γιατί έχει σημασία αυτό για σένα τώρα;').count()) await send(s.page, WHY);
      await send(s.page, 'Η σταθερότητα, αλλά νιώθω ότι κάτι άλλο παίζει.'); await send(s.page, 'Ναι');
      s.before = s.calls.length; await send(s.page, phrase); return s;
    };
    const door3 = async (phrase) => {
      const s = await session('?stageA=1', ['Ακούω ότι σε βαραίνει η δουλειά. Τι σε κρατάει εκεί;', 'Τι αλλάζει για σένα τώρα που το λες;', SUPR]);
      await send(s.page, F1); if (await s.page.getByText('Γιατί έχει σημασία αυτό για σένα τώρα;').count()) await send(s.page, WHY);
      s.before = s.calls.length; await send(s.page, phrase); await s.page.waitForTimeout(500); return s;
    };
    for (const p of ['Δεν ξέρω', 'Ναι', 'Ναι, αυτό ακριβώς είναι!', 'Περίπου δηλαδή']) {
      const s = await door2(p);
      ok(`T door 2 «${p}»: no card — door 1's question with «Δεν το βρήκα ακόμα», nothing sent to the model`, !(await card(s.page)) && await askShown(s.page) && s.calls.length === s.before);
      if (p === 'Δεν ξέρω') {
        if (await s.page.locator('textarea.textarea').count()) await send(s.page, 'Φοβάμαι την απόρριψη');
        ok('T door 2: answering that question opens the card with the answer', await card(s.page) && await s.page.getByText('«Φοβάμαι την απόρριψη»').count() === 1 && s.calls.length === s.before);
      }
      if (p === 'Ναι') {
        await s.page.getByRole('button', { name: 'Δεν το βρήκα ακόμα, συνέχισε', exact: true }).first().click(); await s.page.waitForTimeout(500);
        ok('T door 2: «Δεν το βρήκα ακόμα» closes the question, no model call, the button is back', s.calls.length === s.before && !(await askShown(s.page)) &&
          await s.page.getByRole('button', { name: 'Νομίζω βρήκα τι με απασχολεί', exact: true }).count() === 1);
      }
      await s.browser.close();
    }
    {
      const s = await door2('Φοβάμαι την απόρριψη');
      ok('T door 2 «Φοβάμαι την απόρριψη»: the card, with that phrase', await card(s.page) && await s.page.getByText('«Φοβάμαι την απόρριψη»').count() === 1 && s.calls.length === s.before);
      await s.browser.close();
    }
    {
      const s = await door2('Δεν θέλω να ζω άλλο.');
      ok('T door 2, crisis in place of the phrase: the crisis path, no card, no question', !(await card(s.page)) && !(await askShown(s.page)) && await s.page.getByText(/1018/).count() >= 1 && s.calls.length === s.before + 1);
      await s.browser.close();
    }
    for (const p of ['Δεν ξέρω', 'Ναι', 'Περίπου δηλαδή']) {
      const s = await door3(p);
      ok(`T door 3 «${p}»: not a recognition at all — no card, no question, the normal reply (as today)`, !(await card(s.page)) && !(await askShown(s.page)) && s.calls.length === s.before + 1);
      await s.browser.close();
    }
    {
      const s = await door3('Ναι, αυτό ακριβώς είναι!');
      ok('T door 3 «Ναι, αυτό ακριβώς είναι!»: no card — door 1\'s question INSTEAD of a reply (no model call; ADR «8 Οκτωβρίου (β)»)', !(await card(s.page)) && await askShown(s.page) && s.calls.length === s.before);
      await s.browser.close();
    }
    {
      const s = await door3(LONG);
      ok('T door 3, a long message with the root: the card with the WHOLE message, as today', await card(s.page) && await s.page.getByText('«' + LONG + '»').count() === 1);
      await s.browser.close();
    }
    for (const [lvl, p, line] of [['A', 'Τώρα κατάλαβα, δεν θέλω να ζω άλλο.', /1018/], ['B', 'Τώρα κατάλαβα, δεν βλέπω νόημα σε τίποτα πια.', /10306/]]) {
      const s = await door3(p);
      ok(`T door 3, crisis ${lvl} in place of the phrase: the crisis path, no card, no question`, !(await card(s.page)) && !(await askShown(s.page)) && await s.page.getByText(line).count() >= 1);
      await s.browser.close();
    }
  }  // ── U: phone test 7/10 (ADR «8 Οκτωβρίου») — the first closing opens «Πριν φύγεις:» BEFORE the model; the root
  // question is scrolled into view at phone size. John's own transcript, with the model's own replies as the fake model.
  {
    const F1 = 'Δεν ξέρω αν πρέπει να αλλάξω δουλειά', W = 'Νιώθω ότι δεν πέτυχα όσα μπορούσα. Είμαι εκπαιδευτικός';
    const JR = ['Τι σημαίνει για σένα "όσα μπορούσα" — τι συγκεκριμένα φαντάστηκες κάποτε ότι θα πετύχεις;',
      'Και σήμερα — το πρόβλημα είναι ότι τα χρήματα δεν φτάνουν, ή ότι νιώθεις ότι άξιζες περισσότερα;',
      'Το σήμα είναι ξεκάθαρο — κλείνουμε εδώ.\n\nΑν ένας φίλος σου έλεγε ακριβώς αυτό που είπες εσύ, τι θα του απαντούσας;',
      'Αυτό που θα έλεγες στον φίλο σου — το επιτρέπεις και στον εαυτό σου;'];
    const ASK = 'Πες το με μία φράση: τι είναι αυτό που πραγματικά σε απασχολεί;';
    const BACK = 'Δεν το βρήκα ακόμα, συνέχισε';
    const btnN = (page, name) => page.getByRole('button', { name, exact: true });
    const start = async (query, replies, vp) => {
      const s = await session(query, replies);
      if (vp) await s.page.setViewportSize(vp);
      await send(s.page, F1); if (await s.page.getByText('Γιατί έχει σημασία αυτό για σένα τώρα;').count()) await send(s.page, W);
      await send(s.page, 'Περισσότερα χρήματα'); return s;
    };
    {
      const s = await start('?stageA=1', JR);
      const before = s.calls.length;
      await send(s.page, 'Ευχαριστώ');
      ok('U1 (John): «Ευχαριστώ» → NO model call that turn, the closing\'s root question with «Δεν το βρήκα ακόμα»',
        s.calls.length === before && await s.page.getByText(LEAVING).count() === 1 && await btnN(s.page, BACK).count() === 1);
      ok('U1: the new wording, exactly — «Αν κάτι σου ξεκαθάρισε, πες το με μία φράση: τι είναι αυτό που πραγματικά σε απασχολεί;»',
        await s.page.getByText('Αν κάτι σου ξεκαθάρισε, πες το με μία φράση: τι είναι αυτό που πραγματικά σε απασχολεί;', { exact: true }).count() === 1);
      ok('U1 (John): the model\'s closing reply («Το σήμα είναι ξεκάθαρο…», the friend question) never appears',
        await s.page.getByText('Το σήμα είναι ξεκάθαρο').count() === 0 && await s.page.getByText('Αν ένας φίλος σου').count() === 0);
      await send(s.page, 'Ίσως η κενοδοξια των χρημάτων');
      ok('U1 (John): the answer to «Πριν φύγεις:» becomes the root card — nothing sent', s.calls.length === before &&
        await btnN(s.page, 'Ναι, αυτό είναι').count() === 1 && await s.page.getByText('«Ίσως η κενοδοξια των χρημάτων»').count() === 1);
      await s.browser.close();
    }
    {
      const s = await start('?stageA=1', [JR[0], JR[1], 'Τι σε κρατάει εκεί;', 'Εντάξει. Είμαι εδώ αν θέλεις να συνεχίσουμε.']);
      await send(s.page, 'Ευχαριστώ');
      await btnN(s.page, BACK).click(); await s.page.waitForTimeout(500);
      const b2 = s.calls.length;
      await send(s.page, 'Ίσως η κενοδοξια των χρημάτων');
      ok('U2: after «Δεν το βρήκα ακόμα» the conversation goes on — the next message gets its normal reply, no question opens by itself',
        s.calls.length === b2 + 1 && await s.page.getByText(ASK, { exact: true }).count() === 0 && await s.page.getByText(LEAVING).count() === 0);
      const b3 = s.calls.length;
      await send(s.page, 'Ευχαριστώ, κλείνουμε εδώ.');
      ok('U2: the SECOND closing is unchanged — the model is called and the old closing card opens', s.calls.length === b3 + 1 && await btnN(s.page, 'Δείξε μου').count() === 1);
      await s.browser.close();
    }
    for (const [lvl, msg, line] of [['B', 'Ευχαριστώ, κλείνουμε. Δεν βλέπω νόημα σε τίποτα πια.', /10306/], ['A', 'Κλείνουμε εδώ, δεν θέλω να ζω άλλο.', /1018/]]) {
      const s = await start('?stageA=1', [JR[0], JR[1], 'Είμαι εδώ μαζί σου. Είσαι ασφαλής αυτή τη στιγμή;']);
      const before = s.calls.length;
      await send(s.page, msg); await s.page.waitForTimeout(500);
      ok(`U3 (crisis ${lvl} + closing): the safety path as today — the model IS called, the crisis line, no door, no closing card`,
        s.calls.length === before + 1 && await s.page.getByText(line).count() >= 1 && await s.page.getByText(LEAVING).count() === 0 && await btnN(s.page, 'Δείξε μου').count() === 0);
      await s.browser.close();
    }
    {
      const s = await start('?stageA=1', [JR[0], JR[1], 'Είμαι εδώ. Θέλεις να μου πεις λίγο περισσότερο;']);
      const before = s.calls.length;
      await send(s.page, 'Ευχαριστώ, κλείνουμε. Το πένθος για τη μητέρα μου με έχει παραλύσει.'); await s.page.waitForTimeout(500);
      ok('U3 (DISTRESS + closing, switch open): the model IS called, NO door, the old closing card — as with the switch closed (ADR «8 Οκτωβρίου (β)»)',
        s.calls.length === before + 1 && await s.page.getByText(LEAVING).count() === 0 && await btnN(s.page, 'Δείξε μου').count() === 1);
      if (await btnN(s.page, 'Έχω κι άλλο να πω').count()) { await btnN(s.page, 'Έχω κι άλλο να πω').click(); await s.page.waitForTimeout(500); }
      ok('U3 (DISTRESS + closing, switch open): after «Έχω κι άλλο να πω» the root button is available', await btnN(s.page, 'Νομίζω βρήκα τι με απασχολεί').count() === 1);
      await s.browser.close();
    }
    {
      const s = await start('', [JR[0], JR[1], 'Είμαι εδώ. Θέλεις να μου πεις λίγο περισσότερο;']);
      const before = s.calls.length;
      await send(s.page, 'Ευχαριστώ, κλείνουμε. Το πένθος για τη μητέρα μου με έχει παραλύσει.'); await s.page.waitForTimeout(500);
      ok('U3 (DISTRESS + closing, switch closed): the reference — model called, old closing card', s.calls.length === before + 1 && await btnN(s.page, 'Δείξε μου').count() === 1);
      await s.browser.close();
    }
    {
      const s = await start('', JR);
      const before = s.calls.length;
      await send(s.page, 'Ευχαριστώ');
      ok('U4 (switch closed): «Ευχαριστώ» → the model is called and the old closing card opens, exactly as before',
        s.calls.length === before + 1 && await btnN(s.page, 'Δείξε μου').count() === 1 && await s.page.getByText(LEAVING).count() === 0);
      await s.browser.close();
    }
    // C — at phone size (and with the keyboard up) the root question and «Δεν το βρήκα ακόμα» are fully visible above the input.
    // The question's own line and the «Δεν το βρήκα ακόμα» button under it must lie between the top of the screen and
    // the top of the (sticky, transparent) input area.
    const visible = async (page, text) => page.evaluate(([t, b]) => {
      const q = [...document.querySelectorAll('.warning-card .warning-text')].find(x => x.innerText.includes(t));
      const card = q && q.closest('.warning-card');
      const U = x => x.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase(); // the buttons are shown in capitals, without accents
      const btn = card && [...card.querySelectorAll('button')].find(x => U(x.innerText).startsWith(U(b).slice(0, 10)));
      const inp = document.querySelector('.input-area');
      if (!q || !btn || !inp) return false;
      const top = inp.getBoundingClientRect().top, a = q.getBoundingClientRect(), r = btn.getBoundingClientRect();
      return a.top >= 0 && a.bottom <= top && r.top >= 0 && r.bottom <= top;
    }, [text, BACK]);
    for (const vp of [{ width: 390, height: 700 }, { width: 390, height: 430 }]) {
      const s = await start('?stageA=1', [JR[0], JR[1], 'Τι σε κρατάει εκεί;', JR[3]], vp);
      await send(s.page, 'Ευχαριστώ'); await s.page.waitForTimeout(900);
      ok(`U5 (phone ${vp.width}×${vp.height}): the closing's root question and «Δεν το βρήκα ακόμα» fully visible above the input`, await visible(s.page, 'Αν κάτι σου ξεκαθάρισε'));
      await btnN(s.page, BACK).click(); await s.page.waitForTimeout(500);
      await send(s.page, 'Ίσως η κενοδοξια των χρημάτων');
      await btnN(s.page, 'Νομίζω βρήκα τι με απασχολεί').click(); await s.page.waitForTimeout(900);
      ok(`U5 (phone ${vp.width}×${vp.height}): after the button, «Πες το με μία φράση…» and «Δεν το βρήκα ακόμα» fully visible above the input (the phone test cut «απασχολεί;»)`,
        await visible(s.page, 'Πες το με μία φράση'));
      await send(s.page, 'Φοβάμαι ότι δεν αξίζω περισσότερα.');
      await btnN(s.page, 'Διόρθωσε').click(); await s.page.waitForTimeout(900);
      ok(`U5 (phone ${vp.width}×${vp.height}): after «Διόρθωσε» the correction question fully visible above the input`,
        await visible(s.page, 'Γράψε τη ρίζα όπως θα την έλεγες εσύ'));
      await s.browser.close();
    }
  }  // ── V: internal labels never reach the user (ADR «8 Οκτωβρίου (β)», every user, switch open or closed). Phone test 8/10,
  // switch closed: «[MASTER PRIORITY RULE — STAGE: GRACEFUL EXIT]\n\nΚαλή συνέχεια.» was shown as the reply.
  {
    const F1 = 'Δεν ξέρω αν πρέπει να φύγω από την δουλειά μου', W = 'Νιώθω ότι δεν πέτυχα όσα άξιζα';
    const LEAK = '[MASTER PRIORITY RULE — STAGE: GRACEFUL EXIT]\n\nΚαλή συνέχεια.';
    const WQ = 'ΗΡΘΕΣ ΜΕ: α\nΒΡΗΚΕΣ: β\nΦΕΥΓΕΙΣ ΜΕ: γ\n\nΠριν φύγεις — μία λέξη, ή μια σύντομη φράση που θέλεις να κρατήσεις.';
    const bubbles = async page => (await page.locator('.turn-aura').allInnerTexts()).map(t => t.replace(/^\s*aura\s*\n/i, '').trim());
    const open = async (query, replies) => { const s = await session(query, replies); await s.page.setViewportSize({ width: 390, height: 700 });
      await send(s.page, F1); if (await s.page.getByText('Γιατί έχει σημασία αυτό για σένα τώρα;').count()) await send(s.page, W); return s; };
    {
      // switch closed, the phone test itself: the label goes, «Καλή συνέχεια.» stays — on screen and in what the model sees next
      const s = await open('', ['Τι εννοείς με το «άξιζα»;', 'Τι σε κρατάει εκεί ακόμα;', LEAK, WQ, 'Η σκέψη σου παραμένει δική σου.']);
      await send(s.page, 'Περισσότερα χρήματα. Είμαι εκπαιδευτικός.');
      await send(s.page, 'Ευχαριστώ');
      const b = await bubbles(s.page);
      ok('V1 (switch closed, phone size): the reply shows «Καλή συνέχεια.» only — no «[MASTER PRIORITY RULE …]»',
        b[b.length - 1] === 'Καλή συνέχεια.' && await s.page.getByText('MASTER PRIORITY').count() === 0);
      // «Δείξε μου» → the closing's first request carries the whole history: the clean reply, no label
      await s.page.getByRole('button', { name: 'Δείξε μου', exact: true }).click(); await s.page.waitForTimeout(1500);
      const next = s.calls[s.calls.length - 1];
      ok('V1: the history keeps the clean reply — the next request carries «Καλή συνέχεια.» and no label',
        next.messages.some(m => m.role === 'assistant' && m.content === 'Καλή συνέχεια.') && !JSON.stringify(next.messages).includes('MASTER PRIORITY'));
      if (await s.page.locator('textarea.textarea').count()) { await send(s.page, 'αμοιβή'); await s.page.waitForTimeout(1500); }
      const tel = await s.page.evaluate(() => (window.__auraTelemetry || []).filter(r => r.ev === 'session_completed').pop() || null);
      ok('V1: session_completed counts it (labelLeaks ≥ 1, a number only)', !!tel && Number.isInteger(tel.labelLeaks) && tel.labelLeaks >= 1);
      await s.browser.close();
    }
    for (const q of ['', '?stageA=1']) {
      const sw = q ? 'open' : 'closed';
      {
        const s = await open(q, ['Τι εννοείς με το «άξιζα»;', '[MASTER PRIORITY RULE — STAGE: GRACEFUL EXIT]', 'Τι σε κρατάει;']);
        await send(s.page, 'Περισσότερα χρήματα.');
        const b = await bubbles(s.page);
        // Empty after cleaning: no empty bubble — the EXISTING rule for a reply with no words (bare emoji fix) adds its
        // neutral question, as it would for any empty reply.
        ok(`V2 (switch ${sw}): a reply that is only a label → no empty bubble, no label (the existing empty-reply rule answers)`,
          b.every(t => t.length > 0) && b[b.length - 1] === 'Τι σκέφτεσαι τώρα;' && await s.page.getByText('MASTER PRIORITY').count() === 0);
        await s.browser.close();
      }
      {
        const s = await open(q, ['Τι εννοείς με το «άξιζα»;', 'Είπες [σε παρένθεση] «περισσότερα χρήματα» — [1] τι σημαίνει αυτό για σένα;', 'Και;']);
        await send(s.page, 'Περισσότερα χρήματα.');
        const b = await bubbles(s.page);
        ok(`V3 (switch ${sw}): ordinary text in brackets stays exactly as written`, b[b.length - 1] === 'Είπες [σε παρένθεση] «περισσότερα χρήματα» — [1] τι σημαίνει αυτό για σένα;');
        await s.browser.close();
      }
      {
        const s = await open(q, ['Τι εννοείς με το «άξιζα»;', '[FREE PART: ENDS AT ROOT]\n[CODE-VERIFIED KNOWLEDGE STATE (observation only)]\nΤι σε κρατάει; [[EXIT:no]] Πες μου.', 'Και;']);
        await send(s.page, 'Περισσότερα χρήματα.');
        const b = await bubbles(s.page);
        ok(`V4 (switch ${sw}): other labels and a hidden tag in the middle — gone, the words kept`, b[b.length - 1] === 'Τι σε κρατάει; Πες μου.');
        await s.browser.close();
      }
    }
  }
  await runMockW();
  await runMockX();
}

// ── W: the hidden tags still work after the label cleaning (founder's check of 6408fbf, ADR «8 Οκτωβρίου (γ)»), switch
// closed and open. [[EXIT:yes]] at the end of a reply → the old closing card (T5); [[EXIT:no]] → none; [[EARLY_WORD:yes]]
// → the next answer is kept as the word, and at the closing «Δείξε μου» ends the session at once, without asking for it
// (two closing requests). W4 is the same session without the tag (the control). A tag never shows, on screen or in the
// history. The proof: W1–W4 pass the same way on the App.jsx before 6408fbf (9781710). W5: a reply with no words after a
// closing gets «Καλή συνέχεια.», not «Καληνύχτα.» (founder's point 2, same ADR). Alone: --only W.
async function runMockW() {
  const F1 = 'Δεν ξέρω αν πρέπει να φύγω από την δουλειά μου', WHY = 'Νιώθω ότι δεν πέτυχα όσα άξιζα';
  const NAMED = 'Αυτό που περιέγραψες έχει πια όνομα.';
  const WORDQ = 'Αν κρατούσες μία λέξη από όλο αυτό, ποια θα ήταν;';
  const WQ = 'ΗΡΘΕΣ ΜΕ: α\nΒΡΗΚΕΣ: β\nΦΕΥΓΕΙΣ ΜΕ: γ\n\nΠριν φύγεις — μία λέξη, ή μια σύντομη φράση που θέλεις να κρατήσεις.';
  const LEAVING = APP.texts.askLeaving;
  const bubbles = async page => (await page.locator('.turn-aura').allInnerTexts()).map(t => t.replace(/^\s*aura\s*\n/i, '').trim());
  const tagOnScreen = async page => (await page.locator('body').innerText()).includes('[[');
  const tagInHistory = calls => calls.some(c => (c.messages || []).some(m => m.role === 'assistant' && String(m.content).includes('[[')));
  const card = async page => (await page.getByRole('button', { name: 'Δείξε μου', exact: true }).count()) === 1;
  const ended = async page => (await page.getByText('ξεκλείδωσε').count()) > 0 || (await page.getByRole('button', { name: 'Νέα συνεδρία' }).count()) > 0;
  const closingCalls = calls => calls.filter(c => LIB.classifyRequest(c, APP).kind === 'termination');
  const lastUser = c => [...((c && c.messages) || [])].reverse().find(m => m.role === 'user') || { content: '' };
  const open = async (query, replies) => { const s = await session(query, replies); await s.page.setViewportSize({ width: 390, height: 700 });
    await send(s.page, F1); if (await s.page.getByText('Γιατί έχει σημασία αυτό για σένα τώρα;').count()) await send(s.page, WHY); return s; };
  for (const q of ['', '?stageA=1']) {
    const sw = q ? 'open' : 'closed';
    {
      const s = await open(q, ['Τι εννοείς με το «άξιζα»;', NAMED + ' [[EXIT:yes]]', 'Και;']);
      await send(s.page, 'Περισσότερα χρήματα.');
      const b = await bubbles(s.page);
      ok(`W1 (switch ${sw}): a reply ending in [[EXIT:yes]] → the old closing card «Δείξε μου» (T5); the reply shows without the tag`,
        await card(s.page) && b[b.length - 1] === NAMED && !(await tagOnScreen(s.page)));
      if (q) ok('W1 (switch open): T5 is the model\'s signal, not a closing by the user → no «Πριν φύγεις» door', await s.page.getByText(LEAVING).count() === 0);
      await s.page.screenshot({ path: path.join(OUT, `W1-${sw}.png`), fullPage: false });
      await s.browser.close();
    }
    {
      const s = await open(q, ['Τι εννοείς με το «άξιζα»;', NAMED + ' [[EXIT:no]]', 'Και;']);
      await send(s.page, 'Περισσότερα χρήματα.');
      const b = await bubbles(s.page);
      ok(`W2 (switch ${sw}): [[EXIT:no]] → no closing card, the conversation goes on, no tag shown`,
        !(await card(s.page)) && b[b.length - 1] === NAMED && await s.page.locator('textarea.textarea').count() === 1 && !(await tagOnScreen(s.page)));
      await s.browser.close();
    }
    for (const tagged of [true, false]) {
      const W = tagged ? 'W3' : 'W4';
      const s = await open(q, ['Τι εννοείς με το «άξιζα»;', WORDQ + (tagged ? ' [[EARLY_WORD:yes]]' : ''), NAMED + ' [[EXIT:yes]]',
        tagged ? 'Κράτα το «ελευθερία».' : WQ, 'Η σκέψη σου παραμένει δική σου.']);
      await send(s.page, 'Περισσότερα χρήματα.');
      const b = await bubbles(s.page);
      if (tagged) ok(`W3 (switch ${sw}): the question carrying [[EARLY_WORD:yes]] shows without the tag`, b[b.length - 1] === WORDQ && !(await tagOnScreen(s.page)));
      await send(s.page, 'ελευθερία');
      const hadCard = await card(s.page);
      if (hadCard) { await s.page.getByRole('button', { name: 'Δείξε μου', exact: true }).click(); await s.page.waitForTimeout(1500); }
      const cc = closingCalls(s.calls);
      const parts = cc.map(c => (LIB.classifyRequest(c, APP).closing || {}).part).join(',');
      if (tagged) {
        ok(`W3 (switch ${sw}): the answer is kept as the word — «Δείξε μου» → Part 1 carries «ελευθερία» and is told not to ask again`,
          hadCard && cc.length >= 1 && lastUser(cc[0]).content.includes('"ελευθερία"') && /do NOT ask for it again/.test(lastUser(cc[0]).content));
        ok(`W3 (switch ${sw}): … then Part 2 at once — two closing requests, the session ends, the word is never asked`,
          parts === 'Part 1,Part 2' && await ended(s.page) && await s.page.getByText('Πριν φύγεις — μία λέξη').count() === 0);
        await s.page.screenshot({ path: path.join(OUT, `W3-${sw}.png`), fullPage: true });
      } else {
        ok(`W4 (switch ${sw}, control, no tag): «Δείξε μου» → one closing request (Part 1) that asks for the word, the session waits for it`,
          hadCard && parts === 'Part 1' && !lastUser(cc[0]).content.includes('"ελευθερία"') && !(await ended(s.page)) &&
          await s.page.getByText('Πριν φύγεις — μία λέξη').count() >= 1 && await s.page.locator('textarea.textarea').count() === 1);
      }
      ok(`${W} (switch ${sw}): no tag on screen and none in the history sent to the model`, !(await tagOnScreen(s.page)) && !tagInHistory(s.calls));
      await s.browser.close();
    }
    {
      // W5: the model answers a closing with an emoji only. UPDATED (8/10, ADR «8 Οκτωβρίου (δ)», 2): when the closing card opens on
      // that same reply no farewell is added (a goodbye, then the card, then the real closing = two goodbyes) — the reply stays «🙂».
      // Switch open: the first «Ευχαριστώ» opens the door before the model, so the closing that reaches the model is the second one.
      const s = await open(q, ['Τι εννοείς με το «άξιζα»;', '🙂', WQ]);
      if (q) { await send(s.page, 'Ευχαριστώ'); await s.page.getByRole('button', { name: 'Δεν το βρήκα ακόμα, συνέχισε', exact: true }).click(); await s.page.waitForTimeout(500); }
      await send(s.page, q ? 'Ευχαριστώ, κλείνουμε εδώ.' : 'Ευχαριστώ');
      const b = await bubbles(s.page);
      ok(`W5 (switch ${sw}): an emoji-only reply to a closing, the card opens on it → just «🙂», no farewell added (no «Καληνύχτα», no «Καλή συνέχεια.»)`,
        b[b.length - 1] === '🙂' && await card(s.page) && await s.page.getByText('Καληνύχτα').count() === 0 && await s.page.getByText('Καλή συνέχεια').count() === 0);
      await s.browser.close();
    }
  }
}

// ── X: ADR «8 Οκτωβρίου (δ)» — the decisions after the red-team of the last 15 pushes ─────────────────────────
// X1 door 2: «Ναι» to the readiness question → no model call, the root question at once, the «Ναι» shown (not sent)
// X2 a crisis / DISTRESS sentence in place of the «Ναι» → the safety path, no root question
// X3 GRACEFUL EXIT before the root (switch open): not sent for a bare «Ναι»; sent when the old closing really opens (T1 with
//    4+ messages, a second exit); switch closed: as today
// X4 an emoji-only reply: no farewell when the closing card opens on it; the farewell stays when no card opens
// X5 the user's message is shown (not sent) on every path where it goes nowhere: the first closing, door 1/2/3 and the
//    correction without substance — in the transcript, in order, and in no request
// X6 the one-tap question is recorded (asked / choice / none) in the device log and in the ?debug=1 export file
async function runMockX() {
  const F1 = 'Γεια. Δεν ξέρω αν πρέπει να φύγω από τη δουλειά μου στην τράπεζα.', WHY = 'Γιατί κάθε μέρα νιώθω πιο άδειος εκεί μέσα.';
  const RQ = 'Νιώθεις ότι έχει αρχίσει να ξεκαθαρίζει τι είναι αυτό που πραγματικά σε απασχολεί;';
  const SUP = 'Είμαι εδώ μαζί σου. Είσαι ασφαλής αυτή τη στιγμή;';
  const T = APP.texts;
  const ASK = T.ask, BACK = T.back, LEAVING = T.askLeaving;
  const userBubbles = async page => (await page.locator('.turn-user').allInnerTexts()).map(t => t.replace(/\s+/g, ' ').trim());
  const turnTexts = async page => (await page.locator('.turn').allInnerTexts()).map(t => t.replace(/^\s*aura\s*\n/i, '').replace(/\s+/g, ' ').trim());
  const sentUser = calls => calls.flatMap(c => (c.messages || []).filter(m => m.role === 'user').map(m => String(m.content)));
  const graceful = c => systemText(c).includes('STAGE: GRACEFUL EXIT (code-verified');
  const stageName = c => (systemText(c).match(/\[MASTER PRIORITY RULE — STAGE: ([A-Z ]+)/) || [])[1] || '';
  const card = async page => (await page.getByRole('button', { name: 'Δείξε μου', exact: true }).count()) === 1;
  const askShown = async page => (await page.getByText(ASK, { exact: true }).count()) >= 1 && (await page.getByRole('button', { name: BACK, exact: true }).count()) === 1;
  // a missing button is a no-op click (the assertion that needed it then fails), never a crash — so the same section runs on old code too
  const btn = (page, name) => { const loc = page.getByRole('button', { name, exact: true }); const go = async () => { if (await loc.count()) await loc.first().click({ timeout: 4000 }); };
    return { count: () => loc.count(), click: go, first: () => ({ click: go }) }; };
  const start = async (query, replies) => { const s = await session(query, replies); await s.page.setViewportSize({ width: 390, height: 700 });
    await send(s.page, F1); if (await s.page.getByText('Γιατί έχει σημασία αυτό για σένα τώρα;').count()) await send(s.page, WHY); return s; };

  // ── X1: door 2 ────────────────────────────────────────────────────────────
  {
    const s = await start('?stageA=1', ['Ακούω ότι σε βαραίνει η δουλειά. Τι σε κρατάει εκεί;', RQ, 'Και τι σε τραβάει αλλού;', 'Η σκέψη σου παραμένει δική σου.']);
    await send(s.page, 'Η σταθερότητα, αλλά νιώθω ότι κάτι άλλο παίζει.');
    const n = s.calls.length;
    ok('X1: the readiness question is on screen (2 model calls so far)', n === 2 && await s.page.getByText(RQ).count() === 1);
    await send(s.page, 'Ναι');
    ok('X1: «Ναι» → NO model call', s.calls.length === n);
    ok('X1: door 1\'s question appears at once, with «Δεν το βρήκα ακόμα»', await askShown(s.page));
    ok('X1: the user\'s «Ναι» stays on the screen as their bubble', (await userBubbles(s.page)).slice(-1)[0] === 'Ναι');
    { const t = await turnTexts(s.page); const iq = t.findIndex(x => x.includes('Νιώθεις ότι έχει αρχίσει')); const iy = t.lastIndexOf('Ναι');
      ok('X1: the bubble comes right after the question it answers', iq >= 0 && iy === iq + 1); }
    await s.page.screenshot({ path: path.join(OUT, 'X1-door2-yes.png'), fullPage: false });
    await send(s.page, 'Δεν ξέρω');
    ok('X1: a short answer → «Γράψ\' το λίγο πιο ολοκληρωμένα», no card, no model call, the answer shown', await s.page.getByText(T.retry).count() === 1 &&
      await btn(s.page, 'Ναι, αυτό είναι').count() === 0 && s.calls.length === n && (await userBubbles(s.page)).slice(-1)[0] === 'Δεν ξέρω');
    await send(s.page, 'Φοβάμαι την απόρριψη');
    ok('X1: an answer with substance → the card with it, no model call', await s.page.getByText('«Φοβάμαι την απόρριψη»').count() === 1 && await btn(s.page, 'Ναι, αυτό είναι').count() === 1 && s.calls.length === n);
    await btn(s.page, BACK).first().click(); await s.page.waitForTimeout(1500);
    ok('X1: «Δεν το βρήκα ακόμα» on the door-2 card → the model answers the captured phrase (one call)', s.calls.length === n + 1);
    const last = s.calls[s.calls.length - 1];
    const lastUser = [...last.messages].reverse().find(m => m.role === 'user');
    ok('X1: that request ends with the phrase, carries the readiness question, and NEVER the «Ναι» or the short answer',
      lastUser && lastUser.content === 'Φοβάμαι την απόρριψη' && last.messages.some(m => m.role === 'assistant' && String(m.content).includes('Νιώθεις ότι έχει αρχίσει')) &&
      !sentUser(s.calls).includes('Ναι') && !sentUser(s.calls).includes('Δεν ξέρω'));
    await s.browser.close();
  }
  // door 2 «Ναι» → «Δεν το βρήκα ακόμα» at the QUESTION (not the card): back to the conversation, nothing sent, the latch is spent
  {
    const s = await start('?stageA=1', ['Ακούω ότι σε βαραίνει η δουλειά. Τι σε κρατάει εκεί;', RQ, 'Και τι σε τραβάει αλλού;']);
    await send(s.page, 'Η σταθερότητα, αλλά νιώθω ότι κάτι άλλο παίζει.');
    const n = s.calls.length;
    await send(s.page, 'Ναι'); await btn(s.page, BACK).click(); await s.page.waitForTimeout(500);
    ok('X1b: «Δεν το βρήκα ακόμα» at the question → the conversation goes on, no model call, the root button is back', s.calls.length === n && !(await askShown(s.page)) && await btn(s.page, 'Νομίζω βρήκα τι με απασχολεί').count() === 1);
    // the readiness latch is spent (it flipped exactly as it would have after a reply): another affirmative, with the question still the
    // last thing on screen, is an ordinary message now — the model answers it, the root question does not open a second time
    await send(s.page, 'Νιώθω ότι ναι.');
    ok('X1b: a second affirmative after «Δεν το βρήκα ακόμα» is an ordinary message (the model answers, no second root question)', s.calls.length === n + 1 && !(await askShown(s.page)));
    await send(s.page, 'Πιο πολύ φοβάμαι ότι θα μετανιώσω.');
    ok('X1b: only what was really said to the model was sent; the first «Ναι» is on screen but in no request',
      s.calls.length === n + 2 && !sentUser(s.calls).includes('Ναι') && sentUser(s.calls).includes('Νιώθω ότι ναι.') && (await userBubbles(s.page)).includes('Ναι'));
    await s.browser.close();
  }
  // the readiness question was asked EARLIER and is not the last thing on screen: a «Ναι» is not door 2 — the model answers it, as before
  {
    const s = await start('?stageA=1', ['Ακούω ότι σε βαραίνει η δουλειά. Τι σε κρατάει εκεί;', RQ, 'Τι σημαίνει για σένα η σταθερότητα;', 'Και τι θα σήμαινε αυτό;']);
    await send(s.page, 'Η σταθερότητα, αλλά νιώθω ότι κάτι άλλο παίζει.');
    await send(s.page, 'Δεν ξέρω ακόμα.');
    const n = s.calls.length;
    await send(s.page, 'Ναι');
    ok('X1d: the readiness question was asked two replies ago → a «Ναι» now is NOT door 2: the model is called as before, no root question', n === 3 && s.calls.length === n + 1 && !(await askShown(s.page)));
    await s.browser.close();
  }
  // a «Ναι» to anything else is NOT door 2 (the readiness question was not the last thing asked) → the model answers, as before
  {
    const s = await start('?stageA=1', ['Είναι η σταθερότητα αυτό που σε κρατάει;', 'Και τι θα σήμαινε αυτό για σένα;']);
    const n = s.calls.length;
    await send(s.page, 'Ναι');
    ok('X1c: a «Ναι» to an ordinary question → the model is called as before, no root question', s.calls.length === n + 1 && !(await askShown(s.page)));
    await s.browser.close();
  }

  // ── X2: safety first — a crisis / DISTRESS sentence in place of the «Ναι» ───────
  for (const [name, text, expect1018] of [['crisis A', 'Δεν θέλω να ζω άλλο.', true], ['DISTRESS', 'Το πένθος για τη μητέρα μου με έχει παραλύσει.', false]]) {
    const s = await start('?stageA=1', ['Ακούω ότι σε βαραίνει η δουλειά. Τι σε κρατάει εκεί;', RQ, SUP, 'Πες μου τι γίνεται τώρα.']);
    await send(s.page, 'Η σταθερότητα, αλλά νιώθω ότι κάτι άλλο παίζει.');
    const n = s.calls.length;
    await send(s.page, text); await s.page.waitForTimeout(500);
    ok(`X2 (${name}): in place of the «Ναι» → the safety path: the model is called, no root question, no card`, s.calls.length === n + 1 && !(await askShown(s.page)) && await btn(s.page, 'Ναι, αυτό είναι').count() === 0);
    ok(`X2 (${name}): the message is on screen once — as a normal message, not as a bubble twice`, (await userBubbles(s.page)).filter(t => t === text).length === 1 && sentUser(s.calls).filter(t => t === text).length === 1);
    if (expect1018) ok('X2 (crisis A): the crisis line is shown', await s.page.getByText(/1018/).count() >= 1);
    await s.browser.close();
  }

  // ── X3: GRACEFUL EXIT before the root ────────────────────────────────────
  {
    const s = await start('?stageA=1', ['Είναι η σταθερότητα αυτό που σε κρατάει;', 'Και τι θα σήμαινε αυτό για σένα;']);
    await send(s.page, 'Ναι');
    ok('X3a (switch open): a bare «Ναι» before the root (3 user messages) → the request carries NO GRACEFUL EXIT, the normal-loop stage instead',
      s.calls.length === 2 && !graceful(s.calls[1]) && stageName(s.calls[1]).startsWith('PERSPECTIVE SWAP') && systemText(s.calls[1]).includes('[FREE PART: ENDS AT ROOT]'));
    await s.browser.close();
  }
  {
    const s = await start('', ['Είναι η σταθερότητα αυτό που σε κρατάει;', 'Και τι θα σήμαινε αυτό για σένα;']);
    await send(s.page, 'Ναι');
    ok('X3d (switch CLOSED): the same «Ναι» → GRACEFUL EXIT is sent exactly as today', s.calls.length === 2 && graceful(s.calls[1]));
    await s.browser.close();
  }
  {
    const s = await start('?stageA=1', ['Τι σε κρατάει εκεί;', 'Και τι σε τραβάει αλλού;', 'Είναι η σταθερότητα αυτό που σε κρατάει;', 'Εντάξει.']);
    await send(s.page, 'Η σταθερότητα κυρίως.'); await send(s.page, 'Μάλλον φοβάμαι την αλλαγή.');
    await send(s.page, 'Ναι');
    ok('X3b (switch open): a «Ναι» with 4+ user messages opens the old closing (T1) → GRACEFUL EXIT is sent, as today', s.calls.length === 4 && graceful(s.calls[3]) && await card(s.page));
    await s.browser.close();
  }
  {
    const s = await start('?stageA=1', ['Τι σε κρατάει εκεί;', 'Και τι σε τραβάει αλλού;', 'Τι θα σήμαινε αυτό για σένα;', 'Εντάξει. Είμαι εδώ αν θέλεις να συνεχίσουμε.']);
    await send(s.page, 'Η σταθερότητα κυρίως.'); await send(s.page, 'Μάλλον φοβάμαι την αλλαγή.');
    await send(s.page, 'Ευχαριστώ.');
    ok('X3c: the first «Ευχαριστώ.» opens the door before the model (no call, bubble shown)', s.calls.length === 3 && await s.page.getByText(LEAVING).count() === 1 && (await userBubbles(s.page)).slice(-1)[0] === 'Ευχαριστώ.');
    await btn(s.page, BACK).click(); await s.page.waitForTimeout(400);
    await send(s.page, 'Ευχαριστώ, κλείνουμε εδώ.');
    ok('X3c (switch open): a SECOND exit → the old closing opens → GRACEFUL EXIT is sent, as today, and the card opens', s.calls.length === 4 && graceful(s.calls[3]) && await card(s.page));
    await s.browser.close();
  }

  // ── X4: no farewell when the closing card opens on an emoji-only reply; the farewell stays when it does not ──────
  {
    // closed switch; «Ευχαριστώ» → the card opens → «Έχω κι άλλο να πω» (decline → a 3-turn cooldown) → «Ευχαριστώ» again: no card, a bare 🙂 → the old farewell
    const s = await start('', ['Τι εννοείς με το «άξιζα»;', 'Τι σημαίνει αυτό για σένα;', 'Εντάξει. Μπορούμε να συνεχίσουμε.', '🙂']);
    await send(s.page, 'Περισσότερα χρήματα.');
    await send(s.page, 'Ευχαριστώ.');
    ok('X4: (setup) the old closing card opened on the first «Ευχαριστώ.»', await card(s.page));
    await btn(s.page, 'Έχω κι άλλο να πω').click(); await s.page.waitForTimeout(400);
    await send(s.page, 'Ευχαριστώ.');
    const b = await s.page.locator('.turn-aura').allInnerTexts();
    ok('X4: during the decline cooldown no card opens → the empty-reply rule still adds the farewell: «🙂 Καλή συνέχεια.»', !(await card(s.page)) && b.map(t => t.replace(/^\s*aura\s*\n/i, '').trim()).slice(-1)[0] === '🙂 Καλή συνέχεια.');
    await s.browser.close();
  }
  {
    // a bare 🙂 after a user who was NOT closing → «Τι σκέφτεσαι τώρα;», as before (switch open and closed)
    for (const q of ['', '?stageA=1']) {
      const s = await start(q, ['Τι εννοείς με το «άξιζα»;', '🙂']);
      await send(s.page, 'Περισσότερα χρήματα.');
      const b = (await s.page.locator('.turn-aura').allInnerTexts()).map(t => t.replace(/^\s*aura\s*\n/i, '').trim());
      ok(`X4 (switch ${q ? 'open' : 'closed'}): a bare 🙂 after an ordinary message → «🙂 Τι σκέφτεσαι τώρα;», as before`, b.slice(-1)[0] === '🙂 Τι σκέφτεσαι τώρα;');
      await s.browser.close();
    }
  }

  // ── X5: the bubble, on every path where the message goes nowhere ──────────────
  const PATHS = [
    { id: 'first closing («Ευχαριστώ.»)', text: 'Ευχαριστώ.', expect: async p => (await p.getByText(LEAVING).count()) === 1,
      run: async s => { await send(s.page, 'Η σταθερότητα κυρίως.'); await send(s.page, 'Ευχαριστώ.'); } },
    { id: 'door 1 without substance', text: 'Περίπου δηλαδή', expect: async p => (await p.getByText(T.retry).count()) === 1,
      run: async s => { await send(s.page, 'Η σταθερότητα κυρίως.'); await btn(s.page, 'Νομίζω βρήκα τι με απασχολεί').click(); await s.page.waitForTimeout(400); await send(s.page, 'Περίπου δηλαδή'); } },
    { id: 'door 2 «Ναι»', text: 'Ναι', expect: async p => askShown(p), replies: ['Ακούω ότι σε βαραίνει η δουλειά. Τι σε κρατάει εκεί;', RQ, 'Και τι;'],
      run: async s => { await send(s.page, 'Η σταθερότητα, αλλά νιώθω ότι κάτι άλλο παίζει.'); await send(s.page, 'Ναι'); } },
    { id: 'door 2 without substance (after «Ναι»)', text: 'Δεν ξέρω', expect: async p => (await p.getByText(T.retry).count()) === 1, replies: ['Ακούω ότι σε βαραίνει η δουλειά. Τι σε κρατάει εκεί;', RQ, 'Και τι;'],
      run: async s => { await send(s.page, 'Η σταθερότητα, αλλά νιώθω ότι κάτι άλλο παίζει.'); await send(s.page, 'Ναι'); await send(s.page, 'Δεν ξέρω'); } },
    { id: 'door 3 without substance', text: 'Ναι, αυτό ακριβώς είναι!', expect: async p => askShown(p), replies: ['Ακούω ότι σε βαραίνει η δουλειά. Τι σε κρατάει εκεί;', 'Και τι;'],
      run: async s => { await send(s.page, 'Ναι, αυτό ακριβώς είναι!'); } },
    { id: 'correction without substance', text: 'Περίπου δηλαδή', expect: async p => (await p.getByText(T.retry).count()) === 1 && (await p.getByText('Φοβάμαι ότι δεν αξίζω περισσότερα').count()) >= 1,
      run: async s => { await send(s.page, 'Η σταθερότητα κυρίως.'); await btn(s.page, 'Νομίζω βρήκα τι με απασχολεί').click(); await s.page.waitForTimeout(400);
        await send(s.page, 'Φοβάμαι ότι δεν αξίζω περισσότερα'); await btn(s.page, 'Διόρθωσε').click(); await s.page.waitForTimeout(400); await send(s.page, 'Περίπου δηλαδή'); } },
  ];
  let k = 0;
  for (const P of PATHS) {
    k++;
    const s = await start('?stageA=1', P.replies || ['Τι εννοείς με το «άξιζα»;', 'Και τι σε τραβάει αλλού;', 'Και τι θα σήμαινε αυτό;']);
    const before = s.calls.length;
    await P.run(s);
    const nBubbles = (await userBubbles(s.page)).filter(t => t === P.text).length;
    const calls0 = s.calls.length;
    if (P.id === 'door 1 without substance' || P.id === 'correction without substance') {
      await s.page.waitForTimeout(900); // the smooth scroll
      const vis = await s.page.evaluate(() => { const t = [...document.querySelectorAll('.warning-text')].find(e => /Γράψ' το λίγο/.test(e.innerText)); const inp = document.querySelector('.input-area');
        const lastU = [...document.querySelectorAll('.turn-user')].pop();
        const r = el => el ? el.getBoundingClientRect() : null; const a = r(t), b = r(inp), u = r(lastU);
        return a && b && u ? { retryAboveInput: a.bottom <= b.top + 1, bubbleOnScreen: u.top >= 0 && u.bottom <= innerHeight } : null; });
      ok(`X5 «${P.id}»: on a phone screen the retry line is fully above the input box and the new bubble is on screen (the screen scrolled to it)`, !!vis && vis.retryAboveInput && vis.bubbleOnScreen);
    }
    ok(`X5 «${P.id}»: the user's message is on screen as a bubble`, nBubbles >= 1 && (await userBubbles(s.page)).includes(P.text));
    ok(`X5 «${P.id}»: and the step it triggers is as before (the question / retry line / card), no new model call after the setup`, await P.expect(s.page));
    // go on with the session: close the flow if open and send one ordinary message → the model is called, and no request ever carries the bubble text
    if (await btn(s.page, BACK).count()) { const b0 = s.calls.length; await btn(s.page, BACK).first().click(); await s.page.waitForTimeout(1200); }
    if (await s.page.locator('textarea.textarea').count()) { await send(s.page, 'Πιο πολύ φοβάμαι ότι θα μετανιώσω.'); await s.page.waitForTimeout(800); }
    const sent = sentUser(s.calls);
    ok(`X5 «${P.id}»: the bubble text is in NO request to the model (the history keeps only what was really said to it)`, !sent.includes(P.text));
    ok(`X5 «${P.id}»: still on screen after the conversation went on (in order, before the next message)`, (await userBubbles(s.page)).includes(P.text) &&
      (await userBubbles(s.page)).indexOf(P.text) < (await userBubbles(s.page)).lastIndexOf('Πιο πολύ φοβάμαι ότι θα μετανιώσω.'));
    if (k === 1) await s.page.screenshot({ path: path.join(OUT, 'X5-first-closing.png'), fullPage: false });
    await s.browser.close();
  }

  // ── X7: «Νέα συνεδρία» clears the UI-only bubbles — an old «Ευχαριστώ.» must not reappear in the next session ───
  {
    const s = await start('?stageA=1', ['Τι εννοείς με το «άξιζα»;', 'Και τι σε τραβάει αλλού;', 'Και τι θα σήμαινε αυτό;', 'Και τι άλλο;', 'Και μετά;']);
    await send(s.page, 'Η σταθερότητα κυρίως.');
    await send(s.page, 'Ευχαριστώ.');
    await btn(s.page, BACK).click(); await s.page.waitForTimeout(400);
    await btn(s.page, 'Νομίζω βρήκα τι με απασχολεί').click(); await s.page.waitForTimeout(400);
    await send(s.page, 'Ότι φοβάμαι να απογοητεύσω τον πατέρα μου.');
    await btn(s.page, T.yes).click(); await s.page.waitForTimeout(400);
    await btn(s.page, T.notNow).click(); await s.page.waitForTimeout(400);
    await btn(s.page, '6').click(); await s.page.waitForTimeout(400);
    await send(s.page, 'πατέρας'); await s.page.waitForTimeout(1200);
    ok('X7 (setup): the first session ended, with the «Ευχαριστώ.» bubble on screen', (await userBubbles(s.page)).includes('Ευχαριστώ.') && await btn(s.page, 'Νέα συνεδρία').count() === 1);
    await btn(s.page, 'Νέα συνεδρία').click(); await s.page.waitForTimeout(600);
    if (await s.page.getByText('Ξεκίνα με το πρόβλημά σου').count()) await s.page.getByText('Ξεκίνα με το πρόβλημά σου').click();
    await send(s.page, F1); if (await s.page.getByText('Γιατί έχει σημασία αυτό για σένα τώρα;').count()) await send(s.page, WHY);
    await send(s.page, 'Περισσότερα χρήματα.'); await send(s.page, 'Και λίγη ασφάλεια.'); await send(s.page, 'Και λίγη ελευθερία.');
    ok('X7: in the next session no old UI-only bubble appears (only what was typed there)', !(await userBubbles(s.page)).includes('Ευχαριστώ.') && (await userBubbles(s.page)).length >= 4);
    await s.browser.close();
  }

  // ── X6: the one-tap question, recorded ─────────────────────────────────────
  const toQuestion = async () => {
    const s = await start('?stageA=1&debug=1', ['Τι εννοείς με το «άξιζα»;', 'Και τι σε τραβάει αλλού;']);
    await send(s.page, 'Η σταθερότητα κυρίως.');
    await btn(s.page, 'Νομίζω βρήκα τι με απασχολεί').click(); await s.page.waitForTimeout(400);
    await send(s.page, 'Ότι φοβάμαι να απογοητεύσω τον πατέρα μου.');
    await btn(s.page, T.yes).click(); await s.page.waitForTimeout(400);
    await btn(s.page, T.wantMore).click(); await s.page.waitForTimeout(400);
    return s;
  };
  const exported = async page => {
    try {
      const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 8000 }), page.getByRole('button', { name: 'τηλεμετρία (.json)' }).click({ timeout: 4000 })]);
      return JSON.parse(fs.readFileSync(await dl.path(), 'utf8'));
    } catch (e) { return { events: [], error: String(e.message || e).slice(0, 80) }; }
  };
  for (const [label, name, choice] of [['option 1', T.help1, 1], ['option 2', T.help2, 2], ['option 3', T.help3, 3], ['no choice («Συνέχεια»)', T.helpSkip, 0], ['left without tapping', null, null]]) {
    const s = await toQuestion();
    ok(`X6 (${label}): the question is on screen`, await s.page.getByText(T.helpQ).count() === 1);
    if (name) { await btn(s.page, name).click(); await s.page.waitForTimeout(500); }
    // NOTHING ELSE: the session is NOT finished (no clarity, no word) — the user may close the app right here
    const data = await exported(s.page);
    const ev = data.events || [];
    const asked = ev.filter(r => r.ev === 'coach_help_asked'), chosen = ev.filter(r => r.ev === 'coach_help_choice');
    ok(`X6 (${label}): the export file shows the question was asked (once)`, asked.length === 1 && asked[0].asked === 1);
    ok(`X6 (${label}): ` + (name ? `and the choice: choice = ${choice}` : 'and NO choice record — asked without an answer = left'),
      name ? chosen.length === 1 && chosen[0].choice === choice : chosen.length === 0);
    ok(`X6 (${label}): counts only — no text in any record, session not finished (no session_completed yet)`,
      ev.every(r => Object.values(r).every(v => typeof v === 'number' || typeof v === 'boolean' || r.ev === v)) && !ev.some(r => r.ev === 'session_completed'));
    const stored = await s.page.evaluate(() => JSON.parse(localStorage.getItem('aura_telemetry_log') || '[]'));
    ok(`X6 (${label}): the device log (localStorage) has the same records the export shows`, JSON.stringify(stored.filter(r => String(r.ev).startsWith('coach_help'))) === JSON.stringify(ev.filter(r => String(r.ev).startsWith('coach_help'))));
    if (label === 'option 2') await s.page.screenshot({ path: path.join(OUT, 'X6-after-choice.png'), fullPage: false });
    await s.browser.close();
  }
  {
    // the end of the session still carries coachHelpChoice (unchanged)
    const s = await toQuestion();
    await btn(s.page, T.help2).click(); await s.page.waitForTimeout(400);
    await btn(s.page, '7').click(); await s.page.waitForTimeout(400);
    await send(s.page, 'πατέρας'); await s.page.waitForTimeout(1200);
    const tel = await s.page.evaluate(() => (window.__auraTelemetry || []).filter(r => r.ev === 'session_completed').pop() || null);
    ok('X6: session_completed still carries coachHelpChoice 2 and coachOfferClicked 1 (unchanged)', !!tel && tel.coachHelpChoice === 2 && tel.coachOfferClicked === 1);
    await s.browser.close();
  }
  {
    // switch closed: no such record can exist
    const s = await start('?debug=1', ['Τι εννοείς με το «άξιζα»;', 'Και τι σε τραβάει αλλού;']);
    await send(s.page, 'Η σταθερότητα κυρίως.');
    const data = await exported(s.page);
    ok('X6 (switch closed): no coach_help record, no Stage A button', !(data.events || []).some(r => String(r.ev).startsWith('coach_help')) && await btn(s.page, 'Νομίζω βρήκα τι με απασχολεί').count() === 0);
    await s.browser.close();
  }
}

// ═══ ΤΑ 6 ΣΕΝΑΡΙΑ (ψεύτικο ή πραγματικό μοντέλο) ═════════════════════════════
function fakeModel() {
  let mainCalls = 0;
  return async (body, cls, scen) => {
    let text = 'Τι είναι αυτό που σε κρατάει εκεί;';
    if (cls.kind === 'termination') text = cls.closing && cls.closing.part === 'Part 2' ? 'Η σκέψη σου παραμένει δική σου.' : 'Πριν φύγεις — μία λέξη, ή μια σύντομη φράση που θέλεις να κρατήσεις.';
    else if (cls.kind === 'supportive') text = 'Είμαι εδώ. Θέλεις να μου πεις λίγο περισσότερο;';
    else {
      mainCalls += 1;
      if (scen.risk === 'door2back' && mainCalls === 2) text = 'Νιώθεις ότι έχει αρχίσει να ξεκαθαρίζει τι είναι αυτό που πραγματικά σε απασχολεί;';
      else if (scen.risk === 'door2back' && mainCalls === 3) text = 'Πες το μου με δικά σου λόγια: τι είναι αυτό που σε κρατάει;';
    }
    return { status: 200, data: { content: [{ type: 'text', text }], usage: { input_tokens: 10, output_tokens: 10 } } };
  };
}
async function realModel() {
  const src = fs.readFileSync(path.join(REPO, 'api', 'aura.js'), 'utf8');
  const handler = (await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'))).default;
  // api/aura.js allows 20 requests/minute per IP, and here every call shares the IP «unknown». At least 3.4 s
  // between calls keeps the test under that limit, so a 429 can never be mistaken for app behaviour.
  let lastCall = 0;
  return async (body) => {
    const wait = lastCall + 3400 - Date.now();
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    lastCall = Date.now();
    return callHandler(body);
  };
  function callHandler(body) { return new Promise(resolve => {
    const raw = JSON.stringify(body);
    let status = 200;
    const res = {
      status(c) { status = c; return res; },
      json(d) { resolve({ status, data: d }); },
      writeHead(c) { status = c; }, write() {}, end() { resolve({ status, data: null }); },
    };
    Promise.resolve(handler({ method: 'POST', headers: { 'content-length': String(Buffer.byteLength(raw)) }, body }, res))
      .catch(() => resolve({ status: 502, data: { error: 'handler error' } }));
  }); }
}

async function runScenario(scen, model, budget) {
  const T = APP.texts;
  const browser = await launch();
  const page = await browser.newPage({ viewport: { width: 400, height: 860 } });
  const sess = { name: scen.name, risk: scen.risk, rootShown: false, rootConfirmed: false, ending: null, cost: 0, turns: [], notes: [], requests: [] };
  let stepReqs = [];
  let aborted = false;
  await page.route('**/api/aura', async route => {
    let body = {};
    try { body = JSON.parse(route.request().postData() || '{}'); } catch (e) { body = {}; }
    const cls = LIB.classifyRequest(body, APP);
    stepReqs.push(cls); sess.requests.push(cls);
    if (!budget.canSpend()) { aborted = true; return route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"budget"}' }); }
    const r = await model(body, cls, scen);
    if (r.data && r.data.usage) { budget.add(r.data.usage); sess.cost += LIB.costOf(r.data.usage); }
    return route.fulfill({ status: r.status, contentType: 'application/json', body: JSON.stringify(r.data || {}) });
  });
  await page.addInitScript(() => { try { localStorage.setItem('aura_intro_seen', '1'); } catch (e) {} });
  await page.goto(BASE + '/?stageA=1');
  await page.getByText('Ξεκίνα με το πρόβλημά σου').click();

  const btn = name => page.getByRole('button', { name, exact: true });
  const count = async loc => { try { return await loc.count(); } catch (e) { return 0; } };
  const auraTexts = async () => (await page.locator('.turn-aura').allInnerTexts()).map(t => t.replace(/^\s*aura\s*\n/i, '').trim());
  const screen = async () => ({
    closureCard: await count(btn('Δείξε μου')) > 0, warningCard: await count(btn('Σταμάτα εδώ')) > 0,
    memCard: await count(page.getByText('Θέλεις να το κρατήσω')) > 0, rootCard: await count(btn(T.yes)) > 0,
    button: await count(btn(T.button)) > 0, ended: await count(page.getByText('η συνομιλία σταμάτησε εδώ')) > 0,
    input: await count(page.locator('textarea.textarea')) > 0, promise: await count(btn('Δες την πορεία')) > 0,
    leaving: await count(page.getByText(T.askLeaving)) > 0,
  });
  const waitIdle = async (prev) => {
    const t0 = Date.now();
    await page.waitForTimeout(400);
    while (Date.now() - t0 < 60000) {
      const typing = await count(page.locator('.typing'));
      const s = await screen();
      if (!typing && ((await auraTexts()).length > prev || s.closureCard || s.warningCard || s.ended || s.rootCard)) break;
      if (!typing && Date.now() - t0 > 3000) break;
      await page.waitForTimeout(300);
    }
  };
  let threeBeatSeen = false, stop = false, lastUser = '';
  const lastMainCtx = () => { const m = [...sess.requests].reverse().find(q => q.kind !== 'termination'); return m ? m.ctx : []; };
  const record = async (user, action) => {
    const prev = (await auraTexts()).length;
    stepReqs = [];
    await action();
    await waitIdle(prev);
    const now = await auraTexts();
    const fresh = now.slice(prev);
    // Only text the MODEL wrote is checked: a step with no request shows the app's own fixed texts.
    const flags = stepReqs.length ? [...new Set(fresh.flatMap(t => LIB.flagReply(t, user, APP)))] : [];
    if (flags.some(f => f.startsWith('ΗΡΘΕΣ'))) threeBeatSeen = true;
    const s = await screen();
    if (s.rootCard) sess.rootShown = true;
    const turn = { user, aura: fresh.join('\n—\n'), flags, requests: stepReqs.slice(), cardVisible: s.rootCard, yes: false, ending: '' };
    sess.turns.push(turn);
    return { turn, s };
  };
  const type = async (text) => { await page.locator('textarea.textarea').fill(text); await btn('Go').click(); };
  // The old closing, whenever it shows up: record which trigger the screen points to, then let it finish.
  const interrupts = async () => {
    for (let k = 0; k < 4 && !stop; k++) {
      const s = await screen();
      if (s.memCard) { await page.getByText('Θέλεις να το κρατήσω').locator('xpath=ancestor::div[contains(@class,"card") or contains(@class,"warning")][1]').getByRole('button', { name: 'Όχι', exact: true }).click().catch(async () => { await btn('Όχι').first().click(); }); sess.notes.push('εμφανίστηκε η ερώτηση μνήμης — απαντήθηκε «Όχι»'); continue; }
      if (s.ended) { stop = true; break; }
      if (s.warningCard || s.closureCard) {
        const ending = LIB.inferEnding({ warningCard: s.warningCard, closureCard: s.closureCard, lastUser, threeBeatSeen, lastCtx: lastMainCtx() }, APP);
        sess.ending = ending;
        await page.screenshot({ path: path.join(OUT, scen.risk + '-old-closing.png'), fullPage: true });
        const label = s.warningCard ? 'Σταμάτα εδώ' : 'Δείξε μου';
        const r = await record('[πάτησε «' + label + '»]', () => btn(label).click());
        r.turn.ending = ending.label;
        const s2 = await screen();
        if (!s2.ended && s2.input) await record(scen.word, () => type(scen.word));
        stop = true; break;
      }
      break;
    }
  };

  const steps = scen.steps;
  let skipDoor2 = false;
  for (let i = 0; i < steps.length && !stop && !aborted; i++) {
    const st = steps[i];
    if (st.door2 && skipDoor2) continue;
    const s = await screen();
    if (st.say !== undefined || st.root !== undefined || st.word !== undefined) {
      const text = st.say !== undefined ? st.say : st.root !== undefined ? st.root : st.word;
      if (!s.input) { sess.notes.push('δεν υπήρχε πεδίο γραφής για «' + text + '» — η συνεδρία σταματά εδώ'); break; }
      lastUser = text;
      const r = await record(text, () => type(text));
      if (st.door2 && !r.s.rootCard) sess.notes.push('η πόρτα 2 ΔΕΝ άνοιξε την κάρτα μετά το «Ναι» στην ερώτηση ετοιμότητας');
      if (i === 0 && r.turn.requests.length === 0 && await count(page.getByText('Γιατί έχει σημασία αυτό για σένα τώρα;'))) {
        lastUser = scen.why; await record(scen.why, () => type(scen.why));
      }
      if (st.word !== undefined) { const e = await screen(); if (e.ended) stop = true; }
    } else if (st.untilReadiness) {
      let asked = false;
      for (const filler of [null, ...st.fillers]) {
        const last = (await auraTexts()).slice(-1)[0] || '';
        if (APP.fns.detectsCoreReadinessAsked(last)) { asked = true; break; }
        if (filler === null) continue;
        if (!(await screen()).input) break;
        lastUser = filler; await record(filler, () => type(filler)); await interrupts(); if (stop) break;
      }
      if (asked && !stop) { lastUser = 'Ναι'; await record('Ναι', () => type('Ναι')); }
      else if (!stop) { skipDoor2 = true; sess.notes.push('η AURA δεν έκανε την ερώτηση ετοιμότητας σε ' + st.fillers.length + ' γύρους — η πόρτα 2 δεν δοκιμάστηκε'); }
    } else if (st.leaving) {
      // ADR «6 Οκτωβρίου (λ)» / «8 Οκτωβρίου (β)»: after an explicit closing before the root the app asks the root question itself.
      if (s.leaving) { sess.notes.push('μετά το «' + lastUser + '» εμφανίστηκε η ερώτηση της ρίζας του κλεισίματος (πόρτα 1 αντί για το παλιό κλείσιμο)'); }
      else if (s.button) { sess.notes.push('ΔΕΝ εμφανίστηκε η ερώτηση της ρίζας του κλεισίματος — πατήθηκε το κουμπί για να συνεχίσει η δοκιμή'); await record('[πάτησε «' + T.button + '»]', () => btn(T.button).click()); }
      else { sess.notes.push('ΔΕΝ εμφανίστηκε η ερώτηση της ρίζας του κλεισίματος ούτε το κουμπί — η συνεδρία σταματά εδώ'); break; }
    } else if (st.press) {
      if (!s.button) { sess.notes.push('το κουμπί «' + T.button + '» δεν φαινόταν όταν το χρειάστηκε'); break; }
      await record('[πάτησε «' + T.button + '»]', () => btn(T.button).click());
    } else if (st.card) {
      const name = st.card === 'yes' ? T.yes : T.back;
      if (!(await count(btn(name)))) { sess.notes.push('το κουμπί «' + name + '» δεν φαινόταν'); if (st.card === 'yes') break; continue; }
      const r = await record('[πάτησε «' + name + '»]', () => btn(name).click());
      if (st.card === 'yes') { sess.rootConfirmed = true; r.turn.yes = true; await page.screenshot({ path: path.join(OUT, scen.risk + '-root-yes.png'), fullPage: true }); }
    } else if (st.offer) {
      const name = st.offer === 'want' ? T.wantMore : T.notNow;
      if (!(await count(btn(name)))) { sess.notes.push('δεν εμφανίστηκε πρόταση Coach (π.χ. σήμα κινδύνου)'); continue; }
      await record('[πάτησε «' + name + '»]', () => btn(name).click());
    } else if (st.help !== undefined) {
      const name = st.help ? T['help' + st.help] : T.helpSkip;
      if (await count(btn(name))) await record('[πάτησε «' + name + '»]', () => btn(name).click());
    } else if (st.clarity) {
      if (await count(btn(String(st.clarity)))) await record('[σαφήνεια ' + st.clarity + ']', () => btn(String(st.clarity)).click());
      else sess.notes.push('δεν εμφανίστηκε η κλίμακα σαφήνειας');
    }
    await interrupts();
  }
  if (aborted) sess.notes.push('ΣΤΑΜΑΤΗΣΕ: έφτασε το όριο δαπάνης');
  if (!sess.ending) sess.ending = LIB.inferEnding({ rootConfirmed: sess.rootConfirmed, rootShown: sess.rootShown }, APP);
  if (sess.turns.length) sess.turns[sess.turns.length - 1].ending = sess.turns[sess.turns.length - 1].ending || sess.ending.label;
  await page.screenshot({ path: path.join(OUT, scen.risk + '-end.png'), fullPage: true }).catch(() => {});
  await browser.close();
  return { sess, aborted };
}

async function runScenarios(makeModel, budget) {
  const sessions = [];
  for (const scen of LIB.SCENARIOS) {
    console.log('… ' + scen.name);
    const { sess, aborted } = await runScenario(scen, await makeModel(), budget);
    sessions.push(sess);
    console.log('   ρίζα επιβεβαιώθηκε: ' + (sess.rootConfirmed ? 'ΝΑΙ' : 'ΟΧΙ') + ' | ' + sess.ending.label + ' | κόστος $' + sess.cost.toFixed(2));
    if (aborted) break;
  }
  return sessions;
}

(async () => {
  if (MODE === 'real' && has('--dry')) {
    console.log('ΠΡΑΓΜΑΤΙΚΗ ΔΟΚΙΜΗ — ΣΧΕΔΙΟ (καμία κλήση, κανένα build)');
    console.log('Όριο δαπάνης: $' + Number(opt('--budget', '6')).toFixed(2) + ' | αρχεία στο: ' + OUT);
    console.log('Κλειδί στη μεταβλητή ANTHROPIC_API_KEY: ' + (KEY ? 'βρέθηκε' : 'ΔΕΝ βρέθηκε'));
    console.log('Context που αναγνωρίζονται από το App.jsx: ' + Object.keys(APP.catalog).filter(n => APP.catalog[n].length).join(', '));
    console.log('Χωρίς υπογραφή (δεν φαίνονται): ' + (APP.unsignedCtx.join(', ') || '—'));
    LIB.SCENARIOS.forEach(s => console.log('\n' + s.name + '\n  ' + s.steps.map(t => JSON.stringify(t)).join('\n  ')));
    return;
  }
  if (MODE === 'real' && !has('--yes')) { console.log('Δεν έτρεξε τίποτα. Πρώτα: --real --dry. Για να τρέξει (και να ξοδέψει): --real --yes'); return; }
  if (MODE === 'real' && !KEY) { console.error('Δεν βρέθηκε ANTHROPIC_API_KEY. PowerShell: $env:ANTHROPIC_API_KEY = "<το κλειδί σου>"'); process.exit(2); }
  fs.mkdirSync(OUT, { recursive: true });
  const app = await startApp();
  BASE = app.url;
  try {
    if (MODE === 'mock') {
      if (opt('--only', '') === 'W') await runMockW(); else if (opt('--only', '') === 'X') await runMockX(); else await runMock();
      writeOut('mock-results.txt', results.join('\n') + '\n');
      console.log(results.join('\n'));
      console.log(results.filter(r => r.startsWith('PASS')).length + ' passed, ' + results.filter(r => r.startsWith('FAIL')).length + ' failed');
    } else {
      const budget = LIB.makeBudget(MODE === 'real' ? Number(opt('--budget', '6')) : 1e9);
      // A fresh model per scenario: the fake one counts calls, and that count must start at 0 in every session.
      const sessions = await runScenarios(MODE === 'real' ? realModel : fakeModel, budget);
      const meta = { mode: MODE === 'real' ? 'πραγματικό μοντέλο' : 'ψεύτικο μοντέλο (έλεγχος μηχανισμού)', budget: MODE === 'real' ? Number(opt('--budget', '6')) : 0, spent: MODE === 'real' ? budget.spent() : 0 };
      writeOut('report.md', LIB.buildReport(sessions, meta));
      writeOut('report.json', JSON.stringify(sessions, null, 2));
      console.log('\nΚόστος: $' + (MODE === 'real' ? budget.spent() : 0).toFixed(2) + '\nΑναφορά: ' + path.join(OUT, 'report.md'));
    }
  } finally {
    await app.close();
  }
})().catch(e => { console.error('E2E ERROR', LIB.redact(e && e.stack || String(e), KEY)); process.exit(2); });
