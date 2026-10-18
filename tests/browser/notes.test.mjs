// The corner sign (#h-note) on the HUD: (a) where it sits, on a phone lying and upright (both behind the car), in nine
// HUD states (a race, with the team radio, with the wreck panel, a duel, the police, the police's checkpoint, a time trial, Pikes Peak
// with its pill off, the driving school): high in the top row, over nothing (also the column under the map: the pit stop's bar, the start's
// reaction, the big message, the splits, the toast; the pause, camera, tyre and rescue buttons; the controls); (b) in a race: Medvode's
// roundabout and Harju's and Monaco's chicanes blue with their own glyphs (all upright: the camera behind the car turns with it), a red arrow before a slow corner; with the column under the map full (laid out by game.js hudCol: the
// reaction, START!, the team radio, the toast) the sign over none of it, nor over the buttons and the controls; on Pikes Peak in a time
// trial the pill (#pk-note) instead, where it was.
//   node tests/browser/notes.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('notes');
const srv = await serve();
const browser = await launch();
const P_RING = 'M46.9 33.3 A15 15 0 0 0 32.8 17 M38.3 22.8 L32.8 17 L38.9 11.9 M25.7 18.4 A15 15 0 0 0 18.6 38.8 M20.8 31.1 L18.6 38.8 L11.1 36.1 M23.4 44.3 A15 15 0 0 0 44.6 40.2 M36.8 42.1 L44.6 40.2 L46 48';
const P_CR = 'M22 56 V44 Q22 34 32 30 Q42 26 42 16 V12 M33 19 L42 10 L51 19', P_CL = 'M42 56 V44 Q42 34 32 30 Q22 26 22 16 V12 M13 19 L22 10 L31 19';
try {
  // (a) the place: every HUD state filled with its longest texts, the sign shown (no transition); its box against every other visible box
  for (const [w, h, cam] of [[640, 360, 'chase'], [915, 412, 'chase'], [360, 640, 'chase'], [412, 915, 'chase']]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true });
    const page = await ctx.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript((raw) => { localStorage.setItem('tdgp-defaults-v2', '1'); localStorage.setItem('tdgp-defaults-v3', '1'); localStorage.setItem('tdgp-noadapt', '1'); localStorage.setItem('tdgp-menu', 'old'); localStorage.setItem('tdgp-settings', raw); },
      JSON.stringify({ sound: 0, comm: 0, quali: 0, faults: 0, hlv: 0, camera: cam }));
    await page.goto(srv.base + '/index.html'); await page.waitForFunction(() => window.__game, null, { timeout: 180000 });
    const out = await page.evaluate(() => {
      const $ = (id) => document.getElementById(id);
      for (const s of document.querySelectorAll('.screen.show')) s.classList.remove('show');
      $('hud').classList.remove('off'); $('touch').classList.remove('off');
      for (const id of ['btn-pause', 'btn-cam', 'btn-tyre']) $(id).classList.remove('off');
      $('h-note').style.transition = 'none'; $('h-note').className = 'show sev3';
      const box = (e) => { const b = e.getBoundingClientRect(), cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity <= 0.05 || b.width === 0 || b.height === 0) return null; return b; };
      const ov = (a, b) => a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;
      const others = () => { const L = []; for (const id of ['h-time', 'h-best', 'h-sec', 'h-split', 'h-gap', 'h-pol', 'h-chk', 'h-map', 'h-prof', 'h-wreck', 'h-tower', 'h-teamradio', 'h-pit', 'h-react', 'h-msg', 'h-ttsp', 'toast', 'btn-pause', 'btn-cam', 'btn-tyre', 'btn-rescue', 'h-school', 'h-pos', 'h-tot', 'h-lap', 'h-alt', 'h-turn', 'h-pkcls', 'speedo', 'h-dmg', 'h-tyre', 'h-fuel', 'h-flag', 'c-left', 'c-right', 'c-wheel', 'c-brake', 'c-gas', 'tilt-ind']) { const e = $(id), b = e && box(e); if (b) L.push([id, b]); } for (const e of document.querySelectorAll('#h-rank > .h-lbl')) { const b = box(e); if (b) L.push(['rank-lbl', b]); } return L; };
      const res = [], check = (mode) => { const n = box($('h-note')); res.push({ mode, box: n ? [n.left, n.top, n.right, n.bottom].map(Math.round) : null, hits: n ? others().filter(([, b]) => ov(n, b)).map(([id, b]) => id + '[' + [b.left, b.top, b.right, b.bottom].map(Math.round) + ']') : [] }); };
      $('h-time').textContent = '10:23.456'; $('h-bestv').textContent = '10:22.000';
      const secs = $('h-sec').children; for (const i of secs) i.textContent = '128.412';
      $('h-split').textContent = 'KROG 12: 10:23.456  NAJHITREJŠI'; $('h-split').className = 'show';
      $('h-lap').textContent = 'KROG 1/3 · 12,3/20,7 KM'; $('h-pos').textContent = '12'; $('h-tot').textContent = '/13';
      $('h-flag').className = 'on yel'; $('h-flag').textContent = 'RUMENA ZASTAVA'; $('h-tyre').className = 'on'; $('h-tyre').textContent = 'MEHKE 84 %'; $('h-fuel').className = 'on'; $('h-fuel').textContent = 'GORIVO 40 %';
      $('hud').classList.add('tw');
      check('race');
      $('h-teamradio').style.transition = 'none'; $('h-teamradio').classList.add('on'); $('h-teamradio').lastElementChild.textContent = 'Box this lap. The rain is coming, inters are ready in the box.'; check('race+radio'); $('h-teamradio').classList.remove('on');
      $('h-wreck').classList.add('show'); check('race+wreck'); $('h-wreck').classList.remove('show');
      // (the column under the map, each at its place under it as the CSS has it: hudCol stacks them in a race, part b)
      for (const [id, c, t] of [['h-pit', 'on', ''], ['h-react', 'show good', ''], ['h-msg', 'show', 'START!'], ['toast', 'show col', 'Sedaj lahko spustiš plin, vse bo naredil sam.']]) { $(id).style.transition = $(id).style.animation = 'none'; if (t) $(id).textContent = t; $(id).className = c; }
      $('h-react').firstElementChild.textContent = 'REAKCIJA'; $('h-react').lastElementChild.textContent = '0,23 s'; $('btn-rescue').classList.remove('off');
      check('race+column'); for (const id of ['h-pit', 'h-react', 'h-msg', 'toast']) $(id).className = ''; $('btn-rescue').classList.add('off');
      $('hud').classList.remove('tw');
      $('h-lap').textContent = '2,4/12,3 KM'; $('hud').classList.add('up', 'duel'); $('h-gap').textContent = 'TEKMEC SPREDAJ +12.4 s'; check('duel');
      $('hud').classList.remove('duel');
      $('hud').classList.add('pol'); $('h-heat').textContent = '★★☆☆☆'; $('h-pol').className = 'warn hid'; $('h-hidel').textContent = 'HELIKOPTER NAD TABO'; $('h-flat').textContent = 'PREBITE GUME: 2'; $('h-chk').className = 'on'; $('h-chk').innerHTML = '<b>SKRIVALIŠČE · 400 m</b><span>Garaža desno ob cesti: zapelji noter</span>';
      check('police');
      $('h-pol').className = 'pre'; $('h-heat').textContent = ''; $('h-hidel').textContent = ''; $('h-flat').textContent = ''; $('h-chk').className = 'on'; $('h-chk').innerHTML = '<b>ZAPELJI OB ROB VOZIŠČA</b><span>Parkiraj v označeno polje · 12 m (ali pobegni)</span>';
      check('police+chk');
      $('hud').classList.remove('pol', 'up'); $('h-chk').className = '';
      $('h-lap').textContent = 'CP 2/4'; $('h-tyre').className = ''; $('h-flag').className = ''; $('h-fuel').className = ''; $('hud').classList.add('tt', 'ttd', 'ttp', 'ttn'); $('h-delta').textContent = '-1.24'; for (const i of secs) i.textContent = ''; $('h-split').textContent = 'CP 2: 2:01.42 -0.84'; $('h-alt').textContent = '2.345 m'; $('h-turn').textContent = 'OVINEK 12/156';
      check('tt');
      $('hud').classList.add('pkc'); $('h-pkcls').textContent = 'UNLIMITED'; for (const i of secs) i.innerHTML = 'CP1<small>+0.42</small>'; $('h-split').className = 'pk show'; $('h-split').innerHTML = '<b>CP2</b><span>2:01.42</span><em class="fast">-0.84</em>';
      check('pikes');
      $('hud').classList.remove('tt', 'ttd', 'ttp', 'ttn', 'pkc');
      $('hud').classList.add('school'); $('h-school').textContent = 'Zaviranje do oznake · 120 km/h'; check('school');
      return res;
    });
    const land = w > h, lim = (m) => land ? (m === 'school' ? 0.27 * h : 10) : (/^police/.test(m) ? 200 : m === 'pikes' || m === 'school' ? 106 : 95);
    const badOnes = out.filter(o => !o.box || o.hits.length || o.box[1] > lim(o.mode));
    T.check(`${w}×${h} (${land ? 'lying' : 'upright'}): the sign high in the top row in all 10 HUD states (top ≤ ${land ? '10 px; the school ≤ 27 %' : '95 px; the police ≤ 200, Pikes and the school ≤ 106'}), over nothing`,
      out.length === 10 && !badOnes.length && !errors.length, (badOnes.length ? badOnes.map(o => `${o.mode} [${o.box}] ${o.hits.length ? 'OVER ' + o.hits.join(' ') : 'too low'}`).join('; ') : out.map(o => `${o.mode} [${o.box}]`).join(' ')) + (errors.length ? ' errors: ' + errors.join(' | ') : ''));
    await ctx.close();
  }

  // (b) in a race, both cameras: the sign as at a place (window.__game.noteAt), read after its .18 s pop-in (scale .8 to 1)
  for (const [vp, cam] of [[{ width: 640, height: 360 }, 'chase'], [{ width: 360, height: 640 }, 'chase']]) {
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', { camera: cam, notes: 1 }, vp);
    const land = vp.width > vp.height, tag = `${cam} ${vp.width}×${vp.height}`;
    const go = async (id) => { await startTrack(page, id); return page.evaluate(async () => { const g = window.__game; for (let k = 0; k < 240 && g.phase !== 'racing'; k++) { g.sim(0.25, true); await new Promise(r => requestAnimationFrame(r)); } return g.phase; }); };
    // the sign as at d m after the start line (or at s along the road) at v m/s: what noteAt says, and the box 250 ms later
    const at = (d, v, abs) => page.evaluate(async ([d, v, abs]) => {
      const g = window.__game, T = g.race.track, s = abs ? d : T.open ? T.startS + d : (((T.startS + d) % T.len) + T.len) % T.len;
      g.noteAt(s, v); await new Promise(r => setTimeout(r, 250));
      const el = document.getElementById('h-note'), t0 = performance.now();   // (software WebGL: a slow frame holds the pop-in's last step back)
      while (el.classList.contains('show') && Math.abs(el.getBoundingClientRect().height - el.offsetHeight) > 0.5 && performance.now() - t0 < 3000) await new Promise(r => requestAnimationFrame(r));
      const o = g.noteAt(s, v), b = el.getBoundingClientRect();
      return Object.assign(o, { top: Math.round(b.top), pol: document.getElementById('hud').classList.contains('pol') });
    }, [d, v, !!abs]);
    const top = (o) => o.top <= (land ? 10 : o.pol ? 200 : 95);
    // (behind the car the sign stays upright)
    const rotOk = (o) => o.rot === '';
    const txt = (o) => `${o.kind} '${o.cls}' ${o.key} rot '${o.rot}' top ${o.top}`;

    T.check(`${tag} medvode: racing`, await go('medvode') === 'racing');
    let a = await at(300, 20), b = await at(420, 15);
    T.check(`${tag} medvode: 26 m before the first roundabout the blue sign, the roundabout's glyph, upright, in the top row; past it no blue`,
      a.cls === 'show blue' && a.kind === 'ring' && a.d === P_RING && a.rot === '' && top(a) && !/blue/.test(b.cls), txt(a) + ' | 420 m: ' + txt(b));

    // the column under the map full in a race (hudCol lays it out: the reaction, START!, the team radio, the toast) and the sign shown: over
    // none of it, nor over the buttons (pause, camera, tyres, rescue), the speedometer or the controls
    const full = await page.evaluate(async () => {
      const g = window.__game, $ = (id) => document.getElementById(id), raf = () => new Promise(r => requestAnimationFrame(r));
      const R = $('h-react'); R.firstElementChild.textContent = 'REAKCIJA'; R.lastElementChild.textContent = '0,23 s'; R.className = 'show good';
      g.msg('START!', 'gold', 60); g.toast('Sedaj lahko spustiš plin, vse bo naredil sam.', 60000);
      const r = $('h-teamradio'); r.lastElementChild.textContent = 'Dober postanek. Si 5., G. Moretti je 12,3 s pred tabo.'; r.classList.add('on');
      const T = g.race.track; g.noteAt((((T.startS + 300) % T.len) + T.len) % T.len, 20);
      for (const id of ['h-note', 'h-react', 'h-msg', 'h-teamradio', 'toast']) $(id).style.transition = $(id).style.animation = 'none';
      for (let k = 0; k < 4; k++) await raf();
      const box = (e) => { if (!e) return null; for (let x = e; x; x = x.parentElement) { const c = getComputedStyle(x); if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity <= 0.05) return null; } const b = e.getBoundingClientRect(); return b.width && b.height ? b : null; };
      const ov = (a, b) => a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;
      const n = box($('h-note')), ids = ['h-map', 'h-pit', 'h-react', 'h-msg', 'h-ttsp', 'h-teamradio', 'toast', 'h-tower', 'btn-pause', 'btn-cam', 'btn-tyre', 'btn-rescue', 'speedo', 'h-times', 'h-rank', 'c-left', 'c-right', 'c-wheel', 'c-brake', 'c-gas', 'tilt-ind'];
      const shown = ids.filter(id => box($(id))), hits = n ? shown.filter(id => ov(n, box($(id)))) : [];
      const out = { note: n ? [n.left, n.top, n.right, n.bottom].map(Math.round) : null, shown, hits, col: ['h-react', 'h-msg', 'h-teamradio', 'toast'].map(id => { const b = box($(id)); return b ? id + '@' + Math.round(b.top) : id + ' -'; }) };
      R.className = ''; $('h-msg').className = ''; $('toast').classList.remove('show'); r.classList.remove('on', 'wait');
      for (const id of ['h-note', 'h-react', 'h-msg', 'h-teamradio', 'toast']) $(id).style.transition = $(id).style.animation = '';
      g.noteAt(null); return out;
    });
    T.check(`${tag} medvode: the column under the map full (the reaction, START!, the radio, the toast): the sign over none of it, nor over the buttons and the controls`,
      !!full.note && !full.hits.length && full.shown.includes('h-react') && full.shown.includes('h-msg') && full.shown.includes('btn-pause') && full.shown.includes('c-gas'), JSON.stringify(full));

    T.check(`${tag} harju: racing`, await go('harju') === 'racing');
    a = await at(540, 15);
    T.check(`${tag} harju: before the first bale chicane (it had no sign) the blue sign, the chicane's glyph first right`, a.cls === 'show blue' && a.kind === 'chic' && a.d === P_CR && rotOk(a) && top(a), txt(a));

    T.check(`${tag} monaco: racing`, await go('monaco') === 'racing');
    a = await at(2050, 40);
    T.check(`${tag} monaco: before the Nouvelle Chicane the blue sign, first left, along the road`, a.cls === 'show blue' && a.kind === 'chic' && a.d === P_CL && rotOk(a) && top(a), txt(a));
    const s3 = await page.evaluate(() => { const T = window.__game.race.track, g = T.hudSigns().find(x => x.kind === 'corner' && x.sev === 3 && T.signAt(x.s0 - 20, 15) === x); return g ? g.s0 - 20 : null; });
    a = s3 == null ? null : await at(s3, 15, true);
    T.check(`${tag} monaco: 20 m before a slow corner the red arrow, along the road`, !!a && a.cls === 'show sev3' && a.kind === 'corner' && /^[rl][13]\|sev3$/.test(a.key) && rotOk(a) && top(a), a ? txt(a) : 'no slow corner');
    await page.evaluate(() => window.__game.noteAt(null));

    // Pikes Peak in a time trial: the pill instead (#hud.pkn), where it was: under the clock (lying) / under the map's row (upright)
    T.check(`${tag} pikes: racing`, await go('pikes') === 'racing');
    const pk = await page.evaluate(async () => {
      const g = window.__game, $ = (id) => document.getElementById(id), raf = () => new Promise(r => requestAnimationFrame(r));
      await raf(); await raf();
      const pkn = $('hud').classList.contains('pkn'), disp = getComputedStyle($('h-note')).display;
      let k = 0; for (; k < 160 && !$('pk-note').classList.contains('show'); k++) { g.sim(0.25, true); await raf(); }
      return { pkn, disp, shown: $('pk-note').classList.contains('show'), t: k * 0.25, top: parseFloat(getComputedStyle($('pk-note')).top) / innerHeight, dmg: (parseFloat($('hud').style.getPropertyValue('--dmg-h')) || 0) / innerHeight };
    });
    const want = land ? 0.244 : 0.306 + pk.dmg;   // (upright with the damage picture first in the column: as much lower, the height profile with it)
    T.check(`${tag} pikes (time trial): the corner sign off (#hud.pkn), the pill shown within 40 s at ${want} of the height as before`, pk.pkn && pk.disp === 'none' && pk.shown && Math.abs(pk.top - want) <= 0.01,
      `pkn ${pk.pkn}, #h-note ${pk.disp}, pill ${pk.shown ? 'after ' + pk.t + ' s' : 'never'}, top ${pk.top.toFixed(3)}`);
    await page.evaluate(() => window.__game.noteAt(null));
    T.check(`${tag}: no page errors`, !errors.length, errors.join(' | '));
    await ctx.close();
  }
} finally {
  await browser.close();
  await srv.close();
}
T.done();
