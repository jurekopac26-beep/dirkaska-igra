// Nova proga sklopa kratkih prog (docs/gorske-proge.md, Varčevanje s tokeni): vse, kar se pri vsaki progi ponovi, naredi to orodje, da ga seje
// prog ne pišejo znova. Ime, angleško ime in stran vožnje vzame iz tabele Proge v načrtu, slog iz tools/predogled/proge.json (cfg), podatke
// proge iz tools/proga-uvoz.mjs. Ničesar, kar že obstaja, ne prepiše (razen vrstice z medaljami); vsak korak lahko poženeš znova.
//   node tools/nova-proga.mjs <id>              naredi in vpiše progo:
//     js/tracks/<id>.js       osnutek (ime, opisa, načini, levi promet, slog look, imena serpentin, komentator) z oznakama za podatke uvoza;
//                             če podatkov še ni, požene tools/proga-uvoz.mjs <id>; nato izračuna medalje (relijski avto na avtopilotu)
//     js/world-<id>.js        svet: World.gore z njegovim slogom (iz cfg), posebnosti proge dopiši v S.extra
//     index.html              <script> proge (za zadnjo progo), js/world-gore.js in js/world-<id>.js (pred js/render.js)
//     js/game.js              angleško ime za komentatorja (EN_NAME)
//     README.md               vrstica v »Proge« in v »Zasluge«
//     docs/proge/<id>.md      osnutek opisa
//     docs/kazalo.md          vrstica v tabeli prog
//     tests/<id>.test.js      test proge (skupni preizkusi tests/lib/gore.js), vpis v tests/run.js in tests/README.md; stranske ceste: tests/junctions.test.js
//   node tools/nova-proga.mjs <id> --medalje    samo znova izračuna medalje
// Nato: preberi in dopolni opisa (desc, en.desc) in docs/proge/<id>.md, posebnosti v js/world-<id>.js, node tools/stamp.js, slika za meni
// (maketa-menija/README.md), testi (docs/gorske-proge.md, Postopek).
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const REPO = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..'), require = createRequire(import.meta.url);
const rd = (f) => fs.readFileSync(path.join(REPO, f), 'utf8'), wr = (f, s) => { fs.mkdirSync(path.dirname(path.join(REPO, f)), { recursive: true }); fs.writeFileSync(path.join(REPO, f), s); console.log('  ' + f); };
const id = process.argv[2], onlyMedals = process.argv.includes('--medalje');
if (!id || !/^[a-z0-9]+$/.test(id)) { console.log('raba: node tools/nova-proga.mjs <id> [--medalje]'); process.exit(2); }

// the plan's table: | # | `id` | Ime | Angleško | Vožnja | Obseg OSM |
const row = rd('docs/gorske-proge.md').split('\n').map(l => l.split('|').map(c => c.trim())).find(c => c[2] === '`' + id + '`');
if (!row) { console.log('proge ' + id + ' ni v tabeli Proge v docs/gorske-proge.md'); process.exit(2); }
const [, num, , name, en, drive] = row, left = /^leva/.test(drive), [place, country] = name.split(', '), [enPlace, enCountry] = en.split(', ');
const PJ = JSON.parse(rd('tools/predogled/proge.json')), E = PJ[id] || {}, cfg = E.cfg || {}, U = E.uvoz || {};
const trackF = 'js/tracks/' + id + '.js', worldF = 'js/world-' + id + '.js', hex = (n) => '0x' + Number(n || 0).toString(16).padStart(6, '0');
const jsq = (s) => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
console.log(`${id}: ${name} (${en}), vožnja po ${left ? 'levi' : 'desni'}, proga ${num} načrta`);

