# Porto Moniz, Portugalska (dirka, kronometer, promet, policija)

[← Vse proge](../../README.md#proge) · proga `portomoniz` (`js/tracks/portomoniz.js`)

Zadnji del regionalne ceste ER101 na severozahodnem rtu Madeire, od vasi Santa po strmem severnem pobočju nad Atlantikom do mesteca Porto Moniz ob morju, v pravem merilu. Proga se začne nad vasjo (465 m, 32,8587° S, 17,1784° Z), gre skozi osem serpentin (vse zavijejo za več kot 150°) med terasami in se konča v mestu pri krožišču z vodnjakom (29 m, 32,8657° S, 17,1674° Z): 3,99 km in 436 m spusta. Za ciljem pelje cesta še ~190 m po mestu. Kartica proge je ena, na njej pa je stikalo **Dirka / Kronometer / Promet / Policija** (kot na Bâlei):

- **Dirka**: 21 tekmecev (v meniju *Opponents* do največ 95; `maxRivals`), start nad vasjo Santa (štartna mreža za črto), en spust do morja. Kvalifikacij ni (odprta cesta), v karieri je nagrada kot za dirko na 4 km.
- **Kronometer**: sam proti uri, štiri kontrolne točke z vmesnimi časi in višino, lestvica najboljših 10, duh in medalje (zlata 2:07, srebrna 2:14, bronasta 2:24, v dežju 2:18 / 2:24 / 2:35; zlato je čas relijskega avta na avtopilotu, kot na Vršiču).
- **Promet**: dvoboj z enim tekmecem po odprti cesti, glavni cesti otoka do mesta poleti: najeti avtomobili turistov, kombiji domačinov, avtobusi in turistični avtobusi do kopališč, nekaj motoristov in tovornjakov; ob cesti kolesarji.
- **Policija**: beg pred policijo do morja (pregon se začne že na štartu, pobegneš čez cilj). Patrulje imajo ob bokih generičen napis POLÍCIA (brez imena ali znaka katere koli službe), v rezultatih pobega piše »Do morja v …«.
- **Serpentine**: na pravi cesti niso oštevilčene; igra jih šteje od zgoraj (Serpentina 1–8). Pod uro se izpišejo z višino (Serpentina 1 · 390 m … Serpentina 8 · 128 m), še razgledišči (290 m in 180 m), kapelica (288 m) in mesto na cilju (Porto Moniz · 29 m); komentator ima na tej progi svoje stavke ob startu, ob serpentinah, ob cilju in ob pobegu.
- **Oblika in višine**: sredinska črta je iz OpenStreetMap (zglajena, najožja serpentina ima polmer ~9 m, kraka serpentin sta narazen vsaj 17 m). OpenStreetMap nima podatka o širini ceste; v igri je cesta široka 9,5 m (prava je ožja), da je prostora za 22 avtov. Višine so iz višinskega modela Copernicus DEM GLO-30, očiščene (drseča mediana, glajenje, naklon omejen na 14 % samo tam, kjer je model strmejši): spust je na krakih med serpentinami (do ~14 %), serpentine so položnejše.

Okolica (gradi jo skupna okolica prelazov `buildPrelaz` v `js/world-prelaz.js` z videzom `PL_LOOK.portomoniz`, lastne znamenitosti in rastje v `js/world-portomoniz.js`):

- **Severna obala Madeire poleti**: jasno popoldne, sonce z jugozahoda, nad morjem rahla meglica. Strmo pobočje je v terasah: suhi kamniti zidovi teras po plastnicah, med njimi pašniki in grmišča (raba tal iz ESA WorldCover, satelitskih posnetkov Sentinel-2 in karte višin krošenj; polovica grmišč je v igri trava pašnikov). Gozd so sestoji evkaliptov in lovorja (namesto smrek skupne okolice), ob robu ceste modri agapanti, v mestu palme. Barve tal so iz satelitskega posnetka Sentinel-2 (15. 8. 2025).
- **Vinogradi**: na spodnjem delu pobočja majhne parcele v vetrobranih iz suhe rese (rjave ograje iz protja), trte v vrstah na nizkih latnikih.
- **Hiše**: bele hiše z oranžnimi opečnimi strehami po obrisih stavb iz OpenStreetMap (namesto koč skupne okolice), z okni; brez imen in napisov.
- **Morje**: Atlantik kot ena vodna ploskev na višini morja (morsko dno višinskega modela je pod njo poglobljeno), pljuskanje valov ob črni lavi obale, otoček s svetilnikom (bel stolp, galerija, svetilka pod rdečo kapo) pred rtom, galebi nad obalo; v pogledu v daljavo ocean v temno modri.
- **Ob cesti**: razgledišče nad mestom in razgledišče nad obalo (tlakovana terasa ob cesti, nizek bel parapet z bazaltnim robom, klopi), kapelica ob cesti, na cilju krožišče z vodnjakom in kipom (samo oblika, brez podobe resnične osebe).
- **Obzorje**: onstran pasu ob cesti pravi teren ~9 km naokoli (Copernicus DEM, mreža 250 m) z morjem: pobočja z gozdom, planota nad njimi, bazaltne stene.
- **Cesta**: bela prekinjena sredinska črta (4 m črte, 10 m presledka, v serpentinah neprekinjena), bele robne črte, jeklene varnostne ograje, kjer teren pada, rdeče-bele table s puščicami na zunanji strani serpentin, opozorilni trikotniki; nobenih imen podjetij ali znakov služb.
- **Dirka**: start z lučmi pod portalom START, modri portali kontrolnih točk z višino, cilj FINISH s tablo PORTO MONIZ / MADEIRA, transparenta SANTA · PORTO MONIZ in 465 M → 29 M · 8 CURVAS (samo zemljepisna imena), redki gledalci ob startu, cilju in kontrolnih točkah.
- **Živali**: koze, krave, kokoši in osel majhnih kmetij na terasah.
- **Fotografije**: videz (bele hiše z oranžnimi strehami, terase s suhimi zidovi, vinogradi v vetrobranih, črna lava obale) je narejen po podatkih (OpenStreetMap, Sentinel-2) in splošnem poznavanju kraja, brez primerjave s fotografijami z istih mest.
- **Približki**: drevesa, rastline, zidovi teras, vinogradi in živali so razporejeni po rabi tal, višini in naklonu, ne po resničnih legah. Hiše so generične (bele stene, opečna streha), razgledišči, kapelica in svetilnik prav tako.
- **Pravno**: samo zemljepisna imena (Porto Moniz, Santa, Madeira); nobenih imen hotelov, restavracij, kavarn ali trgovin, kip v krožišču je samo oblika.

Podatke proge pripravi orodje `tools/proga/proga.py` (`python3 tools/proga/proga.py portomoniz --zapisi`, nastavitve v `tools/proga/proge.json`, opis v `tools/proga/README.md`). Vire glej v `README.md` pod »Zasluge«.
