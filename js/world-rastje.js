/* =========================================================================
   WORLD — Rastje in teren (Realizem G0, docs/realizem/paket-g.md): the plants and the ground of the real tracks by their climate and by the
   measured colours of the land round the road, the light by the latitude, the soft step from the mown verge to the slope.
   Only the real tracks (not test: true, not pending: true, not the frozen ones CLAUDE.md names) and only those with measurements in MERITVE
   (tools/proga-podatki.py, step `cover`): every other track is built as before, to the number. Nothing here adds a draw call or a vertex: the
   colours go on the materials' colour (one multiplier for a material) or, on a mountain road, into the vertex colours its ground and leaves
   have, the light on the theme's numbers, the step on colours a verge has.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined') return;

  const ZAMRZNJENE = ['suzuka', 'iroha', 'irohazaka', 'medvode'];   // (frozen before they have the flag: CLAUDE.md, »Testne proge«)
  const prava = (def) => !!def && !def.test && !def.pending && ZAMRZNJENE.indexOf(def.id) < 0;

  /* The kits by climate (Köppen–Geiger; Beck et al. 2018, CC BY 4.0): which kinds of tree a track of that climate has, as the shapes the
     builders already draw (the soft look A: a spruce of tiers, a pine with a flat crown, a broadleaf of puffs, a birch). Their shares and
     colours are not here: they come from each track's measurements (MERITVE). The track gets its climate in MERITVE with its numbers. */
  const PODNEBJA = {
    Cfb: { ime: 'zmerno oceansko', drevesa: ['smreka', 'bukev', 'breza'] },      // (the Ardennes, the Eifel: planted spruce, beech woods, birch)
    Dfb: { ime: 'zmerno celinsko', drevesa: ['smreka', 'bukev', 'javor', 'breza'] },
    Dfc: { ime: 'borealno', drevesa: ['smreka', 'bor', 'breza'] },
    Csa: { ime: 'sredozemsko', drevesa: ['pinija', 'crnika', 'cipresa'] },
    Csb: { ime: 'sredozemsko hladnejše', drevesa: ['bor', 'grmovje'] },
    Cfa: { ime: 'vlažno subtropsko', drevesa: ['listavec', 'bambus', 'cipresa'] },
    BWk: { ime: 'puščavsko', drevesa: ['grmovje'] },
    ET: { ime: 'tundra', drevesa: [] },
  };

  /* The measurements of the band 8–60 m from the road (what the chase camera sees), from tools/proga-podatki.py `cover`: the share of each
     class (ESA WorldCover 2021 v200, 10 m; © ESA WorldCover project, CC BY 4.0) and its median colour in the Sentinel-2 annual cloudless
     mosaic of the same year (Copernicus Sentinel-2 data, modified, the WorldCover composite; stored as 255 · reflectance^(1/2.2)).
     lat, lon: the track's frame (its x = 0, z = 0) where the tool put it (Spa: def.lc's forest laid on WorldCover's trees, correlation 0.69;
     Rio do Rastro: the frame of js/geo.js as it is, the same check gives 0.98 with no shift; Chapman's Peak: the frame of js/geo.js as it is,
     def.lc's class the same as WorldCover's in 92.6 % of the band's cells, in fewer with any shift).
     drevesa: the track's own kinds where its builder draws others than its climate's kit (the Serra Geral's cloud forest and araucarias).
     grmovje, golo, voda: WorldCover's shrubs, bare ground and water, where the band has them. odprto (a colour only): the grass and the shrubs
     together, the one class a builder's land cover has for both (Chapman's Peak's fynbos).
     trave: the grass among that open land (grass / (grass + shrubs)) by the section of `odsek` metres from the start line, left and right of
     the road (the builder's side 0 and 1), a digit 0–9 for 0–100 %, '-' where under a tenth of the section's band is open land. */
  const MERITVE = {
    spa: { podnebje: 'Cfb', lat: 50.44406, lon: 5.965126, delez: { drevesa: 0.337, trava: 0.093, pozidano: 0.570 },
      barva: { drevesa: 0x393e34, trava: 0x4c5143, pozidano: 0x5d5951 } },
    rastro: { podnebje: 'Cfb', lat: -28.395383, lon: -49.543494, delez: { drevesa: 0.653, trava: 0.311, pozidano: 0.036 },
      barva: { drevesa: 0x333c2f, trava: 0x464638, pozidano: 0x5a574c }, drevesa: ['listavec', 'aravkarija', 'palma', 'drevesna praprot', 'bambus'] },
    chapman: { podnebje: 'Csb', lat: -34.048739, lon: 18.361913, delez: { drevesa: 0.324, grmovje: 0.314, trava: 0.328, pozidano: 0.028, golo: 0.003, voda: 0.004 },
      barva: { drevesa: 0x373b27, grmovje: 0x434031, trava: 0x474532, odprto: 0x454232, pozidano: 0x5e5b4e, golo: 0x6f685e },
      drevesa: ['pinija', 'fynbos', 'protea', 'resa', 'restio'], odsek: 49.84,
      trave: ['---78--199998799997737899999999998989--026--6--835000-9999966454500044000136327001132000000000000035',
        '21-779999998013983075799869897----9-----2----7--4613-20288-424839----2549659644464785013000000000019'] },
  };
  const aktivna = (def) => prava(def) && !!MERITVE[def.id];

  /* How strongly the measured colour moves the game's (0 none, 1 all of the measured hue): only the hue and the saturation move, never the
     brightness (the measured colours are from above, through the air, with the ground's own shading in them: their brightness is not the
     eye's at the road). The user's choice: docs/vprasanja.md, »Rastje: barve po meritvah«. */
  const MOC = 0.35;
  const LUM = [0.2126, 0.7152, 0.0722];
  const lum = (c) => c[0] * LUM[0] + c[1] * LUM[1] + c[2] * LUM[2];
  const hex3 = (h) => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];
  // the multiplier that gives the game's colour `igra` the measured colour's hue (in `moc`), its brightness kept. The renderer writes its
  // numbers to the screen as they are (no output encoding), so the game's colours and the stored measured ones compare as they are
  function mnozilnik(igra, meritev, moc) {
    const mi = (igra[0] + igra[1] + igra[2]) / 3, mm = (meritev[0] + meritev[1] + meritev[2]) / 3;
    if (!(mi > 1e-4) || !(mm > 1e-4)) return [1, 1, 1];
    let m = [0, 1, 2].map(k => 1 + moc * ((meritev[k] / mm) / Math.max(1e-4, igra[k] / mi) - 1));
    const l0 = lum(igra), l1 = lum(igra.map((v, k) => v * m[k])); if (l1 > 1e-6) m = m.map(v => v * l0 / l1);
    return m;
  }
  // the trees' colour as the game draws it, on average: each kind's unit tree (its vertex colours) by its instances' colours, by their count
  function barvaDreves(chunks) {
    const s = [0, 0, 0]; let n = 0;
    for (const ic of chunks) {
      const ca = ic.base.attributes.color; if (!ca) continue;
      const g = [0, 0, 0], a = ca.array, nv = a.length / ca.itemSize;
      for (let k = 0; k < a.length; k += ca.itemSize) { g[0] += a[k]; g[1] += a[k + 1]; g[2] += a[k + 2]; }
      for (const L of ic.map.values()) for (let k = 0; k < L.length; k += 9) { s[0] += g[0] / nv * L[k + 6]; s[1] += g[1] / nv * L[k + 7]; s[2] += g[2] / nv * L[k + 8]; n++; }
    }
    return n ? s.map(v => v / n) : null;
  }
  // the grass's colour as the game draws it where WorldCover counts grass: the open land 8–60 m from the road, the ground's colours there by
  // the grass picture's average (o: { lc(x, z) → class, dist(x, z) → metres from the road, gcol(x, z) → [r, g, b], avg: [r, g, b] 0–255,
  // x0, z0, x1, z1: the corridor })
  function barvaTrave(o) {
    const s = [0, 0, 0]; let n = 0;
    for (let z = o.z0; z < o.z1; z += 8) for (let x = o.x0; x < o.x1; x += 8) {
      const d = o.dist(x, z); if (d < 8 || d > 60 || o.lc(x, z) !== 0) continue;
      const c = o.gcol(x, z); s[0] += c[0]; s[1] += c[1]; s[2] += c[2]; n++;
    }
    if (!n) return null;
    return s.map((v, k) => v / n * (o.avg ? o.avg[k] / 255 : 1));
  }
  /* Kos 2: the measured colours on a real track's materials. m: { tla: the ground's material, trava: barvaTrave's options, drevesa: the
     trees' material, chunks: their IChunks }. Returns what it did (for the tests and the docs), or null on a track it leaves as it was. */
  function barve(def, m, moc) {
    if (!aktivna(def)) return null;
    const M = MERITVE[def.id], k = moc == null ? MOC : moc, out = { moc: k };
    if (m.tla && m.trava) { const g = barvaTrave(m.trava); if (g) { out.tla = mnozilnik(g, hex3(M.barva.trava), k); m.tla.color.setRGB(out.tla[0], out.tla[1], out.tla[2]); } }
    if (m.drevesa && m.chunks) { const g = barvaDreves(m.chunks); if (g) { out.drevesa = mnozilnik(g, hex3(M.barva.drevesa), k); m.drevesa.color.setRGB(out.drevesa[0], out.drevesa[1], out.drevesa[2]); } }
    return out;
  }

  /* The same for a mountain road, whose one ground material also draws the rock, the red earth and the concrete, and whose trees stand on
     tall bare trunks: there a multiplier on a whole material would turn the grey rock lilac and the bark pink. Its builder asks for the
     multipliers alone and puts them in its vertex colours where plants grow (still no draw call and no vertex more).
     tla: the ground's multiplier (o: barvaTrave's options, asked while the builder's colours are still the game's own).
     listje: the leaves' multiplier, from the unit trees' green vertices (g > r: the leaves, not the bark) by their instances' colours, and
     those vertices multiplied by it in place (before addTo; the unit trees are the build's own, so nothing carries to the next build).
     kljuc: the measured class whose colour they take (tla: 'trava', listje: 'drevesa' unless given; a track with shrubs measured apart
     asks for each of its plants' classes on its own). */
  function tla(def, o, moc, kljuc) {
    if (!aktivna(def)) return null;
    const g = barvaTrave(o), c = MERITVE[def.id].barva[kljuc || 'trava'];
    return g && c != null ? mnozilnik(g, hex3(c), moc == null ? MOC : moc) : null;
  }
  function listje(def, chunks, moc, kljuc) {
    if (!aktivna(def) || MERITVE[def.id].barva[kljuc || 'drevesa'] == null) return null;
    const s = [0, 0, 0]; let n = 0;
    for (const ic of chunks) {
      const ca = ic.base.attributes.color; if (!ca) continue;
      const g = [0, 0, 0], a = ca.array; let nv = 0;
      for (let k = 0; k < a.length; k += ca.itemSize) if (a[k + 1] > a[k]) { g[0] += a[k]; g[1] += a[k + 1]; g[2] += a[k + 2]; nv++; }
      if (!nv) continue;
      for (const L of ic.map.values()) for (let k = 0; k < L.length; k += 9) { s[0] += g[0] / nv * L[k + 6]; s[1] += g[1] / nv * L[k + 7]; s[2] += g[2] / nv * L[k + 8]; n++; }
    }
    if (!n) return null;
    const m = mnozilnik(s.map(v => v / n), hex3(MERITVE[def.id].barva[kljuc || 'drevesa']), moc == null ? MOC : moc);
    for (const ic of chunks) {
      const ca = ic.base.attributes.color; if (!ca) continue;
      const a = ca.array;
      for (let k = 0; k < a.length; k += ca.itemSize) if (a[k + 1] > a[k]) { a[k] *= m[0]; a[k + 1] *= m[1]; a[k + 2] *= m[2]; }
      ca.needsUpdate = true;
    }
    return m;
  }
  /* The grass among the open land (MERITVE's trave) `s` metres after the start line, left (desno false) or right of the road: 0–1, between
     the sections' centres linearly. null where the measurement has no open land (both sections round it '-'), beyond the measured stretch
     and on a track with no such measurement: there the builder keeps its own mix of plants. */
  function trave(def, s, desno) {
    if (!aktivna(def)) return null;
    const M = MERITVE[def.id], t = M.trave && M.trave[desno ? 1 : 0];
    if (!t || !(s >= 0) || s >= t.length * M.odsek) return null;
    const u = s / M.odsek - 0.5, a = Math.max(0, Math.floor(u)), b = Math.min(t.length - 1, a + 1), f = Math.max(0, u - a);
    const va = t.charCodeAt(a) - 48, vb = t.charCodeAt(b) - 48, oa = va >= 0 && va <= 9, ob = vb >= 0 && vb <= 9;
    if (!oa && !ob) return null;
    return (oa && ob ? va + (vb - va) * f : oa ? va : vb) / 9;
  }

  /* Kos 3: the light by the latitude. The theme's sun is the sun high in a clear summer sky; at the track's latitude the summer's noon sun
     stands at 90° − |lat| + 23.44° and its light comes through more air (air mass 1 / sin of the height), which takes more blue than red
     (Rayleigh's optical depth at the zenith ≈ 0.052 red, 0.098 green, 0.236 blue, at 650 / 550 / 450 nm). The sun's colour and strength move
     by what that extra air takes, against the sun overhead; the sky's light (hemiI) and the grade stay as the theme has them. */
  const TAU_R = [0.052, 0.098, 0.236];
  function svetloba(lat) {
    const e = Math.max(5, Math.min(90, 90 - Math.abs(lat) + 23.44)) * Math.PI / 180, am = 1 / Math.sin(e);
    const t = TAU_R.map(v => Math.exp(-v * (am - 1)));
    return { visina: e * 180 / Math.PI, zrak: am, barva: t, moc: lum(t) };
  }
  const _cache = new WeakMap();
  function look(t, def) {
    if (!t || !aktivna(def) || typeof THREE === 'undefined') return null;
    let c = _cache.get(t); if (c && c.id === def.id) return c.t;
    const L = svetloba(MERITVE[def.id].lat), s = new THREE.Color(t.sun), m = L.barva.map(v => v / L.moc);
    s.setRGB(Math.min(1, s.r * m[0]), Math.min(1, s.g * m[1]), Math.min(1, s.b * m[2]));
    const o = Object.assign({}, t, { sun: s.getHex(), sunI: t.sunI * L.moc });
    _cache.set(t, { id: def.id, t: o });
    return o;
  }

  /* Kos 4: the soft step from the mown verge to the slope. The verge's colours (its mower's bands) go over to the ground's colour beyond it
     (g) across the verge's width (u: 0 at the road's edge, 1 at the verge's outer end): little near the road, where the bands stay clear,
     all of it at the end, so no line where the mown grass meets the slope. */
  function prehod(c, g, u) {
    const w = u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u), k = 0.15 + 0.85 * w;
    return [c[0] + (g[0] - c[0]) * k * w, c[1] + (g[1] - c[1]) * k * w, c[2] + (g[2] - c[2]) * k * w];
  }

  World.rastje = { prava, aktivna, PODNEBJA, MERITVE, MOC, mnozilnik, barvaDreves, barvaTrave, barve, tla, listje, trave, svetloba, look, prehod };
})();
