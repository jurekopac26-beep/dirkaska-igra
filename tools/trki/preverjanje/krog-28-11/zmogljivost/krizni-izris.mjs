// Zmogljivost, križni izris (krog 28. 11.): ali isti prizor na veji stane več kot na `main`, ali pa so samo avti drugje.
// Dva načina, oba z nastavitvijo testa tests/browser/perf.test.mjs (telefon 844x390, kakovost normal, podrobnosti low, sence, kamera za
// avtom; trki med avti Stara crV 4, vleka krmila samo moj avto pullAll 0) in z istim semenom:
//   NACIN=zajem  dirka teče kot v testu; ob vsakem od šestih vzorcev se pred izrisom shrani stanje vseh avtov in dirke (vsa podatkovna
//                polja: številke, nizi, seznami, navadni objekti; brez mrež, sveta in nastavitev avta), stanje žreba in izmerjena klici in
//                oglišča. Na koncu še postavitev na startu (nova dirka, nič simulacije). Izpis v STANJE/<OZNAKA>-<proga>.json.
//   NACIN=izris  za vsak shranjeni vzorec: nova dirka (ista postavitev na startu), igra odšteje do ugasnjenih luči (avti stojijo), nato se
//                vanjo vpiše shranjeno stanje, kamera se umiri v desetih sličicah kot v testu, enajsta se prešteje. Dirka se po vpisu ne
//                simulira. Stanje je lahko iz istega drevesa (kontrola: mora dati isto, kot je bilo izmerjeno ob zajemu) ali iz drugega
//                (križni izris).
// Zagon: TRKI_SNAP=<drevo> NACIN=zajem OZNAKA=veja STANJE=<mapa> node krizni-izris.mjs
//        TRKI_SNAP=<drevo> NACIN=izris IZVOR=veja OZNAKA=main STANJE=<mapa> node krizni-izris.mjs
// PROGE=livorno,mombasa (privzeto). Drevo potrebuje node_modules/playwright. Datoteke stanja so velike (nekaj MB na progo) in ne gredo v git.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const TU = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(process.env.TRKI_SNAP || path.join(TU, '..', '..', '..', '..', '..'));
const { serve, launch, openGame, startTrack } = await import(pathToFileURL(path.join(ROOT, 'tests', 'browser', 'lib.mjs')).href);
const SHAKE = { camShake: 1, camLand: 1, camKerb: 1, camMis: 1, crV: 4, pullAll: 0 };
const ids = (process.env.PROGE || 'livorno,mombasa').split(',');
const NACIN = process.env.NACIN || 'zajem', OZNAKA = process.env.OZNAKA || 'drevo', IZVOR = process.env.IZVOR || OZNAKA;
const STANJE = path.resolve(process.env.STANJE || '.');
// (BREZ=glass,dents izpusti ta polja dirke in avta pri vpisu: za iskanje, katero polje stanja nosi razliko)
const BREZ = (process.env.BREZ || '').split(',').filter(Boolean);

