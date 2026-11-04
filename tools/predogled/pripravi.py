"""tools/predogled/pripravi.py <id...>: prenese izvleček OSM (glavni API), naredi sceno (prep.py) in prenese višinske ploščice (Terrain Tiles na AWS)."""
import json, os, subprocess, sys
SP = os.path.dirname(os.path.abspath(__file__)); DATA = os.path.join(SP, 'podatki')
T = json.load(open(os.path.join(SP, 'proge.json'), encoding='utf-8'))
def curl(url, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    for _ in range(3):
        if subprocess.run(['curl', '-sS', '-m', '120', '--retry', '2', '-o', path, url]).returncode == 0 and os.path.getsize(path) > 200: return True
    return False
for tid in sys.argv[1:] or list(T):
    osm = os.path.join(DATA, 'osm', tid + '.xml')
    if not os.path.exists(osm): curl('https://api.openstreetmap.org/api/0.6/map?bbox=' + T[tid]['bbox'], osm)
    subprocess.run([sys.executable, '-I', os.path.join(SP, 'prep.py'), tid], check=True)
    for z, x, y in json.load(open(os.path.join(DATA, 'scenes', tid + '.json')))['tiles']:
        p = os.path.join(DATA, 'tiles', str(z), str(x), '%d.png' % y)
        if not os.path.exists(p): curl('https://s3.amazonaws.com/elevation-tiles-prod/terrarium/%d/%d/%d.png' % (z, x, y), p)
