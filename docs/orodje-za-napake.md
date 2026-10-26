# Orodje za napake · načrt

Načrt za orodje, s katerim uporabnik med igranjem označi napake in jih pošlje Claudu. Vse odločitve so iz pogovora z uporabnikom (oktober 2026); nova seja dela po tem načrtu in ne potrebuje starega pogovora ne slik maket.

**Kako se dela:** vsak sklop v svoji seji (»Naredi sklop N po docs/orodje-za-napake.md«). Ob koncu sklopa posodobi razdelek **Stanje** spodaj, `docs/kazalo.md` in napiši uporabniku seznam za preizkus.

## Stanje

| Sklop | Ime | Stanje |
|---|---|---|
| 0 | Zasebnost (Cloudflare) | odloženo |
| 1 | Načrt, kazalo, pravila | v delu |
| 2 | Razdeljen README | čaka |
| 3 | Hitrejši testi, hiter vstop | čaka |
| 4 | Posnetek | čaka |
| 5 | Označevanje | čaka |
| 6 | Slika in pošiljanje | čaka |
| 7 | Zastavica med dirko | čaka |
| 8 | Skrito v izdaji za Google Play | odloženo |
| 9 | Dnevnik napak, prikaz za razvijalca | čaka |
| 10 | G · V krogu | čaka |
| 11 | D · Samodejne zastavice | čaka |
| 12 | E · Datoteka s posnetkom | čaka |
| 13 | F · Seznam napak | čaka |
| 14 | Posnetki zaslona, predogled pred mainom | čaka |
| 15 | Posnetki pred/po na GitHubu | čaka |
| 16 | Ponovljive dirke | čaka |
| 17 | Razdeljen world.js | čaka |

## Odločitve (veljajo za vse sklope)

- **Izbrana zasnova:** različica 5 (»zastavica že med dirko«) z oblački ob krogih (3), zbiranjem več trenutkov (A), podatki o progi na sliki (B) in pošiljanjem (C), plus »Posnetek do sem« sredi dirke.
- **Naprave:** Samsung Galaxy S25 Ultra in Galaxy A25 (oba Chrome), računalnik z Microsoft Edge. Ležeče in pokonci. A25 je merilo hitrosti: orodje med dirko ne sme ničesar upočasniti (zastavica si zapomni samo čas, slike nastanejo šele v posnetku).
- **Igra:** https://jurekopac26-beep.github.io/dirkaska-igra/ (GitHub Pages z `main`; uporabnik naslova še ni potrdil).
- **Jezik:** orodje samo v slovenščini. `tests/lang.test.js` zahteva angleščino za vsak `tr()` in vsako besedilo v `index.html`, zato je orodje v `js/napake.js`, gradi svoj DOM in ne uporablja `tr()`. Izboljšave obstoječega posnetka (časovnica, gumbi) so del igre in dobijo kratke prevode v `js/lang.js`.
- **Tipke na računalniku** (nastavljive v Kontrolah): **F** zastavica, **I** Posnetek do sem, **O** prikaz za razvijalca. **P** in **Esc** ostaneta Pavza. Plošček: zastavica na Select/Back (predlog).
- **Barve svinčnika (6):** rdeča `#FF3B30`, oranžna `#FF9500`, rumena `#FFE14D`, modra `#2AA8FF`, vijolična `#C061FF`, bela `#FFFFFF`. Zelene ni (trava).
- **Zastavica med dirko:** v vseh načinih razen dirke s prijateljem (`js/net.js`).
- **Repozitorij je javen:** slike napak, zapiski in seznam napak (F) **ne gredo v repozitorij**.
- **Testi (kombinacija):** lokalno samo testi, ki se nanašajo na sklop (Node in brskalniški); celotni nabori (Node, brskalniški, vozila) tečejo na GitHubu v pull requestu sklopa (`.github/workflows/tests.yml`). Celoten Node nabor tu traja okoli 1 h (26. 10. 2026: `golden` 12 min, `races` več kot 15 min in ga `tests/run.js` ustavi, skupaj ~51 min brez konca `races`), na GitHubu okoli 20 min. Če ga poganjaš lokalno, nastavi `TEST_TIMEOUT_MIN=40`.
- **Potrditev vnaprej (26. 10. 2026):** uporabnik je potrdil vse sklope. Vsak sklop gre na `main`, ko so testi zeleni (lokalno in na GitHubu), in takoj se začne naslednji; ne čakaj na potrditev med sklopi. Uporabnik preizkuša sproti in javi napake, ki se popravijo v naslednjem sklopu ali posebej.
- **Veje:** `orodje-za-napake/sklop-NN-<ime>`, en pull request na sklop.
- **Vsak popravljen hrošč** dobi svoj test (`tests/napake/<št>.test.js` ali v obstoječem testu teme), okoli 10 min na popravek.
- **Odloženo:** sklop 0 (repozitorij zaseben, igra na Cloudflare Pages z dostopom samo za uporabnika; GitHub Pro bi stal okoli 4 $/mesec, če bi kdaj izbrali samo zasebno kodo) in sklop 8 (orodje skrito v izdaji za Google Play). Do sklopa 8 je orodje privzeto vklopljeno.

