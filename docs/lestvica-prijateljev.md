# Lestvica prijateljev (načrt)

Novost, ki jo je uporabnik izbral 5. 11. 2026: časi prijateljev po progah, ki si jih pošljete s povezavo, so v tabeli ob izbiri proge. Deluje brez strežnika in brez računa. Uporabnik je 6. 11. 2026 odgovoril na vprašanja `lp-meni`, `lp-povezava` in `lp-obseg` (razdelek »Odločitve uporabnika«); koda je v delu (veja `lestvica-prijateljev/koda`).

## Na kratko

- Gumb **Send my times** (meni) oziroma **Pošlji svoje čase** (igra) naredi povezavo `…/#lestvica=…` z vzdevkom igralca in njegovimi najboljšimi časi vseh prog (običajno 1–2 tisoč znakov). Pošlje se kot duh ali izziv: na telefonu meni za deljenje, na računalniku kopija.
- Prijatelj povezavo odpre: igra čase preveri in shrani ter ponudi, da pošlje svoje nazaj. Od takrat vsak na vsaki progi vidi tabelo vseh, ki so si izmenjali povezave.
- Tabela je na koraku izbire proge v meniju (postavitev: vprašanje `lp-meni`); cela, z upravljanjem prijateljev, je na zaslonu **Lestvica**.
- Povezava je podpisana s ključem igralca (nihče ne pošlje časov v tujem imenu in ne spremeni prejete povezave); nemogoče hitri časi se zavržejo.

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

`https://<igra>/#lestvica=<P>.<S>`: v delu za `#`, kot `#duh=` in `#izziv=`, zato je strežnik strani ne vidi.

- **P** = `packStr(JSON)` (deflate-raw, base64url, kot duh):
  ```
  { app: 'apex-racing', kind: 'times', v: 1,
    pub: '<javni ključ P-256, 65 B, base64url, 87 znakov>',
    name: 'Lisica',                        // vzdevek: cleanName, do 16 znakov
    sent: 1762354800,                      // čas pošiljanja (s), največ dan v prihodnost
    t: { 'spa@cs': [134310, 309, 'vortex'], 'vrsic-tt@nova': [...] } }
  //    ključ rekorda: [čas v ms, dan nastanka (dni od 1. 1. 2026; 0 = neznan), avto ali nič]
  ```
- **S** = podpis ECDSA P-256 s SHA-256 (WebCrypto `crypto.subtle`) niza P, base64url, 86 znakov.
- **Velikost**: igralec z 20–60 časi ~0,8–2 tisoč znakov; vse proge v obeh fizikah, z dežjem in načini (~300 časov) ~7 tisoč, pod mejo 16.000, ki jo že uporablja duh. Test: polni rekordi ≤ 8.000 znakov.

### Zaščita pred ponarejenimi časi

Brez strežnika popolne zaščite ni: igra in repozitorij sta javna, kdor hoče, si lahko svoj čas izmisli. Zaščita ustavi vse ostalo:

1. **Podpis in identiteta**: igralec ob prvem pošiljanju dobi par ključev (zasebni ostane v telefonu in v datoteki profila). Id prijatelja je prvih 12 znakov base64url(SHA-256(`pub`)). Povezave brez veljavnega podpisa igra ne sprejme: nihče ne more poslati časov v imenu drugega prijatelja, spremenjena črka ali prirezana povezava ne gre skozi. Brskalnik brez WebCrypto (zelo star ali stran brez HTTPS) povezave ne pošlje in ne sprejme (sporočilo).
2. **Oblika**: kot `chalOf` (aplikacija, vrsta, različica; čas končno pozitivno število; dan in avto znana ali nič; največ 600 časov; vzdevek očiščen).
3. **Nemogoči časi**: čas, hitrejši od najhitrejšega mogočega na progi, se zavrže (sporočilo »1 nemogoč čas izpuščen«). Meja iz oblike proge: na vsakem delu hitrost največ √(4 g · polmer ovinka) in največ 1,15 × največja končna hitrost vozil igre; meja = pot / hitrost po dolžini kroga (krog), dirke (dirka, policija, dvoboj) ali preizkušnje (kronometer); pri progah z medaljami vsaj 0,7 × zlati čas. Čas proge, ki je igra še nima, se shrani in preveri, ko proga pride.
4. **Odstrani prijatelja**: en dotik (Lestvica → Prijatelji → Odstrani); njegove nadaljnje povezave igra doda samo, če igralec to potrdi (seznam skritih, do 100). To je tudi blokiranje, ki ga Google Play zahteva pri vsebini uporabnikov.

