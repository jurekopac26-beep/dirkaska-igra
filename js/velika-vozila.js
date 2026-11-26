// Velika vozila: skupni model fizike težkih vozil (#1061). Vklop samo z model.heavy (true ali predmet s popravki): brez njega
// avto vozi kot doslej. Viri in »brez vira«: docs/velika-vozila-fizika.md. Priklop v js/core.js: Car (za), step (pred, po), Race (prevrnitev).
// Vse vrednosti so iz virov ali označene »brez vira«. AI (seja 2): lasten profil hitrosti (aiProf) brez sprememb v aiDrive.
var VelikaVozila = (function () {
  'use strict';
  const G = 9.81;
  // masa: polna masa kompleta [t]; srt: statični prag prevrnitve [g]; vir: kratko (cela navedba v docs/velika-vozila-fizika.md)
  const VOZILA = {
    cisterna: { masa: 37.3, srt: 0.42, vir: 'UNECE R111: nagibna miza 23° (tan 23° = 0,42); masa do 40 t: 96/53/ES' },
    zrcalni:  { masa: 60,   srt: 0.40, vir: 'brez vira (v razponu dvojnih sklopov 0,376–0,395 g, FHWA 2004); masa: EMS 60 t, 96/53/ES' },
    avtovoz:  { masa: 25.3, srt: 0.38, vir: 'brez vira (nad najmanj 0,35 g, NZTA); masa tovora brez vira' },
    vetrnica: { masa: 29.3, srt: 0.45, vir: 'brez vira (razpon UMTRI-99-19); krilo 17,74 t: NREL/TP-500-38060' },
    hrast:    { masa: 40,   srt: 0.31, vir: 'UMTRI-99-19: hlodovina 0,23–0,31 g; masa do 40 t: 96/53/ES' },
    lastovka: { masa: 18,   srt: 0.53, vir: 'UNECE R107: nagib 28° (tan 28° = 0,53); masa 18 t: 96/53/ES' },
    gasilec:  { masa: 16,   srt: 0.50, vir: 'brez vira (EN 1846-2, vrednost ni javna); masa: razred M do 16 t, EN 1846-1' }
  };
  const K = {
    vLim: 130 / 3.6,        // najvišja hitrost 130 km/h (možnost 2, pravilo igre; cestni omejevalnik je nižji)
    pojemek: 6.5,           // največji pojemek s hladnimi zavorami [m/s²] (brez vira; nad R13 najmanj 5,0)
    pojemekMin: 5.0,        // R13 tip 0, N3 in M3: najmanj 5,0 m/s²
    fade: [350, 550],       // pregrete zavore [°C] (brez vira)
    fadeMin: 0.60,          // vroče zavore še najmanj 60 % hladnih (UNECE R13, preizkus tipa I)
    motZav: 0.5,            // motorna zavora in zaviralnik prevzameta polovico dela (brez vira)
    srtT: 0.6,              // prevrne po ~0,6 s nad pragom (brez vira)
    opoz: 0.85,             // opozorilo pri 85 % praga
    kazen: 10,              // časovna kazen ob prevrnitvi [s] (brez vira, pravilo igre)
    aiRez: 0.8,             // AI: hitrost v ovinku do 80 % praga (brez vira, pravilo igre; 0,85 v testu preveč prevrnitev po trkih)
    ai: true,               // AI vozi po lastnem profilu (aiProf); false samo za primerjavo v testu
    aiPlin: 0.7,            // AI: nad 70 % praga (izmerjeni bočni pospešek) popusti plin (brez vira, pravilo igre)
    aiZav: 0.85,            // AI: nad 85 % praga (kot opozorilo voznika) zavira (brez vira, pravilo igre)
    tau: 0.15,              // glajenje bočnega pospeška [s]
    udar: 2 * G             // nad tem pospeškom je sunek trka, ne vožnja [m/s²]
  };
  // stanje enega vozila; null, če vozilo ni težko
  function za(c, model) {
    const h = model && model.heavy;
    if (!h) return null;
    const d = Object.assign({}, VOZILA[model.id] || {}, typeof h === 'object' ? h : {});
    if (!(d.srt > 0)) return null;
    return { srt: d.srt, masa: d.masa || 0, brT: 20, kCap: 1, aLat: 0, nad: 0, opoz: false, pad: false, bS: 0, vx: 0, vz: 0, spd: 0 };
  }
  const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  // zavore: delež hladne moči ob dani temperaturi (najmanj fadeMin)
  const fadeK = (T) => 1 - (1 - K.fadeMin) * sstep(K.fade[0], K.fade[1], T);
  // pred korakom fizike: zavorna moč (omejitev pojemka, pregrevanje), stanje za meritev po koraku
  function pred(c, dt, trk) {
    const v = c.vv; if (!v) return;
    if (K.ai && !c.isPlayer && trk && trk.rk) { aiProf(c, v, trk); aiVoznik(c, v); }
    v.bS = c.brakeG; c.brakeG *= v.kCap * fadeK(v.brT);
    v.vx = c.vx; v.vz = c.vz; v.spd = Math.hypot(c.vx, c.vz);
  }
  // AI kot voznik tovornjaka: ob nagibanju (izmerjeni bočni pospešek, tudi po trku ali na drugi liniji) popusti plin in zavira; samo vnos, fizika ista
  function aiVoznik(c, v) {
    const r = v.aLat / (G * v.srt); if (!(r > K.aiPlin)) return;
    c.inThr = Math.min(c.inThr || 0, Math.max(0, 1 - (r - K.aiPlin) / (K.aiZav - K.aiPlin)));
    if (r > K.aiZav) c.inBrk = Math.max(c.inBrk || 0, Math.min(1, (r - K.aiZav) * 4));
  }
  // po koraku: izmerjena pojemek in bočni pospešek, segrevanje zavor, nagib na progah brez gradeForce, prag prevrnitve
  function po(c, dt, trk) {
    const v = c.vv; if (!v || !(dt > 0)) return;
    c.brakeG = v.bS;
    const tla = !c.air;
    let spd = Math.hypot(c.vx, c.vz);
    // nagib: težko vozilo čuti klanec na vsaki progi z višino (na progah z gradeForce ga že računa jedro)
    if (tla && trk && trk.hasElev && !(trk.def && trk.def.gradeForce) && spd > 0.5 && c.q) {
      const gH = (c.gradeNow || 0) * (Math.cos(c.h) * (c.q.tx || 0) + Math.sin(c.h) * (c.q.tz || 0));
      const a = -G * gH / Math.sqrt(1 + gH * gH), s2 = Math.max(0, spd + a * dt), f = s2 / spd;
      c.vx *= f; c.vz *= f; spd = s2;
    }
    // omejevalnik hitrosti
    if (spd > K.vLim) { const f = K.vLim / spd; c.vx *= f; c.vz *= f; spd = K.vLim; }
    const dv = (v.spd - spd) / dt, udar = Math.abs(dv) > K.udar, brk = (c.inBrk || 0) > 0.1 && tla && !udar;   // (udar: trk v zid ali avto, ni zaviranje)
    // pojemek s hladnimi zavorami do K.pojemek: počasna prilagoditev zavorne moči (brez skokov)
    if (brk && v.spd > 3) {
      const cap = K.pojemek * fadeK(v.brT);
      if (dv > cap) v.kCap = Math.max(0.3, v.kCap * (1 - 2 * dt));   // (spodnja meja: zavore nikoli skoraj brez moči)
      else if (dv < cap * 0.9) v.kCap = Math.min(1, v.kCap * (1 + dt));
    }
    // segrevanje zavor: delo zavor na enoto mase (polovico prevzame motorna zavora), hlajenje z vozno hitrostjo
    const aB = brk ? Math.max(0, dv) * (1 - K.motZav) : 0;
    v.brT += (aB * spd * 0.094 - (v.brT - 20) * (0.005 + 0.0006 * spd)) * dt;
    if (v.brT > 850) v.brT = 850; if (v.brT < 20) v.brT = 20;
    // bočni pospešek iz zasuka hitrosti (enako v obeh fizikah)
    let aL = 0;
    if (spd > 1 && v.spd > 1) { const cr = v.vx * c.vz - v.vz * c.vx; aL = Math.abs(cr) / (v.spd * dt); }
    if (udar || aL > K.udar) aL = v.aLat;   // (sunek trka ni ovinek)
    v.aLat += (aL - v.aLat) * Math.min(1, dt / K.tau);
    const r = tla ? v.aLat / (G * v.srt) : 0;
    v.opoz = r > K.opoz;
    v.nad = r > 1 ? v.nad + dt : Math.max(0, v.nad - 2 * dt);
    if (v.nad >= K.srtT && !v.pad) { v.pad = true; v.nad = 0; }
  }
  // AI: največja hitrost v ovinku s krivino k [1/m] (pod pragom prevrnitve)
  function vOvinek(c, k) {
    const v = c && c.vv; if (!v || !(Math.abs(k) > 1e-5)) return Infinity;
    return Math.min(K.vLim, Math.sqrt(K.aiRez * v.srt * G / Math.abs(k)));
  }
  // AI: zavorna pot od hitrosti v0 do v1 [m] (pojemek ob trenutni temperaturi zavor)
  function zavPot(c, v0, v1) {
    const v = c && c.vv; if (!v || !(v0 > v1)) return 0;
    const a = K.pojemek * fadeK(v.brT) * 0.8;
    return (v0 * v0 - v1 * v1) / (2 * a);
  }
  // AI: profil hitrosti težkega vozila (c.vprof, ki ga bere aiDrive): profil dirke ali modela, omejen z vOvinek na krivini idealne linije
  // (rk) in z zavorno potjo nazaj od vsakega ovinka (pojemek ob temperaturi zavor, na klancu z višino tudi sila teže, kot v speedProfile).
  // Na novo se izračuna, ko dirka da nov profil (vreme) ali ko se zavore segrejejo ali ohladijo za več kot 5 % moči. Samo AI, ne igralec.
  function aiProf(c, v, T) {
    const f = fadeK(v.brT);
    if (c.vprof && c.vprof === v.prof && v.profT === T && Math.abs(f - v.profF) < 0.05) return;
    if (c.vprof !== v.prof) v.src = c.vprof || null;
    const N = T.N, rk = T.rk, rds = T.rds, src = v.src, gr = T.hasElev ? T.grade : null, aB = K.pojemek * f * 0.8;
    const p = new Float32Array(N), vk = Math.sqrt(K.aiRez * v.srt * G);
    for (let i = 0; i < N; i++) {   // (krivina povprečena čez 5 točk: brez skokov na šivih poligona)
      let kk = 0; for (let j = -2; j <= 2; j++) kk += Math.abs(rk[((i + j) % N + N) % N]);
      kk = Math.max(kk / 5, 1e-5);
      p[i] = Math.min(K.vLim, vk / Math.sqrt(kk), src ? src[i] : Infinity);
    }
    const a = (i) => gr ? Math.max(aB * 0.6, aB + G * gr[i]) : aB;
    if (T.open) for (let i = N - 2; i >= 0; i--) p[i] = Math.min(p[i], Math.sqrt(p[i + 1] * p[i + 1] + 2 * a(i) * rds[i]));
    else for (let n = 0; n < 3; n++) for (let i = N - 1; i >= 0; i--) { const b = (i + 1) % N; p[i] = Math.min(p[i], Math.sqrt(p[b] * p[b] + 2 * a(i) * rds[i])); }
    v.prof = c.vprof = p; v.profT = T; v.profF = f;
  }
  // po reševanju (prevrnitev): stanje nazaj, zavore ostanejo vroče
  function reset(c) { const v = c && c.vv; if (v) { v.pad = false; v.nad = 0; v.aLat = 0; v.opoz = false; } }
  return { VOZILA, K, za, pred, po, fadeK, vOvinek, zavPot, aiProf, aiVoznik, reset };
})();
if (typeof module !== 'undefined') module.exports = VelikaVozila;
