# Mockup only: the open data the globe is made from, downloaded once into raw/geo/ (the heights and the land cover are read as needed
# by geo_lib.py): Natural Earth's borders, countries, states, towns, seas and mountain ranges (public domain) -> raw/geo/ne/, and NASA's
# Blue Marble (public domain, as packed in the basemap-data package on PyPI) -> raw/geo/src/bmng.jpg.
# Usage: python3 geo_data.py
import glob, os, shutil, subprocess, sys, tempfile, zipfile
from geo_lib import RAW, BM_PATH, fetch

NE = {'ne_50m_admin_0_boundary_lines_land': '50m_cultural', 'ne_10m_admin_0_countries': '10m_cultural', 'ne_50m_admin_1_states_provinces': '50m_cultural',
      'ne_10m_populated_places_simple': '10m_cultural', 'ne_50m_geography_marine_polys': '50m_physical', 'ne_10m_geography_regions_polys': '10m_physical',
      'ne_10m_geography_regions_points': '10m_physical'}
for name, part in NE.items():
    out = os.path.join(RAW, 'ne', name)
    if os.path.exists(os.path.join(out, name + '.shp')): continue
    z = os.path.join(RAW, 'ne', name + '.zip'); fetch('https://naturalearth.s3.amazonaws.com/%s/%s.zip' % (part, name), z)
    with zipfile.ZipFile(z) as f: f.extractall(out)
    print('natural earth', name)
if not os.path.exists(BM_PATH):
    with tempfile.TemporaryDirectory() as d:
        subprocess.check_call([sys.executable, '-m', 'pip', 'download', '--no-deps', '--only-binary=:all:', '-d', d, 'basemap-data'])
        whl = glob.glob(os.path.join(d, '*.whl'))[0]
        with zipfile.ZipFile(whl) as f:
            src = [n for n in f.namelist() if n.endswith('/bmng.jpg')][0]; os.makedirs(os.path.dirname(BM_PATH), exist_ok=True)
            with f.open(src) as a, open(BM_PATH, 'wb') as b: shutil.copyfileobj(a, b)
    print('blue marble', BM_PATH)
print('ok')
