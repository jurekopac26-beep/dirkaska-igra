# Trebević, Bosna in Hercegovina (dirka, kronometer, promet, policija)

[← Vse proge](../../README.md#proge) · proga `trebevic` (`js/tracks/trebevic.js`)

Ozka cesta z jugovzhodnega roba Sarajeva na goro Trebević v pravem merilu (4,3 km). Proga se začne pri naselju Dolovi (813 m, ~43,85° S, 18,45° V) in se po severnem pobočju skozi bukov gozd povzpne skozi šest lasnic na strmem delu med ~940 in ~1060 m (najožja ~9 m). Ob cesti so v gozdu ostanki stare betonske bob steze, nato razgledišče Vidikovac nad mestom (~2,9 km). Na vrhu vzpona so ruševine utrdbe Draguljac (~3,2 km, ~1155 m), sledi kratek spust do cilja na ~1114 m.

- **Dirka**: tekmeci (v meniju *Opponents* največ 35: za ciljem je le ~170 m ozke ceste; `maxRivals`), štart pri Dolovih, en vzpon do cilja. Kvalifikacij ni (odprta cesta).
- **Kronometer**: sam proti uri, štiri kontrolne točke z vmesnimi časi in višino, lestvica, duh in medalje. Medalje: zlata 2:29, srebrna 2:37, bronasta 2:48; v dežju 3:01 / 3:10 / 3:25; pozimi 2:55 / 3:04 / 3:18, pozimi v dežju 3:37 / 3:47 / 4:05. Zlato je čas relijskega avta na avtopilotu.
- **Promet**: dvoboj z enim tekmecem po odprti cesti (avtomobili, kombiji, avtobus na goro, kak motorist in tovornjak, kolesarji na vzponu), promet po desni.
- **Policija**: beg pred policijo mimo Draguljca; patrulje imajo samo generičen napis POLICIJA.
- **Imena pod uro**: Dolovi, Bukov gozd, Lasnice · 944 m, Stara bob steza, Vidikovac · 1.138 m, Draguljac · 1.154 m. Samo zemljepisna in opisna imena, brez imen lokalov, žičnice in oseb.
- **Oblika in višine**: sredinska črta iz OpenStreetMap (prek Overture Maps), zglajena. Cesta je v igri široka ~6 m, dva ozka pasova. Višine iz Copernicus DEM GLO-30, očiščene: do 14 % navzgor v lasnicah in do 14 % navzdol s sedla za Draguljcem.
- **Brez padca**: ob cesti jeklene ograje (kjer jih ni videti, nevidna stena). Padec čez rob je samo na Killarju.
- **Izletna cona**: ovire do ~3 m od asfalta so na manj kot polovici dolžine (pravilo skupine #1090–#1097).

Okolica: skupna okolica prelazov `buildPrelaz` (`js/world-prelaz.js`) z videzom `PL_LOOK.trebevic` in lastnimi deli v `js/world-trebevic.js`.

- **Gorski gozd** poleti (Sentinel-2, 2. 7. 2025):
  - gost temnozelen gozd bukev in iglavcev, jase pri Dolovih in na vrhu;
  - svetel apnenec v usekih in v starem kamnolomu;
  - raba tal iz ESA WorldCover: gozd 81 %, grmičevje 8 %, pozidano 6 %, trava 5 %.
- **Ob cesti**:
  - stara bob steza: betonsko korito ob cesti (spodnji konec ~6 m od asfalta pri ~1,6 km, dvojni ovinek z nagibom ~8 m od ceste pri ~2,1 km, start zgoraj); kosi korita bližje kot 9 m od ceste niso narisani;
  - brv čez cesto na dveh stebrih (~5,6 m nad cesto);
  - razgledišče Vidikovac: ploščad z zidcem iz apnenčastih blokov na strani, kjer teren pada proti mestu;
  - stari kamnolom (stena in razsuti bloki) in ruševine utrdbe Draguljac (zidovi z vrzelmi) po obrisih iz OpenStreetMap;
  - vrv žičnice nad gozdom;
  - hiše iz obrisov 1234 stavb iz OpenStreetMap, s strehami iz rdeče in rjave opeke, generične in brez napisov.
- **Obzorje**: pravi teren ~9 km naokoli (Copernicus DEM) s sarajevsko kotlino in meglico pod goro.
- **Cesta**: bela prekinjena sredinska črta, jeklene ograje. Nobenih imen podjetij ali znakov služb.
- **Živali**: srne in lisice v gozdu.
- **Približki**: drevje, skale in gledalci so razporejeni po rabi tal in legi ob cesti, ne po resničnih legah. Hiše, korito bob steze, brv in ruševine so preproste oblike po obrisih.

Podatke proge pripravi orodje `tools/proga/proga.py` (`python3 tools/proga/proga.py trebevic --zapisi`, nastavitve v `tools/proga/proge.json`, pot izbrana s `tools/trebevic/config.json`). Vire glej v `README.md` pod »Zasluge«.
