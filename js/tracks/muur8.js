/* Track definition 'muur8'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // The Kapelmuur's circuit with the streets as narrow as they are (an 8 m road, not 13 m): the same lap, heights, town and scenery as the
  // circuit 'muur' (its data shared), the houses cut back only as far as this road needs, so the old town closes in round the cars; a
  // smaller field (7 rivals) to fit it. World builds it as its own Geraardsbergen (theme 'muur').
  const M = TRACK_DEFS.find(d => d.id === 'muur'); if (!M) return;
  TRACK_DEFS.push(Object.assign({}, M, {
    id: 'muur8', name: 'Kapelmuur · ozke ulice', halfWidth: 4, inner: 1.6, side: 1.6, runoff: 0.3, rivals: 7,
    desc: 'Krog Kapelmuurja po ulicah Geraardsbergna, široka kot v resnici: 8 m namesto 13 m, hiše tik ob ograji, kaseji na Vesten, Oudenbergstraat in Muurju. Manj prostora za prehitevanje, zato le 7 tekmecev.',
  }));
})();
