# Maketa: izbira proge

Interaktivna maketa novega zaslona za izbiro proge (načrt v `docs/meni-izbira-proge.md`). Ni del igre: igra je v `js/menu.js`, ta mapa je predloga za sklope 1–6 in za sklop vremena.

## Ogled

Strežnik iz korena repozitorija, nato `maketa-menija/izbira-proge/index.html`:

- `#t=<proga>&cam=<1-3>&wx=<vreme>` izbere progo (`id` iz igre: z ročno maketo `vrsic`, `nring`, `spa`, `pikes`, `suzuka`, `rbring`, `ouninpohja`, ostale prave proge iz `vse-proge.js`), kamero in vreme (`dry`, `rain`, `change`, `storm`, `snow`); `&open=izbor` ali `&open=zemlja` ob nalaganju odpre hitro izbiro ali 3D Zemljo.
- Dotik ikone vremena spremeni cel zaslon (dež, strela, mavrica, sneg na gumbih, tabli in avtu, moker pod z odsevom).
- Gumbi kamer in zastavi sosednjih prog zamenjajo sliko ali progo na mestu, brez ponovnega nalaganja strani (`window.MOCK(T)` zgradi nov zaslon, star se pod njim umakne): globus v glavi se zavrti do nove proge, tabla in avto prideta v sliko s strani, vreme in kamera ostaneta, naslov (`#t=…`) se zamenja s `history.replaceState`. Poteg po sliki levo odpre naslednjo progo, desno prejšnjo; slike sosed se naložijo vnaprej. Zastava v vrstici odpre hitro izbiro države in proge, globus v glavi 3D Zemljo (vrtenje, približanje, izbira države in proge); Race! in puščica nazaj le pokažeta obvestilo.
- Ležeči zaslon (širši od 1,3 × višina, npr. telefon od 640 × 360 do 915 × 412): vrtiljak prog (5.1, točka 9 v `docs/meni-izbira-proge.md`), narisan za 892 × 412 in pomanjšan na sredino zaslona (`window.LAYOUT()`, `LY`, CSS `body.land` z `--ox`, `--oy` v `index.html`). Izbrana proga je kartica na sredini (slika izbrane kamere, graf, vreme zgoraj desno, števec, gumbi kamer, zlat rob) nad svojo zamegljeno sliko čez cel zaslon; ob njej sosedi s sliko, zastavo, imenom, državo in dolžino (`T.ring`; slika `cams[2]` ali `cams[1]` iz `orodja/vse-proge.js`), na vsaki strani še ena do pol čez rob. Glava z imenom na sredini, vreme v vrsti v izbrani kartici (izbrano z napisom prvo, `wxColumn` ga doda v `#map`; po vrtenju je na novi izbrani), spodaj vrstica, *Race!* in avto levo; table in zastav sosed ni. Poteg po kartici, dotik sosede ali puščici ‹ › zavrtijo vrtiljak (~300 ms; `RING`, `ringPlace`, `spin`) in zamenjajo progo s `show(i, dir)`, kratek poteg se vrne. Vreme meri v pikslih strani (`rect` v `wxfx.js`): sneg in ivje na karticah, moker pod ali sneg pod avtom, temnejše ozadje v dežju in nevihti. Hitra izbira je panel desno, Zemlja čez cel zaslon s kartico desno. Obrat telefona zgradi zaslon znova na mestu.
- Števec v sliki spodaj levo (točka 10): mesto izbrane proge med progami, ki niso testne, npr. 17 / 26 (`T.count` v `makeT`, iz `vse-proge.js` in ročnih maket); na testni progi (Vršič) TEST.
- `?static` naloži samo zaslon (za orodja v `orodja/`).
- `T.signMode: 'flagname'`: spodnja tabla v barvah zastave brez napisa (zastava v delu, ki ga avto ne zakrije), nad njo desno manjša tabla z imenom države v njenem slogu (primer `orodja/proge/suzuka-tovornjak.json`).
- `table.html` nariše tablo izbrane države brez zastave in na 6 načinov z zastavo (glej `orodja/table.mjs`).

