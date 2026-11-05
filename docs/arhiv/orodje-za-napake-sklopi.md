# Orodje za napake · opisi končanih sklopov (arhiv)

Prestavljeno iz `docs/orodje-za-napake.md` 3. 11. 2026 (varčevanje z žetoni, `docs/varcevanje.md`): vsi ti sklopi so končani. Stanje, odločitve, zasnova in odložena sklopa 0 in 8 ostanejo v načrtu.

## Pospešitev

**Pospešitev (27. 10. 2026, uporabnik: »Oboje«):** sklopi se združijo in delno tečejo hkrati.

- **Veriga orodja** (sklop za sklopom, ker vsi urejajo `js/napake.js` in posnetek v `js/game.js`): 5 → **6+7** → **9+10+11** → **12**. Združeni sklopi so ena seja, ena veja (`orodje-za-napake/sklop-06-07-<ime>`, `…/sklop-09-10-11-<ime>`) in en pull request. Ko je korak na `main`, seja zažene sejo za naslednji korak verige z navodilom »Naredi sklope 6 in 7 po docs/orodje-za-napake.md« (oz. »sklope 9, 10 in 11«, »sklop 12«). Po sklopu 12 se veriga konča.
- **Vzporedno**, vsak v svoji seji in veji, takoj: **14+15** (orodja za posnetke zaslona in delovni tok), **16** (ponovljive dirke), **17** (razdeljen `world.js`, lahko več pull requestov). Te seje po koncu ne zaženejo nove seje.
- **13** (seznam napak) naredi glavna seja kot zasebno spletno stran; ni v repozitoriju.
- **Pred združitvijo v `main`** vsaka seja vanjo združi svežo `main` in še enkrat lokalno požene teste, povezane s spremembo. Spori so najverjetnejši v `index.html`, `sw.js`, `tools/stamp.js`, `docs/kazalo.md` in v tej tabeli: obdrži spremembe obeh strani (v `index.html` brez žigov, glej `CLAUDE.md`, Postopek). Če sklop 16 spremeni reference (`golden`, `races`), jih ustvari znova z orodji repozitorija; sklop 17 pa ne sme spremeniti sveta (reference ostanejo enake kot na `main`).
- **GitHub** požene največ okoli 20 opravil hkrati, en pull request jih ima 6, zato lahko testi pri več hkratnih pull requestih nekaj časa čakajo v vrsti.

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
- Prevodi novih gumbov v `js/lang.js`, `node tools/stamp.js --check`.
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
- **Narejeno** (skupaj s sklopom 7, ena veja in en pull request):
  - **Slike gibanja:** Dodaj k zbirki posname še tri slike posnetka (−0,6, −0,3 in +0,3 s; 400 px) prek `rpShotAt` (posnetek se postavi na tisti čas, `Render.snapshot`, nato nazaj); 0 s je slika trenutka. Trenutek ima tudi x, z sledenega avta (zemljevid).
  - **Zbirna slika** (`sestavi`, `list`): do 3 trenutki na sliko; ležeče mreža 2 × 2 (en trenutek: trenutek in polje v vrsti; dva: polje čez celo širino spodaj; trije: polje v četrtem polju), pokonci trenutki drug ob drugem (en trenutek: polje desno), polje spodaj; pri več trenutkih več slik (`_1`, `_2`). Daljša stranica največ 1600 px (nastavitev 2400). Oznake in oblački so narisani v velikosti slike (oblaček zraste z besedilom). Polje B: proga, način/vreme, različica (žig `js/game.js`, ki ga objava doda s `tools/stamp.js`: `node tools/stamp.js --find <žig>` najde commit, žige pred 3. 11. 2026 tudi `git log -S 'game.js?v=<žig>' index.html`; lokalno brez žigov `lokalno`), naprava (model telefona iz `navigator.userAgentData`, npr. SM-A256B → Galaxy A25; brskalnik), zaslon, datum, število trenutkov in zastavic, zemljevid (črta proge, štart rdeč, trenutki oštevilčeni, neoznačene zastavice oranžne).
  - **Besedilo** kot v zasnovi; vsak zapis (barva) svoja vrstica `#n čas Kkrog s=…m barva »zapis«` (čas na tisočinko), trenutek brez zapisa `(brez zapisa)`, sledeni tekmec ` avto=<ime>`; neoznačene zastavice dirke `⚑n čas Kkrog s=…m (zastavica med dirko, ni označena)` (krog in metri iz posnetka, `rpWhere`). Naprava v prvi vrstici brez presledkov (`Galaxy-A25/Chrome-141`).
  - **Izbira** (`izbira`, `#nk-dlg`): predogled, na telefonu (dotik) Deli zdaj, Samo shrani sliko, Kopiraj besedilo; na računalniku najprej Kopiraj sliko (za vsako sliko svoj gumb), Deli zdaj le, če brskalnik zna deliti datoteke; kljukica Obdrži tudi v igri. Deli pošlje sliko(e) in besedilo; če deljenje ne gre, se slika shrani. Odpre jo gumb **Deli (n)** zgoraj desno v posnetku (v drugi vrsti, ob ◀ ⚑ ▶) ali konec posnetka po dirki (`replayEnd` → `Napake.konec`, glede na nastavitev Vprašaj / Deli / Shrani; ista zbirka po deljenju ali shranjevanju ne vpraša znova).
  - **Shranjene napake:** slika se naredi takoj po Dodaj k zbirki (`pripravi`, enkrat na različico zbirke) in shrani v IndexedDB (`rra-napake`, zadnjih 20) kot neposlano; Deli zdaj in Kopiraj sliko jo označita poslano; brez Obdrži tudi v igri se po dejanju izbriše.
  - **Nastavitve → Orodje za napake** (vrstica na koncu Nastavitev, v angleščini skrita, ker je orodje samo slovensko; svoj panel `#nk-set`, shranjeno v `tdgp-napake`): Orodje vklop/izklop (brez Označi, Deli, zastavic), Ob koncu posnetka, Zastavica med dirko, Velikost slike, Shranjene napake (sličica, ime, datum, neposlano/poslano, Deli, Shrani, Izbriši, Deli vse neposlane).
  - **Testi:** nov `tests/browser/napake-slika.test.mjs` (15 preverjanj).
  - **Opomba (moje odločitve):** trenutek zbirke, shranjen do 2 s po zastavici ali 1 s pred njo, nadomesti najbližjo zastavico dirke (ni dvakrat v Zastavicah in v besedilu); neoznačene zastavice dirke so samo v besedilu in na zemljevidu (brez slike). Kopiraj sliko šteje kot poslano, Samo shrani ne. Vrstica orodja v Nastavitvah je v angleščini skrita (`tests/browser/lang.test.mjs` ne dovoli slovenščine na angleških zaslonih).

