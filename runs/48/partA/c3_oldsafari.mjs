// C3 — SIMULATION of Safari before 16.4 (iOS 15, 16.0–16.3): a RegExp that refuses lookbehind, as that engine does. Chromium, fake model.
import { startServer, launch, openPage, send, bodyText, errLine, out } from './lib.mjs';
const OLD = () => {
  const R = RegExp;
  const bad = a => { const s = a instanceof R ? a.source : String(a); if (/\(\?<[=!]/.test(s)) throw new SyntaxError('Invalid regular expression: invalid group specifier name'); };
  window.RegExp = new Proxy(R, { construct(t, args) { bad(args[0]); return Reflect.construct(t, args); }, apply(t, th, args) { bad(args[0]); return Reflect.apply(t, th, args); } });
};
const srv = await startServer();
const browser = await launch();
for (const [label, init] of [['σύγχρονος browser (έλεγχος)', null], ['ΠΡΟΣΟΜΟΙΩΣΗ Safari < 16.4', OLD]]) {
  const { page, log } = await openPage(browser, srv.url, '?stageA=1&rec=1', { init, reply: () => ({ text: 'Πες μου λίγο περισσότερα. Τι σε δυσκολεύει πιο πολύ σε αυτό;' }) });
  const start = await bodyText(page);
  out('\n== ' + label + ' — αρχική οθόνη μετά το «Ξεκίνα»: ' + (start.includes('Ξεκίνα') ? 'ακόμα η αρχική' : 'πεδίο: ' + (await page.locator('textarea.textarea').count())));
  await send(page, 'Δεν ξέρω αν πρέπει να αλλάξω δουλειά, κάθε μέρα είναι ίδια.', 1500);
  const b = await bodyText(page);
  out('μετά το 1ο μήνυμα — αιτήματα στο μοντέλο: ' + log.bodies.length + ' · γραμμή σφάλματος: «' + (await errLine(page)) + '»');
  out('οθόνη (τέλος): «' + b.replace(/\s+/g, ' ').slice(-300) + '»');
  out('σφάλματα σελίδας: ' + JSON.stringify(log.errors.slice(0, 3)) + ' · console.error: ' + JSON.stringify(log.console.slice(0, 3)));
  await page.screenshot({ path: '/tmp/claude-0/-home-user-aura/ae2b0d9a-7092-5686-af9e-096feacbb9d8/scratchpad/partA/c3_' + (init ? 'old' : 'new') + '.png' });
  await page.context().close();
}
await browser.close(); await srv.close();