## Zasnova (iz maket)

### Posnetek

- Obstoječi posnetek (`#replay-ui`, `replayStart` / `replayAct` / `replayFrame` v `js/game.js`) dobi:
  - debelejšo časovnico (`.rp-prog`), ki se jo klikne ali vleče; levo trenutni čas, desno dolžina (`00:41.3 / 02:31.2`);
  - gumbe: na začetek, 5 s nazaj, sličica nazaj, predvajaj/ustavi, sličica naprej, 5 s naprej, hitrost, kamera, prejšnji/naslednji avto, ★ Trenutki, **Označi**, Foto, Končaj.
- **Zgoraj stikalo** »Cel posnetek | Zastavice (n)«:
  - **Cel posnetek** je kot zdaj, od starta do cilja. Zastavice so na časovnici samo oznake, tap skoči tja.
  - **Zastavice** skačejo med označenimi trenutki (Prejšnja / Naslednja) in vsakega ponavljajo od −2 s do +1 s.
  - Brez zastavic je gumb Zastavice siv.
- **Posnetek do sem:**
  - v meniju Pavza nov gumb za »Celoten zaslon«; tipka **I** ga odpre neposredno, brez menija;
  - napis »● POSNETEK DO SEM«, ploščica »Dirka čaka na pavzi · krog x/y«; časovnica se konča z zeleno oznako ZDAJ;
  - namesto Končaj je zelen gumb **Nazaj v dirko**, ki vrne dirko točno tja, kjer je bila, z odštevanjem 3 · 2 · 1;
  - posnetek med ogledom premika iste avte kot dirka (`rpPose`), zato je treba stanje vseh avtov pred ogledom shraniti in ga po ogledu vrniti;
  - ni v dirki s prijateljem.
- Posnetek hrani do 20 min dirke (`REC_MAX` v `js/game.js`).

### Označevanje

- **Označi** ustavi posnetek. Ležeče je paleta navpično ob levem robu, pokonci vrstica nad časovnico. V paleti so svinčnik, 6 barv, razveljavi in radirka.
- Ko je krog sklenjen, se tik ob njem odpre **oblaček** v isti barvi in vanj se piše. Ena barva na sličici pomeni en zapis (vse rdeče gre v rdeči zapis). Oblaček se da premakniti.
- **Dodaj k zbirki** shrani trenutek (sličico, oznake, zapise) in na časovnici postavi zastavico.

### Slika in pošiljanje

- **Zbirna slika**, največ 1600 px (v Nastavitvah tudi 2400 px):
  - ležeče mreža 2 × 2 (do 3 trenutki in polje s podatki ter zemljevidom), pri več trenutkih več slik;
  - pokonci 3 trenutki v vrsti, podatki in zemljevid spodaj.
- **Vsak trenutek:**
  - sličica z oznakami in oblački;
  - vrstica »#n · čas · krog · metri od štarta«;
  - 4 sličice gibanja (−0,6 s, −0,3 s, 0, +0,3 s).
- **Podatki (B):** proga, način, vreme, različica (žig iz `tools/stamp.js`), naprava z modelom telefona (npr. »Galaxy A25«), datum, zemljevid z oštevilčenimi mesti.
- **Ime datoteke:** `napake_<proga>_<LLLLMMDD-UUMM>.png`.
- **Ob koncu** (ali z gumbom Deli kadar koli) se odpre izbira:
  - **Deli zdaj** – na telefonu meni Deli (Web Share), na računalniku je prva izbira **Kopiraj sliko** za Ctrl + V;
  - **Samo shrani sliko** – v Prenose; obvestilo pove, kje je (Samsung: *Moje datoteke → Prenosi*, Edge: mapa *Prenosi*);
  - **Kopiraj besedilo** – oblika spodaj.
