import json
R = json.load(open('eb3-ribbons.json')) + json.load(open('kerb-ribbons.json')) + json.load(open('trk-all.json'))
tpl = open('eb2-page.tpl.js').read()
tpl = tpl.replace("me.renderOrder = r.kind === 'L' ? 5.3 : 5.2;", "me.renderOrder = r.kind === 'L' ? 5.3 : r.kind === 'K' ? 5.25 : r.kind === 'T' ? 5.4 : 5.2;")
tpl = tpl.replace("// (pictures only) the asphalt roads' wide edge (18. 10.):", "// (pictures only) the asphalt roads' wide edge (as on the original Toskana: white line, terracotta shoulder), the wide kerb by the park, the tyre tracks at the gravel roads' joins (18. 10.):")
s = tpl.replace('__DATA__', json.dumps(R)); open('eb2-page.js', 'w').write(s); print('eb2-page.js', len(R), len(s) // 1024, 'KB')
