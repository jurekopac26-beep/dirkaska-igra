// sonda za koda/live.mjs: __adv(kamera, s, avto) postavi kamero {p, t, fov}, igro pomakne za s sekund (naprave lunaparka in stroji gradbišča
// se premikajo le blizu avta in v pogledu, zato vmes Render.frame in NVRide.frame) in nariše; avto = [x, z, smer] ga prej postavi
window.__adv = (cam, sec, car) => { const g = __game, P = g.race.player; if (car) { P.place(car[0], car[1], car[2]); P.vx = P.vz = 0; }
  Render.camera.far = Math.max(Render.camera.far, 2000);
  Render.setShot({ px: cam.p[0], py: cam.p[1], pz: cam.p[2], tx: cam.t[0], ty: cam.t[1], tz: cam.t[2], fov: cam.fov || 50, fogD: 600, gy: 0, near: 0.5 });
  const NR = typeof NVRide !== 'undefined' ? NVRide : null;
  for (let i = 0; i < Math.round(sec * 60); i++) { g.sim(1 / 60, false, 0, 0, 0); if (i % 6 === 0) { Render.frame(1 / 60, 1, P, 'tv', {}); if (NR) NR.frame(1 / 60, 1, P, false); } }
  Render.frame(1 / 60, 1, P, 'tv', {}); if (NR) NR.frame(1 / 60, 1, P, false); return 'adv ' + sec; };
'ok'
