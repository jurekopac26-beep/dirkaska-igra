// ==== OZ3: THE TAPPED ELEMENT BLUE, THE OTHER OPTIONS OF ITS MENU GREEN (the user: "Ko klikneš na element, se ta pobarva na modro, poleg
//      njega pa se vsi elementi, ki so prikazani v meniju, pobarvajo tudi, vendar v zeleno. V meniju naj bo vedno označen element, ki ga je
//      uporabnik kliknil, z modro, ostali z zeleno. Elementi v meniju naj bodo postavljeni po takem vrstnem redu kot elementi, ki se jih
//      klika."). Every mark is TRANSLUCENT (a ~30 % tint + a bright outline outside the shape: the element stays clearly visible); the rest
//      of the garage dimmed a little (not the car, the header, the card, the marked elements); the card (_card4.js, 2x2): the tapped tile
//      framed blue, the tiles of the other elements in the scene framed green, a tile with no element in the scene grey; the tiles in the
//      elements' order as the player sees them (rows top to bottom, each row left to right); NO name flag (the user removed it).
//      The scene: a copy of concepts/_e_store2_av1.js (scratchpad/oz/store_av1_oz3.js), the first view, CAR muscle. Helpers: oz*, oz2* ====
// ---- the fine (supersampled) ID pass: s6Pass's flat-colour pass rendered into a target ss times the drawing buffer (no other change) ----
const ozPassSS = (items, ss) => { const own = new Map(); items.forEach((it, k) => it.objs.forEach(o => o && o.traverse(m => { if (m.isMesh) own.set(m, k); }))); G3.scene.updateMatrixWorld(true);
  const R = G3.renderer, sc = G3.scene, cam = G3.camera, sz = R.getDrawingBufferSize(new T.Vector2()), w = sz.x * ss, h = sz.y * ss, saved = [], BLK = new T.MeshBasicMaterial({ color: 0x000000, fog: false, side: T.DoubleSide }); BLK.toneMapped = false;
  const IDM = items.map((_, k) => { const m = new T.MeshBasicMaterial({ color: new T.Color(((k + 1) % 32) * 8 / 255, 1, Math.floor((k + 1) / 32) * 8 / 255), fog: false, side: T.DoubleSide }); m.toneMapped = false; return m; });
  sc.traverse(o => { if (!(o.isMesh || o.isSprite || o.isLine || o.isPoints)) return; saved.push([o, o.material, o.visible]); if (!o.visible) return; const k = own.get(o), mats = Array.isArray(o.material) ? o.material : [o.material], m0 = mats[0];
    if (o.isSprite || o.isLine || o.isPoints || !m0 || m0.visible === false || m0.colorWrite === false || (m0.transparent && m0.opacity < 0.5 && k == null) || m0.depthTest === false || (m0.blending && m0.blending !== T.NormalBlending)) { o.visible = false; return; }
    const M = k != null ? IDM[k] : BLK; o.material = Array.isArray(o.material) ? o.material.map(() => M) : M; });
  const rt = new T.WebGLRenderTarget(w, h), oc = R.getClearColor(new T.Color()), oa = R.getClearAlpha(), ost = R.shadowMap.autoUpdate; R.shadowMap.autoUpdate = false;
  R.setRenderTarget(rt); R.setClearColor(0x000000, 1); R.clear(); R.render(sc, cam); const px = new Uint8Array(w * h * 4); R.readRenderTargetPixels(rt, 0, 0, w, h, px); R.setRenderTarget(null); R.setClearColor(oc, oa); R.shadowMap.autoUpdate = ost; rt.dispose();
  saved.forEach(([o, m, v]) => { o.material = m; o.visible = v; });
  const id = new Int16Array(w * h).fill(-1); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = ((h - 1 - y) * w + x) * 4; if (px[i + 1] > 200) { const k = Math.round(px[i] / 8) + 32 * Math.round(px[i + 2] / 8) - 1; if (k >= 0 && k < items.length) id[y * w + x] = k; } }
  return { id, w, h }; };
// a mask of items ks from a pass, in the rectangle R = [x, y, w, h] of the pass's pixels
const ozMaskR = (PS, ks, R) => { const c = ozCanvas(R[2], R[3]), g = c.getContext('2d'), im = g.createImageData(R[2], R[3]), S = new Set([].concat(ks)), D8 = im.data;
  for (let y = 0; y < R[3]; y++) { const row = (R[1] + y) * PS.w + R[0]; for (let x = 0; x < R[2]; x++) if (S.has(PS.id[row + x])) { const j = (y * R[2] + x) * 4; D8[j] = D8[j + 1] = D8[j + 2] = 255; D8[j + 3] = 255; } }
  g.putImageData(im, 0, 0); return c; };
// a wide dilation as several small round ones (a disc plus a disc is a disc): far fewer stamps at the fine resolution
const ozDilateF = (m, r) => { if (r <= 3.5) return ozDilate(m, r); const n = Math.ceil(r / 3); let c = m; for (let i = 0; i < n; i++) c = ozDilate(c, r / n); return c; };
const ozContourF = (m, k, o = {}) => { const out = ozCanvas(m.width, m.height), g = out.getContext('2d'), t = (o.t || 0) * k;
  if (o.glow) { const gl = ozBlur(ozTint(ozDilateF(m, t + 2 * k), o.gcol || '#5ff3ff'), o.glow * k); g.globalAlpha = o.ga || 1; g.drawImage(gl, 0, 0); g.drawImage(gl, 0, 0); g.globalAlpha = 1; }
  const dT = t ? ozDilateF(m, t) : null; if (o.edge) { g.drawImage(ozTint(ozDilateF(dT || m, o.edge * k), o.ecol || '#0d1626', o.ea || 0.85), 0, 0); if (dT) { g.globalCompositeOperation = 'destination-out'; g.drawImage(dT, 0, 0); g.globalCompositeOperation = 'source-over'; } }
  if (dT) g.drawImage(ozTint(dT, o.col || '#ffd23f', o.a || 1), 0, 0);
  return ozCut(out, m); };
