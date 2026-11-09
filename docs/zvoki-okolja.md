# Zvoki okolja: ptice, voda, zvonovi in veter ob progi

Načrt teme. Uporabnik je to novost izbral 5. 11. 2026: »Ob progi se tiho slišijo zvoki, ki se ujemajo s krajem: ptice v gozdu, reka, zvonovi v vasi, veter na prelazu. Telefon s tem ne sme biti bolj obremenjen.« Načrt je napisala seja session_01WbgGztWoUK4NRECTrwWMu3 (koordinacija »VSE SEJE 2«, račun 3). Koda se začne šele po odgovorih na tri vprašanja (razdelek Odločitve) in pred novimi progami (`docs/vrsta.md`, Načrtovano).

## Kaj že obstaja (ne podvajamo)

Ves zvok igre je sintetiziran v Web Audio (`js/sfx.js`), brez datotek in brez licenc. Ob progi se že sliši:

- **Pikes Peak ima svoje ozračje** (`atmoBuild`, `atmoUpdate`, `pkxUpdate`, `pk7*` v `js/sfx.js`): veter glede na višino (nad gozdno mejo), sunki na vrhu, navijači ob lasnicah, kravji zvonci, odmev od skal. Zvoki okolja ga ne podvajajo: na Pikes Peaku ostane njegov veter, dodajo se samo ptice v gozdu pod gozdno mejo.
- **Veter od vožnje** (`wind`: šum zraka, ki raste s hitrostjo) ostane; veter na prelazu je nov zvok, ki piha tudi, ko avto stoji.
- **Dež** (`rainV`, šumenje gum po vodi) in **grom** (`thunder`): v dežju ptice in žuželke utihnejo.
- **Navijači in tribune** (`stands`, `crowd`, `docs/igra.md`, »Zvok navijačev in predori«), **odmev** v predorih in galerijah (`tun`, `echo`): ob tribunah in v predorih so zvoki okolja tišji oziroma utihnejo.
- **Galebi in jate ptic na nebu** (`js/render.js`, `birds.reset`: galebi pri `def.sea`): zvok galebov se ujema s temi progami.
- Odprti pull requesti: teme ne dela nihče. #284 (boksi) dodaja v `js/sfx.js` zvoke boksov, zato je koda zvokov okolja v svoji datoteki s kratkim priklopom (razdelek Datoteke). V Načrtovano sta še »Sovoznik na cestah« (glas, `js/comm.js`) in »Neskončna vožnja v prometu«; ne prekrivata se s to temo.

## Viri zvoka

Priporočilo: **vse sintetizirano v igri**, enako kot motorji, navijači in zvonci na Pikes Peaku. Prenos 0 KB, nobene licence in nič v »Zasluge«, deluje brez povezave, vsak gozd ima lahko svoje ptice (seme proge). Ptice so preprostejše od pravih posnetkov, a pod motorjem in tiho se razlika komaj sliši. Prototip vseh zvokov je stran s primeri https://claude.ai/artifact/RAKVe7d2UNWUAStf16xv2h (sinteza v brskalniku; glasnost ob motorju izmerjena z `OfflineAudioContext`: Tiho ~24–28 dB pod motorjem pri 60 km/h, ~32–35 dB pri 160 km/h); koda igre jo prenese v `js/sfx-okolje.js`.

Druge možnosti (vprašanje `zvoki-okolja-vir`):

- **Sinteza in nekaj posnetkov CC0** (ptice, potok, zvonovi): bolj naravno, ~300–500 KB v `assets/zvoki/` (AAC v `.m4a`, mono, 3–8 s), naloženo šele, ko jih proga potrebuje. Vsak posnetek z avtorjem, virom in licenco (CC0 1.0) v `README.md`, »Zasluge«. Strani s posnetki (Wikimedia Commons ipd.) iz okolja sej zdaj niso dosegljive (preizkus 5. 11. 2026), zato bi posnetke priskrbel uporabnik ali bi okolje dovolilo ta naslov.
- **Lastni posnetki uporabnika** (telefon: ptice, potok, zvonovi): seja jih očisti, skrajša in naredi zanke; v »Zasluge« kot lastni posnetki. Do takrat sinteza.

Brez posnemanja znanih posnetkov, brez imen oseb in znamk; ptice so splošne, ne določena vrsta iz tujega posnetka.

## Zvoki in kdaj se slišijo

Nabor je vprašanje `zvoki-okolja-nabor`; priporočenih je šest zvokov:

