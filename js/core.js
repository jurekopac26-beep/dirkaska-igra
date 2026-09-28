/* =========================================================================
   CORE — track, car physics, AI, race logic (no DOM, no THREE)
   World: x = east (screen right), z = south (screen down), y = up.
   Heading h: forward = (cos h, sin h); right = (-sin h, cos h).
   Positive yaw rate = turning right (clockwise on screen).
   ========================================================================= */
const Core = (function () {
  'use strict';
  const G = 9.81;
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const wrapPi = (a) => { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; };
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  function rng(seed) { // mulberry32
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0; let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------------------------------------------------------------------
     TRACK
     --------------------------------------------------------------------- */
  const TRACK_DEF = {
    name: 'Jezero Ring',
    halfWidth: 7.5,
    points: [[200,215],[60,215],[-80,215],[-175,212],[-222,190],[-236,140],[-232,80],[-252,30],[-240,-30],[-195,-70],[-120,-82],[-55,-115],[10,-148],[70,-140],[92,-100],[70,-62],[22,-50],[4,-10],[40,20],[115,18],[180,-18],[235,-30],[268,0],[262,50],[284,100],[282,160],[252,205]],
    startX: 40, // start/finish line near this x on the main straight
    id: 'jezero', theme: 'lake', laps: 3, desc: 'Jezero z otokom in cerkvico, gozd, tribune. Hitra proga z dolgimi zavoji.'
  };
  // Short technical coastal street circuit (SWGP2-style: ~1.25 km, 6 corners incl. 2 hairpins, seafront straight)
  const RIVIERA_DEF = {
    id: 'riviera', name: 'Riviera', theme: 'city', laps: 4, halfWidth: 6.5,
    desc: 'Obalna mestna proga: palme, morje, promenada, stavbe. Kratka in tehnična z lasnicami.',
    points: [[-195, 195], [0, 195], [150, 195], [208, 172], [224, 120], [221, 46], [198, -6], [150, -23], [114, 6], [94, 55], [39, 73], [-13, 57], [-58, 81], [-124, 75], [-188, 47], [-234, 81], [-244, 146], [-224, 188]],
    start: [-40, 195], runoff: 0.45, inner: 3.2, side: 3.4, offSurface: 'paving', sea: { z: 224 }
  };
  // Makadam mountain rally stage: climbs a hill and descends, with crest/downhill jumps and heavy scenery.
  const MOUNTAIN_DEF = {
    id: 'gora', name: 'Gorski reli', theme: 'mountain', laps: 2, halfWidth: 7,
    desc: 'Makadamska gorska proga: klanci navzgor in navzdol, skoki čez grbine, gozd in skale. Hitra in razgibana.',
    points: [[-255, 174], [-70, 186], [128, 174], [273, 139], [348, 51], [332, -35], [248, -70], [139, -46], [51, -100], [-67, -90], [-206, -46], [-311, 26], [-322, 125]],
    start: [-120, 180], roadSurface: 'makadam', runoff: 0.8, inner: 4.5, side: 5.5,
    elev: [[0, 0], [0.2, 0], [0.33, 5], [0.42, 17], [0.52, 30], [0.60, 36], [0.70, 33], [0.80, 18], [0.90, 6], [0.96, 0]],
    bumps: [{ at: 0.13, h: 1.6, w: 6 }, { at: 0.25, h: 1.2, w: 6 }, { at: 0.60, h: 1.3, w: 6 }, { at: 0.80, h: 1.6, w: 5.5 }]
  };
  // Ljubljana street circuit, laid out on real coordinates (metres, origin = Triple Bridge, x east, z south):
  // Petkovškovo nabrežje (start) → Dragon Bridge → Central Market bank → Stritarjeva/Mestni trg/Stari trg →
  // Cobblers' Bridge → Novi trg → Vegova → Kongresni trg → Slovenska → Čopova → Prešernov trg.
  const LJUBLJANA_DEF = {
    id: 'ljubljana', name: 'Ljubljana', theme: 'ljubljana', laps: 3, halfWidth: 6.5,
    desc: 'Mestna proga po središču Ljubljane: Petkovškovo nabrežje, Zmajski most, tržnica, Mestni trg, Šuštarski most, Kongresni trg, Slovenska, Čopova in Prešernov trg. Nad mestom grad.',
    points: [[40, -40], [150, -68], [250, -98], [300, -116], [324, -100], [330, -75], [316, -57], [240, -35], [150, -10], [62, 12], [22, 40], [14, 85], [10, 135], [4, 200], [-6, 262], [-26, 298], [-85, 304], [-150, 300], [-190, 280], [-197, 212], [-202, 165], [-250, 150], [-292, 126], [-286, 40], [-268, -50], [-254, -108], [-218, -118], [-165, -97], [-92, -72], [-30, -55]],
    start: [150, -68], runoff: 0.45, inner: 3.2, side: 3.4, offSurface: 'paving',
    // named places: [HUD label, x, z, what the commentator may say there] (spoken in English, so the lines use English names
    // or spellings an English voice can read: Dragon Bridge, Cobblers' Bridge, Presheren, Chopova, Stritaryeva)
    names: [
      ['Zmajski most', 324.3, -99.6, ['Over the Dragon Bridge now!', 'Across the Dragon Bridge, past the green dragons!', 'Round over the Dragon Bridge, the river below!']],
      ['Tržnica', 209.8, -26.4, ['Along the Central Market!', "Past the market and Plechnik's colonnade!", 'Down the river bank by the Central Market!']],
      ['Stritarjeva', 59.1, 13.3, ['Past the Triple Bridge into Stritaryeva!', 'Left into Stritaryeva Street!', 'Round by the Triple Bridge!']],
      ['Mestni trg', 11.9, 108.4, ['Through Town Square, past the Town Hall!', 'Town Square, past the Robba Fountain!', 'Into Town Square, by the Town Hall!']],
      ['Stari trg', 1.3, 223.9, ['Down Old Square, under the castle!', 'Through the Old Square, the castle looking down!', 'Old Square, cobbles and cafes!']],
      ['Šuštarski most', -62.2, 304.2, ["Over the Cobblers' Bridge!", "Right, across the Cobblers' Bridge!", "Over the Cobblers' Bridge, back across the river!"]],
      ['Vegova', -194.1, 270.7, ['Right into Vegova Street!', 'Along Vegova, past the National Library!', 'Vegova Street, towards Congress Square!']],
      ['Kongresni trg', -204.2, 162.9, ['Round Congress Square!', 'Congress Square, past the University!', 'Left at Congress Square, by the park!']],
      ['Slovenska cesta', -295.7, 103.9, ['Onto Slovenska Street!', 'Flat out up Slovenska Street!', 'Slovenska Street, the main road through the city!']],
      ['Čopova', -251.7, -110.1, ['Right into Chopova Street!', 'Down Chopova, the busy shopping street!', 'Chopova Street, down towards Presheren Square!']],
      ['Prešernov trg', -18.5, -51.9, ['Presheren Square! Past the pink church!', 'Through Presheren Square, by the Triple Bridge!', 'Past the Presheren monument!']],
      ['Petkovškovo nabrežje', 92.9, -50.2, ['Along the river to the line!', 'Down Petkovshkovo embankment to the line!', 'Along the embankment, back to the line!']],
    ],
    // Ljubljanica centre line (south-west → north → east) and width; castle on its hill
    river: [[-170, 600], [-110, 470], [-75, 380], [-54, 299], [-30, 180], [-12, 80], [0, 0], [60, -18], [150, -45], [240, -72], [324, -97], [420, -113], [560, -108]], riverW: 26,
    castle: [182, 240],
  };
  // Circuit de Monaco on the real layout and scale (metres, origin = Sainte-Dévote, x east, z south): Boulevard Albert Ier (start) → Sainte Dévote →
  // Beau Rivage climb → Massenet → Casino → Mirabeau → Fairmont hairpin → Portier → tunnel → Nouvelle Chicane → Tabac → Piscine → Rascasse → Anthony Noghès.
  const MONACO_DEF = {
    id: 'monaco', name: 'Monako', theme: 'monaco', laps: 2, halfWidth: 5.8,
    desc: 'Prava proga skozi Monako v pravem merilu: Sainte Dévote, vzpon do Casinoja, lasnica pri hotelu Fairmont, predor, šikana ob pristanišču, bazen in Rascasse.',
    points: [[-72,449],[-85,384],[-93,292],[-93,194],[-85,120],[-65,64],[-36,26],[0,3],[36,-6],[105,-6],[203,-6],[301,-2],[399,1],[483,-6],[546,-27],[603,-59],[652,-104],[684,-146],[712,-182],[750,-205],[791,-217],[831,-231],[869,-242],[897,-235],[913,-211],[925,-190],[934,-172],[951,-167],[964,-179],[967,-200],[974,-223],[990,-237],[1013,-244],[1043,-237],[1062,-217],[1055,-191],[1027,-162],[987,-125],[938,-84],[880,-43],[824,-6],[766,21],[693,39],[619,49],[546,54],[505,55],[487,65],[465,66],[444,59],[383,60],[301,64],[219,65],[145,65],[98,70],[72,87],[56,110],[42,132],[33,162],[19,208],[12,256],[3,292],[8,325],[16,361],[28,400],[39,431],[40,454],[23,472],[-5,477],[-35,474],[-59,463]],
    start: [-93,194], runoff: 0.4, inner: 3, side: 3, offSurface: 'paving',
    // named places: [HUD label, x, z, what the commentator may say there] (English lines: Sainte Devote, Noghes without accents for the voice)
    names: [
      ['Sainte Dévote', -1.8, 3.8, ['Into Sainte Devote, turn one!', 'Round Sainte Devote, past the little church!', 'Sainte Devote, and up the hill we go!']],
      ['Beau Rivage', 220.7, -5.5, ['Up the hill along Beau Rivage!', 'Climbing Beau Rivage towards the Casino!', 'Flat out up Beau Rivage!']],
      ['Massenet', 590.7, -50.7, ['Sweeping left through Massenet!', 'Massenet, the long left towards Casino Square!', 'Over the top of the hill at Massenet!']],
      ['Casino', 728.1, -193.8, ['Up into Casino Square!', 'Through Casino Square, past the famous Casino!', 'Casino Square, the heart of Monte Carlo!']],
      ['Mirabeau', 869.5, -242, ['Down the hill to Mirabeau!', 'Hard on the brakes for Mirabeau!', 'Mirabeau, and down towards the hairpin!']],
      ['Lasnica Fairmont', 948.4, -166.7, ['The Fairmont hairpin! Full lock!', 'Round the Fairmont hairpin, the slowest corner of the lap!', 'Crawling round the famous hairpin!']],
      ['Portier', 1050.4, -232, ['Down through Mirabeau Bas to Portier!', 'Portier, and down to the sea!', 'Right at Portier, the tunnel is next!']],
      ['Predor', 995.8, -132.8, ['Into the tunnel! Flat out in the dark!', 'Through the tunnel, under the Fairmont hotel!', 'In the tunnel, the fastest part of the lap!']],
      ['Nouvelle Chicane', 511.1, 53.9, ['Out of the tunnel, hard on the brakes for the chicane!', 'The Nouvelle Chicane! Over the kerbs!', 'Down to the harbour chicane!']],
      ['Tabac', 101.7, 68.8, ['Tabac! Along the harbour!', 'Left at Tabac, yachts all around!', 'Through Tabac, right by the water!']],
      ['Piscine', 21.2, 199.4, ['Into the Swimming Pool section!', 'Round the swimming pool, past the yachts!', 'Flicking through the Piscine!']],
      ['La Rascasse', 41.2, 448.2, ['La Rascasse! Tight right by the famous bar!', 'Round La Rascasse, the lap is nearly done!', 'Slow in, fast out at La Rascasse!']],
      ['Anthony Noghès', -64.8, 458.5, ['Anthony Noghes, and onto the start-finish straight!', 'Through Anthony Noghes, back onto Boulevard Albert the First!', 'Anthony Noghes, named after the founder of this race!']],
    ],
    elev: [[0.0767,3],[0.1167,4.5],[0.1447,6],[0.2067,15],[0.2647,26],[0.3097,33],[0.3647,40],[0.3787,41],[0.4177,38],[0.4387,35],[0.4547,32],[0.4657,27.5],[0.4777,23.5],[0.4917,20],[0.5167,13],[0.5367,10.5],[0.5867,8],[0.6327,5],[0.7177,3],[0.8357,2],[0.8537,1.8],[0.9107,1.5],[0.9607,2],[0.9857,2.5]],
    tunnel: [0.5337, 0.6347],
  };
  // "Bakreni gozd": forest circuit modelled on the track from a stylised top-down racer (a V with a tongue inside), evening light.
  // Long main straight with stands and pits → left at the bottom of the V → up the right leg past a sand pit → hairpin round a rock
  // bulb → down the tongue → tight hairpin → up past the big stand → across the top → sharp corner among the rocks → straight.
  const FOREST_DEF = {
    id: 'gozd', name: 'Bakreni gozd', theme: 'forest', laps: 3, halfWidth: 6.2, camYaw: 0.16,   // kino camera looks NNE, as measured from the reference
    desc: 'Gozdna proga v obliki črke V z jezikom ob jezeru: dolga ravnina ob tribunah in boksih (zapelji vanje in mehaniki ti popravijo avto), lasnica okoli skal, tesna lasnica v jeziku, kmetija, skalna obala, stene iz gum in gost iglasti gozd v večerni svetlobi.',
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
  };
  // Pikes Peak International Hill Climb (Colorado): a POINT-TO-POINT time trial from the start at 2862 m to the summit at 4301 m.
  // The real road is 19.99 km with 156 turns; this is a scaled version (~6.2 km, ~440 m of climb, average grade ~7%) that keeps
  // its character: forest S-bends, two ladders of hairpins (the "W's"), a fast ridge and the Boulder Park switchbacks below the summit.
  // Game axes: x east, z south (north = up on the minimap). The road is OPEN: points[0] is the bottom end, the last point the top end.
  //   start / finish / cps : [x, z] positions, snapped to the nearest centreline sample (cps = checkpoints CP1..CP4)
  //   elev                 : [x, z, h] keyframes (h = metres above the start line), snapped to samples, interpolated along s (not periodic)
  //   alt                  : real altitude shown in the HUD at the start line and at the finish (linear in h)
  const PIKES_DEF = {
    id: 'pikes', name: 'Pikes Peak', theme: 'pikes', open: true, timeTrial: true, laps: 1, halfWidth: 7,
    desc: 'Vzpon na Pikes Peak: kronometer od starta na 2862 m do vrha na 4301 m. Gozdni zavoji, lasnice \u201eW\u201c, hiter greben in serpentine pod zasneženim vrhom. Ni nasprotnikov, dirkaš proti uri.',
    realKm: 19.99, alt: [2862, 4301],
    start: [10, -39], finish: [-536, -3695], cps: [[-199,-991],[-186,-1666],[-362,-2164],[-519,-3202]],
    elev: [[0,0,-1],[10,-39,0],[-199,-991,57],[-186,-1666,150],[-362,-2164,244],[-519,-3202,337],[-536,-3695,440],[-483,-3781,443]],
    runoff: 0.55, inner: 3.2, side: 3.6, noCurbs: true, noGravel: true, offSurface: 'gravel', gradeForce: true,
    // named places of the real course, in its order (the scaled road cannot match every one, so d = metres after the start line,
    // chosen from the real order and altitudes: Brown Bush Corner and the Ski Area on the first hairpins, Glen Cove at the foot of the
    // W's, Devil's Playground and the Bottomless Pit on the ridge, Boulder Park on the last switchbacks); say = the commentator's lines
    names: [
      { n: "Hansen's Corner", d: 240, say: ["Through Hansen's Corner, the climb is on!", "Hansen's Corner, up into the pines!"] },
      { n: "Engineer's Corner", d: 578, say: ["Engineer's Corner!", "Into Engineer's Corner, still in the trees!", "Engineer's Corner, keep it tidy!"] },
      { n: 'Halfway Picnic Grounds', d: 1000, say: ['Halfway Picnic Grounds, the fastest part of the course!', 'Flat out past the Halfway Picnic Grounds!', 'Through the picnic grounds, three thousand metres up!'] },
      { n: 'Brown Bush Corner', d: 1720, say: ['Brown Bush Corner, the first big hairpin!', 'Hard on the brakes for Brown Bush Corner!', 'Round Brown Bush Corner!'] },
      { n: 'Ski Area', d: 1964, say: ['Up past the old Ski Area!', 'The Ski Area hairpin, climbing through the trees!'] },
      { n: 'Glen Cove', d: 2688, say: ['Glen Cove, the trees are thinning out!', 'Up to Glen Cove, about halfway up!', 'Glen Cove, and now the switchbacks!'] },
      { n: "The W's", d: 2918, say: ["Into the W's! Hairpin after hairpin!", "The famous W's, left, right, left!", "Climbing the W's above the tree line!"] },
      { n: 'Cove Creek', d: 3564, say: ['Cove Creek, out of the switchbacks!', 'Past Cove Creek, the air is getting thin!'] },
      { n: "Devil's Playground", d: 4050, say: ["Devil's Playground! Nothing but rock and sky!", "Out across Devil's Playground, flat out on the ridge!", "Devil's Playground, lightning country up here!"] },
      { n: 'Bottomless Pit', d: 4466, say: ["Past the Bottomless Pit, don't look down!", 'The Bottomless Pit, a huge drop off the side!'] },
      { n: 'Double Cut', d: 4632, say: ['Through Double Cut, carry the speed!', 'Double Cut, one wide corner!'] },
      { n: 'Boulder Park', d: 5360, say: ['Boulder Park! Granite boulders everywhere!', 'The Boulder Park switchbacks, over four thousand metres up!', 'Into Boulder Park, the summit is close!'] },
      { n: 'Olympic', d: 5854, say: ['Round Olympic, the summit is in sight!', 'Olympic, one of the last corners before the top!'] },
    ],
    points: [[0,0],[3.5,-12.9],[6.9,-25.8],[10.3,-38.6],[13.3,-49.5],[16.2,-60.4],[19.1,-71.2],[22,-82.1],[24.9,-93],[27.8,-103.8],[30.7,-114.7],[33.6,-125.6],[35.7,-135.8],[36.4,-146.3],[35.7,-156.7],[33.6,-167],[30.5,-178.6],[27.4,-190.2],[24.3,-201.8],[21.2,-213.4],[18.1,-225],[16.3,-235.3],[16.3,-245.8],[18.1,-256.1],[21.7,-265.9],[26.9,-275],[33.7,-283],[42.5,-291.8],[51.3,-300.7],[60.2,-309.5],[69,-318.4],[75.2,-325.7],[80,-334],[83.3,-343],[84.9,-352.5],[84.9,-362.1],[83.3,-371.5],[80,-380.6],[75.2,-390.9],[70.3,-401.3],[65.5,-411.6],[60.7,-422],[55.8,-432.4],[51,-442.7],[46.2,-453.1],[42.1,-463.3],[39.4,-473.9],[38,-484.9],[37.9,-495.8],[39.1,-506.8],[41.4,-519.9],[43.7,-533],[46.1,-546.2],[46.7,-555.6],[45.4,-564.9],[42.2,-573.8],[37.2,-581.7],[30.6,-588.5],[21.7,-596],[12.8,-603.5],[3.8,-611],[-5.1,-618.5],[-14.1,-626],[-23,-633.5],[-29.8,-640.1],[-35.7,-647.6],[-40.6,-655.7],[-44.2,-664.5],[-46.7,-673.7],[-47.9,-683.1],[-47.8,-692.6],[-46.4,-702],[-43.8,-711.1],[-39.7,-722.4],[-35.6,-733.7],[-31.5,-745],[-27.4,-756.3],[-23.3,-767.5],[-20.9,-776.6],[-20.3,-785.9],[-21.4,-795.2],[-24.2,-804.1],[-28.6,-812.3],[-34.5,-819.6],[-41.6,-825.7],[-50.8,-832.1],[-60,-838.6],[-69.2,-845],[-78.5,-851.5],[-87.7,-857.9],[-96.9,-864.4],[-106.1,-870.8],[-115.3,-877.3],[-123.6,-883.7],[-131.1,-891],[-137.8,-899],[-143.7,-907.7],[-148.6,-917],[-153.9,-928.3],[-159.2,-939.6],[-164.4,-951],[-169.7,-962.3],[-175,-971.3],[-181.7,-979.4],[-189.7,-986.1],[-198.8,-991.3],[-209.7,-996.4],[-220.6,-1001.5],[-231.4,-1006.5],[-242.3,-1011.6],[-253.2,-1016.7],[-262.1,-1021.6],[-270.1,-1027.8],[-277.2,-1035.2],[-283.2,-1043.4],[-287.9,-1052.4],[-291.2,-1062.1],[-294.2,-1073.1],[-297.1,-1084.1],[-300.1,-1095.2],[-303.1,-1106.2],[-306,-1117.3],[-309,-1128.3],[-311.9,-1139.3],[-315.8,-1149.4],[-321.4,-1158.6],[-328.8,-1166.5],[-337.6,-1172.8],[-348.4,-1179],[-359.3,-1185.3],[-370.1,-1191.5],[-380.9,-1197.8],[-389,-1203.8],[-395.6,-1211.4],[-400.3,-1220.3],[-402.9,-1230],[-403.3,-1240],[-401.5,-1250],[-397.5,-1259.2],[-391.6,-1267.3],[-384,-1273.9],[-375.1,-1278.7],[-365.4,-1281.4],[-354.5,-1283.1],[-343.5,-1284.8],[-332.6,-1286.6],[-321.6,-1288.3],[-310.7,-1290],[-299.7,-1291.8],[-285.6,-1293.3],[-276.1,-1294.1],[-266.7,-1295.6],[-257.5,-1297.7],[-243.5,-1300.7],[-232.6,-1302.4],[-221.6,-1304.1],[-210.7,-1305.9],[-199.7,-1307.6],[-188.8,-1309.3],[-177.8,-1311.1],[-171.3,-1313.8],[-166.7,-1319.2],[-165.1,-1326],[-166.7,-1332.9],[-171.3,-1338.3],[-177.8,-1341],[-188.8,-1342.7],[-199.7,-1344.5],[-210.7,-1346.2],[-221.6,-1347.9],[-232.6,-1349.7],[-243.5,-1351.4],[-257.5,-1354.3],[-266.7,-1356.5],[-276.1,-1358],[-285.6,-1358.8],[-299.7,-1360.3],[-310.7,-1362],[-321.6,-1363.8],[-332.6,-1365.5],[-343.5,-1367.2],[-354.5,-1369],[-365.4,-1370.7],[-371.9,-1373.4],[-376.5,-1378.8],[-378.2,-1385.7],[-376.5,-1392.5],[-371.9,-1397.9],[-365.4,-1400.6],[-353.7,-1402.5],[-342,-1404.3],[-330.2,-1406.2],[-318.5,-1408],[-306.8,-1409.9],[-295.1,-1411.8],[-283.3,-1413.6],[-271.6,-1415.5],[-262,-1418.3],[-253.4,-1423.3],[-246.3,-1430.4],[-241.1,-1439],[-238.3,-1448.6],[-237.9,-1458.6],[-239,-1470.5],[-240,-1482.5],[-241.1,-1494.4],[-242.1,-1506.4],[-243.1,-1518.3],[-243.1,-1528.8],[-241.3,-1539.1],[-237.7,-1549],[-232.5,-1558],[-225.8,-1567.6],[-219.1,-1577.2],[-212.4,-1586.7],[-205.7,-1596.3],[-199.1,-1605.8],[-192.3,-1615.4],[-187.2,-1624.6],[-183.8,-1634.6],[-182.4,-1645],[-183.1,-1655.6],[-185.7,-1665.8],[-190,-1677.6],[-194.3,-1689.3],[-198.5,-1701],[-202.8,-1712.8],[-207.1,-1721.5],[-213.2,-1729.2],[-220.8,-1735.3],[-229.5,-1739.6],[-238.9,-1742],[-250.5,-1743.7],[-262,-1745.3],[-273.6,-1746.9],[-285.1,-1748.5],[-296.7,-1750.1],[-308.2,-1751.8],[-315.6,-1753],[-322.9,-1754.6],[-332.7,-1756.7],[-342.6,-1758.1],[-352.6,-1758.8],[-360.1,-1759.3],[-367.6,-1760.1],[-379.1,-1761.7],[-390.6,-1763.3],[-402.2,-1765],[-413.8,-1766.6],[-425.3,-1768.2],[-436.9,-1769.8],[-443.5,-1772.5],[-448.2,-1777.9],[-449.9,-1784.8],[-448.2,-1791.8],[-443.5,-1797.2],[-436.9,-1799.8],[-425.3,-1801.5],[-413.8,-1803.1],[-402.2,-1804.7],[-390.6,-1806.3],[-379.1,-1808],[-367.6,-1809.6],[-360.1,-1810.4],[-352.6,-1810.9],[-342.6,-1811.6],[-332.7,-1813],[-322.9,-1815],[-315.6,-1816.7],[-308.2,-1817.9],[-296.7,-1819.5],[-285.1,-1821.2],[-273.6,-1822.8],[-262,-1824.4],[-250.5,-1826],[-238.9,-1827.7],[-232.3,-1830.3],[-227.6,-1835.7],[-225.9,-1842.7],[-227.6,-1849.6],[-232.3,-1855],[-238.9,-1857.7],[-250.5,-1859.3],[-262,-1860.9],[-273.6,-1862.5],[-285.1,-1864.1],[-296.7,-1865.8],[-308.2,-1867.4],[-315.6,-1868.6],[-322.9,-1870.3],[-332.7,-1872.3],[-342.6,-1873.7],[-352.6,-1874.4],[-360.1,-1874.9],[-367.6,-1875.7],[-379.1,-1877.3],[-390.6,-1879],[-402.2,-1880.6],[-413.8,-1882.2],[-425.3,-1883.8],[-436.9,-1885.5],[-443.5,-1888.1],[-448.2,-1893.5],[-449.9,-1900.5],[-448.2,-1907.4],[-443.5,-1912.8],[-436.9,-1915.5],[-425.3,-1917.1],[-413.8,-1918.7],[-402.2,-1920.3],[-390.6,-1922],[-379.1,-1923.6],[-367.6,-1925.2],[-360.1,-1926],[-352.6,-1926.5],[-342.6,-1927.2],[-332.7,-1928.6],[-322.9,-1930.7],[-315.6,-1932.3],[-308.2,-1933.5],[-296.7,-1935.2],[-285.1,-1936.8],[-273.6,-1938.4],[-262,-1940],[-250.5,-1941.7],[-238.9,-1943.3],[-232.3,-1945.9],[-227.6,-1951.3],[-225.9,-1958.3],[-227.6,-1965.2],[-232.3,-1970.6],[-238.9,-1973.3],[-251.3,-1975],[-263.7,-1976.8],[-276,-1978.5],[-288.4,-1980.2],[-300.8,-1982],[-313.2,-1983.7],[-325.6,-1985.5],[-337.9,-1987.2],[-348.2,-1990.1],[-357.4,-1995.6],[-364.8,-2003.3],[-369.9,-2012.8],[-372.3,-2023.2],[-371.9,-2033.9],[-369.9,-2045],[-368,-2056],[-366,-2067.1],[-364.1,-2078.2],[-362.1,-2089.3],[-360.1,-2100.4],[-358.2,-2111.4],[-356.2,-2122.5],[-355.2,-2133.2],[-355.8,-2143.8],[-358,-2154.3],[-361.7,-2164.3],[-366.9,-2175.4],[-372.1,-2186.4],[-377.2,-2197.5],[-382.4,-2208.6],[-387.6,-2219.7],[-392.7,-2230.8],[-397.9,-2241.8],[-403.1,-2252.9],[-408.2,-2264],[-412.1,-2273],[-415.3,-2282.3],[-418,-2291.7],[-420,-2301.3],[-421.4,-2311.1],[-422.1,-2320.8],[-422.2,-2330.7],[-421.7,-2340.5],[-420.7,-2352.1],[-419.7,-2363.7],[-418.7,-2375.3],[-417.6,-2387],[-416.6,-2398.6],[-415.6,-2410.2],[-414.6,-2421.8],[-413.6,-2433.4],[-412.6,-2445.1],[-411.5,-2456.7],[-410.5,-2468.3],[-409.5,-2479.9],[-409,-2490],[-409.3,-2500.1],[-410.4,-2510.1],[-412.2,-2520],[-414.8,-2529.8],[-418.2,-2539.3],[-422.3,-2548.5],[-427.1,-2557.4],[-432.5,-2565.9],[-439.3,-2575.5],[-446.1,-2585.2],[-452.9,-2594.9],[-459.6,-2604.6],[-466.4,-2614.3],[-473.2,-2623.9],[-480,-2633.6],[-486.8,-2643.3],[-493.5,-2653],[-500.3,-2662.7],[-507.1,-2672.3],[-512.3,-2680.4],[-516.7,-2689],[-520.4,-2697.8],[-523.2,-2707],[-525.3,-2716.3],[-526.6,-2725.9],[-527,-2735.5],[-527,-2746.7],[-527,-2758],[-527,-2769.2],[-527,-2780.5],[-527,-2791.7],[-527,-2803],[-527,-2814.2],[-527,-2825.5],[-527.5,-2834.9],[-529,-2844.2],[-531.4,-2853.3],[-534.8,-2862.1],[-539.1,-2870.5],[-544.8,-2880.4],[-550.5,-2890.3],[-556.2,-2900.2],[-561.9,-2910.1],[-567.6,-2920],[-573.3,-2929.9],[-579.1,-2939.8],[-582.9,-2948.5],[-584.9,-2957.9],[-584.8,-2967.5],[-582.7,-2976.9],[-578.6,-2985.6],[-572.8,-2993.2],[-565.5,-2999.5],[-557.1,-3004],[-547.8,-3006.7],[-536.1,-3008.8],[-524.4,-3010.8],[-512.7,-3012.9],[-501,-3015],[-489.2,-3017],[-476.6,-3018.6],[-468.1,-3019.5],[-459.8,-3021],[-451.5,-3023],[-439.1,-3025.9],[-427.4,-3027.9],[-415.6,-3030],[-403.9,-3032.1],[-392.2,-3034.2],[-380.5,-3036.2],[-373.7,-3039.2],[-368.9,-3044.9],[-367.2,-3052.1],[-368.9,-3059.4],[-373.7,-3065.1],[-380.5,-3068],[-392.5,-3070.1],[-404.4,-3072.2],[-416.4,-3074.3],[-428.3,-3076.4],[-440.3,-3078.6],[-452.3,-3080.7],[-464.2,-3082.8],[-474,-3085.6],[-483,-3090.3],[-490.9,-3096.7],[-497.4,-3104.6],[-502.1,-3113.6],[-504.8,-3123.4],[-506.8,-3134.7],[-508.8,-3145.9],[-510.8,-3157.2],[-512.8,-3168.4],[-514.8,-3179.7],[-516.7,-3190.9],[-518.7,-3202.2],[-521,-3215.3],[-523.4,-3228.4],[-525.7,-3241.6],[-528.9,-3252.1],[-534.5,-3261.5],[-542.3,-3269.3],[-551.8,-3275],[-562.3,-3278.2],[-575.2,-3280.4],[-588.1,-3282.7],[-601,-3285],[-614,-3287.3],[-624.9,-3289.8],[-635.9,-3292.3],[-647.1,-3293.7],[-658.2,-3295.1],[-671.1,-3297.4],[-684.1,-3299.7],[-697,-3301.9],[-709.9,-3304.2],[-715.9,-3306.8],[-720.1,-3311.8],[-721.6,-3318.1],[-720.1,-3324.5],[-715.9,-3329.4],[-709.9,-3332],[-697,-3334.3],[-684.1,-3336.6],[-671.1,-3338.9],[-658.2,-3341.2],[-647.1,-3342.5],[-635.9,-3343.9],[-624.9,-3346.4],[-614,-3348.9],[-601,-3351.2],[-588.1,-3353.5],[-575.2,-3355.8],[-562.3,-3358.1],[-556.3,-3360.7],[-552.1,-3365.6],[-550.6,-3372],[-552.1,-3378.3],[-556.3,-3383.3],[-562.3,-3385.9],[-575.2,-3388.2],[-588.1,-3390.4],[-601,-3392.7],[-614,-3395],[-624.9,-3397.5],[-635.9,-3400.1],[-647.1,-3401.4],[-658.2,-3402.8],[-671.1,-3405.1],[-684.1,-3407.4],[-697,-3409.7],[-709.9,-3411.9],[-715.9,-3414.5],[-720.1,-3419.5],[-721.6,-3425.8],[-720.1,-3432.2],[-715.9,-3437.2],[-709.9,-3439.8],[-697.6,-3441.9],[-685.3,-3444.1],[-673,-3446.3],[-660.7,-3448.4],[-648.4,-3450.6],[-636.1,-3452.8],[-626.6,-3455.5],[-618,-3460.3],[-610.6,-3466.7],[-604.9,-3474.6],[-598.9,-3485],[-592.9,-3495.4],[-586.9,-3505.8],[-580.9,-3516.2],[-574.9,-3526.6],[-570.8,-3535.1],[-568.1,-3544.1],[-566.9,-3553.5],[-567.1,-3562.9],[-568.9,-3572.2],[-572.1,-3584.3],[-575.3,-3596.3],[-578.5,-3608.4],[-581.8,-3620.5],[-583.1,-3630.8],[-581.8,-3641.2],[-577.8,-3650.9],[-571.4,-3659.2],[-562.6,-3668.1],[-553.7,-3676.9],[-544.9,-3685.7],[-536,-3694.6],[-527.6,-3703.1],[-519.1,-3711.6],[-510.6,-3720],[-502.1,-3728.5],[-493.6,-3737],[-487.6,-3745.6],[-484.9,-3755.7],[-483.8,-3768.2],[-482.7,-3780.6]],
  };
  // Nürburgring Nordschleife (Eifel, Germany), the real 20.8 km "Green Hell": one lap, clockwise, from the T13 start/finish line.
  // Centre line: OpenStreetMap (© OpenStreetMap contributors, ODbL), smoothed; metres, origin = the T13 start line, x east, z south.
  // Heights (NRING_H): SRTM + Copernicus GLO-30 elevation along the line, every 1/1035 of the lap from points[0] (320 m before
  // the start line), decimetres above 300 m a.s.l. (Breidscheid, the lowest point, ~335 m; Hohe Acht ~617 m; T13 ~620 m).
  // Scenery data for the world builder: land cover (OSM: forest / scrub / settlement, 16 m cells, run-length coded), terrain (the same
  // elevation models, forest canopy removed, 64 m cells, base64 bytes of 2 m steps), buildings near the track (OSM footprints:
  // [x, z, length, width, angle, height (0 = unknown), kind 0 house / 1 industrial / 2 grandstand]), bridges that carry the track over
  // a road (brO) and bridges over the track (brU), and the corner names shown on the HUD.
  const NRING_H = [3053,3065,3074,3079,3083,3086,3091,3099,3110,3122,3134,3146,3157,3168,3179,3189,3200,3211,3221,3230,3238,3245,3248,3250,3252,3255,3259,3261,3261,3255,3244,3229,3211,3193,3174,3157,3140,3125,3110,3095,3080,3063,3044,3024,3003,2984,2966,2949,2932,2917,2903,2891,2881,2872,2865,2859,2854,2848,2843,2839,2836,2833,2831,2829,2825,2820,2812,2804,2796,2791,2789,2790,2792,2795,2800,2803,2805,2804,2800,2793,2785,2780,2776,2774,2773,2774,2776,2782,2789,2797,2803,2808,2808,2804,2796,2784,2771,2755,2740,2725,2709,2693,2677,2662,2648,2637,2628,2621,2614,2608,2600,2591,2582,2575,2570,2569,2571,2577,2587,2600,2615,2631,2650,2671,2695,2720,2744,2766,2784,2795,2802,2805,2807,2808,2810,2812,2814,2816,2817,2818,2819,2821,2823,2827,2831,2834,2835,2835,2834,2832,2832,2833,2835,2839,2844,2848,2852,2854,2855,2852,2846,2837,2823,2806,2786,2764,2742,2719,2696,2674,2653,2636,2623,2613,2605,2599,2594,2591,2590,2590,2591,2593,2595,2597,2596,2594,2588,2581,2574,2567,2562,2559,2558,2556,2551,2540,2525,2506,2486,2467,2450,2436,2424,2413,2404,2395,2386,2378,2369,2360,2350,2339,2327,2315,2302,2290,2281,2274,2268,2262,2253,2239,2220,2198,2172,2146,2123,2105,2090,2075,2058,2038,2018,1997,1978,1958,1938,1918,1896,1874,1852,1830,1807,1784,1760,1737,1715,1697,1682,1670,1660,1651,1642,1633,1625,1619,1614,1613,1616,1624,1637,1653,1669,1683,1693,1699,1703,1707,1713,1721,1731,1740,1747,1754,1761,1769,1778,1785,1789,1791,1790,1786,1780,1771,1761,1750,1739,1727,1717,1709,1703,1700,1698,1698,1698,1699,1700,1701,1702,1702,1702,1701,1699,1693,1685,1676,1667,1659,1653,1648,1644,1639,1634,1630,1624,1616,1607,1597,1589,1582,1579,1578,1579,1584,1592,1603,1614,1623,1627,1627,1622,1615,1605,1592,1575,1554,1530,1506,1483,1465,1450,1438,1428,1420,1412,1404,1395,1386,1377,1367,1356,1343,1326,1307,1286,1262,1240,1219,1200,1182,1162,1140,1117,1094,1072,1050,1030,1012,996,982,970,961,953,945,937,926,912,896,879,864,852,843,834,824,813,799,784,769,753,736,720,706,693,681,668,654,639,625,612,599,586,573,557,540,520,498,477,458,442,429,419,408,396,381,367,356,349,348,352,360,372,390,414,444,479,515,547,572,590,601,608,612,613,610,604,595,589,586,589,597,608,619,631,643,655,667,677,686,694,699,702,702,701,700,701,703,708,713,716,713,707,699,696,699,709,724,740,755,769,782,791,795,792,784,776,772,773,778,786,796,808,824,841,858,874,889,902,915,928,939,948,955,964,974,985,995,1003,1011,1020,1030,1041,1050,1058,1063,1067,1072,1081,1094,1110,1123,1131,1135,1136,1136,1139,1147,1160,1180,1202,1225,1244,1260,1272,1283,1293,1304,1317,1331,1348,1368,1390,1413,1436,1459,1481,1500,1514,1521,1525,1534,1548,1566,1586,1605,1624,1645,1667,1690,1711,1732,1752,1772,1793,1813,1832,1853,1872,1891,1907,1922,1936,1950,1967,1986,2009,2033,2057,2076,2090,2101,2110,2120,2132,2144,2156,2169,2181,2192,2201,2209,2217,2227,2238,2249,2260,2272,2284,2298,2312,2328,2344,2359,2371,2380,2387,2391,2394,2396,2397,2400,2406,2413,2422,2433,2446,2460,2476,2491,2507,2520,2531,2539,2546,2553,2561,2571,2582,2591,2597,2597,2593,2588,2581,2575,2570,2564,2559,2556,2555,2557,2561,2567,2573,2578,2583,2590,2600,2611,2624,2638,2655,2676,2700,2725,2750,2775,2799,2821,2841,2858,2876,2897,2920,2945,2971,2994,3017,3039,3062,3085,3110,3132,3151,3164,3172,3176,3176,3175,3173,3173,3173,3174,3174,3174,3171,3165,3153,3140,3126,3116,3106,3096,3086,3075,3066,3056,3046,3035,3023,3011,2997,2982,2965,2946,2927,2908,2889,2871,2857,2848,2847,2851,2859,2868,2875,2878,2875,2867,2854,2836,2816,2794,2770,2747,2723,2701,2679,2659,2640,2620,2600,2579,2556,2531,2505,2479,2456,2436,2421,2410,2402,2396,2393,2396,2405,2420,2438,2458,2477,2495,2512,2527,2537,2543,2547,2549,2550,2552,2556,2561,2570,2583,2598,2613,2626,2632,2634,2632,2628,2620,2607,2589,2568,2545,2522,2500,2481,2464,2448,2434,2422,2412,2404,2396,2389,2382,2377,2375,2376,2381,2389,2399,2411,2423,2434,2443,2452,2460,2468,2474,2478,2477,2475,2472,2470,2469,2469,2470,2471,2470,2464,2453,2438,2423,2412,2404,2397,2389,2380,2373,2367,2364,2363,2364,2365,2364,2361,2357,2354,2351,2347,2344,2339,2335,2332,2329,2326,2323,2321,2320,2323,2326,2330,2333,2335,2335,2334,2334,2336,2338,2342,2348,2356,2365,2376,2388,2401,2414,2429,2443,2455,2465,2472,2477,2480,2481,2482,2484,2486,2490,2495,2501,2506,2512,2517,2521,2523,2522,2519,2513,2506,2500,2497,2496,2498,2506,2518,2534,2551,2570,2587,2602,2615,2624,2631,2635,2636,2633,2626,2617,2607,2597,2587,2578,2568,2560,2555,2553,2554,2556,2557,2557,2556,2553,2550,2549,2551,2557,2566,2573,2575,2571,2561,2548,2536,2524,2515,2506,2498,2491,2485,2481,2479,2478,2477,2476,2475,2474,2474,2475,2476,2476,2476,2474,2474,2473,2474,2476,2477,2480,2483,2486,2489,2492,2495,2498,2500,2502,2502,2502,2502,2502,2504,2508,2512,2517,2521,2526,2532,2537,2543,2549,2556,2566,2578,2592,2606,2618,2630,2640,2649,2659,2668,2677,2686,2694,2702,2710,2718,2726,2735,2743,2750,2757,2764,2772,2781,2791,2801,2812,2823,2832,2841,2848,2856,2865,2875,2884,2892,2898,2901,2900,2897,2891,2884,2878,2873,2868,2863,2858,2852,2845,2837,2830,2825,2822,2822,2826,2833,2843,2857,2870,2883,2895,2906,2919,2932,2945,2959,2972,2985,2997,3011,3025,3039];
  const NRING_DEF = {
    id: 'nring', name: 'Nordschleife', theme: 'nring', laps: 1, halfWidth: 5.5,
    desc: 'Nürburgring Nordschleife v Nemčiji, \u201eZeleni pekel\u201c: prava proga v pravem merilu skozi gozdove Eifla. Spust skozi Fuchsröhre do Breidscheida (335 m), vzpon do Hohe Acht (617 m), nagnjen Karussell, skoka na Flugplatzu in v Pflanzgartnu ter dolga ravnina Döttinger Höhe. En krog proti 12 tekmecem. Podatki: \u00a9 OpenStreetMap (ODbL), SRTM, Copernicus DEM.',
    start: [0, 0], runoff: 0.42, inner: 3.0, side: 3.4, gradeForce: true, elevSmooth: 16, realKm: 20.832,
    elev: NRING_H.map((h, i) => [i / NRING_H.length, h / 10]),
    bumps: [{ at: 0.12405, h: 0.7, w: 9 }, { at: 0.73068, h: 0.9, w: 8 }],   // the Flugplatz crest and the jump at Pflanzgarten
    bank: [[11962, 12108, 0.28]],   // the Karussell: the road banked into the bend (metres after the start line, slope), the inside a concrete bowl
    // corner names ([HUD label, x, z, the commentator's lines]; the German names stay on the HUD, the voice gets English where it would
    // stumble: the Foxhole, the old mill, the Swedish Cross)
    names: [
      ['Hatzenbach', -650.3, -26.2, ['Into the Hatzenbach esses!', 'Hatzenbach, left and right through the trees!', 'Weaving through Hatzenbach!']],
      ['Hocheichen', -1214.1, -283.8, ['Hocheichen, a quick right!', 'Through Hocheichen, keep it tidy!']],
      ['Quiddelbacher Höhe', -1676.5, -751.3, ['Flat out over the Quiddelbach crest!', 'Up the hill past Quiddelbach!']],
      ['Flugplatz', -1771.7, -971.9, ['Over the Flugplatz, and the car goes light!', 'Flugplatz! Airborne over the crest!', 'The old airfield, the Flugplatz!']],
      ['Schwedenkreuz', -1909.1, -2004.4, ['Schwedenkreuz, flat out downhill!', 'Past the Swedish Cross, full throttle!']],
      ['Aremberg', -2169.5, -2179.5, ['Hard on the brakes for Aremberg!', 'Aremberg, tight right at the bottom!']],
      ['Fuchsröhre', -1586.1, -2665.3, ['Down into the Foxhole, flat out!', 'The Foxhole, the fastest part of the lap!', 'Down the Foxhole and up the other side!']],
      ['Adenauer Forst', -1376.8, -3182.4, ['Adenauer Forst, a tight chicane in the trees!', 'Through Adenauer Forst, mind the kerbs!']],
      ['Metzgesfeld', -937.7, -3804.6, ['Metzgesfeld, a long fast left!', 'Sweeping through Metzgesfeld!']],
      ['Kallenhard', -1186.9, -3998.8, ['Kallenhard, right into the woods!', 'Through Kallenhard!']],
      ['Wehrseifen', -526, -4252.5, ['Steeply down into Wehrseifen!', 'Wehrseifen, a slow one, brake early!']],
      ['Breidscheid', -63.8, -4300, ['Down to Breidscheid, the lowest point of the lap.', 'Breidscheid, and now the long climb begins.', 'Over the bridge at Breidscheid!']],
      ['Ex-Mühle', -15.3, -4481.1, ['Round the old mill corner, and up the hill!', 'Past the old mill, climbing again!']],
      ['Bergwerk', 694.8, -4764.4, ['Bergwerk, the old mine, tight right!', 'Near Bergwerk, where Niki Lauda crashed in 1976.']],
      ['Kesselchen', 1421.7, -4044.9, ['Up through Kesselchen, the long climb!', 'Kesselchen, flat out up the valley!']],
      ['Klostertal', 2412.9, -4016.4, ['Klostertal, the monastery valley!', 'Through Klostertal, now up to the Karussell!']],
      ['Karussell', 2502.1, -3739.8, ['Into the Karussell! Dive into the concrete!', 'Round the famous Karussell!']],
      ['Hohe Acht', 3153.9, -4321.1, ['Hohe Acht, the highest point of the circuit!', 'Up at Hohe Acht, over six hundred metres high.']],
      ['Wippermann', 3656, -4096.6, ['Twisting through Wippermann!', 'Wippermann, keep it tidy through here!']],
      ['Eschbach', 3698.2, -3750.3, ['Eschbach, keep it on the road!', 'Down through Eschbach!']],
      ['Brünnchen', 3882, -3588.9, ['Brunnchen! The fans are packed in here!', 'Past the crowds at Brunnchen!']],
      ['Eiskurve', 3628, -3424, ['The Eiskurve, the ice corner!', 'Careful through the Eiskurve!']],
      ['Pflanzgarten', 3471.9, -3043.7, ['Pflanzgarten! Hold on for the jump!', 'Over the Pflanzgarten jump!']],
      ['Stefan-Bellof-S', 2977.4, -2403.5, ['The Stefan Bellof S, flat out!', 'Through the Bellof S, named after a lap record legend!']],
      ['Schwalbenschwanz', 2382.7, -2327.2, ["Schwalbenschwanz, the swallow's tail!", 'Round the Swallow Tail!']],
      ['Kleines Karussell', 2160.4, -2195.5, ['The little Karussell, into the concrete again!', 'Round the little Karussell!']],
      ['Galgenkopf', 2506.2, -1949.3, ['Galgenkopf, get a good exit!', 'Round Galgenkopf, onto the long straight!']],
      ['Döttinger Höhe', 2201.2, -1581.1, ['Onto the Döttinger Höhe, the long straight home!', 'Flat out down the Döttinger Höhe!']],
      ['Antoniusbuche', 685.7, -651.4, ['Under the bridge at Antoniusbuche!', 'Antoniusbuche, still flat out!']],
      ['Tiergarten', 367.6, -306.9, ['Tiergarten, nearly home!', 'Down through Tiergarten, flat out!']],
      ['Hohenrain', 168.4, -32.4, ['The Hohenrain chicane, nearly at the line!', 'Through the Hohenrain chicane to the line!']],
    ],
    brO: [[-1472.5,-539.3],[-48.3,-4326.8],[2292.1,-1635.6],[-128.8,-125.7],[48.6,-0.7]], brU: [[-2092.9,-2297.2],[661.1,-636]],
    bld: [[3016,-2403.8,4.1,3.7,-2,0,0],[759.5,-4745.3,8.1,6,2.5,0,0],[-1570.9,-575.4,31.7,13.9,-0.5,0,0],[1056.4,-915.2,13.6,7.5,-0.6,0,0],[-57.4,-4436.7,21.4,12.5,-2.3,0,0],[-23.4,-61.6,115.3,20.6,-2.4,0,2],[1.7,-4344,13.6,13.3,2.3,0,0],[-66.8,-4474.5,10.5,9.8,-0.4,0,0],[-20.6,-4283.3,15.6,12.3,0.7,0,0],[1095.3,-958.3,17.2,15.7,1,0,0],[-75.6,-4469.8,9.4,9.4,-0.4,0,0],[-114.7,-4334.7,9.5,6.6,-2.7,0,0],[1109.5,-975.3,10.9,10.8,0.2,0,0],[-80,-4422.5,38.5,14.6,-0.7,0,0],[-83.2,-4484.1,21.9,9.1,-0.7,0,0],[-103.3,-4346.7,20.8,10.4,0.7,0,0],[-75.2,-153.2,17.4,11.6,0.6,0,0],[-90.1,-4441,12.8,8,-1.9,0,0],[953.3,-893,8.8,8.5,0,0,0],[2174,-1488.2,49.4,27.2,2.9,0,1],[21.4,-4309.3,7.7,7.4,0.2,0,0],[-3.7,-4262.6,10.6,7.9,-2.4,0,0],[-133.3,-4359.8,13.9,11.9,-1.1,0,0],[921.7,-881.9,19.8,9.3,-1.2,0,0],[-8.5,-98.2,14.7,13.8,0.1,0,0],[-103.1,-4447.7,24.3,19.7,-0.3,0,0],[936.6,-895.8,9.4,8.3,-1.6,0,0],[1947.6,-1334.4,37.7,24.9,1.2,0,1],[-80.8,-4521.2,8.2,7.6,-1.3,0,0],[950.9,-907.7,7.6,5.4,1.5,0,0],[1444.6,-1028.8,32,28.6,0.3,0,0],[1767.5,-1223.6,41.5,38.2,1.2,0,1],[1991.1,-1357.2,40.6,38.2,-0.4,0,1],[-28.7,-129.8,15.8,10.6,0.6,0,0],[-186,-4386.1,58,33.3,-2.6,0,0],[9.4,-4260,8.5,7.6,-0.7,0,0],[1914.9,-1309.6,39.5,29.1,-1.9,0,1],[50.6,-4335.1,29,11.7,-2.2,0,0],[-82.1,-4533.8,12.7,10.6,-1.3,0,0],[-95.5,-4517.2,7.8,7.8,1,0,0],[935.5,-907.9,14.9,6.3,1.6,0,0],[903.6,-891.8,19.2,17.5,0,0,0],[1847.1,-1263.6,46.1,34.6,1.2,0,1],[-126.9,-250.1,21,9.8,1.1,0,0],[938,-919.6,11.7,8.4,3.1,0,0],[-93.5,-230.3,11.2,11.1,2.3,0,0],[-2.4,108.3,84.1,46.3,-0.8,0,0],[-129.8,-4387.6,11.4,7.9,-1.1,0,0],[1437.9,-1002.5,14.5,11.6,0.3,0,0],[-104.6,-4531.1,19.1,18.8,-2.1,0,0],[-106.5,-246.5,12.8,11.9,-0.4,0,0],[34,-4265.7,13.7,12,0.9,0,0],[127.7,-158.5,13.7,11.3,0.1,0,0],[907.4,-911,20.7,9.8,-1.6,0,0],[-53.8,-196.9,15.2,11.5,-1,0,0],[1476.7,-1020.5,23.9,7.3,1.9,0,0],[-30.6,-166.4,10.7,9.7,1.9,0,0],[-74.1,-226.6,10,9.7,-0.8,0,0],[47.1,-4276.3,21.7,11.4,2.5,0,0],[1813.8,-1220,14.7,12.3,-0.4,0,0],[-117.1,-263.7,14.7,9,0.9,0,0],[-155.1,-277.6,8.8,7.8,-3.1,0,0],[68.4,-4309.7,18.4,12.4,0.9,0,0],[-47.8,-206.2,11.5,7.1,0.6,0,0],[-127.4,-4520,18,17.5,-2.1,0,0],[1438.1,-984.1,15.7,9.8,1.9,0,0],[1642.6,-1110.3,9.7,7.9,-0.4,0,0],[-136.7,-279.4,9.4,7.6,0.4,0,0],[1,-148.3,21,11.1,0.1,0,0],[1071.4,-1030,8,5.2,2.4,0,0],[-266.5,-4428.8,40.8,28.3,0.7,5.5,1],[18,-4213,10.3,9.4,-0.2,0,0],[21.3,131.9,84.4,53.4,-0.8,0,0],[-455.5,-4420.7,9.7,7.2,1.6,0,0],[2068.5,-1357.6,60.7,55.7,1.2,0,1],[1496.1,-1010.1,12,8.4,-1.3,0,0],[-25.4,-196.5,13.6,12,-1.2,0,0],[-155.4,-4435,64.8,27.9,0.9,0,0],[1532.4,-1026.3,11.6,8.8,1.9,0,0],[49.1,-4233.9,9.8,9.1,2.8,0,0],[2132.2,-1377.8,54.5,23.5,1.2,0,0],[12.3,-160.6,15.9,10.8,1.7,0,0],[29.6,-4207.1,8.7,8.1,1.5,0,0],[1513,-1008.1,10.7,7.4,-1.3,0,0],[1634.4,-1079.8,8.9,8.1,2.8,0,0],[106.7,-193.5,33.3,14.6,-1.6,0,0],[60.3,-4235.2,14.2,7.5,-1.9,0,0],[1463.2,-970.1,14.1,11.7,0.2,0,0],[1779.1,-1162.3,36.4,22.8,-0.4,0,1],[-149.7,62,19.7,17.7,-0.1,0,0],[-494,-4435.1,11.6,6,-1.8,0,0],[1530.3,-1008,11.9,10.4,0.3,0,0],[2205.9,-1411.6,57.8,48,0,0,1],[-95,-4594.5,47.9,29.4,-2.1,0,0],[-505.5,-4440.2,12.1,10.2,1.5,0,0],[35.5,-4189.5,14.2,11.4,3,0,0],[1604.1,-1046.3,7.8,6.6,2.6,0,0],[88.5,-190.5,7,6.6,0,0,0],[1827.6,-1181.6,35.6,17.4,-0.4,0,1],[-285.1,-4460.6,25.3,15.1,2.5,0,0],[-317.3,-4461.3,25.7,15.4,0.9,0,0],[1873.2,-1197.4,26,23.4,2.8,0,1],[-513.4,-4450.1,11.5,6.7,3.1,0,0],[-26,-4135.5,8.2,6.8,1.4,0,0],[-299.3,-4472.9,24.8,20.8,-0.7,0,0],[2324.7,-1465.1,59.2,38.5,-1.9,0,1],[81,-4215,11.2,9.2,0,0,0],[1411.6,-907.8,8.1,7.2,-1.3,0,0],[1935.5,-1224,59.9,23.7,2.8,0,1],[72.8,-201,17.2,17.2,1.4,0,0],[1533.5,-978.1,12,9.1,0.2,0,0],[2270.9,-1420.2,27.5,23,-3,0,0],[59.7,-4179.4,9.1,8.5,0.2,0,0],[-148.9,-4591.3,33.2,18.5,-0.3,0,0],[69.9,-4187.9,9.3,8.4,-1.4,0,0],[1411.5,-897,12.5,11,1.9,0,0],[-31.8,-280.8,23.9,10.6,-0.7,0,0],[10.5,-239.5,15.3,7.7,-1.5,0,0],[41.3,-4149.5,13.8,6.2,0.1,0,0],[1366,-861.4,10.6,9.1,1.9,0,0],[-477.7,241.9,107.6,25.5,-0.3,0,2],[-2.2,195.2,19.3,14,0.7,0,0],[23.4,-234,17.9,11.3,-1.4,0,0],[-195.8,148.8,16.4,7,2.2,0,0],[92,-4189.4,13.6,11.4,1.8,0,0],[1487.4,-926.9,14.1,9.5,-1.3,0,0],[1614.2,-1005.6,7.4,6.9,-1.2,0,0],[-214.1,165,17.4,9.1,-0.8,0,0]],
    lc: { x0: -2592, z0: -5168, nx: 431, nz: 352, cell: 16, rle: 'P______lP______lP______lP__9f___XP__3f___dP__1f___fP__zf___hP__xf___jP__vf___lP__uf___mP__tfSP___FP__rfTBf___EP__qfSEf___DP__ofRGf___EP__jfTHRAf___DP__efVJRBf___DP__afXLQCf___DP__XfXMSDf___CP__UfYMRFf___DP__RfYCgJSDf___GP__PfYBhKSCf___IP__NfYAhMSBf___KP__LfYPBRDf___KP__JfYAhCRLSBRBf___GP_b_bfXBgGYBUBSCf___EP_W_ffUCjGTGUBUCf___CP_U_gfQEjJSBTCTAXBf___BP_R_jfLDjOSAWATBZCf__9P_Q_lfIBiFTIRBYASBbCf__7P_O_CR_TfFAxgGgXAWBZASBdP__8P_N_CcAR_FfDBiEjfAAbASAf___MP_M_CXI_FfACgKgeBcASAf___MP_K7C0YH_FaEgIgDgdBdASAf___MP_J8ExVBRG_HWxAiFhEgCbCfAASAf___MP_J8GUL1R_AS0CgCiHjWDfDAf___QP_I3gyISN0TxC_DCgPASDfHBRAf___NP_H3jIUNzUD_DAwgIVEfLASAf___NP_G3jKUMzQATD_EGVCfQASAf___NP_G3gPRyQBSF_CEUCfTASAf___NP_F4PSyQCSF_ADTCfKCYASAf___NP_E6PQ0DSF-BSCfNEWASAf___NP_E6PQ0QDSD_AARCfOHUASBf___MP_D6PSzQERC_BQCfSFUARCf___MP_D5QPTzFRA_CQAfYBUARCf___MP_C5ROVIQDzGR_CQAfZAUARCf___MP_C5SKaFQFyGS_BQAfZAUARCf___MP_B5UHSHSCRHxHS_BAffARCf___MP_A5WCQCRBUDRAQJgwIT-BfeARCf___MP96XBQCRBXCSERBgLT9BfGBfGARDf___LP78ZCRBaCRBTBgLV7AxfFDfEBQDf__CCf1P68ZCRBcCXhLVB4AgyfEFfDARCf_7CRDf1P_BQ0aBSAfABWhMTE2AgzfFHeARCf_6Kf0P_ATxbBRBfBCWJYFyB1fGFeARCf_6Kf0P3QGfGAfEBUBUPH3fGEeBRBf_6NVCfoP2RGfFAfGBVPM4fGDfAARCf_8CUGQFfmP1RHfFAfHBRAQERPFg4fIBfABf__ACXLfmP0SGfFBfHBSCVPG3fICfAAf_-DZKflP0SFfGBfIBQDVPH2fJCeBf_8DeIbBfVPzTEfHBfIGUPI3fIDeBf_8CfCFaCfVPzTDfIAfLEUPJ2fIDTBYBf_8BfFDaDfUPyTEfHBfNBWPI2fIKYBf_7BfGDYDfVPyTDfHBfOAZPH1fIKZCf_5BfHCUEfYPxVCfGBfdPE3fGIcCf_4BfICRFfZPxfNCfgPB4fGCfFBf_3BfJJWBfQPxfMBflK8fGBfGCf_1BfKISGfPPxfKBfpHQ8fgDf_yAfMPDfOPwfJCfz8fiDf_bATAeAfOPCfNPwfHCfzA-fkCf_WIeAfTNfMPwfGCfsAUC-fmDf_QKeAfWLfMPwfFCfsBTE9fpPCf3ISFRDQAVBfXBfVPwfFCfrCTCRA_TfWAdMfjKWLRAVAfYCfUPwfGBfqCTCSD_QfuGfgDdLQDSAfaCfTPwfGCfoDSBUE_QfzDfcBfBPBRBfbCfSPwfICflESBUE_Rf0EfYAfDPARBfdCfRP2fDCfjFSBVE_Rf2EfTBfEORAfgCfQP2fECflCSBVPXf3DfRBfDORCfgEfOP2fGCfpBVPYf4DfOBfDMTCfhHfLP2fHLTBf__VCfLCfDPCfkHfLP2fNFTCf__VCfJBfFOfmJfKP2fOFSDf__VDfGBfFKfrEfPP3fOETDf__WCfDCfFHfvEfPP3fOFTCf__XHaCfGFfxEfQP2fPGf__fGXCfGFfzDfRP2fQFf__hFVBfGFf1CfSP2fQFf__iLfFGf1DfSP2fQFf__lDfJGf2DfSP3fPGTBf__7Ff3DfKHP3fNBQFRCf__8Ef3DfKIP4fLCQBQHUBf__1Ef3EfJIP5eNQCREYAf__0Cf4EfIJP7ZPBQBSEf____MKfBJP7ZPERGf____MKeKP6aPDSGf____NKdKP5bDRLTHf____NKbLP5bDQMTHf____QIaLP5bDQLRLf____QIYMP5aDRKRLf____SEzBUNP6XFRKQLRAf____RE2PBP6WFTIRKRAf__PBf_xD5NP6WEVGRNf__QJf_pD4OPyQGVEXERNf__QLf_pC4OPwSHUDSCTCRNf__RLf_pC3PAPvTHTDgRESBRNf__VFf_sC2PBPuUISgBhQJROf__ZAf_tBUyPBPtUJjQiQIRPAf____XCWPCPsVKgSiIRPAf__dDf_mCWPCPrWKUgISMf____bCVPDPqXKTJSMf____bDUPEPqYJRKTMf____OBZETPFPpZPGUMf____MPDSAQPEPobPEVMf____LCYIQASPDPobPDUOf____LBZGQBVPBPncPCTPBf____KBcCRBXPAPncPBRBQPBf____KBfBBaNPncPARASPCf____IBfBBbNPmdLgBTAQPDf____IBfABdMPmeJgATPHf____HBfABeMPmeHgBRPKf____HAfABfBLPmfAFgBRDQLQHf____HAfABfDKPmeEgCREREXFf____HAfABfEKPleDRDREfAEf____GBeBfGJPldDTCREfBCf____HAeBfHJPldDTCREfCAf____HBbDfSPkfACTBREf____aBbDfTPkfHCQEf____aBbBfVPjfICQAf____dCaBfWPjfICf____fBaDfVPjfHCf____gBZHfSPifHDf____hARBUKfQPifHCf____iARAVJfRPifGCf____jBQBQBQKfRPifFBf____lBQDQLfRPifFBf____lPDfSPifFAf____mFQMfRPifFAf____mEQPfPifFAf____mEQPfPifFAf____mDQPgPhfGAf____mDQPgPhfGAf____mCQPhPhfGAf____mCQPhPgfHAf____mBQPiPffIAf____mBQPiPdfKAf____mPlPdfJAf____nDxPfPefIAf____mDzPePaQCfHAf____nBQAyPfPZfMAf____mEwPhPYf_____CEQBwPhPZfLAf____hGRPkPWf____-GTPkPVfCCYAf____eFVPlPUfBFf____mCZPlPSdKWAf____dCaAQPjPRbMWAf____dBcASPhPQaNWAf____DAfJBcBUPfPPXPBWAf____EAfIBdBWPdPNYPCVAf____FAfHCdAZPbPLaPBVAf____dCeAYPcPJcPAVAf____eBfAAYPcPGfANVBf___dAfvCeBYPcPEfCNUBf___dBfvBfAAZPcPCfEMUBf___cDfuCfAAZPcPAfFNTBf___cEfuBfLPdNfGNTBf___bGftCfAAZPdPAfENTAf___bGfuBfBAZPdPDfBMTAf___aIftCfBAXPfPCfBNSAf___aJftBfBAXPgPAfCNSAf___aKfsBfCAUPjNfENQBf___aLfrCfBBTPkMfDNhAf___bLfrCfCBRPmMfCNgBf___bMfqCfDAQPoGfBPCRgAf___dIfsDfEAQPoGfCLVgAf___dGfGCfUEfFPqFcCSJXAf___dFfJAfUDfHPqFYPCYAf___eDfvDfHPrEWPEWCf___eCfvDfJPrEUPEWBf___hAfNCfPEfKPrESPHTBf____AGfIHfMPrDSPFiQCf____BISkRhXIfNPsDQPGhCf____CHgErRKfOPsPKgCQAf____BDjBiCnFhHfOPsPIgDf____DCgChCiMhMfMPsPIgCf____CChDgGgIhPDfIPtPIgBf___4CVCgPBkPLf_CPLf___4DTChPkf-PIgCf___3DTCgPof7PIgDf___3DSCgPsf3PJgDf___4IgIhPjf0DRPEhDf___4HgGiP_oDUPDhDf___5NhP_oDRCQPFgDf___5LhEYP_aEQCRPGgDf___4KgFaP_YEQPNgCf___4JgEdP_WEQPOhCf___4IfMP_NPWgCf___3Kf_nPXgBf___4CSFf_lPYgBf___3BXDf_jGQPRgBf____DBf_jHWPKgBf____EBf_iIbPFgBf____EAf_iIfDNhAf____EBf_hJfDNgBf____EAf_hKfJGhAf___fAfTBf_gLfIHgBaGf___NAfSBf_gMfGIgBYIf___OAfSAf_gOfEJgAWKf___xAf_gPAfDJgBVKf___xBf_fPCfBKgATNf___OAfRBf_fPegBRCQKf___MCfRBf_fPegBQEQKf___LDfQAf_gPfgARDQLf___LCfQAf_gPfgBQEQKf___LDfOBf_gPggAREQIf___PBfMBf_hPggBQEQHf___SBSCfEAf_iPjQMf___XFfACfGP_MPhgARLf___YGbCfGP_OPkhJf___aIWDfEDf_NPigAhJf___JAWBXDYDfDDf_QPigBgJf___IESEVCSBTCfBEf_TPjgLf___IgNTBRBQBQCeFf_WPwf___FDhLjSBSCdESAf_WPkgKf__4FVPJTCbEf_dPkQKf__2LRPISCRAWHf_ePkQAQGf__2OSJgJRCTKgDf_ePlQAQGf__0PAUPCRBVGhHf_dPlQAQGf__0HRGXMgCUEjwIf_dPlQARJf__wGSPKhBTEjzIf_dPnSJRCf__lATGTPHhHxk2Hf_dPoRPAf__iAQATFQBQPHgCgC0i4If_cPSTPAQASPAf__fCSAaPKgB_FHf_cPRUPAQASPBQP__eRAQAaPJgB_HHf_cPRUMTASP__vSBXPP_IHf_cPSTJWATP__saPOgB_NEf_cPSTJWATP__rYPPgC_Qjf_bPfXBSP__sXPR_Tv_ePfXCQNf__XIXPLgC_UAv_dPfXCQFf__eIZPIgC_UP_gPeYCQFf__cKaPJ_TP_jPcaCQFf__bKePBgC_SP_lPZdCQFf__bJfBNgD_QP_oPVXDVCQFf__bJfBPB_RP_pPTTJVBRFf__bIfDJgD_SP_pPSRLWBRGf__ZIVBaIgD_TP_qPSSKWBRGf__XKQHQPAhC___QPSSKWJf__WPWgD___RPTSJWAQGf__VPWgCg___TPVQJWAQFf__UPWhBhA___TPRQNWAQBf__WPXgCiB___SPRQNWAQBf__VPWgDiC_AF__7PgWAQBf__WPUgDhE6K__7PQRNVDf__YEyPJgChGg2gN__7PQRNVDf__YC1PGhBjDjziO__7PPULVAQBf__YA4PEgBgAjAgwgChwiPB__7PPULVAQBf__YAgA3PBgEgDgxDjP__PPPSNUBQAf__YCh1PAgHgByEhP__RPOSOUAQAf__YEhAxAYGgJgAzP__XPOUMUAQAf__XHgAZFgFzCyP__ZPOULUAQAf__XJwYFgCyAzCyP__ZPOTMUAQAf__WJxWFgE4AyP__aPOTLUBf__YJwQLgG3AyP__aPNTMUAQAf__CCfBL1hCgI2BzP__ZPNTMUAQAf__BDfAL2gBhJ8P__ZPNSMUDf_-IbKg2CgL9P__YPNVJUCf_-IxBXK3BgO6AwP__YPNZEVBf_9J0CRLh1BhPA6P__aPOYEVBf_7NxRG2D0BgPB5P__cPOXFVBf_6DwKTF2DyBhPB6P__cPPWFVBf_5wCyIVE2DwCgPC7P__cPPVHVAaBcP_d5GXC2GhPB9P__cPOQAVGVBYDaP_d7FYB1CgCgPD-P__bPORAVGVAXEaCf_Z9EZA0BgCgPD1D3P__aPORAUHVBUGaDf_XxA7Ea0AgCgPE0E___iPOSATIVBTGaEf_VC7FfACgPG0D___jPPVKVBTFbDf_UC6HeBhPIzDzP__fPPSARKWBSGZFf_TB6IcCgLjPDwP__hPPTAQLWATFZFf_SB6KZChLjP__2PPWLWASFYHTP_O6MXCgNiP__3PQTAQNUBSEYGVP_M6NVCgBXDjP__4PQUAQMVBRDYFYP_K6NVBhBRP___IPRWKVAQBRCYDbP_I6NUCgBTP___IPRUARIVCQARDWEf_SA6NUBgBVP___IPSWHVEQARChUDf_SA6OSCgBWP___IPSUARFVGQAQCiSDfDP-7RPCgCwWP___IPTTATDUOjQCfDBf87TLgBhCyVP___IPUSAbCjCQGjAfEAf88UJgBgD0UP___IPVRAbBlBRFhAgASBeAf89UJgE1UP___IPWQAbiEgRGgBgHbAf8_AUEgBgD3UP___IPXahIQDQEhIaAf7_CTCiAgF7P___IPXYhJREQFpZAf6_EGgAgG7P___IPYVgMRJQNVAf6_CIgAgHR____SPZRAhNRDUAgdFf7-PHV____OPbQOTAXBf_O8PKV____OPaSMTAaAgf_L7PMX____MPbTJTAcBgf_J4PPbF____CPcTISAeBgf_H5PCgKbP___JPdUFTAfBBgf_D6PCgLbP___JPeUDUAfCBhf_B6PJQEaP___KPnUAfEBgf_A6IRASGTDbP___KPmVAfFBgf88IUBgBWDaP___LPmVAfHAf87JTBgCXBbP___LPhkVAfHBf76JTFYBaP___MPikUAfHEf46HUCgBaAaP___MPjkTAfIGf15GRBSBgCfGP___NPkjTAfIIfy6ESCRBgCf___kPmiSAfIKfnzU5DTDREfHP___OPniQAfKNfj0S6BUDRBgAxf___lPohBfLNfj0R5CUDQBgByf___kPrfPLfj_ABVDQD0f___jPrfUGfk_AAVCQBgA2f___iPtfUFfl9JQC3f___iPufUFfaEV7JQD3f___iPwfSGfTLT-JgA4f___iPxfSEfUNQ_AIgA6f___hP4fMEfTNQ_AHgB6f___hP5fMDfUIiA_BCRBgB7f___hP5fOCbBfFHgyBxB8SCgA8f___hP6fNCZBfGHgzG7RCgA4f___mP5fPCYAfIFQzI6QF4f___mP4fQCXBfJEQyK3RI1f___nP3fRESMfBDRwBQLzREgAzBzf___nP2fUPDfBDRAQNxRFgA1Byf___nP3fUFUHfACQAQPBQGgB3Awf___oP5fUBcERBVEQAQPEg0gA5Af___oP6fkPBQPG1gA7Af___nP7flMRPFwB0B8f___nP9fVxdITPFxAzC7f___oP_AfS1BUBTESAQPGxAyD4f___rP_DfH8AZAYPKxAwC4f___tP_GfD8BRwQ1RCQCQPHwCwD3T1f___lP_HfB8BQ9ASPIyBQD4R4f___jP_Ie9AQ4XPJ1QD1A____wP_Id9AQ5PSzAQDzD____vP_Jb9AR0PYxAQEyF____uP_KZ-AQPgQFxH____tP_LY9AQPgQEyBwF____tP_MY7AQPm3I____pP_NY5AQPlQB2B2A____oP_OTAwAS3AQPcxGRA_AA____oP_QzV0AQPcyDxARA9f___rP_RyVzAQPdxC0AQB5f___uP_SxVyAQPewC2AQA2f___xP_UVxAQPi3AQA1f___yP_WUARPh5QB0f___yP_bRPh6QB____3P__P6f___6P__U_____BP______lP______lP______lP______lP______lP______l' },
    dem: { x0: -2592, z0: -5168, nx: 109, nz: 89, cell: 64, lo: 240, step: 2, b64: 'PD1BQkA9OTYzLCUhHx4fISYsLzAuMz0/QkZGSU1LQjg0Pk5UUEpFQDw5PEVSYGpxdnd2dnZ1bWZeVk5KTlZcYGJmaGdmZmVpc3x7cm9zeH+IlKCrsre7u76+wMfMz9DOztDR0NDU1tbY2dvb2kBBQkE9OTUxLCckIyEfHx8iJSgqKi82OT5BQENJSkA0NEBMTUhDPjo4Oj9JV2Nrc3h2c3JwbGNbUktJSlFaYGFiZ2xvcHFub3V9f3h0dXqAh5Kdp6+0ub3BwsTKzM3Nzc3Oz9DQ09PR0tTV1dVHRkRAOjUwKygnKiolISAfICEjJCYoLDA1Nzc9Q0U9MTQ/RUE+OTY1OUBFTFdia3Bzb2toZF9ZUEdHSUxVXWJkZGZsc3h6eXd5gIaDfHh5foWNmKGrsbi/xMfIysrKy8zMzc3O0NHPzc7P0NLRS0lFPjYxLCkoLjIxLCYiISEhISIjJCUnKiwuMzg8Ny4xODk2NDIzOUJMU1ZaYmlraGNeWlZSTEZDSU9UWF5jZmVma3J3fICBhYqQj4d+en+KlJykq7G3vMLHysrKy8vKysrJy87OzMrMzc/Q0EpFPzgyLispLDM2NDArJiQhISIiIyIjIyUnKCktLiwpKy8wLy8zOUFLVFpaWl1iYVtUT0tHREFBRE1ZYV9eYmZoam5xdHd/h4uQmJmSiH+DkJ2kqKqus7W7wsjKy8vKyMfGxsnLzMrIycrMzcxEPzgyLy4tLzQ4ODUxLSkmIyIkJiYlIyMjJCQlJycnJykqKy0zPEFJT1BSU1NTVFFMRUE/PT0/REtUXmVnZWVpbG1xc3V3e4KIjpaamI+FhpGdo6anqKyvtsDIy8nIx8XDwMHGyMjHxsTEx8nJPjgzMTA0Njk8Ozk1MS0qJyUjJyosKycmJiUlJSYmJygoKCotNUFJTUxIR0hIRkZBPTs7PT4/Q0tRV19mbG9tb3JzdXd4eXyAhYqQlJaUjIiQmZ6hoqSqsbjCycnIxsTCwb2/w8TExMTBwcPGyDg1NjU0Oj0/Pzw5NTEuKykmJSsvMC8rKi0sKSgpKiorKikpLDE7REVCPjw8Ozk4Njg7QUdDQEhQVFddZ29ycnR3ent8fX6AgoWIjJCVmJaRkJOXm5+kq7S+xsrJx8XCwMC+vsHCwcPEwcLDxsc3ODs5OUBDQ0E+OjUyLywpJSgwMzMxLS81ODUxMTExMC4rKisuMjc3NDQzNTQ0NTc8Q0xQSEJKVlpcXWVuc3V3eX2AgYSGhoaHiYyRl5udnJqZmp+jqbC6xMrMycjGwr69vb29vr/CxMPDw8PCPz5AQEJGSEZDPjo3MzAtKiYsNDY1Mi8zOj08OTk4NzQxLywrLC0vLy8wMjY4Oj5ESE1TUkhDTVlgY2Vnam92eXp/hIiKi4qKioyOkpaanqKlpaarsba7wcjLy8nJxsPAvry7ubq8vsC/v7++vUZFRkRHSUlHRD88OTUyLikoMTg4NTIxNTxBQkJAPzs4NTQyLSwtLS4wNTxCQkFJUFNUVFFGQ09cZWhqbW5xdnt+gYeLjY6PjoyNj5SYm56ip6uvtbu9wMPHycfIycfFxMK/vLq4ubu6uLu6urlLS0pISkpJR0RAPjo3MiwoLDQ5NzQzNDc+RUlKR0Q/Ozg3NjEtLS0tMTpGT05JTlVaW1hTR0ROXWVqbnN2eHp+gYSKjpGTko+NjpKXmp2foqets7m9vb2/xMbExcjIxcLCwb25trW2trS3uLe2UVBOTU1MSkdEQj88NzErKi0yNzY1NTpARUpQUk9KRD88OTk2Mi8uLi82QlFXUlFUW19eWEpFTFlja3J2eHx/goSGipCUl5eUkJGWm56foqaprrO2t7a2usDCwMLFxcLAwsG8ubWxsLKytre0s1VUUU9OTEpHRENAPDUtKy0yNjg4NzpBSExSWVtWUElDPj08Ojc0MTAvMDhJWFxZVlhfY2BRR0tYY21zeHt/g4WHh4mOk5WXl5aXmZyfo6msra+wsLCwsre8vb2+wL++v8DAu7m2sa+usLS1srFXVE9MSklJRkNBPzkxLCwyOj47Oz5ETE5RWF9hXldPR0FCQD47OTY0Mi8zQVNeYV9bXmVmWktIU2BrdHl9goaJiomIio6Slpmam5udoqmurq6uq6qqrLC1uby6ubu6ury+v7u3tbKvrKyvsa6uVlFMR0VFRkVCPjkzLiwwOEFEP0BIUVVWWF5kaGdhVktGSEdDQT47OTYyMTtLW2RlYWBlZ2JVS0xUXmhxdXh8gYWFg4WLkpaam5yeoaeqqqqqqKSipamvtLe5t7S3uLe3ubq3tLKysK6rqqmpq1RPSURBQEBBPzs1Ly0vND5KSkJDTldcXmJna2xpYlZOTU5MSUhFQDs3MzE2RlhiY2Jka3BvZVlRT1JYX2VobHF2enuDi5CUmJyfoaSlo6CfoKCdnJ+lrbGztbGssLOxsrSzsrKxsbGvraqmpqtUTkhDPzw6Ozo2MS4uMjpGUVBGRVFdZGdqbW5saF9TUFRVVFNQTEU8NzQyNEFRWVtfaHJ5enVtZVxVU1ZZXWBjaGxyfYSKjpObnp+enpqWlZaWlpaboaesr7Gupqmtqquura2wsrKysK6rpaSoWFBJRUE8OTc0MS8vMjZATVZUTElSXmdtcXFvamRcWFpdXVxaVU9FPTg2NDU+SE9YZG94fYODfnduZ2NhYGBgX2BkaW92foaQmZuZl5WRjIyNkJKVmp+lqa6vqJ+hqaekpqanrbGysrCrqaaholdRSUZCPTk2MjAwMjc+SFRbWFFNUVpja29wbWhkY2VmZmRiXVZPR0Q/ODU0OT9JWGh2fYGHi4qFfXVzcnFwb21qamxqbHN+jJaWkpCMiYmMj5SWmZ2gpaquraabm6OkoJ6epKyvsLCuqamnoJxUTURAPTk1MjAxMjU9RlFaXVxWUlVbYGZrbGxpZ2lsbGpnYlxVTUlJRTo1NDU6RFRmdn+FiYuKiIN/fX19fX18enp6dnFwdoGKjImHhYeNk5eanJ6goaSnqaihlpWdoZ6Xm6arrKusq6qppZ+bTUY+Ojc0MzM1Nzg7QEpVXmFfWVZaXmNnaGpsbGprbGtoZV9YUU1MTEc8NzU1OD9MXW95foGBgYF/fX1+foCDhYaHhoR/d3V3fYCAg4aNlpucnZyampueoKKknpOOlp2blJymqKalp6qqp6KenUdBPTo2Njg8QkNCQ0RMV2FlY19bXmVqa2tsbW1raWdnZWFbVlJQTklCOjg3NjY6RVVlbXBycXJ1dXV2dnd8f4OHjI6OjYeBfHt9foSNlp2fnpyXkpGTl5meop+Tio6ZlpCaoqOioKKmpqSfnZtFQkA6NzlBR01OTEtJT1hiZ2ViX2BobG5vb25samdiYWFeW1dTT0pCOzk7OTg5OD9MWF5gYmNlaGlqamtucnV6gYmPkpSUkIuGhIaNlZmcnp2YkImGipCWnaKfkoeJkpCLlJ+gnpydoaKgnZubRkRAOzs7QUtTU1FPTlJaZGpoZmRkam5xcW9ubGppY1pZWVZSTklDPDo9Pjk6Pjw7QEhNUFNVV1lbXV1eYWRpcHmDiZCVmJmYlpSVl5eWl5qZlY+Gf4SOlZmcmY+EhImHhpCbnZqYmp2dnJybmkRAPDxDQ0BGUldVU1NYX2dsamhmZ2xxcnFvbWpnZF5UUE9MSURBPj1AREI6OD9DPjs9QEJER0lKTFBSU1hcYGdweICLlJmbnZ2amJaRj5GVlpSQiH6CjZCQkpGLgX6AgoWMk5eWlZeYmZmampo+PDxBSElDQkhUW1tYW2Jrb21rZ2lucnJxb2xoY11VTklGREJAQEFESU1KPjk+R0dBPT0+QEFCQkRHSVBcYWJla3N+i5acnJ2cl5ORi4aJjo+OjIR8gYqJhoiIg3x5gYuPj5CSkpOVlpeWlZaXPT5ARk1NSEVETVlfX15kbnNxbmxtcHJycG5pZF5YUUpFQ0VGSUtOT1JUUEQ7P0hLSkhHR0ZEQ0NDQ0VMWGJrcHR3gIuUmJiYlZCMiIJ+gYaHhoR+eH6Cf3x9fXp4fIeSmpuZmZmYmJiYlpSSkz9BRExUVE9OTE1UXmVmaW92dHFwcXJxcW9saGJaUk5IR0pLTVFUV1hZWFNIPj9GS05RUVBOS0lJSUZFR01ZZnJ8f4OKkJCOjo6MiIJ7dnh8fHx7d3R5eHNyc3V3f4iQmJ6fnp+gnp2dm5eUkI9CRUlRVlZVVlZSVF1ma25zeHh1dHNxb21samZhWlFJRk1RUVFTWFtcWlVQSD89QkdOU1RTUE9PT05MSEZIT15seIGGiIuJhYOFh4N9dG9xc3Fxb29xcW5udHl9g4uTmp6goKChoqOjo6Gak4+ORUlOVllZW19fWlZbY2pxd3p6d3ZzcW5qaWdkYFhQSUpSVFRUVVpbWVVPSUI/QUFDSlJVVFNSU1NTUUxJSExXZXF8gYGEg315fYKAd25qbGpnZ21wbmlsdX2DiY+VmZydnZ2foKOoqailnpaRjkdMU1teYGNlZGBbWmFqcnh6eXh2c3BsZmNhXVlTTUlOVldXV1dZV1NOSENBRUdFQ0VNVFZVVVVWVVNQTElKUV5pc3h5e3x1b3V7enNrZWVkYmhzcWhocnuAhYqQlJiZmpmanJ2ip6qqpqKdmJRJUFlgY2Vpa2hlYV5ianR7e3l3dXJtZ2FcV1NQTElKU1tdW1lXVlJLRUJCSExLSEZFSFBVV1dXV1ZVUk5LS05WX2lvbnBycGprcHBtaGJfXl9qcm1manN3eHuCiY6SlZeXl5eYnqOnqKelop6cS1NcYmZpbW9tamhkZm53fH56dHFtZ2RjYV5ZVFJOTlhfXVhTT01JRUNFSk9RT0tJSEhLU1dYWFhXVVJOTExMT1RbYmFjaGplYmVjYF5cWltdZGpnZGhscHV5fIKJj5OWlpWTlJmdoaOkpKSjoUtQWGBnbXFycW9uamtzen5+eHFvbGhoZ2VkYFtVT1JcXldQSkdGRkZHTFRYVlNOTUxKS1JYWVpZWFZST05PTk5OUVZXWFxfX1xaWFdYW19jX15gYWVqbXR8gYOCh4+TlZaUkZCTlZianJ6go6NNUVhgaG91dnVzc3JyeH2Bf3hxbWtsbWtqZmBaU1BZYVxSS0lJSkxQUFNdXltWUlFPTU1VW1tbWllWUlBUVVNSUVBQUVJTVVdWVVZYX2dqbWtkYWJpcXR4gIiMioiOk5SVk5COjo+QkZKUl52gUldeZ292e3t6eXh4en6Dgnxzbm1vcW9samZgWlRXY2VcUEtOUFJXXV1dYWBdW1hXVE9QWV1cXFtZVVNWW11cWllWVFRUU1NTVVdbXWZtcXNzcGpka3Z8fIKMk5SRkpWVlZOQjY2Mi4yMjZGWmVVbY256gIGDhIOBgYKCgn11bm5ycnFvbGllX1paYGdkWU5NVFtfY2VkZWRiYF5cWlZRVFxeXl1cWVVUXWNlZmNhXl1cWlZXW11gYF9lanB2eHVvaGt3gYKGjpWYmJeXl5WSj42LiYeHiImOk5VXXWd1g4uNjo6Mi4mFgHx3cW5ydHFvbWlkX11fY2dpZFpRUltoa2lpaGdlZGJgXltXU1ZdYGBfXltWVmBoampoZ2VjYV1YXWRmZmNkZ2tudHh5dG9tdX+FipCVl5iYlpWTkI6MioiGhISGipCSW19qdoONkZOTj42Kg314cnB0dnRwbWlkYF1iZWlta2ZcU1ZibW9tbGppZ2ZkYl9bV1RYYGNiYWBdWVdeaGxtbW1saWRcWmJpa2hmam5zdXl9fHZybnR+h46Ul5iYl5WVlJCOjIqJh4WDgoSKjmFjaXJ8hYuSlZGNiIF7dnR3fHp2cm1nZGRmaWtvcWxlXFRaZ29wb25samhnZGJfW1dWX2ZmZGNiYFxZW2dvcnRzcGtjXF9nbG1ra3B1enx+gYB3cm9zfYiPlZeWlpSTk5OPjo2Mi4qIhoOBhYhmZ2ludX6Gj5ORjIeAenl6fHt5dXJraGlsbnB0d3VsYFZUX21ycXBubGtpZ2VjX1tYXGZqaWdmZGJfW1xqdHh4dnFqYmBkaW5vb3F3fICChYV+d3Nzd36GjpSVlZWSkJGPjo+Pj46NjIqIg4CBbW1ucnuEiY2OjYqGgH6Af3t4dnFuam1xdHZ5fX54a1xUWGRvcXBvbm1samlmY19bXGRrbGxraWZjX1xgb3h6enZvaGNnbG1xdHR3foWKjo6Ifnl3eH6Gi5CUlZWUkY6Mi4yQkI+NjIuJh4SAfnR3e3+HjI2MjImGhIWHhoSBe3NsbXB1eX2Ag4SBeWpaVFpiaGprbm9vbWxqZ2JgXmFpbW5ubWpnYl9gZ3J6fXp0bGZlbHJ1eX+AgoiOkpKRioWDg4aIjpKUlpeYl5KMioiKjY6MioiHhoOBf317gYeLjpCPjYuJiImMjIqHhH1zb3R7f4KGioqFf3VmWVhcXWBlaW5wcG9ua2dlYmFjam5wcG5rZ2FfZGx3f4B6cmtoaXR7gYiMiouPlZeVko+NjI2QkJKVl5iYmZiTjouJiIqKh4aEgoF/fXt7gYWKjpGSkY+PkJCQj4+Oi4Z9dXd+hIiNj46KgnluYFldYmBjaWxucXJxb2toZ2VlZmtwc3JwbGdiYmhxfIOBenJta256hY2UlpOTlpmZlpSSkpKRkZKTlZaXl5iWkY6NiYaGhoOCgH59fH1+f4OHi4+Sk5ORkZKTlJKSko+JgHt+hIqQk5OQin9xZV5dYGJjZmtucHJ0c3Bsamloa21vc3V0cm9qZWZveYCEgXx3c29xfIeOlJmamZqZmJaUkpKRkI+PkJGSk5SUko+Ni4iFgoKAf35/gIGCg4SBhoqOkZKTlJWWl5mYmJeUjoaChImRmJeUj4h5aGFjZGVmaGpuc3V0dnRxb21sbG9ydXd3dnNxbWhnbnd+goSFgn14dnuCh4yTmZucmpiVk5KRkI6NjIyNjY2Ojo2MioeFg4GAgIGCg4ODg4OEhoiJjI+Rk5WWmJqeoKCempWQjIyRmJyalY2AcGNiZmlpaWtvdHl5eHd1c3JwcHJ1d3h6enh2c3BraGtvdX+Jjo+Mh4KDiIyOkZWbnJuZmJeZmJOPjYyMi4qKiYmKiIaGh4eGhISEhIOCgoKCgoWIio2QkpSVl5mbnqCioZ+dmpeXmp2cmJCFdmhkZWVnaWtuc3l8fHt6d3Z1dHZ5e3x8fXx7eHNwbW9vbm93hI6TlJGQkZSYmpmYm5ycnJydnZyYlJKSkpOSkI2JiomJioqKiIaEhIKBgICAgICAg4iNkZOWlpeXmp2ipqWlop+enp6cl5CHem1namlnZ2lsb3R5fX9/fXp6eXp+f4CBgX99e3dzcHJ5eXRwcnuHkJSUlJaZnaKioaCgoaGhoJ+dnJuamZiYl5SQjo2MjIuKiIaDgYB/fn19fX1+goSGiY6Rk5KSlJicoqenpaKgoJ6alI2FfHFnam5samlrbW9zeH2Bg4F/gH+Ag4SFhIOBfnt3dHN6goJ+eHV2gIqMjpCSmZ2hpaiop6ako6Ggn56dnJqZmZeTkZCOjYyKiIWDgH18e3p6enp7fIWHiImNkJGRkpSYnKCjpKOgnJuXkImCfHRrZmltbW1ubnBydnl9gYaGh4iFg4eJiYmGg4B9end5hIqKiIWAfHyBhYiOk5qcoKaqrKuno6Ggn56dnJuZmJeVkY6Ni4mIhoSCf3x5eHh4eHd3eXuHiIuMj5GUlZaXmJyfoKGgnJaSjYeBfHhwaWdnam5wcnR1eHt+gYSIjIyMiYeJjI2MioiFgn16fYeNjo6LhoJ+e3+Ij5Wbm56jpaippqKgnpycm5qZl5aTj4uHhYSDgoF/fnt5dnV1dXV1dXh5i4uNkJOVl5mZmpqbnp+fnZiSi4SCgXx0bGpqamtuc3d5e36BhYmLjZCQkI+Oj5CRkI6Oi4eDgIKHjY+PjImFgnx+hYuQlJeZm52goqCfnZuampmYmJeVkImEgH59fXx8enl3dXRzcnN0c3R2d42PkJOWmJqbnJydnp+gn5yYkomDhYF3bmxsbG1sb3V7gIKEiIyQkpKTk5OUlZeVlZSSkY+LioqKiYuMjIqGg4J+gYSGiYyPk5WYm5ycnJuamZiYmJiYlZCLhoJ/fXt5d3d2dXNycXBwcXFzdHWRkpSWmJqcnZ+goaKioqCemZSLhYd/c21ub29vbm92foOHio2QlJaWlpeXmZudnZqZmJWVlZWTkY2NjIuIhIKAf4GEhomLjpGUmJucnZqYl5eXmJmZmZeVkYuGg4B9end2dXRzcnFwb29wcXJzlZaXmZucn6CipKampqakoZyVjoiHfHFwcXJycXFxdH2Fio2RlJeZmZqZmp2foqSin5+enp2bmJaQj46MiYaEgoKFiIuOkJKUl5qbmpmXlpWVlpaWmJmYlpKMiIWCf3x5eHZ1dHNycG9ubnByc5eZmpyeoKOlqKurq6uqqKWfl5CMiHxxcnN0dXR0dHR7hIqQlJaZm5ydnJ2go6aqq6imqKmloJyYk5CPjYyJh4eJi42Qk5WXmZmZmJiWlJOTkpOUlZeWlZKOioeFgn98eXd2dXRzcXBubW1wc3Wam52foaOmqq6wsbGxrqunoJiQi4Z8c3R1dnd3eHl2d3+FjJKXmpueoKChpKerrq6rqayuq6Sem5aTkY+OjIuOj5GTlZeYmZmXl5WUk5KRkZCRk5SVk5GOioeFg4B9e3h2dXRzcXBvbm1tcHN1nJ6foqWnqq2ws7S1tLCsp6CXi4R+eHd3eHl5eXp9fHl9hYySmJucoKKkp6iqq62vrq2wsa6noqCbmJaVkY+Qk5WWl5iZmZiXlpWTkpKRj4+PkZKSkpGPi4iFg4B9e3h2dHNycXBvbm1sbG9yc56goqWoqqyvsbW3uLWwq6afloyCenh6e3t7e3yAhYR+fIKNlpucnqGkpqmrrK2usK+vtLWzrquloJ6bmJSTlZaXmZqampiXlZSTk5KRkI2PkZKSkI+OjYuGg4B+fHl3dXNycXFwb25tbGxucHGfoKKlqKqrrbG1uLi1r6qmn5WKgXl7fX1+f3+BiIyKg3+EkJibnaCjpqmsr7GxsrKys7a6urexq6ain5yYmJmZmpubmpmXlZORkZKRkY+NkJKSkY+Ni4iGg4B+fXp4d3V0c3NycXBvbWxrbG9xnJ2foaSnqaqus7a3tK+ppZ2TiYJ7fX+AgYSGiY2Oi4aDiJKZm5ygpKitsra4uLe3tri7v766ta+ppaKfnZ2cnJuampiWlJKRkJCRkZCPjY+RkZCPjYqHhYOBf317eXl3dnV0c3Fwb25sa2xvcZmanJ6ipaiqrbK1trOsp6GZkIqGf36BgoWMkZOUk46IhoqSlpiboKWqsrzDxL+8u7m6vL+9ubOtqaeko6GenZybmZeVk5GQj46Ojo+OjYuNjo+QkI6NjImFg4F/fn17eXh3dXNwb25tbGprbnCZm52go6apq66ytLSwqaSdlY+NiYJ/gYWMl56gnZqVjYmLj5OZnaKnrbbDzs/Jwb27ubm5uLWvq6impaOhn52bmpeVk5GQj46NjIuLioqJio2PkZKSkY+MiIaEgoB/fXt5d3VzcG9tbGtqa25wm52gpKWnqq2vsbOyrqmknZeUj4mFgYOIkJ2kpKGfm5KNjpGUnJ+ip663wsvPy8O+ure1tLOxrauopqWjoZ+dmpmWk5KRkI+OjYyLiomHh4qPkZKUlZSRjouIhoSCgH99end1dHJvbWtqampwc5+gpKepqq6vr6+ysa2ppqGclpCNiYKDiZGboKCdnp2XkpSXmJueoqeutr/GyMXAvLi2tLGwrqyqqKakoqGfnZqZlpSTkpGQkI+OjIuKiIeKkZSVlpeWlJGNioiGhIOBfnt4dXNxb21samlrcHWjpaeqrK6vsK+usbGuqaejnZWTkYyGhIiOkpSXm6CjnpiYnJycn6WqrbS9wsLAvbq4tbKwrq2rqaelo6GgnpyamJeXlZOTkZCQj42Mi4mHjJKVlpiZlJOSj4yJh4WFgn97eHVzcG5sbGtpa3J3pqiqrK2urq6urq+wrqqmo52ZmJSPi4eIjJGTl56mqaSenKCioKCorKyyur69u7m3tbOxrqysqqelpKOhoJ6cm5uamJaUk5GQj46NjIuJh4ySlZaYmZSSk5GOi4iHh4SAfHp4dnNwbm5ta2tzeKepq62sq6mpq6ytr66ppaGfn56Xk5CNjZGVnZ+gp6qnoqGlpqajpqqrsbi6ube2tLOysK+trauop6WkpKOjoqGfnJmWlJKQj46Mi4qKiIaJj5OWmJmVk5KRkI6LioqHgn17eXh1cnBwbmxscXejpKeopqSkpqiqrKyrpqKgn5+dmJaUk5KVmqGko6msqaWlqaqrpqWorLG2t7a0tLKxsK+vr66tqqmqqqqpqailoZ2ZlpORj42MiomIh4eFhouPlpqbmJWTkpGPjYyLiYSAfXt6d3Rzcm9ta25znJ6goaCipKaoqquqpqKenZ2enZuZmJeXm6ClqKeqrKmlpKmtrKmmp62ytLSzsrGwrq6trq+vrq6ur6+urayqpqGcmJWSkI6LioiHhYSDg4KFiZCXmZeVk5GQjo6OjIqHg4B+fHl3dXJvbGlrb5KVmJmcoKOmqqyqpqKem5udoKCenJuamqCmqa2sq62qpqWqr6+sp6ius7Szsa+uraysq62ytLS0srCvrq+tqqWfm5eVlJORjouJh4SDgYCAgYSJjpCQj46Mi4yNjYyKiYaDgX98eXZybmpoaGuMjpCVm5+jp6mqpZ6bmZibnqKjo6Khn6Cmqq2xsK6vrKmorbKyrautsLO1s7CurKurqqqttLm4trOwrq2sq6ejnpqXlZWVk5GQjYmFhIKAf3+AgoWHiYmJiIiJiouLiomHhYOBfnt3c29raGZmkJCOk5yhpKeopJ2XlpWXm6Ckp6iopqepq62vsbGxsrGurrK3tbKztLS1tbOwraysrKyqrLS5ubazr6upqKain5uYlZOSk5OTkY2LhoODgX9+fX1/gYSFhISEhYaHiImIh4WDgX16d3Ryb2xoZ5OSkJOcoaSmo5uWk5SVlpmeo6anp6mqqqusr7O1tbW1tLW5u7m4urq4t7azsK+vr7Cvqaiwt7a0sq6qpqOgnZqYlZORkZKSkY+NioSCgoGAfnx7e3x/gYGAgYKDhYWFhYSCgH98end2dHFta2uUk5GTnKKjn5mUkpOVlpeZm56ipKaoqaioqq2ytra3uLi5vL6+vr+9u7m3tLKysrGxr6inr7Szsa+sqaainpmXlZOQj42MjIuIh4WCgICBgH58enp6enx8fX6AgYKAf39+fXx9fXp4dnNxbm9wlpWTkpmcmpaTkpOVlpiZmZmanaGjpaempqmssLOztba4ub3BwsHBwL26uLe1tLSzsaylqbGzs6+sqqikoZyYlJKQjYuIhoaEg4KBgH5+fn5+fXt6eXh4eHp7fH19enl4d3Z4foB8d3VzcXBxcpqYlZGRkpGRk5SVl5mbm5ycnJ2fpKaoqampqq2vr7Cxs7a7vr++v8G/u7m4t7a1s7Cpo6mvsLCtqaekoZ6ZlZGOjIqIhoaHh4aCgH9+fX59fX18e3l4dnV2dnd3d3Rzc3Jydnp8enZ0c3Jyc3OenZiTkZGRkZOVl5mcn56enp6foaOnqausqaeqq6usra+ytbi6vL7Av7y6ube1tLKvqqOkqKempaKgn52ZlZKPjIqJiYiJiIaFg4F/f359fHt7e3t6eHZ1dHNzcnJxcG9vb3BxcnJyc3R0dHV1pqOdmJWUk5KTlpicoKKhoaCgoaKgo6msrq2npqipqqutsLK2uby9vr69u7i2tLKwr6ymoZ+dnJuamJmYlJGOjY2Mi4qKioiGhYSEgoB/fn18enl5eHd2dXVzcnFxcHBvbm5tbGxsbXBzdXZ2dqqmoJuYlpWUlJaYnKGioaKioaOloqKlqq6tqaioqqyur7Cztrq8vb29vLu4trOysa+tqKGdm5qamJaUk5GPjo+Qj46LioqIiIeFg4OBf4B/fHp5eHd2d3p5d3RzcnJxcHBwbm1sa2tsb3J0dHWqpJ6bmZiYl5aWmJufoKGio6Ojo6SmpaWqqqmpqqyvsLGytLi7vb6+vry6uLa1tLKvrKijoJ6cmpiWlZOSkZCRkJCQjYqIhoSCgYB/f4CBgH16eXh3eXp7e3l1dHRzcnJycnFvbm1rampsb3Bxpp+bmZqbm5qZmZmbnqCio6SlpKKlqaqopqepqquur6+xtLe7vb6/wL27ubi3t7azsK2ppaKfnZqZmJaUk5KRkZCPkI2JhYSCgH59fHx+fn19fHp4eHh5e3p5d3Z1dHNzdHRzcW9ubGppaWprbaOem5mZnJuampubnZ+hpKWlpqWlpqqrqaipqqutrrCytrm7vb6/v769u7q5ubi2s7Guqqajn56cm5mWlpWUlJSSj42LiIWDgYB+fHt7e3x+fn18enl5ent7enl4d3h2dXV0c3Jwb25samloaGmin5yZlpaXmZucnp+ho6Wmp6enp6iqqqmqq6usrrK1uLq8vb2+v769vr28u7q4trOwrKikoZ+enqCdmZmYmJmXlI+Mi4eFhIKBgYB/fXx+goKCgn98fX9+fHt6enx8eXd2dXNycXBwbmtpaGdnoqCdl5KQkpabnZ+goqOlp6ipqamqq6urrK2ur7K3uLq7vb6+vby7ury+vb26t7WxrKekop+enqCinpqbm5ubmZeTjoyKiIaFhIaIiIWCgoSEhISEhIaFg4B8e31/fXt4dnVzcnFwb25samhmZqKfmpaQjpCUmJyeoKGjpqeoqaqrq6ysra6wsbK1t7i5u72+vry6uLe5vL2+u7i1sauno6CenZ2foZ6anJubmpmWk5COjYyLiYiKi4qIhYSFhoeHiIuMiYeFf3x+goF+enZ0c3Jwb25ubGpoZ2Y=' },
    points: [[245.7,-140.3],[228.9,-124.6],[213,-108],[201.9,-88],[194,-66.4],[187,-49.8],[179.3,-39.3],[168.4,-32.4],[155.7,-30.1],[137.8,-31.9],[115.1,-34.7],[93.7,-30.2],[74.8,-18.9],[56,-5.8],[42.8,3.3],[35,7.9],[27.5,10.3],[19.5,9.9],[12,7.2],[2.5,1.7],[-15.3,-11.2],[-33.3,-25.6],[-50.8,-40.5],[-68.1,-55.6],[-84.7,-71.6],[-100.6,-88.1],[-114.9,-106.2],[-128.2,-124.9],[-141.6,-143.6],[-153.1,-157.5],[-161.1,-165],[-168.9,-169.3],[-177.8,-170.5],[-186.4,-168.1],[-194.1,-163.4],[-205.6,-152.4],[-218.2,-133.2],[-229,-112.9],[-239.7,-92.5],[-250.4,-72.1],[-261.2,-51.8],[-274.2,-33],[-290.3,-16.5],[-308.2,-2.1],[-327,11.1],[-347.4,21.8],[-368.1,31.8],[-388.9,41.6],[-410.3,49.9],[-432.9,53.8],[-455.9,52.6],[-478.1,46.8],[-499,37.3],[-519.5,26.8],[-539.9,16.2],[-560.4,5.7],[-580.9,-4.7],[-602,-13.7],[-623.9,-20.6],[-646.4,-25.5],[-669.2,-28.5],[-692.1,-30.4],[-715,-32.3],[-738,-34.2],[-759.9,-35.8],[-777.8,-34.3],[-794.5,-27.7],[-813.7,-19.1],[-831,-14.7],[-848.8,-16.8],[-868.5,-26.4],[-886,-41.3],[-902.5,-57.3],[-915.6,-76.1],[-924.9,-97.1],[-933.2,-115.3],[-944.1,-129.5],[-960.8,-142.1],[-980.5,-154.2],[-995.4,-164.1],[-1006.9,-177.9],[-1015.1,-198.2],[-1020.5,-215.4],[-1028.4,-229.2],[-1039,-238.2],[-1052.2,-242.8],[-1069.9,-245.8],[-1092.6,-249.5],[-1115.3,-253.1],[-1138,-256.8],[-1160.7,-260.5],[-1181.4,-263.9],[-1199.9,-271.4],[-1214.1,-283.8],[-1222.7,-300.6],[-1226.5,-322.3],[-1229.1,-345.1],[-1235.9,-367],[-1247.4,-383.3],[-1263.4,-395.1],[-1282.4,-408.1],[-1301.3,-421.2],[-1320.3,-434.2],[-1339.3,-447.2],[-1358.2,-460.2],[-1377.2,-473.2],[-1396.1,-486.3],[-1415.1,-499.3],[-1434,-512.3],[-1453,-525.3],[-1471.7,-538.7],[-1490.4,-552.1],[-1509.1,-565.6],[-1527.5,-579.4],[-1545.2,-594],[-1561.3,-610.4],[-1575.8,-628.2],[-1590.4,-646],[-1605,-663.8],[-1619.5,-681.6],[-1634.1,-699.4],[-1648.7,-717.2],[-1663.2,-735],[-1677.8,-752.8],[-1692.4,-770.6],[-1706.9,-788.4],[-1721.3,-806.4],[-1735.7,-824.3],[-1750,-842.3],[-1760.3,-862.8],[-1765.3,-885.2],[-1767.4,-908.1],[-1769.3,-931],[-1771.3,-953.9],[-1771.2,-976.9],[-1765.6,-999.1],[-1756.6,-1020.3],[-1747.4,-1041.4],[-1738.2,-1062.5],[-1729,-1083.6],[-1720.5,-1104.9],[-1713.4,-1126.8],[-1708.9,-1149.3],[-1705.4,-1172],[-1702.1,-1194.8],[-1698.8,-1217.6],[-1695.4,-1240.3],[-1692.1,-1263.1],[-1689.1,-1285.9],[-1688.5,-1308.9],[-1689.6,-1331.8],[-1691.1,-1354.8],[-1693.1,-1377.7],[-1695.2,-1400.6],[-1697.3,-1423.5],[-1699.5,-1446.4],[-1702.1,-1469.2],[-1705.4,-1492],[-1709.6,-1514.6],[-1714.7,-1537],[-1720.8,-1559.2],[-1727.7,-1581.1],[-1735.2,-1602.9],[-1743.5,-1624.3],[-1752.2,-1645.6],[-1761.4,-1666.7],[-1770.7,-1687.7],[-1780.5,-1708.6],[-1790.3,-1729.3],[-1800.2,-1750.1],[-1810.1,-1770.9],[-1819.4,-1791.9],[-1828,-1813.2],[-1836.4,-1834.6],[-1844.8,-1856],[-1853.2,-1877.5],[-1861.6,-1898.9],[-1869.9,-1920.3],[-1878.2,-1941.8],[-1887,-1963],[-1897,-1983.7],[-1908.6,-2003.6],[-1922.2,-2022.1],[-1936.9,-2039.8],[-1952.5,-2056.7],[-1969.7,-2071.9],[-1987.8,-2086.1],[-2007.3,-2098.3],[-2027.7,-2108.9],[-2048.5,-2118.8],[-2069.4,-2128.4],[-2090.3,-2137.9],[-2111.2,-2147.4],[-2132.2,-2156.9],[-2153,-2166.6],[-2168.8,-2178.8],[-2178.8,-2194.8],[-2182.7,-2215.3],[-2180.1,-2237.1],[-2169.9,-2256.4],[-2153.2,-2270.6],[-2132.8,-2281.2],[-2111.5,-2289.8],[-2090.1,-2298.3],[-2068.7,-2306.8],[-2047.4,-2315.3],[-2026,-2323.8],[-2004.8,-2332.7],[-1983.6,-2341.7],[-1962.7,-2351.2],[-1942,-2361.2],[-1921.7,-2372],[-1903.2,-2385.7],[-1886.2,-2401.1],[-1869.1,-2416.6],[-1851.9,-2431.9],[-1833.3,-2445.3],[-1813.9,-2457.6],[-1794.7,-2470.4],[-1776.7,-2484.7],[-1760.5,-2501],[-1744.5,-2517.5],[-1728.5,-2534],[-1712.5,-2550.6],[-1696.5,-2567.1],[-1680.5,-2583.6],[-1664.3,-2599.9],[-1646.9,-2614.9],[-1629,-2629.3],[-1611.1,-2643.8],[-1593.6,-2658.7],[-1576.9,-2674.5],[-1561.4,-2691.5],[-1546.4,-2708.9],[-1531.9,-2726.8],[-1519.3,-2746],[-1508,-2766.1],[-1498.4,-2787],[-1488.8,-2807.8],[-1479.2,-2828.7],[-1469.6,-2849.6],[-1460.5,-2870.7],[-1452.1,-2892.2],[-1446.2,-2914.3],[-1445.7,-2937.3],[-1446.1,-2960.3],[-1446.6,-2983.3],[-1447,-3006.3],[-1445.5,-3029.2],[-1436.8,-3050.4],[-1423,-3068.7],[-1405,-3082.9],[-1386.7,-3095.2],[-1370.7,-3110.1],[-1360.6,-3129.6],[-1357.2,-3143.1],[-1357.5,-3155],[-1362.2,-3166],[-1370.4,-3176],[-1381.2,-3187.8],[-1387.2,-3201.5],[-1387.5,-3216.4],[-1381.9,-3230.2],[-1370.7,-3244.2],[-1354.7,-3260.7],[-1337.8,-3276.3],[-1320,-3290.9],[-1301.6,-3304.7],[-1283.1,-3318.4],[-1264.6,-3332],[-1246,-3345.6],[-1227.9,-3359.7],[-1211.3,-3375.7],[-1196.5,-3393.3],[-1181.6,-3410.8],[-1166.7,-3428.3],[-1151.7,-3445.8],[-1135.6,-3462.2],[-1118.8,-3477.9],[-1102.1,-3493.6],[-1085.3,-3509.4],[-1068.5,-3525.1],[-1051.7,-3540.8],[-1034.9,-3556.6],[-1018.3,-3572.4],[-1003.1,-3589.7],[-989.6,-3608.3],[-976.5,-3627.2],[-963.4,-3646.1],[-950.4,-3665.1],[-939,-3685],[-930.8,-3706.5],[-926.5,-3729],[-925.7,-3752],[-930,-3774.5],[-935.7,-3796.8],[-941.4,-3819.1],[-947,-3841.4],[-952.7,-3863.7],[-957.9,-3884.1],[-963.2,-3899.1],[-973.4,-3911.4],[-988.9,-3920.3],[-1008.4,-3924.2],[-1031.4,-3924.2],[-1054.4,-3923.8],[-1076.8,-3928.4],[-1097.3,-3938.9],[-1117.2,-3950.5],[-1137,-3962.2],[-1156.1,-3974.9],[-1174.3,-3989],[-1192.4,-4003.1],[-1205.2,-4014.4],[-1213.5,-4027.9],[-1215.7,-4043.6],[-1211.4,-4062],[-1201.5,-4078.1],[-1187.3,-4089],[-1168.3,-4098.1],[-1147.6,-4108.1],[-1126.9,-4118.1],[-1106.5,-4128.8],[-1086.8,-4140.6],[-1067.4,-4153],[-1049.6,-4167.5],[-1032,-4182.3],[-1015.5,-4198.3],[-1002.3,-4217.1],[-994,-4237.4],[-991.8,-4259.2],[-988.9,-4282],[-979.8,-4303.1],[-968.1,-4322.9],[-956.1,-4342.5],[-944.1,-4362.1],[-931.2,-4381.1],[-915.8,-4398.2],[-897.4,-4411.9],[-876.6,-4421.7],[-854.8,-4428.9],[-831.9,-4430.2],[-809.3,-4426.2],[-786.7,-4421.7],[-765.4,-4413.2],[-745.7,-4401.3],[-726.3,-4389.1],[-707,-4376.4],[-688.2,-4363.3],[-669.4,-4350],[-650.6,-4336.8],[-631.7,-4323.6],[-612.9,-4310.4],[-597.3,-4293.7],[-587.1,-4273.1],[-580.2,-4256.5],[-574.3,-4246],[-565.4,-4238.2],[-555,-4234.6],[-546.1,-4234.6],[-537.7,-4237.7],[-531.4,-4244],[-526.5,-4251.6],[-517.3,-4267.1],[-501.7,-4283.8],[-481.4,-4294.4],[-459,-4299.3],[-436.2,-4302.4],[-413.3,-4304.7],[-390.4,-4306.4],[-367.4,-4307.7],[-344.4,-4308.8],[-321.5,-4310],[-298.5,-4311],[-275.5,-4312],[-252.5,-4312.6],[-229.6,-4311.2],[-207,-4306.7],[-184.7,-4301.2],[-162.4,-4295.7],[-140,-4290.3],[-118.6,-4285.1],[-100.9,-4282.7],[-84.3,-4286.1],[-68.8,-4295.2],[-57.6,-4309.1],[-47.8,-4327.7],[-37.4,-4348.2],[-28.7,-4369.5],[-24.6,-4392],[-24.5,-4415],[-26.4,-4437.9],[-27.5,-4451.9],[-26.7,-4463.8],[-21.4,-4474.5],[-12.3,-4483.7],[5.4,-4494.9],[26,-4505.2],[47,-4514.6],[68.2,-4523.5],[89.6,-4531.9],[111.3,-4539.5],[133,-4547],[154.9,-4554.3],[176.8,-4561.2],[198.9,-4567.7],[221,-4573.9],[243.3,-4579.6],[265.7,-4584.6],[288.3,-4589.1],[310.8,-4593.7],[333.3,-4598.5],[355.8,-4603.4],[378.3,-4608.2],[400.8,-4613],[423.3,-4617.9],[445.7,-4622.7],[468,-4628.6],[489,-4637.8],[508.5,-4649.9],[527.1,-4663.5],[545.6,-4677.2],[564.1,-4690.8],[582.6,-4704.5],[601.1,-4718.2],[619.5,-4731.9],[638.2,-4745.4],[655.9,-4756.7],[675.9,-4762.7],[697.8,-4764.3],[718.1,-4759.3],[735.7,-4748.1],[747.6,-4731],[754.6,-4710.2],[759.6,-4687.7],[762,-4664.9],[761,-4641.9],[758.4,-4619.1],[755.1,-4596.3],[751.2,-4573.6],[748.2,-4550.8],[746.2,-4527.9],[745.8,-4504.9],[747.6,-4482],[750.2,-4459.2],[751,-4436.2],[751.6,-4413.2],[753.1,-4390.3],[756.5,-4367.5],[761.6,-4345.1],[767.9,-4323],[775.6,-4301.3],[784.7,-4280.2],[795.4,-4259.9],[808.7,-4241.1],[823.6,-4223.5],[839.4,-4206.8],[855.4,-4190.4],[872.8,-4175.4],[891.7,-4162.3],[910.8,-4149.3],[930.4,-4137.3],[950.9,-4126.9],[972,-4117.9],[993.2,-4109.1],[1014.5,-4100.3],[1035.8,-4091.6],[1057.1,-4082.9],[1078.4,-4074.1],[1099.7,-4065.5],[1121.3,-4057.6],[1143.3,-4051.2],[1166.2,-4049.5],[1189.2,-4050.6],[1212.2,-4051.4],[1235.2,-4052.3],[1258.2,-4053.1],[1281.1,-4053.9],[1304.1,-4054.6],[1327.1,-4054],[1350.1,-4052.5],[1372.9,-4049.8],[1395.8,-4047.5],[1418.7,-4045.2],[1441.5,-4042.8],[1464.4,-4039.9],[1487.2,-4037],[1510,-4034.1],[1532.8,-4031.3],[1555.7,-4028.5],[1578.3,-4024.3],[1600.6,-4019],[1622.9,-4013.1],[1645.1,-4007],[1667.1,-4000.4],[1689.1,-3993.8],[1711.1,-3987.2],[1732.9,-3979.9],[1754.2,-3971.1],[1774.4,-3960.2],[1794,-3948.2],[1812.6,-3934.6],[1830.2,-3919.8],[1847.7,-3904.9],[1865.9,-3890.8],[1884.8,-3877.8],[1904.8,-3866.5],[1925.3,-3855.9],[1946.2,-3846.3],[1967.1,-3836.7],[1988,-3827.1],[2009,-3817.8],[2030.5,-3809.8],[2053.2,-3806.4],[2076.2,-3807.8],[2098.8,-3811.6],[2121,-3817.6],[2142.2,-3826.6],[2162.5,-3837.3],[2182.7,-3848.3],[2203,-3859.2],[2223.1,-3870.3],[2242.5,-3882.8],[2261,-3896.3],[2279.4,-3910.2],[2297.6,-3924.2],[2315.9,-3938.2],[2333.9,-3952.4],[2351.2,-3967.6],[2368.1,-3983.3],[2385.4,-3998.4],[2404.1,-4011.7],[2424.9,-4021.4],[2447.1,-4027.2],[2469.8,-4031.2],[2492.5,-4034.8],[2515.2,-4038.4],[2537.9,-4042.1],[2560.6,-4045.7],[2583.4,-4048.9],[2606.3,-4051.7],[2628.9,-4055.8],[2651,-4062],[2673.2,-4067.9],[2690.8,-4071.6],[2704.8,-4071.6],[2717.7,-4066.4],[2728.9,-4056.5],[2736.4,-4043.6],[2738.6,-4028.9],[2736.1,-4009.1],[2727.7,-3987.8],[2712.6,-3970.5],[2694.8,-3956],[2676.9,-3941.5],[2658.9,-3927.2],[2640,-3914],[2621.9,-3900],[2605.2,-3884.1],[2588,-3868.9],[2569.3,-3855.5],[2550.6,-3842.2],[2532.1,-3828.5],[2512.9,-3815.9],[2494.3,-3806],[2482.5,-3798.5],[2474.3,-3788.6],[2470.8,-3776.1],[2471.9,-3763.3],[2477.8,-3751.8],[2486.8,-3743.9],[2498.1,-3740.2],[2511,-3740.5],[2522.8,-3745.9],[2532,-3756.3],[2538.5,-3769.8],[2548,-3790.7],[2560.9,-3809.6],[2578,-3825],[2596,-3839.4],[2614.1,-3853.5],[2634.3,-3864.4],[2656.2,-3871.6],[2678,-3878.7],[2699.9,-3885.8],[2721.8,-3892.8],[2743.7,-3899.9],[2765.6,-3907],[2787.6,-3913.8],[2809.9,-3919.4],[2832.6,-3922.6],[2855.5,-3925.3],[2878.3,-3928.2],[2900.7,-3933.2],[2921.4,-3943],[2939.6,-3957.1],[2957.5,-3971.6],[2975.4,-3986],[2993.2,-4000.5],[3009.8,-4016.5],[3024.5,-4034.1],[3037.6,-4053],[3050.2,-4072.2],[3061.6,-4092.2],[3067.5,-4114.3],[3066.3,-4137.2],[3062,-4159.8],[3058.5,-4180.5],[3060.1,-4199.3],[3068.3,-4217.5],[3080.3,-4237.1],[3093.1,-4256.3],[3105.9,-4275.4],[3118.8,-4294.4],[3134.3,-4311.3],[3154.8,-4321.4],[3176.5,-4324.5],[3197.8,-4319.7],[3218.5,-4309.7],[3238.9,-4299],[3259.7,-4289.3],[3281.7,-4282.6],[3304.1,-4277.5],[3326.6,-4272.7],[3348.9,-4266.9],[3370.9,-4260.1],[3392.8,-4253.3],[3414.8,-4246.4],[3435.8,-4237.2],[3454.2,-4223.4],[3470.1,-4206.8],[3483.1,-4187.9],[3495.8,-4168.8],[3511.3,-4151.8],[3530,-4138.5],[3550.8,-4128.8],[3572.8,-4122.1],[3595.7,-4120.4],[3617.6,-4118.2],[3634.8,-4113.2],[3650.3,-4102.2],[3665.9,-4085.4],[3681.1,-4068.1],[3696.2,-4050.8],[3711.4,-4033.5],[3726.6,-4016.3],[3741.6,-3998.8],[3753.2,-3979],[3759.5,-3957],[3759,-3934],[3752.7,-3912],[3742.4,-3891.5],[3733.3,-3870.4],[3725.3,-3848.8],[3717.2,-3827.2],[3709.2,-3805.7],[3702.2,-3783.8],[3697.7,-3761.3],[3700,-3741.5],[3708.6,-3724.7],[3722,-3707.2],[3737.8,-3690.6],[3757.2,-3678.4],[3778.7,-3670.4],[3801.2,-3665.3],[3823.7,-3660.5],[3844.1,-3655.6],[3860.1,-3647.7],[3870.1,-3637.9],[3876.1,-3625.3],[3880,-3606.8],[3882.5,-3583.9],[3884.9,-3561],[3887.3,-3538.2],[3889.7,-3515.3],[3892.1,-3492.4],[3893.6,-3470.5],[3889.6,-3451],[3877.7,-3432.6],[3862.9,-3420.8],[3846.1,-3414.5],[3824.3,-3412.5],[3801.3,-3413.9],[3778.4,-3415.8],[3755.5,-3417.8],[3732.6,-3419.7],[3709.7,-3421.7],[3686.8,-3423.7],[3663.8,-3425.6],[3640.9,-3426],[3624.2,-3422.9],[3611,-3416],[3600.9,-3404.9],[3592.2,-3386],[3586.7,-3364.7],[3578.5,-3343.3],[3565.4,-3324.4],[3551.3,-3306.2],[3537.2,-3288.1],[3523.1,-3269.9],[3509.1,-3251.6],[3496.9,-3232.2],[3487.7,-3211.1],[3479.1,-3189.8],[3471.1,-3168.2],[3464.6,-3146.2],[3463.6,-3123.2],[3465.8,-3100.4],[3468.6,-3077.5],[3471.1,-3054.7],[3472,-3031.7],[3470.8,-3008.7],[3469.6,-2985.8],[3470.2,-2962.8],[3471.3,-2939.8],[3472.4,-2916.8],[3473.3,-2893.8],[3470.8,-2874.1],[3461.2,-2855.5],[3446.7,-2837.6],[3431.8,-2820.1],[3414.4,-2805.2],[3394,-2794.6],[3372,-2788],[3349.6,-2782.9],[3327.3,-2777.4],[3305.3,-2770.8],[3284.7,-2760.5],[3266.8,-2746.1],[3250.6,-2729.8],[3234.6,-2713.2],[3218.7,-2696.7],[3202.8,-2680],[3187,-2663.3],[3171.9,-2646],[3158.6,-2627.3],[3148.1,-2606.8],[3138.4,-2586],[3128.6,-2565.1],[3118.9,-2544.3],[3109.1,-2523.5],[3098.4,-2503.1],[3086.2,-2483.7],[3071.4,-2466],[3055.1,-2449.8],[3037.4,-2435.2],[3017.8,-2423.3],[2996.8,-2413.8],[2976.6,-2402.9],[2958.4,-2388.9],[2940.7,-2374.2],[2922.4,-2360.2],[2902.5,-2348.7],[2881.5,-2339.4],[2859.6,-2332.5],[2837,-2328.1],[2814.3,-2324.3],[2791.8,-2319.4],[2769.6,-2313.5],[2747.8,-2306.2],[2726.3,-2298.1],[2704.8,-2290],[2683.3,-2281.8],[2661.7,-2273.7],[2640.2,-2265.6],[2618.4,-2258.2],[2596.2,-2252.5],[2573.6,-2247.9],[2550.8,-2245.1],[2527.9,-2243.8],[2505,-2245],[2483,-2251.6],[2462.9,-2262.7],[2445,-2277.1],[2427.9,-2292.5],[2410.4,-2307.4],[2392.1,-2321.3],[2371.8,-2332],[2350.2,-2335.8],[2328.5,-2333],[2308.4,-2324.2],[2288.6,-2312.4],[2269.4,-2299.8],[2250.3,-2287],[2231.2,-2274.1],[2212.3,-2261.1],[2193.3,-2248],[2175.8,-2233.3],[2165,-2217.7],[2160.4,-2202.5],[2162.3,-2186.7],[2170.3,-2173],[2182.8,-2158.7],[2198.1,-2141.5],[2214.5,-2125.4],[2233,-2111.8],[2253.3,-2101.1],[2274.1,-2091.3],[2295.4,-2082.5],[2317,-2074.7],[2338.7,-2066.9],[2360.5,-2059.6],[2382.4,-2052.8],[2404.4,-2045.9],[2426.3,-2039],[2446.1,-2032.1],[2461.5,-2021.1],[2474.8,-2003.6],[2487.5,-1984.4],[2499.7,-1965],[2508,-1943.5],[2514.5,-1921.5],[2521,-1899.4],[2526,-1877],[2527.6,-1854.1],[2526,-1831.1],[2521,-1808.7],[2512.8,-1787.3],[2501.3,-1767.4],[2486.3,-1749.9],[2469.2,-1734.6],[2450.1,-1721.8],[2429.9,-1710.8],[2409.7,-1699.9],[2389.4,-1689],[2369.1,-1678.2],[2348.8,-1667.3],[2328.6,-1656.4],[2308.4,-1645.3],[2288.6,-1633.6],[2268.9,-1621.8],[2249.2,-1609.9],[2229.5,-1598.1],[2209.8,-1586.2],[2190.1,-1574.4],[2170.4,-1562.5],[2150.7,-1550.6],[2131,-1538.8],[2111.3,-1526.9],[2091.5,-1515.1],[2071.8,-1503.2],[2052.1,-1491.4],[2032.4,-1479.5],[2012.7,-1467.6],[1993,-1455.8],[1973.3,-1443.9],[1953.6,-1432.1],[1933.9,-1420.2],[1914.2,-1408.3],[1894.5,-1396.5],[1874.8,-1384.6],[1855.1,-1372.8],[1835.4,-1360.9],[1815.6,-1349],[1795.9,-1337.2],[1776.2,-1325.3],[1756.5,-1313.5],[1736.8,-1301.6],[1717.1,-1289.8],[1697.4,-1277.9],[1677.7,-1266],[1658,-1254.2],[1638.3,-1242.3],[1618.6,-1230.4],[1598.9,-1218.5],[1579.3,-1206.6],[1559.6,-1194.6],[1539.9,-1182.7],[1520.3,-1170.8],[1500.6,-1158.9],[1480.9,-1147],[1461.2,-1135.1],[1441.6,-1123.2],[1421.9,-1111.2],[1402.4,-1099],[1382.9,-1086.8],[1363.4,-1074.6],[1343.9,-1062.4],[1324.4,-1050.2],[1304.9,-1038],[1285.4,-1025.8],[1265.9,-1013.6],[1246.4,-1001.4],[1226.9,-989.2],[1207.4,-977.1],[1187.8,-965],[1168.3,-952.9],[1148.7,-940.7],[1129.2,-928.6],[1109.6,-916.5],[1090.1,-904.4],[1070.6,-892.2],[1051,-880.1],[1031.5,-868],[1011.9,-855.9],[992.4,-843.7],[972.9,-831.6],[953.4,-819.4],[933.9,-807.1],[914.4,-794.9],[894.9,-782.7],[875.4,-770.5],[855.9,-758.3],[836.4,-746.1],[816.9,-733.9],[797.4,-721.7],[777.9,-709.5],[758.4,-697.3],[738.9,-685.1],[719.5,-672.8],[700.1,-660.4],[680.6,-648.2],[661.1,-636],[642.1,-623.1],[623.5,-609.6],[605.9,-594.8],[589.3,-578.9],[574.2,-561.5],[559.7,-543.7],[545.1,-525.9],[530.5,-508.1],[516,-490.3],[501.5,-472.5],[486.9,-454.6],[472.4,-436.8],[458,-418.9],[443.6,-400.9],[428.9,-383.2],[414.1,-365.6],[399.2,-348.1],[384.4,-330.5],[370.8,-312],[359.3,-292.1],[348.2,-271.9],[338.2,-251.2],[328.4,-230.4],[316.5,-210.8],[301.5,-193.4],[285,-177.4],[268.3,-161.6]],
  };
  const TRACKS = [TRACK_DEF, RIVIERA_DEF, MOUNTAIN_DEF, LJUBLJANA_DEF, MONACO_DEF, FOREST_DEF, PIKES_DEF, NRING_DEF];

  // centripetal Catmull-Rom through the control points. Closed loop by default; open = a road with two ends
  // (phantom end points mirror the first / last segment, and the last point itself is appended).
  function catmullRom(pts, n, open) {
    const out = [], N = pts.length;
    const P = open ? (i) => (i < 0 ? [2 * pts[0][0] - pts[1][0], 2 * pts[0][1] - pts[1][1]] : i >= N ? [2 * pts[N - 1][0] - pts[N - 2][0], 2 * pts[N - 1][1] - pts[N - 2][1]] : pts[i]) : null;
    for (let i = 0; i < (open ? N - 1 : N); i++) {
      const p0 = open ? P(i - 1) : pts[(i - 1 + N) % N], p1 = pts[i], p2 = open ? P(i + 1) : pts[(i + 1) % N], p3 = open ? P(i + 2) : pts[(i + 2) % N];
      const tj = (ti, a, b) => ti + Math.pow(Math.hypot(b[0] - a[0], b[1] - a[1]), 0.5);
      const t0 = 0, t1 = tj(t0, p0, p1), t2 = tj(t1, p1, p2), t3 = tj(t2, p2, p3);
      const L = (a, b, ta, tb, t) => [((tb - t) * a[0] + (t - ta) * b[0]) / (tb - ta), ((tb - t) * a[1] + (t - ta) * b[1]) / (tb - ta)];
      for (let k = 0; k < n; k++) {
        const t = t1 + (t2 - t1) * k / n;
        const A1 = L(p0, p1, t0, t1, t), A2 = L(p1, p2, t1, t2, t), A3 = L(p2, p3, t2, t3, t);
        const B1 = L(A1, A2, t0, t2, t), B2 = L(A2, A3, t1, t3, t);
        out.push(L(B1, B2, t1, t2, t));
      }
    }
    if (open) out.push([pts[N - 1][0], pts[N - 1][1]]);
    return out;
  }

  class Track {
    constructor(def) {
      this.def = def;
      this.w = def.halfWidth;
      // def.open: a point-to-point road (hill climb). Sample 0 = points[0] (bottom end), sample N-1 = the last point (top end);
      // nothing wraps: every neighbour lookup is clamped to [0, N-1] instead of taken modulo N.
      const open = this.open = !!def.open;
      const dense = catmullRom(def.points, 32, open);
      // arc length resample
      const M = dense.length, cum = [0], MS = open ? M - 1 : M;
      for (let i = 0; i < MS; i++) { const a = dense[i], b = dense[(i + 1) % M]; cum.push(cum[i] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
      const len = cum[MS];
      const N = open ? Math.round(len / 2.0) + 1 : Math.round(len / 2.0);   // open: the last sample lands on the end of the road
      const ds = open ? len / (N - 1) : len / N;
      this.N = N; this.ds = ds; this.len = len;
      const px = this.px = new Float32Array(N), pz = this.pz = new Float32Array(N);
      let j = 0;
      for (let k = 0; k < N; k++) {
        const s = k * ds;
        if (open) while (j < MS - 1 && cum[j + 1] < s) j++;
        else while (cum[j + 1] < s) j++;
        const a = dense[j], b = dense[(j + 1) % M];
        let t = (s - cum[j]) / Math.max(1e-9, cum[j + 1] - cum[j]); if (open) t = clamp(t, 0, 1);
        px[k] = a[0] + (b[0] - a[0]) * t; pz[k] = a[1] + (b[1] - a[1]) * t;
      }
      const tx = this.tx = new Float32Array(N), tz = this.tz = new Float32Array(N);
      const nx = this.nx = new Float32Array(N), nz = this.nz = new Float32Array(N);
      const hd = this.hd = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        const a = open ? Math.max(0, i - 1) : (i - 1 + N) % N, b = open ? Math.min(N - 1, i + 1) : (i + 1) % N;
        let dx = px[b] - px[a], dz = pz[b] - pz[a]; const l = Math.hypot(dx, dz); dx /= l; dz /= l;
        tx[i] = dx; tz[i] = dz; nx[i] = -dz; nz[i] = dx; hd[i] = Math.atan2(dz, dx);
      }
      // signed curvature (positive = right turn) smoothed
      const kr = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        if (open) { const a = Math.max(0, i - 3), b = Math.min(N - 1, i + 3); kr[i] = wrapPi(hd[b] - hd[a]) / ((b - a) * ds); continue; }
        const a = (i - 3 + N) % N, b = (i + 3) % N;
        kr[i] = wrapPi(hd[b] - hd[a]) / (6 * ds);
      }
      const k = this.k = new Float32Array(N);
      for (let i = 0; i < N; i++) { let s = 0; for (let o = -3; o <= 3; o++) s += kr[open ? clamp(i + o, 0, N - 1) : (i + o + N) % N]; k[i] = s / 7; }

      this._buildElevation(def);
      this._buildEdges();
      this._buildRacingLine();
      this._buildCorners();
      // start line index: nearest sample to startX on main straight (first straight near z of point 0)
      let best = 0, bd = 1e9;
      for (let i = 0; i < N; i++) {
        const d = def.start ? Math.hypot(px[i] - def.start[0], pz[i] - def.start[1]) : Math.abs(px[i] - def.startX) + Math.abs(pz[i] - def.points[0][1]) * 3;
        if (d < bd) { bd = d; best = i; }
      }
      this.startIdx = best; this.startS = best * ds;
      // finish line, checkpoints and heights (open roads). Closed circuits: finish = start, no checkpoints.
      if (open) {
        this.finishIdx = def.finish ? this.nearestIdx(def.finish[0], def.finish[1]) : N - 1;
        this.finishS = this.finishIdx * ds;
        this.raceLen = this.finishS - this.startS;
        this.cpS = (def.cps || []).map(p => this.nearestIdx(p[0], p[1]) * ds).filter(s => s > this.startS && s < this.finishS).sort((a, b) => a - b);
        this.hStart = this.hy[this.startIdx]; this.hFinish = this.hy[this.finishIdx];
      } else {
        this.finishIdx = this.startIdx; this.finishS = this.startS; this.raceLen = len; this.cpS = []; this.hStart = 0; this.hFinish = 0;
      }
      this.cpDist = this.cpS.map(s => s - this.startS);   // metres from the start line
      // named places (def.names = [[name, x, z, lines?], ...] snapped to the centre line, or { n, d, say? } with d = metres after the
      // start line, for scaled roads): { n, d, say } in lap order (HUD label, commentator lines or null). Open roads keep only the run.
      this.names = (def.names || []).map((e) => {
        const arr = Array.isArray(e), n = arr ? e[0] : e.n, say = arr ? e[3] : e.say;
        let d = !arr && e.d != null ? +e.d : this.nearestIdx(arr ? e[1] : e.x, arr ? e[2] : e.z) * ds - this.startS;
        if (!open) d = ((d % len) + len) % len;
        return { n, d, say: Array.isArray(say) && say.length ? say : null };
      }).filter(q => !open || (q.d >= 0 && q.d <= this.raceLen)).sort((a, b) => a.d - b.d);
      // banked corners (def.bank = [[from, to, slope], ...], metres after the start line; closed circuits): the road surface tilts across
      // its width towards the inside of the bend (slope = height lost per metre towards the inside), eased in and out over ~20 m
      this.bank = null;
      if (def.bank && !open) {
        const bk = this.bank = new Float32Array(N), bs = this.bankSide = new Int8Array(N);
        for (const [a, b, sl] of def.bank) {
          let km = 0; for (let d = a; d <= b; d += ds) km += this.k[this.idx(this.startS + d)];
          const side = km > 0 ? 1 : -1;   // the inside of the bend
          for (let d = a - 22; d <= b + 22; d += ds / 2) { const i = this.idx(this.startS + d), f = Math.min(sstep(a - 22, a + 6, d), sstep(b + 22, b - 6, d)); if (sl * f > bk[i]) { bk[i] = sl * f; bs[i] = side; } }
        }
      }
    }

    // banked corners: the road surface's height offset at lateral offset d (m, + right) and its lateral slope there (dy/dd, 0 off the road)
    bankAt(s, d, out) {
      out.dy = 0; out.sl = 0; if (!this.bank) return out;
      const N = this.N, f = s / this.ds, fi = Math.floor(f), i0 = ((fi % N) + N) % N, i1 = (i0 + 1) % N, t = f - fi;
      const b = this.bank[i0] * (1 - t) + this.bank[i1] * t; if (!(b > 0)) return out;
      const side = this.bankSide[i0] || this.bankSide[i1], u = d * side;   // metres towards the inside of the bend
      out.dy = -b * clamp(u, -this.w, this.w + 6); out.sl = u > -this.w && u < this.w + 6 ? -b * side : 0;   // (the bowl runs on 6 m past the inner edge; the outer verge stays at the edge's height)
      return out;
    }

    // index of the centreline sample nearest to (x, z) (full scan)
    nearestIdx(x, z) {
      let best = 0, bd = 1e18;
      for (let i = 0; i < this.N; i++) { const dx = this.px[i] - x, dz = this.pz[i] - z, d = dx * dx + dz * dz; if (d < bd) { bd = d; best = i; } }
      return best;
    }

    // real altitude (metres above sea level) for a road height y, if the track defines def.alt = [alt at start, alt at finish]; else null
    altAt(y) {
      const A = this.def.alt; if (!A) return null;
      const dh = this.hFinish - this.hStart;
      return A[0] + (dh ? (y - this.hStart) / dh : 0) * (A[1] - A[0]);
    }

    // Longitudinal height profile of the road (0 everywhere for flat tracks).
    // def.elev: [[frac,height], ...] smooth hills around the loop (periodic, start≈end).
    // def.bumps: [{at:frac, h:meters, w:halfWidth}] Gaussian bumps → the car flies off crests.
    _buildElevation(def) {
      const N = this.N, ds = this.ds, len = this.len;
      const hy = this.hy = new Float32Array(N);
      const grade = this.grade = new Float32Array(N);
      const curv = this.curv = new Float32Array(N);
      this.hasElev = !!(def.elev || def.bumps);
      if (!this.hasElev) return;
      if (this.open) return this._buildElevationOpen(def);
      // piecewise-linear base from keyframes (cyclic), then heavily smoothed into rolling hills
      const kf = (def.elev || [[0, 0], [1, 0]]).slice().map(p => [((p[0] % 1) + 1) % 1 * len, p[1]]);
      kf.sort((a, b) => a[0] - b[0]);
      const baseAt = (s) => {
        s = ((s % len) + len) % len;
        let a = kf[kf.length - 1], b = kf[0];
        for (let m = 0; m < kf.length; m++) { if (kf[m][0] <= s) { a = kf[m]; b = kf[(m + 1) % kf.length]; } }
        let s0 = a[0], s1 = b[0]; if (s1 <= s0) s1 += len; let sc = s; if (sc < s0) sc += len;
        const t = (sc - s0) / Math.max(1e-6, s1 - s0);
        return a[1] + (b[1] - a[1]) * t;
      };
      for (let i = 0; i < N; i++) hy[i] = baseAt(i * ds);
      // smooth the base hills (periodic box filter) into gentle rolling terrain; a long real profile (def.elevSmooth, metres) keeps its detail
      const smooth = (arr, r, it) => { let a = arr; for (let n = 0; n < it; n++) { const o = new Float32Array(N); for (let i = 0; i < N; i++) { let s = 0; for (let d = -r; d <= r; d++) s += a[(i + d + N) % N]; o[i] = s / (2 * r + 1); } a = o; } return a; };
      const sm = smooth(hy, Math.max(1, def.elevSmooth ? Math.round(def.elevSmooth / ds) : Math.round(N / 90)), 3);
      for (let i = 0; i < N; i++) hy[i] = sm[i];
      // add sharp Gaussian bumps (kickers/dips) AFTER smoothing so they keep their shape and launch the car
      for (const b of (def.bumps || [])) {
        const c = (((b.at % 1) + 1) % 1) * len, w = b.w || 8, h = b.h || 1;
        for (let i = 0; i < N; i++) { let d = i * ds - c; if (d > len / 2) d -= len; if (d < -len / 2) d += len; hy[i] += h * Math.exp(-(d * d) / (w * w)); }
      }
      // tiny final smooth to remove sampling steppiness without killing the bumps
      const sm2 = smooth(hy, 1, 1); for (let i = 0; i < N; i++) hy[i] = sm2[i];
      // grade (dh/ds) and profile curvature (d²h/ds²)
      for (let i = 0; i < N; i++) { const a = (i - 1 + N) % N, b = (i + 1) % N; grade[i] = (hy[b] - hy[a]) / (2 * ds); }
      for (let i = 0; i < N; i++) { const a = (i - 1 + N) % N, b = (i + 1) % N; curv[i] = (grade[b] - grade[a]) / (2 * ds); }
      let mx = 0; for (let i = 0; i < N; i++) mx = Math.max(mx, hy[i]); this.maxElev = mx;
    }

    // open road: def.elev = [[x, z, h], ...] (snapped to the nearest sample) or [[frac, h], ...]; linear in s between keyframes,
    // clamped before the first / after the last one, then smoothed with a FIXED radius in metres (def.elevSmooth, default 20 m),
    // edge-replicated (nothing wraps). grade / curv are one-sided at the two ends.
    _buildElevationOpen(def) {
      const N = this.N, ds = this.ds, len = this.len, hy = this.hy, grade = this.grade, curv = this.curv;
      const kf = (def.elev || [[0, 0]]).map(p => p.length >= 3 ? [this.nearestIdx(p[0], p[1]) * ds, p[2]] : [clamp(p[0], 0, 1) * len, p[1]]);
      kf.sort((a, b) => a[0] - b[0]);
      const K = kf.length;
      for (let i = 0, m = 0; i < N; i++) {
        const s = i * ds;
        while (m < K - 1 && kf[m + 1][0] <= s) m++;
        if (s <= kf[0][0]) hy[i] = kf[0][1];
        else if (m >= K - 1) hy[i] = kf[K - 1][1];
        else { const a = kf[m], b = kf[m + 1]; hy[i] = a[1] + (b[1] - a[1]) * clamp((s - a[0]) / Math.max(1e-6, b[0] - a[0]), 0, 1); }
      }
      const smooth = (arr, r, it) => { let a = arr; for (let n = 0; n < it; n++) { const o = new Float32Array(N); for (let i = 0; i < N; i++) { let s = 0; for (let d = -r; d <= r; d++) s += a[clamp(i + d, 0, N - 1)]; o[i] = s / (2 * r + 1); } a = o; } return a; };
      const sm = smooth(hy, Math.max(1, Math.round((def.elevSmooth || 20) / ds)), 3);
      for (let i = 0; i < N; i++) hy[i] = sm[i];
      for (const b of (def.bumps || [])) {
        const c = clamp(b.at, 0, 1) * len, w = b.w || 8, h = b.h || 1;
        for (let i = 0; i < N; i++) { const d = i * ds - c; hy[i] += h * Math.exp(-(d * d) / (w * w)); }
      }
      const sm2 = smooth(hy, 1, 1); for (let i = 0; i < N; i++) hy[i] = sm2[i];
      for (let i = 0; i < N; i++) { const a = Math.max(0, i - 1), b = Math.min(N - 1, i + 1); grade[i] = (hy[b] - hy[a]) / ((b - a) * ds); }
      for (let i = 0; i < N; i++) { const a = Math.max(0, i - 1), b = Math.min(N - 1, i + 1); curv[i] = (grade[b] - grade[a]) / ((b - a) * ds); }
      let mx = -1e9; for (let i = 0; i < N; i++) mx = Math.max(mx, hy[i]); this.maxElev = mx;
    }

    elevAt(s) {
      if (!this.hasElev) return { y: 0, grade: 0, curv: 0 };
      if (this.open) {
        const N = this.N, fi = clamp(s / this.ds, 0, N - 1), i0 = Math.min(N - 2, Math.floor(fi)), f = fi - i0, i1 = i0 + 1;
        return { y: this.hy[i0] * (1 - f) + this.hy[i1] * f, grade: this.grade[i0] * (1 - f) + this.grade[i1] * f, curv: this.curv[i0] * (1 - f) + this.curv[i1] * f };
      }
      const N = this.N, ds = this.ds; let fi = s / ds; const i0 = ((Math.floor(fi) % N) + N) % N, f = fi - Math.floor(fi), i1 = (i0 + 1) % N;
      return { y: this.hy[i0] * (1 - f) + this.hy[i1] * f, grade: this.grade[i0] * (1 - f) + this.grade[i1] * f, curv: this.curv[i0] * (1 - f) + this.curv[i1] * f };
    }

    _buildEdges() {
      const N = this.N, w = this.w, k = this.k, ds = this.ds;
      const bl = new Float32Array(N), br = new Float32Array(N);
      // outside runoff grows with curvature
      for (let i = 0; i < N; i++) {
        const ak = Math.abs(k[i]);
        const RO = this.def.runoff || 1;   // street circuits: walls close to the road
        const out = ak > 1 / 160 ? clamp((9 + 1100 * ak) * RO, 9 * RO, 21 * RO) : (this.def.side || 6.5);
        const inn = this.def.inner || 5.5;
        if (k[i] > 0) { bl[i] = w + out; br[i] = w + inn; } else { br[i] = w + out; bl[i] = w + inn; }
      }
      const open = this.open, W = open ? (i) => (i < 0 ? 0 : i >= N ? N - 1 : i) : (i) => (i + N) % N;   // neighbour index: clamped (open road) or wrapped
      const dilate = (arr, r) => { const o = new Float32Array(N); for (let i = 0; i < N; i++) { let m = 0; for (let d = -r; d <= r; d++) m = Math.max(m, arr[W(i + d)]); o[i] = m; } return o; };
      const smooth = (arr, r, it) => { let a = arr; for (let n = 0; n < it; n++) { const o = new Float32Array(N); for (let i = 0; i < N; i++) { let s = 0; for (let d = -r; d <= r; d++) s += a[W(i + d)]; o[i] = s / (2 * r + 1); } a = o; } return a; };
      let BL = smooth(dilate(bl, 14), 6, 3), BR = smooth(dilate(br, 14), 6, 3);
      // limit: inside of a curve cannot exceed 0.8 * radius, and not closer than w+4
      const limitInside = () => {
        for (let i = 0; i < N; i++) {
          const ak = Math.abs(k[i]);
          if (ak > 1e-4) {
            const lim = Math.max(w + 4, 0.82 / ak);
            if (k[i] > 0) BR[i] = Math.min(BR[i], lim); else BL[i] = Math.min(BL[i], lim);
          }
        }
      };
      // limit by proximity to other parts of the track (every other sample j within 80 m, found through an 80 m spatial hash: O(N))
      const px = this.px, pz = this.pz, nx = this.nx, nz = this.nz;
      const CELL = 80, hash = new Map(), hkey = (cx, cz) => cx * 131072 + cz;
      for (let j = 0; j < N; j += 2) { const key = hkey(Math.floor(px[j] / CELL), Math.floor(pz[j] / CELL)); let L = hash.get(key); if (!L) hash.set(key, L = []); L.push(j); }
      const limitNear = () => {
        for (let i = 0; i < N; i++) {
          const cx = Math.floor(px[i] / CELL), cz = Math.floor(pz[i] / CELL);
          for (let gx = cx - 1; gx <= cx + 1; gx++) for (let gz = cz - 1; gz <= cz + 1; gz++) {
          const L = hash.get(hkey(gx, gz)); if (!L) continue;
          for (let n = 0; n < L.length; n++) {
            const j = L[n];
            let di = Math.abs(i - j); if (!open) di = Math.min(di, N - di);
            if (di * ds < 70) continue;
            const dx = px[j] - px[i], dz = pz[j] - pz[i];
            const d = Math.hypot(dx, dz);
            if (d > 80) continue;
            const side = dx * nx[i] + dz * nz[i];
            const lim = d * 0.5 - 1;
            if (side > 0) BR[i] = Math.min(BR[i], lim); else BL[i] = Math.min(BL[i], lim);
          }
          }
        }
      };
      limitInside(); limitNear();
      BL = smooth(BL, 3, 2); BR = smooth(BR, 3, 2);
      limitInside(); limitNear();
      const minB = Math.min(3.5, this.def.side || 3.5);
      for (let i = 0; i < N; i++) { BL[i] = Math.max(BL[i], w + minB); BR[i] = Math.max(BR[i], w + minB); }
      this.bl = BL; this.br = BR;
      // curbs where curvature is meaningful (both sides), dilated — but not on makadam (rally) roads
      const cb = new Uint8Array(N);
      if (this.def.roadSurface !== 'makadam' && !this.def.noCurbs) for (let i = 0; i < N; i++) if (Math.abs(k[i]) > 1 / 190) cb[i] = 1;
      const curb = new Uint8Array(N);
      for (let i = 0; i < N; i++) { let m = 0; for (let d = -5; d <= 5; d++) m |= cb[W(i + d)]; curb[i] = m; }
      if (this.def.roadSurface === 'makadam') curb.fill(0); // rally roads: no curbs
      if (this.def.roadSurface === 'makadam') curb.fill(0);   // dirt rally road: no kerbs
      this.curb = curb;
      this.curbW = 1.5;
      // gravel: side where barrier far away
      const gl = new Uint8Array(N), gr = new Uint8Array(N);
      for (let i = 0; i < N; i++) { gl[i] = BL[i] > w + 11 ? 1 : 0; gr[i] = BR[i] > w + 11 ? 1 : 0; }
      if (this.def.roadSurface === 'makadam' || this.def.noGravel) { gl.fill(0); gr.fill(0); } // rally stage: grass/forest verge, no gravel traps
      this.gravL = gl; this.gravR = gr;
    }

    _buildRacingLine() {
      const N = this.N, px = this.px, pz = this.pz, nx = this.nx, nz = this.nz;
      const off = new Float32Array(N);
      const lim = this.w - 1.7, open = this.open;
      const passes = [[14, 300], [7, 300], [3, 300]];
      for (const [K, iters] of passes) {
        for (let it = 0; it < iters; it++) {
          for (let i = 0; i < N; i++) {
            let a, b;
            if (open) { const K2 = Math.min(K, i, N - 1 - i); if (K2 < 1) continue; a = i - K2; b = i + K2; }   // symmetric window shrinking to the pinned ends
            else { a = (i - K + N) % N; b = (i + K) % N; }
            const ax = px[a] + nx[a] * off[a], az = pz[a] + nz[a] * off[a];
            const bx = px[b] + nx[b] * off[b], bz = pz[b] + nz[b] * off[b];
            const mx = (ax + bx) * 0.5, mz = (az + bz) * 0.5;
            const t = (mx - px[i]) * nx[i] + (mz - pz[i]) * nz[i];
            off[i] = clamp(off[i] + (t - off[i]) * 0.55, -lim, lim);
          }
        }
      }
      this.rl = off;
      // curvature of racing line
      const rx = new Float32Array(N), rz = new Float32Array(N);
      for (let i = 0; i < N; i++) { rx[i] = px[i] + nx[i] * off[i]; rz[i] = pz[i] + nz[i] * off[i]; }
      const rk = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        let a, b;
        if (open) { const K4 = Math.min(4, i, N - 1 - i); if (K4 < 1) { rk[i] = 0; continue; } a = i - K4; b = i + K4; }
        else { a = (i - 4 + N) % N; b = (i + 4) % N; }
        // circumcircle curvature
        const x1 = rx[a], z1 = rz[a], x2 = rx[i], z2 = rz[i], x3 = rx[b], z3 = rz[b];
        const A = Math.hypot(x2 - x1, z2 - z1), B = Math.hypot(x3 - x2, z3 - z2), C = Math.hypot(x3 - x1, z3 - z1);
        const cross = (x2 - x1) * (z3 - z1) - (z2 - z1) * (x3 - x1);
        rk[i] = 2 * cross / Math.max(1e-6, A * B * C);
      }
      this.rk = rk; this.rx = rx; this.rz = rz;
      // racing line segment lengths (for speed profile)
      const rds = new Float32Array(N);
      for (let i = 0; i < N; i++) { const b = (i + 1) % N; rds[i] = Math.hypot(rx[b] - rx[i], rz[b] - rz[i]); }
      if (open) rds[N - 1] = 0;
      this.rds = rds;
    }

    // speed profile for a given lateral accel limit (m/s^2) and braking decel
    speedProfile(latA, brakeA, vtop, wMax) {
      const N = this.N, rk = this.rk, rds = this.rds;
      const v = new Float32Array(N);
      for (let i = 0; i < N; i++) v[i] = Math.min(vtop, Math.sqrt(latA / Math.max(Math.abs(rk[i]), 1e-5)));
      if (this.bank) for (let i = 0; i < N; i++) { const b = this.bank[i]; if (b > 0) v[i] = Math.min(vtop, Math.sqrt((latA + G * b / Math.sqrt(1 + b * b)) / Math.max(Math.abs(rk[i]), 1e-5))); }   // a banked bend carries part of the cornering force
      if (wMax) for (let i = 0; i < N; i++) v[i] = Math.min(v[i], wMax / Math.max(Math.abs(rk[i]), 1e-5));   // cs: the car turns no faster than wMax (rad/s) along its path
      if (this.open) {   // open road: come to a stop at the far end of the road, nothing wraps
        v[N - 1] = 0;
        for (let i = N - 2; i >= 0; i--) v[i] = Math.min(v[i], Math.sqrt(v[i + 1] * v[i + 1] + 2 * brakeA * rds[i]));
        return v;
      }
      // closed circuit with gravity on the slopes (def.gradeForce): braking downhill takes longer, uphill shorter
      const gr = this.def.gradeForce && this.hasElev ? this.grade : null;
      for (let pass = 0; pass < 3; pass++) {
        if (gr) { for (let i = N - 1; i >= 0; i--) { const b = (i + 1) % N, a = Math.max(brakeA * 0.6, brakeA + G * gr[i]); v[i] = Math.min(v[i], Math.sqrt(v[b] * v[b] + 2 * a * rds[i])); } continue; }
        for (let i = N - 1; i >= 0; i--) { const b = (i + 1) % N; v[i] = Math.min(v[i], Math.sqrt(v[b] * v[b] + 2 * brakeA * rds[i])); }
      }
      return v;
    }

    _buildCorners() {
      // corner list for pace-note arrows: contiguous regions of centerline curvature
      const N = this.N, k = this.k, ds = this.ds;
      const corners = [];
      let i0 = -1;
      // find a start where curvature is low
      let start = 0; if (!this.open) for (let i = 0; i < N; i++) if (Math.abs(k[i]) < 1 / 400) { start = i; break; }
      let cur = null;
      for (let n = 0; n <= N; n++) {
        if (this.open && n === N) { if (cur && Math.abs(cur.sumk) > 0.35) corners.push(cur); break; }   // open road: a linear scan, no wrap
        const i = (start + n) % N;
        const on = Math.abs(k[i]) > 1 / 110;
        if (on && !cur) cur = { i0: i, i1: i, sumk: 0, maxk: 0, dir: 0 };
        if (on && cur) { cur.i1 = i; cur.sumk += k[i] * ds; if (Math.abs(k[i]) > cur.maxk) { cur.maxk = Math.abs(k[i]); cur.dir = Math.sign(k[i]); } }
        if ((!on || n === N) && cur) {
          if (Math.abs(cur.sumk) > 0.35) corners.push(cur);
          cur = null;
        }
      }
      for (const c of corners) {
        c.s0 = c.i0 * ds;
        c.minR = 1 / c.maxk;
        c.angle = Math.abs(c.sumk);
        c.sev = c.minR < 28 ? 3 : c.minR < 55 ? 2 : 1;
      }
      this.corners = corners;
    }

    idx(s) { const N = this.N; if (this.open) return clamp(Math.floor(s / this.ds), 0, N - 1); let i = Math.floor(s / this.ds) % N; if (i < 0) i += N; return i; }

    // pit lane (def.pit = [centre offset to the right, from, to, player's box] in metres from the start line): a lane beside the straight,
    // tapering in from the circuit edge at both ends. Returns null outside it. gap: the lane touches the circuit (no pit wall) - where you drive in and out.
    // inner: the player's limit on the pit-wall side: the rail, but where the teams' stands sit on the grass strip behind it (pitStands [d0, d1],
    // set by the world builder from its pit boxes) the lane's edge kerb, eased in and out over 25 m
    pitAt(s) {
      const P = this.def && this.def.pit; if (!P) return null;
      const L = this.len; let d = s - this.startS; d = ((d % L) + L) % L; if (d > L / 2) d -= L;
      if (d < P[1] || d > P[2]) return null;
      const f = (((s % L) + L) % L) / this.ds, i = Math.floor(f) % this.N, j = (i + 1) % this.N, br = lerp(this.br[i], this.br[j], f - Math.floor(f));
      const full = Math.max(P[0], br + 5), t = Math.min(sstep(P[1], P[1] + 60, d), sstep(P[2], P[2] - 30, d)), o = lerp(this.w + 3.6, full, t);   // a long, gentle way in
      const S = this.pitStands, e = S ? Math.min(sstep(S[0] - 26, S[0] - 1, d), sstep(S[1] + 26, S[1] + 1, d)) : 0, wall = br + 0.25, lin = o - 3.5;
      return { d, o, t, br, gap: o - 3.5 < br + 0.8, wall, lin, lout: o + 3.5, inner: wall + 0.12 + Math.max(0, lin - 0.3 - wall - 0.12) * e };
    }

    // nearest point search around hint index; returns object (reused)
    query(x, z, hint, out) {
      const N = this.N, px = this.px, pz = this.pz;
      out = out || {};
      let bi = -1, bd = 1e18;
      const open = this.open;
      if (hint >= 0) {
        for (let o = -10; o <= 10; o++) {
          const i = open ? hint + o : (hint + o + N) % N;
          if (open && (i < 0 || i >= N)) continue;
          const dx = x - px[i], dz = z - pz[i]; const d = dx * dx + dz * dz;
          if (d < bd) { bd = d; bi = i; }
        }
      }
      if (bi < 0 || bd > 60 * 60) {
        for (let i = 0; i < N; i++) { const dx = x - px[i], dz = z - pz[i]; const d = dx * dx + dz * dz; if (d < bd) { bd = d; bi = i; } }
      }
      // refine with neighbouring segment projection
      let i = bi;
      const tx = this.tx, tz = this.tz;
      let along = (x - px[i]) * tx[i] + (z - pz[i]) * tz[i];
      let j = i, t;
      if (along < 0) { j = open ? i - 1 : (i - 1 + N) % N; }
      if (open) j = clamp(j, 0, N - 2);   // open road: the end segments are 0-1 and N-2 - N-1 (no closing segment)
      const a = j, b = (j + 1) % N;
      const sx = px[b] - px[a], sz = pz[b] - pz[a], sl2 = sx * sx + sz * sz;
      const tu = ((x - px[a]) * sx + (z - pz[a]) * sz) / sl2;
      t = clamp(tu, 0, 1);
      // open road: how far the point lies beyond an end of the road along it (negative before sample 0, positive past sample N-1)
      if (open) out.over = a === 0 && tu < 0 ? tu * Math.sqrt(sl2) : b === N - 1 && tu > 1 ? (tu - 1) * Math.sqrt(sl2) : 0;
      const cx = px[a] + sx * t, cz = pz[a] + sz * t;
      const nxa = lerp(this.nx[a], this.nx[b], t), nza = lerp(this.nz[a], this.nz[b], t);
      out.i = bi; out.a = a; out.t = t; out.x = x; out.z = z;
      out.s = (a + t) * this.ds;
      out.d = (x - cx) * nxa + (z - cz) * nza;
      out.nx = nxa; out.nz = nza;
      out.tx = lerp(tx[a], tx[b], t); out.tz = lerp(tz[a], tz[b], t);
      out.bl = lerp(this.bl[a], this.bl[b], t); out.br = lerp(this.br[a], this.br[b], t);
      return out;
    }

    // surface at a query result: 0 asphalt, 1 curb, 2 grass, 3 gravel
    surface(q) {
      const d = q.d, ad = Math.abs(d), w = this.w;
      if (ad <= w) return this.def.roadSurface === 'makadam' ? 5 : 0;
      const i = q.a;
      if (this.curb[i] && ad <= w + this.curbW) return 1;
      const grav = d > 0 ? this.gravR[i] : this.gravL[i];
      return grav ? 3 : this.def.offSurface === 'paving' ? 4 : this.def.offSurface === 'gravel' ? 3 : 2;
    }
  }

  /* ---------------------------------------------------------------------
     CAR MODELS
     --------------------------------------------------------------------- */
  const MODELS = [
    { id: 'kaze', name: 'KAZE RS', drive: 'FR', desc: 'Zadnji pogon, rojen za drift',
      mass: 1240, a: 1.20, b: 1.30, hcg: 0.46, kI: 1.22, kw: 262, redline: 7800, idle: 950,
      gears: [3.20, 2.08, 1.50, 1.17, 0.95, 0.80], final: 4.1, rw: 0.31,
      gripF: 1.0, gripR: 1.075, cDrag: 0.42, down: 0.20, brake: 11.5, steerMax: 0.62,
      driftLoss: 0.3, len: 4.35, wid: 1.78, body: 'coupe', stats: { power: 7, grip: 6, weight: 6, drift: 9 } },
    { id: 'vortex', name: 'VORTEX 4WD', drive: 'AWD', desc: 'Štirikolesni pogon, stabilen in hiter',
      mass: 1400, a: 1.25, b: 1.35, hcg: 0.48, kI: 1.25, kw: 297, redline: 7300, idle: 900,
      gears: [3.35, 2.10, 1.52, 1.18, 0.96, 0.81], final: 4.0, rw: 0.32,
      gripF: 1.02, gripR: 1.10, cDrag: 0.44, down: 0.24, brake: 11.8, steerMax: 0.6,
      driftLoss: 0.34, len: 4.55, wid: 1.80, body: 'sedan', stats: { power: 8, grip: 9, weight: 4, drift: 5 } },
    { id: 'pico', name: 'PICO TURBO', drive: 'FF', desc: 'Lahek hatchback s prednjim pogonom',
      mass: 1040, a: 1.02, b: 1.40, hcg: 0.47, kI: 1.12, kw: 214, redline: 8200, idle: 1000,
      gears: [3.45, 2.20, 1.58, 1.22, 0.99, 0.84], final: 4.3, rw: 0.30,
      gripF: 1.04, gripR: 1.12, cDrag: 0.40, down: 0.16, brake: 12.0, steerMax: 0.64,
      driftLoss: 0.38, len: 3.95, wid: 1.70, body: 'hatch', stats: { power: 5, grip: 8, weight: 9, drift: 4 } },
    { id: 'strega', name: 'STREGA MR', drive: 'MR', desc: 'Motor na sredini, živahen in oster',
      mass: 1180, a: 1.34, b: 1.12, hcg: 0.44, kI: 1.12, kw: 283, redline: 8300, idle: 1000,
      gears: [3.10, 2.05, 1.50, 1.18, 0.97, 0.82], final: 4.1, rw: 0.31,
      gripF: 1.0, gripR: 1.07, cDrag: 0.38, down: 0.26, brake: 12.2, steerMax: 0.6,
      driftLoss: 0.27, len: 4.2, wid: 1.82, body: 'wedge', stats: { power: 8, grip: 7, weight: 7, drift: 7 } },
  ];
  // the player's rally car (from the user's reference image): 80s 4WD rally hatchback, number 7
  MODELS.push({ id: 'rally', name: 'BURJA R7', drive: 'AWD', driftDR: 1, desc: 'Relijski dirkač, pogon na vsa kolesa',
    mass: 1150, a: 1.15, b: 1.25, hcg: 0.47, kI: 1.12, kw: 290, redline: 8000, idle: 1000,
    gears: [3.1, 2.05, 1.5, 1.17, 0.95, 0.8], final: 4.2, rw: 0.31,
    gripF: 1.03, gripR: 1.1, cDrag: 0.44, down: 0.22, brake: 12.2, steerMax: 0.64,
    driftLoss: 0.3, len: 3.95, wid: 1.80, body: 'rally', num: 7, stats: { power: 9, grip: 8, weight: 8, drift: 9 } });
  // Peugeot 206 with a real 3D model ("Peugeot 206" by Alvier, CC BY 4.0) - player only, drawn from the embedded P206 mesh
  MODELS.push({ id: 'p206', name: 'PEUGEOT 206', drive: 'FF', desc: 'Francoski hot hatch s krilom',
    mass: 1080, a: 1.15, b: 1.32, hcg: 0.47, kI: 1.12, kw: 250, redline: 7600, idle: 950,
    gears: [3.40, 2.15, 1.55, 1.20, 0.98, 0.83], final: 4.2, rw: 0.32,
    gripF: 1.05, gripR: 1.12, cDrag: 0.40, down: 0.22, brake: 12.0, steerMax: 0.64,
    driftLoss: 0.36, len: 3.85, wid: 1.74, body: 'hatch', glb: 'p206', stats: { power: 7, grip: 8, weight: 8, drift: 5 },
    credit: 'Model: \u201ePeugeot 206\u201c, avtor Alvier (Sketchfab), licenca CC BY 4.0' });
  const tqShape = (u) => Math.max(0.3, 1 - 0.85 * (u - 0.7) * (u - 0.7)); // flat, arcade-strong mid-range (SWGP2 pulls hard to ~130 km/h)
  for (const M of MODELS) {
    const wr = M.redline * TAU / 60;
    M.Tmax = M.kw * 1000 / (wr * tqShape(1.0));
  }

  // assist presets
  const ASSISTS = [
    { cs: 0.35, spin: 1.1, tc: 1.6, yawD: 0.0, tcSlip: 0, tcGain: 0, bmax: 1.5, align: 3.2, bmul: 1.25, K: 4.5 },        // nizka
    { cs: 0.6, spin: 0.66, tc: 0.97, yawD: 0.25, tcSlip: 0.13, tcGain: 3.2, bmax: 1.3, align: 4.8, bmul: 1.0, K: 6 },  // srednja
    { cs: 0.8, spin: 0.55, tc: 0.86, yawD: 0.5, tcSlip: 0.09, tcGain: 4.5, bmax: 1.05, align: 6.0, bmul: 0.8, K: 7.5 },   // visoka
  ];

  // surfaces: mu multiplier, c0 (const decel m/s2), c1 (decel per m/s)
  const SURF = [
    { mu: 1.0, c0: 0, c1: 0 },         // asphalt
    { mu: 0.95, c0: 0.1, c1: 0.004 },  // curb
    { mu: 0.62, c0: 0.9, c1: 0.075 },  // grass
    { mu: 0.55, c0: 2.4, c1: 0.16 },   // gravel
    { mu: 0.86, c0: 0.35, c1: 0.03 },   // paving (street circuits)
    { mu: 0.82, c0: 0.6, c1: 0.05 },    // makadam (dirt rally road): decent accel/brake but lively, slidey
  ];
  // arcade (player) handling: yaw = max nose rotation (rad/s), mu = lateral grip (g), slide = grip kept while sliding
  // SWGP2-style tarmac handling, measured from gameplay video:
  //   amax  : lateral grip (g) - the video's cars corner at ~1.6-2.2 g
  //   kv    : how fast momentum swings toward the nose, per radian of slide (1/s)
  //   bscale: slide angle at full lock (video: ~33 deg slow, ~22 deg at 110 km/h, ~15 deg fast)
  //   rmin  : tightest low-speed turning radius (m)
  const ARC = {
    kaze: { amax: 1.72, kv: 2.0, bscale: 1.12, rmin: 4.2 },
    vortex: { amax: 1.82, kv: 2.1, bscale: 0.9, rmin: 4.4 },
    pico: { amax: 1.78, kv: 2.1, bscale: 0.86, rmin: 4.0 },
    strega: { amax: 1.76, kv: 2.0, bscale: 1.08, rmin: 4.2 },
    rally: { amax: 1.82, kv: 2.05, bscale: 1.1, rmin: 4.1 },
    p206: { amax: 1.8, kv: 2.1, bscale: 0.9, rmin: 4.1 },
  };
  const TRAC_G = 1.8, BRAKE_G = 2.6; // high-class SWGP2 cars brake at ~2.8-3.0 g peak (incl. slide), weak cars ~2.2 g

  // ---- car upgrades (free, chosen before a race): 4 levels each. upgMods(levels) -> multipliers, applied to a CLONE of the model ----
  const UPG = [
    { id: 'motor',  name: 'Motor',        lv: ['Serijski', 'Stopnja 1', 'Stopnja 2', 'Dirkalni'] },
    { id: 'gume',   name: 'Gume',         lv: ['Serijske', 'Športne', 'Polslick', 'Slick'] },
    { id: 'zavore', name: 'Zavore',       lv: ['Serijske', 'Športne', 'Dirkalne', 'Keramične'] },
    { id: 'aero',   name: 'Aerodinamika', lv: ['Serijska', 'Spojler', 'Krilo', 'Paket GT'] },
  ];
  const UPG_KW = [1, 1.08, 1.16, 1.25], UPG_GRIP = [1, 1.04, 1.08, 1.12], UPG_KV = [1, 1.02, 1.04, 1.06], UPG_BRAKE = [1, 1.08, 1.16, 1.25];
  const UPG_AEROK = [0, 0.00006, 0.00011, 0.00016], UPG_DRAG = [1, 1.03, 1.06, 1.10];
  const upgLv = (L, id) => { const x = L ? L[id] : 0, v = typeof x === 'string' && /^[0-3]$/.test(x) ? +x : x; return Number.isInteger(v) && v >= 0 && v <= 3 ? v : 0; };   // 0..3 (or '0'..'3'); missing / invalid -> 0
  // levels = {motor, gume, zavore, aero} (0..3) -> { kw, grip, trac, kv, brake, aeroK, drag }
  function upgMods(levels) {
    const m = upgLv(levels, 'motor'), g = upgLv(levels, 'gume'), z = upgLv(levels, 'zavore'), a = upgLv(levels, 'aero');
    return { kw: UPG_KW[m], grip: UPG_GRIP[g], trac: UPG_GRIP[g], kv: UPG_KV[g], brake: UPG_BRAKE[z], aeroK: UPG_AEROK[a], drag: UPG_DRAG[a] };
  }
  // stat bars (0..10, like model.stats) of a model with upgrades, plus the upgraded power in kW
  function upgStats(model, levels) {
    const b = model.stats || { power: 5, grip: 5, weight: 5, drift: 5 };
    const m = upgLv(levels, 'motor'), g = upgLv(levels, 'gume'), z = upgLv(levels, 'zavore'), a = upgLv(levels, 'aero');
    const r = (v) => Math.min(10, Math.round(v * 10) / 10);
    const up = (base, add) => { const h = 10 - base; return h > 0 ? 10 - h * Math.exp(-add / h) : base; };   // ~ +add, but it bends below 10, so every level still shows
    return {
      power: r(up(b.power, [0, 0.8, 1.6, 2.5][m])),
      grip: r(up(b.grip, [0, 0.5, 1.0, 1.5][g] + [0, 0.3, 0.6, 0.9][a] + [0, 0.2, 0.4, 0.6][z])),
      weight: r(b.weight),
      drift: r(b.drift),
      kw: model.kw * UPG_KW[m],
    };
  }
  // ---- 'cs' handling (Circuit Superstars, target-driven kinematic drift; see Car.stepCS) ----
  // Every constant is either a measured CS signature (times in s, angles in rad, rates in rad/s: scale-free) or relative to the
  // car's lateral limit aL (option 1: CS handling at our speeds; aL = CSK.aL x arc.amax, 2.24-2.37 g). Option 2 = CSK.aL 1.70.
  const CSK = {
    aL: 1.30,          // lateral limit (g) = aL x arc.amax: kaze 2.24 .. vortex/rally 2.37 g, flat with speed (B1a)
    comb: 1.08,        // friction ellipse: combined limit / lateral limit (B1c 1.0-1.15: at full brake ~0.85 aL lateral is left)
    brk: 0.62,         // brake cap = brk x brakeG: 1.61 g stock = 0.68-0.72 aL (B1b 0.67), no lock (cap < grip)
    dmgGrip: 0,        // CS damage costs top speed only (A11); the engine loses 22 %·dmg in the shared block
    wMax: 1.35,        // max path rate (rad/s) = 77 deg/s (B3a 75-80); R = v / wMax below the crossover (~60 km/h)
    rMin: 4.2,         // parking-speed turning radius (m), the kinematic regime (C8)
    tv0: 0.45, tvE: 0.4, tvLo: 0.35, tvHi: 0.60,   // tau_v(v) = tv0 (v / 100 km/h)^tvE: attitude = tau_v x path rate (B0)
    tvLoose: 0.8,      // tau_v x (1 + tvLoose (1 - lateral mu)): bigger, lazier slides on makadam / grass / sand (C11)
    ceil: 0.66,        // soft ceiling of the attitude target (38 deg; B2b 37-40)
    tIn: 0.15,         // attitude build-up time constant (s): turn-in yaw rise 0.27-0.29 s, r overshoot 1.5-2.0, slip rise 0.34-0.52 s with the key ramp (B4a/B4d/B4e); 0.09 gave 0.21 s / 2.2x and +20 % key ripple (judge)
    tOutK: 0.8,        // unwind time constant = tOutK x tau_v (B4h natural decay 0.35-0.45 s, B4i yaw dips ~-17 deg/s)
    tRev: 0.12,        // a demand to the other side (S-bend flick, counter-steer): quick swing, rate-limited (B4g, research: snap direction changes)
    rateN: 1.6, rateB: 2.3,     // attitude rate limit (rad/s): 92 deg/s, 132 deg/s under brakes (B4c ramp 50-110, B4g 62/112)
    rMax: 2.3,         // yaw-rate cap from the driver's inputs (rad/s) = 132 deg/s (A18: |r| p99.9 126 deg/s); contacts can exceed it
    tR: 0.03, rAcc: 8, rAccB: 11,   // yaw rate follows its target with 0.03 s lag, at most 460 / 630 deg/s^2 (B4j lower bounds 245-500)
    lead: 0.05,        // attitude lead on a rising demand (s): rotate first, settle 2-3 deg (B4e, B4f)
    leadOut: 0.2,      // attitude lead on a falling demand (s): the nose stops while the path still turns (B4i; beta leads omega by 0.1 s)
    kPath: 0.35,       // share of the FR/MR lift / power rotation that also tightens the line
    scrub: 0.6,        // slide scrub along the path = scrub x a_n x tan(attitude) (B1h: 0.2-0.35 aL coasting in a limit drift; A8)
    bxFull: 0.6,       // the brake excess is full from 60 % brake force (analogue brakes: AI, autopilot)
    bxOn: 0.10, bxOff: 0.18,   // brake excess builds / decays (s) (B5a: +4 deg at 0.2 s, +6.8 at 0.3 s, gone 0.5 s after release)
    coastT: 0.2,       // lift / coast detection (s) (B5b)
    liftT: 0.45, liftOn: 0.12, liftA: 0.5,   // FR/MR lift-off pulse: decay, attack (s), only above liftA x aL lateral (5.4)
    hbX: 0.17, hbBrk: 0.3,     // the drift button in cs: +10 deg rotation aid and a light 0.3 g brake (C9)
    kFR: 3.5, kLR: 0.8, kLt: 0.5, kickHp: 0.35, kickOn: 0.06, kickMax: 0.35, kickPath: 0.3,   // surface-edge kick (B8c, C11): axle grip step
                       // (outer wheels weighted by the lateral load, kLt), side drag step, high-passed over kickHp s, <= 20 deg
    tapT: 1.5, tapMax: 0.4, tapDecay: 0.25,   // car contacts: the rigid-body yaw impulse x tapT becomes an attitude kick (<= 23 deg) that decays
                       // in tapDecay s while the servo carries the car through it (B10b: +10-30 deg, +50-140 deg/s, back in 0.25-0.5 s)
    airYawT: 0.25,     // in the air the yaw rate dies away in 0.25 s (no steering there; the car lands close to its travel)
    engBrk: 0.5,       // engine braking when lifting (m/s^2; arcade 1.1): lifting costs little (B1f)
    brkUp: 10, brkDn: 12,      // brake force ramp (1/s): full in 0.10 s, off in 0.08 s (A6, C6)
    stOff: 0.14, stA: 0.06,    // steer shaping: digital back to centre in 0.14 s; analogue lag 0.06 s (C1)
    wallE: 0.05, wallMu: 0.25, wallYaw: 0.3,   // walls: restitution, scrape friction, share of the lever-arm yaw (B9)
    carE: 0.1,         // car contacts: restitution (B10a); the angular impulse becomes the attitude kick above
    aiLatA: 18.5, aiBrakeA: 12.5, aiWmax: 1.2, aiAssist: 2, aiBx: 0.45, aiKw: 0.3, aiSkCap: 1.06,   // AI (B11, §5.5)
  };
  // cs per-wheel surfaces (instead of SURF inside stepCS; SURF itself is unchanged for the arcade)
  const CSSURF = [   // lat: side grip share, tr: traction / brake share, c0 (m/s^2) + c1 (1/s) x speed: rolling drag
    { lat: 1.0, tr: 1.0, c0: 0, c1: 0 },            // asphalt
    { lat: 1.0, tr: 0.95, c0: 0.1, c1: 0.004 },     // kerb: grip = asphalt, cosmetic (B8d)
    { lat: 0.66, tr: 0.85, c0: 1.5, c1: 0.15 },     // grass: 2 wheels ~ -0.3 g of drive at 95 km/h (B8a), 2/3 of the side grip left
    { lat: 0.58, tr: 0.85, c0: 1.0, c1: 0.05 },     // gravel / sand: whole car ~ -0.4 g of drive (drive about halved, A32/B8a), side grip 0.58
    { lat: 0.88, tr: 0.86, c0: 0.35, c1: 0.03 },    // paving (= SURF)
    { lat: 0.8, tr: 0.82, c0: 0.6, c1: 0.05 },      // makadam: side grip 0.8, tau_v +16 % (C11); drive and drag = SURF (gora's pace unchanged)
  ];
  // cs per model (drive-type layer, targets §5.4): bx brake excess at full brake + full demand, coast / thr steady attitude
  // change at full demand, liftP / pwr FR/MR rotation, out = unwind factor, turn = turn-in speed factor, w = path-rate cap factor
  const CSP = {
    kaze:   { bx: 0.14, coast: -0.044, thr: 0, liftP: 0.15, pwr: 0.10, out: 1.3, turn: 1.0, w: 1.0 },       // FR: lift-off + power rotation, lazier exits
    vortex: { bx: 0.11, coast: -0.088, thr: -0.02, liftP: 0, pwr: 0.025, out: 0.9, turn: 0.95, w: 0.97 },  // AWD: steady, straightens fastest
    pico:   { bx: 0.16, coast: -0.099, thr: -0.035, liftP: 0, pwr: 0, out: 1.0, turn: 1.0, w: 1.03 },       // FF: pivots on the brakes, throttle pulls it straight
    strega: { bx: 0.14, coast: -0.044, thr: 0, liftP: 0.18, pwr: 0.08, out: 1.2, turn: 1.15, w: 1.02 },     // MR: quick turn-in, lift rotation
    rally:  { bx: 0.13, coast: -0.077, thr: -0.015, liftP: 0, pwr: 0.035, out: 0.95, turn: 1.05, w: 1.0 },  // AWD rally car: a bit livelier
    p206:   { bx: 0.15, coast: -0.099, thr: -0.03, liftP: 0, pwr: 0, out: 1.0, turn: 1.0, w: 1.02 },       // FF
  };
  // cs assists (index = ASSISTS level). visoka (2, the default) = the measured CS car; lower levels = more slide, lazier recovery
  // lock: full steer as a share of the path-rate cap (>1: can overdrive the grip), bx / layer / kick: pedal, drive-type and
  // surface-kick multipliers, out: unwind factor, hard: hard attitude limit (rad), stOn: digital steer ramp to full (s)
  const CSASSIST = [
    { lock: 1.06, bx: 1.25, layer: 1.4, kick: 1.3, out: 1.12, hard: 1.0, stOn: 0.30 },    // nizka
    { lock: 1.02, bx: 1.12, layer: 1.2, kick: 1.15, out: 1.05, hard: 0.87, stOn: 0.33 },  // srednja
    { lock: 1.0, bx: 1.0, layer: 1.0, kick: 1.0, out: 1.0, hard: 0.8, stOn: 0.36 },       // visoka
  ];
  const PWR_MULT = 1.75, SW_DRAG = 0.0013; // arcade power boost and drag (fit to SWGP2 acceleration curves)
  const JUMP_G = 14; // vertical gravity for jumps on hilly tracks (arcade-snappy, a bit above real g)
  const _bk = { dy: 0, sl: 0 };   // (Track.bankAt output)
  const MU_BASE = 1.32;
  const STEER_VREF = 21;
  const DRIFT_GRIP = 0.42; // extra lateral 'momentum follows the nose' accel (g) at full drift

  // normalized lateral force for slip angle a (rad): front falls off after peak (understeer), rear stays flat (drift-friendly)
  function tireF(a) { const f = Math.sin(1.62 * Math.atan(10 * Math.abs(a))); return a < 0 ? -f : f; }
  // player front tyre: keeps biting at full lock so more steering = more turning
  function tireFP(a) { const f = Math.sin(1.42 * Math.atan(9 * Math.abs(a))); return a < 0 ? -f : f; }
  function tireR(a) { const f = Math.sin(1.38 * Math.atan(7.5 * Math.abs(a))); return a < 0 ? -f : f; }
  const tire = tireR;

  /* ---------------------------------------------------------------------
     CAR
     --------------------------------------------------------------------- */
  class Car {
    constructor(model, opts) {
      // upgrades: the car drives a CLONE of the model (MODELS / ARC entries are shared by every car and the menus: never mutate them)
      const U = opts.upg ? upgMods(opts.upg) : null;
      if (U) {
        model = Object.assign({}, model, { kw: model.kw * U.kw, cDrag: model.cDrag * U.drag });
        model.Tmax = model.kw * 1000 / (model.redline * TAU / 60 * tqShape(1.0));
      }
      const arc0 = ARC[model.id] || ARC.kaze;
      this.arc = U ? Object.assign({}, arc0, { amax: arc0.amax * U.grip, kv: arc0.kv * U.kv }) : arc0;   // per-car arcade handling
      this.tracG = U ? TRAC_G * U.trac : TRAC_G; this.brakeG = U ? BRAKE_G * U.brake : BRAKE_G; this.aeroK = U ? U.aeroK : 0;
      this.upg = U ? { motor: upgLv(opts.upg, 'motor'), gume: upgLv(opts.upg, 'gume'), zavore: upgLv(opts.upg, 'zavore'), aero: upgLv(opts.upg, 'aero') } : null;
      this.upgGrip = U ? U.grip : 0;   // autopilot / AI corner-speed scale (0 = stock car)
      this.m = model;
      this.id = opts.id || 0;
      this.isPlayer = !!opts.isPlayer;
      this.phys = opts.phys === 'cs' || opts.phys === 'rally' ? 'cs' : 'arcade';   // 'cs': Circuit Superstars kinematic drift (stepCS; the removed 'rally' maps to it); 'arcade': the SWGP2-style slide model
      this.arcade = this.phys === 'cs' ? false : !!opts.arcade;
      this.wMaxNow = 2;
      this.name = opts.name || model.name;
      this.color = opts.color;
      this.assist = ASSISTS[opts.assist == null ? 1 : opts.assist];
      this.x = 0; this.z = 0; this.h = 0; this.vx = 0; this.vz = 0; this.w = 0;
      this.px = 0; this.pz = 0; this.ph = 0; // previous (for interpolation)
      this.y = 0; this.py = 0; this.vy = 0; this.air = 0; this.airT = 0; this.landT = 0; this.impactVY = 0;
      this.roadY = 0; this.gradeNow = 0; this.curvNow = 0;
      this.dmg = 0; this.dz = [0, 0, 0, 0]; this.dents = []; this.dmgMode = 2;
      this.inPit = false; this.pitState = null; this.pitT = 0; this.pitDur = 0; this.pitDone = false; this.repairN = 0;   // pit lane: in it, stopping / repairing at the box
      this.cd = [0, 0, 0, 0]; this.lightOut = [0, 0, 0, 0]; this.lost = {}; this.detach = []; this.hitDebris = 0;
      this.winOut = [0, 0, 0, 0]; this.roofDmg = 0;   // broken windows (windscreen, rear, left, right); roof crumple 0..1   // corners FL/FR/RL/RR, broken lights, lost parts   // damage 0..1; zones front/rear/left/right; 0 off, 1 visual, 2 visual+handling
      this.inSteer = 0; this.inThr = 0; this.inBrk = 0; this.inHand = 0;
      this.steer = 0; this.delta = 0; this.drift = 0;
      this.vref = this.isPlayer ? STEER_VREF : 13; // player gets more steering at speed
      this.dState = 0; this.bT = 0; this.wPath = 0; this.vAngP = null; this.csS = 0; this.csWd = 0; this.csB = 0; this.csBx = 0; this.csCo = 0; this.csLt = 0; this.csLp = 0; this.csThrP = 0; this.csK = 0; this.csKc = 0; this.csKs = null; this.csAn = 0; this.csAT = 0; this.csWcap = 1;
      this.gear = 1; this.rpm = model.idle; this.shiftT = 0; this.revHold = 0;
      this.axF = 0;
      this.vl = 0; this.vt = 0; this.beta = 0;
      this.slipF = 0; this.slipR = 0; this.spin = 0; this.lock = 0;
      this.ws = [0, 0, 0, 0];
      this.onCurb = 0;
      this.q = { i: -1 }; this.wq = [{ i: -1 }, { i: -1 }, { i: -1 }, { i: -1 }];
      this.dist = 0; this.sPrev = 0; this.lap = 0; this.lapTimes = []; this.lapStart = 0;
      this.finished = false; this.finishTime = 0; this.finishPos = 0;
      this.cp = 0; this.splits = []; this.cpEv = 0;   // checkpoints passed, race time at each, event counter (bumped on every CP)
      this.noReverse = false;                          // true: holding the brake at a standstill does not engage reverse (set when a car finishes an open road)
      this.wrongT = 0; this.stuckT = 0;
      this.hitWall = 0; this.hitCar = 0; this.impact = 0;
      this.locked = true;
      // AI
      this.skill = opts.skill || 1; this.aiOff = 0; this.aiOffT = opts.laneBias || 0; this.laneBias = opts.laneBias || 0;
      this.aiT = 0; this.aiNoise = 0;
      const b = model;
      this.I = b.mass * b.kI * b.kI;
      this.tw = b.wid * 0.43; // half track width (wheels)
      this.corners = [[b.len * 0.5, -b.wid * 0.5], [b.len * 0.5, b.wid * 0.5], [-b.len * 0.5, -b.wid * 0.5], [-b.len * 0.5, b.wid * 0.5]];
      this.circles = [-b.len * 0.3, 0, b.len * 0.3];
      this.rad = b.wid * 0.5 + 0.02;
    }

    get speed() { return Math.hypot(this.vx, this.vz); }

    place(x, z, h) {
      this.x = this.px = x; this.z = this.pz = z; this.h = this.ph = h;
      this.y = this.py = 0; this.vy = 0; this.air = 0; this.airT = 0; this.landT = 0;
      this.vx = this.vz = this.w = 0; this.gear = 1; this.rpm = this.m.idle; this.q.i = -1;
      this.dState = 0; this.bT = 0; this.wPath = 0; this.vAngP = null; this.csS = 0; this.csWd = 0; this.csB = 0; this.csBx = 0; this.csCo = 0; this.csLt = 0; this.csLp = 0; this.csThrP = 0; this.csK = 0; this.csKc = 0; this.csKs = null; this.csAn = 0; this.csAT = 0; this.csWcap = 1;
      for (const q of this.wq) q.i = -1;
    }

    /* SWGP2-style handling (all cars). Steering chooses the SLIDE ANGLE (how far the nose points
       into the corner), not a spin rate; grip swings the car's momentum toward the nose in proportion
       to that angle (up to ~2 g), so the car always "drifts" a little through corners like in the game.
       Full lock gives ~35 deg at low speed down to ~20 deg at 150 km/h; hard braking lets the tail
       swing further. Release the steering and the car straightens within a few tenths of a second. */
    stepArcade(dt, trk) {
      const M = this.m, P = this.arc || ARC[M.id] || ARC.kaze, A = this.assist;
      this.px = this.x; this.pz = this.z; this.ph = this.h; this.py = this.y;
      if (trk.hasElev) { trk.query(this.x, this.z, this.q.i, this.q); const e = trk.elevAt(this.q.s); this.roadY = e.y; this.gradeNow = e.grade; this.curvNow = e.curv; }
      else { this.roadY = 0; this.gradeNow = 0; this.curvNow = 0; }
      if (trk.bank) { trk.bankAt(this.q.s, this.q.d, _bk); this.roadY += _bk.dy; this.bankSl = _bk.sl; }   // a banked corner (the Karussell)
      const ch = Math.cos(this.h), sh = Math.sin(this.h);
      const vl = this.vx * ch + this.vz * sh, vt = -this.vx * sh + this.vz * ch;
      const spd = Math.hypot(vl, vt), m = M.mass;
      // launch off crests: if the road curves away downward faster than gravity can hold the car, it takes off
      if (trk.hasElev && !this.air) {
        const accSurf = vl * vl * this.curvNow;   // vertical accel needed to keep following the surface (negative over a crest)
        if (spd > 6 && accSurf < -JUMP_G * 0.85) { this.air = 1; this.vy = this.gradeNow * vl; this.airT = 0; }
      }
      const grounded = !this.air;
      const tw = this.tw, wpos = [[M.a, -tw], [M.a, tw], [-M.b, -tw], [-M.b, tw]];
      let muSum = 0, curb = 0, dragC0 = 0, dragC1 = 0;
      for (let k = 0; k < 4; k++) {
        const wx = this.x + wpos[k][0] * ch - wpos[k][1] * sh, wz = this.z + wpos[k][0] * sh + wpos[k][1] * ch;
        const q = trk.query(wx, wz, this.wq[k].i >= 0 ? this.wq[k].i : this.q.i, this.wq[k]);
        const sf = trk.surface(q); this.ws[k] = sf; muSum += SURF[sf].mu; if (sf === 1) curb++;
        dragC0 += SURF[sf].c0 * 0.25; dragC1 += SURF[sf].c1 * 0.25;
      }
      this.onCurb = curb;
      const muSurf = muSum / 4;
      const fwd = vl > 0.5;
      const beta = spd > 1.5 && fwd ? Math.atan2(vt, vl) : 0;
      this.beta = beta;
      const ab = Math.abs(beta);
      const vAng = Math.atan2(this.vz, this.vx);
      const wp = spd > 2 && this.vAngP != null ? wrapPi(vAng - this.vAngP) / dt : 0;
      this.vAngP = vAng;
      this.wPath += (wp - this.wPath) * Math.min(1, dt * 18);
      const st = this.locked ? 0 : this.steer;
      let thr = this.locked ? 0 : this.inThr, brk = this.inBrk;
      const hb = this.locked ? 0 : this.inHand;
      const vAbs = Math.abs(vl);
      let bMaxV = (0.16 + 0.56 * Math.exp(-spd / 20)) * P.bscale * (A.bmul || 1);
      const pwrOS = (M.drive === 'FR' || M.drive === 'MR') ? 0.3 : M.drive === 'AWD' ? 0.12 : 0;
      bMaxV *= (0.85 + 0.25 * thr) * (1 + 2.0 * Math.min(1, brk) * sstep(10, 20, spd)) /* brake + steer swings the car sideways into hairpins (SWGP2: 45-90 deg, ~3.5 g) */ * (1 + 0.6 * hb) * (1 + pwrOS * Math.min(1, this.spin || 0));
      bMaxV *= 1 + 1.3 * (1 - Math.min(1, muSurf));             // loose surfaces (grass/gravel): much bigger slides, like SWGP2 rally
      bMaxV = Math.min(bMaxV, A.bmax * (1 + 0.3 * (1 - Math.min(1, muSurf))));
      this.bMaxNow = bMaxV;
      let wT;
      if (vl < -0.5) wT = -st * Math.min(vAbs / P.rmin, 1.6);
      else {
        const bT = -st * bMaxV;
        wT = this.wPath + (A.K || 6) * (beta - bT);
        const cap = spd / P.rmin + Math.abs(this.wPath);
        wT = clamp(wT, -cap, cap);
      }
      if (!grounded) wT = this.w; // no steering authority while airborne
      this.w += (wT - this.w) * Math.min(1, dt * 12);
      this.drift = sstep(0.1, 0.45, ab);
      // on a slope (gradeForce), a brake press that catches the car rolling backwards only stops it: reverse needs a fresh press
      if (trk.def.gradeForce) { if (this.inBrk <= 0.1) this.revNo = false; else if (vl < -0.3 && this.gear !== -1) this.revNo = true; }
      if (this.gear === -1) {
        const revThr = brk; brk = thr; thr = revThr;
        if (this.inThr > 0.1 && vl > -1.0) { this.gear = 1; thr = this.inThr; brk = 0; }
      } else if (this.inBrk > 0.1 && this.inThr < 0.1 && vl < 0.6 && !this.locked && !this.noReverse && !this.revNo) {
        this.revHold += dt; if (this.revHold > 0.3) { this.gear = -1; this.revHold = 0; }
      } else this.revHold = 0;
      let F = 0; const eff = 0.88;
      if (this.gear > 0) {
        const gr = M.gears[this.gear - 1] * M.final;
        const wr = Math.max(0, vl) / M.rw * gr * 9.5493;
        if (this.shiftT <= 0) {
          if (wr > M.redline * 0.95 && this.gear < M.gears.length) { this.gear++; this.shiftT = 0.1; }
          else if (this.gear > 1) {
            const wrLow = Math.max(0, vl) / M.rw * M.gears[this.gear - 2] * M.final * 9.5493;
            if (wrLow < M.redline * 0.78 && wr < M.redline * 0.55) { this.gear--; this.shiftT = 0.1; }
          }
        }
        const gr2 = M.gears[this.gear - 1] * M.final;
        const wr2 = Math.max(0, vl) / M.rw * gr2 * 9.5493;
        const rpm = Math.max(wr2, M.idle + (M.redline * 0.62 - M.idle) * thr);
        let T = M.Tmax * tqShape(rpm / M.redline); if (wr2 > M.redline * 1.01) T = 0;
        F = T * gr2 * eff / M.rw * thr; if (this.shiftT > 0) F *= 0.35;
        F -= (1 - thr) * M.Tmax * 0.22 * clamp(wr2 / M.redline, 0, 1) * gr2 / M.rw * Math.sign(vl);
        this.rpmTarget = rpm;
      } else {
        const gr = 3.3 * M.final;
        const wr = Math.max(0, -vl) / M.rw * gr * 9.5493;
        this.rpmTarget = Math.max(wr, M.idle + 2500 * thr);
        F = -M.Tmax * 0.8 * gr * eff / M.rw * thr * (vl < -8 ? 0 : 1);
      }
      if (this.shiftT > 0) this.shiftT -= dt;
      if (this.locked) this.rpmTarget = M.idle + (M.redline * 0.88 - M.idle) * this.inThr;
      const share = M.drive === 'AWD' ? 0.68 : M.drive === 'FF' ? 0.6 : 0.55;
      // launch: SWGP2 cars of every power class cover the first second at only ~16-18 km/h (wheelspin), then pull hard
      const Fdmax = this.tracG * G * m * share * muSurf * (0.42 + 0.58 * sstep(0.5, 9, Math.abs(vl)));
      if (this.gear > 0) {
        // measured SWGP2 curve: ~21 km/h after 1 s, strong pull to ~150 km/h, top ~220-235 km/h
        const Kp = PWR_MULT * M.kw * 1000 * 0.88 / m * (1 - 0.22 * (this.dmgMode === 2 ? this.dmg : 0));   // effective power per kg (damaged engine loses up to 22%)
        let Fsw = m * Kp / Math.max(Math.abs(vl), 4) * thr;
        if (this.shiftT > 0) Fsw *= 0.7;
        Fsw -= (1 - thr) * m * 1.1 * sstep(2, 20, vl);             // engine braking when lifting
        F = Fsw;
      }
      if (!grounded) F = 0; // wheels off the ground: no drive
      let spin = 0;
      if (Math.abs(F) > Fdmax) { spin = Math.abs(F) / Fdmax - 1; F = Math.sign(F) * Fdmax; }
      this.spin = thr > 0.2 && grounded ? spin : 0;
      let Fx = F, Fy = 0;
      const ux = spd > 0.05 ? vl / spd : 1, uy = spd > 0.05 ? vt / spd : 0;
      if (brk > 0 && spd > 0.05 && grounded) {
        const fb = Math.min(brk * this.brakeG * G * m * (0.55 + 0.45 * muSurf), spd * m / dt);
        Fx -= ux * fb; Fy -= uy * fb;
      }
      this.lock = grounded && (brk > 0.7 || hb > 0.5) && spd > 4 ? 1 : 0;
      if (fwd && spd > 1.5 && grounded) {
        let aMax = P.amax * G * muSurf * (1 - 0.4 * hb) * (1 - 0.08 * (this.dmgMode === 2 ? this.dmg : 0));
        // aero upgrade: downforce grip grows with speed^2 - both the limit and the turn per slide angle (so it is felt in every fast corner)
        const gA = this.aeroK ? 1 + this.aeroK * spd * spd : 1; aMax *= gA;
        const aTurn = Math.min(aMax, P.kv * gA * (1 - 0.4 * hb) * spd * Math.min(ab, 1.2), spd * spd / P.rmin + 2);
        const sgn = beta > 0 ? -1 : 1;
        Fx += m * aTurn * sgn * (-uy); Fy += m * aTurn * sgn * ux;
        const s2 = uy * uy;
        const drag = m * (0.45 * aTurn * Math.abs(uy) + G * 1.5 * s2 * s2);   // sideways scrub grows steeply from ~40 deg
        Fx -= ux * drag; Fy -= uy * drag;
      }
      const lowGrip = 1 - sstep(3, 8, spd);
      if ((lowGrip > 0 || !fwd) && grounded) Fy += clamp(-vt * m / dt, -G * m * 1.5, G * m * 1.5) * (fwd ? lowGrip : 1);
      const cdA = m * SW_DRAG * (M.cDrag / 0.42);
      Fx -= cdA * vl * spd + (grounded ? (0.015 * m * G) * Math.tanh(vl * 1.5) : 0);
      Fy -= cdA * 1.6 * vt * spd;
      if ((dragC0 > 0 || dragC1 > 0) && spd > 0.05 && grounded) {
        const dec = (dragC0 * Math.min(1, spd / 3) + dragC1 * spd) * m;
        Fx -= ux * dec; Fy -= uy * dec;
      }
      // gravity along the slope (def.gradeForce tracks only): gH > 0 = nose uphill. Not while locked on the grid; a car held on the
      // brake (or handbrake) at a crawl stays put instead of creeping backwards.
      if (trk.def.gradeForce && grounded && !this.locked) {
        const gH = this.gradeNow * (ch * this.q.tx + sh * this.q.tz);
        const hold = (brk > 0.05 || hb > 0.5) && thr < 0.05 && spd < 0.4;
        if (!hold) Fx -= m * G * gH / Math.sqrt(1 + gH * gH);
      }
      if (this.bankSl && grounded) { const a = -G * this.bankSl / Math.sqrt(1 + this.bankSl * this.bankSl), wx = this.q.nx * a, wz = this.q.nz * a; Fx += m * (wx * ch + wz * sh); Fy += m * (-wx * sh + wz * ch); }   // banked corner: gravity along the tilted surface pulls towards the inside
      const ax = (Fx * ch - Fy * sh) / m, az = (Fx * sh + Fy * ch) / m;
      this.vx += ax * dt; this.vz += az * dt;
      this.x += this.vx * dt; this.z += this.vz * dt; this.h += this.w * dt;
      // vertical motion (hilly tracks): fly off crests, arc, land
      if (trk.hasElev) {
        if (this.air) {
          this.airT += dt; this.vy -= JUMP_G * dt; this.y += this.vy * dt;
          if (this.y <= this.roadY) { this.impactVY = this.vy; if (this.vy < -11) applyDamage(this, (-this.vy - 11) * 0.01); this.y = this.roadY; this.vy = 0; this.air = 0; this.landT = clamp(-this.impactVY * 0.02 + 0.05, 0.05, 0.2); this.airT = 0; const sc = clamp(-this.impactVY * 0.016, 0, 0.13); this.vx *= (1 - sc); this.vz *= (1 - sc); }
        } else { this.y = this.roadY; this.vy = this.gradeNow * vl; if (this.landT > 0) this.landT -= dt; }
      } else { this.y = 0; }
      this.axF += (Fx / m - this.axF) * Math.min(1, dt * 7);
      if (spd < 0.08 && thr < 0.05 && Math.abs(F) < 1) { this.vx *= 0.8; this.vz *= 0.8; this.w *= 0.8; }
      this.vl = vl; this.vt = vt;
      this.latR = Math.abs(vt - this.w * M.b);
      this.slipR = Math.atan2(this.latR, Math.abs(vl) + 0.6);
      this.slipF = Math.atan2(Math.abs(vt + this.w * M.a), Math.abs(vl) + 0.6);
      this.delta = clamp(st * 0.35 * (vl >= -0.3 ? 1 : -1) + clamp(beta, -0.5, 0.5) * 0.8, -M.steerMax, M.steerMax);
      const rt = this.rpmTarget + (this.spin > 0.05 ? Math.min(2500, this.spin * 5000) : 0) + (this.drift > 0.3 && thr > 0.5 ? 500 * this.drift : 0);
      this.rpm += (Math.min(M.redline * 1.02, rt) - this.rpm) * Math.min(1, dt * 14);
    }

    /* 'cs' handling (Circuit Superstars), a target-driven kinematic drift:
       the steer is a demand for PATH RATE (a share of the lesser of the grip limit aL / v and 77 deg/s). The car wants the drift
       attitude tau_v x path rate (tau_v 0.35-0.6 s, rising with speed), plus pedal terms (trail-braking rotates it, lifting tidies
       it); the heading is servoed onto that attitude (a quick ramp in; it unwinds with ~0.8 tau_v, so on exit the nose stops and the
       car straightens itself), and the travel direction swings toward the nose at (attitude / tau_v), within a flat grip limit and
       a friction ellipse. Engine, gearbox, drag, slopes, bank, jumps and landing are the shared blocks. */
    stepCS(dt, trk) {
      const M = this.m, P = this.arc || ARC[M.id] || ARC.kaze, A = this.assist, K = CSK;
      const CA = CSASSIST[ASSISTS.indexOf(A)] || CSASSIST[2], CP = CSP[M.id] || CSP.kaze, ai = this.isPlayer ? 1 : K.aiBx;
      this.px = this.x; this.pz = this.z; this.ph = this.h; this.py = this.y;
      if (trk.hasElev) { trk.query(this.x, this.z, this.q.i, this.q); const e = trk.elevAt(this.q.s); this.roadY = e.y; this.gradeNow = e.grade; this.curvNow = e.curv; }
      else { this.roadY = 0; this.gradeNow = 0; this.curvNow = 0; }
      if (trk.bank) { trk.bankAt(this.q.s, this.q.d, _bk); this.roadY += _bk.dy; this.bankSl = _bk.sl; }   // a banked corner (the Karussell)
      const ch = Math.cos(this.h), sh = Math.sin(this.h);
      const vl = this.vx * ch + this.vz * sh, vt = -this.vx * sh + this.vz * ch;
      const spd = Math.hypot(vl, vt), m = M.mass, a = M.a, b = M.b;
      if (trk.hasElev && !this.air) {
        const accSurf = vl * vl * this.curvNow;
        if (spd > 6 && accSurf < -JUMP_G * 0.85) { this.air = 1; this.vy = this.gradeNow * vl; this.airT = 0; }
      }
      const grounded = !this.air;
      // ---- per-wheel surfaces: traction mu (SURF) of the driven wheels, cs side grip per axle, drag per side (edge kick) ----
      const tw = this.tw, wpos = [[a, -tw], [a, tw], [-b, -tw], [-b, tw]];
      const ldK = K.kLt * Math.min(1, Math.abs(this.csAn) / Math.max(1, K.aL * P.amax * G)), sgO = Math.sign(this.wPath);   // outer wheels carry more of the side load
      let muSum = 0, muF = 0, muR = 0, curb = 0, dragC0 = 0, dragC1 = 0, latF = 0, latB = 0, latFw = 0, latBw = 0, dragP = 0, dragN = 0;
      for (let k = 0; k < 4; k++) {
        const wx = this.x + wpos[k][0] * ch - wpos[k][1] * sh, wz = this.z + wpos[k][0] * sh + wpos[k][1] * ch;
        const q = trk.query(wx, wz, this.wq[k].i >= 0 ? this.wq[k].i : this.q.i, this.wq[k]);
        const sf = trk.surface(q); this.ws[k] = sf; const S = CSSURF[sf]; muSum += S.tr; if (k < 2) muF += S.tr * 0.5; else muR += S.tr * 0.5; if (sf === 1) curb++;
        const dk = (S.c0 * Math.min(1, spd / 3) + S.c1 * spd) * 0.25, lw = 0.5 * (1 + ldK * sgO * (k & 1 ? -1 : 1));   // (k odd: +lateral side = inner in a + turn)
        dragC0 += S.c0 * 0.25; dragC1 += S.c1 * 0.25;
        if (k < 2) { latF += S.lat * 0.5; latFw += S.lat * lw; } else { latB += S.lat * 0.5; latBw += S.lat * lw; }
        if (k & 1) dragP += dk; else dragN += dk;
      }
      this.onCurb = curb;
      const muSurf = muSum / 4, muLat = (latF + latB) * 0.5;
      const muDrv = M.drive === 'FF' ? muF : M.drive === 'AWD' ? muSurf : muR;   // one rear wheel on the grass costs a RWD car traction
      const fwd = vl > 0.5;
      const beta = spd > 1.5 && fwd ? Math.atan2(vt, vl) : 0;
      this.beta = beta;
      const ab = Math.abs(beta), att = -beta;   // attitude = heading - travel (+ = nose toward +w)
      const vAng = Math.atan2(this.vz, this.vx);
      const wp = spd > 2 && this.vAngP != null ? wrapPi(vAng - this.vAngP) / dt : 0;
      this.vAngP = vAng;
      this.wPath += (wp - this.wPath) * Math.min(1, dt * 18);
      const stIn = this.locked ? 0 : this.steer;
      let thr = this.locked ? 0 : this.inThr, brk = this.inBrk;
      const hb = this.locked ? 0 : this.inHand;
      // ---- steering shaping: keys / buttons ramp to full in CA.stOn s and back in 0.14 s; analogue (tilt, wheel, AI) a light lag ----
      let s = this.csS;
      if (this.isPlayer && this.digitalSteer) { const out = Math.abs(stIn) > Math.abs(s) && stIn * s >= 0, r = out ? 1 / CA.stOn : 1 / K.stOff; s += clamp(stIn - s, -r * dt, r * dt); }
      else s += (stIn - s) * Math.min(1, dt / K.stA);
      this.csS = s;
      // ---- gearbox + engine (shared block; only the engine braking is lighter) ----
      if (trk.def.gradeForce) { if (this.inBrk <= 0.1) this.revNo = false; else if (vl < -0.3 && this.gear !== -1) this.revNo = true; }
      if (this.gear === -1) {
        const revThr = brk; brk = thr; thr = revThr;
        if (this.inThr > 0.1 && vl > -1.0) { this.gear = 1; thr = this.inThr; brk = 0; }
      } else if (this.inBrk > 0.1 && this.inThr < 0.1 && vl < 0.6 && !this.locked && !this.noReverse && !this.revNo) {
        this.revHold += dt; if (this.revHold > 0.3) { this.gear = -1; this.revHold = 0; }
      } else this.revHold = 0;
      let F = 0; const eff = 0.88;
      if (this.gear > 0) {
        const gr = M.gears[this.gear - 1] * M.final;
        const wr = Math.max(0, vl) / M.rw * gr * 9.5493;
        if (this.shiftT <= 0) {
          if (wr > M.redline * 0.95 && this.gear < M.gears.length) { this.gear++; this.shiftT = 0.1; }
          else if (this.gear > 1) {
            const wrLow = Math.max(0, vl) / M.rw * M.gears[this.gear - 2] * M.final * 9.5493;
            if (wrLow < M.redline * 0.78 && wr < M.redline * 0.55) { this.gear--; this.shiftT = 0.1; }
          }
        }
        const gr2 = M.gears[this.gear - 1] * M.final;
        const wr2 = Math.max(0, vl) / M.rw * gr2 * 9.5493;
        this.rpmTarget = Math.max(wr2, M.idle + (M.redline * 0.62 - M.idle) * thr);
        const Kp = PWR_MULT * M.kw * 1000 * 0.88 / m * (1 - 0.22 * (this.dmgMode === 2 ? this.dmg : 0));
        let Fsw = m * Kp / Math.max(Math.abs(vl), 4) * thr;
        if (this.shiftT > 0) Fsw *= 0.7;
        Fsw -= (1 - thr) * m * K.engBrk * sstep(2, 20, vl);
        F = Fsw;
      } else {
        const gr = 3.3 * M.final;
        const wr = Math.max(0, -vl) / M.rw * gr * 9.5493;
        this.rpmTarget = Math.max(wr, M.idle + 2500 * thr);
        F = -M.Tmax * 0.8 * gr * eff / M.rw * thr * (vl < -8 ? 0 : 1);
      }
      if (this.shiftT > 0) this.shiftT -= dt;
      if (this.locked) this.rpmTarget = M.idle + (M.redline * 0.88 - M.idle) * this.inThr;
      if (!grounded) F = 0;
      const share = M.drive === 'AWD' ? 0.68 : M.drive === 'FF' ? 0.6 : 0.55;
      const Fdmax = this.tracG * G * m * share * muDrv * (0.42 + 0.58 * sstep(0.5, 9, Math.abs(vl)));
      let spin = 0;
      if (Math.abs(F) > Fdmax) { spin = Math.abs(F) / Fdmax - 1; F = Math.sign(F) * Fdmax; }
      this.spin = thr > 0.2 && grounded ? spin : 0;
      // ---- brakes: a quick ramp, capped below the grip (they never lock), along the travel ----
      this.csB += clamp(brk - this.csB, -K.brkDn * dt, K.brkUp * dt);
      const bF = this.csB;
      const fb = spd > 0.05 && grounded ? Math.min((bF * K.brk * this.brakeG + hb * K.hbBrk) * G * m * (0.55 + 0.45 * muSurf), spd * m / dt) : 0;
      this.lock = grounded && hb > 0.5 && spd > 4 ? 1 : 0;
      // ---- the demand: a path rate, and the drift attitude that goes with it ----
      const v = Math.max(spd, 0.5);
      const gA = this.aeroK ? 1 + this.aeroK * spd * spd : 1, dmgG = 1 - K.dmgGrip * (this.dmgMode === 2 ? this.dmg : 0);
      const aL = K.aL * P.amax * G * muLat * gA * dmgG;                                             // flat lateral limit (m/s^2)
      const tv = clamp(K.tv0 * Math.pow(v / 27.78, K.tvE), K.tvLo, K.tvHi) * (1 + K.tvLoose * (1 - Math.min(1, muLat)));
      const kvU = ARC[M.id] ? P.kv / ARC[M.id].kv : 1;                                            // tyre upgrade: a slightly tighter hairpin rate
      const wCap = Math.min(aL / v, K.wMax * CP.w * kvU, v / K.rMin) * CA.lock;                  // path rate at full steer
      this.csWcap = wCap;
      const lo = sstep(2.5, 8, spd);                                                               // 0: parking (kinematic), 1: drift law
      const wD = s * wCap;
      const dwD = (wD - this.csWd) / dt; this.csWd = wD;
      const dir = s > 0.01 ? 1 : s < -0.01 ? -1 : 0, sA = Math.min(1, Math.abs(s));
      const aSS = tv * wD * lo;                                                                    // B0: attitude = tau_v x path rate
      // pedal and drive-type terms (rad, + = more rotation into the turn); only while steering, never in a straight line
      const bxT = CP.bx * CA.bx * ai * Math.min(1, bF / K.bxFull) * sA * sstep(8, 16, spd) * dir;   // (full effect from 60 % brake)
      this.csBx += (bxT - this.csBx) * Math.min(1, dt / (Math.abs(bxT) > Math.abs(this.csBx) ? K.bxOn : K.bxOff));
      this.csCo += ((thr < 0.1 && bF < 0.05 ? 1 : 0) - this.csCo) * Math.min(1, dt / K.coastT);
      const lay = CA.layer * ai, turnSg = Math.sign(this.wPath) || dir;
      if (CP.liftP && this.csThrP > 0.5 && thr < 0.1 && Math.abs(this.csAn) > K.liftA * aL) this.csLt = turnSg;   // FR/MR: a sudden lift in a loaded corner
      this.csLt *= Math.exp(-dt / K.liftT);
      this.csLp += (this.csLt - this.csLp) * Math.min(1, dt / K.liftOn);
      this.csThrP = thr;
      const rotX = CP.pwr * lay * thr * Math.min(1, this.spin * 1.5) * sA * dir * (1 - sstep(22, 30, spd)) + CP.liftP * lay * this.csLp;
      const pathX = K.kPath * rotX;
      // lead: on a rising demand the nose rotates first and settles back 2-3 deg (attitude only, B4e/B4f); on a falling demand
      // the attitude, and with it the path, unwinds ahead of the steer: the nose stops while the path still turns (B4i)
      const leadIn = wD * dwD > 0 ? tv * K.lead * dwD * lo : 0;
      const leadOut = wD * dwD < 0 ? clamp(tv * K.leadOut * dwD, -0.8 * Math.abs(aSS), 0.8 * Math.abs(aSS)) * lo : 0;
      const attX = this.csBx + dir * sA * (CP.coast * this.csCo + CP.thr * thr) * lo + leadIn
        + (1 - K.kPath) * rotX + K.hbX * hb * clamp(2 * s, -1, 1);
      const aP = aSS + leadOut + pathX, aU = aP + attX, c7 = 0.7 * K.ceil, c3 = 0.3 * K.ceil;
      let aT = Math.abs(aU) < c7 ? aU : Math.sign(aU) * (c7 + c3 * Math.tanh((Math.abs(aU) - c7) / c3));   // soft ceiling 38 deg
      // ---- surface-edge kick: a grip step between the axles or a drag step between the sides gives one bounded yaw kick ----
      const dRaw = K.kFR * (latFw - latBw) * turnSg * Math.min(1, Math.abs(this.csAn) / Math.max(1, aL)) + K.kLR * (dragP - dragN) / G;
      if (this.csKs == null) this.csKs = dRaw;
      this.csKs += (dRaw - this.csKs) * Math.min(1, dt / K.kickHp);
      this.csK += (clamp((dRaw - this.csKs) * CA.kick, -K.kickMax, K.kickMax) - this.csK) * Math.min(1, dt / K.kickOn);
      this.csKc *= Math.exp(-dt / K.tapDecay);   // contact kick (set by carCollide)
      aT = clamp(aT + this.csK + this.csKc, -CA.hard, CA.hard);
      this.csAT = aT;
      // ---- attitude servo: a quick ramp in; unwinding at ~0.8 tau_v (the nose stops while the travel catches up) ----
      // (building: quick; unwinding toward a smaller demand: ~0.8 tau_v, the exit; a demand to the other side: a quick flick)
      const err = aT - att, building = aT * att >= 0 && Math.abs(aT) > Math.abs(att);
      const rate = (bF > 0.3 ? K.rateB : K.rateN) * CP.turn;
      const tOut = K.tOutK * CP.out * CA.out * tv, kRev = clamp(-aT * Math.sign(att) / 0.05, 0, 1);
      const dAtt = clamp(building ? err * CP.turn / K.tIn : err / (tOut + (K.tRev - tOut) * kRev), -rate, rate);
      // ---- path law: the travel swings toward the nose at (path share of the attitude) / tau_v, inside the friction ellipse ----
      const rho = Math.abs(aU) > 0.02 ? clamp(aP / aU, 0, 1.3) : 1;
      let wN = lo * rho * (att - (1 - K.kickPath) * (this.csK + this.csKc)) / tv + (1 - lo) * wD;
      if (!fwd || !grounded) wN = 0;
      const aC = K.comb * aL, aNeed = Math.min(aL, Math.abs(wN) * v);
      if (F > 0 && fwd) F = Math.min(F, m * Math.sqrt(Math.max(0, aC * aC - aNeed * aNeed)));   // power costs grip: the drive gets what the cornering leaves
      const aX = Math.max(Math.abs(F), fb) / m;                                                  // (brakes first: the cornering gets what they leave)
      const aN = Math.min(aL, Math.sqrt(Math.max(0, aC * aC - aX * aX)));
      wN = clamp(wN, -aN / v, aN / v);
      this.csAn = wN * spd;
      // ---- forces (body frame): drive along the body (its sideways part is inside the path law), brakes along the travel, slide scrub ----
      let Fx = 0, Fy = 0;
      const ux = spd > 0.05 ? vl / spd : 1, uy = spd > 0.05 ? vt / spd : 0;
      if (fwd && spd > 1) { const Fd = F * Math.cos(Math.min(1.2, ab)); Fx += ux * Fd; Fy += uy * Fd; } else Fx += F;
      if (fb > 0) { Fx -= ux * fb; Fy -= uy * fb; }
      if (fwd && grounded && spd > 1.5) { const sc = m * K.scrub * Math.abs(this.csAn) * Math.min(2, Math.tan(Math.min(1.1, ab))); Fx -= ux * sc; Fy -= uy * sc; }
      const lowGrip = 1 - sstep(3, 8, spd);
      if ((lowGrip > 0 || !fwd) && grounded) Fy += clamp(-vt * m / dt, -G * m * 1.5, G * m * 1.5) * (fwd ? lowGrip : 1);
      // ---- air + rolling + surface drag, slope, bank (shared blocks) ----
      const cdA = m * SW_DRAG * (M.cDrag / 0.42);
      Fx -= cdA * vl * spd + (grounded ? (0.015 * m * G) * Math.tanh(vl * 1.5) : 0);
      Fy -= cdA * 1.6 * vt * spd;
      if ((dragC0 > 0 || dragC1 > 0) && spd > 0.05 && grounded) {
        const dec = (dragC0 * Math.min(1, spd / 3) + dragC1 * spd) * m;
        Fx -= ux * dec; Fy -= uy * dec;
      }
      let Fgrav = 0;
      if (trk.def.gradeForce && grounded && !this.locked) {
        const gH = this.gradeNow * (ch * this.q.tx + sh * this.q.tz);
        const hold = (brk > 0.05 || hb > 0.5) && thr < 0.05 && spd < 0.4;
        if (!hold) { Fgrav = -m * G * gH / Math.sqrt(1 + gH * gH); Fx += Fgrav; }
      }
      if (this.bankSl && grounded) { const a2 = -G * this.bankSl / Math.sqrt(1 + this.bankSl * this.bankSl), wx = this.q.nx * a2, wz = this.q.nz * a2, fl = m * (wx * ch + wz * sh);
        Fx += fl; Fy += m * (-wx * sh + wz * ch); Fgrav += fl; }
      // ---- yaw: follow (path rate + attitude rate) with a short lag and a yaw-acceleration limit ----
      let rT = clamp(wN + dAtt, -K.rMax, K.rMax);
      if (!fwd) rT = (vl < -0.5 ? -stIn : 0) * Math.min(Math.abs(vl) / P.rmin, 1.6);   // reversing: kinematic (as the arcade)
      if (!grounded) rT = this.w * Math.exp(-dt / K.airYawT);                            // no steering in the air; the spin dies away
      const rA = bF > 0.3 ? K.rAccB : K.rAcc;
      if (grounded) this.w += clamp((rT - this.w) * Math.min(1, dt / K.tR), -rA * dt, rA * dt); else this.w = rT;
      // ---- integrate: forces, then the path turn as an exact rotation of the velocity (no speed gained or lost by turning) ----
      const ax = (Fx * ch - Fy * sh) / m, az = (Fx * sh + Fy * ch) / m;
      this.vx += ax * dt; this.vz += az * dt;
      if (wN !== 0) { const cr = Math.cos(wN * dt), sr = Math.sin(wN * dt), vx0 = this.vx; this.vx = vx0 * cr - this.vz * sr; this.vz = vx0 * sr + this.vz * cr; }
      this.x += this.vx * dt; this.z += this.vz * dt; this.h += this.w * dt;
      if (trk.hasElev) {
        if (this.air) {
          this.airT += dt; this.vy -= JUMP_G * dt; this.y += this.vy * dt;
          if (this.y <= this.roadY) { this.impactVY = this.vy; if (this.vy < -11) applyDamage(this, (-this.vy - 11) * 0.01); this.y = this.roadY; this.vy = 0; this.air = 0; this.landT = clamp(-this.impactVY * 0.02 + 0.05, 0.05, 0.2); this.airT = 0; const sc = clamp(-this.impactVY * 0.016, 0, 0.13); this.vx *= (1 - sc); this.vz *= (1 - sc); }
        } else { this.y = this.roadY; this.vy = this.gradeNow * vl; if (this.landT > 0) this.landT -= dt; }
      } else { this.y = 0; }
      this.axF += (((Fx - Fgrav) / m) - this.axF) * Math.min(1, dt * 7);
      if (spd < 0.08 && thr < 0.05 && Math.abs(F) < 1) { this.vx *= 0.8; this.vz *= 0.8; this.w *= 0.8; }
      this.vl = vl; this.vt = vt;
      this.drift = sstep(0.1, 0.45, ab);
      // effects (the renderer's non-arcade skid / squeal branches): marks in real drifts (> 7 deg), not in every bend
      this.latR = spd * Math.sin(fwd && grounded ? Math.min(1.2, Math.max(0, ab - 0.12)) : 0) * 0.5 + (this.lock ? 2.5 : 0);
      this.slipR = Math.atan2(this.latR, Math.abs(vl) + 0.6);
      this.slipF = Math.min(0.25, ab * 0.3);
      this.delta = vl >= -0.3 ? clamp(0.1 * s + 0.5 * (aT - att), -0.26, 0.26) : clamp(-0.35 * stIn, -M.steerMax, M.steerMax);   // small, into the turn (C2)
      const rt = this.rpmTarget + (this.spin > 0.05 ? Math.min(2500, this.spin * 5000) : 0) + (this.drift > 0.3 && thr > 0.5 ? 500 * this.drift : 0);
      this.rpm += (Math.min(M.redline * 1.02, rt) - this.rpm) * Math.min(1, dt * 14);
    }

    step(dt, trk) {
      if (this.phys === 'cs') return this.stepCS(dt, trk);
      if (this.arcade) return this.stepArcade(dt, trk);
      const M = this.m, A = this.assist;
      this.px = this.x; this.pz = this.z; this.ph = this.h;
      const ch = Math.cos(this.h), sh = Math.sin(this.h);
      let vl = this.vx * ch + this.vz * sh;
      let vt = -this.vx * sh + this.vz * ch;
      const spd = Math.hypot(vl, vt);
      const L = M.a + M.b, m = M.mass;

      // --- wheel surfaces ---
      const tw = this.tw;
      const wpos = [[M.a, -tw], [M.a, tw], [-M.b, -tw], [-M.b, tw]];
      let muW = [1, 1, 1, 1];
      const hint = this.q.i;
      let curb = 0;
      for (let k = 0; k < 4; k++) {
        const wx = this.x + wpos[k][0] * ch - wpos[k][1] * sh;
        const wz = this.z + wpos[k][0] * sh + wpos[k][1] * ch;
        const q = trk.query(wx, wz, this.wq[k].i >= 0 ? this.wq[k].i : hint, this.wq[k]);
        const s = trk.surface(q);
        this.ws[k] = s; muW[k] = SURF[s].mu;
        if (s === 1) curb++;
      }
      this.onCurb = curb;
      // --- arcade drift state (player only): once a slide is provoked, the rear stays loose
      //     while the driver keeps steering into the turn with throttle ---
      const betaNow = vl > 2 ? Math.atan2(vt, vl) : 0;
      if (this.isPlayer) {
        // every turn at speed becomes a slide: the harder you steer, the looser the rear
        const dv = Math.max(0, vl), st = Math.abs(this.steer);
        let want = sstep(0.12, 0.7, st) * sstep(7, 14, dv) * (1 - 0.35 * sstep(28, 46, dv));
        if (this.inHand > 0.5 && dv > 8) want = 1;
        const rate = want > this.drift ? 5 : 2.8;
        this.drift += (want - this.drift) * Math.min(1, dt * rate);
      }
      const muF = (muW[0] + muW[1]) * 0.5 * MU_BASE * M.gripF;
      const muR = (muW[2] + muW[3]) * 0.5 * MU_BASE * M.gripR * (1 - M.driftLoss * this.drift);

      // --- loads ---
      const Ntot = m * G + M.down * spd * spd;
      const wt = clamp(m * this.axF * M.hcg / L, -0.3 * Ntot, 0.3 * Ntot);
      const Nf = Ntot * M.b / L - wt, Nr = Ntot * M.a / L + wt;

      // --- steering ---
      const beta = betaNow;
      this.beta = beta;
      const steerLim = M.steerMax / (1 + Math.max(0, vl) / this.vref);
      const csGain = A.cs * clamp((vl - 3) / 8, 0, 1) * (1 - 0.35 * this.drift);
      let delta = this.steer * steerLim + csGain * clamp(beta, -0.8, 0.8);
      delta = clamp(delta, -M.steerMax, M.steerMax);
      this.delta = delta;

      // --- gearbox / engine ---
      let thr = this.inThr, brk = this.inBrk;
      if (this.locked) { thr = 0; }
      if (this.gear === -1) {
        const revThr = brk; brk = thr; thr = revThr;
        if (this.inThr > 0.1 && vl > -1.0) { this.gear = 1; thr = this.inThr; brk = 0; }
      } else if (this.inBrk > 0.1 && this.inThr < 0.1 && vl < 0.6 && !this.locked && !this.noReverse) {
        this.revHold += dt;
        if (this.revHold > 0.3) { this.gear = -1; this.revHold = 0; }
      } else this.revHold = 0;

      let F = 0;
      const eff = 0.88;
      if (this.gear > 0) {
        const gr = M.gears[this.gear - 1] * M.final;
        const wr = Math.max(0, vl) / M.rw * gr * 9.5493;
        // auto shift
        if (this.shiftT <= 0) {
          if (wr > M.redline * 0.95 && this.gear < M.gears.length) { this.gear++; this.shiftT = 0.14; }
          else if (this.gear > 1) {
            const lowR = M.gears[this.gear - 2] * M.final;
            const wrLow = Math.max(0, vl) / M.rw * lowR * 9.5493;
            if (wrLow < M.redline * 0.78 && wr < M.redline * 0.55) { this.gear--; this.shiftT = 0.1; }
          }
        }
        const gr2 = M.gears[this.gear - 1] * M.final;
        const wr2 = Math.max(0, vl) / M.rw * gr2 * 9.5493;
        const launch = M.idle + (M.redline * 0.62 - M.idle) * thr;
        const rpm = Math.max(wr2, launch);
        let T = M.Tmax * tqShape(rpm / M.redline);
        if (wr2 > M.redline * 1.01) T = 0;
        F = T * gr2 * eff / M.rw * thr;
        if (this.shiftT > 0) F *= 0.15;
        // engine braking
        F -= (1 - thr) * M.Tmax * 0.22 * clamp(wr2 / M.redline, 0, 1) * gr2 / M.rw * Math.sign(vl);
        this.rpmTarget = rpm;
      } else {
        const gr = 3.3 * M.final;
        const wr = Math.max(0, -vl) / M.rw * gr * 9.5493;
        const rpm = Math.max(wr, M.idle + 2500 * thr);
        F = -M.Tmax * 0.8 * gr * eff / M.rw * thr * (vl < -8 ? 0 : 1);
        this.rpmTarget = rpm;
      }
      if (this.shiftT > 0) this.shiftT -= dt;
      if (this.locked) this.rpmTarget = M.idle + (M.redline * 0.88 - M.idle) * this.inThr;

      // drive split
      let FxF = 0, FxR = 0;
      // slip-based traction control (assist): back off drive while the rear slides under power
      if (A.tcGain > 0 && F > 0 && vl > 4) {
        const ff = M.drive === 'FF';
        const ex = (ff ? this.slipF : this.slipR) - A.tcSlip - (ff ? 0.04 : 0.2) * this.drift;
        if (ex > 0) F *= clamp(1 - ex * A.tcGain, 0.3, 1);
      }
      if (M.drive === 'FF') FxF = F; else if (M.drive === 'AWD') { FxF = F * 0.4; FxR = F * 0.6; } else FxR = F;
      // traction control (assist): cap drive at tc * available
      const maxF = muF * Nf, maxR = muR * Nr;
      if (A.tc < 1.5) {
        if (Math.abs(FxR) > maxR * A.tc) FxR = Math.sign(FxR) * maxR * A.tc;
        if (Math.abs(FxF) > maxF * A.tc) FxF = Math.sign(FxF) * maxF * A.tc;
      }
      // brakes
      if (brk > 0 && Math.abs(vl) > 0.01) {
        const sgn = vl > 0 ? 1 : -1;
        const cap = Math.abs(vl) * m / dt;
        const fb = Math.min(brk * M.brake * m, cap);
        FxF -= sgn * fb * 0.64; FxR -= sgn * fb * 0.36;
      }
      // handbrake
      const hb = this.locked ? 1 : this.inHand;
      if (hb > 0 && Math.abs(vl) > 0.05) {
        const cap = Math.abs(vl) * m / dt * 0.5;
        FxR -= Math.sign(vl) * Math.min(maxR * 0.75 * hb, cap);
      }
      // traction limits
      let spinR = 0, spinF = 0;
      if (Math.abs(FxR) > maxR) { spinR = Math.abs(FxR) / maxR - 1; FxR = Math.sign(FxR) * maxR; }
      if (Math.abs(FxF) > maxF) { spinF = Math.abs(FxF) / maxF - 1; FxF = Math.sign(FxF) * maxF; }
      this.spin = Math.max(spinR, spinF) * (thr > 0.2 ? 1 : 0);
      this.lock = (brk > 0.7 || hb > 0.5) && Math.abs(vl) > 4 ? 1 : 0;

      // --- lateral tire forces ---
      const vtf = vt + this.w * M.a, vtr = vt - this.w * M.b;
      const cd = Math.cos(delta), sd = Math.sin(delta);
      const vfx = vl * cd + vtf * sd, vfy = -vl * sd + vtf * cd;
      const aF = Math.atan2(vfy, Math.abs(vfx) + 0.6);
      const aR = Math.atan2(vtr, Math.abs(vl) + 0.6);
      const kc = 0.7;
      let capF = Math.sqrt(Math.max(0.08 * maxF * maxF, maxF * maxF - kc * FxF * FxF));
      let capR = Math.sqrt(Math.max(0.08 * maxR * maxR, maxR * maxR - kc * FxR * FxR));
      if (spinR > 0) capR /= (1 + spinR * 1.2);
      if (spinF > 0) capF /= (1 + spinF * 1.2);
      if (hb > 0) capR *= (1 - 0.55 * hb);
      let FyF = -capF * (this.isPlayer ? tireFP(aF) : tireF(aF));
      let FyR = -capR * tireR(aR);
      const mf = m * M.b / L, mr = m * M.a / L;
      const cF = Math.abs(vfy) * mf / dt, cR = Math.abs(vtr) * mr / dt;
      FyF = clamp(FyF, -cF, cF); FyR = clamp(FyR, -cR, cR);
      this.slipF = Math.abs(aF); this.slipR = Math.abs(aR);
      this.latR = Math.abs(vtr);

      // --- body forces ---
      const FfxB = FxF * cd - FyF * sd, FfyB = FxF * sd + FyF * cd;
      let Fx = FfxB + FxR, Fy = FfyB + FyR;
      let Tz = M.a * FfyB - M.b * FyR;
      // aero + rolling
      Fx -= M.cDrag * vl * spd; Fy -= M.cDrag * 1.6 * vt * spd;
      Fx -= (0.013 * m * G) * Math.tanh(vl * 1.5) + 5 * vl;
      // surface drag per wheel
      for (let k = 0; k < 4; k++) {
        const S = SURF[this.ws[k]];
        if (S.c0 === 0 && S.c1 === 0) continue;
        const rx = wpos[k][0], rz = wpos[k][1];
        const wvx = vl - this.w * rz, wvz = vt + this.w * rx;
        const wv = Math.hypot(wvx, wvz);
        if (wv < 0.05) continue;
        const dec = (S.c0 * Math.min(1, wv / 3) + S.c1 * wv) * m * 0.25;
        const fx = -wvx / wv * dec, fz = -wvz / wv * dec;
        Fx += fx; Fy += fz; Tz += rx * fz - rz * fx;
      }
      // arcade drift grip: while sliding, the path bends toward where the nose points
      if (this.drift > 0.01 && spd > 4) {
        const sb = vt / spd, cb = vl / spd;
        const bAbs = Math.abs(Math.asin(clamp(sb, -1, 1)));
        const g = -Math.sign(sb) * Math.min(1, bAbs / 0.2);
        const aAl = DRIFT_GRIP * G * this.drift * (M.driftGrip || 1) * Math.min(1, spd / 12);
        Fx += m * aAl * g * (-sb);
        Fy += m * aAl * g * cb;
      }
      // yaw damping assist
      Tz -= A.yawD * this.I * this.w * 0.6;

      // --- integrate ---
      const ax = (Fx * ch - Fy * sh) / m, az = (Fx * sh + Fy * ch) / m;
      this.vx += ax * dt; this.vz += az * dt;
      this.w += Tz / this.I * dt;
      // spin guard
      if (spd > 5) {
        const ab = Math.abs(beta);
        if (ab > A.spin && this.w * beta < 0) {
          const ex = Math.min(1, (ab - A.spin) / 0.25);
          this.w *= Math.max(0, 1 - ex * 16 * dt);
        }
      }
      this.x += this.vx * dt; this.z += this.vz * dt; this.h += this.w * dt;
      this.axF += (Fx / m - this.axF) * Math.min(1, dt * 7);
      // standstill
      if (spd < 0.08 && thr < 0.05 && Math.abs(F) < 1) { this.vx *= 0.8; this.vz *= 0.8; this.w *= 0.8; }
      this.vl = vl; this.vt = vt;
      // rpm smoothing (for sound / HUD)
      const rt = this.rpmTarget + (this.spin > 0.05 ? Math.min(2500, this.spin * 5000) : 0);
      this.rpm += (Math.min(M.redline * 1.02, rt) - this.rpm) * Math.min(1, dt * 14);
    }
  }

  /* ---------------------------------------------------------------------
     COLLISIONS
     --------------------------------------------------------------------- */
  const _q = {};
  // Damage: overall 0..1 plus zones (0 front, 1 rear, 2 left = -z, 3 right = +z). lx/lz = local impact point
  // (x forward, z to the right); without a point the hit is spread over the whole car (hard landing).
  function applyDamage(c, amt, lx, lz) {
    if (!c.dmgMode || !(amt > 0)) return;
    c.dmg = Math.min(1, c.dmg + amt);
    if (lx == null) { for (let k = 0; k < 4; k++) c.dz[k] = Math.min(1, c.dz[k] + amt * 0.6); c.roofDmg = Math.max(c.roofDmg, clamp((c.dmg - 0.4) / 0.55, 0, 1)); return; }
    const hl = c.m.len * 0.5, hw = c.m.wid * 0.5;
    const zone = Math.abs(lx) / hl >= Math.abs(lz) / hw ? (lx >= 0 ? 0 : 1) : (lz < 0 ? 2 : 3);
    c.dz[zone] = Math.min(1, c.dz[zone] + amt * 1.7);
    if (c.dents.length < 24) c.dents.push({ lx, lz, amt });
    // corner damage (FL, FR, RL, RR): a solid hit on a corner breaks that corner's light
    const kx = [hl, hl, -hl, -hl], kz = [-hw, hw, -hw, hw];
    for (let k = 0; k < 4; k++) { const wg = Math.max(0, 1 - Math.hypot(lx - kx[k], lz - kz[k]) / 1.6); c.cd[k] = Math.min(1, c.cd[k] + amt * wg * 1.8); if (c.cd[k] >= 0.16) c.lightOut[k] = 1; }
    // windows shatter when their side of the car is badly hit (all of them in a total wreck); the roof sags as the car gets battered
    const WIN = [0.55, 0.55, 0.42, 0.42];
    for (let k = 0; k < 4; k++) if (!c.winOut[k] && (c.dz[k] >= WIN[k] || c.dmg >= 0.92)) c.winOut[k] = 1;
    c.roofDmg = Math.max(c.roofDmg, clamp((c.dmg - 0.4) / 0.55, 0, 1));
    // body parts come off once their area is damaged enough
    for (const name in PARTS) {
      if (c.lost[name]) continue;
      const P = PARTS[name];
      if (c.dz[P.z] >= P.th || (P.corner != null && c.cd[P.corner] >= 0.55)) { c.lost[name] = 1; c.detach.push(name); }
    }
  }
  // detachable parts: damage zone + threshold, mass (kg), collision radius, thickness, local position (fraction of half length/width), height
  const PARTS = {
    mirrorL: { z: 2, th: 0.35, m: 1, r: 0.2, h: 0.1, lx: 0.15, lz: -1.12, y: 0.95 },
    mirrorR: { z: 3, th: 0.35, m: 1, r: 0.2, h: 0.1, lx: 0.15, lz: 1.12, y: 0.95 },
    bumperF: { z: 0, th: 0.5, m: 7, r: 0.75, h: 0.16, lx: 1.0, lz: 0, y: 0.4 },
    bumperR: { z: 1, th: 0.5, m: 7, r: 0.75, h: 0.16, lx: -1.0, lz: 0, y: 0.4 },
    fenderL: { z: 2, th: 0.6, m: 5, r: 0.55, h: 0.06, lx: 0.55, lz: -1.0, y: 0.55, corner: 0 },
    fenderR: { z: 3, th: 0.6, m: 5, r: 0.55, h: 0.06, lx: 0.55, lz: 1.0, y: 0.55, corner: 1 },
    hood:    { z: 0, th: 0.78, m: 14, r: 0.8, h: 0.07, lx: 0.62, lz: 0, y: 0.9 },
    trunk:   { z: 1, th: 0.78, m: 11, r: 0.7, h: 0.07, lx: -0.7, lz: 0, y: 0.9 },
  };

  // ---- debris lying on the road: flies off, tumbles, slides, rests; cars hitting it knock it away ----
  const relaxAng = (a, dt) => { const t = Math.round(a / Math.PI) * Math.PI; return a + (t - a) * Math.min(1, dt * 8); };
  // open road: how far a point (radius r) is past the wall at an end of the road (0.5 m in from the last sample); _en = inward normal
  const _en = [0, 0];
  function endPen(T, q, r) {
    const sl = q.s + (q.over || 0);
    if (sl < 0.5 + r) { _en[0] = T.tx[0]; _en[1] = T.tz[0]; return 0.5 + r - sl; }
    const e = T.len - 0.5 - r;
    if (sl > e) { _en[0] = -T.tx[T.N - 1]; _en[1] = -T.tz[T.N - 1]; return sl - e; }
    return 0;
  }
  function stepDebris(d, T, dt) {
    if (d.rest) return;
    d.vy -= JUMP_G * dt;
    d.x += d.vx * dt; d.y += d.vy * dt; d.z += d.vz * dt;
    d.q = T.query(d.x, d.z, d.q ? d.q.i : -1, d.q || {});
    const gy = (T.hasElev ? T.elevAt(d.q.s).y : 0) + d.h * 0.5 + 0.02;
    const lim = (d.q.d > 0 ? d.q.br : d.q.bl) - d.r * 0.5;       // bounce off the barriers
    if (Math.abs(d.q.d) > lim) {
      const sg = Math.sign(d.q.d), nx = d.q.nx * sg, nz = d.q.nz * sg, pen = Math.abs(d.q.d) - lim;
      d.x -= nx * pen; d.z -= nz * pen;
      const vn = d.vx * nx + d.vz * nz; if (vn > 0) { d.vx -= 1.4 * vn * nx; d.vz -= 1.4 * vn * nz; }
    }
    if (T.open) { const pen = endPen(T, d.q, d.r * 0.5); if (pen > 0) { const nx = _en[0], nz = _en[1]; d.x += nx * pen; d.z += nz * pen; const vn = d.vx * nx + d.vz * nz; if (vn < 0) { d.vx -= 1.4 * vn * nx; d.vz -= 1.4 * vn * nz; } } }   // ... and the end walls
    if (d.y <= gy) {
      d.y = gy;
      if (d.vy < -2.5) { d.vy = -d.vy * 0.28; d.wx *= 0.6; d.wz *= 0.6; } else { d.vy = 0; d.ground = true; }
    } else d.ground = false;
    if (d.ground) {
      const sp = Math.hypot(d.vx, d.vz), dec = 6.5 * dt;          // sliding on the road (~0.65 g)
      if (sp <= dec) { d.vx = d.vz = 0; } else { d.vx -= d.vx / sp * dec; d.vz -= d.vz / sp * dec; }
      d.wy *= Math.max(0, 1 - 4 * dt); d.wx = d.wz = 0;
      d.rx = relaxAng(d.rx, dt); d.rz = relaxAng(d.rz, dt);        // settles flat (right way up or upside down)
      if (sp < 0.05 && Math.abs(d.wy) < 0.05) d.rest = true;
    } else { d.rx += d.wx * dt; d.rz += d.wz * dt; }
    d.yaw += d.wy * dt;
  }
  function debrisHit(c, d) {
    const dx = d.x - c.x, dz = d.z - c.z;
    if (dx * dx + dz * dz > 16 || d.y - (c.y || 0) > 1.3) return;
    const ch = Math.cos(c.h), sh = Math.sin(c.h);
    for (let i = 0; i < 3; i++) {
      const ax = c.x + ch * c.circles[i], az = c.z + sh * c.circles[i];
      const ex = d.x - ax, ez = d.z - az, r = c.rad + d.r * 0.7, e2 = ex * ex + ez * ez;
      if (e2 >= r * r) continue;
      const e = Math.sqrt(e2) || 0.01, nx = ex / e, nz = ez / e;
      d.x += nx * (r - e); d.z += nz * (r - e);
      const vrel = (c.vx - d.vx) * nx + (c.vz - d.vz) * nz;      // closing speed
      if (vrel > 0.3) {
        const kick = Math.min(24, 1.35 * vrel);
        d.vx += kick * nx; d.vz += kick * nz; d.vy = Math.max(d.vy, 1 + Math.min(4, vrel * 0.18));
        d.wy += (Math.random() - 0.5) * 10; d.wx += (Math.random() - 0.5) * 8; d.rest = false; d.ground = false;
        const k = Math.min(0.06, d.m * 0.004);                       // the car feels it: speed loss + twitch, more for big parts
        c.vx *= 1 - k; c.vz *= 1 - k; c.w += (Math.random() - 0.5) * d.m * 0.05;
        c.hitDebris = Math.max(c.hitDebris || 0, vrel * Math.min(1, d.m / 8));
      }
      break;
    }
  }

  /* ---- loose trackside props: traffic cones, striped marker pylons, spare-tyre stacks, straw bales, crates, roadside posts ----
     Little rigid bodies with point contacts. They sleep until a car (or another flying prop) knocks them, then fly,
     tumble, bounce off the barriers and settle wherever they land. Tyre and bale stacks burst into single tyres / bales. */
  const PROP_G = 13;
  const PIT_V = 22.2, _pq2 = {};   // pit lane speed limit: 80 km/h
  const PROPK = (() => {
    const cylPts = (r, y0, y1, n) => { const p = []; for (const y of [y0, y1]) for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2; p.push([Math.cos(a) * r, y, Math.sin(a) * r]); } return p; };
    const boxPts = (x, y, z) => { const p = []; for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) p.push([sx * x, sy * y, sz * z]); return p; };
    const conePts = cylPts(0.3, -0.17, -0.17, 6).slice(0, 6); conePts.push([0, 0.59, 0]);
    return {   // m mass (kg), rh horizontal radius, rb bounding radius, h0 centre height when standing, e bounce, mu friction, lift pop-up when hit, I inertia
      cone:   { m: 3,  rh: 0.28, rb: 0.42, h0: 0.17,  e: 0.3,  mu: 0.75, lift: 0.6,  I: 0.22, pts: conePts },
      pylon:  { m: 7,  rh: 0.36, rb: 0.7,  h0: 0.68,  e: 0.25, mu: 0.55, lift: 0.4,  I: 1.3,  pts: cylPts(0.36, -0.68, 0.68, 6) },
      tyre:   { m: 9,  rh: 0.43, rb: 0.45, h0: 0.13,  e: 0.45, mu: 0.7,  lift: 0.45, I: 0.7,  pts: cylPts(0.43, -0.13, 0.13, 8) },
      bale:   { m: 26, rh: 0.62, rb: 0.75, h0: 0.425, e: 0.12, mu: 0.9,  lift: 0.3,  I: 5.2,  pts: boxPts(0.65, 0.425, 0.45) },
      crate:  { m: 18, rh: 0.5,  rb: 0.62, h0: 0.4,   e: 0.2,  mu: 0.7,  lift: 0.35, I: 2.6,  pts: boxPts(0.5, 0.4, 0.4) },
      tstack: { m: 27, rh: 0.43, rb: 0.55, h0: 0.39,  breaks: 'tyre', parts: [[0, -0.26, 0], [0, 0, 0], [0, 0.26, 0]], pf: [[1.25, 1.0], [1.1, 2.2], [0.85, 3.4]] },
      bstack: { m: 78, rh: 0.9,  rb: 1.1,  h0: 0.85,  breaks: 'bale', parts: [[-0.66, -0.425, 0], [0.66, -0.425, 0], [0, 0.425, 0]], pf: [[1.1, 0.6], [1.0, 0.9], [0.8, 2.4]] },
      post:   { m: 4,  rh: 0.14, rb: 0.62, h0: 0.55,  e: 0.3,  mu: 0.6,  lift: 1.0,  I: 0.4,  pts: boxPts(0.07, 0.55, 0.07) },   // roadside post (stebriček): light, snaps over and cartwheels away
    };
  })();
  const _pq = {};
  const qRot = (b, px, py, pz, out) => {   // rotate a local point by the body's quaternion
    const tx = 2 * (b.qy * pz - b.qz * py), ty = 2 * (b.qz * px - b.qx * pz), tz = 2 * (b.qx * py - b.qy * px);
    out[0] = px + b.qw * tx + (b.qy * tz - b.qz * ty); out[1] = py + b.qw * ty + (b.qz * tx - b.qx * tz); out[2] = pz + b.qw * tz + (b.qx * ty - b.qy * tx); return out;
  };
  const _r3 = [0, 0, 0];
  function mkProp(kind, x, y, z, yaw) {
    const a = -(yaw || 0) / 2;   // local +x along the heading yaw (the car convention: forward = (cos h, sin h))
    return { kind, K: PROPK[kind], x, y, z, vx: 0, vy: 0, vz: 0, qx: 0, qy: Math.sin(a), qz: 0, qw: Math.cos(a), wx: 0, wy: 0, wz: 0,
      sleep: true, hidden: false, dead: false, dirty: true, slot: -1, qi: -1, bk: -1, t: 0, age: 0, col: 0, parts: null, fy: NaN };   // (fy: the floor under it last step)
  }
  function propImpulse(b, jx, jy, jz, rx, ry, rz) {
    const K = b.K; b.vx += jx / K.m; b.vy += jy / K.m; b.vz += jz / K.m;
    b.wx += (ry * jz - rz * jy) / K.I; b.wy += (rz * jx - rx * jz) / K.I; b.wz += (rx * jy - ry * jx) / K.I;
  }
  function propFeel(c, m, vrel, kind) {   // what the driver feels: a little speed and a twitch, a thump
    const k = Math.min(0.045, m * 0.0016) * Math.min(1, vrel / 8);
    c.vx *= 1 - k; c.vz *= 1 - k; c.w += (Math.random() - 0.5) * m * 0.012;
    c.hitDebris = Math.max(c.hitDebris || 0, vrel * clamp(m / 30, 0.12, 0.35));
    if (vrel > 4) { c.propKnock = kind; c.propKnockV = vrel; }
    if (vrel > 1.5 && (!c.propSnd || vrel > c.propSndV)) { c.propSnd = kind; c.propSndV = vrel; }
  }
  function propCarHit(race, c, b) {
    const K = b.K, dx = b.x - c.x, dz = b.z - c.z;
    if (dx * dx + dz * dz > 20) return;
    const cy = c.y || 0; if (b.y - K.rb > cy + 1.3 || b.y + K.rb < cy + 0.05) return;
    const ch = Math.cos(c.h), sh = Math.sin(c.h);
    for (let i = 0; i < 3; i++) {
      const ax = c.x + ch * c.circles[i], az = c.z + sh * c.circles[i], ex = b.x - ax, ez = b.z - az, r = c.rad + K.rh, e2 = ex * ex + ez * ez;
      if (e2 >= r * r) continue;
      const e = Math.sqrt(e2) || 0.01, nx = ex / e, nz = ez / e;
      const px = b.x - nx * K.rh, pz = b.z - nz * K.rh, rcx = px - c.x, rcz = pz - c.z;
      const vcx = c.vx - c.w * rcz, vcz = c.vz + c.w * rcx, vrel = (vcx - b.vx) * nx + (vcz - b.vz) * nz;   // closing speed at the contact
      b.x += nx * (r - e); b.z += nz * (r - e); b.dirty = true;                                          // the prop gives way
      if (vrel < 0.5) return;
      if (K.breaks) { race.breakProp(b, nx, nz, vrel, c.vx, c.vz); propFeel(c, K.m, vrel, b.kind); return; }
      const rx = -nx * K.rh, rz = -nz * K.rh, ry = clamp(cy + 0.42 - b.y, -K.rb * 0.8, K.rb * 0.8);          // hit at bumper height: it topples away
      const ax2 = ry * nz, ay2 = rz * nx - rx * nz, az2 = -ry * nx;
      const j = 1.35 * vrel / (1 / K.m + (ax2 * ax2 + ay2 * ay2 + az2 * az2) / K.I + 1 / c.m.mass);
      b.sleep = false; b.t = 0; b.age = 0;
      propImpulse(b, nx * j, 0, nz * j, rx, ry, rz);
      b.vy = Math.min(7.5, b.vy + Math.min(5, vrel * K.lift * 0.22)); b.wy += (Math.random() - 0.5) * Math.min(10, vrel * 0.5);
      const hs = Math.hypot(b.vx, b.vz), cap = Math.min(18, 0.72 * Math.hypot(c.vx, c.vz) + 2); if (hs > cap) { b.vx *= cap / hs; b.vz *= cap / hs; }
      race.propFx(b, vrel);
      const wl = Math.hypot(b.wx, b.wy, b.wz); if (wl > 14) { b.wx *= 14 / wl; b.wy *= 14 / wl; b.wz *= 14 / wl; }
      propFeel(c, K.m, vrel, b.kind);
      return;
    }
  }
  function propPair(race, a, b) {   // a is awake; b may be asleep (a flying tyre can knock over a cone or burst a stack)
    const Ka = a.K, Kb = b.K, dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, r = (Ka.rb + Kb.rb) * 0.68, d2 = dx * dx + dy * dy + dz * dz;
    if (d2 >= r * r) return;
    const d = Math.sqrt(d2) || 0.01, nx = dx / d, ny = dy / d, nz = dz / d, pen = r - d;
    const vr = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny + (a.vz - b.vz) * nz;
    if (Kb.breaks && vr > 3) { race.breakProp(b, nx, nz, vr * 0.7, a.vx, a.vz); return; }
    const movable = !b.sleep || vr > 0.8, ia = 1 / Ka.m, ib = movable && !Kb.breaks ? 1 / Kb.m : 0, it = ia + ib;
    a.x -= nx * pen * ia / it; a.y -= ny * pen * ia / it; a.z -= nz * pen * ia / it;
    if (ib) { b.x += nx * pen * ib / it; b.y += ny * pen * ib / it; b.z += nz * pen * ib / it; b.dirty = true; }
    if (vr > 0) {
      const j = 1.15 * vr / it; a.vx -= j * nx * ia; a.vy -= j * ny * ia; a.vz -= j * nz * ia;
      if (ib) { b.vx += j * nx * ib; b.vy += j * ny * ib; b.vz += j * nz * ib; if (b.sleep) { b.sleep = false; b.t = 0; b.age = 0; b.wy += (Math.random() - 0.5) * 3; } }
    }
  }
  function propStep(race, b, T, dt) {
    const K = b.K;
    b.age += dt; b.vy -= PROP_G * dt;
    const x0 = b.x, z0 = b.z;
    b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
    const h = 0.5 * dt, qx = b.qx, qy = b.qy, qz = b.qz, qw = b.qw, wx = b.wx, wy = b.wy, wz = b.wz;   // orientation (world-frame angular velocity)
    b.qx = qx + h * (wx * qw + wy * qz - wz * qy); b.qy = qy + h * (wy * qw + wz * qx - wx * qz);
    b.qz = qz + h * (wz * qw + wx * qy - wy * qx); b.qw = qw - h * (wx * qx + wy * qy + wz * qz);
    const ql = Math.hypot(b.qx, b.qy, b.qz, b.qw) || 1; b.qx /= ql; b.qy /= ql; b.qz /= ql; b.qw /= ql;
    const F = race.propFloor; let q = T.query(b.x, b.z, b.qi, _pq), gy = (T.hasElev ? T.elevAt(q.s).y : 0) + (F ? F(q) : 0);   // (the verge may lie below the road)
    if (gy - b.fy > 0.45) {   // the floor rose by more than 0.45 m since the last step and the prop is that far below it: a face (a deck's end, a planter, the
      let lo = 1e9; for (const p of K.pts) { const r = qRot(b, p[0], p[1], p[2], _r3)[1]; if (r < lo) lo = r; }   // side of a pit), not a slope: it bounces off
      if (gy - (b.y + lo) > 0.45) { b.x = x0; b.z = z0; b.vx *= -0.3; b.vz *= -0.3; q = T.query(b.x, b.z, b.qi, _pq); gy = (T.hasElev ? T.elevAt(q.s).y : 0) + (F ? F(q) : 0); }
    }
    b.fy = gy; b.qi = q.i; race._bkMove(b);
    const lim = (q.d > 0 ? q.br : q.bl) - K.rh - (F && F.inset ? F.inset[q.i * 2 + (q.d > 0 ? 1 : 0)] : 0);   // barriers (with the catch fences above them; F.inset: solid scenery in front of them)
    if (Math.abs(q.d) > lim && b.y - gy < 3.2) {
      const sg = Math.sign(q.d), nx = q.nx * sg, nz = q.nz * sg, pen = Math.abs(q.d) - lim;
      b.x -= nx * pen; b.z -= nz * pen;
      const vn = b.vx * nx + b.vz * nz; if (vn > 0) { b.vx -= 1.35 * vn * nx; b.vz -= 1.35 * vn * nz; b.wy += (Math.random() - 0.5) * vn; }
    }
    if (T.open && b.y - gy < 3.2) { const pen = endPen(T, q, K.rh); if (pen > 0) { const nx = _en[0], nz = _en[1]; b.x += nx * pen; b.z += nz * pen; const vn = b.vx * nx + b.vz * nz; if (vn < 0) { b.vx -= 1.35 * vn * nx; b.vz -= 1.35 * vn * nz; } } }   // open road: the end walls
    let touch = false, maxPen = 0;                                                  // ground: impulses at every contact point below it
    for (const p of K.pts) {
      const rr = qRot(b, p[0], p[1], p[2], _r3), rx = rr[0], ry = rr[1], rz = rr[2], pen = gy - (b.y + ry);
      if (pen <= 0) continue;
      touch = true; if (pen > maxPen) maxPen = pen;
      const vpy = b.vy + b.wz * rx - b.wx * rz;
      if (vpy >= 0) continue;
      const j = -(1 + (vpy < -2 ? K.e : 0)) * vpy / (1 / K.m + (rx * rx + rz * rz) / K.I);
      propImpulse(b, 0, j, 0, rx, ry, rz);
      const vpx = b.vx + b.wy * rz - b.wz * ry, vpz = b.vz + b.wx * ry - b.wy * rx, vt = Math.hypot(vpx, vpz);
      if (vt > 1e-4) {
        const tx = vpx / vt, tz = vpz / vt, ax = ry * tz, ay = rz * tx - rx * tz, az = -ry * tx;
        const jt = Math.min(K.mu * j, vt / (1 / K.m + (ax * ax + ay * ay + az * az) / K.I));
        propImpulse(b, -tx * jt, 0, -tz * jt, rx, ry, rz);
      }
    }
    if (maxPen > 0) b.y += maxPen;
    if (b.vy > 8) b.vy = 8;                                                          // no trampoline bounces off a spinning edge
    if (touch) { const k = Math.max(0, 1 - 2.2 * dt), kv = Math.max(0, 1 - 1.4 * dt); b.wx *= k; b.wy *= k; b.wz *= k; b.vx *= kv; b.vz *= kv; }   // rolling resistance, scuffing
    else { const kv = Math.max(0, 1 - 0.25 * dt); b.vx *= kv; b.vz *= kv; }          // a little air drag
    const arr = race.propBk, nb = arr.length;
    for (let o = -1; o <= 1; o++) { const L = arr[(b.bk + o + nb) % nb]; for (let n = L.length - 1; n >= 0; n--) { const c = L[n]; if (c !== b && !c.dead) propPair(race, b, c); } }
    const v2 = b.vx * b.vx + b.vy * b.vy + b.vz * b.vz, w2 = b.wx * b.wx + b.wy * b.wy + b.wz * b.wz;
    if (touch && v2 < 0.05 && w2 < 0.2) b.t += dt; else b.t = 0;
    if (b.t > 0.35 || (b.age > 20 && v2 < 1)) { b.sleep = true; b.vx = b.vy = b.vz = b.wx = b.wy = b.wz = 0; b.t = 0; }
    if (!Number.isFinite(b.x + b.y + b.z + b.qw + b.vx + b.vz) || b.y < gy - 6) {   // safety: put it back upright beside the road
      const i = q.i >= 0 ? q.i : 0; b.x = T.px[i]; b.z = T.pz[i]; b.y = gy + K.h0; b.qx = b.qz = 0; b.qy = 0; b.qw = 1; b.vx = b.vy = b.vz = b.wx = b.wy = b.wz = 0; b.sleep = true;
    }
    b.dirty = true;
  }

  function wallCollide(c, trk) {
    const ch = Math.cos(c.h), sh = Math.sin(c.h);
    let hit = 0, hitK = 0, hnx = 0, hnz = 0;
    for (let k = 0; k < 4; k++) {
      const rx = c.corners[k][0], rz = c.corners[k][1];
      const wx = rx * ch - rz * sh, wz = rx * sh + rz * ch; // world offset
      const px = c.x + wx, pz = c.z + wz;
      const q = trk.query(px, pz, c.q.i, _q);
      let pen = 0, nx = 0, nz = 0, br = q.br, inner = -1e9;
      if (c.isPlayer && trk.def.pit) { const pz2 = trk.pitAt(q.s); if (pz2) { if (pz2.gap) br = Math.max(br, pz2.lout); else if (c.inPit) { inner = pz2.inner; br = pz2.lout; } } }   // in the pit lane: between the pit wall (the kerb in front of the stands) and the lane's outer edge
      if (q.d > br) { pen = q.d - br; nx = -q.nx; nz = -q.nz; }
      else if (q.d < inner) { pen = inner - q.d; nx = q.nx; nz = q.nz; }
      else if (q.d < -q.bl) { pen = -q.bl - q.d; nx = q.nx; nz = q.nz; }
      if (trk.open) {   // open road: the two ends of the road are walls 0.5 m in from the last samples
        const sl = q.s + (q.over || 0), N = trk.N;
        if (sl < 0.5 && 0.5 - sl > pen) { pen = 0.5 - sl; nx = trk.tx[0]; nz = trk.tz[0]; }
        else if (sl > trk.len - 0.5 && sl - (trk.len - 0.5) > pen) { pen = sl - (trk.len - 0.5); nx = -trk.tx[N - 1]; nz = -trk.tz[N - 1]; }
      }
      if (pen <= 0) continue;
      c.wallX = px; c.wallZ = pz;
      // positional correction
      c.x += nx * pen; c.z += nz * pen;
      // corner velocity
      const vcx = c.vx - c.w * wz, vcz = c.vz + c.w * wx;
      const vn = vcx * nx + vcz * nz;
      if (vn < 0) {
        const rn = wx * nz - wz * nx;
        const e = c.phys === 'cs' ? CSK.wallE : 0.25, wy = c.phys === 'cs' ? CSK.wallYaw : 1;
        const J = -(1 + e) * vn / (1 / c.m.mass + rn * rn / c.I * wy);
        c.vx += J * nx / c.m.mass; c.vz += J * nz / c.m.mass;
        c.w += rn * J / c.I * wy;
        // friction along wall
        const tx = -nz, tz = nx;
        const vtan = (c.vx - c.w * wz) * tx + (c.vz + c.w * wx) * tz;
        const rt = wx * tz - wz * tx;
        let Jt = -vtan / (1 / c.m.mass + rt * rt / c.I * wy);
        const mu = c.phys === 'cs' ? CSK.wallMu : 0.35;
        Jt = clamp(Jt, -mu * J, mu * J);
        c.vx += Jt * tx / c.m.mass; c.vz += Jt * tz / c.m.mass;
        c.w += rt * Jt / c.I * wy;
        if (-vn > hit) { hit = -vn; hitK = k; hnx = nx; hnz = nz; }
      }
    }
    if (hit > 0) { c.hitWall = Math.max(c.hitWall, hit); c.fxWall = Math.max(c.fxWall || 0, hit); }
    if (hit > 2.5) {   // 36 km/h into the wall ≈ 21 %; which face hit follows from the wall direction seen from the car
      const fx = -(hnx * ch + hnz * sh), fz = -(-hnx * sh + hnz * ch), cx = c.corners[hitK][0], cz = c.corners[hitK][1];
      const side = Math.abs(fz) > Math.abs(fx) * 0.9;
      applyDamage(c, (hit - 2.5) * 0.028, side ? cx * 0.45 : Math.sign(fx || cx) * Math.abs(cx) * 0.95, side ? Math.sign(fz) * Math.abs(cz) * 0.95 : cz * 0.6);
    }
    return hit;
  }

  function carCollide(a, b) {
    const dx0 = b.x - a.x, dz0 = b.z - a.z;
    if (dx0 * dx0 + dz0 * dz0 > 49) return 0;
    const cha = Math.cos(a.h), sha = Math.sin(a.h), chb = Math.cos(b.h), shb = Math.sin(b.h);
    let best = 0, bnx = 0, bnz = 0, bpx = 0, bpz = 0;
    for (let i = 0; i < 3; i++) {
      const ax = a.x + cha * a.circles[i], az = a.z + sha * a.circles[i];
      for (let j = 0; j < 3; j++) {
        const bx = b.x + chb * b.circles[j], bz = b.z + shb * b.circles[j];
        const dx = ax - bx, dz = az - bz; const d2 = dx * dx + dz * dz;
        const r = a.rad + b.rad;
        if (d2 < r * r) {
          const d = Math.sqrt(d2) || 0.001; const pen = r - d;
          if (pen > best) { best = pen; bnx = dx / d; bnz = dz / d; bpx = (ax + bx) * 0.5; bpz = (az + bz) * 0.5; }
        }
      }
    }
    if (best <= 0) return 0;
    const ma = a.m.mass, mb = b.m.mass, ia = 1 / ma, ib = 1 / mb;
    // separate
    const tot = ia + ib;
    a.x += bnx * best * ia / tot; a.z += bnz * best * ia / tot;
    b.x -= bnx * best * ib / tot; b.z -= bnz * best * ib / tot;
    // impulse (normal points from b to a)
    const rax = bpx - a.x, raz = bpz - a.z, rbx = bpx - b.x, rbz = bpz - b.z;
    const vax = a.vx - a.w * raz, vaz = a.vz + a.w * rax;
    const vbx = b.vx - b.w * rbz, vbz = b.vz + b.w * rbx;
    const vrel = (vax - vbx) * bnx + (vaz - vbz) * bnz;
    if (vrel >= 0) return 0;
    const rna = rax * bnz - raz * bnx, rnb = rbx * bnz - rbz * bnx;
    const csc = a.phys === 'cs' && b.phys === 'cs', e = csc ? CSK.carE : 0.3, ka = csc ? 0 : 0.6;
    // angular terms damped to keep contact spins moderate
    const J = -(1 + e) * vrel / (ia + ib + rna * rna / a.I * 0.6 + rnb * rnb / b.I * 0.6);
    a.vx += J * bnx * ia; a.vz += J * bnz * ia; a.w += rna * J / a.I * ka;
    b.vx -= J * bnx * ib; b.vz -= J * bnz * ib; b.w -= rnb * J / b.I * ka;
    if (csc) { if (!a.air) a.csKc = clamp(a.csKc + rna * J / a.I * CSK.tapT, -CSK.tapMax, CSK.tapMax); if (!b.air) b.csKc = clamp(b.csKc - rnb * J / b.I * CSK.tapT, -CSK.tapMax, CSK.tapMax); }   // cs: a tap swings the tail, the car catches itself
    const imp = -vrel;
    a.hitCar = Math.max(a.hitCar, imp); b.hitCar = Math.max(b.hitCar, imp);
    if (imp > 3.5) for (const c of [a, b]) { const dx = bpx - c.x, dz = bpz - c.z, ch = Math.cos(c.h), sh = Math.sin(c.h); applyDamage(c, (imp - 3.5) * 0.016, dx * ch + dz * sh, -dx * sh + dz * ch); }
    a.fxCar = Math.max(a.fxCar || 0, imp); b.fxCar = Math.max(b.fxCar || 0, imp);
    a.contactX = b.contactX = bpx; a.contactZ = b.contactZ = bpz;
    return imp;
  }

  /* ---------------------------------------------------------------------
     AI
     --------------------------------------------------------------------- */
  function aiControl(c, race, dt) {
    const T = race.track, M = c.m, A = c.assist;
    const q = c.q;
    const v = Math.max(0, c.vl);
    const N = T.N;
    // --- avoidance / overtaking ---
    c.aiT -= dt;
    if (c.aiT <= 0) {
      c.aiT = 0.12 + Math.random() * 0.08;
      let target = c.laneBias;
      let threat = null, tgap = 1e9;
      for (const o of race.cars) {
        if (o === c) continue;
        let gap = o.dist - c.dist;
        if (gap < -4 || gap > 22) continue;
        const lat = o.q.d - q.d;
        const closing = v - Math.max(0, o.vl);
        if (gap > 0 && Math.abs(lat) < 3.2 && (closing > -1 || gap < 7) && gap < tgap) { threat = o; tgap = gap; }
      }
      c.aiThreat = threat; c.aiGap = tgap;
      if (threat) {
        const rlHere = T.rl[q.i];
        const oPos = threat.q.d;
        // choose side with more room
        const roomL = oPos - (-T.w + 1.2), roomR = (T.w - 1.2) - oPos;
        const side = roomR > roomL ? 1 : -1;
        const want = oPos + side * 3.3;
        target = clamp(want - rlHere, -2 * T.w, 2 * T.w);
        c.passing = 1;
      } else c.passing = 0;
      c.aiOffT = target;
    }
    c.aiOff += clamp(c.aiOffT - c.aiOff, -3.2 * dt, 3.2 * dt);

    // --- steering: pure pursuit on racing line + offset ---
    const look = 5.5 + v * 0.36;
    const sT = q.s + look;
    const fi = sT / T.ds;
    let i0, i1, ft;
    if (T.open) { const f = clamp(fi, 0, N - 1); i0 = Math.min(N - 2, Math.floor(f)); i1 = i0 + 1; ft = f - i0; }   // open road: the look-ahead stops at the end
    else { i0 = ((Math.floor(fi) % N) + N) % N; i1 = (i0 + 1) % N; ft = fi - Math.floor(fi); }
    const rlv = lerp(T.rl[i0], T.rl[i1], ft);
    const lim = T.w - 1.25;
    let off = clamp(rlv + c.aiOff, -lim, lim);
    if (c.pitWant && T.def.pit) { const pz = T.pitAt(sT); if (pz) off = pz.o; }   // (autopilot into the pits: follow the lane)
    const tx = lerp(T.px[i0], T.px[i1], ft) + lerp(T.nx[i0], T.nx[i1], ft) * off;
    const tz = lerp(T.pz[i0], T.pz[i1], ft) + lerp(T.nz[i0], T.nz[i1], ft) * off;
    const hA = c.phys === 'cs' && c.speed > 3 ? Math.atan2(c.vz, c.vx) : c.h;   // cs: the arc starts along the travel, not the nose
    const ch = Math.cos(hA), sh = Math.sin(hA);
    const dx = tx - c.x, dz = tz - c.z;
    const lx = dx * ch + dz * sh, ly = -dx * sh + dz * ch;
    const dist = Math.max(3, Math.hypot(lx, ly));
    const ang = Math.atan2(ly, lx);
    const kap = 2 * Math.sin(ang) / dist;
    let dW = Math.atan(kap * (M.a + M.b));
    // yaw-rate feedback for stability
    dW += 0.06 * (v * kap - c.w);
    const csGain = (c.phys === 'cs' ? 0.15 : A.cs) * clamp((c.vl - 3) / 8, 0, 1);   // ('cs' cars steer by path rate below; this is overridden)
    dW -= csGain * clamp(c.beta, -0.8, 0.8);
    const steerLim = M.steerMax / (1 + v / c.vref);
    c.inSteer = clamp(dW / steerLim, -1, 1);
    if (c.arcade) {
      // needed slide angle for the path curvature, as a fraction of full-lock slide
      const P = c.arc || ARC[M.id] || ARC.kaze;
      const bNeed = v * kap / (P.kv * (c.aeroK ? 1 + c.aeroK * v * v : 1));   // rad (positive = right turn); aero upgrade: less slide for the same turn
      c.inSteer = clamp(bNeed / Math.max(0.08, c.bMaxNow || 0.5) + 0.12 * (v * kap - c.w), -1, 1);
    }
    if (c.phys === 'cs') { const wNeed = v * kap; c.inSteer = clamp((wNeed + CSK.aiKw * (wNeed - c.wPath)) / Math.max(0.05, c.csWcap || 1), -1, 1); }   // steer = share of the path-rate cap

    // --- speed ---
    const sA = q.s + v * 0.22 + 3;
    const ia = T.idx(sA);
    // skill > 1 (hard): faster in the quicker corners and on the brakes, but no faster than the profile through the slowest hairpins,
    // where the cars would only slide wide (tested per car model at the limit)
    const vpA = (c.vprof || race.vprof)[ia], offErr = Math.abs(q.d - (T.rl[q.i] + c.aiOff)), offLine = Math.abs(c.aiOff) > 1.2 || offErr > 1.2;
    let sk = Math.min(c.skill * c.rubber, c.skCap || 1.14);
    if (sk > 1 && offLine) sk = 1 + (sk - 1) * 0.3;   // away from the ideal line (overtaking, defending, knocked aside) the extra pace is not there
    let vT = vpA * (sk <= 1 ? sk : 1 + (sk - 1) * sstep(11, 24, vpA));
    if (c.upgGrip) vT *= Math.pow(c.upgGrip * (1 + c.aeroK * vT * vT), 0.25);   // upgraded tyres / aero: carry more speed through the corners (half the grip gain: safe for every car)
    // if displaced from line, be a little more careful
    if (offErr > 2.5) vT *= 0.94;
    if (c.passing) vT *= 1.01;
    if (c.pitWant && T.def.pit) { const pz = T.pitAt(q.s + v * 0.8 + 6), pn = T.pitAt(q.s); if (pz || c.inPit) vT = Math.min(vT, (pz && pz.t < 0.98) || (pn && pn.t < 0.98) ? 15 : PIT_V * 0.97); }   // (easy through the S of the way in and out)
    { const o = c.aiThreat; if (o && c.aiGap < 9 && Math.abs(o.q.d - q.d) < 2.1) vT = Math.min(vT, Math.max(0, o.vl) + Math.max(0, c.aiGap - 3) * 0.8); }   // right behind someone with no gap yet: follow, don't ram
    let thr = 0, brk = 0;
    if (v < vT - 0.8) thr = 1;
    else if (v < vT + 0.6) thr = 0.45;
    else { thr = 0; brk = clamp((v - vT) / 4.5, 0.15, 1); }
    // don't stamp on the brakes while turning hard or sliding
    if (c.phys === 'cs') brk *= 1 - 0.3 * Math.min(1, Math.abs(c.inSteer));   // cs: trail-braking is stable (the slide is the design)
    else {
      brk *= 1 - 0.55 * Math.min(1, Math.abs(c.inSteer));
      if (Math.abs(c.beta) > 0.22) brk *= 0.55;
    }
    // traction management (tyre-model cars only; SWGP-style cars slide by design)
    const ab = Math.abs(c.beta);
    if (!c.arcade && c.phys !== 'cs' && ab > 0.1 && c.vl > 6) thr *= clamp(1 - (ab - 0.1) * 3.5, 0.25, 1);
    if (c.phys === 'cs' && c.vl > 6) { const ex = ab - Math.abs(c.csAT || 0) - 0.12; if (ex > 0) thr *= clamp(1 - ex * 4, 0.3, 1); }   // cs: ease off only when knocked past the planned slide
    if (c.spin > 0.05) thr *= 0.8;
    // off-track: slow down a bit & aim back
    if (T.open && T.len - q.s < 6 + v * v / 40) { thr = 0; brk = 1; }   // open road: stop (and stay stopped) well short of the wall at the top end
    c.inThr = thr; c.inBrk = brk; c.inHand = 0;
  }

  /* ---------------------------------------------------------------------
     RACE
     --------------------------------------------------------------------- */
  const DRIVER_NAMES = ['M. Kovač', 'T. Hayashi', 'L. Rossi', 'J. Novak', 'K. Weber', 'A. Silva', 'R. Horvat', 'S. Tanaka', 'P. Dubois', 'N. Petek', 'E. Lindqvist', 'G. Moretti', 'D. Zupan', 'H. Kimura'];
  const AI_COLORS = [0xe8e8ee, 0x1c5fd6, 0xf2c230, 0x1a1a1f, 0x2fa84f, 0xf07a1a, 0x9a2bd8, 0x19b7c7, 0xd81f45, 0xc9c3b0, 0x6b8e23, 0xff5fa2, 0x3b3fa8];
  // AI pace per difficulty: [slowest skill, fastest skill, rubber band: slow-down when far ahead of the player (max, from metres), speed-up when behind (max, from metres)]
  // (skill 1 = the racing-line speed profile; the cars' own limit on the autopilot is about 1.12, the little pico understeers past ~1.08)
  const DIFF = [
    [0.78, 0.86, 0.06, 60, 0.05, 40],    // lahka
    [0.88, 0.97, 0.04, 90, 0.05, 40],    // srednja
    [1.02, 1.12, 0.01, 200, 0.06, 30],   // težka: the front runners drive at the limit and hardly wait for anyone
  ];

  class Race {
    constructor(track, opts) {
      if (opts.phys === 'rally') opts = Object.assign({}, opts, { phys: 'cs' });   // the removed 'rally' physics maps to cs (as in Car)
      this.track = track;
      this.opts = opts;
      this.laps = opts.laps || 3;
      this.time = 0; this.state = 'grid'; this.countdown = 0;
      this.cars = []; this.debris = []; this.debrisId = 0; this.props = null; this.propBk = null; this.propSlots = null; this.propCap = null;
      this.finishOrder = [];
      // time trial (def.timeTrial, e.g. the Pikes Peak hill climb): the player alone, standing ON the start line; the clock is race.time
      this.timeTrial = !!(track.def.timeTrial && !opts.noPlayer);
      this._rq = [];   // open road + noPlayer (menu demo): cars that reached the top, waiting for a free spot at the start
      const nAI = this.timeTrial ? 0 : opts.numAI == null ? 12 : opts.numAI;
      const total = nAI + (opts.noPlayer ? 0 : 1);
      this._gridN = total;
      const playerGrid = opts.noPlayer ? -1 : Math.min(total, opts.playerGrid || 12);
      const R = rng(opts.seed || 7);
      // AI roster
      const diff = DIFF[opts.difficulty == null ? 1 : opts.difficulty]; this.diff = diff;
      const aiSpecs = [];
      for (let k = 0; k < nAI; k++) {
        const skill = lerp(diff[1], diff[0], k / Math.max(1, nAI - 1)) + (R() - 0.5) * 0.012;
        aiSpecs.push({ skill, model: MODELS[(k * 3 + 1) % 4], color: AI_COLORS[k % AI_COLORS.length], name: DRIVER_NAMES[k % DRIVER_NAMES.length] });
      }
      // grid: fastest first
      let ai = 0;
      for (let g = 1; g <= total; g++) {
        let c;
        if (g === playerGrid) {
          c = new Car(opts.playerModel || MODELS[0], { id: g, isPlayer: true, arcade: opts.arcade !== false, phys: opts.phys, name: 'TI', color: opts.playerColor, assist: opts.assist, upg: opts.playerUpg });
          this.player = c;
        } else {
          const s = aiSpecs[ai++];
          c = new Car(s.model, { id: g, name: s.name, color: s.color, skill: s.skill, assist: opts.phys === 'cs' ? CSK.aiAssist : 1, arcade: true, phys: opts.phys, laneBias: (R() - 0.5) * 1.6 });
          c.skCap = s.model.id === 'pico' ? 1.0 : opts.phys === 'cs' ? CSK.aiSkCap : 1.14;   // no point pushing a car past what it can hold (the light pico understeers into the walls beyond the line's own pace)
        }
        c.grid = g; c.num = [7, 3, 11, 21, 5, 44, 9, 16, 27, 8, 12, 33, 2, 55][(g - 1) % 14];
        c.rubber = 1;
        c.dmgMode = opts.damage == null ? 2 : opts.damage;
        this.cars.push(c);
        this._placeOnGrid(c, g);
      }
      if (this.player) this.player.num = opts.playerNum || 1;
      this._prof();
    }

    // speed profile for the AI (on the racing line), per physics; an upgraded player's autopilot brakes later with better brakes (its own profile)
    _prof() {
      const opts = this.opts, track = this.track;
      const csP = opts.phys === 'cs', latA0 = opts.aiLatA || (csP ? CSK.aiLatA : 16.5), brA0 = opts.aiBrakeA || (csP ? CSK.aiBrakeA : 13.0), wM0 = csP ? CSK.aiWmax : 0;
      this.vprof = track.speedProfile(latA0, brA0, 85, wM0);
      if (this.player && this.player.upg && this.player.brakeG !== BRAKE_G) this.player.vprof = track.speedProfile(latA0, brA0 * this.player.brakeG / BRAKE_G, 85, wM0);
    }

    // switch the driving physics of a running race at once ('cs' | 'arcade'): every car, the AI set-up and the AI speed profile
    setPhys(ph) {
      ph = ph === 'arcade' ? 'arcade' : 'cs'; this.opts.phys = ph; const cs = ph === 'cs';
      for (const c of this.cars) {
        c.phys = ph; c.arcade = !cs; c.vAngP = null;
        c.csS = c.csWd = c.csB = c.csBx = c.csCo = c.csLt = c.csLp = c.csThrP = c.csK = c.csKc = c.csAn = c.csAT = 0; c.csKs = null; c.csWcap = 1;
        if (!c.isPlayer) { c.assist = ASSISTS[cs ? CSK.aiAssist : 1]; c.skCap = c.m.id === 'pico' ? 1.0 : cs ? CSK.aiSkCap : 1.14; }
      }
      this._prof();
    }

    _gridBack(g) {   // metres behind the start line of grid slot g
      const T = this.track;
      if (this.timeTrial) return 0;
      if (!T.open) return 9 + (g - 1) * 7.5;
      // open road: the grid has to fit between the bottom end of the road and the start line (two abreast, staggered)
      const sp = clamp((T.startS - 9) / Math.max(1, this._gridN - 1), 2.4, 3.6);
      return Math.min(3 + (g - 1) * sp, T.startS - 4);
    }
    _placeOnGrid(c, g) {
      const T = this.track;
      const back = this._gridBack(g);
      const s = T.startS - back;
      const i = this.timeTrial ? T.startIdx : T.idx(s);
      const lat = this.timeTrial ? 0 : (g % 2 === 1 ? -1 : 1) * 3.4;
      const x = T.px[i] + T.nx[i] * lat, z = T.pz[i] + T.nz[i] * lat;
      c.place(x, z, T.hd[i]); if (T.hasElev) { c.y = c.py = T.hy[i]; if (T.open) c.roadY = c.y; }   // (open road: the camera starts at the right height)
      c.dist = -back; c.lap = 0;
      c.cp = 0; c.splits = [];
      c.q = T.query(x, z, i, {});
      c.sPrev = c.q.s;
      c.locked = true;
    }

    spawnDebris(c, name) {
      const P = PARTS[name], hl = c.m.len * 0.5, hw = c.m.wid * 0.5, ch = Math.cos(c.h), sh = Math.sin(c.h);
      const ox = P.lx * hl, oz = P.lz * hw, x = c.x + ox * ch - oz * sh, z = c.z + ox * sh + oz * ch;
      const ol = Math.hypot(ox, oz) || 1, ux = (ox * ch - oz * sh) / ol, uz = (ox * sh + oz * ch) / ol, out = 2 + Math.random() * 3;
      const d = { id: ++this.debrisId, car: c.id, part: name, x, z, y: (c.y || 0) + P.y, vx: c.vx * 0.7 + ux * out, vz: c.vz * 0.7 + uz * out, vy: 2.5 + Math.random() * 2.5,
        yaw: c.h, rx: 0, rz: 0, wx: (Math.random() - 0.5) * 16, wy: (Math.random() - 0.5) * 12, wz: (Math.random() - 0.5) * 16, r: P.r, m: P.m, h: P.h, rest: false, ground: false, q: null, dead: false };
      this.debris.push(d);
      if (this.debris.length > 40) { const old = this.debris.shift(); old.dead = true; }   // keep the road readable
    }
    start() {
      this.state = 'racing'; this.time = 0; for (const c of this.cars) { c.locked = false; c.lapStart = 0; }
      // open-road demo: the grid is packed tight between the bottom end and the start line, so the cars set off one by one, 0.5 s apart
      if (this.track.open && this.opts.noPlayer) for (const c of this.cars) { c.relT = (c.grid - 1) * 0.5; if (c.relT > 0) c.locked = true; }
    }

    // trackside props from the scenery builder: [{ kind, x, z, yaw, col }]; stacks get their tyres / bales ready (hidden) for when they burst.
    // floor(q): the verge's height relative to the road there (from the world builder; worlds whose verge drops away from the road edge)
    setProps(list, floor) {
      const T = this.track, props = [], slots = {}, cap = {};
      this.propFloor = floor || null;
      for (const it of list) {
        const K = PROPK[it.kind]; if (!K) continue;
        const q = T.query(it.x, it.z, it.i >= 0 && it.i < T.N ? it.i : -1, {}), gy = (T.hasElev ? T.elevAt(q.s).y : 0) + (floor ? floor(q, true) : 0);   // (it.i: the builder's sample index, a hint that saves a full scan; the floor row of the nearest sample, as the builder's placement test saw it)
        const b = mkProp(it.kind, it.x, gy + K.h0, it.z, it.yaw); b.col = it.col || 0; b.qi = q.i;
        b.slot = slots[it.kind] = (slots[it.kind] || 0); slots[it.kind]++; cap[it.kind] = (cap[it.kind] || 0) + 1; props.push(b);
        if (K.breaks) b.parts = K.parts.map(() => { const pb = mkProp(K.breaks, it.x, gy, it.z, 0); pb.hidden = true; pb.dead = true; pb.col = b.col; cap[K.breaks] = (cap[K.breaks] || 0) + 1; props.push(pb); return pb; });
      }
      for (const k in cap) if (!slots[k]) slots[k] = 0;
      this.props = props; this.propSlots = slots; this.propCap = cap;
      const nb = Math.max(1, Math.ceil(T.N / 6)); this.propBk = []; for (let k = 0; k < nb; k++) this.propBk.push([]);
      for (const b of props) if (!b.dead) this._bkPut(b);
    }
    _bkPut(b) { const k = Math.max(0, Math.floor(b.qi / 6)) % this.propBk.length; b.bk = k; this.propBk[k].push(b); }
    _bkDel(b) { const L = this.propBk[b.bk]; if (L) { const i = L.indexOf(b); if (i >= 0) L.splice(i, 1); } b.bk = -1; }
    _bkMove(b) { const k = Math.max(0, Math.floor(b.qi / 6)) % this.propBk.length; if (k !== b.bk) { this._bkDel(b); b.bk = k; this.propBk[k].push(b); } }
    breakProp(b, nx, nz, vn, svx, svz) {   // a stack bursts: its tyres / bales fly off (the bottom ones hardest, the top one pops up)
      if (b.dead) return;
      b.dead = true; b.hidden = true; b.sleep = true; b.dirty = true; this._bkDel(b); this.propFx(b, vn);
      const K = b.K, tx = -nz, tz = nx; if (!b.parts) return;
      b.parts.forEach((p, k) => {
        const o = qRot(b, K.parts[k][0], K.parts[k][1], K.parts[k][2], _r3), f = K.pf[k];
        p.x = b.x + o[0]; p.y = b.y + o[1]; p.z = b.z + o[2]; p.qx = b.qx; p.qy = b.qy; p.qz = b.qz; p.qw = b.qw;
        const side = (Math.random() - 0.5) * 2.4, vv = b.kind === 'bstack' ? Math.min(11, vn * 0.62) : Math.min(14, vn * 0.78);
        p.vx = svx * 0.2 + nx * vv * f[0] + tx * side; p.vz = svz * 0.2 + nz * vv * f[0] + tz * side; p.vy = f[1] + vv * 0.05 * (k + 1);
        p.wx = (Math.random() - 0.5) * 9; p.wy = (Math.random() - 0.5) * 7; p.wz = (Math.random() - 0.5) * 9;
        p.dead = false; p.hidden = false; p.sleep = false; p.dirty = true; p.t = 0; p.age = 0; p.qi = b.qi;
        if (p.slot < 0) { p.slot = this.propSlots[p.kind]; this.propSlots[p.kind]++; }
        this._bkPut(p);
      });
    }
    propFx(b, v) { if (v < 3) return; const E = this.propEvents || (this.propEvents = []); if (E.length < 24) E.push({ x: b.x, y: b.y, z: b.z, kind: b.kind, v }); }   // for the renderer: dust / straw puffs
    stepProps(dt) {
      if (!this.props) return;
      const T = this.track, bk = this.propBk, nb = bk.length;
      for (const c of this.cars) {
        if (!(c.q.i >= 0)) continue; const k0 = Math.floor(c.q.i / 6);
        for (let o = -1; o <= 1; o++) { const L = bk[(k0 + o + nb) % nb]; for (let n = L.length - 1; n >= 0; n--) { const b = L[n]; if (b && !b.dead) propCarHit(this, c, b); } }
      }
      for (const b of this.props) if (!b.sleep && !b.dead) propStep(this, b, T, dt);
    }

    step(dt) {
      const T = this.track, cars = this.cars;
      if (this.state === 'racing' || this.state === 'done') this.time += dt;
      for (const c of cars) if (!(c.q.i >= 0)) c.q = T.query(c.x, c.z, -1, c.q);   // a car placed without a track lookup finds itself first
      // rubber band vs player
      const P = this.player;
      for (const c of cars) {
        if (c.isPlayer) continue;
        if (c.relT > 0 && this.state === 'racing') { c.relT -= dt; if (c.relT <= 0) c.locked = false; }   // (open-road demo: staggered start)
        if (P && !c.finished) {
          const gap = c.dist - P.dist; // + ahead of player
          const D = this.diff || DIFF[1], target = gap > D[3] ? 1 - clamp((gap - D[3]) / 500, 0, D[2]) : gap < -D[5] ? 1 + clamp((-gap - D[5]) / 400, 0, D[4]) : 1;
          c.rubber += (target - c.rubber) * dt * 0.5;
        }
        if (!c.locked) {
          aiControl(c, this, dt);
          if (c.finished) { c.inThr *= 0.5; }
        } else { c.inThr = 0; c.inBrk = c.parkQ ? 1 : 0; c.inSteer = 0; }
      }
      for (const c of cars) {
        if (c.pitState === 'repair') { c.inThr = 0; c.inBrk = 0; c.inSteer = 0; c.inHand = 0; }   // on the jacks: the mechanics are working (held in place below; no brake, so the gearbox stays in first)
        // steering smoothing
        const target = c.inSteer;
        const rate = c.isPlayer ? (c.digitalSteer ? (Math.abs(target) < Math.abs(c.steer) || target * c.steer < 0 ? 10 : 6) : 16) : 10;
        c.steer += clamp(target - c.steer, -rate * dt, rate * dt);
        c.step(dt, T);
      }
      // collisions
      for (let i = 0; i < cars.length; i++) {
        for (let j = i + 1; j < cars.length; j++) carCollide(cars[i], cars[j]);
      }
      if (T.def.pit) for (const c of cars) if (c.isPlayer) this.pitStep(c, dt, true);   // which side of the pit wall the car is on (before the walls push it)
      for (const c of cars) wallCollide(c, T);
      if (T.def.pit) for (const c of cars) if (c.isPlayer) this.pitStep(c, dt, false);  // speed limiter, stopping at the box, repair
      for (const c of cars) if (c.detach.length) { for (const name of c.detach) this.spawnDebris(c, name); c.detach.length = 0; }
      for (const c of cars) if (!Number.isFinite(c.x + c.z + c.vx + c.vz + c.h + c.w + (c.y || 0))) { c.x = c.z = c.vx = c.vz = c.w = c.h = 0; c.y = 0; c.vy = 0; c.air = 0; c.q.s = c.goodS || 0; c.q.i = -1; this.rescue(c); }
      if (this.debris.length) { for (const d of this.debris) stepDebris(d, T, dt); for (const c of cars) for (const d of this.debris) debrisHit(c, d); }
      // progress
      for (const c of cars) {
        const q = T.query(c.x, c.z, c.q.i, c.q);
        let ds = q.s - c.sPrev;
        if (!T.open) { if (ds > T.len * 0.5) ds -= T.len; else if (ds < -T.len * 0.5) ds += T.len; }
        ds = clamp(ds, -3, 3);
        c.sPrev = q.s; if (Number.isFinite(q.s)) c.goodS = q.s;
        c.dist += ds;
        if (T.open) this._progressOpen(c, q, ds, dt);
        const lapsDone = Math.floor(c.dist / T.len);
        if (this.state !== 'grid' && !T.open) {
          while (c.lap <= lapsDone && c.lap <= this.laps) {
            if (c.lap >= 1) { c.lapTimes.push(this.time - c.lapStart); }
            c.lapStart = this.time;
            c.lap++;
            if (c.lap > this.laps && !c.finished) {
              c.finished = true; c.finishTime = this.time; this.finishOrder.push(c); c.finishPos = this.finishOrder.length;
            }
          }
        }
        // wrong way
        const fwd = Math.cos(c.h) * q.tx + Math.sin(c.h) * q.tz;
        if (fwd < -0.2 && c.speed > 3) c.wrongT += dt; else c.wrongT = Math.max(0, c.wrongT - dt * 2);
        // stuck detection (AI auto-rescue)
        if (!c.locked && !c.pitState && c.speed < 1.2 && (this.state === 'racing' || this.state === 'done')) c.stuckT += dt; else c.stuckT = Math.max(0, c.stuckT - dt);
        if (!c.isPlayer && (c.stuckT > 3.5 || c.wrongT > 3)) this.rescue(c);
      }
      if (this._rq.length) this._serveRespawn();
      this.stepProps(dt);
      // order
      this.order = cars.slice().sort((a, b) => {
        if (a.finished && b.finished) return a.finishPos - b.finishPos;
        if (a.finished) return -1; if (b.finished) return 1;
        return b.dist - a.dist;
      });
      for (let i = 0; i < this.order.length; i++) this.order[i].pos = i + 1;
    }

    // ---- pit lane: 60 km/h limit, the car pulls up at its box, the crew repairs it (time depends on the damage), then off you go ----
    pitStep(c, dt, pre) {
      const T = this.track, P = T.def.pit, q = T.query(c.x, c.z, c.q.i, _pq2), pz = T.pitAt(q.s);
      if (pre) {
        if (!pz) { if (c.inPit) { c.inPit = false; c.pitEv = 'exit'; } c.pitDone = false; c.pitState = null; return; }
        if (pz.gap) { const was = c.inPit; c.inPit = q.d > pz.wall; if (c.inPit && !was) c.pitEv = 'enter'; else if (!c.inPit && was) { c.pitEv = 'exit'; c.pitDone = false; c.pitState = null; } }
        return;
      }
      if (!c.inPit || !pz) return;
      const sp = Math.hypot(c.vx, c.vz), lim = PIT_V;
      if (c.pitState === 'repair') {
        c.vx = c.vz = 0; c.w = 0; c.pitT += dt; c.stuckT = 0;
        if (c.pitT >= c.pitDur) { this.repairCar(c); c.pitState = 'done'; c.pitDone = true; c.pitEv = 'done'; }
        return;
      }
      let vmax = lim;
      if (!c.pitDone && P[3] != null) {   // pull up at the box: a braking curve that ends right at it
        const L = T.len; let ds = (T.startS + P[3]) - q.s; ds = ((ds % L) + L) % L; if (ds > L / 2) ds -= L;
        if (ds < 40 && ds > -5) {
          vmax = Math.min(vmax, Math.sqrt(2 * 6.5 * Math.max(0, ds - 0.2)));
          if (!c.pitState) { c.pitState = 'stop'; c.pitEv = 'box'; }
          if (sp < (c.phys === 'cs' ? 1.5 : 0.8) && Math.abs(ds) < 4) {   // (cs: its drive holds ~0.9 m/s against the stop curve at part throttle)
            let lost = 0; for (const k in c.lost) lost++;
            c.pitState = 'repair'; c.pitT = 0; c.pitDur = Math.min(5, 1.2 + 3.3 * c.dmg + lost * 0.15); c.vx = c.vz = 0; c.w = 0; c.pitEv = 'repair';
          }
        }
      }
      if (sp > vmax) { const k = Math.max(vmax / sp, 1 - 4 * dt); c.vx *= k; c.vz *= k; if (vmax < 1) c.w *= k; }   // the limiter (and the stop) take over smoothly
    }
    repairCar(c) {   // good as new: body, panels, lamps, glass; the renderer rebuilds the car when repairN changes
      c.dmg = 0; c.dz = [0, 0, 0, 0]; c.dents = []; c.cd = [0, 0, 0, 0]; c.lightOut = [0, 0, 0, 0]; c.lost = {}; c.detach = []; c.winOut = [0, 0, 0, 0]; c.roofDmg = 0;
      c.repairN = (c.repairN || 0) + 1;
    }

    // open road: checkpoints (split times), the finish at T.finishS; in the menu demo (noPlayer) cars that reach the top start again at the bottom.
    // Crossing times are interpolated inside the step from the distance covered in it.
    _progressOpen(c, q, ds, dt) {
      const T = this.track;
      if (this.state === 'grid' || c.finished || c.parkQ) return;
      const tAt = (target) => this.time - dt * (ds > 1e-9 ? clamp((c.dist - target) / ds, 0, 1) : 0);
      if (c.lap === 0 && c.dist >= 0) { c.lap = 1; if (c.dist - ds < 0) c.lapStart = tAt(0); }
      // (the projected position must agree - within 30 m - so a lookup snapped to another leg of the road can not trigger anything)
      while (c.cp < T.cpS.length && c.dist >= T.cpDist[c.cp] && q.s >= T.cpS[c.cp] - 30) { c.splits.push(tAt(T.cpDist[c.cp])); c.cp++; c.cpEv++; }
      const atFinish = c.cp >= T.cpS.length && c.dist >= T.raceLen && q.s >= T.finishS - 30;
      if (this.opts.noPlayer) { if (atFinish || q.s >= T.finishS + 5) this._queueRespawn(c); return; }
      if (atFinish) {
        const ft = tAt(T.raceLen);
        c.finished = true; c.finishTime = ft; c.lapTimes = [ft]; c.lap = this.laps + 1;
        this.finishOrder.push(c); c.finishPos = this.finishOrder.length;
        c.noReverse = true;   // (the UI holds the brake after the finish: the car must stop, not back down the hill)
      }
    }
    _queueRespawn(c) { c.parkQ = true; c.locked = true; c.inThr = 0; c.inBrk = 1; c.inSteer = 0; this._rq.push(c); }
    // put the first waiting car on the first free spot behind the start line (no car within 9 m of it)
    _serveRespawn() {
      const T = this.track, c = this._rq[0];
      for (let g = 1; g <= 4; g++) {
        const i = T.idx(T.startS - this._gridBack(g)), lat = (g % 2 === 1 ? -1 : 1) * 3.4;
        const x = T.px[i] + T.nx[i] * lat, z = T.pz[i] + T.nz[i] * lat;
        let free = true;
        for (const o of this.cars) if (o !== c && (o.x - x) * (o.x - x) + (o.z - z) * (o.z - z) < 81) { free = false; break; }
        if (!free) continue;
        this._rq.shift();
        this._placeOnGrid(c, g);
        c.parkQ = false; c.locked = false; c.stuckT = 0; c.wrongT = 0; c.aiOff = 0; c.aiT = 0; c.steer = 0;
        return;
      }
    }

    rescue(c) {
      const T = this.track;
      const s = c.q.s;
      let i = T.idx(s);
      if (T.open) i = clamp(i, 3, T.N - 4);   // not into the wall at an end of the road
      const off = T.rl[i] * 0.5;
      c.place(T.px[i] + T.nx[i] * off, T.pz[i] + T.nz[i] * off, T.hd[i]); if (T.hasElev) { c.y = c.py = T.hy[i]; if (T.open) c.roadY = c.y; }
      c.locked = false;
      c.q = T.query(c.x, c.z, i, c.q); c.sPrev = c.q.s;
      if (T.open && Number.isFinite(s) && Number.isFinite(c.dist)) c.dist += c.q.s - s;   // open road: the distance follows the car back to the sample (checkpoints / finish stay exact)
      c.stuckT = 0; c.wrongT = 0; c.rescued = 1.2; c.inPit = false; c.pitState = null; c.pitDone = false;   // (back on the circuit, not in the pit lane)
      const v = T.open && T.len - c.q.s < 25 ? 0 : 8;   // (near the top end of an open road: standing, not off into the end wall)
      c.vx = Math.cos(c.h) * v; c.vz = Math.sin(c.h) * v;
    }

    // estimated finish times for unfinished cars (for results)
    estimateResults() {
      const T = this.track, res = [];
      const done = this.finishOrder.slice();
      const rest = this.cars.filter(c => !c.finished).sort((a, b) => b.dist - a.dist);
      for (const c of done) res.push({ car: c, time: c.finishTime, est: false });
      for (const c of rest) {
        const remain = Math.max(0, (T.open ? T.raceLen : this.laps * T.len) - c.dist);
        const avg = c.dist > 50 ? c.dist / Math.max(1, this.time) : 30;
        const t = this.time + remain / Math.max(15, avg);
        res.push({ car: c, time: t, est: true });
      }
      res.sort((a, b) => a.time - b.time);
      return res;
    }
  }

  return { G, clamp, lerp, wrapPi, sstep, rng, Track, TRACK_DEF, PIKES_DEF, TRACKS, MODELS, ASSISTS, SURF, Car, Race, wallCollide, carCollide, aiControl, tire, DRIVER_NAMES, UPG, upgMods, upgStats, CSK, CSP, CSASSIST, CSSURF };
})();



if (typeof module !== 'undefined') module.exports = Core;
