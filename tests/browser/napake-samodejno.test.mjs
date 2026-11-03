// Orodje za napake · Dnevnik napak, prikaz za razvijalca, V krogu, samodejne zastavice (sklopi 9, 10 in 11 of docs/orodje-za-napake.md;
// js/napake.js): Bathurst at 25 s by the quick entry. Prikaz za razvijalca on the key O (and in the tool's settings): the frame counter
// with the draw calls and the vertices, the metres from the start and the lap, the theme and the graphics tier, the physics' LOD; O again:
// off. The log: an error and a promise let down in the race (the race's time, the track), a hitch (frames over 50 ms apart for over 1 s,
// made of the frame times given to Napake.okvir), not a short or a 25 fps one, not out of the race; kept in the game (tdgp-napake-dnevnik),
// in the report (D lines). V krogu: a loop round a rival and the road under it names them (tekmec#n, cesta:i0-i1), a loop round a named
// place of the track (kraj:<name>); in the report's line (v_krogu=[...]). The tool's own flags (zaznaj) of a recording made up on the real
// track: a car standing 7 s, a jump across, under the road, a jump up, a rival the wrong way; none in the pit lane, none at a rescue; the
// scan in two slices the same as in one. In the replay the log's hitch is a grey flag with !: its tap shows what it is, Potrdi puts it in
// Zastavice and in the report (!1 ... (samodejna zastavica)), Zavrzi takes one away.
//   node tests/browser/napake-samodejno.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('napake-samodejno');
const srv = await serve();
const browser = await launch();
// a loop (an ellipse round cx, cy, rx by ry) drawn with the mouse in colour c, its note typed, kept (Dodaj k zbirki)
async function moment(Q, c, cx, cy, rx, ry, note) {
  await Q.click('#nk-on'); await Q.click(`#nk-pal [data-c="${c}"]`);
  if (typeof cx === 'function') [cx, cy] = await cx();   // (the loop's middle found once Označi holds the picture: the replay stands from then on)
  await Q.mouse.move(cx + rx, cy); await Q.mouse.down(); for (let a = 0.2; a <= 2 * Math.PI + 0.25; a += 0.2) await Q.mouse.move(cx + rx * Math.cos(a), cy + ry * Math.sin(a)); await Q.mouse.up();
  if (note) await Q.keyboard.type(note);
  await Q.click('#nk-bar .nk-add'); await Q.waitForTimeout(300);
}
try {
  const { page: Q, errors } = await openGame(browser, srv.base + '/index.html?proga=bathurst&t=25', { quality: 'normal', shadows: 0, camera: 'chase' }, { width: 640, height: 360 });
  await Q.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: srv.base });
  await Q.waitForFunction(() => window.__game.quick && window.__game.quick.done, null, { timeout: 240000, polling: 250 });
  await Q.evaluate(() => window.__game.resume()); await Q.waitForTimeout(300);

  // 1. Prikaz za razvijalca: O on (its lines within 2 s: the counter writes once a second), kept in the tool's settings; O again: off
  await Q.keyboard.press('KeyO');
  const d1 = await Q.waitForFunction(() => { const e = document.getElementById('ph-fps'); return e && /klici/.test(e.textContent) && e.textContent; }, null, { timeout: 30000, polling: 200 }).then(h => h.jsonValue(), () => null);
  const n1 = await Q.evaluate(() => JSON.parse(localStorage.getItem('tdgp-napake') || '{}').dev);
  const L1 = (d1 || '').split('\n');
  T.check('Prikaz za razvijalca (O): the frame counter with the draw calls and vertices, s and the lap, the theme and the graphics tier, the physics\' LOD (22 cars: off); kept (tdgp-napake dev 1)',
    L1.length === 6 && /^\d+ fps {2}worst \d+ ms$/.test(L1[0]) && /^klici [1-9]\d* {2}oglišča [1-9]\d*k$/.test(L1[2]) && /^s \d+ m {2}krog 1\/\d+$/.test(L1[3]) && /^tema bathurst {2}podrobnosti (NIZKA|SREDNJA|VISOKA)/.test(L1[4]) && L1[5] === 'fizika LOD ne · 22 avtov' && n1 === 1, JSON.stringify({ d1, n1 }));
  const k0 = await Q.evaluate(() => window.__game.race.time);
  await Q.keyboard.press('KeyO'); await Q.waitForFunction(() => !document.getElementById('ph-fps'), null, { timeout: 20000, polling: 100 }).catch(() => { });
  const d2 = await Q.evaluate(() => ({ el: !!document.getElementById('ph-fps'), dev: JSON.parse(localStorage.getItem('tdgp-napake')).dev, paused: window.__game.paused }));
  T.check('O again: the counter gone (dev 0); the race not paused by O, its clock on', !d2.el && d2.dev === 0 && !d2.paused && (await Q.evaluate(() => window.__game.race.time)) > k0, JSON.stringify(d2));

  // 2. the log: an error and a promise let down in the race; a hitch of the frame times given (1.5 s at 10 a second), not a short one,
  // not at 25 fps, not out of the race
  // (the error in the game's own code: Napake.zaznaj with nothing to scan, from a timer; its place js/napake.js:line:col, no ?v=)
  await Q.evaluate(() => { setTimeout(Napake.zaznaj, 0); Promise.reject(new Error('preizkus obljube')); });
  await Q.waitForTimeout(600);
  const hz = await Q.evaluate(() => {
    Napake.okvir(1e7, false);   // (the frame times from here on its own: whatever the game's frames were doing is over)
    const n0 = Napake.dnevnik.length, run = (t0, dt, n, on) => { let t = t0; for (let i = 0; i < n; i++) { t += dt; Napake.okvir(t, on); } return t; };
    // (all at once, no frame of the game between: 1.5 s of 100 ms frames, then 400 ms of 16 ms frames; 0.8 s slow; 1.5 s at 25 fps; 1.5 s slow out of the race)
    let t = run(1e7, 16, 3, true); t = run(t, 100, 15, true); t = run(t, 16, 25, true);   // (the game's next frame after these: an earlier time, no hitch)
    t = run(t, 100, 8, true); t = run(t, 16, 25, true);
    t = run(t, 40, 38, true); t = run(t, 16, 25, true);
    t = run(t, 100, 15, false); run(t, 16, 25, false);
    return Napake.dnevnik.slice(n0);
  });
  const lg = await Q.evaluate(() => Napake.dnevnik), er = lg.find(e => e.kind === 'napaka' && /reading 'frames'/.test(e.msg)), pr = lg.find(e => e.kind === 'obljuba' && /preizkus obljube/.test(e.msg));
  T.check('the log: the error (its message, js/... :line:col, the race\'s time, Bathurst, in this race) and the promise let down',
    !!er && /^js\/napake\.js:\d+:\d+$/.test(er.src) && er.t > 20 && er.track === 'bathurst' && er.lap === 1 && er.tukaj && !!pr && pr.track === 'bathurst', JSON.stringify({ er, pr }));
  T.check('a hitch of 1.5 s at 10 frames a second (the race\'s time, the slowest frame 100 ms); none for 0.8 s slow, none at 25 fps, none out of the race',
    hz.length === 1 && hz[0].kind === 'zatik' && Math.abs(hz[0].ms - 1500) <= 100 && hz[0].fps >= 9 && hz[0].fps <= 11 && hz[0].worst === 100 && hz[0].t > 20 && hz[0].tukaj, JSON.stringify(hz));
  const saved = await Q.evaluate(() => JSON.parse(localStorage.getItem('tdgp-napake-dnevnik')));
  T.check('kept in the game (tdgp-napake-dnevnik), the last 50 at most', Array.isArray(saved) && saved.length <= 50 && saved.some(e => /reading 'frames'/.test(e.msg)) && saved.some(e => e.kind === 'zatik' && e.worst === 100), String(saved && saved.length));

  // 3. Posnetek do sem, the tool's own flags: the hitch a grey flag with !, its tap: what it is; Potrdi: in Zastavice
  await Q.evaluate(() => window.__game.pause()); await Q.click('#pause-rp'); await Q.waitForTimeout(400);
  await Q.waitForFunction(() => Napake.iskanje.done, null, { timeout: 60000, polling: 200 });
  const a0 = await Q.evaluate(() => ({ l: Napake.samodejne, el: [...document.querySelectorAll('#rp-line .nk-auto')].map(e => e.textContent), z: document.getElementById('rp-flags').textContent, nf: document.querySelectorAll('#rp-line .nk-flag').length }));
  const hit = a0.l.findIndex(f => f.kind === 'zatik' && Math.abs(f.val - hz[0].ms) < 1);
  T.check('the replay: the log\'s hitch a grey flag with ! on the timeline (not a flag of Zastavice: "Zastavice (0)", no .nk-flag)', hit >= 0 && a0.el.length === a0.l.length && a0.el.every(t => t === '!') && a0.z === 'Zastavice (0)' && a0.nf === 0, JSON.stringify(a0));
  await Q.evaluate((j) => document.querySelectorAll('#rp-line .nk-auto')[j].dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })), hit); await Q.waitForTimeout(200);
  const a1 = await Q.evaluate(() => ({ auto: Napake.stanje.auto, t: window.__game.replay.t, play: window.__game.replay.play }));
  T.check('its tap: the replay there, standing; "! Zatikanje · 00:2x.x · ti · 1,5 s pod 20 sličic/s ..." with Potrdi and Zavrzi', Math.abs(a1.t - a0.l[hit].t) < 0.11 && !a1.play && /^! Zatikanje/.test(a1.auto) && /ti/.test(a1.auto) && /1,5 s pod 20 sličic\/s/.test(a1.auto) && /Potrdi/.test(a1.auto) && /Zavrzi/.test(a1.auto), JSON.stringify(a1));
  await Q.click('#nk-auto [data-a="ok"]'); await Q.waitForTimeout(200);
  const a2 = await Q.evaluate(() => ({ l: Napake.samodejne, z: document.getElementById('rp-flags').textContent, tocke: Napake.tocke(), ok: document.querySelectorAll('#rp-line .nk-auto.ok').length, dlg: !!document.getElementById('nk-auto') }));
  T.check('Potrdi: confirmed (white on the timeline), in Zastavice ("Zastavice (1)", a point of the tool\'s own), the box gone', a2.l[hit].st === 'ok' && a2.z === 'Zastavice (1)' && a2.tocke.length === 1 && a2.tocke[0].kind === 'samo' && a2.ok === 1 && !a2.dlg, JSON.stringify(a2));

  // 4. V krogu: a loop round a rival on the screen (and the road under it), one round a named place of the track
  const scr = await Q.evaluate(() => {
    const cam = Render.camera, v = new THREE.Vector3(), W = innerWidth, H = innerHeight, g = window.__game, P = g.replay, T = g.race.track, cars = g.race.cars;
    const on = (x, y, z) => { v.set(x, y, z).project(cam); return v.z > -1 && v.z < 1 && Math.abs(v.x) < 0.75 && Math.abs(v.y) < 0.6 ? [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H] : null; };
    let car = null; cars.forEach((c, k) => { if (c.isPlayer || car) return; const p = on(c.x, (c.y || 0) + 0.7, c.z); if (p && Math.hypot(c.x - cars.find(q => q.isPlayer).x, c.z - cars.find(q => q.isPlayer).z) < 60) car = { k, p }; });
    let place = null; for (const q of T.names) { const i = T.idx(T.startS + q.d), p = on(T.px[i], T.hy[i] + 1.1, T.pz[i]); if (p) { place = { n: q.n, p }; break; } }
    return { car, place, t: P.t };
  });
  if (!scr.car) {   // (no rival near on the screen at this moment: the replay a few seconds back, where the field is closer together)
    T.check('a rival on the screen for the loop', false, JSON.stringify(scr));
  } else {
    await moment(Q, 3, scr.car.p[0], scr.car.p[1], 26, 18, 'Tekmec');
    const z1 = await Q.evaluate(() => Napake.stanje.zbirka[0]);
    const want = 'tekmec#' + scr.car.k;
    T.check(`V krogu: the loop round a rival names it (${want}) and the road under it (cesta:i0-i1, i0 <= i1)`, z1.v.length === 1 && z1.v[0].includes(want) && z1.v[0].some(n => /^cesta:\d+-\d+$/.test(n) && +n.split(/[:-]/)[1] <= +n.split(/[:-]/)[2]), JSON.stringify(z1.v));
  }
  // (a named place on the screen: the replay where the player's car is 15-30 m before Zavoj 1, found along the timeline; the quick
  // entry's race is the same every time)
  if (!scr.place) scr.place = await Q.evaluate(async () => {
    const g = window.__game, T = g.race.track, L = document.getElementById('rp-line'), r = L.getBoundingClientRect(), P = g.race.player, q1 = T.names[0];
    const at = (f) => { const o = { clientX: r.left + f * r.width, clientY: r.top + r.height / 2, pointerId: 7, bubbles: true }; L.dispatchEvent(new PointerEvent('pointerdown', o)); L.dispatchEvent(new PointerEvent('pointerup', o)); };
    const sOf = () => (((P.q.s - T.startS) % T.len) + T.len) % T.len;
    const frame = () => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));   // (the cars posed at the time in the replay's next frame)
    let hit = -1; for (let f = 0.3; f <= 0.8 && hit < 0; f += 0.01) { at(f); await frame(); const s = sOf(); if (s > q1.d - 32 && s < q1.d - 12) hit = f; }
    if (hit < 0) return null;
    for (let k = 0; k < 4; k++) await frame(); await new Promise(res => setTimeout(res, 500));   // (the camera settled)
    const v = new THREE.Vector3(), i = T.idx(T.startS + q1.d); v.set(T.px[i], T.hy[i] + 0.6, T.pz[i]).project(Render.camera);
    return v.z > -1 && v.z < 1 && Math.abs(v.x) < 0.8 && Math.abs(v.y) < 0.8 ? { n: q1.n, p: [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight], f: hit } : null;
  });
  if (scr.place) {
    // (the place on the screen again in the picture Označi holds, at the road's height as G.inLoops takes it: the replay went on playing
    // after the search, more or less far on a slower machine)
    const at = () => Q.evaluate((n) => { const T = window.__game.race.track, q = T.names.find(x => x.n === n), i = T.idx(T.startS + q.d), v = new THREE.Vector3(T.px[i], T.hy[i] + 0.1, T.pz[i]).project(Render.camera);
      return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]; }, scr.place.n);
    await moment(Q, 0, at, null, 30, 22, '');
    const z2 = await Q.evaluate(() => Napake.stanje.zbirka[Napake.stanje.zbirka.length - 1]);
    T.check(`V krogu: a loop round a named place of the track: kraj:${scr.place.n}`, z2.v[0].includes('kraj:' + scr.place.n), JSON.stringify({ v: z2.v, place: scr.place }));
  } else T.check('a named place of Bathurst (Zavoj 1) on the screen for the loop', false, JSON.stringify(scr));

  // 5. the report: the note's v_krogu, the confirmed flag (!1), the log (D lines: the error, the hitch)
  const txt = await Q.evaluate(() => Napake.porocilo()), L = txt.split('\n');
  const l1 = L.find(l => /^#1 .* modra »Tekmec« v_krogu=\[.*\]$/.test(l)), l2 = L.find(l => /^!1 00:\d\d\.\d{3} K1 s=\d+m zatik ti »1,5 s pod 20 sličic\/s \(\d+,\d sličic\/s\)« \(samodejna zastavica\)$/.test(l));
  const l3 = L.find(l => /^D 00:\d\d\.\d K1 s=\d+m napaka »[^«]*reading 'frames'[^«]*« js\/napake\.js:\d+:\d+$/.test(l)), l4 = L.find(l => /^D 00:\d\d\.\d K1 s=\d+m zatik 1,5 s · \d+,\d sličic\/s · najdaljša 100 ms$/.test(l)), l5 = L.find(l => /^D .*obljuba »Error: preizkus obljube«/.test(l));
  T.check('the report: the note with v_krogu=[...], the confirmed flag (!1 ... zatik ti »...« (samodejna zastavica)), the log (D: the error with its place, the promise, the hitch)', !!(l1 && l2 && l3 && l4 && l5), txt);
  // Zavrzi: another of the tool's own away (a flag found by the scan, or the confirmed one)
  const before = await Q.evaluate(() => Napake.samodejne.length);
  await Q.evaluate(() => document.querySelector('#rp-line .nk-auto').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))); await Q.waitForTimeout(150);
  await Q.click('#nk-auto [data-a="ne"]'); await Q.waitForTimeout(150);
  const after = await Q.evaluate(() => ({ n: Napake.samodejne.length, el: document.querySelectorAll('#rp-line .nk-auto').length }));
  T.check('Zavrzi: one of the tool\'s own flags away (from the timeline too)', after.n === before - 1 && after.el === after.n, JSON.stringify({ before, after }));

  // 6. zaznaj: a recording made up on the real track (2 cars, 20 samples a second): car 0 drives, stands 7 s, jumps 15 m across, drives,
  // goes 2 m under the road for 0.5 s, 4 m up for a sample, is put back on the road 200 m on (a rescue: bit 2); car 1 (a rival) goes the
  // wrong way 4 s, then stands 12 s in the pit lane (bit 4), then 4 s on the road
  const zz = await Q.evaluate(() => {
    const T = window.__game.race.track, W = 7, dt = 0.05, frames = [], eo = {};
    const at = (s) => { const f = ((s / T.ds) % T.N + T.N) % T.N, i = Math.floor(f), j = (i + 1) % T.N, u = f - i; return [T.px[i] + (T.px[j] - T.px[i]) * u, T.pz[i] + (T.pz[j] - T.pz[i]) * u, T.elevAt(s, eo).y]; };
    let s0 = 400, s1 = 1600;
    for (let k = 0; k <= 400; k++) {
      const t = k * dt, f = new Float32Array(1 + 3 * W); f[0] = t;
      let v0 = 20, dy = 0, b0 = 0;
      if (t >= 2 && t < 9) v0 = 0;
      if (k === 180) s0 += 15;   // (9 s: 15 m across in one sample)
      if (t >= 12 && t < 12.5) dy = -2;
      if (k === 260) dy = 4;   // (13 s: 4 m up for one sample)
      if (k === 300) { s0 += 200; b0 = 2; }   // (15 s: put back 200 m on)
      s0 += v0 * dt; const p0 = at(s0); f[1] = p0[0]; f[2] = p0[2] + dy; f[3] = p0[1]; f[5] = v0; f[7] = b0;
      let v1 = 15, b1 = 0;
      if (t < 4) s1 -= v1 * dt; else { v1 = 0; b1 = t < 16 ? 4 : 0; }
      const p1 = at(s1); f[1 + W] = p1[0]; f[2 + W] = p1[2]; f[3 + W] = p1[1]; f[5 + W] = v1; f[7 + W] = b1;
      frames.push(f);
    }
    const R = { frames, n: 2, cars: [{ isPlayer: true }, { isPlayer: false }] };
    const one = Napake.zaznaj(R, T, W, { id: 0 }, [], 0, frames.length), S = { id: 0 }, two = [];
    Napake.zaznaj(R, T, W, S, two, 0, 137); Napake.zaznaj(R, T, W, S, two, 137, frames.length);
    const sum = (l) => l.map(f => f.kind + '/' + f.k + '@' + f.t.toFixed(2) + ':' + f.val.toFixed(1)).sort().join(' ');
    return { one: sum(one), two: sum(two), l: one.map(f => ({ kind: f.kind, k: f.k, t: f.t, val: f.val, opis: f.opis })) };
  });
  const by = (kind, k) => zz.l.filter(f => f.kind === kind && f.k === k);
  const st = by('obtical', 0), pj = by('preskok', 0), pd = by('pod_cesto', 0), up = by('poskok', 0), nz = by('nazaj', 1);
  T.check('zaznaj: car 0 stands 7 s (at 2 s), jumps 15 m across (at 9 s), 2 m under the road (at 12 s), 4 m up (at 13 s); the rival the wrong way 4 s (from 0 s); nothing else (no flag in the pit lane, none at the rescue)',
    zz.l.length === 5 && st.length === 1 && Math.abs(st[0].t - 2) < 0.06 && Math.abs(st[0].val - 7) < 0.1 && st[0].opis === 'stoji 7,0 s' &&
    pj.length === 1 && Math.abs(pj[0].t - 8.95) < 0.06 && pj[0].val > 14 && pj[0].val < 18 && pd.length === 1 && Math.abs(pd[0].t - 12) < 0.06 && Math.abs(pd[0].val - 2) < 0.3 &&
    up.length === 1 && Math.abs(up[0].t - 12.95) < 0.06 && nz.length === 1 && Math.abs(nz[0].val - 4) < 0.15, JSON.stringify(zz.l));
  T.check('zaznaj in two slices: the same flags as in one', zz.one === zz.two, JSON.stringify({ one: zz.one, two: zz.two }));

  // 7. the tool's settings: Prikaz za razvijalca on there; the log (Dnevnik napak) with its notes, Kopiraj, Počisti
  await Q.evaluate(() => { window.__game.onAction('rp-race'); }); await Q.waitForFunction(() => !window.__game.replay, null, { timeout: 30000, polling: 100 });
  await Q.evaluate(() => { window.__game.pause(); window.__game.onAction('to-settings'); }); await Q.click('#nk-set-open'); await Q.waitForTimeout(200);
  const s1 = await Q.evaluate(() => ({ n: document.querySelector('#nk-set .nk-dn-n').textContent, dn: document.querySelector('#nk-set .nk-dn').textContent }));
  await Q.click('#nk-set [data-k="dev"] [data-v="1"]');
  await Q.click('#nk-set [data-nk-d="dn-kop"]'); await Q.waitForTimeout(200);
  const clip = await Q.evaluate(() => navigator.clipboard.readText().catch(() => ''));
  await Q.click('#nk-set [data-nk-d="dn-del"]');
  const s2 = await Q.evaluate(() => ({ n: document.querySelector('#nk-set .nk-dn-n').textContent, saved: JSON.parse(localStorage.getItem('tdgp-napake-dnevnik')), dev: Napake.nast.dev }));
  T.check('Nastavitve orodja: the log with its notes (the newest first), Kopiraj (the D lines), Počisti (empty, kept so); Prikaz za razvijalca Vklop',
    /^\(\d+\)$/.test(s1.n) && /napaka »[^«]*reading 'frames'/.test(s1.dn) && /^D /.test(clip) && /reading 'frames'/.test(clip) && s2.n === '(0)' && s2.saved.length === 0 && s2.dev === 1, JSON.stringify({ s1, clip: clip.slice(0, 200), s2 }));
  await Q.click('#nk-set [data-nk-d="zapri"]');
  const own = errors.filter(e => !/preizkus obljube|reading 'frames'/.test(e));
  T.check('no page errors (but the two made for the log)', own.length === 0, own.slice(0, 5).join(' | '));
  await Q.context().close();
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
