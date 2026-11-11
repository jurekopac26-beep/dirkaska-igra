# Najboljše vožnje

Odločitev uporabnika (11. 11. 2026 ob ~10.50, prek Mateja; `docs/vrsta.md`, »Načrtovano«): igra za vsako progo in vreme hrani 10 najboljših veljavnih voženj na čas kot posnetke `.rrp`. V Nastavitvah sta seznam in gumb »Deli 10 najboljših«: ena datoteka na progo, ki jo bere `tools/voznja.mjs`, da tekmeci vozijo po vožnjah igralcev (`docs/ai-po-tvoji-liniji.md`). Tema: PR #663 (jure.kopac26).

## Kaj igra hrani

- Koda je v `js/najboljse.js`. Priklop v `js/game.js`:
  - `NV_HOOKS`;
  - `Najboljse.cilj()` v `finishRace`;
  - `Najboljse.pusti()` ob novi dirki in ob izhodu v meni (dirka se vzame enkrat);
  - `Najboljse.init()` v `bindUI`.
- Vzame se samo vožnja na čas (`race.timeTrial`), ki gre do cilja in je ne ujamejo. Ne velja v misiji, policijskem pregonu ali zbirni dirki. Proga mora biti prava, ne `test` in ne `pending`. Krožna proga ne da vožnje (`krožna proga`).
- **Veljavna vožnja** sledi istim pravilom kot orodje (`RULES` in `measure` v `tools/voznja.mjs`) in uporablja iste besede za napake:
  - avto ni vrnjen na cesto;
  - ne zapelje v bokse;
  - se ne vrti;
  - ne vozi nazaj;
  - ni na zletu s ceste 3 s ali več;
  - se ne zaleti;
  - vreme se med vožnjo ne spreminja;
  - posnetek ima ves krog.

  `tests/najboljse.test.js` primerja pravila z orodjem, pri vsaki napaki pa razlog, metre in čas.
- **Skupine.** Vsaka skupina je določena s progo, cesto (`recId`), vremenom (suho, mokro; zima posebej) in fiziko vožnje (klasična, nova). V vsaki skupini ostane 10 najhitrejših; pri enakem času je prej starejša vožnja.
  - Vožnje s stare ceste (spremenjen `recId`) se ne kažejo in ne delijo. Izbrišejo se ob naslednji vožnji iste proge.
  - Vožnje prog, ki niso več prave, se ne kažejo in ne delijo.
- **Shramba** je IndexedDB `rra-najboljse`, shramba `voznje` (`Napake.shramba`, kot Zadnji posnetki z `rra-posnetki`).
  - Vsak zapis ima posnetek (gzip `.rrp`; Bâlea ~35 KB), progo, cesto, vreme, fiziko, čas, datum in avto.
  - Preverjanje in pakiranje počakata, dokler se dirka vozi (`Napake.pocakaj`).
  - Če je disk poln, se vožnja ne shrani.
- **Glava posnetka** nima podatkov o napravi in dnevniku (`dev`, `devIme`, `dn`, `file` se izbrišejo), ker je datoteka namenjena deljenju.

## Nastavitve → Najboljše vožnje

- Seznam je razdeljen po progah. Znotraj proge je razdeljen po skupinah v vrstnem redu suho, mokro, suho · zima, mokro · zima; klasična fizika je pred novo.
- Vsaka vrstica kaže mesto, čas, avto in datum. Pod progo je gumb »Deli 10 najboljših«.
- **Deli** naredi eno datoteko `najboljse_<proga>_<LLLLMMDD-UUMM>.rrp` z 10 najboljšimi vožnjami vsake skupine proge. Posnetki so v njej drug za drugim (surovi `.rrp`, skupaj gzip).
  - Na telefonu se odpre okno za deljenje, sicer gre datoteka v Prenose (kot »Shrani datoteko« v Zadnjih posnetkih).
- Razdelek deluje pokonci in ležeče od 360 × 640. Prevodi so v `js/lang.js` (`Best runs`, `Share top 10`).

## Datoteka in orodje

- `tools/voznja.mjs` prebere vse posnetke datoteke (`readRrpAll`). Vožnje poimenuje `<datoteka> #k`.
  - Datoteka z enim posnetkom da do bajta enak izid kot prej.
  - Pravila in meritve orodja se niso spremenili. Koordinacija je to dovolila 11. 11. 2026 v #663; obvestilo za biketraveler da koordinacija na tablo (#382).
- Primer: `node tools/voznja.mjs najboljse_balea_….rrp --out test-results/voznja/profil.json`.
- Posnetkov in profilov ne shranjuj v repozitorij, ker je javen.

## Meje

- Tema ne spreminja vožnje tekmecev (`?voznja`, stikalo »tekmeci po moji liniji«, biketraveler) in ne Analize kroga (#511, `tdgp-analiza-…`).
- Fizika vožnje se ne spremeni.

## Testi

- `tests/najboljse.test.js` (brez brskalnika) preveri:
  - pravila in vsako napako tako kot orodje;
  - vreme in skupine;
  - 10 najboljših v skupini;
  - staro cesto;
  - testne proge;
  - datoteko, ki jo izmeri `tools/voznja.mjs` (12 voženj).
- `tests/browser/najboljse.test.mjs` preveri:
  - vožnjo na čas po Bâlei z avtopilotom do cilja, ki se shrani;
  - seznam pri 640 × 360 in 360 × 640;
  - seznam v angleščini;
  - da »Deli« da datoteko, ki jo orodje izmeri (`#1`, `#2`).
- `tests/voznja.test.js` (razdelek 3b) preveri datoteko z več zapisi, en zapis pa tako kot prej.
