// node test-b.js <drevo> <izhod>: vrstice stanja prizora wall/85-120/real iz tests/trki.test.js (v pomnilniku, v drevo se nič ne zapiše)
const Module = require('module'), fs = require('fs'), path = require('path');
const tree = path.resolve(process.argv[2]), out = path.resolve(process.argv[3]), file = path.join(tree, 'tests/trki.test.js');
let src = fs.readFileSync(file, 'utf8');
const A = 'for (const [th, kmh] of GW) ref(`wall/${th}-${kmh}/${id}`, wall(tx, th, kmh, 1, 2));';
if (src.split(A).length !== 2) throw new Error('sidro');
src = src.replace(A, 'for (const [th, kmh] of GW) { const r = wall(tx, th, kmh, 1, 2); if (th === 85 && kmh === 120 && id === "real") { require("fs").writeFileSync(' + JSON.stringify(out) + ', r.L.join("\\n")); console.log("ZAPISANO " + r.L.length + " vrstic, konec " + JSON.stringify(r.end)); process.exit(0); } ref(`wall/${th}-${kmh}/${id}`, r); }');
const m = new Module(file, null); m.filename = file; m.paths = Module._nodeModulePaths(path.dirname(file)); m._compile(src, file);