- **Shranjene napake:**
  - zadnjih 20 slik ostane v igri (IndexedDB), označenih z »neposlano« ali »poslano«;
  - gumb »Deli vse neposlane«;
  - kljukica »Obdrži tudi v igri«.
- **Nastavitve → Orodje za napake:**
  - Vklop;
  - Ob koncu (Vprašaj / Deli / Shrani);
  - Zastavica med dirko (Gumb + tipka F / Samo tipka / Izklop);
  - Velikost slike (1600 / 2400 px);
  - Shranjene napake.
- Obstoječi Foto (`photoSave` v `js/game.js`: `Render.snapshot`, Web Share, prenos) je vzor za izdelavo in pošiljanje slike.

**Besedilo za pogovor** (Kopiraj besedilo; isto besedilo je tudi spodaj na sliki):

```
RRA-NAPAKE v=<žig> proga=<id> način=<način>/<vreme> naprava=<model> <širina>x<višina>
#1 00:18.2 K1 s=412m modra »Tekmeci vozijo v koloni preveč skupaj« v_krogu=[tekmec#3, tekmec#5]
#2 00:41.327 K2 s=1284m rdeča »Sledi gum sredi ravnine« v_krogu=[sledi_gum, cesta:412-431]
```

`s` je razdalja od štarta po progi (`T.idx` / `T.ds` v `Core`), `v_krogu` doda sklop 10.

### Zastavica med dirko

- Okrogel rumen gumb ob desnem robu. Postavi ga tako, da ne prekriva dotičnih kontrol (`#touch`), ležeče in pokonci.
- Ob tapu: obvestilo »⚑ Zastavica N · čas – dirka teče naprej«. Igra si zapomni samo čas, nič drugega.

## Sklopi

Časi so moje delo; vsak sklop, ki spremeni kodo igre, vzame še čas za teste (lokalno samo povezani testi, celotni nabori na GitHubu okoli pol ure). Sklopi gredo eden za drugim brez čakanja (potrditev vnaprej), zato so datumi samo okvir: skupaj okoli 30–40 ur v zaporednih sejah.

### Sklop 1 · Načrt, kazalo, pravila — 0,5–1 h · 26. 10. 2026

- Ta načrt (`docs/orodje-za-napake.md`).
- Kazalo kode `docs/kazalo.md`: kje v kodi je kaj, po temah, z imeni funkcij (brez številk vrstic).
- `CLAUDE.md`: razdelek o orodju za napake, kazalu in poročilih; kombinacija testov; pull request za vsak sklop.
- Testi: `npm run test:node` (vsi zeleni; `races.test.js` je presegel 15 min in je bil pognan še posebej). Koda igre se ne spremeni.
- **Preizkus:** uporabnik prebere načrt in potrdi.

### Sklop 2 · Razdeljen README — 1–1,5 h · 27. 10.

- **Opisi prog:** iz `README.md` (400 KB) v `docs/proge/<id>.md`, ena datoteka na progo.
- **V `README.md` ostanejo:** kratek opis igre, seznam prog s povezavami, »Nova proga«, »Nov meni«, »Zasluge« (licence morajo ostati v README po `CLAUDE.md`).
- **Povezave:** posodobi tiste v `CLAUDE.md`, `tests/README.md` in `maketa-menija/README.md`.
- **Testi:** `npm run test:node`. Koda igre se ne spremeni.
- **Preizkus:** povezave v README delujejo na GitHubu.

### Sklop 3 · Hitrejši testi, hiter vstop — 2 h · 27. 10.

- **`npm run test:related`:** iz spremenjenih datotek (`git diff` proti `main`) izbere teste (po imenu teme, proge in datoteke ter po majhnem seznamu v `tests/run.js`).
- **Tih izpis** `--quiet` v `tests/run.js`: samo napake in povzetek.
- **Hiter vstop prek naslova:** `?proga=<id>&nacin=<način>&t=<s>&vreme=suho|dez&avto=<id>`. Igra se odpre naravnost na dirki, `t` premakne posnetek ali dirko na čas. Za teste in `tools/shot.mjs`.
- **Testi:** node in brskalniški test za hiter vstop.
- **Preizkus:** povezava z `?proga=bathurst` odpre dirko na Bathurstu.

### Sklop 4 · Posnetek — 1,5–2,5 h · 28. 10.

