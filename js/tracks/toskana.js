/* Track definition 'toskana'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // "Toskana": a countryside circuit in the look of the Faenza track from the stylised top-down racer (the first race of the reference video),
  // with its corners reshaped: the long start/finish straight with stands and pits → a double left → a right-left chicane up the east side,
  // the lake beyond it → a sweeping left onto the top straight → a squared-off double-left hairpin → down the middle through a two-step right →
  // a long left → the tight left hairpin onto the straight. Green/white/red kerbs, green and white tyre walls, wide orange run-offs, cypresses
  // and terracotta-roofed farmhouses.
  TRACK_DEFS.push({
    id: 'toskana', name: 'Toskana', theme: 'italia', laps: 3, halfWidth: 6.4,
    desc: 'Podeželska proga v slogu Faenze, z drugače oblikovanimi ovinki: dolga ciljna ravnina s tribunami in boksi (zapelji vanje in mehaniki ti popravijo avto), dvojni levi ovinek, šikana ob jezeru, ostra dvojna lasnica, ciprese, kmečke hiše z opečnatimi strehami, zeleno-belo-rdeči robniki in stene iz zelenih in belih gum.',
    points: [[-170,152],[-154,152],[-138,152],[-122,152],[-106,152],[-90,152],[-75,152],[-59,152],[-43,152],[-27,152],[-11,152],[5,152],[21,152],[37,152],[53,152],[69,152],[85,152],[101,152],[116,152],[132,150],[146,142],[157,131],[167,118],[174,105],[176,89],[176,73],[176,57],[179,42],[187,28],[188,12],[188,-4],[187,-20],[186,-36],[182,-51],[178,-67],[176,-82],[175,-98],[175,-114],[175,-130],[174,-146],[170,-161],[160,-174],[146,-181],[131,-184],[115,-186],[99,-187],[83,-188],[67,-190],[51,-191],[35,-191],[20,-190],[4,-189],[-12,-187],[-28,-185],[-44,-183],[-59,-181],[-73,-173],[-76,-158],[-76,-142],[-70,-128],[-57,-118],[-44,-109],[-31,-100],[-18,-91],[-5,-82],[6,-71],[12,-56],[10,-41],[1,-28],[-10,-15],[-22,-6],[-38,-3],[-53,-5],[-69,-2],[-84,3],[-97,12],[-109,23],[-121,33],[-134,43],[-146,53],[-158,64],[-170,74],[-182,84],[-194,94],[-202,108],[-204,124],[-197,138],[-185,148]],
    start: [-40, 152], runoff: 0.5, inner: 3.2, side: 3.4,
    pit: [16, -118, 128, 39],   // pit lane south of the straight: [centre offset to the right, from, to, the player's box] (metres from the start line)
    pitRow: [-56, 64],          // the first and the last of the 13 boxes
    // the newer circuits place their scenery from here: stands [from, to, side, rows] (metres from the start line, side -1 left / 1 right),
    // billboards [x, z, side, out, along, slot, half width, height], farmhouses [x, z, rot, length, depth, wall height], rows of cypresses
    // [x0, z0, x1, z1, spacing], spectators [from, to, side, rows, density], the lake east of the circuit (clockwise on the map)
    stands: [[-110, -85, -1, 7], [-81, -56, -1, 7], [-52, -27, -1, 7], [-23, 2, -1, 6], [598, 622, 1, 6], [626, 650, 1, 6]],
    boards: [[140, 150, 1, 4.7, 0, 0, 4.2, 3.9], [188, 20, 1, 4.7, 0, 1, 4.2, 3.9], [-74, -150, 1, 4.7, 0, 2, 4.2, 3.9], [-204, 122, 1, 4.2, 0, 3, 2.6, 2.6], [40, -191, -1, 3.8, 0, 0, 4.2, 3.9]],
    houses: [[62, 62, 0.25, 12, 7.5, 5.2], [102, 26, 1.4, 9, 6.5, 3.8], [40, -40, 1.2, 9, 6.5, 3.8], [-232, 152, 0.6, 11, 7, 4.2], [30, -222, 0.08, 12, 7, 5.2], [-38, -226, -0.2, 8, 6, 3.6], [-110, -70, 0.9, 10, 7, 4.2]],
    cypress: [[-150, 124, -24, 124, 7], [-120, 238, 40, 238, 8], [70, 12, 120, 60, 7], [-10, -250, 80, -250, 8]],
    crowd: [[160, 250, -1, 3, 0.6], [290, 340, -1, 2, 0.5], [480, 560, -1, 3, 0.65], [560, 596, 1, 2, 0.5], [740, 820, -1, 3, 0.7],
      [890, 1000, 1, 3, 0.7], [890, 1000, -1, 2, 0.5], [1020, 1080, -1, 2, 0.5], [1180, 1270, -1, 3, 0.75], [20, 120, -1, 2, 0.5]],
    lake: [[222, -260], [760, -260], [760, 260], [246, 260], [248, 196], [230, 150], [216, 96], [214, 40], [216, -20], [212, -80], [218, -140], [220, -200]],
  });
})();
