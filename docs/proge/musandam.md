# Musandam, Oman (dirka, kronometer, promet, policija)

[← Vse proge](../../README.md#proge) · proga `musandam` (`js/tracks/musandam.js`)

Obalna cesta zahodno od Khasaba na polotoku Musandam ob Hormuški ožini, vsekana v gol apnenec pečin nad zalivi, v pravem merilu (3,9 km). Proga se začne ob morju (9 m, ~26,22° S, 56,23° V), gre ob obali meter ali dva nad vodo mimo zaliva in zaselka Hanna, nato se v vrsti ovinkov vzpne po steni pečine do zaselka na polici in čez vrh vzpona (~194 m); cilj je tik za njim. Morje je ves čas na desni (Oman vozi po desni), na vzponu globoko spodaj.

- **Dirka**: 21 tekmecev (v meniju *Opponents* do 95, `maxRivals`), štart ob morju, en vzpon do vrha. Kvalifikacij ni (odprta cesta).
- **Kronometer**: sam proti uri, štiri kontrolne točke z vmesnimi časi in višino, lestvica, duh in medalje (zlata 1:44, srebrna 1:49, bronasta 1:57, v dežju 2:05 / 2:11 / 2:21; zlato je čas relijskega avta na avtopilotu).
- **Promet**: dvoboj z enim tekmecem po odprti cesti (avtomobili, kombiji, kak tovornjak in avtobus, motoristi, ob cesti kolesarji).
- **Policija**: beg pred policijo do vrha; patrulje imajo samo generičen napis POLICE.
- **Imena pod uro**: Zaliv · 1 m, Hanna · 1 m, Pečine · 80 m, Nad zalivom · 103 m, Zaselek · 156 m, Vrh vzpona · 194 m (samo zemljepisna in opisna imena).
- **Oblika in višine**: sredinska črta iz OpenStreetMap (zglajena), cesta v igri široka 10 m; višine iz Copernicus DEM GLO-30, očiščene: ob obali do ~1.100 m skoraj ravno (manj kot 6 m nad morjem), nato vzpon do 14 % (navzdol največ 7 %).
- **Brez padca**: na strani prepada stoji jeklena varnostna ograja (kjer je ni videti, nevidna stena); padec čez rob je samo na Killarju (odločitev uporabnika 13. 11. 2026). Ograja ali hiše do ~3 m od roba so na več kot polovici dolžine; po odločitvi 13. 11. 2026 to ni ovira.

Okolica (skupna okolica prelazov `buildPrelaz` v `js/world-prelaz.js` z videzom `PL_LOOK.musandam` in lastnimi deli v `js/world-musandam.js`):

- **Pozna jesen v puščavskem gorovju**: bled sivo-bež apnenec v pečinah, rjava melišča in prod suhih vadijev, redko suho grmičevje, brez gozda (raba tal iz ESA WorldCover in Sentinel-2: trava 39 %, melišča 52 %, skala 7 %, pozidano 2 %).
- **Morje**: ena gladina na višini morja v modro-zeleni barvi zaliva (dno višinskega modela je pod njo poglobljeno), tudi na obzorju.
- **Ob obali**: ribiški čolni na produ in leseni čolni (dau) na sidru, datljeve palme vasi ob zalivu, nekaj hiš ob zalivu.
- **Na vzponu**: zaselek na polici z ravnimi strehami (obrisi 19 stavb iz OpenStreetMap, generični, brez napisov), akacije v suhih vadijih, razgledišče nad zalivom (~2.385 m).
- **Obzorje**: pravi teren ~9 km naokoli (Copernicus DEM): grebeni polotoka, zalivi in morje.
- **Cesta**: omanske oznake (bela prekinjena sredinska črta, v ovinkih neprekinjena), črno-rumene smerne table, rdeči opozorilni trikotniki, jeklene ograje na strani prepada; nobenih imen podjetij ali znakov služb.
- **Dirka**: štart z lučmi, portali kontrolnih točk z višino, cilj s tablo MUSANDAM · OMAN; malo gledalcev (`fewFans`), redarji in snemalci.
- **Približki**: palme, akacije, skale, čolni in gledalci so razporejeni po rabi tal in legi ob cesti, ne po resničnih legah; hiše so preproste oblike po obrisih. Ni imen hotelov, izletov z ladjami ali trgovin.

Podatke proge pripravi orodje `tools/proga/proga.py` (`python3 tools/proga/proga.py musandam --zapisi`, nastavitve v `tools/proga/proge.json`). Vire glej v `README.md` pod »Zasluge«.
