# Zmogljivost: test `tests/browser/perf.test.mjs` na veji (krog 27. 11. 2026)

## Kaj je bilo narobe

V povezanem krogu (`npm run test:related`, enkrat, koda `eff3af0`; 129 od 130 testov v redu) je padel en test: `browser/perf.test.mjs`,
3 od 76 preverjanj, vsa tri pri številu oglišč na najbolj obremenjenem od šestih vzorcev proge:

- Livorno: 553 tisoč, meja 527 (referenca 461 × 1,1 + 20);
- Mombasa: 450 tisoč, meja 444 (referenca 385 × 1,1 + 20);
- Lusail: 909 tisoč, meja 900 (`CLAUDE.md`; referenca 896, meja po referenci bi bila 1 006).

Klici risanja so pod mejami (največ 193, 216 in 260). Reference teh treh prog so na veji enake kot na `main`; test in `tests/browser/lib.mjs`
sta enaka kot 25. 11. (`96a181d`). Test šteje klice in oglišča, ne časa, in je ponovljiv (isto seme, dirka teče samo po korakih testa).

## Meritev

`vzorci.mjs` ponovi zanko testa z isto nastavitvijo (telefon 844x390, Stari trki `crV: 4`, vleka krmila samo moj avto `pullAll: 0`) in za vsak
vzorec izpiše še, kje na krogu je igralčev avto, koliko tekmecev je do 150 m in koliko avtov ima škodo. 14 dreves, vsako enkrat
(`po-commitih.log`, `pred-spojem.log`); drevesa v isti vrstici dajo do številke enak izpis.

| drevo | Livorno, največ | Lusail, največ | Mombasa, največ |
|---|---|---|---|
| `main` `1e42a0b` (25. 11.) | 461 | **920** | 375 |
| `main` `a8cde61` in `777993a` (27. 11.) | 461 | 896 | 385 |
| veja `96a181d`, `9770dca`, `8527ac8` (25. 11.) | **553** | 842 | 427 |
| veja `f36d382` (spoj `main` `a8cde61`, 27. 11.), `0fc7026`, `c727c8d`, `737b389`, `bfdd165`, `0c36dfd`, `130ceaf`, `d7f821d` | **553** | **909** | **450** |