Ponarejenega lastnega časa (spremenjena igra) brez strežnika ni mogoče preprečiti; točka 3 ustavi očitne.

## Kje v meniju (pokonci in ležeče)

Vprašanje `lp-meni` ima sliko vsake možnosti (Spa, Belgija; 360 × 640 in 640 × 360):

1. **Pogled Friends na sliki proge** (priporočeno): 4. gumb med kamerami (zemljevid, prelet, ovinek) pokaže tabelo namesto slike: mesto, vzdevek, avto, čas, zaostanek; spodaj *Send my times*. Pogled ostane izbran pri listanju prog, da se primerja proga za progo. Ob *Best lap* v vrstici številk je značka mesta (»2/5«), dotik odpre pogled. Pokonci je prostora za 5 vrstic, ležeče za 6 (več z drsenjem). Brez časov prijateljev: »No friends' times on Spa yet« in *Send my times*. Postavitev zaslona ostane.
2. **Vrstica pod številkami**: tvoje mesto in vodilni (»2nd/5 · 1. Lisica 2:14.31 · to beat +0.77 s«), dotik odpre celo tabelo v oknu. Vedno vidna; prostor za avto je pokonci ~40 px manjši.
3. **Samo gumb**: značka mesta v vrstici številk, tabela v oknu. Zaslon ostane, kot je; tabela je za dotikom.

Pri vseh: meni bere podatke prek mostu (`G.friends(d)`, `G.sendTimes()`), napisi so angleški (meni je samo angleški), upravljanje prijateljev je na zaslonu Lestvica.

## Drugje v igri

- **Odpiranje povezave** (`#lestvica=`, kot `ghHash`): igra preveri in shrani čase ter pokaže okno »Lisica: 14 časov (3 boljši). Pošlješ svoje nazaj?« (*Pošlji svoje* / *Pozneje*), nato korak izbire proge na progi z zadnjim novim časom. Lastna povezava: »To je tvoja povezava.« Ista ali starejša povezava: »Nič novega od Lisice.«
- **Lestvica**: razdelek Prijatelji pri vsaki progi (cela tabela z datumom) ter gumba *Pošlji svoje čase* in *Prijatelji* (seznam: vzdevek, število časov, zadnja povezava, *Odstrani*).
- **Rezultati** (po `lp-obseg`): vrstica »Med prijatelji: 2. od 5 (Lisica 0,77 s pred tabo)«; ob novem osebnem rekordu gumb *Pošlji prijateljem*.
- **Vzdevek** je ime voznika (`S.name`, Nastavitve). Če je še privzeto (»Igralec«), igra pred prvim pošiljanjem vpraša zanj (»vzdevek, ne pravo ime«).

## Združevanje in posodabljanje

- Prijatelj je id iz javnega ključa, ne ime: preimenovanje ga ne podvoji; enak vzdevek z drugim ključem je drug igralec (v tabeli »Lisica (2)«, starega odstraniš v seznamu).
- Vsak čas je najboljši, kar jih je prijatelj kdaj poslal (najmanjši po ključu, z dnem in avtom). Vrstni red odpiranja ni pomemben: ista povezava dvakrat ne spremeni ničesar, starejša ne pokvari novejše. Vzdevek je iz povezave z najnovejšim `sent`.
- Kdor ponastavi igro ali zamenja telefon brez uvoza profila, dobi nov ključ (nova vrstica); z uvozom profila ostane isti.
- Tvoji časi se v tabeli berejo sproti iz rekordov (brez kopije). Do prijatelja pride posodobitev samo z novo povezavo (brez strežnika ni samodejnega pošiljanja); zato rezultati po novem rekordu ponudijo *Pošlji prijateljem*.
- Meje: do 40 prijateljev (41. izrine tistega z najstarejšo zadnjo povezavo, s sporočilom), do 600 časov na prijatelja.

## Shranjevanje

