// Profil igralca (#1068, točke a–d): the robust edges of the achievements, the stats, the profile file and the copies (js/shramba.js,
// js/game.js). A race to the line on Aguascalientes (the shortest real track): the stats counted once (races, the track, the km and this
// week's km, Prva dirka unlocked), a copy after it (po dirki, the track named), Dosežki drawn (8 weeks, this week gold, the favourite track,
// the unlocked achievement at the end). The copies: only the last two races kept, also when three are made at once; a broken copy put back
// leaves the saved game as it is. The profile: exported and imported back, the same progress; a broken or foreign file (not JSON, empty,
// another kind, a bad key, a value not text, too big) refused without a crash and with the message in Slovenian (English in js/lang.js),
// the saved game untouched; a file whose values are broken JSON still starts the game. localStorage out of reach (a store that refuses,
// one with no room at all, a page whose localStorage throws): Shramba answers, nothing crashes.
//   node tests/browser/profil.test.mjs
import fs from 'node:fs';
import { serve, launch, openGame, startTrack, driveToResults, checker } from './lib.mjs';

const T = checker('profil');
const srv = await serve();
const browser = await launch();
const PAGE = srv.base + '/index.html';
const TRACK = 'aguascalientes';
try {
  // (the first load only: a fresh player's stats and a mission's record)
  const init = () => { if (!localStorage.getItem('tdgp-stats')) { localStorage.setItem('tdgp-stats', JSON.stringify({ v: 1, races: 0, km: 0, time: 0, tracks: {}, goldT: {}, ach: {}, wk: {} })); localStorage.setItem('rra-misije', '{"06":{"stars":3,"t":95.2}}'); } };
  const A = await openGame(browser, PAGE, { quality: 'normal', shadows: 0, track: TRACK, name: 'Ana', length: 'short', weather: 'dry' }, { width: 390, height: 844 }, { init });
  const pa = A.page;
  const dialogs = [];
  pa.on('dialog', (d) => { dialogs.push(d.message()); d.accept(); });
  const reloaded = () => pa.waitForFunction(() => window.__game && typeof Shramba !== 'undefined', null, { timeout: 180000 });   // (Shramba: a const of the page, not a property of window)
  const toast = () => pa.evaluate(() => document.getElementById('toast').textContent);

  // 1. a race to the line: the stats counted once, a copy after it, Dosežki drawn
  const s0 = await pa.evaluate(() => window.__game.stats);
  await startTrack(pa, TRACK);
  await driveToResults(pa);
  await pa.waitForTimeout(300);
  const s1 = await pa.evaluate(() => window.__game.stats);
  const wk = Object.values(s1.wk || {}).reduce((a, b) => a + b, 0);
  T.check('after the race: races +1, the track counted once, km and time grown, this week\'s km the race\'s km, Prva dirka unlocked',
    s1.races === s0.races + 1 && s1.tracks[TRACK] === 1 && s1.km > 0.5 && s1.time > 10 && Object.keys(s1.wk).length === 1 && Math.abs(wk - s1.km) < 1e-6 && s1.ach.first > 0,
    JSON.stringify({ races: s1.races, tracks: s1.tracks, km: s1.km, wk: s1.wk, ach: s1.ach }));
  const saved = await pa.evaluate(() => JSON.parse(localStorage.getItem('tdgp-stats')));
  T.check('the stats saved as counted (tdgp-stats: races, the track, the week)', saved.races === s1.races && saved.tracks[TRACK] === 1 && JSON.stringify(saved.wk) === JSON.stringify(s1.wk), JSON.stringify({ races: saved.races, wk: saved.wk }));
  await pa.evaluate(async () => { for (let i = 0; i < 30 && !(await Shramba.list()).some(r => r.why === 'dirka'); i++) await new Promise(r => setTimeout(r, 500)); });   // (the race's copy, 1.5 s after the line)
  const k1 = await pa.evaluate(async () => (await Shramba.list()).map(r => ({ why: r.why, track: r.track, races: r.sum.races })));
  T.check('a copy after the race (po dirki, the track named, the race in it)', k1.length === 1 && k1[0].why === 'dirka' && k1[0].track === TRACK && k1[0].races === s1.races, JSON.stringify(k1));
  const s2 = await pa.evaluate(() => window.__game.stats);
  T.check('the results screen does not count the race a second time', s2.races === s1.races && s2.tracks[TRACK] === 1, JSON.stringify({ races: s2.races, tracks: s2.tracks }));
  await pa.evaluate(() => window.__game.onAction('to-stats'));
  await pa.waitForTimeout(300);
  const d1 = await pa.evaluate(() => { const b = document.getElementById('stats-body'), cols = [...b.querySelectorAll('.st-wk-c')], ach = [...b.querySelectorAll('.ach')];
    return { cols: cols.length, now: cols.map(c => c.classList.contains('now')), nowH: (cols[7] && cols[7].querySelector('i').style.height) || '', fav: (b.querySelector('.st-fav') || {}).textContent, favN: (b.querySelector('.st-fav + em') || {}).textContent,
      got: ach.map(a => a.classList.contains('got')), first: ach.filter(a => a.classList.contains('got')).map(a => a.querySelector('b').textContent), head: (b.querySelector('.ltab-h') || {}).textContent }; });
  const nAch = Object.keys(s1.ach).length, gotN = d1.got.filter(Boolean).length;
  T.check('Dosežki: 8 weeks, this week (the last) gold and full, the favourite track Aguascalientes (1 race), the unlocked ones (Prvi cilj among them) all at the end, as many as counted',
    d1.cols === 8 && d1.now.join() === 'false,false,false,false,false,false,false,true' && d1.nowH === '100%' && /Aguascalientes/.test(d1.fav) && /dirke: 1/.test(d1.favN) &&
    gotN === nAch && d1.got.indexOf(true) === d1.got.length - gotN && d1.first.includes('Prvi cilj') && d1.head === 'Dosežki ' + nAch + '/' + d1.got.length, JSON.stringify(d1));

  // 2. the copies: only the last two races; three made at once still three, only two of them kept; a broken copy put back changes nothing
  const c1 = await pa.evaluate(async () => {
    for (const t of ['a', 'b', 'c']) await Shramba.snap('dirka', t);
    await Shramba.snap('uvoz');
    const one = (await Shramba.list()).map(r => r.why + (r.track ? ':' + r.track : ''));
    const at = await Promise.all(['x', 'y', 'z'].map(t => Shramba.snap('dirka', t)));
    const two = await Shramba.list();
    return { one, at: at.map(r => r && r.id), two: two.map(r => r.why + (r.track ? ':' + r.track : '')), ids: two.map(r => r.id) };
  });
  T.check('the copies after three races and an import: the import\'s and only the last two races\' (c, b)', c1.one.join() === 'uvoz,dirka:c,dirka:b', c1.one.join());
  T.check('three races\' copies made at the same moment: three ids, none written over another, two kept (the newest), the import\'s still there',
    new Set(c1.at).size === 3 && c1.two.length === 3 && c1.two.filter(w => /^dirka/.test(w)).length === 2 && c1.two.includes('uvoz') && new Set(c1.ids).size === c1.ids.length, JSON.stringify(c1));
  const b1 = await pa.evaluate(() => {
    const before = JSON.stringify(Shramba.collect());
    const r = [{ data: null }, { data: [] }, { data: 'x' }, null, {}, { data: { 'tdgp-stats': 5 } }].map(rec => { try { return Shramba.apply(rec); } catch (e) { return 'throw ' + e.message; } });
    return { r, same: JSON.stringify(Shramba.collect()) === before };
  });
  T.check('a broken copy put back (data null, a list, text, none; a value not text): refused (false), the saved game as it was', b1.r.every(v => v === false) && b1.same, JSON.stringify(b1));

  // 3. the profile exported and imported back: the same progress
  await pa.evaluate(() => window.__game.onAction('to-settings'));
  await pa.waitForTimeout(300);
  const [dl] = await Promise.all([pa.waitForEvent('download'), pa.evaluate(() => window.__game.onAction('prof-export'))]);
  const fpath = await dl.path(), file = JSON.parse(fs.readFileSync(fpath, 'utf8'));
  const prog = (o) => { const r = {}; for (const k of Object.keys(o).sort()) if (/^tdgp-(stats|records|career|champ)$/.test(k)) r[k] = o[k]; return r; };
  const keep0 = await pa.evaluate(() => { const o = {}; for (const k of Object.keys(localStorage)) o[k] = localStorage.getItem(k); return o; });
  T.check('the file: a profile with the progress as it is saved (stats, settings) and the missions\' records', file.kind === 'profile' && file.data['tdgp-stats'] === keep0['tdgp-stats'] && file.data['tdgp-settings'] === keep0['tdgp-settings'] && file.extra['rra-misije'] === keep0['rra-misije'],
    Object.keys(file.data).join());
  // (the progress changed after the file: the import puts the file's back)
  await pa.evaluate(() => { const s = JSON.parse(localStorage.getItem('tdgp-stats')); s.races = 77; s.km = 9999; localStorage.setItem('tdgp-stats', JSON.stringify(s)); localStorage.setItem('rra-misije', '{}'); });
  dialogs.length = 0;
  {
    const [fc] = await Promise.all([pa.waitForEvent('filechooser'), pa.evaluate(() => window.__game.onAction('prof-import'))]);
    await Promise.all([pa.waitForNavigation({ timeout: 60000 }), fc.setFiles(fpath)]);
    await reloaded();
  }
  const i1 = await pa.evaluate(async () => { const o = {}; for (const k of Object.keys(localStorage)) o[k] = localStorage.getItem(k); return { o, stats: window.__game.stats, list: (await Shramba.list()).map(r => r.why + ':' + r.sum.races) }; });
  const HARNESS = /^tdgp-(settings|menu|defaults-v\d|nu1|noadapt|nostartcam)$/;   // (written again on every load by tests/browser/lib.mjs, not by the game)
  const diff = Object.keys(file.data).filter(k => !HARNESS.test(k) && i1.o[k] !== file.data[k]);
  T.check('imported back (after the restart): every key of the file as it was in it, the missions\' records too; the stats the file\'s, not the 77 races',
    diff.length === 0 && i1.o['rra-misije'] === file.extra['rra-misije'] && i1.stats.races === s1.races && JSON.stringify(prog(i1.o)) === JSON.stringify(prog(file.data)), JSON.stringify({ diff, races: i1.stats.races }));
  T.check('the import asked first and kept a copy of the saved game before it (pred uvozom, the 77 races)', dialogs.length === 1 && /Uvozim profil Ana/.test(dialogs[0]) && i1.list[0] === 'uvoz:77', JSON.stringify({ dialogs, list: i1.list }));

  // 4. a broken or foreign file: refused, no crash, the message in Slovenian, the saved game untouched
  const big = Buffer.alloc(8100000, 0x20); big.write('{"app":"apex-racing"');
  const BAD = [
    ['not JSON', 'to ni json {'], ['empty', ''], ['a list', '[1,2,3]'], ['null', 'null'], ['a number', '42'],
    ['a ghost file', JSON.stringify({ app: 'apex-racing', kind: 'ghost', v: 1, data: {} })],
    ['another game\'s', JSON.stringify({ app: 'other', kind: 'profile', v: 1, data: { 'tdgp-stats': '{}' } })],
    ['a newer version', JSON.stringify({ app: 'apex-racing', kind: 'profile', v: 2, data: {} })],
    ['data a list', JSON.stringify({ app: 'apex-racing', kind: 'profile', v: 1, data: ['a'] })],
    ['a key not the game\'s', JSON.stringify({ app: 'apex-racing', kind: 'profile', v: 1, data: { 'evil-key': 'x' } })],
    ['a value not text', JSON.stringify({ app: 'apex-racing', kind: 'profile', v: 1, data: { 'tdgp-stats': { v: 1 } } })],
    ['binary', Buffer.from([0xff, 0xfe, 0x00, 0x01, 0x89, 0x50, 0x4e, 0x47])],
  ];
  const before = await pa.evaluate(() => JSON.stringify(Object.keys(localStorage).sort().map(k => [k, localStorage.getItem(k)])));
  const errs0 = A.errors.length;
  const bad = [];
  for (const [what, body] of [...BAD, ['too big (8.1 MB)', big]]) {
    dialogs.length = 0;
    await pa.evaluate(() => { document.getElementById('toast').textContent = ''; });
    const [fc] = await Promise.all([pa.waitForEvent('filechooser'), pa.evaluate(() => window.__game.onAction('prof-import'))]);
    await fc.setFiles({ name: 'profil.json', mimeType: 'application/json', buffer: Buffer.isBuffer(body) ? body : Buffer.from(body) });
    await pa.waitForFunction(() => document.getElementById('toast').textContent !== '', null, { timeout: 10000 }).catch(() => { });
    const t = await toast();
    const want = /too big/.test(what) ? 'Datoteka je prevelika.' : 'To ni profil igre Real Roads Atlas.';
    if (t.indexOf(want) < 0 || dialogs.length) bad.push(what + ': »' + t + '«' + (dialogs.length ? ' asked: ' + dialogs[0] : ''));
  }
  await pa.waitForTimeout(500);
  const after = await pa.evaluate(() => JSON.stringify(Object.keys(localStorage).sort().map(k => [k, localStorage.getItem(k)])));
  T.check('a broken or foreign file (' + (BAD.length + 1) + ' kinds): refused with the message in Slovenian, nothing asked, the game not started again', bad.length === 0 && (await pa.evaluate(() => !!window.__game)), bad.join(' | '));
  T.check('… the saved game untouched by them, no page errors', after === before && A.errors.length === errs0, A.errors.slice(errs0, errs0 + 3).join(' | '));
  const en = await pa.evaluate(() => ['To ni profil igre Real Roads Atlas.', 'Datoteka je prevelika.', 'Datoteke ni bilo mogoče prebrati.', 'Profila ni bilo mogoče shraniti (premalo prostora).', 'Kopije ni bilo mogoče obnoviti (premalo prostora).'].map(s => [s, Lang.EN[s] || '']));
  T.check('the messages in English too (js/lang.js)', en.every(([s, e]) => e && e !== s && !/[čšžČŠŽ]/.test(e)), JSON.stringify(en));
  // (a file in the right shape whose values are broken JSON: brought in, the game starts again on fresh numbers, no crash)
  {
    const junk = JSON.stringify({ app: 'apex-racing', kind: 'profile', v: 1, date: Date.now(), name: 'Ana', data: { 'tdgp-stats': '{broken', 'tdgp-settings': '[1,2]', 'tdgp-career': 'null', 'tdgp-records': '"x"', 'tdgp-shramba': '7' }, extra: { 'rra-misije': 5 } });
    dialogs.length = 0;
    const [fc] = await Promise.all([pa.waitForEvent('filechooser'), pa.evaluate(() => window.__game.onAction('prof-import'))]);
    await Promise.all([pa.waitForNavigation({ timeout: 60000 }), fc.setFiles({ name: 'profil.json', mimeType: 'application/json', buffer: Buffer.from(junk) })]);
    await reloaded();
    await pa.waitForTimeout(1500);
    const j = await pa.evaluate(() => ({ races: window.__game.stats.races, screen: window.__game.screen, info: Shramba.info(), due: Shramba.due(10), mis: localStorage.getItem('rra-misije') }));
    T.check('a file with broken values: brought in, the game starts again on fresh stats, no page errors; its odd rra-misije (not text) not taken',
      j.races === 0 && j.screen === 'title' && typeof j.info === 'object' && j.due === true && j.mis === i1.o['rra-misije'] && A.errors.length === errs0, JSON.stringify({ j, errors: A.errors.slice(errs0, errs0 + 3) }));
  }

  // 5. localStorage out of reach: a store that refuses everything, one with no room at all, then a page whose localStorage throws
  const l1 = await pa.evaluate(async () => {
    const deny = () => { throw new DOMException('The operation is insecure.', 'SecurityError'); };
    const full = () => { throw new DOMException('The quota has been exceeded.', 'QuotaExceededError'); };
    const run = async (s) => {
      Shramba.use(s); const r = {};
      const t = async (k, f) => { try { r[k] = await f(); } catch (e) { r[k] = 'throw ' + e.name; } };
      await t('keep', () => Shramba.keep('tdgp-x', '1')); await t('usage', () => Shramba.usage().used); await t('info', () => JSON.stringify(Shramba.info()));
      await t('due', () => Shramba.due(10)); await t('exported', () => { Shramba.exported(); return 'ok'; }); await t('later', () => { Shramba.later(); return 'ok'; });
      await t('collect', () => JSON.stringify(Shramba.collect())); await t('extras', () => JSON.stringify(Shramba.extras())); await t('victims', () => Shramba.victims().length);
      await t('snap', () => Shramba.snap('dirka', 'a')); await t('apply', () => Shramba.apply({ data: { 'tdgp-stats': '{}' } }));
      return r;
    };
    const denied = { get length() { return deny(); }, key: deny, getItem: deny, setItem: deny, removeItem: deny };
    const noRoom = { length: 0, key: () => null, getItem: () => null, setItem: full, removeItem: () => { } };
    const out = { deny: await run(denied), full: await run(noRoom) };
    Shramba.use(null);
    return out;
  });
  const calm = (r) => Object.values(r).every(v => !/^throw/.test(String(v)));
  T.check('a store that refuses everything (SecurityError): every call of Shramba answers (keep false, nothing to copy, nothing put back), none throws',
    calm(l1.deny) && l1.deny.keep === false && l1.deny.usage === 0 && l1.deny.collect === '{"data":{},"extra":{}}' && l1.deny.snap === null && l1.deny.apply === false, JSON.stringify(l1.deny));
  T.check('a store with no room at all (every save QuotaExceededError, as in a private window): keep false, no endless loop, none throws',
    calm(l1.full) && l1.full.keep === false && l1.full.victims === 0 && l1.full.apply === false, JSON.stringify(l1.full));
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const p = await ctx.newPage(), errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    await p.addInitScript(() => { Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new DOMException('The operation is insecure.', 'SecurityError'); } }); });
    await p.goto(PAGE, { timeout: 180000 });
    await p.waitForFunction(() => typeof Shramba !== 'undefined', null, { timeout: 60000 });
    const r = await p.evaluate(async () => { const o = {}; const t = async (k, f) => { try { o[k] = await f(); } catch (e) { o[k] = 'throw ' + e.name + ' ' + e.message; } };
      await t('keep', () => Shramba.keep('tdgp-x', '1')); await t('usage', () => Shramba.usage().used); await t('collect', () => JSON.stringify(Shramba.collect()));
      await t('snap', () => Shramba.snap('dirka', 'a')); await t('due', () => Shramba.due(10)); await t('apply', () => Shramba.apply({ data: {} })); return o; });
    T.check('a page whose localStorage throws (storage blocked): Shramba answers (keep false, nothing to copy), none throws', calm(r) && r.keep === false && r.usage === 0 && r.snap === null && r.apply === false,
      JSON.stringify(r) + (errs.length ? ' · page: ' + errs.slice(0, 2).join(' | ') : ''));
    await ctx.close();
  }

  T.check('no page errors', A.errors.length === 0, A.errors.slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
