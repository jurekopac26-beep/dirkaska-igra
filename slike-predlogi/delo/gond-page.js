(() => {
  // (pictures only) the gondola made for cars (the user): no box at its stations and no switching to it; you drive your car into a cabin, the door
  // behind you closes (and holds: it cannot be broken), the cabin rides up, at the top the door in front opens and you drive out. Two big cabins on
  // two tracks, one waiting at the top while the other is at the bottom: they set off together and pass each other half way (an aerial tramway).
  // The cabins' roofs are glass in a red frame, so the car inside shows from the game's cameras above. Stations with a deck at the cabins' floor and
  // a ramp for the cars; towers that carry both tracks. window.__GOND(f): the up cabin at f (0..1 along), the down cabin at 1 - f
  const H = window.__H3, G0 = H.gond, sc = Render.scene, out = {}; if (!G0) return 'no gondola';
  const sst = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }, gnd = (x, z) => H.ground(x, z), matOf = (o) => Array.isArray(o.material) ? o.material[0] : o.material;
  const A = [G0.A.x, G0.A.z], B = [G0.B.x, G0.B.z], ya = G0.A.y, yb = G0.B.y, dx = B[0] - A[0], dz = B[1] - A[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, nx = -uz, nz = ux, hd = Math.atan2(dz, dx);
  sc.updateMatrixWorld(true);
  const lat = (x, z) => [((x - A[0]) * ux + (z - A[1]) * uz) / L, (x - A[0]) * nx + (z - A[1]) * nz];
  // the old gondola away: its little cabins, and everything in its corridor over the ground that is not ground (stations, towers, ropes, signs, trees)
  G0.cab.forEach(c => { c.g.visible = false; });
  { let ch = 0; sc.traverse(o => { if (!o.isMesh || o.userData.keep || o.userData.lp || o.userData.mx3) return; const m = matOf(o); if (!m || (m.map && m.type !== 'MeshBasicMaterial')) return; const g = o.geometry, P = g && g.attributes.position; if (!P) return;
      if (o.isInstancedMesh) { const M4 = new THREE.Matrix4(), V = new THREE.Vector3(), Z = new THREE.Matrix4().makeScale(0, 0, 0); let c3 = 0; for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, M4); V.setFromMatrixPosition(M4).applyMatrix4(o.matrixWorld); const [f, d] = lat(V.x, V.z); if (f > -0.09 && f < 1.09 && Math.abs(d) < 7.5 && V.y > gnd(V.x, V.z) - 0.5) { o.setMatrixAt(i, Z); c3++; } } if (c3) { o.instanceMatrix.needsUpdate = true; ch += c3; } return; }
      if (!g.boundingBox) g.computeBoundingBox(); const bb = g.boundingBox.clone().applyMatrix4(o.matrixWorld); if (bb.max.x < Math.min(A[0], B[0]) - 12 || bb.min.x > Math.max(A[0], B[0]) + 12 || bb.max.z < Math.min(A[1], B[1]) - 12 || bb.min.z > Math.max(A[1], B[1]) + 12) return;
      const e = o.matrixWorld.elements, I = g.index, n = I ? I.count : P.count, ix = (k) => I ? I.getX(k) : k; let c2 = 0;
      for (let t = 0; t < n; t += 3) { let x = 0, y = 0, z = 0, yM = -1e9; for (let q = 0; q < 3; q++) { const i = ix(t + q), vy = P.getX(i) * e[1] + P.getY(i) * e[5] + P.getZ(i) * e[9] + e[13]; x += (P.getX(i) * e[0] + P.getY(i) * e[4] + P.getZ(i) * e[8] + e[12]) / 3; y += vy / 3; yM = Math.max(yM, vy); z += (P.getX(i) * e[2] + P.getY(i) * e[6] + P.getZ(i) * e[10] + e[14]) / 3; }
        if (!isFinite(x + y + z)) continue; const [f, d] = lat(x, z); if (f < -0.09 || f > 1.09 || Math.abs(d) > 7.5 || yM < gnd(x, z) + 0.18) continue; if (I) { I.setX(t + 1, I.getX(t)); I.setX(t + 2, I.getX(t)); } else for (const q of [t + 1, t + 2]) P.setXYZ(q, P.getX(t), P.getY(t), P.getZ(t)); c2++; }
      if (c2) { if (I) I.needsUpdate = true; P.needsUpdate = true; ch += c2; } }); out.oldFold = ch; }
  const L3 = (c, o = {}) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o)), PH = (c, o = {}) => new THREE.MeshPhongMaterial(Object.assign({ color: c, shininess: 60, specular: 0x333333 }, o));
  const RED = L3(0xd23a2e), WHITE = L3(0xf2f2ee), STEEL = PH(0x8e959c), DARK = PH(0x3a3e44), CONC = L3(0xb9b5ad), DECK = L3(0x8f8c88), YEL = L3(0xf2c12e), ROPE = PH(0x2c2e30, { shininess: 90 });
  const GLASS = new THREE.MeshPhongMaterial({ color: 0xa8d8ff, transparent: true, opacity: 0.28, shininess: 140, specular: 0xffffff, depthWrite: false, side: THREE.DoubleSide });
  if (window.__GONDROOT) sc.remove(window.__GONDROOT);   // (run again: the earlier build away first)
  const ROOT = new THREE.Group(); ROOT.userData.keep = true; sc.add(ROOT); window.__GONDROOT = ROOT;
  const box = (g, w, h, d, m, x, y, z, ry = 0, rx = 0, rz = 0) => { const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); me.position.set(x, y, z); me.rotation.set(rx, ry, rz); me.castShadow = m !== GLASS; me.receiveShadow = true; g.add(me); return me; };
  const cyl = (g, r, h, m, x, y, z, seg = 10) => { const me = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), m); me.position.set(x, y, z); me.castShadow = true; g.add(me); return me; };
  const rod = (g, a, b, r, m) => { const Av = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), d = Bv.clone().sub(Av), me = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 8), m); me.position.copy(Av.clone().add(Bv).multiplyScalar(0.5)); me.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); me.castShadow = true; g.add(me); return me; };
  const frame = (x, z, y, ry) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; ROOT.add(g); return g; };   // (local +x along the line uphill, +z across to the left of it)
  // the ropes: at the stations 7.6 m over the deck's ground (the cabin's floor level with the deck), in between at least 12.5 m over the ground under
  // both tracks, as a taut rope over the hill: straight spans between the towers (the upper hull of the needed heights)
  const TR = 4.3, HS = 1.2 + 3.3 + 3.1, NF = 24, CLR = (f) => HS + (12.5 - HS) * sst(0, 0.14, f) * sst(1, 0.86, f);
  const base = (f) => (ya + HS) + (yb - ya) * f, need = []; for (let k = 0; k <= NF; k++) { const f = k / NF; let gm = -1e9; for (const s2 of [-TR - 2, -TR + 2, TR - 2, TR + 2]) gm = Math.max(gm, gnd(A[0] + dx * f + nx * s2, A[1] + dz * f + nz * s2)); need.push(k === 0 ? ya + HS : k === NF ? yb + HS : Math.max(base(f), gm + CLR(f))); }
  const hull = [0]; for (let k = 1; k <= NF; k++) { hull.push(k); while (hull.length > 2) { const [i, j, m] = hull.slice(-3), sl1 = (need[j] - need[i]) / (j - i), sl2 = (need[m] - need[i]) / (m - i); if (sl2 >= sl1) hull.splice(-2, 1); else break; } }
  // (fewer towers: a bend dropped where the straight rope past it stays within 2.2 m of the height wanted there)
  for (let changed = true; changed;) { changed = false; for (let q = 1; q < hull.length - 1; q++) { const i = hull[q - 1], j = hull[q + 1]; let ok = true; for (let k = i + 1; k < j; k++) if (need[i] + (need[j] - need[i]) * (k - i) / (j - i) < need[k] - 2.2) { ok = false; break; } if (ok) { hull.splice(q, 1); changed = true; break; } } }
  const cy = (f) => { const k = Math.max(0, Math.min(NF, f * NF)); for (let q = 0; q < hull.length - 1; q++) { const i = hull[q], j = hull[q + 1]; if (k <= j + 1e-9) return need[i] + (need[j] - need[i]) * (k - i) / (j - i); } return need[NF]; };
  const P3 = (f, s2, y) => [A[0] + dx * f + nx * s2, y, A[1] + dz * f + nz * s2];
  for (const s2 of [-TR, TR]) for (let q = 0; q < hull.length - 1; q++) { const fa = Math.max(-0.04, hull[q] / NF - (q === 0 ? 0.04 : 0)), fb = Math.min(1.04, hull[q + 1] / NF + (q === hull.length - 2 ? 0.04 : 0));
    for (const o2 of [-0.55, 0.55]) rod(ROOT, P3(fa, s2 + o2, cy(fa) + (q === 0 && fa < 0 ? 0 : 0)), P3(fb, s2 + o2, cy(fb)), 0.06, ROPE); rod(ROOT, P3(fa, s2, cy(fa) - 0.55), P3(fb, s2, cy(fb) - 0.55), 0.035, ROPE); }
  out.hull = hull.map(k => [+(k / NF).toFixed(2), +need[k].toFixed(1)]);
  // the towers where the rope bends: two legs, a cross-beam under both tracks with the saddles, braces
  for (const k of hull.slice(1, -1)) { const f = k / NF, [x, , z] = P3(f, 0, 0), g0 = Math.min(gnd(x + nx * 6.8, z + nz * 6.8), gnd(x - nx * 6.8, z - nz * 6.8)), top = cy(f) - 0.25, g = frame(x, z, g0, -hd), Ht = top - g0;
    for (const sd of [-1, 1]) { box(g, 0.9, Ht + 0.3, 0.9, STEEL, 0, Ht / 2, sd * 6.6, 0, 0, 0); for (let yy = 3; yy < Ht - 2; yy += 5) box(g, 0.25, 0.25, 2.6, STEEL, 0, yy, sd * 5.7, 0, sd * 0.6, 0); }
    box(g, 1.2, 1.0, 15.2, RED, 0, Ht - 0.45, 0); box(g, 0.35, 0.35, 12.6, STEEL, 0, Ht * 0.55, 0); for (const s2 of [-TR, TR]) for (const o2 of [-0.55, 0.55]) box(g, 2.2, 0.35, 0.3, DARK, 0, Ht + 0.12, s2 + o2); }
  // a station: a concrete deck level with the cabins' floor under both docks, a ramp for the cars on the side away from the line, a steel hall over it
  // with the bullwheel, a sign; nothing else there (no box, no switching)
  const station = (P, y0, dir, top) => { const g = frame(P[0], P[1], y0, -hd), sgn = dir;   // (sgn: +1 at the bottom, the line goes +x; -1 at the top)
    const D0 = -7, D1 = 5.5;   // (the deck from 7 m behind the docks' centre to 5.5 m in front, along the line)
    const dk = (a, b) => box(g, Math.abs(b - a), 1.2, 15.4, CONC, sgn * (a + b) / 2, 0.6, 0); dk(D0, D1); box(g, Math.abs(D1 - D0), 0.06, 15.0, DECK, sgn * (D0 + D1) / 2, 1.23, 0);
    for (const s2 of [-TR, TR]) { for (const o of [-1.45, 1.45]) box(g, Math.abs(D1 - D0) - 0.4, 0.04, 0.16, YEL, sgn * (D0 + D1) / 2, 1.27, s2 + o); }
    // the ramps down to the ground behind the deck (one per dock), with low kerbs
    for (const s2 of [-TR, TR]) { const RL = 11, a0 = sgn * D0, ramp = new THREE.Mesh(new THREE.BoxGeometry(RL, 0.3, 3.8), CONC); ramp.position.set(a0 - sgn * RL / 2 * Math.cos(0.11), 0.6 - 0.15, s2); ramp.rotation.z = sgn * 0.11; ramp.castShadow = true; ramp.receiveShadow = true; g.add(ramp);
      for (const o of [-2.0, 2.0]) { const kb = new THREE.Mesh(new THREE.BoxGeometry(RL, 0.25, 0.2), WHITE); kb.position.set(a0 - sgn * RL / 2 * Math.cos(0.11), 0.85 - 0.15, s2 + o); kb.rotation.z = sgn * 0.11; g.add(kb); } }
    // the hall: red portal frames across, a light roof, the bullwheels at the end the cabins face, glass walls on the sides
    const HH = 10.6; for (const a of [D0, (D0 + D1) / 2 - 1, D1]) { for (const sd of [-1, 1]) box(g, 0.5, HH, 0.5, RED, sgn * a, HH / 2, sd * 7.4); box(g, 0.6, 0.8, 15.4, RED, sgn * a, HH, 0); }
    box(g, Math.abs(D1 - D0) + 1.2, 0.3, 16.2, WHITE, sgn * (D0 + D1) / 2, HH + 0.55, 0); box(g, Math.abs(D1 - D0) + 1.2, 0.5, 0.35, RED, sgn * (D0 + D1) / 2, HH + 0.2, 8.1); box(g, Math.abs(D1 - D0) + 1.2, 0.5, 0.35, RED, sgn * (D0 + D1) / 2, HH + 0.2, -8.1);
    for (const sd of [-1, 1]) box(g, Math.abs(D1 - D0) - 0.6, 5.2, 0.08, GLASS, sgn * (D0 + D1) / 2, 4.0, sd * 7.4);
    for (const s2 of [-TR, TR]) { const w = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.16, 8, 28), DARK); w.rotation.x = Math.PI / 2; w.position.set(sgn * (D0 - 0.4), HS - 0.55, s2); g.add(w); box(g, 1.2, 0.6, 1.2, DARK, sgn * (D0 - 0.4), HS + 0.2, s2); }
    const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 180; const c = cv.getContext('2d'); c.fillStyle = '#d23a2e'; c.fillRect(0, 0, 1024, 180); c.fillStyle = '#ffffff'; c.font = 'bold 110px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(top ? 'GONDOLA · TOP' : 'GONDOLA', 512, 96);
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.6), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), side: THREE.DoubleSide })); sg.position.set(sgn * (D0 - 0.5), HH - 1.2, 0); sg.rotation.y = Math.PI / 2; g.add(sg); return g; };
  station(A, ya, 1, false); station(B, yb, -1, true);
  // a cabin for one car: floor, red corner posts, a band of glass all round, glass doors at both ends (two leaves each, red frames), a glass roof
  // in a red frame (the car shows from above), the hanger (two arms) up to the carriage on the track ropes
  const cabin = (car) => { const g = new THREE.Group(); ROOT.add(g); const CL = 7.6, CW = 3.6, CH = 3.3;
    box(g, CL, 0.28, CW, DARK, 0, 0.14, 0); box(g, CL - 0.3, 0.04, CW - 0.3, DECK, 0, 0.3, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, 0.22, CH, 0.22, RED, sx * (CL / 2 - 0.11), CH / 2, sz * (CW / 2 - 0.11));
    for (const sz of [-1, 1]) { box(g, CL - 0.3, 0.75, 0.08, RED, 0, 0.66, sz * (CW / 2 - 0.05)); box(g, CL - 0.3, CH - 1.15, 0.05, GLASS, 0, 1.03 + (CH - 1.15) / 2, sz * (CW / 2 - 0.05)); for (const xx of [-CL / 6, CL / 6]) box(g, 0.12, CH - 1.0, 0.1, WHITE, xx, 1.0 + (CH - 1.0) / 2, sz * (CW / 2 - 0.05)); box(g, CL - 0.3, 0.12, 0.1, WHITE, 0, 1.06, sz * (CW / 2 - 0.05)); }
    for (const sx of [-1, 1]) { for (const sz of [-1, 1]) { box(g, 0.06, CH - 0.5, CW / 2 - 0.25, GLASS, sx * (CL / 2 - 0.05), 0.3 + (CH - 0.5) / 2, sz * (CW / 4 - 0.02)); box(g, 0.1, CH - 0.5, 0.1, RED, sx * (CL / 2 - 0.04), 0.3 + (CH - 0.5) / 2, sz * 0.06); } box(g, 0.12, 0.14, CW, RED, sx * (CL / 2 - 0.04), CH - 0.2, 0); box(g, 0.1, 0.1, CW - 0.4, YEL, sx * (CL / 2 - 0.02), 0.42, 0); }
    box(g, CL + 0.2, 0.18, 0.3, RED, 0, CH, CW / 2 - 0.1); box(g, CL + 0.2, 0.18, 0.3, RED, 0, CH, -CW / 2 + 0.1); box(g, 0.3, 0.18, CW, RED, CL / 2 - 0.1, CH, 0); box(g, 0.3, 0.18, CW, RED, -CL / 2 + 0.1, CH, 0); box(g, 0.25, 0.16, CW, WHITE, 0, CH, 0);
    box(g, CL - 0.5, 0.05, CW - 0.5, GLASS, 0, CH + 0.02, 0);
    // the hanger: two arms from the roof's ends up to the carriage, a cross-tie, the carriage with its wheels on the two track ropes
    const HG = 3.1; for (const sx of [-1, 1]) { rod(g, [sx * 2.6, CH, -1.2], [sx * 0.9, CH + HG - 0.5, 0], 0.11, RED); rod(g, [sx * 2.6, CH, 1.2], [sx * 0.9, CH + HG - 0.5, 0], 0.11, RED); }
    box(g, 2.2, 0.22, 0.22, RED, 0, CH + HG - 0.5, 0); box(g, 3.4, 0.5, 1.5, DARK, 0, CH + HG - 0.15, 0);
    for (const sx of [-1.2, -0.4, 0.4, 1.2]) for (const sz of [-0.55, 0.55]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.16, 12), STEEL); w.rotation.x = Math.PI / 2; w.position.set(sx, CH + HG + 0.08, sz); g.add(w); }
    let cm = null; if (car) { cm = car.clone(true); cm.position.set(0, 0.32, 0); cm.rotation.set(0, 0, 0); cm.traverse(o => { o.userData.keep = true; }); g.add(cm); }
    g.traverse(o => { o.userData.keep = true; }); return { g, car: cm, CH, HG }; };
  // the player's car, copied into the up cabin (facing up the line)
  let carGrp = null; try { const v = Render.viewOf(__game.race.player); if (v && v.grp) { carGrp = v.grp.clone(true); carGrp.position.set(0, 0, 0); carGrp.rotation.set(0, 0, 0); } } catch (e) { out.carErr = String(e); }
  const UP = cabin(carGrp), DN = cabin(null);
  const place = (C, f, s2, face) => { const ry = cy(f), [x, , z] = P3(f, s2, 0); C.g.position.set(x, ry - C.HG - C.CH - 0.3, z); C.g.rotation.set(0, -hd + (face < 0 ? Math.PI : 0), 0); C.g.updateMatrixWorld(true); return { x, y: ry - C.HG - C.CH - 0.3, z }; };
  window.__GOND = (f) => { const a = place(UP, f, -TR, 1), b = place(DN, 1 - f, TR, -1); return JSON.stringify({ up: [a.x, a.y, a.z].map(v => +v.toFixed(1)), dn: [b.x, b.y, b.z].map(v => +v.toFixed(1)), rope: +cy(f).toFixed(1) }); };
  window.__GONDI = { A, B, ya, yb, ux, uz, nx, nz, hd, L, TR, cy, P3 };
  out.cab = window.__GOND(0.47); out.car = !!carGrp; ROOT.traverse(o => { o.userData.keep = true; });
  return JSON.stringify(out); })()
