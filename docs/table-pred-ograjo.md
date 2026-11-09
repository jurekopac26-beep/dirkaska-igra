# Table pred ograjo, da jih lahko zbiješ (prave proge)

Zahteva uporabnika 4. 11. 2026 (poročila iz orodja za napake na Santa Monica Mountains, ki je istega dne postala testna proga):

- »table naj bodo na notranjem delu ograje, da jih lahko zbiješ, postavi jih tam, kjer so v resnici«
- »ta tabla naj bo tudi pred ograjo, da jo lahko zbiješ«
- »popravke naredi na drugih progah, na tej progi ne urejaj ničesar več, saj je v kategoriji test«

Velja za vse prave proge (`def.test` ne), ne za testne (`CLAUDE.md`).

## Kaj že je

- `roadside(o)` v `js/world.js` (nastavitve `OB`: `vrsic`, `medvode`, `ouni`): krajevne table, omejitve hitrosti, smerne table v ostrih ovinkih. Kar avto doseže, je podirna stvar (Core `PROPK`: `rssign`, `rschev`, `rsboard`; Render jih riše instancirane, ena vrsta en klic risanja). Kjer na črti ograje stoji ograja, varnostna ograja ali zid, gre tabla pred njo, če je prostor (0,3 m od asfalta in 0,3 m od ograje), sicer **za njo** (statična, ne da se je zbiti).
- Druge prave proge imajo table v svojih graditeljih (`js/world-<tema>.js`, npr. `greatalpine`, `hotham`, `beartooth`, `palomar`, `baldy`, `bigsur`, `caracoles`, `rastro`, `katu`, `newcastle`, `townsville`, `longford`, `harju`, `rbring`, `pikes`), večinoma kot del statičnih mrež.

## Kako

1. **Pregled** (orodje v `tools/`, brez sprememb igre): za vsako pravo progo seznam tabel (statične in podirne) z razdaljo od roba asfalta in od črte ograje (pred, na, za njo) ter vir položaja (OSM `traffic_sign`, `highway=stop|give_way`, smerne table; ali postavljeno po pravilu). Rezultat: tabela v tem dokumentu (proga, koliko tabel za ograjo, koliko pred njo).
2. **Pravilo za vse:** tabla stoji pred ograjo (med asfaltom in ograjo, 0,3 m od obeh), kjer je prostor; kjer ga ni (ozka bankina), tik pred ograjo in podirna. Za ograjo samo, kar v resnici stoji daleč od ceste (npr. velike usmerjevalne table nad brežino), in tega je čim manj.
3. **Po skupinah prog** (vsaka skupina svoj pull request, `CLAUDE.md`): statične table premakni pred ograjo kot podirne (`rssign`, `rschev`, `rsboard` ali kind proge), položaj iz OSM, kjer ga ima, sicer kjer je bila tabla. Skupine: najprej proge, kjer je tabel za ograjo največ (iz pregleda).
4. **Testi:** v testu vsake skupine: na progi nobena tabla ni za ograjo, kjer bi šla pred njo; vse table pred ograjo so podirne; reference `world.json` in `perf.json` znova (obremenitev ne sme zrasti čez mejo, `perf.test.mjs`).

## Pravila

- Table generične ali z zemljepisnimi imeni (krajevne table), brez imen podjetij, lokalov in oseb (`CLAUDE.md`, Pravna varnost).
- Položaji samo iz OpenStreetMap (ODbL), nikoli iz Google Maps ali Street View.
- Grafika za kamero za avtom: table 1,8-krat večje in nagnjene nazaj kot v `roadside()`.

## Stanje

- 4. 11. 2026: načrt; pregled še ni narejen.
