# Maketa novih nastavitev (pavza)

Samostojna, klikljiva maketa novega zaslona **Pavza / Nastavitve**. **Ni povezana z igro**: igra je ne naloži in nič v igri se ne spremeni. Ko bo predlog potrjen, bo zaslon prenesen v igro (`index.html`, `js/game.js`, `css/style.css`, `js/lang.js`).

Slike predloga so v `slike/`:

| Slika | Kaj pokaže |
| --- | --- |
| `1-pokonci.png`, `2-pokonci.png` | zaslon na telefonu pokonci, vseh 8 zavihkov |
| `3-lezece.png` | zaslon na telefonu ležeče |
| `4-…`, `5-…`, `6-animacije-….png` | vse animacije: za vsako nastavitev vsaka možnost posebej in pod njo opis, kaj animacija pokaže |

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
- **Pokonci**: naslov in Nadaljuj v prvi vrstici, zavihki (ikona nad imenom) v drugi; ime nastavitve nad izbiro.
- **Ležeče**: naslov, zavihki (ikona ob imenu) in Nadaljuj v eni vrstici, da ostane čim več prostora; ime nastavitve levo, izbira desno, animacija nad njima. Kartice so na sredini, široke največ 640 px.

## Animacije

Nad vsako nastavitvijo je animacija, ki pokaže, kaj izbrana možnost naredi, brez branja. Ko možnost spremeniš, se animacija preobrazi v novo (kamera odleti, telefon se obrne, trak se nariše, črke se obrnejo …). Rišejo se na platno (canvas 2D): majhen 3D-svet v slogu igre (cesta, robniki, drevesa, avti iz kock, sence) in 2D-risbe (telefon, palec, pedala, slušalke …). Premikajo se samo animacije, ki so na zaslonu.

Datoteke:

- `anim-core.js`: jedro (mali 3D, avti, drevesa, sence, delci, telefon, palec, deli HUD-a, zanka risanja);
- `scenes-*.js`: prizori po kategorijah;
- `settings-data.js`: kategorije, nastavitve, možnosti in opisi animacij;
- `settings.js`, `settings.css`, `index.html`: zaslon;
- `storyboard.html`: vse možnosti vseh animacij naenkrat (iz njega so slike 4–6);
- `board.html`: sestavljanje slik telefonov.

Odpri v brskalniku prek strežnika iz korena repozitorija (pisave so v `../fonts`), npr. `maketa-nastavitev/index.html?mode=pause&tab=voznja`. Parametri: `mode=pause|menu`, `tab=<id zavihka>`, `bg=bg-port.jpg|bg-land.jpg` (zamrznjena dirka v ozadju), `s={"camera":"iso"}` (začetne nastavitve).
