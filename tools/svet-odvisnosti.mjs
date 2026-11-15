#!/usr/bin/env node
// Odvisnosti svetov (I17, korak 5, docs/hitro-nalaganje.md): iz kode js/world-*.js izračuna, katere datoteke sveta rabi vsaka proga
// (imena, ki jih datoteka vzame iz World.api ob nalaganju, `const { … } = API`, ali ob gradnji, `API.<ime>`, in datoteka, ki jih tja
// postavi: `Object.assign(API, { … })`, `Object.defineProperties(API, { … })`), in katere so lahko lene: graditelji, ki jih rabijo
// samo prave proge (ne testne, ne proge na odločanju, ne zamrznjene, CLAUDE.md »Testne proge«) in jih ne rabi nobena datoteka ob zagonu.
//   node tools/svet-odvisnosti.mjs            izpis: lene datoteke, ob zagonu, odvisnosti vsake prave proge
//   node tools/svet-odvisnosti.mjs --json     isto kot JSON (manifest, ki ga bere test)
//   node tools/svet-odvisnosti.mjs --write    zapiše lene povezave v index.html (--check: samo preveri)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

// zamrznjene proge (CLAUDE.md): testne s seznama, `test`/`pending` v datoteki, in že zamrznjene pred oznako
const FROZEN_EXTRA = ['suzuka', 'iroha', 'medvode'];
// stanje, ki ga graditelj postavi med svojo gradnjo in ga drugi bere samo, če je za isto progo (API.caBank: B.T === T), ali skupna
// zastavica: ni odvisnost nalaganja
const SOFT = ['caBank', 'VRS', 'ROCK_SMOOTH', 'rbLook', 'flags'];
// imena predmeta World iz js/world.js (vedno naložen): ključi njegovega `return { build, … }`
let WORLD_OWN = [];

