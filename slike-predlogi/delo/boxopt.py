# three new layouts for the motocross box right by the ring road, each with a paved way in from the road and a paved way out to it
# (user, 18. 10.: "boksi pri cross progi naj imajo uvoz in izvoz na glavno cesto asfaltirano in so takoj ob glavni cesti; naredi 3 opcije
# garaže nove postavitve direkt ob progi z uvozom in izvozom v asfaltu"). Road frame: s along the road's line (south = +s), d across it
# (west = +d, the motocross side). 1: a lay-by in front of the box; 2: a drive-through box (back opened) on its own lane past an island;
# 3: a pit lane behind a painted island with three boxes in a row. Southbound traffic keeps right (the west lane): in at the north, out south.
import json, math, numpy as np
R = json.load(open('nord-mx.json')); P = np.array(R['P'], float); HW = R['wd'] / 2
SS = np.r_[0, np.cumsum(np.hypot(*(P[1:] - P[:-1]).T))]
def frame(s):
    x = np.interp(s, SS, P[:, 0]); z = np.interp(s, SS, P[:, 1])
    a = np.array([np.interp(s - 1, SS, P[:, 0]), np.interp(s - 1, SS, P[:, 1])]); b = np.array([np.interp(s + 1, SS, P[:, 0]), np.interp(s + 1, SS, P[:, 1])])
    t = (b - a) / np.linalg.norm(b - a); return np.array([x, z]), t, np.array([-t[1], t[0]])      # (n: west)
def at(s, d): c, t, n = frame(s); return c + d * n
s0 = float(SS[np.argmin(np.abs(P[:, 1] + 272))])
REF = (-304.97, -271.85); BW, BD = 12.3, 11.5          # the box (as BOX3 left it: door facing +x): its centre, width (along the door), depth
ease = lambda u: 0.5 - 0.5 * math.cos(math.pi * min(max(u, 0.0), 1.0))
def box(s, dc, face, sx=1.0, sz=1.0, open_back=False):
    c, t, n = frame(s); p = c + dc * n; f = {'road': -n, 'north': -t}[face]
    return {'tx': round(float(p[0]), 3), 'tz': round(float(p[1]), 3), 'phi': round(math.atan2(-f[1], f[0]), 5), 'sx': sx, 'sz': sz, 'open': open_back}
def strip(s_list, rows):
    """rows: functions s -> list of (d, alpha); same count for every s"""
    pos, al = [], []; nr = None
    for s in s_list:
        rr = rows(s); nr = len(rr)
        for d, a in rr: x, z = at(s, d); pos += [round(float(x), 3), round(float(z), 3)]; al.append(int(round(max(0, min(1, a)) * 255)))
    return {'n': len(s_list), 'nr': nr, 'p': pos, 'a': al}
def line(pts, w):
    """a white line along world points, as triangles"""
    pts = np.array(pts, float); out = []
    for i in range(len(pts) - 1):
        a, b = pts[i], pts[i + 1]; t = (b - a) / max(np.linalg.norm(b - a), 1e-6); n = np.array([-t[1], t[0]]) * w / 2
        q = [a + n, a - n, b + n, b - n]; out += [q[0], q[1], q[2], q[2], q[1], q[3]]
    return [round(float(v), 3) for p in out for v in p]
def sline(s_a, s_b, d_of, w=0.15, step=0.5):
    return line([at(s, d_of(s)) for s in np.arange(s_a, s_b + 1e-6, step)], w)
def dashes(s_a, s_b, d, on=3.0, off=3.0, w=0.15):
    out = []; s = s_a
    while s < s_b: out += sline(s, min(s + on, s_b), lambda _: d, w); s += on + off
    return out
def arrow(s, d, L=3.2, W=1.1):
    """an arrow on the lane pointing south (+s)"""
    out = sline(s - L / 2, s + L / 2 - 0.9, lambda _: d, 0.28, 0.4)
    c, t, n = frame(s + L / 2 - 0.9); tip = at(s + L / 2, d); a = c + n * (d + W / 2); b = c + n * (d - W / 2)
    out += [round(float(v), 3) for p in (a, b, tip) for v in p]; return out
