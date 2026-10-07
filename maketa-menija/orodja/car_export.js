// Runs inside the game page (headless, mockup only): builds each showroom car in every player colour and exports its meshes
// (geometry, materials, textures) as plain data, so the standalone menu mockup can draw the same car with three.js.
window.CAREXP = (function () {
  const scenes = new Set();
  const orig = THREE.Scene.prototype.add;
  THREE.Scene.prototype.add = function () { scenes.add(this); return orig.apply(this, arguments); };
  const showScene = () => { for (const s of scenes) if (s.background && s.background.getHex && s.background.getHex() === 0x10151d) return s; return null; };
  const b64 = (ta) => { const u = new Uint8Array(ta.buffer, ta.byteOffset, ta.byteLength); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
  function texData(t, texs) {
    if (!t || !t.image) return null;
    const key = t.uuid;
    if (!texs[key]) {
      const img = t.image, c = document.createElement('canvas');
      c.width = img.width; c.height = img.height; c.getContext('2d').drawImage(img, 0, 0);
      texs[key] = { url: c.toDataURL('image/png'), flipY: t.flipY, wrapS: t.wrapS, wrapT: t.wrapT, repeat: [t.repeat.x, t.repeat.y], offset: [t.offset.x, t.offset.y] };
    }
    return key;
  }
  function matData(m, texs) {
    const o = { type: m.type, vc: !!m.vertexColors, tr: !!m.transparent, op: m.opacity, dw: m.depthWrite, side: m.side, at: m.alphaTest || 0 };
    if (m.color) o.color = m.color.getHex();
    if (m.specular) o.spec = m.specular.getHex();
    if (m.shininess != null) o.shin = m.shininess;
    if (m.emissive) o.emi = m.emissive.getHex();
    if (m.map) o.map = texData(m.map, texs);
    if (m.polygonOffset) o.po = [m.polygonOffsetFactor, m.polygonOffsetUnits];
    if (m.blending !== THREE.NormalBlending) o.blend = m.blending;
    return o;
  }
  // every visible mesh under grp, its transform baked into the geometry (relative to grp); instanced meshes expanded
  function extract(grp, texs) {
    grp.rotation.set(0, 0, 0); grp.position.set(0, 0, 0); grp.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(grp.matrixWorld).invert(), out = [];
    grp.traverse(o => {
      if (!o.isMesh) return;
      for (let q = o; q && q !== grp; q = q.parent) if (!q.visible) return;
      const rel = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld);
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      const inst = o.isInstancedMesh ? o.count : 1;
      for (let k = 0; k < inst; k++) {
        let g = o.geometry.clone();
        const m = rel.clone();
        if (o.isInstancedMesh) { const im = new THREE.Matrix4(); o.getMatrixAt(k, im); m.multiply(im); }
        g.applyMatrix4(m);
        const a = g.attributes, e = { name: o.name || '', ro: o.renderOrder || 0, mats: mats.map(x => matData(x, texs)) };
        e.pos = Array.from(a.position.array, v => Math.round(v * 1e4) / 1e4);
        if (a.normal) e.nrm = Array.from(a.normal.array, v => Math.round(v * 127));
        if (a.color) e.col = Array.from(a.color.array, v => Math.round(Math.min(1, Math.max(0, v)) * 255));
        if (a.uv) e.uv = Array.from(a.uv.array, v => Math.round(v * 1e4) / 1e4);
        if (g.index) e.idx = Array.from(g.index.array);
        if (g.groups && g.groups.length) e.groups = g.groups.map(gr => [gr.start, gr.count, gr.materialIndex]);
        out.push(e);
        g.dispose();
      }
    });
    return out;
  }
  function build(M, color, num) {
    Render.setShowCar(M, color, num);
    const sc = showScene(); if (!sc) throw new Error('no showroom');
    const cars = sc.children.filter(c => c.isGroup);
    return cars[cars.length - 1];
  }
  // one car: the base colour fully, the other colours as the vertex/material colours that differ from it
  function exportCar(mi, palette, num) {
    const g = window.__game; g.S.car = mi; g.onAction('to-car');
    const M = Core.MODELS[mi], texs = {};
    const base = extract(build(M, palette[0], num), texs);
    const variants = [null];
    for (let ci = 1; ci < palette.length; ci++) {
      const v = extract(build(M, palette[ci], num), texs), diff = {};
      if (v.length !== base.length) { variants.push({ full: v }); continue; }
      v.forEach((e, i) => {
        const b = base[i], d = {};
        if (e.col && b.col && e.col.length === b.col.length) {
          const ch = [];
          for (let j = 0; j < e.col.length; j += 3) if (e.col[j] !== b.col[j] || e.col[j + 1] !== b.col[j + 1] || e.col[j + 2] !== b.col[j + 2]) ch.push(j / 3, e.col[j], e.col[j + 1], e.col[j + 2]);
          if (ch.length) d.col = ch;
        } else if (e.col || b.col) d.colFull = e.col;
        const mc = e.mats.map((m, k) => (m.color !== b.mats[k].color || m.map !== b.mats[k].map) ? { color: m.color, map: m.map } : null);
        if (mc.some(x => x)) d.mats = mc;
        if (Object.keys(d).length) diff[i] = d;
      });
      variants.push(diff);
    }
    const box = new THREE.Box3();
    for (const e of base) for (let j = 0; j < e.pos.length; j += 3) box.expandByPoint(new THREE.Vector3(e.pos[j], e.pos[j + 1], e.pos[j + 2]));
    return { id: M.id, name: M.name, drive: M.drive, meshes: base, textures: texs, variants, box: [box.min.toArray(), box.max.toArray()] };
  }
  return { exportCar, b64 };
})();
