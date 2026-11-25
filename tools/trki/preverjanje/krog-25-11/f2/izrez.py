# izrez bloka aiHazard iz tests/trki.test.js (S/wt-f2) v samostojno datoteko S/f2/regres.js: ista koda testa, jedro po GAME_ROOT (staro: S/snap)
import io, sys
W=__import__('os').environ.get('TRKI_F2', '')
L=io.open(W+'/tests/trki.test.js',encoding='utf-8').read().split('\n')
a=next(i for i,l in enumerate(L) if l.startswith("const fs = require('fs')"))
b=next(i for i,l in enumerate(L) if l.startswith('const wrap = '))
c=next(i for i,l in enumerate(L) if l.startswith('// Realistična and a car standing across the road (aiHazard'))
out=L[a:b+1]+['']+L[c:]
s='\n'.join(out).replace("require('./lib/", "require('"+W+"/tests/lib/")
if len(sys.argv)>1: s=s.replace("[['spa', 90], ['cusco', 90], ['spa', 180]]", sys.argv[1])
io.open(sys.argv[2] if len(sys.argv)>2 else 'regres.js','w',encoding='utf-8').write(s)
print(len(out),'vrstic')
