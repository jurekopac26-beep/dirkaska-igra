import fs from 'fs';
const SP = '/tmp/claude-0/-home-user-dirkaska-igra/2bb27175-330b-5cd8-945e-d44eb8d706b8/scratchpad/';
const P = (f) => ({ probe: fs.readFileSync(SP + f, 'utf8') });
export default { tag: 'rt4', list: [P('heli8-page.js'), P('carfix-page.js'), P('fix16-page.js'), P('carfix-page.js'), P('pal4-page.js'), { probe: 'window.__PAL4(0)' }, P('lot2-page.js'), P('carfix-page.js')] };
