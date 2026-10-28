// ==== OZ: HOW THE ELEMENTS ARE MARKED WHILE THE CARD (okvirček) IS OPEN. Six versions of the marking, each on the same three elements:
//      the TRACK tyres (the regal's bottom shelf), TURBO (the regal's storey D) and the SPORT aero model (the front chest's top). The scene:
//      AMA's version-2 store (concepts/_e_store2_am2.js, a copy: scratchpad/oz/store_am2.js; no shelf tags: the user removed LB2's tags),
//      the first view (HOMEC), CAR muscle, the real UI. The card: EL-REGAL's rule (the whole width, 6 px margins (8 in version 5: the
//      pointer runs in the margin), right under the header, two columns, the pictures; it ends above the car AND above the element).
//      The helpers el* / ef* are copies of agents EL-REGAL's and EL-FRONT's frames (scratchpad/oz/src_el_*_frames.js, cut before their
//      frame lists) ====
const OZ = { top: 68, margin: 6 };
const ozF = (v, n = 1) => +(+v).toFixed(n);
let OZADD = [];
const ozReset = () => { OZADD.forEach(o => { if (o.parent) o.parent.remove(o); }); OZADD = [];
  const h = document.querySelector('.g-head'); if (h && h.dataset.ozz) { h.style.zIndex = h.dataset.ozz0 || ''; h.style.position = h.dataset.ozp0 || ''; delete h.dataset.ozz; } };
const ozScene = () => { clearUI(); ozReset(); const r = wScene('O'); window.ELST = r.st; PR.render(); return r; };
const OZ_TYRE = { 'Sneg': 'SNOW', 'Makadam': 'GRAVEL', 'Cesta': 'ROAD', 'Dirkališče': 'TRACK', 'Gorska': 'MOUNTAIN' };
// ---- the elements: { kind ('regal' | 'top'), name, flag, part, tab, sel, en, objs (what the player sees of it: the ID pass), root (the
//      group to lift), sc (its bay), lv (its storey: 0 A .. 3 D), label (the chest's own name tag) } ----
const ozEls = (S, st) => { const E = elList(st), R = st.regal, secs = R.secs || [];
  const tyre = (nm) => { const e = E.find(q => q.grp === 'gume' && q.sel === nm), g = (R.tyres || []).find(t => TSETS[t.userData.si][0] === nm); if (!e || !g) return null;
    return Object.assign({}, e, { kind: 'regal', root: g, sc: secs[g.userData.si], lv: 0, en: OZ_TYRE[nm] }); };
  const tq = ((R.tun && R.tun.places) || []).find(q => U5K[q.k][3] === 'turbo'), te = E.find(q => q.key === 'turbo');
  const turbo = te && tq ? Object.assign({}, te, { kind: 'regal', root: tq.part, sc: secs[tq.bay], lv: 3, en: 'TURBO' }) : null;
  const tops = efOrder(S, st).filter(q => q.place === 'top');
  // (the chest's cells are merged per material (pdMergeGroup): the model and its small turntable are the cell's meshes that are not its
  //  felt tile (pdTint), not its name tag or band (pdPlate), not see-through: what the player sees as the element, its own shape)
  const own = (g) => g ? g.children.filter(m => { if (!m.isMesh || !m.visible || m.userData.pdTint || m.userData.pdPlate) return false; const mt = [].concat(m.material)[0]; return mt && !mt.transparent && !(mt.blending && mt.blending !== T.NormalBlending); }) : [];
  const top = (nm, en) => { const q = tops.find(t => t.name === 'Aero paket – ' + nm); if (!q) return null; const mn = efMenuOf(q), g = q.e && q.e.g, ob = own(g);
    return { kind: 'top', name: q.name, flag: mn.flag, part: 'aero', tab: 'Paket', sel: nm, en: (q.e && q.e.en) || en, objs: ob.length ? ob : q.objs, root: null, cellG: g, cell: q.objs, e: q.e, label: q.e && q.e.label }; };
  return { TRACK: tyre('Dirkališče'), SNOW: tyre('Sneg'), MOUNTAIN: tyre('Gorska'), TURBO: turbo,
    SPORT: top('Športni', 'SPORT'), STREET: top('Cestni', 'STREET'), RACE: top('Dirkalni', 'RACE'), GT: top('Paket GT', 'GT PACK') }; };
