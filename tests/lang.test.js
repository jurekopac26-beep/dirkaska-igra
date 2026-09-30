// The English page (js/lang.js, no browser): every Slovenian text the game shows has its English, with the same {0} {1} ... slots.
// Checked: the first argument of every tr(...) in the scripts (each string in it: tr(a ? 'x' : 'y')), the tables the game reads through
// tr() (DRIVE_TXT, NET_ERR, ...), the texts and labels of index.html, the upgrades and the car credit (Core), the English of every track,
// championship and famous jump (def.en), the place names on the HUD, and the helpers for numbers, money and places.
//   node tests/lang.test.js
'use strict';
const fs = require('fs');
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');

const Lang = require(path.join(ROOT, 'js', 'lang.js'));
const C = loadCore();
const EN = Lang.EN, has = (k) => Object.prototype.hasOwnProperty.call(EN, k);
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

// a JS string literal at i (' or "): [its value, the index after it]
function strAt(src, i) {
  const q = src[i]; let j = i + 1, raw = '';
  while (j < src.length && src[j] !== q) { if (src[j] === '\\') { raw += src[j] + src[j + 1]; j += 2; } else raw += src[j++]; }
  return [Function('return ' + q + raw + q)(), j + 1];
}
// the source of a call's first argument: from after "tr(" to the first top-level "," or ")" (strings and brackets skipped)
function firstArg(src, i) {
  let d = 0, j = i;
  for (; j < src.length; j++) {
    const ch = src[j];
    if (ch === "'" || ch === '"') { j = strAt(src, j)[1] - 1; continue; }
    if (ch === '(' || ch === '[' || ch === '{') d++;
    else if (ch === ')' || ch === ']' || ch === '}') { if (d === 0) break; d--; }
    else if (ch === ',' && d === 0) break;
  }
  return src.slice(i, j);
}
// the string literals of a piece of code that are values (not the operands of a comparison: tr(S.x === 'rain' ? 'Dež' : 'Suho') gives Dež, Suho)
const literals = (code) => { const out = []; for (let i = 0; i < code.length; i++) if (code[i] === "'" || code[i] === '"') { const [v, e] = strAt(code, i);
  if (!/[=!]==?\s*$/.test(code.slice(0, i)) && !/^\s*[=!]==?/.test(code.slice(e))) out.push(v); i = e - 1; } return out; };
const noComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').map(l => { let q = null; for (let i = 0; i < l.length; i++) { const c = l[i]; if (q) { if (c === '\\') i++; else if (c === q) q = null; } else if (c === "'" || c === '"') q = c; else if (c === '/' && l[i + 1] === '/') return l.slice(0, i); } return l; }).join('\n');

