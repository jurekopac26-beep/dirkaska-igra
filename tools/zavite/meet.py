# python3 meet.py <city> "<street A substring>" "<street B substring>": junction nodes where both streets meet
import sys
from tool import load, graph
d=load(sys.argv[1]); G=graph(d)
pairs=[(sys.argv[i], sys.argv[i+1]) for i in range(2, len(sys.argv), 2)]
for a,b in pairs:
    print('==',a,'x',b)
    for n in G.nodes:
        names=[(G[n][m]['name'] or '') for m in G[n]]
        if any(a.lower() in x.lower() for x in names) and any(b.lower() in x.lower() for x in names):
            lo,la=d['inv'].transform(*G.nodes[n]['xy'])
            print(f'   [{la:.6f},{lo:.6f}] ' + '; '.join(sorted({(G[n][m]['name'] or '-')+':'+G[n][m]['cls'][:4] for m in G[n]})))