/* ---- the track file ---- */
if (!onlyMedals && !fs.existsSync(path.join(REPO, trackF))) {
  const fog = cfg.fog || 0xc8d4de, snow = cfg.snow === 'all';
  wr(trackF, `/* Track definition '${id}'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // ${name} (${en}): the short road of docs/gorske-proge.md (track ${num}). Made by tools/nova-proga.mjs; the data between the two marks by
  // tools/proga-uvoz.mjs from OpenStreetMap (© OpenStreetMap contributors, ODbL 1.0: the centre line, the side roads, the buildings, the lifts,
  // the ski runs, the water, the car parks), Copernicus DEM GLO-30 (the heights) and ESA WorldCover 2021 (the land cover, CC BY 4.0); derived data
  // under ODbL 1.0. One card, four ways to drive it (def.modes), as Vršič: a race against the rivals over the closed road, a time trial, a duel in
  // the traffic and a run from the police.${left ? ' They drive on the left here (def.leftHand).' : ''}
  TRACK_DEFS.push({
    id: '${id}', name: ${jsq(name)}, theme: '${id}', open: true, modes: ['race', 'tt', 'traffic', 'police'], laps: 1, halfWidth: ${U.hw || 5.0},${left ? ' leftHand: true,' : ''}
    desc: ${jsq(place + ' (' + country + '): kratka zavita cesta. Dirka s tekmeci, vzpon proti uri, dvoboj v prometu ali beg pred policijo.')},
    en: { name: ${jsq(en)}, desc: ${jsq(enPlace + ' (' + enCountry + '): a short, twisting road. A race against rivals, a climb against the clock, a duel in the traffic or an escape from the police.')}, escTo: 'To the finish' },
    runoff: 0.55, inner: 3.0, side: 3.4, noCurbs: true, noGravel: true, offSurface: 'gravel', gradeForce: true, noHeli: true,
    // medal times of the time trial (s), dry and in the rain: the stock rally car on the autopilot x 1.01 (gold), 1.06 (silver), 1.14 (bronze) (tools/nova-proga.mjs --medalje)
    medals: {cs:[0,0,0],wet:{cs:[0,0,0]}},
    // the traffic of the open road (the duel, the run from the police): the share of each kind of vehicle [car, van, bus, motorbike, truck]
    traffic: { mix: [0.62, 0.18, 0.06, 0.1, 0.04] },
    police: { label: 'POLICE', band: '#16181c', text: '#f4f6f0' }, escTo: 'Do cilja',
    // the look of the light and the haze (render's theme for this road: js/render.js reads def.look when it has none of its own)
    look: { fog: ${hex(fog)}, sun: 0xfff2dc, sunI: 1.28, sky: 0xb4cff0, gnd: ${snow ? '0xd8dee6' : '0x5a5e40'}, hemiI: ${snow ? 0.7 : 0.62}, tint: [1.0, 1.0, 1.0], sat: 1.04, sunOff: [-64, 96, -58], split: [[0.96, 0.99, 1.06], [1.04, 1.0, 0.95]] },
    names: [],
    comm: {
      introPass: ["Welcome to {track}! {cars} cars on a short, twisting road, and you start {grid}.", "Here we are at {track}. One run to the finish, and you line up {grid}."],
      goPass: ["And away they go!", "They're off! Every bend counts on a road this short!", "The race is on!"],
      introPassTT: ["Welcome to {track}! Just you and the clock.", "Here we are at {track}. {cps} checkpoints between you and the finish."],
      goPassTT: ["Green light! The clock is running!", "Go! Attack every bend!"],
      introTraffic: ["Welcome to {track}, and the road is open today. Just you and {rival}, first to the finish wins!"],
      introPolice: ["Welcome to {track}! The police are right behind you. Get to the finish without getting caught!"],
      escaped: ["You made it! The police will have to wait for another day!", "Escaped!"],
      summitRecord: ["At the finish! A new personal best, {time}!"], summitEven: ["{time} at the finish, dead level with your best!"],
      summit: ["At the finish in {time}, {delta} seconds off your best."],
    },
    // ---- uvoz: začetek
    // ---- uvoz: konec
  });
})();
`);
}
// the data: the importer, when the marks have none yet
if (!onlyMedals && !/\n\s+points: \[/.test(rd(trackF))) { console.log('  (podatki: node tools/proga-uvoz.mjs ' + id + ')'); execFileSync(process.execPath, [path.join(REPO, 'tools', 'proga-uvoz.mjs'), id], { stdio: 'inherit' }); }

/* ---- the world ---- */
if (!onlyMedals && !fs.existsSync(path.join(REPO, worldF))) {
  const snow = cfg.snow === 'all' ? "'all'" : /^above:/.test(cfg.snow || '') ? cfg.snow.split(':')[1] : "'none'";
  const tree = { broad: "['gum']", mixed: "['fir', 'broad']", conifer: "['fir']", pine: "['pine']", decid: "['broad']", palm: "['broad']" }[cfg.tree] || "['broad']";
  const cover = { forest: 0.34, patchy: 0.14, sparse: 0.06, none: 0 }[cfg.cover] ?? 0.2;
  wr(worldF, `/* =========================================================================
   WORLD — ${name} (theme '${id}'): the data-driven builder of the short roads (World.gore, js/world-gore.js) with this road's style; its own
   things in S.extra. Made by tools/nova-proga.mjs (the style from tools/predogled/proge.json).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.gore) return;
  World.ext.${id} = (scene, tex, opts) => World.gore.build(scene, tex, opts, {
    seed: ${Number(num) * 101}, snow: ${snow},
    road: { line: '${cfg.center === 'yellow' ? 'yellow' : cfg.center === 'none' || cfg.gravel ? 'none' : 'white'}' },
    trees: { kinds: ${tree}, forest: ${cover} },
    skiers: ${cfg.ski ? 50 : 0}, nets: ${cfg.ski ? 'true' : 'false'}, snowbanks: ${cfg.snowbanks ? 'true' : 'false'},
    animals: [${cfg.animals ? `{ kind: '${cfg.animals}', n: 12 }` : ''}],
  });
})();
`);
}

/* ---- registrations (each only once) ---- */
if (!onlyMedals) {
  let h = rd('index.html');
  if (!h.includes('js/tracks/' + id + '.js')) { const L = [...h.matchAll(/<script src="js\/tracks\/[a-z0-9]+\.js[^"]*"><\/script>\n/g)].pop(); h = h.slice(0, L.index + L[0].length) + `<script src="js/tracks/${id}.js"></script>\n` + h.slice(L.index + L[0].length); }
  if (!h.includes('js/world-gore.js')) h = h.replace(/<script src="js\/render\.js/, '<script src="js/world-gore.js"></script>\n<script src="js/render.js');
  if (!h.includes('js/world-' + id + '.js')) h = h.replace(/<script src="js\/render\.js/, `<script src="js/world-${id}.js"></script>\n<script src="js/render.js`);
  if (h !== rd('index.html')) wr('index.html', h);
  let g = rd('js/game.js'); const enShort = enPlace; if (!new RegExp('\\b' + id + ": '").test(g.match(/const EN_NAME = \{[^\n]*\}/)[0])) { g = g.replace(/(const EN_NAME = \{[^\n]*?) \};/, `$1, ${id}: ${jsq(enShort)} };`); wr('js/game.js', g); }
  let r = rd('README.md');
  if (!r.includes('(docs/proge/' + id + '.md)')) { const k = r.indexOf('\n\nZa izbris · samo za testiranje'); r = r.slice(0, k) + `\n- [${name}](docs/proge/${id}.md)` + r.slice(k); }
  if (!r.includes('`js/tracks/' + id + '.js`')) r = r.replace(/\n*$/, '') + `\n- Proga ${name.split(',')[0]} (sredinska črta, stranske ceste, stavbe, žičnice, smučarske proge, voda, parkirišča): © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors, licenca [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/) (glavni API OpenStreetMap). Iz njih izpeljani podatki v \`js/tracks/${id}.js\` so na voljo pod ODbL 1.0. Višine in teren: Copernicus DEM GLO-30 (prek [Copernicus DEM na AWS](https://registry.opendata.aws/copernicus-dem/)): produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved. Raba tal: © ESA WorldCover project 2021 / Contains modified Copernicus Sentinel data (2021) processed by ESA WorldCover consortium, licenca [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).\n`;
  if (r !== rd('README.md')) wr('README.md', r);
  if (!fs.existsSync(path.join(REPO, 'docs/proge/' + id + '.md'))) wr('docs/proge/' + id + '.md', `# ${name} (dirka, kronometer, promet, policija)

[← Vse proge](../../README.md#proge) · proga \`${id}\` (\`js/tracks/${id}.js\`, svet \`js/world-${id}.js\` na podatkovnem graditelju \`js/world-gore.js\`)

${place} (${country}). Proga ${num} sklopa kratkih prog (\`docs/gorske-proge.md\`).${left ? ' Vozi se po levi.' : ''}

- **Dirka**, **kronometer**, **promet**, **policija**: kot na Vršiču (štiri vožnje na eni kartici).
- **Podatki**: sredinska črta, stranske ceste, stavbe, žičnice, smučarske proge, voda in parkirišča iz OpenStreetMap; višine Copernicus GLO-30; raba tal ESA WorldCover (uvoznik \`tools/proga-uvoz.mjs\`).
- **Približki**: drevesa, skale, gledalci, smučarji in živali so razporejeni po rabi tal in naklonu, ne po resničnih legah; stavbe in žičnice so poenostavljene, table generične, brez imen podjetij.
`);
  let k = rd('docs/kazalo.md'); if (!k.includes('| ' + id + ' |')) { const lines = k.split('\n'), rows = lines.map((l, i) => [l, i]).filter(([l]) => /^\| [a-z0-9, ]+ \| [^|]+ \| [a-z0-9]+ \| /.test(l));
    const at = rows.find(([l]) => l.slice(2).split(' |')[0] > id) || rows[rows.length - 1]; lines.splice(at[1], 0, `| ${id} | ${name} | ${id} | \`js/world-${id}.js\` (\`World.gore\` iz \`js/world-gore.js\`, slog proge) |`); wr('docs/kazalo.md', lines.join('\n')); }
  if (!fs.existsSync(path.join(REPO, 'tests/' + id + '.test.js'))) wr('tests/' + id + '.test.js', `// ${name}: a short road of docs/gorske-proge.md (track ${num}). The checks every such road has (tests/lib/gore.js: the name, the four ways
// to drive it, 2.5-3 km, the data of the import, the bends, the legs apart, a whole race and a duel in the traffic on autopilot, the medals)
// and this road's own below.
//   node tests/${id}.test.js
'use strict';
const { goreTrack } = require('./lib/gore.js');
const G = goreTrack('${id}');
G.done();
`);
  let rr = rd('tests/run.js'); if (!rr.includes("'" + id + ".test.js'")) { rr = rr.replace("'lang.test.js', 'fuel.test.js'", `'${id}.test.js', 'lang.test.js', 'fuel.test.js'`); wr('tests/run.js', rr); }
  let tr = rd('tests/README.md'); if (!tr.includes('`' + id + '.test.js`')) { tr = tr.replace(/(\n\| `hotham\.test\.js` \|[^\n]*)/, `$1\n| \`${id}.test.js\` | ${name}, kratka proga sklopa \`docs/gorske-proge.md\` (brez brskalnika): skupni preizkusi \`tests/lib/gore.js\` (ime, štirje načini vožnje, 2,5–3 km, podatki uvoza, ovinki, kraki narazen, cela dirka in dvoboj v prometu na avtopilotu, medalje) in posebnosti proge. |`); wr('tests/README.md', tr); }
}
// the side roads' test: every open road with side roads is on its list
{ const src = rd(trackF), j = rd('tests/junctions.test.js'); if (/\n\s+sideRoads: \[/.test(src) && !j.includes("'" + id + "'")) { wr('tests/junctions.test.js', j.replace(/(const IDS = \[[^\]]*?)\];/, `$1, '${id}'];`)); } }

/* ---- the medals: the stock rally car on the autopilot, dry and in the rain ---- */
{
  const { loadCore } = require(path.join(REPO, 'tests', 'lib', 'core.js')), { DT, seeded } = require(path.join(REPO, 'tests', 'lib', 'sim.js')), C = loadCore();
  const def = C.TRACKS.find(d => d.id === id); if (!def || !def.points) { console.log('  (medalje: proga še nima podatkov)'); process.exit(0); }
  const T = new C.Track(def), run = (rain) => { const orig = Math.random; Math.random = seeded(3);
    const r = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, tt: true, rain }), P = r.player; r.start();
    let t = 0, k = 0; while (!P.finished && t < 900) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P); }
    Math.random = orig; return P.finished ? P.finishTime : null; };
  const d = run(0), w = run(1); if (!d || !w) { console.log('  (medalje: avtopilot ni prišel do cilja)'); process.exit(1); }
  const m = (t) => [Math.round(t * 1.01), Math.round(t * 1.06), Math.round(t * 1.14)], M = `medals: {cs:[${m(d)}],wet:{cs:[${m(w)}]}},`;
  let src = rd(trackF), out = src.replace(/medals: \{cs:\[[^\]]*\],wet:\{cs:\[[^\]]*\]\}\},/, M);
  // the HUD's names, when there are none yet: the hairpins (over 140 degrees within 80 m, the plan's measure) in order, a line for the commentator on a few
  if (/\n    names: \[\],/.test(out)) { const hp = (def.bends || []).filter(b => b[3] > 140), say = ["Into the hairpin!", "Hairpin {n}! Hard on the brakes!", "Round the hairpin, and away!"];
    const L = hp.map((b, k) => `      {"n":"Serpentina ${k + 1}","d":${b[0]}${k % 2 === 0 ? `,"say":[${JSON.stringify(say[k % 3].replace('{n}', k + 1))}]` : ''}},`);
    out = out.replace(/\n    names: \[\],/, L.length ? '\n    names: [\n' + L.join('\n') + '\n    ],' : '\n    names: [],'); }
  if (out !== src) wr(trackF, out);
  console.log(`  medalje: avtopilot ${d.toFixed(1)} s (dež ${w.toFixed(1)} s) -> ${M}`);
}
console.log('naprej: opisa (desc, en.desc) in docs/proge/' + id + '.md, posebnosti v ' + worldF + ', node tools/stamp.js, slika za meni, testi');
