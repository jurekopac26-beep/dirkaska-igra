# Maketa novih nastavitev (pavza)

Samostojna, klikljiva maketa novega zaslona **Pavza / Nastavitve**. **Ni povezana z igro**: igra je ne naloži in nič v igri se ne spremeni. Ko bo predlog potrjen, bo zaslon prenesen v igro (`index.html`, `js/game.js`, `css/style.css`, `js/lang.js`).

Klikljiva maketa je objavljena kot zasebna stran: <https://claude.ai/artifact/PpQAwpzzwCapqsws9EiRTi> (na računalniku je telefon v okvirju, zgoraj stikali *Telefon pokonci / ležeče* in *Med dirko / Iz glavnega menija*; na telefonu je zaslon čez cel ekran in sledi legi telefona).

Predlog ima **dve različici**, eno za telefon pokonci in eno za telefon ležeče. Razlikujeta se v razporeditvi zaslona in v animacijah. Slike so v `slike/pokonci/` in `slike/lezece/`:

| Slika | Kaj pokaže |
| --- | --- |
| `1-zasloni.png`, `2-zasloni.png` | vseh 8 zavihkov v tej različici |
| `3-…`, `4-…`, `5-animacije-….png` | vse animacije v tej različici: za vsako nastavitev vsaka možnost posebej in pod njo opis, kaj animacija pokaže |

- **Pokonci** (igra teče s kamero *za avtom*): animacije kažejo igro izza avta (avto kaže navzgor, svet se vrti okoli njega), telefon je v animacijah pokonci, tipke so na dnu pokončnega zaslona; drift ima v kotu zemljevid s potjo avta.
- **Ležeče** (igra teče z *izometrično* kamero): animacije kažejo igro od zgoraj (sever vedno gor), telefon v animacijah leži; časovna tabela je desno pod zemljevidom kot v igri ležeče.

## Zaslon

- Pavza odpre nastavitve. Zgoraj so **kategorije** (zavihki z ikono), pod njimi so nastavitve izbrane kategorije **ena pod drugo**, seznam se drsi navzdol.
- **Pavza** (samo med dirko): gumbi pavze (Ponovi dirko, Foto, Ogled vozila, Kamera, Celoten zaslon, Odstopi, Glavni meni), strategija in Gume v boksih.
- **Vožnja**: Upravljanje, Občutljivost nagiba in Smer nagiba (samo pri Nagibu; ko izbereš Nagib, se pojavita), Samodejni plin, Pomoč pri driftu, Kontrole.
- **Kamera**: Kamera, Oddaljenost, Položaj avta.
- **Prikaz**: Idealna linija, Opozorila za ovinke, Opozorila na ovinke (Pikes Peak), Duh najboljše vožnje, Časovna tabela.
- **Dirka**: Težavnost, Poškodbe avtov, Okvare, Radio ekipe, Uvod pred dirko, Prelet proge pred startom, Video najboljšega trenutka.
- **Grafika**: Grafika, Podrobnosti, Sence, Varčevanje z baterijo.
- **Zvok**: Zvok, Glasba v uvodu, Komentator, Sovoznik na reliju, Vibracija.
- **Splošno**: Jezik, Ime voznika, Profil (izvoz, uvoz).
- Zgoraj desno je vedno **Nadaljuj** (iz glavnega menija **Končano**, brez zavihka Pavza).
- **Pokonci**: naslov in Nadaljuj v prvi vrstici, zavihki (ikona nad imenom) v drugi; ime nastavitve nad izbiro; animacije so višje (200 px).
- **Ležeče**: naslov, zavihki (ikona ob imenu) in Nadaljuj v eni vrstici, da ostane čim več prostora; ime nastavitve levo, izbira desno, animacija nad njima. Kartice so na sredini, široke največ 640 px.

## Animacije

Nad vsako nastavitvijo je animacija, ki pokaže, kaj izbrana možnost naredi, brez branja. Vsaka animacija ima obe različici: `SetAnim.orient()` (pokonci ali ležeče) izbere kamero (`driveCam`: za avtom ali izometrično) in telefon (`heldPhone`: pokonci ali ležeče). Ko možnost spremeniš, se animacija preobrazi v novo (kamera odleti, telefon se obrne, trak se nariše, črke se obrnejo …). Rišejo se na platno (canvas 2D): majhen 3D-svet v slogu igre (cesta, robniki, drevesa, avti iz kock, sence) in 2D-risbe (telefon, palec, pedala, slušalke …). Premikajo se samo animacije, ki so na zaslonu.

Datoteke:

- `anim-core.js`: jedro (mali 3D, avti, drevesa, sence, delci, telefon, palec, deli HUD-a, zanka risanja);
- `scenes-*.js`: prizori po kategorijah;
- `settings-data.js`: kategorije, nastavitve, možnosti in opisi animacij;
- `settings.js`, `settings.css`, `index.html`: zaslon;
- `storyboard.html`: vse možnosti vseh animacij naenkrat (iz njega so slike 4–6);
- `board.html`: sestavljanje slik telefonov.

Odpri v brskalniku prek strežnika iz korena repozitorija (pisave so v `../fonts`), npr. `maketa-nastavitev/index.html?mode=pause&tab=voznja`. `storyboard.html?o=port|land` izriše animacije ene različice. Parametri zaslona: `mode=pause|menu`, `tab=<id zavihka>`, `land=1` (okvir ležeče), `dev=0` (brez okvirja), `bg=…` (slika dirke v ozadju), `s={"camera":"iso"}` (začetne nastavitve), `shot=1&t=2.4` (mirujoča slika za posnetke).
