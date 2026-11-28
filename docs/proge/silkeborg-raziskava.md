# Silkeborg, Danska: raziskava kraja (dodelava, O-28-6/7)

[← Silkeborg](silkeborg.md) · 28. 11. 2026, biketraveler · samo viri spodaj; imen dirkališča, podjetij in prireditev ni.

## Lega in višina
- Dirkališče na odprti peščeni ravnici pri Resenbru, ~7 km vzhodno od Silkeborga (56,176° S, 9,660° V; OSM `leisure=sports_centre` w543915178, steza w102145330, w338068116).
- Višina 61,7 m (Copernicus DEM GLO-30), skoraj ravno: južna zanka ~3 m nižje (`SK_H`).
- Dolina reke Gudenå (OSM w27872575, širina 20 m) teče ~1–1,8 km severozahodno; most in pomoli ob reki pri Resenbru (OSM `man_made=bridge`, `pier`) so zunaj terena proge.

## Kamnina in tla
- Ledeniška pokrajina: dolina Gudenå je ~35 m globoka, na dnu ~15 m ledeniško-rečnega peska na miocenskih plasteh; ob robu doline pri Smingu in Resenbru terase iz faz taljenja ledu (GEUS Bulletin 35, 2016; fredninger.dk, Sminge Sø).
- Na terenu: pesek (OSM `natural=sand`, 9 ploskev ob stezi), resa (`natural=heath`, 2), grmovje (`natural=scrub`, 6), travniki (`landuse=grass`, 31). Igra: ploskve iz OSM in ESA WorldCover (že v `sk`, `lc`).

## Podnebje
- Zmerno, oceansko: letno ~8–8,6 °C, 720–810 mm padavin, najbolj moker mesec avgust. Uradne normale DMI za postajo Silkeborg niso bile dosegljive; ostaja odprto (tudi za zimo, PR #1087).
- Igra: pozno poletje, jasna severna svetloba, rahla meglica (`look`, ne spreminjam).

## Rastje
- Gozd ob progi: dve ploskvi `landuse=forest` v 450 m; vrsta listov ni označena. V 1,5 km: iglasto 2, mešano 1, listnato 0 (OSM `leaf_type`).
- **Bukov gozd okoli steze ni podprt z viri** (vrzel v `docs/dodelava-prog.md` ga omenja): OSM nima listnatega gozda v bližini; peščena resava je značilna za nasade bora in smreke z brezo (že v `SK_WOODS`). Ne dodajam.

## Voda
- **Jezer do 60 m od steze ni.** Najbližji: majhni ribniki (OSM `natural=water`, 30–60 m) 520–1000 m stran (w163507774, w255552997, w259669699/700) in potok Linå (w318509872) ~800 m vzhodno. Iz kamere za avtom niso vidni; jezera okoli Silkeborga so zahodno od mesta, zunaj terena. Ne dodajam.

## Gradnja in obcestje
- V OSM ob stezi: 18 ograj (`barrier=fence`, mreža; že v `sk.fence`), en zid, stavbe (že v `sk.bld`), tri gomile iz bronaste dobe (`historic=archaeological_site`, že v `sk.mounds`). Severozahodno kamp, igrišča in vas Resenbro (zunaj 60 m).
- Varovalne ograje, gume in robniki na stezi v OSM niso označeni; ostajajo skupni graditelja `js/world-rbring.js`.

## Znamenitosti do 60 m
- Gomila ob Ovinku pri gomili, peščene zaplate v ovinkih, borovi nasadi ob Gozdnem ovinku, tribune (že v `names`, 11 krajev z vrsticami).

## Kaj je ta seja naredila
- Komentator: lastne vrstice za uvod in štart (`comm.intro`, `comm.go`); `js/game.js` jih na dirkališčih zdaj vzame iz `def.comm`, če jih proga ima (drugače skupne).

## Viri
- © OpenStreetMap contributors (ODbL 1.0): API 0.6, izsek 9,640–9,690° V, 56,163–56,190° S, 28. 11. 2026.
- Copernicus DEM GLO-30 (že v »Zasluge«); ESA WorldCover 2021 (CC BY 4.0).
- GEUS Bulletin 35 (2016), »Miocene deposits at Silkeborg, Jylland, and their influence on hydrology«: https://geusbulletin.org/index.php/geusb/article/view/4399
- Sminge Sø, fredninger.dk: https://www.fredninger.dk/wp-content/uploads/2016/11/Sminge_Soe.pdf
