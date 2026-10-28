import fs from 'fs';
const SP = '/tmp/claude-0/-home-user-dirkaska-igra/2bb27175-330b-5cd8-945e-d44eb8d706b8/scratchpad/';
const P = (f) => ({ probe: fs.readFileSync(SP + f, 'utf8') });
// restore (19. 10. evening): the clean-up masks, the apron lawn, edge v7 (version 1), then the asphalt patch (after nosand6), the paint cut, the path stub, the grass under it
export default { tag: 'rt8D3', list: [P('nosand6-page.js'), P('apron-page.js'), P('eb7-D3-page.js'), { probe: 'window.__EDGEB && window.__EDGEB(1)' }, P('tpatch-page.js'), P('paintcut-page.js'), P('stub3-page.js'), P('stub4-page.js'), P('filler-page.js')] };
