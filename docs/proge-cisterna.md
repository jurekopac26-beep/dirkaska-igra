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

Odseki so iz OpenStreetMap (ceste, smer vožnje od začetka do konca), višine iz Copernicus DEM GLO-30. Številke so iz igre: **klanec** iz višin štarta in cilja, **°/km** in serpentine kot v `docs/proge-pregled.md`, **polmer** najmanjši polmer osi ceste v igri; **prepad** je padec terena 30 m (v oklepaju 50 m) od osi na strani prepada (višinski model), **ob % dirke** delež dirke s prepadom brez ograje (`drops`).

| # | `id` | Ime | Angleško | Celina | Cesta OSM (podlaga) | Začetek → konec (lat, lon) | Klanec | Ovinki | Prepad |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `svalvogar` | Svalvogar, Islandija | Svalvogar, Iceland | Evropa | Svalvogavegur, `ref` 622 (makadam) | 65.91761, −23.76976 → 65.91995, −23.77853 | ravno, 36 → 32 m | 463 °/km, polmer 38 m | proti morju desno, 18 m (31 m); ob 61 % dirke |
| 2 | `fairymeadows` | Fairy Meadows, Pakistan | Fairy Meadows, Pakistan | Azija | jeep cesta do Fairy Meadows (makadam) | 35.47063, 74.59132 → 35.46929, 74.59089 | vzpon +5 % (1837 → 1861 m) | 3 serpentine, polmer 12 m, 1525 °/km | 20 m (33 m); ob 63 % dirke |
| 3 | `manchewe` | Manchewe, Malavi | Manchewe, Malawi | Afrika | Golodi Road (zemlja) | −10.59617, 34.14158 → −10.59551, 34.14150 | spust −9 % (1011 → 967 m) | 2 serpentini, polmer 12 m, 824 °/km | 22 m (37 m); ob 96 % dirke |
| 4 | `yungas` | Yungas, Bolivija | Yungas, Bolivia | Južna Amerika | Camino Nor Yungas, en pas (utrjen makadam) | −16.28433, −67.79921 → −16.28109, −67.79720 | spust −7,5 % (2557 → 2521 m) | polmer 18 m, 980 °/km | levo, 43 m (67 m); ob 90 % dirke |
| 5 | `tapini` | Tapini, Papua Nova Gvineja | Tapini, Papua New Guinea | Oceanija | Tapini Highway (zemlja) | −8.42476, 146.95757 → −8.42250, 146.95929 | spust −9,5 % (636 → 590 m) | polmer 28 m, 618 °/km | desno, 47 m (69 m); ob 88 % dirke |

Fairy Meadows: prvi izbrani odsek (35.45187, 74.60018 → 35.44976, 74.60066, +13 %, 2 serpentini) je zamenjal odsek 3,6 km niže: v igri je cesta s strmino do 12 % ležala 20–30 m pod višinskim modelom, zato je bil prepad ob samo 13 % dirke; na novem odseku je +8 % po modelu, 3 serpentine in prepad ob 63 % dirke. Rezervni odsek Tapini na začetku ceste (+8 %, ena serpentina). Imena: brez imen oseb (npr. kraj Livingstonia ob Manchewe je po osebi, zato ga ni v igri), brez imen prireditev in podjetij.

## Skupni gradniki