Tisoč oglišč; krepko je nad mejo tistega dne (Mombasa do #1026: referenca 375, meja 432,5). Ukaz: `TRKI_SNAP=<drevo> node vzorci.mjs`
(drevo `git worktree add --detach <mapa> <commit>` z `node_modules/playwright`); tri proge tečejo približno 1,4 minute.

## Ugotovitev

- **Ni posledica današnjega dela ne spoja `eff3af0`.** Vseh osem dreves veje od spoja `f36d382` (27. 11. ob 10.53) do `d7f821d` da enak izpis.
- **`main` se ujema s svojimi referencami** (461, 896, 385), torej test in orodje merita isto.
- **Livorno je na veji nad mejo vsaj od 25. 11.** (`96a181d`: 553, enaki vzorci kot danes). Dirka 100 avtov na veji teče drugače kot na `main`
  že od prvega vzorca (škoda igralca 0,329 proti 0,164; avto je 7–97 m bolj zadaj; pri četrtem vzorcu 36 tekmecev do 150 m proti 66). Veja ima
  od spoja `0c316c9` (24. 11.) referenco `main` (370, največ 461; pred tem 289, največ 352, `b4832bc`), torej mejo, posneto na drugi dirki.
- **Lusail je ob meji 900 tisoč tudi na `main`.** Tretji vzorec pade na isti odsek (s 1 897–1 918 m, 21 tekmecev do 150 m) in da štiri različne
  izide: 842 (veja 25. 11., s 1 897), 920 (`main` 25. 11., s 1 902), 909 (veja zdaj, s 1 910), 896 (`main` zdaj, s 1 918). Drevo `main`
  `1e42a0b` da torej samo 920, nad mejo `CLAUDE.md` (test je na `main` med `1e42a0b` in `777993a` enak; ali je bil takrat na `main` rdeč, ni
  preverjeno), danes je `main` 4 tisoč pod njo. Na veji se je vzorec premaknil s spojem `main` (`f36d382`), ki je premaknil tudi dirko na
  `main`; prva dva vzorca sta po spoju enaka kot na `main` (s 110 in 1 016; 675 in 603/604 tisoč oglišč).
- **Mombasa: na veji dirka ni premaknjena, mesto je dražje.** Vzorci veje so pred spojem in po njem na istih mestih (s 500, 1 081, 1 393,
  1 979, 2 572, 3 196); četrti stane 427 tisoč pred #1026 (obcestje, `js/world-mombasa-obcestje.js`) in 450 po njem. Na `main` igralčev avto od
  tretjega vzorca stoji pri s = 1 100 m (štirje vzorci na istem mestu, 0 tekmecev do 150 m), zato test na `main` mesta pri s = 1 979 m nikoli ne
  izmeri in referenca (385, drugi vzorec) ga ne pokriva.
- **Kjer je prizor isti, stane enako:** Lusail, vzorca 1 in 2 (675 in 675, 603 in 604 tisoč; klici 204 in 204, 227 in 228), Mombasa, vzorca
  1 in 2 (303 in 303, 385 in 385; klici 119 in 119, 215 in 216).

Sklep: v vseh treh primerih so vzorci drugje kot ob snemanju referenc; meritev ne kaže, da bi isti prizor na veji stal več.

## Ni izmerjeno

- Križni izris (stanje avtov z veje, narisano z izrisom `main`, in obratno), kot ga je seja 17. 11. naredila za Livorno. Brez njega je sklep
  »izris se ni podražil« podprt samo z vzorci, kjer je prizor isti (Lusail in Mombasa, po dva vzorca); za Livorno takega vzorca ni.
- Kateri commit veje je prvi premaknil Livorno čez mejo (najstarejše izmerjeno drevo je `96a181d`) in zakaj krogi 25.–27. 11. padca niso
  zabeležili (v `docs/trki-realizem.md` ga ni).
- Kateri commit `main` med `1e42a0b` in `a8cde61` je premaknil dirko na Lusailu (25 commitov; kodo igre spreminjajo `860caba`, `722c517`,
  `a348499`, `33602de`, `277fd30`). Sliki drobirja in gume, ki ju `Render.precompile(true)` zdaj naredi že ob startu, po branju kode
  uporabljata lasten generator (`Core.rng(83)`, `Core.rng(84)`).
- Zakaj se dirka na veji razlikuje od `main` pri `crV: 4` in `pullAll: 0`. Komentar v testu imenuje razbito steklo na cesti (paket P5, 5 %
  oprijema na zaplati, brez stikala), po katerem vzorci »lahko padejo malo drugam«; ali je to vzrok pri teh treh progah, ni izmerjeno.
- Samo telefon 844x390 in nastavitev testa; druga semena niso pregledana.

## Možnosti in odprta odločitev

Referenc in kode igre v tem krogu nismo spreminjali; test na veji ostane rdeč.

- **Livorno in Mombasa:** obnovi referenci na veji (`PERF_ONLY=livorno,mombasa node tests/browser/perf.test.mjs --update` v ločenem drevesu,
  v `tests/golden/perf.json` samo ta vnosa), prej s križnim izrisom pokaži, da se izris ni podražil. Obe mesti sta daleč pod mejo 900 tisoč.
- **Lusail:** obnova reference ne pomaga, ker pade meja `CLAUDE.md`. Odprta odločitev **zmogljivost-1**: (1) lažji prizor na tem odseku
  Lusaila (tema grafike, ne Trki); (2) test vzorči Lusail drugje ali z rezervo; (3) meja ostane, test pa je ob vsaki spremembi poteka dirke
  lahko rdeč tudi na `main`. Privzeto: 1, do takrat veja ne gre na `main` z rdečim testom.
- **Mombasa na `main`:** igralčev avto v testu od tretjega vzorca stoji; test tam meri štirikrat isto mesto. To je stvar testa na `main`, ne veje.
