/* Track definition 'santiago'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // Santiago, Chile: the street circuit in the park south of the city centre, round the arena and through the long paved parade ground
  // (the Elipse), in its layout of January 2020 (2.287 km, 11 turns, anticlockwise), at full scale. The 2019 layout (2.348 km, 14 turns)
  // was never mapped; the 2020 one was: its centre line is OpenStreetMap's way 764172503 (highway=raceway, mapped on 17 January 2020,
  // version 2, read from the OSM full history), © OpenStreetMap contributors, ODbL. The line smoothed (3 m) and resampled every 5 m; metres,
  // origin = the way's first node on the long straight up the Elipse (-33.46189, -70.66002): the start line (an approximation: OSM has no
  // start line), x east, z south. The lap: north up the Elipse, Turn 1 a near-90-degree left, Turn 2 the long right back east, Turns 3-5
  // left round the park's northern block below the avenue, the left-right of Turns 6 and 7, Turn 8 the long left round the arena, Turn 9
  // left onto the Elipse, the hairpins of Turns 10 (right) and 11 (left) onto the straight. The pit lane on the inside (left) of the straight.
  // Heights (SCL_H): Copernicus DEM GLO-30 (the city's buildings and the park's crowns opened away, smoothed) along the line, every 5 m from
  // points[0], in decimetres above the start line (531 m a.s.l.): the city's gentle fall to the west and south, ~6 m over the lap.
  // Data: the centre line and the junctions under the ODbL; the heights: produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and
  // © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved.
  // The turns by their numbers only (no names of people, events or sponsors).
  const SCL_H = [0,0,1,1,2,2,3,3,4,4,5,5,6,7,7,8,9,9,10,11,12,12,13,14,15,15,16,17,18,19,20,21,21,22,23,24,25,25,25,25,25,25,25,25,25,26,26,27,28,28,29,30,30,31,31,31,32,32,32,33,33,33,34,34,34,35,35,35,36,36,36,37,37,38,38,39,39,40,41,41,42,42,43,43,44,44,45,45,45,46,46,46,47,47,47,47,48,48,48,48,48,47,47,47,47,47,47,46,46,46,46,46,46,45,45,45,45,45,45,45,45,44,44,44,44,44,43,43,43,42,42,41,41,40,39,39,38,37,37,36,35,35,34,33,32,32,31,30,30,29,28,28,27,27,26,26,25,25,24,24,23,23,22,22,21,21,20,19,19,18,18,17,17,16,16,15,14,14,13,13,12,12,11,11,10,10,9,9,8,8,8,7,7,6,6,6,6,5,5,5,4,4,4,4,4,4,3,3,3,3,3,3,3,3,3,3,3,3,3,3,4,4,4,4,4,4,4,5,5,5,5,5,5,5,6,6,6,6,6,6,6,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,6,6,6,6,5,5,5,5,5,4,4,4,3,3,3,2,2,2,1,1,1,1,0,0,0,0,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,0,0,0,0,1,1,1,1,2,1,1,0,0,-1,-2,-2,-3,-4,-4,-5,-6,-6,-7,-7,-8,-8,-9,-9,-10,-10,-11,-11,-12,-12,-12,-12,-13,-13,-13,-13,-13,-13,-13,-14,-14,-14,-13,-13,-13,-13,-13,-13,-13,-13,-13,-13,-13,-13,-13,-13,-13,-13,-13,-13,-13,-13,-12,-12,-12,-11,-11,-11,-10,-10,-9,-9,-9,-8,-7,-7,-6,-6,-5,-4,-4,-3,-3,-2,-1,0,0,0,0,0,-1,-2,-2,-3,-4,-4,-5,-5,-6,-7,-7,-7,-8,-8,-9,-9,-10,-10,-10,-10,-11,-11,-11,-11,-11,-11,-12,-12,-12,-12,-11,-11,-11,-11,-11,-11,-11,-11,-10,-10,-10,-10,-9,-9,-9,-9,-8,-8,-8,-8,-7,-7,-7,-6,-6,-6,-5,-5,-5,-4,-4,-4,-4,-3,-3,-3,-2,-2,-2,-1,-1,0];
  const SCL_P = [[0.0,0.0],[-0.2,-5.0],[-0.4,-10.0],[-0.6,-15.0],[-0.8,-20.0],[-1.0,-25.0],[-1.2,-30.0],[-1.4,-35.0],[-1.6,-40.0],[-1.8,-45.0],[-2.0,-50.0],[-2.2,-54.9],[-2.4,-59.9],[-2.7,-64.9],[-2.9,-69.9],[-3.1,-74.9],[-3.3,-79.9],[-3.5,-84.9],[-3.7,-89.9],[-3.9,-94.9],[-4.1,-99.9],[-4.3,-104.9],[-4.5,-109.9],[-4.7,-114.9],[-4.9,-119.9],[-5.1,-124.9],[-5.3,-129.9],[-5.5,-134.9],[-5.7,-139.9],[-5.9,-144.9],[-6.1,-149.9],[-6.3,-154.9],[-6.5,-159.9],[-6.7,-164.9],[-6.9,-169.8],[-7.4,-174.8],[-9.0,-179.5],[-12.4,-183.2],[-16.6,-185.8],[-21.2,-187.7],[-26.1,-188.7],[-31.1,-189.5],[-36.0,-190.2],[-40.8,-191.5],[-45.4,-193.4],[-49.5,-196.3],[-52.5,-200.2],[-54.5,-204.8],[-55.6,-209.7],[-55.3,-214.7],[-53.3,-219.2],[-49.8,-222.7],[-45.2,-224.7],[-40.4,-225.9],[-35.4,-226.7],[-30.4,-227.1],[-25.5,-227.4],[-20.5,-227.7],[-15.5,-227.8],[-10.5,-227.8],[-5.5,-227.9],[-0.5,-227.9],[4.5,-227.7],[9.5,-227.5],[14.5,-227.3],[19.5,-227.0],[24.5,-226.8],[29.5,-226.5],[34.5,-226.2],[39.5,-225.8],[44.5,-225.5],[49.5,-225.3],[54.5,-225.4],[59.5,-225.7],[64.4,-226.2],[69.3,-227.5],[73.7,-229.7],[76.6,-233.6],[77.7,-238.5],[77.6,-243.5],[77.0,-248.5],[76.2,-253.4],[75.4,-258.4],[74.6,-263.3],[73.8,-268.2],[73.0,-273.1],[72.1,-278.1],[71.3,-283.0],[70.3,-287.9],[69.2,-292.8],[68.1,-297.7],[66.9,-302.5],[65.7,-307.4],[64.3,-312.2],[62.5,-316.8],[60.1,-321.2],[57.1,-325.2],[53.6,-328.8],[49.7,-331.9],[45.5,-334.6],[41.1,-336.8],[36.3,-338.5],[31.5,-339.7],[26.6,-340.5],[21.6,-341.1],[16.6,-341.4],[11.6,-341.6],[6.6,-341.7],[1.6,-341.8],[-3.4,-341.8],[-8.4,-341.8],[-13.4,-341.9],[-18.4,-341.8],[-23.4,-341.5],[-28.4,-341.2],[-33.4,-340.9],[-38.4,-340.6],[-43.3,-340.3],[-48.3,-340.1],[-53.3,-339.8],[-58.3,-339.4],[-63.2,-338.6],[-68.1,-337.6],[-73.0,-336.6],[-77.8,-335.1],[-82.3,-333.0],[-86.7,-330.6],[-91.1,-328.1],[-95.3,-325.4],[-98.9,-322.0],[-101.8,-317.9],[-104.4,-313.7],[-106.9,-309.3],[-109.0,-304.8],[-110.6,-300.1],[-112.1,-295.3],[-113.4,-290.5],[-114.3,-285.6],[-115.2,-280.6],[-116.1,-275.7],[-117.0,-270.8],[-117.9,-265.9],[-118.8,-261.0],[-119.7,-256.0],[-120.7,-251.1],[-121.7,-246.2],[-122.5,-241.3],[-122.8,-236.3],[-122.5,-231.3],[-121.1,-226.5],[-118.6,-222.2],[-115.1,-218.7],[-111.2,-215.6],[-108.2,-211.6],[-108.8,-206.9],[-112.0,-203.1],[-116.1,-200.3],[-120.4,-197.6],[-124.4,-194.7],[-128.5,-191.8],[-132.5,-188.8],[-136.5,-185.8],[-140.6,-182.9],[-144.5,-179.8],[-148.3,-176.5],[-151.8,-173.0],[-155.3,-169.4],[-158.6,-165.7],[-161.8,-161.8],[-165.1,-158.0],[-168.3,-154.2],[-171.4,-150.3],[-174.4,-146.3],[-177.4,-142.3],[-180.3,-138.2],[-183.1,-134.1],[-185.8,-129.9],[-188.5,-125.7],[-191.2,-121.5],[-193.8,-117.2],[-196.1,-112.7],[-198.3,-108.2],[-200.5,-103.7],[-202.6,-99.2],[-204.7,-94.7],[-206.8,-90.1],[-208.8,-85.6],[-210.9,-81.0],[-212.8,-76.4],[-214.8,-71.8],[-216.6,-67.2],[-218.5,-62.5],[-220.4,-57.9],[-222.1,-53.2],[-223.8,-48.5],[-225.4,-43.8],[-227.1,-39.1],[-228.7,-34.3],[-230.2,-29.5],[-231.6,-24.8],[-233.0,-20.0],[-234.4,-15.1],[-235.6,-10.3],[-236.8,-5.4],[-237.9,-0.6],[-239.1,4.3],[-240.2,9.2],[-241.4,14.0],[-242.5,18.9],[-243.4,23.8],[-244.1,28.8],[-244.7,33.7],[-245.1,38.7],[-245.4,43.7],[-245.5,48.7],[-245.5,53.7],[-245.4,58.7],[-245.2,63.7],[-245.1,68.7],[-244.9,73.7],[-244.7,78.7],[-244.5,83.7],[-244.3,88.7],[-244.0,93.7],[-243.8,98.7],[-243.5,103.7],[-243.3,108.6],[-243.0,113.6],[-242.6,118.6],[-242.1,123.6],[-241.6,128.6],[-241.0,133.5],[-240.4,138.5],[-239.5,143.4],[-238.6,148.3],[-237.6,153.2],[-236.6,158.1],[-235.7,163.0],[-234.7,167.9],[-233.6,172.8],[-232.5,177.7],[-231.3,182.6],[-230.2,187.4],[-228.9,192.3],[-227.7,197.1],[-226.3,201.9],[-225.0,206.8],[-223.5,211.5],[-221.9,216.2],[-220.1,220.9],[-218.4,225.6],[-216.5,230.2],[-214.6,234.9],[-212.6,239.5],[-210.6,244.0],[-208.4,248.5],[-206.3,253.1],[-204.1,257.6],[-201.8,262.0],[-199.1,266.2],[-196.4,270.4],[-193.7,274.6],[-191.0,278.8],[-188.4,283.1],[-185.9,287.4],[-183.4,291.8],[-180.9,296.1],[-178.2,300.3],[-175.4,304.4],[-172.4,308.5],[-169.5,312.5],[-166.6,316.5],[-163.5,320.5],[-160.3,324.3],[-157.1,328.1],[-153.8,331.9],[-150.6,335.8],[-147.3,339.5],[-143.8,343.1],[-140.2,346.6],[-136.5,349.9],[-132.7,353.2],[-128.9,356.5],[-124.9,359.5],[-120.8,362.4],[-116.7,365.2],[-112.6,367.9],[-108.3,370.6],[-104.0,373.2],[-99.8,375.8],[-95.4,378.2],[-90.9,380.4],[-86.4,382.6],[-81.9,384.8],[-77.4,387.0],[-72.9,389.1],[-68.3,391.0],[-63.6,392.8],[-58.9,394.6],[-54.2,396.3],[-49.4,397.7],[-44.6,399.1],[-39.8,400.4],[-34.9,401.5],[-30.0,402.4],[-25.1,402.2],[-21.6,398.8],[-21.0,393.9],[-21.2,388.9],[-21.5,383.9],[-21.7,378.9],[-22.0,373.9],[-22.2,368.9],[-22.5,363.9],[-22.8,358.9],[-23.0,353.9],[-23.3,348.9],[-23.5,343.9],[-23.8,338.9],[-24.0,333.9],[-24.2,328.9],[-24.5,323.9],[-24.7,318.9],[-24.9,314.0],[-25.1,309.0],[-25.4,304.0],[-25.6,299.0],[-25.8,294.0],[-26.1,289.0],[-26.3,284.0],[-26.5,279.0],[-26.7,274.0],[-27.0,269.0],[-27.2,264.0],[-27.4,259.0],[-27.7,254.0],[-27.9,249.0],[-28.1,244.0],[-28.3,239.0],[-28.5,234.0],[-28.9,229.1],[-29.9,224.2],[-31.0,219.3],[-32.1,214.4],[-33.2,209.5],[-33.8,204.6],[-32.7,199.8],[-29.5,196.0],[-25.0,194.0],[-20.0,194.2],[-15.7,196.6],[-12.9,200.7],[-12.2,205.6],[-12.6,210.6],[-13.1,215.6],[-13.6,220.5],[-14.1,225.5],[-13.9,230.5],[-13.2,235.5],[-12.5,240.4],[-11.9,245.4],[-11.2,250.3],[-10.6,255.3],[-9.9,260.2],[-9.2,265.2],[-8.6,270.1],[-7.9,275.1],[-7.2,280.1],[-6.6,285.0],[-5.9,290.0],[-5.2,294.9],[-4.6,299.9],[-3.9,304.8],[-3.2,309.8],[-2.6,314.7],[-1.9,319.7],[-1.3,324.7],[-0.6,329.6],[0.1,334.6],[0.5,339.5],[0.3,344.5],[0.2,349.5],[0.0,354.5],[-0.1,359.5],[0.2,364.5],[2.2,369.0],[6.1,372.1],[10.9,373.2],[15.8,372.0],[19.5,368.8],[21.4,364.2],[21.4,359.2],[20.5,354.3],[19.6,349.4],[18.8,344.4],[18.0,339.5],[17.6,334.5],[17.3,329.5],[17.1,324.5],[16.8,319.5],[16.6,314.6],[16.3,309.6],[16.0,304.6],[15.8,299.6],[15.5,294.6],[15.3,289.6],[15.0,284.6],[14.7,279.6],[14.5,274.6],[14.2,269.6],[14.0,264.6],[13.7,259.6],[13.5,254.6],[13.2,249.6],[12.9,244.6],[12.7,239.7],[12.4,234.7],[12.2,229.7],[11.9,224.7],[11.6,219.7],[11.4,214.7],[11.1,209.7],[10.9,204.7],[10.6,199.7],[10.4,194.7],[10.1,189.7],[9.8,184.7],[9.6,179.7],[9.3,174.7],[9.1,169.8],[8.8,164.8],[8.5,159.8],[8.3,154.8],[8.0,149.8],[7.8,144.8],[7.5,139.8],[7.3,134.8],[7.0,129.8],[6.7,124.8],[6.5,119.8],[6.2,114.8],[6.0,109.8],[5.7,104.8],[5.4,99.8],[5.2,94.9],[4.9,89.9],[4.6,84.9],[4.4,79.9],[4.1,74.9],[3.8,69.9],[3.5,64.9],[3.3,59.9],[3.0,54.9],[2.7,49.9],[2.4,44.9],[2.2,39.9],[1.9,34.9],[1.6,30.0],[1.4,25.0],[1.1,20.0],[0.8,15.0],[0.5,10.0],[0.3,5.0]];
  const HW = 5.5;
  // side roads [metres after the start line, side (-1 left, 1 right), angle to the road ahead (deg; 90 square), half width, kind ('sig'
  // traffic lights on poles and a mast arm over the road, 'stop' stop signs), length drawn beyond the fence, what it is]: the park's roads
  // where OpenStreetMap has them meet the circuit. The two roads up to the avenue north of the park have their traffic lights at the avenue
  // (OSM, 40 m on); here they stand in the mouths too (an approximation), the others are the park's own roads with stop signs
  const JUNCTIONS = [
    [250, -1, 114, 3.2, 'stop', 10, 'park'],     // (250 and 769: the two ends of one short park road between two parts of the circuit, ~55 m)
    [554, 1, 86, 3.5, 'sig', 44, 'avenue'],
    [579, 1, 90, 3.5, 'sig', 44, 'avenue'],
    [769, -1, 92, 3.0, 'stop', 10, 'park'],
    [1062, 1, 85, 3.5, 'sig', 70, 'street'],
    [1276, -1, 87, 3.0, 'stop', 40, 'arena'],
    [1299, 1, 151, 3.0, 'stop', 45, 'park'],
    [1524, 1, 134, 3.5, 'stop', 50, 'elipse'],
  ];
  const JOFF = 11.5;   // the fence across a side road: this far past the road's edge
  const walls = [];
  // a side road's mouth in the track's frame (q: metres along the road from the junction, l: metres out to its side): its centre line at
  // q = l cot(angle), its edges hw / sin(angle) either side of that; the barrier opens from the edge out to the fence over all of it
  const mouth = (ang, hw) => { const a = ang * Math.PI / 180, sn = Math.max(0.35, Math.sin(a)), ct = Math.cos(a) / sn, e = hw / sn, q0 = HW * ct, q1 = (HW + JOFF) * ct;
    return { ct, e, qa: Math.min(q0, q1) - e - 4.5, qb: Math.max(q0, q1) + e + 4.5 }; };
  for (const [d, sd, ang, hw] of JUNCTIONS) { const M = mouth(ang, hw); walls.push([d + M.qa, d + M.qb, sd, JOFF, 3]); }
  // the junctions' street furniture, all of it knockable (World props -> Core's loose props): [metres after the start line, side, kind, metres
  // out from the centre line, facing ('N' its arm over the circuit, 'F' / 'B' along the road ahead / back, 'U' up the side road), colour, the
  // junction]: on the corners either side of the side road's mouth (side -1 before it, 1 after it), along its edges
  const FURN = [];
  JUNCTIONS.forEach(([d, sd, ang, hw, kind, , what], j) => {
    const M = mouth(ang, hw), put = (k, l, side, dq, face, col) => FURN.push([Math.round((d + l * M.ct + side * (M.e + dq)) * 10) / 10, sd, k, l, face, col || 0, j]);
    if (kind === 'sig') {
      put('signal', HW + 1.4, 1, 1.3, 'N');        // after the mouth: its mast arm over the circuit, the heads both ways
      put('signal', HW + 1.4, -1, 1.3, 'F');       // before it: the arm over the side road's mouth
      put('cabinet', HW + 3.4, 1, 3.0, 'U');       // the controller cabinet
      put('sign', HW + 3.6, -1, 1.6, 'B', 2);      // a pedestrian crossing sign (blue)
    } else {
      put('stop', HW + 2.6, -1, 1.0, 'U');         // for the side road's traffic
      put('sign', HW + 4.5, 1, 2.5, 'U', 1);       // a warning sign (yellow)
    }
    put('hydrant', HW + 5.5, 1, 1.6, 'U'); put('bin', HW + 5.0, -1, 1.8, 'U'); put('lamp', HW + 7.5, 1, 1.2, 'B');
    for (let k = 0; k < 3; k++) put('bollard', HW + 0.9 + k * 1.2, -1, 0.6 + k * 0.4, 'U');
    if (what === 'avenue' || what === 'street') put('sign', HW + 6.5, -1, 1.4, 'U', 3);   // the bus stop's sign (green)
  });
  TRACK_DEFS.push({
    id: 'santiago', name: 'Santiago, Čile', theme: 'santiago', laps: 6, halfWidth: HW,
    desc: 'Ulična proga v velikem mestnem parku južno od središča Santiaga, v pravem merilu in v postavitvi iz leta 2020: 2,3 km in 11 zavojev v nasprotni smeri urinega kazalca. Dolga ravnina po tlakovani paradni elipsi, ostri levi in dolgi desni zavoj na začetku kroga, levi zavoji okoli parka pod avenijo, levo-desno med betonskimi zidovi, dolgi levi zavoj okoli dvorane in dve lasnici pred ciljno ravnino. Križišča s semaforji in ulično opremo, ki jo lahko zbiješ, platane in topoli, jezero, mestni bloki in zasnežene Ande na obzorju. Podatki: © OpenStreetMap (ODbL), Copernicus DEM, ESA WorldCover.',
    en: { name: 'Santiago, Chile', desc: 'A street circuit in the big city park south of the centre of Santiago, at full scale and in its layout of 2020: 2.3 km and 11 turns, anticlockwise. A long straight up the paved parade ground, a sharp left and a long right to begin the lap, lefts round the park below the avenue, a left-right between concrete walls, the long left round the arena and two hairpins before the main straight. Junctions with traffic lights and street furniture you can knock over, plane trees and poplars, a lake, the city\'s blocks and the snowy Andes on the horizon. Data: © OpenStreetMap (ODbL), Copernicus DEM, ESA WorldCover.' },   // (the English page: Jezik · Language)
    start: [0, 0], runoff: 0.45, inner: 2.2, side: 2.5, realKm: 2.287, runoffTarmac: true, offSurface: 'paving',
    elev: SCL_H.map((h, i) => [i / SCL_H.length, h / 10]),
    walls, junctions: JUNCTIONS, junctionOff: JOFF, furniture: FURN,
    pitLane: [-70, 140, -17],      // the pit lane on the inside (left) of the straight (scenery: the race has no stops): from, to (metres after the start line), centre offset
    // grandstands [from, to, side, rows, roof]: temporary stands round the Elipse and at the first turns (approximate)
    stands: [[-150, 110, 1, 12, 1], [140, 200, 1, 8, 0], [-330, -250, 1, 8, 0], [1500, 1545, -1, 8, 0]],
    // spectators on the grass [from, to, side]
    ga: [[260, 330, 1], [420, 520, -1], [880, 1000, 1], [1600, 1700, -1]],
    sectors: [700, 1500],
    // named places: [HUD label, x, z, the commentator's lines]; the turns by their numbers only
    names: [
      ['Zavoj 1', -10.1, -181.2, ['Turn one, a sharp left!', 'Hard on the brakes for Turn One!', 'Turn one, the field squeezes in!']],
      ['Zavoj 2', -53.5, -219.1, ['Turn two, the long right!', 'Round the long right of Turn Two!', 'Turn two, and back the other way!']],
      ['Zavoj 3', 75, -230.8, ['Turn three, left and up into the park!', 'Turn three, left!', 'Through Turn Three, under the trees!']],
      ['Zavoj 4', 58.7, -323.4, ['Turn four, left again!', 'Turn four, flat out round the park!', 'Turn four, below the avenue!']],
      ['Zavoj 5', -98, -323.1, ['Turn five, left and down!', 'Turn five, round the corner of the park!', 'Turn five, left!']],
      ['Zavoj 6', -121, -226, ['Turn six, left and the walls close in!', 'Into the left-right of Turn Six!', 'Turn six, narrow here!']],
      ['Zavoj 7', -107.9, -209.2, ['Turn seven, right, the wall on the exit!', 'Turn seven, careful on the exit!', 'Turn seven, through the walls!']],
      ['Zavoj 8', -241.8, 125.9, ['Turn eight, the long left round the arena!', 'Round the arena, Turn Eight!', 'Turn eight, keep it flat round the arena!']],
      ['Zavoj 9', -23, 401.2, ['Turn nine, hard on the brakes, left!', 'Turn nine, onto the parade ground!', 'Turn nine, left!']],
      ['Zavoj 10', -20.2, 194.1, ['Turn ten, the right-hand hairpin!', 'The hairpin of Turn Ten!', 'Turn ten, full lock to the right!']],
      ['Zavoj 11', 10.9, 373.2, ['Turn eleven, the last hairpin!', 'Turn eleven, left and onto the straight!', 'Round Turn Eleven, the lap is nearly done!']],
      { n: 'elipsa', x: 2, z: 120, hud: false, say: ['Down the long parade ground!', 'Flat out up the Elipse!', 'The long straight, the mountains on the right!'] },
    ],
    turns: [[-10.1,-181.2],[-53.5,-219.1],[75,-230.8],[58.7,-323.4],[-98,-323.1],[-121,-226],[-107.9,-209.2],[-241.8,125.9],[-23,401.2],[-20.2,194.1],[10.9,373.2]],   // the apexes of Turns 1-11
    points: SCL_P,
  });
})();