## Datoteke

| Datoteka | Kaj je |
|---|---|
| `index.html` | zaslon (`window.MOCK(T)` iz nastavitev proge) in zagon žive makete |
| `wxfx.js` | vreme čez cel zaslon, senca avta, table 20 držav (`SIGNS`, `signLook`) |
| `globe.js` | globus v glavi: osvetljen, odsev na morju, ozračje, oblaki, država zlata, pika na progi; ob menjavi proge se zavrti do nove države; dan in noč (`GLOBE.sun()`: kje je Sonce v nadglavišču zdaj, po UTC), nočna stran temnejša in bolj modra, mehak prehod |
| `proge.js` | 7 prog z ročno maketo: nastavitve zaslona in slike treh kamer |
| `vse-proge.js` | vse prave proge iz igre (vrstni red menija, kraj, država, skupina (`group`: circuit, road, rally), kraj na Zemlji, dolžina, vzpon ali ovinki, graf, slike kamer, oblika proge od zgoraj za kartico: `shape`, poenostavljen `Track` igre) in njihove zastave; naredi ga `orodja/vse-proge.js`, ne urejaj ročno |
| `izbor.js` | hitra izbira ob zastavi v vrstici: iskanje (kraj, država), filtri (vrsta, dolžina), zastave držav po celinah, seznam prog države; dotik vrstice odpre kartico proge (`trackCard`: oblika od zgoraj, start zlat, cilj odprte ceste bel; višine kot graf zaslona; *Select* in *Race!*, ki izbere progo in pokaže obvestilo), ki jo uporablja tudi Zemlja; `NAPREDEK`: napredek (najboljša dirka, medalja za najboljše mesto 1–3, kljukica za vožene brez medalje, NEW za nevožene) na zastavah, vrsticah, kartici, buckah Zemlje in v vrstici zaslona (*Best race*); podatki igre (`localStorage` `tdgp-records`, kot `js/game.js`), če maketa teče na naslovu igre, sicer primer (9 prog z rezultati); `NAZAJ`: tipka nazaj na telefonu zapre zgornje okno (zgodovina), tresljaj ob izbiri |
| `zemlja.js` | 3D Zemlja ob globusu: vrtenje, približanje, zlate države, bucike prog, kartica s progami države (dotik bucike ali vrstice: kartica proge, nazaj spet kartica države); riše samo med gibanjem, šibek telefon dobi `mk/earth2k.webp`; dan in noč kot v glavi (`GLOBE.sun()`, senčilnik v `onBeforeCompile`) |
| `table.html` | list tabel ene države z zastavo na 6 načinov |
| `table-drzav.json` | raziskava tabel 20 držav (vrsta table, barve, okvir, pisava, viri) |
| `mk/` | `earth2k.webp` (tekstura Zemlje na pol velikosti), slike avtov iz igre (prozorno ozadje), zemljevid, prelet in zavoj Vršiča, črte vetra za BURJO |
| `orodja/` | `vse-proge.js` (podatki vseh prog iz igre, zaženi po novi ali spremenjeni progi), `vreme.mjs` (slike vremen), `video.mjs` (video prehodov), `table.mjs` (listi tabel), `avto.mjs` + `alfa.py` (slika avta iz igre), `proge/*.json` (nastavitve za orodja) |

Orodja potrebujejo Playwright iz `npm install` in `ffmpeg` (video); slike gredo v začasno mapo ali v `OUT`.

## Pravno

Imena na tablah so samo imena držav v angleščini; pisave so prosto dostopne nadomestne (Roboto). Viri raziskave tabel so v `table-drzav.json` (Wikipedija, uradni pravilniki, brez Google Maps in Street View). Posnetek preleta Štajerske kaže na stavbi ob progi ime sponzorja, zato maketa pri kameri 2 za Štajersko uporabi helikopterski posnetek; pred objavo je treba prelet posneti znova.