// scaled down by halves with smoothing (each step averages 2x2): the fine layer's anti-aliased picture at the screen's resolution
const ozDown = (c, W, H) => { let cur = c; while (cur.width / 2 >= W - 0.5 && cur.height / 2 >= H - 0.5) { const n = ozCanvas(Math.round(cur.width / 2), Math.round(cur.height / 2)), g = n.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(cur, 0, 0, n.width, n.height); cur = n; }
  if (cur.width !== W || cur.height !== H) { const n = ozCanvas(W, H), g = n.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(cur, 0, 0, W, H); cur = n; } return cur; };
const OZ3 = { ss: 4, blue: '#2f8cff', blueGlow: '#58a6ff', green: '#3ee66b', greenGlow: '#3ee66b', tint: 0.3, dim: 0.45, grey: '#aab3be' };
// a menu's elements in the scene: { tile name: element } (the regal's by elList, the chest's aero models by efOrder)
const oz3Scene = (S, st, part, tab) => { const out = {};
  if (part === 'aero') efOrder(S, st).filter(t => t.place === 'top' && /^Aero paket – /.test(t.name)).forEach(q => { const nm = q.name.replace('Aero paket – ', ''), mn = efMenuOf(q), md = q.e && q.e.model;
    // (the user: "Pri maketah naj maska označi samo makete, brez tabel": the mark covers the car model only (AV's model[0]); its sign and padlock
    //  (the rest of model) stay unmarked and are not dimmed: 'keep')
    out[nm] = { kind: 'top', name: q.name, flag: mn.flag, sel: nm, objs: md && md.length ? [md[0]] : q.objs, keep: md && md.length > 1 ? md.slice(1) : [], e: q.e }; });
  else elList(st).filter(e => e.part === part && e.tab === tab).forEach(e => { out[e.sel] = Object.assign({}, e, { kind: 'regal' }); });
  return out; };
// the reading order of the elements on the screen: rows (centres within 0.6 of the taller one's height), top to bottom, each left to right
const oz3Order = (list) => { const L = list.filter(q => q.box).map(q => ({ q, cx: q.box[0] + q.box[2] / 2, cy: q.box[1] + q.box[3] / 2, h: q.box[3] })).sort((a, b) => a.cy - b.cy), rows = [];
  L.forEach(a => { const r = rows.find(r => Math.abs(r.cy - a.cy) < 0.6 * Math.max(r.h, a.h)); if (r) { r.items.push(a); r.cy = r.items.reduce((s, b) => s + b.cy, 0) / r.items.length; r.h = Math.max(r.h, a.h); } else rows.push({ cy: a.cy, h: a.h, items: [a] }); });
  return rows.sort((a, b) => a.cy - b.cy).map(r => r.items.sort((a, b) => a.cx - b.cx).map(a => a.q)); };
const oz3Flag = (box, txt, cardBottom) => oz2Flag(box, txt, cardBottom, OZ3.blue);
const oz3Frame = (which, menu, o) => async () => { try { await oz3Frame0(which, menu, o || {}); } catch (err) { console.error('OZERR oz3 ' + which + ' ' + err.message + ' ' + (err.stack || '').split('\n').slice(0, 3).join(' | ')); } };
// the money badge's coin: a small 3D gold coin with the € sign instead of the letters CR (the user: "daj kovanček namesto CR"; prices are euros)
const OZCOIN = `<svg viewBox="0 0 32 32" width="100%" height="100%" style="display:block"><defs><radialGradient id="ozcF" cx="36%" cy="30%" r="78%"><stop offset="0" stop-color="#fff7c8"/><stop offset=".35" stop-color="#ffd54a"/><stop offset=".78" stop-color="#e0a014"/><stop offset="1" stop-color="#a86c05"/></radialGradient><linearGradient id="ozcR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffeaa6"/><stop offset="1" stop-color="#8a5a06"/></linearGradient></defs>`
  + `<circle cx="16" cy="17.2" r="14.6" fill="#6e4604"/><circle cx="16" cy="16" r="14.6" fill="url(#ozcR)"/><circle cx="16" cy="16" r="12" fill="url(#ozcF)"/><circle cx="16" cy="16" r="12" fill="none" stroke="#b47c0e" stroke-width="1"/>`
  + `<circle cx="16" cy="16" r="8.6" fill="none" stroke="#f7c94a" stroke-width="1.2" opacity=".7"/><circle cx="16" cy="16.6" r="8.6" fill="none" stroke="#a8730a" stroke-width=".8" opacity=".45"/>`   // (the user: "V kovančku naj ne bo narisano nič, samo kovanček": a plain coin, a faint inner ring only)
  + `<ellipse cx="11" cy="9.6" rx="5.2" ry="2.4" fill="#ffffff" opacity=".4" transform="rotate(-32 11 9.6)"/></svg>`;
