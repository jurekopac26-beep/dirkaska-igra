/* Track definition 'jezero'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  TRACK_DEFS.push({
    name: 'Jezero Ring',
    halfWidth: 7.5,
    points: [[200,215],[60,215],[-80,215],[-175,212],[-222,190],[-236,140],[-232,80],[-252,30],[-240,-30],[-195,-70],[-120,-82],[-55,-115],[10,-148],[70,-140],[92,-100],[70,-62],[22,-50],[4,-10],[40,20],[115,18],[180,-18],[235,-30],[268,0],[262,50],[284,100],[282,160],[252,205]],
    startX: 40, // start/finish line near this x on the main straight
    id: 'jezero', test: true, theme: 'lake', laps: 3, desc: 'Jezero z otokom in cerkvico, gozd, tribune. Hitra proga z dolgimi zavoji.',
    en: { desc: 'A lake with an island and a little church, forest, grandstands. A fast track with long bends.' },   // (the English page: Jezik · Language)
  });
})();
