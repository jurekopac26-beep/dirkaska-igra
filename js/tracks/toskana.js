/* Track definition 'toskana'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // "Toskana": a countryside circuit in the look of the Faenza track from the stylised top-down racer (the first race of the reference video),
  // with its corners reshaped: the long start/finish straight with stands and pits → a double left → a sharp 90-degree left-right chicane
  // (tyre stacks, cones and bales across its short cut) → a long sweeping S up the east side by the lake → a sweeping double bend over the top →
  // a squared-off double-left hairpin → a right → down the middle as one long left-right sweep → a right, a long left → the tight left hairpin
  // onto the straight. Apart from the pit straight every straight became a drawn-out bend, made for drifting. Green/white/red kerbs, green and white tyre walls, wide orange run-offs, cypresses
  // and terracotta-roofed farmhouses.
  TRACK_DEFS.push({
    id: 'toskana', name: 'Toskana, Italija', theme: 'italia', laps: 3, halfWidth: 6.4,
    desc: 'Podeželska proga v slogu Faenze, z drugače oblikovanimi ovinki: dolga ciljna ravnina s tribunami in boksi (zapelji vanje in mehaniki ti popravijo avto), dvojni levi ovinek, ostra šikana (kdor jo odreže, razbije gume), dolgi razvlečeni zavoji za drsenje ob jezeru in po sredini, ostra dvojna lasnica, ciprese, kmečke hiše z opečnatimi strehami, zeleno-belo-rdeči robniki in stene iz zelenih in belih gum.',
    en: { name: 'Tuscany, Italy', desc: 'A country track in the style of Faenza, with corners shaped differently: a long finish straight with grandstands and pits (drive in and the mechanics repair your car), a double left, a sharp chicane (cut it and you wreck your tyres), long drawn-out bends to slide through by the lake and in the middle, a tight double hairpin, cypresses, farmhouses with tiled roofs, green-white-red kerbs and walls of green and white tyres.' },   // (the English page: Jezik · Language)
    points: [[-170,152],[-154,152],[-138,152],[-122,152],[-106,152],[-90,152],[-74,152],[-58,152],[-42,152],[-27,152],[-11,152],[5,152],[21,152],[37,152],[53,152],[69,152],[85,152],[101,152],[117,152],[133,150],[146,142],[157,130],[167,118],[172,103],[172,87],[169,71],[157,62],[141,61],[126,56],[120,42],[119,26],[116,10],[112,-5],[106,-20],[100,-35],[97,-50],[95,-66],[95,-82],[97,-98],[101,-113],[107,-128],[113,-143],[117,-158],[119,-174],[120,-190],[115,-205],[106,-218],[92,-226],[77,-228],[61,-231],[45,-234],[30,-238],[15,-243],[-1,-247],[-17,-247],[-32,-243],[-40,-230],[-40,-214],[-38,-198],[-26,-188],[-12,-180],[2,-173],[16,-165],[24,-151],[24,-136],[17,-122],[7,-109],[-1,-95],[-8,-81],[-14,-66],[-18,-51],[-21,-35],[-25,-20],[-31,-5],[-38,9],[-46,23],[-56,36],[-68,46],[-84,48],[-99,46],[-115,47],[-131,49],[-146,54],[-160,61],[-173,70],[-185,81],[-195,94],[-202,108],[-204,124],[-197,138],[-185,148]],
    start: [-40, 152], runoff: 0.5, inner: 3.2, side: 3.4,
    pit: [16, -118, 128, 39],   // pit lane south of the straight: [centre offset to the right, from, to, the player's box] (metres from the start line)
    pitRow: [-56, 64],          // the first and the last of the 13 boxes
    // the newer circuits place their scenery from here: stands [from, to, side, rows] (metres from the start line, side -1 left / 1 right),
    // billboards [x, z, side, out, along, slot, half width, height], farmhouses [x, z, rot, length, depth, wall height], rows of cypresses
    // [x0, z0, x1, z1, spacing], spectators [from, to, side, rows, density], the lake east of the circuit (clockwise on the map)
    stands: [[-110, -85, -1, 7], [-81, -56, -1, 7], [-52, -27, -1, 7], [-23, 2, -1, 6], [598, 622, 1, 6], [626, 650, 1, 6]],
    boards: [[140, 150, 1, 4.7, 0, 0, 4.2, 3.9], [188, 20, 1, 4.7, 0, 1, 4.2, 3.9], [-74, -150, 1, 4.7, 0, 2, 4.2, 3.9], [-204, 122, 1, 4.2, 0, 3, 2.6, 2.6], [40, -191, -1, 3.8, 0, 0, 4.2, 3.9]],
    houses: [[62, 62, 0.25, 12, 7.5, 5.2], [92, 32, 1.4, 9, 6.5, 3.8], [40, -40, 1.2, 9, 6.5, 3.8], [-232, 152, 0.6, 11, 7, 4.2], [34, -208, 0.08, 12, 7, 5.2], [-12, -219, -0.2, 8, 6, 3.6], [-110, -70, 0.9, 10, 7, 4.2]],
    cypress: [[-150, 124, -24, 124, 7], [-120, 238, 40, 238, 8], [64, 18, 114, 66, 7], [-14, -274, 76, -274, 8]],
    crowd: [[160, 250, -1, 3, 0.6], [290, 340, -1, 2, 0.5], [480, 560, -1, 3, 0.65], [560, 596, 1, 2, 0.5], [740, 820, -1, 3, 0.7],
      [890, 1000, 1, 3, 0.7], [890, 1000, -1, 2, 0.5], [1020, 1080, -1, 2, 0.5], [1180, 1270, -1, 3, 0.75], [20, 120, -1, 2, 0.5]],
    lake: [[208, -260], [746, -260], [746, 260], [232, 260], [234, 196], [216, 150], [202, 96], [200, 40], [202, -20], [198, -80], [204, -140], [206, -200]],
  });
})();
