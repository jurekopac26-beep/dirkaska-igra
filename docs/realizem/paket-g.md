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

## G0 · sestavni deli (v delu)

Veja `realizem/g0-rastje-teren`, jure.kopac26 (odločitev uporabnika 12. 11. 2026 ob ~19.30 prek Mateja, tabla #382, komentar 6830929804; prej partyslo od ~17. 11.). G0 na progah ne dela; prehod na proge pride po G0, skupaj s S.

Kosi, vsak v svojem commitu:
1. **Orodje** (`tools/proga-podatki.py`): deleži razredov WorldCover v pasu do 60 m ob cesti (po odsekih, levo in desno) in barve tal iz letnega mozaika Sentinel-2. **Narejeno 12. 11. 2026** (spodaj »Kos 1«).
2. **Kompleti rastja po podnebju**: nova datoteka `js/world-rastje.js`; v `js/world.js` samo kratki priklopi, da so spori z E (#657, `js/world-cesta.js`) in S0 (#668) majhni.
3. **Svetloba in ton po državah** (`js/render.js`, kratek priklop; tabela v `js/world-rastje.js`).
4. **Mehak prehod med travo ob cesti in pobočjem** (odločitev uporabnika 12. 11. 2026 ob ~14.25 prek Mateja): samo prave proge, zamrznjene ostanejo do pike enake.

Pred `main`: 2–3 možnosti s slikami naenkrat in slike zdaj in potem (Spa, Belgija) na strani Odločitve.

### Kos 1: orodje (narejeno)

- Korak `cover` (`python3 -I tools/proga-podatki.py tools/<id>/config.json RAW cover`) prebere že narejeni `tools/<id>/<id>.json` ter mu doda ključ `cover` in mrežo `col.png`. Drugi ključi ostanejo do znaka enaki, OSM se ne prenaša znova. Korak `data` naredi isto sam.
- `cover`: pas 8–60 m od sredinske črte na mreži 5 m, odseki po ~50 m, levo in desno. Na odsek: `share` (deleži razredov WorldCover v %), `open` (barva odprtih tal: razredi 20, 30, 40, 60, 90, 100) in `canopy` (barva krošenj, razred 10). Za vso progo: `classes`, `names`, `share`, `colour`. Barve so od 15 m naprej (bližji piksel 10 m vsebuje asfalt); `''` pomeni premalo celic, takrat velja barva razreda za vso progo. Opis je v `about.cover` izhoda.
- `col.png`: barve tal na mreži `lc.png` (10 m, RGB; ~5 KB na km proge pri pasu 150 m).
- Barve so `255 × odbojnost^(1/2,2)`, brez ojačanja in brez normalizacije po progi, da so proge med seboj primerljive. Resnične barve tal so temne (Spa: mediana okoli (59, 64, 54); Livorno: drevesa `3a4236`, trava `545548`). Ton (ojačanje, nasičenost) zato nastavi igra v kosu 3; od tod pridejo možnosti za uporabnika.
- Vir: letni mozaik Sentinel-2 projekta ESA WorldCover 2021 (CC BY 4.0), `esa-worldcover-s2.s3.eu-central-1.amazonaws.com/rgbnir/2021/N50/ESA_WorldCover_10m_2021_v200_N50E005_S2RGBNIR.tif`: ploščice 1 × 1° po jugozahodnem vogalu, pasovi 1–4 = rdeča, zelena, modra, bližnja infrardeča, odbojnost × 10000, 0 = ni podatka. Navedba vira je v `about.sources` izhoda; v `README.md`, »Zasluge« gre s prvo progo, ki dobi podatke iz njega. EOX »S2 cloudless« ni primeren (CC BY-NC-SA). Iskalniki STAC so iz okolja blokirani, vedra S3 delujejo.
- Preverjeno na kopiji podatkov Livorna zunaj repozitorija (podatkov prog G0 ne spreminja): drevesa 55 %, pozidano 27 %, trava 10 %, voda 3 % (morje na levi strani); barve se ujemajo z razredi `lc.png` (voda modra, pozidano rdečkasto sivo); ostali ključi nespremenjeni. Branje čez mejo dveh ploščic preverjeno (45° S). Korak `data` s priklopom še ni tekel v celoti (prvič bo pri naslednji novi progi).

### Kosi 2–4: v igri (13. 11. 2026)

- **`js/world-rastje.js`** (`World.rastje`): velja samo za prave proge (`prava`: brez `test` in `pending`, ne Suzuka, Irohazaka, Medvode) **z meritvami** v `MERITVE` (`aktivna`). V G0 ima meritve samo Spa (predogled); ostale proge so do številke enake, dokler ne dobijo meritev v G1–G4. Nobenega klica risanja ali oglišča več: barve gredo na barvo materiala (en množilnik), svetloba na številke teme, prehod na barve, ki jih rob trave že ima.
- **Kos 2, kompleti in barve**: `PODNEBJA` (Köppen–Geiger) našteje vrste dreves podnebja kot oblike, ki jih graditelji že rišejo (»mehke krogle« ostanejo); deleži in barve pridejo iz meritev. `MERITVE.spa`: pas 8–60 m, drevesa 33,7 % (`393e34`), trava 9,3 % (`4c5143`), pozidano 57,0 % (`5d5951`: izletne cone in boksi); okvir proge lat 50,44406, lon 5,965126 (gozd iz `def.lc` poravnan na drevesa WorldCover, korelacija 0,69, ker OSM iz okolja ni dosegljiv). `barve()` izmeri, kakšno barvo igra zdaj riše (drevesa: barve oglišč vrst × barve primerkov; trava: barva tal na odprtem v pasu 8–60 m × povprečje slike trave) in materialu tal (`gMat`) in dreves (`tMat`) da odtenek meritve, svetlost ostane (`mnozilnik`; izmerjene barve so od zgoraj, skozi zrak, s sencami, zato svetlost ni prava za oko ob cesti). Moč `MOC` (0 nič, 1 ves odtenek) je uporabnikova izbira.
- **Kos 3, svetloba**: `look(t, def)` v `applyTheme` (`js/render.js`, `lookDef` iz gradnje sveta): poletno opoldansko sonce na širini proge (90° − |lat| + 23,44°), zračna masa 1/sin višine in Rayleighova optična globina (0,052 / 0,098 / 0,236) premakneta barvo in moč sonca proti soncu v zenitu. Spa: višina 63°, sonce za ~1 % šibkejše in za ~2 % manj modro; nebo in ton proge ostaneta.
- **Kos 4, prehod**: `prehod(c, g, u)` v robu trave ob ograji Spa (`js/world-spa.js`): pasovi košnje preidejo v barvo pobočja čez širino roba (malo ob cesti, vse na koncu), namesto ostrega roba na zadnjih dveh točkah.

### Predaja (12. 11. 2026)

Naslednji je kos 2 (kompleti rastja po podnebju), nato 3 in 4. Za naprej:
- Priklop v igri: proge z orodjem (`tools/<id>/build.py` → `js/data/<id>.js`) berejo teren in rabo tal v `World.nrPrep` (`def.dem`, `def.lc`: celice 16 m, 4 razredi: 0 odprto, 1 gozd, 2 grmičje, 3 naselje). `build.py` posamezne proge prenese `cover` v podatke igre šele pri prehodu na proge (G1–G4), ne v G0.
- Starejše prave proge brez `tools/<id>/config.json` (tudi Spa) nimajo `lat0` in `lon0`: pred korakom `cover` potrebujejo poravnavo (`docs/realizem.md`, postopek, korak 2).
- Zima na severu (korak 7 postopka): letni mozaik je mediana leta, brez snega. Zimske barve iz posameznih posnetkov Sentinel-2 (vedro `sentinel-cogs`, kot `tools/proga/lib.py`: `s2_scenes`, `s2_band`) še niso v orodju.
- Letni mozaik ima še nekaj senc terena; starejše orodje (`tools/proga/proga.py`, `colours()`) jih deli ven in srednja tla postavi na 0,44.
- Skupne spremembe videza samo za prave proge (brez `test` in `pending`); zamrznjene ostanejo do pike enake. Obremenitev drugih prog se ne poveča, fizika vožnje se ne spreminja.
- Vprašanje za uporabnika (2–3 možnosti s slikami, zdaj in potem na Spa) še ni postavljeno: pride, ko so kosi 2–4 vidni v igri.
