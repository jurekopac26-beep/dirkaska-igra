# Maketa novih nastavitev (pavza)

Samostojna, klikljiva maketa novega zaslona **Pavza / Nastavitve**. **Ni povezana z igro**: igra je ne naloži in nič v igri se ne spremeni. Ko bo predlog potrjen, bo zaslon prenesen v igro (`index.html`, `js/game.js`, `css/style.css`, `js/lang.js`).

Klikljiva maketa je objavljena kot zasebna stran: <https://claude.ai/artifact/PpQAwpzzwCapqsws9EiRTi> (na računalniku je telefon v okvirju, zgoraj so stikala za videz *A, B, C*, *Telefon pokonci / ležeče*, *Med dirko / Iz glavnega menija* sliko *Animacija · 1 Posnetek · 2 Primerjava · 3 V živo*, *Telefon: Brez · 1 · 2 · 3*, *Upravljanje: Slika · 1 · 2 · 3* in *Ležeče spodaj: 1 · 2 · 3*; na telefonu je zaslon čez cel ekran in sledi legi telefona).

**Zadnji predlog: Upravljanje kot pravi video iz igre, v treh različicah.** Nad Upravljanjem ni več slika, ampak video iz prave dirke (Riviera, Francija: 4 s skozi esko, v zanki; avtopilot vozi), posnet z vsakim upravljanjem posebej: pri Tipkah se prižigata puščici, pri Volanu se obrača volan, pri Nagibu se nagiba kazalec, pritiskata se plin in zavora. Slike so v `slike/upravljanje-video/`: levo telefon pri 0,4 s videa, desno za Tipke, Volan in Nagib slika ob štirih trenutkih videa (0,4 s desno in plin, 1,4 s zavora, 3,0 s levo in zavora, 3,6 s levo in plin), spodaj ležeče.

| Slika | Različica |
| --- | --- |
| `1-video-v-telefonu.png` | **1 · Video v telefonu**: video v telefonu; pri Nagibu se telefon sam nagiba v smer zavoja. |
| `2-video-v-roki.png` | **2 · Video v roki**: telefon v dveh rokah; palca se premikata z videom (levi pritiska puščici ali vrti volan, desni plin in zavoro), pri Nagibu roki nagibata telefon. |
| `3-tri-telefoni.png` | **3 · Tri telefoni hkrati**: Tipke, Volan in Nagib v treh telefonih na istem trenutku dirke; izbrani je večji in zlato obrobljen, tapneš telefon in ga izbereš. |

Ko izbereš drugo upravljanje, pride njegov video na istem trenutku dirke. V maketi različico izbereš s stikalom *Upravljanje: Slika · 1 · 2 · 3* nad telefonom (računalnik), z gumbi U1, U2, U3 v kotu (telefon; ponovni tap izklopi), z `?uv=0|1|2|3` ali s `#a1-1-1-2` na koncu povezave (videz, slika, ležeče spodaj, telefon, upravljanje).

Kako je video narejen (`orodja/`): `video.mjs` začne isto dirko kot `posnetki.mjs` (naključna števila s semenom), jo brez risanja zavrti do 56,2 s, nato poganja igrino zanko sam, točno 30 sličic na sekundo (avtopilot vozi). Pri vsaki sličici vzame 3D, kot ga igra nariše, in HUD trikrat, z vsakim upravljanjem, ki se uporablja tako, kot avtopilot vozi. `video.py` sličice sestavi v videe (H.264 MP4 za telefone, Safari in Chrome; VP9 WebM za ostale; 432 točk na krajši strani), sliko za začetek in `posnetki/video.js` (kako se volan, plin, zavora in puščice premikajo po sličicah, kje so kontrole na zaslonu), s katerim maketa premika telefon in palca.

```
node maketa-nastavitev/orodja/video.mjs port 56.2 4 30
node maketa-nastavitev/orodja/video.mjs land 56.2 4 30
python3 maketa-nastavitev/orodja/video.py riviera
```

Objavljena maketa je zdaj stran z datotekami ob njej (slike iz igre in videi v `posnetki/`); videe naloži v celoti in jih predvaja iz pomnilnika.