- `tdgp-lp-me`: tvoj par ključev (JWK); nastane ob prvem pošiljanju.
- `tdgp-lp`: `{ v: 1, friends: { <id>: { name, pub, sent, got, t: { <ključ>: [ms, dan, avto] } } }, hidden: [<id>] }`; običajno pod 30 KB, največ ~0,5 MB.
- Shranjuje se s `Shramba.keep` (v polni shrambi se umaknejo duhovi, lestvica ne). Ključa sta `tdgp-`, zato gresta sama v izvoz profila (`profKeys`) in v samodejne kopije (`js/shramba.js`); uvoz profila na drug telefon prenese tudi identiteto.

## Prevodi

Meni je samo angleški (napisi v `js/menu.js`). Besedila igre (Lestvica, rezultati, okna, sporočila) gredo prek `tr()` s slovenskim izvirnikom in angleščino v `js/lang.js` (preveri `tests/lang.test.js`). Opis v `docs/igra.md` (nov razdelek »Lestvica prijateljev« za »Izziv s povezavo«), vrstica v `README.md` (Nov meni), datoteka v `docs/kazalo.md`.

## Pravna varnost

Imena na lestvici so vzdevki, ki jih vnese igralec. Igra ne zbira pravih imen, e-pošte, telefonskih številk ali stikov, ne bere imenika in ničesar ne pošilja na strežnik. Okno za vzdevek svetuje vzdevek namesto pravega imena. V kodi, testih, slikah in dokumentih so samo izmišljeni vzdevki (Lisica, Turbo Tina, Kapitan K …). Prijatelja lahko odstraniš in skriješ. Novih virov z licenco ni.

## Testi

- **Node** `tests/lestvica.test.js` (logika v `js/lestvica.js` brez DOM; Node 22 ima WebCrypto in CompressionStream): povezava tja in nazaj; podpis (spremenjen znak, prirezana povezava, tuj podpis, napačna vrsta ali različica: zavrnjeno); meje (vsaka prava proga: zmagovalec AI iz `tests/golden/races.json` je počasnejši od 1,2 × meje, meja je vsaj 0,35 × njegovega časa); združevanje (najmanjši po ključu, ista povezava dvakrat, obraten vrstni red, vzdevek z najnovejšim `sent`, lastna povezava, skriti prijatelj, 40 prijateljev, 600 časov); velikost pri polnih rekordih ≤ 8.000 znakov; čiščenje vzdevka in izpis brez HTML.
- **Brskalnik** `tests/browser/lestvica.test.mjs`: dve igri (dva konteksta) si izmenjata povezavi; tabela na koraku izbire proge pokonci 360 × 640 in ležeče 640 × 360 (vrstice vidne, nič čez rob, značka mesta); Lestvica s prijatelji in *Odstrani*; vrstica med prijatelji na rezultatih; izvoz in uvoz profila ohrani identiteto. Po spremembi menija `menu.test.mjs`, prevodi `lang.test.js`.
- Lokalno `npm run test:related` (zaradi `js/game.js` in `js/menu.js` izbere tudi `share`, `chal`, `menu`). Obremenitve telefona sprememba ne poveča (samo meni in zasloni).

## Koraki in ocena ur

| # | Korak | Ure |
|---|---|---|
| 0 | Odločitve v ta načrt, osnutek pull requesta, vrstica iz Načrtovano v `docs/vrsta.md` | 0,3 |
| 1 | `js/lestvica.js`: oblika, pakiranje, ključi in podpis, združevanje, shranjevanje, meje števila | 3 |
| 2 | Meja najhitrejšega časa iz oblike proge in medalj | 1,5 |
| 3 | Node testi | 2 |
| 4 | `js/game.js`: povezava `#lestvica=`, okno ob odpiranju, pošiljanje, vzdevek, Lestvica s prijatelji | 2,5 |
| 5 | Meni po `lp-meni` (pokonci, ležeče, prazno stanje), `css/menu.css` | 2,5 |
| 6 | Rezultati po `lp-obseg` | 1 |
| 7 | Prevodi, `docs/igra.md`, `README.md`, kazalo | 1 |
| 8 | Brskalniški test, `menu.test.mjs`, povezani testi, popravki | 2,5 |
| 9 | Vrsta in združitev (Sonnet) | 0,5 |

