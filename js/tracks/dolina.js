/* Track definition 'dolina'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // "Smrekova dolina" (working name): an invented dirt circuit in a spruce forest, laid out after the player's own picture (an aerial view
  // of a rallycross-style track) and built in the look of the stylised top-down racer of the reference video (as Bakreni gozd, Toskana
  // and Gromski rt). The picture's oblique view was straightened into a plan and scaled to ~2 km, clockwise so that the pits under the
  // long roof lie on the right of the straight: the long start/finish straight with the pits → a right at the top onto the outer road
  // along the fans' tents → past the small stand → a hairpin round the island with the camera tower → down the diagonal → a left
  // hairpin round the island with the big wooden tower → up the long diagonal → the right loop under the big stand (a fast sweep and a
  // round hairpin) → left, round the island with the log pile and the quad → the S: up, over the top, down → the long right hairpin at
  // the bottom onto the straight. Two roads of the picture are left out (the lane along the tents at the top and the short link over
  // the log island), so the lap is one road. The straight was lengthened (by ~55 m) for the pit lane and 13 boxes.
  TRACK_DEFS.push({
    id: 'dolina', name: 'Smrekova dolina', theme: 'kros', laps: 3, halfWidth: 7,
    desc: 'Izmišljena makadamska proga v smrekovem gozdu v slogu Circuit Superstars: dolga ciljna ravnina z boksi pod dolgo streho (zapelji vanje in mehaniki ti popravijo avto), serpentine in lasnice okoli otočkov s skalami, lesenimi stolpi in smrekami, tribune z modro streho, kamp z avtodomi in šotori, reflektorji in potok z lesenim mostom.',
    points: [[-62,192],[-202,25],[-214,9],[-223,-8],[-224,-25],[-218,-36],[-208,-47],[-198,-59],[-179,-66],[-159,-72],[-141,-79],[-125,-84],[-111,-90],[-103,-101],[-91,-109],[-67,-113],[-51,-118],[-35,-123],[-28,-131],[-27,-146],[-28,-161],[-22,-174],[-9,-183],[14,-184],[32,-171],[46,-155],[49,-139],[44,-122],[34,-109],[23,-98],[11,-90],[-3,-78],[-18,-67],[-32,-57],[-45,-47],[-61,-43],[-83,-40],[-102,-33],[-116,-22],[-126,-10],[-133,5],[-136,17],[-133,29],[-128,38],[-110,46],[-90,50],[-69,50],[-49,45],[-39,34],[-33,21],[-32,6],[-28,-11],[-20,-23],[-3,-37],[21,-42],[38,-46],[50,-56],[61,-69],[79,-73],[91,-72],[105,-65],[120,-50],[135,-31],[153,-18],[167,-9],[179,7],[186,15],[191,24],[192,34],[188,41],[180,45],[170,45],[152,42],[134,42],[118,47],[107,58],[110,74],[113,92],[116,104],[118,113],[116,121],[109,126],[95,129],[78,126],[65,118],[55,106],[51,88],[53,69],[60,51],[65,34],[66,20],[59,4],[49,-7],[36,-11],[24,-9],[14,1],[16,17],[22,34],[18,50],[10,61],[-1,70],[-11,87],[-17,107],[-17,127],[-8,142],[1,154],[10,167],[13,182],[11,196],[1,205],[-17,209],[-38,207],[-53,200]],
    start: [-139, 103], roadSurface: 'makadam', runoff: 0.4, inner: 3.2, side: 3.4,
    pit: [16, -105, 104, 37, 45],   // pit lane on the right of the straight, under the long roof: [centre offset to the right, from, to, the player's box, entry length] (metres from the start line)
    pitRow: [-58, 62],              // the first and the last of the 13 boxes
    dust: { col: [0.8, 0.6, 0.42] },   // the reference's warm orange-tan dust
    // scenery (see toskana.js and grom.js): stands [from, to, side, rows] (metres from the start line, side -1 left / 1 right; here with
    // blue roofs, as in the picture), billboards [x, z, side, out, along, slot, half width, height], spectators [from, to, side, rows,
    // density], campsites [x, z, width, depth, rot] (the paddock beside the straight, the fans along the top road, the vans behind the big
    // stand), the feather flags along the straight [from, to, side, spacing], rock formations [x, z, radius]; and this circuit's own:
    // floodlight masts [x, z, height], wooden towers [x, z, platform height, TV camera], log piles [x, z, rot, length, logs in the bottom
    // row], the paddock's service building [x, z, rot, length, depth], the stream (centre line) south of the bottom hairpin and its footbridge [x, z, rot, length, width]
    stands: [[1122, 1150, -1, 7], [1154, 1182, -1, 7], [638, 668, 1, 5]],
    boards: [[-224.6, -18.5, -1, 4.2, 0, 0, 4.2, 3.9], [14.5, -183.8, -1, 4.6, 0, 1, 4.2, 3.9], [192.2, 32.9, -1, 4.8, 0, 2, 4.2, 3.9], [-1.2, 206, -1, 4.6, 0, 3, 4.2, 3.9], [53.1, -3.6, -1, 4.2, 0, 1, 2.6, 2.6]],
    crowd: [[160, 330, -1, 3, 0.6], [430, 560, -1, 2, 0.5], [1190, 1275, -1, 3, 0.65], [1400, 1470, -1, 2, 0.5], [1840, 1965, -1, 3, 0.65], [-100, 100, -1, 2, 0.4], [700, 760, 1, 2, 0.45]],
    camp: [[-175, 142, 170, 30, -2.3], [-164.2, -108.6, 110, 26, -0.4], [176.5, -74.7, 90, 36, 0.9]],
    flags: [[-95, 95, -1, 11]],
    rocks: [[-100, 2, 9], [-8, -140, 8], [140, 8, 9], [40, 22, 6], [40, 246, 11], [112, 206, 10], [-120, 250, 9]],
    lights: [[-208, -82, 15], [-123, -113, 15], [14.7, -208, 15], [104.1, -92.8, 15], [194.3, -12.9, 15], [222, 36.3, 15], [-115.6, 164, 15], [-193.8, 70, 15], [-7.2, 234.1, 15]],
    towers: [[-92, -12, 5.5, 0], [7, -122, 5, 1], [109, -5, 5, 1], [36, 42, 4.5, 0]],
    logs: [[82, 95, 1.57, 6, 4], [40, 30, 1.2, 5, 3], [-72, 12, 0.3, 6, 3]],
    paddock: [[-138.8, 144.2, -2.3, 44, 12]],
    stream: [[-150, 250], [-100, 238], [-60, 230], [-26, 228], [6, 224], [36, 214], [66, 198], [98, 180], [130, 166], [162, 152], [192, 130], [222, 100], [250, 70], [276, 44]], streamW: 7,
    bridge: [-43, 229, 1.57, 16, 2.6],
  });
})();
