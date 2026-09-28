/* Track definition 'grom'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // "Gromski rt": a short club circuit in the look of the Thunder Point track from the stylised top-down racer (the third race of the reference
  // video), mirrored so the pits lie on the right of the straight, with its corners reshaped: the long start/finish straight with the pits and
  // the GORIVO flags → a sharp left → a kink up the east side → a double left at the top → down the long diagonal through a flick → the tight
  // left hairpin onto the straight. Red/yellow kerbs, black tyre walls, a pine wood and a big campsite full of vans, caravans and tents.
  TRACK_DEFS.push({
    id: 'grom', name: 'Gromski rt', theme: 'kamp', laps: 4, halfWidth: 6.4,
    desc: 'Kratka proga v slogu Thunder Pointa, zrcaljena in z drugače oblikovanimi ovinki: dolga ravnina z boksi (zapelji vanje in mehaniki ti popravijo avto) in zastavicami, oster levi ovinek, dvojni levi na vrhu, šikana na diagonali in tesna lasnica. Borov gozd, velik kamp z avtodomi, prikolicami in šotori, rdeče-rumeni robniki in stene iz črnih gum.',
    points: [[-160,58],[-146,58],[-132,58],[-118,58],[-104,58],[-90,58],[-75,58],[-61,58],[-47,58],[-33,58],[-19,58],[-5,58],[9,58],[23,58],[37,58],[51,58],[65,58],[79,58],[94,58],[108,58],[122,58],[136,58],[150,58],[164,58],[178,58],[192,58],[206,54],[216,45],[221,32],[222,18],[222,4],[222,-10],[223,-24],[227,-38],[233,-51],[239,-64],[242,-77],[237,-90],[225,-98],[212,-103],[199,-108],[185,-108],[171,-104],[158,-99],[145,-94],[132,-89],[119,-84],[106,-79],[93,-74],[79,-69],[66,-64],[53,-59],[40,-54],[27,-49],[14,-44],[0,-39],[-13,-34],[-26,-30],[-40,-31],[-54,-28],[-67,-23],[-80,-18],[-93,-13],[-107,-8],[-120,-3],[-133,2],[-146,7],[-159,12],[-172,18],[-181,28],[-181,42],[-173,54]],
    start: [-20, 58], runoff: 0.5, inner: 3.2, side: 3.4,
    pit: [16, -120, 170, 39],   // pit lane south of the straight: [centre offset to the right, from, to, the player's box] (metres from the start line)
    pitRow: [-56, 64],          // the first and the last of the 13 boxes
    // scenery (see toskana.js): stands, billboards, spectators, the campsites [x, z, width, depth, rot] and the feather flags [from, to, side, spacing]
    stands: [[-104, -79, -1, 7], [-75, -50, -1, 7], [-46, -21, -1, 6], [500, 524, 1, 6], [528, 552, 1, 6]],
    boards: [[200, 57, 1, 3.8, 0, 0, 4.2, 3.9], [240, -87, 1, 4.2, 0, 1, 4.2, 3.9], [-21, -31, 1, 4.2, 0, 2, 4.2, 3.9], [-182, 34, 1, 4.2, 0, 3, 2.6, 2.6]],
    camp: [[66, 17, 150, 42, 0], [290, -18, 64, 120, 0]],
    flags: [[10, 150, -1, 10]],
    crowd: [[200, 270, -1, 3, 0.7], [280, 340, -1, 2, 0.5], [360, 460, -1, 3, 0.7], [470, 496, 1, 2, 0.45], [560, 640, 1, 2, 0.45], [640, 700, -1, 3, 0.6], [640, 700, 1, 2, 0.5], [800, 880, -1, 3, 0.75], [10, 150, -1, 2, 0.4]],
  });
})();
