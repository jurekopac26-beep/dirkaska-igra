// Koliko dirk samodejnega voznika z nastavitvami testa browser/tester (testna proga iz testa, kratka dirka, poškodbe Vklop, trki »Kot zdaj«)
// se konča z zaslonom KONEC IGRE (odpadlo kolo ali ugasnjen motor) namesto z izidi. Vsaka dirka svoja stran in svoje seme Math.random.
//   DREVO=<drevo igre> N=30 SEME=5000 [KOLO=0] node tools/trki/preverjanje/krog-28-11/tester/konec-igre.mjs   (DREVO privzeto repozitorij; knjižnica testov je vedno iz repozitorija)
import { serve, launch, openGame, startTrack } from '../../../../../tests/browser/lib.mjs';

const E = process.env, N = +(E.N || 30), S0 = +(E.SEME || 5000), PROGA = E.PROGA || 'jezero';
const srv = await serve(E.DREVO || undefined), browser = await launch();
const sum = { n: 0, izidi: 0, konecIgre: 0, kolo: 0, motor: 0, drugo: 0 };
try {
  for (let i = 0; i < N; i++) {
    let ctx = null;
    try {
      const o = await openGame(browser, srv.base + '/index.html', { length: 'short' }, undefined, { seed: S0 + i }); ctx = o.ctx; const page = o.page;
      await page.waitForFunction(() => window.__game.screen === 'title', null, { timeout: 180000 });
      if (E.KOLO === '0') await page.evaluate(() => { window.__game.S.wheelOver = 0; });   // (»Odpadlo kolo: Dirka teče naprej«, kot tests/browser/lang.test.mjs; samo veja)
      await startTrack(page, PROGA);
      const r = await page.evaluate((max) => {   // (zanka kot driveToResults v tests/browser/lib.mjs)
        const g = window.__game; g.pause();
        for (let k = 0; k < max && g.phase !== 'done'; k++) { g.sim(2, true); const P = g.race && g.race.player; if (P && !P.inPit && !P.finished && (P.stuckT > 3 || P.wrongT > 3)) g.race.rescue(P); }
        const P = g.race && g.race.player, W = P && P.wreck, Q = W && W.rule;
        return { faza: g.phase, zaslon: g.screen, t: +g.race.time.toFixed(1), krog: P.lap, cilj: !!P.finished, skoda: +(P.dmg || 0).toFixed(2), kolesa: W ? W.nL || 0 : 0, konec: !!(Q && Q.over), zakaj: (Q && Q.why) || '',
          motor: P.eng ? { h: +P.eng.h.toFixed(2), ugasnil: !!P.eng.dead } : null };
      }, 300);
      sum.n++;
      if (r.zaslon === 'results') sum.izidi++;
      else if (r.zaslon === 'over') { sum.konecIgre++; if (r.zakaj === 'engine') sum.motor++; else if (r.kolesa) sum.kolo++; }
      else sum.drugo++;
      console.log(JSON.stringify(Object.assign({ seme: S0 + i }, r)));
    } catch (e) { sum.n++; sum.drugo++; console.log(JSON.stringify({ seme: S0 + i, napaka: String(e && e.message).slice(0, 200) })); }
    if (ctx) await ctx.close().catch(() => {});
  }
} finally {
  await browser.close(); await srv.close();
}
console.log('SKUPAJ ' + JSON.stringify(sum));
