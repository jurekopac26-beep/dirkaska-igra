// a car of the game in the showroom's light, from its right side (nose to the right), on black and on white: alfa.py makes the
// transparent picture from the two. Usage: node avto.mjs <model id> <colour hex> <out name>  (e.g. truck e8891c car_truck)
// background (two shots, on black and on white: the difference is the alpha). argv: model id, colour (hex), out name
import { serve, launch } from '../../../tests/browser/lib.mjs';
import fs from 'node:fs';
import os from 'node:os';
const OUT = (process.env.OUT || os.tmpdir() + '/maketa-izbira-proge') + '/', [id, col, nm] = [process.argv[2] || 'rally', parseInt(process.argv[3] || '1c5fd6', 16), process.argv[4] || 'car'];
fs.mkdirSync(OUT, { recursive: true });
const srv = await serve(), browser = await launch();
const page = await (await browser.newContext({ viewport: { width: 800, height: 450 } })).newPage();
const raw = JSON.stringify({ sound: 0, comm: 0, quali: 0, faults: 0, hlv: 0, quality: 'high', shadows: 1 });
await page.addInitScript((raw) => { localStorage.setItem('tdgp-defaults-v2', '1'); localStorage.setItem('tdgp-defaults-v3', '1'); localStorage.setItem('tdgp-noadapt', '1'); localStorage.setItem('tdgp-settings', raw); }, raw);
await page.goto(srv.base + '/');
await page.waitForFunction(() => window.__game && typeof Render !== 'undefined', null, { timeout: 180000 });
await page.waitForTimeout(1500);
const shots = await page.evaluate(([id, col]) => {
  const M = Core.MODELS.find(m => m.id === id), a = -0.42, el = 9 * Math.PI / 180, D = 13, cy = (M.hgt || 1.3) * 0.45;
  const cam = { p: [D * Math.sin(-a) * Math.cos(el), cy + D * Math.sin(el), D * Math.cos(a) * Math.cos(el)], t: [0, cy, 0], fov: 24 };
  const one = (bg) => Render.carShot({ id, color: col, num: 7, w: 1600, h: 900, cam, bg, floor: false, blob: false, grid: false }).toDataURL('image/png');
  const side = (bg) => Render.carShot({ id, color: col, num: 7, w: 1600, h: 900, view: 'side', at: [0, 1], span: 2.2, bg, floor: false, blob: false, grid: false }).toDataURL('image/png');
  return { k: one(0x000000), w: one(0xffffff), sk: side(0x000000), sw: side(0xffffff), cam, info: { len: M.len, wid: M.wid, hgt: M.hgt || null } };
}, [id, col]);
fs.writeFileSync(OUT + nm + '_k.png', Buffer.from(shots.k.split(',')[1], 'base64'));
fs.writeFileSync(OUT + nm + '_w.png', Buffer.from(shots.w.split(',')[1], 'base64'));
fs.writeFileSync(OUT + nm + '_sk.png', Buffer.from(shots.sk.split(',')[1], 'base64'));
fs.writeFileSync(OUT + nm + '_sw.png', Buffer.from(shots.sw.split(',')[1], 'base64'));
fs.writeFileSync(OUT + nm + '_cam.json', JSON.stringify({ cam: shots.cam, info: shots.info }));
console.log(id, JSON.stringify(shots.info));
await browser.close(); await srv.close();
