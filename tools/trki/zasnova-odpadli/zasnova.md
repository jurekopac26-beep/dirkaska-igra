# Odpadli deli: zasnova izvedbe (the design of the change; IMPLEMENTED 10. 11. 2026 with the differences below)

The parts cars shed stop on the road as sheet metal, plastic and wheels do, not as on ice (the user's of 10. 11. 2026). This text is the design as it was written before the implementation, measured on copies of the core outside the repository (the scratch folders `$Z`, `$B`, `$D`, `$S` it names no longer exist; their results are the numbers in the text). **It is kept as the record of why the model is as it is; the code is `js/core.js` (`DEB`, `stepDebris`, `debrisHit`, `Race.spawnDebris`), the test `tests/odpadli-deli.test.js`, the state and the measurements of the final code `docs/trki-realizem.md`, »Odpadli deli: izvedba«.** The design's patch (`jedro.patch`) and draft test (`test-osnutek.js`) were removed from this folder when they went into the game; the measuring tool is `tools/trki/odpadli.js`.

**Where the game differs from this text** (the independent review of the design, 10. 11. 2026; reasons and numbers in `docs/trki-realizem.md`):
- §6, §13 (the time rule): not one car and one time a piece (`d.by`, `d.byT` as a car and a number) but **a list of cars, each with its own seconds** (`d.by` the cars, `d.byT` their seconds). With one slot two cars at one piece took the exemption from each other and both were knocked step after step;
- §6, §13 ("the part is drawn through its own car for up to 2 s"): a piece that still moves and is in the way of a car on its list is **shouldered aside** (`DEB.push`: its speed across the car raised to 4 m/s, to the side it is on; nothing to the car). §13's "pushing the piece aside ... left for Realistična" no longer holds for the car's own parts;
- §2, §3 (wheels): **a spare wheel is a wheel too** (`P.spare`), not a panel;
- §2 (the height over the road): a banked bend's height is added (`T.bankAt`);
- §4 (the cap of 40): a piece pushed off the list while it still tumbles or rolls is not left drawn on its edge;
- §3: a surface code the tables do not know counts as asphalt;
- §9 (the cost): a moving piece's step costs about 40 % more than before (not 20 %), a piece's whole run 2.4 to 3.7 times less; on real tracks a piece may be at rest only after up to 4.7 s at 200 km/h (not 3.7 s);
- §10 (the tests): 24 checks, not 17 (two cars at one piece, each car its own time, the push, spare wheels); `tests/redflag.test.js` needed only the moment of the pile-up (60 s to 75 s; the second edit is not needed on the current tree); `tests/aipits.test.js` runs Montréal with seed 6; 86 of 140 scenarios and 17 of 100 races changed (Great Alpine Road and Ouninpohja are test tracks now); the frozen `tests/hotham.test.js` fails one check (the police chase, seed 11) until the user allows its seed to be changed.

## 1. What is wrong, what changes

- **Now** (`stepDebris`, js/core.js:3462-3487): a piece is thrown at 0.7 × its car's velocity + 2–5 m/s outward + 2.5–5 m/s up (7180-7182) and after that loses speed only in the steps it is on the ground, 6.5 m/s² on every surface (3480), nothing in the air; it is "in the air" in every step its middle is above the road (3475-3478), so where the road falls away it brakes in few steps. Flat tarmac, bonnet off a car at 200 km/h: 176 m, 7.4 s. Round Spa: 247 m and 12 s on average, 39 of 352 throws still moving after 30 s. And the car runs into the part it has just shed (thrown slower than the car goes) step after step, up to 6 % of its speed a step (3524).
- **After**: the bonnet 30 m / 2.2 s, a front wheel 56 m / 3.2 s (it rolls on, turns aside, falls), grass and gravel sooner; round Spa 35 m / 2.3 s on average, the worst 61 m / 3.5 s, none moving after 30 s. The car is not touched by the part it shed for 2 s, by a part it knocked for 2 s (one knock a pass).
- **The change**: `js/core.js` only, in the pieces' own code: a new `const DEB`, a new `stepDebris` in place of the old, one line and one tail in `debrisHit`, four keys in the piece's literal, one name in Core's export. Nothing in `js/render.js`, `js/game.js`, `js/net.js`; no format changes. Plus: the new test, the new tool, one line in three places of the measuring tools, two places of `tests/redflag.test.js`, the references of the runs in which parts come off (§10).
- A car that sheds no part and meets none is untouched: of the 154 reference runs on real tracks the 60 in which no part is shed keep their digest to the last digit, and the 94 that change are exactly the 94 whose reference has `cover.loose` > 0 (`cd $Z && GAME_ROOT=$D/kopija node tests/golden.test.js` → `$D/out/golden-kopija.out`).

## 2. The model

The throw stays as it is (7176-7186: the same five draws). `stepDebris(d, T, dt)` keeps its name, arguments and its one call (7342). One step, in this order (62 lines of code, `STEP` in `$D/model-src.js`):

1. `d.byT` (§6) runs down, for a piece at rest too. A piece at rest: return (as before).
2. Gravity (`JUMP_G`, 14 m/s²), the move, `T.query`, the barrier and the end walls: **the old lines unchanged** (3464-3466, 3468-3474: pushed back out, 1.4 × its speed into the wall taken off, so it comes back at 0.4).
3. **The air**, for a piece in flight and for a panel going end over end on the road (faster than `vT`): `v ← v / (1 + k·v·dt)`, the exact step of dv/dt = −k·v² (no overshoot); `k = clamp(kA·r²/m, kLo, kHi)`, a wheel `kW`.
4. **On the ground**, with `sf = T.surface(d.q)`: the deceleration `a = aRoll[sf]` for a wheel on its tread, else `(tumbling ? muT : wheel ? muR : muS)·sM[sf]·g + sK[sf]·v²`. Its spin about the vertical is braked by 4/3·a/r (a disc on the road), `wx = wz = 0`. A panel faster than `vT` goes **end over end forward** along its travel (about whichever of its two flat axes lies more across it, at `spin`·v / (`edge`·r)); slower it settles flat (`relaxAng`, as before) and scrapes.
5. **A wheel** (`d.wh` −1 / 1: the side of the car it came off) is on its tread from its first landing (`d.roll = 1`): on the ground its travel turns towards its own side at `veer` / max(v, 2) rad/s (speed kept); `rx` advances by (its speed across its axle) / r (rolling without slip), `yaw` brings the axle square to the travel (6 /s), `rz` goes to upright less a lean (8 /s) of `lean0 + lean1·clamp((vRoll − v) / (vRoll − vFall), 0, 1)`. On the ground under `vFall`: `d.roll = 2`, it falls over, lies flat, scrubs (`muR`). A car's knock: `d.roll = 0` until it lands again.
6. **The height** of its middle over the road at its tilt: `gy = T.yAt(d.q) + 0.02 + h/2·|uy| + re·sqrt(1 − uy²)`, `uy = cos rx · cos rz`, `re = r` for a wheel, `edge`·r for a panel (lying flat: h/2 + 0.02 as before).
7. **On the ground it stays on the ground**: `d.y = gy; d.vy = 0` (down a slope too; only a car's knock lifts it, 3523). This is what ends the "ice". At rest when v < 0.05 m/s, `wy` = 0, not rolling and flat (|uy| > 0.9998).
8. **A landing** (at or under `gy`, falling at `vn`): the bounce `up = vn > vB ? vn·(wheel ? wE : e)·sE[sf] : 0`; a wheel faster than `vRoll` goes up again at least `min(wHop·v, wHopMax, vn)·sE[sf]` (it bounds on). Along the road the blow takes `min(muT·sM[sf]·(vn + up), (1 − keep·sE[sf])·v)` (Coulomb: a piece that hops loses muT·g on average whatever its bounce). `up > 0`: `vy = up`, `wx`, `wz` × 0.6 (as before); else it is on the ground.

**The ground under it**: `T.surface(q)` (js/core.js:1524), the cars' own lookup, on the `d.q` the piece already gets from `T.query` each step: code 0 asphalt, 1 kerb, 2 grass, 3 gravel, 4 paving, 5 makadam, 6 puddle, 7 cobbles, 8 cobbles wet (`CSSURF`, 1989-1999). `DEB`'s four lists are indexed by it; it is asked only on the ground and at a landing. Nothing new is stored on the track or the piece. Checked in a real `Race` on Spa (`GAME_ROOT=$D/kopija node $D/rob.js`): the bonnet at 120 km/h 20.4 m / 1.92 s on the asphalt, 17.2 / 1.48 on the verge's grass, 16.8 / 1.04 in a gravel bed.

## 3. The constants: `const DEB`, right above `stepDebris` (`DEB_RUN`, 3492, stays where and as it is)

g = `JUMP_G` = 14 m/s², so muS·g = 7.7, muT·g = 12.6, muR·g = 11.2 m/s² (before: 6.5 on the ground only).

| name | value | unit | what |
|---|---|---|---|
| `own` | 2 | s | a piece does not touch the car it came off (§6) |
| `again` | 2 | s | ... nor the car that has just knocked it (one knock a pass) |
| `kA` | 0.72 | – | the air: k = kA·r²/m (a tumbling sheet shows half its face on average) |
| `kLo`, `kHi` | 0.01, 0.06 | 1/m | k's limits (lamp 0.010, door and mirror 0.029, bonnet 0.032, fender 0.044, front bumper 0.056, wing 0.06) |
| `kW` | 0.007 | 1/m | a wheel's k |
| `e` | 0.28 | – | a panel's bounce (as before, 3477) |
| `vB` | 2.5 | m/s | no bounce under this fall (as before) |
| `muT` | 0.9 | – | the friction of a landing's blow and of a panel going end over end |
| `keep` | 0.3 | – | a landing leaves at least this much of the speed along the road (× sE) |
| `vT` | 7 | m/s | faster: a panel on the ground goes end over end; slower: it lies flat and scrapes |
| `muS` | 0.55 | – | scraping flat (sheet metal or plastic on tarmac; one number: their real ranges overlap) |
| `spin` | 0.4 | – | a tumbling panel is drawn turning with its edge at spin × its speed |
| `edge` | 0.8 | – | a panel's edge: edge × r (its height standing on it, the radius it turns about) |
| `wE` | 0.5 | – | a wheel's bounce |
| `wHop`, `wHopMax` | 0.12, 3.5 | –, m/s | a wheel too fast to roll goes up again at wHop × its speed, wHopMax at most, never more than it fell |
| `vRoll` | 8 | m/s | under it a wheel rolls (no more hops) and starts to lean |
| `vFall` | 2.5 | m/s | under it the rolling wheel falls over |
| `veer` | 4 | m/s² | the rolling wheel's sideways pull to its own side (turn rate veer / speed) |
| `lean0`, `lean1` | 0.06, 0.4 | rad | its lean at vRoll and over; what it gains down to vFall |
| `muR` | 0.8 | – | a wheel on its side (rubber) |
| `sM[sf]` | 1, 1, 1.35, 1.8, 1, 1.15, 1.15, 1, 1 | – | × every friction (landing, tumbling, scraping, a wheel on its side) |
| `sK[sf]` | 0, 0, 0.02, 0.08, 0, 0.01, 0.01, 0, 0 | 1/m | ploughing: sK·v² more on the ground (grass, gravel) |
| `sE[sf]` | 1, 1, 0.4, 0.15, 1, 0.7, 0.7, 1, 1 | – | × every bounce and × keep (a thud into grass, a gravel bed) |
| `aRoll[sf]` | 5, 5, 7, 14, 5, 6, 6, 5, 5 | m/s² | a rolling wheel's deceleration (far over a real wheel's rolling drag, which would carry it half a kilometre) |

## 4. The exact change in `js/core.js` (and three lines in the tools)

`patch $B/js/core.js < $D/out/core-deli-wt.patch` (tried on a scratch copy: the result is byte for byte `$D/kopija-deli/js/core.js`), or by hand from `$D/model-src.js`:

| # | where | what |
|---|---|---|
| 1 | 3462-3487, `function stepDebris` whole | replaced by `STEP` (model-src.js 12-106): the comment block, `const DEB`, the function. `relaxAng`, `endPen`, `_en`, `_wn` (3452-3461) stay |
| 2 | after 3501 (the reach test of `debrisHit`) | new line `HIT_A`: `if (d.byT > 0 && d.by === c) return;` (+ its comment), before `const gone` |
| 3 | 3523, after `d.rest = false; d.ground = false;` | `HIT_B`: ` d.roll = 0; d.by = c; d.byT = DEB.again;` |
| 4 | 7183, `Race.spawnDebris` | `dead: false };` → `dead: false, wh: P.wh != null ? (P.lz < 0 ? -1 : 1) : 0, roll: 0, by: c, byT: DEB.own };` |
| 5 | 8655, Core's `return { ... }` | `careerWear, detachPart, KT` → `careerWear, detachPart, DEB, KT` (the test reads `C.DEB.edge`, the tool prints the numbers and tries others) |

Tools that make a piece with the measured car as the donor and lay it ahead as *another* car's part: right after the piece is fetched add `d.by = null; d.byT = 0;`: `tools/trki/predmeti.js:213` and `:414`, `tools/trki/preverjanje/ostalo/del.js:14` (else the tool's car is exempt and measures nothing; `$D/orodje.js` is predmeti.js with the first two, run in §6; del.js not run).

