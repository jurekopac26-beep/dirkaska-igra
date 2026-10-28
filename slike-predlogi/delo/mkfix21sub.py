# fix21.tpl.js + a subset of fix21-ops.json (ids on the command line) -> fix21-sub-page.js (to apply only new ops on a page that already ran fix21)
import json, sys
ids = sys.argv[1:]; ops = [o for o in json.load(open('fix21-ops.json')) if o['id'] in ids]; t = open('fix21.tpl.js').read().replace('if (window.__FIX21ROOT) { Render.scene.remove(window.__FIX21ROOT); window.__FIX21ROOT = null; }', '// (a subset on a page that ran fix21: its patches kept)')
open('fix21-sub-page.js', 'w').write(t.replace('__OPS__', json.dumps(ops, separators=(',', ':')))); print('fix21-sub-page.js', [o['id'] for o in ops])