// the other options of the same kind on the scene (version 4): tyres: the other tyre sets; aero: the other kit models; TURBO: none (the ten
// tuning parts are one menu with tabs: only TURBO is marked)
const OZKIN = { TRACK: ['SNOW', 'MOUNTAIN'], MOUNTAIN: ['SNOW', 'TRACK'], SPORT: ['STREET', 'RACE', 'GT'], TURBO: [] };
const ozOpts = (part, tab) => { const P = MPART(part); return (P.options || []).filter(o => !tab || !o.tab || o.tab === tab).map(o => o.name); };
// the car's meshes as the player sees it (not its soft contact shadow, not its see-through glows): EL-FRONT's efCarBox rule
const ozCarMeshes = () => { const c = G3.cur, out = []; if (!c || !c.root) return out; c.root.traverse(m => { if (!m.isMesh || !vVisible(m)) return; const mt = [].concat(m.material)[0]; if (mt && mt.transparent && (mt.opacity < 0.9 || mt.map)) return; out.push(m); }); return out; };
// ---- THE CARD: EL-REGAL's elCard with each version's look of the selected row, the row numbers (version 4), the cells kept (version 5) ----
const OZSEL = {
  v1: 'background:#e0f2ff;box-shadow:inset 0 0 0 2px #47c6ff',
  glow: 'background:#fffdf0;box-shadow:inset 0 0 0 2px #ffd23f,0 0 0 2px rgba(95,243,255,.9),0 0 10px 3px rgba(95,243,255,.7)',
  spot: 'background:#ffffff;box-shadow:inset 0 0 0 2px #ffd23f,0 2px 9px rgba(13,22,38,.4)',
  num: 'background:#e0f2ff;box-shadow:inset 0 0 0 2px #47c6ff',
  line: 'background:#fffbe6;box-shadow:inset 0 0 0 2px #ffd23f',
  lit: 'background:linear-gradient(180deg,#fff1b8 0%,#fffdf4 75%);box-shadow:inset 0 0 0 2px #ffd23f,0 -3px 9px rgba(255,214,51,.6)' };
