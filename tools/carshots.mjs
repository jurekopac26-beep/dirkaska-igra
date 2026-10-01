// Vehicle check sheets: pictures of a registered vehicle for authoring and review (the render kit, js/cars/<id>.js). Per vehicle, in
// test-results/carshots/<id>/:
//   side, front, rear, top   near-orthographic views (fov 4 degrees from 70 m) with a 1 m grid, the target box from the def's header
//                            (L x H, W in front / rear / top; yellow) and the wheel centres (cyan crosses, where the physics has the hubs)
//   34f, 34r                 the showroom's three-quarter views, front and rear (a fixed angle, the turntable under the car)
//   chase                    a race on Jezero, paused, the chase camera at zoom 1.2 (as a phone sees the car)
//   chase-wreck, wreck-34(r) the car stopped and battered (the field held still): the front zone gone (bonnet, bumper ...), the left side
//                            torn off (door, fender, quarter, mirror), the right side and the rear hanging loose (doors ajar, the boot lid open,
//                            the rear bumper's end down), the front left wheel off (the body down on that corner), three lamps and two panes
//                            broken, the roof half crushed, its pieces lying round it: from the chase camera, from the front left and from
//                            the rear right (the other cars hidden)
//   chase-total              then Core.wreckCar: everything off
//   cockpit                  the driver's view (the car intact)
//   cut                      the three-quarter view with the bonnet, the right door and the tailgate taken off (the lining, the floor, the cabin)
//   sheet.png                all of them on one picture (at most 1600 px wide: one Read call), with the measured size against the header's
// Category mode: --cat <category> puts every vehicle of that category side by side (each one's three-quarter view over its side view at the
// same scale) into test-results/carshots/_cat-<category>.png, to judge that they look distinct.
//   node tools/carshots.mjs raketa [titan …]        (--color 0x2f6fd6: the paint; --no-race: only the showroom views)
//   node tools/carshots.mjs --cat mali
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { serve, launch, openGame, startTrack } from '../tests/browser/lib.mjs';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), flag = (k) => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : null; };
const cat = flag('--cat'), color = parseInt(flag('--color') || '0xc0392b'), noRace = args.includes('--no-race'), ids = args.filter(a => !a.startsWith('--'));
if (!cat && !ids.length) { console.log('usage: node tools/carshots.mjs <id …> | --cat <category>  [--color 0xRRGGBB] [--no-race]'); process.exit(2); }
const OUT = path.join(ROOT, 'test-results', 'carshots');

// the def file's header numbers: L W H (m), the wheelbase, the overhangs (else the physics' len / wid and the part table's ht)
function header(id) {
  const f = path.join(ROOT, 'js', 'cars', id + '.js'), t = fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('*/')[0] : '';
  const num = (re) => { const m = re.exec(t); return m ? +m[1] : null; };
  return { L: num(/\bL\s+([\d.]+)/), W: num(/\bW\s+([\d.]+)/), H: num(/\bH\s+([\d.]+)/), wb: num(/wheelbase\s+([\d.]+)/), oF: num(/overhangs?\s+F\s+([\d.]+)/), oR: num(/overhangs?[^R]*R\s+([\d.]+)/) };
}
const png = (file, dataUrl) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64')); };

