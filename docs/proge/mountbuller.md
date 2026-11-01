# Mount Buller, Avstralija (dirka, kronometer, promet, policija)

[← Vse proge](../../README.md#proge) · proga `mountbuller` (`js/tracks/mountbuller.js`, svet `js/world-mountbuller.js` na podatkovnem graditelju `js/world-gore.js`)

Mount Buller v Viktorijskih Alpah (Victoria, Avstralija) sredi smučarske sezone, proga 1 sklopa kratkih prog (`docs/gorske-proge.md`). Proga se začne v smučarski vasi na 1.611 m (cesta, ki pride v vas, ~400 m pred začetkom ceste okoli vrha), gre skozi vas med kočami in apartmajskimi hišami, čez smučišča in pod štirimi sedežnicami, nato zadnjih ~1,4 km po makadamskem delu ceste, ki je v sezoni steptan sneg, do cilja na 1.731 m pod vrhom (−37,146°, 146,453° na startu). 2,5 km med startom in ciljem, ena serpentina in osem ostrejših ovinkov. **Vozi se po levi** (`def.leftHand`).

- **Dirka**: 21 tekmecev, štartna mreža za startom v vasi, ena vožnja do cilja; po cilju vsak avto zapelje na svoje mesto ob cesti (iztek ~160 m do konca ceste pod vrhom).
- **Kronometer**: sam proti uri, štiri kontrolne točke z vmesnimi časi in višino, medalje (zlata 1:18, srebrna 1:22, bronasta 1:28, v dežju 1:26 / 1:31 / 1:37; zlato je čas relijskega avta na avtopilotu × 1,01, izračuna ga `tools/nova-proga.mjs --medalje`).
- **Promet**: dvoboj z enim tekmecem po odprti cesti v smučarski sezoni: avtomobili in terenci, kombiji, avtobusi do vasi, nekaj tovornjakov za oskrbo, brez motoristov.
- **Policija**: beg pred policijo do vrha ceste; brez helikopterja (`def.noHeli`). Patrulje imajo generičen napis POLICE.
- **Ovinki in imena na zaslonu**: Smučarska vas, Serpentina 1 (levo, ~160°), Žičnica (dvakrat: sedežnici tik ob cesti in nad njo), Smučišče (začetek steptanega snega), Vrh vzpona (najvišja točka, 1.738 m). Table ovinkov so rumeni romboidi s puščico, 90 m pred vsakim ovinkom nad 70°.
- **Oblika in višine**: sredinska črta iz OpenStreetMap (zglajena, edina serpentina odprta na polmer 12 m: premik ~0,3 m v povprečju), višine iz Copernicus GLO-30 (drseča mediana, glajenje, serpentina bolj položna, naklon do 11 %). Asfalt je širok 10 m, na makadamu 9 m (`def.widths`): prava cesta je ožja, a mora biti prostora za 22 avtov.
- **Zakaj ta odsek**: cesta okoli vrha je od vasi do konca pod vrhom dolga le ~2,3 km; da je dirka dolga 2,5 km, se začne na cesti, ki pride v vas, in s štartno mrežo (~260 m) sega še globlje v vas. Na odseku so žičnice v kadru kamere na ~39 % poti, smučišča na ~76 % (merilo načrta).

Okolica (podatkovni graditelj `World.gore` v `js/world-gore.js` s slogom proge v `js/world-mountbuller.js`; teren in raba tal po Vršičevem koridorju):

- **Sneg povsod**: svet je vedno v smučarski sezoni (`world.ownSeason`: enak v vseh letnih časih; pozimi doda igra še sneženje namesto dežja). Smučarske proge (OSM `piste:type`) so svetlejši, zgoščen sneg, v kotanjah in pod drevesi je sneg modrikast, na strmih skalah se kaže kamen, ob cesti so splužene snežne grude s sivo brozgo ob asfaltu, bankine so sive.
- **Cesta**: avstralske bele črte (robni črti, prekinjena sredinska, dvojna neprekinjena skozi ostrejše ovinke), na makadamskem delu steptan sneg s temnejšimi kolesnicami, jeklene ograje, kjer teren pada, oranžno-črni snežni količki in beli smerniki (podirljivi).
- **Vas**: koče, apartmajske hiše in lope iz obrisov OpenStreetMap (178 stavb ob cesti, poenostavljene, s snegom na strehah), 8 stranskih cest (ulice in servisne poti, brez imen), parkirišča z zasneženimi avtomobili.
- **Smučišče**: sedežnice in vlečnice iz OpenStreetMap (stebri na pravih legah, postaje z vrtiljakom, vrvi, sedeži, ki se premikajo, na večini sedežev navzgor smučarji), smučarji na progah ob cesti (nekateri se spuščajo), oranžne varovalne mreže, kjer se proga približa cesti, snežni topovi, teptalnik pri spodnji postaji, akumulacijska jezera zamrznjena.
- **Drevesa**: snežni evkalipti (snow gum) po rabi tal (ESA WorldCover), sneg na krošnjah; skale s snegom na strmih pobočjih.
- **Dirka**: start z lučmi pod portalom START v vasi, merilna hišica, zastavice, portali kontrolnih točk z višino, cilj FINISH, gledalci v zimskih bundah ob startu, cilju, kontrolnih točkah in serpentini.
- **Pravna varnost**: brez imen smučišča, žičnic, koč in podjetij; transparent je generičen (HILL CLIMB), table so generične.
- **Približki**: drevesa, skale, smučarji, snežni topovi in gledalci so razporejeni po rabi tal in naklonu, ne po resničnih legah; stavbe, žičnice in postaje so poenostavljene; teren je izrisan do ~200 m od ceste (dlje ga kamera ne vidi).
