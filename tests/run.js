// Runs the test suites one after another (each in its own process) and prints a summary.
//   node tests/run.js           everything
//   node tests/run.js node      only the Node tests (physics, AI, races; ~4 min)
//   node tests/run.js browser   only the browser tests (Playwright; ~75 min with software WebGL)
//   node tests/run.js fleet     only the vehicle fleet (the render kit's rules, the garage's parts, the registry, every vehicle's handling, destruction and AI; how each is drawn; the car screen; ~10 min)
//   node tests/run.js browser --shard 2/6         one share of a suite (GitHub runs the browser tests on 6 machines at once, see SECS)
//   node tests/run.js browser --shard 2/6 --list  only print which tests that share has
//   node tests/run.js --related   only the tests related to what changed against main (npm run test:related; see RELATED below)
//   node tests/run.js --related --files js/lang.js,docs/proge/spa.md --list   the same for the files given (no git)
//   node tests/run.js --koda      the fingerprint of the code under test (KODA_MD below): GitHub runs the heavy jobs once for each
//   node tests/run.js --dokumenti only the tests that read the .md files (MD_TESTS below): what GitHub runs when that code has passed
//   --quiet   only the failures (a failed test's FAIL lines and its last lines) and the summary
// A test that runs longer than TEST_TIMEOUT_MIN minutes (default 15), or than TEST_SLOW (default 4) times its usual time on GitHub (SECS)
// if that is longer, is stopped and counted as failed, so a hung test still ends with the summary (LIMIT_OF).
'use strict';
const { spawnSync } = require('child_process');
const path = require('path');