**Predlog pred tem: A1 (videz A, slika 1 Posnetek), slike nad nastavitvami v telefonu, v treh različicah.** Prava slika iz igre ni več samo izrez, ampak je v telefonu (maketa telefona v slogu risb: temno ohišje, svetel rob, luknja za kamero na krajši strani). Slike so v `slike/telefon/` (vsaka: pokonci kar odpre pavza, del Grafika, Kakovost slike; ležeče Upravljanje in Kamera):

| Slika | Različica |
| --- | --- |
| `1-cel-telefon.png` | **1 · Cel telefon**: cel telefon z vsem zaslonom igre (kontrole, HUD, avto), na zamegljeni dirki za njim; pokonci je telefon pokonci, ležeče leži. Slika je nekoliko višja. |
| `2-od-blizu.png` | **2 · Telefon od blizu**: velik telefon, viden je samo del, ki je pri nastavitvi pomemben (spodaj kontrole, avto, cesta pred njim), ob strani rob in vogali telefona. Slika ostane skoraj tako nizka kot zdaj. |
| `3-v-roki.png` | **3 · Telefon v roki**: cel telefon v dveh rokah. Pri Upravljanju sta palca na pravih kontrolah izbrane možnosti (Tipke: puščica, Volan: volan, Nagib: zavora; plin desno), pri Nagibu se telefon nagne; pri drugih nastavitvah palca telefon samo držita. |

V maketi različico izbereš s stikalom *Telefon: Brez · 1 · 2 · 3* nad telefonom (računalnik), z gumbi T1, T2, T3 v kotu (telefon; ponovni tap izklopi), z `?ph=0|1|2|3` ali s `#a1-1-3` na koncu povezave (videz, slika, ležeče spodaj, telefon).

**Predlog pred tem: ležeče so gumbi pavze spodaj, kot pokonci, in večji, v treh različicah.** Ponovi dirko, Foto, Ogled vozila, Celoten zaslon, Odstopi in Glavni meni niso več majhne ikone ob naslovu, ampak v vrstici spodaj. Slike so v `slike/lezece-spodaj/` (vsaka: pokonci za primerjavo, ležeče kar odpre pavza in del Grafika):

| Slika | Različica |
| --- | --- |
| `1-polna-imena.png` | **1 · Polna imena**: vrstica čez celo širino, vsak gumb z ikono in celim imenom; vrstica je nizka, za nastavitve ostane največ prostora. Nadaljuj zgoraj desno. |
| `2-velike-tipke.png` | **2 · Velike tipke**: kot pokonci (ikona nad imenom), a širše in višje, z večjo ikono; najlažje jih zadeneš. Nadaljuj zgoraj desno. |
| `3-nadaljuj-spodaj.png` | **3 · Nadaljuj spodaj**: tipke spodaj, desno ob njih velik zlat Nadaljuj, pod desnim palcem; zgoraj samo naslov in zavihki (širši). |

V maketi različico izbereš s stikalom *Ležeče spodaj: 1 · 2 · 3* nad telefonom (računalnik), z gumbi S1, S2, S3 v kotu na ležečem telefonu, z `?lb=1|2|3` ali s `#a1-2` na koncu povezave (videz, slika, ležeče spodaj). Iz glavnega menija gumbov pavze ni, zato tudi vrstice spodaj ni.

**Predlog pred tem: prave slike iz igre namesto animacij, v treh različicah.** Slike nad nastavitvami niso več risane: so iz prave igre (pravi avto, prava proga, pravi HUD; tu Riviera, Francija). Vse tri so v videzu A (Ploščice), slike so v `slike/posnetki/` (vsaka: pokonci kar odpre pavza, del Grafika, Kakovost slike; ležeče oba dela):

