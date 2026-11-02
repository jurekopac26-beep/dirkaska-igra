// Orodje za napake · Zadnji posnetki (sklop 19 of docs/orodje-za-napake.md; js/napake.js cilj / pusti / izhod / zadnji, js/game.js leaveAct):
// Bathurst at 25 s by the quick entry, a flag in the race, Posnetek do sem and a moment kept (a red loop with its note), Nazaj v dirko.
// Glavni meni tapped in the pause: the question (Želiš shraniti to igro za kasnejšo analizo?, Da / Ne, Ne marked and focused; the arrows
// move the mark, P does not let the race go on behind it); Da: the title, the race kept among Zadnji posnetki (Nedokončana, its samples to
// the last bit, the flag, the moment with its picture as JPEG). Nastavitve orodja · Zadnji posnetki (1/10): the list; a tap opens the
// recording with its collection (the moment on the timeline, Zastavice (2), Deli (1)); a second moment kept goes with the record (the
// same file); Končaj: the choice over the list again; Zgodovina napak has the one collection of 2 moments. Bathurst again: Ponovi dirko
// asks (Esc is Ne), the race under 2 s left without a question, one over it asks again (Enter: the marked Ne): nothing more kept.
// The Red Bull Ring's qualifying lap (Štajerska, Avstrija) over the line: kept by itself (Do cilja), Glavni meni then asks nothing;
// .rrp of the list downloads the file; the newest 10 kept; ✕ twice deletes one.
//   node tests/browser/napake-zadnji.test.mjs
import fs from 'node:fs';
import path from 'node:path';
import { serve, launch, openGame, startTrack, checker, REPO } from './lib.mjs';

const T = checker('napake-zadnji');
const srv = await serve();
const browser = await launch();
const OUT = path.join(REPO, 'test-results', 'napake-zadnji'); fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const SUM = `(F) => { let h = 2166136261; for (const f of F) { const u = new Uint32Array(f.buffer, f.byteOffset, f.length); for (let i = 0; i < u.length; i++) h = Math.imul(h ^ u[i], 16777619); } return (h >>> 0).toString(16); }`;
// a moment kept: Označi, a loop (an ellipse round cx, cy) in colour c with its note, Dodaj k zbirki
async function moment(Q, c, cx, cy, r, note, bel) {
  await Q.click('#nk-on'); if (bel) await Q.keyboard.type(bel);   // (Beležka: the keyboard in it at once)
  await Q.click(`#nk-pal [data-c="${c}"]`);
  await Q.mouse.move(cx + r, cy); await Q.mouse.down(); for (let a = 0.2; a <= 2 * Math.PI + 0.25; a += 0.2) await Q.mouse.move(cx + r * Math.cos(a), cy + 0.7 * r * Math.sin(a)); await Q.mouse.up();
  if (note) await Q.keyboard.type(note);
  await Q.click('#nk-bar .nk-add');
}
// the records kept (no blobs: what they are), after the writes asked so far (a collection's change: 300 ms later)
const kept = (Q) => Q.evaluate(async () => { await new Promise(r => setTimeout(r, 450)); await Napake.pz.cakaj();
  return (await Napake.pz.vsi()).map(o => ({ id: o.id, fin: o.fin, track: o.track, tname: o.tname, mode: o.mode, name: o.name, bytes: o.bytes, blob: o.blob && o.blob.size, dur: o.dur, n: o.n, laps: o.laps,
    zb: o.zb && { id: o.zb.id, items: o.zb.items.map(it => ({ n: it.n, t: it.t, img: it.img && it.img.type, gib: (it.gib || []).map(g => g && g.type), zapisi: it.zapisi.map(z => z.barva + ': ' + z.text) })) } })); });