S_ = lambda a, b, st=0.5: list(np.arange(a, b + 1e-6, st))
opts = []
# the box is a drive-through already: open portals at its north and south ends, its window front (with the big sign) to the road; so every
# layout runs its own lane off the road's west lane at the north, through the box(es) north to south and back onto the road at the south
DC = 12.57                                   # (the box's centre line, from the road's centre line, as it stands now: front 1.3 m off the edge)
def lane_d(s, sa, sb, L1, L2, dc=DC):
    u = s
    if u < sa: return 2.75 + (dc - 2.75) * ease((u - (sa - L1)) / L1)
    if u <= sb: return dc
    return 2.75 + (dc - 2.75) * ease(((sb + L2) - u) / L2)
def lane_strip(sa, sb, L1, L2, w=5.0, dc=DC):
    f = lambda s: lane_d(s, sa, sb, L1, L2, dc)
    # (never over the road itself: its rows held at the road's edge, so where the lane is still on the road there is nothing to draw)
    cl = lambda d, lo: max(d, lo)
    return strip(S_(sa - L1 - 1, sb + L2 + 1), lambda s: [(cl(f(s) - w / 2 - 0.4, HW - 0.6), 0), (cl(f(s) - w / 2, HW - 0.2), 1), (cl(f(s), HW - 0.2), 1), (cl(f(s) + w / 2, HW - 0.2), 1), (cl(f(s) + w / 2 + 0.4, HW - 0.2 + 0.001), 0)]), f
def mouths(sa, sb, L1, L2):
    """the road's edge line broken (dashed) where the lane leaves it and where it comes back"""
    return dashes(sa - L1 - 2, sa - L1 * 0.35, HW - 0.25, 2.0, 2.0) + dashes(sb + L2 * 0.35, sb + L2 + 2, HW - 0.25, 2.0, 2.0)

# 1 · the box where it stands, its own lane through it (in from the north, out to the south)
o1 = {'name': 'prevozni boks tik ob cesti', 'boxes': [box(s0, DC, 'road')], 'asph': [], 'lines': []}
st, f1 = lane_strip(s0 - 7.5, s0 + 7.5, 22, 22); o1['asph'].append(st)
o1['lines'] += mouths(s0 - 7.5, s0 + 7.5, 22, 22) + arrow(s0 - 14, f1(s0 - 14)) + arrow(s0 + 14, f1(s0 + 14))
opts.append(o1)

# 2 · three boxes in a row along the road (a little narrower), one lane through all three
sz2 = 0.82; BW2 = BW * sz2; sp2 = BW2 + 1.0
o2 = {'name': 'trije boksi v vrsti', 'boxes': [box(s0 + k * sp2, DC, 'road', sz=sz2) for k in (-1, 0, 1)], 'asph': [], 'lines': []}
st, f2 = lane_strip(s0 - sp2 - BW2 / 2 - 1.2, s0 + sp2 + BW2 / 2 + 1.2, 22, 15); o2['asph'].append(st)
o2['lines'] += mouths(s0 - sp2 - BW2 / 2 - 1.2, s0 + sp2 + BW2 / 2 + 1.2, 22, 15)
o2['lines'] += arrow(s0 - sp2 - BW2 / 2 - 7, f2(s0 - sp2 - BW2 / 2 - 7)) + arrow(s0 + sp2 + BW2 / 2 + 6, f2(s0 + sp2 + BW2 / 2 + 6))
opts.append(o2)

# 3 · the box moved south of the motocross start, onto the meadow by the road (the start left free), its lane through it
s3 = float(SS[np.argmin(np.abs(P[:, 1] + 199))])
o3 = {'name': 'prevozni boks juzno od starta', 'boxes': [box(s3, DC, 'road')], 'asph': [], 'lines': []}
st, f3 = lane_strip(s3 - 7.5, s3 + 7.5, 20, 20); o3['asph'].append(st)
o3['lines'] += mouths(s3 - 7.5, s3 + 7.5, 20, 20) + arrow(s3 - 13, f3(s3 - 13)) + arrow(s3 + 13, f3(s3 + 13))
o3['s3'] = s3; opts.append(o3)
for o in opts: o['patch'] = json.load(open('boxpatch.json'))      # (the old orange smudge by the box's west wall, in every layout)
json.dump({'ref': REF, 'opts': opts}, open('boxopt.json', 'w'))
for o in opts: print(o['name'], [(b['tx'], b['tz'], round(math.degrees(b['phi']), 1)) for b in o['boxes']], 'lines', len(o['lines']) // 6)
print('s0 %.1f at' % s0, frame(s0)[0].round(1))
