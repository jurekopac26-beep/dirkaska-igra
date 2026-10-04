/* Track definition 'gora'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // Makadam mountain rally stage: climbs a hill and descends, with crest/downhill jumps and heavy scenery.
  TRACK_DEFS.push({
    id: 'gora', test: true, name: 'Gorski reli', theme: 'mountain', laps: 2, halfWidth: 7,
    desc: 'Makadamska gorska proga: klanci navzgor in navzdol, skoki čez grbine, gozd in skale. Hitra in razgibana.',
    en: { name: 'Mountain Rally', desc: 'A gravel mountain stage: climbs and descents, jumps over crests, forest and rocks. Fast and varied.' },   // (the English page: Jezik · Language)
    points: [[-255, 174], [-70, 186], [128, 174], [273, 139], [348, 51], [332, -35], [248, -70], [139, -46], [51, -100], [-67, -90], [-206, -46], [-311, 26], [-322, 125]],
    start: [-120, 180], roadSurface: 'makadam', runoff: 0.8, inner: 4.5, side: 5.5,
    elev: [[0, 0], [0.2, 0], [0.33, 5], [0.42, 17], [0.52, 30], [0.60, 36], [0.70, 33], [0.80, 18], [0.90, 6], [0.96, 0]],
    bumps: [{ at: 0.13, h: 1.6, w: 6 }, { at: 0.25, h: 1.2, w: 6 }, { at: 0.60, h: 1.3, w: 6 }, { at: 0.80, h: 1.6, w: 5.5 }]
  });
})();
