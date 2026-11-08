# Analiza kroga (predlog I12)

Odločitev uporabnika: predlog I12, izbran 7. 11. 2026 ob 16.05 (tabla #382, komentar 6708750136), začetek 8. 11. 2026 ob 16.05 prek koordinacije računa biketraveler. Veja `i12-analiza-kroga`, osnutek PR.

## Kaj
Po vsakem krogu zemljevid proge, ki pokaže, kje si izgubil (rdeče) ali pridobil (zeleno) čas proti najboljšemu krogu, in kratek nasvet (npr. »Prezgodaj zaviraš pred 3. ovinkom«).

## Kako (zasnova)
- `js/analiza.js` (`Analiza`, brez DOM in THREE, test `tests/analiza.test.js`): sled kroga po 10 m (čas prečkanja, hitrost, največja zavora, plin), zapis najboljšega kroga (`pack`/`unpack`), primerjava (`compare`): razlika po metrih, odseki po ovinkih (`track.corners`: od konca prejšnjega ovinka do izhoda tega), najslabši in najboljši odsek, nasvet iz zavorne točke, najmanjše hitrosti v ovinku in hitrosti na izhodu.
- Najboljši krog je shranjen po progi in načinu vožnje (`tdgp-analiza-<recKey>`, enak ključ kot rekordi in duhovi; ~5–25 KB). Krog z obiskom boksov ali s startom z mesta ni najboljši krog za primerjavo. Prvi krog na progi se samo shrani.
- Proge s krogi: po vsakem krogu se minizemljevid za ~8 s obarva (rdeče/zeleno), pod uro pride razlika in nasvet (`#h-split`, za časom kroga). Odprte ceste: vožnja do cilja je en »krog«.
- Zaslon rezultatov: blok »Analiza kroga« (`#res-an`) z večjim zemljevidom, puščicama za izbiro kroga, tremi odseki z največjo izgubo/pridobitvijo in nasvetom; pokonci in ležeče.
- Grafika: 2D platno, narisano enkrat na krog (ne vsako sličico); obremenitev prog se ne spremeni.
- Ni v šoli vožnje, v novi mapi (`race.nv`) in v begu pred policijo.

## Stanje
- 8. 11. 2026: začetek dela (seja biketraveler).
