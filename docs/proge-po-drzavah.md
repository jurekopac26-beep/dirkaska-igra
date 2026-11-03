# Proge na čakanju po državah

Pravilo uporabnika (3. 11. 2026): v prihodnje naredimo iz vsake države samo **eno novo progo** (`CLAUDE.md`, razdelek »Ena proga na državo«). Ta datoteka našteje proge, ki čakajo, po državah: za države, ki že imajo progo v igri, izbere uporabnik (vprašanja `ena-proga-<država>` na strani Odločitve); za države brez proge gre v delo prva, ki pride na vrsto. Seja pred začetkom nove proge preveri tukaj, ali jo sme narediti, in po odgovoru uporabnika vpiše izbiro v stolpec »Izbira«.

Viri prog na čakanju: verige iz `docs/nove-proge.md` (veja `nove-proge/balea`), `docs/gorske-proge.md` (kratke proge, veja `gorske-proge/01-norquay`) in `docs/zavite-proge.md` (veja `ccr-67c8ebdb-8sdz1o`); narejene proge na vejah s pull requestom; stare veje iz oktobra (`claude/proga-<id>` in druge), ki niso na `main` in niso v nobenem načrtu. Pregled narejenih prog s slikami kamere 1 in zavitostjo: https://claude.ai/artifact/DvMKmf9ZWhENQYRqhR6DrJ

## Države s progo v igri: izbere uporabnik

Proga iz teh držav se začne šele, ko je v stolpcu »Izbira«. Če je v skupini ali koraku verige proga, ki čaka na izbiro, seja naredi druge proge skupine, to pa pusti.

| Država | V igri | Na čakanju | Vprašanje | Izbira |
|---|---|---|---|---|
| Japonska | Suzuka, Irohazaka | Hakone (narejena, PR #261), Nozawa Onsen (kratke, A), Aso, Zao, Tokio (stare veje) | `ena-proga-japonska` | čaka |
| Kitajska | Tianmen | Hongkong, Macao (zavite, 3), Guoliang (kratke, B), Peking, Hong Kong ob pristanišču (stare veje) | `ena-proga-kitajska` | čaka |
| ZDA | 12 prog | Hana (kratke, C1), Mount Lemmon, Mount Rose, Long Beach (stare veje) | `ena-proga-zda` | čaka |
| Brazilija | Rio do Rastro, Rio de Janeiro | Ouro Preto (zavite, 1), Corvo Branco (kratke, B), São Paulo (stara veja) | `ena-proga-brazilija` | čaka |
| Avstralija | 6 prog | Mount Buller (narejena, PR #241), Phillip Island (stara veja) | `ena-proga-avstralija` | čaka |
| Čile | Los Caracoles | Valparaíso (zavite, 2), Santiago (stara veja) | `ena-proga-cile` | čaka |
| Kanada | Toronto, Montréal, Trois-Rivières | Québec (zavite, 2) | `ena-proga-kanada` | čaka |
| Južna Afrika | Chapman's Peak, Sani Pass | Green Point (kratke, D; narejena tudi na stari veji `claude/proga-capetown`) | `ena-proga-juzna-afrika` | čaka |
| Italija | Livorno | Stelvio (stara veja `ccr-b30cfdb0-ej1gzj`; v verigi Nove proge) | `ena-proga-italija` | čaka |
| Maroko | Marrakesh | Dadès (kratke, C2) | `ena-proga-maroko` | čaka |
| Belgija | Spa | Kapelmuur (stara veja `claude/blissful-knuth-ww01kw`) | `ena-proga-belgija` | čaka |

## Države brez proge: po vrsti

Proge gredo v delo, ko pridejo na vrsto. Ko država dobi progo (narejeno in na `main` ali v delu na veji), druge iz iste države odpadejo. Stare veje, ki niso v nobenem načrtu, ne pridejo na vrsto.

| Država | Na čakanju | Pričakovana prva |
|---|---|---|
| Indija | Auli (kratke, A), Shimla in Darjeeling (zavite, 4), Killar (stara veja, ni v načrtu) | Auli |
| Argentina | Puerto Madero (kratke, D), Siete Lagos (stara veja, ni v načrtu) | Puerto Madero |
| Francija | Pau (Nove proge), Montvernier (stara veja, ni v načrtu) | Pau |
| Nova Zelandija | Milford Sound (kratke, B), Wellington (zavite, 4) | Milford Sound |
| Bolivija | Yungas v dveh verigah (kratke C1 in Nove proge, ista cesta) | ena verigi, ki pride prva; druga jo preskoči |
| Romunija | Bâlea (narejena, PR #226) | Bâlea |
| Švica, Gruzija, Albanija, Portugalska, Tanzanija | Furka, Gudauri, Llogara, Porto Moniz, Ngorongoro (Nove proge) | vsaka svoja |
| Saudova Arabija | Diriyah (stara veja `claude/proga-diriyah`; v verigi Nove proge) | Diriyah |
| Kazahstan, Šrilanka, Zelenortski otoki, Mehika, Urugvaj | Medeu, Ella, Santo Antão, Espinazo del Diablo, Punta del Este (kratke) | vsaka svoja |
| Ekvador, Južna Koreja | Quito, Seul (zavite) | vsaka svoja |
| Singapur, Švedska | Singapur, Höljes (stari veji, ni v načrtu) | ne pride na vrsto |
