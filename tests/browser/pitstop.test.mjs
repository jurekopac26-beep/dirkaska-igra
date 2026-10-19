// The custom stop (POSTANEK PO MERI, game.js stopOpen) on Bathurst, a race with tyres, compounds and fuel, the car damaged on its way in.
// Where the autopilot takes over at the way in, the panel: the tyres, the fuel and the repairs, the defaults chosen and starred (Mehke,
// 100 %, Vse), the stop's seconds as Core.stopDur has them, a red POTRDI, a bar draining with the seconds to the box (bar 1: from about the
// time the car takes to its box down to ~0 there). The film camera at a third of its pace meanwhile (Render.pitPace).
// 1. Tapped (the mouse at each button's middle: nothing over them) Brez and Trde, never POTRDI: at the box the defaults all the same (the
//    repairs done, soft slicks, a full tank), the panel gone; the camera back at its pace, never quicker. Then the bar under the map
//    (bar 2): "Prevzem čez n s", counting down to the hand-back (VOZIŠ TI!), filling from ~0 to 100 % there, never back.
// 2. In English, the keys: down twice to the repairs, right twice to None, Enter (CONFIRM): the panel gone at once, bar 2 from then on; the
//    stop as chosen: shorter than with the repairs (the fuel and the tyres only), the damage still on the car (no repairN); the camera a
//    little quicker for a while after it (catching up), then at its pace again.
//   node tests/browser/pitstop.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('the custom stop (bathurst)');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'low', shadows: 0, camera: 'chase', damage: 2, fuel: 1, length: 'long' }, { width: 640, height: 360 }, { context: { reducedMotion: 'reduce' } });
  await startTrack(page, 'bathurst');
  await page.evaluate(() => { window.__game.pause(); const e = document.querySelector('.screen.show'); if (e) e.style.display = 'none'; });
  // in the page: on to the next way in (the autopilot asked for at the end of a lap; on the way in the car damaged, the tank as asked), the
  // race and the renderer stepped (the film camera), until the panel shows; then 1 s more
  const toPanel = (fuel) => page.evaluate((fuel) => {
    const g = window.__game, P = g.race.player, Tk = g.race.track; Render.scene.visible = false; let set = false;
    for (let k = 0; k < 40000 && !g.pitStop.on; k++) {
      if (P.lap >= 1 && !P.inPit && !Tk.pitAt(P.q.s) && !P.pitWant && !g.pitAuto.st) P.pitWant = true;
      if (!set && Tk.pitAt(P.q.s + 150) && P.pitWant) { set = true; P.fuel = fuel; P.dmg = 0.6; P.dz = [0.7, 0.1, 0.5, 0.05]; }   // (damaged and the tank as asked, just before the way in)
      if (P.inPit || g.pitAuto.st) { g.sim(1 / 60, false, 0, 0); Render.frame(1 / 60, 1, P, 'chase', {}); } else g.sim(0.1, true);
    }
    for (let k = 0; k < 20; k++) { g.sim(0.05, false, 0, 0); Render.frame(0.05, 1, P, 'chase', {}); }
    g.hud(0.05); Render.scene.visible = true;
    const el = document.getElementById('h-stop'), rows = [...el.querySelectorAll('.sp-row')].map(R => ({ r: R.dataset.r, lbl: R.querySelector('.sp-lbl b').textContent, t: R.querySelector('.sp-lbl span').textContent,
      opts: [...R.querySelectorAll('button')].map(b => b.dataset.v + (b.classList.contains('sel') ? '*' : '') + (b.classList.contains('def') ? '★' : '')) }));
    const ok = el.querySelector('.sp-ok'), bg = getComputedStyle(ok).backgroundImage, rgb = (/rgb\((\d+), (\d+), (\d+)\)/.exec(bg) || []).slice(1).map(Number);
    return { on: el.classList.contains('on') && getComputedStyle(el).display !== 'none', st: g.pitStop, title: el.querySelector('.sp-head b').textContent, rows, tot: el.querySelector('.sp-tot b').textContent, ok: ok.textContent, red: rgb.length === 3 && rgb[0] > 180 && rgb[1] < 110 && rgb[2] < 110,
      want: Lang.dec(Core.stopDur(P, g.race, g.pitStop.def).toFixed(1)) + ' s', pace: +Render.pitPaceK.toFixed(3), pitBar: document.getElementById('h-pit').classList.contains('on'), dmg: P.dmg, rep: P.repairN || 0 };
  }, fuel);
  // in the page: on to the hand-back, stepped in 0.1 s; while the panel shows its bar and seconds (bar 1), then the bar under the map (bar 2),
  // the film camera's pace; what the stop got (its duration, what it did)
  const toHandBack = (pre) => page.evaluate((pre) => {
    const g = window.__game, P = g.race.player, el = document.getElementById('h-stop'), pb = document.getElementById('h-pit'), o = { b1: [], b2: [], pace: [], t: 0, arrive: null, decide: null, hand: null, dur: null, plan: null, rep0: P.repairN || 0, hm: [], wear: null };
    Render.scene.visible = false;
    for (let k = 0; k < 3000 && g.pitAuto.st; k++) {
      const on0 = g.pitStop.on;
      for (let i = 0; i < 6; i++) { g.sim(1 / 60, false, 0, 0); Render.frame(1 / 60, 1, P, 'chase', {}); o.t += 1 / 60; if (P.pitState === 'repair' && o.arrive == null) { o.arrive = o.t; o.dur = P.pitDur; o.plan = P.pitPlan && Object.assign({}, P.pitPlan); }
        if (P.pitDone && o.wear == null && P.ty) o.wear = P.ty.wear; if (!g.pitAuto.st) break; }   // (wear: the tyres as the stop left them, before the way out wears them: new, at most the step that left the box)
      g.hud(0.1); const m = document.getElementById('h-msg').textContent; if (m && o.hm[o.hm.length - 1] !== m) o.hm.push(m);
      if (on0 && !g.pitStop.on) o.decide = o.t;
      if (g.pitStop.on) o.b1.push({ t: +o.t.toFixed(2), tl: +g.pitStop.tl.toFixed(2), w: parseFloat(el.querySelector('.sp-tb i').style.width), s: el.querySelector('.sp-head em').textContent });
      if (pb.classList.contains('on')) o.b2.push({ t: +o.t.toFixed(2), lbl: pb.children[1].textContent, w: parseFloat(pb.querySelector('em').style.width) });
      o.pace.push({ t: +o.t.toFixed(2), k: +Render.pitPaceK.toFixed(3), on: g.pitStop.on });
    }
    o.hand = g.pitAuto.st ? null : o.t; o.end = { w: parseFloat(pb.querySelector('em').style.width), on: pb.classList.contains('on'), dmg: +P.dmg.toFixed(3), rep: P.repairN || 0, ty: P.ty && { k: P.ty.k, c: P.ty.c, wear: P.ty.wear }, fuel: +P.fuel.toFixed(3), plan: P.pitPlan || null };
    if (pre) Object.assign(o, pre);
    Render.scene.visible = true; return o;
  }, pre);
  const mid = (sel) => page.evaluate((sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, h: r.height }; }, sel);

  // 1. the defaults, then Brez and Trde tapped, no POTRDI
  const a = await toPanel(0.6);
  T.check('at the way in the panel: POSTANEK PO MERI, the tyres, the fuel and the repairs; the defaults chosen and starred (Mehke, 100 %, Vse); the stop\'s seconds as Core.stopDur has them; a red POTRDI; no bar under the map yet',
    a.on && a.st.on && a.title === 'POSTANEK PO MERI' && a.rows.map(r => r.r).join() === 'ty,fuel,fix' && a.rows[0].opts.join() === 'S*★,M,H,W,keep' && a.rows[1].opts.join() === '1*★,0.5,0.25' && a.rows[2].opts.join() === 'all*★,need,none'
      && a.tot === a.want && a.ok === 'POTRDI' && a.red && !a.pitBar && a.st.def.ty === 'S' && a.st.def.fuel === 1 && a.st.def.fix === 'all', JSON.stringify(a));
  T.check('the film camera at a third of its pace while the panel shows', Math.abs(a.pace - 1 / 3) < 0.03, `pace ${a.pace}`);
  const taps = [];
  for (const sel of ['#h-stop .sp-row[data-r="fix"] button[data-v="none"]', '#h-stop .sp-row[data-r="ty"] button[data-v="H"]']) { const p = await mid(sel); await page.mouse.click(p.x, p.y); taps.push({ sel: sel.replace(/^.*data-r="(\w+)".*data-v="(\w+)".*$/, '$1:$2'), h: p.h, st: await page.evaluate(() => window.__game.pitStop.sel) }); }
  T.check('tapped (the mouse at their middle, 44 px tall at least): Brez and Trde chosen, nothing confirmed', taps.length === 2 && taps.every(t => t.h >= 44) && taps[1].st.fix === 'none' && taps[1].st.ty === 'H', JSON.stringify(taps));
  const r1 = await toHandBack({ tl0: a.st.tl0 });
  const b1 = r1.b1, b2 = r1.b2, w2 = b2.map(x => x.w), s2 = b2.map(x => parseFloat(x.lbl.replace(/^Prevzem čez /, '').replace(',', '.')));
  T.check('not confirmed: at the box the defaults (all repaired, soft slicks, a full tank), the stop as long as stopDur says for them; the panel gone there',
    r1.arrive != null && r1.decide != null && Math.abs(r1.decide - r1.arrive) < 0.2 && r1.plan && r1.plan.ty === 'S' && r1.plan.fuel === 1 && r1.plan.fix === 'all' && r1.end.dmg === 0 && r1.end.rep === r1.rep0 + 1 && r1.end.ty.c === 'S' && r1.wear < 1e-4 && r1.end.fuel === 1 && !r1.end.plan,
    JSON.stringify({ arrive: r1.arrive, decide: r1.decide, dur: r1.dur, plan: r1.plan, wear: r1.wear, end: r1.end }));
  T.check('bar 1: the seconds to the box from about what the car takes (within 1.5 s), draining (bar and seconds never up) to ~0 at the box',
    b1.length > 10 && Math.abs(r1.tl0 - (r1.arrive + 1)) < 1.5 && b1[0].w > 80 && b1.every((x, i) => !i || (x.w <= b1[i - 1].w + 1e-6 && x.tl <= b1[i - 1].tl + 1e-6)) && b1[b1.length - 1].tl < 1.2 && b1[b1.length - 1].w < 15 && /^\d+ s$/.test(b1[0].s),
    JSON.stringify({ tl0: r1.tl0, arrive: r1.arrive, first: b1[0], last: b1[b1.length - 1], n: b1.length }));
  T.check('bar 2 under the map once decided: "Prevzem čez n s" counting down to the hand-back (from about the time it takes, within 2 s; at most 1.2 s left there), the bar from ~0 % never back to 100 % at the hand-back, then gone',
    b2.length > 50 && r1.hand != null && w2[0] < 3 && w2.every((x, i) => !i || x >= w2[i - 1]) && s2.every((x, i) => !i || x <= s2[i - 1]) && Math.abs(s2[0] - (r1.hand - r1.decide)) < 2 && s2[s2.length - 1] < 1.2 && r1.end.w === 100 && !r1.end.on && r1.hm.includes('VOZIŠ TI!'),
    JSON.stringify({ first: b2[0], last: b2[b2.length - 1], took: r1.hand != null ? +(r1.hand - r1.decide).toFixed(2) : null, end: r1.end, hm: r1.hm }));
  { const before = r1.pace.filter(p => p.on), after = r1.pace.filter(p => !p.on);
    T.check('the film camera: at a third of its pace until the box, then its own pace again (the defaults: never quicker)', before.length > 5 && before.every(p => p.k < 0.4) && after.length > 5 && after.every(p => p.k <= 1.001) && after.some(p => p.k > 0.95),
      JSON.stringify({ before: before.slice(-2), after: after.slice(0, 2).concat(after.slice(-1)) })); }

  // 2. in English, the keys: down, down, right, right, Enter
  await page.evaluate((l) => { const g = window.__game; g.pause(); g.onAction('to-settings'); document.querySelector(`[data-set="lang"] button[data-v="${l}"]`).click(); g.onAction('settings-done'); g.resume(); }, 'en');   // (as tests/browser/radio.test.mjs switches it)
  await page.evaluate(() => { window.__game.pause(); const e = document.querySelector('.screen.show'); if (e) e.style.display = 'none'; });
  const c = await toPanel(0.9);
  const keys = [];
  await page.evaluate(() => window.__game.resume());   // (the keys: only while the race runs, not on the pause screen)
  for (const k of ['ArrowDown', 'ArrowDown', 'ArrowRight', 'ArrowRight']) { await page.keyboard.press(k); keys.push(await page.evaluate(() => { const s = window.__game.pitStop, R = document.querySelector('#h-stop .sp-row.foc'); return (R ? R.dataset.r : '-') + ':' + s.sel.fix; })); }
  const pick = await page.evaluate(() => { const g = window.__game, P = g.race.player, s = g.pitStop; return { sel: s.sel, dSel: Core.stopDur(P, g.race, s.sel), dDef: Core.stopDur(P, g.race, s.def) }; });
  await page.keyboard.press('Enter');
  const conf = await page.evaluate(() => { const g = window.__game; g.pause(); const e = document.querySelector('.screen.show'); if (e) e.style.display = 'none'; g.hud(0.05); return { st: g.pitStop, panel: document.getElementById('h-stop').classList.contains('on'), plan: g.race.player.pitPlan && Object.assign({}, g.race.player.pitPlan) }; });
  T.check('in English: CUSTOM STOP, Tyres / Fuel / Repair, CONFIRM', c.on && c.title === 'CUSTOM STOP' && c.rows.map(r => r.lbl).join() === 'Tyres,Fuel,Repair' && c.ok === 'CONFIRM', JSON.stringify({ title: c.title, rows: c.rows.map(r => r.lbl), ok: c.ok }));
  T.check('the keys: down to the fuel, to the repairs, right twice: None; Enter confirms it (the panel gone at once, the car\'s plan)',
    keys.join() === 'fuel:all,fix:all,fix:need,fix:none' && pick.sel.fix === 'none' && conf.st.ok && !conf.st.on && !conf.panel && conf.plan && conf.plan.fix === 'none' && conf.plan.ty === 'S' && conf.plan.fuel === 1,
    JSON.stringify({ keys, pick, conf }));
  const r2 = await toHandBack({ dSel: pick.dSel, dDef: pick.dDef });
  T.check('confirmed without repairs: the stop shorter (the tyres and the fuel only, as stopDur says), the damage still on the car (no repairN), soft slicks, a full tank',
    r2.arrive != null && Math.abs(r2.dur - r2.dSel) < 1e-9 && r2.dSel < r2.dDef - 0.3 && r2.end.dmg === 0.6 && r2.end.rep === r2.rep0 && r2.end.ty.c === 'S' && r2.wear < 1e-4 && r2.end.fuel === 1,
    JSON.stringify({ dur: r2.dur, dSel: r2.dSel, dDef: r2.dDef, wear: r2.wear, end: r2.end }));
  { const after = r2.pace, top = Math.max(...after.map(p => p.k)), firstUp = after.findIndex(p => p.k > 1.2);
    T.check('the film camera after CONFIRM: quicker than its pace for a while (catching up, eased: no jump), then its pace again', top > 1.3 && top < 1.7 && firstUp >= 0 && after[0].k < top - 0.2 && after.slice(-5).every(p => Math.abs(p.k - 1) < 0.02) && after.every((p, i) => !i || Math.abs(p.k - after[i - 1].k) < 0.5),
      JSON.stringify({ top, firstUp, start: after.slice(0, 3), end: after.slice(-2) })); }
  { const s = r2.b2.map(x => x.lbl);
    T.check('bar 2 in English from CONFIRM on: "You drive in n s", to the hand-back (YOU DRIVE!)', r2.b2.length > 50 && r2.b1.length === 0 && s.every(x => /^You drive in \d+\.\d s$/.test(x)) && r2.hm.includes('YOU DRIVE!'), JSON.stringify({ first: s[0], last: s[s.length - 1], hm: r2.hm })); }
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
