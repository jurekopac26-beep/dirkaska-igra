# Maketa menija (angleško)

Samostojna, klikljiva maketa menija igre v angleščini. **Ni povezana z igro**: igra je ne naloži, nič v igri ne spremeni in ni del `main`. Avti, makete prog in posnetki ozadja so zajeti iz prave igre.

Objavljena je kot zasebna stran: <https://claude.ai/artifact/LGhsPikqgs4To6phR2LB5V>

## Glavni meni

- Trije veliki gumbi s sliko:
  - **Single race**: slika današnje proge.
  - **Multiplayer**: dva avta.
  - **Career**: pokal, odstotek kariere in vrstica napredka.
- Pod njimi sta manjša gumba **Settings** in **Leaderboard**.
- Čisto spodaj je gumb za nakup **Full Game · €3.99**. Po nakupu ga zamenja oznaka *Full game*.
- V ozadju se vrtijo trije kratki posnetki dirke (Jezero Ring, Ljubljana, gorski reli).

## Single race in današnja dirka

- Najprej se odpre izbira proge. Na prvem mestu je **današnja dirka** (*Today's race*).
  - Vsak dan je druga. Progo, avto in vreme izbere datum.
  - Vsi vozijo isti avto.
- Pri današnji dirki piše:
  - najboljši čas dneva na svetu in kdo ga ima (*Best today*),
  - koliko igralcev jo je danes že odpeljalo (*Players*),
  - tvoje mesto (*Your place*).
- Brezplačni račun jo lahko odpelje enkrat na dan. Potem je namesto *Race!* gumb *Unlimited · €3.99*. S polno igro jo lahko ponavljaš.
- Po dirki rezultat pokaže mesto v dirki in mesto na današnji svetovni lestvici, npr. *450th of 8,995 · top 5 %*. Isto mesto piše tudi:
  - pri progi,
  - na glavnem meniju,
  - v *Leaderboard → Today*.
- Druge proge: *Next* → izbira avta → *Race!*

## Namesto dirke: izbira mesta

Dirka se v maketi ne vozi. Ko klikneš *Race* (Single race, današnja dirka, Career ali Multiplayer), se odpre *Where did you finish?*. Tam izbereš mesto:

- 1.–13. mesto,
- pri časovnih preizkusih zlati, srebrni ali bronasti čas oziroma brez medalje,
- v Multiplayerju 1. ali 2. mesto.

Nato se odpre zaslon z rezultatom:

- nagrada v CR,
- pokali,
- odstotek serije in kariere prej → potem,
- odklenjene serije.

*Continue* gre naprej po meniju, *Race again* ponovi dirko. Tako preizkusiš, kako se meni nadaljuje po zmagi ali po slabši uvrstitvi.

## Drugi zasloni

- **Choose car**:
  - avto v pravem 3D (three.js r128, ista različica kot v igri),
  - obrneš ga s prstom,
  - zavihki Stats / Upgrades / Paint, vseh 8 barv igre.
- **Career**:
  - odstotek celotne kariere in vsake serije (kot v Real Racing 3),
  - pokali za vsako dirko: bron za top 5, srebro za stopničke, zlato za zmago,
  - naslednja dirka.
- **Serija**: seznam dirk z zemljevidom proge, pokali in nagrado.
  - Serija se odklene, ko je prejšnja na 50 %.
  - Brezplačni račun ima samo Rookie Cup, ostale serije so v polni igri.
- **Multiplayer**:
  - ustvari sobo in pošlji kodo prijatelju,
  - vstopi s kodo,
  - hitra dirka z nekom, ki ravno čaka.
- **Leaderboard**: današnja svetovna lestvica in rekordi vsake proge.
- **Settings**

## Stanja za preizkus

Zgoraj je vrstica **MOCKUP** s tremi stanji:

- *Free*: brezplačna različica,
- *Full game*: kupljena igra,
- *Veteran*: igralec po nekaj tednih.

Kako deluje:

- *Free* in *Full game* začneta pri 0 %.
- Napredek (denar, pokali, rekordi, današnja dirka) se shrani v brskalnik, za vsako stanje posebej.
- Gumb ↻ v vrstici ali *Settings → Reset progress* postavi trenutno stanje nazaj na začetek.
- Nakup v stanju *Free* (*Full Game* → *Buy*) preklopi na polno igro in obdrži napredek.
- Z × skriješ vrstico, z gumbom M jo prikažeš nazaj.

## Kaj urejati

| Datoteka | Kaj je v njej |
|---|---|
| `data.js` | **vsa besedila, cene, avti, proge, serije kariere, pokali, nagrade po mestih, današnja dirka (proge, avti, vreme, število brezplačnih voženj) in začetna stanja** – tu spreminjaš vsebino |
| `style.css` | videz (barve so na vrhu kot spremenljivke `--…`) |
| `app.js` | zasloni, premikanje med njimi, izbira mesta in izračun rezultata |
| `car3d.js` | 3D prikaz avta |
| `assets/` | 3D modeli avtov (`cars/*.json`), slike avtov (`cars/img/`), slike gumbov glavnega menija (`menu/`), makete prog (`tracks/*.webp`), posnetki ozadja (`video/`) |
| `outlines.js` | obrisi prog za majhne zemljevide (ustvarjeno, ne urejaj ročno) |

Vsi časi, imena na lestvicah, število igralcev, denar (CR) in odstotki so primeri.

## Ogled na računalniku

Stran bere datoteke z `fetch`, zato jo odpri prek lokalnega strežnika (ne z dvoklikom):

```
cd maketa-menija
python3 -m http.server 8000
```

in odpri <http://localhost:8000>. Potrebuje internet za three.js in pisavo Roboto.

Za ponovno objavo kot Artifact:

- objavi vsebino `index.html` brez vrstic `<!doctype>`, `<html>`, `<head>` in `<body>` (te doda objava sama),
- ostale datoteke objavi kot dodatne datoteke z enakimi potmi.

## Orodja za ponovni zajem (`orodja/`)

Skripte, s katerimi so bili zajeti avti, proge in posnetki. Potrebujejo kopijo igre v `maketa-menija/game_main/`:

```
mkdir -p maketa-menija/game_main
git archive origin/main | tar -x -C maketa-menija/game_main
cd maketa-menija/orodja
node cars3d.mjs                                  # avti -> ../assets/cars/*.json
node carimgs.mjs && python3 menuimg.py           # slike avtov in gumbov -> ../assets/cars/img/, ../assets/menu/
node bgvideo.mjs '[["jezero",7],["ljubljana",7],["gora",7]]' 1.25 14   # posnetki -> ../assets/video/
node dio2.mjs proge.json                         # makete prog -> raw/tracks/*.png (proge.json: [[id, ime, nastavitve], …])
python3 mkwebp.py                                # raw/tracks -> ../assets/tracks/*.webp
node gen_tracks2.js raw/tracks.js                # obrisi prog (nato v outlines.js)
node check.mjs                                   # vsi zasloni v vseh stanjih -> shots/
node flow.mjs                                    # odigra današnjo dirko, kariero in multiplayer z izbiro mesta -> shots/
```

Uporabljajo Playwright s Chromiumom (kot testi igre). Mapi `game_main/` in `orodja/raw/` nista v repozitoriju.
