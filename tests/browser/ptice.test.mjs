// The kind of bird over a track by its country (the def's ptice in the track's file, BIRD_KIND in js/render.js; the sources in docs/ptice.md): the common crane's wedge
// over Nürburg and Kågeröd (a V with the lead at its point, every bird beating), the black vulture's circling over Aguascalientes (a few on
// flat wings round a slow middle, black, white by the wingtips); a track without a kind (Medvode) and a frozen one keep the plain flock;
// all in the one draw call, within the 16 birds.
//   node tests/browser/ptice.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const WANT = { nring: 'wedge', kagerod: 'wedge', aguascalientes: 'soar', medvode: null, jezero: null };
const T = checker('the kind of bird by the country');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', detail: 'high', shadows: 1, camera: 'chase' }, { width: 640, height: 360 }, { seed: 7 });
  for (const id of Object.keys(WANT)) {
    await page.goto(srv.base + '/index.html?proga=' + id + '&t=0.5', { timeout: 300000 });
    await page.waitForFunction(() => window.__game && window.__game.quick && window.__game.quick.done, null, { timeout: 300000 });
    const r = await page.evaluate(() => {
      const B = Render.birdsInfo(), c = Render.camera.position; let i = 0;
      const fresh = () => Render.birdsInfo().flocks.findIndex(f => f.on && f.dur < 0.15);   // (a flock that has just come: it stays for the next seconds)
      let at = -1; while ((at = fresh()) < 0 && i++ < 40000) B.step(0.1, c.x, c.z);   // (rare over a circuit)
      if (at < 0) return { kind: B.kind, none: true };
      const a = Render.birdsInfo().flocks[at];
      for (let k = 0; k < 50; k++) B.step(0.1, c.x, c.z);
      const I = Render.birdsInfo(), b = I.flocks[at];
      const tips = []; for (let v = 0; v < I.drawn; v++) tips.push(I.col(v * 3).reduce((s, x) => s + x, 0) / 3);
      return { kind: B.kind, n: a.m.length, total: I.flocks.reduce((s, f) => s + (f.on ? f.m.length : 0), 0), drawn: I.drawn, m0: a.m, m1: b.m, moved: Math.hypot(b.x - a.x, b.z - a.z), dark: Math.min(...tips), light: Math.max(...tips) };
    });
    const want = WANT[id];
    T.check(`${id}: the kind is ${want}`, r.kind === want, JSON.stringify(r.kind));
    if (r.none) { T.check(`${id}: a flock comes`, false); continue; }
    T.check(`${id}: all the birds in the air within the 16, drawn in the one mesh`, r.total <= 16 && r.drawn === r.total * 66, `${r.total} birds, ${r.drawn} vertices`);
    if (want === 'wedge') {
      const lead = r.m0[0], rest = r.m0.slice(1), L = rest.filter(m => m.sd < 0).length, R = rest.filter(m => m.sd > 0).length;
      T.check(`${id}: a wedge of 9-16, the lead at its point, the two arms as long but for one`, r.n >= 9 && r.n <= 16 && lead.fw === 0 && lead.sd === 0 && rest.every(m => m.fw < -1) && Math.abs(L - R) <= 1, `${r.n}: ${L} left, ${R} right`);
      T.check(`${id}: each bird further back is further out (a V)`, rest.every(m => Math.abs(Math.abs(m.sd) / -m.fw - 0.75) < 0.2), JSON.stringify(rest.map(m => [+m.fw.toFixed(1), +m.sd.toFixed(1)])));
      T.check(`${id}: every bird beats all the way (none glides)`, r.m1.every(m => m.fl > 0));
    } else if (want === 'soar') {
      T.check(`${id}: 3-7 birds, each on its own circle (7-19 m), all turning the same way`, r.n >= 3 && r.n <= 7 && r.m0.every(m => m.r >= 7 && m.r <= 19 && m.dir === r.m0[0].dir), JSON.stringify(r.m0.map(m => +m.r.toFixed(1))));
      T.check(`${id}: they go round (the angle moves), the thermal drifts slowly (under 4 m/s)`, r.m1.every((m, k) => Math.abs(m.a - r.m0[k].a) > 0.5) && r.moved / 5 < 4, `${(r.moved / 5).toFixed(1)} m/s`);
      T.check(`${id}: black with white by the wingtips`, r.dark < 0.1 && r.light > 0.8, `${r.dark.toFixed(2)} ${r.light.toFixed(2)}`);
    } else T.check(`${id}: the plain flock of 4-7`, r.n >= 4 && r.n <= 7 && r.m0.every(m => m.r === undefined), String(r.n));
  }
  T.check('no errors on the page', !errors.length, errors.join(' | '));
} finally { await browser.close(); srv.close(); }
T.done();
