// Orodje za napake · Slika in pošiljanje (sklop 6 of docs/orodje-za-napake.md; js/napake.js): Bathurst at 30 s by the quick entry.
// A flag in the race (F), then Posnetek do sem and two moments kept (a red loop with its note, a blue one with its note). The picture of the
// collection: napake_bathurst_LLLLMMDD-UUMM.png, 1600 px wide at most 1600 tall, the moments with their marks (the red loop where it was
// drawn), each moment's 3 pictures of its motion; the text for the chat (RRA-NAPAKE v=<game.js's stamp> proga način naprava size, a line
// for each note, the flag not marked with its lap and metres). Deli in the replay: the choice (a computer: Kopiraj sliko first, Samo
// shrani sliko, Kopiraj besedilo, Obdrži tudi v igri); Kopiraj besedilo copies the text; Samo shrani sliko downloads the picture; kept in
// the game (IndexedDB) as neposlano, Kopiraj sliko makes it poslano. Four moments: two pictures (_1, _2); 2400 px in the settings. The
// end of the replay with Ob koncu Shrani: the picture to the downloads at once. Nastavitve: the tool's row (not in English), its panel with
// the pictures kept (Izbriši). A phone (a touch screen): Deli zdaj first, the share sheet gets the picture and the text, then poslano.
//   node tests/browser/napake-slika.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('napake-slika');
const srv = await serve();
const browser = await launch();
// a moment kept: Označi, a loop (an ellipse round cx, cy) in colour c with its note, Dodaj k zbirki
async function moment(Q, c, cx, cy, r, note) {
  await Q.click('#nk-on'); await Q.click(`#nk-pal [data-c="${c}"]`);
  await Q.mouse.move(cx + r, cy); await Q.mouse.down(); for (let a = 0.2; a <= 2 * Math.PI + 0.25; a += 0.2) await Q.mouse.move(cx + r * Math.cos(a), cy + 0.7 * r * Math.sin(a)); await Q.mouse.up();
  if (note) await Q.keyboard.type(note);
  await Q.click('#nk-bar .nk-add');
}
// the picture's pixels in the page: [r, g, b] at (x, y) of file k of the picture made
const pix = (Q, k, pts) => Q.evaluate(async ([k, pts]) => { const r = await Napake.pripravi(), bm = await createImageBitmap(r.files[k].blob), c = document.createElement('canvas'); c.width = bm.width; c.height = bm.height;
  const x = c.getContext('2d'); x.drawImage(bm, 0, 0); return pts.map(([a, b]) => Array.from(x.getImageData(Math.round(a), Math.round(b), 1, 1).data.slice(0, 3))); }, [k, pts]);
