// index.html links every local script/stylesheet with the current content stamp (see tools/stamp.js), and every
// linked file exists. Fails when a js/css file changed but `node tools/stamp.js` was not run.
'use strict';
const { spawnSync } = require('child_process');
const path = require('path');
const r = spawnSync(process.execPath, [path.join(__dirname, '..', 'tools', 'stamp.js'), '--check'], { stdio: 'inherit', env: process.env });
process.exit(r.status);
