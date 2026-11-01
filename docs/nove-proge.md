# Nove proge · načrt

Načrt za 8 novih prog iz predstavitve »60 kratkih prog«: 7 iz prvega seznama in Ngorongoro, ki ga je uporabnik dodal 31. 10. zvečer. Odločitve so iz pogovora z uporabnikom (31. 10. 2026). Ostalih prog iz predstavitve ne delamo, razen če jih doda uporabnik. Nova seja dobi vse, kar potrebuje, iz tega dokumenta; velikih datotek ne bere v celoti (`docs/kazalo.md`, grep).

**Kako se dela:** ena seja naenkrat, po vrsti iz tabele Stanje, z navodilom »Naredi sejo <N><A|B> po docs/nove-proge.md«. Vsaka proga ima dve seji na isti veji `nove-proge/<id>` in en pull request. Seja A naredi progo iz podatkov in odpre pull request. Seja B dodela grafiko in pull request združi sama, ko so zeleni vsi testi na GitHubu (odločitev uporabnika 31. 10.: brez čakanja na preizkus na telefonu). Ob koncu seja posodobi Stanje in Recept ter zažene naslednjo sejo (razdelek Zagon naslednje seje).

## Pravila (uporabnik, 31. 10.)
- **Cilj:** proga čim bolj podobna pravi cesti in grafično čim boljša, za kamero za avtom (cesta in njeni robovi, teren, obzorje, nebo, svetloba, vreme).
- **Na `main` brez čakanja:** seja B združi, ko so zeleni vsi testi na GitHubu (Node, brskalniški, vozila); pred tem spoji svež `main`. Testov nikoli ne izklopi, ne preskoči in ne omili, da bi bili zeleni. Če se zatakne, ustavi verigo in uporabniku kratko napiše, kaj je narobe.
- **Meje iz `CLAUDE.md` ostanejo:** ime »Kraj, Država«; samo zemljepisna imena (brez oseb, podjetij, lokalov, prireditev, filmov, oddaj, znamk, logotipov); ena kamera za avtom; obremenitev do ~300 klicev risanja in ~900 tisoč oglišč (`tests/golden/perf.json`); nova proga ne poveča obremenitve drugih prog. Oblike resničnih stavb in spomenikov so dovoljene, njihova imena, napisi in umetnine nanje ne.
- **Viri samo odprti** (razdelek Viri), nikoli Google Maps, Google Earth ali Street View. Vsak vir z licenco gre v »Zasluge« v `README.md`.
- Uporabnika med verigo ne sprašuj, razen o odločitvah, ki so res njegove. Odgovarjaj kratko, v slovenščini. `main` je tudi stran na GitHub Pages: proga je tam vidna takoj po združitvi.

## Proge (podatki iz predstavitve)

### 1 · Bâlea, Romunija (`balea`, angl. »Bâlea, Romania«)
- **Odsek:** zadnji ~4 km severne strani Transfăgărășana do ledeniškega jezera Bâlea. Odprta cesta, asfalt, ~246 m višinske razlike, vožnja na čas.
- **Kot v resnici:** široke, tekoče serpentine; gola alpska pobočja, skale, melišča, snežišča še poleti; jezero na vrhu in koče ob njem (brez imen in napisov); skalni greben gorovja na obzorju.
- **Pravno:** cesta je znana iz televizije; v igri in opisih nobene omembe oddaje ali njenih voditeljev.

### 2 · Furka, Švica (`furka`, »Furka, Switzerland«)
- **Odsek:** ~4 km lasnic okoli Belvédèra na zahodni strani prelaza, nad Ronskim ledenikom. Odprta, asfalt, ~305 m.
- **Kot v resnici:** lasnice ob stavbi zaprtega hotela (oblika da, ime in napisi ne); ostanek ledenika pod cesto; skale, melišča, snežišča; Alpe na obzorju.
- **Višine:** swisstopo swissALTI3D (odprti podatki, »© swisstopo«), če ni dosegljiv, Copernicus.
- **Pravno:** cesta je znana iz filma o tajnem agentu; nobene omembe filma.

