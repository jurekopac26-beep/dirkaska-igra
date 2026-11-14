# Realizem, paket G · Rastje in teren (~16 sej, na `main` za S)

Del `docs/realizem.md` (razdeljen po paketih 11. 11. 2026, ukrep 5 »Manj sklopov«, `docs/varcevanje.md`). Odločitve uporabnika, proge, postopek, pravna ocena, čas in vrsta so v `docs/realizem.md`.

- **Kaj se spremeni:**
  - Gozd, grmovje in golo skalovje so v pasu ob cesti v enakem deležu kot v resnici (WorldCover).
  - Trava je brez pasov košnje, razen kjer jih ima resnična proga.
  - Ob asfaltu je ozek pas zemlje in gramoza.
  - Barve tal so iz Sentinel-2, svetloba in ton po državi.
  - Kjer višinski model zgladi pečine (Chapman's Peak, Tianmen), je teren po meri.
  - Oblika dreves (»mehke krogle«) ostane.
- **Koraki:**
  - G0: WorldCover in Sentinel-2, kompleti rastja po podnebju, svetloba po državah.
  - G1–G4: skupine 1–4.
- **Telefon:**
  - Barve in svetloba stanejo 0 klicev.
  - Gozd do ceste je glavno tveganje za oglišča. Do 60 m so podrobna drevesa, za tem ploskve krošenj.
- **Seje:** ~8–9 za orodje in komplete, ~0,5 na progo.
- **Datoteke:**
  - `tools/proga-podatki.py` (WorldCover, Sentinel-2);
  - `js/world.js` (rastje po razredih, pas zemlje, zima na severu);
  - `js/render.js` (svetloba in ton po državi);
  - podatki v `js/tracks/<id>.js`.
- **Tveganje:**
  - oglišča gozda do ceste;
  - barve in svetloba ne smejo spremeniti drugih prog (slike `gfx`).

## G0 · sestavni deli (narejeno 14. 11. 2026, na veji)

Veja `realizem/g0-rastje-teren`, jure.kopac26 (odločitev uporabnika 12. 11. 2026 ob ~19.30 prek Mateja, tabla #382, komentar 6830929804; prej partyslo od ~17. 11.). G0 na progah ne dela; prehod na proge pride po G0, skupaj s S.

Kosi, vsak v svojem commitu:
1. **Orodje** (`tools/proga-podatki.py`): deleži razredov WorldCover v pasu do 60 m ob cesti (po odsekih, levo in desno) in barve tal iz letnega mozaika Sentinel-2. **Narejeno 12. 11. 2026** (spodaj »Kos 1«).
2. **Kompleti rastja po podnebju**: nova datoteka `js/world-rastje.js`; v `js/world.js` samo kratki priklopi, da so spori z E (#657, `js/world-cesta.js`) in S0 (#668) majhni.
3. **Svetloba in ton po državah** (`js/render.js`, kratek priklop; tabela v `js/world-rastje.js`).
4. **Mehak prehod med travo ob cesti in pobočjem** (odločitev uporabnika 12. 11. 2026 ob ~14.25 prek Mateja): samo prave proge, zamrznjene ostanejo do pike enake.

Pred `main`: 2–3 možnosti s slikami naenkrat in slike zdaj in potem (Spa, Belgija) na strani Odločitve. **Narejeno** (spodaj »Odločitev: moč 35 %«).

### Kos 1: orodje (narejeno)

- Korak `cover` (`python3 -I tools/proga-podatki.py tools/<id>/config.json RAW cover`) prebere že narejeni `tools/<id>/<id>.json` ter mu doda ključ `cover` in mrežo `col.png`. Drugi ključi ostanejo do znaka enaki, OSM se ne prenaša znova. Korak `data` naredi isto sam.
- `cover`: pas 8–60 m od sredinske črte na mreži 5 m, odseki po ~50 m, levo in desno. Na odsek: `share` (deleži razredov WorldCover v %), `open` (barva odprtih tal: razredi 20, 30, 40, 60, 90, 100) in `canopy` (barva krošenj, razred 10). Za vso progo: `classes`, `names`, `share`, `colour`. Barve so od 15 m naprej (bližji piksel 10 m vsebuje asfalt); `''` pomeni premalo celic, takrat velja barva razreda za vso progo. Opis je v `about.cover` izhoda.
- `col.png`: barve tal na mreži `lc.png` (10 m, RGB; ~5 KB na km proge pri pasu 150 m).
- Barve so `255 × odbojnost^(1/2,2)`, brez ojačanja in brez normalizacije po progi, da so proge med seboj primerljive. Resnične barve tal so temne (Spa: mediana okoli (59, 64, 54); Livorno: drevesa `3a4236`, trava `545548`). Ton (ojačanje, nasičenost) zato nastavi igra v kosu 3; od tod pridejo možnosti za uporabnika.
- Vir: letni mozaik Sentinel-2 projekta ESA WorldCover 2021 (CC BY 4.0), `esa-worldcover-s2.s3.eu-central-1.amazonaws.com/rgbnir/2021/N50/ESA_WorldCover_10m_2021_v200_N50E005_S2RGBNIR.tif`: ploščice 1 × 1° po jugozahodnem vogalu, pasovi 1–4 = rdeča, zelena, modra, bližnja infrardeča, odbojnost × 10000, 0 = ni podatka. Navedba vira je v `about.sources` izhoda; v `README.md`, »Zasluge« gre s prvo progo, ki dobi podatke iz njega. EOX »S2 cloudless« ni primeren (CC BY-NC-SA). Iskalniki STAC so iz okolja blokirani, vedra S3 delujejo.
- Preverjeno na kopiji podatkov Livorna zunaj repozitorija (podatkov prog G0 ne spreminja): drevesa 55 %, pozidano 27 %, trava 10 %, voda 3 % (morje na levi strani); barve se ujemajo z razredi `lc.png` (voda modra, pozidano rdečkasto sivo); ostali ključi nespremenjeni. Branje čez mejo dveh ploščic preverjeno (45° S). Korak `data` s priklopom še ni tekel v celoti (prvič bo pri naslednji novi progi).

### Kosi 2–4: v igri (13. 11. 2026)

- **`js/world-rastje.js`** (`World.rastje`): velja samo za prave proge (`prava`: brez `test` in `pending`, ne Suzuka, Irohazaka, Medvode) **z meritvami** v `MERITVE` (`aktivna`). Meritve imata Spa (predogled v G0) in Rio do Rastro (G2, spodaj); ostale proge so do številke enake, dokler ne dobijo meritev v G1–G4. Nobenega klica risanja ali oglišča več: barve gredo na barvo materiala (en množilnik) ali, na gorski cesti, v barve oglišč, svetloba na številke teme, prehod na barve, ki jih rob trave že ima.
- **Kos 2, kompleti in barve**: `PODNEBJA` (Köppen–Geiger) našteje vrste dreves podnebja kot oblike, ki jih graditelji že rišejo (»mehke krogle« ostanejo); deleži in barve pridejo iz meritev. `MERITVE.spa`: pas 8–60 m, drevesa 33,7 % (`393e34`), trava 9,3 % (`4c5143`), pozidano 57,0 % (`5d5951`: izletne cone in boksi); okvir proge lat 50,44406, lon 5,965126 (gozd iz `def.lc` poravnan na drevesa WorldCover, korelacija 0,69, ker OSM iz okolja ni dosegljiv). `barve()` izmeri, kakšno barvo igra zdaj riše (drevesa: barve oglišč vrst × barve primerkov; trava: barva tal na odprtem v pasu 8–60 m × povprečje slike trave) in materialu tal (`gMat`) in dreves (`tMat`) da odtenek meritve, svetlost ostane (`mnozilnik`; izmerjene barve so od zgoraj, skozi zrak, s sencami, zato svetlost ni prava za oko ob cesti). Moč `MOC` (0 nič, 1 ves odtenek) je uporabnikova izbira: 0,35 (spodaj »Odločitev: moč 35 %«).
- **Kos 3, svetloba**: `look(t, def)` v `applyTheme` (`js/render.js`, `lookDef` iz gradnje sveta): poletno opoldansko sonce na širini proge (90° − |lat| + 23,44°), zračna masa 1/sin višine in Rayleighova optična globina (0,052 / 0,098 / 0,236) premakneta barvo in moč sonca proti soncu v zenitu. Spa: višina 63°, sonce za ~1 % šibkejše in za ~2 % manj modro; nebo in ton proge ostaneta.
- **Kos 4, prehod**: `prehod(c, g, u)` v robu trave ob ograji Spa (`js/world-spa.js`): pasovi košnje preidejo v barvo pobočja čez širino roba (malo ob cesti, vse na koncu), namesto ostrega roba na zadnjih dveh točkah.

### G2 · Rio do Rastro, Brazilija (13. 11. 2026)

Prva proga prehoda (v tabeli prog v `docs/realizem.md` ima samo paket G; E pride s svojim sklopom, #657).

- **Meritev** (pas 8–60 m ob dirkalnem delu, 4989 m, 14.604 celic po 5 m; `build_cover` iz `tools/proga-podatki.py`, pognan s skripto zunaj repozitorija, ker proga nima `tools/rastro/config.json`): drevesa 65,3 % (`333c2f`), trava 31,1 % (`464638`), pozidano 3,6 % (`5a574c`), golo 0 %. Okvir proge je iz `js/geo.js` (lat −28,395383, lon −49,543494), preverjen kot pri Spa: gozd iz `def.lc` na drevesih WorldCover, korelacija 0,98 brez zamika.
- **Deleži se že ujemajo**: raba tal v igri (`def.lc`) ima v istem pasu 65,2 % gozda, 31,6 % trave in 3,2 % pozidanega, tudi po odsekih 250 m. Pri 3,9 km (Alto da Serra, opomba v tabeli prog v `docs/realizem.md`) je tudi v WorldCover travišče planote brez dreves, zato razporeditev gozda ostane; gozd je na pečini pod planoto.
- **Odtenek v barvah oglišč**: tla gorske ceste so en material za travo, skalo, rdečo zemljo in beton, drevesa imajo visoka gola debla, zato bi množilnik na materialu (kot na Spa) skalo obarval lila in lubje rožnato. Graditelj zato vzame samo množilnika: `tla(def, o)` gre v `rrCol` na travo, slamo, gozdna tla, grmičje in mah na usekih, `listje(def, chunks)` v zelena oglišča enotskih dreves (g > r: listje, ne lubje) in v grme ob ograji. Debla, skala, rdeča zemlja, beton in dvorišča ostanejo do številke enaki. Gozdna tla vzamejo množilnik tal (ne listja), da so tla ena ploskev brez stopnice v odtenku na robu gozda.
- **Številke pri moči 0,35**: tla × 1,036 / 0,982 / 1,188, listje × 1,073 / 0,975 / 1,336 (manj nasičeno zeleno, več modre). Na sliki se zelene površine premaknejo za ~3–4 stopnje od 255, asfalt, beton, skala in debla za manj kot 0,6. Sonce po širini (28,4° J) se praktično ne spremeni (`sunI` 1,1 → 1,0996).
- **Drugo iz paketa**: pasov košnje proga nima, pas rdeče zemlje ob asfaltu že ima, teren po meri ni potreben (pečine so narejene v graditelju). Podnebje `Cfb` je odčitano z objavljene karte Köppen–Geiger (planota Serra Geral, 1010–1421 m) in, kot pri Spa, vpisano ročno. Barve po odsekih (`cover.open` na 50 m) še niso uporabljene: en odtenek za vso progo.
- **Obremenitev enaka**: 1401 mrež, 750.819 oglišč, 25.952 primerkov (pred in po); referenca sveta posodobljena samo za `rastro` (`WORLD_ONLY=rastro node tests/browser/world.test.mjs --update`: spremenila se je samo skupina `-:MeshLambertMaterial`). Slike zdaj in potem: `node tools/shot.mjs rastro --m 1500,3900 --pred b45f274`; pri moči 0,35 je razlika pod pragom orodja (»nobena slika se ni opazno spremenila«), vidna je v številkah in ob primerjavi slik.

### Odločitev: moč 35 % (14. 11. 2026)

Na vprašanje »Rastje: barve po meritvah« (moč 35 %, 65 % ali 100 %, vsaka s sliko Spa zdaj in potem, kamera za avtom) je uporabnik 14. 11. 2026 ob 11.48 izbral **1 · moč 35 %** (klikljiva izbira v pogovoru s koordinacijo). To je vrednost, ki je že v kodi: `MOC` v `js/world-rastje.js` ostane 0,35, referenci sveta za Spa in Rio do Rastro sta narejeni pri tej moči in ostaneta. Slike za vprašanje so bile na veji `slike/rastje-669` (brez PR); po odgovoru je veja izbrisana. Slike naredi znova `node tools/shot.mjs spa --m 2600,1700 --pred 6d10f3f` (drugo moč pokaže kopija igre z drugim `MOC` in `--root`); za Rio do Rastro je ukaz pri G2 zgoraj. Če se moč kdaj poveča: pri 100 % debla na Spa pordečijo (množilnik je na vsem materialu dreves), zato takrat tudi Spa prestavi na `listje` (samo zelena oglišča).

### Predaja (14. 11. 2026)

G0 je narejen (kosi 1–4, slike, odločitev o moči), prva proga prehoda (Rio do Rastro) je na veji. PR #669 ostane osnutek do vrste (na `main` za S, `docs/vrsta.md`). Stanje in naslednji koraki:
1. **Odprtega vprašanja ni**: moč barv je odločena (»Odločitev: moč 35 %« zgoraj), koda in reference sveta so nespremenjene.
2. **Naslednje proge** po vrstnem redu tabele v `docs/realizem.md` in pravilu izmenjave (»Manj sklopov pri grafiki«; zamrznjene se preskočijo, Rio do Rastro je 5.): za račun te teme so 1. Nürburg, 3. Tianmen, 7. Montréal, 9. Chapman's Peak in 11. Katu-Jaryk. S in G gresta na progo skupaj v enem prehodu, zato proge s stavbami čakajo na sestavne dele S (S0, #668); Nürburg in Tianmen imata odprt E1 (#678), Katu-Jaryk in Pikes Peak #671 (iste datoteke). Pred začetkom preveri odprte PR.
3. **Prekrivanje z E1 (#678) na Rio do Rastro**: oba PR spreminjata `js/world-rastro.js`, `docs/kazalo.md`, `docs/proge/rastro.md` in `tests/golden/world.json`, zato gresta na `main` drug za drugim po dogovoru, ne hkrati. Poskusni spoj obeh vej (14. 11.) da tri spore, ki jih reši PR, ki gre na `main` drugi:
   - `docs/kazalo.md`: #678 dopolni vrstico `js/world-cesta.js`, ta veja doda za njo vrstico `js/world-rastje.js`; obdrži vrstico `js/world-cesta.js` iz #678 in vrstico `js/world-rastje.js` s te veje.
   - `js/world-rastro.js`, ena vrstica (`const … RV = rng(3351), bushC = …`): obdrži oboje, `const off = new GB(),` na začetku iz #678 in `.map(c => lt ? [c[0] * lt[0], c[1] * lt[1], c[2] * lt[2]] : c)` za seznamom `bushC` s te veje.
   - `tests/golden/world.json`, vnos `rastro`: po spoju ga ustvari znova (`WORLD_ONLY=rastro node tests/browser/world.test.mjs --update`).
   - `README.md`, `docs/proge/rastro.md` in `index.html` se spojijo sami.
4. **Vzorec za gorske ceste** (Tianmen, Katu-Jaryk, Chapman's Peak, Bâlea, Los Caracoles, Pikes Peak): `MERITVE.<id>` (meritev s korakom `cover` ali z `build_cover`, okvir iz `js/geo.js`, preverjen s korelacijo `def.lc` in WorldCover), nato `World.rastje.tla` v funkcijo barve tal in `World.rastje.listje` na enotska drevesa pred `addTo`, kot v `js/world-rastro.js`. Skupni pomočniki gorskih cest niso zamrznjeni, Vršičevi deli v `js/world-vrsic.js` so.
- Preizkus: `npm run test:related`. Skupni zagon lahko preseže 40 min; teste lahko poženeš posamič (`node tests/run.js --related --list`). Za samo eno progo: `WORLD_ONLY=rastro node tests/browser/world.test.mjs`. Če Playwright manjka (`ERR_MODULE_NOT_FOUND`), ga poveži z `ln -s /opt/node-tools/node_modules/playwright node_modules/playwright`.
- Svetloba (kos 3) je po fiziki majhna (Spa ~1 % moči, ~2 % modre; Rio do Rastro nič); večji učinek je na severnih progah (Harju).
- Meritev brez `tools/<id>/config.json`: izvozi sredinsko črto proge iz igre, jo pretvori z `lat0`, `lon0` in `rot` iz `js/geo.js` ter pokliči `build_cover` iz `tools/proga-podatki.py` (skripta zunaj repozitorija, prenesene ploščice v svoji prazni mapi, Python z `-I`); `scipy` in `rasterio`: `pip install --break-system-packages -q scipy rasterio`.

### Predaja (12. 11. 2026)

Naslednji je kos 2 (kompleti rastja po podnebju), nato 3 in 4. Za naprej:
- Priklop v igri: proge z orodjem (`tools/<id>/build.py` → `js/data/<id>.js`) berejo teren in rabo tal v `World.nrPrep` (`def.dem`, `def.lc`: celice 16 m, 4 razredi: 0 odprto, 1 gozd, 2 grmičje, 3 naselje). `build.py` posamezne proge prenese `cover` v podatke igre šele pri prehodu na proge (G1–G4), ne v G0.
- Starejše prave proge brez `tools/<id>/config.json` (tudi Spa) nimajo `lat0` in `lon0`: pred korakom `cover` potrebujejo poravnavo (`docs/realizem.md`, postopek, korak 2).
- Zima na severu (korak 7 postopka): letni mozaik je mediana leta, brez snega. Zimske barve iz posameznih posnetkov Sentinel-2 (vedro `sentinel-cogs`, kot `tools/proga/lib.py`: `s2_scenes`, `s2_band`) še niso v orodju.
- Letni mozaik ima še nekaj senc terena; starejše orodje (`tools/proga/proga.py`, `colours()`) jih deli ven in srednja tla postavi na 0,44.
- Skupne spremembe videza samo za prave proge (brez `test` in `pending`); zamrznjene ostanejo do pike enake. Obremenitev drugih prog se ne poveča, fizika vožnje se ne spreminja.
- Vprašanje za uporabnika (2–3 možnosti s slikami, zdaj in potem na Spa) še ni postavljeno: pride, ko so kosi 2–4 vidni v igri.
