# dirkaska-igra
Dirkanje z avti 

## Pikes Peak (kronometer)

Vzpon od starta (2862 m) do vrha (4301 m) proti uri, brez nasprotnikov. Na poti so kontrolne točke CP1–CP4 z vmesnimi časi. Po cilju se osebni rekord in lestvica najboljših 10 časov shranita v brskalnik na tej napravi. Pred vožnjo lahko avto nadgradiš (motor, gume, zavore, aerodinamika); nadgradnje veljajo na vseh progah. Proga je sorazmerno skrajšana na ~6,2 km (prava je 19,99 km), višine na zaslonu so prave.

## Nürburgring Nordschleife

Pravi „Zeleni pekel“ v Nemčiji v pravem merilu: en krog (20,7 km) proti 20 tekmecem (na drugih progah jih je 12), ki so tu hitrejši kot drugod, start in cilj pri tribuni T13, vožnja v smeri urinega kazalca. Oblika proge je iz OpenStreetMap, višine pa iz satelitskih višinskih modelov (SRTM in Copernicus), zato so klanci in spusti pravi: od T13 (~620 m) po Fuchsröhre navzdol do Breidscheida (~335 m, najnižja točka), nato dolg vzpon do Hohe Acht (~617 m). Ovinka Karussell in Kleines Karussell sta nagnjena (betonska skleda na notranji strani, avto ju lahko odpelje hitreje), na Flugplatzu, v Pflanzgartnu in na Sprunghüglu avto poskoči. Med vožnjo se pod uro izpišejo imena ovinkov (Hatzenbach, Flugplatz, Fuchsröhre, Adenauer Forst, Wehrseifen, Breidscheid, Bergwerk, Kesselchen, Karussell, Hohe Acht, Brünnchen, Pflanzgarten, Schwalbenschwanz, Döttinger Höhe …), pri KROG pa, koliko kilometrov kroga je že za tabo. Gozd, travniki, vasi in mostovi so postavljeni po pravi rabi tal in stavbah iz OpenStreetMap; gozd ima smreke, bukve, macesne in suhe smreke, ob robu grmovje in mlado drevje, tla pod krošnjami so temna. Na asfaltu so grafiti in zastave navijačev (največ pri znanih ovinkih in na Döttinger Höhe), katranske razpoke, zaplate in sledi gum pred počasnimi ovinki.

## Kje na progi si (proge po resničnih krajih)

