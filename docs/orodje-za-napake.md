# Orodje za napake · načrt

Načrt za orodje, s katerim uporabnik med igranjem označi napake in jih pošlje Claudu. Vse odločitve so iz pogovora z uporabnikom (oktober 2026); nova seja dela po tem načrtu in ne potrebuje starega pogovora ne slik maket.

**Kako se dela:** vsak sklop v svoji seji (»Naredi sklop N po docs/orodje-za-napake.md«). Ob koncu sklopa posodobi razdelek **Stanje** spodaj, `docs/kazalo.md` in napiši uporabniku seznam za preizkus.

## Stanje

| Sklop | Ime | Stanje |
|---|---|---|
| 0 | Zasebnost (Cloudflare) | odloženo |
| 1 | Načrt, kazalo, pravila | končano (PR #165) |
| 2 | Razdeljen README | končano |
| 3 | Hitrejši testi, hiter vstop | končano |
| 3b | Stabilni testi | končano (PR #170) |
| 4 | Posnetek | končano |
| 5 | Označevanje | končano |
| 6 | Slika in pošiljanje | čaka · skupaj s 7 (veriga, korak 2) |
| 7 | Zastavica med dirko | čaka · skupaj s 6 (veriga, korak 2) |
| 8 | Skrito v izdaji za Google Play | odloženo |
| 9 | Dnevnik napak, prikaz za razvijalca | čaka · skupaj z 10 in 11 (veriga, korak 3) |
| 10 | G · V krogu | čaka · skupaj z 9 in 11 (veriga, korak 3) |
| 11 | D · Samodejne zastavice | čaka · skupaj z 9 in 10 (veriga, korak 3) |
| 12 | E · Datoteka s posnetkom | čaka (veriga, korak 4, zadnji) |
| 13 | F · Seznam napak | končano (zasebna spletna stran glavne seje, ni v repozitoriju) |
| 14 | Posnetki zaslona, predogled pred mainom | vzporedno, skupaj s 15 |
| 15 | Posnetki pred/po na GitHubu | vzporedno, skupaj s 14 |
| 16 | Ponovljive dirke | vzporedno |
| 17 | Razdeljen world.js | vzporedno |

**Pospešitev (27. 10. 2026, uporabnik: »Oboje«):** sklopi se združijo in delno tečejo hkrati.

- **Veriga orodja** (sklop za sklopom, ker vsi urejajo `js/napake.js` in posnetek v `js/game.js`): 5 → **6+7** → **9+10+11** → **12**. Združeni sklopi so ena seja, ena veja (`orodje-za-napake/sklop-06-07-<ime>`, `…/sklop-09-10-11-<ime>`) in en pull request. Ko je korak na `main`, seja zažene sejo za naslednji korak verige z navodilom »Naredi sklope 6 in 7 po docs/orodje-za-napake.md« (oz. »sklope 9, 10 in 11«, »sklop 12«). Po sklopu 12 se veriga konča.
- **Vzporedno**, vsak v svoji seji in veji, takoj: **14+15** (orodja za posnetke zaslona in delovni tok), **16** (ponovljive dirke), **17** (razdeljen `world.js`, lahko več pull requestov). Te seje po koncu ne zaženejo nove seje.
- **13** (seznam napak) naredi glavna seja kot zasebno spletno stran; ni v repozitoriju.
- **Pred združitvijo v `main`** vsaka seja vanjo združi svežo `main` in še enkrat lokalno požene teste, povezane s spremembo. Spori so najverjetnejši v `index.html`, `sw.js`, `tools/stamp.js`, `docs/kazalo.md` in v tej tabeli: obdrži spremembe obeh strani. Če sklop 16 spremeni reference (`golden`, `races`), jih ustvari znova z orodji repozitorija; sklop 17 pa ne sme spremeniti sveta (reference ostanejo enake kot na `main`).
- **GitHub** požene največ okoli 20 opravil hkrati, en pull request jih ima 6, zato lahko testi pri več hkratnih pull requestih nekaj časa čakajo v vrsti.

## Odločitve (veljajo za vse sklope)

- **Izbrana zasnova:** različica 5 (»zastavica že med dirko«) z oblački ob krogih (3), zbiranjem več trenutkov (A), podatki o progi na sliki (B) in pošiljanjem (C), plus »Posnetek do sem« sredi dirke.
- **Naprave:** Samsung Galaxy S25 Ultra in Galaxy A25 (oba Chrome), računalnik z Microsoft Edge. Ležeče in pokonci. A25 je merilo hitrosti: orodje med dirko ne sme ničesar upočasniti (zastavica si zapomni samo čas, slike nastanejo šele v posnetku).
- **Igra:** https://jurekopac26-beep.github.io/dirkaska-igra/ (GitHub Pages z `main`; uporabnik naslova še ni potrdil).
- **Jezik:** orodje samo v slovenščini. `tests/lang.test.js` zahteva angleščino za vsak `tr()` in vsako besedilo v `index.html`, zato je orodje v `js/napake.js`, gradi svoj DOM in ne uporablja `tr()`. Izboljšave obstoječega posnetka (časovnica, gumbi) so del igre in dobijo kratke prevode v `js/lang.js`.
- **Tipke na računalniku** (nastavljive v Kontrolah): **F** zastavica, **I** Posnetek do sem, **O** prikaz za razvijalca. **P** in **Esc** ostaneta Pavza. Plošček: zastavica na Select/Back (predlog).
- **Barve svinčnika (6):** rdeča `#FF3B30`, oranžna `#FF9500`, rumena `#FFE14D`, modra `#2AA8FF`, vijolična `#C061FF`, bela `#FFFFFF`. Zelene ni (trava).
- **Zastavica med dirko:** v vseh načinih razen dirke s prijateljem (`js/net.js`).
- **Repozitorij je javen:** slike napak, zapiski in seznam napak (F) **ne gredo v repozitorij**.
- **Testi (kombinacija):** lokalno samo testi, ki se nanašajo na sklop (Node in brskalniški); celotni nabori (Node, brskalniški, vozila) tečejo na GitHubu v pull requestu sklopa (`.github/workflows/tests.yml`). Celoten Node nabor tu traja okoli 1 h (26. 10. 2026: `golden` 12 min, `races` več kot 15 min in ga `tests/run.js` ustavi, skupaj ~51 min brez konca `races`). Na GitHubu trajajo testi 35–55 min: Node okoli 35 min, en del brskalniških do okoli 55 min. Če ga poganjaš lokalno, nastavi `TEST_TIMEOUT_MIN=40`.
- **Potrditev vnaprej (26. 10. 2026):** uporabnik je potrdil vse sklope. Vsak sklop gre na `main`, ko so testi zeleni (lokalno in na GitHubu), in takoj se začne naslednji; ne čakaj na potrditev med sklopi. Uporabnik preizkuša sproti in javi napake, ki se popravijo v naslednjem sklopu ali posebej.
- **Sklopi se začnejo sami (26. 10. 2026, uporabnik: »Vseh 17 sklopov začni sam in ne sprašuj, če lahko začneš naslednjega«):** ko je sklop na `main`, seja brez vprašanja zažene sejo za naslednji sklop iz tabele Stanje (model `claude-opus-5-5`) in ji to navodilo prenese, tudi ta stavek. Sklopa 0 in 8 ostaneta odložena in se preskočita, razen če uporabnik reče drugače. Uporabnika se med sklopi ne sprašuje za potrditev, samo pri odločitvah, ki so res njegove (npr. sprememba zasnove); ob koncu vsakega sklopa dobi kratek seznam za preizkus.
- **Napor high (26. 10. 2026, uporabnik: »nastavi high za vse seje«):** `.claude/settings.json` z `{"effortLevel": "high"}`; vsaka seja, ki klonira `main`, dela z naporom high.
- **Veje:** `orodje-za-napake/sklop-NN-<ime>`, en pull request na sklop oziroma na združen korak (glej Pospešitev pod Stanjem); sklop 17 ima lahko več pull requestov.
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

Časi so moje delo; vsak sklop, ki spremeni kodo igre, vzame še čas za teste (lokalno samo povezani testi, celotni nabori na GitHubu 35–55 min). Sklopi gredo eden za drugim brez čakanja (potrditev vnaprej), zato so datumi samo okvir: skupaj okoli 30–40 ur v zaporednih sejah.

### Sklop 1 · Načrt, kazalo, pravila — 0,5–1 h · 26. 10. 2026

- Ta načrt (`docs/orodje-za-napake.md`).
- Kazalo kode `docs/kazalo.md`: kje v kodi je kaj, po temah, z imeni funkcij (brez številk vrstic).
- `CLAUDE.md`: razdelek o orodju za napake, kazalu in poročilih; kombinacija testov; pull request za vsak sklop.
- Testi: `npm run test:node` (vsi zeleni; `races.test.js` je presegel 15 min in je bil pognan še posebej). Koda igre se ne spremeni.
- **Preizkus:** uporabnik prebere načrt in potrdi.

### Sklop 2 · Razdeljen README — 1–1,5 h · 26. 10. 2026

- **Opisi prog:** iz `README.md` (400 KB) v `docs/proge/<id>.md`, ena datoteka na progo.
- **V `README.md` ostanejo:** kratek opis igre, seznam prog s povezavami, »Nova proga«, »Nov meni«, »Zasluge« (licence morajo ostati v README po `CLAUDE.md`).
- **Povezave:** posodobi tiste v `CLAUDE.md`, `tests/README.md` in `maketa-menija/README.md`.
- **Testi:** povezani testi (`fleet.test.js` pregleda vse `.md` v repozitoriju; noben test ali orodje ne bere besedila iz `README.md`); celotni nabori na GitHubu. Koda igre se ne spremeni.
- **Narejeno:** 40 opisov v `docs/proge/<id>.md` (Pikes Peak skupaj z makadamom, Toskana skupaj z Gromskim rtom; Monte Carlo, Toronto in štiri testne proge opisa nimajo), opisi delov igre (fizika, dirka, boksi, vreme, grafika, vozni park …) v `docs/igra.md`. V `README.md` (62 KB) ostanejo opis igre, seznam »Proge« s povezavami, »Nov meni«, »Zgradba projekta« z »Novo vozilo« in »Nova proga« ter »Zasluge«.
- **Preizkus:** povezave v README delujejo na GitHubu.

### Sklop 3 · Hitrejši testi, hiter vstop — 2 h · 27. 10.

- **`npm run test:related`:** iz spremenjenih datotek (`git diff` proti `main`) izbere teste (po imenu teme, proge in datoteke ter po majhnem seznamu v `tests/run.js`).
- **Tih izpis** `--quiet` v `tests/run.js`: samo napake in povzetek.
- **Hiter vstop prek naslova:** `?proga=<id>&nacin=<način>&t=<s>&vreme=suho|dez&avto=<id>`. Igra se odpre naravnost na dirki, `t` premakne posnetek ali dirko na čas. Za teste in `tools/shot.mjs`.
- **Testi:** node in brskalniški test za hiter vstop.
- **Narejeno:** `npm run test:related` (`tests/run.js --related --quiet`; `--files` za izbrane datoteke, seznam `RELATED` za velike skupne datoteke), `--quiet`, hiter vstop (`Core.quickArgs`, `quickGo` v `js/game.js`). `nacin`: `dirka`, `kronometer`, `promet`, `policija` (ali kot v kodi), samo načini proge. `t`: dirka na avtopilotu do `t` s po štartu pod nalagalnim zaslonom, nato pavza (posnetek ima vožnjo do tja); premik posnetka na čas pride s časovnico v sklopu 4. Način, vreme in avto se shranijo kot v meniju. Testi `tests/quick.test.js`, `tests/browser/quick.test.mjs`, `shards.test.js` (`--related`, `--quiet`); opis v `tests/README.md`.
- **Preizkus:** povezava z `?proga=bathurst` odpre dirko na Bathurstu.

### Sklop 3b · Stabilni testi — 1–2 h · pred sklopom 4

Dodano 26. 10. 2026 na željo uporabnika (»dodaj stabilne teste«).

- **Težava:** brskalniški testi na GitHubu občasno padejo, vsakič na drugem testu, tudi pri spremembah samo v dokumentaciji:
  - `tests/browser/weather.test.mjs` – menjava dežnih gum v boksih, avto v 3 minutah ne zapelje v bokse (PR #165);
  - `tests/browser/pits.test.mjs` – »Bathurst: at full right lock the car keeps to the middle of the lane« (`main` d9c6a88);
  - `tests/browser/radio.test.mjs` – polje radia pod zemljevidom, razmik 6,9 px pokonci in 3,8 px ležeče (PR #167).
  - `tests/browser/carlow.test.mjs` – »on its side: flat out on the Kemmel straight (over 170 km/h…)«, izmerjeno 164 km/h (PR #167, Igra v brskalniku 3/4);
  - `tests/browser/share.test.mjs` – korak 4, drugi telefon odpre povezavo `#duh=…`: `waitForFunction` na `tdgp-fghost-jezero` po 20 s poteče (PR #168, 2/4; lokalno 1 od 3). Duh je takrat že shranjen; stran izriše le nekaj sličic, `waitForFunction` pa privzeto preverja po sličicah (`raf`). Predlog: `polling: 250`.
  Prej so bili zeleni, verjetno je vzrok v novostih na `main` (22 avtov, leteči start) ali v počasnih strojih GitHuba.
- **Kaj:** za vsakega najdi vzrok (čas, naključje, več avtov, mejne vrednosti) in popravi test ali igro. Testov ne izklapljaj in ne preskakuj. Če je padel pravi hrošč v igri, ga popravi.
- **Preveri:** vsak popravljen test lokalno zaženi večkrat zapored (npr. 5×), nato celotne nabore na GitHubu.
- Če pri delu najdeš še kak test, ki občasno pade, ga dodaj sem.
- **Narejeno (vzroki in popravki):**
  - `share` – `waitForFunction` je preverjal samo ob sličicah, ki jih počasen stroj izriše malo: zdaj `polling: 250` in do 60 s.
  - `radio` – meritev je ujela sporočilo nad poljem v prvi sličici njegove animacije (0,2 s, zdrs s 3 px višje): razmik 6,9 namesto ~4 px. Polje se zdaj meri v sličici, ko se v stolpcu nič ne premika (sicer počaka znova).
  - `carlow` – v polju 22 avtov je avtopilot v prvem krogu včasih zadržan (dotik, zdrs) in je na Kemmlu šele pospeševal (164 km/h, 7 s pozneje). Zdaj vozi, dokler ni na ravnini res na polnem plinu (nad 175 km/h), po potrebi krog pozneje. Lokalno 6 ponovitev 213–223 km/h.
  - `weather` – na suhih gumah v dežju se avtopilot zaleti v druge (prvi krog, ovinek 3, in na vstopu v bokse, kamor hkrati zavije polje po dežne gume); poškodba je narasla do 1,0, avto je obstal pred boksi do konca dirke (lokalno 1 od 8). Test preverja vreme in gume: zdaj vozi brez poškodb (`damage: 0`, kot `carlow` in `radio`).
  - `pits` (Bathurst) – ko drug avto hkrati zavije v bokse ob igralcu, avto vstopi v pas pozneje (padec: 78 korakov namesto ~97) in se mu umakne (lokalno s silo 0,33–0,45 m, na GitHubu 1,04 m od sredine). Volan na to ne vpliva. Zdaj odmik do 0,8 m velja v praznem pasu, ob drugem avtu pa mora ostati v svojem pasu (do 1,6 m; pas je širok 7 m). Brez drugega avta 30 ponovitev s semeni: 0,07–0,43 m.
  - `Vozila` (posel na GitHubu): nabor traja 11–28 min, omejitev je bila 30 min; v PR #170 ga je počasen stroj prekinil tik pred koncem. Omejitev je zdaj 60 min (`.github/workflows/tests.yml`).
  - Na drugih vejah so občasno padli še `online4` (»a fifth finds the room full« – povezava z gostiteljem prekinjena), `memory` (»textures do not grow« 64 → 66) in `perf`; vzrok ni raziskan, ker so bile na vejah s spremembami igre. Če padejo na `main` ali pri spremembah samo v dokumentaciji, jih dodaj sem.

### Sklop 4 · Posnetek — 1,5–2,5 h · 28. 10.

- Časovnica s klikom in vlečenjem, časa, 5 s nazaj/naprej, po sličicah (iskanje sličice: `R.frames`, `P.t` / `P.i`).
- Stikalo Cel posnetek | Zastavice (zaenkrat brez zastavic, pride v sklopu 7).
- Posnetek do sem (Pavza + tipka I), Nazaj v dirko s 3 · 2 · 1, shranjevanje in vračanje stanja avtov.
- Prevodi novih gumbov v `js/lang.js`, `node tools/stamp.js`.
- **Testi:** `tests/browser/replay.test.mjs` (razširi), `ctrl`, `pad`, `lang`; GitHub vse.
- **Najbolj negotov sklop** (vračanje stanja dirke).
- **Preizkus:** skok s klikom, vlečenje, 5 s nazaj, Posnetek do sem sredi dirke in nadaljevanje na S25 in A25, ležeče in pokonci.
- **Narejeno:**
  - **Časovnica** (`rpLineBind`, `rpSeek`, `rpIdx`): debelejša, tap skoči, vlečenje premika (posnetek med vlečenjem stoji, nato teče naprej); levo čas, desno dolžina (`rpClock`, 00:41.3).
  - **Gumbi:** na začetek, −5 s, sličica nazaj, predvajaj/ustavi, sličica naprej, +5 s, hitrost, kamera, ★ Trenutki, Foto, Končaj. Prejšnji/naslednji avto sta zgoraj ob imenu avta (◀ Ti · čas ▶), da so gumbi ležeče v eni vrsti (od 640 px; pod 760 px ★ brez besede), pokonci v dveh. Sličica je en posneti trenutek (`REC_DT`, 1/20 s; pri več kot 30 avtih 1/10 s).
  - **Stikalo** Cel posnetek | Zastavice (n) zgoraj desno; brez zastavic je Zastavice siv. Zastavice bere iz `recd.flags` (sklop 7 jih doda in naredi način Zastavice).
  - **Posnetek do sem** (`rpHere`): gumb v pavzi za Celoten zaslon, tipka I v Kontrolah (`KEY_DEF.replay`, `Input.onReplay`); ni v dirki s prijateljem in ne pred 2 s posnetka. Začne 10 s pred zdaj (`RP_BACK`) in teče. Napis ● POSNETEK DO SEM, ploščica »Dirka čaka na pavzi · krog x/y«, zelena oznaka ZDAJ na koncu časovnice, zelen gumb Nazaj v dirko namesto Končaj (tudi tipka I).
  - **Stanje avtov:** `rpKeep` pred ogledom shrani vse lastnosti vsakega posnetega avta (kopiji `q` in `ws`) in stanje varnostnega avta, `rpBack` jih vrne; `rl` (prevračanje), ki ga postavi posnetek, se odstrani. Test primerja 22 avtov po 22 lastnostih: vsi enaki, čas dirke enak.
  - **Nazaj v dirko** (`rpRace`): avti nazaj, prikaz dirke in gumbi nazaj, odštevanje 3 · 2 · 1 (`rpCd`, `cdStep` v glavni zanki na času igre, s piskom), nato `resume()`. Pavza med odštevanjem ga ustavi in odpre pavzo; I med odštevanjem spet odpre posnetek.
  - **Hitri vstop** (`quickRun`): HUD se osveži, preden se dirka ustavi (prej je kazal začetne vrednosti).
  - Prevodi v `js/lang.js`; testi `replay` (razširjen: Bathurst s hitrim vstopom), `ctrl` in `pad` (nova tipka), `lang`.
  - **Opomba:** začetek 10 s pred zdaj, prejšnji/naslednji avto zgoraj in ★ brez besede na ozkem zaslonu so moje odločitve; če uporabnik želi drugače, se popravi v naslednjem sklopu.

### Sklop 5 · Označevanje — 1,5–2 h · 29. 10.

- `js/napake.js`: platno za risanje čez posnetek, 6 barv, razveljavi, radirka, oblački ob krogih, zbirka trenutkov v pomnilniku.
- Postavitev ležeče in pokonci (od 360 × 640 oz. 640 × 360).
- **Testi:** nov `tests/browser/napake.test.mjs`; GitHub vse.
- **Preizkus:** obkroži z dvema barvama, piši v oblačka, razveljavi, premakni oblaček.
- **Narejeno:**
  - **`js/napake.js`** (modul `Napake`, samo slovensko, svoj DOM) in **`css/napake.css`**; igra mu da kljuke (`NK_HOOKS`, `rpInfo` v `js/game.js`).
  - **Označi** (pero ✎) je dvanajsti gumb posnetka, pred Foto. Ustavi posnetek; gumbi posnetka in zgornja vrstica se skrijejo, namesto njih sta **Dodaj k zbirki** in **Zapri**. Časovnica ostane vidna, med označevanjem se ne odziva (slika ostane ista).
  - **Paleta:** svinčnik (v trenutni barvi), 6 barv, razveljavi, radirka. Ležeče navpično ob levem robu (časovnica in gumba se umaknejo desno), pokonci vrstica nad časovnico. Od 360 × 640 oz. 640 × 360.
  - **Risanje:** črte s temnim robom (vidne tudi bela in rumena na svetli cesti), shranjene v deležih zaslona. Radirka zbriše celo črto, ki se je dotakne; razveljavi vrne tudi radirko.
  - **Oblački:** sklenjen krog (konec ob začetku ali čez njega) odpre oblaček v svoji barvi desno ob krogu (levo, če ni prostora; mimo palete in časovnice) s kazalcem v njem. Drugi krog iste barve gre v isti oblaček (oblaček zatrepeta). Odprta črta oblačka ne odpre. Oblaček se premakne za vrh. Ko krogov barve ni več (razveljavi, radirka), oblaček izgine, zapis ostane v pomnilniku in se vrne z njim.
  - **Zapri** z oznakami najprej vpraša (»Zavrzi oznake?«, drugi tap v 3 s).
  - **Dodaj k zbirki:** trenutek v pomnilniku (`Napake.zbirka`: čas, krog sledenega avta, metri od štarta `s`, slika 1280 px brez oznak, črte, zapisi po barvah s položajem oblačka) in **zastavica s številko** na časovnici; tap nanjo skoči na trenutek. Zbirka velja za en posnetek (ostane tudi po Nazaj v dirko in ponovnem Posnetku do sem); nova dirka začne novo. Sklop 6 iz nje sestavi sliko.
  - **Tipke:** tipkanje v oblaček ne sproži tipk igre; I med označevanjem ne naredi nič (oznake se ne izgubijo).
  - **Gumbi posnetka:** pod 960 px ★ in Označi brez besede, pod 820 px tesneje, pokonci pisava 13 px. Pisava na GitHubu nariše vrsto okoli 6–10 % širše kot lokalno (prvi tek: ležeče 587 od 616 px, pokonci 326 od 336 px); test zahteva vsaj dvajsetino rezerve.
  - **Testi:** nov `tests/browser/napake.test.mjs` (20 preverjanj), `replay` (12 gumbov, rezerva v vrsti).
  - **Opomba (moje odločitve):** zastavice zbirke so zaenkrat ločene od `recd.flags` (zastavice med dirko, sklop 7); Zastavice (n) jih še ne šteje. Slika trenutka je shranjena brez oznak (oznake so vektorske, sklop 6 jih nariše v svoji velikosti).

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
- **Gradi na obstoječem števcu sličic** (main, PR #164): naslov `?fps` vklopi `PH` v `js/game.js` (iskanje: `grep -n "the frame counter" js/game.js`). Okvirček zgoraj levo pod podatkom o krogu kaže sličice na sekundo, najpočasnejšo sličico zadnje sekunde ter povprečni čas korakov dirke (`PH.s`) in risanja (`PH.r`, `Render.frame`); osvežuje se enkrat na sekundo (`PH.tick` v glavni zanki). Prikaz s tipko O naj uporabi isti `PH` (vklop tudi s tipko, ne samo z naslovom) in mu doda vrstice; meritev zatikanj za dnevnik (pod 20 sličic/s več kot 1 s) naj bere iste čase sličic. Fizika velikih polj ima svoj nivo podrobnosti (`LOD` in `Race._lodPlan` v `js/core.js`, samo nad 30 avti, npr. Nürburg s 100 avti): prikaz naj pove, ali je vklopljen.
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