const oz3Coin = () => { const c = document.querySelector('.g-coin'); if (!c) return false; c.style.background = 'none'; c.style.boxShadow = 'none'; c.style.border = 'none'; c.style.color = 'transparent'; c.innerHTML = OZCOIN; return true; };
const oz3Frame0 = async (which, [part, tab, sel], o = {}) => { const { S, st } = ozScene(); if (o.euro) oz3Coin(); const spec = MN4.menu(part, tab, { sel }); MN4.pics(spec, st);
  const SC = oz3Scene(S, st, part, tab), names = spec.tiles.map(q => q.name), inScene = names.filter(n => SC[n]), tapped = SC[sel]; if (!tapped) { console.error('OZERR no tapped ' + sel); return; }
  if (o.pool && SC[sel] && SC[sel].bay) { const e0 = SC[sel], sc0 = st.regal.secs[e0.bay - 1]; oz2Light(Object.assign({}, e0, { sc: sc0, lv: 'ABCD'.indexOf(e0.storey) }), { pool: true, cone: !!o.cone }); }   // (OZ5: a light pool on the shelf under the tapped one)
  PR.render();
  // the measure: every element of the menu in the scene and the car
  const keepObjs = [].concat(...inScene.map(n => SC[n].keep || [])), items = inScene.map(n => ({ name: n, objs: SC[n].objs })).concat(keepObjs.length ? [{ name: 'table', objs: keepObjs }] : []).concat([{ name: 'avto', objs: ozCarMeshes() }]), keepK = keepObjs.length ? inScene.length : -1, MS = s6Measure(items), M = MS.out, P = MS.all, k = ozK(P), carK = items.length - 1, cv0 = G3.renderer.domElement.getBoundingClientRect();
  inScene.forEach((n, i) => { SC[n].box = M[i].box; SC[n].m = M[i]; SC[n].idx = i; });
  // the tile order: the elements' reading order on the screen, then the tiles with no element in the scene (as the menu has them)
  const rows = oz3Order(inScene.map(n => Object.assign(SC[n], { tile: n }))), order = rows.flat().map(q => q.tile).concat(names.filter(n => !SC[n] || !SC[n].box));
  const dropped = order.filter(n => !(SC[n] && SC[n].box)), order2 = order.filter(n => SC[n] && SC[n].box);   // (the user: "Pri aero in gume naj bodo na voljo samo 3 opcije, tiste, ki so vidne": only the options seen in the scene; the 2x2 card keeps its size, the 4th cell empty)
  spec.tiles = order2.map(n => spec.tiles.find(q => q.name === n)); spec.n = spec.tiles.length; spec.pages = 1; spec.sel = sel; spec.page = 0;
  if (o.tiles) { const n0 = TSETS.length; for (let i = 0; i < 4 * ((o.page || 1) - 1); i++) TSETS.push(TSETS[0].slice());   // (fillers: each page's sets at their own indices: the tyre builder caches by index)
    o.tiles.filter(q => q.tread).forEach(q => TSETS.push([q.name, q.col, q.tread, 0.31, 0.22]));   // (the proposals' pictures: the store's own tyre builder with the set's tread and colour, for the moment)
    spec.tiles = o.tiles.map(q => Object.assign({}, spec.tiles.find(t => t.name === q.name) || {}, q)); spec.n = spec.tiles.length; spec.sel = o.cardSel || sel; try { MN4.pics(spec, st); } finally { TSETS.splice(n0); } }
  if (spec.stock && spec.stock.on) spec.stock = null;   // (the user: "Zbriši serijsko nameščeno.": no '✓ serijsko nameščeno' label; '↺ SERIJSKO' only when a non-stock part is on the car)
  // the marks, SMOOTH (the user: "Zakaj je okvir makete v kockah?"): the masks come from an ID pass rendered OZ3.ss times finer than the
  // screen (ozPassSS), the tints and outlines are built at that resolution round the marked elements only (a region), then scaled down
  // with smoothing (ozDown): the edges get anti-aliased coverage instead of whole on/off pixels. The dimming stays at the screen's
  // resolution (its edge round the elements is soft anyway); the car's cut-out from the fine pass, scaled down (its edge smooth too)
  const ssK = (devicePixelRatio || 1) >= 2 ? 2 : OZ3.ss, PS = ozPassSS(items, ssK), KS = PS.w / cv0.width, dpr = PS.w / ssK / cv0.width;   // (a phone's DPR 2-3: 2x more is enough, and the target stays under the GPU's size limit)
  const bName = SC[spec.sel] && SC[spec.sel].box ? spec.sel : null, iT = bName ? SC[bName].idx : -1, iG = o.green === false ? [] : inScene.filter(n => n !== bName && SC[n].box && (!o.tiles || o.tiles.some(q => q.name === n))).map(n => SC[n].idx), mAll = ozMask(P, (iT >= 0 ? [iT] : []).concat(iG));
  if (bName) { ozBright(SC[bName].objs, SC[bName].kind === 'top' ? 0.08 : 0.2); PR.render(); }
  const dim = ozCanvas(P.w, P.h), g = dim.getContext('2d'); g.fillStyle = `rgba(5,9,18,${o.dim != null ? o.dim : OZ3.dim})`; g.fillRect(0, 0, P.w, P.h);
  ozCut(dim, ozDown(ozMaskR(PS, keepK >= 0 ? [carK, keepK] : carK, [0, 0, PS.w, PS.h]), P.w, P.h));   // (the car and the models' signs: not dimmed) const soft = ozBlur(ozDilate(mAll, 6 * k), 5 * k); ozCut(dim, soft); ozCut(dim, soft);
  const cv = G3.renderer.domElement.getBoundingClientRect(), h = document.querySelector('.g-head'), hb = h ? h.getBoundingClientRect().bottom : 0; if (hb > cv.top) g.clearRect(0, 0, P.w, Math.round((hb - cv.top) * k));
  ozShow(dim, 58);
  const bxs0 = inScene.filter(n => SC[n].box && (n === bName || iG.includes(SC[n].idx))).map(n => SC[n].box), bxs = bxs0.length ? bxs0 : [[0, 0, 1, 1]], mg = 22, rx0 = Math.max(0, Math.floor(Math.min(...bxs.map(b => b[0])) - cv.left - mg)), ry0 = Math.max(0, Math.floor(Math.min(...bxs.map(b => b[1])) - cv.top - mg));
  const rx1 = Math.min(cv.width, Math.ceil(Math.max(...bxs.map(b => b[0] + b[2])) - cv.left + mg)), ry1 = Math.min(cv.height, Math.ceil(Math.max(...bxs.map(b => b[1] + b[3])) - cv.top + mg)), RC = [rx0, ry0, rx1 - rx0, ry1 - ry0];
  const RS = RC.map(v => Math.round(v * KS)), mT = iT >= 0 ? ozMaskR(PS, iT, RS) : null, mG = iG.length ? ozMaskR(PS, iG, RS) : null, lay = ozCanvas(RS[2], RS[3]), lg = lay.getContext('2d');
  const OT = Object.assign({ col: OZ3.green, tintCol: null, tint: OZ3.tint, t: 1.8, glow: 3.5, gcol: OZ3.greenGlow, ga: 0.75, edge: 0.8, ecol: '#0d1626', ea: 0.65 }, o.oth || {});
  if (mG) { if (OT.tint) lg.drawImage(ozTint(mG, OT.tintCol || OT.col, OT.tint), 0, 0); if (OT.t) lg.drawImage(ozContourF(mG, KS, { t: OT.t, col: OT.col, a: OT.a || 1, edge: OT.edge, ecol: OT.ecol, ea: OT.ea, glow: OT.glow, gcol: OT.gcol || OT.col, ga: OT.ga }), 0, 0); }
  const TP = Object.assign({ col: OZ3.blue, glow: OZ3.blueGlow, tintCol: OZ3.blue, tint: OZ3.tint, edge: '#ffffff', t: 2.2, g: 4.5, ga: 0.9, ew: 1 }, o.tap || {});
  if (mT) { if (TP.tint) lg.drawImage(ozTint(mT, TP.tintCol, TP.tint), 0, 0); lg.drawImage(ozContourF(mT, KS, { t: TP.t, col: TP.col, edge: TP.ew, ecol: TP.edge, ea: 0.9, glow: TP.g, gcol: TP.glow, ga: TP.ga }), 0, 0); }
  const fin = ozDown(lay, Math.round(RC[2] * dpr), Math.round(RC[3] * dpr)); fin.style.cssText = `position:fixed;left:${cv.left + RC[0]}px;top:${cv.top + RC[1]}px;width:${RC[2]}px;height:${RC[3]}px;z-index:59;pointer-events:none`; fin.className = 'qov'; if (bxs0.length) document.body.appendChild(fin);
  const ssInfo = { ss: ssK, pass: [PS.w, PS.h], region: RC, regionSS: [RS[2], RS[3]] };
  // the card: the tiles' frames (blue: the tapped; green: the other elements in the scene; grey: no element in the scene)
  const C = MN4.card(spec, { top: 68, layout: '2x2', cr: 11500, detail: o.detail || null, detailAt: 'end' }), grid = C.d.children[1], tiles = [];
  C.four.forEach((n, i) => { const t = grid.children[i]; if (!t) return; const kind = n === spec.sel ? 'blue' : SC[n] && SC[n].box && o.green !== false ? 'green' : o.tiles ? 'plain' : 'grey', col = kind === 'blue' && o.tap ? o.tap.col : kind === 'green' && o.oth ? (o.oth.cardCol || o.oth.col) : OZ3[kind] || '#d5dbe3', q = spec.tiles.find(x => x.name === n) || {};
    if (q.owned && t.children[1] && t.children[1].lastElementChild) t.children[1].lastElementChild.insertAdjacentHTML('beforeend', ' <span style="color:#16a34a">✓ nameščene</span>');
    if (q.old && t.children[1] && t.children[1].lastElementChild) { t.children[1].lastElementChild.innerHTML = `<s style="color:#8a94a3;font-weight:700;font-size:9.6px">${q.old}</s> <span style="color:#0d1626">${q.price}</span>`; if (q.cut) t.children[0].insertAdjacentHTML('beforeend', `<span style="position:absolute;left:0;top:0;background:#e5484d;color:#fff;font-size:9.5px;font-weight:900;border-radius:5px;padding:1px 4px;line-height:1.15;box-shadow:0 1px 2px rgba(0,0,0,.3)">${q.cut}</span>`); }
    if (kind === 'plain') { const r = t.getBoundingClientRect(); tiles.push({ n, kind, rect: [ozF(r.left), ozF(r.top), ozF(r.width), ozF(r.height)] }); return; }
    const tc = kind === 'blue' && o.tap ? o.tap.tintCol : col; t.style.background = kind === 'grey' ? '#eef1f5' : `linear-gradient(0deg,${oz2Rgba(tc, kind === 'blue' ? 0.14 : 0.1)},${oz2Rgba(tc, kind === 'blue' ? 0.14 : 0.1)}),#ffffff`;   // (OZ4: the tapped tile in the tapped element's own look)
    t.style.boxShadow = (kind === 'blue' ? `inset 0 0 0 2.5px ${col},0 0 0 1.5px ${col},0 0 8px 2px ${oz2Rgba(o.tap ? o.tap.glow : OZ3.blueGlow, 0.8)}` : kind === 'green' ? (o.oth ? `inset 0 0 0 1.5px ${oz2Rgba(col, 0.85)}` : `inset 0 0 0 2px ${col}`) : `inset 0 0 0 1.5px ${col}`) + ',0 1px 0 rgba(13,22,38,.10),0 3px 7px rgba(13,22,38,.18)';   // (the tiles raised: the card's drop shadow too)
    const r = t.getBoundingClientRect(); tiles.push({ n, kind, rect: [ozF(r.left), ozF(r.top), ozF(r.width), ozF(r.height)], locked: !!(spec.tiles.find(q => q.name === n) || {}).locked }); });
  // (the card rule: never over the car nor over the marked elements: when the card at the top would reach the marked elements (a taller card
  //  with the detail box and parts high on the regal), it opens at the BOTTOM of the screen instead (over the front chest, clear of the car))
  const mk = inScene.filter(n => SC[n].box).map(n => SC[n].box), mkTop = Math.min(...mk.map(b => b[1])), mkBot = Math.max(...mk.map(b => b[1] + b[3]));
  let cardAt = 'top'; { const r0 = C.d.getBoundingClientRect(); if (r0.bottom + 8 > mkTop) { C.d.style.top = Math.round(innerHeight - 8 - r0.height) + 'px'; cardAt = 'bottom'; } }
  if (o.head) { const hd = C.d.children[0]; hd.style.height = '24px'; hd.innerHTML = o.head(spec); }
  const cr = C.d.getBoundingClientRect(), fl = null, car = efCarBox(), gp = efGap(C.d, car);   // (the user: "Zbriši okvirček, kjer piše MOTOR – TURBO.": no name flag; the card names the part)
  const fr = C.d.lastElementChild ? C.d.lastElementChild.getBoundingClientRect() : null, dbx = C.d.querySelector('.mn4-detail'), dr = dbx ? dbx.getBoundingClientRect() : null;
  const rec = { oz5: o.oz5 || null, detail: dr ? [ozF(dr.left), ozF(dr.top), ozF(dr.width), ozF(dr.height)] : null, page: o.page || null, pageTitle: o.title || null, pageTiles: o.tiles ? o.tiles.map(q => ({ ime: q.name, cena: q.price, stara_cena: q.old || null, popust: q.cut || null, kaj_nudi: q.effect || (spec.tiles.find(x => x.name === q.name) || {}).effect || null, ocena: !!q.ocena, na_regalu: !!(SC[q.name] && SC[q.name].box) })) : null, foot: fr ? [ozF(fr.left), ozF(fr.top), ozF(fr.width), ozF(fr.height)] : null, ss: ssInfo, dropped, el: which, sel, menu: spec.title + (tab ? ' › ' + tab : ''), order: order2, rows: rows.map(r => r.map(q => q.tile)), tiles, els: inScene.map(n => ({ n, box: SC[n].box, share: SC[n].m.share, px: SC[n].m.px, kind: n === sel ? 'blue' : 'green' })),
    card: [ozF(cr.left), ozF(cr.top), ozF(cr.width), ozF(cr.height)], cardBottom: ozF(cr.bottom), flag: fl, gapCar: gp.gap, carSil: car ? car.box : null,
    cardAt, gapEl: cardAt === 'top' ? ozF(mkTop - cr.bottom) : ozF(cr.top - mkBot) };
  console.error('OZ3REC ' + JSON.stringify(rec)); };
