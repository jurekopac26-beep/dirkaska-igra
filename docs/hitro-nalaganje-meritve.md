# Hitro nalaganje: meritve (I17, 8. 11. 2026)

Povzetek in načrt: `docs/hitro-nalaganje.md`. Orodje: `tools/zagon.mjs` (opis na vrhu; `--from <datoteka.json>` izpiše povzetek shranjenega kroga). Stroj: 4 jedra, Chromium 153.0.8010.12, Node v22.23.4; indeks hitrosti stroja po krogih (Lighthouse, brez upočasnitve): 2675, 2649, 2064, 2278, 2133, 2493. Strežnik kot GitHub Pages (HTTP/2 s TLS, gzip, `max-age=600`, kopija z žigi), service worker kot v objavljeni igri, zaslon 412 × 915. Grafika SwiftShader v procesu GPU, ki ga CDP ne upočasni: 2D platna (teksture svetov) riše tam, `getImageData` in preverjanje senčilnikov (`getShaderInfoLog`) čakata nanj; zato je gradnja prog izmerjena tudi s platnom na procesorju (`--platno-cpu`, bližje telefonu z grafičnim procesorjem), časi senčilnikov niso kot na telefonu. Surovi JSON ni v repozitoriju (ponovi z orodjem).

## Prenos ob zagonu po skupinah

Skripte, ki jih `index.html` naloži ob zagonu (velikosti datotek v repozitoriju; pomanjšano: esbuild 0.25 `--minify`, isti gzip 6 kot strežnik).

| skupina | datotek | gzip MB | pomanjšano gzip | surovo MB | pomanjšano surovo |
|---|---|---|---|---|---|
| svet: graditelji prog | 44 | 1,42 | 1,03 | 4,15 | 2,42 |
| proge: datoteke (prave) | 27 | 1,10 | 1,04 | 2,36 | 2,22 |
| proge: datoteke (testne) | 24 | 0,94 | 0,90 | 1,99 | 1,88 |
| nova mapa (leno, ni ob zagonu) | 14 | 0,43 | 0,33 | 1,37 | 0,87 |
| svet: skupno | 9 | 0,41 | 0,27 | 1,29 | 0,69 |
| izris (render) | 2 | 0,37 | 0,21 | 1,10 | 0,53 |
| avti | 33 | 0,29 | 0,15 | 0,83 | 0,34 |
| meni (nov) | 7 | 0,28 | 0,25 | 0,89 | 0,79 |
| jedro (core, tex) | 2 | 0,25 | 0,13 | 0,74 | 0,31 |
| igra (game.js) | 1 | 0,24 | 0,14 | 0,69 | 0,36 |
| misije | 35 | 0,19 | 0,13 | 0,47 | 0,26 |
| three.js | 1 | 0,14 | 0,14 | 0,58 | 0,58 |
| deli avtov | 8 | 0,11 | 0,08 | 0,39 | 0,24 |
| zvok in komentar | 2 | 0,07 | 0,04 | 0,21 | 0,12 |
| jezik (lang) | 1 | 0,06 | 0,06 | 0,16 | 0,14 |
| drugo: napake.js | 1 | 0,04 | 0,03 | 0,12 | 0,07 |
| zabava | 8 | 0,03 | 0,02 | 0,07 | 0,04 |
| peerjs (splet) | 1 | 0,02 | 0,02 | 0,08 | 0,08 |
| vnos in splet | 2 | 0,01 | 0,01 | 0,04 | 0,02 |
| drugo: lestvica.js | 1 | 0,01 | 0,00 | 0,02 | 0,01 |
| drugo: shramba.js | 1 | 0,00 | 0,00 | 0,01 | 0,01 |

Skupaj ob zagonu: surovo 16,18 → 11,10 MB; gzip 5,97 → 4,65 MB (brez nove mape, ki se nalaga leno).

## Zagon

Vrstice: `HTML` prispel, prvi izris (FCP), zadnja skripta prispela, vse skripte izvedene (`load`); zagon (`boot()`): `Render.init`, svet za naslovnico (`S.track`), predstavitvena dirka; `Menu.init` in meni pripravljen (`Menu.ready`); pri hitrem vstopu `?proga=bathurst` svet proge, senčilniki in vožnja (zaslon z nalaganjem izgine). »Toplo«: isti profil brskalnika (service worker, predpomnilnik, V8).

### CPU 4×, počasno 4G (prvi obisk ×2, nato isti profil brskalnika: prvi obisk in štirje ponovni)

```text
CPU 4× (indeks 2675), omrežje slow4g, HTTP/2, 153.0.8010.12, 2026-11-08T17:23:13.695Z
hladno menu: HTML 0.7 s · prvi izris – · zadnja skripta prispela 35.6 s (210 skript, 6.03 MB prenosa, vse 6.17 MB) · skripte izvedene (load) 35.9 s
   zagon 35.9 s–41.1 s: Render.init 0.7 s, svet za naslovnico 2.6 s, predstavitvena dirka 0.9 s · Menu.init 41.1 s, izris menija 0.0 s · meni pripravljen 44.4 s · service worker
hladno proga: HTML 0.7 s · prvi izris – · zadnja skripta prispela 35.8 s (210 skript, 6.03 MB prenosa, vse 6.21 MB) · skripte izvedene (load) 36.0 s
   zagon 36.0 s–40.3 s: Render.init 0.8 s, svet za naslovnico 2.4 s, predstavitvena dirka 0.8 s · Menu.init 40.8 s, izris menija 0.0 s · meni pripravljen 51.5 s · service worker
   proga bathurst: svet 6.0 s, senčilniki 0.5 s · do vožnje 50.8 s
prvi obisk menu: HTML 0.7 s · prvi izris – · zadnja skripta prispela 35.6 s (210 skript, 6.03 MB prenosa, vse 6.17 MB) · skripte izvedene (load) 35.8 s
   zagon 35.8 s–40.3 s: Render.init 0.7 s, svet za naslovnico 2.1 s, predstavitvena dirka 0.8 s · Menu.init 40.2 s, izris menija 0.0 s · meni pripravljen 43.2 s · service worker
toplo menu: HTML 0.0 s · prvi izris – · zadnja skripta prispela 0.3 s (210 skript, 0.00 MB prenosa, vse 0.00 MB) · skripte izvedene (load) 1.1 s
   zagon 1.1 s–5.0 s: Render.init 0.6 s, svet za naslovnico 1.9 s, predstavitvena dirka 0.8 s · Menu.init 4.9 s, izris menija 0.0 s · meni pripravljen 6.9 s · service worker
toplo proga: HTML 0.0 s · prvi izris – · zadnja skripta prispela 0.3 s (210 skript, 0.00 MB prenosa, vse 0.00 MB) · skripte izvedene (load) 1.1 s
   zagon 1.1 s–4.1 s: Render.init 0.6 s, svet za naslovnico 2.1 s, predstavitvena dirka 0.2 s · Menu.init 5.0 s, izris menija 0.0 s · meni pripravljen 14.0 s · service worker
   proga bathurst: svet 5.5 s, senčilniki 0.4 s · do vožnje 12.8 s
toplo menu: HTML 0.0 s · prvi izris – · zadnja skripta prispela 0.3 s (210 skript, 0.00 MB prenosa, vse 0.00 MB) · skripte izvedene (load) 1.0 s
   zagon 1.0 s–8.8 s: Render.init 0.6 s, svet za naslovnico 5.8 s, predstavitvena dirka 0.6 s · Menu.init 8.8 s, izris menija 0.0 s · meni pripravljen 12.2 s · service worker
toplo proga: HTML 0.0 s · prvi izris – · zadnja skripta prispela 0.3 s (210 skript, 0.00 MB prenosa, vse 0.00 MB) · skripte izvedene (load) 1.0 s
   zagon 1.0 s–8.6 s: Render.init 0.6 s, svet za naslovnico 5.7 s, predstavitvena dirka 0.8 s · Menu.init 8.8 s, izris menija 0.0 s · meni pripravljen 14.3 s · service worker
   proga bathurst: svet 0.0 s, senčilniki 0.0 s · do vožnje 9.2 s
```

