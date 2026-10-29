# Posebne misije – predaja drugemu računu

Uporabnik je 29. 10. napisal: »vse misije bom naredil z drugim računom«. Prvi račun prenaša novo mapo iz slik v kodo (`js/newmap.js`
in nove datoteke ob njej), drugi račun dela misije. Ta dokument zbere vse, kar je bilo o misijah dogovorjeno: izbor 23 misij,
10 novih (46–55), za vsako progo, vozilo, zgodbo, cilj, prikaz na zaslonu, čas izdelave in čas igranja. Makete so samo slike iz Blenderja;
v igri bo grafika preprostejša.

## Kje je kaj

Vse poti so v mapi `slike-predlogi/` na veji `slike-predlogi` (slike ne gredo na `main`). Dostop: `git fetch origin slike-predlogi`,
nato `git worktree add ../slike origin/slike-predlogi` (ali posamezno: `git show origin/slike-predlogi:slike-predlogi/<pot>`).

| Pot | Vsebina |
|---|---|
| `misije-10/misijaNN.webp` | Maketa misije s prikazom na zaslonu (1280 × 720). |
| `misije-10/project/` | Kopija predstavitve (73 prosojnic; `deck.json` + `slides/*.html`). Na začetku tabela izbora s časi. |
| `listi/vse46-posebne-misije-5/` | Zadnje slike: misije 46–55, popravljeni 6 in 45, zaporedji 29 (`m291–294`) in 35 (`m351–354`). |
| `listi/vse46-posebne-misije-5/kamera-blizu/kNN.jpg` | Vozilo vsake izbrane misije skozi kamero igralca (za avtom, Blizu, telefon pokonci). |
| `listi/vse41-gasilski-avto/`, `blender/modeli/v0–v5.glb` | Šest verzij gasilskega avta (A–F); uporabnik verzije še ni izbral. |
| `blender/miss*.py`, `blender/hud_miss*.py` | Skripte maket (Blender 5.2, Python) in prikazov na zaslonu (PIL). Mere in barve vozil so tam. |
| `blender/kamera.py` | Postavi kamero kot v igri (`js/render.js`, način `chase`, pokonci) in izriše vozilo misije. |
| `izbire.md` | Vse odločitve uporabnika po dnevih (njegove besede v narekovajih). |

## Pravila
- Imena prog in mest samo zemljepisna (»Kraj, Država«), brez znamk, logotipov, sponzorjev in imen prireditev; napisi so generični.
- V igri je samo kamera **za avtom** (`chase`, telefon pokonci in ležeče). Vozilo se iz nje vidi predvsem od zadaj in od zgoraj:
  streha, oblika, barva; ponoči luči. Drobnih detajlov na boku ni treba modelirati.
- Obremenitev telefona: proga do ~300 klicev risanja in ~900 tisoč oglišč (`tests/golden/perf.json`); misija ne sme povečati obremenitve drugih prog.
- Po spremembi v `js/` ali `css/` `node tools/stamp.js`; pred pushem zeleni testi, ki se nanašajo na spremembo (`npm run test:related`);
  celotni nabori tečejo na GitHubu v pull requestu.
- Sistem misij in vsaka misija: svoja veja iz svežega `main` in svoj pull request. PR odpreš sam, ko so testi zeleni; združi ga uporabnik.
- Vprašanja in predloge pokaži uporabniku **v slikah** z oštevilčenimi možnostmi; izbere eno, v kodo gre samo izbrana.
- Po vsaki misiji uporabniku napiši kratek seznam za preizkus na telefonu.
- Uporabniku odgovarjaj kratko, v slovenščini.

## Kar v igri že obstaja (izhodišča)
- `js/newmap.js`: kiosk MISSIONS (`BOOTHS`), »hub« z eno postajo na misijo (`hubWorld2`, `missionStation`: plakat, nagradni avto na vrtljivem
  podstavku, mesto za ustavitev), seznam `MISS`; pomožni gradniki iz starejših maket (`rings`, `confetti`, `condor`, `blade`, `snowWalls`).
- `js/nvmenu.js`: meniji garaž na novem zemljevidu (tri izbire, START), med njimi policijske misije, »Kamikaze« in »President«.
- `js/core.js`: misija bega pred policijo (stopnje `free`, `check`, `chase`, `over`; cilj v stavbi) – primer stanja misije od začetka do konca.
- `js/render.js`: kamera `chase` (razdalja iz nastavitev: `S.zoom` → `cam.userZoom`).

## Predlagan vrstni red
1. **Sistem misij** (10–14 h, enkrat za vse): izbira misije, začetek, cilj, čas, prikaz na zaslonu, rezultat.
2. **06 Srce v hladilni torbi**: policija, promet in noč že obstajajo, zato je najcenejša in preizkusi sistem.
3. **01 Požar na vrhu**: ogenj, curek vode in gasilski avto, ki jih rabijo še 46, 47 in 49.
4. Nato po skupinah, ki si delijo gradnike: voda (19, 35, 37, 48), sneg (30, 33, 53), tovor (07, 09, 43, 51, 52), živali (10, 39, 55),
   ostalo po želji uporabnika. Vsako misijo uporabnik preizkusi na telefonu, preden se začne naslednja.

## Odprto
- **Gasilski avto:** verzija (A–F) še ni izbrana. Makete uporabljajo A (01), B (46), E (47) in C (49).
- **13 Lovec na tornado** je uporabnik 29. 10. prestavil med neizbrane, zato je ta dokument nima.
- Misija 6 je zaradi prometa, ki se umika policiji, ocenjena na 12–16 h (prej 10–14 h).

## Usklajevanje s prvim računom (mapa)
- Prvi račun prenaša mapo iz slik v kodo: notranjost male proge (lunapark, parkirišče z avtošolo, helidrom), robovi, tla in morje,
  kmetija, helikopter, avtošola. Spreminja `js/newmap.js`, `js/game.js` (nalaganje) in `index.html`, dodaja nove datoteke (`js/nvpark.js`).
- Misije: koda v svojih datotekah (npr. `js/missions.js`), v `js/newmap.js`, `js/nvmenu.js` in `js/game.js` samo kratki priklopi;
  v teh datotekah ničesar ne prestavljaj in ne preoblikuj. Pred vsakim pull requestom spoji svež `main`.

## Časi
| | Izdelava | Igranje |
|---|---|---|
| Izbranih 23 misij | 306–430 h | 130–170 min |
| 10 novih misij (46–55) | 124–174 h | 59–78 min |
| Sistem misij (enkrat) | 10–14 h | – |
| **Skupaj** | **440–618 h** (realno okoli 310–495 h, ker se gradniki ponavljajo) | **189–248 min** |

