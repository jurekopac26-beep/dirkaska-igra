/* Track definition 'riviera'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // Short technical coastal street circuit (SWGP2-style: ~1.25 km, 6 corners incl. 2 hairpins, seafront straight)
  TRACK_DEFS.push({
    id: 'riviera', name: 'Riviera, Francija', theme: 'city', laps: 4, halfWidth: 6.5,
    desc: 'Obalna mestna proga: palme, morje, promenada, stavbe. Kratka in tehnična z lasnicami.',
    en: { name: 'Riviera, France', desc: 'A seaside street circuit: palm trees, the sea, a promenade, buildings. Short and technical, with hairpins.' },   // (the English page: Jezik · Language)
    points: [[-195, 195], [0, 195], [150, 195], [208, 172], [224, 120], [221, 46], [198, -6], [150, -23], [114, 6], [94, 55], [39, 73], [-13, 57], [-58, 81], [-124, 75], [-188, 47], [-234, 81], [-244, 146], [-224, 188]],
    start: [-40, 195], runoff: 0.45, inner: 3.2, side: 3.4, offSurface: 'paving', sea: { z: 224 }
  });
})();
