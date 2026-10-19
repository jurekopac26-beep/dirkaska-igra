// The texts of a race under the minimap (game.js hudCol, the column): the pit stop's progress bar, the big message (START!, ZADNJI KROG!,
// BOKSI · AVTOPILOT ...), the team radio and the toast, each the map's width, stacked right under it and under each other (no gap, no
// overlap), the big message in at most three lines; nothing of them over the middle of the track, none over anything else of the HUD (the
// clock, the sectors, the place, the timing tower, the speed, the pause and camera buttons, the pedals and the steering, the police's
// radio and arrows ...). A phone's touch screen upright (360x640, the camera behind the car) and on its side (640x360, the same camera),
// in every HUD: a race on a circuit (the start, a pit stop on the autopilot, the last lap), a time trial (its height profile first under
// the map), Pikes Peak, the run from the police, the duel in the traffic, the driving school, a race with a friend over the internet. On its
// side the tower is the column's last (fewer rows, or none, with texts above it), and what does not fit above the pedals waits (the toast,
// then the radio: hidden, its time stopped, the toast's for 6 s at most); upright everything fits at once. The pit stop in every way of
// steering (buttons, wheel, tilt: no tilt meter while the autopilot steers), in Slovenian and in English; the toast of the way in gone with
// the autopilot. A time trial's finish: its splits in the column under the message. The longest big messages on the narrowest phone in at
// most three lines, no word sticking out. No handbrake button (ROČNA) on the screen in any steering mode (and no handbrake in the input).
// A small icon at the left of each: the big message's by its kind (a chequered flag ZADNJI KROG!, a wrench POPRAVILO, a green light START!,
// a warning triangle PREDRTA GUMA! and the overheating, crossed swords DVOBOJ, a star NOV REKORD!, a pit board BOKSI), the wrench on the pit
// stop's panel, an "i" on the toast; the text right of it, never under it; in both languages, either way the phone is held.
// (The top left itself, the place, the speed, the tyres and the lap, against the clock, the corner sign, the map and the controls in
// every steering mode: tests/browser/hud.test.mjs, on a real track.)
//   node tests/browser/hudcol.test.mjs            (SHOTS=<folder>: a picture of each)
import net from 'node:net';
import path from 'node:path';
import { createRequire } from 'node:module';
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const require = createRequire(import.meta.url);
const T = checker('the texts under the map (hudCol)');
const SHOTS = process.env.SHOTS || '';
const srv = await serve();
const browser = await launch(['--disable-features=WebRtcHideLocalIpsWithMdns']);
const OR = { port: { width: 360, height: 640, camera: 'chase' }, land: { width: 640, height: 360, camera: 'chase' } };
const CTX = { touch: true, context: { reducedMotion: 'reduce' } };   // (a phone; no fade-in moving the boxes while they are measured)
const TOAST = 'Sedaj lahko spustiš plin, vse bo naredil sam.', RADIO = 'Dober postanek. Si 5., G. Moretti je 12,3 s pred tabo.';
// the pit stop's longest message (the tyres, the repair, the fuel), its toast and a radio message, in both languages
const PIT = { sl: { msg: 'MEHKE GUME · POPRAVLJENO · POLNO', toast: TOAST, radio: RADIO, title: 'AVTOPILOT · spusti plin' },
  en: { msg: 'SOFT TYRES · REPAIRED · TANK FULL', toast: 'You can let go of the gas now, the car does everything by itself.', radio: 'Good stop. You are 5th, G. Moretti is 12.3 s ahead.', title: 'AUTOPILOT · let go of the gas' } };
// a big message of each kind (in Slovenian, as the game has it; tr() for English) and its icon
const KINDS = [[['ZADNJI KROG!'], 'flag'], [['POPRAVILO {0} %', 45], 'wrench'], [['START!'], 'go'], [['PREDRTA GUMA!'], 'warn'], [['ZAVORE SE PREGREVAJO'], 'warn'], [['MOTOR SE PREGREVA'], 'warn'],
  [['DVOBOJ V PROMETU!'], 'vs'], [['NOV REKORD!'], 'star'], [['BOKSI · AVTOPILOT'], 'pit']];
// the longest big messages of the game (the safety car's restart, the walkers run over, the police's mission), in both languages
const LONG = ['NE PREHITEVAJ DO CILJNE ČRTE', 'NO OVERTAKING UNTIL THE LINE', 'POVOZIL SI PEŠCA! +5 s', 'YOU RAN OVER SOMEONE ON FOOT! +5 s', 'TEKMEC JE POVOZIL KOLESARJA +5 s', 'YOUR RIVAL RAN OVER SOMEONE ON FOOT +5 s',
  'MISIJA OPRAVLJENA!', 'MISSION ACCOMPLISHED!', 'CHAMPIONSHIP · RACE 3/8', PIT.sl.msg, PIT.en.msg];