## Misije

| # | Misija | Proga | Datoteka proge | Izdelava · igranje |
|---|---|---|---|---|
| 01 | Požar na vrhu | Vršič, Slovenija | `js/tracks/vrsic.js` | 14–20 h · 4–6 min |
| 02 | Zlata ura | Monte Carlo, Monako | `js/tracks/monaco.js` | 12–16 h · 3–4 min |
| 04 | Vlečna služba | Pikes Peak, ZDA | `js/tracks/pikes.js` | 14–20 h · 6–8 min |
| 06 | Srce v hladilni torbi | Mulholland Highway, ZDA | `js/tracks/mulholland.js` | 12–16 h · 6–8 min |
| 07 | Cisterna | Sani Pass, Južna Afrika | `js/tracks/sani.js` | 14–20 h · 7–9 min |
| 08 | Izgubljeni v gozdu | Ouninpohja, Finska | `js/tracks/ouninpohja.js` | 12–18 h · 8–10 min |
| 09 | Krilo vetrnice | Katu-Jaryk, Rusija | `js/tracks/katu.js` | 16–22 h · 9–12 min |
| 10 | Pobegla čreda | Harju, Finska | `js/tracks/harju.js` | 14–20 h · 4–6 min |
| 11 | Ognjena reka | Mauna Kea, ZDA | `js/tracks/maunakea.js` | 16–24 h · 3–4 min |
| 17 | Ledeni most | Trois-Rivières, Kanada | `js/tracks/troisrivieres.js` | 12–18 h · 4–5 min |
| 19 | Pred plimo | Townsville, Avstralija | `js/tracks/townsville.js` | 12–16 h · 5–6 min |
| 23 | Lovec na meteorite | Marrakesh, Maroko | `js/tracks/marrakesh.js` | 12–18 h · 7–9 min |
| 26 | Zadnji odstotek | Tianmen, Kitajska | `js/tracks/tianmen.js` | 10–14 h · 6–8 min |
| 29 | Božična noč | Štajerska, Avstrija | `js/tracks/rbring.js` | 12–16 h · 5–6 min |
| 30 | Ratrak | Mount Baldy, ZDA | `js/tracks/baldy.js` | 16–22 h · 6–8 min |
| 33 | Odvoz snega | Montréal, Kanada | `js/tracks/montreal.js` | 14–18 h · 6–8 min |
| 34 | Mestni avtobus | Toronto, Kanada | `js/tracks/toronto.js` | 12–18 h · 10–13 min |
| 35 | Reševalci na plaži | Newcastle, Avstralija | `js/tracks/newcastle.js` | 16–22 h · 3–4 min |
| 37 | Poplava | Bang Saen, Tajska | `js/tracks/bangsaen.js` | 16–22 h · 8–10 min |
| 39 | Konji v prikolici | Monterey, ZDA | `js/tracks/monterey.js` | 12–16 h · 6–8 min |
| 40 | Varnostni avto | Bathurst, Avstralija | `js/tracks/bathurst.js` | 12–18 h · 4–5 min |
| 43 | Vroče zavore | Rio do Rastro, Brazilija | `js/tracks/rastro.js` | 12–16 h · 4–5 min |
| 45 | Turistični vlakec | Riviera, Francija | `js/tracks/riviera.js` | 14–20 h · 6–8 min |
| 46 | Požar v predoru | Uncompahgre, ZDA | `js/tracks/uncompahgre.js` | 14–20 h · 5–7 min |
| 47 | Gozdni požar | Great Alpine Road, Avstralija | `js/tracks/greatalpine.js` | 16–22 h · 7–9 min |
| 48 | Narasla reka | Longford, Avstralija | `js/tracks/longford.js` | 14–20 h · 6–8 min |
| 49 | Zataknjeno kolo | Suzuka, Japonska | `js/tracks/suzuka.js` | 12–18 h · 6–8 min |
| 50 | Panji na pašo | Medvode, Slovenija | `js/tracks/medvode.js` | 10–14 h · 5–6 min |
| 51 | Dinozaver na tovornjaku | Crystal Palace, Anglija | `js/tracks/cpalace.js` | 10–14 h · 6–8 min |
| 52 | Hiša na tovornjaku | Big Sur, ZDA | `js/tracks/bigsur.js` | 12–16 h · 8–10 min |
| 53 | Snežne verige | Los Caracoles, Čile | `js/tracks/caracoles.js` | 12–16 h · 7–9 min |
| 54 | Dirka tovornjakov | Nürburg, Nemčija | `js/tracks/nring.js` | 12–16 h · 5–7 min |
| 55 | Medvedi na cesti | Beartooth, ZDA | `js/tracks/beartooth.js` | 12–18 h · 4–6 min |

### 01 · Požar na vrhu · Vršič, Slovenija

- **Vozilo:** gasilsko vozilo (maketa: verzija A). Maketa: `blender/miss.py` → `m01()`.
- **Zgodba:** V hiši na vrhu prelaza gori. Gasilci morajo po serpentinah gor, preden ogenj požre hišo.
- **Cilj:** Ko se ustaviš pri hiši, avto gasi sam. Ti s prstom usmerjaš curek, dokler ogenj ne ugasne.
- **Novo v igri:** gasilski avto (model je že v slikah), vodni curek, ogenj, ki raste in pojema, hiša, ki počasi gori.
- **Prikaz na zaslonu:** HIŠA, OGENJ, VODA, GASI. Namig spodaj: »Povleci s prstom, da usmeriš curek na ogenj«.
- **Opomba:** Zgoraj desno stanje hiše, ognja in vode. Rdeč gumb GASI, merilni križ pokaže, kam gre curek.
- **Izdelava · igranje:** 14–20 h · 4–6 min.
- **Slike:** `misije-10/misija01.webp`, kamera igralca `listi/vse46-posebne-misije-5/kamera-blizu/k01.jpg`.

### 02 · Zlata ura · Monte Carlo, Monako

- **Vozilo:** reševalno vozilo. Maketa: `blender/miss.py` → `m02()`.
- **Zgodba:** Na obalni cesti se je zgodila nesreča. Z reševalnim vozilom prideš do ponesrečenca in ga naložiš.
- **Cilj:** Odpelji ga v bolnišnico. Zgoraj desno teče srčni utrip: če si prepočasen ali sunkovit, ponesrečenec umre.
- **Novo v igri:** reševalno vozilo, prizor nesreče, graf srčnega utripa, ki se odziva na sunke, bolnišnica s pristajališčem.
- **Prikaz na zaslonu:** ♥, 138 / min, KRITIČNO, +  BOLNIŠNICA   1,4 km. Namig spodaj: »Vozi mirno: vsak sunek in trk dvigne utrip«.
- **Opomba:** Graf utripa se umiri, ko voziš mirno, in poskoči ob trku ali ostrem zaviranju. Bolnišnica ima generičen znak H, brez rdečega križa.
- **Izdelava · igranje:** 12–16 h · 3–4 min.
- **Slike:** `misije-10/misija02.webp`, kamera igralca `listi/vse46-posebne-misije-5/kamera-blizu/k02.jpg`.