// the game's own buttons (garaza.html's footer: .g-btn-back and .g-btn-go, with the game's own CSS), shown over the scene for the comparison
const oz3GameBtns = async () => { ozScene(); PR.render(); const f = document.querySelector('.g-foot'); if (!f) { console.error('OZERR no .g-foot'); return; }
  const c = f.cloneNode(true); c.className = 'g-foot qov'; c.style.cssText = 'position:fixed;left:0;right:0;top:400px;z-index:90;background:#0d1626;box-shadow:0 0 0 2px #1f2d44'; document.body.appendChild(c); c.style.setProperty('display', 'flex', 'important'); c.style.setProperty('visibility', 'visible', 'important'); [...c.children].forEach(q => { q.style.setProperty('display', 'grid', 'important'); q.style.setProperty('visibility', 'visible', 'important'); });
  const r = c.getBoundingClientRect(), b = [...c.children].map(q => { const z = q.getBoundingClientRect(); return [q.className, ozF(z.left), ozF(z.top), ozF(z.width), ozF(z.height), q.textContent.trim()]; });
  console.error('OZ3BTN ' + JSON.stringify({ rect: [ozF(r.left), ozF(r.top), ozF(r.width), ozF(r.height)], b, font: getComputedStyle(c.children[1]).font })); };
