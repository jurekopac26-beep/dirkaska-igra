// restart (18. 10.), the rest: + the motocross start blend, the big lot without its cars; everything the pictures of 17. 10. had (box, fix17, site earth F3 + fence A1, holes, fans, ground clean-up, no touch buttons,
// light sand / makadam, the beach extension, its umbrellas, the edges, one grass, the sea, fence gaps, the train lifted, the tunnel strip); check views
import fs from 'fs';
const SP = '/tmp/claude-0/-home-user-dirkaska-igra/2bb27175-330b-5cd8-945e-d44eb8d706b8/scratchpad/';
const P = (f) => ({ probe: fs.readFileSync(SP + f, 'utf8') });
const HIDE = `(() => { let s = document.getElementById('nobtn-css'); if (!s) { s = document.createElement('style'); s.id = 'nobtn-css'; s.textContent = '#touch{display:none !important}'; document.head.appendChild(s); } return 'hid'; })()`;
const L = [P('box3-page.js'), P('carfix-page.js'), P('fix17-page.js'), { probe: 'window.__SEARTH && window.__SEARTH(2)' }, P('pal4-page.js'), { probe: 'window.__PAL4(0)' }, P('carfix-page.js'),
  P('holes-page.js'), P('fans-page.js'), P('jn-page.js'), { probe: HIDE }, P('mk18-page.js'), P('bx-page.js'), P('bxp-page.js'), P('edge-page.js'), P('gr18-page.js'), P('sea18-page.js'), P('gap2-page.js'), P('lift-page.js'), P('tunp-page.js'),
  P('mxsoft-page.js'), P('carsoff-page.js')];
export default { tag: 'rt6', list: L };