// datoteke svetov v vrstnem redu index.html (podatki js/data/<x>.js gredo z js/world-<x>.js)
export function worldFiles(html = rd('index.html')) {
  const re = /<(?:script\b[^>]*\bsrc|link\b[^>]*\bdata-svet="[^"]*"[^>]*\bhref)="(js\/(?:world-[a-z0-9]+|data\/[a-z0-9]+)\.js)[^"]*"/g;
  const out = [];
  for (const m of html.matchAll(re)) if (!out.includes(m[1])) out.push(m[1]);
  return out;
}

// imena, ki jih del kode da v World.api: ključi predmeta za Object.assign(API, {…}) in Object.defineProperties(API, {…})
function objKeys(src, at) {
  let i = src.indexOf('{', at), d = 0; const s = i; const keys = [];
  for (; i < src.length; i++) { const c = src[i]; if (c === '{' || c === '(' || c === '[') d++; else if (c === '}' || c === ')' || c === ']') { d--; if (!d) break; } }
  const body = src.slice(s + 1, i).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  let depth = 0, tok = '';
  for (const c of body + ',') {
    if ('{(['.includes(c)) depth++;
    else if ('})]'.includes(c)) depth--;
    else if (c === ',' && !depth) { const k = tok.trim().match(/^([A-Za-z_$][\w$]*)/); if (k) keys.push(k[1]); tok = ''; continue; }
    if (!depth && !'})]'.includes(c)) tok += c;
  }
  return keys;
}

export function analyse(html) {
  { const w = rd('js/world.js'), at = w.lastIndexOf('return { build,'); WORLD_OWN = at >= 0 ? objKeys(w, at) : []; }
  const files = worldFiles(html);
  const provides = {}, uses = {}, themes = {}, dataOf = {};
  for (const f of files) {
    const src = rd(f);
    const p = new Set();
    for (const m of src.matchAll(/Object\.assign\(\s*(?:World\.)?API\s*,/g)) objKeys(src, m.index + m[0].length).forEach(k => p.add(k));
    for (const m of src.matchAll(/Object\.defineProperties\(\s*(?:World\.)?API\s*,/g)) objKeys(src, m.index + m[0].length).forEach(k => p.add(k));
    for (const m of src.matchAll(/\b(?:API|World\.api)\.([A-Za-z_$][\w$]*)\s*=(?!=)/g)) if (!SOFT.includes(m[1])) p.add(m[1]);
    for (const m of src.matchAll(/\bWorld\.([a-z][\w$]*)\s*=(?!=)/g)) if (!WORLD_OWN.includes(m[1])) p.add('World.' + m[1]);
    provides[f] = p;
    const u = new Set();
    for (const m of src.matchAll(/const\s*\{([^}]*)\}\s*=\s*(?:World\.api|API)\s*;/g))
      for (const part of m[1].split(',')) { const k = part.trim().match(/^([A-Za-z_$][\w$]*)/); if (k) u.add(k[1]); }
    for (const m of src.matchAll(/\b(?:API|World\.api)\.([A-Za-z_$][\w$]*)/g)) u.add(m[1]);
    for (const m of src.matchAll(/\bWorld\.([a-z][\w$]*)/g)) if (!WORLD_OWN.includes(m[1])) u.add('World.' + m[1]);
    uses[f] = u;
    const th = new Set();
    for (const m of src.matchAll(/World\.ext\.([a-z0-9_]+)\s*=/g)) th.add(m[1]);
    if (/World\.ext\[th\]\s*=/.test(src)) {   // (prelaz: eden graditelj za vse prelaze PL_LOOK)
      const at = src.indexOf('const PL_LOOK = {');
      if (at >= 0) objKeys(src, at).forEach(k => th.add(k));
    }
    for (const t of th) themes[t] = f;
    const dm = f.match(/^js\/data\/([a-z0-9]+)\.js$/);
    if (dm) dataOf['js/world-' + dm[1] + '.js'] = f;
  }
  // ime → datoteka, ki ga postavi (prva po vrsti; world.js je vedno naložen, njegova imena niso odvisnost)
  const worldSrc = rd('js/world.js');
  const core = new Set(); const am = worldSrc.indexOf('const API = {'); if (am >= 0) objKeys(worldSrc, am).forEach(k => core.add(k));
  for (const m of worldSrc.matchAll(/Object\.(?:assign|defineProperties)\(\s*API\s*,/g)) objKeys(worldSrc, m.index + m[0].length).forEach(k => core.add(k));
  const owner = {};
  for (const f of files) for (const k of provides[f]) if (!core.has(k) && !(k in owner)) owner[k] = f;
  const deps = {};
  for (const f of files) {
    const d = new Set();
    for (const k of uses[f]) { const o = owner[k]; if (o && o !== f) d.add(o); }
    if (dataOf[f]) d.add(dataOf[f]);
    deps[f] = d;
  }
  const closure = (f, seen = new Set()) => { if (seen.has(f)) return seen; seen.add(f); for (const d of deps[f] || []) closure(d, seen); return seen; };
  return { files, deps, themes, closure };
}

// proge: id → { theme, frozen }
export function tracks() {
  const list = JSON.parse(rd('tests/golden/testne-proge.json')).proge;
  const out = {};
  for (const fn of fs.readdirSync(path.join(ROOT, 'js/tracks')).filter(f => /^[a-z0-9]+\.js$/.test(f))) {
    const src = rd('js/tracks/' + fn), id = fn.replace(/\.js$/, '');
    const theme = (src.match(/\btheme:\s*'([a-z0-9_]+)'/) || [])[1] || 'lake';
    const frozen = list.includes(id) || FROZEN_EXTRA.includes(id) || /\b(test|pending):\s*true/.test(src);
    out[id] = { theme, frozen };
  }
  return out;
}

export function manifest(html) {
  const A = analyse(html), T = tracks();
  const order = (s) => A.files.filter(f => s.has(f));
  const need = {}; const eager = new Set();
  for (const [id, t] of Object.entries(T)) {
    const f = A.themes[t.theme];
    const s = f ? A.closure(f) : new Set();
    need[id] = order(s);
    if (t.frozen) s.forEach(x => eager.add(x));
  }
  // datoteke, ki jih rabi datoteka ob zagonu, so tudi ob zagonu (ob nalaganju ali gradnji) — do konca
  let grew = true;
  while (grew) { grew = false; for (const f of [...eager]) for (const d of A.deps[f]) if (!eager.has(d)) { eager.add(d); grew = true; } }
  // datoteke brez proge (pomočniki, npr. zastave, cesta, ljudje, zaslon) ostanejo ob zagonu
  const used = new Set(Object.values(need).flat());
  for (const f of A.files) if (!used.has(f)) eager.add(f);
  const lazy = A.files.filter(f => !eager.has(f));
  const real = {}, svet = {};
  for (const [id, t] of Object.entries(T)) if (!t.frozen) {
    real[id] = { theme: t.theme, files: need[id], lazy: need[id].filter(f => lazy.includes(f)) };
    for (const f of real[id].lazy) (svet[f] = svet[f] || new Set()).add(t.theme);
  }
  // lena datoteka rabi samo datoteke ob zagonu in lene pred seboj, ki se naložijo za iste teme (World.need jih naloži po vrsti)
  const problems = [];
  for (const f of lazy) for (const d of A.deps[f]) if (!eager.has(d)) {
    if (A.files.indexOf(d) > A.files.indexOf(f)) problems.push(f + ' rabi ' + d + ', ki je za njo');
    for (const th of svet[f] || []) if (!(svet[d] && svet[d].has(th))) problems.push(f + ' (' + th + ') rabi ' + d + ', ki se za ' + th + ' ne naloži');
  }
  const themes = {}; for (const f of lazy) themes[f] = [...(svet[f] || [])].sort();
  return { lazy, eager: A.files.filter(f => eager.has(f)), themes, tracks: real, problems };
}

// index.html, kot mora biti: vrstica lene datoteke je <link rel="x-lazy-script" data-svet="<teme>" href="…"> na mestu, kjer je bila
// <script src>; datoteka, ki se je ne da več naložiti leno (rabi jo kaj ob zagonu), spet <script src>
export function rewrite(html) {
  const M = manifest(html);
  return html.replace(/^(?:<script src="(js\/(?:world-[a-z0-9]+|data\/[a-z0-9]+)\.js)"><\/script>|<link rel="x-lazy-script" data-svet="[^"]*" href="(js\/(?:world-[a-z0-9]+|data\/[a-z0-9]+)\.js)">)$/gm, (line, a, b) => {
    const f = a || b;
    return M.lazy.includes(f) ? `<link rel="x-lazy-script" data-svet="${M.themes[f].join(' ')}" href="${f}">` : `<script src="${f}"></script>`;
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const html = rd('index.html'), M = manifest(html);
  if (M.problems.length) { console.error('NAPAKA: ' + M.problems.join('; ')); process.exit(1); }
  if (process.argv.includes('--write') || process.argv.includes('--check')) {
    const out = rewrite(html);
    if (out === html) { console.log('index.html: lene povezave svetov OK (' + M.lazy.length + ')'); process.exit(0); }
    if (process.argv.includes('--check')) { console.error('index.html: lene povezave svetov niso, kot jih izračuna orodje: node tools/svet-odvisnosti.mjs --write'); process.exit(1); }
    fs.writeFileSync(path.join(ROOT, 'index.html'), out); console.log('index.html: zapisano (' + M.lazy.length + ' lenih)'); process.exit(0);
  }
  if (process.argv.includes('--json')) { console.log(JSON.stringify(M, null, 1)); process.exit(0); }
  const kb = (f) => (fs.statSync(path.join(ROOT, f)).size / 1024).toFixed(0);
  console.log('lene (' + M.lazy.length + '): ' + M.lazy.map(f => f.replace(/^js\/(world-)?/, '').replace(/\.js$/, '') + ' ' + kb(f) + ' kB').join(', '));
  console.log('ob zagonu (' + M.eager.length + ')');
  for (const [id, t] of Object.entries(M.tracks)) console.log('  ' + id.padEnd(14) + (t.lazy.join(' ') || '—'));
}
