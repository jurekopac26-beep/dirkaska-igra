# Handoff: pit lane (boksi) work, state on 27 Oct 2026

Read this first, then `CLAUDE.md`. Everything here comes from a long earlier session on another account. Its local scratchpad is gone; what survived is in this folder, on the branches listed below, and on the user's artifact pages.

## How the user wants to work
- Speak **Slovenian** to the user. Be short.
- **No code until the user writes »začni«.** Until then: answers, plans and images only.
- **Every question for the user goes in images**: a page (artifact) with mock-ups from the real game, each option labelled, your recommendation marked. Use Bathurst, Avstralija, phone portrait 390×844 at deviceScaleFactor 2, quality high. The game must be **running, not paused**, when you capture; in pause the HUD's right column isn't laid out. Finish CSS animations before the screenshot. Never use test tracks (`test: true`).
- **10B, save tokens; time does not matter.** Work sequentially, one group at a time, not in parallel:
  - one build agent per group
  - a lighter model for routine steps (merging main, running tests, regenerating references, screenshots)
  - one review per group that reads only the diff; a second review only for physics or simulation
  - read only failures and summaries from logs
  - images only for visible changes, one before/after on Bathurst per proposal
  - stamp and merge main once at the end of a group
- **8B: 5 groups, one PR each**, in the order below. Open a PR only when the user asks. Squash merges. Merge main into branches; never rebase or force-push. Never weaken or skip tests. CI takes ~1 h per run.
- The game speaks **only English**: voice and radio (47a). The UI is Slovenian, with English in `js/lang.js`.
- **Mechanics: do NOT change how the mechanics look** (3B). They may be replaced by different characters later.

## Already on main
#140 (track rules), #143 (no sparks or dust on the pit entry), #144 (better mechanics), #145 (film camera in the pits, hand-back ~1 s before the circuit).

