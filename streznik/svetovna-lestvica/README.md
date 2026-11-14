# Svetovna lestvica: strežnik

Cloudflare Worker z bazo D1 in vedrom R2 (oba v EU), brez odvisnosti. Načrt, zasebnost in odločitve: `docs/svetovna-lestvica.md`. Test brez omrežja in ključa: `node tests/svet-streznik.test.js` (lažni D1 na `node:sqlite`, R2 kot `Map`, GitHub z žetonom testnega ključa).

| Datoteka | Kaj |
|---|---|
| `src/index.js` | usmerjevalnik (`fetch`) in dnevno pospravljanje (`scheduled`) |
| `src/ovoj.js` | branje in podpis zahtevka (»Ovoj«), vzorci, skupni z igro (`js/lestvica.js`) |
| `src/pregled.js` | hitri pregled oddaje in duha, veljavne meje |
| `src/zahtevki.js` | pisanje: vzdevek, oddaja, prijava, moje, izbris |
| `src/branje.js` | branje: lestvica, mesto, duh, stanje |
| `src/preveri.js`, `src/oidc.js` | opravilo preverjanja na GitHubu (žeton OIDC) |
| `src/vzdevki.js`, `src/besede.js` | filter vzdevkov, seznam besed (zakodiran z rot13) |
| `src/skupno.js` | ura, meje, omejitve, brisanje, predpomnilnik |
| `src/pospravi.js` | dnevno pospravljanje |
| `schema.sql` | tabele D1: `igralci`, `casi`, `prijave`, `omejitve`, `brisanje` |
| `wrangler.toml` | imena, vezave in urnik; brez ključev in skrivnosti |

## Vmesnik

Vsi odgovori so JSON z `ok`; napaka je `{ok:false, napaka:<koda>, …}` s stanjem HTTP. Brez piškotkov in brez prijave: igralca določa njegov javni ključ ECDSA P-256, id je prvih 12 znakov zgoščenega ključa.

| Pot | Metoda | Kaj |
|---|---|---|
| `/v1/lestvica?kljuc&od&n` | GET | vrstice `od`…`od+n` prvih 100 (`n` privzeto do konca): mesto, id, vzdevek (`null`, če je skrit), oznaka »Voznik #ABCD«, čas, vmesni časi, avto, nadgradnje, pomoč, `priblizno`, `duh`; `skupaj`. Predpomnjeno 60 s |
| `/v1/mesto?kljuc&id` | GET | mesto in čas igralca na lestvici (`null` brez preverjenega časa) |
| `/v1/duh?kljuc&id` | GET | duh igralca, če je med prvimi 100. Predpomnjeno 300 s |
| `/v1/stanje` | GET | ali so meje naložene, žig jedra, število lestvic, ali je sol nastavljena |
| `/v1/vzdevek` | POST, ovoj | nov igralec ali nov vzdevek → `{id, ime, nov, skrit}` |
| `/v1/oddaja` | POST, ovoj | čas s posnetkom vnosa (gzip) in duhom → `{st, stanje:'caka'}` |
| `/v1/prijava` | POST, ovoj | prijava vzdevka `{id}` → `{nova, skrit}` |
| `/v1/moje` | POST, ovoj | igralec in njegovi časi s stanjem (`caka`, `ok`, `sumljivo`, `zavrnjeno`) |
| `/v1/izbris` | POST, ovoj | igralec in vse njegovo izbrisano → `{izbrisano, casov}` |
| `/v1/preveri` | GET, POST, žeton | seznam časov, ki čakajo, posnetek ali duh (`?st&del=vnos\|duh`); izidi preverjanja |
| `/v1/meje` | POST, žeton | meje lestvic (`tools/lestvica-meje.mjs`) |