Skupaj ~17 h pri priporočenih izbirah; `lp-povezava` 2: +2 h; `lp-obseg` 2: +3 h, 3: −1 h. Dve seji (Opus, napor max): koraki 0–4 in 5–9; veja `lestvica-prijateljev`, en pull request. Logika gre v novo datoteko `js/lestvica.js`; v `js/menu.js`, `js/game.js`, `css/menu.css` in `index.html` samo kratki priklopi, ker jih spreminja več odprtih pull requestov (#325, #296, #284, #283, #250, #246, #226).

## Odločitve uporabnika (stran Odločitve 3)

Odgovori uporabnika 6. 11. 2026 (stran Odločitve, račun partyslo):

- `lp-meni` = **1**: pogled **Friends** na sliki proge. 4. gumb ob kamerah (zemljevid, prelet, ovinek) pokaže tabelo namesto slike (mesto, vzdevek, avto, čas, zaostanek; spodaj *Send my times*); pogled ostane izbran pri listanju prog; ob *Best lap* (oz. *Best time* …) v vrstici številk značka mesta »2/5«, dotik odpre pogled.
- `lp-povezava` = **2**: povezava nosi tvoje čase **in čase prijateljev**, vsak podpisan od svojega lastnika (ena povezava prinese vso skupino).
- `lp-obseg` = **1**: na rezultatih tvoje mesto med prijatelji (»2. od 5, Lisica 0,77 s pred tabo«), po novem osebnem rekordu gumb *Pošlji prijateljem*.

Izvedba po odločitvah (seja kode, 6. 11. 2026):

- **Povezava (`lp-povezava` 2)**: `#lestvica=<Z>`, Z = `packStr` od `{ app, kind: 'friends', v: 1, p: [[paket, podpis], …] }`. Paket je niz JSON enega igralca (`{ app, kind: 'times', v, pub, name, sent, t }`, kot zgoraj), podpisan z njegovim ključem (podpis niza, ne stisnjene oblike, da ga je mogoče posredovati nespremenjenega). Prvi paket je pošiljateljev (svež), za njim najnovejši paket vsakega prijatelja, ki ga ima (najnovejša zadnja povezava prej), toliko, kolikor jih gre v 16.000 znakov. Paket s pokvarjenim podpisom se izpusti; brez veljavnega prvega paketa povezava ni veljavna. Skriti prijatelji in tvoj lastni paket se v prejeti povezavi izpustijo.
- **Meja nemogočih časov**: hitrost na vsakem delu idealne linije največ √(3 g · polmer) in največ 1,15 × največja hitrost vozil igre (prestave, vrtljaji), brez zaviranja in pospeševanja; najhitrejši AI (formula, prototip) v `tests/golden/races.json` je na vseh pravih progah 1,49–2,68 × počasnejši od meje. Spodnja meja 0,7 × zlati čas odpade: AI v formuli je na Big Suru in Uncompahgreju že 0,85 × zlati čas, človek z izboljšavami bi jo lahko prehitel. Meja se izračuna, ko je proga zgrajena (meni, rezultati, Lestvica): ob odpiranju povezave se preverijo proge, ki so že zgrajene, drugi časi pa se ne pokažejo, dokler jih meja ne potrdi.

## Stanje

- 5. 11. 2026: načrt in vprašanja (seja »Lestvica prijateljev: načrt«, `session_01WbgGztpv919FLrFJ1tPuh5`); koda po odgovorih.
- 6. 11. 2026: odgovori uporabnika (`lp-meni` 1, `lp-povezava` 2, `lp-obseg` 1); koda v delu (seja `session_01WbgGzvYDMqQqpGN1uARfq5`, PR #392, veja `lestvica-prijateljev/koda`).
- 6. 11. 2026: koda končana (PR #392): `js/lestvica.js`, priklopi v `js/game.js` (povezava ob zagonu in ob `hashchange` v že odprti igri, med dirko počaka do menija; vzdevek na zaslonu `#s-lp`; Lestvica: Prijatelji, Odstrani; rezultati: vrstica mesta, Pošlji prijateljem), pogled *Friends* v meniju (4. kamera, značka mesta ob *Best lap*), prevodi; opis v `docs/igra.md` (»Lestvica prijateljev«). Ob delu popravljeno: na Lestvici je trak zavihkov vseh prog pokonci (360 × 640) izrinil tabele in gumb Nazaj z zaslona (tudi na `main`), zdaj zavzame največ 30 % višine in se drsi (`css/style.css` `.board-tabs`). Testi: `tests/lestvica.test.js` (50), `tests/browser/lestvica.test.mjs` (20, ~4 min).
