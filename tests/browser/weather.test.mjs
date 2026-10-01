// Sector times, the set-up, tyres and a changing weather in the game (the Red Bull Ring, the player on autopilot): the track screen's
// set-up rows (wing and gears, kept per track, given to the race) and the "Menljivo" weather; a race where the rain starts at 20 s: the
// message, the hint to come in for rain tyres, the tyres on the HUD (red: the wrong ones), a pit stop for rain tyres (the message, the new
// set on the HUD); the sector times on the HUD (S1-S3); a race where the rain stops: the message, the drying road and the dry racing line.
//   node tests/browser/weather.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('sectors, set-up, tyres and a changing weather');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase', track: 'rbring', weather: 'dry' }, { width: 390, height: 844 }, { seed: 7 });   // (seeded: the rivals race the same way every run, no random knock on the way to the pits)
  const act = (a) => page.evaluate((a) => window.__game.onAction(a), a);
  const hud = () => page.evaluate(() => { const r = window.__game.race, P = r.player, el = (id) => document.getElementById(id);
    return { rain: r.rain, water: r.water, line: r.lineWater, ty: P.ty && { k: P.ty.k, wear: P.ty.wear }, pit: P.pitState, inPit: P.inPit, lap: P.lap,
      msg: el('h-msg').textContent, msgOn: el('h-msg').classList.contains('show'), toast: el('toast').textContent, tyre: el('h-tyre').className + ':' + el('h-tyre').textContent,
      sec: [...el('h-sec').children].map(i => i.className + ':' + i.textContent), setup: P.setup }; });
  // step the race (paused, on autopilot), then let two frames draw the HUD (it is updated only while the race runs) and pause again
  const sim = (t) => page.evaluate((t) => new Promise(res => { const g = window.__game; g.pause(); g.sim(t, true); g.resume();
    requestAnimationFrame(() => requestAnimationFrame(() => { g.pause(); res(); })); }), t);
  // on until the race clock (from the lights) reads t: however long the intro before the lights is (the Red Bull Ring's jets fly over first)
  const simTo = async (t) => { for (let k = 0; k < 40; k++) { const r = await page.evaluate(() => { const R = window.__game.race; return R.state === 'racing' ? R.time : -1; }); if (r >= t) return; await sim(Math.min(3, r < 0 ? 3 : t - r + 0.02)); } };

  // 1. the track screen: the set-up per track, the changing weather
  await act('to-track'); await page.waitForTimeout(300);
  const ui = await page.evaluate(() => {
    const seg = (k) => [...document.querySelectorAll(`[data-set="${k}"] button`)].map(b => b.textContent + (b.classList.contains('sel') ? '*' : '')).join(',');
    const before = { wing: seg('wing'), gear: seg('gear'), weather: seg('weather') };
    document.querySelector('[data-set="wing"] button[data-v="0"]').click(); document.querySelector('[data-set="gear"] button[data-v="2"]').click();
    return { before, after: { wing: seg('wing'), gear: seg('gear') }, S: JSON.stringify(window.__game.S.setup), toast: document.getElementById('toast').textContent }; });
  T.check('track screen: wing and gears (standard at first), "Menljivo" weather; a choice is kept for the chosen track',
    ui.before.wing === 'Malo,Srednje*,Veliko' && ui.before.gear === 'Kratke,Srednje*,Dolge' && /Menljivo/.test(ui.before.weather) && ui.after.wing === 'Malo*,Srednje,Veliko' && ui.after.gear === 'Kratke,Srednje,Dolge*'
    && ui.S === '{"rbring":{"wing":0,"gear":2}}' && /Štajerska, Avstrija: malo krila, dolge prestave/.test(ui.toast), JSON.stringify(ui));

  // 2. a race where the rain starts at 20 s (dry, slicks at the start)
  await page.evaluate(() => { window.__game.wxNext = { rain: 0, wx: { at: 20, dur: 15, to: 1 } }; });
  await startTrack(page, 'rbring');
  await sim(0.05);   // (two frames drawn: the HUD)
  const h0 = await hud();
  T.check('the race: the set-up of the track on the car, slicks, the tyres on the HUD', h0.setup.wing === 0 && h0.setup.gear === 2 && h0.ty.k === 'dry' && /^on dry c[SMH]:(MEHKE|SREDNJE|TRDE) 100%$/.test(h0.tyre) && h0.sec.join() === ':S1,:S2,:S3', JSON.stringify(h0));
  await simTo(22);
  const h1 = await hud();
  T.check('the rain starts: "DEŽ", the hint to come in for rain tyres', h1.rain > 0 && h1.msg === 'DEŽ' && h1.msgOn && /dežne gume/.test(h1.toast), JSON.stringify(h1));
  await page.evaluate(() => { window.__game.race.player.pitWant = true; });   // (the autopilot takes the pit lane next time by)
  let h2 = null, hb = null;
  for (let k = 0; k < 90; k++) { await sim(2); h2 = await hud(); if (!hb && h2.ty.k === 'dry' && h2.water > 0.4) hb = h2; if (h2.ty.k === 'wet') break; }   // (up to 3 min: the car comes round to the pit lane, a knock on slicks in the wet may add a repair first)
  const h2b = await hud();
  T.check('slicks on a wet road: red on the HUD (the wrong tyres) until the stop', !!hb && /^on dry c[SMH] bad:(MEHKE|SREDNJE|TRDE) \d+%$/.test(hb.tyre), JSON.stringify(hb));
  await sim(0.6); const h3 = await hud();
  T.check('pit stop: rain tyres fitted ("DEŽNE GUME"), new on the HUD', h2.ty.k === 'wet' && /DEŽNE GUME/.test(h2.msg) && /^on wet:DEŽNE (100|99)%$/.test(h3.tyre), JSON.stringify({ h2, h3 }));
  T.check('sector times on the HUD: S1 with a time', /^(ob|pb|sl):S1 \d+\.\d+$/.test(h2b.sec[0]), h2b.sec.join(' | '));
  await page.evaluate(() => window.__game.resume());

  // 3. a race where the rain stops: the road dries, the racing line first (the dry line drawn)
  await act('to-title'); await page.waitForTimeout(200);
  await page.evaluate(() => { window.__game.wxNext = { rain: 1, wx: { at: 8, dur: 6, to: 0 } }; });
  await startTrack(page, 'rbring');
  const d0 = await hud();
  await simTo(21); const d1 = await hud();
  await sim(60); const d2 = await hud();
  const line = await page.evaluate(() => { let m = null; Render.scene.traverse(o => { if (o.isMesh && o.renderOrder === 1 && o.geometry.attributes.color && o.geometry.attributes.color.itemSize === 4) m = o; }); return m && { vis: m.visible, op: +m.material.opacity.toFixed(2) }; });
  T.check('the rain stops: rain tyres at the start, "DEŽ JE PONEHAL", the road still wet', d0.ty.k === 'wet' && d0.rain === 1 && d1.rain === 0 && d1.msg === 'DEŽ JE PONEHAL' && d1.water > 0.8, JSON.stringify({ d0: d0.ty, d1 }));
  T.check('the road dries, the racing line first: the dry line drawn along it', d2.line < d2.water - 0.1 && line && line.vis && line.op > 0.3, JSON.stringify({ water: d2.water, line: d2.line, mesh: line }));
  await page.evaluate(() => window.__game.resume());

  T.check('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