- Časovnica s klikom in vlečenjem, časa, 5 s nazaj/naprej, po sličicah (iskanje sličice: `R.frames`, `P.t` / `P.i`).
- Stikalo Cel posnetek | Zastavice (zaenkrat brez zastavic, pride v sklopu 7).
- Posnetek do sem (Pavza + tipka I), Nazaj v dirko s 3 · 2 · 1, shranjevanje in vračanje stanja avtov.
- Prevodi novih gumbov v `js/lang.js`, `node tools/stamp.js`.
- **Testi:** `tests/browser/replay.test.mjs` (razširi), `ctrl`, `pad`, `lang`; GitHub vse.
- **Najbolj negotov sklop** (vračanje stanja dirke).
- **Preizkus:** skok s klikom, vlečenje, 5 s nazaj, Posnetek do sem sredi dirke in nadaljevanje na S25 in A25, ležeče in pokonci.

### Sklop 5 · Označevanje — 1,5–2 h · 29. 10.

- `js/napake.js`: platno za risanje čez posnetek, 6 barv, razveljavi, radirka, oblački ob krogih, zbirka trenutkov v pomnilniku.
- Postavitev ležeče in pokonci (od 360 × 640 oz. 640 × 360).
- **Testi:** nov `tests/browser/napake.test.mjs`; GitHub vse.
- **Preizkus:** obkroži z dvema barvama, piši v oblačka, razveljavi, premakni oblaček.

### Sklop 6 · Slika in pošiljanje — 1,5–2 h · 30. 10.

- **Zbirna slika:** ležeče in pokonci, podatki B, 4 sličice gibanja (izris posnetka ob −0,6, −0,3 in +0,3 s), besedilo spodaj.
- **Izbira ob koncu:** Deli zdaj / Samo shrani / Kopiraj besedilo; na računalniku Kopiraj sliko.
- **Shranjene napake** v IndexedDB (zadnjih 20) in razdelek v Nastavitvah.
- **Testi:** `napake.test.mjs`, `share.test.mjs`; GitHub vse.
- **Preizkus:** Deli → Claude na obeh telefonih, Samo shrani (najdi v Prenosih), Kopiraj sliko v Edgu.

### Sklop 7 · Zastavica med dirko — 1–1,5 h · 30. 10. · **različica 5 je cela**

- **Gumb in tipke:** gumb na zaslonu, tipka F, plošček; nova dejanja v Kontrolah (`KEY_DEF` v `js/input.js`), privzeto F.
- **Shranjevanje:** zastavice se shranijo z dirko in so na časovnici; način Zastavice deluje (skoki, ponavljanje).
- **Testi:** `ctrl`, `pad`, `replay`, `napake`; GitHub vse.
- **Preizkus:** 3 zastavice med dirko, nato Zastavice v posnetku; gumb ne moti vožnje na A25.

### Sklop 9 · Dnevnik napak, prikaz za razvijalca — 1,5–2 h · 31. 10.

- **Dnevnik napak:** `window.onerror`, `unhandledrejection`, zatikanja (pod 20 sličic/s več kot 1 s). Hrani zadnjih 50 zapisov; priloži se poročilu.
- **Prikaz s tipko O** (in v Nastavitvah orodja): FPS, klici risanja in oglišča (`renderer.info`), `s` v metrih, krog, tema, nivo podrobnosti (LOD).
- **Testi:** `napake.test.mjs`; GitHub vse.
- **Preizkus:** prikaz na A25 med dirko na pravi progi (npr. Bathurst, Spa).

### Sklop 10 · G · V krogu — 1,5–2,5 h · 31. 10.

- **Kaj je obkroženo:** ob shranjevanju igra izračuna, kaj je v krogu (projekcija na zaslon, točka v mnogokotniku):
  - avti (`tekmec#n`, `ti`),
  - odsek ceste (`cesta:i0-i1`),
  - podrti predmeti (`out.props` iz `World.build`),
  - posebnosti proge, kjer jih ima `def`.
- **Imena** so tista iz kode, da se jih najde z grepom; razlaga imen je v `docs/kazalo.md`.
- **Testi:** `napake.test.mjs`; GitHub vse.
- **Preizkus:** obkroži tekmeca in tablo, preveri besedilo.

### Sklop 11 · D · Samodejne zastavice — 1–1,5 h · 1. 11.

- **Iz posnetka** (`R.frames`, 20-krat na sekundo):
  - avto obtičal več kot 5 s,
  - preskok (več metrov v eni sličici),
  - poskok skozi tla ali pod tla,
  - tekmec stoji ali vozi v napačno smer.