| Slika | Različica |
| --- | --- |
| `1-posnetek.png` | **1 · Posnetek iz igre**: nad vsako nastavitvijo teče kratek posnetek iz dirke z izbrano možnostjo; ko izbereš drugo, njen posnetek pripelje s strani gumba, ki si ga tapnil. Spodaj sličice, kako posnetek teče. |
| `2-primerjava.png` | **2 · Vse možnosti hkrati**: ista sekunda dirke, narisana z vsako možnostjo, druga ob drugi (Tipke, Volan, Nagib; Blizu, Srednje, Daleč; Retro, Normalno, Visoko …); izbrana je širša in svetla, tapneš sliko ali gumb. |
| `3-v-zivo.png` | **3 · Tvoja dirka v živo**: eno okno zgoraj (ležeče levo) s tvojo dirko, kjer si jo ustavil; kar spremeniš ali tapneš, se pokaže v oknu (kamera, Retro …). Kartice so brez slik, zato je na zaslonu več nastavitev. |

- Nastavitve, ki se jih na sliki ne vidi (zvok, občutljivost nagiba, jezik, ime …), pokažejo dirko z majhnim znakom: ikona in izbrana možnost.
- Slike kažejo tvoje upravljanje: ko izbereš Tipke, Volan ali Nagib, so na vseh slikah te kontrole.
- V maketi sliko izbereš s stikalom *Animacija · 1 Posnetek · 2 Primerjava · 3 V živo* nad telefonom (računalnik), z gumbi 1, 2, 3 v kotu (telefon), z `?media=video|compare|live|anim` ali s `#a1` … `#a3` na koncu povezave (črka je videz, številka slika).

Kako so slike narejene (`orodja/`): `posnetki.mjs` odpre igro v brskalniku (Playwright, kot brskalniški testi), začne dirko na Rivieri (vedno isto: naključna števila s semenom), avtopilot vozi 18 s, igra se ustavi. Nato vsako možnost vsake nastavitve, ki jo igra nariše drugače (Upravljanje, Kamera, Oddaljenost, Položaj avta, Grafika, Sence, Idealna linija, Časovna tabela, Samodejni plin), nariše v isti sekundi: 3D s fotografijo igre same (`Render.snapshot`, kot gumb Foto; Retro in Normalno v ločljivosti, v kateri ju igra res riše), HUD pa posebej, prozoren. Za konec še nekaj sličic dirke, ki teče. `sestavi.py` 3D in HUD sestavi v `posnetki/<port|land>/` in `posnetki/real.js` (kje je naš avto na vsaki sliki, za izreze).

```
node maketa-nastavitev/orodja/posnetki.mjs port riviera 18
node maketa-nastavitev/orodja/posnetki.mjs land riviera 18
python3 maketa-nastavitev/orodja/sestavi.py riviera
```

**Predlog pred tem: izbrani način 3 (en dolg seznam) v treh videzih.** Vsi trije imajo enak zaslon: zgoraj tri ploščice Igra, Grafika in Zvok, pod njimi vse nastavitve v enem seznamu (zavihek skoči na svoj del, med drsenjem zasveti sam), gumbi pavze spodaj. Nastavitve in njihov vrstni red so v vseh treh enaki. Videzi so v `settings-data.js` (`versions`), slike v `slike/videz/` (vsaka: pokonci in ležeče, prvi zaslon po pavzi in del Grafika):

| Slika | Videz |
| --- | --- |
| `A-ploscice.png` | **A · Ploščice**: tako kot na izbrani sliki. Nadaljuj zgoraj desno, gumbi pavze v vrstici spodaj (ležeče ob naslovu), vsak del z velikim naslovom in zlato črto. |
| `B-pod-palcem.png` | **B · Pod palcem**: Nadaljuj je velik okrogel gumb na sredini spodnje vrstice, gumbi pavze levo in desno od njega; zgoraj je samo ena vrstica (naslov in zavihki), zato je za nastavitve več prostora. Ležeče so gumbi v stolpcu desno, Nadaljuj na dnu, pod desnim palcem. Iz glavnega menija je spodaj širok gumb Končano. |
| `C-kot-glavni-meni.png` | **C · Kot glavni meni**: v slogu novega glavnega menija: jeklene tipke, rdeč gumb Nadaljuj (kot gumb za start dirke), pod naslovom stanje dirke, zavihki s številom nastavitev in modrim robom izbranega, vsak del kot kartica menija z robnikom, vsaka nastavitev z barvnim robom svojega dela (Igra robnik, Grafika modra, Zvok zlata). |

