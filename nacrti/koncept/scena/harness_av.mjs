// AV: MY copy of harness_ama.mjs (unchanged).
// PDA: MY copy of harness_o3b.mjs (unchanged).
// O3B: MY copy of harness_s6a.mjs (unchanged).
// S6A: MY copy of harness_xc.mjs (unchanged; long timeouts).
// XC: MY copy of harness_w.mjs (unchanged; long timeouts as it had).
// W: MY copy of harness_v.mjs (unchanged).
// V1: MY copy of harness_z2t1.mjs (every console line of the page also to OUTLOG, long waits: the machine is shared), with harness_hq.mjs's
// additions: the page's files (window.HQ_FILES: { name: { b64 } | { text } }) written to outdir after a frame, frames with noRender / after,
// CLIP=x,y,w,h (a part of the page only), ZOOM=1 ZDPR=8 (the page's enlarged part window.HQ_ZOOM with its labels, as harness_hq.mjs)
//   node harness_v.mjs <concept.js> <outdir>     env: W H DPR CAR UI ONLY OUTLOG CLIP ZOOM ZDPR NOSHOT
import { serve, launch } from '../../../tests/browser/lib.mjs';
import fs from 'node:fs';
const [concept, out] = process.argv.slice(2);
const W = +(process.env.W || 1000), H = +(process.env.H || 625), DPR = +(process.env.DPR || 1);
fs.mkdirSync(out, { recursive: true });
const srv = await serve(); const browser = await launch();
const errors = [], hq = []; let page = null, ctx = null;
async function boot() {
  if (ctx) await ctx.close();
  ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR });
  page = await ctx.newPage(); page.setDefaultTimeout(1800000);
  page.on('pageerror', e => { errors.push('pageerror: ' + e.message); if (process.env.OUTLOG) fs.appendFileSync(process.env.OUTLOG, 'pageerror: ' + e.message + '\n'); });
  page.on('console', m => { const t = m.text(); if (process.env.OUTLOG) fs.appendFileSync(process.env.OUTLOG, m.type() + ': ' + t + '\n'); if (/^HQ /.test(t)) { hq.push(t); return; }
    if (m.type() === 'error' || (m.type() === 'warning' && !/GPU stall|ReadPixels/.test(t))) errors.push(m.type() + ': ' + t); });
  await page.goto(srv.base + '/garaza.html', { timeout: 600000 });
  await page.waitForFunction(() => window.__garage && Garage3D.ready, null, { timeout: 600000 });
  await page.waitForTimeout(600);
  if (!process.env.UI) await page.addStyleTag({ content: '#g-app > :not(.g-stage){display:none!important} .g-stage{position:fixed!important;inset:0!important;height:100vh!important;width:100vw!important;margin:0!important;border-radius:0!important} .g-stage > :not(canvas){display:none!important}' });
  await page.evaluate(() => { __garage.hold = true; window.dispatchEvent(new Event('resize')); });
  await page.waitForTimeout(300);
  if (process.env.CAR) await page.evaluate(([id, col]) => { const s = Garage3D.cur.spec; Garage3D.show(Object.assign({}, s, { M: Core.MODELS.find(m => m.id === id), cond: { clean: 1, body: 1, engine: 1 } }, col ? { color: parseInt(col, 16), stripe: true } : {})); __garage.advance(0.3); }, [process.env.CAR, process.env.CARCOL || '']);   // (AV drugi avti: CARCOL = the car's own default colour, hex)
  await page.evaluate(fs.readFileSync(new URL('./lib/lib.js', import.meta.url), 'utf8'));
  const src = fs.readFileSync(concept, 'utf8');
  for (const m of src.matchAll(/^\/\/@use\s+(\S+)/gm)) await page.evaluate(fs.readFileSync(new URL(m[1], new URL('file://' + fs.realpathSync(concept))), 'utf8'));
  await page.evaluate(src);
}
await boot();
let dirty = false;
const n = await page.evaluate(() => CONCEPT.frames.length);
const only = process.env.ONLY ? process.env.ONLY.split(',').map(Number) : [...Array(n).keys()];
for (const i of only) {
  const fresh = await page.evaluate((i) => !!CONCEPT.frames[i].fresh, i);
  if (fresh && dirty) { await boot(); dirty = false; }
  if (fresh) dirty = true;
  const e0 = errors.length, h0 = hq.length, t0 = Date.now();
  await page.evaluate(async (i) => { window.HQ_FILES = {}; PR.reset(); await CONCEPT.frames[i].run(); if (!CONCEPT.frames[i].noRender) PR.render(); if (CONCEPT.frames[i].after) await CONCEPT.frames[i].after(); }, i);
  const files = await page.evaluate(() => { const f = window.HQ_FILES || {}; window.HQ_FILES = {}; return f; });
  for (const [name, v] of Object.entries(files)) fs.writeFileSync(`${out}/${name}`, v.b64 != null ? Buffer.from(v.b64, 'base64') : v.text);
  const clip = process.env.CLIP ? (([x, y, width, height]) => ({ x, y, width, height }))(process.env.CLIP.split(',').map(Number)) : null;
  if (!process.env.NOSHOT) await page.screenshot(clip ? { path: `${out}/f${i}.png`, clip, timeout: 1800000 } : { path: `${out}/f${i}.png`, fullPage: !!process.env.UI, timeout: 1800000 });
  const zoom = process.env.ZOOM ? await page.evaluate(() => window.HQ_ZOOM || null) : null;
  if (zoom && (files['zoom_comp.png'] || files['comp.png'])) { const zdpr = +(process.env.ZDPR || 8), t1 = Date.now(), zc = files['zoom_comp.png'];
    const lay = await page.evaluate(() => { const l = document.querySelector('.hq-lab'), v = document.querySelector('.g-vig'); return { html: l ? l.outerHTML : '', vig: v ? getComputedStyle(v).backgroundImage : 'none' }; });
    const ctx2 = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: zdpr }), p2 = await ctx2.newPage();
    const img = zc ? `<img src="data:image/png;base64,${zc.b64}" style="position:fixed;left:${zoom[0]}px;top:${zoom[1]}px;width:${zoom[2]}px;height:${zoom[3]}px">`
      : `<img src="data:image/png;base64,${files['comp.png'].b64}" style="position:fixed;left:0;top:0;width:${W}px;height:${H}px">`;
    await p2.setContent(`<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#0d1420;overflow:hidden">${img}<div style="position:fixed;left:0;top:0;width:${W}px;height:${H}px;background-image:${lay.vig}"></div>${lay.html}</body></html>`);
    await p2.waitForTimeout(800);
    await p2.screenshot({ path: `${out}/f${i}_zoom.png`, clip: { x: zoom[0], y: zoom[1], width: zoom[2], height: zoom[3] }, timeout: 1800000 });
    await ctx2.close(); console.log(`   zoom ${zoom.join(',')} at DPR ${zdpr} -> f${i}_zoom.png (${((Date.now() - t1) / 1000).toFixed(0)} s)`); }
  console.log('frame', i, await page.evaluate((i) => CONCEPT.frames[i].name, i), `(${((Date.now() - t0) / 1000).toFixed(0)} s)`, Object.keys(files).length ? 'files: ' + Object.keys(files).join(', ') : '');
  for (const t of hq.slice(h0)) console.log('   ' + t);
  for (const e of [...new Set(errors.slice(e0).filter(e => /ZARM/.test(e)))]) console.log('   ' + e.replace(/^warning: /, ''));
}
const rest = [...new Set(errors.filter(e => !/ZARM/.test(e)))];
console.log(rest.length ? rest.slice(0, 40).join('\n') : 'no errors');
await browser.close(); await srv.close();
