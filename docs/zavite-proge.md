# Zavite proge: deset prog v znanih mestih zunaj Evrope

Sklop desetih zavitih prog, dolgih 1,3–3,8 km, vsaka z vsaj petimi znamenitostmi do 60 m od ceste. Proge so izbrane in izmerjene 2. 11. 2026 (seja »Mestne dirke s zanimivostmi«); pregled z zemljevidi je na <https://claude.ai/artifact/NL9SYYTfnPYCTKwbwzWiky>, vse meritve pa v `tools/zavite/proge.json`. Seje gradnje ničesar ne iščejo in ne merijo znova.

## Odločitve uporabnika

- **2. 11. 2026**: proge v znanih mestih zunaj Evrope, zavite (brez dolgih ravnin), 1–4 km, krog ali od točke do točke, znamenitosti do 60 m od ceste (to vidi kamera). Proge ostanejo take, kot so izmerjene: ne krajšaj.
- **2. 11.**: izdelava po tem načrtu v štirih korakih, vsak korak nova seja. **Korak 1 na naporu max, koraki 2–4 na xhigh.** Nastavitve napora ureja veriga sama (uporabnik jih ne spreminja): postopek spodaj.
- **2. 11.**: čim manj tokenov brez izgube kakovosti (razdelek Varčevanje).
- Korak 1 se začne, ko je PR #241 (orodja gorskih prog: `tools/proga-uvoz.mjs`, `tools/nova-proga.mjs`, `tests/lib/gore.js`, `js/world-gore.js`) na `main`; zažene ga seja »VSE SEJE«.
- Ena veja (`ccr-67c8ebdb-8sdz1o`) in en pull request za vseh deset, osnutek do konca. Na `main` gre, ko so zeleni vsi testi in uporabnik potrdi na strani Odločitve; v vrsto ga uvrsti »VSE SEJE«.
- Zemljevid od zgoraj, prelet in helikopterski posnetek se ne delajo (po `CLAUDE.md` pozneje). Slika za meni je obvezna.

## Proge

Zavitost: vsota sprememb smeri na kilometer; ravnine: del proge s polmerom nad 250 m. Prejšnje mestne proge, ki jih je uporabnik zavrnil zaradi ravnin: 145–420°/km in 72–95 % ravnin.

| Korak | `id` | Ime (`name`) | Angleško | Vožnja | Vrsta | Dolžina | °/km | Ravnine | Znamenitosti |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `ouropreto` | Ouro Preto, Brazilija | Ouro Preto, Brazil | desna | krog | 2,43 km | 1009 | 35 % | 13 |
| 2 | `valparaiso` | Valparaíso, Čile | Valparaíso, Chile | desna | točka–točka | 3,30 km | 744 | 43 % | 13 |
| 2 | `quito` | Quito, Ekvador | Quito, Ecuador | desna | točka–točka | 3,78 km | 656 | 44 % | 8 |
| 2 | `quebec` | Québec, Kanada | Quebec City, Canada | desna | krog | 1,32 km | 763 | 45 % | 11 |
| 3 | `hongkong` | Hongkong, Kitajska | Hong Kong, China | leva | točka–točka | 2,71 km | 731 | 37 % | 13 |
| 3 | `macau` | Macao, Kitajska | Macau, China | leva | točka–točka | 2,28 km | 568 | 40 % | 10 |
| 3 | `seoul` | Seul, Južna Koreja | Seoul, South Korea | desna | točka–točka | 2,49 km | 512 | 43 % | 8 |
| 4 | `wellington` | Wellington, Nova Zelandija | Wellington, New Zealand | leva | točka–točka | 3,00 km | 730 | 38 % | 5 |
| 4 | `shimla` | Shimla, Indija | Shimla, India | leva | točka–točka | 3,58 km | 774 | 35 % | 6 |
| 4 | `darjeeling` | Darjeeling, Indija | Darjeeling, India | leva | točka–točka | 2,80 km | 637 | 36 % | 6 |

