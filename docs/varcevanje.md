# Varčevanje z žetoni

Odločitev uporabnika 3. 11. 2026 na strani Odločitve (vprašanje `zetoni-1`, odgovor »1 · Vse (A–G)«); dopolnjuje pravila z 2. 11. 2026 (CLAUDE.md, »Varčevanje z žetoni«). Napor max za seje s kodo ostane (odločitvi 31. 10. in 2. 11.): ukrepi odstranijo porabo, ki kakovosti ne prinese.

**Ozadje (3. 11. 2026).** Seje, ki so končale delo, so ure čakale, da njihov PR pride na vrsto za `main`. Same so se zbujale z rezervnimi pregledi na ~4 h (en PR je imel že sedmi pregled, enega sta spremljali dve seji) in ob dogodkih pull requesta. Vsako bujenje znova obdela ves kontekst seje, ta pa zraste do ~900 tisoč žetonov, preden se samodejno povzame. Repozitorij je z `env.CLAUDE_CODE_EFFORT_LEVEL=max` v `.claude/settings.json` vsilil max tudi koordinaciji in zbiranju vprašanj; lokalni `.claude/settings.local.json` z medium ni pomagal (ni v gitu, oblačne seje ga po dokumentaciji Claude Code ne berejo). Spori pri spajanju `main` so bili večinoma mehanski (žigi, kazalo, seznami testov).

## A · Vlak: seje s kodo ne čakajo na `main`

**Seja s kodo**, ko je delo končano:
1. povezani testi lokalno zeleni (`npm run test:related`), `node tools/stamp.js`, reference prog, ki jih je spremenila;
2. spoji svež `main` (`node tools/spoji-main.mjs`) in potisne vejo;
3. odpre pull request **kot osnutek** (draft: težki testi na GitHubu ne tečejo) in v opis doda razdelek `## Za vlak`: kaj je spremenjeno, kateri testi in reference so povezani, na kaj paziti pri spoju (datoteke, proge, reference) in id seje;
4. koordinaciji (seja »VSE SEJE«; `list_sessions`) pošlje eno vrstico »PR #N je pripravljen za vlak«;
5. **konča**: brez `subscribe_pr_activity`, brez rezervnih pregledov, brez čakanja. Uporabniku ob koncu napiše kratek seznam za preizkus na telefonu (velja, ko gre vlak na `main`).

Če koordinacija sporoči, da je na vlaku padel test te seje ali je spor, ki ni mehanski, ga seja popravi na svoji veji, potisne in znova sporoči »pripravljen za vlak«.

