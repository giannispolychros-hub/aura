import { startServer, launch, openPage, send, out, APP, LIB } from './lib.mjs';
const srv = await startServer(); const browser = await launch();
const heads = d => [...new Set((d.match(/\n\[[A-ZΑ-Ω][^\]\n]{0,60}/g) || []).map(h => h.slice(2, 40)))];
for (const second of ['Δουλεύω πολύ. Τίποτα άλλο.', 'Δουλεύω πολύ. Μάλλον κουράζομαι πιο εύκολα αυτόν τον καιρό.', 'Δουλεύω πολύ. Ο προϊστάμενος ζητάει συνέχεια περισσότερα.']) {
  const { ctx, page, log } = await openPage(browser, srv.url, '?stageA=1&rec=1');
  await send(page, 'Δεν ξέρω αν πρέπει να αλλάξω δουλειά, κάθε μέρα είναι ίδια.', 1200); await send(page, second, 1500); await send(page, 'Δεν ξέρω.', 1500);
  const r = log.bodies.map(b => LIB.classifyRequest(b, APP));
  out('«' + second + '» → 3ο αίτημα: ' + JSON.stringify(heads(r[2].dynamic || '')));
  await ctx.close();
}
await browser.close(); await srv.close();