Na progah Ljubljana, Monako, Pikes Peak in Nordschleife se ~70 m pred vsakim znanim krajem pod uro izpiše njegovo ime (npr. Zmajski most, Prešernov trg, Casino, predor, Glen Cove, Devil's Playground, Karussell), in to v vsakem krogu. Komentator (v angleščini) občasno pove, kje si („Over the Dragon Bridge now!“, „Up into Casino Square!“), vsak kraj praviloma enkrat na dirko, z razmikom med takimi stavki, in samo takrat, ko ne govori o nečem pomembnejšem (prehitevanja, vmesni časi, nesreče in boksi imajo prednost in ga prekinejo). Kraj, ki ga v enem krogu ni utegnil omeniti, lahko pove v naslednjem. Čas kroga ali vmesni čas ostane na zaslonu, ime kraja pa se pokaže takoj za njim.

## Fizika vožnje

Privzeta fizika je **Circuit Superstars**: avto drsi z nosom v ovinek toliko, kolikor hitro zavijaš; zaviranje v ovinku ga zavrti, na izhodu se sam poravna; brez vrtenja. Gumb za drift (preslednica) ga zavrti še malo bolj. Pomoč pri driftu (nizka/srednja/visoka) določa, kako daleč lahko zadrsa. **Arkadna** je prejšnja fizika in je na voljo v Nastavitvah (Fizika vožnje: Arkadna). Rekordi se za vsako fiziko vodijo posebej.

## Dirka s prijateljem

Dirka dveh igralcev, vsak na svojem telefonu (ali računalniku), preko interneta.

1. Oba odpreta igro. Različici morata biti enaki: po posodobitvi igre jo na obeh telefonih zapri in znova odpri.
2. Oba na naslovnem zaslonu tapneta **Dirka s prijateljem**, vpišeta svoje ime in tapneta **Počakaj prijatelja**. Prvi počaka (**Prekliči** ga vrne nazaj), ko drugi tapne isto, sta takoj povezana, brez kode. Če tapne še kdo tretji, ga združi z naslednjim čakajočim. Priporočilo: dogovorita se za isti trenutek; kdorkoli drug, ki tapne v tem času, se lahko poveže z vama.
3. Za zasebno sobo tapni manjši gumb **Zasebna soba s kodo**: eden tapne **Ustvari sobo** in drugemu pošlje kodo (4 znaki), drugi kodo vpiše in tapne **Pridruži se**.
4. V sobi vsak izbere svoj avto (◀ ▶). Gostitelj (kdor je čakal oziroma ustvaril sobo) izbere progo in število krogov ter tapne **Začni dirko**.

- Na progi sta samo vidva, brez tekmecev z AI, drug ob drugem v prvi vrsti; kdo začne na levi, se menja od dirke do dirke. Vzpon na Pikes Peak (vožnja proti uri) ni na voljo.
- Semafor ugasne na obeh telefonih hkrati. Časi se merijo od skupnega starta, zato sta rezultata na obeh telefonih enaka.
- Fizika vožnje in poškodbe so po nastavitvah gostitelja (sprememba med dirko velja od naslednje dirke). Vsak vozi svoj avto z nadgradnjami.
- Avta se lahko zadeneta. Vsak telefon premika le svoj avto, zato se ob trku odmakne vsak svoj.
- Premor ustavi le tvoj avto: prijatelj vozi naprej in ura teče. Enako, če med dirko preklopiš v drugo aplikacijo; če telefon igro takrat ustavi za več kot 10 sekund, se povezava prekine.
- Po cilju se vrneta v sobo na naslednjo dirko. Če prijatelj odide ali se povezava prekine, dirka teče naprej.
- Poškodbe prijateljevega avta (udrtine, odpadli deli, dim) vidi le prijatelj.

Telefona sta povezana neposredno (WebRTC) s knjižnico [PeerJS](https://peerjs.com). Da se najdeta, uporabita brezplačni javni strežnik PeerJS: pri hitri povezavi imajo čakalna mesta stalna imena (z različico igre), pri zasebni sobi je koda njun naslov na njem. Čakajoči telefon mora imeti igro odprto na zaslonu. Za neposredno povezavo telefona prek Googlovega strežnika STUN izvesta svoj javni naslov; kadar neposredna povezava ni mogoča (nekatera mobilna omrežja), gre promet prek posredniškega strežnika PeerJS (TURN). Če gostitelj med čakanjem na prijatelja za hip izgubi povezavo s strežnikom (npr. ko preklopi v drugo aplikacijo, da pošlje kodo), se soba z isto kodo sama znova poveže. Brez interneta igra deluje naprej, dirka s prijateljem pa ne.

## Igra kot aplikacija

- **Android (Chrome):** na naslovnem zaslonu tapni **Namesti igro** (ali v meniju Chroma ⋮ → *Namesti aplikacijo*). Igra dobi svojo ikono, odpre se čez cel zaslon in se obrne tako, kot zahteva izbrana kamera (za avtom: pokončno; izometrična in kino: ležeče).
- **iPhone (Safari):** Deli → *Dodaj na začetni zaslon*.
- Ko je igra enkrat odprta, deluje tudi brez interneta (in pri zelo slabem signalu). Ko je internet na voljo, igra ob zagonu naloži najnovejšo različico; če ostane odprta v ozadju, se posodobi sama, ko se vrneš vanjo na naslovnem zaslonu. Po objavi na GitHubu lahko traja nekaj minut, da je nova različica na voljo.
- V brskalniku se zaslon zaklene le v celozaslonskem načinu (gumb **Celoten zaslon**); tam, kjer brskalnik tega ne dovoli (Safari na iPhonu), se med dirko pokaže obvestilo, naj telefon obrneš.

## Zgradba projekta

Igra ne potrebuje namestitve ali prevajanja: `index.html` naloži datoteke po vrsti, deluje pa tudi, če ga odpreš neposredno z diska.

| Pot | Vsebina |
|---|---|
| `index.html` | HTML menijev in HUD-a, povezave na vse datoteke |
| `css/style.css` | slogi |
| `js/vendor/three.r128.min.js` | knjižnica three.js (MIT) |
| `js/tracks/<id>.js` | ena datoteka na progo: oblika, višine, sidrišča okolice, imena krajev (vrstni red v `index.html` = vrstni red v meniju) |
| `js/core.js` | proge, fizika (Circuit Superstars in arkadna), AI, pravila dirke (brez DOM in three.js) |
| `js/tex.js` | proceduralne teksture |
| `js/world.js` | 3D svet prog (teren, drevesa, gledalci, rekviziti, boksi) |
| `js/data/p206.js` | 3D model Peugeota 206 |
| `js/render.js` | izris, avti, delci, kamere, mehaniki v boksih |
| `js/sfx.js`, `js/input.js`, `js/comm.js` | zvok, upravljanje, komentator |
| `js/net.js`, `js/vendor/peerjs.min.js` | povezava dveh telefonov za dirko s prijateljem (soba s kodo, usklajena ura); knjižnica PeerJS (MIT) |
| `js/game.js` | meniji, nastavitve, HUD, rekordi, dirka s prijateljem, glavna zanka |
| `manifest.webmanifest`, `icons/` | opis aplikacije (ime, ikone, celoten zaslon) za namestitev na telefon; ikone nariše `node tools/icons.mjs` |
| `sw.js` | service worker: igra brez interneta in vedno najnovejša različica, ko je internet na voljo (opis v datoteki) |
| `tests/` | samodejni testi (glej `tests/README.md`) |
| `tools/stamp.js` | po vsaki spremembi datoteke v `js/` ali `css/` zaženi `node tools/stamp.js`: povezave v `index.html` dobijo oznako vsebine (`?v=…`), da brskalnik po posodobitvi ne pomeša starih in novih datotek |

Igra potrebuje vse datoteke skupaj: sam `index.html` (brez map `css/` in `js/`) ne deluje. Z diska (brez spletnega strežnika) igra deluje, le brez igranja brez interneta in namestitve.

### Nova proga

1. Nova datoteka `js/tracks/<id>.js` z definicijo proge (po vzoru obstoječih).
2. V `index.html` dodaj `<script src="js/tracks/<id>.js"></script>` pred `js/core.js`, na mesto, kjer naj bo proga v meniju, nato zaženi `node tools/stamp.js`.
3. Okolica: vsaka tema (`theme`) v `js/world.js` gradi okolico svoje proge (jezero, stavbe, gozd …), zato nova proga potrebuje svojo temo ali prilagojeno obstoječo.
4. Testi progo zajamejo sami; referenčne vrednosti zanjo ustvari `npm run golden:update`.

## Zasluge

- Avto PEUGEOT 206: 3D model [„Peugeot 206“](https://sketchfab.com/) avtorja **Alvier** (Sketchfab), licenca [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Model je poenostavljen in shranjen v `js/data/p206.js`.
- Povezava telefonov: knjižnica [PeerJS](https://peerjs.com) 1.5.5 (Michelle Bu, Eric Zhang in sodelavci), licenca MIT, shranjena v `js/vendor/peerjs.min.js`. Za iskanje sobe in posredovanje uporablja brezplačni javni strežnik PeerJS.
- Proga Nordschleife (sredinska črta, raba tal, stavbe, mostovi, imena ovinkov): © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors. Podatki so vzeti iz OpenStreetMap, ki je na voljo pod licenco [Open Database License (ODbL) 1.0](https://opendatacommons.org/licenses/odbl/1-0/). Iz njih izpeljani podatki v `js/tracks/nring.js` so prav tako na voljo pod ODbL 1.0.
- Višine Nordschleife: SRTM (NASA/USGS, javna domena) in Copernicus DEM GLO-30: produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved.
