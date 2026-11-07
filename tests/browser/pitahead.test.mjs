// The car ahead in for its stop on the team radio (104; Bathurst, Avstralija, a long race: 4 laps, the rivals' strategies; the player on
// autopilot): when the car right ahead of the player (here within 5 s, the rivals the hardest; the engineer tells it within 6 s) will stop at its next way in (its
// plan: Core Race.pitNext; here it is asked in, as its strategy would), the engineer says so once, while it is still short of its way in:
// "Avto pred tabo (K. Weber) gre v tem krogu v bokse." (English: "Car ahead (K. Weber) boxing this lap."; his voice: "Car ahead boxing
// this lap."), with the overcut's hint when staying out a lap would gain the place (Core Race.pitDuel); that car then stops at that way
// in. The engineer's voice asked for each such line (Comm: radioAhead, radioAheadOver). With the team radio off (Nastavitve · Radio
// ekipe): nothing.
//   node tests/browser/pitahead.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('the car ahead in for its stop (team radio)');
const srv = await serve();
const browser = await launch();
try {
  const run = async (radio) => {
    const { page, errors, ctx } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase', weather: 'dry', radio, length: 'long', difficulty: 2 }, { width: 390, height: 844 }, { seed: 17 });
    await startTrack(page, 'bathurst');
    const out = await page.evaluate(async () => {
      const g = window.__game, R = g.race, P = R.player, Tk = R.track, keys = [];
      const o = Comm.teamRadio; Comm.teamRadio = function (k, v) { keys.push(k); return o.call(this, k, v); };
      let A = null, q0 = null, said = null, lapIn = null, n0 = 0, k0 = 0, nA = null, kA = null;
      for (let k = 0; k < 900; k++) {
        g.pause(); g.sim(0.5, true); if (!P.inPit && !P.finished && (P.stuckT > 3 || P.wrongT > 3)) R.rescue(P); g.resume();
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        const O = R.order, i = O.indexOf(P), B = i > 0 ? O[i - 1] : null
        if (!A && B && P.lap >= 2 && P.lap < R.laps && (!R.mk || (R.gap(B, P) != null && R.gap(B, P) < 5))) { const q = R.pitNext(B); if (q && q.to > 900 && q.to < Tk.len - 900 && !q.now) { A = B; A.pitWant = true; n0 = g.teamRadio.log.filter(x => /^Avto pred tabo/.test(x)).length; k0 = keys.length; q0 = { n: q.n, lap: A.lap, to: Math.round(q.to), at: q.n * Tk.len + Tk.def.pit[1] }; } }   // (asked in, as its strategy would)
        if (A && !said) { const t = g.teamRadio.log.filter(x => /^Avto pred tabo/.test(x)).slice(n0).find(x => x.startsWith('Avto pred tabo (' + A.name + ') gre v tem krogu v bokse.')); if (t) said = { t, ahead: R.order[R.order.indexOf(P) - 1] === A, to: R.pitNext(A) && Math.round(R.pitNext(A).to) }; }
        if (A && A.inPit && nA == null) { const L = g.teamRadio.log.filter(x => /^Avto pred tabo/.test(x)).slice(n0); nA = L.filter(x => x.includes('(' + A.name + ')')).length; kA = { all: L.length, k: keys.slice(k0).filter(k => /^radioAhead/.test(k)) }; }
        if (A && A.inPit && lapIn == null) lapIn = Math.round(A.dist - q0.at);   // (where it went in against that way in, m)
        if (A && lapIn != null && !A.inPit) break;
        if (!A && P.lap >= R.laps) break;
      }
      return { A: A && A.name, q0, said, lapIn, n: nA, nAll: (g.teamRadio.log || []).filter(x => /^Avto pred tabo/.test(x)).length, keys: kA ? kA.k : [], kAll: kA ? kA.all : 0, mk: !!R.mk };
    });
    const en = await page.evaluate(() => { Lang.set('en'); const tr = Lang.tr, a = tr('Avto pred tabo ({0}) gre v tem krogu v bokse.', 'K. Weber'), b = tr('Ostani zunaj še en krog: overcut bi ti moral prinesti mesto.'), c = tr('Avto pred tabo ({0}) gre v naslednjem krogu v bokse. Pridi v bokse v tem krogu za undercut.', 'K. Weber'); Lang.set('sl'); return [a, b, c]; });
    await ctx.close();
    return Object.assign(out, { en, errors });
  };
  const on = await run(1);
  T.check('the car right ahead asked in on its lap: the engineer says so once, while it is still short of its way in', !!on.A && !!on.said && on.said.ahead && on.n === 1 && on.said.to >= 150,
    JSON.stringify({ A: on.A, q0: on.q0, said: on.said, n: on.n }));
  T.check('... and that car stops on that lap', on.lapIn != null && Math.abs(on.lapIn) < 120, JSON.stringify({ q0: on.q0, lapIn: on.lapIn }));
  T.check('in English: "Car ahead boxing this lap." (and the hints)', on.en[0] === 'Car ahead (K. Weber) boxing this lap.' && /overcut/.test(on.en[1]) && /undercut/.test(on.en[2]), on.en.join(' | '));
  T.check('the engineer\'s voice asked for the line (Comm.teamRadio radioAhead or radioAheadOver)', on.keys.length >= 1 && on.keys.every(k => /^radioAhead(Over)?$/.test(k)), on.keys.join(','));
  const off = await run(0);
  T.check('the team radio off: nothing said', !!off.A && !off.said && off.nAll === 0 && !off.keys.length, JSON.stringify({ A: off.A, n: off.n }));
  T.check('no page errors', !on.errors.length && !off.errors.length, on.errors.concat(off.errors).slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close(); await srv.close();
}
T.done();
