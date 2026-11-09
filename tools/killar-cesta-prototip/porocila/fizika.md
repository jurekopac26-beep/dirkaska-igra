## 1. Višina, let in pristanek v obeh fizikah — PREVERJENO (branje; zadnja alineja zagon)
- **Katera fizika:** privzeto `phys: 'cs'` (js/game.js:35); `physOf()` vrne 'nova' samo, če jo igralec izbere v Nastavitvah (game.js:71–72). Dirka dobi `phys: physOf()` (game.js:2337), `Race` jo da enako igralcu in vsem tekmecem (js/core.js:6402, 6463, 6471). `Car.step` (3347) kliče `stepCS` (2867–3099) ali `stepNova`/`_nova` (3103–3317); korak je 1/120 s (game.js:15).
- **Cesta:** `elevAt(q.s)` da `roadY, gradeNow, curvNow` (2871; 3111); višina je odvisna samo od s. Mreža je 2,0 m, y je linearen med vzorci, grade in curv sta sredinski razliki (1038–1071), zato curv zajame ~8 m.
- **Vzlet** (2888–2890; 3125–3127, enako): `accSurf = vl²·curvNow`; pri `spd > 6 && accSurf < −JUMP_G·0.85` (−11,9 m/s²) sledi `air = 1; vy = gradeNow·vl; airT = 0`. `grounded = !air` (2892; 3129) velja že v tem koraku.
- **V zraku:** pogon 0 (2967; 3206), zavora samo na tleh (2979; 3216), bočna sila in krmiljenje 0 (3030, 3044; 3258), zasuk zamre z exp(−dt/0,25 s) (3067; 3287), teža po klancu je izklopljena (3057; 3276), ostane zračni upor (3050). `vy −= 14·dt; y += vy·dt` (3078–3079; 3300–3301).
- **Pristanek** pri `y ≤ roadY` (3080–3082; 3302–3304): `impactVY = vy`, absolutna navpična hitrost, ne glede na naklon ceste. Škoda nastane samo pri `vy < −(M.landV || 11)`: `knock((−vy − lv)·0.01)`. Izguba hitrosti je `sc = clamp(−impactVY·0.016·landK, 0, 0.13·landK)`, torej 1,6 % na 1 m/s, največ 13 %.
- **`landT`** se samo nastavi in odšteva (3082–3083; 3304–3305); nič ga ne bere (grep po js/), zato nima učinka.
- **Odziv igre:** zvok pri impactVY < −2,5 in vibracija pri < −5 (game.js:3298–3302), prah pri > 2,2 (js/render.js:9483–9491), napis »SKOK n m« šele od 12 m (game.js:3156–3168), komentator pri airT > 0,45 s (game.js:5483).
- **Mikro pristanki (zagon, fizika-pristanki.mjs):** tik nad pragom avto večkrat vzleti in pristane v istem koraku. Leta ni videti, v teh korakih pa ni pogona, zavore in oprijema, in vsak pristanek vzame `sc`. Na spustu −7,1 % pri 53,3 m/s je en tak pristanek vzel 6,3 % hitrosti (53,3 → 49,9 m/s). Na premočni grbini (0,77 m / 10,5 m pri 49,8 m/s) je 12 pristankov vzelo 22,6 % (49,8 → 38,5 m/s) ob skupaj 0,22 s v zraku.

## 2. Oprijem, pogon in zaviranje pred vzletom: NE — PREVERJENO (branje, grep)
- `curvNow` bereta samo vzletna pogoja (2889, 3126). V cs so bočni oprijem `aL = K.aL·P.amax·G·muLat·gA·dmgG` (2984), pogon (2972) in zavora (2979) brez navpičnega člena. V nova je `capF/capR = mu0·lat·m·G·lF` (3224), `lF` je samo vzdolžni prenos iz `axF` (3222).
- Do −11,9 m/s² ima avto poln oprijem, pod pragom nič; v kotanji ni nič dodatnega. Stanja »lahek« fizika nima.

