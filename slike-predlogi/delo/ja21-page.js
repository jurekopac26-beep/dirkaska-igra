(() => {
  // (pictures only) 21. 10., sheet 43-6, the truck lane's corner (jA): "z modro sem narisal kje naj gre bela crta ki pelje v bokse. vhod v bokse naj bo
  // brez robnikov samo crtkana crta" - the lane's white line from its old line (A) curved on to the circuit's corner line (E), the kerb's and strip's
  // corner pieces north of E (the terracotta tongue, the kerb top - the red cross P1) off; the circuit's edge there dashed (ebfix2.py), the wedge
  // south-west of the new line grass (gr21) ; window.__JA21(0/1)
  if (window.__JA21ROOT) Render.scene.remove(window.__JA21ROOT);
  const LP = [[104.59,29.16],[104.664,29.326],[104.754,29.487],[104.857,29.644],[104.974,29.797],[105.103,29.947],[105.245,30.093],[105.397,30.236],[105.561,30.376],[105.735,30.513],[105.918,30.648],[106.109,30.78],[106.309,30.911],[106.516,31.039],[106.729,31.167],[106.949,31.293],[107.174,31.418],[107.404,31.543],[107.637,31.666],[107.874,31.79],[108.113,31.914],[108.355,32.038],[108.597,32.162],[108.841,32.288],[109.084,32.414],[109.326,32.541],[109.567,32.67],[109.806,32.801],[110.042,32.934],[110.275,33.069],[110.503,33.206],[110.727,33.347],[110.945,33.49],[111.157,33.636],[111.363,33.786],[111.56,33.94],[111.75,34.097],[111.931,34.259],[112.102,34.426],[112.263,34.597],[112.413,34.773],[112.552,34.954],[112.678,35.141],[112.792,35.333],[112.892,35.531],[112.978,35.736],[113.049,35.947],[113.104,36.165],[113.143,36.389],[113.165,36.621],[113.17,36.8]], P1 = [[108.8, 32.5], [113.55, 32.5], [113.55, 36.62], [112.9, 36.62], [111.6, 36.2], [108.8, 35.6]], H = window.__H3;
  const G = new THREE.Group(); G.name = 'ja21'; Render.scene.add(G); window.__JA21ROOT = G;
  let EB = null, KJ = null; for (const c of Render.scene.children) { if (c.name === 'edgeband') EB = c; if (c.name === 'kerbjoin') KJ = c; }
  // the line: a ribbon 0.15 m wide on the edge ribbons' height, the circuit's edge line's material
  let LM = null; if (EB) EB.traverse(o => { if (!LM && o.isMesh && Math.abs(o.renderOrder - 5.3) < 1e-3) LM = o.material; });
  const pos = [], col = [], idx = [], hw = 0.075;
  for (let i = 0; i < LP.length; i++) { const a = LP[Math.max(0, i - 1)], b = LP[Math.min(LP.length - 1, i + 1)], tx = b[0] - a[0], tz = b[1] - a[1], l = Math.hypot(tx, tz) || 1, nx = -tz / l, nz = tx / l, [x, z] = LP[i];
    for (const s of [-1, 1]) { const px = x + nx * hw * s, pz = z + nz * hw * s; pos.push(px, H.ground(px, pz) + 0.652, pz); col.push(237 / 255, 235 / 255, 240 / 255, 1); } }
  for (let i = 0; i + 1 < LP.length; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  for (let t = 0; t < idx.length; t += 3) { const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3; if ((pos[c] - pos[a]) * (pos[b + 2] - pos[a + 2]) - (pos[b] - pos[a]) * (pos[c + 2] - pos[a + 2]) < 0) { const sw = idx[t + 1]; idx[t + 1] = idx[t + 2]; idx[t + 2] = sw; } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4)); g.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(pos.length).fill(0).map((v, i) => i % 3 === 1 ? 1 : 0), 3)); g.setIndex(idx);
  const lm = LM ? LM.clone() : new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false }); if (LM) { lm.onBeforeCompile = LM.onBeforeCompile; lm.customProgramCacheKey = LM.customProgramCacheKey; }
  const me = new THREE.Mesh(g, lm); me.renderOrder = 5.3; me.frustumCulled = false; G.add(me);
  // the corner pieces in P1 off: the edge ribbons but the lines, and the kerb joins - a discard in their shaders
  const U = window.__JA21U || (window.__JA21U = { value: 1 }); let nm = 0;
  const patch = (m) => { if (!m || m.userData.__ja21) return; m.userData.__ja21 = true; nm++; const prev = m.onBeforeCompile, ck = m.customProgramCacheKey;
    m.onBeforeCompile = function (sh, r) { if (prev && prev !== THREE.Material.prototype.onBeforeCompile) prev.call(this, sh, r);
      sh.uniforms.uJA21on = U; sh.uniforms.uJA21 = { value: P1.map(p => new THREE.Vector2(p[0], p[1])) };
      sh.vertexShader = 'varying vec2 vJA21w;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n  vJA21w = (modelMatrix * vec4(transformed, 1.0)).xz;');
      sh.fragmentShader = 'varying vec2 vJA21w;\nuniform float uJA21on;\nuniform vec2 uJA21[6];\n' + sh.fragmentShader.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n  if (uJA21on > 0.5) { bool c = false; for (int i = 0; i < 6; i++) { vec2 a = uJA21[i], b = uJA21[i == 0 ? 5 : i - 1]; if ((a.y > vJA21w.y) != (b.y > vJA21w.y) && vJA21w.x < (b.x - a.x) * (vJA21w.y - a.y) / (b.y - a.y) + a.x) c = !c; } if (c) discard; }'); };
    m.customProgramCacheKey = function () { return (ck ? ck.call(this) : '') + '|ja21'; }; m.needsUpdate = true; };
  const near = (o) => { const gg = o.geometry; if (!gg || !gg.attributes.position) return false; if (!gg.boundingBox) gg.computeBoundingBox(); const b = gg.boundingBox; return b.min.x < 114 && b.max.x > 108 && b.min.z < 37 && b.max.z > 32; };
  if (EB) EB.traverse(o => { if (o.isMesh && Math.abs(o.renderOrder - 5.3) > 1e-3 && near(o)) patch(o.material); });
  if (KJ) KJ.traverse(o => { if (o.isMesh && near(o)) patch(o.material); });
  window.__JA21 = (on) => { G.visible = !!on; U.value = on ? 1 : 0; };
  return 'JA21 line ' + LP.length + ' pts, patched mats ' + nm; })()
