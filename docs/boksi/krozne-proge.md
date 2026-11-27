# Boksi na vseh krožnih progah (croatiadata)

Odločitve uporabnika (13. in 14. 11. 2026): bokse imajo samo dirkališča v krogu; odprte ceste, gorske proge in kronometri ne.

## Načrt
1. Preveri pet prog brez boksov (Livorno, Nürburg, Hakone, Kildare, Sosnová): prava proga (brez `test`/`pending`), dirkališče v krogu.
2. Bokse po vzoru Spa (`pit`, `pitRow`: boksarska steza, stavba z boksi, mehaniki), lega po OSM (samo OSM in javni DEM).
   Brez imen, logotipov in napisov. Koda v datoteki proge in kratkih priklopih (manj sporov s PR Realizma).
3. Fizika vožnje ostane; spremembe poti tekmecev ali golden dirk samo zaradi nove steze; obremenitev v mejah `perf.json`.
4. Slike zdaj/potem (kamera za avtom) na stran Odločitve; pred `main` uporabnikov »ok«.

## Proge
| Proga | Dirkališče v krogu? | Boksi |
|---|---|---|
| Kildare, Irska | da (reli kros, 8 krogov) | da: steza in 13 boksov po OSM (`def.pit`, `pitRow`), garaže in stolp že iz OSM; odobreno 26. 11. (#1163, `boksi-kildare`) |
| Sosnová, Češka | da (7 krogov) | da: kratka steza ~75 m pred garažami, 7 boksov (tekmeci si jih delijo), boksarski zid; garaže in depo 5,6 m nazaj; brez vira (izjema, odločitev Mateja 27. 11.) (#1163, `boksi-sosnova`) |
| Nürburg, Nemčija | zaprta proga v krogu (1 krog) | ne: brez boksov (krog po severni zanki mimo boksov ne pelje); odločeno 26. 11. (#1163, `boksi-nring` = 1) |
| Livorno, Italija | ne: krog po javnih cestah | ne (odprta cesta) |
| Hakone, Japonska | ne: krog po javnih gorskih cestah | ne (gorska, odprta cesta) |

- **Izjema Sosnová:** boksarska steza, boksarski zid in pomik depoja za 5,6 m niso v OSM: brez vira (izjema, odločitev Mateja 27. 11.); drugi deli proge ostanejo po OSM.
