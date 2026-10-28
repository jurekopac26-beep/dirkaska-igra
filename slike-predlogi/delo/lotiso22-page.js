(() => {
  // (pictures only) 22. 10.: from the game's iso and chase cameras the lots looked green: the pictures' detailed grass (grass-page and the heliport's
  // meadow sheet n10193, polygonOffset -2)
  // lies 3 cm under the lots' paving (-1) and wins where the camera looks across them; from above the paving wins. The grass is cut where the
  // paving is (the lots' mesh, the heliport lot made in hl22, ln21's two extensions): a mask 4 px a metre, a discard in the grass's shaders
  // ; window.__LOTISO report
  const out = {}, X0 = -46, Z0 = 45, S = 0.25, W = 884, Hh = 440, A8 = new Uint8Array(W * Hh);
  const srcs = []; Render.scene.traverse(o => { if (!o.isMesh || !o.geometry || !o.geometry.attributes.position) return; const n = o.geometry.attributes.position.count; let p = o, inG = false; while (p) { if (p.name === 'hl22' || p.name === 'ln21') inG = true; p = p.parent; }
    if (n === 27470 || n === 20624 || (inG && o.geometry.index && !o.geometry.attributes.color)) srcs.push(o); });   // (n20624: the track's and the SE lot's own paving)
  const seen = new Set(); let tris = 0;
  for (const o of srcs) { const g = o.geometry, P = g.attributes.position, I = g.index; if (seen.has(I || P)) continue; seen.add(I || P); o.updateMatrixWorld(true);
    const V = new THREE.Vector3(), n = I ? I.count : P.count; const at = (k) => { V.fromBufferAttribute(P, I ? I.getX(k) : k).applyMatrix4(o.matrixWorld); return [V.x, V.z]; };
    for (let t = 0; t < n; t += 3) { const a = at(t), b = at(t + 1), c = at(t + 2); const ar = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]); if (Math.abs(ar) < 1e-9) continue; tris++;
      const i0 = Math.max(0, Math.floor((Math.min(a[0], b[0], c[0]) - X0) / S)), i1 = Math.min(W - 1, Math.ceil((Math.max(a[0], b[0], c[0]) - X0) / S)), j0 = Math.max(0, Math.floor((Math.min(a[1], b[1], c[1]) - Z0) / S)), j1 = Math.min(Hh - 1, Math.ceil((Math.max(a[1], b[1], c[1]) - Z0) / S));
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const x = X0 + (i + 0.5) * S, z = Z0 + (j + 0.5) * S;
        const w0 = ((b[0] - x) * (c[1] - z) - (b[1] - z) * (c[0] - x)) / ar, w1 = ((c[0] - x) * (a[1] - z) - (c[1] - z) * (a[0] - x)) / ar, w2 = 1 - w0 - w1; if (w0 >= -1e-4 && w1 >= -1e-4 && w2 >= -1e-4) A8[j * W + i] = 255; } } }
  let cells = 0; for (let k = 0; k < A8.length; k++) if (A8[k]) cells++;
  out.srcs = seen.size; out.tris = tris; out.cells = cells;
  const tex = new THREE.DataTexture(A8, W, Hh, THREE.RedFormat, THREE.UnsignedByteType); tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.needsUpdate = true;
  const TU = window.__LOTISOT || (window.__LOTISOT = { value: tex }); TU.value = tex; const BU = window.__LOTISOB || (window.__LOTISOB = { value: new THREE.Vector4() }); BU.value.set(X0, Z0, W * S, Hh * S);
  let nm = 0; Render.scene.traverse(o => { if (!o.isMesh || !o.material || Array.isArray(o.material) || !o.geometry || !o.geometry.attributes.position) return; const n = o.geometry.attributes.position.count;
    if (!(o.userData.grass || n === 6070 || n === 20327 || n === 10193)) return; const m = o.material; if (m.userData.__lotiso) return; m.userData.__lotiso = true; nm++;
    const prev = m.onBeforeCompile, ck = m.customProgramCacheKey;
    m.onBeforeCompile = function (sh, r) { if (prev && prev !== THREE.Material.prototype.onBeforeCompile) prev.call(this, sh, r);
      sh.uniforms.uLotIso = TU; sh.uniforms.uLotIsoB = BU;
      sh.vertexShader = 'varying vec2 vLotIsoW;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n  vLotIsoW = (modelMatrix * vec4(transformed, 1.0)).xz;');
      sh.fragmentShader = 'varying vec2 vLotIsoW;\nuniform sampler2D uLotIso;\nuniform vec4 uLotIsoB;\n' + sh.fragmentShader.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n  { vec2 q = (vLotIsoW - uLotIsoB.xy) / uLotIsoB.zw; if (q.x > 0.0 && q.x < 1.0 && q.y > 0.0 && q.y < 1.0 && texture2D(uLotIso, q).r > 0.5) discard; }'); };
    m.customProgramCacheKey = function () { return (ck ? ck.call(this) : '') + '|lotiso'; }; m.needsUpdate = true; });
  // (the lot's surfaces made for the pictures, hl22's and ln21's, were pushed back (polygonOffset +1, behind the paving where they overlap it); from
  //  the iso camera the old terrain sheet under them (n19364, -1) then won: they get the paving's own offset, their 1-5 cm height decides)
  let np = 0; for (const o of srcs) { const c = o.geometry.attributes.position.count; if (c === 27470 || c === 20624 || !o.visible) continue; const m = o.material; if (!(m.polygonOffset && m.polygonOffsetFactor <= -1)) { m.polygonOffset = true; m.polygonOffsetFactor = -1; m.polygonOffsetUnits = -1; np++; } }
  out.mats = nm; out.pulled = np; window.__LOTISO = out;
  return 'LOTISO ' + JSON.stringify(out); })()
