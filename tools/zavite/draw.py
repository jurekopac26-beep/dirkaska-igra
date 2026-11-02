# Design map: roads with names, buildings, sights, a route. PNG for looking at while drawing the loop.
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import LineCollection, PatchCollection
import numpy as np, math
from shapely.geometry import Polygon, MultiPolygon, LineString, box
from tool import WIDTH, SIGHT_CATS

PARK = {'park', 'garden', 'grass', 'recreation_ground', 'village_green', 'meadow', 'cemetery', 'grave_yard', 'pitch', 'playground', 'zoo'}

def polys(g):
    if g.geom_type == 'Polygon': return [g]
    if g.geom_type == 'MultiPolygon': return list(g.geoms)
    return []

def draw(d, fn, route=None, wps=None, sights=None, extent=None, labels=True, title='', size=16, dpi=110):
    fig, ax = plt.subplots(figsize=(size, size), dpi=dpi)
    ax.set_aspect('equal'); ax.axis('off')
    if extent is None:
        xs = [p[0] for p in d['nodexy']]; ys = [p[1] for p in d['nodexy']]
        extent = (min(xs), max(xs), min(ys), max(ys))
    x0, x1, y0, y1 = extent
    vb = box(x0, y0, x1, y1)
    for r in d['water']:
        for p in polys(r['g']):
            if p.intersects(vb): ax.fill(*p.exterior.xy, color='#b9d7ee', lw=0, zorder=1)
        if r['g'].geom_type == 'LineString' and r['g'].intersects(vb):
            ax.plot(*r['g'].xy, color='#8fbfe6', lw=1.5, zorder=1)
    for r in d['landuse']:
        if (r.get('class') or '') in PARK or (r.get('subtype') or '') in ('park', 'recreation'):
            for p in polys(r['g']):
                if p.intersects(vb): ax.fill(*p.exterior.xy, color='#d6ecc9', lw=0, zorder=1)
    for r in d['building']:
        if r.get('is_underground'): continue
        for p in polys(r['g']):
            if not p.intersects(vb): continue
            named = bool(r['name'])
            ax.fill(*p.exterior.xy, color='#e3b98f' if named else '#dcdcdc', lw=0.2, ec='#b0b0b0', zorder=2)
            if named and labels and p.area > 1500:
                c = p.representative_point()
                ax.text(c.x, c.y, r['name'][:40], fontsize=5, color='#7a3d00', ha='center', va='center', zorder=6)
    segs, ws, cols = [], [], []
    names = {}
    for r in d['segment']:
        g = r['g']
        if g.geom_type != 'LineString' or not g.intersects(vb): continue
        cls = r.get('class') or 'unknown'
        st = r.get('subtype')
        if st == 'rail':
            ax.plot(*g.xy, color='#888', lw=0.6, ls='--', zorder=3); continue
        if st != 'road': continue
        segs.append(np.array(g.coords)); ws.append(WIDTH.get(cls, 0.6) * 1.6)
        cols.append('#ffffff' if cls not in ('footway', 'cycleway', 'path', 'steps', 'sidewalk', 'crosswalk', 'pedestrian') else ('#f6e6c9' if cls == 'pedestrian' else '#f0f0f0'))
        if r['name'] and cls in ('primary', 'secondary', 'tertiary', 'residential', 'unclassified', 'trunk', 'pedestrian', 'living_street', 'service'):
            if g.length > names.get(r['name'], (0, None))[0]: names[r['name']] = (g.length, g)
    lc = LineCollection(segs, linewidths=[w + 1.2 for w in ws], colors='#9a9a9a', zorder=3); ax.add_collection(lc)
    lc = LineCollection(segs, linewidths=ws, colors=cols, zorder=4); ax.add_collection(lc)
    if labels:
        for nm, (L, g) in names.items():
            if L < 40: continue
            p = g.interpolate(0.5, normalized=True)
            a, b = g.interpolate(0.45, normalized=True), g.interpolate(0.55, normalized=True)
            ang = math.degrees(math.atan2(b.y - a.y, b.x - a.x))
            if ang > 90: ang -= 180
            if ang < -90: ang += 180
            ax.text(p.x, p.y, nm[:34], fontsize=5.5, color='#1d3557', rotation=ang, ha='center', va='center', zorder=7,
                    bbox=dict(fc='white', ec='none', alpha=0.6, pad=0.3))
    if route is not None:
        L = route['line']
        ax.plot(*L.xy, color='#d62828', lw=3.2, alpha=0.85, zorder=8, solid_capstyle='round')
        n = int(L.length // 120)
        for i in range(1, n + 1):
            a = L.interpolate(i * 120 - 4); b = L.interpolate(i * 120 + 4)
            ax.annotate('', xy=(b.x, b.y), xytext=(a.x, a.y), arrowprops=dict(arrowstyle='-|>', color='#7a0000', lw=1.2), zorder=9)
        s = L.interpolate(0)
        ax.plot(s.x, s.y, 'o', ms=9, color='#111', zorder=10)
    if wps:
        for i, (lat, lon) in enumerate(wps):
            x, y = d['xy'](lat, lon)
            ax.text(x, y, str(i), fontsize=8, color='white', ha='center', va='center', zorder=11, bbox=dict(boxstyle='circle', fc='#003049', ec='none', pad=0.2))
    if sights:
        for i, s in enumerate(sights):
            c = s['g'].representative_point() if s['g'].geom_type != 'Point' else s['g']
            col = '#6a00f4' if s['dist'] <= 60 else '#999999'
            ax.plot(c.x, c.y, 'o', ms=4, color=col, zorder=12)
            ax.text(c.x + 6, c.y + 6, f"{i+1}", fontsize=6, color=col, zorder=12, weight='bold')
    # scale bar 200 m
    ax.plot([x0 + 30, x0 + 230], [y0 + 30, y0 + 30], color='k', lw=2, zorder=12)
    ax.text(x0 + 130, y0 + 42, '200 m', ha='center', fontsize=7, zorder=12)
    ax.set_xlim(x0, x1); ax.set_ylim(y0, y1)
    if title: ax.set_title(title, fontsize=10)
    fig.savefig(fn, bbox_inches='tight', pad_inches=0.05)
    plt.close(fig)