// 1. every tr(...) in the game's scripts: each string of its first argument is in the dictionary
const missing = [], keysUsed = new Set();
for (const f of ['js/game.js']) {
  const src = noComments(read(f));
  for (const m of src.matchAll(/\btr\(/g)) for (const s of literals(firstArg(src, m.index + 3))) { if (s === '') continue; keysUsed.add(s); if (!has(s)) missing.push(s); }
}
check(`tr(): all ${keysUsed.size} texts of the game have their English`, !missing.length, missing.slice(0, 12).map(s => JSON.stringify(s)).join(' | '));

// 2. the tables the game turns with tr(TABLE[k]): every text in them
{
  const src = noComments(read('js/game.js')), miss = [];
  const tableSrc = (name) => { const m = new RegExp('\\b' + name + ' = (?=[\\[{\'])').exec(src); if (!m) return null; let i = m.index + m[0].length; const open = src[i];
    if (open === "'") return src.slice(i, strAt(src, i)[1]);
    let d = 0, j = i; for (; j < src.length; j++) { const ch = src[j]; if (ch === "'" || ch === '"') { j = strAt(src, j)[1] - 1; continue; } if ('([{'.includes(ch)) d++; else if (')]}'.includes(ch) && --d === 0) break; } return src.slice(i, j + 1); };
  const T = { DRIVE_TXT: 0, CTRL_HELP: 0, CTRL_HELP_CS: 0, CTRL_NAME: 0, CAR_DESC: 0, MODE_NAME: 0, MEDAL: 0, UPG_TXT: 0, CAM_NAME: 0, RP_CAM: 0, DIFF_NAME: 0, NET_ERR: 0, W: 0, G: 0 };
  for (const k in T) {
    const s = tableSrc(k); if (!s) { miss.push('(no table ' + k + ')'); continue; }
    const v = Function('return ' + s)(), all = typeof v === 'string' ? [v] : Object.values(v);
    for (const x of all) if (typeof x === 'string' && !has(x) && !Lang.SAME.has(x)) miss.push(k + ': ' + x);
  }
  const ph = Function('return ' + tableSrc('PH_FILT'))();   // (the photo filters: their names)
  for (const f of ph) if (!has(f[0])) miss.push('PH_FILT: ' + f[0]);
  const stat = /const rows = \[\['Moč', 'power'\][^\n]*/.exec(src);
  for (const s of literals(stat ? stat[0] : '')) if (!['power', 'grip', 'weight', 'drift'].includes(s) && !has(s) && !Lang.SAME.has(s)) miss.push('statRows: ' + s);
  check('tables read through tr() (drive, controls, cars, modes, medals, upgrades, cameras, filters, difficulty, network errors, set-up): all in English', !miss.length, miss.slice(0, 10).join(' | '));
}

// 3. index.html: every text and label (aria-label, placeholder, title) the page shows before the game writes over it
{
  const html = read('index.html'), body = html.slice(html.indexOf('<body')).replace(/<script[\s\S]*?<\/script>/g, '').replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<!--[\s\S]*?-->/g, '');
  const dec = (t) => t.replace(/&#(\d+);/g, (m, c) => String.fromCodePoint(+c)).replace(/&times;/g, '×').replace(/&middot;/g, '·').replace(/&minus;/g, '−').replace(/&amp;/g, '&');
  const PLACEHOLDER = new Set(['KROG 1/3', 'Jezero Ring · 3 krogi · 12 nasprotnikov', 'KAZE RS', 'FR', '10.000 €', '1×', '−', '+']);   // (written over by the game at once)
  const miss = [];
  for (const m of body.matchAll(/>([^<>]+)</g)) { const t = dec(m[1]).replace(/\s+/g, ' ').trim(); if (t && /[A-Za-zČŠŽčšž]/.test(t) && !has(t) && !Lang.SAME.has(t) && !PLACEHOLDER.has(t)) miss.push(t); }
  for (const m of body.matchAll(/\b(aria-label|placeholder|title)="([^"]+)"/g)) { const t = dec(m[2]); if (!has(t) && !Lang.SAME.has(t)) miss.push('@' + m[1] + ' ' + t); }
  check('index.html: every text and label has its English', !miss.length, miss.slice(0, 12).join(' | '));
  check('index.html: the settings have the language switch (Slovenščina / English) and js/lang.js loads before the game', /data-set="lang"[^>]*><button data-v="sl">Slovenščina<\/button><button data-v="en">English<\/button>/.test(html) &&
    html.indexOf('js/lang.js') > 0 && html.indexOf('js/lang.js') < html.indexOf('js/game.js'));
}

// 4. the same slots in both languages; English with no Slovenian letters
{
  const slots = (s) => (s.match(/\{\d+\}/g) || []).sort().join(), wrong = [], sl = [];
  for (const k in EN) { if (slots(k) !== slots(EN[k])) wrong.push(k); if (/[čšžČŠŽ]/.test(EN[k]) && !/Jezik/.test(EN[k])) sl.push(EN[k]); }
  check(`all ${Object.keys(EN).length} entries: the same {0} {1} slots in the English`, !wrong.length, wrong.slice(0, 6).join(' | '));
  check('English: no Slovenian letters (č, š, ž)', !sl.length, sl.slice(0, 6).join(' | '));
}

// 5. Core: the upgrades (names and levels), the car credit; every track, championship and famous jump has its English (def.en)
{
  const miss = [];
  for (const u of C.UPG) for (const s of [u.name].concat(u.lv)) if (!has(s) && !Lang.SAME.has(s)) miss.push('upgrade ' + s);
  for (const m of C.MODELS) if (m.credit && !has(m.credit)) miss.push('credit ' + m.id);
  const SAME_NAME = new Set(['Jezero Ring', 'Riviera', 'Pikes Peak', 'Ouninpohja', 'Vršič', 'Nordschleife', 'Spa-Francorchamps', 'Suzuka', 'Superstars']);
  for (const d of C.TRACKS) { if (!d.en || !d.en.desc) miss.push('track desc ' + d.id); if (!(d.en && d.en.name) && !SAME_NAME.has(d.name)) miss.push('track name ' + d.id);
    if (d.jumpRec && !(d.jumpRec.en && d.jumpRec.en.name && d.jumpRec.en.beat)) miss.push('jump ' + d.id); }
  for (const c of C.CHAMPS) { if (!c.en || !c.en.desc) miss.push('championship desc ' + c.id); if (!(c.en && c.en.name) && !SAME_NAME.has(c.name)) miss.push('championship name ' + c.id); }
  check('Core: upgrades, credit, tracks, championships and jumps in English', !miss.length, miss.join(' | '));
  const sl = [];
  for (const d of C.TRACKS) if (d.en && /[čšžČŠŽ]/.test((d.en.desc || '').replace(/Vršič/g, '') + (d.en.name || ''))) sl.push(d.id);
  check('Core: the English descriptions have no Slovenian letters (but the name Vršič)', !sl.length, sl.join(', '));
}

// 6. the helpers in both languages: tr() with its slots, of(), numbers, money, places, the place names on the HUD
{
  Lang.set('sl');
  const d = C.TRACKS.find(x => x.id === 'gora'), v = C.TRACKS.find(x => x.id === 'vrsic');
  const sl = [Lang.tr('Proga: {0}', 'X'), Lang.of(d, 'name'), Lang.thou(3048), Lang.dec('1.9'), Lang.eur(12300), Lang.ord(3), Lang.place('Serpentina 4 · 1.060 m'), Lang.tr('neznano')].join('|');
  Lang.set('en');
  const en = [Lang.tr('Proga: {0}', 'X'), Lang.of(d, 'name'), Lang.thou(3048), Lang.dec('1.9'), Lang.eur(12300), Lang.ord(3), Lang.place('Serpentina 4 · 1.060 m'), Lang.tr('neznano')].join('|');
  const ords = [1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 101, 111].map(Lang.ord).join(' ');
  const pl = ['Ruski križ', 'Zavoj 3', 'Serpentina 8 · Ruska kapelica', 'Eau Rouge', 'Lasnica Fairmont'].map(Lang.place).join(', ');
  Lang.set('sl');
  check('Slovenian: the texts as written, 3.048, 1,9, 12.300 €, 3., the place names as they are', sl === 'Proga: X|Gorski reli|3.048|1,9|12.300 €|3.|Serpentina 4 · 1.060 m|neznano', sl);
  check('English: Track: X, Mountain Rally, 3,048, 1.9, €12,300, 3rd, Hairpin 4 · 1,060 m, an unknown text as it is', en === 'Track: X|Mountain Rally|3,048|1.9|€12,300|3rd|Hairpin 4 · 1,060 m|neznano', en);
  check('English places: 1st 2nd 3rd 4th 11th 12th 13th 21st 22nd 23rd 101st 111th', ords === '1st 2nd 3rd 4th 11th 12th 13th 21st 22nd 23rd 101st 111th', ords);
  check('English place names on the HUD: Russian Cross, Turn 3, Hairpin 8 · Russian Chapel, Eau Rouge, Fairmont Hairpin', pl === 'Russian Cross, Turn 3, Hairpin 8 · Russian Chapel, Eau Rouge, Fairmont Hairpin', pl);
  check('Vršič keeps its name in English; its description is English', Lang.of(v, 'name') === 'Vršič' && /^The road over the Vršič pass/.test(v.en.desc));
}

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
