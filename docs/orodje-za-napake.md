# Orodje za napake · načrt

Načrt za orodje, s katerim uporabnik med igranjem označi napake in jih pošlje Claudu. Vse odločitve so iz pogovora z uporabnikom (oktober 2026); nova seja dela po tem načrtu in ne potrebuje starega pogovora ne slik maket.

**Kako se dela:** vsak sklop v svoji seji (»Naredi sklop N po docs/orodje-za-napake.md«). Ob koncu sklopa posodobi razdelek **Stanje** spodaj, `docs/kazalo.md` in napiši uporabniku seznam za preizkus.

## Stanje

| Sklop | Ime | Stanje |
|---|---|---|
| 0 | Zasebnost (Cloudflare) | odloženo (uporabnik 29. 10.: pozneje, ko bo res potrebno) |
| 1 | Načrt, kazalo, pravila | končano (PR #165) |
| 2 | Razdeljen README | končano |
| 3 | Hitrejši testi, hiter vstop | končano |
| 3b | Stabilni testi | končano (PR #170) |
| 4 | Posnetek | končano |
| 5 | Označevanje | končano |
| 6 | Slika in pošiljanje | končano (skupaj s 7) |
| 7 | Zastavica med dirko | končano (skupaj s 6) |
| 8 | Skrito v izdaji za Google Play | odloženo (uporabnik 29. 10.: tik pred objavo, skupaj z izbrisom testnih prog) |
| 9 | Dnevnik napak, prikaz za razvijalca | končano (skupaj z 10 in 11) |
| 10 | G · V krogu | končano (skupaj z 9 in 11) |
| 11 | D · Samodejne zastavice | končano (skupaj z 9 in 10) |
| 12 | E · Datoteka s posnetkom | končano (veriga orodja je končana) |
| 13 | F · Seznam napak | končano (zasebna spletna stran glavne seje, ni v repozitoriju) |
| 14 | Posnetki zaslona, predogled pred mainom | končano (PR #174) |
| 15 | Posnetki pred/po na GitHubu | končano (PR #174) |
| 16 | Ponovljive dirke | končano (PR #175) |
| 17 | Razdeljen world.js | končano (PR #176, #180) |
| 18 | Zgodovina napak | končano |
| 19 | Zadnji posnetki | končano |
| 20 | Beležka v Označi, ročno Poslano | končano (veja `orodje-za-napake/belezka`) |
| 21 | Seznama posnetkov in napak: avto, čas, večja slika, odpiranje starih zapisov | končano (PR #307, veja `orodje-za-napake/sklop-21-seznama`; uporabnik 5. 11. 2026) |

**Pospešitev** (27. 10. 2026: veriga in vzporedni sklopi) je končana; opis je v `docs/arhiv/orodje-za-napake-sklopi.md`. Pravilo za svež `main` pred združitvijo je v `CLAUDE.md` (Postopek).

## Odločitve (veljajo za vse sklope)

- **Izbrana zasnova:** različica 5 (»zastavica že med dirko«) z oblački ob krogih (3), zbiranjem več trenutkov (A), podatki o progi na sliki (B) in pošiljanjem (C), plus »Posnetek do sem« sredi dirke.
- **Naprave:** Samsung Galaxy S25 Ultra in Galaxy A25 (oba Chrome), računalnik z Microsoft Edge. Ležeče in pokonci. A25 je merilo hitrosti: orodje med dirko ne sme ničesar upočasniti (zastavica si zapomni samo čas, slike nastanejo šele v posnetku).
- **Igra:** https://jurekopac26-beep.github.io/dirkaska-igra/ (GitHub Pages z `main`; uporabnik naslova še ni potrdil).
- **Jezik:** orodje samo v slovenščini. `tests/lang.test.js` zahteva angleščino za vsak `tr()` in vsako besedilo v `index.html`, zato je orodje v `js/napake.js`, gradi svoj DOM in ne uporablja `tr()`. Izboljšave obstoječega posnetka (časovnica, gumbi) so del igre in dobijo kratke prevode v `js/lang.js`.
- **Tipke na računalniku** (nastavljive v Kontrolah): **F** zastavica, **I** Posnetek do sem, **O** prikaz za razvijalca. **P** in **Esc** ostaneta Pavza. Plošček: zastavica na Select/Back (predlog).
- **Barve svinčnika (6):** rdeča `#FF3B30`, oranžna `#FF9500`, rumena `#FFE14D`, modra `#2AA8FF`, vijolična `#C061FF`, bela `#FFFFFF`. Zelene ni (trava).
- **Zastavica med dirko:** v vseh načinih razen dirke s prijateljem (`js/net.js`).
- **Repozitorij je javen:** slike napak, zapiski in seznam napak (F) **ne gredo v repozitorij**.
- **Testi (kombinacija):** lokalno samo testi, ki se nanašajo na sklop (Node in brskalniški); celotni nabori (Node, brskalniški, vozila) tečejo na GitHubu v pull requestu sklopa (`.github/workflows/tests.yml`). Celoten Node nabor tu traja okoli 1 h (26. 10. 2026: `golden` 12 min, `races` več kot 15 min in ga `tests/run.js` ustavi, skupaj ~51 min brez konca `races`). Na GitHubu trajajo testi 35–55 min: Node okoli 35 min, en del brskalniških do okoli 55 min. Če ga poganjaš lokalno, nastavi `TEST_TIMEOUT_MIN=40`.
- **Potrditev vnaprej (26. 10. 2026):** uporabnik je potrdil vse sklope. Vsak sklop gre na `main`, ko so testi zeleni (lokalno in na GitHubu), in takoj se začne naslednji; ne čakaj na potrditev med sklopi. Uporabnik preizkuša sproti in javi napake, ki se popravijo v naslednjem sklopu ali posebej.
- **Sklopi se začnejo sami (26. 10. 2026, uporabnik: »Vseh 17 sklopov začni sam in ne sprašuj, če lahko začneš naslednjega«):** ko je sklop na `main`, seja brez vprašanja zažene sejo za naslednji sklop iz tabele Stanje (model `claude-opus-5-5`) in ji to navodilo prenese, tudi ta stavek. Sklopa 0 in 8 ostaneta odložena in se preskočita, razen če uporabnik reče drugače. Uporabnika se med sklopi ne sprašuje za potrditev, samo pri odločitvah, ki so res njegove (npr. sprememba zasnove); ob koncu vsakega sklopa dobi kratek seznam za preizkus.
- **Napor high (26. 10. 2026, uporabnik: »nastavi high za vse seje«):** `.claude/settings.json` z `{"effortLevel": "high"}`; vsaka seja, ki klonira `main`, dela z naporom high.
- **Veje:** `orodje-za-napake/sklop-NN-<ime>`, en pull request na sklop oziroma na združen korak (glej Pospešitev pod Stanjem); sklop 17 ima lahko več pull requestov.
- **Vsak popravljen hrošč** dobi svoj test (`tests/napake/<št>.test.js` ali v obstoječem testu teme), okoli 10 min na popravek.
- **Odloženo:** sklop 0 (repozitorij zaseben, igra na Cloudflare Pages z dostopom samo za uporabnika; GitHub Pro bi stal okoli 4 $/mesec, če bi kdaj izbrali samo zasebno kodo) in sklop 8 (orodje skrito v izdaji za Google Play). Do sklopa 8 je orodje privzeto vklopljeno.

## Zasnova (iz maket)

### Posnetek

- Obstoječi posnetek (`#replay-ui`, `replayStart` / `replayAct` / `replayFrame` v `js/game.js`) dobi:
  - debelejšo časovnico (`.rp-prog`), ki se jo klikne ali vleče; levo trenutni čas, desno dolžina (`00:41.3 / 02:31.2`);
  - gumbe: na začetek, 5 s nazaj, sličica nazaj, predvajaj/ustavi, sličica naprej, 5 s naprej, hitrost, kamera, prejšnji/naslednji avto, ★ Trenutki, **Označi**, Foto, Končaj.
- **Zgoraj stikalo** »Cel posnetek | Zastavice (n)«:
  - **Cel posnetek** je kot zdaj, od starta do cilja. Zastavice so na časovnici samo oznake, tap skoči tja.
  - **Zastavice** skačejo med označenimi trenutki (Prejšnja / Naslednja) in vsakega ponavljajo od −2 s do +1 s.
  - Brez zastavic je gumb Zastavice siv.
- **Posnetek do sem:**
  - v meniju Pavza nov gumb za »Celoten zaslon«; tipka **I** ga odpre neposredno, brez menija;
  - napis »● POSNETEK DO SEM«, ploščica »Dirka čaka na pavzi · krog x/y«; časovnica se konča z zeleno oznako ZDAJ;
  - namesto Končaj je zelen gumb **Nazaj v dirko**, ki vrne dirko točno tja, kjer je bila, z odštevanjem 3 · 2 · 1;
  - posnetek med ogledom premika iste avte kot dirka (`rpPose`), zato je treba stanje vseh avtov pred ogledom shraniti in ga po ogledu vrniti;
  - ni v dirki s prijateljem.
- Posnetek hrani do 20 min dirke (`REC_MAX` v `js/game.js`).

### Označevanje

- **Označi** ustavi posnetek. Ležeče je paleta navpično ob levem robu, pokonci vrstica nad časovnico. V paleti so svinčnik, 6 barv, razveljavi in radirka.
- Ena barva na sličici pomeni en zapis (vse rdeče gre v rdeči zapis). Oblačkov ob krogih od 4. 11. 2026 ni več (uporabnik: »zbriši rdeči okvirček … imamo tukaj beležko«): zapis barve se piše v beležko.
- Spodaj desno nad sliko je vedno odprta **beležka** za zapis trenutka (napake, predlogi, vprašanja); na računalniku gre vanjo tipkanje brez klika. Trenutek se shrani tudi brez oznake (sklop 20). Beležka je v barvi svinčnika (privzeto rdeča): z rumeno barvo se obarva rumeno in zapis gre v rumeni zapis, posebej od rdečega (uporabnik 4. 11. 2026: »beležka naj bo rdeča, če uporabnik vzame rumeno barvo, se beležka obarva rumeno in posebi shrani, kaj je bilo obkroženo z rumeno«). Pike v glavi beležke pokažejo druge barve z zapisom; tap na piko odpre njen zapis. Sklenjen krog beležko na kratko osvetli.
- **Dodaj k zbirki** shrani trenutek (sličico, oznake, zapise) in na časovnici postavi zastavico.

### Slika in pošiljanje

- **Zbirna slika**, največ 1600 px (v Nastavitvah tudi 2400 px):
  - ležeče mreža 2 × 2 (do 3 trenutki in polje s podatki ter zemljevidom), pri več trenutkih več slik;
  - pokonci 3 trenutki v vrsti, podatki in zemljevid spodaj.
- **Vsak trenutek:**
  - sličica z oznakami in beležko (zapisi po barvah, eden nad drugim);
  - vrstica »#n · čas · krog · metri od štarta«;
  - 4 sličice gibanja (−0,6 s, −0,3 s, 0, +0,3 s).
- **Podatki (B):** proga, način, vreme, različica (žig `js/game.js`, ki ga objava doda s `tools/stamp.js`; lokalno brez žigov `lokalno`), naprava z modelom telefona (npr. »Galaxy A25«), datum, zemljevid z oštevilčenimi mesti.
- **Ime datoteke:** `napake_<proga>_<LLLLMMDD-UUMM>.png`.
- **Ob koncu** (ali z gumbom Deli kadar koli) se odpre izbira:
  - **Deli zdaj** – na telefonu meni Deli (Web Share), na računalniku je prva izbira **Kopiraj sliko** za Ctrl + V;
  - **Samo shrani sliko** – v Prenose; obvestilo pove, kje je (Samsung: *Moje datoteke → Prenosi*, Edge: mapa *Prenosi*);
  - **Kopiraj besedilo** – oblika spodaj.
- **Shranjene napake** (od sklopa 18 **Zgodovina napak**):
  - zadnjih 100 zbirk ostane v igri (IndexedDB), najnovejših 20 s polnimi slikami, starejše z malo sliko in besedilom;
  - stanje Neposlano → Poslano → Popravljeno → Zaprto;
  - gumb »Deli vse neposlane«;
  - kljukica »Obdrži tudi slike v igri«;
  - pri vsaki zbirki in pri vsakem posnetku (Zadnji posnetki) sta ime avta igralca in čas vožnje, zeleno, če je prišel do cilja (`KOLIBRI · 1:23.456`), sicer »ni do cilja« (sklop 21); posnetki do cilja imajo zelen rob, v Zadnjih posnetkih jih pokaže gumb »Samo do cilja«;
  - slika v obeh seznamih in v zapisu se z dotikom poveča čez celo okno (zapre jo dotik, Esc ali Zapri); dotik besedila odpre zapis oziroma posnetek;
  - Zgodovina napak je samo slike napak z besedilom; **posnetki dirk za prenos (.rrp) so v Zadnjih posnetkih** (povezava v Nastavitvah orodja in v Zgodovini napak); zapis, katerega posnetek je še med njimi, ima gumba Odpri posnetek in Shrani .rrp.
- **Nastavitve → Orodje za napake:**
  - Vklop;
  - Ob koncu (Vprašaj / Deli / Shrani);
  - Zastavica med dirko (Gumb + tipka F / Samo tipka / Izklop);
  - Velikost slike (1600 / 2400 px);
  - Shranjene napake.
- Obstoječi Foto (`photoSave` v `js/game.js`: `Render.snapshot`, Web Share, prenos) je vzor za izdelavo in pošiljanje slike.

**Besedilo za pogovor** (Kopiraj besedilo; isto besedilo je tudi spodaj na sliki):

```
RRA-NAPAKE v=<žig> proga=<id> način=<način>/<vreme> naprava=<model> <širina>x<višina>
#1 00:18.2 K1 s=412m modra »Tekmeci vozijo v koloni preveč skupaj« v_krogu=[tekmec#3, tekmec#5]
#2 00:41.327 K2 s=1284m rdeča »Sledi gum sredi ravnine« v_krogu=[sledi_gum, cesta:412-431]
```

`s` je razdalja od štarta po progi (`T.idx` / `T.ds` v `Core`), `v_krogu` doda sklop 10. Zapis beležke (sklop 20) je od 4. 11. 2026 zapis svoje barve, z `v_krogu` (prazen, če te barve ni kroga): `#1 00:18.2 K1 s=412m rdeča »Ves zaslon utripa / Predlog: manj megle« v_krogu=[]` (vrstice zapisa so združene z » / «). Trenutki, shranjeni prej, imajo še vrstico `beležka »…«` pred barvami.

### Zastavica med dirko

- Okrogel rumen gumb ob desnem robu. Postavi ga tako, da ne prekriva dotičnih kontrol (`#touch`), ležeče in pokonci.
- Ob tapu: obvestilo »⚑ Zastavica N · čas – dirka teče naprej«. Igra si zapomni samo čas, nič drugega.

## Sklopi

Opisi končanih sklopov 1–20 (časi, vsebina, testi, opombe) so v `docs/arhiv/orodje-za-napake-sklopi.md`.

### Odloženo

- **Sklop 0 · Zasebnost:**
  - Cloudflare račun (uporabnik);
  - Cloudflare Pages z repozitorija;
  - Cloudflare Access »samo moj e-naslov«;
  - preverjanje;
  - repozitorij zaseben in GitHub Pages izklopljen.

  Opozorilo: zasebni repozitorij ima na brezplačnem računu 2000 min testov na mesec. Moje delo 0,5–1 h, uporabnik 20–30 min.
- **Sklop 8 · Skrito v izdaji za Google Play:** test, da igralci orodja ne vidijo; vklop samo v načinu za testiranje. 0,5 h. **Odločitev uporabnika (29. 10. 2026):** sklop 8 se naredi tik pred objavo na Google Play in v istem koraku se izbrišejo vse testne proge (`test: true` v `js/tracks/`); do takrat ostane vse, kot je. Ob izbrisu Ria de Janeira (testna od 5. 11. 2026, PR #365): `rio` iz `WSPLIT` v `tools/razdeli-proge.mjs`, preostale Riove scenarije v `tests/razdelitev.test.js` (`rioKartGeo`, `RIO_W`, `RIO_Q`, `sAtS`) prestavi na Bathurst ali Crystal Palace. V izdaji za Google Play se skrije tudi **testni denar v naslovu** (`?denar=<znesek>` na `index.html` in `garaza.html`, `js/denar.js`; želja uporabnika 9. 11. 2026 za preizkus novih avtov): izdaja ga ne nalaga ali ga izklopi, test pa preveri, da `?denar` v njej ne spremeni denarja kariere.

## Skupaj

- **Moje delo** brez odloženih sklopov: **23,5–32,5 h**, s testi okoli **30–42 h**.
- **Različica 5** je cela po sklopu 7: okoli 9–12,5 h dela, okoli 11,5–16 h s testi.
