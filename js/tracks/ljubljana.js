/* Track definition 'ljubljana'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // Ljubljana street circuit, laid out on real coordinates (metres, origin = Triple Bridge, x east, z south):
  // Petkovškovo nabrežje (start) → Dragon Bridge → Central Market bank → Stritarjeva/Mestni trg/Stari trg →
  // Cobblers' Bridge → Novi trg → Vegova → Kongresni trg → Slovenska → Čopova → Prešernov trg.
  TRACK_DEFS.push({
    id: 'ljubljana', name: 'Ljubljana, Slovenija', theme: 'ljubljana', laps: 3, halfWidth: 6.5,
    desc: 'Mestna proga po starem središču Ljubljane: ob reki in čez mostove, po trgih in ozkih ulicah, nad mestom grad. 1,9 km in sedem zavojev.',
    en: { name: 'Ljubljana, Slovenia', desc: 'A street circuit through the old centre of Ljubljana: along the river and over the bridges, through squares and narrow streets, with the castle above the town. 1.9 km and seven turns.' },   // (the English page: Jezik · Language)
    points: [[40, -40], [150, -68], [250, -98], [300, -116], [324, -100], [330, -75], [316, -57], [240, -35], [150, -10], [62, 12], [22, 40], [14, 85], [10, 135], [4, 200], [-6, 262], [-26, 298], [-85, 304], [-150, 300], [-190, 280], [-197, 212], [-202, 165], [-250, 150], [-292, 126], [-286, 40], [-268, -50], [-254, -108], [-218, -118], [-165, -97], [-92, -72], [-30, -55]],
    start: [150, -68], runoff: 0.45, inner: 3.2, side: 3.4, offSurface: 'paving',
    // named places: the seven corners by their numbers ([HUD label, x, z, what the commentator may say there]); on the straights
    // between them ({ hud: false }) only the commentator speaks. No names of streets, bridges, buildings or people, on the HUD or spoken
    names: [
      ['Zavoj 1', 324.3, -99.6, ['Over the bridge now!', 'Round the hairpin across the river!', 'Round over the bridge, the river below!']],
      { n: 'tržnica', x: 209.8, z: -26.4, hud: false, say: ['Along the market!', 'Past the market stalls and the colonnade!', 'Down the river bank by the market!'] },
      ['Zavoj 2', 59.1, 13.3, ['Left into the old town!', 'Turn two, left off the river bank!', 'Round to the left, into the narrow streets!']],
      { n: 'mestni trg', x: 11.9, z: 108.4, hud: false, say: ['Through the town square, past the town hall!', 'Past the fountain in the square!', 'Into the square, by the town hall!'] },
      { n: 'stari trg', x: 1.3, z: 223.9, hud: false, say: ['Down the old square, under the castle!', 'The castle looking down on the cars!', 'Cobbles and cafes, keep it tidy!'] },
      ['Zavoj 3', -62.2, 304.2, ['Over the little bridge!', 'Right, and back across the river!', 'Across the river again!']],
      ['Zavoj 4', -194.1, 270.7, ['Right, and away from the river!', 'Turn four, a tight right!', 'Right again, towards the big square!']],
      ['Zavoj 5', -204.2, 162.9, ['Round the square!', 'Left at the square, by the park!', 'Turn five, left round the park!']],
      ['Zavoj 6', -295.7, 103.9, ['Onto the main road!', 'Right, and flat out up the main road!', 'Turn six, onto the widest street in town!']],
      ['Zavoj 7', -251.7, -110.1, ['Right into the shopping street!', 'Turn seven, down the busy shopping street!', 'Right, and back down towards the river!']],
      { n: 'trg ob mostovih', x: -18.5, z: -51.9, hud: false, say: ['Past the pink church!', 'Through the square by the bridges!', 'Past the monument in the square!'] },
      { n: 'nabrežje', x: 92.9, z: -50.2, hud: false, say: ['Along the river to the line!', 'Down the embankment to the line!', 'Along the embankment, back to the line!'] },
    ],
    // Ljubljanica centre line (south-west → north → east) and width; castle on its hill
    river: [[-170, 600], [-110, 470], [-75, 380], [-54, 299], [-30, 180], [-12, 80], [0, 0], [60, -18], [150, -45], [240, -72], [324, -97], [420, -113], [560, -108]], riverW: 26,
    castle: [182, 240],
  });
})();
