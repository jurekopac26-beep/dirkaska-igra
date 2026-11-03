// The engineer's voice (Nastavitve · Glas inženirja) and every voice in English, the page in Slovenian. The phone's speech faked (opts.init:
// speechSynthesis with a Slovenian and two English voices, each line said in 0.3 s of real time, what was said recorded).
// 1. Crystal Palace, a race with the team radio, the sound on and the commentator off: at the hand-back after a stop (VOZIŠ TI!) the
//    radio's box says "Gremo, gremo, gremo!" and the engineer says "Go, go, go!" in English with an English voice (the co-driver's), the
//    radio's squelch opening as he starts and its roger beep once he is done (no click), the engines ducked under him; out of the pit lane
//    "Dober postanek." in the box, "Good stop" (or "Nice stop") said with the place.
// 2. Glas inženirja off (the settings' row): the next hand-back's box as ever with the radio's click, nothing said, no squelch.
// 3. Vršič, the run from the police: the police radio's captions in Slovenian, its voice the English twin of each line (the call sign in
//    English first) in an English voice, never the Slovenian one the phone has.
//   node tests/browser/voices.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('the voices in English, the engineer\'s voice (cpalace, vrsic)');
// the fake speech engine (before the game's scripts: Comm reads speechSynthesis as it loads)
const FAKE = () => {
  const V = (name, lang) => ({ name, lang, voiceURI: name, localService: true, default: false });
  const voices = [V('Lado', 'sl-SI'), V('Daniel', 'en-GB'), V('Serena', 'en-GB')];
  let cur = null; window.__said = [];
  const synth = { speaking: false, pending: false, paused: false, getVoices: () => voices.slice(), pause() { }, resume() { }, addEventListener() { }, removeEventListener() { },
    speak(u) { if (!String(u.text).trim()) return; window.__said.push({ text: u.text, lang: u.lang, voice: u.voice ? u.voice.name : '', t: performance.now() }); cur = u;   // (the unlock's empty line: not said)
      setTimeout(() => { if (cur === u) { cur = null; if (u.onend) u.onend(); } }, 300); },
    cancel() { const u = cur; cur = null; if (u && u.onerror) u.onerror(); } };
  Object.defineProperty(window, 'speechSynthesis', { configurable: true, get: () => synth });
  window.SpeechSynthesisUtterance = function (t) { this.text = t; };
};
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'low', shadows: 0, camera: 'chase', track: 'cpalace', weather: 'dry', damage: 0, sound: 1, comm: 0, radio: 1, length: 'long', intro: 2 },
    { width: 640, height: 360 }, { init: FAKE, context: { reducedMotion: 'reduce' } });
  const hide = () => page.evaluate(() => { const e = document.querySelector('.screen.show'); if (e) e.style.display = 'none'; });
  await startTrack(page, 'cpalace');
  await page.evaluate(() => { window.__game.pause(); window.__n = { open: 0, close: 0, click: 0, duck: 0 };   // (the radio's sounds and the engines ducked, counted)
    for (const [k, f] of [['open', 'radioOpen'], ['close', 'radioClose'], ['click', 'radio']]) { const o = Sfx[f]; Sfx[f] = function () { window.__n[k]++; return o.apply(this, arguments); }; }
    const d = Sfx.setDuck; Sfx.setDuck = function (v) { if (v) window.__n.duck++; return d.apply(this, arguments); }; });
  await hide();
  // in the page: on to the next stop and its hand-back (the autopilot asked for at the end of a lap; HUD frames now and then: the radio
  // follows the race), then three HUD frames; what the radio and the voice did
  const handBack = () => page.evaluate(() => {
    const g = window.__game, P = g.race.player, Tk = g.race.track; Render.scene.visible = false; let ap = false;
    for (let k = 0; k < 60000; k++) {
      if (P.lap >= 1 && !P.inPit && !Tk.pitAt(P.q.s) && !P.pitWant && !ap) P.pitWant = true;
      if (P.inPit || g.pitAuto.st) g.sim(1 / 60, false, 0, 0); else g.sim(0.1, true);
      if (g.pitAuto.st) ap = true; else if (ap) break;   // (the autopilot gone after it drove: handed back)
      if (k % 10 === 0) g.hud(1 / 60);
    }
    const n0 = Object.assign({}, window.__n), s0 = window.__said.length;
    for (let k = 0; k < 3; k++) g.hud(0.05);
    Render.scene.visible = true;
    const el = document.getElementById('h-teamradio');
    return { ap, inPit: P.inPit, lap: P.lap, box: el.classList.contains('on') ? el.lastElementChild.textContent : '', log: g.teamRadio.log.slice(-3), said: window.__said.slice(s0), n0, n: Object.assign({}, window.__n), talking: g.comm.talking() };
  });
  const wait = (ms) => page.waitForTimeout(ms);

  // 1. the hand-back: the box in Slovenian, the voice in English, the squelch round it, the engines ducked
  const h1 = await handBack();
  const go = h1.said.find(s => /^Go, go, go!/.test(s.text));
  T.check('the hand-back after a stop: the radio\'s box "Gremo, gremo, gremo!" (the page in Slovenian), the engineer says "Go, go, go!" in English (Serena, en-GB) with the commentator off',
    h1.ap && h1.box === 'Gremo, gremo, gremo!' && h1.log.includes('Gremo, gremo, gremo!') && h1.said.length === 1 && !!go && go.voice === 'Serena' && go.lang === 'en-GB', JSON.stringify(h1));
  T.check('... the radio\'s squelch opens as he starts (not the click), the engines ducked under him', h1.n.open === h1.n0.open + 1 && h1.n.click === h1.n0.click && h1.talking, JSON.stringify({ n0: h1.n0, n: h1.n, talking: h1.talking }));
  await wait(600);
  const c1 = await page.evaluate(() => { window.__game.hud(0.05); return Object.assign({}, window.__n); });
  T.check('... said: the roger beep closes the radio; meanwhile the game\'s frames ducked the engines', c1.close === h1.n.close + 1 && c1.duck > h1.n0.duck, JSON.stringify(c1));
  // out of the pit lane: "Dober postanek." in the box (after the shout's time), "Good stop ..." said with the place
  const g1 = await page.evaluate(async () => {
    const g = window.__game, P = g.race.player, s0 = window.__said.length, wt = (ms) => new Promise(r => setTimeout(r, ms));
    for (let k = 0; k < 600 && P.inPit; k++) { g.sim(1 / 60, true); if (k % 10 === 0) g.hud(1 / 60); }   // (the player's car: the autopilot drives it on)
    for (let k = 0; k < 8 && !g.teamRadio.log.some(t => /^Dober postanek/.test(t)); k++) { g.sim(0.25, true); g.hud(1 / 60); }
    for (let k = 0; k < 12 && !(g.teamRadio.cur || '').startsWith('Dober postanek'); k++) { g.hud(0.5); await wt(60); }
    for (let k = 0; k < 20 && window.__said.length === s0; k++) { await wt(100); g.hud(0.05); }
    return { inPit: P.inPit, pos: P.pos, cur: g.teamRadio.cur, said: window.__said.slice(s0) };
  });
  T.check('... out of the pit lane: "Dober postanek." in the box, "Good stop" or "Nice stop" said in English with the place (P' + g1.pos + ')',
    !g1.inPit && /^Dober postanek\./.test(g1.cur || '') && g1.said.length === 1 && /^(Good|Nice) stop/.test(g1.said[0].text) && g1.said[0].text.includes('P' + g1.pos) && g1.said[0].voice === 'Serena', JSON.stringify(g1));

  // 2. Glas inženirja off (the settings' row): the next hand-back's box with the click, nothing said, no squelch
  await wait(800);
  await page.evaluate(() => { const g = window.__game; g.pause(); g.onAction('to-settings'); document.querySelector('[data-set="engV"] button[data-v="0"]').click(); g.onAction('settings-done'); g.pause(); });
  await hide();
  const h2 = await handBack(), stored = await page.evaluate(() => JSON.parse(localStorage.getItem('tdgp-settings')).engV);
  T.check('Glas inženirja off: the next hand-back\'s box "Gremo, gremo, gremo!" with the radio\'s click, nothing said, no squelch (the setting kept)',
    h2.ap && h2.box === 'Gremo, gremo, gremo!' && !h2.said.length && h2.n.click === h2.n0.click + 1 && h2.n.open === h2.n0.open && !h2.talking && stored === 0, JSON.stringify({ h2, stored }));

  // 3. Vršič, the run from the police (the page in Slovenian): the captions in Slovenian, the voice the English twins in an English voice
  const pr = await page.evaluate(async () => {
    const g = window.__game, wt = (ms) => new Promise(r => setTimeout(r, ms));
    g.onAction('to-title'); await wt(250); g.onAction('to-track'); await wt(300);
    document.querySelector('[data-track="vrsic"] .tc-mode button[data-v="police"]').click(); await wt(200);
    g.onAction('start'); for (let k = 0; k < 1500 && !(g.race && g.race.track.def.id === 'vrsic' && g.race.pol); k++) await wt(100);
    g.pause(); Render.scene.visible = false;   // (software WebGL draws Vršič at a frame in seconds: the HUD's frames by hand instead)
    for (let k = 0; k < 400 && g.phase !== 'racing'; k++) g.sim(0.25, false, 0, 0, 1);   // (through the intro, the car held on the brake)
    const s0 = window.__said.length;
    for (let k = 0; k < 1200 && g.radio.log.filter(e => e.said).length < 3; k++) { g.hud(0.05); await wt(50); }   // (the radio in real time: its lines, the chatter before the checkpoint)
    Render.scene.visible = true;
    return { mode: g.radio.mode, log: g.radio.log.map(e => ({ who: e.who, txt: e.txt, said: e.said })), said: window.__said.slice(s0), voice: g.radio.voice };
  });
  const sl = pr.log.filter(e => e.said), heard = pr.said;
  T.check('Vršič, the run from the police: the radio on the air, at least three lines said, each a caption in Slovenian (OKC KRANJ, KG-1 ...)',
    pr.mode && sl.length >= 3 && heard.length >= sl.length && sl.every(e => e.txt && e.who), JSON.stringify(sl.slice(0, 4)));
  T.check('... its voice in English: an English voice (Daniel or Serena, en-GB), never the Slovenian one the phone has; the English twin, not the caption (no č, š, ž)',
    heard.length >= 3 && heard.every(s => /^en-/.test(s.lang) && (s.voice === 'Daniel' || s.voice === 'Serena') && !/[čšžČŠŽ]/.test(s.text)) && heard.every(s => !sl.some(e => e.txt === s.text)) &&
    !!pr.voice && pr.voice.lang === 'en-GB', JSON.stringify({ heard: heard.slice(0, 4), voice: pr.voice }));
  T.check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
} catch (e) {
  T.check('the test ran through', false, String(e && e.message || e).split('\n')[0]);
} finally {
  await browser.close(); await srv.close();
}
T.done();
