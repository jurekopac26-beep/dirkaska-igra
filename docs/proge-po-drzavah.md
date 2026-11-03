# Proge po državah: v igri in na čakanju

Pravilo uporabnika (3. 11. 2026): v prihodnje naredimo iz vsake države samo **eno novo progo** (`CLAUDE.md`, razdelek »Ena proga na državo«). Spodnja tabela našteje za vsako državo proge, ki so že v igri, in proge, ki čakajo. Seja pred začetkom nove proge preveri stolpec »Odločitev« in po odgovoru uporabnika vanj vpiše izbiro.

- **Izbira** (`ena-proga-<država>` na strani Odločitve): država že ima progo v igri, zato se nova proga iz nje začne šele, ko jo izbere uporabnik. Če je v skupini ali koraku verige proga, ki čaka na izbiro, seja naredi druge proge skupine, to pa pusti.
- **Po vrsti**: država še nima proge, zato gredo njene proge v delo, ko pridejo na vrsto. Ko država dobi progo (na `main` ali v delu na veji), druge iz iste države odpadejo. Stare veje, ki niso v nobenem načrtu, ne pridejo na vrsto.

Viri prog na čakanju: verige iz `docs/nove-proge.md` (veja `nove-proge/balea`), `docs/gorske-proge.md` (kratke proge, veja `gorske-proge/01-norquay`, skupine A–D) in `docs/zavite-proge.md` (veja `ccr-67c8ebdb-8sdz1o`, koraki 1–4); narejene proge na vejah s pull requestom; stare veje iz oktobra (`claude/proga-<id>` in druge), ki niso na `main`. Pregled prog v igri s slikami kamere 1 in zavitostjo: https://claude.ai/artifact/DvMKmf9ZWhENQYRqhR6DrJ

## Države s progo v igri

| Država | V igri | Na čakanju | Odločitev |
|---|---|---|---|
| ZDA | Pikes Peak (asfalt in makadam), Big Sur, Uncompahgre, Santa Monica Mountains, Beartooth, Moki Dugway, Mauna Kea, Mount Baldy, Riverside, Monterey, Detroit, Palomar Mountain | Hana (kratke, C1); stare veje: Mount Lemmon, Mount Rose, Long Beach | izbira `ena-proga-zda`: čaka |
| Avstralija | Bathurst, Longford, Newcastle, Great Alpine Road, Mount Hotham, Townsville | Mount Buller (narejena, PR #241); stara veja: Phillip Island | izbira `ena-proga-avstralija`: čaka |
| Kanada | Toronto, Montréal, Trois-Rivières | Québec (zavite, 2) | izbira `ena-proga-kanada`: čaka |
| Japonska | Suzuka, Irohazaka | Hakone (narejena, PR #261), Nozawa Onsen (kratke, A); stare veje: Aso, Zao, Tokio | izbira `ena-proga-japonska`: čaka |
| Brazilija | Rio do Rastro, Rio de Janeiro | Ouro Preto (zavite, 1), Corvo Branco (kratke, B); stara veja: São Paulo | izbira `ena-proga-brazilija`: čaka |
| Južna Afrika | Chapman's Peak, Sani Pass | Green Point (kratke, D; narejena tudi na stari veji `claude/proga-capetown`) | izbira `ena-proga-juzna-afrika`: čaka |
| Finska | Ouninpohja, Harju | – | – |
| Slovenija | Vršič, Medvode | – | – |
| Kitajska | Tianmen | Hongkong in Macao (zavite, 3), Guoliang (kratke, B); stare veje: Peking, Hong Kong ob pristanišču | izbira `ena-proga-kitajska`: čaka |
| Čile | Los Caracoles | Valparaíso (zavite, 2); stara veja: Santiago | izbira `ena-proga-cile`: čaka |
| Italija | Livorno | Stelvio (stara veja `ccr-b30cfdb0-ej1gzj`, v verigi Nove proge) | izbira `ena-proga-italija`: čaka |
| Maroko | Marrakesh | Dadès (kratke, C2) | izbira `ena-proga-maroko`: čaka |
| Belgija | Spa | stara veja: Kapelmuur (`claude/blissful-knuth-ww01kw`) | izbira `ena-proga-belgija`: čaka |
| Nemčija | Nürburg | – | – |
| Avstrija | Štajerska | – | – |
| Rusija | Katu-Jaryk | – | – |
| Anglija | Crystal Palace | – | – |
| Tajska | Bang Saen | – | – |

## Države brez proge v igri

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
