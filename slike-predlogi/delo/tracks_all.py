# tyre tracks at every place where a makadam / gravel / dirt road joins an asphalt road (found off the map and checked one by one:
# jc/cands.json + the classifiers' mouths), and the motocross exit
import json, numpy as np
import tracks as TR
MOUTHS = [  # name, mouth (at the asphalt edge), a point ~15 m up the dirt road, the dirt road's width
    ('over-west', (-264.6, -170.0), (-252.0, -178.5), 8),   # (user, 18. 10.: moved to the stroke by the tunnel, all turning south)
    ('over-north', (-165.1, 58.0), (-161.6, 43.3), 8),
    ('loopB-west', (-289.7, 218.6), (-292.7, 203.0), 8),
    ('loopB-east', (-186.0, 154.0), (-200.0, 157.5), 8),
    ('crossing-east', (-283.9, -238.0), (-269.3, -241.8), 8),
    ('crossing-west', (-293.5, -236.2), (-308.6, -236.2), 9),
    ('p6', (-45.9, -220.2), (-60.0, -214.8), 8),
    ('jetty', (-8.4, 158.2), (-8.0, 173.2), 7),
    ('home', (-10.0, 287.9), (-13.5, 273.2), 6),
    ('boat', (-4.5, -303.0), (9.4, -308.8), 8),
    ('farm', (-168.4, -351.1), (-176.5, -363.6), 8),
]
allr = []; info = []
for k, (name, M, U, w) in enumerate(MOUTHS):
    ribs, inf = TR.junction(M, U, width=w, passes=8 if name == 'over-west' else 10, seed=11 + k, strength=1.0, toward=(0, 1) if name == 'over-west' else None)
    if name == 'over-west':      # (they fade out a few metres before the tunnel's mouth, not cut off at its hill)
        for r in ribs: r['a'] = [int(round(a * (1 - TR.sst(-164.0, -157.0, p[1])))) for a, p in zip(r['a'], r['p'])]
    inf['name'] = name; info.append(inf); allr += TR.pack(ribs, 5.4); print(name, inf, len(ribs), flush=True)
ribs, inf = TR.junction((-310.0, -0.5), (-312.0, -12.0), width=14, starts=[(-321.6, -6.6), (-305.5, -13.0)], passes=16, seed=7)
inf['name'] = 'mx-exit'; info.append(inf); allr += TR.pack(ribs, 5.4)
json.dump(allr, open('trk-all.json', 'w')); json.dump(info, open('trk-info.json', 'w'), indent=0); print(len(allr), 'ribbons')
