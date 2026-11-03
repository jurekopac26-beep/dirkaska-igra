// index.html and garaza.html link only files that exist, and without content stamps (?v=…): the repo keeps its pages unstamped,
// publishing and the tests' web server add the stamps (tools/stamp.js). Fails when a merge brought old stamps back: node tools/stamp.js
'use strict';
const { spawnSync } = require('child_process');
const path = require('path');
const r = spawnSync(process.execPath, [path.join(__dirname, '..', 'tools', 'stamp.js'), '--check'], { stdio: 'inherit', env: process.env });
process.exit(r.status);
