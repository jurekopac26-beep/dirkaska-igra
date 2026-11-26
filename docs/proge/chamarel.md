# Chamarel, Mavricij (dirka, kronometer, promet, policija)

[← Vse proge](../../README.md#proge) · proga `chamarel` (`js/tracks/chamarel.js`)

Cesta z jugozahodne obale Mavricija na planoto Chamarela v pravem merilu (5,0 km). Proga se začne nad obalo pri Case Noyale (34 m, ~20,42° J, 57,37° V) in se po gozdnatem pobočju povzpne skozi tri lasnice (~1,8, 2,2 in 2,5 km). Najvišja točka vzpona je razgledišče (~297 m, ~2,9 km). Cesta se nato spusti v vas Chamarel in se znova dvigne proti Plaine Champagne. Cilj je na ~373 m.

- **Dirka**: tekmeci po izbiri v meniju (*Opponents*), štart nad obalo, en vzpon do cilja. Kvalifikacij ni (odprta cesta).
- **Kronometer**: sam proti uri, štiri kontrolne točke z vmesnimi časi in višino, lestvica, duh in medalje. Medalje: zlata 2:44, srebrna 2:52, bronasta 3:05; v dežju 3:18 / 3:28 / 3:44. Zlato je čas relijskega avta na avtopilotu.
- **Promet**: dvoboj z enim tekmecem po odprti cesti (avtomobili, kombiji, avtobusi, kak tovornjak, motoristi, ob cesti kolesarji), **levi promet** kot na Mavriciju.
- **Policija**: beg pred policijo do Plaine Champagne; patrulje imajo samo generičen napis POLICE.
- **Imena pod uro**: Case Noyale, Gozd, Serpentine · 190 m, Razgledišče · 297 m, Chamarel, Proti Plaine Champagne · 338 m. Samo zemljepisna in opisna imena, brez imen posestev, lokalov in znamenitosti s plačljivim vstopom.
- **Oblika in višine**: sredinska črta iz OpenStreetMap, zglajena. Cesta je v igri široka ~7 m, dva ozka pasova, omejitev 40 km/h na večjem delu. Višine iz Copernicus DEM GLO-30, očiščene: do 13 % navzgor in do 9 % navzdol pri spustu v vas.
- **Brez padca**: ob cesti jeklene ograje (kjer jih ni videti, nevidna stena). Padec čez rob je samo na Killarju.

Okolica: skupna okolica prelazov `buildPrelaz` (`js/world-prelaz.js`) z videzom `PL_LOOK.chamarel` in lastnimi deli v `js/world-chamarel.js`.

- **Vlažno tropsko višavje** konec suhe dobe (Sentinel-2, 4. 9. 2025):
  - gost temnozelen gozd na pobočjih in svetlejša trava ob vasi;
  - rdeče-rjava vulkanska prst v brežinah in usekih, temen bazalt;
  - raba tal iz ESA WorldCover: gozd 69 %, trava 17 %, grmičevje 12 %, pozidano 1 %.
- **Ob cesti**:
  - razgledišče na vrhu vzpona: tlakovano postajališče z nizkim zidcem iz bazalta na strani, kjer teren pada proti obali;
  - sladkorni trs na odprtem svetu okoli vasi;
  - hiše iz obrisov 53 stavb iz OpenStreetMap, pod valovito pločevino (siva, rdeča, modra, zelena) ali ravnimi betonskimi strehami, generične in brez napisov.
- **Obzorje**: pravi teren ~9 km naokoli (Copernicus DEM) z oceanom in meglico pod pobočjem.
- **Cesta**: bela prekinjena sredinska črta (privzeta, ker za oznake ni vira), črno-rumene smerne table in jeklene ograje. Nobenih imen podjetij ali znakov služb.
- **Živali**: makaki v gozdu, čaplje ob cesti.
- **Približki**: trs, skale, drevje in gledalci so razporejeni po rabi tal in legi ob cesti, ne po resničnih legah. Hiše so preproste oblike po obrisih.

Podatke proge pripravi orodje `tools/proga/proga.py` (`python3 tools/proga/proga.py chamarel --zapisi`, nastavitve v `tools/proga/proge.json`). Vire glej v `README.md` pod »Zasluge«.
