# Proge za cisterno: pet zelo kratkih prog s prepadom (ena na celino)

Načrt, odločitve, podatki in stanje petih prog, ki jih je uporabnik naročil 8. 11. 2026 (račun biketraveler, seja session_01UuPU9E6TWHtyPQSy4mmvyV, veja `claude/bold-cannon-qreefu`, en pull request).

## Odločitve uporabnika (8. 11. 2026)

- **Prošnja:** »Začni z delom 5 prog, v vsakem kontinentu 1. Proge naj bodo zelo kratke, do 500 m, in naj bodo težke, ozke, z neravnim podnom, ozke s prepadom; ceste naj bodo ozke zaradi razgibanega terena, težko prevozne za vožnjo po njih s cisterno. Proge naj bodo tako težke, da s cisterno ne dirkaš, ampak se trudiš, da speljes po progi do cilja.«
- **Nabor prog (izbira A):** Svalvogar, Islandija (Evropa); Fairy Meadows, Pakistan (Azija); Manchewe, Malavi (Afrika); Yungas, Bolivija (Amerika); Tapini, Papua Nova Gvineja (Oceanija).
- **Vozilo (izbira »Samo cisterna«):** na teh petih progah igra vedno da TITAN CISTERNO (`js/cars/cisterna.js`, `docs/titan-cisterna.md`), tudi če je igralec nima; izbire vozila ni. Samo vožnja na čas do cilja, brez tekmecev in prometa; medalje so za cisterno.
- **Ovinki (izbira »Prevozni naprej«):** najožji ovinki so odprti toliko, da jih cisterna zvozi brez vzvratne vožnje, a samo počasi in natančno: prikolica reže notranji rob, zunaj je prepad. Test preveri, da avtopilot pripelje cisterno do cilja.

**Izjeme od splošnih pravil** (`CLAUDE.md`), ki jih prinese ta prošnja: proge so dolge do 500 m (ne 1–5 km); izletne cone nimajo, prepad tik ob robu je namen prog. Pravilo »ena proga na državo« velja: vseh pet držav je brez proge v igri. Yungas je bil »ne začni« (brez izletne cone, 5. 11. 2026); kot progo za cisterno ga je uporabnik izbral 8. 11. 2026, zato drugi odseki Yungasa (kratke proge C1, Nove proge 6) odpadejo. V vrsti za `main` gredo te proge zadnje, kot vse proge, vseh pet v enem pull requestu.

Seja `nove-proge-1-0` Del 4 (pet kratkih prog do 1 km zunaj Evrope: Vietnam, Filipini, Jordanija, Sejšeli, Gvatemala) je druga tema; držav ne deli s to.

## Proge

Odseki so iz OpenStreetMap (ceste, smer vožnje od začetka do konca), višine iz Copernicus DEM GLO-30. Merila: **°/km** kot v `docs/proge-pregled.md`; **prepad** je padec terena 30 m (v oklepaju 50 m) od osi ceste na strani prepada; **polica** je delež dolžine, kjer ena stran pade več kot 12 m na 30 m, druga pa se dvigne več kot 6 m (cesta v steni); **polmer** je najmanjši polmer osi na 30 m.

| # | `id` | Ime | Angleško | Celina | Cesta OSM (podlaga) | Začetek → konec (lat, lon) | Klanec | Ovinki | Prepad, polica |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `svalvogar` | Svalvogar, Islandija | Svalvogar, Iceland | Evropa | Svalvogavegur, `ref` 622 (makadam) | 65.91761, −23.76976 → 65.91995, −23.77853 | ravno, ~40–48 m | 681 °/km, polmer 35 m | morska stena levo, 18 m (31 m); polica 100 % |
| 2 | `fairymeadows` | Fairy Meadows, Pakistan | Fairy Meadows, Pakistan | Azija | jeep cesta do Fairy Meadows (makadam) | 35.45187, 74.60018 → 35.44976, 74.60066 | vzpon +13 % | 2 serpentini (polmer 8 m), 1816 °/km | 33 m (51 m); polica 98 % |
| 3 | `manchewe` | Manchewe, Malavi | Manchewe, Malawi | Afrika | Golodi Road (zemlja) | −10.59617, 34.14158 → −10.59551, 34.14150 | spust −9 % | 2 serpentini (polmer 10 m), 1518 °/km | 22 m (37 m); polica 98 % |
| 4 | `yungas` | Yungas, Bolivija | Yungas, Bolivia | Južna Amerika | Camino Nor Yungas, en pas (utrjen makadam) | −16.28433, −67.79921 → −16.28109, −67.79720 | spust −7 % | polmer 20 m, 1400 °/km | 43 m (67 m); polica 100 % |
| 5 | `tapini` | Tapini, Papua Nova Gvineja | Tapini, Papua New Guinea | Oceanija | Tapini Highway (zemlja) | −8.42476, 146.95757 → −8.42250, 146.95929 | spust −5 % | polmer 24 m, 1032 °/km | 47 m (69 m); polica 100 % |

Rezervna odseka: Fairy Meadows 1,4 km nižje (ravno, brez serpentin, polmer 16 m, polica 88 %), Tapini na začetku ceste (+8 %, ena serpentina). Imena: brez imen oseb (npr. kraj Livingstonia ob Manchewe je po osebi, zato ga ni v igri), brez imen prireditev in podjetij.

## Skupni gradniki

- **Vozilo proge** `def.vehicle: 'cisterna'` (datoteka proge): igra na progi vedno da to vozilo, ne glede na izbiro in lastništvo v karieri (start dirke v `js/game.js`, meni pokaže vozilo proge); izziv prijatelja in posnetek nosita isto vozilo.
- **Samo vožnja na čas:** `timeTrial: true` brez `modes`; brez tekmecev in prometa; medalje iz časa avtopilota s cisterno (`tests/<id>.test.js`).
- **Ozka cesta:** pol širine ~2,2–2,6 m (`widths`), serpentine odprte na polmer, ki ga cisterna zvozi naprej (`TLK.rMin` 11 m ob osi vlačilca; prikolica reže notranji rob).
- **Prepad:** `drops` na strani prepada, brez ograje (avto pade, `Race._fall`); na strani stene skala.
- **Neraven pod:** številne majhne grbine (`bumps`) na makadamu; po potrebi nov nagib odprte ceste proti prepadu (`bank` zdaj velja samo za zaprte proge).
- **Test:** pomočnik za 500 m progo s cisterno (samo `tt`, avtopilot s cisterno pride do cilja, ne pade čez rob), po vzoru `tests/lib/gore.js`.

## Postopek in stanje

1. Načrt, osnutek pull requesta, skupni gradniki in proga 1 (Svalvogar). **V delu** (8. 11. 2026).
2. Progi 2 in 3 (Fairy Meadows, Manchewe: serpentine).
3. Progi 4 in 5 (Yungas, Tapini).
4. Slike za meni, `docs/proge-pregled.md`, zasluge, vrsta za `main`.

Vsak korak, ki ga ta seja ne konča, nadaljuje nova seja po tem načrtu (»Nadaljuj korak N po docs/proge-cisterna.md«).
