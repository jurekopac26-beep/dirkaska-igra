# Grafika ljudi ob progi

Tema računa partyslo (uporabnik 6. 11. 2026: »Izboljšaj grafiko ljudi«), veja `ljudje/grafika`. Cilj: lepši ljudje s kamere za avtom na vseh pravih progah (prizori `World.peopleKit`, tribune, redarji, snemalci, mehaniki, redki gledalci), brez večje obremenitve telefona.

## Stanje

- 6. 11.: štiri različice v slikah, vprašanje `ljudje-grafika-1` na strani Odločitve računa partyslo (izbira ene ali več, priporočeno 5 = vse štiri skupaj). Po odgovoru: koda izbranih različic v `js/world-ljudje.js` in `js/world.js`, osnutek PR, vnos v `docs/vrsta.md`.
- Na to kodo čakajo novi prizori (psi v jezeru, oranje z galebi, delavci na vrveh, rolkarji) in popravki predlogov 2, 8, 9, 10 iz `docs/ljudje-predlogi.md`; model iz igre mora ujemati tudi `tools/ljudje/ljudje3d.js`.

## Orodje za slike prej/potem (`tools/ljudje/videz/`)

- Različica je datoteka `tools/ljudje/videz/<ime>.js`, ki nastavi `window.LJV = { people(K), crowd(K) }`; orodje jo vstavi v stran pred gradnjo sveta. Kljuke so v igri neaktivne: `person`, `rig` (`shade`), `poseJ`, `setJ` in `alive` (v `poseOne`) v `js/world-ljudje.js`, `crowdGeo` in `crowdMat` (`geo`, `shader`) v `js/world.js`.
- `node tools/ljudje/videz/slike.mjs <proga> <prej|ime> --prizori zar,marsali,boksi --pri 40,18 --gneca 950:1 [--film 0.25]`: sličica s kamere za avtom, lupa, klici risanja in oglišča (vse podaje) v `test-results/ljudje/videz/<ime>/`. Za primerjavo isti ukaz (isti vrstni red posnetkov) za `prej` in različico: pot avta pred posnetkom gneče spremeni klice risanja za 1–3.
- `node tools/ljudje/videz/meri.mjs <proga> [--videz ime]`: oglišča na osebo, instancirani gledalci, napake strani.
- `python3 tools/ljudje/videz/sestavi.py <ime> <proga> "<naslov>" "<podnaslov>" bathurst-zar-40@1.25 bathurst-marsali-18 bathurst-gneca950D-18 --izrez 1.5` (Medvode: `medvode-kolesarji-18@1.15 medvode-piknik-18 medvode-gneca250D-18@1.3`): slika za stran Odločitve, do 300 KB.

## Različice (izmerjeno v igri, prej → potem)

| Različica | Datoteka | Oglišča na osebo: cela / otrok / tribuna (Bathurst) | Instanciran | Klici risanja |
|---|---|---|---|---|
| 1 Postava in razmerja | `silhueta.js` | 689 → 676 / 600 → 564 / 362 → 352 | 168 → 165 | enako |
| 2 Mehke oblike in svetloba | `mehko.js` | enako | 168 | enako |
| 3 Oblačila, lasje in pokrivala | `obleke.js` | 689 → 622 / 600 → 498 / 362 → 325 | 168 | enako |
| 4 Živahna drža in gibanje | `gibanje.js` | enako (malo več računanja na postavljeno osebo) | 168 | enako |

## Opombe za kodo

- **1:** novo telo namesto `person0` (sklepi, dolžine udov in roke za predmete ostanejo); da glava ne gleda skozi kapo, sta v datoteki tabeli `COVER` in `HATY` (nova kapa potrebuje svojo vrstico). Z različico 3 en sam graditelj.
- **2:** senčenje po peki (upognjene normale, svetloba in senca v barvah oglišč); ton oblačil sejan iz semena prizora in indeksa osebe (kot dežniki, `hash32`), sicer se prstni odtisi sveta v testih spremenijo; gradnja ~0,17 s na Bathurstu (če je na telefonu počasno: predloga na vrsto osebe). Gneča: upognjene normale v `crowdGeo`, rob v `CR_VS_POS`. Reference: `npm run golden:update`.
- **3:** `person(o)` ne pozna prizora, vloge ne letnega časa: igra naj doda `o.scene`, `o.staff`, `o.season`; gneča potrebuje bit za osebje v podatkih primerka (zdaj po barvi majice); krila z dodatnim sklepom bokov (`P.xJ`); senčilnik gneče loči dve barvi v eni skupini.
- **4:** tribuna, sprehajalci in snemalci ne gredo skozi `alive` (zdaj samo stalna raznolikost drže); ob ograji igra po `setJ` sama obrne trup in glavo proti avtu (zastavica, da to prevzame `alive`); `ctx` naj dobi trenutni položaj osebe; gibanje gneče samo na pravih progah (`CR_CALM`), brez skakanja in dvigovanja zastav; zrcaljenje zastav (`crMir`) z obrnjeno smerjo.
