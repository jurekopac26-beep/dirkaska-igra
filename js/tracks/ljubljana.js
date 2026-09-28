/* Track definition 'ljubljana'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // Ljubljana street circuit, laid out on real coordinates (metres, origin = Triple Bridge, x east, z south):
  // Petkovškovo nabrežje (start) → Dragon Bridge → Central Market bank → Stritarjeva/Mestni trg/Stari trg →
  // Cobblers' Bridge → Novi trg → Vegova → Kongresni trg → Slovenska → Čopova → Prešernov trg.
  TRACK_DEFS.push({
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
  });
})();
