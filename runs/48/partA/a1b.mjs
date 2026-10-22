import { startServer, launch, openPage, send, bodyText, errLine, out } from './lib.mjs';
const srv = await startServer(); const browser = await launch();
const F1 = 'Δεν ξέρω αν πρέπει να αλλάξω δουλειά, κάθε μέρα είναι ίδια.';
for (const code of [413, 403, 400]) {
  for (const failN of [1, 99]) {
    const { ctx, page, log } = await openPage(browser, srv.url, '?stageA=1', { reply: (b, n) => n < failN ? { status: code, body: { error: code === 403 ? 'Forbidden' : 'x' } } : { text: 'Τι σε δυσκολεύει πιο πολύ σε αυτό;' } });
    await send(page, F1, 1500);
    const err1 = await errLine(page);
    for (let k = 0; k < 2; k++) { await page.getByRole('button', { name: 'Go' }).click().catch(() => {}); await page.waitForTimeout(1200); }
    const after = await bodyText(page);
    out(code + (failN === 1 ? ' μία φορά' : ' σε κάθε κλήση (π.χ. ανοιχτή καρτέλα με παλιό κώδικα μετά από αλλαγή του prompt)') + ' | 1η: «' + err1 + '» | μετά από 2 ακόμα «Go»: απάντηση ' + (after.includes('Τι σε δυσκολεύει') ? 'ναι' : 'όχι') + ', στην οθόνη «' + (await errLine(page)) + '» | κλήσεις ' + log.bodies.length);
    await ctx.close();
  }
}
await browser.close(); await srv.close();