- **Vozilo proge** `def.vehicle: 'cisterna'` (datoteka proge): igra na progi vedno da to vozilo, ne glede na izbiro in lastništvo v karieri (`js/game.js`: `vehOf`, `myM`: start dirke, ponovni start, duh, rekordi, izid, meni `G.car`/`G.carHere`); kariera izplača brez faktorja vozila, ker vozilo ni igralčevo.
- **Samo vožnja na čas:** `timeTrial: true` brez `modes`; brez tekmecev in prometa; medalje iz časa avtopilota s cisterno (`tools/nova-proga.mjs <id> --medalje`: × 1,02, 1,15, 1,40; reševanje šele po 8 s mirovanja, naložen tovornjak počasi spelje). Reševanje (gumb ali po padcu v prepad) postavi cisterno na cesto stoječo, ne z zagonom 8 m/s kot na drugih progah (`rescue` v `js/core.js`, `def.vehicle`), da ni bližnjica mimo plazenja; testa `golden` in `races` vozita na teh progah cisterno, postavitve z drugimi avti odpadejo.
- **Previden avtopilot** (`js/core.js`, samo na progah, ki to zahtevajo): `aiVmax` (največja hitrost, 11 m/s), `dropCare` (nad prepadom pol bočnega oprijema v ovinku), `wideLine` (idealna črta skozi ovinke s polmerom pod ~40 m po zunanji strani, da prikolica ne reže preveč).
- **Uvoznik** (`tools/proga-uvoz.mjs`, nastavitve v `tools/predogled/proge.json`, `uvoz`): `prepad` (prepad, kjer je teren 30 m od osi vsaj toliko metrov niže in 15 m od osi vsaj pol toliko: `drops`, brez ograje), `grbine` (grbine in jame na 4–9 m, vsakič enake: `bumps`), `siri` (serpentine s polmerom pod 30 m razširjene do +0,9 m pol širine: `widths`); pot iz več delov z istim imenom vzame del najbliže odseku.
- **Ozka cesta:** pol širine 2 m (cisterna je široka 2,5 m), v serpentinah do 2,9 m; skala na strani stene 1–2 m od roba (`runoff: 0.06, inner: 1, side: 1`), rob prepada 1,2 m od roba (`dropEdge`).
- **Svet** (`js/world-gore.js`, slog `ledge`, `sea`): pod robom prepada teren pade pod ~70° do višinskega modela; na drugi strani lomljena skalna stopnica (0,5–1,9 m, z vrzelmi, nizka pri portalih) kot del pasu ob cesti; brez ograj, kolov, stebričkov in tabel; morje na svoji višini (Svalvogar); ptice z belo barvo primerkov (r128 ima en program na material).
- **Test** `tests/lib/cisterna-proge.js` (vsaka proga `tests/<id>.test.js`): ime kot v tabeli, samo kronometer s cisterno, 400–505 m, podatki uvoza, prepadi ob vsaj pol dirke, grbine, ozka cesta (širša samo v ostrih ovinkih), rob prepada in skala blizu, cisterna na avtopilotu do cilja brez padca in reševanja, prikolica nikoli na naslonu (pod 80°), medalje.

Posnetka ovinka za meni (`tools/menu-corner.mjs`) te proge nimajo: posnetek kaže dirko navadnih avtov, na teh progah pa vozi samo cisterna (meni pokaže maketo; `tests/menu-corner.test.js` jih izpusti, `def.vehicle`). Posnetek s cisterno je mogoč pozneje. Zastave petih držav za meni (`assets/flags/`, `FLAG_FILES` v `js/menu.js`): `docs/meni-izbira-proge.md`.

## Razgibana cesta (odločitve uporabnika 9. 11. 2026)

- **Prošnje:** »Proge po slikah izgledajo, da imajo ravno cesto. Spremeni, da cesta ni povsem vodoravna, ampak je 3D, ima globino in višino, tako da je pomembno, kakšne amortizerje ima vozilo, in se težje vozi.« Nato: »Cesta naj bo čim bolj razgibana.« in »Za vsako progo naj bo drugačen graditelj, vsaka država ima svoj način gradnje.«
- **Površje ceste** (`relief` v datoteki proge, `buildRelief` v `js/core.js`): višinska mreža v okviru ceste (0,25 m vzdolž × 0,2 m počez) iz plasti: kolesnice, jame (del z vodo), kamni, skalne plošče, jarki, prehodi potokov, blato, hlodi, nasipi in kamni graditeljev (spodaj), dolgi valovi, »rebra« (washboard), izbočenost (crown) in nagib proti prepadu. Vse ugasne v zadnjih 0,3 m do roba in 2–6 m od črt (štart, cilj, vmesni časi). Plasti in mreža so vsakič enake (`seed`).
- **Vožnja:** vsako kolo stoji na svoji točki površja (najvišja točka pod krogom gume), vzmeti in blažilniki po vozilu (`model.susp`, sicer tovornjak ali avto; blažilnik z mehčanjem pri hitrih udarcih), obremenitev vsakega kolesa določa njegov oprijem, nagib površja vleče vozilo, grbine zavirajo; prikolica se nagiba in drsi po njem. Avtopilot zmanjša hitrost po hrapavosti (`ai { v, k, min }`, v dežju × √oprijema). Velja samo na progah z `relief` (stanje v predmetih `c.rs`, `T.rs`: reference drugih prog ostanejo enake).
- **Izris** (`js/world-gore.js`): cesta kot mreža z reliefom v kosih po 32 m, tri stopnje podrobnosti (0,25 m do 40 m od kamere, 0,5 m do 90 m, 1 m dlje); barva po tem, kaj je kje (`relief:` v `js/world-<id>.js`), temnejše jame in svetlejši vrhovi; luže z gladino (obala sledi cesti); kolesa, sledi koles in posnetek dirke (`relPose`) sledijo površju. Obremenitev telefona: do 102 klica risanja in 352 tisoč oglišč (Manchewe), meja je 300 in 900 tisoč.
- **Graditelji po državah** (znak države v plasti `relief`, preverja ga test):

