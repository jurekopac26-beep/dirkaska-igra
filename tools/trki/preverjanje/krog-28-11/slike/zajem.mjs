// Slike zdaj in potem, krog 28. 11.: korak 3 (odstop sredi polja, zavora izločenega avta) in fizika-6 (lastno vrtenje kolesa povoženega kolesarja).
// Prizor teče v brskalniku na drevesu --root; kamera za igralčevim avtom (chase), brez HUD-a. Številke prizora se izpišejo, da se ponovitev
// primerja z meritvijo v Node (Math v Chromiumu se lahko v zadnjem bitu razlikuje, zato primerjaj po številkah).
// Slike gredo v --out (zunaj repozitorija: repozitorij je javen, slik za vprašanja ne commitamo).
//
//   node zajem.mjs odstop  --root <drevo> --out <mapa> [--proga <id>] [--cv 1] [--rk 1500] [--avto 7] [--casi 1,2,3.5,6,12] [--pogoji igra|meritev]
//   node zajem.mjs kolo    --root <drevo> --out <mapa> [--proga eljem] [--kmh 80] [--zamik 0.85] [--raz 15] [--casi -0.2,0.1,0.3,0.5,0.8,2] [--pogled 1920x888] [--pogoji igra|meritev]
//   node zajem.mjs sestavi --a <mapa> [--b <mapa>] --out <slika.jpg> --la "<naslov traku>" [--lb "..."] [--naslov "<podnaslov>"] [--casi ...] [--izrez x0,y0,x1,y1] [--kb 300]
//
// odstop: ista dirka kot v meritvi (korak-3/odstop.js: seme 7 za progo in dirko, seme dirke 9, korak K s semenom 1000 + K, igralčev avto vodi
//   samodejni voznik); v koraku --rk odstopi avto --avto. Čas slik teče od odstopa.
// kolo: postavljen prizor na odprti cesti s prometom: en kolesar na najbolj ravnem delu proge (ostali iz njegove skupine in vozila do 200 m so
//   umaknjeni), avto --raz m za njim in --zamik m levo od njega pelje naravnost s --kmh, po zadetku zavira do ustavitve. Čas slik teče od koraka
//   zadetka (negativen: pred zadetkom); korak zadetka poišče prvi prehod brez risanja, drugi prehod riše.
// sestavi: navpičen trak slik ene mape (ali dva stolpca, --a in --b) s časom in opisom pod vsako sliko; opis nastane iz številk prizora.
// --pogoji igra: steklo na cesti in predmeti ob progi kot v igri; meritev: brez obojega, kot v Node (Core.setCrash(null), brez predmetov).
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.resolve(HERE, '../../../../..');
const { serve, launch, openGame, startTrack } = await import(path.join(REPO, 'tests/browser/lib.mjs'));
const argv = process.argv.slice(2), KAJ = argv[0], A = {};
for (let i = 1; i < argv.length; i += 2) A[argv[i].replace(/^--/, '')] = argv[i + 1];
const num = (k, d) => A[k] == null ? d : +A[k], list = (k, d) => (A[k] == null ? d : A[k]).split(',').filter(Boolean).map(Number);
const VIEW = (() => { const p = (A.pogled || '960x444').split('x').map(Number); return { width: p[0], height: p[1] }; })();   // (--pogled 1920x888: isti pogled v večji ločljivosti, za izrez)

// v strani: skupna orodja (seme, zajem platna, risanje z lastnim semenom, da risanje ne poseže v naključja dirke)
const ORODJA = `
  const seeded = (s) => () => { s = (s * 16807) % 2147483647; return s / 2147483647; }, DT = 1 / 120, gl = document.getElementById('gl');
  const rr = seeded(4242), draw = (P, dt) => { const keep = Math.random; Math.random = rr; try { Render.frame(dt, 1, P, 'chase', {}); } finally { Math.random = keep; } };
  const grab = () => { const c = document.createElement('canvas'); c.width = innerWidth; c.height = innerHeight; c.getContext('2d').drawImage(gl, 0, 0, innerWidth, innerHeight); return c.toDataURL('image/png'); };
`;