const srv = await serve(ROOT);
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1, camera: 'chase', zoom: 1.2, damage: 2, weather: 'dry' }, { width: 960, height: 540 }, { seed: 11 });
  const warns = []; page.on('console', m => { if (m.type() === 'warning') warns.push(m.text()); });
  await page.evaluate(async () => { const g = window.__game; g.onAction('to-car'); await new Promise(r => setTimeout(r, 400)); });   // (the showroom exists)
  const shot = (o) => page.evaluate((o) => { const c = Render.carShot(o); return c ? c.toDataURL('image/png') : null; }, o);
  // a sheet: the pictures in a grid (cols across), a title line over it, each tile labelled
  const sheet = (tiles, cols, tw, th, title) => page.evaluate(async ({ tiles, cols, tw, th, title }) => {
    const rows = Math.ceil(tiles.length / cols), c = document.createElement('canvas'); c.width = cols * tw; c.height = rows * (th + 18) + 26;
    const x = c.getContext('2d'); x.fillStyle = '#0d1117'; x.fillRect(0, 0, c.width, c.height); x.fillStyle = '#e8eef4'; x.font = 'bold 15px sans-serif'; x.fillText(title, 8, 18);
    for (let i = 0; i < tiles.length; i++) {
      if (!tiles[i]) continue;   // (a blank cell)
      const im = new Image(); await new Promise(r => { im.onload = r; im.src = tiles[i].src; });
      const cx = (i % cols) * tw, cy = 26 + Math.floor(i / cols) * (th + 18);
      x.drawImage(im, cx, cy + 18, tw, th); x.fillStyle = '#9fb3c8'; x.font = '12px sans-serif'; x.fillText(tiles[i].label, cx + 4, cy + 13);
    }
    return c.toDataURL('image/png');
  }, { tiles, cols, tw, th, title });

  if (cat) {
    const list = await page.evaluate((cat) => Core.MODELS.filter(m => m.cat === cat && !m.retired).map(m => ({ id: m.id, name: m.name, len: m.len })), cat);
    if (!list.length) throw new Error('no vehicle in category ' + cat);
    const span = Math.max(...list.map(m => m.len)) * 0.62 + 0.5, tiles = [];
    for (const m of list) {
      const H = header(m.id), box = H.L ? [H.L, H.W, H.H] : null;
      tiles.push({ src: await shot({ id: m.id, color, view: '34f', w: 520, h: 300 }), label: m.name + ' (' + m.id + ')' });
      tiles.push({ src: await shot({ id: m.id, color, view: 'side', w: 520, h: 300, box, span }), label: 'side, same scale' });
    }
    const cols = Math.min(4, list.length), per = [];   // (each vehicle a column: its three-quarter view over its side view; blank cells after the last)
    for (let r = 0; r < Math.ceil(list.length / cols); r++) { for (let c = 0; c < cols; c++) per.push(tiles[(r * cols + c) * 2] || null); for (let c = 0; c < cols; c++) per.push(tiles[(r * cols + c) * 2 + 1] || null); }
    const out = path.join(OUT, '_cat-' + cat + '.png');
    png(out, await sheet(per, cols, Math.floor(1600 / cols), Math.floor(1600 / cols * 300 / 520), 'category ' + cat + ': ' + list.map(m => m.name).join(', ')));
    console.log('wrote ' + path.relative(ROOT, out));
  }

  for (const id of ids) {
    const H = header(id), box = H.L ? [H.L, H.W, H.H] : null, dir = path.join(OUT, id), tiles = [];
    const info = await page.evaluate((id) => Render.kitInfo(id), id);
    if (!info) { console.log(id + ': not a registered (kit) vehicle'); continue; }
    for (const v of ['side', 'front', 'rear', 'top', '34f', '34r']) {
      const src = await shot({ id, color, view: v, w: 960, h: 540, box }); png(path.join(dir, v + '.png'), src); tiles.push({ src, label: v });
    }
    {   // the inside: the bonnet, the right door and the tailgate (whichever it has) taken off, the inner block drawn (the lining, floor, seats, engine)
      const cut = ['hood', 'doorR', 'trunk', 'cover', 'tailgate'].filter(n => info.ranges[n]), src = await shot({ id, color, view: '34f', w: 960, h: 540, cut });
      png(path.join(dir, 'cut.png'), src); tiles.push({ src, label: 'cut (' + cut.join(', ') + ' off: the inside)' });
    }
    if (!noRace) {
      await page.evaluate((id) => { const g = window.__game; g.S.car = Core.MODELS.findIndex(m => m.id === id); g.S.camera = 'chase'; }, id);
      await startTrack(page, 'jezero');
      const race = await page.evaluate(async () => {
        const g = window.__game, raf = () => new Promise(r => requestAnimationFrame(r)), P = g.race.player;
        g.pause(); for (let k = 0; k < 12 && (g.race.state !== 'racing' || g.race.time < 5); k++) { g.sim(1, true); await raf(); }
        for (let k = 0; k < 8; k++) { g.resume(); await raf(); g.pause(); }   // (a few frames: the chase camera settles behind the car)
        const snap = (mode, inset) => {   // (the chase views: the whole frame as a phone sees it, the car magnified x2.5 in the top right corner)
          const c = Render.snapshot(P, mode, 960); if (!inset) return c.toDataURL('image/png');
          const p = new THREE.Vector3(P.x, (P.y || 0) + 0.6, P.z).project(Render.camera), cx = (p.x * 0.5 + 0.5) * c.width, cy = (0.5 - p.y * 0.5) * c.height, w = c.width * 0.16, h = w * 9 / 16;
          const o = document.createElement('canvas'); o.width = c.width; o.height = c.height; const x = o.getContext('2d'); x.drawImage(c, 0, 0);
          x.drawImage(c, cx - w / 2, cy - h / 2, w, h, c.width - w * 2.5 - 6, 6, w * 2.5, h * 2.5); x.strokeStyle = '#ffd640'; x.lineWidth = 2; x.strokeRect(c.width - w * 2.5 - 6, 6, w * 2.5, h * 2.5); x.strokeRect(cx - w / 2, cy - h / 2, w, h);
          return o.toDataURL('image/png'); };
        const chase = snap('chase', true);
        g.S.camera = 'cockpit'; for (let k = 0; k < 4; k++) { g.resume(); await raf(); g.pause(); } const cockpit = snap('cockpit'); g.S.camera = 'chase';
        for (let k = 0; k < 4; k++) { g.resume(); await raf(); g.pause(); }
        // the staged wreck: the car stopped where it is, the rest of the field held still (no one runs into it), its state set by zone: what
        // the zone's damage knocks off (dz >= th) off, what it loosens (dz >= 0.6 th) hanging loose; the front left wheel off
        const R = g.race, PT = Core.partsOf(P.m), hl = P.m.len / 2, hw = P.m.wid / 2, still = (sec) => { for (let i = 0; i < sec * 120; i++) {
          for (const c of R.cars) { c.vx = 0; c.vz = 0; c.w = 0; } P.inThr = 0; P.inBrk = 1; P.inSteer = 0; R.step(1 / 120); } };
        // a close look from a corner (o: the corner, front / back and left / right): the other cars hidden
        const look = (fs, rs) => { const ch = Math.cos(P.h), sh = Math.sin(P.h), at = (f, r, y) => [P.x + ch * f - sh * r, (P.y || 0) + y, P.z + sh * f + ch * r];
          const k = Math.max(0.55, Math.min(1, P.m.len / 4)), cp = at(fs * (hl + 3.2 * k), rs * (hw + 3.2 * k), (1.9 + P.m.len * 0.12) * k), ct = at(fs * 0.2, 0, 0.55 * k), hid = R.cars.filter(c => c !== P).map(c => Render.viewOf(c)).filter(v => v && v.grp.visible);   // (a small vehicle from closer)
          for (const v of hid) v.grp.visible = false;
          Render.setShot({ px: cp[0], py: cp[1], pz: cp[2], tx: ct[0], ty: ct[1], tz: ct[2], fov: 38 + 4 * (P.m.len > 5 ? 1 : 0), fogD: 90, near: 0.3 });
          const u = Render.snapshot(P, 'chase', 960).toDataURL('image/png'); Render.setShot(null); for (const v of hid) v.grp.visible = true; return u; };
        P.vx = 0; P.vz = 0; P.w = 0; still(0.5);
        for (const [x, z] of [[0.9, -1], [0.5, -1], [-0.2, -1], [-0.7, -1], [-1, 0.4], [-1, -0.5], [0.3, 1], [-0.5, 1], [1, 0.3]]) Core.applyDamage(P, 0.02, x * hl, z * hw);   // (dents and scrapes where it was hit)
        P.dmg = 0.86; P.dz = [1, 0.48, 0.8, 0.5]; P.cd = [1, 0.3, 0.5, 0.4]; P.lightOut = [1, 0, 1, 1]; P.winOut = [1, 0, 1, 0]; P.roofDmg = 0.5;
        for (const n in PT) if (!P.lost[n] && (PT[n].wh != null ? PT[n].wh === 0 : P.dz[PT[n].z] >= PT[n].th)) Core.detachPart(P, n, PT[n]);
        still(1.6); for (let k = 0; k < 90; k++) Render.frame(1 / 60, 1, P, 'chase', {});   // (1.5 s drawn: the burst of bits and sparks over, the smoke there)
        const wreck = snap('chase', true), w34 = look(1, -1), w34r = look(-1, 1);
        const staged = { dmg: P.dmg, lost: Object.keys(P.lost).length, ajar: Object.keys(Render.viewOf(P).kit ? Render.viewOf(P).kit.ajar : {}).filter(n => !P.lost[n]).length };
        Core.wreckCar(P); still(1.5); for (let k = 0; k < 90; k++) Render.frame(1 / 60, 1, P, 'chase', {});
        const total = snap('chase', true);
        return { chase, cockpit, wreck, w34, w34r, total, staged, dmg: P.dmg, lost: Object.keys(P.lost).length };
      });
      for (const [k, v] of [['chase', race.chase], ['chase-wreck', race.wreck], ['wreck-34', race.w34], ['wreck-34r', race.w34r], ['chase-total', race.total], ['cockpit', race.cockpit]]) {
        png(path.join(dir, k + '.png'), v);
        tiles.push({ src: v, label: k + (k === 'chase-wreck' ? ` (${race.staged.lost} parts off, ${race.staged.ajar} loose)` : k === 'chase-total' ? ' (dmg ' + race.dmg.toFixed(2) + ', ' + race.lost + ' parts off)' : '') }); }
      await page.evaluate(async () => { const g = window.__game; g.resume(); g.onAction('to-title'); await new Promise(r => setTimeout(r, 300)); g.onAction('to-car'); await new Promise(r => setTimeout(r, 400)); });
    }
    const bb = info.bbox, mL = bb.max[0] - bb.min[0], mW = bb.max[2] - bb.min[2], mH = bb.max[1];
    const title = `${id}: ${info.status} | body L ${mL.toFixed(2)} W ${mW.toFixed(2)} H ${mH.toFixed(2)} (header ${H.L} x ${H.W} x ${H.H}) | outer ${info.tris.outer} / ${info.budget.outer} tris, inner ${info.tris.inner} / ${info.budget.inner}, wheels ${info.wheels.style} ${info.wheels.hi.join('/')} | ${info.wheels.lo.join('/')}`;
    const out = path.join(dir, 'sheet.png');
    png(out, await sheet(tiles, 4, 400, 225, title));
    console.log('wrote ' + path.relative(ROOT, dir) + '/{' + tiles.map(t => t.label.split(' ')[0]).join(',') + ',sheet}.png  — ' + title);
  }
  const bad = errors.concat(warns.filter(w => !/generic kit hatch: fallback:look null/.test(w)));
  if (bad.length) { console.log('page errors / warnings:'); for (const e of bad.slice(0, 10)) console.log('  ' + e); process.exitCode = 1; }
} finally {
  await browser.close(); await srv.close();
}
