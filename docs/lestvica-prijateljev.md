# Lestvica prijateljev (načrt)

Novost, ki jo je uporabnik izbral 5. 11. 2026: časi prijateljev po progah, ki si jih pošljete s povezavo, so v tabeli ob izbiri proge. Deluje brez strežnika in brez računa. Načrt je potrjen 6. 11. 2026 (razdelek »Odločitve uporabnika«): pogled Friends na sliki proge, povezava nosi tudi čase prijateljev, mesto med prijatelji na rezultatih. Tema je v `docs/vrsta.md` (Načrtovano, račun 3, pred novimi progami).

## Na kratko

- Gumb **Send my times** (meni) oziroma **Pošlji svoje čase** (igra) naredi povezavo `…/#lestvica=…` z vzdevkom igralca, njegovimi najboljšimi časi vseh prog in časi njegovih prijateljev; vsak igralec v njej je podpisan s svojim ključem. Ena povezava prinese vso skupino (~1–2 tisoč znakov na igralca, največ 16.000). Pošlje se kot duh ali izziv: na telefonu meni za deljenje, na računalniku kopija.
- Prijatelj povezavo odpre: igra čase vseh v njej preveri in shrani ter ponudi, da pošlje svoje nazaj. Od takrat vsak na vsaki progi vidi tabelo vseh, ki so prišli v povezavah.
- Tabela je na koraku izbire proge v meniju kot pogled **Friends** na sliki proge (4. gumb ob kamerah) z značko mesta v vrstici številk; cela, z upravljanjem prijateljev, je na zaslonu **Lestvica**. Rezultati pokažejo mesto med prijatelji in po novem rekordu ponudijo *Pošlji prijateljem*.
- Nihče, tudi posrednik ne, ne more poslati ali spremeniti časov v tujem imenu (podpis); nemogoče hitri časi se zavržejo.

## Kaj že obstaja (ni podvajanja)

