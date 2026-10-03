/* Track definition 'parkirisce'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // The driving school's parking lot (school: true: not a race track, not in the track menu; only the Šola vožnje drives here): one flat
  // asphalt lot of 140 x 84 m between its curbs (Core: Track.lot), made up (no map data). Metres, x east, z south (north is up on the
  // isometric view). Along the north curb a row of bays (A) facing a row across the aisle (B), along the south curb a lane of bays for
  // parking at the kerb (C); the parked cars stand in them (solid, Core: Track.parked; drawn by World.buildLot), the open middle of the lot
  // is for the exercises. The first ten missions of the school (lessons, from the easiest to the hardest; Core: Lesson) are set out on it
  // with their cones, gates and the box to stop in; demo: the instructor's way through each (Core: lessonPath / lessonPilot)
  const A = { x0: -54, z0: -42, z1: -37, n: 40, w: 2.7 }, B = { x0: -54, z0: -29.5, z1: -24.5, n: 40, w: 2.7 }, C = { x0: -52, z0: 39.5, z1: 42, n: 16, w: 6.5 };
  const bx = (R, k) => R.x0 + R.w * (k + 0.5), bz = (R) => (R.z0 + R.z1) / 2, PI = Math.PI;
  const bay = (R, k, h) => [bx(R, k), bz(R), h, R === C ? R.w : R.z1 - R.z0, R === C ? R.z1 - R.z0 : R.w];   // a bay as a zone [x, z, heading, length, width]
  // the parked cars: [x, z, heading] (the bays of the missions and their neighbours fixed, the rest a set pattern)
  const freeA = [3, 9, 16, 24, 31, 35], freeB = [0, 1, 5, 8, 11, 12, 17, 20, 23, 26, 27, 30, 33, 36, 39], freeC = [2, 8, 13];
  const parked = [];
  for (let k = 0; k < A.n; k++) if (freeA.indexOf(k) < 0) parked.push([bx(A, k), bz(A) - 0.15, (k * 7) % 5 === 1 ? PI / 2 : -PI / 2]);
  for (let k = 0; k < B.n; k++) if (freeB.indexOf(k) < 0) parked.push([bx(B, k), bz(B) + 0.15, (k * 5) % 3 === 0 ? -PI / 2 : PI / 2]);
  for (let k = 0; k < C.n; k++) if (freeC.indexOf(k) < 0) parked.push([bx(C, k), bz(C) + 0.05, 0]);
  TRACK_DEFS.push({
    id: 'parkirisce', school: true, name: 'Celje, Slovenija', theme: 'lot', laps: 1, halfWidth: 6,
    desc: 'Parkirišče šole vožnje: ravno asfaltirano parkirišče s parkirnimi mesti in parkiranimi avtomobili, na sredini prostor za vaje s stožci.',
    en: { name: 'Celje, Slovenia', desc: 'The driving school\'s parking lot: a flat asphalt car park with parking bays and parked cars, room for exercises with cones in the middle.' },   // (the English page: Jezik · Language)
    // the loop round the lot (Core's progress and camera; nothing drives it) and its start
    points: [[-46, -14], [0, -14], [46, -14], [56, -4], [56, 22], [46, 32], [0, 32], [-46, 32], [-56, 22], [-56, -4]], start: [0, 32],
    lot: [-70, -42, 70, 42], rows: [A, B, C], parked, parkedSize: [4.3, 1.8],
    lessons: [
      { id: 'pk1', name: 'Speljevanje in ustavljanje', goal: 'Spelji, zapelji do zelenega polja in se v njem ustavi. Ves avto mora biti v polju.',
        en: { name: 'Moving off and stopping', goal: 'Move off, drive to the green box and stop in it. The whole car must be inside the box.' },
        start: [-30, 6, 0], zone: [10, 6, 0, 6.5, 3.4], limit: 60, medals: [7.5, 10, 15],
        demo: [[1, 10, ['L', 40]]] },
      { id: 'pk2', name: 'Zavoj desno', goal: 'Zapelji skozi prva vrata, zavij desno skozi druga vrata in se ustavi v polju. Za vsak podrt stožec 2 s kazni.',
        en: { name: 'Turning right', goal: 'Drive through the first gate, turn right through the second gate and stop in the box. Every cone knocked over costs 2 s.' },
        start: [-48, -14, 0], cones: [[-24, -16.8], [-24, -11.2], [-8.8, 6], [-3.2, 6]], gates: [[0, 1], [2, 3]], zone: [-6, 20, PI / 2, 6.5, 3.4], limit: 60, medals: [12, 16, 24],
        demo: [[1, 9, ['L', 34], ['A', 8, 90], ['L', 26]]] },
      { id: 'pk3', name: 'Obračanje okoli stožca', goal: 'Zapelji do stožca, obvozi ga in se vrni v polje, iz katerega si speljal.',
        en: { name: 'Turning round a cone', goal: 'Drive to the cone, go round it and come back to the box you started from.' },
        start: [-30, 20, 0], cones: [[8, 20]], around: [[0, 0]], zone: [-30, 20, 0, 6.5, 3.4], limit: 90, medals: [17, 22, 32],
        demo: [[1, 8, ['C', -6, 20, 2, 15.5, 9, 14.5, 14, 17, 14.5, 22, 11, 25.5, 4, 25.5, -4, 21.5, -12, 20, -30, 20]]] },
      { id: 'pk4', name: 'Vzvratna vožnja', goal: 'Vzvratno prevozi hodnik med stožci in se ustavi v polju za njim. Zavora ob mirujočem avtu vklopi vzvratno prestavo.',
        en: { name: 'Reversing', goal: 'Reverse down the lane between the cones and stop in the box behind it. Holding the brake when the car stands still engages reverse.' },
        start: [14, 4, 0], cones: [[-9, 1.8], [-5.5, 1.8], [-2, 1.8], [1.5, 1.8], [5, 1.8], [8.5, 1.8], [-9, 6.2], [-5.5, 6.2], [-2, 6.2], [1.5, 6.2], [5, 6.2], [8.5, 6.2]],
        zone: [-14, 4, 0, 6.5, 3.4], face: 0, stay: [-19, 0.4, 24, 7.6], limit: 60, medals: [10.5, 14, 21],
        demo: [[-1, 4, ['L', 28]]] },
      { id: 'pk5', name: 'Slalom', goal: 'Prevozi slalom med stožci: prvega obvozi po levi, naslednjega po desni in tako naprej. Nato se ustavi v polju.',
        en: { name: 'Slalom', goal: 'Weave through the cones: pass the first on its left, the next on its right and so on. Then stop in the box.' },
        start: [-52, 8, 0], cones: [[-36, 8], [-24, 8], [-12, 8], [0, 8], [12, 8], [24, 8]], slalom: { cones: [0, 1, 2, 3, 4, 5], side: [-1, 1, -1, 1, -1, 1], dir: [1, 0] },
        zone: [44, 8, 0, 6.5, 3.4], limit: 60, medals: [15, 20, 30],
        demo: [[1, 10, ['C', -45, 7, -36, 5.2, -24, 10.8, -12, 5.2, 0, 10.8, 12, 5.2, 24, 10.8, 33, 8.5, 44, 8]]] },
      { id: 'pk6', name: 'Osmica', goal: 'Iz polja med stožcema zapelji osmico: okoli enega stožca v eno smer, okoli drugega v drugo. Nato se ustavi v polju.',
        en: { name: 'Figure of eight', goal: 'From the box between the two cones drive a figure of eight: round one cone one way, round the other the other way. Then stop in the box.' },
        start: [0, 8, -PI / 2], cones: [[-12, 8], [12, 8]], around: [[0, 0], [1, 0]], eight: true, zone: [0, 8, -PI / 2, 6.5, 3.4], limit: 90, medals: [23.5, 31, 45],
        demo: [[1, 7, ['C', 1.5, 2, 7, -2, 14, -2, 19, 3, 19, 13, 14, 18, 7, 18, 2, 13, -2, 4, -7, -2, -14, -2, -19, 3, -19, 13, -14, 18, -7, 17.5, -3, 15.5, -0.6, 12, 0, 9.5, 0, 8]]] },
      { id: 'pk7', name: 'Parkiranje naprej', goal: 'Zapelji naprej na prosto parkirno mesto med avtomobiloma in se ustavi. Ne zadeni parkiranih avtomobilov.',
        en: { name: 'Parking nose in', goal: 'Drive forwards into the free bay between the two cars and stop. Do not touch the parked cars.' },
        start: [-12, -33.25, 0], zone: bay(A, 24, -PI / 2), face: -PI / 2, limit: 60, medals: [9, 13, 20],
        demo: [[1, 5, ['L', 19.55], ['A', 4.6, -90], ['L', 1.65]]] },
      { id: 'pk8', name: 'Vzvratno parkiranje', goal: 'Vzvratno zapelji na prosto parkirno mesto med avtomobiloma, s sprednjim delom proti voznemu pasu.',
        en: { name: 'Reversing into a bay', goal: 'Reverse into the free bay between the two cars, its front facing the aisle.' },
        start: [8, -33.25, 0], zone: bay(A, 31, PI / 2), face: PI / 2, limit: 90, medals: [15, 21, 32],
        demo: [[1, 5, ['L', 27.45]], [-1, 2.5, ['A', 4.4, 90], ['L', 1.85]]] },
      { id: 'pk9', name: 'Bočno parkiranje', goal: 'Vzvratno se vzporedno parkiraj v vrzel ob robniku med avtomobiloma. Ves avto mora biti na parkirnem mestu.',
        en: { name: 'Parallel parking', goal: 'Reverse into the gap by the kerb between the two cars. The whole car must be inside the bay.' },
        start: [-22, 37.6, 0], zone: bay(C, 8, 0), face: 0, limit: 90, medals: [20, 28, 42],
        demo: [[1, 5, ['L', 31.89]], [-1, 1.6, ['A', 5.12, -45], ['A', 5.12, 45], ['L', 0.3]], [1, 1, ['L', 0.9]]] },
      { id: 'pk10', name: 'Končni preizkus', goal: 'Slalom med štirimi stožci, nato skozi vrata ob vzhodnem robu na vozni pas in vzvratno na prosto parkirno mesto. Vse v enem kosu.',
        en: { name: 'Final test', goal: 'A slalom through four cones, then through the gate by the east edge into the aisle and reverse into the free bay. All in one go.' },
        start: [-52, 8, 0], cones: [[-38, 8], [-26, 8], [-14, 8], [-2, 8], [57.5, -24], [66.5, -24]], slalom: { cones: [0, 1, 2, 3], side: [-1, 1, -1, 1], dir: [1, 0] }, gates: [[4, 5]],
        zone: bay(A, 35, PI / 2), face: PI / 2, limit: 150, medals: [34, 45, 65],
        demo: [[1, 9, ['C', -45, 7, -38, 5.2, -26, 10.8, -14, 5.2, -2, 10.8, 10, 8, 38, 6, 54, 2, 61, -6, 62, -22, 61.5, -29, 57, -33, 50, -33.25, 37.45, -33.25]], [-1, 2.5, ['A', 4.4, -90], ['L', 1.85]]] },
    ],
  });
})();