### CPU 6×, počasno 4G

```text
CPU 6× (indeks 2649), omrežje slow4g, HTTP/2, 153.0.8010.12, 2026-11-08T17:41:12.321Z
hladno menu: HTML 0.7 s · prvi izris 19.9 s · zadnja skripta prispela 35.6 s (210 skript, 6.03 MB prenosa, vse 6.17 MB) · skripte izvedene (load) 36.0 s
   zagon 36.0 s–42.6 s: Render.init 1.3 s, svet za naslovnico 3.2 s, predstavitvena dirka 1.0 s · Menu.init 42.5 s, izris menija 0.0 s · meni pripravljen 45.9 s · service worker
hladno proga: HTML 0.7 s · prvi izris 16.5 s · zadnja skripta prispela 35.6 s (210 skript, 6.03 MB prenosa, vse 6.21 MB) · skripte izvedene (load) 36.1 s
   zagon 36.1 s–42.2 s: Render.init 1.2 s, svet za naslovnico 3.5 s, predstavitvena dirka 1.0 s · Menu.init 42.7 s, izris menija 0.0 s · meni pripravljen 59.6 s · service worker
   proga bathurst: svet 10.5 s, senčilniki 0.6 s · do vožnje 58.1 s
prvi obisk menu: HTML 0.7 s · prvi izris 20.5 s · zadnja skripta prispela 35.8 s (210 skript, 6.03 MB prenosa, vse 6.17 MB) · skripte izvedene (load) 36.1 s
   zagon 36.1 s–43.0 s: Render.init 1.1 s, svet za naslovnico 3.8 s, predstavitvena dirka 0.8 s · Menu.init 42.9 s, izris menija 0.0 s · meni pripravljen 45.5 s · service worker
toplo menu: HTML 0.0 s · prvi izris 0.9 s · zadnja skripta prispela 0.3 s (210 skript, 0.00 MB prenosa, vse 0.00 MB) · skripte izvedene (load) 1.7 s
   zagon 1.7 s–8.2 s: Render.init 1.3 s, svet za naslovnico 3.0 s, predstavitvena dirka 1.5 s · Menu.init 8.1 s, izris menija 0.0 s · meni pripravljen 10.6 s · service worker
toplo proga: HTML 0.0 s · prvi izris 1.1 s · zadnja skripta prispela 0.3 s (210 skript, 0.00 MB prenosa, vse 0.00 MB) · skripte izvedene (load) 1.8 s
   zagon 1.8 s–7.2 s: Render.init 0.9 s, svet za naslovnico 3.2 s, predstavitvena dirka 0.9 s · Menu.init 7.6 s, izris menija 0.0 s · meni pripravljen 23.0 s · service worker
   proga bathurst: svet 9.6 s, senčilniki 0.5 s · do vožnje 20.9 s
toplo menu: HTML 0.0 s · prvi izris 1.1 s · zadnja skripta prispela 0.3 s (210 skript, 0.00 MB prenosa, vse 0.00 MB) · skripte izvedene (load) 1.9 s
   zagon 1.9 s–15.5 s: Render.init 1.1 s, svet za naslovnico 9.9 s, predstavitvena dirka 1.2 s · Menu.init 15.3 s, izris menija 0.0 s · meni pripravljen 19.2 s · service worker
toplo proga: HTML 0.0 s · prvi izris 1.0 s · zadnja skripta prispela 0.4 s (210 skript, 0.00 MB prenosa, vse 0.00 MB) · skripte izvedene (load) 2.0 s
   zagon 2.0 s–15.8 s: Render.init 1.5 s, svet za naslovnico 10.2 s, predstavitvena dirka 1.0 s · Menu.init 16.1 s, izris menija 0.0 s · meni pripravljen 21.5 s · service worker
   proga bathurst: svet 0.0 s, senčilniki 0.0 s · do vožnje 17.0 s
```

### CPU 4×, hitro 4G

```text
CPU 4× (indeks 2064), omrežje fast4g, HTTP/2, 153.0.8010.12, 2026-11-08T17:45:49.846Z
hladno menu: HTML 0.2 s · prvi izris 3.0 s · zadnja skripta prispela 6.0 s (210 skript, 6.03 MB prenosa, vse 6.17 MB) · skripte izvedene (load) 6.3 s
   zagon 6.3 s–10.9 s: Render.init 0.8 s, svet za naslovnico 2.0 s, predstavitvena dirka 0.9 s · Menu.init 10.8 s, izris menija 0.0 s · meni pripravljen 13.6 s · service worker
hladno proga: HTML 0.2 s · prvi izris 3.8 s · zadnja skripta prispela 6.1 s (210 skript, 6.03 MB prenosa, vse 6.17 MB) · skripte izvedene (load) 6.5 s
   zagon 6.5 s–10.7 s: Render.init 1.0 s, svet za naslovnico 2.1 s, predstavitvena dirka 0.9 s · Menu.init 10.9 s, izris menija 0.0 s · meni pripravljen 24.5 s · service worker
   proga bathurst: svet 7.1 s, senčilniki 0.5 s · do vožnje 22.3 s
```

### CPU 4×, brez omejitve omrežja