Kode: `ovoj`, `ura`, `podpis`, `hash`, `duh`, `prevelik` (413), `ni-igralca` (404), `kljuc` (409), `prepoved` (403), `ni-mej` in `shramba` (503), `ze-oddano` in `ni-boljsi` (409), kode hitrega pregleda (400), `vzdevek` z `razlog`, `prijava`, `poizvedba`, `omejitev` (429), `oidc` (401), `ni-nastavitve` in `oidc-kljuci` (503), `ni` (404), `metoda` (405 z `Allow`), `napaka` (500; v dnevnik gre samo ime in sporočilo napake). CORS samo za strani iz `IZVORI` in lokalni strežnik (`http://localhost`, `http://127.0.0.1`); CORS ni varnostna meja, varuje podpis.

## Ovoj

Telo zahtevka: `paket JSON` `\n` `podpis` `\n` `ostanek`. Paket ima `app:'apex-racing'`, `kind:'world'`, `v:1`, `req` (ime poti), `pub` (surovi javni ključ, base64url, 87 znakov) in `sent` (sekunde; največ ±1 dan od ure strežnika). Podpis ECDSA P-256 s SHA-256 (P1363, base64url) velja za bajte paketa. Ostanek ima samo oddaja: posnetek vnosa (`lv` bajtov, gzip) in duh (`ld` bajtov, JSON), oba preverjena z zgoščenima `hv` in `hd`. Paket največ 8 KB, posnetek in duh do 600 KB. Vsak zahtevek igralca mora imeti `sent`, ki ni starejši od njegovega prvega (igralec po izbrisu ne more poslati starega zahtevka znova).

## Pregled ob oddaji

Nekaj milisekund procesorja (`src/pregled.js`), proti mejam iz R2 (`meje.json`, `tools/lestvica-meje.mjs`):

- lestvica (`neznan-kljuc`), avto (`avto`), nadgradnje (`nadgradnje`, natanko ključi meja, 0…`nadMax`), pomoč (`pomoc`);
- polja (`polja`): čas, žig igre in jedra, opis naprave;
- čas ni krajši od meje (`prehiter`), vmesni časi kronometra po odsekih (`vmesni`), število korakov ustreza času (`koraki`);
- duh (`duh`): oblika, avto, število vzorcev, pot med 0,85- in 3-kratno dolžino proge, skoki; duh se na strežniku sestavi znova samo iz znanih polj;
- čas ni počasnejši od igralčevega najboljšega (`ni-boljsi`) in ni že oddan (`ze-oddano`).

Čas gre v stanje `caka`; na lestvico pride šele po ponovitvi na GitHubu (»Preverjanje«).

## Vzdevki

`src/vzdevki.js`: 3–16 znakov po `cleanName` (enako kot igra), črke, številke, presledek in `-_.`. Zavrnjen vzdevek dobi razlog: `oblika`, `povezava` (spletni naslov ali e-pošta), `zasedeno` (admin, moderator, skrbnik, ime igre, »Voznik …«), `beseda` (normaliziran vzdevek vsebuje besedo s seznama; seznam LDNOOBW, CC BY 4.0, v korenskem `README.md`, »Zasluge«, dopolnjen s slovenskimi, hrvaškimi, srbskimi, nemškimi in italijanskimi). Igra razloga ne pokaže. Tri prijave različnih igralcev vzdevek skrijejo, dokler ga skrbnik ne pregleda.

## Omejitve

Števci v tabeli `omejitve` (fiksno okno): 20 oddaj na uro in 100 na dan, 3 spremembe vzdevka na dan, 10 prijav na dan na igralca; z enega zgoščenega IP (`IP_SOL`, sol se ne vidi) 50 novih igralcev na dan in 300 pisanj na minuto. Prek meje 429 `omejitev` z `cez` in `Retry-After`; ključ prek meje do konca okna zavrne isti izolat brez pisanja v bazo.

## Brisanje

