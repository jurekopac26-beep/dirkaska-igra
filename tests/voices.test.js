// The voices (js/comm.js, no browser: a fake speechSynthesis with the phone's voices, its own clock): every voice of the game speaks
// English, whatever the page's language and whatever voices the phone has. The commentator an English voice (a man's first), the co-driver
// and the team's engineer another English one; the police radio (Vršič) the lines' English twins in those voices, never a Slovenian,
// Croatian, ... voice, even when the phone has one; no English voice: the radio captions only. The engineer's voice (Nastavitve · Glas
// inženirja, Comm.setEngineer): heard with the commentator switched off, still heard when the commentator is switched off while he talks,
// silent when it is switched off itself and with the sound off; said at once (the commentator's chatter cut off, his next chatter does not
// cut in), the engines ducked under him (Comm.talking); a line waiting its turn starts later (item.spoken: game.js opens the
// radio then). His lines for the pit stop: box this lap, good stop, "go, go, go" at the hand-back, the forecast; Preizkusi glas for him.
// Every line of every pool in English (no č, š, ž).
//   node tests/voices.test.js
'use strict';
const fs = require('fs');
const path = require('path');
const { ROOT } = require('./lib/core.js');

let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const SRC = fs.readFileSync(path.join(ROOT, 'js', 'comm.js'), 'utf8');

// Comm with a fake speech engine: voices (as getVoices lists them), the utterances said (u.text, u.voice, u.lang, u.rate, u.pitch), the
// clock (ms, moved by hand), end() the line being said (its 'end'), cancel() as Chrome's (the line's 'error' at once)
function load(voices) {
  const said = [], on = {}, clock = { t: 1000 };
  const synth = { cur: null, getVoices: () => voices.slice(), speak(u) { said.push(u); synth.cur = u; },
    cancel() { const u = synth.cur; synth.cur = null; if (u && u.onerror) u.onerror(); }, addEventListener(k, f) { (on[k] = on[k] || []).push(f); } };
  class Utterance { constructor(t) { this.text = t; } }
  const Comm = Function('window', 'SpeechSynthesisUtterance', 'performance', 'module', SRC + '\nreturn Comm;')({ speechSynthesis: synth }, Utterance, { now: () => clock.t }, undefined);
  const end = () => { const u = synth.cur; synth.cur = null; if (u && u.onend) u.onend(); };
  const later = (ms) => { clock.t += ms; Comm.update(); };
  return { Comm, said, synth, end, later, clock };
}
const V = (name, lang, local) => ({ name, lang, voiceURI: name, localService: local !== false });
const PHONE = [V('Lado', 'sl-SI'), V('Matej', 'hr-HR'), V('Daniel', 'en-GB'), V('Serena', 'en-GB')];   // (a phone with a Slovenian and a Croatian voice too)
const vname = (u) => u && u.voice ? u.voice.name : '(none)';
const SLAV = /^(sl|hr|bs|sr|sk|cs)([-_]|$)/i;

// the pools (js/comm.js LINES): every line of every one
const LINES = Function('return ' + /const LINES = (\{[\s\S]*?\n {2}\});/.exec(SRC)[1])();

// 1. the voices picked: the commentator an English man's voice, the co-driver and the engineer another English one; Settings' line lists them
{
  const { Comm } = load(PHONE), v = Comm.voiceInfo();
  check('the voices: the commentator Daniel (en-GB, a man\'s), the co-driver and the engineer Serena; nothing about a Slovenian voice any more (no radio voice of its own)',
    v.name === 'Daniel' && v.lang === 'en-GB' && v.male && v.codrv === 'Serena' && !('radio' in v) && !('radioLang' in v), JSON.stringify(v));
}

// 2. the police radio: the English twin in an English voice, never the Slovenian or Croatian one the phone has; the dispatcher and the
//    driver in the co-driver's voice; no English voice: captions only (null)
{
  const { Comm, said, end } = load(PHONE), out = [];
  for (const who of ['okc', 'u', 'heli', 'bov', 'cop', 'drv']) { const it = Comm.radio('Kranyska Gora 2, the suspect is on the Vrshich road.', { who, u: 2 }); const u = said[said.length - 1]; out.push({ who, it: !!it, text: u.text, v: vname(u), lang: u.lang }); end(); }
  check('the police radio speaks English: the line as given (its English twin), in an English voice for every speaker (Daniel; the dispatcher and the driver Serena), never sl-SI or hr-HR',
    out.length === 6 && out.every(o => o.it && o.text === 'Kranyska Gora 2, the suspect is on the Vrshich road.' && /^en-/.test(o.lang) && !SLAV.test(o.lang)) &&
    out.filter(o => o.who === 'okc' || o.who === 'drv').every(o => o.v === 'Serena') && out.filter(o => o.who !== 'okc' && o.who !== 'drv').every(o => o.v === 'Daniel'), JSON.stringify(out));
  const rv = Comm.radioVoice();
  check('the police radio\'s voice (tests: game.radio.voice): the English one, a second for the dispatcher', !!rv && rv.name === 'Daniel' && rv.lang === 'en-GB' && rv.two, JSON.stringify(rv));
  const S = load([V('Lado', 'sl-SI'), V('Matej', 'hr-HR')]), it = S.Comm.radio('Unit two, copy.', { who: 'u', u: 2 });
  check('a phone with only Slovenian and Croatian voices: the police radio does not speak (captions only), no Slavic voice reads English', it === null && !S.said.length, JSON.stringify(S.said.map(u => u.text)));
}