const ozBadgeHTML = (n, sel) => `<span style="position:absolute;left:-4px;top:-5px;width:${sel ? 17 : 15}px;height:${sel ? 17 : 15}px;border-radius:50%;box-sizing:border-box;background:${sel ? '#ffd23f' : '#16245a'};color:${sel ? '#16245a' : '#fff'};border:1.5px solid ${sel ? '#16245a' : '#fff'};font-size:${sel ? 10.5 : 9.5}px;line-height:${sel ? 14 : 12}px;text-align:center;font-weight:900;z-index:2;box-shadow:0 1px 2px rgba(0,0,0,.35)">${n}</span>`;
const ozCard = (sp) => { const P = MPART(sp.part), tabs = P.tabs || [], tab = sp.tab, opts = (P.options || []).filter(o => !tab || !o.tab || o.tab === tab), sel = Math.max(0, opts.findIndex(o => o.name === sp.sel)), so = opts[sel];
  const th = sp.th || null, SW = th ? (sp.sw || [ELTW, ELTH]) : [32, 20], look = sp.style || 'v1', m = sp.margin != null ? sp.margin : OZ.margin;
  const head = `<div style="display:flex;align-items:center;gap:5px;white-space:nowrap"><b style="font-size:14px;font-style:italic;margin-right:3px">${P.title || P.name}</b>${tabs.map(t => `<span style="display:inline-block;padding:2px 9px;border-radius:8px;font-size:11.5px;${t === tab ? 'background:#47c6ff;color:#06203a' : 'background:#e8edf3;color:#334'}">${t}</span>`).join('')}<span style="flex:1"></span><span style="font-size:10.5px;color:#334;background:#eef2f7;border-radius:8px;padding:2px 7px">⏱ ${String(P.durationSec).replace('.', ',')} s</span></div>`;
  const MC = document.createElement('canvas').getContext('2d'), tw = (t, px) => { MC.font = `800 ${px}px ${FONT}`; return MC.measureText(String(t).replace(/<[^>]*>/g, '')).width; };
  const W = innerWidth - 2 * m, avail = (W - 14 - 3) / 2 - 9 - SW[0] - 6, three = opts.some(o => tw(o.name, 12) + 4 + tw(String(o.price || '').replace(/[()]/g, ''), 10.5) > avail - 2), CH = three ? 40 : (th ? Math.max(32, SW[1] + 4) : 30);
  const cell = (o, i) => { const own = elIsOwned(o), pc = own || /brezpla/.test(o.price || '') ? '#16a34a' : '#0d1626', pr = String(o.price || '').replace(/\s*\((−[^)]*)\)/, ' <span style="color:#e5484d">$1</span>'), isSel = i === sel;
    const pic = th && th[o.name] ? `<img src="${th[o.name]}" style="width:${SW[0]}px;height:${SW[1]}px;border-radius:5px;flex:none;display:block;object-fit:contain">` : `<span style="width:${SW[0]}px;height:${SW[1]}px;border-radius:5px;background:${swatchOf(o.name, P.id)};flex:none;box-shadow:inset 0 0 0 1px rgba(0,0,0,.15)"></span>`;
    const num = sp.nums ? ozBadgeHTML(i + 1, isSel) : '';
    const box = `position:relative;display:flex;align-items:center;gap:6px;min-width:0;height:${CH}px;box-sizing:border-box;padding:2px 6px 2px 3px;border-radius:8px;${isSel ? OZSEL[look] : 'background:#f1f4f8' + (look === 'spot' ? ';opacity:.7' : '')}`, eff = `<span style="display:block;font-size:9.6px;color:#556;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${o.effect || ''}</span>`;
    if (three) return `<div class="ozcell" style="${box}">${num}${pic}<span style="flex:1;min-width:0;line-height:1.1"><span style="display:block;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${o.name}</span>${eff}<span style="display:block;font-size:10.5px;color:${pc};white-space:nowrap">${pr}</span></span></div>`;
    return `<div class="ozcell" style="${box}">${num}${pic}<span style="flex:1;min-width:0;line-height:1.08"><span style="display:flex;gap:4px;align-items:baseline;white-space:nowrap"><span style="font-size:12px;line-height:1.3">${o.name}</span><span style="flex:1"></span><span style="font-size:10.5px;color:${pc}">${pr}</span></span>${eff}</span></div>`; };
  const grid = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;margin-top:4px">${opts.map(cell).join('')}</div>`;
  const price = elPriceN(so && so.price), poor = price > ELR.cr, buy = elIsOwned(so || {}) ? `<span style="display:inline-block;background:#e8f7ee;color:#16a34a;border-radius:10px;padding:6px 12px;font-weight:900;font-size:13px">✓ nameščen</span>`
    : `<span style="display:inline-block;background:#e23a2e;color:#fff;border-radius:10px;padding:5px 11px;font-style:italic;font-weight:900;font-size:13px;line-height:1.1;box-shadow:0 2px 0 #8f1d15">KUPI IN NAMESTI · ${so ? String(so.price).replace(/\s*\(.*\)/, '') : ''}</span>`;
  const note = poor ? `<span style="font-size:10.5px;color:#e5484d;font-weight:800;line-height:1.1;text-align:right">premalo kreditov:<br>imaš ${elNum(ELR.cr)} CR</span>` : '';
  const foot = `<div style="display:flex;align-items:center;gap:8px;margin-top:5px;white-space:nowrap"><span style="display:inline-block;background:#e8edf3;color:#334;border-radius:10px;padding:5px 10px;font-weight:900;font-size:12px">‹ NAZAJ</span><span style="flex:1"></span>${note}${buy}</div>`;
  const d = div(`left:${m}px;right:${m}px;top:${OZ.top}px;background:#fff;border-radius:14px;padding:6px 7px 7px;z-index:64;box-shadow:0 6px 18px rgba(0,0,0,.45);font-weight:800;color:#0d1626;box-sizing:border-box`, head + grid + foot);
  const cells = [...d.querySelectorAll('.ozcell')];
  return { d, cells, selCell: cells[sel], selIdx: sel, sel: so ? so.name : null, price: so ? so.price : null, poor, opts: opts.map(o => o.name), lines: three ? 3 : 2, pics: !!th }; };