const vpr = (Q) => Q.evaluate(() => Napake.stanje.vpr);
try {
  const { page: Q, errors } = await openGame(browser, srv.base + '/index.html?proga=bathurst&t=25', { quality: 'normal', shadows: 0, camera: 'chase' }, { width: 640, height: 360 }, { context: { acceptDownloads: true } });
  await Q.waitForFunction(() => window.__game.quick && window.__game.quick.done, null, { timeout: 240000, polling: 250 });
  await Q.evaluate(() => window.__game.resume()); await Q.waitForTimeout(300);
  await Q.keyboard.press('KeyF'); await Q.waitForTimeout(1200);
  await Q.evaluate(() => window.__game.pause()); await Q.click('#pause-rp'); await Q.waitForTimeout(300);
  await Q.evaluate(() => window.__game.onAction('rp-b5'));
  await moment(Q, 0, 250, 150, 40, 'Avto skoči čez robnik', 'Ves zaslon utripa');
  await Q.evaluate(() => window.__game.onAction('rp-race')); await Q.evaluate(() => window.__game.pause());
  const r0 = await Q.evaluate(() => ({ sum: window.__game.recSum(), flags: window.__game.recFlags.length, screen: window.__game.screen, z: Napake.stanje.zbirka.map(z => ({ t: z.t, s: z.s, img: z.img })) }));

  // 1. Glavni meni in the pause (a tap): the question, Ne marked and focused; the arrows move the mark; P does not let the race go on
  await Q.click('#s-pause [data-act="to-title"]'); await Q.waitForTimeout(200);
  const v1 = await vpr(Q), s1 = await Q.evaluate(() => ({ screen: window.__game.screen, race: !!window.__game.race }));
  await Q.keyboard.press('ArrowLeft'); const v2 = await vpr(Q);
  await Q.keyboard.press('KeyP'); await Q.waitForTimeout(200); const v3 = await vpr(Q), s3 = await Q.evaluate(() => window.__game.screen);
  await Q.keyboard.press('ArrowRight'); const v4 = await vpr(Q);
  T.check('Glavni meni in the pause of a race before its finish: the question (Da / Ne, Ne marked and focused), the race waits on the pause; the arrows move the mark (Da), P does nothing behind it',
    r0.screen === 'pause' && v1 && v1.q === 'Želiš shraniti to igro za kasnejšo analizo?' && JSON.stringify(v1.b) === '["Da","Ne*"]' && v1.fokus === 'Ne' && s1.screen === 'pause' && s1.race &&
    v2 && JSON.stringify(v2.b) === '["Da*","Ne"]' && v2.fokus === 'Da' && v3 && s3 === 'pause' && v4 && JSON.stringify(v4.b) === '["Da","Ne*"]', JSON.stringify({ v1, s1, v2, v3, s3, v4 }));

  // 2. Da: the title, the race kept (Nedokončana): its samples to the last bit, the flag, the moment with its pictures as JPEG
  await Q.click('#nk-vpr [data-v="da"]'); await Q.waitForTimeout(300);
  const s2 = await Q.evaluate(() => ({ screen: window.__game.screen, race: !!window.__game.race, vpr: !!document.getElementById('nk-vpr'), toast: document.getElementById('toast').textContent }));
  const k1 = await kept(Q);
  const back = await Q.evaluate(async (SUM) => { const sum = eval(SUM), o = (await Napake.pz.vsi())[0], { H, frames } = await Napake.rrp.beri(o.blob); return { sum: sum(frames), n: frames.length, track: H.track, flags: H.flags.length, cars: H.n }; }, SUM);
  const o1 = k1[0] || {};
  T.check('Da: the title (no race), the toast; one recording kept: Bathurst, Avstralija, not over the finish, posnetek_bathurst_<LLLLMMDD-UUMM>.rrp, the moment with its note and its pictures (JPEG, the motion\'s 3)',
    s2.screen === 'title' && !s2.race && !s2.vpr && /shranjena med zadnje posnetke/.test(s2.toast) && k1.length === 1 && o1.fin === 0 && o1.track === 'bathurst' && o1.tname === 'Bathurst, Avstralija' && /^posnetek_bathurst_\d{8}-\d{4}\.rrp$/.test(o1.name) &&
    o1.bytes === o1.blob && o1.bytes > 20000 && o1.dur > 20 && o1.n === 22 && o1.zb && o1.zb.items.length === 1 && o1.zb.items[0].img === 'image/jpeg' && o1.zb.items[0].gib.filter(g => g === 'image/jpeg').length === 3 &&
    o1.zb.items[0].zapisi[0] === 'rdeča: Avto skoči čez robnik' && Math.abs(o1.zb.items[0].t - r0.z[0].t) < 1e-9, JSON.stringify({ s2, k1 }));
  T.check('the file kept reads back as the race\'s samples to the last bit (__game.recSum), the flag in its header, 22 cars', back.sum === r0.sum.h && back.n === r0.sum.n && back.track === 'bathurst' && back.flags === 1 && back.cars === 22, JSON.stringify({ back, r0: r0.sum }));

  // 3. Nastavitve orodja · Zadnji posnetki (1/10): the list; a tap opens the recording with its collection
  await Q.evaluate(() => Napake.nastavitve()); await Q.waitForFunction(() => /\(1\/10\)/.test((document.querySelector('#nk-set .nk-pz-n') || {}).textContent || ''), null, { timeout: 10000, polling: 100 });
  await Q.click('#nk-set [data-nk-d="pz"]'); await Q.waitForFunction(() => document.querySelectorAll('#nk-pz .nk-pzi').length === 1, null, { timeout: 10000, polling: 100 });
  const L1 = await Q.evaluate(() => Napake.stanje.pz);
  T.check('Nastavitve orodja: Zadnji posnetki (1/10), Odpri: the list (Bathurst, Avstralija, the date, dirka, 1 trenutek, Nedokončana)', L1.length === 1 && /^Bathurst, Avstralija \d+\. \d+\. \d{4} \d\d:\d\d · dirka · 2 kroga · 0:\d\d 1 trenutek · \d+ KB Nedokončana$/.test(L1[0]), JSON.stringify(L1));
  await Q.click('#nk-pz .nk-pzi .nk-item');
  await Q.waitForFunction(() => window.__game.replay && window.__game.race && window.__game.race.track.def.id === 'bathurst' && Napake.zbirka.length === 1, null, { timeout: 240000, polling: 250 });
  await Q.waitForTimeout(400);
  const o2 = await Q.evaluate(() => { const g = window.__game, st = Napake.stanje, el = (id) => document.getElementById(id);
    return { sum: g.recSum(), z: st.zbirka.map(z => ({ n: z.n, t: z.t, s: z.s, img: z.img, gib: z.gib, zapisi: z.zapisi })), flags: el('rp-flags').textContent, nflag: document.querySelectorAll('#rp-line .nk-flag').length, deli: el('nk-deli').textContent,
      panels: ['nk-pz', 'nk-set', 'nk-dlg'].filter(id => el(id)), screen: g.screen }; });
  T.check('a tap opens it: the replay of the same samples, its moment back (time, note, picture 1280 × 720, the motion 400 px), on the timeline with the race\'s flag (Zastavice (2)), Deli (1), the panels closed',
    o2.sum.h === r0.sum.h && o2.sum.n === r0.sum.n && o2.z.length === 1 && o2.z[0].n === 1 && Math.abs(o2.z[0].t - r0.z[0].t) < 1e-9 && o2.z[0].s === r0.z[0].s && JSON.stringify(o2.z[0].img) === JSON.stringify(r0.z[0].img) &&
    o2.z[0].gib.filter(g => g && Math.max(...g) === 400).length === 3 && o2.z[0].zapisi[0] === 'rdeča: Avto skoči čez robnik' && o2.flags === 'Zastavice (2)' && o2.nflag === 2 && o2.deli === '⇧ Deli (1)' && !o2.panels.length && o2.screen === 'none',
    JSON.stringify(Object.assign({}, o2, { sum: o2.sum.h, r0: r0.sum.h })));

  // 4. a second moment on it: kept with the record (the same id and file); the report's two lines
  await Q.evaluate(() => window.__game.onAction('rp-restart')); await Q.waitForTimeout(400);
  await moment(Q, 3, 420, 110, 30, 'Tekmec zavije v travo');   // (above Beležka, the notebook bottom right: a loop begun on it is not drawn)
  const k2 = await kept(Q), o3 = k2[0] || {};
  T.check('a second moment (blue) on the opened recording: number 2, kept with its record (the same id, the same file, 2 moments in order, still not over the finish)',
    k2.length === 1 && o3.id === o1.id && o3.blob === o1.blob && o3.fin === 0 && o3.zb && o3.zb.id === o1.zb.id && o3.zb.items.map(it => it.n).join() === '1,2' && o3.zb.items[1].zapisi[0] === 'modra: Tekmec zavije v travo' && o3.zb.items[1].img === 'image/jpeg', JSON.stringify(k2));
  const rep = await Q.evaluate(() => Napake.porocilo().split('\n'));
  T.check('the report: the recording\'s name on the first line, the notes (#1 the notebook\'s kept with the record, #1 red, #2 blue)', rep[0].includes(' posnetek=' + o1.name) && rep.some(l => /^#1 .* beležka »Ves zaslon utripa«$/.test(l)) && rep.some(l => /^#1 .* rdeča »Avto skoči čez robnik«/.test(l)) && rep.some(l => /^#2 .* modra »Tekmec zavije v travo«/.test(l)), rep.slice(0, 4).join(' | '));

  // 5. Končaj: the choice (the collection changed) over the list again; Zgodovina napak: one collection of 2 moments
  await Q.click('[data-act="rp-exit"]'); await Q.waitForTimeout(600);
  const e1 = await Q.evaluate(() => ({ screen: window.__game.screen, dlg: !!document.getElementById('nk-dlg'), pz: !!document.getElementById('nk-pz'), top: [...document.querySelectorAll('.nk-dlg')].map(d => d.id) }));
  await Q.click('#nk-dlg [data-nk-d="zapri"]'); await Q.waitForFunction(() => /2 trenutka/.test((Napake.stanje.pz || [])[0] || ''), null, { timeout: 10000, polling: 100 });
  const zg = await Q.evaluate(async () => { await new Promise(r => setTimeout(r, 300)); return (await Napake.shranjene()).map(r => ({ id: r.id, n: r.n, track: r.track, status: r.status })); });
  T.check('Končaj: the title, the choice (the collection changed) over the list of Zadnji posnetki; closed: the list (2 trenutka); Zgodovina napak: the one collection of this race, 2 moments',
    e1.screen === 'title' && e1.dlg && e1.pz && e1.top.join() === 'nk-pz,nk-dlg' && zg.length === 1 && zg[0].id === o1.zb.id && zg[0].n === 2 && zg[0].track === 'bathurst', JSON.stringify({ e1, zg }));
  await Q.click('#nk-pz [data-nk-d="zapri"]');
  T.check('no errors on the page (Bathurst, the list)', errors.length === 0, errors.slice(0, 4).join(' | '));

  // 6. Bathurst again (the same game, a new page): Ponovi dirko asks, Esc is Ne; the race under 2 s left at once; over it Enter (Ne): nothing kept
  await Q.goto(srv.base + '/index.html?proga=bathurst&t=25');
  await Q.waitForFunction(() => window.__game && window.__game.quick && window.__game.quick.done, null, { timeout: 240000, polling: 250 });
  await Q.evaluate(() => { window.__game.race.__old = 1; });
  await Q.click('#pause-restart'); await Q.waitForTimeout(200);
  const w1 = await vpr(Q); await Q.keyboard.press('Escape'); await Q.waitForTimeout(300);
  const w2 = await Q.evaluate(() => ({ vpr: !!document.getElementById('nk-vpr'), fresh: !!window.__game.race && !window.__game.race.__old, n: window.__game.recSum() ? window.__game.recSum().n : 0 }));
  await Q.evaluate(() => window.__game.pause()); await Q.click('#s-pause [data-act="to-title"]'); await Q.waitForTimeout(300);
  const w3 = await Q.evaluate(() => ({ vpr: !!document.getElementById('nk-vpr'), screen: window.__game.screen }));
  T.check('Ponovi dirko in the pause: the question; Esc is Ne (a new race, nothing kept); that race left under 2 s recorded: no question, the title',
    w1 && w1.q === 'Želiš shraniti to igro za kasnejšo analizo?' && JSON.stringify(w1.b) === '["Da","Ne*"]' && !w2.vpr && w2.fresh && w2.n < 40 && !w3.vpr && w3.screen === 'title', JSON.stringify({ w1, w2, w3 }));
  await Q.evaluate(() => window.__game.onAction('restart'));
  const nf = await Q.evaluate(() => { const g = window.__game; g.pause(); for (let i = 0; i < 30 && !(g.recSum() && g.recSum().n >= 60); i++) g.sim(1, true); return g.recSum() ? g.recSum().n : 0; });   // (the intro and the lights first: then 3 s recorded)
  await Q.click('#s-pause [data-act="to-title"]'); await Q.waitForTimeout(200);
  const w4 = await vpr(Q); await Q.keyboard.press('Enter'); await Q.waitForTimeout(300);
  const w5 = await Q.evaluate(() => ({ vpr: !!document.getElementById('nk-vpr'), screen: window.__game.screen }));
  const k3 = await kept(Q);
  T.check('a race over 2 s recorded: Glavni meni asks again; Enter takes the marked Ne: the title; still only the first recording kept', nf >= 60 && w4 && JSON.stringify(w4.b) === '["Da","Ne*"]' && !w5.vpr && w5.screen === 'title' && k3.length === 1 && k3[0].id === o1.id, JSON.stringify({ nf, w4, w5, k3: k3.map(o => o.id) }));
  T.check('no errors on the page (Bathurst again)', errors.length === 0, errors.slice(0, 4).join(' | '));
  await Q.context().close();

  // 7. the Red Bull Ring's qualifying lap (Štajerska, Avstrija) over the line: kept by itself (Do cilja), no question at leaving
  const { page: P, errors: e2 } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase', quali: 1, track: 'rbring' }, { width: 640, height: 360 }, { context: { acceptDownloads: true } });
  await startTrack(P, 'rbring');
  await P.evaluate(() => { const g = window.__game; g.pause(); for (let i = 0; i < 400 && g.phase !== 'done'; i++) g.sim(1, true); g.resume(); });
  await P.waitForFunction(() => window.__game.screen === 'results', null, { timeout: 180000, polling: 250 });
  const q1 = await kept(P), qa = q1[0] || {};
  const qs = await P.evaluate(() => window.__game.recSum());
  T.check('the qualifying lap over the line: kept by itself at the results (Štajerska, Avstrija, over the finish, race+kvalifikacije, the player alone)',
    q1.length === 1 && qa.fin === 1 && qa.track === 'rbring' && qa.tname === 'Štajerska, Avstrija' && qa.mode === 'race+kvalifikacije' && qa.n === 1 && qa.bytes > 5000 && !qa.zb, JSON.stringify(q1));
  await P.click('#s-results [data-act="to-title"]'); await P.waitForTimeout(300);
  const q2 = await P.evaluate(() => ({ vpr: !!document.getElementById('nk-vpr'), screen: window.__game.screen }));
  const q3 = await kept(P);
  const qb = await P.evaluate(async (SUM) => { const o = (await Napake.pz.vsi())[0], { frames } = await Napake.rrp.beri(o.blob); return { sum: eval(SUM)(frames), n: frames.length }; }, SUM);
  T.check('Glavni meni on the results: no question, the title; the recording kept again if it went on (still one, over the finish, its samples all there)',
    !q2.vpr && q2.screen === 'title' && q3.length === 1 && q3[0].id === qa.id && q3[0].fin === 1 && qb.n >= qs.n && (qb.n > qs.n || qb.sum === qs.h), JSON.stringify({ q2, q3: q3.map(o => [o.id, o.fin, o.blob]), qb, qs }));

  // 8. the list: Do cilja; .rrp downloads the file; the newest 10 kept; ✕ twice deletes one
  await P.evaluate(() => Napake.zadnji()); await P.waitForFunction(() => document.querySelectorAll('#nk-pz .nk-pzi').length === 1, null, { timeout: 10000, polling: 100 });
  const L2 = await P.evaluate(() => Napake.stanje.pz);
  const dl0 = P.waitForEvent('download', { timeout: 30000 });
  await P.click('#nk-pz [data-nk-d="rrp"]');
  const dl = await dl0, file = path.join(OUT, dl.suggestedFilename()); await dl.saveAs(file);
  const bytes = fs.readFileSync(file);
  T.check('the list: Štajerska, Avstrija · Do cilja; .rrp beside it downloads posnetek_rbring_<LLLLMMDD-UUMM>.rrp (gzip, the bytes kept)',
    L2.length === 1 && /^Štajerska, Avstrija .* · dirka · kvalifikacije · 1:\d\d \d+ KB Do cilja$/.test(L2[0]) && /^posnetek_rbring_\d{8}-\d{4}\.rrp$/.test(dl.suggestedFilename()) && bytes[0] === 0x1f && bytes[1] === 0x8b && bytes.length === q3[0].bytes,
    JSON.stringify({ L2, name: dl.suggestedFilename(), bytes: bytes.length, kept: q3[0].bytes }));
  const lim = await P.evaluate(async () => {
    const o = (await Napake.pz.vsi())[0], t0 = o.date;
    for (let i = 1; i <= 11; i++) await Napake.pz.put(Object.assign({}, o, { id: 'pz-test-' + i, date: t0 + i * 1000, zb: null }));
    const l = await Napake.pz.vsi(); return { n: l.length, max: Napake.pz.MAX, first: l[0].id, last: l[l.length - 1].id, has0: l.some(x => x.id === o.id) };
  });
  T.check('the newest 10 kept: 11 more put in, the real one and the oldest test one out', lim.n === 10 && lim.max === 10 && lim.first === 'pz-test-11' && lim.last === 'pz-test-2' && !lim.has0, JSON.stringify(lim));
  await P.evaluate(() => Napake.zadnji()); await P.waitForFunction(() => document.querySelectorAll('#nk-pz .nk-pzi').length === 10, null, { timeout: 10000, polling: 100 });
  await P.click('#nk-pz .nk-pzi:first-child .nk-delb'); const d1 = await P.evaluate(() => document.querySelector('#nk-pz .nk-pzi:first-child .nk-delb').textContent);
  await P.click('#nk-pz .nk-pzi:first-child .nk-delb'); await P.waitForFunction(() => document.querySelectorAll('#nk-pz .nk-pzi').length === 9, null, { timeout: 10000, polling: 100 });
  const d2 = await P.evaluate(async () => (await Napake.pz.vsi()).map(o => o.id));
  T.check('✕: first "Res?", the second tap deletes it (9 left, the newest gone)', d1 === 'Res?' && d2.length === 9 && !d2.includes('pz-test-11'), JSON.stringify({ d1, d2 }));
  T.check('no errors on the page (the Red Bull Ring)', e2.length === 0, e2.slice(0, 4).join(' | '));
  await P.context().close();
} catch (e) {
  T.check('the test ran through', false, e && e.stack ? e.stack.split('\n').slice(0, 4).join(' | ') : String(e));
}
T.done();
await browser.close(); await srv.close();
