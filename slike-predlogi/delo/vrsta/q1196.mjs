// restart, the layers of 18. 10.: beach, old sand, edges/kerb/tracks; the start gate moved and turned; its blend; the site's dark patch
import fs from 'fs';
const SP = '/tmp/claude-0/-home-user-dirkaska-igra/2bb27175-330b-5cd8-945e-d44eb8d706b8/scratchpad/';
const P = (f) => ({ probe: fs.readFileSync(SP + f, 'utf8') });
export default { tag: 'rt7', list: [P('paint-beach-page.js'), P('paint-oldsand-page.js'), P('eb2-page.js'), P('movegate-page.js'), P('rotgate-page.js'), P('mxsoft-page.js'),
  P('paint-sitedark-page.js'), { probe: 'window.__MXS && window.__MXS(1)' }, { probe: 'window.__EDGEB && window.__EDGEB(1)' }] };
