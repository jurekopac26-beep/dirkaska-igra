(() => {
  const A = THREE.Object3D.prototype.add;
  THREE.Object3D.prototype.add = function (...objs) {
    for (const o of objs) if (o && (o.isMesh || o.isGroup) && !o.userData.__st) { const st = (new Error().stack || '').split('\n').filter(l => /newmap|nv[a-z]+\.js|world\.js/.test(l)).slice(0, 4).map(l => l.replace(/^.*\/js\//, '').replace(/\)$/, '')).join(' < '); o.userData.__st = st; }
    return A.apply(this, objs);
  };
  window.__nb = setInterval(() => { if (typeof NVBake !== 'undefined' && !NVBake.__off) { NVBake.bake = () => null; NVBake.__off = 1; clearInterval(window.__nb); } }, 20);
})();
