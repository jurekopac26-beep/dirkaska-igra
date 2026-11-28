# Pikes Peak (makadam), ZDA (kronometer, dirka)

[← Vse proge](../../README.md#proge) · proga `pikesg` (`js/tracks/pikesg.js`); različica proge [Pikes Peak](pikes.md) (`pikes`)

Zgodovinski vzpon na Pikes Peak po makadamu, kot pred letom 2011, ko je bil večji del ceste na vrh neasfaltiran. Cesta je ista kot na asfaltni različici: postavitev, višine od 2862 m do vrha na 4301 m, kraji, ovinki, kontrolne točke CP1–CP4 in okolica (svet `js/world-pikes.js`). Drugačna je podlaga: rožnato siv granitni gramoz s kolesnicami in valovi, brez robnikov, z manj oprijema; za avtom se dvigata prah in kamenje. Svoje ima tudi rastje ob cesti (prašni pas, `js/world-pikesg.js`), vreme, komentatorja in živali.

- **V meniju** proga nima svoje kartice: izbereš jo na kartici Pikes Peak z možnostjo *Road · Gravel*. Takrat ploščica *Single race* na naslovnici pokaže maketo makadama (`assets/tracks/pikesg.webp`, v dežju `pikesg-rain.webp`); kartica proge kaže zemljevid od zgoraj, skupen obema različicama.
- **Načini** so isti kot na asfaltu (kronometer in dirka z 21 tekmeci), rekordi, duhovi in lestvice razredov pa so ločeni (svoj `id`).
- Zemljevid od zgoraj, prelet in uvod so skupni z asfaltno različico.

## Kraj (raziskava)

- **Lega.** Pikes Peak je najvzhodnejši štiritisočak Skalnega gorovja, v pogorju Front Range v Koloradu, ~16 km zahodno od Colorado Springsa, v narodnem gozdu Pike. Cesta na vrh se začne v dolini Ute Pass; dirkalna proga teče od 11. km ceste (2862 m) do vrha (4301 m): 19,99 km in 156 ovinkov.
- **Kamnina.** Vsa gora je iz pikesovskega granita (predkambrij, ~1,1 milijarde let): debelozrnat, rožnat do oranžen zaradi kalijevega glinenca. Na zraku razpada v grus, drobljiv granitni pesek in gramoz. **Iz tega je bil makadam**: rožnato siv, ostrorob, ob suhem vremenu prašen, po dežju blaten in razbrazdan. Nad gozdno mejo stojijo stolpi in balvani iz istega granita (Devil's Playground, Boulder Park).
- **Podnebje in vreme.** Polsuho celinsko gorsko podnebje. Poleti so jutra jasna, popoldne pa skoraj vsak dan nastanejo nevihte s strelami in točo (od tod ime Devil's Playground: strele skačejo med skalami). Na vrhu je povprečna letna temperatura pod lediščem in sneg lahko pade v katerem koli mesecu; piha močan zahodni veter. Dirka je bila konec junija ali v začetku julija, zjutraj.
- **Rastje po višini.** Spodaj (do ~3000 m) gorski gozd: duglazija, rumeni bor in skupine trepetlike. Više (~3000–3500 m) subalpski gozd: Engelmannova smreka, upogljivi bor in, ob gozdni meji, stari ščetinasti bori. Gozdna meja je na ~3500–3600 m; tam drevesa rastejo kot nizko, od vetra skrivljeno grmičje (krummholz). Nad njo je alpska tundra: šaši in trave, blazinaste rastline, lišaji na granitu, veliko golega grusa. Ob cesti še navadni brin, medvednica (gostolistnica) in petoprstnik.
- **Makadam in prah.** Cesto so do leta 2011 ravnali z grederji; ob robu je ostajal nasip rahlega gramoza (»windrow«), vozišče je imelo kolesnice in valove (»washboard«). Prah se je nabiral na rastju ob cesti, nalivi pa so gramoz odnašali v jarke, potoke in zbiralnike pod cesto. Zaradi erozije so cesto od leta 1998 do 2011 postopoma asfaltirali; dirka leta 2012 je bila prva povsem po asfaltu.
- **Gradnja ob cesti.** Ob makadamski cesti je bilo manj ograj kot danes; ob njej so jarki, prepusti pod cesto, snežni količki nad gozdno mejo, odstavna mesta in razgledišča. Glavne točke: zbiralnik Crystal, piknik prostor Halfway, gostišče Glen Cove, lasnice »W«, Devil's Playground, Bottomless Pit, Boulder Park in vrh z zobato železnico. Vse to že postavlja svet `js/world-pikes.js`.
- **Živali.** Jelenjad (wapiti), mulasti jeleni, debelorogi ovni nad gozdno mejo, svizci in žvižgači na balvanih, kojot.

## Kaj ima makadamska proga svoje

- **Podlaga**: svoj material vozišča (`js/world-pikes.js`, `roadSurface: 'makadam'`): granitni gramoz s kolesnicami, nasipom ob robu in valovi; obcestje (`js/world-chase-bt52.js`, `js/world-chase-bt82.js`).
- **Rastje ob cesti** (`js/world-pikesg.js`, samo za `pikesg`): prašni pas, ki ga je makadam pustil na rastju. Pod gozdno mejo nizek brin, medvednica in petoprstnik, posuti z rožnato sivim prahom (bolj ob cesti, manj stran od nje); nad gozdno mejo blazinaste rastline in šopi trav tundre med grusom; pod cesto, kjer pobočje pada, vršaji odplavljenega gramoza (erozija).
- **Vreme**: verjetnost dežja 0,45 (popoldanske nevihte; na asfaltu 0,35, privzeto), prag oblakov skupen s temo.
- **Komentator**: svoje vrstice za uvod in štart dirke ter ob zanimivostih (prah, gramoz, kolesnice, nevihte).
- **Živali in predmeti**: tudi kojot; ob cesti štori in kup hlodov od gradnje.

## Vir

- **Pot in višine**: postavitev in višine (`points`, `elev` v `js/tracks/pikes.js`) sta ročno narisani, pomanjšana različica (~6,2 km, ~440 m vzpona) resnične ceste; ne uporabljata podatkov OpenStreetMap ne višinskega modela. Resnične številke (19,99 km, 156 ovinkov, start na 2862 m, vrh na 4301 m) so splošno znana zemljepisna dejstva.
- **Kraj** (kamnina, rastje, podnebje, makadam in asfaltiranje): javna dela zveznih ustanov ZDA (geološki zavod USGS, gozdna služba USDA Forest Service), v javni lasti (*public domain*); vpisano v `README.md`, »Zasluge«.
