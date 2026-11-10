// The big screen by the main grandstand (Grafika 03, js/world-zaslon.js; Render's zaslonFeed), at the phone's size on its side (844x390):
//  - every real circuit with pits has its place (World.zaslon.SPOT, or zaslon in the track's file), no other track (the test tracks and
//    the roads: no screen built; nor the US tracks, Detroit and Monterey with pits, going to test, the user's decision 5. 11. 2026)
//  - Bathurst, VISOKA: the live picture, drawn into its own small target (512 x 256) from a TV post beside the track, only while the screen
//    is in the view (the car 40 m before it: pictures; 1.5 km away: none); the screen's face shows that target; the picture is not empty
//    (the track and the cars, LIVE's red dot over it); what one picture costs (its draws, under PIC_CALLS); the TV director by the straight
//    (World.zaslon.prep: a post for every 20 m, the posts checked with the world) made while the world was built (no hitch in the race)
//  - the battery saver: the still instead (the face shows the standings), live again without it
//  - a new world (Vršič, a road without pits): no screen there, the last one's target freed
//  - Spa, NIZKA (the phone budget): the still only (no target made, no picture drawn), drawn again when the order changes
//  - no names: every word written on the screen (the still's and the live picture's graphics) is a number, laps (3/12) or LIVE
//   node tests/browser/zaslon.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('the big screen by the main grandstand: live at VISOKA, the standings without names otherwise');
const PIC_CALLS = 260;   // (the live picture's draws at most: a narrow TV lens on the track, measured ~85 on Bathurst)
const srv = await serve();
const browser = await launch();
// every word written on the screen's canvases (fillText on a canvas World.zaslon marks __zs), kept per page
const init = () => { const f = CanvasRenderingContext2D.prototype.fillText; window.__zsTxt = new Set(); CanvasRenderingContext2D.prototype.fillText = function (t, ...a) { if (this.canvas && this.canvas.__zs) window.__zsTxt.add(String(t)); return f.call(this, t, ...a); }; };
const quick = async (page, id) => { await page.goto(srv.base + '/index.html?proga=' + id + '&t=3', { timeout: 300000 }); await page.waitForFunction(() => window.__game && window.__game.quick && window.__game.quick.done, null, { timeout: 300000 }); };
// in the page: the car on the ideal line `back` metres before the screen, still; n frames of the race's view
const helpers = () => {
  window.__zsPut = (back) => { const g = window.__game, R = g.race, T = R.track, P = R.player, Z = Render.world.dyn.zaslon, s = Z.s - back, i = T.idx(((s % T.len) + T.len) % T.len), off = T.rl ? T.rl[i] : 0;
    P.place(T.px[i] + T.nx[i] * off, T.pz[i] + T.nz[i] * off, T.hd[i]); if (T.hasElev) P.y = P.py = T.hy[i]; P.q = T.query(P.x, P.z, i, P.q); P.sPrev = P.q.s; P.vx = P.vz = 0;
    for (let k = 0; k < 24; k++) { for (const c of R.cars) { c.vx = 0; c.vz = 0; c.w = 0; } P.inThr = 0; P.inBrk = 1; R.step(1 / 120); } Render.resetCam(); };
  window.__zsRun = async (n) => { const P = window.__game.race.player; for (let k = 0; k < n; k++) { Render.frame(1 / 30, 1, P, 'chase', {}); await new Promise(r => requestAnimationFrame(r)); } };
};
const words = (set) => [...set].filter(w => !/^(\d{1,3}|\d{1,3}\/\d{1,3}|LIVE)$/.test(w));
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', detail: 'high', shadows: 1, camera: 'chase', weather: 'dry', tod: 'day' }, { width: 844, height: 390 }, { seed: 303, init });
  const ZDA = ['baldy', 'beartooth', 'bigsur', 'detroit', 'maunakea', 'moki', 'monterey', 'mulholland', 'palomar', 'riverside', 'uncompahgre'];   // (the US tracks: going to test; a place left on a test track is harmless, the builder skips them)
  const pl = await page.evaluate((ZDA) => { const S = World.zaslon.SPOT, pit = Core.TRACKS.filter(d => d.pit && !d.test && !ZDA.includes(d.id)).map(d => d.id);   // (a place in the list or the track's own, zaslon in its file)
    const has = Object.keys(S).concat(Core.TRACKS.filter(d => d.zaslon).map(d => d.id));
    return { missing: pit.filter(id => !has.includes(id)), extra: has.filter(id => !pit.includes(id) && !Core.TRACKS.some(d => d.id === id && d.test)), n: pit.length }; }, ZDA);
  T.check(`every real circuit with pits has the screen's place (${pl.n}), not the US tracks (going to test: Detroit, Monterey), no other track`, !pl.missing.length && !pl.extra.length,
    JSON.stringify(pl) + (pl.missing.length ? ' (a new track with pits: zaslon: { d, side, off } in its file, node tools/zaslon-mesto.mjs <id> finds the place)' : ''));

  // Bathurst at VISOKA: live while in the view
  await quick(page, 'bathurst'); await page.evaluate(helpers);
  const live = await page.evaluate(async () => {
    const g = window.__game; g.pause(); const Z = Render.world.dyn.zaslon; if (!Z) return { none: true };
    const C = g.race.track._tv, ks = Z.dir ? [...new Set(Z.dir)] : [], prep = { dir: Z.dir, ms: Z.info.prepMs, ok: !!C && ks.length > 0 && ks.every(k => C[k] && C[k].ok), feeds: Z.info.feeds };
    window.__zsPut(40); await window.__zsRun(12);
    const r = { prep, live: Z.live, rt: !!Z.rt, map: !!Z.rt && Z.face.material.map === Z.rt.texture, feeds: Z.info.feeds, group: !!Render.world.root.getObjectByName('zaslon'), calls: Z.info.calls, tris: Z.info.tris };
    if (Z.rt && Z.ren) {   // the picture: many colours (not one cleared colour), LIVE's red dot where the graphics put it (the canvas's top row is the target's last)
      const W = 512, H = 256, b = new Uint8Array(W * H * 4); Z.ren.readRenderTargetPixels(Z.rt, 0, 0, W, H, b);
      const cols = new Set(); for (let i = 0; i < b.length; i += 4 * 37) cols.add((b[i] >> 4) * 256 + (b[i + 1] >> 4) * 16 + (b[i + 2] >> 4));
      const at = (x, y) => { const i = ((H - 1 - y) * W + x) * 4; return [b[i], b[i + 1], b[i + 2]]; }, red = at(W - 94, 29);
      r.cols = cols.size; r.red = red[0] > 150 && red[1] < 90 && red[2] < 90;
    }
    const f0 = Z.info.feeds; window.__zsPut(1500); await window.__zsRun(10); r.far = Z.info.feeds - f0;
    const f1 = Z.info.feeds; window.__zsPut(40); await window.__zsRun(6); r.back = Z.info.feeds - f1;
    // the battery saver: the still; without it live again
    Render.setSaver(true); await window.__zsRun(4); r.saver = { live: Z.live, still: Z.face.material.map === Z.still }; const f2 = Z.info.feeds; await window.__zsRun(6); r.saver.feeds = Z.info.feeds - f2;
    Render.setSaver(false); await window.__zsRun(4); r.saver.again = Z.live && Z.face.material.map === Z.rt.texture;
    // freed with the next world: the target's dispose
    const d = Z.rt.dispose.bind(Z.rt); window.__zsFreed = false; Z.rt.dispose = () => { window.__zsFreed = true; d(); };
    return r;
  });
  T.check('Bathurst, VISOKA: the screen built (its group in the world), live: its own target, the face showing it, pictures drawn while it is in the view',
    !live.none && live.group && live.live && live.rt && live.map && live.feeds > 0, JSON.stringify(live));
  T.check('Bathurst, VISOKA: the TV director by the straight (a post for every 20 m, checked with the world) made when the world was built, not in the race', !live.none && live.prep.dir && live.prep.dir.length === 22 && live.prep.ok, JSON.stringify(live.prep));
  T.check('Bathurst, VISOKA: the live picture not empty (many colours) and LIVE\'s red dot over it', live.cols >= 24 && live.red, JSON.stringify({ cols: live.cols, red: live.red }));
  T.check(`Bathurst, VISOKA: one live picture costs at most ${PIC_CALLS} draws`, live.calls > 0 && live.calls <= PIC_CALLS, JSON.stringify({ calls: live.calls, tris: live.tris }));
  T.check('Bathurst, VISOKA: no picture drawn while the screen is out of the view (the car 1.5 km away), again once it is back in it', live.far === 0 && live.back > 0, JSON.stringify({ far: live.far, back: live.back }));
  T.check('the battery saver: the still on the face, no pictures drawn; live again without it', live.saver && !live.saver.live && live.saver.still && live.saver.feeds === 0 && live.saver.again, JSON.stringify(live.saver));

  // a new world in the same page (Vršič: no pits): no screen, the last one's target freed
  await startTrack(page, 'vrsic');
  const nx = await page.evaluate(() => ({ none: !Render.world.dyn.zaslon && !Render.world.root.getObjectByName('zaslon'), freed: window.__zsFreed, txt: [...window.__zsTxt] }));
  T.check('a road without pits (Vršič): no screen; the last world\'s screen freed (its target)', nx.none && nx.freed, JSON.stringify({ none: nx.none, freed: nx.freed }));
  const bad1 = words(new Set(nx.txt));
  T.check('no names on the screen: every word written (the still, the live picture\'s graphics) a number, laps or LIVE', nx.txt.length > 0 && !bad1.length, JSON.stringify({ n: nx.txt.length, bad: bad1.slice(0, 8) }));
  T.check('no page errors (VISOKA)', !errors.length, errors.slice(0, 5).join(' | '));

  // Spa at NIZKA: the still only
  const o2 = await openGame(browser, srv.base + '/index.html', { quality: 'normal', detail: 'low', shadows: 1, camera: 'chase', weather: 'dry', tod: 'day' }, { width: 844, height: 390 }, { seed: 304, init });
  await quick(o2.page, 'spa'); await o2.page.evaluate(helpers);
  const low = await o2.page.evaluate(async () => {
    const g = window.__game, R = g.race; g.pause(); const Z = Render.world.dyn.zaslon; if (!Z) return { none: true };
    window.__zsPut(40); await window.__zsRun(10);
    const r = { live: Z.live, rt: !!Z.rt, still: Z.face.material.map === Z.still, feeds: Z.info.feeds, v0: Z.still.version };
    // the order changes (the last car to the front): the standings drawn again within half a second
    const O = R.order, c = O.splice(O.length - 1, 1)[0]; O.unshift(c); await window.__zsRun(20); r.redrawn = Z.still.version > r.v0;
    r.txt = [...window.__zsTxt];
    return r;
  });
  T.check('Spa, NIZKA: the still only (no target made, no picture drawn), the face showing the standings', !low.none && !low.live && !low.rt && low.still && low.feeds === 0, JSON.stringify(Object.assign({}, low, { txt: undefined })));
  T.check('Spa, NIZKA: the standings drawn again when the order changes', !low.none && low.redrawn, JSON.stringify({ redrawn: low.redrawn }));
  const bad2 = words(new Set(low.txt || []));
  T.check('Spa, NIZKA: no names on the still', !bad2.length && (low.txt || []).length > 0, JSON.stringify({ bad: bad2.slice(0, 8) }));
  T.check('no page errors (NIZKA)', !o2.errors.length, o2.errors.slice(0, 5).join(' | '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
