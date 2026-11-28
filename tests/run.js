// Runs the test suites one after another (each in its own process) and prints a summary.
//   node tests/run.js           everything
//   node tests/run.js node      only the Node tests (physics, AI, races; ~4 min)
//   node tests/run.js browser   only the browser tests (Playwright; ~75 min with software WebGL)
//   node tests/run.js fleet     only the vehicle fleet (the render kit's rules, the garage's parts, the registry, every vehicle's handling, destruction and AI; how each is drawn; the car screen; ~10 min)
//   node tests/run.js browser --shard 2/10        one share of a suite (GitHub runs the browser tests on 10 machines at once, see SECS)
//   node tests/run.js browser --shard 2/10 --list only print which tests that share has
//   node tests/run.js --related   only the tests related to what changed against main (npm run test:related; see RELATED below)
//   node tests/run.js --related --files js/lang.js,docs/proge/spa.md --list   the same for the files given (no git)
//   node tests/run.js --koda      the fingerprint of the code under test (KODA_MD below): GitHub runs the heavy jobs once for each
//   node tests/run.js --dokumenti only the tests that read the .md files (MD_TESTS below): what GitHub runs when that code has passed
//   node tests/run.js --krog [--base <ref>] [--head <ref>]   which tests a change needs on GitHub (tests/lib/krog.js): only documents, only
//                 tracks (the short round) or everything; the commits from base (default: where the branch left main) to head (HEAD)
//   node tests/run.js --kratek seoul,spa [--files a,b] [node|browser] [--shard 1/3]   the short round of a change of only these tracks: the
//                 related tests and the tests over every track (PO_PROGAH) only on them (PROGE), testne-proge.test.js always
//   node tests/run.js --vzrok --od <sha> --padli <file>   the pull requests merged into main since that commit (the last green nightly
//                 round) that changed what the failed tests (their names in the file) test: GitHub's job Vzrok after a red nightly round
//   --quiet   only the failures (a failed test's FAIL lines and its last lines), one progress line for each test, and the summary
// A test that runs longer than TEST_TIMEOUT_MIN minutes (default 15), or than TEST_SLOW (default 4) times its usual time on GitHub (SECS)
// if that is longer, is stopped and counted as failed, so a hung test still ends with the summary (LIMIT_OF). TEST_PADLI=<file>: the
// failed tests' names are added to it, one a line (GitHub: for the job Vzrok).
'use strict';
const { spawn, spawnSync } = require('child_process');
const path = require('path');
// stdout as a pipe (spawnSync, `| head`) can be written asynchronously: process.exit right after --list then lost the end of the list on a busy
// machine (tests/shards.test.js saw 171 of 208 node tests), so every write waits until it is out
for (const s of [process.stdout, process.stderr]) if (s._handle && s._handle.setBlocking) s._handle.setBlocking(true);

