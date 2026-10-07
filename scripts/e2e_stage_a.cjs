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
//   node scripts/e2e_stage_a.cjs                      ψεύτικο μοντέλο: σενάρια ροής (A–I) και ασφάλειας (S), χωρίς κόστος
//   node scripts/e2e_stage_a.cjs --engine-check       ψεύτικο μοντέλο: τα 6 σενάρια της πραγματικής δοκιμής, χωρίς κόστος
//   node scripts/e2e_stage_a.cjs --real --dry         δείχνει τι θα γίνει και το όριο δαπάνης — καμία κλήση, κανένα build
//   node scripts/e2e_stage_a.cjs --real --yes         ΠΡΑΓΜΑΤΙΚΟ μοντέλο (ξοδεύει· σταματά στο --budget, προεπιλογή $6)
// Προαιρετικά: --budget 6   --url http://localhost:5199 (αντί για build)   --out <φάκελος μέσα στο %TEMP%>
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

// ═══ ΨΕΥΤΙΚΟ ΜΟΝΤΕΛΟ — σενάρια ελέγχου της ροής (A–I) και της ασφάλειας (S) ═══════
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
      'Πες μου με δικά σου λόγια τι είναι αυτό που σε κρατάει.',
      'Και τι θα σήμαινε αυτό για σένα;',
    ]);
    await send(page, 'Γεια. Δεν ξέρω αν πρέπει να φύγω από τη δουλειά μου στην τράπεζα.');
    if (await page.getByText('Γιατί έχει σημασία αυτό για σένα τώρα;').count()) await send(page, 'Γιατί κάθε μέρα νιώθω πιο άδειος εκεί μέσα.');
    await send(page, 'Η σταθερότητα, αλλά νιώθω ότι κάτι άλλο παίζει.');
    await send(page, 'Ναι');
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
  const LEAVING = 'Πριν φύγεις: πες το με μία φράση — τι είναι αυτό που σε απασχολεί;';
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
          await page.getByText(line).count() >= 1 && !(await has(page, 'Δείξε μου')) && !(await has(page, 'Σταμάτα εδώ')) && await page.getByText('Πριν φύγεις:').count() === 0);
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
        // The closing's Part 1 is the 6th request with the switch closed, the 7th with it open (one more turn).
        const { browser, page } = await session(sw === 'open' ? '?stageA=1' : '', sw === 'open' ? EW : [...EW.slice(0, 5), WQ, EW[7]]);
        await say(page, [OPEN[0], OPEN[1], OPEN[2], msg, OPEN[3], 'Ευχαριστώ.']);
        if (sw === 'open') { await click(page, 'Δεν το βρήκα ακόμα, συνέχισε'); await send(page, 'Ευχαριστώ, κλείνουμε εδώ.'); }
        await click(page, 'Δείξε μου');
        ok(`S4 (${lvl}, switch ${sw}): the answer «${msg.slice(0, 22)}…» was not kept as the early word — the closing asks for the word, the session is still open`,
          !(await ended(page)) && await page.getByText('Πριν φύγεις — μία λέξη').count() >= 1 && await page.locator('textarea.textarea').count() === 1);
        await browser.close();
      }
    }
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
      // ADR «6 Οκτωβρίου (λ)»: after an explicit closing before the root the app asks «Πριν φύγεις:» itself.
      if (s.leaving) { sess.notes.push('μετά το «' + lastUser + '» εμφανίστηκε το «Πριν φύγεις:» (πόρτα 1 αντί για το παλιό κλείσιμο)'); }
      else if (s.button) { sess.notes.push('ΔΕΝ εμφανίστηκε το «Πριν φύγεις:» — πατήθηκε το κουμπί για να συνεχίσει η δοκιμή'); await record('[πάτησε «' + T.button + '»]', () => btn(T.button).click()); }
      else { sess.notes.push('ΔΕΝ εμφανίστηκε το «Πριν φύγεις:» ούτε το κουμπί — η συνεδρία σταματά εδώ'); break; }
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
      await runMock();
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
