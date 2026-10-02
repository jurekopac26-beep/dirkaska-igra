// The run from the police on Vršič as the player sees it (a phone held sideways, then upright):
// 1. the police radio small, top right above the map (the map pushed down for it, the radio never over the clock), in plain letters; its
//    speakers by their call signs: the patrol cars by their numbers (Enota 1, Enota 2 ..., said so too), never by a place; what is said in
//    person at the checkpoint (the officer) at the bottom;
// 2. a patrol car out, and every other message of the run (a spike strip ahead, the helicopter ...): a small note top right over the radio,
//    in plain letters (not the big message over the road; only the end of the run is big);
// 3. a spike strip on a steep bit of the road, laid between two of the road's samples: on the asphalt (not under it), tilted with the
//    grade, 1 m wide along the road, its links red and white;
// 4. at speed (the chase camera, quality 'high'): the picture streaks, the patrol cars on the player's tail stay sharp;
// 5. held upright: the radio under the clock and the stars, the map under it.
//   node tests/browser/police2.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('the run from the police: the radio top right, the in-person talk at the bottom, the call signs, the note, the spike strips, sharp patrol cars');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1, camera: 'chase', weather: 'dry', season: 'summer', tod: 'day' }, { width: 800, height: 360 });
  const frame = () => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  const box = (sel) => page.evaluate((sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
    return { l: Math.round(r.left), r: Math.round(r.right), t: Math.round(r.top), b: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height), font: parseFloat(cs.fontSize), tt: cs.textTransform, shown: e.className.includes('show') && cs.display !== 'none', txt: e.textContent, lbl: e.firstElementChild ? e.firstElementChild.textContent : '' }; }, sel);
  // (real time: the radio's lines take their time; up to ms for one on screen)
  const waitShown = async (sel, ms) => { for (let t = 0; t < ms; t += 150) { const b = await box(sel); if (b && b.shown) return b; await page.waitForTimeout(150); } return box(sel); };

  // the run from the police, to the checkpoint and through it on autopilot (it does not stop: the officer shouts, in person)
  const pre = await page.evaluate(async () => {
    const g = window.__game, wait = (ms) => new Promise(r => setTimeout(r, ms)), frame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    g.onAction('to-title'); await wait(250); g.onAction('to-track'); await wait(300);
    document.querySelector('[data-track="vrsic"] .tc-mode button[data-v="police"]').click(); await wait(200);
    g.onAction('start'); for (let k = 0; k < 1200 && !(g.race && g.race.pol); k++) await wait(100);
    const pol = g.race.pol, rect = (id) => { const r = document.getElementById(id).getBoundingClientRect(); return { t: Math.round(r.top), b: Math.round(r.bottom), l: Math.round(r.left), r: Math.round(r.right) }; };
    let talk = null, lastS = -1e9;
    for (let i = 0; i < 90 && (pol.stage !== 'chase' || !talk) && !(i > 75); i++) {
      const P = g.race.player, Tk = g.race.track;
      if (i % 6 === 5) { if (pol.stage !== 'chase' && P.q.s - lastS < 10) { const j = Tk.idx(P.q.s + 30); P.place(Tk.px[j], Tk.pz[j], Tk.hd[j]); P.y = P.py = P.roadY = Tk.hy[j]; P.vx = P.vz = 0; P.q = Tk.query(P.x, P.z, j, P.q); P.sPrev = P.q.s; } lastS = P.q.s; }   // (the autopilot held up in the traffic, or in the queue at the checkpoint: on past it)
      g.sim(1, true); await frame();
      const el = document.getElementById('h-talk'); if (!talk && el.className.includes('show')) talk = Object.assign(rect('h-talk'), { txt: el.textContent });
    }
    pol.D = Object.assign({}, pol.D, { bust: 1e9 });   // (this run is about what is drawn and said: not caught)
    return { stage: pol.stage, talk, map: rect('h-map'), H: innerHeight, s: Math.round(g.race.player.q.s - g.race.track.startS), chk: pol.chk && pol.chk.st, phase: g.phase };
  });
  T.check('the chase is on (the autopilot drove through the checkpoint)', pre.stage === 'chase', JSON.stringify({ stage: pre.stage, s: pre.s, chk: pre.chk, phase: pre.phase }));
  let talk = pre.talk;
  if (!talk) {   // (the shout came and went between two looks: the officer asks for the papers, in person)
    await page.evaluate(() => { const g = window.__game, P = g.race.player; g.race.pol._event('chkDocs', P.x, P.z, null, P.q.s); g.sim(0.05, true); });
    const b = await waitShown('#h-talk', 4000); if (b && b.shown) talk = b;
  }
  T.check('in person (the officer at the checkpoint): at the bottom of the screen, the radio top right hidden meanwhile',
    !!talk && /^POLICIST /.test(talk.txt) && talk.t > pre.H * 0.6, JSON.stringify(talk));

  // the radio in the chase: top right above the map, small, never over the clock
  await page.evaluate(() => { const g = window.__game; for (let i = 0; i < 6; i++) g.sim(1, true); });
  const rad = await waitShown('#h-radio', 15000), map = await box('#h-map'), clock = await box('#h-time'), talk2 = await box('#h-talk');
  T.check('the police radio: top right just above the map (its right edge on the map\'s), on the screen, right of the clock',
    rad.shown && rad.b <= map.t + 1 && map.t - rad.b < 12 && Math.abs(rad.r - map.r) <= 2 && rad.t >= 0 && rad.l >= clock.r && !talk2.shown, JSON.stringify({ rad, map, clock: [clock.l, clock.r] }));
  T.check('the map pushed down for it, the radio small and in plain letters', map.t >= 50 && rad.font <= 12 && rad.tt === 'none' && /[a-zčšž]/.test(rad.txt.slice(rad.lbl.length)), `map top ${map.t}, font ${rad.font}px "${rad.txt}"`);

  // the call signs: the patrol cars by their numbers, said so too; no unit by a place
  await page.evaluate(() => { const g = window.__game; for (let i = 0; i < 20; i++) g.sim(1, true); });
  for (let t = 0; t < 8000; t += 400) { if ((await page.evaluate(() => window.__game.radio.log.filter(e => /^Enota /.test(e.who)).length)) >= 2) break; await page.waitForTimeout(400); }
  const log = await page.evaluate(() => window.__game.radio.log.map(e => ({ who: e.who, cs: e.cs, txt: e.txt })));
  const units = log.filter(e => /^Enota /.test(e.who));
  T.check('the units on the radio: Enota 1, Enota 2 ... (written and said), none called by a place (Kranjska Gora 1, KG-1)',
    units.length >= 1 && units.every(e => /^Enota \d+$/.test(e.who) && e.cs === e.who) && !log.some(e => /Kranjska Gora \d|KG-\d/.test(e.who + ' ' + (e.cs || '') + ' ' + e.txt)),
    JSON.stringify(log.slice(0, 6).map(e => e.who + ': ' + e.txt)));

  // a patrol car out: the small note top right over the radio, not the big message over the road
  const wr = await page.evaluate(() => { const g = window.__game, pol = g.race.pol, P = g.race.player, c = pol.cars.find(c => c.pol.mode === 'chase' && !c.locked) || pol._car(P.q.s - 40, 0, 0, 'chase', 0); c.dmg = 1; g.sim(0.2, true); return c.pol.mode; });   // (none in the chase just now: one joins)
  const note = await waitShown('#h-pnote', 2000), msg = await box('#h-msg'), map2 = await box('#h-map');
  T.check('a patrol car out: "Patrulja je izločena!" small, top right above the map; nothing over the road',
    wr === 'out' && note.shown && note.txt === 'Patrulja je izločena!' && note.font <= 12 && note.b <= map2.t + 1 && note.t >= 0 && Math.abs(note.r - map2.r) <= 2 && !(msg.shown && /izločena/i.test(msg.txt)),
    JSON.stringify({ wr, note, msg: msg.shown ? msg.txt : '' }));

  // the other messages of the run as well: small, top right in plain letters, nothing over the road (only the end of the run is big)
  const msgs = await page.evaluate(() => {
    const g = window.__game, pol = g.race.pol, P = g.race.player, out = [], map = document.getElementById('h-map').getBoundingClientRect();
    g.pause();
    for (const k of ['spikes', 'heli', 'ambush', 'lost']) {
      pol._event(k, P.x, P.z, null, P.q.s + 150); g.sim(0.05, true);
      const n = document.getElementById('h-pnote'), r = n.getBoundingClientRect(), m = document.getElementById('h-msg');
      out.push({ k, txt: n.className.includes('show') ? n.textContent : '', font: parseFloat(getComputedStyle(n).fontSize), top: r.bottom <= map.top + 1 && r.top >= 0 && Math.abs(r.right - map.right) <= 2, big: m.className.includes('show') ? m.textContent : '' });
    }
    g.resume(); return out;
  });
  T.check('the other messages of the run (a spike strip, the helicopter, an ambush, lost) small top right in plain letters, nothing over the road',
    msgs.map(m => m.txt).join('|') === 'Bodičasti trak!|Helikopter!|Zaseda!|Izgubili so sled!' && msgs.every(m => m.font <= 12 && m.top && !m.big), JSON.stringify(msgs));

  // a spike strip on a steep bit of the road (over 10 %), between two of its samples (from the sample before it the road is ~20 cm higher there)
  const sp = await page.evaluate(async () => {
    const g = window.__game, R = g.race, Tk = R.track, P = R.player, pol = R.pol, frame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    for (const q of pol.spikes) { q.on = false; q.gone = true; }
    let s = 0; for (let x = P.q.s + 300; x < Tk.finishS - 800 && !s; x += 0.25) { const e = Tk.elevAt(x), f = x / Tk.ds - Math.floor(x / Tk.ds); if (e.grade > 0.1 && f > 0.85 && f < 0.95) s = x; }
    pol._spike(s); pol.spikes[pol.spikes.length - 1].on = true;
    const i = Tk.idx(s - 14); P.place(Tk.px[i], Tk.pz[i], Tk.hd[i]); P.y = P.py = P.roadY = Tk.hy[i]; P.vx = P.vz = 0; P.q = Tk.query(P.x, P.z, i, P.q); P.sPrev = P.q.s;
    for (let k = 0; k < 4; k++) await frame();
    return { s: Math.round(s), under: +(Tk.elevAt(s).y - Tk.hy[Tk.idx(s)]).toFixed(3), strip: Render.roadInfo().strip };
  });
  const st = sp.strip || {};
  T.check('a spike strip on a steep bit: on the asphalt where it lies (not under it), tilted with the grade, 1 m wide along the road, its spikes up, red and white links',
    sp.under > 0.15 && st.lift > 0.005 && st.lift < 0.03 && Math.abs(st.tilt - st.grade) < 0.01 && st.wide >= 0.95 && st.high >= 0.2 && st.red > 0.05 && st.white > 0.05, JSON.stringify(sp));

  // at speed: the picture streaks, the patrol cars on the player's tail stay sharp
  const blur = await page.evaluate(() => {
    const g = window.__game, R = g.race, Tk = R.track, P = R.player, pol = R.pol;
    for (const q of pol.spikes) { q.on = false; q.gone = true; }
    g.pause();
    const s = pol.plan.find(q => q.s > P.q.s + 100).s - 60, v = 64;   // (a straight bit: where a strip or a roadblock would go)
    const put = (c, s1, d) => { const j = Tk.idx(s1); c.place(Tk.px[j] + Tk.nx[j] * d, Tk.pz[j] + Tk.nz[j] * d, Tk.hd[j]); c.y = c.py = c.roadY = Tk.hy[j]; c.vx = Math.cos(Tk.hd[j]) * v; c.vz = Math.sin(Tk.hd[j]) * v; c.speed = v; c.q = Tk.query(c.x, c.z, j, c.q); c.sPrev = c.q.s; };
    put(P, s, 1.5);
    const cs = pol.cars.filter(c => !c.locked && c.pol.mode !== 'out').slice(0, 2);
    while (cs.length < 2) cs.push(pol._car(s - 20, 0, 0, 'chase', 0));   // (the ones out of the chase so far: two more join)
    cs.forEach((c, k) => put(c, s - 6 - k * 5, k ? -2.6 : 3.4));
    for (let i = 0; i < 3; i++) Render.frame(1 / 60, 1, P, 'chase', {});
    const L = Render.look2Info(); return { cars: cs.length, speedBlur: L.speedBlur, sharp: L.sharpCars };
  });
  T.check('at 230 km/h (the chase camera): the picture streaks, the patrol cars on the player\'s tail stay sharp', blur.speedBlur > 0.2 && blur.cars === 2 && blur.sharp >= 2, JSON.stringify(blur));
  await page.evaluate(() => window.__game.resume && window.__game.resume());

  // held upright: the radio under the clock and the stars, the map under the radio
  await page.setViewportSize({ width: 390, height: 780 });
  await page.evaluate(() => { const g = window.__game; if (g.resume) g.resume(); });
  for (let i = 0; i < 4; i++) await frame();
  await page.evaluate(() => { const g = window.__game; for (let i = 0; i < 4; i++) g.sim(1, true); });
  const radP = await waitShown('#h-radio', 15000), mapP = await box('#h-map'), heat = await box('#h-heat');
  T.check('held upright: the radio under the clock and the stars, right of the speedometer, the map under it',
    radP.shown && radP.t >= heat.b && radP.b <= mapP.t + 1 && Math.abs(radP.r - mapP.r) <= 2 && radP.l >= 140, JSON.stringify({ radP, mapP, stars: heat.b }));

  T.check('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close(); await srv.close();
}
T.done();
