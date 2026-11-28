// Pregled 70 prog (docs/pregled-70-prog.md): za vsako progo na main in v odprtih PR prog ena vrstica — ime »Kraj, Država«, dolžina,
// slike menija (assets/tracks/<id>.webp, <id>-rain.webp), omemba v js/lang.js, README.md (seznam prog in »Zasluge« z licenco),
// docs/proge/<id>.md, izletna cona (omemba v opisu proge) in test tests/<id>.test.js. Samo bere (git show / git ls-tree), igre ne spreminja.
// Vse preverbe so po besedilu datotek, zato so približne: »lang.js« pomeni, da je v js/lang.js omenjen kraj ali id (imena ovinkov,
// besedila HUD); prevod imena in opisa proge je v datoteki proge (en: {...}) in je v stolpcu »en«.
//   node tools/pregled-70-prog.js                         izpiše tabelo za main (origin/main) in PR iz seznama PR spodaj
//   node tools/pregled-70-prog.js --zapisi                prepiše tabelo med oznakama v docs/pregled-70-prog.md
//   node tools/pregled-70-prog.js --pr 1234:veja ...      drugi PR (veja mora biti pridobljena: git fetch origin veja:refs/remotes/origin/veja)
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');

// odprti PR prog 28. 11. 2026 (naloga O-28-3); vsak doda proge, ki jih na main še ni
const PRS = [
  [788, 'zbirna/proge-3'], [1118, 'zbirna/proge-4'], [1090, 'proga/el-castano'], [1091, 'proga/chamarel'], [1092, 'proga/stavrovouni'],
  [1093, 'proga/kudowa'], [1094, 'proga/meteora'], [1095, 'proga/sipka'], [1096, 'proga/trebevic'], [1097, 'proga/tatev'],
];
// izjeme pravila izletne cone (CLAUDE.md, »Proge«); mestne proge so označene v opisu proge
const IZJEME_CONA = new Set(['kaligandaki', 'musandam', 'limalimo', 'darvaz']);

const git = (...a) => { try { return execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 << 20, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { return null; } };
const show = (ref, f) => git('show', ref + ':' + f);
const ls = (ref, dir) => (git('ls-tree', '--name-only', ref, dir + '/') || '').split('\n').filter(Boolean).map(p => path.basename(p));

// proge v datoteki proge: vsak »id: '...'« v vrstici z »name:« ali »test:« (prve vrstice TRACK_DEFS.push)
function defs(src) {
  const out = [], lines = src.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s*id:\s*'([\w-]+)'(.*)$/);
    if (!m) continue;
    const rest = m[2], near = lines.slice(i, i + 60).join('\n'), before = lines.slice(Math.max(0, i - 8), i).join('\n');
    const N = /\bname:\s*(?:'([^']+)'|"([^"]+)")/, nm = rest.match(N) || near.match(N) || before.match(N) || [];
    const name = nm[1] || nm[2] || '';
    out.push({
      id: m[1], name, test: /\btest:\s*true/.test(rest), pending: /\bpending:\s*true/.test(rest),
      variantOf: (near.match(/\bvariantOf:\s*'([\w-]+)'/) || [])[1] || '', en: /\ben:\s*\{\s*name:/.test(near),
    });
  }
  return out;
}

function snapshot(ref) {
  const menu = show(ref, 'js/menu-data.js') || '';
  const lm = menu.match(/window\.MENU\.lens\s*=\s*(\{[^}]*\})/);
  return {
    ref, lens: lm ? JSON.parse(lm[1]) : {}, assets: new Set(ls(ref, 'assets/tracks')), docs: new Set(ls(ref, 'docs/proge')),
    tests: new Set(ls(ref, 'tests')), lang: (show(ref, 'js/lang.js') || '').toLowerCase(), readme: show(ref, 'README.md') || '',
    files: ls(ref, 'js/tracks').filter(f => f.endsWith('.js')),
  };
}

