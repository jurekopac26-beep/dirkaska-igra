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

Faza 2 (po »ok«): točke a–d v novem meniju; fizika vožnje se ne spreminja.
Makete: `maketa-menija/profil/`.