V maketi videz izbereš s stikalom nad telefonom (računalnik), z gumbi A, B, C v kotu (telefon), z `?v=B` ali s `#b` na koncu povezave.

**Predlog pred tem: trije zavihki Igra · Grafika · Zvok, v treh načinih** (izbran je način 3). Vseh 34 nastavitev je v treh zavihkih, vsaka natanko enkrat; zavihka Splošno ni več. Načini so v `settings-data.js` (`ways`), slike v `slike/igra-grafika-zvok/`:

| Slika | Kaj pokaže |
| --- | --- |
| `0-primerjava.png` | vsi trije načini drug ob drugem: kaj je v Igri, kaj v Grafiki in kaj v Zvoku |
| `0-pavza-pokonci.png`, `0-pavza-lezece.png` | prvi zaslon po pritisku na pavzo v vseh treh načinih (telefon pokonci, ležeče) |
| `1-pokonci.png`, `2-pokonci.png`, `3-pokonci.png` | vsi trije zavihki načina, vsak posnet v celoti od vrha do dna (pri 3 je en sam seznam razrezan na tri dele) |
| `1-lezece.png`, `2-lezece.png`, `3-lezece.png` | trije zavihki načina na telefonu ležeče |

- **1 · Ločeni zavihki** (Grafika je vse, kar vidiš): vsak zavihek je svoja stran. Igra: Upravljanje, Dirka, Igralec. Grafika: Kamera, Na zaslonu med vožnjo, Kakovost slike, Pred dirko in po njej. Gumbi pavze so v vrstici nad zavihki. Zavihki s črto pod izbranim.
- **2 · Igra najprej** (Grafika je samo kakovost slike): Igra ima vse, kar rabiš za vožnjo: Dirka, Upravljanje, Kamera, Pomoč med vožnjo, Igralec. Grafika: Kakovost slike, Pred dirko in po njej. Pavza odpre zavihek Igra z gumbi pavze na vrhu. Zavihki kot gumbi v enem okvirju.
- **3 · En dolg seznam** (zavihki skočijo na del seznama): vse nastavitve so en seznam, razdeljen na Igra (Upravljanje, Pomoč med vožnjo, Dirka, Igralec), Grafika (Kamera, Kakovost slike, Pred dirko in po njej) in Zvok. Zavihek skoči na svoj del, med drsenjem pa zasveti zavihek dela, ki je na vrhu. Gumbi pavze so pokonci v vrstici spodaj (pod palcem), ležeče pa ob naslovu. Zavihki kot tri ploščice.
- Zvok je v vseh treh enak: Zvok, Glasba v uvodu; Komentator, Sovoznik na reliju, Radio ekipe; Vibracija.

Gumbi pavze so v vseh treh: Ponovi dirko, Foto, Ogled vozila, Celoten zaslon, Odstopi, Glavni meni. Gumba »Kamera« ni več, ker je Kamera zdaj nastavitev v zavihku.

Predloga pred tem (samo slike, v maketi ju ni več):

- **Trije zavihki A, B, C** (`slike/izbira/`): A · Dirka · Vožnja · Slika in zvok (po delih igre), B · Igra · Pogled · Zvok (kaj počneš, vidiš in slišiš), C · Osnovno · Pomoči · Napredno (po tem, kako pogosto jih spreminjaš).
- **Osem zavihkov** z **dvema različicama**, eno za telefon pokonci in eno za telefon ležeče (`slike/pokonci/`, `slike/lezece/`). Razlikujeta se v razporeditvi zaslona in v animacijah; te veljajo tudi za nove tri zavihke.

| Slika | Kaj pokaže |
| --- | --- |
| `1-zasloni.png`, `2-zasloni.png` | vseh 8 zavihkov v tej različici |
| `3-…`, `4-…`, `5-animacije-….png` | vse animacije v tej različici: za vsako nastavitev vsaka možnost posebej in pod njo opis, kaj animacija pokaže |

