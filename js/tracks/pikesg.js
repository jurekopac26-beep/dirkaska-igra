/* Track definition 'pikesg'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // Pikes Peak on its historic gravel road (makadam): until 2011 most of the Pikes Peak Highway was unpaved. The same road as 'pikes' (js/tracks/pikes.js:
  // the layout, heights, places, turns and theme), only the surface is gravel (core: surface 5, no kerbs, the loose grip). Its own id, so its records,
  // ghosts and class boards are its own. After every older track file (a newer one goes after it), so the other tracks keep their places in the list.
  // The track menu shows it as a choice on the Pikes Peak card (game.js: Cesta asfalt / makadam), not as a card of its own.
  const P = TRACK_DEFS.find(d => d.id === 'pikes'); if (!P) return;
  TRACK_DEFS.push(Object.assign({}, P, {
    id: 'pikesg', name: 'Pikes Peak (makadam), ZDA', variantOf: 'pikes', roadSurface: 'makadam',
    desc: 'Zgodovinski vzpon na Pikes Peak po makadamu, kot pred letom 2011: ista cesta od 2862 m do vrha na 4301 m, a po rožnato sivem granitnem gramozu s kolesnicami in valovi. Manj oprijema, prah in kamenje za avtom.',
    en: { name: 'Pikes Peak (gravel), USA', desc: 'The historic climb up Pikes Peak on gravel, as before 2011: the same road from 2862 m to the summit at 4301 m, but on pinkish grey granite gravel with ruts and washboard. Less grip, dust and stones behind the car.' },   // (the English page: Jezik · Language)
  }));
})();
