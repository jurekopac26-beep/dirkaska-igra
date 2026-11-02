# Extract Overture layers (OSM-derived roads, buildings, base; places) inside a bbox and save them as a pickle.
# usage: python3 extract.py <name> <lon0> <lat0> <lon1> <lat1>
import pyarrow.fs as pafs, pyarrow.parquet as pq, pyarrow as pa, os, sys, json, pickle, concurrent.futures as cf
import shapely
import os, tempfile
CACHE = os.environ.get('ZAVITE_CACHE', os.path.join(tempfile.gettempdir(), 'zavite')); os.makedirs(CACHE, exist_ok=True)
name = sys.argv[1]
lon0, lat0, lon1, lat1 = map(float, sys.argv[2:6])
fs = pafs.S3FileSystem(anonymous=True, region='us-west-2', proxy_options=os.environ['HTTPS_PROXY'])
LAYERS = {
    'segment': ('transportation_segment', ['id', 'names', 'subtype', 'class', 'subclass', 'connectors', 'road_flags', 'level_rules', 'access_restrictions', 'width_rules', 'sources', 'geometry', 'bbox']),
    'building': ('buildings_building', ['id', 'names', 'class', 'subtype', 'height', 'num_floors', 'is_underground', 'sources', 'geometry', 'bbox', 'has_parts']),
    'place': ('places_place', ['id', 'names', 'confidence', 'taxonomy', 'basic_category', 'brand', 'sources', 'geometry', 'bbox', 'operating_status']),
    'infra': ('base_infrastructure', ['id', 'names', 'wikidata', 'source_tags', 'subtype', 'class', 'height', 'sources', 'geometry', 'bbox']),
    'landuse': ('base_land_use', ['id', 'names', 'wikidata', 'source_tags', 'subtype', 'class', 'sources', 'geometry', 'bbox']),
    'water': ('base_water', ['id', 'names', 'wikidata', 'source_tags', 'subtype', 'class', 'geometry', 'bbox']),
    'land': ('base_land', ['id', 'names', 'wikidata', 'source_tags', 'subtype', 'class', 'elevation', 'geometry', 'bbox']),
}
def jobs_for(layer):
    idxname, cols = LAYERS[layer]
    idx = json.load(open(os.path.join(CACHE, f'idx_{idxname}.json')))
    out = []
    for key, rgs in idx.items():
        sel = [r for r, xmin, xmax, ymin, ymax, n in rgs if not (xmin > lon1 or xmax < lon0 or ymin > lat1 or ymax < lat0)]
        if sel: out.append((key, sel, cols))
    return out
def read(job):
    key, rgs, cols = job
    f = pq.ParquetFile('overturemaps-us-west-2/' + key, filesystem=fs)
    avail = [c for c in cols if c in f.schema_arrow.names]
    t = f.read_row_groups(rgs, columns=avail)
    b = t.column('bbox').combine_chunks()
    xmin = b.field('xmin').to_numpy(); xmax = b.field('xmax').to_numpy(); ymin = b.field('ymin').to_numpy(); ymax = b.field('ymax').to_numpy()
    import numpy as np
    m = ~((xmin > lon1) | (xmax < lon0) | (ymin > lat1) | (ymax < lat0))
    t = t.filter(pa.array(m))
    return t.to_pylist()
res = {}
for layer in LAYERS:
    jobs = jobs_for(layer)
    rows = []
    with cf.ThreadPoolExecutor(8) as ex:
        for r in ex.map(read, jobs): rows += r
    for r in rows:
        r['geom'] = shapely.from_wkb(r.pop('geometry'))
    res[layer] = rows
    print(name, layer, len(jobs), 'row groups ->', len(rows), file=sys.stderr)
res['bbox'] = (lon0, lat0, lon1, lat1)
pickle.dump(res, open(os.path.join(CACHE, f'data_{name}.pkl'), 'wb'))
