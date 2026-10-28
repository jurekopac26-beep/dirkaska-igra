(() => {
  // (pictures only) 22. 10. evening, the user: "Kje pa je helikopter? Ni ga na helidromu" - heli8-page.js builds the chosen helicopter (version 2, one big
  // rotor and a tail, red with a white cross: window.__HV7(0)) on the rescue base's H but leaves it hidden (it was shown only in the flying sequences):
  // shown here, parked on the H; window.__HELI22 report
  if (!window.__HV7 || !window.__HV7ROOT) return 'HELI22 no heli8';
  window.__HV7(0); const R = window.__HV7ROOT; R.visible = true; R.scale.set(1, 1, 1);
  let G = null; R.children.forEach(c => { if (c.visible) G = c; });
  // parked as the user chose it: the rear ramp always down (drive in at the back), the nose doors and the front ramp shut (heli8's state 'in')
  if (G) G.children.forEach(c => { if (c.type !== 'Group') return;
    if (c.userData.A !== undefined && c.position.x > 0) { c.rotation.z = Math.PI / 2; (c.userData.struts || []).forEach(m => { if (m) m.visible = false; }); }
    else if (c.userData.A === undefined && Math.abs(Math.abs(c.rotation.y) - 1.75) < 0.01) c.rotation.y = 0; });
  const H = window.__H3, out = { shown: !!G };
  if (G) { G.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(G); out.pos = [G.position.x, G.position.y, G.position.z].map(v => +v.toFixed(2));
    out.box = [b.min.x, b.min.y, b.min.z, b.max.x, b.max.y, b.max.z].map(v => +v.toFixed(1));
    const gy = H && H.ground ? H.ground(G.position.x, G.position.z) : null; out.ground = gy == null ? null : +(+gy).toFixed(2);
    let hidden = 0; G.traverse(o => { if (o.isMesh && !o.visible) hidden++; }); out.hiddenParts = hidden; }
  window.__HELI22 = out; return 'HELI22 ' + JSON.stringify(out);
})()
