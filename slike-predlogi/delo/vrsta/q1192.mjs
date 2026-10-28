import fs from 'fs';
const SP = '/tmp/claude-0/-home-user-dirkaska-igra/2bb27175-330b-5cd8-945e-d44eb8d706b8/scratchpad/';
const P = (f) => ({ probe: fs.readFileSync(SP + f, 'utf8') });
export default { tag: 'rt2', list: [P('water2-page.js'), P('sbeach4-page.js'), P('water3-page.js'), P('coastne-page.js'), P('farmne4-page.js')] };