## 3. Izris avta — PREVERJENO (branje `updateCars`, render.js:6904–6956; številke izračun, ne izris)
- Skupina avta je na `y + (c.nvY || 0)` (6918). Njen naklon gre proti `atan(gradeNow)` s sitom 6/s, v zraku proti `atan2(vy, max(|vl|, 6))·0,8` z 9/s (6924–6925).
- Karoserija se nagiba samo iz bočnega pospeška (do ±0,06 rad, 6921) in vzdolžnega `axF` (−0,045..+0,04 rad, 6922). Kolesa se samo vrtijo in krmilijo (6936–6939).
- Vzmetnega modela, ki bi ga gnal navpični pospešek ceste, NI. Hoda koles in počepa ob pristanku tudi ni; ob pristanku sta le prah in tresenje kamere, ki je privzeto izklopljeno (6934).
- Kanal za gibanje karoserije obstaja: `c.nvY/nvR/nvP` (6918, 6928). Polni ga samo nova za robnike in travo (core.js:3309–3317); cs ga pusti na 0, posnetek ga ničli (game.js:1214–1224).
- Avto je ~43 m od kamere; 1 m višine je 14,5–15,4 px pri 720p ležeče (fizika-kamera.mjs). Premik avta glede na kamero in narisan naklon (h / w / hitrost):
  - 0,15 m / 4 m / 25 m/s: ~2 px, 1,1°
  - 0,3 / 6 / 30: 3,8 px, 1,65° (pravi 2,45°)
  - 0,4 / 8 / 38: 4,8 px, 1,7°
  - 1,0 / 20 / 38: 7,5 px, svet se premakne še za 13 px
- Grbine 0,15–0,4 m so s te kamere komaj vidne; valovi od ~0,6 m navzgor so.

## 4. Kamera za avtom — PREVERJENO (branje render.js; ocena zibanja izračun)
- `chasePose` (9873–9891): `D = (pokonci 46 : ležeče 30)·cam.zoom·userZoom` (userZoom 1,4; game.js:35, 559). Kot navzdol je stalen, `(0,98 : 0,9)·(1 − userTilt)`; naklonu ceste ali avta kamera ne sledi.
- Višina: `cam.gy += (c.roadY − cam.gy)·(1 − exp(−dt·5))` (9898–9899). Sledi cesti pod avtom, ne avtu v zraku, s konstanto 0,2 s; smer sledi z 2,8/s, pri nova z 12/s (9860–9872).
- Valovi 0,2–0,4 m pri 25–40 m/s dvignejo kamero za 0,14–0,28 m. To je čist navpični premik, obzorje miruje, zato neprijetnega zibanja ne bo. DOMNEVA: enako velja za valove do 1,5 m na 20–30 m (premik 0,9–1,4 m v ~1 s).
- Tresenje: `shake(a, k)` (10175) deluje samo pri `cam.shOn[k]`; vrste hit, land, kerb in mis so vse privzeto 0 (game.js:35, 564). Sprožilca za podlago ni (kerb samo na robnikih, 6935), zato na makadamu ne deluje.

## 5. gradeForce — PREVERJENO (branje; posnetek pravila fizika-grbina-ena.mjs)
- cs 3057–3061, nova 3276–3280: `Fgrav = −m·G·gH/√(1 + gH²)`, `gH = gradeNow·(smer·tangenta)`; samo na tleh in ne pri stoječem avtu z zavoro.
- Na grbini avto na vzponu izgubi in na spustu dobi nazaj. Na vrhu je Δv ≈ −g·h/v (0,3 m pri 30 m/s: −0,10 m/s; 1,0 m pri 38 m/s: −0,26 m/s), po grbini 0,00. Največji dodatni naklon je 0,858·h/w (0,3/6: 4,3 %, na mreži 3,4 %).
- Samodejni voznik profila ne vidi: `speedProfile` bere naklon samo pri `def.descent` (1290–1313; Killar ga nima), `aiDrive` (4454–4700) nima ničesar za vrh ali skok.