const SUITES = {
  node: ['stamp.test.js', 'testne-proge.test.js', 'spoji-main.test.js', 'razdelitev.test.js', 'menu-lens.test.js', 'menu-globe.test.js', 'menu-corner.test.js', 'shards.test.js', 'golden.test.js', 'repro.test.js', 'roll.test.js', 'corner.test.js', 'knock.test.js', 'races.test.js', 'cs-handling.test.js', 'nova.test.js', 'trki.test.js', 'padec.test.js', 'net-core.test.js', 'crossover.test.js', 'champ.test.js', 'rally.test.js', 'sovoznik.test.js', 'sovoznik-glas.test.js', 'quali.test.js', 'weather.test.js', 'compounds.test.js', 'kolibri-tyres.test.js', 'marbles.test.js', 'rubber.test.js', 'coldtyres.test.js', 'pitahead.test.js', 'pitstats.test.js', 'wear.test.js', 'strategy.test.js', 'flags.test.js', 'redflag.test.js', 'vrsic.test.js', 'pikes.test.js', 'junctions.test.js', 'ljudje-mesta.test.js', 'katu.test.js', 'traffic.test.js', 'police.test.js', 'caracoles.test.js', 'bathurst.test.js', 'chapman.test.js', 'bigsur.test.js', 'tianmen.test.js', 'serpentine.test.js', 'uncompahgre.test.js', 'sani.test.js', 'iroha.test.js', 'mulholland.test.js', 'palomar.test.js', 'beartooth.test.js', 'rastro.test.js', 'moki.test.js', 'killar.test.js', 'greatalpine.test.js', 'maunakea.test.js', 'baldy.test.js', 'cpalace.test.js', 'riverside.test.js', 'detroit.test.js', 'monterey.test.js', 'longford.test.js', 'newcastle.test.js', 'rio.test.js', 'toronto.test.js', 'medvode.test.js', 'medvode-props.test.js', 'medvode-fence.test.js', 'montreal.test.js', 'bangsaen.test.js', 'troisrivieres.test.js', 'mountbuller.test.js', 'livorno.test.js', 'zurich.test.js', 'marrakesh.test.js', 'townsville.test.js', 'hotham.test.js', 'hakone.test.js', 'lang.test.js', 'fuel.test.js', 'rivals.test.js', 'slip.test.js', 'faults.test.js', 'radio.test.js', 'forecast.test.js', 'voices.test.js', 'pits.test.js', 'aipits.test.js', 'pitswing.test.js', 'pitexit.test.js', 'boards.test.js', 'start.test.js', 'grid.test.js', 'field.test.js', 'rivals-n.test.js', 'hudsigns.test.js', 'wheels.test.js', 'debris.test.js', 'lod.test.js', 'quick.test.js', 'haptics.test.js', 'shramba.test.js', 'lestvica.test.js', 'shot.test.js', 'missions.test.js', 'm06.test.js', 'm01.test.js', 'm49.test.js', 'm47.test.js', 'm46.test.js', 'm19.test.js', 'm35.test.js', 'm37.test.js', 'm48.test.js', 'm30.test.js', 'm33.test.js', 'm53.test.js', 'm07.test.js', 'm09.test.js', 'm43.test.js', 'm51.test.js', 'm52.test.js', 'm54.test.js', 'm39.test.js', 'm50.test.js', 'm34.test.js', 'm55.test.js', 'm10.test.js', 'm02.test.js', 'm04.test.js', 'm08.test.js', 'm17.test.js', 'm26.test.js', 'm11.test.js', 'm23.test.js', 'm29.test.js', 'm40.test.js', 'm45.test.js', 'zabava.test.js', 'balea.test.js', 'voznja.test.js'],
  fleet: ['kit.test.js', 'deli.test.js', 'deli-barve.test.js', 'deli-pregled.test.js', 'fleet.test.js', 'cisterna.test.js', 'zrcalni.test.js', 'browser/fleet.test.mjs', 'browser/cisterna.test.mjs', 'browser/zrcalni.test.mjs', 'browser/kit.test.mjs', 'browser/cars-ui.test.mjs', 'browser/deli-barve.test.mjs', 'browser/maketa-delov.test.mjs'],
  browser: ['browser/garage.test.mjs', 'browser/smoke.test.mjs', 'browser/zivali.test.mjs', 'browser/zastave.test.mjs', 'browser/zaslon.test.mjs', 'browser/ljudje.test.mjs', 'browser/repro.test.mjs', 'browser/flystart.test.mjs', 'browser/startcam.test.mjs', 'browser/newver.test.mjs', 'browser/nvschool.test.mjs', 'browser/nvheli.test.mjs', 'browser/nvride.test.mjs', 'browser/nvfair.test.mjs', 'browser/nvwater.test.mjs', 'browser/app.test.mjs', 'browser/crash.test.mjs', 'browser/padec.test.mjs', 'browser/nova.test.mjs', 'browser/kolibri.test.mjs', 'browser/kolibri-hud.test.mjs', 'browser/wheels.test.mjs', 'browser/world.test.mjs', 'browser/pits.test.mjs', 'browser/pitjoin.test.mjs', 'browser/pitkit.test.mjs', 'browser/tyrebands.test.mjs', 'browser/garages.test.mjs', 'browser/crew.test.mjs', 'browser/pitstop.test.mjs', 'browser/forecast.test.mjs', 'browser/voices.test.mjs', 'browser/repair.test.mjs', 'browser/carcull.test.mjs', 'browser/champ.test.mjs', 'browser/quali.test.mjs', 'browser/weather.test.mjs', 'browser/marbles.test.mjs', 'browser/wear.test.mjs', 'browser/flags.test.mjs', 'browser/redflag.test.mjs', 'browser/career.test.mjs', 'browser/replay.test.mjs', 'browser/atmos.test.mjs', 'browser/vecer.test.mjs', 'browser/sound.test.mjs', 'browser/okolje.test.mjs', 'browser/fire.test.mjs', 'browser/gfx.test.mjs', 'browser/look.test.mjs', 'browser/look2.test.mjs', 'browser/carlow.test.mjs', 'browser/camtilt.test.mjs', 'browser/camshake.test.mjs', 'browser/pad.test.mjs', 'browser/memory.test.mjs', 'browser/perf.test.mjs', 'browser/online.test.mjs', 'browser/online4.test.mjs', 'browser/medvode-castle.test.mjs', 'browser/medvode-fence.test.mjs', 'browser/medvode-net.test.mjs', 'browser/medvode-props.test.mjs', 'browser/lang.test.mjs', 'browser/menu.test.mjs', 'browser/darktip.test.mjs', 'browser/saver.test.mjs', 'browser/ostrenje.test.mjs', 'browser/tower.test.mjs', 'browser/share.test.mjs', 'browser/shramba.test.mjs', 'browser/lestvica.test.mjs', 'browser/prvi.test.mjs', 'browser/sledi.test.mjs', 'browser/denarnica.test.mjs', 'browser/sky.test.mjs', 'browser/pitlights.test.mjs', 'browser/pitrain.test.mjs', 'browser/fuel.test.mjs', 'browser/rivals.test.mjs', 'browser/school.test.mjs', 'browser/slip.test.mjs', 'browser/faults.test.mjs', 'browser/radio.test.mjs', 'browser/boxwarn.test.mjs', 'browser/aipits.test.mjs', 'browser/pitswing.test.mjs', 'browser/pitfight.test.mjs', 'browser/pitexit.test.mjs', 'browser/chal.test.mjs', 'browser/onchamp.test.mjs', 'browser/hlvid.test.mjs', 'browser/ctrl.test.mjs', 'browser/rio.test.mjs', 'browser/townsville.test.mjs', 'browser/hakone.test.mjs', 'browser/start.test.mjs', 'browser/hudcol.test.mjs', 'browser/hud.test.mjs', 'browser/notes.test.mjs', 'browser/sovoznik.test.mjs', 'browser/kerb.test.mjs', 'browser/marks.test.mjs', 'browser/boards.test.mjs', 'browser/covers.test.mjs', 'browser/roadside.test.mjs', 'browser/quick.test.mjs', 'browser/seams.test.mjs', 'browser/napake.test.mjs', 'browser/napake-slika.test.mjs', 'browser/napake-seznami.test.mjs', 'browser/napake-zastavice.test.mjs', 'browser/pitsound.test.mjs', 'browser/haptics.test.mjs', 'browser/pitreplay.test.mjs', 'browser/pitcam.test.mjs', 'browser/pauseinfo.test.mjs', 'browser/pitout.test.mjs', 'browser/pitahead.test.mjs', 'browser/pitstats.test.mjs', 'browser/napake-samodejno.test.mjs', 'browser/napake-posnetek.test.mjs', 'browser/napake-zadnji.test.mjs', 'browser/missions.test.mjs', 'browser/m06.test.mjs', 'browser/m01.test.mjs', 'browser/m49.test.mjs', 'browser/m47.test.mjs', 'browser/m46.test.mjs', 'browser/m19.test.mjs', 'browser/m35.test.mjs', 'browser/m37.test.mjs', 'browser/m48.test.mjs', 'browser/m30.test.mjs', 'browser/m33.test.mjs', 'browser/m53.test.mjs', 'browser/m07.test.mjs', 'browser/m09.test.mjs', 'browser/m43.test.mjs', 'browser/m51.test.mjs', 'browser/m52.test.mjs', 'browser/m54.test.mjs', 'browser/m39.test.mjs', 'browser/m50.test.mjs', 'browser/m34.test.mjs', 'browser/m55.test.mjs', 'browser/m10.test.mjs', 'browser/m02.test.mjs', 'browser/m04.test.mjs', 'browser/m08.test.mjs', 'browser/m17.test.mjs', 'browser/m26.test.mjs', 'browser/m11.test.mjs', 'browser/m23.test.mjs', 'browser/m29.test.mjs', 'browser/m40.test.mjs', 'browser/m45.test.mjs', 'browser/zabava.test.mjs'],
};
// How long each browser test takes on GitHub (seconds: the median of 6 runs' summaries, 5. 11. 2026, runs 1229-1246, 3 of main and 3 of pull
// requests, each time scaled to a machine of median speed: GitHub's machines differ, one job's tests all take 0.5 to 1.35 times as long;
// ~61 min a share of 6, memory alone in one): --shard deals the tests out by it, and a test's time limit grows with it (LIMIT_OF). Update it
// from the summaries when a test grows a lot (smoke, memory, perf, gfx and world grow with every track); a test not listed counts as DEF_SECS
const SECS = {
  'browser/memory.test.mjs': 3661, 'browser/perf.test.mjs': 2034, 'browser/smoke.test.mjs': 1684, 'browser/crash.test.mjs': 1030,
  'browser/world.test.mjs': 970, 'browser/gfx.test.mjs': 950, 'browser/menu.test.mjs': 759, 'browser/covers.test.mjs': 558,
  'browser/garage.test.mjs': 527, 'browser/online.test.mjs': 335, 'browser/marks.test.mjs': 319, 'browser/kolibri.test.mjs': 308,
  'browser/hudcol.test.mjs': 296, 'browser/online4.test.mjs': 286, 'browser/kerb.test.mjs': 269, 'browser/notes.test.mjs': 247,
  'browser/nova.test.mjs': 245, 'browser/sovoznik.test.mjs': 390, 'browser/carlow.test.mjs': 225, 'browser/lestvica.test.mjs': 221, 'browser/startcam.test.mjs': 210, 'browser/pits.test.mjs': 206,
  'browser/school.test.mjs': 190, 'browser/onchamp.test.mjs': 189, 'browser/radio.test.mjs': 185, 'browser/look.test.mjs': 182,
  'browser/share.test.mjs': 177, 'browser/ljudje.test.mjs': 176, 'browser/sledi.test.mjs': 164, 'browser/look2.test.mjs': 163,
  'browser/prvi.test.mjs': 160, 'browser/wheels.test.mjs': 150, 'browser/roadside.test.mjs': 146, 'browser/app.test.mjs': 142,
  'browser/quali.test.mjs': 141, 'browser/sound.test.mjs': 134, 'browser/okolje.test.mjs': 560, 'browser/chal.test.mjs': 134, 'browser/flystart.test.mjs': 132,
  'browser/sky.test.mjs': 128, 'browser/napake-zadnji.test.mjs': 125, 'browser/napake-seznami.test.mjs': 125, 'browser/replay.test.mjs': 122, 'browser/medvode-fence.test.mjs': 121,
  'browser/newver.test.mjs': 120, 'browser/pad.test.mjs': 119, 'browser/repair.test.mjs': 113, 'browser/nvschool.test.mjs': 111,
  'browser/fuel.test.mjs': 111, 'browser/napake-slika.test.mjs': 107, 'browser/slip.test.mjs': 98, 'browser/rio.test.mjs': 98,
  'browser/ctrl.test.mjs': 97, 'browser/flags.test.mjs': 89, 'browser/zivali.test.mjs': 86, 'browser/zaslon.test.mjs': 150, 'browser/weather.test.mjs': 78,
  'browser/darktip.test.mjs': 78, 'browser/seams.test.mjs': 76, 'browser/napake.test.mjs': 75, 'browser/hlvid.test.mjs': 73,
  'browser/nvheli.test.mjs': 72, 'browser/repro.test.mjs': 71, 'browser/carcull.test.mjs': 71, 'browser/start.test.mjs': 68,
  'browser/napake-posnetek.test.mjs': 62, 'browser/ostrenje.test.mjs': 60, 'browser/shramba.test.mjs': 60, 'browser/camtilt.test.mjs': 59,
  'browser/career.test.mjs': 58, 'browser/atmos.test.mjs': 55, 'browser/camshake.test.mjs': 54, 'browser/denarnica.test.mjs': 53,
  'browser/champ.test.mjs': 51, 'browser/nvride.test.mjs': 50, 'browser/nvwater.test.mjs': 90, 'browser/boards.test.mjs': 50, 'browser/lang.test.mjs': 49,
  'browser/medvode-castle.test.mjs': 48, 'browser/rivals.test.mjs': 48, 'browser/faults.test.mjs': 48, 'browser/napake-samodejno.test.mjs': 48,
  'browser/quick.test.mjs': 47, 'browser/missions.test.mjs': 47, 'browser/saver.test.mjs': 46, 'browser/napake-zastavice.test.mjs': 46,
  'browser/hud.test.mjs': 42, 'browser/medvode-props.test.mjs': 41, 'browser/fire.test.mjs': 40, 'browser/tower.test.mjs': 35,
  'browser/townsville.test.mjs': 31, 'browser/hakone.test.mjs': 60, 'browser/m30.test.mjs': 28, 'browser/m09.test.mjs': 28, 'browser/m26.test.mjs': 27,
  'browser/m43.test.mjs': 26, 'browser/m39.test.mjs': 26, 'browser/m06.test.mjs': 25, 'browser/m33.test.mjs': 25,
  'browser/m53.test.mjs': 25, 'browser/m52.test.mjs': 25, 'browser/m50.test.mjs': 25, 'browser/m35.test.mjs': 24,
  'browser/m48.test.mjs': 24, 'browser/m02.test.mjs': 24, 'browser/m04.test.mjs': 24, 'browser/m08.test.mjs': 24,
  'browser/m01.test.mjs': 23, 'browser/m47.test.mjs': 23, 'browser/m37.test.mjs': 23, 'browser/m54.test.mjs': 22,
  'browser/m49.test.mjs': 21, 'browser/m07.test.mjs': 21, 'browser/m51.test.mjs': 21, 'browser/m55.test.mjs': 21,
  'browser/m10.test.mjs': 21, 'browser/m17.test.mjs': 21, 'browser/m46.test.mjs': 20, 'browser/m34.test.mjs': 20,
  'browser/m19.test.mjs': 18,
  'browser/pitlights.test.mjs': 120, 'browser/pitrain.test.mjs': 150, 'browser/pitjoin.test.mjs': 420, 'browser/garages.test.mjs': 120,
  'browser/pitkit.test.mjs': 200, 'browser/crew.test.mjs': 150, 'browser/pitcam.test.mjs': 340, 'browser/pauseinfo.test.mjs': 150,
  'browser/pitout.test.mjs': 60, 'browser/boxwarn.test.mjs': 120, 'browser/pitswing.test.mjs': 75, 'browser/pitfight.test.mjs': 120,
  'browser/pitexit.test.mjs': 100, 'browser/voices.test.mjs': 120, 'browser/redflag.test.mjs': 200,
  // (the pits tests of #284, from its run on 4. 11. 2026)
  'browser/m11.test.mjs': 30, 'browser/m23.test.mjs': 25, 'browser/m29.test.mjs': 25, 'browser/m40.test.mjs': 25, 'browser/m45.test.mjs': 25,
};
const DEF_SECS = 60, secs = (f) => SECS[f] || DEF_SECS;
// one share (k of n) of a list: the longest test first, each to the share with the least time so far (ties: the lower share), each share
// then in the list's own order; the same list always gives the same shares
function shareOf(list, k, n) {
  const load = new Array(n).fill(0), to = new Map();
  for (const f of list.map((f, i) => [f, i]).sort((a, b) => secs(b[0]) - secs(a[0]) || a[1] - b[1]).map(e => e[0])) {
    let j = 0; for (let i = 1; i < n; i++) if (load[i] < load[j]) j = i;
    to.set(f, j); load[j] += secs(f);
  }
  return { mine: list.filter(f => to.get(f) === k - 1), load };
}

