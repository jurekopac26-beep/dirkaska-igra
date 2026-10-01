/* Track definition 'muurtt'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // The climb of the Muur van Geraardsbergen against the clock (the hill climb, as Pikes Peak and Vršič): the riders' way up from the river
  // Dender, along the quay, up the Brugstraat, across the Markt, up the cobbled Vesten and the Oudenbergstraat, into the park on the Kapelmuur
  // and up its last ramp of ~20 % to the chapel on the Oudenberg (~1.2 km, ~90 m up). An OPEN road on the circuit's own streets: the line is
  // the circuit's (def 'muur', the stretch from 3430 m to 1160 m of its lap, through its start line), so are the heights (def.elevOf: Core
  // takes them from the circuit where the road runs) and the world (def.circuitOf: World builds the circuit's Geraardsbergen; the climb's
  // start and finish gantries on top). Stretches below ([from, to], metres after the climb's start line) are the circuit's, moved.
  const M = TRACK_DEFS.find(d => d.id === 'muur'); if (!M) return;
  const P = M.points, n = P.length, cd = [0];
  for (let i = 1; i <= n; i++) cd.push(cd[i - 1] + Math.hypot(P[i % n][0] - P[i - 1][0], P[i % n][1] - P[i - 1][1]));
  const Lc = cd[n], A = 3500, at = (d) => { d = ((d % Lc) + Lc) % Lc; let i = 0; while (i < n - 1 && cd[i + 1] <= d) i++; const t = (d - cd[i]) / (cd[i + 1] - cd[i]), j = (i + 1) % n;
    return [+(P[i][0] + (P[j][0] - P[i][0]) * t).toFixed(1), +(P[i][1] + (P[j][1] - P[i][1]) * t).toFixed(1)]; };
  const pts = []; for (let i = 0; i < n; i++) if (cd[i] >= 3430) pts.push(P[i]); for (let i = 0; i < n; i++) if (cd[i] <= 1160) pts.push(P[i]);   // (70 m of run-up; past the finish down the Oudeberg)
  const keep = ['Dender', 'Brugstraat', 'Markt', 'Vesten', 'Oudenbergstraat', 'Kapelmuur', 'Kapelmuur · 20 %', 'Kapel Oudenberg'];
  TRACK_DEFS.push({
    id: 'muurtt', name: 'Kapelmuur · vzpon', theme: 'muur', open: true, timeTrial: true, laps: 1, halfWidth: 6.5, circuitOf: 'muur', elevOf: 'muur',
    desc: 'Vzpon na Muur van Geraardsbergen proti uri: od reke Dender po nabrežju in Brugstraat, čez Markt, po tlakovanih Vesten in Oudenbergstraat, skozi park na Kapelmuur in po zadnji 20-odstotni rampi do kapele na Oudenbergu. Dobrih 1,1 km kasejev in 90 m vzpona, rekordi in medalje.',
    realKm: 1.2, alt: [17, 109], maxGrade: 20, gradeHud: true, legend: true, photo: true,   // (the card: the steepest ramp; the HUD: the gradient under the car next to the altitude)
    start: at(A), finish: at(Lc + 893), cps: [at(A + 240), at(A + 475), at(A + 710), at(A + 945)],
    runoff: M.runoff, inner: M.inner, side: M.side, noCurbs: true, noGravel: true, offSurface: 'paving', kassei: true, gradeForce: true,
    // medal times (s), dry and in the rain: the stock rally car on the autopilot x 1.01 (gold), 1.06 (silver), 1.14 (bronze) (cs: Circuit Superstars physics)
    medals: { cs: [46.4, 48.7, 52.4], wet: { cs: [55.1, 57.8, 62.2] } },
    setts: [[Lc - 62 - A, 1189 + Lc - A]],
    tiles: [[3585 - A, 3722 - A]],
    grass: M.grass.map(([a, b]) => [a + Lc - A, b + Lc - A]).filter(([a]) => a < 1500),
    names: M.names.filter(q => keep.indexOf(q[0]) >= 0),
    points: pts,
  });
})();
