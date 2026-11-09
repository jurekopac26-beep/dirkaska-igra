// Orodje za napake · seznama posnetkov in napak (sklop 21 of docs/orodje-za-napake.md; js/napake.js vrstica, avtoVrstica, vec, zgEna, pzZaZg, igralecH):
// Bathurst at 25 s by the quick entry (a page with a mouse and a touch screen), a moment kept in the replay and the game left with Da: the entry of
// Zadnji posnetki and the record of Zgodovina napak both have the player's car (as the game names it) and "ni do cilja". Recordings over the finish
// show their time in green (KOLIBRI · 1:23.456; "do cilja" where the time is not known) and a green edge; a recording kept before the lists had the car
// and the time gets both from its header (and keeps them); Samo do cilja and the count Do cilja: k od n. Nastavitve and Zgodovina napak say where
// the recordings for download are (a link to Zadnji posnetki). A tap on a picture shows it over the whole window (a tap on it, Esc or Zapri closes it;
// the panel below stays, the entry is not opened), by mouse and by touch, on its side and upright. The old records (the pictures out, no pictures at
// all, no small picture, no car) open by mouse and by touch; a record whose recording is still kept has Odpri posnetek and Shrani .rrp.
//   node tests/browser/napake-seznami.test.mjs
import fs from 'node:fs';
import path from 'node:path';
import { serve, launch, openGame, checker, REPO } from './lib.mjs';

