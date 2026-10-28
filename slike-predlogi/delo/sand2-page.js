(() => {
  // (pictures only) the sand strip along the SW bowl's red-white kerb by the heliport taken away (the kerb-side sand layer nv19744, only in x -132..-121, z 53.8..80) (19. 10.); window.__SAND2(0/1)
  window.__SAND2U = window.__SAND2U || { value: 1 }; const U = window.__SAND2U; const R = [-132, 53.8, -121, 80];
  const clones = new Map(); let n = 0;
  Render.scene.traverse(o => { if (!o.isMesh || !o.parent || o.parent.name !== 'nv-baked' || !o.geometry.attributes.position || o.geometry.attributes.position.count !== 19744) return; n++;
    const m = o.material; if (Array.isArray(m) || (m.userData && m.userData.__sand2)) return;
    let c = clones.get(m); if (!c) { c = m.clone(); c.onBeforeCompile = m.onBeforeCompile; c.customProgramCacheKey = m.customProgramCacheKey; c.userData = Object.assign({}, m.userData, { __sand2: true });
      const prev = c.onBeforeCompile, ck = c.customProgramCacheKey;
      c.onBeforeCompile = function (sh, r) { if (prev && prev !== THREE.Material.prototype.onBeforeCompile) prev.call(this, sh, r);
        sh.uniforms.uSD2on = U;
        sh.vertexShader = 'varying vec2 vSD2w;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n  vSD2w = (modelMatrix * vec4(transformed, 1.0)).xz;');
        sh.fragmentShader = 'varying vec2 vSD2w;\nuniform float uSD2on;\n' + sh.fragmentShader.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n  if (uSD2on > 0.5 && vSD2w.x > ' + R[0].toFixed(1) + ' && vSD2w.x < ' + R[2].toFixed(1) + ' && vSD2w.y > ' + R[1].toFixed(1) + ' && vSD2w.y < ' + R[3].toFixed(1) + ') discard;'); };
      c.customProgramCacheKey = function () { return (ck ? ck.call(this) : '') + '|sand2'; }; c.needsUpdate = true; clones.set(m, c); }
    o.material = c; });
  window.__SAND2 = (on) => { U.value = on ? 1 : 0; };
  return 'SAND2 meshes ' + n + ' mats ' + clones.size; })()
