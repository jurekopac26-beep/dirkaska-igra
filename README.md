# Slike: Chapman's Peak, Južna Afrika · hribi za ograjo

Veja samo za slike zdaj/potem (ni del igre, ne gre na `main`). Koda je v pull requestu #654 (veja `popravki/chapman-ograje`), opis proge v `docs/proge/chapman.md` (»Hribi za ograjo«).

## Prošnja uporabnika (11. 11. 2026)

Poročilo `RRA-NAPAKE v=ceb4266a proga=chapman` (#1 521 m, #2 893 m, #3 2133 m): »zbrisi ograjo in to vdolbljeno zemljo vrni nazaj na enak raven kot ostalo«, »le levi strani kjer je vzadaj hrib zbrisi ograjo«, »prav tako na desni strani zbrisi ograjo in vdolbino pod ograjo ce je za ograjo hrib«; in »tam kjer zbrises ograjo prav tako zbrisi v kodi da je prej bila tam ograja tako da avto lahko zapelje v hrib«.

Na vsaki sliki je isto mesto dvakrat: levo **ZDAJ** (kot je v igri na `main`), desno **POTEM** (s popravkom). Kamera za avtom, suho, dan, poletje; drugi avti so skriti.

| Slika | Kaj kaže |
|---|---|
| [`chapman-ograje/chapman-521m.jpg`](chapman-ograje/chapman-521m.jpg) | 521 m (#1). Levo hrib: zdaj mreža proti padajočemu kamenju na pobočju in pod njo vkopan pas zemlje; potem ni ne mreže ne vkopa, bankina gre v višini ceste do stare črte ograje, nato se teren dvigne kot pobočje okoli. Desno, proti morju, ostane vse, kot je. |
| [`chapman-ograje/chapman-893m.jpg`](chapman-ograje/chapman-893m.jpg) | 893 m (#2). Levo hrib: zdaj nizki kamniti zidovi ob črti ograje; potem jih ni, za bankino se dvigne pobočje. Desno, kjer teren pada, ostane vse, tudi opozorilna tabla za padajoče kamenje. |
| [`chapman-ograje/chapman-2133m.jpg`](chapman-ograje/chapman-2133m.jpg) | 2133 m (#3). Levo hrib: zdaj mreža na pobočju, potem je ni. Desno je tu za črto ograje skala (hrib od 1944 do 2178 m): tudi tam ni ograje, vkopa in nevidne stene. |
| [`chapman-ograje/chapman-521m-avto-na-pobocju.jpg`](chapman-ograje/chapman-521m-avto-na-pobocju.jpg) | Avto pri 521 m zapelje s 15 m/s pod kotom 20° proti hribu, 2,5 m pred črto ograje; na sliki je tam, kamor je prišel najdlje. Zdaj ga nevidna stena na črti ograje odbije nazaj na bankino. Potem zapelje na vznožje hriba: 0,4 m nad cesto, 0,2 m čez staro črto, nagnjen za 25°, teža ga vleče nazaj na cesto. |

Kje so hribi (tam ni ograje, vkopa in nevidne stene; nevidna stena je, kjer je hrib visok 0,9 m, največ 2,1 m za staro črto):

- levo 8 odsekov, 4,6 km od 5,0 km: 112–910, 940–1926, 1944–2194, 2256–2624, 2650–2716, 2738–3380, 3410–4216 in 4286–4966 m;
- desno 19 odsekov, 1,8 km (večinoma kratki odseki pod skalami): 1028–1174, 1206–1238, 1428–1454, 1586–1632, 1838–1926, 1944–2178, 2256–2436, 2598–2626, 2692–2842, 2872–2884, 2924–3008, 3044–3100, 3184–3198, 3346–3484, 3580–3670, 4246–4362, 4392–4586, 4616–4722 in 4752–4774 m.

Slike naredi skripta seje (Playwright, kamera za avtom, 1280 × 720, obrezano in pomanjšano na 960 px na stran).
