// ==== AV: my frames (AMA's, adapted: AV's versions 1..6; the tapped models lit on their own silhouettes; the locked RACE) ====
// the tap's mark for my chests: ztTurq (the store's) leaves a mesh with a texture as it is (the labels keep their names); my insert's tiles
// (textured felt: userData.pdTint) turn light turquoise too
const pnTurq = (o) => { const C = LIGHTC(); o.traverse(m => { if (m.isMesh && m.visible && m.userData && m.userData.pdTint) m.material = new T.MeshLambertMaterial({ color: C.clone().multiplyScalar(0.9), emissive: C.clone().multiplyScalar(0.4), side: T.DoubleSide }); }); ztTurq(o); };
const pnHQ = (name, Z, zpr) => { const pr = devicePixelRatio || 1, q = hqQuality(pr); PR.render(); const cv = vZoomPlain(Z, zpr, pr); window.HQ_FILES[name] = { b64: cv.toDataURL('image/png').split(',')[1] }; console.log('HQ quality ' + JSON.stringify(q) + ' picture ' + name + ' ' + cv.width + 'x' + cv.height); };
// the footprint of my chest (every visible solid mesh in F, its vertices on the floor; no soft shadows, no glows): the hull, how far beyond
// round W's cabinets (XOLD), the least distance to the trolleys' parking outlines and routes, the radii from the arc's middle (PDA's pdFoot)
const pnFoot = (st) => { const F = st.mali.s6 && st.mali.s6.F; if (!F) return null; const pts = []; F.updateMatrixWorld(true);
  F.traverse(m => { if (!m.isMesh || !vVisible(m) || !m.geometry) return; const mt = Array.isArray(m.material) ? m.material[0] : m.material; if (mt && (mt.blending === T.AdditiveBlending || (mt.transparent && mt.opacity < 0.9))) return;
    const A = m.geometry.attributes.position, q = V(); for (let i = 0; i < A.count; i++) { q.fromBufferAttribute(A, i).applyMatrix4(m.matrixWorld); pts.push([q.x, q.y, q.z]); } });
  const H = xHull(pts.map(p => [p[0], p[2]])); let out = 0, at = null; pts.forEach(p => { const d = Math.min(xPolyD([p[0], p[2]], XOLD.L), xPolyD([p[0], p[2]], XOLD.R)); if (d > out) { out = d; at = [xF(p[0], 2), xF(p[2], 2)]; } });
  const area = (P) => Math.abs(P.reduce((s, p, i) => { const q = P[(i + 1) % P.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2, rr = pts.map(p => Math.hypot(p[0], p[2] - 0.2));
  const uw = pts.map(p => [p[0] * C3 - (p[2] - 0.2) * S3, p[0] * S3 + (p[2] - 0.2) * C3]);
  const mn = (a) => a.reduce((s, v) => Math.min(s, v), Infinity), mx = (a) => a.reduce((s, v) => Math.max(s, v), -Infinity);   // (no spread: too many points)
  const r = { hull: H.map(q => [xF(q[0]), xF(q[1])]), area: xF(area(H), 2), areaOld: xF(area(XOLD.L) + area(XOLD.R), 2), outsideOld: xF(out), at, trolleys: xClear(pts, xTrolleyPolys()), rMin: xF(mn(rr)), rMax: xF(mx(rr)),
    u: [xF(mn(uw.map(q => q[0]))), xF(mx(uw.map(q => q[0])))], w: [xF(mn(uw.map(q => q[1]))), xF(mx(uw.map(q => q[1])))], hMax: xF(mx(pts.map(p => p[1]))) };
  console.error('PDFOOT ' + JSON.stringify(r)); return r; };
// a camera (yaw, pitch, distance, the target in the arc frame F (u, h, w: w relative to the chest's front), fov) and the part of its frame
const PNZ = { 4: { cam: [0.6, 0.72, 1.9, -0.3, 0.6, 0.3, 40], Z: [0, 150, 412, 560], zpr: 6 }, 5: { cam: [0.12, 0.76, 2.1, -0.3, 0.58, 0.28, 40], Z: [0, 150, 412, 560], zpr: 6 }, 6: { cam: [0.1, 0.78, 2.1, -0.42, 0.62, 0.28, 40], Z: [0, 150, 412, 560], zpr: 6 } };
const PZV = { cam: [0.3, 0.6, 4.6, 0.0, 1.0, -0.3, 70], Z: [0, 345, 412, 270], zpr: 5 };   // (the close look at the top and its parts)
const AVTZ = { cam: [0.1, 0.45, 5.6, -0.24, 1.0, -0.35, 45], Z: [0, 330, 412, 250], zpr: 4 };   // (the close view of the signs)
const PN3D = { cam: [1.15, 0.72, 5.6, 0.35, 0.3, -0.2, 75], Z: [0, 255, 412, 375], zpr: 4 };   // (the higher side view of the whole chest)
const pnCamF = (q) => { const [yaw, pitch, d, u, h, dw] = q, lay = window.PNLAY || {}, face = lay.face || 5.7; const w = pdWL(u, h, face + dw); camP(yaw, pitch, d, w.x, w.y, w.z, q[6]); };
const pnIdmap = (S, st, name, P0) => { const els = s6Els(S, st), items = els.concat(s6Pools()); G3.scene.updateMatrixWorld(true); const own = new Map(); items.forEach((it, k) => it.objs.forEach(o => o && o.traverse(m => { if (m.isMesh) own.set(m, k); })));
  const P = P0 || s6Pass(null, items, own), cv = document.createElement('canvas'); cv.width = P.w; cv.height = P.h; const g = cv.getContext('2d'), im = g.createImageData(P.w, P.h);
  for (let i = 0; i < P.w * P.h; i++) { const k = P.id[i]; let c = [0, 0, 0]; if (k >= els.length) c = [90, 90, 90]; else if (k >= 0) { const h = (k * 0.618034) % 1, f = (n) => { const q = (n + h * 6) % 6; return 255 * (1 - Math.max(0, Math.min(1, Math.min(q, 4 - q)))) * 0.75 + 50; }; c = [f(5), f(3), f(1)]; } im.data.set([c[0], c[1], c[2], 255], i * 4); }
  g.putImageData(im, 0, 0); window.HQ_FILES[name] = { b64: cv.toDataURL('image/png').split(',')[1] }; };
// (debug: the specks in the measure's ID pass: a pixel of no element with its four neighbours of one element: what the camera's ray there hits)
const pnSpecks = (S, st, P) => { if (!P) return; const els = s6Els(S, st), own = new Map(); els.forEach((e) => e.objs.forEach(o => o.traverse(m => { if (m.isMesh) own.set(m, e.name); }))); const out = [];
  for (let y = 1; y < P.h - 1; y++) for (let x = 1; x < P.w - 1; x++) { const i = y * P.w + x; if (P.id[i] >= 0) continue; const k = P.id[i - 1]; if (k < 0 || P.id[i + 1] !== k || P.id[i - P.w] !== k || P.id[i + P.w] !== k) continue; out.push([x, y, k]); }
  const rc = new T.Raycaster(), r = G3.renderer.domElement.getBoundingClientRect(); G3.scene.updateMatrixWorld(true);
  out.slice(0, 12).forEach(([x, y, k]) => { rc.setFromCamera(new T.Vector2((x + 0.5) / P.w * 2 - 1, -((y + 0.5) / P.h * 2 - 1)), G3.camera);
    const hits = rc.intersectObjects(G3.scene.children, true).filter(h => vVisible(h.object)).slice(0, 4);
    console.error('PNSPECK ' + x + ',' + y + ' in ' + (els[k] ? els[k].name : k) + ': ' + hits.map(h => { const m = h.object, mt = [].concat(m.material)[0]; return `${h.distance.toFixed(4)} ${mt.type} #${mt.color ? mt.color.getHexString() : ''} op${mt.opacity}${mt.transparent ? 'T' : ''} el=${own.get(m) || '-'} f${h.faceIndex}`; }).join(' | ')); });
  console.error('PNSPECKS ' + out.length); };
// ---- the service card: the garage's Servis panel (js/garage.js: SRV, srvPrice, condCol, the rows, Popoln servis −15 %) as a card ----
const AMCOND = { clean: 0.62, body: 0.81, engine: 0.7 };
const AMSRV = [{ id: 'clean', name: 'Pranje', desc: 'Pena, voda, vosek', base: 150, k: 450 }, { id: 'body', name: 'Karoserija', desc: 'Praske in udrtine', base: 300, k: 2200 }, { id: 'engine', name: 'Motor in olje', desc: 'Olje, filtri, svečke', base: 400, k: 2600 }];
const AMIC = { clean: '<svg viewBox="0 0 32 32" width="22" height="22"><path d="M16 4c5 7 8 11 8 15a8 8 0 0 1-16 0c0-4 3-8 8-15z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/></svg>',
  body: '<svg viewBox="0 0 32 32" width="22" height="22"><path d="M4 21v-4l3-1 3-5h11l5 5 3 1v4" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linejoin="round"/><path d="M8 25h16" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/></svg>',
  engine: '<svg viewBox="0 0 32 32" width="22" height="22"><path d="M6 13h15l4-4h3v4l-5 5v6H6z" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linejoin="round"/><path d="M10 13V9h6v4M3 16v5" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/></svg>',
  srv: '<svg viewBox="0 0 32 32" width="18" height="18"><path d="M20.5 4.5a6.5 6.5 0 0 0-6 9L5 23v4h4l9.5-9.5a6.5 6.5 0 0 0 9-6l-4 1.5-3-3 1.5-4z" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/></svg>' };
const amNum = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const amCondCol = (q) => q < 0.5 ? '#e5484d' : q < 0.75 ? '#d9a514' : '#2fa84f';
const amSrvCard = (c, top = 112) => { const price = (s) => { const w = 1 - c[s.id]; return w < 0.02 ? 0 : Math.round((s.base + s.k * w) / 50) * 50; }; let all = 0;
  const rows = AMSRV.map(s => { const p = price(s), q = c[s.id]; all += p; return `<div style="display:flex;align-items:center;gap:8px;padding:6px 7px;margin:4px 0 0;border-radius:9px;background:#f1f4f8"><span style="color:#2a5bd7;flex:none;display:flex">${AMIC[s.id]}</span><span style="flex:1;line-height:1.1"><b style="font-size:13px">${s.name} <span style="color:${amCondCol(q)}">${Math.round(q * 100)} %</span></b><br><small style="font-size:10.5px;color:#556;font-weight:700">${s.desc}</small><span style="display:block;height:5px;border-radius:3px;background:#dde3ea;margin-top:3px"><i style="display:block;height:5px;border-radius:3px;width:${Math.round(q * 100)}%;background:${amCondCol(q)}"></i></span></span><span style="flex:none;background:#2a5bd7;color:#fff;border-radius:9px;padding:5px 8px;font-size:12px">${amNum(p)} CR</span></div>`; }).join('');
  const full = Math.round(all * 0.85 / 50) * 50, avg = Math.round((c.clean + c.body + c.engine) / 3 * 100);
  const head = `<div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:15px;font-style:italic;display:flex;align-items:center;gap:5px"><span style="color:#2a5bd7;display:flex">${AMIC.srv}</span>Servis</b><span style="font-size:11px;color:#334;background:#eef2f7;border-radius:8px;padding:2px 7px">Stanje ${avg} %</span></div>`;
  const foot = `<div style="display:flex;justify-content:space-between;align-items:center;margin-top:7px"><span style="display:inline-block;background:#e8edf3;color:#334;border-radius:10px;padding:6px 10px;font-weight:900;font-size:12px">‹ NAZAJ</span><span style="display:inline-block;background:#e5484d;color:#fff;border-radius:10px;padding:5px 10px;font-weight:900;font-size:12px;text-align:center;line-height:1.1">POPOLN SERVIS<br><small style="font-size:10px;font-weight:800">${amNum(full)} CR · −15 %</small></span></div>`;
  return div(`left:50%;top:${top}px;transform:translateX(-50%);width:300px;background:#fff;border-radius:14px;padding:10px 12px;z-index:64;box-shadow:0 6px 18px rgba(0,0,0,.45);font-weight:800;color:#0d1626`, head + rows + foot); };
// ---- AV: a tap's mark: a model lights up on its own silhouette (the model turquoise, a locked one's dome tinted; the yellow rim from an ID
//      pass of the models alone); every other element as before (its cell turquoise, the rim round its tap area) ----
const avMark = (els, ks) => { const mods = ks.filter(k => els[k].e && els[k].e.model), rest = ks.filter(k => !(els[k].e && els[k].e.model));
  rest.forEach(k => els[k].objs.forEach(o => pnTurq(o)));
  mods.forEach(k => els[k].e.model.forEach(o => { if (o.material && o.material.transparent) o.material = new T.MeshPhongMaterial({ color: LIGHTC(), transparent: true, opacity: 0.32, shininess: 120, specular: 0xffffff, depthWrite: false, emissive: LIGHTC().multiplyScalar(0.25) }); else ztTurq(o); }));
  PR.render(); if (rest.length) s6Rims(els, rest, devicePixelRatio || 1);
  if (mods.length) { const items = mods.map(k => ({ name: els[k].name, objs: els[k].e.model })); s6Rims(items, items.map((_, i) => i), devicePixelRatio || 1); } };
// ---- the kit's PREVIEW on the real car (the selected kit, not bought yet): the kit's parts (AMA's amKit: the same parts as on its scale model,
//      in the turntable car's own frame and its own measures G3.cur.kit) drawn translucent in the kit's colours (45 %), a thin light outline,
//      a soft additive glow; added to the car's body group (they move with it) ----
const AVGH = [];
const avGhost = (k, cols) => { const c = G3.cur; if (!c || !c.v || !c.v.bodyG) return null; { const p = new T.Color(avCarPaint()), d = (h) => { const q = new T.Color(h); return Math.abs(q.r - p.r) + Math.abs(q.g - p.g) + Math.abs(q.b - p.b); }; if (d(cols[0]) < 0.5) cols = [d(cols[2]) >= 0.5 ? cols[2] : 0xf2f2ee, cols[1], cols[0]]; }   /* (a kit colour too close to the car's paint: its line colour or white instead, so the preview reads) */ const g = new T.Group(); g.name = 'avGhost'; c.v.bodyG.add(g); AVGH.push(g);
  const col = (ck) => new T.Color(ck === 'k' ? cols[0] : ck === 'l' ? cols[2] : cols[1]);
  amKit(c.kit, k).forEach(([w, h, d, x, y, z, rx, ry, rz, ck]) => { const geo = new T.BoxGeometry(w, h, d), cc = col(ck);
    const m = new T.Mesh(geo, new T.MeshLambertMaterial({ color: cc, emissive: cc.clone().multiplyScalar(0.35), transparent: true, opacity: 0.45, depthWrite: false })); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.renderOrder = 6; g.add(m);
    const gl = new T.Mesh(geo, new T.MeshBasicMaterial({ color: cc.clone().lerp(new T.Color(0xffffff), 0.3), transparent: true, opacity: 0.16, blending: T.AdditiveBlending, depthWrite: false })); gl.position.copy(m.position); gl.rotation.copy(m.rotation); gl.scale.setScalar(1.06); gl.renderOrder = 7; g.add(gl);
    const e = new T.LineSegments(new T.EdgesGeometry(geo), new T.LineBasicMaterial({ color: 0xeaf8ff, transparent: true, opacity: 0.85, depthWrite: false })); e.position.copy(m.position); e.rotation.copy(m.rotation); e.renderOrder = 8; g.add(e); });
  return g; };
const avGhostOff = () => { while (AVGH.length) { const g = AVGH.pop(); if (g.parent) g.parent.remove(g); } };
const avKitCols = (kind) => { const v = AV.v >= 1 && AV.v <= 6 ? AV.v : 1; if (kind <= 3) return AVL[v].m[kind - 1].kit; const c = AERO_COL[4]; return [c, 0x1c1d22, 0xf2f2ee]; };   // (Paket GT: no model any more; its menu colour, orange)
// the signs on the screen: each face's projected box, its capitals' height (the text's share of the face) at DPR 1 and 4, the top of the whole
// sign; the gaps (ID pass of the signs alone vs the pools and the turntable's car): the least vertical distance in px over their columns
const avSignLog = (st) => { const els = (st.mali.s6 && st.mali.s6.els || []).filter(e => e.sign), cam = G3.camera, cv = G3.renderer.domElement.getBoundingClientRect(), pr = (v) => { const q = v.clone().project(cam); return [cv.left + (q.x + 1) / 2 * cv.width, cv.top + (1 - q.y) / 2 * cv.height]; };
  const items = els.map(e => ({ name: e.en, objs: [e.sign.S] })).concat(s6Pools()).concat([{ name: 'car', objs: [G3.cur.root] }]); const own = new Map(); items.forEach((it, k) => it.objs.forEach(o => o.traverse(m => { if (m.isMesh) own.set(m, k); })));
  G3.scene.updateMatrixWorld(true); const P = s6Pass(null, items, own), s = cv.width / P.w, nS = els.length, nP = items.length - 1 - nS, top = {}, bot = {};
  for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) { const k = P.id[y * P.w + x]; if (k < 0) continue; const X = Math.round(x * s); (top[k] = top[k] || {}); (bot[k] = bot[k] || {}); if (top[k][X] == null || y * s < top[k][X]) top[k][X] = y * s; if (bot[k][X] == null || y * s > bot[k][X]) bot[k][X] = y * s; }
  const fbox = (f) => { f.updateMatrixWorld(true); const g = f.geometry; g.computeBoundingBox(); const b = g.boundingBox; return [[b.min.x, b.min.y], [b.max.x, b.min.y], [b.max.x, b.max.y], [b.min.x, b.max.y]].map(([x, y]) => pr(V(x, y, 0).applyMatrix4(f.matrixWorld))); };
  const out = els.map((e, i) => { const f = e.sign.face, C = fbox(f);
    const cv2 = (f) => { const g = f.geometry; g.computeBoundingBox(); const b = g.boundingBox, cx = (b.min.x + b.max.x) / 2, A = pr(V(cx, b.min.y, 0).applyMatrix4(f.matrixWorld)), B2 = pr(V(cx, b.max.y, 0).applyMatrix4(f.matrixWorld)); return Math.hypot(A[0] - B2[0], A[1] - B2[1]); };   // (the face's height at its centre: right for a turned panel too)
    const ys = C.map(c => c[1]), xs = C.map(c => c[0]), hpx = cv2(f), capShare = f.userData.cap || (e.kind === 3 ? 7 / 9 : 64 / 120);
    const f2 = e.sign.face2, C2 = f2 ? fbox(f2) : null, h2 = C2 ? cv2(f2) : 0, p2 = C2 ? { face2: [xF(Math.min(...C2.map(c => c[0])), 1), xF(Math.min(...C2.map(c => c[1])), 1), xF(Math.max(...C2.map(c => c[0])), 1), xF(Math.max(...C2.map(c => c[1])), 1)], cap2Px: xF(h2 * (f2.userData.cap || 0.6), 1), cap2Px4: xF(h2 * (f2.userData.cap || 0.6) * 4, 1) } : {};
    let gapPool = 1e9, gapCar = 1e9; const T0 = top[i] || {}; for (const X in T0) { for (let k = nS; k < nS + nP; k++) { const B = bot[k] && bot[k][X]; if (B != null) gapPool = Math.min(gapPool, T0[X] - B); } const Bc = bot[nS + nP] && bot[nS + nP][X]; if (Bc != null) gapCar = Math.min(gapCar, T0[X] - Bc); }
    const tops = Object.values(T0); return { sign: e.en, face: [xF(Math.min(...xs), 1), xF(Math.min(...ys), 1), xF(Math.max(...xs), 1), xF(Math.max(...ys), 1)], faceHpx: xF(hpx, 1), capPx: xF(hpx * capShare, 1), capPx4: xF(hpx * capShare * 4, 1), signTop: tops.length ? xF(Math.min(...tops), 1) : null, gapPool: xF(gapPool, 1), gapCar: gapCar < 1e8 ? xF(gapCar, 1) : null, xs: [Math.min(...Object.keys(T0).map(Number)), Math.max(...Object.keys(T0).map(Number))], cell: e.cell, ...p2 }; });
  let verts = 0, meshes = 0; els.forEach(e => e.sign.S.traverse(q => { if (q.isMesh) { meshes++; verts += q.geometry.attributes.position.count; } }));
  console.error('AVSIGN ' + JSON.stringify({ signs: out, meshes, verts })); return out; };
const avFlag = (x, y, txt) => { const fl = ztFlag(x, y, txt, 'above', 46); if (fl && fl.style) { const w = parseFloat(fl.style.width) || 200, l0 = parseFloat(fl.style.left); fl.style.left = Math.max(4, Math.min(412 - 4 - w, l0)) + 'px'; } return fl; };
// the aero card with Dirkalni LOCKED: its row a padlock and the condition (win 3 races), the button grey, ZAKLENJENO
const AVPAD = '<svg viewBox="0 0 16 16" width="13" height="13" style="vertical-align:-2px"><rect x="2.5" y="7" width="11" height="8" rx="1.6" fill="#8a6d1a"/><path d="M5 7V5a3 3 0 0 1 6 0v2" fill="none" stroke="#8a6d1a" stroke-width="1.8"/><circle cx="8" cy="10.6" r="1.2" fill="#fff"/></svg>';
const avLockedCard = (top = 112) => { const P0 = MPART('aero'), P = Object.assign({}, P0, { tabSel: 'Paket', selName: 'Dirkalni', options: P0.options.map(o => o.tab === 'Paket' && o.name === 'Dirkalni' ? Object.assign({}, o, { price: AVPAD + ' <span style="color:#8a6d1a">zaklenjeno</span>', effect: 'odkleni: zmagaj 3 dirke' }) : o) });
  let h = cardHTML(P); const b0 = btn('KUPI IN NAMESTI'); h = h.split(b0).join(`<span style="display:inline-block;background:#9aa3ae;color:#fff;border-radius:10px;padding:7px 14px;font-style:italic;font-weight:900;font-size:14px;text-align:center;line-height:1.1;box-shadow:0 3px 0 #5b6470">${AVPAD.replace(/#8a6d1a/g, '#ffffff').replace('fill="#fff"', 'fill="#9aa3ae"')} ZAKLENJENO<br><span style="font-size:10px;font-weight:700;font-style:normal;opacity:.95">zmagaj 3 dirke</span></span>`);
  return div(`left:50%;top:${top}px;transform:translateX(-50%);width:300px;background:#fff;border-radius:14px;padding:10px 12px;z-index:64;box-shadow:0 6px 18px rgba(0,0,0,.45);font-weight:800;color:#0d1626`, h); };
// ==== AV: THE CARDS (the user's card rule: the card spans the whole screen width (7 px margins), stays short and ends above the car with at
//      least 8 px gap; the AERO menu shows a small picture of each kit: the car (VIHAR, the turntable's car in its colours) with that kit) ====
const AVCARD = { top: 80, side: 7 };
const avCardDiv = (html) => div(`left:${AVCARD.side}px;right:${AVCARD.side}px;top:${AVCARD.top}px;background:#fff;border-radius:14px;padding:8px 10px;z-index:64;box-shadow:0 6px 18px rgba(0,0,0,.45);font-weight:800;color:#0d1626`, html);
// the car's silhouette on the screen (an ID pass of the turntable's car with its preview parts; what hides it hides it): its top over the
// card's columns; the gap card -> car logged (AVGAP)
const avGap = (card, tag) => { const c = G3.cur; if (!c || !card) return null; G3.scene.updateMatrixWorld(true); const own = new Map(); c.root.traverse(m => { if (m.isMesh) own.set(m, 0); });
  const P = s6Pass(null, [{ name: 'car', objs: [c.root] }], own), cv = G3.renderer.domElement.getBoundingClientRect(), s = cv.width / P.w, r = card.getBoundingClientRect();
  let top = 1e9, at = null, x0 = 1e9, x1 = -1; for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) { if (P.id[y * P.w + x] !== 0) continue; const X = cv.left + x * s, Y = cv.top + y * s; if (X >= r.left && X <= r.right && Y < top) { top = Y; at = [xF(X, 0), xF(Y, 0)]; } x0 = Math.min(x0, X); x1 = Math.max(x1, X); }
  const g = { tag, card: [xF(r.left, 0), xF(r.top, 0), xF(r.right, 0), xF(r.bottom, 0)], carTop: xF(top, 0), at, carX: [xF(x0, 0), xF(x1, 0)], gap: xF(top - r.bottom, 0) }; console.error('AVGAP ' + JSON.stringify(g)); return g; };
// the kit thumbnails: the car with kit k (0 = Serijski: the plain car) rendered in a corner of the canvas (its own little scene: the same
// camera for all five, side-on with the nose turned a little), copied out as a data URL (168 × 108 px, shown at 56 × 36 CSS px)
const AVTH = {};
const avCarPaint = () => { const S = amSrc(), p = AMSRC.paint || (AMSRC.paint = amPaint(S)); return new T.Color(p[0], p[1], p[2]).getHex(); };
const avThumbs = () => { const R = G3.renderer, gl = R.domElement, pr = R.getPixelRatio(), W = 168, H = 108, vp = R.getViewport(new T.Vector4()), sc = R.getScissor(new T.Vector4()), st = R.getScissorTest(), ac = R.autoClear, cc = R.getClearColor(new T.Color()), ca = R.getClearAlpha();
  const scn = new T.Scene(); scn.add(new T.HemisphereLight(0xffffff, 0x8a96a8, 0.95)); const dl = new T.DirectionalLight(0xffffff, 0.85); dl.position.set(3, 6, 5); scn.add(dl);
  const cam = new T.PerspectiveCamera(21, W / H, 0.1, 100); cam.position.set(3.6, 2.6, 8.6); cam.lookAt(0.0, 0.66, 0); cam.updateMatrixWorld(true);
  for (let k = 0; k <= 4; k++) { if (AVTH[k]) continue; const lv = { paint: avCarPaint(), stripe: 0xf2f2f2, kit: avKitCols(Math.max(1, k)) }, md = avModel(lv, k, 1), m = new T.Mesh(md.geo, amMat('carpaint')); scn.add(m);
    R.setRenderTarget(null); R.setViewport(0, 0, W / pr, H / pr); R.setScissor(0, 0, W / pr, H / pr); R.setScissorTest(true); R.setClearColor(0xeef2f7, 1); R.autoClear = false; R.clear(); R.render(scn, cam);
    const c2 = document.createElement('canvas'); c2.width = W; c2.height = H; c2.getContext('2d').drawImage(gl, 0, gl.height - H, W, H, 0, 0, W, H); AVTH[k] = c2.toDataURL('image/png'); scn.remove(m); md.geo.dispose(); }
  R.setViewport(vp); R.setScissor(sc); R.setScissorTest(st); R.autoClear = ac; R.setClearColor(cc, ca); return AVTH; };
// the AERO card: the title, the tabs and the time on one line; tab Paket's five options in two columns, each with its kit's picture, its
// name and price, its effect; the selected one outlined; a locked one (lockName) with a padlock on its picture and its unlock condition
const avAeroCard = (selName, lockName) => { const P = MPART('aero'), th = avThumbs(), opts = P.options.filter(o => o.tab === 'Paket');
  const cell = (o) => { const kk = ['Serijski', 'Cestni', 'Športni', 'Dirkalni', 'Paket GT'].indexOf(o.name), sel = o.name === selName, lk = o.name === lockName, own = isOwned(o);
    const price = lk ? `<span style="color:#8a6d1a">zaklenjeno</span>` : `<span style="color:${own ? '#16a34a' : '#0d1626'}">${o.price}</span>`, eff = lk ? 'odkleni: zmagaj 3 dirke' : o.effect;
    return `<div style="display:flex;align-items:center;gap:6px;padding:3px 5px 3px 3px;border-radius:9px;${sel ? 'background:#e0f2ff;outline:2px solid #47c6ff' : 'background:#f1f4f8'}"><span style="position:relative;flex:none;width:56px;height:36px;border-radius:6px;overflow:hidden;box-shadow:inset 0 0 0 1px rgba(0,0,0,.12)"><img src="${th[kk]}" style="width:56px;height:36px;display:block">${lk ? `<span style="position:absolute;right:1px;bottom:0px;background:rgba(255,255,255,.85);border-radius:5px;padding:0 2px;line-height:12px">${AVPAD}</span>` : ''}</span><span style="flex:1;min-width:0;line-height:1.1"><span style="display:flex;justify-content:space-between;gap:4px;font-size:12px"><b>${o.name}</b><span style="font-size:10.5px;white-space:nowrap">${price}</span></span><span style="display:block;font-size:9.5px;color:#556;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eff}</span></span></div>`; };
  const tabs = P.tabs.map(t => `<span style="display:inline-block;padding:2px 8px;border-radius:8px;margin-left:3px;font-size:11px;${t === 'Paket' ? 'background:#47c6ff;color:#06203a' : 'background:#e8edf3;color:#334'}">${t}</span>`).join('');
  const head = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px"><b style="font-size:14.5px;font-style:italic">${P.title}</b><span>${tabs}</span><span style="font-size:10.5px;color:#334;background:#eef2f7;border-radius:8px;padding:2px 6px">⏱ ${P.durationSec} s</span></div>`;
  const grid = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">${opts.map(cell).join('')}</div>`;
  const locked = lockName && lockName === selName, bt = locked ? `<span style="display:inline-flex;align-items:center;gap:5px;white-space:nowrap;background:#9aa3ae;color:#fff;border-radius:10px;padding:5px 12px;font-style:italic;font-weight:900;font-size:13px;box-shadow:0 3px 0 #5b6470">${AVPAD.replace(/#8a6d1a/g, '#ffffff').replace('fill="#fff"', 'fill="#9aa3ae"')} ZAKLENJENO</span>` : `<span style="display:inline-block;background:#e23a2e;color:#fff;border-radius:10px;padding:5px 14px;font-style:italic;font-weight:900;font-size:13px;box-shadow:0 3px 0 #8f1d15">KUPI IN NAMESTI</span>`;
  const foot = `<div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px"><span style="display:inline-block;background:#e8edf3;color:#334;border-radius:10px;padding:5px 10px;font-weight:900;font-size:12px">‹ NAZAJ</span><span style="font-size:10.5px;color:#556;font-weight:700">predogled na avtu</span>${bt}</div>`;
  return avCardDiv(head + grid + foot); };
// the SERVICE card (js/garage.js's Servis panel: its rows, the condition, the prices, Popoln servis −15 %), full width, one line a row
const avSrvCard = (c) => { const price = (s) => { const w = 1 - c[s.id]; return w < 0.02 ? 0 : Math.round((s.base + s.k * w) / 50) * 50; }; let all = 0;
  const rows = AMSRV.map(s => { const p = price(s), q = c[s.id]; all += p; return `<div style="display:flex;align-items:center;gap:8px;padding:4px 7px;margin:3px 0 0;border-radius:9px;background:#f1f4f8"><span style="color:#2a5bd7;flex:none;display:flex">${AMIC[s.id]}</span><span style="flex:none;width:118px;line-height:1.1"><b style="font-size:12.5px">${s.name}</b><br><small style="font-size:10px;color:#556;font-weight:700">${s.desc}</small></span><b style="flex:none;width:34px;font-size:12px;color:${amCondCol(q)}">${Math.round(q * 100)} %</b><span style="flex:1;height:6px;border-radius:3px;background:#dde3ea"><i style="display:block;height:6px;border-radius:3px;width:${Math.round(q * 100)}%;background:${amCondCol(q)}"></i></span><span style="flex:none;background:#2a5bd7;color:#fff;border-radius:9px;padding:4px 7px;font-size:11.5px">${amNum(p)} CR</span></div>`; }).join('');
  const full = Math.round(all * 0.85 / 50) * 50, avg = Math.round((c.clean + c.body + c.engine) / 3 * 100);
  const head = `<div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:14.5px;font-style:italic;display:flex;align-items:center;gap:5px"><span style="color:#2a5bd7;display:flex">${AMIC.srv}</span>Servis</b><span style="font-size:11px;color:#334;background:#eef2f7;border-radius:8px;padding:2px 7px">Stanje ${avg} %</span></div>`;
  const foot = `<div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px"><span style="display:inline-block;background:#e8edf3;color:#334;border-radius:10px;padding:5px 10px;font-weight:900;font-size:12px">‹ NAZAJ</span><span style="display:inline-block;background:#e5484d;color:#fff;border-radius:10px;padding:5px 12px;font-weight:900;font-size:12px">POPOLN SERVIS · ${amNum(full)} CR · −15 %</span></div>`;
  return avCardDiv(head + rows + foot); };
const PNFR = [
  // 0 f0: the first view (412×915, DPR 1, the real UI, CAR muscle, the lift ORANGE, no hint banner) and THE MEASURE (S6A's), the footprint
  ['PNB f0 prvi pogled', () => { const { S, st } = wScene('O'); window.PNLAY = st.mali.s6 && st.mali.s6.L; PR.render(); s6MeasureAll(S, st, 'f0'); pnIdmap(S, st, 'idmapM.png', window.PNALL); pnSpecks(S, st, window.PNALL); avSignLog(st); pnFoot(st); PR.render(); }],
  // 1 the chest close, HQ: the first view's own camera, its part (window.PNZ1, CSS px) rendered again at DPR 8
  ['PNB omarici HQ', () => { wScene('O'); pnHQ('omarici.png', window.PNZ1 || [0, 640, 412, 275], window.PNZPR || 8); }, { noRender: true }],
  // 2 a closer look into the drawers (its own camera: PNZ[v].cam), the part PNZ[v].Z at DPR PNZ[v].zpr
  ['PNB predal od blizu', () => { const { st } = wScene('O'); window.PNLAY = st.mali.s6 && st.mali.s6.L; const q = window.PNZQ || PNZ[PNB.v] || PNZ[4]; pnCamF(q.cam); PR.render(); pnHQ('predal.png', q.Z, q.zpr); }, { noRender: true }],
  // 3 tap_one: the player taps the RED underglow (Luč pod avtom – Rdeča)
  // 3 tap_servis: the player taps the SERVICE element: its part of the top lit, the ring, the flag SERVIS, the garage's service card (its rows
  //   and the car's condition: the car a little worn for the picture, as the card says)
  ['AMA tap servis', async () => { const { S, st } = wScene('O'); const cond = AMCOND; if (window.Garage3D && Garage3D.setCond) Garage3D.setCond(cond); PR.render(); const els = s6Els(S, st), k = els.findIndex(e => e.name === 'Servis'); if (k < 0) { console.error('AM no SERVIS'); return; }
    const m0 = s6Measure(els).out[k]; avMark(els, [k]);
    const [x, y] = m0.at; tapPx(x, y); const fl = ztFlag(x, y, 'SERVIS', 'above', 46); if (fl && fl.style) { const w = parseFloat(fl.style.width) || 80, l0 = parseFloat(fl.style.left); fl.style.left = Math.max(4, Math.min(412 - 4 - w, l0)) + 'px'; }
    const card = avSrvCard(cond); avGap(card, 'servis'); console.error('S6TAP ' + JSON.stringify(m0)); }],
  ['AV tap vsi', async () => { const { S, st } = wScene('O'); PR.render(); const els = s6Els(S, st); avMark(els, els.map((_, k) => k));
    st.mali.s6.F.traverse(m => { if (m.isMesh && m.material && m.material.map === PDTX.edge) m.material.opacity *= 0.5; }); }],
  ['PNB idmap', () => { const { S, st } = wScene('O'); PR.render(); pnIdmap(S, st, 'idmap.png'); }, { noRender: true }],
  // 6 debug: a free view (window.PNDBG: camP's arguments, the target in F) of the whole frame
  ['PNB pogled od strani', () => { const { st } = wScene('O'); window.PNLAY = st.mali.s6 && st.mali.s6.L; pnCamF(window.PNDBG || PN3D.cam); PR.render(); }],
  // 7 PDA's version 2 (round PD, the straight plan chest) measured on this same base (PNB.v 0): the "before"
  ['AV razlicica AMA 2', () => { const v0 = AV.v; AV.v = 0; try { const { S, st } = wScene('O'); PR.render(); s6MeasureAll(S, st, 'am2'); PR.render(); } finally { AV.v = v0; } }],
  // 8 omarici_3d: a higher side view of the whole chest (from the front right, above), its part PN3D.Z at DPR PN3D.zpr: the form (gently curved)
  ['PNB omarici 3D', () => { const { st } = wScene('O'); window.PNLAY = st.mali.s6 && st.mali.s6.L; const q = window.PN3DQ || PN3D; pnCamF(q.cam); PR.render(); pnHQ('omarici_3d.png', q.Z, q.zpr); }, { noRender: true }],
  // (9 debug: what the camera's ray at window.PNPICK [[x, y], ...] (CSS px) hits first: the meshes, their materials, their element)
  ['PNB pick', () => { const { S, st } = wScene('O'); PR.render(); const els = s6Els(S, st), own = new Map(); els.forEach((e, k) => e.objs.forEach(o => o.traverse(m => { if (m.isMesh) own.set(m, e.name); })));
    G3.scene.updateMatrixWorld(true); const rc = new T.Raycaster(), r = G3.renderer.domElement.getBoundingClientRect();
    (window.PNPICK || [[9.5, 809.5]]).forEach(([x, y]) => { rc.setFromCamera(new T.Vector2((x - r.left) / r.width * 2 - 1, -((y - r.top) / r.height * 2 - 1)), G3.camera);
      const hits = rc.intersectObjects(G3.scene.children, true).filter(h => vVisible(h.object)).slice(0, 6);
      console.error('PNPICK ' + x + ',' + y + ' ' + hits.map(h => { const m = h.object, mt = [].concat(m.material)[0]; return `${h.distance.toFixed(4)} ${m.geometry.type} ${mt.type} #${mt.color ? mt.color.getHexString() : ''} op${mt.opacity} ${mt.transparent ? 'T' : ''} el=${own.get(m) || '-'} rO${m.renderOrder}`; }).join(' | ')); }); }],
  // 10 vrh_zoom: a close HQ look at the top with its parts (its own camera PZV.cam, its part PZV.Z at DPR PZV.zpr)
  ['PZA vrh od blizu', () => { const { st } = wScene('O'); window.PNLAY = st.mali.s6 && st.mali.s6.L; const q = window.PZVQ || PZV; pnCamF(q.cam); PR.render(); pnHQ('vrh.png', q.Z, q.zpr); }, { noRender: true }],
  // 11 probe: the car's surface (raycasts on the game's car mesh: side profile z(x, y), top profile y(x, z), the glass' lowest point)
  ['AV probe', () => { wScene('O'); const Sx = amSrc(), g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(Sx.P, 3)); const m = new T.Mesh(g, new T.MeshBasicMaterial({ side: T.DoubleSide })); m.updateMatrixWorld(true);
    const rc = new T.Raycaster(), hit = (o, d) => { rc.set(o, d); const h = rc.intersectObject(m, false)[0]; return h ? h.point : null; };
    const rows = []; for (let y = 0.3; y < 1.36; y += 0.1) { const r = []; for (let x = -2.2; x <= 2.21; x += 0.4) { const p = hit(V(x, y, 3), V(0, 0, -1)); r.push(p ? +p.z.toFixed(2) : null); } rows.push('y ' + y.toFixed(1) + ': ' + r.join(' ')); }
    console.error('AVPROBE side z (x -2.2..2.2 step .4)\n' + rows.join('\n'));
    const tr = []; for (const z of [0, 0.3, 0.6, 0.85]) { const r = []; for (let x = -2.4; x <= 2.41; x += 0.2) { const p = hit(V(x, 5, z), V(0, -1, 0)); r.push(p ? +p.y.toFixed(2) : null); } tr.push('z ' + z + ': ' + r.join(' ')); }
    console.error('AVPROBE top y (x -2.4..2.4 step .2)\n' + tr.join('\n'));
    let gmin = 9, gmax = -9; const paint = amPaint(Sx); for (let i = 0; i < Sx.C.length; i += 3) { const c = amClass(Sx.C[i], Sx.C[i + 1], Sx.C[i + 2], paint); if (c === 'dark' && Sx.P[i + 1] > 0.6) { gmin = Math.min(gmin, Sx.P[i + 1]); gmax = Math.max(gmax, Sx.P[i + 1]); } }
    const st = { min: [9, 9, 9], max: [-9, -9, -9] }; for (let i = 0; i < Sx.C.length; i += 3) { if (amClass(Sx.C[i], Sx.C[i + 1], Sx.C[i + 2], paint) !== 'stripe') continue; for (let k = 0; k < 3; k++) { st.min[k] = Math.min(st.min[k], Sx.P[i + k]); st.max[k] = Math.max(st.max[k], Sx.P[i + k]); } }
    console.error('AVPROBE glass y ' + gmin.toFixed(2) + '..' + gmax.toFixed(2) + ' paint ' + JSON.stringify(paint) + ' stripes ' + JSON.stringify(st)); }],
  // 12 tap_aero: the player taps the SPORT model: the model lit on its own silhouette, the ring, the flag AERO PAKET – ŠPORTNI, the aero card (Paket, Športni)
  ['AV tap aero', async () => { const { S, st } = wScene('O'); PR.render(); const els = s6Els(S, st), k = els.findIndex(e => e.name === 'Aero paket – Športni'); if (k < 0) { console.error('AV no SPORT'); return; }
    const m0 = s6Measure(els).out[k]; avMark(els, [k]); avGhost(2, avKitCols(2)); PR.render(); const [x, y] = m0.at; tapPx(x, y); avFlag(x, y, 'AERO PAKET – ŠPORTNI'); const card = avAeroCard('Športni', null); avGap(card, 'aero'); console.error('S6TAP ' + JSON.stringify(m0)); }],
  // 13 tap_zaklenjeno: the player taps the locked RACE model: the dome and the model lit on their silhouette, the flag, the aero card with Dirkalni locked
  ['AV tap zaklenjeno', async () => { const { S, st } = wScene('O'); PR.render(); const els = s6Els(S, st), k = els.findIndex(e => e.name === 'Aero paket – Dirkalni'); if (k < 0) { console.error('AV no RACE'); return; }
    const m0 = s6Measure(els).out[k]; avMark(els, [k]); avGhost(3, avKitCols(3)); PR.render(); const [x, y] = m0.at; tapPx(x, y); avFlag(x, y, 'AERO PAKET – DIRKALNI · ZAKLENJENO'); const card = avAeroCard('Dirkalni', 'Dirkalni'); avGap(card, 'zaklenjeno'); console.error('S6TAP ' + JSON.stringify(m0)); }],
  // 14 predogled_paketi: the car with each kit's preview (Cestni, Športni, Dirkalni, Paket GT), its first-view part (AVPZ) at DPR 2 -> ghost_<k>.png
  ['AV predogled paketov', () => { wScene('O'); const Z = window.AVPZ || [0, 360, 412, 200];
    for (let k = 1; k <= 4; k++) { avGhostOff(); avGhost(k, avKitCols(k)); PR.render(); pnHQ('ghost_' + k + '.png', Z, 2.5); } avGhostOff(); }, { noRender: true }],
  // 15 table_zoom: a close look at the signs and the models (its own camera AVTZ.cam, the part AVTZ.Z at DPR AVTZ.zpr)
  ['AV table od blizu', () => { const { st } = wScene('O'); window.PNLAY = st.mali.s6 && st.mali.s6.L; const q = window.AVTZQ || AVTZ; pnCamF(q.cam); PR.render(); pnHQ('table.png', q.Z, q.zpr); }, { noRender: true }],
  // 16 vrh_dpr4: the first view's own camera, the chest's top (models, signs, the button) rendered again at DPR 4
  ['AV vrh DPR4', () => { wScene('O'); pnHQ('vrh4.png', window.AVV4 || [0, 625, 412, 120], 4); }, { noRender: true }],
  // 17/18 table2: all three signs blue like YOUR CAR, the price on a second panel: A stacked on the same posts, B a small flag sign on its own pole behind
  ['AV table2 A', () => { window.AVSV = 'A'; const { S, st } = wScene('O'); window.PNLAY = st.mali.s6 && st.mali.s6.L; PR.render(); s6MeasureAll(S, st, 'f17'); avSignLog(st); PR.render(); pnHQ('vrh4A.png', [0, 625, 412, 120], 4); window.AVSV = null; }],
  // 19 table3: the user's pick (A) refined: green YOUR CAR, red price plates right-aligned, signs and padlock turned to the first-view camera, padlock at the door
  ['AV table3', () => { window.AVSV = 'C'; window.AVSRV = null; const { S, st } = wScene('O'); window.PNLAY = st.mali.s6 && st.mali.s6.L; console.error('AVAIM ' + JSON.stringify(avAim(G3.scene))); console.error('AVSRVC ' + JSON.stringify(avSrvCentre())); PR.render(); s6MeasureAll(S, st, 'f19'); avSignLog(st); PR.render(); pnHQ('vrh4C.png', [0, 625, 412, 120], 4); window.AVSV = null; }],
  ['AV table2 B', () => { window.AVSV = 'B'; const { S, st } = wScene('O'); window.PNLAY = st.mali.s6 && st.mali.s6.L; PR.render(); s6MeasureAll(S, st, 'f18'); avSignLog(st); PR.render(); pnHQ('vrh4B.png', [0, 625, 412, 120], 4); window.AVSV = null; }],
  // 20 drugi avti: another car parked (CAR, CARCOL from the harness): table4's scene, the models in the parked car (its own colours, the kits' colours); the card gap against the aero card's box
  ['AV drugi avto', () => { window.AVCARID = G3.cur.M.id; AMSRC = null; window.AVCARCOL = true; window.AVSV = 'C'; window.AVSRV = null; const want = G3.cur.spec.color, sh0 = G3.show; G3.show = function (sp) { return sh0.call(this, Object.assign({}, sp, { color: want, stripe: true })); };   // (the scene's base paints the car blue: keep the parked car's own colour)
    let R0; try { R0 = wScene('O'); } finally { G3.show = sh0; } const { S, st } = R0; window.PNLAY = st.mali.s6 && st.mali.s6.L; avAim(G3.scene); avSrvCentre(); PR.render();
    s6MeasureAll(S, st, 'f20'); avSignLog(st); avGap({ getBoundingClientRect: () => ({ left: 7, top: 80, right: 405, bottom: 293 }) }, 'kartica'); const K = amSrc().K; console.error('AVCAR ' + JSON.stringify({ id: G3.cur.M.id, name: G3.cur.M.name, fit: window.AVFIT, len: +(K.front - K.rear).toFixed(2), top: +K.top.toFixed(2), hw: +K.hw.toFixed(2) }));
    PR.render(); pnHQ('top2.png', [0, 625, 412, 120], 2); window.AVCARCOL = false; window.AVSV = null; }],
  // 21 krog luč 1: table4's scene, YOUR CAR's turntable lit (window.AVGLOW = 1)
  ['AV krog luc 1', () => { window.AVGLOW = 1; window.AVSV = 'C'; window.AVSRV = null; const { S, st } = wScene('O'); window.PNLAY = st.mali.s6 && st.mali.s6.L; avAim(G3.scene); avSrvCentre(); const RI = G3.renderer.info; RI.autoReset = false; RI.reset(); PR.render(); console.error('AVGLOWLOAD ' + JSON.stringify({ calls: RI.render.calls, tris: RI.render.triangles })); RI.autoReset = true;
    s6MeasureAll(S, st, 'f21'); avSignLog(st); PR.render(); pnHQ('krog4_1.png', [0, 625, 412, 120], 4); window.AVGLOW = null; window.AVSV = null; }],
  // 22 krog luč 2: table4's scene, YOUR CAR's turntable lit (window.AVGLOW = 2)
  ['AV krog luc 2', () => { window.AVGLOW = 2; window.AVSV = 'C'; window.AVSRV = null; const { S, st } = wScene('O'); window.PNLAY = st.mali.s6 && st.mali.s6.L; avAim(G3.scene); avSrvCentre(); const RI = G3.renderer.info; RI.autoReset = false; RI.reset(); PR.render(); console.error('AVGLOWLOAD ' + JSON.stringify({ calls: RI.render.calls, tris: RI.render.triangles })); RI.autoReset = true;
    s6MeasureAll(S, st, 'f22'); avSignLog(st); PR.render(); pnHQ('krog4_2.png', [0, 625, 412, 120], 4); window.AVGLOW = null; window.AVSV = null; }],
  // 23 krog luč 3: table4's scene, YOUR CAR's turntable lit (window.AVGLOW = 3)
  ['AV krog luc 3', () => { window.AVGLOW = 3; window.AVSV = 'C'; window.AVSRV = null; const { S, st } = wScene('O'); window.PNLAY = st.mali.s6 && st.mali.s6.L; avAim(G3.scene); avSrvCentre(); const RI = G3.renderer.info; RI.autoReset = false; RI.reset(); PR.render(); console.error('AVGLOWLOAD ' + JSON.stringify({ calls: RI.render.calls, tris: RI.render.triangles })); RI.autoReset = true;
    s6MeasureAll(S, st, 'f23'); avSignLog(st); PR.render(); pnHQ('krog4_3.png', [0, 625, 412, 120], 4); window.AVGLOW = null; window.AVSV = null; }],
  // 24 tabla luč 1: the lit turntable (AVGLOW 1) + the YOUR CAR sign lit (window.AVSGLOW = 1)
  ['AV tabla luc 1', () => { window.AVSANG = 40; window.AVGLOW = 1; window.AVSGLOW = 1; window.AVSV = 'C'; window.AVSRV = null; const { S, st } = wScene('O'); window.PNLAY = st.mali.s6 && st.mali.s6.L; avAim(G3.scene); avSrvCentre(); PR.render();
    s6MeasureAll(S, st, 'f24'); avSignLog(st); PR.render(); pnHQ('tabla4_1.png', [0, 625, 412, 120], 4); window.AVSANG = null; window.AVGLOW = null; window.AVSGLOW = null; window.AVSV = null; }],
  // 25 tabla luč 2: the lit turntable (AVGLOW 1) + the YOUR CAR sign lit (window.AVSGLOW = 2)
  ['AV tabla luc 2', () => { window.AVSANG = 40; window.AVGLOW = 1; window.AVSGLOW = 2; window.AVSV = 'C'; window.AVSRV = null; const { S, st } = wScene('O'); window.PNLAY = st.mali.s6 && st.mali.s6.L; avAim(G3.scene); avSrvCentre(); PR.render();
    s6MeasureAll(S, st, 'f25'); avSignLog(st); PR.render(); pnHQ('tabla4_2.png', [0, 625, 412, 120], 4); window.AVSANG = null; window.AVGLOW = null; window.AVSGLOW = null; window.AVSV = null; }],
  // 26 tabla luč 3: the lit turntable (AVGLOW 1) + the YOUR CAR sign lit (window.AVSGLOW = 3)
  ['AV tabla luc 3', () => { window.AVSANG = 40; window.AVGLOW = 1; window.AVSGLOW = 3; window.AVSV = 'C'; window.AVSRV = null; const { S, st } = wScene('O'); window.PNLAY = st.mali.s6 && st.mali.s6.L; avAim(G3.scene); avSrvCentre(); PR.render();
    s6MeasureAll(S, st, 'f26'); avSignLog(st); PR.render(); pnHQ('tabla4_3.png', [0, 625, 412, 120], 4); window.AVSANG = null; window.AVGLOW = null; window.AVSGLOW = null; window.AVSV = null; }],
  // 27 kot table: YOUR CAR (lit, v1) at three angles: today (parallel to the screen), facing the camera's eye, tilted back 40 deg; per angle a DPR-4 crop and the measures
  ['AV kot table', () => { window.AVGLOW = 1; window.AVSGLOW = 1; window.AVSV = 'C'; window.AVSRV = null; const { S, st } = wScene('O'); window.PNLAY = st.mali.s6 && st.mali.s6.L; avSrvCentre(); let F = null; G3.scene.traverse(o => { if (o.userData.avAim && o.userData.avAim.bb) F = o; });
    const cam = G3.camera, cv = G3.renderer.domElement.getBoundingClientRect(), pr = (v) => { const q = v.clone().project(cam); return [(q.x + 1) / 2 * cv.width, (1 - q.y) / 2 * cv.height]; }, out = [];
    for (const [nm, md] of [['danes', 'bb'], ['oko', 'eye'], ['40', 40]]) { window.AVSANG = md; avAim(G3.scene); G3.scene.updateMatrixWorld(true); const fc = F.children.find(q => q.isMesh && q.userData.cap); const g = fc.geometry; g.computeBoundingBox(); const b = g.boundingBox;
      const [TL, TR, BR, BL] = [[b.min.x, b.max.y], [b.max.x, b.max.y], [b.max.x, b.min.y], [b.min.x, b.min.y]].map(([x, y]) => pr(V(x, y, 0).applyMatrix4(fc.matrixWorld))), d = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
      const hl = d(TL, BL), hr = d(TR, BR), wt = d(TL, TR), wb = d(BL, BR), e = new T.Euler().setFromQuaternion(F.getWorldQuaternion(new T.Quaternion()), 'YXZ');
      out.push({ nm, tiltDeg: +(-e.x * 180 / Math.PI).toFixed(1), yawDeg: +(e.y * 180 / Math.PI).toFixed(1), capL: +(hl * 0.758).toFixed(2), capR: +(hr * 0.758).toFixed(2), ratio: +(((hl + hr) / 2) / ((wt + wb) / 2)).toFixed(3), wTop: +wt.toFixed(1), wBot: +wb.toFixed(1), top: +Math.min(TL[1], TR[1]).toFixed(1) });
      PR.render(); pnHQ('kot_' + nm + '.png', [0, 630, 110, 60], 4); }
    console.error('AVKOT ' + JSON.stringify({ true: +(0.096 / 0.44).toFixed(3), a: out })); window.AVSANG = null; window.AVGLOW = null; window.AVSGLOW = null; window.AVSV = null; }, { noRender: true }],
];
window.CONCEPT_E = { title: 'AV final: tri makete v isti pozi, table (YOUR CAR zelena osvetljena, RENT A CAR + 450€, FOR SALE + 4280€), osvetljen krog YOUR CAR, ključavnica na RACE, rdeč gumb za servis', frames: PNFR.map(([n, fn, o]) => Object.assign(FRX(n, 'TVOJ AVTO', fn), o || {})) };
