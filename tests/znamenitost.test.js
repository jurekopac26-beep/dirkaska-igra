// The landmarks by the road made in Blender (assets/landmarks/<id>.glb and its far level <id>-far.glb, tools/znamenitost/<id>.py,
// js/znamenitost.js; docs/proge/<id>.md): each model in the budget (<= 8 primitives, <= 60 000 vertices; the far level lighter), glTF 2.0
// binary with only positions, normals and the materials' base colours (no pictures, no textures: no names or signs can hide in one), read
// by the game's own reader (World.znamenitost.parse) into one mesh, its faces turned outwards (the game draws the front faces only, lit by
// their normals: a face turned inwards is dark and seen from behind; a model standing on the ground has its roofs and tops facing up and
// next to no faces down, so the faces facing up must far outweigh those facing down, which a model turned inside out reverses), placed by
// a world file of a real track (World.znamenitost.add).
//   node tests/znamenitost.test.js
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..'), DIR = path.join(ROOT, 'assets', 'landmarks');
const WIDE = { hiva: 900 };   // (the landmarks wider than 400 m: their own far distance in the world file, World.znamenitost.add(..., { far }))
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };

// the game's reader, with three.js as the game loads it
const ctx = { console, TextDecoder, World: {} };
ctx.self = ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'vendor', 'three.r128.min.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'znamenitost.js'), 'utf8'), ctx);
const parse = ctx.World.znamenitost.parse;

function json(buf) {   // the glb's JSON chunk
  if (buf.readUInt32LE(0) !== 0x46546C67 || buf.readUInt32LE(4) !== 2) return null;
  const len = buf.readUInt32LE(12); return buf.readUInt32LE(16) === 0x4E4F534A ? JSON.parse(buf.slice(20, 20 + len).toString('utf8')) : null;
}
const ab = (b) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
const worlds = fs.readdirSync(path.join(ROOT, 'js')).filter(f => /^world-[\w-]+\.js$/.test(f)).map(f => fs.readFileSync(path.join(ROOT, 'js', f), 'utf8')).join('\n');
const tracks = fs.readdirSync(path.join(ROOT, 'js', 'tracks')).map(f => fs.readFileSync(path.join(ROOT, 'js', 'tracks', f), 'utf8'));

