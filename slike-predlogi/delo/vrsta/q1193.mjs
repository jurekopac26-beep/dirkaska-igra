import fs from 'fs';
const SP = '/tmp/claude-0/-home-user-dirkaska-igra/2bb27175-330b-5cd8-945e-d44eb8d706b8/scratchpad/';
const P = (f) => ({ probe: fs.readFileSync(SP + f, 'utf8') });
const ST = `(() => { const S = __H3.st || {}, out = []; for (const [k, st] of Object.entries(S)) { if (!st) continue; const q = st.ring || st.entry || st.spot || (st.spots && st.spots[0]); out.push(k + ':' + (q ? (+q.x).toFixed(1) + ',' + (+q.z).toFixed(1) : '-') + (st.col != null ? ' c' + new THREE.Color(st.col).getHexString() : '') + ' [' + Object.keys(st).slice(0, 12).join(',') + ']'); } return out.join(' | ').slice(0, 3900); })()`;
export default { tag: 'rt3', list: [P('trans-page.js'), P('glass2-page.js'), P('heli4-page.js'), { probe: 'window.__TRF(1); window.__FNE(2); window.__GLB2 && window.__GLB2(0); window.__SB2(3); window.__HSHOT && window.__HSHOT(0); window.__HV && window.__HV(-1); 1' }, { probe: ST }] };
