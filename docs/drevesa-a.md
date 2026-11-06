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