Posebnosti (vse drugo je v `proge.json`: opis poti, znamenitosti z razdaljo in lego od starta, opombe):
- **ouropreto**: krog po strmih tlakovanih ulicah okoli glavnega trga, 2 lasnici, 62 m peš ulice.
- **valparaiso**: s pristaniškega trga na griče in po grebenski cesti, 115 m vzpona, vzpenjača ob progi.
- **quito**: od kolonialnega oboka po serpentinah na vrh Panecillo (`avoid` v `proge.json`: krog okoli vrha po daljši strani), 195 m vzpona.
- **quebec**: kratek krog skozi mestna vrata, po obzidju in pod skalo; ravnine točno na meji (45 %).
- **hongkong**: spust s prelaza po enosmerni cesti v središče, 282 m višinske razlike, vzpenjača ob cesti.
- **macau**: ceste okoli hriba z zbiralnikom, enosmerne v smeri proge; ali se prekriva z mestnim dirkališčem, ni preverjeno (imena ovinkov in prireditve so znamke).
- **seoul**: krožna cesta na hrib s TV stolpom (v resnici samo avtobusi), mestno obzidje, razgledišča.
- **wellington**: na razgledni hrib nad zalivom, najdaljša ravnina točno 250 m.
- **shimla**: cesta pod grebenom, predor, ~750 m bivalnih ulic (bazar), postaja gorske železnice.
- **darjeeling**: cesta, po kateri in ob kateri vozi ozkotirna železnica (vlak kot gradnik), postaja.

## Kaj vidi kamera

Kot v `docs/gorske-proge.md`, razdelek »Kaj vidi kamera«: detajli samo v pasu ~60 m ob cesti, obzorja kamera ne vidi. Pri teh progah: stavbe in znamenitosti do ~30 m višine podrobno, višje preprosto; mestnih obzorij (nebotičniki Hongkonga, Andi, Himalaja) ne modeliraj.

## Pravna varnost

Velja `CLAUDE.md` in razdelek »Pravna varnost« v `docs/gorske-proge.md`. Za te proge še:
- Ulice, trgi in stavbe, poimenovani po osebah (večina ulic v Ouro Pretu, Valparaísu, Quitu, Québecu in Macau), so v igri brez imen; ovinki dobijo opisna imena.
- Brez imen podjetij in znamk: igralnice in ovinki dirkališča v Macau, hoteli (grad-hotel v Québecu ne poimenuj in ne posnemaj natančno), banke (stolpnica ob Garden Road generično), vzpenjača v Hongkongu, TV stolp v Seulu.
- Verske stavbe so generične; velikega verskega kipa na vrhu v Quitu ni; kipov oseb ni.
- Pravna ocena je pri vseh 2–3/10 (`legal`, `legal_note` v `proge.json`).

## Podatki

- `tools/zavite/proge.json`: za vsako progo `waypoints`, `open`, `avoid`, izmerjena pot `line` (širina, dolžina), dolžina, zavoji, zavitost, višinska razlika, znamenitosti (`label`, `osm_name`, `kind`, `dist_m`, `at_m` = metri od starta), opis poti (`route`), opombe, pravna ocena. `tools/zavite/loops.json` ima iste točke za ponovno merjenje.
- Podatki proge v igri: OpenStreetMap (glavni API) in višine (Copernicus GLO-30), kot v uvozniku iz #241; pot proge vzemi iz `line` oziroma `waypoints`.
- Ponovno merjenje, le če je res treba: `tools/zavite/` (Overture na S3: `python3 index_rg.py <tema> <vrsta>`, `python3 extract.py <id> <bbox>`, `python3 loop.py <id>`; Python pyarrow, shapely, pyproj, networkx, matplotlib, pillow; vmesne datoteke v `$ZAVITE_CACHE`). Iz Overture se jemljejo samo zapisi z virom OpenStreetMap (`sources[].dataset`), stavbe drugih virov ne.
- Nikoli Google Maps, Google Earth ali Street View. Zasluge v `README.md` (OSM ODbL 1.0, višine).

## Skupni gradniki (korak 1, z Ouro Pretom)

- Orodja iz #241 se nadgradijo, ne napišejo znova: uvoznik (pot iz `proge.json`, tudi krog; mestne ulice, stavbe in znamenitosti v pasu ~60 m), generator (bere tudi tabelo tega načrta), skupni test (krog, 1–4 km).
- Gradnik »mesto na hribu« (v `js/world-gore.js` ali v svoji datoteki s pomočniki `extAPI`): ozke strme ulice, tlakovci, podporni zidovi, stopnice in ograje, pločniki; stavbe iz obrisov OSM (višina iz nadstropij), fasade po slogu (kolonialni, britanski kolonialni, azijski); znamenitosti iz parametrov: cerkev z enim ali dvema zvonikoma, obzidje z vrati in bastijonom, palača, razgledna terasa, paviljon, vzpenjača, gorska železnica ob cesti in po njej, oddajnik ali TV stolp, zbiralnik in park. Vse z instanciranjem, malo klicev risanja.
- Nove države naenkrat: zastave in globus za Ekvador, Indijo (če je še ni), Južno Korejo in Novo Zelandijo.

