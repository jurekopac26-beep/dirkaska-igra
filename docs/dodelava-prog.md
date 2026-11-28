# Dodelava prog do ravni Pikes Peaka

Matejeve odločitve O-28-6, O-28-6 (dodatek) in O-28-9 (PR #1162): druge prave proge dobijo enako raven kot Pikes Peak, vsaka po svojem kraju in državi. Ta dokument samo analizira, kode igre ne spreminja. Stanje `main` 28. 11. 2026, upoštevane so samo prave proge (brez `test: true` in `pending: true`).

## Merilo (kaj ima Pikes Peak)

Merilo našteva, kaj mora proga imeti. Ne pove, kako to narediti: vsaka proga to doseže s tem, kar je značilno za njen kraj.

1. **Svet in teren po kraju**: lasten graditelj sveta (`js/world-pikes.js`, ~4600 vrstic), višinska mreža terena, daljno ozadje in voda (rezervoar). Ni le skupni graditelj s parametri.
2. **Obcestje**: varovalne ograje, robovi, jarki, odstavna mesta in označbe, kot jih ima ta cesta (`pikesProps` v `js/world.js`).
3. **Zanimivosti do 60 m**: 15 poimenovanih krajev v `names[]`, vsak z vrsticami komentatorja (`say`) in mestom na preletu (seznam PL v `js/render.js`).
4. **Rastje**: pravi pasovi rastja po višini, vključno z gozdno mejo v `render.js` in `sfx-okolje.js`. Pri Pikes Peaku je to še vrzel (`docs/realizem.md`, paket G).
5. **Gradnja ob cesti**: samo tisto, kar ob cesti res stoji.
6. **Svetloba in ura**: `look` z lastnim soncem, razdelitvijo neba in meglico. V `render.js` ima še mehke sence, prah in blesk na avtu.
7. **Vreme**: različica za dež, sneg pozimi, prag oblakov `cloudTh` in svoja inačica podlage (`pikesg`, makadam).
8. **Zvok**: svoj veter in odmev po višini (`atmoUpdate` v `js/sfx.js`), poseben primer v `sfx-okolje.js`.
9. **Komentator**: vrstice za uvod in štart (`comm`) ter vrstice ob zanimivostih.
10. **Dejstva**: `realKm`, `alt`, številke ovinkov (`turnNos`, 156), živali in predmeti (`zivali`).
11. **Meni in slike**: `assets/tracks/<id>.webp` in `<id>-rain.webp`. Vse proge jih že imajo.
12. **Opis in viri**: `docs/proge/<id>.md` in vir z licenco v `README.md`, »Zasluge«. Opis Pikes Peaka ima samo 10 vrstic; drugje naj bo opis bogatejši.

## Ocena vrzeli

Lestvica:

- **5** = skoraj vse manjka: majhen svet, brez komentatorja, zanimivosti brez vrstic.
- **4** = manjka večina točk merila.
- **3** = ima svoj svet, manjkajo pa komentator, zanimivosti ali teren.
- **2** = manjka ena ali dve točki.
- **1** = skoraj na ravni Pikes Peaka.

Kratice: »svet N« je število vrstic v lastnem `world-<theme>.js` in `-obcestje.js`. »Prelaz« je skupni graditelj `world-prelaz.js` oziroma `world-cesta.js`. Stolpec »odprti PR« navaja PR, ki spreminjajo to progo; »tla ob cesti« so skupine #1133–#1171.

Večji sveženj PR, ki ga stolpec ne navaja: #608 (Trki). Spreminja datoteke sveta mnogih prog.

| Proga | Vrzeli | Ocena | Odprti PR | Račun |
|---|---|---|---|---|
| Tapini, Papua Nova Gvineja (`tapini`) | Svet 20 vrstic. Nobene zanimivosti, komentator le delno, brez številk ovinkov. Manjkata deževni gozd in strmina nad sotesko. | 5 | #1144 | biketraveler |
| Quezaltepeque, Salvador (`quezaltepeque`) | Svet 162 vrstic, 11 zanimivosti brez vrstic, brez komentatorja. Ni ognjeniškega ozadja ne rastja in stavb po kraju, ni `alt`. | 5 | #1060, #1080, #1146 | |
| Silkeborg, Danska (`silkeborg`) | Svet 134 vrstic, brez obcestja in komentatorja, 11 zanimivosti brez vrstic. Manjkata jezera in bukov gozd okoli steze. | 5 | #1087, #1155 | biketraveler |
| Bathurst, Avstralija (`bathurst`) | Svet 125 vrstic za gorsko stezo. Ni terena gore ne razgleda nad mestom, brez komentatorja, 10 zanimivosti brez vrstic. | 5 | #1140 | biketraveler |
| Koli, Finska (`koli`) | Lasten svet 17 vrstic, le 2 zanimivosti. Zima in jezero sta v skupnem; manjkata gozd tajge in razgled z vrha. | 4 | #1085, #1147 | croatiadata |
| Kanaba, Uganda (`kanaba`) | Svet 107 vrstic, 4 zanimivosti, brez obcestja. Manjkajo terase in jezera pod prelazom ter vasi ob cesti. | 4 | #1018, #1137 | |
| Krásna Hôrka, Slovaška (`krasnahorka`) | Svet 134 vrstic, 3 zanimivosti. Grad na griču kot glavna točka ni dodelan, manjkata vas in polja. | 4 | #1150 | biketraveler |
| Sepang, Malezija (`sepang`) | Svet 161 vrstic, brez obcestja in komentatorja, 18 zanimivosti brez vrstic. Manjkajo tropsko rastje, nasadi okoli in tribune po obrisih. | 4 | #1133 | biketraveler |
| Ghoufi, Alžirija (`ghoufi`) | Svet 215 vrstic, nobene zanimivosti. Manjkajo kanjon, palmovi gaji in stare vasi ob robu. | 4 | — | biketraveler |
| Aguascalientes, Mehika (`aguascalientes`) | Svet 233 vrstic, brez komentatorja, 6 zanimivosti brez vrstic. Ni sušnega rastja ne mesta za stezo, ni `alt`. | 4 | #1060, #1139 | |
| Ujarrás, Kostarika (`ujarras`) | Svet 136 + obcestje 442 vrstic, nobene zanimivosti. Manjkajo ruševine, dolina z jezerom in kavni nasadi. | 4 | #1060, #1159 | |
| Nürburg, Nemčija (`nring`) | Svet 515 vrstic, brez komentatorja, 32 zanimivosti brez vrstic, opis 6 vrstic. V pasu ob progi je gozd, v igri trava; od 61 stavb ob progi jih je v igri 19 (`realizem.md`). | 4 | #1060, #1052, #763, #678 | biketraveler |
| Livorno, Italija (`livorno`) | Mestna proga brez `look` in DEM, brez komentatorja, 19 zanimivosti brez vrstic. Stavbe so škatle, manjkajo svetilke in borovci (`realizem.md`). | 4 | #1125, #1052, #1016, #763, #657 | biketraveler |
| Hiva, Uzbekistan (`hiva`) | Svet 405 vrstic, brez DEM, komentatorja in vrstic ob 8 zanimivostih. Manjkata obzidje in minareti ob cesti v pravem razmerju. | 4 | #1171, #1079, #1016 | |
| Buriram, Tajska (`buriram`) | Svet 320 vrstic, brez obcestja in komentatorja, 14 zanimivosti brez vrstic. Manjkajo riževa polja okoli in stavbe po obrisih. | 4 | #1141 | biketraveler |
| Sakhir, Bahrajn (`sakhir`) | Svet 385 vrstic, brez komentatorja, 16 zanimivosti brez vrstic. Puščava in svetloba nočne dirke nista po kraju. | 4 | #1155 | biketraveler |
| Batangas, Filipini (`batangas`) | Svet 146 + obcestje 222 vrstic, brez komentatorja, 11 zanimivosti brez vrstic. Manjkajo morje, griči in nasadi. | 4 | #1088, #1143 | |
| Kågeröd, Švedska (`kagerod`) | Svet 174 + obcestje 276 vrstic, brez komentatorja, 12 zanimivosti brez vrstic. Manjkajo gozd in polja Skanije. | 4 | #1087, #1060, #1152, #1147 | biketraveler |
| Pembrey, Wales (`pembrey`) | Svet 143 + obcestje 326 vrstic, brez komentatorja, 10 zanimivosti brez vrstic. Manjkajo sipine in gozd ob obali. | 4 | #1132, #1146 | biketraveler |
| Termas de Río Hondo, Argentina (`riohondo`) | Svet 181 + obcestje 290 vrstic, brez komentatorja, 16 zanimivosti brez vrstic. Manjka jezero in grmičje ob stezi. | 4 | #1088, #1143, #1133 | biketraveler |
| Kildare, Irska (`kildare`) | Svet 223 + obcestje 252 vrstic, brez komentatorja, 9 zanimivosti brez vrstic. Manjkajo žive meje in barje. | 4 | #1125, #1123, #1120, #1081, #1142 | biketraveler |
| Zandvoort, Nizozemska (`zandvoort`) | Svet 267 + obcestje 406 vrstic, brez komentatorja, 13 zanimivosti brez vrstic. Sipine in morje niso dodelani. | 4 | #1138 | biketraveler |
| Sosnová, Češka (`sosnova`) | Svet 288 + obcestje 482 vrstic, brez komentatorja, 14 zanimivosti brez vrstic, brez `alt`. | 4 | #1081, #1013, #982, #1144 | biketraveler |
| Lombok, Indonezija (`lombok`) | Svet 292 vrstic, brez komentatorja, 17 zanimivosti brez vrstic. Manjkajo obala in ognjenik v ozadju. | 4 | #1100, #1156 | croatiadata |
| Tuzla, Turčija (`tuzla`) | Svet 299 vrstic, brez komentatorja, 16 zanimivosti brez vrstic. Manjkajo morje in mesto v ozadju. | 4 | #1099 | croatiadata |
| Isuna, Butan (`isuna`) | Svet 67 + obcestje 540 vrstic, 4 zanimivosti. Manjkajo samostani, molilne zastavice in terase po kraju. | 3 | #1157 | croatiadata |
| Cusco, Peru (`cusco`) | Svet 146 + obcestje 592 vrstic, 3 zanimivosti. Manjkata zidovi iz inkovskih časov in dolina pod mestom. | 3 | #1016, #1152 | biketraveler |
| Biķernieki, Latvija (`bikernieki`) | Obcestje 764 vrstic, svet 166, brez komentatorja, 17 zanimivosti brez vrstic. Manjka borov gozd okoli steze. | 3 | #1085, #1140 | biketraveler |
| Lusail, Katar (`lusail`) | Obcestje 614 vrstic, svet 230, brez komentatorja, 17 zanimivosti brez vrstic. Nočna svetloba ni po kraju. | 3 | #1013, #982, #1153 | biketraveler |
| Spa, Belgija (`spa`) | Svet 763 vrstic, brez komentatorja, 14 zanimivosti brez vrstic, opis 8 vrstic. Stavbe so škatle, manjka gozd ob progi (`realizem.md`). | 3 | #1132, #1130, #1128, #1124, #1121, #1052, #668 | biketraveler |
| Štajerska, Avstrija (`rbring`) | Velik svet (1529), brez komentatorja, 8 zanimivosti brez vrstic. Tribune in boksi niso na pravih obrisih (`realizem.md`). | 3 | #1052, #763, #1151 | biketraveler |
| Montréal, Kanada (`montreal`) | Svet 910 vrstic, brez komentatorja in DEM, 16 zanimivosti, le 2 z vrsticami. Paviljoni so poenostavljeni. | 3 | #1052, #763 | biketraveler |
| Katu-Jaryk, Rusija (`katu`) | Svet 944 vrstic, brez komentatorja. Macesni so povsod enako gosti (`realizem.md`). | 3 | #763 | biketraveler |
| El Jem, Tunizija (`eljem`) | Svet 413 + obcestje 658 vrstic, brez DEM in rastja. Amfiteater je glavna točka, mesto okoli je skopo. | 3 | #1158 | biketraveler |
| Isalo, Madagaskar (`isalo`) | Svet 346 vrstic, brez DEM in rastja, 4 zanimivosti. Manjkajo peščenjaški grebeni in savana. | 3 | — | biketraveler |
| Luanda, Angola (`luanda`) | Svet 466 + obcestje 402 vrstic, brez DEM. Manjkata zaliv z obalo in višina terena. | 3 | — | croatiadata |
| Mombasa, Kenija (`mombasa`) | Svet 477 + obcestje 452 vrstic, brez DEM. Manjkajo staro mesto in obala z otokom. | 3 | #1174, #1145 | biketraveler |
| Portobelo, Panama (`portobelo`) | Svet 476 vrstic, brez DEM in rastja. Manjkajo trdnjave ob zalivu in deževni gozd. | 3 | #1008 | biketraveler |
| Seul, Južna Koreja (`seoul`) | Svet 557 vrstic, brez DEM. Manjkata gore za mestom in reka. | 3 | #1148 | biketraveler |
| Bâlea, Romunija (`balea`) | Svet je skupni prelaz, 6 zanimivosti. Koče in postaja žičnice so preproste (`realizem.md`). | 3 | #1018, #763, #678, #1139 | |
| Canaries, Sveta Lucija (`canaries`) | Svet je skupni prelaz, 4 zanimivosti. Manjkata tropski gozd in vas ob zalivu. | 3 | #1018, #1141 | croatiadata |
| Vaoala, Samoa (`vaoala`) | Svet je skupni prelaz brez obcestja, 4 zanimivosti. Manjkata deževni gozd in obala pod cesto. | 3 | #1138 | croatiadata |
| Mã Pí Lèng, Vietnam (`mapileng`) | Svet je skupni (`world-kratke.js`), 4 zanimivosti. Manjkajo kanjon reke in terase. | 3 | #1153 | croatiadata |
| Pikes Peak (makadam), ZDA (`pikesg`) | Svet je Pikes Peakov. Manjka rastje (paket G), opis je kratek. | 2 | #1166 | |
| Kotor, Črna gora (`kotor`) | Svet je skupni prelaz brez obcestja, ima 14 zanimivosti z vrsticami. Zaliv in staro mesto spodaj nista po meri. | 2 | #1150 | croatiadata |
| Furka, Švica (`furka`) | Skupni prelaz z obcestjem, 9 zanimivosti z vrsticami. Manjkajo ledenik in lastni zvok višine. | 2 | #1132, #1154 | |
| Gudauri, Gruzija (`gudauri`) | Skupni prelaz z obcestjem (702), 7 zanimivosti z vrsticami. Manjkata lasten teren Kavkaza in zvok. | 2 | #1018, #840, #1154 | |
| Izoard, Francija (`izoard`) | Skupni prelaz z obcestjem, 21 zanimivosti z vrsticami. Manjkata melišča pod vrhom in lasten zvok. | 2 | #1137 | |
| Koror, Palau (`koror`) | Skupni prelaz z obcestjem (512), 4 zanimivosti. Manjkajo laguna in otočki. | 2 | #1142 | |
| Savusavu, Fidži (`savusavu`) | Skupni prelaz z obcestjem (478), 4 zanimivosti. Manjka zaliv z mangrovami. | 2 | #1148 | |
| Hakone, Japonska (`hakone`) | Svet 872 vrstic, 21 zanimivosti (13 z vrsticami). Komentator ima le 1 vrstico, brez `alt`. | 2 | #1171, #1079 | |
| Harju, Finska (`harju`) | Svet 1056 vrstic, brez komentatorja in DEM. #1098 progo prestavi v test. | 2 | #1098 | |
| Llogara, Albanija (`llogara`) | Svet 262 vrstic, 13 zanimivosti (11 z vrsticami). Manjkata borov gozd in obala pod prelazom po meri. | 2 | #1085, #1018, #1156 | |
| Medeu, Kazahstan (`medeu`) | Obcestje 872 vrstic, 9 zanimivosti z vrsticami. Manjkata drsališče in jez kot glavni točki. | 2 | — | croatiadata |
| Porto Moniz, Portugalska (`portomoniz`) | Svet in obcestje, 12 zanimivosti. Manjkajo naravni bazeni in pečine po meri. | 2 | #1018, #1013, #982, #840 | |
| Sa Calobra, Španija (`sacalobra`) | Svet 313 vrstic, 17 zanimivosti z vrsticami. Manjka »vozel« ceste kot glavna točka. | 2 | #1151 | biketraveler |
| Los Caracoles, Čile (`caracoles`) | Svet 775 vrstic, 32 zanimivosti (14 z vrsticami). Hotel in koče so škatle (`realizem.md`). | 2 | #1052, #763 | |
| El Castaño, Venezuela (`elcastano`) | Na `main` še ni. Svet 49 vrstic, 4 zanimivosti z vrsticami. Oblačni gozd narodnega parka in reka sta le v podatkih rastja, brez obcestja, preleta, lastnega zvoka in številk ovinkov. | 4 | #1241 | biketraveler |
| Kudowa-Zdrój, Poljska (`kudowa`) | Na `main` še ni. Svet 35 vrstic, 5 zanimivosti z vrsticami. Za Cesto stotih ovinkov manjkajo številke ovinkov, smrekov in bukov gozd tik ob cesti ter potok; brez obcestja, preleta in zvoka. | 4 | #1241 | biketraveler |
| Tatev, Armenija (`tatev`) | Skupni graditelj `world-kratke.js`, 9 zanimivosti z vrsticami, komentator. Manjkajo naravni kamniti most in samostan na skali kot glavni točki, žičnica čez sotesko, prelet, lasten zvok in številke 19 serpentin. Dodeluje druga seja (O-28-42). | 3 | veja `dodelava/tatev` | biketraveler |
| Chamarel, Mavricij (`chamarel`) | Svet 99 vrstic, 6 zanimivosti z vrsticami, komentator. Manjkajo razgled na laguno in Le Morne, sladkorni trs in rdeča vulkanska prst ob vasi, obcestje, prelet in zvok. Dodeluje druga seja (O-28-42). | 3 | veja `dodelava/chamarel` | biketraveler |
| Trebević, Bosna in Hercegovina (`trebevic`) | Na `main` še ni. Svet 128 vrstic, 6 zanimivosti z vrsticami. Stara bob steza z brvjo čez cesto, razgled nad Sarajevom in ruševine utrdbe še niso dodelani; brez preleta, zvoka in številk lasnic. | 3 | #1241 | biketraveler |
| Meteora, Grčija (`meteora`) | Na `main` še ni. Svet 133 vrstic, 7 zanimivosti z vrsticami. Skalni stebri in samostani na vrhovih so glavna točka, a brez lastne oblike po DEM; manjka nizek kamnit zid ob prepadu, prelet, zvok in številke ovinkov. | 3 | #1241 | biketraveler |
| Šipka, Bolgarija (`sipka`) | Na `main` še ni. Svet 93 vrstic, 6 zanimivosti z vrsticami. Kamnit stolp spomenika na vrhu ni dodelan, izvir in znamenje manjkata (ni točke v OSM); brez preleta, zvoka in številk serpentin. | 3 | #1095 | biketraveler |
| Stavrovouni, Ciper (`stavrovouni`) | Na `main` še ni. Svet 126 vrstic, 6 zanimivosti z vrsticami. Samostan na vrhu je le zanimivost, manjkajo redki borovci in grmičevje po pasovih, nizek zid ob prepadu, prelet in zvok. | 3 | #1092 | biketraveler |
| Giza, Egipt (`giza`) | Na `main` še ni. Svet 366 vrstic, 7 zanimivosti z vrsticami. Proga ima 9,9 km, več od meje 5 km za nove proge. Manjkajo prelet, lasten zvok (veter, pesek) in številke ovinkov. | 3 | #1212 | biketraveler |
| Chapman's Peak, Južna Afrika (`chapman`) | Svet 727 vrstic. DEM s 30 m zgladi pečine nad morjem (`realizem.md`). | 2 | #1052, #763, #678 | biketraveler |
| Ella, Šrilanka (`ella`) | Svet 830 vrstic, 6 zanimivosti z vrsticami. Manjkata čajni nasadi kot glavni pas rastja. | 2 | #1167 | biketraveler |
| Rio do Rastro, Brazilija (`rastro`) | Svet 572 vrstic. Pri 3,9 km je trava, v resnici je več kot pol gozda (`realizem.md`). | 2 | #1060, #1052, #763, #678, #1166 | biketraveler |
| Tianmen, Kitajska (`tianmen`) | Svet 673 vrstic, 39 zanimivosti. Pobočja so travnata, v resnici je gost gozd (`realizem.md`). | 2 | #763, #678 | |
| Santo Antão, Zelenortski otoki (`santoantao`) | Svet 637 vrstic, vse glavne točke. Manjkata lasten zvok in svetloba po kraju. | 1 | #1190, #1019 | biketraveler |
| Ngorongoro, Tanzanija (`ngorongoro`) | Svet 1049 vrstic. Manjkata pas rastja ob robu kraterja in lasten zvok. | 1 | #1164 | biketraveler |
| Killar, Indija (`killar`) | Svet 1224 + obcestje 388 vrstic. Ima vse razen lastnega zvoka in številk ovinkov. | 1 | #1130, #1128, #1124, #1121, #1165 | biketraveler |
| Pikes Peak, ZDA (`pikes`) | Merilo. Manjkata rastje (paket G) in daljši opis. | 1 | #763, #758 | |

## Čaka PR (nove proge, še niso na `main`)

Tatev in Chamarel sta na `main` (#1097, #1091). Ocena ostalih je v tabeli zgoraj po stanju vej PR 28. 11. (O-28-43) in se ponovi, ko so na `main`.

| Proga | Odprti PR | Račun |
|---|---|---|
| El Castaño, Venezuela (`elcastano`) | #1090, #1118, #1241 | biketraveler |
| Stavrovouni, Ciper (`stavrovouni`) | #1092 | biketraveler |
| Kudowa-Zdrój, Poljska (`kudowa`) | #1093, #1241 | biketraveler |
| Meteora, Grčija (`meteora`) | #1094, #1118, #1241 | biketraveler |
| Šipka, Bolgarija (`sipka`) | #1095, #1118 | biketraveler |
| Trebević, Bosna in Hercegovina (`trebevic`) | #1096, #1118, #1241 | biketraveler |
| Giza, Egipt (`giza`) | #1212 | biketraveler |