### 04 · Vlečna služba · Pikes Peak, ZDA

- **Vozilo:** vlečno vozilo s pokvarjenim avtom. Maketa: `blender/miss.py` → `m04()`.
- **Zgodba:** Na vrhu je obstal pokvarjen avto. Vlečno vozilo ga mora spraviti v dolino po strmi cesti.
- **Cilj:** Zvleci avto v dolino. Ob sunkovitem zaviranju se vrv napne; če se strga, avto zdrsne.
- **Novo v igri:** vlečno vozilo z roko in vrvjo, fizika vleke, merilnik napetosti, škoda na vlečenem avtu.
- **Prikaz na zaslonu:** NAPETOST VRVI, ŠKODA NA AVTU. Namig spodaj: »Zaviraj nežno, da se vrv ne strga«.
- **Opomba:** Merilnik napetosti vrvi je zgoraj desno. Rdeče polje pomeni, da se bo vrv strgala.
- **Izdelava · igranje:** 14–20 h · 6–8 min.
- **Slike:** `misije-10/misija04.webp`, kamera igralca `listi/vse46-posebne-misije-5/kamera-blizu/k04.jpg`.

### 06 · Srce v hladilni torbi · Mulholland Highway, ZDA

- **Vozilo:** športni avto za policijskim avtom. Maketa: `blender/miss5.py` → `m06()`.
- **Zgodba:** Ponoči moraš čez hribe pripeljati srce za presaditev. Pred tabo vozi policija.
- **Cilj:** Drži se policije, ki ti odpira pot skozi promet, in dostavi organ, dokler je dovolj hladen.
- **Novo v igri:** policijsko spremstvo, promet, ki zapelje na rob in ustavi, temperatura organa, mestne luči v dolini.
- **Prikaz na zaslonu:** ORGAN, SPREMSTVO, BOLNIŠNICA, 9,6 km. Namig spodaj: »Drži se policije: avti pred njo zapeljejo na rob in ustavijo«.
- **Opomba:** Na cesti so samo avti in tovornjaki, brez pešcev in kolesarjev. Ko pripelje policija z lučmi, avti pred njo zapeljejo na desni rob in ustavijo; nasproti vozeči ustavijo na svojem robu.
- **Izdelava · igranje:** 12–16 h · 6–8 min.
- **Slike:** `misije-10/misija06.webp`, kamera igralca `listi/vse46-posebne-misije-5/kamera-blizu/k06.jpg`.
- **Promet:** samo avti in tovornjaki, brez pešcev in kolesarjev; pred policijo zapeljejo na desni rob in ustavijo z utripalkami,
  nasproti vozeči ustavijo na svojem robu. Policija in igralec vozita po desnem pasu.

### 07 · Cisterna · Sani Pass, Južna Afrika

- **Vozilo:** tovornjak s cisterno. Maketa: `blender/miss.py` → `m07()`.
- **Zgodba:** Polna cisterna goriva mora čez strme makadamske serpentine. Gorivo v njej pljuska.
- **Cilj:** Pripelji cisterno na vrh, ne da se prevrne. Pljuskanje te potiska iz ovinkov.
- **Novo v igri:** tovornjak s cisterno, pljuskanje goriva, ki vpliva na vožnjo, merilnik nagiba, prevrnitev.
- **Prikaz na zaslonu:** NAGIB, PLJUSKANJE. Namig spodaj: »Počasi skozi ovinke, da gorivo ne zaniha cisterne«.
- **Opomba:** Pljuskanje je preprosto nihalo v cisterni, ki potiska tovornjak vstran. Merilnik nagiba pokaže, kdaj grozi prevrnitev.
- **Izdelava · igranje:** 14–20 h · 7–9 min.
- **Slike:** `misije-10/misija07.webp`, kamera igralca `listi/vse46-posebne-misije-5/kamera-blizu/k07.jpg`.

### 08 · Izgubljeni v gozdu · Ouninpohja, Finska

- **Vozilo:** poltovornjak z žarometom. Maketa: `blender/miss.py` → `m08()`.
- **Zgodba:** Trije pohodniki so se ponoči izgubili v gozdu ob makadamski cesti.
- **Cilj:** Z žarometom na strehi in termokamero jih najdi in pripelji nazaj, preden se baterija izprazni.
- **Novo v igri:** vrtljiv žaromet, termokamera s posebnim prikazom, pohodniki v gozdu, nočna osvetlitev.
- **Prikaz na zaslonu:** TERMOKAMERA, NAJDENI, 1 / 3, BATERIJA ŽAROMETA. Namig spodaj: »Obračaj žaromet; pohodniki svetijo na termokameri«.
- **Opomba:** Termokamera je majhno okno, ki toplo obarva pohodnike. Žaromet se obrača z drugim prstom.
- **Izdelava · igranje:** 12–18 h · 8–10 min.
- **Slike:** `misije-10/misija08.webp`, kamera igralca `listi/vse46-posebne-misije-5/kamera-blizu/k08.jpg`.

### 09 · Krilo vetrnice · Katu-Jaryk, Rusija

- **Vozilo:** tovornjak s 48 m krilom vetrnice. Maketa: `blender/miss.py` → `m09()`.
- **Zgodba:** 48 m dolgo krilo vetrnice je treba prepeljati čez serpentine. Ovinki so ožji od tovora.
- **Cilj:** Z dvema drsnikoma krmiš tovornjak in zadnjo os prikolice. Krilo ne sme zadeti skale.
- **Novo v igri:** dolga prikolica s krmiljeno zadnjo osjo, drugi drsnik, zaznava trka krila, spremstvo.
- **Prikaz na zaslonu:** PROSTOR DO SKALE, 0,4 m, ZADNJA OS, L, D, KRILO, OS L/D. Namig spodaj: »Z drugim drsnikom krmiš zadnjo os prikolice«.
- **Opomba:** Počasna, a napeta misija: šteje vsak centimeter. Zgoraj desno je razdalja do skale in položaj zadnje osi.
- **Izdelava · igranje:** 16–22 h · 9–12 min.
- **Slike:** `misije-10/misija09.webp`, kamera igralca `listi/vse46-posebne-misije-5/kamera-blizu/k09.jpg`.

