# (pictures only) eb7-D ribbons cleaned for the kerb joins (user 19. 10. night: "popravi da se robniki lepo združijo med sabo tam kjer se
# združujejo"): the park road's line turns back on itself at its east end (a hook inside the circuit's asphalt) - its edge past the hook's top
# is dropped; the lane's and the park road's edge (line too) ends where it runs into the circuit's asphalt -> eb7-D2-ribbons.json
import json, base64, numpy as np
from scipy.spatial import cKDTree
from roadmask import per_line
from mk18_helpers import sst
LN = {n: (P, hw) for n, k, P, hw in per_line() if n in ('T', 'bend', 'jump')}
def dense(A, step, closed):
    if closed: A = np.vstack([A, A[:1]])
    seg = np.hypot(*(A[1:] - A[:-1]).T); cum = np.r_[0, np.cumsum(seg)]; sd = np.arange(0, cum[-1], step)
    return np.stack([np.interp(sd, cum, A[:, 0]), np.interp(sd, cum, A[:, 1])], 1)
TD = dense(LN['T'][0], 0.05, True); KT = cKDTree(TD); HWT = LN['T'][1]
KS = {k: cKDTree(dense(LN[k][0], 0.05, False)) for k in ('bend', 'jump')}
P = LN['bend'][0]; seg = np.hypot(*(P[1:] - P[:-1]).T); cum = np.r_[0, np.cumsum(seg)]; S_TOP = cum[115]      # (the hook's top: (89.9, -79.1))
R = json.load(open('eb7-D-ribbons.json')); cut = 0
for r in R:
    if r['road'] not in ('bend', 'jump'): continue
    p = np.frombuffer(base64.b64decode(r['p']), np.float32).reshape(r['n'], r['nr'], 2)
    a = np.frombuffer(base64.b64decode(r['a']), np.uint8).reshape(r['n'], r['nr']).astype(np.float32)
    eT = KT.query(p.reshape(-1, 2))[0].reshape(r['n'], r['nr']) - HWT
    f = sst(-0.45, -0.1, eT)      # (inside the circuit's asphalt: nothing)
    if r['road'] == 'bend': f[np.arange(r['n']) * 0.5 > S_TOP - 0.25] = 0.0
    OFF = {'S': [-0.12, 2.16, 2.2], 'L': [-0.36, -0.34, -0.12, -0.10], 'K': [0.0, 0.55, 0.575, 0.97, 0.995, 1.125, 1.48, 1.5], 'B': [round(o_, 2) for o_ in np.arange(0.2, 2.2 + 0.61, 0.2)]}[r['kind']]; assert len(OFF) == r['nr'], (r['kind'], len(OFF), r['nr'])
    Pr, hwr = LN[r['road']]; dS = KS[r['road']].query(p.reshape(-1, 2))[0].reshape(r['n'], r['nr'])
    f[dS < hwr + np.array(OFF)[None, :] - 0.5] = 0.0      # (a point swung in over its own road's asphalt - by the hook's turn: nothing)
    b = (a * f).round(); cut += int(((a > 0) & (b == 0)).sum()); r['a'] = base64.b64encode(np.clip(b, 0, 255).astype(np.uint8).tobytes()).decode()
json.dump(R, open('eb7-D2-ribbons.json', 'w')); print('cut', cut)
