/* Track definition 'capetown'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // Cape Town, Western Cape, South Africa: the street circuit of Green Point by the Atlantic (2.921 km, 12 turns, anticlockwise), in its real
  // layout and scale as raced in February 2023: the start line and the grid on Vlei Road behind the athletics stadium's grandstand (-33.90394,
  // 18.40769), the pit lane on its LEFT (scenery: the game's pit stops are on the right); Turn 1 a sharp left onto the boulevard south of the
  // park, Turns 2 and 3 left round the north side of the big traffic circle onto the boulevard to the Waterfront, the chicane round the small
  // traffic circle (Turns 4-6, left-right-left), Turn 7 left in the roundabout onto Beach Road, the kink of Turn 8 and the fast left of Turn 9
  // by the sea at Granger Bay, the long straight along the coast of Mouille Point, Turn 10 the sharp left off Beach Road, the left of Turn 11
  // and the right of Turn 12 back onto Vlei Road. The streets as the race used them: one carriageway of the boulevards (the one in the race's
  // direction, the cars drive on the left in South Africa), the side streets closed at their mouths by fences.
  // Centre line: the OpenStreetMap streets (© OpenStreetMap contributors, ODbL; via Overture Maps, its OpenStreetMap features only) along
  // the route of the race (the route by street names, the turn numbers and the length of the published descriptions), joined and smoothed
  // (the junctions' corners rounded to 14-16 m, the chicane drawn round the small circle's island): 2.925 km along the streets' axes, 2.870 km
  // as smoothed. Metres, origin = the start line, x east, z south. Heights (CPT_H, every 1/479 of the lap from points[0], decimetres above
  // the start line, 9.7 m a.s.l.): Copernicus DEM GLO-30 along the road (the lowest across it, smoothed): the coast road 5 m below the start,
  // the boulevards up to 4.5 m above it. The turns by their numbers only (no names of people, events or sponsors; the streets named after
  // people are not named).
  // def.junctions: the side streets the circuit passes (the OpenStreetMap streets meeting it; the signalised ones where OSM has its traffic
  // signals: Vlei Road at Turn 1, the junction of the boulevard with the roads to Portswood and the park, Beach Road at Turn 10; give way at
  // the two traffic circles and the roundabout; zebra crossings where OSM has them; stop signs elsewhere): [metres after the start line, side
  // (-1 left, 1 right), angle to the road ahead (deg; 90 square), half width, kind, length drawn beyond the fence, what]. The barrier opens
  // into each mouth up to a fence across the side street; the street furniture stands on the mouth's corners, all of it knockable.
  const CPT_H = [0,-1,-1,-1,-2,-2,-2,-3,-3,-3,-3,-3,-3,-3,-2,-2,-2,-2,-1,-1,0,0,1,1,2,3,4,4,5,6,7,8,9,9,10,12,13,14,15,16,17,18,19,20,21,22,22,23,24,24,25,25,26,26,27,27,28,28,29,29,29,30,30,31,31,32,32,33,33,34,35,35,36,37,37,38,39,40,40,41,41,41,42,42,42,42,42,42,42,42,42,42,43,43,43,44,44,44,44,43,43,43,42,41,41,40,39,39,38,38,37,37,37,37,37,37,37,37,38,38,39,40,40,41,42,42,42,43,43,42,42,42,42,42,41,41,41,41,41,41,41,40,40,40,40,41,41,41,42,43,43,44,44,45,45,45,44,44,43,43,42,41,41,41,40,40,40,40,39,39,39,38,38,37,37,37,36,36,36,37,37,37,37,37,37,37,37,37,36,36,35,35,35,35,34,34,34,34,34,34,34,34,33,33,32,32,31,30,29,28,27,26,25,25,24,23,23,22,22,22,22,22,22,22,22,22,22,22,21,21,21,20,19,18,17,15,14,12,11,9,8,7,5,4,3,1,0,-2,-4,-6,-8,-11,-13,-15,-17,-18,-20,-21,-22,-23,-24,-25,-25,-25,-26,-26,-25,-25,-25,-24,-24,-23,-23,-22,-22,-22,-22,-22,-22,-22,-23,-23,-23,-24,-24,-24,-24,-24,-24,-24,-23,-23,-23,-23,-22,-22,-23,-23,-23,-24,-25,-26,-27,-28,-29,-31,-32,-33,-34,-34,-35,-35,-34,-34,-33,-32,-31,-31,-30,-30,-30,-31,-32,-33,-34,-36,-37,-39,-40,-42,-43,-44,-45,-46,-47,-47,-48,-48,-48,-48,-48,-48,-48,-47,-47,-47,-47,-47,-47,-47,-47,-47,-47,-47,-47,-47,-47,-47,-47,-47,-46,-46,-45,-44,-43,-41,-39,-36,-34,-30,-27,-24,-22,-19,-17,-16,-16,-16,-16,-17,-18,-19,-20,-21,-22,-23,-23,-24,-24,-25,-26,-26,-27,-28,-28,-29,-29,-29,-29,-28,-28,-27,-26,-25,-24,-23,-22,-21,-20,-19,-18,-17,-17,-16,-16,-15,-15,-15,-15,-15,-15,-15,-15,-14,-14,-13,-12,-10,-9,-6,-4,-1,2,5,8,10,12,14,15,15,15,14,13,11,9,8,6,5,4,3,3,3,4,4,5,6,6,7,8,9,10,10,11,11,11,11,11,10,9,8,7,6,5,4,3,2,2,1,0];
  const HW = 5.5, JOFF = 11.5;
  const JUNCTIONS = [
      [249, 1, 43, 3.0, "sig", 30, "vlei"],
      [253, 1, 138, 6.0, "sig", 45, "hsw"],
      [736, 1, 101, 3.6, "sig", 40, "portswood"],
      [742, -1, 71, 3.0, "sig", 40, "fritz"],
      [760, -1, 112, 4.5, "sig", 35, "link"],
      [1054, 1, 98, 4.0, "yield", 20, "circle"],
      [1068, -1, 90, 3.5, "yield", 30, "wynyard"],
      [1085, 1, 80, 4.0, "yield", 20, "circle"],
      [1197, -1, 91, 3.0, "stop", 30, "svc"],
      [1197, 1, 97, 3.0, "stop", 30, "svc"],
      [1294, 1, 60, 4.5, "yield", 30, "granger"],
      [1306, 1, 146, 4.5, "yield", 30, "beach"],
      [-1353, 1, 87, 3.6, "zebra", 35, "haul"],
      [-1151, 1, 107, 3.0, "stop", 30, "svc"],
      [-1003, 1, 82, 3.0, "stop", 30, "hotel"],
      [-906, 1, 93, 3.0, "stop", 30, "svc"],
      [-831, -1, 91, 3.6, "stop", 30, "street"],
      [-766, -1, 91, 3.6, "stop", 30, "street"],
      [-671, 1, 47, 4.5, "sig", 45, "beachw"],
      [-607, -1, 101, 3.6, "stop", 35, "bay"],
      [-603, 1, 79, 3.6, "stop", 35, "bay"],
      [-590, -1, 96, 3.0, "stop", 30, "svc"],
      [-542, 1, 95, 3.0, "zebra", 30, "svc"],
      [-422, -1, 89, 3.0, "stop", 30, "svc"],
      [-421, 1, 87, 3.0, "stop", 30, "svc"],
      [-191, -1, 41, 4.0, "zebra", 40, "fritzse"],
      [-134, -1, 90, 3.0, "stop", 25, "svc"],
    ];
  // a side road's mouth in the track's frame (q: metres along the road from the junction, l: metres out to its side): its centre line at
  // q = l cot(angle), its edges hw / sin(angle) either side of that; the barrier opens from the edge out to the fence over all of it
  const mouth = (ang, hw) => { const a = ang * Math.PI / 180, ct = Math.cos(a) / Math.sin(a), e = hw / Math.sin(a), q0 = HW * ct, q1 = (HW + JOFF) * ct;
    return { ct, e, qa: Math.min(q0, q1) - e - 4.5, qb: Math.max(q0, q1) + e + 4.5 }; };
  const walls = [];
  for (const [d, sd, ang, hw] of JUNCTIONS) { const M = mouth(ang, hw); walls.push([d + M.qa, d + M.qb, sd, JOFF, 3]); }
  // the street furniture of the junctions, all of it knockable (World props -> Core's loose props): [metres after the start line, side, kind,
  // metres out from the centre line, facing ('B' the traffic coming along the circuit, 'F' ahead, 'U' up the side road, 'N' across the circuit),
  // colour, the junction]: on the corners either side of the mouth (-1 before it, 1 after it). South Africa: the traffic lights ("robots") on
  // poles at the corners, the primary one on the left of the stop line and a second one across the junction, the controller's cabinet, a push
  // button for the pedestrians; give way and stop signs, street lamps, bins and bollards
  const FURN = [];
  JUNCTIONS.forEach(([d, sd, ang, hw, kind], j) => {
    const M = mouth(ang, hw), put = (k, l, side, dq, face) => FURN.push([Math.round((d + l * M.ct + side * (M.e + dq)) * 10) / 10, sd, k, l, face, 0, j]);
    if (kind === 'sig') {
      put('tlight', HW + 1.2, -1, 1.2, 'U');   // for the side road's traffic (it comes out of the mouth)
      put('tlight', HW + 1.2, 1, 1.2, 'B');    // for the circuit's (the traffic along it), across the mouth
      put('tlight', HW + 6.5, 1, 1.4, 'U');    // the side road's second signal
      put('cabinet', HW + 4.0, -1, 3.2, 'U');  // the controller
      put('lamp', HW + 8.5, 1, 1.0, 'B');
      for (let k = 0; k < 2; k++) put('bollard', HW + 1.0 + k * 1.3, 1, 0.4 + k * 0.3, 'U');
    } else if (kind === 'yield' || kind === 'stop') {
      put('sign', HW + 2.0, -1, 1.0, 'U');     // give way / stop for the side road
      put('sign', HW + 5.0, 1, 1.2, 'U');      // a street sign
      put('lamp', HW + 7.0, -1, 1.2, 'B');
    } else {   // a zebra crossing: the warning signs either side, bollards
      put('sign', HW + 1.5, -1, 0.8, 'B'); put('sign', HW + 1.5, 1, 0.8, 'F');
      for (let k = 0; k < 3; k++) put('bollard', HW + 0.9 + k * 1.2, -1, 0.5 + k * 0.4, 'U');
    }
    put('bin', HW + 4.5, 1, 1.6, 'U');
  });
  TRACK_DEFS.push({
    id: 'capetown', name: 'Cape Town, Južna Afrika', theme: 'capetown', laps: 5, halfWidth: HW, noBirds: true,
    desc: 'Ulična proga v Green Pointu ob Atlantiku v pravem merilu (2,921 km, 12 zavojev, postavitev iz leta 2023): start na Vlei Road ob atletskem stadionu, levo na bulvar ob parku, okoli velikega krožišča, šikana okoli malega krožišča, v krožišču na Beach Road, hitri zavoji ob morju pri Granger Bayu, ravnina ob obali Mouille Pointa in nazaj mimo stadiona. Križišča s semaforji, znaki in svetilkami (vse se da zbiti), za mestom Mizna gora in Levja glava. Podatki: © OpenStreetMap (ODbL), Copernicus DEM, ESA WorldCover.',
    en: { name: 'Cape Town, South Africa', desc: 'A street circuit in Green Point by the Atlantic at full scale (2.921 km, 12 turns, the layout of 2023): the start on Vlei Road by the athletics stadium, left onto the boulevard by the park, round the big traffic circle, a chicane round the small traffic circle, through the roundabout onto Beach Road, fast corners by the sea at Granger Bay, the straight along the coast of Mouille Point and back past the stadium. Junctions with traffic lights, signs and lamps (all of them can be knocked over), Table Mountain and Lion\'s Head behind the town. Data: © OpenStreetMap (ODbL), Copernicus DEM, ESA WorldCover.' },
    start: [0, 0], runoff: 0.55, inner: 1.6, side: 1.6, realKm: 2.921, runoffTarmac: true, offSurface: 'paving',
    elev: CPT_H.map((h, i) => [i / CPT_H.length, h / 10]), elevSmooth: 8,
    walls, junctions: JUNCTIONS, junctionOff: JOFF, furniture: FURN,
    // the pit lane (scenery: [from, to, offset to the right (negative: left)], metres from the start line): left of Vlei Road, between the circuit
    // and the athletics stadium, across the start line (the cars do not stop there: the game's pit stops are on the right)
    pitLane: [-150, 125, -16],
    // temporary grandstands [from, to, side, rows, roof]: across from the pits on Vlei Road, outside Turn 1, along the boulevard, at Turn 7, on
    // the coast at Turn 9, outside Turn 10 (approximate)
    stands: [[-115, 60, 1, 9, 1], [300, 420, -1, 7, 0], [1340, 1420, -1, 6, 0], [-960, -880, -1, 6, 0], [-560, -500, -1, 7, 0]],
    ga: [[470, 560, -1], [1560, 1660, 1], [-1150, -1060, 1], [-420, -330, 1]],   // spectators along the barriers [from, to, side]
    sectors: [1000, 1950],   // the three sectors: to the end of the chicane, the coast, back to the line
    // named places: [HUD label, x, z, the commentator's lines]; the turns by their numbers only
    names: [
      ['Zavoj 1', -108.0, 208.6, ['Turn one, a sharp left off Vlei Road!', 'Into Turn One, hard on the brakes!', 'Turn one, everyone squeezes in!']],
      ['Zavoj 3', 303.5, 203.6, ['Round the big traffic circle!', 'Turns two and three, left round the circle!', 'Out of the traffic circle, towards the Waterfront!']],
      ['Zavoj 5', 602.6, -41.1, ['The chicane round the small traffic circle!', 'Left, right, left through the chicane!', 'Turns four, five and six, the little roundabout!']],
      ['Zavoj 7', 777.4, -173.0, ['Turn seven, left in the roundabout onto Beach Road!', 'Through the roundabout, Turn Seven!', 'Turn seven, and down to the sea!']],
      ['Zavoj 9', 278.4, -615.0, ['Turn nine, fast left by the sea!', 'Flat out past Granger Bay, Turn Nine!', 'Turn nine, the ocean right beside us!']],
      { n: 'Mouille Point', x: -150, z: -605, hud: false, say: ['Along the coast at Mouille Point!', 'Flat out along Beach Road, the Atlantic on the right!', 'Past the lighthouse, flat out!'] },
      ['Zavoj 10', 47.3, -584.0, ['Turn ten, hard on the brakes!', 'The sharp left of Turn Ten!', 'Turn ten, off Beach Road!']],
      ['Zavoj 12', 133.8, -132.6, ['Turn twelve, the last right!', 'Through Turn Twelve, back onto Vlei Road!', 'Turn twelve, and the line is near!']],
      { n: 'stadion', x: 280, z: -260, hud: false, say: ['Past the stadium!', 'The big stadium on our left!', 'Round the stadium!'] },
    ],
    turns: [[-108.0,208.6],[249.5,224.3],[303.5,203.6],[589.2,-21.3],[602.6,-41.1],[623.2,-50.7],[777.4,-173.0],[349.5,-568.7],[278.4,-615.0],[47.3,-584.0],[50.7,-268.0],[133.8,-132.6]],   // the apexes of Turns 1-12 (their number boards)
    points: [[0,0],[-4.3,4.2],[-8.6,8.4],[-12.9,12.6],[-17.1,16.8],[-21.4,21],[-25.6,25.3],[-29.5,29.8],[-33.3,34.5],[-36.7,39.4],[-40,44.5],[-43.2,49.5],[-46.5,54.6],[-49.7,59.6],[-53,64.7],[-56.2,69.7],[-59.4,74.8],[-62.7,79.8],[-66.1,84.7],[-69.9,89.4],[-73.8,93.9],[-77.9,98.3],[-82,102.7],[-86.1,107],[-90.3,111.4],[-94.4,115.7],[-98.5,120.1],[-102.4,124.7],[-106,129.5],[-109.3,134.5],[-112.3,139.7],[-114.9,145.1],[-117.2,150.6],[-119,156.4],[-120.4,162.2],[-121.4,168.1],[-122,174.1],[-122,180.1],[-121,186],[-119.5,191.8],[-117.6,197.5],[-114.7,202.7],[-110.3,206.8],[-105.3,210],[-99.4,211.3],[-93.4,211.3],[-87.4,210.9],[-81.5,210.5],[-75.5,210],[-69.5,209.6],[-63.5,209.1],[-57.5,208.7],[-51.5,208.2],[-45.6,207.8],[-39.6,207.3],[-33.6,206.8],[-27.6,206.4],[-21.6,205.9],[-15.6,205.5],[-9.7,205.1],[-3.7,204.8],[2.3,204.5],[8.3,204.2],[14.3,203.9],[20.3,203.7],[26.3,203.5],[32.3,203.4],[38.3,203.3],[44.3,203.2],[50.3,203.1],[56.3,203.1],[62.3,203],[68.3,203],[74.3,203.1],[80.3,203.1],[86.3,203.2],[92.3,203.4],[98.3,203.7],[104.3,204],[110.3,204.4],[116.2,204.9],[122.2,205.5],[128.2,206.1],[134.1,206.9],[140.1,207.7],[146,208.6],[151.9,209.6],[157.8,210.6],[163.7,211.7],[169.6,212.8],[175.5,213.9],[181.4,215],[187.3,216.1],[193.2,217.2],[199.1,218.3],[205,219.4],[210.9,220.5],[216.8,221.6],[222.7,222.7],[228.6,223.8],[234.6,224.6],[240.6,224.9],[246.6,224.6],[252.5,223.7],[258.3,222.2],[264,220.3],[269.5,217.9],[274.8,215.2],[280.2,212.5],[285.8,210.4],[291.5,208.6],[297.2,206.6],[302.6,204.1],[307.6,200.7],[312.1,196.8],[316.3,192.5],[320,187.8],[323.6,183],[327,178.1],[330.5,173.2],[334,168.3],[337.4,163.3],[340.6,158.3],[343.7,153.1],[347,148.1],[350.6,143.3],[354.3,138.6],[358.2,134.1],[362.1,129.5],[366.1,125],[370.1,120.6],[374.2,116.2],[378.4,111.9],[382.7,107.7],[387,103.5],[391.3,99.4],[395.8,95.4],[400.4,91.5],[405,87.6],[409.7,83.9],[414.4,80.2],[419.3,76.7],[424.1,73.2],[429,69.7],[434,66.4],[439,63.1],[444.2,60],[449.4,57.1],[454.7,54.2],[459.9,51.3],[465.3,48.5],[470.7,45.9],[476.1,43.4],[481.6,40.9],[487,38.4],[492.5,36],[498,33.7],[503.6,31.3],[509.1,28.9],[514.6,26.5],[520.1,24.1],[525.5,21.5],[530.8,18.8],[536.1,16],[541.4,13.1],[546.4,9.9],[551.4,6.5],[556.4,3.2],[561.3,-0.3],[566.2,-3.7],[571.1,-7.2],[576,-10.6],[580.9,-14.2],[585.5,-18],[589.9,-22.1],[593.8,-26.6],[596.9,-31.7],[599.7,-37],[603.3,-41.8],[608.2,-45.2],[613.9,-47.2],[619.6,-49.1],[625,-51.6],[630.2,-54.7],[635.1,-58.1],[640,-61.6],[644.8,-65.2],[649.6,-68.8],[654.4,-72.4],[659.2,-76],[664,-79.6],[668.8,-83.2],[673.6,-86.8],[678.4,-90.4],[683.2,-94],[688,-97.6],[692.8,-101.2],[697.6,-104.8],[702.4,-108.4],[707.2,-112],[711.9,-115.6],[716.7,-119.3],[721.4,-123],[726.1,-126.7],[730.9,-130.4],[735.6,-134.1],[740.3,-137.8],[745.1,-141.5],[749.8,-145.2],[754.5,-148.9],[759.2,-152.6],[764,-156.3],[768.6,-160],[772.9,-164.2],[776.2,-169.2],[777.6,-175],[777.3,-181],[775.5,-186.7],[772.5,-191.9],[769,-196.8],[764.8,-201.1],[760.3,-205],[755.7,-208.9],[751.1,-212.7],[746.4,-216.4],[741.6,-220],[736.8,-223.6],[731.9,-227],[726.9,-230.4],[721.9,-233.7],[716.8,-236.9],[711.8,-240.1],[706.7,-243.3],[701.6,-246.4],[696.5,-249.6],[691.4,-252.8],[686.3,-255.9],[681.2,-259.1],[676.1,-262.3],[671,-265.5],[666,-268.7],[661.1,-272.2],[656.3,-275.8],[651.5,-279.5],[646.9,-283.3],[642.5,-287.3],[638,-291.4],[633.6,-295.4],[629.2,-299.5],[624.8,-303.5],[620.3,-307.6],[615.9,-311.7],[611.5,-315.7],[607.1,-319.7],[602.6,-323.7],[598,-327.7],[593.4,-331.5],[588.8,-335.4],[584.2,-339.2],[579.6,-343],[574.9,-346.7],[570.1,-350.4],[565.3,-354],[560.5,-357.6],[555.7,-361.2],[550.9,-364.8],[546.1,-368.4],[541.3,-372],[536.5,-375.6],[531.7,-379.2],[526.9,-382.8],[522.2,-386.4],[517.4,-390],[512.6,-393.6],[507.8,-397.2],[503,-400.8],[498.2,-404.5],[493.4,-408.1],[488.6,-411.7],[483.8,-415.3],[479,-418.9],[474.2,-422.5],[469.4,-426.1],[464.6,-429.7],[459.8,-433.3],[455,-436.9],[450.2,-440.5],[445.5,-444.2],[440.7,-447.9],[436,-451.6],[431.4,-455.4],[426.8,-459.3],[422.3,-463.2],[417.8,-467.2],[413.6,-471.5],[409.5,-475.9],[405.6,-480.4],[401.8,-485.1],[398,-489.7],[394.3,-494.5],[390.7,-499.3],[387.4,-504.3],[384.3,-509.4],[381.2,-514.5],[378.2,-519.7],[375.3,-525],[372.6,-530.3],[369.9,-535.7],[367.2,-541],[364.5,-546.4],[361.7,-551.7],[358.7,-556.9],[355.2,-561.8],[351.5,-566.5],[347.4,-570.8],[342.9,-574.9],[338.3,-578.7],[333.7,-582.5],[329.1,-586.4],[324.4,-590.2],[319.8,-594],[315.1,-597.7],[310.3,-601.3],[305.3,-604.6],[300,-607.5],[294.6,-610],[289,-612.2],[283.3,-614],[277.4,-615.1],[271.4,-615.3],[265.4,-615],[259.4,-614.4],[253.4,-613.9],[247.5,-613.3],[241.5,-612.8],[235.5,-612.2],[229.6,-611.6],[223.6,-611],[217.6,-610.3],[211.7,-609.7],[205.7,-609.1],[199.7,-608.4],[193.8,-607.8],[187.8,-607.2],[181.8,-606.6],[175.8,-606],[169.9,-605.4],[163.9,-604.8],[157.9,-604.1],[152,-603.5],[146,-602.9],[140,-602.3],[134.1,-601.6],[128.1,-601],[122.1,-600.4],[116.2,-599.8],[110.2,-599.2],[104.2,-598.6],[98.3,-598],[92.3,-597.4],[86.3,-596.8],[80.3,-596.2],[74.4,-595.6],[68.4,-595],[62.5,-594.2],[56.7,-592.6],[51.6,-589.5],[47.8,-584.8],[45.5,-579.3],[45,-573.4],[45.3,-567.4],[45.9,-561.4],[46.6,-555.5],[47.2,-549.5],[47.9,-543.5],[48.5,-537.6],[48.8,-531.6],[48.6,-525.6],[48.2,-519.6],[47.9,-513.6],[47.8,-507.6],[47.8,-501.6],[47.8,-495.6],[47.9,-489.6],[47.9,-483.6],[48,-477.6],[48,-471.6],[48,-465.6],[48.1,-459.6],[48.2,-453.6],[48.2,-447.6],[48.3,-441.6],[48.4,-435.6],[48.5,-429.6],[48.5,-423.6],[48.6,-417.6],[48.7,-411.6],[48.8,-405.6],[48.9,-399.6],[48.9,-393.6],[49,-387.6],[49.1,-381.6],[49.2,-375.6],[49.2,-369.6],[49.3,-363.6],[49.2,-357.6],[48.7,-351.6],[48.1,-345.6],[47.7,-339.7],[48,-333.7],[48.5,-327.7],[48.9,-321.7],[49.1,-315.7],[49,-309.7],[48.9,-303.7],[48.7,-297.7],[48.6,-291.7],[48.5,-285.7],[48.6,-279.7],[49.2,-273.8],[50.7,-268],[53.2,-262.5],[56.3,-257.3],[59.6,-252.4],[63.1,-247.4],[66.5,-242.5],[70,-237.6],[73.4,-232.7],[76.8,-227.8],[80.3,-222.9],[83.7,-218],[87.2,-213.1],[90.6,-208.2],[94.1,-203.2],[97.5,-198.3],[101,-193.4],[104.4,-188.5],[107.9,-183.6],[111.3,-178.7],[114.8,-173.8],[118.2,-168.9],[121.7,-164],[125.1,-159],[128.5,-154.1],[131.7,-149],[133.9,-143.4],[134.4,-137.5],[133.5,-131.7],[131,-126.2],[127.2,-121.6],[123,-117.4],[118.6,-113.3],[114.2,-109.2],[109.8,-105.1],[105.4,-101],[101,-96.9],[96.6,-92.8],[92.3,-88.7],[87.9,-84.6],[83.6,-80.4],[79.3,-76.3],[74.9,-72.1],[70.6,-68],[66.2,-63.9],[61.9,-59.7],[57.5,-55.6],[53.2,-51.4],[48.9,-47.3],[44.5,-43.1],[40.2,-39],[35.9,-34.8],[31.6,-30.6],[27.3,-26.4],[23,-22.3],[18.7,-18.1],[14.4,-13.9],[10.1,-9.7],[5.7,-5.6],[1.4,-1.4]],
  });
})();