### Sklop 7 · Zastavica med dirko — 1–1,5 h · 30. 10. · **različica 5 je cela**

- **Gumb in tipke:** gumb na zaslonu, tipka F, plošček; nova dejanja v Kontrolah (`KEY_DEF` v `js/input.js`), privzeto F.
- **Shranjevanje:** zastavice se shranijo z dirko in so na časovnici; način Zastavice deluje (skoki, ponavljanje).
- **Testi:** `ctrl`, `pad`, `replay`, `napake`; GitHub vse.
- **Preizkus:** 3 zastavice med dirko, nato Zastavice v posnetku; gumb ne moti vožnje na A25.
- **Narejeno** (skupaj s sklopom 6):
  - **Gumb** `#nk-fl`: okrogel, rumen, 44 px, levo od gumba za pavzo (ležeče levo od pavze ob zemljevidu, pokonci levo od pavze nad zemljevidom); s pavzo vred skrit (css `#btn-pause.off + #nk-fl`), zato ga ni v pavzi, posnetku in menijih; ni ga v dirki s prijateljem (`showScreen` → `Napake.dirka`). Odzove se ob dotiku (`pointerdown`, ne gre do kontrol na zaslonu).
  - **Tipka F** (`KEY_DEF.flag`, v Kontrolah »Zastavica (napaka)«, angleško »Flag (a bug)«) in **Select / Back** na ploščku (fiksno, `padFrame`). Zastavica samo med vožnjo (zaslon brez menija, dirka teče ali je končana).
  - **Ob zastavici:** `recd.flags.push({ t })`, obvestilo »⚑ Zastavica N · 00:41.3 – dirka teče naprej« (1,8 s), gumb kratko utripne; nič drugega (nobene slike med dirko).
  - **Posnetek:** zastavice dirke so oranžne ⚑ na časovnici (tap skoči tja); **Zastavice (n)** šteje zastavice dirke in trenutke zbirke. Način Zastavice (`rpZGo`): začne pri prvi zastavici od trenutnega časa naprej, predvaja od 2 s pred njo do 1 s po njej in znova (`replayFrame`); ◀ ⚑ 2/3 ▶ zgoraj desno (`#rp-fnav` v `index.html`, prevoda Prejšnja / Naslednja zastavica). Cel posnetek, časovnica, na začetek in ±5 s vrnejo cel posnetek; sličica naprej/nazaj ostane v načinu Zastavice (posnetek stoji).
  - **Testi:** nov `tests/browser/napake-zastavice.test.mjs` (15 preverjanj), `ctrl` in `pad` (nova tipka F na seznamu dejanj).
  - **Opomba:** lokalno `pad.test.mjs` pade v treh preverjanjih menijev tudi na `main` (okolje tu); preverjanje tipk (z novo F) je zeleno.

### Sklop 9 · Dnevnik napak, prikaz za razvijalca — 1,5–2 h · 31. 10.

