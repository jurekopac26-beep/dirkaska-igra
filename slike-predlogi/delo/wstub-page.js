(() => {
  // (pictures only) the game's own painted white line piece left in the park road's east mouth (its line's hook; 84.3..85, -87.8..-83.4):
  // dropped under the ground - the mouth's lines are the edge ribbons' now
  let n = 0; const seen = new Set();
  Render.scene.traverse(o => { if (!o.isMesh || !o.geometry || !o.geometry.attributes.position || o.geometry.attributes.position.count !== 4624 || seen.has(o.geometry)) return; seen.add(o.geometry);      /* (the white paint mesh only: vertex-coloured white, no texture) */
    const P = o.geometry.attributes.position, C = o.geometry.attributes.color; if (!C || o.material.map) return; o.updateMatrixWorld(true); const V = new THREE.Vector3();
    for (let i = 0; i < P.count; i++) { V.fromBufferAttribute(P, i).applyMatrix4(o.matrixWorld); if (V.x > 84.1 && V.x < 85.2 && V.z > -88.0 && V.z < -83.2 && V.y > -1 && C.getX(i) > 0.9 && C.getY(i) > 0.9) { P.setY(i, P.getY(i) - 30); n++; } }
    P.needsUpdate = true; o.geometry.computeBoundingSphere(); });
  return 'WSTUB verts ' + n + ' geoms ' + seen.size; })()