// the column's texts: without the tower (upright the first in it, right under the map)
const rest = (ids) => ids.filter(i => i !== 'h-tower');
// in the page: the column (its items shown, top to bottom) and every other HUD element shown
const MEASURE = () => {
  const shown = (e) => { if (!e || getComputedStyle(e).visibility !== 'visible') return false; for (let x = e; x; x = x.parentElement) { const c = getComputedStyle(x); if (c.display === 'none' || +c.opacity === 0) return false; } const r = e.getBoundingClientRect(); return r.width > 1 && r.height > 1; };
  const R = (id) => { const r = document.getElementById(id).getBoundingClientRect(); return { id, l: +r.left.toFixed(1), t: +r.top.toFixed(1), r: +r.right.toFixed(1), b: +r.bottom.toFixed(1) }; };
  const land = innerWidth > innerHeight, M = document.getElementById('h-msg'), cs = getComputedStyle(M);
  const colIds = (land ? [] : ['h-tower']).concat(['h-prof', 'h-wreck', 'h-pit', 'h-react', 'h-msg', 'h-ttsp', 'h-teamradio', 'toast']).concat(land ? ['h-tower'] : []);   // (upright the tower first in it, right under the map)
  const otherIds = ['h-time', 'h-best', 'h-sec', 'h-split', 'h-pol', 'h-gap', 'h-chk', 'h-school', 'btn-pause', 'btn-rescue', 'h-main', 'h-pos', 'h-tot', 'h-speed', 'h-lap', 'h-tyre', 'h-tags', 'h-alt', 'h-turn', 'h-pkcls',
    'h-fuel', 'h-flt', 'h-flag', 'h-radio', 'h-tail', 'h-lights', 'h-note', 'c-left', 'c-right', 'c-wheel', 'c-brake', 'c-gas', 'tilt-ind'];
  return { w: innerWidth, h: innerHeight, screen: window.__game.screen, m: R('h-map'),
    col: colIds.filter(id => shown(document.getElementById(id))).map(R).sort((a, b) => a.t - b.t), other: otherIds.filter(id => shown(document.getElementById(id))).map(R),
    wait: ['toast', 'h-teamradio'].filter(id => document.getElementById(id).classList.contains('wait')), msg: M.textContent, lines: shown(M) ? Math.round((M.clientHeight - 7) / parseFloat(cs.lineHeight)) : 0, fs: parseFloat(cs.fontSize), out: shown(M) ? M.scrollWidth - M.clientWidth : 0,
    rows: document.getElementById('h-tower').querySelectorAll('.tw-r').length };
};
// in the page: the icons of the column (css ::before, inline SVG as --ic-*): which one each shows (the same picture as var(--ic-<kind>)), its size,
// and where the text starts (each at the start of its first line: the message's, the pit title's, the toast's "i"); the coloured edge at the
// left and the background (see-through, as the map's)
const ICONS = () => {
  const img = (k) => { const d = document.createElement('i'); d.style.backgroundImage = `var(--ic-${k})`; document.body.appendChild(d); const v = getComputedStyle(d).backgroundImage; d.remove(); return v; };
  const KS = ['flag', 'wrench', 'go', 'warn', 'vs', 'star', 'pit', 'info'], pics = KS.map(img);
  const one = (e, t, box) => { const c = getComputedStyle(e, '::before'), r = e.getBoundingClientRect(), g = document.createRange(); g.selectNodeContents(t); const t0 = g.getClientRects()[0] || g.getBoundingClientRect();
    const s = getComputedStyle(e), bx = getComputedStyle(box || e), a = (v) => { const m = /rgba?\(([^)]+)\)/.exec(v); return m ? +(m[1].split(',')[3] || 1) : 1; };
    return { ic: KS[pics.indexOf(c.backgroundImage)] || c.backgroundImage.slice(0, 30), w: +parseFloat(c.width).toFixed(1), h: +parseFloat(c.height).toFixed(1), fs: parseFloat(s.fontSize), fw: +s.fontWeight,
      edge: parseFloat(bx.borderLeftWidth) + ' ' + bx.borderLeftColor, bga: a(bx.backgroundColor),
      gap: +(t0.left - r.left - parseFloat(getComputedStyle(e).paddingLeft) - parseFloat(getComputedStyle(e).borderLeftWidth) - parseFloat(c.width)).toFixed(1) }; };
  const M = document.getElementById('h-msg'), P = document.getElementById('h-pit'), T = document.getElementById('toast');
  return { dataIc: M.dataset.ic || '', icm: M.dataset.icm || '', msg: one(M, M), pit: P.classList.contains('on') ? one(P.firstElementChild, P.firstElementChild, P) : null, toast: T.classList.contains('show') && T.classList.contains('col') ? one(T, T) : null };
};
// what is wrong with the icons: the message's not the one of its kind or not as tall as its letters, the pit panel without its wrench, the
// toast without its "i", or a text over its icon
function wrongIcons(x, kind) {
  const bad = [];
  if (x.dataIc !== kind || x.msg.ic !== kind) bad.push(`the message's icon ${x.dataIc}/${x.msg.ic}, not ${kind}`);
  if (x.icm) bad.push('the message without its icon: ' + x.icm);
  const EDGE = { warn: 'rgb(230, 59, 46)', go: 'rgb(53, 212, 95)', star: 'rgb(53, 212, 95)' }, mapA = 0.45;
  if (!x.msg.edge.startsWith('4 ') || (EDGE[kind] && !x.msg.edge.endsWith(EDGE[kind])) || x.msg.bga > mapA + 0.01) bad.push(`the message's edge ${x.msg.edge}, background ${x.msg.bga}`);
  if (kind === 'pit' && (x.msg.fs > 15 || x.msg.fw < 800)) bad.push(`the pits' message not small and heavy: ${x.msg.fs} px, ${x.msg.fw}`);
  if (x.pit && (!x.pit.edge.startsWith('4 ') || x.pit.bga > mapA + 0.01)) bad.push(`the pit panel's edge ${x.pit.edge}, background ${x.pit.bga}`);
  if (x.toast && (!x.toast.edge.startsWith('4 ') || x.toast.bga > mapA + 0.01)) bad.push(`the toast's edge ${x.toast.edge}, background ${x.toast.bga}`);
  if (Math.abs(x.msg.w - 1.05 * x.msg.fs) > 1 || Math.abs(x.msg.h - x.msg.w) > 0.5) bad.push(`the message's icon ${x.msg.w}x${x.msg.h} at ${x.msg.fs} px`);
  if (x.msg.gap < 0) bad.push('the message over its icon');
  if (!x.pit || x.pit.ic !== 'wrench' || x.pit.w < 12 || x.pit.gap < 2) bad.push('the pit panel\'s wrench ' + JSON.stringify(x.pit));
  if (!x.toast || x.toast.ic !== 'info' || x.toast.w < 0.9 * x.toast.fs || x.toast.gap < 1) bad.push('the toast\'s i ' + JSON.stringify(x.toast));
  return bad;
}
// what is wrong with a layout: the column not the map's width, a gap or an overlap in it, one of it over another HUD element
function wrong(o) {
  const bad = [], near = (a, b) => Math.abs(a - b) <= 1, hit = (a, b) => Math.min(a.r, b.r) - Math.max(a.l, b.l) > 1 && Math.min(a.b, b.b) - Math.max(a.t, b.t) > 1;
  if (o.screen !== 'none') bad.push('screen ' + o.screen);
  let prev = { id: 'h-map', b: o.m.b };
  for (const c of o.col) { if (!near(c.l, o.m.l) || !near(c.r, o.m.r)) bad.push(c.id + ' not the map\'s width'); const g = c.t - prev.b; if (g < 1 || g > 7) bad.push(c.id + ' ' + g.toFixed(1) + ' px under ' + prev.id); prev = c; }
  for (const c of o.col) for (const x of o.other) if (hit(c, x)) bad.push(c.id + ' over ' + x.id);
  for (const c of o.col) if (c.l < o.w * 0.6) bad.push(c.id + ' in the middle');
  if (o.lines > 3) bad.push('the big message in ' + o.lines + ' lines');
  if (o.out > 2) bad.push('a word of the big message ' + o.out + ' px out of its box');
  return bad;
}
// on to the race (the intro and the lights stepped, no gas: a software-drawn frame is slow)
const toRacing = (page) => page.evaluate(() => { const g = window.__game; g.pause(); for (let k = 0; k < 800 && g.phase !== 'racing'; k++) g.sim(0.05, false, 0, 0); g.resume(); return g.phase; });
const frames = (page, n = 2) => page.evaluate((n) => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
// the phone turned: the camera for that way first (no "turn the phone" notice), then the size
async function turn(page, o) { await page.evaluate((c) => { window.__game.S.camera = c; }, o.camera); await page.setViewportSize({ width: o.width, height: o.height }); await frames(page, 3); }
// the texts on: a big message, a toast and the radio (each for long enough), measured two drawn frames later
async function texts(page, msg, opt = {}) {
  await page.evaluate(([msg, toast, radio]) => { const g = window.__game; if (msg) g.msg(msg, 'gold', 60); if (toast) g.toast(toast, 60000);
    const r = document.getElementById('h-teamradio'); if (radio) { r.lastElementChild.textContent = radio; r.classList.add('on'); } }, [msg, opt.toast === undefined ? TOAST : opt.toast, opt.radio === undefined ? RADIO : opt.radio]);
  await frames(page, 3);
  return page.evaluate(MEASURE);
}
async function clear(page) { await page.evaluate(() => { document.getElementById('h-msg').className = ''; document.getElementById('toast').classList.remove('show'); document.getElementById('h-teamradio').classList.remove('on', 'wait'); }); await frames(page, 2); }
// the game's language (Nastavitve, as tests/browser/radio.test.mjs switches it), back in the race
const setLang = (page, l) => page.evaluate((l) => { const g = window.__game; g.pause(); g.onAction('to-settings'); document.querySelector(`[data-set="lang"] button[data-v="${l}"]`).click(); g.onAction('settings-done'); g.resume(); }, l);
// a state in both ways of holding the phone: on its side first, then upright; each measured and checked (want: the ids that must show)
async function both(page, name, msg, want, opt = {}) {
  const out = {};
  for (const k of ['land', 'port']) {
    await turn(page, OR[k]); if (opt.before) await opt.before(page, k);
    const o = await texts(page, msg, opt), ids = o.col.map(c => c.id), bad = wrong(o), all = k === 'port' ? want.concat(opt.radio === null ? [] : ['h-teamradio'], opt.toast === null ? [] : ['toast']) : want, need = all.filter(id => !ids.includes(id));
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `${name}-${k}.png`) });
    T.check(`${name}, ${k === 'land' ? 'on its side' : 'upright'}: ${all.join(', ')} under the map, its width, stacked; nothing over the middle or over the HUD`, !bad.length && !need.length,
      JSON.stringify({ bad, need, col: ids, wait: o.wait, msg: o.msg, lines: o.lines, fs: o.fs, rows: o.rows }));
    out[k] = o; await clear(page);
  }
  return out;
}