```text
CPU 4× (indeks 2278), omrežje none, HTTP/2, 153.0.8010.12, 2026-11-08T17:46:42.702Z
hladno menu: HTML 0.0 s · prvi izris 0.3 s · zadnja skripta prispela 1.0 s (210 skript, 6.03 MB prenosa, vse 6.17 MB) · skripte izvedene (load) 1.8 s
   zagon 1.8 s–6.6 s: Render.init 0.8 s, svet za naslovnico 2.5 s, predstavitvena dirka 0.6 s · Menu.init 6.5 s, izris menija 0.0 s · meni pripravljen 10.2 s · service worker
hladno proga: HTML 0.0 s · prvi izris 1.1 s · zadnja skripta prispela 0.4 s (210 skript, 6.03 MB prenosa, vse 6.21 MB) · skripte izvedene (load) 1.8 s
   zagon 1.8 s–6.2 s: Render.init 0.8 s, svet za naslovnico 2.7 s, predstavitvena dirka 0.6 s · Menu.init 6.5 s, izris menija 0.0 s · meni pripravljen 18.1 s · service worker
   proga bathurst: svet 6.5 s, senčilniki 0.5 s · do vožnje 17.3 s
```

### CPU 4×, počasno 4G, HTTP/1.1 (samo meni)

```text
CPU 4× (indeks 2133), omrežje slow4g, HTTP/1.1, 153.0.8010.12, 2026-11-08T17:47:26.135Z
hladno menu: HTML 0.7 s · prvi izris 1.7 s · zadnja skripta prispela 41.4 s (210 skript, 6.03 MB prenosa, vse 6.17 MB) · skripte izvedene (load) 41.5 s
   zagon 41.5 s–46.3 s: Render.init 0.8 s, svet za naslovnico 2.3 s, predstavitvena dirka 0.6 s · Menu.init 46.2 s, izris menija 0.0 s · meni pripravljen 49.8 s · service worker
```

### CPU 4×, brez omejitve omrežja, 2D platno na procesorju (`--platno-cpu`)

```text
CPU 4× (indeks 2493), omrežje none, HTTP/2, 153.0.8010.12, 2026-11-08T18:35:22.184Z
hladno menu: HTML 0.0 s · prvi izris 0.5 s · zadnja skripta prispela 0.9 s (210 skript, 6.03 MB prenosa, vse 6.17 MB) · skripte izvedene (load) 1.7 s
   zagon 1.7 s–6.1 s: Render.init 0.8 s, svet za naslovnico 2.3 s, predstavitvena dirka 0.7 s · Menu.init 6.0 s, izris menija 0.0 s · meni pripravljen 8.4 s (vmes 5 dolgih opravil, 2.1 s, najdaljše 1.9 s) · service worker
hladno proga: HTML 0.0 s · prvi izris 1.0 s · zadnja skripta prispela 0.4 s (210 skript, 6.03 MB prenosa, vse 6.21 MB) · skripte izvedene (load) 1.7 s
   zagon 1.7 s–6.4 s: Render.init 0.9 s, svet za naslovnico 2.5 s, predstavitvena dirka 1.1 s · Menu.init 6.9 s, izris menija 0.0 s · meni pripravljen 17.7 s (vmes 7 dolgih opravil, 10.5 s, najdaljše 8.1 s) · service worker
   proga bathurst: svet 6.7 s, senčilniki 0.4 s · do vožnje 16.5 s
prvi obisk menu: HTML 0.0 s · prvi izris 1.0 s · zadnja skripta prispela 0.6 s (210 skript, 6.03 MB prenosa, vse 6.17 MB) · skripte izvedene (load) 1.9 s
   zagon 1.9 s–6.8 s: Render.init 0.8 s, svet za naslovnico 2.5 s, predstavitvena dirka 0.8 s · Menu.init 6.6 s, izris menija 0.0 s · meni pripravljen 8.2 s (vmes 5 dolgih opravil, 1.5 s, najdaljše 1.3 s) · service worker
toplo menu: HTML 0.0 s · prvi izris 0.6 s · zadnja skripta prispela 0.3 s (210 skript, 0.00 MB prenosa, vse 0.00 MB) · skripte izvedene (load) 1.1 s
   zagon 1.1 s–5.4 s: Render.init 0.7 s, svet za naslovnico 2.1 s, predstavitvena dirka 0.7 s · Menu.init 5.3 s, izris menija 0.0 s · meni pripravljen 6.7 s (vmes 3 dolgih opravil, 1.2 s, najdaljše 1.1 s) · service worker
toplo proga: HTML 0.0 s · prvi izris 0.6 s · zadnja skripta prispela 0.3 s (210 skript, 0.00 MB prenosa, vse 0.00 MB) · skripte izvedene (load) 1.2 s
   zagon 1.2 s–5.1 s: Render.init 0.8 s, svet za naslovnico 2.0 s, predstavitvena dirka 0.7 s · Menu.init 5.3 s, izris menija 0.0 s · meni pripravljen 16.0 s (vmes 7 dolgih opravil, 10.4 s, najdaljše 8.2 s) · service worker
   proga bathurst: svet 7.0 s, senčilniki 0.3 s · do vožnje 14.8 s
toplo menu: HTML 0.0 s · prvi izris 0.7 s · zadnja skripta prispela 0.3 s (210 skript, 0.00 MB prenosa, vse 0.00 MB) · skripte izvedene (load) 1.2 s
   zagon 1.2 s–11.3 s: Render.init 0.8 s, svet za naslovnico 7.1 s, predstavitvena dirka 0.7 s · Menu.init 11.1 s, izris menija 0.0 s · meni pripravljen 13.2 s (vmes 4 dolgih opravil, 1.9 s, najdaljše 1.5 s) · service worker
toplo proga: HTML 0.0 s · prvi izris 0.7 s · zadnja skripta prispela 0.3 s (210 skript, 0.00 MB prenosa, vse 0.00 MB) · skripte izvedene (load) 1.3 s
   zagon 1.3 s–10.7 s: Render.init 0.9 s, svet za naslovnico 7.0 s, predstavitvena dirka 0.9 s · Menu.init 11.0 s, izris menija 0.0 s · meni pripravljen 14.3 s (vmes 5 dolgih opravil, 2.9 s, najdaljše 1.9 s) · service worker
   proga bathurst: svet 0.0 s, senčilniki 0.0 s · do vožnje 11.8 s
```

## Gradnja prog iz menija

Stari meni (`tdgp-menu=old`), proga izbrana na kartici, `start` → dirka teče in zaslon z nalaganjem izgine (CPU 4×, toplo, brez omejitve omrežja, naslovnica `jezero`). Svet: `Render.buildWorld` (od tega `World.build`), senčilniki: `Render.precompile`; ostanek do vožnje: postavitev dirke in prve slike. Novi programi: `Render.info().programs` po progi minus pred njo.