## 6. Kdo še bere višino — PREVERJENO (branje; prikolica in sovoznik tudi zagon, fizika-prikolica.mjs)
- **Polpriklopnik** `tlStep` (2614–2631) ima svoje pravilo po koraku, `yb = yA + vyA·dt − 14·dt²`, in `mu = airA ? 0 : …`. Os je že danes 7,4 % korakov »v zraku«, z grbinami 8,3–9,7 %; čas 185,7 → 186,0 s, brez padcev. Cestni vlak (`tlRide`, 2675–2679) ima pravilo avta: 0 %.
- **Promet, ljudje, živali:** `_pose` (4839–4856) in `_pedPose` (4832–4836) vzameta `T.hy` linearno, živali `yAt` (736). Cesti sledijo sami in ne morejo poleteti; naklon prometnega vozila je `atan(T.grade[i])` brez glajenja (render.js:6637).
- **Duh:** `ghPose` (game.js:1690–1700) hrani y in naklon pod ključem `recKey = (def.recId || id)…@fizika` (game.js:109). Stari duhovi bodo na novi cesti lebdeli ali tonili do višine grbin, razen če Killar dobi nov `recId` (vzorec js/tracks/ouninpohja.js:24).
- **Posnetek:** `recStep` (game.js:852–877) hrani y na 0,05 s. `rpPose` (1214–1224) ga interpolira in `gradeNow` ne nastavi, zato naklon avta v posnetku že danes ne sledi cesti.
- **Padec:** `_offRoad` (8090–8097) odloča samo po prečnem odmiku, `_fall` (8074–8081) ima svoj balistični padec, `rescue` (8101–8112) postavi avto na `T.hy`. Grbine pravila ne spremenijo.
- **Sovoznik** je privzeto vklopljen (`codrv: 1`, game.js:35) in `Core.codrvRoad(killar)` je true (game.js:5050–5053). Danes: 14 zapiskov, 0 »crest«. 89 grbin kot `def.bumps` da 89 × »crest« (core.js:1529). Iste grbine samo v višinah dajo 22 »crest«, 2 »jump« in 2 »bigjump«, ker samodejno pravilo (1530–1541) računa s hitrostjo do 60 m/s.
- **Luže:** `_buildPuddles` teče samo pri `def.rain` (core.js:265). Killar ima le `rainP`, zato luž ni (`T.puddles` = 0).

## 7. Številke — PREVERJENO (zagon)
Skripte in izpisi so v `tools/killar-cesta-prototip/`: `fizika-hitrosti.mjs` (zahtevana), `fizika-grbina-ena.mjs`, `fizika-poskus2.mjs`, `fizika-pristanki.mjs`, `fizika-kamera.mjs`, `fizika-prikolica.mjs`, izpisi `fizika-*.txt`. Repozitorij je nedotaknjen (`git status` prazen).

**Danes** (serijski reli avto, samodejni voznik, vožnja na čas): cs 118,93 s, nova 117,91 s.
- Hitrost po času (cs), m/s: min 0,0 / 25 % 30,7 / mediana 37,6 / 75 % 44,0 / 95 % 50,4 / max 54,2.
- accSurf −1,78..+1,06 m/s², 0 letov; naklon −8,3..+8,2 %.

**Hitrost vzleta** v = w·√(11,9/(2h)), m/s (km/h):

| h \ w | 4 m | 6 m | 8 m | 12 m |
|---|---|---|---|---|
| 0,1 m | 30,9 (111) | 46,3 (167) | 61,7 (222) | 92,6 (333) |
| 0,2 m | 21,8 (79) | 32,7 (118) | 43,6 (157) | 65,5 (236) |
| 0,3 m | 17,8 (64) | 26,7 (96) | 35,6 (128) | 53,4 (192) |
| 0,5 m | 13,8 (50) | 20,7 (75) | 27,6 (99) | 41,4 (149) |

