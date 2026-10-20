# Maketa grafike (primerjava »zdaj« in »nova grafika«)

10 prizorov iz prave igre, vsak v dveh slikah: **zdaj** (igra, kot je) in **nova grafika** (isti prizor, isti trenutek, ista kamera, z videzom po priloženih referenčnih slikah). Samo maketa: **igra se ne spremeni** (`js/`, `css/` in `index.html` ostanejo, kot so), nova grafika ni v igri.

Slike so v `slike/`: `NN-<prizor>-zdaj.jpg`, `NN-<prizor>-novo.jpg` (1920 × 1080) in `slike/pari/NN-<prizor>.jpg` (obe skupaj, zgoraj zdaj, spodaj novo).

| # | Proga | Prizor |
|---|-------|--------|
| 01 | Bathurst, Avstralija | postanek v boksih |
| 02 | Spa, Belgija | ovinek z robniki |
| 03 | Štajerska, Avstrija | ovinek z robniki in gledalci |
| 04 | Monte Carlo, Monako | ovinek ob pristanišču |
| 05 | Vršič, Slovenija | gorska cesta |
| 06 | Suzuka, Japonska | večer |
| 07 | Detroit, ZDA | noč |
| 08 | Toronto, Kanada | dež |
| 09 | Ouninpohja, Finska | makadam skozi gozd |
| 10 | Longford, Avstralija | jesen |

Vsi prizori so s kamere za avtom (edina kamera v igri) in na pravih progah (brez testnih).

## Kaj je »nova grafika«

Vse se doda **ob posnetku**, v tekočo igro (three.js r128), brez posega v njeno kodo (`orodja/slog.js`, `orodja/rekviziti.js`):

- **Svetloba:** toplo nizko sonce od spredaj, hladne modre sence, mehkejša hemisferna svetloba, toplejša megla; senčna karta 4096. Večer, noč in dež obdržijo igrino svetlobo in ji dodajo svoj ton.
- **Površine (shader na obstoječih materialih):** trava (šopi, zaplate, koščeni pasovi, mestoma posušena), asfalt (zrnatost, popravila, oljne lise, razpoke), svetel beton (madeži, dež, spoji), listje, makadam.
- **Rekviziti (procedurni, brez tujih modelov):** debele gume (črne, bele), sodi, betonske pregrade, stožci, kanistri, orodni vozički, dvigala, šopi trave in kamenčki po tleh (le tam, kjer jih kamera vidi), sledi gum, barvne podlage boksov z belimi vogali in krogom »STOP«, nočne luči.
- **Post-obdelava:** okluzija v zaslonskem prostoru (SSAO), globinska ostrina kot pri maketi, glow, ostrenje, filmski ton, hladne sence in tople svetlobe, vinjeta.

Slog je namerno **maketa**: del tega (SSAO, širok DOF, 4096 senca, tisoči šopov trave) bi na telefonu težko držal obremenitev iz `CLAUDE.md` (~300 klicev risanja, ~900 tisoč oglišč), zato bi ga za v igro moral kdo prilagoditi (npr. površine v teksturah, manj šopov, DOF le v vodoravnem pasu).

## Kako ponoviti slike

```
npm ci
node maketa-grafike/orodja/narediti-slike.mjs            # vsi prizori v maketa-grafike/slike (PNG)
node maketa-grafike/orodja/narediti-slike.mjs /pot 05    # samo prizor 05
```

Vsak prizor je en `orodja/prizori/NN-….json`: `spec` (proga, čas dneva, vreme, letni čas, sekunde avtopilota, zoom) in `stil` (nastavitve sloga in seznam rekvizitov). Dirka se zažene z navidezno uro in fiksnim semenom, zato je isti prizor ob vsakem zagonu enak.

`orodja/seja.mjs` drži odprte prizore v enem brskalniku (HTTP ukazi `open`, `stil`, `shot`, `eval`, `scan`), da se slog preizkuša brez ponovnega nalaganja proge.

Podatki in imena so ostali taki, kot jih ima igra (samo zemljepisna imena, brez logotipov, znamk in oseb). Napis »STOP« na boksih je generičen.
