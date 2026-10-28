import json
R = json.load(open('eb4-ribbons.json')) + json.load(open('kerb-ribbons.json')) + json.load(open('trk-all.json'))
tpl = open('eb2-page.tpl.js').read()
tpl = tpl.replace("me.renderOrder = r.kind === 'L' ? 5.3 : 5.2;", "me.renderOrder = r.kind === 'L' ? 5.3 : r.kind === 'K' ? 5.25 : r.kind === 'T' ? 5.4 : 5.2;")
tpl = tpl.replace("// (pictures only) the asphalt roads' wide edge (18. 10.):", "// (pictures only) the asphalt roads' wide edge (as on the original Toskana: white line, terracotta shoulder), the wide kerb by the park, the tyre tracks at the gravel roads' joins (18. 10.):")
tpl = tpl.replace("depthTest: r.kind === 'K', fog: false, side: THREE.DoubleSide, polygonOffset: r.kind === 'K'", "depthTest: r.kind === 'K' || r.road === 'T', fog: false, side: THREE.DoubleSide, polygonOffset: r.kind === 'K' || r.road === 'T'")
tpl = tpl.replace("const m = new THREE.MeshBasicMaterial({", "const m = new (r.lit ? THREE.MeshLambertMaterial : THREE.MeshBasicMaterial)({")
tpl = tpl.replace("const me = new THREE.Mesh(g, m);", "if (r.lit) { g.computeVertexNormals(); let N = g.attributes.normal, sy = 0; for (let i = 0; i < N.count; i++) sy += N.getY(i); if (sy < 0) { const I = g.index; for (let t = 0; t < I.count; t += 3) { const q = I.getX(t + 1); I.setX(t + 1, I.getX(t + 2)); I.setX(t + 2, q); } } for (let i = 0; i < N.count; i++) N.setXYZ(i, 0, 1, 0); } const me = new THREE.Mesh(g, m); if (r.lit) me.receiveShadow = true;")
s = tpl.replace('__DATA__', json.dumps(R)); open('eb2-page.js', 'w').write(s); print('eb2-page.js', len(R), len(s) // 1024, 'KB')
