// Velika vozila: skupni model fizike težkih vozil (#1061). Vklop samo z model.heavy (true ali predmet s popravki): brez njega
// avto vozi kot doslej. Viri in »brez vira«: docs/velika-vozila-fizika.md. Priklop v js/core.js: Car (za), step (pred, po), Race (prevrnitev).
// Vse vrednosti so iz virov ali označene »brez vira«; uglaševanje 7 vozil in AI je seja 2.
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
    aiRez: 0.85,            // AI: hitrost v ovinku do 85 % praga
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
    v.bS = c.brakeG; c.brakeG *= v.kCap * fadeK(v.brT);
    v.vx = c.vx; v.vz = c.vz; v.spd = Math.hypot(c.vx, c.vz);
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
  // po reševanju (prevrnitev): stanje nazaj, zavore ostanejo vroče
  function reset(c) { const v = c && c.vv; if (v) { v.pad = false; v.nad = 0; v.aLat = 0; v.opoz = false; } }
  return { VOZILA, K, za, pred, po, fadeK, vOvinek, zavPot, reset };
})();
if (typeof module !== 'undefined') module.exports = VelikaVozila;