| Zvok | Kako (sinteza) | Kje | Kdaj |
|---|---|---|---|
| **Ptice v gozdu** | 5 vzorcev petja (trilček, žvižgana fraza, dvotonski klic, žvrgolenje, kratki klici; 1,8–6 kHz), vsaka proga izbere 3–4 po svojem semenu; tiho šelestenje listja ob sunkih vetra | gostota dreves ob cesti | jutro največ, dan srednje, večer malo, ponoči nič; v dežju nič; jeseni manj, pozimi redko |
| **Voda** | potok: mehurčki (kratki sinusi z naraščajočim tonom) in pas šuma, zanka 3 s; reka: širši, nižji šum; slap: širok šum in bobnenje; jezero: tiho pljuskanje | vodne površine ob cesti in njihova vrsta; potok, ki teče pod cesto, se sliši ob prečkanju | vedno (tudi v dežju) |
| **Zvonovi v vasi** | dva cerkvena zvonova (delni toni zvona, 4 s izzvenevanja), zvonjenje 6–12 udarcev | naselja ob cesti, s strani vasi (cerkev iz OpenStreetMap, kjer je) | ob vstopu v vas z verjetnostjo, največ enkrat na ~3 min; ponoči ne |
| **Veter na prelazu** | kot veter na Pikes Peaku: temni šum, žvižg v sunkih (1–4 s), počasno premikanje levo-desno | visoki in odprti deli ceste (prelaz, greben, planota), ob morju malo | vedno; pozimi močnejši |
| **Morje** | valovanje (šum, val vsakih 7–11 s, pršenje ob lomu) in galebi (klici v skupinah po 2–4) | proge ob morju (`def.sea` ali velika voda ob cesti) | vedno; galebi ne ponoči in ne v dežju |
| **Žuželke** | črički (pulzi 4–5 kHz) zvečer in ponoči, škržati (brenčanje 5–7 kHz, valovi po 5–10 s) podnevi v toplih krajih | podnebje proge: zemljepisna širina in nadmorska višina (`GEO`), drevesa ali grmovje ob cesti | samo poleti; ne v dežju, ne na snegu |

Možnost 3 vprašanja (izbrana 6. 11. 2026, narejena v koraku 6) doda še:

| Zvok | Kako (sinteza) | Kje | Kdaj |
|---|---|---|---|
| **Krave in ovce** | kravji zvonci (pločevina: delni toni narazen, kratek zvok in udarec kembelja) v kratkih izbruhih, ko krava dvigne glavo, tu in tam mukanje; ovce blejajo | črede iz `World.life`, ki so res ob cesti (`o.lifeStats.at`: metri od štarta, stran, oddaljenost za ograjo): najbližja do 170 m; krave na Spa, Red Bull Ringu in Rio do Rastru, ovce ima samo Longford (na odločanju, brez zvokov okolja) | vedno; ne v varčevanju |
| **Mesto** | oddaljen promet (nizko bobnenje in pas šuma, podlaga), golobi (gruljenje) 5–35 m od ceste | proge z mestom (`def.zivali.city`): Harju, Crystal Palace, Montréal, Marrakesh | promet vedno, ponoči tišje; golobi ne ponoči in ne v dežju |
| **Razglas in vzkliki** | sinteza govora brskalnika v angleškem glasu, ki ni komentatorjev ali sovoznikov (razglas ženski, če ga brskalnik ima); splošna obvestila brez imen (ograje, prehodi, izgubljeni otroci, prva pomoč, v cilju zaključni stavek), vzkliki »Go on!«, »Come on!« … | krožne proge s tribunami (`o.crowdPts`): razglas ob tribunah (glasnost tribun nad 0,2), vzkliki ob glasnih (nad 0,45) | med dirko, razglas največ na ~75 s, vzklik na ~25 s; tiho (0,3 pri Tiho, 0,6 pri Glasneje, s hitrostjo do 40 % manj); samo, ko komentator molči že 3 s; ko komentator ali sovoznik začne, se stavek prekine (`js/comm.js` pokliče `SfxOkolje.hush()`); ne v načinu radia |

**Govor v angleščini** (odločitev uporabnika 5. 11. 2026 ob 16.10: »Vse zvoke delaj v angleščini.«): šest priporočenih zvokov je brez govora. Kjer je v zvokih okolja govor (razglas po zvočniku, napovedovalec, vzkliki ljudi), je vedno v angleščini, tudi ko je igra v slovenščini, in brez imen resničnih oseb in podjetij (`CLAUDE.md`, Pravna varnost).

