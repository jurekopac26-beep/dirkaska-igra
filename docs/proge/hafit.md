# Džebel Hafit, Združeni arabski emirati (dirka, kronometer, promet, policija)

[← Vse proge](../../README.md#proge) · proga `hafit` (`js/tracks/hafit.js`)

Gorska cesta na severni konec Džebel Hafita, osamljenega apnenčastega grebena na meji z Omanom južno od Al Aina, v pravem merilu (4,85 km): najbolj ovinkast del ceste. Proga se začne ob vznožju grebena (376 m, ~24,10° S, 55,76° V), gre skozi prvo vrsto lasnic na golem pobočju nad prodnato ravnino, po useku v apnenčasti steni in skozi zadnje ovinke do ~769 m; cilj je tik za tem. Ves čas navzgor, devet lasnic.

- **Dirka**: 21 tekmecev (v meniju *Opponents* do 95, `maxRivals`), štart ob vznožju, en vzpon do vrha. Kvalifikacij ni (odprta cesta).
- **Kronometer**: sam proti uri, štiri kontrolne točke z vmesnimi časi in višino, lestvica, duh in medalje (zlata 2:20, srebrna 2:27, bronasta 2:38, v dežju 2:50 / 2:59 / 3:12; zlato je čas relijskega avta na avtopilotu).
- **Promet**: dvoboj z enim tekmecem po odprti cesti (avtomobili, kombiji, avtobusi, kak tovornjak, motoristi, ob cesti kolesarji).
- **Policija**: beg pred policijo do vrha; patrulje imajo samo generičen napis POLICE.
- **Imena pod uro**: Prva lasnica · 480 m, Serpentine · 509 m, Apnenčasta stena · 555 m, Nad puščavo · 605 m, Razgledišče · 671 m, Vrh vzpona · 758 m (samo zemljepisna in opisna imena; brez imen hotela na vrhu, parka ob vznožju in trgovin).
- **Oblika in višine**: sredinska črta iz OpenStreetMap (zglajena, najtesnejši ovinki odprti na polmer ~9 m), cesta v igri široka 10 m: vozni pas navzgor z dvema pasovoma (dirka teče po njem); pas navzdol za sredinskim ločilnim pasom v igri ni narisan. Višine iz Copernicus DEM GLO-30, očiščene: ves čas navzgor, največ 12 %.
- **Brez padca**: ob vsej cesti jeklena varnostna ograja (kjer je ni videti, nevidna stena); padec čez rob je samo na Killarju (odločitev uporabnika 13. 11. 2026). Ograja je do ~3 m od roba na več kot polovici dolžine; progo je uporabnik izbral kot izjemo pravila izletne cone (14. 11. 2026).

Okolica (skupna okolica prelazov `buildPrelaz` v `js/world-prelaz.js` z videzom `PL_LOOK.hafit` in lastnimi deli v `js/world-hafit.js`):

- **Pozna jesen v puščavskem gorovju**: bled krem, bež in siv apnenec, rjava melišča in prod pod grebenom, nekaj suhega grmičevja, brez gozda (raba tal iz ESA WorldCover in Sentinel-2: melišča in golo tla 94 %, skala 3 %, grmičevje 1 %, pozidano 1 %).
- **Ob cesti**: visoke cestne svetilke vsakih ~42 m na strani ločilnega pasu (vsa cesta je razsvetljena), nekaj akacij nizko na produ, hiše z ravnimi strehami (obrisi 9 stavb iz OpenStreetMap, generične, brez napisov), razgledišče z nizkim kamnitim zidcem in senčnico (~3.750 m).
- **Obzorje**: pravi teren ~9 km naokoli (Copernicus DEM): greben in puščavska ravnina z meglico.
- **Cesta**: oznake ZAE (rumena robna črta ob ločilnem pasu na levi, bela na desni, bela prekinjena črta med pasovoma, v ovinkih neprekinjena), črno-rumene smerne table, jeklene ograje; nobenih imen podjetij ali znakov služb.
- **Dirka**: štart z lučmi, portali kontrolnih točk z višino, cilj s tablo JEBEL HAFEET · UAE; malo gledalcev (`fewFans`), redarji in snemalci; divje koze na policah, kakšna kamela ob vznožju.
- **Približki**: akacije, skale, svetilke in gledalci so razporejeni po rabi tal in legi ob cesti, ne po resničnih legah; hiše so preproste oblike po obrisih.

Podatke proge pripravi orodje `tools/proga/proga.py` (`python3 tools/proga/proga.py hafit --zapisi`, nastavitve v `tools/proga/proge.json`). Vire glej v `README.md` pod »Zasluge«.
