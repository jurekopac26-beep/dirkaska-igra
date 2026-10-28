(() => {
  // (pictures only) the user: "naj bo tako postavljen" (red line on the moved gate): the start gate turned ~50° about its slats' centre and
  // laid along the line across the lane's mouth, the riders' side still towards the start pad
  const P = window.__GATEMOVED; if (!P) return 'GATE not moved yet'; if (window.__GATEROT) return 'GATE already turned';
  const H = window.__H3, box = new THREE.Box3(), c = new THREE.Vector3();
  const sl = P.filter(o => o.geometry.attributes.position.count === 24 && o.material.color && o.material.color.getHexString() === 'b8bcc2');
  box.makeEmpty(); sl.forEach(o => box.expandByObject(o)); box.getCenter(c);
  const P0 = c.clone(), T = new THREE.Vector3(P0.x - 3.75, 0, P0.z + 3.05), phi = 50.1 * Math.PI / 180, dy = H.ground(T.x, T.z) - H.ground(P0.x, P0.z);
  const M = new THREE.Matrix4().makeTranslation(T.x, dy, T.z).multiply(new THREE.Matrix4().makeRotationY(phi)).multiply(new THREE.Matrix4().makeTranslation(-P0.x, 0, -P0.z));
  const inv = new THREE.Matrix4();
  P.forEach(o => { o.updateMatrixWorld(true); const W = M.clone().multiply(o.matrixWorld); inv.copy(o.parent.matrixWorld).invert(); W.premultiply(inv); W.decompose(o.position, o.quaternion, o.scale); o.updateMatrixWorld(true); });
  window.__GATEROT = { P0: [P0.x, P0.z], T: [T.x, T.z], phi };
  return 'GATE turned ' + P.length + ' parts, slats ' + sl.length + ', P0 ' + P0.x.toFixed(2) + ',' + P0.z.toFixed(2) + ' -> ' + T.x.toFixed(2) + ',' + T.z.toFixed(2) + ' dy ' + dy.toFixed(2);
})()