### Vse prave proge, vsaka v svežem zavihku, 2D platno na procesorju (`--platno-cpu`)

Glavna tabela (najbližje telefonu z grafičnim procesorjem): platna riše glavna nit, upočasnjena 4×; senčilnike prevaja SwiftShader (čas ni kot na telefonu, število programov je).

| proga | start → vožnja | svet | World.build | senčilniki | novi programi | geometrij | tekstur |
|---|---|---|---|---|---|---|---|
| `medvode` | 24,1 | 22,3 | 22,2 | 0,3 | 13 (vseh 44) | 161 | 42 |
| `bangsaen` | 23,9 | 22,4 | 22,2 | 0,2 | 15 (vseh 43) | 100 | 44 |
| `ouninpohja` | 21,5 | 19,8 | 19,7 | 0,5 | 12 (vseh 45) | 188 | 29 |
| `livorno` | 18,5 | 16,3 | 16,2 | 0,3 | 10 (vseh 39) | 111 | 118 |
| `pikes` | 16,6 | 14,5 | 14,4 | 0,5 | 23 (vseh 54) | 116 | 50 |
| `nring` | 15,1 | 12,5 | 12,3 | 0,4 | 15 (vseh 49) | 118 | 119 |
| `pikesg` | 14,7 | 12,7 | 12,7 | 0,3 | 19 (vseh 52) | 112 | 49 |
| `katu` | 13,8 | 12,6 | 12,4 | 0,4 | 9 (vseh 43) | 122 | 30 |
| `caracoles` | 10,1 | 8,5 | 8,4 | 0,4 | 12 (vseh 43) | 138 | 41 |
| `spa` | 9,5 | 7,9 | 7,8 | 0,3 | 18 (vseh 49) | 232 | 44 |
| `chapman` | 9,1 | 7,7 | 7,6 | 0,3 | 3 (vseh 41) | 147 | 45 |
| `suzuka` | 9,0 | 7,5 | 7,4 | 0,3 | 8 (vseh 49) | 227 | 43 |
| `montreal` | 8,7 | 6,7 | 6,6 | 0,4 | 18 (vseh 51) | 247 | 49 |
| `harju` | 8,7 | 7,5 | 7,4 | 0,3 | 12 (vseh 43) | 142 | 27 |
| `bathurst` | 8,2 | 6,6 | 6,5 | 0,3 | 20 (vseh 52) | 97 | 47 |
| `rbring` | 8,0 | 6,2 | 6,2 | 0,3 | 14 (vseh 53) | 90 | 44 |
| `greatalpine` | 7,7 | 6,1 | 6,0 | 0,3 | 5 (vseh 42) | 157 | 46 |
| `toronto` | 6,3 | 4,7 | 4,6 | 0,2 | 7 (vseh 44) | 96 | 42 |
| `balea` | 5,7 | 4,3 | 4,2 | 0,2 | 8 (vseh 35) | 149 | 40 |
| `troisrivieres` | 5,5 | 4,3 | 4,2 | 0,2 | 17 (vseh 46) | 98 | 40 |
| `cpalace` | 5,3 | 3,5 | 3,4 | 0,3 | 26 (vseh 53) | 208 | 43 |
| `sani` | 5,3 | 4,0 | 3,9 | 0,2 | 12 (vseh 40) | 93 | 39 |
| `marrakesh` | 4,7 | 3,3 | 3,2 | 0,2 | 10 (vseh 42) | 187 | 43 |
| `iroha` | 4,7 | 3,3 | 3,2 | 0,2 | 11 (vseh 38) | 174 | 37 |
| `rastro` | 4,3 | 3,1 | 3,1 | 0,2 | 13 (vseh 42) | 172 | 40 |
| `mountbuller` | 4,1 | 2,6 | 2,5 | 0,2 | 5 (vseh 34) | 165 | 39 |
| `tianmen` | 3,2 | 2,0 | 1,9 | 0,2 | 9 (vseh 39) | 151 | 41 |

### 15 prog v svežem zavihku, 2D platno v procesu GPU (SwiftShader)

Platna riše SwiftShader v procesu GPU, ki ga CDP ne upočasni. `getImageData` v gradnji sveta in preverjanje senčilnikov (`getShaderInfoLog`, `getProgramInfoLog`) čakajo, da proces GPU nariše 2D platna (teksture sveta, zemljevidi na karticah zaslona s progami): »senčilniki« in ostanek do vožnje sta tu večinoma to čakanje (profili spodaj), ne prevajanje. Telefon z grafičnim procesorjem platna nariše hitreje. Tabela je urejena po času; proge so šle po vrsti bathurst, spa, nring, suzuka, medvode, caracoles, bangsaen, livorno, ouninpohja, pikes, katu, toronto, balea, tianmen, greatalpine; proces GPU obdrži prevedene programe za vse zavihke istega brskalnika.

| proga | start → vožnja | svet | World.build | senčilniki | novi programi | geometrij | tekstur |
|---|---|---|---|---|---|---|---|
| `medvode` | 40,5 | 38,9 | 38,9 | 0,4 | 12 (vseh 45) | 159 | 46 |
| `caracoles` | 36,6 | 35,1 | 34,9 | 0,4 | 10 (vseh 43) | 138 | 41 |
| `katu` | 35,7 | 34,7 | 34,6 | 0,4 | 11 (vseh 43) | 119 | 29 |
| `bangsaen` | 30,0 | 28,3 | 28,2 | 0,3 | 10 (vseh 43) | 117 | 41 |
| `nring` | 29,1 | 12,4 | 12,3 | 0,4 | 14 (vseh 48) | 118 | 119 |
| `balea` | 28,6 | 27,4 | 27,4 | 0,2 | 5 (vseh 35) | 149 | 41 |
| `livorno` | 28,4 | 19,7 | 19,5 | 6,5 | 6 (vseh 38) | 115 | 118 |
| `spa` | 28,4 | 8,2 | 8,0 | 3,8 | 15 (vseh 53) | 184 | 45 |
| `bathurst` | 27,6 | 7,3 | 7,3 | 18,8 | 17 (vseh 48) | 77 | 46 |
| `greatalpine` | 27,4 | 7,2 | 7,1 | 4,1 | 14 (vseh 43) | 158 | 38 |
| `suzuka` | 27,3 | 8,0 | 7,8 | 17,7 | 17 (vseh 49) | 210 | 43 |
| `toronto` | 27,0 | 6,1 | 6,0 | 4,5 | 15 (vseh 45) | 185 | 42 |
| `pikes` | 26,7 | 15,6 | 15,5 | 9,5 | 22 (vseh 55) | 116 | 42 |
| `ouninpohja` | 26,0 | 17,7 | 17,5 | 7,2 | 15 (vseh 44) | 185 | 28 |
| `tianmen` | 25,8 | 2,8 | 2,7 | 7,5 | 10 (vseh 39) | 152 | 39 |

