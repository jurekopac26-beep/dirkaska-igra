# Tapini, Papua Nova Gvineja (kronometer s cisterno)

[← Vse proge](../../README.md#proge) · proga `tapini` (`js/tracks/tapini.js`, svet `js/world-tapini.js` na podatkovnem graditelju `js/world-gore.js`)

Zemljena cesta v gorah osrednje Papue Nove Gvineje blizu Tapinija (Tapini Highway). Proga 5 prog za cisterno (`docs/proge-cisterna.md`, odločitve uporabnika 8. 11. 2026).

- **Samo cisterna, na čas**: TITAN CISTERNA (tudi če je igralec nima; `vehicle: 'cisterna'`), brez tekmecev in prometa; cilj je pripeljati cisterno do konca. Medalje: čas avtopilota s cisterno × 1,02 (zlato), × 1,15 (srebro), × 1,40 (bron).
- **Odsek**: 483 m spusta s 636 na 590 m (−9,5 %), dolgi ovinki (najmanjši polmer ~28 m).
- **Cesta**: pol širine 2 m; prepad brez ograje na desni ob 88 % dirke (teren ~47 m niže 30 m od osi), na levi lomljena skalna stopnica; rjava zemlja, 77 grbin.
- **Površje** (razgibana cesta, odločitev uporabnika 9. 11. 2026; `relief`, `docs/proge-cisterna.md`): glinasta cesta, ki jo je zgradil buldožer: zelo globoke kolesnice, blatne jame, dolgi valovi levo in desno; čez najhujše blato hlodi, položeni počez (tresejo, moker les drsi).
- **Svet** (dodelava, raziskava spodaj): sklenjen zimzeleni gričevni deževni gozd 10–26 m visok, kjer ima WorldCover drevesa (3 m od roba ceste zaradi kamere), podrast mladih dreves in grmov; trava na grebenih; reka Loloipa v soteski ~150 m pod cesto na desni (`riverBeds`); papige nad cesto, domači prašiči, podrta drevesa in štori ob cesti.
- **Komentator**: Tapini Highway, dolina reke Loloipa, proti mostu Kone (imena iz OSM); oštevilčenih ovinkov ni, zato brez `turnNos`.
- **Avtopilot**: največ 40 km/h (`aiVmax`), nad prepadom pol oprijema v ovinku (`dropCare`), skozi serpentine po širši črti (`wideLine`).
- **Podatki**: sredinska črta iz OpenStreetMap; višine in prepadi iz Copernicus GLO-30, grbine izmišljene, vsakič enake (uvoznik `tools/proga-uvoz.mjs`: `prepad`, `grbine`, `siri`); raba tal ESA WorldCover.
- **Približki**: širina reke Loloipa (12 m) ni v OSM, ocena; skale, grmovje, drevesa in živali so razporejeni po rabi tal in naklonu, ne po resničnih legah; strmina pod robom prepada je strmejša od višinskega modela (polica, `ledge` v slogu sveta); table generične, brez imen podjetij.

## Raziskava kraja (dodelava, 28. 11. 2026)

- **Lega**: Tapini Highway (OSM: secondary, surface dirt), območje Goilala, provinca Central, južna stran gorovja Owen Stanley; začetek proge -8,4247, 146,9576, vožnja proti severu (Tapini). Cesta je dolga ~118 km od Hiritano Highway pri Arapokini do Tapinija in propada (javni opisi).
- **Višina in relief** (Copernicus GLO-30): cesta na ~560–640 m; desno teren pade na ~410–420 m v 200 m (soteska reke Loloipa, OSM way 1386953679, ~208 m desno pri d≈260 m), levo se dvigne 100–250 m v 300 m.
- **Podnebje**: vlažno tropsko, deževna doba ~november–april (regionalni potopisni vir).
- **Rastje**: pod ~1000 m ni gorski, ampak gričevni/nižinski zimzeleni deževni gozd (ekoregija Southeastern Papuan rain forests; gorski gozd osrednjih gora šele od ~1000 m); WorldCover: drevesa ob večini ceste.
- **Kamnina in tla**: gorovje Owen Stanley je večinoma metamorfna kamnina celinskega izvora z bazaltnimi vulkaniti na vrhu (podatek za celo gorovje, ne za cesto); cesta je glinasta, buldožerska.
- **Gradnja ob cesti in zanimivosti do 60 m**: v OSM ni nič razen ceste (ni stavb, mostov ali vasi), zato stavb ne dodajam. Bližje: posamezna hiša Awaluta (685 m), reka Alabule (1,4 km), Kone Bridge (~1,2 km za ciljem), vas Bolubolu (1,8 km), zaselka Lotuava in Fanuma; šola v bližini nosi ime osebe in je izpuščena.
- **Viri**: OpenStreetMap (ODbL), Copernicus DEM GLO-30, ESA WorldCover 2021; Wikipedia: Southeastern Papuan rain forests, Owen Stanley Range, Central Range montane rain forests; oneearth.org (ekoregija); pnghausbung.com (članek o Tapini Highway). Nikoli Google.
