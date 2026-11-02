// Studio: predogled modela človeka (poze, vloge), elementov, živali in gozdnih elementov na ravni podlagi, brez igre (test-results/ljudje/).
//   node tools/ljudje/studio.mjs people | roles | props | props2 | zoo | forest
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { chromium } from 'playwright';
const DIR = path.dirname(url.fileURLToPath(import.meta.url)), REPO = path.resolve(DIR, '..', '..'), OUTD = path.join(REPO, 'test-results', 'ljudje');
const which = process.argv[2] || 'people';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1400, height: 800 } });
page.on('pageerror', e => console.log('pageerror', e.message)); page.on('console', m => { if (m.type() === 'error') console.log('console', m.text()); });
await page.setContent('<html><body style="margin:0;background:#000"></body></html>');
await page.addScriptTag({ path: path.join(REPO, 'js', 'vendor', 'three.r128.min.js') });
await page.addScriptTag({ path: DIR + '/ljudje3d.js' });
const src = await page.evaluate((which) => {
  const W = 1400, H = 800, r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); r.setSize(W, H); r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap; document.body.appendChild(r.domElement);
  const sc = new THREE.Scene(); sc.background = new THREE.Color(0x9cc3e4); sc.fog = new THREE.Fog(0x9cc3e4, 60, 200);
  sc.add(new THREE.HemisphereLight(0xdfe9ff, 0x4a5a3a, 0.75)); const sun = new THREE.DirectionalLight(0xfff2dd, 0.85); sun.position.set(-8, 14, 10); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, near: 1, far: 60 }); sc.add(sun);
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshLambertMaterial({ color: 0x5f8a3e })); gr.rotation.x = -Math.PI / 2; gr.receiveShadow = true; sc.add(gr);
  const cam = new THREE.PerspectiveCamera(35, W / H, 0.1, 400);
  const L = LJ; L.seed(7);
  if (which === 'people') {
    const poses = ['stand', 'walk', 'run', 'cheer', 'wave', 'phone', 'fence', 'sit', 'sitGround', 'squat', 'jack0', 'grill', 'sweep', 'chopUp', 'carry', 'arms', 'hips', 'drink', 'flagWave', 'crouchCam', 'boardOut', 'direct', 'kneel', 'jump'];
    poses.forEach((p, k) => { const P = L.person({ long: k % 3 === 0, hat: ['cap', null, 'helmet', null, 'beanie', null, 'police', 'fire'][k % 8], vest: k % 5 === 0 ? 0xf07a1c : null });
      L.put(sc, P, (k % 12) * 1.15 - 6.3, 0, Math.floor(k / 12) * -2.6, 0.35); L.pose(P, p, 1.2);
      if (p === 'grill') L.hold(P, 1, 'tongs'); if (p === 'phone') L.hold(P, 1, 'phone'); if (p === 'sweep') L.hold(P, 1, 'broom'); if (p === 'chopUp') L.hold(P, 1, 'axe'); if (p === 'carry') L.hold(P, 1, 'tire');
      if (p === 'drink') L.hold(P, 1, 'cup'); if (p === 'flagWave') L.hold(P, 1, 'mflag'); if (p === 'crouchCam') L.hold(P, 1, 'camera'); if (p === 'boardOut') L.hold(P, 1, 'board'); if (p === 'direct') L.hold(P, 1, 'baton');
      if (p === 'sit') { const c = L.chair(0x2f63c9); c.position.set((k % 12) * 1.15 - 6.3, 0, Math.floor(k / 12) * -2.6 - 0.05); c.rotation.y = 0.35; sc.add(c); } });
    cam.position.set(0, 2.6, 9.5); cam.lookAt(0, 0.9, -1.3);
  } else if (which === 'roles') {
    const R = [
      { shirt: 0xf07a1c, pants: 0xf07a1c, long: true, hat: 'cap', hatCol: 0xf07a1c, vest: null, belt: 0xd9dde2 },   // maršal (oranžen kombinezon)
      { shirt: 0x2c2f38, pants: 0x2c2f38, long: true, hat: 'fire', hatCol: 0xd8262a, vest: 0x2c2f38, stripes: 0xe8d84a },   // gasilec
      { shirt: 0x1f2c48, pants: 0x1f2c48, long: true, hat: 'police', hatCol: 0x1f2c48, vest: 0xd9f02a },   // policist
      { shirt: 0x15171c, pants: 0x15171c, long: false, hat: null, hair: 'bald', vest: 0xf5e21a, stripes: 0xc9ccd2 },   // varnostnik
      { shirt: 0x1f63d8, pants: 0x1f63d8, long: true, hat: 'cap', hatCol: 0x15171c, belt: 0xf2f2f2 },   // mehanik
      { shirt: 0xf2f2f2, pants: 0x1f2c48, long: false, hat: null, vest: 0x2a9a3a, stripes: 0xf2f2f2 },   // reševalec
      { shirt: 0x5b5040, pants: 0x3a4a3a, long: true, hat: 'cap', hatCol: 0x15171c },   // fotograf
      { shirt: 0xd23a2c, pants: 0x2f3f63, long: false, hat: 'cap', hatCol: 0xd23a2c },   // navijač
      { shirt: 0x2f9a48, pants: 0x47494f, long: false, shorts: true, hair: 'pony' },   // navijačica
      { kid: true, shirt: 0xf0c22e, pants: 0x2f63c9, long: false, shorts: true },   // otrok
      { shirt: 0xb8bcc4, pants: 0x6a6f78, long: true, hat: 'beanie', hatCol: 0x8a3b8c, hair: 'long' },   // babica
    ];
    R.forEach((o, k) => { const P = L.person(o); L.put(sc, P, k * 1.05 - 5.2, 0, 0, 0.25); L.pose(P, ['flagWave', 'arms', 'direct', 'hips', 'carry', 'talk', 'cam', 'cheer', 'phone', 'wave', 'relax'][k], 1);
      if (k === 0) L.hold(P, 1, 'mflag'); if (k === 2) L.hold(P, 1, 'baton'); if (k === 4) L.hold(P, 1, 'tire'); if (k === 6) L.hold(P, 1, 'camera'); if (k === 8) L.hold(P, 1, 'phone'); });
    cam.position.set(0, 1.8, 7.5); cam.lookAt(0, 1.0, 0);
  } else if (which === 'zoo') {
    const kinds = Object.keys(L.SPECIES);
    kinds.forEach((k, i) => { const a = L.animal(k); a.position.set((i % 10) * 2.6 - 11.7, 0, Math.floor(i / 10) * 3.2 - 4); a.rotation.y = 0.9; sc.add(a); });
    cam.position.set(0, 9, 17); cam.lookAt(0, 0.6, -0.5); cam.fov = 45; cam.updateProjectionMatrix();
  } else if (which === 'forest') {
    const items = [[L.huntStand(), -14, 0, 0.3], [L.feedRack(), -9, 0, 0.2], [L.logPile(5), -3.5, 0, 0.2], [L.fallenTree(6), 1, 0, 0.4], [L.stump(), 8, 1, 0], [L.cabin(), 11.5, 0, -0.3], [L.beehive(), -14, 7, 0.2], [L.hayrack(), -6, 7, 0.1],
      [L.waterTank(), 1, 7, 0], [L.windpump(), 5, 7, 0.4], [L.vending(), 9, 7, 0.3], [L.torii(), 13, 7, 0.2], [L.stoneLantern(), 16, 7, 0], [L.cactus(), -16, 12, 0], [L.mushroomRing(), -12, 12, 0], [L.signPost(), -9, 12, 0.3]];
    for (const [o, x, z, ry] of items) { o.position.set(x, 0, z); o.rotation.y = ry; sc.add(o); }
    Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, far: 100 }); sun.shadow.camera.updateProjectionMatrix();
    cam.position.set(0, 14, 28); cam.lookAt(0, 1, 5); cam.fov = 45; cam.updateProjectionMatrix();
  } else if (which === 'props2') {
    const items = [[L.parasol(0xd8262a), -16, -4, 0], [L.flagPole(), -13, -4, 0], [L.bike(), -10, -4, 0.3], [L.hammock(), -6, -4, 0], [L.kidPool(), -2, -4, 0], [L.stringLights(4, 2.2), 2, -4, 0], [L.gasBottle(), 5, -4, 0], [L.trashBag(), 6, -4, 0], [L.bin(), 7, -4, 0],
      [L.portaloo(), 9, -4, 0.3], [L.beerSet(), 12.5, -4, 0.2], [L.van(), 18, -4, 0.3], [L.tractor(), -15, 3, 0.3], [L.trampoline(), -10, 3, 0], [L.bigScreen(), -4, 2, 0], [L.quad(), 1, 3, 0.4], [L.scooter(), 3.5, 3, 0.4], [L.cone(), 5, 3, 0], [L.cone(), 5.6, 3.3, 0],
      [L.fanBanner(), 9, 3, 0], [L.mower(), 12, 3, 0.3], [L.wheelbarrow(), 13.5, 3, 0.3], [L.fridge(), 15, 3, 0], [L.pullBar(), 17, 3, 0], [L.dumbbell(), 18.5, 3, 0], [L.beanBag(), 19.5, 3, 0], [L.mailbox(), -15, 9, 0], [L.flowerBed(), -12, 9, 0], [L.shed(), -8, 9, 0.3],
      [L.pitStand(), -1, 9, 0], [L.mediaVan(), 6, 9, 0.3], [L.hoseLine(5), 10, 9, 0], [L.heras(10), 17, 9, 0]];
    for (const [o, x, z, ry] of items) { o.position.set(x, 0, z); o.rotation.y = ry; sc.add(o); }
    Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, far: 100 }); sun.shadow.camera.updateProjectionMatrix();
    cam.position.set(0, 16, 30); cam.lookAt(0, 0, 3); cam.fov = 45; cam.updateProjectionMatrix();
  } else {
    const items = [[L.motorhome(0x2f63c9), -14, -6, 0.3], [L.caravan(0xd8262a), -2, -6, 0.3], [L.car(0x7c8a99), 4.2, -6.5, 0.3], [L.tentDome(0xf07a1c), 9, -4, 0], [L.tentRidge(0x2f9a48), 12, -6, 0.4],
      [L.gazebo(0x2f63c9), -9, 3, 0.2], [L.campfire(), -3.5, 3, 0], [L.logBench(), -3.5, 4.6, 0], [L.grillKettle(), 0, 3, 0], [L.table(), 2, 3, 0], [L.chair(0xd8262a), 3.2, 3, 0.4], [L.cooler(), 4, 2.4, 0],
      [L.tvSet(), -9, 3, 0], [L.sofa(0x7c4a2e), -9, 5, Math.PI], [L.generator(), -11, 1.8, 0], [L.satDish(), -11.5, 3.5, 0], [L.boombox(), 6, 3, 0], [L.mat(0x8a3b8c), 7.5, 3, 0],
      [L.house(), 18, 6, -0.4], [L.picketFence(8), 18, 10, -0.4], [L.clothesline(), 25, 4, -0.4], [L.woodpile(), 13, 7, 0.2], [L.swing(), 25, 9, 0], [L.dog(), 22, 10, 0.3], [L.bench(), 15, 9, 0.2],
      [L.scaffold(), 30, -4, 0], [L.marshalPost(), -20, 4, 0.3], [L.fireTruck(), -26, -6, 0.3], [L.gate(), 0, 14, 0], [L.policeBike(), 6, 14, 0.4], [L.car(0xf2f2f2, { bar: 0x2f6bff, stripe: 0x1f4aa8 }), 10, 14, 0.4],
      [L.foodTruck(), -10, 14, 0], [L.highTable(), -5, 15, 0], [L.pitWall(12), 22, 16, 0], [L.tyreStack(4), 16, 18, 0], [L.warmers(0xd8262a), 18, 18, 0], [L.toolChest(), 20, 18, 0], [L.teamTruck(0x1f63d8), 22, 24, 0], [L.stand(16, 8), -24, 18, 0]];
    for (const [o, x, z, ry] of items) { o.position.set(x, 0, z); o.rotation.y = ry; sc.add(o); }
    Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, far: 120 }); sun.shadow.camera.updateProjectionMatrix();
    cam.position.set(0, 26, 52); cam.lookAt(0, 0, 6); cam.fov = 45; cam.updateProjectionMatrix();
  }
  r.render(sc, cam); return r.domElement.toDataURL('image/png');
}, which);
fs.mkdirSync(OUTD, { recursive: true }); fs.writeFileSync(path.join(OUTD, 'studio-' + which + '.png'), Buffer.from(src.split(',')[1], 'base64'));
await browser.close();
console.log('ok', which);
