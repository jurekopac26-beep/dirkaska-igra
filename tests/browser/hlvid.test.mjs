// The best moment as a video after a race (Nastavitve · Video po dirki, on by default; the Jezero Ring, the player on autopilot, a phone
// upright): the race over, the moment the highlights rate highest plays by itself from the TV cameras, "NAJBOLJŠI TRENUTEK · ..." over it
// and only Preskoči on the replay's bar, and is recorded as it plays; then the results with the video (looping, about 12 s, upright as the
// screen, the picture in it) and Deli: the phone's share sheet with the video file, a computer the file. Preskoči cuts it short (the
// results at once; a video only from 3 s on); in English; switched off: the results straight away, no video.
//   node tests/browser/hlvid.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('the best moment as a video');
const srv = await serve();
const browser = await launch();
// (a phone: a coarse pointer and a share sheet that takes files; window.__noShare: a computer, no share sheet; what it was given kept)
const init = { content: `(() => {
  const mm = window.matchMedia.bind(window);
  window.matchMedia = (q) => /pointer:\\s*coarse/.test(q) ? { matches: !window.__noShare, media: q, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; } } : mm(q);
  navigator.canShare = (d) => !window.__noShare && !!(d && d.files && d.files.length);
  navigator.share = (d) => { window.__shared = { title: d.title, text: d.text, files: (d.files || []).map(f => ({ name: f.name, type: f.type, size: f.size })) }; return Promise.resolve(); };
})();` };
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase', track: 'jezero', hlv: 1 }, { width: 390, height: 844 }, { init });
  const act = (a) => page.evaluate((a) => window.__game.onAction(a), a);
  const race = () => page.evaluate(() => { const g = window.__game; g.pause(); for (let k = 0; k < 300 && g.phase !== 'done'; k++) g.sim(2, true); return g.phase; });
  const playing = () => page.evaluate(() => { const g = window.__game, el = (id) => document.getElementById(id), ui = el('replay-ui'), cap = el('rp-hl-cap');
    return { screen: g.screen, ui: !ui.classList.contains('off'), auto: ui.classList.contains('auto'), cap: cap.classList.contains('off') ? '' : cap.textContent,
      shown: [...ui.querySelectorAll('.rp-bar button')].filter(b => getComputedStyle(b).display !== 'none').map(b => b.dataset.act), rec: g.hlv.rec, vid: g.hlv.vid }; });

  // 1. the race over: the best moment plays by itself, recorded
  await startTrack(page, 'jezero');
  const ph = await race();
  await page.waitForFunction(() => { const r = window.__game.hlv.rec; return r && r.dur > 0.5; }, null, { timeout: 60000 });
  const p1 = await playing(), pos = await page.evaluate(() => +document.getElementById('res-pos').textContent.replace('.', ''));
  const lbl = p1.rec && p1.rec.lbl, kind = lbl && lbl.split(' · ')[1];
  const capOk = kind === 'PREHITEVANJE' ? / ▸ .+ · \d+\. mesto$/.test(p1.rec.cap) : kind === 'NESREČA' ? !!p1.rec.cap : kind === 'ZMAGA' ? pos === 1 && p1.rec.cap === 'Tvoja zmaga!' : kind === 'CILJ' ? p1.rec.cap === 'Ti · ' + pos + '. mesto' : false;
  T.check('the race over: the best moment plays by itself on the TV cameras, "NAJBOLJŠI TRENUTEK · ..." over it, only Preskoči on the bar',
    ph === 'done' && p1.screen === 'none' && p1.ui && p1.auto && p1.shown.join() === 'rp-skip' && /^NAJBOLJŠI TRENUTEK · (PREHITEVANJE|NESREČA|CILJ|ZMAGA)/.test(p1.cap) && p1.cap.startsWith(lbl) && capOk, JSON.stringify({ ph, pos, p1 }));
  T.check('... recorded as it plays: a video of the screen\'s shape (upright, at most 1280 pixels), 12 s of the race round the moment',
    /^video\/(mp4|webm)/.test(p1.rec.mime) && p1.rec.h > p1.rec.w && p1.rec.h <= 1280 && p1.rec.w % 16 === 0 && p1.rec.h % 16 === 0 && Math.abs(p1.rec.t1 - p1.rec.t0 - 12) < 0.01, JSON.stringify(p1.rec));

  // 2. then the results with the video: looping, the length of the moment, the picture in it
  await page.waitForFunction(() => window.__game.screen === 'results' && window.__game.hlv.vid, null, { timeout: 180000 });
  const v1 = await page.evaluate(async () => { const g = window.__game, card = document.getElementById('res-vid'), v = document.getElementById('res-vid-v');
    if (v.readyState < 2) await new Promise(r => { v.addEventListener('loadeddata', r, { once: true }); setTimeout(r, 5000); });
    const c0 = v.currentTime; await new Promise(r => setTimeout(r, 700));
    const cv = document.createElement('canvas'); cv.width = 36; cv.height = 64; const x = cv.getContext('2d'); x.drawImage(v, 0, 0, 36, 64);
    const d = x.getImageData(0, 0, 36, 64).data; let s = 0, s2 = 0; for (let i = 0; i < d.length; i += 4) { const y = (d[i] + d[i + 1] + d[i + 2]) / 3; s += y; s2 += y * y; }
    const n = d.length / 4, mean = s / n;
    return { shown: !card.classList.contains('off'), src: v.src.slice(0, 5), loop: v.loop, muted: v.muted, playing: !v.paused && v.currentTime !== c0, vw: v.videoWidth, vh: v.videoHeight, dur: v.duration,
      cap: document.getElementById('res-vid-cap').textContent, vid: g.hlv.vid, rec: g.hlv.rec, mean: +mean.toFixed(1), sd: +Math.sqrt(Math.max(0, s2 / n - mean * mean)).toFixed(1), share: document.getElementById('res-vid-share').textContent }; });
  T.check('then the results with the video: looping, muted, playing; its size the recording\'s; its caption', v1.shown && v1.src === 'blob:' && v1.loop && v1.muted && v1.playing && v1.vw === p1.rec.w && v1.vh === p1.rec.h && v1.cap === p1.rec.cap && !v1.rec && v1.share === 'Deli', JSON.stringify(v1));
  // (recorded on the real clock: the video about as long as the moment, not slowed down where the frames are slow, as here; its last picture
  // held a few frames, longer where they are slow)
  T.check('... the whole moment in it (about 12 s, the video as long), the race\'s picture in it (not a blank)', v1.vid.dur > 11 && v1.vid.dur < 13.5 && (!isFinite(v1.dur) || (v1.dur > v1.vid.dur * 0.75 && v1.dur < v1.vid.dur * 1.4)) && v1.vid.bytes > 20000 && v1.sd > 8, JSON.stringify({ vid: v1.vid, dur: v1.dur, mean: v1.mean, sd: v1.sd }));

  // 3. a tap on the video: big; again: back
  await act('vid-big'); const big = await page.evaluate(() => { const c = document.getElementById('res-vid'), v = document.getElementById('res-vid-v').getBoundingClientRect(), r = c.getBoundingClientRect();
    return { big: c.classList.contains('big'), pos: getComputedStyle(c).position, cover: r.width >= innerWidth - 1 && r.height >= innerHeight - 1, vh: Math.round(v.height) }; });
  await act('vid-big'); const small = await page.evaluate(() => document.getElementById('res-vid').classList.contains('big'));
  T.check('a tap on the video: big over the whole screen; again: back in its place', big.big && big.pos === 'fixed' && big.cover && big.vh > 500 && !small, JSON.stringify({ big, small }));

  // 4. Deli: the phone's share sheet with the video file
  await page.evaluate(() => document.getElementById('res-vid-share').click());
  await page.waitForFunction(() => window.__game.lastVideo, null, { timeout: 10000 });
  const sh = await page.evaluate(() => ({ shared: window.__shared, last: window.__game.lastVideo, vid: window.__game.hlv.vid }));
  const f = sh.shared && sh.shared.files[0];
  T.check('Deli on a phone: the share sheet with the video file (dirka-jezero-....mp4 or .webm, all of it), "Moj najboljši trenutek · Jezero Ring"',
    sh.last.how === 'share' && sh.shared.files.length === 1 && /^dirka-jezero-\d{8}-\d{6}\.(mp4|webm)$/.test(f.name) && f.type === sh.vid.type && f.size === sh.vid.bytes && f.name.endsWith(f.type === 'video/mp4' ? '.mp4' : '.webm') && sh.shared.title === 'Moj najboljši trenutek · Jezero Ring',
    JSON.stringify(sh));

  // 5. a computer (no share sheet): the file
  await page.evaluate(() => { window.__noShare = true; window.__game.lastVideo = null; });
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 15000 }), page.evaluate(() => document.getElementById('res-vid-share').click())]);
  const dlName = dl.suggestedFilename(), dlLast = await page.evaluate(() => window.__game.lastVideo);
  T.check('Deli on a computer: the video saved as a file', dlName === sh.vid.name && dlLast && dlLast.how === 'file', JSON.stringify({ dlName, dlLast }));
  await page.evaluate(() => { window.__noShare = false; });

  // 6. Preskoči, in English: the next race; the moment cut short after 4 s: the results at once, the video of what was played
  await page.evaluate(() => { const g = window.__game; g.onAction('to-settings'); document.querySelector('[data-set="lang"] button[data-v="en"]').click(); g.onAction('settings-done'); });
  await act('restart');
  await page.waitForFunction(() => { const g = window.__game; return g.race && g.phase !== 'done' && g.screen === 'none'; }, null, { timeout: 60000 });
  const cleared = await page.evaluate(() => ({ card: !document.getElementById('res-vid').classList.contains('off'), vid: window.__game.hlv.vid }));
  await race();
  await page.waitForFunction(() => { const r = window.__game.hlv.rec; return r && r.dur > 4; }, null, { timeout: 120000 });
  const p2 = await playing(), skipTxt = await page.evaluate(() => document.getElementById('rp-skip').textContent);
  await act('rp-skip');
  const s2 = await page.evaluate(() => ({ screen: window.__game.screen, ui: !document.getElementById('replay-ui').classList.contains('off') }));
  await page.waitForFunction(() => window.__game.hlv.vid, null, { timeout: 15000 });
  const v2 = await page.evaluate(() => ({ vid: window.__game.hlv.vid, shown: !document.getElementById('res-vid').classList.contains('off'), head: document.querySelector('#res-vid b').textContent, share: document.getElementById('res-vid-share').textContent }));
  T.check('a new race: the last one\'s video gone', !cleared.card && !cleared.vid, JSON.stringify(cleared));
  T.check('in English: "BEST MOMENT · ...", Skip', /^BEST MOMENT · (OVERTAKE|CRASH|FINISH|WIN)/.test(p2.cap) && skipTxt === 'Skip' && v2.head === 'Best moment' && v2.share === 'Share', JSON.stringify({ cap: p2.cap, skipTxt, head: v2.head, share: v2.share }));
  T.check('Skip after 4 s: the results at once; the video of what was played (4 s and a little)', s2.screen === 'results' && !s2.ui && v2.shown && v2.vid.dur > 4 && v2.vid.dur < 6, JSON.stringify({ s2, v2 }));

  // 7. Skip at once (under 3 s): no video
  await act('restart');
  await page.waitForFunction(() => { const g = window.__game; return g.race && g.phase !== 'done' && g.screen === 'none'; }, null, { timeout: 60000 });
  await race();
  await page.waitForFunction(() => { const r = window.__game.hlv.rec; return r && r.dur > 0.3; }, null, { timeout: 60000 });
  await act('rp-skip');
  await page.waitForTimeout(1500);
  const s3 = await page.evaluate(() => ({ screen: window.__game.screen, vid: window.__game.hlv.vid, card: !document.getElementById('res-vid').classList.contains('off') }));
  T.check('Skip at once (under 3 s): the results, no video', s3.screen === 'results' && !s3.vid && !s3.card, JSON.stringify(s3));

  // 8. switched off: the results straight away, no video (the setting kept)
  await page.evaluate(() => { const g = window.__game; g.onAction('to-settings'); document.querySelector('[data-set="hlv"] button[data-v="0"]').click(); document.querySelector('[data-set="lang"] button[data-v="sl"]').click(); g.onAction('settings-done'); });
  await act('restart');
  await page.waitForFunction(() => { const g = window.__game; return g.race && g.phase !== 'done' && g.screen === 'none'; }, null, { timeout: 60000 });
  await race();
  await page.waitForTimeout(800);
  const off = await page.evaluate(() => ({ screen: window.__game.screen, ui: !document.getElementById('replay-ui').classList.contains('off'), rec: window.__game.hlv.rec, vid: window.__game.hlv.vid, stored: JSON.parse(localStorage.getItem('tdgp-settings')).hlv }));
  T.check('switched off in the settings: the results straight away, no video (kept)', off.screen === 'results' && !off.ui && !off.rec && !off.vid && off.stored === 0, JSON.stringify(off));

  // (a video the browser reads from memory in pieces, as it plays: it may let a read go unfinished, net::ERR_ABORTED, which is no error)
  const errs = errors.filter(e => !/^request failed: blob:/.test(e));
  T.check('no page errors', !errs.length, errs.slice(0, 3).join(' | '));
} catch (e) {
  T.check('the test ran through', false, String(e && e.message || e).split('\n')[0]);
} finally {
  await browser.close(); await srv.close();
}
T.done();
