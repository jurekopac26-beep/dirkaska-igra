(() => {
  // (pictures only) the user on the driving school's lot: "popravi da luci niso kar naklucni sredi parkirisca ampak lepo razporejena zrave parkirisc",
  // "z belo sem oznacil da dorises se eni belo crto in iz vsakega parkirisca naredis 2 parkirisca ker ju locis z belo crto", and the sand on the school
  // to be deleted (its picture did not come; the sand chips along the school pad's east edge). The lot's two back-to-back rows of bays get the white line
  // between them (each long bay two bays), the lamps stand on that line between the bays at even steps and at the rows' ends. window.__LOT2(1) / 0
  const sc = Render.scene, out = {}, LR = window.__LOTROOT; if (!LR) return 'no lot'; sc.updateMatrixWorld(true);
  if (window.__LOT2) window.__LOT2(0); if (window.__LOT2ROOT) sc.remove(window.__LOT2ROOT); const ROOT = new THREE.Group(); ROOT.userData.keep = true; sc.add(ROOT); window.__LOT2ROOT = ROOT;
  const G = LR.children.find(c => c.visible) || LR.children[0]; const SWP = [];
  // the bays' lines (quads 0.12 m wide, 5 m long) and the old lamps
  let LINEM = null, lampsOld = []; G.traverse(o => { if (o.isInstancedMesh) { const p = o.geometry.parameters || {}; if ((p.radiusTop === 0.07 && p.height === 6) || (p.width === 0.9 && p.height === 0.18)) lampsOld.push(o); return; }
    if (!o.isMesh || LINEM) return; const P = o.geometry.attributes.position; if (!P || P.count % 4 || P.count < 40) return; const w = Math.abs(P.getX(1) - P.getX(0)), l = Math.abs(P.getZ(2) - P.getZ(1)); if (Math.abs(w - 0.12) < 0.01 && Math.abs(l - 5) < 0.01) LINEM = o; });
  out.found = [!!LINEM, lampsOld.length]; if (!LINEM) return JSON.stringify(out);
  const P = LINEM.geometry.attributes.position, Q = []; for (let q = 0; q < P.count; q += 4) Q.push({ x: (P.getX(q) + P.getX(q + 1)) / 2, za: Math.min(P.getZ(q), P.getZ(q + 2)), zb: Math.max(P.getZ(q), P.getZ(q + 2)), ya: P.getY(q), yb: P.getY(q + 2) });
  const key = (x, za) => Math.round(x * 10) + ':' + Math.round(za * 10), has = new Map(); Q.forEach(q => has.set(key(q.x, q.za), q));
  // rows by their start; the pairs back to back (za and za + 5)
  const rows = new Map(); Q.forEach(q => { const k = Math.round(q.za * 10); if (!rows.has(k)) rows.set(k, []); rows.get(k).push(q); }); const ZA = [...rows.keys()].sort((a, b) => a - b).map(k => k / 10);
  const pairs = []; ZA.forEach(z => { if (rows.has(Math.round((z + 5) * 10))) pairs.push(z); }); out.rows = ZA.length; out.pairs = pairs.length;
  const LINE = LINEM.material, lp = [], lidx = []; let ln = 0; const quad = (x0, z0, x1, z1, y0, y1) => { lp.push(x0, y0, z0, x1, y1, z0, x1, y1, z1, x0, y0, z1); lidx.push(ln, ln + 2, ln + 1, ln, ln + 3, ln + 2); ln += 4; };
  const lamps = []; let segs = 0;
  for (const zr of pairs) { const zm = zr + 5, xs = new Set(); for (const z of [zr, zr + 5]) for (const q of rows.get(Math.round(z * 10))) xs.add(Math.round(q.x * 10) / 10);
    const X = [...xs].sort((a, b) => a - b); if (X.length < 2) continue; const yAt = (x) => { const q = has.get(key(x, zr)) || has.get(key(x, zr + 5)); return q ? (Math.abs(q.za - zr) < 0.1 ? q.yb : q.ya) : null; };
    // the middle line: over each bay (between two lines 2.5 m apart) of either row
    for (let i = 0; i < X.length - 1; i++) { if (Math.abs(X[i + 1] - X[i] - 2.5) > 0.05) continue; const y0 = yAt(X[i]), y1 = yAt(X[i + 1]); if (y0 === null || y1 === null) continue; quad(X[i] - 0.06, zm - 0.06, X[i + 1] + 0.06, zm + 0.06, y0, y1); segs++; }
    // lamps: on the middle line at every 6th line (the same steps in every row pair), and at the two ends just past the last bays
    const k0 = Math.round(X[0] / 2.5); X.forEach((x, i) => { const k = Math.round(x / 2.5); if ((k % 6 + 6) % 6 === 3 && i > 0 && i < X.length - 1) lamps.push([x, yAt(x), zm]); });
    lamps.push([X[0] - 0.9, yAt(X[0]), zm], [X[X.length - 1] + 0.9, yAt(X[X.length - 1]), zm]); }
  if (ln) { const g2 = new THREE.BufferGeometry(); g2.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3)); g2.setIndex(lidx); g2.computeVertexNormals(); const me = new THREE.Mesh(g2, LINE); me.renderOrder = LINEM.renderOrder; ROOT.add(me); }
  out.mid = segs; out.lamps = lamps.length;
  // the new lamps (as the lot's own: a grey pole, a dark head), the old ones hidden
  const lampG = new THREE.CylinderGeometry(0.07, 0.09, 6, 6); lampG.translate(0, 3, 0); const headG = new THREE.BoxGeometry(0.35, 0.18, 0.9); headG.translate(0, 6.0, 0); const baseG = new THREE.CylinderGeometry(0.28, 0.32, 0.35, 10); baseG.translate(0, 0.17, 0);
  for (const [geo, c] of [[lampG, 0x8e959c], [headG, 0x3a3e44], [baseG, 0xb4b8bc]]) { const im = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: c }), lamps.length), m4 = new THREE.Matrix4(); lamps.forEach(([x, y, z], i) => { m4.makeTranslation(x, y - 0.01, z); im.setMatrixAt(i, m4); }); im.castShadow = true; im.receiveShadow = true; ROOT.add(im); }
  lampsOld.forEach(o => SWP.push((on) => { o.visible = !on; }));
  // the parked cars: copies of the player's car made before the car was mended (only bits of them show): new copies of the car as it is now, same places
  { const v = Render.viewOf(__game.race.player), COL = [0xd8282a, 0x2a5ab8, 0xf4f4f0, 0x2a2a2e, 0x9aa0a8, 0x3f8a3a, 0xf2c12e]; let n = 0;
    if (v && v.grp) G.children.filter(c => !c.isMesh && c.children && c.children.length > 3).forEach(p => { const c = v.grp.clone(true); c.position.copy(p.position); c.rotation.copy(p.rotation); c.scale.copy(p.scale);
      const col = new THREE.Color(COL[n % COL.length]); c.traverse(o => { if (o.isMesh && o.material) { const m2 = (Array.isArray(o.material) ? o.material[0] : o.material).clone(); m2.transparent = false; m2.opacity = 1; m2.depthWrite = true; if (m2.color) { const hsl = {}; m2.color.getHSL(hsl); if (hsl.s > 0.3 && hsl.l > 0.15) m2.color.copy(col); } o.material = m2; o.visible = true; } o.userData.keep = true; });
      c.visible = true; ROOT.add(c); SWP.push((on) => { p.visible = !on; }); n++; });
    out.parked = n; }
  // the sand on the school (its picture did not come): sandy triangles along the school pad's east edge (x 116.3..119.3, z 86..107) folded, if any
  const BX = [116.3, 119.3, 85.5, 107.5], RECP = []; let folded = 0;
  sc.traverse(o => { if (!o.isMesh || o.isInstancedMesh || !o.visible || o === LINEM) return; let v = true; for (let p = o.parent; p; p = p.parent) if (!p.visible) v = false; if (!v) return; const g = o.geometry, Pp = g && g.attributes.position; if (!Pp) return;
    if (!g.boundingBox) g.computeBoundingBox(); const bb = g.boundingBox.clone().applyMatrix4(o.matrixWorld); if (bb.max.x < BX[0] || bb.min.x > BX[1] || bb.max.z < BX[2] || bb.min.z > BX[3]) return;
    const m = Array.isArray(o.material) ? o.material[0] : o.material, C = g.attributes.color, mc = m && m.color ? m.color : null, I = g.index, V = new THREE.Vector3(), nT = I ? I.count / 3 : Pp.count / 3;
    const sandy = (i) => { let r = 1, gg = 1, b = 1; if (C) { r = C.getX(i); gg = C.getY(i); b = C.getZ(i); } if (mc) { r *= mc.r; gg *= mc.g; b *= mc.b; } return r > gg && gg > b && r - b > 0.12 && r > 0.35; };
    let arr = null, a0 = null, n = 0;
    for (let t = 0; t < nT; t++) { const ia = I ? I.getX(t * 3) : t * 3, ib = I ? I.getX(t * 3 + 1) : t * 3 + 1, ic = I ? I.getX(t * 3 + 2) : t * 3 + 2; V.fromBufferAttribute(Pp, ia).add(new THREE.Vector3().fromBufferAttribute(Pp, ib)).add(new THREE.Vector3().fromBufferAttribute(Pp, ic)).multiplyScalar(1 / 3).applyMatrix4(o.matrixWorld);
      if (V.x < BX[0] || V.x > BX[1] || V.z < BX[2] || V.z > BX[3]) continue; if (!(sandy(ia) && sandy(ib) && sandy(ic))) continue;
      if (I) { if (!arr) { arr = I.array; a0 = arr.slice(); } arr[t * 3 + 1] = arr[t * 3]; arr[t * 3 + 2] = arr[t * 3]; } else { if (!arr) { arr = Pp.array; a0 = arr.slice(); } for (const q of [ib, ic]) { arr[q * 3] = arr[ia * 3]; arr[q * 3 + 1] = arr[ia * 3 + 1]; arr[q * 3 + 2] = arr[ia * 3 + 2]; } } n++; }
    if (n) { const a1 = arr.slice(); RECP.push([arr, a0, a1, I ? I : Pp]); folded += n; } });
  out.sandFold = folded;
  window.__LOT2 = (k) => { const on = k > 0; ROOT.visible = on; for (const f of SWP) f(on); for (const [arr, a0, a1, attr] of RECP) { arr.set(on ? a1 : a0); attr.needsUpdate = true; } return k; };
  window.__LOT2(1); return JSON.stringify(out); })()
