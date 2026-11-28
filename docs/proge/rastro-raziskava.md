# Rio do Rastro, Brazilija — raziskava za dodelavo (`rastro`)

[← Opis proge](rastro.md) · dodelava po merilu Pikes Peak (`docs/dodelava-prog.md`, vrstica `rastro`; odločitve O-28-6, O-28-7, O-28-17, O-28-37)

## Kraj (iz virov)

- **Lega**: cesta SC-390, zvezna država Santa Catarina; od Lauro Müllerja v dolini po steni Serra Geral na planoto Bom Jardim da Serra. Proga je zgornjih 4,2 km, od ~1.097 m do razgledišča (Mirante) na robu planote, ~1.421 m (Copernicus DEM GLO-30; turistični opisi navajajo za razgledišče do ~1.460 m, razlika je v točki merjenja).
- **Kamnina**: bazalt Serra Geral zgoraj, peščenjak spodaj (že v igri, `js/world-rastro.js`).
- **Rastje po pasovih**:
  - *Pobočje pod pečino*: atlantski deževni gozd (Mata Atlântica), sklenjen.
  - *Planota*: naravna travišča (campos de altitude) z araukarijami, posamezno in v gajih. Mestoma so ob razgledišču zaplate gozda (mozaik).
  - *Podnebje*: pozimi pogoste slane, od maja do avgusta.
- **Zavarovano**: del okolice spada pod narodni park São Joaquim (samo zemljepisno ime).

## Vrzel »pri 3,9 km je trava« (`docs/realizem.md`, vrstica 70)

Meritev v igri 28. 11. 2026 (sonda v brskalniku, `def.lc` dekodiran kot v `js/world-vrsic.js`). Za vsakih 100 m: celice rabe tal 16 m s središčem do 60 m od ceste (trava / gozd / pozidano) in drevesa, višja od 7 m, v istem krogu:

| m po startu | višina | trava / gozd / pozidano (celice) | drevesa > 7 m |
|---|---|---|---|
| 2.600 | ~1.330 m | 16 / 26 / 1 | 43 |
| 2.900 | ~1.363 m | 0 / 43 / 0 | 178 |
| 3.100 | ~1.389 m | 31 / 1 / 11 | 19 |
| 3.400 | ~1.409 m | 24 / 15 / 6 | 123 |
| 3.600 | ~1.415 m | 46 / 1 / 0 | 21 |
| 3.900 | ~1.415 m | 35 / 8 / 1 | 50 |
| 4.100 | ~1.415 m | 37 / 6 / 2 | 7 |
| 4.200 | ~1.421 m | 21 / 0 / 22 | 18 |

- Na pobočju (do ~2.950 m) je raba tal ob cesti pretežno gozd in v igri stoji gost gozd (pri 2.900 m 178 visokih dreves).
- Na planoti (od ~3.050 m) ESA WorldCover 2021 ob cesti kaže 0–35 % gozda, povprečno ~10 % (3.100–4.200 m). Igra tam riše travo z araukarijami in gaji, kar se ujema s tem virom in z javnimi opisi (travišča z araukarijami).
- Trditve »v resnici je ob cesti več kot pol gozda« iz virov, ki so mi bili dosegljivi, **ne morem potrditi**:
  - WorldCover je proti.
  - Opisi omenjajo mozaik, ne sklenjenega gozda.
  - OpenStreetMap (`natural=wood`, `landuse=forest` ob SC-390 med Alto da Serra in razglediščem) ni bil dosegljiv: Overpass je vračal 503, `openstreetmap.org` je iz okolja seje zaprt.
- Po pravilu »vse kot v resnici, samo po virih« gozda na planoti nisem dodajal. Najprej je treba z OSM (ali z izvirnim WorldCover v 10 m) potrditi ali ovreči, kaj raste ob cesti od 3,0 do 4,2 km.
- Mogoč vzrok razhajanja: igra uporablja WorldCover, prevzorčen na 16 m. Ozki pasovi dreves tik ob cesti (ena do dve krošnji) se pri tem lahko izgubijo. To je treba preveriti na izvirnih 10 m (`esa-worldcover.s3.eu-central-1.amazonaws.com`, ploščica S30W051, je dosegljiva; v okolju manjka knjižnica za branje GeoTIFF).

## Prekrivanja z odprtimi PR (teh delov ne spreminjam)

- **#763** (croatiadata, Realizem G): barva tal `rrCol` (RRT) in `World.rastje.tla/listje` okoli zanke gozda, vrstica o deževnem gozdu v `rastro.md`. Če se gostota gozda spremeni, mora biti to majhen poseg samo v verjetnost `p`.
- **#1052**: blok stavb v `js/world-rastro.js`.
- **#1060**: ptice (`ptice: 'jastreb'`).
- **#678**: luč in zvok (`render.js`, `sfx*.js`, 5 vrstic v `rastro.js`).
- **#1166** (moj): tla ob cesti za kamero za avtom (`js/world-chase-bt108.js`). Tal ob cesti tu ne podvajam.

## Viri

- ESA WorldCover 2021 v200 — © ESA WorldCover project / Copernicus Sentinel data, CC BY 4.0 (že v `README.md`, »Zasluge«).
- Copernicus DEM GLO-30 — © DLR/Airbus, Copernicus programme, licenca Copernicus DEM (že v »Zasluge«).
- OpenStreetMap — © sodelavci OpenStreetMap, ODbL (središčnica, stavbe, slapovi; že v »Zasluge«).
- Javni opisi kraja (rastje na planoti, slana, višina razgledišča):
  - angleška Wikipedija, »Serra do Rio do Rastro«, CC BY-SA 4.0;
  - turistični opisi Bom Jardim da Serra, samo za dejstva, brez besedila: viagensecaminhos.com, catracalivre.com.br.
