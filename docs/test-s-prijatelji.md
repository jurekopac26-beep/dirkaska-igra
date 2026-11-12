# Test s prijatelji: štetje igranja

Odločitev uporabnika 12. 11. 2026 (~0.50, prek Mateja): prijatelji igrajo igro in uporabnik vidi, koliko kdo igra. Samo za ta test.

## Kaj počne igra (`js/tester.js`)
- Pošilja **samo** na napravi, odprti z `index.html?tester=<koda>` (kode T1–T30 da uporabnik prijateljem; kdo je kdo, ve samo on).
  Brez kode ne pošlje nič: ne javnim igralcem ne v testih (brskalnik testa, `navigator.webdriver`, nikoli; izjema je samo lastni test).
- Prvič pokaže kratko obvestilo (»Strinjam se« / »Ne«). »Ne« si zapomni in ne sprašuje več; nova koda vpraša znova.
- Po privolitvi si naprava zapomni kodo (`localStorage` `rra-tester`), zato šteje tudi nameščena igra in poznejši obiski brez kode.
  `?tester=off` (ali `izklop`, `ne`) kodo pozabi.
- Pošlje: kodo; obisk (začetek, utrip na minuto, ko je igra vidna, konec; nov obisk po 2 min odsotnosti); vsako dirko ob koncu
  (proga, način, vreme, trajanje v sekundah, `cilj` / `odstop` / `zapustil`, mesto); napravo (telefon, tablica ali namizje, sistem,
  brskalnik, brez različic) in žig igre. Brez imen, brez IP, brez piškotkov.
- `js/game.js` kliče `Tester.zacni` (začetek dirke), `Tester.konec` (`finishRace`) in `Tester.pusti` (izhod na naslov) samo, ko je
  `Tester.on`; fizika in obremenitev sta nespremenjeni.

## Strežnik (`server/test-s-prijatelji/`)
- Cloudflare Worker z bazo D1 (brezplačni paket): `worker.js`, `schema.sql`, `wrangler.toml` (id baze samo lokalno, ne v repozitorij).
- `POST /e` sprejme samo kode iz skrivnosti `KODE` in samo z izvora igre (GitHub Pages in lokalni strežnik); čas da strežnik.
- Pregled: `GET /p/<ključ>` s skrivnostjo `PREGLED` (dolg naključen ključ); za vsakega testerja zadnji obisk, minute, obiski,
  proge (dirke, minute), dnevi (po ljubljanskem času), zadnjih 50 dirk; seznam kod še brez igranja. Vse drugo: 404.
- **Naslova pregleda, ključev, id-jev računa in baze ni v repozitoriju, na tabli ali drugje**; povezavo ima samo uporabnik.

## Posodobitev strežnika
- Po spremembi `worker.js`: `wrangler deploy` (v `wrangler.toml` lokalno vpiši id baze) ali nalaganje skripte prek Cloudflare API z
  istimi vezavami (`DB`, skrivnosti `KODE`, `PREGLED`). Nova tabela ali stolpec: `schema.sql` na bazi (`wrangler d1 execute`).
- Več kod: skrivnost `KODE` (z vejicami ločen seznam), brez spremembe igre.

## Testi
- `tests/browser/tester.test.mjs`: brez kode in v brskalniku testa nič; obvestilo, »Ne«, nova koda, »Strinjam se«, dirka ob izhodu
  in v cilju, ponovni obisk brez kode, `?tester=off`. Naslov števca odgovori test sam (nič ne gre z naprave).
