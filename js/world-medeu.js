/* =========================================================================
   WORLD — Medeu, Kazakhstan (docs/proge/medeu.md): the valley of the Kishi Almaty above Almaty, built by the shared world of the mountain
   passes (js/world-prelaz.js, buildPrelaz) with a look of its own (PL_LOOK.medeu) and its own landmarks (L.pre, L.extra): the great
   open-air ice rink at the start (OpenStreetMap's model of it, part by part: the terraces and stairs up from the square, the deck round
   the ice, the stands, the corner buildings; the eight floodlight masts), the open pavilions on the mudflow dam and by the road below it,
   the spillways in the basin behind it, the gondola's cabins on their ropes, the concrete mushrooms of the bus stop, the two monuments and
   the memorial in the gorge. Shapes and heights from OpenStreetMap (ODbL 1.0); all generic: no names, letters or signs
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.api.PL_LOOK) return;
  const API = World.api;
  const { TAU, box, caGround, clamp, cone, cyl, gable, ico, lerp, ouRod, rng, rpHash, vary, vrDist, vrFar, vrNear } = API;
  let LOD, T;   // (World's, for the build under way)
  API.sync.push(() => { ({ LOD, T } = API); });

  /* ---- the look: the Ile Alatau in late summer: the Tian Shan spruce in dark columns on the shady slopes, meadows going gold on the sunny ones
     with wild apple, hawthorn and juniper scrub, grey granite with a pink cast in crags and boulder fields, snow only on the high ridges far
     up the valley; Kazakhstan's road markings (white, the centre line dashed 3 m / 9 m) and signs (the red chevrons, the warning triangles) ---- */
  const LOOK = API.PL_LOOK.medeu = {
    seed: 4730, board: 'MEDEU', sub: 'ILE ALATAU', banner: ['MEDEU', 'ILE ALATAU · 2 SERPENTINES'],
    grass: [0.42, 0.5, 0.25], grassDry: [0.62, 0.57, 0.33], grassLush: [0.32, 0.47, 0.2], shrub: [0.2, 0.3, 0.15],
    rock: [0.55, 0.52, 0.5], rockWarm: [0.62, 0.54, 0.49], lichen: [0.38, 0.38, 0.33], scree: [0.64, 0.61, 0.58],
    sat: 0.5, satV: 1.3, snowLine: 3550, snowC: [1.0, 1.02, 1.06],
    rockCols: [[0.55, 0.52, 0.5], [0.6, 0.55, 0.52], [0.48, 0.47, 0.46], [0.64, 0.6, 0.57], [0.52, 0.48, 0.46], [0.45, 0.45, 0.43]],   // (the granite: grey, a little pink, lichened)
    centre: [0.95, 0.95, 0.92], dash: [3, 9], solidNear: 70,
    chev: ['#d8261c', '#ffffff'], warn: 'tri', rail: 'steel', shoulder: [0.52, 0.5, 0.47],
    fans: [[0.12, 0.42, 0.72], [0.98, 0.82, 0.14], [0.95, 0.95, 0.95], [0.84, 0.14, 0.14], [0.2, 0.5, 0.32], [0.95, 0.5, 0.14], [0.12, 0.14, 0.2], [0.55, 0.62, 0.7]],
    cars: [[0.88, 0.88, 0.86], [0.7, 0.71, 0.72], [0.14, 0.14, 0.16], [0.18, 0.2, 0.3], [0.56, 0.12, 0.1], [0.4, 0.42, 0.44]],
    roofs: [[0.24, 0.42, 0.34], [0.55, 0.18, 0.14], [0.3, 0.33, 0.36], [0.2, 0.36, 0.52]],
    sheep: 0, portal: 0,
    // (the far slopes: the spruce forest up to ~2,600 m, the dwarf juniper above it, bare granite from ~3,000 m, the snow from ~3,500 m)
    far: { lo: [0.38, 0.45, 0.26], hi: [0.52, 0.5, 0.48], dw: [0.18, 0.28, 0.16], snow: 3500, tree: [2750, 2500], fc: [0.1, 0.18, 0.11], dwb: [2400, 2650, 3100, 2850], rk: [2900, 3300] },
  };

  /* ---- the ice rink: OpenStreetMap's parts of it (building:part, the way they are drawn in 3D): [height, min_height (m above the square in
     front of it), wall colour, top colour (RINK_COL), the outline x0,z0,x1,z1... (game metres), its holes]; the ice at 12 m (the deck round
     it level with the ice), the stands 18-19 m, the corner buildings 27-28 m, the tower 35 m. ALT_B: the square's altitude (the ice ~1,691.5 m) ---- */
  const ALT_B = 1679.5;
  const RINK_COL = ['#dbdbdb', '#8a8585', '#89c9f0', '#878787', '#616161', '#86563c', '#7aa7d6', '#474747', '#856b6b', '#8f4b1e', '#5c5c5c'];
  const RINK = [
    [1,0,0,4,[112.3,143.6,108.4,150.3,120.1,159.5,123.4,153.8,125.2,149.8]],
    [2,0,0,4,[108.4,150.3,105.4,155.3,104,156.8,114.2,167.8,120.1,159.5]],
    [3,0,0,4,[104,156.8,98.3,162.6,104.9,176.4,111.4,171.1,114.2,167.8]],
    [4,0,0,4,[98.3,162.6,94.1,165.8,91.5,167.2,94.1,182.6,97.7,181.1,104.9,176.4]],
    [5,0,0,4,[89.6,168.3,83.9,170.6,83.8,185.8,87.5,184.9,94.1,182.6,91.5,167.2]],
    [6,0,0,4,[49.8,195.3,52.7,193.6,58.9,203.8,63.2,201.3,69.6,198.8,72.5,198,79.1,197.4,83.7,197.5,83.9,170.6,78.2,171.8,65,173.8,60.7,175,56,176.7,51.7,178.7,42.1,184.1]],
    [7,0,0,5,[88,198.1,88.8,191.2,83.8,190.8,83.7,197.5]],
    [7,0,0,5,[58.9,203.8,52.7,193.6,46.5,197.7,54.7,206.9]],
    [8,0,0,5,[92.5,198.9,94.2,192.1,88.8,191.2,88,198.1]],
    [8,0,0,5,[54.7,206.9,46.5,197.7,41.7,201.8,51,210.3]],
    [9,0,0,5,[96.8,200.3,99.4,193.5,94.2,192.1,92.5,198.9]],
    [9,0,0,5,[51,210.3,41.7,201.8,37.7,206.4,47.9,213.7]],
    [10,0,0,5,[101,202.3,104.2,195.3,99.4,193.5,96.8,200.3]],
    [10,0,0,5,[47.9,213.7,37.7,206.4,34.7,211,45.2,217.3]],
    [11,0,0,5,[104.6,204.4,108.6,197.3,104.2,195.3,101,202.3]],
    [11,0,0,5,[45.2,217.3,34.7,211,34,212.2,35.1,212.9,32.8,217.3,42.8,221.6]],
    [12,0,0,1,[108.6,197.3,104.6,204.4,101,202.3,96.8,200.3,92.5,198.9,88,198.1,83.7,197.5,79.1,197.4,72.5,198,69.6,198.8,63.2,201.3,60.4,202.8,54.7,206.9,51,210.3,47.9,213.7,45.2,217.3,42.8,221.6,32.8,217.3,31.1,221.4,29.9,226.2,29.3,230.9,29.2,236.7,30.1,243.1,31.6,248.3,34.1,253.9,36.5,258,39.9,262.5,44.2,259.4,123.7,357.5,127.3,360.9,132.3,364.8,137.8,367.9,143.7,370.2,151.1,371.5,157.3,371.4,166.2,369.7,172.5,367.6,176.2,365.3,182.7,360.2,186.3,356,189.6,350.6,191.7,345.6,193.2,339.3,193.9,332.4,193.7,326.8,192.4,320.8,189.8,314.4,183.5,304.9,120,227.4,109.4,217,107.4,214.5,118.8,204.8,114.5,201.2],[[44.7,223.6,65.1,206.5,63.5,204.6,57.5,207.5,54.7,209.4,49.5,213.7,44.9,218.9,43,221.6],[52.8,264.4,126.7,354.9,132.7,360.4,136.6,362.8,141.3,365,145.8,366.4,150.2,367.1,155.1,367.4,160,367,164.7,366.1,169.1,364.6,173.2,362.6,176.4,360.4,182.8,353.9,185.7,349.9,188,345.1,189.3,340.6,189.9,336.7,190.2,331.8,189.2,323.5,188,319.7,185.9,315.3,181.7,309.3,110.2,223,103.6,216.8,96.4,213.1,93,211.9,85.3,210.6,80.6,210.3,76.5,210.7,70.7,212,63.4,215.8,57.6,220.3,54.7,223.2,52.2,226.6,50.2,230.4,48.7,234.1,47.6,238.1,47.1,242.6,47.6,251.3,48.4,255.1,50.9,261.2]]],
    [12,0,0,2,[52.8,264.4,126.7,354.9,132.7,360.4,136.6,362.8,141.3,365,145.8,366.4,150.2,367.1,155.1,367.4,160,367,164.7,366.1,169.1,364.6,173.2,362.6,176.4,360.4,182.8,353.9,185.7,349.9,188,345.1,189.3,340.6,189.9,336.7,190.2,331.8,189.2,323.5,188,319.7,185.9,315.3,181.7,309.3,110.2,223,103.6,216.8,96.4,213.1,93,211.9,85.3,210.6,80.6,210.3,76.5,210.7,70.7,212,63.4,215.8,57.6,220.3,54.7,223.2,52.2,226.6,50.2,230.4,48.7,234.1,47.6,238.1,47.1,242.6,47.6,251.3,48.4,255.1,50.9,261.2],[[67.5,258.3,138.7,345.2,141,347.4,143.6,349.1,146.8,350.5,150.1,351.5,153.6,352.1,157.3,351.9,160.3,351.1,163.4,349.9,166.2,348.3,168.9,346.1,171.5,342.7,173.2,339.6,174.2,336.6,174.7,333.1,174.4,329.9,173.2,325.4,171.4,322.3,169.4,319.5,98.6,232.8,95.9,230.2,93.3,228.5,90.3,227.2,87.2,226.3,83.5,226,79.1,226.3,74.9,227.6,72.2,229,69,231.4,67,233.3,65,236.7,63.8,239.9,63.1,244.2,63.3,248.4,64.5,252.5,65.7,255.2]]],
    [12,0,0,6,[138.7,345.2,169.4,319.5,98.6,232.8,67.5,258.3]],
    [12,0,0,7,[98.6,232.8,95.9,230.2,93.3,228.5,90.3,227.2,87.2,226.3,83.5,226,79.1,226.3,74.9,227.6,72.2,229,69,231.4,67,233.3,65,236.7,63.8,239.9,63.1,244.2,63.3,248.4,64.5,252.5,65.7,255.2,67.5,258.3]],
    [12,0,0,1,[141,347.4,143.6,349.1,146.8,350.5,150.1,351.5,153.6,352.1,157.3,351.9,160.3,351.1,163.4,349.9,166.2,348.3,168.9,346.1,171.5,342.7,173.2,339.6,174.2,336.6,174.7,333.1,174.4,329.9,173.2,325.4,169.4,319.5,138.7,345.2]],
    [13,0,0,5,[111,215.7,108.9,213.2,107.4,214.5,109.4,217]],
    [13,0,0,5,[47.8,263.8,44.2,259.4,42.1,260.9,45.6,265.5]],
    [14,0,0,5,[112.6,214.4,110.5,211.9,108.9,213.2,111,215.7]],
    [14,0,0,5,[45.6,265.5,42.1,260.9,40,262.4,43.6,267]],
    [15,0,0,5,[114,213.3,111.8,210.8,110.5,211.9,112.6,214.4]],
    [15,0,0,5,[43.6,267,40,262.4,37.6,264.2,41.3,268.7]],
    [16,0,0,5,[115.5,212.2,113.2,209.5,111.8,210.8,114,213.3]],
    [16,0,0,5,[41.3,268.7,37.6,264.2,35.7,265.6,39.4,270.2]],
    [17,0,0,5,[117,211,114.7,208.3,113.2,209.5,115.5,212.2]],
    [17,0,0,5,[39.4,270.2,35.7,265.6,33.4,267.3,37,272.1]],
    [18,0,8,8,[128,237.4,183.5,304.9,189.8,314.4,192.4,320.8,193.7,326.8,193.9,332.4,193.2,339.3,191.7,345.6,189.6,350.6,186.3,356,182.7,360.2,176.2,365.3,172.5,367.6,166.2,369.7,157.3,371.4,151.1,371.5,143.7,370.2,137.8,367.9,132.3,364.8,127.3,360.9,123.7,357.5,47.8,263.8,40.2,269.6,116.8,366.4,122.4,371.3,127.9,375.1,136.1,379,142.6,381,149.9,382.4,156.7,382.8,164.1,382.1,171.4,380.5,177.4,377.8,181.3,375.6,189.4,368.7,193.3,364.4,197,358.7,200.2,352.9,202.7,346,204.1,339.9,204.2,333.7,203.6,327.1,202.7,321.7,201.7,317.5,198.2,308.3,195.8,303.5,193.4,299.7,135.8,230.2]],
    [18,0,0,5,[118.5,209.8,116.2,207,114.7,208.3,117,211]],
    [18,0,0,5,[37,272.1,33.4,267.3,31,269,34.8,273.8]],
    [19,0,0,3,[32.8,217.3,35.1,212.9,25.6,207.5,20.6,218,19.2,222.3,18.4,226.4,18.1,231,18,234.7,18.4,239.5,19.1,243.3,21.2,250.9,22.4,254.5,24.3,258.4,26.3,262,31,269,39.9,262.5,36.5,258,34.1,253.9,31.6,248.3,30.1,243.1,29.2,236.7,29.3,230.9,29.9,226.2,31.1,221.4]],
    [19,0,0,1,[193.4,299.7,195.8,303.5,198.2,308.3,201.7,317.5,202.7,321.7,203.6,327.1,204.2,333.7,204.1,339.9,202.7,346,200.2,352.9,197,358.7,193.3,364.4,189.4,368.7,181.3,375.6,177.4,377.8,171.4,380.5,164.1,382.1,156.7,382.8,149.9,382.4,142.6,381,136.1,379,127.9,375.1,122.4,371.3,116.8,366.4,114.3,363.2,109.4,368.1,31,269,27.4,272,107.6,371.9,111,369,116,374,121.3,378.1,128,382.4,132.9,384.4,147.5,387.8,154.9,388.5,162.6,388.6,162.4,387,166,386.5,173.9,384.1,181.3,380.4,187.7,376.2,193.1,371.2,198.1,365,202.2,359.3,204.2,355.1,206.3,349.3,208.4,339.5,209.1,329.1,208.8,324.5,207.5,315.5,206.5,311.1,204.9,306.7,202.2,301.5,198.5,296.2,120.8,203.2,116.2,207,135.8,230.2]],
    [19,0,0,3,[109.4,217,120,227.4,128,237.4,135.8,230.2,118.5,209.8]],
    [26,21,9,10,[189.7,300.1,194.6,296.1,121.8,208.6,116.9,212.6]],
    [27,0,0,3,[44.7,223.6,65.1,206.5,63.5,204.6,57.5,207.5,54.7,209.4,49.5,213.7,44.9,218.9,43,221.6]],
    [27,0,8,8,[109.5,366.9,114,362.9,40.7,270.2,36,274]],
    [28,0,0,3,[114.3,363.2,114,362.9,109.5,366.9,36,274,40.7,270.2,40.2,269.6,34.8,273.8,109.4,368.1]],
    [35,0,0,3,[112.2,199.6,112.2,195.7,108.6,197.3]]];
  // the floodlight masts (OSM: man_made=mast, tower:type=lighting, height 35): x, z, the way their lamps face (degrees from north)
  const MASTS = [[186.6, 261.6, 225], [155.5, 225.9, 225], [216.0, 300.8, 235], [48.3, 303.6, 50], [76.8, 339.4, 50], [108.1, 378.5, 40], [18.3, 274.4, 65], [111.0, 197.5, 210]];
  const RINK_C = [118.7, 289.0], RINK_A = 0.88;   // (the ice's middle and its long axis)
  // OpenStreetMap's buildings (def.bld) this file draws itself, by where they stand: the stadium's outline (its parts above), the open
  // viewing pavilions (building=roof) below the dam and on it, the bus shelter in the gorge, the spillways in the basin, the mushrooms
  const OWN = [[113.4, 281.7, 'stadium'], [354.8, 942.9, 'roof'], [366.1, 942.9, 'roof'], [380.6, 942.7, 'roof'], [390.7, 942.7, 'roof'], [400.8, 942.9, 'roof'],
    [531.7, 1030.3, 'roof'], [444.5, 1032.5, 'roof'], [355.4, 1033.7, 'roof'], [268.7, 1036.7, 'roof'], [51.1, 1381.9, 'roof'],
    [203.4, 1180.7, 'tower'], [228.1, 1146.3, 'tiers'], [239.8, 1201.3, 'tiers'], [202.4, 1226.8, 'tiers'], [200.2, 1139.9, 'chute'], [-89.2, 128.1, 'mushrooms']];
  // the monuments (OSM nodes): a steel sculpture of a climber on a stone plinth, a bronze bear with her cub, the memorial stone of the mudflow
  const MONU = [[68.3, 149.3, 'climber'], [91.2, 89.4, 'bears'], [771.6, 2064.2, 'stone']];
  const FLAG = [33.8, 249.4];   // (the flagpole by the west stand: 20 m, the national flag, a plain sky blue with the sun in it)

  const hex = (h, k) => { const v = parseInt(h.slice(1), 16), f = (k || 1) / 255; return [((v >> 16) & 255) * f, ((v >> 8) & 255) * f, (v & 255) * f]; };
  const ringOf = (a) => { const r = []; for (let i = 0; i + 1 < a.length; i += 2) r.push([a[i], a[i + 1]]); return r; };
  const area = (R) => { let s = 0; for (let i = 0, j = R.length - 1; i < R.length; j = i++) s += R[j][0] * R[i][1] - R[i][0] * R[j][1]; return s / 2; };
  const inPoly = (R, x, z) => { let c = false; for (let i = 0, j = R.length - 1; i < R.length; j = i++) { const [xi, zi] = R[i], [xj, zj] = R[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
  const own = [], mon = [];   // (the build under way: the buildings of OWN found in def.bld, with what they are; the monuments where they stand)

  /* the outline R (a ring of [x, z]) as walls from y0 to y1, coloured from cb at the foot to ct at the top; win: bands of dark windows
     every 3.4 m (the corner buildings) */
  function walls(g, R, y0, y1, cb, ct, win) {
    const ccw = area(R) > 0, wc = [0.15, 0.19, 0.24];
    for (let i = 0; i < R.length; i++) {
      const [ax, az] = R[i], [bx, bz] = R[(i + 1) % R.length], l = Math.hypot(bx - ax, bz - az); if (l < 0.05) continue;
      const lx = -(bz - az) / l, lz = (bx - ax) / l, sd = ccw ? 1 : -1, ins = [(ax + bx) / 2 + lx * sd, (y0 + y1) / 2, (az + bz) / 2 + lz * sd];   // (the inside: left of a->b on a ring going round anticlockwise)
      g.quadO([ax, y0, az], [bx, y0, bz], [bx, y1, bz], [ax, y1, az], cb, ins, null, [cb, cb, ct, ct]);
      if (win && l > 2.5) for (let y = y0 + 3.2; y < y1 - 1.8; y += 3.4) {   // (a window band, a little proud of the wall)
        const ox = -lx * sd * 0.06, oz = -lz * sd * 0.06, a = [ax + ox + (bx - ax) * 0.04, y, az + oz + (bz - az) * 0.04], b = [bx + ox - (bx - ax) * 0.04, y, bz + oz - (bz - az) * 0.04];
        g.quadO(a, b, [b[0], y + 1.5, b[2]], [a[0], y + 1.5, a[2]], wc, ins); }
    }
  }
  // the outline R (with its holes) as a level face at y, facing up (or down: the underside of a part on stilts)
  function face(g, R, holes, y, col, down) {
    const V = (r) => r.map(([x, z]) => new THREE.Vector2(x, z)), all = R.concat(...(holes || []));
    const tris = THREE.ShapeUtils.triangulateShape(V(R), (holes || []).map(V));
    for (const [a, b, c] of tris) { const A = [all[a][0], y, all[a][1]], B = [all[b][0], y, all[b][1]], C = [all[c][0], y, all[c][1]];
      if (down) g.triO(A, B, C, col, [A[0], y + 3, A[2]]); else g.triUp(A, B, C, [col, col, col]); }
  }

  /* ---- before the terrain: the level ground of the stadium (P.pads: the deck's level along the ice, the square's at the foot of the terraces),
     its room and the landmarks' (no trees, rocks or people there), and out of the generic buildings the ones drawn here ---- */
  LOOK.pre = function ({ P, exclPush, blds }) {
    const yB = ALT_B - P.D.base; own.length = 0;
    // (out of the map's buildings, the ones drawn here; one the shared rule left out for standing within the road's room (its barrier: the bus
    // stop's shelters, a pavilion on the dam's crest) moved out just beyond it, along the road's normal)
    const B = T.def.bld || [], near = (x, z) => { const n = vrNear(x, z); return n.i >= 0 ? n : null; };
    for (const o of OWN) {
      const q = B.find(b => Math.abs(b[0] - o[0]) < 1.5 && Math.abs(b[1] - o[1]) < 1.5); if (!q) continue;
      const k = blds.findIndex(b => Math.abs(b.x - o[0]) < 1.5 && Math.abs(b.z - o[1]) < 1.5); if (k >= 0) blds.splice(k, 1);
      const b = { x: q[0], z: q[1], L: Math.min(q[2], 34), W: Math.min(q[3], 20), ang: q[4], h: q[5], kind: q[6], what: o[2] };
      if (b.what !== 'stadium') for (let it = 0; it < 3; it++) {
        const c = Math.cos(b.ang), s = Math.sin(b.ang); let need = 0, nn = null;
        for (const [u, v] of [[0, 0], [-b.L / 2, -b.W / 2], [b.L / 2, -b.W / 2], [b.L / 2, b.W / 2], [-b.L / 2, b.W / 2]]) { const n = near(b.x + c * u - s * v, b.z + s * u + c * v); if (n && 1.5 - n.dd > need) { need = 1.5 - n.dd; nn = n; } }
        if (!nn) break; const sd = nn.lat >= 0 ? 1 : -1; b.x += T.nx[nn.i] * sd * (need + 0.2); b.z += T.nz[nn.i] * sd * (need + 0.2);
      }
      own.push(b);
    }
    const ca = Math.cos(RINK_A), sa = Math.sin(RINK_A);
    for (const u of [-60, -30, 0, 30, 60]) { const x = RINK_C[0] + ca * u, z = RINK_C[1] + sa * u; P.pads.push({ x, z, r: 50, b: 14, h: yB + 11.6 }); exclPush(x, z, 62); }
    for (const p of RINK) if (p[0] < 12) {   // (the terraces and the stairs up from the square: the square's level under them)
      const R = ringOf(p[4]); let cx = 0, cz = 0; for (const [x, z] of R) { cx += x; cz += z; } cx /= R.length; cz /= R.length;
      let r = 0; for (const [x, z] of R) r = Math.max(r, Math.hypot(x - cx, z - cz)); P.pads.push({ x: cx, z: cz, r: r + 1.5, b: 8, h: yB }); exclPush(cx, cz, r + 3); }
    for (const [x, z] of MASTS) exclPush(x, z, 3);
    for (const b of own) if (b.what !== 'stadium') exclPush(b.x, b.z, Math.hypot(b.L, b.W) / 2 + 2);
    mon.length = 0;   // (a monument the map puts within the road's room (its barrier) stands just beyond it, on its side of the road)
    for (const [x0, z0, what] of MONU) { let x = x0, z = z0; const n = vrNear(x, z);
      if (n.i >= 0 && n.dd < 2.5) { const i = n.i, sd = n.lat >= 0 ? 1 : -1, to = sd * ((sd > 0 ? T.br[i] : T.bl[i]) + 3.5); x += T.nx[i] * (to - n.lat); z += T.nz[i] * (to - n.lat); }
      mon.push([x, z, what]); exclPush(x, z, 4); }
  };

  /* ---- the landmarks, after the rest of the pass is built ---- */
  LOOK.extra = function ({ scen, root, out, P, excluded }) {
    const base = P.D.base, yB = ALT_B - base, RL = rng(LOOK.seed + 71), G = (x, z) => caGround(x, z);
    const st = { parts: 0, masts: 0, pavilions: 0, spillways: 0, cabins: 0, monuments: 0 };
    // the stadium: every part a prism of its outline from its foot (the square, or the deck for the parts standing on it) to its height,
    // the deck and the ice only their tops (the walls between them inside the block); the walls a shade darker at the foot
    {
      const deck = RINK.find(p => p[5] && p[5].length === 2), D = ringOf(deck[4]), ICE = ringOf(RINK.find(p => RINK_COL[p[3]] === '#89c9f0')[4]);
      for (const p of RINK) {
        const [h, mh, wc, rc] = p, R = ringOf(p[4]), holes = (p[5] || []).map(ringOf);
        let cx = 0, cz = 0; for (const [x, z] of R) { cx += x; cz += z; } cx /= R.length; cz /= R.length;
        const g = scen.get(cx, cz), W = hex(RINK_COL[wc], 0.92), foot = W.map(v => v * 0.8), ice = RINK_COL[rc] === '#89c9f0' ? [0.86, 0.92, 0.97] : h === 12 && p !== deck && inPoly(ICE, cx, cz) ? [0.78, 0.86, 0.94] : null;   // (the infield and its two ends ice as well)
        const topOnly = h === 12 && p !== deck, onDeck = h > 12 && R.filter(([x, z]) => inPoly(D, x, z)).length >= R.length * 0.9;
        const y0 = mh ? yB + mh : onDeck ? yB + 11.9 : yB - 1.5, y1 = yB + h;
        if (!topOnly) walls(g, R, y0, y1, mh ? W : foot, W, h >= 26 && !mh);
        face(g, R, holes, y1 + (topOnly ? 0.01 : 0), ice || hex(RINK_COL[rc], 0.95));   // (the ice white and pale blue, as the map has it)
        if (mh) face(g, R, null, y0, foot, true);
        st.parts++;
      }
      // the floodlight masts: a tapering steel column, a cage at the top, the bank of lamps facing the ice
      const steel = [0.58, 0.6, 0.62], dark = [0.3, 0.31, 0.33], lamp = [0.96, 0.95, 0.88];
      for (const [x, z, dir] of MASTS) {
        const y = G(x, z) - 0.4, g = scen.get(x, z), d = dir * Math.PI / 180, fx = Math.sin(d), fz = -Math.cos(d), a = Math.atan2(fz, fx);
        cyl(g, x, y, z, 0.62, 35.4, 6, steel, steel, 0.3);
        box(g, x, y + 33.2, z, 1.4, 0.3, 5.6, a, dark);   // (the platform)
        box(g, x + fx * 0.5, y + 33.5, z + fz * 0.5, 0.5, 2.8, 5.2, a, dark, dark);   // (the frame of the lamps)
        const hx = 2.5, A = [x + fx * 0.78 - fz * hx, y + 33.7, z + fz * 0.78 + fx * hx], B = [x + fx * 0.78 + fz * hx, y + 33.7, z + fz * 0.78 - fx * hx];
        g.quadO(A, B, [B[0], y + 36.1, B[2]], [A[0], y + 36.1, A[2]], lamp, [x, y + 35, z]);   // (the lamps' face, towards the ice)
        st.masts++;
      }
      // the flagpole by the west stand: a white pole, the flag sky blue with a golden disc (a flag, not anyone's badge)
      { const [x, z] = FLAG, y = G(x, z), g = scen.get(x, z), sky = [0.0, 0.66, 0.78], sun = [0.98, 0.8, 0.12];
        cyl(g, x, y - 0.3, z, 0.12, 20.3, 6, [0.92, 0.92, 0.92], [0.92, 0.92, 0.92], 0.07);
        const P0 = [x, y + 19.6, z], P1 = [x + 3.6, y + 19.6, z + 0.6], P2 = [x + 3.6, y + 17.7, z + 0.6], P3 = [x, y + 17.7, z];
        g.quadO(P0, P1, P2, P3, sky, [x + 1.6, y + 18.6, z - 1]); g.quadO(P0, P1, P2, P3, sky, [x + 1.6, y + 18.6, z + 2]);
        for (const s of [-1, 1]) for (let k = 0; k < 8; k++) { const a0 = k / 8 * TAU, a1 = (k + 1) / 8 * TAU, cx = x + 1.8, cy = y + 18.65, cz = z + 0.3 + s * 0.03, r = 0.42;
          g.triO([cx, cy, cz], [cx + Math.cos(a0) * r, cy + Math.sin(a0) * r, cz + Math.cos(a0) * r / 6], [cx + Math.cos(a1) * r, cy + Math.sin(a1) * r, cz + Math.cos(a1) * r / 6], sun, [cx, cy, cz - s]); } }
      out.marks.rink = RINK_C.slice(); out.marks.masts = MASTS.length;
    }
    // the open pavilions (building=roof: the viewing shelters by the road below the dam and on its crest, the bus shelter in the gorge): a
    // concrete floor, steel posts, a low gable roof of painted sheet metal
    for (const b of own) {
      const g = scen.get(b.x, b.z), c = Math.cos(b.ang), s = Math.sin(b.ang), at = (u, v) => [b.x + c * u - s * v, b.z + s * u + c * v];
      let lo = 1e9, hi = -1e9; for (const [u, v] of [[-b.L / 2, -b.W / 2], [b.L / 2, -b.W / 2], [b.L / 2, b.W / 2], [-b.L / 2, b.W / 2], [0, 0]]) { const [x, z] = at(u, v), y = G(x, z); lo = Math.min(lo, y); hi = Math.max(hi, y); }
      const con = vary([0.66, 0.65, 0.62], RL, 0.05);
      if (b.what === 'roof') {
        box(g, b.x, lo - 0.5, b.z, b.L, hi - lo + 0.62, b.W, b.ang, con, [0.6, 0.59, 0.56]);
        const nu = b.L > 12 ? 4 : 2, rf = LOOK.roofs[Math.floor(rpHash(Math.round(b.x), 17) * LOOK.roofs.length)];
        for (let q = 0; q < nu; q++) for (const f of [-1, 1]) { const [x, z] = at((q / (nu - 1) - 0.5) * (b.L - 0.6), f * (b.W / 2 - 0.3)); box(g, x, hi, z, 0.16, 2.7, 0.16, b.ang, [0.32, 0.33, 0.35]); }
        box(g, b.x, hi + 2.62, b.z, b.L + 0.2, 0.18, b.W + 0.2, b.ang, [0.34, 0.34, 0.35]);   // (the eaves)
        gable(g, b.x, hi + 2.78, b.z, b.L + 0.9, b.W + 0.9, Math.min(b.W, 7) * 0.22, b.ang, rf, [0.34, 0.34, 0.35]);
        st.pavilions++;
      } else if (b.what === 'tower') {   // the tower spillway: a square concrete tower with a slit down each face, a parapet round its top
        const H = 16;
        box(g, b.x, lo - 1, b.z, b.L, H + 1 + hi - lo, b.W, b.ang, con, [0.6, 0.59, 0.56]);
        for (const [u, v, rot] of [[b.L / 2 + 0.03, 0, b.ang], [-b.L / 2 - 0.03, 0, b.ang], [0, b.W / 2 + 0.03, b.ang + Math.PI / 2], [0, -b.W / 2 - 0.03, b.ang + Math.PI / 2]]) {
          const [x, z] = at(u, v); box(g, x, lo + 1.2, z, 0.08, H + hi - lo - 2.5, 0.9, rot, [0.12, 0.12, 0.13]); }
        box(g, b.x, hi + H, b.z, b.L + 0.6, 0.9, b.W + 0.6, b.ang, [0.6, 0.59, 0.56]);
        st.spillways++;
      } else if (b.what === 'tiers') {   // the stepped spillways: three concrete steps along their length, the highest uphill
        const n = 3; for (let q = 0; q < n; q++) { const u = (q - (n - 1) / 2) * b.L / n, [x, z] = at(u, 0), y = G(x, z), [x1, z1] = at(-b.L / 2, 0), up = G(x1, z1) > G(...at(b.L / 2, 0)) ? n - 1 - q : q;
          box(g, x, Math.min(y, lo) - 1, z, b.L / n + 0.05, 2.2 + up * 2.6 + (y - Math.min(y, lo)), b.W, b.ang, vary(con, RL, 0.03), [0.6, 0.59, 0.56]); }
        st.spillways++;
      } else if (b.what === 'chute') {   // the sloping spillway: a concrete channel down the slope between two walls
        const [x0, z0] = at(-b.L / 2, 0), [x1, z1] = at(b.L / 2, 0), y0 = G(x0, z0), y1 = G(x1, z1);
        for (const f of [-1, 1]) { const A = at(-b.L / 2, f * b.W / 2), B = at(b.L / 2, f * b.W / 2), o = f * 0.25, Q = [[A[0], y0 - 0.5, A[1]], [B[0], y1 - 0.5, B[1]], [B[0], y1 + 1.6, B[1]], [A[0], y0 + 1.6, A[1]]];
          for (const e of [-1, 1]) g.quadO(Q[0], Q[1], Q[2], Q[3], e > 0 ? con : [0.56, 0.55, 0.52], [(A[0] + B[0]) / 2 - s * e * f, (y0 + y1) / 2, (A[1] + B[1]) / 2 + c * e * f]);   // (both faces of the wall)
          g.quadO([A[0], y0 + 1.6, A[1]], [B[0], y1 + 1.6, B[1]], [B[0] - s * o * 2, y1 + 1.6, B[1] + c * o * 2], [A[0] - s * o * 2, y0 + 1.6, A[1] + c * o * 2], [0.6, 0.59, 0.56], [b.x, (y0 + y1) / 2 - 3, b.z]); }
        { const A = at(-b.L / 2, -b.W / 2), B = at(b.L / 2, -b.W / 2), C = at(b.L / 2, b.W / 2), D = at(-b.L / 2, b.W / 2);
          g.quadUp([A[0], y0 + 0.05, A[1]], [B[0], y1 + 0.05, B[1]], [C[0], y1 + 0.05, C[1]], [D[0], y0 + 0.05, D[1]], [[0.52, 0.51, 0.49], [0.52, 0.51, 0.49], [0.52, 0.51, 0.49], [0.52, 0.51, 0.49]]); }
        st.spillways++;
      } else if (b.what === 'mushrooms') {   // the bus stop's shelters: concrete mushrooms, a white stem under a brown cap
        for (let q = 0; q < 3; q++) { const [x, z] = at((q - 1) * b.L * 0.33, (q === 1 ? 0.8 : -0.6)), y = G(x, z), r = q === 1 ? 2.5 : 2.1, hh = q === 1 ? 2.9 : 2.5;
          cyl(g, x, y - 0.3, z, 0.42, hh + 0.3, 8, [0.9, 0.88, 0.82], [0.9, 0.88, 0.82], 0.3);
          cyl(g, x, y + hh - 0.05, z, r, 0.2, 10, [0.86, 0.82, 0.72], [0.86, 0.82, 0.72], r * 1.02);
          cone(g, x, y + hh + 0.15, z, r * 1.02, r * 0.5, 10, [0.52, 0.31, 0.18], [0.62, 0.4, 0.24], q * 0.4); }
        out.marks.mushrooms = [b.x, b.z];
      }
    }
    // the monuments: shapes only, no letters
    for (const [x, z, what] of mon) {
      if (vrDist(x, z) > 300) continue; const g = scen.get(x, z), y = G(x, z), gran = [0.36, 0.35, 0.36];
      if (what === 'climber') {   // a stepped plinth of granite; on it a tall figure of brushed steel, leaning into the slope, an ice axe raised
        box(g, x, y - 0.4, z, 2.6, 0.9, 2.6, 0.3, gran); box(g, x, y + 0.5, z, 1.7, 0.7, 1.7, 0.3, [0.42, 0.41, 0.42]);
        const sv = [0.66, 0.68, 0.7], b0 = y + 1.2; ouRod(g, [x - 0.2, b0, z], [x, b0 + 2.2, z + 0.25], 0.28, sv, 6); ouRod(g, [x + 0.25, b0, z + 0.1], [x, b0 + 2.2, z + 0.25], 0.26, sv, 6);
        ouRod(g, [x, b0 + 2.1, z + 0.25], [x + 0.1, b0 + 3.5, z + 0.6], 0.42, sv, 7); ico(g, x + 0.12, b0 + 3.85, z + 0.7, 0.3, 1.1, sv, RL, 0);
        ouRod(g, [x + 0.2, b0 + 3.3, z + 0.6], [x + 0.6, b0 + 4.4, z + 1.0], 0.1, sv, 5); ouRod(g, [x + 0.6, b0 + 4.4, z + 1.0], [x + 0.85, b0 + 4.0, z + 1.2], 0.06, sv, 4);
      } else if (what === 'bears') {   // a bear and her cub of dark bronze on a low stone
        box(g, x, y - 0.3, z, 3.2, 0.6, 2.0, 0.6, gran); const br = [0.32, 0.24, 0.15];
        ico(g, x - 0.3, y + 1.0, z, 0.8, 0.85, br, RL, 0.1); ico(g, x + 0.45, y + 1.35, z + 0.25, 0.36, 1.0, br, RL, 0.1);
        ico(g, x + 0.9, y + 0.6, z - 0.4, 0.38, 0.85, br, RL, 0.1); ico(g, x + 1.15, y + 0.85, z - 0.25, 0.2, 1.0, br, RL, 0.1);
      } else {   // the memorial stone of the mudflow: a dark granite slab on a step, a pale plaque without words
        box(g, x, y - 0.3, z, 2.2, 0.5, 1.4, 0.4, [0.52, 0.51, 0.49]); box(g, x, y + 0.2, z, 1.3, 2.1, 0.45, 0.4, gran);
        box(g, x + Math.sin(0.4) * 0.24, y + 1.0, z + Math.cos(0.4) * 0.24, 0.8, 0.55, 0.04, 0.4, [0.7, 0.66, 0.52]);
      }
      st.monuments++;
    }
    // the gondola's cabins: on both ropes (as world-prelaz.js hangs them: 4.2 m either side of the line, the pylons' heights, the sag), every
    // ~70 m where they are in sight of the road: a small red cabin with its window band, its hanger up to the grip on the rope
    {
      const red = [0.78, 0.15, 0.13], glass = [0.16, 0.2, 0.25], grey = [0.5, 0.52, 0.54];
      for (const cb of T.def.cables || []) {
        const p = cb.p, n = p.length / 2, pts = []; for (let k = 0; k < n; k++) pts.push([p[2 * k], p[2 * k + 1]]);
        const dir = (k) => { const a = pts[Math.max(0, k - 1)], b = pts[Math.min(n - 1, k + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
        const H = (k) => (k === 0 || k === n - 1 ? 9 : 18 + 6 * rpHash(k, 91));
        const top = pts.map(([x, z], k) => { const [dx, dz] = dir(k); return [x, vrFar(x, z) + H(k), z, dx, dz]; });
        for (const f of [-1, 1]) for (let k = 0; k + 1 < n; k++) {
          const A = top[k], B = top[k + 1], o = 4.2 * f, ax = A[0] - A[4] * o, az = A[2] + A[3] * o, bx = B[0] - B[4] * o, bz = B[2] + B[3] * o, span = Math.hypot(bx - ax, bz - az);
          const m = Math.max(1, Math.round(span / 70)), ang = Math.atan2(bz - az, bx - ax);
          for (let q = 0; q < m; q++) {
            const t = (q + 0.3 + 0.4 * rpHash(k * 7 + q, f > 0 ? 3 : 5)) / m, x = lerp(ax, bx, t), z = lerp(az, bz, t), y = lerp(A[1], B[1], t) - span * 0.035 * 4 * t * (1 - t);
            if (vrDist(x, z) > LOD.cap(700) || y - G(x, z) < 6) continue;
            const g = scen.get(x, z);
            ouRod(g, [x, y, z], [x, y - 2.6, z], 0.06, grey, 4);
            box(g, x, y - 4.9, z, 2.0, 2.3, 1.8, ang, red, [0.86, 0.86, 0.84]);
            box(g, x, y - 4.15, z, 2.04, 0.9, 1.84, ang, glass, null, true);
            st.cabins++;
          }
        }
      }
    }
    out.medeu = st;   // (what was built: the tests)
  };

  World.ext.medeu = (scene, tex, opts) => API.buildPrelaz(scene, tex, opts, LOOK);
})();
