# Testi

Samodejni testi za igro. Igra sama ne potrebuje namestitve; testi potrebujejo le Node.js (22) in za teste
v brskalniku Playwright (`npm install` ga namesti, `npx playwright install chromium` prenese brskalnik).

```sh
npm install          # enkrat
npm test             # vse (~20 min)
npm run test:node    # samo fizika, AI in dirke (~3 min)
npm run test:browser # samo testi v brskalniku (~17 min s programskim WebGL)
```

Na GitHubu se ob vsakem pull requestu in vsaki spremembi veje `main` samodejno poženejo vsi testi
(`.github/workflows/tests.yml`). Test, ki teče dlje od 15 minut, se ustavi in šteje kot neuspešen
(drugače: `TEST_TIMEOUT_MIN=30 npm test`).

## Kaj preverjajo

| Test | Kaj preveri |
|---|---|
| `stamp.test.js` | Vse povezave na skripte in sloge v `index.html` imajo trenutno oznako vsebine (`?v=…`) in kažejo na obstoječe datoteke (glej `tools/stamp.js`). |
| `golden.test.js` | Vse proge × 5 postavitev × 2 fiziki: dirka, demo na naslovnem zaslonu, izboljšan avto brez poškodb, trčenje (igralec pri polni hitrosti zavije v ogrado: poškodbe, odpadli deli na cesti, reševanje, na progah z boksi (Bakreni gozd, Toskana, Gromski rt, Red Bull Ring) še postanek v boksih s popravilom) in enako trčenje v dirki formul (igralec in vsi tekmeci v formulah; odpadejo krila, nos, pokrov motorja; po popravilu ima spet ves pritisk na cesto). Po 60 s (trčenje na progi z boksi 80 s, na dolgem krogu toliko dlje, da avto pride okoli do boksov: Red Bull Ring 164 s). Celotno stanje dirke, vseh avtov in odpadlih delov se vsakih 10 s zapiše v prstni odtis in primerja z `golden/sim.json`, zato se pokaže vsaka sprememba fizike, AI, poškodb, boksov ali pravil v teh vožnjah. Test preveri tudi, da trčenje res pripelje do poškodb (in popravila v boksih). |
| `races.test.js` | Cele dirke z AI do cilja na vseh progah z obema fizikama (na progi z dežjem, `def.rain`, še dirka v dežju), na vsaki progi pa še dirka formul (igralec in vsi tekmeci v formulah). Vsi avti morajo priti do cilja, rezultat (vrstni red, časi v cilju in končno stanje vseh avtov) pa mora biti natanko enak referenci v `golden/races.json`. Ob spremembi izpiše še, koliko se je spremenilo: vrtenja (največ 2 več kot v referenci), stiki z ograjo, reševanja in čas zmagovalca (največ ±3 %). |
| `cs-handling.test.js` | Značilnosti fizike Circuit Superstars (iz analize posnetka): oprijem v zavojih, kot drsenja, odziv, samodejna poravnava na izhodu, zaviranje v zavoju, pospešek 0–100, zavorna pot. Še formula: pospešek, končna hitrost, zavorna pot, pri večji hitrosti več oprijema (krila), manj drsenja, brez vrtenja, na makadamu počasnejša od reli avta; po čelnem trku izgubi sprednje krilo in z njim pol pritiska na cesto, popravilo ga vrne. |
| `net-core.test.js` | Prijateljev avto v dirki preko interneta (brez brskalnika): oba v prvi vrsti, enako daleč od črte; dirka prijateljevega avta ne premika (brez fizike, AI in lastnega napredka); ob trku se odmakne in upočasni le lastni avto, prijateljevega premakne le njegov telefon (preverjeno na obeh telefonih); vrstni red v cilju določajo časi na skupni uri z obeh telefonov, tudi če sporočilo s prijateljevim časom pride pozneje. |
| `crossover.test.js` | Križanje na dveh nivojih (Suzuka: zadnja ravnina na mostu čez cesto med Degnerjem in lasnico): proga križanje najde (druge proge ga nimajo), most je ~8 m nad spodnjo cesto, ograje na mostu in zidovi v podvozu so ob cesti, drugod je izlet spet običajen; avta na mostu in pod njim se ne dotakneta, avto ob trku v ograjo na mostu ostane na mostu, po reševanju ostane vsak na svoji višini, odpadli del z mostu pristane na mostu; v celi dirki z obema fizikama noben avto ne preskoči z ene višine na drugo. |
| `browser/smoke.test.mjs` | Stran se naloži (http in lokalna datoteka), 20 s vožnje na vsaki progi (mehaniki v boksih natanko na progah z boksi), nastavitve in prenos starih nastavitev, preklop fizike med dirko, demo na naslovnem zaslonu, rekord na Pikes Peaku, preizkušnja Ouninpohja do cilja (pod uro razdalja do cilja, rekord, besedilo rezultatov), prepočasna naprava (najprej nižja ločljivost; nato igra ob naslednjem premoru za ta obisk izklopi sence, shranjena nastavitev ostane, igralčeva izbira v Nastavitvah velja naprej), brez napak na strani. |
| `browser/world.test.mjs` | Prstni odtis zgrajenega 3D sveta vsake proge, primerjan z `golden/world.json`: vsi modeli (točke, barve, UV, normale in ostali podatki, postavitev, primerki), materiali (vrsta, barve, velikost in ponavljanje teksture, prosojnost), rekviziti, gledalci in tla ob progi. Slikovne pike tekstur niso zajete. |
| `browser/app.test.mjs` | Igra kot aplikacija in zaklepanje zaslona: opis aplikacije in ikone, gumb »Namesti igro« (le ko ga brskalnik ponudi; ponudba med celozaslonskim načinom ne skrije gumbov), zaklepanje v smer kamere (v celozaslonskem načinu in v nameščeni aplikaciji, ne v navadnem zavihku). Na kopiji igre v mapi (kot na GitHub Pages): igra brez interneta po prvem obisku; nova različica z internetom takoj in v celoti shranjena; prekinjeno shranjevanje pusti prejšnjo različico celo (nikoli mešanica); ob napaki strežnika ali brez odgovora omrežja v nekaj sekundah shranjena igra; igra, odprta v ozadju, ob vrnitvi na naslovni zaslon sama naloži novo različico. |
| `browser/online.test.mjs` | Dirka s prijateljem: dve strani v brskalniku igrata dva telefona, povezani prek testnega strežnika PeerJS in neposredne povezave WebRTC, kot bi bila telefona (brez strežnikov na internetu). Napačna koda sobe; soba (koda, oba igralca z avtoma, začne lahko le gostitelj, proga in krogi pridejo do prijatelja); usklajena ura; start na obeh ob istem trenutku, drug ob drugem v prvi vrsti (v naslednji dirki zamenjata strani); pravi avti in štartne številke; prijateljev avto na mestu, kjer res je; dirka drži korak s skupno uro tudi pri počasnih sličicah; oba v cilju z enakima časoma in enakim vrstnim redom na obeh telefonih; nazaj v sobo (gostitelj lahko začne šele, ko je prijatelj nazaj, avto, ki je odšel iz dirke, izgine s proge); prijatelj med dirko odide (gostitelj izve, dirka teče naprej); hitra povezava brez kode (prvi čaka, drugi se poveže, tretji čaka na naslednjega, istočasen tap, mrtvo čakalno mesto se preskoči). Na obeh straneh avto vozi samodejno, v pravem času (~2 min). |
| `browser/pits.test.mjs` | Cela dirka v Bakrenem gozdu s postankom v boksih: ustavitev, mehaniki, dvig na dvigalkah, popravilo, vsi avti v cilju. |
| `browser/perf.test.mjs` | Proračun za telefon: na zaslonu velikosti telefona (844×390, normalna kakovost, sence) test na vsaki progi začne novo dirko, jo sam poganja (vedno enako) in na šestih mestih prešteje delo grafike na sličico (risalni klici in točke vseh prehodov). Pade, če najzahtevnejše mesto preseže referenco (`golden/perf.json`) za več kot 10 % + 5 klicev oziroma 10 % + 20 tisoč točk. Čas JavaScripta se le izpiše (odvisen je od računalnika). Referenco za novo progo zapiše `npm run golden:update`; primerjaj jo z drugimi progami. |
| `browser/memory.test.mjs` | Pomnilnik: trije krogi (menjave vseh prog, trčenje z odpadlimi deli in popravilo v boksih v Bakrenem gozdu, ponovni start, dvakrat skozi vse avte v meniju, demo na naslovnem zaslonu). Po vsakem krogu se meri v enakem stanju (nova dirka na Jezeru pred startom, igra ustavljena, ena sličica z vsemi predmeti). Od 2. kroga naprej ne smejo rasti: geometrija (največ +2), teksture (0), programi senčilnikov (največ +1) in pomnilnik JavaScripta (največ +15 MB). Več krogov: `MEM_ROUNDS=4`. |

## Referenčne vrednosti

Datoteke v `golden/` so posnetek pravilnega obnašanja. Če spremembo naredimo **namenoma** (npr. uglasimo fiziko ali
dodamo drevesa na progo), jih osvežimo z `npm run golden:update` in spremembo razložimo v commitu. Pri preurejanju
kode brez sprememb obnašanja se ne smejo spremeniti.

Z `GAME_ROOT=/pot/do/druge/kopije` lahko teste poženemo na drugi kopiji igre (npr. starejši različici).