// ---- the 2D layers over the 3D picture, from an ID pass (s6Pass: item k's pixels id k): masks, a contour OUTSIDE the element only (its
//      own pixels stay as the 3D picture has them: the marking never hides its shape), a soft glow, the dimming ----
const ozCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const ozMask = (P, ks) => { const c = ozCanvas(P.w, P.h), g = c.getContext('2d'), im = g.createImageData(P.w, P.h), S = new Set([].concat(ks));
  for (let i = 0; i < P.w * P.h; i++) if (S.has(P.id[i])) { const j = i * 4; im.data[j] = im.data[j + 1] = im.data[j + 2] = 255; im.data[j + 3] = 255; } g.putImageData(im, 0, 0); return c; };
const ozDilate = (m, r) => { const c = ozCanvas(m.width, m.height), g = c.getContext('2d'), R = Math.ceil(r); for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) if (dx * dx + dy * dy <= r * r + 0.3) g.drawImage(m, dx, dy); return c; };
const ozTint = (m, col, a = 1) => { const c = ozCanvas(m.width, m.height), g = c.getContext('2d'); g.drawImage(m, 0, 0); g.globalCompositeOperation = 'source-in'; g.globalAlpha = a; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height); return c; };
const ozBlur = (m, px) => { const c = ozCanvas(m.width, m.height), g = c.getContext('2d'); g.filter = `blur(${px}px)`; g.drawImage(m, 0, 0); g.filter = 'none'; return c; };
const ozCut = (c, m) => { const g = c.getContext('2d'); g.globalCompositeOperation = 'destination-out'; g.drawImage(m, 0, 0); g.globalCompositeOperation = 'source-over'; return c; };
const ozShow = (c, z = 59) => { const r = G3.renderer.domElement.getBoundingClientRect(); c.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;z-index:${z};pointer-events:none`; c.className = 'qov'; document.body.appendChild(c); return c; };
const ozK = (P) => P.w / G3.renderer.domElement.getBoundingClientRect().width;   // (buffer px per CSS px)
// a contour round mask m: o.t the crisp line (CSS px, colour o.col), o.edge a dark line outside it, o.glow a soft glow (blur, colour o.gcol)
const ozContour = (m, k, o = {}) => { const out = ozCanvas(m.width, m.height), g = out.getContext('2d'), t = (o.t || 0) * k;
  if (o.glow) { const gl = ozBlur(ozTint(ozDilate(m, t + 2 * k), o.gcol || '#5ff3ff'), o.glow * k); g.globalAlpha = o.ga || 1; g.drawImage(gl, 0, 0); g.drawImage(gl, 0, 0); g.globalAlpha = 1; }
  if (o.edge) g.drawImage(ozTint(ozDilate(m, t + o.edge * k), o.ecol || '#0d1626', o.ea || 0.85), 0, 0);
  if (t) { const ln = ozTint(ozDilate(m, t), o.col || '#ffd23f', o.a || 1); if (o.edge) { g.globalCompositeOperation = 'destination-out'; g.drawImage(ozDilate(m, t), 0, 0); g.globalCompositeOperation = 'source-over'; } g.drawImage(ln, 0, 0); }
  return ozCut(out, m); };
// the element's own colours a little brighter (its own colour as emissive; a texture lights itself through emissiveMap)
const ozBright = (objs, k = 0.3) => objs.forEach(o => o && o.traverse(m => { if (!m.isMesh || !m.visible) return;
  const f = (mt) => { if (!mt || mt.transparent || mt.blending === T.AdditiveBlending) return mt; const c = mt.clone();
    if (c.emissive) { if (c.map) { c.emissiveMap = c.map; c.emissive = new T.Color(k * 1.4, k * 1.4, k * 1.4); } else if (c.color) c.emissive = c.color.clone().multiplyScalar(k).add(mt.emissive || new T.Color(0)); }
    else if (c.color) c.color = c.color.clone().multiplyScalar(1 + k); return c; };
  m.material = Array.isArray(m.material) ? m.material.map(f) : f(m.material); }));
// ---- the shelves: a bay's lips and an element's box in its bay's frame (LB2's lbLips / lbBox, copied) ----
const ozBoxIn = (sc, objs) => { sc.g.updateMatrixWorld(true); const inv = new T.Matrix4().copy(sc.g.matrixWorld).invert(), b = new T.Box3(), p = V();
  objs.forEach(o => o && o.traverse(m => { if (!m.isMesh || !m.visible || !m.geometry || !m.geometry.attributes.position) return; const mt = [].concat(m.material)[0];
    if (!mt || mt.transparent || mt.isShaderMaterial || mt.blending === T.AdditiveBlending) return; if (!m.geometry.boundingBox) m.geometry.computeBoundingBox(); const q = m.geometry.boundingBox;
    for (const x of [q.min.x, q.max.x]) for (const y of [q.min.y, q.max.y]) for (const z of [q.min.z, q.max.z]) b.expandByPoint(p.set(x, y, z).applyMatrix4(m.matrixWorld).applyMatrix4(inv)); }));
  return b; };
const ozLips = (sc) => { const out = {}, want = { A: RG.LV[0] - 0.01, B: RG.LV[1] - 0.01, C: RG.LV[2] - 0.01, D: RG.LV[3] - 0.01, TOP: RG.TOP - 0.05 };
  sc.frame.children.forEach(m => { if (!m.isMesh || !m.geometry || m.geometry.type !== 'BoxGeometry') return; const P = m.geometry.parameters;
    if (Math.abs(P.width - (sc.L + 0.06)) > 1e-3 || Math.abs(P.depth - 0.03) > 1e-3 || P.height < 0.03 || P.height > 0.12) return;
    Object.keys(want).forEach(k => { if (Math.abs(m.position.y - want[k]) < 0.004) out[k] = { lip: k, y0: m.position.y - P.height / 2, y1: m.position.y + P.height / 2, zf: m.position.z + P.depth / 2 }; }); });
  return out; };
// ---- VERSION 4's NAME PLATE: a simple desk plate (a wedge: its sloped face toward the player) standing on the shelf in front of the
//      marked element only, in its MARKED look (yellow, navy capitals; unmarked it would be navy with white capitals). Its final shape
//      comes from round NP ----
const ozPlate = (e, txt) => { const sc = e.sc; if (!sc) return null; const b = ozBoxIn(sc, e.objs), L = ozLips(sc), lp = L['ABCD'[e.lv]]; if (!lp) { console.error('OZ no lip ' + e.lv + ' ' + JSON.stringify(Object.keys(L))); return null; }
  const w = e.lv === 3 ? 0.3 : Math.max(0.3, Math.min(0.46, 0.8 * (b.max.x - b.min.x))), h = e.lv === 3 ? 0.05 : 0.08, d = e.lv === 3 ? 0.04 : 0.055, y0 = lp.y1 + 0.0025, zf = Math.min(lp.zf - 0.003, Math.max(b.max.z + 0.008 + d, lp.zf - 0.1)), zb = zf - d, x = (b.min.x + b.max.x) / 2, x0 = x - w / 2, x1 = x + w / 2;
  const G = new T.Group(), sl = Math.hypot(h, d);
  const face = new T.BufferGeometry(); face.setAttribute('position', new T.Float32BufferAttribute([x0, y0, zf, x1, y0, zf, x1, y0 + h, zb, x0, y0 + h, zb], 3)); face.setAttribute('uv', new T.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2)); face.setIndex([0, 1, 2, 0, 2, 3]); face.computeVertexNormals();
  G.add(new T.Mesh(face, new T.MeshBasicMaterial({ map: hNameTex(txt, w / sl, { H: 128, font: 92, pad: 10, line: false, bg: '#ffd23f', fg: '#16245a' }) })));
  const body = new T.BufferGeometry(); body.setAttribute('position', new T.Float32BufferAttribute([x0, y0, zb, x0, y0 + h, zb, x1, y0 + h, zb, x0, y0, zb, x1, y0 + h, zb, x1, y0, zb,   // (the back)
    x0, y0, zf, x0, y0 + h, zb, x0, y0, zb, x1, y0, zf, x1, y0, zb, x1, y0 + h, zb], 3)); body.computeVertexNormals();   // (the two ends)
  G.add(new T.Mesh(body, new T.MeshLambertMaterial({ color: 0xc9a21f, side: T.DoubleSide })));
  sc.g.add(G); OZADD.push(G); G.updateMatrixWorld(true);
  return { G, w: ozF(w, 3), h, d, zf: ozF(zf, 3), y0: ozF(y0, 3), lip: lp, el: [b.min.x, b.max.x, b.min.y, b.max.y, b.min.z, b.max.z].map(v => ozF(v, 3)) }; };
// the chest's own name tag (AMA's pdTag in front of each model) in the MARKED look: yellow, navy capitals
// (the tag was merged into its cell's meshes per material: its name face's material (the one with a picture) gets the yellow picture)
const ozTagYellow = (e) => { const m = e.label; if (!m || !m.geometry || !m.geometry.parameters) return null; const P = m.geometry.parameters, mats = [].concat(m.material), F = mats.find(q => q && q.map); if (!F) return null;
  const old = F.map; F.map = hNameTex(e.en, P.width / P.depth, { H: 96, font: 70, pad: 6, line: false, bg: '#ffd23f', fg: '#16245a' }); F.map.anisotropy = 8; F.needsUpdate = true;
  let used = 0; if (e.cellG) e.cellG.traverse(q => { if (q.isMesh && [].concat(q.material).includes(F)) used++; }); return { w: ozF(P.width, 3), d: ozF(P.depth, 3), en: e.en, meshes: used, oldSize: old && old.image ? [old.image.width, old.image.height] : null }; };
// a number badge on the scene (version 4)
const ozBadge = (x, y, n, sel) => div(`left:${Math.max(11, Math.min(innerWidth - 11, x))}px;top:${y}px;transform:translate(-50%,-50%);width:${sel ? 19 : 16}px;height:${sel ? 19 : 16}px;border-radius:50%;box-sizing:border-box;background:${sel ? '#ffd23f' : '#16245a'};color:${sel ? '#16245a' : '#fff'};border:1.5px solid ${sel ? '#16245a' : '#ffffff'};font-weight:900;font-size:${sel ? 11.5 : 10}px;line-height:${sel ? 16 : 13}px;text-align:center;z-index:68;box-shadow:0 1px 3px rgba(0,0,0,.55)`, String(n));
// ---- VERSION 5's POINTER: from the selected row's outer side, along the card's margin, then to the element's top (round corners; around
//      the car when the element is under it) ----
const ozPointer = (card, box, carBox) => { const cr = card.d.getBoundingClientRect(), sr = card.selCell.getBoundingClientRect(), left = (sr.left + sr.right) / 2 < innerWidth / 2;
  const xm = left ? cr.left / 2 : (cr.right + innerWidth) / 2, y0 = (sr.top + sr.bottom) / 2, xs = left ? sr.left + 1 : sr.right - 1;
  const [bx, by, bw] = box, tx = bx + bw / 2, ty = by - 3, cb = cr.bottom;
  const crosses = carBox && tx > carBox[0] - 6 && tx < carBox[2] + 6 && ty > carBox[1];   // (straight down from under the card would cross the car)
  const yh = crosses ? ty - 14 : cb + 10, pts = [[xs, y0], [xm, y0], [xm, yh], [tx, yh], [tx, ty]];
  const r = 7, seg = (p, q, s) => [p[0] + (q[0] - p[0]) * s, p[1] + (q[1] - p[1]) * s], len = (p, q) => Math.hypot(q[0] - p[0], q[1] - p[1]);
  let dd = `M${pts[0][0]},${pts[0][1]}`; for (let i = 1; i < pts.length - 1; i++) { const a = pts[i - 1], b = pts[i], c = pts[i + 1], ra = Math.min(r, len(a, b) / 2, len(b, c) / 2), p1 = seg(b, a, ra / Math.max(1e-6, len(a, b))), p2 = seg(b, c, ra / Math.max(1e-6, len(b, c)));
    dd += ` L${p1[0].toFixed(1)},${p1[1].toFixed(1)} Q${b[0].toFixed(1)},${b[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`; }
  dd += ` L${tx.toFixed(1)},${ty.toFixed(1)}`;
  const svg = `<svg width="${innerWidth}" height="${innerHeight}" viewBox="0 0 ${innerWidth} ${innerHeight}" style="position:absolute;left:0;top:0;overflow:visible"><path d="${dd}" fill="none" stroke="#0d1626" stroke-opacity=".9" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<path d="${dd}" fill="none" stroke="#ffd23f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${tx}" cy="${ty}" r="4.2" fill="#ffd23f" stroke="#0d1626" stroke-width="1.6"/>`
    + `<circle cx="${xs}" cy="${y0}" r="2.6" fill="#ffd23f" stroke="#0d1626" stroke-width="1.2"/></svg>`;
  div(`left:0;top:0;width:${innerWidth}px;height:${innerHeight}px;z-index:66;pointer-events:none`, svg);
  return { side: left ? 'left' : 'right', pts: pts.map(p => p.map(v => ozF(v))), crossesCar: !!crosses }; };
// ---- VERSION 6's LIFT AND LIGHT: the element moved forward (toward the player) and up a little; a warm spot light from above (a real
//      SpotLight, its soft beam drawn as an additive cone, a small lamp under the board above on the regal) ----
const ozLift = (e) => { const list = e.root ? [e.root] : e.objs; if (!list.length) return null; const b = new T.Box3(); list.forEach(o => { o.updateMatrixWorld(true); b.expandByObject(o); }); const wp = b.getCenter(V());
  let out; if (e.sc && e.sc.out) out = e.sc.out.clone().setY(0).normalize(); else { out = G3.camera.position.clone().sub(wp).setY(0).normalize(); }
  const off = out.clone().multiplyScalar(e.kind === 'top' ? 0.05 : 0.12).add(V(0, e.kind === 'top' ? 0.06 : 0.03, 0));
  list.forEach(o => { const par = o.parent; if (!par) return; par.updateMatrixWorld(true); const a = par.worldToLocal(wp.clone()), c = par.worldToLocal(wp.clone().add(off)); o.position.add(c.sub(a)); o.updateMatrixWorld(true); });
  return { off: off.toArray().map(v => ozF(v, 3)), n: list.length }; };
const ozGrad = () => { const c = ozCanvas(8, 128), g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, 'rgba(255,255,255,0.0)'); gr.addColorStop(0.18, 'rgba(255,255,255,0.75)'); gr.addColorStop(1, 'rgba(255,255,255,0.18)'); g.fillStyle = gr; g.fillRect(0, 0, 8, 128); return new T.CanvasTexture(c); };
// the light: on the regal a small warm lamp under the front edge of the board above (a shelf display light), its spot aimed down and back
// at the element's front, its soft beam drawn as an additive cone from the lamp to the element, a soft pool on the board in front of it;
// on the chest top a stage light from high above (straight down)
const ozCone = (A, B, r0, r1, op, col) => { const d = B.clone().sub(A), L = d.length(), m = new T.Mesh(new T.CylinderGeometry(r0, r1, L, 40, 1, true), new T.MeshBasicMaterial({ map: ozGrad(), color: col, transparent: true, opacity: op, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false }));
  m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(V(0, -1, 0), d.normalize()); m.renderOrder = 7; G3.scene.add(m); OZADD.push(m); return m; };
const ozPool = (c, r, op, col) => { const pc = ozCanvas(128, 128), pg = pc.getContext('2d'), gr = pg.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(0.55, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); pg.fillStyle = gr; pg.fillRect(0, 0, 128, 128);
  const pool = new T.Mesh(new T.PlaneGeometry(r * 2, r * 2), new T.MeshBasicMaterial({ map: new T.CanvasTexture(pc), color: col, transparent: true, opacity: op, blending: T.AdditiveBlending, depthWrite: false, fog: false }));
  pool.rotation.x = -Math.PI / 2; pool.position.copy(c); pool.renderOrder = 6; G3.scene.add(pool); OZADD.push(pool); return pool; };
const ozLight = (e) => { const col = 0xfff0c8, b = new T.Box3(); e.objs.forEach(o => b.expandByObject(o)); const c = b.getCenter(V()), s = b.getSize(V());
  if (e.kind === 'regal') { const sc = e.sc, bb = ozBoxIn(sc, e.objs), L = ozLips(sc), lp = L['ABCD'[e.lv]], zf = lp ? lp.zf : bb.max.z, xc = (bb.min.x + bb.max.x) / 2, yTop = RG.LV[e.lv + 1] - 0.045;
    const lamp = sc.at(xc, yTop, zf + 0.02), aim = sc.at(xc, (bb.min.y + bb.max.y) / 2, bb.max.z), hw = (bb.max.x - bb.min.x) / 2;
    const sp = new T.SpotLight(col, 2.6, 2.2, Math.atan2(hw * 1.05, lamp.distanceTo(aim)), 0.75, 1.0); sp.position.copy(lamp); sp.target.position.copy(aim); sp.castShadow = false; G3.scene.add(sp); G3.scene.add(sp.target); OZADD.push(sp, sp.target);
    const foot = sc.at(xc, (bb.min.y * 0.7 + bb.max.y * 0.3), Math.min(bb.max.z + 0.04, zf));
    ozCone(lamp, foot, 0.03, hw * 0.95, 0.3, col);
    ozPool(sc.at(xc, bb.min.y + 0.003, Math.min(bb.max.z, zf - 0.05)), hw * 1.1, 0.55, col);
    const lg = new T.Group(); lg.position.copy(lamp); const hs = new T.Mesh(new T.BoxGeometry(Math.min(0.5, hw * 2 * 0.8), 0.022, 0.05), new T.MeshLambertMaterial({ color: 0x2a2f38 })); hs.rotation.y = Math.atan2(sc.out.x, sc.out.z); lg.add(hs);
    const lens = new T.Mesh(new T.PlaneGeometry(Math.min(0.48, hw * 2 * 0.78), 0.04), new T.MeshBasicMaterial({ color: 0xfff6dc, side: T.DoubleSide })); lens.rotation.order = 'YXZ'; lens.rotation.set(Math.PI / 2, Math.atan2(sc.out.x, sc.out.z), 0); lens.position.y = -0.0115; lg.add(lens); G3.scene.add(lg); OZADD.push(lg);
    return { lamp: lamp.toArray().map(v => ozF(v, 3)), aim: aim.toArray().map(v => ozF(v, 3)), hw: ozF(hw, 3) }; }
  const top = b.max.y + 0.55, r0 = Math.max(s.x, s.z) * 0.58, H = top - b.max.y;
  const sp = new T.SpotLight(col, 1.5, H + 0.9, Math.atan2(r0 * 1.15, H), 0.85, 1.2); sp.position.set(c.x, top, c.z); sp.target.position.set(c.x, b.min.y, c.z); sp.castShadow = false; G3.scene.add(sp); G3.scene.add(sp.target); OZADD.push(sp, sp.target);
  ozCone(V(c.x, top, c.z), V(c.x, b.max.y - 0.02, c.z), 0.03, r0, 0.2, col); ozPool(V(c.x, b.min.y + 0.004, c.z), r0 * 1.3, 0.45, col);
  return { top: ozF(top, 3), H: ozF(H, 3), r0: ozF(r0, 3), at: c.toArray().map(v => ozF(v, 3)) }; };
