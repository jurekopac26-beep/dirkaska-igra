/* =========================================================================
   GARAGE SHOP — what the garage sells (the menus of the parts tapped in garaza.html), read from the game's list of parts
   (js/data/deli.js, DELI_DATA: the same list the cars draw their parts from, docs/deli.md): for the elements the garage shows (on the
   regal, the cabinet, the circles) their short names, the game's upgrade each counts toward (k: motor, gume, zavore, aero; none: looks and
   small things), four categories (the menu's tabs) of four options each, from the cheapest to the dearest. Each option: [Slovenian,
   English] name, its price in euros, what it gives ([sl, en]), its number (the power, grip or braking it adds in %: from what it
   gives; the tyres none, their tab says it), 1 if it stands in the garage (the regal). An option's number in the list (docs/deli.md:
   1 .. 16) is its tab × 4 + its place + 1. Read by js/garage.js.
   ========================================================================= */
(function () {
  'use strict';
  // (the elements: their short names in the menu, the upgrade each counts toward)
  const SHOWN = { gume: [['Gume', 'Tyres'], 'gume'], platisca: [['Platišča', 'Rims'], ''], auspuh: [['Auspuh', 'Exhaust'], 'motor'], krilo: [['Zadnje krilo', 'Rear wing'], 'aero'],
    aero: [['Aero paket', 'Aero kit'], 'aero'], filter_zraka: [['Filter zraka', 'Air filter'], 'motor'], cip: [['Čip', 'ECU chip'], 'motor'], turbo: [['Turbo', 'Turbo'], 'motor'],
    akumulator: [['Lahek akumulator', 'Light battery'], ''], vzmeti: [['Vzmeti', 'Springs'], ''], amortizerji: [['Amortizerji', 'Dampers'], ''], stabilizatorji: [['Stabilizatorji', 'Anti-roll bars'], ''],
    zavore: [['Zavore', 'Brakes'], 'zavore'], hupa: [['Hupa', 'Horn'], ''], dim_gum: [['Dim gum', 'Tyre smoke'], ''], barva: [['Barva', 'Paint'], ''] };
  // (an option's number: the first per cent of power, grip or braking in what it gives)
  const pct = (s) => { const m = /(?:moč|oprijem(?: v ovinku)?)\s*\+([0-9]+(?:,[0-9]+)?)\s*%|\+([0-9]+(?:,[0-9]+)?)\s*% zavorne/.exec(s || ''); return m ? +(m[1] || m[2]).replace(',', '.') : 0; };
  const EL = {}, DATA = typeof DELI_DATA !== 'undefined' ? DELI_DATA : { elementi: [] };
  for (const e of DATA.elementi) { const S = SHOWN[e.id]; if (!S) continue;
    EL[e.id] = { n: S[0], k: S[1], c: e.kategorije.map(k => [[k.ime, k.ime_en], k.moznosti.map(m => { const o = [[m.ime, m.ime_en], m.cena_eur, [m.kaj_nudi || '', m.kaj_nudi_en || ''], pct(m.kaj_nudi)]; if (m.na_regalu) o.push(1); return o; })]) }; }
  // the service's four (the menu's tiles): [sl, en] name, what it is ([sl, en])
  const SERVICE = [[['Pranje', 'Wash'], ['Pena, voda, vosek', 'Foam, water, wax']], [['Karoserija', 'Bodywork'], ['Praske in udrtine', 'Scratches and dents']],
    [['Motor in olje', 'Engine and oil'], ['Olje, filtri, svečke', 'Oil, filters, spark plugs']], [['Popoln servis', 'Full service'], ['Vse troje, −15 %', 'All three, −15 %']]];
  window.GarageShop = { EL, SERVICE };
})();
