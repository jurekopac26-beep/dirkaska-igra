# Varčevanje z žetoni · odločitve in postopki

Odločitve uporabnika 3. 11. 2026 na strani Odločitve (vprašanja `zetoni-1` do `zetoni-4`, povsod možnost 1; seja »Predlogi za prihranek tokenov«) in odločitve iz drugih sej istega dne (spodaj). Kratka pravila so v `CLAUDE.md`, tu je, zakaj in kako.

## Kje gre največ (meritve 3. 11. 2026)

- **Dolg pogovor:** okno je 1 milijon žetonov, povzetek pa šele pri ~900 tisoč (Opus, prag 901.600) oz. 784 tisoč (Sonnet). Vsak korak seje znova prebere ves pogovor.
- **Bujenje po več kot 1 h:** predpomnilnik velja 1 h, zato poznejše bujenje plača ves pogovor znova po polni ceni.
- **Primer, seja zbiranja:** v 11 h 252 tisoč žetonov konteksta, 7,5 milijona prebranih iz predpomnilnika, 79 tisoč izpisanih, 3,03 USD po ceni API.
- **Spoji main:** v 7 dneh 59 združenih pull requestov in 222 spojev `main` v veje (68 zaradi žigov); vsak spoj na pripravljenem pull requestu sproži celoten krog na GitHubu (~70 min) in nova bujenja.
- **Poraba seje:** `get_session` → `external_metadata.usage` (`cache_read_tokens`, `cache_write_tokens`, `output_tokens`, `cost_usd`) in `external_metadata.context_usage.used_tokens`.

## Odločitve

