# Spa, Belgija: raziskava za dodelavo (O-28-6, O-28-7, O-28-17)

Lastnik: biketraveler. Vir za vrstice komentatorja in zanimivosti v `js/tracks/spa.js` (veja `dodelava/spa`). Samo zemljepisna imena, brez oseb, podjetij in prireditev.

## Kraj
- Ardeni, provinca Liège, Valonija; proga med vasjo Francorchamps (ob La Source) in dolino potoka Eau Rouge. Krog 7,004 km v smeri urinega kazalca (OSM).
- Višina (Relief de la Wallonie, MNT 2021-2022, © SPW, CC BY 4.0; že v `SPA_H`): start ~417 m, dno Eau Rouge ~390 m, najnižje Dolgi desni ~367 m, najvišje Malmedy ~469 m; 102 m razlike, Raidillon do 16 %.
- Potok Eau Rouge (OSM `brook` v datoteki proge) prečka progo dvakrat: ~953 m po startu (med Eau Rouge in Raidillonom) in ~5027 m (Dolgi desni). Izvira na Visokih Fenih (Hautes Fagnes), dolg ~15 km, desni pritok Amblève pri Stavelotu; po njem se imenuje ovinek ([Wikipedia: Eau Rouge](https://en.wikipedia.org/wiki/Eau_Rouge)). Razlage barve (železo) viri ne potrjujejo, zato je ni v igri.

## Podnebje
- Vlažno, spremenljivo; v Spa ~1100 mm padavin na leto, na vrhu Visokih Fenov ~1450 mm ([climatestotravel](https://www.climatestotravel.com/climate/belgium), [Wikipedia: Botrange](https://en.wikipedia.org/wiki/Botrange)); v Francorchampsu največ januarja (~121 mm) in junija (~116 mm) ([weerplaza](https://www.weerplaza.nl/wereldweer/europa/belgie/francorchamps/9605/klimaat/neerslag/)). Planota Arden 300–500 m. Igra: `rainP 0.5` in sivkasta `look` ostaneta (že ustrezata).

## Kamnine in tla
- Stavelotski masiv: kambrijski in ordovicijski kvarciti in filiti, kaledonsko metamorfizirani (~450 mil. let), hercinsko zgubani v antiklinalo SV–JZ; pri Francorchampsu tudi felzitni pasovi ([Wikipedia: Stavelot Massif](https://en.wikipedia.org/wiki/Stavelot_Massif), [Geologica Belgica, ULiège](https://popups.uliege.be/0037-9395/index.php?id=1160)). Za Fable: sive in zelenkaste skale na usekih (Raidillon, Kemmel), temnejši skrilavi drobir; samo kot opis, senčil ta seja ne spreminja.

## Rastje
- Ardeni so močno zasajeni s smreko (ponekod do 50 %); v Valoniji smreka 25,9 % sestojev, hrast 16,8 %, bukev 9,3 % (2018); naravni gozd planote je bukov (hêtraie à luzule), hrast v visokih Ardenih redek ([ULiège, Forêt.Nature 165](https://orbi.uliege.be/bitstream/2268/301106/1/Latte%20N.%2c%20et%20al._Le%20point%20sur%20l%27%c3%a9quilibre%20feuil_r%c3%a9s%20et%20son%20%c3%a9vol_ForNat165_VULG2022.pdf)); po letu 2016 golosek smrek zaradi lubadarja ([ULiège 2024](https://orbi.uliege.be/bitstream/2268/320427/1/2024_Ernst_coupe_rase_dispo.pdf)).
- Raba tal OSM (`lc` v datoteki, 30 m od osi na obeh straneh): odprto 82 %, gozd 17 %, grmovje 1 %. Gozd neposredno ob cesti: ~1430–1610 m (Kemmel), ~2150–2250 m (pred Les Combes), ~3460–3600 m (pred Pouhonom), ~5710–5990 m (Blanchimont).

## Zgradbe ob progi (OSM, `bld`)
- 86 hiš in manjših stavb, 11 hal, 40 tribun, 32 boksov (dve vrsti: ob ciljni ravnini in ob spustu proti Eau Rouge), 27 redarskih postaj. Tribune ob La Source, ob spustu, nad Raidillonom.

## Imena
- Pouhon: valonska beseda za mineralni (železnat, gazirani) izvir, splošno ime izvirov v Spa ([RTBF](https://www.rtbf.be/article/spa-elements-du-patrimoine-historique-de-la-ville-les-pouhons-spadois-a-sec-seront-bientot-repares-11545203), [Bull. Soc. belge de géologie 1909](https://biblio.naturalsciences.be/rbins-publications/bulletin-de-la-societe-belge-de-geologie/023%20-%201909/bsbg_023_1909_mem_059-095.pdf)).
- Fagnes: Visoki Feni, šotna planota severno, kjer izvira Eau Rouge.

## Kaj je narejeno v igri (ta veja)
- `comm.intro`, `comm.go`: lastne vrstice ob startu (game.js `ownLine` zdaj tudi za krožne proge; drugim progam se nič ne spremeni).
- 19 zanimivosti: 14 ovinkov (6 z novo vrstico iz virov) in 5 krajev brez napisa na HUD (`hud: false`): Boksi ob spustu (700 m), Tribune nad Raidillonom (1110 m), Gozd ob Kemmlu (1500 m), Gozd pred Pouhonom (3520 m), Boksi (6880 m).

## Kaj ostane (ni te seje)
- Prelet (`def.fly`): `Render.pkFly` zna samo odprte ceste (`finishS = startS` na krogu); potrebuje sprememba v `render.js` za zanko.
- `alt`: `Track.altAt` interpolira med startom in ciljem, na krogu bi kazal stalno višino; potrebuje višino iz `elev`.
- Gozd ob progi, stavbe, tla, sonce, megla: odprti PR drugih (#668, #1052, #1121, #1124, #1128, #1130, #1132), se jih ne dotikam; opis `desc` tudi ne (#1121/#1124 imata ob njem spremembe).
