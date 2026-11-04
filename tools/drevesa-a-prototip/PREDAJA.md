# Predaja · drevesa A »mehke krogle« (prototip, Vršič)

Prototip iz seje `session_01Hx3B2quwMVEvmMAsjEUJnR`, skice izboljšav grafike. **Ni del igre**: nič od tega ne teče v igri, datoteke so tu le zato, da se delo ne izgubi. Uporabnik je izbral različico **A · mehke krogle**; vgradila jo bo nova seja (po redčenju gozda na Vršiču).

## Pozor: narejeno na starem `main`
Prototip je narejen na `5039737`. Na novem `main` je Vršič premaknjen iz `js/world.js` v `js/world-vrsic.js` (pomožne funkcije prek `World.api`), zato `imp.mjs` tak, kot je, ne deluje (`not found: /* VRŠIČ …`). Sidra so na `main` večinoma še ista (`function vrTreeGeo(kind) {`, `tk[kind].add(x, y - 0.15, …)`, `for (const t of tk) t.addTo(root, true);`, `function buildVrsic(…) {`, `VRCOL[0] = r; …`, grmi `if (A < 1480 && r < 0.24) ico(…`). Spremenil se je `tMatT`, ki je zdaj `API.ouCutMat(…)`. `puff`, `ICO0` in `sLathe` iz `sty-lib.js` je treba dobiti prek `World.api` (zdaj `puff` ni med izvoženimi).

Opomba: na novem `main` je v igri samo še kamera za avtom (`chase`); večina slik prototipa je bila izometričnih. Ocenjuj in meri samo za avtom.

## 1. Kako je narejena različica A
- **Kavelj:** `function vrTreeGeo(kind) { if (styF('trees')) return impTreeGeo(kind);`. Zamenja se samo geometrija enotskega drevesa (višina 1). Postavitev, velikost, rotacija in barva instance (`vary`) ostanejo iz igre: `tk[kind].add(...)`, `IChunks`, instanciranje in `cullAdd`.
- **Material za A:** `ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }))`, brez listnih kart in brez `customDepthMaterial`. LOD ni.
- **Stikalo v prototipu:** `window.__STY = { keep: true, trv: 'A', only: { trees: 1 } }`. `styF(k)` preveri `only`, `impCards()` je za A `false`.
- **Pomožni funkciji** (`imp-lib.js`):
  - `impTier(g, y0, y1, r, n, cb, cm, ct, rot)` = `sLathe(g, sXf(0,0,0), [[r,y0,cb],[r*0.52, y0+(y1-y0)*0.45, cm],[0,y1,ct]], n, rot)`: stožec brez dna z gladkimi normalami.
  - `impTrunk(g, h, r, col, n=5)` = `sLathe(..., [[r,-0.02,col*0.8],[r*0.8,h,col]], n)`.
- **Smreka (kind 0/5) in macesen (1/6):**
  - `impTrunk(g, 0.2, 0.03, [0.4,0.29,0.2])`.
  - Stopnje: `T` = 3 (smreka) ali 4 (macesen); za `t < T`: `f = t/T`, `y0 = 0.1 + f*0.62`, `r = (0.32 | 0.26)*(1 - f*0.7)`.
  - Klic: `impTier(g, y0, y0 + (0.42 | 0.32)*(1 - f*0.35), r, 7, c0*(1+0.3f), c1*(1+0.2f), c2, t*0.5)`.
  - Barve smreke: `[0.04,0.13,0.08]`, `[0.08,0.24,0.13]`, `[0.2,0.42,0.2]`; macesna: `[0.16,0.3,0.08]`, `[0.3,0.48,0.14]`, `[0.52,0.7,0.26]`.
- **Bukev (2):**
  - `impTrunk(g, 0.42, 0.04, [0.56,0.54,0.5])`.
  - `puff(g, 0,0.64,0, 0.3, 0.78, [0.18,0.38,0.1], R, 0.1, 0.42, 1.45, false)`.
  - Še 3× `puff` na kotu `q/3*TAU+0.4`, `d = 0.2`, `y = 0.56`, `r = 0.19`, `sy = 0.8`, barva `vary(…, R, 0.1)`, lo/hi 0.42/1.4.
- **Ruševje (3/7):** 3× `puff` (kot `q/3*TAU`, `d = 0.25`, `y = 0.35`, `r = 0.36`, `sy = 0.7`, `[0.08,0.22,0.09]`, lo/hi 0.45/1.35).
- **Breza (4):**
  - `impTrunk(g, 0.62, 0.02, [0.92,0.9,0.86])`.
  - `puff(0,0.72,0, 0.17, sy 1.3, [0.3,0.5,0.12], 0.5/1.45)` in `puff(0.06,0.56,0.03, 0.12, sy 1.1, …, 0.5/1.4)`.