### 10 · Pobegla čreda · Harju, Finska

- **Vozilo:** poltovornjak. Maketa: `blender/miss.py` → `m10()`.
- **Zgodba:** S kmetije je pobegnilo devet krav. Razkropile so se po pašniku ob cesti.
- **Cilj:** S poltovornjakom jih zaženi nazaj v ogrado. Prehitro jih razpršiš, prepočasi pobegnejo v gozd.
- **Novo v igri:** krave, ki se gibljejo kot čreda in bežijo pred avtom, ograda z vrati, mini zemljevid.
- **Prikaz na zaslonu:** V OGRADI, 4 / 9. Namig spodaj: »Prehitro jih razpršiš, prepočasi pobegnejo v gozd«.
- **Opomba:** Zabavna misija za otroke: krave bežijo pred avtom in se držijo skupaj. Živali s kmetije na novi mapi lahko uporabimo tudi tukaj.
- **Izdelava · igranje:** 14–20 h · 4–6 min.
- **Slike:** `misije-10/misija10.webp`, kamera igralca `listi/vse46-posebne-misije-5/kamera-blizu/k10.jpg`.

### 11 · Ognjena reka · Mauna Kea, ZDA

- **Vozilo:** terensko vozilo. Maketa: `blender/miss2.py` → `m11()`.
- **Zgodba:** Sosednji vulkan je izbruhnil. Lava teče čez cesto pod goro, z neba padajo žareči kamni.
- **Cilj:** Pripelji raziskovalce z observatorija v dolino, preden lava zapre zadnji prehod. Rdeč krog pokaže, kam pade kamen.
- **Novo v igri:** lava, ki teče in zapira cesto, padajoči kamni z opozorilnimi krogi, pepel, ognjenik nad progo.
- **Prikaz na zaslonu:** PREHODI ODPRTI, PEPEL, AVTO. Namig spodaj: »Rdeči krog pomeni, da tja pade žareč kamen«.
- **Opomba:** Lava je počasna, a se širi: vsaka minuta zapre nov del ceste. Kamni padajo tja, kjer se pokaže rdeč krog, zato ima igralec sekundo ali dve, da se umakne.
- **Izdelava · igranje:** 16–24 h · 3–4 min.
- **Slike:** `misije-10/misija11.webp`, kamera igralca `listi/vse46-posebne-misije-5/kamera-blizu/k11.jpg`.

### 17 · Ledeni most · Trois-Rivières, Kanada

- **Vozilo:** tovornjak na ledu. Maketa: `blender/miss2.py` → `m17()`.
- **Zgodba:** Pozimi je reka zamrznila. Čez led vodi označena cesta do mesta na drugem bregu.
- **Cilj:** S tovornjakom pelji čez led z ravno pravo hitrostjo: prepočasi se led ugreza, prehitro poči pred tabo.
- **Novo v igri:** zamrznjena reka, razpoke, ki se širijo, merilnik varne hitrosti, smrečice ob ledeni cesti, polarni sij.
- **Prikaz na zaslonu:** VARNA HITROST 25–35, LED, RAZPOKE. Namig spodaj: »Drži hitrost v zelenem pasu: prepočasi se led ugreza, prehitro poči«.
- **Opomba:** Ledene ceste čez reko so nekoč res označevali s smrečicami. Igralec gleda merilnik in posluša pokanje ledu, ne cesto.
- **Izdelava · igranje:** 12–18 h · 4–5 min.
- **Slike:** `misije-10/misija17.webp`, kamera igralca `listi/vse46-posebne-misije-5/kamera-blizu/k17.jpg`.

### 19 · Pred plimo · Townsville, Avstralija

- **Vozilo:** terenec z zdravnikom. Maketa: `blender/miss2.py` → `m19()`.
- **Zgodba:** Na otočku pred obalo čaka bolan ribič. Cesta čez plitvino je suha samo ob oseki.
- **Cilj:** Pripelji zdravnika na otok, preden morje prekrije cesto. Rešilni stolpi ob cesti so zadnje zavetje.
- **Novo v igri:** morje, ki naraste in prekrije cesto, voda, ki upočasni avto, rešilni stolpi, otok s palmami.
- **Prikaz na zaslonu:** MORJE NA CESTI, OTOK, ZDRAVNIK. Namig spodaj: »Ko voda doseže kolesa, avto začne drseti«.
- **Opomba:** Gladina morja se dviga v realnem času. Plitva voda avto upočasni, globoka ga ustavi, zato je treba izbrati pravi trenutek za pot nazaj.
- **Izdelava · igranje:** 12–16 h · 5–6 min.
- **Slike:** `misije-10/misija19.webp`, kamera igralca `listi/vse46-posebne-misije-5/kamera-blizu/k19.jpg`.

### 23 · Lovec na meteorite · Marrakesh, Maroko

- **Vozilo:** terensko vozilo. Maketa: `blender/miss2.py` → `m23()`.
- **Zgodba:** Nocoj nad puščavo pada meteorski dež. Nekateri kamni priletijo do tal še žareči.
- **Cilj:** S terencem poišči in poberi osem meteoritov, preden jih najdejo drugi lovci. Krogi pokažejo, kam bo padlo.
- **Novo v igri:** nočno nebo z zvezdami in meteorji, žareči kamni v kraterjih, tekmeci, radar za iskanje.
- **Prikaz na zaslonu:** METEORITI, NASLEDNJI UDAR, TEKMECI. Namig spodaj: »Žareč kamen je prevroč: počakaj, da se ohladi«.
- **Opomba:** V maroški puščavi res najdejo veliko meteoritov. Žareč kamen je treba počakati, da se ohladi, medtem pa se bližajo tekmeci.
- **Izdelava · igranje:** 12–18 h · 7–9 min.
- **Slike:** `misije-10/misija23.webp`, kamera igralca `listi/vse46-posebne-misije-5/kamera-blizu/k23.jpg`.

### 26 · Zadnji odstotek · Tianmen, Kitajska