**Koordinacija** (»VSE SEJE«, okolje Koordinacija), enkrat ali dvakrat na dan (okoli 12.00 in 20.00 po ljubljanskem času; takoj, če gre za nujen popravek igre na `main`), samo ko čaka vsaj en PR:
1. našteje odprte PR z razdelkom `## Za vlak`;
2. naredi vejo `vlak/<LLLL-MM-DD>-<n>` iz svežega `main` in vanjo po vrsti spoji veje teh PR z `node tools/spoji-main.mjs origin/<veja>`. Kar orodje pusti: generirane podatke in reference ustvari znova z orodji repozitorija (`npm run golden:update` ali ožje); PR s sporom v kodi izloči iz vlaka in njegovi seji sporoči spor;
3. `node tools/stamp.js`, povezani testi vlaka (`npm run test:related`), potisne vejo, odpre PR vlaka (ni osnutek: tečejo celotni nabori) s seznamom PR v opisu, se naroči na njegove dogodke (`subscribe_pr_activity`) in konča korak; rezervni pregled največ eden, na 4 h;
4. zeleno: PR vlaka združi z **merge commitom** (ne squash: tako GitHub PR-je vlaka sam označi kot združene; katerega ne, zapre s komentarjem »Na main z vlakom #N«), sejam vlaka pošlje commit in zažene naslednje seje po svojem načrtu;
5. rdeče: po imenu testa in spremenjenih datotekah najde PR, ki je kriv, ga izloči, njegovi seji pošlje, kaj je padlo, in vlak brez njega pošlje znova; če krivca ne najde, vlak razpolovi.

Vlak sam izpolni pravilo 31. 10. (več PR na istih datotekah gre na `main` v enem koraku). Združuje brez vprašanja (pravilo 2. 11.). Kakovost: testi preverijo točno tisto, kar gre na `main`, in vse skupaj samo enkrat.

## B · Napor po vlogi seje

- `.claude/settings.json` ne nastavlja več `CLAUDE_CODE_EFFORT_LEVEL` (ostane `effortLevel` xhigh kot rezerva). Napor nastavi okolje:
  - okolje **Default** (seje s kodo): spremenljivka okolja `CLAUDE_CODE_EFFORT_LEVEL=max`;
  - okolje **Koordinacija** (enake nastavitve kot Default, le ta spremenljivka je `medium`): »VSE SEJE«, seja zbiranja vprašanj, seje, ki samo zaganjajo druge seje ali posredujejo sporočila.
- Uporabnik spremenljivko nastavi v nastavitvah okolja (meni okolja v naslovni vrstici seje → Edit → spremenljivke okolja); velja za nove seje. Okolje Koordinacija naredi kot kopijo okolja Default.
- Koordinacija zaganja seje s kodo v okolju Default: `create_session` z `environment_id` okolja Default (`list_environments`); brez njega nova seja podeduje okolje koordinacije in dela z medium.
- Ko okolje Koordinacija obstaja, koordinacija naredi v njem svojo naslednico (`create_session`), ji preda stanje (vrsta, odprte naloge, opravila po urniku) in svoja opravila po urniku preusmeri nanjo; enako za sejo zbiranja vprašanj (`docs/vprasanja.md`).
- Model po delu: tabela v CLAUDE.md (»Model in napor«), zbrana iz odločitev 31. 10. in 2. 11. brez nove odločitve.

## C · Spori pri spajanju: `tools/spoji-main.mjs`

- `node tools/spoji-main.mjs [veja] [--no-fetch]` (privzeto `origin/main`) spoji in sam reši mehanske spore v besedilih in seznamih (`*.md`, `index.html`, `garaza.html`, `tests/run.js`, `js/lang.js`): žige `?v=…` (nato `node tools/stamp.js`), vrstice, ki jih je ena stran dodala ob vrstici, ki jo je druga spremenila, vrstice, ki sta jih obe strani dodali na istem mestu (obe ostaneta), in sezname testov v `tests/run.js`. Spor v kodi, generiranih podatkih in referencah pusti in ga izpiše (datoteka, vrstice, namig, s katerim orodjem jih ustvariti znova). Brez sporov naredi commit spoja; žigi gredo vanj.
- Preizkus 3. 11. 2026 na odprtih PR: #241 (kazalo, `index.html`, `garaza.html`) spojen v celoti sam; pri #226 je orodje rešilo `README.md`, kazalo, `index.html`, `garaza.html` in `tests/run.js`, ostali so pravi spori (CLAUDE.md, koda, podatki menija) in reference.
- Test: `tests/spoji-main.test.js`.

## D · Pregledi in pomožni agenti

- Pomožni agenti (Agent), delovni tokovi z več agenti (Workflow) in pregledi z več pregledovalci samo za res vzporedno delo ali tvegano spremembo: fizika, skupna koda sveta in risanja (`js/world.js`, `js/render.js`, `js/core.js`), zelo velike spremembe. Vsak agent znova prebere navodila in velike datoteke.
- Navaden PR: en pregled (`/code-review` medium ali high) ali nič, kjer spremembo pokrijejo testi; celotni nabori tečejo na GitHubu v vlaku.
- Za iskanje po kodi najprej kazalo in grep, ne pomožni agent.

## E · Branje

- Velikih datotek ne beri v celoti; seznam je na vrhu `docs/kazalo.md`. Kazalo samo ima 55 KB: išči v njem z grepom; na vrhu so najpogostejši ukazi.
- `.ignore`: ripgrep (orodji Grep in Glob) ne preišče generiranih podatkov z ogromnimi vrsticami (`js/routes.js` je ena vrstica s 0,4 MB, `assets/maps/`, `maketa-menija/assets/` …); po izrecni poti jih še vedno bereš (Read, `grep` v Bash).
- `.gitattributes` `-diff` za iste podatke: `git diff`, `git show` in `git log -p` jih ne izpisujejo; spajanje ostane besedilno.
- Dolgi izpisi (testi, `git diff` spoja, dnevniki) v datoteko, nato grep. Pri CI samo padli posli in zadnjih ~150 vrstic (`get_job_logs` s `failed_only` in `tail_lines`).

## F · Navodila

- `CLAUDE.md` ima samo splošna pravila (vsaka seja ga prebere celega; 13,5 KB → 8,4 KB). Pravila za dele kode so v `.claude/rules/` in se naložijo sama, ko seja prebere ali uredi ujemajočo datoteko: `grafika.md`, `meni.md`, `napake.md`, `misije.md`. Seja v drugem delovnem drevesu (git worktree) jih ne dobi sama: prebere jih, ko začne delo na tistem delu.
- Odločitve se zapišejo enkrat v docs (načrt teme), v CLAUDE.md le kratko pravilo in sklic.
- Model in napor: ena tabela v CLAUDE.md namesto protislovja med pravilom 31. 10. (»vse seje Opus«) in 2. 11. (»Sonnet za opise, spore in manjše popravke«).

## G · Drobni ukrepi

- Slike za lastno preverjanje pri `deviceScaleFactor: 1` in v manjšem oknu (vsaka slika ostane v kontekstu do konca seje); za stran Odločitve slike, kot jih predpisuje `docs/vprasanja.md`.
- Sredi dolge seje ne menjaj modela: vsak model ima svoj predpomnilnik, zato prvi klic po menjavi znova prebere ves pogovor. Raje nova seja s predajo.
- Dolgožive seje (koordinacija, zbiranje vprašanj) se enkrat na teden (ali ob selitvi v okolje Koordinacija) zamenjajo z novimi: stanje zapišejo v predajo, opravila po urniku preusmerijo na novo sejo.
- Obvestilo in zbiranje vprašanj bereta s strani Odločitve samo, kar potrebujeta (`query` z `where` in `out_dir`, da vsebina ne gre v pogovor; `docs/vprasanja.md`).

## Odločitev zetoni-3 (3. 11. 2026): še šest predlogov

Uporabnik je na strani Odločitve izbral »Uvedi vse (1–6)« (predlogi seje »Programi na čakanju«). Delitev dela:
1. **Rezervni pregledi PR v eni majhni seji** namesto bujenja dolgih sej: VSE SEJE 2.
2. **PR samo z dokumenti brez celotnih testov:** `.github/workflows/tests.yml`, posel »Spremembe« ugotovi iz `git diff` (osnova PR … glava), ali so spremenjene samo datoteke `.md`; takrat teče samo posel »Samo dokumenti« (`node tests/fleet.test.js`, ki vse `.md` preveri za imena znamk avtomobilov), težki posli (»Fizika, AI in dirke«, »Igra v brskalniku« 1–4, »Vozila«) se preskočijo, »Igra v brskalniku« (skupni rezultat) pa ostane zelen. Potiski na `main` in ročni zagoni tečejo vedno v celoti. (Ta seja, PR #279.)
3. **Skupne datoteke prog (reference testov, seznami) razdeljene po progah**, da ni sporov: VSE SEJE 2, v novi seji pred novimi progami.
4. **Pregled prog v eni majhni datoteki:** PR #280 (`docs/proge-pregled.md`, `tools/proge-pregled.js`).
5. **Majhni izpisi orodij:** pravilo v CLAUDE.md (»Varčevanje z žetoni«): `fields`, `minimal_output`, `limit`, `kinds`; velik izpis v datoteko (`out_dir`) in iskanje v njej. (Ta seja, PR #279.)
6. **Arhiv končanih sej in brisanje združenih in opuščenih vej:** čaka na dovoljenje uporabnika (veje izbriše šele, ko so združene ali opuščene po pravilu »ena proga na državo«).

## Stanje

| točka | stanje |
|---|---|
| A vlak | pravila v CLAUDE.md in tu; koordinacijo (VSE SEJE 2) je seja »Predlogi za prihranek tokenov« obvestila 3. 11. |
| B napor | `.claude/settings.json` brez spremenljivke; uporabnik nastavi spremenljivko v okolju Default (max) in naredi okolje Koordinacija (medium) |
| C orodje | `tools/spoji-main.mjs`, `tests/spoji-main.test.js` |
| D pregledi | pravilo v CLAUDE.md |
| E branje | `.ignore`, `.gitattributes`, vrh kazala |
| F navodila | CLAUDE.md, `.claude/rules/` |
| G drobni | pravila v CLAUDE.md; opravili »Obvestilo o vprašanjih« od 3. 11. štejeta samo odprta vprašanja |
| zetoni-3 | 2 (samo dokumenti na GitHubu) in 5 (majhni izpisi) v PR #279; 1 in 3 VSE SEJE 2; 4 PR #280; 6 čaka na uporabnika |
