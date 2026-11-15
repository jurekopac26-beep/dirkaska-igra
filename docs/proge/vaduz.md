# Vaduz, Lihtenštajn (dirka, kronometer, promet, policija)

[← Vse proge](../../README.md#proge) · proga `vaduz` (`js/tracks/vaduz.js`)

Kratka ovinkasta cesta nad Vaduzom, od zadnjih hiš mesta do gradu na skalni polici nad dolino Rena, v pravem merilu (0,8 km). Proga se začne nad strehami mesta (522 m, ~47,14° S, 9,52° V), gre v blagih zavojih ob robu gozda navzgor, skozi dve tesni lasnici eno za drugo in pod gradom do cilja (~585 m). Kratka proga z znamenitostjo po odločitvi uporabnika 15. 11. 2026 (`docs/proge-po-drzavah.md`, »Kratke proge z znamenitostjo«).

- **Dirka**: do 20 tekmecev (v meniju *Opponents*, `maxRivals`; kratka cesta), štart nad mestom, en vzpon do gradu. Kvalifikacij ni (odprta cesta).
- **Kronometer**: sam proti uri, štiri kontrolne točke z vmesnimi časi in višino, lestvica, duh in medalje (zlata 0:29, srebrna 0:31, bronasta 0:33, v dežju 0:35 / 0:37 / 0:39; zlato je čas relijskega avta na avtopilotu).
- **Promet**: dvoboj z enim tekmecem po odprti cesti (avtomobili, kombiji, kak avtobus in tovornjak, motoristi, ob cesti kolesarji).
- **Policija**: beg pred policijo do vrha; patrulje imajo samo generičen napis POLICE.
- **Imena pod uro**: Nad mestom · 548 m, Prva lasnica · 563 m, Druga lasnica · 565 m, Pod gradom · 582 m (samo opisna imena; grad, ulice in lokali niso imenovani).
- **Oblika in višine**: sredinska črta iz OpenStreetMap (prek Overture Maps, zglajena, najtesnejši ovinki odprti na polmer ~10 m), cesta v igri široka 8,4 m z dvema pasovoma. Višine iz Copernicus DEM GLO-30, očiščene: ves čas navzgor, največ 12 %.
- **Brez padca**: ob cesti jeklena varnostna ograja (kjer je ni videti, nevidna stena); padec čez rob je samo na Killarju (odločitev uporabnika 13. 11. 2026). Zid, hiša ali ograja je do ~3 m od roba na ~44 % dolžine (pod mejo izletne cone).

Okolica (skupna okolica prelazov `buildPrelaz` v `js/world-prelaz.js` z videzom `PL_LOOK.vaduz` in lastnimi deli v `js/world-vaduz.js`):

- **Pozno poletje v dolini Rena**: zeleni travniki, bukov in smrekov gozd na pobočju nad mestom, siv apnenec Alp za njim (raba tal iz ESA WorldCover, Sentinel-2 in karte višine krošenj: gozd 54 %, pozidano 21 %, grmičevje 15 %, trava 8 %, melišča 1 %).
- **Grad**: samo od zunaj, iz 15 delov stavbe v OpenStreetMap (`building:part`, obrisi in višine): zidovi iz sivega kamna in belega ometa, štirikapne strehe iz rdeče opeke, piramidni strehi stolpa in okroglega bastiona, majhna temna okna na straneh proti cesti. Brez napisov, grbov, zastav, kipov in umetnin.
- **Ob cesti**: hiše mesta pod cesto (obrisi iz OpenStreetMap, generične, z rdečimi strehami, brez napisov), rob gozda, travniki; krave na pašniku, srne in lisica.
- **Obzorje**: pravi teren naokoli (Copernicus DEM): dno doline Rena, gozdnata pobočja in sivi vrhovi Alp z nekaj snega na najvišjih.
- **Cesta**: bela prekinjena sredinska črta (3 m / 6 m, v lasnicah neprekinjena), bele robne črte, trikotni opozorilni znaki, črno-bele smerne table, jeklene ograje; nobenih imen podjetij ali znakov služb.
- **Dirka**: štart z lučmi, portali kontrolnih točk z višino, cilj s tablo VADUZ · LIECHTENSTEIN; malo gledalcev (`fewFans`), redarji in snemalci.
- **Približki**: drevesa, skale in gledalci so razporejeni po rabi tal in legi ob cesti, ne po resničnih legah; hiše in grad so preproste oblike po obrisih.

Podatke proge pripravi orodje `tools/proga/proga.py` (`python3 tools/proga/proga.py vaduz --zapisi`, nastavitve v `tools/proga/proge.json`). Vire glej v `README.md` pod »Zasluge«.
