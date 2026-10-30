// Orodje za napake · Datoteka s posnetkom (sklop 12 of docs/orodje-za-napake.md; js/napake.js rrpPisi / rrpOdpri, js/game.js rrpOf /
// rrpOpen): Bathurst at 25 s by the quick entry, a flag in the race. Nastavitve orodja · Posnetek dirke · Shrani: the recording downloaded
// as posnetek_bathurst_<LLLLMMDD-UUMM>.rrp (gzip, a fraction of the samples' raw size); read back the same samples to the last bit and the
// header (the track, the version, the cars, the flag). Not a recording: why, no replay. A fresh page (the title, no race): Odpri … opens
// the file into its replay: the same samples, the same cars, the flag in Zastavice, the tool's own scan, the report (naprava of the file,
// posnetek=<name>); pojdi: the replay at a time poses the cars as recorded, a picture of it; Končaj: the title; a flag just after the last
// sample still the file's own (Zastavice). tools/posnetek.mjs on the
// file: the summary, its JSON, a picture at a time.
//   node tests/browser/napake-posnetek.test.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { serve, launch, openGame, checker, REPO } from './lib.mjs';

const T = checker('napake-posnetek');
const srv = await serve();
const browser = await launch();
const OUT = path.join(REPO, 'test-results', 'napake-posnetek'); fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
// the digest of every sample's bits (as __game.recSum), of a recording in the page or of samples read
const SUM = `(F) => { let h = 2166136261; for (const f of F) { const u = new Uint32Array(f.buffer, f.byteOffset, f.length); for (let i = 0; i < u.length; i++) h = Math.imul(h ^ u[i], 16777619); } return (h >>> 0).toString(16); }`;
try {
  const { page: Q, errors } = await openGame(browser, srv.base + '/index.html?proga=bathurst&t=25', { quality: 'normal', shadows: 0, camera: 'chase' }, { width: 640, height: 360 }, { context: { acceptDownloads: true } });
  await Q.waitForFunction(() => window.__game.quick && window.__game.quick.done, null, { timeout: 240000, polling: 250 });
  await Q.evaluate(() => window.__game.resume()); await Q.waitForTimeout(400);
  await Q.keyboard.press('KeyF'); await Q.waitForTimeout(500);
  await Q.evaluate(() => window.__game.pause());
  const r0 = await Q.evaluate(() => ({ sum: window.__game.recSum(), flags: window.__game.recFlags, ver: (/[?&]v=(\w+)/.exec(document.querySelector('script[src^="js/game.js"]').getAttribute('src')) || [])[1],
    cars: window.__game.race.cars.map(c => c.name), pl: window.__game.race.cars.indexOf(window.__game.race.player) }));

  // 1. Shrani in the tool's settings: the download, its name, gzip, packed well
  await Q.evaluate(() => Napake.nastavitve());
  const dl0 = Q.waitForEvent('download', { timeout: 60000 });
  await Q.click('#nk-set [data-nk-d="rrp-shrani"]');
  const dl = await dl0, file = path.join(OUT, dl.suggestedFilename()); await dl.saveAs(file);
  const bytes = fs.readFileSync(file), last = await Q.evaluate(() => window.__game.lastRrp);
  T.check('Shrani: posnetek_bathurst_<LLLLMMDD-UUMM>.rrp in the downloads, gzip, packed to under half of the raw samples',
    /^posnetek_bathurst_\d{8}-\d{4}\.rrp$/.test(dl.suggestedFilename()) && bytes[0] === 0x1f && bytes[1] === 0x8b && last && last.bytes === bytes.length && bytes.length < last.raw / 2,
    JSON.stringify({ name: dl.suggestedFilename(), bytes: bytes.length, raw: last && last.raw, n: r0.sum.n }));
  console.log(`  (${r0.sum.n} samples of 22 cars: ${(bytes.length / 1024).toFixed(0)} KB, raw ${((last && last.raw) / 1024).toFixed(0)} KB; 3 min about ${(bytes.length * 3600 / r0.sum.n / 1048576).toFixed(2)} MB)`);

  // 2. read back in the page: the samples to the last bit, the header
  const b64 = bytes.toString('base64');
  const r1 = await Q.evaluate(async ([b64, SUM]) => {
    const sum = eval(SUM), blob = new Blob([Uint8Array.from(atob(b64), c => c.charCodeAt(0))]), { H, frames } = await Napake.rrp.beri(blob);
    return { sum: sum(frames), n: frames.length, track: H.track, ver: H.ver, mode: H.mode, wx: H.wx, w: H.w, nc: H.n, cars: H.cars.map(c => c.name), pl: H.cars.findIndex(c => c.pl), flags: H.flags, dev: H.dev, date: H.date, laps: H.laps, lap1: H.cars[0].lap };
  }, [b64, SUM]);
  T.check('read back: the same samples to the last bit (digest as __game.recSum), the header: Bathurst, the game\'s version, 22 cars as in the race, the player, the flag',
    r1.sum === r0.sum.h && r1.n === r0.sum.n && r1.track === 'bathurst' && r1.ver === r0.ver && r1.w === 7 && r1.nc === 22 && JSON.stringify(r1.cars) === JSON.stringify(r0.cars) && r1.pl === r0.pl &&
    r1.flags.length === 1 && Math.abs(r1.flags[0].t - r0.flags[0].t) < 1e-9 && /^race/.test(r1.mode) && /^suho/.test(r1.wx) && typeof r1.dev === 'string' && r1.date > 0,
    JSON.stringify({ r1: Object.assign({}, r1, { cars: r1.cars.length }), sum0: r0.sum, ver: r0.ver }));

  // 3. not a recording: why, and no replay
  const bad = await Q.evaluate(async () => {
    const a = await Napake.rrp.odpri(new Blob([new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9])]), 'x.rrp');
    const b = await Napake.rrp.odpri(new Blob([new Uint8Array([0x1f, 0x8b, 8, 0, 0, 0, 0, 0, 0, 3, 1, 2, 3])]), 'y.rrp');
    return { a, b, replay: !!window.__game.replay, race: window.__game.race.track.def.id };
  });
  T.check('not a recording ("to ni posnetek igre"), a broken gzip ("poškodovan"): no replay, the race left as it was', bad.a === 'to ni posnetek igre' && /poškodovan/.test(bad.b) && !bad.replay, JSON.stringify(bad));
  T.check('no errors on the page (the race)', errors.length === 0, errors.slice(0, 4).join(' | '));
  await Q.context().close();

  // 4. a fresh page: the title, no race; Odpri … with the file: its replay
  const { page: P, errors: e2 } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase' }, { width: 640, height: 360 });
  await P.waitForFunction(() => window.__game.screen === 'title', null, { timeout: 120000, polling: 250 });
  await P.evaluate(() => Napake.nastavitve());
  const sb = await P.evaluate(() => document.querySelector('#nk-set [data-nk-d="rrp-shrani"]').disabled);
  await P.setInputFiles('#nk-set .nk-rrp-in', file);
  await P.waitForFunction(() => window.__game.replay && window.__game.race && window.__game.race.track.def.id === 'bathurst', null, { timeout: 240000, polling: 250 });
  await P.waitForTimeout(500);
  const o1 = await P.evaluate(() => { const g = window.__game, el = (id) => document.getElementById(id);
    return { sum: g.recSum(), cars: g.race.cars.map(c => c.name), pl: g.race.cars.indexOf(g.race.player), set: !!el('nk-set'), ui: !el('replay-ui').classList.contains('off'), screen: g.screen,
      flags: el('rp-flags').textContent, info: el('rp-info').textContent, t0: g.replay.t0, t1: g.replay.t1, nflag: document.querySelectorAll('#rp-line .nk-flag').length }; });
  T.check('Shrani greyed with no race; Odpri …: the replay of the file on Bathurst (the panel closed, its controls), the same samples, the same cars and player, the flag on the timeline (Zastavice (1))',
    sb && o1.sum.h === r0.sum.h && o1.sum.n === r0.sum.n && JSON.stringify(o1.cars) === JSON.stringify(r0.cars) && o1.pl === r0.pl && !o1.set && o1.ui && o1.screen === 'none' && o1.flags === 'Zastavice (1)' && o1.nflag === 1 && /^Ti · /.test(o1.info),
    JSON.stringify(Object.assign({}, o1, { cars: o1.cars.length, sum0: r0.sum })));
  const rp1 = await P.evaluate(() => { const r = window.__game.rpPit; return r && { n: r.log.length, cur: r.cur }; });
  T.check('a replay opened from a file has no pit log (the file holds none): __game.rpPit an empty list, none posed, no error', !!rp1 && rp1.n === 0 && rp1.cur === null, JSON.stringify(rp1));
  await P.waitForFunction(() => Napake.iskanje.done, null, { timeout: 60000, polling: 200 });
  const rep = await P.evaluate(() => Napake.porocilo().split('\n'));
  T.check('the tool on it: the scan done; the report\'s first line of the file (proga=bathurst, naprava of the file, posnetek=<name>), the race\'s flag in it (⚑1 … K1)',
    /^RRA-NAPAKE v=\w+ proga=bathurst način=race/.test(rep[0]) && rep[0].includes(' posnetek=' + path.basename(file)) && rep.some(l => /^⚑1 \d\d:\d\d\.\d{3} K1 s=\d+m/.test(l)), rep.slice(0, 3).join(' | '));

  // 5. pojdi: the replay at a time, another car followed: posed as recorded; its picture
  const o2 = await P.evaluate(async () => {
    const g = window.__game, k = 5, t = 12.3; Napake.rrp.pojdi(t, k, 'tv');
    for (let i = 0; i < 4; i++) await new Promise(r => requestAnimationFrame(r));
    const c = g.race.cars[k], img = Napake.rrp.slika(400);
    return { t: g.replay.t, k: g.replay.k, cam: g.replay.cam, play: g.replay.play, x: c.x, z: c.z, img: img ? img.length : 0, png: !!img && img.startsWith('data:image/png') };
  });
  T.check('pojdi(12.3 s, tekmec#5, tv): the replay standing there, that car followed on the TV cameras; a picture of it (PNG)', Math.abs(o2.t - 12.3) < 1e-6 && o2.k === 5 && o2.cam === 'tv' && !o2.play && o2.png && o2.img > 5000 && Number.isFinite(o2.x), JSON.stringify(o2));
  await P.click('[data-act="rp-exit"]'); await P.waitForTimeout(600);
  const o3 = await P.evaluate(() => ({ screen: window.__game.screen, replay: !!window.__game.replay, race: !!window.__game.race }));
  T.check('Končaj: the title (no replay, no race)', o3.screen === 'title' && !o3.replay && !o3.race, JSON.stringify(o3));
  // a flag just after the recording's last sample (the race's clock goes on between samples, 1/20 s apart): the file's own, on its timeline.
  // The file written unpacked (Napake.rrp.pack, no gzip: read as well)
  const o4 = await P.evaluate(async (b64) => {
    const { H, frames } = await Napake.rrp.beri(new Blob([Uint8Array.from(atob(b64), c => c.charCodeAt(0))])), t1 = frames[frames.length - 1][0];
    H.flags = [{ t: 5 }, { t: t1 + 0.04 }];
    const why = await Napake.rrp.odpri(new Blob([Napake.rrp.pack(H, frames)]), 'ob-koncu.rrp');
    for (let i = 0; i < 600 && !window.__game.replay; i++) await new Promise(r => setTimeout(r, 100));
    await new Promise(r => setTimeout(r, 300));
    return { why, replay: !!window.__game.replay, flags: document.getElementById('rp-flags').textContent, nflag: document.querySelectorAll('#rp-line .nk-flag').length, tocke: Napake.tocke().map(p => +p.t.toFixed(3)), t1 };
  }, bytes.toString('base64'));
  T.check('a file whose flag is just after its last sample (and one at 5 s), unpacked: opened, both flags on its timeline (Zastavice (2))', o4.why === '' && o4.replay && o4.flags === 'Zastavice (2)' && o4.nflag === 2, JSON.stringify(o4));
  T.check('no errors on the page (the file opened)', e2.length === 0, e2.slice(0, 4).join(' | '));
  await P.context().close();

  // 6. tools/posnetek.mjs: the summary, its JSON, a picture at a time
  const tout = path.join(OUT, 'orodje');
  const res = await new Promise(r => execFile(process.execPath, [path.join(REPO, 'tools', 'posnetek.mjs'), file, '--t', '20', '--lezece', '--out', tout], { cwd: REPO, timeout: 600000 }, (err, so, se) => r({ code: err ? err.code || 1 : 0, out: so + se })));
  const js = fs.existsSync(path.join(tout, 'povzetek.json')) ? JSON.parse(fs.readFileSync(path.join(tout, 'povzetek.json'), 'utf8')) : null;
  const pics = fs.existsSync(tout) ? fs.readdirSync(tout).filter(f => f.endsWith('.png')) : [];
  T.check('tools/posnetek.mjs: the summary (Bathurst, 22 cars, the flag), povzetek.json with the report and the tool\'s own flags, a picture at 20 s',
    res.code === 0 && /bathurst/.test(res.out) && js && js.glava.track === 'bathurst' && js.glava.n === 22 && js.zastavice.length === 1 && Array.isArray(js.samodejne) && /^RRA-NAPAKE/.test(js.porocilo) && pics.some(f => /^20\.0s-ti-lezece\.png$/.test(f)),
    JSON.stringify({ code: res.code, pics, out: res.out.split('\n').slice(0, 12) }));
} catch (e) {
  T.check('the test ran through', false, e && e.stack ? e.stack.split('\n').slice(0, 4).join(' | ') : String(e));
}
T.done();
await browser.close(); await srv.close();