- **Vozilo:** električni avto. Maketa: `blender/miss3.py` → `m26()`.
- **Zgodba:** Baterija kaže 3 %. Do polnilnice v dolini vodi cesta z 99 ovinki.
- **Cilj:** Spusti se do polnilnice, preden se baterija izprazni. Zaviraj z motorjem, da dobiš energijo nazaj.
- **Novo v igri:** električni avto, baterija in domet, rekuperacija pri zaviranju, polnilnica, kraški stolpi v megli.
- **Prikaz na zaslonu:** BATERIJA, 3 %, DOMET, DO POLNILNICE, REKUPERACIJA. Namig spodaj: »Zaviraj z motorjem: na vsakem ovinku dobiš nekaj energije«.
- **Opomba:** Misija obrne običajno dirko: zmaga, kdor vozi varčno. Na vsakem ovinku rekuperacija vrne malo energije, pospeševanje pa jo hitro porabi.
- **Izdelava · igranje:** 10–14 h · 6–8 min.
- **Slike:** `misije-10/misija26.webp`, kamera igralca `listi/vse46-posebne-misije-5/kamera-blizu/k26.jpg`.

### 29 · Božična noč · Štajerska, Avstrija

- **Vozilo:** poltovornjak z darili. Maketa: `blender/miss3.py` → `m29()`.
- **Zgodba:** Božična noč v zasneženi vasi. Na kesonu je dvanajst daril.
- **Cilj:** Med vožnjo vrzi darila v zlate kroge pred hišami z lučkami, preden odbije polnoč.
- **Novo v igri:** zasnežena vas, lučke in jelka, metanje daril, tarča pred vrati, sneženje.
- **Prikaz na zaslonu:** TARČA, DARILA, ZADETKI V KROG, VRZI. Namig spodaj: »Vrzi darilo v zlati krog pred vrati, ne v okno«.
- **Opomba:** Sezonski dogodek za december. Metanje daril je preprosto: smer da vožnja, moč pa dolžina pritiska na gumb VRZI.
- **Izdelava · igranje:** 12–16 h · 5–6 min.
- **Slike:** `misije-10/misija29.webp`, kamera igralca `listi/vse46-posebne-misije-5/kamera-blizu/k29.jpg`.
- **Kako vržeš darilo** (`misije-10/kako29.webp`, `listi/vse46-posebne-misije-5/m291–m294.jpg`): 1) približaj se hiši z lučkami, pred vrati
  sveti zlati krog; 2) drži VRZI – dlje držiš, dlje leti, pika na tleh pokaže pristanek; 3) spusti, ko je pika v krogu, darilo leti po loku;
  4) v krogu je zadetek (+1, točke), zgrešeno ostane v snegu. Smer izbere igra (proti hiši ob cesti), igralec določa samo moč.

### 30 · Ratrak · Mount Baldy, ZDA

- **Vozilo:** ratrak. Maketa: `blender/miss3.py` → `m30()`.
- **Zgodba:** Ponoči je zapadlo pol metra snega, zjutraj pa pridejo prvi smučarji.
- **Cilj:** Z ratrakom uredi celo progo do sedmih zjutraj. Na strmini se pripni na vitel, da ne zdrsneš.
- **Novo v igri:** ratrak, urejanje snega s progastim vzorcem, vitel na strmini, žičnica, luči mesta v dolini.
- **Prikaz na zaslonu:** UREJENO, VITEL, NAKLON, SMUČARJI OB. Namig spodaj: »Na strmini drži vitel napet, sicer ratrak zdrsne«.
- **Opomba:** Urejen sneg pušča progaste sledi, zato igralec vidi, kje je že bil. Vitel je nov gradnik: na strmini drži ratrak kot vrv.
- **Izdelava · igranje:** 16–22 h · 6–8 min.
- **Slike:** `misije-10/misija30.webp`, kamera igralca `listi/vse46-posebne-misije-5/kamera-blizu/k30.jpg`.

### 33 · Odvoz snega · Montréal, Kanada

- **Vozilo:** kiper (ob snežni frezi). Maketa: `blender/miss3.py` → `m33()`.
- **Zgodba:** Po snežnem metežu mesto ponoči odvaža sneg. Freza ga meče v tovornjake ob sebi.
- **Cilj:** S kiperjem vozi ob frezi, da curek snega pada v tvoj kiper. Ko je poln, te zamenja naslednji.
- **Novo v igri:** snežna freza s curkom, kiper, vožnja v paru, kupi snega, nočna ulica z zunanjimi stopnicami.
- **Prikaz na zaslonu:** POD CUREK, ZADENEŠ, KIPER, POLNI KIPERJI. Namig spodaj: »Vozi enako hitro kot freza, da sneg pada v kiper«.
- **Opomba:** Ponoči v koloni vozijo freza in tovornjaki. Igralec mora držati hitrost in razdaljo, podobno kot ob kolesarju v misiji 25.
- **Izdelava · igranje:** 14–18 h · 6–8 min.
- **Slike:** `misije-10/misija33.webp`, kamera igralca `listi/vse46-posebne-misije-5/kamera-blizu/k33.jpg`.

### 34 · Mestni avtobus · Toronto, Kanada

- **Vozilo:** mestni avtobus. Maketa: `blender/miss3.py` → `m34()`.
- **Zgodba:** Jutranja konica. Na postajah čakajo potniki, avtobus pa že malo zamuja.
- **Cilj:** Ustavi ob vsaki postaji tako, da so vrata ob rumeni črti. Vozi mehko, da potniki ne padejo.
- **Novo v igri:** mestni avtobus, postajališča z rumeno črto, potniki, vrata, udobje vožnje, semaforji.
- **Prikaz na zaslonu:** POSTAJA, ZAMUDA, UDOBJE, ★★★★☆, potniki stojijo, zaviraj mehko, ODPRI VRATA. Namig spodaj: »Ustavi tako, da so vrata ob rumeni črti, in zaviraj mehko«.
- **Opomba:** Mestna misija z natančnim ustavljanjem in mehkim zaviranjem. Zvezdice za udobje se zmanjšajo ob vsakem sunku.
- **Izdelava · igranje:** 12–18 h · 10–13 min.
- **Slike:** `misije-10/misija34.webp`, kamera igralca `listi/vse46-posebne-misije-5/kamera-blizu/k34.jpg`.

### 35 · Reševalci na plaži · Newcastle, Avstralija

