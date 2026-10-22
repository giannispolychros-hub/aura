// Part A helpers: the main build (ccefc6e) served locally, a fake model behind the REAL api guard (checkAuraRequest from api/aura.js),
// no call to any real model, nothing written to the repo.
import { createRequire } from 'module';
import fs from 'fs'; import path from 'path'; import crypto from 'crypto';
const require = createRequire('/home/user/aura/package.json');
export const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright'); } })();
export const WT = '/home/user/aura_wmain';
export const DIST = '/tmp/claude-0/-home-user-aura/ae2b0d9a-7092-5686-af9e-096feacbb9d8/scratchpad/dist_main';
export const LIB = require('/home/user/aura/scripts/e2e_stage_a_lib.cjs');
export const APP = LIB.loadApp(fs.readFileSync(path.join(WT, 'src/App.jsx'), 'utf8'));
export const T = APP.texts;

// the guard of api/aura.js, extracted as text (the file is not changed)
const apiSrc = fs.readFileSync(path.join(WT, 'api/aura.js'), 'utf8');
const grab = (start) => { const a = apiSrc.indexOf(start); let d = 0, st = false; for (let k = apiSrc.indexOf('{', a); k < apiSrc.length; k++) { if (apiSrc[k] === '{') { d++; st = true; } else if (apiSrc[k] === '}') { d--; if (st && d === 0) return apiSrc.slice(a, k + 1); } } };
const FP = new Function('return ' + apiSrc.slice(apiSrc.indexOf('const PROMPT_FINGERPRINTS = ') + 'const PROMPT_FINGERPRINTS = '.length, apiSrc.indexOf('};', apiSrc.indexOf('const PROMPT_FINGERPRINTS')) + 1))();
const LIMITS = new Function('return ' + apiSrc.slice(apiSrc.indexOf('const REQUEST_LIMITS = ') + 'const REQUEST_LIMITS = '.length, apiSrc.indexOf('};', apiSrc.indexOf('const REQUEST_LIMITS')) + 1))();
const checkAuraRequest = new Function(grab('function checkAuraRequest(') + '\nreturn checkAuraRequest;')();
const sha = t => crypto.createHash('sha256').update(t, 'utf8').digest('hex');
export const guard = body => checkAuraRequest(body, FP, LIMITS, sha);
export { LIMITS };

export async function startServer() {
  const vite = await import('/home/user/aura/node_modules/vite/dist/node/index.js');
  const server = await vite.preview({ configFile: false, root: WT, logLevel: 'error', build: { outDir: DIST }, preview: { port: 5611, strictPort: false } });
  return { url: server.resolvedUrls.local[0].replace(/\/$/, ''), close: () => new Promise(r => server.httpServer.close(r)) };
}
export const launch = () => chromium.launch().catch(() => chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }));

// a page with the fake model: `reply(body, n)` returns { status, text } or { hang: true }; every request goes through the real guard first
export async function openPage(browser, base, query, o = {}) {
  const ctx = await browser.newContext({ viewport: o.viewport || { width: 390, height: 844 }, isMobile: true, hasTouch: true, acceptDownloads: true, permissions: o.permissions || [] });
  const page = await ctx.newPage();
  const log = { bodies: [], guard: [], errors: [], console: [], requests: [] };
  page.on('pageerror', e => log.errors.push(String(e && e.message || e)));
  page.on('console', m => { if (m.type() === 'error') log.console.push(m.text()); });
  page.on('request', r => log.requests.push(r.url()));
  if (o.init) await ctx.addInitScript(o.init);
  await ctx.addInitScript(() => { try { localStorage.setItem('aura_intro_seen', '1'); } catch (e) {} });
  let n = 0;
  await page.route('**/api/aura', async route => {
    let b = {}; try { b = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
    log.bodies.push(b);
    const g = guard(b); log.guard.push(g ? g.status : 200);
    if (g) return route.fulfill({ status: g.status, contentType: 'application/json', body: JSON.stringify({ error: g.error }) });
    const r = (o.reply || (() => ({ text: 'Τι σε δυσκολεύει πιο πολύ σε αυτό;' })))(b, n++);
    if (r.hang) return; // never answered — the app's own timeout decides
    return route.fulfill({ status: r.status || 200, contentType: 'application/json',
      body: JSON.stringify(r.status && r.status !== 200 ? (r.body || { type: 'error', error: { type: 'overloaded_error', message: 'Overloaded' } }) : { content: [{ type: 'text', text: r.text }], usage: { input_tokens: 10, output_tokens: 10 } }) });
  });
  await page.goto(base + '/' + (query || ''));
  if (!o.noStart) await page.getByText('Ξεκίνα με το πρόβλημά σου').click({ timeout: 8000 }).catch(() => log.errors.push('no start button'));
  return { ctx, page, log };
}
export async function send(page, text, wait = 900) {
  await page.locator('textarea.textarea').fill(text);
  await page.getByRole('button', { name: 'Go' }).click();
  await page.waitForTimeout(wait);
}
export const btn = (page, name) => page.getByRole('button', { name, exact: true });
export const bodyText = page => page.locator('body').innerText().catch(() => '');
export const errLine = async page => (await page.locator('.err').count()) ? page.locator('.err').first().innerText() : '';
export const out = (...a) => console.log(...a);
