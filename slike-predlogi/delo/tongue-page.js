(() => {
  // (pictures only) the blob under the lane's corner kerb by the SE lot (user's mark, x 114.2..115.9, z 57.5..58.9): the terracotta ground layer
  // ('terr', under the strip) poked out over the lot's paving there as a light tongue up to the kerb; it is not drawn inside that tongue
  const PG = [[113.3, 56.9], [114.93, 56.9], [116.77, 61.5], [113.3, 61.5], [113.3, 61.5]];      // (the lot's side of its own edge line, carried up to the kerb)
  window.__TGU = window.__TGU || { value: 1 }; window.__TGU.value = 1; const U = window.__TGU; let nm = 0;
  const glP = PG.map(p => new THREE.Vector2(p[0], p[1]));
  Render.scene.traverse(o => { if (!o.isMesh || !o.parent || o.parent.name !== 'terr') return; const m = o.material; if (m.userData.__tg) { m.userData.__tgP.value = glP; return; } m.userData.__tg = true; m.userData.__tgP = { value: glP }; const TP = m.userData.__tgP; nm++;
    const prev = m.onBeforeCompile, ck = m.customProgramCacheKey;
    m.onBeforeCompile = function (sh, r) { if (prev && prev !== THREE.Material.prototype.onBeforeCompile) prev.call(this, sh, r);
      sh.uniforms.uTGon = U; sh.uniforms.uTGp = TP;
      sh.vertexShader = 'varying vec2 vTGw;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n  vTGw = (modelMatrix * vec4(transformed, 1.0)).xz;');
      sh.fragmentShader = 'varying vec2 vTGw;\nuniform float uTGon;\nuniform vec2 uTGp[5];\n' + sh.fragmentShader.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n  if (uTGon > 0.5) { bool ins = false; for (int i = 0, j = 4; i < 5; j = i++) { vec2 a = uTGp[i], b = uTGp[j]; if (((a.y > vTGw.y) != (b.y > vTGw.y)) && (vTGw.x < (b.x - a.x) * (vTGw.y - a.y) / (b.y - a.y) + a.x)) ins = !ins; } if (ins) discard; }'); };
    m.customProgramCacheKey = function () { return (ck ? ck.call(this) : '') + '|tg'; }; m.needsUpdate = true; });
  return 'TONGUE terr mats ' + nm; })()