// ---- THE TYRES CARD IN PAGES (the user: "Meni gume ima sedaj poleg imena še kategoriji Gume in Dim gum. Zbriši vse 3 besede in naj piše GUME
//      V AKCIJI in puščica, da lahko greš na naslednjo stran. Na naslednji strani pa so že srednje športne, nato profesionalne, in gredo od
//      najcenejše do najdražje."): no title, no tabs (the tyre smoke keeps its own menu); the head: the page's name and the arrows; page 1 the
//      three sets on the regal on sale (the old price struck through), pages 2 and 3 PROPOSED sets (not on the regal: they would come with the
//      delivery cart like the aero kits; prices and stat lines an estimate, 'ocena'); every page cheapest first ----
const OZTP = window.OZTP_DATA || [];   // (O/tyre_pages_data.js, made from P/out/cene/gume.json by O/tyre_data.py)
// the head: [‹] the page's name [›] (the game's small grey square buttons), the page dots, the time
const oz3PBtn = (a) => `<span style="flex:0 0 auto;width:24px;height:22px;box-sizing:border-box;border-radius:7px;display:grid;place-items:center;color:#fff;background:linear-gradient(180deg,#5d636d,#454a53);border:1.5px solid #8d939d;box-shadow:0 2px 0 #262a31"><svg viewBox="0 0 24 24" width="14" height="14" style="display:block"><path d="${a === '‹' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;
const oz3PHead = (pg) => (spec) => `<span style="display:flex;align-items:center;gap:7px;width:100%;white-space:nowrap">${pg > 1 ? oz3PBtn('‹') : ''}<b style="font-size:14.5px;font-style:italic;letter-spacing:.02em">${OZTP[pg - 1].title}</b>${pg < OZTP.length ? oz3PBtn('›') : ''}<span style="flex:1"></span>`
  + `<span style="display:inline-flex;gap:4px;align-items:center;margin-right:4px">${OZTP.map((_, i) => `<i style="display:block;width:${i === pg - 1 ? 14 : 6}px;height:6px;border-radius:3px;background:${i === pg - 1 ? '#47c6ff' : '#c8d2e0'}"></i>`).join('')}</span>`
  + `</span>`;   // (the user: "Zbriši zgoraj desno 9 s": no time label)
const oz3TyrePage = (pg) => { const P0 = OZTP[pg - 1] || { title: '?', tiles: [] }, hasT = P0.tiles.some(q => q.name === 'Dirkališče');   // (the tapped TRACK's page: Dirkališče selected; another page: its cheapest, the card's own default)
  return oz3Frame('TRACK', ['tyres', 'Gume', 'Dirkališče'], { page: pg, title: P0.title, tiles: P0.tiles, cardSel: hasT ? 'Dirkališče' : (P0.tiles[0] || {}).name, green: true, euro: true, head: oz3PHead(pg) }); };
// ---- THE HEADER (the user: "Namesto GARAŽA naj piše NAZAJ, spodaj namesto TVOJ AVTO pa naj piše IZBERI PROGO. Spremeni, da ni napis v beli
//      barvi, ker sedaj ni dobro viden."): three looks of the title next to the back arrow, the first view, the plain gold coin in the badge ----
const OZHEAD = {
  a: { h1: 'color:#ffd23f;-webkit-text-stroke:1.6px #0d1626;paint-order:stroke fill;text-shadow:0 3px 0 rgba(13,22,38,.9)', p: 'color:#ffe48a;-webkit-text-stroke:.8px #0d1626;paint-order:stroke fill;text-shadow:0 1px 0 #0d1626,0 0 3px rgba(13,22,38,.95)', box: '' },
  b: { h1: 'color:#0d1626;text-shadow:none', p: 'color:#46536a;text-shadow:none;overflow:visible', box: 'flex:0 0 auto;background:#ffffff;border-radius:12px;padding:6px 12px 6px;box-shadow:0 3px 0 rgba(13,22,38,.35),0 5px 12px rgba(0,0,0,.35)' },
  c: { h1: 'color:#ffffff;text-shadow:0 2px 0 rgba(0,0,0,.45)', p: 'color:#d6deeb;text-shadow:none;overflow:visible', box: 'flex:0 0 auto;background:#16245a;border-radius:10px;border-bottom:3px solid #ffd23f;padding:6px 12px 4px;box-shadow:0 4px 12px rgba(0,0,0,.4)' } };
const oz3Glava = (v) => async () => { ozScene(); oz3Coin(); for (let i = 0; i < 6; i++) { __garage.advance(1); PR.render(); }   // (the camera eases to the first view over time: let it arrive)
  const t = document.querySelector('.g-title'), h1 = t && t.querySelector('h1'), p = t && t.querySelector('p'); if (!t) { console.error('OZERR no .g-title'); return; }
  h1.textContent = 'NAZAJ'; p.textContent = 'IZBERI PROGO'; const V0 = OZHEAD[v]; h1.style.cssText += ';' + V0.h1; p.style.cssText += ';' + V0.p; if (V0.box) t.style.cssText += ';' + V0.box;
  const hd = document.querySelector('.g-head').getBoundingClientRect(), r = t.getBoundingClientRect(); console.error('OZ3HEAD ' + JSON.stringify({ v, head: [ozF(hd.left), ozF(hd.top), ozF(hd.width), ozF(hd.height)], title: [ozF(r.left), ozF(r.top), ozF(r.width), ozF(r.height)] })); };
// ---- OZ5: NINE ORANGE VERSIONS (TURBO tap; the others of the Motor menu weaker) ----
const OZ5C = { or: '#ff8a1a', orG: '#ff7a00', amber: '#ffbf1f', peach: '#ffb48a', coral: '#ff6a4d' };
const OZ5V = [
  { nr: 1, tap: { col: OZ5C.or, glow: OZ5C.orG, tintCol: OZ5C.or, tint: 0.6, edge: '#0d1626' }, oth: { col: OZ5C.or, tint: 0.3, t: 1.6, glow: 2.5, gcol: OZ5C.orG, ga: 0.55 } },
  { nr: 2, tap: { col: OZ5C.or, glow: OZ5C.orG, tintCol: OZ5C.or, tint: 0.5, edge: '#0d1626' }, oth: { col: OZ5C.or, tint: 0.2, t: 1.4, glow: 2, gcol: OZ5C.orG, ga: 0.45 } },
  { nr: 3, tap: { col: OZ5C.or, glow: OZ5C.orG, tintCol: OZ5C.or, tint: 0.4, edge: '#0d1626', t: 3.2, ew: 1.2 }, oth: { col: OZ5C.or, tint: 0.15, t: 0.9, glow: 0, edge: 0.6, ea: 0.5 } },
  { nr: 4, tap: { col: OZ5C.or, glow: OZ5C.orG, tintCol: OZ5C.or, tint: 0.5, edge: '#0d1626' }, oth: { col: OZ5C.amber, tint: 0.25, t: 1.5, glow: 2.5, ga: 0.5 } },
  { nr: 5, tap: { col: OZ5C.or, glow: OZ5C.orG, tintCol: OZ5C.or, tint: 0.5, edge: '#0d1626' }, oth: { col: OZ5C.peach, tint: 0.25, t: 1.5, glow: 2.5, ga: 0.5 } },
  { nr: 6, tap: { col: OZ5C.or, glow: OZ5C.orG, tintCol: OZ5C.or, tint: 0.5, edge: '#0d1626' }, oth: { col: OZ5C.coral, tint: 0.25, t: 1.5, glow: 2.5, ga: 0.5 } },
  // (mine) 7: the tapped one a 40 % tint, a thick orange line and a WHITE outer hairline (crisp on the dark shelf); the others only a thin orange line, no tint
  { nr: 7, tap: { col: OZ5C.or, glow: OZ5C.orG, tintCol: OZ5C.or, tint: 0.4, edge: '#ffffff', t: 2.6, ew: 1.1, g: 3.5 }, oth: { col: OZ5C.or, tint: 0, t: 1.3, glow: 0, edge: 0.6, ea: 0.6 } },
  // 8: the tapped one a 40 % tint with a wide soft orange halo (it glows); the others a 12 % amber tint and a thin amber line, no halo
  { nr: 8, tap: { col: OZ5C.or, glow: OZ5C.orG, tintCol: OZ5C.or, tint: 0.4, edge: '#0d1626', t: 1.8, g: 9, ga: 1 }, oth: { col: OZ5C.amber, tint: 0.12, t: 1, glow: 0, edge: 0.5, ea: 0.5 } },
  // 9: the tapped one a 35 % tint, an orange line and a warm light pool on the shelf under it; the others a faint 18 % peach tint and a thin peach line
  { nr: 9, pool: true, tap: { col: OZ5C.or, glow: OZ5C.orG, tintCol: OZ5C.or, tint: 0.35, edge: '#0d1626', t: 2.2 }, oth: { col: OZ5C.peach, tint: 0.18, t: 1, glow: 0, edge: 0.5, ea: 0.5 } }];
// ---- OZ6: the tapped one GREEN, the other three blue / teal / a white veil (the user: "da je označen element zelen, ostali 3 pa modri ali pa zelenomodri ali pa prosojni") ----
const OZ6C = { gr: '#36e06a', grG: '#22c55e', blue: '#3b8cff', teal: '#22d3c5' }, OZ6TAP = { col: OZ6C.gr, glow: OZ6C.grG, tintCol: OZ6C.gr, tint: 0.4, edge: '#0d1626', t: 2.4 };
const OZ6V = [
  { nr: 1, oth: { col: OZ6C.blue, tint: 0.25, t: 1.4, glow: 2, ga: 0.5 } },
  { nr: 2, oth: { col: OZ6C.blue, tint: 0, t: 1.5, glow: 0, edge: 0.6, ea: 0.6 } },
  { nr: 3, oth: { col: OZ6C.teal, tint: 0.25, t: 1.4, glow: 2, ga: 0.5 } },
  { nr: 4, oth: { col: OZ6C.teal, tint: 0, t: 1.5, glow: 0, edge: 0.6, ea: 0.6 } },
  { nr: 5, oth: { col: '#ffffff', cardCol: '#aeb8c6', tint: 0.24, t: 0, glow: 0 } },
  // (mine) 6: a white veil (they stand out of the dimmed shelf a little) and a thin teal line: the tapped green one is still the only coloured fill
  { nr: 6, oth: { col: OZ6C.teal, tintCol: '#ffffff', tint: 0.16, t: 1.1, glow: 0, edge: 0.5, ea: 0.55 } }];
// ---- the cards' HTML (with their pictures as data URLs) for the card-only chart boards: each menu's card, the selected option set ----
const oz3CardsOut = async () => { const { st } = ozScene(); oz3Coin(); PR.render(); const out = {};
  [['aero', 'Paket', 'Športni', 'sport'], ['hood', 'Motor', 'Turbo', 'turbo'], ['hood', 'Motor', 'Lahek akumulator', 'batt'], ['hood', 'Motor', 'Čip', 'chip'], ['brakes', 'Zaviranje', null, 'brakes'], ['tyres', 'Gume', 'Dirkališče', 'tyres']].forEach(([p, t, sel, key]) => {
    try { const spec = MN4.menu(p, t, sel ? { sel } : {}); MN4.pics(spec, st); if (spec.stock && spec.stock.on) spec.stock = null; if (p === 'aero') { spec.tiles = spec.tiles.filter(q => q.name !== 'Paket GT'); spec.n = spec.tiles.length; }
      const C = MN4.card(spec, { top: 68, layout: '2x2', cr: 11500 }); out[key] = { html: C.d.outerHTML, sel: C.sel, four: C.four, tiles: spec.tiles.map(q => ({ name: q.name, effect: q.effect, price: q.price })), title: spec.title, all: (MN4 && (window.MENUS.parts.find(x => x.id === p) || {}).options || []).filter(q => !t || !q.tab || q.tab === t).map(q => ({ name: q.name, effect: q.effect, price: q.price })) }; C.d.remove(); }
    catch (err) { console.error('OZERR card ' + key + ' ' + err.message); } });
  const badge = document.querySelector('.g-cr'); out._badge = badge ? badge.outerHTML : ''; out._css = [...document.styleSheets].map(ss => { try { return [...ss.cssRules].map(r => r.cssText).join('\n'); } catch (e) { return ''; } }).join('\n').length;
  window.HQ_FILES['cards.json'] = { text: JSON.stringify(out) }; console.error('OZCARDS ' + Object.keys(out).join(',')); };
// ---- OZ7: the tapped (main) element GREEN, the other three ORANGE (the user: "OZ5: glavni element naj bo zelen, ostali trije pa oranžni.") ----
const OZ7G = { col: '#36e06a', glow: '#22c55e' }, OZ7O = { col: '#ff8a1a', glow: '#ff7a00' };
const OZ7V = [
  { nr: 1, tap: { col: OZ7G.col, glow: OZ7G.glow, tintCol: OZ7G.col, tint: 0.5, edge: '#0d1626' }, oth: { col: OZ7O.col, tint: 0.2, t: 1.5, glow: 2.5, gcol: OZ7O.glow, ga: 0.5 } },
  { nr: 2, tap: { col: OZ7G.col, glow: OZ7G.glow, tintCol: OZ7G.col, tint: 0.25, edge: '#ffffff', t: 2.6, ew: 1.1, g: 3.5 }, oth: { col: OZ7O.col, tint: 0, t: 1.3, glow: 0, edge: 0.6, ea: 0.6 } },
  { nr: 3, tap: { col: OZ7G.col, glow: OZ7G.glow, tintCol: OZ7G.col, tint: 0.4, edge: '#0d1626', t: 3.2, ew: 1.2 }, oth: { col: OZ7O.col, tint: 0.15, t: 0.9, glow: 0, edge: 0.6, ea: 0.5 } }];
const OZ3FR = [['OZ3 TURBO', oz3Frame('TURBO', ['hood', 'Motor', 'Turbo'])], ['OZ3 TRACK', oz3Frame('TRACK', ['tyres', 'Gume', 'Dirkališče'])], ['OZ3 SPORT', oz3Frame('SPORT', ['aero', 'Paket', 'Športni'])], ['OZ3 gumbi igre', oz3GameBtns], ...OZ7V.map(V0 => ['OZ7 v' + V0.nr, oz3Frame('TURBO', ['hood', 'Motor', 'Turbo'], { dim: 0.58, euro: true, tap: V0.tap, oth: V0.oth, oz5: 700 + V0.nr, detail: { now: 'Serijski motor' } })]), ['OZ3 karte', oz3CardsOut], ...OZ5V.map(V0 => ['OZ5 v' + V0.nr, oz3Frame('TURBO', ['hood', 'Motor', 'Turbo'], { dim: 0.58, euro: true, tap: V0.tap, oth: V0.oth, pool: !!V0.pool, oz5: V0.nr })]), ...OZ6V.map(V0 => ['OZ6 v' + V0.nr, oz3Frame('TURBO', ['hood', 'Motor', 'Turbo'], { dim: 0.58, euro: true, tap: OZ6TAP, oth: V0.oth, oz5: 100 + V0.nr })]), ['OZ4 A', oz3Frame('TURBO', ['hood', 'Motor', 'Turbo'], { dim: 0.58, euro: true, tap: { col: '#ffa23a', glow: '#ff8a1a', tintCol: OZ3.blue, tint: 0.3, edge: '#0d1626' } })], ['OZ4 B', oz3Frame('TURBO', ['hood', 'Motor', 'Turbo'], { dim: 0.58, euro: true, tap: { col: '#ffa23a', glow: '#ff8a1a', tintCol: '#ffa23a', tint: 0.3, edge: '#0d1626' } })], ['OZ3 SPORT detajl', oz3Frame('SPORT', ['aero', 'Paket', 'Športni'], { detail: { now: 'Serijski', prev: 'Cestni' }, euro: true })], ['OZ3 glava a', oz3Glava('a')], ['OZ3 glava b', oz3Glava('b')], ['OZ3 glava c', oz3Glava('c')], ...(() => { const k = Math.max(0, OZTP.findIndex(p => p.tiles.some(q => q.name === 'Dirkališče'))), ord = [k].concat(OZTP.map((_, i) => i).filter(i => i !== k)); return ord.map(i => ['OZ3 gume stran ' + (i + 1), oz3TyrePage(i + 1)]); })()];
window.CONCEPT_E = { title: 'OZ3: kliknjeni element moder, ostale možnosti menija zelene', frames: OZ3FR.map(([n, fn, o]) => Object.assign(FRX(n, 'TVOJ AVTO', fn), o || {})) };
