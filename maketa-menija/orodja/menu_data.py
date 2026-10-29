# Mockup only: a new track's map data into the game's js/menu-data.js (MENU.wideMaps: the painted margin of its top map, as wide_map.py
# draws it; MENU.routeMaps: the start's and the finish's names and the real heights of a road, or the height of a circuit's start line),
# written into the file's own text (the rest of it stays as it is). Usage: python3 menu_data.py '<id>' '<routeMaps entry as JSON>' [margin]
import json, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__)); P = os.path.join(HERE, '..', '..', 'js', 'menu-data.js')
tid, entry = sys.argv[1], json.loads(sys.argv[2]); ext = int(sys.argv[3]) if len(sys.argv) > 3 else None
s = open(P, encoding='utf-8').read()
def block(name):   # the span of "name": { … } at the top level of MENU
    i = s.index('\n "%s": {' % name); j = s.index('\n }', i); return i, j
def put(name, line):
    global s
    i, j = block(name); body = s[i:j]
    m = re.search(r'\n  "%s": ' % re.escape(tid), body)
    if m:   # (again: the old entry out first)
        k = m.start(); e = body.find('\n  "', k + 1); e = len(body) if e < 0 else e
        body = body[:k] + body[e:]; body = body.rstrip(',') if body.rstrip().endswith(',') else body
    body = body.rstrip() + ',\n' + line
    s = s[:i] + body + s[j:]
if ext: put('wideMaps', '  "%s": %d' % (tid, ext))
put('routeMaps', '  "%s": %s' % (tid, json.dumps(entry, ensure_ascii=False)))
open(P, 'w', encoding='utf-8').write(s)
print(tid, 'menu-data.js', entry, ext)
