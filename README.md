# Slike: Chapman's Peak, Južna Afrika · hribi za ograjo

Veja samo za slike zdaj/potem (ni del igre, ne gre na `main`). Koda je v pull requestu #654 (veja `popravki/chapman-ograje`), opis proge v `docs/proge/chapman.md` (»Hribi za ograjo«).

## Avto zapelje v hrib, brez nevidne stene (11. 11. 2026 ob ~4.30)

Prošnja uporabnika: »Poprabi da se avto ne zabije v hrib ampak zapelje v hrib vzemi si cas naredi dobro to«. Na vsaki sliki zgoraj **zdaj** (predogled pred tem popravkom, commit `2034b05`), spodaj **potem** (s popravkom, #654), ob istih časih. Kamera za avtom, suho, dan, poletje; avto postavljen 2,5 m pred črto ograje, plin 30 %, brez krmiljenja; izrez okoli avta, pod sliko čas, hitrost, višina nad cesto, nagib, poškodbe in gumb »Na progo« (ko avto obtiči 2,5 s).

| Slika | Kaj kaže |
|---|---|
| [`chapman-ograje/chapman-521m-v-hrib.jpg`](chapman-ograje/chapman-521m-v-hrib.jpg) | 521 m levo (#1), 72 km/h pod kotom 30°. Zdaj: nevidna stena, kjer je hrib visok 0,9 m: udarec pri 0,2 s (72 → 57 km/h), iskre, 20 % poškodb, pri 0,6 s še en udarec (23 %); avto ne pride više kot 0,2 m. Potem: zapelje v pobočje do 0,8 m nad cesto, nagne se do 44°, ne prevrne se, teža ga vrne na cesto po 2,4 s; brez udarca, isker in poškodb. |
| [`chapman-ograje/chapman-3000m-mreza.jpg`](chapman-ograje/chapman-3000m-mreza.jpg) | 3000 m levo, pod lovilno mrežo, 72 km/h pod kotom 60° (najostrejši primer). Zdaj: v 0,1 s s 72 na 17 km/h, 42 % poškodb, obstane ob črti. Potem: mehka meja ga enakomerno ustavi v ~0,5 s (72 → 50 → 30 → 4 km/h), 0,8 m čez črto in 0,4 m gor, ~2 m pred mrežo, brez poškodb; s plinom ostane ob pobočju, po 2,5 s gumb »Na progo«. |

Starejše slike spodaj so iz prejšnjega koraka (ograja in vkop); njihov »potem« je na novih slikah »zdaj«.

## Brez ograje in vkopa (prejšnji korak, 11. 11. 2026)

Poročilo `RRA-NAPAKE v=ceb4266a proga=chapman` (#1 521 m, #2 893 m, #3 2133 m): »zbrisi ograjo in to vdolbljeno zemljo vrni nazaj na enak raven kot ostalo«, »le levi strani kjer je vzadaj hrib zbrisi ograjo«, »prav tako na desni strani zbrisi ograjo in vdolbino pod ograjo ce je za ograjo hrib«; in »tam kjer zbrises ograjo prav tako zbrisi v kodi da je prej bila tam ograja tako da avto lahko zapelje v hrib«.

Na vsaki sliki je isto mesto dvakrat: levo **ZDAJ** (kot je v igri na `main`), desno **POTEM** (s popravkom). Kamera za avtom, suho, dan, poletje; drugi avti so skriti.

| Slika | Kaj kaže |
|---|---|
| [`chapman-ograje/chapman-521m.jpg`](chapman-ograje/chapman-521m.jpg) | 521 m (#1). Levo hrib: zdaj pod mrežo proti padajočemu kamenju vkopan pas zemlje; potem vkopa ni, bankina gre v višini ceste do stare črte ograje, nato se teren dvigne kot pobočje okoli. Mreža ostane više na pobočju (uporabnik 11. 11.: »zascitno mrezo za varovanje pred padanje kamnov vrni nazaj«). Desno, proti morju, ostane vse, kot je. |
| [`chapman-ograje/chapman-893m.jpg`](chapman-ograje/chapman-893m.jpg) | 893 m (#2). Levo hrib: zdaj nizki kamniti zidovi ob črti ograje; potem jih ni, za bankino se dvigne pobočje. Desno, kjer teren pada, ostane vse, tudi opozorilna tabla za padajoče kamenje. |
| [`chapman-ograje/chapman-2133m.jpg`](chapman-ograje/chapman-2133m.jpg) | 2133 m (#3). Levo hrib: mreža ostane, vkopa in nevidne stene na črti ograje ni več. Desno je tu za črto ograje skala (hrib od 1944 do 2178 m): tudi tam ni vkopa in nevidne stene. |
| [`chapman-ograje/chapman-521m-avto-na-pobocju.jpg`](chapman-ograje/chapman-521m-avto-na-pobocju.jpg) | Avto pri 521 m zapelje s 15 m/s pod kotom 20° proti hribu, 2,5 m pred črto ograje; na sliki je tam, kamor je prišel najdlje. Zdaj ga nevidna stena na črti ograje odbije nazaj na bankino. Potem zapelje na vznožje hriba pod mrežo: 0,4 m nad cesto, 0,3 m čez staro črto, nagnjen za 26°, teža ga vleče nazaj na cesto; do mreže (3–4,5 m za staro črto) ne pride. |

Kje so hribi (tam ni nizkih zidov, smernikov ob črti, vkopa in nevidne stene na črti; nevidna stena je, kjer je hrib visok 0,9 m, največ 2,1 m za staro črto; lovilne mreže ostanejo):

- levo 8 odsekov, 4,6 km od 5,0 km: 112–910, 940–1926, 1944–2194, 2256–2624, 2650–2716, 2738–3380, 3410–4216 in 4286–4966 m;
- desno 19 odsekov, 1,8 km (večinoma kratki odseki pod skalami): 1028–1174, 1206–1238, 1428–1454, 1586–1632, 1838–1926, 1944–2178, 2256–2436, 2598–2626, 2692–2842, 2872–2884, 2924–3008, 3044–3100, 3184–3198, 3346–3484, 3580–3670, 4246–4362, 4392–4586, 4616–4722 in 4752–4774 m.

Slike naredi skripta seje (Playwright, kamera za avtom, 1280 × 720, obrezano in pomanjšano na 960 px na stran).