### Vse prave proge v eni strani, 2D platno v procesu GPU

Prvi krog (CPU 4×, počasno 4G, toplo): poznejša proga najde programe prejšnjih; čakanje na proces GPU kot zgoraj.

| proga | start → vožnja | svet | World.build | senčilniki |
|---|---|---|---|---|
| `bathurst` | 46,1 | 5,1 | 4,9 | 27,2 |
| `nring` | 45,8 | 13,5 | 13,3 | 10,5 |
| `toronto` | 43,6 | 4,7 | 4,6 | 11,5 |
| `ouninpohja` | 42,1 | 19,8 | 19,7 | 1,3 |
| `spa` | 42,0 | 11,1 | 10,7 | 28,8 |
| `medvode` | 41,9 | 40,7 | 40,7 | 0,3 |
| `caracoles` | 40,2 | 38,5 | 38,4 | 0,4 |
| `chapman` | 34,1 | 8,9 | 8,9 | 10,7 |
| `iroha` | 33,8 | 4,5 | 4,5 | 15,4 |
| `montreal` | 32,9 | 6,5 | 6,5 | 25,6 |
| `greatalpine` | 30,7 | 6,3 | 6,2 | 9,0 |
| `bangsaen` | 30,2 | 23,7 | 23,6 | 5,3 |
| `pikes` | 29,6 | 14,6 | 14,6 | 0,5 |
| `balea` | 29,1 | 3,6 | 3,6 | 0,1 |
| `livorno` | 28,5 | 19,9 | 19,8 | 7,8 |
| `suzuka` | 27,3 | 8,0 | 8,0 | 18,1 |
| `marrakesh` | 18,4 | 2,8 | 2,8 | 14,3 |
| `rastro` | 18,0 | 3,3 | 3,2 | 14,1 |
| `katu` | 14,8 | 10,7 | 10,6 | 3,7 |
| `mountbuller` | 14,4 | 2,4 | 2,4 | 11,2 |
| `troisrivieres` | 13,3 | 5,2 | 5,1 | 6,9 |
| `sani` | 13,3 | 3,6 | 3,6 | 8,6 |
| `harju` | 12,1 | 7,3 | 7,2 | 3,8 |
| `rbring` | 7,7 | 6,4 | 6,3 | 0,3 |
| `cpalace` | 5,0 | 3,5 | 3,4 | 0,3 |
| `tianmen` | 2,9 | 2,1 | 2,0 | 0,2 |

## Profili gradnje

CPU profil (vzorec 0,5 ms) od `start` do vožnje, CPU 4×, toplo, vsak v svojem brskalniku (brez programov drugih prog). »S klici«: čas funkcije z vsem, kar kliče; »samo zase«: brez klicanih. `(idle)`: glavna nit čaka (GPU, prenos).

### `bathurst` (start → vožnja 24,3 s)

```text
S klici:
   28,5 s  (root) 
   22,2 s  (anonym) js/game.js:1625
   14,4 s  traverse js/vendor/three.r128.min.js:7
   14,2 s  Pt js/vendor/three.r128.min.js:7
   14,0 s  acquireProgram js/vendor/three.r128.min.js:7
   14,0 s  Jr js/vendor/three.r128.min.js:7
   13,9 s  (anonym) js/vendor/three.r128.min.js:7
   13,4 s  compile js/vendor/three.r128.min.js:7
   13,4 s  precompile js/render.js:4754
   12,7 s  getShaderInfoLog 
    8,0 s  buildWorld js/render.js:3396
    7,9 s  build js/world.js:1433
    4,2 s  (program) 
    4,1 s  World.ext.rbring js/world-rbring.js:1476
    4,1 s  World.ext.bathurst js/world-bathurst.js:123
    3,9 s  buildRbring js/world-rbring.js:414
    3,8 s  finish js/world.js:4383
    3,3 s  ownRnd js/world.js:37
    3,2 s  (anonym) js/world.js:4384
    2,7 s  World.people js/world-ljudje.js:2274
    1,8 s  standsOf js/world-ljudje.js:2192
    1,6 s  (anonym) js/world-ljudje.js:2193
    1,6 s  standBuild js/world-ljudje.js:1913
    1,5 s  frame js/game.js:6251
    1,2 s  frame js/render.js:10243
    1,1 s  render js/vendor/three.r128.min.js:7
    0,9 s  renderBufferDirect js/vendor/three.r128.min.js:7
    0,9 s  standAround js/world-ljudje.js:1612

Samo zase:
   12,7 s  getShaderInfoLog 
    4,2 s  (program) 
    0,9 s  getProgramInfoLog 
    0,5 s  nrNear js/world.js:4544
    0,4 s  buildRbring js/world-rbring.js:414
    0,4 s  (garbage collector) 
    0,3 s  getProgramParameter 
    0,2 s  crFree js/world.js:4888
    0,2 s  tri js/world.js:137
    0,2 s  World.ext.rbring js/world-rbring.js:1476
    0,2 s  mn js/vendor/three.r128.min.js:7
    0,2 s  traverse js/vendor/three.r128.min.js:7
    0,1 s  nearest js/world.js:619
    0,1 s  getX js/vendor/three.r128.min.js:7
    0,1 s  Ce js/vendor/three.r128.min.js:7
    0,1 s  pixels js/tex.js:28
    0,1 s  (anonym) js/world.js:4077
    0,1 s  smoothNormals js/render.js:116
```

### `caracoles` (start → vožnja 31,9 s)

