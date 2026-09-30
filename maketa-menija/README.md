# Maketa menija (angleško)

Samostojna, klikljiva maketa menija igre v angleščini. **Ni povezana z igro**: igra je ne naloži, nič v igri ne spremeni in ni del `main`. Avti, makete prog in posnetek ozadja so zajeti iz prave igre.

Objavljena je kot zasebna stran: <https://claude.ai/artifact/LGhsPikqgs4To6phR2LB5V>

## Zasloni

- **Main menu** – meni kot v igri, v ozadju se vrtijo trije kratki posnetki dirke (Jezero Ring, Ljubljana, gorski reli).
- **Choose car** – avto v pravem 3D (three.js r128, ista različica kot v igri). Obrneš ga s prstom, sam se počasi vrti. Zavihki Stats / Upgrades / Paint, vseh 8 barv igre.
- **Choose track** – 3D maketa proge, podatki o progi, število krogov in vreme lahko spremeniš. Proge lahko menjaš tudi s potegom prsta.
- **Career** – odstotek celotne kariere, odstotek vsake serije, pokali za vsako dirko (bron: top 5, srebro: stopničke, zlato: zmaga), zaklenjene serije in naslednja dirka.
- **Serija** – seznam dirk z zemljevidom proge, pokali in nagrado.
- **Race a Friend**, **Leaderboard**, **Settings** – preprosti zasloni.

Zgoraj je vrstica **MOCKUP** za preklop med tremi stanji: *Free* (brezplačna različica), *Full game* (kupljena igra) in *Veteran* (igralec po nekaj tednih). Z × jo skriješ, z gumbom M jo prikažeš nazaj.

## Kaj urejati

| Datoteka | Kaj je v njej |
|---|---|
| `data.js` | **vsa besedila, cene, avti, proge, serije kariere, pokali in odstotki za vsa tri stanja** – tu spreminjaš vsebino |
| `style.css` | videz (barve so na vrhu kot spremenljivke `--…`) |
| `app.js` | zasloni in premikanje med njimi |
| `car3d.js` | 3D prikaz avta |
| `assets/` | 3D modeli avtov (`cars/*.json`), makete prog (`tracks/*.webp`), posnetki ozadja (`video/`) |
| `outlines.js` | obrisi prog za majhne zemljevide (ustvarjeno, ne urejaj ročno) |

Vsi časi, denar (CR) in odstotki so primeri.

## Ogled na računalniku

Stran bere datoteke z `fetch`, zato jo odpri prek lokalnega strežnika (ne z dvoklikom):

```
cd maketa-menija
python3 -m http.server 8000
```

in odpri <http://localhost:8000>. Potrebuje internet za three.js in pisavo Roboto.

Za ponovno objavo kot Artifact se objavi vsebina `index.html` brez vrstic `<!doctype>`, `<html>`, `<head>` in `<body>` (te doda objava sama), ostale datoteke pa kot dodatne datoteke z enakimi potmi.

## Orodja za ponovni zajem (`orodja/`)

Skripte, s katerimi so bili zajeti avti, proge in posnetki. Potrebujejo kopijo igre v `maketa-menija/game_main/`:

```
mkdir -p maketa-menija/game_main
git archive origin/main | tar -x -C maketa-menija/game_main
cd maketa-menija/orodja
node cars3d.mjs                                  # avti -> ../assets/cars/*.json
node bgvideo.mjs '[["jezero",7],["ljubljana",7],["gora",7]]' 1.25 14   # posnetki -> ../assets/video/
node dio2.mjs proge.json                         # makete prog -> raw/tracks/*.png (proge.json: [[id, ime, nastavitve], …])
python3 mkwebp.py                                # raw/tracks -> ../assets/tracks/*.webp
node gen_tracks2.js raw/tracks.js                # obrisi prog (nato v outlines.js)
node check.mjs                                   # pregled vseh zaslonov -> shots/
```

Uporabljajo Playwright s Chromiumom (kot testi igre). Mapi `game_main/` in `orodja/raw/` nista v repozitoriju.
