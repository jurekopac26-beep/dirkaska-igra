// ==== GM (my copy of concepts/_e_store2_pb.js, agent PB's store; my changes are marked "GM:" and my block ">>>> GM BLOCK" after PB's)
// ==== PB (my copy of concepts/_e_store2_bg.js, agent BG's store; my changes are marked "PB:" and my block ">>>> PB BLOCK" after BG's)
// ==== BG (my copy of concepts/_e_store2_l3.js, agent L3's store; my changes are marked "BG:" and my block ">>>> BG BLOCK" before regalAll)
// ==== L3 (my copy of concepts/_e_store2_r.js, agent R's store; my changes are marked "L3:" and my block ">>>> L3 BLOCK" before regalAll)
// ==== W (my copy of concepts/_e_store2_vf.js, the merged store of the last round; my changes are marked "W:"): the user: "Sedaj je
//      zgornja polica previsoka. Naredi, da bo malo nižja. Elementi v zgornji polici naj ne prekrivajo desnega ali levega dela pregrade.
//      Napisi naj bodo v angleščini ... Dvigalka, ki dvigne avto, naj bo druge barve kot modra, saj modre so že police zadaj": (1) the top
//      board down from 3.31 to 2.90 m (RG.TOP: the posts, the light-blue back, the spoilers on the top come down with it; the upper storey's
//      free height 0.92 m to the top's lip instead of 1.33, 0.955 m to its underside); (2) every tuning place (plinth, part, plate) inside its own bay, clear of both posts (U5W: each
//      place's x, plinth width and part scale, chosen by the first view's projected outlines; narrower plinths fitted to their parts, the
//      springs, the dampers and the tyre smoke built a little narrower); (3) every text in the garage's 3D in British English (the plates,
//      the aero model's labels, the drawers' show boards, the trolleys' names and kinds, the scrap bin; the game's HUD and its location
//      banner are the game's); (4) the lift not blue (wLiftColour: its column, carriage and arms recoloured, four variants Y O R G)
// ==== V1 (merged store: _e_store2_t1.js (proposal 1) + idea 5 (the diff _e_store2_t.js -> _e_store2_u5.js); my V1 changes are marked "V1:"; the PROPOSAL 1 section at the end is V2's, not mine)
// ==== IDEA 5 "TUNING DELI" (my copy of concepts/_e_store2_t.js; my changes: u5Shelf and its parts (before regalAll), BOARDS[4] with D, out.tun)
// ==== BASE T: THE SHARED BASE OF THE THREE TROLLEY PROPOSALS (my copy of concepts/_e_store2_h.js, the stacks' layout "h", changed for the
//      user's new wish: "aero, haube, prtljažnik zbriši iz zgornje police. Ko uporabnik recimo klikne hauba ali prtljažnik na avtu, naj ena
//      roka začne z delom, druga roka pa naj pripelje vse 4 različne haube na vozičku ... Aero prestavi v levi predal tako kot je recimo turbo
//      ali amortizerji, v predalu naj bo samo maketa vseh 4 aerotov. Na regalih zbriši žarometi in zavore maske ... Sedaj ko imaš zgornji
//      regal prazen, naj bodo tam luči, vsak regal naj ima 2 luči na polici, zato naj bo ta zgornji regal tudi nižji"; asked, the user said:
//      on the front cabinets only the two signs go, the parts on their tops stay; the lights are the underglow's strips, two a bay, a colour
//      a bay). This base holds what the three proposals share; each proposal adds its own trolley (the bonnets', the boot lids'), its hidden
//      parking place and its own lower upper shelf for the strips.
//        WALL REGAL BEHIND THE CAR, five bays (bay 0 at the left end in the first view): A 0.10 tyres, B 0.81 and C 1.35 exhausts and rims
//        (the tail lamps on C's front edge), D 1.89 an EMPTY board (BASE T v3: the doors are off the regal, the user: "Karkoli je to prestavi
//        tudi na voziček, ki pride, ko se menja ... Sedaj je zgornja polica prazna ... Naj ima tudi zgornja polica svetlo moder ozadje in ne
//        belo, kot je sedaj": the proposals bring them on a trolley; D's board stays as the empty upper shelf's floor), E and F EMPTY (no
//        boards), the back panel and its light-blue band (the storeys' blue and soft shading) up to the top board at 3.31 m, the spoilers on
//        the top. Bay 4 (BASE T v2) is a NORMAL BAY again (the user circled its glass rack: "stekla ... prav tako prestavi na polico, ki jo roka
//        pripelje, ko menja steklo. Namesto stekla sedaj tukaj naredi regale, kot so bili že prej. Spodnji regal naj bodo še 4 gume, regal 1.
//        nadstropje in regal 2. nadstropje pa naj bodo felne, tako kot so že na levem regalu"): A, B, C boards (no D: open over C), one more
//        tyre set on A, a pair of rims on B and on C (B4: the kinds and why); NO GLASS anywhere on the regal (the proposals bring the panes
//        on the arm's trolley); the low end section right of bay 4 keeps its tyres and its two rims (v3: not its doors).
//        GONE (from h): the bonnets' stack over the glass (levels, rails, stops, plates, columns, the HAUBE sign) and the glass's drawer; the
//        strips' stack in bay 2 (boards, clips, plates, posts, the LUČI POD AVTO sign, the notches of the top lips); F's aero rows (their
//        arms, crossbars, hanging posts, tags); every boot lid of D with the arms of their levels (bay 1's and the end section's at 2.21 m)
//        and the end section's posts over its doors' level; the front posts cut under D's lip for the lids are whole again (to D's board);
//        (v2) the glass rack of bay 4 (its five slots with their steps, grooves and combs, the panes, the names on A's lip, the white board
//        behind them, the STEKLA sign); (v3) every door of D (bays 0-2 and the end section, the stock doors' place in bay 0 too) with the
//        arms of their levels (2.055 and 2.21 m) and the arms' brackets on the back panel, and the end section's back posts and back panel
//        over its top (they were there only for its upper door's arms); the pale (nearly white) band over D.
//        FRONT REGAL (the game's two cabinets in front of the car, one drawer row lower): the small parts in one low layer on the tops as in h
//        (headlamps; brake discs, grilles, calipers); their signs ŽAROMETI and ZAVORE · MASKE gone; the left cabinet's middle column's upper
//        drawer holds the AERO PAKETI model (aeroDrawer: four little cars, each in its kit's look).
//        THE ARMS (as in h): each hangs from the bridge on a trolley and a telescopic mast (zMasts); roka 1 on the bridge's + half, roka 2 on
//        its − half (zEnd, zRest); the poses and the reach: zFind, zFindC, zcChain (the reach test: concepts/_z2t_reach_body.js) ====
const ZMAT = { frame: () => PR.mat(0xa7b0bb, { shininess: 70, specular: 0x666666 }), bar: () => PR.mat(0xf2c230, { shininess: 30 }), board: () => PR.lam(0xe9eef4),
  blue: () => PR.mat(0x2a5bd7, { shininess: 90, specular: 0x666666 }), white: () => PR.mat(0xf2f2ee, { shininess: 80 }), black: () => PR.mat(0x111215, { shininess: 30 }),
  chrome: () => PR.mat(0xdfe3e8, { shininess: 160, specular: 0xffffff }), alu: () => PR.mat(0xc3c8cf, { shininess: 110, specular: 0x999999 }), red: () => PR.mat(0xd81f2a, { shininess: 90 }),
  gold: () => PR.mat(0xd4a52a, { shininess: 120, specular: 0xffe9a0 }), yellow: () => PR.mat(0xf2c230, { shininess: 60 }), grey: () => PR.mat(0x7d838b, { shininess: 70 }) };
// a carbon weave (a canvas, cached)
let CARBON = null;
const carbonMat = () => { if (!CARBON) { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#16171a'; g.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = (i + j) % 2 ? '#2b2d33' : '#1d1e22'; g.fillRect(i * 8, j * 8, 8, 8); g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(i * 8 + ((i + j) % 2 ? 0 : 3), j * 8, 2, 8); }
    const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(6, 6); CARBON = t; }
  return new T.MeshPhongMaterial({ map: CARBON, shininess: 120, specular: 0x777777 }); };
// a sign: a navy board with white italic letters and a yellow line under them (one line, or two)
const zSignTex = (a, b) => { const c = document.createElement('canvas'); c.width = 512; c.height = b ? 208 : 128; const g = c.getContext('2d'); g.fillStyle = '#16245a'; g.fillRect(0, 0, 512, c.height); g.fillStyle = '#ffd23f'; g.fillRect(0, c.height - 16, 512, 16);
  g.fillStyle = '#fff'; g.font = `italic 900 ${b ? 70 : 76}px Roboto, Arial`; g.textAlign = 'center'; g.textBaseline = 'middle'; const fit = (t, y) => { let s = 1; const w = g.measureText(t).width; if (w > 480) s = 480 / w; g.save(); g.translate(256, y); g.scale(s, 1); g.fillText(t, 0, 0); g.restore(); };
  if (b) { fit(a, 58); fit(b, 140); } else fit(a, 60); return new T.CanvasTexture(c); };
const zSign = (par, a, b, w, x, y, z) => { const h = w * (b ? 208 : 128) / 512, m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: zSignTex(a, b), side: T.DoubleSide })); m.position.set(x, y, z); par.add(m); return m; };
const zbx = (par, w, h, d, x, y, z, m, rx = 0, ry = 0, rz = 0) => { const o = new T.Mesh(new T.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); par.add(o); return o; };
const zcy = (par, r0, r1, h, x, y, z, m, ax = 'y', seg = 20) => { const o = new T.Mesh(new T.CylinderGeometry(r0, r1, h, seg), m); o.position.set(x, y, z); if (ax === 'z') o.rotation.x = Math.PI / 2; if (ax === 'x') o.rotation.z = Math.PI / 2; par.add(o); return o; };
// ---------------- the parts (each built about its own middle, in the pose it has on the car; kinds as in the menus) ----------------
// a bonnet: 1.62 × 1.68, two white stripes on the car's own (Serijska), carbon (Karbonska), two black vents (Z režami), the scoop (Z zajemalko)
const HOOD_KINDS = ['ser', 'karb', 'reze', 'zaj'];
const hoodPart = (kind) => { const g = new T.Group(), L = HOOD.x1 - HOOD.x0, Wd = 2 * HOOD.z, B = kind === 'karb' ? carbonMat() : ZMAT.blue(), feat = [];   // (FIX 2: feat, the kind's own features (the vents, the scoop) for the first view's measure)
  zbx(g, L, 0.04, Wd, 0, 0, 0, B); for (const s of [-1, 1]) zbx(g, L, 0.044, 0.1, 0, 0, s * 0.13, kind === 'karb' ? ZMAT.grey() : ZMAT.white());
  if (kind === 'reze') for (const s of [-1, 1]) { feat.push(zbx(g, 0.5, 0.05, 0.16, -0.2, 0.012, s * 0.42, ZMAT.black())); for (let i = 0; i < 5; i++) feat.push(zbx(g, 0.012, 0.055, 0.15, -0.42 + i * 0.11, 0.02, s * 0.42, ZMAT.grey())); }
  if (kind === 'zaj') feat.push(scoopOn(g, -0.15, 0.02, ZMAT.blue()));
  g.userData.feat = feat;
  if (kind === 'ser') zbx(g, 0.62, 0.04, 0.44, -0.25, 0.035, 0, PR.mat(0x1f4aa8, { shininess: 90 }));   // the stock bulge
  return g; };
// a door (the panel under the window): 1.07 × 0.55, the car's own (Serijska), carbon, brushed aluminium, racing (the car's own, a white roundel)
const DOOR_KINDS = ['ser', 'karb', 'alu', 'dirk'];
const doorPart = (kind) => { const g = new T.Group(), R = doorRect(), L = R.x1 - R.x0, H = R.y1 - R.y0, B = kind === 'karb' ? carbonMat() : kind === 'alu' ? ZMAT.alu() : ZMAT.blue();
  zbx(g, L, H, 0.05, 0, 0, 0, B); zbx(g, 0.16, 0.025, 0.03, L / 2 - 0.2, H / 2 - 0.1, 0.035, ZMAT.chrome());   // the handle
  if (kind === 'dirk') { zcy(g, 0.16, 0.16, 0.02, -0.05, 0, 0.03, ZMAT.white(), 'z', 28); }
  return g; };
// a boot lid: 0.42 × 1.6 (long across the car), stripes on the car's own (Serijski), aluminium, carbon, racing carbon with two red clips
const LID_KINDS = ['ser', 'alu', 'karb', 'dirk'];
const lidPart = (kind) => { const g = new T.Group(), B = kind === 'alu' ? ZMAT.alu() : kind === 'ser' ? ZMAT.blue() : carbonMat();
  zbx(g, 0.44, 0.04, 1.6, 0, 0, 0, B); if (kind === 'ser') for (const s of [-1, 1]) zbx(g, 0.44, 0.044, 0.1, 0, 0, s * 0.13, ZMAT.white());
  if (kind === 'dirk') for (const s of [-1, 1]) zbx(g, 0.08, 0.05, 0.05, 0.12, 0.03, s * 0.55, ZMAT.red());
  return g; };
// a headlamp (one of the four round lamps): a chrome ring, its glass in the kind's colour; facing +x as on the nose
const LAMP_KINDS = { ser: 0xfff1c1, led: 0xeaf6ff, rum: 0xffd23f, dim: 0x3a3f47, bil: 0xcfe6ff };
const lampPart = (kind) => { const g = new T.Group(); zcy(g, 0.088, 0.088, 0.05, 0, 0, 0, ZMAT.chrome(), 'x', 24);
  const gl = zcy(g, 0.074, 0.074, 0.055, 0.004, 0, 0, new T.MeshPhongMaterial({ color: LAMP_KINDS[kind] || 0xffffff, emissive: new T.Color(LAMP_KINDS[kind] || 0xffffff).multiplyScalar(kind === 'dim' ? 0.05 : 0.25), shininess: 140 }), 'x', 24);
  zcy(g, 0.05, 0.06, 0.07, -0.05, 0, 0, ZMAT.black(), 'x', 16); return g; };
// a tail lamp: 0.44 long, three parts (Serijske red, Dimljene dark, Prozorne clear and red, Okrogle two round, LED-trak a thin band)
const TAIL_KINDS = ['ser', 'dim', 'proz', 'okr', 'led'];
const tailPart = (kind) => { const g = new T.Group(), RD = PR.mat(0xd81f2a, { shininess: 120, emissive: new T.Color(0x3a0508) }), DK = PR.mat(0x3a0d10, { shininess: 140 }), CL = PR.mat(0xeef2f6, { shininess: 160 });
  zbx(g, 0.04, 0.11, 0.46, 0, 0, 0, ZMAT.black());
  if (kind === 'okr') for (const s of [-1, 1]) zcy(g, 0.045, 0.045, 0.03, -0.02, 0, s * 0.11, RD, 'x', 20);
  else if (kind === 'led') zbx(g, 0.03, 0.025, 0.42, -0.02, 0, 0, PR.mat(0xff2d3a, { emissive: new T.Color(0x801018) }));
  else for (let i = -1; i <= 1; i++) zbx(g, 0.03, 0.09, 0.13, -0.02, 0, i * 0.145, kind === 'dim' ? DK : kind === 'proz' && i === 0 ? CL : RD);
  return g; };
// a grille: 0.72 × 0.33, black (Serijska), honeycomb, mesh, chrome, carbon, the car's own
const GRILLE_KINDS = ['ser', 'sat', 'mrez', 'krom', 'karb', 'barva'];
const grillePart = (kind) => { const g = new T.Group(), B = kind === 'krom' ? ZMAT.chrome() : kind === 'karb' ? carbonMat() : kind === 'barva' ? ZMAT.blue() : ZMAT.black();
  zbx(g, 0.04, 0.33, 0.72, 0, 0, 0, B); const L = kind === 'krom' ? ZMAT.grey() : PR.mat(0x2a2d33, { shininess: 40 });
  if (kind === 'sat') for (let i = 0; i < 5; i++) for (let j = 0; j < 9; j++) zcy(g, 0.028, 0.028, 0.012, 0.022, -0.12 + i * 0.06, -0.32 + j * 0.08 + (i % 2) * 0.04, L, 'x', 6);
  else if (kind === 'mrez') { for (let i = 0; i < 6; i++) zbx(g, 0.012, 0.31, 0.012, 0.022, 0, -0.3 + i * 0.12, L, 0.8, 0, 0); }
  else for (let i = 0; i < 6; i++) zbx(g, 0.012, 0.014, 0.68, 0.022, -0.13 + i * 0.052, 0, L);
  return g; };
// the brakes: a disc (stock grey, drilled, ceramic dark with a gold hat) and a caliper (grey, red, yellow, gold, the car's own)
const DISC_KINDS = ['ser', 'sport', 'dirk', 'ker'];
const discPart = (kind) => { const g = new T.Group(), D = kind === 'ker' ? PR.mat(0x3a3d42, { shininess: 60 }) : PR.mat(0x9aa2ac, { shininess: 100, specular: 0x888888 });
  zcy(g, 0.17, 0.17, 0.025, 0, 0, 0, D, 'z', 32); zcy(g, 0.07, 0.07, 0.04, 0, 0, 0.01, kind === 'ker' ? ZMAT.gold() : ZMAT.grey(), 'z', 20);
  if (kind === 'dirk' || kind === 'sport') for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; zcy(g, 0.008, 0.008, 0.03, Math.cos(a) * 0.12, Math.sin(a) * 0.12, 0, ZMAT.black(), 'z', 6); }
  return g; };
const CAL_COLS = { ser: 0x8a929c, rde: 0xd81f2a, rum: 0xf2c230, zla: 0xd4a52a, barva: 0x2a5bd7 };
const caliperPart = (kind) => { const g = new T.Group(); zbx(g, 0.09, 0.15, 0.07, 0, 0, 0, PR.mat(CAL_COLS[kind] || 0x8a929c, { shininess: 90 })); zbx(g, 0.05, 0.04, 0.072, 0.01, 0.03, 0, ZMAT.white()); return g; };
// the aero package: a front lip (across the nose), a sill (along the side), a diffuser (across the tail); by package the bigger the higher
const AERO_KINDS = ['ser', 'cest', 'sport', 'dirk', 'gt'];
const lipPart = (k) => { const g = new T.Group(), i = Math.max(0, AERO_KINDS.indexOf(k)); zbx(g, 0.16 + i * 0.03, 0.035, 1.7, 0, 0, 0, i ? carbonMat() : ZMAT.black()); return g; };
const sillPart = (k) => { const g = new T.Group(), i = Math.max(0, AERO_KINDS.indexOf(k)); zbx(g, 2.0, 0.07 + i * 0.012, 0.08 + i * 0.015, 0, 0, 0, i ? carbonMat() : ZMAT.black()); return g; };
const diffPart = (k) => { const g = new T.Group(), i = Math.max(0, AERO_KINDS.indexOf(k)); zbx(g, 0.3, 0.05, 1.4, 0, 0, 0, i ? carbonMat() : ZMAT.black()); for (let j = 0; j < 4 + i; j++) zbx(g, 0.28, 0.06 + i * 0.01, 0.012, 0, 0.04, -0.6 + j * 1.2 / (3 + i), ZMAT.black()); return g; };
// the underglow's light strip: 2.2 m, in its colour (glowing)
const GLOW_COLS = { mod: 0x2a8cff, tur: 0x17e0d0, vij: 0xb05cff, rde: 0xff2d3a, zel: 0x37e35a };
const stripPart = (k, on = false) => { const g = new T.Group(), c = GLOW_COLS[k] || 0xffffff; zbx(g, 2.2, 0.03, 0.04, 0, 0, 0, ZMAT.black()); zbx(g, 2.16, 0.012, 0.03, 0, -0.018, 0, new T.MeshBasicMaterial({ color: new T.Color(c).multiplyScalar(on ? 1.6 : 0.8) })); return g; };
// ---------------- the places ----------------
// a part put in the scene at a world place and turn (ZCOL: while a section is built, its parts, to hide them with it)
let ZCOL = null;
const zPlace = (part, at, q) => { const g = PR.group(); g.add(part); g.position.copy(at); if (q) g.quaternion.copy(q); g.updateMatrixWorld(true); if (ZCOL) ZCOL.push(g); return g; };
const qOf = (rx, ry, rz) => new T.Quaternion().setFromEuler(new T.Euler(rx, ry, rz, 'YXZ'));
const qAx = (ax, a) => new T.Quaternion().setFromAxisAngle(ax === 'x' ? V(1, 0, 0) : ax === 'y' ? V(0, 1, 0) : V(0, 0, 1), a);
const ON_CAR = (a) => [null, ...a.slice(1)];   // (the stock kind is on the car: its place empty)
// glass (as the windows' pictures: the pane of the window's own shape); stored, each kind in its own clear colour (the user: "druge
// barve, da se bodo bolj videla"): its tint stronger, little glare, a frame round it in a deeper shade of its colour, its menu name on a tag.
// (BASE T v2: no pane is on the regal any more; GKZ, RACK_KINDS_Z, paneOfZ, paneFrame and zTag stay for the proposals' glass trolley)
const GKZ = { ser: { col: 0xb4f0fa, op: 0.55, edge: 0x14a8e0, nm: 'STOCK', sw: '#8fd6ee' }, rah: { col: 0x7489a4, op: 0.86, edge: 0x3d5878, nm: 'LIGHT TINT', sw: '#6f8299' },
  tem: { col: 0x262d38, op: 0.95, edge: 0x10141a, nm: 'DARK TINT', sw: '#2b313b' }, crn: { col: 0x050608, op: 0.99, edge: 0x000000, nm: 'BLACK TINT', sw: '#08090c' }, mod: { col: 0x2283ff, op: 0.92, edge: 0x0a46c8, nm: 'BLUE MIRROR', sw: '#2a7dff' } };   // (W: the glass kinds' tags in English)
const RACK_KINDS_Z = ['ser', 'rah', 'tem', 'crn', 'mod'];
const UPRIGHT_Z = () => new T.Quaternion().setFromUnitVectors(NSIDE, V(0, 0, 1));
// (the pane's outline: the hull of its corners in its own plane (the window's: across it the car's x, NSIDE its normal))
const paneHull = (polys, c) => { const n = NSIDE.clone(), e1 = V(1, 0, 0), e2 = n.clone().cross(e1).normalize(), P = []; let nm = 0, cnt = 0;
  polys.forEach(({ p }) => p.forEach(v => { const d = v.clone().sub(c); P.push([d.dot(e1), d.dot(e2)]); nm += d.dot(n); cnt++; })); nm /= Math.max(1, cnt);
  P.sort((a, b) => a[0] - b[0] || a[1] - b[1]); const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  return lo.slice(0, -1).concat(up.slice(0, -1)).map(([x, y]) => e1.clone().multiplyScalar(x).addScaledVector(e2, y).addScaledVector(n, nm)); };
// (o.pre: a turn applied to the outline first: the pane built standing in its own frame, its box as thin as the glass's curve, so a check of
// what the pane comes into takes the glass, not the car's slab round it)
const paneOfZ = (polys, kind, at, q, o = {}) => { const c = winCenter(polys), pos = [], k = GKZ[kind], pre = o.pre || null, t = V();
  polys.forEach(({ p }) => { for (let i = 1; i < p.length - 1; i++) for (const v of [p[0], p[i], p[i + 1]]) { t.set(v.x - c.x, v.y - c.y, v.z - c.z); if (pre) t.applyQuaternion(pre); pos.push(t.x, t.y, t.z); } });
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.computeVertexNormals();
  // (a tight, faint highlight: a broad one washes a dark tint out to grey from the shelves' light; the mirror one a brighter glint)
  const g = PR.group(); g.add(new T.Mesh(geo, new T.MeshPhongMaterial({ color: k.col, emissive: new T.Color(k.col).multiplyScalar(0.12), transparent: true, opacity: k.op, shininess: kind === 'mod' ? 160 : 220,
    specular: kind === 'mod' ? 0x4a6aa0 : 0x0c0e12, side: T.DoubleSide, depthWrite: k.op > 0.8 })));
  if (o.edge !== false) { const H = paneHull(polys, c).map(v => pre ? v.applyQuaternion(pre) : v), EM = PR.mat(k.edge, { shininess: 60 }); H.forEach((a, i) => { const b = H[(i + 1) % H.length], d = b.clone().sub(a), L = d.length(); if (L < 0.01) return;
      const m = new T.Mesh(new T.CylinderGeometry(0.011, 0.011, L + 0.012, 8), EM); m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); g.add(m); }); }
  g.position.copy(at || c); if (q) g.quaternion.copy(q); g.updateMatrixWorld(true); if (ZCOL) ZCOL.push(g); return g; };
// the kind's name on a tag (as a price tag on a shop's shelf edge): its colour in a square, the name in white on navy
const zTagTexN = (nm, sw) => { const c = document.createElement('canvas'); c.width = 512; c.height = 72; const g = c.getContext('2d'); g.fillStyle = '#16245a'; g.fillRect(0, 0, 512, 72);
  g.fillStyle = sw; g.fillRect(8, 8, 56, 56); g.strokeStyle = '#ffffff'; g.lineWidth = 4; g.strokeRect(8, 8, 56, 56); g.fillStyle = '#fff'; g.font = '900 46px Roboto, Arial'; g.textBaseline = 'middle';
  const w = g.measureText(nm).width, s = Math.min(1, 424 / w); g.save(); g.translate(78, 39); g.scale(s, 1); g.fillText(nm, 0, 0); g.restore(); return new T.CanvasTexture(c); };
const zTagN = (par, nm, sw, x, y, z, w = 0.4) => { const m = new T.Mesh(new T.PlaneGeometry(w, w * 0.14), new T.MeshBasicMaterial({ map: zTagTexN(nm, sw) })); m.position.set(x, y, z); par.add(m); return m; };
const zTag = (par, kind, x, y, z) => zTagN(par, GKZ[kind].nm, GKZ[kind].sw, x, y, z);
// a stored part's paint dulled (the shelves' light: the car's blue stays blue, no white glare off a part on a shelf)
const zMatte = (g) => { g.traverse(m => { if (m.isMesh && m.material && m.material.isMeshPhongMaterial && !m.material.transparent) { m.material = m.material.clone(); m.material.shininess = Math.min(m.material.shininess, 16); m.material.specular = new T.Color(0x161616); } }); return g; };
// a sign that reads the right way round from both sides (two planes back to back)
const zSign2 = (par, a, b, w, x, y, z, rx = 0) => { const g = new T.Group(); g.position.set(x, y, z); g.rotation.x = rx; par.add(g); const h = w * (b ? 208 : 128) / 512, tex = zSignTex(a, b);
  for (const s of [0, 1]) { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex })); m.rotation.y = s * Math.PI; m.position.z = s ? -0.003 : 0.003; g.add(m); } return g; };
// ---- the room: no trophies on the back wall, no windows (the openings walled up with the wall's own panels, their mapping u = (x + 9) / 3,
//      v = y / 1.2; the night pictures behind them and the windows' light frames out; the patches are kept in a view from above: keepTop);
//      the left wall's roll-up door down ----
const WINO = [[-6.85, -4.95], [-3.7, -1.8], [-1.3, 0.6], [2, 3.9], [5.15, 7.05]], WINY2 = [3.45, 4.3];
let ROOM2 = null;
const zRoom2 = (S) => { if (S && S.tro) S.tro.visible = false;
  PR.objs.forEach(o => o.traverse(m => { if (m.isMesh && m.geometry.type === 'PlaneGeometry' && m.geometry.parameters && Math.abs(m.geometry.parameters.width - 1.88) < 0.01 && Math.abs(m.geometry.parameters.height - 0.84) < 0.01) m.visible = false; }));
  let shell = null; G3.scene.traverse(o => { if (!shell && o.isMesh && o.material && o.material.type === 'MeshLambertMaterial' && o.material.map && o.geometry.attributes.position && o.geometry.attributes.position.count === 228) shell = o; });
  if (shell) WINO.forEach(([x0, x1]) => { const w = x1 - x0 + 0.04, h = WINY2[1] - WINY2[0] + 0.04, geo = new T.PlaneGeometry(w, h), P = geo.attributes.position, U = geo.attributes.uv, cx = (x0 + x1) / 2, cyy = (WINY2[0] + WINY2[1]) / 2;
    for (let i = 0; i < P.count; i++) U.setXY(i, (cx + P.getX(i) + 9) / 3, (cyy + P.getY(i)) / 1.2);
    const m = new T.Mesh(geo, shell.material); m.position.set(cx, cyy, -4.994); m.receiveShadow = true; m.userData.keepTop = true; PR.group().add(m); });
  // the windows' frames: the room's meshes (not the shell) with triangles in a window's opening on the back wall
  if (!ROOM2) { ROOM2 = []; G3.scene.traverse(o => { if (!o.isMesh || o === shell || !o.geometry || !o.geometry.attributes.position) return; if (PR.objs.some(p => { let q = o; while (q) { if (q === p) return true; q = q.parent; } return false; })) return;
      const b = new T.Box3().setFromObject(o); if (b.isEmpty() || b.min.z > -4.7 || b.max.y < 3.3 || b.min.y > 4.45) return; ROOM2.push(o); }); }
  const inWin = (q) => q.z < -4.82 && q.z > -5.25 && q.y > WINY2[0] - 0.12 && q.y < WINY2[1] + 0.12 && WINO.some(([x0, x1]) => q.x > x0 - 0.12 && q.x < x1 + 0.12);
  ROOM2.forEach(o => { if (o.userData.noWin) return; o.userData.noWin = true; filterTris(o, (v) => !v.every(inWin)); });
  // the left wall's roll-up door down (its opening, 5 m wide and 3.9 m high left of the regal, showed the bright outside)
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#8e98a3'; g.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 4; i++) { g.fillStyle = '#5f6872'; g.fillRect(0, i * 16 + 13, 64, 3); g.fillStyle = '#b4bcc6'; g.fillRect(0, i * 16, 64, 2); }
  const tx = new T.CanvasTexture(c); tx.wrapS = tx.wrapT = T.RepeatWrapping; tx.repeat.set(1, 3.9 / 0.4);
  const dr = new T.Mesh(new T.PlaneGeometry(5.0, 3.9), PR.lam(0xffffff, { map: tx })); dr.rotation.y = Math.PI / 2; dr.position.set(-8.99, 1.95, 0); dr.receiveShadow = true; PR.group().add(dr); };
// ---- the wall regal behind the car: the game's five bays round (0, 0.2) (CF's origin), radius 4.75, a the angle in the home camera's frame
//      (the game's way, + toward the nose); bay i its index 0..4 (bay 0 at the regal's left end). Storeys: A 0.10 tyres, B 0.81 and C 1.35
//      exhausts and rims (the tail lamps on C's front edge), D 1.89 an empty board (BASE T v3: the doors are off the regal); over D (E 2.36,
//      F 2.74–3.20) the UPPER SHELF, EMPTY in this base (no boards; each proposal puts its own shelf there and may lower the top), the
//      spoilers on the top (3.31). The front posts go up to D's board only (the bays stand round the ring: a neighbour's front post would
//      stand 12 cm into a bay's opening; over D only the back posts go on up). Bay 4 (in the home view right of the car's nose) is a normal bay
//      again (BASE T v2: A, B, C; no D, the bay open over C; its tyre set on A, a pair of rims on B and on C; X0: the end section's Gorska
//      tyres and its orange 10-spoke and black mesh rims, the end section is gone: bay 4's right posts end the regal). RG.TOP (the top
//      board) and RG.ET (the back panel's top: null, BASE T v3's default, the back and its light-blue band go up to the top board's
//      underside; a number stops them there) are read when the regal is built: a proposal may lower them in its own file before its
//      frames run ----
const RG = { R: 4.75, LV: [0.06, 0.705, 1.35, 1.995, 2.64], FRONT: 2.0125, H: 0.645, ET: null, TOP: 2.66,   // (L3: EVERY STOREY 0.645 m from board to board (H): A 0.06, B 0.705, C 1.35, D 1.995, the top board's middle 2.64 (LV[4]; RG.TOP 2.66 as R's), the lit panels' level 2.66-3.30; were A 0.10, B 0.81, C 1.35, D 1.89, the top 2.66: 0.71, 0.54, 0.54, 0.77; FRONT D's top face)
    // (R: the top board 2.66 m, was 2.90 (W) and 3.31: the upper storey's free height 0.68 m to the top's lip, 0.715 m to its underside, as the storeys below (0.54-0.71 m))
  WL: null,   // (R: the spoilers' light: null as today, 'L1'..'L6' the six versions (wingLight, after regalAll's R block))
  BG: null,   // (BG: the regal's background and posts: null the light-blue back and the navy perforated posts, 1..6 the six versions (BGV, the BG block))
  PB: null,   // (PB: six versions of BG's version 1, the light-grey pegboard: 1..6 (PBV, the PB block) over RG.BG; null: BG's own)
  GM: null,   // (GM: 1 L3 A's light-blue back with P3's slots, the two tyre sets the car covers gone (GMV, GMG, the GM block); 2 the same back without slots (a reference); null: PB's)
  WZ: 0.1, WSC: [1.0, 1.1, 1.05, 1.05, 1.0] };   // (WZ: the spoilers 0.1 m nearer the
// top's front edge (the gripper's fingers' root stays in front of the top board when the jaws close on a spoiler's stand); WSC: the wings'
// sizes on the top (1.1 to 1.45 m, a car's width, each clear of its neighbours at rest and on its way out))
// ---- a spoiler on the top: the game's display leans each wing 0.45 rad toward the car, the feet of its stands with it (their front edges
//      sank into the board); here each foot lies flat on the board (turned back under its stand) and the wing sits on them, its lowest point
//      on the board's face: lifted straight up it is free ----
const wingSeat = (sc, g) => { const ys = RG.TOP - 0.0025, L = (m, x, y, z) => sc.g.worldToLocal(V(x, y, z).applyMatrix4(m.matrixWorld)), boxes = [];
  g.traverse(m => { if (m.isMesh && m.geometry.type === 'BoxGeometry') boxes.push(m); });
  boxes.forEach(m => { const P = m.geometry.parameters; if (Math.abs(P.width - 0.13) < 1e-3 && Math.abs(P.height - 0.014) < 1e-3 && Math.abs(P.depth - 0.13) < 1e-3) m.rotation.x = -m.parent.rotation.x; });
  sc.g.updateMatrixWorld(true); let lo = 9;
  boxes.forEach(m => { const P = m.geometry.parameters; for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) lo = Math.min(lo, L(m, x * P.width / 2, y * P.height / 2, z * P.depth / 2).y); });
  const dy = ys + 0.0005 - lo; g.position.y += dy; g.children.forEach(c => { if (c.isMesh && c.geometry.type === 'PlaneGeometry') c.position.y -= dy; }); sc.g.updateMatrixWorld(true); };
const rgAt = (a, dz = 0) => { const [x, z] = CF((RG.R - dz) * Math.sin(a), -(RG.R - dz) * Math.cos(a)); return V(x, 0, z); };
const rgHalf = (w) => Math.atan(w / 2 / RG.R);
const rgAngles = (S) => { const a = S.segs.map(sg => 0.3 - sg.g.rotation.y), sa = a[1] - a[0], L = S.segs[0].L, B = a[a.length - 1] + sa / 2, A0 = a[0] - sa / 2; return { a, sa, L, B, A0 }; };
const RGM = () => ({ UP: PR.mat(0x1b2b5c, { shininess: 40 }), BD: PR.mat(0x2a2d33, { shininess: 30 }), BK: PR.lam(0x24386f), HOLE: PR.lam(0x0d0e10), ST: PR.mat(0x9aa2ac, { shininess: 90 }),
  FELT: PR.lam(0x3a3f4a), PALE: PR.lam(0xfff2c4, { emissive: 0x302810 }), LIGHT: PR.lam(0xc3cdd8), YEL: ZMAT.bar(), WHITE: PR.lam(0xf4f7fa, { emissive: 0x2c3238 }),
  STEP: PR.mat(0x3a3f4a, { shininess: 30 }), DARK: PR.mat(0x17181c, { shininess: 30 }) });
// a section of the regal (the game's navy shelving) at angle a, L wide, D deep, top high: its uprights (the corners) with their slots (the
// front ones o.front high: in F only the back posts go on up), the top board and its lip (sc.topM), the back panel
const rgFrame = (par, a, L, D, top, o = {}) => { const M = RGM(), g = new T.Group(); g.position.copy(rgAt(a, D / 2 - 0.33)); g.rotation.y = 0.3 - a; par.add(g);
  const fr = new T.Group(); g.add(fr);
  const pSpec = []; for (const x of [-L / 2, L / 2]) for (const z of [-D / 2 + 0.03, D / 2 - 0.03]) { const h = z > 0 && o.front && !BGP.frontUp ? (o.frontAt ? o.frontAt(x) : o.front) : top; pSpec.push({ x, z, h, front: z > 0 }); }   // (BG: the front posts up to the top board as the back ones (BGP.frontUp): storey D has its front posts, at every bay boundary and at both ends)
  const posts = bgPostsBuild(fr, pSpec, M);   // (BG: the four posts in the version's style (RG.BG; null: today's navy perforated ones), merged: one mesh a material)
  const tb = bx(fr, L + 0.06, 0.035, D, 0, top - 0.02, 0, M.BD), tl = bx(fr, L + 0.06, 0.05, 0.03, 0, top - 0.05, D / 2, M.UP);   // (the lip hangs under the board's front edge: a level tool takes a spoiler's stand over it)
  const bh = o.backTop || top; bx(fr, L, bh, 0.02, 0, bh / 2, -D / 2, o.back || M.BK);
  const q = new T.Quaternion().setFromEuler(new T.Euler(0, 0.3 - a, 0)), sc = { g, frame: fr, L, D, top, a, q, M, topM: [tb, tl], posts };   // (BG: posts: { style, list, meshes })
  sc.at = (x, y, z) => g.localToWorld(V(x, y, z)); sc.out = V(0, 0, 1).applyQuaternion(q); sc.along = V(1, 0, 0).applyQuaternion(q); g.updateMatrixWorld(true); return sc; };
// a board across a section at y (from z0 to z1), its lip at the front (navy, as every lip of the regal)
const rgBoard = (sc, y, m, z0 = -sc.D / 2, z1 = sc.D / 2) => { bx(sc.frame, sc.L + 0.06, 0.035, z1 - z0, 0, y, (z0 + z1) / 2, sc.M.BD); bx(sc.frame, sc.L + 0.06, 0.05, 0.03, 0, y - 0.01, z1, m || sc.M.UP); };
// a plate on a section (navy, white letters, the yellow line), facing the car
const rgPlate = (sc, a, b, w, x = 0, y = null, z = null) => zSign2(sc.g, a, b, w, x, y == null ? sc.top + 0.2 : y, z == null ? sc.D / 2 - 0.08 : z);
// the rims a storey lower need a lower stand: the game's (rimsOnStands) at scale s
const rimsOn2 = (g, d, S, s = 0.92, h = 0.03) => { const out = [];
  [-1, 1].forEach((sd) => { const x = sd * (S.L / 4 - 0.04), p = new T.Group(); g.add(p); out.push(p); p.scale.setScalar(s); p.position.set(x, h, 0.04);
    stand(g, x, -0.12, h + 0.255 * s, false); cy(g, 0.02, 0.02, 0.2, x, h + 0.255 * s, -0.05, POSTM.chrome(), 'z', 10); rimD(p, d);
    shadowR(g, 0.84 * s / 1.2, 0.8 * s / 1.2, x + 0.11, h + 0.18, -S.D / 2 + 0.05, 0.85, false); shadowR(g, 0.7, 0.4, x + 0.05, 0.003, -0.02, 0.9, true); });
  return out; };
// (BASE T v2: THE GLASS IS OFF THE REGAL. The user circled bay 4's glass rack in the first view: "stekla, ki sem jih označil z rdečo, prav
//  tako prestavi na polico, ki jo roka pripelje, ko menja steklo" (the panes go onto the shelf the arm brings when it changes the glass: a
//  trolley, each proposal builds its own). 00c's stepped rack went with them (GR and glassRack: the five slots with their steps, grooves
//  and combs, the names on A's lip, the white board behind the panes; the STEKLA sign in regalAll). Kept for the trolley: paneFrame(W) (a
//  pane of the door's window standing upright: PF.qUp; its height PF.uM - PF.um; PF.xtL the left end of its top edge, 00c's grip),
//  paneOfZ(W.door_r, kind, at, q, { pre: PF.qUp }) (the pane in its clear colour with its frame), GKZ (the kinds' colours and names),
//  RACK_KINDS_Z (the menu's order), zTag / zTagN (a name tag))
const paneFrame = (W) => { const eu = V(0, NSIDE.z, -NSIDE.y).normalize(), c = winCenter(W.door_r); let um = 9, uM = -9; W.door_r.forEach(({ p }) => p.forEach(v => { const u = v.clone().sub(c).dot(eu); um = Math.min(um, u); uM = Math.max(uM, u); }));
  let xs = [], xt = [], xa = []; W.door_r.forEach(({ p }) => p.forEach(v => { const d = v.clone().sub(c), u = d.dot(eu); xa.push(d.x); if (u < um + 0.02) xs.push(d.x); if (u > uM - 0.02) xt.push(d.x); }));
  const xm = (Math.min(...xs) + Math.max(...xs)) / 2, mP = new T.Matrix4().makeBasis(V(1, 0, 0), eu, NSIDE);
  return { qUp: new T.Quaternion().setFromRotationMatrix(mP.clone().transpose()), um, uM, xm, xtL: Math.min(...xt), x0: Math.min(...xa), x1: Math.max(...xa) }; };
// ---- BAY 4 A NORMAL BAY AGAIN (BASE T v2; the user: "Namesto stekla sedaj tukaj naredi regale, kot so bili že prej. Spodnji regal naj bodo
//      še 4 gume, regal 1. nadstropje in regal 2. nadstropje pa naj bodo felne, tako kot so že na levem regalu"): A, B and C boards as in
//      bays 0-3 (no D: the bay is open over C), on A one more tyre set (four standing in a row, as every bay's), on B and on C a pair of rims
//      on rimsOn2's stands (as bay 3's). THE KINDS (the game's menus, concepts/_menus_final.js): every tyre of the "Gume" tab is on the regal
//      already (Sneg, Makadam, Cesta, Dirkališče in bays 0-3, Gorska on the end section), so the set is the "Dim gum" tab's VIJOLIČEN (the
//      tyres as the others with a road tread, their side rings violet, a violet smoke cloud on the sticker); of the "Platišča" tab's five
//      rims four are on the regal (bay 3 and the end section), so B holds the fifth, SERIJSKA (silver, five spokes each split in two: the
//      game's own wheel; its steel nuts, the "Matice" tab's Serijske) and C, no rim kind being left, the closest: Serijska with the "Matice"
//      tab's other kind, BARVNE (coloured aluminium nuts: red here, in the game the stripes' colour) ----
const B4 = { tyre: { key: 'vij', nm: 'Vijoličen', tab: 'Dim gum', col: 0xa855f7, typ: 'road', r: 0.31, w: 0.22 },
  rims: [{ p: 'split', c: 0xc8ccd2, nm: 'serijska, dvojni kraki', nuts: 0x9aa2ac, nutNm: 'serijske matice' }, { p: 'split', c: 0xc8ccd2, nm: 'serijska, barvne matice', nuts: 0xd81f2a, nutNm: 'barvne matice' }] };
// (X0: B4 IS NOT ON THE REGAL ANY MORE: bay 4 holds the end section's Gorska tyres and its two rims (regalAll); B4, b4Mats, b4Tyre,
//  b4TyreSet and b4Nuts stay defined for whoever names or shows these kinds elsewhere (the coloured nuts: the front cabinets))
// the set's sticker (as the game's: white, a band in the kind's colour, a navy frame; a smoke cloud over a road in the colour) and its ring's
// material (once a scene); a tyre as s.js's tyre (the tread round it, the dark sides, the ring and the dark hole on each side, the sticker on
// the tread's front)
let B4MAT = null;
const b4Mats = (K) => { if (B4MAT && B4MAT.key === K.key) return B4MAT; const cv = document.createElement('canvas'); cv.width = 64; cv.height = 96; const g = cv.getContext('2d'), col = '#' + K.col.toString(16).padStart(6, '0');
  g.fillStyle = '#f4f4f0'; g.fillRect(0, 0, 64, 96); g.fillStyle = col; g.fillRect(0, 0, 64, 24); g.strokeStyle = '#0d1626'; g.lineWidth = 3; g.strokeRect(1.5, 1.5, 61, 93);
  g.fillStyle = col; for (const [x, y, r] of [[19, 64, 10], [32, 55, 13], [45, 63, 10], [26, 72, 10], [40, 72, 10]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
  g.fillStyle = '#0d1626'; g.fillRect(8, 85, 48, 4);
  B4MAT = { key: K.key, st: new T.MeshBasicMaterial({ map: new T.CanvasTexture(cv) }), ring: new T.MeshBasicMaterial({ color: new T.Color(K.col).multiplyScalar(1.05), side: T.DoubleSide }) }; return B4MAT; };
const b4Tyre = (g, K, x, y, z) => { const M = b4Mats(K), m = new T.Mesh(new T.CylinderGeometry(K.r, K.r, K.w, 30, 1, false), [treadM(K.typ), SIDEM, SIDEM]); m.position.set(x, y, z); m.rotation.set(0, 0, Math.PI / 2); g.add(m);
  for (const s of [-1, 1]) { const ring = new T.Mesh(new T.RingGeometry(K.r * 0.7, K.r * 0.79, 30), M.ring); ring.position.y = s * (K.w / 2 + 0.002); ring.rotation.x = -s * Math.PI / 2; m.add(ring);
    const hole = new T.Mesh(new T.CircleGeometry(K.r * 0.62, 24), HOLEM); hole.position.y = s * (K.w / 2 + 0.003); hole.rotation.x = -s * Math.PI / 2; m.add(hole); }
  const st = new T.Mesh(new T.PlaneGeometry(0.11, Math.min(0.165, K.w * 0.8)), M.st); st.position.set(0, 0, K.r + 0.003); st.rotation.z = -Math.PI / 2; m.add(st); return m; };
const b4TyreSet = (g, K) => { for (let i = 0; i < 4; i++) b4Tyre(g, K, (i - 1.5) * 0.28, K.r, 0); g.userData.kind = K.key; g.userData.r = K.r; return g; };   // (as tyreSet's 'row')
// the rims' nuts: five on the hub's face of each rim (rimsOn2's rims; rimD's rim group, its face toward the car), on a 4 cm bolt circle,
// hexagonal, 1.9 cm out of the hub
const b4Nuts = (ps, col) => { const NM = PR.mat(col, { shininess: 120, specular: 0x999999 }); ps.forEach(p => { const r = p.children.find(c => c.isGroup) || p.children[0];
  for (let i = 0; i < 5; i++) { const a = Math.PI / 2 + i * 2 * Math.PI / 5; zcy(r, 0.0105, 0.0105, 0.022, Math.cos(a) * 0.04, Math.sin(a) * 0.04, 0.023, NM, 'z', 6); } }); };
// ---- the tail lamps along C's front edge (bays 1 and 2, in front of the exhausts): a pair a kind, the front one and the back
//      one, standing on their long edge on two cradles, their lenses to the car; 8 cm and more between the kinds ----
const TLP = [[1, -0.54], [1, 0], [1, 0.54], [2, -0.27], [2, 0.27]], TLY = RG.LV[2] + 0.0175 + 0.014 + 0.055, TLZ = [0.272, 0.192], TLH = [0.04, 0.13];
const tailRow = (secs, o = {}) => { const fill = o.fill || ON_CAR(TAIL_KINDS), n = o.n || {}, out = {};
  out.q = (k) => secs[TLP[k][0]].q.clone().multiply(qAx('y', Math.PI / 2)); out.at = (k, j) => secs[TLP[k][0]].at(TLP[k][1], TLY - 0.014 + TLH[j], TLZ[j]);
  out.grip = (k, j) => out.at(k, j).addScaledVector(secs[TLP[k][0]].out, 0.03); out.sec = (k) => secs[TLP[k][0]];
  TLP.forEach(([si, x], k) => { const sc = secs[si], M = sc.M, hl = k === o.hl;
    TLZ.forEach((z, j) => { for (const s of [-1, 1]) bx(sc.g, 0.05, TLH[j], 0.06, x + s * 0.17, RG.LV[2] + 0.0175 + TLH[j] / 2, z, hl ? M.PALE : M.ST); });
    if (hl) bx(sc.g, 0.58, 0.052, 0.032, x, RG.LV[2] - 0.01, sc.D / 2 + 0.003, M.YEL);
    const kd = fill[k]; if (kd) for (let j = 2 - (n[k] != null ? n[k] : 2); j < 2; j++) zPlace(tailPart(kd), out.at(k, j), out.q(k)); });
  return out; };
// ---- D: NO DOORS ANY MORE (BASE T v3; the user circled the doors lying on D in bays 1 and 2: "Karkoli je to prestavi tudi na voziček, ki
//      pride, ko se menja ... Sedaj je zgornja polica prazna ... Naj ima tudi zgornja polica svetlo moder ozadje in ne belo, kot je sedaj"):
//      every door is off the regal (bays 0..2 and the end section, the stock doors' place in bay 0 too) and with them dlStore's levels over
//      D's board (the arms at 2.055 and 2.21 m and their brackets on the back panel) and the end section's posts and back panel over its top;
//      the proposals bring the four kinds on the arm's trolley. D's board stays, the empty upper shelf's floor. Kept for the trolley:
//      DOOR_KINDS, doorPart(kind) (1.07 × 0.55 × 0.05 m about its middle, its outer face +z), doorRect() (the door's rectangle on the car);
//      on the regal a door lay flat, its outer face up, and the gripper took the middle of its front (long) edge, the tool level, the jaws
//      over and under it ----
// ---- the names and the boards kept from h for the proposals: the strips' colours and names, the bonnets' names, a name in big letters on a
//      board's face (hNameTex, hNameMats), a name card standing on a bonnet (hCardOn), a sign board (hSignBox), a basis turn (hsQB) ----
const STRIP_KEYS = Object.keys(GLOW_COLS), STRIP_NM = { mod: 'BLUE', tur: 'TURQUOISE', vij: 'PURPLE', rde: 'RED', zel: 'GREEN' };   // (W: in English; not shown in this base)
const HOOD_NM = ['STOCK', 'CARBON', 'VENTED', 'SCOOP'],   // (W: in English; not shown in this base)
  HOOD_SW = ['#2a5bd7', '#3a3d44', '#2a5bd7', '#2a5bd7'];
// ---- FIX 2 (the looks): a name in big letters (white on navy, the regal's yellow line under it) on a canvas of the plate's own shape, and
//      the materials of a thin board with it on one face (a solid board: the reach test's sweeps see it, a plane they would not) ----
const hNameTex = (txt, aspect, o = {}) => { const H = o.H || 128, W = Math.max(128, Math.round(H * aspect)), c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  g.fillStyle = o.bg || '#16245a'; g.fillRect(0, 0, W, H); const ln = o.line === false ? 0 : typeof o.line === 'number' ? o.line : 9; if (ln) { g.fillStyle = '#ffd23f'; g.fillRect(0, H - ln, W, ln); }
  let x0 = 0; if (o.sw) { const q = Math.round(H * 0.62); g.fillStyle = o.sw; g.fillRect(10, (H - q) / 2, q, q); g.strokeStyle = '#ffffff'; g.lineWidth = 5; g.strokeRect(10, (H - q) / 2, q, q); x0 = q + 16; }   // (o.sw: the kind's colour in a square at its left)
  const lines = String(txt).split('\n'), fs = o.font || (lines.length > 1 ? 54 : 98); g.fillStyle = o.fg || '#ffffff'; g.font = `${o.italic ? 'italic ' : ''}900 ${fs}px Roboto, Arial`; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  const pad = o.pad != null ? o.pad : 14, avail = W - x0 - 2 * pad, cx = x0 + pad + avail / 2;
  lines.forEach((t, k) => { const w = g.measureText(t).width, s = Math.min(o.squeeze || 1.0, avail / w), base = lines.length > 1 ? (H - ln) * (k + 1) / lines.length - 10 : (o.base || (H - ln - 12));
    g.save(); g.translate(cx, base); g.scale(s, 1); g.fillText(t, 0, 0); g.restore(); });
  const t = new T.CanvasTexture(c); t.anisotropy = 8; return t; };
const hNameMats = (txt, aspect, face = 'front', o = {}) => { const NV = new T.MeshBasicMaterial({ color: 0x16245a }), F = new T.MeshBasicMaterial({ map: hNameTex(txt, aspect, o) });
  const L = [NV, NV, NV, NV, NV, NV]; L[face === 'top' ? 2 : 4] = F; return L; };
// the bonnets' name cards: a card standing on a new bonnet near its near edge (its foot 6 cm in), leaning back 35°, over the bonnet's left
// half (the arms come to the stack from the right: the card stays in view; the vents and the scoop lie further up the slope, 0.34 m and
// more from the near edge); the stock bonnet (off the car) has none: its level's name is on the plate on the stack's right column
const HCARD = { w: 0.46, h: 0.12, x: -0.55, zn: 0.06, back: 35 * Math.PI / 180, pw: 0.70, ph: 0.15 };   // (from 0.32 to 0.78 m left of the middle: far from the gripper's fingers at the near edge's middle, in front of only the left end of the vents)
const hHasCard = (kind) => !!kind && kind !== 'ser';
const HLABEL = { bg: '#f4f6f8', fg: '#16245a', line: 8 };   // (the kinds' names light, as labels: apart from the navy signs over the stacks)
const hCardOn = (par, txt) => { const g = new T.Group(), th = HCARD.back, h = HCARD.h; g.position.set(HCARD.x, 0.02, HOOD.z - HCARD.zn); g.rotation.x = -th; par.add(g);
  const m = new T.Mesh(new T.BoxGeometry(HCARD.w, h, 0.005), hNameMats(txt, HCARD.w / h, 'front', HLABEL)); m.position.set(0, h / 2, 0); g.add(m);
  zbx(g, HCARD.w, 0.016, 0.03, 0, 0.008, -0.004, ZMAT.black()); return m; };   // (a black clip along its foot)
// a sign board (the stacks' signs): a navy board, its name in big italic letters on its front
const hSignBox = (par, txt, w, h, x, y, z, o = {}) => { const m = new T.Mesh(new T.BoxGeometry(w, h, 0.012), hNameMats(txt, w / h, 'front', Object.assign({ italic: true, font: 104, pad: 30, squeeze: 1.25 }, o.tex || {}))); m.position.set(x, y, z); par.add(m); return m; };
const hsQB = (X, Y, Z) => new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(X, Y, Z));
const AERO_COL = [0x9aa2ac, 0x22c55e, 0x2a8cff, 0xd81f2a, 0xff7a1a], AERO_NM = ['STOCK', 'STREET', 'SPORT', 'RACE', 'GT PACK'];   // (W: the aero model's labels in English)
let CARBON2 = null;
const carbonMat2 = () => { if (!CARBON2) { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#3a3d44'; g.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = (i + j) % 2 ? '#5a5e68' : '#43464e'; g.fillRect(i * 8, j * 8, 8, 8); g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(i * 8 + ((i + j) % 2 ? 0 : 3), j * 8, 2, 8); }
    const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(6, 6); CARBON2 = t; }
  return new T.MeshPhongMaterial({ map: CARBON2, shininess: 30, specular: 0x222222 }); };
// ---- X0: NO END SECTION ANY MORE (the user circled it in the first view, "regal številka 6": "tega zbriši"): the low section right of
//      bay 4 (endSec: its four posts, its A, B and C boards with their lips, its top board, its back panel and blue bands, its Gorska tyres
//      and its two rims, their stands and shadows) is gone, and st.regal.end with it. Its parts are in bay 4 now (regalAll): A the Gorska
//      set (in place of the violet tyre-smoke set: TYRE SMOKE is on the upper shelf), B the orange 10-spoke rims, C the black mesh rims (in
//      place of the stock rims, which are on the car, and the stock rims with the coloured nuts: the front cabinets show COLOURED NUTS).
//      Bay 4's right posts are the regal's right end, as bay 0's left posts are its left end (rgFrame's corners: the front one up to D's
//      board, the back one up to the top) ----
// ---- the regal (BASE T v3): the five bays (bay 4 a normal bay again: A, B, C), (X0: no end section), the tail lamps, the spoilers on the
//      top; D's board empty and over it the upper shelf, empty (no boards, nothing hangs there); no glass, no doors. The back: the game's
//      light blue (FO.blue) with the soft shading in every storey, up to the top board (v3: also over D, where it was pale, nearly white, and
//      over the back panel's old top at 2.72 m, where the room's wall showed; bayBackAOH: the shading drawn the same size in metres as in
//      the storeys below). The sign: ZADNJE LUČI under C's front edge in bay 1 (STEKLA is gone with the glass). V1: no tail lamps and no sign
//      ZADNJE LUČI on the regal any more (they are on the left front cabinet's top: vTailTop); the upper shelf holds idea 5's tuning parts ----
// the back's shading for a band of any height: AOT's (the game's) gradients at the size they have on a 0.49 m storey band (under the board
// above 0.2 m dark, at the foot 6 cm, 0.28 m at each side; AOT itself stretched over a 1.4 m band would darken 0.55 m under the top)
const AOTH = {};
const aoTexH = (h) => { const H = Math.max(128, Math.round(128 * h / 0.49)); if (AOTH[H]) return AOTH[H]; const c = document.createElement('canvas'); c.width = 128; c.height = H; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 128, H);
  const band = (x0, y0, x1, y1, a) => { const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, H); };
  band(0, 0, 0, 52, 0.55); band(0, 0, 22, 0, 0.3); band(128, 0, 106, 0, 0.3); band(0, H, 0, H - 16, 0.22);
  const cr = (x) => { const gr = g.createRadialGradient(x, 0, 0, x, 0, 46); gr.addColorStop(0, 'rgba(0,0,0,0.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }; cr(0); cr(128);
  return (AOTH[H] = new T.CanvasTexture(c)); };
const bayBackAOH = (sc, y0, y1, col, f) => { const m = new T.Mesh(new T.PlaneGeometry(sc.L - 0.07, y1 - y0 - 0.01), new T.MeshBasicMaterial({ map: aoTexH(y1 - y0 - 0.01), color: new T.Color(col).multiplyScalar(f) })); m.position.set(0, (y0 + y1) / 2, -sc.D / 2 + 0.045); sc.g.add(m); return m; };
const rgBackTop = () => (RG.ET == null ? RG.TOP - 0.0375 : Math.min(RG.ET, RG.TOP - 0.0375));   // (the back panel's top: the top board's underside, or RG.ET)
// ---- IDEA 5 "TUNING DELI" (the upper shelf; the user: "Sedaj je zgornja polica prazna, naredi 6 slik, kaj bi sedaj dodal na zgornjo
//      polico. Naj ima tudi zgornja polica svetlo moder ozadje"): the drawer parts as REAL PARTS ON SHOW, one kind a place, two places a
//      bay (bay 4 gets D's board for it: BOARDS[4] = [0, 1, 2, 3], its C rims stay under D's underside). Each place: a low navy plinth
//      (U5.pw × U5.ph × U5.pd) standing on D's board near its front, its name on a plate on the plinth's front (white on navy, the regal's
//      yellow line), the part on the plinth's top in about its real size, its face to the car. The kinds are the front cabinets' drawer
//      parts and the menu's kinds of the same tabs (MENUS hood/boot 'Motor': Filter zraka, Čip, Turbo, Lahek akumulator; brakes 'Podvozje':
//      Vzmeti, Amortizerji, Stabilizatorji; brakes 'Zaviranje': Športne ploščice; grille 'Hupa': Dvotonska; tyres 'Dim gum'), in the
//      drawers' colours (the springs red, the dampers' coils yellow, the anti-roll bar yellow, the battery's lid blue). The drawers keep
//      their small items. Everything stays under 2.75 m (the arms reach the regal's front; the top's lip is at 3.235 m) ----
const U5 = { pw: 0.6, ph: 0.22, pd: 0.30, pz: 0.035, plate: 0.145, s: 1.3,   // (W: pd 0.30, was 0.36; pz 0.035, was 0.06: the plinths' front edges 5 cm and more off the neighbours' front posts' tops under D's board; pw and the part's scale are each place's own now: U5W)
  xs: { 0: [-0.42, 0.42], 1: [-0.42, 0.42], 2: [-0.535, 0.1], 3: [-0.25, 0.47], 4: [-0.42, 0.42] },   // (idea 5's places, kept for the record; W: U5W)
  sk: { dampers: 1.12, arb: 1.12, springs: 1.2 } };   // (the parts on show 1.3 × the size of the drawers' models' real parts; the tall ones less)
// W: EVERY PLACE INSIDE ITS BAY (the user: "Elementi v zgornji polici naj ne prekrivajo desnega ali levega dela pregrade"): each place's
// [x in its bay, the plinth's width, the part's scale]. Chosen with the first view's projected outlines (../w/_w_opt_body.js): each place
// clear of the posts (every upright: the back pair between two bays, the front posts' tops under D's board, the end posts; in the
// first view 3.2 to 17 CSS px, an ID pass: ../w/near.py), clear of the lift's column (it hides
// nothing), clear of its neighbour, and in 3D 5 cm and more off each post's inner face (±0.822 m); the plinths fitted to their parts
// (the part's width + 7 cm, 0.40 m at least), the parts ~0.8 × idea 5's size (the dampers less: 8 cm under the lower top)
// (R: the dampers' scale 0.94, was 0.896: shorter coilovers (U5P.dampers), a little bigger, their top at 2.55 m)
let U5W = { filter: [-0.49, 0.40, 1.04], chip: [0.20, 0.48, 1.04], turbo: [-0.29, 0.56, 1.04], batt: [0.37, 0.40, 1.04], springs: [-0.36, 0.47, 0.96],
  dampers: [0.18, 0.40, 0.94], arb: [-0.26, 0.58, 0.896], pads: [0.39, 0.44, 1.04], horn: [-0.25, 0.40, 1.04], smoke: [0.44, 0.51, 1.04] };   // (k 0.8: the parts 0.8 × idea 5's scale)
const U5K = [   // [bay, side (−1 left, +1 right), the plate's name, the builder's key]   (W: the names in English, the game's British English)
  [0, -1, 'AIR FILTER', 'filter'], [0, 1, 'ECU CHIP', 'chip'], [1, -1, 'TURBO', 'turbo'], [1, 1, 'LIGHT BATTERY', 'batt'], [2, -1, 'SPRINGS', 'springs'],
  [2, 1, 'DAMPERS', 'dampers'], [3, -1, 'ANTI-ROLL BARS', 'arb'], [3, 1, 'SPORT PADS', 'pads'], [4, -1, 'HORN', 'horn'], [4, 1, 'TYRE SMOKE', 'smoke']];
// W: a plinth's name plate (white on navy, the regal's yellow line, as idea 5's): drawn at 256 px a plate's height; one line when it fits
// squeezed no more than to 72 % of its width, else two lines (split where the halves are most even): never cut
const u5PlateTex = (txt, aspect) => { const H = 256, W = Math.max(256, Math.round(H * aspect)), c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), ln = 20, pad = 26, avail = W - 2 * pad;
  g.fillStyle = '#16245a'; g.fillRect(0, 0, W, H); g.fillStyle = '#ffd23f'; g.fillRect(0, H - ln, W, ln); g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  const one = (t, fs, base) => { g.font = `900 ${fs}px Roboto, Arial`; const s = Math.min(1, avail / g.measureText(t).width); g.save(); g.translate(W / 2, base); g.scale(s, 1); g.fillText(t, 0, 0); g.restore(); return s; };
  g.font = '900 176px Roboto, Arial'; const s1 = avail / g.measureText(txt).width, words = String(txt).split(' '); let lines = 1;
  if (s1 >= 0.72 || words.length < 2) one(txt, 176, H - ln - 30);
  else { let best = null; g.font = '900 104px Roboto, Arial'; for (let i = 1; i < words.length; i++) { const a = words.slice(0, i).join(' '), b = words.slice(i).join(' '), m = Math.max(g.measureText(a).width, g.measureText(b).width); if (!best || m < best.m) best = { a, b, m }; }
    one(best.a, 104, 106); one(best.b, 104, 214); lines = 2; }
  const t = new T.CanvasTexture(c); t.anisotropy = 8; t.userData = { lines, txt }; return t; };
const u5PlateMats = (txt, aspect) => { const NV = new T.MeshBasicMaterial({ color: 0x16245a }), F = new T.MeshBasicMaterial({ map: u5PlateTex(txt, aspect) }); return [NV, NV, NV, NV, F, NV]; };
const U5M = () => ({ ALU: PR.mat(0xc8ccd2, { shininess: 100, specular: 0x8a8a8a }), CHR: ZMAT.chrome(), DK: PR.mat(0x23262c, { shininess: 40 }), BLK: PR.mat(0x111215, { shininess: 25 }),
  RUB: PR.lam(0x18191c), IRON: PR.mat(0x6a5f58, { shininess: 25 }), RED: PR.mat(0xd81f2a, { shininess: 70 }), RED2: PR.mat(0xa3161f, { shininess: 30 }), YEL: PR.mat(0xf2c230, { shininess: 60 }),
  GOLD: ZMAT.gold(), BLU: PR.mat(0x1c5fd6, { shininess: 80 }), GRN: PR.mat(0x1f7a3a, { shininess: 50 }), GRY: PR.mat(0x8a929c, { shininess: 60 }), STD: PR.mat(0x2a2d33, { shininess: 30 }),
  NAVY: PR.mat(0x1b2b5c, { shininess: 40 }), LT: PR.mat(0xd8dde4, { shininess: 30 }) });
// a tube along points (a bent bar, a cable)
const u5Tube = (g, pts, r, m, seg = 40) => { const o = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(p => V(...p))), seg, r, 10, false), m); g.add(o); return o; };
// a coil spring standing on y0 (r its radius, h its height, n turns, t the wire's radius)
const u5Coil = (g, r, h, n, m, x, y0, z, t) => { const pts = []; for (let i = 0; i <= n * 16; i++) { const a = i / 16 * Math.PI * 2; pts.push([x + Math.cos(a) * r, y0 + t + (h - 2 * t) * i / (n * 16), z + Math.sin(a) * r]); } return u5Tube(g, pts, t, m, n * 24); };
// a board leaning back th (rad) on the plinth's top: returns its group (x across, y up its face, z out of its face); the part lies on it
const u5Easel = (g, M, w, h, th, z = 0) => { const p = new T.Group(); p.position.set(0, 0.012, z); p.rotation.x = -th; g.add(p); zbx(p, w, h, 0.016, 0, h / 2, -0.008, M.STD);
  zbx(g, w * 0.9, 0.024, 0.05, 0, 0.012, z + 0.02, M.STD); const yf = 0.012 + 0.6 * h * Math.cos(th), zf = z - 0.6 * h * Math.sin(th) - 0.022;
  for (const s of [-1, 1]) zbx(g, 0.025, yf, 0.025, s * w * 0.3, yf / 2, zf, M.STD); return p; };
// the parts (each in its own group, its origin the middle of its foot on the plinth's top, its face to +z)
const U5P = {
  // the cone air filter: red pleats, a chrome end cap at its foot, the chrome ring and the rubber neck at its top
  filter: (M) => { const g = new T.Group(); zcy(g, 0.13, 0.13, 0.025, 0, 0.0125, 0, M.CHR, 'y', 28); zcy(g, 0.08, 0.122, 0.25, 0, 0.15, 0, M.RED, 'y', 28);
    for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2, pv = new T.Group(); pv.rotation.y = -a; g.add(pv); zbx(pv, 0.012, 0.255, 0.01, 0.101, 0.15, 0, M.RED2, 0, 0, 0.17); }
    zcy(g, 0.085, 0.085, 0.022, 0, 0.286, 0, M.CHR, 'y', 24); zcy(g, 0.058, 0.058, 0.07, 0, 0.33, 0, M.RUB, 'y', 20); zcy(g, 0.046, 0.046, 0.072, 0, 0.332, 0, M.BLK, 'y', 16);
    const cl = new T.Mesh(new T.TorusGeometry(0.06, 0.007, 6, 24), M.CHR); cl.rotation.x = Math.PI / 2; cl.position.y = 0.345; g.add(cl); return g; },
  // the chip: an engine control unit, open, its green board up, leaning back on a small easel: the case with its cooling fins, the board with
  // its chips and gold pins, the plug and its cable
  chip: (M) => { const g = new T.Group(), p = u5Easel(g, M, 0.36, 0.27, 0.62, 0.02);
    zbx(p, 0.3, 0.21, 0.04, 0, 0.13, 0.02, M.ALU); for (let i = 0; i < 6; i++) zbx(p, 0.3, 0.008, 0.012, 0, 0.035 + i * 0.002, 0.046, M.ALU);
    zbx(p, 0.26, 0.16, 0.006, 0, 0.14, 0.043, M.GRN); zbx(p, 0.07, 0.06, 0.012, -0.06, 0.16, 0.05, M.BLK); zbx(p, 0.05, 0.05, 0.012, 0.05, 0.17, 0.05, M.BLK); zbx(p, 0.035, 0.03, 0.01, 0.06, 0.105, 0.05, M.BLK);
    for (let i = 0; i < 10; i++) zbx(p, 0.01, 0.022, 0.005, -0.1 + i * 0.022, 0.078, 0.048, M.GOLD);
    zbx(p, 0.14, 0.05, 0.06, 0, 0.255, 0.025, M.BLK); u5Tube(p, [[0.05, 0.28, 0.03], [0.12, 0.33, 0.05], [0.2, 0.25, 0.07], [0.19, 0.08, 0.06]], 0.011, M.BLK, 24); return g; },
  // the turbo: the compressor in front (aluminium, its wheel in the open inlet, the outlet to the left), the bearing housing, the turbine
  // behind (cast iron, its flange to the right); it rests on a small dark stand
  turbo: (M) => { const g = new T.Group(), y = 0.2; zbx(g, 0.2, 0.03, 0.2, 0.02, 0.015, -0.04, M.STD); zbx(g, 0.07, 0.07, 0.07, 0.03, 0.065, -0.07, M.STD);
    const tt = new T.Mesh(new T.TorusGeometry(0.09, 0.055, 12, 28), M.IRON); tt.position.set(0.03, y - 0.02, -0.11); g.add(tt); zcy(g, 0.095, 0.095, 0.08, 0.03, y - 0.02, -0.11, M.IRON, 'z', 24);
    zcy(g, 0.065, 0.065, 0.04, 0.03, y - 0.02, -0.18, M.IRON, 'z', 20); zbx(g, 0.1, 0.1, 0.08, 0.17, y - 0.1, -0.11, M.IRON, 0, 0, -0.5); zbx(g, 0.13, 0.13, 0.025, 0.2, y - 0.12, -0.11, M.IRON, 0, Math.PI / 2, -0.5);
    zcy(g, 0.055, 0.055, 0.08, 0, y, -0.02, M.DK, 'z', 18); zcy(g, 0.012, 0.012, 0.06, -0.01, y + 0.07, -0.02, M.GOLD, 'y', 8); zcy(g, 0.012, 0.012, 0.05, 0.02, y - 0.07, -0.02, M.GOLD, 'y', 8);
    const ct = new T.Mesh(new T.TorusGeometry(0.1, 0.06, 12, 30), M.ALU); ct.position.set(0, y, 0.05); g.add(ct); zcy(g, 0.11, 0.11, 0.07, 0, y, 0.05, M.ALU, 'z', 28);
    zcy(g, 0.075, 0.075, 0.08, 0, y, 0.12, M.ALU, 'z', 26); zcy(g, 0.083, 0.083, 0.016, 0, y, 0.155, M.CHR, 'z', 26); zcy(g, 0.064, 0.064, 0.004, 0, y, 0.163, M.BLK, 'z', 22);
    for (let i = 0; i < 8; i++) { const b = zbx(g, 0.052, 0.008, 0.035, 0, y, 0.15, M.CHR); b.geometry.translate(0.03, 0, 0); b.rotation.set(0, 0, i / 8 * Math.PI * 2); b.rotateX(0.5); }
    zcy(g, 0.022, 0.006, 0.04, 0, y, 0.172, M.CHR, 'z', 12);
    zcy(g, 0.04, 0.04, 0.14, -0.15, y + 0.105, 0.05, M.ALU, 'x', 18); zcy(g, 0.047, 0.047, 0.014, -0.225, y + 0.105, 0.05, M.CHR, 'x', 18); zcy(g, 0.03, 0.03, 0.004, -0.233, y + 0.105, 0.05, M.BLK, 'x', 14); return g; },
  // the light battery: a dark case, the blue lid (as the drawer's), the red plus and the black minus post, a carry strap, a charge light
  batt: (M) => { const g = new T.Group(); zbx(g, 0.3, 0.19, 0.18, 0, 0.095, 0, M.DK); zbx(g, 0.306, 0.035, 0.186, 0, 0.2, 0, M.BLU); zbx(g, 0.18, 0.07, 0.004, -0.02, 0.09, 0.091, M.LT);
    zbx(g, 0.03, 0.012, 0.004, 0.11, 0.12, 0.091, PR.mat(0x37e35a, { shininess: 60, emissive: 0x1a6a2a }));
    zcy(g, 0.019, 0.019, 0.03, -0.1, 0.232, 0.03, M.RED, 'y', 14); zcy(g, 0.019, 0.019, 0.03, 0.1, 0.232, 0.03, M.BLK, 'y', 14);
    u5Tube(g, [[-0.06, 0.218, -0.03], [-0.04, 0.27, -0.03], [0.04, 0.27, -0.03], [0.06, 0.218, -0.03]], 0.008, M.BLK, 16); return g; },
  // the lowering springs: two red coils standing (as the drawer's spring), a dark foot under each
  springs: (M) => { const g = new T.Group(); for (const x of [-0.115, 0.115]) { zcy(g, 0.095, 0.095, 0.02, x, 0.01, 0, M.STD, 'y', 22); u5Coil(g, 0.078, 0.34, 6.5, M.RED, x, 0.02, 0, 0.014); } return g; },   // (W: the two coils 0.23 m apart, were 0.28)
  // the dampers: two coilovers standing, the silver body, the chrome rod, the yellow coil (as the drawer's damper) between red seats, the
  // top mount
  // (R: SHORT coilovers, 0.435 m high (were 0.615): the body 0.18 (was 0.30), the coil 0.175 with 4.5 turns (was 0.26, 6), the rod, the
  // seats and the top mount as before, at the scale 0.94 (U5W, was 0.896): their top at 2.55 m, 7.4 cm under the lower top's underside (2.6225 m))
  dampers: (M) => { const g = new T.Group(); zbx(g, 0.36, 0.02, 0.14, 0, 0.01, 0, M.STD);   // (W: the base 0.36 wide, was 0.42; the two 0.21 apart, were 0.24)
    for (const x of [-0.105, 0.105]) { zcy(g, 0.025, 0.025, 0.04, x, 0.04, 0, M.ALU, 'z', 12); zcy(g, 0.036, 0.036, 0.18, x, 0.14, 0, M.ALU, 'y', 18); zcy(g, 0.06, 0.06, 0.02, x, 0.175, 0, M.RED, 'y', 22);
      zcy(g, 0.013, 0.013, 0.11, x, 0.305, 0, M.CHR, 'y', 10); u5Coil(g, 0.052, 0.175, 4.5, M.YEL, x, 0.185, 0, 0.011); zcy(g, 0.062, 0.062, 0.02, x, 0.37, 0, M.RED, 'y', 22);
      zcy(g, 0.042, 0.052, 0.035, x, 0.3975, 0, M.BLK, 'y', 18); zcy(g, 0.009, 0.009, 0.02, x, 0.425, 0, M.CHR, 'y', 8); } return g; },
  // the anti-roll bars: the front one (bigger) and the rear one standing as a U in a pair of dark holders, the black bushings, the end links
  arb: (M) => { const g = new T.Group(); for (const x of [-0.13, 0.13]) { zbx(g, 0.05, 0.1, 0.16, x, 0.05, 0, M.STD); }   // (W: the holders ±0.13, the bars 0.50 and 0.40 wide (were ±0.15, 0.58, 0.46))
    const U = (w, h, z, r, y0) => { u5Tube(g, [[-w, y0 + h, z], [-w, y0 + 0.07, z], [-w + 0.02, y0 + 0.015, z], [-w + 0.09, y0, z], [w - 0.09, y0, z], [w - 0.02, y0 + 0.015, z], [w, y0 + 0.07, z], [w, y0 + h, z]], r, M.YEL, 60);
      for (const s of [-1, 1]) { zcy(g, r * 2.1, r * 2.1, 0.02, s * w, y0 + h, z, M.YEL, 'z', 16); zcy(g, 0.008, 0.008, 0.024, s * w, y0 + h, z, M.BLK, 'z', 8); } };
    U(0.25, 0.25, 0.04, 0.017, 0.115); U(0.20, 0.18, -0.06, 0.014, 0.12);
    for (const x of [-0.13, 0.13]) for (const z of [0.04, -0.06]) { zbx(g, 0.05, 0.045, 0.045, x, z > 0 ? 0.115 : 0.12, z, M.RUB); zbx(g, 0.07, 0.012, 0.05, x, (z > 0 ? 0.115 : 0.12) + 0.028, z, M.ALU); }
    return g; },
  // the sport brake pads: a set of four on a small easel, their backing plates red, the friction dark, a clip each
  pads: (M) => { const g = new T.Group(), p = u5Easel(g, M, 0.36, 0.26, 0.62, 0.02);
    [[-0.085, 0.07], [0.085, 0.07], [-0.085, 0.185], [0.085, 0.185]].forEach(([x, y]) => { zbx(p, 0.155, 0.08, 0.008, x, y, 0.004, M.RED); zbx(p, 0.13, 0.058, 0.016, x, y - 0.004, 0.016, M.DK);
      zbx(p, 0.006, 0.058, 0.017, x, y - 0.004, 0.017, M.BLK); zbx(p, 0.024, 0.014, 0.022, x, y + 0.036, 0.016, M.CHR); }); return g; },
  // the two-tone horn: two chrome trumpets (a long and a short one), their bells to the car, on a black bracket with its compressor
  horn: (M) => { const g = new T.Group(); zbx(g, 0.3, 0.03, 0.18, 0, 0.015, 0, M.STD); zbx(g, 0.03, 0.12, 0.03, 0, 0.09, -0.03, M.BLK); zbx(g, 0.1, 0.09, 0.1, 0, 0.16, -0.05, M.BLK); zcy(g, 0.04, 0.04, 0.05, 0, 0.16, -0.12, M.RED, 'z', 16);
    [[-0.075, 0.17, 0.065, 0.26], [0.075, 0.15, 0.055, 0.2]].forEach(([x, y, r, L]) => { const c = new T.Mesh(new T.CylinderGeometry(r, 0.016, L, 22, 1, true), new T.MeshPhongMaterial({ color: 0xdfe3e8, shininess: 160, specular: 0xffffff, side: T.DoubleSide }));
      c.rotation.x = Math.PI / 2; c.position.set(x, y, -0.1 + L / 2); g.add(c); zcy(g, r * 0.82, r * 0.82, 0.004, x, y, -0.1 + L - 0.02, M.BLK, 'z', 20); const rim = new T.Mesh(new T.TorusGeometry(r, 0.006, 6, 24), M.CHR); rim.position.set(x, y, -0.1 + L); g.add(rim); }); return g; },
  // the tyre smoke: five cartridges standing in a dark rack, each in its colour (the menu's Bel, Moder, Rdeč, Rumen, Vijoličen), a chrome
  // valve on each
  smoke: (M) => { const g = new T.Group(), Y = 0.05; zbx(g, 0.42, 0.05 + Y, 0.12, 0, (0.05 + Y) / 2, 0, M.STD); [0xf4f6f8, 0x2a8cff, 0xe0262f, 0xf2c230, 0xa855f7].forEach((c, i) => { const x = -0.16 + i * 0.08, C = PR.mat(c, { shininess: 70 });   // (W: 8 cm apart, were 9; the rack 0.42 wide and Y higher: the gripper takes the cartridges clear of the plinth)
      zcy(g, 0.038, 0.038, 0.21, x, 0.135 + Y, 0, C, 'y', 20); const d = new T.Mesh(new T.SphereGeometry(0.038, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), C); d.position.set(x, 0.24 + Y, 0); g.add(d);
      zcy(g, 0.039, 0.039, 0.03, x, 0.09 + Y, 0, M.DK, 'y', 20); zcy(g, 0.012, 0.012, 0.04, x, 0.295 + Y, 0, M.CHR, 'y', 10); zbx(g, 0.04, 0.012, 0.012, x + 0.015, 0.31 + Y, 0, M.BLK); }); return g; },
};
// the shelf: a place (plinth, its name plate, the part) for each kind on D's board of its bay; returns { places: [{ k, nm, bay, g, plinth,
// plate, part }] }; every place is under its bay's group (st.regal.par: the arm checks see it)
const u5Shelf = (secs) => { const M = U5M(), y0 = RG.LV[3] + 0.0175, out = { places: [] };
  U5K.forEach(([bi, s, nm, key], k) => { const sc = secs[bi], [x, pw, ps] = U5W[key], pd = U5.pd, g = new T.Group(); g.position.set(x, y0, U5.pz); sc.g.add(g);   // (W: U5W)
    if (L3U5.on) { const [lx, lz, ls] = (BGU5.w || L3U5.w)[key], part = U5P[key](M);   // (BG: the places with storey D's front posts (BGU5))
      g.position.set(lx, y0, lz); part.scale.setScalar(ls); g.add(part); out.places.push({ k, nm, bay: bi, g, plinth: null, plate: null, part }); return; }   // (L3: NO PLINTH, NO PLATE: the part on D's board itself, bigger (L3U5))
    const plinth = zbx(g, pw, U5.ph, pd, 0, U5.ph / 2, 0, M.NAVY); zbx(g, pw + 0.01, 0.012, pd + 0.01, 0, U5.ph + 0.006, 0, M.LT);
    const ph = U5.plate, plate = new T.Mesh(new T.BoxGeometry(pw - 0.03, ph, 0.006), u5PlateMats(nm, (pw - 0.03) / ph));
    plate.position.set(0, U5.ph / 2 - 0.01, pd / 2 + 0.003); g.add(plate);
    const part = U5P[key](M); part.position.set(0, U5.ph + 0.012, 0); part.scale.setScalar(ps); g.add(part);
    out.places.push({ k, nm, bay: bi, g, plinth, plate, part }); });
  return out; };
// ==== EXH: THE REGAL'S EXHAUSTS AS POLISHED METAL (the user, with a screenshot of bay 2: "Teli auspuhi so preveč osvetljeni"). WHY THEY
//      WERE WHITE: the exhausts' metal is plain Phong with a WHITE specular colour and shininess 160..170 (CH, TI in s.js itemExhaust, BL in
//      exh6) and no reflection map; with three r128's lights the highlight's peak is 0.25 × (shininess / 2 + 1) ≈ 21 times the light, and
//      bay 2's pipes face the key light (0.85, from above the front) squarely: the highlight runs the length of the Titanov and Ravni pipes,
//      far over white in the HDR picture, and the post pass's bloom spreads it (bays 0 and 1 are turned away from it in the first view;
//      turn the camera and their chrome goes white the same way). THE FIX (here, after regalAll has built everything; nothing else
//      changes, the lights stay as they are): each of these metals gets a material of its own with a small, controlled highlight (specular
//      0x141414, shininess 90: its peak about half the light) and a reflection of a lit garage multiplied over its colour (exhMetEnv: a
//      32 px cube by the reflection's height only: the ceiling light, a bright band of lamps over the horizon, the walls, the dark floor
//      under it), so a pipe shades from light (top) to dark (under it) as polished metal does; the titanium (TI) and the straight pipe's
//      blued steel (BL) get their heat tint along the exhaust (vertex colours: silver, straw, violet, blue at the tips, the game's titanium
//      tips' colours). The same chrome recipe elsewhere on the regal (the tuning parts' chrome, the horn's trumpets, the rims' axles: the
//      same cause, not seen in the first view) gets the same chrome. Carbon, the stands, the rims and the lift are as they were ====
const EXHMET = { chromeToo: true,   // (false: only the lilac titanium (TI) and the blued pipe (BL) change; the chrome as it was, white again when the camera turns to it)
  env: { lo0: 0.32, lo1: 0.46, wall: 0.74, band: 0.26, ceil: 0.12 },
  chrome: { c: 0xdfe3ea, sp: 0x141414, sh: 90, r: 0.85 }, ti: { c: 0xffffff, sp: 0x141414, sh: 90, r: 0.85, ramp: 'ti' }, blue: { c: 0xffffff, sp: 0x141414, sh: 90, r: 0.85, ramp: 'blue' },
  // (the heat tints: t 0 at the exhaust's inlet end (x +0.3 in its own frame) .. 1 at its tips (x -0.55))
  ramps: { ti: [[0, [0.80, 0.80, 0.82]], [0.35, [0.80, 0.70, 0.50]], [0.55, [0.62, 0.46, 0.72]], [0.8, [0.42, 0.44, 0.90]], [1, [0.34, 0.37, 0.86]]],
    blue: [[0, [0.76, 0.80, 0.98]], [0.6, [0.60, 0.64, 0.96]], [1, [0.48, 0.47, 0.92]]] }, cube: null, mats: {} };
const exhMetSm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// the garage's reflection (grey, 0..1) by the reflected ray's height y (-1 .. 1)
const exhMetEnvF = (y, o) => { const below = o.lo0 + (o.lo1 - o.lo0) * exhMetSm(-1, -0.05, y), above = o.wall + o.band * Math.exp(-(((y - 0.1) / 0.05) ** 2)) + o.ceil * exhMetSm(0.4, 0.9, y);
  return Math.min(1, below + (above - below) * exhMetSm(-0.03, 0.03, y)); };
const exhMetEnv = () => { if (EXHMET.cube) return EXHMET.cube; const S = 32, faces = [];
  const dir = [(u, v) => [1, -v, -u], (u, v) => [-1, -v, u], (u, v) => [u, 1, v], (u, v) => [u, -1, -v], (u, v) => [u, -v, 1], (u, v) => [-u, -v, -1]];   // (the cube's faces +x -x +y -y +z -z: a pixel's ray)
  for (let k = 0; k < 6; k++) { const c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'), im = g.createImageData(S, S);
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) { const d = dir[k]((i + 0.5) / S * 2 - 1, (j + 0.5) / S * 2 - 1), q = Math.round(exhMetEnvF(d[1] / Math.hypot(d[0], d[1], d[2]), EXHMET.env) * 255); im.data.set([q, q, q, 255], (j * S + i) * 4); }
    g.putImageData(im, 0, 0); faces.push(c); }
  const t = new T.CubeTexture(faces); t.needsUpdate = true; return (EXHMET.cube = t); };
// which of the over-bright metals a material is (null: not one of them)
const exhMetKind = (M) => { if (!M || !M.isMeshPhongMaterial || M.envMap || M.transparent || M.map) return null; const h = M.color.getHex();
  if (h === 0x8f86d6) return 'ti'; if (h === 0x5b6bd6) return 'blue'; return M.specular.getHex() === 0xffffff && M.shininess >= 150 ? 'chrome' : null; };
const exhMetMat = (kind, side) => { const key = kind + ':' + side; if (EXHMET.mats[key]) return EXHMET.mats[key]; const k = EXHMET[kind];
  return (EXHMET.mats[key] = new T.MeshPhongMaterial({ color: k.c, specular: k.sp, shininess: k.sh, envMap: exhMetEnv(), combine: T.MultiplyOperation, reflectivity: k.r, vertexColors: !!k.ramp, side })); };
// the heat tint along an exhaust e (its own frame) on a copy of the mesh's geometry
const exhMetTint = (m, e, stops) => { const g = m.geometry.clone(), P = g.attributes.position, M = new T.Matrix4().copy(e.matrixWorld).invert().multiply(m.matrixWorld), v = V(), C = new Float32Array(P.count * 3);
  const at = (t) => { for (let i = 1; i < stops.length; i++) if (t <= stops[i][0]) { const [t0, a] = stops[i - 1], [t1, b] = stops[i], f = (t - t0) / (t1 - t0); return [0, 1, 2].map(j => a[j] + (b[j] - a[j]) * f); } return stops[stops.length - 1][1]; };
  for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(M); C.set(at(Math.min(1, Math.max(0, (0.3 - v.x) / 0.85))), i * 3); }
  g.setAttribute('color', new T.BufferAttribute(C, 3)); m.geometry = g; };
// out: regalAll's (st.regal); returns the counts (out.exhMetal)
const exhMetal = (out) => { const n = { chrome: 0, ti: 0, blue: 0, other: 0 }, done = new Set(); out.par.updateMatrixWorld(true);
  (out.exh || []).forEach(x => x.e.traverse(m => { if (!m.isMesh) return; const kind = exhMetKind(m.material); if (!kind || (kind === 'chrome' && !EXHMET.chromeToo)) return; const R = EXHMET[kind].ramp;
    if (R) exhMetTint(m, x.e, EXHMET.ramps[R]); m.material = (EXHMET.calm ? exhCalmMat : exhMetMat)(kind, m.material.side); m.userData.exhKind = kind; done.add(m); n[kind]++; }));   // (R: the exhausts calmer: EXHMET.calm, the R block)
  if (EXHMET.chromeToo) out.par.traverse(m => { if (!m.isMesh || done.has(m) || Array.isArray(m.material) || exhMetKind(m.material) !== 'chrome') return; m.material = exhMetMat('chrome', m.material.side); n.other++; });
  return (out.exhMetal = n); };
// >>>> R BLOCK (agent R)
// ==== R: THE REGAL'S EXHAUSTS CALMER AND THE SPOILERS' SIX LIGHTS (agent R; the user, after EXH's fix: "Teli auspuhi so še vedno
//      presvetli. Zgornja polica naj bo nižja. Naredi še v različnih verzijah, da so spojlerji različno osvetljeni"; before it: "Steber
//      naj bo namesto rumene oranžne barve"). The rest of R, marked "R:" where it is: RG.TOP 2.66 (the upper shelf lower: the posts, the
//      light-blue back, the top board and the spoilers come down with it), the dampers shorter (U5P.dampers), the lift orange by default
//      (WLIFTV 'O') ----
// THE EXHAUSTS CALMER: EXH's polished metal (a lit garage's reflection multiplied over the colour, a small highlight) was still bright along
// the pipes' tops (in the first view the brightest 1 % of a pipe's pixels at 225-250 in a channel). The six exhausts (only they: the other
// chrome on the regal stays EXH's) get a calmer copy of it: their colour × calm.k, the garage in their reflection calmer (the lamps' band
// over the horizon and the ceiling gone, the walls darker, the floor under them lighter: still light on top and dark under the pipe, the
// step between them smaller), a smaller highlight, the blued pipe's blue a little deeper. The heat tints along the titanium and the blued pipe (EXH's vertex colours) stay ----
EXHMET.calm = { k: 0.85, kk: { blue: 0.88 }, env: { lo0: 0.42, lo1: 0.52, wall: 0.64, band: 0.0, ceil: 0.0 }, sp: 0x080808, sh: 50, r: 0.80, cube: null, mats: {} };   // (kk: a kind's own factor: the blued pipe's blue a little deeper)
const exhCalmEnv = () => { const C = EXHMET.calm; if (C.cube) return C.cube; const S = 32, faces = [];
  const dir = [(u, v) => [1, -v, -u], (u, v) => [-1, -v, u], (u, v) => [u, 1, v], (u, v) => [u, -1, -v], (u, v) => [u, -v, 1], (u, v) => [-u, -v, -1]];   // (as exhMetEnv)
  for (let k = 0; k < 6; k++) { const c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'), im = g.createImageData(S, S);
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) { const d = dir[k]((i + 0.5) / S * 2 - 1, (j + 0.5) / S * 2 - 1), q = Math.round(exhMetEnvF(d[1] / Math.hypot(d[0], d[1], d[2]), C.env) * 255); im.data.set([q, q, q, 255], (j * S + i) * 4); }
    g.putImageData(im, 0, 0); faces.push(c); }
  const t = new T.CubeTexture(faces); t.needsUpdate = true; return (C.cube = t); };
const exhCalmMat = (kind, side) => { const C = EXHMET.calm, key = kind + ':' + side; if (C.mats[key]) return C.mats[key]; const k = EXHMET[kind];
  return (C.mats[key] = new T.MeshPhongMaterial({ color: new T.Color(k.c).multiplyScalar(C.k * ((C.kk && C.kk[kind]) || 1)), specular: C.sp, shininess: C.sh, envMap: exhCalmEnv(), combine: T.MultiplyOperation, reflectivity: C.r, vertexColors: !!k.ramp, side })); };
// THE SPOILERS' LIGHT (RG.WL; null: as today): six versions. Each works only on the wings' own materials (copies of them, each with a light
// term of its own in its shader, from a point, a line or a direction in the world: no light is added to the scene, nothing else in the
// garage changes) and on a few props of its own (merged: one mesh a material for all five bays, 0 to 4 draw calls more). The wings keep their
// colour (the car's blue), their white stripes and edges.
//   L1 REFLEKTORJI OD SPREDAJ: a small black spotlight on a slim arm (up behind the wing, then forward over it) over each wing, shining on
//      it from the front and above, a faint warm beam: a warm pool on the wing (its white stripes and edges take less of it), warm light on
//      the board and the top's lip under it; the wing outside the pool and the top board with its lip a little darker
//   L2 LED TRAK: a white LED strip along the top board's front edge (each bay's): the wings lit from below and in front (their undersides,
//      noses and stands), a soft glow standing under each wing and on the board in front of it
//   L3 OSVETLJENA PLOŠČA ZADAJ: a light-blue lit panel behind the wings (a slim navy frame round it): the wings darker, dark-blue
//      silhouettes, their edges toward the panel bright (a rim of the panel's light)
//   L4 MIRNA, ENAKOMERNA LUČ: matte wings (no highlight), an even soft light from above in place of most of the lamps' shading: no hot spot
//   L5 SVETLI PODSTAVKI: each wing on its own light box, 8 cm high (frosted white, lit from inside: its top, front and ends; a navy foot),
//      lifted onto it: its undersides and stands lit white from below
//   L6 CIAN OBROBA S STRANI: a slim cyan light bar (the colour of the turntable's ring) standing at each wing's right end: the wing's side
//      and its edges toward it lit cyan, its white edge bars glowing cyan ----
const WLV = { L1: { nm: 'Reflektorji od spredaj' }, L2: { nm: 'LED trak na robu police' }, L3: { nm: 'Osvetljena plošča zadaj' }, L4: { nm: 'Mirna, enakomerna luč' },
  L5: { nm: 'Svetli podstavki' }, L6: { nm: 'Cian obroba s strani' } };
// each version's light term: o the wing's colour as the scene lit it, dc its own colour, N its normal and P its point (world), Vw to the camera
const WLGLSL = {
  L1: 'vec3 l = uWlA - P; float d = length(l); l /= d; float cone = smoothstep(uWlK.y, uWlK.z, dot(-l, normalize(uWlB - uWlA))); float wh = mix(1.0, 0.4, smoothstep(0.55, 0.9, dot(dc, vec3(0.3333)))); return o * mix(uWlK.w, 1.0, cone) + dc * uWlC * uWlK.x * wh * max(dot(N, l), 0.0) * cone;',   // (wh: the white stripes and edges take less of it: warm, not blown out)
  L2: 'vec3 ab = uWlB - uWlA; vec3 q = uWlA + ab * clamp(dot(P - uWlA, ab) / dot(ab, ab), 0.0, 1.0); vec3 l = q - P; float d = length(l); l /= d; return o + dc * uWlC * uWlK.x * (0.4 * max(dot(N, l), 0.0) + 0.35 * (0.5 + 0.5 * dot(N, l)) + 0.25 * max(-N.y, 0.0)) / (1.0 + d * d / (uWlK.y * uWlK.y));',
  L3: 'vec3 tp = normalize(uWlA - P); float fr = pow(1.0 - abs(dot(N, Vw)), uWlK.z); float bk = smoothstep(-0.3, 0.5, dot(N, tp)); return o * uWlK.x + uWlC * uWlK.y * (fr * (0.35 + 0.65 * bk) + 0.12 * max(dot(N, tp), 0.0));',
  L4: 'return mix(o, dc * (uWlK.y + uWlK.z * N.y + 0.1 * max(dot(N, Vw), 0.0)), uWlK.x);',
  L5: 'float h = max(P.y - uWlA.y, 0.0); return o + dc * uWlC * uWlK.x * (max(-N.y, 0.0) + uWlK.z + 0.3 * max(dot(N, Vw), 0.0)) * exp(-h / uWlK.y);',
  L6: 'float s = max(dot(N, uWlA), 0.0); float fr = pow(1.0 - abs(dot(N, Vw)), uWlK.y); return o + uWlC * uWlK.x * s * (uWlK.z + (1.0 - uWlK.z) * fr);' };
// a wing's material copied with version v's light term (U: its uniforms, the wing's own)
const wlPatch = (m0, v, U) => { const m = m0.clone(); m.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, U);
    sh.vertexShader = 'varying vec3 vWlP;\nvarying vec3 vWlN;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n  vWlP = (modelMatrix * vec4(transformed, 1.0)).xyz; vWlN = normalize(mat3(modelMatrix) * objectNormal);');
    sh.fragmentShader = 'varying vec3 vWlP;\nvarying vec3 vWlN;\nuniform vec3 uWlA; uniform vec3 uWlB; uniform vec3 uWlC; uniform vec4 uWlK;\nvec3 wlLight(vec3 o, vec3 dc, vec3 N, vec3 P){ vec3 Vw = normalize(cameraPosition - P); ' + WLGLSL[v] + ' }\n'
      + sh.fragmentShader.replace('gl_FragColor = vec4( outgoingLight, diffuseColor.a );', 'outgoingLight = wlLight(outgoingLight, diffuseColor.rgb, normalize(vWlN) * (gl_FrontFacing ? 1.0 : -1.0), vWlP);\n\tgl_FragColor = vec4( outgoingLight, diffuseColor.a );'); };
  m.customProgramCacheKey = () => 'wl:' + v; return m; };
// the props: parts given in a bay's frame, merged into one mesh a material under the regal's group par (world matrices baked)
const wlMerge = (par, parts) => { const by = new Map(), out = []; parts.forEach(p => { if (!by.has(p.mat)) by.set(p.mat, []); by.get(p.mat).push(p); });
  by.forEach((L, mat) => { const pos = [], nor = [], uv = [], v = V();
    L.forEach(({ geo, M }) => { const g = geo.index ? geo.toNonIndexed() : geo, P = g.attributes.position, Nn = g.attributes.normal, U = g.attributes.uv, nm = new T.Matrix3().getNormalMatrix(M);
      for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(M); pos.push(v.x, v.y, v.z); v.fromBufferAttribute(Nn, i).applyMatrix3(nm).normalize(); nor.push(v.x, v.y, v.z); uv.push(U ? U.getX(i) : 0, U ? U.getY(i) : 0); } });
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    const m = new T.Mesh(g, mat); if (mat.blending === T.AdditiveBlending) m.renderOrder = 2; par.add(m); out.push(m); }); return out; };
const wlPart = (parts, par, sc, geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => { const L = new T.Matrix4().compose(V(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(rx, ry, rz)), V(1, 1, 1));
  parts.push({ geo, mat, M: new T.Matrix4().copy(par.matrixWorld).invert().multiply(sc.g.matrixWorld).multiply(L) }); };
// a wing's box in its bay's frame (its meshes, not the soft shadow under it)
const wlBox = (sc, g) => { const b = new T.Box3(), v = V(), inv = new T.Matrix4().copy(sc.g.matrixWorld).invert(); g.updateMatrixWorld(true);
  g.traverse(m => { if (!m.isMesh || (m.material && m.material.transparent)) return; if (!m.geometry.boundingBox) m.geometry.computeBoundingBox(); const bb = m.geometry.boundingBox, M = new T.Matrix4().copy(inv).multiply(m.matrixWorld);
    for (const x of [bb.min.x, bb.max.x]) for (const y of [bb.min.y, bb.max.y]) for (const z of [bb.min.z, bb.max.z]) b.expandByPoint(v.set(x, y, z).applyMatrix4(M)); }); return b; };
// the textures (canvas, cached): a soft round pool, a pool fading from its front edge, the lit panel, the light box's top
const WLTX = {};
const wlTex = (k) => { if (WLTX[k]) return WLTX[k]; const S = 128, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'); let gr;
  if (k === 'pool') { gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.45, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, S, S); }
  else if (k === 'front') { g.fillStyle = '#000'; g.fillRect(0, 0, S, S); gr = g.createLinearGradient(0, S, 0, 0); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, S, S);
    const sd = g.createLinearGradient(0, 0, S, 0); sd.addColorStop(0, 'rgba(0,0,0,1)'); sd.addColorStop(0.18, 'rgba(0,0,0,0)'); sd.addColorStop(0.82, 'rgba(0,0,0,0)'); sd.addColorStop(1, 'rgba(0,0,0,1)'); g.fillStyle = sd; g.fillRect(0, 0, S, S); }
  else if (k === 'beam') { gr = g.createLinearGradient(0, 0, 0, S); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0.25)'); g.fillStyle = gr; g.fillRect(0, 0, S, S); }
  else if (k === 'panel') { gr = g.createRadialGradient(64, 58, 4, 64, 64, 92); gr.addColorStop(0, '#d6eeff'); gr.addColorStop(0.55, '#a9dcfa'); gr.addColorStop(1, '#6fb6e6'); g.fillStyle = gr; g.fillRect(0, 0, S, S); }
  else if (k === 'box') { gr = g.createRadialGradient(64, 64, 6, 64, 64, 90); gr.addColorStop(0, '#f2f4f6'); gr.addColorStop(0.6, '#e2e7ec'); gr.addColorStop(1, '#c4ccd6'); g.fillStyle = gr; g.fillRect(0, 0, S, S); }
  const t = new T.CanvasTexture(c); return (WLTX[k] = t); };
const wlGlowMat = (k, col, op) => new T.MeshBasicMaterial({ map: wlTex(k), color: new T.Color(...col), transparent: true, opacity: op, blending: T.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, fog: false });
// out: regalAll's (st.regal); v: 'L1'..'L6'; sets out.wingLight { v, nm, props (meshes), mats (n), wings: [{ box, U }] }
const wingLight = (out, v) => { if (!v || !WLGLSL[v]) return null; const par = out.par; par.updateMatrixWorld(true); const parts = [], res = { v, nm: WLV[v].nm, props: [], mats: 0, wings: [] }, yb = RG.TOP - 0.0025;   // (yb: the top board's top face)
  const BLK = PR.mat(0x17181c, { shininess: 50 }), NAV = PR.mat(0x1b2b5c, { shininess: 40 }), basic = (c, o = {}) => new T.MeshBasicMaterial(Object.assign({ color: c, fog: false }, o));
  const WM = { pool: wlGlowMat('pool', [1.0, 0.78, 0.5], 0.30), led: basic(new T.Color(1.0, 0.97, 0.92).multiplyScalar(1.15)), front: wlGlowMat('front', [0.85, 0.92, 1.0], 0.26),
    lip: wlGlowMat('pool', [1.0, 0.72, 0.42], 0.38), card: wlGlowMat('front', [0.80, 0.90, 1.0], 0.55), beam: Object.assign(wlGlowMat('beam', [1.0, 0.82, 0.58], 0.075), { side: T.DoubleSide }),
    panel: basic(new T.Color(0.95, 0.95, 0.95), { map: wlTex('panel') }), boxTop: basic(new T.Color(0.97, 0.97, 0.97), { map: wlTex('box') }), boxFace: basic(new T.Color(0.90, 0.92, 0.95), { map: wlTex('box') }), cyan: basic(new T.Color(0x55c4ff)) };   // (one of each for all five bays: merged)
  out.wings.forEach((g, i) => { const sc = out.secs[i];
    if (v === 'L5') { g.position.y += 0.08; g.children.forEach(c => { if (c.isMesh && c.material && c.material.transparent) c.visible = false; }); g.updateMatrixWorld(true); }   // (L5: the wing onto its light box; its soft shadow on the board gone)
    const b = wlBox(sc, g), c = b.getCenter(V()), wx = b.max.x - b.min.x, W = (x, y, z) => sc.at(x, y, z), U = { uWlA: { value: V() }, uWlB: { value: V() }, uWlC: { value: new T.Color(1, 1, 1) }, uWlK: { value: new T.Vector4() } };
    if (v === 'L1') { const lp = V(c.x, yb + 0.98, b.max.z + 0.22), aim = V(c.x, c.y, c.z), d = lp.distanceTo(aim), ang = Math.atan(wx / 2 / d);
      U.uWlA.value.copy(W(lp.x, lp.y, lp.z)); U.uWlB.value.copy(W(aim.x, aim.y, aim.z)); U.uWlC.value.setRGB(1.0, 0.78, 0.50); U.uWlK.value.set(0.95, Math.cos(ang * 1.0), Math.cos(ang * 0.4), 0.68);
      const dir = aim.clone().sub(lp).normalize(), q = new T.Quaternion().setFromUnitVectors(V(0, 1, 0), dir.clone().negate()), e = new T.Euler().setFromQuaternion(q), zb = -sc.D / 2 + 0.07, ya = yb + 1.06;
      wlPart(parts, par, sc, new T.CylinderGeometry(0.009, 0.009, ya - yb, 8), BLK, c.x, (yb + ya) / 2, zb);   // (the arm: up behind the wing, then forward over it)
      wlPart(parts, par, sc, new T.CylinderGeometry(0.009, 0.009, lp.z - zb, 8), BLK, c.x, ya, (zb + lp.z) / 2, Math.PI / 2);
      wlPart(parts, par, sc, new T.CylinderGeometry(0.006, 0.006, ya - lp.y, 6), BLK, c.x, (ya + lp.y) / 2, lp.z);
      wlPart(parts, par, sc, new T.CylinderGeometry(0.036, 0.05, 0.11, 14), BLK, lp.x, lp.y, lp.z, e.x, e.y, e.z);   // (the can, its wide end (the lens: away from the camera) toward the wing)
      wlPart(parts, par, sc, new T.PlaneGeometry(wx + 0.25, 0.5), WM.pool, c.x, yb + 0.001, Math.min(c.z, sc.D / 2 - 0.25), -Math.PI / 2);
      wlPart(parts, par, sc, new T.PlaneGeometry(wx + 0.1, 0.05), WM.lip, c.x, RG.TOP - 0.05, sc.D / 2 + 0.0165);   // (the warm light on the top's lip under the wing)
      const bm = lp.clone().add(aim).multiplyScalar(0.5), eb = new T.Euler().setFromQuaternion(new T.Quaternion().setFromUnitVectors(V(0, 1, 0), dir.clone().negate()));   // (a faint beam from the lamp to the wing)
      wlPart(parts, par, sc, new T.CylinderGeometry(0.035, wx * 0.36, d - 0.06, 20, 1, true), WM.beam, bm.x, bm.y, bm.z, eb.x, eb.y, eb.z);
      if (!sc._wlTop) { sc._wlTop = true; sc.topM.forEach(m => { m.material = m.material.clone(); m.material.color.multiplyScalar(0.78); }); } }   // (the top board and its lip a little darker)
    if (v === 'L2') { const xa = -sc.L / 2 + 0.03, xb = sc.L / 2 - 0.03, ys = yb + 0.004, zs = sc.D / 2 - 0.012;
      U.uWlA.value.copy(W(xa, ys, zs)); U.uWlB.value.copy(W(xb, ys, zs)); U.uWlC.value.setRGB(0.88, 0.94, 1.0); U.uWlK.value.set(1.2, 0.4, 0, 0);
      wlPart(parts, par, sc, new T.BoxGeometry(xb - xa, 0.012, 0.02), WM.led, 0, ys + 0.002, zs);
      const hc = 0.75 * (b.max.y - yb); wlPart(parts, par, sc, new T.PlaneGeometry(wx * 0.9, hc), WM.card, c.x, yb + hc / 2, c.z - 0.02);   // (the soft glow standing under the wing)
      const z0 = b.min.z - 0.06, z1 = sc.D / 2 - 0.02; wlPart(parts, par, sc, new T.PlaneGeometry(wx + 0.2, z1 - z0), WM.front, c.x, yb + 0.001, (z0 + z1) / 2, -Math.PI / 2); }
    if (v === 'L3') { const pw = sc.L - 0.16, ph = 0.62, pz = -sc.D / 2 + 0.07, py = yb + 0.04 + ph / 2;
      U.uWlA.value.copy(W(0, py, pz)); U.uWlC.value.setRGB(0.62, 0.86, 1.0); U.uWlK.value.set(0.42, 1.6, 1.8, 0);
      wlPart(parts, par, sc, new T.PlaneGeometry(pw, ph), WM.panel, 0, py, pz);
      const t = 0.025; for (const [w, h, x, y] of [[pw + 2 * t, t, 0, py + ph / 2 + t / 2], [pw + 2 * t, t, 0, py - ph / 2 - t / 2], [t, ph, -pw / 2 - t / 2, py], [t, ph, pw / 2 + t / 2, py]]) wlPart(parts, par, sc, new T.BoxGeometry(w, h, 0.03), NAV, x, y, pz - 0.006);
      for (const x of [-pw / 2 + 0.1, pw / 2 - 0.1]) wlPart(parts, par, sc, new T.BoxGeometry(0.03, 0.04 - t, 0.06), NAV, x, yb + (0.04 - t) / 2, pz - 0.01); }
    if (v === 'L4') { U.uWlK.value.set(0.6, 0.74, 0.14, 0); }
    if (v === 'L5') { const bw = wx + 0.08, z0 = Math.max(-sc.D / 2 + 0.02, b.min.z - 0.03), z1 = Math.min(sc.D / 2 - 0.01, b.max.z + 0.03), bd = z1 - z0, bz = (z0 + z1) / 2, bh = 0.08, ft = 0.016;
      U.uWlA.value.copy(W(c.x, yb + bh, bz)); U.uWlC.value.setRGB(1.0, 0.98, 0.95); U.uWlK.value.set(0.8, 0.16, 0.12, 0);
      wlPart(parts, par, sc, new T.BoxGeometry(bw, ft, bd), NAV, c.x, yb + ft / 2, bz);   // (its navy foot; over it the frosted box, lit from inside: its top, front and ends)
      wlPart(parts, par, sc, new T.PlaneGeometry(bw, bd), WM.boxTop, c.x, yb + bh, bz, -Math.PI / 2);
      wlPart(parts, par, sc, new T.PlaneGeometry(bw, bh - ft), WM.boxFace, c.x, ft + yb + (bh - ft) / 2, z1);
      for (const s of [-1, 1]) wlPart(parts, par, sc, new T.PlaneGeometry(bd, bh - ft), WM.boxFace, c.x + s * bw / 2, ft + yb + (bh - ft) / 2, bz, 0, s * Math.PI / 2);
      wlPart(parts, par, sc, new T.PlaneGeometry(bw, bh - ft), WM.boxFace, c.x, ft + yb + (bh - ft) / 2, z0, 0, Math.PI); }
    if (v === 'L6') { const xr = Math.min(sc.L / 2 - 0.07, b.max.x + 0.07), bh = 0.44, dir = sc.along.clone().multiplyScalar(0.9).add(V(0, 0.3, 0)).addScaledVector(sc.out, -0.15).normalize();
      U.uWlA.value.copy(dir); U.uWlC.value.setRGB(0.33, 0.77, 1.0); U.uWlK.value.set(1.0, 1.4, 0.4, 0);
      wlPart(parts, par, sc, new T.BoxGeometry(0.026, bh, 0.026), WM.cyan, xr, yb + 0.02 + bh / 2, c.z);
      wlPart(parts, par, sc, new T.BoxGeometry(0.06, 0.02, 0.06), BLK, xr, yb + 0.01, c.z); }
    // the wing's materials: copies with the light term (L4: matte; L6: the white edge bars glow cyan)
    const cache = new Map(); g.traverse(m => { if (!m.isMesh || !m.material || Array.isArray(m.material) || m.material.transparent) return; const m0 = m.material; let M = cache.get(m0.uuid);
      if (!M) { M = wlPatch(m0, v, U); if (v === 'L4' && M.isMeshPhongMaterial) { M.specular = new T.Color(0x000000); M.shininess = 4; }
        if (v === 'L6' && M.isMeshLambertMaterial && M.color.getHex() === 0xf2f2ee) M.emissive = new T.Color(0x55c4ff).multiplyScalar(0.7);
        cache.set(m0.uuid, M); res.mats++; }
      m.material = M; });
    res.wings.push({ i, box: [b.min.toArray(), b.max.toArray()].map(a => a.map(x => +x.toFixed(3))), A: U.uWlA.value.toArray().map(x => +x.toFixed(3)), K: U.uWlK.value.toArray().map(x => +x.toFixed(3)) }); });
  res.props = wlMerge(par, parts); return (out.wingLight = res); };
// <<<< R BLOCK
// >>>> L3 BLOCK (agent L3)
// ==== L3: EQUAL STOREYS, THE TUNING PARTS WITHOUT PLINTHS, THE EXHAUST STANDS' SHADOWS, SIX VERSIONS OF R's LIT PANELS (agent L3; the
//      user, after R's six spoiler lights (they chose L3, the light-blue lit panel behind the wings): "L3, naredi 6 različnih verzij, vsi
//      regali/plošče naj bodo enako visoki. Elemente v 3. polici, kot so TURBO, ECU CHIP itd., vsem tem elementom zbriši podstavke z napisi.
//      Popravi sence na stojalih za auspuh"). The rest of L3, marked "L3:" where it is: RG.LV / RG.FRONT / RG.H (every storey 0.645 m from
//      board to board: A 0.06, B 0.705, C 1.35, D 1.995, the top board 2.64 (RG.TOP 2.66 as R's), the lit panels' level 2.66-3.30),
//      u5Shelf (no plinths, no plates: L3U5), regalAll (the tyre sets' scale, the stands' shadows, the panels' call) ----
// THE STOREYS: RG.H the storey (board to board: their top faces, their undersides and their middles alike); the free height of every
// storey 0.61 m (A to B, B to C, C to D, D to the top board, the top board to the panels' cap). The tyre sets on A (0.60-0.66 m tall)
// scaled each to 2.5 cm under B's board (l3TyreScale); the exhausts and the rims on B and C as they were (0.1 m more room than on C before);
// the tuning parts on D's board (L3U5)
const l3TyreScale = (i) => { const free = (RG.LV[1] - 0.0175) - (RG.LV[0] + 0.018), r = TSETS[i][3]; return Math.min(1, (free - 0.025) / (2 * r)); };
// THE TUNING PARTS WITHOUT PLINTHS: each part stands on D's board itself (its own foot: the filter's end cap, the turbo's small dark stand,
// the chip's and the pads' easels, the springs' and dampers' bases, the bars' holders, the horn's bracket, the smoke's rack: no part needs a
// stand of its own), [x, z, scale] in its bay: bigger than on the plinths (the freed 0.23 m), each clear of the posts (0 px in the first
// view, 5 cm and more in 3D), of the lift's column and of its neighbour, 6 cm and more under the top board's underside (../l3 optimiser)
const L3U5 = { on: true,
  w: { filter: [-0.49, 0.035, 1.04], chip: [0.20, 0.035, 1.04], turbo: [-0.29, 0.035, 1.04], batt: [0.37, 0.035, 1.04], springs: [-0.36, 0.035, 0.96],
    dampers: [0.18, 0.035, 0.94], arb: [-0.26, 0.035, 0.896], pads: [0.39, 0.035, 1.04], horn: [-0.25, 0.035, 1.04], smoke: [0.44, 0.035, 1.04] } };
// THE EXHAUST STANDS' SHADOWS. What was wrong (round W's / R's regal, s.js exhOnStands): two big blurred rectangles a exhaust, one flat on the
// board (2.04 × 0.58 m, its dark core 1.14 × 0.32 m, 85 % of the navy shadow colour) and one standing on the light-blue back (2.21 × 0.71 m,
// 80 %, from the board up to 0.4 m); the feet (0.24 × 0.2 m plates, the board's own grey) stand 2 cm through the flat one: the board round
// them dark, their tops light: light slabs lying on a dark patch, no shadow at their edges (they float), the patch's front edge a straight
// band across the bay, and with the back one a dark navy band along the back of the board, where the key light (from over the front:
// the game's KEY_DIR (0.22, 1, 0.34)) casts no shadow at all. THE FIX (l3StandShadows, after the exhausts are built): the two rectangles
// gone; in their place one mesh a exhaust (6 draws, were 12) with a small shader of its own: (1) a soft contact shadow round each foot on
// the board (darkest at the foot's edge, gone 3.5 cm out); (2) the exhaust's own shadow cast by the key light: its outline projected along
// the light onto the board (in each bay's own frame), soft (a penumbra of ±3.5 cm), 45 %, on the board and on the feet's tops alike (the
// back halves of the feet in it); (3) each post's thin shadow on its foot and the board, behind the post; (4) a faint soft darkening on the
// back right behind the exhaust (14 %: the room's soft light, no hard band)
const L3SH = { tint: [0.035, 0.055, 0.10], contact: { m: 0.045, op: 0.7 }, body: { pen: 0.035, op: 0.45, inset: 0.012 }, post: { w: 0.012, soft: 0.018, op: 0.32 },
  back: { op: 0.14, h: 0.30 }, key: [0.22, 1, 0.34] };
const L3SHV = 'attribute float aK; varying vec3 vP; varying float vK; void main(){ vP = position; vK = aK; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const L3SHF = [
  'uniform vec3 uTint; uniform vec4 uBody; uniform vec4 uBody2; uniform vec4 uFoot; uniform vec4 uCon; uniform vec4 uPost; uniform vec4 uPost2; uniform vec4 uBack;',
  'varying vec3 vP; varying float vK;',
  'float sdBox(vec2 p, vec2 b){ vec2 d = abs(p) - b; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); }',
  'float sdRBox(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }',
  'float sdSeg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h); }',
  'void main(){ float a = 0.0;',
  '  if (vK > 1.5) { vec2 q = vec2((vP.x - uBack.x) / uBack.z, (vP.y - uBack.y) / (0.5 * uBack.w)); a = uBody2.w * (1.0 - smoothstep(0.25, 1.0, length(q))); }',   // (the back: a faint soft oval)
  '  else { vec2 p = vP.xz; float keep = 1.0;',
  '    vec2 c = p - uBody.xy; float cs = cos(uBody2.z), sn = sin(uBody2.z); vec2 r = vec2(cs * c.x - sn * c.y, sn * c.x + cs * c.y);',   // (the body's shadow in the exhaust's own turn)
  '    float d = sdRBox(r, uBody.zw, min(uBody.z, uBody.w) * 0.9); keep *= 1.0 - uBody2.y * (1.0 - smoothstep(-uBody2.x, uBody2.x, d));',
  '    for (int i = 0; i < 2; i++) { float sx = i == 0 ? -1.0 : 1.0; vec2 fc = vec2(sx * uFoot.x, uFoot.y);',
  '      if (vK < 0.5) { float df = sdBox(p - fc, uFoot.zw); float t = 1.0 - clamp(df / uCon.x, 0.0, 1.0); keep *= 1.0 - uCon.y * pow(t, 1.6); }',   // (the contact shadow round the foot: on the board only)
  '      vec2 pb = vec2(sx * uPost.x, uPost.y); float ds = sdSeg(p, pb, pb + uPost2.xy) - uPost.z; keep *= 1.0 - uPost2.z * (1.0 - smoothstep(0.0, uPost.w, ds)); }',
  '    a = 1.0 - keep; }',
  '  gl_FragColor = vec4(uTint, a); }'].join('\n');
// the key light's direction (to the light) in the world: the room's shadow-casting light, else the game's KEY_DIR
const l3Key = () => { let L = null; G3.scene.traverse(o => { if (!L && o.isDirectionalLight && o.castShadow) { o.updateMatrixWorld(true); o.target.updateMatrixWorld(true); L = o.getWorldPosition(V()).sub(o.target.getWorldPosition(V())).normalize(); } });
  return L || V(...L3SH.key).normalize(); };
// out: regalAll's; sets out.standShadows [{ si, lv, body, foot, light }]
const l3StandShadows = (out) => { const S = L3SH, res = []; out.par.updateMatrixWorld(true); const Lw = l3Key(), shT = SHT();
  out.exh.forEach(x => { const g = x.g, sc = x.sec; g.updateMatrixWorld(true);
    g.children.slice().forEach(m => { if (m.isMesh && m.material && m.material.map === shT) g.remove(m); });   // (the two old rectangles)
    const inv = new T.Matrix4().copy(g.matrixWorld).invert(), L = Lw.clone().transformDirection(inv), kx = L.x / L.y, kz = L.z / L.y;   // (the light in the group's own frame; a point y over the board falls kx·y, kz·y back)
    // the stands (feet: the 0.24 × 0.02 × 0.2 boxes; posts: the cylinders) as exhOnStands builds them, and the exhaust's outline cast on the board
    const feet = [], posts = []; g.children.forEach(m => { if (!m.isMesh || m.material.transparent) return; const P = m.geometry.parameters || {};
      if (m.geometry.type === 'BoxGeometry' && Math.abs(P.width - 0.24) < 1e-3 && Math.abs(P.depth - 0.2) < 1e-3) feet.push(m); if (m.geometry.type === 'CylinderGeometry' && P.height > 0.1) posts.push(m); });
    const yaw = x.e.rotation.y, cs = Math.cos(yaw), sn = Math.sin(yaw), v = V(), M = new T.Matrix4(); let r0 = [9, 9], r1 = [-9, -9];
    x.e.updateMatrixWorld(true); x.e.traverse(m => { if (!m.isMesh || !m.visible) return; if (!m.geometry.boundingBox) m.geometry.computeBoundingBox(); const b = m.geometry.boundingBox; M.copy(inv).multiply(m.matrixWorld);
      for (const X of [b.min.x, b.max.x]) for (const Y of [b.min.y, b.max.y]) for (const Z of [b.min.z, b.max.z]) { v.set(X, Y, Z).applyMatrix4(M); const px = v.x - kx * v.y, pz = v.z - kz * v.y;
        const u = cs * px - sn * pz, w = sn * px + cs * pz; r0 = [Math.min(r0[0], u), Math.min(r0[1], w)]; r1 = [Math.max(r1[0], u), Math.max(r1[1], w)]; } });
    const uc = [(r0[0] + r1[0]) / 2, (r0[1] + r1[1]) / 2], half = [(r1[0] - r0[0]) / 2 - S.body.inset, (r1[1] - r0[1]) / 2 - S.body.inset], bc = [cs * uc[0] + sn * uc[1], -sn * uc[0] + cs * uc[1]];   // (the outline's middle back in the group's frame)
    const f0 = feet.length ? feet[0] : null, fx = f0 ? Math.abs(f0.position.x) : 0.244, fz = f0 ? f0.position.z : 0.06, fh = f0 ? f0.geometry.parameters.height : 0.02;
    const p0 = posts.length ? posts[0] : null, pz = p0 ? p0.position.z : 0.02, ph = p0 ? p0.position.y + p0.geometry.parameters.height / 2 + 0.04 : 0.17, ptop = ph - fh;
    const U = { uTint: { value: new T.Color(...S.tint) }, uBody: { value: new T.Vector4(bc[0], bc[1], half[0], half[1]) }, uBody2: { value: new T.Vector4(S.body.pen, S.body.op, yaw, S.back.op) },
      uFoot: { value: new T.Vector4(fx, fz, 0.12, 0.1) }, uCon: { value: new T.Vector4(S.contact.m, S.contact.op, 0, 0) },
      uPost: { value: new T.Vector4(fx, pz, S.post.w, S.post.soft) }, uPost2: { value: new T.Vector4(-kx * ptop, -kz * ptop, S.post.op, 0) }, uBack: { value: new T.Vector4(bc[0], 0.04 + 0.5 * S.back.h, Math.max(0.3, half[0] + 0.12), S.back.h) } };
    const mat = new T.ShaderMaterial({ uniforms: U, vertexShader: L3SHV, fragmentShader: L3SHF, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    // the quads (in the group's frame): the board (round the exhaust's shadow and the feet), each foot's top, the back
    const pos = [], aK = [], quad = (a, b, c, d, k) => { for (const q of [a, b, c, a, c, d]) { pos.push(...q); aK.push(k); } };
    const bz0 = -sc.D / 2 + 0.046, bz1 = sc.D / 2 - 0.012, xb = Math.min(sc.L / 2 - 0.035, Math.max(Math.abs(bc[0]) + half[0] + 0.12, fx + 0.2)), yB = 0.0012, yF = fh + 0.0006;
    quad([-xb, yB, bz1], [xb, yB, bz1], [xb, yB, bz0], [-xb, yB, bz0], 0);
    for (const s of [-1, 1]) quad([s * fx - 0.12, yF, fz + 0.1], [s * fx + 0.12, yF, fz + 0.1], [s * fx + 0.12, yF, fz - 0.1], [s * fx - 0.12, yF, fz - 0.1], 1);
    const zb = -sc.D / 2 + 0.048, xw = U.uBack.value.z + 0.05; quad([bc[0] - xw, 0.04, zb], [bc[0] + xw, 0.04, zb], [bc[0] + xw, 0.04 + S.back.h, zb], [bc[0] - xw, 0.04 + S.back.h, zb], 2);
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('aK', new T.Float32BufferAttribute(aK, 1));
    const m = new T.Mesh(geo, mat); m.renderOrder = 2; m.userData.l3Shadow = true; g.add(m);
    res.push({ si: x.si, lv: x.lv, light: [kx, kz].map(q => +q.toFixed(3)), body: { c: bc.map(q => +q.toFixed(3)), half: half.map(q => +q.toFixed(3)) }, foot: [fx, fz], postShadow: [-kx * ptop, -kz * ptop].map(q => +q.toFixed(3)) }); });
  return (out.standShadows = res); };
// THE SIX VERSIONS OF R's L3 (RG.WL 'A'..'F'; R's 'L1'..'L6' stay as they were): the lit panels' level over the top board is ONE STOREY
// tall (from the top board's top face 2.6575 m up RG.H to 3.3025 m, its cap 3.5 cm as a board), the wings in front of the panels lit by
// them (copies of the wings' materials with a light term of the version's own, from the panel: no light added to the scene); the props
// merged, one mesh a material (2 or 3 draws for all five bays)
//   A SVETLO MODRA PLOŠČA V OKVIRJU: R's L3 one storey tall: a light-blue panel behind each wing in a navy frame (3 cm, its top the cap)
//   B EN SVETEL PAS: one continuous light band across the five bays, standing between the back posts (they go on up as navy mullions, a
//     navy cap over them), the wings as dark silhouettes in front of it
//   C HLADNO BELA: cool white panels in thin (1.2 cm) navy frames, the wings darker with a thin bright rim (only on their edges toward it)
//   D SIJ OBZORJA: each panel light cyan at its foot fading to dark navy at its top (a horizon's glow behind the wings), the wings' lower
//     edges and undersides with a cyan rim from it
//   E ŠESTKOTNIKI: a light-blue panel with a subtle lit honeycomb (the garage's ceiling lights' hexagons: bright tubes, dark joints)
//   F TOPLA BELA: soft warm white panels behind the blue wings (a warm rim on them): a warmer showroom contrast
const L3V = { A: { nm: 'Svetlo modra plošča v okvirju', t: 0.03, tex: 'A', rim: [0.62, 0.86, 1.0], K: [0.42, 1.6, 1.8, 0] },
  B: { nm: 'En svetel pas čez vse regale', band: true, tex: 'B', rim: [0.62, 0.86, 1.0], K: [0.36, 1.5, 2.0, 0] },
  C: { nm: 'Hladno bela plošča', t: 0.012, tex: 'C', pk: 1.0, rim: [0.84, 0.92, 1.0], K: [0.36, 1.9, 2.6, 0] },
  D: { nm: 'Sij obzorja', t: 0.025, tex: 'D', rim: [0.42, 0.9, 1.0], K: [0.45, 1.45, 1.8, 0.3] },
  E: { nm: 'Šestkotni vzorec', t: 0.03, tex: 'E', rim: [0.62, 0.88, 1.0], K: [0.42, 1.5, 1.8, 0] },
  F: { nm: 'Topla bela plošča', t: 0.03, tex: 'F', rim: [1.0, 0.84, 0.64], K: [0.52, 1.35, 1.8, 0] } };
const L3RIM = 'vec3 tp = normalize(uWlA - P); float fr = pow(1.0 - abs(dot(N, Vw)), uWlK.z); float bk = smoothstep(-0.3, 0.5, dot(N, tp)); return o * uWlK.x + uWlC * uWlK.y * (fr * (0.35 + 0.65 * bk) + 0.12 * max(dot(N, tp), 0.0));';
Object.assign(WLGLSL, { A: L3RIM, B: L3RIM, E: L3RIM, F: L3RIM,
  C: 'vec3 tp = normalize(uWlA - P); float fr = pow(1.0 - abs(dot(N, Vw)), uWlK.z); float bk = smoothstep(0.0, 0.6, dot(N, tp)); return o * uWlK.x + uWlC * uWlK.y * fr * (0.25 + 0.75 * bk);',
  D: 'vec3 tp = normalize(uWlA - P); float fr = pow(1.0 - abs(dot(N, Vw)), uWlK.z); float bk = smoothstep(-0.3, 0.5, dot(N, tp)); float hb = 1.0 - smoothstep(uWlB.y, uWlB.z, P.y); float dn = max(-N.y, 0.0); return o * uWlK.x + uWlC * uWlK.y * (fr * (0.3 + 0.7 * bk) * (0.35 + 0.65 * hb) + uWlK.w * dn * hb);' });
// the panels' textures (canvas, cached)
const L3TX = {};
const l3Tex = (k) => { if (L3TX[k]) return L3TX[k]; const W = k === 'E' ? 512 : 256, H = k === 'E' ? 192 : 128, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); let gr;
  const rad = (stops, cy = 0.45) => { gr = g.createRadialGradient(W / 2, H * cy, 4, W / 2, H / 2, Math.hypot(W, H) * 0.5); stops.forEach(([t, col]) => gr.addColorStop(t, col)); g.fillStyle = gr; g.fillRect(0, 0, W, H); };
  if (k === 'A') rad([[0, '#d6eeff'], [0.55, '#a9dcfa'], [1, '#6fb6e6']]);
  else if (k === 'B') { gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#86c6ee'); gr.addColorStop(0.45, '#c8e8fc'); gr.addColorStop(0.75, '#b6e0fa'); gr.addColorStop(1, '#93cff3'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  else if (k === 'C') rad([[0, '#f6f9fd'], [0.6, '#e8eff7'], [1, '#cfdbe8']]);
  else if (k === 'D') { gr = g.createLinearGradient(0, H, 0, 0); gr.addColorStop(0, '#b4f2ff'); gr.addColorStop(0.18, '#7fdcf6'); gr.addColorStop(0.45, '#3f8fcf'); gr.addColorStop(0.75, '#1d3f7e'); gr.addColorStop(1, '#101c46'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    const sd = g.createLinearGradient(0, 0, W, 0); sd.addColorStop(0, 'rgba(8,16,40,0.35)'); sd.addColorStop(0.2, 'rgba(8,16,40,0)'); sd.addColorStop(0.8, 'rgba(8,16,40,0)'); sd.addColorStop(1, 'rgba(8,16,40,0.35)'); g.fillStyle = sd; g.fillRect(0, 0, W, H); }
  else if (k === 'E') { rad([[0, '#b9e2fb'], [0.55, '#92cdf3'], [1, '#5fa6dd']]);
    const s = 26, hx = 1.5 * s, hz = Math.sqrt(3) * s, verts = [];   // (flat-topped hexagons, s px a side: about 6 cm on the panel)
    g.lineWidth = 3.0; g.strokeStyle = 'rgba(236,248,255,0.5)';
    for (let q = -1; q * hx < W + s; q++) for (let r = -1; r * hz < H + hz; r++) { const cx = q * hx, cy = r * hz + (q % 2 ? hz / 2 : 0); g.beginPath();
      for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI * 2, x = cx + Math.cos(a) * s * 0.94, y = cy + Math.sin(a) * s * 0.94; if (i) g.lineTo(x, y); else g.moveTo(x, y); if (i < 6) verts.push([cx + Math.cos(a) * s, cy + Math.sin(a) * s]); } g.stroke(); }
    g.fillStyle = 'rgba(30,62,104,0.6)'; verts.forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 2.5, 0, 7); g.fill(); }); }
  else if (k === 'F') rad([[0, '#fff6ea'], [0.55, '#f9e8d0'], [1, '#efd6b4']]);
  const t = new T.CanvasTexture(c); t.anisotropy = 8; return (L3TX[k] = t); };
// out: regalAll's (st.regal); v: 'A'..'F'; sets out.wingLight { v, nm, props, mats, wings, level: [y0, y1] } (as wingLight's)
const l3Panels = (out, v) => { const O = L3V[v]; if (!O) return null; const par = out.par; par.updateMatrixWorld(true); const parts = [], yb = RG.TOP - 0.0025, yT = yb + RG.H, cap = 0.035, res = { v, nm: O.nm, props: [], mats: 0, wings: [], level: [yb, yT] };
  const NAV = PR.mat(0x1b2b5c, { shininess: 40 }), PAN = new T.MeshBasicMaterial({ color: new T.Color(1, 1, 1).multiplyScalar(O.pk || 0.95), map: l3Tex(O.tex), fog: false });
  out.wings.forEach((g, i) => { const sc = out.secs[i], b = wlBox(sc, g), c = b.getCenter(V()), W = (x, y, z) => sc.at(x, y, z);
    const U = { uWlA: { value: V() }, uWlB: { value: V() }, uWlC: { value: new T.Color(...O.rim) }, uWlK: { value: new T.Vector4(...O.K) } };
    if (O.band) { const zp = -sc.D / 2 + 0.03, x0 = -sc.L / 2 + 0.03, x1 = sc.L / 2 - 0.03, y1 = yT - cap;   // (between the back posts' inner faces; the posts on up as mullions)
      wlPart(parts, par, sc, new T.PlaneGeometry(x1 - x0, y1 - yb), PAN, 0, (yb + y1) / 2, zp);
      for (const s of [-1, 1]) wlPart(parts, par, sc, new T.BoxGeometry(0.06, y1 - RG.TOP, 0.05), NAV, s * sc.L / 2, (RG.TOP + y1) / 2, zp);
      wlPart(parts, par, sc, new T.BoxGeometry(sc.L + 0.06, cap, 0.07), NAV, 0, yT - cap / 2, zp);
      U.uWlA.value.copy(W(0, (yb + y1) / 2, zp)); }
    else { const t = O.t, pw = sc.L - 0.16, pz = -sc.D / 2 + 0.07, y0 = yb + t, y1 = yT - Math.max(t, cap * (t >= 0.025 ? 1 : 0.43)), py = (y0 + y1) / 2, ph = y1 - y0, tt = yT - y1;   // (the frame's top bar the cap: 3.5 cm (thin frames 1.5 cm))
      wlPart(parts, par, sc, new T.PlaneGeometry(pw, ph), PAN, 0, py, pz);
      for (const [w, h, x, y] of [[pw + 2 * t, tt, 0, yT - tt / 2], [pw + 2 * t, t, 0, yb + t / 2], [t, ph, -pw / 2 - t / 2, py], [t, ph, pw / 2 + t / 2, py]]) wlPart(parts, par, sc, new T.BoxGeometry(w, h, 0.03), NAV, x, y, pz - 0.006);
      U.uWlA.value.copy(W(0, py, pz)); }
    U.uWlB.value.set(0, sc.at(0, yb, 0).y, sc.at(0, yb + 0.5, 0).y);
    const cache = new Map(); g.traverse(m => { if (!m.isMesh || !m.material || Array.isArray(m.material) || m.material.transparent) return; const m0 = m.material; let M = cache.get(m0.uuid);
      if (!M) { M = wlPatch(m0, v, U); cache.set(m0.uuid, M); res.mats++; } m.material = M; });
    res.wings.push({ i, box: [b.min.toArray(), b.max.toArray()].map(a => a.map(x => +x.toFixed(3))), A: U.uWlA.value.toArray().map(x => +x.toFixed(3)), K: U.uWlK.value.toArray().map(x => +x.toFixed(3)) }); });
  res.props = wlMerge(par, parts); return (out.wingLight = res); };
// (L3: the parts' places from the optimiser (../l3 _l3_frames.js lOpt, LO: >= 4 px off every post and the lift's column in the first
// view, >= 6 px and 4 cm between the two parts of a bay, >= 5 cm off every post in 3D, >= 6 cm under the top board; both parts of a bay
// grow alike, at most 1.4 ×): [x, z, scale]; bays 0 1.32 ×, 1 1.37 ×, 2 1.17 ×, 3 1.18 ×, 4 1.25 × their size on the plinths)
L3U5.w = {"filter":[-0.505,0.035,1.37],"chip":[0.21,0.035,1.37],"turbo":[-0.31,0.017,1.42],"batt":[0.375,0.035,1.42],"springs":[-0.385,0.035,1.12],"dampers":[0.18,0.035,1.09],"arb":[-0.245,0.035,1.056],"pads":[0.38,0.035,1.23],"horn":[-0.23,0.035,1.3],"smoke":[0.46,0.035,1.3]};
// <<<< L3 BLOCK
// >>>> BG BLOCK (agent BG)
// ==== BG: NO LIT PANELS ON THE TOP, FRONT POSTS ON THE 4TH STOREY, SIX VERSIONS OF THE REGAL'S BACKGROUND AND POSTS (agent BG; the user,
//      after L3's six versions: "Zbriši plošče v zgornjem regalu, naredi 6 različnih ozadij, naredi, da je med ECU CHIP in TURBO ter na
//      celotnem 4. regalu podporna palica, tako kot je v prvih 3 regalih, naredi različne podporne palice za vse regale v teh 6
//      verzijah"). The rest of BG, marked "BG:" where it is: RG.BG (the version), rgFrame (the posts: bgPostsBuild; the front ones go up
//      to the top board as the back ones: storey D has its front posts at every bay boundary and at both ends, as the storeys below),
//      regalAll (the back's bands: bgBackBand; no l3Panels: only the garage's wall behind the spoilers), u5Shelf (the parts' places: BGU5)
//      THE SIX VERSIONS (RG.BG 1..6; null: the light-blue back and the navy perforated posts as before, with storey D's front posts):
//   1 light-grey perforated metal (a workshop pegboard: 4 cm holes' grid) + the navy perforated uprights (today's posts)
//   2 a dark navy slat wall (7.6 cm slats, their top edges catching the light), lit from above (a light pool under each board) + round chrome tubes
//   3 a glossy cool-white back (a faint sheen), a thin cyan LED line on each board's front edge (its lip's lower edge) and a cyan glow on
//     the wall under it + slim graphite square tubes (4 × 4 cm)
//   4 satin aluminium diamond plate (brushed, the raised lozenges lit from above) + aluminium T-slot profiles (5 × 5 cm, a dark slot a face)
//   5 a gradient: the game's light blue at each board fading to navy under the next + black powder-coated posts with a yellow line
//   6 warm light plywood (its grain, a darker edge) + white square posts (5 × 5 cm)
//   (f: a version's own shading of the storeys from A up (the game's light blue: 0.78, 0.86, 0.94, 0.98); led: the cyan LED lines on the
//   boards' front edges; sh: the soft shadows' colour on this back (the game's are navy, made for the light blue; null: as they are))
//   Every back is drawn in its band's metres on one 1024 × 512 canvas a version (the shading of the game's AOT baked in: dark under the board
//   above, at the sides and the foot), shown unlit (MeshBasic, as the light-blue one): the regal's light and the room's do not change. Every
//   post style stays inside today's post (0.06 × 0.05 m about the same axis): the parts' places clear of today's posts clear every style. The
//   posts are merged: one mesh a material a bay (today: 34 meshes a bay; with storey D's front posts 46) ----
const BGP = { frontUp: true,   // (the front posts up to the top board; false: as before, up to D's board)
  W: 0.06, D: 0.05, planeW: 0.01, ext: 0.05 };   // (W, D: the posts' envelope (today's post); planeW: a version's back band is sc.L - planeW wide (to the posts' axes; today's sc.L - 0.07), ext more at each side next to a bay)
const BGV = {
  1: { oz: 'Svetlo siva perforirana plošča', st: 'temno modri perforirani stebri', back: 'peg', posts: 'navy', sh: [20, 22, 26] },
  2: { oz: 'Temno modra stena z letvami, osvetljena od zgoraj', st: 'okrogle kromirane cevi', back: 'slat', posts: 'chrome', f: [0.94, 0.96, 0.98, 1.0] },
  3: { oz: 'Sijoče bela stena s cian LED črtami', st: 'tanke grafitne kvadratne cevi', back: 'white', posts: 'graphite', led: true, sh: [24, 30, 38] },
  4: { oz: 'Brušena aluminijasta rebrasta pločevina', st: 'aluminijasti profili z utori', back: 'diamond', posts: 'tslot', sh: [20, 22, 26] },
  5: { oz: 'Preliv od svetlo modre do temno modre', st: 'črni stebri z rumeno črto', back: 'grad', posts: 'black' },
  6: { oz: 'Svetla topla vezana plošča', st: 'beli kvadratni stebri', back: 'ply', posts: 'white', sh: [46, 30, 14] } };
// many boxes / cylinders in one geometry: [{ g, m }] (a geometry, its placing matrix) -> one BufferGeometry (position, normal, uv, index)
const bgMerge = (list) => { let nv = 0, ni = 0; list.forEach(({ g }) => { nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; });
  const P = new Float32Array(nv * 3), N = new Float32Array(nv * 3), U = new Float32Array(nv * 2), I = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni), v = V(), nm = new T.Matrix3(); let ov = 0, oi = 0;
  list.forEach(({ g, m }) => { nm.getNormalMatrix(m); const p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv;
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(m); P[(ov + i) * 3] = v.x; P[(ov + i) * 3 + 1] = v.y; P[(ov + i) * 3 + 2] = v.z;
      v.fromBufferAttribute(n, i).applyMatrix3(nm).normalize(); N[(ov + i) * 3] = v.x; N[(ov + i) * 3 + 1] = v.y; N[(ov + i) * 3 + 2] = v.z; if (u) { U[(ov + i) * 2] = u.getX(i); U[(ov + i) * 2 + 1] = u.getY(i); } }
    if (g.index) for (let i = 0; i < g.index.count; i++) I[oi++] = g.index.getX(i) + ov; else for (let i = 0; i < p.count; i++) I[oi++] = i + ov;
    ov += p.count; g.dispose(); });
  const out = new T.BufferGeometry(); out.setAttribute('position', new T.BufferAttribute(P, 3)); out.setAttribute('normal', new T.BufferAttribute(N, 3)); out.setAttribute('uv', new T.BufferAttribute(U, 2));
  out.setIndex(new T.BufferAttribute(I, 1)); out.computeBoundingBox(); out.computeBoundingSphere(); return out; };
const bgB = (w, h, d, x, y, z) => ({ g: new T.BoxGeometry(w, h, d), m: new T.Matrix4().makeTranslation(x, y, z) });
const bgC = (r, h, x, y, z, seg = 20) => ({ g: new T.CylinderGeometry(r, r, h, seg), m: new T.Matrix4().makeTranslation(x, y, z) });
// the boards' levels a post crosses (A..D and the top board's middle): the tubes' collars
const bgLevels = () => RG.LV.slice(0, 4).concat([RG.TOP - 0.02]);
// the T-slot profile's face: satin aluminium, a dark slot down the middle (its lips lit), the corners' bevels (u across a face, v along the post)
let BGTSLOT = null;
const bgTslotTex = () => { if (BGTSLOT) return BGTSLOT; const c = document.createElement('canvas'); c.width = 64; c.height = 8; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 64, 0); gr.addColorStop(0, '#8e959d'); gr.addColorStop(0.07, '#d3d8dd'); gr.addColorStop(0.3, '#c9ced4'); gr.addColorStop(0.7, '#c4c9cf'); gr.addColorStop(0.93, '#bfc4ca'); gr.addColorStop(1, '#7e858d');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 8); g.fillStyle = '#e6eaee'; g.fillRect(22, 0, 2, 8); g.fillStyle = '#2b3036'; g.fillRect(24, 0, 16, 8); g.fillStyle = '#5a6068'; g.fillRect(40, 0, 2, 8);
  const t = new T.CanvasTexture(c); t.anisotropy = 4; return (BGTSLOT = t); };
// the post styles: w × d (inside BGP's envelope), the parts of a post (k: the material's key), the materials
const BGPS = {
  navy: { w: 0.06, d: 0.05, nm: 'temno modri perforirani (kot danes)',
    build: (p, add) => { add('post', bgB(0.06, p.h, 0.05, p.x, p.h / 2, p.z)); if (p.front) for (let y = 0.15; y < p.h - 0.1; y += 0.12) add('hole', bgB(0.02, 0.05, 0.052, p.x, y, p.z + 0.001)); },
    mat: (k, M) => (k === 'post' ? M.UP : M.HOLE) },
  chrome: { w: 0.048, d: 0.048, nm: 'okrogle kromirane cevi (premer 4,8 cm)',
    build: (p, add) => { add('tube', bgC(0.024, p.h, p.x, p.h / 2, p.z, 16)); add('tube', bgC(0.029, 0.016, p.x, 0.008, p.z, 12));   // (16 sides a tube, 12 a collar: round enough at this size)
      bgLevels().forEach(y => { if (y < p.h + 0.01) add('tube', bgC(0.0285, 0.05, p.x, Math.min(y, p.h - 0.025), p.z, 12)); }); },
    mat: () => exhMetMat('chrome', T.FrontSide) },   // (EXH's polished chrome: the lit garage's reflection over its colour, a small highlight)
  graphite: { w: 0.04, d: 0.04, nm: 'tanke grafitne kvadratne cevi (4 × 4 cm)',
    build: (p, add) => { add('post', bgB(0.04, p.h, 0.04, p.x, p.h / 2, p.z)); },
    mat: (k) => (k === 'led' ? new T.MeshBasicMaterial({ color: new T.Color(0.30, 0.90, 1.0) }) : PR.mat(0x3a3e46, { shininess: 55, specular: 0x3c3c3c })) },
  tslot: { w: 0.05, d: 0.05, nm: 'aluminijasti profili z utori (5 × 5 cm)',
    build: (p, add) => { add('post', bgB(0.05, p.h, 0.05, p.x, p.h / 2, p.z)); },
    mat: () => PR.mat(0xffffff, { map: bgTslotTex(), shininess: 45, specular: 0x4a4a4a }) },
  black: { w: 0.06, d: 0.05, nm: 'črni stebri z rumeno črto',
    build: (p, add) => { add('post', bgB(0.06, p.h, 0.05, p.x, p.h / 2, p.z)); add('line', bgB(0.014, p.h - 0.06, 0.002, p.x, p.h / 2, p.z + 0.0255)); },
    mat: (k) => (k === 'post' ? PR.mat(0x1c1e22, { shininess: 22, specular: 0x262626 }) : PR.lam(0xf6c21c, { emissive: 0x2a1e00 })) },
  white: { w: 0.05, d: 0.05, nm: 'beli kvadratni stebri (5 × 5 cm)',
    build: (p, add) => { add('post', bgB(0.05, p.h, 0.05, p.x, p.h / 2, p.z)); },
    mat: () => PR.lam(0xdde1e5) } };
// a bay's four posts (specs: { x, z, h, front } in the bay's frame) in the version's style, merged; returns { style, list, meshes }
const bgPostsBuild = (fr, specs, M) => { const v = bgVer(), key = v ? v.posts : 'navy', S = BGPS[key], parts = {}, order = [];
  const add = (k, it) => { if (!parts[k]) { parts[k] = []; order.push(k); } parts[k].push(it); }; specs.forEach(p => S.build(p, add));
  if (v && v.led) { const L = specs[3].x - specs[0].x, z = specs[1].z + 0.03 + 0.0162; RG.LV.slice(0, 4).map(y => y - 0.01).concat([RG.TOP - 0.05]).forEach(yc => add('led', bgB(L - 0.07, 0.007, 0.002, 0, yc - 0.021, z))); }   // (the LED lines: on each board's lip, its lower edge)
  const meshes = order.map(k => { const m = new T.Mesh(bgMerge(parts[k]), S.mat(k, M)); m.userData.bgPost = k; fr.add(m); return m; });
  return { style: key, list: specs.map(p => Object.assign({ w: S.w, d: S.d, W: BGP.W, D: BGP.D }, p)), meshes }; };
// ---- the backs: each drawn on a canvas in its band's metres (W × H m), then the game's back shading over it (AOT's: under the board above,
//      the sides, the foot, the top corners) ----
const BGTX = {};
const bgRand = (s) => () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
const bgBackTex = (kind, Wm, Hm) => { if (kind.slice(0, 2) === 'pb') return pbBackTex(kind, Wm, Hm);   // (PB: the six pegboards (pbBackTex, the PB block))
  const key = kind + ':' + Wm.toFixed(3) + ':' + Hm.toFixed(3); if (BGTX[key]) return BGTX[key];
  const CW = 1024, CH = 512, c = document.createElement('canvas'); c.width = CW; c.height = CH; const g = c.getContext('2d'), sx = CW / Wm, sy = CH / Hm, R = bgRand(7 + kind.length * 131);
  const X = (m) => m * sx, Y = (m) => m * sy;   // (metres from the band's left / top edge to canvas px)
  const lin = (y0, y1, stops) => { const gr = g.createLinearGradient(0, Y(y0), 0, Y(y1)); stops.forEach(([t, col]) => gr.addColorStop(t, col)); return gr; };
  let ao = { top: 0.55, topH: 0.20, side: 0.30, sideW: 0.28, foot: 0.22, footH: 0.06, corner: 0.35 };
  if (kind === 'peg') {   // a light-grey pegboard: holes on a 4 cm grid (1 cm across), each a dark well with a lit lower lip
    g.fillStyle = '#d0d4d9'; g.fillRect(0, 0, CW, CH);
    for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(${R() < 0.5 ? '255,255,255' : '0,0,0'},0.025)`; g.fillRect(0, Y(R() * Hm), CW, Y(0.004 + R() * 0.01)); }
    const p = 0.04, r = 0.0052; for (let yy = p / 2; yy < Hm; yy += p) for (let xx = p / 2 - ((Wm / 2) % p); xx < Wm; xx += p) { if (xx < 0) continue;
      g.fillStyle = '#eef1f4'; g.beginPath(); g.ellipse(X(xx), Y(yy) + 1.2, X(r), Y(r), 0, 0, 7); g.fill();
      g.fillStyle = '#3b4148'; g.beginPath(); g.ellipse(X(xx), Y(yy), X(r), Y(r), 0, 0, 7); g.fill(); }
  } else if (kind === 'slat') {   // a dark navy slat wall: 7.6 cm slats, the groove under each dark, the slat's top edge catching the light; a light pool from above
    ao = { top: 0.30, topH: 0.04, side: 0.30, sideW: 0.28, foot: 0.25, footH: 0.08, corner: 0.25 };
    g.fillStyle = lin(0, Hm, [[0, '#4165b8'], [0.35, '#2e4a90'], [1, '#22376f']]); g.fillRect(0, 0, CW, CH);
    const p = 0.076; for (let yy = 0.028; yy < Hm; yy += p) { g.fillStyle = 'rgba(6,10,24,0.85)'; g.fillRect(0, Y(yy), CW, Y(0.011));
      g.fillStyle = 'rgba(0,0,0,0.30)'; g.fillRect(0, Y(yy + 0.011), CW, Y(0.006)); g.fillStyle = 'rgba(150,185,255,0.40)'; g.fillRect(0, Y(yy - 0.004), CW, Y(0.004)); }
    const pool = g.createRadialGradient(CW / 2, -Y(0.25), 0, CW / 2, -Y(0.25), X(1.2)); pool.addColorStop(0, 'rgba(120,160,255,0.22)'); pool.addColorStop(1, 'rgba(120,160,255,0)'); g.fillStyle = pool; g.fillRect(0, 0, CW, CH);
  } else if (kind === 'white') {   // a glossy cool white: a faint diagonal sheen; under the board above a thin cyan LED line and its glow
    ao = { top: 0.0, topH: 0.20, side: 0.20, sideW: 0.28, foot: 0.16, footH: 0.06, corner: 0.18 };
    g.fillStyle = '#dce3ea'; g.fillRect(0, 0, CW, CH);
    g.save(); g.transform(1, 0, -0.55, 1, 0, 0); [[0.25, 0.10, 0.06], [0.62, 0.22, 0.05], [1.15, 0.12, 0.05], [1.55, 0.3, 0.04]].forEach(([x0, w, a]) => { const gr = g.createLinearGradient(X(x0), 0, X(x0 + w), 0);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, `rgba(255,255,255,${a * 2.2})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(X(x0), 0, X(w), CH * 2); }); g.restore();
    g.fillStyle = lin(0, 0.30, [[0, 'rgba(70,215,245,0.50)'], [0.3, 'rgba(70,215,245,0.20)'], [1, 'rgba(70,215,245,0)']]); g.fillRect(0, 0, CW, Y(0.30));
    g.fillStyle = 'rgba(10,20,30,0.30)'; g.fillRect(0, 0, CW, Y(0.004)); g.fillStyle = '#2fd8f4'; g.fillRect(0, Y(0.004), CW, Y(0.009)); g.fillStyle = 'rgba(190,250,255,0.85)'; g.fillRect(0, Y(0.006), CW, Y(0.004));
  } else if (kind === 'diamond') {   // satin aluminium diamond plate: brushed streaks, the raised lozenges (two ways, staggered) lit from above
    ao = { top: 0.45, topH: 0.20, side: 0.28, sideW: 0.28, foot: 0.22, footH: 0.06, corner: 0.30 };
    g.fillStyle = '#a6adb5'; g.fillRect(0, 0, CW, CH);
    for (let i = 0; i < 900; i++) { const l = R() < 0.5; g.fillStyle = `rgba(${l ? '255,255,255' : '0,0,0'},${0.03 + R() * 0.05})`; g.fillRect(X(R() * Wm) - X(0.4), Y(R() * Hm), X(0.2 + R() * 0.8), 1); }
    const p = 0.034, a = 0.0145, b = 0.0042; let row = 0;
    for (let yy = p / 4; yy < Hm + p; yy += p / 2, row++) for (let xx = (row % 2) * p / 2; xx < Wm + p; xx += p) { const ang = ((Math.round(xx / p * 2) + row) % 2 ? 1 : -1) * Math.PI / 4;
      const L = (dx, dy, col) => { g.fillStyle = col; g.beginPath(); g.ellipse(X(xx) + dx, Y(yy) + dy, X(a), Y(b), ang, 0, 7); g.fill(); };
      L(1.6, 2.0, 'rgba(50,55,62,0.70)'); L(-0.9, -1.2, 'rgba(240,244,248,0.90)'); L(0, 0, '#c0c6cd'); }
  } else if (kind === 'grad') {   // the game's light blue at the board (the band's foot) fading to navy under the board above
    ao = { top: 0.25, topH: 0.10, side: 0.22, sideW: 0.28, foot: 0.10, footH: 0.05, corner: 0.20 };
    g.fillStyle = lin(0, Hm, [[0, '#1b2b5c'], [0.30, '#223b80'], [0.62, '#5596d4'], [0.88, '#8bcdf2'], [1, '#95d5f7']]); g.fillRect(0, 0, CW, CH);
  } else if (kind === 'ply') {   // warm light plywood: the grain (long wavy lines, darker and lighter streaks), a knot or two, a darker edge
    ao = { top: 0.42, topH: 0.20, side: 0.26, sideW: 0.28, foot: 0.20, footH: 0.06, corner: 0.28 };
    g.fillStyle = '#d6b88c'; g.fillRect(0, 0, CW, CH);
    for (let i = 0; i < 26; i++) { const y = R() * Hm, h = 0.01 + R() * 0.05; g.fillStyle = `rgba(${R() < 0.5 ? '255,236,200' : '150,105,55'},${0.07 + R() * 0.1})`; g.fillRect(0, Y(y), CW, Y(h)); }
    for (let i = 0; i < 150; i++) { const y0 = R() * Hm, amp = 0.002 + R() * 0.012, f = 1 + R() * 3, ph = R() * 6; g.strokeStyle = `rgba(${R() < 0.7 ? '120,80,40' : '250,230,190'},${0.10 + R() * 0.22})`; g.lineWidth = 0.6 + R() * 1.4;
      g.beginPath(); for (let xx = 0; xx <= Wm + 0.01; xx += 0.02) { const yy = y0 + amp * Math.sin(xx * f * 2 + ph) + amp * 0.5 * Math.sin(xx * f * 5.3 + ph * 2); xx ? g.lineTo(X(xx), Y(yy)) : g.moveTo(X(xx), Y(yy)); } g.stroke(); }
    for (let i = 0; i < 2; i++) { const x = 0.2 + R() * (Wm - 0.4), y = 0.12 + R() * (Hm - 0.24); g.fillStyle = 'rgba(120,78,36,0.35)'; g.beginPath(); g.ellipse(X(x), Y(y), X(0.022), Y(0.009), 0, 0, 7); g.fill();
      g.strokeStyle = 'rgba(120,78,36,0.25)'; g.lineWidth = 1; g.beginPath(); g.ellipse(X(x), Y(y), X(0.045), Y(0.018), 0, 0, 7); g.stroke(); }
  }
  // the shading (the game's AOT in metres: under the board above, the sides, the foot, the top corners)
  const band = (x0, y0, x1, y1, a) => { if (!a) return; const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, CW, CH); };
  band(0, 0, 0, Y(ao.topH), ao.top); band(0, 0, X(ao.sideW), 0, ao.side); band(CW, 0, CW - X(ao.sideW), 0, ao.side); band(0, CH, 0, CH - Y(ao.footH), ao.foot);
  const cr = (x) => { const gr = g.createRadialGradient(x, 0, 0, x, 0, X(0.6)); gr.addColorStop(0, `rgba(0,0,0,${ao.corner})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, CW, CH); }; cr(0); cr(CW);
  const t = new T.CanvasTexture(c); t.anisotropy = 8; return (BGTX[key] = t); };
// one band of a bay's back (i the storey from A, top the last one's index): the version's back (RG.BG), or as before (the light blue)
const bgBackBand = (sc, i, top, y0, y1, col, f) => { const v = bgVer(); if (v && v.gm) return gmBackBand(sc, i, top, y0, y1, col, f, v);   // (GM: L3 A's light blue with P3's slots (gmBackBand, the GM block))
  if (v && v.f) f = v.f[Math.min(i, 3)]; if (!v) { const m = (i === top ? bayBackAOH : bayBackAO)(sc, y0, y1, col, f); m.userData.bgBack = i; return m; }
  // (the band runs on BGP.ext behind the posts between two bays (there the bays' backs part round the ring: the gap between them closed; the
  //  regal's two ends not); one texture a version, the wider bands' pattern stretched by under 6 %)
  const eL = sc.k > 0 ? BGP.ext : 0, eR = sc.k < sc.nb - 1 ? BGP.ext : 0, Wm = sc.L - BGP.planeW, Hm = y1 - y0 - 0.01, key = v.back + ':' + f;
  const mat = BGMAT[key] || (BGMAT[key] = new T.MeshBasicMaterial({ map: bgBackTex(v.back, Wm, 0.605), color: new T.Color(f, f, f) })), m = new T.Mesh(new T.PlaneGeometry(Wm + eL + eR, Hm), mat);
  m.position.set((eR - eL) / 2, (y0 + y1) / 2, -sc.D / 2 + 0.045); m.userData.bgBack = i; sc.g.add(m); return m; };
const BGMAT = {};
// the tuning parts' places with storey D's front posts (BGU5.w: [x, z, scale] a part; null: L3's (L3U5.w)); from the optimiser (../bg
// _bg_frames.js bgOpt), appended below
const BGU5 = { w: null };
// the soft shadows (the game's shadowB / shadowR decals: navy, made for the light-blue back; L3's stand shadows) in the version's own shadow
// colour (BGV sh: a neutral grey on the grey and the white backs, a warm brown on the plywood): the same shapes and the same opacity
const BGSH = {};
const bgShTex = (kind, c) => { const key = kind + c.join(','); if (BGSH[key]) return BGSH[key]; const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'), rgb = c.join(',');
  if (kind === 'R') { const gr = g.createRadialGradient(32, 32, 4, 32, 32, 31); gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(0.55, `rgba(${rgb},0.75)`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
  else { g.filter = 'blur(7px)'; g.fillStyle = `rgb(${rgb})`; g.fillRect(14, 14, 36, 36); }
  return (BGSH[key] = new T.CanvasTexture(cv)); };
const bgShadows = (out) => { const v = bgVer(); if (!v || !v.sh) return 0; const t0 = SHT(), r0 = SHR(), n = { box: 0, round: 0, stands: 0 };
  out.par.traverse(m => { if (!m.isMesh || !m.material) return; const M = m.material;
    if (M.map === t0 || M.map === r0) { const R = M.map === r0, c = M.clone(); c.map = bgShTex(R ? 'R' : 'B', v.sh); m.material = c; n[R ? 'round' : 'box']++; }
    else if (M.uniforms && M.uniforms.uTint && m.userData.l3Shadow) { M.uniforms.uTint.value.setRGB(v.sh[0] / 255 * 0.55, v.sh[1] / 255 * 0.55, v.sh[2] / 255 * 0.55); n.stands++; } });
  return (out.bgShadows = n); };
// (BG: the parts' places with storey D's front posts, from the optimiser (../bg _bg_frames.js bgOpt: the outlines >= 3 px off every post's
// envelope and the lift's column in the first view, >= 4 px between the two parts of a bay, >= 5 cm off every post in 3D, >= 6 cm under
// the top board, each at most its size in L3, as big on the screen as it can): [x, z, scale]; their outlines' area on the screen against
// L3's places: bay 0 0.89/0.89, 1 0.99/1.01, 2 1.03/1.01, 3 1.01/1.01, 4 0.88/0.89)
BGU5.w = {"filter": [-0.38, 0, 1.3], "chip": [0.23, 0.07, 1.29], "turbo": [-0.255, 0.017, 1.42], "batt": [0.375, 0.105, 1.42], "springs": [-0.385, 0.07, 1.12], "dampers": [0.175, 0.105, 1.09], "arb": [-0.245, 0.105, 1.056], "pads": [0.35, 0.105, 1.23], "horn": [-0.305, -0.035, 1.23], "smoke": [0.33, 0, 1.24]};
// <<<< BG BLOCK
// >>>> PB BLOCK (agent PB)
// ==== PB: SIX VERSIONS OF THE LIGHT-GREY PEGBOARD BACK AND A BETTER-LOOKING LIFT (agent PB; the user, on BG's version 1 (the light-grey
//      perforated metal back, the navy perforated posts): "Naredi to ozadje v 6 različnih verzijah in izboljšaj grafiko dvigala"). The rest
//      of PB, marked "PB:" where it is: RG.PB (the version, over RG.BG 1), bgVer (every place that read BGV[RG.BG]), bgBackTex (the 'pb'
//      kinds: pbBackTex), regalAll (pbExtras), ZBASE (pbLiftOff, pbLift).
//   THE SIX PEGBOARDS (RG.PB 1..6; every one light-grey perforated metal with BG version 1's navy perforated posts; drawn on one 1024 × 512
//   canvas a version as BG's, unlit (MeshBasic): the regal's light and the room's do not change):
//   1 version 1 refined: its 4 cm grid of round holes (1.1 cm), each a clean dark well with a lit lower lip and a shaded upper rim, no streaks;
//     a soft shade under each board (a contact line, then a smooth falloff) instead of the straight band
//   2 finer and denser: round holes 0.7 cm on a 2.5 cm grid, the sheet brighter
//   3 slotted: upright oblong slots (0.7 × 2.2 cm) in staggered rows, industrial slotted pegboard
//   4 a shadow board: version 1's pegboard with a painted yellow line (1.5 cm) round each part, as workshops mark their tools: a rounded
//     rectangle 4 cm out of the part's outline seen straight on (a circle 6 cm out round each rim; neighbours share the room between
//     them, no two lines cross; pbOutlines: one unlit mesh in the storey's shading)
//   5 cool blue-grey with square holes (1.1 cm on a 4 cm grid)
//   6 warm grey (3 cm grid, 0.9 cm holes) with a few generic J-hooks (one in every second band, at its best free place the first view
//     sees; every one with a coiled hose or lead where there is room; pbHooks: one mesh) and a thin yellow line along each board's back
//     edge (painted on the sheet right over the board)
//   (sh: the soft shadows' colour on this back, as BG's; posts: always BG version 1's navy perforated ones) ----
const PBV = {
  1: { oz: 'Perforirana plošča, izčiščena', st: 'temno modri perforirani stebri', back: 'pb1', posts: 'navy', sh: [20, 22, 26] },
  2: { oz: 'Gostejše drobne luknjice', st: 'temno modri perforirani stebri', back: 'pb2', posts: 'navy', sh: [20, 22, 26] },
  3: { oz: 'Podolgovate reže', st: 'temno modri perforirani stebri', back: 'pb3', posts: 'navy', sh: [20, 22, 26] },
  4: { oz: 'Plošča z obrisi delov', st: 'temno modri perforirani stebri', back: 'pb1', posts: 'navy', sh: [20, 22, 26], outline: { col: '#f2c21a', w: 0.015, d: 0.04, dr: 0.06, rc: 0.05, gap: 0.03 } },
  5: { oz: 'Hladna modro siva s kvadratnimi luknjami', st: 'temno modri perforirani stebri', back: 'pb5', posts: 'navy', sh: [16, 22, 34] },
  6: { oz: 'Topla siva s kavlji in rumeno črto', st: 'temno modri perforirani stebri', back: 'pb6', posts: 'navy', sh: [32, 27, 20], hooks: true } };
const bgVer = () => (RG.GM && GMV[RG.GM]) || (RG.PB && PBV[RG.PB]) || BGV[RG.BG];   // (GM: GM's version first (GMV, the GM block))
// the sheets: base colour, holes (shape, pitch x / y, size, stagger), the hole's well / lip / rim colours, the shade under the board (a, h),
// the other shading as BG's (ao), a painted line at the foot (P6)
const PBK = {
  pb1: { base: '#d0d4d9', hole: 'round', px: 0.04, py: 0.04, r: 0.0055, well: '#2e3339', lip: '#f3f5f7', rim: '#9da3aa', shade: { a: 0.46, h: 0.17 } },
  pb2: { base: '#e4e8ec', hole: 'round', px: 0.025, py: 0.025, r: 0.0035, well: '#353a40', lip: '#f8fafc', rim: '#b0b6bd', shade: { a: 0.40, h: 0.16 } },
  pb3: { base: '#ced2d7', hole: 'slot', px: 0.034, py: 0.04, sw: 0.0070, sh: 0.022, stagger: true, well: '#2c3137', lip: '#f2f4f6', rim: '#979ea6', shade: { a: 0.46, h: 0.17 } },
  pb5: { base: '#b3c1d0', hole: 'square', px: 0.04, py: 0.04, s: 0.011, well: '#202a36', lip: '#d8e3ee', rim: '#7d8ca0', shade: { a: 0.46, h: 0.17 } },
  pb6: { base: '#d4ccbf', hole: 'round', px: 0.03, py: 0.03, r: 0.0045, well: '#3a332b', lip: '#f7f1e8', rim: '#a89f92', shade: { a: 0.46, h: 0.17 }, line: { col: '#efbf1a', h: 0.012, y: 0.004 } } };
const pbBackTex = (kind, Wm, Hm) => { const key = kind + ':' + Wm.toFixed(3) + ':' + Hm.toFixed(3); if (BGTX[key]) return BGTX[key]; const K = PBK[kind];
  const CW = 1024, CH = 512, c = document.createElement('canvas'); c.width = CW; c.height = CH; const g = c.getContext('2d'), sx = CW / Wm, sy = CH / Hm, R = bgRand(11 + kind.length * 37);
  const X = (m) => m * sx, Y = (m) => m * sy;
  g.fillStyle = K.base; g.fillRect(0, 0, CW, CH);
  for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(${R() < 0.5 ? '255,255,255' : '0,0,0'},0.012)`; g.fillRect(X(R() * Wm), 0, X(0.02 + R() * 0.12), CH); }   // (a faint rolled-sheet sheen, upright)
  if (K.line) { g.fillStyle = K.line.col; g.fillRect(0, CH - Y(K.line.y + K.line.h), CW, Y(K.line.h)); g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, CH - Y(K.line.y + K.line.h) - 1, CW, 1); }
  const shape = (cx, cy, dx, dy, grow) => { g.beginPath(); const gx = grow / sx, gy = grow / sy;   // (grow: canvas px)
    if (K.hole === 'round') g.ellipse(cx + dx, cy + dy, X(K.r) + grow, Y(K.r) + grow, 0, 0, 7);
    else if (K.hole === 'square') { const w = X(K.s) + 2 * grow, h = Y(K.s) + 2 * grow; g.rect(cx + dx - w / 2, cy + dy - h / 2, w, h); }
    else { const w = X(K.sw) + 2 * grow, h = Y(K.sh) + 2 * grow, rr = Math.min(w, h) / 2; g.roundRect ? g.roundRect(cx + dx - w / 2, cy + dy - h / 2, w, h, rr) : g.rect(cx + dx - w / 2, cy + dy - h / 2, w, h); }
    g.fill(); };
  const lineY = K.line ? Hm - K.line.y - K.line.h - 0.01 : Hm;   // (no holes in the painted line)
  const x0 = K.px / 2 - ((Wm / 2) % K.px); let row = 0;
  for (let yy = K.py / 2; yy < lineY; yy += K.py, row++) { const off = K.stagger && (row & 1) ? K.px / 2 : 0;
    for (let xx = x0 + off - K.px; xx < Wm + K.px; xx += K.px) { if (xx < -0.01 || xx > Wm + 0.01) continue; const cx = X(xx), cy = Y(yy);
      g.fillStyle = K.lip; shape(cx, cy, 0, 1.1, 0.2); g.fillStyle = K.rim; shape(cx, cy, 0, -0.7, 0.2); g.fillStyle = K.well; shape(cx, cy, 0, 0, 0);
      g.fillStyle = 'rgba(0,0,0,0.35)'; shape(cx, cy, 0, -0.8, -0.9); } }   // (the well's upper wall in its own shade)
  // the shading: under the board above a contact line and a smooth falloff (the soft shade), the sides, the foot, the top corners (BG's)
  const S = K.shade, sh = g.createLinearGradient(0, 0, 0, Y(S.h)); [[0, 1], [0.08, 0.72], [0.25, 0.42], [0.5, 0.17], [0.75, 0.05], [1, 0]].forEach(([t, k]) => sh.addColorStop(t, `rgba(0,0,0,${(S.a * k).toFixed(3)})`));
  g.fillStyle = sh; g.fillRect(0, 0, CW, Y(S.h)); g.fillStyle = 'rgba(0,0,0,0.30)'; g.fillRect(0, 0, CW, Y(0.003));
  const band = (x0, y0, x1, y1, a) => { const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, CW, CH); };
  band(0, 0, X(0.28), 0, 0.28); band(CW, 0, CW - X(0.28), 0, 0.28); band(0, CH, 0, CH - Y(0.06), K.line ? 0.12 : 0.2);
  const cr = (x) => { const gr = g.createRadialGradient(x, 0, 0, x, 0, X(0.6)); gr.addColorStop(0, 'rgba(0,0,0,0.30)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, CW, CH); }; cr(0); cr(CW);
  const t = new T.CanvasTexture(c); t.anisotropy = 8; return (BGTX[key] = t); };
// ---- the version's extras, after the regal's parts stand (regalAll): P4 the painted outlines, P6 the hooks; each one mesh for the whole
//      regal (in out.par) ----
// every part on show with its bay and its storey's back band: [{ nm, sc, objs, band }] (the tyre sets, the exhausts with their stands, each
// rim, the tuning parts; not the spoilers: the top has no back)
const pbParts = (out) => { const L = [], add = (nm, sc, objs) => L.push({ nm, sc, objs });
  out.tyres.forEach((g) => add('gume ' + g.userData.si, out.secs[g.userData.si], [g]));   // (GM: the set's own bay)
  out.exh.forEach(x => add('auspuh ' + x.si + '/' + x.lv, x.sec, [x.g]));
  out.rims.forEach(q => q.ps.forEach((p, j) => add('platišče ' + q.si + '/' + q.lv + '/' + j, q.sec, [p])));
  if (out.tun && out.tun.places) out.tun.places.forEach(p => add(p.nm, out.secs[p.si != null ? p.si : p.bay != null ? p.bay : 0], [p.part || p.g]));
  return L; };
const pbHull2 = (P) => { const p = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]); if (p.length < 3) return p; const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.slice().reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1)); };   // (counter-clockwise)
// a part's outline seen straight on its bay's back (x, y in the bay's frame): the convex hull of its vertices; its bay index found from where it stands
const pbPartXY = (it) => { const sc0 = it.sc, P = []; sc0.g.updateMatrixWorld(true); const v = V();
  it.objs.forEach(o => o.traverse(m => { if (!m.isMesh || !m.visible || !m.geometry || !m.geometry.attributes.position) return; const M = m.material; if (M && !Array.isArray(M) && M.transparent && M.depthWrite === false) return;
    const pa = m.geometry.attributes.position, st = Math.max(1, Math.floor(pa.count / 400)); m.updateMatrixWorld(true);
    for (let i = 0; i < pa.count; i += st) { v.fromBufferAttribute(pa, i).applyMatrix4(m.matrixWorld); sc0.g.worldToLocal(v); P.push([v.x, v.y]); } }));
  return P.length ? pbHull2(P) : null; };
// the band a part stands in front of (its lowest point's storey): the back's mesh of that storey in its bay
const pbBand = (sc, y) => { let best = null; (sc.backs || []).forEach(m => { const h = m.geometry.parameters.height, y0 = m.position.y - h / 2, y1 = m.position.y + h / 2; if (y >= y0 - 0.06 && y < y1 && (!best || y0 > best.y0)) best = { m, y0, y1, f: m.material.color ? m.material.color.r : 1 }; }); return best; };
// a convex polygon (ccw) grown by d with round corners (steps <= 15 degrees), closed
const pbGrow = (H, d) => { const out = [], n = H.length; for (let i = 0; i < n; i++) { const a = H[(i + n - 1) % n], b = H[i], c = H[(i + 1) % n];
    const n0 = Math.atan2(-(b[0] - a[0]), b[1] - a[1]), n1 = Math.atan2(-(c[0] - b[0]), c[1] - b[1]); let d1 = n1 - n0; while (d1 < 0) d1 += 2 * Math.PI; while (d1 > 2 * Math.PI) d1 -= 2 * Math.PI;
    const k = Math.max(1, Math.ceil(d1 / (Math.PI / 12))); for (let j = 0; j <= k; j++) { const t = n0 + d1 * j / k; out.push([b[0] + d * Math.cos(t), b[1] + d * Math.sin(t)]); } }
  out.push(out[0]); return out; };
// a rounded rectangle round a hull (its box grown by d, its corners round with radius rc), closed
const pbRRect = (H, d, rc) => { const x0 = Math.min(...H.map(p => p[0])) - d, x1 = Math.max(...H.map(p => p[0])) + d, y0 = Math.min(...H.map(p => p[1])) - d, y1 = Math.max(...H.map(p => p[1])) + d, r = Math.min(rc, (x1 - x0) / 2, (y1 - y0) / 2), out = [];
  for (const [cx, cy, a0] of [[x1 - r, y0 + r, -Math.PI / 2], [x1 - r, y1 - r, 0], [x0 + r, y1 - r, Math.PI / 2], [x0 + r, y0 + r, Math.PI]]) for (let j = 0; j <= 6; j++) { const t = a0 + j / 6 * Math.PI / 2; out.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]); }
  out.push(out[0]); return out; };
// a painted line along a polyline (x, y in a bay's frame) on its back at z, clipped to the band (y0..y1, x0..x1), w wide: quads into P / C (par's frame)
const pbLineInto = (acc, sc, pts, z, w, clip, col, shadeAt) => { const seg = [];
  for (let i = 0; i + 1 < pts.length; i++) { let [ax, ay] = pts[i], [bx, by] = pts[i + 1], t0 = 0, t1 = 1; const dx = bx - ax, dy = by - ay;
    const lim = (p, q) => { if (Math.abs(p) < 1e-9) return q >= 0; const r = q / p; if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; } return true; };
    if (!lim(-dx, ax - clip[0]) || !lim(dx, clip[2] - ax) || !lim(-dy, ay - clip[1]) || !lim(dy, clip[3] - ay)) continue;
    seg.push([[ax + dx * t0, ay + dy * t0], [ax + dx * t1, ay + dy * t1]]); }
  const W = (x, y) => acc.par.worldToLocal(sc.g.localToWorld(V(x, y, z)));
  seg.forEach(([a, b]) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 1e-4) return; const ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L, nx = -uy * w / 2, ny = ux * w / 2, e = w / 2;
    const A = [a[0] - ux * e, a[1] - uy * e], Bq = [b[0] + ux * e, b[1] + uy * e], q = [[A[0] - nx, A[1] - ny], [Bq[0] - nx, Bq[1] - ny], [Bq[0] + nx, Bq[1] + ny], [A[0] + nx, A[1] + ny]].map(p => W(p[0], p[1]));
    [[0, 1, 2], [0, 2, 3]].forEach(t => t.forEach(k => { const p = q[k], s = shadeAt(k === 0 || k === 3 ? A[1] : Bq[1]); acc.P.push(p.x, p.y, p.z); acc.C.push(col.r * s, col.g * s, col.b * s); })); }); };
// P4: a painted line round each part on the back (its outline straight on, grown by d), in the storey's shading (the band's f and the soft
// shade under the board above): one unlit mesh
const pbOutlines = (out, O) => { const acc = { par: out.par, P: [], C: [] }, col = new T.Color(O.col); out.par.updateMatrixWorld(true); const ents = [];
  pbParts(out).forEach(it => { const H = pbPartXY(it); if (!H || H.length < 3) return; const xs = H.map(p => p[0]), ys = H.map(p => p[1]), b = pbBand(it.sc, Math.min(...ys) + 0.02); if (!b) return;
    const rim = /^platišče/.test(it.nm); ents.push({ it, H, b, rim, x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys), dL: rim ? O.dr : O.d, dR: rim ? O.dr : O.d }); });
  // (neighbours in a band share the space between them: no two outlines cross; inside the bay's posts)
  const bands = new Map(); ents.forEach(e => { if (!bands.has(e.b.m)) bands.set(e.b.m, []); bands.get(e.b.m).push(e); });
  bands.forEach(L => { L.sort((a, b) => a.x0 - b.x0); for (let i = 0; i + 1 < L.length; i++) { const A = L[i], Bn = L[i + 1], half = Math.max(0.008, (Bn.x0 - A.x1) / 2 - O.gap / 2); A.dR = Math.min(A.dR, half); Bn.dL = Math.min(Bn.dL, half); } });
  let n = 0; ents.forEach(e => { const sc = e.it.sc, xl = -sc.L / 2 + 0.05, xr = sc.L / 2 - 0.05, b = e.b, sh = (y) => b.f * (1 - 0.42 * Math.max(0, 1 - (b.y1 - y) / 0.17) ** 2);
    let pts; if (e.rim) pts = pbGrow(e.H, Math.max(0.01, Math.min(e.dL, e.dR)));
    else { const x0 = Math.max(xl, e.x0 - e.dL), x1 = Math.min(xr, e.x1 + e.dR); pts = pbRRect([[x0, e.y0 - O.d], [x1, e.y1 + O.d]], 0, O.rc); }
    pbLineInto(acc, sc, pts, -sc.D / 2 + 0.045 + 0.0015, O.w, [xl - 0.01, b.y0 + 0.006, xr + 0.01, b.y1 - 0.008], col, sh); n++; });
  if (!acc.P.length) return null; const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(acc.P, 3)); geo.setAttribute('color', new T.Float32BufferAttribute(acc.C, 3)); geo.computeBoundingSphere();
  const m = new T.Mesh(geo, new T.MeshBasicMaterial({ vertexColors: true, side: T.DoubleSide })); m.userData.pbOutline = true; out.par.add(m); return { mesh: m, parts: n, verts: acc.P.length / 3 }; };
// P6: a few generic J-hooks (one in every second band, in a free place: >= 5 cm off every part's outline, its coil >= 3 cm), dark graphite
// (a backplate, the rod out of the sheet, its tip turned up), every second one with a coiled hose or lead on it: one vertex-coloured mesh
const PBHOOK = { at: null, col: [0.16, 0.17, 0.19], coils: [[0.72, 0.13, 0.1], [0.13, 0.13, 0.14], [0.92, 0.7, 0.1], [0.16, 0.36, 0.72]], R: 0.068, r: 0.012 };
const pbHooks = (out) => { const byBay = out.secs.map(() => []); pbParts(out).forEach(it => { const H = pbPartXY(it); if (H) byBay[out.secs.indexOf(it.sc)].push(H); });
  const dist = (H, x, y) => { let inside = true, md = Infinity; for (let i = 0; i < H.length; i++) { const a = H[i], b = H[(i + 1) % H.length], ex = b[0] - a[0], ey = b[1] - a[1], L2 = ex * ex + ey * ey || 1;
      if (ex * (y - a[1]) - ey * (x - a[0]) < 0) inside = false; let t = ((x - a[0]) * ex + (y - a[1]) * ey) / L2; t = Math.max(0, Math.min(1, t)); md = Math.min(md, Math.hypot(x - a[0] - t * ex, y - a[1] - t * ey)); } return inside ? -md : md; };
  const geos = [], at = []; let nc = 0; out.par.updateMatrixWorld(true); const K = PBHOOK;
  out.secs.forEach((sc, k) => (sc.backs || []).forEach((bm, bi) => { const h = bm.geometry.parameters.height, y0 = bm.position.y - h / 2, y1 = bm.position.y + h / 2, cand = [];
    // (the best free place of the band: the most room round it among places the camera sees (the top board's or the next board's lip hides
    // the band's top 0.3 m from the first view); a coil where there is room for it, else a bare hook; one in every second band)
    if ((k + bi) % 2) return; let best = null; for (let x = -sc.L / 2 + 0.12; x <= sc.L / 2 - 0.12 + 1e-6; x += 0.04) for (let y = y0 + 0.16; y <= y1 - 0.3 + 1e-6; y += 0.03) {
      const cyc = y - (K.R - K.r) + 0.003, room = Math.min(...byBay[k].map(H => Math.min(dist(H, x, cyc), dist(H, x, y) + 0.04)), 9) - (cyc - K.R - K.r < y0 + 0.02 ? 9 : 0);
      if (!best || room > best.room + 1e-6) best = { x, y, room }; }
    for (const [x, y] of best && best.room >= 0.05 ? [[best.x, best.y]] : []) { const coil = best.room >= K.R + K.r + 0.03, cyc = y - (K.R - K.r) + 0.003; at.push([k, bi, +x.toFixed(3), +y.toFixed(3), coil, +best.room.toFixed(3)]);
      const zb = -sc.D / 2 + 0.045, M = new T.Matrix4().compose(sc.g.localToWorld(V(x, y, zb)), new T.Quaternion().setFromRotationMatrix(new T.Matrix4().extractRotation(sc.g.matrixWorld)), V(1, 1, 1)), pm = new T.Matrix4().copy(out.par.matrixWorld).invert().multiply(M);
      const add = (g, m, col) => { g.applyMatrix4(m); g.applyMatrix4(pm); const q = g.index ? g.toNonIndexed() : g; if (q !== g) g.dispose(); const n = q.attributes.position.count, C = new Float32Array(n * 3); for (let i = 0; i < n; i++) C.set(col, i * 3); q.setAttribute('color', new T.BufferAttribute(C, 3)); geos.push(q); };
      add(new T.BoxGeometry(0.026, 0.04, 0.005), new T.Matrix4().makeTranslation(0, -0.004, 0.0025), K.col);
      const rod = new T.CylinderGeometry(0.0045, 0.0045, 0.1, 6); rod.rotateX(Math.PI / 2); add(rod, new T.Matrix4().makeTranslation(0, 0, 0.05), K.col);
      const tip = new T.CylinderGeometry(0.0045, 0.0045, 0.035, 6); add(tip, new T.Matrix4().makeRotationX(-0.3).setPosition(0, 0.015, 0.1), K.col);
      if (coil) { add(new T.TorusGeometry(K.R, K.r, 6, 20), new T.Matrix4().makeTranslation(0, cyc - y, 0.065), K.coils[nc % K.coils.length]); nc++; } } }));
  if (!geos.length) return null; let nv = 0; geos.forEach(g => { nv += g.attributes.position.count; }); const P = new Float32Array(nv * 3), N = new Float32Array(nv * 3), C = new Float32Array(nv * 3); let o = 0;
  geos.forEach(g => { P.set(g.attributes.position.array, o * 3); N.set(g.attributes.normal.array, o * 3); C.set(g.attributes.color.array, o * 3); o += g.attributes.position.count; g.dispose(); });
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(P, 3)); geo.setAttribute('normal', new T.BufferAttribute(N, 3)); geo.setAttribute('color', new T.BufferAttribute(C, 3)); geo.computeBoundingSphere();
  const m = new T.Mesh(geo, new T.MeshPhongMaterial({ vertexColors: true, shininess: 40, specular: 0x333333 })); m.userData.pbHooks = true;   /* (no shadow pass for them: small) */ out.par.add(m); PBHOOK.at = at; return { mesh: m, hooks: at.length, coils: nc, verts: nv, at }; };
const pbExtras = (out) => { const v = RG.PB && PBV[RG.PB]; out.pb = { v: RG.PB || null, nm: v ? v.oz : null }; if (!v) return out.pb;
  if (v.outline) out.pb.outline = pbOutlines(out, v.outline); if (v.hooks) out.pb.hooks = pbHooks(out); return out.pb; };
// ---- THE LIFT (the game's single-post lift behind the car: garage3d.js buildLift / liftGeo / poseLift): its column, base and power unit
//      (the piece's one vertex-coloured mesh) and its carriage (the carriage's mesh) built anew in the same low-poly vertex colours, the same
//      materials (the piece's dissolve, the gloss), the same footprint (the base plate 1.12 × 0.635 m, the column 0.36 × 0.23 m about
//      (0, -1.72)) and inside zLiftObs's box; the arms and pads as the game's (the same vertices, their places and moves: poseLift moves the
//      new carriage as the old one). Built after W's colour (wLiftColour: its orange); the game's own geometry kept and put back first
//      (pbLiftOff), so W's recolouring always starts from the game's.
//      THE NEW LIFT: a bolted base flange on the yellow-and-black floor plate (6 bolts, gussets at the sides), the column with bevelled
//      edges (the chamfers a lighter paint: edge highlights), a paint chip or two, a few scuffs; a recessed slot down its inner face with
//      the safety-lock rack (sloped steel teeth) on one side and the lifting chain on the other, the zinc guide rails either side; a
//      bevelled cap, LOWER (PBL.top: the column's body top; was 2.98 m, the cap's top 3.085 m); at its foot on the back the power unit
//      (the oil tank (its oil level), the pump block with its red release lever, the motor with its cooling rings and fan cover, its
//      terminal box), the pressure hose into the column, the motor's lead down the plate, generic warning labels (a yellow triangle with
//      "!", the electric one with a bolt; no words); the controls on the side as the game's, the side plate a warning label; the carriage
//      as the game's (the same plate, crosshead, ribs, guides, latch and lever, pin bosses), its plate bevelled (lighter chamfers), six
//      bolt heads, a warning label instead of the blank plate ----
const PBL = { on: true, top: 2.77, cap: 0.042, S: 0.048, R: 0.045, plate: 0.78, type: 1 };   // (LF: type: the lift's design, 0 PB's as it was, 1..6 the six lifts of the LF block (LFT), 1 by default; top: the column's body top, its cap's top 5 cm over it (was 2.98 and 3.085); plate: the carriage's plate top over its foot (cy + plate; was 0.9): at the game's highest lift (1.35 m) the SAMUM's carriage (its pads' level 0.486 m) reaches 2.76 m, under the column's top)
const PBC = { ZN: [0.6, 0.62, 0.65], ZNt: [0.74, 0.76, 0.79], AR: [0.35, 0.37, 0.41], PL: [0.24, 0.25, 0.27], PLt: [0.29, 0.3, 0.32], BLK: [0.07, 0.07, 0.08], DK: [0.12, 0.12, 0.13],
  GR: [0.17, 0.18, 0.2], GRt: [0.23, 0.24, 0.26], CAP: [0.13, 0.135, 0.15], CAPe: [0.30, 0.31, 0.33], CAPt: [0.18, 0.19, 0.21], SLOT: [0.025, 0.027, 0.03], WALL: [0.07, 0.072, 0.08], WALLt: [0.16, 0.165, 0.18],
  CH0: [0.2, 0.205, 0.22], CH1: [0.3, 0.31, 0.33], PIN: [0.56, 0.58, 0.62], TOOTH: [0.4, 0.41, 0.44], TOOTHd: [0.14, 0.145, 0.16], RACK: [0.1, 0.105, 0.115],
  TANK: [0.76, 0.78, 0.8], TANKt: [0.84, 0.86, 0.88], OIL: [0.6, 0.53, 0.36], AL: [0.56, 0.58, 0.61], ALt: [0.66, 0.68, 0.71], MOT: [0.25, 0.27, 0.31], MOTd: [0.15, 0.16, 0.19], RED: [0.72, 0.1, 0.08],
  WHITE: [0.86, 0.87, 0.85], CHIP: [0.52, 0.54, 0.58], YL: [0.92, 0.7, 0.1], STAIN: [0.13, 0.13, 0.14], GRN: [0.12, 0.55, 0.22] };
const PBGL = { MATTE: 0.15, PAINT: 1, PLATE: 1.3, METAL: 2.2 };
const pbGB = () => { const g = new World.GB(); g.glL = []; return g; };
const pbGl = (g, k) => g.glL.push([g.P.length / 3, k]);
const pbGlArr = (g) => { const n = g.P.length / 3, gl = new Float32Array(n).fill(1); g.glL.forEach(([i, k], j) => gl.fill(k, i, j + 1 < g.glL.length ? g.glL[j + 1][0] : n)); return gl; };
const pbBox = (g, cx, cy, cz, sx, sy, sz, col, top, noBottom) => World.box(g, cx, cy, cz, sx, sy, sz, 0, col, top || col, noBottom);
const pbObox = (g, a, b, w, h, col) => { const d = V(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length(); if (L < 1e-4) return; d.divideScalar(L);
  const up = Math.abs(d.y) > 0.95 ? V(1, 0, 0) : V(0, 1, 0), sd = V().crossVectors(d, up).normalize().multiplyScalar(w / 2), u = V().crossVectors(sd, d).normalize().multiplyScalar(h / 2);
  const P = (e, i, j) => { const o = e ? b : a; return [o[0] + sd.x * i + u.x * j, o[1] + sd.y * i + u.y * j, o[2] + sd.z * i + u.z * j]; }, c = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], q = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  for (let k = 0; k < 4; k++) { const [i0, j0] = q[k], [i1, j1] = q[(k + 1) % 4]; g.quadO(P(0, i0, j0), P(0, i1, j1), P(1, i1, j1), P(1, i0, j0), col, c); }
  g.quadO(P(0, -1, -1), P(0, 1, -1), P(0, 1, 1), P(0, -1, 1), col, c); g.quadO(P(1, -1, -1), P(1, 1, -1), P(1, 1, 1), P(1, -1, 1), col, c); };
const pbCyl = (g, c, axis, r, len, n, col, cap, a0 = 0) => { const A = (t, a, rr) => { const u = Math.cos(a) * rr, v = Math.sin(a) * rr; return axis === 'x' ? [c[0] + t, c[1] + u, c[2] + v] : axis === 'y' ? [c[0] + u, c[1] + t, c[2] + v] : [c[0] + u, c[1] + v, c[2] + t]; };
  for (let i = 0; i < n; i++) { const p0 = a0 + i / n * 2 * Math.PI, p1 = a0 + (i + 1) / n * 2 * Math.PI; g.quadO(A(-len / 2, p0, r), A(len / 2, p0, r), A(len / 2, p1, r), A(-len / 2, p1, r), col, c);
    for (const e of [-1, 1]) g.triO(A(e * len / 2, 0, 0), A(e * len / 2, p0, r), A(e * len / 2, p1, r), cap || col, A(-e * len, 0, 0)); } };
const pbAddGeo = (g, geo, col) => { const q = geo.index ? geo.toNonIndexed() : geo, P = q.attributes.position.array, N = q.attributes.normal.array;
  for (let i = 0; i < P.length; i += 9) g.triN([P[i], P[i + 1], P[i + 2]], [P[i + 3], P[i + 4], P[i + 5]], [P[i + 6], P[i + 7], P[i + 8]], [N[i], N[i + 1], N[i + 2]], [N[i + 3], N[i + 4], N[i + 5]], [N[i + 6], N[i + 7], N[i + 8]], col, col, col);
  geo.dispose(); if (q !== geo) q.dispose(); };
const pbTube = (g, pts, r, col, n = 16, rad = 6) => pbAddGeo(g, new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(p => V(p[0], p[1], p[2]))), n, r, rad, false), col);
// an upright prism round (cx, cz) (half sizes hx, hz, its upright edges cut by ch) from y0 to y1; cols: one colour or one a face (0 the
// front +z, 1 its left chamfer, 2 the left side, 3, 4 the back, 5, 6 the right side, 7 the front's right chamfer); top (null: open); skip faces
const pbPrism = (g, cx, cz, hx, hz, ch, y0, y1, cols, top, skip) => { const q = [[hx - ch, hz], [-hx + ch, hz], [-hx, hz - ch], [-hx, -hz + ch], [-hx + ch, -hz], [hx - ch, -hz], [hx, -hz + ch], [hx, hz - ch]], c = [cx, (y0 + y1) / 2, cz], P = (i, y) => [cx + q[i % 8][0], y, cz + q[i % 8][1]];
  for (let i = 0; i < 8; i++) if (!skip || !skip.includes(i)) g.quadO(P(i, y0), P(i + 1, y0), P(i + 1, y1), P(i, y1), Array.isArray(cols[0]) ? cols[i] : cols, c);
  if (top) for (let i = 1; i < 7; i++) g.triO(P(0, y1), P(i, y1), P(i + 1, y1), top, c); };
// the game's yellow-and-black stripes (garage3d.js hazard): from corner o along u (w) and v (h), the yellow ones over black
const pbHazard = (g, o, u, v, w, h, pitch, inside) => { const P = (a, b) => [o[0] + u[0] * a + v[0] * b, o[1] + u[1] * a + v[1] * b, o[2] + u[2] * a + v[2] * b];
  const clip = (pts, x0, sg) => { const out = []; for (let j = 0; j < pts.length; j++) { const a = pts[j], b = pts[(j + 1) % pts.length], ia = sg * (a[0] - x0) >= 0, ib = sg * (b[0] - x0) >= 0;
      if (ia) out.push(a); if (ia !== ib) out.push([x0, a[1] + (b[1] - a[1]) * (x0 - a[0]) / (b[0] - a[0])]); } return out; };
  for (let i = -Math.ceil(h / pitch) - 1; i * pitch < w; i++) { if (i & 1) continue; const q = clip(clip([[i * pitch, 0], [(i + 1) * pitch, 0], [(i + 1) * pitch + h, h], [i * pitch + h, h]], 0, 1), w, -1);
    for (let j = 1; j + 1 < q.length; j++) g.triO(P(...q[0]), P(...q[j]), P(...q[j + 1]), PBC.YL, inside); } };
// a generic warning label on a face (no words): centre c, right u, up v (unit, in the face), side s: a black triangle, a yellow one in it, the
// symbol ('!' or 'bolt') in black; each layer 0.6 mm further out of the face (n = u × v)
const pbSign = (g, c, u, v, s, kind = '!') => { const n = V(...u).cross(V(...v)).toArray(), h = s * Math.sqrt(3) / 2;
  const P = (x, y, k) => [c[0] + u[0] * x + v[0] * y + n[0] * k, c[1] + u[1] * x + v[1] * y + n[1] * k, c[2] + u[2] * x + v[2] * y + n[2] * k], ins = [c[0] - n[0] * 0.05, c[1] - n[1] * 0.05, c[2] - n[2] * 0.05];
  const tri = (sc, k, col) => g.triO(P(0, h * 2 / 3 * sc, k), P(-s / 2 * sc, -h / 3 * sc, k), P(s / 2 * sc, -h / 3 * sc, k), col, ins);
  const quad = (x0, y0, x1, y1, k, col) => g.quadO(P(x0, y0, k), P(x1, y0, k), P(x1, y1, k), P(x0, y1, k), col, ins);
  tri(1, 0.0006, PBC.BLK); tri(0.78, 0.0012, PBC.YL);
  if (kind === '!') { quad(-0.042 * s, -0.04 * s, 0.042 * s, 0.27 * s, 0.0018, PBC.BLK); quad(-0.045 * s, -0.17 * s, 0.045 * s, -0.085 * s, 0.0018, PBC.BLK); }
  else { const z = [[0.06, 0.3], [-0.1, 0.0], [0.0, 0.0], [-0.06, -0.2], [0.11, 0.06], [0.01, 0.06]].map(([x, y]) => [x * s, y * s]);
    g.triO(P(...z[0], 0.0018), P(...z[1], 0.0018), P(...z[5], 0.0018), PBC.BLK, ins); g.triO(P(...z[1], 0.0018), P(...z[2], 0.0018), P(...z[5], 0.0018), PBC.BLK, ins);
    g.triO(P(...z[2], 0.0018), P(...z[4], 0.0018), P(...z[5], 0.0018), PBC.BLK, ins); g.triO(P(...z[2], 0.0018), P(...z[3], 0.0018), P(...z[4], 0.0018), PBC.BLK, ins); } };
// the lift's paint by W's variant (its colour at the game's blue's brightness: wLiftColour's way): the face, the top faces, the ribs, the
// edge highlights (the bevels), the scuffs; null: the game's blue
const pbPaint = (v) => { const V0 = v && WLIFT[v], LBL = [0.08, 0.22, 0.58], LBLd = [0.05, 0.14, 0.4];
  const base = V0 ? new T.Color(V0.c) : new T.Color(...LBL), rib = V0 ? new T.Color(V0.rib) : new T.Color(...LBLd), k = (C, f) => [Math.min(1, C.r * f), Math.min(1, C.g * f), Math.min(1, C.b * f)];
  const mix = (a, b, t) => a.map((x, i) => x * (1 - t) + b[i] * t), OR = k(base, 1);
  return { OR, ORt: k(base, 0.69 / 0.58), RIB: k(rib, 1), HI: mix(OR, [1, 0.93, 0.82], 0.22), HI2: mix(OR, [1, 0.93, 0.82], 0.1), SC: mix(OR, [0.22, 0.17, 0.12], 0.22), DKO: k(base, 0.86) }; };
// the column, its base and its power unit: one geometry in world metres (the piece's mesh), as the game's piece (the low 0.4 m darker)
const pbColumnGeo = (O) => { const L = D.LIFT, g = pbGB(), X = L.x, Z = L.z, HZ = L.hz, HX = 0.18, CHF = 0.025, zf = Z + HZ, zb = Z - HZ, xs = X + HX, TOP = PBL.top, S = PBL.S, R = PBL.R, C = PBC;
  // the floor plate (the game's: tread, black edges, the yellow stripes, six anchor bolts); a dark oil stain by the power unit
  const pz0 = zf, pz1 = -2.24, pzc = (pz0 + pz1) / 2, pd = pz0 - pz1, ps = pd - 0.14;
  pbGl(g, PBGL.PLATE); pbBox(g, X, 0, pzc, 1.12, 0.012, pd, C.PL, C.PLt);
  pbGl(g, PBGL.PAINT); for (const [bx, bz, sx, sz] of [[X, pz0 - 0.035, 1.12, 0.07], [X, pz1 + 0.035, 1.12, 0.07], [X - 0.525, pzc, 0.07, ps], [X + 0.525, pzc, 0.07, ps]]) pbBox(g, bx, 0.012, bz, sx, 0.0015, sz, C.BLK);
  const yt = 0.015, ins = [X, -1, pzc]; pbHazard(g, [X - 0.56, yt, pz0], [1, 0, 0], [0, 0, -1], 1.12, 0.07, 0.07, ins); pbHazard(g, [X + 0.56, yt, pz1], [-1, 0, 0], [0, 0, 1], 1.12, 0.07, 0.07, ins);
  pbHazard(g, [X - 0.56, yt, pz1 + 0.07], [0, 0, 1], [1, 0, 0], ps, 0.07, 0.07, ins); pbHazard(g, [X + 0.56, yt, pz0 - 0.07], [0, 0, -1], [-1, 0, 0], ps, 0.07, 0.07, ins);
  g.quadO([X - 0.05, 0.0128, -1.9], [X + 0.2, 0.0128, -1.93], [X + 0.25, 0.0128, -2.1], [X - 0.02, 0.0128, -2.12], C.STAIN, [X, -1, -2]);
  pbGl(g, PBGL.METAL); for (const [bx, bz] of [[-0.4, -1.71], [0.4, -1.71], [-0.4, -2.12], [0.4, -2.12], [-0.13, -2.15], [0.33, -2.15]]) { pbCyl(g, [X + bx, 0.016, bz], 'y', 0.026, 0.004, 8, C.AR); pbCyl(g, [X + bx, 0.022, bz], 'y', 0.02, 0.012, 6, C.ZN, C.ZNt); }
  // the base flange (dark steel, not in front of the column: the stowed rear arms pass 1.75 cm before its face), its six bolts, the gussets
  const fy0 = 0.012, fy1 = 0.034, fz0 = zb - 0.012, fz1 = zf - 0.004; pbGl(g, PBGL.PAINT); pbBox(g, X, fy0, (fz0 + fz1) / 2, 0.48, fy1 - fy0, fz1 - fz0, C.GR, C.GRt);
  pbGl(g, PBGL.METAL); for (const [bx, bz] of [[-0.212, Z - 0.075], [0.212, Z - 0.075], [-0.212, Z + 0.07], [0.212, Z + 0.07], [-0.11, fz0 + 0.0], [0.11, fz0 + 0.0]]) { if (bz < zb) continue; pbCyl(g, [X + bx, fy1 + 0.007, bz], 'y', 0.016, 0.014, 6, C.ZN, C.ZNt); }
  pbGl(g, PBGL.PAINT); for (const sx of [-1, 1]) for (const dz of [-0.06, 0.06]) { const x0 = X + sx * HX, x1 = X + sx * (HX + 0.052), y0 = fy1, y1 = 0.21;
    for (const zz of [Z + dz - 0.006, Z + dz + 0.006]) g.triO([x0, y0, zz], [x1, y0, zz], [x0, y1, zz], O.DKO, [x0, y0 + 0.03, Z + dz]);
    g.quadO([x1, y0, Z + dz - 0.006], [x1, y0, Z + dz + 0.006], [x0, y1, Z + dz + 0.006], [x0, y1, Z + dz - 0.006], O.HI2, [x0, y0, Z + dz]); }
  // the column's foot in black and yellow (the game's band), from the flange up to 0.24 m
  pbPrism(g, X, Z, HX, HZ, CHF, fy1, 0.24, C.BLK);
  pbHazard(g, [X - 0.155, fy1, zf + 0.003], [1, 0, 0], [0, 1, 0], 0.31, 0.24 - fy1, 0.075, [X, 0.1, Z]); pbHazard(g, [X + 0.155, fy1, zb - 0.003], [-1, 0, 0], [0, 1, 0], 0.31, 0.24 - fy1, 0.075, [X, 0.1, Z]);
  pbHazard(g, [xs + 0.003, fy1, zf - 0.025], [0, 0, -1], [0, 1, 0], 2 * HZ - 0.05, 0.24 - fy1, 0.075, [X, 0.1, Z]); pbHazard(g, [X - HX - 0.003, fy1, zb + 0.025], [0, 0, 1], [0, 1, 0], 2 * HZ - 0.05, 0.24 - fy1, 0.075, [X, 0.1, Z]);
  // the column: its sides and back, the bevels a lighter paint (the front ones lightest: they catch the room's light); the front face round the slot
  const y0 = 0.24, ys0 = 0.30, ys1 = TOP - 0.1;
  pbPrism(g, X, Z, HX, HZ, CHF, y0, TOP, [O.OR, O.HI, O.OR, O.HI2, O.OR, O.HI2, O.OR, O.HI], null, [0]);
  const fq = (x0, x1, a, b, col) => g.quadO([X + x0, a, zf], [X + x1, a, zf], [X + x1, b, zf], [X + x0, b, zf], col, [X, (a + b) / 2, Z]);
  fq(-HX + CHF, -S, y0, TOP, O.OR); fq(S, HX - CHF, y0, TOP, O.OR); fq(-S, S, y0, ys0, O.OR); fq(-S, S, ys1, TOP, O.OR);
  // the slot (R deep): its walls dark, its floor and roof, its back black
  const zr = zf - R; g.quadO([X - S, ys0, zf], [X - S, ys0, zr], [X - S, ys1, zr], [X - S, ys1, zf], C.WALL, [X - S - 0.05, ys0, zr]); g.quadO([X + S, ys0, zf], [X + S, ys0, zr], [X + S, ys1, zr], [X + S, ys1, zf], C.WALL, [X + S + 0.05, ys0, zr]);
  g.quadO([X - S, ys0, zf], [X + S, ys0, zf], [X + S, ys0, zr], [X - S, ys0, zr], C.WALLt, [X, ys0 - 0.05, zr]); g.quadO([X - S, ys1, zf], [X + S, ys1, zf], [X + S, ys1, zr], [X - S, ys1, zr], C.WALL, [X, ys1 + 0.05, zr]);
  g.quadO([X - S, ys0, zr], [X + S, ys0, zr], [X + S, ys1, zr], [X - S, ys1, zr], C.SLOT, [X, ys0, zr - 0.05]);
  // in the slot: the safety-lock rack (left: a steel strip, sloped teeth every 5.5 cm, lit on their slopes) and the lifting chain (right:
  // its plates in two shades, the pins lighter)
  pbGl(g, PBGL.PAINT); const rx0 = X - S + 0.006, rx1 = X - 0.006, rz = zr + 0.008; pbBox(g, (rx0 + rx1) / 2, ys0, zr + 0.004, rx1 - rx0, ys1 - ys0, 0.008, C.RACK, C.RACK, true);
  for (let y = ys0 + 0.05; y < ys1 - 0.06; y += 0.055) { const A = (x) => [x, y, rz], Bp = (x) => [x, y, rz + 0.018], Cp = (x) => [x, y + 0.03, rz], c = [(rx0 + rx1) / 2, y + 0.01, rz + 0.005];
    g.quadO(A(rx0), A(rx1), Bp(rx1), Bp(rx0), C.TOOTHd, c); g.quadO(Bp(rx0), Bp(rx1), Cp(rx1), Cp(rx0), C.TOOTH, c); g.triO(A(rx0), Bp(rx0), Cp(rx0), C.TOOTHd, c); g.triO(A(rx1), Bp(rx1), Cp(rx1), C.TOOTHd, c); }
  const cz = zr + 0.02; for (let y = ys0 + 0.01, i = 0; y < ys1 - 0.06; y += 0.05, i++) { const w = i & 1 ? 0.013 : 0.018, cx = X + 0.0255, col = i & 1 ? C.CH1 : C.CH0, c = [cx, y + 0.025, cz - 0.01];
    g.quadO([cx - w, y, cz], [cx + w, y, cz], [cx + w, y + 0.05, cz], [cx - w, y + 0.05, cz], col, c); g.quadO([cx - w, y, cz], [cx - w, y, cz - 0.012], [cx - w, y + 0.05, cz - 0.012], [cx - w, y + 0.05, cz], C.CH0, c);
    g.quadO([cx + w, y, cz], [cx + w, y, cz - 0.012], [cx + w, y + 0.05, cz - 0.012], [cx + w, y + 0.05, cz], C.CH0, c);
    for (const px of [-0.009, 0.009]) g.quadO([cx + px - 0.004, y - 0.004, cz + 0.0008], [cx + px + 0.004, y - 0.004, cz + 0.0008], [cx + px + 0.004, y + 0.004, cz + 0.0008], [cx + px - 0.004, y + 0.004, cz + 0.0008], C.PIN, c); }
  // the zinc guide rails either side of the slot (a little proud of the face, their inner edges lit)
  for (const s of [-1, 1]) { const xa = X + s * S, xb = X + s * (S + 0.03), x0 = Math.min(xa, xb), x1 = Math.max(xa, xb); pbBox(g, (x0 + x1) / 2, ys0 - 0.02, zf + 0.004, 0.03, ys1 - ys0 + 0.06, 0.008, C.ZN, C.ZNt);
    g.quadO([xa + s * 0.0005, ys0 - 0.02, zf + 0.0081], [xa + s * 0.006, ys0 - 0.02, zf + 0.0081], [xa + s * 0.006, ys1 + 0.04, zf + 0.0081], [xa + s * 0.0005, ys1 + 0.04, zf + 0.0081], C.ZNt, [xa, ys0, zf]); }
  // wear: paint chips on the front bevels, a few darker scuffs on the face beside the rails
  pbGl(g, PBGL.METAL); const chamf = (sx, y, h) => { const a = [X + sx * (HX - CHF), y, zf], b = [X + sx * HX, y, zf - CHF], n = [sx * 0.7071 * 0.0008, 0, 0.7071 * 0.0008], t = 0.35, a1 = [a[0] + (b[0] - a[0]) * t, 0, a[2] + (b[2] - a[2]) * t], b1 = [a[0] + (b[0] - a[0]) * (t + 0.4), 0, a[2] + (b[2] - a[2]) * (t + 0.4)];
    g.quadO([a1[0] + n[0], y, a1[2] + n[2]], [b1[0] + n[0], y, b1[2] + n[2]], [b1[0] + n[0], y + h, b1[2] + n[2]], [a1[0] + n[0], y + h, a1[2] + n[2]], C.CHIP, [X, y, Z]); };
  chamf(-1, 0.71, 0.014); chamf(-1, 1.43, 0.009); chamf(1, 0.93, 0.012); chamf(1, 1.86, 0.008); chamf(-1, 2.31, 0.01);
  pbGl(g, PBGL.PAINT); for (const [x, y, w, h] of [[0.105, 0.42, 0.022, 0.3], [-0.115, 0.55, 0.016, 0.22], [0.125, 1.15, 0.012, 0.16], [-0.1, 1.62, 0.014, 0.12]]) g.quadO([X + x - w / 2, y, zf + 0.0006], [X + x + w / 2, y, zf + 0.0006], [X + x + w / 2, y + h, zf + 0.0006], [X + x - w / 2, y + h, zf + 0.0006], O.SC, [X, y, Z]);
  // the cap: a dark plate a little wider than the column, its top bevelled (the bevels lit), four bolts on it
  const c0 = TOP, c1 = TOP + 0.022, c2 = TOP + PBL.cap, cw = 0.2, cd = 0.135, iw = 0.175, id = 0.11; pbBox(g, X, c0, Z, 2 * cw, c1 - c0, 2 * cd, C.CAP, C.CAP);
  const cq = [[cw, cd, iw, id], [-cw, cd, -iw, id], [-cw, -cd, -iw, -id], [cw, -cd, iw, -id]];
  for (let i = 0; i < 4; i++) { const [ax, az, aix, aiz] = cq[i], [bx2, bz2, bix, biz] = cq[(i + 1) % 4]; g.quadO([X + ax, c1, Z + az], [X + bx2, c1, Z + bz2], [X + bix, c2, Z + biz], [X + aix, c2, Z + aiz], C.CAPe, [X, c0, Z]); }
  g.quadO([X - iw, c2, Z - id], [X + iw, c2, Z - id], [X + iw, c2, Z + id], [X - iw, c2, Z + id], C.CAPt, [X, c0, Z]);
  pbGl(g, PBGL.METAL); for (const [bx, bz] of [[-0.12, -0.065], [0.12, -0.065], [-0.12, 0.065], [0.12, 0.065]]) pbCyl(g, [X + bx, c2 + 0.004, Z + bz], 'y', 0.011, 0.008, 6, C.AR, C.ZN);
  // the side (+x): the controls as the game's (up, down, the red stop on yellow), the side plate a warning label
  pbGl(g, PBGL.PAINT); pbBox(g, xs + 0.03, 0.98, Z - 0.035, 0.06, 0.24, 0.15, [0.15, 0.16, 0.18]);
  pbBox(g, xs + 0.061, 1.14, Z, 0.004, 0.04, 0.04, C.GRN); pbBox(g, xs + 0.061, 1.08, Z, 0.004, 0.04, 0.04, [0.06, 0.06, 0.07]);
  pbCyl(g, [xs + 0.064, 1.1, Z - 0.075], 'x', 0.032, 0.008, 12, C.YL); pbCyl(g, [xs + 0.078, 1.1, Z - 0.075], 'x', 0.021, 0.022, 10, [0.72, 0.1, 0.08]);
  pbBox(g, xs + 0.002, 1.40, Z, 0.006, 0.17, 0.13, C.WHITE); pbSign(g, [xs + 0.005, 1.478, Z], [0, 0, -1], [0, 1, 0], 0.1, '!');
  // the power unit at the foot, on the back: its plate on the column, the oil tank (the oil's level), the pump block and its red release
  // lever, the motor (its cooling rings, the fan cover on top, the terminal box with the electric label), the pressure hose into the column,
  // the motor's lead down to the plate and away to the wall; the warning label on the tank's side
  pbBox(g, X, fy1, zb - 0.004, 0.3, 0.58, 0.008, C.DK);
  pbGl(g, PBGL.PLATE); const tx0 = X - 0.13, tx1 = X + 0.11, tz0 = -2.015, tz1 = -1.855, txc = (tx0 + tx1) / 2, tzc = (tz0 + tz1) / 2; pbBox(g, txc, 0.012, tzc, tx1 - tx0, 0.19, tz1 - tz0, C.OIL, C.OIL); pbBox(g, txc, 0.202, tzc, tx1 - tx0, 0.1, tz1 - tz0, C.TANK, C.TANKt);
  pbGl(g, PBGL.MATTE); pbCyl(g, [X - 0.08, 0.312, -1.975], 'y', 0.022, 0.02, 8, C.BLK);
  pbGl(g, PBGL.METAL); pbBox(g, X + 0.03, 0.302, -1.935, 0.13, 0.07, 0.11, C.AL, C.ALt);
  pbGl(g, PBGL.PAINT); pbObox(g, [X + 0.095, 0.345, -1.905], [X + 0.16, 0.322, -1.905], 0.012, 0.012, C.RED); pbCyl(g, [X + 0.165, 0.32, -1.905], 'x', 0.012, 0.022, 8, C.RED);
  pbCyl(g, [X + 0.03, 0.492, -1.935], 'y', 0.068, 0.236, 14, C.MOT, C.MOTd); for (const y of [0.41, 0.45, 0.49, 0.53, 0.57]) pbCyl(g, [X + 0.03, y, -1.935], 'y', 0.0715, 0.008, 14, C.MOTd);
  pbGl(g, PBGL.MATTE); pbCyl(g, [X + 0.03, 0.625, -1.935], 'y', 0.071, 0.026, 14, C.BLK, [0.2, 0.21, 0.22]);
  pbGl(g, PBGL.PAINT); pbBox(g, X + 0.112, 0.455, -1.935, 0.03, 0.085, 0.065, C.MOT, C.MOT); pbSign(g, [X + 0.1272, 0.497, -1.935], [0, 0, -1], [0, 1, 0], 0.052, 'bolt');
  pbSign(g, [tx1 + 0.0003, 0.17, tzc], [0, 0, -1], [0, 1, 0], 0.09, '!');
  pbGl(g, PBGL.MATTE); pbTube(g, [[X + 0.06, 0.37, -1.905], [X + 0.075, 0.43, -1.875], [X + 0.08, 0.475, -1.852], [X + 0.08, 0.5, zb - 0.012]], 0.011, C.BLK, 10, 6);
  pbTube(g, [[X + 0.127, 0.47, -1.94], [X + 0.135, 0.43, -1.99], [X + 0.125, 0.3, -2.032], [X + 0.11, 0.06, -2.04], [X + 0.09, 0.02, -2.1], [X + 0.05, 0.019, -2.3]], 0.007, C.BLK, 18, 5);
  pbGl(g, PBGL.METAL); pbCyl(g, [X + 0.08, 0.5, zb - 0.01], 'z', 0.017, 0.02, 8, C.ZN); pbCyl(g, [X + 0.06, 0.38, -1.905], 'y', 0.016, 0.018, 8, C.ZN);
  const geo = g.geometry(), gl = pbGlArr(g); geo.setAttribute('gloss', new T.BufferAttribute(gl, 1));
  const Pp = geo.attributes.position, Cc = geo.attributes.color; for (let i = 0; i < Pp.count; i++) { const y = Pp.getY(i); if (y < 0.4) { const t = Math.min(1, Math.max(0, y / 0.4)), a = 0.5 + 0.5 * t * t * (3 - 2 * t); Cc.setXYZ(i, Cc.getX(i) * a, Cc.getY(i) * a, Cc.getZ(i) * a); } }
  geo.computeBoundingSphere(); return geo; };
// the carriage (liftGeo's carriage: its level 0 the carriage's lowest, x and z in the world, as the game builds it) in the new paint: P N C gl
const pbCarriage = (O) => { const L = D.LIFT, g = pbGB(), cy = L.du + D.PAD.h + 0.02 + 0.0135, zf = L.z + L.hz, C = PBC;
  const ph = PBL.plate; pbGl(g, PBGL.PAINT); pbPrism(g, 0, zf + 0.028, 0.205, 0.026, 0.012, cy + 0.075, cy + ph, [O.OR, O.HI, O.OR, O.HI2, O.OR, O.HI2, O.OR, O.HI], O.ORt);
  World.box(g, 0, cy, (zf - 1.39) / 2, 1.4, 0.075, -1.392 - zf, 0, O.OR, O.ORt);
  World.box(g, 0, cy + 0.075, zf + 0.079, 0.3, 0.13, 0.05, 0, O.OR, O.ORt);
  for (const y of [0.26, 0.56]) World.box(g, 0, cy + y, zf + 0.058, 0.38, 0.04, 0.008, 0, O.RIB, O.OR);
  pbSign(g, [0.1, cy + 0.425, zf + 0.054], [1, 0, 0], [0, 1, 0], 0.085, '!');
  g.quadO([-0.7, cy + 0.0755, zf - 0.02], [0.7, cy + 0.0755, zf - 0.02], [0.7, cy + 0.0755, -1.392], [-0.7, cy + 0.0755, -1.392], O.HI, [0, cy, -1.5]);   // (the crosshead's top edge lit: a thin lighter face over it)
  pbGl(g, PBGL.METAL); for (const sx of [-1, 1]) World.box(g, sx * 0.2, cy + 0.11, zf - 0.02, 0.016, ph - 0.14, 0.1, 0, C.ZN);
  for (const [bx, by] of [[-0.17, 0.14], [0.17, 0.14], [-0.17, 0.42], [0.17, 0.42], [-0.17, ph - 0.045], [0.17, ph - 0.045]]) pbCyl(g, [bx, cy + by, zf + 0.058], 'z', 0.011, 0.008, 6, C.AR, C.ZN);
  const ly = ph - 0.14; World.box(g, 0, cy + ly, zf + 0.069, 0.1, 0.09, 0.03, 0, C.AR); World.box(g, 0.055, cy + ly - 0.03, zf + 0.087, 0.012, 0.012, 0.012, 0, C.ZN); pbObox(g, [0.05, cy + ly + 0.03, zf + 0.09], [0.15, cy + ly + 0.07, zf + 0.09], 0.016, 0.01, [0.72, 0.12, 0.09]);   // (the lock's latch and its lever under the plate's top, as the game's)
  for (const i of [0, 2]) { const [px, pz] = L.arms[i].p; pbCyl(g, [px, (0.0225 + cy) / 2, pz], 'y', 0.024, cy - 0.0225, 8, C.ZN); pbCyl(g, [px, cy + 0.11, pz], 'y', 0.048, 0.07, 12, C.ZN, [0.4, 0.42, 0.45]); }
  return { P: g.P, N: g.N, C: g.C, gl: pbGlArr(g), n: g.P.length / 3 }; };
// ==== LF: SIX LIFTS (agent LF; the user: "Izboljšaj grafiko dvigala, dodaj še različna dvigala."): PBL.type picks the lift's design
//      (0: PB's lift as it was (pbColumnGeo, pbCarriage, the game's arms); 1..6 the six below; default 1). Every design keeps the game's
//      lift: the same place behind the car (the column round (0, -1.72), its face z -1.605: the stowed arms pass before it), the same arms'
//      pins, moves and pads' height (the arms built anew in the game's own way: liftGeo's tags arm / kd / kp / kr, so poseLift moves them as
//      the game's; the cups r 6.2 cm: the lane 1.38 m), the carriage moved by poseLift (its vertices up by L.c; nothing of it nearer the car
//      than the game's crosshead, z -1.392), the column's piece (its dissolve, its gloss); the robots' box zLiftObs (0.54 × 3.1 × 0.48 at
//      (0.03, 1.55, -1.80)) holds every column. One merged mesh each: the column (with its base and power unit), the carriage, the arms
//      (the game's three); designs 4 and 6 a fourth: their LED line (additive, the piece's dissolve). At the game's highest lift (1.35 m,
//      the SAMUM: its carriage up by 1.836 m) each carriage stays under its column's top (LFT[k].ph: the carriage plate's height).
//   1 PB's lift refined: cleaner bevels (no chips, scuffs or stain), a chrome hydraulic ram in the track (the carriage rides on it: its
//     bushing), the lock rack beside it, the arms' pads ribbed rubber in yellow cups, a cable chain from the power unit up to a small
//     control box (up, down with arrows, the red stop on yellow, a key, a lamp), yellow and black on the base flange's edges
//   2 TELESKOPSKI: a round three-stage telescopic column (an orange foot stage, a chrome stage with an orange collar, the chrome ram)
//     with the carriage ON TOP: a head on the ram, a fork plate from it down to the arms' yoke. Low at rest (the head's top 1.25 m); the
//     ram (in the carriage's mesh: it rises with it) runs out to 3.05 m at the SAMUM's 1.35 m (its foot then 12 cm inside the chrome
//     stage; at rest the ram's lower part lies under the floor: the floor hides it, its mirror is cut at the floor)
//   3 INDUSTRIJSKI: a heavy box-section column (0.40 × 0.315 m) with stiffener bands, a wide track with the lock ladder (zinc rails and
//     steel rungs), a counterweight housing on its back (its bolted cover, its window), bolted gussets at its foot, hazard stripes on the
//     foot, the flange, the housing and the carriage's crosshead
//   4 ELEGANTEN RAZSTAVNI: a slim rounded white column with orange lines, a soft warm LED line along its track, a rounded white plinth
//     that hides the power unit, a slim touch panel; an orange rounded carriage with white bands, white arms
//   5 DVOJNI STEBER ZADAJ: two slim orange columns side by side (0.12 × 0.18 m each, 0.34 m apart) on one base, a cross beam on top, a
//     tie at their backs, the carriage between them (its shoes in the columns' tracks); the power unit behind
//   6 STENSKA KONZOLA: a dark graphite column tapering up from a heavy faceted plinth (the power unit in it), an orange LED line in its
//     track, and a large faceted orange boom (the carriage) that carries the arms; graphite arms with orange cups ----
const LFC = { CHR: [0.8, 0.82, 0.85], CHRt: [0.92, 0.93, 0.95], CHRd: [0.46, 0.48, 0.52], WH: [0.85, 0.86, 0.87], WHt: [0.93, 0.94, 0.95], WHs: [0.72, 0.73, 0.75], WHd: [0.6, 0.61, 0.63],
  GP: [0.13, 0.14, 0.16], GPt: [0.2, 0.21, 0.24], GPe: [0.34, 0.35, 0.39], SAT: [0.6, 0.62, 0.65], SATt: [0.7, 0.72, 0.75], RUB: [0.075, 0.075, 0.08], RUBt: [0.15, 0.15, 0.16],
  GLASS: [0.05, 0.06, 0.08], LED: [1.3, 1.08, 0.78], LEDo: [1.45, 0.62, 0.14], LEDg: [0.2, 1.1, 0.35], LEDr: [1.3, 0.15, 0.1], LEDw: [1.1, 1.1, 1.1] };
const LFGL = { CHROME: 2.8, SATIN: 1.6 };
const lfMix = (a, b, t) => a.map((x, i) => x * (1 - t) + b[i] * t);
// a smooth upright cylinder round (cx, cz) from y0 to y1 (n sides, round shading; col at its foot, colTop at its top), its top capped (top: colour)
const lfCylY = (g, cx, cz, r, y0, y1, n, col, top, colTop) => { const P = (a, y) => [cx + Math.cos(a) * r, y, cz + Math.sin(a) * r], N = (a) => [Math.cos(a), 0, Math.sin(a)], ins = [cx, (y0 + y1) / 2, cz], ct = colTop || col;
  for (let i = 0; i < n; i++) { const a0 = i / n * 2 * Math.PI, a1 = (i + 1) / n * 2 * Math.PI; g.quadON(P(a0, y0), P(a1, y0), P(a1, y1), P(a0, y1), N(a0), N(a1), N(a1), N(a0), ins, col, col, ct, ct);
    if (top) g.triO([cx, y1, cz], P(a0, y1), P(a1, y1), top, [cx, y1 - 1, cz]); } };
// an outline round (cx, cz): a rectangle 2 hx × 2 hz, its front corners (+z) rounded by rf, its back ones by rb (n segments a corner); [x, z] points
const lfOutline = (cx, cz, hx, hz, rf, rb, n) => { const out = [], arc = (ox, oz, r, a0) => { for (let i = 0; i <= n; i++) { const a = a0 + i / n * Math.PI / 2, p = [ox + Math.cos(a) * r, oz + Math.sin(a) * r]; const q = out[out.length - 1]; if (!q || Math.hypot(q[0] - p[0], q[1] - p[1]) > 1e-5) out.push(p); } };
  arc(cx + hx - rf, cz + hz - rf, rf, 0); arc(cx - hx + rf, cz + hz - rf, rf, Math.PI / 2); arc(cx - hx + rb, cz - hz + rb, rb, Math.PI); arc(cx + hx - rb, cz - hz + rb, rb, 1.5 * Math.PI);
  if (Math.hypot(out[0][0] - out[out.length - 1][0], out[0][1] - out[out.length - 1][1]) < 1e-5) out.pop(); return out; };
// an upright prism on an outline from y0 to y1: its normals smooth where the outline bends by under 40 degrees (the round corners); col(n, top):
// a vertex's colour by its outward normal (top: at y1); skip(n, a, b): leave that face out (a front cut round a slot); top: its cap's colour
const lfPrismO = (g, pts, y0, y1, col, top, skip) => { const m = pts.length, c = [pts.reduce((s, p) => s + p[0], 0) / m, (y0 + y1) / 2, pts.reduce((s, p) => s + p[1], 0) / m];
  const sn = pts.map((a, i) => { const b = pts[(i + 1) % m], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; let n = [dz / l, 0, -dx / l]; if (n[0] * ((a[0] + b[0]) / 2 - c[0]) + n[2] * ((a[1] + b[1]) / 2 - c[2]) < 0) n = [-n[0], 0, -n[2]]; return n; });
  const vn = (i, j) => { const a = sn[i], b = sn[j]; if (a[0] * b[0] + a[2] * b[2] < 0.766) return null; const x = a[0] + b[0], z = a[2] + b[2], l = Math.hypot(x, z) || 1; return [x / l, 0, z / l]; };
  for (let i = 0; i < m; i++) { const j = (i + 1) % m, a = pts[i], b = pts[j], n = sn[i]; if (skip && skip(n, a, b)) continue;
    const na = vn((i + m - 1) % m, i) || n, nb = vn(i, j) || n; g.quadON([a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], na, nb, nb, na, c, col(na, 0), col(nb, 0), col(nb, 1), col(na, 1)); }
  if (top) for (let i = 0; i < m; i++) { const a = pts[i], b = pts[(i + 1) % m]; g.triO([c[0], y1, c[2]], [a[0], y1, a[1]], [b[0], y1, b[1]], top, [c[0], y1 - 1, c[2]]); } };
// between two outlines of the same count (lower lo at y0, upper up at y1): flat faces, col(n): a face's colour by its normal; skip(n, i)
const lfLoft = (g, lo, y0, up, y1, col, skip) => { const m = lo.length, c = [lo.concat(up).reduce((s, p) => s + p[0], 0) / (2 * m), (y0 + y1) / 2, lo.concat(up).reduce((s, p) => s + p[1], 0) / (2 * m)];
  for (let i = 0; i < m; i++) { const j = (i + 1) % m, A = [lo[i][0], y0, lo[i][1]], B = [lo[j][0], y0, lo[j][1]], Cq = [up[j][0], y1, up[j][1]], Dq = [up[i][0], y1, up[i][1]];
    const u = V(B[0] - A[0], B[1] - A[1], B[2] - A[2]), w = V(Dq[0] - A[0], Dq[1] - A[1], Dq[2] - A[2]), n = V().crossVectors(u, w).normalize(), mid = V((A[0] + Cq[0]) / 2 - c[0], (A[1] + Cq[1]) / 2 - c[1], (A[2] + Cq[2]) / 2 - c[2]); if (n.dot(mid) < 0) n.negate();
    if (skip && skip(n.toArray(), i)) continue; g.quadO(A, B, Cq, Dq, col(n.toArray()), c); } };
const lfCap = (g, pts, y, col, down) => { const m = pts.length, c = [pts.reduce((s, p) => s + p[0], 0) / m, y, pts.reduce((s, p) => s + p[1], 0) / m]; for (let i = 0; i < m; i++) { const a = pts[i], b = pts[(i + 1) % m]; g.triO(c, [a[0], y, a[1]], [b[0], y, b[1]], col, [c[0], y + (down ? 1 : -1), c[2]]); } };
const lfScale = (pts, cx, cz, d) => pts.map(([x, z]) => { const dx = x - cx, dz = z - cz, l = Math.hypot(dx, dz) || 1; return [x + dx / l * d, z + dz / l * d]; });
// the column's finished geometry: its gloss, the low 0.4 m darker towards the floor (as the game's pieces); the carriage's arrays
const lfGeo = (g) => { const geo = g.geometry(), gl = pbGlArr(g); geo.setAttribute('gloss', new T.BufferAttribute(gl, 1));
  const Pp = geo.attributes.position, Cc = geo.attributes.color; for (let i = 0; i < Pp.count; i++) { const y = Pp.getY(i); if (y < 0.4) { const t = Math.min(1, Math.max(0, y / 0.4)), a = 0.5 + 0.5 * t * t * (3 - 2 * t); Cc.setXYZ(i, Cc.getX(i) * a, Cc.getY(i) * a, Cc.getZ(i) * a); } }
  geo.computeBoundingSphere(); return geo; };
const lfCarOut = (g) => ({ P: g.P, N: g.N, C: g.C, gl: pbGlArr(g), n: g.P.length / 3 });
// the floor plate (the game's 1.12 × 0.635 m): st.line: a clean one (no yellow and black: a thin line of that colour round it); pl, plt its colours
const lfPlate = (g, st = {}) => { const L = D.LIFT, X = L.x, zf = L.z + L.hz, C = PBC, pz0 = zf, pz1 = -2.24, pzc = (pz0 + pz1) / 2, pd = pz0 - pz1, ps = pd - 0.14, yt = 0.015, ins = [X, -1, pzc];
  pbGl(g, PBGL.PLATE); pbBox(g, X, 0, pzc, 1.12, 0.012, pd, st.pl || C.PL, st.plt || C.PLt); pbGl(g, PBGL.PAINT);
  if (st.line) for (const [bx, bz, sx, sz] of [[X, pz0 - 0.035, 1.05, 0.012], [X, pz1 + 0.035, 1.05, 0.012], [X - 0.519, pzc, 0.012, pd - 0.07], [X + 0.519, pzc, 0.012, pd - 0.07]]) pbBox(g, bx, 0.012, bz, sx, 0.0015, sz, st.line);
  else { for (const [bx, bz, sx, sz] of [[X, pz0 - 0.035, 1.12, 0.07], [X, pz1 + 0.035, 1.12, 0.07], [X - 0.525, pzc, 0.07, ps], [X + 0.525, pzc, 0.07, ps]]) pbBox(g, bx, 0.012, bz, sx, 0.0015, sz, C.BLK);
    pbHazard(g, [X - 0.56, yt, pz0], [1, 0, 0], [0, 0, -1], 1.12, 0.07, 0.07, ins); pbHazard(g, [X + 0.56, yt, pz1], [-1, 0, 0], [0, 0, 1], 1.12, 0.07, 0.07, ins);
    pbHazard(g, [X - 0.56, yt, pz1 + 0.07], [0, 0, 1], [1, 0, 0], ps, 0.07, 0.07, ins); pbHazard(g, [X + 0.56, yt, pz0 - 0.07], [0, 0, -1], [-1, 0, 0], ps, 0.07, 0.07, ins); }
  pbGl(g, PBGL.METAL); for (const [bx, bz] of [[-0.4, -1.71], [0.4, -1.71], [-0.4, -2.12], [0.4, -2.12], [-0.13, -2.17], [0.33, -2.17]]) { pbCyl(g, [X + bx, 0.016, bz], 'y', 0.026, 0.004, 8, C.AR); pbCyl(g, [X + bx, 0.022, bz], 'y', 0.02, 0.012, 6, st.bolt || C.ZN, st.boltT || C.ZNt); } };
// the foot band in yellow and black on an upright box's four faces (round (cx, cz), half sizes hx, hz, from y0 to y1)
const lfFootHz = (g, cx, cz, hx, hz, y0, y1, pitch = 0.075, e = 0.025) => { const h = y1 - y0, ins = [cx, (y0 + y1) / 2, cz];
  pbHazard(g, [cx - hx + e, y0, cz + hz + 0.003], [1, 0, 0], [0, 1, 0], 2 * hx - 2 * e, h, pitch, ins); pbHazard(g, [cx + hx - e, y0, cz - hz - 0.003], [-1, 0, 0], [0, 1, 0], 2 * hx - 2 * e, h, pitch, ins);
  pbHazard(g, [cx + hx + 0.003, y0, cz + hz - e], [0, 0, -1], [0, 1, 0], 2 * hz - 2 * e, h, pitch, ins); pbHazard(g, [cx - hx - 0.003, y0, cz - hz + e], [0, 0, 1], [0, 1, 0], 2 * hz - 2 * e, h, pitch, ins); };
// a small control box on the column's +x face (xs) round z zc from y0 (0.24 m tall): its edges cut, the up button green and the down one
// black (white arrows on them), the red stop on its yellow ring, a key switch and a green lamp; k: its paint
const lfCtl = (g, xs, zc, y0, k = [0.15, 0.16, 0.18], d = 0.06) => { const C = PBC, kt = lfMix(k, [1, 1, 1], 0.12), x1 = xs + d, ins = [xs - 0.1, y0 + 0.12, zc];
  pbGl(g, PBGL.PAINT); pbPrism(g, xs + d / 2, zc, d / 2, 0.075, 0.008, y0, y0 + 0.24, [k, kt, k, k, k, k, kt, kt], kt);
  const btn = (y, z, col, up) => { pbBox(g, x1 + 0.002, y - 0.02, z, 0.004, 0.04, 0.04, col); const s = up ? 1 : -1, x = x1 + 0.0045; g.triO([x, y + 0.011 * s, z], [x, y - 0.008 * s, z - 0.01], [x, y - 0.008 * s, z + 0.01], C.WHITE, ins); };
  btn(y0 + 0.18, zc + 0.035, C.GRN, true); btn(y0 + 0.12, zc + 0.035, [0.06, 0.06, 0.07], false);
  pbCyl(g, [x1 + 0.004, y0 + 0.12, zc - 0.035], 'x', 0.03, 0.008, 12, C.YL); pbCyl(g, [x1 + 0.017, y0 + 0.12, zc - 0.035], 'x', 0.02, 0.018, 10, C.RED, [0.85, 0.16, 0.12]);
  pbGl(g, PBGL.METAL); pbCyl(g, [x1 + 0.004, y0 + 0.05, zc - 0.035], 'x', 0.011, 0.008, 8, C.ZN, C.ZNt); pbGl(g, PBGL.PAINT); pbBox(g, x1 + 0.0085, y0 + 0.044, zc - 0.035, 0.002, 0.012, 0.0025, C.BLK);
  pbCyl(g, [x1 + 0.002, y0 + 0.05, zc + 0.035], 'x', 0.006, 0.004, 8, [0.3, 1, 0.45]); };
// a compact power unit on a column's back face zb (round x xc): its plate, the oil tank (the oil's level), the pump block and the red
// release lever, the upright motor (its cooling rings, the black fan cover), the pressure hose into the column, the motor's lead away
// over the floor; a warning label on the tank (its depth 11 cm)
const lfPU = (g, xc, zb, y0 = 0.034, o = {}) => { const C = PBC, X = xc, t0 = zb - 0.006, t1 = zb - 0.106, tc = (t0 + t1) / 2;
  pbGl(g, PBGL.PAINT); if (o.plate !== false) pbBox(g, X, y0, zb - 0.003, 0.26, 0.5, 0.006, C.DK);
  pbGl(g, PBGL.PLATE); pbBox(g, X - 0.02, y0, tc, 0.2, 0.15, t0 - t1, C.OIL, C.OIL); pbBox(g, X - 0.02, y0 + 0.15, tc, 0.2, 0.08, t0 - t1, C.TANK, C.TANKt);
  pbGl(g, PBGL.MATTE); pbCyl(g, [X - 0.085, y0 + 0.24, tc], 'y', 0.018, 0.02, 8, C.BLK);
  pbGl(g, PBGL.METAL); pbBox(g, X + 0.02, y0 + 0.23, tc, 0.1, 0.06, 0.09, C.AL, C.ALt);
  pbGl(g, PBGL.PAINT); pbObox(g, [X + 0.07, y0 + 0.27, t1 + 0.02], [X + 0.12, y0 + 0.25, t1 + 0.02], 0.01, 0.01, C.RED); pbCyl(g, [X + 0.125, y0 + 0.248, t1 + 0.02], 'x', 0.01, 0.018, 8, C.RED);
  pbCyl(g, [X + 0.02, y0 + 0.385, tc], 'y', 0.045, 0.19, 12, C.MOT, C.MOTd); for (const y of [0.32, 0.36, 0.4, 0.44]) pbCyl(g, [X + 0.02, y0 + y, tc], 'y', 0.0485, 0.007, 12, C.MOTd);
  pbGl(g, PBGL.MATTE); pbCyl(g, [X + 0.02, y0 + 0.492, tc], 'y', 0.047, 0.024, 12, C.BLK, [0.2, 0.21, 0.22]);
  pbSign(g, [X - 0.02, y0 + 0.08, t1 - 0.0003], [-1, 0, 0], [0, 1, 0], 0.08, '!');
  const hx = o.hx != null ? o.hx : X + 0.06; pbTube(g, [[X + 0.05, y0 + 0.26, tc + 0.02], [(X + 0.06 + hx) / 2, y0 + 0.32, zb - 0.02], [hx, y0 + 0.36, zb + (o.hz || 0.01)]], 0.009, C.BLK, 8, 6);
  pbTube(g, [[X + 0.068, y0 + 0.4, tc], [X + 0.09, y0 + 0.3, tc - 0.02], [X + 0.1, y0 + 0.05, tc - 0.03], [X + 0.09, 0.019, t1 - 0.015], [X + 0.05, 0.019, -2.3]], 0.006, C.BLK, 14, 5); };
// ---- the arms (the game's liftGeo's arms, built anew: the knuckle on its pin, the outer tube (its top face lit), the two inner ones, the
//      pad's seat, its screw and the adapter, the cup and a ribbed rubber pad; every vertex tagged as the game tags it, so poseLift swings,
//      runs out and turns them as the game's). A: { KN, KNt (the knuckle), OR, ORt (the outer tube), IN, INt, INgl (the inner tubes), CUP, RUB, RUBt } ----
const lfArms = (A) => { const L = D.LIFT, g = pbGB(), T = { arm: [], kd: [], kp: [], kr: [] }, n = () => g.P.length / 3; let m0 = 0;
  const tag = (arm, kd, kp, kr, ym) => { for (let i = m0, e = n(); i < e; i++) { T.arm[i] = arm; T.kd[i] = kd; T.kp[i] = ym != null ? (g.P[i * 3 + 1] > ym ? kp[1] : kp[0]) : kp; T.kr[i] = kr; } m0 = n(); };
  const SX = 0.06, PB0 = 0.15, C = PBC;
  for (let i = 0; i < 4; i++) { const lc = L.arms[i].lc;
    pbGl(g, PBGL.PAINT); pbCyl(g, [0, 0, 0], 'y', 0.052, 0.045, 12, A.KN, A.KNt); World.box(g, (0.04 + lc - 0.06) / 2, -0.0225, 0, lc - 0.1, 0.045, 0.075, 0, A.OR, A.ORt); tag(i, 0, 0, 0);
    pbGl(g, A.INgl || PBGL.METAL); World.box(g, (0.11 + lc + 0.02) / 2, -0.018, 0, lc - 0.09, 0.036, 0.062, 0, A.IN, A.INt || A.IN); tag(i, 1, 0, 0);
    World.box(g, (0.16 + lc + 0.04) / 2, -0.0145, 0, lc - 0.12, 0.029, 0.05, 0, A.IN, A.INt || A.IN); World.box(g, lc, 0.0145, 0, 0.07, 0.008, 0.07, 0, C.AR); tag(i, 2, 0, 0);
    pbCyl(g, [lc, 0.0225 + SX / 2, 0], 'y', 0.02, SX, 8, C.ZN); tag(i, 2, [0, 1], 0, 0.0225 + SX / 2);
    pbCyl(g, [lc, 0.0225 + (SX + PB0) / 2, 0], 'y', 0.04, PB0 - SX, 12, C.AR, C.ZN); tag(i, 2, [1, 2], 1, 0.0225 + (SX + PB0) / 2);
    pbGl(g, PBGL.PAINT); pbCyl(g, [lc, 0.0285 + PB0, 0], 'y', 0.062, 0.012, 14, A.CUP, lfMix(A.CUP, [1, 1, 1], 0.15)); tag(i, 2, 2, 0);
    pbGl(g, PBGL.MATTE); pbCyl(g, [lc, 0.0435 + PB0, 0], 'y', 0.058, 0.018, 14, A.RUB, A.RUBt); for (const dz of [-0.026, 0, 0.026]) World.box(g, lc, 0.0525 + PB0, dz, 2 * Math.sqrt(0.054 * 0.054 - (Math.abs(dz) + 0.006) ** 2), 0.004, 0.012, 0, A.RUB, A.RUBt); tag(i, 2, 2, 0); }
  return { P: Float32Array.from(g.P), N: Float32Array.from(g.N), C: Float32Array.from(g.C), gl: pbGlArr(g), arm: Int8Array.from(T.arm), kd: Uint8Array.from(T.kd), kp: Uint8Array.from(T.kp), kr: Uint8Array.from(T.kr), n: n() }; };
const lfArmsOf = (O, k) => { const C = PBC, base = { KN: O.OR, KNt: O.ORt, OR: O.OR, ORt: O.HI, IN: C.ZN, INt: C.ZNt, CUP: C.YL, RUB: LFC.RUB, RUBt: LFC.RUBt };
  if (k === 2) return Object.assign(base, { IN: LFC.CHR, INt: LFC.CHRt, INgl: LFGL.CHROME });
  if (k === 3) return Object.assign(base, { IN: C.AR, INt: [0.42, 0.44, 0.48], KN: C.DK, KNt: C.GRt });
  if (k === 4) return Object.assign(base, { KN: LFC.WH, KNt: LFC.WHt, OR: LFC.WH, ORt: LFC.WHt, IN: LFC.SAT, INt: LFC.SATt, INgl: LFGL.SATIN, CUP: O.OR });
  if (k === 6) return Object.assign(base, { KN: LFC.GP, KNt: LFC.GPe, OR: LFC.GP, ORt: LFC.GPe, IN: LFC.SAT, INt: LFC.SATt, INgl: LFGL.SATIN, CUP: O.OR });
  return base; };
// the carriage's common parts (liftGeo's): the yoke (crosshead) over the pins from the column's face (zb0, default its face) to the game's
// front (z -1.392), its top's front edge lit, the gusset, the pins down to the arms and a boss on each; cy: the crosshead's underside
const lfYoke = (g, O, o = {}) => { const L = D.LIFT, cy = L.du + D.PAD.h + 0.02 + 0.0135, zf = L.z + L.hz, C = PBC, z0 = o.z0 != null ? o.z0 : zf;
  pbGl(g, PBGL.PAINT); if (o.bar !== false) { World.box(g, 0, cy, (z0 - 1.392) / 2, 1.4, 0.075, -1.392 - z0, 0, o.col || O.OR, o.top || O.ORt);
    g.quadO([-0.7, cy + 0.0755, -1.41], [0.7, cy + 0.0755, -1.41], [0.7, cy + 0.0755, -1.392], [-0.7, cy + 0.0755, -1.392], o.hi || O.HI, [0, cy, -1.5]); }
  if (o.gusset !== false) World.box(g, 0, cy + 0.075, o.gz || zf + 0.079, 0.3, 0.13, 0.05, 0, o.col || O.OR, o.top || O.ORt);
  if (o.hazard) { g.quadO([-0.62, cy + 0.008, -1.3917], [0.62, cy + 0.008, -1.3917], [0.62, cy + 0.067, -1.3917], [-0.62, cy + 0.067, -1.3917], C.BLK, [0, cy + 0.03, -1.5]); pbHazard(g, [-0.62, cy + 0.008, -1.3912], [1, 0, 0], [0, 1, 0], 1.24, 0.059, 0.06, [0, cy + 0.03, -1.5]); }
  pbGl(g, PBGL.METAL); for (const i of [0, 2]) { const [px, pz] = L.arms[i].p; pbCyl(g, [px, (0.0225 + cy) / 2, pz], 'y', 0.024, cy - 0.0225, 8, C.ZN); pbCyl(g, [px, cy + 0.11, pz], 'y', 0.048, 0.07, 12, o.boss || C.ZN, o.bossT || [0.4, 0.42, 0.45]); }
  return cy; };
// the carriage's plate (PB's: up the column's face, its edges cut and lit), its guides round the column's front corners (gx: their x),
// six bolts, a warning label, the lock's latch and lever under its top; ph: its height over cy
const lfPlateCar = (g, O, cy, ph, o = {}) => { const L = D.LIFT, zf = L.z + L.hz, C = PBC, hx = o.hx || 0.205, ch = o.ch || 0.014, zc = zf + (o.hz || 0.026) + 0.002;
  pbGl(g, PBGL.PAINT); pbPrism(g, 0, zc, hx, o.hz || 0.026, ch, cy + 0.075, cy + ph, [O.OR, O.HI, O.OR, O.HI2, O.OR, O.HI2, O.OR, O.HI], O.ORt);
  const zfc = zc + (o.hz || 0.026); for (const y of o.ribs || [0.26, 0.56]) World.box(g, 0, cy + y, zfc + 0.004, 2 * hx - 0.03, o.ribH || 0.04, 0.008, 0, o.rib || O.RIB, o.ribT || O.OR);
  if (o.sign !== false) pbSign(g, [0.1, cy + 0.425, zfc + 0.0002], [1, 0, 0], [0, 1, 0], 0.085, '!');
  pbGl(g, PBGL.METAL); const gx = o.gx || 0.2; if (o.guides !== false) for (const sx of [-1, 1]) World.box(g, sx * gx, cy + 0.11, zf - 0.02, 0.016, ph - 0.14, 0.1, 0, o.guide || C.ZN, o.guideT || o.guide || C.ZN);
  if (o.bolts !== false) for (const [bx, by] of [[-0.17, 0.14], [0.17, 0.14], [-0.17, 0.42], [0.17, 0.42], [-0.17, ph - 0.045], [0.17, ph - 0.045]]) pbCyl(g, [bx * hx / 0.205, cy + by, zfc + 0.004], 'z', 0.011, 0.008, 6, C.AR, C.ZN);
  if (o.latch !== false) { const ly = ph - 0.14; World.box(g, 0, cy + ly, zfc + 0.015, 0.1, 0.09, 0.03, 0, C.AR); World.box(g, 0.055, cy + ly - 0.03, zfc + 0.033, 0.012, 0.012, 0.012, 0, C.ZN); pbObox(g, [0.05, cy + ly + 0.03, zfc + 0.036], [0.15, cy + ly + 0.07, zfc + 0.036], 0.016, 0.01, [0.72, 0.12, 0.09]); }
  return zfc; };
// ==== 1: PB's lift refined ====
const lfCol1 = (O) => { const L = D.LIFT, g = pbGB(), X = L.x, Z = L.z, HZ = L.hz, HX = 0.18, CHF = 0.03, zf = Z + HZ, zb = Z - HZ, xs = X + HX, TOP = LFT[1].top, S = PBL.S, R = PBL.R, C = PBC;
  lfPlate(g);
  // the base flange (dark steel), its six bolts, yellow and black along its side and back edges, the gussets at its sides
  const fy0 = 0.012, fy1 = 0.034, fz0 = zb - 0.012, fz1 = zf - 0.004; pbGl(g, PBGL.PAINT); pbBox(g, X, fy0, (fz0 + fz1) / 2, 0.48, fy1 - fy0, fz1 - fz0, C.GR, C.GRt);
  const hy = fy1 + 0.0006, hi = [X, -1, Z]; pbHazard(g, [X - 0.24, hy, fz0 + 0.028], [1, 0, 0], [0, 0, -1], 0.48, 0.028, 0.045, hi); pbHazard(g, [X - 0.24, hy, fz1 - 0.012], [0, 0, -1], [1, 0, 0], fz1 - fz0 - 0.04, 0.028, 0.045, hi); pbHazard(g, [X + 0.212, hy, fz1 - 0.012], [0, 0, -1], [1, 0, 0], fz1 - fz0 - 0.04, 0.028, 0.045, hi);
  pbGl(g, PBGL.METAL); for (const [bx, bz] of [[-0.205, Z - 0.075], [0.205, Z - 0.075], [-0.205, Z + 0.07], [0.205, Z + 0.07], [-0.11, fz0 + 0.01], [0.11, fz0 + 0.01]]) pbCyl(g, [X + bx, fy1 + 0.007, bz], 'y', 0.015, 0.014, 6, C.ZN, C.ZNt);
  pbGl(g, PBGL.PAINT); for (const sx of [-1, 1]) for (const dz of [-0.06, 0.06]) { const x0 = X + sx * HX, x1 = X + sx * (HX + 0.052), y0 = fy1, y1 = 0.21;
    for (const zz of [Z + dz - 0.006, Z + dz + 0.006]) g.triO([x0, y0, zz], [x1, y0, zz], [x0, y1, zz], O.DKO, [x0, y0 + 0.03, Z + dz]);
    g.quadO([x1, y0, Z + dz - 0.006], [x1, y0, Z + dz + 0.006], [x0, y1, Z + dz + 0.006], [x0, y1, Z + dz - 0.006], O.HI2, [x0, y0, Z + dz]); }
  pbPrism(g, X, Z, HX, HZ, CHF, fy1, 0.24, C.BLK); lfFootHz(g, X, Z, HX, HZ, fy1, 0.24);
  // the column: its bevels lit (the front ones lightest), clean paint; a lit line round it under the cap; the front face round the track
  const y0 = 0.24, ys0 = 0.30, ys1 = TOP - 0.1, BEV = lfMix(O.OR, [1, 0.95, 0.86], 0.32);
  pbPrism(g, X, Z, HX, HZ, CHF, y0, TOP, [O.OR, BEV, O.OR, O.HI2, O.OR, O.HI2, O.OR, BEV], null, [0]);
  pbPrism(g, X, Z, HX + 0.002, HZ + 0.002, CHF, TOP - 0.03, TOP - 0.018, O.HI2, null, [0]); g.quadO([X - HX + CHF, TOP - 0.03, zf + 0.002], [X + HX - CHF, TOP - 0.03, zf + 0.002], [X + HX - CHF, TOP - 0.018, zf + 0.002], [X - HX + CHF, TOP - 0.018, zf + 0.002], O.HI2, [X, TOP, Z]);
  const fq = (x0, x1, a, b, col) => g.quadO([X + x0, a, zf], [X + x1, a, zf], [X + x1, b, zf], [X + x0, b, zf], col, [X, (a + b) / 2, Z]);
  fq(-HX + CHF, -S, y0, TOP, O.OR); fq(S, HX - CHF, y0, TOP, O.OR); fq(-S, S, y0, ys0, O.OR); fq(-S, S, ys1, TOP, O.OR);
  const zr = zf - R; g.quadO([X - S, ys0, zf], [X - S, ys0, zr], [X - S, ys1, zr], [X - S, ys1, zf], C.WALL, [X - S - 0.05, ys0, zr]); g.quadO([X + S, ys0, zf], [X + S, ys0, zr], [X + S, ys1, zr], [X + S, ys1, zf], C.WALL, [X + S + 0.05, ys0, zr]);
  g.quadO([X - S, ys0, zf], [X + S, ys0, zf], [X + S, ys0, zr], [X - S, ys0, zr], C.WALLt, [X, ys0 - 0.05, zr]); g.quadO([X - S, ys1, zf], [X + S, ys1, zf], [X + S, ys1, zr], [X - S, ys1, zr], C.WALL, [X, ys1 + 0.05, zr]);
  g.quadO([X - S, ys0, zr], [X + S, ys0, zr], [X + S, ys1, zr], [X - S, ys1, zr], C.SLOT, [X, ys0, zr - 0.05]);
  // in the track: the lock rack (left: sloped teeth) and the chrome ram (right: its rod the full track, held at its top by a clevis)
  const rx0 = X - S + 0.005, rx1 = X - 0.008, rz = zr + 0.008; pbBox(g, (rx0 + rx1) / 2, ys0, zr + 0.004, rx1 - rx0, ys1 - ys0, 0.008, C.RACK, C.RACK, true);
  for (let y = ys0 + 0.05; y < ys1 - 0.06; y += 0.055) { const A = (x) => [x, y, rz], Bp = (x) => [x, y, rz + 0.018], Cp = (x) => [x, y + 0.03, rz], c = [(rx0 + rx1) / 2, y + 0.01, rz + 0.005];
    g.quadO(A(rx0), A(rx1), Bp(rx1), Bp(rx0), C.TOOTHd, c); g.quadO(Bp(rx0), Bp(rx1), Cp(rx1), Cp(rx0), C.TOOTH, c); g.triO(A(rx0), Bp(rx0), Cp(rx0), C.TOOTHd, c); g.triO(A(rx1), Bp(rx1), Cp(rx1), C.TOOTHd, c); }
  const rcx = X + 0.022, rcz = zr + 0.022; pbGl(g, LFGL.CHROME); lfCylY(g, rcx, rcz, 0.0135, ys0 + 0.02, ys1 - 0.045, 14, LFC.CHR, null, LFC.CHRt);
  pbGl(g, PBGL.METAL); pbBox(g, rcx, ys1 - 0.05, rcz, 0.04, 0.05, 0.036, C.AR, C.ZN); pbCyl(g, [rcx, ys1 - 0.025, rcz + 0.018], 'z', 0.008, 0.006, 8, C.ZNt); pbBox(g, rcx, ys0, rcz, 0.036, 0.02, 0.034, C.AR, C.ZN);
  // the zinc guide rails either side of the track (a little proud, their inner edges lit)
  pbGl(g, PBGL.PAINT); for (const s of [-1, 1]) { const xa = X + s * S, xb = X + s * (S + 0.03), x0 = Math.min(xa, xb), x1 = Math.max(xa, xb); pbBox(g, (x0 + x1) / 2, ys0 - 0.02, zf + 0.004, 0.03, ys1 - ys0 + 0.06, 0.008, C.ZN, C.ZNt);
    g.quadO([xa + s * 0.0005, ys0 - 0.02, zf + 0.0081], [xa + s * 0.006, ys0 - 0.02, zf + 0.0081], [xa + s * 0.006, ys1 + 0.04, zf + 0.0081], [xa + s * 0.0005, ys1 + 0.04, zf + 0.0081], C.ZNt, [xa, ys0, zf]); }
  // the cap (PB's: a dark plate, its top bevelled and lit, four bolts)
  const c0 = TOP, c1 = TOP + 0.022, c2 = TOP + PBL.cap, cw = 0.2, cd = 0.135, iw = 0.175, id = 0.11; pbBox(g, X, c0, Z, 2 * cw, c1 - c0, 2 * cd, C.CAP, C.CAP);
  const cq = [[cw, cd, iw, id], [-cw, cd, -iw, id], [-cw, -cd, -iw, -id], [cw, -cd, iw, -id]];
  for (let i = 0; i < 4; i++) { const [ax, az, aix, aiz] = cq[i], [bx2, bz2, bix, biz] = cq[(i + 1) % 4]; g.quadO([X + ax, c1, Z + az], [X + bx2, c1, Z + bz2], [X + bix, c2, Z + biz], [X + aix, c2, Z + aiz], C.CAPe, [X, c0, Z]); }
  g.quadO([X - iw, c2, Z - id], [X + iw, c2, Z - id], [X + iw, c2, Z + id], [X - iw, c2, Z + id], C.CAPt, [X, c0, Z]);
  pbGl(g, PBGL.METAL); for (const [bx, bz] of [[-0.12, -0.065], [0.12, -0.065], [-0.12, 0.065], [0.12, 0.065]]) pbCyl(g, [X + bx, c2 + 0.004, Z + bz], 'y', 0.011, 0.008, 6, C.AR, C.ZN);
  // the side (+x): the control box, a warning label; the cable chain from the power unit up into the control box (its links, its bracket)
  lfCtl(g, xs, Z - 0.035, 0.98); pbGl(g, PBGL.PAINT); pbBox(g, xs + 0.002, 1.40, Z, 0.006, 0.17, 0.13, C.WHITE); pbSign(g, [xs + 0.005, 1.478, Z], [0, 0, -1], [0, 1, 0], 0.1, '!');
  const chz = Z - 0.088; pbBox(g, xs + 0.016, 0.3, chz, 0.032, 0.05, 0.05, C.AR, C.ZN); for (let y = 0.355, i = 0; y < 0.97; y += 0.044, i++) pbBox(g, xs + 0.016, y, chz, 0.03, 0.04, 0.036, i & 1 ? C.BLK : [0.12, 0.12, 0.13], [0.24, 0.24, 0.26]);
  pbGl(g, PBGL.MATTE); pbTube(g, [[xs + 0.016, 0.31, chz - 0.01], [xs + 0.01, 0.3, zb - 0.03], [X + 0.14, 0.42, -1.93], [X + 0.127, 0.47, -1.94]], 0.008, C.BLK, 10, 5);
  // the power unit at the foot, on the back (PB's)
  pbGl(g, PBGL.PAINT); pbBox(g, X, fy1, zb - 0.004, 0.3, 0.58, 0.008, C.DK);
  pbGl(g, PBGL.PLATE); const tx0 = X - 0.13, tx1 = X + 0.11, tz0 = -2.015, tz1 = -1.855, txc = (tx0 + tx1) / 2, tzc = (tz0 + tz1) / 2; pbBox(g, txc, 0.012, tzc, tx1 - tx0, 0.19, tz1 - tz0, C.OIL, C.OIL); pbBox(g, txc, 0.202, tzc, tx1 - tx0, 0.1, tz1 - tz0, C.TANK, C.TANKt);
  pbGl(g, PBGL.MATTE); pbCyl(g, [X - 0.08, 0.312, -1.975], 'y', 0.022, 0.02, 8, C.BLK);
  pbGl(g, PBGL.METAL); pbBox(g, X + 0.03, 0.302, -1.935, 0.13, 0.07, 0.11, C.AL, C.ALt);
  pbGl(g, PBGL.PAINT); pbObox(g, [X + 0.095, 0.345, -1.905], [X + 0.16, 0.322, -1.905], 0.012, 0.012, C.RED); pbCyl(g, [X + 0.165, 0.32, -1.905], 'x', 0.012, 0.022, 8, C.RED);
  pbCyl(g, [X + 0.03, 0.492, -1.935], 'y', 0.068, 0.236, 14, C.MOT, C.MOTd); for (const y of [0.41, 0.45, 0.49, 0.53, 0.57]) pbCyl(g, [X + 0.03, y, -1.935], 'y', 0.0715, 0.008, 14, C.MOTd);
  pbGl(g, PBGL.MATTE); pbCyl(g, [X + 0.03, 0.625, -1.935], 'y', 0.071, 0.026, 14, C.BLK, [0.2, 0.21, 0.22]);
  pbGl(g, PBGL.PAINT); pbBox(g, X + 0.112, 0.455, -1.935, 0.03, 0.085, 0.065, C.MOT, C.MOT); pbSign(g, [X + 0.1272, 0.497, -1.935], [0, 0, -1], [0, 1, 0], 0.052, 'bolt');
  pbSign(g, [tx1 + 0.0003, 0.17, tzc], [0, 0, -1], [0, 1, 0], 0.09, '!');
  pbGl(g, PBGL.MATTE); pbTube(g, [[X + 0.06, 0.37, -1.905], [X + 0.075, 0.43, -1.875], [X + 0.08, 0.475, -1.852], [X + 0.08, 0.5, zb - 0.012]], 0.011, C.BLK, 10, 6);
  pbTube(g, [[X + 0.127, 0.47, -1.94], [X + 0.135, 0.43, -1.99], [X + 0.125, 0.3, -2.02], [X + 0.11, 0.06, -2.025], [X + 0.09, 0.02, -2.06], [X + 0.05, 0.019, -2.3]], 0.007, C.BLK, 18, 5);
  pbGl(g, PBGL.METAL); pbCyl(g, [X + 0.08, 0.5, zb - 0.01], 'z', 0.017, 0.02, 8, C.ZN); pbCyl(g, [X + 0.06, 0.38, -1.905], 'y', 0.016, 0.018, 8, C.ZN);
  return lfGeo(g); };
const lfCar1 = (O) => { const L = D.LIFT, g = pbGB(), zf = L.z + L.hz, ph = LFT[1].ph, cy = lfYoke(g, O); lfPlateCar(g, O, cy, ph, { ch: 0.016 });
  // the ram's bushing at the plate's top (round the chrome rod, in the track)
  pbGl(g, PBGL.METAL); const rcx = L.x + 0.022, rcz = zf - PBL.R + 0.022; pbCyl(g, [rcx, cy + ph + 0.005, rcz], 'y', 0.021, 0.03, 12, PBC.AR, PBC.ZN); return lfCarOut(g); };
// ==== 2: TELESKOPSKI (the round telescopic column, the carriage on top) ====
const lfCol2 = (O) => { const L = D.LIFT, g = pbGB(), X = L.x, zf = L.z + L.hz, C = PBC, ZC = zf - 0.15, zb = ZC - 0.15;
  lfPlate(g);
  // the flange (its corners cut, behind the column's face), eight bolts; the square foot in yellow and black
  pbGl(g, PBGL.PAINT); pbPrism(g, X, -1.772, 0.23, 0.163, 0.04, 0.012, 0.034, C.GR, C.GRt);
  pbGl(g, PBGL.METAL); for (const [bx, bz] of [[-0.205, ZC - 0.09], [0.205, ZC - 0.09], [-0.205, ZC + 0.09], [0.205, ZC + 0.09], [-0.1, -1.918], [0.1, -1.918]]) pbCyl(g, [X + bx, 0.041, bz], 'y', 0.015, 0.014, 6, C.ZN, C.ZNt);
  pbGl(g, PBGL.PAINT); pbPrism(g, X, ZC, 0.19, 0.15, 0.03, 0.034, 0.2, C.BLK, C.GR); lfFootHz(g, X, ZC, 0.19, 0.15, 0.034, 0.2, 0.075, 0.032);
  // stage 1: the orange tube, a lit lip at its top, the dark gland; stage 2: chrome, an orange collar at its top (the wiper's dark face)
  lfCylY(g, X, ZC, 0.145, 0.2, 0.745, 32, O.OR, null, O.OR); lfCylY(g, X, ZC, 0.15, 0.745, 0.785, 32, O.HI2, C.GR, O.HI); lfCylY(g, X, ZC, 0.124, 0.785, 0.8, 28, C.GR, C.GRt);
  pbGl(g, LFGL.CHROME); lfCylY(g, X, ZC, 0.112, 0.8, 0.935, 28, LFC.CHRd, null, LFC.CHR);
  pbGl(g, PBGL.PAINT); lfCylY(g, X, ZC, 0.119, 0.935, 0.98, 28, O.OR, C.GR, O.HI);
  // a warning label on stage 1's front; the controls on a slim post at the side; the power unit behind the foot (no plate)
  pbSign(g, [X + 0.1452, 0.5, ZC], [0, 0, -1], [0, 1, 0], 0.08, '!');
  pbBox(g, X + 0.222, 0.034, -1.85, 0.036, 0.8, 0.036, C.GR, C.GRt); lfCtl(g, X + 0.204, -1.85, 0.8);
  lfPU(g, X, zb, 0.034, { plate: false, hz: 0.035 }); return lfGeo(g); };
const lfCar2 = (O) => { const L = D.LIFT, g = pbGB(), X = L.x, zf = L.z + L.hz, C = PBC, ZC = zf - 0.15, hb = LFT[2].hb - L.c0, ht = LFT[2].ht - L.c0, cols = [O.OR, O.HI, O.OR, O.HI2, O.OR, O.HI2, O.OR, O.HI];
  const cy = lfYoke(g, O, { gz: zf + 0.063 });
  // the fork plate from the yoke up to the head (its edges cut and lit), two ribs, a label, its bolts
  pbGl(g, PBGL.PAINT); pbPrism(g, X, zf + 0.02, 0.075, 0.018, 0.008, cy + 0.075, ht - 0.012, cols, O.ORt);
  for (const y of [0.3, 0.62]) World.box(g, X, cy + y, zf + 0.04, 0.13, 0.035, 0.008, 0, O.RIB, O.OR); pbSign(g, [X, cy + 0.47, zf + 0.0382], [1, 0, 0], [0, 1, 0], 0.07, '!');
  pbGl(g, PBGL.METAL); for (const [bx, by] of [[-0.05, 0.14], [0.05, 0.14], [-0.05, hb - cy - 0.05], [0.05, hb - cy - 0.05]]) pbCyl(g, [bx, cy + by, zf + 0.04], 'z', 0.009, 0.008, 6, C.AR, C.ZN);
  // the head on the ram: round (as the stages), a lit lip round its top, a dark pad on its top with four bolts
  pbGl(g, PBGL.PAINT); lfCylY(g, X, ZC, 0.152, hb, ht, 32, O.OR, O.ORt, O.HI2); lfCylY(g, X, ZC, 0.155, ht - 0.032, ht - 0.018, 32, O.HI, null, O.HI);
  lfCylY(g, X, ZC, 0.11, ht, ht + 0.006, 24, C.GR, C.GRt); pbGl(g, PBGL.METAL); for (const [bx, bz] of [[-0.06, -0.06], [0.06, -0.06], [-0.06, 0.06], [0.06, 0.06]]) pbCyl(g, [X + bx, ht + 0.009, ZC + bz], 'y', 0.01, 0.006, 6, C.AR, C.ZN);
  // stage 3: the chrome ram under the head (2.06 m: at the SAMUM's 1.35 m its foot is still 12 cm in stage 2; at rest its lower part is
  // under the floor), its dark wiper ring under the head
  pbGl(g, LFGL.CHROME); lfCylY(g, X, ZC, 0.085, hb - 2.06, hb, 28, LFC.CHR, null, LFC.CHRt); pbGl(g, PBGL.PAINT); lfCylY(g, X, ZC, 0.092, hb - 0.022, hb, 24, C.GR, null, C.GRt);
  return lfCarOut(g); };
// ==== 3: INDUSTRIJSKI (heavy box section, lock ladder, counterweight housing, bolted gussets, hazard stripes) ====
const lfCol3 = (O) => { const L = D.LIFT, g = pbGB(), X = L.x, zf = L.z + L.hz, C = PBC, HX = 0.2, HZ = 0.1575, ZC = zf - HZ, zb = ZC - HZ, CHF = 0.035, TOP = LFT[3].top, S = 0.07, R = 0.05, xs = X + HX, BEV = lfMix(O.OR, [1, 0.95, 0.86], 0.3);
  lfPlate(g);
  // the heavy flange, eight bolts, yellow and black round its sides and back; two bolted gussets at each side
  const fy1 = 0.04, fz1 = zf - 0.004, fz0 = zb - 0.03; pbGl(g, PBGL.PAINT); pbBox(g, X, 0.012, (fz0 + fz1) / 2, 0.48, fy1 - 0.012, fz1 - fz0, C.GR, C.GRt);
  const hy = fy1 + 0.0006, hi = [X, -1, ZC]; pbHazard(g, [X - 0.24, hy, fz0 + 0.03], [1, 0, 0], [0, 0, -1], 0.48, 0.03, 0.045, hi); pbHazard(g, [X - 0.24, hy, fz1 - 0.012], [0, 0, -1], [1, 0, 0], fz1 - fz0 - 0.042, 0.03, 0.045, hi); pbHazard(g, [X + 0.21, hy, fz1 - 0.012], [0, 0, -1], [1, 0, 0], fz1 - fz0 - 0.042, 0.03, 0.045, hi);
  for (const sx of [-1, 1]) for (const dz of [-0.075, 0.075]) { const x0 = X + sx * HX, x1 = X + sx * (HX + 0.04), y0 = fy1, y1 = 0.36, zc = ZC + dz;
    for (const zz of [zc - 0.008, zc + 0.008]) g.triO([x0, y0, zz], [x1, y0, zz], [x0, y1, zz], O.DKO, [x0, y0 + 0.03, zc]);
    g.quadO([x1, y0, zc - 0.008], [x1, y0, zc + 0.008], [x0, y1, zc + 0.008], [x0, y1, zc - 0.008], O.HI2, [x0, y0, zc]); }
  pbGl(g, PBGL.METAL); for (const sx of [-1, 1]) for (const dz of [-0.12, -0.03, 0.03, 0.12]) pbCyl(g, [X + sx * 0.222, fy1 + 0.007, ZC + dz], 'y', 0.013, 0.014, 6, C.ZN, C.ZNt);
  for (const bx of [-0.19, 0.19]) pbCyl(g, [X + bx, fy1 + 0.007, fz0 + 0.015], 'y', 0.013, 0.014, 6, C.ZN, C.ZNt);
  pbGl(g, PBGL.PAINT); pbPrism(g, X, ZC, HX, HZ, CHF, fy1, 0.3, C.BLK); lfFootHz(g, X, ZC, HX, HZ, fy1, 0.3, 0.085, 0.036);
  // the column: heavy cut edges (lit), stiffener bands on its sides, the front face round the wide track
  const y0 = 0.3, ys0 = 0.36, ys1 = TOP - 0.1; pbPrism(g, X, ZC, HX, HZ, CHF, y0, TOP, [O.OR, BEV, O.OR, O.HI2, O.OR, O.HI2, O.OR, BEV], null, [0]);
  for (const y of [0.8, 1.4, 2.0]) for (const sx of [-1, 1]) pbBox(g, X + sx * (HX + 0.004), y, ZC, 0.008, 0.045, 2 * HZ - 2 * CHF - 0.01, O.RIB, O.ORt);
  const fq = (x0, x1, a, b, col) => g.quadO([X + x0, a, zf], [X + x1, a, zf], [X + x1, b, zf], [X + x0, b, zf], col, [X, (a + b) / 2, ZC]);
  fq(-HX + CHF, -S, y0, TOP, O.OR); fq(S, HX - CHF, y0, TOP, O.OR); fq(-S, S, y0, ys0, O.OR); fq(-S, S, ys1, TOP, O.OR);
  const zr = zf - R; g.quadO([X - S, ys0, zf], [X - S, ys0, zr], [X - S, ys1, zr], [X - S, ys1, zf], C.WALL, [X - S - 0.05, ys0, zr]); g.quadO([X + S, ys0, zf], [X + S, ys0, zr], [X + S, ys1, zr], [X + S, ys1, zf], C.WALL, [X + S + 0.05, ys0, zr]);
  g.quadO([X - S, ys0, zf], [X + S, ys0, zf], [X + S, ys0, zr], [X - S, ys0, zr], C.WALLt, [X, ys0 - 0.05, zr]); g.quadO([X - S, ys1, zf], [X + S, ys1, zf], [X + S, ys1, zr], [X - S, ys1, zr], C.WALL, [X, ys1 + 0.05, zr]);
  g.quadO([X - S, ys0, zr], [X + S, ys0, zr], [X + S, ys1, zr], [X - S, ys1, zr], C.SLOT, [X, ys0, zr - 0.05]);
  // the lock ladder: two zinc rails, steel rungs every 7 cm (the windows between them dark)
  pbGl(g, PBGL.METAL); for (const sx of [-1, 1]) pbBox(g, X + sx * 0.052, ys0, zr + 0.008, 0.016, ys1 - ys0, 0.016, C.ZN, C.ZNt, true);
  for (let y = ys0 + 0.04; y < ys1 - 0.03; y += 0.07) pbBox(g, X, y, zr + 0.009, 0.088, 0.018, 0.012, C.TOOTH, C.ZNt);
  pbGl(g, PBGL.PAINT); for (const s of [-1, 1]) { const xa = X + s * S, xb = X + s * (S + 0.034), x0 = Math.min(xa, xb), x1 = Math.max(xa, xb); pbBox(g, (x0 + x1) / 2, ys0 - 0.02, zf + 0.005, 0.034, ys1 - ys0 + 0.06, 0.01, C.ZN, C.ZNt);
    g.quadO([xa + s * 0.0005, ys0 - 0.02, zf + 0.0101], [xa + s * 0.007, ys0 - 0.02, zf + 0.0101], [xa + s * 0.007, ys1 + 0.04, zf + 0.0101], [xa + s * 0.0005, ys1 + 0.04, zf + 0.0101], C.ZNt, [xa, ys0, zf]); }
  // the cap: a heavy dark plate, its top bevelled (lit), six bolts
  const c0 = TOP, c1 = TOP + 0.022, c2 = TOP + 0.04, cw = HX + 0.025, cd = HZ + 0.02, iw = HX, id = HZ - 0.005; pbBox(g, X, c0, ZC, 2 * cw, c1 - c0, 2 * cd, C.CAP, C.CAP);
  const cq = [[cw, cd, iw, id], [-cw, cd, -iw, id], [-cw, -cd, -iw, -id], [cw, -cd, iw, -id]];
  for (let i = 0; i < 4; i++) { const [ax, az, aix, aiz] = cq[i], [bx2, bz2, bix, biz] = cq[(i + 1) % 4]; g.quadO([X + ax, c1, ZC + az], [X + bx2, c1, ZC + bz2], [X + bix, c2, ZC + biz], [X + aix, c2, ZC + aiz], C.CAPe, [X, c0, ZC]); }
  g.quadO([X - iw, c2, ZC - id], [X + iw, c2, ZC - id], [X + iw, c2, ZC + id], [X - iw, c2, ZC + id], C.CAPt, [X, c0, ZC]);
  pbGl(g, PBGL.METAL); for (const [bx, bz] of [[-0.14, -0.09], [0, -0.09], [0.14, -0.09], [-0.14, 0.09], [0, 0.09], [0.14, 0.09]]) pbCyl(g, [X + bx, c2 + 0.004, ZC + bz], 'y', 0.012, 0.008, 6, C.AR, C.ZN);
  // the counterweight housing on the back: graphite, its edges cut, yellow and black at its foot, its bolted cover, a window on the weight
  const hz0 = zb - 0.11, hzc = zb - 0.055, H0 = 0.6, H1 = 2.4; pbGl(g, PBGL.PAINT); pbPrism(g, X, hzc, 0.15, 0.055, 0.02, H0, H1, [LFC.GP, LFC.GPe, LFC.GP, LFC.GPe, LFC.GP, LFC.GPe, LFC.GP, LFC.GPe], LFC.GPt);
  pbPrism(g, X, hzc, 0.152, 0.057, 0.02, H0, H0 + 0.1, C.BLK); pbHazard(g, [X + 0.13, H0, hz0 - 0.0035], [-1, 0, 0], [0, 1, 0], 0.26, 0.1, 0.06, [X, H0, hzc]); for (const sx of [-1, 1]) pbHazard(g, [X + sx * 0.1555, H0, hz0 + 0.02 + (sx < 0 ? 0.07 : 0)], [0, 0, sx < 0 ? -1 : 1], [0, 1, 0], 0.07, 0.1, 0.06, [X, H0, hzc]);
  pbBox(g, X, 1.0, hz0 - 0.0016, 0.22, 1.1, 0.003, LFC.GPt, LFC.GPe); pbBox(g, X, 1.62, hz0 - 0.0036, 0.07, 0.4, 0.001, C.SLOT); pbBox(g, X, 1.7, hz0 - 0.0042, 0.054, 0.035, 0.001, C.YL);
  pbGl(g, PBGL.METAL); for (const by of [1.04, 1.5, 2.06]) for (const sx of [-1, 1]) pbCyl(g, [X + sx * 0.095, by, hz0 - 0.005], 'z', 0.009, 0.004, 6, C.AR, C.ZN);
  // the power unit under the housing; the controls on the side; a warning label
  lfPU(g, X, zb, fy1); lfCtl(g, xs, ZC - 0.02, 0.98); pbGl(g, PBGL.PAINT); pbBox(g, xs + 0.002, 1.42, ZC, 0.006, 0.17, 0.13, C.WHITE); pbSign(g, [xs + 0.005, 1.498, ZC], [0, 0, -1], [0, 1, 0], 0.1, '!');
  return lfGeo(g); };
const lfCar3 = (O) => { const L = D.LIFT, g = pbGB(), zf = L.z + L.hz, C = PBC, ph = LFT[3].ph, cy = lfYoke(g, O, { hazard: true, gz: zf + 0.087 });
  const zfc = lfPlateCar(g, O, cy, ph, { hx: 0.235, hz: 0.03, ch: 0.018, gx: 0.212, ribs: [0.2, 0.5], rib: C.DK, ribT: C.GR, ribH: 0.03 });
  pbGl(g, PBGL.METAL); for (const [bx, by] of [[-0.21, 0.28], [0.21, 0.28], [-0.21, 0.58], [0.21, 0.58]]) pbCyl(g, [bx, cy + by, zfc + 0.004], 'z', 0.012, 0.008, 6, C.AR, C.ZN);
  return lfCarOut(g); };
// ==== 4: ELEGANTEN RAZSTAVNI (slim rounded white column, orange lines, a soft LED line in its track, the power unit hidden) ====
const lfCol4 = (O) => { const L = D.LIFT, g = pbGB(), X = L.x, zf = L.z + L.hz, C = PBC, W = LFC, HX = 0.135, HZ = 0.1, ZC = zf - HZ, TOP = LFT[4].top, S = 0.022, R = 0.03, xs = X + HX, wh = () => W.WH;
  lfPlate(g, { line: O.OR, pl: [0.19, 0.2, 0.22], plt: [0.24, 0.25, 0.27], bolt: [0.3, 0.31, 0.33], boltT: [0.4, 0.41, 0.43] });
  // the plinth: rounded white (the power unit in it), an orange line round it, its top edge rounded off; vent slits at its back
  const PZ1 = -2.02, PC = (zf + PZ1) / 2, PH = (zf - PZ1) / 2, po = (d) => lfOutline(X, PC, 0.2 + d, PH + d, 0.05 + d, 0.1 + d, 4);
  pbGl(g, PBGL.PLATE); lfPrismO(g, po(0), 0.012, 0.128, () => W.WHs); lfPrismO(g, po(0.0015), 0.128, 0.14, () => O.OR); lfPrismO(g, po(0), 0.14, 0.15, () => W.WHs); lfLoft(g, po(0), 0.15, po(-0.012), 0.162, () => W.WH); lfCap(g, po(-0.012), 0.162, W.WHt);
  pbGl(g, PBGL.PAINT); for (const y of [0.04, 0.062, 0.084, 0.106]) pbBox(g, X, y, PZ1 - 0.0008, 0.14, 0.008, 0.002, C.SLOT);
  // the column: rounded, white; its front cut round the track; orange lines either side of the track and round it under its top
  const co = (d) => lfOutline(X, ZC, HX + d, HZ + d, 0.05 + d, 0.09 + d, 4), y0 = 0.162, ys0 = 0.32, ys1 = TOP - 0.12, fx = HX - 0.05;
  pbGl(g, 1.3); lfPrismO(g, co(0), y0, TOP, wh, null, (n, a, b) => n[2] > 0.99 && Math.abs(a[1] - zf) < 1e-4 && Math.abs(b[1] - zf) < 1e-4);
  const fq = (x0, x1, a, b, col) => g.quadO([X + x0, a, zf], [X + x1, a, zf], [X + x1, b, zf], [X + x0, b, zf], col, [X, (a + b) / 2, ZC]);
  fq(-fx, -S, y0, TOP, W.WH); fq(S, fx, y0, TOP, W.WH); fq(-S, S, y0, ys0, W.WH); fq(-S, S, ys1, TOP, W.WH);
  const zr = zf - R; g.quadO([X - S, ys0, zf], [X - S, ys0, zr], [X - S, ys1, zr], [X - S, ys1, zf], W.WHs, [X - S - 0.05, ys0, zr]); g.quadO([X + S, ys0, zf], [X + S, ys0, zr], [X + S, ys1, zr], [X + S, ys1, zf], W.WHs, [X + S + 0.05, ys0, zr]);
  g.quadO([X - S, ys0, zf], [X + S, ys0, zf], [X + S, ys0, zr], [X - S, ys0, zr], W.WHs, [X, ys0 - 0.05, zr]); g.quadO([X - S, ys1, zf], [X + S, ys1, zf], [X + S, ys1, zr], [X - S, ys1, zr], W.WHd, [X, ys1 + 0.05, zr]);
  g.quadO([X - S, ys0, zr], [X + S, ys0, zr], [X + S, ys1, zr], [X - S, ys1, zr], [0.92, 0.88, 0.8], [X, ys0, zr - 0.05]);
  pbGl(g, PBGL.PAINT); for (const sx of [-1, 1]) pbBox(g, X + sx * 0.06, ys0 - 0.04, zf + 0.0015, 0.012, ys1 - ys0 + 0.08, 0.003, O.OR, O.HI);
  lfPrismO(g, co(0.002), TOP - 0.06, TOP - 0.047, () => O.OR); lfPrismO(g, co(0.002), y0, y0 + 0.012, () => O.OR);
  // its top rounded off (white), a slim touch panel on its side (dark glass; its lit dots: the LED mesh)
  pbGl(g, 1.3); lfLoft(g, co(0), TOP, co(-0.02), TOP + 0.022, (n) => n[1] > 0.6 ? W.WHt : W.WH); lfCap(g, co(-0.02), TOP + 0.022, W.WHt);
  pbGl(g, PBGL.METAL); pbBox(g, xs + 0.002, 0.98, ZC + 0.02, 0.004, 0.2, 0.04, W.GLASS, W.GLASS);
  return lfGeo(g); };
const lfGlow4 = (O) => { const L = D.LIFT, X = L.x, zf = L.z + L.hz, TOP = LFT[4].top, ys0 = 0.32, ys1 = TOP - 0.12, zr = zf - 0.03 + 0.0015, W = LFC, k = (c, f) => c.map(x => x * f), Z0 = [0, 0, 0], ZC = zf - 0.1;
  const q = [], V4 = (x0, x1, y0, y1, z, c0, c1) => q.push([[X + x0, y0, z], [X + x1, y0, z], [X + x1, y1, z], [X + x0, y1, z], c0, c1, c1, c0]);
  V4(-0.007, 0.007, ys0 + 0.01, ys1 - 0.01, zr, W.LED, W.LED); V4(-0.021, -0.007, ys0 + 0.01, ys1 - 0.01, zr, k(W.LED, 0.08), k(W.LED, 0.5)); V4(0.007, 0.021, ys0 + 0.01, ys1 - 0.01, zr, k(W.LED, 0.5), k(W.LED, 0.08));
  V4(-0.07, -0.022, ys0, ys1, zf + 0.0035, Z0, k(W.LED, 0.16)); V4(0.022, 0.07, ys0, ys1, zf + 0.0035, k(W.LED, 0.16), Z0);
  const xs = X + 0.135 + 0.0045; [[1.12, W.LEDg], [1.06, W.LEDw], [1.0, W.LEDr]].forEach(([y, c]) => q.push([[xs, y - 0.009, ZC + 0.011], [xs, y - 0.009, ZC + 0.029], [xs, y + 0.009, ZC + 0.029], [xs, y + 0.009, ZC + 0.011], c, c, c, c]));
  return q; };
const lfCar4 = (O) => { const L = D.LIFT, g = pbGB(), zf = L.z + L.hz, W = LFC, ph = LFT[4].ph, cy = lfYoke(g, O, { boss: W.WH, bossT: W.WHt, gz: zf + 0.083 });
  lfPlateCar(g, O, cy, ph, { hx: 0.165, hz: 0.028, ch: 0.024, gx: 0.146, ribs: [0.22, 0.5], rib: W.WH, ribT: W.WHt, ribH: 0.03, guide: W.WHs, guideT: W.WH, bolts: false, latch: false });
  return lfCarOut(g); };
// ==== 5: DVOJNI STEBER ZADAJ (two slim columns, a cross beam on top, the carriage between them) ====
const lfCol5 = (O) => { const L = D.LIFT, g = pbGB(), X = L.x, zf = L.z + L.hz, C = PBC, XC = 0.17, HXc = 0.06, HZc = 0.09, ZC = zf - HZc, zb = ZC - HZc, CH = 0.015, TOP = LFT[5].top, BEV = lfMix(O.OR, [1, 0.95, 0.86], 0.3);
  lfPlate(g);
  const fy1 = 0.034, fz1 = zf - 0.004, fz0 = zb - 0.02; pbGl(g, PBGL.PAINT); pbBox(g, X, 0.012, (fz0 + fz1) / 2, 0.48, fy1 - 0.012, fz1 - fz0, C.GR, C.GRt);
  pbGl(g, PBGL.METAL); for (const [bx, bz] of [[-0.215, ZC - 0.05], [0.215, ZC - 0.05], [-0.215, ZC + 0.05], [0.215, ZC + 0.05], [-0.05, fz0 + 0.012], [0.05, fz0 + 0.012]]) pbCyl(g, [X + bx, fy1 + 0.007, bz], 'y', 0.013, 0.014, 6, C.ZN, C.ZNt);
  for (const sx of [-1, 1]) { const cx = X + sx * XC, xi = X + sx * (XC - HXc);
    pbGl(g, PBGL.PAINT); pbPrism(g, cx, ZC, HXc, HZc, CH, fy1, 0.22, C.BLK); lfFootHz(g, cx, ZC, HXc, HZc, fy1, 0.22, 0.06, 0.018);
    pbPrism(g, cx, ZC, HXc, HZc, CH, 0.22, TOP, [O.OR, BEV, O.OR, O.HI2, O.OR, O.HI2, O.OR, BEV], null);
    // the track on its inner face (a dark channel, zinc lips), the lock's notches in the left one
    pbBox(g, xi - sx * 0.003, 0.26, ZC + 0.025, 0.006, TOP - 0.34, 0.036, C.SLOT, C.SLOT); pbGl(g, PBGL.METAL); for (const dz of [-0.021, 0.021]) pbBox(g, xi - sx * 0.004, 0.25, ZC + 0.025 + dz, 0.008, TOP - 0.32, 0.006, C.ZN, C.ZNt);
    if (sx < 0) { pbGl(g, PBGL.PAINT); for (let y = 0.4; y < TOP - 0.15; y += 0.07) pbBox(g, xi - sx * 0.0062, y, ZC + 0.025, 0.0015, 0.022, 0.024, C.TOOTH, C.TOOTH); } }
  // the cross beam on top (its edges cut and lit, a dark line along its front), its dark cap and bolts; the tie at the columns' backs
  pbGl(g, PBGL.PAINT); pbPrism(g, X, ZC, 0.235, HZc, 0.02, TOP, TOP + 0.12, [O.OR, BEV, O.OR, O.HI2, O.OR, O.HI2, O.OR, BEV], O.ORt); pbBox(g, X, TOP + 0.05, zf + 0.0008, 0.39, 0.018, 0.0016, O.RIB);
  pbBox(g, X, TOP + 0.12, ZC, 0.47, 0.016, 2 * HZc + 0.01, C.CAP, C.CAPt); pbGl(g, PBGL.METAL); for (const bx of [-0.17, 0.17]) for (const dz of [-0.05, 0.05]) pbCyl(g, [X + bx, TOP + 0.14, ZC + dz], 'y', 0.011, 0.008, 6, C.AR, C.ZN);
  pbGl(g, PBGL.PAINT); pbBox(g, X, 1.3, zb + 0.012, 0.22, 0.08, 0.024, O.OR, O.ORt); pbBox(g, X, 0.62, zb + 0.012, 0.22, 0.06, 0.024, O.OR, O.ORt);
  // the power unit behind (its plate across the two backs), the controls on the right column's side, a warning label
  lfPU(g, X, zb, fy1, { hx: X + XC }); lfCtl(g, X + XC + HXc, ZC - 0.005, 0.98, undefined, 0.04); pbGl(g, PBGL.PAINT); pbBox(g, X + XC, 1.36, zf + 0.002, 0.09, 0.12, 0.003, C.WHITE); pbSign(g, [X + XC, 1.42, zf + 0.0037], [1, 0, 0], [0, 1, 0], 0.075, '!');
  return lfGeo(g); };
const lfCar5 = (O) => { const L = D.LIFT, g = pbGB(), zf = L.z + L.hz, C = PBC, ph = LFT[5].ph, ZP = -1.632, cols = [O.OR, O.HI, O.OR, O.HI2, O.OR, O.HI2, O.OR, O.HI], cy = lfYoke(g, O, { gz: ZP + 0.036 + 0.025 });
  // the plate between the columns (its shoes in their tracks), joined to the yoke under it; ribs, a label, bolts, the lock's latch
  pbGl(g, PBGL.PAINT); pbBox(g, 0, cy, (ZP - 0.036 + zf) / 2, 0.208, 0.075, zf - (ZP - 0.036), O.OR, O.ORt); pbPrism(g, 0, ZP, 0.104, 0.036, 0.01, cy + 0.075, cy + ph, cols, O.ORt);
  const zfc = ZP + 0.036; for (const y of [0.24, 0.48]) World.box(g, 0, cy + y, zfc + 0.004, 0.18, 0.03, 0.008, 0, O.RIB, O.OR); pbSign(g, [0, cy + 0.36, zfc + 0.0002], [1, 0, 0], [0, 1, 0], 0.075, '!');
  pbGl(g, PBGL.METAL); for (const sx of [-1, 1]) for (const y of [0.1, ph - 0.1]) World.box(g, sx * 0.106, cy + y, zf - 0.09 + 0.025, 0.012, 0.08, 0.034, 0, C.ZN, C.ZNt);
  for (const [bx, by] of [[-0.075, 0.13], [0.075, 0.13], [-0.075, ph - 0.05], [0.075, ph - 0.05]]) pbCyl(g, [bx, cy + by, zfc + 0.004], 'z', 0.01, 0.008, 6, C.AR, C.ZN);
  const ly = ph - 0.13; World.box(g, 0, cy + ly, zfc + 0.015, 0.08, 0.07, 0.03, 0, C.AR); pbObox(g, [0.04, cy + ly + 0.025, zfc + 0.036], [0.12, cy + ly + 0.055, zfc + 0.036], 0.014, 0.01, [0.72, 0.12, 0.09]);
  return lfCarOut(g); };
// ==== 6: STENSKA KONZOLA (a graphite column out of a heavy faceted plinth, an orange LED line, the large orange boom) ====
const lfOct = (x0, x1, z0, z1, c) => [[x1 - c, z1], [x0 + c, z1], [x0, z1 - c], [x0, z0 + c], [x0 + c, z0], [x1 - c, z0], [x1, z0 + c], [x1, z1 - c]];
const lfCol6 = (O) => { const L = D.LIFT, g = pbGB(), X = L.x, zf = L.z + L.hz, C = PBC, W = LFC, TOP = LFT[6].top, S = 0.025, R = 0.026, PT = 0.42;
  lfPlate(g, { line: O.OR, pl: [0.16, 0.17, 0.19], plt: [0.21, 0.22, 0.25], bolt: W.GPe, boltT: W.SAT });
  // the plinth: faceted (its sides and back sloping in, its front upright at the column's face), graphite, an orange chamfer round its
  // top; vent slits on its back slope (the power unit inside)
  const gcol = (n) => Math.abs(n[0]) > 0.3 && Math.abs(n[2]) > 0.3 ? W.GPe : n[1] > 0.5 ? W.GPt : W.GP;
  const p0 = lfOct(X - 0.24, X + 0.24, -2.03, zf, 0.05), p1 = lfOct(X - 0.2, X + 0.2, -1.97, zf, 0.04), p2 = lfOct(X - 0.185, X + 0.185, -1.955, zf - 0.012, 0.035);
  pbGl(g, PBGL.PLATE); lfLoft(g, p0, 0.012, p1, PT, gcol); pbGl(g, PBGL.PAINT); lfLoft(g, p1, PT, p2, PT + 0.015, () => O.OR); pbGl(g, PBGL.PLATE); lfCap(g, p2, PT + 0.015, W.GPt);
  const bz = (y) => -2.03 + (y - 0.012) / (PT - 0.012) * 0.06, sl = Math.hypot(0.06, PT - 0.012), ny = 0.06 / sl, nz = -(PT - 0.012) / sl;
  for (const y of [0.07, 0.11, 0.15, 0.19]) { const za = bz(y), zb2 = bz(y + 0.014), o = 0.0012; g.quadO([X - 0.13, y, za + nz * o], [X + 0.13, y, za + nz * o], [X + 0.13, y + 0.014, zb2 + nz * o], [X - 0.13, y + 0.014, zb2 + nz * o], C.SLOT, [X, y, -1.8]); }
  // the column: tapering up, its cut edges lit, its front upright at the face, cut round the track
  const cb = lfOct(X - 0.15, X + 0.15, -1.835, zf, 0.04), ct = lfOct(X - 0.125, X + 0.125, -1.81, zf, 0.03), y0 = PT + 0.015, ys0 = 0.52, ys1 = TOP - 0.1;
  pbGl(g, 1.3); lfLoft(g, cb, y0, ct, TOP, gcol, (n) => n[2] > 0.99);
  const xa = (y) => 0.11 - (y - y0) / (TOP - y0) * 0.015, fq = (x0s, x1s, a, b) => { const xx = (s, y) => s === 'L' ? -xa(y) : s === 'R' ? xa(y) : s; g.quadO([X + xx(x0s, a), a, zf], [X + xx(x1s, a), a, zf], [X + xx(x1s, b), b, zf], [X + xx(x0s, b), b, zf], W.GP, [X, (a + b) / 2, -1.72]); };
  fq('L', -S, y0, TOP); fq(S, 'R', y0, TOP); fq(-S, S, y0, ys0); fq(-S, S, ys1, TOP);
  const zr = zf - R, DK = [0.05, 0.05, 0.06]; g.quadO([X - S, ys0, zf], [X - S, ys0, zr], [X - S, ys1, zr], [X - S, ys1, zf], DK, [X - S - 0.05, ys0, zr]); g.quadO([X + S, ys0, zf], [X + S, ys0, zr], [X + S, ys1, zr], [X + S, ys1, zf], DK, [X + S + 0.05, ys0, zr]);
  g.quadO([X - S, ys0, zf], [X + S, ys0, zf], [X + S, ys0, zr], [X - S, ys0, zr], W.GPt, [X, ys0 - 0.05, zr]); g.quadO([X - S, ys1, zf], [X + S, ys1, zf], [X + S, ys1, zr], [X - S, ys1, zr], DK, [X, ys1 + 0.05, zr]);
  g.quadO([X - S, ys0, zr], [X + S, ys0, zr], [X + S, ys1, zr], [X - S, ys1, zr], [0.3, 0.16, 0.08], [X, ys0, zr - 0.05]);
  // the cap: its edges cut (lit), an orange line along its front
  pbGl(g, PBGL.PAINT); const cti = lfOct(X - 0.105, X + 0.105, -1.79, zf - 0.02, 0.02); lfLoft(g, ct, TOP, cti, TOP + 0.03, gcol); lfCap(g, cti, TOP + 0.03, W.GPt);
  pbBox(g, X, TOP - 0.016, zf + 0.0012, 2 * xa(TOP) - 0.02, 0.012, 0.0024, O.OR, O.HI);
  // the controls on the side (graphite), a small warning label on the plinth's side
  lfCtl(g, X + 0.143, -1.72, 0.98, W.GPt); pbSign(g, [X + 0.2186, 0.24, -1.82], [0, 0, -1], [-0.0976, 0.9952, 0], 0.07, '!');
  return lfGeo(g); };
const lfGlow6 = (O) => { const L = D.LIFT, X = L.x, zf = L.z + L.hz, TOP = LFT[6].top, ys0 = 0.52, ys1 = TOP - 0.1, zr = zf - 0.026 + 0.0015, W = LFC, k = (c, f) => c.map(x => x * f), Z0 = [0, 0, 0];
  const q = [], V4 = (x0, x1, y0, y1, z, c0, c1) => q.push([[X + x0, y0, z], [X + x1, y0, z], [X + x1, y1, z], [X + x0, y1, z], c0, c1, c1, c0]);
  V4(-0.006, 0.006, ys0 + 0.01, ys1 - 0.01, zr, W.LEDo, W.LEDo); V4(-0.024, -0.006, ys0 + 0.01, ys1 - 0.01, zr, k(W.LEDo, 0.1), k(W.LEDo, 0.55)); V4(0.006, 0.024, ys0 + 0.01, ys1 - 0.01, zr, k(W.LEDo, 0.55), k(W.LEDo, 0.1));
  V4(-0.07, -0.025, ys0, ys1, zf + 0.0012, Z0, k(W.LEDo, 0.2)); V4(0.025, 0.07, ys0, ys1, zf + 0.0012, k(W.LEDo, 0.2), Z0);
  return q; };
const lfCar6 = (O) => { const L = D.LIFT, g = pbGB(), zf = L.z + L.hz, C = PBC, W = LFC, ph = LFT[6].ph, cy = lfYoke(g, O, { bar: false, gusset: false, boss: W.GP, bossT: W.GPe });
  // the boom: faceted, from the column's face to the game's front (z -1.393), its back and top falling away to the pins; a graphite band
  // along its front; the plate up the column (a graphite panel in it)
  const zb = zf, zr = -1.393, ST = [[-0.72, 0.075, 0.072], [-0.46, 0.15, 0.1], [-0.2, 0.27, 0.13], [0, 0.32, 0.14], [0.2, 0.27, 0.13], [0.46, 0.15, 0.1], [0.72, 0.075, 0.072]];
  const sec = ([x, tb, tf]) => { const c2 = Math.min(0.03, tf * 0.4); return [[x, cy, zb], [x, cy + tb, zb], [x, cy + tf, zr - c2], [x, cy + tf - c2, zr], [x, cy, zr]]; }, FC = [O.DKO, O.ORt, O.HI, O.OR, O.DKO];
  pbGl(g, PBGL.PAINT); for (let s = 0; s + 1 < ST.length; s++) { const a = sec(ST[s]), b = sec(ST[s + 1]), ins = [(ST[s][0] + ST[s + 1][0]) / 2, cy + 0.04, (zb + zr) / 2];
    for (let k = 0; k < 5; k++) { const k1 = (k + 1) % 5; g.quadO(a[k], b[k], b[k1], a[k1], FC[k], ins); } }
  for (const e of [0, ST.length - 1]) { const p = sec(ST[e]), ins = [0, cy + 0.04, (zb + zr) / 2]; for (let k = 1; k + 1 < 5; k++) g.triO(p[0], p[k], p[k + 1], O.DKO, ins); }
  g.quadO([-0.7, cy + 0.012, zr + 0.0008], [0.7, cy + 0.012, zr + 0.0008], [0.7, cy + 0.034, zr + 0.0008], [-0.7, cy + 0.034, zr + 0.0008], W.GP, [0, cy, -1.5]);
  const zfc = lfPlateCar(g, O, cy, ph, { hx: 0.17, hz: 0.03, ch: 0.022, guides: false, bolts: false, sign: false, latch: false, ribs: [] });
  pbBox(g, 0, cy + 0.36, zfc + 0.0008, 0.22, ph - 0.44, 0.0016, W.GP); pbBox(g, 0, cy + ph - 0.06, zfc + 0.0008, 0.22, 0.012, 0.0016, O.HI);
  return lfCarOut(g); };
// ---- the six (top: the column's body top, its cap over it; ph: the carriage plate's height (at the SAMUM's 1.35 m its top under the
//      column's top); TELESKOPSKI: hb, ht the head's underside and top at rest) ----
const LFT = {
  1: { nm: 'Izpopolnjeno', col: lfCol1, car: lfCar1, ph: 0.7, top: 2.715 },
  2: { nm: 'Teleskopski', col: lfCol2, car: lfCar2, ph: null, hb: 1.12, ht: 1.25, top: 0.98 },
  3: { nm: 'Industrijski', col: lfCol3, car: lfCar3, ph: 0.69, top: 2.68 },
  4: { nm: 'Eleganten razstavni', col: lfCol4, car: lfCar4, glow: lfGlow4, ph: 0.74, top: 2.74 },
  5: { nm: 'Dvojni steber zadaj', col: lfCol5, car: lfCar5, ph: 0.62, top: 2.62 },
  6: { nm: 'Stenska konzola', col: lfCol6, car: lfCar6, glow: lfGlow6, ph: 0.7, top: 2.7 } };
// the LED line's mesh (quads [a, b, c, d, colours a..d]): additive, unlit, over 1 (it glows in the HDR picture); the piece's dissolve
const lfGlowMesh = (quads) => { const L = D.LIFT, P = [], Cc = [], v = (p, c) => { P.push(p[0], p[1], p[2]); Cc.push(c[0], c[1], c[2]); };
  quads.forEach(([a, b, c, d, ca, cb, cc, cd]) => { v(a, ca); v(b, cb); v(c, cc); v(a, ca); v(c, cc); v(d, cd); });
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(P, 3)); geo.setAttribute('color', new T.Float32BufferAttribute(Cc, 3)); geo.computeBoundingSphere();
  const m = new T.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  m.onBeforeCompile = (sh) => { sh.uniforms.uHide = L.piece.u; sh.fragmentShader = 'uniform float uHide;\n' + sh.fragmentShader.replace('void main() {', 'void main() {\n\tif (uHide > 0.0 && fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) < uHide) discard;'); };
  m.customProgramCacheKey = () => 'lfGlowHide'; const mesh = new T.Mesh(geo, m); mesh.userData.lfGlow = true; return mesh; };
// <<<< LF (the six lifts)
// the game's lift back (its column geometry, its carriage and arms' build and the carriage's mesh) when PB built its own (LF: the arms'
// mesh's geometry back too, the LED line away)
const pbLiftOff = () => { const L = D.LIFT; if (!L || !L._pb) return; const o = L._pb; o.mesh.geometry.dispose(); o.mesh.geometry = o.geo; L.cmesh.geometry.dispose(); L.cmesh.geometry = o.cgeo;
  if (o.ageo) { L.mesh.geometry.dispose(); L.mesh.geometry = o.ageo; } if (o.glow) { if (o.glow.parent) o.glow.parent.remove(o.glow); o.glow.geometry.dispose(); o.glow.material.dispose(); }
  L.geo = o.B; L.n0 = o.n0; delete L._pb; if (D.poseLift) D.poseLift(); };
// the new lift (after wLiftColour: v its variant; LF: PBL.type its design, 0 PB's (the game's arms), 1..6 LFT's (their own arms, LED
// lines)); returns its load before / after (meshes, vertices)
const pbLift = (v) => { const L = D.LIFT; if (!L || !L.piece || !L.geo || !L.cmesh) return null; pbLiftOff();
  const mesh = L.piece.root.children.find(o => o.isMesh && o !== L.cmesh && !o.userData.wBand && o.geometry.attributes.gloss); if (!mesh) return null;
  const ty = PBL.type || 0, Dz = LFT[ty] || null, O = pbPaint(v), B0 = L.geo, n0 = L.n0, n = B0.arm.length, before = { column: mesh.geometry.attributes.position.count, carriage: n0, arms: n - n0 };
  const geo = Dz ? Dz.col(O) : pbColumnGeo(O), cg = Dz ? Dz.car(O) : pbCarriage(O), ag = Dz ? lfArms(lfArmsOf(O, ty)) : null, m = cg.n, na = ag ? ag.n : n - n0, N = m + na;
  const B = { P: new Float32Array(N * 3), N: new Float32Array(N * 3), C: new Float32Array(N * 3), gl: new Float32Array(N), arm: new Int8Array(N), kd: new Uint8Array(N), kp: new Uint8Array(N), kr: new Uint8Array(N) };
  B.P.set(cg.P, 0); B.N.set(cg.N, 0); B.C.set(cg.C, 0); B.gl.set(cg.gl, 0); B.arm.fill(-1, 0, m);
  if (ag) { B.P.set(ag.P, m * 3); B.N.set(ag.N, m * 3); B.C.set(ag.C, m * 3); B.gl.set(ag.gl, m); B.arm.set(ag.arm, m); B.kd.set(ag.kd, m); B.kp.set(ag.kp, m); B.kr.set(ag.kr, m); }
  else { B.P.set(B0.P.subarray(n0 * 3), m * 3); B.N.set(B0.N.subarray(n0 * 3), m * 3); B.C.set(B0.C.subarray(n0 * 3), m * 3); B.gl.set(B0.gl.subarray(n0), m); B.arm.set(B0.arm.subarray(n0), m); B.kd.set(B0.kd.subarray(n0), m); B.kp.set(B0.kp.subarray(n0), m); B.kr.set(B0.kr.subarray(n0), m); }
  const dyn = (k, gl) => { const q = new T.BufferGeometry(); for (const [nm, kk] of [['position', 3], ['normal', 3], ['color', 3]]) q.setAttribute(nm, new T.BufferAttribute(new Float32Array(k * kk), kk).setUsage(T.DynamicDrawUsage));
    q.setAttribute('gloss', new T.BufferAttribute(gl, 1)); q.boundingSphere = new T.Sphere(V(L.x, 1.2, -0.6), 3.4); return q; };
  const cgeo = dyn(m, B.gl.slice(0, m)), ageo = ag ? dyn(na, B.gl.slice(m)) : null, glow = Dz && Dz.glow ? lfGlowMesh(Dz.glow(O)) : null;
  L._pb = { mesh, geo: mesh.geometry, cgeo: L.cmesh.geometry, ageo: ageo ? L.mesh.geometry : null, glow, B: B0, n0 }; mesh.geometry = geo; L.cmesh.geometry = cgeo; if (ageo) L.mesh.geometry = ageo; if (glow) L.piece.root.add(glow);
  L.geo = B; L.n0 = m; if (D.poseLift) D.poseLift();
  geo.computeBoundingBox(); const after = { column: geo.attributes.position.count, carriage: m, arms: na, glow: glow ? glow.geometry.attributes.position.count : 0 }, top = +geo.boundingBox.max.y.toFixed(3);
  return (PBL.info = { v: v || null, type: ty, nm: Dz ? Dz.nm : 'PB', top: Dz ? Dz.top : PBL.top, capTop: Dz ? top : +(PBL.top + PBL.cap + 0.008).toFixed(3), meshes: glow ? 4 : 3, before, after, verts: { before: before.column + before.carriage + before.arms, after: after.column + after.carriage + after.arms + after.glow } }); };
// <<<< PB BLOCK
// >>>> GM BLOCK (agent GM)
// ==== GM: TWO TYRE SETS GO (THE ONES THE CAR COVERS), THE BACK LIGHT BLUE WITH SHADOWS AND SLOTS (agent GM; the user, on PB's P3, the
//      slotted pegboard: "P3. Zbriši 2 kompleta gum v regalih, kjer sem označil, ker težko klikneš na njih, ker jih prekriva avto. Zato naj
//      bosta ta dva regala prazna. Sedaj lahko izbiraš samo še med 3 vrstami gum. Naredi, da so plošče take, kot so bile prej na drugi
//      sliki zgoraj, modre s sencami, in dodaj jim reže. Okrogle trodelne."). The rest of GM, marked "GM:" where it is: RG.GM (the
//      version), bgVer (GMV first), bgBackBand (gmBackBand), regalAll (the tyre sets of GMG's bays are not built: their places on storey A
//      stay empty, no tyres, no shadows; the board and the back stay; out.gm), pbParts (a tyre set's bay from its userData.si).
//   RG.GM 1: L3 version A's light-blue back (the game's light blue FO.blue × each storey's shade 0.78 / 0.86 / 0.94 / 0.98 as there, and
//   the soft shade under each board, at the sides, at the foot and in the top corners exactly as L3's AOT / aoTexH, drawn in metres) with
//   P3's oblong slots cut in it (0.7 × 2.2 cm on a 3.4 × 4 cm grid, every second row half a step over): each slot a navy well in the
//   blue's own tone with a faintly lit lower lip and a shaded upper rim, calmer than P3's near-black wells. Unlit (MeshBasic) as before:
//   the regal's light and the room's do not change. Over it BG version 1's navy perforated posts (storey D's front posts too), PB's lift,
//   no lit panels on top; the soft shadows stay navy (as L3's, made for the light blue). The back's bands run 5 cm behind the posts
//   between two bays as BG's (one texture for the storeys, one for the top band; the end bays use a part of it: their UVs). RG.GM 2: the
//   same back without the slots (only the reference of the measures).
//   GMG: storey A's bays whose tyre sets are gone: the two the car covers most in the first view (GM's measure: bay 2 Cesta, bay 1 Makadam)
const GMV = {
  1: { oz: 'Svetlo modra plošča z režami', st: 'temno modri perforirani stebri', back: 'gm', posts: 'navy', gm: { slots: true } },
  2: { oz: 'Svetlo modra plošča brez rež (primerjava)', st: 'temno modri perforirani stebri', back: 'gm', posts: 'navy', gm: { slots: false } } };
const GMG = [1, 2];
const gmGone = (i) => !!(RG.GM && GMV[RG.GM] && GMG.includes(i));
// the slots (P3's sizes) and their tones, as multipliers of the light blue (0..255 on a base of GMS.base: the material's colour is the blue
// × the storey's shade × 255 / base, so the plain sheet is exactly L3's blue and the lip a touch lighter): well, rim (the upper edge in
// shade), lip (the lower edge in light), wall (the well's upper wall, darker)
const GMS = { px: 0.034, py: 0.04, sw: 0.007, sh: 0.022, base: 236, well: [105, 125, 158], rim: [190, 199, 213], lip: 250, wall: 0.14 };   // (GM's tone test E of A..E:
// the crop's back step (the mean L* step between neighbouring back pixels, its busyness) 3.1 (P3 5.2, no slots 0.75), the parts' edges ΔE 42.7 (P3 35.9))
// a band's texture: the sheet (slots or not), then L3's shading over a W3 × Hm band (AOT 128 × 128 stretched over a storey, aoTexH's
// 128 × round(128 h / 0.49) over the top band), at L3's place (its band was W3 = L - 0.07 wide, centred); the canvas covers Wf (the middle
// bay's band with its 5 cm behind each side's posts); xm: metres from the bay's middle
const gmBackTex = (top, W3, Wf, Hm, slots) => { const key = 'gm:' + (top ? 't' : 's') + ':' + W3.toFixed(3) + ':' + Wf.toFixed(3) + ':' + Hm.toFixed(4) + ':' + (slots ? JSON.stringify([GMS.well, GMS.rim, GMS.lip, GMS.wall, GMS.base]) : 0); if (BGTX[key]) return BGTX[key];
  const CW = 1024, CH = 512, c = document.createElement('canvas'); c.width = CW; c.height = CH; const g = c.getContext('2d'), sx = CW / Wf, sy = CH / Hm, K = GMS;
  const X = (xm) => (xm + Wf / 2) * sx, Y = (ym) => ym * sy, col = (a) => (Array.isArray(a) ? `rgb(${a[0]},${a[1]},${a[2]})` : `rgb(${a},${a},${a})`);
  g.fillStyle = col(K.base); g.fillRect(0, 0, CW, CH);
  if (slots) { const shape = (cx, cy, dy, grow) => { const w = K.sw * sx + 2 * grow, h = K.sh * sy + 2 * grow, r = Math.min(w, h) / 2; g.beginPath(); if (g.roundRect) g.roundRect(cx - w / 2, cy + dy - h / 2, w, h, r); else g.rect(cx - w / 2, cy + dy - h / 2, w, h); g.fill(); };
    let row = 0; for (let yy = K.py / 2; yy < Hm; yy += K.py, row++) { const off = (row & 1) ? 0 : K.px / 2, n = Math.ceil(Wf / 2 / K.px) + 1;
      for (let j = -n; j <= n; j++) { const xx = j * K.px + off; if (Math.abs(xx) > Wf / 2 + 0.01) continue; const cx = X(xx), cy = Y(yy);
        g.fillStyle = col(K.lip); shape(cx, cy, 1.1, 0.25); g.fillStyle = col(K.rim); shape(cx, cy, -0.8, 0.25); g.fillStyle = col(K.well); shape(cx, cy, 0, 0);
        g.fillStyle = `rgba(0,0,0,${K.wall})`; shape(cx, cy, -0.9, -1.0); } } }
  // L3's shading (AOT: under the board above 0.55 over 52 px, the sides 0.3 over 22 px, the foot 0.22 over 16 px, the top corners 0.35 in 46 px)
  const HP = top ? Math.max(128, Math.round(128 * Hm / 0.49)) : 128, ux = W3 / 128, uy = Hm / HP, AX = (p) => X(-W3 / 2 + p * ux), AY = (p) => Y(p * uy);
  const lin = (x0, y0, x1, y1, a) => { const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, CW, CH); };
  lin(0, AY(0), 0, AY(52), 0.55); lin(AX(0), 0, AX(22), 0, 0.3); lin(AX(128), 0, AX(106), 0, 0.3); lin(0, AY(HP), 0, AY(HP - 16), 0.22);
  const cr = (p) => { g.save(); g.setTransform(ux * sx, 0, 0, uy * sy, AX(p), AY(0)); const gr = g.createRadialGradient(0, 0, 0, 0, 0, 46); gr.addColorStop(0, 'rgba(0,0,0,0.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(-60, 0, 120, 128); g.restore(); }; cr(0); cr(128);
  const t = new T.CanvasTexture(c); t.anisotropy = 8; return (BGTX[key] = t); };
// one band of a bay's back (bgBackBand's, for GMV): the plane as BG's (5 cm behind the posts next to a bay), its UVs the part of the middle
// bay's texture it covers; the material: the light blue × the storey's shade (as L3's bayBackAO / bayBackAOH)
const GMMAT = {};
const gmBackBand = (sc, i, top, y0, y1, col, f, v) => { const ext = BGP.ext, eL = sc.k > 0 ? ext : 0, eR = sc.k < sc.nb - 1 ? ext : 0, Wm = sc.L - BGP.planeW, Wf = Wm + 2 * ext, Hm = y1 - y0 - 0.01;
  const tex = gmBackTex(i === top, sc.L - 0.07, Wf, Hm, v.gm.slots), key = tex.uuid + ':' + f + ':' + col;
  const mat = GMMAT[key] || (GMMAT[key] = new T.MeshBasicMaterial({ map: tex, color: new T.Color(col).multiplyScalar(f * 255 / GMS.base) }));
  const geo = new T.PlaneGeometry(Wm + eL + eR, Hm), uv = geo.attributes.uv, u0 = (ext - eL) / Wf, u1 = 1 - (ext - eR) / Wf; for (let k = 0; k < uv.count; k++) uv.setX(k, u0 + uv.getX(k) * (u1 - u0));
  const m = new T.Mesh(geo, mat); m.position.set((eR - eL) / 2, (y0 + y1) / 2, -sc.D / 2 + 0.045); m.userData.bgBack = i; m.userData.gmBack = true; sc.g.add(m); return m; };
// <<<< GM BLOCK
const regalAll = (S, W, o = {}) => { S.segs.forEach(sg => { sg.g.visible = false; }); const par = PR.group(), M = MT(), A = rgAngles(S), out = { A, par }, BLUE = FO.blue || 0x8fd0f5;
  const GB = 4, BOARDS = { 0: [0, 1, 2, 3], 1: [0, 1, 2, 3], 2: [0, 1, 2, 3], 3: [0, 1, 2, 3], 4: [0, 1, 2, 3] };   // (IDEA 5: bay 4 gets D's board too, the floor of its tuning parts)   // (bay 4 (v2): A, B, C as the others, no D: open over C; no E board anywhere, as in h)
  const BT = rgBackTop(), secs = A.a.map((a, k) => { const sc = rgFrame(par, a, A.L, 0.66, RG.TOP, { front: RG.FRONT, backTop: BT }); BOARDS[k].forEach(lv => rgBoard(sc, RG.LV[lv]));
    // (v3) the back's bands: one a storey under each board, the game's light blue a little darker the lower it is (as before), and over the
    // last board (D's; bay 4's C) one band up to the back's top in the same light blue, shaded as the storeys (bayBackAOH): no pale band
    const ys = BOARDS[k].map(lv => RG.LV[lv]).concat([BT + 0.01]), ao = [0.78, 0.86, 0.94, 0.98];
    sc.k = k; sc.nb = A.a.length; sc.backs = []; for (let i = 0; i + 1 < ys.length; i++) sc.backs.push(bgBackBand(sc, i, ys.length - 2, ys[i] + 0.02, ys[i + 1] - 0.01, BLUE, i === ys.length - 2 ? 0.98 : ao[i]));   // (BG: the bands in the version's background (RG.BG; null: the light blue as before, bayBackAO / bayBackAOH))
    return sc; }); out.secs = secs;
  // A: the tyre sets (X0: bay 4's the Gorska set, TSETS[4], the end section's); B and C: the exhausts (bays 0..2) and the rims (bays 3 and 4;
  // X0: bay 4's the end section's two kinds); the spoilers on top
  out.tyres = secs.map((sc, i) => { if (gmGone(i)) return null;   // (GM: the two tyre sets the car covers most are gone (GMG): their places stay empty)
    const g = new T.Group(); g.position.set(0, RG.LV[0] + 0.018, 0.04); sc.g.add(g); tyreSet(g, i, 'row'); g.scale.setScalar(l3TyreScale(i)); g.userData.tyreScale = l3TyreScale(i); g.userData.si = i; g.userData.r = TSETS[i][3]; g.userData.kind = TSETS[i][2];   // (X0: bay 4 (GB) as the others: TSETS[4] Gorska, was B4.tyre)
    shadowB(g, 1.22, 0.66, 0.1, 0.26, -sc.D / 2 + 0.01, 0.8, false); shadowB(g, 1.18, 0.42, 0.05, 0.003, -0.04, 0.85, true); return g; }).filter(Boolean);   // (GM: only the sets that stay; each its bay in userData.si)
  out.exh = []; out.rims = [];
  [1, 2].forEach((lv, li) => { [0, 1, 2].forEach((si, j) => { const g = new T.Group(); g.position.set(0, RG.LV[lv] + 0.018, 0); secs[si].g.add(g); out.exh.push({ si, sec: secs[si], lv, g, e: exhOnStands(g, M, li * 3 + j, secs[si]) }); });
    const g = new T.Group(); g.position.set(0, RG.LV[lv] + 0.018, 0); secs[3].g.add(g); out.rims.push({ si: 3, sec: secs[3], lv, g, ps: rimsOn2(g, RIM4[li * 2], secs[3]), nm: RIM4[li * 2].nm });
    const g4 = new T.Group(), R4 = RIM4[li * 2 + 1]; g4.position.set(0, RG.LV[lv] + 0.018, 0); secs[GB].g.add(g4); const ps4 = rimsOn2(g4, R4, secs[GB]);   // (X0: B the orange 10-spoke (RIM4[1]), C the black mesh (RIM4[3]), the end section's; no nuts, as bay 3's; were B4.rims)
    out.rims.push({ si: GB, sec: secs[GB], lv, g: g4, ps: ps4, nm: R4.nm }); });
  l3StandShadows(out);   // (L3: the exhaust stands' shadows: soft contact shadows under the feet, the exhausts' own shadows cast by the key light, no dark bands)
  out.wings = secs.map((sc, i) => { const g = new T.Group(); g.position.set(0, RG.TOP + 0.005, 0); sc.g.add(g); const fo = FO.wsc; if (RG.WSC) FO.wsc = RG.WSC; wingTop(g, i); FO.wsc = fo;
    g.position.z += RG.WZ; wingSeat(sc, g); return g; });
  // V1: NO TAIL LAMPS ON THE REGAL ANY MORE (the user: "Luči, ki so pri auspuhih, prestavi na omarico, ki je pred avtom"): the row along C's
  // front edge in bays 1 and 2 (tailRow: the lamps, their cradles) and the sign ZADNJE LUČI on bay 1 are gone; the tail lamps stand on the
  // left front cabinet's top now (frontRegal, vTailTop). The exhausts stay where they were: every exhaust stands in the middle of its bay
  // (x 0, z 0.02, as bay 0's, which never had lamps), so bays 1 and 2 on C look as bay 0 on C. st.regal.luci is the cabinet's tail lamps
  // (set by storesAll), st.regal.signs has no 'zadnje'
  out.signs = {};
  out.tun = u5Shelf(secs);   // (IDEA 5: the tuning parts on show on the upper shelf)
  exhMetal(out);   // (EXH: the exhausts' metal (and the same chrome elsewhere on the regal) as polished metal, not blown out to white)
  wingLight(out, WLV[RG.WL] ? RG.WL : null);   // (R: the spoilers' light, one of six versions (RG.WL; null: as before); L3: only R's L1..L6 here)
  // (BG: NO LIT PANELS ON THE TOP any more (the user: "Zbriši plošče v zgornjem regalu"): L3's l3Panels is not called, the spoilers stand on the
  //  top board with only the garage's wall behind them; RG.WL keeps R's L1..L6 (wingLight), null as today)
  out.bg = { v: RG.BG, nm: bgVer() ? bgVer().oz + ' · ' + bgVer().st : null, posts: secs[0].posts.style, frontUp: BGP.frontUp };
  bgShadows(out);   // (BG: the soft shadows in the version's shadow colour (BGV sh))
  pbExtras(out);   // (PB: the version's extras: P4 the painted outlines behind the parts, P6 the hooks (PBV, the PB block))
  out.gm = { v: RG.GM || null, nm: RG.GM && GMV[RG.GM] ? GMV[RG.GM].oz : null, gone: RG.GM ? GMG.map(i => ({ bay: i, kind: TSETS[i][0] })) : [], tyres: out.tyres.map(g => TSETS[g.userData.si][0]) };   // (GM)
  return out; };
// ---- a sign board standing on a bay's top board BEHIND its spoiler (h's signOn, kept for the proposals): 5 cm and more off the spoiler's
//      back (S.dz more), on two legs outside the spoiler's width, its lower edge 1.2 cm over the wing (or S.y0); S: { w, h, x, dz, y0, tex
//      (hNameTex's options) }; a spoiler comes off its seat straight up and then out toward the car, away from the sign. sc a bay
//      (st.regal.secs[k]), wing its spoiler (st.regal.wings[k]) ----
const rgSignOnTop = (sc, wing, txt, S) => { wing.updateMatrixWorld(true); const P = V(); let zb = 9, yt = 0;
  wing.traverse(m => { if (!m.isMesh || !m.geometry || m.geometry.type !== 'BoxGeometry' || !m.visible) return; if (!m.geometry.boundingBox) m.geometry.computeBoundingBox(); const b = m.geometry.boundingBox;   // (each box's own corners)
    for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) { sc.g.worldToLocal(P.set(x, y, z).applyMatrix4(m.matrixWorld)); zb = Math.min(zb, P.z); yt = Math.max(yt, P.y); } });
  const z = zb - 0.05 - 0.006 - (S.dz || 0), y0 = Math.max(yt + 0.012, S.y0 || 0), h = S.h, m = hSignBox(sc.g, txt, S.w, h, S.x || 0, y0 + h / 2, z, S);
  for (const s of [-1, 1]) bx(sc.g, 0.035, y0 + 0.02 - sc.top, 0.035, (S.x || 0) + s * (S.w / 2 - 0.05), (sc.top + y0 + 0.02) / 2, z - 0.024, sc.M.UP);   // (its two legs on the top board, behind it)
  m.userData.sign = { z, y0, yt, zb }; return m; };
// ---- the front regal: the game's two cabinets in front of the car (three and four drawer columns, the gift between them) ONE DRAWER ROW
//      LOWER than the game's (the user: "predali naj bodo 1 nadstropje nižji, ker se zadaj izbire barv gumbov ne vidi": the paint's rings on
//      the floor behind them must show): each column loses its top drawer, its body, sides and strips are cut down by that row and its top
//      comes down with it (0.78 m). The small parts lie in ONE LOW LAYER on the tops (nothing more than ~0.2 m over a top: the home camera's
//      rays to the rings pass 0.2 m over the tops' back edges), each kind in its own place, the stock kind's place empty (pale) while it is
//      on the car, the stock places at the front (seen from the home view). Left: the headlamps standing in a dark tray (a kind a row of
//      four, their lenses to the camera, 3 cm down in the tray). Right: the brake discs standing in a slotted well (a pair a kind, faces to
//      the camera), the grilles standing in a slotted well beside it (both wells sunk into the top: a part's upper half shows, the gripper
//      takes it by its top edge), the calipers lying in a row along the front edge. BASE T: no signs on the cabinets' fronts (the user: "na
//      regalih zbriši žarometi in zavore maske"); the aero model in the left cabinet's middle drawer (aeroDrawer) ----
const FR = { top: 0.782, sink: 0.03 }, LXJ = (j) => -0.3225 + j * 0.215, LROW = (r) => 0.255 - r * 0.12;
const DCX = [-0.555, -0.2], GBX = [-0.19, 0.55], BZ = [-0.27, 0.14], DZK = (k) => 0.105 - k * 0.0514, GZK = (k) => 0.11 - k * 0.072, CALX = (k) => -0.42 + k * 0.21, CALZ = 0.258;
// the game's cabinets a drawer row lower (once a scene): every box of a column that reaches its top is cut down by the row (body, sides,
// the steel strip), what is on its top comes down, the top drawer goes (the two lower rows and what is in them stay)
const zLowerCab = (S) => { if (S._low2) return; S._low2 = true;
  (S.left || []).concat(S.right || []).forEach(m => { const H = m.H, step = (H - 0.24) / m.drs.length;
    m.g.children.forEach(c => { if (!c.isMesh || !c.geometry || c.geometry.type !== 'BoxGeometry') return; const h = c.geometry.parameters.height * c.scale.y, y0 = c.position.y - h / 2, y1 = c.position.y + h / 2;
      if (y0 > H - 0.12) c.position.y -= step; else if (y1 > H - 0.12) { const h2 = h - step; c.scale.y *= h2 / h; c.position.y = y0 + h2 / 2; } });
    m.drs[0].visible = false; m.H = H - step; }); };
// flat things on a top: a plane lying on it, a thin rim round a rectangle, a yellow outline (the picture's empty place)
const zDecal = (c) => new T.MeshLambertMaterial({ color: c, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
const zFlat = (par, w, d, x, z, m, y = 0.0015) => { const o = new T.Mesh(new T.PlaneGeometry(w, d), m); o.rotation.x = -Math.PI / 2; o.position.set(x, y, z); par.add(o); return o; };
const zRim = (par, w, d, x, z, m, t = 0.014, h = 0.008) => { bx(par, w + t, h, t, x, h / 2, z - d / 2, m); bx(par, w + t, h, t, x, h / 2, z + d / 2, m); bx(par, t, h, d, x - w / 2, h / 2, z, m); bx(par, t, h, d, x + w / 2, h / 2, z, m); };
const zOutline = (par, w, d, x, z, y = 0.004) => { const M = new T.MeshBasicMaterial({ color: new T.Color(0xffd23f).multiplyScalar(1.15), polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 }), t = 0.014;
  [[w + t, t, 0, -d / 2], [w + t, t, 0, d / 2], [t, d, -w / 2, 0], [t, d, w / 2, 0]].forEach(([a, b, dx, dz]) => zFlat(par, a, b, x + dx, z + dz, M, y)); };
const riserOf = (mods, k0, k1) => { const g = PR.group(), a = mods[k0].g, b = mods[k1].g; g.position.set((a.position.x + b.position.x) / 2, FR.top, (a.position.z + b.position.z) / 2); g.rotation.y = (a.rotation.y + b.rotation.y) / 2; g.updateMatrixWorld(true);
  const q = new T.Quaternion().setFromEuler(new T.Euler(0, g.rotation.y, 0)); return { g, q, at: (x, y, z) => g.localToWorld(V(x, y, z)), out: V(0, 0, 1).applyQuaternion(q), along: V(1, 0, 0).applyQuaternion(q) }; };
// ---- AERO PAKETI IN A DRAWER (BASE T; the user: "aero prestavi v levi predal tako kot je recimo turbo ali amortizerji, v predalu naj bo samo
//      maketa vseh 4 aerotov"): the left cabinet's middle column's upper drawer (an open drawer of the game's cabinet, as Turbo's or
//      Amortizerji's, its part standing on its floor; in h it was empty: its brake discs went onto the right cabinet's top) holds a SCALE
//      MODEL of the four kits and nothing else. The drawer is 0.29 m wide (0.21 m inside), so the model is four PIECES side by side (about
//      1:25), each the FRONT RIGHT QUARTER OF A CAR (from its middle line to its right side, from the nose back past the front wheel to under
//      the windscreen: the nose with the kit's lip, the right side with the kit's sill), white as a design model, its nose to the drawer's
//      front and its right side to the right (the first view sees the drawer from the front right), on a light stand; the kit's parts in
//      its colour (CESTNI green, ŠPORTNI blue, DIRKALNI red, PAKET GT orange, as on the regal before), the bigger the kit the bigger its parts
//      (as the real ones) and the more of them: Dirkalni a canard at the nose's corner, Paket GT two and a dark splitter under its lip; the
//      kit's name on a label in a dark shade of its colour, sloping on the stand's front. The drawer is out further than the game's staircase
//      (AEDR.out from the cabinet's front; the drawer under it is empty) so the pieces show over its front from the first view. The real
//      kits are not kept in the garage any more: bought, a kit is fitted as the other drawer parts are. Its tap name: 'Predal – Aero paketi' ----
const AEDR = { col: 1, row: 1, out: 0.36, kits: [1, 2, 3, 4], s: 0.04, z: 0.06, name: 'Predal – Aero paketi', step: 0.049 };   // (W: step: the models 4.9 cm apart at most (were 5.9), from the left side: the drawer's right wall hid half of the last label (GT PACK) from the first view's direction)
const AEM = () => ({ W: PR.mat(0xeef1f5, { shininess: 25 }), K: PR.mat(0x1d1f24, { shininess: 50 }), GL: PR.mat(0x253246, { shininess: 90 }), T: PR.mat(0x111215, { shininess: 20 }),
  RIM: PR.mat(0xa9b0b9, { shininess: 80 }), LMP: PR.mat(0xfff3cc, { shininess: 60, emissive: 0x332a10 }), ST: PR.mat(0xd3d9e1, { shininess: 20 }) });
// one piece of kit i (AERO_KINDS' index: 1 Cestni .. 4 Paket GT) at scale s; its group's origin the middle of its stand's foot; returns
// { g, kit (the kit's parts), label, sw (the stand's width), eR (how far right of the origin its widest part reaches) }
const aeroPiece = (par, i, s, M) => { const g = new T.Group(), k = i - 1, kit = []; par.add(g);
  const C = PR.mat(AERO_COL[i], { shininess: 45, emissive: new T.Color(AERO_COL[i]).multiplyScalar(0.3) }), K = (o) => { kit.push(o); return o; };
  const sw = 0.92 * s + 0.004, sl = 3.3 * s, sh = 0.008, X0 = -0.45 * s, ZN = 1.2 * s;   // (the stand: under the body; X0 the car's middle line, ZN its nose)
  // b: a box given in the car's own metres: x from the middle line out to the right side, y up from the stand's top, z from the nose (back: minus)
  const b = (x0, x1, y0, y1, z0, z1, m, rx = 0, ry = 0, rz = 0) => zbx(g, (x1 - x0) * s, (y1 - y0) * s, (z1 - z0) * s, X0 + (x0 + x1) / 2 * s, sh + (y0 + y1) / 2 * s, ZN + (z0 + z1) / 2 * s, m, rx, ry, rz);
  // the stand, its label (the kit's name, sloping on its front: its top edge at the stand's top)
  zbx(g, sw, sh, sl, 0, sh / 2, 0, M.ST);
  const lh = 0.02, th = 0.9, dk = '#' + new T.Color(AERO_COL[i]).multiplyScalar(0.5).getHexString(), label = new T.Mesh(new T.BoxGeometry(sw, lh, 0.002), hNameMats(AERO_NM[i], sw / lh, 'front', { bg: dk, line: false, font: 80, squeeze: 1.1, pad: 6 }));
  label.position.set(0, lh / 2 * Math.cos(th) + 0.0004, sl / 2 + lh / 2 * Math.sin(th)); label.rotation.x = -th; g.add(label);   // (its foot on the floor, its top edge against the stand's front)
  // the car's front right quarter (white, its glass dark): the body before, over and behind the wheel's arch, the bumper, the grille and the
  // lamp in the nose, the bonnet, the windscreen sloping up to the roof's start, the side window under it, the wheel with its rim
  b(0, 0.88, 0.2, 0.74, -0.5, 0, M.W); b(0, 0.9, 0.22, 0.5, -0.1, 0.06, M.W); b(0, 0.42, 0.38, 0.58, -0.02, 0.012, M.K); b(0.5, 0.8, 0.55, 0.68, -0.02, 0.012, M.LMP);
  b(0, 0.88, 0.64, 0.74, -1.3, -0.5, M.W); b(0, 0.6, 0.2, 0.64, -1.3, -0.5, M.W); b(0, 0.88, 0.2, 0.74, -2.8, -1.3, M.W); b(0, 0.84, 0.74, 0.8, -1.45, -0.08, M.W);
  b(0, 0.72, 1.005, 1.045, -2.355, -1.395, M.GL, 0.488); b(0, 0.72, 1.24, 1.3, -2.8, -2.25, M.W); b(0, 0.74, 0.8, 1.24, -2.8, -2.25, M.GL);
  zcy(g, 0.34 * s, 0.34 * s, 0.24 * s, X0 + 0.77 * s, sh + 0.34 * s, ZN - 0.9 * s, M.T, 'x', 16); zcy(g, 0.21 * s, 0.21 * s, 0.25 * s, X0 + 0.77 * s, sh + 0.34 * s, ZN - 0.9 * s, M.RIM, 'x', 10);
  // the kit (in its colour): the lip under the nose, deeper and further out the bigger the kit; the sill behind the wheel, wider and lower
  const lh2 = 0.06 + 0.025 * k, ld = 0.25 + 0.1 * k, lp = 0.06 + 0.06 * k, ws = 0.1 + 0.035 * k, hs2 = 0.12 + 0.035 * k;
  K(b(0, 0.9 + 0.03 * k, 0.23 - lh2, 0.23, 0.06 + lp - ld, 0.06 + lp, C)); K(b(0.86, 0.86 + ws, 0.27 - hs2, 0.27, -2.8, -1.32, C));
  if (k >= 2) K(b(0.6, 0.92, 0.34, 0.38, -0.02, 0.12, C, 0, 0, -0.3)); if (k >= 3) { K(b(0.6, 0.92, 0.46, 0.5, -0.02, 0.1, C, 0, 0, -0.3)); K(b(0, 0.95, 0.23 - lh2 - 0.035, 0.23 - lh2, -0.2, 0.06 + lp + 0.12, M.K)); }
  return { g, kit, label, sw, eR: Math.max(sw / 2, X0 + (0.86 + ws) * s) }; };
// the drawer and its model (once a scene: the drawer pulled out further, the model on its floor); m.Wm the column's width
const aeroDrawer = (S, o = {}, dr0 = null, Wi0 = null) => { const m = (S.left || [])[AEDR.col], dr = dr0 || (m && m.drs[AEDR.row]); if (!dr) return null; const M = AEM(), s = AEDR.s;   // (V1: dr0 a drawer of vCabFronts, Wi0 its inner width)
  if (dr.userData.aeroModel) dr.remove(dr.userData.aeroModel); if (!dr0 && !dr.userData.aeroOut) { dr.position.z += AEDR.out - (0.1 + AEDR.row * 0.12); dr.userData.aeroOut = true; }
  const own = dr.children.filter(c => c.visible), ig = new T.Group(); ig.position.set(0, -0.03, AEDR.z); dr.add(ig); dr.userData.aeroModel = ig;   // (own: the drawer's floor, sides, front, handle, light strip; the model as a drawer's part: its base on the floor)
  const pcs = AEDR.kits.map(i => { const p = aeroPiece(ig, i, s, M); p.i = i; return p; }), Wi = Wi0 != null ? Wi0 : m.Wm - 0.086 - 0.004, eL = pcs[0].sw / 2, eR = pcs[pcs.length - 1].eR, n = pcs.length;
  const step = Math.min(AEDR.step || 9, (Wi - eL - eR) / (n - 1)); pcs.forEach((p, j) => { p.g.position.x = -Wi / 2 + eL + j * step; });   // (side by side, 2 mm in from the drawer's sides: the widest sill (Paket GT's) at the right)
  dr.updateMatrixWorld(true); return { m, dr, g: ig, pieces: pcs, own, name: AEDR.name, s, step }; };
// ---- V1: THE FRONT CABINETS UPDATED (the user: "Luči, ki so pri auspuhih, prestavi na omarico, ki je pred avtom ... Posodobi omarico pred
//      avtom, če boš tuning dele prestavil vzadaj na polico, saj jih zdaj ne bo več toliko v omarici pred avtom"). The parts now on the upper
//      shelf (Filter zraka, Turbo, Amortizerji, Stabilizatorji, Lahek akumulator, Hupa, Dim gum; the sport discs 'Športne ploščice') and the
//      glass film (on proposal 1's glass trolley) leave the cabinets. THE LEFT CABINET IS THE LIGHTS CABINET: on its top the headlamps (a pair
//      a kind) and the tail lamps (one lamp a kind, lit red), side by side, each kind in its row; its drawers: Žmigavci, the aero model, Luč
//      pod avtom. THE RIGHT CABINET keeps its top (Keramične and Dirkalni diski, the calipers, the grilles) and one drawer, Nalepke. With so
//      few drawers the staircase is gone: ONE ROW OF WIDER DRAWERS under each top (a column wide on the left; two columns wide on the right),
//      out VC.out so what is in them shows from the first view (as the aero drawer was), and a plain closed front below them (dark navy, the
//      regal's yellow line). The cabinets' footprint (no drawer further out than the old staircase's lowest row, 0.34 m) and the height of
//      their tops stay ----
const VC = { y: 0.585, out: 0.34, d: 0.4, hx: [-0.326, -0.144], div: -0.045, tx: 0.188, ty: 0.05, tz: 0.02, tilt: 0.5, line: 0.02, lineY: 0.675, kick: 0.08, panelTop: 0.505, openTop: 0.655, noDisc: 1 };   // (round 2: the yellow line under the top, one height, every column)
// the drawers of the row: [cabinet, its columns, the key of the game's drawer item it holds (S.ditems by S.GR's list) or 'aero', the tap name]
// (round 2: the left cabinet's column 0, cut by the first view's left edge, has no drawer (a closed front); Žmigavci moved to the right
// cabinet: its two drawers, Žmigavci and Nalepke, each a column and a half wide over its columns 0..2, each showing its menu's kinds
// (vSigShow, vDecalShow); its column 3 is closed (a drawer there, pulled out, would leave the first view at its right edge).
// [cabinet, the drawer's span in columns (column i spans i - 0.5 .. i + 0.5), the key, the tap name, its shift sideways (m: the left cabinet's
// last drawer 9 mm in, so its corner by the gift stays inside the old staircase's floor plan)]
const VDR = [['L', [0.5, 1.5], 'aero', 'Predal – Aero paketi'], ['L', [1.5, 2.5], 'neon', 'Predal – Luč pod avtom', -0.009], ['R', [-0.5, 1.0], 'sigShow', 'Predal – Žmigavci'], ['R', [1.0, 2.5], 'decalShow', 'Predal – Nalepke']];
// a frame between a cabinet's columns at the fractional column f (its origin on the floor, the columns' turn between theirs)
const vColFrame = (cab, f) => { const i = Math.max(0, Math.min(cab.length - 2, Math.floor(f))), t = f - i, a = cab[i].g, b = cab[i + 1].g, g = PR.group();
  g.position.copy(a.position).lerp(b.position, t); g.rotation.y = a.rotation.y + (b.rotation.y - a.rotation.y) * t; g.updateMatrixWorld(true); return g; };
// a tail lamp on show, LIT as on a car (VTL.L long, VTL.H high, VTL.D deep; its origin the middle of its bottom front edge, its lens to +z):
// the black housing and, by kind, Serijske three red segments, Dimljene a smoked lens with a dim red glow in it, Prozorne a clear lens with
// red lights inside it, Okrogle two round red lights in chrome rings, LED-trak a thin bright red strip along a dark lens (the lit parts
// unlit-bright, as the game draws its lit lamps: EM)
const VTL = { L: 0.41, H: 0.10, D: 0.04 };
const vTailLit = (kind) => { const g = new T.Group(), { L, H, D } = VTL, BK = PR.mat(0x111215, { shininess: 60 }), CHR = ZMAT.chrome(), z0 = 0.004;
  zbx(g, L, H, D, 0, H / 2, -D / 2, BK);
  if (kind === 'okr') { for (const s of [-1, 1]) { const x = s * L * 0.25, r = H * 0.4; zcy(g, r + 0.008, r + 0.008, 0.01, x, H / 2, z0, CHR, 'z', 28); zcy(g, r, r, 0.012, x, H / 2, z0 + 0.003, EM(0xff1c26, 1.25), 'z', 28);
      zcy(g, r * 0.45, r * 0.45, 0.014, x, H / 2, z0 + 0.004, EM(0xff5a5a, 1.5), 'z', 20); } }
  else if (kind === 'led') { zbx(g, L - 0.012, H - 0.012, 0.008, 0, H / 2, z0, PR.mat(0x1c0708, { shininess: 140, specular: 0x444444 })); zbx(g, L - 0.03, 0.014, 0.01, 0, H * 0.56, z0 + 0.002, EM(0xff2030, 1.7)); zbx(g, L - 0.06, 0.006, 0.01, 0, H * 0.3, z0 + 0.002, EM(0xff2030, 0.9)); }
  else if (kind === 'dim') { zbx(g, L - 0.012, H - 0.012, 0.008, 0, H / 2, z0, PR.mat(0x260a0d, { shininess: 150, specular: 0x555555 })); for (let i = -1; i <= 1; i++) zbx(g, 0.11, 0.05, 0.006, i * 0.13, H / 2, z0 + 0.002, EM(0xd01822, 0.55)); }
  else if (kind === 'proz') { zbx(g, L - 0.012, H - 0.012, 0.008, 0, H / 2, z0, PR.mat(0xe9eef3, { shininess: 160, specular: 0xffffff }));
    for (let i = -1; i <= 1; i++) { const x = i * 0.13; zcy(g, 0.034, 0.034, 0.006, x, H / 2, z0 + 0.003, EM(0xff1c26, 1.35), 'z', 24); zcy(g, 0.012, 0.012, 0.008, x, H / 2, z0 + 0.004, CHR, 'z', 12); } }
  else for (let i = -1; i <= 1; i++) zbx(g, 0.125, H - 0.016, 0.008, i * 0.135, H / 2, z0, EM(0xe01a24, 1.2));   // (Serijske)
  return g; };
// the tail lamps' part of the lights cabinet's top (in LR's frame): kind k in row k (LROW(k)), its lamp leaned back VC.tilt (its lens to the
// camera) on two steel cradles; an empty place (the stock kind is on the car): its cradles and a pale strip; the picture's row (o.hl): a
// yellow tab on the rim at the row's right end and its place outlined. Returns tailRow's interface: { fill, q(), at(k) (the lamp's origin),
// mid(k), grip(k) (the middle of its top edge: the arm takes it from above), sec(k) (LR: .out, .along), parts (set by frontRegal) }
const vTailTop = (LR, o, X) => { const fill = o.fill || ON_CAR(TAIL_KINDS), hl = o.hl, out = { fill }, qT = LR.q.clone().multiply(qAx('x', -VC.tilt));
  out.q = () => qT.clone(); out.at = (k) => LR.at(VC.tx, VC.ty, LROW(k) + VC.tz); out.sec = () => LR;
  out.loc = (k, p) => out.at(k).add(p.clone().applyQuaternion(qT)); out.mid = (k) => out.loc(k, V(0, VTL.H / 2, -VTL.D / 2)); out.grip = (k) => out.loc(k, V(0, VTL.H, -VTL.D / 2));
  for (let k = 0; k < 5; k++) { const z = LROW(k), cz = z + VC.tz - 0.035;
    for (const s of [-1, 1]) bx(LR.g, 0.03, VC.ty - 0.006, 0.06, VC.tx + s * VTL.L * 0.36, (VC.ty - 0.006) / 2, cz, X.M.ST);
    if (!fill[k]) { zFlat(LR.g, VTL.L + 0.01, 0.075, VC.tx, cz, X.PAL, 0.002); zFlat(LR.g, VTL.L - 0.12, 0.024, VC.tx, cz, X.DKT, 0.003); if (k === hl) zOutline(LR.g, VTL.L + 0.03, 0.09, VC.tx, cz); }
    if (k === hl) bx(LR.g, 0.03, 0.016, 0.1, 0.42 + 0.012, 0.008, cz, X.RM.YEL);
    if (fill[k]) zPlace(vTailLit(fill[k]), out.at(k), qT); }
  return out; };
// a drawer of the row (the game's drawer, wider): w wide, VC.d deep, its origin as the game's (y its rails, z its middle; the front at +0.2):
// the floor, the sides, the front with its handle and its light strip
const vDrawer = (par, M, w, x, y, z) => { const dg = new T.Group(); dg.position.set(x, y, z); par.add(dg);
  bx(dg, w - 0.02, 0.02, VC.d, 0, -0.04, 0, M.FO); for (const sx of [-1, 1]) bx(dg, 0.016, 0.06, VC.d, sx * (w / 2 - 0.018), -0.01, 0, M.NV2);
  bx(dg, w - 0.01, 0.07, 0.02, 0, -0.01, VC.d / 2, M.NV2); bx(dg, Math.min(0.16, w * 0.45), 0.016, 0.026, 0, 0.0, VC.d / 2 + 0.02, M.ST); ledF(dg, M, w - 0.01, 0, 0.03, VC.d / 2 + 0.014);
  dg.userData.inner = w - 0.02 - 2 * 0.016; return dg; };
// V1 (round 2): WHAT THE RIGHT CABINET'S DRAWERS SHOW, readable from the first view: each kind of the menu's tab on a small navy board
// leaning back on the drawer's floor (its face to the camera), its name on a plate along the board's foot (white on navy, the yellow line,
// as the regal's plates): Nalepke (MENUS stripes, tab 'Nalepke': Plameni, Šahovnica, Zvezda) as decal sheets with their print, Žmigavci
// (MENUS headlights, tab 'Žmigavci': Prozorni, Dimljeni, Tekoči) as indicator lamps lit amber. The stock kinds (Brez nalepk, Serijski) are
// on the car and not shown. Generic prints only
const VSHOW = { w: 0.158, h: 0.15, gap: 0.016, tilt: 0.82, z: 0.155, lab: 0.032 };
const VDECALS = [['flames', 'FLAMES'], ['check', 'CHEQUERED'], ['star', 'STAR']], VSIGS = [['proz', 'CLEAR'], ['dim', 'SMOKED'], ['tek', 'SEQUENTIAL']];   // (W: the show boards' names in English)
const VDTEX = {};
// a decal sheet's print (a white sheet, its cut line, the print): hot-rod flames, a chequered band, a five-pointed star
const vDecalTex = (kind) => { if (VDTEX[kind]) return VDTEX[kind]; const W = 384, H = 256, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  g.fillStyle = '#f4f6f8'; g.fillRect(0, 0, W, H); g.strokeStyle = '#b9c2cc'; g.lineWidth = 4; g.setLineDash([12, 8]); g.strokeRect(14, 14, W - 28, H - 28); g.setLineDash([]);
  if (kind === 'flames') { const fl = (y, len, th, col) => { g.beginPath(); g.moveTo(30, y - th); g.bezierCurveTo(30 + len * 0.45, y - th * 1.4, 30 + len * 0.7, y - th * 0.2, 30 + len, y - th * 0.9);
      g.bezierCurveTo(30 + len * 0.82, y + th * 0.1, 30 + len * 0.62, y + th * 0.25, 30 + len * 0.55, y + th * 0.35); g.bezierCurveTo(30 + len * 0.35, y + th * 1.1, 30 + len * 0.15, y + th, 30, y + th); g.closePath(); g.fillStyle = col; g.fill(); g.lineWidth = 5; g.strokeStyle = '#a3161f'; g.stroke(); };
    [[78, 300, 30, '#ff7a1a'], [128, 330, 34, '#ff7a1a'], [178, 290, 30, '#ff7a1a']].forEach(([y, l, t, cl]) => fl(y, l, t, cl)); [[78, 220, 15, '#ffd23f'], [128, 250, 17, '#ffd23f'], [178, 210, 15, '#ffd23f']].forEach(([y, l, t, cl]) => { g.save(); g.lineWidth = 0; fl(y, l, t, cl); g.restore(); }); }
  else if (kind === 'check') { const s = 38, x0 = 30, y0 = H / 2 - 1.5 * s; for (let r = 0; r < 3; r++) for (let k = 0; k * s + x0 < W - 30; k++) { g.fillStyle = (r + k) % 2 ? '#f4f6f8' : '#15171c'; g.fillRect(x0 + k * s, y0 + r * s, Math.min(s, W - 30 - x0 - k * s), s); }
    g.strokeStyle = '#15171c'; g.lineWidth = 4; g.strokeRect(x0, y0, W - 60, 3 * s); }
  else { const cx = W / 2, cy = H / 2 + 8, R = 104, r = 42; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r : R; g.lineTo(cx + q * Math.cos(a), cy + q * Math.sin(a)); } g.closePath();
    g.fillStyle = '#ffd23f'; g.fill(); g.lineWidth = 9; g.strokeStyle = '#16245a'; g.stroke(); }
  const t = new T.CanvasTexture(c); t.anisotropy = 8; return (VDTEX[kind] = t); };
// an indicator lamp on show (lit amber; its origin the middle of its back, its lens to +z): the black housing and, by kind, Prozorni a clear
// lens with the amber light in it, Dimljeni a smoked lens with a dim amber glow, Tekoči a dark lens with a row of amber segments growing
// brighter outward (the light runs outward)
const vSigLamp = (kind) => { const g = new T.Group(), w = 0.13, h = 0.056, d = 0.03; zbx(g, w, h, d, 0, 0, d / 2, PR.mat(0x111215, { shininess: 60 }));
  if (kind === 'proz') { zbx(g, w - 0.01, h - 0.01, 0.006, 0, 0, d + 0.002, PR.mat(0xe9eef3, { shininess: 160, specular: 0xffffff })); zcy(g, 0.019, 0.019, 0.008, -0.02, 0, d + 0.005, EM(0xffa01a, 1.5), 'z', 20); zbx(g, 0.05, 0.016, 0.008, 0.035, 0, d + 0.005, EM(0xffa01a, 1.3)); }
  else if (kind === 'dim') { zbx(g, w - 0.01, h - 0.01, 0.006, 0, 0, d + 0.002, PR.mat(0x2a1d0c, { shininess: 150, specular: 0x555555 })); zbx(g, w - 0.03, h - 0.026, 0.006, 0, 0, d + 0.004, EM(0xd07a14, 0.6)); }
  else { zbx(g, w - 0.01, h - 0.01, 0.006, 0, 0, d + 0.002, PR.mat(0x1a1408, { shininess: 140, specular: 0x444444 })); for (let i = 0; i < 6; i++) zbx(g, 0.013, h - 0.024, 0.007, -0.045 + i * 0.018, 0, d + 0.005, EM(0xffa01a, 0.45 + i * 0.22)); }
  return g; };
// the boards of a drawer's show (in the drawer's frame: its floor top at y -0.03, its front at z +0.2): kinds [[key, NAME]], each board's
// face by face(key, board) (a print's material or a part on it); returns the boards' group
const vShowRow = (dg, kinds, face) => { const G = new T.Group(); dg.add(G); const NV = PR.mat(0x1b2b5c, { shininess: 40 }), ST = PR.mat(0x6f7781, { shininess: 60 }), { gap, tilt } = VSHOW, n = kinds.length;
  const w = Math.min(VSHOW.w, ((dg.userData.inner || 0.5) - 0.006 - (n - 1) * gap) / n), h = w * VSHOW.h / VSHOW.w, lab = w * VSHOW.lab / VSHOW.w;   // (the boards as wide as the drawer allows)
  kinds.forEach(([key, nm], i) => { const x = (i - (n - 1) / 2) * (w + gap), b = new T.Group(); b.position.set(x, -0.03 + 0.012, VSHOW.z); b.rotation.x = -tilt; G.add(b);
    zbx(G, w * 0.9, 0.012, 0.03, x, -0.024, VSHOW.z + 0.004, ST);   // (the board's foot on the drawer's floor)
    zbx(b, w, h, 0.008, 0, h / 2, -0.004, NV);   // (the board, leaning back)
    const plate = new T.Mesh(new T.BoxGeometry(w, lab, 0.004), hNameMats(nm, w / lab, 'front', { font: 88, squeeze: 1.0, pad: 10, line: 9 })); plate.position.set(0, lab / 2 + 0.002, 0.002); b.add(plate);
    face(key, b, w, h, lab); });
  return G; };
const vDecalShow = (dg) => vShowRow(dg, VDECALS, (key, b, w, h, lab) => { const pw = w - 0.014, ph = h - lab - 0.012, m = new T.Mesh(new T.PlaneGeometry(pw, ph), new T.MeshBasicMaterial({ map: vDecalTex(key), color: 0xe6e9ee }));
  m.position.set(0, lab + 0.006 + ph / 2, 0.0015); b.add(m); });
const vSigShow = (dg) => vShowRow(dg, VSIGS, (key, b, w, h, lab) => { const s = vSigLamp(key); s.scale.setScalar(Math.min(1, (w - 0.012) / 0.13)); s.position.set(0, lab + (h - lab) / 2 + 0.002, 0.0); b.add(s); });
// >>>> XC BLOCKS (agent XC: options 5/6)
// ==== XC (OPTIONS 5 AND 6 OF THE FRONT CABINETS' CONTENTS, agent XC; the user on round W's first view: "Spodaj pa sem označil stvari v
//      regalu, ki jih postavi drugače v regal, lahko tudi spremeniš regale. Naredi 6 različnih možnosti v sliki"): the helpers both options
//      share (the same block in _e_store2_om5.js and _e_store2_om6.js). The groups on show, each item with its English plate (white on navy,
//      the regal's yellow line): UNDERGLOW (BLUE, TURQUOISE, PURPLE, RED, GREEN: five lit strips), INDICATORS (CLEAR, SMOKED, SEQUENTIAL: lit
//      amber lamps, vSigLamp), AERO KITS (STREET, SPORT, RACE, GT PACK: V1's quarter-car models, aeroPiece), DECALS (FLAMES, CHEQUERED, STAR:
//      sheets with their print, vDecalTex), COLOURED NUTS (one set: the red of the regal's old Barvne matice, B4.rims[1].nuts). The left
//      cabinet (the lights cabinet) shows UNDERGLOW and INDICATORS, the right one AERO KITS, DECALS and COLOURED NUTS. Each option sets
//      st.mali.xc = { opt, groups: [{ key, name, cab, items: [{ nm, g, part (the thing alone, without its plate / plinth) }], box (the group's drawer / shelf), label (its name's plate) }] } ----
const XCAM = [2.545, 3.798, 8.426];   // (the first view's camera, HOMEC on the phone 412×915: what turns to the camera turns to this point)
// a name plate lying on its parent's face (+z): white on navy, the yellow line, its canvas 256 px high
const xcPlate = (par, txt, w, h, x, y, z = 0.002, o = {}) => { const m = new T.Mesh(new T.BoxGeometry(w, h, 0.004), hNameMats(txt, w / h, 'front', Object.assign({ H: 256, font: 172, pad: 16, line: 22 }, o)));
  m.position.set(x, y, z); par.add(m); return m; };
// a soft glow (additive: the ID pass leaves it out), white in its texture, tinted by its material
let XC_GLOW = null;
const xcGlowTex = () => { if (XC_GLOW) return XC_GLOW; const c = document.createElement('canvas'); c.width = 128; c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 4, 64, 64, 63);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,0.6)'); gr.addColorStop(0.65, 'rgba(255,255,255,0.18)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  return (XC_GLOW = new T.CanvasTexture(c)); };
const xcGlowMat = (c, k = 0.9) => new T.MeshBasicMaterial({ map: xcGlowTex(), color: new T.Color(c).multiplyScalar(k), transparent: true, blending: T.AdditiveBlending, depthWrite: false });
// an underglow strip on show (lying on its parent's face, along x, L long; its origin the middle of its back): the black housing, its lit
// line in the kind's colour (GLOW_COLS) on the face, its light on what it lies on round it
const xcStrip = (par, key, L, x, y, z = 0, o = {}) => { const g = new T.Group(); g.position.set(x, y, z); par.add(g); const c = GLOW_COLS[key] || 0xffffff;
  const sh = o.h || 0.03; zbx(g, L, sh, 0.02, 0, 0, 0.01, ZMAT.black()); zbx(g, L - 0.012, sh * 0.47, 0.006, 0, 0, 0.0215, new T.MeshBasicMaterial({ color: new T.Color(c).multiplyScalar(1.6) }));
  if (o.glow !== false) { const h = new T.Mesh(new T.PlaneGeometry(L + (o.gx || 0.07), o.gy || 0.09), xcGlowMat(c, o.gk || 0.9)); h.position.set(0, o.gdy || 0, o.gz != null ? o.gz : 0.0015); h.renderOrder = 3; g.add(h); g.userData.glow = h; }
  return g; };
// a decal sheet on show (w × h, its print vDecalTex(key) on a thin white board; its origin the middle of its back)
const xcDecal = (par, key, w, h, x, y, z = 0) => { const g = new T.Group(); g.position.set(x, y, z); par.add(g); zbx(g, w, h, 0.004, 0, 0, 0.002, PR.lam(0xe9edf2));
  const m = new T.Mesh(new T.PlaneGeometry(w - 0.006, h - 0.006), new T.MeshBasicMaterial({ map: vDecalTex(key), color: 0xe6e9ee })); m.position.set(0, 0, 0.0045); g.add(m); return g; };
// the coloured nuts on show (one set): a wheel's hub (steel, on a black pad of radius r) with its five nuts in the set's red, hexagonal, on
// their studs; its origin the middle of the pad's back, its face +z
const xcNuts = (par, r, x, y, z = 0) => { const g = new T.Group(); g.position.set(x, y, z); par.add(g); const col = (typeof B4 !== 'undefined' && B4.rims && B4.rims[1] && B4.rims[1].nuts) || 0xd81f2a;
  const NM = PR.mat(col, { shininess: 120, specular: 0x999999 }), HUB = PR.mat(0xb9c0c8, { shininess: 90, specular: 0x777777 }), DK = PR.mat(0x1c1e23, { shininess: 40 });
  zcy(g, r, r, 0.01, 0, 0, 0.005, DK, 'z', 32); zcy(g, r * 0.66, r * 0.7, 0.012, 0, 0, 0.016, HUB, 'z', 32); zcy(g, r * 0.2, r * 0.2, 0.006, 0, 0, 0.025, DK, 'z', 20);
  for (let i = 0; i < 5; i++) { const a = Math.PI / 2 + i * 2 * Math.PI / 5, px = Math.cos(a) * r * 0.44, py = Math.sin(a) * r * 0.44;
    zcy(g, r * 0.15, r * 0.15, 0.02, px, py, 0.032, NM, 'z', 6); zcy(g, r * 0.1, r * 0.13, 0.008, px, py, 0.044, NM, 'z', 14); zcy(g, r * 0.05, r * 0.05, 0.004, px, py, 0.049, HUB, 'z', 10); }
  return g; };
// a prism from a shape in a frame's (z, y) plane ([[z, y], ..]), t thick along x: its +x face at the mesh's x (it reaches to x - t)
const xcExtrude = (pts, t, mat) => { const s = new T.Shape(); pts.forEach(([u, v], i) => (i ? s.lineTo(u, v) : s.moveTo(u, v)));
  const m = new T.Mesh(new T.ExtrudeGeometry(s, { depth: t, bevelEnabled: false }), mat); m.rotation.y = -Math.PI / 2; return m; };
// the angle (round y) from a frame's +z to the first view's camera, seen from the frame's point (x, z)
const xcCamYaw = (fr, x, z) => { fr.updateMatrixWorld(true); const c = fr.worldToLocal(V(...XCAM)); return Math.atan2(c.x - x, c.z - z); };
// the cabinets' plain fronts (every column: navy from the kick up under the top, the yellow line at VC.lineY), the game's drawers out of sight
const xcPlainFronts = (S, o = {}) => { const RM = RGM(), NAVY = PR.mat(0x1b2b5c, { shininess: 40 }), Dp = 0.62, lineY = o.lineY != null ? o.lineY : VC.lineY, y0 = o.y0 != null ? o.y0 : VC.kick;
  (S.left || []).concat(S.right || []).forEach(m => m.drs.forEach(d => { d.visible = false; }));
  [['L', S.left], ['R', S.right]].forEach(([c, cab]) => cab.forEach((m, i) => { const w = m.Wm + 0.012, top = m.H - 0.004;
    if (o.panel !== false) bx(m.g, w, top - y0, 0.008, 0, (y0 + top) / 2, Dp / 2 + 0.004, NAVY); if (lineY) bx(m.g, w, VC.line, 0.012, 0, lineY, Dp / 2 + 0.009, RM.YEL); })); };
// ==== OM6: OPTION 6 "STEKLENA VITRINA" (a glass showcase): each cabinet's body becomes a LIT GLASS-FRONTED SHOWCASE, a trophy cabinet.
//      The body is hollowed from its front back to OM6.zb (its back wall there, lit brighter under each light), a clear glass front
//      (slightly blue, a few soft reflections) recessed 1 cm behind a navy frame: the plinth (the game's yellow kick, an LED line on its top
//      lighting the lower shelf from below) and the top rail under the cabinet's top (the regal's yellow line on it), the steel ends of the
//      cabinet as its sides; no drawers. Inside TWO FROSTED GLASS SHELVES, lit (the lower one over the plinth, the middle one), a white LED
//      line under the rail and under the middle shelf's front; the upper level's name on the rail, the lower level's on the plinth. The items
//      STAND on the shelves facing the camera behind the glass: on small navy easels leaning back 40° (the lamps, the strips, the sheets,
//      the nuts) or on a plinth (the aero models, side on), each with its English plate (on the easel under each strip; for the others
//      on a plaque sloped 45° at the shelf's front). Every item stands close behind the glass and low enough to be seen whole through
//      its level (from the first view a ray from any of its points leaves the glass under the level's upper edge: h + 1.0..1.1·d ≤ the
//      level's height − 1 cm; d its depth behind the glass).
//      Left (the lights cabinet): upper shelf UNDERGLOW (a display board a column: BLUE and TURQUOISE, PURPLE, RED and GREEN, one under
//      the other), lower shelf INDICATORS (a lamp a column); right: upper shelf AERO KITS (a model a column), lower shelf DECALS (three sheets) and COLOURED
//      NUTS. The cabinets' footprint is the old body's (nothing comes out of the front) ----
const OM6 = { y0: 0.135, sh: 0.012, y1: 0.405, yTop: 0.69, zg: 0.305, zb: 0.0, nose: 0.034, lineY: 0.716, lean: 40 * Math.PI / 180, d0: 0.035, sigS: 1.5, aeroS: 0.065, aeroYaw: 1.45,
  LV: { L: ['ug', 'sig'], R: ['decal', 'aero'] }, NM: { ug: 'UNDERGLOW', sig: 'INDICATORS', decal: 'DECALS', aero: 'AERO KITS' } };
let OM6_GRAD = null;
const om6Grad = () => { if (OM6_GRAD) return OM6_GRAD; const c = document.createElement('canvas'); c.width = 16; c.height = 256; const g = c.getContext('2d'), f1 = 256 * (OM6.yTop - OM6.y1) / (OM6.yTop - OM6.y0);   // (the canvas' top: the rail; f1: the middle shelf)
  const band = (y0, y1) => { const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, '#8fb2e6'); gr.addColorStop(0.25, '#3d5a95'); gr.addColorStop(1, '#16244a'); g.fillStyle = gr; g.fillRect(0, y0, 16, y1 - y0); };
  band(0, f1); band(f1, 256); return (OM6_GRAD = new T.CanvasTexture(c)); };
const om6Mats = () => ({ NV: PR.mat(0x1b2b5c, { shininess: 40 }), NV2: PR.mat(0x24386f, { shininess: 30 }), ST: PR.mat(0x9aa2ac, { shininess: 90 }), EASEL: PR.mat(0x22346a, { shininess: 30 }),
  BACK: new T.MeshLambertMaterial({ color: 0x1d2c55, emissive: 0xffffff, emissiveMap: om6Grad(), emissiveIntensity: 0.55 }), CEIL: PR.lam(0x16203d),
  SHELF: new T.MeshPhongMaterial({ color: 0x8aa2c2, emissive: 0x1d3558, shininess: 120, specular: 0xffffff, transparent: true, opacity: 0.86 }),
  GLASS: new T.MeshPhongMaterial({ color: 0xcfe4ff, transparent: true, opacity: 0.12, shininess: 200, specular: 0xffffff, depthWrite: false }),
  GLINT: new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, blending: T.AdditiveBlending, depthWrite: false }),
  JOINT: new T.MeshBasicMaterial({ color: 0xeaf6ff, transparent: true, opacity: 0.32, depthWrite: false }),
  LED: new T.MeshBasicMaterial({ color: new T.Color(0x47c6ff).multiplyScalar(2.2) }), WLED: new T.MeshBasicMaterial({ color: new T.Color(0xf4f9ff).multiplyScalar(1.4) }) });
// one module's showcase (in its own frame: x across, z out, its front at Dp/2): the body hollowed, the back wall, the shelves, the glass,
// the frame (plinth, rail, yellow line), the lights
const om6Module = (m, M, RM, glints, joint) => { const Dp = 0.62, { y0, sh, y1, yTop, zg, zb } = OM6, W = m.Wm, top = m.H - 0.004;
  m.g.children.forEach(c => { if (!c.isMesh || !c.geometry || c.geometry.type !== 'BoxGeometry') return; const p = c.geometry.parameters;
    if (Math.abs(p.width - W) < 1e-4 && Math.abs(p.depth - Dp) < 1e-4) { c.scale.z = (zb + Dp / 2) / Dp; c.position.z = (zb - Dp / 2) / 2; }   // (the body: from its back to the showcase's back wall)
    else if (Math.abs(p.width - 0.012) < 1e-4 && Math.abs(p.depth - 0.012) < 1e-4 && Math.abs(c.position.x - W / 2) < 1e-3) c.visible = false; });   // (the steel strip between two columns: the glass runs on)
  const back = new T.Mesh(new T.PlaneGeometry(W, yTop - y0), M.BACK); back.position.set(0, (y0 + yTop) / 2, zb + 0.001); m.g.add(back);
  zbx(m.g, W, 0.012, zg - zb, 0, yTop + 0.006, (zg + zb) / 2, M.CEIL);   // (the showcase's ceiling)
  for (const y of [y0, y1]) zbx(m.g, W + 0.002, sh, zg - zb - 0.006, 0, y + sh / 2, (zg + zb) / 2 - 0.003, M.SHELF);   // (the frosted glass shelves)
  zbx(m.g, W + 0.012, y0 - VC.kick, 0.008, 0, (VC.kick + y0) / 2, Dp / 2 + 0.004, M.NV); zbx(m.g, W - 0.01, 0.008, 0.01, 0, y0 - 0.006, Dp / 2 + 0.012, M.LED);   // (the plinth, its LED line)
  zbx(m.g, W + 0.012, top - yTop, 0.008, 0, (yTop + top) / 2, Dp / 2 + 0.004, M.NV); zbx(m.g, W + 0.012, VC.line, 0.012, 0, OM6.lineY, Dp / 2 + 0.009, RM.YEL);   // (the rail, the yellow line)
  zbx(m.g, W - 0.02, 0.008, 0.012, 0, yTop - 0.01, zg - 0.03, M.WLED); zbx(m.g, W - 0.02, 0.008, 0.012, 0, y1 - 0.006, zg - 0.03, M.WLED);   // (the white LED lines under the rail and the middle shelf)
  const gl = new T.Mesh(new T.PlaneGeometry(W + 0.004, yTop - y0 + 0.01), M.GLASS); gl.position.set(0, (y0 + yTop) / 2, zg); gl.renderOrder = 5; m.g.add(gl);   // (the glass)
  glints.forEach(([x, w, a, y, h]) => { const q = new T.Mesh(new T.PlaneGeometry(w, h), M.GLINT); q.position.set(x, y, zg + 0.001); q.rotation.z = a; q.renderOrder = 6; m.g.add(q); });
  if (joint) { const j = new T.Mesh(new T.PlaneGeometry(0.004, yTop - y0), M.JOINT); j.position.set(W / 2, (y0 + yTop) / 2, zg + 0.002); j.renderOrder = 6; m.g.add(j); } };   // (the joint of two panes)
// a level's name on the cabinet's frame (at column f, w wide): the upper level's on the rail over the glass, the lower level's on the plinth
// under it (white on navy, the yellow line), standing just in front of the frame
const om6Name = (cab, name, f, w, upper) => { const fr = vColFrame(cab, f), g = new T.Group(), h = upper ? 0.046 : 0.042, y = upper ? (OM6.yTop + cab[0].H - 0.004) / 2 + 0.002 : (VC.kick + OM6.y0) / 2 - 0.004;
  g.position.set(0, y, 0.62 / 2 + 0.02); fr.add(g); xcPlate(g, name, w, h, 0, 0, 0.002, { font: 168, pad: 40 }); fr.updateMatrixWorld(true); return { fr, g }; };
// an easel standing on a shelf (in frame par at (x, y, z), turned to the camera), its board leaning back OM6.lean, bl long up the board,
// bw wide; returns { g (the easel), B (the board's frame: y up the board, z out of its face) }
const om6Easel = (par, M, x, y, z, bw, bl, o = {}) => { const g = new T.Group(), a = o.yaw ? xcCamYaw(par, x, z) * o.yaw : 0;   // (straight out: turned to the camera its far end would go deeper, out of the level's window)
  g.position.set(x, y, z - bw * 0.4 * Math.abs(Math.sin(a))); par.add(g); g.rotation.y = a;   // (turned to the camera, its foot's nearer end kept off the glass)
  const lf = o.lift || 0; zbx(g, bw * 0.8, 0.01 + lf, 0.04, 0, (0.01 + lf) / 2, -0.01, M.ST); const B = new T.Group(); B.position.y = lf; B.rotation.x = -OM6.lean; g.add(B); zbx(B, bw, bl, 0.008, 0, bl / 2, -0.004, M.EASEL);
  zbx(g, 0.012, lf + bl * Math.cos(OM6.lean) * 0.8, 0.012, 0, (lf + bl * Math.cos(OM6.lean) * 0.8) / 2, -bl * Math.sin(OM6.lean) * 0.9, M.ST);   // (its strut)
  return { g, B }; };
// an item's name on a plaque sloped 45° at the shelf's front, in front of its easel (as the aero models' plaques)
const om6Plaque = (par, nm, y, w = 0.2, h = 0.032) => { const pq = new T.Group(); pq.position.set(0, y + 0.012, OM6.zg - 0.005 - 0.022); pq.rotation.x = -Math.PI / 4; par.add(pq); xcPlate(pq, nm, w, h, 0, 0, 0.002); return pq; };
const om6Fronts = (S, out, o = {}) => { const M = om6Mats(), RM = RGM(), { y0, sh, y1, zg, lean, d0 } = OM6, Dp = 0.62, groups = [], extra = [];
  xcPlainFronts(S, { panel: false, lineY: 0 });   // (the game's drawers out of sight; no panels: the showcase's own frame)
  const GL = { L: [[[-0.04, 0.03, 0.45, 0.5, 0.24]], [], [[0.04, 0.018, 0.45, 0.26, 0.2]]], R: [[[0.03, 0.026, 0.45, 0.55, 0.22]], [], [[-0.03, 0.03, 0.45, 0.27, 0.22], [0.035, 0.014, 0.45, 0.29, 0.18]], []] };   // (the soft reflections: a pane's [x, width, slant, y, length], each inside its pane)
  [['L', S.left], ['R', S.right]].forEach(([c, cab]) => cab.forEach((m, i) => om6Module(m, M, RM, GL[c][i] || [], i < cab.length - 1)));
  const fy = (lv) => (lv ? y1 : y0) + sh, zE = zg - 0.005 - d0;   // (a level's floor; an easel's foot: d0 behind the glass)
  const lv = { L: {}, R: {} };
  // LEFT, upper: INDICATORS, a lamp a column on its easel
  { const cab = S.left, sc = 1.8, lh = 0.056 * sc, bl = 0.115, lift = 0.026, its = [];   // (the lamp on its easel, its name on the plaque in front)
    VSIGS.forEach(([k, nm], i) => { const gi = new T.Group(); cab[i].g.add(gi); const { B } = om6Easel(gi, M, 0, fy(0), zE, 0.25, bl, { lift }); const l = vSigLamp(k); l.scale.setScalar(sc); l.position.set(0, bl / 2, 0.002); B.add(l);
      om6Plaque(gi, nm, fy(0), 0.21, 0.034); its.push({ nm, g: gi, part: l }); });
    const n = om6Name(cab, OM6.NM.sig, 1, 0.4, false); extra.push({ cab: 'L', g: n.fr }); groups.push({ key: 'sig', name: OM6.NM.sig, cab: 'L', items: its, box: null, label: n.g }); }
  // LEFT, upper: UNDERGLOW, a display board a column, its strips one under the other, each with its name under it: BLUE and TURQUOISE,
  // PURPLE, RED and GREEN (two rows of strips one behind the other would not both fit the level's window)
  { const cab = S.left, its = [], L = 0.25, bl = 0.138, ph = 0.029, sh2 = 0.031, row = 0.066, KS = [['mod', 'tur'], ['vij'], ['rde', 'zel']];
    KS.forEach((ks, i) => { const { B } = om6Easel(cab[i].g, M, i === 2 ? -0.012 : 0, fy(1), zE, L + 0.016, bl), y0r = ks.length === 2 ? bl - 0.004 : (bl + row) / 2;   // (the right column's board 12 mm in: the cabinet's end post)
      ks.forEach((k, j) => { const g = new T.Group(); B.add(g); const top = y0r - j * row; const st = xcStrip(g, k, L, 0, top - sh2 / 2, 0.002, { h: sh2, gx: 0.03, gy: 0.055 });
        xcPlate(g, STRIP_NM[k], 0.15, ph, 0, top - sh2 - 0.002 - ph / 2, 0.002); its.push({ nm: STRIP_NM[k], g, part: st }); }); });
    const n = om6Name(cab, OM6.NM.ug, 1, 0.4, true); extra.push({ cab: 'L', g: n.fr }); groups.push({ key: 'ug', name: OM6.NM.ug, cab: 'L', items: its, box: null, label: n.g }); }
  // RIGHT, upper: AERO KITS, a model a column on a plinth (side on to the camera, its nose to the right), the kit's name on a sloped plaque
  { const cab = S.right, AM = AEM(), s = OM6.aeroS, its = [], pz0 = zg - 0.005 - 0.04, pd = 0.095, pzc = pz0 - pd / 2;
    [1, 2, 3, 4].forEach((i, j) => { const m = cab[j], g = new T.Group(); m.g.add(g);
      zbx(g, 0.26, 0.014, pd, 0, fy(1) + 0.007, pzc, PR.mat(new T.Color(AERO_COL[i]).multiplyScalar(0.85).getHex(), { shininess: 50 }));   // (its plinth in the kit's colour)
      const pc = aeroPiece(g, i, s, AM); if (pc.label) pc.label.visible = false; pc.g.position.set(0, fy(1) + 0.014, pzc); pc.g.rotation.y = xcCamYaw(m.g, 0, pzc) + OM6.aeroYaw;
      const sd = pc.g.children[0]; if (sd && sd.isMesh) sd.material = PR.mat(new T.Color(AERO_COL[i]).multiplyScalar(0.85).getHex(), { shininess: 50 });
      const pq = new T.Group(); pq.position.set(0, fy(1) + 0.012, zg - 0.005 - 0.022); pq.rotation.x = -Math.PI / 4; g.add(pq); xcPlate(pq, AERO_NM[i], 0.2, 0.032, 0, 0, 0.002);
      its.push({ nm: AERO_NM[i], g, part: pc.g }); });
    const n = om6Name(cab, OM6.NM.aero, 1.5, 0.45, true); extra.push({ cab: 'R', g: n.fr }); groups.push({ key: 'aero', name: OM6.NM.aero, cab: 'R', items: its, box: null, label: n.g }); }
  // RIGHT, lower: DECALS (three sheets) and COLOURED NUTS, a column each on its easel
  { const cab = S.right, bl = 0.126, shh = 0.116, sw = 0.174, lift = 0.026, its = [];   // (the sheet / the nuts' hub filling its easel, the name on the plaque in front)
    VDECALS.map(([k, nm]) => ({ k, nm })).concat([{ k: 'nuts', nm: 'COLOURED NUTS' }]).forEach((q, i) => { const gi = new T.Group(); cab[i].g.add(gi); const { B } = om6Easel(gi, M, 0, fy(0), zE, 0.25, bl, { lift });
      const pt = q.k === 'nuts' ? xcNuts(B, shh * 0.45, 0, bl / 2 - 0.004, 0.002) : xcDecal(B, q.k, sw, shh, 0, bl / 2, 0.002); om6Plaque(gi, q.nm, fy(0), 0.21, 0.034); its.push({ nm: q.nm, g: gi, part: pt }); });
    const n = om6Name(cab, OM6.NM.decal, 1, 0.4, false); extra.push({ cab: 'R', g: n.fr }); groups.push({ key: 'decal', name: OM6.NM.decal, cab: 'R', items: its.slice(0, 3), box: null, label: n.g });
    groups.push({ key: 'nuts', name: 'COLOURED NUTS', cab: 'R', items: its.slice(3), box: null, label: null }); }
  extra.forEach(e => { if (!out.frames.includes(e.g)) out.frames.push(e.g); });   // (my frames among the cabinets' (the reach test's obstacles))
  out.drawers = []; out.aeroDr = null; out.xc = { opt: 6, groups, extra }; return out; };
// ==== PDA (agent PDA, round PD: the user, after round O3's six 3D curved front cabinets: "Ne izgleda dobro 3D. Naredi 6 različnih verzij po
//      tvoji izbiri sprednjega regala, da bodo vsi elementi v predalih izgledali, kot da so res v predalu. Zbriši škatlo darilo."). Versions 1, 2:
//      PDA.v 1 "MEHANIČNA OMARA ZA ORODJE": two mechanic's roll cabinets side by side (navy painted steel, the yellow line under the top, full-
//        width aluminium pulls, castors), five drawers each pulled out in a staircase (the two shallow top ones only just open, the three deep
//        ones well out, the lowest furthest); in the deep ones a two-tone foam insert (dark grey over yellow) with a cut-out of each item; the
//        tops' parts (headlamps, calipers) lying on a ribbed rubber mat in the top's aluminium rim;
//      PDA.v 2 "PREDALNIK ZA NAČRTE": one long low plan chest across the whole width (two columns of ten wide shallow drawers under one oak top,
//        navy steel), four drawers a column pulled out to different depths (a staircase), the items lying flat in shaped recesses in dark felt
//        (light blue under it), each with a small name tag; the tops' parts in the upper open drawers (nothing on the top).
//      Both: REAL drawers (a front with thickness and its pull, sides, a back, a floor, ball-bearing slides; the cabinet's inside dark), the
//      first view's camera looks down into them over their fronts; the items lie below the rims in their cut-outs, soft contact shadows in the
//      cut-outs and along the drawers' walls. The cabinets are straight along the arc frame's u (its x; z = w toward the camera), so their
//      edges are level on the screen; each element's tap area is its tile of the insert (split from its neighbours along screen-upright lines:
//      invisible seams in one continuous insert), its cut-out, the item, its name tag and the slice of the drawer front (and of its pull) in
//      front of it. The daily gift is hidden. PDA.v 0: option 6 as before ----
const PDA = { v: 2 };
// ---- the first view's camera as a fixed projector (O3B's: XCAM and the quaternion the probe read); F: the arc frame (x = u, z = w) ----
const PDCU = XCAM[0] * C3 - (XCAM[2] - 0.2) * S3, PDCW = XCAM[0] * S3 + (XCAM[2] - 0.2) * C3, PDCH = XCAM[1];
let PDCAM = null;
const pdCam = () => { if (PDCAM) return PDCAM; const c = new T.PerspectiveCamera(72, 412 / 915, 0.05, 200); c.position.set(XCAM[0], XCAM[1], XCAM[2]); c.quaternion.set(-0.17702, 0.14702, 0.02675, 0.9728).normalize();
  c.updateMatrixWorld(true); c.matrixWorldInverse.copy(c.matrixWorld).invert(); c.updateProjectionMatrix(); return (PDCAM = c); };
const pdWL = (x, y, z) => V(z * S3 + x * C3, y, 0.2 + z * C3 - x * S3);
const pdS = (x, y, z) => { const v = pdWL(x, y, z).project(pdCam()); return [(v.x + 1) * 206, (1 - v.y) * 457.5]; };
const pdBis = (f, lo, hi, t) => { for (let i = 0; i < 48; i++) { const m = (lo + hi) / 2; if (f(m) < t) lo = m; else hi = m; } return (lo + hi) / 2; };
const pdUX = (c, y, z) => pdBis(u => pdS(u, y, z)[0], -4, 4, c);   // (the u seen at screen x c, at height y, depth z)
const pdZY = (sy, x, y) => pdBis(z => pdS(x, y, z)[1], 2, 9, sy);   // (the z seen at screen y sy, at u x, height y)
const pdRay = (we, he, hf) => we - (he - hf) * (PDCW - we) / (PDCH - he);   // (the camera's ray over the edge (z we, height he) down to height hf: its z there)
// ---- textures, materials ----
let PDTX = {};
const pdRnd = (s) => () => (s = (s * 16807) % 2147483647) / 2147483647;
const pdTex = (key, w, h, fn, rep) => { if (PDTX[key]) return PDTX[key]; const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c);
  if (rep) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } t.anisotropy = 8; return (PDTX[key] = t); };
// foam / felt: a fine speckle (uv in metres; a tile 0.25 m), the felt with short fibres
const pdSpeckle = (key, base, amp, fib) => pdTex(key, 256, 256, (g, W, H) => { g.fillStyle = base; g.fillRect(0, 0, W, H); const R = pdRnd(fib ? 11 : 7);
  for (let i = 0; i < 12000; i++) { const v = (R() - 0.5) * amp; g.fillStyle = v > 0 ? `rgba(255,255,255,${v})` : `rgba(0,0,0,${-v})`; if (fib) { g.save(); g.translate(R() * W, R() * H); g.rotate(R() * Math.PI); g.fillRect(0, 0, 2 + R() * 4, 0.7); g.restore(); } else g.fillRect(R() * W, R() * H, 1 + R() * 1.4, 1 + R() * 1.4); } }, [4, 4]);
// the ribbed rubber mat: ribs across (along u) 6.25 mm apart (uv in metres: 64 px a 5 cm tile)
const pdRibTex = () => pdTex('rib', 64, 64, (g, W, H) => { g.fillStyle = '#17181b'; g.fillRect(0, 0, W, H); for (let i = 0; i < 8; i++) { const y = i * 8; g.fillStyle = '#2d3036'; g.fillRect(0, y + 1, W, 2); g.fillStyle = '#0c0d0f'; g.fillRect(0, y + 5, W, 2); }
  const R = pdRnd(3); for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(255,255,255,${R() * 0.05})`; g.fillRect(R() * W, R() * H, 1, 1); } }, [20, 20]);
// oak (V2's top): long grain along u (uv in metres: a 1 m × 0.5 m tile)
const pdOakTex = () => pdTex('oak', 512, 256, (g, W, H) => { g.fillStyle = '#b98b55'; g.fillRect(0, 0, W, H); const R = pdRnd(5);
  for (let i = 0; i < 90; i++) { const y = R() * H, a = 0.04 + R() * 0.1, c = R() < 0.5 ? '120,80,40' : '210,170,120'; g.strokeStyle = `rgba(${c},${a})`; g.lineWidth = 0.6 + R() * 2.2; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= W; x += 32) g.lineTo(x, y + Math.sin(x / (40 + R() * 60) + i) * 2.5); g.stroke(); } }, [1, 2]);
// a soft shadow (a blurred dark rectangle), an edge shadow (dark at v 0, gone at v 1)
const pdShTex = () => pdTex('sh', 64, 64, (g) => { g.filter = 'blur(6px)'; g.fillStyle = '#000'; g.fillRect(12, 12, 40, 40); });
const pdEdgeTex = () => pdTex('edge', 8, 64, (g, W, H) => { const gr = g.createLinearGradient(0, H, 0, 0); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.35, 'rgba(0,0,0,0.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); });
const pdShMat = (op, edge) => new T.MeshBasicMaterial({ map: edge ? pdEdgeTex() : pdShTex(), color: 0x000000, transparent: true, opacity: Math.min(0.48, op), depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
const pdMats = () => { if (PDTX.M) return PDTX.M; const M = {
    NV: PR.mat(0x1c2c5e, { shininess: 70, specular: 0x34446c }), NVE: PR.mat(0x15214a, { shininess: 40, specular: 0x222a40 }), YL: PR.mat(0xf2c230, { shininess: 40 }),
    AL: PR.mat(0x949eaa, { shininess: 70, specular: 0x7a828c }), ALD: PR.mat(0x7f8893, { shininess: 80, specular: 0x8a8a8a }), STL: PR.mat(0xaab2bc, { shininess: 120, specular: 0xdddddd }),
    BOX: PR.mat(0x252c3a, { shininess: 30, specular: 0x222222 }), CAV: PR.lam(0x05070c), RUB: PR.mat(0x131417, { shininess: 25 }), HUB: PR.mat(0x8e969f, { shininess: 90, specular: 0x999999 }),
    FOAM: new T.MeshPhongMaterial({ map: pdSpeckle('foam', '#34373d', 0.16), shininess: 6, specular: 0x0c0c0c }), FOAMW: PR.mat(0x1d1f23, { shininess: 5, specular: 0x050505 }), HOLE: new T.MeshPhongMaterial({ vertexColors: true, shininess: 8, specular: 0x111111 }),
    MAT: new T.MeshPhongMaterial({ map: pdRibTex(), shininess: 22, specular: 0x202020 }),
    FELT: new T.MeshPhongMaterial({ map: pdSpeckle('felt', '#262a33', 0.2, true), shininess: 4, specular: 0x080808 }), FELTW: PR.mat(0x181b21, { shininess: 4, specular: 0x050505 }), OAK: new T.MeshPhongMaterial({ map: pdOakTex(), shininess: 45, specular: 0x3a3022 }),
    CARD: PR.lam(0xf2f4f6), TOP2: PR.mat(0x1a2954, { shininess: 14, specular: 0x10182a }) };
  return (PDTX.M = M); };
const PDCOL = { yel: [new T.Color(0xf4c430), new T.Color(0x7a5f12)], blu: [new T.Color(0x86c3f0), new T.Color(0x355a7a)] };   // (a cut-out's bottom: its colour, its shaded edge)
// ---- geometry: static parts gathered a material into one buffer (pdAcc), an element's meshes merged a material (pdMergeGroup) ----
const pdGeoFix = (geo, mtx) => { let g = geo.index ? geo.toNonIndexed() : geo.clone(); if (!g.groups.length && geo.groups.length) geo.groups.forEach(q => g.addGroup(q.start, q.count, q.materialIndex)); if (mtx) g.applyMatrix4(mtx); if (!g.attributes.normal) g.computeVertexNormals(); return g; };
const pdSlice = (g, s, n) => { const G = new T.BufferGeometry(); for (const k of ['position', 'normal', 'uv', 'color']) { const A = g.attributes[k]; if (A) G.setAttribute(k, new T.BufferAttribute(A.array.slice(s * A.itemSize, (s + n) * A.itemSize), A.itemSize)); } return G; };
const pdMergeGeos = (gs, col) => { let n = 0; gs.forEach(g => { n += g.attributes.position.count; }); const P = new Float32Array(n * 3), N = new Float32Array(n * 3), U = new Float32Array(n * 2), C = col ? new Float32Array(n * 3) : null; let k = 0;
  gs.forEach(g => { const c = g.attributes.position.count; P.set(g.attributes.position.array.subarray(0, c * 3), k * 3); N.set(g.attributes.normal.array.subarray(0, c * 3), k * 3); if (g.attributes.uv) U.set(g.attributes.uv.array.subarray(0, c * 2), k * 2);
    if (C) { if (g.attributes.color) C.set(g.attributes.color.array.subarray(0, c * 3), k * 3); else C.fill(1, k * 3, (k + c) * 3); } k += c; g.dispose(); });
  const G = new T.BufferGeometry(); G.setAttribute('position', new T.BufferAttribute(P, 3)); G.setAttribute('normal', new T.BufferAttribute(N, 3)); G.setAttribute('uv', new T.BufferAttribute(U, 2)); if (C) G.setAttribute('color', new T.BufferAttribute(C, 3));
  G.computeBoundingBox(); G.computeBoundingSphere(); return G; };
const pdAcc = () => { const B = new Map(), A = {
    add: (mat, geo, mtx) => { const g = pdGeoFix(geo, mtx); if (Array.isArray(mat)) { (g.groups.length ? g.groups : [{ start: 0, count: g.attributes.position.count, materialIndex: 0 }]).forEach(q => A.push(mat[q.materialIndex], pdSlice(g, q.start, q.count))); g.dispose(); } else A.push(mat, g); },
    push: (mat, g) => { let e = B.get(mat); if (!e) B.set(mat, (e = [])); e.push(g); },
    box: (mat, x0, x1, y0, y1, z0, z1) => { if (x1 - x0 < 1e-5 || y1 - y0 < 1e-5 || z1 - z0 < 1e-5) return; A.add(mat, new T.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), new T.Matrix4().makeTranslation((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)); },
    cyl: (mat, r, h, x, y, z, ax = 'y', seg = 16) => { const m = new T.Matrix4().makeTranslation(x, y, z); if (ax === 'x') m.multiply(new T.Matrix4().makeRotationZ(Math.PI / 2)); else if (ax === 'z') m.multiply(new T.Matrix4().makeRotationX(Math.PI / 2)); A.add(mat, new T.CylinderGeometry(r, r, h, seg), m); },
    flush: (par, o = {}) => { const out = []; B.forEach((gs, mat) => { const m = new T.Mesh(pdMergeGeos(gs, !!mat.vertexColors), mat); m.castShadow = !!(o.cast && o.cast(mat)); m.receiveShadow = true; par.add(m); out.push(m); }); B.clear(); return out; } };
  return A; };
// an element's group: its meshes (opaque, not additive) merged a material (the flags pdTint / pdPlate kept on the merged mesh)
const pdMergeGroup = (g) => { g.updateMatrixWorld(true); const inv = new T.Matrix4().copy(g.matrixWorld).invert(), B = new Map(), dead = [];
  const push = (mat, geo, ud) => { let e = B.get(mat); if (!e) B.set(mat, (e = { gs: [], ud: {} })); e.gs.push(geo); Object.assign(e.ud, ud); };
  g.traverse(m => { if (!m.isMesh || m.userData.pdKeep) return; if (!vVisible(m)) { dead.push(m); return; } const mats = [].concat(m.material); if (mats.some(q => !q || q.transparent || (q.blending && q.blending !== T.NormalBlending))) return;
    const geo = pdGeoFix(m.geometry, new T.Matrix4().multiplyMatrices(inv, m.matrixWorld)), ud = { pdTint: m.userData.pdTint, pdPlate: m.userData.pdPlate };
    if (Array.isArray(m.material)) (geo.groups.length ? geo.groups : [{ start: 0, count: geo.attributes.position.count, materialIndex: 0 }]).forEach(q => push(m.material[q.materialIndex], pdSlice(geo, q.start, q.count), ud)); else push(m.material, geo, ud);
    dead.push(m); });
  dead.forEach(m => { if (m.parent) m.parent.remove(m); });
  B.forEach((e, mat) => { const m = new T.Mesh(pdMergeGeos(e.gs, !!mat.vertexColors), mat); m.castShadow = false; m.receiveShadow = true; if (e.ud.pdTint) m.userData.pdTint = true; if (e.ud.pdPlate) m.userData.pdPlate = true; g.add(m); });
  return g; };
// a flat quad (four F points, counter-clockwise seen from its face), its uv
const pdQuad = (par, P4, mat, uv4 = [[0, 0], [1, 0], [1, 1], [0, 1]]) => { const [a, b, c, d] = P4, nn = V().subVectors(b, a).cross(V().subVectors(d, a)).normalize(), p = [], n = [], u = [];
  for (const k of [0, 1, 2, 0, 2, 3]) { const q = P4[k]; p.push(q.x, q.y, q.z); n.push(nn.x, nn.y, nn.z); u.push(uv4[k][0], uv4[k][1]); }
  const G = new T.BufferGeometry(); G.setAttribute('position', new T.Float32BufferAttribute(p, 3)); G.setAttribute('normal', new T.Float32BufferAttribute(n, 3)); G.setAttribute('uv', new T.Float32BufferAttribute(u, 2));
  const m = new T.Mesh(G, mat); m.receiveShadow = true; par.add(m); return m; };
// a flat piece lying at height y over the outline Q ([u, w] points, any turn), its uv the metres (u, -w) (ShapeGeometry)
const pdFlat = (par, Q, y, mat) => { const g = new T.ShapeGeometry(new T.Shape(Q.map(([u, w]) => new T.Vector2(u, -w)))), m = new T.Mesh(g, mat); m.rotation.x = -Math.PI / 2; m.position.y = y; m.receiveShadow = true; par.add(m); return m; };
// an insert's tile: the outline Q at the top height yt, th thick, with its cut-outs (the outlines H); the top and the cut-outs' walls
const pdTile = (par, Q, yt, th, H, mT, mW) => { const sh = new T.Shape(Q.map(([u, w]) => new T.Vector2(u, -w))); H.forEach(h => sh.holes.push(new T.Path(h.map(([u, w]) => new T.Vector2(u, -w)))));
  const m = new T.Mesh(new T.ExtrudeGeometry(sh, { depth: th, bevelEnabled: false, curveSegments: 4 }), [mT, mW]); m.rotation.x = -Math.PI / 2; m.position.y = yt - th; m.receiveShadow = true; par.add(m); return m; };
// a cut-out's outline: { t: 'c', u, w, r } a circle, { t: 'r', u, w, a, b, rr } a rounded rectangle (half sizes a, b); grown by d
const pdOutline = (h, d = 0, n = 32) => { const P = []; if (h.t === 'c') { for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; P.push([h.u + Math.cos(a) * (h.r + d), h.w + Math.sin(a) * (h.r + d)]); } return P; }
  const a = h.a + d, b = h.b + d, r = Math.max(0.002, Math.min(h.rr + d, a - 1e-4, b - 1e-4)), k = Math.max(2, Math.round(n / 4));
  [[a - r, b - r, 0], [-(a - r), b - r, Math.PI / 2], [-(a - r), -(b - r), Math.PI], [a - r, -(b - r), 1.5 * Math.PI]].forEach(([cx, cy, a0]) => { for (let i = 0; i <= k; i++) { const t = a0 + i / k * Math.PI / 2; P.push([h.u + cx + Math.cos(t) * r, h.w + cy + Math.sin(t) * r]); } });
  return P; };
// a cut-out's bottom at height y: its colour, darker toward its wall (the wall's shade: a ring from the outline in by `ao`)
const pdHoleBot = (par, h, y, ao, cols, mat) => { const O = pdOutline(h, 0), I = pdOutline(h, -ao), n = O.length, p = [], c = [], up = [];
  const tri = (A, B, Cc, ca, cb, cc) => { const cr = (B[0] - A[0]) * (Cc[1] - A[1]) - (B[1] - A[1]) * (Cc[0] - A[0]); const L = cr < 0 ? [[A, ca], [B, cb], [Cc, cc]] : [[A, ca], [Cc, cc], [B, cb]];   // (seen from above: +y)
    L.forEach(([q, col]) => { p.push(q[0], y, q[1]); c.push(col.r, col.g, col.b); up.push(0, 1, 0); }); };
  const [CI, CE] = cols, cen = [h.u, h.w];
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; tri(O[i], O[j], I[j], CE, CE, CI); tri(O[i], I[j], I[i], CE, CI, CI); tri(cen, I[i], I[j], CI, CI, CI); }
  const G = new T.BufferGeometry(); G.setAttribute('position', new T.Float32BufferAttribute(p, 3)); G.setAttribute('normal', new T.Float32BufferAttribute(up, 3)); G.setAttribute('color', new T.Float32BufferAttribute(c, 3)); G.setAttribute('uv', new T.Float32BufferAttribute(new Array(p.length / 3 * 2).fill(0), 2));
  const m = new T.Mesh(G, mat); m.receiveShadow = true; par.add(m); return m; };
// a soft shadow lying at height y (its middle (u, w), sw × sd), an edge shadow (from the wall at (u0..u1, w0..w1): dark at its `dark` edge)
const pdSoft = (par, u, w, y, sw, sd, op) => { const m = new T.Mesh(new T.PlaneGeometry(sw, sd), pdShMat(op)); m.rotation.x = -Math.PI / 2; m.position.set(u, y, w); m.renderOrder = 2; par.add(m); return m; };
const pdEdgeSh = (par, u0, u1, w0, w1, y, dark, op) => { const P = [V(u0, y, w1), V(u1, y, w1), V(u1, y, w0), V(u0, y, w0)], uv = { w0: [[0, 1], [1, 1], [1, 0], [0, 0]], w1: [[0, 0], [1, 0], [1, 1], [0, 1]], u0: [[0, 0], [0, 1], [1, 1], [1, 0]], u1: [[0, 1], [0, 0], [1, 0], [1, 1]] }[dark];
  const m = pdQuad(par, P, pdShMat(op, true), uv.map(([s, t]) => [s, t])); m.renderOrder = 2; m.receiveShadow = false; return m; };
// a label (white on navy, the yellow line: the regal's hNameTex) lying flat (its top face up, reading from the camera) or standing
const pdTag = (par, txt, w, d, u, y, z, o = {}) => { const m = new T.Mesh(new T.BoxGeometry(w, 0.003, d), hNameMats(txt, w / d, 'top', Object.assign({ H: 96, font: 70, pad: 6, line: 9 }, o))); m.position.set(u, y + 0.0015, z); m.userData.pdPlate = true; par.add(m); return m; };
// ---- the items, lying as they would in a drawer (their footprint's middle at the origin, their foot at y 0) and their cut-outs ----
// [English label, the menu's Slovenian name] (O3B's list)
const PDEL = {
  tail: { dim: ['SMOKED', 'Zadnje luči – Dimljene'], proz: ['CLEAR', 'Zadnje luči – Prozorne'], okr: ['ROUND', 'Zadnje luči – Okrogle'], led: ['LED STRIP', 'Zadnje luči – LED-trak'] },
  lamp: { led: ['LED', 'Žarometi – LED'], rum: ['YELLOW', 'Žarometi – Rumeni'], dim: ['SMOKED', 'Žarometi – Dimljeni'], bil: ['BI-LED', 'Žarometi – Bi-LED'] },
  cal: { rde: ['RED', 'Čeljusti – Rdeče'], rum: ['YELLOW', 'Čeljusti – Rumene'], zla: ['GOLD', 'Čeljusti – Zlate'], barva: ['BODY COLOUR', 'Čeljusti – V barvi avta'] },
  grille: { sat: ['HONEYCOMB', 'Maska – Satasta'], mrez: ['MESH', 'Maska – Mrežasta'], krom: ['CHROME', 'Maska – Kromirana'], karb: ['CARBON', 'Maska – Karbonska'], barva: ['BODY COLOUR', 'Maska – V barvi avta'] },
  disc: { dirk: ['RACE DISCS', 'Zavore – Dirkalni diski'], ker: ['CERAMIC', 'Zavore – Keramične'] },
  ug: { mod: ['BLUE', 'Luč pod avtom – Modra'], tur: ['TURQUOISE', 'Luč pod avtom – Turkizna'], vij: ['PURPLE', 'Luč pod avtom – Vijolična'], rde: ['RED', 'Luč pod avtom – Rdeča'], zel: ['GREEN', 'Luč pod avtom – Zelena'] },
  sig: { proz: ['CLEAR', 'Žmigavci – Prozorni'], dim: ['SMOKED', 'Žmigavci – Dimljeni'], tek: ['SEQUENTIAL', 'Žmigavci – Tekoči'] },
  aero: { 1: ['STREET', 'Aero paket – Cestni'], 2: ['SPORT', 'Aero paket – Športni'], 3: ['RACE', 'Aero paket – Dirkalni'], 4: ['GT PACK', 'Aero paket – Paket GT'] },
  decal: { flames: ['FLAMES', 'Nalepke – Plameni'], check: ['CHEQUERED', 'Nalepke – Šahovnica'], star: ['STAR', 'Nalepke – Zvezda'] }, nuts: { nuts: ['COLOURED NUTS', 'Barvne matice'] } };
const PDGRP = { ug: 'UNDERGLOW', sig: 'INDICATORS', aero: 'AERO KITS', decal: 'DECALS', nuts: 'COLOURED NUTS', tail: 'TAIL LAMPS', lamp: 'HEADLAMPS', cal: 'CALIPERS', grille: 'GRILLES', disc: 'BRAKE DISCS' };
// a piece turned by the euler (rx, ry, rz; order XYZ) set with its bounding box's middle over the origin, its lowest point at y 0
const pdSeat = (P, rx = 0, ry = 0, rz = 0) => { const R = new T.Group(); R.add(P); R.rotation.set(rx, ry, rz); const Hd = new T.Group(); Hd.add(R); Hd.updateMatrixWorld(true);
  const bb = new T.Box3(); Hd.traverse(m => { if (m.isMesh && m.visible && !(m.material && m.material.blending === T.AdditiveBlending)) bb.expandByObject(m); }); const c = bb.getCenter(V()), s = bb.getSize(V());
  R.position.set(-c.x, -bb.min.y, -c.z); Hd.userData.size = [s.x, s.y, s.z]; return Hd; };
// an item at scale 1: { g (seated), fw, fd, fh (its footprint and height), cut ('r' | 'c' | 'cc': a rounded rectangle, a circle, two circles), gap }
const pdItem = (key, kind) => { const P = new T.Group(); let rot = [-Math.PI / 2, 0, 0], cut = 'r', glow = null;
  if (key === 'lamp') { for (const s of [-1, 1]) { const l = lampPart(kind); l.rotation.z = Math.PI / 2; l.position.x = s * 0.1; P.add(l); } rot = [0, 0, 0]; cut = 'cc'; }
  else if (key === 'tail') P.add(vTailLit(kind));
  else if (key === 'ug') { xcStrip(P, kind, 0.26, 0, 0, 0, { h: 0.032, glow: false }); glow = GLOW_COLS[kind]; }
  else if (key === 'sig') P.add(vSigLamp(kind));
  else if (key === 'decal') xcDecal(P, kind, 0.23, 0.155, 0, 0, 0);
  else if (key === 'nuts') { xcNuts(P, 0.1, 0, 0, 0); cut = 'c'; }
  else if (key === 'disc') { P.add(discPart(kind)); cut = 'c'; }
  else if (key === 'cal') { P.add(pdCaliper(kind)); }
  else if (key === 'grille') { const g = grillePart(kind), R1 = new T.Group(); g.rotation.z = Math.PI / 2; R1.add(g); R1.rotation.y = Math.PI / 2; P.add(R1); rot = [0, 0, 0]; }
  else if (key === 'aero') { const pc = aeroPiece(P, kind, 0.07, AEM()); if (pc.label) pc.label.visible = false; const sd = pc.g.children[0]; if (sd && sd.isMesh) sd.material = PR.mat(new T.Color(AERO_COL[kind]).multiplyScalar(0.85).getHex(), { shininess: 50 }); rot = [0, -Math.PI / 2, 0]; }
  P.traverse(m => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = true; } });
  const g = pdSeat(P, ...rot), [fw, fh, fd] = g.userData.size; if (!PDTX['dbg' + key]) { PDTX['dbg' + key] = 1; console.error('PDITEM ' + key + ' ' + kind + ' ' + [fw, fd, fh].map(v => v.toFixed(3)).join(' ')); } return { g, fw, fd, fh, cut, glow, key, kind }; };
// a brake caliper (the C-shaped body that wraps the disc's edge: two arcs round the disc's middle, its face +z), painted CAL_COLS[kind]; two
// bolt bosses at its ends, the piston's bulge, a generic white patch (no brand)
const pdCaliper = (kind) => { const g = new T.Group(), R0 = 0.13, R1 = 0.2, a0 = 0.72, sh = new T.Shape(), n = 14, C = PR.mat(CAL_COLS[kind] || 0x8a929c, { shininess: 90, specular: 0x777777 });
  for (let i = 0; i <= n; i++) { const a = -a0 + 2 * a0 * i / n; (i ? sh.lineTo : sh.moveTo).call(sh, Math.sin(a) * R1, Math.cos(a) * R1); } for (let i = n; i >= 0; i--) { const a = -a0 + 2 * a0 * i / n; sh.lineTo(Math.sin(a) * R0, Math.cos(a) * R0); }
  const m = new T.Mesh(new T.ExtrudeGeometry(sh, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2, curveSegments: 6 }), C); g.add(m);
  zbx(g, 0.1, 0.03, 0.006, 0, (R0 + R1) / 2 + 0.005, 0.07, PR.mat(0xf2f4f6, { shininess: 40 }));   // (the white patch)
  for (const s of [-1, 1]) { const a = s * (a0 - 0.12), r = (R0 + R1) / 2; zcy(g, 0.016, 0.016, 0.03, Math.sin(a) * r, Math.cos(a) * r, 0.075, PR.mat(0x2a2d33, { shininess: 60 }), 'z', 12); zcy(g, 0.009, 0.009, 0.034, Math.sin(a) * r, Math.cos(a) * r, 0.076, PR.mat(0x9aa2ac, { shininess: 90 }), 'z', 6); }
  zcy(g, 0.035, 0.035, 0.02, 0, (R0 + R1) / 2 - 0.01, 0.068, C, 'z', 20); return g; };
// the cut-out(s) round an item at scale s placed at (u, w): their outlines (clearance c all round)
const pdCuts = (it, s, u, w, c) => { const fw = it.fw * s, fd = it.fd * s;
  if (it.cut === 'c') return [{ t: 'c', u, w, r: Math.max(fw, fd) / 2 + c }];
  if (it.cut === 'cc') { const r = fd / 2 + c, dx = (fw - fd) / 2; return [{ t: 'c', u: u - dx, w, r }, { t: 'c', u: u + dx, w, r }]; }
  return [{ t: 'r', u, w, a: fw / 2 + c, b: fd / 2 + c, rr: Math.min(0.018, fd / 2 + c - 0.002) }]; };
// ---- the game's cabinets out of sight (O3B's), the daily gift hidden ----
const pdHideGame = (S, out) => { (S.left || []).concat(S.right || []).forEach(m => { m.g.visible = false; }); if (out.LR) out.LR.g.visible = false; if (out.RR) out.RR.g.visible = false;
  (ZCOL || []).forEach(g => { const p = g.position; if (p.y > 0.3 && p.z > 4.2 && p.z < 6.5 && p.x > 0.05 && p.x < 3.2) g.visible = false; }); };
const pdHideGift = (S) => { if (!S.gift) return; const p = S.gift.position.clone(); S.gift.visible = false; G3.scene.traverse(q => { if (q.isSprite && Math.abs(q.position.x - p.x) < 0.05 && Math.abs(q.position.z - p.z) < 0.05) q.visible = false; }); };
// ======== A DRAWER ROW (both versions): drawer k of a cabinet [ua, ub] (u), its front's outer face at zf, its top t and bottom b; its cells
//          from screen x xa to xb (the seams upright on the screen) ========
//   D: { fT (the front's thickness), pullH, pullD (the pull's height, how far it stands out), wall, dd (the box's depth), under (the insert's top
//   under the rim), ft (the insert's top layer), clr (the cut-outs' clearance), tagD, sMax, mats: { T, W (the insert's top, its cut walls), col
//   (the cut-outs' bottom colours) }, lab (the front's label options) }; occ: the edges over it ([z, height]: what hides its back part)
const pdDrawer = (F, acc, sh, M, D, cab, k, dr, groups, occ, els, side) => {
  const { ua, ub } = cab, { zf, t, b } = dr, under = groups.some(q => q[1].some(it => it[0] === 'aero')) ? D.underAero || D.under : D.under, ytop = t - under, yb = D.ftDeep ? b + D.ftDeep : ytop - D.ft, ftc = ytop - yb, uli = ua + D.inset, uri = ub - D.inset, zfi = zf - D.fT, zbi = zf - D.dd + D.wall;
  const zHi = (y) => pdRay(zf - D.fT, t, y), zLo = (y) => Math.max(zbi, ...occ.filter(([we, he]) => he > y + 1e-4).map(([we, he]) => pdRay(we, he, y)));   // (the window into the drawer at height y: behind its pull, in front of what hides its back)
  // the box (dark steel): the floor, the sides, the back; the front panel (behind its slices); the slides; the insert's lower layer
  const jIn = side === 'L' ? 'last' : 'first', inBox = [];   // (the inner wall and its slide: the inner cell's)
  acc.box(M.BOX, uli - D.wall, uri + D.wall, b + 0.004, b + 0.012, zbi - D.wall, zfi); for (const [u0, u1, inner] of [[uli - D.wall, uli, side === 'R'], [uri, uri + D.wall, side === 'L']]) (inner ? inBox.push([M.BOX, side === 'L' ? uri : ua + 0.006, side === 'L' ? ub - 0.006 : uli, b + 0.004, t - 0.012, zbi - D.wall, zfi]) : acc.box(M.BOX, u0, u1, b + 0.004, t - 0.012, zbi - D.wall, zfi));   // (the inner side: a double wall to near the cabinet's end, its ball-bearing slide on it)
  { const ym0 = (b + t) / 2 - 0.004, [s0, s1] = side === 'L' ? [ub - 0.006, ub - 0.0015] : [ua + 0.0015, ua + 0.006]; inBox.push([M.STL, s0, s1, ym0 - 0.011, ym0 + 0.011, zbi, zfi - 0.008], [M.ALD, side === 'L' ? s0 + 0.001 : s0, side === 'L' ? s1 : s1 - 0.001, ym0 - 0.008, ym0 + 0.008, dr.zFace - 0.3, zfi - 0.04]);   // (the slide: the drawer's member, the middle member out of the body)
    for (let z = zbi + 0.03; z < zfi - 0.03; z += 0.05) inBox.push([M.ALD, side === 'L' ? s1 - 0.0006 : s0, side === 'L' ? s1 : s0 + 0.0006, ym0 - 0.003, ym0 + 0.003, z - 0.004, z + 0.004]); }   // (its balls' cage rivets)
  acc.box(M.BOX, uli, uri, b + 0.012, t - 0.012, zbi - D.wall, zbi); acc.box(M.FOAMB || M.CAV, uli, uri, b + 0.012, yb - 0.004, zbi, zfi);
  acc.box(M.NV, ua + 0.003, ub - 0.003, b, t - D.pullH, zf - D.fT, zf - 0.002);
  const ym = (b + t) / 2; for (const [u0, s] of [[uli - D.wall, -1], [uri + D.wall, 1]]) { const u1 = u0 + s * D.slide, inner = (s > 0) === (side === 'L'), put = (...a) => (inner ? null : acc.box(...a));
    put(M.STL, Math.min(u0, u1), Math.max(u0, u1), ym - 0.012, ym + 0.012, zbi, zfi - 0.01);   // (the slide's inner member on the drawer)
    put(M.ALD, Math.min(u0, u1) + (s > 0 ? 0.002 : 0), Math.max(u0, u1) - (s < 0 ? 0.002 : 0), ym - 0.009, ym + 0.009, dr.zFace - 0.3, Math.max(dr.zFace - 0.02, zfi - 0.06)); }   // (its middle member, out of the body)
  // the cells: the seams, a cell a part; the groups' labels across their cells' slices of the front
  const n = groups.reduce((a, q) => a + q[1].length, 0), [xa, xb] = dr.x, cx = (j) => xa + (xb - xa) * j / n, yLab1 = t - D.pullH, yLab0 = Math.max(b + 0.003, yLab1 - (D.labH || 1));
  const uAt = (j, y, z) => (j <= 0 ? ua + 0.0015 : j >= n ? ub - 0.0015 : pdUX(cx(j), y, z));   // (a front's seams; its ends)
  const uIn = (j, y, z) => (j <= 0 ? uli : j >= n ? uri : pdUX(cx(j), y, z));   // (the insert's seams; the box's walls)
  const zl = zLo(ytop), zh = zHi(ytop);
  // each item at its scale (the group's: the least that fits each of its cells) in its window (between the cut-outs' back limit and its tag)
  let j0 = 0; const plan = [];
  groups.forEach(([gname, items]) => { const its = items.map((q, i) => { const j = j0 + i, it = pdItem(q[0], q[1]), zTag1 = zh - 0.006, zTag0 = zTag1 - D.tagD;
      // the cut-out's room: its depth from the window's back (at the item's top: a tall item's top must show) to the tag; its width between the seams
      const fit = (s) => { const top = yb + it.fh * s, sH = (t - 0.006 - yb) / it.fh, zb0 = Math.max(zLo(Math.max(ytop, top)), zl) + 0.006, zf0 = zTag0 - 0.008, zm = (zb0 + zf0) / 2, ul = Math.max(uli + 0.004, pdUX(cx(j) + 2.5, ytop, zm)), ur = Math.min(uri - 0.004, pdUX(cx(j + 1) - 2.5, ytop, zm));
        return { zb0, zf0, zm, ul, ur, s: Math.min((ur - ul - 2 * D.clr) / it.fw, (zf0 - zb0 - 2 * D.clr) / it.fd, D.sMax, sH) }; };   // (sH: its top under the rim)
      let f = fit(D.sMax); for (let r = 0; r < 4; r++) f = fit(Math.max(0.05, f.s)); return { j, it, f, zTag0, zTag1 }; });
    const s = Math.min(...its.map(q => q.f.s)); its.forEach(q => { q.s = s; q.gname = gname; plan.push(q); }); j0 += items.length; });
  // the groups' labels (the front's texture: navy, the name, the yellow line) over their cells' slices
  const glab = {}; j0 = 0; groups.forEach(([gname, items]) => { const ja = j0, jb = j0 + items.length, yl = (yLab0 + yLab1) / 2, u0 = pdUX(Math.max(cx(ja), 1), yl, zf), u1 = pdUX(Math.min(cx(jb), 411), yl, zf);
    glab[gname] = { u0, u1, mat: new T.MeshBasicMaterial({ map: hNameTex(gname, (u1 - u0) / (yLab1 - yLab0), Object.assign({ H: 128, font: 74, pad: 10, line: 10 }, D.lab || {})) }) }; glab[gname].mat.map.wrapS = glab[gname].mat.map.wrapT = T.ClampToEdgeWrapping; j0 = jb; });
  plan.forEach(q => { const { j, it, f, s } = q, g = new T.Group(); F.add(g); const [en, nm] = PDEL[it.key][it.kind];
    // the tile of the insert (its cut-out(s)), the cut-outs' bottoms, the item in them, its contact shadow, its tag
    const Q = [[uIn(j, ytop, zbi), zbi], [uIn(j + 1, ytop, zbi), zbi], [uIn(j + 1, ytop, zfi), zfi], [uIn(j, ytop, zfi), zfi]];
    const ul = Math.max(uli + 0.004, pdUX(cx(j) + 2.5, ytop, f.zm)), ur = Math.min(uri - 0.004, pdUX(cx(j + 1) - 2.5, ytop, f.zm)), uc = (ul + ur) / 2, wc = f.zm;
    const cuts = pdCuts(it, s, uc, wc, D.clr);
    const ybc = D.ftDeep ? Math.max(yb, ytop - Math.max(0.012, it.fh * s - 0.003)) : yb, ftk = ytop - ybc;   // (the recess: V2's as deep as its item, V1's the foam's top layer)
    const tile = pdTile(g, Q, ytop, ftk, cuts.map(h => pdOutline(h)), D.mats.T, D.mats.W); tile.userData.pdTint = true;
    cuts.forEach(h => pdHoleBot(g, h, ybc, Math.min(0.012, D.clr * 0.8), D.mats.col, M.HOLE));
    const Hd = it.g; Hd.scale.setScalar(s); Hd.position.set(uc, ybc + 0.0005, wc); g.add(Hd);
    pdSoft(sh, uc, wc + 0.004, ybc + 0.0012, it.fw * s * 1.08, it.fd * s * 1.12 + 0.01, 0.45);
    if (it.glow != null) { const gl = new T.Mesh(new T.PlaneGeometry(it.fw * s + 0.16, it.fd * s + 0.12), xcGlowMat(it.glow, 0.75)); gl.rotation.x = -Math.PI / 2; gl.position.set(uc, ytop + 0.002, wc); gl.renderOrder = 3; sh.add(gl); }
    const zt = (q.zTag0 + q.zTag1) / 2, ta = Math.max(uli + 0.006, pdUX(cx(j) + 3, ytop, zt)), tb = Math.min(uri - 0.006, pdUX(cx(j + 1) - 3, ytop, zt)), tw = Math.min(0.26, 0.9 * (tb - ta)); const tag = pdTag(g, en, tw, D.tagD, (ta + tb) / 2, ytop, zt);
    if ((jIn === 'last' && j === n - 1) || (jIn === 'first' && j === 0)) inBox.forEach(([mt, ...a]) => { const [x0, x1, y0, y1, z0, z1] = a, zs = Math.min(z1, Math.max(z0, zl - 0.02)); if (zs > z0 + 1e-4) acc.box(mt, x0, x1, y0, y1, z0, zs);
      if (z1 > zs + 1e-4) { const m = new T.Mesh(new T.BoxGeometry(x1 - x0, y1 - y0, z1 - zs), mt); m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (zs + z1) / 2); g.add(m); } });
    // the front's slice (the group's label over it) and the pull's piece in front of the cell
    const L = glab[q.gname], tu = (u) => (u - L.u0) / (L.u1 - L.u0), tv = (y) => (y - yLab0) / (yLab1 - yLab0);
    const FP = [V(uAt(j, yLab0, zf), yLab0, zf), V(uAt(j + 1, yLab0, zf), yLab0, zf), V(uAt(j + 1, yLab1, zf), yLab1, zf), V(uAt(j, yLab1, zf), yLab1, zf)];
    const fr = pdQuad(g, FP, L.mat, FP.map(p => [tu(p.x), tv(p.y)])); fr.userData.pdPlate = true;
    if (yLab0 > b + 0.006) { const y0 = b + 0.003, FQ = [V(uAt(j, y0, zf), y0, zf), V(uAt(j + 1, y0, zf), y0, zf), V(uAt(j + 1, yLab0, zf), yLab0, zf), V(uAt(j, yLab0, zf), yLab0, zf)]; pdQuad(g, FQ, M.NV); }   // (the plain front under the label)
    // (the pull's piece: its top over the front's top edge too and its face, cut along the same screen-upright lines (quads); its grip under it)
    const zp = zf + D.pullD, z0 = zf - D.fT, y1 = t, y0 = t - D.pullH, P = (jj, y, z) => V(uAt(jj, y, z), y, z);
    pdQuad(g, [P(j, y1, zp), P(j + 1, y1, zp), P(j + 1, y1, z0), P(j, y1, z0)], M.AL); pdQuad(g, [P(j, y0, zp), P(j + 1, y0, zp), P(j + 1, y1, zp), P(j, y1, zp)], M.AL);
    if (D.grip) pdQuad(g, [P(j, y0, zf), P(j + 1, y0, zf), P(j + 1, y0, zp), P(j, y0, zp)], M.ALD);
    pdMergeGroup(g);
    els.push({ key: it.key, kind: it.kind, en, nm, grp: PDGRP[it.key], cab: side, place: 'front', row: k, col: j, cell: [cx(j), cx(j + 1)], g, part: Hd, label: tag, scale: xF(s, 3) }); });
  // the wall shades on the insert (along the inner side wall the camera sees over, under the drawer above), the window for the log
  if (side === 'L') pdEdgeSh(sh, uri - 0.05, uri, zbi, zfi, ytop + 0.0015, 'u1', 0.4); else pdEdgeSh(sh, uli, uli + 0.05, zbi, zfi, ytop + 0.0015, 'u0', 0.4);
  pdEdgeSh(sh, uli, uri, zl - 0.02, zl + 0.05, ytop + 0.0015, 'w0', 0.42);
  return { n, x: [xF(xa, 1), xF(xb, 1)], win: [xF(zl), xF(zh)], y: [xF(pdS(0, ytop, zl)[1], 1), xF(pdS(0, t, zf + D.pullD)[1], 1), xF(pdS(0, b, zf)[1], 1)], scales: plan.map(q => xF(q.s, 3)) }; };
// the screen x span of a drawer row's cells: the screen's edge out, the box's inner wall in (the wall's least / most x over the window)
const pdSpan = (side, uWall, y, z0, z1, ed = 1.5) => { const xs = [z0, (z0 + z1) / 2, z1].map(z => pdS(uWall, y, z)[0]); return side === 'L' ? [ed, Math.min(...xs) - 0.6] : [Math.max(...xs) + 0.6, 412 - ed]; };
// ======== V1: MEHANIČNA OMARA ZA ORODJE ========
//   Two roll cabinets in a line along u (W wide each, a small gap between; their outer ends past the screen's edges), D deep, the top (with
//   its aluminium rim and the ribbed mat) at H, its back edge under the colour pools (screen y 662); five drawers (pitch), pulled out by
//   `pull` (a staircase: the two shallow top ones just open, the three deep ones well out, the lowest furthest), a full-width aluminium pull
//   on each front's top edge; the base with castors. The cells: on the top, the mat's tile a part (the part lying on the mat, its tag in
//   front of it); in drawers 2-4 the insert's tile a part (dark grey foam over yellow, its cut-out), the front's and the pull's slice.
const PD1 = { W: 1.54, gap: 0.012, D: 0.6, H: 1.05, rim: 0.018, topT: 0.03, base: 0.13, pitch: [0.07, 0.08, 0.16, 0.19, 0.25], pull: [0.012, 0.04, 0.24, 0.4, 0.55], yback: 662,
  dr: { fT: 0.02, pullH: 0.02, pullD: 0.022, grip: 1, labH: 0.085, wall: 0.006, inset: 0.012 + 0.012 + 0.006, slide: 0.012, dd: 0.56, under: 0.03, underAero: 0.062, ft: 0.022, clr: 0.013, tagD: 0.026, sMax: 1.15 },
  cabs: { L: { top: ['HEADLAMPS', [['lamp', 'led'], ['lamp', 'rum'], ['lamp', 'dim'], ['lamp', 'bil']]],
      dr: { 2: [['TAIL LAMPS', [['tail', 'dim'], ['tail', 'proz'], ['tail', 'okr'], ['tail', 'led']]]], 3: [['UNDERGLOW', [['ug', 'mod'], ['ug', 'tur'], ['ug', 'vij'], ['ug', 'rde'], ['ug', 'zel']]]], 4: [['INDICATORS', [['sig', 'proz'], ['sig', 'dim'], ['sig', 'tek']]], ['NUTS', [['nuts', 'nuts']]]] } },
    R: { top: ['CALIPERS', [['cal', 'rde'], ['cal', 'rum'], ['cal', 'zla'], ['cal', 'barva']]],
      dr: { 2: [['GRILLES', [['grille', 'sat'], ['grille', 'mrez'], ['grille', 'krom'], ['grille', 'karb'], ['grille', 'barva']]]], 3: [['AERO KITS', [['aero', 1], ['aero', 2], ['aero', 3], ['aero', 4]]]], 4: [['DECALS', [['decal', 'flames'], ['decal', 'check'], ['decal', 'star']]], ['DISCS', [['disc', 'dirk'], ['disc', 'ker']]]] } } } };
const pd1Lay = () => { const A = PD1, L = { A }; L.rimTop = A.H + A.rim; L.zb = pdZY(A.yback, 0, L.rimTop); L.face = L.zb + A.D;
  L.cab = { L: { ua: -A.gap / 2 - A.W, ub: -A.gap / 2 }, R: { ua: A.gap / 2, ub: A.gap / 2 + A.W } };
  L.y0 = A.H - A.topT - 0.022; let y = L.y0; L.drs = A.pitch.map((p, k) => { const d = { t: y - 0.002, b: y - p + 0.002, zFace: L.face, zf: L.face + A.pull[k] }; y -= p; return d; }); L.yBase = y;
  return L; };
// the cabinet's body (in acc): the sides, the back, the dark inside, the face frame under the top with the yellow line, the top (its plate,
// the aluminium rim), the base (a kick panel) and the castors
const pd1Body = (acc, M, L, c) => { const A = PD1, { ua, ub } = c, f = L.face, zb = L.zb, sd = 0.012, H = A.H;
  for (const [u0, u1] of [[ua, ua + sd], [ub - sd, ub]]) acc.box(M.NV, u0, u1, A.base, H - A.topT, zb, f);
  acc.box(M.NV, ua + sd, ub - sd, A.base, H - A.topT, zb, zb + 0.012);   // (the back)
  acc.box(M.CAV, ua + sd, ub - sd, A.base, A.base + 0.015, zb + 0.012, f - 0.01); acc.box(M.CAV, ua + sd + 0.001, ub - sd - 0.001, A.base + 0.015, L.y0, zb + 0.012, zb + 0.02);   // (the inside: the floor, the back, dark)
  for (const [u0, u1] of [[ua + sd, ua + sd + 0.004], [ub - sd - 0.004, ub - sd]]) acc.box(M.CAV, u0, u1, A.base + 0.015, L.y0, zb + 0.02, f - 0.004);
  acc.box(M.NV, ua, ub, L.y0, H - A.topT, f - 0.02, f); acc.box(M.YL, ua + 0.002, ub - 0.002, L.y0 + 0.004, L.y0 + 0.016, f, f + 0.003);   // (the face frame under the top, the yellow line on it)
  acc.box(M.NV, ua, ub, H - A.topT, H - 0.003, zb, f + 0.012);   // (the top plate, 12 mm over the front)
  const r = 0.016; acc.box(M.AL, ua, ub, H - 0.006, L.rimTop, f - 0.004, f + 0.014); acc.box(M.AL, ua, ub, H - 0.006, L.rimTop, zb, zb + r);   // (the rim: front, back, the ends)
  acc.box(M.AL, ua, ua + r, H - 0.006, L.rimTop, zb, f + 0.014); acc.box(M.AL, ub - r, ub, H - 0.006, L.rimTop, zb, f + 0.014);
  acc.box(M.NVE, ua + 0.01, ub - 0.01, A.base, L.yBase, f - 0.04, f - 0.022); acc.box(M.YL, ua + 0.012, ub - 0.012, L.yBase - 0.03, L.yBase - 0.018, f - 0.022, f - 0.019);   // (the base's kick panel, a yellow line)
  acc.box(M.NVE, ua, ub, A.base - 0.012, A.base, zb, f);   // (the bottom plate the castors are on)
  for (const u of [ua + 0.09, ub - 0.09]) for (const z of [zb + 0.09, f - 0.09]) { acc.box(M.STL, u - 0.045, u + 0.045, A.base - 0.02, A.base - 0.012, z - 0.045, z + 0.045);   // (a castor: its plate, its fork, its wheel and hub)
    acc.box(M.STL, u - 0.026, u - 0.02, 0.045, A.base - 0.02, z - 0.03, z + 0.03); acc.box(M.STL, u + 0.02, u + 0.026, 0.045, A.base - 0.02, z - 0.03, z + 0.03); acc.cyl(M.RUB, 0.05, 0.036, u, 0.05, z, 'x', 18); acc.cyl(M.HUB, 0.026, 0.04, u, 0.05, z, 'x', 12); } };
// the top: the ribbed mat inside the rim (a static strip at the back with the group's name; the cells' tiles in front of it), each part
// lying on its tile, its soft shadow, its tag
const pd1Top = (F, acc, sh, M, L, side, els) => { const A = PD1, c = L.cab[side], [gname, items] = A.cabs[side].top, r = 0.016, y = A.H + 0.004, ua = c.ua + r, ub = c.ub - r, z0 = L.zb + r, z1 = L.face - 0.004;
  const zs0 = z0 + 0.004, zs1 = zs0 + 0.05, zc0 = zs1 + 0.004;   // (the name strip; the cells from behind it)
  const uw = side === 'L' ? ub : ua, [xa, xb] = pdSpan(side, uw, y, zc0, z1, 2), n = items.length, cx = (j) => xa + (xb - xa) * j / n;
  const uIn = (j, z) => (j <= 0 ? ua : j >= n ? ub : pdUX(cx(j), y, z));
  acc.box(M.RUB, ua, ub, A.H - 0.003, y - 0.002, z0, z1);   // (the mat's body under its surface pieces)
  pdFlat(F, [[ua, z0], [ub, z0], [ub, zc0], [ua, zc0]], y, M.MAT);   // (the mat's back strip under the name)
  const sv = [pdUX(xa + 4, y, zs0), pdUX(xb - 4, y, zs0)], sw = Math.min(0.9, sv[1] - sv[0]); pdTag(F, gname, sw, zs1 - zs0, (sv[0] + sv[1]) / 2, y, (zs0 + zs1) / 2, { font: 62, line: 8 });
  const tagD = 0.034, zT1 = z1 - 0.014, zT0 = zT1 - tagD;
  const fits = items.map(([key, kind], j) => { const it = pdItem(key, kind), zm = (zc0 + zT0 - 0.01) / 2, ul = pdUX(cx(j) + 3, y, zm), ur = pdUX(cx(j + 1) - 3, y, zm), turn = key === 'lamp', fw = turn ? it.fd : it.fw, fd = turn ? it.fw : it.fd;   // (a pair of headlamps one behind the other)
    if (turn) it.g.rotation.y = Math.PI / 2; return { j, it, zm, ul, ur, fw, fd, s: Math.min((ur - ul - 0.04) / fw, (zT0 - 0.03 - zc0) / fd, key === 'cal' ? 1.15 : 0.74) }; });
  const s = Math.min(...fits.map(q => q.s));
  fits.forEach(({ j, it, zm, ul, ur, fw, fd }) => { const g = new T.Group(); F.add(g); const [en, nm] = PDEL[it.key][it.kind];
    const Q = [[uIn(j, zc0), zc0], [uIn(j + 1, zc0), zc0], [uIn(j + 1, z1), z1], [uIn(j, z1), z1]]; const mt = pdFlat(g, Q, y, M.MAT); mt.userData.pdTint = true;
    const uc = (ul + ur) / 2, Hd = it.g; Hd.scale.setScalar(s); Hd.position.set(uc, y, zm); if (it.key === 'cal') Hd.rotation.y = (j % 2 ? -0.12 : 0.1); g.add(Hd);
    pdSoft(sh, uc, zm + 0.006, y + 0.001, fw * s * 1.1 + 0.01, fd * s * 1.15 + 0.015, 0.46);
    const zt = (zT0 + zT1) / 2, ta = pdUX(cx(j) + 4, y, zt), tb = pdUX(cx(j + 1) - 4, y, zt); const tag = pdTag(g, en, Math.min(0.3, (tb - ta) * 0.9), tagD, (ta + tb) / 2, y, zt);
    pdMergeGroup(g); els.push({ key: it.key, kind: it.kind, en, nm, grp: PDGRP[it.key], cab: side, place: 'top', row: 0, col: j, cell: [cx(j), cx(j + 1)], g, part: Hd, label: tag, scale: xF(s, 3) }); });
  return { x: [xF(xa, 1), xF(xb, 1)], y: [xF(pdS(0, y, zc0)[1], 1), xF(pdS(0, y, z1)[1], 1)], s: xF(s, 3) }; };
const pd1Build = (S, out, o = {}) => { const A = PD1, M = pdMats(), L = pd1Lay(), els = [], F = PR.group(); F.position.set(0, 0, 0.2); F.rotation.y = 0.3; F.updateMatrixWorld(true);
  pdHideGame(S, out); const sh = new T.Group(); F.add(sh); const cabs = {}, lay = { face: xF(L.face), zb: xF(L.zb), rows: {} };
  ['L', 'R'].forEach(side => { const c = L.cab[side], G = new T.Group(); F.add(G); cabs[side] = G; const acc = pdAcc(); pd1Body(acc, M, L, c);
    lay.rows[side + 'top'] = pd1Top(F, acc, sh, M, L, side, els);
    const D = Object.assign({}, A.dr, { mats: { T: M.FOAM, W: M.FOAMW, col: PDCOL.yel } }), uIn = side === 'L' ? c.ub : c.ua;   // (the cells to the cabinet's inner end: the inner cell over the drawer's wall)
    L.drs.forEach((dr, k) => { const occ = [[L.face + 0.012, A.H - A.topT]]; for (let i = 0; i < k; i++) { const q = L.drs[i]; occ.push([q.zf, q.b], [q.zf + D.pullD, q.t - D.pullH - 0.005]); }
      const groups = A.cabs[side].dr[k];
      if (!groups) { pdDrawerShut(F, acc, sh, M, D, c, dr, occ); return; }
      const ytop = dr.t - D.under, zl = Math.max(...occ.map(([we, he]) => pdRay(we, he, ytop))), zh = pdRay(dr.zf + D.pullD, dr.t, ytop); dr.x = pdSpan(side, uIn, ytop, zl, zh);
      lay.rows[side + k] = pdDrawer(F, acc, sh, M, D, c, k, dr, groups, occ, els, side); });
    acc.flush(G, { cast: (m) => m === M.NV || m === M.AL }); });
  F.updateMatrixWorld(true); [cabs.L, cabs.R, sh].forEach(g => { if (!out.frames.includes(g)) out.frames.push(g); }); pdNanCheck(F);
  out.drawers = []; out.aeroDr = null; out.xc = { opt: 'pd_1', groups: [], extra: [] }; out.s6 = { L: lay, els, F, cabs, names: [] }; return out; };
// a drawer with nothing to show (V1's two shallow top ones, just open; V2's shut ones): its box, its front, its pull; the insert plain (if it shows)
const pdDrawerShut = (F, acc, sh, M, D, cab, dr, occ) => { const { ua, ub } = cab, { zf, t, b } = dr, uli = ua + D.inset, uri = ub - D.inset, zfi = zf - D.fT, zbi = zf - D.dd + D.wall, ytop = t - D.under;
  acc.box(M.NV, ua + 0.003, ub - 0.003, b, t - D.pullH, zf - D.fT, zf); acc.box(M.AL, ua + 0.003, ub - 0.003, t - D.pullH, t, zf - D.fT, zf + D.pullD);
  if (D.grip) acc.box(M.ALD, ua + 0.003, ub - 0.003, t - D.pullH - 0.005, t - D.pullH, zf, zf + D.pullD - 0.004);
  if (zf - D.fT > dr.zFace + 0.002) { acc.box(M.BOX, uli - D.wall, uri + D.wall, b + 0.004, t - 0.012, zbi - D.wall, zfi); acc.box(D.mats.T, uli, uri, ytop - (D.ft || 0.02), ytop, zbi, zfi);   // (just open: the insert's edge shows)
    pdEdgeSh(sh, uli, uri, zfi - 0.06, zfi, ytop + 0.0015, 'w0', 0.45); } };
// ======== V2: PREDALNIK ZA NAČRTE ========
//   One long low plan chest along u (its ends past the screen's edges): an oak top (its back edge under the colour pools), navy steel, the
//   yellow line under the top, a dark plinth; two columns of n wide shallow drawers (a stile between them); in each column four drawers
//   pulled out to different depths (a staircase: the lower, the further); a front: a thin aluminium lip pull along its top edge, the group's
//   name on it; inside dark felt over light blue felt, a shaped recess an item, its small name tag in front of it. The shut drawers: their
//   fronts, an aluminium label holder with a blank card.
const PD2 = { Lc: 3.14, stile: 0.04, D: 0.8, H: 0.7, topT: 0.032, over: 0.02, plinth: 0.07, pitch: [0.085, 0.052, 0.075, 0.052, 0.085, 0.052, 0.068, 0.05], open: [0, 2, 4, 6], pull: [0.235, 0.405, 0.56, 0.72], yback: 662,
  dr: { fT: 0.018, pullH: 0.01, pullD: 0.005, grip: 0, wall: 0.008, inset: 0.016 + 0.01 + 0.008, slide: 0.01, dd: 0.77, under: 0.012, ftDeep: 0.016, clr: 0.014, tagD: 0.026, sMax: 1.15, lab: { H: 64, font: 46, pad: 6, line: 7 } },
  cols: { L: [[['HEADLAMPS', [['lamp', 'led'], ['lamp', 'rum'], ['lamp', 'dim'], ['lamp', 'bil']]]], [['TAIL LAMPS', [['tail', 'dim'], ['tail', 'proz'], ['tail', 'okr'], ['tail', 'led']]]],
      [['UNDERGLOW', [['ug', 'mod'], ['ug', 'tur'], ['ug', 'vij'], ['ug', 'rde'], ['ug', 'zel']]]], [['INDICATORS', [['sig', 'proz'], ['sig', 'dim'], ['sig', 'tek']]], ['NUTS', [['nuts', 'nuts']]]]],
    R: [[['GRILLES', [['grille', 'sat'], ['grille', 'mrez'], ['grille', 'krom'], ['grille', 'karb'], ['grille', 'barva']]]], [['CALIPERS', [['cal', 'rde'], ['cal', 'rum'], ['cal', 'zla'], ['cal', 'barva']]]],
      [['AERO KITS', [['aero', 1], ['aero', 2], ['aero', 3], ['aero', 4]]]], [['DECALS', [['decal', 'flames'], ['decal', 'check'], ['decal', 'star']]], ['DISCS', [['disc', 'dirk'], ['disc', 'ker']]]]] } };
const pd2Lay = () => { const A = PD2, L = { A }; L.zb = pdZY(A.yback, 0, A.H); L.face = L.zb + A.D - A.over; L.u0 = -A.Lc / 2; L.u1 = A.Lc / 2;
  L.cab = { L: { ua: L.u0 + 0.02, ub: -A.stile / 2 }, R: { ua: A.stile / 2, ub: L.u1 - 0.02 } };
  L.y0 = A.H - A.topT - 0.03; L.drs = []; let y = L.y0; A.pitch.forEach((p, k) => { const t = y - 0.002, b = y - p + 0.002, i = A.open.indexOf(k); L.drs.push({ t, b, zFace: L.face, zf: L.face + (i >= 0 ? A.pull[i] : 0), open: i }); y -= p; }); L.yBot = y; L.pitch = A.pitch;
  return L; };
const pd2Body = (acc, M, L) => { const A = PD2, f = L.face, zb = L.zb, u0 = L.u0, u1 = L.u1, sd = 0.02;
  for (const [a, b] of [[u0, u0 + sd], [u1 - sd, u1]]) acc.box(M.NV, a, b, 0, A.H - A.topT, zb, f);
  acc.box(M.NV, u0 + sd, u1 - sd, 0, A.H - A.topT, zb, zb + 0.012); acc.box(M.NV, -A.stile / 2, A.stile / 2, A.plinth, L.y0, zb + 0.012, f);   // (the back, the stile)
  acc.box(M.CAV, u0 + sd, u1 - sd, A.plinth - 0.01, A.plinth, zb + 0.012, f - 0.01); acc.box(M.CAV, u0 + sd + 0.001, u1 - sd - 0.001, A.plinth, L.y0, zb + 0.012, zb + 0.02);
  for (const [a, b] of [[u0 + sd, u0 + sd + 0.004], [-A.stile / 2 - 0.004, -A.stile / 2], [A.stile / 2, A.stile / 2 + 0.004], [u1 - sd - 0.004, u1 - sd]]) acc.box(M.CAV, a, b, A.plinth, L.y0, zb + 0.02, f - 0.004);
  acc.box(M.NV, u0, u1, L.y0, A.H - A.topT, f - 0.02, f); acc.box(M.YL, u0 + 0.002, u1 - 0.002, L.y0 + 0.008, L.y0 + 0.02, f, f + 0.003);   // (the rail under the top, the yellow line)
  acc.box(M.NV, u0, u1, A.plinth, L.yBot, f - 0.02, f); acc.box(M.NVE, u0 + 0.01, u1 - 0.01, 0, A.plinth, zb + 0.03, f - 0.05); acc.box(M.CAV, u0, u1, 0, 0.004, zb, f);   // (the bottom rail, the plinth set back)
  acc.box(M.TOP2, u0 - 0.012, u1 + 0.012, A.H - A.topT, A.H, zb, f + A.over); acc.box(M.AL, u0 - 0.012, u1 + 0.012, A.H - A.topT - 0.004, A.H - A.topT, f - 0.02, f + A.over);   // (the top (navy steel) over the front, a steel edge under it)
  acc.box(M.YL, u0 - 0.012, u1 + 0.012, A.H - 0.016, A.H - 0.006, f + A.over, f + A.over + 0.002); };   // (the yellow line on the top's front edge)
// a plan on the chest's top (a generic coupe's side view: white lines on blueprint blue, a grid, dimension lines, an empty title block;
// no names) and a rolled plan beside it: what a plan chest keeps (not parts: nothing on the top is an element)
const pdPlanTex = () => pdTex('plan', 1024, 560, (g, W, H) => { g.fillStyle = '#2a5a92'; g.fillRect(0, 0, W, H); g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 1; for (let x = 0; x < W; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y < H; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  g.strokeStyle = 'rgba(232,240,250,0.8)'; g.lineWidth = 3; g.strokeRect(18, 18, W - 36, H - 36); g.strokeRect(W - 300, H - 120, 282, 102); g.beginPath(); g.moveTo(W - 300, H - 70); g.lineTo(W - 18, H - 70); g.moveTo(W - 160, H - 120); g.lineTo(W - 160, H - 18); g.stroke();
  g.lineWidth = 4; g.beginPath(); g.moveTo(120, 330); g.bezierCurveTo(130, 290, 190, 282, 260, 276); g.lineTo(380, 268); g.bezierCurveTo(430, 210, 520, 190, 600, 192); g.bezierCurveTo(680, 194, 740, 228, 790, 262); g.lineTo(880, 276); g.bezierCurveTo(910, 284, 916, 312, 910, 336); g.lineTo(120, 340); g.closePath(); g.stroke();
  g.beginPath(); g.moveTo(410, 266); g.bezierCurveTo(450, 222, 520, 206, 590, 208); g.lineTo(600, 264); g.closePath(); g.moveTo(612, 208); g.bezierCurveTo(670, 212, 720, 236, 760, 264); g.lineTo(620, 264); g.closePath(); g.stroke();
  for (const x of [270, 760]) { g.beginPath(); g.arc(x, 340, 52, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(x, 340, 30, 0, Math.PI * 2); g.stroke(); }
  g.lineWidth = 2; g.beginPath(); g.moveTo(270, 420); g.lineTo(760, 420); g.moveTo(270, 408); g.lineTo(270, 432); g.moveTo(760, 408); g.lineTo(760, 432); g.moveTo(120, 450); g.lineTo(910, 450); g.moveTo(120, 438); g.lineTo(120, 462); g.moveTo(910, 438); g.lineTo(910, 462); g.stroke();
  g.beginPath(); g.moveTo(960, 192); g.lineTo(960, 392); g.moveTo(948, 192); g.lineTo(972, 192); g.moveTo(948, 392); g.lineTo(972, 392); g.stroke(); });
const pd2Plans = (F, M, L) => { const A = PD2, y = A.H + 0.0012, z0 = L.zb + 0.14, z1 = L.face - 0.09, u0 = -1.3, u1 = -0.32;
  const m = new T.Mesh(new T.PlaneGeometry(u1 - u0, z1 - z0), new T.MeshLambertMaterial({ map: pdPlanTex(), color: 0xc8d2de })); m.rotation.set(-Math.PI / 2, 0, 0.035); m.position.set((u0 + u1) / 2, y, (z0 + z1) / 2); m.receiveShadow = true; F.add(m);
  const RL = new T.MeshLambertMaterial({ color: 0x6f9bd0 }), r = 0.032; for (const [u, z, len, a] of [[0.62, L.face - 0.24, 0.86, 0.06], [0.7, L.face - 0.17, 0.78, -0.03]]) { const c = new T.Mesh(new T.CylinderGeometry(r, r, len, 24), RL); c.rotation.set(0, a, Math.PI / 2); c.position.set(u, A.H + r, z); c.castShadow = true; c.receiveShadow = true; F.add(c);
    const band = new T.Mesh(new T.CylinderGeometry(r + 0.002, r + 0.002, 0.02, 24), PR.mat(0xd8343c, { shininess: 30 })); band.rotation.copy(c.rotation); band.position.copy(c.position); F.add(band); }
  return m; };
// a shut drawer's label holder (a small aluminium frame, a blank card) at the middle of its column's front
const pd2Holder = (acc, M, u, dr, D) => { const yc = (dr.b + dr.t - D.pullH) / 2, h = Math.min(0.03, dr.t - dr.b - D.pullH - 0.008), z = dr.zf; acc.box(M.AL, u - 0.06, u + 0.06, yc - h / 2, yc + h / 2, z - 0.001, z + 0.003); acc.box(M.CARD, u - 0.052, u + 0.052, yc - h / 2 + 0.004, yc + h / 2 - 0.004, z + 0.003, z + 0.0035); };
const pd2Build = (S, out, o = {}) => { const A = PD2, M = pdMats(), L = pd2Lay(), els = [], F = PR.group(); F.position.set(0, 0, 0.2); F.rotation.y = 0.3; F.updateMatrixWorld(true);
  pdHideGame(S, out); const sh = new T.Group(); F.add(sh); const G = new T.Group(); F.add(G); const acc = pdAcc(); pd2Body(acc, M, L); const lay = { face: xF(L.face), zb: xF(L.zb), pitch: A.pitch, rows: {} };
  const D = Object.assign({}, A.dr, { mats: { T: M.FELT, W: M.FELTW, col: PDCOL.blu } });
  ['L', 'R'].forEach(side => { const c = L.cab[side], uIn = side === 'L' ? c.ub : c.ua;
    L.drs.forEach((dr0, k) => { const dr = Object.assign({}, dr0), occ = [[L.face + A.over, A.H - A.topT - 0.004]]; for (let i = 0; i < k; i++) { const q = L.drs[i]; occ.push([q.zf, q.b], [q.zf + D.pullD, q.t - D.pullH]); }
      if (dr.open < 0) { pdDrawerShut(F, acc, sh, M, D, c, dr, occ); pd2Holder(acc, M, (c.ua + c.ub) / 2, dr, D); return; }
      const groups = A.cols[side][dr.open], ytop = dr.t - D.under, zl = Math.max(...occ.map(([we, he]) => pdRay(we, he, ytop))), zh = pdRay(dr.zf + D.pullD, dr.t, ytop); dr.x = pdSpan(side, uIn, ytop, zl, zh);
      lay.rows[side + k] = pdDrawer(F, acc, sh, M, D, c, k, dr, groups, occ, els, side); }); });
  acc.flush(G, { cast: (m) => m === M.NV || m === M.TOP2 }); pd2Plans(F, M, L); const cabs = { L: G, R: new T.Group() };
  F.updateMatrixWorld(true); [G, sh].forEach(g => { if (!out.frames.includes(g)) out.frames.push(g); }); pdNanCheck(F);
  out.drawers = []; out.aeroDr = null; out.xc = { opt: 'pd_2', groups: [], extra: [] }; out.s6 = { L: lay, els, F, cabs, names: [] }; return out; };
// (a check: every mesh's positions and its world matrix finite)
const pdNanCheck = (F) => { let n = 0; F.traverse(m => { if (!m.isMesh) return; const A = m.geometry.attributes.position.array; let bad = false; for (let i = 0; i < A.length; i++) if (!isFinite(A[i])) { bad = true; break; }
  if ((bad || m.matrixWorld.elements.some(v => !isFinite(v))) && n++ < 12) console.error('PDNAN ' + (m.material && m.material.type) + ' ' + A.length); }); if (n) console.error('PDNAN total ' + n); };
const pdaFronts = (S, out, o = {}) => { pdHideGift(S); if (PDA.v === 1) return pd1Build(S, out, o); if (PDA.v === 2) return pd2Build(S, out, o); return om6Fronts(S, out, o); };
// ==== PNB (agent PNB, round PN: the user chose round PD's version 2, the PLAN CHEST (agent PDA's "PREDALNIK ZA NAČRTE") and asked "Naredi 2
//      v 6 različnih oblikah. 3 naredi ravne omarice in 3 naredi rahlo zavite." Agent PNA makes the three straight forms (1-3); this block makes
//      the three GENTLY CURVED forms, PNB.v 4, 5, 6). The chest's front, top and back follow a slight arc (radius 10 m about a point on the
//      ring's axis far behind the ring: the cabinet bows gently round the car, much flatter than the regal's 4.75 m), while each drawer stays
//      a real STRAIGHT box (flat sides, a straight back, a floor; only its front bowed along the arc) pulled out along its own direction, on
//      ball-bearing slides. As in version 2: the parts lie flat in shaped recesses in dark felt over light blue felt, a small name tag before
//      each, the group's name on the drawer's front (white on navy, the yellow line), the dark inside of the chest, soft shadows.
//      PNB.v 4 "DOLG UKRIVLJEN PREDALNIK": one long bow-front chest across the whole width, two columns (the stile a little left of the
//        middle: 4 parts a drawer on the left, 5 on the right, all cells ~45 px wide), all drawers pulled straight out;
//      PNB.v 5 "DVA UKRIVLJENA PREDALNIKA": two chests on the arc (left: the lights, right: the rest), a narrow gap between them, each turned
//        to the car and its drawers pulled along its own axis;
//      PNB.v 6 "STOPNIČAST UKRIVLJEN PREDALNIK": one chest of three sections over the curve, the outer two set back 4 cm (a stepped front),
//        the outer pieces built against the middle one's ends, all drawers pulled straight out (pulled along their radii the sections'
//        drawers fanned apart and opened 16-20 px wedges between the columns).
//      All three are about 1 m tall with equal drawers (a tall plan chest); four drawers a column are open (the 1st, 4th, 7th and 11th or
//      12th), the lower the further (a staircase), the shut ones between them hidden under the open ones: so the thin top takes only ~70 px
//      of the first view (version 2: 88) and each row of drawers is ~44-47 px tall (the curve tilts the outer rows a little on the screen,
//      so a row must be taller than 40 px for a 40 × 40 target). PNB.v 0: PDA's version 2 as before ----
const PNB = { v: 4 };
// ---- the curve (in the arc frame F: x = u, z = w; its middle (0, wc)) and a column's frame K: its local x along the arc's tangent at angle
//      a, its z out along that radius (the drawers' pull); its origin on its shut front's arc (radius R0) at angle a ----
const pnK = (wc, R0, a) => ({ a, R0, wc, O: [R0 * Math.sin(a), wc + R0 * Math.cos(a)], ca: Math.cos(a), sa: Math.sin(a) });
const pnF = (K, x, z) => [K.O[0] + x * K.ca + z * K.sa, K.O[1] - x * K.sa + z * K.ca];   // (K -> F)
const pnL = (K, u, w) => { const du = u - K.O[0], dw = w - K.O[1]; return [du * K.ca - dw * K.sa, du * K.sa + dw * K.ca]; };   // (F -> K)
const pnS = (K, x, y, z) => { const [u, w] = pnF(K, x, z); return pdS(u, y, w); };
const pnUX = (K, c, y, z) => pdBis(x => pnS(K, x, y, z)[0], -4, 4, c);   // (the local x seen at screen x c, at height y, depth z)
const pnZr = (K, x, r) => { const R = r == null ? K.R0 : r; return Math.sqrt(Math.max(0, R * R - x * x)) - K.R0; };   // (the arc of radius r (the shut front's: R0) about the curve's middle: its z in K at x)
const pnDz = (K, x, r) => (pnZr(K, x + 1e-4, r) - pnZr(K, x - 1e-4, r)) / 2e-4;
const pnRay = (K, we, he, hf) => { const cz = pnL(K, PDCU, PDCW)[1]; return we - (he - hf) * (cz - we) / (PDCH - he); };   // (the camera's ray over the edge (z we, height he) down to height hf: its z there)
const pnP = (wc, r, b, y) => V(r * Math.sin(b), y, wc + r * Math.cos(b));   // (polar in F: radius r, angle b, height y)
const pnRd = (b) => V(Math.sin(b), 0, Math.cos(b)), pnTg = (b) => V(Math.cos(b), 0, -Math.sin(b));
// ---- geometry: a grid (fn(s, t) -> [point, normal, uv?]) wound to face along its normals; an annular sector box (F); a plate with a bowed
//      front edge, a band between two curves (K), extruded upward ----
const pnGeo = (ns, nt, fn) => { const pos = [], nor = [], uv = [], idx = [], P = [], N = [];
  for (let j = 0; j <= nt; j++) for (let i = 0; i <= ns; i++) { const q = fn(i / ns, j / nt); P.push(q[0]); N.push(q[1]); pos.push(q[0].x, q[0].y, q[0].z); nor.push(q[1].x, q[1].y, q[1].z); const t = q[2] || [i / ns, j / nt]; uv.push(t[0], t[1]); }
  const at = (i, j) => j * (ns + 1) + i;
  for (let j = 0; j < nt; j++) for (let i = 0; i < ns; i++) { const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), d = at(i, j + 1);
    const c1 = V().subVectors(P[b], P[a]).cross(V().subVectors(P[c], P[a])), c2 = V().subVectors(P[c], P[a]).cross(V().subVectors(P[d], P[a])), cr = c1.lengthSq() > c2.lengthSq() ? c1 : c2;
    if (cr.dot(V().addVectors(N[a], N[c])) >= 0) idx.push(a, b, c, a, c, d); else idx.push(a, c, b, a, d, c); }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return g; };
// (faces: t(op) b(ottom) i(nner: toward the curve's middle) o(uter) l (its b0 end) r (its b1 end); flip: facing in)
const pnSlab = (acc, mat, wc, r0, r1, b0, b1, y0, y1, faces = 'tbiolr', o = {}) => { const n = o.n || Math.max(1, Math.ceil(Math.abs(b1 - b0) * Math.max(r1, 0.5) / 0.08)), B = (s) => b0 + (b1 - b0) * s, f = o.flip ? -1 : 1, put = (fn, ns, nt) => acc.add(mat, pnGeo(ns, nt, fn));
  if (r1 - r0 < 1e-5 && !/[io]/.test(faces)) return; if (y1 - y0 < 1e-5 && !/[tb]/.test(faces)) return;
  if (faces.includes('t')) put((s, t) => [pnP(wc, r0 + (r1 - r0) * t, B(s), y1), V(0, f, 0)], n, 1);
  if (faces.includes('b')) put((s, t) => [pnP(wc, r0 + (r1 - r0) * t, B(s), y0), V(0, -f, 0)], n, 1);
  if (faces.includes('o')) put((s, t) => [pnP(wc, r1, B(s), y0 + (y1 - y0) * t), pnRd(B(s)).multiplyScalar(f)], n, 1);
  if (faces.includes('i')) put((s, t) => [pnP(wc, r0, B(s), y0 + (y1 - y0) * t), pnRd(B(s)).multiplyScalar(-f)], n, 1);
  if (faces.includes('l')) put((s, t) => [pnP(wc, r0 + (r1 - r0) * s, b0, y0 + (y1 - y0) * t), pnTg(b0).multiplyScalar(-f)], 1, 1);
  if (faces.includes('r')) put((s, t) => [pnP(wc, r0 + (r1 - r0) * s, b1, y0 + (y1 - y0) * t), pnTg(b1).multiplyScalar(f)], 1, 1); };
const pnUp = (y0) => new T.Matrix4().makeTranslation(0, y0, 0).multiply(new T.Matrix4().makeRotationX(-Math.PI / 2));
const pnPlate = (acc, mat, x0, x1, zb, zfn, y0, y1, n = 24) => { if (x1 - x0 < 1e-4) return; const sh = new T.Shape(); sh.moveTo(x0, -zb); sh.lineTo(x1, -zb); for (let i = 0; i <= n; i++) { const x = x1 + (x0 - x1) * i / n; sh.lineTo(x, -zfn(x)); } sh.closePath();
  acc.add(mat, new T.ExtrudeGeometry(sh, { depth: Math.max(1e-4, y1 - y0), bevelEnabled: false, curveSegments: 1 }), pnUp(y0)); };
const pnBand = (acc, mat, x0, x1, za, zb, y0, y1, n = 24) => { if (x1 - x0 < 1e-4) return; const sh = new T.Shape(); for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n; if (i) sh.lineTo(x, -za(x)); else sh.moveTo(x, -za(x)); }
  for (let i = n; i >= 0; i--) { const x = x0 + (x1 - x0) * i / n; sh.lineTo(x, -zb(x)); } sh.closePath(); acc.add(mat, new T.ExtrudeGeometry(sh, { depth: Math.max(1e-4, y1 - y0), bevelEnabled: false, curveSegments: 1 }), pnUp(y0)); };
// a column's static parts go into the body's buffers (one mesh a material for the whole chest): an acc that moves them from K to F first
const pnAccT = (acc, m4) => { const A = { add: (mat, geo, mtx) => acc.add(mat, geo, mtx ? m4.clone().multiply(mtx) : m4.clone()),
  box: (mat, x0, x1, y0, y1, z0, z1) => { if (x1 - x0 < 1e-5 || y1 - y0 < 1e-5 || z1 - z0 < 1e-5) return; A.add(mat, new T.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), new T.Matrix4().makeTranslation((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)); } }; return A; };
// a box turned by the angle th about y (K's acc), its middle (x, y, z)
const pnBoxR = (acc, mat, w, h, d, x, y, z, th) => acc.add(mat, new T.BoxGeometry(w, h, d), new T.Matrix4().makeTranslation(x, y, z).multiply(new T.Matrix4().makeRotationY(th)));
// a strip on the bowed surface z = zfn(x) (its normal from the curve), from the seam xl(t) to xr(t) (t 0 at y0, 1 at y1); uv (x, y) -> [u, v]
const pnLerp = (a, b, s) => (s <= 0 ? a : s >= 1 ? b : a + (b - a) * s);   // (exact at the ends: neighbouring strips share their edges bit for bit, no cracks)
const pnStripV = (par, mat, xl, xr, y0, y1, zfn, uvf, ns = 6) => { const g = pnGeo(ns, 1, (s, t) => { const a = pnLerp(xl[0], xl[1], t), b = pnLerp(xr[0], xr[1], t), x = pnLerp(a, b, s), y = pnLerp(y0, y1, t), dz = (zfn(x + 1e-4) - zfn(x - 1e-4)) / 2e-4;
    return [V(x, y, zfn(x)), V(-dz, 0, 1).normalize(), uvf ? uvf(x, y) : [s, t]]; }); const m = new T.Mesh(g, mat); m.receiveShadow = true; par.add(m); return m; };
// a level strip at height y from the curve za(x) (back) to zb(x) (front), between x0 and x1
const pnStripH = (par, mat, x0, x1, y, za, zb, ns = 6) => { const g = pnGeo(ns, 1, (s, t) => { const x = pnLerp(x0, x1, s); return [V(x, y, t <= 0 ? za(x) : t >= 1 ? zb(x) : za(x) + (zb(x) - za(x)) * t), V(0, 1, 0)]; }); const m = new T.Mesh(g, mat); m.receiveShadow = true; par.add(m); return m; };
// a cut-out's outline turned by h.rot about its middle; its bottom (as pdHoleBot, with the turned outline)
const pnOutline = (h, d = 0, n = 32) => { const P = pdOutline(h, d, n), c = Math.cos(h.rot || 0), s = Math.sin(h.rot || 0); return P.map(([u, w]) => { const du = u - h.u, dw = w - h.w; return [h.u + du * c + dw * s, h.w - du * s + dw * c]; }); };
const pnHoleBot = (par, h, y, ao, cols, mat) => { const O = pnOutline(h, 0), I = pnOutline(h, -ao), n = O.length, p = [], c = [], up = [];
  const tri = (A, B, Cc, ca, cb, cc) => { const cr = (B[0] - A[0]) * (Cc[1] - A[1]) - (B[1] - A[1]) * (Cc[0] - A[0]); const L = cr < 0 ? [[A, ca], [B, cb], [Cc, cc]] : [[A, ca], [Cc, cc], [B, cb]];
    L.forEach(([q, col]) => { p.push(q[0], y, q[1]); c.push(col.r, col.g, col.b); up.push(0, 1, 0); }); };
  const [CI, CE] = cols, cen = [h.u, h.w];
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; tri(O[i], O[j], I[j], CE, CE, CI); tri(O[i], I[j], I[i], CE, CI, CI); tri(cen, I[i], I[j], CI, CI, CI); }
  const G = new T.BufferGeometry(); G.setAttribute('position', new T.Float32BufferAttribute(p, 3)); G.setAttribute('normal', new T.Float32BufferAttribute(up, 3)); G.setAttribute('color', new T.Float32BufferAttribute(c, 3)); G.setAttribute('uv', new T.Float32BufferAttribute(new Array(p.length / 3 * 2).fill(0), 2));
  const m = new T.Mesh(G, mat); m.receiveShadow = true; par.add(m); return m; };
// a curved edge shade on the insert (dark at the back edge z0(x), gone at z0(x) + d), between x0 and x1
const pnEdgeShC = (par, x0, x1, z0, d, y, op) => { const g = pnGeo(10, 1, (s, t) => { const x = x0 + (x1 - x0) * s; return [V(x, y, z0(x) + d * t), V(0, 1, 0), [s, t]]; }); const m = new T.Mesh(g, pdShMat(op, true)); m.renderOrder = 2; m.receiveShadow = false; par.add(m); return m; };
// ======== A DRAWER ROW: drawer (t, b, pulled p) of column C (its frame K, its group G, its static parts' acc, its shadows' group sh;
//          the opening between local x xo0..xo1 at the front, xb0..xb1 at the back; inner: [bool, bool] which ends are inner (their
//          cell owns the double wall), edge: [bool, bool] which ends run past the screen's edge); its cells from screen x dr.x[0] to
//          dr.x[1] (the seams upright on the screen); occ: the edges over it ({ z(x), h }: what hides its back part) ========
const pnDrawer = (F, C, M, D, k, dr, groups, occ, els) => {
  const K = C.K, acc = C.acc, sh = C.sh, { t, b, p } = dr, under = groups.some(q => q[1].some(it => it[0] === 'aero')) ? D.underAero || D.under : D.under, ytop = t - under, yb = b + D.ftDeep;
  const uli = C.xb0 + D.inset, uri = C.xb1 - D.inset, zf = (x) => pnZr(K, x) + p, zfi = (x) => zf(x) - D.fT, zbk = p - D.dd, zbi = zbk + D.wall;
  const zHi = (x, y) => pnRay(K, zfi(x), t, y), zLo = (x, y) => Math.max(zbi, ...occ.filter(e => e.h > y + 1e-4).map(e => pnRay(K, e.z(x), e.h, y)));
  // the box (dark steel): the floor, the sides, the back (straight; the front's inner face bowed); the insert's lower layer; the front's body
  const nq = Math.max(4, Math.ceil((uri - uli) / 0.15));   // (the bowed plates' segments: 15 cm chords, 0.3 mm off the arc)
  pnPlate(acc, M.BOX, uli - D.wall, uri + D.wall, zbk, zfi, b + 0.004, b + 0.012, nq);
  const inBox = [], ym = (b + t) / 2 - 0.004;
  [[uli - D.wall, uli, 0], [uri, uri + D.wall, 1]].forEach(([x0, x1, s]) => { const zq = zfi(s ? x1 : x0);
    if (C.inner[s]) { const ib = []; inBox[s] = ib; ib.push([M.BOX, s ? uri : C.xo0 + 0.006, s ? C.xo1 - 0.006 : uli, b + 0.004, t - 0.012, zbk, zq]);   // (the inner side: a double wall to the opening's edge, its ball-bearing slide on it)
      const [s0, s1] = s ? [C.xo1 - 0.006, C.xo1 - 0.0015] : [C.xo0 + 0.0015, C.xo0 + 0.006];
      ib.push([M.STL, s0, s1, ym - 0.011, ym + 0.011, zbi, zq - 0.008], [M.ALD, s ? s0 + 0.001 : s0, s ? s1 : s1 - 0.001, ym - 0.008, ym + 0.008, pnZr(K, s ? s1 : s0) - 0.3, zq - 0.04]);
      for (let z = zbi + 0.03; z < zq - 0.03; z += 0.05) ib.push([M.ALD, s ? s1 - 0.0006 : s0, s ? s1 : s0 + 0.0006, ym - 0.003, ym + 0.003, z - 0.004, z + 0.004]); }
    else { acc.box(M.BOX, x0, x1, b + 0.004, t - 0.012, zbk, zq); const [s0, s1] = s ? [x1, x1 + D.slide] : [x0 - D.slide, x0], zc = pnZr(K, s ? x1 : x0);   // (the outer side and its slide: the drawer's member, the middle member out of the body)
      acc.box(M.STL, s0, s1, ym - 0.012, ym + 0.012, zbi, zq - 0.01); acc.box(M.ALD, s ? s0 + 0.002 : s0, s ? s1 : s1 - 0.002, ym - 0.009, ym + 0.009, zc - 0.3, Math.max(zc - 0.02, zq - 0.06)); } });
  acc.box(M.BOX, uli, uri, b + 0.012, t - 0.012, zbk, zbi); pnPlate(acc, M.CAV, uli, uri, zbi, zfi, b + 0.012, yb - 0.004, nq);
  pnBand(acc, M.NV, C.xo0 + 0.003, C.xo1 - 0.003, zfi, (x) => zf(x) - 0.002, b, t - D.pullH, Math.max(4, Math.ceil((C.xo1 - C.xo0) / 0.15)));
  // the cells: the seams, a cell a part; the groups' labels across their cells' slices of the front
  const n = groups.reduce((a, q) => a + q[1].length, 0), [xa, xb] = dr.x, cx = (j) => xa + (xb - xa) * j / n, yLab1 = t - D.pullH, yLab0 = Math.max(b + 0.003, yLab1 - (D.labH || 1));
  const fix = (c, y, zfn) => { let x = pnUX(K, c, y, zfn(0)); for (let i = 0; i < 4; i++) x = pnUX(K, c, y, zfn(x)); return x; };   // (a screen-upright seam on a bowed surface)
  const uAt = (j, y, zfn) => (j <= 0 ? C.xo0 + 0.0015 : j >= n ? C.xo1 - 0.0015 : fix(cx(j), y, zfn));   // (a front's seams; its ends)
  const uIn = (j, y, zfn) => (j <= 0 ? uli : j >= n ? uri : fix(cx(j), y, zfn));   // (the insert's seams; the box's walls)
  // each item at its scale (the group's: the least that fits each of its cells) in its window (between the cut-outs' back limit and its tag)
  let j0 = 0; const plan = [];
  groups.forEach(([gname, items]) => { const its = items.map((q, i) => { const j = j0 + i, it = pdItem(q[0], q[1]), xm = fix((cx(j) + cx(j + 1)) / 2, ytop, zfi), zl = zLo(xm, ytop), zh = zHi(xm, ytop), zTag1 = zh - 0.006, zTag0 = zTag1 - D.tagD;
      const fit = (s) => { const top = yb + it.fh * s, sH = (t - 0.006 - yb) / it.fh, zb0 = Math.max(zLo(xm, Math.max(ytop, top)), zl) + 0.006, zf0 = zTag0 - 0.008, zm = (zb0 + zf0) / 2, ul = Math.max(uli + 0.004, pnUX(K, cx(j) + 2.5, ytop, zm)), ur = Math.min(uri - 0.004, pnUX(K, cx(j + 1) - 2.5, ytop, zm));
        return { zb0, zf0, zm, ul, ur, s: Math.min((ur - ul - 2 * D.clr) / it.fw, (zf0 - zb0 - 2 * D.clr) / it.fd, D.sMax, sH) }; };
      let f = fit(D.sMax); for (let r = 0; r < 4; r++) f = fit(Math.max(0.05, f.s)); return { j, it, f, zTag0, zTag1, xm, zl }; });
    const s = Math.min(...its.map(q => q.f.s)); its.forEach(q => { q.s = s; q.gname = gname; plan.push(q); }); j0 += items.length; });
  const glab = {}; j0 = 0; groups.forEach(([gname, items]) => { const ja = j0, jb = j0 + items.length, yl = (yLab0 + yLab1) / 2, u0 = fix(Math.max(cx(ja), 1), yl, zf), u1 = fix(Math.min(cx(jb), 411), yl, zf);
    glab[gname] = { u0, u1, mat: new T.MeshBasicMaterial({ map: hNameTex(gname, (u1 - u0) / (yLab1 - yLab0), Object.assign({ H: 128, font: 74, pad: 10, line: 10 }, D.lab || {})) }) }; glab[gname].mat.map.wrapS = glab[gname].mat.map.wrapT = T.ClampToEdgeWrapping; j0 = jb; });
  plan.forEach(q => { const { j, it, f, s } = q, g = new T.Group(); C.G.add(g); const [en, nm] = PDEL[it.key][it.kind];
    // the tile of the insert (its back straight, its front along the front's bowed inner face), its cut-out(s), the item in them turned with the front
    const xb0 = uIn(j, ytop, () => zbi), xb1 = uIn(j + 1, ytop, () => zbi), xf0 = uIn(j, ytop, zfi), xf1 = uIn(j + 1, ytop, zfi), Q = [[xb0, zbi], [xb1, zbi]];
    for (let i = 0; i <= 8; i++) { const x = xf1 + (xf0 - xf1) * i / 8; Q.push([x, zfi(x)]); }
    const ul = Math.max(uli + 0.004, pnUX(K, cx(j) + 2.5, ytop, f.zm)), ur = Math.min(uri - 0.004, pnUX(K, cx(j + 1) - 2.5, ytop, f.zm)), uc = (ul + ur) / 2, wc = f.zm + (pnZr(K, uc) - pnZr(K, q.xm)), th = -Math.atan(pnDz(K, uc));
    const cuts = pdCuts(it, s, uc, wc, D.clr).map(h => Object.assign(h, { rot: th }));
    const ybc = Math.max(yb, ytop - Math.max(0.012, it.fh * s - 0.003)), ftk = ytop - ybc;   // (the recess as deep as its item)
    const tile = pdTile(g, Q, ytop, ftk, cuts.map(h => pnOutline(h)), D.mats.T, D.mats.W); tile.userData.pdTint = true;
    cuts.forEach(h => pnHoleBot(g, h, ybc, Math.min(0.012, D.clr * 0.8), D.mats.col, M.HOLE));
    const Hd = it.g; Hd.scale.setScalar(s); Hd.position.set(uc, ybc + 0.0005, wc); Hd.rotation.y = th; g.add(Hd);
    pdSoft(sh, uc, wc + 0.004, ybc + 0.0012, it.fw * s * 1.08, it.fd * s * 1.12 + 0.01, 0.45).rotation.z = th;
    if (it.glow != null) { const gl = new T.Mesh(new T.PlaneGeometry(it.fw * s + 0.16, it.fd * s + 0.12), xcGlowMat(it.glow, 0.75)); gl.rotation.set(-Math.PI / 2, 0, th); gl.position.set(uc, ytop + 0.002, wc); gl.renderOrder = 3; sh.add(gl); }
    const zt = (q.zTag0 + q.zTag1) / 2 + (pnZr(K, uc) - pnZr(K, q.xm)), ta = Math.max(uli + 0.006, pnUX(K, cx(j) + 3, ytop, zt)), tb = Math.min(uri - 0.006, pnUX(K, cx(j + 1) - 3, ytop, zt)), tw = Math.min(0.26, 0.88 * (tb - ta));
    const tag = pdTag(g, en, tw, D.tagD, (ta + tb) / 2, ytop, zt + (pnZr(K, (ta + tb) / 2) - pnZr(K, uc))); tag.rotation.y = -Math.atan(pnDz(K, (ta + tb) / 2));
    [0, 1].filter(s => C.inner[s] && j === (s ? n - 1 : 0)).forEach(s => (inBox[s] || []).forEach(([mt, ...a]) => { const [x0, x1, y0, y1, z0, z1] = a, zs = Math.min(z1, Math.max(z0, q.zl - 0.02)); if (zs > z0 + 1e-4) acc.box(mt, x0, x1, y0, y1, z0, zs);
      if (z1 > zs + 1e-4) { const m = new T.Mesh(new T.BoxGeometry(x1 - x0, y1 - y0, z1 - zs), mt); m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (zs + z1) / 2); g.add(m); } }));
    // the front's slice (the group's label over it) and the pull's piece in front of the cell, along the bowed front
    const L = glab[q.gname], tu = (x) => (x - L.u0) / (L.u1 - L.u0), tv = (y) => (y - yLab0) / (yLab1 - yLab0);
    const fr = pnStripV(g, L.mat, [uAt(j, yLab0, zf), uAt(j, yLab1, zf)], [uAt(j + 1, yLab0, zf), uAt(j + 1, yLab1, zf)], yLab0, yLab1, zf, (x, y) => [tu(x), tv(y)]); fr.userData.pdPlate = true;
    if (yLab0 > b + 0.006) { const y0 = b + 0.003; pnStripV(g, M.NV, [uAt(j, y0, zf), uAt(j, yLab0, zf)], [uAt(j + 1, y0, zf), uAt(j + 1, yLab0, zf)], y0, yLab0, zf); }
    const zp = (x) => zf(x) + D.pullD, y1 = t, y0 = t - D.pullH, xa1 = uAt(j, y1, zp), xb1_ = uAt(j + 1, y1, zp);
    pnStripH(g, M.AL, xa1, xb1_, y1, zfi, zp); pnStripV(g, M.AL, [uAt(j, y0, zp), xa1], [uAt(j + 1, y0, zp), xb1_], y0, y1, zp);
    pdMergeGroup(g);
    els.push({ key: it.key, kind: it.kind, en, nm, grp: PDGRP[it.key], cab: C.side === 'M' ? (cx(j) + cx(j + 1) < 412 ? 'L' : 'R') : C.side, place: 'front', row: k, col: j, cell: [cx(j), cx(j + 1)], g, part: Hd, label: tag, scale: xF(s, 3) }); });
  // the wall shades on the insert (along the inner side walls the camera sees over; under the edge over it, along the curve)
  if (C.inner[1]) pdEdgeSh(sh, uri - 0.05, uri, zbi, zfi(uri), ytop + 0.0015, 'u1', 0.4); if (C.inner[0]) pdEdgeSh(sh, uli, uli + 0.05, zbi, zfi(uli), ytop + 0.0015, 'u0', 0.4);
  pnEdgeShC(sh, uli, uri, (x) => zLo(x, ytop) - 0.02, 0.07, ytop + 0.0015, 0.42);
  const xm0 = fix((xa + xb) / 2, ytop, zfi);
  return { n, x: [xF(xa, 1), xF(xb, 1)], win: [xF(zLo(xm0, ytop)), xF(zHi(xm0, ytop))], y: [xF(pnS(K, xm0, ytop, zLo(xm0, ytop))[1], 1), xF(pnS(K, xm0, t, zf(xm0) + D.pullD)[1], 1), xF(pnS(K, xm0, b, zf(xm0))[1], 1)], scales: plan.map(q => xF(q.s, 3)) }; };
// a shut drawer: its front (bowed), its lip pull, a small aluminium label holder with a blank card at the column's middle
const pnDrawerShut = (C, M, D, dr) => { const K = C.K, acc = C.acc, { t, b } = dr, zf = (x) => pnZr(K, x), x0 = C.xo0 + 0.003, x1 = C.xo1 - 0.003;
  const ns = Math.max(4, Math.ceil((x1 - x0) / 0.15)); pnBand(acc, M.NV, x0, x1, (x) => zf(x) - D.fT, zf, b, t - D.pullH, ns); pnBand(acc, M.AL, x0, x1, (x) => zf(x) - D.fT, (x) => zf(x) + D.pullD, t - D.pullH, t, ns);
  const xm = C.hold != null ? C.hold : (C.xo0 + C.xo1) / 2, yc = (b + t - D.pullH) / 2, h = Math.min(0.03, t - b - D.pullH - 0.008), th = -Math.atan(pnDz(K, xm)), z = zf(xm);
  pnBoxR(acc, M.AL, 0.12, h, 0.004, xm, yc, z + 0.001, th); pnBoxR(acc, M.CARD, 0.104, h - 0.008, 0.002, xm, yc, z + 0.0035, th); };
// the screen x of a column's end wall (its local x xw) over the window (z0..z1) at height y: its cells' inner limit
const pnSpan = (K, end, xw, y, z0, z1) => { const xs = [z0, (z0 + z1) / 2, z1].map(z => pnS(K, xw, y, z)[0]); return end === 0 ? Math.max(...xs) + 0.6 : Math.min(...xs) - 0.6; };
// ======== THE FORMS ========
//   A form: R (the front's radius), H, D (the depth: the back's radius R - D), P (the drawers' pitch), N (drawers a column), open (the open
//   ones), plinth; segs: the carcass's pieces ({ b0, b1 angles, rF its front's radius, ends }), cols: the columns ({ seg, b0, b1 (its opening's
//   angles), a (its pull's angle), side, pulls, rows: the groups of its four open drawers }); the top's back edge at screen y 662 (u 0).
const PNL = { R: 10, topT: 0.022, over: 0.012, gapTop: 0.012, yback: 662, bE: 0.185, st: 0.018,
  dr: { fT: 0.018, pullH: 0.01, pullD: 0.005, wall: 0.008, inset: 0.008 + 0.01 + 0.016, slide: 0.01, dd: 0.03, under: 0.012, ftDeep: 0.016, clr: 0.014, tagD: 0.026, sMax: 1.15, lab: { H: 64, font: 46, pad: 6, line: 7 } },
  G: { HL: ['HEADLAMPS', [['lamp', 'led'], ['lamp', 'rum'], ['lamp', 'dim'], ['lamp', 'bil']]], TL: ['TAIL LAMPS', [['tail', 'dim'], ['tail', 'proz'], ['tail', 'okr'], ['tail', 'led']]],
    UG: ['UNDERGLOW', [['ug', 'mod'], ['ug', 'tur'], ['ug', 'vij'], ['ug', 'rde'], ['ug', 'zel']]], IND: ['INDICATORS', [['sig', 'proz'], ['sig', 'dim'], ['sig', 'tek']]], NUTS: ['NUTS', [['nuts', 'nuts']]],
    GR: ['GRILLES', [['grille', 'sat'], ['grille', 'mrez'], ['grille', 'krom'], ['grille', 'karb'], ['grille', 'barva']]], CAL: ['CALIPERS', [['cal', 'rde'], ['cal', 'rum'], ['cal', 'zla'], ['cal', 'barva']]],
    AERO: ['AERO KITS', [['aero', 1], ['aero', 2], ['aero', 3], ['aero', 4]]], DEC: ['DECALS', [['decal', 'flames'], ['decal', 'check'], ['decal', 'star']]], DISC: ['DISCS', [['disc', 'dirk'], ['disc', 'ker']]] } };
const pnPart = (key, from, to) => [PNL.G[key][0], PNL.G[key][1].slice(from, to)];   // (a slice of a group: its name, its items from..to)
const PNF = {
  4: { H: 0.9715, D: 0.6405, P: 0.0718, N: 12, open: [0, 3, 6, 10], plinth: 0.0755, pulls: [0.2716, 0.3732, 0.4802, 0.5499], stileX: 183.5 },   // (the top drawer pulled 2 cm more than the plan's: its outer cells under the top were 40)
  5: { H: 0.9351, D: 0.6484, P: 0.0749, N: 11, open: [0, 3, 6, 10], plinth: 0.0773, pulls: [0.2671, 0.3705, 0.4709, 0.5578], gapX: 188, gap: 0.03, bEL: 0.174 },
  6: { H: 1.0, D: 0.658, P: 0.0731, N: 12, open: [0, 3, 6, 11], plinth: 0.0888, pulls: [0.2411, 0.3485, 0.4389, 0.4789], outer: [0.2603, 0.3707, 0.4791, 0.5071], set: 0.04, splitX: 138.5 } };   // (the outer third drawers 1.5 cm more than the plan's: their outer cells were 40)
// the layout of form v: the curve, the carcass's pieces, the columns (their frames, openings, pulls, rows of groups)
const pnLay = (v) => { const A = Object.assign({}, PNF[v]), R = PNL.R, L = { v, A, R };
  L.wb = pdZY(PNL.yback, 0, A.H); L.face = L.wb + A.D - PNL.over; L.wc = L.face - R; L.rB = R - A.D;   // (the top's back edge at y 662 in the middle; the front's radius R; the back's rB)
  L.y0 = A.H - PNL.topT - PNL.gapTop; L.drs = []; for (let i = 0; i < A.N; i++) { const yt = L.y0 - i * A.P; L.drs.push({ i, t: yt - 0.002, b: yt - A.P + 0.002, open: A.open.indexOf(i) }); } L.yBot = L.y0 - A.N * A.P;
  const bE = PNL.bE, st = PNL.st / R, e = 0.02 / R, bAt = (sx, rr) => pdBis(bb => pnS(pnK(L.wc, rr, 0), rr * Math.sin(bb), A.H - 0.3, rr * Math.cos(bb) - rr)[0], -0.6, 0.6, sx);   // (the angle seen at screen x sx on the front)
  const G = PNL.G;
  if (v === 4) { const bs = bAt(A.stileX, R); L.segs = [{ b0: -bE, b1: bE, rF: R }];   // (the stile a little left of the middle: the left column 4 parts a drawer, the right one 5, all ~45 px wide)
    L.cols = [{ seg: 0, b0: -bE + e, b1: bs - st, a: 0, side: 'L', pulls: A.pulls, rows: [[G.HL], [G.TL], [G.CAL], [G.AERO]] }, { seg: 0, b0: bs + st, b1: bE - e, a: 0, side: 'R', pulls: A.pulls, rows: [[G.GR], [G.UG], [G.DEC, G.DISC], [G.IND, G.NUTS]] }]; }
  else if (v === 5) { const bg = bAt(A.gapX, R), gw = A.gap / 2 / R, bL = A.bEL || bE; L.segs = [{ b0: -bL, b1: bg - gw, rF: R }, { b0: bg + gw, b1: bE, rF: R }];   // (the left end a little shorter: the trolleys)
    L.cols = [{ seg: 0, b0: -bL + e, b1: bg - gw - e, a: (-bL + bg - gw) / 2, side: 'L', pulls: A.pulls, rows: [[G.HL], [G.TL], [pnPart('UG', 0, 4)], [pnPart('UG', 4, 5), G.IND]] },
      { seg: 1, b0: bg + gw + e, b1: bE - e, a: (bg + gw + bE) / 2, side: 'R', pulls: A.pulls, rows: [[G.GR], [G.CAL, G.NUTS], [G.DEC, G.DISC], [G.AERO]] }]; }
  else { const ba = bAt(A.splitX, R), bb = bAt(412 - A.splitX, R), rO = R - A.set; L.segs = [{ b0: -bE, b1: ba, rF: rO, ends: [1, 0] }, { b0: ba, b1: bb, rF: R }, { b0: bb, b1: bE, rF: rO, ends: [0, 1] }];   // (the outer pieces against the middle one's ends)
    L.cols = [{ seg: 0, b0: -bE + e, b1: ba, a: 0, side: 'L', pulls: A.outer, rows: [[pnPart('HL', 0, 3)], [pnPart('TL', 0, 3)], [pnPart('UG', 0, 3)], [pnPart('AERO', 0, 3)]] },
      { seg: 1, b0: ba + e, b1: bb - e, a: 0, side: 'M', pulls: A.pulls, rows: [[pnPart('HL', 3, 4), pnPart('GR', 0, 2)], [pnPart('TL', 3, 4), pnPart('CAL', 0, 2)], [pnPart('UG', 3, 5)], [pnPart('AERO', 3, 4), pnPart('DEC', 0, 2)]] },
      { seg: 2, b0: bb, b1: bE - e, a: 0, side: 'R', pulls: A.outer, rows: [[pnPart('GR', 2, 5)], [pnPart('CAL', 2, 4), G.NUTS], [G.IND], [pnPart('DEC', 2, 3), G.DISC]] }]; }
  L.cols.forEach(C => { const s = L.segs[C.seg]; C.rF = s.rF; C.K = pnK(L.wc, s.rF, C.a); const rb = L.rB + 0.02;
    C.xo0 = s.rF * Math.sin(C.b0 - C.a); C.xo1 = s.rF * Math.sin(C.b1 - C.a); C.xb0 = rb * Math.sin(C.b0 - C.a); C.xb1 = rb * Math.sin(C.b1 - C.a);
    if (C.a === 0 && v === 4) { C.xb0 = C.side === 'L' ? rb * Math.sin(C.b0) : C.xo0; C.xb1 = C.side === 'L' ? C.xo1 : rb * Math.sin(C.b1); }   // (form 4: the drawers pulled straight out; the middle stile straight)
    if (v === 6) { C.xb0 = Math.max(C.xb0, C.xo0 + (C.side === 'R' ? 0.004 : 0)); C.xb1 = Math.min(C.xb1, C.xo1 - (C.side === 'L' ? 0.004 : 0)); if (C.side === 'M') { C.xb0 = rb * Math.sin(C.b0); C.xb1 = rb * Math.sin(C.b1); } }   // (form 6: all pulled straight out; the boxes inside the radial ends)
    C.edge = [C.seg === 0 && C.b0 <= L.segs[0].b0 + e + 1e-6, C.seg === L.segs.length - 1 && C.b1 >= L.segs[L.segs.length - 1].b1 - e - 1e-6]; C.inner = [!C.edge[0], !C.edge[1]]; C.hold = v === 4 ? (C.side === 'L' ? -0.8 : 0.8) : 0; });
  return L; };
// the carcass (into F's acc): for each piece the top (navy steel, a steel edge under its front, the yellow line on its front edge), the ends,
// the back, the dark inside, the rail under the top, the bottom rail, the plinth set back; the stiles between columns
const pnBody = (acc, M, L) => { const A = L.A, wc = L.wc, rB = L.rB, H = A.H, tT = PNL.topT, ov = PNL.over, et = 0.02;
  L.segs.forEach((s, i) => { const rF = s.rF, b0 = s.b0, b1 = s.b1, en = s.ends || [1, 1], e0 = en[0] ? et / rF : 0, e1 = en[1] ? et / rF : 0;
    pnSlab(acc, M.TOP2, wc, rB, rF + ov, b0 - 0.004 / rF, b1 + 0.004 / rF, H - tT, H, 'tbiolr');
    pnSlab(acc, M.AL, wc, rF - 0.02, rF + ov, b0, b1, H - tT - 0.004, H - tT, 'bo');
    pnSlab(acc, M.YL, wc, rF + ov, rF + ov + 0.002, b0 - 0.004 / rF, b1 + 0.004 / rF, H - 0.016, H - 0.006, 'o');
    if (e0) pnSlab(acc, M.NV, wc, rB, rF, b0, b0 + e0, 0, H - tT, 'tiolr'); if (e1) pnSlab(acc, M.NV, wc, rB, rF, b1 - e1, b1, 0, H - tT, 'tiolr');   // (the ends)
    pnSlab(acc, M.NV, wc, rB, rB + 0.012, b0 + e0, b1 - e1, A.plinth, H - tT, 'i'); pnSlab(acc, M.CAV, wc, rB, rB + 0.012, b0 + e0, b1 - e1, A.plinth, H - tT, 'o');   // (the back: navy outside, dark inside)
    pnSlab(acc, M.CAV, wc, rB + 0.012, rF - 0.004, b0 + e0, b0 + e0 + 0.004 / rF, A.plinth, L.y0, 'r'); pnSlab(acc, M.CAV, wc, rB + 0.012, rF - 0.004, b1 - e1 - 0.004 / rF, b1 - e1, A.plinth, L.y0, 'l');   // (the ends' insides dark)
    pnSlab(acc, M.CAV, wc, rB + 0.012, rF - 0.01, b0 + e0, b1 - e1, A.plinth - 0.01, A.plinth, 't');   // (the dark floor inside)
    pnSlab(acc, M.NV, wc, rF - 0.02, rF, b0 + e0, b1 - e1, L.y0, H - tT, 'ob'); pnSlab(acc, M.NV, wc, rF - 0.02, rF, b0 + e0, b1 - e1, A.plinth, L.yBot, 'ot');   // (the rail under the top, the bottom rail)
    pnSlab(acc, M.NVE, wc, rB + 0.03, rF - 0.05, b0 + 0.03 / rF, b1 - 0.03 / rF, 0, A.plinth, 'olr'); pnSlab(acc, M.CAV, wc, rB, rF, b0, b1, 0, 0.003, 't'); });   // (the plinth set back, its shadow line)
  L.cols.forEach((C, i) => { const D = L.cols[i + 1]; if (!D || D.seg !== C.seg) return; const bs = (C.b1 + D.b0) / 2, sw = (D.b0 - C.b1) / 2, rF = L.segs[C.seg].rF;   // (a stile between two columns of one piece: radial)
    pnSlab(acc, M.NV, wc, rB + 0.012, rF, bs - sw, bs + sw, A.plinth, L.y0, 'olr'); });
};
// what a plan chest keeps on its top (not parts: nothing on the top is an element): a plan (PDA's generic coupe's side view) and rolled plans
const pnPlans = (F, L, spots) => { const A = L.A, y = A.H + 0.0012;
  spots.forEach(([kind, b, dr, len, rot]) => { const r = L.rB + (L.segs[0].rF - L.rB) * 0.5 + dr, c = pnP(L.wc, r, b, 0);
    if (kind === 'plan') { const m = new T.Mesh(new T.PlaneGeometry(len, len * 0.5), new T.MeshLambertMaterial({ map: pdPlanTex(), color: 0xc8d2de })); m.rotation.set(-Math.PI / 2, 0, b + rot); m.position.set(c.x, y, c.z); m.receiveShadow = true; F.add(m); return; }
    const RL = new T.MeshLambertMaterial({ color: 0x6f9bd0 }), rr = 0.03, cy = new T.Mesh(new T.CylinderGeometry(rr, rr, len, 24), RL); cy.rotation.set(0, b + rot, Math.PI / 2); cy.position.set(c.x, A.H + rr, c.z); cy.castShadow = true; cy.receiveShadow = true; F.add(cy);
    const band = new T.Mesh(new T.CylinderGeometry(rr + 0.002, rr + 0.002, 0.02, 24), PR.mat(0xd8343c, { shininess: 30 })); band.rotation.copy(cy.rotation); band.position.copy(cy.position); F.add(band); }); };
const pnBuild = (S, out, v) => { const M = pdMats(), L = pnLay(v), A = L.A, els = [], F = PR.group(); F.position.set(0, 0, 0.2); F.rotation.y = 0.3; F.updateMatrixWorld(true);
  pdHideGame(S, out); const body = new T.Group(); F.add(body); const accB = pdAcc(); pnBody(accB, M, L);
  const D = Object.assign({}, PNL.dr, { mats: { T: M.FELT, W: M.FELTW, col: PDCOL.blu } }), lay = { v, R: L.R, H: A.H, D: A.D, P: A.P, open: A.open, face: xF(L.face), wb: xF(L.wb), wc: xF(L.wc), rows: {} }, groups = [body];
  L.cols.forEach((C, ci) => { const K = C.K; C.G = new T.Group(); C.G.position.set(K.O[0], 0, K.O[1]); C.G.rotation.y = K.a; F.add(C.G); C.sh = new T.Group(); C.G.add(C.sh); C.acc = pnAccT(accB, new T.Matrix4().makeRotationY(K.a).setPosition(K.O[0], 0, K.O[1])); groups.push(C.G);
    F.updateMatrixWorld(true); D.dd = A.D - PNL.dr.dd - (L.R - C.rF);
    const rTop = C.rF + PNL.over, occ = [{ z: (x) => pnZr(K, x, rTop), h: A.H - PNL.topT - 0.004 }];
    L.drs.forEach((d0) => { const dr = Object.assign({}, d0);
      if (dr.open < 0) { pnDrawerShut(C, M, D, dr); return; }
      dr.p = C.pulls[dr.open]; const groupsK = C.rows[dr.open], ytop = dr.t - D.under, zf = (x) => pnZr(K, x) + dr.p, zfi = (x) => zf(x) - D.fT;
      const zLo = (x) => Math.max(...occ.map(e => pnRay(K, e.z(x), e.h, ytop))), zHi = (x) => pnRay(K, zfi(x), dr.t, ytop);
      dr.x = [C.edge[0] ? 1.5 : pnSpan(K, 0, C.xo0, ytop, zLo(C.xo0), zHi(C.xo0)), C.edge[1] ? 410.5 : pnSpan(K, 1, C.xo1, ytop, zLo(C.xo1), zHi(C.xo1))];
      lay.rows[C.side + dr.open] = pnDrawer(F, C, M, D, dr.open, dr, groupsK, occ.slice(), els);
      occ.push({ z: (x) => zf(x), h: dr.b }, { z: (x) => zf(x) + D.pullD, h: dr.t - D.pullH }); });
  });
  accB.flush(body, { cast: (m) => m === M.NV || m === M.TOP2 });
  pnPlans(F, L, v === 4 ? [['plan', -0.07, 0.02, 0.92, 0.03], ['roll', 0.065, 0.06, 0.8, 0.06], ['roll', 0.075, -0.03, 0.72, -0.03]] : v === 5 ? [['plan', -0.085, 0.02, 0.78, 0.02], ['roll', 0.09, 0.02, 0.76, 0.05]] : [['plan', 0.0, 0.035, 0.74, 0.0], ['roll', -0.115, 0.0, 0.62, -0.04], ['roll', 0.12, 0.02, 0.56, 0.05]]);
  F.updateMatrixWorld(true); groups.forEach(g => { if (!out.frames.includes(g)) out.frames.push(g); }); pdNanCheck(F);
  out.drawers = []; out.aeroDr = null; out.xc = { opt: 'pn_' + v, groups: [], extra: [] }; out.s6 = { L: lay, els, F, cabs: { L: body, R: new T.Group() }, names: [] }; return out; };
const pnbFronts = (S, out, o = {}) => { pdHideGift(S); if (PNB.v >= 4 && PNB.v <= 6) return pnBuild(S, out, PNB.v); return pdaFronts(S, out, o); };
// ==== PZA (agent PZA = PNB, round PZ: the user, after the plan chest in six forms: "Naredi zavita v 6 različnih verzijah. Na zgornji
//      polici naj bodo namesto papirjev elementi. Namesto da so v predalih, jih postavi gor. Dobro analiziraj, kateri elementi bi najbolje
//      izgledali zgoraj. Ker bo posledično v predalih sedaj več prostora, lahko predale in elemente v polici lahko narediš po potrebi večje.")
//      PNB's form 4 (one long gently curved plan chest, 10 m arc, straight drawers with bowed fronts pulled straight out) with ELEMENTS on its
//      top instead of the plans: the parts with a clear 3D shape stand on the top in the room's light (each on its own stand, a contact
//      shadow, its name tag before it, the group's name printed along the top's front edge); the lit and flat parts stay in the dark drawers,
//      now 8 a row (two columns of 4, the stile in the middle) instead of 9, so each drawer cell is ~50 px wide and its part bigger.
//      PZA.v 1 "AERO NA VRHU": the four aero kit models, big, on round plinths along the curved top + the coloured nuts on a tilted stand;
//      PZA.v 2 "ČELJUSTI NA DISKIH": the four calipers each clamped on a plain disc standing on its stand + the two disc kinds on two more;
//      PZA.v 3 "ŽAROMETI NA STOJALIH": the four headlamp pairs on small brackets facing the camera, softly lit + the coloured nuts.
//      Every element's tap area: on the top its piece of the top (from the top's back edge to its front edge, between screen-upright seams),
//      its stand, the part, its tag and its slice of the printed band; in a drawer as in form 4. PZA.v 0: PNB's form 4 as before ----
const PZA = { v: 1 };
const PZT = {   // the top's elements a version: [key, kind], the groups' names over them; the drawers' rows (left 4 cells, right 4)
  1: { top: [['aero', 1], ['aero', 2], ['aero', 3], ['aero', 4], ['nuts', 'nuts']], bands: [['AERO KITS', 4], ['NUTS', 1]], stand: 'plinth',
    L: [['HL'], ['UG', 0, 4], ['GR', 0, 4], ['CAL']], R: [['TL'], ['UG', 4, 5, 'IND'], ['GR', 4, 5, 'DEC'], ['DISC']] },
  2: { top: [['cal', 'rde'], ['cal', 'rum'], ['cal', 'zla'], ['cal', 'barva'], ['disc', 'dirk'], ['disc', 'ker']], bands: [['CALIPERS', 4], ['BRAKE DISCS', 2]], stand: 'disc',
    L: [['HL'], ['UG', 0, 4], ['GR', 0, 4], ['AERO']], R: [['TL'], ['UG', 4, 5, 'IND'], ['GR', 4, 5, 'DEC'], ['NUTS']] },
  3: { top: [['lamp', 'led'], ['lamp', 'rum'], ['lamp', 'dim'], ['lamp', 'bil'], ['nuts', 'nuts']], bands: [['HEADLAMPS', 4], ['NUTS', 1]], stand: 'bracket',
    L: [['TL'], ['UG', 0, 4], ['GR', 0, 4], ['AERO']], R: [['CAL'], ['UG', 4, 5, 'IND'], ['GR', 4, 5, 'DEC'], ['DISC']] } };
// a drawer row's groups from PZT's shorthand: [group key, from, to, another whole group]
const pzRow = (q) => { const [k, a, b, k2] = q, G = PNL.G, out = [a == null ? G[k] : pnPart(k, a, b)]; if (k2) out.push(G[k2]); return out; };
// a soft round glow (a lamp's light: additive, its middle bright)
const pzGlowTex = () => pdTex('pzglow', 64, 64, (g, W, H) => { const gr = g.createRadialGradient(32, 32, 2, 32, 32, 31); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); });
const pzGlow = (col, op) => new T.MeshBasicMaterial({ map: pzGlowTex(), color: col, transparent: true, opacity: op, blending: T.AdditiveBlending, depthWrite: false });
// ---- the parts on the top (their foot's middle at the origin, facing +z: toward the camera once turned by the radius' angle) ----
// a round plinth: navy body, an aluminium ring, a dark felt disc on top; returns its height
const pzPlinth = (g, M, r, h) => { const b = new T.Mesh(new T.CylinderGeometry(r, r * 1.02, h, 40), M.NV); b.position.y = h / 2; g.add(b);
  const ring = new T.Mesh(new T.CylinderGeometry(r + 0.002, r + 0.002, 0.006, 40), M.AL); ring.position.y = h - 0.003; g.add(ring);
  const felt = new T.Mesh(new T.CylinderGeometry(r - 0.012, r - 0.012, 0.004, 40), M.FELT); felt.position.y = h + 0.001; felt.userData.pdTint = true; g.add(felt); return h + 0.003; };
// the part itself (scale s) on its stand; returns { obj, top (its highest point), glow: [[point, colour, size]] }
const pzPart = (g, M, key, kind, Z) => { const P = new T.Group(); g.add(P); let top = 0; const glows = [];
  if (key === 'aero') {   // (the quarter-car model on its stand in the kit's colour, its side (the sill, the lip) to the camera, the nose a little round)
    const h0 = pzPlinth(P, M, 0.19, 0.035), s = 0.116, tmp = new T.Group(), pc = aeroPiece(tmp, kind, s, AEM()); if (pc.label) { pc.g.remove(pc.label); } const sd = pc.g.children[0]; if (sd && sd.isMesh) sd.material = PR.mat(new T.Color(AERO_COL[kind]).multiplyScalar(0.85).getHex(), { shininess: 50 });
    pc.g.rotation.y = -Math.PI / 2 + 0.32; tmp.updateMatrixWorld(true); const bb = new T.Box3().setFromObject(pc.g), c = bb.getCenter(V()); pc.g.position.set(-c.x, h0 - bb.min.y, -c.z); P.add(tmp); top = h0 + (bb.max.y - bb.min.y); }
  else if (key === 'nuts') {   // (the hub with its nuts on a wedge, tilted back toward the camera)
    const h0 = pzPlinth(P, M, 0.18, 0.035), tl = 0.95, r = 0.15, H = new T.Group(); H.position.set(0, h0 + r * Math.cos(tl) + 0.008, 0.02); H.rotation.x = -tl; P.add(H);   // (its face up toward the camera)
    const plate = new T.Mesh(new T.CylinderGeometry(r + 0.012, r + 0.012, 0.012, 40), M.RUB); plate.rotation.x = Math.PI / 2; plate.position.z = -0.007; H.add(plate); xcNuts(H, r, 0, 0, 0);   // (a dark round backing)
    const leg = new T.Mesh(new T.BoxGeometry(0.04, r * Math.cos(tl) * 2, 0.02), M.ALD); leg.position.set(0, h0 + r * Math.cos(tl), 0.02 - r * Math.sin(tl) - 0.01); P.add(leg);   // (the rear leg under the plate's top edge)
    top = h0 + 2 * r * Math.cos(tl) + 0.06; }
  else if (key === 'cal' || key === 'disc') {   // (a disc standing on a post, tilted back; a caliper clamped on its edge at two o'clock)
    const h0 = pzPlinth(P, M, 0.14, 0.035), sc = 0.7, R = 0.17 * sc, tilt = 0.5, cy = h0 + 0.028 + R * Math.cos(tilt) + 0.004;
    const post = new T.Mesh(new T.BoxGeometry(0.03, cy - h0 + 0.02, 0.03), M.ALD); post.position.set(0, h0 + (cy - h0 + 0.02) / 2, -0.045); P.add(post);
    const cr = new T.Mesh(new T.BoxGeometry(0.12, 0.028, 0.06), M.AL); cr.position.set(0, h0 + 0.014, 0.0); P.add(cr);   // (the cradle under the disc's edge)
    const D = new T.Group(); D.position.set(0, cy, 0); D.rotation.x = -tilt; P.add(D); const dk = key === 'cal' ? 'ser' : kind, dp = discPart(dk); dp.scale.setScalar(sc); D.add(dp);
    if (key === 'cal') { const cp = pdCaliper(kind); cp.scale.setScalar(sc); cp.rotation.z = -0.8; cp.position.z = -0.03 * sc; D.add(cp); }
    top = cy + R * Math.cos(tilt) + 0.02; }
  else if (key === 'lamp') {   // (a pair of headlamps on a small bracket, their lenses to the camera, a little up; their light soft)
    const h0 = pzPlinth(P, M, 0.19, 0.03), sc = 0.95, lift = 0.32, cy = h0 + 0.03 + 0.088 * sc + 0.012;
    const base = new T.Mesh(new T.BoxGeometry(0.36, 0.03, 0.12), M.ALD); base.position.set(0, h0 + 0.015, -0.01); P.add(base);
    const back = new T.Mesh(new T.BoxGeometry(0.385, 0.165, 0.02), M.RUB); back.position.set(0, cy - 0.006, -0.062); back.rotation.x = -lift; P.add(back);   // (the pair's black bezel)
    for (const sx of [-1, 1]) { const L = lampPart(kind); L.scale.setScalar(sc); L.rotation.set(0, -Math.PI / 2, 0); const H = new T.Group(); H.position.set(sx * 0.093, cy, -0.01); H.rotation.x = -lift; H.add(L); P.add(H);
      const n = V(0, Math.sin(lift), Math.cos(lift)); glows.push([V(sx * 0.093, cy, -0.01).addScaledVector(n, 0.05 * sc), LAMP_KINDS[kind] || 0xffffff, kind === 'dim' ? 0 : 0.2, n]); }
    top = cy + 0.1; }
  P.traverse(m => { if (m.isMesh) { m.castShadow = !(m.material && m.material.transparent); m.receiveShadow = true; } });
  return { obj: P, top, glows }; };
// ---- the top's cells: n pieces across the screen (seams upright on the screen), each a piece of the top from its back edge to its front
//      edge, its part on its stand, its tag, its slice of the printed band (the group's name, white on navy, the yellow line) ----
const pzTop = (F, M, L, Z, els, sh) => { const A = L.A, K = pnK(L.wc, L.R, 0), G = new T.Group(); G.position.set(K.O[0], 0, K.O[1]); F.add(G); F.updateMatrixWorld(true); sh = sh || new T.Group(); G.add(sh);
  const y = A.H + 0.0008, rB = L.rB + 0.004, rF = L.R + PNL.over - 0.002, bEnd = PNL.bE - 0.002, n = Z.top.length, xa = 1.5, xb = 410.5, cx = (j) => xa + (xb - xa) * j / n;
  const zB = (x) => pnZr(K, x, rB), zF = (x) => pnZr(K, x, rF), zR = (x, r) => pnZr(K, x, r);
  const seam = (j, zfn) => { if (j <= 0 || j >= n) { const b = j <= 0 ? -bEnd : bEnd; let x = 0; for (let i = 0; i < 5; i++) { const z = zfn(x); x = (z + L.R) * Math.tan(b); } return x; }   // (the ends: the top's radial ends past the screen's edges)
    let x = pnUX(K, cx(j), y, zfn(0)); for (let i = 0; i < 5; i++) x = pnUX(K, cx(j), y, zfn(x)); return x; };
  const bandB = rF - 0.06, bandF = rF - 0.008, tagR = rF - 0.084, tagD = 0.032;
  // the groups' bands' labels (each over its cells' slices)
  const labs = []; let j0 = 0; Z.bands.forEach(([nm, cnt]) => { const ja = j0, jb = j0 + cnt, zm = (x) => zR(x, (bandB + bandF) / 2), u0 = seam(ja, zm), u1 = seam(jb, zm);
    const v0 = ja === 0 ? pnUX(K, 2, y, zm(u0)) : u0, v1 = jb === n ? pnUX(K, 410, y, zm(u1)) : u1;   // (its text over what the screen shows of it)
    const mat = new T.MeshBasicMaterial({ map: hNameTex(nm, (v1 - v0) / (bandF - bandB), { H: 64, font: 46, pad: 6, line: 7 }) }); mat.map.wrapS = mat.map.wrapT = T.ClampToEdgeWrapping;
    for (let j = ja; j < jb; j++) labs[j] = { u0: v0, u1: v1, mat, nm }; j0 = jb; });
  Z.top.forEach(([key, kind], j) => { const g = new T.Group(); G.add(g); const [en, nm] = PDEL[key][kind];
    // the tile: the back arc, the right seam, the front arc, the left seam
    const Q = [], xl0 = seam(j, zB), xr0 = seam(j + 1, zB), xl1 = seam(j, zF), xr1 = seam(j + 1, zF), N = 16;
    for (let i = 0; i <= N; i++) { const x = xl0 + (xr0 - xl0) * i / N; Q.push([x, zB(x)]); }
    for (let i = 1; i < 4; i++) { const t = i / 4, z = zB(xr0) + (zF(xr1) - zB(xr0)) * t; Q.push([j + 1 >= n ? (z + L.R) * Math.tan(bEnd) : pnUX(K, cx(j + 1), y, z), z]); }
    for (let i = 0; i <= N; i++) { const x = xr1 + (xl1 - xr1) * i / N; Q.push([x, zF(x)]); }
    for (let i = 1; i < 4; i++) { const t = i / 4, z = zF(xl1) + (zB(xl0) - zF(xl1)) * t; Q.push([j <= 0 ? -(z + L.R) * Math.tan(bEnd) : pnUX(K, cx(j), y, z), z]); }
    const tile = pdFlat(g, Q.map(([u, w]) => [u, w]), y, M.TOP2); tile.userData.pdTint = true;
    // the part on its stand, at the middle of what the screen shows of the cell, its foot this far behind the front
    const zIt = (x) => zR(x, Z.rItem), cl = Math.max(cx(j), 1), cr = Math.min(cx(j + 1), 411); let xm = pnUX(K, (cl + cr) / 2, y, zIt(0)); for (let i = 0; i < 4; i++) xm = pnUX(K, (cl + cr) / 2, y, zIt(xm));
    const th = -Math.atan(pnDz(K, xm)), stand = new T.Group(); stand.position.set(xm, y, zIt(xm)); stand.rotation.y = th; g.add(stand);
    const pt = pzPart(stand, M, key, kind, Z);
    pdSoft(sh, xm, zIt(xm) + 0.01, y + 0.0006, Z.shadow[0], Z.shadow[1], 0.4).rotation.z = th;
    pt.glows.forEach(([p, col, op, nrm]) => { if (!op) return; const gl = new T.Mesh(new T.PlaneGeometry(0.2, 0.2), pzGlow(col, op)); gl.position.copy(p); gl.lookAt(p.clone().add(nrm)); gl.renderOrder = 3; stand.add(gl); });
    // its tag (as in the drawers: white on navy, the yellow line), lying before the stand
    const zt = (x) => zR(x, tagR), ta = Math.max(xl1, pnUX(K, cl + 4, y, zt(xm))), tb = Math.min(xr1, pnUX(K, cr - 4, y, zt(xm))), tw = Math.min(0.3, 0.8 * (tb - ta)), tx = (ta + tb) / 2;
    const tag = pdTag(g, en, tw, tagD, tx, y, zt(tx), { font: 72 }); tag.rotation.y = -Math.atan(pnDz(K, tx));
    // its slice of the band (screen-upright seams on the band's arc), the group's name across
    const Lb = labs[j], zA = (x) => zR(x, bandB), zC = (x) => zR(x, bandF), bx0 = seam(j, (x) => zR(x, (bandB + bandF) / 2)), bx1 = seam(j + 1, (x) => zR(x, (bandB + bandF) / 2));
    const band = new T.Mesh(pnGeo(8, 1, (s, t) => { const x = pnLerp(bx0, bx1, s), z = t <= 0 ? zA(x) : zC(x); return [V(x, y + 0.0012, z), V(0, 1, 0), [(x - Lb.u0) / (Lb.u1 - Lb.u0), 1 - t]]; }), Lb.mat); band.userData.pdPlate = true; g.add(band);
    pdMergeGroup(g); g.traverse(m => { if (m.isMesh && m.material !== M.TOP2 && !m.userData.pdPlate && m.material !== Lb.mat && !(m.material && m.material.map && m.material.map.isCanvasTexture && m.material.type === 'MeshBasicMaterial')) m.castShadow = true; });
    els.push({ key, kind, en, nm, grp: PDGRP[key], cab: cx(j) + cx(j + 1) < 412 ? 'L' : 'R', place: 'top', row: -1, col: j, cell: [cx(j), cx(j + 1)], g, part: pt.obj, label: tag, scale: 1 }); });
  return { n, x: [xa, xb], y: [xF(pnS(K, 0, y, zB(0))[1], 1), xF(pnS(K, 0, y, zF(0))[1], 1)], G }; };
// ======== A VERSION: PNB's form 4 (its chest, its drawers) with the stile in the middle, 8 cells a row, the parts PZT[v].top on the top ========
const PZF = { stileX: 206, rItem: { 1: 0.295, 2: 0.24, 3: 0.275 }, shadow: { 1: [0.42, 0.42], 2: [0.34, 0.34], 3: [0.42, 0.42] } };
const pzBuild = (S, out, v) => { const Z = Object.assign({}, PZT[v], { rItem: PNL.R + PNL.over - PZF.rItem[v], shadow: PZF.shadow[v] }), s0 = PNF[4].stileX; PNF[4].stileX = PZF.stileX; let L; try { L = pnLay(4); } finally { PNF[4].stileX = s0; }
  L.cols.forEach(C => { C.rows = Z[C.side].map(pzRow); C.hold = C.side === 'L' ? -0.8 : 0.8; });
  const M = pdMats(), A = L.A, els = [], F = PR.group(); F.position.set(0, 0, 0.2); F.rotation.y = 0.3; F.updateMatrixWorld(true);
  pdHideGame(S, out); const body = new T.Group(); F.add(body); const accB = pdAcc(); pnBody(accB, M, L);
  const D = Object.assign({}, PNL.dr, { mats: { T: M.FELT, W: M.FELTW, col: PDCOL.blu } }), lay = { v, R: L.R, H: A.H, D: A.D, P: A.P, open: A.open, face: xF(L.face), wb: xF(L.wb), wc: xF(L.wc), rows: {} }, groups = [body];
  const top = pzTop(F, M, L, Z, els); lay.top = { n: top.n, x: top.x, y: top.y }; groups.push(top.G);
  L.cols.forEach((C) => { const K = C.K; C.G = new T.Group(); C.G.position.set(K.O[0], 0, K.O[1]); C.G.rotation.y = K.a; F.add(C.G); C.sh = new T.Group(); C.G.add(C.sh); C.acc = pnAccT(accB, new T.Matrix4().makeRotationY(K.a).setPosition(K.O[0], 0, K.O[1])); groups.push(C.G);
    F.updateMatrixWorld(true); D.dd = A.D - PNL.dr.dd - (L.R - C.rF);
    const rTop = C.rF + PNL.over, occ = [{ z: (x) => pnZr(K, x, rTop), h: A.H - PNL.topT - 0.004 }];
    L.drs.forEach((d0) => { const dr = Object.assign({}, d0);
      if (dr.open < 0) { pnDrawerShut(C, M, D, dr); return; }
      dr.p = C.pulls[dr.open]; const groupsK = C.rows[dr.open], ytop = dr.t - D.under, zf = (x) => pnZr(K, x) + dr.p, zfi = (x) => zf(x) - D.fT;
      const zLo = (x) => Math.max(...occ.map(e => pnRay(K, e.z(x), e.h, ytop))), zHi = (x) => pnRay(K, zfi(x), dr.t, ytop);
      dr.x = [C.edge[0] ? 1.5 : pnSpan(K, 0, C.xo0, ytop, zLo(C.xo0), zHi(C.xo0)), C.edge[1] ? 410.5 : pnSpan(K, 1, C.xo1, ytop, zLo(C.xo1), zHi(C.xo1))];
      lay.rows[C.side + dr.open] = pnDrawer(F, C, M, D, dr.open, dr, groupsK, occ.slice(), els);
      occ.push({ z: (x) => zf(x), h: dr.b }, { z: (x) => zf(x) + D.pullD, h: dr.t - D.pullH }); }); });
  accB.flush(body, { cast: (m) => m === M.NV || m === M.TOP2 });
  F.updateMatrixWorld(true); groups.forEach(g => { if (!out.frames.includes(g)) out.frames.push(g); }); pdNanCheck(F);
  out.drawers = []; out.aeroDr = null; out.xc = { opt: 'pz_' + v, groups: [], extra: [] }; out.s6 = { L: lay, els, F, cabs: { L: body, R: new T.Group() }, names: [] }; return out; };
const pzaFronts = (S, out, o = {}) => { if (PZA.v >= 1 && PZA.v <= 3) { pdHideGift(S); return pzBuild(S, out, PZA.v); } return pnbFronts(S, out, o); };
// ==== AMA (agent AMA = PNB/PZA, round AM: the user chose PZA's version 1 "AERO NA VRHU" and asked: "Aero na vrhu. Naredi 4 makete na vrhu.
//      Naj bodo 3D makete celega avtomobila v pomanjšani verziji. Čisto desno na polici naj bo element, na katerega klikneš za popravilo
//      avtomobila. Naredi 6 različnih verzij z različnimi aero maketami in različnimi elementi/gumbi za servis.") Versions 1, 2, 3:
//      PZA's curved plan chest (PNB's form 4, the stile in the middle, 8 parts a drawer row); on its top FOUR SCALE MODELS OF THE WHOLE CAR
//      on the turntable (VIHAR, built from the game's own car mesh, Render.garageCar, at 1:11), one per aero kit, each showing its kit
//      (STREET: a front lip and a ducktail; SPORT: + a splitter, side skirts and a low wing; RACE: + canards, a diffuser and a wing on posts;
//      GT PACK: + a wide splitter with fences, bigger skirts and the big GT wing with end plates), and at the far right the SERVICE element
//      (tapped: the garage's service card). The coloured nuts move into a drawer (beside the discs).
//      AMA.v 1 "BELE OBLIKOVALSKE MAKETE": matt white design-studio models (dark glass), the kit parts in the kit's colour, each on a round
//        navy plinth with an aluminium ring; SERVICE: a big round red push button on a short pedestal, a white wrench on its cap;
//      AMA.v 2 "MAKETE V BARVI AVTA": the models painted as the real car (its blue, the white stripes), the kit parts carbon black with a
//        thin line in the kit's colour, each on a small turntable; SERVICE: a miniature single-post lift (orange, as the garage's) with a
//        tiny car up on it;
//      AMA.v 3 "MAKETE POD STEKLENIMI KUPOLAMI": collector's die-cast models in the kit's colour (the white stripes kept, the kit parts gloss
//        black) under glass domes on lit round bases; SERVICE: a small red tool chest, its lid open, a big wrench lying before it.
//      Each model is ONE mesh (the car's body, wheels and tail lamps and its kit's parts merged, their colours in the vertices). The top's
//      cells and their tap areas as PZA's (the piece of the top, the stand, the model, its tag, its slice of the printed band).
//      AMA.v 0: PZA's version 1 as before ----
const AMA = { v: 2 };
PDEL.srv = { srv: ['SERVICE', 'Servis'] }; PDGRP.srv = 'SERVICE';
const AMT = { top: [['aero', 1], ['aero', 2], ['aero', 3], ['aero', 4], ['srv', 'srv']], bands: [['AERO KITS', 4], ['SERVICE', 1]],
  L: [['HL'], ['UG', 0, 4], ['GR', 0, 4], ['CAL']], R: [['TL'], ['UG', 4, 5, 'IND'], ['GR', 4, 5, 'DEC'], ['DISC', null, null, 'NUTS']] };
const AMF = { sc: 0.088, yaw: -0.42, rItem: { aero: 0.37, aero3: 0.34, srv: 0.33 }, shadow: { aero: [0.5, 0.5], srv: [0.42, 0.42] } };
// ---- the car's mesh (the game's own builder; the turntable's car: its model, colour, stripes), its parts' positions, normals and colours in
//      the car's frame (x forward, y up, z right), once ----
let AMSRC = null;
const amSrc = () => { if (AMSRC) return AMSRC; const c = G3.cur, v = Render.garageCar(c.M, c.spec.color, 0, c.spec.stripe); v.grp.updateMatrixWorld(true); const P = [], N = [], C = [];
  const put = (o, col) => { const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry, pa = g.attributes.position, na = g.attributes.normal, ca = g.attributes.color, m = o.matrixWorld, nm = new T.Matrix3().getNormalMatrix(m), p = V(), n = V();
    for (let i = 0; i < pa.count; i++) { p.fromBufferAttribute(pa, i).applyMatrix4(m); n.fromBufferAttribute(na, i).applyMatrix3(nm).normalize(); P.push(p.x, p.y, p.z); N.push(n.x, n.y, n.z); if (col) C.push(col[0], col[1], col[2]); else C.push(ca.getX(i), ca.getY(i), ca.getZ(i)); } };
  v.grp.traverse(o => { if (!o.isMesh || o === v.dec || o === v.blob || !o.visible) return; const m = [].concat(o.material)[0]; if (m.transparent) return;
    if (o === v.tail) put(o, [0.62, 0.06, 0.07]); else if (o.geometry.attributes.color) put(o, null); });
  AMSRC = { P: new Float32Array(P), N: new Float32Array(N), C: new Float32Array(C), K: Object.assign({}, c.kit), paint: null };
  console.error('AMSRC verts ' + P.length / 3 + ' kit ' + JSON.stringify(AMSRC.K)); return AMSRC; };
// the paint's colour (the car's most common saturated vertex colour) and a vertex colour's class: paint, stripe (white), lamp, dark, grey
const amClass = (r, g, b, paint) => { const lum = 0.3 * r + 0.59 * g + 0.11 * b, mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  if (paint && Math.abs(r - paint[0]) + Math.abs(g - paint[1]) + Math.abs(b - paint[2]) < 0.25) return 'paint';
  if (lum > 0.9 && mx - mn < 0.09) return 'stripe'; if (r > 0.93 && g > 0.85 && b < 0.88) return 'lamp'; if (lum < 0.2) return 'dark'; return 'grey'; };
const amPaint = (S) => { const H = {}; for (let i = 0; i < S.C.length; i += 3) { const r = S.C[i], g = S.C[i + 1], b = S.C[i + 2]; if (Math.max(r, g, b) - Math.min(r, g, b) < 0.3) continue; const k = [r, g, b].map(x => Math.round(x * 20)).join(','); H[k] = (H[k] || 0) + 1; }
  const top = Object.entries(H).sort((a, b) => b[1] - a[1])[0]; return top ? top[0].split(',').map(x => +x / 20) : null; };
// ---- the kit's parts (in the car's frame, its metres), each [w, h, d, x, y, z, rx, ry, rz, colour key]: 'k' the kit's colour, 'c' carbon,
//      'l' the thin line in the kit's colour ----
const amKit = (K, k) => { const out = [], B = (w, h, d, x, y, z, ck = 'k', rx = 0, ry = 0, rz = 0) => out.push([w, h, d, x, y, z, rx, ry, rz, ck]), fx = K.frontX, fl = K.frontLow, sz = K.sideZ, hw = K.hw;
  const sill = (h, wd) => { const L = K.wfx - K.wrx - 2 * K.wr - 0.12, xm = (K.wfx + K.wrx) / 2; for (const s of [-1, 1]) { B(L, h, wd, xm, K.bottom + 0.01 - h / 2 + 0.06, s * (sz + wd / 2 - 0.01)); B(L, 0.022, wd + 0.004, xm, K.bottom + 0.01 - h + 0.06 + 0.011, s * (sz + wd / 2 - 0.01), 'l'); } };
  const wing = (hgt, chord, span, plates) => { const wx = K.deckX + 0.12, wy = K.deckY + hgt; B(chord, 0.045, span, wx, wy, 0, 'k', 0, 0, -0.1); B(0.03, 0.03, span, wx - chord / 2 + 0.01, wy + 0.03, 0, 'l');
    for (const s of [-1, 1]) B(0.09, hgt, 0.035, wx + 0.02, K.deckY + hgt / 2, s * span * 0.3, 'c'); if (plates) for (const s of [-1, 1]) B(chord + 0.12, 0.24, 0.025, wx - 0.02, wy - 0.02, s * (span / 2 + 0.012), 'k'); };
  if (k >= 1) { B(0.2, 0.05, hw * 1.72, fx - 0.05, fl - 0.02, 0); B(0.205, 0.016, hw * 1.74, fx - 0.05, fl - 0.05, 0, 'l'); }   // (the front lip and its line)
  if (k === 1) B(0.18, 0.06, hw * 1.5, K.deckX + 0.05, K.deckY + 0.035, 0, 'k', 0, 0, 0.3);   // (a ducktail on the deck)
  if (k >= 2) { const wd = k >= 4 ? 0.42 : k >= 3 ? 0.36 : 0.3; B(wd, 0.04, hw * (k >= 4 ? 2.06 : 1.9), fx - 0.02 + (wd - 0.3) / 2, fl - 0.065, 0, 'c'); B(0.03, 0.03, hw * (k >= 4 ? 2.06 : 1.9), fx - 0.02 + wd - 0.16, fl - 0.065, 0, 'l');   // (the splitter, its edge)
    sill(k >= 4 ? 0.15 : k >= 3 ? 0.13 : 0.11, k >= 4 ? 0.1 : 0.08); }
  if (k === 2) wing(0.17, 0.26, hw * 1.6, false);
  if (k >= 3) { for (const s of [-1, 1]) for (const q of [0, 1]) B(0.2, 0.025, 0.14, fx - 0.16 - q * 0.16, fl + 0.12 + q * 0.09, s * (hw - 0.02), 'k', 0, s * 0.3, 0.25);   // (canards)
    for (let i = 0; i < (k >= 4 ? 5 : 4); i++) B(0.34, 0.12, 0.025, K.exXc + 0.12, K.exY - 0.1, (i - (k >= 4 ? 2 : 1.5)) * hw * 0.3, 'c'); }   // (the diffuser's fins)
  if (k === 3) wing(0.3, 0.32, hw * 1.8, false);
  if (k >= 4) { wing(0.44, 0.42, hw * 1.98, true); for (const s of [-1, 1]) B(0.3, 0.12, 0.03, fx - 0.08, fl - 0.01, s * hw * 0.98, 'k'); }   // (the GT wing; the splitter's fences)
  return out; };
// ---- a model: the car's mesh recoloured by the style, the kit's parts added; one geometry (vertex colours); its height, its length ----
const AMCOL = (k) => new T.Color(AERO_COL[k]);
const amModel = (style, k, s) => { const S = amSrc(), paint = AMSRC.paint || (AMSRC.paint = amPaint(S)), P = [], N = [], C = [], kc = k ? AMCOL(k) : new T.Color(0x9aa2ac);
  const rec = (r, g, b) => { const cl = amClass(r, g, b, paint);
    if (style === 'white') return cl === 'paint' || cl === 'stripe' ? [0.9, 0.91, 0.92] : cl === 'dark' ? [0.11, 0.12, 0.15] : cl === 'lamp' ? [0.95, 0.95, 0.93] : [0.66, 0.69, 0.73];
    if (style === 'kitpaint') return cl === 'paint' ? [kc.r * 0.92, kc.g * 0.92, kc.b * 0.92] : [r, g, b];
    return [r, g, b]; };
  for (let i = 0; i < S.P.length; i += 3) { P.push(S.P[i] * s, S.P[i + 1] * s, S.P[i + 2] * s); N.push(S.N[i], S.N[i + 1], S.N[i + 2]); const c = rec(S.C[i], S.C[i + 1], S.C[i + 2]); C.push(c[0], c[1], c[2]); }
  const carbon = [0.07, 0.075, 0.085], kcol = [kc.r, kc.g, kc.b], col = (ck) => style === 'white' ? (ck === 'c' ? [kc.r * 0.55, kc.g * 0.55, kc.b * 0.55] : kcol) : style === 'carpaint' ? (ck === 'l' ? kcol : carbon) : (ck === 'l' ? [0.85, 0.86, 0.88] : [0.04, 0.045, 0.05]);
  if (k) amKit(S.K, k).forEach(([w, h, d, x, y, z, rx, ry, rz, ck]) => { const g = new T.BoxGeometry(w, h, d).toNonIndexed(), m = new T.Matrix4().compose(V(x * s, y * s, z * s), new T.Quaternion().setFromEuler(new T.Euler(rx, ry, rz)), V(s, s, s)), nm = new T.Matrix3().getNormalMatrix(m);
    const pa = g.attributes.position, na = g.attributes.normal, c = col(ck), p = V(), n = V(); for (let i = 0; i < pa.count; i++) { p.fromBufferAttribute(pa, i).applyMatrix4(m); n.fromBufferAttribute(na, i).applyMatrix3(nm).normalize(); P.push(p.x, p.y, p.z); N.push(n.x, n.y, n.z); C.push(c[0], c[1], c[2]); } g.dispose(); });
  const G = new T.BufferGeometry(); G.setAttribute('position', new T.Float32BufferAttribute(P, 3)); G.setAttribute('normal', new T.Float32BufferAttribute(N, 3)); G.setAttribute('color', new T.Float32BufferAttribute(C, 3)); G.setAttribute('uv', new T.Float32BufferAttribute(new Float32Array(P.length / 3 * 2), 2));
  G.computeBoundingBox(); const bb = G.boundingBox, cx = (bb.min.x + bb.max.x) / 2, cz = (bb.min.z + bb.max.z) / 2; G.translate(-cx, -bb.min.y, -cz); G.computeBoundingBox(); G.computeBoundingSphere();
  return { geo: G, h: bb.max.y - bb.min.y, len: bb.max.x - bb.min.x, wid: bb.max.z - bb.min.z }; };
const AMMAT = {};
const amMat = (style) => AMMAT[style] || (AMMAT[style] = new T.MeshPhongMaterial({ vertexColors: true, shininess: style === 'white' ? 6 : style === 'carpaint' ? 70 : 110, specular: style === 'white' ? 0x111111 : style === 'carpaint' ? 0x555555 : 0x888888 }));
// ---- the stands ----
const amRing = (g, M, r, y, t = 0.006) => { const ring = new T.Mesh(new T.CylinderGeometry(r + 0.002, r + 0.002, t, 48), M.AL); ring.position.y = y - t / 2; g.add(ring); return ring; };
const amCyl = (g, mat, r0, r1, h, y, seg = 48) => { const m = new T.Mesh(new T.CylinderGeometry(r0, r1, h, seg), mat); m.position.y = y + h / 2; g.add(m); return m; };
const amEmi = (col, k) => new T.MeshBasicMaterial({ color: new T.Color(col).multiplyScalar(k) });
const amGlass = () => AMMAT.glass || (AMMAT.glass = new T.MeshPhongMaterial({ color: 0xdfeefa, transparent: true, opacity: 0.16, shininess: 160, specular: 0xffffff, depthWrite: false, side: T.FrontSide }));
// a wrench (a flat open-end spanner: a handle, an open jaw at one end, a ring at the other), length L, in the x-z plane (lying), t thick
const amWrenchGeo = (L, t) => { const s = new T.Shape(), w = L * 0.11, r1 = L * 0.15, r2 = L * 0.13, x0 = -L / 2 + r1 * 0.75, x1 = L / 2 - r2 * 0.75;
  s.moveTo(x0, -w / 2); s.lineTo(x1, -w / 2); s.absarc(L / 2 - r2, 0, r2, -Math.PI * 0.7, Math.PI * 0.7, false); s.lineTo(x1, w / 2); s.lineTo(x0, w / 2);
  s.absarc(-L / 2 + r1, 0, r1, Math.PI * 0.35, Math.PI * 1.65, false); s.lineTo(x0, -w / 2);
  const jaw = new T.Path(); jaw.absarc(-L / 2 + r1 * 0.95, 0, r1 * 0.5, 0, Math.PI * 2, true); s.holes.push(jaw); const ring = new T.Path(); ring.absarc(L / 2 - r2, 0, r2 * 0.5, 0, Math.PI * 2, true); s.holes.push(ring);
  const g = new T.ExtrudeGeometry(s, { depth: t, bevelEnabled: true, bevelThickness: t * 0.3, bevelSize: t * 0.3, bevelSegments: 2, curveSegments: 16 }); g.rotateX(-Math.PI / 2); g.translate(0, 0, 0); return g; };
// a wrench drawn on a canvas (white on transparent): the push button's cap
const amWrenchTex = () => pdTex('amwrench', 256, 256, (g, W, H) => { g.translate(W / 2, H / 2); g.rotate(-Math.PI / 4); g.fillStyle = '#ffffff'; const L = 190, w = 30;
  g.fillRect(-L / 2 + 30, -w / 2, L - 60, w); g.beginPath(); g.arc(-L / 2 + 30, 0, 36, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(L / 2 - 30, 0, 32, 0, Math.PI * 2); g.fill();
  g.globalCompositeOperation = 'destination-out'; g.fillRect(-L / 2 - 10, -13, 46, 26); g.beginPath(); g.arc(L / 2 - 30, 0, 15, 0, Math.PI * 2); g.fill(); });
// ---- the parts on the top: a model on its stand, or the service element; returns { obj, top, glows } ----
const amPart = (g, M, key, kind, v) => { const P = new T.Group(); g.add(P); let top = 0; const glows = [];
  if (key === 'aero') { const style = v === 1 ? 'white' : v === 2 ? 'carpaint' : 'kitpaint', md = amModel(style, kind, v === 3 ? 0.072 : AMF.sc); let h0 = 0;
    if (v === 1) h0 = pzPlinth(P, M, 0.235, 0.035);
    else if (v === 2) { amCyl(P, M.RUB, 0.24, 0.245, 0.016, 0); amCyl(P, PR.mat(0x40464f, { shininess: 60, specular: 0x444444 }), 0.226, 0.226, 0.01, 0.016); h0 = 0.026;   // (a small turntable: a dark base, the steel platter, a ring in the kit's colour round it)
      const ln = new T.Mesh(new T.TorusGeometry(0.229, 0.006, 6, 64), amEmi(AERO_COL[kind], 0.95)); ln.rotation.x = Math.PI / 2; ln.position.y = h0 - 0.002; P.add(ln); }
    else { const E = new T.Group(); E.scale.z = 0.78; P.add(E); P.userData.oval = E;   // (the lit base: a light ring round its top, the felt on it; oval with its dome: the dome's back lower on the screen, the pools behind stay clear)
      amCyl(E, M.NV, 0.25, 0.255, 0.026, 0); amRing(E, M, 0.252, 0.026); amCyl(E, amEmi(0xbfeaff, 1.0), 0.247, 0.247, 0.004, 0.02); h0 = 0.03;
      const felt = new T.Mesh(new T.CylinderGeometry(0.236, 0.236, 0.004, 48), M.FELT); felt.position.y = h0 - 0.001; felt.userData.pdTint = true; E.add(felt); }
    const m = new T.Mesh(md.geo, amMat(style)); m.position.y = h0; m.rotation.y = AMF.yaw; m.castShadow = true; m.receiveShadow = true; P.add(m); top = h0 + md.h;
    if (v === 3) { const R = 0.245, hc = 0.095, cap = 0.028, gm = amGlass(), E = P.userData.oval; const cyl = new T.Mesh(new T.CylinderGeometry(R, R, hc, 48, 1, true), gm); cyl.position.y = h0 + hc / 2; cyl.renderOrder = 4; E.add(cyl);
      const dome = new T.Mesh(new T.SphereGeometry(R, 48, 12, 0, Math.PI * 2, 0, Math.PI / 2), gm); dome.scale.y = cap / R; dome.position.y = h0 + hc; dome.renderOrder = 4; E.add(dome); top = h0 + hc + cap;
      for (const yy of [h0 + 0.002, h0 + hc]) { const rim = new T.Mesh(new T.TorusGeometry(R, 0.0035, 6, 48), M.AL); rim.rotation.x = Math.PI / 2; rim.position.y = yy; E.add(rim); } }   // (a thin metal rim at its foot and round its shoulder: the glass reads as a dome)
    P.userData.model = md; }
  else if (key === 'srv') {
    if (v === 1) {   // (the push button: a round aluminium foot, a short navy pedestal, a chrome collar, the red cap with a white wrench)
      amCyl(P, M.AL, 0.2, 0.21, 0.02, 0); amCyl(P, M.NV, 0.15, 0.17, 0.05, 0.02); const col = new T.Mesh(new T.TorusGeometry(0.15, 0.016, 12, 48), M.STL); col.rotation.x = Math.PI / 2; col.position.y = 0.074; P.add(col);
      const RD = PR.mat(0xd8202a, { shininess: 90, specular: 0x666666, emissive: 0x2a0204 }); amCyl(P, RD, 0.135, 0.14, 0.03, 0.07); const cap = new T.Mesh(new T.SphereGeometry(0.135, 48, 10, 0, Math.PI * 2, 0, Math.PI / 2), RD); cap.scale.y = 0.18; cap.position.y = 0.1; P.add(cap);
      const ic = new T.Mesh(new T.CircleGeometry(0.1, 40), new T.MeshLambertMaterial({ map: amWrenchTex(), transparent: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); ic.rotation.x = -Math.PI / 2; ic.position.y = 0.1 + 0.135 * 0.18 + 0.0005; ic.renderOrder = 2; P.add(ic);
      top = 0.13; }
    else if (v === 2) {   // (the single-post lift: a base plate, the orange post with its carriage, two arms forward, a tiny car on them)
      const OR = PR.mat(0xff7a1a, { shininess: 60, specular: 0x553311 }), DK = PR.mat(0x2a2d33, { shininess: 40 }), YL = PR.mat(0xf2c230, { shininess: 30 });
      amCyl(P, M.RUB, 0.23, 0.235, 0.014, 0); const ring = new T.Mesh(new T.TorusGeometry(0.232, 0.006, 6, 64), YL); ring.rotation.x = Math.PI / 2; ring.position.y = 0.012; P.add(ring);   // (a round dark floor plate, the garage's yellow line round it)
      const pz = -0.13, ph = 0.24; amCyl(P, DK, 0.05, 0.055, 0.016, 0.014).position.z = pz;
      const post = new T.Mesh(new T.BoxGeometry(0.055, ph, 0.055), OR); post.position.set(0, 0.03 + ph / 2, pz); P.add(post); const capP = new T.Mesh(new T.BoxGeometry(0.065, 0.014, 0.065), DK); capP.position.set(0, 0.03 + ph + 0.007, pz); P.add(capP);
      const yl = 0.15, carr = new T.Mesh(new T.BoxGeometry(0.08, 0.055, 0.035), OR); carr.position.set(0, 0.03 + yl - 0.02, pz + 0.045); P.add(carr);   // (the carriage up the post, the car's height)
      for (const s of [-1, 1]) { const arm = new T.Mesh(new T.BoxGeometry(0.022, 0.016, 0.25), OR); arm.position.set(s * 0.06, 0.03 + yl - 0.035, pz + 0.16); arm.rotation.y = -s * 0.32; P.add(arm);
        const pad = new T.Mesh(new T.CylinderGeometry(0.016, 0.016, 0.012, 12), DK); pad.position.set(s * 0.1, 0.03 + yl - 0.022, pz + 0.27); P.add(pad); }
      const car = new T.Group(); car.position.set(0, 0.03 + yl - 0.016, pz + 0.2); P.add(car); const md = amModel('carpaint', 0, 0.06), m = new T.Mesh(md.geo, amMat('carpaint')); m.rotation.y = 0.15; car.add(m); top = 0.03 + Math.max(ph + 0.014, yl + md.h); }
    else {   // (the tool chest: red, its lid open (hinged at the back), a tray of tools inside, a chrome handle; a big wrench lying before it)
      const RD = PR.mat(0xc8202a, { shininess: 70, specular: 0x553333 }), DK = PR.mat(0x1a1c20, { shininess: 30 }), w = 0.34, d = 0.17, h = 0.12;
      const box = new T.Mesh(new T.BoxGeometry(w, h, d), RD); box.position.set(0, h / 2, -0.04); P.add(box);
      const tray = new T.Mesh(new T.BoxGeometry(w - 0.02, 0.006, d - 0.02), DK); tray.position.set(0, h + 0.0005, -0.04); P.add(tray);
      for (let i = 0; i < 4; i++) { const tl = new T.Mesh(new T.BoxGeometry(0.16 - i * 0.015, 0.008, 0.012), M.STL); tl.position.set(-0.04 + i * 0.012, h + 0.006, -0.1 + i * 0.03); tl.rotation.y = 0.1 * (i - 1.5); P.add(tl); }
      const lid = new T.Group(); lid.position.set(0, h, -0.04 - d / 2); lid.rotation.x = -1.95; P.add(lid); const lp = new T.Mesh(new T.BoxGeometry(w, 0.02, d), RD); lp.position.set(0, 0.01, d / 2); lid.add(lp);
      const hd = new T.Mesh(new T.BoxGeometry(0.14, 0.016, 0.016), M.STL); hd.position.set(0, 0.03, d - 0.01); lid.add(hd);
      for (const sy of [0.04, 0.085]) { const dr = new T.Mesh(new T.BoxGeometry(w - 0.02, 0.004, 0.003), DK); dr.position.set(0, sy, -0.04 + d / 2 + 0.0015); P.add(dr); }   // (the drawers' seams on its front)
      const wr = new T.Mesh(amWrenchGeo(0.3, 0.012), M.STL); wr.position.set(0.02, 0.004, 0.11); wr.rotation.y = 0.18; P.add(wr);
      top = h + 0.17 * Math.sin(1.95 - Math.PI / 2) + 0.02 + 0.02; }
  }
  P.traverse(m => { if (m.isMesh) { m.castShadow = !(m.material && m.material.transparent) && !(m.material && m.material.type === 'MeshBasicMaterial'); m.receiveShadow = true; } });
  return { obj: P, top, glows }; };
// ---- the top's cells (PZA's pzTop with its parts from amPart, each element's place by its kind) ----
const amTop = (F, M, L, Z, els, v) => { const A = L.A, K = pnK(L.wc, L.R, 0), G = new T.Group(); G.position.set(K.O[0], 0, K.O[1]); F.add(G); F.updateMatrixWorld(true); const sh = new T.Group(); G.add(sh);
  const y = A.H + 0.0008, rB = L.rB + 0.004, rF = L.R + PNL.over - 0.002, bEnd = PNL.bE - 0.002, n = Z.top.length, xa = 1.5, xb = 410.5, cx = (j) => xa + (xb - xa) * j / n;
  const zB = (x) => pnZr(K, x, rB), zF = (x) => pnZr(K, x, rF), zR = (x, r) => pnZr(K, x, r);
  const seam = (j, zfn) => { if (j <= 0 || j >= n) { const b = j <= 0 ? -bEnd : bEnd; let x = 0; for (let i = 0; i < 5; i++) { const z = zfn(x); x = (z + L.R) * Math.tan(b); } return x; }
    let x = pnUX(K, cx(j), y, zfn(0)); for (let i = 0; i < 5; i++) x = pnUX(K, cx(j), y, zfn(x)); return x; };
  const bandB = rF - 0.06, bandF = rF - 0.008, tagR = rF - 0.084, tagD = 0.032;
  const labs = []; let j0 = 0; Z.bands.forEach(([nm, cnt]) => { const ja = j0, jb = j0 + cnt, zm = (x) => zR(x, (bandB + bandF) / 2), u0 = seam(ja, zm), u1 = seam(jb, zm);
    const v0 = ja === 0 ? pnUX(K, 2, y, zm(u0)) : u0, v1 = jb === n ? pnUX(K, 410, y, zm(u1)) : u1;
    const mat = new T.MeshBasicMaterial({ map: hNameTex(nm, (v1 - v0) / (bandF - bandB), { H: 64, font: 46, pad: 6, line: 7 }) }); mat.map.wrapS = mat.map.wrapT = T.ClampToEdgeWrapping;
    for (let j = ja; j < jb; j++) labs[j] = { u0: v0, u1: v1, mat, nm }; j0 = jb; });
  Z.top.forEach(([key, kind], j) => { const g = new T.Group(); G.add(g); const [en, nm] = PDEL[key][kind];
    const Q = [], xl0 = seam(j, zB), xr0 = seam(j + 1, zB), xl1 = seam(j, zF), xr1 = seam(j + 1, zF), N = 16;
    for (let i = 0; i <= N; i++) { const x = xl0 + (xr0 - xl0) * i / N; Q.push([x, zB(x)]); }
    for (let i = 1; i < 4; i++) { const t = i / 4, z = zB(xr0) + (zF(xr1) - zB(xr0)) * t; Q.push([j + 1 >= n ? (z + L.R) * Math.tan(bEnd) : pnUX(K, cx(j + 1), y, z), z]); }
    for (let i = 0; i <= N; i++) { const x = xr1 + (xl1 - xr1) * i / N; Q.push([x, zF(x)]); }
    for (let i = 1; i < 4; i++) { const t = i / 4, z = zF(xl1) + (zB(xl0) - zF(xl1)) * t; Q.push([j <= 0 ? -(z + L.R) * Math.tan(bEnd) : pnUX(K, cx(j), y, z), z]); }
    const tile = pdFlat(g, Q.map(([u, w]) => [u, w]), y, M.TOP2); tile.userData.pdTint = true;
    const rI = L.R + PNL.over - (AMF.rItem[key + v] || AMF.rItem[key]), zIt = (x) => zR(x, rI), cl = Math.max(cx(j), 1), cr = Math.min(cx(j + 1), 411); let xm = pnUX(K, (cl + cr) / 2, y, zIt(0)); for (let i = 0; i < 4; i++) xm = pnUX(K, (cl + cr) / 2, y, zIt(xm));
    const th = -Math.atan(pnDz(K, xm)), stand = new T.Group(); stand.position.set(xm, y, zIt(xm)); stand.rotation.y = th; g.add(stand);
    const pt = amPart(stand, M, key, kind, v), shs = AMF.shadow[key];
    pdSoft(sh, xm, zIt(xm) + 0.01, y + 0.0006, shs[0], shs[1], 0.42).rotation.z = th;
    const zt = (x) => zR(x, tagR), ta = Math.max(xl1, pnUX(K, cl + 4, y, zt(xm))), tb = Math.min(xr1, pnUX(K, cr - 4, y, zt(xm))), tw = Math.min(0.3, 0.8 * (tb - ta)), tx = (ta + tb) / 2;
    const tag = pdTag(g, en, tw, tagD, tx, y, zt(tx), { font: 72 }); tag.rotation.y = -Math.atan(pnDz(K, tx));
    const Lb = labs[j], zA = (x) => zR(x, bandB), zC = (x) => zR(x, bandF), bx0 = seam(j, (x) => zR(x, (bandB + bandF) / 2)), bx1 = seam(j + 1, (x) => zR(x, (bandB + bandF) / 2));
    const band = new T.Mesh(pnGeo(8, 1, (s, t) => { const x = pnLerp(bx0, bx1, s), z = t <= 0 ? zA(x) : zC(x); return [V(x, y + 0.0012, z), V(0, 1, 0), [(x - Lb.u0) / (Lb.u1 - Lb.u0), 1 - t]]; }), Lb.mat); band.userData.pdPlate = true; g.add(band);
    pdMergeGroup(g); g.traverse(m => { if (m.isMesh && m.material !== M.TOP2 && !m.userData.pdPlate && m.material !== Lb.mat && !(m.material && (m.material.transparent || m.material.type === 'MeshBasicMaterial'))) m.castShadow = true; });
    els.push({ key, kind, en, nm, grp: PDGRP[key], cab: cx(j) + cx(j + 1) < 412 ? 'L' : 'R', place: 'top', row: -1, col: j, cell: [cx(j), cx(j + 1)], g, part: pt.obj, label: tag, scale: AMF.sc, top: xF(pt.top) }); });
  return { n, x: [xa, xb], y: [xF(pnS(K, 0, y, zB(0))[1], 1), xF(pnS(K, 0, y, zF(0))[1], 1)], G }; };
// ======== A VERSION: PZA's version 1 (PNB's form 4, the stile in the middle) with the models and the service element on the top ========
const amBuild = (S, out, v) => { const Z = AMT, s0 = PNF[4].stileX; PNF[4].stileX = PZF.stileX; let L; try { L = pnLay(4); } finally { PNF[4].stileX = s0; }
  L.cols.forEach(C => { C.rows = Z[C.side].map(pzRow); C.hold = C.side === 'L' ? -0.8 : 0.8; });
  const M = pdMats(), A = L.A, els = [], F = PR.group(); F.position.set(0, 0, 0.2); F.rotation.y = 0.3; F.updateMatrixWorld(true);
  pdHideGame(S, out); const body = new T.Group(); F.add(body); const accB = pdAcc(); pnBody(accB, M, L);
  const D = Object.assign({}, PNL.dr, { mats: { T: M.FELT, W: M.FELTW, col: PDCOL.blu } }), lay = { v, R: L.R, H: A.H, D: A.D, P: A.P, open: A.open, face: xF(L.face), wb: xF(L.wb), wc: xF(L.wc), rows: {} }, groups = [body];
  const top = amTop(F, M, L, Z, els, v); lay.top = { n: top.n, x: top.x, y: top.y }; groups.push(top.G);
  L.cols.forEach((C) => { const K = C.K; C.G = new T.Group(); C.G.position.set(K.O[0], 0, K.O[1]); C.G.rotation.y = K.a; F.add(C.G); C.sh = new T.Group(); C.G.add(C.sh); C.acc = pnAccT(accB, new T.Matrix4().makeRotationY(K.a).setPosition(K.O[0], 0, K.O[1])); groups.push(C.G);
    F.updateMatrixWorld(true); D.dd = A.D - PNL.dr.dd - (L.R - C.rF);
    const rTop = C.rF + PNL.over, occ = [{ z: (x) => pnZr(K, x, rTop), h: A.H - PNL.topT - 0.004 }];
    L.drs.forEach((d0) => { const dr = Object.assign({}, d0);
      if (dr.open < 0) { pnDrawerShut(C, M, D, dr); return; }
      dr.p = C.pulls[dr.open]; const groupsK = C.rows[dr.open], ytop = dr.t - D.under, zf = (x) => pnZr(K, x) + dr.p, zfi = (x) => zf(x) - D.fT;
      const zLo = (x) => Math.max(...occ.map(e => pnRay(K, e.z(x), e.h, ytop))), zHi = (x) => pnRay(K, zfi(x), dr.t, ytop);
      dr.x = [C.edge[0] ? 1.5 : pnSpan(K, 0, C.xo0, ytop, zLo(C.xo0), zHi(C.xo0)), C.edge[1] ? 410.5 : pnSpan(K, 1, C.xo1, ytop, zLo(C.xo1), zHi(C.xo1))];
      lay.rows[C.side + dr.open] = pnDrawer(F, C, M, D, dr.open, dr, groupsK, occ.slice(), els);
      occ.push({ z: (x) => zf(x), h: dr.b }, { z: (x) => zf(x) + D.pullD, h: dr.t - D.pullH }); }); });
  accB.flush(body, { cast: (m) => m === M.NV || m === M.TOP2 });
  F.updateMatrixWorld(true); groups.forEach(g => { if (!out.frames.includes(g)) out.frames.push(g); }); pdNanCheck(F);
  const mt = els.filter(e => e.place === 'top').map(e => ({ en: e.en, top: e.top, verts: (() => { let n = 0; e.g.traverse(q => { if (q.isMesh) n += q.geometry.attributes.position.count; }); return n; })() })); console.error('AMTOP ' + JSON.stringify(mt));
  out.drawers = []; out.aeroDr = null; out.xc = { opt: 'am_' + v, groups: [], extra: [] }; out.s6 = { L: lay, els, F, cabs: { L: body, R: new T.Group() }, names: [] }; return out; };
const amaFronts = (S, out, o = {}) => { if (AMA.v >= 1 && AMA.v <= 3) { pdHideGift(S); return amBuild(S, out, AMA.v); } return pzaFronts(S, out, o); };
// ==== AV (agent AV = PNB/PZA/AMA, round AV: the user: "Maketa v barvi avta, rdeč gumb. Zbriši GT PACK, tam pusti prazen prostor. Ostale 3
//      makete naj ostanejo na istem prostoru. Aero paketi naj bodo različnih barv, avti naj imajo tudi različne poslikave. Naredi 6
//      različnih verzij. Ko klikneš na aero paket, se osvetli maketa avta in ne štirikotnik kot sedaj. ..." and "Naredi, da je en avto pod
//      kupolo, to pomeni, da je zaklenjen.") AMA's chest top with:
//      - the models painted as cars (AMA v2) on small turntables, each with its OWN LIVERY (paint, stripes, two-tone, racing numbers,
//        flames, chequer bands: painted on the car's own mesh by projecting a small drawing onto its sides or its top: one mesh a model,
//        the colours in the vertices) and its kit in its own colours (no longer all carbon);
//      - GT PACK gone: its place on the top stays EMPTY (the bare top, only the printed band along the edge); STREET, SPORT, RACE where they
//        were, all three in ONE pose (the same turntable, scale, turn and place); RACE (DIRKALNI) LOCKED: a padlock on its turntable's front-left rim;
//      - the service element: AMA v1's big red push button with the white wrench;
//      - a tapped model lights up on its own silhouette (the frames: e.model), its cell stays the (invisible) tap area.
//      Six versions (AV.v 1..6) of liveries and kit colours; lift design AV.v from agent LF's patch. AV.v 0: AMA's version 2 as before ----
const AV = { v: 1, lf: true };
if (AV.lf && typeof PBL !== 'undefined') PBL.type = AV.v;   // (agent LF's lift design k in version k: its setting PBL.type, from its patch)
// ---- the liveries: [STREET, SPORT, RACE] a version: paint, stripes (the car's twin stripes: their colour, or null: painted over), low (the
//      lower body's colour: two-tone), decals ([kind, ...]), kit: [the kit's colour, its second colour (splitter, posts, fins), its line] ----
const AVL = {
  1: { name: 'KLASIČNE DIRKALNE ČRTE', m: [
    { paint: 0xd81f2a, stripe: 0xf4f4f0, kit: [0xf4f4f0, 0x1c1d22, 0xf4f4f0], txt: 'rdeča z belima črtama, paket bel' },
    { paint: 0xf2f2ee, stripe: 0x1c5fd6, kit: [0x1c5fd6, 0x15214a, 0xf2c230], txt: 'bela z modrima črtama, paket moder' },
    { paint: 0x4b5563, stripe: 0xd4a52a, kit: [0xd4a52a, 0x1c1d22, 0xd4a52a], txt: 'grafitno siva z zlatima črtama, paket zlat' }] },
  2: { name: 'DIRKALNE ŠTEVILKE', m: [
    { paint: 0xff7a1a, stripe: null, decals: [['number', '21', 0xf4f4f0, 0x1c1d22]], kit: [0x1c1d22, 0x1c1d22, 0xf4f4f0], txt: 'oranžna, bela okrogla tablica s številko 21, paket črn' },
    { paint: 0xf2f2ee, stripe: null, decals: [['number', '7', 0x1c5fd6, 0xffffff], ['band', 0x1c5fd6, 0.72, 0.8]], kit: [0x1c5fd6, 0x15214a, 0x1c5fd6], txt: 'bela, modra tablica s številko 7 in modra bočna črta, paket moder' },
    { paint: 0x2a5bd7, stripe: 0xf4f4f0, decals: [['number', '1', 0xf4f4f0, 0xd81f2a]], kit: [0xd81f2a, 0x7a0f16, 0xf4f4f0], txt: 'modra z belima črtama, bela tablica z rdečo enko, paket rdeč' }] },
  3: { name: 'DVOBARVNE', m: [
    { paint: 0xb8bec6, stripe: null, low: 0x2b313b, kit: [0xff7a1a, 0x2b313b, 0xff7a1a], txt: 'srebrna zgoraj, temno siva spodaj, paket oranžen' },
    { paint: 0x14b8a6, stripe: null, low: 0xf2f2ee, kit: [0xf2f2ee, 0x0f766e, 0x14b8a6], txt: 'turkizna zgoraj, bela spodaj, paket bel' },
    { paint: 0xf2c230, stripe: 0x1c1d22, low: 0x1c1d22, kit: [0x1c1d22, 0x1c1d22, 0xf2c230], txt: 'rumena zgoraj s črnima črtama, črna spodaj, paket črn' }] },
  4: { name: 'PLAMENI', m: [
    { paint: 0x1c1d22, stripe: null, decals: [['flames', 0xff5a14, 0xffd23f]], kit: [0xff7a1a, 0x1c1d22, 0xffd23f], txt: 'črna z oranžno-rumenimi plameni, paket oranžen' },
    { paint: 0x6d28d9, stripe: null, decals: [['flames', 0x22d3ee, 0xf0fdff]], kit: [0xc8ccd2, 0x3a3f47, 0x22d3ee], txt: 'vijolična s turkizno-belimi plameni, paket srebrn' },
    { paint: 0xd81f2a, stripe: null, decals: [['flames', 0xffd23f, 0xfff7d6]], kit: [0xffd23f, 0x1c1d22, 0xffd23f], txt: 'rdeča z rumeno-belimi plameni, paket rumen' }] },
  5: { name: 'ŠAHOVNICE', m: [
    { paint: 0xf2f2ee, stripe: null, decals: [['chequer', 0x1c1d22, 0xf2f2ee]], kit: [0x1c1d22, 0x1c1d22, 0xd81f2a], txt: 'bela s črno-belo šahovnico ob pragovih, paket črn' },
    { paint: 0x1c1d22, stripe: null, decals: [['hoodcheq', 0xf2f2ee, 0x1c1d22]], kit: [0x84cc16, 0x1c1d22, 0x84cc16], txt: 'črna s šahovnico čez pokrov motorja, paket limetin' },
    { paint: 0xf2c230, stripe: 0x1c1d22, decals: [['roofcheq', 0x1c1d22, 0xf2f2ee]], kit: [0x1c1d22, 0x1c1d22, 0xf2f2ee], txt: 'rumena s črnima črtama in šahovnico na strehi, paket črn' }] },
  6: { name: 'MEŠANE POSLIKAVE', m: [
    { paint: 0x5eead4, stripe: null, decals: [['band', 0xf2f2ee, 0.62, 0.72], ['number', '5', 0xf2f2ee, 0x0f766e]], kit: [0xf472b6, 0x3a3f47, 0xf472b6], txt: 'mentolna z belo bočno črto in številko 5, paket roza' },
    { paint: 0xc8ccd2, stripe: null, low: 0xd81f2a, decals: [['flames', 0xd81f2a, 0xff8a3d]], kit: [0xd81f2a, 0x3a3f47, 0xc8ccd2], txt: 'srebrna zgoraj, rdeča spodaj, rdeči plameni, paket rdeč' },
    { paint: 0x1e3a8a, stripe: 0xd4a52a, decals: [['hoodcheq', 0xf2f2ee, 0x1c1d22], ['number', '99', 0xd4a52a, 0x1c1d22]], kit: [0xd4a52a, 0x1c1d22, 0xf2f2ee], txt: 'temno modra z zlatima črtama, šahovnico na pokrovu in zlato številko 99, paket zlat' }] } };
const AVT = { top: [['aero', 1], ['aero', 2], ['aero', 3], null, ['srv', 'srv']], bands: [['AERO KITS', 3], [null, 1], ['SERVICE', 1]],
  L: [['HL'], ['UG', 0, 4], ['GR', 0, 4], ['CAL']], R: [['TL'], ['UG', 4, 5, 'IND'], ['GR', 4, 5, 'DEC'], ['DISC', null, null, 'NUTS']], lock: 3 };
// ---- the car's surface for the decals: a raycast on the game's car mesh (its own metres: x forward, y up, z right) ----
let AVRAY = null;
const avRay = () => { if (AVRAY) return AVRAY; const S = amSrc(), g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(S.P, 3)); g.computeBoundingBox(); g.computeBoundingSphere();
  const m = new T.Mesh(g, new T.MeshBasicMaterial({ side: T.DoubleSide })); m.updateMatrixWorld(true); return (AVRAY = { m, rc: new T.Raycaster() }); };
const avHit = (o, d) => { const R = avRay(); R.rc.set(o, d); const h = R.rc.intersectObject(R.m, false)[0]; if (!h) return null; const n = h.face.normal.clone(); if (n.dot(d) > 0) n.negate(); return { p: h.point, n }; };
// a drawing (canvas: w × h, draw(g, w, h)) projected onto the car: 'side' (u along x from x0 to x1, v along y from a0 to a1, on the side s:
// +1 right, -1 left; text: mirrored on the left side so it reads), 'top' (u along x, v along z from a0 to a1); res: cells; the cells the
// drawing covers (alpha > .5) become small quads 1 cm out of the surface, their colour the drawing's; into P, N, C (the car's metres)
const avDecal = (P, N, C, d) => { const [w, h] = d.px, cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d'); d.draw(g, w, h); const im = g.getImageData(0, 0, w, h).data;
  const [nu, nv] = d.res, sides = d.proj === 'side' ? [1] : [0], off = 0.012;   // (the side the camera sees only: the models never turn, their far side is never seen; half the cost)
  sides.forEach(sd => { const pts = []; for (let j = 0; j <= nv; j++) { const row = []; for (let i = 0; i <= nu; i++) { const u = i / nu, v = j / nv, x = d.x0 + (d.x1 - d.x0) * u, a = d.a0 + (d.a1 - d.a0) * v;
        const H = d.proj === 'side' ? avHit(V(x, a, sd * 3), V(0, 0, -sd)) : avHit(V(x, 5, a), V(0, -1, 0)); row.push(H && (d.proj !== 'side' || Math.abs(H.p.z) > (d.zmin || 0.8)) ? { p: H.p.clone().addScaledVector(H.n, off), n: H.n } : null); } pts.push(row); }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const q = [pts[j][i], pts[j][i + 1], pts[j + 1][i + 1], pts[j + 1][i]]; if (q.some(x => !x)) continue;
      let cu = (i + 0.5) / nu; const cvv = (j + 0.5) / nv; if (d.text && sd < 0) cu = 1 - cu; if (d.flipSide && sd < 0) cu = 1 - cu;
      const px = Math.min(w - 1, Math.floor(cu * w)), py = Math.min(h - 1, Math.floor((1 - cvv) * h)), k = (py * w + px) * 4; if (im[k + 3] < 128) continue;
      const col = [im[k] / 255, im[k + 1] / 255, im[k + 2] / 255], nn = q[0].n.clone().add(q[2].n).normalize();
      // (wound to face out: the cross of its edges along its normal)
      const e1 = V().subVectors(q[1].p, q[0].p), e2 = V().subVectors(q[2].p, q[0].p), ord = e1.cross(e2).dot(nn) >= 0 ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2];
      ord.forEach(t => { const p = q[t].p; P.push(p.x, p.y, p.z); N.push(nn.x, nn.y, nn.z); C.push(col[0], col[1], col[2]); }); } }); };
const avHex = (c) => '#' + new T.Color(c).getHexString();
// the decals' drawings and places
const avDecals = (dc) => { const [kind, a, b, c, e] = dc;
  if (kind === 'number') return { proj: 'side', x0: -1.02, x1: 0.18, a0: 0.36, a1: 0.95, res: [46, 23], px: [230, 113], text: true, draw: (g, w, h) => {
    g.fillStyle = avHex(b); g.beginPath(); g.arc(w / 2, h / 2, h * 0.47, 0, Math.PI * 2); g.fill(); g.fillStyle = avHex(c); g.font = `900 ${Math.round(h * (a.length > 1 ? 0.56 : 0.66))}px Arial, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(a, w / 2, h / 2 + h * 0.04); } };
  if (kind === 'band') return { proj: 'side', x0: -2.45, x1: 2.45, a0: b, a1: c, res: [80, 3], px: [80, 3], draw: (g, w, h) => { g.fillStyle = avHex(a); g.fillRect(0, 0, w, h); } };
  if (kind === 'low') return { proj: 'side', x0: -2.5, x1: 2.5, a0: 0.25, a1: 0.64, res: [90, 10], px: [90, 10], zmin: 0.5, draw: (g, w, h) => { g.fillStyle = avHex(a); g.fillRect(0, 0, w, h); } };
  if (kind === 'flames') return { proj: 'side', x0: -0.9, x1: 2.4, a0: 0.38, a1: 0.9, res: [86, 18], px: [344, 72], flipSide: false, draw: (g, w, h) => {   // (flame tongues from the nose (right) back along the flank, the outer colour and a lighter core)
    const tongue = (y0, len, th, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(w, y0 - th); g.bezierCurveTo(w * 0.7, y0 - th, w - len * 0.6, y0 - th * 1.6, w - len, y0 - th * 0.2); g.bezierCurveTo(w - len * 0.75, y0 + th * 0.2, w - len * 0.55, y0 + th * 0.6, w - len * 0.5, y0 + th * 0.4);
      g.bezierCurveTo(w - len * 0.3, y0 + th * 0.9, w * 0.85, y0 + th, w, y0 + th); g.closePath(); g.fill(); };
    [[0.3, 0.95, 0.12], [0.52, 0.78, 0.13], [0.72, 0.62, 0.12], [0.88, 0.45, 0.08]].forEach(([y, l, t]) => tongue(y * h, l * w, t * h, avHex(a)));
    [[0.3, 0.7, 0.05], [0.52, 0.56, 0.06], [0.72, 0.42, 0.05]].forEach(([y, l, t]) => tongue(y * h, l * w, t * h, avHex(b))); } };
  if (kind === 'chequer') return { proj: 'side', x0: -1.75, x1: 1.75, a0: 0.38, a1: 0.56, res: [56, 3], px: [56, 3], draw: (g, w, h) => { for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) { g.fillStyle = avHex((i + j) % 2 ? b : a); g.fillRect(i, j, 1, 1); } } };
  if (kind === 'hoodcheq') return { proj: 'top', x0: 1.2, x1: 1.62, a0: -0.98, a1: 0.98, res: [4, 16], px: [4, 16], draw: (g, w, h) => { for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) { g.fillStyle = avHex((i + j) % 2 ? b : a); g.fillRect(i, j, 1, 1); } } };
  if (kind === 'roofcheq') return { proj: 'top', x0: -1.2, x1: 0.3, a0: -0.72, a1: 0.72, res: [12, 10], px: [12, 10], draw: (g, w, h) => { for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) { g.fillStyle = avHex((i + j) % 2 ? b : a); g.fillRect(i, j, 1, 1); } } };
  return null; };
// ---- a model in its livery (lv) with kit k at scale s: the car's mesh recoloured (paint, stripes over the top only, the lower body), its
//      decals, its kit in its colours; one geometry (vertex colours), seated on y 0, its middle at the origin ----
const avModel = (lv, k, s) => { const S = amSrc(), paint = AMSRC.paint || (AMSRC.paint = amPaint(S)), P = [], N = [], C = [], col = (h) => { const c = new T.Color(h); return [c.r, c.g, c.b]; };
  const pc = col(lv.paint), lc = lv.low != null ? col(lv.low) : pc, sc = lv.stripe != null ? col(lv.stripe) : pc;
  for (let i = 0; i < S.P.length; i += 3) { const x = S.P[i], y = S.P[i + 1], z = S.P[i + 2], r = S.C[i], g = S.C[i + 1], b = S.C[i + 2], cl = amClass(r, g, b, paint);
    P.push(x, y, z); N.push(S.N[i], S.N[i + 1], S.N[i + 2]);
    const own = typeof window !== 'undefined' && window.AVCARCOL, c = own ? [r, g, b] : cl === 'paint' ? (y < 0.6 ? lc : pc) : cl === 'stripe' && y > 0.85 ? sc : [r, g, b]; C.push(c[0], c[1], c[2]); }   // (drugi avti: the parked car's own colours)
  const decs = (typeof window !== 'undefined' && window.AVCARCOL) ? [] : (lv.low != null ? [['low', lv.low]] : []).concat(lv.decals || []); decs.forEach(dc => { const d = avDecals(dc); if (d) avDecal(P, N, C, d); });
  const [kk, k2, kl] = lv.kit.map(col), kcol = (ck) => ck === 'k' ? kk : ck === 'l' ? kl : k2;
  if (k) amKit(S.K, k).forEach(([w, h, d, x, y, z, rx, ry, rz, ck]) => { const g = new T.BoxGeometry(w, h, d).toNonIndexed(), m = new T.Matrix4().compose(V(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(rx, ry, rz)), V(1, 1, 1)), nm = new T.Matrix3().getNormalMatrix(m);
    const pa = g.attributes.position, na = g.attributes.normal, c = kcol(ck), p = V(), n = V(); for (let i = 0; i < pa.count; i++) { p.fromBufferAttribute(pa, i).applyMatrix4(m); n.fromBufferAttribute(na, i).applyMatrix3(nm).normalize(); P.push(p.x, p.y, p.z); N.push(n.x, n.y, n.z); C.push(c[0], c[1], c[2]); } g.dispose(); });
  if (typeof window !== 'undefined' && window.AVCARCOL && S.K) { const fit = Math.min(1, 4.82 / Math.max(0.1, S.K.front - S.K.rear), 1.34 / Math.max(0.1, S.K.top)); s *= fit; window.AVFIT = +fit.toFixed(3); }   // (another car: the model kept inside VIHAR's envelope (length 4.82 m, height 1.34 m) so the three still fit their turntables and stay below the signs)
  for (let i = 0; i < P.length; i++) P[i] *= s;
  const G = new T.BufferGeometry(); G.setAttribute('position', new T.Float32BufferAttribute(P, 3)); G.setAttribute('normal', new T.Float32BufferAttribute(N, 3)); G.setAttribute('color', new T.Float32BufferAttribute(C, 3)); G.setAttribute('uv', new T.Float32BufferAttribute(new Float32Array(P.length / 3 * 2), 2));
  G.computeBoundingBox(); const bb = G.boundingBox, cx = (bb.min.x + bb.max.x) / 2, cz = (bb.min.z + bb.max.z) / 2; G.translate(-cx, -bb.min.y, -cz); G.computeBoundingBox(); G.computeBoundingSphere();
  return { geo: G, h: bb.max.y - bb.min.y, len: bb.max.x - bb.min.x }; };
// a padlock (gold body, a dark keyhole, a chrome shackle) standing, its foot at the origin, facing +z; size: the body's width
const avLock = (par, M, w) => { const g = new T.Group(); par.add(g); const GO = PR.mat(0xe0b12a, { shininess: 110, specular: 0x998855 }), DK = PR.mat(0x1a1c20, { shininess: 20 });
  const b = new T.Mesh(new T.BoxGeometry(w, w * 0.82, w * 0.36), GO); b.position.y = w * 0.41; g.add(b);
  const sh = new T.Mesh(new T.TorusGeometry(w * 0.3, w * 0.075, 8, 20, Math.PI), M.STL); sh.position.y = w * 0.82; g.add(sh);
  for (const sx of [-1, 1]) { const leg = new T.Mesh(new T.CylinderGeometry(w * 0.075, w * 0.075, w * 0.12, 8), M.STL); leg.position.set(sx * w * 0.3, w * 0.82, 0); g.add(leg); }
  const kh = new T.Mesh(new T.CircleGeometry(w * 0.11, 16), DK); kh.position.set(0, w * 0.47, w * 0.181); g.add(kh); const ks = new T.Mesh(new T.PlaneGeometry(w * 0.07, w * 0.2), DK); ks.position.set(0, w * 0.33, w * 0.181); g.add(ks);
  return g; };
// ---- the motorway signs behind the models (the user: "Vzadaj za maketami naj bodo 3D table, take kot so na avtocesti. Vsak avto naj ima
//      drugačno tablo ... YOUR CAR, BORROWED CAR, FOR SALE 4280€"): STREET a blue motorway sign on two posts, SPORT a green direction sign
//      (an arrow-shaped panel) on one post, RACE an overhead variable-message sign (amber LED dots in a dark box) on a small gantry (it spans
//      into GT PACK's empty place). In the model's stand frame (+z toward the camera), standing on the top behind the turntable, low enough
//      that nothing of it rises over the colour pools behind the chest; generic signs, no road numbers or logos. Each sign's parts merged a
//      material (its frame, its face); part of the model's element (a tap on it is a tap on the model) ----
const AVSG = { z: -0.15, cap: 0.62 };   // (the panels' plane behind the model's middle; cap: the capitals' share of the panel's text area)
const avSignTex = (key, w, h, draw) => pdTex(key, w, h, draw);
const avTxt = (g, txt, x, y, hpx, col, sq = 0.82, maxW = 1e9) => { g.save(); g.font = `bold ${Math.round(hpx / 0.72)}px Arial, Helvetica, sans-serif`; const tw = g.measureText(txt).width, k = Math.min(sq, maxW / tw); g.translate(x, y); g.scale(k, 1); g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 0, hpx * 0.04); g.restore(); };   // (squeezed to fit maxW)
// the faces: a blue motorway panel (white border, white capitals), a green arrow panel (white border following the arrow, white capitals),
// the message sign's face (dark, amber dots of a 7-dot-high matrix)
const avFaceBlue = () => avSignTex('sgBlue', 512, 120, (g, W, H) => { g.fillStyle = '#1748b8'; g.fillRect(0, 0, W, H); g.strokeStyle = '#f4f6f8'; g.lineWidth = 7; g.beginPath(); g.roundRect(9, 9, W - 18, H - 18, 12); g.stroke(); avTxt(g, 'YOUR CAR', W / 2, H / 2, 64, '#f4f6f8', 0.86, W - 44); });
const avFaceGreen = () => avSignTex('sgGreen', 512, 120, (g, W, H) => { const tip = 64; g.fillStyle = '#0d7a3d'; g.beginPath(); g.moveTo(0, 0); g.lineTo(W - tip, 0); g.lineTo(W, H / 2); g.lineTo(W - tip, H); g.lineTo(0, H); g.closePath(); g.fill();
  g.strokeStyle = '#f4f6f8'; g.lineWidth = 6; g.beginPath(); g.moveTo(9, 9); g.lineTo(W - tip - 3, 9); g.lineTo(W - 11, H / 2); g.lineTo(W - tip - 3, H - 9); g.lineTo(9, H - 9); g.closePath(); g.stroke(); avTxt(g, 'BORROWED CAR', (W - tip) / 2 + 6, H / 2, 64, '#f4f6f8', 0.8, W - tip - 30); });
const AVVMS = { cw: 80, ch: 9 };   // (the message sign's matrix: 80 × 9 dots; the text in a real 5 × 7 LED font, so the capitals are 7 dots high)
const AVGLY = { F: '#####|#....|#....|####.|#....|#....|#....', O: '.###.|#...#|#...#|#...#|#...#|#...#|.###.', R: '####.|#...#|#...#|####.|#.#..|#..#.|#...#',
  S: '.####|#....|#....|.###.|....#|....#|####.', A: '.###.|#...#|#...#|#####|#...#|#...#|#...#', L: '#....|#....|#....|#....|#....|#....|#####', E: '#####|#....|#....|####.|#....|#....|#####',
  4: '...#.|..##.|.#.#.|#..#.|#####|...#.|...#.', 2: '.###.|#...#|....#|...#.|..#..|.#...|#####', 8: '.###.|#...#|#...#|.###.|#...#|#...#|.###.',
  0: '.###.|#...#|#..##|#.#.#|##..#|#...#|.###.', '€': '..###|.#...|####.|.#...|####.|.#...|..###' };   // (the zero has its slash, so 4280 never reads as 428D)
const avFaceVMS = () => avSignTex('sgVms', AVVMS.cw * 10, AVVMS.ch * 10, (g, W, H) => { g.fillStyle = '#0b0c0e'; g.fillRect(0, 0, W, H); const cw = AVVMS.cw, ch = AVVMS.ch, txt = [...'FOR SALE 4280€'];
  const wd = c => c === ' ' ? 2 : 5, tw = txt.reduce((t, c) => t + wd(c), 0) + txt.length - 1, on = new Set(); let x = Math.floor((cw - tw) / 2);
  txt.forEach(c => { if (c !== ' ') AVGLY[c].split('|').forEach((row, j) => [...row].forEach((v, i) => { if (v === '#') on.add((j + 1) * cw + x + i); })); x += wd(c) + 1; });
  const sx = W / cw, sy = H / ch;
  for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) { const o = on.has(j * cw + i); g.fillStyle = o ? '#ffb020' : '#2a2216'; g.beginPath(); g.arc((i + 0.5) * sx, (j + 0.5) * sy, Math.min(sx, sy) * (o ? 0.46 : 0.3), 0, Math.PI * 2); g.fill(); } });
// ---- table2 (window.AVSV 'A' or 'B'): ALL THREE signs blue motorway panels like YOUR CAR (white border, white capitals 74/120 of the panel);
//   SPORT 'BORROWED' + a smaller price panel 'RENT 450€', RACE 'FOR SALE' + '4280€'.  A: the price panel stacked above the main panel on the
//   main sign's own (extended) post, in the same plane;  B: the price panel is a small separate flag sign on its own thin pole 7 cm behind
const AVB = { cap: 74, h: 0.096, w: 0.46 };
const avFaceB = (txt, w, h) => { const H = 120, W = Math.round(H * w / h); return avSignTex('sgB_' + txt + '_' + W, W, H, (g) => { g.fillStyle = '#1748b8'; g.fillRect(0, 0, W, H); g.strokeStyle = '#f4f6f8'; g.lineWidth = 7; g.beginPath(); g.roundRect(9, 9, W - 18, H - 18, 12); g.stroke(); avTxt(g, txt, W / 2, H / 2, AVB.cap, '#f4f6f8', 0.88, W - 38); }); };
const AVC = { cap: 91, green: '#0d7a3d', red: '#c8202a', blue: '#1748b8' };   // (table3: caps 84/120 of the panel, thinner border inset)
const avFaceC = (txt, w, h, bg) => { const H = 120, W = Math.round(H * w / h); return avSignTex('sgC_' + txt + '_' + W + bg, W, H, (g) => { g.fillStyle = bg; g.fillRect(0, 0, W, H); g.strokeStyle = '#f4f6f8'; g.lineWidth = 5; g.beginPath(); g.roundRect(4.5, 4.5, W - 9, H - 9, 9); g.stroke(); g.save(); g.font = `bold ${Math.round(AVC.cap / 0.716)}px Arial, Helvetica, sans-serif`; const tw = g.measureText(txt).width, k = Math.min(0.88, (W - 28) / tw); g.translate(W / 2, H / 2); g.scale(k, 1); g.fillStyle = '#f4f6f8'; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillText(txt, 0, AVC.cap / 2); g.restore(); }); };   // (the capitals exactly centred)
// ---- tabla luč (window.AVSGLOW): YOUR CAR lit. 1 the whole panel backlit (lighter glowing green, brighter letters, a green halo quad behind
//   the panel's edge); 2 only the letters lit (the panel plain green, the letters with a white-green glow baked round them); 3 a motorway
//   sign at night: three small lamps on short arms over the top edge, their lenses lit, pools of light on the face. All unlit (MeshBasic) or additive
const avFaceL = (txt, w, h, mode) => { const H = 120, W = Math.round(H * w / h); return avSignTex('sgL' + mode + '_' + txt + '_' + W, W, H, (g) => {
  if (mode === 1) { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#1fae60'); gr.addColorStop(0.5, '#2bc672'); gr.addColorStop(1, '#1fae60'); g.fillStyle = gr; } else g.fillStyle = mode === 2 ? '#0b6e37' : '#0d7a3d'; g.fillRect(0, 0, W, H);
  if (mode === 3) [0.17, 0.5, 0.83].forEach(fx => { const gr = g.createRadialGradient(fx * W, -14, 4, fx * W, -14, H * 1.25); gr.addColorStop(0, 'rgba(215,255,228,1)'); gr.addColorStop(0.45, 'rgba(125,230,165,0.58)'); gr.addColorStop(1, 'rgba(13,122,61,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); });
  g.strokeStyle = mode === 2 ? '#d5dde3' : '#ffffff'; g.lineWidth = 5; g.beginPath(); g.roundRect(4.5, 4.5, W - 9, H - 9, 9); g.stroke();
  g.save(); g.font = `bold ${Math.round(AVC.cap / 0.716)}px Arial, Helvetica, sans-serif`; const tw = g.measureText(txt).width, k = Math.min(0.88, (W - 28) / tw); g.translate(W / 2, H / 2); g.scale(k, 1); g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  if (mode !== 3) { g.shadowColor = mode === 2 ? 'rgba(170,255,200,0.9)' : 'rgba(255,255,255,0.85)'; g.shadowBlur = 10; g.fillStyle = '#ffffff'; g.fillText(txt, 0, AVC.cap / 2); g.shadowBlur = 0; }   // (the glow round the letters)
  g.fillStyle = '#ffffff'; g.fillText(txt, 0, AVC.cap / 2); g.restore(); }); };   // (the letters themselves crisp on top)
const avSignLit = (F, acc2, fc, K, w, h, xc, y0, mode, GS, BK) => { fc.material.map = avFaceL(K.t, w, h, mode); fc.material.needsUpdate = true;
  if (mode === 1) { const m = 0.05, W2 = Math.round(256 * (w + 2 * m) / (h + 2 * m)), tex = avSignTex('sgHalo_' + W2, W2, 256, (g, W, H) => { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); const px = W / (w + 2 * m);
      g.shadowColor = '#2ee07a'; g.shadowBlur = 0.03 * px; g.fillStyle = '#1c9a52'; g.beginPath(); g.roundRect(m * px, m * px, w * px, h * px, 0.01 * px); g.fill(); g.fill(); });
    const q = new T.Mesh(new T.PlaneGeometry(w + 2 * m, h + 2 * m), new T.MeshBasicMaterial({ map: tex, blending: T.AdditiveBlending, transparent: true, depthWrite: false })); q.position.set(xc, y0 + h / 2, -0.0095); q.renderOrder = 2; F.add(q); }   // (the green halo round the panel)
  if (mode === 3) { const LENS = new T.MeshBasicMaterial({ color: 0xfff4d6 }); [-0.15, 0, 0.15].forEach(dx => { const x = xc + dx, yt = y0 + h;   // (three lamps: a short arm up from the back of the top edge and forward, a dark housing, its lit lens toward the face and the camera)
      acc2.box(GS, x - 0.002, x + 0.002, yt - 0.004, yt + 0.014, -0.008, -0.004); acc2.box(GS, x - 0.002, x + 0.002, yt + 0.010, yt + 0.014, -0.008, 0.018);
      acc2.add(BK, new T.BoxGeometry(0.03, 0.011, 0.016), new T.Matrix4().compose(V(x, yt + 0.012, 0.022), new T.Quaternion().setFromEuler(new T.Euler(0.55, 0, 0)), V(1, 1, 1)));
      acc2.add(LENS, new T.BoxGeometry(0.026, 0.008, 0.003), new T.Matrix4().compose(V(x, yt + 0.0085, 0.0295), new T.Quaternion().setFromEuler(new T.Euler(0.55, 0, 0)), V(1, 1, 1)));   /* (the lens on the housing's front, toward the face and the camera) */ }); } };
const avSignB = (P, M, kind, V) => { const S = new T.Group(); S.position.z = AVSG.z; P.add(S); const acc = pdAcc(), GS = PR.mat(0x9aa2ac, { shininess: 70, specular: 0x777777 }), BK = PR.mat(0x2a2d33, { shininess: 30 }), out = { S, face: null, face2: null, box: null };
  const post = (x, h, r = 0.007, z = -0.012) => { acc.cyl(GS, r, h, x, h / 2, z, 'y', 10); acc.box(GS, x - r * 1.6, x + r * 1.6, 0, 0.004, z - r * 1.6, z + r * 1.6); };
  const bracket = (x, y, z = -0.012) => { acc.box(GS, x - 0.012, x + 0.012, y - 0.006, y + 0.006, z, z + 0.008); acc.cyl(GS, 0.0028, 0.006, x - 0.006, y, z + 0.0105, 'z', 6); acc.cyl(GS, 0.0028, 0.006, x + 0.006, y, z + 0.0105, 'z', 6); };
  const panel = (txt, w, h, xc, y0, z, bg) => { acc.box(BK, xc - w / 2, xc + w / 2, y0, y0 + h, z - 0.006, z); const f = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: bg ? avFaceC(txt, w, h, bg) : avFaceB(txt, w, h) })); f.position.set(xc, y0 + h / 2, z + 0.0005); f.userData.cap = (bg ? AVC.cap : AVB.cap) / 120; S.add(f); return f; };
  if (V === 'C') {   // table3 (the user's pick, A refined): YOUR CAR green; RENT A CAR blue + a red 'ONE RACE 450€' plate stacked above it, FOR SALE blue + a red '4280€' plate; each plate's right edge on its main sign's right edge, on the main sign's right post
    const K = { 1: { t: 'YOUR CAR', bg: AVC.green, xc: -0.07, y0: 0.07, h: 0.096, w: 0.44 }, 2: { t: 'RENT A CAR', bg: AVC.blue, xc: 0, y0: 0.0595, h: 0.072, w: 0.46, p: '450€', ph: 0.072, pw: 0.171, gap: 0.0025 },   // (the plate's top is held by the yellow pool's lowest point right above it: 0.072 m is the most that fits)   // (between the yellow pool and the model's wing: two plates of 0.063 m)
                3: { t: 'FOR SALE', bg: AVC.blue, xc: 0.29, y0: 0.05, h: 0.096, w: 0.46, p: '4280€', ph: 0.095, pw: 0.26 } }[kind];
    const xa = K.xc - 0.16, xb = K.xc + 0.16; let topB = K.y0 + K.h - 0.008;
    if (kind === 1) { const F = new T.Group(); S.add(F); const acc2 = pdAcc(), y0 = K.y0, h = K.h, w = K.w, xc = K.xc;   // (table4: YOUR CAR square-on to the first-view camera: the panel leans back on its two short posts)
      acc2.box(BK, xc - w / 2, xc + w / 2, y0, y0 + h, -0.008, -0.002); const fc = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: avFaceC(K.t, w, h, K.bg) })); fc.position.set(xc, y0 + h / 2, -0.0015); fc.userData.cap = AVC.cap / 120; F.add(fc); out.face = fc;
      [xa, xb].forEach(x => { acc2.box(GS, x - 0.012, x + 0.012, y0 + 0.008, y0 + 0.02, -0.012, -0.004); acc2.box(GS, x - 0.005, x + 0.005, y0 + 0.02, y0 + h - 0.012, -0.012, -0.008); post(x, y0 + 0.016); });   // (a clamp at the bottom, a flat bar up the back)
      const SGL = typeof window !== 'undefined' && window.AVSGLOW; if (SGL) avSignLit(F, acc2, fc, K, w, h, xc, y0, SGL, GS, BK);   // (tabla luč: YOUR CAR lit)
      acc.flush(S).forEach(m => { m.castShadow = true; m.receiveShadow = true; }); acc2.flush(F).forEach(m => { m.castShadow = true; m.receiveShadow = true; }); F.userData.avAim = { bb: true, pv: [xc, y0, -0.005], h }; out.box = [w, h, y0, xc];
      S.traverse(q => { if (q.isMesh) q.userData.pdKeep = true; }); return out; }
    if (K.p) { const py = K.y0 + K.h + (K.gap || 0.005), pxc = K.xc + K.w / 2 - K.pw / 2; out.face2 = panel(K.p, K.pw, K.ph, pxc, py, -0.002, AVC.red); topB = py + K.ph - 0.01; bracket(xb, py + Math.min(0.018, K.ph * 0.3)); bracket(xb, py + K.ph - Math.min(0.018, K.ph * 0.3)); }
    post(xa, K.y0 + K.h - 0.008); post(xb, topB); out.face = panel(K.t, K.w, K.h, K.xc, K.y0, -0.002, K.bg); [xa, xb].forEach(x => { bracket(x, K.y0 + Math.min(0.02, K.h * 0.28)); bracket(x, K.y0 + K.h - Math.min(0.02, K.h * 0.28)); }); out.box = [K.w, K.h, K.y0, K.xc];
    S.userData.avAim = { px: K.xc, z0: AVSG.z, arc: kind === 3 };   // (turned about its own centre by avAim: RENT A CAR square to the screen; FOR SALE parallel to the chest's back edge (angle from avTop))
    acc.flush(S).forEach(m => { m.castShadow = true; m.receiveShadow = true; }); S.traverse(q => { if (q.isMesh) q.userData.pdKeep = true; }); return out; }
  const L = { 1: { t: 'YOUR CAR', xc: -0.07, y0: 0.07 }, 2: { t: 'BORROWED', xc: 0, y0: 0.066, p: 'RENT 450€', pw: 0.26, ph: 0.078, px: -0.19, side: -1, dyB: 0.05 },
              3: { t: 'FOR SALE', xc: 0.29, y0: 0.05, p: '4280€', pw: 0.27, ph: 0.11, px: 0.425, side: 1, dyB: 0.06 } }[kind];
  const w = AVB.w, h = AVB.h, xa = L.xc - 0.16, xb = L.xc + 0.16; let topA = L.y0 + h - 0.008, topB = topA;
  if (L.p && V === 'A') { const py = L.y0 + h + 0.006; out.face2 = panel(L.p, L.pw, L.ph, L.px, py, -0.002); if (L.side < 0) topA = py + L.ph - 0.01; else topB = py + L.ph - 0.01;
    const xs = L.side < 0 ? xa : xb; bracket(xs, py + 0.018); bracket(xs, py + L.ph - 0.018); }
  if (L.p && V === 'B') { const z = -0.07, py = L.y0 + h + 0.006 - L.dyB, xp = L.px + L.side * (L.pw / 2 + 0.006); out.face2 = panel(L.p, L.pw, L.ph, L.px, py, z - 0.002);
    post(xp, py + L.ph + 0.004, 0.0045, z - 0.012); acc.box(GS, Math.min(xp, L.px + L.side * L.pw / 2) - 0.004, Math.max(xp, L.px + L.side * L.pw / 2) + 0.004, py + L.ph - 0.016, py + L.ph - 0.006, z - 0.014, z - 0.004);
    acc.box(GS, Math.min(xp, L.px + L.side * L.pw / 2) - 0.004, Math.max(xp, L.px + L.side * L.pw / 2) + 0.004, py + 0.006, py + 0.016, z - 0.014, z - 0.004); }   // (two short arms from the pole to the panel's edge)
  post(xa, topA); post(xb, topB); out.face = panel(L.t, w, h, L.xc, L.y0, -0.002); [xa, xb].forEach(x => { bracket(x, L.y0 + 0.02); bracket(x, L.y0 + h - 0.02); }); out.box = [w, h, L.y0, L.xc];
  acc.flush(S).forEach(m => { m.castShadow = true; m.receiveShadow = true; }); S.traverse(q => { if (q.isMesh) q.userData.pdKeep = true; }); return out; };
const avSign = (P, M, kind) => { const S = new T.Group(); S.position.z = AVSG.z; P.add(S); const acc = pdAcc(), GS = PR.mat(0x9aa2ac, { shininess: 70, specular: 0x777777 }), BK = PR.mat(0x2a2d33, { shininess: 30 }), out = { S, face: null, box: null };
  const post = (x, h, r = 0.007) => { acc.cyl(GS, r, h, x, h / 2, -0.012, 'y', 10); acc.box(GS, x - r * 1.6, x + r * 1.6, 0, 0.004, -0.012 - r * 1.6, -0.012 + r * 1.6); };   // (a galvanised post on its foot plate)
  const bracket = (x, y) => { acc.box(GS, x - 0.012, x + 0.012, y - 0.006, y + 0.006, -0.012, -0.004); acc.cyl(GS, 0.0028, 0.006, x - 0.006, y, -0.0015, 'z', 6); acc.cyl(GS, 0.0028, 0.006, x + 0.006, y, -0.0015, 'z', 6); };   // (a clamp with two bolts)
  let face;
  if (kind === 1) { const w = 0.44, h = 0.088, y0 = 0.07; post(-0.15, y0 + h - 0.008); post(0.15, y0 + h - 0.008); acc.box(BK, -w / 2, w / 2, y0, y0 + h, -0.008, -0.002);
    [-0.15, 0.15].forEach(x => { bracket(x, y0 + 0.02); bracket(x, y0 + h - 0.02); }); face = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: avFaceBlue() })); face.position.set(0, y0 + h / 2, -0.0015); out.box = [w, h, y0]; }
  else if (kind === 2) { const w = 0.46, h = 0.094, y0 = 0.066, tip = w * 64 / 512; post(-0.08, y0 + h - 0.008, 0.008);
    const sh = new T.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2 - tip, 0); sh.lineTo(w / 2, h / 2); sh.lineTo(w / 2 - tip, h); sh.lineTo(-w / 2, h); sh.closePath(); acc.add(BK, new T.ExtrudeGeometry(sh, { depth: 0.006, bevelEnabled: false }), new T.Matrix4().makeTranslation(0, y0, -0.008));
    [y0 + 0.02, y0 + h - 0.02].forEach(y => bracket(-0.08, y)); const fg = new T.ShapeGeometry(sh); const uv = fg.attributes.uv, pa = fg.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, (pa.getX(i) + w / 2) / w, pa.getY(i) / h);
    face = new T.Mesh(fg, new T.MeshBasicMaterial({ map: avFaceGreen() })); face.position.set(0, y0, -0.0015); out.box = [w, h, y0]; }
  else { const h = 0.088, w = h * AVVMS.cw / AVVMS.ch, y0 = 0.05, xc = 0.295, span = w + 0.05, top = y0 + h + 0.01;   // (a portal: two posts, a light lattice beam over the box, the box (the message) between them; shifted right, into the empty place)
    post(xc - span / 2, top, 0.009); post(xc + span / 2, top, 0.009); acc.box(GS, xc - span / 2 - 0.01, xc + span / 2 + 0.01, top - 0.004, top + 0.006, -0.03, 0.006);
    for (let i = 0; i <= 12; i++) { const x = xc - span / 2 + span * i / 12; acc.box(GS, x - 0.002, x + 0.002, top - 0.004, top + 0.006, -0.03, 0.006); }
    acc.box(BK, xc - w / 2 - 0.008, xc + w / 2 + 0.008, y0 - 0.008, y0 + h + 0.008, -0.04, -0.002); [xc - w / 2 - 0.008, xc + w / 2 + 0.008].forEach(x => bracket(x + (x < xc ? -0.01 : 0.01), y0 + h / 2));   // (the box, its clamps to the posts)
    face = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: avFaceVMS() })); face.position.set(xc, y0 + h / 2, -0.0015); out.box = [w, h, y0, xc]; }
  acc.flush(S).forEach(m => { m.castShadow = true; m.receiveShadow = true; }); S.add(face); out.face = face;
  S.traverse(q => { if (q.isMesh) q.userData.pdKeep = true; }); return out; };
// ---- the parts on the top: a model on its turntable (STREET, SPORT) or under its dome (RACE, locked); the service button (AMA v1) ----
const avAim = (root) => { const cam = G3.camera; cam.updateMatrixWorld(true); const c = new T.Vector3().setFromMatrixPosition(cam.matrixWorld), nw = new T.Vector3(0, 0, 1).applyQuaternion(cam.getWorldQuaternion(new T.Quaternion())); nw.y = 0; nw.normalize(); root.updateMatrixWorld(true); const n = [];   // (table3: signs and the padlock turned about the vertical so they face the first-view camera square-on)
  root.traverse(o => { if (o.userData.avAim) n.push(o); }); n.forEach(o => { const a = o.userData.avAim, cl = o.parent.worldToLocal(c.clone());
    const p0 = o.parent.worldToLocal(o.getWorldPosition(new T.Vector3())), nl = o.parent.worldToLocal(o.getWorldPosition(new T.Vector3()).add(nw)).sub(p0);   // (the camera's backward direction in the parent's frame: the panel parallel to the screen's horizontal)
    if (a.lock) { o.rotation.order = 'YXZ'; o.rotation.set(a.tilt, Math.atan2(nl.x, nl.z), 0); return; }
    if (a.bb) { const md = (typeof window !== 'undefined' && window.AVSANG) || 'bb', camQ = cam.getWorldQuaternion(new T.Quaternion()); let qw = camQ;   // (YOUR CAR's angle: 'bb' parallel to the screen (today), 'eye' facing the camera's eye exactly, or a number: tilted back that many degrees, turned like the screen)
      if (md === 'eye') { const pw = o.parent.localToWorld(new T.Vector3(a.pv[0], a.pv[1] + (a.h || 0.1) / 2, a.pv[2])), up = new T.Vector3(0, 1, 0).applyQuaternion(camQ); qw = new T.Quaternion().setFromRotationMatrix(new T.Matrix4().lookAt(c, pw, up)); }
      else if (typeof md === 'number') { const bk = new T.Vector3(0, 0, 1).applyQuaternion(camQ); qw = new T.Quaternion().setFromEuler(new T.Euler(-md * Math.PI / 180, Math.atan2(bk.x, bk.z), 0, 'YXZ')); }
      const qp = o.parent.getWorldQuaternion(new T.Quaternion()).invert(), q = qp.multiply(qw); o.quaternion.copy(q); const pv = new T.Vector3(...a.pv); o.position.copy(pv.clone().sub(pv.clone().applyQuaternion(q))); a.phi = 2 * Math.acos(Math.min(1, Math.abs(q.w))); return; }
    const phi = a.fix != null ? a.fix : Math.atan2(nl.x, nl.z); o.rotation.set(0, phi, 0); o.position.set(a.px - a.px * Math.cos(phi), 0, a.z0 + a.px * Math.sin(phi)); a.phi = phi; });
  root.updateMatrixWorld(true); return n.map(o => +(((o.userData.avAim.phi != null ? o.userData.avAim.phi : o.rotation.y) * 180 / Math.PI).toFixed(1))); };
const avSrvCentre = () => { const A = window.AVSRV; if (!A) return null; const cam = G3.camera; A.G.updateMatrixWorld(true); cam.updateMatrixWorld(true);
  const sx = (w) => w.project(cam).x, bw = A.part.localToWorld(new T.Vector3(0, 0.03, 0)), X = sx(bw.clone());   // (the button's middle on screen)
  let lo = A.Lb.u0, hi = A.Lb.u1; const at = (x) => sx(A.G.localToWorld(new T.Vector3(x, A.y, A.zm(x))));
  const inc = at(hi) > at(lo); for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if ((at(mid) < X) === inc) lo = mid; else hi = mid; }
  const xs = (lo + hi) / 2, uv = (xs - A.Lb.u0) / (A.Lb.u1 - A.Lb.u0), map = A.Lb.mat.map; map.offset.x = 0.5 - uv; map.needsUpdate = true; return { uvAtButton: +uv.toFixed(3), shift: +(0.5 - uv).toFixed(3) }; };
// ---- krog luč (window.AVGLOW 1 green, 2 white, 3 green light under the rim): YOUR CAR's turntable lit from inside = the car in the garage now.
//   Cheap: unlit (MeshBasic) surfaces + one additive spill decal on the chest top + the model's lowest 3 cm given a little emissive in its
//   own shader (no real light). v1/v2: a frosted glowing disc top (radial gradient), the kit ring a bright glow ring; v3: the disc stays
//   grey, a light band in the base under the rim and a wider spill, meant to breathe (opacity 0.55 -> 1 -> 0.55, 2.4 s, sine; shown at peak)
const AVGL = { 1: { top: ['#e9fff1', '#a9efc4', '#d9ffe8', '#5ff09a'], ring: 0x5dff9a, spill: '#2ee07a', sk: 0.9, sw: 0.075, glow: 0x2ee07a, gk: 0.32 },
               2: { top: ['#ffffff', '#dfe6ee', '#f6f9ff', '#ffffff'], ring: 0xffffff, spill: '#c9d6e6', sk: 0.75, sw: 0.075, glow: 0xdfe8f4, gk: 0.3 },
               3: { band: 0x5dff9a, spill: '#2ee07a', sk: 1.0, sw: 0.1, glow: 0x2ee07a, gk: 0.36 } };
const avGlowTex = (key, draw) => avSignTex(key, 256, 256, (g, W) => draw(g, W / 2));
const avGlow = (P, M, ln, TR, h0, k) => { const C = AVGL[k], add = { blending: T.AdditiveBlending, transparent: true, depthWrite: false };
  if (C.top) { const tex = avGlowTex('glTop' + k, (g, c) => { const gr = g.createRadialGradient(c, c, 0, c, c, c); gr.addColorStop(0, C.top[0]); gr.addColorStop(0.55, C.top[1]); gr.addColorStop(0.88, C.top[2]); gr.addColorStop(1, C.top[3]); g.fillStyle = gr; g.fillRect(0, 0, 2 * c, 2 * c);
      g.strokeStyle = 'rgba(255,255,255,0.10)'; g.lineWidth = 2; for (let r = 0.18; r < 0.95; r += 0.16) { g.beginPath(); g.arc(c, c, r * c, 0, Math.PI * 2); g.stroke(); } });   // (frosted diffuser: faint concentric rings)
    const d = new T.Mesh(new T.CircleGeometry(TR - 0.014, 48), new T.MeshBasicMaterial({ map: tex })); d.rotation.x = -Math.PI / 2; d.position.y = h0 + 0.0004; P.add(d); d.userData.pdKeep = true;
    ln.material = new T.MeshBasicMaterial({ color: C.ring }); }
  if (C.band) { const b = new T.Mesh(new T.CylinderGeometry(TR + 0.0035, TR + 0.0062, 0.011, 64, 1, true), new T.MeshBasicMaterial({ color: C.band })); b.position.y = 0.0075; P.add(b); b.userData.pdKeep = true; }   // (the light band in the base, under the disc's rim)
  const r1 = TR + C.sw, ri = (TR + 0.002) / r1, sp = avGlowTex('glSp' + k, (g, c) => { const gr = g.createRadialGradient(c, c, 0, c, c, c), col = new T.Color(C.spill), q = (a) => `rgb(${Math.round(col.r * 255 * a)},${Math.round(col.g * 255 * a)},${Math.round(col.b * 255 * a)})`;
    gr.addColorStop(0, '#000'); gr.addColorStop(Math.max(0, ri - 0.02), '#000'); gr.addColorStop(ri, q(C.sk)); gr.addColorStop(ri + (1 - ri) * 0.3, q(C.sk * 0.45)); gr.addColorStop(1, '#000'); g.fillStyle = gr; g.fillRect(0, 0, 2 * c, 2 * c); });
  const s = new T.Mesh(new T.RingGeometry(TR + 0.002, r1, 64, 1), new T.MeshBasicMaterial(Object.assign({ map: sp }, add))); s.rotation.x = -Math.PI / 2; s.position.y = 0.0014; s.renderOrder = 2; P.add(s); s.userData.pdKeep = true;   // (the glow spilling onto the chest's top round the base)
  return C; };
const avGlowModel = (m, C) => { const mt = m.material.clone(), col = new T.Color(C.glow).multiplyScalar(C.gk); mt.customProgramCacheKey = () => 'avglow';   // (the model's lowest 3 cm lit from below: emissive fading with height, in its own shader)
  mt.onBeforeCompile = (sh) => { sh.uniforms.uGlow = { value: col }; sh.vertexShader = 'varying float vGlowH;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vGlowH = position.y;');
    sh.fragmentShader = 'uniform vec3 uGlow;\nvarying float vGlowH;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += uGlow * (1.0 - smoothstep(0.0, 0.03, vGlowH));'); };
  m.material = mt; };
const avPart = (g, M, key, kind, v, lockIt) => { const P = new T.Group(); g.add(P); const model = [];
  if (key === 'srv') { const r = amPart(P, M, 'srv', 'srv', 1); P.traverse(q => { if (q.isMesh) { q.userData.pdKeep = true; model.push(q); } }); return { obj: P, top: r.top, model }; }   // (the button lights up on its own silhouette too)
  const lv = AVL[v].m[kind - 1], [kk] = lv.kit; let h0, md, m;
  const TR = AVF.tr; amCyl(P, M.RUB, TR, TR + 0.005, 0.016, 0); amCyl(P, PR.mat(0x40464f, { shininess: 60, specular: 0x444444 }), TR - 0.014, TR - 0.014, 0.01, 0.016); h0 = 0.026;   // (the turntable; a ring in the kit's colour; ONE pose for all three models)
  const ln = new T.Mesh(new T.TorusGeometry(TR - 0.011, 0.006, 6, 64), amEmi(kk, 0.95)); ln.rotation.x = Math.PI / 2; ln.position.y = h0 - 0.002; P.add(ln);
  md = avModel(lv, kind, AVF.sc); m = new T.Mesh(md.geo, amMat('carpaint')); m.position.y = h0; m.rotation.y = AMF.yaw;
  const GL = typeof window !== 'undefined' && window.AVGLOW && kind === 1 ? avGlow(P, M, ln, TR, h0, window.AVGLOW) : null; if (GL) avGlowModel(m, GL);   // (krog luč: YOUR CAR's turntable lit from inside)
  const sg = (typeof window !== 'undefined' && window.AVSV) ? avSignB(P, M, kind, window.AVSV) : avSign(P, M, kind); sg.S.traverse(q => { if (q.isMesh) model.push(q); }); P.userData.sign = sg;
  if (lockIt && typeof window !== 'undefined' && window.AVSV === 'C') { const lk = avLock(P, M, 0.06), yaw = AMF.yaw, dx = 0.02, dz = (Math.cos(yaw) >= 0 ? 1 : -1) * 0.088;   // (table3: on the disc in front of the model's door (the side toward the camera), turned to the camera by avAim)
    lk.position.set(dx * Math.cos(yaw) + dz * Math.sin(yaw), h0 - 0.002, -dx * Math.sin(yaw) + dz * Math.cos(yaw)); lk.rotation.order = 'YXZ'; lk.rotation.set(-0.12, 0, 0); lk.userData.avAim = { lock: true, tilt: -0.12 };
    lk.traverse(q => { if (q.isMesh) { q.userData.pdKeep = true; model.push(q); } }); }
  else if (lockIt) { const lk = avLock(P, M, 0.07); const la = -0.87; lk.position.set(Math.sin(la) * (TR + 0.012), 0.0, Math.cos(la) * (TR + 0.012)); lk.rotation.set(-0.2, -0.25, 0);   // (locked: only the padlock, on the turntable's front-left rim (50 deg off the front) so it no longer covers the 'RACE · LOCKED' label, facing the camera)
    lk.traverse(q => { if (q.isMesh) { q.userData.pdKeep = true; model.push(q); } }); }
  m.castShadow = true; m.receiveShadow = true; m.userData.pdKeep = true; P.add(m); model.unshift(m);
  P.traverse(q => { if (q.isMesh && q !== m) { q.castShadow = !(q.material && (q.material.transparent || q.material.type === 'MeshBasicMaterial')); q.receiveShadow = true; } });
  return { obj: P, top: P.userData.top || h0 + md.h, model, sign: P.userData.sign }; };
// ---- the top: AMA's cells (5 across), the 4th EMPTY (the bare top, a plain band), the models and the button ----
const avTop = (F, M, L, Z, els, v) => { const A = L.A, K = pnK(L.wc, L.R, 0), G = new T.Group(); G.position.set(K.O[0], 0, K.O[1]); F.add(G); F.updateMatrixWorld(true); const sh = new T.Group(); G.add(sh);
  const y = A.H + 0.0008, rB = L.rB + 0.004, rF = L.R + PNL.over - 0.002, bEnd = PNL.bE - 0.002, n = Z.top.length, xa = 1.5, xb = 410.5, cx = (j) => xa + (xb - xa) * j / n;
  const zB = (x) => pnZr(K, x, rB), zF = (x) => pnZr(K, x, rF), zR = (x, r) => pnZr(K, x, r);
  const seam = (j, zfn) => { if (j <= 0 || j >= n) { const b = j <= 0 ? -bEnd : bEnd; let x = 0; for (let i = 0; i < 5; i++) { const z = zfn(x); x = (z + L.R) * Math.tan(b); } return x; }
    let x = pnUX(K, cx(j), y, zfn(0)); for (let i = 0; i < 5; i++) x = pnUX(K, cx(j), y, zfn(x)); return x; };
  const bandB = rF - 0.06, bandF = rF - 0.008, tagR = rF - 0.084, tagD = 0.032;
  const labs = []; let j0 = 0; Z.bands.forEach(([nm, cnt]) => { const ja = j0, jb = j0 + cnt, zm = (x) => zR(x, (bandB + bandF) / 2), u0 = seam(ja, zm), u1 = seam(jb, zm);
    const v0 = ja === 0 ? pnUX(K, 2, y, zm(u0)) : u0, v1 = jb === n ? pnUX(K, 410, y, zm(u1)) : u1;
    const mat = new T.MeshBasicMaterial({ map: hNameTex(nm || ' ', (v1 - v0) / (bandF - bandB), { H: 64, font: 46, pad: 6, line: 7 }) }); mat.map.wrapS = mat.map.wrapT = T.ClampToEdgeWrapping;
    for (let j = ja; j < jb; j++) labs[j] = { u0: v0, u1: v1, mat, nm }; j0 = jb; });
  const band = (g, j) => { const Lb = labs[j], zA = (x) => zR(x, bandB), zC = (x) => zR(x, bandF), bx0 = seam(j, (x) => zR(x, (bandB + bandF) / 2)), bx1 = seam(j + 1, (x) => zR(x, (bandB + bandF) / 2));
    const b = new T.Mesh(pnGeo(8, 1, (s, t) => { const x = pnLerp(bx0, bx1, s), z = t <= 0 ? zA(x) : zC(x); return [V(x, y + 0.0012, z), V(0, 1, 0), [(x - Lb.u0) / (Lb.u1 - Lb.u0), 1 - t]]; }), Lb.mat); b.userData.pdPlate = true; g.add(b); Lb.mesh = b; return Lb; };
  Z.top.forEach((it, j) => { const g = new T.Group(); G.add(g);
    if (!it) { band(g, j); return; }   // (GT PACK's place: empty; only the band along the edge)
    const [key, kind] = it, [en, nm] = PDEL[key][kind], lockIt = key === 'aero' && kind === Z.lock;
    const Q = [], xl0 = seam(j, zB), xr0 = seam(j + 1, zB), xl1 = seam(j, zF), xr1 = seam(j + 1, zF), NQ = 16;
    for (let i = 0; i <= NQ; i++) { const x = xl0 + (xr0 - xl0) * i / NQ; Q.push([x, zB(x)]); }
    for (let i = 1; i < 4; i++) { const t = i / 4, z = zB(xr0) + (zF(xr1) - zB(xr0)) * t; Q.push([j + 1 >= n ? (z + L.R) * Math.tan(bEnd) : pnUX(K, cx(j + 1), y, z), z]); }
    for (let i = 0; i <= NQ; i++) { const x = xr1 + (xl1 - xr1) * i / NQ; Q.push([x, zF(x)]); }
    for (let i = 1; i < 4; i++) { const t = i / 4, z = zF(xl1) + (zB(xl0) - zF(xl1)) * t; Q.push([j <= 0 ? -(z + L.R) * Math.tan(bEnd) : pnUX(K, cx(j), y, z), z]); }
    const tile = pdFlat(g, Q, y, M.TOP2); tile.userData.pdTint = true;
    const rI = L.R + PNL.over - (key === 'aero' ? AVF.rItem : AMF.rItem[key]), zIt = (x) => zR(x, rI), cl = Math.max(cx(j), 1), cr = Math.min(cx(j + 1), 411); let xm = pnUX(K, (cl + cr) / 2, y, zIt(0)); for (let i = 0; i < 4; i++) xm = pnUX(K, (cl + cr) / 2, y, zIt(xm));
    const th = -Math.atan(pnDz(K, xm)), stand = new T.Group(); stand.position.set(xm, y, zIt(xm)); stand.rotation.y = th; g.add(stand);
    const pt = avPart(stand, M, key, kind, v, lockIt), shs = key === 'aero' ? AVF.shadow : AMF.shadow[key];
    { const sA = pt.sign && pt.sign.S.userData.avAim; if (sA && sA.arc) { const xs = xm + sA.px * Math.cos(th) + sA.z0 * Math.sin(th), e = 0.002, sl = (zR(xs + e, rB) - zR(xs - e, rB)) / (2 * e); sA.fix = -Math.atan(sl) - th; } }   // (table4: FOR SALE parallel to the top's back edge right behind it)
    pdSoft(sh, xm, zIt(xm) + 0.01, y + 0.0006, shs[0], shs[1], 0.42).rotation.z = th;
    const zt = (x) => zR(x, tagR), ta = Math.max(xl1, pnUX(K, cl + 4, y, zt(xm))), tb = Math.min(xr1, pnUX(K, cr - 4, y, zt(xm))), tw = Math.min(0.3, 0.8 * (tb - ta)), tx = (ta + tb) / 2;
    const tag = pdTag(g, lockIt ? en + ' · LOCKED' : en, tw, tagD, tx, y, zt(tx), { font: 72 }); tag.rotation.y = -Math.atan(pnDz(K, tx));
    const Lb = band(g, j); const C4 = typeof window !== 'undefined' && window.AVSV === 'C';
    if (C4 && key === 'srv') { tag.visible = false; window.AVSRV = { G, Lb, y, zm: (x) => zR(x, (bandB + bandF) / 2), part: pt.obj, xm, zc: zIt(xm) }; }   // (table4: the service keeps ONE label (the band's), centred under the button by avSrvCentre)
    pdMergeGroup(g); g.traverse(m => { if (m.isMesh && m.material !== M.TOP2 && !m.userData.pdPlate && m.material !== Lb.mat && !(m.material && (m.material.transparent || m.material.type === 'MeshBasicMaterial'))) m.castShadow = true; });
    els.push({ key, kind, en, nm, grp: PDGRP[key], cab: cx(j) + cx(j + 1) < 412 ? 'L' : 'R', place: 'top', row: -1, col: j, cell: [cx(j), cx(j + 1)], g, part: pt.obj, model: pt.model, sign: pt.sign, locked: lockIt, label: tag, scale: AMF.sc, top: xF(pt.top) }); });
  return { n, x: [xa, xb], y: [xF(pnS(K, 0, y, zB(0))[1], 1), xF(pnS(K, 0, y, zF(0))[1], 1)], G }; };
const AVF = { tr: 0.165, sc: 0.068, rItem: 0.275, shadow: [0.36, 0.36] };   // (the signs' round: the turntable 16.5 cm, the models 1:14.7, their middle 27.5 cm behind the top's front edge)
// ======== A VERSION: AMA's chest (PZA v1's, the nuts in a drawer) with AV's top ========
const avBuild = (S, out, v) => { const Z = AVT, s0 = PNF[4].stileX; PNF[4].stileX = PZF.stileX; let L; try { L = pnLay(4); } finally { PNF[4].stileX = s0; }
  L.cols.forEach(C => { C.rows = Z[C.side].map(pzRow); C.hold = C.side === 'L' ? -0.8 : 0.8; });
  const M = pdMats(), A = L.A, els = [], F = PR.group(); F.position.set(0, 0, 0.2); F.rotation.y = 0.3; F.updateMatrixWorld(true);
  pdHideGame(S, out); const body = new T.Group(); F.add(body); const accB = pdAcc(); pnBody(accB, M, L);
  const D = Object.assign({}, PNL.dr, { mats: { T: M.FELT, W: M.FELTW, col: PDCOL.blu } }), lay = { v, R: L.R, H: A.H, D: A.D, P: A.P, open: A.open, face: xF(L.face), wb: xF(L.wb), wc: xF(L.wc), rows: {} }, groups = [body];
  const top = avTop(F, M, L, Z, els, v); lay.top = { n: top.n, x: top.x, y: top.y }; groups.push(top.G);
  L.cols.forEach((C) => { const K = C.K; C.G = new T.Group(); C.G.position.set(K.O[0], 0, K.O[1]); C.G.rotation.y = K.a; F.add(C.G); C.sh = new T.Group(); C.G.add(C.sh); C.acc = pnAccT(accB, new T.Matrix4().makeRotationY(K.a).setPosition(K.O[0], 0, K.O[1])); groups.push(C.G);
    F.updateMatrixWorld(true); D.dd = A.D - PNL.dr.dd - (L.R - C.rF);
    const rTop = C.rF + PNL.over, occ = [{ z: (x) => pnZr(K, x, rTop), h: A.H - PNL.topT - 0.004 }];
    L.drs.forEach((d0) => { const dr = Object.assign({}, d0);
      if (dr.open < 0) { pnDrawerShut(C, M, D, dr); return; }
      dr.p = C.pulls[dr.open]; const groupsK = C.rows[dr.open], ytop = dr.t - D.under, zf = (x) => pnZr(K, x) + dr.p, zfi = (x) => zf(x) - D.fT;
      const zLo = (x) => Math.max(...occ.map(e => pnRay(K, e.z(x), e.h, ytop))), zHi = (x) => pnRay(K, zfi(x), dr.t, ytop);
      dr.x = [C.edge[0] ? 1.5 : pnSpan(K, 0, C.xo0, ytop, zLo(C.xo0), zHi(C.xo0)), C.edge[1] ? 410.5 : pnSpan(K, 1, C.xo1, ytop, zLo(C.xo1), zHi(C.xo1))];
      lay.rows[C.side + dr.open] = pnDrawer(F, C, M, D, dr.open, dr, groupsK, occ.slice(), els);
      occ.push({ z: (x) => zf(x), h: dr.b }, { z: (x) => zf(x) + D.pullD, h: dr.t - D.pullH }); }); });
  accB.flush(body, { cast: (m) => m === M.NV || m === M.TOP2 });
  F.updateMatrixWorld(true); groups.forEach(g => { if (!out.frames.includes(g)) out.frames.push(g); }); pdNanCheck(F);
  const mt = els.filter(e => e.place === 'top').map(e => ({ en: e.en, top: e.top, verts: (() => { let n = 0; e.g.traverse(q => { if (q.isMesh) n += q.geometry.attributes.position.count; }); return n; })(), model: e.model ? e.model[0].geometry.attributes.position.count : 0 })); console.error('AVTOP ' + JSON.stringify(mt));
  console.error('AVLIFT ' + JSON.stringify({ patched: AV.lf, type: typeof PBL !== 'undefined' ? PBL.type : null }));
  out.drawers = []; out.aeroDr = null; out.xc = { opt: 'av_' + v, groups: [], extra: [] }; out.s6 = { L: lay, els, F, cabs: { L: body, R: new T.Group() }, names: [] }; return out; };
const avFronts = (S, out, o = {}) => { if (AV.v >= 1 && AV.v <= 6) { pdHideGift(S); return avBuild(S, out, AV.v); } return amaFronts(S, out, o); };
// <<<< XC BLOCKS
// the cabinets' fronts and the row of drawers: the old drawers out of sight (the parts that stay move into the new ones, as they were in
// theirs: S.ditems' groups re-hung), each column's front closed below the row (a navy panel, the yellow line), a dark opening behind a
// drawer; out.drawers [{ key, name, dg, item, cab, cols }], out.aeroDr (aeroDrawer in its new drawer)
const vCabFronts = (S, out, o = {}) => { const M = MT(), RM = RGM(), NAVY = PR.mat(0x1b2b5c, { shininess: 40 }), OPEN = PR.lam(0x0a0f1e), Dp = 0.62;
  (S.left || []).concat(S.right || []).forEach(m => m.drs.forEach(d => { d.visible = false; }));
  const list = []; (S.GR || []).forEach((gr, gi) => gr[2].forEach(it => list.push(it[1])));
  const itemOf = (key) => { const i = list.indexOf(key); return i >= 0 ? S.ditems[i] : null; };
  const used = new Set(); VDR.forEach(([c, sp]) => { for (let i = Math.ceil(sp[0] - 0.5 + 1e-6); i <= Math.floor(sp[1] + 0.5 - 1e-6); i++) used.add(c + i); });   // (the columns a drawer's span covers)
  // (round 2) each column's front: navy from the kick up to the top, a drawer's column with its dark opening behind the drawer (VC.panelTop
  // .. VC.openTop), and the yellow line at ONE height (VC.lineY, under the top, where the first view sees it over the drawers) in every
  // column, each piece 12 mm wider than the column so the line runs on without a gap round the cabinet's slight bends
  [['L', S.left], ['R', S.right]].forEach(([c, cab]) => cab.forEach((m, i) => { const w = m.Wm + 0.012, open = used.has(c + i), top = m.H - 0.004;
    if (open) { bx(m.g, w, VC.panelTop - VC.kick, 0.008, 0, (VC.kick + VC.panelTop) / 2, Dp / 2 + 0.004, NAVY); bx(m.g, m.Wm - 0.012, VC.openTop - VC.panelTop, 0.004, 0, (VC.panelTop + VC.openTop) / 2, Dp / 2 + 0.002, OPEN);
      bx(m.g, w, top - VC.openTop, 0.008, 0, (VC.openTop + top) / 2, Dp / 2 + 0.004, NAVY); }
    else bx(m.g, w, top - VC.kick, 0.008, 0, (VC.kick + top) / 2, Dp / 2 + 0.004, NAVY);
    bx(m.g, w, VC.line, 0.012, 0, VC.lineY, Dp / 2 + 0.009, RM.YEL); }));
  out.drawers = []; out.aeroDr = null;
  VDR.forEach(([c, sp, key, name, dx]) => { const cab = c === 'L' ? S.left : S.right, fc = (sp[0] + sp[1]) / 2, one = Math.abs(fc - Math.round(fc)) < 1e-6 && sp[1] - sp[0] === 1, m = cab[Math.round(fc)] || cab[0], wide = !one;
    const fr = wide ? vColFrame(cab, fc) : null, par = wide ? fr : m.g, w = (sp[1] - sp[0]) * m.Wm - 0.014, y = VC.y, cols = [sp[0], sp[1]];
    const dg = vDrawer(par, M, w, dx || 0, y, Dp / 2 - 0.2 + VC.out); let item = null;
    if (key === 'aero') { out.aeroDr = aeroDrawer(S, o.aero || {}, dg, dg.userData.inner - 0.004); item = out.aeroDr && out.aeroDr.g; }
    else if (key === 'sigShow' || key === 'decalShow') { item = (key === 'sigShow' ? vSigShow : vDecalShow)(dg); const old = itemOf(key === 'sigShow' ? 'sig' : 'decal'); if (old) old.visible = false; }   // (round 2: the kinds on show; the game's small part stays hidden in its old drawer)
    else { item = itemOf(key); if (item) { if (item.parent) item.parent.remove(item); dg.add(item); item.position.set(0, -0.03, 0.02); item.visible = true; if (wide && key === 'decal') item.scale.setScalar(Math.min(1.0, w / 0.42)); } }   // (the game's rule for a drawer's small part: min(1, its width / 0.42))
    if (wide) out.frames.push(fr); dg.updateMatrixWorld(true); out.drawers.push({ key, name, dg, item, cab: c, cols }); });
  return out; };
const frontRegal = (S, o = {}) => { zLowerCab(S); (S.parts || []).forEach(p => { p.visible = false; });
  (S.ditems || []).forEach((d, i) => { if (i === 4 || i === 5) d.visible = false; d.traverse(c => { if (c.userData && (c.userData.kind === 'lights' || c.userData.kind === 'tail')) c.visible = false; }); });
  FR.top = S.left[1].H + 0.035;
  const M = MT(), RM = RGM(), DKT = zDecal(0x0e0f12), PAL = zDecal(0xd9dee6), out = { frames: [] };
  (S.left || []).concat(S.right || []).forEach(m => out.frames.push(m.g));
  const LR = riserOf(S.left, 1, 1), RR = riserOf(S.right, 1, 2); out.LR = LR; out.RR = RR; out.frames.push(LR.g, RR.g);
  // V1: THE LIGHTS CABINET'S TOP (the left cabinet): the headlamps (front lights) on its left part, A PAIR A KIND (two lamps, no longer four:
  // the top holds the tail lamps too), the tail lamps (rear lights) on its right part, ONE LAMP A KIND, lit red (vTailTop); both five rows
  // deep, kind ki in row ki as the headlamps were (the stock kinds, Serijski / Serijske, in the front row: on the car, their places empty);
  // a steel bar between the two parts. An empty place: a pale cradle; the picture's row (o.lampHl): a yellow tab on the rim at the row's
  // end, its empty places outlined
  const LK = Object.keys(LAMP_KINDS), lf = o.lamps || ON_CAR(LK), ln = o.lampN || {}, has = (ki, j) => !!lf[ki] && (ln[ki] || [0, 1]).includes(j), lHl = o.lampHl;
  const TZ = [LROW(4) - 0.09, LROW(0) + 0.04];
  zFlat(LR.g, 0.84, TZ[1] - TZ[0], 0, (TZ[0] + TZ[1]) / 2, DKT); zRim(LR.g, 0.84, TZ[1] - TZ[0], 0, (TZ[0] + TZ[1]) / 2, M.ST);
  bx(LR.g, 0.014, 0.012, TZ[1] - TZ[0], VC.div, 0.006, (TZ[0] + TZ[1]) / 2, M.ST);   // (V1: the bar between the headlamps and the tail lamps)
  const lamp = (ki, j) => LR.at(VC.hx[j], 0.088 - FR.sink, LROW(ki)), qLamp = LR.q.clone().multiply(qAx('y', -Math.PI / 2));
  for (let ki = 0; ki < 5; ki++) { for (let j = 0; j < 2; j++) if (!has(ki, j)) { zFlat(LR.g, 0.17, 0.1, VC.hx[j], LROW(ki) - 0.025, PAL, 0.002); zFlat(LR.g, 0.12, 0.028, VC.hx[j], LROW(ki) - 0.025, DKT, 0.003);
      if (ki === lHl) zOutline(LR.g, 0.19, 0.115, VC.hx[j], LROW(ki) - 0.025); }
    if (ki === lHl) bx(LR.g, 0.03, 0.016, 0.1, -0.42 - 0.012, 0.008, LROW(ki) - 0.025, RM.YEL); }
  if (lHl === 0) bx(LR.g, VC.div + 0.42, 0.01, 0.016, (VC.div - 0.42) / 2, 0.005, LROW(0) + 0.045, RM.YEL);   // (the front row: its yellow bar along the tray's front, the headlamps' part)
  lf.forEach((k, ki) => { if (k) for (let j = 0; j < 2; j++) if (has(ki, j)) zPlace(lampPart(k), lamp(ki, j), qLamp); });
  out.lamp = lamp; out.qLamp = qLamp; out.lampTop = (ki, j) => lamp(ki, j).add(V(0, 0.088, 0));
  { const k0 = ZCOL ? ZCOL.length : 0; out.luci = vTailTop(LR, o.luci || {}, { M, RM, DKT, PAL }); out.luci.parts = ZCOL ? ZCOL.slice(k0) : []; }   // (V1: the tail lamps)
  // the brake discs: a slotted well sunk into the top, eight slots 5.1 cm apart (2.6 cm between two discs' top edges: the gripper's
  // fingers), kind ki in slots 2ki, 2ki + 1 (the stock pair at the front), faces (and hats) to the camera; a disc's top 19 cm over the top
  const dxc = (DCX[0] + DCX[1]) / 2, gxc = (GBX[0] + GBX[1]) / 2, bzc = (BZ[0] + BZ[1]) / 2, bzd = BZ[1] - BZ[0], dHl = o.discHl;
  zFlat(RR.g, DCX[1] - DCX[0], bzd, dxc, bzc, DKT); zRim(RR.g, DCX[1] - DCX[0], bzd, dxc, bzc, M.ST);
  const VDZ = (ki, j) => { const s = [0, null, 1, 2][ki]; return s == null ? DZK(2 * ki + j) : DZK(0) + (2 * s + j) * (DZK(7) - DZK(0)) / 5; };   // (V1 round 2: the sport discs gone, the three kinds left spread evenly over the well: six slots 7.2 cm apart, no dark gap)
  const disc = (ki, j) => RR.at(dxc, 0.19 - 0.17, VDZ(ki, j)), qDisc = RR.q.clone();
  const dfill = (o.discs || ON_CAR(DISC_KINDS)).map((k, ki) => (ki === VC.noDisc ? null : k)), dHas = (ki, j) => !!dfill[ki] && !(o.discN && o.discN[ki] != null && j >= o.discN[ki]);   // (V1: the sport discs ('Športne ploščice', ki 1) are on the upper shelf now: their two slots stay dark, no place)
  for (let ki = 0; ki < 4; ki++) { for (let j = 0; j < 2; j++) if (!dHas(ki, j) && ki !== VC.noDisc) zFlat(RR.g, 0.3, 0.018, dxc, VDZ(ki, j), PAL, 0.003);
    if (ki === dHl) { const zc = (VDZ(ki, 0) + VDZ(ki, 1)) / 2; bx(RR.g, 0.03, 0.016, 0.1, DCX[0] - 0.012, 0.008, zc, RM.YEL); zOutline(RR.g, 0.33, 0.1, dxc, zc); } }
  dfill.forEach((k, ki) => { if (k) for (let j = 0; j < 2; j++) if (dHas(ki, j)) zPlace(discPart(k), disc(ki, j), qDisc); });
  out.disc = disc; out.qDisc = qDisc; out.discTop = (ki, j) => disc(ki, j).add(V(0, 0.17, 0));
  // the grilles: a slotted well beside the discs' (six slots 7.2 cm apart), kind ki in slot ki (the stock one at the front), standing on
  // their long edge, their faces to the camera, sunk: their upper 18 cm show
  const gHl = o.grilleHl; zFlat(RR.g, GBX[1] - GBX[0], bzd, gxc, bzc, DKT); zRim(RR.g, GBX[1] - GBX[0], bzd, gxc, bzc, M.ST);
  const grille = (ki) => RR.at(gxc, 0.18 - 0.165, GZK(ki)), qGr = RR.q.clone().multiply(qAx('y', -Math.PI / 2)), gfill = o.grilles || ON_CAR(GRILLE_KINDS);
  for (let ki = 0; ki < 6; ki++) { if (!gfill[ki]) zFlat(RR.g, 0.7, 0.018, gxc, GZK(ki), PAL, 0.003);
    if (ki === gHl) { bx(RR.g, 0.03, 0.016, 0.07, GBX[1] + 0.012, 0.008, GZK(ki), RM.YEL); zOutline(RR.g, 0.73, 0.06, gxc, GZK(ki)); } }
  gfill.forEach((k, ki) => { if (k) zPlace(grillePart(k), grille(ki), qGr); });
  out.grille = grille; out.qGr = qGr; out.grilleTop = (ki) => grille(ki).add(V(0, 0.165, 0));
  // the calipers: a row of five lying along the front edge in a dark strip (21 cm apart), the stock one at the left
  const cHl = o.calHl, qCal = RR.q.clone().multiply(new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(V(0, 0, 1), V(1, 0, 0), V(0, 1, 0))));
  zFlat(RR.g, 0.94, 0.1, 0, CALZ, DKT);
  const cal = (ki) => RR.at(CALX(ki), 0.036, CALZ), cfill = o.cals || ON_CAR(Object.keys(CAL_COLS));
  for (let ki = 0; ki < 5; ki++) { if (!cfill[ki]) zFlat(RR.g, 0.17, 0.1, CALX(ki), CALZ, PAL, 0.002); if (ki === cHl) zOutline(RR.g, 0.19, 0.11, CALX(ki), CALZ); }
  cfill.forEach((k, ki) => { if (k) zPlace(caliperPart(k), cal(ki), qCal); });
  out.cal = cal; out.qCal = qCal; out.calTop = (ki) => cal(ki).add(V(0, 0.035, 0));
  avFronts(S, out, o);   // (AV: version 1 of round AV (AMA's chest top: car-painted models with liveries, the red push button, GT PACK gone, RACE locked under a dome; lift design 1 from LF's patch) instead of AMA's version 2; the daily gift hidden (AV block above, inside XC BLOCKS; AV.v 0: AMA's version 2 as before))
  return out; };
// ---- all the places (o: each one's fill and yellow mark: { luci: { fill, n, hl }, mali: { lamps, lampN, lampHl, discs, discN, discHl,
//      grilles, grilleHl, cals, calHl } }); W the windows; the parts put in their places are listed (ZPARTS) for the
//      reach test. BASE T: no bonnets', boot lids', strips' or aero places on the regal any more; the aero drawer and its model are st.aeroDr
//      (= st.mali.aeroDr). BASE T v2: no glass either (no st.steklo, no o.steklo: the proposals' trolley holds the panes); bay 4's tyre set
//      is st.regal.tyres[4] (its kind in userData.kind, its radius in userData.r), its rims st.regal.rims' entries with si 4. BASE T v3: no
//      doors either (no st.vrata, no o.vrata: the proposals' trolley holds them) ----
let ZS = null, ZPARTS = [];
// (the picture's scene for storesAll called without it, as the template's eTap / eCard do (before: () => storesAll(...)): the scene's build
// (SBASE) ends with S.gift = …; that first assignment of 'gift' on an object goes through this setter, which keeps the scene as ZS)
if (!Object.getOwnPropertyDescriptor(Object.prototype, 'gift')) Object.defineProperty(Object.prototype, 'gift', { configurable: true, set(v) { Object.defineProperty(this, 'gift', { value: v, writable: true, configurable: true, enumerable: true }); if (this && this.segs) ZS = this; } });
const storesAll = (W, o = {}, S = ZS) => { if (!S._room2) { S._room2 = true; zRoom2(S); } ZCOL = []; const r = regalAll(S, W, o), k1 = ZCOL.length, m = frontRegal(S, Object.assign({}, o.mali || {}, { luci: o.luci || {} })); m.parts = ZCOL.slice(k1); ZPARTS = ZCOL; ZCOL = null; r.luci = m.luci;   // (V1: the tail lamps on the left cabinet's top: o.luci { fill, hl } as before)
  return { regal: r, mali: m, luci: m.luci, aeroDr: m.aeroDr }; };
// a place out of the picture with its parts (only when it hides the work)
const zHide = (...sts) => sts.forEach(st => { if (!st) return; if (st.g) st.g.visible = false; (st.parts || []).forEach(g => g.visible = false); });
// ---- BASE T: THE PICTURES' HELPERS (shared by the proposals). THE MEASURE (h's, concepts/_z2h_body.js): an ID pass (each item a flat colour, everything else black: it hides what is
//      behind it; see-through things, sprites and lines out of the pass), then each item alone (its own outline). Per item: its visible
//      pixels, their box, the biggest rectangle wholly inside them (its place), the share of its own outline that shows ----
const ztPass = (only, items, own) => { const R = G3.renderer, sc = G3.scene, cam = G3.camera, sz = R.getDrawingBufferSize(new T.Vector2()), w = sz.x, h = sz.y;
  const saved = [], BLK = new T.MeshBasicMaterial({ color: 0x000000, fog: false, side: T.DoubleSide }); BLK.toneMapped = false;
  const IDM = items.map((_, k) => { const m = new T.MeshBasicMaterial({ color: new T.Color((k + 1) * 8 / 255, 1, 0), fog: false, side: T.DoubleSide }); m.toneMapped = false; return m; });
  sc.traverse(o => { if (!(o.isMesh || o.isSprite || o.isLine || o.isPoints)) return; saved.push([o, o.material, o.visible]); if (!o.visible) return;
    const k = own.get(o), mats = Array.isArray(o.material) ? o.material : [o.material], m0 = mats[0];
    if (o.isSprite || o.isLine || o.isPoints || !m0 || m0.visible === false || m0.colorWrite === false || (m0.transparent && m0.opacity < 0.5 && k == null) || m0.depthTest === false || (m0.blending && m0.blending !== T.NormalBlending)) { o.visible = false; return; }
    if (only != null && k !== only) { o.visible = false; return; }
    const M = k != null ? IDM[k] : BLK; o.material = Array.isArray(o.material) ? o.material.map(() => M) : M; });
  const rt = new T.WebGLRenderTarget(w, h), oc = R.getClearColor(new T.Color()), oa = R.getClearAlpha(), ost = R.shadowMap.autoUpdate; R.shadowMap.autoUpdate = false;
  R.setRenderTarget(rt); R.setClearColor(0x000000, 1); R.clear(); R.render(sc, cam); const px = new Uint8Array(w * h * 4); R.readRenderTargetPixels(rt, 0, 0, w, h, px); R.setRenderTarget(null); R.setClearColor(oc, oa); R.shadowMap.autoUpdate = ost; rt.dispose();
  saved.forEach(([o, m, v]) => { o.material = m; o.visible = v; });
  const id = new Int16Array(w * h).fill(-1); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = ((h - 1 - y) * w + x) * 4; if (px[i + 1] > 200) { const k = Math.round(px[i] / 8) - 1; if (k >= 0 && k < items.length) id[y * w + x] = k; } }
  return { id, w, h }; };
const ztMaxRect = (mask, x0, y0, x1, y1) => { const H = new Int32Array(x1 - x0 + 1); let best = { a: 0, w: 0, h: 0, x: 0, y: 0 };
  for (let y = y0; y <= y1; y++) { for (let x = x0; x <= x1; x++) H[x - x0] = mask(x, y) ? H[x - x0] + 1 : 0;
    const st = []; for (let i = 0; i <= x1 - x0 + 1; i++) { const hh = i <= x1 - x0 ? H[i] : 0; let s = i; while (st.length && st[st.length - 1][1] >= hh) { const [si, sh] = st.pop(); const a = sh * (i - si); if (a > best.a) best = { a, w: i - si, h: sh, x: x0 + si, y: y - sh + 1 }; s = si; } st.push([s, hh]); } }
  return best; };
const ztMeasure = (items) => { G3.scene.updateMatrixWorld(true); const own = new Map(); items.forEach((it, k) => it.objs.forEach(o => o && o.traverse(m => { if (m.isMesh) own.set(m, k); })));
  const all = ztPass(null, items, own), out = [], cvs = G3.renderer.domElement.getBoundingClientRect(), s = cvs.width / all.w;
  items.forEach((it, k) => { const solo = ztPass(k, items, own), w = all.w, h = all.h; let n = 0, ns = 0, bx0 = w, by0 = h, bx1 = -1, by1 = -1; const cover = {};
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (solo.id[i] === k) { ns++; if (all.id[i] !== k && all.id[i] >= 0) cover[items[all.id[i]].name] = (cover[items[all.id[i]].name] || 0) + 1; }
      if (all.id[i] === k) { n++; bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); by0 = Math.min(by0, y); by1 = Math.max(by1, y); } }
    const r = n ? ztMaxRect((x, y) => all.id[y * w + x] === k, bx0, by0, bx1, by1) : { w: 0, h: 0, x: 0, y: 0 };
    const cols = [], rows = []; if (n) { for (let x = bx0; x <= bx1; x++) { let c = 0; for (let y = by0; y <= by1; y++) if (all.id[y * w + x] === k) c++; if (c) cols.push(c); }
      for (let y = by0; y <= by1; y++) { let c = 0; for (let x = bx0; x <= bx1; x++) if (all.id[y * w + x] === k) c++; if (c) rows.push(c); } }
    const med = (a) => a.length ? a.slice().sort((p, q) => p - q)[a.length >> 1] : 0;
    let mid = null; if (n) { const cx = Math.round(r.x + r.w / 2), cy = Math.round(r.y + r.h / 2); let a = cy, b = cy; while (a > 0 && all.id[(a - 1) * w + cx] === k) a--; while (b < h - 1 && all.id[(b + 1) * w + cx] === k) b++;
      mid = [cvs.left + (cx + 0.5) * s, cvs.top + ((a + b) / 2 + 0.5) * s, b - a + 1]; }
    out.push({ name: it.name, px: n, own: ns, share: ns ? Math.round(100 * n / ns) : 0, box: n ? [bx0, by0, bx1 - bx0 + 1, by1 - by0 + 1] : null, core: [r.w, r.h], band: [med(rows), med(cols)], at: [cvs.left + (r.x + r.w / 2) * s, cvs.top + (r.y + r.h / 2) * s], mid, cover }); });
  return out; };
const ztFmt = (L) => L.map(q => `${q.name.padEnd(30)} pas ${String(q.band ? q.band[0] + '×' + q.band[1] : '-').padEnd(7)} vidno ${String(q.box ? q.box[2] + '×' + q.box[3] : '-').padEnd(8)} največji pravokotnik ${(q.core[0] + '×' + q.core[1]).padEnd(7)} ${String(q.px).padStart(5)} px, ${String(q.share).padStart(3)} % obrisa  pri (${q.box ? q.box[0] + ',' + q.box[1] : '-'})  ${Object.keys(q.cover).length ? 'zakriva: ' + Object.entries(q.cover).map(([a, b]) => a + ' ' + b + ' px').join(', ') : ''}`).join('\n');
// ---- THE TAP's mark (the user's rule): the tapped thing light turquoise at once, a yellow rim round it; the name labels keep their names ----
const ztTurq = (o) => { const C = LIGHTC(); o.traverse(m => { if (!m.isMesh || !m.visible || Array.isArray(m.material) || (m.material && m.material.map)) return;
  const c = m.material && m.material.color, lum = c ? c.r + c.g + c.b : 1;
  m.material = new T.MeshLambertMaterial({ color: C.clone().multiplyScalar(lum > 2.4 ? 1.12 : lum < 0.4 ? 0.62 : 0.95), emissive: C.clone().multiplyScalar(0.42), side: T.DoubleSide }); }); };
// the tapped part's name by the ring (a small flag: navy, the yellow rim, a short line to the ring); side: where it stands from the ring
const ztFlag = (x, y, txt, side = 'left', dy = 0) => { const w = Math.round(txt.length * 8.6 + 18);
  if (side === 'above') { div(`left:${x - 1}px;top:${y - 12 - dy}px;width:2px;height:${dy}px;background:#ffd23f;z-index:69`);
    return div(`left:${Math.round(x - w / 2)}px;top:${y - 12 - dy - 24}px;width:${w}px;box-sizing:border-box;text-align:center;background:rgba(13,22,38,.94);color:#fff;border:2px solid #ffd23f;border-radius:8px;padding:2px 6px;font-weight:900;font-size:12.5px;letter-spacing:.3px;white-space:nowrap;z-index:69`, txt); }
  const L = side === 'left', fx = L ? x - 22 - w : x + 22, fy = y - 12 + dy;
  div(`left:${L ? x - 22 : x + 12}px;top:${y - 1 + dy / 2}px;width:10px;height:2px;background:#ffd23f;z-index:69`);
  return div(`left:${fx}px;top:${fy}px;width:${w}px;box-sizing:border-box;text-align:center;background:rgba(13,22,38,.94);color:#fff;border:2px solid #ffd23f;border-radius:8px;padding:2px 6px;font-weight:900;font-size:12.5px;letter-spacing:.3px;white-space:nowrap;z-index:69`, txt); };
// ---- the cameras (ztLook: the camera exactly at p; ztLookE: h's hLookE, pushed out by the phone's fit, as h's cameras were tuned) (h's hLookE: hLook brings a camera closer by the phone's fit), a picture of the
//      scene from another camera (an inset), a hint line at the top ----
// (the game's camera (garage3d.js placeCamera) puts the camera rig.dist × fit away, fit from the RENDERER's aspect: ztLook gives it the distance
// divided by that same fit, so the camera stands exactly at p, also in an inset's picture of another shape (ztShot))
const ztFit = (fov) => { const sz = G3.renderer.getSize(new T.Vector2()), th = Math.tan(fov * Math.PI / 360); return Math.max(1, 3.5 / (th * sz.x / sz.y) / 9.2); };
const ztLook = (p, t, fov) => { const d = [p[0] - t[0], p[1] - t[1], p[2] - t[2]], hh = Math.hypot(d[0], d[2]), fit = ztFit(fov);
  PR.cam(Math.atan2(d[0], d[2]), Math.atan2(d[1], hh), Math.hypot(hh, d[1]) / fit, t[0], t[1], t[2], fov); };
const ztLookE = (pe, t, fov) => { const fit = ztFit(fov); ztLook(t.map((v, k) => v + (pe[k] - v) * fit), t, fov); };   // (h's hLookE: the camera pushed out by the fit, as h's cameras were tuned)
const ztShot = (camFn, w, h) => { const c = G3.renderer.domElement, pw = innerWidth, ph = innerHeight; Garage3D.resize(w, h, 1); camFn(); PR.render(); PR.render(0.05); const url = c.toDataURL('image/png'); Garage3D.resize(pw, ph, 1); return url; };
const ztHint = (t) => div(`left:50%;top:78px;transform:translateX(-50%);background:rgba(9,15,30,.88);color:#9fdcff;font-weight:800;font-size:13px;padding:6px 14px;border-radius:10px;z-index:61;white-space:nowrap`, t);
// ---------------- the arms ----------------
// the bridge's turn that brings it over two places at once (its line through the ring's middle as near both as it can be)
const thOver = (a, b) => { let best = 0, bd = 9; for (let d = 0; d < 180; d += 1) { const th = d * Math.PI / 180, s = Math.sin(th), c = Math.cos(th), m = Math.max(Math.abs(a.x * s - a.z * c), Math.abs(b.x * s - b.z * c)); if (m < bd) { bd = m; best = th; } } return best; };
const tAlong = (th, p) => Math.max(-3.25, Math.min(3.25, p.x * Math.cos(th) + p.z * Math.sin(th)));
// an arm with its tool's tip at p, pointing along dir (toward the part); tool: 'gripper' (prijemalo), 'wrench' (vijačnik), 'nozzle'. Each arm
// carries its number over its tool (yellow 1 = roka 1, blue 2 = roka 2: the arms look alike and pass each other on the bridge). Keep the tip
// at least ~1.2 m under the shoulder (the shoulder hangs ~3.25 m up: a tip over ~2.05 m folds the elbow down under the tool)
let ZLABELS = true;
const zArmNo = (p, k) => { const s = numSprite([p.x, p.y + 0.55, p.z], k, k === 1 ? 0xffd23f : 0x47c6ff); s.scale.setScalar(0.36); return s; };
// (the checks the harness prints under the frame: each arm on its own half of the bridge (roka 1 +, roka 2 −; zEnd gives the bridge's
// turn), and its pose as the game solves it: the tool's tip reached and the elbow over the wrist. A tool pointing down over ~2.05 m folds
// the elbow down under the wrist (that case is named too); in the top storeys the tool goes in level from the front, the arm stretched
// out, and the elbow stays up: this check proves it frame by frame)
const zArmChk = (i, q, d, t, lift = 0) => { if (i === 0 ? t < 0.15 : t > -0.15) console.warn(`ZARM roka ${i + 1} on the wrong half of the bridge (t ${t.toFixed(2)}): use th = zEnd(${i}, p)`);
  const k = zLinks(i); if (k.miss > 0.005) console.warn(`ZARM roka ${i + 1} does not reach its tool's tip (${(k.miss * 100).toFixed(0)} cm short)`);
  if (k.E.y < k.Wc.y + 0.03) console.warn(`ZARM roka ${i + 1} elbow ${k.E.y.toFixed(2)} m not over its wrist ${k.Wc.y.toFixed(2)} m (folded)`);
  if (d.y < -0.7 && q.y > 2.1 + lift) console.warn(`ZARM roka ${i + 1} tool tip ${q.y.toFixed(2)} m high pointing down (keep it at ${(2.05 + lift).toFixed(2)} m or lower)`); };
const zArm = (i, th, p, dir, tool = 'gripper') => { const d = V(...(dir.toArray ? dir.toArray() : dir)).normalize(), q = p.toArray ? p : V(...p), t = tAlong(th, q); armOnM(i, th, t, q.toArray(), d.toArray(), { tool });
  zArmChk(i, q, d, t); if (ZLABELS) zArmNo(q, i + 1); return q; };
// an arm out of the work: its tool 2.05 m over a place, pointing down (the elbow stays up)
const zArmUp = (i, th, p) => zArm(i, th, V(p.x, 2.05, p.z), V(0, -1, 0));
// THE ARMS NEVER PASS EACH OTHER: they hang from one beam, roka 1 always on its + half, roka 2 on its − half (parkArms leaves them at the two
// ends). To reach a place an arm's end of the bridge is turned toward it (the bridge turns on its rail; both halves reach the car in the
// middle, each end reaches every stand): zEnd(i, p) is the bridge's turn that puts p under arm i's half; the other arm waits on its own half
// with zRest(j, th) (its tool 2.05 m up, t from the middle). Change order: roka 1 takes the old part off and puts it in its place (the bridge's
// + end turned to the stand), then the bridge turns its − end to the stand and roka 2 takes the new part and fixes it on the car.
const zEnd = (i, p) => Math.atan2(p.z, p.x) + (i === 1 ? Math.PI : 0);
const zRest = (i, th, t = 1.4) => { const s = i === 1 ? -t : t; return zArm(i, th, V(s * Math.cos(th), 2.05, s * Math.sin(th)), V(0, -1, 0)); };
// a spark burst at a point (the wrench at work, a clip snapping)
const zSparks = (p, n = 7, s = 0.12) => { for (let i = 0; i < n; i++) { const a = i * 2.39996, r = 0.03 + (i % 3) * 0.025; PR.spr(null, V(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r * 0.8, p.z + Math.sin(a * 1.7) * r), s * (0.5 + (i % 2) * 0.4), i % 2 ? 0xffd23f : 0xffffff, 0.95, true); } };
// a turning arrow round a wrench's socket (the bolt turns: undone or done up), in yellow; at p, round the axis n
const zTurn = (p, n = V(0, 1, 0), r = 0.085) => { const g = PR.group(), M = new T.MeshBasicMaterial({ color: new T.Color(0xffd23f).multiplyScalar(1.7), depthTest: false });
  const ring = new T.Mesh(new T.TorusGeometry(r, 0.016, 6, 28, Math.PI * 1.5), M); ring.renderOrder = 15; g.add(ring); const head = new T.Mesh(new T.ConeGeometry(0.04, 0.075, 10), M); head.position.set(r, 0, 0); head.rotation.z = Math.PI; head.renderOrder = 15; g.add(head);
  g.position.copy(p); g.quaternion.setFromUnitVectors(V(0, 0, 1), V(...(n.toArray ? n.toArray() : n)).normalize()); g.updateMatrixWorld(true); return g; };
// a bolt head (a small dark hex) at p on a face with the normal n
const zBolt = (p, n = V(0, 1, 0)) => { const m = new T.Mesh(new T.CylinderGeometry(0.022, 0.022, 0.025, 6), PR.mat(0x3a3d42, { shininess: 90 })); m.position.copy(p); m.quaternion.setFromUnitVectors(V(0, 1, 0), V(...(n.toArray ? n.toArray() : n)).normalize()); PR.group().add(m); return m; };
// the credits in the header after a purchase (11.500 less the price)
const zCredits = (n) => { const e = document.getElementById('g-money'); if (e) e.textContent = Math.round(n).toLocaleString('de-DE'); };
// the lettered band out of the picture (from a camera under it, its near arc hides the bridge and the arms' carriages)
const zNoBand = (S) => { if (S && S.band && S.band.isObject3D) S.band.visible = false; };
// the frame of the work: the scene (the badges off, the wall screen away), the room without trophies and windows, every place
// ---- W: THE LIFT NOT BLUE (the user: "Dvigalka, ki dvigne avto, naj bo druge barve kot modra, saj modre so že police zadaj"): the game's
//      lift (garage3d.js buildLift: its column a piece of the room, its carriage and arms built once and posed by poseLift from LIFT.geo's
//      colours) keeps its shapes, lights, controls and its yellow-and-black floor plate; every BLUE vertex (the game's LBL, its top faces'
//      LBLt, its ribs' LBLd (the carriage's two ribs: the trim), as shaded) takes the variant's colour at the same brightness (its blue's share of LBL's); the column's cap and
//      the carriage's two ribs take the variant's trim; a band round the column under its cap (Y: black and yellow stripes, G: brushed
//      steel). Variants: Y safety yellow #F2C200 with black (the main one: it echoes the regal's yellow lines), O orange #F07A1A, R red
//      #C8202A, G graphite #3A3F47 with brushed steel; null: the game's blue. Always from the game's own colours (kept the first time) ----
const WLIFT = { Y: { nm: 'Rumena', c: 0xf2c200, rib: 0x141518, cap: 0x101114, band: 'hazard' }, O: { nm: 'Oranžna', c: 0xf07a1a, rib: 0xb4560c, cap: null, band: null },
  R: { nm: 'Rdeča', c: 0xc8202a, rib: 0x8e1219, cap: null, band: null }, G: { nm: 'Grafitna', c: 0x3a3f47, rib: 0xa9afb7, cap: null, band: 'steel' } };
let WLIFTV = 'O', WLIFTBAND = null;   // (R: the lift orange by default, the user: "Steber naj bo namesto rumene oranžne barve"; was 'Y')
const wLiftBandTex = (kind) => { const c = document.createElement('canvas'); c.width = 512; c.height = 64; const g = c.getContext('2d');
  if (kind === 'hazard') { g.fillStyle = '#f2c200'; g.fillRect(0, 0, 512, 64); g.fillStyle = '#121316'; for (let x = -64; x < 512 + 64; x += 64) { g.beginPath(); g.moveTo(x, 64); g.lineTo(x + 32, 64); g.lineTo(x + 96, 0); g.lineTo(x + 64, 0); g.closePath(); g.fill(); }
    g.fillStyle = '#121316'; g.fillRect(0, 0, 512, 4); g.fillRect(0, 60, 512, 4); }
  else { g.fillStyle = '#b9bec5'; g.fillRect(0, 0, 512, 64); for (let i = 0; i < 260; i++) { const y = (i * 37) % 64, a = 0.05 + ((i * 13) % 7) / 60; g.fillStyle = (i & 1) ? `rgba(255,255,255,${a})` : `rgba(40,44,50,${a})`; g.fillRect((i * 97) % 512, y, 60 + (i * 31) % 160, 1); }
    g.fillStyle = 'rgba(30,33,38,0.6)'; g.fillRect(0, 0, 512, 3); g.fillRect(0, 61, 512, 3); }
  const t = new T.CanvasTexture(c); t.wrapS = T.RepeatWrapping; t.anisotropy = 8; return t; };
const wLiftColour = (v = WLIFTV) => { const L = D.LIFT; if (!L || !L.piece || !L.geo) return null; const ms = []; L.piece.root.traverse(o => { if (o.isMesh && o !== L.cmesh && o !== WLIFTBAND && o.geometry.attributes.color) ms.push(o); });
  if (!L._wOrig) L._wOrig = { C: L.geo.C.slice(), cols: ms.map(o => [o, o.geometry.attributes.color.array.slice()]) };
  const O = L._wOrig, V0 = v && WLIFT[v], base = V0 && new T.Color(V0.c), rib = V0 && new T.Color(V0.rib), cap = V0 && V0.cap != null && new T.Color(V0.cap), n = { blue: 0, rib: 0, cap: 0 };
  // a colour (r, g, b) at index i of array A (from the original O): blue -> the variant's at the same brightness; the ribs (LBLd: b ~0.40 at full light) the trim
  const paint = (A, src, i, y, ribs) => { const r = src[i], g = src[i + 1], b = src[i + 2]; A[i] = r; A[i + 1] = g; A[i + 2] = b; if (!V0) return;
    if (b > 0.15 && b > 1.8 * r && b > 1.5 * g) { const ribq = ribs && Math.abs(r - 0.05) < 0.004 && Math.abs(g - 0.14) < 0.004 && Math.abs(b - 0.40) < 0.004, f = b / (ribq ? 0.40 : 0.58), C = ribq ? rib : base;
      A[i] = Math.min(1, C.r * f); A[i + 1] = Math.min(1, C.g * f); A[i + 2] = Math.min(1, C.b * f); n[ribq ? 'rib' : 'blue']++; return; }
    if (cap && y != null && y > 2.95 && Math.max(r, g, b) < 0.27 && b - r < 0.05) { const f = Math.max(r, g, b) / 0.2; A[i] = cap.r * f; A[i + 1] = cap.g * f; A[i + 2] = cap.b * f; n.cap++; } };
  O.cols.forEach(([o, src]) => { const A = o.geometry.attributes.color.array, P = o.geometry.attributes.position.array; for (let i = 0; i < A.length; i += 3) paint(A, src, i, P[i + 1], false); o.geometry.attributes.color.needsUpdate = true; });
  for (let i = 0; i < L.geo.C.length; i += 3) paint(L.geo.C, O.C, i, null, true); if (D.poseLift) D.poseLift();
  // the band round the column under its cap (its piece's root: it goes with the column)
  if (WLIFTBAND) { WLIFTBAND.parent && WLIFTBAND.parent.remove(WLIFTBAND); WLIFTBAND = null; }
  if (V0 && V0.band) { const t = wLiftBandTex(V0.band), M = new T.MeshPhongMaterial({ map: t, shininess: V0.band === 'steel' ? 90 : 40, specular: V0.band === 'steel' ? 0x888888 : 0x333333 });
    const m = new T.Mesh(new T.BoxGeometry(0.368, 0.11, 0.238), M); m.position.set(L.x, 2.86, L.z); m.castShadow = m.receiveShadow = true; m.userData.wBand = true; L.piece.root.add(m); WLIFTBAND = m;
    t.repeat.set(1, 1); }
  return { v: v || 'modra', n }; };
const ZBASE = (o = {}) => { const S = SBASEX(), W = winPolysP(); ZS = S; const st = storesAll(W, o, S); pbLiftOff(); st.lift = wLiftColour(o.lift !== undefined ? o.lift : WLIFTV); st.liftPB = PBL.on ? pbLift(o.lift !== undefined ? o.lift : WLIFTV) : null; return { S, W, st }; };   // (W: the lift's colour; PB: the game's lift back first (pbLiftOff), then its new graphics (pbLift, PBL))
// (for eTap / eCard, which build the scene themselves: their before(S))
const ZBEFORE = (o = {}) => (S) => { ZS = S; return storesAll(winPolysP(), o, S); };
// ---- an arm with its carriage where the picture wants it (o.t: along the bridge, as zArm's checks: roka 1 on the + half, roka 2 on the −
//      half) and the fingers' way (o.up: the gripper's jaws close across it): a reach out over the ring's edge, the jaws over and under a
//      panel's edge ----
const armOnT = (i, th, t, tip, dir, o = {}) => armOnM(i, th, t, tip, dir, o);
const zArmT = (i, th, p, dir, tool = 'gripper', o = {}) => { const d = V(...(dir.toArray ? dir.toArray() : dir)).normalize(), q = p.toArray ? p : V(...p), t = o.t != null ? o.t : tAlong(th, q);
  armOnT(i, th, t, q.toArray(), d.toArray(), { tool, up: o.up, lift: o.lift }); if (o.check !== false) zArmChk(i, q, d, t, o.lift || 0);
  if (ZLABELS && o.label !== false) zArmNo(q, i + 1); return q; };
// ---- THE TELESCOPIC MAST (storey F: the user's "naredi še 1 nadstropje višje za haube in aero"): each arm hangs from the bridge on a slim
//      trolley and a vertical telescopic mast of five stages; normally the mast is out (0.68 m: the arm where it always was, its shoulder
//      3.24 m up); drawn in, it lifts the whole arm by up to 0.5 m (its shoulder 3.74 m up): a level tool then reaches storey F and the
//      spoilers on the top. The robot's own floor carriage and pedestal (its part 0) are out of the picture: the trolley and the mast are
//      drawn instead (zMasts, once the picture's arms are posed); its cable chain stays along the bridge. lift: how far the arm is up ----
const MAST = { max: 0.5, top: 0.722, tr: 0.09, y1: RNG.Y - 0.06 };   // (the trolley from y1 (4.44) to 4.53, right under the beam's plate; the mast from y1 down)
// (THE REACH'S MARGIN, as the reach test finds it: F's near edges, E's strips and the spoilers lie 3.24–3.38 m from the ring's middle, right
// under the rail (3.3 m): the arm takes them nearly straight (98–100 % of its length), the bridge turned 63–92° away from the bay, the
// spoilers with the mast drawn in all of its 0.5 m. So in the game: the carriages run in toward the bridge's middle before the bridge turns
// past the regal (an arm near the bridge's end, t > ~2.9, does not pass over bays 0–4 at F's height), and only then out to the place)
const bridgePoseM = (i, th, t, lift = 0) => { const r = bridgePose(i, th, t); if (lift) { r.position.y += lift; r.updateMatrixWorld(true); } return r; };
const armOnM = (i, th, t, tip, dir, o = {}) => { const lift = Math.min(MAST.max, o.lift || 0), r = bridgePoseM(i, th, t, lift), s = r.worldToLocal(V(...tip)), q = r.getWorldQuaternion(new T.Quaternion()).invert(), sd = V(...dir).applyQuaternion(q);
  const P = ['keep', 'keep']; P[i] = { x: 0, tip: s, dir: sd, tool: o.tool || 'gripper' }; if (o.up) P[i].up = V(...(o.up.toArray ? o.up.toArray() : o.up)).applyQuaternion(q); D.robotsPose({ robots: P }); };
const liftOf = (i) => { const R = ROOTS().find(q => q.i === i); return R ? Math.max(0, R.p.root.position.y - (RNG.Y - 0.02)) : 0; };
// (the robot's part 0 (its floor carriage, the pedestal, the beacon) folded to a point in the turret's top; its chain's links where they
// are with the mast out (the root lifted by lift: the links lift back down))
const zPedOut = (i, lift) => { const A = D.RB[i], R = A.R; if (!R || !R.mesh) return; const G = R.mesh.geometry.attributes.position, pa = G.array, P = R.P, zo = D.RAILS[i].z, x = A.J.x;
  R.runs.forEach(([v0, v1, k]) => { if (k === 0) { for (let v = v0 * 3; v < v1 * 3; v += 3) { pa[v] = x; pa[v + 1] = MAST.top - 0.01; pa[v + 2] = zo; } }
    else if (k >= 8) { const e = R.M[k].elements; for (let v = v0 * 3; v < v1 * 3; v += 3) { const X = P[v], Y = P[v + 1], Z = P[v + 2];
      pa[v] = e[0] * X + e[4] * Y + e[8] * Z + e[12]; pa[v + 1] = e[1] * X + e[5] * Y + e[9] * Z + e[13] + lift; pa[v + 2] = e[2] * X + e[6] * Y + e[10] * Z + e[14]; } } });
  G.updateRange.offset = 0; G.updateRange.count = -1; G.needsUpdate = true; R.mesh.geometry.boundingBox = null; };
// the trolleys and the masts of both arms as they stand (call it once the picture's arms are posed, before the render): the trolley under the
// bridge's beam (navy, a yellow line along its sides, four rollers up on the beam), the four stages (white, the inner ones steel, a navy
// collar at each one's lower end, a ring of light on the outer one) down to a navy flange on the turret's top: drawn in, the stages stand
// short one in the other
const zMasts = () => { const NV = PR.mat(0x1b2b5c, { shininess: 40 }), WH = PR.mat(0xf2f2ee, { shininess: 80 }), ST = PR.mat(0xc3c8cf, { shininess: 120, specular: 0x999999 }), YL = PR.mat(0xf2c230, { shininess: 30 }),
    BK = PR.mat(0x17181c, { shininess: 30 }), CY = new T.MeshBasicMaterial({ color: new T.Color(0x47c6ff).multiplyScalar(1.7) }), out = [];
  ROOTS().forEach(({ p, i }) => { const r = p.root; if (!r.visible) return; r.updateMatrixWorld(true); const A = D.RB[i], zo = D.RAILS[i].z, x = A.J.x, lift = Math.max(0, r.position.y - (RNG.Y - 0.02));
    zPedOut(i, lift); const top = r.localToWorld(V(x, MAST.top, zo)), ax = r.localToWorld(V(x + 1, MAST.top, zo)).sub(top).setY(0).normalize(), th = Math.atan2(ax.z, ax.x);
    const g = PR.group(); g.position.set(top.x, 0, top.z); g.rotation.y = -th; const y1 = MAST.y1, y0 = top.y, L = Math.max(0.02, y1 - y0);
    zbx(g, 0.64, MAST.tr, 0.46, 0, y1 + MAST.tr / 2, 0, NV); for (const s of [-1, 1]) { zbx(g, 0.645, 0.022, 0.012, 0, y1 + MAST.tr / 2, s * 0.232, YL); zbx(g, 0.012, 0.06, 0.465, s * 0.322, y1 + MAST.tr / 2, 0, BK);
      zbx(g, 0.5, 0.09, 0.02, 0, y1 + MAST.tr + 0.04, s * 0.19, NV); }   // (its cheeks up beside the beam)
    const R4 = [0.17, 0.148, 0.126, 0.104, 0.082], n = 5;
    for (let k = 0; k < n; k++) { const a = y1 - k * L / n + (k ? 0.012 : 0), b = y1 - (k + 1) * L / n; zcy(g, R4[k], R4[k], a - b, 0, (a + b) / 2, 0, k ? ST : WH, 'y', 24);
      if (k < n - 1) zcy(g, R4[k] + 0.012, R4[k] + 0.012, Math.min(0.03, L / n * 0.6), 0, b + Math.min(0.03, L / n * 0.6) / 2, 0, NV, 'y', 24); }
    zcy(g, R4[0] + 0.004, R4[0] + 0.004, 0.018, 0, y1 - Math.min(0.05, L / n * 0.4), 0, CY, 'y', 24); zcy(g, 0.24, 0.26, 0.04, 0, y0 + 0.02, 0, NV, 'y', 28);
    g.updateMatrixWorld(true); out.push({ i, g, lift, top }); });
  return out; };
// ---- the arm's links as the game builds them (garage3d.js linksOf: [from, to, radius] in the world) and what they come into: the regal's
//      boards, uprights and parts (each mesh's own box). zLinks(i): the links of arm i as it stands; zPen(links, meshes): the worst way a
//      link goes into a mesh (its radius less its distance; > 0: into it) ----
const CBZ_ = 0.37, FLG_ = 0.155;
const zLinks = (i) => { const A = D.RB[i], J = A.J, R = ROOTS().find(q => q.i === i).p.root; R.updateMatrixWorld(true); const w = (v) => R.localToWorld(v.clone()), L = [];
  const add = (n, a, b, r) => L.push({ n, a: w(a), b: w(b), r });
  add('nadlaket', J.S, J.E, 0.21); add('motorja za komolcem', J.E.clone().addScaledVector(J.f, -0.52), J.E, 0.195); add('podlaket', J.E, J.Wc, 0.15);
  add('zapestje (boben)', J.Wc.clone().addScaledVector(J.a5, -0.105), J.Wc.clone().addScaledVector(J.a5, 0.105), 0.13); add('zapestje', J.Wc, J.Wc.clone().addScaledVector(J.d, FLG_), 0.115);
  add('rama (boben)', J.S.clone().addScaledVector(J.ax, -0.305), J.S.clone().addScaledVector(J.ax, 0.305), 0.26); add('komolec (boben)', J.E.clone().addScaledVector(J.ax, -0.22), J.E.clone().addScaledVector(J.ax, 0.22), 0.21);
  add('protiutež', J.B.clone().addScaledVector(J.hd, -0.38).addScaledVector(J.ax, -CBZ_).setY(1.0), J.S.clone().addScaledVector(J.u, 0.74).addScaledVector(J.ax, -CBZ_), 0.085);
  // the gripper's body and its fingers' root (its 'shaft': short of the fingers that close on the part)
  const fz = V().crossVectors(J.ac, J.d), e3 = J.Wc.clone().addScaledVector(J.d, FLG_), at = (x, y, z) => e3.clone().addScaledVector(J.ac, x).addScaledVector(J.d, y).addScaledVector(fz, z);
  if (ZTOOL[i]) ZTOOL[i](at).forEach(([n, a, b, r]) => add('orodje: ' + n, a, b, r));   // (T1: the arm's own tool (its links named 'orodje: ...'): the four-edge gripper, the suction cup)
  else { add('prijemalo (telo)', at(0, 0.02, 0), at(0, 0.1, 0), 0.066); add('prijemalo (koren prstov)', at(-0.11, 0.158, 0), at(0.11, 0.158, 0), 0.068); }
  return { L, E: w(J.E), Wc: w(J.Wc), S: w(J.S), miss: J.miss }; };
// the meshes under the given objects (their own boxes), but not those under the skipped ones (the part in the gripper, its stand)
const zMeshes = (roots, skip = []) => { const out = []; roots.forEach(r => r && r.traverse(m => { if (!m.isMesh || !m.geometry || !m.visible) return; let q = m; while (q) { if (skip.includes(q) || !q.visible) return; q = q.parent; } out.push(m); })); return out; };
const zPen = (links, meshes) => { const inv = new T.Matrix4(), p = V(), lp = V(), c = V(); let worst = { pen: -9 };
  meshes.forEach(m => { if (!m.geometry.boundingBox) m.geometry.computeBoundingBox(); const bb = m.geometry.boundingBox; m.updateMatrixWorld(true); inv.copy(m.matrixWorld).invert();
    const wb = new T.Box3().copy(bb).applyMatrix4(m.matrixWorld);
    links.forEach(l => { const lb = new T.Box3().setFromPoints([l.a, l.b]).expandByScalar(l.r + 0.01); if (!lb.intersectsBox(wb)) return; const n = Math.max(2, Math.ceil(l.a.distanceTo(l.b) / 0.01));
      for (let k = 0; k <= n; k++) { p.lerpVectors(l.a, l.b, k / n); lp.copy(p).applyMatrix4(inv); c.copy(lp).clamp(bb.min, bb.max).applyMatrix4(m.matrixWorld); const pen = l.r - p.distanceTo(c);
        if (pen > worst.pen) worst = { pen, link: l.n, mesh: m }; } }); });
  return worst; };
// ---- what an arm may not come into (each mesh's own box, see-through planes left out): the regal with its end section, the front regal,
//      every part in its place, the car; o.skip: the part in the gripper and its own place ----
const zObs = (st, skip = []) => { const car = G3.cur.v && (G3.cur.v.grp || G3.cur.v.body), roots = [st.regal.par].concat(st.mali.frames).concat(ZPARTS).concat(car ? [car] : []);
  return zMeshes(roots, skip).filter(m => !(m.geometry.type === 'PlaneGeometry' && m.material && (m.material.transparent || m.material.isMeshBasicMaterial))).map(m => { if (!m.geometry.boundingBox) m.geometry.computeBoundingBox(); m.updateMatrixWorld(true);
    return { m, bb: m.geometry.boundingBox, inv: new T.Matrix4().copy(m.matrixWorld).invert(), wb: new T.Box3().copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld) }; }); };
// the lift's column behind the car (a piece of the room, not in zObs): the box the game itself keeps for it (garage3d.js buildLift: P.boxIn,
// the column with its power unit and controls, up to 3.1 m; the base plate and the stowed arms lie low), an obstacle for an arm that comes
// in from the side over the car's back
let ZLIFTM = null;
const zLiftObs = () => { if (!ZLIFTM) { ZLIFTM = new T.Mesh(new T.BoxGeometry(0.54, 3.1, 0.48)); ZLIFTM.position.set(0.03, 1.55, -1.80); ZLIFTM.updateMatrixWorld(true); ZLIFTM.geometry.computeBoundingBox(); }
  const m = ZLIFTM; return [{ m, lift: true, bb: m.geometry.boundingBox, inv: new T.Matrix4().copy(m.matrixWorld).invert(), wb: new T.Box3().copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld) }]; };
const zPenB = (links, obs) => { const p = V(), lp = V(), c = V(); let worst = { pen: -9 };
  links.forEach(l => { const lb = new T.Box3().setFromPoints([l.a, l.b]).expandByScalar(l.r + 0.01), n = Math.max(2, Math.ceil(l.a.distanceTo(l.b) / 0.01));
    obs.forEach(o => { if (!lb.intersectsBox(o.wb)) return; for (let k = 0; k <= n; k++) { p.lerpVectors(l.a, l.b, k / n); lp.copy(p).applyMatrix4(o.inv); c.copy(lp).clamp(o.bb.min, o.bb.max).applyMatrix4(o.m.matrixWorld);
      const pen = l.r - p.distanceTo(c); if (pen > worst.pen) worst = { pen, link: l.n, m: o.m }; } }); });
  return worst; };
// ---- a clean pose for arm i, its tool's tip at p pointing along dir (o.up: the jaws' way): the bridge's turn (zEnd(i, p) + dth) and the
//      carriage's place t on the arm's own half scanned. Clean: the tip reached; the elbow at least o.minM (10 cm) over the wrist; the arm
//      not folded back on itself (a pocket-knife: the carriage over the part, the upper arm back toward the ring's middle and the forearm
//      back out under it): its elbow at least 15 cm out from the shoulder toward the wrist, the shoulder at least 72 % of the arm's length
//      (2.2 m) from the wrist; no link of the arm nor its gripper in anything of o.obs. Of the clean ones: the bridge most nearly over the
//      part, the arm well out (about 93 % of its length) but not locked straight, the elbow well up. Returns { th, t, dth, m (the elbow
//      over the wrist), ahead (the elbow out from the shoulder), ext (shoulder to wrist / arm), pen, tpen, E, Wc, D } or null ----
const ZRL = 3.05;
const zPoseOf = (i) => { const k = zLinks(i), hs = V(k.Wc.x - k.S.x, 0, k.Wc.z - k.S.z), hl = hs.length(); if (hl > 1e-4) hs.multiplyScalar(1 / hl);
  return { k, m: k.E.y - k.Wc.y, D: k.Wc.distanceTo(k.S), ahead: hl > 0.05 ? (k.E.x - k.S.x) * hs.x + (k.E.z - k.S.z) * hs.z : 0 }; };
const zFind = (i, p, dir, o = {}) => { const th0 = zEnd(i, p), d = V(...(dir.toArray ? dir.toArray() : dir)).normalize(), tool = o.tool || 'gripper', cand = [], lift = o.lift || 0;
  const dths = o.dths || Array.from({ length: 25 }, (_, k) => (k - 12) * 0.1), ts = o.ts || Array.from({ length: 63 }, (_, k) => 0.15 + k * 0.05), minM = o.minM != null ? o.minM : 0.1;
  for (const dth of dths) for (const tt of ts) { const t = i === 0 ? tt : -tt, th = th0 + dth;
    armOnT(i, th, t, p.toArray(), d.toArray(), { tool, up: o.up, lift }); const q = zPoseOf(i), ext = q.D / ZRL;
    if (q.k.miss < 0.004 && q.m >= minM && q.ahead >= 0.15 && ext >= 0.72) cand.push({ th, t, dth, m: q.m, D: q.D, ext, ahead: q.ahead, sc: 0.5 * Math.abs(dth) + 2 * Math.abs(ext - 0.93) + (ext > 0.985 ? 0.3 : 0) + 3 * Math.max(0, 0.15 - q.m) }); }
  cand.sort((a, b) => a.sc - b.sc); const obs = o.obs || []; let best = null;
  for (const c of cand.slice(0, o.tries || 40)) { armOnT(i, c.th, c.t, p.toArray(), d.toArray(), { tool, up: o.up, lift }); const k = zLinks(i), w = zPenB(k.L.filter(l => !/prijemalo/.test(l.n)), obs), wt = zPenB(k.L.filter(l => /prijemalo/.test(l.n)), obs);
    const r = Object.assign({}, c, { lift, pen: w.pen, link: w.link, what: w.m, tpen: wt.pen, E: k.E.y, Wc: k.Wc.y }); if (w.pen <= 0 && (o.toolFree === false || wt.pen <= 0)) return r; if (!best || r.pen < best.pen) best = r; }
  return best ? Object.assign(best, { bad: true }) : null; };
// ---- REPLAN 2: THE CONTINUOUS CHAIN (shared by the reach test and the pictures: f2, f3 and f6 pose an arm as its own tested chain has it
//      at that place of the way). The obstacles split: the lift's column and the car (10 cm) apart from the rest (5 cm); a pose anywhere,
//      the starting poses, a pose near the previous one, a re-configuration (the tip held) checked as a motion, the chain with the fewest
//      re-configurations ----
const ZC = { mA: 0.05, mG: 0.05, mC: 0.10, tries: 40, lifts: [0, 0.2, 0.35, 0.5] };
const ZC_TS = Array.from({ length: 56 }, (_, k) => +(0.15 + k * 0.05).toFixed(2)).filter(t => t <= 2.9001), ZC_DTH = Array.from({ length: 33 }, (_, k) => (k - 16) * 0.1), ZC_TS1 = ZC_TS.filter((t, k) => k % 2 === 0);   // (ZC_TS1: the starting poses' coarser grid, 0.1 m)
const zcAng = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
const zcYaw = (v, a) => v.clone().applyAxisAngle(V(0, 1, 0), a);
const zcSplit = (obs, own = []) => { const car = G3.cur.v && (G3.cur.v.grp || G3.cur.v.body), inCar = (m) => { let q = m; while (q) { if (q === car) return true; q = q.parent; } return false; };
  const ownM = new Set(); own.forEach(o => o && o.traverse && o.traverse(m => ownM.add(m))); const P = obs.filter(o => !(o.lift || inCar(o.m)));
  return { P, G: P.filter(o => !ownM.has(o.m)), C: obs.filter(o => o.lift || (!T1CAR && inCar(o.m))) }; };   // (T1: with T1CAR the car is its surface (zCarPen in zClearC), not its meshes' boxes)   // (G: what the gripper keeps 5 cm off: the parts less the carried part's own supports, where its jaws work)
const zcMarg = (o) => ({ mA: ZC.mA, mG: ZC.mG, mC: ZC.mC, ...(o.marg || {}) });
const zcAny = (i, p, dir, o) => { let best = null; const lvl = Math.abs(dir.y) < 0.5 && o.yaw !== false, yaws = lvl ? (o.yaws || [0, 0.35, -0.35]) : [0];
  for (const yw of yaws) { const d = yw ? zcYaw(dir, yw) : dir, up = o.up && yw ? zcYaw(o.up, yw) : o.up;
    for (const lift of (o.lifts || ZC.lifts)) for (const dths of [o.dths, ZC_DTH]) { const r = zFindC(i, p, d, Object.assign({ tries: o.anyTries || ZC.tries, obsP: o.P, obsG: o.G, obsC: o.C, ts: o.ts || ZC_TS }, zcMarg(o), { up, lift, dths, minM: o.minM }));
      if (r) { r.yaw = yw; r.d = d; r.upv = up; } if (r && !r.bad) return r; if (r && (!best || r.viol < best.viol)) best = r; } }
  return best; };
const zcStarts = (i, p, dir, o) => { const out = [], lvl = Math.abs(dir.y) < 0.5 && o.yaw !== false, yaws = lvl ? (o.yaws || [0, 0.35, -0.35]) : [0];
  for (const yw of yaws) { const d = yw ? zcYaw(dir, yw) : dir, up = o.up && yw ? zcYaw(o.up, yw) : o.up;
    for (const lift of (o.lifts || ZC.lifts)) { const r = zFindC(i, p, d, Object.assign({ tries: o.startTries || 30, obsP: o.P, obsG: o.G, obsC: o.C, ts: o.ts || (o.startFine ? ZC_TS : ZC_TS1), dths: o.dths || ZC_DTH }, zcMarg(o), { up, lift, minM: o.minM }));
      if (r && !r.bad) { r.yaw = yw; r.d = d; r.upv = up; out.push(r); } } if (out.length >= (o.nStart || 4)) break; }
  return out; };
const zcNear = (i, p, prev, o) => { const th0 = zEnd(i, p), d = prev.d, up = prev.upv, dths = [-0.08, -0.04, 0, 0.04, 0.08].map(x => zcAng(prev.th + x - th0)), at = Math.abs(prev.t);
  const ts = [-0.12, -0.08, -0.04, 0, 0.04, 0.08, 0.12].map(x => +(at + x).toFixed(3)).filter(t => t >= 0.15 && t <= 2.9);
  for (const lift of [prev.lift, Math.max(0, prev.lift - 0.1), Math.min(0.5, prev.lift + 0.1)]) { const r = zFindC(i, p, d, Object.assign({ obsP: o.P, obsG: o.G, obsC: o.C }, zcMarg(o), { up, lift, dths, ts, tries: 25, minM: o.minM }));
    if (r && !r.bad) { r.yaw = prev.yaw; r.d = d; r.upv = up; return r; } }
  return null; };
const zcPoseOK = (i, p, d, up, th, t, lift, o) => { armOnT(i, th, t, p.toArray(), d.toArray(), { tool: ZTN[i], up, lift });   // (T1: ZTN)
  const q = zPoseOf(i);
  if (q.k.miss > 0.004 || q.m < 0.1) return false; return zClearC(i, Object.assign({ obsP: o.P, obsG: o.G, obsC: o.C }, zcMarg(o))).ok; };
const zcMotion = (i, p, A, B, o) => { const d = A.d, up = A.upv, dth = zcAng(B.th - A.th), N = 12;
  const at = (fT, fS, fL) => [A.th + dth * fT, A.t + (B.t - A.t) * fS, A.lift + (B.lift - A.lift) * fL];
  const orders = [['spoti', (s) => at(s, s, s)], ['teleskop, nato most in voziček', (s) => s < 0.5 ? at(0, 0, 2 * s) : at(2 * s - 1, 2 * s - 1, 1)],
    ['voziček in teleskop, nato most', (s) => s < 0.5 ? at(0, 2 * s, 2 * s) : at(2 * s - 1, 1, 1)], ['most, nato voziček in teleskop', (s) => s < 0.5 ? at(2 * s, 0, 0) : at(1, 2 * s - 1, 2 * s - 1)]];
  for (const [nm, f] of orders) { let ok = true; for (let k = 1; k < N; k++) { const [th, t, lift] = f(k / N); if (!zcPoseOK(i, p, d, up, th, t, lift, o)) { ok = false; break; } } if (ok) return nm; }
  return null; };
// (o.upTo: stop at that sample (the pictures); the result's poses[k] the arm's pose at each sample)
const zcRun = (i, S, dir, o, start) => { let prev = start; const re = [], poses = [start], n = o.upTo != null ? Math.min(o.upTo, S.length - 1) : S.length - 1; let lo = 9, hi = -9, mMin = 9, tMax = 0, eMax = 0, cA = 9, cG = 9, cC = 9;
  const take = (r) => { lo = Math.min(lo, r.lift); hi = Math.max(hi, r.lift); mMin = Math.min(mMin, r.m); tMax = Math.max(tMax, Math.abs(r.t)); eMax = Math.max(eMax, r.ext); cA = Math.min(cA, r.cA); cG = Math.min(cG, r.cG); cC = Math.min(cC, r.cC); }; take(prev);
  for (let k = 1; k <= n; k++) { let r = zcNear(i, S[k], prev, o);
    if (!r) { const Q = zcStarts(i, S[k - 1], dir, Object.assign({}, o, { nStart: 6 })); let done = null;
      for (const q of Q) { if (Math.abs(zcAng(q.th - prev.th)) < 0.02 && Math.abs(q.t - prev.t) < 0.02 && Math.abs(q.lift - prev.lift) < 0.01) continue; if (q.yaw !== prev.yaw) continue;
        const mv = zcMotion(i, S[k - 1], prev, q, o); if (!mv) continue; const r2 = zcNear(i, S[k], q, o); if (!r2) continue; done = { q, r2, mv }; break; }
      if (!done) return { ok: false, at: k, n, why: 'ni zvezne drže (ne naprej ne s preklopom)', re, poses };
      re.push(`pri ${k - 1}/${n}: most ${prev.th.toFixed(2)}→${done.q.th.toFixed(2)}, t ${prev.t.toFixed(2)}→${done.q.t.toFixed(2)}, teleskop ${prev.lift.toFixed(2)}→${done.q.lift.toFixed(2)} (${done.mv})`); take(done.q); r = done.r2; }
    take(r); prev = r; poses.push(r); }
  return { ok: true, n, re, lift: [lo, hi], mMin, tMax, eMax, cA, cG, cC, first: start, last: prev, poses }; };
// (REPLAN 2: the starting poses from the three families of the bridge's turn off the target (turned one way, straight at it, turned the
//  other way): where no chain from the first starts gets through, the starts of each family are tried in turn; a chain that breaks
//  is kept by how far it got)
const ZC_FAM = [ZC_DTH.filter(d => d < -0.25), ZC_DTH.filter(d => Math.abs(d) <= 0.35), ZC_DTH.filter(d => d > 0.25)];
const zcChain = (i, S, dir, o) => { let best = null; const tried = [];
  const run = (sts) => { for (const s of sts) { if (tried.some(q => Math.abs(zcAng(q.th - s.th)) < 0.05 && Math.abs(q.t - s.t) < 0.06 && Math.abs(q.lift - s.lift) < 0.01 && q.yaw === s.yaw)) continue; tried.push(s);
      const c = zcRun(i, S, dir, o, s); if (c.ok && (!best || !best.ok || c.re.length < best.re.length)) best = c; else if (!best || (!best.ok && !c.ok && c.at > best.at)) best = c; if (best.ok && !best.re.length) return true; } return false; };
  if (run(zcStarts(i, S[0], dir, o))) return best;
  if (!best || !best.ok) for (const fam of ZC_FAM) { if (run(zcStarts(i, S[0], dir, Object.assign({}, o, { dths: fam, nStart: 4 })))) return best; if (best && best.ok) break; }
  // (FINISH: where the coarse starts found no way through, the fine search's clean pose (the carriage every 5 cm, o.anyTries candidates) as a start of its own)
  let r = null; if (!best || !best.ok) { r = zcAny(i, S[0], dir, o); if (r && !r.bad && !tried.some(q => Math.abs(zcAng(q.th - r.th)) < 0.05 && Math.abs(q.t - r.t) < 0.06 && Math.abs(q.lift - r.lift) < 0.01 && q.yaw === r.yaw)) { tried.push(r);
      const c = zcRun(i, S, dir, o, r); if (c.ok || !best || c.at > best.at) best = c; } }
  if (!best) return { ok: false, at: 0, n: S.length - 1, why: r ? `ni čiste drže (najbližje: roka ${(r.cA * 100).toFixed(1)} cm, prijemalo ${(r.cG * 100).toFixed(1)} cm, steber/avto ${r.cC > 9 ? 'več kot 25' : (r.cC * 100).toFixed(1)} cm)` : 'ni drže', near: r, re: [], poses: [] };
  return best; };
// the chain's exact least clearances (every pose re-posed, every obstacle within 0.25 m looked at: a gap over 25 cm shows as >= 25)
const zcExact = (i, S, c, o) => { const R = { cA: 9, cG: 9, cC: 9 }, mg = { obsP: o.P, obsG: o.G, obsC: o.C, mA: 0.25, mG: 0.25, mC: 0.25 };
  (c.poses || []).forEach((r, k) => { armOnT(i, r.th, r.t, S[k].toArray(), r.d.toArray(), { tool: ZTN[i], up: r.upv, lift: r.lift }); const C = zClearC(i, mg);   // (T1: ZTN)
 
    if (C.a.d < R.cA) { R.cA = C.a.d; R.wA = C.a; R.kA = k; } if (C.g.d < R.cG) { R.cG = C.g.d; R.wG = C.g; R.kG = k; } if (C.c.d < R.cC) { R.cC = C.c.d; R.wC = C.c; R.kC = k; } });
  return R; };
const zcSamples = (grip, legs, ds = 0.05) => { const S = [grip.clone()]; let at = V(); legs.forEach(mv => { const n = Math.max(1, Math.ceil(mv.length() / ds)); for (let s = 1; s <= n; s++) S.push(grip.clone().add(at).addScaledVector(mv, s / n)); at.add(mv); }); return S; };
// ---- REPLAN 2: THE CLEARANCES OF THE ARM (the verifier: a pose that only does not cut into a thing is not enough). zPenC(links, obs, m):
//      the worst (radius + m - distance) of the links against the obstacles, every obstacle within m of a link looked at (a value <= 0:
//      every link m or more off every obstacle); { v, d (the least gap), link, m (the mesh) }. zFindC: a clean pose as zFind, its links
//      mA off the parts and the regal (o.obsP), its gripper mG off them, all of it mC off the lift's column and the car (o.obsC) ----
const zPenC = (links, obs, mg) => { const p = V(), lp = V(), c = V(); let worst = { v: -9, d: 9 };
  links.forEach(l => { const lb = new T.Box3().setFromPoints([l.a, l.b]).expandByScalar(l.r + mg + 0.01), n = Math.max(2, Math.ceil(l.a.distanceTo(l.b) / 0.01));
    obs.forEach(o => { if (!lb.intersectsBox(o.wb)) return; for (let k = 0; k <= n; k++) { p.lerpVectors(l.a, l.b, k / n); lp.copy(p).applyMatrix4(o.inv); c.copy(lp).clamp(o.bb.min, o.bb.max).applyMatrix4(o.m.matrixWorld);
      const d = p.distanceTo(c) - l.r; if (mg - d > worst.v) worst = { v: mg - d, d, link: l.n, m: o.m }; } }); });
  return worst; };
const zClearC = (i, o) => { const k = zLinks(i), isT = (l) => /prijemalo|orodje/.test(l.n), arm = k.L.filter(l => !isT(l)), tool = k.L.filter(isT);   // (T1: the own tool's links are the tool's too)
  const a = zPenC(arm, o.obsP || [], o.mA != null ? o.mA : 0.05), g = zPenC(tool, o.obsG || o.obsP || [], o.mG != null ? o.mG : 0.05); let c = zPenC(k.L, o.obsC || [], o.mC != null ? o.mC : 0.10);
  if (T1CAR && o.car !== false) { const x = zCarPen(o.toolCar === false ? arm : k.L, o.mC != null ? o.mC : 0.10); if (x.v > c.v) c = x; }   // (T1: the car's surface; o.toolCar false: the tool holds a part on the car, only the arm keeps off it)
  return { a, g, c, ok: a.v <= 0 && g.v <= 0 && c.v <= 0, viol: Math.max(a.v, g.v, c.v), k }; };
const zFindC = (i, p, dir, o = {}) => { const th0 = zEnd(i, p), d = V(...(dir.toArray ? dir.toArray() : dir)).normalize(), tool = o.tool || ZTN[i],   // (T1: ZTN)
  cand = [], lift = o.lift || 0;
  const dths = o.dths || Array.from({ length: 25 }, (_, k) => (k - 12) * 0.1), ts = o.ts || Array.from({ length: 56 }, (_, k) => 0.15 + k * 0.05).filter(t => t <= 2.9001), minM = o.minM != null ? o.minM : 0.1;
  for (const dth of dths) for (const tt of ts) { const t = i === 0 ? tt : -tt, th = th0 + dth;
    armOnT(i, th, t, p.toArray(), d.toArray(), { tool, up: o.up, lift }); const q = zPoseOf(i), ext = q.D / ZRL;
    if (q.k.miss < 0.004 && q.m >= minM && q.ahead >= 0.15 && ext >= 0.72) cand.push({ th, t, dth, m: q.m, D: q.D, ext, ahead: q.ahead, sc: 0.5 * Math.abs(dth) + 2 * Math.abs(ext - 0.93) + (ext > 0.985 ? 0.3 : 0) + 3 * Math.max(0, 0.15 - q.m) + (o.pref ? o.pref(th, t) : 0) }); }
  cand.sort((a, b) => a.sc - b.sc); let best = null;
  for (const c of cand.slice(0, o.tries || 40)) { armOnT(i, c.th, c.t, p.toArray(), d.toArray(), { tool, up: o.up, lift }); const C = zClearC(i, o);
    const r = Object.assign({}, c, { lift, cA: C.a.d, cG: C.g.d, cC: C.c.d, wA: C.a, wG: C.g, wC: C.c, viol: C.viol, E: C.k.E.y, Wc: C.k.Wc.y }); if (C.ok) return r; if (!best || r.viol < best.viol) best = r; }
  return best ? Object.assign(best, { bad: true }) : null; };

// =====================================================================================================================================
// ==== PROPOSAL 1 "VOZIČEK ZA LEVIM KONCEM REGALA" (my section of the store; the base's own functions changed for it are marked 'T1:'
//      above: zLinks (an arm's own tool), zcSplit and zClearC (the car as its surface), zFindC, zcPoseOK, zcExact (the arm's tool ZTN)).
//      THE TROLLEYS: low racks on four castors, navy with yellow, one a kind of part, like a plate rack:
//        HAUBE: the 4 bonnets stand on their hinge edge, nose up, tilted back 12°, one behind the other across the trolley (the slots one
//          behind the other along its length, the lowest at its tail, each next 8 cm higher), each one's face to the tail (the rack's
//          front); each stands in a padded channel between the teeth of two combs (one at each long side). A bonnet comes and goes SIDEWAYS
//          IN ITS OWN PLANE (along the channel, toward the car): a part in a rack one behind the other can only leave so, the others are
//          not in its way. On the car the arm opens the bonnet on its hinges (as it opens), lifts it off and slides it, standing, into
//          the empty place; the new one the same way back. The grip: the middle of the bonnet's far edge (the edge that is at the car's
//          far side on the car, the trolley's car side in the rack), the jaws across the panel.
//        POKROVI: the 4 boot lids the same (the lid opens on its hinges at its front edge: its face to the trolley's head).
//        STEKLA: a matching shelf: the 5 panes on edge on stepped slots across the trolley, tilted back as on the car (29°: a pane goes
//          from its slot to the window without turning), 28 cm apart and 26 cm higher each, so the suction cup reaches each one's middle
//          over the pane in front; at the head end the scrap bin ODPADNO STEKLO (a broken pane goes there, never into a slot).
//        VRATA: the 4 doors the same type as HAUBE.
//      The stock kind's place is empty (it is on the car): its name on its tag, the place's channel lined yellow.
//      THE HANDLE at the head end: a bar across, 1.0 m high, 0.3 m out; the gripper takes its middle from above.
//      PARKING (V2: off the car's path): LEFT IN FRONT, BESIDE THE CAR'S PATH BUT NOT ON IT: a fan round the ring's front-left, each
//      trolley standing as one more bay of the regal would (head and handle toward the ring), their heads 5.1 m and their handles 4.8 m
//      from the ring's middle, 15 cm apart at the heads, in the order of their working places along the car: STEKLA at 148.4° (angles
//      round the ring from +x toward +z), VRATA 132.9°, POKROVI 119.4°, HAUBE 104.5°, on yellow parking outlines. The car drives in from
//      the left door along z = 0 and out through the right one: every point of a trolley and of its outline is at z >= 1.94 m (the car's
//      half-width 1.37 m + 0.5 m = 1.9 m), so the band |z| < 1.9 m stays free across the whole room, and both doorways (x = ±9 m,
//      |z| <= 2.5 m) with it. The first view's left edge passes in front of them (out of the picture: t1Magenta, t1CountMagenta).
//      ROUTE: roka 2 pulls one out of its bay (head first, toward the ring's middle) till its tail is clear of its neighbours' heads,
//      turns it on an arc to head +x (T1RT: the straight and the arc's radius of each), well above the car's side, and glides it on its
//      swivel castors (heading +x) to its working place beside the car (HAUBE by the front, the others by the rear); the arm that is
//      free first takes it back the same way, tail first ====
let T1CAR = true;   // (the car as its surface in zClearC)
const ZTN = ['gripper', 'gripper'], ZTOOL = [null, null];   // (each arm's tool as the game poses it ('none' under an own tool) and its own tool's links)
const T1DEG = Math.PI / 180;
// ---- THE CAR AS ITS SURFACE: points over every triangle of the car (2 cm apart), in cells of 0.2 m; zCarPen(links, m) as zPenC ----
let ZCAR = null;
const zCarCloud = () => { const car = G3.cur.v && (G3.cur.v.grp || G3.cur.v.body); if (!car) return null; car.updateMatrixWorld(true); const ms = [];
  car.traverse(m => { if (!m.isMesh || !m.geometry || !m.geometry.attributes.position) return; let q = m; while (q) { if (!q.visible) return; q = q.parent; }
    if (m.geometry.type === 'PlaneGeometry' && m.material && (m.material.transparent || m.material.isMeshBasicMaterial)) return; ms.push(m); });
  const key = ms.map(m => m.geometry.uuid + ':' + m.matrixWorld.elements[13].toFixed(3)).join(','); if (ZCAR && ZCAR.key === key) return ZCAR;
  const H = 0.2, h = 0.02, cells = new Map(), a = V(), b = V(), c = V(), bb = new T.Box3(); let n = 0;
  const put = (x, y, z) => { const k = Math.floor(x / H) + ',' + Math.floor(y / H) + ',' + Math.floor(z / H); let r = cells.get(k); if (!r) cells.set(k, r = []); r.push(x, y, z); n++; };
  ms.forEach(m => { const P = m.geometry.attributes.position, I = m.geometry.index, nt = Math.floor((I ? I.count : P.count) / 3), W = m.matrixWorld; bb.expandByObject(m);
    for (let t = 0; t < nt; t++) { a.fromBufferAttribute(P, I ? I.getX(3 * t) : 3 * t).applyMatrix4(W); b.fromBufferAttribute(P, I ? I.getX(3 * t + 1) : 3 * t + 1).applyMatrix4(W); c.fromBufferAttribute(P, I ? I.getX(3 * t + 2) : 3 * t + 2).applyMatrix4(W);
      const N = Math.max(1, Math.ceil(Math.max(a.distanceTo(b), b.distanceTo(c), c.distanceTo(a)) / h));
      for (let i = 0; i <= N; i++) for (let j = 0; j <= N - i; j++) { const u = i / N, v = j / N, w = 1 - u - v; put(a.x * w + b.x * u + c.x * v, a.y * w + b.y * u + c.y * v, a.z * w + b.z * u + c.z * v); } } });
  ZCAR = { key, cells, H, n, box: bb, m: G3.cur.v.body }; return ZCAR; };
const zCarPen = (links, mg) => { const Z = zCarCloud(); let worst = { v: -9, d: 9 }; if (!Z) return worst; const H = Z.H, ab = V();
  links.forEach(l => { const R = l.r + mg + 0.03, lo = V(Math.min(l.a.x, l.b.x) - R, Math.min(l.a.y, l.b.y) - R, Math.min(l.a.z, l.b.z) - R), hi = V(Math.max(l.a.x, l.b.x) + R, Math.max(l.a.y, l.b.y) + R, Math.max(l.a.z, l.b.z) + R);
    if (hi.x < Z.box.min.x || lo.x > Z.box.max.x || hi.y < Z.box.min.y || lo.y > Z.box.max.y || hi.z < Z.box.min.z || lo.z > Z.box.max.z) return;
    ab.subVectors(l.b, l.a); const L2 = ab.lengthSq();
    for (let kx = Math.floor(lo.x / H); kx <= Math.floor(hi.x / H); kx++) for (let ky = Math.floor(lo.y / H); ky <= Math.floor(hi.y / H); ky++) for (let kz = Math.floor(lo.z / H); kz <= Math.floor(hi.z / H); kz++) {
      const r = Z.cells.get(kx + ',' + ky + ',' + kz); if (!r) continue;
      for (let q = 0; q < r.length; q += 3) { const px = r[q], py = r[q + 1], pz = r[q + 2]; let s = L2 > 1e-9 ? ((px - l.a.x) * ab.x + (py - l.a.y) * ab.y + (pz - l.a.z) * ab.z) / L2 : 0; s = s < 0 ? 0 : s > 1 ? 1 : s;
        const dx = l.a.x + ab.x * s - px, dy = l.a.y + ab.y * s - py, dz = l.a.z + ab.z * s - pz, d = Math.sqrt(dx * dx + dy * dy + dz * dz) - l.r; if (mg - d > worst.v) worst = { v: mg - d, d, link: l.n, m: Z.m }; } } });
  return worst; };
// (a point set's least gap to the car's surface: the part's own points)
const zCarGapPts = (pts) => { const Z = zCarCloud(); if (!Z) return 9; let best = 9; const H = Z.H;
  for (const p of pts) { if (p.x < Z.box.min.x - 0.3 || p.x > Z.box.max.x + 0.3 || p.y > Z.box.max.y + 0.3 || p.z < Z.box.min.z - 0.3 || p.z > Z.box.max.z + 0.3) continue;
    for (let kx = Math.floor((p.x - 0.25) / H); kx <= Math.floor((p.x + 0.25) / H); kx++) for (let ky = Math.floor((p.y - 0.25) / H); ky <= Math.floor((p.y + 0.25) / H); ky++) for (let kz = Math.floor((p.z - 0.25) / H); kz <= Math.floor((p.z + 0.25) / H); kz++) {
      const r = Z.cells.get(kx + ',' + ky + ',' + kz); if (!r) continue; for (let q = 0; q < r.length; q += 3) { const dx = r[q] - p.x, dy = r[q + 1] - p.y, dz = r[q + 2] - p.z, d = dx * dx + dy * dy + dz * dz; if (d < best * best) best = Math.sqrt(d); } } }
  return best; };
// ---- the arms' own tools: the flange's frame in the world, the suction cup (roka 2) and the four-edge gripper (roka 1) ----
const t1Fl = (i) => { const A = D.RB[i], J = A.J, R = ROOTS().find(q => q.i === i).p.root; R.updateMatrixWorld(true); const qR = R.getWorldQuaternion(new T.Quaternion());
  const d = J.d.clone().applyQuaternion(qR).normalize(), ac = J.ac.clone().applyQuaternion(qR).normalize(), fz = V().crossVectors(ac, d).normalize(), F = R.localToWorld(J.Wc.clone().addScaledVector(J.d, FLG_));
  return { F, d, ac, fz, at: (x, y, z) => F.clone().addScaledVector(ac, x).addScaledVector(d, y).addScaledVector(fz, z) }; };
const t1Rod = (par, a, b, r, m, seg = 10) => { const dd = V().subVectors(b, a), L = Math.max(1e-4, dd.length()), o = new T.Mesh(new T.CylinderGeometry(r, r, L, seg), m); o.position.copy(a).addScaledVector(dd, 0.5); o.quaternion.setFromUnitVectors(V(0, 1, 0), dd.normalize()); par.add(o); return o; };
// the suction cup (prisesek): a navy body with a yellow band, a steel neck, a black rubber cup 18 cm across; its face 0.20 m from the flange
const T1CUP = 0.30;   // (its face 0.30 m from the flange: a long stem, so the wrist stays 10 cm off the car's roof edge and pillars while the cup holds a pane in the window)
const t1CupLinks = Object.assign((at) => [['prisesek (telo)', at(0, 0.01, 0), at(0, 0.12, 0), 0.055], ['prisesek (steblo)', at(0, 0.12, 0), at(0, 0.255, 0), 0.03], ['prisesek (čaša)', at(-0.06, 0.275, 0), at(0.06, 0.275, 0), 0.03], ['prisesek (čaša 2)', at(0, 0.275, -0.06), at(0, 0.275, 0.06), 0.03]], { len: T1CUP });
const t1DrawCup = (i, on = true) => { const f = t1Fl(i), g = PR.group(), NV = PR.mat(0x1b2b5c, { shininess: 40 }), YL = PR.mat(0xf2c230, { shininess: 40 }), ST = PR.mat(0xc3c8cf, { shininess: 120, specular: 0x999999 }), RB = PR.mat(0x111215, { shininess: 25 });
  t1Rod(g, f.at(0, 0, 0), f.at(0, 0.12, 0), 0.055, NV, 18); t1Rod(g, f.at(0, 0.03, 0), f.at(0, 0.055, 0), 0.058, YL, 18); t1Rod(g, f.at(0, 0.12, 0), f.at(0, 0.257, 0), 0.028, ST, 12); t1Rod(g, f.at(0, 0.2, 0), f.at(0, 0.215, 0), 0.036, YL, 12);
  const cup = new T.Mesh(new T.CylinderGeometry(0.045, 0.09, 0.043, 24, 1, true), RB); cup.material = cup.material.clone(); cup.material.side = T.DoubleSide; cup.position.copy(f.at(0, 0.278, 0)); cup.quaternion.setFromUnitVectors(V(0, 1, 0), f.d); g.add(cup);
  if (on) { const ring = new T.Mesh(new T.TorusGeometry(0.088, 0.008, 6, 32), new T.MeshBasicMaterial({ color: new T.Color(0x47c6ff).multiplyScalar(1.6) })); ring.position.copy(f.at(0, 0.297, 0)); ring.quaternion.setFromUnitVectors(V(0, 0, 1), f.d); g.add(ring); }
  g.updateMatrixWorld(true); return g; };
// the four-edge gripper (štirirobno prijemalo) for the door's pane: a light frame 5 cm round the pane's outline, 7 cm off its face, held by
// four spokes from a hub on the flange; at each edge's middle a jaw down to the rim, its rubber pad (14 cm) closing on the rim; the pane's
// face 0.30 m from the flange. t1EdgeDef(W): the pane's outline in its plane (u along the car, v up the glass) and the jaws' places
const T1LY = 0.30;
const t1EdgeDef = (W) => { const c = winCenter(W.door_r), n = NSIDE.clone(), e1 = V(1, 0, 0), e2 = n.clone().cross(e1).normalize(), P2 = []; let nm = 0, cnt = 0;
  W.door_r.forEach(({ p }) => p.forEach(v => { const d = v.clone().sub(c); P2.push([d.dot(e1), d.dot(e2)]); nm += d.dot(n); cnt++; })); nm /= Math.max(1, cnt);
  P2.sort((a, b) => a[0] - b[0] || a[1] - b[1]); const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for (const p of P2) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = P2.length - 1; i >= 0; i--) { const p = P2[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  const Hh = lo.slice(0, -1).concat(up.slice(0, -1));   // (counter-clockwise in (u, v))
  let u0 = 9, u1 = -9, v0 = 9, v1 = -9; Hh.forEach(([u, v]) => { u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }); const uc = (u0 + u1) / 2, vc = (v0 + v1) / 2;
  const E = Hh.map((a, k) => { const b = Hh[(k + 1) % Hh.length], du = b[0] - a[0], dv = b[1] - a[1], L = Math.hypot(du, dv); return { M: [(a[0] + b[0]) / 2 - uc, (a[1] + b[1]) / 2 - vc], T: [du / L, dv / L], N: [dv / L, -du / L], L }; }).filter(e => e.L > 0.08);
  const J = [[0, -1], [1, 0], [0, 1], [-1, 0]].map(([x, y]) => E.slice().sort((p, q) => (q.N[0] * x + q.N[1] * y + 0.05 * q.L) - (p.N[0] * x + p.N[1] * y + 0.05 * p.L))[0]);
  // (the frame's corners: the four edges' lines 5 cm out, each met with the next)
  const off = (e, s) => [e.M[0] + e.N[0] * s, e.M[1] + e.N[1] * s], meet = (e, f, s) => { const [ax, ay] = off(e, s), [bx, by] = off(f, s), det = e.T[0] * -f.T[1] + f.T[0] * e.T[1]; const t = ((bx - ax) * -f.T[1] + f.T[0] * (by - ay)) / det; return [ax + e.T[0] * t, ay + e.T[1] * t]; };
  const K = J.map((e, k) => meet(e, J[(k + 1) % 4], 0.05));
  return { c, n, e1, e2, nm, uc, vc, H: Hh.map(([u, v]) => [u - uc, v - vc]), J, K, P0: c.clone().addScaledVector(e1, uc).addScaledVector(e2, vc).addScaledVector(n, nm), w: u1 - u0, h: v1 - v0 }; };
// the four-edge gripper's links (tool coordinates: x along the pane (u), y from the flange toward the pane, z up the pane (v)); open: the
// pads 5 cm off the rim
const t1EdgeLinks = (E, open = false) => Object.assign((at) => { const L = [['hub', at(0, 0.01, 0), at(0, 0.13, 0), 0.06]], yF = T1LY - 0.07, g = open ? 0.06 : 0.012;
    E.K.forEach((k, j) => { const m = E.K[(j + 1) % 4]; L.push(['okvir', at(k[0], yF, k[1]), at(m[0], yF, m[1]), 0.016]); });
    E.J.forEach(e => { const s = [e.M[0] + e.N[0] * 0.05, e.M[1] + e.N[1] * 0.05], r = [e.M[0] + e.N[0] * g, e.M[1] + e.N[1] * g];
      L.push(['prečka', at(0, 0.13, 0), at(s[0], yF, s[1]), 0.018], ['čeljust', at(s[0], yF, s[1]), at(r[0], T1LY - 0.012, r[1]), 0.02], ['blazinica', at(r[0] - e.T[0] * 0.07, T1LY, r[1] - e.T[1] * 0.07), at(r[0] + e.T[0] * 0.07, T1LY, r[1] + e.T[1] * 0.07), 0.016]); });
    return L; }, { len: T1LY });
const t1DrawEdge = (i, E, open = false) => { const f = t1Fl(i), g = PR.group(), NV = PR.mat(0x1b2b5c, { shininess: 40 }), AL = PR.mat(0xd9dee5, { shininess: 110, specular: 0x888888 }), ST = PR.mat(0xa7b0bb, { shininess: 70 }),
    YL = PR.mat(0xf2c230, { shininess: 50 }), RB = PR.mat(0x15171a, { shininess: 15 });
  t1EdgeLinks(E, open)(f.at).forEach(([n, a, b, r]) => t1Rod(g, a, b, n === 'hub' ? 0.06 : r, n === 'hub' ? NV : n === 'okvir' ? AL : n === 'prečka' ? ST : n === 'čeljust' ? YL : RB, n === 'hub' ? 18 : 8));
  E.K.forEach(k => { const p = f.at(k[0], T1LY - 0.07, k[1]); PR.sph(g, 0.022, p.x, p.y, p.z, AL, 8); });
  t1Rod(g, f.at(0, 0.03, 0), f.at(0, 0.06, 0), 0.063, YL, 18); g.updateMatrixWorld(true); return g; };
// (the game's wrench as its own links: its body, the extension, the socket's head (garage3d.js TOOLC.wrench, from the coupling's face); the
// game puts its tip itself)
const t1WrenchLinks = Object.assign((at) => [['vijačnik (telo)', at(0, 0.02, 0), at(0, 0.25, 0), 0.06], ['vijačnik (podaljšek)', at(0, 0.25, 0), at(0, 0.42, 0), 0.025], ['vijačnik (glava)', at(0, 0.43, 0), at(0, 0.48, 0), 0.057]], { len: 0 });
const t1Tool = (i, tool, E) => { if (tool === 'wrench') { ZTN[i] = 'wrench'; ZTOOL[i] = t1WrenchLinks; return; } if (tool === 'cup') { ZTN[i] = 'none'; ZTOOL[i] = t1CupLinks; } else if (tool === 'edge' || tool === 'edgeOpen') { ZTN[i] = 'none'; ZTOOL[i] = t1EdgeLinks(E, tool === 'edgeOpen'); } else { ZTN[i] = tool || 'gripper'; ZTOOL[i] = null; } };
const t1TipOf = (i, p, d) => ZTOOL[i] ? p.clone().addScaledVector(d, -ZTOOL[i].len) : p.clone();
// ---- the broken pane (my copy of concepts/_e_k_body.js crackedPane: the whole pane crazed, an impact with rays and rings) ----
let T1CRACK = null;
const t1CrackTex = () => { const c = document.createElement('canvas'); c.width = c.height = 1024; const g = c.getContext('2d'); let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  g.fillStyle = 'rgba(225,235,245,0.22)'; g.fillRect(0, 0, 1024, 1024); g.lineCap = 'round';
  const line = (x0, y0, x1, y1, w, a) => { g.strokeStyle = `rgba(255,255,255,${a})`; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
  const N = 22, P = []; for (let i = 0; i <= N; i++) { P.push([]); for (let j = 0; j <= N; j++) P[i].push([i * 1024 / N + (rnd() - 0.5) * 30, j * 1024 / N + (rnd() - 0.5) * 30]); }
  for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) { const [x, y] = P[i][j]; if (i < N) line(x, y, P[i + 1][j][0], P[i + 1][j][1], 2.2, 0.55 + rnd() * 0.3); if (j < N) line(x, y, P[i][j + 1][0], P[i][j + 1][1], 2.2, 0.55 + rnd() * 0.3); if (i < N && j < N && rnd() < 0.5) line(x, y, P[i + 1][j + 1][0], P[i + 1][j + 1][1], 1.6, 0.45); }
  const ix = 380, iy = 540; for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2 + (rnd() - 0.5) * 0.3; let x = ix, y = iy; for (let s = 0; s < 9; s++) { const nx = x + Math.cos(a + (rnd() - 0.5) * 0.5) * 90, ny = y + Math.sin(a + (rnd() - 0.5) * 0.5) * 90; line(x, y, nx, ny, 4.5 - s * 0.35, 0.95); x = nx; y = ny; } }
  for (const r of [26, 60, 110, 175]) { g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 3; g.beginPath(); for (let k = 0; k <= 32; k++) { const a = k / 32 * Math.PI * 2, rr = r * (0.85 + rnd() * 0.3); k ? g.lineTo(ix + Math.cos(a) * rr, iy + Math.sin(a) * rr) : g.moveTo(ix + Math.cos(a) * rr, iy + Math.sin(a) * rr); } g.stroke(); }
  g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.arc(ix, iy, 16, 0, 7); g.fill(); const t = new T.CanvasTexture(c); t.anisotropy = 4; return t; };
const t1ShapeGeo = (polys, c) => { const n = NSIDE.clone(), e1 = V(1, 0, 0), e2 = n.clone().cross(e1).normalize(), pos = [], uv = []; let u0 = 9, u1 = -9, v0 = 9, v1 = -9; const pts = [];
  polys.forEach(({ p }) => { for (let i = 1; i < p.length - 1; i++) for (const v of [p[0], p[i], p[i + 1]]) { const d = v.clone().sub(c); pts.push(d); const u = d.dot(e1), w = d.dot(e2); u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, w); v1 = Math.max(v1, w); } });
  pts.forEach(d => { pos.push(d.x, d.y, d.z); uv.push((d.dot(e1) - u0) / (u1 - u0), (d.dot(e2) - v0) / (v1 - v0)); });
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.computeVertexNormals(); return g; };
// the cracked pane: its window's middle c at 'at', turned q about it (no q: as in the door)
const t1Cracked = (polys, at, q) => { const c = winCenter(polys); if (!T1CRACK) T1CRACK = t1CrackTex(); const grp = PR.group(), g = t1ShapeGeo(polys, c);
  grp.add(new T.Mesh(g, new T.MeshPhongMaterial({ color: 0x9fb3c8, transparent: true, opacity: 0.5, shininess: 120, specular: 0x8892a0, side: T.DoubleSide, depthWrite: false })));
  const cm = new T.Mesh(g, new T.MeshBasicMaterial({ map: T1CRACK, transparent: true, side: T.DoubleSide, depthWrite: false })); cm.renderOrder = 6; grp.add(cm);
  grp.position.copy(at || c); if (q) grp.quaternion.copy(q); grp.updateMatrixWorld(true); return grp; };
const t1OpenWin = (W) => winOverlay(W.door_r, 0x0b0e13, 1, 0.004);   // (the door's window empty: its opening dark)
const t1SignTex = (a, b, bg = '#16245a') => { const c = document.createElement('canvas'); c.width = 512; c.height = 208; const g = c.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, 512, 208); g.fillStyle = '#ffd23f'; g.fillRect(0, 192, 512, 16);
  g.fillStyle = '#fff'; g.font = 'italic 900 70px Roboto, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(a, 256, b ? 58 : 100); if (b) g.fillText(b, 256, 140); return new T.CanvasTexture(c); };
// ---- THE TROLLEYS ----
const T1M = () => ({ NV: PR.mat(0x1b2b5c, { shininess: 40 }), YL: PR.mat(0xf2c230, { shininess: 40 }), ST: PR.mat(0xa7b0bb, { shininess: 70, specular: 0x666666 }), RB: PR.mat(0x17181c, { shininess: 15 }),
  PAD: PR.mat(0x2a2d33, { shininess: 10 }), BIN: PR.mat(0x2f6b4f, { shininess: 30 }), BIND: PR.lam(0x13161a), DECK: PR.mat(0x8a929c, { shininess: 50, specular: 0x444444 }) });
// the kinds of each trolley: names on the tags (the menus' names; W: in English), their colours
const T1K = {
  hood: { nm: 'BONNETS', kinds: HOOD_KINDS, names: ['STOCK', 'CARBON', 'VENTED', 'SCOOP'], sw: ['#2a5bd7', '#3a3d44', '#2a5bd7', '#2a5bd7'], n: 4,
    pw: 2 * HOOD.z, ph: HOOD.x1 - HOOD.x0, z0: 0.40, sp: 0.28, rise: 0.14, base: 0.22, tilt: 12 * T1DEG, work: [1.40, 2.16] },
  lid: { nm: 'BOOT LIDS', kinds: LID_KINDS, names: ['STOCK', 'ALUMINIUM', 'CARBON', 'RACE'], sw: ['#2a5bd7', '#c3c8cf', '#3a3d44', '#3a3d44'], n: 4,
    pw: 1.6, ph: 0.44, z0: 0.40, sp: 0.28, rise: 0.10, base: 0.48, tilt: 12 * T1DEG, work: [-0.60, 2.10] },
  glass: { nm: 'GLASS', kinds: RACK_KINDS_Z, names: RACK_KINDS_Z.map(k => GKZ[k].nm), sw: RACK_KINDS_Z.map(k => GKZ[k].sw), n: 5,
    sp: 0.28, rise: 0.26, base: 0.30, tilt: 29 * T1DEG, work: [-1.95, 2.20] },
  door: { nm: 'DOORS', kinds: DOOR_KINDS, names: ['STOCK', 'CARBON', 'ALUMINIUM', 'RACE'], sw: ['#2a5bd7', '#3a3d44', '#c3c8cf', '#2a5bd7'], n: 4,
    z0: 0.40, sp: 0.28, rise: 0.10, base: 0.34, tilt: 10 * T1DEG, work: [-0.90, 2.20] } };
const T1RH = 5.1, T1RP = 3.7, T1HY = 1.0, T1HO = 0.30;   // (parked: the heads 5.1 m from the ring's middle; (V2: T1RP unused); the handle 1.0 m high, 0.3 m out of the head)
// a trolley's layout in its own frame (x toward its head, z across (+z its front, where the parts' faces look), y up; the origin on the
// floor at its middle): its length L (x), width Wd (z), the slots one behind the other (the front one lowest), each part's middle and turn,
// its grip (gL in the part's own frame: the edge the arm takes, its middle), the tool's way into it (dL) and the jaws' way (the part's
// normal); the handle's grip. The parts leave and come SIDEWAYS through the open tail end (-x): a panel in a rack one behind the other
// cannot go any other way, the others are in its way
const T1DL = { hood: V(-0.98, -0.2, 0).normalize(), lid: V(0.98, -0.2, 0).normalize(), door: V(0, -0.98, -0.2).normalize() };
const t1Lay = (key, W) => { const K = T1K[key], out = { key, K, slots: [] }, t = K.tilt, ct = Math.cos(t), stl = Math.sin(t), upPl = V(0, ct, -stl), nrm = V(0, stl, ct);
  if (key === 'glass') { const PF = paneFrame(W), xm = (PF.x0 + PF.x1) / 2, um = PF.um, uM = PF.uM, h = uM - um, q = qAx('x', -t);
    out.pane = { PF, xm, um, uM, h }; out.L = 2.06; out.Wd = 1.42; out.bin = { x0: 0.0, x1: 0.98, z0: -0.37, z1: 0.37, y0: 0.2, y1: 0.88 }; const xs = -0.5;
    for (let k = 0; k < K.n; k++) { const B = V(xs, K.base + K.rise * k, 0.58 - K.sp * k), at = B.clone().sub(V(xm, um, 0).applyQuaternion(q)), gL = V(xm, (um + uM) / 2, 0.004);
      out.slots.push({ k, kind: K.kinds[k], base: B, at, q, gL, dL: V(0, 0, -1), grip: gL.clone().applyQuaternion(q).add(at), d: V(0, 0, -1).applyQuaternion(q), up: V(1, 0, 0), top: B.y + h * ct, n: nrm.clone(), upPl: upPl.clone(), hh: h / 2 }); }
    out.x0 = -1.03; out.x1 = 1.03; out.z0 = -0.71; out.z1 = 0.71; }
  else { const ph = key === 'door' ? doorRect().y1 - doorRect().y0 : K.ph, pw = key === 'door' ? doorRect().x1 - doorRect().x0 : K.pw, hh = ph / 2;
    // (the part's turn in its slot: its face +z tilted back; a bonnet's nose up, a lid's back edge up (the edges the arm takes), a door as on the car)
    const q = key === 'hood' ? qAx('x', -t).multiply(qAx('y', Math.PI / 2)).multiply(qAx('z', Math.PI / 2)) : key === 'lid' ? qAx('x', -t).multiply(qAx('y', -Math.PI / 2)).multiply(qAx('z', -Math.PI / 2)) : qAx('x', -t);
    const gL = key === 'hood' ? V(hh, 0, 0) : key === 'lid' ? V(-hh, 0, 0) : V(0, hh, 0), dL = T1DL[key];
    out.L = pw + 0.26; const zb = K.z0 - K.sp * (K.n - 1) - ph * stl; out.Wd = Math.max(1.0, K.z0 + 0.12 - Math.min(-0.5, zb)); out.zMid = 0;
    for (let k = 0; k < K.n; k++) { const B = V(0, K.base + K.rise * k, K.z0 - K.sp * k), at = B.clone().addScaledVector(upPl, hh);
      out.slots.push({ k, kind: K.kinds[k], base: B, at, q, gL, dL, grip: gL.clone().applyQuaternion(q).add(at), d: dL.clone().applyQuaternion(q), up: nrm.clone(), upPl: upPl.clone(), hh, top: B.y + ph * ct, n: nrm.clone() }); }
    out.x0 = -out.L / 2; out.x1 = out.L / 2; out.z0 = K.z0 + 0.1 - out.Wd; out.z1 = K.z0 + 0.1; out.pw = pw; out.ph = ph; }
  const zc = (out.z0 + out.z1) / 2; out.slots.forEach(S => { S.base.z -= zc; S.at.z -= zc; S.grip.z -= zc; }); out.z0 -= zc; out.z1 -= zc;   // (the origin in the footprint's middle)
  out.handle = V(out.x1 + T1HO, T1HY, 0); return out; };
// a part of the trolley's kind (built about its middle as on the car)
const t1Part = (key, kind, W) => key === 'hood' ? hoodPart(kind) : key === 'lid' ? lidPart(kind) : key === 'door' ? doorPart(kind) : null;
// a tag on a trolley: the kind's name (zTagN) on a little navy board, standing (faces the rack's front), at local p, turned q
const t1Tag = (par, nm, sw, p, q, w = 0.36) => { const g = new T.Group(); g.position.copy(p); g.quaternion.copy(q); par.add(g); zbx(g, w + 0.03, w * 0.14 + 0.03, 0.012, 0, 0, -0.008, PR.mat(0x0d1626, { shininess: 20 })); zTagN(g, nm, sw, 0, 0, 0.0, w); return g; };
// build trolley 'key' (fill: the kinds in their places, null where empty; default: the stock one's place empty) under its own group;
// returns { g, lay, parts[k], tags[k], handle (mesh), frame (meshes), place(pose), gripW (the handle's grip in the world), slotW(k) }
const t1Trolley = (key, W, o = {}) => { const lay = t1Lay(key, W), K = lay.K, M = T1M(), g = new T.Group(); PR.group().add(g); g.name = 'T1 voziček ' + key;
  const fill = o.fill || ON_CAR(K.kinds), out = { key, g, lay, parts: [], tags: [], frame: [], fill }, F = (m) => { out.frame.push(m); return m; }, L = lay.L, Wd = lay.Wd;
  // the chassis: a navy frame, a steel deck, four castors (a yellow fork, a black wheel)
  for (const s of [-1, 1]) { F(zbx(g, L, 0.05, 0.05, 0, 0.165, s * (Wd / 2 - 0.025), M.NV)); F(zbx(g, 0.05, 0.05, Wd, s * (L / 2 - 0.025), 0.165, 0, M.NV)); }
  F(zbx(g, L - 0.06, 0.014, Wd - 0.06, 0, 0.197, 0, M.DECK));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const x = sx * (L / 2 - 0.12), z = sz * (Wd / 2 - 0.12); F(zbx(g, 0.06, 0.07, 0.06, x, 0.12, z, M.YL)); F(zcy(g, 0.06, 0.06, 0.04, x, 0.06, z, M.RB, 'z', 16)); }
  // the handle: two posts out of the head end, a bar across with a yellow grip
  const hx = lay.handle.x; for (const s of [-1, 1]) F(t1Rod(g, V(L / 2 - 0.03, 0.19, s * 0.26), V(hx, T1HY, s * 0.26), 0.02, M.ST));
  out.handle = F(t1Rod(g, V(hx, T1HY, -0.31), V(hx, T1HY, 0.31), 0.022, M.ST, 12)); F(t1Rod(g, V(hx, T1HY, -0.13), V(hx, T1HY, 0.13), 0.03, M.YL, 14));
  // the trolley's name on its head end under the handle (parked, it faces the ring), on its front and its back (the deck's edge)
  { const b = hSignBox(g, K.nm, Math.min(0.62, Wd * 0.5), 0.12, L / 2 + 0.008, 0.36, 0); b.rotation.y = Math.PI / 2; F(b); }
  for (const s of [-1, 1]) { const b = hSignBox(g, K.nm, Math.min(0.9, L * 0.5), 0.1, key === 'glass' ? -0.5 : 0, 0.26, s * (Wd / 2 + 0.008)); if (s < 0) b.rotation.y = Math.PI; F(b); }
  if (key === 'glass') { const P = lay.pane;
    lay.slots.forEach((S, k) => { const z = S.base.z, yb = S.base.y;   // (a step: a navy riser from the deck, a padded ledge, a steel lip; two slanted rests behind the pane)
      F(zbx(g, 1.0, yb - 0.2, 0.12, -0.5, 0.2 + (yb - 0.2) / 2, z - 0.03, M.NV)); F(zbx(g, 0.98, 0.02, 0.07, -0.5, yb - 0.01, z, M.PAD)); F(zbx(g, 0.98, 0.04, 0.008, -0.5, yb + 0.01, z + 0.04, M.ST));
      for (const sx of [-0.92, -0.08]) { const a = V(sx, yb + 0.02, z - 0.06), b = a.clone().addScaledVector(S.upPl, P.h * 0.62); F(t1Rod(g, a, b, 0.012, M.ST)); const p = b.clone().addScaledVector(S.n, -0.012); F(zbx(g, 0.05, 0.04, 0.02, p.x, p.y, p.z, M.RB)); } });
    // the scrap bin BROKEN GLASS (W: in English; was ODPADNO STEKLO) at the head end: four dark green walls, a black bottom, the sign on its front and back
    const B = lay.bin, bw = B.x1 - B.x0, bd = B.z1 - B.z0, bh = B.y1 - B.y0, cx = (B.x0 + B.x1) / 2, t = 0.025; out.bin = [];
    for (const [x, z, w, d] of [[cx, B.z1 - t / 2, bw, t], [cx, B.z0 + t / 2, bw, t], [B.x0 + t / 2, 0, t, bd], [B.x1 - t / 2, 0, t, bd]]) out.bin.push(F(zbx(g, w, bh, d, x, B.y0 + bh / 2, z, M.BIN)));
    out.bin.push(F(zbx(g, bw - 2 * t, 0.03, bd - 2 * t, cx, B.y0 + 0.03, 0, M.BIND)));
    for (const s of [-1, 1]) { const m = new T.Mesh(new T.PlaneGeometry(bw * 0.84, bw * 0.84 * 208 / 512), new T.MeshBasicMaterial({ map: t1SignTex('BROKEN', 'GLASS', '#1d4a36') })); m.position.set(cx, B.y0 + bh * 0.55, s * (bd / 2 + 0.004)); if (s < 0) m.rotation.y = Math.PI; g.add(m); out.bin.push(m); }
    for (const z of [B.z0, B.z1]) F(zbx(g, bw, 0.03, 0.03, cx, B.y1, z, M.YL));
    lay.slots.forEach((S, k) => { const kd = fill[k]; if (kd) { const p = paneOfZ(W.door_r, kd, S.at, S.q, { pre: P.PF.qUp }); g.add(p); out.parts[k] = p; } else out.parts[k] = null;
      const tp = kd ? S.at.clone().add(V(P.PF.x0 + 0.16, P.uM + 0.05, 0.012).applyQuaternion(S.q)) : S.base.clone().add(V(-0.25, 0.06, 0.05)); out.tags[k] = t1Tag(g, K.names[k], K.sw[k], tp, kd ? S.q : new T.Quaternion(), 0.26); }); }
  else { const ph = lay.ph, pw = lay.pw, rl = Math.min(1.0, ph * 0.55);
    lay.slots.forEach((S, k) => { const B = S.base;
      // the slot: a riser to its height, a padded channel along the trolley (open at the tail end, a stop at the head end), two slanted rests
      // with pads in the gap behind the part (they are not in the way of a part sliding out: they stand between the slots)
      if (B.y > 0.23) F(zbx(g, L - 0.12, B.y - 0.2, 0.1, 0, 0.2 + (B.y - 0.2) / 2, B.z - 0.02, M.NV));
      F(zbx(g, L - 0.14, 0.025, 0.07, 0, B.y - 0.012, B.z, M.PAD)); for (const sz of [-1, 1]) F(zbx(g, L - 0.14, 0.045, 0.008, 0, B.y + 0.01, B.z + sz * 0.04, M.ST));
      F(zbx(g, 0.03, 0.09, 0.09, L / 2 - 0.09, B.y + 0.035, B.z, M.YL));
      for (const sx of [-1, 1]) { const a = V(sx * (pw / 2 - 0.14), B.y, B.z - 0.075), b = a.clone().addScaledVector(S.upPl, rl); F(t1Rod(g, a, b, 0.016, M.NV)); const p = b.clone().addScaledVector(S.n, 0.045); F(zbx(g, 0.07, 0.07, 0.03, p.x, p.y, p.z - 0.012, M.RB)); } });
    lay.slots.forEach((S, k) => { const kd = fill[k]; if (kd) { const pg = new T.Group(); pg.add(zMatte(t1Part(key, kd, W))); pg.position.copy(S.at); pg.quaternion.copy(S.q); g.add(pg); out.parts[k] = pg; } else out.parts[k] = null;
      // the tag: a card on the part's top edge near the tail end (the empty place's: on its channel), facing the front
      const tq = new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(V(1, 0, 0), S.upPl, S.n));
      const tp = kd ? S.at.clone().addScaledVector(S.upPl, S.hh + 0.06).add(V(-pw / 2 + 0.22, 0, 0)).addScaledVector(S.n, 0.025) : S.base.clone().add(V(-pw / 2 + 0.22, 0.07, 0.05));
      out.tags[k] = t1Tag(g, K.names[k], K.sw[k], tp, kd ? tq : new T.Quaternion(), 0.3); }); }
  // the empty place: its channel lined yellow (the stock kind is on the car)
  lay.slots.forEach((S, k) => { if (fill[k]) return; const Y = new T.MeshBasicMaterial({ color: new T.Color(YEL).multiplyScalar(1.6) });
    out.empty = zbx(g, key === 'glass' ? 0.96 : L - 0.16, 0.012, 0.05, key === 'glass' ? -0.5 : 0, S.base.y + 0.006, S.base.z, Y); });
  out.place = (pose) => { g.position.set(pose.x, 0, pose.z); g.rotation.set(0, pose.h, 0); g.updateMatrixWorld(true); out.pose = pose; return out; };
  out.toW = (v) => g.localToWorld(v.clone()); out.dirW = (v) => v.clone().applyQuaternion(g.getWorldQuaternion(new T.Quaternion()));
  out.gripW = () => out.toW(lay.handle); out.upW = () => out.dirW(V(1, 0, 0));
  out.slotW = (k) => { const S = lay.slots[k], qg = g.getWorldQuaternion(new T.Quaternion()); return { at: out.toW(S.at), q: qg.clone().multiply(S.q), grip: out.toW(S.grip), d: out.dirW(S.d), up: out.dirW(S.up), n: out.dirW(S.n), upPl: out.dirW(S.upPl), base: out.toW(S.base) }; };
  out.place(o.pose || t1Park(key)); return out; };
// the parking places (V2): side by side round the ring's front-left, in the order of their working places along the car (STEKLA, VRATA,
// POKROVI, HAUBE), each one's width (its footprint across) 5.1 m from the ring's middle and 15 cm apart: STEKLA's axis at 148.4° (its
// outline's corner nearest the car's path at z 1.94 m), the others following toward the front (to HAUBE at 104.5°, out of the first view)
const T1ORD = ['glass', 'door', 'lid', 'hood'], T1A0 = 148.4;
let T1PA = null;
const t1ParkA = () => { if (T1PA) return T1PA; const W = winPolysP(); T1PA = {}; let e = T1A0 * T1DEG + Math.asin(t1Lay('glass', W).Wd / 2 / T1RH); T1ORD.forEach(k => { const hw = Math.asin(t1Lay(k, W).Wd / 2 / T1RH); T1PA[k] = e - hw; e = e - 2 * hw - 0.15 / T1RH; }); return T1PA; };
// the parked pose (its head toward the ring, 5.1 m from its middle) and the working pose by the car (heading +x)
const t1Park = (key) => { const K = T1K[key], L = t1Lay(key, winPolysP()).L, a = t1ParkA()[key], r = T1RH + L / 2; return { x: r * Math.cos(a), z: r * Math.sin(a), h: Math.PI - a }; };
const t1Work = (key) => { const w = T1K[key].work; return { x: w[0], z: w[1], h: 0 }; };
// the parking places' yellow outlines on the floor (the trolley's footprint and 8 cm)
const t1ParkLines = (W) => Object.keys(T1K).map(key => { const lay = t1Lay(key, W), P = t1Park(key), c = Math.cos(P.h), s = Math.sin(P.h), e = 0.08, pts = [[lay.x0 - e, lay.z0 - e], [lay.x1 + e, lay.z0 - e], [lay.x1 + e, lay.z1 + e], [lay.x0 - e, lay.z1 + e]]
  .map(([x, z]) => [P.x + x * c + z * s, 0.012, P.z - x * s + z * c]); return outline(pts.concat([pts[0]]), YEL, 0.018); });
// THE ROUTE of trolley 'key' from its parking place to its working place (V2): straight out of its bay head first toward the ring's middle
// (T1RT[key][0] m: its tail clear of its neighbours' heads), an arc (radius T1RT[key][1]) turning it to head +x, well above the car's side,
// then a straight glide on its swivel castors, still heading +x, to its working place; samples every ds along it: { c, h (the heading:
// its head's way), s, grip (the handle's grip), up (the jaws' way: along the head) }. (Each trolley's straight and radius: the least gaps
// (footprints) on the way 12 cm to the other parked trolleys, 22 cm (STEKLA: past the car's tail) and more to the car's box before the glide)
const T1RT = { glass: [1.00, 1.6], door: [1.25, 2.0], lid: [1.85, 1.6], hood: [2.10, 1.6] };
const t1Route = (key, ds = 0.08) => { const W = winPolysP(), lay = t1Lay(key, W), P = t1Park(key), Wk = t1Work(key), th = P.h, [s0, rho] = T1RT[key], u = V(Math.cos(th), 0, -Math.sin(th));
  const S = V(P.x, 0, P.z).addScaledVector(u, s0), C = S.clone().add(V(rho * Math.sin(th), 0, rho * Math.cos(th))), Tp = C.clone().add(V(0, 0, -rho)), Wp = V(Wk.x, 0, Wk.z);
  const L1 = s0, L2 = rho * th, L3 = Tp.distanceTo(Wp), Ln = L1 + L2 + L3, n = Math.max(2, Math.ceil(Ln / ds)), out = [];
  for (let k = 0; k <= n; k++) { const d = Ln * k / n; let c, h;
    if (d <= L1) { c = V(P.x, 0, P.z).addScaledVector(u, d); h = th; } else if (d <= L1 + L2) { h = th - (d - L1) / rho; c = C.clone().add(V(-rho * Math.sin(h), 0, -rho * Math.cos(h))); } else { c = Tp.clone().lerp(Wp, L3 > 1e-9 ? (d - L1 - L2) / L3 : 1); h = 0; }
    const hd = V(Math.cos(h), 0, -Math.sin(h)); out.push({ c, h, s: d, grip: c.clone().addScaledVector(hd, lay.x1 + T1HO).setY(T1HY), up: hd.clone() }); }
  out[0].h = P.h; out[out.length - 1].h = 0; return out; };
// ---- the part placed on its trolley's slot / in the world ----
const t1PartAt = (key, kind, W, at, q) => { if (key === 'glass') return paneOfZ(W.door_r, kind, at, q, { pre: paneFrame(W).qUp }); const g = PR.group(); g.add(zMatte(t1Part(key, kind, W))); g.position.copy(at); if (q) g.quaternion.copy(q); g.updateMatrixWorld(true); return g; };
// ---- THE PARTS ON THE CAR: the bonnet (opened on its hinges, gripped at its far edge's middle) and the lid ----
const T1HOOD = () => { const hy = hoodH(HOOD.x0 + 0.05, 0) + 0.01, cx = (HOOD.x0 + HOOD.x1) / 2; return { hinge: V(HOOD.x0, hy, 0), mid: V(cx, hoodH(cx, 0.42) + 0.022, 0) }; };
// the bonnet opened by a (0 shut) about its hinge line and lifted lift along its own plane: its middle and turn
const t1HoodOpen = (a, lift = 0) => { const H = T1HOOD(), q = qAx('z', a), r = H.mid.clone().sub(H.hinge).applyQuaternion(q), up = V(1, 0, 0).applyQuaternion(q); return { at: H.hinge.clone().add(r).addScaledVector(up, lift), q, up }; };
const T1LID = () => { const L = { x0: -2.35, x1: -1.91, y: 0.955 }; return { hinge: V(L.x1, L.y, 0), mid: V((L.x0 + L.x1) / 2, L.y, 0) }; };
const t1LidOpen = (a, lift = 0) => { const H = T1LID(), q = qAx('z', -a), r = H.mid.clone().sub(H.hinge).applyQuaternion(q), up = V(-1, 0, 0).applyQuaternion(q); return { at: H.hinge.clone().add(r).addScaledVector(up, lift), q, up }; };
// ---- the arms in a picture: both on the one bridge (one turn th), each clean (the arm off the parts, its tool 5 cm off them where it
//      can, 10 cm off the lift's column and the car), the two arms apart; A, B: { i, p (the tool's working point), d, up, tool, E, toolCar, lifts } ----
const t1SegDist = (p1, q1, p2, q2) => { const d1 = V().subVectors(q1, p1), d2 = V().subVectors(q2, p2), r = V().subVectors(p1, p2), a = d1.dot(d1), e = d2.dot(d2), f = d2.dot(r); let s, t;
  if (a < 1e-9 && e < 1e-9) return p1.distanceTo(p2); if (a < 1e-9) { s = 0; t = Math.min(1, Math.max(0, f / e)); } else { const c = d1.dot(r); if (e < 1e-9) { t = 0; s = Math.min(1, Math.max(0, -c / a)); } else { const b = d1.dot(d2), den = a * e - b * b;
    s = den > 1e-9 ? Math.min(1, Math.max(0, (b * f - c * e) / den)) : 0; t = (b * s + f) / e; if (t < 0) { t = 0; s = Math.min(1, Math.max(0, -c / a)); } else if (t > 1) { t = 1; s = Math.min(1, Math.max(0, (b - c) / a)); } } }
  return p1.clone().addScaledVector(d1, s).distanceTo(p2.clone().addScaledVector(d2, t)); };
const t1ArmGap = () => { const A = zLinks(0).L, B = zLinks(1).L; let m = 9; A.forEach(a => B.forEach(b => { const d = t1SegDist(a.a, a.b, b.a, b.b) - a.r - b.r; if (d < m) m = d; })); return m; };
// the obstacles of the scene now (the stores, the front regal, the parts, the car, the trolleys (o.extra roots), the lift's column), split
const t1Obs = (st, skip = [], own = [], extra = []) => { const base = zObs(st, skip), more = zMeshes(extra, skip).filter(m => !(m.geometry.type === 'PlaneGeometry' && m.material && (m.material.transparent || m.material.isMeshBasicMaterial))).map(m => { if (!m.geometry.boundingBox) m.geometry.computeBoundingBox(); m.updateMatrixWorld(true);
    return { m, bb: m.geometry.boundingBox, inv: new T.Matrix4().copy(m.matrixWorld).invert(), wb: new T.Box3().copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld) }; });
  return zcSplit(base.concat(more).concat(zLiftObs()), own); };
const T1MG = { mA: 0.05, mG: 0.05, mC: 0.10 };
// one arm's clean pose with the bridge at th (or free when th is null), the carriage on its half; the strict margins first, then the old
// rule (the arm touches nothing, its tool 1 mm), named
const t1Find = (X, th, so, o = {}) => { t1Tool(X.i, X.tool, X.E); const tip = t1TipOf(X.i, X.p, X.d), dths = th == null ? null : [zcAng(th - zEnd(X.i, tip))];
  for (const mg of (o.margs || [T1MG, { mA: 0.0, mG: 0.001, mC: 0.10 }])) for (const lift of (X.lifts || [0, 0.2, 0.35, 0.5])) {
    const r = zFindC(X.i, tip, X.d, Object.assign({ obsP: so.P, obsG: so.G, obsC: so.C, up: X.up, lift, dths, tries: o.tries || 80, toolCar: X.toolCar, ts: o.ts }, mg));
    if (r && !r.bad) return Object.assign(r, { tip, mg, X }); }
  return null; };
const t1PoseArm = (r) => { const X = r.X; t1Tool(X.i, X.tool, X.E); armOnT(X.i, r.th, r.t, r.tip.toArray(), X.d.toArray(), { tool: ZTN[X.i], up: X.up, lift: r.lift }); };
// both arms on one bridge: the turns tried (around both arms' own), the pair with the most room (each arm's gaps, the two arms apart >= 0.25 m)
const t1Pair = (A, B, so, o = {}) => { const tA = zEnd(A.i, t1TipOf(A.i, A.p, A.d)), ths = o.ths || Array.from({ length: 72 }, (_, k) => zcAng(tA + (k - 36) * 5 * T1DEG)); let best = null;
  for (const th of ths) { const ra = t1Find(A, th, so.A || so, o); if (!ra) continue; const rb = t1Find(B, th, so.B || so, o); if (!rb) continue; t1PoseArm(ra); t1PoseArm(rb);
    const gap = t1ArmGap(); if (gap < (o.gapMin || 0.25)) continue; const sc = Math.min(ra.cA, ra.cC - 0.05, rb.cA, rb.cC - 0.05, gap - 0.2) + (ra.mg === T1MG ? 0.05 : 0) + (rb.mg === T1MG ? 0.05 : 0) - (o.thPref ? 0.002 * Math.abs(zcAng(th - o.thPref)) / T1DEG : 0);
    if (!best || sc > best.sc) best = { th, ra, rb, gap, sc }; if (o.first && best) break; }
  if (best) { t1PoseArm(best.ra); t1PoseArm(best.rb); } return best; };
// one arm working, the other resting on its own half (zRest's tool 2.05 m up, out of the work)
const t1One = (A, so, o = {}) => { const r = t1Find(A, o.th == null ? null : o.th, so, o); if (r) t1PoseArm(r); return r; };
// the line under a picture: an arm's exact gaps (to 25 cm) and its elbow over its wrist
const t1Cm = (d) => d >= 0.25 ? '25 cm ali več' : (d * 100).toFixed(1) + ' cm';
const t1Check = (name, X, so) => { t1Tool(X.i, X.tool, X.E); const E = zClearC(X.i, { obsP: so.P, obsG: so.G, obsC: so.C, mA: 0.25, mG: 0.25, mC: 0.25, toolCar: X.toolCar }), k = E.k;
  const tc = X.toolCar === false ? zCarPen(k.L.filter(l => /prijemalo|orodje/.test(l.n)), 0.25) : null;
  const nm = (w) => w && w.m ? ' (' + (w.link || '') + ' ob ' + ((ZNAME_T1 && ZNAME_T1.get(w.m)) || (w.m === (ZCAR && ZCAR.m) ? 'avtu' : w.m.name || 'delu')) + ')' : '';
  return `CHECK ${name}: roka ${X.i + 1} (${{ gripper: 'prijemalo', wrench: 'vijačnik', cup: 'prisesek', edge: 'štirirobno prijemalo', edgeOpen: 'štirirobno prijemalo, odprto' }[X.tool] || X.tool}) komolec ${k.E.y.toFixed(2)} m nad zapestjem ${((k.E.y - k.Wc.y) * 100).toFixed(0)} cm; roka od delov ${t1Cm(E.a.d)}${E.a.d < 0.25 ? nm(E.a) : ''}, orodje od delov ${t1Cm(E.g.d)}${E.g.d < 0.25 ? nm(E.g) : ''}, od stebra in avta ${t1Cm(E.c.d)}${E.c.d < 0.25 ? nm(E.c) : ''}${tc ? `; orodje drži del na avtu (od avta ${tc.d < 0 ? 'se ga dotika' : t1Cm(tc.d)})` : ''}`; };
let ZNAME_T1 = null;
// ---- THE FIRST VIEW CHECK: every trolley magenta, the first view, the canvas' magenta pixels counted, and each trolley's pixels in an ID pass ----
const t1Magenta = (trs) => { const M = new T.MeshBasicMaterial({ color: 0xff00ff, fog: false, side: T.DoubleSide }); M.toneMapped = false;
  trs.forEach(tr => tr.g.traverse(m => { if (m.isMesh) { m.material = M; } if (m.isSprite) m.visible = false; })); };
const t1CountMagenta = async () => { PR.render(); const c = G3.renderer.domElement, url = c.toDataURL('image/png'), img = new Image(); await new Promise(r => { img.onload = r; img.src = url; });
  const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const g = cv.getContext('2d'); g.drawImage(img, 0, 0); const px = g.getImageData(0, 0, cv.width, cv.height).data; let n = 0;
  for (let i = 0; i < px.length; i += 4) if (px[i] > 180 && px[i + 1] < 110 && px[i + 2] > 180 && px[i] - px[i + 1] > 110) n++; return { n, w: cv.width, h: cv.height }; };
// ---- THE PARTS' WAYS (the pictures and the reach test share them): waypoints { at (the part's middle), q (its turn) }, sampled every ds
//      and da; the grip on the part (gL, its edge's point; dL, upL: the tool's way and the jaws' way in the part's frame) ----
const t1Way = (wps, ds = 0.05, da = 3 * T1DEG) => { const out = [{ at: wps[0].at.clone(), q: wps[0].q.clone(), w: 0 }];
  for (let k = 1; k < wps.length; k++) { const A = wps[k - 1], B = wps[k], n = Math.max(1, Math.ceil(Math.max(A.at.distanceTo(B.at) / ds, A.q.angleTo(B.q) / da)));
    for (let j = 1; j <= n; j++) { const u = j / n; out.push({ at: A.at.clone().lerp(B.at, u), q: A.q.clone().slerp(B.q, u), w: k }); } } return out; };
const t1GripOf = (smp, gL, dL, upL) => ({ p: gL.clone().applyQuaternion(smp.q).add(smp.at), d: dL.clone().applyQuaternion(smp.q).normalize(), up: upL.clone().applyQuaternion(smp.q).normalize() });
// THE PANELS' WAYS (bonnet, lid) with the trolley at its working place, given by the GRIP (where the arm holds the part) and the part's
// turn: OFF (the stock one from the car into the empty place): lifted straight up, over the car to beside it (the arm at the gripped
// edge, high over the roof), out beside the car; there it hangs down from the gripped edge (turned about that edge: as one lets a panel
// swing down), turns about the upright through the grip so its face looks at the trolley's front, leans back as in the rack, goes into
// its place's plane past the trolley's open tail end and slides in. ON (the chosen one onto the car): the same way back. gL: the grip in
// the part's frame. TW: where it turns (the grip's place), ax: the part's middle's x when it stands in its place's plane out of the trolley
const T1TW = { hood: { gx: -1.0, gy: 1.87, gz: 2.95, ax: -0.60, swing: 1 }, lid: { gx: -2.35, gy: 1.30, gz: 2.45, ax: -2.45, swing: -1 } };
const t1PanelWays = (key, tr, kOff, kOn, gL1, gL2) => { const P = key === 'hood' ? T1HOOD() : T1LID(), I = new T.Quaternion(), TW = T1TW[key], sOff = tr.slotW(kOff), sOn = tr.slotW(kOn);
  const qA = qAx('z', TW.swing * Math.PI / 2), qB = qAx('y', TW.swing * Math.PI / 2).multiply(qA), qS1 = sOff.q, qS2 = sOn.q, Gt = V(TW.gx, TW.gy, TW.gz);
  const byG = (G, q, gL) => ({ at: G.clone().sub(gL.clone().applyQuaternion(q)), q: q.clone() }), up = (y) => V(0, y, 0);
  const way = (gL, sl, qS) => { const Gc = P.mid.clone().add(gL); return [byG(Gc, I, gL), byG(V(Gc.x, TW.gy, Gc.z), I, gL), byG(V(TW.gx, TW.gy, Gc.z), I, gL), byG(Gt, I, gL), byG(Gt, qA, gL), byG(Gt, qB, gL), byG(Gt, qS, gL),
    { at: V(TW.ax, sl.at.y + 0.03, sl.at.z), q: qS.clone() }, { at: sl.at.clone().add(up(0.03)), q: qS.clone() }, { at: sl.at.clone(), q: qS.clone() }]; };
  const off = way(gL1, sOff, qS1), on = way(gL2, sOn, qS2).reverse(); return { off, on }; };
const t1PanelGrip = (key, gz) => key === 'hood' ? { gL: V((HOOD.x1 - HOOD.x0) / 2, 0, gz), dL: T1DL.hood, upL: V(0, 1, 0) } : { gL: V(-0.22, 0, gz), dL: T1DL.lid, upL: V(0, 1, 0) };
// (where the arms take the panels on their edge: the bonnet roka 1 at +0.45 (the near side), roka 2 at -0.45; the lid both at -0.45: so a
// panel hanging from its edge turns away from the trolley)
const T1GZ = { hood: [0.45, -0.45], lid: [-0.45, -0.45] };
// the glass's ways: BROKEN (roka 1's four-edge gripper on it in the door: out of the door 0.25 m along the glass' normal, up, over the
// trolley's scrap bin turned flat (its outer face up), down into the bin, 7 cm under its rim: the gripper opens there) and NEW (roka 2's
// suction cup on the chosen pane's middle: lifted 0.3 m along its own plane, 0.6 m out over the panes in front, to 0.6 m off the window,
// in): a pane on the trolley stands as in the window (29° back), it does not turn
const t1GlassWays = (tr, W, kNew) => { const E = t1EdgeDef(W), c = E.c, n = NSIDE.clone(), I = new T.Quaternion(), qF = qAx('x', -61 * T1DEG), r0 = E.P0.clone().sub(c), B = tr.lay.bin, bc = tr.toW(V((B.x0 + B.x1) / 2, 0, 0));
  const atFor = (P0, q) => P0.clone().sub(r0.clone().applyQuaternion(q));   // (the pane's middle c for its tool point P0 at turn q)
  const broken = [{ at: c.clone(), q: I }, { at: c.clone().addScaledVector(n, 0.32), q: I }, { at: c.clone().addScaledVector(n, 0.32).add(V(0, 0.2, 0)), q: I },
    { at: atFor(V(bc.x, 1.30, bc.z), qF), q: qF }, { at: atFor(V(bc.x, B.y1 + 0.08, bc.z), qF), q: qF }];   // (over the bin's opening, 8 cm over its rim: the jaws open there and the pane drops in)
  const S = tr.slotW(kNew), PF = tr.lay.pane, qW = qAx('x', -29 * T1DEG), win = c.clone();   // (the pane in the window: built upright about c, turned 29° back: as the car's)
  const nw = [{ at: S.at.clone(), q: S.q }, { at: S.at.clone().addScaledVector(S.upPl, 0.30), q: S.q }, { at: S.at.clone().addScaledVector(S.upPl, 0.30).addScaledVector(S.n, 0.60), q: S.q },
    { at: win.clone().addScaledVector(n, 1.00), q: qW }, { at: win.clone().addScaledVector(n, 0.60), q: qW }, { at: win.clone(), q: qW }];   // (to 1 m off the window, then straight in)
  return { E, broken, nw, r0, qF, gNew: { gL: tr.lay.slots[kNew].gL.clone(), dL: V(0, 0, -1), upL: V(1, 0, 0) } }; };
// the four-edge gripper's tool point on the broken pane at sample smp (its middle c moved to smp.at, turned smp.q)
const t1EdgeGrip = (E, r0, smp) => ({ p: r0.clone().applyQuaternion(smp.q).add(smp.at), d: E.n.clone().negate().applyQuaternion(smp.q), up: E.e1.clone().applyQuaternion(smp.q) });
// ---- A PART'S OWN GAP along its way: its points (the boxes' faces every 3 cm) at each sample against every obstacle's box, the car's
//      surface and the lift's column (as the base's sweep) ----
const t1PtsL = (g, step = 0.03) => { const out = []; g.updateMatrixWorld(true); const inv = new T.Matrix4().copy(g.matrixWorld).invert();
  g.traverse(m => { if (!m.isMesh || !m.geometry || !m.visible || m.geometry.type === 'PlaneGeometry') return; if (!m.geometry.boundingBox) m.geometry.computeBoundingBox(); const b = m.geometry.boundingBox, M = new T.Matrix4().multiplyMatrices(inv, m.matrixWorld);
    const n = [0, 1, 2].map(a => Math.max(1, Math.ceil((b.max.getComponent(a) - b.min.getComponent(a)) / step)));
    for (let i = 0; i <= n[0]; i++) for (let j = 0; j <= n[1]; j++) for (let k = 0; k <= n[2]; k++) { if (!(i === 0 || i === n[0] || j === 0 || j === n[1] || k === 0 || k === n[2])) continue;
      out.push(V(b.min.x + (b.max.x - b.min.x) * i / n[0], b.min.y + (b.max.y - b.min.y) * j / n[1], b.min.z + (b.max.z - b.min.z) * k / n[2]).applyMatrix4(M)); } }); return out; };
const t1BoxGap = (pts, obs) => { let best = { gap: 9, m: null }; if (!pts.length) return best; const bb = new T.Box3().setFromPoints(pts).expandByScalar(0.3), lp = V(), c = V();
  for (const o of obs) { if (!o.wb.intersectsBox(bb)) continue; const b = o.bb; for (const q of pts) { lp.copy(q).applyMatrix4(o.inv); let d;
      if (lp.x > b.min.x && lp.x < b.max.x && lp.y > b.min.y && lp.y < b.max.y && lp.z > b.min.z && lp.z < b.max.z) d = -Math.min(lp.x - b.min.x, b.max.x - lp.x, lp.y - b.min.y, b.max.y - lp.y, lp.z - b.min.z, b.max.z - lp.z);
      else { c.copy(lp).clamp(b.min, b.max).applyMatrix4(o.m.matrixWorld); d = q.distanceTo(c); } if (d < best.gap) best = { gap: d, m: o.m }; } }
  return best; };
// ---- THE CONTINUOUS CHAIN of arm i along samples Q[k] = { p, d, up, set (moves what moves there), toolCar (false: the tool holds a part
//      on the car) }: o.so(k): the obstacles split ({ P, G, C }) with the moving things where they are; at each sample a pose near the
//      previous one (the bridge ±0.08 rad, the carriage ±0.12 m, the mast ±0.1 m), the strict margins (the arm and its tool 5 cm off the
//      parts, 10 cm off the lift's column and the car) or else the old rule (the arm touches nothing, its tool 1 mm, 10 cm); where none, a
//      fresh clean pose and the move to it with the tip held checked as a motion (a re-configuration) ----
const T1OLD = { mA: 0.0, mG: 0.001, mC: 0.10 };
const t1Near = (i, q, prev, so, margs) => { const th0 = zEnd(i, q.tip), dths = [0, -0.04, 0.04, -0.08, 0.08].map(x => zcAng(prev.th + x - th0)), at = Math.abs(prev.t), ts = [0, -0.04, 0.04, -0.08, 0.08, -0.12, 0.12].map(x => +(at + x).toFixed(3)).filter(t => t >= 0.15 && t <= 2.9);
  for (const mg of margs) for (const lift of [prev.lift, Math.max(0, prev.lift - 0.1), Math.min(0.5, prev.lift + 0.1)]) { const r = zFindC(i, q.tip, q.d, Object.assign({ obsP: so.P, obsG: so.G, obsC: so.C, up: q.up, lift, dths, ts, tries: 35, toolCar: q.toolCar }, mg)); if (r && !r.bad) return Object.assign(r, { mg }); }
  return null; };
const t1Fresh = (i, q, so, margs, fam) => { for (const mg of margs) for (const lift of [0, 0.2, 0.35, 0.5]) { const r = zFindC(i, q.tip, q.d, Object.assign({ obsP: so.P, obsG: so.G, obsC: so.C, up: q.up, lift, dths: fam || ZC_DTH, tries: 60, toolCar: q.toolCar }, mg)); if (r && !r.bad) return Object.assign(r, { mg }); } return null; };
const t1PoseAt = (i, q, th, t, lift) => armOnT(i, th, t, q.tip.toArray(), q.d.toArray(), { tool: ZTN[i], up: q.up, lift });
const t1Motion = (i, q, A, B, so) => { const dth = zcAng(B.th - A.th), N = 12, at = (fT, fS, fL) => [A.th + dth * fT, A.t + (B.t - A.t) * fS, A.lift + (B.lift - A.lift) * fL];
  const orders = [['spoti', (s) => at(s, s, s)], ['teleskop, nato most in voziček', (s) => s < 0.5 ? at(0, 0, 2 * s) : at(2 * s - 1, 2 * s - 1, 1)], ['voziček in teleskop, nato most', (s) => s < 0.5 ? at(0, 2 * s, 2 * s) : at(2 * s - 1, 1, 1)], ['most, nato voziček in teleskop', (s) => s < 0.5 ? at(2 * s, 0, 0) : at(1, 2 * s - 1, 2 * s - 1)]];
  for (const [nm, f] of orders) { let ok = true; for (let k = 1; k < N; k++) { const [th, t, lift] = f(k / N); t1PoseAt(i, q, th, t, lift); const z = zPoseOf(i); if (z.k.miss > 0.004 || z.m < 0.1 || !zClearC(i, Object.assign({ obsP: so.P, obsG: so.G, obsC: so.C, toolCar: q.toolCar }, T1OLD)).ok) { ok = false; break; } } if (ok) return nm; }
  return null; };
const t1Exact = (i, q, r, so) => { t1PoseAt(i, q, r.th, r.t, r.lift); const E = zClearC(i, { obsP: so.P, obsG: so.G, obsC: so.C, mA: 0.25, mG: 0.25, mC: 0.25, toolCar: q.toolCar }); return { cA: E.a.d, cG: E.g.d, cC: E.c.d, wA: E.a, wG: E.g, wC: E.c }; };
const t1Chain = (i, Q, o) => { Q.forEach(q => { q.tip = t1TipOf(i, q.p, q.d); }); const margs = [T1MG, T1OLD], tried = []; let best = null;
  const run = (start) => { const poses = [start], re = []; let prev = start, strict = start.mg === T1MG ? 1 : 0; const ex = { cA: 9, cG: 9, cC: 9 }, keep = (r, k) => { const e = t1Exact(i, Q[k], r, o.so(k)); ['cA', 'cG', 'cC'].forEach(a => { if (e[a] < ex[a]) { ex[a] = e[a]; ex['w' + a.slice(1)] = e['w' + a.slice(1)]; ex['k' + a.slice(1)] = k; } }); };
    o.set(0); keep(start, 0);
    for (let k = 1; k < Q.length; k++) { o.set(k); const so = o.so(k); let r = t1Near(i, Q[k], prev, so, margs);
      if (!r) { o.set(k - 1); const so1 = o.so(k - 1); let done = null; for (const fam of ZC_FAM.concat([null])) { const f = t1Fresh(i, Q[k - 1], so1, margs, fam); if (!f) continue; if (Math.abs(zcAng(f.th - prev.th)) < 0.03 && Math.abs(f.t - prev.t) < 0.03 && Math.abs(f.lift - prev.lift) < 0.02) continue;
          const mv = t1Motion(i, Q[k - 1], prev, f, so1); if (!mv) continue; o.set(k); const r2 = t1Near(i, Q[k], f, o.so(k), margs); if (!r2) { o.set(k - 1); continue; } done = { f, r2, mv }; break; }
        o.set(k); if (!done) { const so2 = o.so(k), b = zFindC(i, Q[k].tip, Q[k].d, Object.assign({ obsP: so2.P, obsG: so2.G, obsC: so2.C, up: Q[k].up, lift: prev.lift, tries: 60, toolCar: Q[k].toolCar }, T1OLD)), wn = (w) => w && w.m ? `${w.link} ${(w.d * 100).toFixed(1)} cm ob ${(ZNAME_T1 && ZNAME_T1.get(w.m)) || (ZCAR && w.m === ZCAR.m ? 'AVTO' : 'regal / soba')}` : '-';
          const near = b ? `; najbližja drža (most ${b.th.toFixed(2)}, t ${b.t.toFixed(2)}): roka ${wn(b.wA)}, orodje ${wn(b.wG)}, steber/avto ${wn(b.wC)}` : '; nobena drža ne doseže konice';
          return { ok: false, at: k, n: Q.length - 1, why: 'ni zvezne drže (ne naprej ne s preklopom)' + near + ` (konica ${Q[k].p.toArray().map(v => v.toFixed(2)).join(', ')})`, re, poses, ex, strict }; }
        re.push(`pri ${k - 1}/${Q.length - 1}: most ${prev.th.toFixed(2)}→${done.f.th.toFixed(2)}, t ${prev.t.toFixed(2)}→${done.f.t.toFixed(2)}, teleskop ${prev.lift.toFixed(2)}→${done.f.lift.toFixed(2)} (${done.mv})`); r = done.r2; }
      if (k % (o.exEvery || 2) === 0 || k === Q.length - 1) keep(r, k); if (r.mg === T1MG) strict++; prev = r; poses.push(r); }
    const L = poses.map(p => p.lift), T = poses.map(p => Math.abs(p.t)), Mm = poses.map(p => p.m);
    return { ok: true, n: Q.length - 1, re, poses, ex, strict, lift: [Math.min(...L), Math.max(...L)], tMax: Math.max(...T), mMin: Math.min(...Mm) }; };
  o.set(0); const so0 = o.so(0);
  for (const fam of ZC_FAM.concat([null])) { const s0 = t1Fresh(i, Q[0], so0, margs, fam); if (!s0) continue; if (tried.some(q => Math.abs(zcAng(q.th - s0.th)) < 0.05 && Math.abs(q.t - s0.t) < 0.06 && Math.abs(q.lift - s0.lift) < 0.01)) continue; tried.push(s0);
    const c = run(s0); if (c.ok && (!best || !best.ok || c.re.length < best.re.length)) best = c; else if (!best || (!best.ok && !c.ok && c.at > best.at)) best = c; if (best.ok && !best.re.length) break; o.set(0); }
  return best || { ok: false, at: 0, n: Q.length - 1, why: 'ni čiste začetne drže', re: [], poses: [], ex: { cA: 9, cG: 9, cC: 9 }, strict: 0 }; };