```text
S klici:
   37,0 s  (root) 
   31,1 s  (anonym) js/game.js:1625
   30,3 s  buildWorld js/render.js:3396
   30,2 s  build js/world.js:1433
   28,8 s  World.ext.caracoles js/world-caracoles.js:764
   28,5 s  buildCaracoles js/world-caracoles.js:250
   22,8 s  vrGritTex js/world-vrsic.js:377
   22,8 s  getImageData 
    5,1 s  (program) 
    2,1 s  caTileGeo js/world-caracoles.js:118
    1,4 s  finish js/world.js:4383
    1,3 s  caCol js/world-caracoles.js:82
    1,3 s  caGH js/world-caracoles.js:64
    1,2 s  ownRnd js/world.js:37
    1,2 s  (anonym) js/world.js:4384
    1,0 s  traverse js/vendor/three.r128.min.js:7
    0,9 s  (anonym) js/world.js:1075
    0,8 s  caH js/world-caracoles.js:49
    0,7 s  World.people js/world-ljudje.js:2274
    0,6 s  I js/world.js:1077
    0,6 s  Pt js/vendor/three.r128.min.js:7
    0,6 s  frame js/game.js:6251
    0,5 s  (anonym) js/world-caracoles.js:348
    0,5 s  Jr js/vendor/three.r128.min.js:7
    0,5 s  acquireProgram js/vendor/three.r128.min.js:7
    0,5 s  (anonym) js/world-caracoles.js:349
    0,5 s  (anonym) js/vendor/three.r128.min.js:7
    0,5 s  caGround js/world-caracoles.js:69

Samo zase:
   22,8 s  getImageData 
    5,1 s  (program) 
    0,6 s  I js/world.js:1077
    0,5 s  caGH js/world-caracoles.js:64
    0,4 s  getProgramInfoLog 
    0,4 s  caNear js/world-caracoles.js:28
    0,3 s  buildCaracoles js/world-caracoles.js:250
    0,3 s  World.ext.caracoles js/world-caracoles.js:764
    0,3 s  vrNear js/world-vrsic.js:96
    0,2 s  mn js/vendor/three.r128.min.js:7
    0,2 s  quadO js/world.js:158
    0,2 s  caTileGeo js/world-caracoles.js:118
    0,2 s  (anonym) js/core.js:17
    0,2 s  (garbage collector) 
    0,2 s  caGround js/world-caracoles.js:69
    0,2 s  caCol js/world-caracoles.js:82
    0,2 s  caH js/world-caracoles.js:49
    0,2 s  (anonym) js/world.js:1075
```

### `medvode`, 2D platno na procesorju (start → vožnja 31,1 s)

```text
S klici:
   35,2 s  (root) 
   29,4 s  (anonym) js/game.js:1625
   28,4 s  buildWorld js/render.js:3396
   28,3 s  build js/world.js:1433
   26,1 s  World.ext.medvode js/world-medvode.js:1355
   25,0 s  buildMedvode js/world-medvode.js:587
    7,4 s  nearestIdx js/core.js:744
    5,0 s  onRoad js/world-medvode.js:617
    4,5 s  (program) 
    3,8 s  gravelSeams js/world.js:1177
    3,6 s  gravelSeamMasks js/world.js:1093
    3,6 s  (anonym) js/world.js:1075
    2,9 s  put js/world-medvode.js:1039
    2,7 s  I js/world.js:1077
    2,6 s  query js/core.js:1368
    2,4 s  mvTileGeo js/world-medvode.js:195
    2,2 s  finish js/world.js:4383
    1,9 s  edge js/world-medvode.js:1014
    1,9 s  onStubE js/world-medvode.js:1013
    1,8 s  mvGH js/world-medvode.js:148
    1,8 s  ownRnd js/world.js:37
    1,8 s  (anonym) js/world.js:4384
    1,7 s  (anonym) js/world-medvode.js:1011
    1,4 s  mvH js/world-medvode.js:119
    1,4 s  traverse js/vendor/three.r128.min.js:7
    1,3 s  triO js/world.js:150
    1,3 s  quadO js/world.js:158
    1,3 s  mvCol js/world-medvode.js:170

Samo zase:
    7,4 s  nearestIdx js/core.js:744
    4,5 s  (program) 
    2,7 s  I js/world.js:1077
    2,2 s  buildMedvode js/world-medvode.js:587
    1,6 s  query js/core.js:1368
    1,0 s  World.ext.medvode js/world-medvode.js:1355
    0,9 s  tri js/world.js:137
    0,7 s  _stubProj js/core.js:356
    0,5 s  gravelSeamMasks js/world.js:1093
    0,5 s  (anonym) js/world.js:1075
    0,5 s  lerp js/core.js:12
    0,5 s  triO js/world.js:150
    0,5 s  lfNear js/world-longford.js:149
    0,4 s  getProgramInfoLog 
    0,4 s  mvGH js/world-medvode.js:148
    0,4 s  mn js/vendor/three.r128.min.js:7
    0,4 s  mvNear js/world-medvode.js:100
    0,4 s  (garbage collector) 
```

### `medvode` (start → vožnja 37,9 s)

```text
S klici:
   42,1 s  (root) 
   36,4 s  (anonym) js/game.js:1625
   35,5 s  buildWorld js/render.js:3396
   35,5 s  build js/world.js:1433
   33,4 s  World.ext.medvode js/world-medvode.js:1355
   32,6 s  buildMedvode js/world-medvode.js:587
   13,4 s  gravelSeams js/world.js:1177
    9,0 s  gravelTone js/world.js:1144
    9,0 s  getImageData 
    6,2 s  nearestIdx js/core.js:744
    4,5 s  (program) 
    4,3 s  gravelSeamMasks js/world.js:1093
    4,3 s  (anonym) js/world.js:1075
    4,0 s  onRoad js/world-medvode.js:617
    3,3 s  I js/world.js:1077
    2,9 s  mvTileGeo js/world-medvode.js:195
    2,3 s  query js/core.js:1368
    2,2 s  put js/world-medvode.js:1039
    2,1 s  mvGH js/world-medvode.js:148
    2,0 s  finish js/world.js:4383
    1,7 s  mvH js/world-medvode.js:119
    1,7 s  ownRnd js/world.js:37
    1,7 s  (anonym) js/world.js:4384
    1,4 s  edge js/world-medvode.js:1014
    1,4 s  onStubE js/world-medvode.js:1013
    1,4 s  mvCol js/world-medvode.js:170
    1,3 s  (anonym) js/world-medvode.js:1011
    1,3 s  onRoadB js/world-medvode.js:616

Samo zase:
    9,0 s  getImageData 
    6,2 s  nearestIdx js/core.js:744
    4,5 s  (program) 
    3,3 s  I js/world.js:1077
    1,9 s  buildMedvode js/world-medvode.js:587
    1,4 s  query js/core.js:1368
    0,8 s  World.ext.medvode js/world-medvode.js:1355
    0,6 s  tri js/world.js:137
    0,6 s  (anonym) js/world.js:1075
    0,6 s  _stubProj js/core.js:356
    0,6 s  gravelSeamMasks js/world.js:1093
    0,5 s  lerp js/core.js:12
    0,5 s  getProgramInfoLog 
    0,5 s  lfNear js/world-longford.js:149
    0,4 s  mvNear js/world-medvode.js:100
    0,4 s  mvH js/world-medvode.js:119
    0,4 s  (garbage collector) 
    0,4 s  mvGH js/world-medvode.js:148
```

### `toronto` (start → vožnja 24,5 s)