| vprašanje | odločitev |
|---|---|
| `zetoni-1` | vseh pet predlogov brez izgube kakovosti (a–e spodaj), tudi model Haiku za obvestilo o vprašanjih |
| `zetoni-2` | napor max ostane za vso kodo; koordinacija, zbiranje in obvestila z naporom medium |
| `zetoni-3` | okno za povzetek 400 tisoč |
| `zetoni-4` | svež `main` pred združitvijo brez novega kroga na GitHubu, če spoj nima sporov |
| »Uporabi vse tvoje predloge 1–8« (druga seja, PR #277) | predaja velike seje pri ~300 tisoč, pull requesti proti sporom in vrsta za `main` najprej, rezervna preverjanja enkrat na 8 h (prej 4 h), več agentov samo za težko delo, osnutek ob začetku dela kot seznam dela vseh računov, kratki izpisi, vprašanja samo na strani |
| »Dopolnitev« (druga seja) | koda max, rutina in koordinacija medium; kratki pogovori; manj slik; koordinacija na modelu Sonnet; majhne spremembe iste teme v en pull request |
| »Hitro združevanje« (druga seja) | po svežem `main` s spori samo v žigih, seznamih testov ali kazalu združi brez novega kroga; če `main` pade, ga popravi seja tega pull requesta |

V `CLAUDE.md` so združene v ena pravila: `zetoni-4` in hitro združevanje sta eno pravilo (Postopek); predaja pri ~300 tisoč je glavna pot, povzetek pri ~350 tisoč rezerva (Seje); napor medium za rutino in koordinacijo da okolje »Koordinacija« (spodaj); osnutek ob začetku dela nadomesti prejšnje »Pull request odpri samo, če …«.

## Predlogi a–e (`zetoni-1`)

- **a · Krajši `CLAUDE.md`** (13,5 → 11,2 KB z novimi pravili iz teh odločitev; po združitvi s pravili drugih sej 16,7 → 12,9 KB): ven so šli končana veriga orodja za napake (»vseh 17 sklopov«, sklop 3b, »Oboje«), zgodovina pravil (»prej 5«, »nadomesti prejšnji«, datumi) in polja vprašanj (so v `docs/vprasanja.md`). Veljavna pravila so ostala.
- **b · Kazalo in arhiv:** `docs/kazalo.md` ima na vrhu razdelek »Na kratko« (prvih 25 vrstic, ~2,6 KB namesto 55 KB), ostalo seja poišče z grepom. Opisi končanih sklopov orodja za napake in pospešitev so v `docs/arhiv/orodje-za-napake-sklopi.md` (načrt 54 → 11 KB).
- **c · Iskanje po dolgih vrsticah:** `README.md`, `tests/README.md`, `docs/igra.md` in kazalo imajo vrstice do ~4.600 znakov, zato išči z omejeno okolico: `grep -noE '.{0,150}ime.{0,150}' datoteka`.
- **d · Čakanje brez pogostih bujenj:** zbirka `cakanje` (spodaj) in `CLAUDE.md` (Seje): vmesni dogodek CI dobi eno vrstico, lokalni testi v ozadju sejo zbudijo sami, na pripravljen pull request en potisk na krog popravkov.
- **e · Opravila za vprašanja:** obvestili tečeta na modelu Haiku in bereta samo odprta vprašanja (`query` z `where`); seja zbiranja bere do 25 sej in jo zamenja nova, ko kontekst preseže ~150 tisoč žetonov ali najpozneje po 2 dneh; pregled sej dela podagent (`docs/vprasanja.md`, Zbiranje, korak 9).

## Zbirka `cakanje` (stran Odločitve)

Seja, ki čaka na drug pull request ali na drugo sejo, se ne zbuja s preverjanjem. V zbirko `cakanje` na strani Odločitve svojega računa (seznam strani v `docs/vprasanja.md`) zapiše dokument (`ArtifactData` `set`; id npr. `pr-248-garaza`) in konča korak:

| polje | vsebina |
|---|---|
| `pr` | številka pull requesta, na katerega čaka (ali `null`) |
| `pogoj` | kadar ne čaka na pull request: kratko, na kaj čaka |
| `seja_id`, `seja` | čakajoča seja (sem gre sporočilo) in njen naslov |
| `kaj` | kaj bo seja naredila, ko je pogoj izpolnjen (en stavek) |
| `ustvarjeno` | čas ISO |

- Kdor pull request združi ali zapre: `ArtifactData` `query` zbirke `cakanje` z `where` `[["pr", "==", N]]`, vsaki najdeni seji `send_message` »PR #N je združen na main (ali zaprt): <kaj>« in dokument izbriše.
- Rezerva je zbiranje ob 10.30, 14.30 in 23.00 (`docs/vprasanja.md`, Zbiranje, korak 7). Na računu brez zbiranja seja doda rezervno preverjanje največ enkrat na 8 h.
- Seje drugega računa strani ne vidijo: tam čakanje pokrije zbiranje tistega računa.

## Napor: okolje »Koordinacija« (`zetoni-2`)

- Koda teče z naporom max: `.claude/settings.json` nastavi `env.CLAUDE_CODE_EFFORT_LEVEL` `max` (`effortLevel` xhigh je rezerva, ker se max v nastavitvah ne shrani). Spremenljivka iz nastavitev repozitorija ima prednost pred spremenljivko okolja in pred izbiro napora v aplikaciji, zato ostane.
- Delovni tokovi z več agenti (ultracode) tečejo samo za fiziko trkov in za neodvisno preverjanje pred združitvijo; grafika teče na Fable 5.2 z eno sejo, proge, meni, popravki in izbrisi na Opusu z eno sejo (odločitev uporabnika 10. 11. 2026 ob ~00.57; `CLAUDE.md`, Seje: »Proge in grafika«). Tok z več agenti porabi nekajkrat več kot navadna seja, zato je srednje velikosti (do 10 agentov), rutinsko delo teh tem (spoj `main`, čakanje na teste, združevanje, opisi) pa ostane brez več agentov.
- Prejšnji način za koordinacijo, `.claude/settings.local.json` z medium, ne deluje: datoteka je v `.gitignore` in je v novem kontejnerju ni.
- Nastavitev `maxEffortLevel` napor omeji (tudi `CLAUDE_CODE_EFFORT_LEVEL`); med datotekami nastavitev velja najnižja. Okolje »Koordinacija« jo z namestitveno skripto zapiše v `~/.claude/settings.json`, zato seje v tem okolju tečejo z medium, koda v okolju »Default« pa ostane max.
- **Uporabnik enkrat na vsakem računu**, kjer tečejo koordinacija ali zbiranje: v aplikaciji (meni okolja v naslovni vrstici seje) doda novo okolje z imenom `Koordinacija`, z enakim omrežjem kot »Default«, in v namestitveno skripto (Setup script) vpiše:

  ```sh
  mkdir -p ~/.claude && node -e 'const fs=require("fs"),f=process.env.HOME+"/.claude/settings.json";let s={};try{s=JSON.parse(fs.readFileSync(f,"utf8"))}catch(e){}s.maxEffortLevel="medium";fs.writeFileSync(f,JSON.stringify(s,null,2))'
  ```

- Potem: seja zbiranja se ob naslednjem krogu sama prestavi v okolje »Koordinacija«, z njo tudi obvestili (`docs/vprasanja.md`, Zbiranje, korak 9). Sejo »VSE SEJE«, seje, ki samo zaganjajo druge seje ali posredujejo sporočila, in seje samo za rutinsko delo (spajanje `main`, čakanje na teste, združevanje) odpre uporabnik oz. seja, ki jih zažene, v tem okolju (`create_session` z `environment_id` iz `list_environments`). Seje, ki pišejo kodo, ostanejo v »Default«.
- Preverjanje: v seji v okolju »Koordinacija« `cat ~/.claude/settings.json` pokaže `"maxEffortLevel": "medium"`.

## Okno za povzetek (`zetoni-3`)

- `.claude/settings.json`: `env.CLAUDE_CODE_AUTO_COMPACT_WINDOW` `400000`. Seja pogovor povzame pri ~350 tisoč žetonih (prag 349.600) namesto pri ~900 tisoč; to je še vedno 2-krat več od prejšnjega standardnega okna 200 tisoč.
- Po povzetku podrobnosti z začetka seje niso več v pogovoru: kar mora ostati (odločitve, stanje, poti), seja sproti zapiše v datoteke, commite ali docs.
- Preverjanje v novi seji: `get_session` → `external_metadata.autocompact_state` (`source` `env`, `effective_window` 380.000, `threshold` 349.600; preverjeno 3. 11. 2026).
- Predaja velike seje pri ~300 tisoč (`CLAUDE.md`, Seje) pride pred povzetkom; povzetek je rezerva, kadar predaje ni.

## Svež main pred združitvijo (`zetoni-4`)
Krog testov na `main` se ne prekine (`concurrency` v `.github/workflows/tests.yml`: začeti krog se izteče, najnovejši počaka, vmesni odpadejo; pull requesti se še naprej prekinjajo), zato je varovalka po združitvi res krog testov (odločitev uporabnika `ci-main-krog`, 4. 11. 2026).

Pravilo je v `CLAUDE.md` (Postopek): ko je pull request na GitHubu zelen, spoji svež `main` in poženi lokalne povezane teste; brez sporov ali s spori samo v žigih, seznamih testov ali kazalu (hitro združevanje) pull request združi brez novega kroga na GitHubu, varovalka je krog testov na `main` po združitvi; ob drugih sporih potisk in celoten krog. Pred združitvijo seja preveri zadnji krog testov na `main` in rdečega najprej popravi. Spore v žigih je odpravil #271 (žigov v repozitoriju ni, doda jih objava; na `main` 3. 11. 2026). Ostale mehanske spore reši `tools/spoji-main.mjs` (spodaj, C).

## Račun strani 3: predlogi A–G in `zetoni-3` strani 3 (PR #279)

Na strani 3 (`docs/vprasanja.md`) je uporabnik 3. 11. 2026 izbral »Vse (A–G)« (predlogi seje »Predlogi za prihranek tokenov« tega računa) in »Uvedi vse (1–6)« (predlogi seje »Programi na čakanju«). Po spoju s pravili zgoraj:

- **A · vlak** (koordinacija 1- do 2-krat na dan spoji pripravljene pull requeste v eno vejo, en krog testov): ni uveden, ker ga nadomeščata svež `main` pred združitvijo in hitro združevanje (zgoraj); vprašanje `zetoni-vlak` na strani 3.
- **B · napor po okolju:** nadomestilo ga je okolje »Koordinacija« (zgoraj); `CLAUDE_CODE_EFFORT_LEVEL` max v `.claude/settings.json` ostane.
- **C · `tools/spoji-main.mjs`:** spoj `main` ali druge veje sam reši mehanske spore (kazalo, `tests/run.js`, `README.md`, `js/lang.js`; strani `index.html` in `garaza.html` prepusti `stamp.js --merge` iz #286), odstrani žige starejših vej (`stamp.js --strip`) in preveri povezave (`--check`); ostale spore izpiše z namigom.
- **D, F, G** (več agentov samo za težko delo, krajši `CLAUDE.md` in vrh kazala, manj slik in kratki izpisi): pokrito s pravili zgoraj.
- **E · `.ignore` in `-diff`:** generirani podatki z ogromnimi vrsticami (`js/routes.js`, `assets/maps/`, `maketa-menija/assets/` …) niso med zadetki Grep in Glob in ne v `git diff`.
- **`zetoni-3` strani 3:** 2 · pull request samo z datotekami `.md` na GitHubu požene samo teste dokumentov: ni več v #279, ker to naredi #321 (krajši krog testov; dogovor koordinacije VSE SEJE 2 5. 11. 2026, da se pull requesta ne spreta v `.github/workflows/tests.yml`); 5 · kratki izpisi orodij (`CLAUDE.md`, Varčevanje); 1 in 3 VSE SEJE 2; 4 · `docs/proge-pregled.md` (#280); 6 (arhiv sej, brisanje vej) čaka na uporabnika.

## Poraba: 100 % 12 h pred iztekom (odločitev uporabnika 9. 11. 2026)

Odločitev uporabnika 9. 11. 2026 dopoldne (~10.50–11.05, v pogovoru z Matejem): »Vsak račun vsakič porabi 100 % 12 h pred iztekom porabe.« Objava: tabla #382, komentar 6737552977. Kratko pravilo je v `CLAUDE.md`, razdelek Seje.

- **Cilj:** tedenska poraba teče enakomerno od reseta do roka, 156 h po resetu (168 h − 12 h). Cilj v odstotkih = 100 × (ure od reseta) / 156. Zadnjih 12 h pred iztekom račun ne porablja ničesar; takrat njegove PR vodi drug račun (spodaj).
- **Reset, rok, predaja in vodenje PR v 12 h luknji** (ure po ljubljanskem času; vsak teden enako):

| Račun | Reset | 100 % do | Predaja | V 12 h luknji PR računa vodi |
|---|---|---|---|---|
| partyslo | pet 3.00 | čet 15.00 | čet ~10.00 | biketraveler (čet 15.00 – pet 3.00) |
| jure.kopac26 | ned 10.00 | sob 22.00 | sob ~17.00 | partyslo (sob 22.00 – ned 10.00) |
| biketraveler | pon 0.00 | ned 12.00 | ned ~7.00 | jure.kopac26 (ned 12.00 – pon 0.00) |

- **Pas ±5 točk okoli cilja:** v pasu račun dela, kot dela. Več kot 5 točk **pod** ciljem: koordinacija zažene eno sejo s kodo več (največ 2 hkrati, `CLAUDE.md`, razdelek Seje). Več kot 5 točk **nad** ciljem: nobene nove seje, dela samo ena seja s kodo, dokler cilj računa ne ujame; nezačeto delo prevzame račun pod ciljem (dogovor na tabli).
- **Predaja:** ob uri v stolpcu Predaja vsaka seja računa napiše predajo v opis svojega PR in se ustavi; končane PR drug račun vodi na `main` (`CLAUDE.md`, »Dogovori z uporabnikom«, in `docs/vrsta.md`, »Prevzem zdaj«). Koordinacija računa v luknji ne zaganja novih sej.
- **Dnevno stanje na tabli:** porabo zapiši kot »<račun>: X % (cilj Y %)«. Odstotek računa objavi Matej ali uporabnik; če ga koordinacija ne pozna, napiše »ne poznam«.
- **V repozitorij ne spadajo** trenutni odstotki in dnevni cilji: spreminjajo se, objavljajo jih Matej in koordinacije na tabli. Ostane samo pravilo in tabela zgoraj.

## Stanje

- 3. 11. 2026: uvedeni a–e, okno za povzetek in pravilo za svež `main`; obvestili (`trig_01EXowtvXGXmqji2E2QtKhYd`, `trig_014yjhh3oDoyL7yFFPU8nwY9`) tečeta na modelu Haiku in bereta samo odprta vprašanja. Okolje »Koordinacija« čaka na uporabnika (vsi računi).
- 3. 11. 2026: pravila združena s pravili drugih sej (PR #277 in drugi na `main`); spoj je imel spore v `CLAUDE.md` in `docs/vprasanja.md`, zato je pull request #281 šel skozi celoten krog.
- 3. 11. 2026, račun strani 3: C, E ter `zetoni-3` 2 in 5 v PR #279 (spojen z `main` po #281, v obliki teh pravil). Točko 2 je 5. 11. prevzel #321 (del `tests.yml` je iz #279 izpuščen).
- 5. 11. 2026, račun strani 3: #279 spojen s svežim `main` (570ebca; obdržano vse z `main`, tudi #277); `tools/spoji-main.mjs` prilagojen #286: strani `index.html` in `garaza.html` reši `stamp.js --merge`, orodje ostane za kazalo, sezname testov, `README.md` in `js/lang.js`.
- 9. 11. 2026: pravilo porabe 100 % 12 h pred iztekom (razdelek Poraba) in zbiranje manjših popravkov v en pull request (`CLAUDE.md`, Postopek, »Popravki in posodobitve skupaj«); odločitvi uporabnika prek Mateja, tabla #382, komentar 6737552977.
