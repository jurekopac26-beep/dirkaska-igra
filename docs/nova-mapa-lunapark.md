# Nova mapa: vožnja z napravami v lunaparku

Izbira uporabnika 5. 11. 2026 (iz sklopa 10 nove mape »za pozneje«, `slike-predlogi/koda/PREDAJA-KODA.md` na veji `slike-predlogi`).
Veja `nova-mapa/lunapark-voznja`, osnutek pull requesta #348 »Nova mapa: vožnja z napravami v lunaparku«.

## Cilj
Igralec se v lunaparku nove mape (NEW VERSION · TEST 1) zapelje z napravo po vzoru gondole in vlaka okoli vulkana (PR #272, `js/nvride.js`):
ustavi avto v označenem okvirju, naprava ga pelje en krog ali eno vožnjo s kamero za avtom oziroma za napravo, nato se vrne v avto.

## Stanje (sproti)
- 5. 11.: veja in osnutek odprta; preučeni `js/nvpark.js` (naprave), `js/nvride.js` (gondola, vlak) in priklopi v `js/game.js`.
- 5. 11.: napisan `js/nvfair.js` (panoramsko kolo in veliki vrtiljak), priklopi v `js/nvpark.js`, `js/nvride.js`, `js/game.js` (nalaganje), `index.html`.
- 5. 11.: preverjeno v igri (slike kolesa od spodaj in z vrha, vrtiljak s prosojno streho); napisan test `tests/browser/nvfair.test.mjs` (v `tests/run.js`).
- 5. 11.: obremenitev (meritev kot `perf.test.mjs` newmap, 844 × 390, pri kolesu, ploščadi, vrtiljaku in v parku, pred/po): ploščad in njen rob sta zdaj del visečega mesha (prej svoj klic risanja in senca), kolo brez notranjega obroča, tanjše palice; klici risanja enaki kot prej (±1), oglišč do ~4 tisoč več (~0,3 %). Nova vožnja šele, ko avto zapusti okvir (prej ga je kolo ob zidu nog vzelo spet).
- 5. 11.: spojen svež `main` (spor samo v seznamu testov `tests/run.js`); povezani testi lokalno.

## Kako deluje (`js/nvfair.js`)
- **Panoramsko kolo** (`J.KOLO`, os vzdolž x, kolo obrnjeno kot prej): zahodno od kolesa je v tleh **dvižna ploščad** z rumenim okvirjem in puščico proti kolesu. Avto se ustavi na njej (vzdolž osi, nos proti kolesu ali stran) in miruje 0,8 s, ko je koš za avto spodaj: ploščad ga dvigne do tal koša, avto zdrsne v koš (vzdolž osi), kolo se zavrti enkrat (~20 s), avto zdrsne nazaj na ploščad, ploščad se spusti. Koš je rdeča kletka, odprta na koncih; drugih 11 kabin visi kot prej. Pod kolesom med nogami je stena.
- **Veliki vrtiljak** (`J.VRT`): vzhodno od njega je rumen okvir na travi s puščico proti vrtiljaku. Avto se ustavi v njem (nos proti vrtiljaku ali stran) in miruje 0,8 s, ko je mesto za avto pri okvirju: avto zdrsne na ploščo (nos proti sredini), vrtiljak se zavrti enkrat (~14 s), avto zdrsne nazaj v okvir. Streha je med vožnjo prosojna. Na mestu za avto ni konja in droga. Rob plošče je stena.
- Brez voznika se napravi vrtita sami; ko je avto blizu (14 m in počasi ali 6 m), se ustavita na mestu za nalaganje in čakata.
- Kamera: ena, za avtom (sledi višini avta). Gibljivi deli so po en mesh (vertex colours): pri kolesu vrtilni del ter koš s kabinami, ploščadjo in robom; pri vrtiljaku streha, drogovi, konji. Mirni deli (noge, os, ploščad vrtiljaka, okvir) se zlijejo s parkom (`js/nvbake.js`).

## Odločitve (namesto vprašanj uporabniku, najpreprostejša možnost)
- Napravi: **panoramsko kolo** in **veliki vrtiljak** (najlažji); »vlakec smrti« v parku ni (stari rudniški vlak je zdaj vlak okoli vulkana, ta se že vozi). Padajoči stolp ostane za pozneje.
- Kolo ostane na istem mestu in enako obrnjeno; avto leži v košu vzdolž osi, zato je kamera za avtom obrnjena proti kolesu (brez posebne kamere). Kolo je zato debelejše (obroča 6,1 m narazen, koš 5,6 m).
- Koš je spodaj ~2,3 m nad tlemi okvirja (pod kolesom se dviga hrib drift kroga), zato je okvir dvižna ploščad (kot gondola s pregibnimi vrati: vidna mehanika namesto lebdenja).
- En obrat na vožnjo; avto mora potem okvir zapustiti, preden gre spet (pri kolesu je pred ploščadjo zid nog, zato avto, ki je zapeljal noter naprej, odpelje vzvratno; brez vrtljive ploščadi, najpreprosteje). Prevelik avto (dolžina > 5,2 m ali širina > 2,5 m) se ne pelje.
- Brez napisov na napravah in brez kartice: samo rumen okvir (kot pri vlaku).

## Kako testirati
- `index.html` → NEW VERSION · TEST 1, v lunapark: panoramsko kolo stoji ob progi (rumena ploščad s puščico je tik ob asfaltu), veliki vrtiljak je tisti z rdeče-belo streho (rumen okvir na travi ob njem). Zapelji v okvir s sredino avta, poravnano s puščico (nos proti napravi ali stran), in ustavi.
- Hitro v konzoli: `P = __game.race.player; s = NVFair.spot('wheel'); P.place(s.x, s.z, s.h)` (ali `'carousel'`), stanje `NVFair.state()`.
- Test: `node tests/browser/nvfair.test.mjs` (~2 min); kolo se vrti tudi v `tests/browser/nvride.test.mjs`.
