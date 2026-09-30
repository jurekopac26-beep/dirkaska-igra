/* Track definition 'grom'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // "Gromski rt": a short club circuit in the look of the Thunder Point track from the stylised top-down racer (the third race of the reference
  // video), mirrored so the pits lie on the right of the straight, with its corners reshaped: the long start/finish straight with the pits and
  // the GORIVO flags → a sharp left → a sweeping S up the east side → a left at the top → a sharp 90-degree left-right chicane (tyre stacks,
  // cones and bales across its short cut) → down the long diagonal as one drawn-out left-right sweep, made for drifting, no straight → the
  // tight left hairpin onto the straight. Red/yellow kerbs, black tyre walls, a pine wood and a big campsite full of vans, caravans and tents.
  TRACK_DEFS.push({
    id: 'grom', name: 'Gromski rt', theme: 'kamp', laps: 4, halfWidth: 6.4,
    desc: 'Kratka proga v slogu Thunder Pointa, zrcaljena in z drugače oblikovanimi ovinki: dolga ravnina z boksi (zapelji vanje in mehaniki ti popravijo avto) in zastavicami, oster levi ovinek, S-zavoj, ostra šikana na vrhu (kdor jo odreže, razbije gume), dolga zavita diagonala za drsenje in tesna lasnica. Borov gozd, velik kamp z avtodomi, prikolicami in šotori, rdeče-rumeni robniki in stene iz črnih gum.',
    points: [[-160,58],[-146,58],[-132,58],[-118,58],[-104,58],[-90,58],[-76,58],[-62,58],[-49,58],[-35,58],[-21,58],[-7,58],[7,58],[21,58],[35,58],[49,58],[63,58],[77,58],[91,58],[105,58],[119,58],[133,58],[147,58],[161,58],[174,58],[187,53],[196,42],[200,29],[200,15],[201,1],[203,-13],[208,-26],[213,-39],[218,-52],[219,-66],[218,-80],[216,-93],[213,-107],[211,-121],[208,-134],[199,-145],[186,-149],[172,-146],[159,-142],[145,-140],[131,-138],[117,-138],[105,-131],[100,-118],[100,-105],[94,-92],[82,-86],[68,-86],[54,-84],[41,-82],[27,-79],[14,-75],[1,-70],[-12,-64],[-24,-57],[-36,-49],[-47,-41],[-59,-33],[-70,-26],[-83,-19],[-95,-13],[-108,-7],[-120,-1],[-133,4],[-146,8],[-160,13],[-173,18],[-181,29],[-181,43],[-173,54]],
    start: [-20, 58], runoff: 0.7, inner: 3.2, side: 3.4, noGravel: true,   // (the wider run-offs stay orange dirt, as in the reference: no gravel traps)
    pit: [16, -120, 170, 39],   // pit lane south of the straight: [centre offset to the right, from, to, the player's box] (metres from the start line)
    pitRow: [-56, 64],          // the first and the last of the 13 boxes
    // scenery (see toskana.js): stands, billboards, spectators, the campsites [x, z, width, depth, rot] and the feather flags [from, to, side, spacing]
    stands: [[-104, -79, -1, 7], [-75, -50, -1, 7], [-46, -21, -1, 6], [500, 524, 1, 6], [528, 552, 1, 6]],
    boards: [[200, 57, 1, 4.7, 0, 0, 4.2, 3.9], [240, -87, 1, 4.7, 0, 1, 4.2, 3.9], [-21, -31, 1, 5.4, 0, 2, 4.2, 3.9], [-182, 34, 1, 4.2, 0, 3, 2.6, 2.6]],
    camp: [[66, 17, 150, 42, 0], [274, -18, 60, 120, 0]],
    flags: [[10, 150, -1, 6]],
    crowd: [[200, 270, -1, 3, 0.7], [280, 340, -1, 2, 0.5], [360, 460, -1, 3, 0.7], [470, 496, 1, 2, 0.45], [560, 640, 1, 2, 0.45], [640, 700, -1, 3, 0.6], [640, 700, 1, 2, 0.5], [800, 880, -1, 3, 0.75], [270, 335, 1, 3, 0.7]],
  });
})();
