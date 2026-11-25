# Police chase, stran Police

Tema iz `docs/vrsta.md` (»Police chase, stran Police«), seja s kodo računa croatiadata, 25. 11. 2026. Opis v meniju: `docs/meni-izbira-proge.md`, točki »Police chase: izbira strani« in »Police chase, stran Police«.

## Stanje ob začetku (25. 11.)

- Stran *Police* v meniju ni več *Soon*: po #755 (na `main` 24. 11.) *Race!* s stranjo *Police* odpre način `lov` (»Ti loviš«, `js/zabava/lov.js`, `docs/zabava.md`, c).
- `lov`: igralčev avto je patrulja (`P.police`: luči, sirena, promet se umakne), begunec je tekmec 150 m spredaj (vozi ga obstoječa koda tekmecev, `aiControl`), ujet po skupaj 5 s manj kot 15 m za njim (dotik hitreje), pobegne po 10 s več kot 400 m spredaj, na koncu ceste ali po 3:00. Rekordi `id-lov`.
- Razlike od bega pred policijo (`police`, `Police` v `js/core.js`): promet v begu je redkejši (`Traffic` z gostoto 0,85, v `lov` 1), pravila bega so po težavnosti (`POL_DIFF`: ujet, ko skoraj stoji in je patrulja manj kot 9 m stran, 3 / 2,5 / 2 / 1,6 s), na zaslonu je policijska plošča; v `lov` samo vrstica `h-gap`.

## Načrt

1. **Promet kot v Police chase**: `lov` dobi gostoto prometa bega (0,85) prek nove možnosti dirke; brez nje vse ostane, kot je.
2. **Pravila po težavnosti** (Easy–Super hard): bližina, čas za ujetje, prednost begunca in čas po težavnosti, zrcalno `POL_DIFF`. Begunca še naprej vozi obstoječa koda tekmecev; če bi bila potrebna njena sprememba, se tema ustavi in to zapiše v opis PR.
3. **Odločitve za igralca** na strani Odločitve računa croatiadata (`docs/vprasanja.md`), vsaka z 2–3 možnostmi in sliko (kamera za avtom, prava proga z odprto cesto): pravila ujetja, prikaz na zaslonu, videz policijskega avta. Do odgovora velja priporočena možnost.
4. **Testi**: `tests/zabava.test.js` (pravila po težavnosti, gostota prometa), meni `tests/browser/menu.test.mjs` (stran *Police*).

Fizika vožnje in vožnja obstoječih tekmecev se ne spremenita (golden testi dirk in sim ostanejo enaki); testne proge in proge na odločanju ostanejo nespremenjene.

## Narejeno (25. 11., PR #1082)

- **Promet**: nova možnost dirke `tfDens` (`js/core.js`, `Traffic`); `lov` jo nastavi na 0,85 kot beg. Brez nje vse ostane, kot je (golden testi dirk in sim enaki).
- **Pravila po težavnosti** (`KD`, `kOf` v `js/zabava/lov.js`; Normal = dosedanja `K`, 3:00 in 400 m na vseh stopnjah, kot v meniju *Catch them in 3:00*):

| Stopnja | Prednost begunca | Bližina | Čas za ujetje | Predaleč (čas) |
|---|---|---|---|---|
| Easy | 120 m | 18 m | 4 s | 13 s |
| Normal | 150 m | 15 m | 5 s | 10 s |
| Hard | 170 m | 13 m | 6 s | 8 s |
| Super hard | 190 m | 12 m | 7,5 s | 7 s |

  Razmerja iz `POL_DIFF` obrnjeno (ujet 3 / 2,5 / 2 / 1,6 s, skrit 14 / 18 / 22 / 26 s). Begunca vozi obstoječa koda tekmecev (`aiControl`), njegova spretnost že sledi težavnosti (`DIFF`); te kode ni bilo treba spreminjati. Spletni Pregon s prijatelji (`js/zabava/beg.js`) ostane pri `K`.
- **Bela patrulja**: igralčev avto v `lov` dobi belo barvo patrulj iz bega (`0xf2f4f6`, `Police._car`), trak POLICIJA in luči kot doslej (`polGear`).
- **Merilnik pod vrstico** (`#h-lovm`, `css/zabava.css`): zelen = aretacija, rdeč = čas, ki ga ima begunec še do pobega.
- **Testi**: `tests/zabava.test.js`, 8 (stopnje, prednost, ujetje, pobeg, promet, barva, `beg.js`).

## Odločitve (stran Odločitve croatiadata, do odgovora velja priporočena)

1. **Pravila ujetja**: 1 po težavnosti (zgoraj; priporočeno), 2 enaka na vseh stopnjah (kot pred to temo), 3 zrcalo bega (skoraj stoji, manj kot 9 m, 3 / 2,5 / 2 / 1,6 s).
2. **Prikaz na zaslonu**: 1 samo vrstica pod uro (kot pred to temo), 2 vrstica in merilnik (priporočeno).
3. **Videz policijskega avta**: 1 igralčeva barva s trakom in lučmi (kot pred to temo), 2 bel kot patrulje v begu (priporočeno).