// 3. the engineer: on by default, apart from the commentator (switched off: he still talks); English, the co-driver's voice; the engines
//    ducked under him; silent when his own switch is off and with the sound off
{
  const { Comm, said, end, later } = load(PHONE);
  Comm.setEnabled(false); Comm.setSpeech(true);
  const a = Comm.teamRadio('radioBox'), ua = said[said.length - 1], duck = Comm.talking();
  check('the engineer with the commentator off: said at once ("Box ... this lap"), in English (Serena, en-GB), the engines ducked under him',
    !!a && a.spoken && a.eng && ua && /box/i.test(ua.text) && /this lap/i.test(ua.text) && vname(ua) === 'Serena' && ua.lang === 'en-GB' && duck, JSON.stringify({ text: ua && ua.text, v: vname(ua), duck }));
  Comm.setEnabled(false);
  const still = !!a && !a.cut && Comm.state().prio === 3;
  end(); later(600);
  Comm.setEngineer(false); const k0 = said.length, b = Comm.teamRadio('radioGood', { pos: 3 });
  Comm.setEngineer(true); Comm.setSpeech(false); const c = Comm.teamRadio('radioGood', { pos: 3 });
  check('... the commentator switched off while he talks: not cut off; Glas inženirja off: silent; the sound off: silent', still && b === null && c === null && said.length === k0, JSON.stringify({ still, b: !!b, c: !!c }));
  Comm.setSpeech(true); later(600);
  const d = Comm.teamRadio('radioGo'); Comm.setEngineer(false);
  check('... switched off while he talks: cut off at once, the engines no longer ducked', !!d && d.spoken && d.cut && !Comm.talking(), JSON.stringify({ cut: d && d.cut, talking: Comm.talking() }));
}

// 4. with the commentator: the engineer cuts the chatter off, the next chatter does not cut him off; a second engineer line waits its
//    turn (spoken later: the radio opens then) and is dropped when it would come too late
{
  const { Comm, said, end, later } = load(PHONE);
  Comm.setEnabled(true); Comm.setSpeech(true);
  const ch = Comm.say('lap', { lap: 2, laps: 5 }, 1), e1 = Comm.teamRadio('radioLast');
  const s1 = { chCut: !!ch && ch.cut, e1: !!e1 && e1.spoken, by: vname(said[said.length - 1]) };
  const ch2 = Comm.say('drift', null, 1), e2 = Comm.teamRadio('radioGood', { pos: 4 });
  const s2 = { e1cut: !e1 || e1.cut, ch2: !!ch2 && !ch2.spoken, e2wait: !!e2 && !e2.spoken };
  end(); later(600);
  const s3 = { e2: !!(e2 && e2.spoken), text: said[said.length - 1].text };
  check('the engineer over the commentator: the commentator\'s chatter cut off, the engineer at once; the next chatter does not cut in, a second engineer line waits (not cutting the first)',
    s1.chCut && s1.e1 && s1.by === 'Serena' && !s2.e1cut && s2.ch2 && s2.e2wait, JSON.stringify({ s1, s2 }));
  check('... the first said, the second starts after it (item.spoken from then: game.js opens the radio): "Good stop" or "Nice stop" with the place, P4',
    s3.e2 && /^(Good|Nice) stop/.test(s3.text) && /P4/.test(s3.text), JSON.stringify(s3));
  end(); later(600);
  const e3 = Comm.teamRadio('radioBox'), e4 = Comm.teamRadio('radioGo'); later(4200); end(); later(600);
  check('... a line that waited too long (4 s) is dropped, never said', !!e3 && e3.spoken && !!e4 && !e4.spoken, JSON.stringify({ e3: !!(e3 && e3.spoken), e4: !!(e4 && e4.spoken) }));
}

// 5. the pit stop's lines and every pool in English; Preizkusi glas for the engineer
{
  const P = (k) => LINES[k] || [];
  check('the engineer\'s pit lines: box this lap (for each reason), good stop with the place, "Go, go, go!" at the hand-back, the forecast (with {when} and {p})',
    P('radioBox').some(s => /^Box, box, box this lap/.test(s)) && ['radioBoxWet', 'radioBoxDry', 'radioBoxFix', 'radioBoxTyre'].every(k => P(k).length && P(k).every(s => /box this lap/i.test(s))) &&
    P('radioGood').some(s => /^Good stop/.test(s)) && P('radioGood').every(s => /\{pos\}/.test(s)) && P('radioGo').length >= 2 && P('radioGo').every(s => /^Go, go, go!/.test(s) && s.length <= 30) &&
    P('radioFcRain').every(s => /\{when\}/.test(s) && /\{p\}/.test(s)) && P('radioFcDry').length && P('radioFcWet').length, JSON.stringify({ go: P('radioGo'), good: P('radioGood') }));
  const sl = []; for (const k in LINES) for (const s of LINES[k]) if (/[čšžČŠŽ]/.test(s)) sl.push(k + ': ' + s);
  check(`every voice line in English: the ${Object.keys(LINES).length} pools have no Slovenian letters`, Object.keys(LINES).length > 100 && !sl.length, sl.slice(0, 4).join(' | '));
  const { Comm, said } = load(PHONE); Comm.test('eng'); const u = said[said.length - 1];
  check('Preizkusi glas for the engineer: his voice (Serena), his English test line', !!u && vname(u) === 'Serena' && /^Radio check/.test(u.text) && u.rate > 1, JSON.stringify(u && { text: u.text, v: vname(u) }));
}

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