const T = checker('napake-seznami');
const srv = await serve();
const browser = await launch();
const OUT = path.join(REPO, 'test-results', 'napake-seznami'); fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const reEsc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const DATE = '\\d+\\. \\d+\\. \\d{4} \\d\\d:\\d\\d';
// a moment kept: Označi, a loop (an ellipse round cx, cy) in colour c with its note, Dodaj k zbirki
async function moment(Q, c, cx, cy, r, note) {
  await Q.click('#nk-on');
  await Q.click(`#nk-pal [data-c="${c}"]`);
  await Q.mouse.move(cx + r, cy); await Q.mouse.down(); for (let a = 0.2; a <= 2 * Math.PI + 0.25; a += 0.2) await Q.mouse.move(cx + r * Math.cos(a), cy + 0.7 * r * Math.sin(a)); await Q.mouse.up();
  if (note) { await Q.focus('#nk-note textarea'); await Q.keyboard.type(note); }   // (the note under the loop: on a touch screen the keyboard is not in it until it is tapped; main, Beležka v barvi svinčnika)
  await Q.click('#nk-bar .nk-add');
}
try {
  const { page: Q, errors } = await openGame(browser, srv.base + '/index.html?proga=bathurst&t=25', { quality: 'normal', shadows: 0, camera: 'chase' }, { width: 640, height: 360 }, { touch: true, context: { acceptDownloads: true } });
  await Q.waitForFunction(() => window.__game.quick && window.__game.quick.done, null, { timeout: 240000, polling: 250 });
  const nk = () => Q.evaluate(() => Napake.stanje);
  // a tap by touch (the element scrolled into view first), a click by mouse
  const touch = async (sel) => { await Q.locator(sel).first().scrollIntoViewIfNeeded(); const p = await Q.evaluate((sel) => { const b = document.querySelector(sel).getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; }, sel); await Q.touchscreen.tap(p[0], p[1]); };
  const fits = (sel) => Q.evaluate((sel) => { const box = document.querySelector(sel + ' .nk-box'), b = box.getBoundingClientRect(), W = innerWidth, H = innerHeight;
    const out = [...box.querySelectorAll('button')].filter(e => e.offsetParent).map(e => e.getBoundingClientRect()).filter(r => r.left < b.left - 0.5 || r.right > b.right + 0.5);
    const rows = [...box.querySelectorAll('.nk-item')].filter(e => e.offsetParent).map(e => e.getBoundingClientRect());
    return { box: b.left >= 0 && b.top >= 0 && b.right <= W && b.bottom <= H, wide: box.scrollWidth <= box.clientWidth + 1, out: out.length, rows: rows.length, rowsIn: rows.every(r => r.right <= b.right + 0.5 && r.left >= b.left - 0.5), W, H }; }, sel);
  const fitOk = (f) => f.box && f.wide && f.out === 0 && f.rowsIn;

  // 1. a real race: a moment kept in its replay, its picture made (the record of Zgodovina napak), the game left with Da (the recording kept)
  await Q.evaluate(() => window.__game.resume()); await Q.waitForTimeout(300);
  await Q.evaluate(() => window.__game.pause()); await Q.click('#pause-rp'); await Q.waitForTimeout(300);
  await Q.evaluate(() => window.__game.onAction('rp-b5'));
  await moment(Q, 0, 250, 150, 40, 'Avto skoči čez robnik');
  const car = await Q.evaluate(() => Core.heirOf(window.__game.race.player.m).name);
  const h1 = await Q.evaluate(async () => { const r = await Napake.pripravi(); return { id: r.id, car: r.car, fin: r.fin, time: r.time }; });
  await Q.evaluate(() => window.__game.onAction('rp-race')); await Q.evaluate(() => window.__game.pause());
  await Q.click('#s-pause [data-act="to-title"]'); await Q.waitForSelector('#nk-vpr [data-v="da"]'); await Q.click('#nk-vpr [data-v="da"]');
  const kept = () => Q.evaluate(async () => { await new Promise(r => setTimeout(r, 450)); await Napake.pz.cakaj(); return (await Napake.pz.vsi()).map(o => ({ id: o.id, car: o.car, fin: o.fin, time: o.time, bytes: o.bytes, zb: o.zb && o.zb.id })); });
  const k1 = await kept(), real = k1[0] || {};
  T.check('the new record (Zgodovina napak) and the recording kept (Zadnji posnetki) have the player\'s car as the game names it, not over the finish, no time; they are of one collection',
    car.length > 2 && h1.car === car && h1.fin === 0 && h1.time === 0 && k1.length === 1 && real.car === car && real.fin === 0 && real.time === 0 && real.zb === h1.id, JSON.stringify({ car, h1, k1 }));

  // 2. more records: recordings over the finish (the time known, not known) and three kept before the lists had the car and the time (the header
  // of the file has them); a bad file; the history's records of every shape (an old one: its pictures out; none at all; no small picture) and one over the finish
  const S = await Q.evaluate(async () => {
    const o = (await Napake.pz.vsi())[0], { H, frames } = await Napake.rrp.beri(o.blob), t0 = o.date, nm = (id) => Core.heirOf(Core.MODELS.find(m => m.id === id)).name;
    const ms = []; for (const m of Core.MODELS) if (!ms.some(x => nm(x.id) === nm(m.id))) ms.push(m);
    const pz = async (id, dt, patch, f, old) => {
      const H2 = JSON.parse(JSON.stringify(H)); Object.assign(H2.cars.find(c => c.pl), patch);
      const blob = new Blob([Napake.rrp.pack(H2, frames)], { type: 'application/octet-stream' }), r = Object.assign({}, o, { id, date: t0 - dt * 1000, name: 'posnetek_bathurst_' + id + '.rrp', blob, bytes: blob.size, zb: null }, f);
      if (old) { delete r.car; delete r.time; }
      await Napake.pz.put(r);
    };
    await pz('pz-a-cilj', 10, {}, { fin: 1, car: 'KOLIBRI', time: 83.456 });
    await pz('pz-b-cas', 20, {}, { fin: 1, car: 'KOLIBRI', time: 0 });
    await pz('pz-c-staro-cilj', 30, { m: ms[1].id, fin: 1, ft: 71.234 }, { fin: 1 }, true);
    await pz('pz-d-staro-ne', 40, { m: ms[2].id }, { fin: 0 }, true);
    await pz('pz-f-povezan', 50, { m: ms[3].id, fin: 1, ft: 65.4 }, { fin: 1, zb: { id: 'h-povezan', d0: 0, items: [], as: [] } }, true);
    await Napake.pz.put(Object.assign({}, o, { id: 'pz-e-pokvarjen', date: t0 - 60000, name: 'posnetek_bathurst_e.rrp', blob: new Blob([new Uint8Array(300).fill(7)]), bytes: 300, zb: null, fin: 0, car: undefined, time: undefined }));
    const c = document.createElement('canvas'); c.width = 320; c.height = 180; const x = c.getContext('2d'); x.fillStyle = '#3a6'; x.fillRect(0, 0, 320, 180); x.fillStyle = '#fc3'; x.fillRect(40, 40, 120, 80);
    const jpg = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.8)), png = await new Promise(r => c.toBlob(r, 'image/png')), now = Date.now();
    const zg = (id, dt, f) => Napake.zg.put(Object.assign({ id, name: 'napake_' + id, date: now - dt * 60000, track: 'bathurst', tname: 'Bathurst, Avstralija', n: 1, flags: 0, text: 'RRA-NAPAKE ' + id, status: 'neposlano' }, f));
    await zg('h-staro', 10, { n: 2, flags: 1, status: 'poslano', files: [], nf: 2, thumb: jpg });   // (an old one: the pictures out, the small one and the text kept)
    await zg('h-brez-slik', 20, { thumb: jpg });   // (no files at all)
    await zg('h-brez-male', 30, { files: [{ name: 'h.png', blob: png, w: 320, h: 180 }], thumb: null });
    await zg('h-cilj', 40, { files: [{ name: 'h2.png', blob: png, w: 320, h: 180 }], thumb: jpg, car: 'KOLIBRI', fin: 1, time: 83.456 });
    await zg('h-povezan', 50, { files: [], nf: 1, thumb: jpg });   // (no car in it: its recording says)
    return { names: ms.slice(0, 4).map(m => nm(m.id)) };
  });
  await Q.evaluate(() => Napake.zadnji());
  await Q.waitForFunction(() => document.querySelectorAll('#nk-pz .nk-pzi').length === 7, null, { timeout: 15000, polling: 100 });
  const pz = (await nk()).pz;
  const nameAt = (i) => reEsc(S.names[i]);
  T.check('Zadnji posnetki: the entry of the race (the car · ni do cilja), one over the finish with its time (KOLIBRI · 1:23.456), one over it with no time (KOLIBRI · do cilja), the old ones with the car and the time from their files, a bad file with neither',
    pz.length === 7 && new RegExp('^Bathurst, Avstralija ' + reEsc(car) + ' · ni do cilja ' + DATE + ' · dirka · 2 kroga · 0:\\d\\d 1 trenutek · \\d+ KB Nedokončana$').test(pz[0]) &&
    new RegExp('^Bathurst, Avstralija KOLIBRI · 1:23\\.456 ' + DATE + ' · .* Do cilja$').test(pz[1]) && new RegExp('^Bathurst, Avstralija KOLIBRI · do cilja ' + DATE + ' · .* Do cilja$').test(pz[2]) &&
    new RegExp('^Bathurst, Avstralija ' + nameAt(1) + ' · 1:11\\.234 ' + DATE + ' · .* Do cilja$').test(pz[3]) && new RegExp('^Bathurst, Avstralija ' + nameAt(2) + ' · ni do cilja ' + DATE + ' · .* Nedokončana$').test(pz[4]) &&
    new RegExp('^Bathurst, Avstralija ' + nameAt(3) + ' · 1:05\\.400 ' + DATE + ' · .* Do cilja$').test(pz[5]) && new RegExp('^Bathurst, Avstralija ni do cilja ' + DATE + ' · .* Nedokončana$').test(pz[6]), JSON.stringify({ pz, names: S.names }));
  const cl = await Q.evaluate(() => ({ cilj: document.querySelectorAll('#nk-pz .nk-pzi .nk-item.cilj').length, ok: [...document.querySelectorAll('#nk-pz .nk-car .nk-ok')].map(e => e.textContent), no: document.querySelectorAll('#nk-pz .nk-car .nk-no').length,
    hn: document.querySelector('#nk-pz .nk-pz-hn').textContent, col: getComputedStyle(document.querySelector('#nk-pz .nk-car .nk-ok')).color, edge: getComputedStyle(document.querySelector('#nk-pz .nk-item.cilj')).boxShadow }));
  T.check('over the finish at first glance: 4 entries with the green edge, their time (or do cilja) in green, 3 others without; the count "Do cilja: 4 od 7"', cl.cilj === 4 && cl.ok.join() === '1:23.456,do cilja,1:11.234,1:05.400' && cl.no === 3 && cl.hn === 'Do cilja: 4 od 7' && /76, 217, 100/.test(cl.col) && /76, 217, 100/.test(cl.edge), JSON.stringify(cl));
  const old = await Q.evaluate(async () => (await Napake.pz.vsi()).filter(o => /staro|pokvarjen|povezan/.test(o.id)).map(o => ({ id: o.id, car: o.car, time: o.time })));
  const byId = Object.fromEntries(old.map(o => [o.id, o]));
  T.check('a recording kept before the lists had them gets the car and the time from its header, and keeps them (the finished one its time, the other 0); a bad file: no car (an empty one), no error',
    byId['pz-c-staro-cilj'].car === S.names[1] && byId['pz-c-staro-cilj'].time === 71.234 && byId['pz-d-staro-ne'].car === S.names[2] && byId['pz-d-staro-ne'].time === 0 && byId['pz-f-povezan'].car === S.names[3] && byId['pz-f-povezan'].time === 65.4 &&
    byId['pz-e-pokvarjen'].car === '' && byId['pz-e-pokvarjen'].time === 0, JSON.stringify(old));
  // Samo do cilja
  await Q.click('#nk-pz [data-nk-d="cilj"]'); await Q.waitForFunction(() => document.querySelectorAll('#nk-pz .nk-pzi').length === 4, null, { timeout: 10000, polling: 100 });
  const f1 = await Q.evaluate(() => ({ n: document.querySelectorAll('#nk-pz .nk-pzi').length, fin: document.querySelectorAll('#nk-pz .nk-pzi .nk-item.cilj').length, pressed: document.querySelector('#nk-pz [data-nk-d="cilj"]').getAttribute('aria-pressed'), sel: document.querySelector('#nk-pz [data-nk-d="cilj"]').classList.contains('sel') }));
  await Q.click('#nk-pz [data-nk-d="cilj"]'); await Q.waitForFunction(() => document.querySelectorAll('#nk-pz .nk-pzi').length === 7, null, { timeout: 10000, polling: 100 });
  const f2 = await Q.evaluate(() => document.querySelector('#nk-pz [data-nk-d="cilj"]').getAttribute('aria-pressed'));
  T.check('Samo do cilja: only the 4 recordings over the finish (the button pressed); again: all 7 (not pressed)', f1.n === 4 && f1.fin === 4 && f1.pressed === 'true' && f1.sel && f2 === 'false', JSON.stringify({ f1, f2 }));

  // 3. Zgodovina napak: the entries (the car and the result, an old record from its recording), the hint to Zadnji posnetki
  await Q.click('#nk-pz [data-nk-d="zg"]'); await Q.waitForFunction(() => document.querySelectorAll('#nk-zg .nk-item').length === 6, null, { timeout: 15000, polling: 100 });
  await Q.waitForTimeout(300);
  const items = await Q.evaluate(() => [...document.querySelectorAll('#nk-zg .nk-item')].map(e => ({ id: e.querySelector('.nk-bd').dataset.id, t: e.innerText.replace(/\s+/g, ' ').trim(), cilj: e.classList.contains('cilj') })));
  const at = Object.fromEntries(items.map(i => [i.id, i]));
  T.check('Zgodovina napak: the new record has the car · ni do cilja, the one over the finish KOLIBRI · 1:23.456 (green edge), the old one linked to its recording the car and time of the file (KOLIBRI-like, 1:05.400), the others without a car line',
    new RegExp('^Bathurst, Avstralija ' + reEsc(car) + ' · ni do cilja ' + DATE + ' · 1 trenutek · 0 zastavic Neposlano$').test(at[h1.id].t) && !at[h1.id].cilj &&
    new RegExp('^Bathurst, Avstralija KOLIBRI · 1:23\\.456 ' + DATE + ' · 1 trenutek · 0 zastavic Neposlano$').test(at['h-cilj'].t) && at['h-cilj'].cilj &&
    new RegExp('^Bathurst, Avstralija ' + nameAt(3) + ' · 1:05\\.400 ' + DATE + ' · 1 trenutek · 0 zastavic · mala slika Neposlano$').test(at['h-povezan'].t) && at['h-povezan'].cilj &&
    new RegExp('^Bathurst, Avstralija ' + DATE + ' · 2 trenutka · 1 zastavica · 2 slike · mala slika Poslano$').test(at['h-staro'].t) && !at['h-staro'].cilj &&
    new RegExp('^Bathurst, Avstralija ' + DATE + ' · 1 trenutek · 0 zastavic · mala slika Neposlano$').test(at['h-brez-slik'].t) && new RegExp('^Bathurst, Avstralija ' + DATE + ' · 1 trenutek · 0 zastavic Neposlano$').test(at['h-brez-male'].t), JSON.stringify(items));
  await Q.waitForFunction(async () => (await Napake.shranjene()).some(r => r.id === 'h-povezan' && r.car !== undefined), null, { timeout: 10000, polling: 100 });
  const kept2 = await Q.evaluate(async () => (await Napake.shranjene()).filter(r => r.id === 'h-povezan').map(r => ({ car: r.car, fin: r.fin, time: r.time })));
  T.check('the old record linked to its recording keeps the car and the time it got (in case the recording goes)', kept2.length === 1 && kept2[0].car === S.names[3] && kept2[0].fin === 1 && kept2[0].time === 65.4, JSON.stringify(kept2));
  const hint = await Q.evaluate(() => { const l = document.querySelector('#nk-zg .nk-pz-hint .nk-lnk'); return { text: document.querySelector('#nk-zg .nk-pz-hint').textContent, link: l && l.textContent, vis: !!l && l.getBoundingClientRect().height > 8 }; });
  await Q.click('#nk-zg .nk-pz-hint .nk-lnk'); await Q.waitForSelector('#nk-pz .nk-pzi');
  const hint2 = await Q.evaluate(() => ({ pz: !!document.getElementById('nk-pz'), zgGone: !document.getElementById('nk-zg') || [...document.querySelectorAll('.nk-dlg')].map(d => d.id).join() }));
  T.check('Zgodovina napak says it holds the pictures of errors, not the races\' recordings, and where those are: a link (Zadnjih posnetkih) that opens Zadnji posnetki',
    /ne posnetki dirk/.test(hint.text) && /\.rrp/.test(hint.text) && hint.link === 'Zadnjih posnetkih' && hint.vis && hint2.pz, JSON.stringify({ hint, hint2 }));
  await Q.click('#nk-pz [data-nk-d="zapri"]');
  // the settings: the same, the counts of the recordings
  await Q.evaluate(() => Napake.nastavitve()); await Q.waitForFunction(() => /\(7\/10\)/.test((document.querySelector('#nk-set .nk-pz-n') || {}).textContent || '') && /do cilja: 4/.test((document.querySelector('#nk-set .nk-pz-c') || {}).textContent || ''), null, { timeout: 15000, polling: 100 });
  const st = await Q.evaluate(() => ({ hints: [...document.querySelectorAll('#nk-set .nk-hint')].map(e => e.textContent).filter(t => /rrp/.test(t)), links: [...document.querySelectorAll('#nk-set .nk-lnk')].map(e => e.textContent) }));
  await Q.click('#nk-set .nk-lnk'); await Q.waitForSelector('#nk-pz .nk-pzi');
  const st2 = await Q.evaluate(() => [...document.querySelectorAll('.nk-dlg')].map(d => d.id).join());
  T.check('Nastavitve orodja: Zadnji posnetki (7/10) do cilja: 4, a line saying they are the races\' recordings for download (.rrp) with the finished ones green, and a link in the Zgodovina napak line that opens them',
    st.hints.length >= 2 && st.hints.some(t => /Posnetki dirk za prenos/.test(t)) && st.hints.some(t => /ne posnetki dirk/.test(t)) && st.links.join() === 'Zadnjih posnetkih' && /nk-pz/.test(st2), JSON.stringify({ st, st2 }));
  await Q.click('#nk-pz [data-nk-d="zapri"]'); await Q.click('#nk-set [data-nk-d="zapri"]');

  // 4. a tap on a picture: it larger over the whole window, the panel below stays, the entry is not opened; by mouse and by touch; Esc, a tap on it, Zapri
  const bigState = async () => (await nk()).big;
  await Q.evaluate(() => Napake.zgodovina()); await Q.waitForFunction(() => document.querySelectorAll('#nk-zg .nk-item').length === 6, null, { timeout: 15000, polling: 100 });
  const open = async (how, sel) => { if (how === 'mouse') await Q.click(sel); else await touch(sel); await Q.waitForSelector('#nk-big img'); await Q.waitForFunction(() => { const i = document.querySelector('#nk-big img'); return i && i.complete && i.naturalWidth > 0; }, null, { timeout: 10000, polling: 50 }); };
  const bigInfo = () => Q.evaluate(() => { const d = document.getElementById('nk-big'), i = d.querySelector('img'), r = i.getBoundingClientRect(), th = document.querySelector('#nk-zg .nk-th img, #nk-pz .nk-th img'), t = th ? th.getBoundingClientRect() : { width: 0 };
    return { w: d.getBoundingClientRect().width, h: d.getBoundingClientRect().height, W: innerWidth, H: innerHeight, iw: r.width, ih: r.height, inside: r.left >= -0.5 && r.top >= -0.5 && r.right <= innerWidth + 0.5 && r.bottom <= innerHeight + 0.5, tw: t.width, nat: i.naturalWidth,
      cap: d.querySelector('.nk-big-c').textContent, top: document.elementFromPoint(innerWidth / 2, innerHeight / 2).closest('#nk-big') !== null, zg: !!document.getElementById('nk-zg'), sts: !!document.querySelector('#nk-zg .nk-sts') }; });
  for (const how of ['mouse', 'touch']) {
    await open(how, '#nk-zg .nk-item.cilj .nk-th');
    const b = await bigInfo();
    T.check(how + ': a tap on the picture of an entry shows it over the whole window (' + b.W + ' × ' + b.H + ': the picture inside it, bigger than the thumbnail, the caption with the track and the date), the list below is not opened',
      Math.abs(b.w - b.W) < 1 && Math.abs(b.h - b.H) < 1 && b.inside && b.iw > b.tw * 3 && b.nat === 320 && /^Bathurst, Avstralija · \d+\. \d+\. \d{4} \d\d:\d\d$/.test(b.cap) && b.top && b.zg && !b.sts, JSON.stringify(b));
    await Q.keyboard.press('Escape'); await Q.waitForTimeout(100);
    const e1 = await Q.evaluate(() => ({ big: !!document.getElementById('nk-big'), zg: !!document.getElementById('nk-zg'), sts: !!document.querySelector('#nk-zg .nk-sts') }));
    await open(how, '#nk-zg .nk-item.cilj .nk-th');
    if (how === 'mouse') await Q.mouse.click(300, 200); else await Q.touchscreen.tap(300, 200);
    await Q.waitForTimeout(100);
    const e2 = await Q.evaluate(() => ({ big: !!document.getElementById('nk-big'), zg: !!document.getElementById('nk-zg'), sts: !!document.querySelector('#nk-zg .nk-sts') }));
    await open(how, '#nk-zg .nk-item.cilj .nk-th'); await (how === 'mouse' ? Q.click('#nk-big .nk-big-x') : touch('#nk-big .nk-big-x')); await Q.waitForTimeout(100);
    const e3 = await Q.evaluate(() => ({ big: !!document.getElementById('nk-big'), zg: !!document.getElementById('nk-zg') }));
    T.check(how + ': Esc closes only the picture (the list stays, no record opened); so does a tap on it and Zapri', !e1.big && e1.zg && !e1.sts && !e2.big && e2.zg && !e2.sts && !e3.big && e3.zg, JSON.stringify({ e1, e2, e3 }));
  }
  // the text of the entry still opens it; the picture of the record, the picture of Zadnji posnetki
  await Q.click('#nk-zg .nk-bd[data-id="h-cilj"]'); await Q.waitForSelector('#nk-zg .nk-sts');
  await open('mouse', '#nk-zg .nk-prev-b'); const bp = await bigInfo(); await Q.keyboard.press('Escape'); await Q.waitForTimeout(100);
  const e4 = await Q.evaluate(() => ({ big: !!document.getElementById('nk-big'), sts: !!document.querySelector('#nk-zg .nk-sts'), id: Napake.stanje.zg.id }));
  T.check('a tap on the text of the entry opens the record; its picture also opens larger (Esc: back in the record)', bp.cap.startsWith('Bathurst, Avstralija') && bp.iw > 200 && !e4.big && e4.sts && e4.id === 'h-cilj', JSON.stringify({ bp, e4 }));
  await Q.click('#nk-zg [data-nk-d="zapri"]');
  await Q.evaluate(() => Napake.zadnji()); await Q.waitForFunction(() => document.querySelectorAll('#nk-pz .nk-pzi').length === 7, null, { timeout: 15000, polling: 100 });
  await open('mouse', '#nk-pz .nk-pzi:first-child .nk-th'); const bz = await bigInfo(); await Q.keyboard.press('Escape'); await Q.waitForTimeout(100);
  await open('touch', '#nk-pz .nk-pzi:nth-child(2) .nk-th'); const bz2 = await bigInfo(); await Q.touchscreen.tap(200, 120); await Q.waitForTimeout(100);
  const e5 = await Q.evaluate(() => ({ big: !!document.getElementById('nk-big'), pz: document.querySelectorAll('#nk-pz .nk-pzi').length, replay: !!window.__game.replay }));
  T.check('Zadnji posnetki: the first moment\'s picture (the race) and the track\'s picture (the others) open larger by mouse and by touch, over the window; the list stays, no recording opened',
    Math.abs(bz.w - bz.W) < 1 && bz.inside && bz.iw > bz.tw * 3 && /^Bathurst, Avstralija · .* · ni do cilja$/.test(bz.cap) && bz.cap.includes(car) && Math.abs(bz2.h - bz2.H) < 1 && bz2.inside && /KOLIBRI · 1:23\.456$/.test(bz2.cap) && !e5.big && e5.pz === 7 && !e5.replay, JSON.stringify({ bz, bz2, e5 }));

  // 5. every record opens (the old ones too), by mouse and by touch: the picture or its absence, the buttons, the car line, the recording's buttons
  const recs = { 'h-staro': { shrani: 'Shrani malo sliko', pzl: [], notIn: true }, 'h-brez-slik': { shrani: 'Shrani malo sliko', pzl: [], notIn: true }, 'h-brez-male': { shrani: 'Shrani sliko', pzl: [], notIn: true },
    'h-cilj': { shrani: 'Shrani sliko', pzl: [], notIn: true, car: /KOLIBRI.*1:23\.456/ }, 'h-povezan': { shrani: 'Shrani malo sliko', pzl: ['Odpri posnetek', 'Shrani .rrp'], car: new RegExp(nameAt(3) + '.*1:05\\.400') } };
  recs[h1.id] = { shrani: 'Shrani sliko', pzl: ['Odpri posnetek', 'Shrani .rrp'], car: new RegExp(reEsc(car) + '.*ni do cilja') };
  await Q.click('#nk-pz [data-nk-d="zg"]'); await Q.waitForFunction(() => document.querySelectorAll('#nk-zg .nk-item').length === 6, null, { timeout: 15000, polling: 100 });
  const res = {};
  for (const how of ['mouse', 'touch']) for (const id of Object.keys(recs)) {
    const sel = '#nk-zg .nk-bd[data-id="' + id + '"]';
    if (how === 'mouse') await Q.click(sel); else await touch(sel);
    await Q.waitForSelector('#nk-zg .nk-sts', { timeout: 10000 }).catch(() => { });
    await Q.waitForFunction(() => { const e = document.querySelector('#nk-zg .nk-pzl'); return !!e && e.textContent.length > 0; }, null, { timeout: 10000, polling: 50 }).catch(() => { });   // (its recording looked for among Zadnji posnetki)
    const o = await Q.evaluate(() => { const z = Napake.stanje.zg, i = document.querySelector('#nk-zg .nk-prev img'); return { id: z && z.id, st: z && z.st, acts: z && z.acts, car: z && z.car, pzl: z && z.pzl, text: z && z.text, img: !!i && i.complete && i.naturalWidth > 0, hint: (document.querySelector('#nk-zg .nk-pzl') || {}).textContent }; });
    res[how + ':' + id] = o;
    await (how === 'mouse' ? Q.click('#nk-zg [data-nk-d="nazaj"]') : touch('#nk-zg [data-nk-d="nazaj"]')); await Q.waitForFunction(() => document.querySelectorAll('#nk-zg .nk-item').length === 6, null, { timeout: 10000, polling: 50 });
  }
  const bad = [];
  for (const how of ['mouse', 'touch']) for (const [id, w] of Object.entries(recs)) {
    const o = res[how + ':' + id];
    const ok = o && o.id === id && o.st && (id === h1.id ? /^RRA-NAPAKE /.test(o.text) : o.text === 'RRA-NAPAKE ' + id);
    const good = ok && o.acts.includes(w.shrani) && o.acts.includes('Kopiraj besedilo') && o.acts.includes('Izbriši') && o.img && JSON.stringify(o.pzl) === JSON.stringify(w.pzl) && (!w.car || w.car.test(o.car || '')) && (w.pzl.length || /ni \(več\) med zadnjimi/.test(o.hint || ''));
    if (!good) bad.push(how + ':' + id + ' ' + JSON.stringify(o));
  }
  T.check('all 6 records open by mouse and by touch (each: its state, its text, its picture, Kopiraj besedilo / Izbriši and the picture\'s button: the old ones Shrani malo sliko, no files at all too); an old record without a small picture shows its full one',
    bad.length === 0 && Object.keys(res).length === 12, bad.join(' | ') || 'ok');
  T.check('the records with their recording among Zadnji posnetki (the new one, the old linked one) have Odpri posnetek and Shrani .rrp, the car and the time (also for the old one: from its recording); the others say the recording is not there',
    JSON.stringify(res['mouse:h-povezan'].pzl) === '["Odpri posnetek","Shrani .rrp"]' && new RegExp(nameAt(3) + '.*1:05\\.400').test(res['touch:h-povezan'].car) && JSON.stringify(res['mouse:' + h1.id].pzl) === '["Odpri posnetek","Shrani .rrp"]' && res['touch:' + h1.id].car.includes(car) &&
    /ni \(več\) med zadnjimi/.test(res['mouse:h-staro'].hint), JSON.stringify({ a: res['mouse:h-povezan'], b: res['mouse:h-staro'].hint }));

  // 6. on its side and upright: the panels inside the screen, the picture over the whole window
  const orient = {};
  for (const [name, vp] of [['side', { width: 640, height: 360 }], ['upright', { width: 360, height: 640 }]]) {
    await Q.setViewportSize(vp); await Q.waitForTimeout(250);
    await Q.evaluate(() => { for (const id of ['nk-zg', 'nk-pz', 'nk-set']) { const e = document.getElementById(id); if (e) e.remove(); } Napake.zgodovina(); });
    await Q.waitForFunction(() => document.querySelectorAll('#nk-zg .nk-item').length === 6, null, { timeout: 10000, polling: 50 }); await Q.waitForTimeout(250);
    const a = await fits('#nk-zg');
    await Q.click('#nk-zg .nk-bd[data-id="h-povezan"]'); await Q.waitForSelector('#nk-zg .nk-pzl.ima'); const b = await fits('#nk-zg');
    await Q.click('#nk-zg .nk-prev-b'); await Q.waitForSelector('#nk-big img'); await Q.waitForTimeout(150);
    const big = await Q.evaluate(() => { const d = document.getElementById('nk-big').getBoundingClientRect(), x = document.querySelector('#nk-big .nk-big-x').getBoundingClientRect(); return { w: d.width, h: d.height, W: innerWidth, H: innerHeight, x: x.left >= 0 && x.right <= innerWidth && x.top >= 0 && x.height >= 36 }; });
    await Q.keyboard.press('Escape');
    await Q.evaluate(() => { document.getElementById('nk-zg').remove(); Napake.zadnji(); }); await Q.waitForFunction(() => document.querySelectorAll('#nk-pz .nk-pzi').length === 7, null, { timeout: 10000, polling: 50 }); await Q.waitForTimeout(250);
    const c = await fits('#nk-pz'), th = await Q.evaluate(() => { const r = document.querySelector('#nk-pz .nk-th').getBoundingClientRect(), t = document.querySelector('#nk-pz .nk-bd').getBoundingClientRect(), x = document.querySelector('#nk-pz .nk-it').getBoundingClientRect(),
      bs = [...document.querySelectorAll('#nk-pz .nk-pzb')].map(e => e.getBoundingClientRect());
      return { th: r.width >= 44 && r.height >= 44, bd: t.height >= 44, it: Math.round(x.width), text: x.width >= 130, btn: bs.length === 14 && bs.every(b => b.width >= 36 && b.height >= 36) }; });
    await Q.evaluate(() => { document.getElementById('nk-pz').remove(); Napake.nastavitve(); }); await Q.waitForFunction(() => /\(7\/10\)/.test((document.querySelector('#nk-set .nk-pz-n') || {}).textContent || ''), null, { timeout: 10000, polling: 50 }); await Q.waitForTimeout(250);
    const d = await fits('#nk-set');
    orient[name] = { a, b, big, c, d, th };
    T.check(name + ' (' + vp.width + ' × ' + vp.height + '): Zgodovina napak (list, record with the recording\'s buttons), Zadnji posnetki and the settings inside the screen, nothing wider than its box; the picture over the whole window, Zapri inside it; the picture and the text big enough to tap, the text of an entry of Zadnji posnetki at least 130 px wide (not a word to a line) and .rrp and ✕ at least 36 px',
      fitOk(a) && fitOk(b) && fitOk(c) && fitOk(d) && Math.abs(big.w - big.W) < 1 && Math.abs(big.h - big.H) < 1 && big.x && th.th && th.bd && th.text && th.btn, JSON.stringify(orient[name]));
    await Q.evaluate(() => { document.getElementById('nk-set').remove(); });
  }

  // 7. the unit parts: the player's car and result of a header, a time
  const U = await Q.evaluate(() => { const id = Core.MODELS[0].id, nm = Core.heirOf(Core.MODELS[0]).name, f = Napake.pz.igralec;
    return { nm, fin: f({ cars: [{ pl: 0 }, { pl: 1, m: id, fin: 1, ft: 83.4567 }] }), dnf: f({ cars: [{ pl: 1, m: id }] }), bust: f({ cars: [{ pl: 1, m: id, fin: 1, ft: 50, bust: 1 }] }), none: f({ cars: [{ pl: 0 }] }), nomodel: f({ cars: [{ pl: 1, m: 'nima-me-igra', fin: 1, ft: 61 }] }), bad: f(null),
      cas: [Napake.pz.cas(83.4567), Napake.pz.cas(5), Napake.pz.cas(600.0004), Napake.pz.cas(0)] }; });
  T.check('the player\'s car and result of a header: the car by the game\'s name, the finish time to the millisecond; arrested by the police, not finished, no player, a model the game does not know, no header: no time / no car, no error; times as 1:23.457',
    U.fin.car === U.nm && U.fin.fin === 1 && U.fin.time === 83.457 && U.dnf.car === U.nm && U.dnf.fin === 0 && U.dnf.time === 0 && U.bust.fin === 0 && U.bust.time === 0 && U.none.car === '' && U.none.fin === 0 && U.nomodel.car === '' && U.nomodel.fin === 1 && U.nomodel.time === 61 && U.bad.car === '' &&
    U.cas.join() === '1:23.457,0:05.000,10:00.000,0:00.000', JSON.stringify(U));

  // 8. Odpri posnetek and Shrani .rrp in the record of the race: the recording downloads, the replay opens with its moment
  await Q.setViewportSize({ width: 640, height: 360 }); await Q.waitForTimeout(200);
  await Q.evaluate((id) => Napake.zgodovina(id), h1.id); await Q.waitForSelector('#nk-zg .nk-pzl.ima button');
  const dl0 = Q.waitForEvent('download', { timeout: 30000 });
  await Q.click('#nk-zg [data-nk-d="pzrrp"]');
  const dl = await dl0, file = path.join(OUT, dl.suggestedFilename()); await dl.saveAs(file);
  const bytes = fs.readFileSync(file);
  T.check('Shrani .rrp in the record downloads the recording of that race (posnetek_bathurst_<LLLLMMDD-UUMM>.rrp, gzip, the bytes kept)', /^posnetek_bathurst_\d{8}-\d{4}\.rrp$/.test(dl.suggestedFilename()) && bytes[0] === 0x1f && bytes[1] === 0x8b && bytes.length === real.bytes && bytes.length > 20000, JSON.stringify({ name: dl.suggestedFilename(), bytes: bytes.length, kept: real.bytes }));
  await Q.click('#nk-zg [data-nk-d="pzodpri"]');
  await Q.waitForFunction(() => window.__game.replay && window.__game.race && window.__game.race.track.def.id === 'bathurst' && Napake.zbirka.length === 1, null, { timeout: 240000, polling: 250 });
  const o8 = await Q.evaluate(() => ({ panels: ['nk-zg', 'nk-pz', 'nk-set', 'nk-dlg', 'nk-big'].filter(id => document.getElementById(id)), z: Napake.stanje.zbirka.map(z => z.zapisi.join('|')) }));
  T.check('Odpri posnetek in the record opens the recording\'s replay with the moment marked in it (to mark and edit it again), the panels closed', o8.panels.length === 0 && o8.z.length === 1 && /Avto skoči čez robnik/.test(o8.z[0]), JSON.stringify(o8));
  T.check('no errors on the page', errors.length === 0, errors.slice(0, 5).join(' | '));
  await Q.context().close();
} catch (e) {
  T.check('the test ran through', false, e && e.stack ? e.stack.split('\n').slice(0, 5).join(' | ') : String(e));
}
T.done();
await browser.close(); await srv.close();