Pričakovano po progah (potrdi orodje v koraku 1): gozd in ptice Nürburg, Spa, Ouninpohja, Pikes Peak (pod gozdno mejo), Irohazaka, Great Alpine Road; voda Great Alpine Road in Longford (reka), Medvode (Sava, jezero v Zbiljah); vas Medvode (Medvode, Zbilje, Valburga, Smlednik), Ouninpohja, Livorno, Nürburg; veter Mount Hotham, Los Caracoles, Katu-Jaryk, Tianmen, Rio do Rastro; morje Chapman's Peak, Livorno, Newcastle; žuželke Livorno, Marrakesh, Townsville, Suzuka, Irohazaka, brazilski in avstralski kraji. Avstralske proge so na odločanju (#394): če postanejo testne, ostanejo brez zvokov okolja.

## Kje je kateri zvok: zvočni pasovi iz podatkov proge

Zvoki se ravnajo po tem, kar je ob cesti res zgrajeno (svet proge) in kar o kraju ve igra, zato se nova proga ozvoči sama, brez dodatnega dela.

1. **Ob zagonu dirke** modul izračuna zvočne pasove proge v kosih po ≤ 2 ms na sličico (kot `atmoGen` in `prep` v `js/sfx.js`), med odštevanjem pred štartom. Vzorec na sredinski črti vsakih 20 m (Nürburg ~1.050 vzorcev), za vsak vzorec in vsako stran ceste (levo, desno) vrednost 0–1 v `Float32Array`; skupaj do ~50 KB.
2. **Gozd**: drevesa iz sveta (instance rastlin; isto pravilo kot `woods()` v `js/world-zivali.js`: višja od 3,2 m, mreža 12 m; funkcijo izvozimo kot `World.woods(o)` s predpomnjenjem, da se ne računa dvakrat). Število dreves do 60 m od vzorca na vsaki strani → gostota.
3. **Voda**: vodne površine sveta (isto pravilo kot v `occGrid`: material s teksturo vode), rastrirane v celice 8 m samo do 150 m od ceste. Za vsak vzorec najbližja voda (razdalja, stran), vrsta po obliki: ozka in dolga potok ali reka (širina pod ~12 m potok), velika in zaobljena jezero, `def.sea` ali voda do roba sveta morje, strme ploskve vode slap.
4. **Naselja**: naselja odprtih cest (`OB[…].towns` v `js/world.js`, `o.lampZones`: Kranjska Gora, Medvode, Zbilje, Valburga, Smlednik, Ouni, Kakaristo) in mestna proga (`def.cityStage`, Harju). Za druge vasi (Ouninpohja, Livorno, Nürburg) kratka tabela `VAS` v `js/sfx-okolje.js`, cerkve (`amenity=place_of_worship`, `building=church`, do 600 m od ceste) iz OpenStreetMap (glavni API, `CLAUDE.md`; `tools/zvoki-pasovi.mjs --osm <id>`) v tabeli `BELLS` (m od štarta, stran, oddaljenost); ne v datotekah prog, da sprememba ne sega v `js/tracks/`. Vas brez cerkve v OSM dobi zvonjenje na začetku vasi. Samo prave proge.
5. **Veter**: višina ceste v razponu proge (zgornji del in vrh = prelaz) krat odprtost (malo dreves) krat nadmorska višina (`GEO.tracks[id].offset` + višina ceste); ob morju dodatek. Proga ima lahko svoj najmanjši veter ob cesti (`wind` v datoteki proge; Wadi Mujib 0,4: veter v golem kanjonu, kjer ob cesti ni gozda, vode ne vasi).
6. **Podnebje**: zemljepisna širina iz `GEO.tracks[id].lat0` (za Bathurst, Crystal Palace, Livorno in Rio ter pet kratkih prog dela 4 iz `docs/nove-proge-1-0.md` (Mã Pí Lèng, Wadi Mujib, Sans Souci, Banaue, Atitlán), ki jih v `GEO` ni, kratka tabela v modulu z višino štarta; Pikes Peak makadam kot Pikes Peak), nadmorska višina, izbrani letni čas, del dneva in vreme.
7. **Med vožnjo** je pas vzorec po `s` avta (en indeks na sličico, brez iskanja). Posamezni zvoki (ptica, zvonjenje, galeb) se postavijo na pravo stran in razdaljo (glasnost in nizkoprepustni filter po razdalji, levo-desno po kameri, kot navijači na Pikes Peaku).
8. **Testne proge** (`def.test`) in nova mapa ostanejo brez zvokov okolja (zamrznjene, `CLAUDE.md`). Po odločitvi uporabnika 5. 11. 2026 so med njimi tudi proge ZDA razen Pikes Peaka: `baldy`, `beartooth`, `bigsur`, `detroit`, `maunakea`, `moki`, `monterey`, `mulholland`, `palomar`, `riverside`, `uncompahgre` (#355); 6. 11. še Vršič (#394) ter Mount Buller, Toronto, Trois-Rivières, Sani Pass in Bang Saen (#379).

Orodje `tools/zvoki-pasovi.mjs` izpiše pasove vsake prave proge (kratka tabela: od–do, zvok, stran) za pregled in teste; po novi progi ga zaženemo, kot `tools/proge-pregled.js`.

## Glasnost ob motorju

- Svoj ojačevalnik `okolje` na skupnem vodilu dirke (`bus`): v pavzi utihne kot vsi zvoki dirke, pod komentatorjem se stiša (`duck`).
- Osnovna glasnost: podlage (gozd, voda, veter, morje) ~24 dB pod motorjem pri srednjih vrtljajih, posamezni zvoki (ptica, zvon, galeb) do ~18 dB pod njim. To je »tiho«: jasno se sliši na štartu, v počasnih ovinkih, v cilju in na poti iz cilja, pri polnem plinu komaj.
- Maskiranje s hitrostjo: × (1 − 0,6 · gladek prehod od 30 do 160 km/h), torej pri 160 km/h ~40 % glasnosti stoječega avta. Ob tribunah in navijačih glasnost pade, kolikor so ti glasni; v predoru in galeriji okolje utihne.
- Stikalo (spodaj): Tiho × 0,5 (−6 dB), Normalno × 1 (privzeto), Glasno × 2 (+6 dB); razglas in vzkliki: glasnost govora 0,3 × stopnja.
- V posnetku dirke se pasovi berejo po avtu, ki ga kamera spremlja.

## Stikalo v Nastavitvah

Vrstica pod »Zvok« v `index.html`: **Zvoki okolja: Izklop / Tiho / Normalno / Glasno** (`data-set="amb"`; vrednost je množilnik glasnosti 0 / 0,5 / 1 / 2, privzeto 1 Normalno, to je dosedanja glasnost; `DEF` v `js/game.js`, druga vrednost ob zagonu postane 1), angleško »Ambient sounds: Off / Quiet / Normal / Loud« (`js/lang.js`). Shrani se z drugimi nastavitvami (`tdgp-settings`), zato ostane med zagoni; shranjeni vrednosti 1 in 2 prejšnjega stikala s tremi stopnjami (Tiho, Glasneje) ohranita glasnost. Deluje samo pri vklopljenem zvoku. Izvoz in uvoz profila ga preneseta sama (`S`). Oblika stikala: vprašanje `zvoki-okolja-glasnost`, štiri stopnje po odgovoru na `zvoki-okolja-uglasitev` (razdelek Odločitve).

## Baterija in obremenitev

Cilj: telefon ni bolj obremenjen. Grafika se ne spremeni (nič klicev risanja, nič oglišč; `tests/golden/perf.json` ostane). Za zvok:

- **Prenos 0 KB** (sinteza). **Pomnilnik** ≤ 1,5 MB medpomnilnikov (22.050 Hz, mono), samo za zvoke, ki jih ima izbrana proga; ob menjavi proge se sprostijo.
- **Priprava** v kosih ≤ 2 ms na sličico v meniju ali med odštevanjem (obstoječi `prepRun`, `idleKick`), nikoli več med dirko.
- **Zvočna nit**: hkrati največ 3 podlage in 3 posamezni zvoki (~25 vozlišč Web Audio). Glas, ki je tišji od −60 dB več kot 2 s, se ustavi in odklopi (nič ne stane) in se znova zažene, ko je spet potreben.
- **Glavna nit**: na sličico en indeks v pasove; parametri se spremenijo največ 10-krat na sekundo in samo ob spremembi nad 1 %. Cilj ≤ 0,05 ms na sličico v povprečju.
- **Varčevanje z baterijo** (Vklop ali ko Samodejno vklopi): samo podlage, brez posameznih ptic, zvonov in galebov, posodobitev 5-krat na sekundo. Zvok izklopljen ali Zvoki okolja Izklop: modul ne naredi ničesar (nobenega vozlišča, nobenega medpomnilnika).

## Testi (`tests/browser/okolje.test.mjs`)

Svoj test (zagon `node tests/browser/okolje.test.mjs`, ~7 min; `npm run test:related` ga izbere ob spremembi `js/sfx*.js`, `js/comm.js`, `js/world-zivali.js` ali `tools/zvoki-pasovi.mjs`):

1. **Pasovi** vseh pravih prog (svet proge zgrajen kot v igri): vsaka ima vsaj en zvok; Medvode vas in voda (Sava, jezero v Zbiljah); Ouninpohja gozd in vas; Katu-Jaryk veter zgoraj močnejši kot spodaj; Chapman's Peak morje; Marrakesh brez gozda in vasi; testne proge brez pasov; Pikes Peak brez vetra okolja (njegovo ozračje nespremenjeno). Nabor 3: krave na Spa, Red Bull Ringu in Rio do Rastru, mesto na Harjuju, Crystal Palaceu, v Montréalu in Marrakeshu, razglas na dirkališčih (ne na Ouninpohji; Bathurst brez mesta).
2. **Dirka v Medvodah** (avtopilot, zvok vklopljen): priprava glasov ≤ 1,5 MB v kosih; ob Savi se sliši reka, ob cerkvi zazvoni; pri 160 km/h ≤ 50 % glasnosti stoječega avta; ≤ 25 vozlišč; stikalo: Tiho = 0,5 × Normalno, Glasno = 2 × Normalno, Izklop: nič in nobenega vozlišča; vsaka izbira shranjena z nastavitvami in označena; igra, odprta s shranjeno Tiho, začne s Tiho. Glasnost pod motorjem pri srednjih vrtljajih (`SfxOkolje.probe`): podlage 20–30 dB, ptica, galeb in zvon vsaj 15 dB.
3. **Ozračje** (`Render.setAtmos`, `setRain`): ponoči brez ptic, s črički; v mraku z dežjem brez ptic in žuželk; pozimi brez žuželk.
4. **Obremenitev**: glavna nit `SfxOkolje.step` ≤ 0,05 ms na sličico pri 60 sličicah na sekundo (do 600 sličic dirke); zvočna nit brskalnika (`AudioOutputDevice`, čas niti iz `/proc`, samo Linux) z okoljem ≤ 15 % več kot brez (4-krat izmenično brez in z okoljem po 4 s, avto stoji na štartu v Medvodah). Izmerjeno +1–10 %. Namesto izrisa v `OfflineAudioContext` iz načrta: ta je ob igri, ki riše, preveč nemiren, in okolje primerja z enim motorjem, ne z vsem zvokom igre (motorji tekmecev, navijači, kolesa, veter vožnje), ki ga zvočna nit res dela.
5. **Ouninpohja** ptice in gozd; **Pikes Peak** brez vetra okolja, ptice pod gozdno mejo.
6. **Nabor 3** (Spa brez tekmecev, avto stoji ob najglasnejši tribuni; sinteza govora brskalnika nadomeščena s testno, ki beleži stavke): razglas in vzkliki se slišijo, tiho (≤ 0,31) in v angleškem glasu, ki ni komentatorjev; nikoli med komentatorjem ali 3 s za njim; ko začne komentator, se naš stavek prekine. Krave (zvonci, mukanje) ob čredi pred avtom; Marrakesh oddaljen promet in golobi; glasnost kravjega zvonca, mukanja, blejanja, goloba in prometa pod motorjem (`probe`).

Ostali povezani testi: `lang.test.js` (angleška vrstica), `perf.test.mjs` (nespremenjen), `tools/stamp.js --check` (nova skripta v `index.html`).

## Datoteke

- `js/sfx-okolje.js` (novo): pasovi, glasovi, mešalnik; v `index.html` za `js/sfx.js`.
- `js/sfx.js`: priklop v dveh vrsticah: `update()` pokliče `SfxOkolje.step(ctx, bus, …)` (glasnost navijačev in tribun, predor, Pikes Peak, zvok vklopljen, dirka teče), `silence()` pokliče `SfxOkolje.silence()`. Stikalo nastavi `js/game.js` (`SfxOkolje.set(S.amb, zvok, varčevanje)`), ne `Sfx.setAmb()`.
- `js/world-zivali.js`: `World.woods(o)` izvožen in predpomnjen.
- `index.html` (vrstica v Nastavitvah, skripta), `js/game.js` (`amb` v `DEF`, nastavitev), `js/lang.js`.
- `js/tracks/<id>.js`: nič (vasi in cerkve so v `VAS` in `BELLS` v modulu).
- `js/comm.js`: ena vrstica v `speakNow()`: pred vsakim stavkom komentatorja ali sovoznika pokliče `SfxOkolje.hush()` (razglas in vzkliki utihnejo).
- `tests/browser/okolje.test.mjs` (novo; v `tests/run.js`), ne razširitev `sound.test.mjs`: manj sporov s #284 in krajši test.
- `tools/zvoki-posnetki.mjs` (novo): kratki posnetki zvoka igre za uglaševanje po ušesu (dirka na pravi progi v brskalniku, avto na avtopilotu ali stoji na izbranem mestu, ves zvok dirke v mp3); `node tools/zvoki-posnetki.mjs medvode --m 1300 --zvon`, več posnetkov z `--seznam f.json`. Posnetki ne gredo v repozitorij.
- Dokumenti: `docs/igra.md` (nov razdelek »Zvoki okolja« za »Zvok navijačev in predori«), `README.md` (Nastavitve; »Zasluge« samo pri posnetkih), `docs/kazalo.md`, `tests/README.md`.

## Koraki in ocena ur

| Korak | Kaj | Ure |
|---|---|---|
| 1 | Zvočni pasovi iz sveta in `GEO`, orodje `tools/zvoki-pasovi.mjs`, vnosi vasi in cerkva (OSM) | 3 |
| 2 | Glasovi: ptice, šelestenje, potok, reka, slap, jezero, morje, galebi, zvonovi, veter, črički, škržati; medpomnilniki v kosih | 5 |
| 3 | Mešalnik: pasovi × del dneva, letni čas, vreme; maskiranje, stran, ustavljanje tihih glasov; stikalo, angleščina, varčevanje | 3 |
| 4 | Testi in meritve obremenitve | 2,5 |
| 5 | Uglaševanje v Medvodah, na Ouninpohji, Chapman's Peaku in Katu-Jaryku ter v Livornu; dokumenti; kratki posnetki iz igre za uporabnika | 2 |

| 6 | Nabor 3: živali (kravji zvonci, ovce po `World.life`), mestno ozadje (oddaljen promet, golobi), razglas po zvočniku in vzkliki v angleščini; testi | 5 |

Skupaj ~20 h (±4 h): seja 1 koraki 1–3 (~11 h), seja 2 koraki 4–6 (~9,5 h); Opus, napor max.

Pogoj za začetek (odgovori so 6. 11.): #319 (razdelitev datotek prog) in #284 (boksi, `js/sfx.js`) na `main` ali zaprta, da ni sporov; pred novimi progami (`docs/vrsta.md`). Kodo začne nova seja, ko je prostor (koordinacija »VSE SEJE 2«); odpre osnutek pull requesta »Zvoki okolja« in vrstico iz Načrtovano izbriše.

## Odločitve (stran Odločitve 3)

Odgovori uporabnika 6. 11. 2026 (stran Odločitve 3, prebrano):
- `zvoki-okolja-vir` = **1 · vse sintetizirano** (Web Audio kot motorji, 0 KB, brez licenc in zaslug). Govor (razglas, vzkliki) je sinteza govora v brskalniku kot pri komentatorju (`js/comm.js`, angleški glas, 0 KB), tiho in nikoli hkrati s komentatorjem ali sovoznikom.
- `zvoki-okolja-nabor` = **3 · šest zvokov ter živali, mesto in razglasi**: kravji zvonci in ovce, kjer so v igri; oddaljen promet in golobi na uličnih progah; na dirkališčih razglas po zvočniku in vzkliki ljudi v angleščini (korak 6).
- `zvoki-okolja-glasnost` = **1 · Izklop / Tiho / Glasneje, privzeto Tiho** (~24 dB pod motorjem pri 60 km/h).

Odločitev uporabnika 5. 11. 2026 ob 16.10 (sporočila koordinacija »VSE SEJE 2«): »Vse zvoke delaj v angleščini.« Govor v zvokih okolja je v angleščini (razdelek Zvoki in kdaj se slišijo); vprašanji `zvoki-okolja-nabor` in `zvoki-okolja-vir` sta prilagojeni.

Odločitev uporabnika 5. 11. 2026 (sporočila koordinacija »VSE SEJE 2«): proge ZDA razen Pikes Peaka postanejo testne in zamrznjene (#355). Zvoki okolja zanje niso načrtovani (razdelek Kje je kateri zvok, točka 8); pričakovani pasovi, testi in primeri zvokov so brez njih.

Odgovor uporabnika 7. 11. 2026 (tabla #382, komentar 6700708750; sporočila koordinacija »VSE SEJE 2«): `zvoki-okolja-uglasitev` = **1 · prav je**, privzeta glasnost ostane taka, kot je. Dodatna želja: igralec glasnost zvokov okolja spremeni sam v Nastavitvah. Narejeno s štirimi stopnjami **Izklop / Tiho / Normalno / Glasno** (× 0 / 0,5 / 1 / 2), privzeto Normalno = dosedanja glasnost (prej »Tiho«), Glasno = prejšnja »Glasneje« (razdelek Stikalo v Nastavitvah).

Primeri vseh zvokov (prototip v brskalniku, z motorjem za primerjavo glasnosti): https://claude.ai/artifact/RAKVe7d2UNWUAStf16xv2h, povezani tudi pri vprašanjih.

## Stanje

- 5. 11. 2026: načrt napisan (#341); primeri zvokov objavljeni; vprašanja zapisana na stran Odločitve 3; tema v `docs/vrsta.md`, Načrtovano (#338). Ob 16.10 odločitev uporabnika: govor v zvokih okolja v angleščini (načrt in vprašanji prilagojena). Isti dan: proge ZDA razen Pikes Peaka so testne (#355), zato so iz načrta in primerov zvokov odstranjene.
- 6. 11. 2026: odgovori uporabnika zapisani (vir 1, nabor 3, glasnost 1; ocena ~20 h). Vršič (#394) ter Mount Buller, Toronto, Trois-Rivières, Sani Pass in Bang Saen (#379) gredo med testne proge, zato so primeri, testi in uglaševanje na drugih pravih progah. Koda še ni začeta.
- 6. 11. 2026: koda začeta (seja session_01WbgGzrjE2xYA6b87o2SYHz, koraki 1–3; veja `zvoki-okolja/koda`, osnutek PR »Zvoki okolja«; uporabnik je rekel »začni«, zato se začne pred #284, koda je v svoji datoteki s kratkim priklopom; na `main` gre po #284).
- 6. 11. 2026: **koraki 1–3 narejeni** (#414, osnutek). Pasovi vseh 25 pravih prog (`node tools/zvoki-pasovi.mjs`), 12 glasov, mešalnik, stikalo Zvoki okolja (Izklop / Tiho / Glasneje, angleščina), varčevanje z baterijo (samo podlage, 5-krat na sekundo). Odstopanja od načrta: vasi in cerkve v `VAS`/`BELLS` modula (OSM: Medvode, Livorno, Nürburg, Harju, Newcastle, Townsville, Chapman's Peak, Longford); priprava v kosih ≤ 1,5 ms na sličico na štartu in ≤ 0,75 ms po štartu, dokler ni končana (gozd po `World.woodsGen`, voda po tabelah brez razpršenih map; izmerjeno 2–4 ms največ ob redkem čiščenju pomnilnika); Crystal Palace: dolgi jezeri v parku sta jezero, ne reka (`WKIND`); `SfxOkolje.levels()`, `SfxOkolje.prep()` (vse naenkrat, za teste) in `SfxOkolje.probe()` (en glas brez zvočnika, za uglaševanje in teste) namesto `Sfx.levels().okolje`. Glasnost uglašena z `probe`: podlage pri polnem pasu (voda najbližje) ~24 dB pod motorjem pri srednjih vrtljajih (vsi motorji kompleta so pri −19,7 dB ±0,4, dizel −17,9), ptica, galeb in zvon najbližje ~18–23 dB pod njim (`BG`, `SP` v modulu). Test `tests/browser/okolje.test.mjs` (16 preverjanj, ~2 min).
- **Predaja za sejo 2 (koraki 4–6, Opus, napor max)**: veja `zvoki-okolja/koda`, PR #414 (osnutek, na `main` po #284). (4) Testi v `okolje.test.mjs` še manjkajo: ponoči brez ptic in s črički (Medvode, `Render.setAtmos`), v dežju brez ptic in žuželk, pozimi brez žuželk, Pikes Peak brez vetra okolja (`levels().tg.wind` 0), Ouninpohja ptice in gozd; obremenitev: `Sfx.update` z okoljem v povprečju ≤ 0,05 ms dlje (600 sličic), izris 20 s v `OfflineAudioContext` ≤ 15 % dlje. (5) Uglaševanje po ušesu v Medvodah, na Ouninpohji, Chapman's Peaku, Katu-Jaryku in v Livornu (`BG`, `SP`, `TOD_B`, `SEASON_B`; ptice so lahko pogostejše), kratki posnetki iz igre za uporabnika (vprašanje s posnetki na strani Odločitve, če je kaj njegovega). (6) Nabor 3: kravji zvonci in ovce (`World.life`), mesto (promet, golobi: Marrakesh, Montréal, Harju), razglas in vzkliki v angleščini (sinteza govora kot `js/comm.js`, nikoli hkrati s komentatorjem). Orodja: `node tools/zvoki-pasovi.mjs [id…]` (pasovi), `--osm <id>` (cerkve in vasi iz OSM). Pri spoju s #284 v `js/sfx.js` ostaneta samo vrstici s `SfxOkolje` (v `update()` za `sambaStep`, v `silence()`).
- 6. 11. 2026: **koraka 4 in 6 narejena, korak 5 čaka na uporabnika** (seja session_01WbgGzvNdPrTNqxX3gQ6Pvt, #414). (4) `okolje.test.mjs` ima 33 preverjanj (~7 min, razdelek Testi): ozračje, Ouninpohja, Pikes Peak, obremenitev glavne niti (0,014 ms na sličico pri 60 sličicah) in zvočne niti (+1–10 %, meja 15 %; namesto izrisa v `OfflineAudioContext`, ki je ob igri, ki riše, preveč nemiren). Za manj dela na zvočni niti so počasni parametri (glasnost, filtri, stran) k-rate. (6) Nabor 3 (razdelek Zvoki in kdaj se slišijo): krave na Spa, Red Bull Ringu in Rio do Rastru (ovce ima samo Longford, ki je brez zvokov okolja), mesto na Harjuju, Crystal Palaceu, v Montréalu in Marrakeshu, razglas in vzkliki na krožnih progah s tribunami (sinteza govora brskalnika v angleščini, splošna besedila brez imen; nikoli hkrati s komentatorjem: `js/comm.js` pred vsakim stavkom pokliče `SfxOkolje.hush()`, premor 3 s od prve sličice, ko komentator molči, po uri govora). Pod motorjem: kravji zvonec −20,1 dB, mukanje −19,4, blejanje −18,4, golob −20,1, promet −24. Avstralske proge Hotham, Longford, Newcastle in Townsville so brez zvokov okolja (`NO`; odločitev uporabnika 6. 11.: Avstralija v test, tabla #382). (5) 13 posnetkov iz igre (`tools/zvoki-posnetki.mjs`; slika se pri snemanju ne riše, da igra teče s 60 sličicami): https://claude.ai/artifact/3FkjHnuNiUj8uDUq2ksQWH (Ouninpohja Izklop / Tiho / Glasneje in ptice 2-krat, Medvode, Chapman's Peak, Katu-Jaryk, Livorno, Spa, Marrakesh); vprašanje `zvoki-okolja-uglasitev` na strani Odločitve (1 prav je, 2 vse glasneje za 3 dB, 3 vse tišje za 3 dB, 4 ptice 2-krat pogosteje). Po odgovoru: 2 ali 3 `BASE` v modulu × 1,41 ali × 0,71 in meje glasnosti v testu za 3 dB; 4 `opts.birdP` 2; nato `okolje.test.mjs`.
- 7. 11. 2026: **korak 5 končan, vsi koraki 1–6 narejeni** (#414). Odgovor na `zvoki-okolja-uglasitev` = 1: glasnost ostane (`BASE`, `BG`, `SP` nespremenjeni). Po dodatni želji uporabnika ima stikalo Zvoki okolja štiri stopnje: Izklop / Tiho / Normalno / Glasno (× 0 / 0,5 / 1 / 2; angleško Off / Quiet / Normal / Loud), privzeto Normalno = dosedanja glasnost, shranjeno z drugimi nastavitvami. `okolje.test.mjs` ima 34 preverjanj (stopnje, shranjevanje, zagon s shranjeno Tiho). PR #414 ostane osnutek do vrste (`docs/vrsta.md`).
