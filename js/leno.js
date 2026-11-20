// I17 korak 4 (docs/hitro-nalaganje.md): scripts loaded only when needed. A lazy script is a <link rel="x-lazy-script" data-lazy="<key>"
// href="js/…"> in index.html (tools/stamp.js stamps and merges its href like any other link, sw.js linked() keeps it offline), so the
// loader always takes the stamped href from the link and never builds a path of its own. Keys: proga-<id> for a track's full file
// (Core.loadTrack), svet-<name> for a world builder (korak 5), the new map's own (newmap, nv…; js/game.js still loads those itself).
//   Leno.load(key)        → Promise, resolved once the script has run; one request per key however often it is asked for; on an error
//                           (no network and no copy in the service worker) it rejects with an Error whose .leno is the key, and the next
//                           call tries again
//   Leno.loadSeq([keys])  → Promise, run in the order given (a builder's helpers before the builder): all asked at once, the scripts'
//                           async=false keeps their order of running, so 54 world files take one round of requests, not 54 one after
//                           another with a frame drawn between each (tests: World.needAll() 17–33 s; a phone: World.need's few files)
//   Leno.has(key)         → true once the script has run (or when the page has no such link: nothing to wait for)
//   Leno.keys(prefix)     → the keys of the page's lazy links (all, or those starting with prefix)
// In Node (no document) everything counts as loaded: tests/lib/core.js reads the lazy files with the others.
var Leno = Leno || (function () {
  'use strict';
  const done = {}, busy = {};
  const doc = typeof document !== 'undefined' ? document : null;
  const link = (k) => doc ? doc.querySelector('link[rel="x-lazy-script"][data-lazy="' + k + '"]') : null;
  function has(k) { return !!done[k] || !link(k); }
  function load(k) {
    if (has(k)) return Promise.resolve(k);
    if (busy[k]) return busy[k];
    return (busy[k] = new Promise((ok, no) => {
      const sc = doc.createElement('script');
      sc.src = link(k).getAttribute('href');
      sc.async = false;
      sc.onload = () => { done[k] = true; delete busy[k]; ok(k); };
      sc.onerror = () => { delete busy[k]; sc.remove(); const e = new Error('lazy script not loaded: ' + k); e.leno = k; no(e); };
      doc.head.appendChild(sc);
    }));
  }
  function loadSeq(ks) { return Promise.all(ks.map(load)).then(() => ks); }
  function keys(prefix) {
    if (!doc) return [];
    return [...doc.querySelectorAll('link[rel="x-lazy-script"][data-lazy]')].map(l => l.getAttribute('data-lazy')).filter(k => !prefix || k.startsWith(prefix));
  }
  return { load, loadSeq, has, keys };
})();