try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'low', shadows: 0, camera: 'chase', track: 'gozd', tower: 1, radio: 1, damage: 1, line: 0 }, { width: 640, height: 360 }, CTX);

  // 1. a race on a circuit (Bakreni gozd): the start (START!), a pit stop on the autopilot (the progress bar first under the map), the last lap
  await startTrack(page, 'gozd');
  await page.evaluate(() => Promise.all(['italic 800 32px ApexMenu', '700 9px ApexMenu'].map(f => document.fonts.load(f, 'AZaz09ČŠŽ'))));   // (the top left's face, as a phone draws it: the column is measured against its rows)
  await toRacing(page);
  await both(page, 'race-start', 'START!', ['h-msg']);
  // the longest big messages on the narrowest phone upright (360 px: the column 97 px wide) and on its side: at most three lines, no word out of its box
  const long = [];
  for (const k of ['port', 'land']) { await turn(page, OR[k]); for (const msg of LONG) { const o = await texts(page, msg, { toast: null, radio: null }); long.push({ k, msg, bad: wrong(o), lines: o.lines, out: o.out, fs: o.fs, icm: await page.evaluate(() => document.getElementById('h-msg').dataset.icm || 'left') }); await clear(page); } }
  T.check('the longest big messages (NE PREHITEVAJ DO CILJNE ČRTE, YOUR RIVAL RAN OVER SOMEONE ON FOOT, MISSION ACCOMPLISHED! ...) at 360x640 and 640x360: at most three lines, no word out of the box',
    long.length === LONG.length * 2 && long.every(o => !o.bad.length && o.lines >= 1 && o.lines <= 3), JSON.stringify(long.filter(o => o.bad.length || o.lines > 3).concat(long.filter(o => o.k === 'port').map(o => o.msg.slice(0, 12) + ' ' + o.lines + '@' + o.fs + ' ' + o.icm))));
  // no handbrake button on the screen (ROČNA, HANDBRAKE) in any steering mode, either way the phone is held: the brake and the gas side by side,
  // as tall as each other, apart; a touch where ROČNA was (above the brake) brakes, no handbrake
  const pedals = [];
  for (const k of ['land', 'port']) {
    await turn(page, OR[k]);
    for (const m of ['buttons', 'wheel', 'tilt']) {
      pedals.push(await page.evaluate(async (m) => { Input.setMode(m); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); Input.layout();
        const T = document.getElementById('touch'), vis = [...T.querySelectorAll('.tb, #c-wheel, #tilt-ind')].filter(e => e.offsetParent !== null && getComputedStyle(e).visibility !== 'hidden');
        const g = document.getElementById('c-gas').getBoundingClientRect(), b = document.getElementById('c-brake').getBoundingClientRect();
        const o = { m, w: innerWidth, ids: vis.map(e => e.id).join(), words: T.innerText.replace(/\s+/g, ' ').trim(), drift: !!document.getElementById('c-drift'), apart: b.right <= g.left || g.right <= b.left, tall: m === 'tilt' || (Math.abs(b.height - g.height) < 1 && Math.abs(b.bottom - g.bottom) < 1) };
        if (m === 'buttons') { const x = b.left + b.width / 2, y = b.top - 20;
          T.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 7, clientX: x, clientY: y, bubbles: true })); const s = Input.update(0.016); o.above = { brk: s.brk, hand: 'hand' in s };
          T.dispatchEvent(new PointerEvent('pointerup', { pointerId: 7, clientX: x, clientY: y, bubbles: true })); Input.update(0.016); }
        return o; }, m));
      if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `pedals-${m}-${k}.png`) });
    }
    await page.evaluate(() => Input.setMode('buttons')); await clear(page);
  }
  const PED = { buttons: 'c-left,c-right,c-brake,c-gas', wheel: 'c-wheel,c-brake,c-gas', tilt: 'c-brake,c-gas,tilt-ind' };
  T.check('no ROČNA (handbrake) button on the screen in any steering mode, on its side and upright: ZAVORA and PLIN side by side, as tall as each other (tilting: apart, the brake on the left); a touch where ROČNA was brakes',
    pedals.length === 6 && pedals.every(o => !o.drift && o.ids === PED[o.m] && !/ROČNA|HANDBRAKE/.test(o.words) && o.apart && o.tall) && pedals.filter(o => o.above).every(o => o.above.brk === 1 && o.above.hand === false), JSON.stringify(pedals));
  const entry = await page.evaluate(() => { const g = window.__game, P = g.race.player, Tt = document.getElementById('toast'); let e = null; g.pause(); P.dmg = 0.5;
    for (let k = 0; k < 6000 && !(P.pitState === 'repair' && P.pitT > 0.5); k++) { if (P.lap >= 1 && !P.repairN) P.pitWant = true; if (P.inPit || g.pitAuto.st) g.sim(1 / 60, false, 0, 0); else g.sim(0.1, true);
      if (!e && P.inPit) e = { toast: Tt.classList.contains('show') ? Tt.textContent : '', tag: g.toastTag }; }   // (the way in: the toast, what it is about)
    P.pitDur = Math.max(P.pitDur, P.pitT + 600); g.resume(); return e; });   // (the crew's work long enough for all the pictures)
  T.check('the way in: the toast "Sedaj lahko spustiš plin, vse bo naredil sam.", about the pit stop (gone with the autopilot)', !!entry && entry.toast === TOAST && entry.tag === 'pit', JSON.stringify(entry));
  const pit = await both(page, 'race-pits', 'BOKSI · AVTOPILOT', ['h-pit', 'h-msg']);
  T.check('the pit stop: the progress bar right under the map (upright under the tower), the big message under it', ['land', 'port'].every(k => { const c = rest(pit[k].col.map(c => c.id)); return c[0] === 'h-pit' && c[1] === 'h-msg' && (k === 'land' || ['h-tower', 'h-pit'].includes(pit[k].col[0].id)); }), JSON.stringify(['land', 'port'].map(k => pit[k].col.map(c => c.id))));
  // the pit stop in every way of steering, in Slovenian and in English, the stop's longest message with the toast and the radio: the bar and
  // the message right under the map, nothing over the HUD (tilting: no tilt meter while the autopilot steers, the phone's tilt not used); the
  // bar's title in its box (on one line down to 8 px, else two); upright nothing waits
  const steer = [], icons = [];
  for (const lang of ['sl', 'en']) {
    await setLang(page, lang); const L = PIT[lang];
    for (const k of ['land', 'port']) {
      await turn(page, OR[k]);
      for (const m of ['buttons', 'wheel', 'tilt']) {
        await page.evaluate((m) => Input.setMode(m), m); await frames(page, 2);
        const o = await texts(page, L.msg, { toast: L.toast, radio: L.radio }), ids = rest(o.col.map(c => c.id)), bad = wrong(o);
        const x = await page.evaluate(() => { const b = document.querySelector('#h-pit b'), r = b.getBoundingClientRect(), f = parseFloat(getComputedStyle(b).fontSize);
          return { title: b.textContent, tfs: f, tl: Math.round(r.height / (f * 1.15)), tout: b.scrollWidth - b.clientWidth, tilt: getComputedStyle(document.getElementById('tilt-ind')).display }; });
        steer.push({ lang, k, m, ok: !bad.length && ids[0] === 'h-pit' && ids[1] === 'h-msg' && (k === 'land' || !o.wait.length) && x.title === L.title && x.tfs >= 8 && x.tout <= 1 && (m !== 'tilt' || x.tilt === 'none'), bad, col: ids.join(), wait: o.wait, fs: o.fs, lines: o.lines, tfs: x.tfs, tl: x.tl, tilt: x.tilt });
        if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `pits-${lang}-${m}-${k}.png`) });
        await clear(page);
      }
      // each kind of big message with its icon, under the pit stop's panel (its wrench), with the toast (its "i") and the radio
      await page.evaluate(() => Input.setMode('buttons')); await frames(page, 2);
      for (const [tx, kind] of KINDS) {
        const msg = await page.evaluate((tx) => Lang.tr(...tx), tx), o = await texts(page, msg, { toast: L.toast, radio: L.radio }), x = await page.evaluate(ICONS), bad = wrong(o).concat(wrongIcons(x, kind));
        if (o.msg !== msg) bad.push('the message ' + o.msg + ', not ' + msg);
        icons.push({ lang, k, msg, kind, ok: !bad.length, bad, x });
        if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `icon-${lang}-${kind}-${k}-${tx[0].slice(0, 6).replace(/[^A-Z]/g, '')}.png`) });
        await clear(page);
      }
    }
  }
  T.check('the pit stop with buttons, the wheel and tilting, in Slovenian and in English, on its side and upright: the bar and the stop\'s longest message under the map, the toast and the radio under them (or waiting, on its side), nothing over the HUD; tilting: no tilt meter',
    steer.length === 12 && steer.every(s => s.ok), JSON.stringify(steer.filter(s => !s.ok).concat(steer.slice(0, 1))));
  T.check('the icons in Slovenian and in English, on its side and upright: each kind of big message its own at the left (ZADNJI KROG! a chequered flag, POPRAVILO a wrench, START! a green light, PREDRTA GUMA! and the overheating a warning triangle, DVOBOJ crossed swords, NOV REKORD! a star, BOKSI a pit board), as tall as its letters; the wrench on the pit stop\'s panel, the "i" on the toast; no text over its icon, the column as ever',
    icons.length === KINDS.length * 4 && icons.every(s => s.ok), JSON.stringify(icons.filter(s => !s.ok).slice(0, 4).concat(icons.slice(0, 1))));
  // a toast that finds no room (on its side, tilting, under the bar and a long message) waits 6 s at most, then is not shown any more
  await turn(page, OR.land); await page.evaluate(() => Input.setMode('tilt'));
  const capped = await page.evaluate(async ([msg, toast]) => { const g = window.__game, Tt = document.getElementById('toast'), o = { seen: 0, wait: 0 }; g.msg(msg, 'gold', 60); g.toast(toast, 1500);
    const t0 = performance.now(); await new Promise(res => { const f = () => { if (Tt.classList.contains('show') && getComputedStyle(Tt).visibility === 'visible') o.seen++; if (Tt.classList.contains('wait')) o.wait++; if (performance.now() - t0 > 8500) res(); else requestAnimationFrame(f); }; requestAnimationFrame(f); });
    o.show = Tt.classList.contains('show'); o.phase = g.phase; o.screen = g.screen; o.pit = g.race.player.pitState || ''; o.col = Tt.classList.contains('col'); return o; }, [PIT.en.msg, PIT.en.toast]);
  await clear(page);
  T.check('a toast with no room waits, at most 6 s, then is not shown any more (never late)', capped.wait > 0 && capped.seen === 0 && !capped.show, JSON.stringify(capped));
  // the toast of the way in, still up (waiting, or showing) at the hand-back: gone with the autopilot, never after VOZIŠ TI!; the tilt meter back
  const drop = await page.evaluate((txt) => { const g = window.__game, P = g.race.player, Tt = document.getElementById('toast'); g.pause(); g.toast(txt, 60000, 'pit'); const o = { before: Tt.classList.contains('show'), ap: document.getElementById('touch').classList.contains('ap') };
    P.pitDur = P.pitT + 0.1; for (let k = 0; k < 4000 && (g.pitAuto.st || P.inPit); k++) g.sim(1 / 60, false, 0, 0);
    Object.assign(o, { st: g.pitAuto.st, after: Tt.classList.contains('show'), msg: document.getElementById('h-msg').textContent, apAfter: document.getElementById('touch').classList.contains('ap') }); g.resume(); return o; }, PIT.en.toast);
  await frames(page, 2); drop.tilt = await page.evaluate(() => getComputedStyle(document.getElementById('tilt-ind')).display);
  T.check('the toast of the way in is gone at the hand-back (YOU DRIVE!), not shown while the player drives; the tilt meter back', drop.before && drop.ap && !drop.st && !drop.after && drop.msg === 'YOU DRIVE!' && !drop.apAfter && drop.tilt === 'flex', JSON.stringify(drop));
  await page.evaluate(() => Input.setMode('buttons')); await setLang(page, 'sl');
  await page.evaluate(() => { const g = window.__game, P = g.race.player; g.pause(); P.pitDur = P.pitT + 0.1; for (let k = 0; k < 4000 && (P.inPit || g.pitAuto.st || P.lap < g.race.laps); k++) { P.pitWant = false; if (P.inPit || g.pitAuto.st) g.sim(1 / 60, false, 0, 0); else g.sim(0.25, true); } g.resume(); });
  const last = await both(page, 'race-lastlap', 'ZADNJI KROG!', ['h-msg']);
  await page.evaluate(() => { window.__game.autoDrive = true; });   // (the race goes on in real time meanwhile: the car on the autopilot, not into a wall at full speed with no one at the wheel)
  await turn(page, OR.land);
  await page.waitForFunction(() => !document.getElementById('h-msg').classList.contains('show') && !document.getElementById('h-teamradio').classList.contains('on') && !document.getElementById('toast').classList.contains('show')
    && document.getElementById('h-tower').querySelectorAll('.tw-r').length >= 5, null, { timeout: 60000 }).catch(() => { });   // (the texts gone; the tower drawn again four times a second of the race)
  const alone = await page.evaluate(MEASURE), atw = alone.col.find(c => c.id === 'h-tower');
  await page.evaluate(() => { window.__game.autoDrive = false; });
  T.check('on its side, a race: the timing tower the column\'s last, fewer rows (or none) under the texts; alone under the map with all its rows',
    !!atw && alone.col.length === 1 && atw.t - alone.m.b <= 7 && alone.rows >= 5 && last.land.rows <= alone.rows && !wrong(alone).length, JSON.stringify({ last: last.land.col.map(c => c.id), rows: last.land.rows, alone: alone.col.map(c => c.id), aloneRows: alone.rows, bad: wrong(alone) }));
  T.check('upright everything at once (nothing waits); on its side what does not fit above the pedals waits (the toast first)', ['race-start', 'race-pits', 'race-lastlap'].length && [pit, last].every(s => !s.port.wait.length) && [pit, last].every(s => !s.land.wait.length || s.land.wait[0] === 'toast'),
    JSON.stringify([pit, last].map(s => ({ land: s.land.wait, port: s.port.wait }))));

  // 2. a time trial (Vršič): the height profile first under the map, the checkpoint's message under it
  const mode = async (id, md) => { await page.evaluate(async ([id, md]) => { const g = window.__game, wait = (ms) => new Promise(r => setTimeout(r, ms)); g.onAction('to-title'); await wait(250); g.onAction('to-track'); await wait(250);
    document.querySelector(`[data-track="${id}"]`).click(); await wait(150); const b = document.querySelector(`[data-track="${id}"] .tc-mode button[data-v="${md}"]`); if (b) { b.click(); await wait(150); } g.onAction('start');
    for (let k = 0; k < 1200 && !(g.race && g.race.track.def.id === id && g.S.mode === md); k++) await wait(100); }, [id, md]); await toRacing(page); };
  await turn(page, OR.land);
  await mode('vrsic', 'tt');
  await page.evaluate(() => window.__game.sim(4, true));
  const tt = await both(page, 'timetrial', 'CP1 -0.42', ['h-msg'], { radio: null });
  T.check('a time trial: the height profile right under the map, the message under it', ['land', 'port'].every(k => { const c = rest(tt[k].col.map(c => c.id)); return c[0] === 'h-prof' && c[1] === 'h-msg' && tt[k].col[0].id === 'h-prof'; }), JSON.stringify(['land', 'port'].map(k => tt[k].col.map(c => c.id))));
  // its finish: NOV REKORD! (or CILJ! ±) and under it the splits, in the column until the results (each point and its time, the first run
  // here; over 10 minutes the widest), not in the middle of the track; on its side, then upright
  await turn(page, OR.land);
  await page.evaluate(() => { const g = window.__game, P = g.race.player, Tk = g.race.track; P.splits = Tk.cpS.map((_, k) => 120 * (k + 1)); P.finishTime = 640; P.finished = true; });
  await page.waitForFunction(() => document.getElementById('h-ttsp').classList.contains('show'), null, { timeout: 30000 });
  const fin = [];
  for (const k of ['land', 'port']) {
    if (k === 'port') await turn(page, OR.port); else await frames(page, 2);
    const o = await page.evaluate(MEASURE), x = await page.evaluate(() => { const X = document.getElementById('h-ttsp'); return { rows: X.querySelectorAll('tr').length, out: X.scrollWidth - X.clientWidth, fs: parseFloat(getComputedStyle(X).fontSize), txt: X.innerText.replace(/\s+/g, ' ').trim(), phase: window.__game.phase }; });
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `timetrial-finish-${k}.png`) });
    const ids = o.col.map(c => c.id), bad = wrong(o);
    fin.push({ k, ok: !bad.length && x.phase === 'finish' && ids.indexOf('h-ttsp') === ids.indexOf('h-msg') + 1 && ids.indexOf('h-msg') >= 0 && x.out <= 1 && x.fs >= 8 && /10:40\.000/.test(x.txt), bad, col: ids.join(), ...x });
  }
  T.check('a time trial\'s finish: the splits right under the message in the column (the map\'s width, in their box), not in the middle of the track, until the results', fin.every(f => f.ok), JSON.stringify(fin));
  // 3. the run from the police (Vršič): the checkpoint's panel at the top, the police's radio at the bottom
  await mode('vrsic', 'police');
  await page.evaluate(() => window.__game.sim(3, true));
  await both(page, 'police', 'POLICIJA TE LOVI!', ['h-msg'], { radio: null, toast: 'Misija: pripelji avto do garaže na vrhu Vršiča (desno ob cesti, takoj za prelazom).' });
  // 4. the duel in the traffic (Vršič)
  await mode('vrsic', 'traffic');
  await page.evaluate(() => window.__game.sim(3, true));
  await both(page, 'duel', 'DVOBOJ V PROMETU!', ['h-msg'], { radio: null });
  // 5. Pikes Peak (a time trial of its own: the class, the splits, the corner warnings)
  await turn(page, OR.land);
  await startTrack(page, 'pikes');
  await toRacing(page);   // (past the flyover)
  await page.evaluate(() => window.__game.sim(6, true));
  await both(page, 'pikes', 'VZPON NA VRH!', ['h-msg'], { radio: null });
  // 6. the driving school (the start)
  await turn(page, OR.land);
  await page.evaluate(async () => { const g = window.__game; g.onAction('to-title'); await new Promise(r => setTimeout(r, 250)); g.onAction('to-school'); await new Promise(r => setTimeout(r, 300));
    g.onAction('school-go', document.querySelector('[data-act="school-go"][data-lesson="start"]')); });
  await page.waitForFunction(() => { const g = window.__game; return g.school && g.school.id === 'start' && g.race; }, null, { timeout: 90000 }); await toRacing(page);
  await both(page, 'school', 'ZLATO!', ['h-msg'], { radio: null });
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
  await page.context().close();

  // 7. a race with a friend over the internet (a PeerJS server of the test's own): one phone upright, the other on its side
  const { PeerServer } = require('peer');
  const port = await new Promise((resolve) => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => resolve(p)); }); });
  const peerHttp = await new Promise((resolve) => PeerServer({ port, host: '127.0.0.1', path: '/' }, resolve));
  try {
    const init = { content: `window.__peerOpts = ${JSON.stringify({ host: '127.0.0.1', port, path: '/', secure: false, config: { iceServers: [] } })};` };
    const open = (name, car, o) => openGame(browser, srv.base + '/index.html', { name, car, quality: 'low', shadows: 0, camera: o.camera }, { width: o.width, height: o.height }, Object.assign({ init }, CTX));
    const A = await open('Ana', 0, OR.port), B = await open('Bor', 2, OR.land);
    const until = (p, fn, ms = 60000) => p.waitForFunction(fn, null, { timeout: ms, polling: 200 }).then(h => h.jsonValue());
    await A.page.evaluate(() => { window.__game.onAction('to-online'); window.__game.onAction('net-host'); });
    const code = await until(A.page, () => { const n = window.__game.net; return n && n.code && n.code.length === 4 ? n.code : null; });
    await B.page.evaluate((code) => { window.__game.onAction('to-online'); document.getElementById('on-code').value = code; window.__game.onAction('net-join'); }, code);
    await until(B.page, () => { const n = window.__game.net; return !!(n && n.open && n.peer && n.synced); });
    await A.page.evaluate(() => { const t = document.getElementById('on-track'); t.value = 'jezero'; t.dispatchEvent(new Event('change')); });
    await until(B.page, () => window.__game.net.track === 'jezero');
    await A.page.evaluate(() => window.__game.onAction('net-go'));
    for (const x of [A, B]) await until(x.page, () => { const n = window.__game.net; return !!(n && n.race && n.race.startT != null); }, 90000);
    for (const [x, k] of [[A, 'port'], [B, 'land']]) {
      await x.page.waitForFunction(() => { const e = document.getElementById('h-lights'); return window.__game.phase === 'racing' && !e.classList.contains('show') && +getComputedStyle(e).opacity < 0.01; }, null, { timeout: 60000 }).catch(() => { });   // (the start lights gone, faded out too (.25 s): the column stops above them while they show. Racing: before the intro is over the lights are not up yet)
      const o = await texts(x.page, 'START!', { radio: null }), bad = wrong(o), ids = o.col.map(c => c.id);
      if (SHOTS) await x.page.screenshot({ path: path.join(SHOTS, `online-${k}.png`) });
      T.check(`a race with a friend, ${k === 'land' ? 'on its side' : 'upright'}: the message and the toast under the map, its width, stacked; nothing over the middle or over the HUD`, !bad.length && ids.includes('h-msg') && (k === 'land' || ids.includes('toast')), JSON.stringify({ bad, col: ids, wait: o.wait }));
    }
    T.check('no page errors (online)', !A.errors.length && !B.errors.length, A.errors.concat(B.errors).slice(0, 4).join(' | '));
  } finally { peerHttp.closeAllConnections(); peerHttp.close(); }
} catch (e) {
  T.check('the test ran through', false, String(e && e.stack || e).split('\n').slice(0, 3).join(' '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
process.exit(process.exitCode || 0);   // (the PeerJS server library keeps a timer running)
