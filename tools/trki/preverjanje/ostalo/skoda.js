// Independent check of 'boksi-skoda-masa': one Core.carCollide call, the lightest road car head-on into the standing heaviest one (and back)
'use strict';
const L = require('./lib.js'), { C, KMH } = L;
const f = (x, d) => x.toFixed(d == null ? 1 : d);
const ms = C.MODELS.slice().sort((a, b) => a.mass - b.mass);
console.log('modeli po masi:', ms.map(m => `${m.id} ${m.mass}`).join(', '));
function hit(idA, idB, kmh) {
  const A = new C.Car(L.model(idA), { id: 1, phys: 'cs' }), B = new C.Car(L.model(idB), { id: 2, phys: 'cs' });
  for (const c of [A, B]) { c.dmgMode = 2; c.isPlayer = false; c.locked = false; }
  B.place(0, 0, 0); A.place(-(A.m.len + B.m.len) / 2 + 0.05, 0, 0); A.vx = kmh / KMH; A.vz = 0; B.vx = B.vz = 0;
  const a0 = A.vx, b0 = B.vx; const imp = C.carCollide(A, B);
  return { idA, idB, mA: A.m.mass, mB: B.m.mass, kmh, imp, dA: (A.dmg || 0) * 100, dB: (B.dmg || 0) * 100, dvA: (A.vx - a0) * KMH, dvB: (B.vx - b0) * KMH };
}
const light = process.argv[2] || ms[0].id, heavy = process.argv[3] || ms[ms.length - 1].id;
for (const [a, b] of [[light, heavy], [heavy, light], ['rally', 'rally']]) for (const kmh of [36, 60, 100, 200]) { const r = hit(a, b, kmh);
  console.log(`${r.idA} ${r.mA} kg -> ${r.idB} ${r.mB} kg pri ${kmh} km/h: trk ${f(r.imp || 0)} m/s, skoda A ${f(r.dA)} %, B ${f(r.dB)} %, dv A ${f(r.dvA)}, B ${f(r.dvB)} km/h`); }
