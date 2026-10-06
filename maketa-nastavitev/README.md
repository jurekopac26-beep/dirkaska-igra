# Maketa novih nastavitev (pavza)

Samostojna, klikljiva maketa novega zaslona **Pavza / Nastavitve**. **Ni povezana z igro**: igra je ne naloži in nič v igri se ne spremeni. Ko bo predlog potrjen, bo zaslon prenesen v igro (`index.html`, `js/game.js`, `css/style.css`, `js/lang.js`).

Klikljiva maketa je objavljena kot zasebna stran: <https://claude.ai/artifact/PpQAwpzzwCapqsws9EiRTi> (na računalniku je telefon v okvirju, zgoraj so stikala za videz *A, B, C*, *Telefon pokonci / ležeče* in *Med dirko / Iz glavnega menija*; na telefonu je zaslon čez cel ekran in sledi legi telefona).

**Zadnji predlog: izbrani način 3 (en dolg seznam) v treh videzih.** Vsi trije imajo enak zaslon: zgoraj tri ploščice Igra, Grafika in Zvok, pod njimi vse nastavitve v enem seznamu (zavihek skoči na svoj del, med drsenjem zasveti sam), gumbi pavze spodaj. Nastavitve in njihov vrstni red so v vseh treh enaki. Videzi so v `settings-data.js` (`versions`), slike v `slike/videz/` (vsaka: pokonci in ležeče, prvi zaslon po pavzi in del Grafika):

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
- `storyboard.html`: vse možnosti vseh animacij naenkrat (iz njega so slike 3–5 v `slike/pokonci/` in `slike/lezece/`);
- `primerjava.html`: primerjava treh načinov (kaj je v katerem zavihku);
- `board.html`: sestavljanje slik (`kind=mix`: telefoni pokonci v vrsti, ležeči drug pod drugim ob njih).

Odpri v brskalniku prek strežnika iz korena repozitorija (pisave so v `../fonts`), npr. `maketa-nastavitev/index.html?mode=pause&tab=igra`. `storyboard.html?o=port|land` izriše animacije ene različice. Parametri zaslona: `v=A|B|C` (videz), `mode=pause|menu`, `tab=igra|grafika|zvok`, `land=1` (okvir ležeče), `dev=0` (brez okvirja), `bg=…` (slika dirke v ozadju), `s={"camera":"iso"}` (začetne nastavitve), `shot=1&t=2.4` (mirujoča slika za posnetke).