| Proga | Način gradnje | Znak države | Kaj pomeni pri vožnji |
|---|---|---|---|
| Svalvogar | islandska makadamska cesta iz bazaltnega drobirja, enkrat na leto zgrajena z grederjem: visoka izbočenost, rebra, luže, kamni, plitve kolesnice | nasipi rahlega proda ob obeh robovih (`windrows`) | kolo, ki zapelje na rob, zanese (manj oprijema) |
| Fairy Meadows | džipovska cesta, izklesana v skalo soteske: skalne plošče z ostrimi robovi, kamenje s pobočja, jarek ob steni, nagib proti prepadu | vrsta kamnov, ki so jih vaščani postavili ob rob prepada (`edge`) | udarci ob robu prepada, kamni potiskajo kolesa |
| Manchewe | rdeča lateritna cesta na strmini, narejena ročno in po dežju: poševni jarki, suhe kolesnice, rebra, jame | poševne grbine iz nabite zemlje, ki odvajajo vodo (`bars`) | čeznje gre najprej eno kolo, nato drugo: vozilo se zvija |
| Yungas | stara enopasovna cesta v pobočju oblačnega gozda: globoke mokre kolesnice, blato, luže, prehodi potokov | nanosi plazov s stene, odriniti le do polovice (`slides`) | cesta se zoži, mehka zemlja in kamni na notranji strani |
| Tapini | glinasta cesta, ki jo je zgradil buldožer: zelo globoke kolesnice, blatne jame, dolgi valovi | hlodi, položeni počez čez najhujše blato (`logs`) | tresenje po hlodih, moker les drsi |

- **Medalje** po razgibani cesti (avtopilot s cisterno × 1,02, 1,15, 1,40; suho / dež): Svalvogar 57/64/78 in 71/80/98 s, Fairy Meadows 67/76/92 in 78/88/107 s, Manchewe 61/69/84 in 67/76/92 s, Yungas 67/75/91 in 74/83/101 s, Tapini 72/82/99 in 80/90/110 s.
- **Test** (`tests/lib/cisterna-proge.js`, točka 7): površje vsaj 5 cm gor in dol, vsaj tri vrste površja, znak države, recept, ki ga nima nobena druga proga za cisterno; vzmeti delajo (obremenitev koles pod 0,6 in nad 1,4 svojega deleža, teren nagne vozilo vsaj za 2°); tudi v dežju do cilja brez padca in reševanja. Preizkus trka v `golden` za cisterno zahteva vsaj 3 % škode (na razgibani cesti vozi 6–10 m/s), čas trka po progah v `tests/lib/sim.js` (`CRASH_AT`).

## Postopek in stanje

1. Načrt, osnutek pull requesta, skupni gradniki. **Narejeno** (8. 11. 2026).
2. Vseh pet prog z datotekami proge, sveta, opisom, testom in medaljami; testi `tests/<id>.test.js` zeleni. **Narejeno** (9. 11. 2026).
3. Slike za meni (`assets/tracks/<id>.webp`, `-rain.webp`), `docs/proge-pregled.md`, zasluge v `README.md`, reference testov (`npm run golden:update`), povezani testi, vpis v vrsto za `main` (proge zadnje). **V delu** (9. 11. 2026).
4. Razgibana cesta in graditelji po državah (razdelek zgoraj): površje, vzmetenje, izris, medalje, test, reference. **Narejeno** (9. 11. 2026).

Vsak korak, ki ga ta seja ne konča, nadaljuje nova seja po tem načrtu (»Nadaljuj korak N po docs/proge-cisterna.md«).