- **Naključje:** `R = rng(9500 + kind*7 + 65)`. `puff()` je funkcija iz `world.js` (ICO0, gladke normale, temna spodaj, topla zgoraj).
- **Grmi ob cesti:** `impKeep(g, 'bush', fn)`. Original se nariše v začasni `GB`, da ostane enako število klicev `RV()`, nato `impBushSolid`: 3× `puff` (`s = w/2`, odmik `s*0.4`, `y0 + s*0.45`, `r = s*0.6`, `sy 0.8`, `[0.2,0.4,0.12]`).

Različice B–E (igrače, brokoli, goste listne karte, pastelne ploskve) so v isti funkciji `impTreeGeo`, izbere jih `trv`.

## 2. Meritve (samo Vršič)
Pogoji: telefon 844×390, quality normal, detail low (tier 0), sence, kamera za avtom; 6 točk + start + cilj (`perf-tv.mjs`). Pri meritvi A so bili vklopljeni tudi cesta B2c, mehak rob in trava, ki ne dodajo oglišč; oblaki niso bili vklopljeni.

| | Klici risanja povp / max | Oglišča povp / max |
|---|---|---|
| Zdaj (5039737) | 156 / 198 | 409k / 557k |
| **A** | 153 / 192 | 522k / **725k** (meja ~900k) |
| B | 153 / 193 | 293k / 386k |
| C | 153 / 192 | 699k / 1004k |
| D | 152 / 192 | 825k / 1277k |
| E | 153 / 193 | 366k / 479k |

Oglišča na drevo, A proti zdaj: smreka 219/132, macesen 282/147, bukev 270/204, ruševje 180/300, breza 150/156. Instanc na celi karti: smreke 23546, macesni 16578, bukve 17057, ruševje 5025, breze 3421. Po redčenju gozda bodo številke nižje, zato je treba meriti znova.

## 3. Datoteke (ta mapa)
| Datoteka | Kaj je |
|---|---|
| `imp-lib.js` | `styF`, `impTreeGeo` (A–E), `impTier`, `impTrunk`, `impBushSolid`, `impKeep`, `impGround` (trava, kotanje), `impAoMesh` (kontaktne sence, opuščene) |
| `sty-lib.js` | starejša skicirna knjižnica, ki jo `imp-lib.js` uporablja (`sLathe`, `sXf`, `styClump`, listne karte, cesta `styRoad2` …) |
| `imp.mjs` | zgradi `out/world-imp.js` iz `js/world.js` + obeh knjižnic + kavljev (sidra za 5039737) |
| `render.diff` | popravki `js/render.js` za skice (`__STY.soft/softR/hemiK/sunK`); na staro `js/render.js` jih nanesi kot `out/render.js` |
| `cloud-prelude.js` | sence oblakov: zamenja `getShadow` v `THREE.ShaderChunk` (`index.html?cloud=0.55&cloudS=7`); dodaj ga pred `out/render.js` → `out/render-imp.js` |
| `shoot2.mjs` | posnetki iz igre (`node shoot2.mjs shots.json out/world-imp.js`); streže mapo `proto2/` (povezave na repo, `js/world.js` → `out/world-imp.js`, `js/render.js` → `out/render-imp.js`) |
| `perf-tv.mjs` | meritve na telefonu, zdaj in A–E (prav tako `proto2/`) |
| `compose-tv.py` | sestavi primerjalne slike |

Poti v skriptah so absolutne (`/home/user/dirkaska-igra/...`). Slike niso v repozitoriju; bile so samo v vsebniku seje.

## 4. Pasti
- Vse je non-indexed `GB` (3 oglišča na trikotnik). Indeksirana geometrija bi oglišča približno prepolovila.
- `puff` z `ICO0` ima opazno oglat obris; `fine` (ICO1) je gladkejši, a 4× dražji.
- Snežne vrste (5–7) so narisane kot poletne, brez snega. Macesen ima samo poletne barve, jesen (`VRS`) ni obdelana.
- Barva instance iz igre (`vary`) se množi z barvami oglišč.
- V načinu keep se morajo klici RNG ujemati z originalom, sicer se premaknejo vsi poznejši predmeti.
- Na slikah so bili vklopljeni tudi svetloba (`hemiK 1.9`, `sunK 0.95`, sonce 0xffd6a0, nebo 0xa9c9ff, tla 0x8a7a55, megla 0xc2d6ee, `soft 1024`), cesta B2c (`road:'toon', tv:6`), mehak rob, trava (`gSat 1.12`, `gBri 0.93`) in oblaki, zato drevesa niso bila prikazana sama.
- Kontaktne sence (temni krogi pod drevesi) so bile preizkušene in opuščene, ker so bile videti kot madeži.