## Postopek za vsak korak

1. Preberi `CLAUDE.md`, ta načrt in svoje proge v `tools/zavite/proge.json`; kodo samo z grepom (najprej kazalo), velikih datotek ne beri v celoti.
2. `git merge origin/main` (spori v žigih: `node tools/stamp.js`).
3. Za vsako progo: uvoznik, generator, posebnosti v `js/world-<id>.js` (nekaj KB) ali nov gradnik, če ga rabi še kakšna proga, opisa brez imen oseb in podjetij, `docs/proge/<id>.md`, slika za meni.
4. Pregled: ena zbirna slika na progo (pokonci in ležeče, 3–4 stalna mesta, manjša ločljivost), največ trije krogi popravkov; obremenitev pod mejami iz `CLAUDE.md` in brez povečanja na drugih progah.
5. `node tools/stamp.js`, enkrat `npm run golden:update`, `npm run test:related` (izpis skrajšan), `node tests/browser/menu.test.mjs`.
6. Push na vejo sklopa; v tabeli Stanje svoj korak označi »narejeno«, naslednjega »v delu«.
7. Naslednji korak zaženi sam: `create_session` (`source_url` repozitorij, `source_revision` in `outcome_branch` = `ccr-67c8ebdb-8sdz1o`, model `claude-opus-5-5`, navodilo »Naredi korak N po docs/zavite-proge.md«).

- **Korak 1** odpre pull request kot osnutek. Pred zagonom koraka 2 doda en začasni commit, ki v `.claude/settings.json` nastavi `env.CLAUDE_CODE_EFFORT_LEVEL` na `xhigh`, da koraki 2–4 tečejo na xhigh.
- **Korak 4** začasni commit vrne (`git revert`) in preveri, da pull request ne spreminja `.claude/settings.json`. Ko so lokalno zeleni povezani testi, pull request označi »Ready for review«, se naroči na njegove dogodke (`subscribe_pr_activity`), seji »VSE SEJE« pošlje eno vrstico za uvrstitev v vrsto in na strani Odločitve vpraša za potrditev za `main`.

## Varčevanje s tokeni (odločitev uporabnika 2. 11. 2026)

1. Meritve se ne ponavljajo (`proge.json`).
2. Orodja iz #241 se nadgradijo, ne napišejo znova.
3. En gradnik »mesto na hribu« z znamenitostmi iz parametrov; svet proge ima nekaj KB.
4. Štiri seje po družinah (tabela Proge) namesto desetih.
5. Vsak korak je nova seja s kratkim navodilom.
6. Modelira se samo, kar vidi kamera (pas 60 m, spodnjih ~30 m stavb).
7. Ena veja in en pull request: celotni testi na GitHubu tečejo enkrat.
8. Ena zbirna slika na progo, največ trije krogi popravkov.
9. Kratki izpisi, referenčne vrednosti enkrat na korak, nove države naenkrat v koraku 1.
10. Korak 1 na max, koraki 2–4 na xhigh; brez koordinacijske seje, na teste se čaka z dogodki GitHuba.

Kjer ne varčujemo: pregled grafike pokonci in ležeče, meje obremenitve telefona, vsi testi na GitHubu, pravna pravila.

## Stanje

Ocena: korak 1 10–14 ur, koraki 2–4 po 6–9 ur, testi na GitHubu in popravki 2–4 ure (skupaj 35–45 ur dela seje).

| Korak | Proge | Stanje |
|---|---|---|
| 0 | načrt in meritve | narejeno (2. 11. 2026) |
| 1 | Ouro Preto + skupni gradniki | čaka na #241 |
| 2 | Valparaíso, Quito, Québec | čaka |
| 3 | Hongkong, Macao, Seul | čaka |
| 4 | Wellington, Shimla, Darjeeling | čaka |

Veja: `ccr-67c8ebdb-8sdz1o`. Pull request odpre korak 1.