### 3 · Gudauri, Gruzija (`gudauri`, »Gudauri, Georgia«)
- **Odsek:** ~4 km serpentin stare gorske ceste pri Gudauriju (po predstavitvi 16 zavojev, ~249 m višinske razlike, razgled na dolino). Točen odsek izbere seja A iz OpenStreetMap in ga utemelji v `docs/proge/gudauri.md`. Odprta, asfalt.
- **Kot v resnici:** serpentine nad dolino; visoke, zasnežene gore na obzorju; stavbe smučarskega naselja.
- **Pravno:** bližnji spomenik z mozaiki: če se vidi s ceste, samo kot oblika, brez mozaikov in napisov.

### 4 · Llogara, Albanija (`llogara`, »Llogara, Albania«)
- **Odsek:** ~4 km čez prelaz skozi borov gozd in spust proti Jonskemu morju (~327 m). Odprta, asfalt, široka cesta.
- **Kot v resnici:** borov gozd na prelazu (drevesa po karti višin krošenj, vrste po fotografijah); spust s pogledom na morje in obalo; sredozemska svetloba.
- **Pravno:** samo zemljepisno ime.

### 5 · Porto Moniz, Portugalska (`portomoniz`, »Porto Moniz, Portugal«)
- **Odsek:** zadnji ~4 km ceste ER101 do Porto Moniza, cikcak po strmem pobočju Madeire do oceana (~423 m). Odprta, asfalt.
- **Kot v resnici:** strmo pobočje s terasami; bele hiše v kraju; naravni bazeni v lavi in pečine ob obali; ocean na obzorju v rahli meglici.
- **Pravno:** samo zemljepisno ime.