// --related: the tests of what changed. A file picks the tests named as it is, or as a part of its name (js/tracks/spa.js, docs/proge/spa.md:
// spa.test.js; js/world-montreal.js: montreal and world; docs/proge/medvode.md: medvode, medvode-props, browser/medvode-castle ...), a changed
// test itself, and the tests RELATED gives for it (the big shared files, which no name matches)
const RELATED = [
  [/^(js|css)\/|^index\.html$|^garaza\.html$|^sw\.js$|^tools\/stamp\.js$/, ['stamp.test.js']],   // (the pages' links: every file there, no stamps; the publish step's stamping)
  [/^js\/tracks\/|^docs\/proge\/|^assets\/|^maketa-menija\//, ['testne-proge.test.js']],   // (where the test tracks' files are: frozen until they are deleted, CLAUDE.md »Testne proge«)
  [/^tools\/razdeli-proge\.mjs$|^js\/(game|render|world[\w-]*)\.js$|^js\/tracks\/|^index\.html$/, ['razdelitev.test.js']],   // (the real tracks' own settings and world parts in their own files, docs/razdelitev-prog.md)
  [/^js\/core\.js$/, ['golden.test.js', 'start.test.js', 'quick.test.js', 'repro.test.js', 'nova.test.js', 'trki.test.js', 'serpentine.test.js', 'browser/repro.test.mjs']],
  [/^js\/core\.js$/, ['padec.test.js', 'browser/padec.test.mjs']],   // (the fall over an edge as a body on the ground drawn beyond it, where the track's file has that ground: Killar; docs/trki-realizem.md)
  [/^js\/(render|game|sfx)\.js$|^tools\/posnetek\.mjs$/, ['browser/padec.test.mjs']],   // (that fall drawn, heard, followed by the camera and kept in the replay)
  [/^js\/game\.js$|^index\.html$/, ['lang.test.js', 'browser/quick.test.mjs', 'browser/repro.test.mjs', 'browser/lang.test.mjs', 'browser/nova.test.mjs']],
  [/^js\/(world[\w-]*|render|tex)\.js$/, ['browser/world.test.mjs', 'browser/gfx.test.mjs']],
  [/^js\/world-ljudje[23]?\.js$|^js\/tracks\/|^tools\/ljudje\/|^tests\/lib\/ulice\.js$/, ['ljudje-mesta.test.js', 'browser/ljudje.test.mjs']],   // (the people's scenes and their places: the side roads, the streets, the pit lanes)
  [/^js\/core\.js$/, ['ljudje-mesta.test.js']],   // (the places on Core's track: its side roads, its barriers)
  [/^js\/core\.js$/, ['sovoznik.test.js', 'rally.test.js', 'katu.test.js']],   // (the co-driver's notes of every real open road, a rally stage's and a gravel descent's: Track.paceNotes, docs/sovoznik.md)
  [/^js\/game\.js$|^css\/style\.css$|^index\.html$/, ['browser/sovoznik.test.mjs']],   // (the co-driver's caption on the roads, the bend's grade on the corner sign, the switch in the settings)
  [/^js\/(core|comm)\.js$|^js\/data\/sovoznik-en\.js$|^tools\/sovoznik-glas\.py$/, ['sovoznik-glas.test.js']],   // (the co-driver's recorded voice: his words in the sheet, the calls said from it)
  [/^js\/(comm|sfx)\.js$|^js\/data\/sovoznik-en\.js$/, ['browser/sovoznik.test.mjs']],   // (the calls said in the recorded voice, not by the browser's)
  [/^js\/input\.js$/, ['browser/ctrl.test.mjs', 'browser/pad.test.mjs']],
  [/^js\/(render|game)\.js$|^css\/style\.css$/, ['browser/startcam.test.mjs']],   // (the camera before the start: its flights, its six start lights)
  [/^js\/render\.js$/, ['browser/ostrenje.test.mjs']],   // (the sharpening in the post pass: casK)
  [/^js\/render(-vecer)?\.js$/, ['browser/atmos.test.mjs', 'browser/vecer.test.mjs']],   // (the time of day's lights: the evening's, js/render-vecer.js)
  [/^js\/(menu|menu-data)\.js$|^css\/menu\.css$/, ['browser/menu.test.mjs', 'browser/darktip.test.mjs']],
  [/^temni-nacin\.html$/, ['browser/darktip.test.mjs']],
  [/^js\/net\.js$/, ['net-core.test.js', 'browser/online.test.mjs']],
  [/^js\/sfx\.js$/, ['browser/sound.test.mjs', 'browser/okolje.test.mjs']],
  [/^js\/world-zivali\.js$|^tools\/zvoki-pasovi\.mjs$|^js\/comm\.js$/, ['browser/okolje.test.mjs']],   // (the sounds by the road: their zones from the woods and the herds, js/sfx-okolje.js; the commentator cuts the announcer)
  [/^js\/lang\.js$|^js\/tracks\//, ['lang.test.js']],   // (a track's English name and description)
  [/^js\/tracks\/|^js\/core\.js$|^js\/routes\.js$|^tools\/menu-lens\.js$/, ['menu-lens.test.js']],
  [/^js\/tracks\/|^js\/core\.js$/, ['rivals-n.test.js', 'grid.test.js']],   // (the menu's Opponents: the most rivals each track's start and finish take, def.maxRivals)   // (the menu's tables of the tracks' lengths and heights)
  [/^js\/tracks\/|^js\/geo\.js$|^tools\/menu-globe\.mjs$|^assets\/flags\/|^assets\/geo\/earth-s\.webp$/, ['menu-globe.test.js']],   // (the countries: the flags, the globe's outlines and places)
  [/^js\/tracks\/|^js\/menu-data\.js$|^tools\/menu-corner|^assets\/maps\/corner-/, ['menu-corner.test.js', 'browser/menu.test.mjs']],   // (the corner camera: its corners, videos and posters, MENU.corners)
  [/^js\/cars\//, ['kit.test.js', 'deli.test.js', 'fleet.test.js', 'browser/garage.test.mjs', 'browser/cars-ui.test.mjs']],   // (a vehicle must fit the garage's lane, under its door and lamps at 3.3 m, and stand in its place in the car screen's strip by its career price)
  [/^js\/core\.js$/, ['cisterna.test.js', 'zrcalni.test.js']],   // (the semi-trailer: its joint, its AI, its grid, in a race of six rigs)
  [/^js\/deli\/(barve|skriti)\.js$/, ['deli.test.js', 'deli-barve.test.js', 'browser/deli-barve.test.mjs']],   // (the garage's parts, sklop 3)
  [/^js\/deli(\.js$|\/)|^js\/data\/deli\.js$|^js\/cars\/kolibri\.js$|^tests\/lib\/deli-geo\.js$/, ['deli.test.js', 'deli-pregled.test.js', 'deli-barve.test.js', 'browser/maketa-delov.test.mjs']],   // (the parts on KOLIBRI looked at, sklop 4)
  [/^maketa-delov\/|^js\/render\.js$/, ['browser/maketa-delov.test.mjs']],   // (the parts' viewing page: Render.setShowView)
  [/^js\/replay|^css\/style\.css$/, ['browser/replay.test.mjs']],
  [/^js\/napake\.js$|^css\/napake\.css$/, ['browser/replay.test.mjs']],   // (Označi: the replay's twelfth button)
  [/^js\/input\.js$/, ['browser/napake-zastavice.test.mjs', 'browser/napake-samodejno.test.mjs']],
  [/^tools\/posnetek\.mjs$/, ['browser/napake-posnetek.test.mjs']],
  [/^js\/napake\.js$/, ['voznja.test.js']],   // (AI po tvoji liniji: tools/voznja.mjs reads the recordings by js/napake.js; on GitHub the whole Node suite)
  [/^js\/game\.js$|^tools\/voznja\.mjs$/, ['browser/napake-posnetek.test.mjs']],   // (the recording's header for tools/voznja.mjs, js/game.js rrpOf: the player's car, the tyres, the weather)   // (the recording as a file, opened for Claude)   // (F and the pad's Select: a flag; O: Prikaz za razvijalca)
  [/\.md$/, ['fleet.test.js']],   // (every .md checked for a car maker's name)
  [/^tests\/run\.js$|^\.github\/workflows\//, ['shards.test.js']],
  [/^js\/missions(\.js$|\/)|^css\/missions\.css$/, ['missions.test.js', 'browser/missions.test.mjs']],   // (the special missions: the system and each mission's texts)
  [/^js\/missions\/kit\.js$/, ['m01.test.js', 'browser/m01.test.mjs', 'm49.test.js', 'browser/m49.test.mjs', 'm47.test.js', 'browser/m47.test.mjs', 'm46.test.js', 'browser/m46.test.mjs', 'm19.test.js', 'browser/m19.test.mjs', 'm35.test.js', 'browser/m35.test.mjs', 'm37.test.js', 'browser/m37.test.mjs', 'm48.test.js', 'browser/m48.test.mjs', 'm30.test.js', 'browser/m30.test.mjs', 'm33.test.js', 'browser/m33.test.mjs', 'm53.test.js', 'browser/m53.test.mjs', 'm07.test.js', 'browser/m07.test.mjs', 'm09.test.js', 'browser/m09.test.mjs', 'm43.test.js', 'browser/m43.test.mjs', 'm51.test.js', 'browser/m51.test.mjs', 'm52.test.js', 'browser/m52.test.mjs', 'm54.test.js', 'browser/m54.test.mjs', 'm06.test.js', 'browser/m06.test.mjs', 'm39.test.js', 'browser/m39.test.mjs', 'm50.test.js', 'browser/m50.test.mjs', 'm34.test.js', 'browser/m34.test.mjs', 'm55.test.js', 'browser/m55.test.mjs', 'm10.test.js', 'browser/m10.test.mjs', 'm02.test.js', 'browser/m02.test.mjs', 'm04.test.js', 'browser/m04.test.mjs', 'm08.test.js', 'browser/m08.test.mjs', 'm17.test.js', 'browser/m17.test.mjs', 'm26.test.js', 'browser/m26.test.mjs', 'm11.test.js', 'browser/m11.test.mjs', 'm23.test.js', 'browser/m23.test.mjs', 'm29.test.js', 'browser/m29.test.mjs', 'm40.test.js', 'browser/m40.test.mjs', 'm45.test.js', 'browser/m45.test.mjs']],   // (the missions' shared kit: the fire engine, the fire, the water, the aim; group 3's water, the boat, the skins; group 5's keys, towTrailer, tow, brakes, escort; group 6's ride, herd, trailer, hospital; group 7's road both ways)
  [/^tests\/lib\/drive\.js$|^tests\/browser\/misdrive\.mjs$/, ['m39.test.js', 'browser/m39.test.mjs', 'm50.test.js', 'browser/m50.test.mjs', 'm34.test.js', 'browser/m34.test.mjs', 'm55.test.js', 'browser/m55.test.mjs', 'm10.test.js', 'browser/m10.test.mjs', 'm02.test.js', 'browser/m02.test.mjs']],   // (the missions' drivers for the tests)
  [/^js\/zabava(\.js$|\/)|^css\/zabava\.css$/, ['zabava.test.js', 'browser/zabava.test.mjs', 'lang.test.js']],   // (Zabava: the novelties, docs/zabava.md)
  [/^js\/shramba\.js$/, ['browser/share.test.mjs']],   // (the saved game kept safe: the profile file and its import go through it)
  [/^js\/render\.js$/, ['browser/marks.test.mjs', 'browser/sledi.test.mjs']],
  [/^js\/(garage|game)\.js$|^garaza\.html$/, ['browser/denarnica.test.mjs']],   // (the garage's real profile: the career's coins, cars and upgrades, shared with the game)   // (the tyre marks of the last runs and a friend's: Render.setOldMarks)
  [/^js\/nv(boat|water)\.js$/, ['browser/nvwater.test.mjs', 'browser/newver.test.mjs']],   // (the water course's bed, its jet skis at the pier, driving on the water)
  [/^tests\/lib\//, ['quick.test.js']],
  [/^tests\/browser\/lib\.mjs$/, ['browser/quick.test.mjs']],
];
const stem = (f) => path.basename(f).replace(/\.test\.m?js$/, '').replace(/\.[^.]+$/, '').toLowerCase();
function related(files, all) {
  const want = new Set(), parts = (f) => stem(f).split(/[-_.]/).filter(Boolean);
  for (const f of files) {
    if (all.includes(f.replace(/^tests\//, ''))) want.add(f.replace(/^tests\//, ''));   // (a changed test)
    const fp = parts(f), asset = /^assets\//.test(f);   // (a picture or a video is no track's code: only RELATED names its tests, e.g. assets/maps/corner-spa.webm)
    if (!asset) for (const t of all) { const ts = stem(t); if (ts === stem(f) || fp.includes(ts) || fp.includes(ts.split('-')[0])) want.add(t); }
    for (const [re, ts] of RELATED) if (re.test(f)) for (const t of ts) want.add(t);
  }
  return all.filter(t => want.has(t));
}
// what changed against main: the commits since the branch left it, what is not committed yet, the new files
function changedFiles() {
  const git = (...a) => { const r = spawnSync('git', a, { encoding: 'utf8', cwd: path.join(__dirname, '..') }); return r.status === 0 ? r.stdout.trim() : null; };
  const refs = ['origin/main', 'main'].filter(r => git('rev-parse', '--verify', '--quiet', r) != null);
  if (!refs.length) { console.error('--related: no main branch to compare with (git fetch origin main)'); process.exit(2); }
  // (the newer of the two where they differ, one of them not fetched for a while; a shallow clone without the common commit: against main as it is)
  const bases = refs.map(r => git('merge-base', 'HEAD', r) || r), base = bases.reduce((a, b) => git('merge-base', '--is-ancestor', a, b) != null ? b : a);
  return [...new Set([git('diff', '--name-only', base), git('ls-files', '--others', '--exclude-standard')].join('\n').split('\n').filter(Boolean))];
}
// --koda: the fingerprint of the code the tests test, the committed tree of the repository the command runs in: every file's path, mode and
// content but the .md ones (documents, which only the tests of MD_TESTS read), except KODA_MD, which a test reads as data. GitHub's run
// (.github/workflows/tests.yml) records it when every job has passed; a later run of the same fingerprint (only documents changed:
// docs/vrsta.md, a plan, README.md; or main after merging a pull request whose code passed) runs only MD_TESTS (--dokumenti)
const KODA_MD = ['docs/gorske-proge.md'];   // (the table of the mountain roads: tests/lib/gore.js)
// the tests that read .md files they do not name, listing the repository's files: the car makers' names in every file, the frozen files of
// the test tracks (docs/proge/<id>.md among them). Every test that lists the repository's files is here (tests/shards.test.js checks)
const MD_TESTS = ['fleet.test.js', 'testne-proge.test.js'];
function koda() {
  const r = spawnSync('git', ['ls-tree', '-r', '-z', '--full-tree', 'HEAD'], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  if (r.status !== 0) { console.error('--koda: ' + ((r.stderr || '').trim() || 'git ls-tree failed')); process.exit(2); }
  const kept = r.stdout.split('\0').filter(e => { const f = e.slice(e.indexOf('\t') + 1); return e && (!/\.md$/.test(f) || KODA_MD.includes(f)); });
  return require('crypto').createHash('sha256').update(kept.join('\0')).digest('hex');
}

const args = process.argv.slice(2), opt = { which: null, shard: null, list: false, quiet: false, related: false, files: null, koda: false, dokumenti: false };
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--shard') opt.shard = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : '';
  else if (args[i] === '--list') opt.list = true; else if (args[i] === '--quiet') opt.quiet = true; else if (args[i] === '--related') opt.related = true;
  else if (args[i] === '--koda') opt.koda = true; else if (args[i] === '--dokumenti') opt.dokumenti = true;
  else if (args[i] === '--files') opt.files = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i].split(',').map(f => f.trim()).filter(Boolean) : [];
  else if (!opt.which) opt.which = args[i]; else { console.error('unexpected argument: ' + args[i]); process.exit(2); }
}
if (opt.files && !opt.related) { console.error('--files goes with --related'); process.exit(2); }
if (opt.koda) { if (opt.which || opt.shard != null || opt.related || opt.list || opt.quiet || opt.dokumenti) { console.error('--koda goes alone'); process.exit(2); } console.log(koda()); process.exit(0); }
if (opt.dokumenti && (opt.which || opt.shard != null || opt.related)) { console.error('--dokumenti goes alone (or with --list, --quiet)'); process.exit(2); }
const which = opt.which;
let list = opt.dokumenti ? MD_TESTS : which ? SUITES[which] : [...SUITES.node, ...SUITES.fleet, ...SUITES.browser];
if (!list) { console.error('unknown suite: ' + which + ' (node | fleet | browser)'); process.exit(2); }
if (opt.related) {
  const files = opt.files || changedFiles();
  list = related(files, list);
  console.log(`related to ${files.length} changed file${files.length === 1 ? '' : 's'}: ${list.length} test${list.length === 1 ? '' : 's'}${list.length ? '' : ' (nothing to run)'}`);
}
if (opt.shard != null) {
  const m = /^(\d+)\/(\d+)$/.exec(opt.shard), k = m ? +m[1] : 0, n = m ? +m[2] : 0;
  if (!(n >= 1 && k >= 1 && k <= n)) { console.error('bad --shard: ' + opt.shard + ' (k/n, 1 <= k <= n)'); process.exit(2); }
  const { mine, load } = shareOf(list, k, n);
  console.log(`share ${k}/${n}: ${mine.length} of ${list.length} tests, ~${Math.round(load[k - 1] / 60)} min on GitHub (the shares: ${load.map(l => Math.round(l / 60)).join(', ')} min)`);
  list = mine;
}
if (opt.list) { for (const f of list) console.log(f); process.exit(0); }
const LIMIT = (+process.env.TEST_TIMEOUT_MIN || 15) * 60000;
// (the memory test goes three times through every track, the smoke and the phone budget tests drive on each: they grow with each new track, so they get twice the time;
// the browser fleet test the same: it grows with each vehicle, and with the fields it measures them in, 22 and 100 cars)
// TEST_SLOW: a test may also take that many times its SECS (default 4: a cloud session's machine takes 2 to 2.5 times as long as GitHub's,
// e.g. world and gfx ~25-30 min; GitHub's browser tests 2, tests.yml), so a long test is not stopped only because the machine is slow
const SLOW = +process.env.TEST_SLOW || 4;
const LIMIT_OF = (f) => Math.round(Math.max((/memory\.test/.test(f) ? 3 : /smoke\.test|perf\.test|browser\/fleet\.test|browser\/garage\.test/.test(f) ? 2 : 1) * LIMIT, SLOW * secs(f) * 1000) / 60000) * 60000;   // (the memory test: three times; in whole minutes)

const results = [];
for (const f of list) {
  const t0 = Date.now();
  if (!opt.quiet) console.log(`\n### ${f}`);
  const r = spawnSync(process.execPath, [path.join(__dirname, f)], { stdio: opt.quiet ? ['ignore', 'pipe', 'pipe'] : 'inherit', encoding: 'utf8', maxBuffer: 512 * 1024 * 1024, timeout: LIMIT_OF(f), killSignal: 'SIGKILL' });
  const timedOut = !!(r.error && r.error.code === 'ETIMEDOUT');
  if (opt.quiet && r.status !== 0) {   // (quiet: a failed test's FAIL lines and its last lines, a stack trace among them)
    const out = ((r.stdout || '') + '\n' + (r.stderr || '')).split('\n').filter(l => l.trim() && !/^OK\b/.test(l)), fails = out.filter(l => /\bFAIL\b/.test(l));
    console.log(`\n### ${f}`); for (const l of [...new Set([...fails.slice(0, 40), ...out.slice(-15)])]) console.log(l);
  }
  if (timedOut) console.log(`FAIL ${f}: stopped after ${LIMIT_OF(f) / 60000} min (TEST_TIMEOUT_MIN, TEST_SLOW)`);
  results.push({ f, ok: r.status === 0, s: ((Date.now() - t0) / 1000).toFixed(0), timedOut });
  if (r.status !== 0 && process.env.GITHUB_ACTIONS) console.log(`::error title=${f}::${timedOut ? `stopped after ${LIMIT_OF(f) / 60000} min` : `exit ${r.status != null ? r.status : r.signal}`} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);   // (on GitHub: an annotation of the check run, readable where the job's log is not)
}
console.log('\n=== summary');
for (const r of results) if (!opt.quiet || !r.ok) console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${r.f} (${r.s} s)${r.timedOut ? ' — timed out' : ''}`);
if (opt.quiet) console.log(`${results.filter(r => r.ok).length} of ${results.length} tests passed (${results.reduce((a, r) => a + +r.s, 0)} s)`);
process.exit(results.every(r => r.ok) ? 0 : 1);