Mreža 2 m ozke grbine oslabi: ukrivljenost na vrhu je ρ = 0,44 (w 4), 0,66 (w 6), 0,79 (w 8), 0,86 (w 10), 0,90 (w 12) analitične. Prava hitrost vzleta je zato višja za ×1,51 / 1,23 / 1,13 / 1,08 / 1,05.

**Grbina nad pragom pri 30 m/s** (w 6–10 m):

| accSurf na vrhu | čas leta | dolžina | reža pod kolesi | vy ob pristanku | izguba hitrosti |
|---|---|---|---|---|---|
| −13 (1,1× prag) | ~0,05 s | 1,4 m | 3 mm | −0,8 m/s | 0,45 m/s |
| −17,6 (1,5×) | 0,14–0,21 s | 4–5 m | 5–7 mm | −1,5..−2,0 | 1,0–2,0 m/s |
| −23,3 (2×) | 0,30–0,52 s | 9–16 m | 0,06–0,22 m | −3,6..−5,6 | 1,9–3,0 m/s |

Pri višji hitrosti da isti pospešek krajši let (čas ∝ w/v): pri 45 m/s, w 9 m in −28 m/s² (h 0,68 m) 0,26 s in 12 m.

**Poskusi na Killarju** (grbine v kopiji definicije, h = a·w²/(2·v²·ρ(w)) iz krajevne hitrosti; dirke 6 semen; vsi avti vedno v cilju):

| nabor | čas cs | accSurf | pristanki / leti | padci cs 13 / cs 22 / nova 22 |
|---|---|---|---|---|
| danes | 118,93 s | −1,8..+1,1 | 0 | 12 / 18 / 0 |
| L: 87 grbin, w 6–12 m, vrh 4–9 m/s² | −0,04 s | −9,0..+8,8 | 0 | 9 / 26 / 0 |
| L, jakost 1,5 | +0,01 s | do −12,9 | 7 mikro, −3,4 m/s | 10 / 18 / 1 |
| C: 58 valov, w 14–26 m, 3–8 m/s² | −0,12 s | −8,3..+6,9 | 0 | ni merjeno |
| LC: dolgi 2–5 + kratki 3–6 m/s² | −0,10 s | −10,1..+7,7 | 0 | 12 / 20 / 0 |
| LCJ: LC + 6 skokov na ravnem, ne na spustu | +0,57 s | do −23,3 | leti 0,14–0,19 s | 12 / 14 / 0 |
| LCJ, jakost 1,5 (skoki h 0,55–0,78 m) | +1,00 s | do −33 | leti 0,37–0,45 s, 0,36 m visoko | 10 / 24 / 0 |
| stari A: 11 skokov ne glede na ovinke | +1,2 s | — | leti do ~0,4 s | 22 / 44 / 13 |

- Pri L je avto »lahek« (< −4 m/s²) 3,9 s in »težak« (> +4) 6,1 s od 119 s.
- Padci pri cs 22 brez skokov nihajo 14–34 že zaradi drugačne ceste, zato so razlike med vrsticami brez skokov šum.
- Stari A je iz `fizika-poskus.mjs`, ki je krajevno hitrost bral z zamikom; isti nabor brez skokov je dal 11 / 24 / 1.

**Predlog območja (h, w)** — DOMNEVA, oprta na zgornje meritve:
- »Lahek« avto: vrh grbine 4–9 m/s² pri krajevni hitrosti. Pri 38 m/s to pomeni w 6 m: h 0,08–0,17 m; w 8: 0,11–0,25; w 10: 0,16–0,36; w 12: 0,22–0,50; w 20: 0,58–1,30 m.
- Pri 52 m/s je ista meja pol nižja (w 8: 0,06–0,14 m), zato naj bo višina vezana na krajevno hitrost in navzgor omejena; v počasnih delih bi formula dala do 0,9 m.
- Grbine ožje od ~6 m nimajo smisla: mreža jih oslabi in učinek je odvisen od lege na mreži.
- Pas 12–20 m/s² izpusti: leta ni videti, hitrost pa gre.
- Skok: vrh 24–30 m/s² pri krajevni hitrosti in w 7–11 m, torej h ≈ 0,4–1,0 m; samo na ravnem (60–70 m ravno naprej) in ne na spustu.
- Vidna razgibanost naj pride iz dolgih valov (w 14–26 m, h 0,4–1,3 m), ki časa ne spremenijo.