- **Vozilo:** štirikolesnik in vodni skuter. Maketa: `blender/miss3.py` → `m35()`.
- **Zgodba:** Poletje na plaži. Za valovi je plavalec, ki mu zmanjkuje moči.
- **Cilj:** S štirikolesnikom prevozi plažo, na robu vode presedi na skuter in pripelji plavalca na obalo.
- **Novo v igri:** štirikolesnik na pesku, vodni skuter, menjava vozila na robu vode, valovi, plavalec v težavah.
- **Prikaz na zaslonu:** ŠTIRIKOLESNIK, SKUTER, PLAVALEC, MOČ PLAVALCA, VALOVI, PRESEDI NA SKUTER. Namig spodaj: »Na robu vode presedi na skuter in pelji do plavalca«.
- **Opomba:** Prva misija z menjavo vozila sredi naloge: kopno in voda. Valovi skuter dvigujejo, zato je treba pravilno zadeti val.
- **Izdelava · igranje:** 16–22 h · 3–4 min.
- **Slike:** `misije-10/misija35.webp`, kamera igralca `listi/vse46-posebne-misije-5/kamera-blizu/k35.jpg`.
- **Kako iščeš plavalca** (`misije-10/kako35.webp`, `m351–m354.jpg`): 1) alarm, reševalec na stolpu pokaže smer, rdeči krog na morju je
  zadnje mesto, kjer so ga videli; 2) s štirikolesnikom do vode, najbližje krogu, presedi na skuter; 3) plavalec se pokaže le na vrhu vala
  in zakliče, znak klica pokaže smer, krog se vsakič zmanjša; 4) ustavi ob njem, na reševalne sani in na obalo.

### 37 · Poplava · Bang Saen, Tajska

- **Vozilo:** dvoživka. Maketa: `blender/miss4.py` → `m37()`.
- **Zgodba:** Monsunski dež je poplavil mesto. Voda še narašča, ljudje čakajo na strehah.
- **Cilj:** Z dvoživko poberi ljudi s streh in jih odpelji na suho, preden voda naraste še za pol metra.
- **Novo v igri:** dvoživka, ki vozi in plava, poplavljene ulice, tok vode, ljudje na strehah, plavajoče smeti.
- **Prikaz na zaslonu:** REŠENI, GLOBINA VODE, VODA NARAŠČA, VRZI OBROČ. Namig spodaj: »Pelji ob hišo, ustavi in vrzi obroč; tok te nosi proti morju«.
- **Opomba:** Dvoživka vozi po cesti in plava, kjer je voda globoka. Tok jo nosi proti morju, zato je treba pluti ob hišah in se ustaviti natančno.
- **Izdelava · igranje:** 16–22 h · 8–10 min.
- **Slike:** `misije-10/misija37.webp`, kamera igralca `listi/vse46-posebne-misije-5/kamera-blizu/k37.jpg`.

### 39 · Konji v prikolici · Monterey, ZDA

- **Vozilo:** terenec s prikolico za konje. Maketa: `blender/miss4.py` → `m39()`.
- **Zgodba:** Dva konja morata do novega hleva. Cesta vijuga čez zlate griče.
- **Cilj:** Pripelji konja do hleva mirna: zaviraj zgodaj, skozi ovinke pelji počasi in brez sunkov.
- **Novo v igri:** prikolica za konje, merilnik miru, sunki pri zaviranju in v ovinkih, hlev z ogrado, hrasti.
- **Prikaz na zaslonu:** MIR KONJ, SUNKI, DO HLEVA, zaviraj zgodaj, ovinki počasi. Namig spodaj: »Konji čutijo vsak sunek: zaviraj zgodaj in skozi ovinke pelji počasi«.
- **Opomba:** Prikolica je že gradnik iz misije 27. Novo je merilnik miru: vsak sunek ga zniža, mirna vožnja pa ga počasi spet dvigne.
- **Izdelava · igranje:** 12–16 h · 6–8 min.
- **Slike:** `misije-10/misija39.webp`, kamera igralca `listi/vse46-posebne-misije-5/kamera-blizu/k39.jpg`.

### 40 · Varnostni avto · Bathurst, Avstralija

- **Vozilo:** varnostni avto. Maketa: `blender/miss4.py` → `m40()`.
- **Zgodba:** Dirkalnik je trčil v zid na vrhu griča. Proga je pod rumeno zastavo, kolona čaka nate.
- **Cilj:** Vodi kolono s pravo hitrostjo, dokler ne odpeljejo razbitega avta, nato ugasni luči in se umakni.
- **Novo v igri:** varnostni avto z lučmi, kolona dirkalnikov za tabo, delta čas, redarji z zastavami, odvoz razbitega avta.
- **Prikaz na zaslonu:** VARNOSTNI AVTO, DELTA, KOLONA, ODSTRANJEVANJE, krog pred koncem ugasni luči, UGASNI LUČI. Namig spodaj: »Vozi s pravo hitrostjo: prepočasi se gume ohladijo, prehitro kolona razpade«.
- **Opomba:** Prava hitrost je ozek pas: prepočasi se gume dirkalnikom ohladijo, prehitro kolona razpade. Igralec vidi delto in razmik kolone.
- **Izdelava · igranje:** 12–18 h · 4–5 min.
- **Slike:** `misije-10/misija40.webp`, kamera igralca `listi/vse46-posebne-misije-5/kamera-blizu/k40.jpg`.

### 43 · Vroče zavore · Rio do Rastro, Brazilija

- **Vozilo:** težak tovornjak. Maketa: `blender/miss4.py` → `m43()`.
- **Zgodba:** Težak tovornjak se spušča po strmih serpentinah. Zavore so vse bolj vroče.
- **Cilj:** Spusti se do doline brez pregretih zavor. Če zavore odpovejo, zapelji na izletni pas.
- **Novo v igri:** temperatura zavor, prestave in zaviranje z motorjem, izletni pas s peskom, megla, araukarije.
- **Prikaz na zaslonu:** ZAVORE, PRESTAVA, 3, zavore se grejejo, NIŽJE. Namig spodaj: »Prestavi nižje in zaviraj z motorjem; če zavore odpovejo, zapelji na izletni pas«.
- **Opomba:** Misija uči zaviranje z motorjem: nižja prestava drži hitrost brez zavor. Izletni pas s peskom je rešitev v sili.
- **Izdelava · igranje:** 12–16 h · 4–5 min.
- **Slike:** `misije-10/misija43.webp`, kamera igralca `listi/vse46-posebne-misije-5/kamera-blizu/k43.jpg`.

### 45 · Turistični vlakec · Riviera, Francija

- **Vozilo:** turistični vlakec (lokomotiva + 3 vagončki). Maketa: `blender/miss5.py` → `m45()`.
- **Zgodba:** Turistični vlakec vozi goste ob morju in po ozkem ovinku navzgor do razgledne točke.
- **Cilj:** Pelji vlakec skozi ovinke tako, da noben vagonček ne zadene robnika, in ustavi ob razgledni točki.
- **Novo v igri:** vlakec z vagončki, ki režejo ovinke, promenada s palmami, plaža s senčniki, razgledna točka nad morjem.
- **Prikaz na zaslonu:** OVINEK, POTNIKI, ZADNJI. Namig spodaj: »Zavij široko: zadnji vagonček reže ovinek in zadene robnik«.
- **Opomba:** Misija je zdaj na progi Riviera: promenada ob morju in serpentina do razgleda. Vagončki v ovinku režejo notranjo stran, zato je treba zavijati široko.
- **Izdelava · igranje:** 14–20 h · 6–8 min.
- **Slike:** `misije-10/misija45.webp`, kamera igralca `listi/vse46-posebne-misije-5/kamera-blizu/k45.jpg`.
- **Proga:** prestavljena z Monte Carla na Rivijero (promenada s palmami, plaža s senčniki, serpentina do razgledne točke).

