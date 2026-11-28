// The new menu's test, part 3 of 3 (the overview: menu.test.mjs; what the parts share: menu-lib.mjs): sections 6 and 6b (the layouts,
// the carousel and the picture's swipe), 8 (pictures without internet), 9 (the menu's style missing), 7 (the old menu, ?menu=old),
// 10 and 11 (the garage, no WebGL; the map and the flyover), 12 (the career's path of 1.0) and 13 (the career's valley).
//   node tests/browser/menu-3.test.mjs
import { openGame } from './lib.mjs';
import { menuTest } from './menu-lib.mjs';

await menuTest('menu 3/3', async ({ T, srv, browser, PAGE, open, ready, SH, ev, click, done, shown, nuPick, real, raceOn, pageState, KF, zem, EARTH, hit, clean, wrap }) => {
  // 6. the layouts: upright (360 x 640 and 412 x 915), on its side (915 x 412 and 640 x 360): the menu, the track step, the quick list, the Earth
  for (const [w, h] of [[360, 640], [412, 915], [915, 412], [640, 360]]) {
    const { ctx, page, errors } = await open({ track: 'nring', lastTrack: 'nring' }, { width: w, height: h });   // (the title's tile: Nürburg's model; Vršič, a test track since 6. 11. 2026, has none)
    await page.emulateMedia({ reducedMotion: 'reduce' });   // (the slide-in of a screen is off: it would still be on its way, and the screen 8 px low, when measured)
    await ready(page);
    await page.evaluate(() => { Core.TRACKS.find(d => d.id === 'iroha').test = false; });   // (as in the quick list above: Japan's list two tracks, Hakone and Irohazaka (made real))
    const title = await ev(page, 'const p = root.querySelector(".title-panel").getBoundingClientRect(); const b = [...root.querySelectorAll(".title-panel button")].map(e => e.getBoundingClientRect()); return { top: p.top, bottom: p.bottom, w: innerWidth, h: innerHeight, over: b.filter(r => r.bottom > p.bottom + 1 || r.top < p.top - 1).length };');
    T.check(`${w}x${h}: the main menu fits the screen, every button inside its panel`, title.top >= -0.5 && title.bottom <= title.h + 0.5 && title.over === 0, JSON.stringify(title));
    await click(page, 'single');
    const modes = await ev(page, 'const p = root.querySelector(".title-panel").getBoundingClientRect(); const c = [...root.querySelectorAll(".t-sub .mode")].map(e => e.getBoundingClientRect()); return { top: p.top, bottom: p.bottom, h: innerHeight, cut: c.filter(r => r.bottom > p.bottom + 1 || r.top < p.top - 1).length, n: c.length };');
    T.check(`${w}x${h}: the eight modes fit their panel`, modes.top >= -0.5 && modes.bottom <= modes.h + 0.5 && modes.cut === 0 && modes.n === 8, JSON.stringify(modes));
    await click(page, 'mode:race'); await page.click('.thead [data-act="back"]'); await click(page, 'tsub:');
    await nuPick(page, 'vrsic');   // (Vršič, a test track since 6. 11. 2026: behind NEUPORABNO, the longest hidden track, its list's last)
    await click(page, 'cam:2');   // (the flyover)
    await page.waitForTimeout(500);
    // the track step: upright the picture from the top of the screen (the head over it) to the row, then the row, the yard, the neighbours
    // and Race! one under the other; on its side the carousel (sklop 10): the chosen track's card in the middle under the head, the row
    // under it as wide as it at the screen's foot (8 of the drawing's px over it, no less than 6 px) and Race! at its right, as big as the
    // back button (the user, 11. 11. 2026), the car at the bottom left under the left neighbour's card, the neighbours' cards (smaller,
    // within its height) and the arrows ‹ › at the card's sides (at the height of its middle); the place between the back button and the
    // globe; the flag in the row 34 px high (30 on a short screen; on its side 34 of the drawing's px); nothing cut, nothing over another
    const g = await ev(page, `
      const rc = (s) => { const e = root.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height }; };
      const out = { head: rc(".thead"), hb: rc(".thead .hback"), globe: rc(".thead .globe"), st: rc("#track-stage"), row: rc(".trow"), yard: rc(".yard"), car: rc(".yard .car"), sign: rc(".yard .sign"), nbrs: rc(".nbrs"), foot: rc(".foot"), go: rc(".go"), where: rc(".where .w2"), fl: rc(".trow .flag img"), W: innerWidth, H: innerHeight };
      out.cl = rc(".rcard[data-k='-1']"); out.cr = rc(".rcard[data-k='1']"); out.al = rc(".rarw.l"); out.ar = rc(".rarw.r"); out.k = Menu.debug().ring.k;
      out.cells = [...root.querySelectorAll(".trow > div")].map(e => e.scrollWidth - e.clientWidth); out.dsh = [...root.querySelectorAll(".trow :is(.md, .dif)")].map(e => [e.textContent, e.querySelector(".dsh").getBoundingClientRect().top]); out.nb = [...root.querySelectorAll(".nb")].map(e => { const r = e.getBoundingClientRect(); return [r.left, r.right, r.width]; });
      out.wx = rc(".wxv"); out.cams = rc("#track-stage .cams"); out.cnt = rc("#track-stage .tcount"); out.gr = rc("#track-stage .hgraph"); const sv = root.querySelector("#track-stage .hgraph svg"); out.grw = sv ? sv.getBoundingClientRect().width : 0; return out;`);
    const inside = (r) => r && r.l >= -0.5 && r.r <= g.W + 0.5 && r.t >= -0.5 && r.b <= g.H + 0.5;
    const side = g.W > g.H, parts = side ? ['head', 'row', 'yard', 'car', 'foot', 'cl', 'cr', 'al', 'ar'] : ['row', 'yard', 'nbrs', 'foot'];
    const order = side || parts.every((k, i) => !i || g[parts[i - 1]].b <= g[k].t + 1), mx = (r) => (r.l + r.r) / 2, my = (r) => (r.t + r.b) / 2;
    const lay = side ? Math.abs(mx(g.st) - g.W / 2) < 1 && g.head.b <= g.st.t + 1 && g.row.t >= g.st.b - 1 && Math.abs(g.row.l - g.st.l) < 1 && Math.abs(g.row.r - g.st.r) < 1 &&
        g.go.l >= g.row.r && g.go.t < g.row.b && g.go.b > g.row.t && g.yard.r <= g.row.l + 1 && g.car.r <= g.row.l + 1 && g.car.t >= g.cl.b - 1 &&
        g.cl.r <= g.st.l && g.cr.l >= g.st.r && [g.cl, g.cr].every(r => r.t >= g.st.t && r.b <= g.st.b) && [g.al, g.ar].every(r => Math.abs(my(r) - my(g.st)) < 1) && mx(g.al) < g.st.l && mx(g.ar) > g.st.r && g.al.w >= 35.5 && g.ar.w >= 35.5 && g.hb.h >= 43.5 && g.globe.w >= 43.5 && g.globe.h >= 43.5 &&
        Math.abs(g.hb.w - g.go.w) < 1 && Math.abs(g.hb.h - g.go.h) < 1 && Math.abs(my(g.go) - my(g.row)) < 1 && g.H - g.row.b >= 5.5 && g.H - g.row.b <= Math.max(6, 8 * g.k) + 0.5
      : g.st.t <= 0.5 && g.head.t <= 0.5 && g.head.b <= g.st.t + 90 && g.row.t >= g.st.b - 20 && g.row.t <= g.st.b + 1 && g.st.h >= g.H * 0.5 && order;   // (the row in the room, which lies a little over the picture's foot: --ov)
    T.check(`${w}x${h}: the track step${side ? ' on its side (the carousel): the card in the middle under the head, the row and Race! under it at the screen\'s foot, Race! as big as the back button, the car at the bottom left, the neighbours\' cards and the arrows at its sides' : ' (the picture from the top, the head over it): the row, the yard, the neighbours and Race!, in order'}; the place between the back button and the globe; the bigger flag; all inside the screen`,
      lay && parts.every(k => inside(g[k])) && inside(g.head) && inside(g.go) && inside(g.st) && g.yard.h >= 50 && g.where.l >= g.hb.r + 4 && g.where.r <= g.globe.l - 4 &&
      g.fl && g.fl.h >= (side ? Math.max(22, 34 * g.k) : g.H > 700 ? 34 : 30) - 0.5, JSON.stringify(g));
    // on its side the back button in the screen's top left corner, the globe in its top right and Race! in its bottom right, the car in the
    // middle under the left neighbour's card (the user, 12. 11. 2026: »back naj bo poravnava zgoraj levo ... zemla zgoraj desno. avto na sredino
    // pod grafiko. gumb race spodaj desno«)
    const cm = Math.max(10, 12 * g.k);
    if (side) T.check(`${w}x${h}: on its side the back button in the screen's top left corner, the globe in its top right, Race! in its bottom right (12 of the drawing's px in, no less than 10 px); the car in the middle under the left neighbour's card`,
      Math.abs(g.hb.l - cm) < 1 && Math.abs(g.hb.t - cm) < 1 && Math.abs(g.W - g.globe.r - cm) < 1 && g.globe.t >= cm - 1 && g.globe.t <= cm + 2 * g.k + 1 &&
      Math.abs(g.W - g.foot.r - cm) < 1 && g.go.r <= g.foot.r + 0.5 && g.go.b <= g.H - 5.5 && Math.abs(mx(g.car) - mx(g.cl)) < 1, JSON.stringify({ cm, hb: g.hb, globe: g.globe, foot: g.foot, go: g.go, car: g.car, cl: g.cl }));
    T.check(`${w}x${h}: the row's numbers are not cut; ${side ? 'the neighbours\' cards apart from the card' : 'the two neighbours side by side'}; the weather inside the stage, over the cameras; the counter and the cameras at the stage's foot, apart${side ? '' : '; the sign in the yard'}`,
      g.cells.every(x => x <= 1) && (side ? g.cl.r <= g.st.l - 8 && g.cr.l >= g.st.r + 8 : g.nb.length === 2 && g.nb[0][1] <= g.nb[1][0] && g.nb[0][2] >= 100) && g.wx.l >= g.st.l && g.wx.r <= g.st.r + 0.5 && g.wx.t >= g.st.t && g.wx.b <= g.cams.t - 4 && (side || g.wx.t >= g.globe.b + 4) &&
      g.cnt.l >= g.st.l + 6 && g.cnt.r <= g.cams.l - 8 && g.cams.r <= g.st.r - 6 && Math.abs(g.cnt.b - g.cams.b) < 0.5 && g.cams.b <= (side ? g.st.b : g.row.t) - 6 && (side || (g.sign.t >= g.yard.t - 0.5 && g.sign.r <= g.yard.r + 0.5)),
      JSON.stringify({ cells: g.cells, nb: side ? [g.cl, g.cr] : g.nb, wx: g.wx, cams: g.cams, cnt: g.cnt, sign: g.sign }));
    // the dashes under the mode (Classic race, two lines) and under the difficulty (Medium, one) as high (the user, 13. 11. 2026)
    T.check(`${w}x${h}: the dashes under Classic race and under Medium as high`, g.dsh.length === 2 && g.dsh[0][0] === 'Classicrace' && g.dsh[1][0] === 'Medium' && Math.abs(g.dsh[0][1] - g.dsh[1][1]) < 0.5, JSON.stringify(g.dsh));
    const e8 = Math.max(6, 8 * g.k);   // (on its side the things in the card 8 of the drawing's px in from its edges, no less than 6 px)
    T.check(`${w}x${h}: the height graph in its frame ${side ? 'at the stage\'s top left' : 'under the back button at its left, 78 px wide (64 on a short screen)'} (0.6 of it high), left of the weather and over the counter`,
      g.gr && Math.abs(g.grw - g.gr.w) < 1 && g.gr.h >= g.gr.w * 0.55 && g.gr.h <= g.gr.w * 0.66 && g.gr.r < g.wx.l - 8 && g.gr.b < g.cnt.t - 8 &&
      (side ? Math.abs(g.gr.l - g.st.l - e8) < 0.6 && Math.abs(g.gr.t - g.st.t - e8) < 0.6 : Math.abs(g.gr.l - g.hb.l) < 0.5 && Math.abs(g.gr.w - (g.H > 700 ? 78 : 64)) < 0.5 && g.gr.w < g.hb.w && g.gr.t >= g.hb.b + 8), JSON.stringify({ gr: g.gr, st: g.st, hb: g.hb, grw: g.grw, wx: g.wx }));

    // the whole route and the names of its flags inside the picture; the neighbours (on its side their cards) at the same place on the next track. (An open road's map
    // turned to run up the frame: on Pikes Peak, below. Vršič, a test track since 6. 11. 2026 (behind NEUPORABNO), is drawn as the test tracks are, not turned)
    const MEASURE = `
      const c = (e) => { const r = e.getBoundingClientRect(); return { x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2, l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height }; };
      const st = root.querySelector("#track-stage"), pic = st.querySelector(".dio"), svg = st.querySelector(".topmap svg");
      const out = { name: root.querySelector(".where .w2").textContent, head: root.querySelector(".where").textContent.replace(/\\s+/g, " ").trim(), pic: c(pic), nb: [...root.querySelectorAll(innerWidth > innerHeight ? ".rcard[data-k='-1'], .rcard[data-k='1']" : ".nb")].map(c), scr: [innerWidth, innerHeight] };
      if (svg) { out.rot = svg.querySelector("g.rot").getAttribute("transform") || ""; out.s = c(svg.querySelector(".mk.s circle")); const f = svg.querySelector(".mk.f circle"); out.f = f ? c(f) : null; out.line = c(svg.querySelector("path.rt-o")); out.names = [...st.querySelectorAll(".mlab .fl-s")].map(c); out.boxes = [...st.querySelectorAll(".mlab .fl-s")].map(e => { const b = e.querySelector("b").getBoundingClientRect(), m = e.querySelector("small"), r = m && m.getBoundingClientRect(); return [e.className, getComputedStyle(e.querySelector("b")).backgroundColor, r ? +(r.top >= b.bottom - 1 && Math.abs(r.right - b.right) < 12) : -1]; }); const ld = svg.querySelector("image.land"); out.land = ld ? c(ld) : null; out.keep = [...st.querySelectorAll(":scope > .cams, :scope > .wxv, :scope > .hgraph, :scope > .tcount")].concat([...root.querySelector(".thead").children]).map(c); }
      out.tall = st.classList.contains("tall"); out.st = c(st); out.th = c(root.querySelector(".thead")); out.row = c(root.querySelector(".trow")); out.wx = c(st.querySelector(".wxv")); out.cams = c(st.querySelector(".cams")); out.cnt = c(st.querySelector(".tcount")); const gr = st.querySelector(".hgraph"); out.gr = gr ? c(gr) : null;
      if (svg && out.tall) {   // (the route's line on the screen, 201 points along it: under none of the things over the card or beside it)
        const p = svg.querySelector("path.rt-o"), L = p.getTotalLength(), M = p.getScreenCTM(), pts = []; for (let i = 0; i <= 200; i++) { const q = p.getPointAtLength(L * i / 200); pts.push([M.a * q.x + M.c * q.y + M.e, M.b * q.x + M.d * q.y + M.f]); }
        const ob = { arrows: ".rarw", weather: "#track-stage .wxv > button", cameras: "#track-stage .cams", counter: "#track-stage .tcount", graph: "#track-stage .hgraph", cards: ".rcard[data-k='-1'], .rcard[data-k='1']" };
        out.hit = Object.keys(ob).filter(k => [...root.querySelectorAll(ob[k])].some(e => { const r = e.getBoundingClientRect(); return r.width > 0 && pts.some(([x, y]) => x > r.left && x < r.right && y > r.top && y < r.bottom); }));
      }
      return out;`;
    await click(page, 'cam:1'); await page.waitForTimeout(500);
    const v1 = await ev(page, MEASURE);
    await click(page, 'track:1'); await page.waitForTimeout(500);
    const v2 = await ev(page, MEASURE);
    const same = (a, b) => Math.abs(a.x - b.x) < 1 && Math.abs(a.y - b.y) < 1;
    T.check(`${w}x${h}: the neighbours' ${side ? 'cards' : 'buttons'} at the same place on Vršič and on the next track`, v1.name === 'Vršič' && v2.name !== 'Vršič' && v1.nb.length === 2 && v2.nb.length === 2 && same(v1.nb[0], v2.nb[0]) && same(v1.nb[1], v2.nb[1]), JSON.stringify({ v1: v1.nb, v2: v2.nb }));
    if (w === 412) T.check('Vršič\'s head: the place alone, "VRŠIČ" (no height)', v1.head === 'Vršič', v1.head);
    const inPic = (r, p, e) => r.l >= p.l - e && r.r <= p.r + e && r.t >= p.t - e && r.b <= p.b + e;
    T.check(`${w}x${h}: the whole route (start to finish) and the names of its flags are inside the picture, the names upright`, inPic(v1.line, v1.pic, 6) && v1.names.length >= 2 && v1.names.every(n => inPic(n, v1.pic, 1) && n.w > n.h), JSON.stringify({ line: v1.line, pic: v1.pic, names: v1.names }));
    T.check(`${w}x${h}: the flags' names in boxes as the flyover's (the start's white, the finish's dark), the height in a small box under the name at its right`,
      v1.boxes.length === 2 && v1.boxes[0][0] === 'fl-s start' && v1.boxes[1][0] === 'fl-s finish' && v1.boxes[0][1] === 'rgb(255, 255, 255)' && v1.boxes[1][1] !== v1.boxes[0][1] && v1.boxes.every(b => b[2] === 1), JSON.stringify(v1.boxes));
    // the real land painted round the map (wide-<id>.webp, wide_map.py) covers the whole picture: no blurred or empty edge, in the frame turned or not
    const covers = (l, p) => !!l && l.l <= p.l + 1 && l.r >= p.r - 1 && l.t <= p.t + 1 && l.b >= p.b - 1;
    // (on its side a turned open road's map smaller than its land where the route must stay clear of the card's rows: the land then reaches
    // most of the way across the picture one way, the blurred backdrop round it; on the smallest screen, the card 276 × 169, not quite across:
    // the route clear of the weather first; the user, 12. 11. 2026: the card its size as it was)
    const across = (l, p) => !l ? 0 : Math.max((Math.min(l.r, p.r) - Math.max(l.l, p.l)) / p.w, (Math.min(l.b, p.b) - Math.max(l.t, p.t)) / p.h);
    const along = (l, p) => across(l, p) >= 0.6;
    T.check(`${w}x${h}: the open road's map has the real land painted over the whole picture (the wide map reaches every edge of the frame)`, covers(v1.land, v1.pic), JSON.stringify({ land: v1.land, pic: v1.pic }));
    // every real track with a map (the real list again: back to the title, Single race, Circuit race): the route and its names inside the
    // picture, the painted land over all of it
    await page.click('.thead [data-act="back"]'); await click(page, 'single'); await click(page, 'mode:race'); await click(page, 'cam:1'); await page.waitForTimeout(500);
    const ids = await page.evaluate(() => Menu.debug().list), cut = [], bare = [], under = [], close = [], talls = [], tallBad = [], hits = [], shape = []; let maps = 0, pk = null;
    const over = (a, b) => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;
    const share = (a, b) => Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l)) * Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t)) / Math.min(a.w * a.h, b.w * b.h);   // (how much of the smaller name the other covers)
    for (let k = 0; k < ids.length; k++) {
      const id = await page.evaluate(() => { const d = Menu.debug(); return d.list[d.trackIdx]; });
      if (await page.evaluate((id) => !!(window.ROUTES || {})[id] && !Core.TRACKS.find(d => d.id === id).test, id)) {   // (the test tracks aside)
        await page.waitForTimeout(300);
        const m = await ev(page, MEASURE);
        if (id === 'pikes') pk = m;
        if (side && m.names) {   // (on its side, camera 1: an open road's map turned in its card, every card its size)
          const open = await page.evaluate((id) => { const d = Core.TRACKS.find(x => x.id === id), R = (window.ROUTES || {})[id]; return !d.test && !d.rally && !d.descent && !!d.open && !!(R && R.open); }, id);
          if (m.tall !== open) tallBad.push(id);
          if (m.tall) { talls.push(id); if (m.hit.length) hits.push(id + ': ' + m.hit.join(' ')); if (!/^rotate\((-90|-?180) /.test(m.rot || '')) shape.push(id + ' not turned'); }
          if (Math.abs(m.st.h - 236 * g.k) > 1 || Math.abs(m.st.w - 384 * g.k) > 1) shape.push(id);
        }
        if (m.names) { maps++; if (!inPic(m.line, m.pic, 6) || !m.names.every(n => inPic(n, m.pic, 1))) cut.push(m.name); if (m.land && !(side && m.tall ? along(m.land, m.pic) : covers(m.land, m.pic))) bare.push(m.name + (side && m.tall ? ' ' + across(m.land, m.pic).toFixed(2) : '')); if (m.names.some(n => m.keep.some(k => over(n, k)))) under.push(m.name); if (m.names.length === 2 && share(...m.names) > (w === 640 ? 0.15 : 0)) close.push(m.name + ' ' + share(...m.names).toFixed(2)); }
      }
      await click(page, 'track:1');
    }
    T.check(`${w}x${h}: on every real track's map (${maps}) the route and the names of its flags are inside the picture`, maps >= 5 && !cut.length, JSON.stringify(cut));
    // an open road's map is turned to run up the frame (start below, finish above) in a frame not much wider than tall, else it lies; on
    // its side always (its card tall, below)
    const tall = !!pk && (side || pk.pic.w / pk.pic.h < 1.3), turned = !!pk && /^rotate\(-90 /.test(pk.rot || '');
    const upright = !!pk && !!pk.f && (tall ? pk.s.y > pk.f.y + pk.pic.h * 0.4 && Math.abs(pk.s.x - pk.f.x) < pk.pic.w * 0.35 : pk.f.x > pk.s.x + pk.pic.w * 0.4);
    T.check(`${w}x${h}: the open road's map ${tall ? 'runs up the frame (Pikes Peak: Crystal Reservoir, the start, below; the Summit, the finish, above)' : 'lies along the frame (it is wide and short): the start left, the finish right'}`, !!pk && turned === tall && upright, JSON.stringify(pk && { name: pk.name, rot: pk.rot, pic: pk.pic, s: pk.s, f: pk.f }));
    // on its side an open road's map as upright (the user, 11. 11. 2026: »Gorske proge naj bodo v ležečem načinu postavljene tako kot gorske proge v stoječem
    // načinu«), the card its size as before (12. 11. 2026: »vrni velikost okvirja in pozicije na isto kot je bila predno si obracal sliko, obrni
    // samo sliko v okvirju«; docs/meni-izbira-proge.md)
    if (side) T.check(`${w}x${h}: on its side, camera 1, an open road's map (${talls.join(', ')}) turned in its card, every card its size as before (384 × 236 of the drawing's px); the route clear of the weather, the cameras, the counter, the graph, the arrows and the neighbours' cards`,
      talls.length >= 5 && !tallBad.length && !hits.length && !shape.length, JSON.stringify({ talls, tallBad, hits, shape }));
    T.check(`${w}x${h}: on every map the painted land covers the whole picture (on its side a turned open road's map: most of the way across it one way)`, !bare.length, JSON.stringify(bare));
    T.check(`${w}x${h}: on every map the names of the flags are not under the head, the graph, the weather, the counter or the cameras' buttons`, maps >= 5 && !under.length, JSON.stringify(under));
    // (on the smallest screen on its side, the card 276 × 169, two long names over flags close together can't both be clear: there they cover each other least)
    T.check(`${w}x${h}: on every map the names of the two flags apart${w === 640 ? ' (here at most a corner of one over the other)' : ''}`, maps >= 5 && !close.length, JSON.stringify(close));
    // the quick list (sklop 8): upright a sheet from the bottom the screen's width, on its side a panel at the right the screen's height;
    // its buttons big enough for a finger, the flags and the countries' names not cut; a country's tracks and a track's card in it, the
    // card's Select and Race! in sight without scrolling
    await page.click('.trow .flag button');
    await page.waitForFunction(() => window.MenuIzbor && MenuIzbor.isOpen() && MenuIzbor.depth() === 1 && document.getElementById('menu-host').shadowRoot.querySelector('.izb.on'), null, { timeout: 10000 });   // (on: slid in)
    const QL = `const rc = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height }; }, q = (s) => root.querySelector(".izb " + s), qa = (s) => [...root.querySelectorAll(".izb " + s)];
      return { W: innerWidth, H: innerHeight, sh: rc(q(".izb-sheet")), body: rc(q(".izb-body")), x: rc(q(".izb-head [data-x]")), bk: rc(q(".izb-head [data-back]")), q: rc(q(".izb-q")),
        cut: qa(".izb-c b, .izb-t .tx b, .izb-chips button").filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent), tiles: qa(".izb-c").map(rc), chips: qa(".izb-chips button").map(rc), icons: qa(".izb-chips button svg").map(rc), rows: qa(".izb-t").map(rc), btns: qa(".izb-btns button").map(rc) };`;
    const q1 = await ev(page, QL);
    const portrait = q1.W < q1.H, within = (r, b) => r.l >= b.l - 0.5 && r.r <= b.r + 0.5;
    const placed = (s) => portrait ? Math.abs(s.l) < 1 && Math.abs(s.r - q1.W) < 1 && Math.abs(s.b - q1.H) < 1 && s.t >= 39   // (as high as its view needs: the countries most of the screen)
      : Math.abs(s.r - q1.W) < 1 && Math.abs(s.t) < 1 && Math.abs(s.b - q1.H) < 1 && Math.abs(s.w - Math.min(412, q1.W * 0.64)) < 2;
    T.check(`${w}x${h}: the quick list ${portrait ? 'a sheet from the bottom, the screen\'s width (the track step seen over it)' : 'a panel at the right, the screen\'s height'}; the cross 44 px or more; the search, the four category buttons (each with its icon) and the flags inside it; no country\'s name or button label cut`,
      placed(q1.sh) && (!portrait || q1.sh.t <= q1.H * 0.2) && q1.x.w >= 44 && q1.x.h >= 44 && within(q1.x, q1.sh) && within(q1.q, q1.sh) && q1.chips.length === 4 && q1.icons.length === 4 && q1.icons.every(i => i.w >= 14 && i.h >= 14) && q1.chips.every(c => within(c, q1.sh) && c.h >= 26) && q1.tiles.length >= 10 && q1.tiles.every(t => within(t, q1.sh)) && !q1.cut.length,
      JSON.stringify({ sh: q1.sh, x: q1.x, q: q1.q, chips: q1.chips.map(c => [Math.round(c.l), Math.round(c.r)]), icons: q1.icons.map(i => [Math.round(i.w), Math.round(i.h)]), cut: q1.cut }));
    await page.click('.izb-c[data-c="Japan"]'); await page.waitForFunction(() => MenuIzbor.depth() === 2, null, { timeout: 10000 });
    const q2 = await ev(page, QL);
    await page.click('.izb-t[data-t="hakone"]'); await page.waitForFunction(() => MenuIzbor.depth() === 3, null, { timeout: 10000 });
    const q3 = await ev(page, QL);
    T.check(`${w}x${h}: in the quick list a country's tracks (Japan) inside it, their names not cut; a track's card (Hakone): Select and Race! in sight without scrolling, 44 px or more; the back arrow and the cross 44 px or more`,
      placed(q2.sh) && q2.rows.length >= 2 && q2.rows.every(r => within(r, q2.sh)) && !q2.cut.length && placed(q3.sh) && q3.btns.length === 2 && q3.btns.every(b => within(b, q3.sh) && b.t >= q3.body.t - 0.5 && b.b <= q3.body.b + 0.5 && b.h >= 44) &&
      q3.bk && q3.bk.w >= 44 && q3.bk.h >= 44 && q3.x.w >= 44, JSON.stringify({ rows: q2.rows.length, cut: q2.cut, sh: q3.sh, body: q3.body, btns: q3.btns, bk: q3.bk }));
    await page.keyboard.press('Escape'); await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
    await page.waitForFunction(() => !MenuIzbor.isOpen() && !document.getElementById('menu-host').shadowRoot.querySelector('.izb'), null, { timeout: 10000 });
    // the Earth (sklop 9): the back arrow and the column under it (closer, farther, the track shown, the moon) 44 px or more, inside the
    // screen, none over another or the title, the column upright at the right, lying at the left; a country's card (Japan) upright from the
    // bottom the screen's width, lying at the right the screen's height (the title left of it); a track's card (Hakone): Select and Race!
    // in sight without scrolling; the names over no button, no card and no other
    await page.click('.thead .globe');
    const zOpen = await zem(page, 1).then(() => null).catch(async () => page.evaluate(() => { const R = MenuZemlja._R(); return { open: MenuZemlja.isOpen(), depth: MenuZemlja.depth(), quick: MenuIzbor.isOpen(), hist: history.state && history.state.nazaj, R: R && { n: R.n, moving: R.moving, d: R.d, off: R.off, offT: R.offT, nt: R.nt } }; }));
    if (zOpen) T.check(`${w}x${h}: the Earth opens from the head's globe and comes to rest`, false, JSON.stringify(zOpen) + ' ' + real(errors).join(' | '));   // (what was there, not a hang of the whole test)
    else {
      const ZB = `const z = root.querySelector(".zem"), rc = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; }, q = (s) => rc(z.querySelector(s));
        const k = z.querySelector(".zem-card.on"), body = k && k.querySelector(".izb-body");
        return { side: z.classList.contains("side"), back: q(".zem-back"), col: [...z.querySelectorAll(".zem-zoom")].map(rc), tb: q(".zem-title b"), ts: q(".zem-title small"), cv: q("canvas"),
          x: k && rc(k.querySelector(".izb-head [data-x]")), bk: k && rc(k.querySelector(".izb-head [data-back]")), btns: k ? [...k.querySelectorAll(".izb-btns button")].map(rc) : [], body: body && rc(body), W: innerWidth, H: innerHeight };`;
      const y1 = await ev(page, EARTH), u1 = await ev(page, ZB);
      const big = (r) => !!r && r[2] - r[0] >= 43.5 && r[3] - r[1] >= 43.5, scr = (r) => !!r && r[0] >= -0.5 && r[1] >= -0.5 && r[2] <= u1.W + 0.5 && r[3] <= u1.H + 0.5, sqs = [u1.back].concat(u1.col);
      T.check(`${w}x${h}: the Earth over the whole screen; the back arrow and the column under it (closer, farther, the track shown, the moon) 44 px or more, inside the screen, none over another or the title, the column at the ${side ? 'left' : 'right'}; the title inside the screen; the names over no button and no other`,
        u1.side === side && u1.cv[0] <= 0.5 && u1.cv[1] <= 0.5 && u1.cv[2] >= u1.W - 0.5 && u1.cv[3] >= u1.H - 0.5 && u1.col.length === 4 && sqs.every(r => big(r) && scr(r)) && sqs.every((a, i) => sqs.every((b, j) => i === j || !hit(a, b))) &&
        u1.col.every(r => r[1] >= u1.back[3] && (side ? r[2] < u1.W / 2 : r[0] > u1.W / 2)) && scr(u1.tb) && scr(u1.ts) && sqs.every(r => !hit(r, u1.tb) && !hit(r, u1.ts)) && y1.names.length >= 1 && clean(y1),
        JSON.stringify({ u1, names: y1.names.map(n => n.c) }));
      await ev(page, 'root.querySelector(".zl.c[data-c=\\"Japan\\"]").click();'); await zem(page, 2);
      const y2 = await ev(page, EARTH), u2 = await ev(page, ZB);
      // (a track's card, its picture beside its shape, up to 510 px high upright: the user, 12. 11. 2026)
      const cardAt = (c, mh = 460) => side ? Math.abs(c[2] - u2.W) < 1 && Math.abs(c[1]) < 1 && Math.abs(c[3] - u2.H) < 1 && Math.abs(c[2] - c[0] - Math.min(412, u2.W * 0.6)) < 2
        : Math.abs(c[0]) < 1 && Math.abs(c[2] - u2.W) < 1 && Math.abs(c[3] - u2.H) < 1 && c[1] >= Math.max(u2.H - mh, u2.H <= 700 ? 120 : 150) - 0.5;
      await page.click('.zem-card .izb-t[data-t="hakone"]'); await zem(page, 3);
      const y3 = await ev(page, EARTH), u3 = await ev(page, ZB);
      T.check(`${w}x${h}: on the Earth a country's card (Japan) ${side ? 'at the right, the screen\'s height, the title left of it' : 'from the bottom, the screen\'s width'}, its cross 44 px or more, no name over it; a track's card (Hakone): Select and Race! in sight without scrolling, 44 px or more; its back arrow and cross 44 px or more`,
        !!y2.card && cardAt(y2.card.r) && big(u2.x) && clean(y2) && (!side || (u2.tb[2] <= y2.card.r[0] && u2.ts[2] <= y2.card.r[0])) && !!y3.card && cardAt(y3.card.r, 510) && u3.btns.length === 2 &&
        u3.btns.every(b => b[1] >= u3.body[1] - 0.5 && b[3] <= u3.body[3] + 0.5 && b[3] <= u3.H + 0.5 && b[3] - b[1] >= 43.5) && big(u3.bk) && big(u3.x) && clean(y3),
        JSON.stringify({ c2: y2.card && y2.card.r, x2: u2.x, tb: u2.tb, ts: u2.ts, c3: y3.card && y3.card.r, body: u3.body, btns: u3.btns, bk: u3.bk, x3: u3.x }));
      await page.keyboard.press('Escape'); await page.keyboard.press('Escape'); await page.keyboard.press('Escape'); await zem(page, 0);
    }
    T.check(`${w}x${h}: no page errors`, !real(errors).length, real(errors).join(' | '));
    await ctx.close();
  }

  // 6b. on its side the carousel (docs/meni-izbira-proge.md point 9, sklop 10) and upright the picture's swipe: an arrow (›) turns the cards
  //     one track on in ~300 ms (on the way the old track still chosen and the card's things fading; then the next track, its screen under
  //     the old one, which fades and goes; the arrow keeps the focus), a tap on a neighbour's card turns to it, a swipe across the card far
  //     enough turns on from where it was let go (also begun on a weather button: no weather chosen), a short one or one up the screen goes
  //     back; the weather chosen slides to the first place of its row; the Earth opened in a turn ends it at once; a track picked in the quick
  //     list turns in from its side; upright the picture follows the finger, a swipe far enough goes to the next track, a short one slides back
  {
    const { ctx, page, errors } = await open({ track: 'spa', lastTrack: 'spa' }, { width: 892, height: 412 });
    await ready(page);
    await click(page, 'single'); await click(page, 'mode:race'); await page.waitForTimeout(600);
    // (every frame until the carousel is at rest again after it moved, at most ms: the track, the carousel's state, the chosen card's --ui
    // (its things' opacity), the track screens (2: the old one fading). A track's first screen may hold the page a few seconds here (software
    // WebGL: the GPU's work waited for), upright as on its side: the time of the turn itself is not measured to the ms)
    const watch = (ms) => page.evaluate((ms) => new Promise((res) => {
      const root = document.getElementById('menu-host').shadowRoot, t0 = performance.now(), out = []; let moved = false;
      const step = () => {
        const d = Menu.debug(), st = root.querySelector('#track-stage'), u = st ? st.style.getPropertyValue('--ui') : '';
        const s = Object.assign({ t: Math.round(performance.now() - t0), id: d.list[d.trackIdx], ui: u === '' ? 1 : +u, scr: root.querySelectorAll('#s-track').length }, d.ring), busy = s.turning || s.held || s.fading || s.scr > 1;
        out.push(s); moved = moved || busy;
        if (performance.now() - t0 < ms && !(moved && !busy)) requestAnimationFrame(step); else res(out);
      };
      requestAnimationFrame(step);
    }), ms);
    const now = () => page.evaluate(() => { const d = Menu.debug(); return { id: d.list[d.trackIdx], i: d.trackIdx, list: d.list, ring: d.ring }; });
    const idle = (s) => !s.turning && !s.held && !s.fading, last = (w) => w[w.length - 1];
    const a0 = await now(), n = a0.list.length, next = a0.list[(a0.i + 1) % n];
    await page.click('.rarw.r'); const w1 = await watch(10000);
    const l1 = w1.findIndex(s => s.id !== 'spa'), foc = await ev(page, 'const a = root.activeElement; return !!a && a.classList.contains("rarw") && a.classList.contains("r");');
    T.check('on its side an arrow (›) turns the cards one track on in ~300 ms: on the way the old track still chosen and the card\'s things fading, then the next track, the old screen fading over it and gone; the arrow keeps the focus',
      a0.ring.on && a0.id === 'spa' && w1.some(s => s.turning && s.id === 'spa' && s.p > 0.05 && s.p < 0.95 && s.ui < 0.9) && l1 > 0 && w1[l1].t >= 100 && w1[l1].t <= 2000 && w1[l1].id === next &&
      w1.some(s => s.fading && s.scr === 2) && idle(last(w1)) && last(w1).scr === 1 && foc, JSON.stringify({ a0: a0.id, l1: w1[l1], w1: w1.map(s => [s.t, s.id, s.p, +s.turning, +s.fading, s.ui, s.scr]), foc }));
    await page.click('.rcard[data-k="-1"]'); const w2 = await watch(10000);
    T.check('a tap on the left neighbour\'s card turns the cards back to it (Spa)', w2.some(s => s.turning) && last(w2).id === 'spa' && idle(last(w2)), JSON.stringify(w2.map(s => [s.t, s.id, s.p])));
    // the finger (the mouse) across the card: far enough to the left, then from a weather button to the right, then a short way, then up
    const c = await ev(page, 'const r = root.querySelector("#track-stage").getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2];');
    const drag = async (x, y, dx, dy, k) => { await page.mouse.move(x, y); await page.mouse.down(); for (let i = 1; i <= k; i++) { await page.mouse.move(x + dx * i, y + dy * i); await page.waitForTimeout(16); } const h = await now(); await page.mouse.up(); return h; };
    const h1 = await drag(c[0], c[1], -22, 0.5, 6), w3 = await watch(10000);
    T.check('a swipe across the card to the left: the cards follow the finger, let go far enough they turn on from there to the next track',
      h1.ring.held && h1.ring.p > 0.3 && h1.ring.p < 0.6 && h1.id === 'spa' && last(w3).id === next && idle(last(w3)), JSON.stringify({ h1: h1.ring, end: last(w3) }));
    const wb = await ev(page, 'const b = root.querySelector("#track-stage .wxv > button[aria-pressed=\\"false\\"]"), r = b.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2, b.dataset.act];');
    const wxOn = () => ev(page, 'return root.querySelector("#track-stage .wxv > [aria-pressed=\\"true\\"]").dataset.act;'), wx0 = await wxOn();
    await drag(wb[0], wb[1], 22, 0, 6); const w4 = await watch(10000), wx1 = await wxOn();
    T.check('a swipe to the right begun on a weather button: the cards turn back (Spa), no weather chosen', last(w4).id === 'spa' && idle(last(w4)) && wx1 === wx0, JSON.stringify({ end: last(w4), wb, wx0, wx1 }));
    const h2 = await drag(c[0], c[1], 10, 0, 3), w5 = await watch(10000), h3 = await drag(c[0], c[1], 0.75, 10, 4); await page.waitForTimeout(300); const a5 = await now();
    T.check('a short swipe: the cards follow it, let go they go back (the same track); a move up the screen is no swipe',
      h2.ring.held && h2.ring.p < 0 && last(w5).id === 'spa' && idle(last(w5)) && last(w5).p === 0 && !h3.ring.held && a5.id === 'spa' && idle(a5.ring), JSON.stringify({ h2: h2.ring, end: last(w5), h3: h3.ring, a5: a5.ring }));
    // the weather's row on the card: the choice slides to its first place, the others after it in their order
    await page.waitForTimeout(450);   // (the tap a swipe ends with: not a tap for 400 ms)
    // (that it slid is told by the slides' own event, transitionrun of a button's transform, counted from before the tap, not by the transform
    // read in flight after it: on a machine without a graphics chip Snow's first frames are long, the game's world toned for winter, and
    // two of them can take all of the slide's 300 ms, so that the first read finds it over, none, though it was)
    await ev(page, 'window.__wxRun = 0; window.__wxL = (e) => { if (e.propertyName === "transform" && e.target.matches(".wxv > [data-act^=\\"weather:\\"]")) window.__wxRun++; }; root.addEventListener("transitionrun", window.__wxL);');
    await page.click('#track-stage .wxv .w-snow');
    // (the slide's 300 ms, from the frame after the tap: until it is over, 5 s at most)
    await page.waitForFunction(() => window.__wxRun > 0 && [...document.getElementById('menu-host').shadowRoot.querySelectorAll('#track-stage .wxv > [data-act^="weather:"]')].every(b => getComputedStyle(b).transform === 'none'), null, { timeout: 5000 }).catch(() => null);
    const slid = await ev(page, 'root.removeEventListener("transitionrun", window.__wxL); return window.__wxRun;');
    const wr = await ev(page, 'return [...root.querySelectorAll("#track-stage .wxv > [data-act^=\\"weather:\\"]")].map(b => [b.dataset.act, b.getAttribute("aria-pressed"), b.getBoundingClientRect().left, getComputedStyle(b).transform]);');
    T.check('the weather chosen (Snow) slides to the first place of its row, the others after it in their order (Dry, Rain, Changing, Storm); then nothing moving',
      slid > 0 && [...wr].sort((a, b) => a[2] - b[2]).map(b => b[0]).join() === 'weather:snow,weather:dry,weather:rain,weather:change,weather:storm' && wr.find(b => b[0] === 'weather:snow')[1] === 'true' && wr.every(b => b[3] === 'none'), JSON.stringify({ slid, wr }));
    // the Earth opened in a turn: the turn done at once (the next track), no old screen left over it; the screen rests under the Earth. (Opened
    // as the turn begins, before its frames: a machine without a graphics chip, as the tests', can take longer than the turn's 300 ms for a
    // few of them, a flag's edge read the first time, flagFill, a second or more, and the turn would be over before the Earth came)
    const e1 = await page.evaluate(() => {
      const root = document.getElementById('menu-host').shadowRoot, d0 = Menu.debug();
      root.querySelector('.rarw.r').click();
      const m = Menu.debug(); root.querySelector('.thead .globe').click(); const d = Menu.debug();
      return { from: d0.list[d0.trackIdx], mid: Object.assign({ id: m.list[m.trackIdx] }, m.ring), id: d.list[d.trackIdx], ring: d.ring, scr: root.querySelectorAll('#s-track').length };
    });
    const zOk = await zem(page, 1).then(() => true).catch(() => false), zr = zOk && await ev(page, 'return !!root.querySelector("#s-track.rested") && MenuZemlja.isOpen();');
    T.check('the Earth opened in a turn: the turn done at once (the next track), no old screen left; the screen rests under the Earth',
      e1.from === 'spa' && e1.mid.turning && e1.mid.id === 'spa' && e1.id === next && idle(e1.ring) && e1.scr === 1 && zr, JSON.stringify({ e1, zOk, zr }));
    await page.keyboard.press('Escape'); await zem(page, 0).catch(() => null); await page.waitForTimeout(300);
    // a track picked in the quick list (Japan, Hakone, Select): its card turns in from its side
    await page.evaluate(() => { Core.TRACKS.find(d => d.id === 'iroha').test = false; });   // (as in 6: Japan's list two tracks, Hakone and Irohazaka; Irohazaka after the real ones, Spa's place in the list kept)
    await page.click('.trow .flag button');
    await page.waitForFunction(() => window.MenuIzbor && MenuIzbor.isOpen() && MenuIzbor.depth() === 1 && document.getElementById('menu-host').shadowRoot.querySelector('.izb.on'), null, { timeout: 10000 });
    await page.click('.izb-c[data-c="Japan"]'); await page.waitForFunction(() => MenuIzbor.depth() === 2, null, { timeout: 10000 });
    await page.click('.izb-t[data-t="hakone"]'); await page.waitForFunction(() => MenuIzbor.depth() === 3, null, { timeout: 10000 });
    await page.click('.izb-sel'); const w6 = await watch(10000);
    const izOff = await page.waitForFunction(() => !MenuIzbor.isOpen(), null, { timeout: 10000 }).then(() => true).catch(() => false);
    T.check('a track picked in the quick list (Hakone): its card turns in from its side, then rests; the list closed',
      w6.some(s => s.turning && s.id === 'hakone' && Math.abs(s.p) > 0.05) && last(w6).id === 'hakone' && idle(last(w6)) && izOff, JSON.stringify({ w6: w6.map(s => [s.t, s.id, s.p, +s.turning, +s.fading, s.scr]), izOff }));
    // the cards turn, the car stays (the user, 11. 11. 2026: only what changes moves): the old screen's car a picture of it at the new one's
    // place, nothing of either sliding, the shadow on; then nothing moving
    const ca = await page.evaluate((src) => new Promise((res) => {
      const root = document.getElementById('menu-host').shadowRoot, kf = (0, eval)(src), one = (e) => (kf(e) || [])[0] || '', t0 = performance.now();
      root.querySelector('.rarw.r').click();
      const step = () => {
        const d = Menu.debug(), S = [...root.querySelectorAll('#mn > #s-track')];
        if (d.ring.fading && S.length === 2) {
          const ny = S[0].querySelector('.yard'), oy = S[1].querySelector('.yard'), box = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(v => +v.toFixed(1)); };
          res({ id: d.list[d.trackIdx], in: ['.car', 'canvas.c3d'].map(k => one(ny.querySelector(':scope > ' + k))), sign: one(ny.querySelector(':scope > .sign')), out: [...oy.querySelectorAll(':scope > .car, :scope > canvas.c3d')].map(one),
            at: [['.car', '.car'], ['canvas.c3d.snap', 'canvas.c3d:not(.snap)']].map(([o, n]) => [box(oy.querySelector(':scope > ' + o)), box(ny.querySelector(':scope > ' + n))]),
            snap: !!oy.querySelector(':scope > canvas.c3d.snap'), sh: MenuCar.info().shadow });
        } else if (performance.now() - t0 < 10000) requestAnimationFrame(step); else res(null);
      };
      requestAnimationFrame(step);
    }), KF);
    const caEnd = await page.waitForFunction(() => { const i = MenuCar.info(), d = Menu.debug(); return !d.arrive && !d.ring.fading && !d.ring.turning && i.shadow && i.shadow.opacity === 1; }, null, { timeout: 20000 }).then(() => true).catch(() => false);
    T.check('on its side the cards turn, the car stays: the old screen\'s car a picture of it at the same place, nothing of either sliding, its shadow on (no sign lying); then nothing moving',
      ca && ca.snap && ca.out.length === 2 && ca.out.every(x => x === '') && ca.in.every(x => x === '') && !ca.sign && ca.at.every(([p, q]) => p && q && p.every((v, k) => Math.abs(v - q[k]) <= 0.5)) && ca.sh && ca.sh.opacity === 1 && caEnd, JSON.stringify({ ca, caEnd }));
    T.check('no page errors in the carousel', !real(errors).length, real(errors).join(' | '));
    await ctx.close();
  }
  {
    const { ctx, page, errors } = await open({ track: 'spa', lastTrack: 'spa' }, { width: 412, height: 892 });
    await ready(page);
    await click(page, 'single'); await click(page, 'mode:race'); await page.waitForTimeout(600);
    const at = () => page.evaluate(() => { const d = Menu.debug(); return { id: d.list[d.trackIdx], next: d.list[(d.trackIdx + 1) % d.list.length], ring: d.ring }; });
    const tf = () => ev(page, 'return root.querySelector("#track-stage .dio").style.transform;'), px = (t) => { const m = /^translateX\((-?[\d.]+)px\)$/.exec(t); return m ? +m[1] : NaN; };
    const c = await ev(page, 'const r = root.querySelector("#track-stage .dio").getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2];');
    const drag = async (dx, k) => { await page.mouse.move(c[0], c[1]); await page.mouse.down(); for (let i = 1; i <= k; i++) { await page.mouse.move(c[0] + dx * i, c[1]); await page.waitForTimeout(16); } const t = await tf(); await page.mouse.up(); return t; };
    const p0 = await at(), t1 = await drag(-20, 5); await page.waitForTimeout(500); const p1 = await at();
    const t2 = await drag(10, 3); await page.waitForTimeout(450); const t3 = await tf(), p2 = await at();
    T.check('upright: no carousel; the picture follows the finger (0.35 of the way), a swipe far enough to the left goes to the next track, a short one slides back (the same track)',
      !p0.ring.on && Math.abs(px(t1) + 35) < 0.1 && p1.id === p0.next && Math.abs(px(t2) - 10.5) < 0.1 && t3 === '' && p2.id === p0.next, JSON.stringify({ p0, t1, p1: p1.id, t2, t3, p2: p2.id }));
    T.check('upright: no page errors with the swipe', !real(errors).length, real(errors).join(' | '));
    await ctx.close();
  }

  // 8. the pictures already seen stay without internet (sw.js keeps them as they are looked at)
  {
    const { ctx, page, errors } = await open({ track: 'nring', lastTrack: 'nring' });   // (a track with a map from above)
    await ready(page);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload(); await ready(page);   // (the service worker in charge of the page: the pictures it asks for are kept)
    await click(page, 'single'); await click(page, 'mode:race'); await click(page, 'cam:1'); await page.waitForTimeout(400);   // (the map from above, camera 1, the one the step opens with: its webp images are kept by sw.js; the videos are not kept)
    const files = await ev(page, 'return [...root.querySelectorAll("#track-stage image, #track-stage img")].map(e => e.getAttribute("href") || e.getAttribute("src"));');
    await page.waitForFunction(async (n) => { const k = (await caches.keys()).find(x => /pictures/.test(x)); return !!k && (await (await caches.open(k)).keys()).length >= n; }, files.length, { timeout: 30000 }).catch(() => null);
    srv.setOffline(true);
    await page.reload().catch(() => null); await ready(page).catch(() => null);
    await click(page, 'single'); await click(page, 'mode:race'); await click(page, 'cam:1').catch(() => null); await page.waitForTimeout(400);   // (the map again: its images come from the cache)
    const off = await page.waitForFunction(() => { const root = document.getElementById('menu-host').shadowRoot, i = root.querySelector('#track-stage'); return !!i && root.querySelector('.where .w2') ? true : false; }, null, { timeout: 20000 }).then(() => true).catch(() => false);
    const loaded = await page.evaluate(async (files) => { const out = []; for (const f of files) { try { const r = await fetch(f); out.push(r.ok); } catch (_) { out.push(false); } } return out; }, files);
    const fonts = await page.evaluate(() => Promise.all([document.fonts.load('italic 900 20px ApexMenu', 'Vršič'), document.fonts.load('400 16px ApexMenu', 'Vršič')]).then(r => r.map(x => x.length)).catch(() => [0, 0]));
    srv.setOffline(false);
    T.check(`offline: the game starts from the saved copy, the track step's pictures (${files.length}) come from the kept copies, the menu's fonts (also for č and š) from the saved game`, off && files.length >= 2 && loaded.every(Boolean) && fonts.every(n => n > 0), JSON.stringify({ off, files, loaded, fonts }));
    await ctx.close();
  }

  // 9. the menu's style does not load (no connection, the file gone): the game's old menu takes over, not a blank screen
  {
    srv.setFail((req) => /\/css\/menu\.css/.test(req.url));
    const { ctx, page, errors } = await open();
    await page.waitForFunction(() => { const s = document.querySelector('.screen.show'); return s && s.id === 's-title'; }, null, { timeout: 30000 }).catch(() => null);
    srv.setFail(null);
    const sc = await page.evaluate(() => ({ shown: [...document.querySelectorAll('.screen.show')].map(e => e.id), title: !!document.getElementById('btn-champ') }));
    T.check('the menu\'s style does not load: the old title is on show, the failure in the console', sc.shown.join() === 's-title' && errors.some(e => /the new menu failed/.test(e)), JSON.stringify({ sc, errors: errors.slice(0, 3) }));
    await page.evaluate(() => __game.onAction('to-track')); await page.waitForTimeout(300);
    const n = await page.evaluate(() => ({ cards: document.querySelectorAll('[data-track]').length, shown: [...document.querySelectorAll('.screen.show')].map(e => e.id) }));
    T.check('and the old track screen works', n.cards > 20 && n.shown.join() === 's-track', JSON.stringify(n));
    await ctx.close();
  }

  // 7. the old menu stays for ?menu=old (and for the tests that click through it)
  {
    const { ctx, page, errors } = await openGame(browser, PAGE, { sound: 0, comm: 0 }, { width: 412, height: 915 }, {});   // (no opts.menu: tdgp-menu=old)
    await page.waitForTimeout(800);
    const o = await page.evaluate(() => ({ shown: [...document.querySelectorAll('.screen.show')].map(e => e.id), shadow: !!(document.getElementById('menu-host').shadowRoot && document.getElementById('menu-host').shadowRoot.querySelector('#s-title')) }));
    T.check('?menu=old (tdgp-menu=old): the old title is the screen on show, the new menu not built', o.shown.join() === 's-title' && !o.shadow, JSON.stringify(o));
    await page.evaluate(() => __game.onAction('to-track')); await page.waitForTimeout(300);
    await page.setViewportSize({ width: 600, height: 400 }); await page.waitForTimeout(300);   // (a window that changes its size, the new menu not built)
    await page.setViewportSize({ width: 412, height: 915 }); await page.waitForTimeout(300);
    T.check('the old track screen lists the tracks; the window changing its size is no error', (await page.evaluate(() => document.querySelectorAll('[data-track]').length)) > 20 && !real(errors).length, real(errors).join(' | '));
    await ctx.close();
  }

  // 10. the car in the yard tapped (or its name over it): the garage with it, in its colour (here a stand-in page that goes back as the
  // garage's buttons do: its back index.html?zaslon=avto&avto=<id>, its Izberi progo with &naprej=proga), then straight the track step
  // again, the same track (stran Odločitve m8, 2: not the game's car screen), on the garage's car (here another one for Izberi progo)
  {
    // (the game's track a real one, Spa: the page's settings are set again on each load (lib.mjs), and with Jezero, the tests' own track, hidden
    // behind NEUPORABNO, the game would come back from the garage on Jezero, rightly on NEUPORABNO's list, not on the track the step showed)
    const { ctx, page, errors } = await open({ track: 'spa' });
    await ready(page);
    let gar = null, other = '';
    // (the garage in the page, js/game.js garPre: a stand-in frame, as js/garage.js __garageEmbed; its open's p the car and colour asked for,
    // its close as the garage's Nazaj (the same car) or Izberi progo (another, &naprej=proga); the frame kept: the second tap no load)
    let loads = 0;
    await page.route('**/garaza.html*', (r) => { loads++; r.fulfill({ contentType: 'text/html', body: '<!doctype html><meta charset="utf-8"><script>window.__garageEmbed = { open(p) { parent.__garStub = p; setTimeout(() => parent.__garageClose(parent.__garWay === "back" ? { car: p.car } : { car: parent.__garOther, naprej: "proga" }), 50); }, back() { parent.__garageClose({}); } }; parent.__garageReady();</script>' }); });
    const car0 = await page.evaluate(() => ({ id: Core.MODELS[__game.S.car].id, hex: [0xd81f2a, 0xf5f5f0, 0x1c5fd6, 0xf2c230, 0x5c6168, 0x2fa84f, 0xff7a1a, 0x8e3bd6][__game.S.color].toString(16).padStart(6, '0') }));
    other = await page.evaluate((id) => Core.MODELS.find(m => !m.retired && m.id !== id).id, car0.id);   // (the garage's other car: Izberi progo on it)
    await page.evaluate((o) => { window.__garOther = o; }, other);
    const url0 = await page.evaluate(() => location.search);
    for (const w of ['back', 'next']) {
      await page.evaluate((w) => { window.__garWay = w; window.__garStub = null; }, w);
      await click(page, 'single'); await click(page, 'mode:race'); await page.waitForTimeout(300);
      const was = await ev(page, 'return root.querySelector(".where .w2").textContent;');
      const dz = await page.evaluate(() => { const d = Core.TRACKS.find(d => d.id === __game.S.track); return d && /, /.test(d.name) ? d.name.split(', ').pop() : ''; });   // (the track chosen when the garage opens: its country, the flag on the garage's IZBERI PROGO)
      const car1 = await page.evaluate(() => Core.MODELS[__game.S.car].id);
      gar = null;
      // (no name over the car since 12. 11. 2026: the car itself opens the garage)
      await page.evaluate(() => document.getElementById('menu-host').shadowRoot.querySelector('.yard .car').click());
      await page.waitForFunction(() => window.__garStub && document.getElementById('garaza').classList.contains('off'), null, { timeout: 60000 }).catch(() => { });
      gar = await page.evaluate(() => window.__garStub);
      const there = await page.waitForFunction(() => window.__game && __game.screen === 'track' && window.Menu && Menu.ready && Menu.debug().screen === 'track' && document.getElementById('menu-host').shadowRoot.querySelector('#s-track .where'), null, { timeout: 120000 }).then(() => true, () => false);
      if (!there) {   // (seen on GitHub now and then, never locally: the page's state and its errors in the log, not a test stopped without them)
        T.check(`back from the garage [${w}]: the track step within 120 s`, false, JSON.stringify(await pageState(page)) + ' — ' + errors.slice(-10).join(' | '));
        break;
      }
      await page.waitForTimeout(400);
      const g = await page.evaluate(() => ({ car: Core.MODELS[__game.S.car].id, url: location.search, shown: [...document.querySelectorAll('.screen.show')].map(e => e.id).join(), fr: document.getElementById('garaza') && document.getElementById('garaza').className.split(' ').pop() }));
      const back = await ev(page, 'return { h1: root.querySelector(".where .w2") && root.querySelector(".where .w2").textContent, name: root.querySelector(".yard .car") && root.querySelector(".yard .car").getAttribute("aria-label") };');
      const want = w === 'back' ? car0.id : other, wname = await page.evaluate((id) => Core.MODELS.find(m => m.id === id).name, want);
      T.check(`the yard's car tapped [${w}]: the garage in the page with it (open: car <id>, color <its colour>, drzava <the track's country>; loaded once), its ${w === 'back' ? 'back' : 'Izberi progo'}: the track step again, the same track, on the garage's car, its name on it (the address as it was)`,
        gar && gar.car === car1 && gar.color === car0.hex && (gar.drzava || '') === dz && loads === 1 && g.car === want && g.url === url0 && g.shown === 's-menu' && g.fr === 'off' && back.h1 === was && (back.name || '').includes(wname),
        JSON.stringify({ gar, loads, car0, car1, dz, g, url0, was, back, want, wname }));
      await page.click('.thead [data-act="back"]'); await click(page, 'tsub:');   // (the main menu: the modes, then their back)
    }
    T.check('the garage and back: no page errors', !real(errors).length, real(errors).join(' | '));
    await ctx.close();
  }

  // 11. no WebGL for the yard's car (the device has none to spare, or it is lost): the car's picture instead, and still the garage
  {
    const { ctx, page, errors } = await open();
    await ready(page);
    await page.evaluate(() => { const g0 = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, a) { return this.classList.contains('c3d') && /webgl/.test(t) ? null : g0.call(this, t, a); }; });
    await click(page, 'single'); await click(page, 'mode:race');
    await page.waitForFunction(() => document.getElementById('menu-host').shadowRoot.querySelector('.yard .car img'), null, { timeout: 30000 }).catch(() => null);
    const f = await ev(page, 'const y = root.querySelector(".yard"); return { img: !!y.querySelector(".car img"), cv: !!y.querySelector("canvas.c3d"), act: y.querySelector(".car").dataset.act, i: MenuCar.info() };');
    T.check('no WebGL for the yard\'s car: its picture, no canvas, the tap still the garage', f.img && !f.cv && f.act === 'garage' && f.i.failed && !f.i.on, JSON.stringify(f));
    T.check('no WebGL for the yard\'s car: no page errors', !real(errors).filter(e => !/WebGL/.test(e)).length, real(errors).join(' | '));
    await ctx.close();
  }

  // 11. the map (camera 1) and the flyover (camera 2) are one run of the point, seen from two cameras: the switch goes on from the same moment
  // of the run, the point at the same place, not from the start (from the flyover to the map and back); a sheet over the stage keeps the flyover playing (the
  // same video, not started again); another track starts its own run
  {
    const { ctx, page, errors } = await open();
    await ready(page);
    await click(page, 'single'); await click(page, 'mode:race');
    // (a real road with a flyover: Pikes Peak; the shorter way round the list to it)
    const way = await page.evaluate(() => { const d = Menu.debug(), n = d.list.length, f = (d.list.indexOf('pikes') - d.trackIdx + n) % n; return f <= n - f ? 'track:1' : 'track:-1'; });
    for (let k = 0; k < 80 && (await page.evaluate(() => { const d = Menu.debug(); return d.list[d.trackIdx]; })) !== 'pikes'; k++) await click(page, way);
    await click(page, 'cam:2');   // (the step opens with the map: the flyover is the camera 2)
    const VID = 'root.querySelector("#track-stage .dio.fly video")', live = (s) => page.waitForFunction((s) => { const v = document.getElementById('menu-host').shadowRoot.querySelector('#track-stage .dio.fly video'); return v && !v.paused && v.currentTime > s; }, s, { timeout: 120000 });
    await live(4);
    // (the run's place on the map at its moment s, as js/menu.js runAt and routePt; the point drawn is the run's at most a second before: a frame of software WebGL)
    const NEAR = `const R = window.ROUTES.pikes, F = R.fly.frames, Dr = F.length / R.fly.fps;
      const at = (s) => { s = ((s % Dr) + Dr) % Dr; const x = Math.min(F.length - 1, s * R.fly.fps), k = Math.min(F.length - 2, Math.floor(x)), f = (F[k][0] + (F[k + 1][0] - F[k][0]) * (x - k)) / R.len, P = R.top.route, xi = Math.max(0, Math.min(1, f)) * (P.length - 1), i = Math.min(P.length - 2, Math.floor(xi)), u = xi - i; return [P[i][0] + (P[i + 1][0] - P[i][0]) * u, P[i][1] + (P[i + 1][1] - P[i][1]) * u]; };
      const dot = root.querySelector("#track-stage .dio.topmap .rt-dot"), m = /translate\\(([-\\d.]+) ([-\\d.]+)\\)/.exec(dot.getAttribute("transform") || ""), run = Menu.debug().run;
      let best = 1e9; if (m) for (let s = run.t - 1; s <= run.t + 0.05; s += 0.02) { const p = at(s); best = Math.min(best, Math.hypot(p[0] - +m[1], p[1] - +m[2])); }
      const p0 = at(0);
      return { run, best: +best.toFixed(2), fromStart: m ? +Math.hypot(p0[0] - +m[1], p0[1] - +m[2]).toFixed(1) : -1, drawn: root.querySelector("#track-stage .dio.topmap").classList.contains("drawn"), views: root.querySelectorAll("#track-stage .dio").length };`;
    const a = await ev(page, 'const v = ' + VID + '; return { vt: v.currentTime, run: Menu.debug().run };');
    await click(page, 'cam:1');
    await page.waitForFunction(() => { const r = document.getElementById('menu-host').shadowRoot; return r.querySelectorAll('#track-stage .dio').length === 1 && !!r.querySelector('#track-stage .dio.topmap .rt-dot[opacity="1"]'); }, null, { timeout: 30000 }).catch(() => null);
    const b = await ev(page, NEAR);
    T.check(`flyover -> map: the map goes on from the flyover's moment (${a.vt.toFixed(1)} s, the run now at ${b.run.t.toFixed(1)} s), its point where the flyover's was, the route already drawn`,
      a.run.id === 'pikes' && b.run.id === 'pikes' && b.run.t >= a.vt - 0.05 && b.run.t < a.vt + 15 && b.best < 2.5 && b.fromStart > 20 && b.drawn && b.views === 1, JSON.stringify({ a, b }));
    // the map's point leaves its trail behind it coloured by the climb, as the flyover's point does (js/menu.js mapTrail): Pikes Peak's flyover
    // is a loop on an open road, so the map's trail is the last 1.5 km of the route behind the point (TRAIL), not the route from the start:
    // every piece of it before the point's own one, thinner towards its far end, that one up to the point, none ahead
    const tr = await ev(page, `const b = root.querySelector("#track-stage .dio.topmap"), ps = [...b.querySelectorAll(".rt-tr path")], w = ps.map(p => +p.getAttribute("stroke-width")), n = ps.length - 1, on = w.slice(0, n).filter(x => x > 0).length;
      const h = /^M([-\\d.]+) ([-\\d.]+)L([-\\d.]+) ([-\\d.]+)$/.exec(ps[n].getAttribute("d") || ""), P = window.ROUTES.pikes.top.route, dot = /translate\\(([-\\d.]+) ([-\\d.]+)\\)/.exec(b.querySelector(".rt-dot").getAttribute("transform") || "");
      let k = -1, bd = 0.2; if (h) P.forEach((q, i) => { const e = Math.hypot(+h[1] - q[0], +h[2] - q[1]); if (e < bd) { bd = e; k = i; } });
      const lit = w.slice(0, n).map((x, i) => x > 0 ? i : -1).filter(i => i >= 0), first = lit.length ? lit[0] : -1, last = lit.length ? lit[lit.length - 1] : -1;
      return { n, on, k, first, last, contig: last - first + 1 === on, full: on > 0 && w[n] > 0 && Math.abs(w[last] - w[n]) < 1e-6, taper: on > 0 && w[first] < w[n], ahead: lit.some(i => i >= k), head: !!h && !!dot && k >= 0 && last === k - 1 && +h[3] === +dot[1] && +h[4] === +dot[2], colours: new Set(lit.map(i => ps[i].getAttribute("stroke"))).size };`);
    T.check(`the map's trail (Pikes Peak, a loop flyover on an open road): the last 1.5 km of the route behind the point coloured by the climb (${tr.on} of ${tr.n} pieces, ${tr.colours} colours), thinner towards its far end, the point's own piece up to it, nothing ahead`,
      tr.on > 0 && tr.on <= 0.3 * tr.n && (tr.first === 0 || tr.on >= 0.2 * tr.n) && tr.contig && tr.full && (tr.first === 0 || tr.taper) && !tr.ahead && tr.head && tr.colours >= 2, JSON.stringify(tr));
    await page.waitForTimeout(2500);
    const c0 = await page.evaluate(() => Menu.debug().run);
    await click(page, 'cam:2');
    await page.waitForFunction(() => { const r = document.getElementById('menu-host').shadowRoot, b = r.querySelector('#track-stage .dio.fly'), v = b && b.querySelector('video'); return v && !b.classList.contains('pend') && r.querySelectorAll('#track-stage .dio').length === 1 && !v.paused && v.readyState >= 2; }, null, { timeout: 60000 }).catch(() => null);
    const c = await ev(page, 'const v = ' + VID + '; return { vt: v ? v.currentTime : -1, run: Menu.debug().run };');
    T.check(`map -> flyover: the flyover goes on from the map's moment (${c0.t.toFixed(1)} s), not from its start (the video at ${c.vt.toFixed(1)} s)`, c.vt >= c0.t - 0.05 && c.vt < c0.t + 8 && Math.abs(c.vt - c.run.t) < 0.5, JSON.stringify({ c0, c }));
    // the screen drawn again round the stage (the weather chosen, a sheet opened and closed): the same video plays on, from where it was
    await ev(page, VID + '.__same = 1;');
    const d0 = await ev(page, 'return ' + VID + '.currentTime;');
    await click(page, 'weather:rain'); await page.waitForTimeout(500); await click(page, 'weather:dry'); await page.waitForTimeout(500);
    await click(page, 'more-options'); await page.waitForTimeout(500); await done(page); await page.waitForTimeout(800);
    const d = await ev(page, 'const v = ' + VID + '; return { same: !!v.__same, vt: v.currentTime, paused: v.paused, videos: root.querySelectorAll("video").length };');
    T.check('the weather chosen, a sheet opened and closed: the same flyover plays on (not started again)', d.same && !d.paused && d.vt > d0 && d.videos === 1, JSON.stringify({ d0, d }));
    // another track: a run of its own, from its start
    await click(page, 'track:1'); await page.waitForTimeout(400);
    const e = await page.evaluate(() => Menu.debug().run);
    T.check('another track starts a run of its own, from the start', e.id !== 'pikes' && e.t < 2.5, JSON.stringify(e));
    // a circuit's flyover made as a loop (Spa; R.fly.loop, maketa-menija/orodja/flyover.mjs): the video goes straight on into its next lap, so
    // the picture is not dipped where it loops and the start line's one name stays over it either side of the lap's end (the camera is still 2)
    const wayS = await page.evaluate(() => { const d = Menu.debug(), n = d.list.length, f = (d.list.indexOf('spa') - d.trackIdx + n) % n; return f <= n - f ? 'track:1' : 'track:-1'; });
    for (let k = 0; k < 80 && (await page.evaluate(() => { const d = Menu.debug(); return d.list[d.trackIdx]; })) !== 'spa'; k++) await click(page, wayS);
    await page.waitForFunction(() => { const v = document.getElementById('menu-host').shadowRoot.querySelector('#track-stage .dio.fly:not(.away) video'); return v && /fly-spa\.webm$/.test(v.getAttribute('src')) && !v.paused && v.currentTime > 1; }, null, { timeout: 120000 }).catch(() => null);
    const lp = await page.evaluate(() => new Promise((res) => {
      const root = document.getElementById('menu-host').shadowRoot, box = root.querySelector('#track-stage .dio.fly:not(.away)'), v = box && box.querySelector('video'), lab = box && box.querySelector('.flab'), F = window.ROUTES.spa.fly;
      if (!v || !lab || lab.children.length < 2) { res({ loop: F.loop, none: true }); return; }
      const S = [], t0 = performance.now(); let looped = 0, last = 0;
      const step = () => {
        const t = v.currentTime; if (t < last - 1) looped++; last = t;
        S.push([t, +(v.style.opacity || 1), lab.children[0].style.opacity === '1', lab.children[1].style.opacity === '1']);
        if (performance.now() - t0 < 30000 && !(looped && t > 1)) requestAnimationFrame(step);
        else res({ loop: F.loop, looped, n: S.length, dip: Math.min(...S.map(q => q[1])), before: S.some(q => q[0] > 5 && q[2]), after: S.some(q => q[0] < 5 && q[2]), finish: S.some(q => q[3]) });
      };
      v.addEventListener('seeked', () => requestAnimationFrame(step), { once: true }); v.currentTime = v.duration - 1.5;   // (the lap's last 1.5 s, then on into the next)
    }));
    T.check('a circuit\'s flyover made as a loop (Spa): the picture not dipped where it goes on into its next lap, the start line\'s one name over it before and after', lp.loop === 1 && lp.looped === 1 && lp.dip === 1 && lp.before && lp.after && !lp.finish, JSON.stringify(lp));
    // a track with only its map (the shortest such circuit of the game): its point at the flyovers' even 326 m/s all the way, at the finish
    // straight on into a new lap (no wait; the user's choice 10. 11. 2026: »Da, povsod enako«); its trail the loop's: the last 1500 m behind
    // the point (round the start line), its further half narrowing to nothing
    const mo = await page.evaluate(() => Menu.debug().list.filter(id => { const R = window.ROUTES[id], d = Core.TRACKS.find(x => x.id === id); return R && !R.fly && !R.open && d && !d.test && !d.pending; }).sort((a, b) => window.ROUTES[a].len - window.ROUTES[b].len)[0]);
    if (mo) {   // (none once every real circuit has its flyover: then nothing to check here)
      const wayM = await page.evaluate((id) => { const d = Menu.debug(), n = d.list.length, f = (d.list.indexOf(id) - d.trackIdx + n) % n; return f <= n - f ? 'track:1' : 'track:-1'; }, mo);
      for (let k = 0; k < 80 && (await page.evaluate(() => { const d = Menu.debug(); return d.list[d.trackIdx]; })) !== mo; k++) await click(page, wayM);
      await click(page, 'cam:1');
      await page.waitForFunction((id) => { const r = Menu.debug().run; return r.id === id && r.t > window.ROUTES[id].len / 326 + 0.8; }, mo, { timeout: 90000 }).catch(() => null);
      const mp = await ev(page, `const id = arg, R = window.ROUTES[id], P = R.top.route, run = Menu.debug().run, go = R.len / 326;
        const at = (s) => { const x = (((s % go) + go) % go) / go * (P.length - 1), i = Math.min(P.length - 2, Math.floor(x)), u = x - i; return [P[i][0] + (P[i + 1][0] - P[i][0]) * u, P[i][1] + (P[i + 1][1] - P[i][1]) * u]; };
        const b = root.querySelector("#track-stage .dio.topmap"), m = b && /translate\\(([-\\d.]+) ([-\\d.]+)\\)/.exec(b.querySelector(".rt-dot").getAttribute("transform") || "");
        let best = 1e9; if (m) for (let s = run.t - 0.4; s <= run.t + 0.05; s += 0.01) { const p = at(s); best = Math.min(best, Math.hypot(p[0] - +m[1], p[1] - +m[2])); }
        const w = b ? [...b.querySelectorAll(".rt-tr path")].map(p => +p.getAttribute("stroke-width")) : [], n = w.length - 1;
        return { id, lap: +(run.t - go).toFixed(2), best: +best.toFixed(2), n, head: w[n] > 0, last: w[n - 1] > 0, mid: w[Math.floor(n / 2)], narrow: w.some(x => x > 0 && x < w[n]) };`, mo);
      T.check(`a track with only its map (${mo}): the point at the flyovers' even pace, at the finish straight on into a new lap (${mp.lap} s into it); its trail round the start line, narrowing, not over the whole lap`,
        mp.lap > 0.4 && mp.best < 2.5 && mp.head && mp.last && mp.mid === 0 && mp.narrow, JSON.stringify(mp));
    } else console.log('  skip: a track with only its map (every real circuit has its flyover)');
    T.check('no page errors in the switches', !real(errors).length, real(errors).join(' | '));
    await ctx.close();
  }

  // 12. the career's path of 1.0 (js/kariera.js, part C: the hub; only through the bridge G.kariera / G.karieraStart): the career off, no
  //     strip; on (a small phone upright), the strip in the Career panel (the stage, its progress); tapped: the hub without the valley (the five stages, the
  //     open one chosen, its cups with their state, the class cups with their goals); a locked stage's cup refused (the game's toast, the
  //     hub still open, no championship); on its side the hub fits the screen; an open cup tapped: its first race
  {
    const { ctx, page, errors } = await open({}, { width: 360, height: 640 });
    await ready(page);
    await click(page, 'career');
    const off = await ev(page, 'return { strip: !!root.querySelector(".k-strip"), cards: root.querySelectorAll(".t-sub.four .mode").length, view: window.__game.kariera() };');
    T.check('the career off: the Career panel without the path\'s strip, its four cards', !off.strip && off.cards === 4 && off.view === null, JSON.stringify(off));
    await page.evaluate(() => localStorage.setItem('tdgp-career', JSON.stringify({ v: 1, on: true, money: 4200, cars: ['pico'], upg: {}, earned: 0, races: 3, wins: 1, pot: { stopnja: 1, pokali: { 's1-krog': 2 }, cilji: {}, prve: [], km: { mali: 37 } } })));
    await page.reload(); await ready(page);
    await page.evaluate(() => { __game.S.car = Core.MODELS.findIndex(m => m.id === 'pico'); });
    await click(page, 'career');
    const v = await page.evaluate(() => __game.kariera());
    const st = await ev(page, 'const k = root.querySelector(".k-strip"); return k && { txt: k.querySelector("b").textContent, w: k.querySelector(".bar b").style.width, cards: root.querySelectorAll(".t-sub.four .mode").length };');
    const pct = v && v.napredek.need ? Math.round(v.napredek.done / v.napredek.need * 100) + '%' : '';
    T.check('the career on: the strip above the four cards, the stage and its progress (the stars against the next stage\'s threshold: 2 of 9)', st && st.txt === 'STAGE 1 · ROOKIE' && st.w === pct && st.cards === 4 && v.napredek.done === 2 && v.napredek.need === 9, JSON.stringify({ st, n: v && v.napredek }));
    await page.evaluate(() => { window.MenuDolina = undefined; });   // (the hub: the path without the valley, e.g. no WebGL)
    await page.click('[data-act="kpot"]');
    const hub = await ev(page, 'const s = root.querySelector(".sheet.kpot"); return s && { next: s.querySelector(".kp-prog small").textContent, tabs: [...s.querySelectorAll(".kp-tabs button")].map(b => b.getAttribute("aria-selected") + ":" + b.className + ":" + b.textContent), cups: [...s.querySelectorAll(".kp-list")[0].querySelectorAll(".k-cup")].map(c => c.dataset.act + ":" + c.className.split(" ")[1] + ":" + c.querySelector(".chip").textContent), cls: s.querySelectorAll(".k-cls").length, goals: [...s.querySelectorAll(".k-cls")].map(c => c.querySelector(".kg-row").textContent)[0] };');
    const s1 = v.stopnje[0].pokali.map(c => 'kcup:' + c.id + ':' + c.stanje + ':' + (c.stanje === 'zaklenjen' ? 'LOCKED' : c.stanje === 'osvojen' || c.best ? 'BEST P' + c.best : 'OPEN'));
    T.check('the hub: every stage (the first chosen, the others locked), what opens the next (2 / 9★), stage 1\'s events with their state (the circuit cup won: BEST P2), the class cups with their goals (37 of 100 km)',
      hub && hub.tabs.length === v.stopenj && v.stopenj === 5 && hub.next === '2 / 9★ · opens ' + v.stopnje[1].en.name && hub.tabs[0].startsWith('true::1') && hub.tabs.slice(1).every(t => t.startsWith('false:lk:')) && JSON.stringify(hub.cups) === JSON.stringify(s1) && s1.some(c => c.endsWith('BEST P2'))
      && hub.cls === v.razredi.length && hub.cls === 10 && /37 \/ 100 km/.test(hub.goals), JSON.stringify({ hub, s1 }));
    await page.click('[data-act="kstage:2"]');
    const lk = v.stopnje[1].pokali[0];
    await page.click(`[data-act="kcup:${lk.id}"]`, { force: true });   // (aria-disabled: Playwright would wait for it to be enabled) await page.waitForTimeout(300);
    const ref = await page.evaluate(() => ({ toast: document.getElementById('toast').textContent, champ: localStorage.getItem('tdgp-champ'), race: !!__game.race }));
    const still = await ev(page, 'const s = root.querySelector(".sheet.kpot"); return s && s.querySelector(".kp-tabs [aria-selected=true]").textContent;');
    T.check('a cup of stage 2 tapped: refused (the game\'s toast), the hub still open on stage 2, no championship, no race', /zaklenjen/.test(ref.toast) && !ref.champ && !ref.race && still === 'Club', JSON.stringify({ ref, still }));
    await page.setViewportSize({ width: 640, height: 360 }); await page.waitForTimeout(400);
    const fit = await ev(page, 'const r = root.querySelector(".sheet.kpot").getBoundingClientRect(); return { l: Math.round(r.left), r: Math.round(r.right), t: Math.round(r.top), b: Math.round(r.bottom), sw: root.querySelector(".sheet.kpot").scrollWidth, cw: root.querySelector(".sheet.kpot").clientWidth };');
    T.check('on its side the hub fits the screen (no side scroll)', fit.l >= 0 && fit.r <= 640 && fit.t >= 0 && fit.b <= 360 && fit.sw <= fit.cw, JSON.stringify(fit));
    await page.setViewportSize({ width: 360, height: 640 }); await page.waitForTimeout(300);
    await page.click('[data-act="kstage:1"]');
    const open1 = v.stopnje[0].pokali.find(c => c.stanje === 'odprt');
    await page.click(`[data-act="kcup:${open1.id}"]`);
    const ok = await raceOn(page, open1.tracks[0]).then(() => true).catch(() => false);
    const ch = await page.evaluate(() => ({ champ: JSON.parse(localStorage.getItem('tdgp-champ') || 'null'), sheet: !!document.getElementById('menu-host').shadowRoot.querySelector('.sheet.kpot') }));
    T.check('an open cup tapped: the hub closed, its championship, its first race', ok && ch.champ && ch.champ.id === open1.id && !ch.sheet, JSON.stringify({ ok, ch, id: open1.id }));
    T.check('the career\'s path: no page errors', !real(errors).length, real(errors).join(' | '));
    await ctx.close();
  }

  // 13. the career's valley (js/kariera-dolina.js, MenuDolina; here a stand-in with the same calls, the bridge's atlas and izid stood in
  //     too): the strip with the stars; tapped: the valley opened (no hub), one step in the history; the phone's Back closes it (the
  //     Career panel under it); closed by itself: its step out of the history; an event refused (the valley stays) or started (the history
  //     cleared); back from an event's race (Menu.show): the valley again with its result, the result cleared
  {
    const { ctx, page, errors } = await open({}, { width: 360, height: 640 });
    await ready(page);
    await page.evaluate(() => localStorage.setItem('tdgp-career', JSON.stringify({ v: 1, on: true, money: 4200, cars: ['pico'], upg: {}, earned: 0, races: 3, wins: 1, pot: { stopnja: 1, pokali: {}, cilji: {}, prve: [], km: {} } })));
    // (the game's bridge is not on window: caught as the game hands it to Menu.init)
    await page.addInitScript(() => { let M; Object.defineProperty(window, 'Menu', { configurable: true, get: () => M, set(v) { const i = v.init; v.init = (b) => { window.__bridge = b; return i(b); }; M = v; } }); });
    await page.reload(); await ready(page);
    await page.evaluate(() => {
      __game.S.car = Core.MODELS.findIndex(m => m.id === 'pico');
      const B = window.__bridge, k0 = B.kariera;
      let iz = null;
      B.kariera = () => { const v = k0(); return v && Object.assign(v, { atlas: { stopnje: [], zvezdice: 7, max: 132 } }); };
      B.karieraIzid = (clear) => { if (clear) { iz = null; return null; } return iz; };
      window.__izid = (o) => { iz = o; };
      const D = window.MenuDolina = { log: [], o: null, on: false,
        open(o) { D.o = o; D.on = true; D.log.push('open:' + (o.izid ? o.izid.id : '') + ':' + !!(o.view && o.view.atlas) + ':' + !!o.root); },
        close() { if (!D.on) return; D.on = false; D.log.push('close'); D.o.close(); },
        back() { D.log.push('back'); D.close(); }, isOpen: () => D.on, root: () => null };
    });
    const dl = () => page.evaluate(() => ({ log: MenuDolina.log.join(), on: MenuDolina.on, h: history.state && history.state.nazaj || 0, hub: !!document.getElementById('menu-host').shadowRoot.querySelector('.sheet.kpot'), sub: !!document.getElementById('menu-host').shadowRoot.querySelector('.t-sub.four') }));
    await click(page, 'career');
    const st = await ev(page, 'const k = root.querySelector(".k-strip"); return k && { atlas: k.classList.contains("atlas"), chip: k.querySelector(".chip").textContent, w: k.querySelector(".bar b").style.width };');
    const n13 = await page.evaluate(() => __game.kariera().napredek), w13 = (n13.need ? Math.round(n13.done / n13.need * 100) : 100) + '%';
    T.check('the valley: the strip with the stars (7 of 132), its bar toward the next stage', st && st.atlas && st.chip === '★ 7 / 132' && st.w === w13, JSON.stringify({ st, n13 }));
    await page.click('[data-act="kpot"]'); await page.waitForTimeout(150);
    const d1 = await dl();
    T.check('the strip tapped: the valley opened with the view\'s atlas (no hub), one step in the history', d1.on && d1.log === 'open::true:true' && !d1.hub && d1.h === 1, JSON.stringify(d1));
    await page.goBack(); await page.waitForTimeout(300);
    const d2 = await dl();
    T.check('the phone\'s Back: the valley closed, the Career panel under it', !d2.on && d2.log.endsWith('close') && d2.sub && !d2.hub, JSON.stringify(d2));
    await page.click('[data-act="kpot"]'); await page.waitForTimeout(150);
    await page.evaluate(() => MenuDolina.close()); await page.waitForTimeout(400);
    const d3 = await dl();
    T.check('closed by itself: its step out of the history', !d3.on && d3.h === 0 && d3.sub, JSON.stringify(d3));
    await page.click('[data-act="kpot"]'); await page.waitForTimeout(150);
    const r0 = await page.evaluate(() => { const lk = __game.kariera().stopnje[1].pokali[0].id; document.getElementById('toast').textContent = ''; const ok = MenuDolina.o.start(lk); return { ok, on: MenuDolina.on, toast: document.getElementById('toast').textContent, h: history.state && history.state.nazaj || 0 }; });
    T.check('an event refused (locked): false, the game\'s toast, the valley and its step stay', r0.ok === false && r0.on && /zaklenjen/.test(r0.toast) && r0.h === 1, JSON.stringify(r0));
    await page.evaluate(() => window.__izid({ id: 's1-krog', prej: 0, zdaj: 2, nagrade: [], stopnja: 1 }));
    await page.evaluate(() => { if (MenuDolina.on) MenuDolina.close(); MenuDolina.log.length = 0; Menu.show('title'); }); await page.waitForTimeout(300);
    const d4 = await dl(), left = await page.evaluate(() => __bridge.karieraIzid());
    T.check('back from an event\'s race: the valley again with its result (over the Career panel), the result cleared', d4.on && d4.log === 'open:s1-krog:true:true' && d4.sub && left === null, JSON.stringify({ d4, left }));
    const r1 = await page.evaluate(() => { const id = __game.kariera().stopnje[0].pokali.find(c => c.stanje === 'odprt').id; return { id, ok: MenuDolina.o.start(id) }; });
    const ok = r1.ok && await raceOn(page, (await page.evaluate((id) => __game.kariera().stopnje[0].pokali.find(c => c.id === id).tracks[0], r1.id))).then(() => true).catch(() => false);
    await page.waitForTimeout(1700);
    const d5 = await dl();
    T.check('an event started from the valley: its race, the valley closed, the history cleared', ok && !d5.on && d5.h === 0, JSON.stringify({ r1, d5 }));
    T.check('the career\'s valley: no page errors', !real(errors).length, real(errors).join(' | '));
    await ctx.close();
  }
});