- **Pokonci** (igra teče s kamero *za avtom*): animacije kažejo igro izza avta (avto kaže navzgor, svet se vrti okoli njega), telefon je v animacijah pokonci, tipke so na dnu pokončnega zaslona; drift ima v kotu zemljevid s potjo avta.
- **Ležeče** (igra teče z *izometrično* kamero): animacije kažejo igro od zgoraj (sever vedno gor), telefon v animacijah leži; časovna tabela je desno pod zemljevidom kot v igri ležeče.

## Zaslon

- Pavza odpre nastavitve. Zgoraj so trije **zavihki** Igra, Grafika in Zvok, pod njimi so nastavitve **ena pod drugo**, razdeljene na razdelke; seznam se drsi navzdol.
- **Nadaljuj** (iz glavnega menija **Končano**, brez gumbov pavze, strategije in Gum v boksih) je zgoraj desno, pri videzu B spodaj na sredini (ležeče desno spodaj).
- Občutljivost nagiba in Smer nagiba se pojavita samo, ko izbereš Nagib; Opozorila na ovinke (Pikes Peak) so samo na tej progi.
- **Pokonci**: naslov in Nadaljuj v prvi vrstici, zavihki v drugi; ime nastavitve nad izbiro; animacije so višje (200 px).
- **Ležeče**: naslov, zavihki in Nadaljuj v eni vrstici, da ostane čim več prostora; ime nastavitve levo, izbira desno, animacija nad njima. Kartice so na sredini, široke največ 640 px.

## Animacije

Nad vsako nastavitvijo je animacija, ki pokaže, kaj izbrana možnost naredi, brez branja. Vsaka animacija ima obe različici: `SetAnim.orient()` (pokonci ali ležeče) izbere kamero (`driveCam`: za avtom ali izometrično) in telefon (`heldPhone`: pokonci ali ležeče). Ko možnost spremeniš, se animacija preobrazi v novo (kamera odleti, telefon se obrne, trak se nariše, črke se obrnejo …). Rišejo se na platno (canvas 2D): majhen 3D-svet v slogu igre (cesta, robniki, drevesa, avti iz kock, sence) in 2D-risbe (telefon, palec, pedala, slušalke …). Premikajo se samo animacije, ki so na zaslonu.

Datoteke:

- `anim-core.js`: jedro (mali 3D, avti, drevesa, sence, delci, telefon, palec, deli HUD-a, zanka risanja);
- `scenes-*.js`: prizori po kategorijah;
- `settings-data.js`: kategorije, nastavitve, možnosti in opisi animacij;
- `settings.js`, `settings.css`, `index.html`: zaslon;
- `settings-real.js`: slike iz igre nad nastavitvami (1 posnetek, 2 vse možnosti hkrati, 3 v živo); `posnetki/`: slike iz igre in njihov seznam (`real.js`), videi za Upravljanje (`video/`, `video.js`); `orodja/`: kako so narejeni;
- `storyboard.html`: vse možnosti vseh animacij naenkrat (iz njega so slike 3–5 v `slike/pokonci/` in `slike/lezece/`);
- `primerjava.html`: primerjava treh načinov (kaj je v katerem zavihku);
- `board.html`: sestavljanje slik (`kind=mix`: telefoni pokonci v vrsti, ležeči drug pod drugim ob njih).
- `board-video.html`: slike za video (telefon ob enem trenutku in vrstice slik ob več trenutkih).

Odpri v brskalniku prek strežnika iz korena repozitorija (pisave so v `../fonts`), npr. `maketa-nastavitev/index.html?mode=pause&tab=igra`. `storyboard.html?o=port|land` izriše animacije ene različice. Parametri zaslona: `v=A|B|C` (videz), `media=anim|video|compare|live` (slika), `at=<nastavitev>` (seznam do te nastavitve), `lb=1|2|3` (ležeče: gumbi pavze spodaj), `ph=0|1|2|3` (slike v telefonu), `uv=0|1|2|3` (Upravljanje kot video), `vt=<s>` (videi na tem trenutku, za mirujoče slike), `mode=pause|menu`, `tab=igra|grafika|zvok`, `land=1` (okvir ležeče), `dev=0` (brez okvirja), `bg=…` (slika dirke v ozadju), `s={"camera":"iso"}` (začetne nastavitve), `shot=1&t=2.4` (mirujoča slika za posnetke).