async function odpri(proga, cv, nacin) {
  const srv = await serve(path.resolve(A.root || REPO)), browser = await launch();
  const set = { quality: 'high', shadows: 1, camera: 'chase', weather: 'dry', tod: 'day', season: 'summer', damage: 2, crV: cv - 1, track: proga };
  const { page, errors } = await openGame(browser, srv.base + '/index.html', set, VIEW, { seed: 11 });
  await startTrack(page, proga, nacin);
  return { srv, browser, page, errors };
}

async function odstop() {
  const proga = A.proga || 'toskana', cv = num('cv', 1), o = await odpri(proga, cv);
  const arg = { cv, rk: num('rk', 1500), ci: num('avto', 7), casi: list('casi', ''), after: num('po', 20), pogoji: A.pogoji || 'igra' };
  const res = await o.page.evaluate(new Function('A', `return (async () => { ${ORODJA}
    const g = window.__game; g.pause(); Render.resize();
    if (Render.world && Render.world.landmarkLoad) await Render.world.landmarkLoad;
    Core.setTest({ cv: A.cv }); if (A.pogoji === 'meritev') Core.setCrash(null);
    Math.random = seeded(7);
    const T = new Core.Track(g.race.track.def);
    const r = new Core.Race(T, { numAI: 12, playerGrid: 12, laps: 2, playerModel: Core.MODELS[4], assist: 2, seed: 9, difficulty: 1, damage: 2, phys: 'cs' });
    r.start(); if (A.pogoji === 'meritev') r.setProps([], null);
    Render.attachRace(r); Render.resetCam();
    const P = r.player, c = r.cars[A.ci], want = A.casi.map(t => A.rk + Math.round(t * 120)), last = want.length ? want[want.length - 1] : -1;
    const out = { prizor: 'odstop', izloceni: c.m.id, igralec: P.m.id, mesto: r.cars.indexOf(P), avtov: r.cars.length, predmetov: r.props ? r.props.length : 0, frames: [] };
    let d0 = 0, px = 0, pz = 0, pot = 0, stopT = -1, dEnd = 0, blk = 0, dOth0 = 0;
    const oth = () => r.cars.reduce((s, x) => s + (x === c ? 0 : x.dmg), 0), N = A.rk + Math.round(A.after * 120);
    for (let K = 0; K < N; K++) {
      if (K === A.rk - 120 && last >= 0) { Render.resetCam(); for (let i = 0; i < 30; i++) draw(P, 0.1); }
      if (K === A.rk) { r.retire(c); d0 = c.dmg; dOth0 = oth(); px = c.x; pz = c.z; }
      Math.random = seeded(1000 + K); Core.aiControl(P, r, DT); r.step(DT);
      if (K >= A.rk) { const j = Math.hypot(c.x - px, c.z - pz); if (j < 1.5) pot += j; px = c.x; pz = c.z;
        if (stopT < 0 && c.wreck && c.wreck.stop) { stopT = (K - A.rk) / 120; dEnd = Math.abs(c.q.d) - r.track.w; } if (c.inBrk >= 0.79 && c.speed > 1) blk++; }
      if (K >= A.rk - 120 && K <= last) { const wi = want.indexOf(K);
        if (K % 4 === 3 || wi >= 0) draw(P, K % 4 === 3 ? 4 * DT : DT);
        if (wi >= 0) out.frames.push({ t: A.casi[wi], src: grab(), skoda: c.dmg - d0, rob: Math.abs(c.q.d) - r.track.w, v: c.speed, raz: Math.hypot(c.x - P.x, c.z - P.z), stoji: !!(c.wreck && c.wreck.stop) }); }
    }
    Object.assign(out, { skodaIzl: c.dmg - d0, skodaDrugi: oth() - dOth0, ustavi: stopT, pot, rob: dEnd, zavora: blk });
    return out; })()`), arg);
  await shrani(res, o, arg);
}