**What stays**: the 40-piece cap (7185); `DEB_RUN` and the lying pass with `d.on` (3492, 3503-3516); what a knock gives and takes (3517-3526: kick min(24, 1.35·vrel), the car −min(6 %, 0.4 %·m) and its twitch); the walls; the header (3451); `Race._step` (7339-7344: throw, step, contact; the patrol cars' own random numbers; no contact for `c.net` and for a far car's skipped step); `GLASS`. The pieces' part in the references' state lines stays as it is made (`tests/lib/sim.js:100-107`: every plain field of every piece): each line gains `byT`, `roll`, `wh`; `by` (a car) is not hashed. A piece made by hand (`tests/debris.test.js:23`: no `wh`, `roll`, `byT`) is a panel nobody is exempt from.

## 5. The random numbers

Rule: **the pieces take from the race's stream exactly what they took**: five draws a throw (7180-7182), three a knock (3523, 3525), none in `stepDebris` (the wheel's side is its part's `lz`, its wobble its speed), and an exempt contact returns before any draw or any change of state. So pieces that touch no car leave every car's numbers alone (test 14; the 60 unchanged references of §1). `tests/lib/sim.js` `stepRace` seeds `Math.random` anew each step, so a knock that no longer happens shifts nothing beyond its own step.

## 6. Deviation 2 (plan row 2, `docs/trki-realizem.md:749`): the smallest change, for every collision version