```text
S klici:
   28,9 s  (root) 
   16,2 s  Pt js/vendor/three.r128.min.js:7
   16,1 s  acquireProgram js/vendor/three.r128.min.js:7
   16,1 s  Jr js/vendor/three.r128.min.js:7
   16,1 s  frame js/game.js:6251
   15,9 s  getProgramInfoLog 
   15,8 s  frame js/render.js:10243
   15,7 s  render js/vendor/three.r128.min.js:7
   15,6 s  renderBufferDirect js/vendor/three.r128.min.js:7
   15,6 s  Rt js/vendor/three.r128.min.js:7
   15,6 s  Ct js/vendor/three.r128.min.js:7
   15,5 s  It js/vendor/three.r128.min.js:7
    8,2 s  (anonym) js/game.js:1625
    6,8 s  buildWorld js/render.js:3396
    6,7 s  build js/world.js:1433
    4,3 s  (program) 
    3,7 s  finish js/world.js:4383
    3,3 s  ownRnd js/world.js:37
    3,3 s  (anonym) js/world.js:4384
    2,9 s  World.people js/world-ljudje.js:2274
    2,7 s  World.ext.toronto js/world-toronto.js:13
    2,4 s  standsOf js/world-ljudje.js:2192
    2,0 s  (anonym) js/world-ljudje.js:2193
    2,0 s  standBuild js/world-ljudje.js:1913
    1,9 s  traverse js/vendor/three.r128.min.js:7
    1,5 s  near js/world-toronto.js:39
    1,2 s  (anonym) js/vendor/three.r128.min.js:7
    1,0 s  groundH js/world-toronto.js:50

Samo zase:
   15,9 s  getProgramInfoLog 
    4,3 s  (program) 
    1,5 s  near js/world-toronto.js:39
    0,4 s  World.ext.toronto js/world-toronto.js:13
    0,3 s  build js/world.js:1433
    0,2 s  tri js/world-ljudje.js:1526
    0,2 s  (garbage collector) 
    0,2 s  pixels js/tex.js:28
    0,1 s  mn js/vendor/three.r128.min.js:7
    0,1 s  (anonym) js/tex.js:243
    0,1 s  getX js/vendor/three.r128.min.js:7
    0,1 s  Ce js/vendor/three.r128.min.js:7
    0,1 s  smoothNormals js/render.js:116
    0,1 s  getBoundingClientRect 
    0,1 s  (anonym) js/world-ljudje.js:52
    0,1 s  crossVectors js/vendor/three.r128.min.js:7
    0,1 s  row js/world.js:4653
    0,1 s  dot js/vendor/three.r128.min.js:7
```

## Scenariji prenosa ob zagonu

Čas = samo prenos na počasnem 4G (2,5 s strani + MB / 182 kB/s, izmerjeno: 6,03 MB do 35,6 s). Glave prog ocenjene na 40 kB gzip. »Prva dirka«: datoteka proge in vse datoteke svetov, ki jih njen svet rabi (pomanjšano gzip).

```text
S0 zdaj (vse ob zagonu)                                                           210 skript   5.97 MB gz (  36.1 s) | pomanjšano  4.65 MB (  28.7 s)
S1 brez testnih prog (izbris pred Google Play)                                    174 skript   4.72 MB gz (  29.1 s) | pomanjšano  3.54 MB (  22.4 s)
S2 + proge in graditelji šele ob potrebi (glave 40 kB)                            113 skript   2.50 MB gz (  16.6 s) | pomanjšano  1.68 MB (  12.0 s)
S3 + misije, zabava, splet, napake, podatki menija (zemljevid, prelet) kasneje     63 skript   2.00 MB gz (  13.8 s) | pomanjšano  1.27 MB (   9.7 s)

prva dirka v S3 (+ proga in njen svet; pomanjšano gz, kB) — in čas na počasnem 4G s S3 pomanjšano:
  bathurst         31 kB  2 datotek →   9.8 s | tracks/bathurst.js world-bathurst.js
  nring            38 kB  2 datotek →   9.9 s | tracks/nring.js world-nring.js
  suzuka           45 kB  2 datotek →   9.9 s | tracks/suzuka.js world-suzuka.js
  cpalace          52 kB  2 datotek →    10 s | tracks/cpalace.js world-cpalace.js
  rbring           82 kB  5 datotek →  10.1 s | tracks/rbring.js world-rbring.js world-cpalace.js world-rio.js world-bathurst.js
  toronto          94 kB  2 datotek →  10.2 s | tracks/toronto.js world-toronto.js
  ouninpohja      100 kB  6 datotek →  10.2 s | tracks/ouninpohja.js world-ouni.js world-rbring.js world-cpalace.js world-rio.js world-bathurst.js
  bangsaen        111 kB  6 datotek →  10.3 s | tracks/bangsaen.js world-bangsaen.js world-rbring.js world-cpalace.js world-rio.js world-bathurst.js
  livorno         112 kB  3 datotek →  10.3 s | tracks/livorno.js world-livorno.js data/livorno.js
  spa             112 kB  6 datotek →  10.3 s | tracks/spa.js world-spa.js world-rbring.js world-cpalace.js world-rio.js world-bathurst.js
  pikesg          130 kB  2 datotek →  10.4 s | tracks/pikesg.js world-pikes.js
  pikes           135 kB  2 datotek →  10.4 s | tracks/pikes.js world-pikes.js
  marrakesh       150 kB  8 datotek →  10.5 s | tracks/marrakesh.js world-marrakesh.js world-riverside.js world-bathurst.js world-rbring.js world-cpalace.js world-rio.js world-ouni.js
  montreal        155 kB  3 datotek →  10.5 s | tracks/montreal.js world-montreal.js data/montreal.js
  harju           214 kB  7 datotek →  10.8 s | tracks/harju.js world-harju.js world-ouni.js world-rbring.js world-cpalace.js world-rio.js world-bathurst.js
  troisrivieres   215 kB  8 datotek →  10.9 s | tracks/troisrivieres.js world-troisrivieres.js world-harju.js world-ouni.js world-rbring.js world-cpalace.js world-rio.js world-bathurst.js
  iroha           288 kB  9 datotek →  11.3 s | tracks/iroha.js world-iroha.js world-pikes.js world-ouni.js world-rbring.js world-cpalace.js world-rio.js world-bathurst.js world-vrsic.js
  katu            288 kB  9 datotek →  11.3 s | tracks/katu.js world-katu.js world-vrsic.js world-pikes.js world-ouni.js world-rbring.js world-cpalace.js world-rio.js world-bathurst.js
  balea           343 kB 12 datotek →  11.6 s | tracks/balea.js world-prelaz.js world-pikes.js world-ouni.js world-rbring.js world-cpalace.js world-rio.js world-bathurst.js world-caracoles.js world-
  rastro          344 kB 13 datotek →  11.6 s | tracks/rastro.js world-rastro.js world-pikes.js world-ouni.js world-rbring.js world-cpalace.js world-rio.js world-bathurst.js world-caracoles.js world
  sani            348 kB 13 datotek →  11.6 s | tracks/sani.js world-sani.js world-pikes.js world-ouni.js world-rbring.js world-cpalace.js world-rio.js world-bathurst.js world-vrsic.js world-caracol
  mountbuller     351 kB 14 datotek →  11.6 s | tracks/mountbuller.js world-mountbuller.js world-gore.js world-pikes.js world-ouni.js world-rbring.js world-cpalace.js world-rio.js world-bathurst.js 
  caracoles       354 kB 12 datotek →  11.6 s | tracks/caracoles.js world-caracoles.js world-pikes.js world-ouni.js world-rbring.js world-cpalace.js world-rio.js world-bathurst.js world-prelaz.js wo
  chapman         359 kB 13 datotek →  11.6 s | tracks/chapman.js world-chapman.js world-pikes.js world-ouni.js world-rbring.js world-cpalace.js world-rio.js world-bathurst.js world-vrsic.js world-c
  tianmen         379 kB 13 datotek →  11.8 s | tracks/tianmen.js world-tianmen.js world-pikes.js world-ouni.js world-rbring.js world-cpalace.js world-rio.js world-bathurst.js world-vrsic.js world-c
  greatalpine     402 kB 13 datotek →  11.9 s | tracks/greatalpine.js world-greatalpine.js world-pikes.js world-ouni.js world-rbring.js world-cpalace.js world-rio.js world-bathurst.js world-vrsic.js
  medvode         580 kB 17 datotek →  12.9 s | tracks/medvode.js world-medvode.js world-ouni.js world-rbring.js world-cpalace.js world-rio.js world-bathurst.js world-vrsic.js world-pikes.js world-h

samo za testne proge (gredo z izbrisom): 12 datotek, 0.31 MB gz: townsville monterey bigsur uncompahgre mulholland baldy moki palomar maunakea hotham newcastle detroit
graditelji testnih prog, ki jih rabijo prave proge (ob izbrisu premakni pomočnike): js/world-rio.js js/world-vrsic.js js/world-beartooth.js js/world-riverside.js js/world-longford.js

T1 prave proge (datoteke) leno, glave ob zagonu                 183 skript 4.92 MB gz ( 30.2 s) | pomanjšano 3.65 MB ( 23.0 s)
T2 + graditelji, ki jih testne ne rabijo, leno                  163 skript 4.27 MB gz ( 26.5 s) | pomanjšano 3.15 MB ( 20.2 s)
T3 + misije, zabava, splet, napake, podatki menija kasneje      113 skript 3.77 MB gz ( 23.7 s) | pomanjšano 2.74 MB ( 17.9 s)
leni graditelji (20): nring toronto data/montreal montreal harju spa bangsaen suzuka medvode katu chapman sani greatalpine rastro tianmen troisrivieres data/livorno livorno gore mountbuller
pravi graditelji, ki ostanejo ob zagonu, ker jih rabijo testne (9): pikes ouni caracoles bathurst cpalace rbring iroha marrakesh prelaz 0.38 MB gz
```