### 46 · Požar v predoru · Uncompahgre, ZDA

- **Vozilo:** gasilsko vozilo (maketa: verzija B). Maketa: `blender/miss5.py` → `m46()`.
- **Zgodba:** V predoru na gorski cesti gori tovornjak. Dim je tako gost, da se vidijo le utripalke ujetih avtov.
- **Cilj:** Zapelji v predor, naloži ujete ljudi in jih pripelji ven, nato pogasi goreči tovornjak, preden ti zmanjka zraka.
- **Novo v igri:** zadimljen predor, ujeti avti z utripalkami, gasilsko vozilo z dihalnimi aparati, ogenj globoko v predoru.
- **Prikaz na zaslonu:** VIDLJIVOST V DIMU, ZRAK V JEKLENKAH, REŠENI, DO OGNJA, GASI. Namig spodaj: »V dimu sledi utripalkam ujetih avtov, ljudi naloži, nato pogasi ogenj«.
- **Opomba:** Nov igralni del: vožnja v dimu, ko vidiš le nekaj metrov. Pomagajo utripalke avtov in svetleče oznake izhodov ob steni.
- **Izdelava · igranje:** 14–20 h · 5–7 min.
- **Slike:** `misije-10/misija46.webp`, kamera igralca `listi/vse46-posebne-misije-5/kamera-blizu/k46.jpg`.

### 47 · Gozdni požar · Great Alpine Road, Avstralija

- **Vozilo:** gasilska cisterna 4×4 (maketa: verzija E). Maketa: `blender/miss5.py` → `m47()`.
- **Zgodba:** Veter žene ogenj po pobočju navzdol proti kmetiji. Cesta je zadnja ovira pred hišo.
- **Cilj:** Gasi rob ognja ob cesti, da ne preskoči na drugo stran, in pravočasno natoči vodo v jezercu na kmetiji.
- **Novo v igri:** fronta ognja, ki se širi z vetrom, iskre, gasilska cisterna 4×4, polnjenje vode v jezercu, kenguruji.
- **Prikaz na zaslonu:** VODA, OGENJ DO HIŠE, VETER, 35 km/h, POGAŠENO, GASI. Namig spodaj: »Gasi rob ognja ob cesti; ko zmanjka vode, jo natoči v jezercu«.
- **Opomba:** Ogenj se širi po mreži celic, veter določa smer. Ko zmanjka vode, je treba do jezerca in nazaj, preden fronta napreduje.
- **Izdelava · igranje:** 16–22 h · 7–9 min.
- **Slike:** `misije-10/misija47.webp`, kamera igralca `listi/vse46-posebne-misije-5/kamera-blizu/k47.jpg`.

### 48 · Narasla reka · Longford, Avstralija

- **Vozilo:** visok reševalni tovornjak z ljudmi zadaj. Maketa: `blender/miss5.py` → `m48()`.
- **Zgodba:** Po dolgem deževju reka hitro narašča. Na kmetiji na drugem bregu čaka devet ljudi.
- **Cilj:** Prepelji vse s kmetije čez lesen most, preden ga voda zalije. Ob mostu se nabira plavje.
- **Novo v igri:** narasla reka, lesen most, plavje in hlodi, visok reševalni tovornjak, opečni viadukt.
- **Prikaz na zaslonu:** VODA DO MOSTU, EVAKUIRANI, MOST ZDRŽI, PLAVJE. Namig spodaj: »Čez most pelji počasi in po sredini; plavje udarja ob opornice«.
- **Opomba:** Voda naraste z vsako vožnjo. Igralec izbira med več ljudmi naenkrat in hitrejšimi vožnjami; plavje udarja ob most in ga trese.
- **Izdelava · igranje:** 14–20 h · 6–8 min.
- **Slike:** `misije-10/misija48.webp`, kamera igralca `listi/vse46-posebne-misije-5/kamera-blizu/k48.jpg`.

### 49 · Zataknjeno kolo · Suzuka, Japonska

- **Vozilo:** avtolestev z dvižno lestvijo in košem (maketa: verzija C). Maketa: `blender/miss5.py` → `m49()`.
- **Zgodba:** Ob dirkališču je obstalo panoramsko kolo. V kabinah visoko nad tlemi čakajo ljudje.
- **Cilj:** Postavi avtolestev, dvigni in iztegni lestev do kabin ter ljudi varno spravi na tla.
- **Novo v igri:** veliko panoramsko kolo, avtolestev z dvižno lestvijo in košem, krmiljenje lestve, veter.
- **Prikaz na zaslonu:** LESTEV, DOLŽINA, KOT, NIHANJE KOŠA, REŠENI, V KOŠU, DVIGNI, IZTEGNI. Namig spodaj: »Lestev dvigni in iztegni počasi: v vetru se koš ziblje«.
- **Opomba:** Nov igralni del: lestev krmiliš z dvema drsnikoma (dvigni, iztegni). V vetru koš niha, zato je treba počakati na pravi trenutek.
- **Izdelava · igranje:** 12–18 h · 6–8 min.
- **Slike:** `misije-10/misija49.webp`, kamera igralca `listi/vse46-posebne-misije-5/kamera-blizu/k49.jpg`.

### 50 · Panji na pašo · Medvode, Slovenija

- **Vozilo:** tovornjak s prevoznim čebelnjakom. Maketa: `blender/miss5.py` → `m50()`.
- **Zgodba:** Lipa cveti. Čebelar mora zvečer, ko so vse čebele doma, prepeljati čebelnjak na pašo.
- **Cilj:** Pripelji čebelnjak do lipe brez sunkov in lukenj, da čebele ostanejo mirne, preden se stemni.
- **Novo v igri:** prevozni čebelnjak s poslikanimi končnicami, mir čebel, makadamska cesta, kozolec, večerna luč.
- **Prikaz na zaslonu:** ČEBELE, SUNKI, DO PAŠE, SONCE ZAIDE. Namig spodaj: »Pelji mehko: vsak sunek razburi čebele, zato luknje obvozi«.
- **Opomba:** Mirna, slovenska misija. Merilnik miru pada ob vsakem sunku; če se čebele razjezijo, je misija izgubljena.
- **Izdelava · igranje:** 10–14 h · 5–6 min.
- **Slike:** `misije-10/misija50.webp`, kamera igralca `listi/vse46-posebne-misije-5/kamera-blizu/k50.jpg`.

