# Slike za temo Trki (#608): Spa, Belgija

Veja samo za slike zdaj/potem (ni del igre, ne gre na `main`). Koda je na veji `trki/realizem`, opis v `docs/trki-realizem.md`.

## Odpadli deli (10. 11. 2026)

Naloga uporabnika: »popravi deli ki odletijo od avta sedaj prevec dalec drajsajo po cesti, naj se te delci hitreje ustavijo na cesti saj sedaj drajsajo se nekaj casa kot da so na ledu«.

Na vsaki sliki je isti trk dvakrat: levo **ZDAJ** (kot je v igri), desno **POTEM** (s popravkom). Spa, 660 m po štartu, kamera za avtom, izbira trkov Simulacija na obeh straneh. Tekmec z že načetim avtom oplazi desno ograjo in zavira, ti stojiš in gledaš. Krogi kažejo odpadle dele: rdeč se še premika, bel miruje. Merilo pod vsako sličico kaže, kako daleč je vsak del od mesta, kjer je odpadel.

| Slika | Kaj kaže |
|---|---|
| [`odpadli-deli/deli-60kmh.jpg`](odpadli-deli/deli-60kmh.jpg) | 60 km/h, 5 delov. Zdaj trije po 3,5 s še drsijo s hitrostjo do 50 km/h, najdlje 52 m naprej. Potem po 2 s vsi mirujejo, največ 11 m od mesta, kjer so odpadli. |
| [`odpadli-deli/deli-120kmh.jpg`](odpadli-deli/deli-120kmh.jpg) | 120 km/h, 5 delov. Zdaj vseh pet po 3,5 s še drsi s hitrostjo do 110 km/h, najdlje 108 m naprej. Potem po 2 s vsi mirujejo, največ 19 m. |
| [`odpadli-deli/deli-200kmh.jpg`](odpadli-deli/deli-200kmh.jpg) | 200 km/h, 5 delov. Zdaj štirje po 3,5 s še drsijo s hitrostjo do 186 km/h, 120–181 m naprej (zunaj slike). Potem po 2 s vsi mirujejo, največ 28 m. |
| [`odpadli-deli/deli-kolo-200kmh.jpg`](odpadli-deli/deli-kolo-200kmh.jpg) | 200 km/h, poškodbe Vklop, avto, ki mu odpade kolo. Zdaj kolo drsi plosko kot plošček, po 6 s je 82 m naprej in še vedno 47 km/h, pločevina je do 312 m daleč. Potem se kolo kotali, zavije, pade in po 3,5 s miruje 26 m naprej; vsi deli mirujejo. |

Kaj se še spremeni (vidno na slikah):

- Avto, ki je dele izgubil, po trku **drsi dlje**: prej so ga lastni deli zavirali korak za korakom, zdaj ga ne (pri 200 km/h ima sekundo po dotiku 99 km/h namesto 47 km/h).
- Deli **ostanejo blizu mesta trka** in tam ležijo naprej (na cesti jih je največ 40, najstarejši izginejo); avto, ki pelje čez ležeč del, izgubi do 2,5 % hitrosti, kot doslej.
- Rdeča zastava po trku dveh avtov pride redkeje (uporabnik 10. 11. 2026: »Redkejša zastava je ok«).

Slike naredi `node tools/trki/slike.mjs deli60 --deli …` (scenariji `deli60`, `deli120`, `deli200`, `kolo` v `tools/trki/slike-scenariji.json`).
