// Razvojna seja: strežnik, ki drži odprte prizore igre (en brskalnik), da se slog preizkuša hitro, brez ponovnega nalaganja proge.
//   node seja.mjs [vrata]          (ostane v ospredju; ukazi so HTTP POST z JSON)
//   POST /open  { name, spec, w, h }            odpre prizor (zapre prejšnjega z istim imenom)
//   POST /stil  { name, opts, file? }           vbrizga slog.js (privzeto) in ga uporabi z opts
//   POST /shot  { name, out, w, stil }          posnetek v datoteko (stil: true = z novim videzom)
//   POST /eval  { name, js }                    izvede JS v strani (telo asinhrone funkcije), vrne JSON
//   POST /log   { name }                        konzola strani od zadnjega klica
//   POST /close { name }                        zapre prizor;  POST /quit  zapre vse
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { serve, launch, openScene, posnemi, shrani, MAPA } from './scena.mjs';

const PORT = +process.argv[2] || 8765;
const srv = await serve();
const browser = await launch();
const seje = new Map();   // name -> { page, spec, log }

const body = (req) => new Promise((res, rej) => { let s = ''; req.on('data', d => s += d); req.on('end', () => { try { res(s ? JSON.parse(s) : {}); } catch (e) { rej(e); } }); });
const send = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };

const server = http.createServer(async (req, res) => {
  try {
    const b = await body(req), name = b.name || 'a';
    const S = seje.get(name);
    if (req.url === '/open') {
      if (S) { await S.page.context().close().catch(() => { }); seje.delete(name); }
      const t0 = Date.now(), { page, errors } = await openScene(browser, srv.base, b.spec, { width: b.w || 960, height: b.h || 540 });
      const log = []; page.on('console', m => log.push(m.type() + ': ' + m.text())); page.on('pageerror', e => log.push('pageerror: ' + e.message));
      seje.set(name, { page, spec: b.spec, log });
      return send(res, 200, { ok: true, ms: Date.now() - t0, errors });
    }
    if (req.url === '/quit') { send(res, 200, { ok: true }); setTimeout(async () => { await browser.close(); await srv.close(); process.exit(0); }, 50); return; }
    if (!S) return send(res, 404, { error: 'ni seje ' + name });
    if (req.url === '/close') { await S.page.context().close(); seje.delete(name); return send(res, 200, { ok: true }); }
    if (req.url === '/log') { const l = S.log.splice(0); return send(res, 200, { log: l }); }
    if (req.url === '/eval') {
      const r = await S.page.evaluate(async ([js]) => { const f = new (Object.getPrototypeOf(async function () { }).constructor)('g', 'Render', 'Core', 'THREE', js); return f(window.__game, Render, Core, THREE); }, [b.js]);
      return send(res, 200, { result: r === undefined ? null : r });
    }
    if (req.url === '/stil') {
      const code = (b.files || ['slog.js', 'rekviziti.js']).map(f => fs.readFileSync(path.join(MAPA, 'orodja', f), 'utf8')).join('\n;\n');
      const spec = Object.assign({}, S.spec, b.spec || {});
      const r = await S.page.evaluate(async ([code, opts, spec]) => {
        const g = window.__game, P = g.race.player;
        if (spec.shot) Render.setShot(Object.assign({}, spec.shot)); if (spec.shotJs) Render.setShot(new Function('P', 'g', 'Render', 'Core', 'THREE', 'return (' + spec.shotJs + ')')(P, g, Render, Core, THREE));
        try { (0, eval)(code); return await window.__slog.apply(opts || {}); } finally { if (spec.shot || spec.shotJs) Render.setShot(null); }
      }, [code, b.opts || null, spec]);
      return send(res, 200, { ok: true, result: r === undefined ? null : r, log: S.log.splice(0) });
    }
    if (req.url === '/scan') {   // { name, step, n, w, out }: igra se premika naprej, pregledne sličice (brez sloga) v out-NN.png
      const out = [];
      for (let k = 0; k < (b.n || 8); k++) {
        const t = await S.page.evaluate(async (step) => { const g = window.__game; Render.scene.visible = false; g.sim(step, true); for (let i = 0; i < 40; i++) Render.frame(1 / 30, 1, g.race.player, 'chase', {}); Render.scene.visible = true; return g.race.time; }, b.step || 10);
        const f = b.out + '-' + String(k).padStart(2, '0') + '.png'; shrani(f, await posnemi(S.page, Object.assign({}, S.spec, b.spec || {}), b.w || 480)); out.push([f, +t.toFixed(1)]);
      }
      return send(res, 200, { out });
    }
    if (req.url === '/shot') {
      const t0 = Date.now();
      await S.page.evaluate((on) => { if (window.__slog) window.__slog.enable(on); }, !!b.stil);
      const buf = await posnemi(S.page, Object.assign({}, S.spec, b.spec || {}), b.w || 960);
      shrani(b.out, buf);
      await S.page.evaluate(() => { if (window.__slog) window.__slog.enable(false); });
      return send(res, 200, { ok: true, out: b.out, ms: Date.now() - t0, log: S.log.splice(0) });
    }
    send(res, 404, { error: 'neznan ukaz ' + req.url });
  } catch (e) { send(res, 500, { error: String(e && e.message || e).slice(0, 2000) }); }
});
server.listen(PORT, '127.0.0.1', () => console.log('seja na vratih ' + PORT));
