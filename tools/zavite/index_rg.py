# python3 index_rg.py <theme> <type>  (once per type: transportation segment, buildings building, places place, base infrastructure|land_use|water|land)
# Build a row-group bbox index for an Overture theme/type (files listed via S3 listing), saved as JSON.
import pyarrow.fs as pafs, pyarrow.parquet as pq, os, sys, json, re, urllib.request, concurrent.futures as cf
import os, tempfile
CACHE = os.environ.get('ZAVITE_CACHE', os.path.join(tempfile.gettempdir(), 'zavite')); os.makedirs(CACHE, exist_ok=True)

REL='2026-10-21.0'
theme, typ = sys.argv[1], sys.argv[2]
fs=pafs.S3FileSystem(anonymous=True, region='us-west-2', proxy_options=os.environ['HTTPS_PROXY'])
def list_keys(prefix):
    keys=[]; token=None
    while True:
        url='https://overturemaps-us-west-2.s3.amazonaws.com/?list-type=2&prefix='+prefix+('&continuation-token='+urllib.parse.quote(token) if token else '')
        s=urllib.request.urlopen(url, timeout=60).read().decode()
        keys+=re.findall(r'<Key>([^<]*\.parquet)</Key>', s)
        m=re.search(r'<NextContinuationToken>([^<]*)</NextContinuationToken>', s)
        if not m: break
        token=m.group(1)
    return keys
import urllib.parse
keys=list_keys(f'release/{REL}/theme={theme}/type={typ}/')
print(len(keys),'files', file=sys.stderr)
def stats(key):
    f=pq.ParquetFile('overturemaps-us-west-2/'+key, filesystem=fs)
    md=f.metadata; out=[]
    names=[md.schema.column(i).path for i in range(md.num_columns)]
    idx={n:i for i,n in enumerate(names)}
    for r in range(md.num_row_groups):
        rg=md.row_group(r)
        def mm(n, k):
            s=rg.column(idx[n]).statistics
            return getattr(s,k)
        out.append([r, mm('bbox.xmin','min'), mm('bbox.xmax','max'), mm('bbox.ymin','min'), mm('bbox.ymax','max'), rg.num_rows])
    return key, out
res={}
with cf.ThreadPoolExecutor(8) as ex:
    for key,out in ex.map(stats, keys):
        res[key]=out
json.dump(res, open(os.path.join(CACHE, f'idx_{theme}_{typ}.json'),'w'))
print('done', sum(len(v) for v in res.values()), 'row groups', file=sys.stderr)
