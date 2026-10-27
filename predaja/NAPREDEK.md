# Napredek: združevanje vej boksi v claude/boksi-vse

Zapis po korakih (veja, združitveni commit, spori in rešitev, test). Okolje: za brskalniške teste je v tej sandbox napravi
simbolna povezava `/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell` -> nameščeni 1243 (izven repozitorija).

1. origin/main (#177): spori v `index.html` (žigi; po `node tools/stamp.js`), `js/game.js` (recStart: `flags` in `pit` skupaj; `rpPoseAll(t,i)` iz main + `rpPit(t)`/`crewSnap`/`rdt` iz boksi-posnetek v novem `replayFrame`; ob zanki Zastavic `crewSnap`, `rdt` ne pod 0), `js/input.js` (return: `buzz*`/`haptics` in `onFlag`), `tests/run.js` (seznama: obe strani). Testi: pits 27/27, pitreplay 18/18, napake-zastavice 15/15 zeleni.
