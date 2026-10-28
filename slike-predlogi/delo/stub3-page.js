(() => {
  // (pictures only) remove the old path stub from the circuit into the SW bowl apron (heliport side, ~x -142..-126, z 53..67) (19. 10.); window.__STUB(0/1)
  const POLY = [[-142, 53.5], [-124.2, 53.5], [-124.4, 57.2], [-126.4, 61.5], [-127.4, 64.5], [-128.6, 67.0], [-142, 67.0]];
  window.__STUBU3 = window.__STUBU3 || { value: 1 }; const U = window.__STUBU3;
  const glPoly = 'const int STN3 = ' + POLY.length + ';\nbool stIn3(vec2 p) { vec2 P[STN3]; ' + POLY.map((q, i) => 'P[' + i + '] = vec2(' + q[0].toFixed(2) + ', ' + q[1].toFixed(2) + ');').join(' ') +
    ' bool c = false; for (int i = 0, j = STN3 - 1; i < STN3; j = i++) { if (((P[i].y > p.y) != (P[j].y > p.y)) && (p.x < (P[j].x - P[i].x) * (p.y - P[i].y) / (P[j].y - P[i].y) + P[i].x)) c = !c; } return c; }\n';
  const X = -133, Z = 57; let n = 0; const mats = new Set(); Render.scene.updateMatrixWorld(true);
  Render.scene.traverse(o => { if (!o.isMesh || o.isInstancedMesh || !o.geometry || !o.geometry.attributes.position) return; const nv = o.geometry.attributes.position.count; if (![1036, 128, 1160].includes(nv)) return;
    const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox(); const bb = g.boundingBox.clone().applyMatrix4(o.matrixWorld); if (X < bb.min.x || X > bb.max.x || Z < bb.min.z || Z > bb.max.z) return; n++;
    (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => mats.add(m)); });
  for (const m of mats) { if (m.userData.__stub3) continue; m.userData.__stub3 = true;
    const prev = m.onBeforeCompile, ck = m.customProgramCacheKey;
    m.onBeforeCompile = function (sh, r) { if (prev && prev !== THREE.Material.prototype.onBeforeCompile) prev.call(this, sh, r);
      sh.uniforms.uSTon3 = U;
      sh.vertexShader = 'varying vec2 vSTw3;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n  vSTw3 = (modelMatrix * vec4(transformed, 1.0)).xz;');
      sh.fragmentShader = 'varying vec2 vSTw3;\nuniform float uSTon3;\n' + glPoly + sh.fragmentShader.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n  if (uSTon3 > 0.5 && stIn3(vSTw3)) discard;'); };
    m.customProgramCacheKey = function () { return (ck ? ck.call(this) : '') + '|stub3'; };
    m.needsUpdate = true; }
  const inP = (x, z) => { let c = false; for (let i = 0, j = POLY.length - 1; i < POLY.length; j = i++) { const a = POLY[i], b = POLY[j]; if (((a[1] > z) != (b[1] > z)) && (x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0])) c = !c; } return c; };
  let jv = 0; const V = new THREE.Vector3();
  Render.scene.traverse(o => { if (!o.isMesh || !o.parent || o.parent.name !== 'jn') return; const C = o.geometry.attributes.color, P = o.geometry.attributes.position; if (!C || C.itemSize !== 4) return; let ch = false;
    for (let i = 0; i < P.count; i++) { V.fromBufferAttribute(P, i).applyMatrix4(o.matrixWorld); if (V.x > -145 && V.x < -122 && V.z > 51 && V.z < 70 && inP(V.x, V.z)) { C.setW(i, 0); jv++; ch = true; } } if (ch) C.needsUpdate = true; });
  window.__STUB3 = (on) => { U.value = on ? 1 : 0; };
  return 'STUB3 meshes ' + n + ' mats ' + mats.size + ' jn ' + jv; })()