Pregledano 5. 11. 2026 (`docs/igra.md`, `js/menu.js`, odprti pull requesti): lestvice prijateljev ni in je ne dela noben odprt pull request (#250 »Zabava« ima eliminacijo, lov, izzive ob cesti, ne lestvice).

- **Lestvica** (`buildBoardScreen` v `js/game.js`, v meniju *Leaderboard*): tvojih 10 najboljših voženj kronometra in rekordi krožnih prog, samo tvoji časi. Nova tabela jo dopolni z razdelkom Prijatelji.
- **Deljenje duha** (`#duh=`) in **Izziv s povezavo** (`#izziv=`): en čas ene proge z duhom (do 16.000 znakov), za vožnjo proti prijatelju. Lestvica prijateljev nosi vse proge brez duhov in ju ne nadomesti; uporabi njuno pakiranje (`packStr`/`unpackStr`), deljenje (meni za deljenje ali kopija) in odpiranje povezave (vzorec `ghHash`).
- **Dirka s prijateljem** (`js/net.js`): dirka v živo prek strežnika za sobe; lestvica prvenstva velja samo v sobi. Z lestvico prijateljev ni stika.
- **Dosežki**: dosežek, npr. »Prvi med prijatelji«, je mogoč pozneje (ni v tem načrtu).
- **Profil** (izvoz in uvoz) in samodejne kopije (`js/shramba.js`) vzamejo vse ključe `tdgp-` razen duhov, zato nova ključa potujeta s profilom sama.

## Kateri čas

Isti čas, kot ga meni že kaže v vrstici številk (most `record` v `js/game.js`): kronometer *Best time* (`bestTime`), policija *Best escape* in dvoboj *Best duel* (`bestRace`), dirka na vrh *Best race* (`bestRace`), krožna proga *Best lap* (`bestLap`). Povsod je manjši boljši. Ključ časa je ključ rekorda (`recKey`: proga ali `recId`, način, dež pri kronometru, fizika `@cs` ali `@nova`), zato tabela primerja samo enake pogoje; proga, narejena znova (`recId`), starih časov ne meša z novimi. Čas dirke šteje samo pri običajni dolžini (kot rekord). Avto je v tabeli, kjer ga rekord hrani (kronometri: `board`); časov se ne deli po avtih.

## Povezava

`https://<igra>/#lestvica=<B>`: v delu za `#`, kot `#duh=` in `#izziv=`, zato je strežnik strani ne vidi. Povezava nosi **paket** vsakega igralca: najprej pošiljateljevega, nato zadnjega, ki ga je pošiljatelj prejel od vsakega svojega prijatelja, nespremenjenega.

- **Paket** je niz JSON, kot ga je naredil lastnik (igra ga hrani dobesedno, da ga lahko pošlje naprej):
  ```
  { app: 'apex-racing', kind: 'times', v: 1,
    pub: '<javni ključ P-256, 65 B, base64url, 87 znakov>',
    name: 'Lisica',                        // vzdevek: cleanName, do 16 znakov
    sent: 1762354800,                      // kdaj ga je lastnik naredil (s), največ dan v prihodnost
    t: { 'spa@cs': [134310, 309, 'vortex'], 'vrsic-tt@nova': [...] } }
  //    ključ rekorda: [čas v ms, dan nastanka (dni od 1. 1. 2026; 0 = neznan), avto ali nič]
  ```
  Ob njem je **podpis** ECDSA P-256 s SHA-256 (WebCrypto `crypto.subtle`) bajtov UTF-8 tega niza, base64url, 86 znakov.
- **B** = `packStr(JSON)` (deflate-raw, base64url, kot duh) ovojnice `{ app: 'apex-racing', kind: 'times-pack', v: 1, p: ['<paket pošiljatelja>', '<paket prijatelja>', …], s: ['<podpis>', …] }`. Ovojnica ni podpisana: vsak paket se preveri posebej s ključem iz sebe. Stisnjena je cela naenkrat, zato se ključi prog, ki se v paketih ponavljajo, stisnejo skupaj.
- **Velikost**: igralec z 20–60 časi ~0,8–2 tisoč znakov, vsak naslednji v povezavi ~0,6–1,5 tisoč; vse proge v obeh fizikah, z dežjem in načini (~300 časov) ~7 tisoč. Meja je 16.000 znakov, kot pri duhu: pošiljateljev paket gre vedno, prijatelji po vrsti od nazadnje posodobljenega, kolikor jih gre (okno pove »3 prijatelji niso šli v povezavo«). Testa: polni rekordi enega igralca ≤ 8.000 znakov; pošiljatelj in deset prijateljev s po 60 časi gredo v mejo.

### Zaščita pred ponarejenimi časi

Brez strežnika popolne zaščite ni: igra in repozitorij sta javna, kdor hoče, si lahko svoj čas izmisli. Zaščita ustavi vse ostalo:

1. **Podpis in identiteta**: igralec ob prvem pošiljanju dobi par ključev (zasebni ostane v telefonu in v datoteki profila). Id igralca je prvih 12 znakov base64url(SHA-256(`pub`)). Paketa brez veljavnega podpisa igra ne sprejme (drugi paketi iste povezave veljajo): nihče ne more poslati časov v imenu drugega igralca, spremenjena črka ali prirezana povezava ne gre skozi. Brskalnik brez WebCrypto (zelo star ali stran brez HTTPS) povezave ne pošlje in ne sprejme (sporočilo).
2. **Oblika**: kot `chalOf` (aplikacija, vrsta, različica; čas končno pozitivno število; dan in avto znana ali nič; največ 600 časov v paketu in 11 paketov v povezavi; vzdevek očiščen).
3. **Nemogoči časi**: čas, hitrejši od najhitrejšega mogočega na progi, se zavrže (sporočilo »1 nemogoč čas izpuščen«). Meja iz oblike proge: na vsakem delu hitrost največ √(4 g · polmer ovinka) in največ 1,15 × največja končna hitrost vozil igre; meja = pot / hitrost po dolžini kroga (krog), dirke (dirka, policija, dvoboj) ali preizkušnje (kronometer); pri progah z medaljami vsaj 0,7 × zlati čas. Čas proge, ki je igra še nima, se shrani in preveri, ko proga pride.
4. **Odstrani prijatelja**: en dotik (Lestvica → Prijatelji → Odstrani); njegove nadaljnje povezave igra doda samo, če igralec to potrdi (seznam skritih, do 100). To je tudi blokiranje, ki ga Google Play zahteva pri vsebini uporabnikov. Skritega igralca igra ne uvozi niti iz tuje povezave in ga ne pošilja naprej.
5. **Posredovani paketi**: paket, ki ga prinese tuja povezava, velja enako kot neposreden, ker ga je podpisal lastnik. Posrednik ga ne more spremeniti, lahko ga samo izpusti ali pošlje starejšega; to ne škodi, ker ostane najboljši čas, ki je kdaj prišel.

Ponarejenega lastnega časa (spremenjena igra) brez strežnika ni mogoče preprečiti; točka 3 ustavi očitne.

## Kje v meniju (pokonci in ležeče)

Izbrana je možnost 1 vprašanja `lp-meni` (slike treh možnosti so na strani Odločitve 3: Spa, Belgija, 360 × 640 in 640 × 360):

- **Pogled Friends na sliki proge**: 4. gumb med kamerami (zemljevid, prelet, ovinek) pokaže tabelo namesto slike: mesto, vzdevek, avto, čas, zaostanek; spodaj *Send my times*. Pogled ostane izbran pri listanju prog, da se primerja proga za progo. Ob času v vrstici številk (*Best lap*, *Best time* …) je značka mesta (»2/5«), dotik nanjo odpre pogled. Pokonci je prostora za 5 vrstic, ležeče za 6 (več z drsenjem). Brez časov prijateljev: »No friends' times on Spa yet« in *Send my times*. Postavitev zaslona ostane.
- Meni bere podatke prek mostu (`G.friends(d)`, `G.sendTimes()`), napisi so angleški (meni je samo angleški), upravljanje prijateljev je na zaslonu Lestvica.
- Nista izbrani: vrstica s prijatelji pod številkami (2) in samo značka s tabelo v oknu (3).

## Drugje v igri

- **Odpiranje povezave** (`#lestvica=`, kot `ghHash`): igra preveri in shrani čase ter pokaže okno »Lisica in 2 prijatelja: 31 časov (5 boljših). Pošlješ svoje nazaj?« (*Pošlji svoje* / *Pozneje*), nato korak izbire proge na progi z zadnjim novim časom. Lastni paket v tuji povezavi se preskoči; povezava samo z lastnim paketom: »To je tvoja povezava.« Brez novih časov: »Nič novega od Lisice.«
- **Lestvica**: razdelek Prijatelji pri vsaki progi (cela tabela z datumom) ter gumba *Pošlji svoje čase* in *Prijatelji* (seznam: vzdevek, število časov, zadnji paket, prek koga je prišel, *Odstrani*).
- **Rezultati** (`lp-obseg` 1): vrstica »Med prijatelji: 2. od 5 (Lisica 0,77 s pred tabo)«; ob novem osebnem rekordu gumb *Pošlji prijateljem*.
- **Vzdevek** je ime voznika (`S.name`, Nastavitve). Če je še privzeto (»Igralec«), igra pred prvim pošiljanjem vpraša zanj (»vzdevek, ne pravo ime«).

## Združevanje in posodabljanje

- Igralec je id iz javnega ključa, ne ime: preimenovanje ga ne podvoji; enak vzdevek z drugim ključem je drug igralec (v tabeli »Lisica (2)«, starega odstraniš v seznamu).
- Vsak čas je najboljši, kar jih je od tega igralca kdaj prišlo, neposredno ali posredovano (najmanjši po ključu, z dnem in avtom). Vrstni red odpiranja ni pomemben: ista povezava dvakrat ne spremeni ničesar, starejša ne pokvari novejše. Vzdevek je iz paketa z najnovejšim `sent`; za pošiljanje naprej igra hrani prav ta paket dobesedno.
- Kdor ponastavi igro ali zamenja telefon brez uvoza profila, dobi nov ključ (nova vrstica); z uvozom profila ostane isti.
- Tvoji časi se v tabeli berejo sproti iz rekordov (brez kopije), tvoj paket nastane ob pošiljanju. Do prijatelja pride posodobitev samo z novo povezavo (tvojo ali od nekoga, ki posreduje tvoj novejši paket); zato rezultati po novem rekordu ponudijo *Pošlji prijateljem*.
- Meje: do 40 prijateljev (41. izrine tistega z najstarejšim zadnjim paketom, s sporočilom), do 600 časov v paketu, do 11 paketov v povezavi.

## Shranjevanje

- `tdgp-lp-me`: tvoj par ključev (JWK); nastane ob prvem pošiljanju.
- `tdgp-lp`: `{ v: 1, friends: { <id>: { name, pub, sent, got, via, t: { <ključ>: [ms, dan, avto] }, raw: [<paket>, <podpis>] } }, hidden: [<id>] }` (`via`: id igralca, čigar povezava ga je prvič prinesla, ali nič; `raw`: zadnji paket za pošiljanje naprej); običajno pod 60 KB, največ ~1 MB.
- Shranjuje se s `Shramba.keep` (v polni shrambi se umaknejo duhovi, lestvica ne). Ključa sta `tdgp-`, zato gresta sama v izvoz profila (`profKeys`) in v samodejne kopije (`js/shramba.js`); uvoz profila na drug telefon prenese tudi identiteto.

## Prevodi

Meni je samo angleški (napisi v `js/menu.js`). Besedila igre (Lestvica, rezultati, okna, sporočila) gredo prek `tr()` s slovenskim izvirnikom in angleščino v `js/lang.js` (preveri `tests/lang.test.js`). Opis v `docs/igra.md` (nov razdelek »Lestvica prijateljev« za »Izziv s povezavo«), vrstica v `README.md` (Nov meni), datoteka v `docs/kazalo.md`.

## Pravna varnost

Imena na lestvici so vzdevki, ki jih vnese igralec. Igra ne zbira pravih imen, e-pošte, telefonskih številk ali stikov, ne bere imenika in ničesar ne pošilja na strežnik. Okno za vzdevek svetuje vzdevek namesto pravega imena, okno za pošiljanje pa pove, da povezava nese tudi vzdevke in čase tvojih prijateljev. V kodi, testih, slikah in dokumentih so samo izmišljeni vzdevki (Lisica, Turbo Tina, Kapitan K …). Igralca lahko odstraniš in skriješ, tudi posredovanega. Novih virov z licenco ni.

## Testi

- **Node** `tests/lestvica.test.js` (logika v `js/lestvica.js` brez DOM; Node 22 ima WebCrypto in CompressionStream): povezava tja in nazaj; podpis (spremenjen znak, prirezana povezava, tuj podpis, napačna vrsta ali različica: zavrnjeno); posredovanje (A → B → C: C ima A-jeve čase s podpisom A; spremenjen posredovan paket je zavrnjen, drugi paketi iste povezave sprejeti; skriti igralec ni uvožen in ne gre naprej; lastni paket v tuji povezavi preskočen); meje (vsaka prava proga: zmagovalec AI iz `tests/golden/races.json` je počasnejši od 1,2 × meje, meja je vsaj 0,35 × njegovega časa); združevanje (najmanjši po ključu, ista povezava dvakrat, obraten vrstni red, vzdevek z najnovejšim `sent`, skriti igralec, 40 prijateljev, 600 časov, 11 paketov); velikost (en igralec s polnimi rekordi ≤ 8.000 znakov; pošiljatelj in deset prijateljev s po 60 časi ≤ 16.000; ob preveč prijateljih gredo nazadnje posodobljeni); čiščenje vzdevka in izpis brez HTML.
- **Brskalnik** `tests/browser/lestvica.test.mjs`: tri igre (trije konteksti): A pošlje B, B pošlje C, C vidi A in B; tabela na koraku izbire proge pokonci 360 × 640 in ležeče 640 × 360 (vrstice vidne, nič čez rob, značka mesta); Lestvica s prijatelji in *Odstrani*; vrstica med prijatelji na rezultatih; izvoz in uvoz profila ohrani identiteto. Po spremembi menija `menu.test.mjs`, prevodi `lang.test.js`.
- Lokalno `npm run test:related` (zaradi `js/game.js` in `js/menu.js` izbere tudi `share`, `chal`, `menu`). Obremenitve telefona sprememba ne poveča (samo meni in zasloni).

## Koraki in ocena ur

| # | Korak | Ure |
|---|---|---|
| 0 | Osnutek pull requesta, vrstica iz Načrtovano v `docs/vrsta.md` | 0,3 |
| 1 | `js/lestvica.js`: paket, ovojnica, pakiranje, ključi in podpis, posredovanje, združevanje, shranjevanje, meje števila | 5 |
| 2 | Meja najhitrejšega časa iz oblike proge in medalj | 1,5 |
| 3 | Node testi | 2,5 |
| 4 | `js/game.js`: povezava `#lestvica=`, okno ob odpiranju, pošiljanje, vzdevek, Lestvica s prijatelji | 2,5 |
| 5 | Meni: pogled Friends in značka mesta (pokonci, ležeče, prazno stanje), `css/menu.css` | 2,5 |
| 6 | Rezultati: mesto med prijatelji, *Pošlji prijateljem* | 1 |
| 7 | Prevodi, `docs/igra.md`, `README.md`, kazalo | 1 |
| 8 | Brskalniški test, `menu.test.mjs`, povezani testi, popravki | 2,5 |
| 9 | Vrsta in združitev (Sonnet) | 0,5 |

Skupaj ~19 h. Dve seji (Opus, napor max): koraki 0–4 in 5–9; veja `lestvica-prijateljev`, en pull request. Logika gre v novo datoteko `js/lestvica.js`; v `js/menu.js`, `js/game.js`, `css/menu.css` in `index.html` samo kratki priklopi, ker jih spreminja več odprtih pull requestov (#325, #296, #284, #283, #250, #246, #226).

## Odločitve uporabnika (stran Odločitve 3)

Odgovori 6. 11. 2026 ob 1.05 (v pogovoru s koordinacijo VSE SEJE 2, zapisani na strani Odločitve 3):

- `lp-meni`: **1**, pogled Friends na sliki proge in značka mesta v vrstici številk.
- `lp-povezava`: **2**, povezava nosi tvoje čase in čase prijateljev, ki jih imaš, vsakega s podpisom njegovega lastnika (+2 h).
- `lp-obseg`: **1**, mesto med prijatelji na rezultatih in *Pošlji prijateljem* po novem rekordu.

## Stanje

- 5. 11. 2026: načrt in vprašanja (seja »Lestvica prijateljev: načrt«, `session_01WbgGztpv919FLrFJ1tPuh5`).
- 6. 11. 2026: odločitve vpisane, načrt potrjen. Naslednje: seja za korake 0–4, ko jo zažene koordinacija; tema gre pred novimi progami (`docs/vrsta.md`).
