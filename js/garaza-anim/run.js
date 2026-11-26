// Garaža #1084: en klic za animacije v js/garaza-anim/<ime>.js. V js/garage3d.js (fitPart) ena vrstica pred regalTwoShow:
// GarazaAnim.run(el, C, H) — generator; true, ko je predstava za `el` odigrana (fitPart konča), false, ko animacije ni (gre v regalTwoShow).
// C kot pri regalTwoShow, H notranja orodja garaže (cur, lift, scene, puffs, hud, DELI kot getterji). Vsaka animacija dobi argumente v
// svojem vrstnem redu, vsebine animacij ta datoteka ne spreminja. Nova animacija: datoteka v js/garaza-anim/, vrstica v ARGS, skripta v garaza.html.
// Dim gum (I5, GarazaDimGum.show) ni tu: teče v predstavi gum po spustu avta, ne namesto regalTwoShow.
(function (g) {
  const A = g.GarazaAnim = g.GarazaAnim || {};
  const ARGS = {
    vzmeti: (C, H) => [H, C],          // I1
    amortizerji: (C, H) => [C, H],     // I2
    stabilizatorji: (C, H) => [C, H],  // I3
    zamasek: (C, H) => [C, H],         // I4
  };
  A.run = function* (el, C, H) {
    const f = ARGS[el] && A[el];
    if (typeof f !== 'function') return false;
    yield* f.apply(A, ARGS[el](C, H));
    return true;
  };
})(typeof window !== 'undefined' ? window : globalThis);
