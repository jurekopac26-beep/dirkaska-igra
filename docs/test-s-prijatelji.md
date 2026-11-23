# Test s prijatelji: štetje igranja

Odločitev uporabnika 12. 11. 2026 (~0.50, prek Mateja): prijatelji igrajo igro in uporabnik vidi, koliko kdo igra. Samo za ta test.

Uporabnik je štetje preizkusil s T1 (12. 11. 2026 ~23.45, prek Mateja): »deluje, super«. Hkrati je naročil tri popravke:
mesto zapuščene dirke (prej vedno 1), avto in čas na progi / v meniju / v garaži. Vsi trije so v istem PR (#665).

## Kaj počne igra (`js/tester.js`)
- Pošilja **samo** na napravi, odprti z `index.html?tester=<koda>` (kode T1–T30 da uporabnik prijateljem; kdo je kdo, ve samo on).
  Brez kode ne pošlje nič: ne javnim igralcem ne v testih (brskalnik testa, `navigator.webdriver`, nikoli; izjema je samo lastni test).
- Prvič pokaže kratko obvestilo (»Strinjam se« / »Ne«). »Ne« si zapomni in ne sprašuje več; nova koda vpraša znova.
- Po privolitvi si naprava zapomni kodo (`localStorage` `rra-tester`), zato šteje tudi nameščena igra in poznejši obiski brez kode.
  `?tester=off` (ali `izklop`, `ne`) kodo pozabi.
- Pošlje: kodo; obisk (začetek, utrip na minuto, ko je igra vidna, konec; nov obisk po 2 min odsotnosti, prehod med igro in
  garažo v istem zavihku ostane isti obisk); vsako dirko ob koncu (proga, način, vreme, avto z imenom iz igre, trajanje v sekundah,
  `cilj` / `odstop` / `zapustil`, mesto); sekunde, ko je bila igra vidna, po kraju (`cp` na progi, `cm` v meniju, `cg` v garaži);
  napravo (telefon, tablica ali namizje, sistem, brskalnik, brez različic) in žig igre. Brez imen, brez IP, brez piškotkov.
- **Mesto** je pravo mesto med tekmeci, tudi ob izhodu sredi dirke (takratni vrstni red); kjer ga ni (policija, vožnja na čas,
  kvalifikacije, izzivi, zabavni načini, misije, avtošola, sam na progi) ali ga igra ne ve, se pošlje prazno (pregled: »—«), nikoli 1.
- Garaža (`garaza.html`) naloži `js/tester.js` in šteje čas v garaži (žig `garaza`).
- `js/game.js` kliče `Tester.zacni` (začetek dirke), `Tester.konec` (`finishRace`) in `Tester.pusti` (izhod na naslov) samo, ko je
  `Tester.on`; fizika in obremenitev sta nespremenjeni.

## Strežnik (`server/test-s-prijatelji/`)
- Cloudflare Worker z bazo D1 (brezplačni paket): `worker.js`, `schema.sql`, `wrangler.toml` (id baze samo lokalno, ne v repozitorij).
- `POST /e` sprejme samo kode iz skrivnosti `KODE` in samo z izvora igre (GitHub Pages in lokalni strežnik); čas da strežnik.
- Pregled: `GET /p/<ključ>` s skrivnostjo `PREGLED` (dolg naključen ključ); za vsakega testerja zadnji obisk, minute, obiski,
  minute na progi / v meniju / v garaži, avti (dirke, minute; najbolj vozeni prvi), proge, dnevi (po ljubljanskem času, z minutami
  po kraju), zadnjih 30 obiskov (minute po kraju), zadnjih 50 dirk (z avtom, mesto ali »—«); seznam kod še brez igranja. Vse drugo: 404.
- **Naslova pregleda, ključev, id-jev računa in baze ni v repozitoriju, na tabli ali drugje**; povezavo ima samo uporabnik.

## Posodobitev strežnika
- Po spremembi `worker.js`: `wrangler deploy` (v `wrangler.toml` lokalno vpiši id baze) ali nalaganje skripte prek Cloudflare API z
  istimi vezavami (`DB`, skrivnosti `KODE`, `PREGLED`). Nova tabela ali stolpec: `schema.sql` na bazi (`wrangler d1 execute`);
  baza s prvo shemo dobi nove stolpce z `migracija-1.sql` (enkrat; 12. 11. izvedeno, zapuščenim dirkam pobriše napačno mesto 1).
- Več kod: skrivnost `KODE` (z vejicami ločen seznam), brez spremembe igre.

## Testi
- `tests/browser/tester.test.mjs`: brez kode in v brskalniku testa nič; obvestilo, »Ne«, nova koda, »Strinjam se«, dirka ob izhodu
  (avto, mesto ali prazno, sekunde po kraju) in v cilju, garaža šteje, ponovni obisk brez kode, `?tester=off`. Naslov števca odgovori test sam (nič ne gre z naprave).