### 51 · Dinozaver na tovornjaku · Crystal Palace, Anglija

- **Vozilo:** nizkopodni tovornjak s kipom stegozavra. Maketa: `blender/miss5.py` → `m51()`.
- **Zgodba:** Kip dinozavra se po obnovi vrača v park. Ulice so ozke, nad njimi veje in železniški most.
- **Cilj:** Pripelji dinozavra v park, ne da zadene veje ali most. Pred mostom spusti podvozje.
- **Novo v igri:** nizkopodni tovornjak s kipom stegozavra, nizek železniški most, veje nad cesto, parkirani avti.
- **Prikaz na zaslonu:** VIŠINA TOVORA, POD MOSTOM, PROSTOR, DINOZAVER, VEJE, SPUSTI PODVOZJE. Namig spodaj: »Pred mostom spusti podvozje, pod vejami pelji po sredini ceste«.
- **Opomba:** Nova omejitev je višina: prikaz pokaže prostor do mostu in vej. Parkirani avti zožijo cesto, zato je treba voziti po sredini.
- **Izdelava · igranje:** 10–14 h · 6–8 min.
- **Slike:** `misije-10/misija51.webp`, kamera igralca `listi/vse46-posebne-misije-5/kamera-blizu/k51.jpg`.

### 52 · Hiša na tovornjaku · Big Sur, ZDA

- **Vozilo:** vlačilec z montažno hišo + 2 spremljevalna avta. Maketa: `blender/miss5.py` → `m52()`.
- **Zgodba:** Montažna hiša potuje po ozki obalni cesti. Široka je skoraj kot vsa cesta.
- **Cilj:** Pripelji hišo do cilja brez praske. Spremljevalni avto ustavlja promet, most prevozi po sredini.
- **Novo v igri:** širok tovor (cela hiša), spremljevalna avta, promet, ki čaka, betonski ločni most nad sotesko.
- **Prikaz na zaslonu:** ŠIRINA TOVORA, CESTA, PROSTOR OB STRANEH, 0,4, 0,9, PROMET ČAKA. Namig spodaj: »Spremljevalni avto ustavlja promet; most prevozi po sredini«.
- **Opomba:** Prikaz pokaže prostor na levi in desni strani tovora. Na ovinkih nad morjem tovor sega čez rob cestišča.
- **Izdelava · igranje:** 12–16 h · 8–10 min.
- **Slike:** `misije-10/misija52.webp`, kamera igralca `listi/vse46-posebne-misije-5/kamera-blizu/k52.jpg`.

### 53 · Snežne verige · Los Caracoles, Čile

- **Vozilo:** avtobus s snežnimi verigami. Maketa: `blender/miss5.py` → `m53()`.
- **Zgodba:** Sneži in prelaz bodo kmalu zaprli. Avtobus s 46 potniki mora čez.
- **Cilj:** Pred klancem namesti verige, nato pripelji avtobus čez serpentine, preden prelaz zaprejo.
- **Novo v igri:** avtobus s snežnimi verigami, nameščanje verig, serpentine na snegu, galerija proti plazovom, zapora prelaza.
- **Prikaz na zaslonu:** VERIGE, 4 / 4, OPRIJEM, ZAPORA, POTNIKI. Namig spodaj: »Na snegu vozi enakomerno: sunek plina zavrti kolesa tudi z verigami«.
- **Opomba:** Dva dela: najprej kratka igra nameščanja verig, nato vožnja. Brez verig avtobus na snegu drsi; tovornjak brez verig je že obstal počez čez cesto.
- **Izdelava · igranje:** 12–16 h · 7–9 min.
- **Slike:** `misije-10/misija53.webp`, kamera igralca `listi/vse46-posebne-misije-5/kamera-blizu/k53.jpg`.

### 54 · Dirka tovornjakov · Nürburg, Nemčija

- **Vozilo:** dirkalni tovornjak. Maketa: `blender/miss5.py` → `m54()`.
- **Zgodba:** Dirka težkih dirkalnih tovornjakov. Zavore se pregrejejo hitreje kot pri avtih.
- **Cilj:** Zmagaj v štirih krogih. Pred ovinki zaviraj zgodaj in zavore ohladi z vodo, dokler je je kaj v rezervoarju.
- **Novo v igri:** dirkalni tovornjaki, hlajenje zavor z vodo, omejevalnik hitrosti na 160 km/h, tribuna.
- **Prikaz na zaslonu:** OMEJEVALNIK 160, POLOŽAJ, KROG, ZAVORE, VODA ZA HLAJENJE, VODA. Namig spodaj: »Pred ovinkom zaviraj zgodaj in zavore ohladi z vodo«.
- **Opomba:** Vsi tovornjaki imajo isto najvišjo hitrost (omejevalnik), zato se dirka odloči pri zaviranju in pri ohranjanju zavor.
- **Izdelava · igranje:** 12–16 h · 5–7 min.
- **Slike:** `misije-10/misija54.webp`, kamera igralca `listi/vse46-posebne-misije-5/kamera-blizu/k54.jpg`.

### 55 · Medvedi na cesti · Beartooth, ZDA

- **Vozilo:** terenec nadzornika z lučmi. Maketa: `blender/miss5.py` → `m55()`.
- **Zgodba:** Medvedka z mladičema je obstala sredi ceste. Turisti so ustavili in nekateri izstopili.
- **Cilj:** Z megafonom pošlji turiste nazaj v avte, nato medvede s hupo počasi odženi s ceste in razženi zastoj.
- **Novo v igri:** medvedka z mladičema, zastoj turistov, terenec nadzornika z lučmi, megafon in hupa, visoka planota.
- **Prikaz na zaslonu:** MEDVEDI, RAZDALJA, TURISTI ZUNAJ, ZASTOJ, MEGAFON, HUPA. Namig spodaj: »Z megafonom pošlji turiste v avte, nato medvede s hupo počasi odženi«.
- **Opomba:** Prvič žival, ki je ne smeš preveč preplašiti: preblizu ali preglasno in medvedka postane nevarna.
- **Izdelava · igranje:** 12–18 h · 4–6 min.
- **Slike:** `misije-10/misija55.webp`, kamera igralca `listi/vse46-posebne-misije-5/kamera-blizu/k55.jpg`.