async function kolo() {
  const proga = A.proga || 'eljem', o = await odpri(proga, 6, 'traffic');
  const arg = { kmh: num('kmh', 80), zamik: num('zamik', 0.85), raz: num('raz', 15), zav: num('zav', 1), casi: list('casi', '-0.2,0.1,0.3,0.5,0.8,2'), pogoji: A.pogoji || 'igra' };
  const res = await o.page.evaluate(new Function('A', `return (async () => { ${ORODJA}
    const g = window.__game; g.pause(); Render.resize();
    if (Render.world && Render.world.landmarkLoad) await Render.world.landmarkLoad;
    Core.setTest({ cv: 6 }); if (A.pogoji === 'meritev') Core.setCrash(null);
    const def = g.race.track.def, v0 = A.kmh / 3.6;
    // dirka s prometom in postavitev: en kolesar, avto za njim (enako v obeh prehodih)
    const postavi = () => {
      Math.random = seeded(7);
      const T = new Core.Track(def);
      const r = new Core.Race(T, { numAI: 0, playerGrid: 1, laps: 1, playerModel: Core.MODELS[4], assist: 2, seed: 9, difficulty: 1, damage: 2, phys: 'cs', traffic: true });
      r.start(); if (A.pogoji === 'meritev') r.setProps([], null);
      const tf = r.tf, P = r.player;
      const kmaxAt = (s) => { const i0 = T.idx(s - 120), n = Math.round(260 / T.ds); let km = 0; for (let j = 0; j < n; j++) km = Math.max(km, Math.abs(T.k[(i0 + j) % T.N])); return km; };
      const bikes = tf.veh.filter(v => v.kind === 4 && v.dir === 1 && !v.off).map(v => ({ v, km: kmaxAt(v.s) })).sort((a, b) => a.km - b.km);
      const lead = bikes[0].v, grp = lead.grp ? lead.grp.m.slice() : [lead], veh = grp[0];
      let umak = 0;
      for (const q of grp) if (q !== veh) { const m = q.grp ? q.grp.m : null, k = m ? m.indexOf(q) : -1; if (k >= 0) m.splice(k, 1); q.grp = null; q.off = true; umak++; }
      for (const q of tf.veh) if (q !== veh && !q.off && Math.abs(q.s - veh.s) < 200) { if (q.grp) { const m = q.grp.m, k = m.indexOf(q); if (k >= 0) m.splice(k, 1); q.grp = null; } q.off = true; umak++; }
      const hx = Math.cos(veh.h), hz = Math.sin(veh.h), nx = hz, nz = -hx;   // (n: v levo od kolesa, proti sredini ceste)
      P.place(veh.x - hx * A.raz + nx * A.zamik, veh.z - hz * A.raz + nz * A.zamik, veh.h); P.vx = hx * v0; P.vz = hz * v0; P.w = 0;
      if (T.hasElev) P.y = P.py = veh.y || 0;
      return { T, r, P, veh, umak };
    };
    // korak: do zadetka plin za stalno hitrost, po njem zavora do ustavitve, nato ročna (zavora na mestu bi avto peljala vzvratno)
    const korak = (S, K, hit) => { const P = S.P;
      Math.random = seeded(1000 + K);
      if (!hit) { P.inThr = P.speed < v0 ? 0.6 : 0.1; P.inBrk = 0; P.inHand = 0; } else { const gre = P.speed > 1.5; P.inThr = 0; P.inBrk = gre ? A.zav : 0; P.inHand = gre ? 0 : 1; }
      P.inSteer = 0; P.digitalSteer = false; S.r.step(DT); };
    // 1. prehod brez risanja: korak zadetka
    let S = postavi(), hit1 = -1, w1 = 0;
    for (let K = 0; K < 1200 && hit1 < 0; K++) { korak(S, K, false); if (S.veh.st > 0) { hit1 = K; w1 = S.veh.w; } }
    if (hit1 < 0) throw new Error('avto kolesa ne zadene');
    // 2. prehod z risanjem
    S = postavi(); const { r, P, veh, T } = S;
    const out = { prizor: 'kolo', proga: def.id, polsirina: T.w, avto: P.m.id, kolo: veh.id, s: veh.s - T.startS, d: veh.d, vKolo: veh.v, umaknjenih: S.umak, predmetov: r.props ? r.props.length : 0, frames: [] };
    Render.attachRace(r); Render.resetCam(); for (let i = 0; i < 30; i++) draw(P, 0.1);
    out.predmetov = r.props ? r.props.length : 0;
    const want = A.casi.map(t => hit1 + Math.round(t * 120)), last = Math.max(...want);
    let hitK = -1, rot = 0, wHit = 0, vHit = 0, n2 = 0, dMax = -1e9;
    for (let K = 0; K <= last; K++) {
      const vPrev = P.speed, hPrev = veh.h, dmg0 = P.dmg;
      korak(S, K, hitK >= 0);
      if (hitK >= 0) { rot += veh.h - hPrev; if (P.dmg > dmg0 + 1e-9) n2++; }
      else if (veh.st > 0) { hitK = K; wHit = veh.w; vHit = vPrev; }
      const wi = want.indexOf(K), ch = Math.cos(P.h), sh = Math.sin(P.h), dx = veh.x - P.x, dz = veh.z - P.z, dk = veh.q && veh.q.d != null ? veh.q.d : veh.d; dMax = Math.max(dMax, dk);
      if (K % 4 === 3 || wi >= 0) draw(P, K % 4 === 3 ? 4 * DT : DT);
      if (wi >= 0) out.frames.push({ t: A.casi[wi], src: grab(), w: veh.w, zasuk: rot * 180 / Math.PI, naprej: dx * ch + dz * sh, desno: -dx * sh + dz * ch, d: dk, vKolo: veh.st > 0 ? Math.hypot(veh.vx, veh.vz) : veh.v, vAvto: P.speed * 3.6, miruje: veh.st === 2, st: veh.st });
    }
    Object.assign(out, { zadetekK: hitK, zadetekK1: hit1, w1, vZadetek: vHit * 3.6, wZadetek: wHit, zasukSkupaj: rot * 180 / Math.PI, skodaAvta: P.dmg, korakovSkode: n2, dNajvec: dMax });
    return out; })()`), arg);
  await shrani(res, o, arg);
}

