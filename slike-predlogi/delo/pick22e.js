(() => { const S = __S__, out = [];
  const cam = Render.camera; cam.updateMatrixWorld(true); Render.scene.updateMatrixWorld(true);
  const rc = new THREE.Raycaster(); const vis = (o) => { let p = o; while (p) { if (!p.visible) return false; p = p.parent; } return true; };
  const top = (o) => { let p = o; while (p.parent && p.parent !== Render.scene) p = p.parent; return p; };
  const all = []; Render.scene.traverse(o => { if (o.isMesh && vis(o)) all.push(o); });
  for (const [px, py] of S.pts) { rc.setFromCamera(new THREE.Vector2(px / S.W * 2 - 1, 1 - py / S.H * 2), cam);
    const hs = rc.intersectObjects(all, false).slice(0, 9);
    out.push('[' + px + ',' + py + '] ' + hs.map(q => { const o = q.object, g = o.geometry, m = Array.isArray(o.material) ? o.material[0] : o.material; let va = '';
      const C = g.attributes.color; if (C && q.face) { const f = q.face, b = q.barycoord || null; const ch = (i) => C.itemSize > 3 ? C.getW(i) : 1; const r = (i) => C.getX(i), gg = (i) => C.getY(i), bb = (i) => C.getZ(i);
        const w = b ? [b.x, b.y, b.z] : [1 / 3, 1 / 3, 1 / 3]; const mix = (fn) => w[0] * fn(f.a) + w[1] * fn(f.b) + w[2] * fn(f.c); va = ' c' + [mix(r), mix(gg), mix(bb)].map(v => (v * 255) | 0).join('.') + ' a' + mix(ch).toFixed(2); }
      const mk = (T, x0, z0, w, h, s) => { try { const D = T.value.image.data, i = Math.floor((q.point.x - x0) / s), j = Math.floor((q.point.z - z0) / s); return (i >= 0 && i < w && j >= 0 && j < h) ? D[j * w + i] : -1; } catch (e) { return 'e'; } };
      return top(o).name.slice(0, 10) + '/' + (o.name || '').slice(0, 6) + ' nv' + g.attributes.position.count + ' @' + q.point.x.toFixed(1) + ',' + q.point.z.toFixed(1) + ' L' + (m && m.userData.__ln21 ? 1 : 0) + mk(window.__LN21T, -195, 20, 840, 520, 0.25) + ' I' + (m && m.userData.__lotiso ? 1 : 0) + mk(window.__LOTISOT, -46, 45, 884, 440, 0.25) + ' ro' + o.renderOrder + ' y' + q.point.y.toFixed(2) + ' ' + (m ? m.type.replace('Mesh', '').replace('Material', '').slice(0, 5) + '#' + (m.color ? m.color.getHexString() : '') + ' op' + m.opacity + (m.transparent ? 'T' : '') + (m.depthTest === false ? 'nDT' : '') + (m.map ? 'M' : '') : '') + va; }).join(' ; ')); }
  return 'PICKC ' + out.join(' | '); })()
