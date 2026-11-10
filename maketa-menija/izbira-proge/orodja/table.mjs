// every country's sign (table.html): the plain one and six ways to show its flag. Usage: node table.mjs '[["Germany","GERMANY","title","subtitle",true,"out.png"], …]'
// (the fifth value: an EU member, whose fifth way is the EU's border sign)
import { serve, launch } from '../../../tests/browser/lib.mjs';
const C = JSON.parse(process.argv[2]);
const srv = await serve(), browser = await launch();
const page = await (await browser.newContext({ viewport: { width: 800, height: 900 }, deviceScaleFactor: 2 })).newPage();
page.on('pageerror', e => console.log('pageerror', e.message));
for (const [key, name, title, sub, eu, out] of C) {
  await page.goto(srv.base + '/maketa-menija/izbira-proge/table.html'); await page.waitForFunction(() => window.TABLE2 && window.WXFX);
  await page.evaluate(async (a) => { await document.fonts.ready; return window.TABLE2(...a); }, [key, name, title, sub, eu]); await page.waitForTimeout(300);
  await page.screenshot({ path: out, fullPage: true }); console.log(out);
}
await browser.close(); await srv.close();
