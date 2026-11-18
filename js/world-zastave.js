/* =========================================================================
   WORLD — flags that wave (Grafika 02: the user's choice of 3. 11. 2026 on the Odločitve page, »Zastave, ki plapolajo v vetru«: the flags
   on the poles by the grandstands, on the start/finish straight and on the towers wave in the wind instead of standing stiff; the wave is
   the graphics card's (a vertex shader), so the phone's load stays small; on NIZKA only the flags near the camera wave).
   World.flagMesh(list, uTime, o): one mesh for all the cloths of a world (one draw call; it casts no shadow), waved in the vertex shader on
   a clock World.update drives (uTime: the world's wind, out.dyn.wind, or the crowd's): waves run from the pole to the free end and grow
   towards it, the folds are shaded (the normal tilted with the wave's slope: three.js r128 lights a Lambert material per vertex, so the
   bands of light and shade run along the cloth with the waves), the free end sags a little as it swings, and gusts come and go. On NIZKA
   (o.tier 0) only the cloths within FAR m of the camera wave, the farther ones fly flat as before.
   list: [x, y, z, rot, look, W, H, amp]: the pole at the cloth's top edge (x, y, z), the way the cloth flies from it (rot: radians from
   +x, as World's box turns a box), the cloth's length W and height H, its look: stripes across, top to bottom ([[r, g, b], ...]),
   { up: [...] } upright bands from the pole out, { chq: [nx, ny, c0, c1] } a chequer, { grid: [u edges, v edges, colours by row] } a
   canton or a cross, { tri: colour } a pennant, { wedge: [top, bottom, colour, a] } two stripes with a wedge at the pole to a of the length (Czechia's), { serr: [band, field, a, b, n] } a band at the pole
   serrated into the field, n points from a to b of the length (Bahrain's, Qatar's), { uv: [u0, u1, v top, v bottom], tex } a picture from a texture (one mesh for each texture, o.map); any look may carry emblems, look.sym (symbols(): a crescent, a star; Turkey's, Malaysia's); amp: how much it waves (1 = a cloth flag; a banner held at both ends less). o.own: the THREE objects named with World's own generator (World.api.ownRnd), so a seeded race runs as it did before
   for a world that had no such mesh (the worlds that had one, rbFlags, make theirs with Math.random as they always did).
   World.api.flags: the flags of the build under way (add as they are put up; World's build makes their mesh at the end), its clock the
   world's wind; canton(): the look of stripes with a canton.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined') return;
  const TAU = Math.PI * 2;
  const FAR = 70;   // (NIZKA: the cloths within this many metres of the camera wave, fading out over the last 12 m)
  const AMP = 0.1;   // (the wave at the free end, as a share of the cloth's length)
  const hash = (x, z) => { const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453; return s - Math.floor(s); };   // (each flag its own phase, from where it stands: no draw of the builders' random numbers)

  // the cells of a look: [u0, u1, v0, v1, colour] (u along the cloth from the pole, v down from its top edge); a cell's own vertices, so its
  // colour ends sharply at the next one's
  function cells(look) {
    if (Array.isArray(look)) { const n = look.length; return look.map((c, b) => [0, 1, b / n, (b + 1) / n, c]); }   // stripes across
    if (look && look.up) { const n = look.up.length; return look.up.map((c, b) => [b / n, (b + 1) / n, 0, 1, c]); }   // upright bands
    if (look && look.chq) { const [nx, ny, c0, c1] = look.chq, out = []; for (let a = 0; a < nx; a++) for (let b = 0; b < ny; b++) out.push([a / nx, (a + 1) / nx, b / ny, (b + 1) / ny, (a + b) % 2 ? c1 : c0]); return out; }   // a chequer
    if (look && look.grid) { const [us, vs, cols] = look.grid, out = []; for (let b = 0; b + 1 < vs.length; b++) for (let a = 0; a + 1 < us.length; a++) out.push([us[a], us[a + 1], vs[b], vs[b + 1], cols[b][a]]); return out; }   // a canton, a cross: [u edges, v edges, colours by row]
    if (look && look.tri) return [[0, 1, 0, 1, look.tri]];   // a pennant: one colour, narrowing to a point
    if (look && look.wedge) { const [top, bot, wc, a] = look.wedge, up = (u) => (u < a ? 0.5 * u / a : 0.5), dn = (u) => 1 - up(u); return [[0, 1, 0, up, top], [0, a, up, dn, wc], [0, 1, dn, 1, bot]]; }   // a wedge at the pole (its cells' v edges as functions of u)
    if (look && look.serr) {   // a band at the pole serrated into the field: n points of the band's colour from u a to b (Bahrain's, Qatar's)
      const [band, field, a, b, n] = look.serr, hw = (u) => 0.5 / n * (b - u) / (b - a), out = [[0, a, 0, 1, band], [b, 1, 0, 1, field]];
      for (let k = 0; k < n; k++) { const c = (k + 0.5) / n, lo = (u) => c - hw(u), hi = (u) => c + hw(u); out.push([a, b, k / n, lo, field], [a, b, lo, hi, band], [a, b, hi, (k + 1) / n, field]); }
      return out;
    }
    if (look && look.uv) return [[0, 1, 0, 1, [1, 1, 1]]];   // a picture: the cloth white under its texture (look.tex)
    return [[0, 1, 0, 1, [0.92, 0.92, 0.9]]];
  }

  // the emblems on a cloth (look.sym, on any look: Turkey's crescent and star, Malaysia's), on both faces EMB m off it at their own u, so they
  // wave with it (the same u, phase and wave as the cloth under them); their sizes in the flag's height G, x from the pole and y down from the
  // top edge. ['moon', colour, x, y, r1, dx, r2]: a crescent between the circle of r1 round (x, y) and the circle of r2 round (x + dx, y), its
  // horns to the free end; ['star', colour, x, y, r1, r2, n, a]: a star of n points, r1 out and r2 in, a point at the angle a (radians: 0 to
  // the free end, PI to the pole, -PI/2 up). put(gx, gy, side, colour) adds a vertex and answers its index; tri(a, b, c) a triangle
  const EMB = 0.02;
  function symbols(sym, put, tri, NC) {
    for (const sm of sym) for (const sg of [1, -1]) {
      const col = sm[1];
      if (sm[0] === 'moon') {
        const [, , gx, gy, r1, dx, r2] = sm, hx = (r1 * r1 - r2 * r2 + dx * dx) / (2 * dx), hy = Math.sqrt(Math.max(0, r1 * r1 - hx * hx));
        const a1 = Math.atan2(hy, hx), a2 = Math.atan2(hy, hx - dx);   // (the horns: where the circles meet, on each circle)
        let p0 = -1;
        for (let k = 0; k <= NC; k++) {
          const t = k / NC, p = a1 + (TAU - 2 * a1) * t, q = a2 + (TAU - 2 * a2) * t;
          const o = put(gx + r1 * Math.cos(p), gy + r1 * Math.sin(p), sg, col), i = put(gx + dx + r2 * Math.cos(q), gy + r2 * Math.sin(q), sg, col);
          if (p0 >= 0) { tri(p0, o, i); tri(p0, i, p0 + 1); }
          p0 = o;
        }
      } else if (sm[0] === 'star') {
        const [, , gx, gy, r1, r2, n, a0] = sm, m = put(gx, gy, sg, col), rim = [];
        for (let k = 0; k < 2 * n; k++) { const r = k & 1 ? r2 : r1, an = a0 + k * Math.PI / n; rim.push(put(gx + r * Math.cos(an), gy + r * Math.sin(an), sg, col)); }
        for (let k = 0; k < 2 * n; k++) tri(m, rim[k], rim[(k + 1) % (2 * n)]);
      }
    }
  }

  // the vertex shader's additions (r128's Lambert: the normal first, then the position). aFlag: u (0 at the pole .. 1 the free end), the
  // flag's phase, its wave at the free end (m), its length (m). The cloth's plane normal comes horizontal, (-sin rot, 0, cos rot), the way
  // it flies is then (n.z, 0, -n.x)
  const VS_PARS = '#include <common>\nattribute vec4 aFlag;\nuniform float uFlagT;\nuniform float uFlagFar;';
  const VS_NORMAL = ['#include <beginnormal_vertex>',
    'float zwU = aFlag.x, zwL = max(aFlag.w, 0.2), zwA = aFlag.z * (0.75 + 0.25 * sin(uFlagT * 0.37 + aFlag.y * 1.7));',   // (gusts: each flag in its own time)
    'if (uFlagFar > 0.0) zwA *= clamp((uFlagFar - distance((modelMatrix * vec4(position, 1.0)).xyz, cameraPosition)) / 12.0, 0.0, 1.0);',   // (NIZKA: only near the camera)
    'float zwP = uFlagT * 11.0 - zwU * 8.5 + aFlag.y, zwQ = uFlagT * 17.0 - zwU * 14.0 + aFlag.y * 2.3;',   // (a wave and a half along the cloth, a flutter on it)
    'float zwG = zwU * (1.6 - 0.6 * zwU), zwW = sin(zwP) + 0.3 * sin(zwQ), zwD = zwA * zwG * zwW;',   // (out of the plane: none at the pole, growing to the free end)
    'float zwS = zwA * ((1.6 - 1.2 * zwU) * zwW - zwG * (8.5 * cos(zwP) + 4.2 * cos(zwQ))) / zwL;',   // (its slope along the cloth, per metre)
    'vec3 zwN = normalize(vec3(objectNormal.x, 0.0, objectNormal.z)), zwF = vec3(zwN.z, 0.0, -zwN.x);',
    'objectNormal = normalize(zwN - zwF * zwS);'].join('\n');
  const VS_BEGIN = ['#include <begin_vertex>',
    'transformed += zwN * zwD - zwF * (0.5 * zwD * zwD / zwL);',   // (a wave out of the plane pulls the free end in a little)
    'transformed.y -= (0.55 + 0.45 * zwW) * zwA * 0.3 * zwU * zwU;',   // (and it sags as it swings)
    '#ifdef USE_COLOR', 'vColor.rgb *= clamp(1.0 + 0.3 * zwS, 0.66, 1.2);', '#endif'].join('\n');   // (the folds: light on one side of a wave, shade on the other, whatever the sun)

  function flagMat(uTime, far, map) {
    const m = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, map: map || null });
    const uFar = { value: far };
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uFlagT = uTime; sh.uniforms.uFlagFar = uFar;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', VS_PARS).replace('#include <beginnormal_vertex>', VS_NORMAL).replace('#include <begin_vertex>', VS_BEGIN);
    };
    m.customProgramCacheKey = () => 'flagwave';
    m.userData.flag = { uTime, uFar };   // (tests: the clock and the reach)
    return m;
  }

  function flagMesh(list, uTime, o) {
    o = o || {};
    const P = [], N = [], C = [], F = [], I = [], UV = o.map ? [] : null; let v = 0;
    for (const e of list) {
      const [x, y, z, rot, look, W, H, amp] = e, c = Math.cos(rot), s = Math.sin(rot), ph = hash(x, z) * TAU, A = W * AMP * (amp == null ? 1 : amp);
      const SEG = o.tier === 0 ? Math.max(4, Math.min(6, Math.round(W / 0.3))) : Math.max(6, Math.min(12, Math.round(W / 0.14))), CL = cells(look), tri = !!(look && look.tri);   // (segments along the cloth, about eight to a wave, a long one more; NIZKA four to six: about as many triangles as the stiff boxes had)
      const US = new Set(), q5 = (u) => Math.round(u * 1e5) / 1e5; for (let j = 0; j <= SEG; j++) US.add(q5(j / SEG)); for (const q of CL) { US.add(q5(q[0])); US.add(q5(q[1])); }
      const us = [...US].sort((p, q) => p - q);   // (every cell's u at the same places, its neighbours' edges among them: no cracks between rows)
      for (const [u0, u1, v0, v1, col] of CL) {
        const uu = us.filter(u => u >= q5(u0) && u <= q5(u1)), k = uu.length - 1;
        for (const u of uu) for (const e of [v0, v1]) {
          const f = typeof e === 'function' ? e(u) : e, fv = tri ? 0.5 + (f - 0.5) * (1 - 0.94 * u) : f;   // (a pennant narrows to its tip)
          P.push(x + c * W * u, y - H * fv - u * u * 0.08 * H, z + s * W * u); N.push(-s, 0, c); C.push(col[0], col[1], col[2]); F.push(u, ph, A, W);
          if (UV) { const q = look.uv; UV.push(q[0] + (q[1] - q[0]) * u, q[2] + (q[3] - q[2]) * fv); }   // (look.uv: [u at the pole, u at the free end, v at the top, v at the bottom])
        }
        for (let j = 0; j < k; j++) { const a = v + j * 2; I.push(a, a + 2, a + 3, a, a + 3, a + 1); }
        v += (k + 1) * 2;
      }
      if (look && look.sym) symbols(look.sym, (gx, gy, sg, col) => {   // (its emblems: gx, gy in the flag's height)
        const u = gx * H / W;
        P.push(x + c * W * u - s * EMB * sg, y - H * gy - u * u * 0.08 * H, z + s * W * u + c * EMB * sg); N.push(-s, 0, c); C.push(col[0], col[1], col[2]); F.push(u, ph, A, W);
        if (UV) UV.push(0, 0);
        return v++;
      }, (a, b, d) => I.push(a, b, d), o.tier === 0 ? 8 : 12);
    }
    if (!v) return null;
    const make = () => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aFlag', new THREE.Float32BufferAttribute(F, 4)); if (UV) g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I);
      g.computeBoundingSphere(); g.boundingSphere.radius += 1;   // (the wave reaches a little out of the cloths' rest)
      const mesh = new THREE.Mesh(g, flagMat(uTime, o.tier === 0 ? FAR : 0, o.map));
      mesh.receiveShadow = true; mesh.matrixAutoUpdate = false; mesh.name = 'flags'; mesh.userData.flags = list.length;
      return mesh;
    };
    return o.own && World.api && World.api.ownRnd ? World.api.ownRnd(make) : make();
  }

  // the flags of the build under way: World's build opens the list for a world of its own file (begin) and makes its mesh at the end
  // (done: one mesh, made with World's own generator, its clock the world's wind); while it is closed (the test tracks' builder), add()
  // answers false and the builder draws its cloth stiff as before. A world that makes its own flags' mesh takes the list in (take: the
  // Red Bull Ring's builder and the two that use its rbFlags)
  let cur = null;
  const flags = {
    // a look: stripes across (top to bottom) with a canton in the top corner at the pole (u 0..cu, v 0..cv) of colour col (the US flag, Chile's)
    canton(stripes, cu, cv, col) {
      const n = stripes.length, vs = [0], rows = [];
      for (let b = 1; b <= n; b++) { const e = b / n; if (cv > vs[vs.length - 1] + 1e-6 && cv < e - 1e-6) vs.push(cv); vs.push(e); }
      for (let r = 0; r + 1 < vs.length; r++) { const m = (vs[r] + vs[r + 1]) / 2, st = stripes[Math.min(n - 1, Math.floor(m * n))]; rows.push([m < cv ? col : st, st]); }
      return { grid: [[0, cu, 1], vs, rows] };
    },
    begin() { cur = []; },
    add(x, y, z, rot, look, W, H, amp, grp) { if (!cur) return false; cur.push([x, y, z, rot, look, W, H, amp, grp]); return true; },   // (grp: a part of the world that comes and goes, its flags a mesh of their own in it: Vršič's finish, out.dyn.vrFin)
    take() { const L = cur || []; if (cur) cur = []; return L; },
    done(out) {
      const L = cur; cur = null;
      if (!L || !L.length || !out || !out.root) return out;
      const wind = out.dyn.wind || (out.dyn.wind = { value: 0 }), o = { own: true, tier: World.api && World.api.LOD ? World.api.LOD.tier : 2 };   // (World.update drives the wind: t % 1000)
      const by = new Map();   // (a mesh for each group and texture)
      for (const e of L) { const g = e[8] || out.root, mp = (e[4] && !Array.isArray(e[4]) && e[4].tex) || null; let k = by.get(g); if (!k) by.set(g, k = new Map()); if (!k.has(mp)) k.set(mp, []); k.get(mp).push(e); }
      for (const [g, k] of by) for (const [mp, l] of k) { const m = flagMesh(l, wind, Object.assign({ map: mp }, o)); if (m) g.add(m); }
      return out;
    }
  };

  World.flagMesh = flagMesh;
  if (World.api) World.api.flags = flags;
})();