## Odvisnosti svetov

Imena, ki jih datoteka sveta vzame iz `World.api` ob nalaganju ali ob gradnji, in datoteka, ki jih tja postavi (`js/world.js` ni naštet: vedno naložen). Število imen v oklepaju.

```text
world.js                 ← zastave(1) pikes(7) vrsic(1) rbring(1) cpalace(1) suzuka(1) rio(2) caracoles(1) bathurst(1) bigsur(1) longford(1) iroha(1) detroit(1) maunakea(1) greatalpine(1) rastro(1)
world-ouni.js            ← zastave(1) rbring(2)
world-vrsic.js           ← ouni(2) pikes(2)
world-caracoles.js       ← vrsic(19) prelaz(1) ouni(2) pikes(1) zastave(1)
world-nring.js           ← zastave(1)
world-montreal.js        ← zastave(1)
world-harju.js           ← ouni(6)
world-spa.js             ← rbring(1) zastave(1)
world-rbring.js          ← bathurst(6) rio(11) cpalace(4) zastave(1)
world-riverside.js       ← rbring(4) bathurst(1) marrakesh(1)
world-longford.js        ← rbring(1) riverside(1) caracoles(1)
world-monterey.js        ← rbring(4) riverside(1)
world-bangsaen.js        ← rbring(1) zastave(1)
world-suzuka.js          ← zastave(1)
world-medvode.js         ← longford(2) harju(3) vrsic(14) ouni(3)
world-katu.js            ← zastave(1) ouni(2) pikes(1) vrsic(8)
world-chapman.js         ← caracoles(4) vrsic(16) ouni(1) pikes(1)
world-bigsur.js          ← caracoles(7) vrsic(17) ouni(2) pikes(1)
world-uncompahgre.js     ← caracoles(4) vrsic(16) ouni(2) pikes(1)
world-sani.js            ← caracoles(9) vrsic(9) ouni(2) pikes(1)
world-iroha.js           ← zastave(1) vrsic(17) ouni(1) pikes(1)
world-mulholland.js      ← vrsic(16) caracoles(4) ouni(2) pikes(1)
world-baldy.js           ← mulholland(1) beartooth(1) vrsic(17) caracoles(5) ouni(2) pikes(1)
world-greatalpine.js     ← iroha(1) zastave(1) caracoles(3) vrsic(15) ouni(2) pikes(1)
world-beartooth.js       ← vrsic(9) caracoles(4) ouni(2) pikes(1)
world-rastro.js          ← vrsic(11) caracoles(5) ouni(2) pikes(1)
world-moki.js            ← vrsic(6) caracoles(8) ouni(1) pikes(1)
world-palomar.js         ← mulholland(1) vrsic(16) caracoles(5) ouni(1) pikes(1)
world-maunakea.js        ← vrsic(15) caracoles(6) ouni(1) pikes(1)
world-hotham.js          ← iroha(1) vrsic(20) caracoles(1) ouni(2) pikes(1)
world-tianmen.js         ← zastave(1) caracoles(4) vrsic(9) ouni(2) pikes(1)
world-detroit.js         ← ouni(2) iroha(1) rbring(1)
world-marrakesh.js       ← ouni(2) rbring(1) riverside(1)
world-troisrivieres.js   ← harju(2)
world-prelaz.js          ← vrsic(10) beartooth(1) iroha(1) caracoles(4) ouni(2) pikes(1)
world-livorno.js         ← zastave(1)
world-gore.js            ← zastave(1) vrsic(20) caracoles(1) ouni(2) pikes(1)
```