- **Iz dnevnika:** zatikanje.
- **V posnetku:** sive zastavice s klicajem, Potrdi / Zavrzi.
- **Testi:** `napake.test.mjs` (umetno sestavljen posnetek); GitHub vse.

### Sklop 12 · E · Datoteka s posnetkom — 1,5–2 h · 1. 11.

- **Zapis:** posnetek (`recd`: avti, `frames`, dogodki) v datoteko `posnetek_<proga>_<datum>.rrp`: glava JSON (proga, način, žig, naprava) in sličice Float32, stisnjeno z `CompressionStream` (gzip). Okoli 1–1,5 MB za 3 min.
- **Odpiranje:** Nastavitve orodja → Odpri posnetek; za Clauda prek `tools/` in Playwrighta.
- **Testi:** zapis in branje dasta enak posnetek; GitHub vse.

### Sklop 13 · F · Seznam napak — ~1 h · 1. 11.

- Zasebna spletna stran (Artifact z bazo), **ne v repozitoriju**. Kartice: Poslano → Popravljam → Preveri v igri → Zaprto; ob kartici povezava do spremembe in testa.
- Koda igre se ne spremeni.

### Sklop 14 · Posnetki zaslona, predogled pred mainom — 2 h · 2. 11.

- **`tools/shot.mjs`:** npr. `node tools/shot.mjs bathurst --m 1284 --pokonci --lezece`. Prek hitrega vstopa naredi dve majhni sliki z istega mesta, za primerjavo pred in po. Vzor je `tools/carshots.mjs`.
- **Predogled pred mainom:** veja sklopa na ločenem naslovu (npr. `…/beta/`). Način določita sklop in nastavitev Pages, ki jo naredi uporabnik.

### Sklop 15 · Posnetki pred/po na GitHubu — 2 h · 2. 11.

- Delovni tok v `.github/workflows/`: ob pull requestu naredi s `tools/shot.mjs` posnetke nekaj pravih prog na `main` in na veji ter jih priloži kot artefakt s kratkim povzetkom.

### Sklop 16 · Ponovljive dirke — 1–2 h · 3. 11.

- **Seme:** v načinu za testiranje vsi naključni dogodki, ki vplivajo na igro, iz semena dirke.
- **Kje:** `Math.random` v `js/core.js` (npr. odpadanje koles, razbitine) zamenja `rng` iz `Core` s semenom dirke (`race.opts.seed`).
- **Vizualni učinki** v `js/game.js` in `js/render.js` lahko ostanejo naključni.
- **Testi:** ista dirka dvakrat da enak posnetek; `races.test.js`, `golden`.

### Sklop 17 · Razdeljen world.js — 3–5 h · 4.–5. 11.

- **Kaj:** graditelje prog (`buildSpa`, `buildRbring`, …) iz `js/world.js` (3,9 MB, 34.603 vrstic) premakni v `js/world-<tema>.js`.
- **Vzor:** obstoječi `World.ext[tema]` in `extAPI` (`js/world-montreal.js`, `world-toronto.js`, `world-townsville.js`).
- **Ob vsaki datoteki** posodobi oznake skript v `index.html`, `sw.js` in `tools/stamp.js`.
- **Po korakih:** nekaj prog na pull request. Svet mora ostati enak (`tests/browser/world.test.mjs`, `perf`, `golden` brez novih referenc).
- **Kazalo:** posodobi tabelo prog v `docs/kazalo.md`.

### Odloženo

- **Sklop 0 · Zasebnost:**
  - Cloudflare račun (uporabnik);
  - Cloudflare Pages z repozitorija;
  - Cloudflare Access »samo moj e-naslov«;
  - preverjanje;
  - repozitorij zaseben in GitHub Pages izklopljen.

  Opozorilo: zasebni repozitorij ima na brezplačnem računu 2000 min testov na mesec. Moje delo 0,5–1 h, uporabnik 20–30 min.
- **Sklop 8 · Skrito v izdaji za Google Play:** test, da igralci orodja ne vidijo; vklop samo v načinu za testiranje. 0,5 h.

## Skupaj

- **Moje delo** brez odloženih sklopov: **23,5–32,5 h**, s testi okoli **30–42 h**.
- **Različica 5** je cela po sklopu 7: okoli 9–12,5 h dela, okoli 11,5–16 h s testi.
