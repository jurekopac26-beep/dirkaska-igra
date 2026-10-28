(() => {
  // (pictures only) the user: "Naj bo tudi mivka ob progi enaka kot je plaža ... 3 različne opcije", and then (on the far west hairpin): "Tukaj naj ostane
  // prejšnja verzija mivke, ker smo daleč od morja in je tukaj drugačna. Počasi se spreminja: bolj ko je oddaljena od morja, bolj je podobna tej mivki na
  // tem zavoju. Prehod naj bo dolg in mehak."
  // So the run-offs' sand (the makadam's sand along the roads: H3.roHit in the baked cells, the run-offs' colour in the pictures' own meshes; not the gravel
  // ways' middles) keeps its old look, and over it lies the beach's sand (its own colour as it shows), opaque by the sea and fading out with the distance
  // from the beach, softly (smoothstep), over a long way (window.__SB2(k)):
  //  0 over the whole map: the beach's sand by the sea, half by the middle, the old sand only at the far west edge (10-480 m from the beach)
  //  1 the beach's sand up to 80 m from the beach, then fading to the old by 360 m (the west third the old sand)
  //  2 the beach's sand only by the sea (30 m), fading to the old by 240 m (the west half the old sand)
  //  3 the user's own: "4 opcija. Prehod med različnimi mivkami naj bo mehak": the two sands stay as they are (the run-offs' old sand, the beach's),
  //    only where they meet the change is soft: the beach's colour at its edge fading into the old sand over 20 m
  //  -1 as before (the old sand everywhere)
  // (v3: no layer over the sand (where two of its meshes overlap, a half-clear layer drawn twice showed darker patches): the run-offs' own triangles
  // moved into meshes of their own whose material mixes, per vertex (fade), its makadam look (texture, colour, bump, shine) into the beach's flat colour)
  const H = window.__H3, sc = Render.scene, out = {}; sc.updateMatrixWorld(true);
  const sst = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  if (window.__SBEACH) { window.__SBEACH(-1); if (window.__SBROOT) sc.remove(window.__SBROOT); window.__SBEACH = null; }
  if (window.__SB2) window.__SB2(-1); if (window.__SB2ROOT) sc.remove(window.__SB2ROOT);
  const ROOT = new THREE.Group(); ROOT.name = 'sbeach2'; ROOT.userData.keep = true; sc.add(ROOT); window.__SB2ROOT = ROOT;
  const MKI = Tex.all().makadam.image, BE = [0.543, 0.463, 0.343];   // (the beach's colour as it shows: most of it lies 0.1-0.2 m over the water)
  if (!H.roHit) return 'no roHit';
  // the gravel ways' firm middles (they stay makadam, no beach over them)
  const CELL = 8, SG = new Map(), key = (i, j) => i * 100003 + j;
  for (const e of H.net || []) { if (!e.P || e.P.length < 2 || e.P[0][0] < -5000 || !(e.kind === 'dirt' || e.kind === 'forest')) continue; const r = Math.max(0.8, e.hw - 0.6);
    for (let k = 0; k < e.P.length - 1; k++) { const [ax, az] = e.P[k], [bx, bz] = e.P[k + 1];
      for (let i = Math.floor((Math.min(ax, bx) - r) / CELL); i <= Math.floor((Math.max(ax, bx) + r) / CELL); i++) for (let j = Math.floor((Math.min(az, bz) - r) / CELL); j <= Math.floor((Math.max(az, bz) + r) / CELL); j++) { const kk = key(i, j); let L = SG.get(kk); if (!L) SG.set(kk, L = []); L.push([ax, az, bx, bz, r]); } } }
  const onWay = (x, z) => { const L = SG.get(key(Math.floor(x / CELL), Math.floor(z / CELL))); if (!L) return false; for (const [ax, az, bx, bz, r] of L) { const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2)), ex = ax + dx * t - x, ez = az + dz * t - z; if (ex * ex + ez * ez < r * r) return true; } return false; };
  // ---- the distance from the beach: its vertices (beachSet's C.userData.orig) stamped on a 4 m grid, a chamfer distance over it
  const V = new THREE.Vector3(), G0 = [-420, -470], GC = 4, GW = 210, GH = 210, D = new Float32Array(GW * GH).fill(1e9); let nB = 0;
  const seenC = new Set(); sc.traverse(o => { if (!o.isMesh || o.isInstancedMesh || !o.geometry || o.parent === ROOT) return; const C = o.geometry.attributes.color; if (!C || !C.userData || !C.userData.orig || seenC.has(C)) return; seenC.add(C);
    const Pa = o.geometry.attributes.position, e = o.matrixWorld, id = e.equals(new THREE.Matrix4()), K = C.userData.orig; for (let q = 0; q < K.length; q += 2) { V.fromBufferAttribute(Pa, K[q]); if (!id) V.applyMatrix4(e); const i = Math.round((V.x - G0[0]) / GC), j = Math.round((V.z - G0[1]) / GC); if (i >= 0 && j >= 0 && i < GW && j < GH) { D[j * GW + i] = 0; nB++; } } });
  for (let pass = 0; pass < 2; pass++) { for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) { const q = j * GW + i; let d = D[q]; if (i > 0) d = Math.min(d, D[q - 1] + GC); if (j > 0) { d = Math.min(d, D[q - GW] + GC); if (i > 0) d = Math.min(d, D[q - GW - 1] + GC * 1.4142); if (i < GW - 1) d = Math.min(d, D[q - GW + 1] + GC * 1.4142); } D[q] = d; }
    for (let j = GH - 1; j >= 0; j--) for (let i = GW - 1; i >= 0; i--) { const q = j * GW + i; let d = D[q]; if (i < GW - 1) d = Math.min(d, D[q + 1] + GC); if (j < GH - 1) { d = Math.min(d, D[q + GW] + GC); if (i < GW - 1) d = Math.min(d, D[q + GW + 1] + GC * 1.4142); if (i > 0) d = Math.min(d, D[q + GW - 1] + GC * 1.4142); } D[q] = d; } }
  const dBeach = (x, z) => { const fx = (x - G0[0]) / GC, fz = (z - G0[1]) / GC, i = Math.max(0, Math.min(GW - 2, Math.floor(fx))), j = Math.max(0, Math.min(GH - 2, Math.floor(fz))), u = Math.max(0, Math.min(1, fx - i)), v = Math.max(0, Math.min(1, fz - j)); const a = D[j * GW + i], b = D[j * GW + i + 1], c = D[(j + 1) * GW + i], d = D[(j + 1) * GW + i + 1]; return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v; };
  window.__SB2D = dBeach; out.beachCells = nB;
  // ---- the beach's own colour where the run-offs meet it (its vertices above the water, 2 m cells, filled out 40 m): a run-off by the beach takes the
  // colour of the beach beside it (no step where the beach's cells end), 6-30 m away the beach's usual colour
  const BC = 2, BX0 = -420, BZ0 = -470, BWd = 420, BHd = 420, BA = new Float32Array(BWd * BHd * 4); { const seen = new Set(); sc.traverse(o => { if (!o.isMesh || o.isInstancedMesh || !o.geometry || o.parent === ROOT) return; const C = o.geometry.attributes.color; if (!C || !C.userData || !C.userData.orig || seen.has(C)) return; seen.add(C);
      const Pa = o.geometry.attributes.position, e = o.matrixWorld, id = e.equals(new THREE.Matrix4()), K = C.userData.orig, WLv = H.water ? H.water.WL : -0.12; for (let q = 0; q < K.length; q += 2) { const i = K[q]; V.fromBufferAttribute(Pa, i); if (!id) V.applyMatrix4(e); if (V.y < WLv + 0.02) continue; const a = Math.floor((V.x - BX0) / BC), b = Math.floor((V.z - BZ0) / BC); if (a < 0 || b < 0 || a >= BWd || b >= BHd) continue; const c = (b * BWd + a) * 4; BA[c] += C.getX(i); BA[c + 1] += C.getY(i); BA[c + 2] += C.getZ(i); BA[c + 3]++; } }); }
  const BM = new Float32Array(BWd * BHd * 3), BH = new Uint8Array(BWd * BHd); for (let c = 0; c < BWd * BHd; c++) if (BA[c * 4 + 3]) { for (let j = 0; j < 3; j++) BM[c * 3 + j] = BA[c * 4 + j] / BA[c * 4 + 3]; BH[c] = 1; }
  for (let it = 0; it < 20; it++) { const nh = BH.slice(), nm = BM.slice(); for (let b = 1; b < BHd - 1; b++) for (let a = 1; a < BWd - 1; a++) { const c = b * BWd + a; if (BH[c]) continue; let s0 = 0, s1 = 0, s2 = 0, n = 0; for (const q of [c - 1, c + 1, c - BWd, c + BWd]) if (BH[q]) { s0 += BM[q * 3]; s1 += BM[q * 3 + 1]; s2 += BM[q * 3 + 2]; n++; } if (n) { nm[c * 3] = s0 / n; nm[c * 3 + 1] = s1 / n; nm[c * 3 + 2] = s2 / n; nh[c] = 1; } } BM.set(nm); BH.set(nh); }
  const beachCol = (x, z) => { const a = Math.floor((x - BX0) / BC), b = Math.floor((z - BZ0) / BC); if (a < 0 || b < 0 || a >= BWd || b >= BHd) return null; const c = b * BWd + a; return BH[c] ? [BM[c * 3], BM[c * 3 + 1], BM[c * 3 + 2]] : null; };
  // (the old soft strip along the beach's landward edge at the north-east (darker than the beach, lying over itself): not needed now, hidden)
  const oldStrips = []; sc.traverse(o => { if (!o.isMesh || o.isInstancedMesh || !o.geometry || o.parent === ROOT) return; const m = Array.isArray(o.material) ? o.material[0] : o.material; if (!m || m.type !== 'MeshLambertMaterial' || !m.transparent || !m.vertexColors || m.map || o.renderOrder !== 3 || m.polygonOffsetFactor !== -6) return; const C = o.geometry.attributes.color; if (!C || C.itemSize !== 4) return; if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); const b = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld); if (b.max.y - b.min.y > 0.5) return; const cx = (b.min.x + b.max.x) / 2, cz = (b.min.z + b.max.z) / 2; if (dBeach(cx, cz) > 25) return; oldStrips.push(o); });
  out.oldStrips = oldStrips.length;
  // ---- the run-offs' triangles into meshes of their own (world positions, normals, their uv and colours as they were, a fade per vertex), folded in the old
  const roCol = (C, i) => { if (!C) return false; const r = C.getX(i), g = C.getY(i), b = C.getZ(i); return r >= 0.98 && r >= g && g >= b && r - b >= 0.03 && r - b <= 0.14; };
  const baked = (o) => { for (let p = o.parent; p; p = p.parent) if (p.name === 'nv-baked') return true; return false; };
  const mk = []; sc.traverse(o => { if (!o.isMesh || o.isInstancedMesh || !o.geometry || !o.geometry.attributes.position || o.parent === ROOT) return; let vis = true; for (let p = o; p; p = p.parent) if (!p.visible) vis = false; if (!vis) return; const m = Array.isArray(o.material) ? o.material[0] : o.material; if (m && m.map && m.map.image === MKI) mk.push(o); });
  const flags = new Map(), N3 = new THREE.Matrix3(), made = [], rec = [], mats = new Map(); let nT = 0;
  const BEc = new THREE.Color(BE[0], BE[1], BE[2]);
  const fadeMat = (m0) => { let m = mats.get(m0); if (m) return m; m = m0.clone(); m.onBeforeCompile = (sh) => { sh.uniforms.uBE = { value: BEc };
      sh.vertexShader = 'attribute float fade;\nattribute vec3 bcol;\nvarying float vFade;\nvarying vec3 vBcol;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n\tvFade = fade;\n\tvBcol = bcol;');
      sh.fragmentShader = 'varying float vFade;\nvarying vec3 vBcol;\nuniform vec3 uBE;\n' + sh.fragmentShader.replace('#include <bumpmap_pars_fragment>', THREE.ShaderChunk.bumpmap_pars_fragment.replace(/bumpScale \*/g, 'bumpScale * ( 1.0 - vFade ) *'))
        .replace('#include <color_fragment>', '#include <color_fragment>\n\tdiffuseColor.rgb = mix( diffuseColor.rgb, vBcol, vFade );').replace('#include <specularmap_fragment>', '#include <specularmap_fragment>\n\tspecularStrength *= ( 1.0 - vFade );'); };
    m.customProgramCacheKey = () => 'sbfade2' + (m.transparent ? 't' : 'o'); mats.set(m0, m); return m; };
  for (const o of mk) { const g = o.geometry, I = g.index, Pa = g.attributes.position, Na = g.attributes.normal, Ua = g.attributes.uv, Ca = g.attributes.color, bk = baked(o), e = o.matrixWorld, id = e.equals(new THREE.Matrix4()); if (!I) continue; N3.getNormalMatrix(e);
    let F = flags.get(Pa); if (!F) { F = new Uint8Array(Pa.count); for (let i = 0; i < Pa.count; i++) { V.fromBufferAttribute(Pa, i); if (!id) V.applyMatrix4(e); F[i] = (bk ? H.roHit(V.x, V.z) : roCol(Ca, i)) && !onWay(V.x, V.z) ? 1 : 0; } flags.set(Pa, F); }
    const A = I.array, P = [], NN = [], UU = [], CC = [], DD = [], csz = Ca ? Ca.itemSize : 0; let n = 0, A0 = null;
    for (let t = 0; t + 2 < I.count; t += 3) { const a = A[t], b = A[t + 1], c = A[t + 2]; if (a === b && b === c) continue; if (!(F[a] && F[b] && F[c])) continue; if (!A0) A0 = A.slice();
      for (const v of [a, b, c]) { V.fromBufferAttribute(Pa, v); if (!id) V.applyMatrix4(e); P.push(V.x, V.y, V.z); DD.push(dBeach(V.x, V.z)); if (Ua) UU.push(Ua.getX(v), Ua.getY(v)); if (Ca) { CC.push(Ca.getX(v), Ca.getY(v), Ca.getZ(v)); if (csz === 4) CC.push(Ca.getW(v)); }
        if (Na) { V.fromBufferAttribute(Na, v); if (!id) V.applyMatrix3(N3).normalize(); NN.push(V.x, V.y, V.z); } else NN.push(0, 1, 0); }
      A[t + 1] = a; A[t + 2] = a; n++; }
    if (!n) continue; nT += n; I.needsUpdate = true; rec.push([I, A0, A.slice()]);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(NN, 3)); if (Ua) geo.setAttribute('uv', new THREE.Float32BufferAttribute(UU, 2)); if (Ca) geo.setAttribute('color', new THREE.Float32BufferAttribute(CC, csz));
    geo.setAttribute('fade', new THREE.BufferAttribute(new Float32Array(P.length / 3), 1)); geo.userData.d = new Float32Array(DD);
    { const BCv = new Float32Array(P.length); for (let i = 0; i < P.length / 3; i++) { const x = P[i * 3], z = P[i * 3 + 2], c = beachCol(x, z), f = sst(6, 30, DD[i]); for (let j = 0; j < 3; j++) BCv[i * 3 + j] = c ? c[j] * (1 - f) + BE[j] * f : BE[j]; } geo.setAttribute('bcol', new THREE.BufferAttribute(BCv, 3)); }
    const m0 = Array.isArray(o.material) ? o.material[0] : o.material, me = new THREE.Mesh(geo, fadeMat(m0)); me.renderOrder = o.renderOrder; me.receiveShadow = o.receiveShadow; me.castShadow = false; me.userData.keep = true; ROOT.add(me); made.push(me); }
  out.moved = { tris: nT, meshes: made.length, from: mk.length, mats: mats.size };
  const FADE = [[10, 480], [80, 360], [30, 240], [2, 22]];
  window.__SB2 = (k) => { oldStrips.forEach(o => { o.visible = k < 0; }); if (k < 0) { for (const [I, A0] of rec) { I.array.set(A0); I.needsUpdate = true; } ROOT.visible = false; return -1; }
    for (const [I, , A1] of rec) { I.array.set(A1); I.needsUpdate = true; } ROOT.visible = true; const [d0, d1] = FADE[k];
    for (const me of made) { const g = me.geometry, Fa = g.attributes.fade, d = g.userData.d; for (let i = 0; i < d.length; i++) Fa.array[i] = 1 - sst(d0, d1, d[i]); Fa.needsUpdate = true; }
    return k; };
  window.__SB2(3); return JSON.stringify(out); })()
