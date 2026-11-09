# Drevesa A: cenejša grafika dreves (mehke krone)

Načrt, odločitve in stanje teme (pravilo v `CLAUDE.md`, Postopek). Vsaka odločitev je zapisana enkrat, tu.

## Odločitve
- **Uporabnik 5. 11. 2026 zvečer:** drevesa v različici **A · mehke krogle** iz prototipa (veja `wip/drevesa-a-prototip`, `tools/drevesa-a-prototip/PREDAJA.md`), da so drevesa cenejša in je ob cesti lahko več dreves; tema nadomesti redčenje gozda (prestavljeno za kasneje, `docs/vrsta.md`).
- **Uporabnik 6. 11. 2026 ob 12.23:** začne biketraveler takoj (prevzem od jure.kopac26, ki stoji do ned. 8. 11. 10.00); preverjanje na Spa (Bathurst je na izbiri); drugega novega dela biketraveler zdaj ne začne (tabla #382).

## Meje
- Cenejše, ne dražje: manj oglišč na drevo, enako ali manj klicev risanja; nobena prava proga ne postane dražja (`tests/golden/perf.json`, meja ~300 klicev in ~900 tisoč oglišč).
- Testne proge so zamrznjene (`CLAUDE.md`): njihovih datotek in graditeljev ne spreminjamo; skupna koda sme veljati za vse proge.
- Klici RNG sveta ostanejo enaki (drevesa imajo svoj `rng`), da se poznejši predmeti ne premaknejo.
- Samo kamera za avtom; slike na Spa, telefon pokonci in ležeče.

## Zasnova
- **Skupno za vse proge** (`js/world.js`): oblika drevesa v `IChunks` (zelena enotska rastlina, ista kot pri `THIN`) se indeksira (`weldGeo`: enaka oglišča ploskev postanejo eno; slika ostane ista, telefon vsako oglišče preračuna enkrat). Na NIZKI senco drevesa riše osmerec čez krošnjo (`treeShadow`, 8 ploskev) namesto grobe kopije; drevo z do 24 oglišči meče svojo senco. Osmerec zasede mesto grobe kopije, kjer jo je igra že delala; kjer je ni, nastane z lastnim RNG sveta (`ownRnd`, `userData.own`), da dirka s semenom na NIZKI vleče ista naključna števila kot prej (na progah z obliko A je oblika drevesa nova).
- **Gradniki A** (`AB`, `aPuff` krošnja, `aTier` stopnja iglavca, `aStar` stopnja namesto `starCone`, `aTrunk` deblo): indeksirani; krošnja temna spodaj in topla zgoraj, stopnje iglavcev mehke z `n` ploskvami namesto `2n`.
- **Proge z obliko A:** Spa (`spaTreeGeo`), Nordschleife in vse proge z `nrTreeGeo` (Red Bull Ring), Ouninpohja (smreke), Katu (macesen), Harju (smreka). Krošnje iz `ico` na drugih progah so že mehke in ostanejo (indeksirane skupno). Newcastle, Longford, Mount Hotham in Townsville gredo v test z zbirno vejo B (odločitev uporabnika 6. 11. 2026, `docs/vrsta.md`), zato njihovih graditeljev ne spreminjamo; skupna koda velja tudi zanje.

## Stanje
- 6. 11.: začetek, meritev Spa pred spremembo (`tools/obremenitev.mjs spa`): drevesa v najbolj gozdnatih vzorcih ~175–210 tisoč od ~420–520 tisoč oglišč na sličico (z njihovimi sencami), ~25 klicev.
- 6. 11. popoldne (#419): skupna koda za vse proge; oblika A na Spa, Nordschleife, Red Bull Ringu, Ouninpohji, Katu in Harju. Število dreves je enako kot prej (`THIN`). Pri polni grafiki je Spa skoraj enaka (do 0,3 % slike), iglavci na Ouninpohji, Katu in Harju so mehki kot v prototipu A.
- Obremenitev na NIZKI (`perf.test.mjs`, `main` in veja v istem zaporedju prog, 6. 11.; povprečje / največ v tisoč ogliščih): Ouninpohja 398 → 259 / 473 → 298, Tianmen 592 → 394 / 701 → 556, Iroha 494 → 380 / 581 → 482, Katu 531 → 429 / 613 → 542, Rio do Rastro 396 → 342 / 539 → 472, Spa 462 → 403 / 552 → 550, Nordschleife 312 → 266 / 339 → 283, Suzuka 483 → 450 / 618 → 568, Livorno 318 → 288 / 407 → 351. Klici risanja enaki ali manj (Ouninpohja 167 → 145, Tianmen 154 → 146, Iroha 189 → 183). Druge prave proge enako ali manj.
- Reference `world` in `perf` so znova ustvarjene samo za prave proge; vnosi testnih prog ostanejo, kot so (celoten `--update` bi jih izbrisal, zato so vrnjeni).
- Naprej (ni del te teme): več dreves ob cesti, ko uporabnik reče (redčenje gozda je prestavljeno).
