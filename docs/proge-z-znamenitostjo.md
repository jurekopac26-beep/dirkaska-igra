# Proge z znamenitostjo (10 prog z modelom iz Blenderja)

Odločitve uporabnika 15. 11. 2026 prek Mateja: »namesto 5 novih prog naredi 10 novih prog, vse naj imajo uporabo blenderja« (~4.40) in »probaj da niso samo stare stavbe, analizeraj se kasne druge moznosti, 50% naj bo starih stavb« (~5.00). Pravila: 1–5 km, vse različnih dolžin, ena proga na državo, izven Evrope, brez vojnih območij; znamenitost pri 25–75 % dirke, ~40–60 m od ceste, vidna s kamere za avtom; brez kipov, napisov, umetnin, logotipov; brez občutljivih krajev (spomeniki trgovine s sužnji, delujoči samostani). Skupna pot: `js/znamenitost.js`, `tools/znamenitost/`, `tests/znamenitost.test.js` (#711).

Vrsta znamenitosti: 5 × **stavba** (stara stavba ali razvalina), 5 × **druga** (naravna oblika, star most ali viadukt, svetilnik, jez, terase, solne tvorbe).

| # | Proga | Država | Vrsta | Kdo | Stanje |
|---|---|---|---|---|---|
| 1 | Luanda | Angola | stavba: trdnjava na griču | jure.kopac26 | pripravljena (#711) |
| 2 | Livingstone | Zambija | druga: most in slapovi | jure.kopac26 | čaka (veja `proge/luanda`) |
| 3 | Isalo, Madagaskar (zamenjava za Antananarivo) | Madagaskar | druga: skalna tvorba Kraljica Isala (Reine de l'Isalo; OSM `natural=rock`, -22.6283, 45.3389), ~30 m od sredine RN7 | jure.kopac26 | v delu (#722, veja `proge/zamenjava-3`): proga, svet, model iz Blenderja, meni, prevodi in test narejeni (15. 11.); dirka 3,63 km, ~44° zavojev na km (malo ovinkasta): vprašanje `isalo-ovinkasto` v `docs/vprasanja.md` (obdrži ali Namibija, Lüderitz) |
| 4 | Mombasa | Kenija | stavba | jure.kopac26 | čaka |
| 5 | Hiva | Uzbekistan | stavba | jure.kopac26 | čaka |
| 6 | *zamenjava* (bila Elmina, občutljiva) | Gana ali rezerva | druga: naravna oblika ali zgradba | jure.kopac26 | izbere seja po resetu |
| 7 | *zamenjava* (bil Bokor) | Kambodža ali rezerva | druga: naravna oblika ali zgradba | jure.kopac26 | izbere seja po resetu |
| 8 | El Jem | Tunizija | stavba | biketraveler | čaka |
| 9 | Portobelo | Panama | stavba | biketraveler | čaka |
| 10 | *zamenjava* (bila Trongsa, delujoč samostan) | Butan ali rezerva | druga: naravna oblika ali zgradba | biketraveler | izbere seja po resetu |

**Zamenjave 3, 6, 7, 10:** asfaltna cesta 1–5 km z naravno znamenitostjo ali zgradbo (skalni lok ali stolp, slap, vulkan, sipine, velikansko drevo, star most, svetilnik, jez, terase, solne tvorbe). Najprej v isti državi, sicer rezerva ali naslednja država iz TOP 20 (npr. Namibija: sipine ali skale ob cesti pri Lüderitzu). Analizo naredi prva seja po resetu porabe (15. 11. ob 10.00), izbor zapiše sem, v `docs/proge-po-drzavah.md` in na stran Odločitve ter pošlje Mateju samo zamenjane vrstice.