// v strani: zajem in vpis stanja. Polja nastavitve avta (m, setup, arc, upg, assist) in dirke (track, opts, vprof, propBk) se ne prenašajo:
// določi jih ista postavitev na startu; preverimo, da je avto z istim mestom v obeh drevesih isti model iste barve.
const POMOC = () => {
  const CAR_SKIP = new Set(['m', 'setup', 'arc', 'upg', 'assist']), RACE_SKIP = new Set(['track', 'cars', 'player', 'opts', 'vprof', 'propBk']);
  const snap = (v, cars, depth, stack) => {
    if (v === undefined) return { $u: 1 };
    if (v === null) return null;
    const t = typeof v;
    if (t === 'number') return Number.isFinite(v) ? v : { $n: String(v) };
    if (t === 'boolean' || t === 'string') return v;
    if (t !== 'object') return { $x: 1 };   // (funkcija, simbol: se ne prenaša)
    if (ArrayBuffer.isView(v)) return { $ta: v.constructor.name, d: Array.from(v) };
    const ci = cars.indexOf(v); if (ci >= 0) return { $car: ci };
    if (depth > 8 || stack.includes(v)) return { $x: 1 };
    if (Array.isArray(v)) { stack.push(v); const a = v.map(x => snap(x, cars, depth + 1, stack)); stack.pop(); return a; }
    if (v.constructor !== Object) return { $x: 1 };   // (mreža, material, proga ...: ostane, kar ima drevo izrisa)
    stack.push(v); const o = {}; for (const k of Object.keys(v)) o[k] = snap(v[k], cars, depth + 1, stack); stack.pop(); return o;
  };
  const put = (dst, key, sv, cars) => {
    if (sv === null || typeof sv !== 'object') { dst[key] = sv; return; }
    if (!Array.isArray(sv)) {
      if (sv.$x) return;
      if (sv.$u) { dst[key] = undefined; return; }
      if (sv.$n) { dst[key] = Number(sv.$n); return; }
      if (sv.$car !== undefined) { dst[key] = cars[sv.$car]; return; }
      if (sv.$ta) { const cur = dst[key]; if (cur && ArrayBuffer.isView(cur) && cur.length === sv.d.length) cur.set(sv.d); else dst[key] = new window[sv.$ta](sv.d); return; }
      let cur = dst[key]; if (!cur || typeof cur !== 'object' || Array.isArray(cur) || ArrayBuffer.isView(cur)) cur = dst[key] = {};
      for (const k of Object.keys(sv)) put(cur, k, sv[k], cars);
      return;
    }
    let cur = dst[key]; if (!Array.isArray(cur)) cur = dst[key] = [];
    cur.length = sv.length; for (let i = 0; i < sv.length; i++) put(cur, i, sv[i], cars);
  };
  window.__kx = {
    seed: 12345,
    rng() { Math.random = () => { __kx.seed = (__kx.seed * 16807) % 2147483647; return __kx.seed / 2147483647; }; },
    stanje(g) {
      const cars = g.race.cars, P = g.race.player;
      const race = {}; for (const k of Object.keys(g.race)) if (!RACE_SKIP.has(k)) race[k] = snap(g.race[k], cars, 0, []);
      return { seed: __kx.seed, race, cars: cars.map(c => { const o = {}; for (const k of Object.keys(c)) if (!CAR_SKIP.has(k)) o[k] = snap(c[k], cars, 0, []); return o; }),
        kdo: cars.map(c => (c.m && c.m.id) + '/' + c.color), s: Math.round(P.q.s), near: cars.filter(c => c !== P && Math.hypot(c.x - P.x, c.z - P.z) < 150).length,
        dmg: cars.filter(c => c.dmg > 0.001).length };
    },
    vpisi(g, st, brez) {
      const cars = g.race.cars; let drugi = 0;
      cars.forEach((c, i) => { if ((c.m && c.m.id) + '/' + c.color !== st.kdo[i]) drugi++; });
      for (const k of Object.keys(st.race)) if (!brez.includes(k)) put(g.race, k, st.race[k], cars);
      st.cars.forEach((o, i) => { const c = cars[i]; if (!c) return; for (const k of Object.keys(o)) if (!brez.includes(k)) put(c, k, o[k], cars); });
      if (g.race.props) for (const b of g.race.props) if (b && typeof b === 'object' && 'dirty' in b) b.dirty = true;   // (premaknjeni predmeti se narišejo na novih mestih)
      return drugi;
    },
    meri(g) {
      const P = g.race.player;
      Render.resetCam(); for (let i = 0; i < 10; i++) Render.frame(1 / 60, 1, P, g.S.camera, {});
      const c0 = __gl.calls, v0 = __gl.verts; Render.frame(1 / 60, 1, P, g.S.camera, {});
      return { calls: __gl.calls - c0, verts: __gl.verts - v0 };
    },
    nova(g) { __kx.seed = 12345; g.onAction('restart'); g.pause(); g.race.lch = null; for (const c of g.race.cars) c.lch = null; g.race.player.kt = null; },
    // (igra po novi dirki čaka v uvodu in pri lučeh; proga z lastnim uvodnim posnetkom, npr. Lusail, ima takrat kamero drugje. Koraki do
    // ugasnjenih luči: avti medtem stojijo na startu, stanje se zatem v celoti prepiše s shranjenim)
    vDirko(g) { for (let i = 0; i < 1800 && g.phase !== 'racing'; i++) g.sim(1 / 60, true); return g.phase; },
  };
};
const kv = (v) => (v / 1000).toFixed(1);
const srv = await serve(), browser = await launch();
try {
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', detail: 'low', shadows: 1, camera: 'chase', zoom: 1.2, ...SHAKE }, { width: 844, height: 390 }, { seed: 12345 });
  await page.evaluate(() => {
    window.__gl = { calls: 0, verts: 0 };
    const gl = Render.info && document.querySelector('canvas').getContext('webgl2') || document.querySelector('canvas').getContext('webgl');
    const P = Object.getPrototypeOf(gl), wrap = (name, count) => { const f = P[name]; if (!f) return; P[name] = function (...a) { window.__gl.calls++; window.__gl.verts += count(a); return f.apply(this, a); }; };
    wrap('drawElements', a => a[1]); wrap('drawArrays', a => a[2]);
    wrap('drawElementsInstanced', a => a[1] * a[4]); wrap('drawArraysInstanced', a => a[2] * a[3]);
  });
  await page.evaluate(POMOC);
  for (const id of ids) {
    await startTrack(page, id);
    if (NACIN === 'zajem') {
      const r = await page.evaluate(async () => {
        if (Render.world.landmarkLoad) await Render.world.landmarkLoad;
        const g = window.__game; __kx.rng(); __kx.nova(g);
        const P = g.race.player, vz = [];
        for (let k = 0; k < 6; k++) {   // (ista zanka kot v testu; stanje se shrani po koraku dirke, pred izrisom)
          const dt = Math.min(30, g.race.track.len / 45 / 6); for (let i = 0; i < dt; i++) g.sim(1, true);
          const st = __kx.stanje(g); st.nat = __kx.meri(g); vz.push(st);
          for (let i = 0; i < 30; i++) g.sim(1 / 60, true);
          Render.scene.visible = false; for (let i = 0; i < 30; i++) Render.frame(1 / 60, 1, g.race.player, g.S.camera, {}); Render.scene.visible = true;
        }
        __kx.nova(g); const st0 = __kx.stanje(g); st0.nat = __kx.meri(g);   // (postavitev na startu: nova dirka, nič simulacije)
        return { vz, start: st0, len: Math.round(g.race.track.len), cars: g.race.cars.length };
      });
      const f = path.join(STANJE, `${OZNAKA}-${id}.json`); fs.mkdirSync(STANJE, { recursive: true }); fs.writeFileSync(f, JSON.stringify(r));
      console.log(`${id.padEnd(8)} zajem ${OZNAKA}: s ${r.vz.map(x => x.s).join(' ')} (krog ${r.len} m, ${r.cars} avtov) | tekmeci do 150 m ${r.vz.map(x => x.near).join(' ')} | avti s škodo ${r.vz.map(x => x.dmg).join(' ')}`);
      console.log(`${''.padEnd(8)} tisoč oglišč ${r.vz.map(x => kv(x.nat.verts)).join(' ')} | klici ${r.vz.map(x => x.nat.calls).join(' ')} | start ${kv(r.start.nat.verts)} tisoč oglišč, ${r.start.nat.calls} klicev`);
    } else {
      const src = JSON.parse(fs.readFileSync(path.join(STANJE, `${IZVOR}-${id}.json`), 'utf8'));
      const out = [];
      for (const st of [...src.vz, src.start]) {   // (vsak vzorec posebej: stanje gre v stran kot argument)
        out.push(await page.evaluate(async ({ st, brez, start }) => {
          if (Render.world.landmarkLoad) await Render.world.landmarkLoad;
          const g = window.__game; __kx.rng(); __kx.nova(g);
          const faza = start ? 'racing' : __kx.vDirko(g);
          const drugi = __kx.vpisi(g, st, brez); __kx.seed = st.seed;
          const m = __kx.meri(g); m.drugi = drugi; m.faza = faza; return m;
        }, { st, brez: BREZ, start: st === src.start }));
      }
      if (out.some(x => x.faza !== 'racing')) console.log(`${id.padEnd(8)} POZOR: igra ni prišla do dirke (${out.map(x => x.faza).join(' ')})`);
      const vz = out.slice(0, 6), s0 = out[6], nat = src.vz.map(x => x.nat);
      console.log(`${id.padEnd(8)} stanje ${IZVOR}, izris ${OZNAKA}${BREZ.length ? ' (brez ' + BREZ.join(',') + ')' : ''}: tisoč oglišč ${vz.map(x => kv(x.verts)).join(' ')} | klici ${vz.map(x => x.calls).join(' ')} | start ${kv(s0.verts)}, ${s0.calls} klicev`);
      console.log(`${''.padEnd(8)} ob zajemu (${IZVOR}): tisoč oglišč ${nat.map(x => kv(x.verts)).join(' ')} | klici ${nat.map(x => x.calls).join(' ')} | start ${kv(src.start.nat.verts)}, ${src.start.nat.calls} klicev`);
      console.log(`${''.padEnd(8)} razlika (izris − zajem): oglišča ${vz.map((x, i) => x.verts - nat[i].verts).join(' ')} | klici ${vz.map((x, i) => x.calls - nat[i].calls).join(' ')} | start ${s0.verts - src.start.nat.verts}, ${s0.calls - src.start.nat.calls} | avti drugega modela ali barve ${Math.max(...out.map(x => x.drugi))}`);
    }
  }
  if (errors.length) console.log('napake strani: ' + errors.slice(0, 3).join(' | '));
  await ctx.close();
} finally {
  await browser.close(); await srv.close();
}