function shrani(res, o, arg) {
  const out = path.resolve(A.out), frames = res.frames; fs.mkdirSync(out, { recursive: true });
  for (const f of frames) { fs.writeFileSync(path.join(out, 't' + f.t.toFixed(2) + '.png'), Buffer.from(f.src.split(',')[1], 'base64')); delete f.src; }
  res.oznaka = A.oznaka || ''; res.arg = arg; res.napake = o.errors.slice(0, 5);
  fs.writeFileSync(path.join(out, 'prizor.json'), JSON.stringify(res, null, 1));
  const { frames: _f, arg: _a, ...kratko } = res; console.log(JSON.stringify(kratko));
  for (const f of frames) console.log('  ' + JSON.stringify(f));
  return o.browser.close().then(() => o.srv.close());
}

// opis pod sliko iz številk prizora
const dec = (x, n) => x.toFixed(n).replace('.', ','), cas = (t) => String(Math.abs(t)).replace('.', ',') + ' s';
const OPIS = {
  odstop: { cas: (f) => cas(f.t) + ' po odstopu',
    opis: (f) => (f.skoda >= 0.9995 ? 'izločeni avto je uničen (škoda 100 %)' : 'škoda izločenega avta ' + Math.round(f.skoda * 100) + ' %') + ' · ' + (f.stoji ? 'stoji ' : '')
      + (f.rob > 0 ? 'ob cesti, ' + dec(f.rob, 1) + ' m od roba asfalta' : 'na cesti, ' + dec(-f.rob, 1) + ' m do roba asfalta') + (f.stoji ? '' : ' · ' + Math.round(f.v * 3.6) + ' km/h') + ' · ' + Math.round(f.raz) + ' m od igralčevega avta' },
  kolo: { cas: (f) => cas(f.t) + (f.t < 0 ? ' pred zadetkom' : ' po zadetku'),
    opis: (f) => f.t < 0 ? 'avto ' + Math.round(f.vAvto) + ' km/h, kolesar ' + Math.round(f.vKolo * 3.6) + ' km/h'
      : f.miruje ? 'kolo obleži · zasukalo se je za ' + Math.round(Math.abs(f.zasuk)) + '°' : 'kolo zasukano za ' + Math.round(Math.abs(f.zasuk)) + '° · vrti se ' + dec(Math.abs(f.w) / (2 * Math.PI), 1) + ' obrata na sekundo' }
};