## Branches with unfinished work (pushed from the old session; based on old main, so merge `origin/main` into each first)
| Branch | Commit | Contains |
|---|---|---|
| claude/boksi-zvok | 8bdaeb5 | 8 pit sounds, 24 many vibrations, 24b three vibration levels (Izklop/Osnovno/Vse). Done, needs verify |
| claude/boksi-posnetek | e324701 (WIP on e6a9a33) | 10 pit stop in the race replay. The last commit is uncommitted WIP from the pause: check it |
| claude/boksi-izbira | f736a9a | 2 »Postanek po meri« (custom stop), 18 approximate radio forecast + new weather »Menljivo«, 47 engineer voice (English). Older HUD: adapt to the new HUD (#150) |
| claude/boksi-gume | 8d40bb2 | 27 worn tyres (grip cliff, then burst), 26 rival strategies in long races only |
| claude/boksi-obvestila | c5b985a | 11 BOKSI TA KROG, 6 rivals pit, 14 places gained/lost, 46 BOJ ZA MESTO, 16 perfect exit, 29 first-stop hints. Adapt to the new HUD |
| claude/boksi-noc-dez | 7d1c086 | 35 lit pits at night, 36 rain in the pits (also contains #144's mechanics commits) |
| claude/boksi-ekipa | 40bc694 | 19 crew in your car's colour, 34 crew waits ready |
| claude/boksi-gume-pavza | e0e3c6d | 70 tyre sidewall colour by compound |
| claude/boksi-proga-opozorila | 1f99202 | 83 rubber marbles beside the racing line |
| claude/boksi-prikljucek-b | 2669364 (WIP on 57467e6) | Pit-lane junction »B«: decel/accel lanes with hatching on all 13 pit tracks, fences removed from the road at the pit entry and exit. Unfinished: tests fail on troisrivieres and cpalace |

## The plan after »začni«: 5 groups, in this order (hours = agent work)
1. **Camera with the menu, sound, replay, buttons** (12–17 h): the new pit camera (below), 101 driving buttons fade, 2B exit camera stays in the lane, 8, 24, 24b, 10.
2. **Custom stop and notices** (10–14 h): 2, 3a, 18, 47, 68 (rain slows the stop by 0.3–0.6 s), 91 (pause forecast, below), 11, 6, 14, 46, 16, 29, 100 (warning: rival leaving the pits ahead of you).
3. **Tyres and track** (10–15 h): 27, 26, 82 (wear per tyre), 70, 78 (all drivers' stops in the pause), 83. **84 is saved for later**, see below.
4. **Pit look** (10–15 h): 95C (upright flag in team colour by the garage door with the driver's initials), 35, 36, 19, 34, 44 (garage door opens), 48 (tyre marks in front of the garage), 72 (stack of used tyres), 87 (dirty car only; the visor wipe comes later).
5. **Pit entry and exit** (11–17 h): junction B, 5 (light at the pit exit), 76 (blue flag at the exit).

### The new pit camera (decided, mock-up numbers from Bathurst portrait)
- Chase as always until the takeover at the pit entry.
- The »Postanek po meri« panel opens and the camera pulls back ever more slowly: the same angle at 1.75× the distance, critically damped with τ ≈ 1.1 s (half the way in ~1.9 s, 90 % in ~4.3 s). The car stays at the same screen spot, only smaller.
- On **POTRDI**: a cinematic swing of ~2 s (smootherstep) round to the side of the car on the pit-wall side. It then tracks the car from the side: ~8 m ahead, towards the wall as far as the wall minus 1.2 m allows, 2.8 m up. If POTRDI is never pressed, the defaults apply at the box and the side view begins there.
- At the box: parallel to the car, 9.6 m out and 3 m up, nearly still (≤3 cm/s drift).
- **Exit:** it starts like #145 (low beside the car, inside the lane, at least 1.2 m from the wall: 2B). It then **rises slowly and continuously, never down**, while moving behind the car, and arrives at the chase position exactly at »VOZIŠ TI!« (height 3 → 54 m over ~13 s on Bathurst; see `exit-log.json`).
- **101 driving buttons** (ZAVORA, PLIN, arrows) fade out over ~1 s at the takeover and fade back in from ~2 s to ~0.5 s before »VOZIŠ TI!« (9B). The pause button stays.
- `proto-kamera.patch` (on a6ea71b) is an earlier prototype: chase in the lane, the side view at the box, the #145 exit. Use it as a starting point. The menu pull-back, the POTRDI swing and the rising exit still have to be written.

### Custom stop (2B), decided
- Defaults: soft tyres (wet tyres in the rain), fuel 100 % with 50 % and 25 % options, repair »Vse«, red POTRDI button.
- Bar 1: time to decide until the box; if nothing is confirmed, the defaults apply.
- Bar 2: time to the hand-back.

### 91 pause forecast: the user's choice is still open
Direction C4-2: a tall sky band with big icons, plus a weather animation in CSS (transform and opacity only, seamless 6 s loop, reduced-motion fallback, no moving text). Six animated versions C42-1 … C42-6 are described in `opisi.json`; I recommended C42-1. The overlay code is in `ov5.mjs`. Ask the user which one before group 2.

## Later (not now)
- **84 »Proga se zgumira«**: saved for later at the user's request. Direction B5: a glossy rubber layer, and beside it dust in the rubber's own colour, lighter, fading softly outward. Six variants B5-1 … B5-6 are in `opisi.json`, each +1 draw call; I recommended B5-3. ~3–4 h. The user asked for a reminder on 3 Nov, with an overview of all proposals and 12 new proposals (102–113). That reminder lives on the old account, so set your own if the user wants it.
- **With new mechanic characters (3B):**
  - 43a rival crews working on their cars
  - 66 new nose
  - 67 radiator cleaning
  - 74 engineers on the pit wall
  - 99 mechanics watch you pass
  - 7 mechanic's board
  - 45 refuelling
  - 17 rare mechanic error
  - 37 celebration after the finish
  - 96: the crew jumps by the wall and one stretches a board over it showing your new place, e.g. »POS 4«, not »+1«
  - 87 visor wipe
  - more detailed mechanics; an old attempt is in `proto.patch`
- **Dropped:** 9, manual driving through the pits (the computer takes over).

## Files here
- `PAVZA.md`: the old session's running notes (Slovenian).
- `opisi.json`: every mock-up variant (84, 91) with its name, description and cost.
- `proto-kamera.patch`: the camera prototype. `proto.patch`: camera plus detailed mechanics (mechanics are for later only).
- `exit-log.json`: the camera's height and distance over the exit in the mock-up.
- `ov5.mjs`: the C4-2 weather animations (91).
- `boksi-sklop-workflow.js`: the workflow script used to build a group (build, verify, review, fix). Adapt it to 10B.

## The user's pages (private to the old account; the user can share them from the Share menu)
- Choices: https://claude.ai/artifact/RG7o6rfghHayFEmBwSAv7f
- Questions and variants: https://claude.ai/artifact/TGhHeuzdvFQ3h5nbcGvRGW
- Camera storyboard: https://claude.ai/artifact/HGBPqmkp56k2x9C6kq9RsY
