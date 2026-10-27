# Stanje ob pavzi Mon Oct 19 14:16:25 UTC 2026
## s1 claude/boksi-ekipa 40bc694 Test boksov: ekipa v garaži (pripravljena) ne šteje kot ekipa na ploščadi
## s2 claude/boksi-obvestila c5b985a Boksi: namigi ob prvem postanku (računalnik vozi, mehaniki, pripravi se), zapomnj
## s3 claude/boksi-zvok 8bdaeb5 Vibracija: tri stopnje (Izklop / Osnovno / Vse; stari Vklop je zdaj Vse)
## s4 claude/boksi-izbira f736a9a Postanek po meri: list pokonci neprosojen (pedali in puščice pod njim ne proseva
## s5 claude/boksi-gume 8d40bb2 Strategije tekmecev na dolgih dirkah: 1 ali 2 postanka, zmesi in krogi po načrtu 
## s6 claude/boksi-posnetek e6a9a33 Posnetek dirke: postanek v boksih kot kratek film (mehaniki in filmska kamera iz p
 M README.md
 M index.html
 M js/render.js
 M tests/README.md
 M tests/browser/pitreplay.test.mjs
## s7 claude/boksi-noc-dez 7d1c086 Boksi v dežju: plast vode na višini ceste (na tla sveta le v Newcastlu in Toront
## s8 claude/boksi-gume-pavza e0e3c6d Barvni rob gum po zmesi: pas na boku vseh gum, mehaniki z gumami zmesi
## s9 claude/boksi-proga-opozorila 1f99202 Drobci gum ob idealni liniji (marbles): pas ob liniji na zunanji strani ovinkov, m
## wb claude/boksi-prikljucek-b 57467e6 Kamera vedno 30 %, ovinki brez imen oseb, gumb ZAMENJAJ KOLO v slovenščini (#148
 M README.md
 M index.html
 M js/core.js
 M js/tracks/bangsaen.js
 M js/tracks/cpalace.js
 M js/tracks/detroit.js
 M js/tracks/longford.js
 M js/tracks/newcastle.js

## Odločitve uporabnika (27. 10.)
- Mehanikov NE posodabljamo (morda novi liki kasneje). Kamera ostane: proto-kamera.patch (scratchpad/kamera2/).
- 2B: kamera na izvozu ostane v pasu boksov (≥1,2 m od zidu).
- 3B: dokončaj narejeno z mehaniki (19, 34, dežne jakne 36, gume v rokah 70, posnetek 10); počakajo nezačeti: 43a, 66, 67, 74, 99, 7, 45, 17, 37, 96, 87-brisanje vizirja. Zdaj: 72, 44, 48, 87-umazan avto.
- Nov predlog 101: gumbi za vožnjo zbledijo ob prevzemu, se prikažejo pred predajo (vprašanje 9: A ob VOZIŠ TI! / B ~2 s prej, priporočam B).
- Q1 nadomeščen z novo zasnovo: kamera kot vedno; ob meniju Postanek po meri se oddaljuje vse počasneje; ob POTRDI filmsko na bok formule; nato sledi kot dron in počasi v pozicijo za predajo (slike v scratchpad/kamera3/, vprašanje dron-A/B).
- Odprto: 84/91/95/96 (priporočeno 84B, 91C, 95B, 96B), vprašanje 8 (5 skupin, priporočeno B).
- 84 (vpr. 4): izbrana smer B; delam po 6 različic A, B in A+B skupaj (scratchpad/moznosti2/) — dokončna izbira še odprta.
- 91 (vpr. 5): C; delam 6 različic C (moznosti2/91-C*) — dokončna izbira še odprta.
- 95 (vpr. 6): C zastava ob vratih (uporabnik izbral C, ne priporočeni B).
- 96: A+B skupaj (ekipa skače ob zidu + eden stegne tablo čez zid; na tabli tvoje novo mesto, npr. »POS 4«, ne »+1«) — počaka na nove like (3B).
- 101 gumbi (vpr. 9): B — prikažejo se ~2 s pred VOZIŠ TI!, povsem vidni ~0,5 s prej.
- 8B: 5 skupin (1 kamera+zvok+posnetek+101, 2 postanek+obvestila, 3 gume+proga, 4 videz boksov, 5 uvoz+izvoz).
- Dron na izvozu: po spustu nizko ob avtu (A, v pasu), nato se kamera VES ČAS počasi enakomerno dviga (brez postanka v B, nikoli dol) in počasi prehaja za avto; v položaj kamere za avtom pride točno ob predaji (VOZIŠ TI!).
- 91: uporabniku je všeč C4 (časovnica z oblaki) — delam 6 različic C4 (moznosti2/91-C4-*).
- 91: še 6 različic C6 (nasvet, asfalt in oprijem) — moznosti2/91-C6-*.
- 84: uporabnik želi B5; 6 različic B5 — prah v barvi sledi, svetlejši, mehak gradient navzven (tam manj vozijo) — moznosti2/84-B5-*.
- 10B: varčno delo (en agent na skupino, lažji model za rutino, en pregled na skupino, samo napake iz dnevnikov, slike samo za vidne spremembe). ČAS NI POMEMBEN — raje počasneje in manj tokenov (zaporedno, ne vzporedno).
- 91: uporabnik izbral smer C4-2 (visok pas, velike ikone) + lepa animacija vremena; delam 6 animiranih različic (moznosti2/91-C42-*.mp4).
- 84 (proga se zgumira): PRESTAVLJENO NA KASNEJE po želji uporabnika ("shrani si, da morava to še narediti"). Smer B5 (prah v barvi gume, svetlejši, mehak prehod); 6 različic B5 v moznosti2/84-B5-*, priporočeno B5-3; izbira še odprta. Skupina 3 je brez 84.
- Opomnik 3. 11. 03:16 UTC (trig_01FENN9pnUaAMWXRNKrowW7A): 84 + pregled vseh predlogov + 12 novih predlogov (102–113) na strani.