async function sestavi() {
  const dirs = [A.a, A.b].filter(Boolean).map(d => path.resolve(d)), js = dirs.map(d => JSON.parse(fs.readFileSync(path.join(d, 'prizor.json')))), lab = [A.la || 'ZDAJ', A.lb || 'POTEM'];
  const casi = list('casi', js[0].frames.map(f => f.t).join(',')), kb = num('kb', 300), sir = num('sirina', 640), iz = list('izrez', '0,0,1,1'), n = dirs.length, W = n * sir + (n - 1) * 6;
  const png = (dir, t) => fs.readFileSync(path.join(dir, 't' + t.toFixed(2) + '.png'));
  const p0 = png(dirs[0], casi[0]), pw = p0.readUInt32BE(16), ph = p0.readUInt32BE(20), iw = sir / (iz[2] - iz[0]), ih = iw * ph / pw, fh = Math.round(ih * (iz[3] - iz[1]));
  const celica = (i, t) => { const j = js[i], f = j.frames.find(x => Math.abs(x.t - t) < 1e-6), O = OPIS[j.prizor || 'odstop'];
    return `<div class="c"><div class="f"><img src="data:image/png;base64,${png(dirs[i], t).toString('base64')}"><span class="t">${f ? O.cas(f) : cas(t)}</span></div><div class="o">${f ? (f.opis || O.opis(f)) : ''}</div></div>`; };
  const vr = casi.map(t => `<div class="v">${dirs.map((d, i) => celica(i, t)).join('')}</div>`).join('');
  const html = `<style>body{margin:0;background:#111;font:600 20px system-ui,sans-serif;color:#fff}#k{width:${W}px;background:#111}.h{display:flex}.h div{width:${sir}px;box-sizing:border-box;padding:11px 12px 9px;font-size:25px;line-height:1.2}.h div+div{margin-left:6px}
    .n{padding:0 12px 11px;font-weight:400;font-size:18px;line-height:1.3;color:#ddd}.v{display:flex;margin-bottom:8px}.c{width:${sir}px;background:#1d1d1d}.c+.c{margin-left:6px}
    .f{position:relative;overflow:hidden;width:${sir}px;height:${fh}px}.f img{position:absolute;width:${iw}px;height:${ih}px;left:${-iz[0] * iw}px;top:${-iz[1] * ih}px}
    .t{position:absolute;left:8px;top:8px;line-height:1;background:rgba(0,0,0,.66);padding:6px 9px;border-radius:5px;font-size:22px}.o{padding:7px 12px 9px;font-weight:400;font-size:19px;line-height:1.3}.o:empty{display:none}</style>
    <div id="k"><div class="h">${dirs.map((d, i) => `<div>${lab[i]}</div>`).join('')}</div>${A.naslov ? `<div class="n">${A.naslov}</div>` : ''}${vr}</div>`;
  const browser = await launch(), ctx = await browser.newContext({ viewport: { width: W, height: 900 }, deviceScaleFactor: 1 }), page = await ctx.newPage();
  await page.setContent(html); await page.waitForFunction(() => [...document.images].every(i => i.complete && i.naturalWidth > 0));
  let buf = null, q = 86; for (; q >= 30; q -= 6) { buf = await page.locator('#k').screenshot({ type: 'jpeg', quality: q }); if (buf.length <= kb * 1024) break; }
  fs.mkdirSync(path.dirname(path.resolve(A.out)), { recursive: true }); fs.writeFileSync(path.resolve(A.out), buf);
  console.log(path.resolve(A.out) + ' ' + Math.round(buf.length / 1024) + ' KB, kakovost ' + q);
  await browser.close();
}

if (KAJ === 'odstop') await odstop();
else if (KAJ === 'kolo') await kolo();
else if (KAJ === 'sestavi') await sestavi();
else { console.error('prizor: odstop | kolo | sestavi'); process.exit(2); }