What: a **time rule**, the two lines of §4 (#2, #3) and two fields: `d.by` (a car) and `d.byT` (s, run down in `stepDebris`). A piece does not touch the car it has just left: the car that shed it for `DEB.own`, the car that knocked it for `DEB.again`. Every other car meets it as before, and what a touch takes is unchanged. `stepDebris` and `debrisHit` know no collision version (no `KC`/`KR`/`TX` in 3462-3531): test 17 runs cv 1–6, the same result in each.

Why (all `sokol`; PREJ `GAME_ROOT=$Z`, POTEM `GAME_ROOT=$D/kopija` before each command; `deli.js` also `DELI_HARNESS=$Z`):
- Its own part, Spa's longest straight, 105 rows (`node $D/deli.js --del svoj`): touched within the first second 54 rows → 0; the most speed lost after 1 s 42.5 % → 0.000 %, after 8 s 70.8 % → 0.52 % (one lying pass).
- Into the barrier, no input after (`node $D/ograja.js`), km/h 0.15 / 0.5 / 1 / 2 s after the hit: 30° at 200 (4 parts; touched by them in 12 steps → 0) 111 / 91 / 80 / 60 → 138 / 121 / 107 / 82: its own pieces took 27 km/h in 0.15 s, the plan's "27–33"; 45° at 200 (13 parts, 95 steps → 0) 84 / 63 / 14 / 0 → 95 / 75 / 55 / 31; 15° at 200: 131 → 148 at 0.15 s; 30° at 120: 61 → 67 at 0.5 s. After: with and without pieces the same in every row.
- Seeded crash races, five of them (`node $D/orodje.js --del dirka`): steps the player is touched by pieces 71 / 71 / 28 / 58 / 5 → 1 / 0 / 18 / 5 / 0, km/h lost in them 118 / 126 / 51 / 145 / 4 → 1 / 0 / 29 / 8 / 0.
- Another car's part (`node $D/orodje.js --del razbitine`, `$D/razb-sum.js`; 126 rows): steps with a touch 1.79 / 2.07 / 2.36 at 60 / 120 / 200 km/h → 1.00; mean loss 4.35 / 5.14 / 5.97 % → 3.09 %; no row loses more than today. One knock: bonnet 5.64 %, front bumper 2.84 %, boot lid 4.44 % at 120 km/h (`node $D/knock-probe.js`).
- **2 s, not the plan's ~0.5 s**: with `own` 0.5 the car still meets its part in 22 rows within the first second (14.6 %); 1: none in the first second but 3.3 % later; 1.5: 2.9 %; 2 and 3: 0.52 %. With `again` 0.5 a part now stopping sooner ahead of the car is hit again: 26 of 126 rows lose more than today; 1: 7 rows; 2: none (`node $D/lib.js --copy <name> --deb own=1`, then the same tools).
- A timer, not "until they have parted": one number, no state per pair, the same in a replayed step order, and it also covers the piece that stops under its car.

**Left for »Realistična«** (cv 6, its own later step): the knock as an impulse by mass ((1 + e)·m/(M + m), real kg); the piece pushed aside or under the car instead of ignored; the lying pass by energy (row 21, :768); parting instead of a timer.

## 7. The drawing: `js/render.js` needs no change

- The pose now: `d.mesh.position.set(d.x, d.y, d.z); d.mesh.rotation.set(d.rx, -d.yaw, d.rz)`, order `YXZ` (render.js:7531; 7487 kit pieces, 7520 the others); a kit piece's `lay` is shifted along the piece's own normal by which face is up (7532, 7492). A kit wheel's mesh is laid flat (Rx(−90°), 7488): `rz` = ±π/2 stands it on its tread, `rx` then turns it about its axle.
- The model writes exactly these fields. Measured on the pose as render.js composes it (`node $D/preveri.js --n 40`: 14720 throws): a rolling wheel's lowest point moves at 0.03–0.04 × the wheel's speed (0 = no slip), it leans 0.42 rad off upright at most (|uy| ≤ 0.41); a tumbling panel turns forward, its edge at 0.32 × its speed on average (in 2 % of its steps the settling of its other axis outweighs that). `gy` (§2.6) puts the middle `edge`·r up when the piece stands on its edge, so the edge is on the road; `lay`'s shift is then horizontal (≈ 0 for a wheel).
- Only render.js reads the pieces (5189; 7500-7532: `dead`, `rest`, `ground`, the pose). To look at in the pictures (§11): `edge` 0.8 is one number for every panel's outline (a bonnet may stand ~10 cm in or over the road on its edge).

## 8. The replay and the online game: no change, no format change

`js/game.js`, `js/net.js`, `js/sfx.js` never read `race.debris` (game.js reads the car's `hitDebris`, 3292, 3323); the replay and the net carry cars, pieces are local (no contact for `c.net`, 7342). A piece's fields: `id, car, part, x, z, y, vx, vz, vy, yaw, rx, rz, wx, wy, wz, r, m, h, rest, ground, q, dead` (later `on`, `mesh`) and the new `wh` (−1 / 0 / 1), `roll` (0 / 1 / 2), `byT` (s), `by` (the car, or null). `by` is a reference: nothing in `js/`, `tests/`, `tools/` serialises a piece.

## 9. The expected numbers

Flat test road, `sokol`, 40 throws a cell, the mean; **pot m / čas s at 60 · 120 · 200 km/h** (pot: from where it came off to where it lies, straight; čas: to its last step at 0.05 m/s or more along the road) (`cd $D && DELI_HARNESS=$Z GAME_ROOT=$Z node deli.js --json > out/deli-zdaj.json` (62 s), then `DELI_HARNESS=$Z GAME_ROOT=$D/kopija node deli.js --proti out/deli-zdaj.json` (34 s) → `out/deli-k2.out`, with the worst of each cell). PREJ is the same on every ground (the old step never asks for it).

| part (m; r) | PREJ | asphalt | grass | gravel |
|---|---|---|---|---|
| bonnet (14; 0.79) | 31.5/3.22 · 79.7/5.01 · 176.5/7.41 | 10.9/1.44 · 20.2/1.89 · 30.3/2.17 | 9.5/1.12 · 17.4/1.47 · 26.1/1.68 | 8.5/0.88 · 15.3/1.14 · 22.8/1.30 |
| boot lid (11; 0.69) | 13.1/2.21 · 49.6/4.01 · 130.8/6.40 | 5.5/1.00 · 15.0/1.64 · 26.6/2.07 | 5.0/0.78 · 13.2/1.28 · 23.1/1.61 | 4.9/0.70 · 11.9/0.99 · 20.6/1.26 |
| door (9; 0.60) | 23.3/2.81 · 65.3/4.55 · 154.1/6.93 | 8.7/1.25 · 18.8/1.86 · 30.1/2.19 | 7.7/0.98 · 16.2/1.44 · 25.9/1.69 | 7.1/0.78 · 14.3/1.12 · 22.6/1.31 |
| front bumper (7; 0.74) | 29.1/3.07 · 75.6/4.86 · 170.0/7.25 | 9.5/1.40 · 16.1/1.70 · 22.6/1.87 | 8.2/1.09 · 13.8/1.33 · 19.6/1.46 | 7.1/0.85 · 12.0/1.03 · 17.0/1.12 |
| rear bumper (7; 0.74) | 11.2/1.98 · 45.0/3.78 · 122.6/6.17 | 4.6/0.98 · 12.4/1.55 · 19.9/1.81 | 4.1/0.77 · 10.6/1.22 · 17.2/1.41 | 3.7/0.63 · 9.2/0.95 · 14.9/1.09 |
| fender (5; 0.55) | 28.8/3.07 · 74.9/4.85 · 169.0/7.24 | 9.6/1.34 · 17.6/1.76 · 25.6/1.98 | 8.4/1.04 · 15.3/1.38 · 22.4/1.55 | 7.6/0.82 · 13.6/1.08 · 19.9/1.21 |
| wing (3; 0.58) | 12.8/2.18 · 48.9/3.97 · 129.6/6.37 | 5.0/0.95 · 11.5/1.31 · 18.9/1.67 | 4.6/0.75 · 10.5/1.04 · 17.1/1.32 | 4.6/0.68 · 9.8/0.82 · 15.7/1.03 |
| mirror (1; 0.20) | 26.4/2.98 · 70.7/4.74 · 162.5/7.11 | 9.5/1.24 · 19.8/1.88 · 30.8/2.19 | 8.6/0.97 · 17.2/1.46 · 26.8/1.70 | 8.1/0.77 · 15.4/1.14 · 23.7/1.32 |
| head lamp (1; 0.12) | 29.4/3.09 · 76.1/4.88 · 170.9/7.28 | 13.4/1.68 · 28.4/2.31 · 49.7/2.88 | 11.3/1.29 · 22.9/1.73 · 38.3/2.06 | 9.8/1.00 · 19.1/1.30 · 30.4/1.48 |
| **front wheel** (6; 0.31) | 27.7/2.99 · 73.0/4.78 · 166.0/7.17 | 13.5/1.76 · 30.3/2.50 · 56.2/3.23 | 12.0/1.47 · 25.9/2.08 · 47.7/2.65 | 9.6/1.01 · 21.0/1.45 · 39.3/1.91 |
| rear wheel (6; 0.31) | 12.6/2.08 · 47.1/3.86 · 125.8/6.25 | 6.0/1.03 · 21.3/2.18 · 45.9/2.95 | 5.3/0.84 · 18.5/1.81 · 39.1/2.45 | 4.8/0.66 · 14.8/1.24 · 32.0/1.75 |

- Tarmac against PREJ: the bonnet −65 / −75 / −83 % of the way, −55 / −62 / −71 % of the time; the front wheel −51 / −59 / −66 %, −41 / −48 / −55 %. The front wheel is on its tread 1.0 / 1.8 / 2.5 s and lies flat and still (`d.rest`) after 2.1 / 2.8 / 3.5 s.
- Real tracks, all round the lap, bonnet + front bumper + wheel + mirror, mean (worst) pot m / čas s, still moving after 30 s: Spa 60 / 120 / 200 km/h PREJ 69 (447) / 6.5, 159 (654) / 10.1, 247 (735) / 12.1; 7, 27, 39 of 352 → POTEM 11.0 (17.3) / 1.46 (2.18), 21.7 (34.6) / 1.95 (2.86), 34.8 (60.7) / 2.28 (3.52); 0. Bathurst PREJ 87 (446) / 8.6, 200 (671) / 11.8, 312 (778) / 13.1; 20, 40, 49 of 312 → 11.2 (17.2) / 1.47, 21.7 (34.8) / 1.94, 34.9 (62.4) / 2.31 (3.76); 0. No piece more than 1 cm past a barrier's line (as before), none under the road.
- Cost (`node $D/cas.js 100`, wall clock): a step of a moving piece 180 → 216 ns, steps to rest 559 → 230, a piece's whole run 100 → 50 µs.

## 10. The tests

**The new test `tests/odpadli-deli.test.js`** = `$D/odpadli-deli.test.js` as it is (204 lines). Core only, the repository's style (`check(name, ok, detail)`, `OK  ` / `FAIL` lines, `N/N checks passed`); `sokol`, seed 20261110, 12 throws a cell, 21 s. In `tests/` it finds `./lib` itself (`DELI_HARNESS` is only for running it from `$D`). After the change 17/17 (`cd $D && DELI_HARNESS=$B GAME_ROOT=$D/kopija-deli node odpadli-deli.test.js` → `out/test-k2-deli.out`), before it 6/17 (`DELI_HARNESS=$Z GAME_ROOT=$Z` → `out/test-zdaj.out`). Its table `PREJ` is the old model's own result: the same test on `$Z` with `--prej` prints it (`out/prej.txt`). The checks: the bound (what was measured):

1. Every part at 60 / 120 / 200 km/h on tarmac: the way ≤ 0.6 × PREJ, the time ≤ 0.7 × PREJ (the worst 0.49, 0.59).
2. Every piece at rest within 5 s and 70 m, lying flat (3.64 s, 59.4 m; 1188 throws).
3. Grass: the time ≤ 0.85 × tarmac's; gravel: ≤ 0.92 × grass's; the way never more than 2 % over (33 of 33 cells).
4. The front wheel goes further than the furthest of bonnet, front bumper and fender: ≥ 1.1 × at 60, ≥ 1.4 × at 120 and 200 km/h (1.24, 1.50, 1.86).
5. A wheel is on its tread for over 1 s at 120 km/h (1.55 s), its lowest point slower than 0.15 × its speed (0.03), upright (|uy| < 0.5: 0.41), then `roll` 2 and flat; no panel ever has `roll`.
6. A panel faster than `vT` on the ground turns forward along its travel, its edge at over 0.1 × its speed (0.31; 551 throws).
7. No piece gains: no step with more speed along the road, no bounce faster up than its fall, no top higher than the one before (but r − h/2: a sheet rising onto its edge).
8. Never under the road: its middle never under its height at its tilt (§2.6).
9. No chance: the same throws again end in the same state lines.
10. Thrown across the road (60° at 120, 72° at 200 km/h): 48 of 48 reach a barrier, none more than 1 cm past its line, none faster off it, all come to rest.
11. Spa, a spot every 250 samples, 120 and 200 km/h, bonnet and wheel: 112 throws at rest within 30 s, inside the barriers, not under the road (before: 8 still moving).
12. The cap: of 45 thrown the first five are `dead`.
13. **A race in which no part comes off is the reference's to the last digit**: `SIM.runScenario(C, 'spa', 'race', 'cs')` gives `tests/golden/sim.json['spa/race/cs'].digest` (40a61d84b69ac78f7b9949e6), parts shed 0. This is how I read "identical with the old model's constants": the old model's recorded result.
14. Twelve pieces thrown half a lap from six cars on Spa, 10 s: every car's state line the same as without them.
15. Its own part, 144 runs (6 sets of parts × 20 / 60 / 120 / 200 km/h × coasting / throttle / brake × flat road and Spa): no touch in the first second, the speed after 1 s the control's (before: touched in 84 runs).
16. Another car's part (bonnet, front bumper, boot lid off a car 12 m ahead, 120 km/h, 5 s): exactly one touch each, the loss ≤ min(6 %, 0.4 % a kg) + 0.2 % (5.64, 2.84, 4.44 %; before: two touches each).
17. Every collision version (`C.setTest({ cv })`, 1–6): its own part 0 touches, another's 1, the pieces end the same in all six.

**Where it is listed**: `tests/run.js:27` (`SUITES.node`): `'odpadli-deli.test.js'` right after `'debris.test.js'`; a new row after `tests/run.js:99`: `[/^js\/core\.js$/, ['debris.test.js', 'odpadli-deli.test.js']],   // (the parts on the road: how a shed part stops, what it costs the car that meets it)`; `tests/shards.test.js:72` (the list expected for `js/core.js`, in the suite's order): `'debris.test.js', 'odpadli-deli.test.js'` between `'rivals-n.test.js'` and `'quick.test.js'`; `tests/README.md`, a row after 191: »`odpadli-deli.test.js` | Odpadli deli se ustavijo (brez brskalnika): vsak del pri 60/120/200 km/h obleži bližje in prej kot pred spremembo, na travi in pesku še prej; kolo se kotali dlje od pločevine, zavije in pade; noben del ne pridobi hitrosti, ne pade pod cesto, ograje ga zadržijo; isti met dvakrat enak; dirka brez odpadlih delov je do zadnje števke referenčna; avta lasten del prvo sekundo ne zadene, tuj del enkrat; enako v vseh različicah trkov.«

**Existing tests, run on the copy** (`cd $B && GAME_ROOT=$D/kopija-deli node tests/<name>`; `$D/out/<name>-kopija-deli.out`): no expectation moves in `debris` 10/10, `crossover` 10, `fleet` 285, `trki` 19, `padec` 14, `repro` 5/5, `nova` 33. The reference races: below.

**`tests/redflag.test.js` moves: 10/21 on the copy, all of its scenario 1** (Bathurst: at 60 s two cars next to each other are wrecked at 162 and 155 km/h and retired; the red flag is due within 15 s). Before, each wreck ran into its own parts (57 and 54 steps) and stood 80 and 100 m on, 16 m apart: the red flag after 10.4 s. Now nothing holds them: they roll on to their run-offs, 183 and 94 m on, 140 m apart, over `RED.near` (100 m): the safety car only (`D3_TREE=$B GAME_ROOT=<tree> node $D/rdeca.js bathurst 60`). The same pile-up at nine moments (45 … 90 s): the red flag within 15 s in 9 of 9 before; after in 5 of 9 (45, 55, 75, 80, 90 s), once after 24 s, three times not (the wrecks 104–186 m apart; `$D/out/rdeca-scan-prej.out`, `rdeca-scan.out`). The rule (7603-7608) is not the pieces' and stays as it is; the scenario was tuned to wrecks pinned by their own parts and is tuned again, two places of the test (tried as `$D/redflag-fix.test.js`, `AT1=75`):
- line 100: `at: 60` → `at: 75` (wrecked at 140 and 148 km/h, they stand 7 m apart, the red flag after 10.1 s);
- lines 68-69, the restart's gaps taken along the queue as it stands (at 75 s the car a lap down stands in it between two others, which the check read as one gap of 12.5 m; bound 12): `const at = (c) => c.dist + (c === S.lapped ? L : 0), Q = r.cars.filter(c => !c.finished && !(c.wreck && c.wreck.dnf)).sort((a, b) => at(b) - at(a)), g = [];   // (every car in the queue as it stands in it: the car a lap down in its place, a lap on)` and `for (let i = 1; i < Q.length; i++) g.push(at(Q[i - 1]) - at(Q[i]));`

With both: **21/21 after the change** (`cd $D && AT1=75 DELI_HARNESS=$B GAME_ROOT=$D/kopija-deli node redflag-fix.test.js` → `out/redflag-fix-at75-kopija-deli.out`; the restart's gaps 5.5–8.3 m) **and 21/21 on the unchanged `$B`** (`GAME_ROOT=$B`; `out/redflag-fix-at75-deli-wt.out`), so the test's edit is right before and after. Neither alone: `at: 75` or `80` without lines 68-69: 20/21 (that gap check: 12.5, 12.4 m); lines 68-69 at 60 s do not bring the red flag back (on the unchanged `$B` they change nothing: `AT1=60`, 21/21). Tried and dropped: the pile-up's cars stopped where they are wrecked (`STOJ=1`, line 27): 21/21 after, but 20/21 on the unchanged `$B` (the lightly damaged pair of the test's line 157 is then run into: a red flag); `RED.near` 200: 20/21 (`out/redflag-*.out`).

**Not run**: the rest of the Node suite and every browser test. The ones that wreck cars or shed parts: Node `wheels`, `pitswing`, `kolibri-tyres`, `flags`, `field`, `aipits`, `livorno`, `lod`, `m40`, `m45`, `neskoncna`, `rivals-n`, `strategy`, `voznja`; browser `crash` (its piece is `rest || ground` after 240 steps: holds by check 2), `fleet`, `camshake`, `cars-ui`, `fire`, `memory`, `carcull`, `repair`, `sound`.

**The references** (regenerate on `$B` after the change; `--only=a,b` takes the keys with every word, the others keep their entry: golden.test.js:25, races.test.js:57):
- `tests/golden/sim.json`: 94 of the 154 real-track keys: every `…/crash/cs`, `…/formula/cs`, `…/lm/cs`, `…/car/cs` (22 tracks × 4), `medvode/race/cs`, `balea/race/cs`, `suzuka/demo/cs`, `pikesg/demo/cs`, `harju/demo/cs`, `cpalace/demo/cs`: `node tests/golden.test.js --update --only=crash`, then `--only=formula`, `--only=lm`, `--only=car`, `--only=medvode,race`, `--only=balea,race`, `--only=suzuka,demo`, `--only=pikesg,demo`, `--only=harju,demo`, `--only=cpalace,demo`. Every crash run still crashes (the test's own cover: the weakest unchanged, rastro/car damage 0.23 against the limit 0.2; the same damage and loose parts in 47 of 88; `$D/out/golden-cover.txt`). Any other key that moves is a finding.
- `tests/golden/races.json`: the 17 of 110 races in which a part is shed (D1's count on the pristine tree, `$S/deli/d1/races-sum.txt`): `pikesg/cs/lm`, `tianmen/cs/formula|lm|car`, `iroha/cs/formula`, `cpalace/cs`, `medvode/cs` and its `rain|formula|lm|car`, `livorno/cs` and its `rain|formula|lm|car`, `balea/cs/rain`: `node tests/races.test.js --update --only=<track>` for pikesg, tianmen, iroha, cpalace, medvode, livorno, balea. On `$B` + the change (`cd $B && GAME_ROOT=$D/kopija-deli node tests/races.test.js --only=<track>` → `$D/out/races-*-kopija-deli.out`) these seven tracks and Spa, 40 races: exactly these 17 change (every car still finishes), the other 23 are OK; the 70 races of the other 14 tracks shed no part (no piece: none of the changed code runs) and were not run.
- The run of all 154 was made on `$Z` + the change (§1). On `$B` + the change the three kinds without a crash, 66 runs (`cd $B && GAME_ROOT=$D/kopija-deli node tests/golden.test.js --only=upg`, `=race`, `=demo` → `$D/out/golden-kopija-deli-*.out`): 60 OK, changed exactly the six named above. (`$B`'s core differs from `$Z`'s from line 6354 on; the references are the same files.)
- Then `npm run test:related` and `node tools/stamp.js --check`.

## 11. The tool and the pictures

`tools/trki/odpadli.js` = `$D/deli.js` as it is (142 lines). Measuring only: it steps the game's own `Race`; in `tools/trki/` it finds the tree's `tests/lib` itself, `GAME_ROOT=<tree>` picks the game; its output is Slovenian.
- `node tools/trki/odpadli.js`: this tree's `DEB` and three tables (34 s): `ravnina` (§9's table: every part × 60 / 120 / 200 km/h × asfalt / trava / pesek), `proga` (Spa and Bathurst all round), `svoj` (the car and its own part).
- Before and after: `GAME_ROOT=<the tree before> node tools/trki/odpadli.js --json > zdaj.json`, then `node tools/trki/odpadli.js --proti zdaj.json`: PREJ beside the new columns and the change in %.
- `--del ravnina|proga|svoj`, `--avto <id>`, `--deli hood,wheelFL,…`, `--n <≤ 40>`, `--cv <n>`, `--deb muS=0.7,own=1,aRoll.0=3.5` (other numbers for one run, through `Core.DEB`; on a tree before the change it says so).
- `docs/kazalo.md:101`: add `odpadli.js` to the row of `tools/trki/` (»odpadli deli: pot in čas do mirovanja po podlagah, lasten del; `--proti` prej/potem«).

**The pictures** (not made here: they need a browser): `node tools/trki/slike.mjs zid30 --a-root $Z --b-root $B --a-cv 1 --b-cv 1 --casi 0.3,1,2,3.5`, the same with `celni`; the one camera, behind the car. Side B (after): at 0.3 s the panels are in the air or going end over end beside and behind the car, none carried along on its nose; at 1 s they are behind it; at 2 s every panel lies flat, 10–35 m from where it came off; a wheel stands on its tread, runs on to its own side and lies flat by 3.5 s, 30–55 m on; nothing sunk into the road or hanging over it; nothing still sliding at 3.5 s. Side A (before): the same pieces slide on beside or ahead of the car for 5–7 s and 100 m or more, the car slowed among them. To judge by eye: a part passing through its own car in its first half second, and a bonnet standing on its edge (§13).

## 12. The docs

- `docs/trki-realizem.md`: row 2 (749), a note in its last cell: »Narejeno 10. 11. 2026 za vse različice: del se 2 s ne dotakne avta, od katerega je odpadel ali ki ga je odbil (`DEB.own`, `DEB.again`); sunek po masi in odrivanje vstran ostaneta za »Realistično««; the table of the code (48): `DEB` beside `DEB_RUN`; under table E (493) the new table of `node tools/trki/odpadli.js --proti` (its numbers there are PREJ).
- `docs/igra.md:819`, after »Del, ki leži na cesti, avto povozi …«: »Del, ki odleti, se hitro ustavi: pločevina in plastika se nekajkrat prevrneta in po 10–30 m obležita, kolo se kotali dlje, zavije in pade; na travi in v pesku se vse ustavi še prej. Avta, od katerega je del odpadel, se ta prvi dve sekundi ne dotakne.«
- `tests/README.md` and `docs/kazalo.md` as above.

## 13. Risks, and what I decided against

- **A wreck is no longer held by its own parts**: it rolls on to its run-off (`retireControl`, 6096), so crash runs end elsewhere (the 94 references) and two cars wrecked at racing speed may stop more than `RED.near` (100 m) apart: the red flag after such a pile-up is less certain (§10: 9 of 9 → 5 of 9). The lead decides whether that rule should look at where the cars were wrecked.
- For 2 s a part is drawn through its own car as the car passes over it (before: pushed along on its nose). `edge` 0.8 is one number for every outline: on its edge a bonnet may stand ~10 cm into or over the road. Both are for the pictures.
- A piece on the ground follows the road: no flight off a crest, no feel for a slope (it stops on a hill as on the flat).
- When `own` runs out with the car still over its lying part and moving: one lying pass (≤ 2.5 %, a thump); 0.52 % at worst in 105 rows.
- A piece pushed off the list of 40 while it still tumbles is left drawn at its tilt (Razbijanje's `xGround`, render.js:7529); pieces now rest within 3.7 s, so rarer than a piece left mid-slide before.
- The rain does not change the pieces' ground (only the puddle's and the wet cobbles' own rows). `aRoll` 5 m/s² and `muT` 0.9 are the game's choice for "quickly", not measured physics.
- **Decided against**: changing the throw (0.7 × the car's speed: it moves where a part lands by its car and the five draws' meaning; the stop is the drag's job); friction by material (the parts' table has none: classes differ by r, m, h and `wh`); new random draws or a stream of the pieces' own; "until they have parted" or a list per car in place of the timer; the impulse by mass now (»Realistična«); any change of `js/render.js` or of a format; `RED.near` 100 → 200 to keep the red flag test (a rule of the game; and 20/21: `$D/out/redflag-near200.out`); the old model kept behind a version switch (the user asked for every version).
