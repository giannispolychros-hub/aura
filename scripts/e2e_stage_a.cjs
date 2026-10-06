// Δοκιμή του Σταδίου Α σε ΠΡΑΓΜΑΤΙΚΟ browser, με ΨΕΥΤΙΚΕΣ απαντήσεις του μοντέλου (καμία κλήση στο API, κανένα κόστος).
// Δεν είναι μέρος των auratests (θέλει Playwright και τον vite dev server). Χρήση από τον φάκελο του repo:
//   1. npx vite --port 5199          (σε ένα παράθυρο)
//   2. node scripts/e2e_stage_a.cjs http://localhost:5199 <φάκελος για τα στιγμιότυπα>
// Σενάρια: A ολόκληρη η ροή (κουμπί → κάρτα → «Ναι» → πρόταση → ερώτηση → σαφήνεια → λέξη → τέλος, χωρίς 6€),
// B κλειστός διακόπτης (τίποτα από το Στάδιο Α, καμία σήμανση), C πόρτα 2 (ερώτηση ετοιμότητας) και «πίσω»,
// D DISTRESS (κάρτα ναι, πρόταση όχι), E πρόταση κρίσης ως απάντηση (η ροή κλείνει, γραμμή 1018).
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright'); } })();
const BASE = process.argv[2] || 'http://localhost:5199';
const OUT = process.argv[3] || '/tmp';
const results = [];
const ok = (label, cond) => { results.push((cond ? 'PASS' : 'FAIL') + ' — ' + label); };

async function session(query, script) {
  const browser = await chromium.launch().catch(() => chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }));
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

(async () => {
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
    await page.screenshot({ path: OUT + '/stageA-1-button.png', fullPage: false });
    await page.getByRole('button', { name: 'Νομίζω βρήκα τι με απασχολεί' }).click();
    ok('A: the fixed question shows', await page.getByText('Πες το με μία φράση: τι είναι αυτό που πραγματικά σε απασχολεί;').count() >= 1);
    const callsBefore = calls.length;
    await send(page, 'Ότι φοβάμαι να απογοητεύσω τον πατέρα μου, όχι τη δουλειά.');
    ok('A: the answer is NOT sent to the model', calls.length === callsBefore);
    ok('A: the card shows «Τι βρήκες» verbatim', await page.getByText('«Ότι φοβάμαι να απογοητεύσω τον πατέρα μου, όχι τη δουλειά.»').count() === 1);
    ok('A: the card shows «Τι ήξερες» from the first message, greeting stripped', await page.getByText('«Δεν ξέρω αν πρέπει να φύγω από τη δουλειά μου στην τράπεζα»').count() === 1);
    ok('A: the line above «Ναι»', await page.getByText('Με το "Ναι" ολοκληρώνεται το δωρεάν κομμάτι και σου δείχνω το επόμενο.').count() === 1);
    ok('A: the input box is hidden while the card is open', await page.locator('textarea.textarea').count() === 0);
    await page.screenshot({ path: OUT + '/stageA-2-card.png', fullPage: false });
    await page.getByRole('button', { name: 'Ναι, αυτό είναι' }).click();
    await page.waitForTimeout(300);
    ok('A: «Η ρίζα σου» line with the whole root', await page.getByText('Η ρίζα σου: "Ότι φοβάμαι να απογοητεύσω τον πατέρα μου, όχι τη δουλειά.".').count() === 1);
    ok('A: price line', await page.getByText('AURA Coach · €6, μία φορά.').count() === 1);
    ok('A: offer buttons', await page.getByRole('button', { name: 'Θέλω να συνεχίσω' }).count() === 1 && await page.getByRole('button', { name: 'Όχι τώρα' }).count() === 1);
    ok('A: copy / download available after «Ναι»', await page.getByRole('button', { name: 'Αντίγραψε τη ρίζα' }).count() === 1 && await page.getByRole('button', { name: 'Κατέβασε τη ρίζα' }).count() === 1);
    await page.screenshot({ path: OUT + '/stageA-3-offer.png', fullPage: true });
    await page.getByRole('button', { name: 'Θέλω να συνεχίσω' }).click();
    ok('A: not-ready text + the one-tap question', await page.getByText('Το AURA Coach δεν είναι ακόμα έτοιμο.').count() === 1 && await page.getByText('Τι θα σε βοηθούσε περισσότερο;').count() === 1);
    await page.screenshot({ path: OUT + '/stageA-4-notready.png', fullPage: false });
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
    await page.screenshot({ path: OUT + '/stageA-5-end.png', fullPage: true });
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
    await send(page, 'Ότι δεν έχω επιτρέψει στον εαυτό μου να πενθήσει.');
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
  console.log(results.join('\n'));
  console.log(results.filter(r => r.startsWith('PASS')).length + ' passed, ' + results.filter(r => r.startsWith('FAIL')).length + ' failed');
})().catch(e => { console.error('E2E ERROR', e); process.exit(2); });
