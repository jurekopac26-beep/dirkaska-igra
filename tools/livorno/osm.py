# Livorno, Italija (proga `livorno`), sklop 1: OpenStreetMap data for the track's box (© OpenStreetMap contributors, ODbL 1.0).
# From the OSM API (api.openstreetmap.org/api/0.6/map: at most 50,000 nodes a request, so the box goes in tiles of 0.03 x 0.025 deg;
# a tile the API refuses as too big is split in four) into RAW/osm/<tile>.osm, then merged into RAW/osm.json:
#   {"nodes": {id: [lat, lon] or [lat, lon, tags]}, "ways": {id: [refs, tags]}, "rels": {id: [[type, ref, role], ...], tags]}}
# (overpass-api.de is blocked in the cloud sessions; the API works.) Downloads are cached: a second run only merges.
# Usage: python3 -I tools/livorno/osm.py RAW      (RAW: a directory outside the repository, e.g. the session's scratchpad)
import json, os, sys, time, urllib.error, urllib.request
import xml.etree.ElementTree as ET

BOX = (43.440, 10.295, 43.530, 10.410)   # lat0, lon0, lat1, lon1: Ardenza (N) to Quercianella (S), the coast (W) to the ridge (E)
DLAT, DLON = 0.03, 0.025
UA = 'dirkaska-igra-livorno/1.0 (track data for a racing game; one-off download)'

def get(url, tries=4):
    for k in range(tries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA})
            with urllib.request.urlopen(req, timeout=180) as r: return r.read()
        except urllib.error.HTTPError as e:
            if e.code in (400, 509): raise   # too many nodes (400) or bandwidth (509): the caller splits / waits
            if k == tries - 1: raise
        except Exception:
            if k == tries - 1: raise
        time.sleep(2 ** (k + 1))

def tile(raw, la0, lo0, la1, lo1, depth=0):
    name = '%.4f_%.4f_%.4f_%.4f.osm' % (la0, lo0, la1, lo1)
    path = os.path.join(raw, 'osm', name)
    if os.path.exists(path): return [path]
    url = 'https://api.openstreetmap.org/api/0.6/map?bbox=%.5f,%.5f,%.5f,%.5f' % (lo0, la0, lo1, la1)
    try:
        data = get(url)
    except urllib.error.HTTPError as e:
        if e.code == 400 and depth < 4:   # (too many nodes: in four)
            lm, om = (la0 + la1) / 2, (lo0 + lo1) / 2
            out = []
            for a, b, c, d in ((la0, lo0, lm, om), (la0, om, lm, lo1), (lm, lo0, la1, om), (lm, om, la1, lo1)): out += tile(raw, a, b, c, d, depth + 1)
            return out
        raise
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, 'wb').write(data)
    print('tile', name, len(data) // 1024, 'KB', flush=True)
    time.sleep(1)
    return [path]

def main():
    raw = sys.argv[1]
    paths = []
    la = BOX[0]
    while la < BOX[2] - 1e-9:
        lo = BOX[1]
        while lo < BOX[3] - 1e-9:
            paths += tile(raw, la, lo, min(la + DLAT, BOX[2]), min(lo + DLON, BOX[3]))
            lo += DLON
        la += DLAT
    nodes, ways, rels = {}, {}, {}
    for p in paths:
        for ev, el in ET.iterparse(p, events=('end',)):
            if el.tag == 'node':
                tags = {t.get('k'): t.get('v') for t in el.findall('tag')}
                v = [float(el.get('lat')), float(el.get('lon'))]
                if tags: v.append(tags)
                nodes[el.get('id')] = v
                el.clear()
            elif el.tag == 'way':
                ways[el.get('id')] = [[nd.get('ref') for nd in el.findall('nd')], {t.get('k'): t.get('v') for t in el.findall('tag')}]
                el.clear()
            elif el.tag == 'relation':
                rels[el.get('id')] = [[[m.get('type'), m.get('ref'), m.get('role')] for m in el.findall('member')], {t.get('k'): t.get('v') for t in el.findall('tag')}]
                el.clear()
    json.dump({'box': BOX, 'nodes': nodes, 'ways': ways, 'rels': rels}, open(os.path.join(raw, 'osm.json'), 'w'), separators=(',', ':'))
    print('osm.json: %d nodes, %d ways, %d relations' % (len(nodes), len(ways), len(rels)))

if __name__ == '__main__':
    main()
