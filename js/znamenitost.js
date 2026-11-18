/* =========================================================================
   ZNAMENITOST — the landmarks by the road made in Blender (assets/landmarks/<id>.glb and its far level <id>-far.glb, written by
   tools/znamenitost/; docs/proge/<id>.md). A world file builds its own simpler landmark first (the fallback, one mesh in its root) and calls
     World.znamenitost.add(id, root, { x, z, fallback, out, far })
   which fetches the two files, reads them (glTF 2.0 binary: positions, normals, the materials' base colours; no textures) into one mesh each,
   puts them in a THREE.LOD at (x, 0, z) (the models' heights are metres above the sea, as the track's) and, once both are read, swaps the
   fallback for them. If a file is missing or cannot be read, or the world has been rebuilt in the meantime, the fallback stays.
   Each model is one draw call in the game (its primitives merged), with the world's vertex-colour Lambert material.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined') return;
  const FAR = 420;   // (m: where the far level takes over)
  const CT = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array }, NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };

  // a .glb (ArrayBuffer) -> { pos, nor, col, idx } merged over all the scene's nodes (their transforms applied), or throws
  function parse(buf) {
    const dv = new DataView(buf);
    if (dv.getUint32(0, true) !== 0x46546C67 || dv.getUint32(4, true) !== 2) throw new Error('not a glTF 2.0 binary');
    let json = null, bin = null;
    for (let o = 12; o + 8 <= buf.byteLength;) {
      const len = dv.getUint32(o, true), type = dv.getUint32(o + 4, true);
      if (type === 0x4E4F534A) json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, o + 8, len)));
      else if (type === 0x004E4942) bin = buf.slice(o + 8, o + 8 + len);
      o += 8 + len;
    }
    if (!json || !bin) throw new Error('no JSON or BIN chunk');
    const acc = (k) => {
      const a = json.accessors[k], v = json.bufferViews[a.bufferView], T = CT[a.componentType], n = NC[a.type], st = v.byteStride || 0, off = (v.byteOffset || 0) + (a.byteOffset || 0);
      if (!st || st === n * T.BYTES_PER_ELEMENT) return { n, a: new T(bin, off, a.count * n), norm: !!a.normalized, ct: a.componentType };
      const out = new T(a.count * n), src = new DataView(bin), get = { 5126: 'getFloat32', 5125: 'getUint32', 5123: 'getUint16', 5121: 'getUint8', 5122: 'getInt16', 5120: 'getInt8' }[a.componentType];
      for (let i = 0; i < a.count; i++) for (let c = 0; c < n; c++) out[i * n + c] = src[get](off + i * st + c * T.BYTES_PER_ELEMENT, true);
      return { n, a: out, norm: !!a.normalized, ct: a.componentType };
    };
    const P = [], Nn = [], C = [], I = [], m4 = new THREE.Matrix4(), nm = new THREE.Matrix3(), v = new THREE.Vector3();
    const walk = (ni, parent) => {
      const nd = json.nodes[ni], M = new THREE.Matrix4();
      if (nd.matrix) M.fromArray(nd.matrix);
      else M.compose(new THREE.Vector3().fromArray(nd.translation || [0, 0, 0]), new THREE.Quaternion().fromArray(nd.rotation || [0, 0, 0, 1]), new THREE.Vector3().fromArray(nd.scale || [1, 1, 1]));
      const W = new THREE.Matrix4().multiplyMatrices(parent, M);
      if (nd.mesh !== undefined) {
        nm.getNormalMatrix(W);
        for (const pr of json.meshes[nd.mesh].primitives) {
          if ((pr.mode !== undefined && pr.mode !== 4) || pr.attributes.POSITION === undefined) continue;
          const pa = acc(pr.attributes.POSITION), na = pr.attributes.NORMAL !== undefined ? acc(pr.attributes.NORMAL) : null, ca = pr.attributes.COLOR_0 !== undefined ? acc(pr.attributes.COLOR_0) : null;
          const mat = pr.material !== undefined ? json.materials[pr.material] : null, bc = (mat && mat.pbrMetallicRoughness && mat.pbrMetallicRoughness.baseColorFactor) || [1, 1, 1, 1];
          const sc = ca && ca.norm ? (ca.ct === 5121 ? 255 : 65535) : 1, base = P.length / 3, cnt = pa.a.length / 3;
          for (let i = 0; i < cnt; i++) {
            v.set(pa.a[i * 3], pa.a[i * 3 + 1], pa.a[i * 3 + 2]).applyMatrix4(W); P.push(v.x, v.y, v.z);
            if (na) { v.set(na.a[i * 3], na.a[i * 3 + 1], na.a[i * 3 + 2]).applyMatrix3(nm).normalize(); Nn.push(v.x, v.y, v.z); } else Nn.push(0, 1, 0);
            const k = ca ? ca.n : 0; C.push(bc[0] * (ca ? ca.a[i * k] / sc : 1), bc[1] * (ca ? ca.a[i * k + 1] / sc : 1), bc[2] * (ca ? ca.a[i * k + 2] / sc : 1));
          }
          if (pr.indices !== undefined) { const ia = acc(pr.indices).a; for (let i = 0; i < ia.length; i++) I.push(base + ia[i]); }
          else for (let i = 0; i < cnt; i++) I.push(base + i);
        }
      }
      for (const c of nd.children || []) walk(c, W);
    };
    const scn = json.scenes[json.scene || 0];
    for (const r of scn.nodes) walk(r, m4.identity().clone());
    if (!P.length) throw new Error('no triangles');
    return { pos: new Float32Array(P), nor: new Float32Array(Nn), col: new Float32Array(C), idx: P.length / 3 > 65535 ? new Uint32Array(I) : new Uint16Array(I) };
  }
  function geometry(m) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(m.pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(m.nor, 3)); g.setAttribute('color', new THREE.BufferAttribute(m.col, 3));
    g.setIndex(new THREE.BufferAttribute(m.idx, 1)); g.computeBoundingSphere(); return g;
  }
  const get = (url) => fetch(url).then(r => { if (!r.ok) throw new Error(url + ': ' + r.status); return r.arrayBuffer(); });

  let mat = null;
  World.znamenitost = {
    parse,   // (the tests)
    add(id, root, o) {
      if (typeof fetch === 'undefined') return Promise.resolve(false);
      const base = 'assets/landmarks/' + id;
      const p = Promise.all([get(base + '.glb'), get(base + '-far.glb')]).then(([a, b]) => {
        if (!root.parent) return false;   // (the world was rebuilt meanwhile)
        mat = mat || new THREE.MeshLambertMaterial({ vertexColors: true });
        const near = new THREE.Mesh(geometry(parse(a)), mat), far = new THREE.Mesh(geometry(parse(b)), mat);
        near.castShadow = near.receiveShadow = true; far.receiveShadow = true;
        const lod = new THREE.LOD(); lod.addLevel(near, 0); lod.addLevel(far, o.far || FAR);   // (o.far: a landmark wider than ~400 m, the road round it farther than FAR from its middle) lod.position.set(o.x, 0, o.z); lod.updateMatrixWorld(true);
        lod.name = 'znamenitost:' + id; root.add(lod);
        const fb = o.fallback; if (fb && fb.parent) { fb.parent.remove(fb); fb.geometry.dispose(); }
        if (o.out) o.out.landmark = lod;
        return true;
      }).catch((e) => { if (typeof console !== 'undefined') console.warn('znamenitost ' + id + ':', e.message); return false; });
      if (o.out) o.out.landmarkLoad = p;
      return p;
    }
  };
})();
