/* =====================================================================================================================================
   WORLD — Biķernieki, Latvija: the roads by the circuit (grafika ob progi), from OpenStreetMap, on js/world-bikernieki.js (the builder's
   hook LK.extra wrapped: what is here is laid out first, so the woods' trees and the crowds keep clear of it, then js/world-bikernieki.js's
   own parts: the lakes, the reeds and the buildings).
   Drawn: the roads round the circuit within ~165 m (OSM highway=secondary/tertiary/unclassified/service), as OSM has them run and meet
     (every road ends at a node it shares with the next one: the junctions as in OSM): the city's main street to the south (secondary; 2, 3
     and 4 lanes as OSM's lanes tag), the street to the east (tertiary, 4 lanes), the asphalt road without a class, the complex's service
     roads (no surface tag: asphalt, assumed; the one of paving stones, surface=paving_stones, paler) and the car parks' aisles
     (service=parking_aisle); the car parks (OSM amenity=parking, parking=surface or no tag, no building; no surface tag: asphalt, assumed);
     the bus stop's grey pole with a blank plate (no text), its bench and its bin (OSM highway=bus_stop ~47 m from the circuit: bench=yes,
     bin=yes, shelter=no).
     Widths (OSM has no width tags here): from OSM's lanes tag × the lane widths of the Latvian design recommendations (Latvijas Valsts
     ceļi, 2023, after LVS 190-2: 3.0 to 3.75 m lanes): the main street 3.5 m lanes and 0.5 m by the kerb each side (8, 11.5 and 15 m for 2,
     3 and 4 lanes), the street to the east 3.25 m and 0.5 m (14 m), the road without a class 3.0 m and 0.25 m (6.5 m); with no lanes tag
     by the road's class (the road without a class 5.5 m, the service roads 3.5 m, the aisles 5.0 m: assumed). Where a road meets narrower
     ones end to end it narrows to them over up to 30 m, and where it splits in two these start side by side across its end, not both on
     the one point OSM joins them at (assumed: the lanes' own tapers are not in OSM).
   Kept open (docs/realizem.md: only from sources): the underpasses below the circuit (OSM tunnel=yes, layer=-1: no depth), so no road
     dips under it; the roads stop by its barriers.
   Not drawn: the circuit itself and the complex's other raceways, the footways and the cycle track (asphalt paths, not roads), the
     tracks and the paths (ground); a road inside the barriers. The lakes, the reeds and the buildings: js/world-bikernieki.js.
   Data: OpenStreetMap (© OpenStreetMap contributors, ODbL), the main API, 2026-11-22; metres, origin = the start line, x east, z south
   (tools/bikernieki/bikernieki.json's lat0/lon0); the lines simplified to 0.25 m.
   ===================================================================================================================================== */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const A = World.api, LK = A.rbLook && A.rbLook.bikernieki;
  if (!LK || typeof LK.extra !== 'function') return;

  // the bus stop: x, z; the car parks: their outlines; the roads: [class, lanes, x0, z0, ...]: class 0 the city's main street to the south
  // (OSM secondary), 1 the street to the east (tertiary), 2 the asphalt road without a class (unclassified), 3 the service roads, 4 the car
  // parks' aisles (service=parking_aisle), 5 the service roads of paving stones (surface=paving_stones); lanes as OSM's lanes tag (0: none)
  const STOP = [138.3, 468.9];
  const PARK = [
    [85.2,-99.9,170.4,-136,99.9,-301.6,14.6,-265.5],
    [77,-358.6,31.6,-342.9,21.9,-346.2,21.9,-349.1,19.6,-363.3,16.7,-375.1,12.8,-385.9,21.6,-390.3,22.8,-391.9,23.3,-393.8,32.3,-396.8,36.4,-393.4,39,-392.3,42.9,-392.5,55.7,-396.7,59.4,-396.5,61,-395.4],
    [-9.9,-565,8.6,-615.9,45.2,-560.8,35.8,-544.2],
    [20.5,-403.2,50.8,-415.9,48.1,-421.6,45.7,-420.8,39.3,-437.7,37.5,-437.1,36.5,-439.4,10.6,-429.9,10,-428.6,12.9,-422.3,14.8,-423,15.6,-421.3,15.7,-414.6],
    [153,188.1,193.3,195,191.5,205.7,190.2,254.6,194.1,254.7,193.5,270.2,184,270.6,183,296.1,193.5,296.7,189.6,325.3,159.6,300.8,149.9,265.4],
    [168.6,407.8,160.5,401.7,158.3,395.1,172.7,361.6,176.4,362.5,182.6,344.4,192.9,346.3,188.9,367.3,185,380.8],
    [-22.6,-568.5,-7.4,-603.3,-23,-610.1,-37.7,-574.6],
    [282.3,405.6,271.7,421.8,273.1,423.5,276,430.6,280.7,436,288,438.7,295.5,439,306.1,434.8,309.8,437.4,310.3,412.5,306.5,414.2,305,410.6,302.1,407.9,298.4,405.3,293,404.9,288.6,405.6,285.5,407.3],
    [265.4,470.3,268.2,466.2,274.4,461.1,279.8,460.1,287,461.1,292.2,465.9,296.7,473,299.7,481.8,303.3,484.2,293.6,498.9,290.5,495.7,286.4,497.1,281.8,497.5,276.3,496.8,270.8,494.5,266.9,491.3,264.1,486.8,255.7,487.6,256.5,474.5,264.7,474.8],
    [263.7,324.9,270.2,307.3,265.5,305.4,259.2,322.7],
    [276.9,290.8,280.9,274.6,277.1,273.5,272.2,289],
    [-73.1,-670.1,-70.4,-658,-69,-643.3,-72.9,-633.4,-71.2,-631.8,-77.2,-617.6,-89,-622.2,-88,-619.4,-91,-618.2,-87.7,-609.6,-92.2,-597,-94.3,-597.8,-93.4,-599.8,-98.2,-602,-103.5,-589.2,-98.7,-587,-95.5,-594.5,-93.6,-593.5,-99.4,-576.1,-73.3,-565.2,-52.6,-516.5,-65.8,-510.6,-106.2,-559.9,-127.7,-576,-147.3,-589.9,-151.1,-593.5,-154.4,-600.8,-158.5,-614.3,-144.6,-622.2,-139.2,-605.8,-132.7,-604.7,-132.2,-603,-110.1,-613.6,-81.1,-635,-90.7,-657.6],
    [174.6,631.3,191.3,597.4,189,596.2,192.7,589,209,596.8,210.9,596.8,212.6,596,213.9,593.8,265.6,618.5,252.6,646.3,252.8,651.5,254.2,653.7,256.4,655.4,251.2,666.6],
    [155.1,556.3,157.1,545.6,145.4,543.4,144.2,554.4]
  ];
  const WAYS = [
    [1,4,42.2,605,123.8,505.4],
    [2,0,-456.2,-1105.1,-480.3,-1078,-486.6,-1068.9],
    [2,2,-105.5,533,-108.3,538.1,-109.8,542.3,-111.3,553.7,-107.2,590.5],
    [3,0,259.7,32.7,241.4,131.7],
    [3,0,241.4,131.7,229.4,196],
    [3,0,229.4,196,202.3,341.1],
    [3,0,202.3,341.1,193.4,388.6,192.5,398.9],
    [2,2,109.8,-506,117.1,-509.2],
    [3,0,243.2,331.9,261.9,340.7],
    [3,0,261.9,340.7,264.9,342.1],
    [3,0,-851.3,-500.4,-830.3,-505.9,-805.1,-511.8,-796.8,-513.1,-787.4,-512.3,-775.7,-508.3,-749.5,-494.9,-743.3,-493.9,-736.6,-495.8],
    [0,4,-45.8,562,16.3,592.4],
    [0,4,16.3,592.4,24.5,596.5],
    [0,4,42.2,605,57,612.2,106.6,634.7],
    [3,0,253.2,509,253.8,482.1,255.7,444.6],
    [3,0,255.7,444.6,256.1,437.6,272,411.7,290.8,384.3,295.4,380.6,300.1,379.5],
    [3,0,106.6,634.7,110.3,642.4,112.1,650.7,113.8,661.9],
    [0,2,-304.2,435.3,-105.5,533],
    [1,4,46.9,-602.3,99.8,-525.2,109.8,-506],
    [1,4,109.8,-506,136.6,-446.6],
    [1,4,136.6,-446.6,151.8,-408.7],
    [3,0,221.6,193.9,229.4,196],
    [3,0,32.9,-16.1,40.8,0.7],
    [3,0,40.8,0.7,69.3,67.8,87.3,105,99.9,135.3,103.9,146.1],
    [3,0,103.9,146.1,111.4,147,117.9,149.6],
    [3,0,117.9,149.6,133.9,167.9,138.8,172.4,144.4,175],
    [3,0,144.4,175,221.6,193.9],
    [3,0,0,-0,16.2,-9,26.1,-12.4],
    [3,0,26.1,-12.4,32.9,-16.1],
    [3,0,32.9,-16.1,35.2,-36.5,31.9,-49.1,29.3,-54.3],
    [3,0,29.3,-54.3,61,-69.6],
    [3,0,61,-69.6,73.6,-75.9],
    [3,0,73.6,-75.9,111.6,-93.3,119,-97.2],
    [3,0,29.3,-54.3,12,-46.3,8.7,-42.5,7.8,-37,9.1,-32.6,12.5,-24.8,19.6,-17.6,26.1,-12.4],
    [3,0,230.5,120.3,219.9,94.9],
    [3,0,219.9,94.9,201.5,54.5,198.5,34.7],
    [3,0,142.7,-84.5,130.5,-98],
    [3,0,230.5,120.3,232.7,125.8,236.1,129,241.4,131.7],
    [4,0,70.2,-420.3,62.6,-421.7,56.7,-424.6,48.1,-430.8],
    [4,0,48.1,-430.8,45.3,-434.4,40.2,-446],
    [4,0,40.2,-446,34.9,-458.2,23.3,-453.4,28,-441.4],
    [4,0,28,-441.4,8.3,-433.1,4.5,-429.9],
    [4,0,4.5,-429.9,7.3,-422.5,9.1,-420.3,11.1,-418.9,13.8,-418.1,16.8,-418.3,48.1,-430.8],
    [5,0,11.9,-654,-2.6,-648.6,-10.2,-642.8,-26.1,-613.7,-28.9,-606.5],
    [5,0,-28.9,-606.5,-45,-609.9,-71.9,-621.5],
    [3,0,-152.2,-590.5,-167.8,-583.6,-173.8,-578.5],
    [3,0,26.4,577.6,42,550.9,72.2,494.1],
    [4,0,28,-441.4,40.2,-446],
    [3,0,-548.3,-921.2,-550,-926.5,-549.8,-933.1,-547.3,-942.7,-506.9,-1026.8],
    [3,0,46.9,-602.3,23.9,-587.2],
    [3,0,284,218.9,301.6,221.1],
    [3,0,293.3,410,289.4,410.2,285.8,411.6,283,414.3,281.2,417.7,280.6,421.2,281.2,424.6,282.8,427.8,285.3,430.2],
    [3,0,-77.8,609.1,-62.8,610.9,-55.2,614.4],
    [3,0,-55.2,614.4,-45.9,618.7,-29.5,622.4,-23.6,626.7,-22.1,634.1,-24.6,647.8,-28.5,656.4],
    [3,0,-53.2,642.3,-53.7,630.2,-55.2,614.4],
    [0,4,106.6,634.7,147.9,654.2],
    [1,4,19,-643.4,46.9,-602.3],
    [0,4,24.5,596.5,42.2,605],
    [4,0,148.2,-139.3,88.1,-290.2],
    [4,0,132.8,-133.3,69.8,-282.3],
    [4,0,119.5,-127.7,55.3,-276.6],
    [4,0,106.2,-121.6,41.8,-270.9],
    [4,0,87.7,-114.1,34.5,-241],
    [4,0,34.5,-241,24.9,-263.1,41.8,-270.9],
    [4,0,41.8,-270.9,55.3,-276.6],
    [4,0,55.3,-276.6,69.8,-282.3],
    [4,0,69.8,-282.3,88.1,-290.2],
    [3,0,40.8,0.7,61.8,-4.1,69.2,-5.4],
    [3,0,202.3,341.1,188.3,337.5],
    [3,0,163.5,304.3,160.2,291.6,158.2,272.5,160.5,215.9,161.5,212.9,164.4,210.9,176.3,210.4,179.2,212.3,180.9,216.3,176.6,305.4],
    [3,0,178.6,334.7,172.9,354.5,158.3,388.3,144,423.7,134.3,444.8,127.2,456,91.5,502.5],
    [3,0,132.8,-133.3,119.5,-127.7],
    [3,0,119.5,-127.7,108.8,-122.8],
    [3,0,108.8,-122.8,106.2,-121.6],
    [3,0,106.2,-121.6,87.7,-114.1],
    [3,0,136.6,-446.6,116.6,-438.1,70.2,-420.3],
    [3,0,70.2,-420.3,27,-401.9,26.6,-394.8,24.9,-389.9,24.1,-377.7,26.5,-346.7,26.2,-342.7,20.2,-324,-5.7,-264.7,-15,-246.1,-16.5,-239.8,-16.2,-233.8],
    [3,0,-16.2,-233.8,-21.4,-229.2,-26.2,-225.9],
    [3,0,-26.2,-225.9,-26.8,-211.2],
    [3,0,136.6,-446.6,149.8,-455.6],
    [3,0,144.4,175,138.2,193.7],
    [3,0,138.2,193.7,135.1,202.9,117.8,211.3],
    [3,0,90.7,220.1,81,219,67.8,211.5,65.8,206.5,61.4,199.3],
    [3,0,61.4,199.3,54.1,196.7,41.8,194.1,24.1,167.1,20.2,162.7,14.5,159.7,6.1,156.8,-21,148.8,-26.2,143],
    [3,0,73.6,-75.9,80.7,-61.3],
    [3,0,264.9,342.1,278.5,346.4,302.8,347.4],
    [3,0,-40,-219.8,-26.2,-225.9],
    [3,0,-77.7,-659.5,-74.3,-647.1,-75.5,-639.9,-82.2,-626],
    [3,0,-75,-623,-82.2,-626],
    [3,0,-82.2,-626,-87.9,-625.5,-94.3,-622.6,-106.2,-612.2,-113.7,-608,-139.1,-596.6,-149.8,-591.3,-152.2,-590.5],
    [3,0,61.4,199.3,66.1,181.2],
    [3,0,137.6,-105.5,126.7,-104.8,119,-97.2],
    [3,0,119,-97.2,130.5,-98],
    [3,0,130.5,-98,137.6,-105.5],
    [3,0,261.9,340.7,280.7,289.8,296.5,241.2],
    [3,0,117.9,149.6,219.9,94.9],
    [3,0,135.9,554.8,139.3,541,143.6,531.5,144.1,528.9,144,526.5,143,522.9,138.8,517.9,123.8,505.4],
    [3,0,-506.9,-1026.8,-486.6,-1068.9],
    [4,0,23.9,-587.2,37.3,-564.1,32.7,-552.9,13.1,-561.6],
    [4,0,259.6,623.6,195.6,594.1],
    [3,0,181.2,625.2,188.4,609.7],
    [3,0,188.4,609.7,195.6,594.1],
    [3,0,195.6,594.1,152.3,574.1,144.2,567.8,139.2,561.4,135.9,554.8],
    [4,0,188.4,609.7,252.3,639.3],
    [3,0,-52.3,5,-67.5,12.2,-71.8,10.7,-85.3,-2.1],
    [3,0,-126.7,-6.8,-146.2,-7.6],
    [3,0,94.3,196.3,102.2,190.1,109.6,181.3,114.8,174.3,115.6,166.3,114.1,153.3,117.9,149.6],
    [3,0,255.7,444.6,273.6,446],
    [3,0,-28.9,-606.5,-20.7,-600.3,-31.6,-572.2],
    [3,0,-33.7,-567.6,-38.9,-554.3],
    [3,0,-38.9,-554.3,31.4,-526.5],
    [3,0,26,-510,-16.6,-527.3,-18.9,-534.6,-33.9,-540.1,-38.9,-554.3],
    [3,0,82.6,654.6,83.2,653.2,84.3,652.4,86.9,652.4,99.5,658.1,101.3,659.6,102.3,662],
    [3,0,79.2,664.3,58.2,655.9,54,654.6,44.6,654.7,39.1,653.4,27.2,648.2,19.6,646.6],
    [3,0,61,-69.6,56.6,-81.9,46.6,-103.9,47.7,-109.5,68.5,-117.7],
    [3,0,119,-97.2,108.8,-122.8],
    [3,0,-16.2,-233.8,1.5,-233.1,18.9,-235.7,26.4,-237.8,34.5,-241],
    [3,0,-578.1,-252.6,-582.6,-246],
    [3,0,-456.4,-339.6,-464.9,-335.1],
    [1,4,123.8,505.4,169.6,451.4,197.6,413.3],
    [1,4,197.6,413.3,216.8,382.4,243.2,331.9],
    [1,4,243.2,331.9,259.8,292.2,275.4,246.5,284,218.9],
    [1,4,284,218.9,290,191.6],
    [3,0,121.2,563,135.9,554.8],
    [3,0,-595.2,-251.4,-599,-244.5],
    [3,0,4.5,-429.9,-7.8,-424.4,-10.8,-426.9,-34.3,-476.8],
    [4,0,23.9,-587.2,13.1,-561.6],
    [4,0,13.1,-561.6,-1.4,-568],
    [4,0,-1.4,-568,8.6,-593.6,23.9,-587.2],
    [3,0,-197.8,-588.6,-212.7,-581.2],
    [3,0,138.2,193.7,185,200.1],
    [3,0,188.3,337.5,178.6,334.7],
    [3,0,178.6,334.7,171.4,328.4,168.5,322.2,166.9,314.9,163.5,304.3],
    [3,0,163.5,304.3,176.6,305.4],
    [3,0,176.6,305.4,189.9,306.6],
    [3,0,79.2,664.3,91.9,670],
    [3,0,79.2,664.3,80.4,660.2],
    [0,2,-105.5,533,-67.3,551.6],
    [0,3,-67.3,551.6,-45.8,562],
    [0,4,42.2,605,33.9,619.7,19.6,646.6],
    [3,0,-106.1,608.3,-77.8,609.1],
    [3,0,192.5,398.9,197.6,413.3],
    [0,4,19.6,646.6,8.9,666.5],
    [3,0,16.3,592.4,26.4,577.6],
    [3,0,108.1,588.1,121.2,563]
  ];
  // each class: its lane's width and its paved edge each side, its width with no lanes tag (assumed), its colour over the asphalt's picture
  // (the main streets darker and even, the small roads paler). Lanes: the Latvian design recommendations (Latvijas Valsts ceļi, after LVS
  // 190-2) give 3.0 to 3.75 m (2.75 m where tight): the main streets 3.5 m, the street to the east 3.25 m, the road without a class 3.0 m
  // (assumed within that range: the recommendations' own table not read), the streets' gutters by the kerb 0.5 m, the road's edge 0.25 m
  const CL = [[3.5, 0.5, 8, [0.8, 0.8, 0.83]], [3.25, 0.5, 7, [0.84, 0.84, 0.86]], [3, 0.25, 5.5, [0.92, 0.92, 0.93]], [0, 0, 3.5, [0.99, 0.98, 0.97]],
    [0, 0, 5, [1, 1, 1]], [0, 0, 3.5, [1.1, 1.06, 1]]];
  // a road's width: its lanes × its class's lane width and the two paved edges; with no lanes tag, its class's width
  const wide = (W) => { const [lw, e, w0] = CL[W[0]]; return W[1] ? W[1] * lw + 2 * e : w0; };
  const segD = (px, pz, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz || 1))); return Math.hypot(px - ax - dx * t, pz - az - dz * t); };
  const PK = [1.02, 1.02, 1.04], POLE = [0.62, 0.64, 0.66], PLATE = [0.94, 0.94, 0.92], SEAT = [0.6, 0.46, 0.32], BIN = [0.42, 0.45, 0.48];
  // smooth patches (value noise on a 9 m lattice, from the place alone: the same every time, no draw from the world's random numbers)
  const hash = (i, j) => { let h = Math.imul(i, 374761393) + Math.imul(j, 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const patch = (x, z) => {
    const u = x / 9, v = z / 9, i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j, su = fu * fu * (3 - 2 * fu), sv = fv * fv * (3 - 2 * fv);
    const a = hash(i, j), b = hash(i + 1, j), c = hash(i, j + 1), d = hash(i + 1, j + 1);
    return a + (b - a) * su + (c - a) * sv + (a - b - c + d) * su * sv;
  };
  const tone = (c, x, z) => { const f = 0.95 + 0.08 * patch(x + 500, z); return [c[0] * f, c[1] * f, c[2] * f]; };

  const base = LK.extra;
  LK.extra = function (o) { const mine = lay(o); const st = base(o) || {}; st.roadside = mine; return st; };
  // the car parks' camp cells (js/world-rbring.js lays them before this scenery) keep off these roads: none whose 16 m square (11 m to its
  // corners) would reach the asphalt (the land cover's built-up cells lie over the service roads and the car parks ~600 m north of the start)
  LK.lotOk = (x, z) => { for (const W of WAYS) { const m = wide(W) / 2 + 11; for (let q = 2; q + 3 < W.length; q += 2) if (segD(x, z, W[q], W[q + 1], W[q + 2], W[q + 3]) < m) return false; } return true; };

  function lay(o) {
    const { root, scen, exclPush, CR, tex } = o, { RB, nrGround, nrNear, box } = A, cyl = A.cyl;
    const st = { ways: 0, wayM: 0, narrowed: 0, split: 0, parkCells: 0, stops: 0, pois: 0, meshes: 0 };
    const past = (x, z, m) => { const n = nrNear(x, z); return n.i < 0 || n.dd >= m; };
    const near = (x, z, m) => { const n = nrNear(x, z); return n.i >= 0 && n.dd < m; };
    // what is laid on the ground goes into a mesh per 240 m square, so three.js leaves out of the frame what is out of view
    const TILE = 240, tiles = new Map();
    const rbAt = (x, z) => { const key = Math.floor(x / TILE) + ',' + Math.floor(z / TILE); let t = tiles.get(key); if (!t) tiles.set(key, t = new RB(true)); return t; };

    // the roads: rows of two across (the left and the right edge), every 2.5 m along, on the ground; cut where they run inside the barriers;
    // a stretch goes into the tile of the row it ends at (the row before it copied there when the tile or the mesh changes). Within FADE m
    // of a cut or of a free end (one that meets no other road drawn here: a road at an underpass, the edge of the data) the asphalt fades
    // out: those stretches go into a see-through mesh per tile, so no road stops with a hard edge in the grass
    const FADE = 20, tilesF = new Map();
    const rbFade = (x, z) => { const key = Math.floor(x / TILE) + ',' + Math.floor(z / TILE); let t = tilesF.get(key); if (!t) tilesF.set(key, t = new RB(true, true)); return t; };
    const joined = (W, x, z) => {   // the parking aisles end in the car park; any other end must meet another way
      if (W[0] === 4) return true;
      for (const V of WAYS) if (V !== W) for (let q = 2; q + 3 < V.length; q += 2) if (segD(x, z, V[q], V[q + 1], V[q + 2], V[q + 3]) < 1.5) return true;
      return false;
    };
    // at an end, the width of the roads of its class that end there too, together (0: none): where a road meets narrower ones end to end
    // (the main street where OSM gives it fewer lanes) it narrows to that over up to 30 m (half of it)
    const endW = (W, x, z) => { let w = 0; for (const V of WAYS) if (V !== W && V[0] === W[0]) for (const q of [2, V.length - 2]) if (Math.hypot(V[q] - x, V[q + 1] - z) < 0.5) w += wide(V); return w; };
    // at an end where a road splits in two narrower ones of its class (OSM starts both at one point; none in
    // today's data here, kept for a later OSM edit): the other one, how far apart their lines must be to
    // lie side by side over the wider one's end, and which way across (along the rows' normal) this one keeps clear of the other (null:
    // no split there). They keep that far apart until OSM's lines are, then follow them: the island opens where they part
    const split = (W, atEnd) => {
      const q = atEnd ? W.length - 2 : 2, x = W[q], z = W[q + 1], at = [];
      for (const V of WAYS) if (V[0] === W[0]) for (const p of [2, V.length - 2]) if (Math.hypot(V[p] - x, V[p + 1] - z) < 0.5) {
        const r = p === 2 ? 4 : V.length - 4, ux = V[r] - x, uz = V[r + 1] - z, l = Math.hypot(ux, uz) || 1;
        at.push({ V, w: wide(V), ux: ux / l, uz: uz / l });
      }
      const B = at.reduce((b, a) => (a.w > b.w ? a : b), at[0]), sib = at.filter(a => a.w < B.w - 0.2), me = sib.find(a => a.V === W);
      if (!me || sib.length !== 2) return null;
      const Q = sib[sib[0] === me ? 1 : 0], lx = B.uz, lz = -B.ux, dx = atEnd ? -me.ux : me.ux, dz = atEnd ? -me.uz : me.uz, two = me.w + Q.w;
      const sg = (me.ux * lx + me.uz * lz > Q.ux * lx + Q.uz * lz ? 1 : -1) * Math.sign(-dz * lx + dx * lz || 1);
      return { Q: Q.V, d: Math.min(B.w, two) - two / 2 - 0.3, sg };   // (0.3: a little overlap, no seam of grass between them)
    };
    for (const W of WAYS) {
      const col = CL[W[0]][3], w = wide(W), U = 3, pts = [], ok = [], s = [];
      for (let q = 2; q + 3 < W.length; q += 2) {
        const ax = W[q], az = W[q + 1], bx = W[q + 2], bz = W[q + 3], L = Math.hypot(bx - ax, bz - az), m = Math.max(1, Math.ceil(L / 2.5));
        for (let t = q > 2 ? 1 : 0; t <= m; t++) pts.push(ax + (bx - ax) * t / m, az + (bz - az) * t / m);
      }
      const n = pts.length / 2, cut = new Float64Array(n), hw = new Float64Array(n);
      for (let k = 0; k < n; k++) s.push(k ? s[k - 1] + Math.hypot(pts[2 * k] - pts[2 * k - 2], pts[2 * k + 1] - pts[2 * k - 1]) : 0);
      const S = s[n - 1], LT = Math.min(30, S / 2), e0 = endW(W, W[2], W[3]), e1 = endW(W, W[W.length - 2], W[W.length - 1]);
      const w0 = e0 && e0 < w - 0.2 ? e0 : w, w1 = e1 && e1 < w - 0.2 ? e1 : w;
      const P0 = pts.slice();   // (moved across along the line's normal, as the rows below are laid)
      for (const [o, back] of [[split(W, false), false], [split(W, true), true]]) if (o) {
        for (let i = 0; i < n; i++) {
          const k = back ? n - 1 - i : i, x = P0[2 * k], z = P0[2 * k + 1]; let D = 1e9;
          for (let q = 2; q + 3 < o.Q.length; q += 2) D = Math.min(D, segD(x, z, o.Q[q], o.Q[q + 1], o.Q[q + 2], o.Q[q + 3]));
          if (D >= o.d || i > n / 2) break;
          const k0 = Math.max(0, k - 1), k1 = Math.min(n - 1, k + 1), dx = P0[2 * k1] - P0[2 * k0], dz = P0[2 * k1 + 1] - P0[2 * k0 + 1], dl = Math.hypot(dx, dz) || 1;
          const f = o.sg * (o.d - D) / 2; pts[2 * k] -= dz / dl * f; pts[2 * k + 1] += dx / dl * f;
        }
        st.split++;
      }
      if (w0 < w || w1 < w) st.narrowed++;
      for (let k = 0; k < n; k++) {
        hw[k] = Math.min(w0 + (w - w0) * Math.min(1, s[k] / LT), w1 + (w - w1) * Math.min(1, (S - s[k]) / LT)) / 2;
        ok.push(past(pts[2 * k], pts[2 * k + 1], hw[k] + 1.2));
      }
      let c0 = joined(W, W[2], W[3]) ? -1e9 : 0;   // the distance along to the nearest cut or free end: one pass forwards, one back
      for (let k = 0; k < n; k++) { if (!ok[k]) c0 = s[k]; cut[k] = s[k] - c0; }
      c0 = joined(W, W[W.length - 2], W[W.length - 1]) ? 1e9 : s[n - 1];
      for (let k = n - 1; k >= 0; k--) { if (!ok[k]) c0 = s[k]; cut[k] = Math.min(cut[k], c0 - s[k]); }
      let prev = null;
      for (let k = 0; k < n; k++) {
        if (!ok[k]) { prev = null; continue; }
        const x = pts[2 * k], z = pts[2 * k + 1], k0 = Math.max(0, k - 1), k1 = Math.min(n - 1, k + 1), h = hw[k];
        const dx = pts[2 * k1] - pts[2 * k0], dz = pts[2 * k1 + 1] - pts[2 * k0 + 1], dl = Math.hypot(dx, dz) || 1, nx = -dz / dl, nz = dx / dl;
        const row = [-h, h].map(f => [x + nx * f, nrGround(x + nx * f, z + nz * f) + 0.1, z + nz * f]);
        const t = Math.min(1, cut[k] / FADE), a = t * t * (3 - 2 * t), c = tone(col, x, z), c4 = [c[0], c[1], c[2], a];
        const cur = { row, cols: [c4, c4], uvs: [[-h / U, s[k] / U], [h / U, s[k] / U]], a, s: s[k], rb: null, i: -1 };
        if (prev) {
          const rb = prev.a < 1 || a < 1 ? rbFade(x, z) : rbAt(x, z), pi = prev.rb === rb ? prev.i : rb.row(prev.row, prev.cols, prev.uvs);
          cur.rb = rb; cur.i = rb.row(row, cur.cols, cur.uvs); rb.link(pi, cur.i, 0, 1); st.wayM += cur.s - prev.s;
        } else st.ways++;
        prev = cur; exclPush(x, z, h + 1);
        if (k % 2 === 0 && near(x, z, 45)) CR.avoid(x, z, h + 0.4);
      }
    }

    // the car park: laid on the ground in 4 m cells (whole ones share their corners within a tile; the edge ones cut to the outline,
    // Sutherland-Hodgman, and triangulated), each in the tile of its centre; none inside the barriers
    const area = (P) => { let s = 0; for (let k = 0; k < P.length; k += 2) { const j = (k + 2) % P.length; s += P[k] * P[j + 1] - P[j] * P[k + 1]; } return s / 2; };
    const clip = (Q, x0, z0, x1, z1) => {
      let P = Q;
      for (const [ax, c, s] of [[0, x0, 1], [0, x1, -1], [1, z0, 1], [1, z1, -1]]) {
        const R = [], n = P.length / 2;
        for (let k = 0; k < n; k++) {
          const j = (k + 1) % n, px = P[2 * k], pz = P[2 * k + 1], qx = P[2 * j], qz = P[2 * j + 1];
          const pv = ((ax ? pz : px) - c) * s, qv = ((ax ? qz : qx) - c) * s;
          if (pv >= 0) R.push(px, pz);
          if ((pv >= 0) !== (qv >= 0)) { const t = pv / (pv - qv); R.push(px + (qx - px) * t, pz + (qz - pz) * t); }
        }
        if (R.length < 6) return null; P = R;
      }
      return P;
    };
    const C = 4, U = 3, vtx = (rb, x, z) => rb.row([[x, nrGround(x, z) + 0.08, z]], [tone(PK, x, z)], [[x / U, z / U]]);
    for (const Q of PARK) {
      let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9;
      for (let k = 0; k < Q.length; k += 2) { x0 = Math.min(x0, Q[k]); x1 = Math.max(x1, Q[k]); z0 = Math.min(z0, Q[k + 1]); z1 = Math.max(z1, Q[k + 1]); }
      const V = new Map(), cor = (rb, i, j) => { let M = V.get(rb); if (!M) V.set(rb, M = new Map()); const key = i * 100003 + j; let v = M.get(key); if (v === undefined) M.set(key, v = vtx(rb, i * C, j * C)); return v; };
      for (let j = Math.floor(z0 / C); j <= Math.floor(z1 / C); j++) for (let i = Math.floor(x0 / C); i <= Math.floor(x1 / C); i++) {
        const P = clip(Q, i * C, j * C, (i + 1) * C, (j + 1) * C); if (!P) continue;
        let cx = 0, cz = 0; for (let k = 0; k < P.length; k += 2) { cx += P[k]; cz += P[k + 1]; } cx /= P.length / 2; cz /= P.length / 2;
        if (!past(cx, cz, 1.5)) continue;
        const rb = rbAt(cx, cz);
        if (Math.abs(Math.abs(area(P)) - C * C) < 1e-3) { const a = cor(rb, i, j), b = cor(rb, i + 1, j), c = cor(rb, i + 1, j + 1), d = cor(rb, i, j + 1); rb.I.push(a, c, b, a, d, c); }
        else {
          const n = P.length / 2, b0 = rb.n; if (Math.abs(area(P)) < 0.01) continue;
          for (let k = 0; k < n; k++) vtx(rb, P[2 * k], P[2 * k + 1]);
          const tri = THREE.ShapeUtils.triangulateShape(Array.from({ length: n }, (_, k) => new THREE.Vector2(P[2 * k], P[2 * k + 1])), []);
          for (const [a, b, c] of tri) {
            const cr = (P[2 * b] - P[2 * a]) * (P[2 * c + 1] - P[2 * a + 1]) - (P[2 * b + 1] - P[2 * a + 1]) * (P[2 * c] - P[2 * a]);
            if (cr < 0) rb.I.push(b0 + a, b0 + b, b0 + c); else rb.I.push(b0 + a, b0 + c, b0 + b);   // (up-facing: x east, z south)
          }
        }
        exclPush(cx, cz, 3); st.parkCells++;
      }
    }

    // the bus stop: a grey pole with a blank plate across the nearest road (no text), its bench facing the road and its bin (OSM bench=yes,
    // bin=yes, shelter=no: no shelter)
    for (let s = 0; s + 1 < STOP.length; s += 2) {
      const x = STOP[s], z = STOP[s + 1]; if (!cyl || !past(x, z, 2)) continue;
      let best = 1e9, ang = 0, rx = x, rz = z;
      for (const W of WAYS) for (let q = 2; q + 3 < W.length; q += 2) {
        const ax = W[q], az = W[q + 1], dx = W[q + 2] - ax, dz = W[q + 3] - az, l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2));
        const d = Math.hypot(ax + dx * t - x, az + dz * t - z); if (d < best) { best = d; ang = Math.atan2(dz, dx); rx = ax + dx * t; rz = az + dz * t; }
      }
      const g = scen.get(x, z), y = nrGround(x, z) - 0.2;
      cyl(g, x, y, z, 0.035, 2.75, 6, POLE, POLE);
      box(g, x, y + 2.1, z, 0.5, 0.6, 0.04, ang + Math.PI / 2, PLATE, PLATE);
      const ux = Math.cos(ang), uz = Math.sin(ang), dl = Math.hypot(x - rx, z - rz) || 1, bx = (x - rx) / dl, bz = (z - rz) / dl;   // (along the road; away from it)
      const sx = x + ux * 1.6 + bx * 0.6, sz = z + uz * 1.6 + bz * 0.6, ys = nrGround(sx, sz);
      for (const f of [-0.7, 0.7]) box(g, sx + ux * f, ys - 0.1, sz + uz * f, 0.06, 0.52, 0.42, ang, POLE, POLE);
      box(g, sx, ys + 0.42, sz, 1.7, 0.05, 0.44, ang, SEAT, SEAT);
      box(g, sx + bx * 0.22, ys + 0.5, sz + bz * 0.22, 1.7, 0.4, 0.04, ang, SEAT, SEAT);
      cyl(g, x - ux * 1.1, nrGround(x - ux * 1.1, z - uz * 1.1) - 0.05, z - uz * 1.1, 0.22, 0.8, 8, BIN, BIN);
      exclPush(sx, sz, 1.4); CR.avoid(sx, sz, 1.2);
      exclPush(x, z, 1.2); CR.avoid(x, z, 1); st.stops++;
    }

    // the park's furniture by the lake and in the woods (OSM amenity=bench, waste_basket, leisure=picnic_table/picnic_site, bird feeder,
    // leisure=fitness_station, barrier=log; 28. 11. 2026): only what lies past the barriers, within 60 m of the road; into the scenery batches
    if (cyl) {
      // which way the road lies from (x, z): the fall of the distance to it around the point (no road near: 0)
      const toRoad = (x, z) => { const a = nrNear(x + 1, z).d - nrNear(x - 1, z).d, b = nrNear(x, z + 1).d - nrNear(x, z - 1).d; return Math.atan2(-b, -a); };
      const bench = (g, x, z, ang) => {   // ang: the way it faces; the seat runs across it
        const ux = -Math.sin(ang), uz = Math.cos(ang), fx = Math.cos(ang), fz = Math.sin(ang), y = nrGround(x, z);
        for (const f of [-0.7, 0.7]) box(g, x + ux * f, y - 0.1, z + uz * f, 0.42, 0.52, 0.06, ang, POLE, POLE);
        box(g, x, y + 0.42, z, 0.44, 0.05, 1.7, ang, SEAT, SEAT);
        box(g, x - fx * 0.22, y + 0.5, z - fz * 0.22, 0.04, 0.4, 1.7, ang, SEAT, SEAT);
        exclPush(x, z, 1.4); CR.avoid(x, z, 1.2);
      };
      const ok = (x, z) => past(x, z, 4) && near(x, z, 60);
      const BENCH = [[170, 414], [138, 464], [114, 483], [52, 558], [-316, -136], [-313, -146], [-316, -157], [-321, -160], [-365, -236], [-374, -244]];
      const BINS = [[169, 416], [136, 467], [51, 560], [-320, -98], [-316, -134], [-318, -160]];
      for (const [x, z] of BENCH) if (ok(x, z)) { bench(scen.get(x, z), x, z, toRoad(x, z)); st.pois++; }
      for (const [x, z] of BINS) if (ok(x, z)) { cyl(scen.get(x, z), x, nrGround(x, z) - 0.05, z, 0.22, 0.8, 8, BIN, BIN); exclPush(x, z, 0.8); CR.avoid(x, z, 0.6); st.pois++; }
      // the picnic site: three tables with their benches on both sides, around its OSM point
      const PIC = [-327, -197];
      if (ok(PIC[0], PIC[1])) for (const [dx, dz, a] of [[0, 0, 0.3], [-4.5, 2.5, 1.1], [3.5, 4, -0.4]]) {
        const x = PIC[0] + dx, z = PIC[1] + dz, g = scen.get(x, z), y = nrGround(x, z), ux = -Math.sin(a), uz = Math.cos(a), fx = Math.cos(a), fz = Math.sin(a);
        for (const f of [-0.75, 0.75]) box(g, x + ux * f, y - 0.1, z + uz * f, 0.7, 0.85, 0.08, a, SEAT, SEAT);
        box(g, x, y + 0.72, z, 0.8, 0.05, 1.9, a, SEAT, SEAT);
        for (const sd of [-0.65, 0.65]) box(g, x + fx * sd, y + 0.4, z + fz * sd, 0.28, 0.05, 1.9, a, SEAT, SEAT);
        exclPush(x, z, 1.8); CR.avoid(x, z, 1.6); st.pois++;
      }
      // the bird feeder: a post and a small roofed box
      const BF = [-382, -254];
      if (ok(BF[0], BF[1])) { const [x, z] = BF, g = scen.get(x, z), y = nrGround(x, z);
        cyl(g, x, y - 0.1, z, 0.05, 1.6, 6, SEAT, SEAT); box(g, x, y + 1.5, z, 0.4, 0.06, 0.4, 0, SEAT, SEAT);
        box(g, x, y + 1.6, z, 0.06, 0.2, 0.06, 0, SEAT, SEAT); box(g, x, y + 1.78, z, 0.5, 0.05, 0.5, 0.785, SEAT, SEAT); exclPush(x, z, 0.6); st.pois++; }
      // the trim trail's station: two posts and a bar between them
      const FS = [-465, -316];
      if (ok(FS[0], FS[1])) { const [x, z] = FS, g = scen.get(x, z), y = nrGround(x, z), a = toRoad(x, z), ux = -Math.sin(a), uz = Math.cos(a);
        for (const f of [-0.9, 0.9]) cyl(g, x + ux * f, y - 0.2, z + uz * f, 0.08, 2.4, 6, SEAT, SEAT);
        box(g, x, y + 2.0, z, 0.06, 0.06, 1.9, a, POLE, POLE); box(g, x, y + 1.2, z, 0.06, 0.06, 1.9, a, POLE, POLE); exclPush(x, z, 1.4); CR.avoid(x, z, 1.2); st.pois++; }
      // the logs across the forest tracks: a peeled trunk lying on the sand (boxes of eight sides would cost the same; a long box reads as one)
      const LOG = [[-654, -480], [-702, -441], [-264, -615], [-430, -859]];
      for (const [x, z] of LOG) if (ok(x, z)) { const a = toRoad(x, z) + Math.PI / 2; box(scen.get(x, z), x, nrGround(x, z) - 0.1, z, 4.5, 0.38, 0.38, a, SEAT, POLE); exclPush(x, z, 2.4); st.pois++; }
    }

    const opt = { map: tex.asphalt, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6 };
    const mat = new THREE.MeshLambertMaterial(opt), matF = new THREE.MeshLambertMaterial(Object.assign({ transparent: true, depthWrite: false }, opt));
    for (const [T, M] of [[tiles, mat], [tilesF, matF]]) for (const rb of T.values()) {
      if (rb.empty) continue;
      const m = new THREE.Mesh(rb.geometry(), M); m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); m.name = 'roadside-asphalt'; root.add(m); st.meshes++;
    }
    st.wayM = Math.round(st.wayM);
    return st;
  }
})();