function row(S, d, status) {
  const kraj = d.name.split(',')[0].trim(), krajL = kraj.toLowerCase();
  const zi = S.readme.indexOf('## Zasluge'), zasluge = zi >= 0 ? S.readme.slice(zi) : '';
  const zLine = zasluge.split('\n').find(l => l.includes('js/tracks/' + d.id + '.js') || (kraj && l.includes('Proga ' + kraj))) || '';
  const opis = S.docs.has(d.id + '.md') ? (show(S.ref, 'docs/proge/' + d.id + '.md') || '') : null;
  const cona = IZJEME_CONA.has(d.id) ? 'izjema' : opis == null ? '—' : /izletn/i.test(opis) ? 'v opisu' : /mestn/i.test(opis) ? 'mestna?' : 'ni omenjena';
  const len = S.lens[d.id];
  const miss = [];
  const ok = (v, what) => { if (!v) miss.push(what); return v ? 'da' : '**ne**'; };
  const r = {
    status, id: d.id, name: d.name || '(brez imena)', len: len ? (len / 1000).toFixed(1).replace('.', ',') + ' km' : '—',
    webp: ok(S.assets.has(d.id + '.webp'), 'slika'), rain: ok(S.assets.has(d.id + '-rain.webp'), 'slika v dežju'),
    en: ok(d.en, 'en v progi'), lang: ok(S.lang.includes(d.id) || (krajL.length > 3 && S.lang.includes(krajL)), 'lang.js'),
    seznam: ok(S.readme.includes('docs/proge/' + d.id + '.md'), 'README seznam'),
    zasluge: ok(zLine && /licenc|ODbL|CC[ -]BY|CC0|public domain|javn/i.test(zLine), 'README Zasluge'),
    opis: ok(opis != null, 'docs/proge'), cona, test: ok(S.tests.has(d.id + '.test.js'), 'test'),
  };
  if (!/^[^,]+, .+/.test(d.name)) miss.push('ime ni »Kraj, Država«');
  if (!len) miss.push('dolžina v menu-data.js');
  if (cona === 'ni omenjena') miss.push('izletna cona ni opisana');
  r.miss = miss;
  return r;
}

function collect(prs) {
  const main = snapshot('origin/main'), rows = [], seen = new Set();
  for (const f of main.files) for (const d of defs(show(main.ref, 'js/tracks/' + f) || '')) {
    if (d.variantOf) continue;
    seen.add(d.id);
    rows.push(row(main, d, d.test ? 'zamrznjena (test)' : d.pending ? 'zamrznjena (na odločitev)' : 'main'));
  }
  for (const [n, br] of prs) {
    const ref = 'origin/' + br;
    if (git('rev-parse', '--verify', '-q', ref) == null) { rows.push({ status: '#' + n, id: '?', name: 'veja ' + br + ' ni pridobljena', miss: ['git fetch'] }); continue; }
    const S = snapshot(ref);
    for (const f of S.files) {
      if (main.files.includes(f)) continue;
      for (const d of defs(show(ref, 'js/tracks/' + f) || '')) {
        if (d.variantOf) continue;
        const twice = seen.has(d.id);
        seen.add(d.id);
        rows.push(row(S, d, '#' + n + (twice ? ' (tudi v drugem PR)' : '') + (d.test ? ', test' : d.pending ? ', na odločitev' : '')));
      }
    }
  }
  return rows;
}

function table(rows) {
  const out = ['| # | Proga | `id` | Stanje | Dolžina | .webp | -rain | en | lang.js | README seznam | Zasluge | docs/proge | Izletna cona | Test | Manjka |',
    '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|'];
  rows.forEach((r, i) => out.push(`| ${i + 1} | ${r.name} | \`${r.id}\` | ${r.status} | ${r.len || '—'} | ${r.webp || '—'} | ${r.rain || '—'} | ${r.en || '—'} | ${r.lang || '—'} | ${r.seznam || '—'} | ${r.zasluge || '—'} | ${r.opis || '—'} | ${r.cona || '—'} | ${r.test || '—'} | ${r.miss.length ? r.miss.join('; ') : '—'} |`));
  const n = (f) => rows.filter(f).length;
  const igra = n(r => r.status === 'main'), pr = n(r => r.status.startsWith('#') && !/test|odločitev|drugem/.test(r.status));
  out.push('', `Skupaj: ${igra} prog v igri na main, ${n(r => r.status.startsWith('zamrznjena'))} zamrznjenih, ${pr} novih v odprtih PR (brez podvojenih); v igri in v PR: ${igra + pr} od 70.`);
  return out.join('\n');
}

if (require.main === module) {
  const args = process.argv.slice(2), prs = PRS.slice();
  for (let i = 0; i < args.length; i++) if (args[i] === '--pr') { const [n, b] = args[++i].split(':'); prs.push([+n, b]); }
  const t = table(collect(prs));
  if (!args.includes('--zapisi')) { console.log(t); process.exit(0); }
  const F = path.join(ROOT, 'docs', 'pregled-70-prog.md'), A = '<!-- tabela:začetek -->', B = '<!-- tabela:konec -->';
  const src = fs.readFileSync(F, 'utf8'), a = src.indexOf(A), b = src.indexOf(B);
  if (a < 0 || b < a) { console.error('v ' + F + ' ni oznak ' + A + ' in ' + B); process.exit(2); }
  fs.writeFileSync(F, src.slice(0, a + A.length) + '\n' + t + '\n' + src.slice(b));
  console.log('posodobljeno: docs/pregled-70-prog.md');
}
module.exports = { defs, collect, table };
