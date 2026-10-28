// restore after rt8 (q773), 19. 10. evening (3): the layers in the order they were laid that evening (superseded debug passes left out:
// trikerb 1-4, widek 1, fillet, lawn3); copy to live/q<N>.mjs after the rt1..rt8 copies
import fs from 'fs';
const SP = '/tmp/claude-0/-home-user-dirkaska-igra/2bb27175-330b-5cd8-945e-d44eb8d706b8/scratchpad/';
const P = (f) => ({ probe: fs.readFileSync(SP + f, 'utf8') });
export default { tag: 'rt10', list: ['ebfog', 'grcut', 'terr', 'sandcut', 'terr2', 'sand2', 'xing', 'lawn2', 'xing2', 'xing3', 'terr3', 'c2', 'c3', 'grcut2', 'stub5', 'terr4', 'lawn4', 'stub6', 'filler2', 'xing4', 'rwk', 'trikerb5', 'widek2', 'terr5', 'notch', 'bank', 'rimfill', 'kerbclean'].map(n => P(n + '-page.js')) };
