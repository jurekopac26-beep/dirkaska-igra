// loader hooks kept outside the repo: (1) 'playwright' from the global install; (2) PROTO_PATCH=<patch json>: js/tracks/killar.js gets the patch merged into
// its def (in memory); (3) PROTO_SHADE='KH,KC,LO,HI': the roadway's vertex colours of js/world-killar.js by the waves' own height (def._und) and curvature
export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'playwright') return { url: 'file://' + (process.env.PLAYWRIGHT_MJS || '/opt/node-tools/node_modules/playwright/index.mjs'), shortCircuit: true };
  return nextResolve(specifier, context);
}
export async function load(url, context, nextLoad) {
  const r = await nextLoad(url, context); if (process.env.PROTO_DBG && url.includes('/tests/browser/')) process._rawDebug('proto load ' + url + ' patch=' + !!process.env.PROTO_PATCH);
  if ((process.env.PROTO_PATCH || process.env.PROTO_SHADE) && url.endsWith('/tests/browser/lib.mjs')) {
    let src = Buffer.from(r.source).toString('utf8');
    const needle = 'const page = await ctx.newPage();';
    if (!src.includes(needle)) throw new Error('proto: openGame changed, needle not found');
    const ctxN = 'opts.context));'; if (!src.includes(ctxN)) throw new Error('proto: newContext changed'); src = src.replace(ctxN, "opts.context, { serviceWorkers: 'block' }));");
    src = src.replace(needle, needle + `
  if (process.env.PROTO_PATCH) await page.route('**/js/tracks/killar.js', async (route) => { console.log('proto: killar.js routed');
    const fs = await import('node:fs');
    const resp = await route.fetch();
    const body = await resp.text() + '\\n;(() => { const d = TRACK_DEFS.find(d => d.id === "killar"); Object.assign(d, ' + fs.readFileSync(process.env.PROTO_PATCH, 'utf8') + '); })();';
    await route.fulfill({ response: resp, body });
  });
  if (process.env.PROTO_SHADE) await page.route('**/js/world-killar.js', async (route) => {
    const resp = await route.fetch();
    let body = await resp.text();
    const a = "const shade = (i, o) => { const rl = T.rl[i]; let k = 0.86 - 0.12 * Math.exp(-((o - rl) * (o - rl)) / 5.5); if (Math.abs(o) > w * 0.88) k -= 0.04; if (galAt[i]) k *= 0.9; return [k, k, k * 1.02]; };";
    if (!body.includes(a)) throw new Error('proto: the shade function changed');
    const [KH, KC, LO, HI, KS = 0] = process.env.PROTO_SHADE.split(',').map(Number);
    body = body.replace(a, "const __u = def._und || null; const __uk = (i) => { if (!__u) return 1; const b = __u[i], d2 = (__u[Math.max(0, i - 1)] + __u[Math.min(N - 1, i + 1)] - 2 * b) / (T.ds * T.ds); const d1 = (__u[Math.min(N - 1, i + 1)] - __u[Math.max(0, i - 1)]) / (2 * T.ds); return clamp(1 + " + KH + " * b - " + KC + " * d2 - " + KS + " * d1, " + LO + ", " + HI + "); };\\n" +
      "const shade = (i, o) => { const rl = T.rl[i]; let k = 0.86 - 0.12 * Math.exp(-((o - rl) * (o - rl)) / 5.5); if (Math.abs(o) > w * 0.88) k -= 0.04; if (galAt[i]) k *= 0.9; k *= __uk(i); return [k, k, k * 1.02]; };");
    await route.fulfill({ response: resp, body });
  });`);
    return { ...r, source: src };
  }
  return r;
}
