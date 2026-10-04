/* Track definition 'peking'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // Peking (Beijing), China: the street circuit round the Olympic Green's big stadium, in its first layout (2014: 20 turns, anticlockwise,
  // officially 3.44 km), at full scale. The start line on the boulevard east of the indoor arena (39.99512, 116.38541), the pits on its right,
  // grandstand 1 on its left by the arena. The lap: the start straight north, Turn 1 left onto the road along the arena's north side (the
  // only public road the race closed, ~200 m), Turn 2 left onto the long boulevard west of the arena and the swimming hall, the chicane of
  // Turns 3-5 (removed in 2015), Turn 6 left onto the road south of the venues, the chicane of Turns 7-8, Turn 9 left onto the broad way
  // along the stadium's east side by the long lake, the chicane of Turns 10-13, the long left of Turn 14 round the stadium, Turn 15 left onto
  // the plaza north of it, the chicane of Turns 16-19, the last corner (Turn 20) right onto the start straight.
  // Reconstructed: no open map of the circuit could be read (see README), so the course is laid on the OpenStreetMap roads of the Olympic
  // Green that fit everything the sources say: round the stadium, the swimming hall and the arena; between the stadium and the swimming hall;
  // the park's own roads but ~200 m of the public road north of the arena; anticlockwise; grandstand 1 by the arena, facing the pits and the
  // start line. The roads: © OpenStreetMap contributors (ODbL 1.0), read through Overture Maps; the centre lines of dual carriageways
  // averaged, the corners rounded, the four chicanes laid on the straights where the sources put them (their exact shape an approximation).
  // Metres, origin = the start line, x east, z south. Flat (the Olympic Green lies ~47 m above the sea, level within a metre or two).
  // The turns by their numbers only (no names of people, events, venues or sponsors).
  const HW = 6.0, LAP = 3349.9;
  // side roads [metres after the start line, side (-1 left, 1 right), angle to the road ahead (deg; 90 square, < 90 leaning ahead), half width,
  // kind ('sig' traffic lights, 'plain', 'ped' a plaza crossing), length drawn beyond the fence, what it is]: where the OpenStreetMap roads
  // meet the circuit (the arms straight on at the corners included); 'sig' where OSM has traffic signals at the junction
  const JUNCTIONS = [
    [140, 1, 95, 7, 'sig', 60, 'road'],           // Turn 1: the road on east along the arena's north side (public)
    [161, 1, 55, 9, 'sig', 60, 'avenue'],         // Turn 1: the boulevard on north (straight on)
    [210, -1, 88, 3, 'plain', 30, 'service'],     // the arena's service road
    [338, -1, 89, 3, 'plain', 30, 'service'],
    [372, 1, 110, 7, 'sig', 60, 'avenue'],        // Turn 2: the west boulevard on north
    [387, 1, 65, 7, 'sig', 60, 'road'],           // Turn 2: the road on west
    [559, 1, 90, 6, 'plain', 50, 'road'],         // the road west from the arena's south side
    [758, 1, 90, 12, 'sig', 70, 'avenue'],        // the avenue across the park (west arm)
    [758, -1, 90, 7, 'sig', 60, 'road'],          // (east arm, between the arena and the swimming hall)
    [819, 1, 90, 3, 'plain', 30, 'service'],
    [962, 1, 91, 10, 'sig', 60, 'avenue'],        // the road west from the swimming hall
    [1056, 1, 90, 3, 'plain', 30, 'service'],
    [1168, 1, 90, 6, 'sig', 50, 'road'],
    [1302, 1, 45, 8, 'sig', 60, 'avenue'],        // Turn 6: the west boulevard on south to the ring road
    [1533, -1, 90, 11, 'sig', 70, 'avenue'],      // the start straight's boulevard, its south half
    [1619, 1, 68, 7, 'plain', 45, 'ramp'],        // the ramp up to the bridge over the ring road
    [1671, 1, 90, 12, 'ped', 30, 'plaza'],        // the park's great north-south axis (a paved plaza)
    [1671, -1, 90, 12, 'ped', 30, 'plaza'],
    [1990, 1, 54, 6, 'plain', 45, 'road'],        // Turn 9: the road on east over the lake's bridge
    [2611, 1, 40, 5, 'ped', 30, 'plaza'],         // Turn 15: the broad way straight on north
    [2987, 1, 99, 12, 'ped', 30, 'plaza'],        // the great axis again
    [2989, -1, 81, 12, 'ped', 30, 'plaza'],
    [3117, -1, 116, 12, 'sig', 70, 'avenue'],     // Turn 20: the start straight's boulevard on south
    [3133, -1, 60, 7, 'sig', 60, 'road'],         // Turn 20: the road on west (straight on)
  ];
  const JOFF = 12;   // the fence across a side road: this far past the road's edge
  const walls = [];
  walls.push([-165, 96, 1, 1.4, 6]);   // the pit wall
  // a side road's mouth in the track's frame (q: metres along the road from the junction, l: metres out to its side): its centre line at
  // q = l cot(angle), its edges hw / sin(angle) either side of that; the barrier opens from the edge out to the fence over all of it
  const mouth = (ang, hw) => { const a = ang * Math.PI / 180, ct = Math.cos(a) / Math.sin(a), e = hw / Math.sin(a), q0 = HW * ct, q1 = (HW + JOFF) * ct;
    return { ct, e, qa: Math.min(q0, q1) - e - 4.5, qb: Math.max(q0, q1) + e + 4.5 }; };
  for (const [d, sd, ang, hw] of JUNCTIONS) { const M = mouth(ang, hw); walls.push([d + M.qa, d + M.qb, sd, JOFF, 3]); }
  // the junctions' street furniture, all of it knockable (World props -> Core's loose props): [metres after the start line, side, kind, metres
  // out from the centre line, facing ('N' its arm over the circuit, 'F' / 'B' along the road ahead / back, 'U' up the side road), colour, the
  // junction]: on the corners either side of the side road's mouth (side -1 before it, 1 after it), along its edges. In the Chinese way:
  // signals on poles with long arms over the road, a controller cabinet, round signs (white with a red ring, or blue), guard railings along
  // the corners, red hydrants, paired litter bins, street lamps, bollards in front of the plazas
  const FURN = [];
  JUNCTIONS.forEach(([d, sd, ang, hw, kind, , what], j) => {
    const M = mouth(ang, hw), put = (k, l, side, dq, face, col) => FURN.push([Math.round((d + l * M.ct + side * (M.e + dq)) * 10) / 10, sd, k, l, face, col || 0, j]);
    if (kind === 'sig') {
      put('signal', HW + 1.5, 1, 1.4, 'N');                 // after the mouth: its arm over the circuit, the heads both ways
      put('signal', HW + 1.5, -1, 1.4, 'U');                // before it: the arm over the side road's mouth
      put('cabinet', HW + 4.0, 1, 3.2, 'U');                // the controller cabinet
      put('sign', HW + 3.0, -1, 1.5, 'B', what === 'avenue' ? 1 : 0);   // a round sign: blue (an avenue's lanes), white with the red ring (no entry)
      for (let k = 0; k < 2; k++) { put('railing', HW + 6.5 + k * 2.1, -1, 0.7, 'U'); put('railing', HW + 6.5 + k * 2.1, 1, 0.7, 'U'); }   // guard railings along the corners
      put('lamp', HW + 9.5, 1, 1.4, 'B');
      if (what === 'avenue') { put('signal', HW + 10.5, -1, 1.2, 'F'); put('sign', HW + 8.5, 1, 2.6, 'U', 1); }   // a second pole on the far corner; a lane sign
    } else if (kind === 'plain') {
      put('sign', HW + 2.6, -1, 1.2, 'U');
      for (let k = 0; k < 2; k++) put('bollard', HW + 1.2 + k * 1.4, 1, 0.6, 'U');
    } else {   // a plaza: a row of bollards across it, lamps, a sign
      for (let k = 0; k < 5; k++) FURN.push([Math.round((d + (HW + 4.5) * M.ct + (k - 2) * M.e * 0.42) * 10) / 10, sd, 'bollard', HW + 4.5, 'U', 0, j]);
      put('lamp', HW + 2.0, 1, 1.0, 'B'); put('lamp', HW + 2.0, -1, 1.0, 'F'); put('sign', HW + 6.0, -1, 1.2, 'U', 1);
    }
    if (kind !== 'ped') { put('hydrant', HW + 5.5, 1, 1.6, 'U'); put('bin', HW + 5.2, -1, 1.9, 'U'); }
    else put('bin', HW + 7.5, 1, 1.4, 'U');
    if (what === 'avenue' || what === 'road') put('bollard', HW + 1.0, -1, 0.5, 'U');
    if (what === 'avenue' && j % 2 === 0) put('shelter', HW + 8.5, 1, 4.5, 'U');   // a bus stop's shelter by the bigger junctions
  });
  TRACK_DEFS.push({
    id: 'peking', name: 'Peking, Kitajska', theme: 'peking', laps: 4, halfWidth: HW,
    desc: 'Ulična proga okoli velikega stadiona v olimpijskem parku v Pekingu, v prvi postavitvi iz leta 2014: 3,4 km in 20 ovinkov v nasprotni smeri urinega kazalca. Široki bulvarji med betonskimi zidovi, štiri šikane, križišča s semaforji in ulično opremo, ki jo avto podre, ob progi stadion z jekleno mrežo, plavalna dvorana, dolgo jezero in stolpi v meglici.',
    en: { name: 'Beijing, China', desc: 'A street circuit round the big stadium in the Olympic park in Beijing, in its first layout of 2014: 3.4 km and 20 turns, anticlockwise. Broad boulevards between concrete walls, four chicanes, junctions with traffic lights and street furniture the car knocks over, and by the circuit the stadium in its steel lattice, the swimming hall, the long lake and towers in the haze.' },
    start: [0, 0], runoff: 0.35, inner: 1.6, side: 1.8, realKm: 3.44, runoffTarmac: true, offSurface: 'paving',
    walls, junctions: JUNCTIONS, junctionOff: JOFF, furniture: FURN,
    // pit lane on the right of the start straight, beside the paved axis (the real one turned in a U round a spectators' enclosure: here straight,
    // an approximation): [centre offset to the right, from, to, the player's box, a long way in]
    pit: [14, -190, 118, 25, 40],
    pitRow: [-120, 70],            // the first and the last of the crews' boxes
    // grandstands [from, to, side, rows, roof]: grandstand 1 on the left of the start straight by the arena (its entrance inside the arena),
    // the bleachers at Turn 1 and at the chicane of Turns 10-13 (approximate places)
    stands: [[-120, 70, -1, 14, 1], [115, 148, -1, 9, 0], [2085, 2165, -1, 10, 0], [1270, 1295, -1, 8, 0]],
    // spectators on the plazas [from, to, side]
    ga: [[1640, 1700, -1], [1640, 1700, 1], [2200, 2350, -1], [2470, 2580, -1], [2700, 2800, 1], [2950, 3030, -1], [2950, 3030, 1], [1880, 1960, 1], [860, 900, -1]],
    sectors: [1100, 2300],
    // the boulevards beside the circuit [metres after the start line, left, right]: how far the OSM carriageways reach from the centre line
    street: [[0,12.1,12],[20,12.2,12],[40,12.2,12],[60,12.3,12],[80,12.3,12.1],[100,12.3,12.1],[120,12.4,12.1],[140,12.4,12.1],[160,10.5,13],[180,10.5,15.5],[200,10.5,15.5],[220,10.5,15.5],[240,10.5,15.5],[260,10.6,15.5],[280,10.6,15.5],[300,10.6,15.5],[320,10.6,15.5],[340,10.6,15.5],[360,10.6,15.5],[380,9.2,9.9],[400,9.2,9.9],[420,9.2,9.9],[440,9.2,9.9],[460,9.2,9.8],[480,9.2,9.8],[500,9.2,9.8],[520,9.3,9.8],[540,9.3,9.8],[560,6.3,6],[580,6.2,6],[600,6.2,6],[620,6.2,6],[640,6.2,6],[660,6.2,6],[680,6.2,6],[700,6.2,6],[720,6.2,6],[740,6.2,6.2],[760,7.2,8.2],[780,8.9,9.9],[800,8.9,9.9],[820,9,9.8],[840,9,9.7],[860,9,6],[880,9.1,6],[900,9.1,9.4],[920,9.2,9.3],[940,9.2,9.3],[960,9.1,9.3],[980,9.1,9.3],[1000,9.4,8.9],[1020,9.8,8.5],[1040,10.3,8.1],[1060,10.5,7.9],[1080,10.4,8],[1100,10.1,8.2],[1120,9.8,8.5],[1140,9.6,8.7],[1160,9.3,9],[1180,9.2,9.1],[1200,9.2,9.1],[1220,9.2,9.1],[1240,9.2,9.1],[1260,9.1,9.1],[1280,9,9.2],[1300,6,7],[1320,6,6.4],[1340,6,6.3],[1360,6,6.2],[1380,6,6.1],[1400,6,6.1],[1420,6,6],[1440,6,6],[1460,6,6],[1480,6,6],[1500,6,6],[1520,6,6],[1540,6,6],[1560,6,6],[1580,6,6],[1600,6,6.1],[1620,6,6.1],[1640,6,6],[1660,6,6],[1680,6,6],[1700,6,6],[1720,6,6.1],[1740,6,6],[1760,6,6],[1780,6,6],[1800,6,6],[1820,6,6],[1840,6,6],[1860,6,6],[1880,6,6],[1900,6,6],[1920,6,6],[1940,6,6],[1960,6,6],[1980,6,6],[2000,6,6],[2020,6,6],[2040,6,6],[2060,6,6],[2080,6,6],[2100,6,6],[2120,6,6],[2140,6,6],[2160,6,10.1],[2180,6,10.1],[2200,6,8],[2220,6,6],[2240,6,6],[2260,6,6],[2280,6,6],[2300,6,6],[2320,6,6],[2340,6,6],[2360,6,6],[2380,6,6],[2400,6,6],[2420,6,6],[2440,6,6],[2460,6,6],[2480,6,6],[2500,6,6],[2520,6,6],[2540,6,6],[2560,6,6],[2580,6,6],[2600,6,6],[2620,6,6],[2640,6,6],[2660,6,6],[2680,6,6],[2700,6,6],[2720,6,6],[2740,6,6],[2760,6,6],[2780,6,6],[2800,6,6],[2820,6,6],[2840,6,6],[2860,6,6],[2880,6,6],[2900,9.9,6],[2920,9.9,6],[2940,8.9,6],[2960,7.1,6],[2980,6,6],[3000,6,6],[3020,6,6],[3040,6,6],[3060,6,6],[3080,6,6],[3100,6,6],[3120,6,6],[3140,11.7,11.7],[3160,11.7,11.8],[3180,11.7,11.8],[3200,11.8,11.8],[3220,11.8,11.8],[3240,11.9,11.9],[3260,11.9,11.9],[3280,12,11.9],[3300,12,11.9],[3320,12,11.9],[3340,12.1,12]],
    // named places: [HUD label, x, z, the commentator's lines]; the turns by their numbers only, no names of the venues
    names: [
      ['Zavoj 1', -10.8, -152.2, ['Turn one, hard left off the start straight!', 'Into Turn One, the field squeezes in!', 'Turn one, a square left by the arena!']],
      ['Zavoj 2', -235.8, -144.9, ['Turn two, left onto the long boulevard!', 'Round Turn Two, left again!', 'Turn two, ninety degrees and the walls are close!']],
      ['Zavoj 3', -222.8, 322.0, ['The first chicane, Turns Three to Five!', 'Flick right and left through the chicane!', 'Into the chicane, mind the walls!']],
      ['Zavoj 6', -201.8, 770.5, ['Turn six, left at the end of the boulevard!', 'Hard on the brakes for Turn Six!', 'Turn six, and along the south side!']],
      ['Zavoj 7', 359.7, 748.3, ['The second chicane, Turns Seven and Eight!', 'Through the chicane past the plaza!', 'Turns seven and eight, a quick flick!']],
      ['Zavoj 9', 481.6, 738.4, ['Turn nine, left towards the lake!', 'Turn nine, and the stadium comes into view!', 'Left at Turn Nine, by the water!']],
      ['Zavoj 10', 518.5, 639.8, ['The chicane of Turns Ten to Thirteen!', 'Left, right, left, right, by the stadium!', 'Through the long chicane, the fans are right there!']],
      ['Zavoj 14', 594.2, 362.8, ['Turn fourteen, the long left round the stadium!', 'Sweeping round the stadium at Turn Fourteen!', 'Turn fourteen, the steel lattice towering over the cars!']],
      ['Zavoj 15', 526.5, 163.2, ['Turn fifteen, left onto the plaza!', 'Turn fifteen, and behind the stadium!', 'Left at Turn Fifteen!']],
      ['Zavoj 16', 291.5, 188.1, ['The last chicane, Turns Sixteen to Nineteen!', 'Into the last chicane!', 'Right, left, right, left, and the last corner next!']],
      ['Zavoj 20', 12.1, 218.7, ['The last corner, Turn Twenty!', 'Turn twenty, and onto the start straight!', 'Round the last corner, the lap is nearly done!']],
      { n: 'stadion', x: 600, z: 410, hud: false, say: ['Past the giant stadium and its steel lattice!', 'The big stadium on the left!', 'Under the shadow of the great stadium!'] },
      { n: 'plavalna dvorana', x: -225, z: 400, hud: false, say: ['Past the swimming hall, all those bubbles!', 'The swimming hall on the left!', 'Along the boulevard by the swimming hall!'] },
      { n: 'jezero', x: 530, z: 640, hud: false, say: ['Along the lake!', 'The long lake on the right!', 'Water on one side, the stadium on the other!'] },
    ],
    turns: [[-10.8,-152.2],[-235.8,-144.9],[-222.8,322.0],[-229.7,341.3],[-221.5,360.0],[-201.8,770.5],[359.7,748.3],[378.0,753.6],[481.6,738.4],[518.5,639.8],[521.4,620.8],[537.4,605.6],[539.4,587.6],[594.2,362.8],[526.5,163.2],[291.5,188.1],[272.1,183.7],[253.7,191.8],[235.1,187.5],[12.1,218.7]],   // the apexes of Turns 1-20 (their number boards)
    points: [[0,0],[-0.2,-5],[-0.4,-10],[-0.6,-15],[-0.8,-20],[-1,-25],[-1.2,-30],[-1.3,-35],[-1.5,-40],[-1.7,-45],[-1.9,-50],[-2.1,-55],[-2.3,-60],[-2.5,-64.9],[-2.7,-69.9],[-2.9,-74.9],[-3.1,-79.9],[-3.3,-84.9],[-3.5,-89.9],[-3.6,-94.9],[-3.8,-99.9],[-4,-104.9],[-4.2,-109.9],[-4.4,-114.9],[-4.6,-119.9],[-4.8,-124.9],[-5,-129.9],[-5.2,-134.9],[-5.4,-139.9],[-6,-144.8],[-8.1,-149.3],[-11.7,-152.8],[-16.2,-154.8],[-21.2,-155.2],[-26.2,-155],[-31.2,-154.9],[-36.2,-154.7],[-41.2,-154.6],[-46.2,-154.4],[-51.2,-154.3],[-56.2,-154.1],[-61.2,-154],[-66.2,-153.8],[-71.2,-153.7],[-76.2,-153.5],[-81.2,-153.4],[-86.2,-153.2],[-91.2,-153.1],[-96.2,-152.9],[-101.2,-152.8],[-106.2,-152.6],[-111.2,-152.5],[-116.2,-152.3],[-121.2,-152.2],[-126.2,-152],[-131.1,-151.9],[-136.1,-151.7],[-141.1,-151.6],[-146.1,-151.4],[-151.1,-151.3],[-156.1,-151.1],[-161.1,-151],[-166.1,-150.8],[-171.1,-150.7],[-176.1,-150.5],[-181.1,-150.4],[-186.1,-150.2],[-191.1,-150.1],[-196.1,-149.9],[-201.1,-149.8],[-206.1,-149.6],[-211.1,-149.5],[-216.1,-149.3],[-221.1,-149.2],[-226.1,-149],[-231,-148.2],[-235.2,-145.5],[-238,-141.4],[-238.9,-136.5],[-238.7,-131.5],[-238.6,-126.5],[-238.4,-121.5],[-238.2,-116.5],[-238.1,-111.5],[-237.9,-106.5],[-237.8,-101.5],[-237.6,-96.5],[-237.4,-91.6],[-237.3,-86.6],[-237.1,-81.6],[-236.9,-76.6],[-236.8,-71.6],[-236.6,-66.6],[-236.4,-61.6],[-236.3,-56.6],[-236.1,-51.6],[-235.9,-46.6],[-235.8,-41.6],[-235.6,-36.6],[-235.5,-31.6],[-235.3,-26.6],[-235.1,-21.6],[-235,-16.6],[-234.8,-11.6],[-234.6,-6.6],[-234.5,-1.6],[-234.3,3.4],[-234.1,8.4],[-234,13.4],[-233.8,18.4],[-233.6,23.4],[-233.5,28.4],[-233.3,33.4],[-233.1,38.4],[-232.9,43.4],[-232.7,48.4],[-232.5,53.4],[-232.3,58.4],[-232.1,63.4],[-231.9,68.3],[-231.7,73.3],[-231.5,78.3],[-231.3,83.3],[-231.1,88.3],[-230.9,93.3],[-230.7,98.3],[-230.5,103.3],[-230.4,108.3],[-230.2,113.3],[-230,118.3],[-229.8,123.3],[-229.6,128.3],[-229.4,133.3],[-229.2,138.3],[-229,143.3],[-228.8,148.3],[-228.6,153.3],[-228.4,158.3],[-228.2,163.3],[-228,168.3],[-227.8,173.3],[-227.6,178.3],[-227.4,183.3],[-227.2,188.2],[-227,193.2],[-226.8,198.2],[-226.6,203.2],[-226.4,208.2],[-226.2,213.2],[-226,218.2],[-225.7,223.2],[-225.5,228.2],[-225.3,233.2],[-225.2,238.2],[-225,243.2],[-224.9,248.2],[-224.8,253.2],[-224.7,258.2],[-224.5,263.2],[-224.3,268.2],[-224.1,273.2],[-224,278.2],[-223.8,283.2],[-223.6,288.2],[-223.4,293.2],[-223.3,298.2],[-223.1,303.2],[-222.9,308.2],[-222.7,313.2],[-222.6,318.2],[-223.1,323.1],[-224.9,327.8],[-227.2,332.2],[-229.1,336.8],[-229.6,341.8],[-228.4,346.6],[-226,351],[-223.5,355.3],[-221.5,359.9],[-220.9,364.8],[-220.7,369.8],[-220.5,374.8],[-220.4,379.8],[-220.2,384.8],[-220,389.8],[-219.8,394.8],[-219.7,399.8],[-219.5,404.8],[-219.3,409.8],[-219.1,414.8],[-218.9,419.8],[-218.8,424.8],[-218.5,429.8],[-218.2,434.8],[-217.9,439.8],[-217.7,444.8],[-217.6,449.8],[-217.5,454.8],[-217.5,459.8],[-217.4,464.8],[-217.3,469.8],[-217.2,474.8],[-217.1,479.8],[-217,484.8],[-216.9,489.8],[-216.9,494.7],[-216.8,499.7],[-216.7,504.7],[-216.6,509.7],[-216.5,514.7],[-216.4,519.7],[-216.3,524.7],[-216.2,529.7],[-215.9,534.7],[-215.7,539.7],[-215.4,544.7],[-215.2,549.7],[-214.9,554.7],[-214.7,559.7],[-214.4,564.7],[-214.2,569.7],[-213.9,574.7],[-213.7,579.7],[-213.4,584.7],[-213.1,589.7],[-212.9,594.7],[-212.6,599.6],[-212.4,604.6],[-212.1,609.6],[-211.9,614.6],[-211.6,619.6],[-211.4,624.6],[-211.1,629.6],[-210.9,634.6],[-210.6,639.6],[-210.4,644.6],[-210.3,649.6],[-210.1,654.6],[-209.9,659.6],[-209.7,664.6],[-209.5,669.6],[-209.3,674.6],[-209.1,679.6],[-208.9,684.6],[-208.8,689.6],[-208.6,694.6],[-208.4,699.6],[-208.2,704.5],[-208,709.5],[-207.8,714.5],[-207.6,719.5],[-207.4,724.5],[-207.2,729.5],[-206.9,734.5],[-206.7,739.5],[-206.5,744.5],[-206.3,749.5],[-206.1,754.5],[-205.9,759.5],[-205.3,764.4],[-203.1,768.9],[-199.5,772.4],[-195,774.3],[-190,774.7],[-185,774.6],[-180,774.4],[-175,774.2],[-170,774.1],[-165,773.9],[-160,773.8],[-155,773.6],[-150,773.4],[-145,773.3],[-140,773.1],[-135,773],[-130,772.8],[-125,772.6],[-120,772.5],[-115,772.4],[-110,772.2],[-105,772.1],[-100.1,772],[-95.1,771.8],[-90.1,771.7],[-85.1,771.5],[-80.1,771.4],[-75.1,771.3],[-70.1,771.1],[-65.1,771],[-60.1,770.9],[-55.1,770.7],[-50.1,770.6],[-45.1,770.4],[-40.1,770.3],[-35.1,770.2],[-30.1,770],[-25.1,769.9],[-20.1,769.8],[-15.1,769.6],[-10.1,769.5],[-5.1,769.3],[-0.1,769.2],[4.9,769.1],[9.9,768.9],[14.9,768.8],[19.9,768.7],[24.9,768.5],[29.9,768.3],[34.9,768.2],[39.9,768],[44.9,767.8],[49.9,767.6],[54.9,767.5],[59.9,767.3],[64.9,767.1],[69.9,766.9],[74.9,766.7],[79.9,766.6],[84.9,766.4],[89.9,766.2],[94.9,766],[99.8,765.8],[104.8,765.7],[109.8,765.5],[114.8,765.3],[119.8,765.1],[124.8,764.9],[129.8,764.8],[134.8,764.6],[139.8,764.4],[144.8,764.2],[149.8,764],[154.8,763.9],[159.8,763.7],[164.8,763.5],[169.8,763.3],[174.8,763],[179.8,762.6],[184.8,762.3],[189.8,762],[194.7,761.7],[199.7,761.1],[204.6,759.9],[209.4,758.7],[214.2,757.4],[219.1,756.2],[223.9,754.9],[228.8,753.8],[233.7,753.1],[238.7,752.8],[243.7,752.6],[248.7,752.4],[253.7,752.2],[258.7,752.1],[263.7,751.9],[268.7,751.7],[273.7,751.5],[278.7,751.3],[283.7,751.1],[288.7,751],[293.7,751],[298.7,750.9],[303.7,750.7],[308.7,750.5],[313.7,750.2],[318.7,750],[323.7,749.7],[328.6,749.5],[333.6,749.2],[338.6,749],[343.6,748.7],[348.6,748.5],[353.6,748.2],[358.6,748.2],[363.5,749.2],[368.3,750.7],[373,752.4],[377.8,753.5],[382.8,753.7],[387.8,753.4],[392.8,752.8],[397.7,752.1],[402.7,751.3],[407.6,750.4],[412.5,749.4],[417.4,748.4],[422.3,747.4],[427.2,746.4],[432.1,745.5],[437,744.7],[442,744.1],[447,743.6],[452,743.3],[457,743],[461.9,742.8],[466.9,742.5],[471.9,742.2],[476.8,741.2],[481.1,738.8],[484.5,735.1],[486.6,730.6],[488,725.8],[489.3,721],[490.6,716.1],[491.9,711.3],[493.2,706.5],[494.4,701.6],[495.7,696.8],[497,692],[498.3,687.2],[500,682.4],[501.9,677.8],[503.9,673.2],[505.8,668.6],[507.8,664],[509.8,659.4],[511.7,654.8],[513.7,650.2],[515.8,645.7],[518,641.2],[519.1,636.4],[519.3,631.4],[519.6,626.4],[521,621.6],[523.9,617.6],[527.9,614.5],[532,611.7],[535.6,608.3],[538,604],[538.8,599],[538.8,594],[539.2,589.1],[540.7,584.3],[543,579.9],[545.4,575.5],[547.7,571.1],[550,566.6],[552.2,562.1],[554.4,557.7],[556.7,553.2],[559.1,548.8],[561.5,544.4],[563.8,540],[566.2,535.6],[568.5,531.2],[570.8,526.7],[573,522.2],[575.1,517.7],[577.1,513.1],[578.8,508.4],[580,503.6],[581.1,498.7],[582.3,493.8],[583.4,489],[584.6,484.1],[585.8,479.2],[586.9,474.4],[588.1,469.5],[589.2,464.6],[589.7,459.7],[590.3,454.7],[590.8,449.7],[591.4,444.8],[591.9,439.8],[592.4,434.8],[593,429.8],[593.5,424.9],[594.1,419.9],[594.3,414.9],[594.3,409.9],[594.3,404.9],[594.3,399.9],[594.3,394.9],[594.3,389.9],[594.3,384.9],[594.3,379.9],[594.3,374.9],[594.3,369.9],[594.3,364.9],[593.9,359.9],[593.2,355],[592.6,350],[591.9,345.1],[591.3,340.1],[590.6,335.2],[589.9,330.2],[589.2,325.3],[588.3,320.3],[587.3,315.4],[586.4,310.5],[585.5,305.6],[584.6,300.7],[583.7,295.8],[582.6,290.9],[581.4,286],[580.1,281.2],[578.9,276.4],[577.6,271.5],[576.3,266.7],[575.1,261.8],[573.8,257],[572.2,252.3],[570.5,247.6],[568.7,242.9],[567,238.2],[565.2,233.6],[563.3,228.9],[561.4,224.3],[559.5,219.7],[557.6,215],[555.5,210.5],[553.3,206],[551.1,201.5],[548.9,197],[546.7,192.5],[544.5,188.1],[542.3,183.6],[539.7,179.3],[537.2,175],[534.6,170.7],[531.5,166.8],[527.5,163.8],[522.9,161.8],[518,161.1],[513,161.5],[508.1,162.2],[503.1,162.8],[498.1,163.4],[493.2,164.1],[488.2,164.7],[483.3,165.3],[478.3,165.9],[473.3,166.5],[468.4,167.1],[463.4,167.7],[458.4,168.2],[453.5,168.8],[448.5,169.4],[443.5,170],[438.6,170.6],[433.6,171.2],[428.6,171.8],[423.7,172.4],[418.7,173.1],[413.8,173.7],[408.8,174.2],[403.8,174.8],[398.9,175.4],[393.9,175.9],[388.9,176.5],[384,177.1],[379,177.7],[374,178.3],[369.1,178.9],[364.1,179.5],[359.1,180.1],[354.2,180.7],[349.2,181.3],[344.3,181.9],[339.3,182.5],[334.3,183.1],[329.4,183.7],[324.4,184.3],[319.4,184.9],[314.5,185.5],[309.5,186.1],[304.5,186.6],[299.6,187.2],[294.6,187.8],[289.6,188.2],[284.8,187.1],[280.1,185.2],[275.3,183.8],[270.4,184],[265.8,186.1],[261.6,188.7],[257.2,191],[252.3,191.8],[247.4,190.7],[242.8,188.9],[238,187.6],[233,187.7],[228,188.3],[223.1,189],[218.1,189.8],[213.2,190.6],[208.3,191.4],[203.3,192.3],[198.5,193.4],[193.6,194.5],[188.7,195.7],[183.9,196.8],[179,198],[174.1,199.2],[169.3,200.3],[164.4,201.4],[159.5,202.5],[154.6,203.6],[149.7,204.6],[144.8,205.6],[139.9,206.5],[135,207.3],[130,208.1],[125.1,208.8],[120.1,209.4],[115.2,210.1],[110.2,210.8],[105.3,211.5],[100.3,212.2],[95.4,212.9],[90.4,213.6],[85.5,214.3],[80.5,214.9],[75.6,215.6],[70.6,216.3],[65.7,217],[60.7,217.7],[55.7,218.4],[50.8,219.1],[45.8,219.8],[40.9,220.4],[35.9,221.1],[31,221.8],[26,222.5],[21.1,222.8],[16.2,221.6],[12.2,218.8],[9.3,214.7],[8.1,209.8],[7.9,204.8],[7.7,199.8],[7.5,194.8],[7.3,189.9],[7.1,184.9],[6.9,179.9],[6.7,174.9],[6.5,169.9],[6.3,164.9],[6.1,159.9],[5.9,154.9],[5.8,149.9],[5.6,144.9],[5.4,139.9],[5.2,134.9],[5,129.9],[4.8,124.9],[4.6,119.9],[4.4,114.9],[4.2,109.9],[4,104.9],[3.8,99.9],[3.6,94.9],[3.5,89.9],[3.3,84.9],[3.1,79.9],[2.9,74.9],[2.7,69.9],[2.5,64.9],[2.3,60],[2.1,55],[1.9,50],[1.7,45],[1.5,40],[1.3,35],[1.2,30],[1,25],[0.8,20],[0.6,15],[0.4,10],[0.2,5]],
  });
})();