try {
  const { page: Q, errors } = await openGame(browser, srv.base + '/index.html?proga=bathurst&t=30', { quality: 'normal', shadows: 0, camera: 'chase' }, { width: 640, height: 360 });
  await Q.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: srv.base });
  await Q.waitForFunction(() => window.__game.quick && window.__game.quick.done, null, { timeout: 240000, polling: 250 });
  // a flag in the race 3 s before now (not marked later), then the race so far
  await Q.evaluate(() => window.__game.resume()); await Q.keyboard.press('KeyF');
  await Q.waitForFunction(() => window.__game.race.time > window.__game.recFlags[0].t + 3, null, { timeout: 60000, polling: 100 });
  await Q.evaluate(() => window.__game.pause()); await Q.click('#pause-rp'); await Q.waitForTimeout(300);
  const deli0 = await Q.evaluate(() => document.getElementById('nk-deli').classList.contains('off'));
  await Q.evaluate(() => window.__game.onAction('rp-b5'));
  await moment(Q, 0, 250, 150, 40, 'Sledi gum sredi ravnine');
  await Q.evaluate(() => window.__game.onAction('rp-f5'));
  await moment(Q, 3, 420, 200, 30, 'Tekmeci v koloni');
  const st = await Q.evaluate(() => Napake.stanje);
  T.check('two moments kept, each with its 3 pictures of the motion (400 px); Deli (2) in the replay (none before)', deli0 && st.zbirka.length === 2 && st.zbirka.every(z => z.gib.length === 4 && z.gib[2] === null && [0, 1, 3].every(i => z.gib[i] && Math.max(...z.gib[i]) === 400)) &&
    (await Q.evaluate(() => { const d = document.getElementById('nk-deli'); return !d.classList.contains('off') && d.textContent; })) === '⇧ Deli (2)', JSON.stringify(st.zbirka.map(z => z.gib)));

  // the picture and the text
  const R = await Q.evaluate(async () => { const r = await Napake.pripravi(); return { name: r.name, files: r.files.map(f => ({ name: f.name, w: f.w, h: f.h, type: f.blob.type, bytes: f.blob.size })), text: r.text, status: r.status, n: r.n, flags: r.flags }; });
  const ver = await Q.evaluate(() => /[?&]v=(\w+)/.exec(document.querySelector('script[src^="js/game.js"]').getAttribute('src'))[1]);
  const f0 = R.files[0], L = R.text.split('\n'), it = st.zbirka;
  T.check('the picture: napake_bathurst_LLLLMMDD-UUMM.png, a PNG 1600 px wide, at most 1600 tall', R.files.length === 1 && /^napake_bathurst_\d{8}-\d{4}\.png$/.test(f0.name) && f0.type === 'image/png' && f0.w === 1600 && f0.h <= 1600 && f0.h > 600 && f0.bytes > 50000, JSON.stringify(R.files));
  const clk = (t) => { const u = Math.round(t * 1000), m = Math.floor(u / 60000); return String(m).padStart(2, '0') + ':' + ((u % 60000) / 1000).toFixed(3).padStart(6, '0'); };
  T.check('the text: the first line (the version is game.js\'s stamp, the track, the mode and the weather, the device, the screen), a line for each note, the flag not marked',
    L.length === 4 && L[0].startsWith('RRA-NAPAKE v=' + ver + ' proga=bathurst način=race/suho naprava=') && L[0].endsWith(' 640x360') &&
    L[1] === `#1 ${clk(it[0].t)} K1 s=${it[0].s}m rdeča »Sledi gum sredi ravnine«` && L[2] === `#2 ${clk(it[1].t)} K1 s=${it[1].s}m modra »Tekmeci v koloni«` &&
    /^⚑1 00:\d\d\.\d{3} K1 s=\d+m \(zastavica med dirko, ni označena\)$/.test(L[3]) && R.flags === 1, R.text);
  // the red loop where it was drawn (its right edge at 290, 150 of the 640 × 360 screen: the first moment top left, 776 px wide from 16, 16)
  const k = 776 / 640, [p1, p3] = await pix(Q, 0, [[16 + 290 * k, 16 + 150 * k], [1600 - 6, 6]]);
  const red = (p) => p[0] > 200 && p[1] < 110 && p[2] < 100;
  T.check('in the picture: the red loop where it was drawn on the moment; the background dark', red(p1) && p3.every(v => v < 60), JSON.stringify({ p1, p3 }));

  // Deli: the choice on a computer
  await Q.click('#nk-deli'); await Q.waitForFunction(() => document.querySelector('#nk-dlg .nk-prev img') && document.querySelector('#nk-dlg .nk-prev img').complete, null, { timeout: 30000, polling: 100 });
  const D = await Q.evaluate(() => ({ acts: Napake.stanje.dlg, keep: document.querySelector('#nk-dlg .nk-keep input').checked, sub: document.querySelector('#nk-dlg .nk-sub').textContent, img: document.querySelector('#nk-dlg .nk-prev img').naturalWidth }));
  T.check('Deli: the choice (a computer: Kopiraj sliko first, Samo shrani sliko, Kopiraj besedilo; Obdrži tudi v igri on), the picture shown', D.acts.join() === 'Kopiraj sliko,Samo shrani sliko,Kopiraj besedilo' && D.keep && D.sub === '2 trenutka · zastavic iz dirke: 1' && D.img === 1600, JSON.stringify(D));
  await Q.click('#nk-dlg [data-nk-d="besedilo"]'); await Q.waitForTimeout(200);
  const clip = await Q.evaluate(() => navigator.clipboard.readText().catch(() => ''));
  T.check('Kopiraj besedilo: the text in the clipboard', clip === R.text, clip.slice(0, 120));
  const [dl] = await Promise.all([Q.waitForEvent('download'), Q.click('#nk-dlg [data-nk-d="shrani"]')]);
  await Q.waitForTimeout(200);
  const db1 = await Q.evaluate(async () => (await Napake.shranjene()).map(r => ({ name: r.name, n: r.n, status: r.status, files: r.files.length, thumb: !!r.thumb })));
  T.check('Samo shrani sliko: the picture downloaded by its name; kept in the game as neposlano; the choice closed', dl.suggestedFilename() === f0.name && db1.length === 1 && db1[0].n === 2 && db1[0].status === 'neposlano' && db1[0].thumb && !(await Q.$('#nk-dlg')), JSON.stringify({ dl: dl.suggestedFilename(), db1 }));
  await Q.click('#nk-deli'); await Q.waitForSelector('#nk-dlg [data-nk-d="slika"]');
  await Q.click('#nk-dlg [data-nk-d="slika"]'); await Q.waitForTimeout(400);
  const ci = await Q.evaluate(async () => { try { const it = await navigator.clipboard.read(); return it.map(i => i.types.join()); } catch (e) { return 'err ' + e.message; } });
  const db2 = await Q.evaluate(async () => (await Napake.shranjene()).map(r => r.status));
  T.check('Kopiraj sliko: a PNG in the clipboard (for Ctrl + V); kept as poslano', Array.isArray(ci) && ci.some(t => /image\/png/.test(t)) && db2.join() === 'poslano', JSON.stringify({ ci, db2 }));

  // four moments: two pictures; 2400 px
  await Q.evaluate(() => window.__game.onAction('rp-b5')); await moment(Q, 1, 300, 120, 30, 'Tri');
  await Q.evaluate(() => window.__game.onAction('rp-b5')); await moment(Q, 4, 330, 220, 30, 'Štiri');
  const R4 = await Q.evaluate(async () => { const r = await Napake.pripravi(); return r.files.map(f => [f.name, f.w, f.h]); });
  await Q.evaluate(() => { localStorage.setItem('tdgp-napake', JSON.stringify(Object.assign(Napake.nast, { size: 2400 }))); });
  await Q.evaluate(() => { window.__game.onAction('rp-race'); });
  await Q.waitForFunction(() => !window.__game.paused && window.__game.rpCount === 0, null, { timeout: 90000, polling: 100 });
  await Q.evaluate(() => { window.__game.pause(); window.__game.onAction('to-settings'); }); await Q.click('#nk-set-open');
  await Q.click('#nk-set [data-k="size"] [data-v="2400"]');
  const R24 = await Q.evaluate(async () => { const r = await Napake.pripravi(); return r.files.map(f => [f.w, f.h]); });
  T.check('four moments: two pictures (_1 with three, _2 with one); 2400 px in the settings: 2400 wide', R4.length === 2 && /_1\.png$/.test(R4[0][0]) && /_2\.png$/.test(R4[1][0]) && R4.every(f => f[1] === 1600 && f[2] <= 1600) && R24.every(f => f[0] === 2400 && f[1] <= 2400), JSON.stringify({ R4, R24 }));
  // the settings' panel: the pictures kept (the newest first), Izbriši
  await Q.waitForSelector('#nk-set .nk-item');
  const S1 = await Q.evaluate(() => ({ items: [...document.querySelectorAll('#nk-set .nk-item')].map(e => e.innerText.replace(/\s+/g, ' ')), thumbs: [...document.querySelectorAll('#nk-set .nk-item img')].filter(i => i.complete).length, row: document.querySelector('#s-settings .nk-setrow').offsetParent !== null }));
  await Q.click('#nk-set .nk-item [data-nk-d="del"]'); await Q.waitForFunction(() => !document.querySelector('#nk-set .nk-item'), null, { timeout: 10000 });
  const S2 = await Q.evaluate(async () => (await Napake.shranjene()).length);
  T.check('Nastavitve: the row Orodje za napake; its panel lists the picture kept (its name, 4 moments, neposlano: a new version), Izbriši takes it out of the game', S1.row && S1.items.length === 1 && /napake_bathurst_\d{8}-\d{4}/.test(S1.items[0]) && /4 trenutki/.test(S1.items[0]) && /neposlano/.test(S1.items[0]) && S2 === 0, JSON.stringify({ S1, S2 }));
  await Q.click('#nk-set [data-k="end"] [data-v="save"]'); await Q.click('#nk-set [data-nk-d="zapri"]');
  // the end of the replay with Ob koncu Shrani: downloaded at once (js/game.js replayEnd calls Napake.konec)
  const [dl2] = await Promise.all([Q.waitForEvent('download'), Q.evaluate(() => Napake.konec())]);
  await Q.waitForTimeout(300);
  const [dl3] = await Promise.all([Q.waitForEvent('download', { timeout: 3000 }).catch(() => null), Q.evaluate(() => Napake.konec())]);
  T.check('the end with Ob koncu Shrani: the pictures downloaded at once; again unchanged: nothing', /_1\.png$/.test(dl2.suggestedFilename()) && !dl3, JSON.stringify({ dl2: dl2.suggestedFilename(), dl3: !!dl3 }));
  // English: no row of the tool (it is Slovenian only)
  await Q.evaluate(() => { Lang.set('en'); });
  const en = await Q.evaluate(() => getComputedStyle(document.querySelector('#s-settings .nk-setrow')).display);
  await Q.evaluate(() => { Lang.set('sl'); });
  T.check('in English the settings show no row of the tool', en === 'none', en);
  T.check('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
  await Q.context().close();

  // a phone (touch): Deli zdaj first; the share sheet gets the picture and the text; poslano
  const share = () => { window.__shared = null; Object.defineProperty(navigator, 'canShare', { configurable: true, value: (d) => !!(d && d.files && d.files.length) });
    Object.defineProperty(navigator, 'share', { configurable: true, value: (d) => { window.__shared = { names: d.files.map(f => f.name), types: d.files.map(f => f.type), text: d.text }; return Promise.resolve(); } }); };
  const B = await openGame(browser, srv.base + '/index.html?proga=bathurst&t=30', { quality: 'normal', shadows: 0, camera: 'chase' }, { width: 360, height: 640 }, { touch: true, init: share });
  const P = B.page;
  await P.waitForFunction(() => window.__game.quick && window.__game.quick.done, null, { timeout: 240000, polling: 250 });
  await P.evaluate(() => window.__game.onAction('rp-here')); await P.waitForTimeout(300);
  await P.evaluate(() => { document.getElementById('nk-on').click(); }); await P.evaluate(() => document.querySelector('#nk-bar .nk-add').click());
  await P.evaluate(() => Napake.izbira()); await P.waitForSelector('#nk-dlg [data-nk-d="deli"]');
  const pa = await P.evaluate(() => Napake.stanje.dlg);
  await P.evaluate(() => document.querySelector('#nk-dlg [data-nk-d="deli"]').click());
  await P.waitForFunction(() => window.__shared, null, { timeout: 30000 }); await P.waitForTimeout(300);
  const sh = await P.evaluate(async () => ({ s: window.__shared, db: (await Napake.shranjene()).map(r => r.status), dlg: !!document.getElementById('nk-dlg'), toast: document.getElementById('toast').textContent }));
  T.check('a phone: Deli zdaj first (no Kopiraj sliko); the share sheet gets the picture (napake_bathurst_....png) and the text; poslano, the choice closed',
    pa.join() === 'Deli zdaj,Samo shrani sliko,Kopiraj besedilo' && sh.s.names.length === 1 && /^napake_bathurst_\d{8}-\d{4}\.png$/.test(sh.s.names[0]) && sh.s.types[0] === 'image/png' && /^RRA-NAPAKE /.test(sh.s.text) && sh.db.join() === 'poslano' && !sh.dlg,
    JSON.stringify({ pa, sh }));
  T.check('no page errors (the phone)', B.errors.length === 0, B.errors.slice(0, 5).join(' | '));
  await P.context().close();
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
