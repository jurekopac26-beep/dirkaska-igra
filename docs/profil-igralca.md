# Profil igralca (croatiadata)

Tema iz table #382 (Matejeve odločitve, komentarji 7147987276, 7148056618, 7148224208).

## Faza 1: samo slike (koda še ne)
Za vsako točko 2–3 možnosti s slikami menija (priporočena prva) na strani Odločitve; en »ok« na točko.

- (a) dosežki: samo zemljepisna imena, brez imen oseb in znamk
- (b) statistika igralca: kilometri, zmage, najljubša proga
- (c) izvoz in uvoz shranjene igre v datoteko
- (d) samodejna varnostna kopija (zadnji dve kopiji)
- (e) primerjava avtov v garaži (moč, masa, pogon): samo slike
- (f) priporočen avto za vsako progo: samo slike

## Kar že obstaja
- Dosežki `ACH` in statistika `st` (`tdgp-stats`) v `js/game.js`, zaslon »Dosežki« (stari meni).
- Izvoz in uvoz profila (`profExport`, `profImport`), opomnik na izvoz (`js/shramba.js`).
- Samodejne kopije v IndexedDB (`rra-shramba`, `KEEP_N = 5`, dnevne).

Makete: `maketa-menija/profil/`.

## Faza 2: koda (odločitev Mateja, komentar 7205740929 na #1163)
- (a) 2: seznam dosežkov z vrstico napredka; najbližji odklepu na vrhu, odklenjeni na koncu (najnovejši prvi).
- (b) 3: »Kilometri na teden« (zadnjih 8 tednov, ta teden zlato; `st.wk`, ponedeljek → km, hrani 12 tednov), pod njim »Zmage« (% dirk) in »Najljubša proga« (različice štejejo h kartici).
- (c) 2: v nastavitvah razdelek »Shranjena igra«: Izvozi (zadnjič …), Uvozi (zamenja trenutni napredek), Varnostne kopije (število).
- (d) 1: kopija po vsaki končani dirki, kronometru in pobegu (`Shramba.snap('dirka', proga)`, `RACE_N = 2`); dnevne kopije ob zagonu ni več. Obnova: okno pove, kaj se izgubi (dirke, kovančki).
- (e) 1 in (f) 1 (»da« Mateja 27. 11., komentar 7207532856 na #1163): v garaži gumb »Primerjaj« (dva avta: moč z nadgradnjami, masa, moč na tono, pogon) in zlata oznaka »ZA TO PROGO« pri izbiri avta za progo (samo igralčevi avti; točkovanje `zaProgo()` v `js/garage.js`: makadam oprijem, AWD, reli; asfalt moč na tono, oprijem).
- Fizika vožnje nespremenjena; test `tests/browser/shramba.test.mjs` posodobljen.
