(() => {
  // (pictures only) the circuit's edge ribbons (lit: line, terracotta strip, kerbs) take the scene's fog like the ground they lie on, so the new strip and the old one are one colour (19. 10.); window.__EBFOG(0/1)
  const ms = new Set(); Render.scene.traverse(o => { if (!o.isMesh || !o.parent || o.parent.name !== 'edgeband') return; (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (m.type === 'MeshLambertMaterial') ms.add(m); }); });
  window.__EBFOG = (on) => { for (const m of ms) { m.fog = !!on; m.needsUpdate = true; } };
  window.__EBFOG(1); return 'EBFOG mats ' + ms.size; })()
