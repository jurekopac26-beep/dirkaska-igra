# Grafika na ravni velikih dirkalnih iger: raziskava

Lastnik: partyslo, od 26. 11. 2026. Samo raziskava, brez kode v igri (`js/render.js`, `js/cars`, `js/garage*.js` in fizika vožnje ostanejo enaki).

Stanje: zasnova po preverjanju; izvedba šele po »ok« na strani Odločitve. Ta PR ne spreminja nobene datoteke igre.

Vse »ms« so ocene za šibke telefone iz števila operacij in branj tekstur, ne meritve na napravi; kjer številka stoji sama, piše »ocena«. Izjema so časi slik iz #1104, navedeni, kot so zapisani tam. Klici risanja in oglišča so šteti z ovojem iz vrat. Naprave: »šibki telefoni« (NIZKA, `normal`), »referenčni srednji telefon« (SREDNJA, `high`), »zmogljiv računalnik« (VISOKA). Zamrznjene proge (45 s `test`/`pending` in Bathurst, Avstralija po odločitvi) niso nikoli cilj. Številke vrstic so približne.

Slike zdaj in potem (predogled) so samo na kartici na strani Odločitve: repozitorij je javen, slik za vprašanja ne shranjujemo.

## Na kratko
- **Priporočeno: Srednji.** Kamera chase gleda navzdol (nagib 36,1°), zato teren (53–78 % slike) in cesta (10–46 %) zavzameta večino slike; enolična tla in gladek asfalt sta največja razlika do velikih dirkalnih iger. Srednji zato doda zrno asfalta (SR1), zaplate in zalite razpoke (SR2), plasti tal (SR3′) in pečeno senčenje terena (SR4a).
- **Trije paketi:** Hitri ≈ 6 sej, Srednji ≈ 14,5 seje, Veliki ≈ 24,5 seje. Na progah na meji noben paket ne doda klicev ali oglišč.
- **Proračun Srednjega na šibkem telefonu:** −1 do −14 klicev (če se skrijejo vsi trakovi nalepk), oglišča ≤ 0, ~+0,5–1,6 ms na sliko (ocena), ki jih prilagodljiva zanka plača v ločljivosti; + 2–6 MB tekstur.
- **Vrata izvedbe:** vsaka sprememba je vklopljena po progi in privzeto izklopljena; zamrznjene proge ostanejo do bita enake, avti in garaža enaki (N1, N2); postavke s stroškom na piko se pred vklopom izmerijo na napravi (N9); vse se prevede pred startom, med dirko ne nastane nič novega (N3, #1104).
- **Povečava:** vrata merijo pri povečavi 1,2, igra pa privzeto teče na 1,4. Pri 1,4 so `sacalobra`, `portomoniz` in `sepang` že danes čez mejo, `koli` je na 297 klicih. Zato je prvi korak ločena meritev H0.
- **Premaknjeno drugam:** mokra cesta v lisah in kapljice → »Vreme med dirko«; sneg → #519; gumirana linija → `docs/zgumirana-linija.md`; ugotovitve o zatikanju → sporočilo za #1104.
- **Zavrnjeno:** časovno glajenje (TAA), nebo in atmosfera, zatemnitev in odsevi v zaslonskem prostoru na telefonu, manjši senčni okvir na NIZKA (V5), postavke samo za zmogljiv računalnik (V6) in drugo.
- **Odločitev:** en »ok« na strani Odločitve, ena kartica: 1 = Srednji (priporočeno), 2 = Hitri, 3 = Veliki; slike na Spa, Belgija (telefon pokonci), levo zdaj, desno potem (predogled).

## Stanje zdaj

### Pogon in stopnje
- **Pogon:** three.js r128 v repozitoriju (`index.html` 557: `js/vendor/three.r128.min.js`), WebGL1 in WebGL2. Brez tonske preslikave in izhodnega kodiranja barv; obstoječi model senčenja (osvetlitev po ogliščih in po pikah), brez fizikalno osnovanih materialov.
- **Stopnje:** `gpuTier()` (`js/game.js` 615–624) da NIZKA šibkim grafičnim procesorjem in napravam samo z WebGL1, SREDNJA neznanim srednjim napravam (tudi referenčnemu srednjemu telefonu), VISOKA zmogljivim. `TIER_DIST` (`js/game.js` 609) da doseg podrobnosti 165 m, 320 m in brez meje.
- **Kakovost:** `DEF.quality` (`js/game.js` 51) je `normal` samo pri `lowEnd` (≤ 4 jedra ali ≤ 3 GB, `js/game.js` 50), sicer `high`. Referenčni srednji telefon zato že ima prehod post z barvno korekcijo; brez nje so samo šibki telefoni.
- **Prilagodljiva zanka** (`js/game.js` 6682–6697; `setDynScale`, `js/render.js` 4803): na NIZKA vsako dodano ms najprej plača ločljivost (do 0,55, torej 0,30 pik), nato izklop senc, nato krajši doseg (82,5 m). Strošek se vidi na sliki, ne v številu slik na sekundo.

### Vrata in povečava
- **Vrata** (`tests/browser/perf.test.mjs` 77): merijo samo NIZKA, `normal`, sence vklopljene, 844 × 390, povečava 1,2, z nasprotniki, na šestih mestih kroga. Števec je ovoj nad klici WebGL (vrstice 78–83), ki šteje tudi senčni prehod in instancirane klice.
- **Meja:** ≤ 300 klicev risanja in ≤ 900 tisoč oglišč na progo (`tests/golden/perf.json`); regresija = golden × 1,1 + 5 klicev ali + 20 tisoč oglišč. Po komentarju na začetku testa višje stopnje mejo smejo preseči.
- **`renderer.info` ni merilo:** na `normal` ne vidi senčnega prehoda (32–67 klicev na sliko), na `high` pokaže samo zadnji izris (1 klic).
- **Povečava:** igra privzeto teče na 1,4 (`DEF.zoom`, `js/game.js` 51; enkratna prehoda nastavitev v2 in v3, vrstici 62 in 64), vrata merijo 1,2.
- **Višje stopnje** v zaporedju vrat (povečava 1,2, nasprotniki, največ od 6 mest): Spa, Belgija 302 klica / 950 tisoč oglišč na SREDNJA (844 × 390) in 309 / 989 tisoč na VISOKA (1600 × 900).

| Proga | golden pri 1,2 (največ od 6 mest): klici / oglišča | pri 1,4 (golden + razlika iste meritve) |
|---|---|---|
| Sa Calobra, Španija (`sacalobra`) | 295 / 876 tisoč | 313 / 929 tisoč: čez mejo |
| Porto Moniz, Portugalska (`portomoniz`) | 295 / 815 tisoč | 330 klicev: čez mejo |
| Sepang, Malezija (`sepang`) | 234 / 899 tisoč | 905 tisoč oglišč: čez mejo |
| Koli, Finska (`koli`) | 290 / 748 tisoč | 297 klicev |
| Lusail, Katar (`lusail`) | 241 / 896 tisoč: na meji že pri 1,2 | ni ponovno izmerjeno |
| Spa, Belgija (`spa`), za primerjavo | 232 / 618 tisoč | 255 / 658 tisoč |

Prvih pet so **proge na meji**: postavka, ki jih doseže, mora tam klice in oglišča zmanjšati, ne povečati.

### Kamera in deleži slike
- **Kamera chase** (`js/render.js` 10113–10132): nagib 36,1° (pokončno 39,3°), vidni kot 46° (58°); zgornji rob slike je 13,1° (10,3°) pod vodoravnico, neodvisno od povečave. Višina kamere 22,3 / 26,1 / 31,1 m pri povečavi 1,2 / 1,4 / 1,7 (pokončno pri 1,4: 33,2 m). Zgornji rob zadene ravna tla pri ~96 / 112 / 134 m (pokončno ~183 m); megla pri 1,4 sega od 60 do 243 m.
- **Nebo:** barva ozadja zavzame ~0 % slike, razen v dolinah in na spustih (`portomoniz` ≤ 2,9 %, `koli` ≤ 1,1 %) in na Pikes Peak, ZDA (meglica in morje oblakov ≤ 12 %). Kupola neba se izriše samo v ponovitvi in fotografskem načinu (`js/render.js` 10446–10512).
- **Deleži pik** (povečava 1,4, 844 × 390 in pokončno): cesta 10–46 % (mediana ~19 % ležeče, ~31 % pokončno); teren 53–78 % (mediana ~67 %); predmeti in rastje do 26 %; gumirana linija 4,5–18 %. Največji strošek na piko je teren, ne cesta.
- **Doseg 165 m** (`setDetailDist`, `js/render.js` 4809–4826) ima oster rob; megla je tam šele 72 / 57 / 43 % (povečava 1,2 / 1,4 / pokončno). Rob je viden na ≤ 1,35 % pik pokončno, s prilagodljivim dosegom 82,5 m na 3–5 %. Doseg ostane (prihrani 0–69 klicev pri 1,4); rob skrijeta V2 ali megla.

### Posnetki zdaj
En kader na progo brez nasprotnikov, izrisan v testnem okolju z mero telefona (360 × 640, DPR 2, SREDNJA, `high`) in računalnika (1280 × 720, DPR 2, VISOKA). Jezero Ring in Toskana, Italija sta zamrznjeni (testni): samo za primerjavo, nikoli cilj.

| Proga (m od starta) | referenčni srednji telefon (SREDNJA, `high`): klici / oglišča | zmogljiv računalnik (VISOKA): klici / oglišča |
|---|---|---|
| Jezero Ring (210) | 84 / 364 tisoč | 91 / 444 tisoč |
| Toskana, Italija (190) | 108 / 1,07 milijona | 121 / 1,28 milijona |
| Spa, Belgija (2840) | 137 / 405 tisoč | 159 / 491 tisoč |
| Killar, Indija (1780) | 139 / 474 tisoč | 179 / 646 tisoč |
| Medeu, Kazahstan (1400) | 189 / 1,24 milijona | 210 / 1,65 milijona |
| Luanda, Angola (1520) | 103 / 354 tisoč | 109 / 367 tisoč |

Številke posameznega kadra niso primerljive z vrati (v zaporedju vrat Spa, Belgija doseže 302 / 950 tisoč na SREDNJA). Medeu, Kazahstan in Toskana, Italija na SREDNJA presežeta 900 tisoč oglišč (vrata ju ne merijo).

### Vidne slabosti
1. **Tla:** velike enobarvne ploskve skoraj brez razlik na velikem merilu; ravni ostri prehodi med travo, gramozom in tlakovano ploskvijo (Spa, Belgija); ponavljajoče se okrogle lise (Luanda, Angola); temna enolična tla (Medeu, Kazahstan).
2. **Asfalt:** enakomerno siv, brez zrna in brez odboja svetlobe; razpoke so posamezne nalepke (Spa, Belgija); sledi gum so vidne.
3. **Sence:** ostre in temne; ni zatemnitve ob stiku (drevesa, ograje, stavbe na tleh). Killar, Indija, m 1780: oster pravokotnik ob serpentini, kjer se senčni okvir konča.
4. **Daljava:** na progi Killar, Indija je stena doline enolična meglena ploskev.
5. **Rastje:** preprosta, redka drevesa; ostri robovi krošenj.
6. **Kamera** je visoko in gleda navzdol; obzorja skoraj ni. Nebo in atmosfera nista vredna dela.

## Primerjava po področjih
»Velike igre« so splošni povzetki tehnik sodobnih dirkalnih iger visokega razreda, ne trditve o posamezni igri. Trditve o resničnem videzu imajo vir v razdelku »Viri«.

### Teren in tla
- **Velike igre:** več plasti tal, mešanih po maski in višini; skala na strminah, projicirana z več strani; razlike na velikem merilu proti ponavljanju; normale za podrobnosti; teren iz natančnih višinskih modelov.
- **Pri nas:** višinski model v polju `dem` v `js/tracks/<id>.js`, dekodiran v `js/world.js` (~4480–4530); pokrovnost `lc` na 16 m, razredi 0–3; mreža tal (`js/world.js` ~1501) je osvetljena po ogliščih, barve oglišč × ploščica trave ali tlaka (1556); teksture iz `Tex.all()` (`js/tex.js` 705–716); brez normalnih tekstur, mask mešanja in polj tekstur; `aoWorld` (`js/world.js` 4073); `js/world-dolina-bt.js` na 7 gorskih progah.
- **Razlika in kaj je izvedljivo v chase + r128 + telefon:** teren je največji strošek na piko, zato največ dve plasti na oglišče z utežmi, pečenimi v orodju (SR3′), in pečeno senčenje v barvah oglišč (SR4a, 0 ms med dirko). WorldCover ima celice 10 m in 11 razredov, med njimi golo ali redko poraslo površje ter sneg in led [1]; pas 60 m na vsaki strani ceste je torej 6 celic (sklep). Copernicus GLO-30 je površinski model s celicami 30 m [2]. Natančnejši teren zunaj vozne površine (V3′): valonski model iz lidarja 0,5 m, snemanje 14. 1.–5. 3. 2022, ~13 točk/m² [4] (Spa, Belgija ga že uporablja, pridobitev je samo ločljivost); swissALTI3D 0,5 m, odprt od 1. 3. 2021, vir je treba navesti [6]; valižanski lidar, sestavljeni model terena (~70 % Walesa, 0,25–2 m) [47]. TINITALY 10 m [3] pride v poštev samo, če izvedba uporabi višine za Livorno, Italija.

### Asfalt (obraba, zaplate, črte, robniki)
- **Velike igre:** plasti v koordinatah ceste (zrno, vezivo, zglajena linija vožnje, razpoke, zalivke, zaplate); osvetlitev po pikah s spremenljivo hrapavostjo; visoko anizotropno filtriranje in glajenje sijaja na daljavo; označbe po predpisih.
- **Pri nas:** asfalt osvetljen po ogliščih, makadam po pikah z reliefom (`js/world.js` 1611–1613); `asphaltLook` (`js/render.js` 4382); trakovi obrabe `roadWear` (`js/world.js` 3752, na vseh progah 4399), `ROAD_WEAR` 0,75 mesto, 0,3 steza, 0,8 odprta cesta (3750–3755); zalite razpoke prečno na 25–60 m in vzdolžno na 50–110 m (3782); sledi gum `tyreMarks` (3695); gumirana linija (`js/render.js` ~3905–4012, PR #717); označbe `CRTE` za 20 držav (`js/world-cesta.js` 42–64) prek `crte()` (69), vnosi `PROGE` (122); robniki 0,045–0,085 m nad cesto (`js/world.js` ~763, 1661–1672); anizotropija (`js/tex.js` 7, 705–708).
- **Razlika in kaj je izvedljivo v chase + r128 + telefon:** zrno z odbojem samo v materialih ceste po progi, na NIZKA pečeno (SR1); zaplate in zalite razpoke v senčilniku ceste namesto trakov nalepk (SR2); označbe v graditeljih prog, ne nove vrstice `CRTE` (H2′); anizotropija se preveri v SR1 in SR3′ (H5). Na irskih javnih cestah je robna črta rumena: prekinjena (RRM 025) ali neprekinjena, široka ~150 mm (RRM 026) [28], [29]; zato rumena robna črta samo na stranskih javnih cestah ob progi Kildare, Irska, ne na stezi, črtice na vsakih 1,5 m (`js/world-kildare-obcestje.js` 103) pa se preverijo po [28], [29]. Seul, Južna Koreja: koda riše črte pasov 4 m na vsakih 10 m, široke 15 cm (`js/world-seoul.js` 117, 138); preveri po [36′]. Furka, Švica: sredinska črta 4 / 8 m je narisana ročno in neprekinjena v serpentinah (`js/world-prelaz.js` 36); preveri po [41′]. Pembrey, Wales: stranske ceste po [39], [40], samo če želimo. Livorno, Italija: samo po odločitvi, sedanji videz E0 je potrjen [42′]. Robniki ostanejo.

### Rastje (gostota, LOD, impostorji)
- **Velike igre:** stopnje podrobnosti do impostorjev v daljavi; zbledevanje z razpršenjem ali alpha-to-coverage; trava iz map gostote; veter v več plasteh; presevanje listov.
- **Pri nas:** »mehke krogle« od 5. 11. (`docs/realizem.md` 38, `js/world.js` ~493, `docs/drevesa-a.md`), poceni jelka čez 80 m; `alphaTest` 0,5 (`js/world.js` 3614, 4393); brez impostorjev; gostota 1 / 0,72 / 0,45 po stopnjah (`DETAIL`, `js/world.js` ~19–23); doseg z ostrim robom (`js/render.js` 4809–4826); na Spa, Belgija rastje ~175–210 tisoč oglišč in ~25 klicev (`docs/drevesa-a.md`).
- **Razlika in kaj je izvedljivo v chase + r128 + telefon:** zbledevanje rastja (V1) in daljni impostorji, pečeni iz »mehkih krogel« in združeni v obstoječe kose mreže, ki skrijejo rob dosega (V2). Rastje zavzame do 26 % slike, zato se strošek zavrženja pik izmeri na napravi. Gosta trava ob cesti povsod je zavrnjena.

### Osvetlitev (PBR, sence, AO, nebo, megla, ura dneva)
- **Velike igre:** fizikalno osnovani materiali; nebo in atmosfera po fizikalnem modelu; okoljska osvetlitev iz slike in svetlobne sonde; kaskadne mehke sence; zatemnitev ob stiku; prostorninska in višinska megla s sipanjem proti soncu; sonce iz lege, datuma in ure.
- **Pri nas:** luč neba in tal (`HemisphereLight`, `js/render.js` 3377) in sonce (`DirectionalLight`, 3378); ena senčna mapa (`PCFShadowMap`, 3368), 2048 na `high`, sicer 1024 (3744–3746), z meglico 1536 ali 1024 (4147–4148); mehčanje `SOFT_SHADOW` (3736); prilegajoči okvir samo na NIZKA (10220), sicer stalni kvadrat 160 m, teksel 160 / velikost mape (10214); megla (3415, vsako sliko 10208), višinska megla (4153–4191) in dinamična meglica (4182–4183); `setAtmos` (4334); teme `THEMES` (3764), `applyTheme` (3796); žarki samo na `high` (4192, 4320); okolje za odseve `makeEnv`, kocka 64² (2580); 171 popravkov `onBeforeCompile`; `aoWorld` obstaja, a na slikah zatemnitve ob stiku ni; sonce statično.
- **Razlika in kaj je izvedljivo v chase + r128 + telefon:** mehak rob senčnega okvirja (H6) in prilegajoči okvir na SREDNJA in VISOKA (H7). Sonce iz lege, datuma in ure (H3): opoldanska višina sonca je 90° − |širina − deklinacija|, deklinacija med −23,44° in +23,44° [9]; Koli, Finska (~63° s. š.) ima decembra opoldne pod 5° (izračun ~3,6°) [9], zato pogoj senčne luči ≥ ~25–30°. Višinska megla s sipanjem proti soncu (H4); pojav zračne perspektive [11] (samo ozadje, gostota ne iz tega vira). Pečeno senčenje terena (SR4a). Nebo zavzame ~0 % slike, zato nebo, atmosfera in okoljski odsevi (V6) niso vredni dela.

### Poprocesiranje (tone mapping, bloom, TAA)
- **Velike igre:** HDR z osvetlitvijo in prilagajanjem očesa; filmska tonska krivulja; barvna korekcija s 3D-tabelo; časovno glajenje ali povečava ločljivosti; zameglitev gibanja in globinska ostrina; bloom iz verige mip.
- **Pri nas:** brez tonske preslikave; prehod post samo na `high` (`initPost`, `js/render.js` 4698–4776; `postOn` 4781): 4× MSAA, nagib in premik ostrine (tilt-shift), glajenje robov, ostrenje, zameglitev gibanja; barvna korekcija (nasičenost 1,1, kontrast 1,04, gama 0,88; privzete vrednosti 4705–4706, senčilnik 4746) in vinjeta 0,17; bloom na ¼ ločljivosti samo v mraku in ponoči; lak avtov ima lastno mehko zaobljenje svetlih tonov (`CG_ROLL` 2554, `cgPatch` 2560, `cgSet` 2574); `normal` nima prehoda post.
- **Razlika in kaj je izvedljivo v chase + r128 + telefon:** šibki telefoni dobijo barvno korekcijo, pečeno ob nalaganju (H1″, 0 ms med dirko); post na `high` ostane edino mesto korekcije na piko; tonska preslikava se ne spreminja. Časovno glajenje, HDR in bloom za zmogljiv računalnik (V6) ter tuje tonske krivulje so zavrnjeni.

### Obcestje po virih
- **Velike igre:** stavbe iz tlorisov s strehami; ograje in oprema po standardih; rastje iz pokrovnosti tal; okolica iz lidarja ali fotogrametrije.
- **Pri nas:** polja v `js/tracks/<id>.js`: `bld`, `yard` (0 servisna, 1 pločnik, 2 ograja, 3 zid, 4 varnostna ograja), `posts`, `brook`, `points`, `lc`, `dem`; 23 datotek `world-*-obcestje.js` in ~80 `world-chase-bt*.js`; stavbe so večinoma kvadri (paket S).
- **Razlika in kaj je izvedljivo v chase + r128 + telefon:** ograje, zidovi, žive meje in drevoredi iz OSM samo kot videz, brez trkalnikov (V4, N7). Varnostna ograja je neprekinjena ovira na stebričkih z gladko stranjo proti cesti [12]; živa meja je v OSM ovira, drevored ni [13]. Stavbe ostanejo v paketu S; satelitski in letalski posnetki so zavrnjeni.

### Vreme
- **Velike igre:** model mokrih materialov; odsevi v zaslonskem prostoru ali ravninski odsevi; prostorninski dež; pršec za avti; sneg po usmerjenosti ploskev.
- **Pri nas:** `applyWeather` (`js/render.js` 3837); enakomerno temnenje ceste v `applyRoad` (3846–3858); linija sušenja (3862–3864); pljuski (4021–4038); luže (4040–4127); mokre lise in kapljice na zaslonu niso narejene.
- **Razlika in kaj je izvedljivo v chase + r128 + telefon:** mokra površina potemni, ker se del svetlobe, razpršene v vodnem sloju, na meji voda–zrak popolnoma odbije nazaj in se vpije [10]. Videz mokre ceste ostane (SR1 ga ne spreminja); mokre lise in kapljice → »Vreme med dirko«; sneg → #519; ravninski odsevi na telefonu so zavrnjeni.

## Izboljšave po koristi na strošek
Razvrščeno po k/s (korist na sejo).

| ID | izboljšava | korist | seje | k/s | klici | oglišča | telefon in zatikanje | datoteke | tema/paket | sodba preverjanja |
|---|---|---|---|---|---|---|---|---|---|---|
| H6 | Mehak rob senčnega okvirja | 2 | 0,75 | 2,7 | 0 | 0 | ≤ 0,05 ms (ocena); del senčilnika zamenjan ob nalaganju, pred prvim prevodom | nov modul prek `Render.ext`; kljuka v `js/render.js` ob izvedbi | grafika (H0, H6, H7) | DRŽI S POGOJEM |
| SR1 | Zrno asfalta | 4 | 1,75 | 2,3 | 0 | 0 | 0,2–0,6 ms (ocena), pokončno več; NIZKA pečeno (0 ms); `initTexture`; + 0,5 MB | `js/tex.js`, `js/world-cesta.js` | E0 | DRŽI S POGOJEM |
| H3 | Sonce iz lege, datuma in ure | 2 | 1 | 2,0 | 0 | 0 | 0 ms; senčna luč ≥ ~25–30° ali nova meritev vrat | `js/tracks/<id>.js`, nov modul, kljuka v `applyTheme` | G0 | DRŽI S POGOJEM |
| H2′ | Talne označbe v graditeljih prog | 2 | 1 | 2,0 | 0 | ± 1 tisoč | 0 ms | graditelji prog; varovalo v `js/world-cesta.js` | E0 | NE DRŽI → popravljeno |
| SR4a | Pečeno senčenje terena | 2,6 | 1,5 | 1,75 | 0 | 0 | 0 ms; peka ob nalaganju ali v orodju | `js/world.js` (`aoWorld`), `tools/proga-podatki.py` | G0 | DRŽI S POGOJEM |
| H4 | Višinska megla s sipanjem proti soncu | 1,5 | 1 | 1,5 | 0 | 0 | ~0 ms po ogliščih (ocena); `scene.fog` na mestu | nov modul | G0 | DRŽI S POGOJEM |
| SR2 | Zaplate in zalite razpoke v senčilniku ceste | 3 | 2 | 1,5 | −1 do −14 (vsi trakovi) | −1 do −41 tisoč | + 0,1–0,4 ms (ocena); meri z ovojem | `js/world-cesta.js`, `js/tex.js`, `js/world.js`, `tools/proga-podatki.py` | E0 | NE DRŽI → popravljeno |
| H1″ | Barvna korekcija za šibke telefone, pečena ob nalaganju | 2 | 1,5 | 1,3 | 0 | 0 | 0 ms med dirko | nov modul, kljuka v `applyTheme` | G0 | NE DRŽI → popravljeno |
| SR3′ | Plasti tal, največ dve na oglišče | 4 | 3 | 1,3 | 0 | 0 | ~0,4–1,1 ms (ocena); atlas (WebGL1); + 1,4–5,6 MB | `js/tex.js`, `js/world.js`, graditelji prog, `tools/proga-podatki.py` | G0 (`docs/realizem/paket-g.md` 14) | NE DRŽI → popravljeno |
| V4 | Ograje, zidovi, žive meje in drevoredi iz OSM | 3,5 | 3 | 1,2 | 0 na meji | 0 na meji | `customDepthMaterial` in ogrevanje; izmeri na SREDNJA | graditelji prog | E0 | DRŽI S POGOJEM |
| V1 | Zbledevanje rastja | 2 | 2 | 1,0 | 0 | 0 | izklop zgodnjega zavračanja na rastju (do 26 %): izmeri | nov modul | G0 | DRŽI S POGOJEM |
| V3′ | Natančnejši teren zunaj vozne površine | 2 | 2 | 1,0 | 0 | zamenjava v pasu ±60 m | 0 ms; vozna površina ostane | `js/tracks/<id>.js` (`dem`), `tools/proga-podatki.py` | G0 | NE DRŽI → popravljeno |
| V2 | Daljni impostorji | 2,4 | 3 | 0,8 | 0 na meji | 0 na meji | atlas v pomnilniku; najprej izmeri korist | nov modul | G0 | DRŽI S POGOJEM |

Predpogoja in preverjanje (niso razvrščeni):

| ID | izboljšava | korist | seje | k/s | klici | oglišča | telefon in zatikanje | datoteke | tema/paket | sodba preverjanja |
|---|---|---|---|---|---|---|---|---|---|---|
| H0 | Meritev višjih stopenj in privzete povečave | predpogoj | 0,5 | — | — | — | — | `tests/browser/perf.test.mjs`, novo poročilo ob `tests/golden/` | grafika | DRŽI S POGOJEM |
| H7 | Prilegajoči senčni okvir tudi na SREDNJA in VISOKA | predpogoj | 0,5 | — | 0 do −13 v senčnem prehodu (ocena, neizmerjeno) | 0 | NIZKA nespremenjena | pogoj v `js/render.js` 10220 (kljuka ob izvedbi) | grafika | novo po preverjanju (iz V5) |
| H5 | Anizotropno filtriranje | samo preverjanje | — | — | 0 | 0 | teren na NIZKA ostane 4× | `js/tex.js` | v SR1 in SR3′ | DRŽI (popravek) |

Korist 1–5 = vidnost v kameri chase × delež prog, na katerih se pozna × koliko se pozna na telefonu (ocena); k/s = korist / seje. Datoteke pri H4, V1, V2, V3′ in V4 ter klici pri V1 in V3′ so sklep (zasnova jih ne navaja); vsa nova logika gre v module prek `Render.ext` (N8).

### Pogoji po postavkah
- **H0:** ločeno poročilo ob `tests/golden/`, ki ga vrata ne berejo (vrata in obstoječi goldeni ostanejo, `golden:update` ne prepiše vrat): SREDNJA, VISOKA in NIZKA pri povečavi 1,4 in pokončno, z ovojem iz vrat in z nasprotniki.
- **H6:** širina prehoda je uniform, 0 na zamrznjenih progah in v razstavnem prostoru (pri 0 enako kot danes); senčni del senčilnika (`ShaderChunk`) se zamenja ob nalaganju, pred prvim prevodom kjerkoli (tudi meni in garaža), ker r128 besedila delov ne upošteva v ključu programov. Pred H7.
- **H7:** NIZKA že ima prilegajoči okvir (`fitShadow(tierNow === 0 && …)`, `js/render.js` 10220; izmerjeno 128–160 × 96–128 m), SREDNJA in VISOKA stalni kvadrat 160 m; da prostor na SREDNJA, kjer je Spa, Belgija na 302. Najprej meritev. Po H6.
- **H1″:** na `normal` na izbranih pravih progah se ob nalaganju preračunajo barve palete in oglišč, teksture iz `js/tex.js`, barve megle in ozadja, 12 meglic po progah (na primer `world-baldy.js` 178, `world-hakone.js` 284) in 2 v `js/world.js` (3680, 4113) ter barvni uniformi ~32 lastnih senčilnikov dirkalne scene. Približek (korekcija pred osvetlitvijo, ne po njej): pred kodo odločitev z 2–3 možnostmi in slikami na Spa, Belgija. Avti in razstavni prostor izvzeti; tonska preslikava se ne spreminja, tudi ne ob preklopu `normal`/`high`. Kljuka v `applyTheme` (`js/render.js` 3831, 4147).
- **H3:** statično med dirko; datum in ura po progi iz raziskave proge; zamrznjene proge obdržijo današnje sonce. Nizko sonce raztegne senčni okvir na tleh za 1/sin(višina sonca): več metalcev senc, manj natančne sence. Pravi azimut in barva svetlobe po pravem soncu. H6 najprej. Kljuka v `applyTheme` (3796).
- **H4:** uniform po progi se prišteje dinamični meglici (`js/render.js` 4182–4183), je ne prepiše; po pikah bi stal 0,2–0,7 ms (ocena); nikoli nov objekt megle ali menjava vrste megle (prevod vseh materialov); gostota iz javnih podatkov o vidljivosti, sicer današnja; ena tema z »Dolina pod robom«.
- **H2′:** varovalo za zamrznjene proge v `crte()` in `cesta.finish()` (`js/world-cesta.js`); ± 1 tisoč oglišč v obstoječih mrežah ceste.
- **H5:** cesta 8×, večina tekstur v `world-*` 4×; teren na NIZKA ostane 4× (53–78 % pik pod ostrim kotom, 8× bi stalo branja).
- **SR1:** ena pakirana tekstura (normala in sijaj), glajenje sijaja na daljavo, anizotropija ≤ 4, `initTexture` ob nalaganju, primerjava na napravi z obstoječim makadamom kot približkom; na NIZKA pečeno v barvo, razen če meritev pokaže ≤ 0,1 ms; samo v materialih ceste po progi (`js/world-cesta.js`), ne v skupnem `applyRoad` (`js/render.js` 3846–3858); zamrznjeni vnosi `PROGE` ostanejo; videz mokre ceste ostane; nove slike E0.
- **SR2:** atlas v koordinatah ceste; gostota iz OSM `surface`/`smoothness`, vrsta po raziskavi proge; proceduralni položaji in `ROAD_WEAR` sta predpostavki v `docs/proge/<id>.md`; trakove `roadWear` odstrani samo na progah s SR2, zamrznjene (tudi Jezero Ring) jih obdržijo. Prihranek pri vseh skritih trakovih (obraba, sledi, gumirana linija, linija sušenja): mediana −5 do −6 klicev, 0 v senčnem prehodu, Spa, Belgija na SREDNJA 302 → 295; sam SR2 manj.
- **SR3′:** trava, zemlja, gramoz in skala (skala, kjer WorldCover kaže golo površje; naklon le kot zapisana predpostavka); uteži speče `tools/proga-podatki.py`; dve branji in tekstura na velikem merilu z nizko ločljivostjo proti ponavljanju; prehodi mehki po celicah WorldCover; mehak rob trave (želja 12. 11.); štiri plasti bi stale 0,9–2,7 ms (ocena); anizotropija ≤ 2 na NIZKA, po potrebi ena plast; paziti na telefone z ≤ 3 GB; viri zdaj samo za Spa, Belgija in Killar, Indija; preveri vse uporabnike `world-chase-bt*.js` zaradi zamrznjenih prog.
- **SR4a:** zatemnitev v kotanjah iz višinskega modela, lastna senca gora od statičnega sonca (H3; brez H3 današnje sonce) in zatemnitev pod krošnjami v barvah oglišč; veja `aoWorld` po progi; peka ob nalaganju ali v orodju, nikoli v zanki dirke.
- **V1:** alpha-to-coverage potrebuje MSAA: na `normal` je, na `high` z WebGL1 ga ni (`js/render.js` 4699–4703), tam razpršeno zbledevanje; oboje z ujemajočim `customDepthMaterial` (senčni prehod ima skupen material brez teksture) in ogrevanjem; vrata za zamrznjene; »mehke krogle« ostanejo.
- **V2:** pas sledi `detailDist`, tudi prilagodljivemu 82,5 m, in skrije oster rob dosega (do 1–5 % pik); atlas šteje v pomnilnik.
- **V3′:** Spa, Belgija: gostejše vzorčenje obstoječega valonskega modela (prostor: 255 / 658 tisoč pri 1,4); Furka, Švica: swissALTI3D 0,5 m; Pembrey, Wales: valižanski lidar, če pokrije kraj; vozna površina in fizika ostaneta.
- **V4:** en kos mreže na material (ločene mreže ograj stanejo klice); žive meje z izrezi potrebujejo `customDepthMaterial` in ogrevanje.

## Paketi

### Načela izvedbe
- **N1 Vrata.** Vsaka sprememba je vklopljena po progi (uniform ali zastavica, privzeto 0) in samo na pravih progah. Zamrznjene proge ostanejo do bita enake, njihovi goldeni se ne spremenijo; nova zamrznjena proga je varna brez urejanja.
- **N2 Avti in garaža.** Avti, garaža in razstavni prostor (isti izrisovalnik: `garage3d.js` 8112 → `Render.init`) dobijo vrednost 0 in ostanejo enaki; `js/cars`, `js/garage*.js` in #1069 se ne spreminjajo.
- **N3 Zatikanje (#1104).** Vsak material, različica in tekstura obstaja pred `Render.precompile` (`js/render.js` 4863); uniformi namesto define; nič geometrije na sliko; na telefonu noben nov celozaslonski prehod. `precompile` ne prevede programov za senčni prehod in `customDepthMaterial`, zato se med lučmi na startu izriše ena skrita slika s sencami. Teksture gredo skozi `renderer.initTexture` ob nalaganju (kot sharedTex, 3444–3452). Test preveri, da se `renderer.info.programs.length` od zelene luči do cilja ne spremeni. Med dirko nikoli nov objekt megle, nova luč, menjava okolja za odseve ali tonske preslikave. `precompile` ne pokrije razstavnega prostora.
- **N4 Enkrat na progo** (`docs/odlocitve.md` 241). Grafika na progo enkrat, ko je proga na `main`: orodje enkrat (pilot na Spa, Belgija), uporaba po progah v rednem prehodu G0 (paket G) in E0 (paket E), ne po postavkah čez vse proge.
- **N5 Raziskava pred kodo.** Vsaka proga svoja raziskava; viri zdaj samo za Spa, Belgija in Killar, Indija; predpostavke v `docs/proge/<id>.md`.
- **N6 Meje.** H0 najprej; na progah na meji samo zamenjave, ki klice in oglišča zmanjšajo.
- **N7 Fizika.** Nič ne bere oprijema; teren se spreminja samo zunaj vozne površine; ograje brez trkalnikov (Trki #608).
- **N8 Datoteke.** Logika v novih modulih prek `Render.ext` (vzorec `js/render-vecer.js`); `js/render.js` dobi ob izvedbi samo kljuko, kjer je ni.
- **N9 Meritev na napravi.** H6, SR1, SR2, SR3′ in V1 se pred vklopom izmerijo na šibkem telefonu in na referenčnem srednjem telefonu: ms na sliko, ne število slik na sekundo, ker zanka strošek plača v ločljivosti. Če strošek preseže oceno, NIZKA dobi pečeno ali preprostejšo različico.

### Srednji (priporočeno)
- **Postavke:** Hitri + SR1 in SR2 (E0), SR3′ in SR4a (G0).
- **Pridobimo:** tla s plastmi in mehkimi prehodi namesto enobarvnih ploskev; zrno in odboj na asfaltu; zaplate in zalite razpoke namesto nalepk; zatemnitev v kotanjah, pod krošnjami in lastno senco gora. To je večina slike v kameri chase.
- **Izgubimo:** potrjeni videz E0 se spremeni (nove slike); ~+0,5–1,6 ms na sliko (ocena), ki jih zanka plača v ločljivosti; + 2–6 MB tekstur (paziti na telefone z ≤ 3 GB); trakovi nalepk izginejo samo na progah s SR2.
- **Proračun na šibkem telefonu:** klici −1 do −14 z vsemi trakovi (sam SR2 manj), oglišča ≤ 0; ~+0,5–1,6 ms (ocena: SR3′ 0,4–1,1, SR2 0,1–0,4, H6 ≤ 0,05, SR1 pečen 0); + 2–6 MB. SREDNJA in VISOKA še H7: 0 do −13 klicev.
- **Seje:** ≈ 14,5.
- **Zakaj priporočeno:** kamera chase gleda navzdol, teren (53–78 %) in cesta (10–46 %) zavzameta večino slike; enolična tla in gladek asfalt sta največja razlika do velikih iger. Pogoj je meritev na napravi (N9): prvotna zasnova bi stala 1,7–6,5 ms na sliko (ocena). Veliki doda ~10 sej za korist, ki se pozna večinoma daleč ali ob robu slike.
- Slike potem na kartici so predogled.

### Hitri
- **Postavke:** H0, H6 in H7 (tema grafike); H1″, H3 in H4 (G0); H2′ (E0); preverjanje H5 v SR1 in SR3′.
- **Pridobimo:** mehak rob senčnega okvirja (Killar, Indija, m 1780); sonce po pravi legi, datumu in uri; višinska meglica s sipanjem proti soncu v daljavi; označbe po predpisih na izbranih progah; ton po državi tudi na šibkih telefonih.
- **Izgubimo:** največja razlika (enolična tla, gladek asfalt) ostane. Videz izbranih pravih prog na `normal` se spremeni (slike prej/potem na Spa, Belgija); zamrznjene proge in avti ostanejo enaki. Sonce vodi tudi odsev na avtih (`cgSet`, `js/render.js` 2574): slike avtov pred in po. H1″ je približek: pred kodo odločitev z 2–3 možnostmi in slikami.
- **Proračun:** NIZKA 0 klicev, ± 1 tisoč oglišč, ~0–0,05 ms (ocena, H6); SREDNJA in VISOKA še H7: 0 do −13 klicev (ocena); teksture ~0 MB (sklep).
- **Seje:** ≈ 6.

### Veliki
- **Postavke:** Srednji + V1, V2 in V3′ (G0) ter V4 (E0).
- **Pridobimo:** mehko zbledevanje rastja; impostorje v daljavi, ki skrijejo rob dosega; natančnejši teren ob progi (Spa, Belgija; Furka, Švica; Pembrey, Wales); ograje, zidove, žive meje in drevorede po OSM.
- **Izgubimo:** ~10 sej za korist, ki se pozna večinoma daleč ali ob robu slike; strošek V1 je znan šele po meritvi; atlas impostorjev šteje v pomnilnik.
- **Proračun:** kot Srednji; V2, V3′ in V4 brez dodanih klicev in oglišč na progah na meji; strošek V1 na rastju se izmeri na napravi.
- **Seje:** ≈ 24,5.

### Teme in vrstni red
- H0, H6, H7: ena majhna tema grafike, pred G0 in E0 (H6 pred H7).
- G0 / paket G: H1″, H3, H4 (z »Dolina pod robom«, `docs/realizem.md` 104), SR3′, SR4a, V1, V2, V3′.
- E0 / paket E: H2′, SR1, SR2, V4.
- Ena tema na sejo, največ 6 odprtih tem.

## Adversarialno preverjanje
Zasnovo sta neodvisno preverila dva pregleda: realizem, pravna varnost in pravila projekta ter zmogljivost in kamera chase. Velja strožja sodba; pogoji so vključeni v postavke zgoraj.

| Postavka | realizem in pravila | zmogljivost in kamera | končno: sodba in pogoj |
|---|---|---|---|
| H0 | s pogojem | s pogojem | DRŽI S POGOJEM: ločeno poročilo pri 1,4 in pokončno, z ovojem in nasprotniki |
| H1 → H1′ → H1″ | ne drži | ne drži (0,5–2,8 ms, ocena) | NE DRŽI → popravljeno: pečeno ob nalaganju; post na `high` ostane; avti, garaža in zamrznjene izvzeti |
| H2 → H2′ | ne drži | drži s popravkom | NE DRŽI → popravljeno: v graditeljih prog; varovalo za zamrznjene |
| H3 | s pogojem | s pogojem | DRŽI S POGOJEM: senčna luč ≥ ~25–30° ali nova meritev; H6 najprej |
| H4 | s pogojem | s pogojem | DRŽI S POGOJEM: po ogliščih; `scene.fog` se spremeni na mestu |
| H5 | drži | drži s popravkom | DRŽI: teren na NIZKA ostane 4× |
| H6 | s pogojem | s pogojem | DRŽI S POGOJEM: uniform 0 na zamrznjenih; zamenjava pred prvim prevodom |
| H7 | — | novo iz V5 | predpogoj: najprej meritev |
| S1 → SR1 | s pogojem | s pogojem | DRŽI S POGOJEM: meritev na napravi; NIZKA pečeno |
| S2 → SR2 | s pogojem, delno ne drži | ne drži (številke) | NE DRŽI → popravljeno: −1 do −14 klicev; trakovi odstranjeni samo na progah s SR2 |
| S3 → SR3′ | s pogojem | ne drži (strošek) | NE DRŽI → popravljeno: največ dve plasti, atlas |
| S4a → SR4a | s pogojem | drži | DRŽI S POGOJEM: peka nikoli v zanki dirke |
| S5 (mokra cesta) | premakni | s pogojem | PREMAKNJENO: »Vreme med dirko« |
| V1 | s pogojem | s pogojem | DRŽI S POGOJEM: `customDepthMaterial`, ogrevanje, meritev |
| V2 | s pogojem | s pogojem | DRŽI S POGOJEM: združeno v obstoječe kose; najprej korist |
| V3 → V3′ | ne drži | s pogojem | NE DRŽI → popravljeno: zamenjava oglišč v pasu; samo viri za prave proge, irski lidar zadržan |
| V4 | s pogojem | s pogojem | DRŽI S POGOJEM: brez trkalnikov; združeno; izmeri na SREDNJA |
| V5 | s pogojem | ne drži na NIZKA | ZAVRNJENO → H7: spremeni do 6,83 % pik (prag šuma 2,68 %) |
| V6 | s pogojem (samo VISOKA, po H0) | ne drži | ZAVRNJENO: ≥ + 56 klicev, + 210 tisoč oglišč |
| V7 (sneg) | premakni | s pogojem | PREMAKNJENO: #519 |

### Kaj se je po preverjanju spremenilo
Pregled realizma, pravne varnosti in pravil:
- H1 → H1′: barvna korekcija kot skupni uniform, mehko zaobljenje svetlih tonov po vzoru obstoječega na laku avtov (lastna koda); samo v materialih, kjer post ni vklopljen (`normal`); post na `high` ostane; avti, garaža in zamrznjene proge izvzeti; barva megle predhodno korigirana. Po pregledu zmogljivosti nato H1″.
- H2 → H2′: označbe v graditeljih prog, ne nove vrstice `CRTE` (`CRTE` kliče samo 7 graditeljev: `livorno`, `hiva`, `mombasa`, `luanda`, `eljem`, `isalo`, `portobelo`).
- V3 → V3′: samo viri za prave proge; Pembrey, Wales po valižanskem lidarju [47]; irski lidar zadržan.
- S5 (mokra cesta) in V7 (sneg) premaknjena drugam; S → SR; dodana H0 in H6.
- Viri: [36], [41] in [42] zamenjani z [36′], [41′] in [42′]; dodan [47]; izločeni viri brez uporabe ali samo za zamrznjene proge ter tonska krivulja tujega izvora.

Pregled zmogljivosti in kamere:
- H0: dodani povečava 1,4, pokončno, ovoj iz vrat in nasprotniki; `renderer.info` ni merilo.
- H1′ → H1″: korekcija na piko bi na `normal` stala 0,5–2,8 ms, ne 0,03–0,05 ms (ocena); zdaj pečena ob nalaganju (0 ms), post na `high` ostane.
- H3: pogoj višine senčne luči ~25–30° ali nova meritev po progi. H4: člen sipanja po ogliščih, megla se spremeni na mestu. H5: teren na NIZKA ostane 4×. H6: zamenjava dela senčilnika pred prvim prevodom.
- V5 → H7: NIZKA že ima prilegajoči okvir; ±40 m na NIZKA zavrnjen; prilegajoči okvir tudi na SREDNJA in VISOKA.
- SR1: cesta je 10–46 % pik (ne 30–40 %); 0,2–0,6 ms (ocena); na NIZKA pečeno.
- SR2: −1 do −14 klicev (ne −5 do −20), 0 v senčnem prehodu; meri z ovojem.
- SR3 → SR3′: največ dve plasti na oglišče, ~0,4–1,1 ms namesto 0,9–2,7 ms (ocena); atlas za WebGL1.
- V1, V2, V4: združevanje v obstoječe kose mreže, `customDepthMaterial`, ogrevanje; V2 0 klicev na progah na meji. V3′: zamenjava oglišč v pasu, ne nova plast. V6 zavrnjen (≥ + 56 klicev, + 210 tisoč oglišč).
- Proge na meji: dodan `koli`, vse pri povečavi 1,4.
- Proračun: Srednji ~+0,5–1,6 ms (ocena) namesto +0,2–0,6 ms, −1 do −14 klicev namesto −5 do −20, ≈ 14,5 seje namesto 13; Hitri ≈ 6 namesto 5,5; Veliki ≈ 24,5 namesto 28.
- N3 razširjen (ogrevanje senčnih programov, `initTexture`, test števila programov); N9 nov (meritev na napravi).

## Premaknjeno drugam in zavrnjeno
Premaknjeno drugam:
- Mokra cesta v lisah in kapljice na zaslonu → »Vreme med dirko« (odločeno 6. 11.): oprijem lis ne bere; samo uniformi (define ob začetku dežja bi med dirko prevedel vse materiale ceste); kapljice po stopnji, ker post teče tudi na referenčnem srednjem telefonu (0,2–0,4 ms, ocena).
- Sneg na ploskvah, obrnjenih navzgor → »Zima na severu« #519: ključ `winter` je na 25 progah, zato je potrebna posebna zastavica za sneg; Koli, Finska je na meji (297 klicev pri 1,4), sneg ne sme dodati klicev; po ogliščih ~0 ms (ocena).
- Gumirana linija → `docs/zgumirana-linija.md`; linija sušenja → vreme.
- Ugotovitve o zatikanju → sporočilo za #1104 (PR se ne spreminja):
  - programi za senčni prehod in `customDepthMaterial` se prevedejo med dirko (Spa, Belgija 9, `sepang` 11, `pikes` 5, druge 3); #1104 je na Spa, Belgija videl 6, s slikami 103–152 ms;
  - linija sušenja (`js/render.js` 3862–3864), gumijasti drobir (3887–3897) in gumirana linija (4001–4012) se zgradijo med dirko (geometrija, prevod, tekstura);
  - teksture razen sharedTex se naložijo ob prvem izrisu;
  - `Render.precompile` teče v `ensureTrack` (`js/game.js` 1872), preden obstajajo avti in učinki;
  - predlog: ena skrita slika s sencami med lučmi na startu, gradnja skritih trakov ob nalaganju, test števila programov.

Zavrnjeno:
- Časovno glajenje (TAA): zamegli, ni vektorjev gibanja, potrebuje dodaten prehod.
- Zatemnitev in odsevi v zaslonskem prostoru ter ravninski odsevi na telefonu.
- Nebo in atmosfera (v chase ni neba).
- Polni linearni barvni prostor (prebarvanje 200+ datotek).
- Satelitski in letalski posnetki.
- Gosta trava ob cesti povsod.
- Spremembe avtov in garaže; nove kamere; tuje krivulje tonov; nove vrstice `CRTE` brez graditelja.
- Barvna korekcija na piko na `normal` (prejšnji H1 in H1′): 0,5–2,8 ms (ocena); nadomešča jo H1″.
- Manjši senčni okvir ±40 m na NIZKA (prejšnji V5): −2 do −23 klicev, a spremeni do 6,83 % pik, več od praga šuma 2,68 %; izgubijo se sence na globini 20–58 m, tudi ob avtu ob robovih slike. Nadomešča ga H7.
- Samo za zmogljiv računalnik (prejšnji V6: bližnja senčna kaskada, odsevi ceste iz okolja, bloom): ≥ + 56 klicev in + 210 tisoč oglišč, Spa, Belgija na VISOKA že 309 / 989 tisoč; bloom ≥ 6 celozaslonskih prehodov; HDR potrebuje cilj s plavajočo vejico (`post.rt` je 8-bitni); nova luč ali menjava okolja ponovno prevede materiale; ustvarjanje okolja ustavi nalaganje.

## Odprta vprašanja (za koordinacijo po »ok«)
Niso posebne kartice; odgovori jih koordinacija po »ok«.
1. Ali meja 900 tisoč oglišč velja tudi za SREDNJA (Medeu, Kazahstan 1,24 milijona in Toskana, Italija 1,07 milijona v enem kadru; Spa, Belgija 950 tisoč v zaporedju vrat)? Test zdaj pravi, da višje stopnje mejo smejo preseči.
2. Ali vrata merijo pri povečavi 1,4 (privzeta) ali pri obeh? Pri 1,4 so `sacalobra`, `portomoniz` in `sepang` že danes čez mejo, `koli` je na 297.
3. Kateri seznam pravih prog velja? `docs/realizem.md` 42 je zastarel: Suzuka, Japonska je testna, Medvode, Slovenija je `pending`, »Predelava prog iz PR« doda 14.
4. Ali Bathurst, Avstralija dobi zastavico zamrznjenosti (zdaj samo odločitev)?
5. Datum in ura sonca po progi (raziskava proge).
6. Ali želimo označbe za Livorno, Italija in Pembrey, Wales?
7. V kratkih pravilih projekta piše »Padec čez rob samo Killarney«, odločitev pa je Killar, Indija: popravek v dnevnem PR pravil.

## Viri
- [1] ESA WorldCover 2021, pokrovnost tal 10 m (CC BY 4.0). https://worldcover2021.esa.int/download
- [2] Copernicus DEM GLO-30, opis zbirke. https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM
- [3] TINITALY 10 m, model višin Italije (INGV), CC BY 4.0. https://tinitaly.pi.ingv.it/
- [4] Valonski model terena iz lidarja 2021–2022, predstavitev. https://geoportail.wallonie.be/files/PDF/LiDAR24/Presentations_Generalite_Debats.pdf
- [6] swissALTI3D in pogoji uporabe (swisstopo). https://opendata.swiss/en/dataset/swissalti3d ; https://www.swisstopo.admin.ch/en/terms-and-conditions
- [9] Kalkulator lege sonca (javna ustanova). https://gml.noaa.gov/grad/solcalc/
- [10] Temnenje mokrih površin (članek, 1988). https://doi.org/10.1364/AO.27.001278
- [11] Zračna perspektiva (enciklopedija; samo ozadje, besedilo se ne prepisuje). https://en.wikipedia.org/wiki/Aerial_perspective
- [12] OSM wiki: varnostna ograja. https://wiki.openstreetmap.org/wiki/Tag:barrier%3Dguard_rail
- [13] OSM wiki: živa meja, drevored in ovire. https://wiki.openstreetmap.org/wiki/Landcover%3Dhedge ; https://wiki.openstreetmap.org/wiki/Key:barrier
- [28] Irski predpis o talnih označbah (2026). https://www.irishstatutebook.ie/eli/2026/si/205/made/en/print
- [29] Irski priročnik prometne signalizacije. https://www.gov.ie/en/department-of-transport/publications/traffic-signs-manual
- [36′] Korejski izvedbeni pravilnik k zakonu o cestnem prometu, priloga 6, označbe 501–548 (ni odprto). https://www.law.go.kr/법령/도로교통법시행규칙
- [39] Britanski priročnik prometne signalizacije, 5. poglavje (2018). https://assets.publishing.service.gov.uk/media/5c4ace6ded915d38a0611abc/traffic-signs-manual-chapter-05.pdf
- [40] Britanski predpis o prometnih znakih (2016). https://www.legislation.gov.uk/uksi/2016/362/contents
- [41′] Švicarski pravilnik o signalizaciji SR 741.21, veljavno besedilo (verjeten naslov; potrditi). https://www.fedlex.admin.ch/eli/cc/1979/1961_1961_1961/de
- [42′] Italijanski izvedbeni pravilnik k cestnemu zakoniku, člen 138 (ni odprto). https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.del.presidente.della.repubblica:1992-12-16;495~art138
- [47] Valižanski lidar, sestavljeni model terena (OGL v3.0). https://datamap.gov.wales/maps/lidar-data-download ; https://data.gov.uk/dataset/afbb6701-533e-40cd-a35f-5319664fd91c

Številke sledijo zbirki virov raziskave; manjkajoče so izločene ali tu niso uporabljene, s črtico (′) so zamenjave, [47] je dodan po preverjanju.

### Zasluge, ki jih doda izvedba
Izvedba doda v `README.md`, »Zasluge«, vrstico samo za podatke, ki jih res uporabi, brez imen oseb; besedilo, ki ga zahteva licenca, dobesedno.
- »Višine Furke: swissALTI3D, © swisstopo, odprti državni podatki« (V3′, [6]).
- Višine za Pembrey, Wales: izjava o priznanju avtorstva z zapisa zbirke, dobesedno (V3′, [47]; besedilo še ni odprto).
- »Višine Livorna: TINITALY 10 m v1.1, INGV, DOI 10.13127/tinitaly/1.1, CC BY 4.0« ([3]; samo če izvedba uporabi višine za Livorno, Italija).
- Obstoječe vrstice za OSM, WorldCover, Copernicus DEM in valonski model ostanejo nespremenjene.

### Ni preverjeno
- Vse »ms« so ocene za šibke telefone, ne meritve na napravi (izjema: časi slik iz #1104).
- Pristranskost merilnega okolja proti goldenom: −3 do +23 klicev (`spa` 246 proti 232, `pikes` 174 proti 151; `sepang` 933 proti 899 tisoč oglišč).
- Številke posnetkov zdaj so posamezni kadri brez nasprotnikov.
- Prihranek H7 je ocena po analogiji z NIZKA, neizmerjen.
- Slike potem na kartici so izrisani predogledi, ne končna koda.
- `lusail` pri povečavi 1,4 ni ponovno izmerjen; `koli` pri 1,4 ima 297 klicev (v istem merilnem okolju 302).
- Pokritost in licenca irskega lidarja (zadržan, zato ni med viri) ter pogoji [6]: strani v tej raziskavi niso bile dosegljive.
- Licenca tonske krivulje tujega izvora in njen začetni del (~0,04) nista preverjena; krivulja se ne uporablja.
- Neodprti: [41′] (naslov verjeten; če so mere samo v plačljivih normah, se izmerijo na fotografijah z odprto licenco), [36′], [42′] in besedilo za priznanje avtorstva [47], tudi njegova pokritost (~70 % Walesa, 0,25–2 m).
- Licenca valonskega modela je povzeta samo po `README.md`; veliko vrednosti v zbirki virov je iz izvlečkov iskanja, ne iz izvirnega besedila.
- Vrstice »Velike igre« so splošni povzetki tehnik; njihovi viri niso bili odprti.