const SUITES = {
  node: ['stamp.test.js', 'predogled.test.js', 'testne-proge.test.js', 'spoji-main.test.js', 'predaja.test.js', 'razdelitev.test.js', 'menu-lens.test.js', 'menu-globe.test.js', 'menu-corner.test.js', 'shards.test.js', 'krog.test.js', 'golden.test.js', 'repro.test.js', 'cilj-odprte-ceste.test.js', 'roll.test.js', 'corner.test.js', 'knock.test.js', 'races.test.js', 'cs-handling.test.js', 'nova.test.js', 'trki.test.js', 'padec.test.js', 'net-core.test.js', 'crossover.test.js', 'champ.test.js', 'kariera.test.js', 'kariera-pot.test.js', 'rally.test.js', 'sovoznik.test.js', 'sovoznik-glas.test.js', 'quali.test.js', 'weather.test.js', 'oprijem.test.js', 'compounds.test.js', 'kolibri-tyres.test.js', 'marbles.test.js', 'rubber.test.js', 'zgumirana-linija.test.js', 'coldtyres.test.js', 'pitahead.test.js', 'pitstats.test.js', 'wear.test.js', 'strategy.test.js', 'flags.test.js', 'ai-zastave.test.js', 'redflag.test.js', 'vrsic.test.js', 'pikes.test.js', 'junctions.test.js', 'ljudje-mesta.test.js', 'katu.test.js', 'traffic.test.js', 'police.test.js', 'caracoles.test.js', 'bathurst.test.js', 'chapman.test.js', 'bigsur.test.js', 'tianmen.test.js', 'serpentine.test.js', 'uncompahgre.test.js', 'sani.test.js', 'iroha.test.js', 'mulholland.test.js', 'palomar.test.js', 'beartooth.test.js', 'rastro.test.js', 'moki.test.js', 'killar.test.js', 'greatalpine.test.js', 'maunakea.test.js', 'baldy.test.js', 'cpalace.test.js', 'riverside.test.js', 'detroit.test.js', 'monterey.test.js', 'longford.test.js', 'newcastle.test.js', 'rio.test.js', 'toronto.test.js', 'medvode.test.js', 'medvode-props.test.js', 'medvode-fence.test.js', 'montreal.test.js', 'bangsaen.test.js', 'troisrivieres.test.js', 'mountbuller.test.js', 'livorno.test.js', 'zurich.test.js', 'marrakesh.test.js', 'townsville.test.js', 'hotham.test.js', 'koli.test.js', 'hakone.test.js', 'luanda.test.js', 'hiva.test.js', 'mombasa.test.js', 'isalo.test.js', 'portobelo.test.js', 'eljem.test.js', 'znamenitost.test.js', 'ujarras.test.js', 'ghoufi.test.js', 'cusco.test.js', 'isuna.test.js', 'longyearbyen.test.js', 'krasnahorka.test.js', 'hafit.test.js', 'chamarel.test.js', 'lang.test.js', 'imena.test.js', 'viri.test.js', 'fuel.test.js', 'rivals.test.js', 'slip.test.js', 'faults.test.js', 'radio.test.js', 'forecast.test.js', 'voices.test.js', 'pits.test.js', 'aipits.test.js', 'pitswing.test.js', 'pitexit.test.js', 'boards.test.js', 'start.test.js', 'grid.test.js', 'field.test.js', 'rivals-n.test.js', 'hudsigns.test.js', 'wheels.test.js', 'debris.test.js', 'lod.test.js', 'quick.test.js', 'haptics.test.js', 'shramba.test.js', 'lestvica.test.js', 'shot.test.js', 'missions.test.js', 'm06.test.js', 'm01.test.js', 'm49.test.js', 'm47.test.js', 'm46.test.js', 'm19.test.js', 'm35.test.js', 'm37.test.js', 'm48.test.js', 'm30.test.js', 'm33.test.js', 'm53.test.js', 'm07.test.js', 'm09.test.js', 'm43.test.js', 'm51.test.js', 'm52.test.js', 'm54.test.js', 'm39.test.js', 'm50.test.js', 'm34.test.js', 'm55.test.js', 'm10.test.js', 'm02.test.js', 'm04.test.js', 'm08.test.js', 'm17.test.js', 'm26.test.js', 'm11.test.js', 'm23.test.js', 'm29.test.js', 'm40.test.js', 'm45.test.js', 'zabava.test.js', 'neskoncna.test.js', 'drag.test.js', 'balea.test.js', 'mapileng.test.js', 'tatev.test.js', 'envalira.test.js', 'koror.test.js', 'vaoala.test.js', 'canaries.test.js', 'sogeri.test.js', 'irishtown.test.js', 'kanaba.test.js', 'aguascalientes.test.js', 'quezaltepeque.test.js', 'batangas.test.js', 'haivan.test.js', 'savusavu.test.js', 'voznja.test.js', 'espinazo.test.js', 'seoul.test.js', 'portomoniz.test.js', 'gudauri.test.js', 'santoantao.test.js', 'furka.test.js', 'dades.test.js', 'izoard.test.js', 'sacalobra.test.js', 'kotor.test.js', 'silkeborg.test.js', 'kagerod.test.js', 'zandvoort.test.js', 'sosnova.test.js', 'pembrey.test.js', 'kildare.test.js', 'london.test.js', 'bikernieki.test.js', 'ngorongoro.test.js', 'medeu.test.js', 'ella.test.js', 'llogara.test.js', 'tuzla.test.js', 'buriram.test.js', 'lusail.test.js', 'lombok.test.js', 'sepang.test.js', 'sakhir.test.js', 'riohondo.test.js'],
  fleet: ['kit.test.js', 'deli.test.js', 'videz.test.js', 'deli-barve.test.js', 'deli-pregled.test.js', 'fleet.test.js', 'cisterna.test.js', 'zrcalni.test.js', 'rezervna-kolesa.test.js', 'browser/fleet.test.mjs', 'browser/cisterna.test.mjs', 'browser/zrcalni.test.mjs', 'browser/rezervna-kolesa.test.mjs', 'browser/kit.test.mjs', 'browser/cars-ui.test.mjs', 'browser/deli-barve.test.mjs', 'browser/maketa-delov.test.mjs'],
  browser: ['browser/garage.test.mjs', 'browser/smoke.test.mjs', 'browser/smoke2.test.mjs', 'browser/zivali.test.mjs', 'browser/zastave.test.mjs', 'browser/cesta.test.mjs', 'browser/zaslon.test.mjs', 'browser/ljudje.test.mjs', 'browser/repro.test.mjs', 'browser/flystart.test.mjs', 'browser/startcam.test.mjs', 'browser/newver.test.mjs', 'browser/nvschool.test.mjs', 'browser/nvheli.test.mjs', 'browser/nvride.test.mjs', 'browser/nvfair.test.mjs', 'browser/nvwater.test.mjs', 'browser/app.test.mjs', 'browser/crash.test.mjs', 'browser/padec.test.mjs', 'browser/nova.test.mjs', 'browser/kolibri.test.mjs', 'browser/kolibri-hud.test.mjs', 'browser/wheels.test.mjs', 'browser/world.test.mjs', 'browser/world2.test.mjs', 'browser/pits.test.mjs', 'browser/pitjoin.test.mjs', 'browser/pitkit.test.mjs', 'browser/tyrebands.test.mjs', 'browser/garages.test.mjs', 'browser/crew.test.mjs', 'browser/pitstop.test.mjs', 'browser/forecast.test.mjs', 'browser/voices.test.mjs', 'browser/repair.test.mjs', 'browser/carcull.test.mjs', 'browser/champ.test.mjs', 'browser/quali.test.mjs', 'browser/weather.test.mjs', 'browser/marbles.test.mjs', 'browser/zgumirana-linija.test.mjs', 'browser/wear.test.mjs', 'browser/flags.test.mjs', 'browser/redflag.test.mjs', 'browser/career.test.mjs', 'browser/kariera-pot.test.mjs', 'browser/replay.test.mjs', 'browser/atmos.test.mjs', 'browser/vecer.test.mjs', 'browser/sound.test.mjs', 'browser/okolje.test.mjs', 'browser/fire.test.mjs', 'browser/gfx.test.mjs', 'browser/gfx2.test.mjs', 'browser/look.test.mjs', 'browser/look2.test.mjs', 'browser/carlow.test.mjs', 'browser/camtilt.test.mjs', 'browser/camshake.test.mjs', 'browser/pad.test.mjs', 'browser/memory.test.mjs', 'browser/memory2.test.mjs', 'browser/perf.test.mjs', 'browser/online.test.mjs', 'browser/online4.test.mjs', 'browser/medvode-castle.test.mjs', 'browser/medvode-fence.test.mjs', 'browser/medvode-net.test.mjs', 'browser/medvode-props.test.mjs', 'browser/lang.test.mjs', 'browser/menu.test.mjs', 'browser/darktip.test.mjs', 'browser/saver.test.mjs', 'browser/ostrenje.test.mjs', 'browser/tower.test.mjs', 'browser/share.test.mjs', 'browser/shramba.test.mjs', 'browser/lestvica.test.mjs', 'browser/prvi.test.mjs', 'browser/sledi.test.mjs', 'browser/denarnica.test.mjs', 'browser/denar.test.mjs', 'browser/tester.test.mjs', 'browser/sky.test.mjs', 'browser/pitlights.test.mjs', 'browser/pitrain.test.mjs', 'browser/fuel.test.mjs', 'browser/rivals.test.mjs', 'browser/school.test.mjs', 'browser/slip.test.mjs', 'browser/faults.test.mjs', 'browser/radio.test.mjs', 'browser/boxwarn.test.mjs', 'browser/aipits.test.mjs', 'browser/pitswing.test.mjs', 'browser/pitfight.test.mjs', 'browser/pitexit.test.mjs', 'browser/chal.test.mjs', 'browser/onchamp.test.mjs', 'browser/hlvid.test.mjs', 'browser/ctrl.test.mjs', 'browser/rio.test.mjs', 'browser/townsville.test.mjs', 'browser/hakone.test.mjs', 'browser/start.test.mjs', 'browser/hudcol.test.mjs', 'browser/hud.test.mjs', 'browser/notes.test.mjs', 'browser/sovoznik.test.mjs', 'browser/kerb.test.mjs', 'browser/marks.test.mjs', 'browser/boards.test.mjs', 'browser/covers.test.mjs', 'browser/roadside.test.mjs', 'browser/quick.test.mjs', 'browser/seams.test.mjs', 'browser/napake.test.mjs', 'browser/napake-slika.test.mjs', 'browser/napake-seznami.test.mjs', 'browser/napake-zastavice.test.mjs', 'browser/pitsound.test.mjs', 'browser/haptics.test.mjs', 'browser/pitreplay.test.mjs', 'browser/pitcam.test.mjs', 'browser/pauseinfo.test.mjs', 'browser/pitout.test.mjs', 'browser/pitahead.test.mjs', 'browser/pitstats.test.mjs', 'browser/napake-samodejno.test.mjs', 'browser/napake-posnetek.test.mjs', 'browser/napake-zadnji.test.mjs', 'browser/missions.test.mjs', 'browser/m06.test.mjs', 'browser/m01.test.mjs', 'browser/m49.test.mjs', 'browser/m47.test.mjs', 'browser/m46.test.mjs', 'browser/m19.test.mjs', 'browser/m35.test.mjs', 'browser/m37.test.mjs', 'browser/m48.test.mjs', 'browser/m30.test.mjs', 'browser/m33.test.mjs', 'browser/m53.test.mjs', 'browser/m07.test.mjs', 'browser/m09.test.mjs', 'browser/m43.test.mjs', 'browser/m51.test.mjs', 'browser/m52.test.mjs', 'browser/m54.test.mjs', 'browser/m39.test.mjs', 'browser/m50.test.mjs', 'browser/m34.test.mjs', 'browser/m55.test.mjs', 'browser/m10.test.mjs', 'browser/m02.test.mjs', 'browser/m04.test.mjs', 'browser/m08.test.mjs', 'browser/m17.test.mjs', 'browser/m26.test.mjs', 'browser/m11.test.mjs', 'browser/m23.test.mjs', 'browser/m29.test.mjs', 'browser/m40.test.mjs', 'browser/m45.test.mjs', 'browser/zabava.test.mjs', 'browser/neskoncna.test.mjs', 'browser/drag.test.mjs', 'browser/ngorongoro.test.mjs'],
};
// How long each browser test takes on GitHub (seconds, on a machine of middle speed: the median of three full rounds, main 22. 11. 2026,
// run 44994892896, and 23. 11. #1031 in eight shares, run 45153277100, and #953 in six, run 45165119735, each job's times divided by
// its speed, the median of time/SECS over its tests of 20 s or more; the machines were loaded, eight shares took 64-109 min and six
// 94-115 min, so the browser tests run in ten shares of ~61 min, ~90 min on a machine 1.5 times slower):
// --shard deals the tests out by it (memory, memory2 and perf each in its own share), and a test's time limit grows with
// it (LIMIT_OF). Update it from the summaries when a test grows a lot (smoke, memory, perf, gfx and world grow with every track); a test not
// listed counts as DEF_SECS
// (menu: 1374 on 24. 11. 2026, main's 1294 plus the row's police chase side, ~80 s; one slow PR machine stopped it at 30 min)
const SECS = {
  'browser/memory.test.mjs': 3365, 'browser/perf.test.mjs': 2629, 'browser/memory2.test.mjs': 2577, 'browser/smoke2.test.mjs': 1544,
  'browser/smoke.test.mjs': 1348, 'browser/crash.test.mjs': 1343, 'browser/menu.test.mjs': 1374, 'browser/gfx.test.mjs': 1030,
  'browser/garage.test.mjs': 1021, 'browser/world.test.mjs': 953, 'browser/world2.test.mjs': 937, 'browser/gfx2.test.mjs': 830,
  'browser/garages.test.mjs': 656, 'browser/pitstats.test.mjs': 530, 'browser/covers.test.mjs': 520, 'browser/crew.test.mjs': 506,
  'browser/pitcam.test.mjs': 490, 'browser/okolje.test.mjs': 481, 'browser/pitkit.test.mjs': 418, 'browser/hudcol.test.mjs': 358,
  'browser/sovoznik.test.mjs': 340, 'browser/cesta.test.mjs': 318, 'browser/kolibri.test.mjs': 315, 'browser/notes.test.mjs': 310,
  'browser/pauseinfo.test.mjs': 309, 'browser/online.test.mjs': 267, 'browser/nova.test.mjs': 247, 'browser/pitahead.test.mjs': 242,
  'browser/pitreplay.test.mjs': 231, 'browser/carlow.test.mjs': 228, 'browser/lestvica.test.mjs': 228, 'browser/startcam.test.mjs': 227,
  'browser/kerb.test.mjs': 222, 'browser/zastave.test.mjs': 217, 'browser/online4.test.mjs': 216, 'browser/look.test.mjs': 213,
  'browser/pitjoin.test.mjs': 201, 'browser/zaslon.test.mjs': 200, 'browser/marks.test.mjs': 199, 'browser/radio.test.mjs': 193,
  'browser/quali.test.mjs': 185, 'browser/look2.test.mjs': 182, 'browser/school.test.mjs': 172, 'browser/onchamp.test.mjs': 171,
  'browser/ljudje.test.mjs': 162, 'browser/pitrain.test.mjs': 151, 'browser/pad.test.mjs': 150, 'browser/sound.test.mjs': 148,
  'browser/zgumirana-linija.test.mjs': 146, 'browser/app.test.mjs': 144, 'browser/share.test.mjs': 144, 'browser/darktip.test.mjs': 143,
  'browser/tester.test.mjs': 142, 'browser/pits.test.mjs': 141, 'browser/flystart.test.mjs': 139, 'browser/replay.test.mjs': 139,
  'browser/sledi.test.mjs': 138, 'browser/sky.test.mjs': 137, 'browser/napake-zadnji.test.mjs': 131, 'browser/chal.test.mjs': 126,
  'browser/wheels.test.mjs': 123, 'browser/zabava.test.mjs': 123, 'browser/medvode-fence.test.mjs': 121, 'browser/redflag.test.mjs': 120,
  'browser/weather.test.mjs': 119, 'browser/neskoncna.test.mjs': 117, 'browser/prvi.test.mjs': 111, 'browser/repair.test.mjs': 110,
  'browser/ctrl.test.mjs': 108, 'browser/denarnica.test.mjs': 107, 'browser/boxwarn.test.mjs': 104, 'browser/seams.test.mjs': 104,
  'browser/fuel.test.mjs': 103, 'browser/medvode-net.test.mjs': 102, 'browser/roadside.test.mjs': 99, 'browser/pitlights.test.mjs': 98,
  'browser/kolibri-hud.test.mjs': 97, 'browser/slip.test.mjs': 97, 'browser/flags.test.mjs': 94, 'browser/newver.test.mjs': 91,
  'browser/nvschool.test.mjs': 91, 'browser/start.test.mjs': 85, 'browser/zivali.test.mjs': 85, 'browser/marbles.test.mjs': 81,
  'browser/carcull.test.mjs': 80, 'browser/napake-slika.test.mjs': 74, 'browser/faults.test.mjs': 73, 'browser/atmos.test.mjs': 71,
  'browser/career.test.mjs': 71, 'browser/hlvid.test.mjs': 70, 'browser/voices.test.mjs': 69, 'browser/rio.test.mjs': 68,
  'browser/camtilt.test.mjs': 67, 'browser/forecast.test.mjs': 62, 'browser/napake-seznami.test.mjs': 62, 'browser/napake.test.mjs': 61,
  'browser/nvfair.test.mjs': 61, 'browser/tyrebands.test.mjs': 61, 'browser/camshake.test.mjs': 58, 'browser/repro.test.mjs': 58,
  'browser/wear.test.mjs': 57, 'browser/lang.test.mjs': 55, 'browser/quick.test.mjs': 54, 'browser/boards.test.mjs': 52,
  'browser/pitexit.test.mjs': 52, 'browser/rivals.test.mjs': 52, 'browser/shramba.test.mjs': 52, 'browser/medvode-castle.test.mjs': 51,
  'browser/napake-posnetek.test.mjs': 51, 'browser/denar.test.mjs': 50, 'browser/drag.test.mjs': 50, 'browser/medvode-props.test.mjs': 50,
  'browser/nvheli.test.mjs': 50, 'browser/pitswing.test.mjs': 50, 'browser/saver.test.mjs': 48, 'browser/fire.test.mjs': 47,
  'browser/hud.test.mjs': 47, 'browser/pitsound.test.mjs': 45, 'browser/aipits.test.mjs': 44, 'browser/ostrenje.test.mjs': 44,
  'browser/pitstop.test.mjs': 43, 'browser/hakone.test.mjs': 42, 'browser/napake-samodejno.test.mjs': 42, 'browser/tower.test.mjs': 41,
  'browser/m29.test.mjs': 40, 'browser/pitout.test.mjs': 40, 'browser/napake-zastavice.test.mjs': 39, 'browser/townsville.test.mjs': 39,
  'browser/vecer.test.mjs': 39, 'browser/m40.test.mjs': 38, 'browser/nvride.test.mjs': 38, 'browser/missions.test.mjs': 36,
  'browser/champ.test.mjs': 35, 'browser/nvwater.test.mjs': 33, 'browser/haptics.test.mjs': 31, 'browser/pitfight.test.mjs': 30,
  'browser/padec.test.mjs': 25, 'browser/m39.test.mjs': 23, 'browser/m09.test.mjs': 22, 'browser/ngorongoro.test.mjs': 22,
  'browser/m04.test.mjs': 21, 'browser/kariera-pot.test.mjs': 20, 'browser/m02.test.mjs': 20, 'browser/m30.test.mjs': 20,
  'browser/m33.test.mjs': 20, 'browser/m26.test.mjs': 19, 'browser/m35.test.mjs': 19, 'browser/m48.test.mjs': 19,
  'browser/m50.test.mjs': 19, 'browser/m52.test.mjs': 19, 'browser/m53.test.mjs': 19, 'browser/m01.test.mjs': 18,
  'browser/m06.test.mjs': 18, 'browser/m08.test.mjs': 18, 'browser/m10.test.mjs': 18, 'browser/m17.test.mjs': 18,
  'browser/m43.test.mjs': 18, 'browser/m51.test.mjs': 18, 'browser/m37.test.mjs': 17, 'browser/m54.test.mjs': 17,
  'browser/m55.test.mjs': 17, 'browser/m07.test.mjs': 16, 'browser/m23.test.mjs': 16, 'browser/m34.test.mjs': 16,
  'browser/m45.test.mjs': 16, 'browser/m47.test.mjs': 16, 'browser/m11.test.mjs': 15, 'browser/m46.test.mjs': 15,
  'browser/m49.test.mjs': 15, 'browser/m19.test.mjs': 13,
};
// The tests that go over every real track (trackIds: tests/lib/sim.js, tests/browser/lib.mjs): in the short round only over its tracks
// (PROGE). Every test that calls trackIds is here (tests/shards.test.js checks). PROGA_SECS: [s besides the tracks, s a track] on GitHub, for
// the short round's shares: with one track (Bâlea) measured on 9. 11. 2026, a track's share from SECS (5. 11., 43 real tracks then), on a
// machine of middle speed (docs/krog-testov.md)
const PO_PROGAH = ['golden.test.js', 'races.test.js', 'serpentine.test.js', 'lestvica.test.js', 'browser/smoke.test.mjs', 'browser/world.test.mjs', 'browser/perf.test.mjs', 'browser/gfx.test.mjs', 'browser/memory.test.mjs'];
const PROGA_SECS = { 'browser/memory.test.mjs': [474, 74], 'browser/smoke.test.mjs': [498, 28], 'browser/perf.test.mjs': [65, 46], 'browser/gfx.test.mjs': [50, 21], 'browser/gfx2.test.mjs': [5, 0], 'browser/world.test.mjs': [17, 22], 'browser/world2.test.mjs': [5, 0], 'browser/memory2.test.mjs': [5, 0], 'browser/smoke2.test.mjs': [5, 0], 'golden.test.js': [5, 12], 'races.test.js': [5, 20] };
let nProg = 0;   // (--kratek: how many tracks)
// The node and fleet suites' long tests (over 3 min): s on GitHub (the jobs »Fizika, AI in dirke« and »Vozila«, 19. 11. 2026, 68 real
// tracks), for their time limit (LIMIT_OF) as SECS for a browser test; without a time they had 15 min, too little on a cloud session's
// machine: races.test.js took 16 min there (it grows with every track: Bâlea alone 8 s), golden 10 min, deli 8 min, more on a slower one
const NODE_SECS = { 'races.test.js': 1381, 'golden.test.js': 843, 'deli.test.js': 484, 'police.test.js': 224, 'browser/fleet.test.mjs': 1070, 'browser/cars-ui.test.mjs': 186 };
const DEF_SECS = 60, secs = (f) => (nProg && PROGA_SECS[f] ? Math.round(PROGA_SECS[f][0] + nProg * PROGA_SECS[f][1]) : SECS[f] || NODE_SECS[f] || DEF_SECS);
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
  [/^js\/menu(-data)?\.js$|^tools\/predogled|^sw\.js$|^\.github\/workflows\/stran\.yml$/, ['predogled.test.js']],   // (the site's previews: main's videos in the menu's vidSrc, main's files of assets/ through the preview's sw.js)
  [/^js\/tracks\/|^docs\/proge\/|^assets\/|^maketa-menija\//, ['testne-proge.test.js']],   // (where the test tracks' files are: frozen until they are deleted, CLAUDE.md »Testne proge«)
  [/^tools\/razdeli-proge\.mjs$|^js\/(game|render|world[\w-]*)\.js$|^js\/tracks\/|^index\.html$/, ['razdelitev.test.js']],   // (the real tracks' own settings and world parts in their own files, docs/razdelitev-prog.md)
  [/^js\/core\.js$/, ['golden.test.js', 'cilj-odprte-ceste.test.js', 'start.test.js', 'quick.test.js', 'repro.test.js', 'nova.test.js', 'trki.test.js', 'serpentine.test.js', 'browser/repro.test.mjs']],
  [/^js\/core\.js$/, ['padec.test.js', 'browser/padec.test.mjs']],   // (the fall over an edge as a body on the ground drawn beyond it, where the track's file has that ground: Killar; docs/trki-realizem.md)
  [/^js\/(render|game|sfx)\.js$|^tools\/posnetek\.mjs$/, ['browser/padec.test.mjs']],   // (that fall drawn, heard, followed by the camera and kept in the replay)
  [/^js\/(core|game|deli)\.js$/, ['videz.test.js']],   // (the car's look without its effects: championship, online, replay file; docs/novosti-e.md Novost 1)
  [/^js\/game\.js$|^index\.html$/, ['lang.test.js', 'browser/quick.test.mjs', 'browser/repro.test.mjs', 'browser/lang.test.mjs', 'browser/nova.test.mjs']],
  [/^js\/(world[\w-]*|render|tex)\.js$/, ['browser/world.test.mjs', 'browser/world2.test.mjs', 'browser/gfx.test.mjs', 'browser/gfx2.test.mjs']],
  [/^js\/world-ljudje[23]?\.js$|^js\/tracks\/|^tools\/ljudje\/|^tests\/lib\/ulice\.js$/, ['ljudje-mesta.test.js', 'browser/ljudje.test.mjs']],   // (the people's scenes and their places: the side roads, the streets, the pit lanes)
  [/^js\/core\.js$/, ['ljudje-mesta.test.js']],   // (the places on Core's track: its side roads, its barriers)
  [/^js\/neskoncna\.js$|^css\/neskoncna\.css$|^tests\/browser\/neskoncna\.test\.mjs$|^js\/tracks\/bathurst\.js$/, ['neskoncna.test.js', 'browser/neskoncna.test.mjs', 'lang.test.js']],   // (the endless drive in the traffic, on Bathurst, docs/neskoncna-voznja.md)
  [/^js\/core\.js$/, ['neskoncna.test.js']],   // (its rules: Endless, the traffic on the loop and its window)
  [/^js\/core\.js$/, ['sovoznik.test.js', 'rally.test.js', 'katu.test.js']],   // (the co-driver's notes of every real open road, a rally stage's and a gravel descent's: Track.paceNotes, docs/sovoznik.md)
  [/^js\/core\.js$|^tests\/lib\/handling\.js$/, ['oprijem.test.js', 'weather.test.js']],   // (the weather's share of the grip and of the brakes: the rain, the winter, the snow, docs/dez-sneg.md)
  [/^js\/game\.js$|^css\/style\.css$|^index\.html$/, ['browser/sovoznik.test.mjs']],   // (the co-driver's caption on the roads, the bend's grade on the corner sign, the switch in the settings)
  [/^js\/(core|comm)\.js$|^js\/data\/sovoznik-en\.js$|^tools\/sovoznik-glas\.py$/, ['sovoznik-glas.test.js']],   // (the co-driver's recorded voice: his words in the sheet, the calls said from it)
  [/^js\/(comm|sfx)\.js$|^js\/data\/sovoznik-en\.js$/, ['browser/sovoznik.test.mjs']],   // (the calls said in the recorded voice, not by the browser's)
  [/^js\/input\.js$/, ['browser/ctrl.test.mjs', 'browser/pad.test.mjs']],
  [/^js\/(render|game)\.js$|^css\/style\.css$/, ['browser/startcam.test.mjs']],   // (the camera before the start: its flights, its six start lights)
  [/^js\/render\.js$/, ['browser/ostrenje.test.mjs']],   // (the sharpening in the post pass: casK)
  [/^js\/render(-vecer)?\.js$/, ['browser/atmos.test.mjs', 'browser/vecer.test.mjs']],   // (the time of day's lights: the evening's, js/render-vecer.js)
  [/^js\/(menu|menu-data)\.js$|^css\/menu\.css$/, ['browser/menu.test.mjs', 'browser/darktip.test.mjs']],
  [/^temni-nacin\.html$/, ['browser/darktip.test.mjs']],
  [/^js\/sence\.js$/, ['browser/menu.test.mjs', 'browser/darktip.test.mjs', 'browser/hud.test.mjs']],
  [/^js\/net\.js$/, ['net-core.test.js', 'browser/online.test.mjs']],
  [/^js\/sfx\.js$/, ['browser/sound.test.mjs', 'browser/okolje.test.mjs']],
  [/^js\/world-zivali\.js$|^tools\/zvoki-pasovi\.mjs$|^js\/comm\.js$/, ['browser/okolje.test.mjs']],   // (the sounds by the road: their zones from the woods and the herds, js/sfx-okolje.js; the commentator cuts the announcer)
  [/^js\/lang\.js$|^js\/tracks\//, ['lang.test.js', 'imena.test.js', 'viri.test.js']],   // (a track's English name and description)
  [/^js\/tracks\/|^js\/core\.js$|^js\/routes\.js$|^tools\/menu-lens\.js$|^assets\/maps\/fly-/, ['menu-lens.test.js']],
  [/^js\/tracks\/|^js\/core\.js$/, ['kariera.test.js', 'kariera-pot.test.js']],   // (the career's path of 1.0 from the real tracks and the classes: its cups, their km, the rewards; docs/kariera-1-0.md)
  [/^js\/game\.js$/, ['browser/kariera-pot.test.mjs']],   // (the path in the game: the menu's bridge to it, an old or a damaged save loaded, a race's end paid; js/kariera.js: by its name)
  [/^js\/tracks\/|^js\/core\.js$/, ['rivals-n.test.js', 'grid.test.js']],   // (the menu's Opponents: the most rivals each track's start and finish take, def.maxRivals)   // (the menu's tables of the tracks' lengths and heights)
  [/^js\/tracks\/|^js\/geo\.js$|^tools\/menu-globe\.mjs$|^assets\/flags\/|^assets\/geo\/earth-s\.webp$/, ['menu-globe.test.js']],   // (the countries: the flags, the globe's outlines and places)
  [/^js\/tracks\/|^js\/menu-data\.js$|^tools\/menu-corner|^assets\/maps\/corner-/, ['menu-corner.test.js', 'browser/menu.test.mjs']],   // (the corner camera: its corners, videos and posters, MENU.corners)
  [/^js\/cars\//, ['kit.test.js', 'deli.test.js', 'fleet.test.js', 'browser/garage.test.mjs', 'browser/cars-ui.test.mjs']],   // (a vehicle must fit the garage's lane, under its door and lamps at 3.3 m, and stand in its place in the car screen's strip by its career price)
  [/^js\/core\.js$/, ['cisterna.test.js', 'zrcalni.test.js']],   // (the semi-trailer: its joint, its AI, its grid, in a race of six rigs)
  [/^js\/core\.js$|^js\/cars\//, ['rezervna-kolesa.test.js']],   // (the spare wheels: off at 80 % of the damage, docs/deli.md »Rezervno kolo«)
  [/^js\/render\.js$|^js\/cars\/(kamen|pescenjak|medved|cisterna)\.js$/, ['browser/rezervna-kolesa.test.mjs']],   // (their rocking from 50 %, their pieces)
  [/^js\/deli\/(barve|skriti)\.js$/, ['deli.test.js', 'deli-barve.test.js', 'browser/deli-barve.test.mjs']],   // (the garage's parts, sklop 3)
  [/^js\/deli(\.js$|\/)|^js\/data\/deli\.js$|^js\/cars\/kolibri\.js$|^tests\/lib\/deli-geo\.js$/, ['deli.test.js', 'deli-pregled.test.js', 'deli-barve.test.js', 'browser/maketa-delov.test.mjs']],   // (the parts on KOLIBRI looked at, sklop 4)
  [/^maketa-delov\/|^js\/render\.js$/, ['browser/maketa-delov.test.mjs']],   // (the parts' viewing page: Render.setShowView)
  [/^js\/replay|^css\/style\.css$/, ['browser/replay.test.mjs']],
  [/^js\/napake\.js$|^css\/napake\.css$/, ['browser/replay.test.mjs']],   // (Označi: the replay's twelfth button)
  [/^js\/input\.js$/, ['browser/napake-zastavice.test.mjs', 'browser/napake-samodejno.test.mjs']],
  [/^tools\/posnetek\.mjs$/, ['browser/napake-posnetek.test.mjs']],
  [/^js\/napake\.js$/, ['voznja.test.js']],   // (AI po tvoji liniji: tools/voznja.mjs reads the recordings by js/napake.js; on GitHub the whole Node suite)
  [/^js\/game\.js$|^tools\/voznja\.mjs$/, ['browser/napake-posnetek.test.mjs']],   // (the recording's header for tools/voznja.mjs, js/game.js rrpOf: the player's car, the tyres, the weather)   // (the recording as a file, opened for Claude)   // (F and the pad's Select: a flag; O: Prikaz za razvijalca)
  [/\.md$/, ['fleet.test.js']],
  [/^README\.md$/, ['viri.test.js']],   // (the credits of every real track)
  [/^tests\/(imena|viri)\.test\.js$|^tests\/lib\/prepovedana-imena\.js$|^js\/cars\//, ['imena.test.js']],   // (the forbidden names in the game's texts, the word list tests/lib/prepovedana-imena.js; the sources of the tracks: viri.test.js)
  [/^tests\/viri\.test\.js$/, ['viri.test.js']],   // (every .md checked for a car maker's name)
  [/^tests\/run\.js$|^\.github\/workflows\//, ['shards.test.js', 'krog.test.js']],
  [/^tests\/lib\/(krog|sim)\.js$/, ['krog.test.js']],   // (the sorting of a change for GitHub's tests, PROGE)
  [/^js\/missions(\.js$|\/)|^css\/missions\.css$/, ['missions.test.js', 'browser/missions.test.mjs']],   // (the special missions: the system and each mission's texts)
  [/^js\/missions\/kit\.js$/, ['m01.test.js', 'browser/m01.test.mjs', 'm49.test.js', 'browser/m49.test.mjs', 'm47.test.js', 'browser/m47.test.mjs', 'm46.test.js', 'browser/m46.test.mjs', 'm19.test.js', 'browser/m19.test.mjs', 'm35.test.js', 'browser/m35.test.mjs', 'm37.test.js', 'browser/m37.test.mjs', 'm48.test.js', 'browser/m48.test.mjs', 'm30.test.js', 'browser/m30.test.mjs', 'm33.test.js', 'browser/m33.test.mjs', 'm53.test.js', 'browser/m53.test.mjs', 'm07.test.js', 'browser/m07.test.mjs', 'm09.test.js', 'browser/m09.test.mjs', 'm43.test.js', 'browser/m43.test.mjs', 'm51.test.js', 'browser/m51.test.mjs', 'm52.test.js', 'browser/m52.test.mjs', 'm54.test.js', 'browser/m54.test.mjs', 'm06.test.js', 'browser/m06.test.mjs', 'm39.test.js', 'browser/m39.test.mjs', 'm50.test.js', 'browser/m50.test.mjs', 'm34.test.js', 'browser/m34.test.mjs', 'm55.test.js', 'browser/m55.test.mjs', 'm10.test.js', 'browser/m10.test.mjs', 'm02.test.js', 'browser/m02.test.mjs', 'm04.test.js', 'browser/m04.test.mjs', 'm08.test.js', 'browser/m08.test.mjs', 'm17.test.js', 'browser/m17.test.mjs', 'm26.test.js', 'browser/m26.test.mjs', 'm11.test.js', 'browser/m11.test.mjs', 'm23.test.js', 'browser/m23.test.mjs', 'm29.test.js', 'browser/m29.test.mjs', 'm40.test.js', 'browser/m40.test.mjs', 'm45.test.js', 'browser/m45.test.mjs']],   // (the missions' shared kit: the fire engine, the fire, the water, the aim; group 3's water, the boat, the skins; group 5's keys, towTrailer, tow, brakes, escort; group 6's ride, herd, trailer, hospital; group 7's road both ways)
  [/^tests\/lib\/drive\.js$|^tests\/browser\/misdrive\.mjs$/, ['m39.test.js', 'browser/m39.test.mjs', 'm50.test.js', 'browser/m50.test.mjs', 'm34.test.js', 'browser/m34.test.mjs', 'm55.test.js', 'browser/m55.test.mjs', 'm10.test.js', 'browser/m10.test.mjs', 'm02.test.js', 'browser/m02.test.mjs']],   // (the missions' drivers for the tests)
  [/^js\/zabava(\.js$|\/)|^css\/zabava\.css$/, ['zabava.test.js', 'browser/zabava.test.mjs', 'lang.test.js']],   // (Zabava: the novelties, docs/zabava.md)
  [/^js\/shramba\.js$/, ['browser/share.test.mjs']],   // (the saved game kept safe: the profile file and its import go through it)
  [/^js\/render\.js$/, ['browser/marks.test.mjs', 'browser/sledi.test.mjs']],
  [/^js\/core\.js$|^js\/data\/voznja\.js$/, ['zgumirana-linija.test.js']],   // (the rubbered-in line by the player's driving: the line itself and the driving not changed, docs/zgumirana-linija.md)
  [/^js\/(render|game)\.js$|^js\/data\/voznja\.js$/, ['browser/zgumirana-linija.test.mjs']],   // (... its layer and marbles in the page, the frozen tracks without it)
  [/^js\/denar\.js$|^js\/garage\.js$|^(index|garaza)\.html$/, ['browser/denar.test.mjs']],   // (the test money in the address, ?denar: read before the career, the garage on Kariera)
  [/^js\/(tester|game)\.js$|^(index|garaza)\.html$/, ['browser/tester.test.mjs']],   // (Test s prijatelji: sends only with ?tester=<code> and consent, never in a test's browser)
  [/^js\/(garage|game)\.js$|^garaza\.html$/, ['browser/denarnica.test.mjs']],   // (the garage's real profile: the career's coins, cars and upgrades, shared with the game)   // (the tyre marks of the last runs and a friend's: Render.setOldMarks)
  [/^js\/nv(boat|water)\.js$/, ['browser/nvwater.test.mjs', 'browser/newver.test.mjs']],   // (the water course's bed, its jet skis at the pier, driving on the water)
  [/^assets\/landmarks\/|^tools\/znamenitost\/|^js\/vendor\/three/, ['znamenitost.test.js']],   // (the landmarks made in Blender: their budget, no pictures, their faces turned outwards, the game's reader)
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
const git = (...a) => { const r = spawnSync('git', a, { encoding: 'utf8', cwd: path.join(__dirname, '..'), maxBuffer: 256 * 1024 * 1024 }); return r.status === 0 ? r.stdout.trim() : null; };
function mainBase(head = 'HEAD') {
  const refs = ['origin/main', 'main'].filter(r => git('rev-parse', '--verify', '--quiet', r) != null);
  if (!refs.length) { console.error('no main branch to compare with (git fetch origin main)'); process.exit(2); }
  // (the newer of the two where they differ, one of them not fetched for a while; a shallow clone without the common commit: against main as it is)
  const bases = refs.map(r => git('merge-base', head, r) || r);
  return bases.reduce((a, b) => git('merge-base', '--is-ancestor', a, b) != null ? b : a);
}
function changedFiles() {
  const base = mainBase();
  return [...new Set([git('diff', '--name-only', base), git('ls-files', '--others', '--exclude-standard')].join('\n').split('\n').filter(Boolean))];
}
// --koda: the fingerprint of the code the tests test, the committed tree of the repository the command runs in: every file's path, mode and
// content but the .md ones (documents, which only the tests of MD_TESTS read), except KODA_MD, which a test reads as data. GitHub's run
// (.github/workflows/tests.yml) records it when every job has passed; a later run of the same fingerprint (only documents changed:
// docs/vrsta.md, a plan, README.md; or main after merging a pull request whose code passed) runs only MD_TESTS (--dokumenti)
const KODA_MD = ['docs/gorske-proge.md'];   // (the table of the mountain roads: tests/lib/gore.js)
// the tests that read .md files they do not name, listing the repository's files: the car makers' names in every file, the frozen files of
// the test tracks (docs/proge/<id>.md among them). Every test that lists the repository's files is here (tests/shards.test.js checks)
const MD_TESTS = ['fleet.test.js', 'testne-proge.test.js', 'viri.test.js'];
function koda(ref = 'HEAD') {
  const r = spawnSync('git', ['ls-tree', '-r', '-z', '--full-tree', ref], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  if (r.status !== 0) { console.error('--koda: ' + ((r.stderr || '').trim() || 'git ls-tree failed')); process.exit(2); }
  const kept = r.stdout.split('\0').filter(e => { const f = e.slice(e.indexOf('\t') + 1); return e && (!/\.md$/.test(f) || KODA_MD.includes(f)); });
  return require('crypto').createHash('sha256').update(kept.join('\0')).digest('hex');
}

const args = process.argv.slice(2), opt = { which: null, shard: null, list: false, quiet: false, related: false, files: null, koda: false, dokumenti: false, krog: false, base: null, head: null, github: false, kratek: null, vzrok: false, od: null, padli: null };
for (let i = 0; i < args.length; i++) {
  const val = () => (args[i + 1] !== undefined && !args[i + 1].startsWith('--') ? args[++i] : '');   // (an empty value too: --od "")
  if (args[i] === '--shard') opt.shard = val();
  else if (args[i] === '--list') opt.list = true; else if (args[i] === '--quiet') opt.quiet = true; else if (args[i] === '--related') opt.related = true;
  else if (args[i] === '--koda') opt.koda = true; else if (args[i] === '--dokumenti') opt.dokumenti = true;
  else if (args[i] === '--files') opt.files = val().split(',').map(f => f.trim()).filter(Boolean);
  else if (args[i] === '--krog') opt.krog = true; else if (args[i] === '--github') opt.github = true; else if (args[i] === '--vzrok') opt.vzrok = true;
  else if (args[i] === '--base') opt.base = val(); else if (args[i] === '--head') opt.head = val();
  else if (args[i] === '--od') opt.od = val(); else if (args[i] === '--padli') opt.padli = val(); else if (args[i] === '--kratek') opt.kratek = val();
  else if (!opt.which && !args[i].startsWith('--')) opt.which = args[i]; else { console.error('unexpected argument: ' + args[i]); process.exit(2); }
}
const others = (...keep) => Object.keys(opt).filter(k => !keep.includes(k) && opt[k] !== null && opt[k] !== false);
if (opt.files && !opt.related && opt.kratek == null) { console.error('--files goes with --related or --kratek'); process.exit(2); }
if (opt.koda) { if (others('koda').length) { console.error('--koda goes alone'); process.exit(2); } console.log(koda()); process.exit(0); }
if (opt.dokumenti && others('dokumenti', 'list', 'quiet').length) { console.error('--dokumenti goes alone (or with --list, --quiet)'); process.exit(2); }

// --krog: which tests the commits from base to head need (tests/lib/krog.js); --github: as the outputs of the step (vrsta, proge, datoteke)
if (opt.krog) {
  if (others('krog', 'base', 'head', 'github').length) { console.error('--krog goes alone (or with --base <ref>, --head <ref>, --github)'); process.exit(2); }
  const head = opt.head || 'HEAD', base = opt.base || mainBase(head);
  let r;
  try { r = require('./lib/krog.js').razvrsti({ base, head, kodaMd: KODA_MD }); }
  catch (e) { r = { vrsta: 'vse', proge: [], datoteke: [], zakaj: ['not sorted, so every test: ' + e.message.split('\n')[0]] }; }
  const kr = (ref) => git('rev-parse', '--short=8', ref) || ref;
  console.log(`${kr(base)}..${kr(head)}: ${r.datoteke.length} file${r.datoteke.length === 1 ? '' : 's'} changed: ${r.vrsta}${r.proge.length ? ` (${r.proge.join(', ')})` : ''}`);
  for (const z of r.zakaj.slice(0, 12)) console.log('- ' + z);
  if (r.zakaj.length > 12) console.log(`- … ${r.zakaj.length - 12} more`);
  const kratek = r.vrsta === 'proge';
  if (opt.github && process.env.GITHUB_OUTPUT) require('fs').appendFileSync(process.env.GITHUB_OUTPUT, `vrsta=${r.vrsta}\nproge=${kratek ? r.proge.join(',') : ''}\ndatoteke=${kratek ? r.datoteke.join(',') : ''}\n`);
  process.exit(0);
}

// --vzrok: after a red nightly round, the merges into main since the last green one (--od; without it the last 30) and which of the failed
// tests (--padli: a file, a name a line; TEST_PADLI of the jobs) each changed something of, by the names and RELATED as --related goes
if (opt.vzrok) {
  if (others('vzrok', 'od', 'padli').length) { console.error('--vzrok goes alone (or with --od <sha>, --padli <file>)'); process.exit(2); }
  const fs = require('fs'), all = [...new Set([...SUITES.node, ...SUITES.fleet, ...SUITES.browser])];
  const padli = opt.padli && fs.existsSync(opt.padli) ? [...new Set(fs.readFileSync(opt.padli, 'utf8').split('\n').map(s => s.trim()).filter(Boolean))] : [];
  const od = opt.od && git('rev-parse', '--verify', '--quiet', opt.od + '^{commit}');
  const shas = ((od ? git('rev-list', '--first-parent', `${od}..HEAD`) : git('rev-list', '--first-parent', '--max-count=30', 'HEAD')) || '').split('\n').filter(Boolean);
  console.log('### Vzrok: združitve na `main` od zadnjega zelenega nočnega kroga\n');
  console.log(od ? `Zadnji zeleni nočni krog: \`${od.slice(0, 8)}\` (${git('log', '-1', '--format=%ci', od)}); od takrat ${shas.length} commitov na \`main\`.`
    : `Zadnji zeleni nočni krog ni znan${opt.od ? ` (\`${opt.od.slice(0, 8)}\` ni v zgodovini)` : ''}: zadnjih ${shas.length} commitov na \`main\`.`);
  console.log(padli.length ? `Padli testi: ${padli.map(t => '`' + t + '`').join(', ')}.\n` : 'Imen padlih testov ni (posel je padel zunaj testov: glej njegov dnevnik).\n');
  console.log('| Združitev | Spremenjeno | Povezani padli testi |\n|---|---|---|');
  const krivci = new Map();
  for (const c of shas) {
    const subj = git('log', '-1', '--format=%s', c) || '', pr = (/\(#(\d+)\)\s*$/.exec(subj) || /^Merge pull request #(\d+)/.exec(subj) || [])[1];
    const files = (git('diff', '--no-renames', '--name-only', c + '^1', c) || '').split('\n').filter(Boolean);
    const areas = [...new Set(files.map(f => f.split('/').slice(0, f.startsWith('js/') || f.startsWith('tests/') ? 2 : 1).join('/')))];
    const hit = padli.filter(t => all.includes(t) ? related(files, [t]).length : files.some(f => f.replace(/^tests\//, '') === t));
    if (hit.length) krivci.set(pr ? '#' + pr : c.slice(0, 8), hit);
    const esc = (t) => t.replace(/\|/g, '\\|');
    console.log(`| ${pr ? '#' + pr + ' ' : ''}${esc(subj.slice(0, 90))} (\`${c.slice(0, 8)}\`) | ${files.length}: ${esc(areas.slice(0, 6).join(', '))}${areas.length > 6 ? ' …' : ''} | ${hit.map(t => '`' + t + '`').join(', ') || '–'} |`);
  }
  const brez = padli.filter(t => ![...krivci.values()].some(h => h.includes(t)));
  console.log('');
  if (krivci.size) console.log(`**Verjetni krivci** (spremenili so, kar padli testi preverjajo): ${[...krivci].map(([k, h]) => `${k} (${h.join(', ')})`).join('; ')}.`);
  if (brez.length) console.log(`Brez povezave po imenih: ${brez.map(t => '`' + t + '`').join(', ')}: preveri združitve s skupno kodo (\`js/core.js\`, \`js/render.js\`, \`js/world*.js\`, \`js/game.js\`, testi).`);
  process.exit(0);
}

const which = opt.which;
let list;
if (opt.kratek != null) {
  // the short round (tests/lib/krog.js: a change of only these tracks): the related tests of the files (--files, or what changed against
  // main) and the tests over every track (PO_PROGAH) only on these tracks (PROGE), testne-proge.test.js always; node: those without the
  // browser, browser: those in it (the suites' tests; shares by their times with these tracks, PROGA_SECS)
  const ids = opt.kratek.split(',').map(s => s.trim()).filter(Boolean);
  if (!ids.length || others('kratek', 'files', 'which', 'shard', 'list', 'quiet').length || (which && !['node', 'browser'].includes(which))) { console.error('--kratek <id,id> [--files a,b] [node|browser] [--shard k/n] [--list] [--quiet]'); process.exit(2); }
  process.env.PROGE = ids.join(','); nProg = ids.length;
  const all = [...new Set([...SUITES.node, ...SUITES.fleet, ...SUITES.browser])], files = opt.files || changedFiles(), rel = related(files, all);
  list = all.filter(t => (rel.includes(t) || PO_PROGAH.includes(t) || t === 'testne-proge.test.js') && (!which || (which === 'browser') === t.startsWith('browser/')));
  console.log(`the short round of ${ids.join(', ')} (PROGE), ${files.length} changed file${files.length === 1 ? '' : 's'}: ${list.length} test${list.length === 1 ? '' : 's'}${which ? ' (' + which + ')' : ''}`);
} else {
  list = opt.dokumenti ? MD_TESTS : which ? SUITES[which] : [...SUITES.node, ...SUITES.fleet, ...SUITES.browser];
  if (!list) { console.error('unknown suite: ' + which + ' (node | fleet | browser)'); process.exit(2); }
}
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
const LIMIT_OF = (f) => Math.round(Math.max((/memory2?\.test/.test(f) ? 3 : /smoke2?\.test|perf\.test|browser\/fleet\.test|browser\/garage\.test/.test(f) ? 2 : 1) * LIMIT, SLOW * secs(f) * 1000) / 60000) * 60000;   // (the memory test: three times; in whole minutes)
// How many tests at once (22. 11. 2026, »npm run test:related se obesi«: one after another a session's 59 related tests took 48 min, longer
// than its command may run, and --quiet printed nothing before the end, so it was stopped with no word of what failed): TEST_JOBS (default:
// half the processors, at least 1; on GitHub 1, its shares are timed one after another, SECS), of them at most TEST_BROWSER_JOBS browser
// tests (default 1: each draws with software WebGL on several threads). Each test still in its own process, its output kept and printed
// whole when it ends (one at a time: straight through, as before)
const JOBS = Math.max(1, Math.floor(+process.env.TEST_JOBS || (process.env.GITHUB_ACTIONS ? 1 : require('os').cpus().length / 2)));
const BROWSER_JOBS = Math.max(1, Math.min(JOBS, Math.floor(+process.env.TEST_BROWSER_JOBS || 1)));
// every minute without a word, the tests still running and how long (a hung one is seen before its limit); TEST_UTRIP: s, 0 = never
const BEAT = (process.env.TEST_UTRIP != null ? +process.env.TEST_UTRIP : 60) * 1000;

const results = new Array(list.length), running = new Map(), t00 = Date.now();
let lastWord = Date.now(), done = 0;
const say = (s) => { process.stdout.write(s + '\n'); lastWord = Date.now(); };
const sec = (t) => ((Date.now() - t) / 1000).toFixed(0);
// a test runs in its own process group (detached), so a stopped test takes its browser and the browser's helpers with it: none is left
// holding the output pipe or the processors (a test killed alone left Chromium running, the next tests slower)
const killGroup = (ch) => { try { process.kill(-ch.pid, 'SIGKILL'); } catch (e) { try { ch.kill('SIGKILL'); } catch (e2) { /* gone */ } } };
function run(i) {
  const f = list[i], t0 = Date.now(), live = JOBS === 1 && !opt.quiet, out = [];
  if (live) say(`\n### ${f}`);
  return new Promise((resolve) => {
    const ch = spawn(process.execPath, [path.join(__dirname, f)], { stdio: live ? ['ignore', 'inherit', 'inherit'] : ['ignore', 'pipe', 'pipe'], detached: true });
    running.set(f, { ch, t0 });
    if (!live) { ch.stdout.on('data', d => out.push(d)); ch.stderr.on('data', d => out.push(d)); }
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; killGroup(ch); }, LIMIT_OF(f));
    ch.on('error', (e) => out.push(Buffer.from(`\n${e.message}\n`)));
    ch.on('close', (code, signal) => {
      clearTimeout(timer); running.delete(f); killGroup(ch);   // (and what it left behind)
      const ok = code === 0 && !timedOut, s = sec(t0), text = Buffer.concat(out).toString('utf8');
      done++;
      if (!live && !opt.quiet) say(`\n### ${f}\n${text.replace(/\n$/, '')}`);
      if (opt.quiet && !ok) {   // (quiet: a failed test's FAIL lines and its last lines, a stack trace among them)
        const lines = text.split('\n').filter(l => l.trim() && !/^OK\b/.test(l)), fails = lines.filter(l => /\bFAIL\b/.test(l));
        say(`\n### ${f}`); for (const l of [...new Set([...fails.slice(0, 40), ...lines.slice(-15)])]) say(l);
      }
      if (timedOut) say(`FAIL ${f}: stopped after ${LIMIT_OF(f) / 60000} min (TEST_TIMEOUT_MIN, TEST_SLOW)`);
      if (opt.quiet || !live) say(`${ok ? 'OK  ' : 'FAIL'} [${done}/${list.length}] ${f} (${s} s)`);   // (each test as it ends, not only at the end)
      results[i] = { f, ok, s, timedOut };
      if (!ok && process.env.GITHUB_ACTIONS) say(`::error title=${f}::${timedOut ? `stopped after ${LIMIT_OF(f) / 60000} min` : `exit ${code != null ? code : signal}`} (${s} s)`);   // (on GitHub: an annotation of the check run, readable where the job's log is not)
      resolve();
    });
  });
}
function summary(stopped) {
  const res = results.filter(Boolean);
  say(`\n=== summary${stopped ? ` (stopped by ${stopped}: ${res.length} of ${list.length} tests ended)` : ''}`);
  for (const r of res) if (!opt.quiet || !r.ok) say(`${r.ok ? 'OK  ' : 'FAIL'} ${r.f} (${r.s} s)${r.timedOut ? ' — timed out' : ''}`);
  for (const [f, { t0 }] of running) say(`FAIL ${f} (${sec(t0)} s) — not ended, stopped with the run`);
  if (opt.quiet) say(`${res.filter(r => r.ok).length} of ${list.length} tests passed (${res.reduce((a, r) => a + +r.s, 0)} s of tests, ${sec(t00)} s in all${JOBS > 1 ? `, ${JOBS} at once` : ''})`);
  else if (JOBS > 1) say(`(${sec(t00)} s in all, ${JOBS} tests at once)`);
  const bad = [...res.filter(r => !r.ok).map(r => r.f), ...running.keys()];
  if (process.env.TEST_PADLI && bad.length) require('fs').appendFileSync(process.env.TEST_PADLI, bad.join('\n') + '\n');
  return bad.length || res.length < list.length ? 1 : 0;
}
// the run itself stopped (Ctrl+C, a session's command out of time): its tests with it, and the summary of what ended
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sig, () => { const code = summary(sig); for (const { ch } of running.values()) killGroup(ch); process.exit(code || 1); });
process.on('exit', () => { for (const { ch } of running.values()) killGroup(ch); });

(async () => {
  if (JOBS > 1 && list.length > 1) say(`${list.length} tests, ${JOBS} at once (TEST_JOBS; browser ${BROWSER_JOBS}, TEST_BROWSER_JOBS)`);
  const beat = BEAT > 0 && setInterval(() => {
    if (running.size && Date.now() - lastWord >= BEAT) say(`… ${sec(t00)} s: ${[...running].map(([f, { t0 }]) => `${f} ${sec(t0)} s`).join(', ')}`);
  }, Math.min(BEAT, 10000));
  // the longest first (SECS), so the run does not end on one long test alone; the browser tests at most BROWSER_JOBS at once
  const order = list.map((f, i) => i);
  if (JOBS > 1) order.sort((a, b) => secs(list[b]) - secs(list[a]) || a - b);
  const isB = (i) => list[i].startsWith('browser/');
  await new Promise((resolveAll) => {
    const next = () => {
      if (!order.length && !running.size) return resolveAll();
      while (running.size < JOBS && order.length) {
        const nB = [...running.keys()].filter(f => f.startsWith('browser/')).length;
        const k = order.findIndex(i => !isB(i) || nB < BROWSER_JOBS);
        if (k < 0) break;
        const i = order.splice(k, 1)[0];
        run(i).then(next);
      }
    };
    next();
  });
  if (beat) clearInterval(beat);
  process.exit(summary());
})();
