// restore after rt8D2, 19. 10. night: rt11's layers + the NW crossing (xing5, the asphalt hole patched under it: xing6), the stray paint line (wstub), the kerb joins (kerbjoin, before kerbclean)
// (superseded debug passes left out: trikerb 1-5, widek 1, fillet, lawn3); copy to live/q<N>.mjs after the rt1..rt7 copies and rt8D2
import fs from 'fs';
const SP = '/tmp/claude-0/-home-user-dirkaska-igra/2bb27175-330b-5cd8-945e-d44eb8d706b8/scratchpad/';
const P = (f) => ({ probe: fs.readFileSync(SP + f, 'utf8') });
export default { tag: 'rt12', list: ['ebfog', 'grcut', 'terr', 'sandcut', 'terr2', 'sand2', 'xing', 'lawn2', 'xing2', 'xing3', 'terr3', 'c2', 'c3', 'grcut2', 'stub5', 'terr4', 'lawn4', 'stub6', 'filler2', 'xing4', 'rwk', 'trikerb6', 'widek2', 'terr5', 'tongue', 'notch', 'bank', 'rimfill', 'xing5', 'xing6', 'wstub', 'kerbjoin', 'kerbclean'].map(n => P(n + '-page.js')) };
