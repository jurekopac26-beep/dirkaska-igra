# AI po tvoji liniji

Želja uporabnika (4. 11. 2026): »ali lahko posnames mojo voznjo in izmeris moje povprecne linije ter hitrost in naredis da ai etkmovalci vozijo v povprecju tudi tako«. Nato: »začni z orodjem, posnetke pošljem pozneje«.

## Koraki

1. **Orodje** `tools/voznja.mjs` (narejeno, pull request #300): iz uporabnikovih posnetkov dirk (`.rrp`) za vsako progo in vreme izmeri povprečno linijo, hitrost in zaviranje. Test `tests/voznja.test.js`.
2. **AI v `js/core.js`** vozi po profilu (`Race._voznja`, `aiDrive`), vsak tekmovalec po svoji težavnosti: poskus na eni progi (Tianmen, veja `ai-linija/korak-2`, vklop `index.html?voznja=1`; razdelek »Korak 2« spodaj).
3. **Test**: AI vozi blizu uporabnikove linije in njegovega časa kroga (začetek v `tests/voznja.test.js`: podatki za igro in dirka na njih).

## Posnetki in zasebnost

- Uporabnik po dirki shrani posnetek (Nastavitve → Orodje za napake → Nastavitve orodja → Zadnji posnetki → Odpri → gumb ».rrp« pri dirki; zadnjih 10 dokončanih dirk igra hrani sama; vrstica orodja je samo v slovenski igri; ali Nastavitve orodja → Posnetek dirke → Shrani za zadnjo dirko) in datoteke pošlje v sejo; uporabnik je prosil, da mu seja javi, ko orodje dela (4. 11. 2026: javljeno z obvestilom na telefon). Odpre jih `node tools/voznja.mjs <posnetek.rrp> … [--out <profil.json>|<mapa>] [--korak <m>]`; izhod privzeto v `test-results/voznja/` (`profil.json`, `povzetek.txt`).
- **Posnetkov in profilov ne shranjuj v repozitorij** (repozitorij je javen; `CLAUDE.md`, Orodje za napake). V repozitorij gresta samo orodje in test; v koraku 2 pridejo v kodo samo izmerjene povprečne vrednosti po progah.
- Koliko posnetkov: krožne proge najmanj 3 čisti krogi, dobro 5, najbolje 8–10, več kot 10 skoraj nič ne izboljša; odprte ceste: vsaka vožnja je en krog, 3–5 voženj. Uporabniku priporočeno (koordinacija, 4. 11. 2026): na isti progi vedno isti avto z istimi nastavitvami (tisti, s katerim običajno dirka), za vsak razred, v katerem pogosto dirka; krožna proga 2 dirki po 4–5 krogov (pri dirkah s 3 krogi 3 posnetki), odprta cesta 5 posnetkov. Suho in mokro posebej (zima posebej), vsako svoj profil. Najbolj čisti so krogi brez tekmecev ob avtu (kronometer, kvalifikacije, dirka z malo tekmeci); deli ob drugih avtih se izpustijo.
- Posnetki od te različice igre naprej imajo v glavi tudi avto igralca (`pf`: nadgradnje, nastavitev, deli garaže, avto prvenstva, pomoč pri vožnji `as`), gume (`ty`) in spremembo vremena (`wxs`; `js/game.js` `rrpOf`). Starejši posnetki: tempo za serijski avto (opomba v povzetku), pomoč 2 (privzeta v igri), vreme kot ob koncu dirke.

## Pravila meritve (`RULES` v orodju)

- **Čist krog**: brez vrtenja (nos več kot 75° od smeri ceste pri več kot 5 m/s, 0,15 s), vožnje nazaj (več kot 1 m/s, 0,3 s), zleta s ceste (sredina avta 1 m čez rob asfalta in robnika, 0,25 s), trka (več kot 50 m/s² izgube hitrosti hkrati po tleh in avtove; v steno 100–150, zavore do ~16, avto, ki drsi postrani, ~30), vrnitve na cesto in boksov. Krog s katerim koli od teh je izpuščen; povzetek pove razlog in kje (metri od štarta).
- **Izpuščeni deli kroga**: ob drugem avtu (7 m vzdolž, 5 m počez) ali tik za njim (0–22 m spredaj, 3 m počez) in 1 s prej in pozneje (prehitevanje, obramba, zavetrje); varnostni avto na progi; štart prvega kroga dirke do prvega ovinka (krožne proge, ne kvalifikacije).
- **Vreme**: krog med spremembo vremena je izpuščen (voda na cesti sledi dežju v 40 s, suha je 240 s na enoto dežja manj; `Race._weather`). Šola vožnje, policijski pregon in vožnja s prometom niso meritve.
- **Povprečje** po točkah na vsakih 5 m od štartne črte; vrednosti, ki so od mediane več kot 3,5 raztrosa (MAD, najmanj 0,3 m linije, 1 m/s hitrosti), izpadejo (napaka na enem mestu enega kroga ne vleče povprečja).
- **Ovinek**: najmanjša povprečna hitrost v ±60 m, vsaj 3 m/s pod najvišjo v 500 m pred njim; zaviranje vsakega kroga v ovinek: zadnje zaviranje pred vrhom, nazaj do začetka (premor do 0,4 s je isto zaviranje).
- **Avtopilot za primerjavo**: orodje v jedru odpelje dirko z avtom kroga (isti avto, nadgradnje, nastavitev, deli, pomoč, vreme, gume, zima; sam na progi, `Core.aiControl`, naključna števila kot v testih): dva kroga, za primerjavo leteči drugi (odprta cesta: vožnja do cilja). Zaviranje vsakega kroga se primerja z njegovim v isti ovinek: razdalja, kjer avtopilot začne 20 m ali več pred vrhom, pojemek, kjer oba zavirata vsaj 15 m (`qMin`; kratek dotik zavore na nekaj metrih je šum). Čas kroga proti njegovemu (prvi krog dirke s štartom proti njegovemu prvemu).

## Profil (`profil.json`)

- Glava: `orodje`, `verzija`, `narejeno`, `pravila`, `datoteke`; `proge`: en profil za vsako progo, vreme (`suho`, `mokro`, `·zima`) in razred avtov.
- Profil: `proga`, `ime`, `odprta`, `dolzina`, `vreme`, `razred` (avti tekmecev, ki jih dirka da temu avtu), `v_razredu` (avto je eden od njih), `korak`, `avto` (avto večine krogov); po točkah (`s` metri od štarta): `n` krogov, `d` (odmik od sredine ceste, m, + desno), `d_sd`, `v` (m/s, avto večine krogov), `v_sd`, `vq` (delež tempa avtopilota, vsi krogi), `vq_sd`, `a` (pospešek, m/s²), `zav` (delež krogov, ki tu zavirajo), `rl` (idealna linija igre), `vref` (tempo avtopilota).
- `ovinki`: `s`, `ime` (ime ovinka iz proge), `krogov`, `zavira` (krogov z zaviranjem), `v_vrh`, `vq_vrh`, `zav_s` (kje začne zavirati), `zav_pred` (metrov pred vrhom), `v_zav` (hitrost ob začetku), `pojemek` (m/s²), `zav_pred_q` in `pojemek_q` (delež razdalje in pojemka avtopilota v istem avtu in vremenu, povprečje krogov), `ap_zav_pred`, `ap_v_zav`, `ap_pojemek`, `ap_v_vrh` (avtopilot v avtu večine krogov); `krogi.uporabljeni` (`datoteka`, `krog`, `cas`, `avto`, `delez`, `izpusceno_m`) in `krogi.izpusceni` (`razlog`, `s`, `t`); `avti` (časi krogov po avtih, `avtopilot`: njegov leteči krog v tem avtu, `cas_q`: mediana deleža njegovega časa); `natancnost` (`krogov`, `ocena`: premalo / najmanj / dobro / najbolje, `d_se`, `v_se`, `d_sd`, `v_sd`, `pokritost`); `opombe`.

## Odločitev: prenosljiva hitrost (4. 11. 2026)

- Hitrost je shranjena tudi kot **delež tempa avtopilota** (`vq`): tempo je profil hitrosti, ki ga dirka da temu avtu v tem vremenu (`Race._prof`: meja ovinkov na idealni liniji, zaviranje pred njimi; z istimi nadgradnjami, nastavitvijo, deli, gumami in zimo), krat dodatek nadgradenj kot v `aiDrive` (`(upgGrip (1 + aeroK v²))^¼`). Orodje ga zgradi z dirko v jedru z avtom iz posnetka. V koraku 2 tekmovalec vozi `vq` krat svoj tempo (svoj avto, svoje vreme), zato profil velja za vsak avto.
- Zaviranje kot delež **dejanskega zaviranja avtopilota** v istem avtu in vremenu (orodje ga odpelje samo, pravilo »Avtopilot za primerjavo«): `zav_pred_q` (kje pred vrhom začne) in `pojemek_q` (kako močno); poleg so `zav_pred` in `pojemek` v metrih in m/s². Pojemek iz profila hitrosti (`Race._prof`) ni primerjava, ker avtopilot ne zavira točno po njem (na Bathurstu 0,5–0,9 profila). V koraku 2 tekmovalec začne zavirati `zav_pred_q` krat tam, kjer bi sam, in zavira `pojemek_q` krat močneje. Čas kroga: `cas_q`.
- **Profil po razredu** (4. 11. 2026, po priporočilu koordinacije): tekmovalci vozijo avte iz polja igralčevega avta (`aiModel`, `pm.field`; formula in prototip vsak svoj razred; brez polja štirje cestni avti), zato je profil po progi, vremenu in razredu. V razredu so avti podobni in hitrost se prenese kot `vq`; avto, ki ni med svojimi tekmeci (tovornjak ali reli avto med cestnimi), ima v razredu svoj profil (`v_razredu: false`: njegova hitrost ne velja zanje).
- `a` in `zav` povesta, kje je uporabnik na polnem plinu: na ravninah `vq` ni omejitev (tam odloča motor), tekmovalec tam vozi s polnim plinom.
- Linija je odmik od sredine ceste (`d`); `rl` je zraven, da korak 2 lahko uporabi tudi odmik od idealne linije (`d − rl`).
- Ni zajeto: zmes in obraba gum (`aiDrive`: `c.wet / profW`), spretnost tekmecev (avtopilot igralca je nima).

## Korak 2: poskus na eni progi (4. 11. 2026)

- Uporabnik: »ali lahko danes sprobava samo na eni progi nastimat« (Tianmen, 5 posnetkov) in »v kategoriji lazje vozijo bolj podobno kot jaz v pocasnih voznjah in super teska tako kot jaz v hitrih voznjah. ampak se vedno pa nekje vsi vozijo po liniji mojega povprecja in bremzajo tudi tam kot jaz, prav tako kdaj zavijajo in kdaj dajo gas, tudi ai naj gre kdaj cez travo in to naj ge na tistih delih kjer sem sel jaz«.
- **Podatki**: `js/data/voznja.js` (`VOZNJA_PROFILI`; samo povprečja po točkah na 5 m od štarta: `dd`, `vq`, `pl`, `ql`, `qh`, `tr`, `dt`, ter `k0`, `ks`). Izvozi jih `node tools/voznja.mjs <posnetki> --js js/data/voznja.js [--k0 0.8–1.1] [--ks 0.5–3]` (`gameData`). Zdaj je v datoteki en profil: Tianmen, suho, avto Perun, 5 voženj.
- **Vklop**: `index.html?voznja=1` (ostane vklopljen v brskalniku, `rr_voznja`; `?voznja=0` ga izklopi). Velja samo v dirkah s tekmeci, ne v kronometru, pregonu in dvoboju. Brez vklopa in na progah brez profila je dirka kot doslej (`Race._voznja` ne naredi nič, zlate reference so enake).
- **Linija** (enaka za vse težavnosti): idealna linija in igralčev odmik od linije avtopilota v istem avtu (`dd`, `c.uRl`). Rezanje ovinkov z volanom je v obeh, zato ni šteto dvakrat. Prehitevanje in obramba ostaneta.
- **Hitrost** (`c.uT`) je igralčev delež tempa po tleh (`vq`) krat lastni profil tekmeca (njegov avto, vreme in zavore).
  - Orodje vzdolžno hitrost posnetka popravi z razmerjem `kg` (0,9–1,3): to je hitrost igralca po tleh proti hitrosti avtopilota po tleh. Popravek je potreben, ker avto, ki drsi, vzdolžno kaže manj.
  - Cilj je postavljen naprej po cesti za toliko, kolikor `aiDrive` bere naprej (`v·0,22 + 3 m`), zato ima tekmec hitrost tam, kjer jo je imel igralec.
  - Kjer je igralec na plinu (`pl`), je cilj `VZ_PL` (2,5 m/s) nad njegovo hitrostjo, ker tam odloča motor. Drugje je cilj `VZ_M` (0,5 m/s) nad njo, ker se `aiDrive` drži malo pod ciljem.
  - Zaviranje: prehod nazaj z najmočnejšim pojemkom profila avta. Tekmec zato zavira pred mestom, kjer je igralec upočasnil; `zav_pred_q` in `pojemek_q` niso potrebni.
  - Meja na liniji je `VZ_CAP` (1,5 profila), ker igralec ovinek zna peljati hitreje od profila. Zunaj linije (pri prehitevanju) velja meja njegove spretnosti.
- **Težavnost** se določi po spretnosti avta (`lamOf`):
  - lahka vozi kot igralčevi počasnejši krogi (`ql`);
  - srednja vozi med njimi in povprečjem;
  - težka in super težka (ta se dirka kot težka) vozita od povprečja proti hitrejšim krogom (`qh`).
  - `ql` in `qh` sta tempo počasnejše in hitrejše polovice krogov proti povprečju, glajen na ±5 m. Pri ±50 m je težkim tekmecem zanašalo zadek.
  - Napaka počasnejšega kroga vzame največ četrtino tempa. Nad povprečjem gre tekmec samo do meje svojega avta (`aiSkCap`).
- **Umeritev**: `k0` je tempo pri srednji vrednosti (lam 0), `ks` raztros proti počasnejšim krogom. Umerjeno s tekmecem samim na progi, brez gumijaste vrvi (`DIFF`): lam −1 vozi kot igralčevi počasnejši krogi, lam 0 kot njihovo povprečje. Za Tianmen `k0` 0,95 in `ks` 1,4.
- **Čez rob** (`tr`, `dt`): samo tam, kjer je čez rob šlo vsaj 40 % krogov (`trMin`; na Tianmnu 2 od 5), in tam toliko kot igralec.
- **Odprta cesta**: štart z mesta do prvega ovinka orodje izpusti, kot pri prvem krogu krožne proge. Igralčevo počasno speljevanje bi sicer tekmece ustavilo na štartni črti; tam vozijo svoj tempo.
- **Rezultat na Tianmnu** (igralec povprečno 3:15,7; počasnejše vožnje okoli 3:21,6, hitrejše okoli 3:10,5):
  - Tekmec sam na progi: lahka ≈ 3:20–3:22, srednja ≈ 3:17–3:20, težka 3:13–3:16.
  - Polje 6 tekmecev z avtopilotom igralca zadaj: vsi so prišli do cilja, nobenega ni bilo treba vrniti na cesto.
  - Povprečja v polju: lahka 3:31,7 (brez profila 3:52,9), srednja 3:26,2 (3:38,5), težka 3:20,4 (3:26,2). Polje je počasnejše od tekmeca samega, ker ga gumijasta vrv drži ob počasnem avtopilotu (3:24,6) in ker je na cesti promet.
- **Omejitev**: težka ne doseže igralčevih najhitrejših voženj. Igralec skozi ovinke drsi hitreje, kot jih AI zna peljati po povprečni liniji.
- **Proge brez uporabnikovih posnetkov**: vprašanje `ai-linija-brez-posnetkov` na strani Odločitve. Možnosti: 1. kot zdaj; 2. po splošnem pravilu iz uporabnikove vožnje (kako zgodaj zavira, koliko reže ovinke). Odgovor zapiši sem.
- **Naprej**: po odzivu uporabnika na poskus pridejo nove proge s posnetki in test proti igralčevemu času (korak 3).

## Stanje

- 4. 11. 2026: korak 1 narejen (orodje z avtopilotom za primerjavo, test `tests/voznja.test.js`, glava posnetka v `js/game.js`, preverjanje v `tests/browser/napake-posnetek.test.mjs`); čaka posnetke uporabnika.
- 4. 11. 2026: korak 2 kot poskus na Tianmnu (5 posnetkov; veja `ai-linija/korak-2`, osnutek pull requesta z oznako »predogled«); čaka odziv uporabnika.