### 6 · Yungas, Bolivija (`yungas`, »Yungas, Bolivia«)
- **Odsek:** ~4 km stare ceste v Severnih Yungasih (makadam, ~30 zavojev, ~431 m). Odprta, makadam.
- **Kot v resnici:** ozka makadamska cesta, vklesana v pobočje, s prepadom ob strani (ograje samo, kjer so v resnici); oblačni gozd; slapovi čez cesto; megla. Promet po levi, če to potrdijo viri (pravilo te ceste; levostranski promet ima že Chapman's Peak).
- **Pravno:** vzdevek ceste (»cesta smrti«) ne gre v igro, ne v opis v `js/lang.js`.

### 7 · Pau, Francija (`pau`, »Pau, France«)
- **Odsek:** ulična krožna proga od železniške postaje do parka; potek sestavi po ulicah iz OpenStreetMap in javnih opisov poteka. Krožna, asfalt, ~37 m višinske razlike, dirka s krogi, tekmeci in boksi.
- **Kot v resnici:** prave ulice; stavbe s pravimi višinami (IGN BD TOPO, če je dosegljiv); park z drevesi; vzponi in spusti; ograje in mreže ulične proge brez sponzorjev.
- **Višine:** IGN RGE ALTI (Licence Ouverte 2.0), če ni dosegljiv, Copernicus.
- **Pravno:** ovinka, poimenovana po osebah (Foch, Pont Oscar), dobita opisni imeni (po vzoru seznama v `maketa-menija/README.md`).

### 8 · Ngorongoro, Tanzanija (`ngorongoro`, »Ngorongoro, Tanzania«; dodal uporabnik 31. 10.)
- **Odsek:** najstrmejši ~4 km makadamskega spusta z roba kraterja na dno (po predstavitvi 4,1 km, ~397 m višinske razlike, 11 zavojev). Točen odsek izbere seja A iz OpenStreetMap in ga utemelji v `docs/proge/ngorongoro.md`. Odprta, makadam, vožnja na čas.
- **Kot v resnici:** strma travnata pobočja kraterja, skoraj brez dreves in stavb; dno kraterja z jezerom v kadru ves spust; nasprotni rob kraterja na obzorju; barva makadama in trave po satelitskih posnetkih in fotografijah.
- **Veliko živali (želja uporabnika):** čim več, kot v resnici: črede gnujev, zeber, bivolov in gazel na dnu in spodnjih pobočjih, sloni, levi ob cesti, hijene, noji, bradavičarji, plamenci kot rožnat pas ob jezeru, povodni konji in kronasti žerjavi, kjer so v resnici blizu. Vrste, velikost čred in razporeditev po virih in fotografijah. Živali se pasejo, hodijo, včasih prečkajo cesto in se avtu vedno umaknejo; avto jih ne more povoziti ali poškodovati. Daljne črede na dnu kraterja so vidne že med spustom.
- **Kako:** en `InstancedMesh` na vrsto, poza v senčilniku oglišč, kot živali na Pikes Peaku (`js/world-pikes.js`); beg pred avtom kot kenguruji na Bathurstu (`js/world-rbring.js`, `out.dyn.roos`); daljne črede poenostavljene. Vse v meji obremenitve telefona.
- **Promet:** levostranski (kot Chapman's Peak), če po odseku vozijo v obe smeri; safari terenci, če jih dodaš, brez znamk in napisov.
- **Pravno:** zaščiteno območje; brez imen safari podjetij in drugih napisov.

## Viri (samo odprti)
- **Cesta, stavbe, raba tal, voda, zidovi, ograje, mostovi:** OpenStreetMap prek Overture Maps (ceste že bere `maketa-menija/orodja/geo_roads.py`).
- **Višine:** Copernicus DEM GLO-30 (drugod), swisstopo (Furka), IGN (Pau). Krošnje dreves iz višin odstrani kot pri Medvodah (`docs/proge/medvode.md`). Višine iz Terrain Tiles že bere `maketa-menija/orodja/geo_lib.py`.
- **Barve tal:** satelitski posnetki Sentinel-2 (Copernicus, »Contains modified Copernicus Sentinel data«): trava, skale, melišča in sneg tam, kjer so v resnici.
- **Drevesa:** High Resolution Canopy Height Maps (Meta in WRI, CC BY 4.0), kot pri Harjuju; raba tal ESA WorldCover.
- **Vzor za videz:** fotografije z Wikimedia Commons in Mapillary (odprte licence), samo kot vzor za barve, ograje, zidove, skale in oznake. Ne gredo v igro ne v repozitorij.
- Če vir v okolju ni dosegljiv, uporabi Copernicus oziroma drug odprt vir in to zapiši v `docs/proge/<id>.md`.

## Varčevanje s tokeni (odločitev uporabnika 31. 10.: »Uporabi vse predloge«)
1. **Orodje za podatke proge in Recept:** seja 1A naredi orodje (`tools/proga/`), ki iz OpenStreetMap, višin, Sentinel-2 in karte krošenj pripravi podatke proge, in zapiše Recept (spodaj). Seje 2A–7A orodje samo poženejo in po potrebi dopolnijo, ne pišejo svojih skript.
2. **Meni za vseh 8 naenkrat:** zemljevid od zgoraj, globus, prelet in glasbo naredi seja 9 za vse proge hkrati (kot PR #201). Sliki za meni (`assets/tracks/<id>.webp`, `<id>-rain.webp`) naredi vsaka seja A sama, ker brez njiju meni pokaže prazen oder.
3. **Pripombe uporabnika:** v enem sporočilu na progo, za napake na cesti z besedilom `RRA-NAPAKE …` (proga, krog, metri od štarta).
4. **Popravki prog, ki so že na `main`:** nova kratka seja (»Popravi … na progi <id> po docs/nove-proge.md«), ne stara dolga seja.

## Organizacija sej (odločitev uporabnika 31. 10.)
1. **Ena za drugo:** nobenih vzporednih sej v tej verigi; vsaka seja začne na najnovejšem orodju in Receptu.
2. **Recept raste:** ob koncu seje 3–5 vrstic v Recept (kaj se je obneslo, česa ne, pripombe uporabnika). Recept ostane kratek (do ~1 stran), ni dnevnik.
3. **Stanje v tem dokumentu:** vsaka seja ob koncu posodobi Stanje in zažene naslednjo z enim stavkom (razdelek Zagon naslednje seje). Koordinacijska seja dela ne spremlja; samo zažene naslednjo sejo, ko jo obvestiš.
4. **Preizkus brez čakanja:** GitHub naredi predogled (`beta/<številka PR>/`, `tools/predogled.mjs`) in posnetke pred/po (`posnetki.yml`). Seja na uporabnika ne čaka; če pošlje pripombe, gredo v Recept in v popravek.
5. **Pregled pred združitvijo (seja B):** Seznam pravil (spodaj); primerjava igre s fotografijami z istih 4–6 mest ob cesti (spodnja meja kakovosti: Bathurst po PR #210); en kratek neodvisen pregled s podagentom, ki dobi samo spremembe te proge in pravila, ne celega repozitorija.
6. **Brez praznega čakanja:** dolgi testi tečejo v ozadju, pull request seja spremlja z obvestili GitHuba (`subscribe_pr_activity`), brez zank s `sleep`. Za iskanje po kodi kazalo in grep, ne podagenti.

## Seja A (izdelava)
1. Veja `nove-proge/<id>` (iz svežega `main`; seja 1A iz veje s tem načrtom, glej Stanje).
2. Proga iz podatkov (Viri): sredinska črta, širina, višine, usek in nasip, podporni zidovi, mostovi; okolica v svoji datoteki `js/world-<id>.js` (teren, raba tal, barve tal, drevesa, stavbe, voda, obzorje). Za prelaze in spust v krater (1–6, 8) uporabi skupno okolico prelazov, ki jo naredi seja 1A (Recept).
3. Obcestna oprema in oznake po pravilih države; boksi samo pri Pauju.
4. Datoteke po `README.md` »Nova proga« (koraki 0–7): `js/tracks/<id>.js`, `index.html`, `js/lang.js`, `docs/proge/<id>.md`, `README.md` (»Proge«, »Zasluge«), slike za meni, test `tests/<id>.test.js` (v `tests/run.js` in `tests/README.md`), `docs/kazalo.md` (Proge in graditelji sveta).
5. `node tools/stamp.js`, `npm run golden:update`, `npm run test:related` zelen, nato pull request (naslov »Nova proga: Kraj, Država«; povezava do predogleda).
6. Stanje, Recept, zagon seje B.

## Seja B (dodelava grafike in združitev)
1. Ista veja. Fotografije z Wikimedia Commons in Mapillary z 4–6 mest ob cesti, posnetki igre z istih mest (`tools/shot.mjs`), popravljaj, dokler si niso čim bolj podobni: barve tal, skale, drevesa, robovi ceste, zidovi, obzorje, nebo, svetloba, megla. Detajlov, ki jih s kamere za avtom ni videti, ne dodajaj.
2. Obremenitev (`node tests/browser/perf.test.mjs`) v mejah, druge proge brez sprememb.
3. Seznam pravil in neodvisen pregled; spoji svež `main`; `npm run test:related` zelen.
4. Stanje (»končano (PR #…)«) in Recept v pull request; ko so zeleni vsi testi na GitHubu, ga združi.
5. Zagon naslednje seje A (ali seje 9).

## Seja 9 (meni za vseh 8)
Zemljevid od zgoraj, globus, prelet in glasba (`js/routes.js`, `assets/maps/`, kot PR #201) za vseh 8 prog, en pull request, združi ga sama, ko so zeleni vsi testi na GitHubu. Konec verige: uporabniku kratek seznam za preizkus na telefonu (vseh 8 prog in kaj pogledati).

## Zagon naslednje seje
Nastavitve nove seje (`create_session`, claude-code-remote): `source_url` `https://github.com/jurekopac26-beep/dirkaska-igra`, `model` `claude-opus-5-5`, `tags` `["nove-proge"]`, `prompt` en stavek:
- **A → B iste proge:** `source_revision` in `outcome_branch` `nove-proge/<id>`; »Naredi sejo <N>B po docs/nove-proge.md (veja nove-proge/<id>, PR #<št>).«
- **B → A naslednje proge** (po združitvi): `source_revision` `main`, `outcome_branch` `nove-proge/<naslednji id>`; »Naredi sejo <N+1>A po docs/nove-proge.md.«
- **8B → 9:** `source_revision` `main`, `outcome_branch` `nove-proge/meni`; »Naredi sejo 9 po docs/nove-proge.md.«

Seja, ki jo je ustvarila druga seja, orodja `create_session` nima. Takrat obvesti koordinacijsko sejo `session_01WbgGzr69qFMo5TYXBpmzzr` (»NOVE PROGEE«, iz nje je veriga začela) z enkratnim opravilom `create_trigger`: `persistent_session_id` te seje, `run_once_at` čez ~2 min (UTC), `initiation` `own_followup`, `name` »Nove proge: zaženi <naslednja seja>«, `prompt` »Seja <N><X> je končana (veja nove-proge/<id>, PR #<št>). Po docs/nove-proge.md zaženi sejo <naslednja>.« Koordinacijska seja zažene naslednjo sejo z zgornjimi nastavitvami in drugega ne dela.

## Seznam pravil (pred združitvijo)
- Ime »Kraj, Država« v `js/tracks/<id>.js`, angleško ime in opis v `js/lang.js`, `README.md`, `docs/proge/<id>.md`.
- Nikjer imen oseb, podjetij, lokalov, prireditev, filmov, oddaj, znamk ali logotipov; table in napisi generični; ovinki z opisnimi imeni.
- Vsi viri odprti in v »Zasluge«; nič iz Googla.
- `tests/golden/perf.json`: nova proga pod ~300 klicev in ~900 tisoč oglišč (`maxCalls`, `maxKverts`), druge proge nespremenjene.
- Sliki za meni, `node tests/browser/menu.test.mjs` zelen.
- Test proge, `tests/run.js`, `tests/README.md`, `docs/kazalo.md`, `node tools/stamp.js`.

## Recept (dopolni vsaka seja; do ~1 stran)
- **Izhodišče:** `README.md` »Nova proga«; `docs/kazalo.md` (Proge in graditelji sveta, Testi po temah); hitri vstop `index.html?proga=<id>` (`tests/README.md`).
- **Vzori:** Vršič (`js/tracks/vrsic.js`, `js/world-vrsic.js`, `docs/proge/vrsic.md`: OpenStreetMap prek Overture, Copernicus), Medvode (krošnje odstranjene iz višin), Harju (drevesa po karti višin krošenj), Chapman's Peak (levostranski promet), Bathurst (videz po PR #210, boksi), Newcastle in Detroit (ulični progi, za Pau).
- **Orodja, ki že obstajajo:** `maketa-menija/orodja/` (`geo_roads.py` ceste iz Overture, `geo_lib.py` višine, slike za meni `dio2.mjs` in `mkwebp.py`, glej `maketa-menija/README.md`), `tools/shot.mjs` (posnetki zaslona).
- **Orodje za podatke** (seja 1A): `tools/proga/proga.py <id> [--zapisi]` (opis, polja in pasti v `tools/proga/README.md`). Nastavitve v `tools/proga/proge.json`: točke `pot`, `start`, `cilj`, `zalet` ~160 m, `po_cilju` ~190 m (mesta avtov po cilju), polširina, višine, posnetek Sentinel-2 (`s2_scenes` v `lib.py`). Napiše sredinsko črto, `<ID>_H`, `alt`, `realKm`, `finish`, `cps`, `curves` (serpentine nad 150°) in podatke okolice v blok datoteke proge; imena, komentator, opis, medalje so ročni. Pregled: `pregled.py <id>`. Vse bere po kosih (brez GDAL), ~10 min, ~150 MB v `tools/proga/raw/`.
- **Skupna okolica prelazov**: `js/world-prelaz.js` (`buildPrelaz`): nov prelaz = podatki iz orodja + vnos v `PL_LOOK` (barve tal in skal, snežna meja, table države, `portal`, `sheep`) + `theme: '<id>'` v datoteki proge + vrstica v `THEMES`/`SPLIT` v `js/render.js`. Kar potrebuje samo ena proga, gre pod zastavico v `PL_LOOK`, ne v kopijo graditelja.
- **Pasti (1A)**: Overture `connectors.at` je delež dolžine v metrih; brez filtra razredov pot ubere pešpot čez serpentine; `elevSmooth` v datoteki proge naj bo ~6 m (sicer se serpentine spet zgladijo v krake in test »serpentine položnejše« pade); test `golden.test.js` zahteva, da »crash« odtrga del (`CRASH_AT` v `tests/lib/sim.js`, za Bâleo `'balea/rally': 6.5`). Nova proga gre na konec seznama v `index.html` (pred tem bi zamaknila avte »/car« drugih prog). Reference samo za novo progo: `--only=<id>` (golden, races), `WORLD_ONLY`, `PERF_ONLY`. Slika za meni: kopija igre v `maketa-menija/game_main/`, `dio2.mjs` z enim opravilom, `mkwebp.py ../../assets/tracks <id>`, vrstica v `proge_igra.json`.
- **Fotografije**: Wikimedia Commons in Mapillary iz ukazne vrstice niso dosegljivi (proxy), tudi podagent `web-fetch` ne (1B: `commons.wikimedia.org` ni na seznamu dovoljenih domen okolja). Brez njih: videz po podatkih in poznavanju kraja, zapis v `docs/proge/<id>.md`.
- **Vprašanja uporabniku** (uporabnik 31. 10.: »vedno tako, da samo kliknem izbiro«): vsa, tudi potrditve, na stran Odločitve (`ArtifactData` `set`, zbirka `vprasanja`, oštevilčene možnosti; oblika v `CLAUDE.md`, razdelek »Seje: čakanje in vprašanja«, PR #227). V pogovoru samo, če stran ni dosegljiva.
- **Kamera (1B)**: kamera za avtom gleda strmo navzdol; s posnetkov (`tools/shot.mjs <id> --m …`) se vidi predvsem cesta, robovi, teren ob njej in pobočja, obzorje komaj. Grafiko dodelaj tam.
- **Kraki serpentin (1B)**: cesta v igri (11 m) je širša od prave, zato se ograji dveh krakov skoraj dotikata in teren med njima je bil temna stena nad »zobmi« 5-metrske mreže. Rešitev v `buildPrelaz`: zid iz zidanega kamna (`bk`, `plWallTex`) od roba zgornjega kraka do police ob spodnjem, teren pod njim spuščen prek `API.caBank` (kljuka v `caH`, velja samo za progo, ki jo je nastavila). Za diagnozo: `World.api` v brskalniku (`caGround`, `vrNear`, `T`) in začasna kričeča barva mreže. Nova proga dobi zidove sama, če ima tesne serpentine.

## Stanje

| Seja | Proga | Kaj | Ocena (h) | Stanje |
|---|---|---|---|---|
| 0 | – | načrt (ta dokument, `CLAUDE.md`) | – | na `main` s pull requestom Bâlee (#226) |
| 1A | Bâlea, Romunija | izdelava, skupna okolica za prelaze, orodje, Recept | 11–15 | končano (PR #226) |
| 1B | Bâlea, Romunija | dodelava grafike, združitev | 4–6 | končano (PR #226) |
| 2A, 2B | Furka, Švica | izdelava, dodelava | 12–16 | naslednja (2A) |
| 3A, 3B | Gudauri, Gruzija | izdelava, dodelava | 12–16 | čaka |
| 4A, 4B | Llogara, Albanija | izdelava, dodelava | 12–16 | čaka |
| 5A, 5B | Porto Moniz, Portugalska | izdelava, dodelava | 14–18 | čaka |
| 6A, 6B | Yungas, Bolivija | izdelava, dodelava | 14–18 | čaka |
| 7A, 7B | Pau, Francija | izdelava, dodelava | 18–24 | čaka |
| 8A, 8B | Ngorongoro, Tanzanija | izdelava z živalmi, dodelava | 20–28 | čaka |
| 9 | vseh 8 | meni: zemljevid od zgoraj, globus, prelet, glasba | 4–6 | čaka |
