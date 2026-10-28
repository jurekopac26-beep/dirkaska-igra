# fix21.tpl.js + fix21-ops.json -> fix21-page.js
import json
ops = json.load(open('fix21-ops.json')); t = open('fix21.tpl.js').read(); open('fix21-page.js', 'w').write(t.replace('__OPS__', json.dumps(ops, separators=(',', ':')))); print('fix21-page.js', len(ops))
