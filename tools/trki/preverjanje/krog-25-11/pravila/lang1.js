'use strict';
// (h) besedila: vsak nov slovenski niz v js (veja proti main), ki gre skozi tr()/nastavitve, ima angleški prevod v Lang.EN (ali je v SAME)
const fs = require('fs'), path = require('path'), cp = require('child_process');
const SNAP = path.join(__dirname, '..', 'snap'), MAIN = path.join(__dirname, '..', 'main');
const L = require(path.join(SNAP, 'js', 'lang.js'));
const strs = (src) => { const out = new Set(); const re = /'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g; let m; while ((m = re.exec(src))) { const s = m[1] != null ? m[1] : m[2] != null ? m[2] : m[3]; out.add(s); } return out; };
const un = (s) => { try { return Function('return \'' + s.replace(/\n/g, '\\n') + '\'')(); } catch (e) { return s; } };
let miss = 0, seen = 0;
for (const f of ['js/game.js', 'js/render.js', 'js/core.js', 'js/napake.js', 'index.html', 'js/ui.js', 'js/hud.js']) {
  if (!fs.existsSync(path.join(SNAP, f))) continue;
  const a = strs(fs.readFileSync(path.join(SNAP, f), 'utf8')), b = fs.existsSync(path.join(MAIN, f)) ? strs(fs.readFileSync(path.join(MAIN, f), 'utf8')) : new Set();
  for (const raw of a) { if (b.has(raw)) continue; const s = un(raw);
    if (!/[a-zčšžA-ZČŠŽ]{3}/.test(s) || !/\s|[čšžČŠŽ]/.test(s) && !/^[A-ZČŠŽ ]{4,}$/.test(s)) continue;   // (stavki in napisi; ne ključi in imena)
    seen++;
    const has = Object.prototype.hasOwnProperty.call(L.EN, s) || (L.SAME && (L.SAME.has ? L.SAME.has(s) : L.SAME[s]));
    if (!has) { miss++; console.log('BREZ EN', f, JSON.stringify(s).slice(0, 200)); }
  }
}
console.log('novih nizov', seen, 'brez prevoda', miss);
// obratno: novi ključi EN, ki jih nobena datoteka js/index.html ne vsebuje (mrtvi ali zatipkani ključi)
const LM = require(path.join(MAIN, 'js', 'lang.js')); const all = ['js/game.js', 'index.html'].concat(fs.readdirSync(path.join(SNAP, 'js')).filter(x => x.endsWith('.js') && x !== 'lang.js' && x !== 'game.js').map(x => 'js/' + x)).map(f => fs.readFileSync(path.join(SNAP, f), 'utf8')).join('\n');
let dead = 0, nk = 0; for (const k of Object.keys(L.EN)) { if (Object.prototype.hasOwnProperty.call(LM.EN, k)) continue; nk++; const esc = k.replace(/\\/g, '\\\\').replace(/'/g, '\\\''); if (!all.includes(k) && !all.includes(esc)) { dead++; console.log('KLJUČ EN BREZ RABE', JSON.stringify(k).slice(0, 160)); } }
console.log('novih ključev EN', nk, 'brez rabe v js/index.html', dead);