## Tveganja
1. **Pod pragom ni učinka.** Fizika ne pozna »lahkega« avta (točka 2), kamera pokaže 2–5 px (točka 3). Brez novega odziva bo uporabnik razgibanost opazil samo pri dolgih valovih in skokih.
2. **Pas tik nad pragom kaznuje nevidno:** do −6 % hitrosti z enim pristankom na spustu, −23 % na premočni grbini. Jakost nad ~1,3 potisne največje »lahke« grbine vanj.
3. **Skoki ob ovinkih podvojijo padce** (12 → 22, 18 → 44, pri nova 0 → 13), ker voznik profila ne vidi in v zraku ne krmili. Na ravnem padcev ni več.
4. **Test Killarja pade že pri jakosti 0,5:** `tests/killar.test.js:29–32` zahteva največji vzpon < 9 % (danes 8,2 %; L7 pri 0,5 da 9,8 %, L pri 1 da 13,7 %).
5. **Preverba 4b je na meji** (vrstice 115–126): dovoli ≤ 6 padcev v treh dirkah, danes 4; z grbinami brez skokov pride 3–7 po naključju (LC in LCJ: 7).
6. **Medalje in reference:** preverba medalj (|čas·1,01 − 120| < 1,5) zdrži do približno +1,3 s. Reference Killarja v `tests/golden/sim.json`, `races.json`, `world.json`, `perf.json` se spremenijo.
7. **Sovoznik** bo klical vsako grbino (`def.bumps`) ali 26 novih vrhov in skokov (samodejno).
8. **Duh in rekordi** stare ceste ne ustrezajo več; rešitev je nov `recId`.
9. **Fine hrapavosti višine ne zmorejo:** mreža ne nosi valov, krajših od ~8 m, in brez leta ostane le A < 0,30·(λ/v)² (2,5 cm pri λ 10 m in 35 m/s).
10. **Prečnega nagiba odprta proga nima:** `def.bank` velja samo za zaprte (`def.bank && !open`, core.js:226–236), `nvGround` (2394–2406) samo za novo mapo (game.js:2432); promet in ljudje ga ne berejo.
11. **Hitrostna odvisnost:** pospešek raste z v², počasnejši avto ne čuti nič. Formula je na Killarju počasnejša od reli avta (122,7 s, največ 51,4 m/s); drugih razredov nisem meril.

## Odprto
- Kateri odziv naj naredi grbine pod pragom zaznavne: od obremenitve odvisen oprijem, gibanje karoserije po kanalu `nvY/nvR/nvP`, ali zvok in vibracija. Nič od tega ni preizkušeno; prvo spremeni vožnjo tekmecev, ki profila ne vidijo.
- Ali naj Killar s privzeto izklopljenim stikalom pri pristanku šteje vy glede na cesto (`vy − gradeNow·vl`) in ne dovoli pristanka v koraku vzleta. Ni preizkušeno.
- Kam s profilom: poskusi so tekli prek `def.bumps` v kopiji definicije. Novo privzeto izklopljeno polje v `_buildElevationOpen` je moj predlog in v kodi ni preizkušeno.
- Vir krajevne hitrosti za višine: v poskusu izmerjena vožnja samodejnega voznika (cs in nova, največ v ±20 m); `speedProfile` kot vir ni preverjen.
- Oblika skoka: Gaussova grbina da nizke lete (reža do 0,36 m); klančina z robom ni preizkušena.
- Nemerjeno: dež (medalje 133 s), način s prometom, več kot 30 avtov (daljni tekmeci tečejo redkeje, core.js:4435), drugi razredi vozil, človek na telefonu.