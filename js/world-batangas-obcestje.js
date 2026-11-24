/* =====================================================================================================================================
   WORLD — Batangas, Filipini: the houses and the orchard round the circuit (grafika ob progi), from OpenStreetMap and the canopy map, on
   js/world-batangas.js (the builder's hook LK.extra wrapped: what is here is laid out first, so the woods' palms, mangoes and bushes and the
   crowds keep clear of it, then js/world-batangas.js's own parts: the service roads, the buildings by the circuit, the horizon).
   Drawn: the houses 63-230 m from the track that js/world-batangas.js leaves out (136 OSM building=yes / house outlines, w306989499 ...
     w455037481 in tools/obcestje/batangas.data.json), as boxes on their OSM outline (its length, width and heading): white or pale
     render, a grey or rusty red roof, as js/world-batangas.js has them; the orchard w975562695 (OSM landuse=orchard, 5.8 ha, 102 m and
     more from the track): its trees in rows 8 m apart along its long side, each where the canopy map has a canopy over the spot
     (Meta / WRI 1 m canopy height, its 10 m means in tools/batangas/chm.png; under 2 m: an open spot, no tree), as tall as that canopy
     and 2 m more (4-13 m: the cell's mean takes in the gaps between the crowns), a broadleaf fruit tree (js/world-batangas.js' mango).
     Assumed (OSM has no height, levels, trees= or species here): the house heights by their size as tools/batangas/build.py has them
     (3.2 m, 5.5 m over 100 m², 7.5 m over 500 m², 9 m over 2000 m²); the orchard's trees mangoes, its rows 8 m apart.
   Kept open (docs/realizem.md: only from sources): the orchard's edge (3 m) and the spots round its six houses; the woods' own trees
     stay out of the orchard (its rows, its open spots).
   Not drawn: the farmyard, the school, the resort and its gate (tools/obcestje/batangas.data.json: another time); the buildings by the
     circuit (js/world-batangas.js' own).
   Data: OpenStreetMap (© OpenStreetMap contributors, ODbL), the main API, 2026-11-23; the canopy height map (Meta / WRI, CC BY 4.0, as
   tools/batangas/batangas.json has it); metres, origin = the start line, x east, z south (tools/batangas/batangas.json's lat0/lon0).
   ===================================================================================================================================== */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const A = World.api, LK = A.rbLook && A.rbLook.batangas;
  if (!LK || typeof LK.extra !== 'function') return;

  const HOUSES = [   // x, z, length, width, heading (deg), ...
    -302.8,300.2,11.6,9.9,98,166.9,-469.2,7.1,6.4,144,187.6,-498.8,8.2,7.7,138,301.9,-156.9,7.7,6.4,147,305,-170.3,6.1,4,60,295,-190.3,6.3,5.1,149,310.1,-193.2,14.1,5.8,143,322.2,-203.4,10.2,5.8,152,328,-193,13,9.1,153,375.2,-214,48,26.6,145,
    349.6,-206.2,5.4,3.6,147,342.5,-201.3,8.3,6,144,394.9,-198.3,7.4,5.3,146,398,-218.4,15.4,8.9,51,408.2,-145.3,30.9,10.6,57,434.3,-178.7,17.2,11.6,146,428.5,-132.5,27.2,9.7,149,455.4,-125.5,24.4,10.2,148,-581.9,71.3,16.6,5.6,12,-585.1,102.8,9.3,8.2,93,
    -584.3,93.8,7.8,5.1,5,-602.1,89.6,5,4.2,98,-601.9,108.1,11.9,8.5,101,-614.3,99.5,13,11.6,102,-624.9,85.2,8.5,5.5,5,-631.3,77.7,8.6,8.6,59,-637.3,99.3,30.4,21.2,15,-641.3,13.5,5.4,3.7,32,-636.3,3.6,3.4,2.9,90,-636.5,-5.1,13.3,11,90,
    -666,-16,4.2,3.2,94,-655,-13,19,10.9,2,-651.3,-42.7,11.2,9.2,88,-661.3,-63.8,3.6,3.5,3,-586.6,-65.8,13.5,8.4,90,-604.2,-64.4,11.8,7.5,1,-611.2,-89.3,10.7,9.3,88,-616.7,-98.1,4.6,4.1,175,-601.8,-89,7.1,6.5,89,-593.4,138.2,8.3,6.7,19,
    -606.7,140.9,16.7,11.2,107,-586.9,180.8,12.8,8.4,109,-551.2,102.4,44.3,24.6,105,-566.7,96.2,11.2,7.6,107,-128.8,165.5,12.8,9.7,60,-191.7,171.9,5.6,5.4,66,-183.2,167,4.8,4.1,151,-181.8,183.6,7.9,7.6,148,-224.3,190.9,10.9,8.3,157,-230.9,199.7,10.5,5.9,70,
    -253.8,201.7,9,8.7,160,-396.3,201.3,17.7,14.6,90,-453.2,135.1,6.6,4.2,38,-473.4,151.4,22.3,16.1,112,-463.5,139.4,13.8,6.6,22,-473.6,136.3,3.5,3,24,-477.7,129.8,12.9,8.8,117,-472.2,120.2,10.2,5.2,16,-294.5,312.6,3.1,3,28,-306.7,319.4,8.5,3.9,12,
    -395.6,278.6,3.6,3.4,178,-394.8,263.4,20.1,8.4,94,-373,293.7,17.6,10.2,102,-364.5,324.4,17.6,16.4,6,-381.1,341.7,10.4,5.2,81,-495.2,303.6,17.1,15,75,-114.1,155.3,12.1,9.2,58,-121.1,160.5,13.1,6.5,61,-105.2,147.9,14.9,11.3,59,-98.8,135.6,10.9,10.6,56,
    -87.7,146.1,4.3,3.8,149,-115,134.2,7.5,6.9,54,-142.8,144.8,7.7,6.3,149,-145.8,139.9,6,3.7,147,205.7,71.7,9,7.4,151,204.2,59.6,7.7,6.7,150,213.6,51.1,4.5,3.8,150,194.2,43.2,4.5,3.8,156,180.3,21.3,8.6,6.8,154,179.1,14.2,4.8,3.4,64,
    172.6,6.5,10.6,8.7,67,172.3,-2.4,5.8,3.2,153,163.5,62.4,15.6,12.6,63,153,47,10.6,8.9,153,173.1,48.9,8.3,8.2,62,162.4,49.9,5.8,5.5,149,147.5,27.5,15.1,13.6,62,171.2,29.7,7.2,4.5,61,161.3,17.1,14.4,11.5,63,147.3,15.3,4.9,4.6,153,
    103.5,183.6,12.8,5.9,152,109,102.9,3.9,3.2,51,98.9,109.9,3.8,3,149,69.5,93,10.3,9.7,152,96,87.6,13.4,8.3,155,94.2,96.1,7.3,4.6,64,76.7,89.6,4,3.7,62,87.9,105.3,5.6,4,65,75.5,121.3,8.5,6.9,62,61.7,105.5,7.5,7.1,151,
    56.1,85.7,8.8,7.8,61,4.3,144.2,5.5,5.3,155,-13.3,118.6,3.5,3,61,-34.4,130.2,15.2,5.5,146,-24.1,138.3,8.7,7.6,61,-31.8,140.6,4,3.5,147,-62.8,223.3,10.5,5.5,63,-69.9,211.5,7.5,5.1,153,-80.2,184.3,12.7,12,147,-201.5,216.3,9.9,3.6,178,
    -548.1,168.3,4.9,3.6,104,-537.9,165.1,16,12.3,104,-532,153.4,7.6,5.8,105,-546.3,149.9,13.2,9.3,16,-549.3,160.4,12.6,8.2,16,-560,157.1,7.6,6.2,2,-569.2,157.2,8.8,6.3,90,-567.7,168.2,14.1,8.6,16,-516.3,164.2,11.6,11.3,20,-519.7,181.9,15.8,12.3,11,
    -495.7,195.2,15.9,12.5,106,-524.2,200.5,4.2,3.1,101,-543.3,189.2,13.5,9.5,6,-539.7,197.7,7.5,4.7,6,-547.7,197.2,3.6,3.3,9,-565.1,184,16.4,14.4,103,-577,189.4,6,3.4,6,-566,198.1,9.9,5,2,-503.8,237.6,7.8,7.2,10,199.5,146.5,4.7,3.6,158,
    193.4,122.7,10.4,9.8,67,218.1,103.3,9.1,6.7,156,207,104.6,3.7,3.1,156,199.5,107.7,3.4,2.8,155,200.2,99.6,12,9.9,156,191.6,82.2,15.7,12.8,63
  ];
  // the orchard w975562695: the rows along its long side from its corner (ax, az), 8 m apart; each row [row, first spot, the canopy
  // over each spot 8 m apart (m, '0' an open spot, 'a' 10 m ...)]
  const OR = { ax: -25.8, az: 123.8, ux: 0.36809, uz: 0.92979, S: 8 }, ROWS = [
    [1,3,'30533374402440060000000000000000000000'],
    [2,3,'20576062000422763300004200000000000004'],
    [3,1,'66244a644200046a786003233400000000000057'],
    [4,2,'77856630005449aaa6000224400000000000057'],
    [5,2,'6445303204579aaaaa72553444000000000045'],
    [6,2,'a800400004779aaaa972003322000000000048'],
    [7,2,'3858820000399baaa970030002000000000005'],
    [8,2,'aa004400023abbaa9948634000000000000044'],
    [9,2,'20000000006aaaaa9999655000000000000023'],
    [10,3,'00030090aaaabbba9a9760000000000000027'],
    [11,3,'0000046aaabaaaa99a99660000000000000045'],
    [12,3,'220000688aa98aa88884440000000000000224'],
    [13,3,'88034337988386685774000027000000000200'],
    [14,3,'688842669733260003440000076600000372420'],
    [15,3,'55250006653228333340000006a556500277720'],
    [16,3,'52262300266898952230335088aa99557250220'],
    [17,3,'6999936626aa994500205757acc8699672200002'],
    [18,3,'49bc9aa99aabba40002667522d8865065300006'],
    [19,3,'bbbcccb9ccabbb7000278899cca000020000000'],
    [20,3,'8ab85bbbcccbb88003376559aaa30020000052'],
    [21,3,'07666baac955b70004567588aa66300000007'],
    [22,3,'4706998a6629330000544565a93030000032'],
    [23,3,'40064005202']
  ];
  const WALL = [[0.94, 0.93, 0.9], [0.9, 0.88, 0.82]], ROOF = [[0.5, 0.52, 0.54], [0.56, 0.3, 0.22]];
  const hash = (i, j) => { let h = Math.imul(i | 0, 374761393) + Math.imul(j | 0, 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

  const base = LK.extra;
  LK.extra = function (o) { const mine = lay(o); const st = base(o) || {}; st.roadside = mine; return st; };

  function lay(o) {
    const { root, scen, exclPush, CR } = o, { box, nrGround, IChunks } = A;
    const st = { houses: 0, trees: 0, open: 0, meshes: 0 };
    const later = [], keep = (x, z, r) => later.push(x, z, r);

    // the houses: a box on the outline, its foot at the lowest corner
    for (let k = 0; k < HOUSES.length; k += 5) {
      const x = HOUSES[k], z = HOUSES[k + 1], L = HOUSES[k + 2], W = HOUSES[k + 3], rot = HOUSES[k + 4] * Math.PI / 180, c = Math.cos(rot), s = Math.sin(rot), ar = L * W;
      const h = ar > 2000 ? 9 : ar > 500 ? 7.5 : ar > 100 ? 5.5 : 3.2;
      let y = 1e9; for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) y = Math.min(y, nrGround(x + (a * L * c - b * W * s) / 2, z + (a * L * s + b * W * c) / 2));
      const r = hash(Math.round(x), Math.round(z)), r2 = hash(Math.round(z), Math.round(x));
      box(scen.get(x, z), x, y - 0.4, z, L, h + 0.4, W, rot, WALL[r < 0.5 ? 0 : 1], ROOF[r2 < 0.5 ? 0 : 1], true);
      keep(x, z, Math.hypot(L, W) / 2 + 2); CR.avoid(x, z, Math.hypot(L, W) / 2 + 1); st.houses++;
    }

    // the orchard: its rows; a tree where the canopy map has one, the spot kept clear of the woods either way
    const wd = LK.woods, geo = wd && wd.geo ? wd.geo(wd.n + 1) : null;   // (the woods' broadleaf tree, its plainer far shape: 102 m and more out)
    if (geo && IChunks) {
      const ic = new IChunks(geo, new THREE.MeshLambertMaterial({ vertexColors: true }), 192), vx = -OR.uz, vz = OR.ux;
      for (const [b, a0, hs] of ROWS) for (let q = 0; q < hs.length; q++) {
        const a = a0 + q, x = OR.ax + OR.ux * a * OR.S + vx * b * OR.S, z = OR.az + OR.uz * a * OR.S + vz * b * OR.S, cn = parseInt(hs[q], 17);
        keep(x, z, OR.S * 0.71);
        if (!cn) { st.open++; continue; }
        const r = hash(a * 7 + 3, b * 13 + 5), r2 = hash(b * 11 + 1, a * 5 + 9), hgt = Math.max(4, Math.min(13, cn + 2)) * (0.94 + 0.12 * r);
        const cv = 0.88 + 0.24 * r2, jx = (r - 0.5) * 0.8, jz = (r2 - 0.5) * 0.8;
        ic.add(x + jx, nrGround(x + jx, z + jz) - 0.1, z + jz, r * 6.283, hgt * (1.0 + 0.2 * r2), hgt, [cv * (0.96 + 0.08 * r), cv, cv * (0.96 + 0.08 * r2)]);
        st.trees++;
      }
      const n0 = root.children.length; ic.addTo(root, false); st.meshes = root.children.length - n0;
      for (let k = n0; k < root.children.length; k++) root.children[k].name = 'roadside-orchard';
    }

    for (let k = 0; k < later.length; k += 3) exclPush(later[k], later[k + 1], later[k + 2]);
    return st;
  }
})();