- **Dnevnik napak:** `window.onerror`, `unhandledrejection`, zatikanja (pod 20 sličic/s več kot 1 s). Hrani zadnjih 50 zapisov; priloži se poročilu.
- **Prikaz s tipko O** (in v Nastavitvah orodja): FPS, klici risanja in oglišča (`renderer.info`), `s` v metrih, krog, tema, nivo podrobnosti (LOD).
- **Gradi na obstoječem števcu sličic** (main, PR #164): naslov `?fps` vklopi `PH` v `js/game.js` (iskanje: `grep -n "the frame counter" js/game.js`). Okvirček zgoraj levo pod podatkom o krogu kaže sličice na sekundo, najpočasnejšo sličico zadnje sekunde ter povprečni čas korakov dirke (`PH.s`) in risanja (`PH.r`, `Render.frame`); osvežuje se enkrat na sekundo (`PH.tick` v glavni zanki). Prikaz s tipko O naj uporabi isti `PH` (vklop tudi s tipko, ne samo z naslovom) in mu doda vrstice; meritev zatikanj za dnevnik (pod 20 sličic/s več kot 1 s) naj bere iste čase sličic. Fizika velikih polj ima svoj nivo podrobnosti (`LOD` in `Race._lodPlan` v `js/core.js`, samo nad 30 avti, npr. Nürburg s 100 avti): prikaz naj pove, ali je vklopljen.
- **Testi:** `napake.test.mjs`; GitHub vse.
- **Preizkus:** prikaz na A25 med dirko na pravi progi (npr. Bathurst, Spa).
- **Narejeno** (skupaj s sklopoma 10 in 11, ena veja in en pull request):
  - **Dnevnik napak** (`D`, `zapis`): napake strani (`window` `error`: sporočilo, datoteka:vrstica:stolpec brez `?v=`), zavrnjene obljube (`unhandledrejection`) in zatikanja (`okvir`: sličice več kot 50 ms narazen več kot 1 s; samo med vožnjo dirke, ne v pavzi, posnetku, menijih in ko je stran skrita). Vsak zapis ima čas dirke, progo, krog in `s`, če je bil v dirki. Isto sporočilo zapored se samo šteje (×n). Zadnjih 50 ostane v igri (`tdgp-napake-dnevnik`), da so po sesutju še tam ob naslednjem obisku.
  - **V poročilu** vrstice `D …` (ta dirka in napake tega obiska zunaj dirk), npr. `D 00:25.0 K1 s=863m zatik 2,6 s · 3,4 sličic/s · najdaljša 633 ms`, `D 00:12.3 K1 s=230m napaka »TypeError: …« js/render.js:123:45 (×3)`.
  - **Nastavitve orodja:** Prikaz za razvijalca (Vklop / Izklop) in Dnevnik napak (vsi zapisi, najnovejši zgoraj; Kopiraj, Počisti).
  - **Prikaz za razvijalca** (tipka **O** v Kontrolah, `KEY_DEF.dev`; ali v nastavitvah orodja; shranjen kot `dev`): isti števec sličic `PH` kot `?fps` (sličice/s, najpočasnejša sličica, koraki, risanje) in vrstice `phMore`: klici risanja in oglišča na sličico (`renderer.info` vseh prehodov sličice; oglišča = 3 na trikotnik), `s` in krog (v posnetku sledenega avta), tema in podrobnosti (NIZKA / SREDNJA / VISOKA, samodejno), fizika LOD (vklopljen ali ne) in število avtov.
  - **Opomba (moje odločitve):** O deluje samo, ko je orodje vklopljeno. Zatikanje šteje sličice, ki jih igra res nariše (z varčevanjem baterije 30 na sekundo, kar je nad mejo). Na počasnem stroju (testi) je zatikanje skoraj ves čas: test `napake-slika` zato vrstic `D` ne šteje.

### Sklop 10 · G · V krogu — 1,5–2,5 h · 31. 10.

- **Kaj je obkroženo:** ob shranjevanju igra izračuna, kaj je v krogu (projekcija na zaslon, točka v mnogokotniku):
  - avti (`tekmec#n`, `ti`),
  - odsek ceste (`cesta:i0-i1`),
  - podrti predmeti (`out.props` iz `World.build`),
  - posebnosti proge, kjer jih ima `def`.
- **Imena** so tista iz kode, da se jih najde z grepom; razlaga imen je v `docs/kazalo.md`.
- **Testi:** `napake.test.mjs`; GitHub vse.
- **Preizkus:** obkroži tekmeca in tablo, preveri besedilo.
- **Narejeno:**
  - **Dodaj k zbirki** za vsako barvo izračuna, kaj je v njenih krogih (`rpInLoops` v `js/game.js`, pred slikami, s kamero, kot je na zaslonu): avti (`ti`, `tekmec#n` = `race.cars[n]`, `varnostni_avto`; sredina ali dva vogala avta), podrti predmeti (`predmet:<kind>#j` = `race.props[j]`, največ 8, nato `+n predmetov`), poimenovani kraji (`kraj:<ime>` iz `def.names`), boksi (`boksi`, `def.pit`) in odseki ceste (`cesta:i0-i1`: vzorci proge `track.px[i]`, sredina ali rob v krogu, do 700 m od kamere).
  - **Besedilo:** vsaka vrstica zapisa ima na koncu `v_krogu=[tekmec#9, cesta:463-468]` (prazen krog `v_krogu=[]`). Razlaga imen je v `docs/kazalo.md` (»Imena v poročilih o napakah«).
  - **Opomba:** table ob progi niso podrti predmeti in nimajo imena; v krogu je cesta pod njimi ali ob njih. Predmeti so tam, kjer so ob koncu posnetka (posnetek jih ne hrani).

### Sklop 11 · D · Samodejne zastavice — 1–1,5 h · 1. 11.

- **Iz posnetka** (`R.frames`, 20-krat na sekundo):
  - avto obtičal več kot 5 s,
  - preskok (več metrov v eni sličici),
  - poskok skozi tla ali pod tla,
  - tekmec stoji ali vozi v napačno smer.
- **Iz dnevnika:** zatikanje.
- **V posnetku:** sive zastavice s klicajem, Potrdi / Zavrzi.
- **Testi:** `napake.test.mjs` (umetno sestavljen posnetek); GitHub vse.
- **Narejeno:**
  - **Posnetek** ima v bitih avta še 2 (postavljen nazaj na cesto od prejšnje sličice: `Race.putBack` (`race.putT`) v `Race.rescue`, montaža koles ob cesti in šola vožnje) in 4 (ne dirka: boksi, cilj, odstop).
  - **`zaznaj`** pregleda sličice posnetka (meje `AZ`): avto stoji več kot 5 s, potem ko je že vozil (`obtical`; ne v boksih, po cilju ali odstopu); preskok v eni sličici za več, kot ga nese hitrost, in 2,5 m (`preskok`; ne ob postavitvi nazaj); navpično več kot 2,5 m v eni sličici (`poskok`); več kot 1 m pod cesto na cesti vsaj 0,2 s (`pod_cesto`; nagnjeni ovinki upoštevani); tekmec v napačno smer hitreje od 3 m/s več kot 2 s (`nazaj`). Ista vrsta istega avta v 10 s je ena zastavica, največ 40. Iz dnevnika: zatikanja te dirke (`zatik`).
  - **Kdaj:** samo v posnetku (po dirki ali Posnetek do sem), po kosih po 6 ms, med dirko nič; Posnetek do sem nadaljuje, kjer je ostal.
  - **V posnetku:** sive zastavice s klicajem na časovnici (`.nk-auto`, ločeno od `recd.flags` in zbirke); tap skoči tja in nad časovnico pokaže, kaj je (npr. »! Avto stoji · 00:41.3 · tekmec#5 (ime) · stoji 6,2 s«), s **Potrdi** in **Zavrzi**. Potrjena je bela, šteje v Zastavice (n), način Zastavice jo predvaja in je v poročilu: `!1 00:41.300 K2 s=1284m obtical tekmec#5 »stoji 6,2 s« (samodejna zastavica)` ter siva na zemljevidu slike. Zavržena izgine. Nepotrjene niso v poročilu.
  - **Testi:** nov `tests/browser/napake-samodejno.test.mjs` (sklopi 9, 10, 11: prikaz O, dnevnik, zatikanje iz danih časov sličic, v krogu, `zaznaj` na umetnem posnetku na pravi progi, tudi v dveh kosih, Potrdi / Zavrzi, poročilo, nastavitve), `napake-slika` (`v_krogu`, vrstice `D`), `ctrl` in `pad` (nova tipka O).

### Sklop 12 · E · Datoteka s posnetkom — 1,5–2 h · 1. 11.

- **Zapis:** posnetek (`recd`: avti, `frames`, dogodki) v datoteko `posnetek_<proga>_<datum>.rrp`: glava JSON (proga, način, žig, naprava) in sličice Float32, stisnjeno z `CompressionStream` (gzip). Okoli 1–1,5 MB za 3 min.
- **Odpiranje:** Nastavitve orodja → Odpri posnetek; za Clauda prek `tools/` in Playwrighta.
- **Testi:** zapis in branje dasta enak posnetek; GitHub vse.
- **Narejeno:**
  - **Datoteka** `posnetek_<proga>_<LLLLMMDD-UUMM>.rrp` (`js/napake.js`: `rrpPisi`, `rrpPack`): gzip (`CompressionStream`) iz `RRP1`, dolžine glave, glave JSON in vzorcev. Glava (`rrpOf` v `js/game.js`): različica, proga, način, vreme, krogi, letni čas in čas dneva, avti (model, ime, barva, številka, štartno mesto, igralec, krogi za `rpLap`, cilj), vrstni red na cilju, dogodki za Najboljše trenutke (`ev`), zastavice dirke (`flags`), naprava, datum in dnevnik te dirke (`dn`). Vzorci so `recd.frames` z vsemi biti avta (zavira, postavljen nazaj, ne dirka, prevračanje), zato `zaznaj` deluje tudi na odprtem posnetku.
  - **Velikost:** vzorci po številkah (vsi časi, nato x prvega avta v vseh vzorcih …), vsaka številka kot druga razlika bitov od prejšnjih dveh (zigzag) v 4 ravninah bajtov; prebrani so enaki do zadnjega bita. Bathurst, 22 avtov: 25 s je 130 KB (surovo 292 KB), 3 min okoli 1 MB.
  - **Shrani:** Nastavitve → Orodje za napake → Posnetek dirke → **Shrani** (siv brez posnetka) in v izbiri zbirke **Shrani posnetek (.rrp)**; datoteka gre v Prenose (obvestilo pove ime, velikost in kje je).
  - **Odpri:** Nastavitve orodja → Posnetek dirke → **Odpri …** (izbira datoteke; med dirko drugi tap v 3 s, ker se dirka konča). Igra naloži progo, postavi dirko s temi avti (`rrpOpen`; se ne stopa) in predvaja posnetek: Označi, zastavice, Deli, samodejne zastavice in dnevnik kot po dirki. Poročilo ima napravo iz datoteke in na koncu prve vrstice `posnetek=<ime>`. **Končaj** ponudi zbirko (kot po dirki) in vrne naslovnico. Datoteka iz druge različice igre se odpre z obvestilom (svet je lahko malo drugačen); ne-posnetek ali poškodovana datoteka pove zakaj.
  - **Za Clauda:** `node tools/posnetek.mjs <datoteka> [--t 41.3,00:52.1] [--zastavice] [--avto ti|<k>] [--kamera chase|tv] [--pokonci] [--lezece]` (Playwright) izpiše glavo, zastavice dirke, samodejne zastavice s krogom in `s`, dnevnik in besedilo poročila ter naredi slike posnetka; v `test-results/posnetki/<ime>/` (`povzetek.txt`, `povzetek.json`). Opis v `tests/README.md`, pravilo v `CLAUDE.md`.
  - **Testi:** nov `tests/browser/napake-posnetek.test.mjs` (10 preverjanj), `napake-slika` (nov gumb v izbiri).
  - **Opomba (moje odločitve):** trenutki zbirke (slike, oznake) niso v datoteki, samo zastavice dirke; na odprtem posnetku se označijo znova. Promet in policija odprte ceste nista posneta (samo avti dirke).

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
- **Narejeno:**
  - **Testni način** je hitri vstop (`?proga=…`): vklopi se za ves obisk. Seme dirke je `seme=<n>` iz naslova (celo število od 1, privzeto 1; `Core.quickArgs` → `q.seed`). Isti naslov dvakrat da isto dirko in enak posnetek; tudi ponovni začetek dirke v istem obisku je ista dirka.
  - **Jedro** (`js/core.js`): vseh 15 `Math.random` je zdaj `rand()`, številke dirke, ki se stopa (`Race.rnd`; `RAND` nastavita `Race.step` in `aiControl` in ga po koncu vrneta). Z `opts.repro` je `Race.rnd` tok iz `opts.seed`, brez njega `Math.random` kot doslej, zato se zunaj testnega načina igra in reference (`golden`, `races`) ne spremenijo.
  - **Igra** (`js/game.js`, `repro`, `grand`): v testnem načinu so iz semena še vreme, ki ga nastavitve prepustijo naključju (naključno, menljivo), megla na Big Suru in čakanje luči pred štartom, iz toka, ki je nov za vsako dirko (`newRace`); kvalifikacije in njihove simulacije tekmecev imajo isto seme. Ne v dirki s prijateljem. Vizualni učinki, komentar, radio in zvok ostanejo naključni.
  - **Za teste:** `window.__game.repro` (seme, ali je dirka ponovljiva), `window.__game.recSum()` (povzetek posnetka). Node: `repro: true` v nastavitvah `Core.Race`.
  - **Testi:** nov `tests/repro.test.js` (Bathurst s trčenjem: z `repro` nobenega klica `Math.random`, isto seme da isto dirko do zadnjega bita, drugo seme drugo), nov `tests/browser/repro.test.mjs` (dvakrat `?seme=5` enak posnetek in isti avti, `?seme=6` druga dirka), `quick.test.js` (`seme`). `golden` in `races` brez novih referenc.

### Sklop 18 · Zgodovina napak — 1–1,5 h · 29. 10. 2026

- **Naročilo uporabnika** (29. 10. 2026, glavna seja): »v urejevalniku ko shranim popravek ne morem kasneje gledati za nazaj stare popravke, naredi da imaš še zgodovino starih popravkov, pri katerih tudi piše status«. Veja `orodje-za-napake/sklop-18-zgodovina`, en pull request.
- **Prej:** zapis v IndexedDB (zadnjih 20), stanje samo neposlano/poslano; po deljenju se je brez »Obdrži tudi v igri« izbrisal; seznam samo v Nastavitvah orodja.
- **Narejeno:**
  - **Zgodovina napak** (`zgodovina`, `#nk-zg`): gumb **Zgodovina** v vrstici označevanja (Dodaj k zbirki · Zgodovina · Zapri; vrstica gumbov posnetka ostane, kot je), v izbiri ob Zapri in v Nastavitvah orodja (vrstica Zgodovina napak: Deli vse neposlane, Odpri; seznam pod njo). Panel je nad posnetkom, izbiro in nastavitvami; Zapri vrne tja, od koder je bil odprt.
  - **Seznam:** pri vsaki zbirki mala slika, proga (»Bathurst, Avstralija«), datum, število trenutkov in zastavic, stanje z barvo (Neposlano oranžno, Poslano modro, Popravljeno zeleno, Zaprto sivo); najnovejša prva. Dotik odpre zapis: slika, stanje (4 gumbi, ročna sprememba), besedilo `RRA-NAPAKE`, Kopiraj sliko (računalnik), Deli, Shrani sliko, Kopiraj besedilo, Izbriši (dvakrat v 3 s).
  - **Stanje:** Neposlano ob nastanku in ob vsaki novi različici zbirke; Poslano samodejno ob Deli in Kopiraj sliko (samo iz Neposlano: Popravljeno in Zaprto ostaneta, tudi ko zapis znova deliš); Popravljeno in Zaprto ročno.
  - **Nič se ne izgubi:** deljenje ali shranjevanje zapisa ne izbriše. Kljukica v izbiri je zdaj **Obdrži tudi slike v igri**: brez nje zapis po dejanju ostane z malo sliko (320 px JPEG) in besedilom. Hrani se do **100** zbirk (`DB_MAX`); najnovejših **20** (`DB_FULL`) ima polne slike, starejšim se slike odstranijo (`lite`, `nf`: koliko slik je imela), najstarejše nad 100 gredo ven. Zapis brez slik deli in shrani malo sliko (`<ime>_mala.jpg`) z besedilom.
  - **Velikost:** mala slika in besedilo sta okoli 20–30 KB, 80 starejših zapisov okoli 2 MB; polne slike (20) kot doslej.
  - **Testi:** `tests/browser/napake.test.mjs` (Zgodovina v vrstici označevanja in v izbiri, zapis po Deli brez slik, ročno stanje, ponovno Deli, Kopiraj besedilo, pokonci in ležeče, meja 100/20), `napake-slika.test.mjs` (seznam v Nastavitvah: dotik, Izbriši).
  - **Opomba (moje odločitve):** Kopiraj besedilo stanja ne spremeni (kot doslej; poslano je, ko gre slika); ponovno deljenje iz zgodovine slik ne odstrani ne glede na kljukico. Gumb Zgodovina ni v vrstici gumbov posnetka (tam ni prostora), ampak v vrstici označevanja, ki se odpre z Označi.

### Sklop 19 · Zadnji posnetki — 1,5–2 h · 1. 11. 2026

- **Naročilo uporabnika** (1. 11. 2026): »sedaj ko želim javiti napake kliknem posnetek do sem in označi, vendar če zaprem jaz tega posnetka kasneje ne morem več urejati, naredi da si igra shrani zadnjih 10 posnetkov iger, ki so prišle do cilja, tako bom lahko urejal igre za nazaj več naenkrat«; nato: »po vsaki nedokončani igri, preden greš ven iz igre, naj te vpraša: želiš shraniti to igro za kasnejšo analizo? Da / Ne, privzeto je označen Ne«, »če uporabnik izbere Da, se tudi ta nedokončana igra shrani med zadnjih 10« in »če igro dokončaš, se že samodejno shrani med zadnjih 10«. Veja `claude/awesome-archimedes-0u5x7e`.
- **Prej:** posnetek dirke je bil samo v pomnilniku in ga po izhodu iz dirke ni bilo več (razen ročno shranjene datoteke `.rrp`); trenutki zbirke so ostali samo kot slika v Zgodovini napak.
- **Narejeno:**
  - **Shranjevanje** (`js/napake.js`, IndexedDB `rra-posnetki` / `posnetki`, zadnjih **10**, `PZ_MAX`): dirka, v kateri je igralčev avto prišel do cilja (`race.player.finished`, ne ulovljen od policije), se shrani sama ob rezultatih (`Napake.cilj` iz `finishRace`); prav tako posebna misija, ki se je končala z rezultatom (opravljena ali neuspela), in znova ob izhodu, če je medtem tekla naprej (`Napake.pusti` iz `toTitle` in `newRace`). Zapis ima datoteko `.rrp` (enako kot Shrani v nastavitvah orodja) in zbirko tega posnetka: trenutke z oznakami, zapisi in slikami (JPEG) ter potrjene in zavržene samodejne zastavice. Glava in vzorci se vzamejo takoj, pakiranje teče po kosih po ~8 ms in nikoli med vožnjo ali predvajanjem posnetka (`zaseden`); ko gre igra v ozadje, se dokonča takoj.
  - **Vprašanje ob izhodu** (`Napake.izhod`, `vprasaj`): Glavni meni, Ponovi dirko (tudi Ponovi krog in gumb za ponovitev vožnje na zaslonu v kronometru; ta najprej odpre pavzo), PONOVI IGRO, Šola vožnje in Lestvica prvenstva iz igre, ki ni prišla do cilja (tudi po odstopu in KONEC IGRE; misija sredi poteka): »Želiš shraniti to igro za kasnejšo analizo?« **Da** / **Ne**; označen in izbran je **Ne** (Enter ali A na ploščku vzame označenega, puščice ga premaknejo, Esc in B sta Ne; tipke igre, npr. P, med vprašanjem ne delujejo). Da: igra gre med zadnjih 10 kot Nedokončana. Brez vprašanja: igra pod 2 s posnetka (`RRP.min`), dirka s prijateljem, nova mapa, šola vožnje (nima posnetka), orodje izklopljeno, neposredni klici `onAction` (testi): vprašanje je samo na poti igralca (dotik gumba, plošček: `leaveAct` v `js/game.js`).
  - **Seznam Zadnji posnetki** (`zadnji`, `#nk-pz`; Nastavitve orodja → Zadnji posnetki (n/10) → Odpri, gumb Zadnji posnetki v Zgodovini napak): najnovejši prvi; slika (prvi trenutek zbirke ali slika proge iz menija), proga, datum, način, krogi, dolžina, mesto, število trenutkov, velikost, **Do cilja** (zeleno) ali **Nedokončana** (oranžno). **.rrp** prenese datoteko (za Clauda: `tools/posnetek.mjs`), **✕** izbriše (drugi dotik v 3 s).
  - **Odpiranje:** dotik odpre posnetek kot datoteko (`rrpOpen`) z njegovo zbirko: trenutki so spet na časovnici, Dodaj k zbirki nadaljuje številčenje, zapis v seznamu in v Zgodovini napak (isti `id`) se posodobi; stanje v Zgodovini ostane, dokler se zbirka ne spremeni. Končaj vrne seznam (izbira zbirke čez njim, če se je zbirka spremenila), da se odpre naslednji posnetek.
  - **Testi:** nov `tests/browser/napake-zadnji.test.mjs` (18 preverjanj); `wheels.test.mjs` na zaslonu KONEC IGRE po tapu na PONOVI IGRO preveri vprašanje in odgovori Ne.
  - **Opomba (moje odločitve):** »do cilja« pomeni, da je igralčev avto prečkal ciljno črto (dirka, kronometer, kvalifikacijski krog, izziv, pobeg policiji); odstop, KONEC IGRE in ulovljen od policije ob izhodu vprašajo. Posebna misija, ki se je končala z rezultatom, tudi neuspela, se shrani sama: njeni gumbi rezultata (Ponovi, Misije, Glavni meni) ne vprašajo, da testi misij drugih sej ostanejo, kot so. Kvalifikacijski krog je svoja igra s svojim posnetkom. Preskoči kvalifikacije ne vpraša (igra gre naprej z dirko). Posnetki iz datotek `.rrp` se v seznam ne dodajo.

### Sklop 17 · Razdeljen world.js — 3–5 h · 4.–5. 11.

- **Kaj:** graditelje prog (`buildSpa`, `buildRbring`, …) iz `js/world.js` (3,9 MB, 34.603 vrstic) premakni v `js/world-<tema>.js`.
- **Vzor:** obstoječi `World.ext[tema]` in `extAPI` (`js/world-montreal.js`, `world-toronto.js`, `world-townsville.js`).
- **Ob vsaki datoteki** posodobi oznake skript v `index.html`, `sw.js` in `tools/stamp.js`.
- **Po korakih:** nekaj prog na pull request. Svet mora ostati enak (`tests/browser/world.test.mjs`, `perf`, `golden` brez novih referenc).
- **Kazalo:** posodobi tabelo prog v `docs/kazalo.md`.

### Sklop 20 · Beležka v Označi, ročno Poslano — ~1,5 h · 1.–2. 11. 2026

- **Naročilo uporabnika** (1. 11. 2026, računalnik: Windows, Edge, 1920 × 1008): »spremeni v urejevalniku da je spodaj desno kjer sem oznacil vedno odprta belezka kjer pisem notri napake, predloge in vprasanja. naprimer ko uporabnik klikne uredi in se odpre to okno kjer oznacim napako nato se odpre okno, je okno ze spodaj odprto in mi ni treba z misko kliknit na belezko da po njej lahko pisem, ampak vse kar pisem na tipkovnico se tam vpisuje. da shranim sliko mi ni potrebno oznaciti nic na sliki, saj kasne stvari zajemajo cel ekran«. Veja `orodje-za-napake/belezka`.
- **Narejeno:**
  - **Beležka** (`#nk-note`): v Označi je spodaj desno nad sliko ves čas odprta (nad časovnico in ZDAJ, desno od palete), večja od oblačka (na 1920 × 1008 okoli 540 × 220 px, pisava 19 px; na telefonu 240 px široka, pisava 14 px). Oblački ostanejo nad njo; nov oblaček se postavi nad beležko, kjer je prostor.
  - **Tipkovnica:** na računalniku je kazalec v beležki takoj ob odprtju; po risanju in tapu na orodje se vrne vanjo (razen ko nov oblaček dobi svoj kazalec, kot doslej); črka, natipkana kjer koli med označevanjem, gre v beležko. Tipke igre (O, I, F …) med pisanjem ne delujejo, Escape umakne kazalec kot v oblačku. Na telefonu (dotik) se tipkovnica sama ne odpre: beležka je vidna, piše se po dotiku.
  - **Brez oznake:** trenutek se doda k zbirki in deli tudi samo s sliko in zapisom beležke. Zapri vpraša tudi, če je v beležki zapis (»Zavrzi zapis?«).
  - **Besedilo in slika:** zapis beležke je vrstica `#n čas Kkrog s=…m beležka »…«` pred vrsticami barv (brez `v_krogu`; vrstice zapisa z » / «, tudi v oblačkih, da je vsak zapis ena vrstica). Na sliki trenutka je beležka narisana ob desnem in spodnjem robu kot na zaslonu, visoka po zapisu (do 9 vrstic), s pisavo, berljivo tudi pri sliki z računalnika.
  - **Zgodovina napak, ročno Poslano** (želja uporabnika 2. 11.: »piše da so slike neposlane, vendar jaz sem jih tebi poslal«; zbirke je poslal s posnetkom zaslona, ne z Deli ali Kopiraj sliko): v zapisu se Poslano izbere ročno kot Popravljeno in Zaprto (4 gumbi stanja, namig v seznamu to zdaj pove); v seznamu je nov gumb **Označi vse kot poslane** (`vsePoslane`): prvi tap vpraša v gumbu (»Res? Neposlanih: N → Poslano«, rdeče), drugi tap v 3 s vse neposlane označi kot poslane (Popravljeno in Zaprto ostaneta); brez `confirm()`.
  - **Testi:** `tests/browser/napake.test.mjs` (beležka odprta in v fokusu, tipkanje brez klika, O in I sta črki, kazalec nazaj po barvi in črti, Escape in ponovno tipkanje, zapis v trenutku in besedilu; ročno Neposlano → Poslano v zapisu, Označi vse kot poslane: vprašanje, nato 99 Poslano, Zaprto ostane), `napake-slika.test.mjs` (četrti trenutek brez oznake, samo z beležko: besedilo in temna beležka na sliki; moder krog nad beležko).
  - **Opomba (moje odločitve):** beležka se ne premika in ne skrije (uporabnik jo je postavil spodaj desno), zato se krog ne more začeti na njej, lahko pa gre čez njo. Zapis je za en trenutek: ob naslednjem Označi je beležka prazna.

### Sklop 21 · Seznama posnetkov in napak: avto, čas, večja slika, odpiranje starih zapisov — ~2 h · 5. 11. 2026

- **Naročilo uporabnika** (5. 11. 2026, računalnik: Windows, Edge): »tukaj v zgodovini sem želel downloadati samo posnetke, ki so bili odpeljani do konca, vendar ne vem, kateri so to, niti ne morem klikniti starih in jih pogledati in po potrebi urejati, spremeni, da piše pri vsaki progi čas vožnje, če je uporabnik prišel do cilja, in ime avta, ter možnost, da klikneš na sliko za večjo sliko«. Veja `orodje-za-napake/sklop-21-seznama`, PR #307.
- **Prej:** Zgodovina napak (slike napak z besedilom) in Zadnji posnetki (posnetki dirk `.rrp`) sta si bila podobna in uporabnik je v prvi iskal posnetke; v nobenem seznamu ni bilo avta in časa; slike ni bilo mogoče povečati; zapis brez lastnosti `files` ni šel odpreti (ostalo je »Nalagam …«).
- **Narejeno** (`js/napake.js`, `css/napake.css`, v `js/game.js` kavelj `carName` in zastavica `bust` v glavi posnetka):
  - **Avto in čas:** vsak vnos v obeh seznamih ima pod imenom vrstico `AVTO · čas` (`avtoVrstica`): ime avta igralca, kot ga igra imenuje (`Core.heirOf`; model, ki ga igra ne pozna: brez imena), in če je prišel do cilja, njegov čas zeleno (`1:23.456`, kot ura v igri; dirka: čas cilja, kronometer: vožnja, kvalifikacije: krog), sicer »ni do cilja« sivo; do cilja z neznanim časom: »do cilja«. Ulovljen od policije ni »do cilja« (v glavi posnetka nova zastavica `bust`). Novi zapisi v Zgodovini napak hranijo `car`, `fin`, `time` (iz glave posnetka `igralecH`, `fin` še iz zapisa Zadnjih posnetkov, ker misija nima časa); novi zapisi Zadnjih posnetkov hranijo `car`, `time`.
  - **Starejši zapisi:** posnetek brez avta in časa ju dobi iz glave svoje datoteke (`rrpGlavaIz`: razpakira samo začetek, `pzIgralec`) in ju obdrži; zapis Zgodovine brez njiju ju dobi od svojega posnetka med Zadnjimi posnetki (`zb.id`, `igZapisa`) in ju obdrži (`dbSetMany`), če posnetka ni, ostane brez vrstice. Iskanje posnetka čaka največ 3 s (`pzZaZg`), seznam se nikoli ne zatakne.
  - **Do cilja na prvi pogled:** vnos do cilja ima zelen rob, zelen čas in značko Do cilja; glava Zadnjih posnetkov pove »Do cilja: k od n«, gumb **Samo do cilja** pusti samo te (filter velja do ponovnega nalaganja strani); v Nastavitvah orodja je pri Zadnjih posnetkih »(n/10) do cilja: k«.
  - **Kje so posnetki:** Nastavitve orodja in Zgodovina napak povesta, da so tu slike napak z besedilom in ne posnetki dirk, in imata povezavo **Zadnjih posnetkih**, ki odpre Zadnje posnetke (tam so .rrp za prenos). Zapis, katerega posnetek je še med njimi, ima v pogledu zapisa polje z gumboma **Odpri posnetek** (odpre ga kot Zadnji posnetki: označevanje in urejanje trenutkov) in **Shrani .rrp** (`pzPrenesi`); sicer piše, da posnetka ni (več) med zadnjimi.
  - **Večja slika** (`vec`, `#nk-big`): sličica v vsakem vnosu seznamov in slika v zapisu sta gumb (majhna lupa v kotu); dotik pokaže sliko čez celo okno (`object-fit: contain`, podpis s progo in datumom; v Zadnjih posnetkih še avto in čas), zapre jo dotik, Esc, Enter ali Zapri; med njo so vse tipke njene (igra in panel pod njo jih ne dobita), po zaprtju fokus nazaj v panel. Dotik besedila vnosa deluje kot prej. Poslušalec je na dokumentu v zajemni fazi (`init`), ker panela ustavljata klike.
  - **Pokonci (do 460 px):** v Zadnjih posnetkih je značka stanja pod besedilom, gumba `.rrp` in ✕ sta drug nad drugim (`grid`), sličica 64 × 44; prvi izris pri 360 px je imel besedilo široko ~60 px (ena beseda v vrstici), zdaj ~180 px. Test preveri besedilo vnosa ≥ 130 px in gumba ≥ 36 px (brez popravka pade).
  - **Odpiranje starih zapisov:** edini ponovljiv primer, ko se zapis ni odprl, je bil zapis brez lastnosti `files` (`r.files.length` je vrgel napako): zdaj `zgEna` preživi zapis brez `files`, brez `thumb`, z `files: []` (»mala slika«) in brez avta; slike gredo prek `burl`. Seznam in zapis po čakanju na podatke preverita, da je panel še tam (prej je pozni odgovor lahko preklical naslovno sliko odprtega zapisa).
  - **Testi:** nov `tests/browser/napake-seznami.test.mjs` (Bathurst, hitri vstop; miška in dotik na isti strani; avto in »ni do cilja« pri novem zapisu in posnetku, posnetki do cilja s časom, brez časa in starejši z glavo datoteke, pokvarjena datoteka; Samo do cilja in štetje; povezavi do Zadnjih posnetkov; večja slika (dotik, Esc, Zapri, panel ostane, vnos se ne odpre); 6 zapisov vseh oblik se odpre z miško in z dotikom, Odpri posnetek in Shrani .rrp; ležeče 640 × 360 in pokonci 360 × 640; `igralecH` in `cas`); `napake-zadnji.test.mjs` (avto in čas pri dirki in pri kvalifikacijskem krogu: čas je tisti, ki ga kažejo rezultati), `napake.test.mjs` (besedilo vnosa).
  - **Opomba (moje odločitve):** filter Samo do cilja se ne shrani v napravo (ostane do ponovnega nalaganja strani); zapis ima eno sliko v pogledu (prva stran poročila), ostale so pri Kopiraj sliko; Zgodovina napak ostane seznam slik, posnetkov v njej ni (uporabnik jih je iskal tam, zato povezava), ker bi sicer en posnetek imel dva vnosa.
