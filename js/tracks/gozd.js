/* Track definition 'gozd'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // "Bakreni gozd": forest circuit modelled on the track from a stylised top-down racer (a V with a tongue inside), evening light.
  // Long main straight with stands and pits → left at the bottom of the V → up the right leg past a sand pit → hairpin round a rock
  // bulb → down the tongue → tight hairpin → up past the big stand → across the top → sharp corner among the rocks → straight.
  TRACK_DEFS.push({
    id: 'gozd', name: 'Bakreni gozd', theme: 'forest', laps: 3, halfWidth: 6.2, camYaw: 0.16,   // kino camera looks NNE, as measured from the reference
    desc: 'Gozdna proga v obliki črke V z jezikom ob jezeru: dolga ravnina ob tribunah in boksih (zapelji vanje in mehaniki ti popravijo avto), lasnica okoli skal, tesna lasnica v jeziku, kmetija, skalna obala, stene iz gum in gost iglasti gozd v večerni svetlobi.',
    en: { name: 'Copper Forest', desc: 'A V-shaped forest track with a tongue by the lake: a long straight past the grandstands and the pits (drive in and the mechanics repair your car), a hairpin round the rocks, a tight hairpin in the tongue, a farm, a rocky shore, tyre walls and a dense pine forest in the evening light.' },   // (the English page: Jezik · Language)
    // layout re-fitted to the reference minimap: the straight runs beside the pit lane (pits on its outside), the V hairpin sits higher,
    // a gentle S on the right leg, the top of the tongue bulges east before the lakeside road
    points: [[20,18],[44,19],[66,22],[83,34],[95,52],[129,111],[166,176],[201,237],[221,272],[231,287],[242,292],[252,292],[260,287],[267,279],[277,263],[288,245],[299,227],[317,184],[328,146],[327,106],[324,78],[328,52],[340,33],[357,16],[378,-6],[380,-34],[366,-54],[345,-58],[326,-49],[315,-32],[313,-6],[296,25],[265,50],[248,82],[256,120],[248,151],[227,158],[210,126],[189,88],[174,64],[164,45],[160,26],[161,6],[165,-14],[167,-33],[164,-55],[148,-69],[126,-69],[107,-64],[88,-59],[68,-54],[49,-48],[31,-39],[17,-26],[6,-11],[4,6]],
    start: [171, 186], runoff: 0.3, inner: 3.2, side: 3.4,   // finish line low on the long straight, a short run to the V hairpin (as in the reference)
    // scenery anchors (metres): rock formations [x, z, radius], farm, dry creek, extra grandstand at the tongue, lake shoreline
    rocks: [[62, -10, 17], [-16, -2, 8], [200, 190, 8], [345, -20, 14], [230, 104, 9], [186, -22, 12], [150, 330, 14], [300, 360, 12], [-20, 90, 15], [420, 250, 18], [470, 120, 16]],
    farm: [405, 60], river: [[262, 322], [287, 299], [306, 270], [321, 238], [333, 206], [340, 182]],
    stand2: [[222, 148], [192, 92]],
    pit: [15.5, -238, 80, -57],   // pit lane beside the straight: [centre offset to the right, from, to, the player's box] (metres from the start line)
    hill: [[250, 226, 20, 2.2]],   // a low grassy rise between the tongue and the terrace: [x, z, radius, height]
    plateau: { s0: 66, s1: 292, off: 5.5, h: 2.3 },   // raised lawn filling the bottom of the V behind a curved concrete wall (metres from the start line, beyond the inner barrier)
    lake: [[-420,-420],[640,-420],[640,-96],[470,-92],[410,-84],[385,-80],[355,-83],[325,-80],[296,-72],[262,-74],[225,-88],[190,-94],[160,-96],[122,-100],[84,-90],[48,-80],[18,-68],[-6,-46],[-22,-18],[-28,12],[-40,42],[-70,70],[-150,96],[-420,110]],
  });
})();