- `/v1/izbris`: igralec, njegovi časi in prijave, ki jih je oddal; objekti v R2 takoj, ob napaki R2 v tabelo `brisanje`. Oznaka `izbrisan:<id>` (3 dni) prepreči, da bi star podpisan zahtevek igralca naredil znova.
- Zavrnjen čas izgubi posnetek in duha; igralec obdrži samo najboljši preverjen čas na lestvico; posnetek in duh ostaneta samo prvim 100.
- Dnevno pospravljanje (`src/pospravi.js`, 3.17 UTC): potekle omejitve, časi, ki čakajo več kot 30 dni (`potekel`), časi prepovedanih igralcev, zavrnjeni starejši od 30 dni, igralci brez oddaje 24 mesecev, ostanki v `brisanje` (do 1000 na dan).

## Preverjanje

Opravilo na GitHubu (`.github/workflows/lestvica-preveri.yml`, na `main`, urnik ali ročni zagon) se prijavi z žetonom OIDC (`audience: lestvica`); strežnik preveri podpis s ključi GitHuba, `iss`, `aud`, repozitorij, vejo, potek in dogodek. Skrivnosti ni. Opravilo vzame seznam časov, starejših od 2 minut (brez id-ja igralca in vzdevka), ponovi posnetke v Node (`tools/lestvica-preveri.mjs --krog`) in pošlje izide po 200: `ok` (s časom iz Node, pri trkih `priblizno`), `zavrnjeno`, `ni-mogoce`, `sumljivo`. Sumljive pregleda skrbnik.

## Skrbnik

`tools/lestvica-skrbnik.mjs` dela na D1 prek `wrangler` z istim ključem Cloudflare kot namestitev (drugega gesla ni):

```
node tools/lestvica-skrbnik.mjs seznam                 # prijavljeni vzdevki, sumljivi časi, prepovedani
node tools/lestvica-skrbnik.mjs preglej <id>           # igralec, časi, prijave
node tools/lestvica-skrbnik.mjs skrij|pokazi <id>      # vzdevek; prijave so s tem pregledane
node tools/lestvica-skrbnik.mjs prepovej|dovoli <id>   # oddaja
node tools/lestvica-skrbnik.mjs sprejmi <st>           # sumljiv čas na lestvico
node tools/lestvica-skrbnik.mjs zavrni <st> [razlog]
node tools/lestvica-skrbnik.mjs izbrisi <id>           # zahteva po e-pošti (GDPR, v 30 dneh)
```

`--suho` samo izpiše SQL, `--lokalno` dela na bazi `wrangler dev`. Pregled prijav enkrat na teden ali ko jih je več kot 10.

## Namestitev

Iz seje z ključem Cloudflare (`request_credential`, gostitelj `api.cloudflare.com`; ključ nikoli v pogovor, repozitorij ali na tablo), v tej mapi:

```
npx wrangler d1 create lestvica --jurisdiction eu          # id baze v wrangler.toml (database_id)
npx wrangler d1 execute lestvica --remote --file schema.sql
npx wrangler r2 bucket create lestvica-posnetki --jurisdiction eu
openssl rand -base64 32 | npx wrangler secret put IP_SOL   # sol; seja je ne vidi
npx wrangler deploy                                         # naslov lestvica.<podračun>.workers.dev
```

Nato opravilo preverjanja pošlje meje (`/v1/meje`); `GET /v1/stanje` mora vrniti `meje: true` in `sol: true`. Naslov Workerja gre v igro in v dovoljene gostitelje okolja (uporabnik potrdi v oknu za odobritev). Lokalno: `npx wrangler dev` (baza `--local`).

## Brezplačni paket

Po uradnih straneh, preverjeno 8. 11. 2026: Workers 100.000 zahtevkov na dan in 10 ms procesorja na zahtevek; D1 5 GB, ~5 milijonov prebranih in 100.000 zapisanih vrstic na dan (nad mejo poizvedbe do polnoči UTC padejo); R2 10 GB brez plačila prenosa. Branje lestvic je predpomnjeno (60 s, duhovi 300 s), pisanje omejeno (»Omejitve«), zato ena oddaja zapiše nekaj vrstic. Pospravljanje in `mesto` bereta cele tabele: izmeri ob prvih tisočih vrsticah. Odprto: ali R2 zahteva plačilno sredstvo (vprašanje na strani Odločitve 2).
