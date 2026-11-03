# Vprašanja za uporabnika: stran Odločitve in dnevna priprava

Vsa vprašanja za uporabnika gredo na stran Odločitve (https://claude.ai/artifact/1jxNEJ27WiYpCAw3YbRXEV, zbirka `vprasanja`; polja dokumenta in pošiljanje odgovora v `CLAUDE.md`, razdelek »Seje: čakanje in vprašanja«). Tu je odločitev o dnevni pripravi, kako seja zastavi vprašanje in postopek priprave.

## Odločitev uporabnika (3. 11. 2026)

> »Pripravi mi vsa vprašanja v prihodnje, dokler ne prekličem, vsak dan vsa za vse seje ob 10.30, 14.30 in 23.00, da samo kliknem na izbiro. Pri grafičnih vprašanjih dodaj sliko.«

- Ob 10.30, 14.30 in 23.00 (slovenski čas) so na strani Odločitve pripravljena vsa odprta vprašanja vseh sej: vsako z možnostmi za en klik in priporočeno možnostjo, grafična s sliko. Uporabnik takrat dobi obvestilo.
- Pripravlja seja »Dnevna vprašanja za seje« (`session_01WbgGzuppifPcCa2yn3aJiJ`). Zbudita jo načrtovani opravili, ~20 minut pred uro, da je ob uri vse pripravljeno:
  - `trig_016ucfEPNSdo1y98Sv5aJLCP` »Priprava vprašanj ob 10.30 in 14.30« (`CRON_TZ=Europe/Ljubljana 9 10,14 * * *`),
  - `trig_01EQFoPqSpDJgeFoDKcmvqbD` »Priprava vprašanj ob 23.00« (`CRON_TZ=Europe/Ljubljana 41 22 * * *`).
- Velja, dokler je uporabnik ne prekliče. Ob preklicu (v kateri koli seji) izbriši obe opravili (`delete_trigger`) in tu zapiši datum preklica.
- Seje vprašanje zapišejo na stran takoj, ko ga imajo (ne čakajo ure priprave); uporabnik odgovarja praviloma ob urah priprave. Do odgovora seja dela, kar od njega ni odvisno, ali konča korak (odgovor jo zbudi kot sporočilo). Uporabnika o vprašanju ne obvešča posebej (brez `PushNotification`): obvestilo pošlje priprava.

## Kako seja zastavi vprašanje

Poleg polj iz `CLAUDE.md`:

- Vprašanje je razumljivo brez pogovora seje: naslov je vprašanje, besedilo do ~8 vrstic (kaj je narejeno ali predlagano in kaj pomeni vsaka možnost), 2–5 možnosti s `k` »1«, »2« …, ena je priporočena (`priporoceno`). Za popravke ali drug odgovor ima stran polje Opomba, zato možnost »drugo« ni potrebna.
- Več neodvisnih odločitev je več vprašanj (vsaka svoj klik); njihov vrstni red določa `vrstni_red`.
- **Grafično vprašanje ima vedno sliko** (`slike`). Grafično je vse, kar se odloča po videzu: proga, svet ob cesti, nebo, avto in deli, meni, garaža, HUD, posnetek …
  - Sprememba že obstaja (na veji): slika pred/po s kamero za avtom na pravi progi, npr. `node tools/shot.mjs bathurst --m 1284 --lezece --pred main` (`…-primerjava.png`: pred | po | razlika) ali dve sliki, pred in po.
  - Samo predlog (še ni narejen): **ponazoritev**, slika iz igre na pravi progi (zdaj) in ista slika z narisano spremembo (predlog), drugo ob drugem ali drugo pod drugim. Opis slike se začne s »Ponazoritev:«, da je jasno, da ni posnetek iz igre. Če je predlog mogoče hitro preizkusiti v kodi, je slika iz igre boljša.
  - Izbira med različicami: ena slika na možnost, opis se začne s številko možnosti (»1 · …«).
  - Testnih prog (`test: true`) ne uporabljaj; na sliki ni znamk, logotipov ne imen resničnih oseb (`CLAUDE.md`).
  - Slika: PNG ali JPEG do ~1 MB (ležeče 640 × 360 ali 1280 × 720, sestavljena do ~1600 px široka). Naloži jo v shrambo strani: orodje Artifact z `url` strani, `asset: true` in `file_path` (več slik naenkrat: `file_paths`); v dokument `slike: [{ url: "/_blob/…", opis }]`.
- Vprašanje, ki ga seja ne potrebuje več (odločila je drugače, PR je zaprt …), seja izbriše (`ArtifactData` `delete`), da ne čaka na klik.

## Priprava

Seja »Dnevna vprašanja za seje« ob 10.09, 14.09 in 22.41. Varčno: brez pomožnih agentov, beri samo, kar je novo od prejšnje priprave (z 10 minutami rezerve; prva priprava zadnjih 48 ur).

1. **Stran:** `ArtifactData` `list` zbirke `vprasanja` z `out_dir` v scratchpad (ena datoteka JSON na vprašanje). Odprta so brez `stanje` ali s `stanje` »odprto«.
2. **Seje:** `list_sessions` (`mine: true`, `limit` 100). Za vsako drugo sejo, ki se je spremenila od prejšnje priprave (`updated_at`) in ima `status_bucket` BLOCKED ali `post_turn_summary.needs_action`, ali pa je končala korak (REVIEW_READY, COMPLETED) brez odprtega vprašanja na strani: preberi samo njene zadnje rezultate (`list_events`, `kinds: ["result"]`, `limit` 100; nikoli `user` ali `assistant`, ker so veliki). Če v zadnjem uporabnika sprašuje ali čaka na njegovo potrditev in vprašanja ni na strani, ga zapiši tja: `seja_id` in `seja` (naslov) te seje, kratko, z možnostmi in priporočilom iz njenega besedila (nič si ne izmišljuj).
3. **Vsako odprto vprašanje:**
   - ima 2–5 oštevilčenih možnosti in `priporoceno`; dopolni samo, kar je iz besedila jasno. Predolgo besedilo skrajšaj, vsebine ne spreminjaj.
   - grafično brez slike: naredi sliko po pravilih zgoraj (slika iz igre: `tools/shot.mjs` na pravi progi in mestu, kjer se sprememba vidi; ponazoritev nariši čez njo, npr. s Pythonom PIL), naloži jo in jo vpiši v `slike` (`update` z `if_version`).
   - `vrstni_red`: najprej vprašanja, od katerih je odvisno združevanje na `main` ali delo, ki stoji, nato ostala po sejah.
4. **Obvestilo:** če je odprto vsaj eno vprašanje, `PushNotification` (npr. »Odločitve: 12 vprašanj (3 nova, 10 s slikami)«) in ena vrstica v pogovoru s povezavo na stran. Brez novih in brez odprtih vprašanj ne piši ničesar.
5. **Ne:** odgovorov ne posreduj (to dela »VSE SEJE« ob urnem pregledu), uporabnika v pogovoru ne sprašuj, kode igre ne spreminjaj, novih sej ne zaganjaj.