const ids = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter(f => /^[\w]+\.glb$/.test(f)).map(f => f.slice(0, -4)) : [];
check('landmarks: at least one model (assets/landmarks/)', ids.length > 0, ids.join(', '));
for (const id of ids) {
  const nb = fs.readFileSync(path.join(DIR, id + '.glb')), fp = path.join(DIR, id + '-far.glb');
  check(`${id}: its far level ${id}-far.glb and its maker tools/znamenitost/${id}.py`, fs.existsSync(fp) && fs.existsSync(path.join(ROOT, 'tools', 'znamenitost', id + '.py')));
  if (!fs.existsSync(fp)) continue;
  const fb = fs.readFileSync(fp), L = { near: [nb, json(nb)], far: [fb, json(fb)] }, verts = {};
  for (const [lv, [buf, J]] of Object.entries(L)) {
    const prims = J ? J.meshes.flatMap(m => m.primitives) : [];
    verts[lv] = prims.reduce((a, p) => a + J.accessors[p.attributes.POSITION].count, 0);
    const attrs = new Set(prims.flatMap(p => Object.keys(p.attributes)));
    check(`${id} ${lv}: glTF 2.0, <= 8 primitives, <= 60 000 vertices, triangles only`, !!J && prims.length >= 1 && prims.length <= 8 && verts[lv] <= 60000 && prims.every(p => p.mode === undefined || p.mode === 4),
      J ? `${prims.length} primitives, ${verts[lv]} vertices, ${(buf.length / 1024).toFixed(0)} KB` : 'not a glTF 2.0 binary');
    check(`${id} ${lv}: no pictures and no textures (only positions, normals and the materials' base colours)`,
      !!J && !(J.images || []).length && !(J.textures || []).length && !(J.samplers || []).length && [...attrs].every(a => /^(POSITION|NORMAL|COLOR_0)$/.test(a)) &&
      (J.materials || []).every(m => !m.pbrMetallicRoughness || (!m.pbrMetallicRoughness.baseColorTexture && !m.pbrMetallicRoughness.metallicRoughnessTexture)) && (J.materials || []).every(m => !m.normalTexture && !m.emissiveTexture && !m.occlusionTexture),
      [...attrs].join(' '));
    // the game's reader: one mesh, every vertex lit by a unit normal, coloured; its faces turned outwards (up rather than down, by area)
    let m = null; try { m = parse(ab(buf)); } catch (e) { m = e; }
    const ok = m && m.pos && m.pos.length / 3 === verts[lv] && m.idx.length % 3 === 0;
    let up = 0, all = 0, unit = true, box = [1e9, -1e9, 1e9, -1e9, 1e9, -1e9];
    if (ok) {
      const P = m.pos;
      for (let i = 0; i < P.length; i += 3) { for (let c = 0; c < 3; c++) { box[c * 2] = Math.min(box[c * 2], P[i + c]); box[c * 2 + 1] = Math.max(box[c * 2 + 1], P[i + c]); } }
      for (let i = 0; i < m.nor.length; i += 3) if (Math.abs(Math.hypot(m.nor[i], m.nor[i + 1], m.nor[i + 2]) - 1) > 1e-3) unit = false;
      for (let t = 0; t < m.idx.length; t += 3) {
        const [a, b, c] = [m.idx[t] * 3, m.idx[t + 1] * 3, m.idx[t + 2] * 3];
        const u = [P[b] - P[a], P[b + 1] - P[a + 1], P[b + 2] - P[a + 2]], v = [P[c] - P[a], P[c + 1] - P[a + 1], P[c + 2] - P[a + 2]];
        const ny = u[2] * v[0] - u[0] * v[2];
        up += ny / 2; all += Math.abs(ny) / 2;   // (the triangle's area times its normal's y: up minus down)
      }
    }
    check(`${id} ${lv}: the game reads it into one mesh, unit normals, its faces turned outwards (up far outweighing down)`, ok && unit && all > 0 && up / all > 0.6,
      ok ? `up ${(up / all * 100).toFixed(0)} % of the level area, ${(box[1] - box[0]).toFixed(0)} x ${(box[3] - box[2]).toFixed(0)} x ${(box[5] - box[4]).toFixed(0)} m` : String(m && m.message || m));
    if (lv === 'near') verts.box = box;
  }
  check(`${id}: the far level lighter than the near one`, verts.far < verts.near, `${verts.near} > ${verts.far}`);
  const B = verts.box || [0, 0, 0, 0, 0, 0];
  // (Hiva: the town's walls, ~600 x 800 m, placed at the walls' middle with its own far distance, far: 700 in js/world-hiva.js)
  const W = WIDE[id] || 400;
  check(`${id}: about its own place (the model's middle within ${W * 0.075} m of (0, 0), at most ${W} m across, its heights metres above the sea)`,
    Math.abs((B[0] + B[1]) / 2) < W * 0.075 && Math.abs((B[4] + B[5]) / 2) < W * 0.075 && B[1] - B[0] < W && B[5] - B[4] < W && B[2] > -50 && B[3] < 5000,
    `x ${B[0].toFixed(0)}..${B[1].toFixed(0)}, y ${B[2].toFixed(0)}..${B[3].toFixed(0)}, z ${B[4].toFixed(0)}..${B[5].toFixed(0)}`);
  const own = tracks.find(t => new RegExp(`id:\\s*'${id}'`).test(t));
  check(`${id}: placed by a world file (World.znamenitost.add('${id}', ...)) of a real track (not a test one, not pending)`,
    worlds.includes(`znamenitost.add('${id}'`) && !!own && !/\btest:\s*true/.test(own) && !/\bpending:\s*true/.test(own));
}
// the game loads the reader before the worlds that use it
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), at = (s) => html.indexOf(s);
check('index.html: js/znamenitost.js after js/world.js (World), before the scripts start the game', at('js/world.js') > 0 && at('js/znamenitost.js') > at('js/world.js') && at('js/znamenitost.js') < at('js/game.js'));

console.log(`\n${n - bad}/${n} OK`);
process.exit(bad ? 1 : 0);
