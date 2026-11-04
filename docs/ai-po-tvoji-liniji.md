# AI po tvoji liniji

Želja uporabnika (4. 11. 2026): »ali lahko posnames mojo voznjo in izmeris moje povprecne linije ter hitrost in naredis da ai etkmovalci vozijo v povprecju tudi tako«. Nato: »začni z orodjem, posnetke pošljem pozneje«.

## Koraki

1. **Orodje** `tools/voznja.mjs` (narejeno, pull request #300): iz uporabnikovih posnetkov dirk (`.rrp`) za vsako progo in vreme izmeri povprečno linijo, hitrost in zaviranje. Test `tests/voznja.test.js`.
2. **AI v `js/core.js`** vozi po profilu; vsak tekmovalec z malo razlike glede na težavnost. Nova seja z Opusom, ko pridejo posnetki in je profil izmerjen (načrt spodaj).
3. **Test**: AI vozi blizu uporabnikove linije in njegovega časa kroga.

## Posnetki in zasebnost

- Uporabnik po dirki shrani posnetek (»Shrani posnetek (.rrp)« pri zadnjih posnetkih ali Nastavitve orodja → Posnetek dirke → Shrani) in datoteke pošlje v sejo. Odpre jih `node tools/voznja.mjs <posnetek.rrp> … [--out <profil.json>|<mapa>] [--korak <m>]`; izhod privzeto v `test-results/voznja/` (`profil.json`, `povzetek.txt`).
- **Posnetkov in profilov ne shranjuj v repozitorij** (repozitorij je javen; `CLAUDE.md`, Orodje za napake). V repozitorij gresta samo orodje in test; v koraku 2 pridejo v kodo samo izmerjene povprečne vrednosti po progah.
- Koliko posnetkov: krožne proge najmanj 3 čisti krogi, dobro 5, najbolje 8–10, več kot 10 skoraj nič ne izboljša; odprte ceste: vsaka vožnja je en krog, 3–5 voženj. Suho in mokro posebej (zima posebej), vsako svoj profil. Najbolj čisti so krogi brez tekmecev ob avtu (kronometer, kvalifikacije, dirka z malo tekmeci); deli ob drugih avtih se izpustijo.
- Posnetki od te različice igre naprej imajo v glavi tudi avto igralca (`pf`: nadgradnje, nastavitev, deli garaže, avto prvenstva), gume (`ty`) in spremembo vremena (`wxs`; `js/game.js` `rrpOf`). Starejši posnetki: tempo za serijski avto (opomba v povzetku), vreme kot ob koncu dirke.

## Pravila meritve (`RULES` v orodju)

- **Čist krog**: brez vrtenja (nos več kot 75° od smeri ceste pri več kot 5 m/s, 0,15 s), vožnje nazaj (več kot 1 m/s, 0,3 s), zleta s ceste (sredina avta 1 m čez rob asfalta in robnika, 0,25 s), trka (več kot 50 m/s² izgube hitrosti hkrati po tleh in avtove; v steno 100–150, zavore do ~16, avto, ki drsi postrani, ~30), vrnitve na cesto in boksov. Krog s katerim koli od teh je izpuščen; povzetek pove razlog in kje (metri od štarta).
- **Izpuščeni deli kroga**: ob drugem avtu (7 m vzdolž, 5 m počez) ali tik za njim (0–22 m spredaj, 3 m počez) in 1 s prej in pozneje (prehitevanje, obramba, zavetrje); varnostni avto na progi; štart prvega kroga dirke do prvega ovinka (krožne proge, ne kvalifikacije).
- **Vreme**: krog med spremembo vremena je izpuščen (voda na cesti sledi dežju v 40 s, suha je 240 s na enoto dežja manj; `Race._weather`). Šola vožnje, policijski pregon in vožnja s prometom niso meritve.
- **Povprečje** po točkah na vsakih 5 m od štartne črte; vrednosti, ki so od mediane več kot 3,5 raztrosa (MAD, najmanj 0,3 m linije, 1 m/s hitrosti), izpadejo (napaka na enem mestu enega kroga ne vleče povprečja).
- **Ovinek**: najmanjša povprečna hitrost v ±60 m, vsaj 3 m/s pod najvišjo v 500 m pred njim; zaviranje vsakega kroga v ovinek: zadnje zaviranje pred vrhom, nazaj do začetka (premor do 0,4 s je isto zaviranje).

## Profil (`profil.json`)

- Glava: `orodje`, `verzija`, `narejeno`, `pravila`, `datoteke`; `proge`: en profil za vsako progo in vreme (`suho`, `mokro`, `·zima`).
- Profil: `proga`, `ime`, `odprta`, `dolzina`, `vreme`, `korak`, `avto` (avto večine krogov); po točkah (`s` metri od štarta): `n` krogov, `d` (odmik od sredine ceste, m, + desno), `d_sd`, `v` (m/s, avto večine krogov), `v_sd`, `vq` (delež tempa avtopilota, vsi krogi), `vq_sd`, `a` (pospešek, m/s²), `zav` (delež krogov, ki tu zavirajo), `rl` (idealna linija igre), `vref` (tempo avtopilota).
- `ovinki`: `s`, `ime` (ime ovinka iz proge), `krogov`, `zavira` (krogov z zaviranjem), `v_vrh`, `vq_vrh`, `zav_s` (kje začne zavirati), `zav_pred` (metrov pred vrhom), `v_zav` (hitrost ob začetku), `pojemek` (m/s²), `pojemek_q` (delež pojemka avtopilota tam); `krogi.uporabljeni` (`datoteka`, `krog`, `cas`, `avto`, `delez`, `izpusceno_m`) in `krogi.izpusceni` (`razlog`, `s`, `t`); `avti` (časi krogov po avtih); `natancnost` (`krogov`, `ocena`: premalo / najmanj / dobro / najbolje, `d_se`, `v_se`, `d_sd`, `v_sd`, `pokritost`); `opombe`.

## Odločitev: prenosljiva hitrost (4. 11. 2026)

- Hitrost je shranjena tudi kot **delež tempa avtopilota** (`vq`): tempo je profil hitrosti, ki ga dirka da temu avtu v tem vremenu (`Race._prof`: meja ovinkov na idealni liniji, zaviranje pred njimi; z istimi nadgradnjami, nastavitvijo, deli, gumami in zimo), krat dodatek nadgradenj kot v `aiDrive` (`(upgGrip (1 + aeroK v²))^¼`). Orodje ga zgradi z dirko v jedru z avtom iz posnetka. V koraku 2 tekmovalec vozi `vq` krat svoj tempo (svoj avto, svoje vreme), zato profil velja za vsak avto.
- Zaviranje tudi kot delež: `pojemek_q` (pojemek proti pojemku avtopilota tam) in `zav_pred` (kje pred vrhom).
- `a` in `zav` povesta, kje je uporabnik na polnem plinu: na ravninah `vq` ni omejitev (tam odloča motor), tekmovalec tam vozi s polnim plinom.
- Linija je odmik od sredine ceste (`d`); `rl` je zraven, da korak 2 lahko uporabi tudi odmik od idealne linije (`d − rl`).
- Ni zajeto: zmes in obraba gum (`aiDrive`: `c.wet / profW`), spretnost tekmecev (avtopilot igralca je nima).

## Korak 2 (načrt za novo sejo)

- Profil po progah in vremenu kot podatki v kodi (samo povprečja, brez posnetkov), npr. `js/data/voznja-<id>.js` ali v datoteki proge.
- V `aiDrive`: ciljna linija iz `d` (namesto `rl + aiOff`, prehitevanje in obramba ostaneta), ciljna hitrost `vq × vprof` (na polnem plinu brez omejitve), zaviranje po `zav_pred` in `pojemek_q`; vsak tekmovalec z malo razlike glede na težavnost (npr. `vq` in odmik linije po spretnosti in raztrosu `vq_sd`, `d_sd`).
- Proge brez uporabnikovih posnetkov: vprašanje `ai-linija-brez-posnetkov` na strani Odločitve (možnosti: 1. kot zdaj; 2. po splošnem pravilu iz uporabnikove vožnje: kako zgodaj zavira, koliko reže ovinke). Odgovor zapiši sem.
- Test (korak 3): dirka s profilom, AI vozi blizu uporabnikove linije (odmik) in njegovega časa kroga; zlate reference znova z `npm run golden:update`.

## Stanje

- 4. 11. 2026: korak 1 narejen (orodje, test `tests/voznja.test.js`, glava posnetka v `js/game.js`, preverjanje v `tests/browser/napake-posnetek.test.mjs`); čaka posnetke uporabnika.
