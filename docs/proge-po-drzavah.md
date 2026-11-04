# Proge po državah: v igri in na čakanju

Pravilo uporabnika (3. 11. 2026): v prihodnje naredimo iz vsake države samo **eno novo progo** (`CLAUDE.md`, razdelek »Ena proga na državo«). Spodnji tabeli naštejeta za vsako državo proge, ki so že v igri, in proge, ki čakajo. Seja pred začetkom nove proge preveri, ali je proga izbrana oziroma ali je njena država še brez proge.

**Vrstni red dela (odločitev uporabnika 3. 11. 2026):** pred izdelavo novih prog gresta na vrsto **Deli iz garaže, sklop 4** (pregled vseh 624 možnosti na KOLIBRIJU, stran za ogled, testi; `docs/deli.md`) in **dokončanje Ljudi ob progi** (PR #257). Že narejene proge (PR #226, #241, #261) se smejo združiti na `main`; nove proge iz verig (Nove proge, kratke proge, zavite proge) in Kapelmuur se začnejo šele, ko sta oba na `main`.

Viri prog na čakanju: verige iz `docs/nove-proge.md` (veja `nove-proge/balea`), `docs/gorske-proge.md` (kratke proge, veja `gorske-proge/01-norquay`, skupine A–D) in `docs/zavite-proge.md` (veja `ccr-67c8ebdb-8sdz1o`, koraki 1–4); narejene proge na vejah s pull requestom; stare veje iz oktobra (`claude/proga-<id>` in druge), ki niso na `main`. Pregled prog v igri s slikami kamere 1 in zavitostjo: https://claude.ai/artifact/DvMKmf9ZWhENQYRqhR6DrJ

## Države s progo v igri: izbira uporabnika

Odločitev uporabnika 3. 11. 2026 (v pogovoru, na vprašanja `ena-proga-<država>` na strani Odločitve): »dodaj samo tiste, ki si jih priporočal, ter Québec«. Iz teh držav se naredi samo izbrana proga; proge v stolpcu »Odpadejo« se ne delajo (seja jih v svoji skupini ali koraku preskoči).

| Država | V igri | Izbrana nova proga | Odpadejo |
|---|---|---|---|
| ZDA | Pikes Peak (asfalt in makadam), Big Sur, Uncompahgre, Beartooth, Mount Baldy, Monterey, Palomar Mountain (Santa Monica Mountains, Detroit, Moki Dugway, Riverside in Mauna Kea so od 4. 11. 2026 testne) | nobena | Hana (kratke, C1); stare veje: Mount Lemmon, Mount Rose, Long Beach |
| Avstralija | Bathurst, Longford, Newcastle, Great Alpine Road, Mount Hotham, Townsville | Mount Buller (narejena, PR #241) | stara veja: Phillip Island |
| Kanada | Toronto, Montréal, Trois-Rivières | Québec (zavite, 2) | – |
| Japonska | Suzuka, Irohazaka | Hakone (narejena, PR #261) | Nozawa Onsen (kratke, A); stare veje: Aso, Zao, Tokio |
| Brazilija | Rio do Rastro, Rio de Janeiro | Ouro Preto (zavite, 1) | Corvo Branco (kratke, B); stara veja: São Paulo |
| Južna Afrika | Chapman's Peak, Sani Pass | nobena | Green Point (kratke, D; tudi stara veja `claude/proga-capetown`) |
| Finska | Ouninpohja, Harju | – | – |
| Slovenija | Vršič, Medvode | – | – |
| Kitajska | Tianmen | Hongkong (zavite, 3) | Macao (zavite, 3), Guoliang (kratke, B); stare veje: Peking, Hong Kong ob pristanišču |
| Čile | Los Caracoles | Valparaíso (zavite, 2) | stara veja: Santiago |
| Italija | Livorno | Stelvio (stara veja `ccr-b30cfdb0-ej1gzj`, v verigi Nove proge) | – |
| Maroko | Marrakesh | Dadès (kratke, C2) | – |
| Belgija | Spa | Kapelmuur (stara veja `claude/blissful-knuth-ww01kw`; ni v nobeni verigi, posodobi jo nova seja) | – |
| Nemčija | Nürburg | – | – |
| Avstrija | Štajerska | – | – |
| Rusija | Katu-Jaryk | – | – |
| Anglija | Crystal Palace | – | – |
| Tajska | Bang Saen | – | – |

## Ocene prog v igri: ena proga na državo

Uporabnik 4. 11. 2026: »prosim shrani si ocene, da izberem samo 1 progo na državo«. Ocene od 1 do 5 (5 najboljša), kot jih da uporabnik; ko so ocenjene vse proge države, uporabnik izbere tisto, ki ostane (ostale lahko gredo med testne, kot Santa Monica Mountains, Detroit, Moki Dugway, Riverside in Mauna Kea 4. 11. 2026). Države z eno progo v igri tu niso naštete.

| Država | Proge v igri: ocena | Izbrana |
|---|---|---|
| ZDA | Pikes Peak (asfalt in makadam) **5** (4. 11. 2026), Big Sur –, Uncompahgre –, Beartooth –, Moki Dugway **4** (4. 11. 2026; med testne istega dne), Mauna Kea **4** (4. 11. 2026; med testne istega dne), Mount Baldy –, Riverside **3** (4. 11. 2026; med testne istega dne), Monterey –, Palomar Mountain **4,5** (4. 11. 2026) | – |
| Avstralija | Bathurst **4,5** (4. 11. 2026), Longford **3** (4. 11. 2026), Newcastle –, Great Alpine Road **5** (4. 11. 2026), Mount Hotham –, Townsville – | – |
| Kanada | Toronto –, Montréal –, Trois-Rivières – | – |
| Japonska | Suzuka –, Irohazaka **5** (4. 11. 2026) | – |
| Brazilija | Rio do Rastro **5** (4. 11. 2026), Rio de Janeiro – | – |
| Južna Afrika | Chapman's Peak **5** (4. 11. 2026), Sani Pass **4** (4. 11. 2026) | – |
| Finska | Ouninpohja –, Harju – | – |
| Slovenija | Vršič –, Medvode – | – |

Ocene prog iz držav z eno progo v igri (za primerjavo): Spa, Belgija **5** (4. 11. 2026); Los Caracoles, Čile **5** (4. 11. 2026); Livorno, Italija **3** (4. 11. 2026).

## Države brez proge v igri: po vrsti

Proge gredo v delo, ko pridejo na vrsto. Ko država dobi progo (na `main` ali v delu na veji), druge iz iste države odpadejo. Stare veje, ki niso v nobenem načrtu, ne pridejo na vrsto.

| Država | Na čakanju | Odločitev |
|---|---|---|
| Indija | Auli (kratke, A), Shimla in Darjeeling (zavite, 4); stara veja: Killar (ni v načrtu) | po vrsti; pričakovana prva Auli |
| Argentina | Puerto Madero (kratke, D; narejen tudi na stari veji); stara veja: Siete Lagos (ni v načrtu) | po vrsti; pričakovan prvi Puerto Madero |
| Francija | Pau (Nove proge); stara veja: Montvernier (ni v načrtu) | po vrsti; pričakovan prvi Pau |
| Nova Zelandija | Milford Sound (kratke, B), Wellington (zavite, 4) | po vrsti; pričakovan prvi Milford Sound |
| Bolivija | Yungas v dveh verigah (kratke, C1, in Nove proge; ista cesta) | po vrsti; naredi ga veriga, ki pride prva, druga ga preskoči |
| Romunija | Bâlea (narejena, PR #226) | po vrsti |
| Švica | Furka (Nove proge) | po vrsti |
| Gruzija | Gudauri (Nove proge) | po vrsti |
| Albanija | Llogara (Nove proge) | po vrsti |
| Portugalska | Porto Moniz (Nove proge) | po vrsti |
| Tanzanija | Ngorongoro (Nove proge) | po vrsti |
| Saudova Arabija | Diriyah (stara veja `claude/proga-diriyah`, v verigi Nove proge) | po vrsti |
| Kazahstan | Medeu (kratke, A) | po vrsti |
| Šrilanka | Ella (kratke, C1) | po vrsti |
| Zelenortski otoki | Santo Antão (kratke, C2) | po vrsti |
| Mehika | Espinazo del Diablo (kratke, C2) | po vrsti |
| Urugvaj | Punta del Este (kratke, D) | po vrsti |
| Ekvador | Quito (zavite, 2) | po vrsti |
| Južna Koreja | Seul (zavite, 3) | po vrsti |
| Singapur | stara veja: Singapur (ni v načrtu) | ne pride na vrsto |
| Švedska | stara veja: Höljes (ni v načrtu) | ne pride na vrsto |

## Kaj to pomeni za verige

- **Kratke proge** (`docs/gorske-proge.md`): odpadejo Nozawa Onsen (A), Guoliang in Corvo Branco (B), Hana (C1) in Green Point (D). Ostanejo Mount Buller, Medeu, Auli, Milford Sound, Yungas (če ga ne naredijo prej Nove proge), Ella, Santo Antão, Dadès, Espinazo del Diablo, Punta del Este in Puerto Madero.
- **Zavite proge** (`docs/zavite-proge.md`): odpade Macao (3). Ostanejo Ouro Preto, Valparaíso, Quito, Québec, Hongkong in Seul. Wellington, Shimla in Darjeeling (4) odpadejo, če Nova Zelandija in Indija pred njimi dobita progo (Milford Sound, Auli).
- **Nove proge** (`docs/nove-proge.md`): ostanejo vse, tudi Stelvio; Yungas po vrsti (zgoraj).
- **Stare veje**: Kapelmuur je izbran, a ni v nobeni verigi: veja je iz 1. 10. 2026, zato jo nova seja (zažene jo koordinacija »VSE SEJE«) spoji s svežim `main`, preveri ime proge (»Kraj, Država«) in umakne imena lokalov, prireditev in kipov. Druge stare veje ostanejo nezdružene.
