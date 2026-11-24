# Ptice in živali: raziskava in načrt

Odločitev uporabnika 24. 11. 2026 (tabla #382, komentar 7120588492). Veja `grafika/ptice-zivali-bt`.
**Stanje: raziskava v teku, kode še ni.** Pravilo: najprej raziskava po virih, nato koda.

## Odločitev (povzetek)

1. Dirkališča (skupina `circuit`): brez živali; na cestnih in rally progah ostanejo.
2. Ptice na dirkališčih ostanejo, a le v petini časa drugih prog.
3. Bolj podrobne ptice (trup, glava, krila v več delih, barve vrste), v mejah `tests/golden/perf.json`.
4. Vrsta ptice po državi proge: število v jati, formacija, let (mahanje ali jadranje), vse po virih.
5. Pred `main`: 2–3 možnosti podrobnosti s slikami, potrdi uporabnik.

## Kje je kaj v kodi (ugotovljeno, še nespremenjeno)

- Skupina proge: `gr(d)` v `js/menu.js` (~vrstica 104): `test` → test, `rally` ali `descent && timeTrial` → rally, `open` → road, sicer `circuit`.
- Živali: `World.life(o)` v `js/world-zivali.js` (~758), seznami `ZIV`, `SCENE`, žive `goLive`; testne proge že izstopijo (`def.test`).
  Posebne prizore v `js/world-*.js` je treba še poiskati (npr. ptice v `js/world-gore.js`, `moveBirds`).
- Ptice: razred `Birds` v `js/render.js` (~3288): 16 ptic, 2 jati po 4–7, 9 oglišč na ptico (3 trikotniki), ena barva
  (`0x2a2c31`, ob morju galeb `0xe6e9ec`), čakanje `wait` 2–12 s, ohlapen klin. `def.noBirds` ptice izklopi; v dežju jih ni.

## Viri in omejitev

Iz te seje `en.wikipedia.org` ni dosegljiv (omrežje okolja), uporabljeno je spletno iskanje. Zato je potrjenih le del podatkov.
Kar ni potrjeno, je označeno z »ni vira« in **ne gre v kodo**, dokler vira ni (tam ostane sedanja splošna ptica).

## Vrste: kaj je potrjeno

| Vrsta | Jata (število) | Formacija in let | Barve | Kraji po viru | Vir |
|---|---|---|---|---|---|
| Žerjav (*Grus grus*) | do 400; nad Eiflom verige po več sto | V (klin), izkušeni spredaj; mahanje | ni vira | Eifel (Nemčija), počivališča Švedska, Nemčija | [1] [2] [3] |
| Planinska kavka (*Pyrrhocorax graculus*) | »velike jate«, števila ni vira | ohlapna jata; hiter, akrobatski let, jadranje v vzgorniku ob stenah | črna, rumen kljun, rdeče noge | Alpe, Himalaja, Atlas v Maroku (nad 2880 m); Kavkaz ni vira | [4] [5] |
| Škorec (*Sturnus vulgaris*) | povprečno 30 082 (meritev, večinoma Združeno kraljestvo); prenočišča 100 000 in več | gost tridimenzionalen oblak | ni vira | Združeno kraljestvo; Tunizija ni vira | [6] [7] |
| Siva gos (*Anser anser*) | v letu ni vira (zbori do 25 000, šibek vir) | V (šibek vir) | ni vira | Danska (141 000, avgust 2022), Nizozemska (stalnica) | [8] [9] |
| Črni jastreb (*Coragyps atratus*) | od nekaj do več sto; na selitvi nekaj do nekaj deset | jadranje v termiki; ravna krila, nekaj hitrih plitvih zamahov, nato drsenje | črn, bele lise ob konicah kril | od JV ZDA do srednjega Čila in Urugvaja; Argentina ni izrecno | [10] [11] [12] |
| Črni škarnik (*Milvus migrans*) | skupna prenočišča; na selitvi velike jate, števila ni vira | jadranje in drsenje v termiki | viličast rep | Evropa, Azija, Afrika, Avstralija; Japonska; Altaj ni vira | [13] |
| Rumenonogi galeb (*Larus michahellis*) | ni vira | ni vira | ni vira | Sredozemlje, vzhodni Jadran, Baleari, Madeira (*atlantis*), Istanbul | [14] [15] |
| Azijski odprtokljuni štrk (*Anastomus oscitans*) | običajno v jatah; števila v letu ni vira | jadranje v termiki, vrat iztegnjen | ni vira | Tajska | [16] |
| Kravja čaplja (*Bubulcus coromandus*) | ohlapne jate do več sto; prelet na prenočišče 850–1000 (Hongkong) | formacija ni vira | ni vira | riževa polja; Šrilanka (zimski priliv) | [17] [18] |

[1] nabu.de/tiere-und-pflanzen/voegel/artenschutz/kranich/kranichzug-aktuell.html ·
[2] nabu.de/tiereundpflanzen/voegel/zugvoegel/kraniche/14589.html · [3] en.wikipedia.org/wiki/Common_crane ·
[4] en.wikipedia.org/wiki/Alpine_chough · [5] birdfact.com/birds/alpine-chough ·
[6] ncbi.nlm.nih.gov/pmc/articles/PMC5476259 (Goodenough in sod., 2017) · [7] woodlandtrust.org.uk/blog/2018/11/starling-murmurations ·
[8] projects.au.dk/can/projects/greylag-geese-count · [9] beardsleyzoo.org/greylag-goose.html ·
[10] allaboutbirds.org/guide/Black_Vulture · [11] hawkmountain.org/raptors/black-vulture · [12] inaturalist.org/guide_taxa/178464 ·
[13] en.wikipedia.org/wiki/Black_kite · [14] en.wikipedia.org/wiki/Yellow-legged_gull · [15] link.springer.com/article/10.1007/s10336-013-1020-x ·
[16] en.wikipedia.org/wiki/Asian_openbill · [17] en.wikipedia.org/wiki/Eastern_cattle_egret · [18] avifauna.hkbws.org.hk/species/0170/023000

## Države s pravimi progami: predlog vrste (še ni potrjeno, razen kjer piše)

Predlog je delovna domneva seje, **ne vir**. Vsaka vrstica potrebuje vir za kraj, število in formacijo, preden gre v kodo.

| Predlog vrste | Države (proge) | Stanje |
|---|---|---|
| Žerjav, klin | Nemčija (Nürburg) | potrjeno [1] [2]; Belgija, Švedska, Latvija, Finska: vir za kraj manjka |
| Planinska kavka, ohlapna jata | Švica (Furka), Francija (Izoard), Maroko (Dadès), Indija (Killar), Butan (Isuna) | območje potrjeno [4]; število manjka; Gruzija, Kazahstan, Albanija: ni vira |
| Škorec, gosta jata | Anglija, Wales, Irska, Avstrija, Slovenija, Slovaška, Italija, Tunizija | potrjeno le Združeno kraljestvo [6] |
| Siva gos, klin | Nizozemska, Danska, Češka | kraj potrjen za NL in DK [8]; formacija in število v letu manjkata |
| Črni jastreb, jadranje v skupini | Mehika, Salvador, Kostarika, Panama, Brazilija, Peru, Argentina | območje potrjeno [12]; Argentina manjka |
| Črni škarnik, jadranje | Japonska, Rusija (Altaj), Vietnam, Uganda | potrjena Japonska [13] |
| Rumenonogi galeb, ohlapna jata | Italija, Črna gora, Albanija, Španija, Portugalska (Madeira), Turčija | kraji potrjeni [14] [15]; število in formacija manjkata |
| Azijski odprtokljuni štrk | Tajska (Buriram) | potrjeno [16]; število manjka |
| Kravja čaplja | Filipini, Indonezija, Šrilanka, Malezija | potrjena Šrilanka [17]; formacija manjka |
| Še brez raziskave | Avstralija, Kanada, ZDA, Čile, Jamajka, Sveta Lucija, Katar, Bahrajn, Kenija, Tanzanija, Angola, Madagaskar, Južna Afrika, Zelenortski otoki, Alžirija, Uzbekistan, Južna Koreja, Kitajska, Romunija, Norveška, Fidži, Samoa, Palau, Papua Nova Gvineja | vrsta še ni izbrana |

## Naslednji koraki

1. Dokončati raziskavo (manjkajoče države in številke); za to dovoliti `en.wikipedia.org` v omrežju okolja ali nadaljevati z iskanjem.
2. Koda brez odvisnosti od raziskave: dirkališča brez živali; ptice na dirkališčih v petini časa (`wait` × 5).
3. Modeli ptic v 2–3 stopnjah podrobnosti, slike, vprašanje na stran Odločitve.
4. Vrsta po državi v datoteki proge (število, formacija, let), samo za potrjene vrstice.
