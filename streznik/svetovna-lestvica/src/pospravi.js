// The daily clean-up (wrangler.toml, crons; docs/svetovna-lestvica.md, »Kaj se shrani« and »Hramba«; README.md here, »Brisanje«): the
// ended limits (with them the hashed IPs, at most 48 hours old) and the marks of deleted players; a run waiting 30 days rejected (the job
// did not get to it); a banned player's runs rejected; the players with no run in 24 months deleted with all of theirs (200 a day);
// runs whose player is gone deleted; a rejected run deleted 30 days after (the player sees why meanwhile); a player's runs no faster than
// their best and the objects past the first 100 (skupno.js odvecni, obrezi); the objects R2 did not delete before. Suspicious runs wait
// for the admin. About 26 queries (the free plan allows 50); a log line with counts only.
import { DAY } from './ovoj.js';
import { zapisiPoti, brisiPoti, odvecni, obrezi, kesBrisi, V_SEZNAMU } from './skupno.js';

export const CAKA_MS = 30 * DAY, ZAVRNJENO_MS = 30 * DAY, NEAKTIVEN_MS = 730 * DAY, NAENKRAT = 200, BRISANJE = 1000;

export async function pospravi(env, now) {
  const D = env.DB, s = JSON.stringify, m0 = now - NEAKTIVEN_MS;
  // the players to delete and the runs with no player, picked first (each by its index; the batch checks the players again: one sent a run meanwhile stays)
  const [st, si] = await D.batch([
    D.prepare(`SELECT id FROM igralci WHERE zadnjic <= ?1 ORDER BY zadnjic, id LIMIT ${NAENKRAT}`).bind(m0),
    D.prepare(`SELECT st FROM casi WHERE igralec NOT IN (SELECT id FROM igralci) LIMIT ${BRISANJE}`),
  ]);
  const stari = s(st.results.map(x => x.id)), sirote = s(si.results.map(x => x.st));
  const STARI = 'SELECT id FROM igralci WHERE id IN (SELECT value FROM json_each(?1)) AND zadnjic <= ?2';
  const BRISI = `igralec IN (${STARI}) OR st IN (SELECT value FROM json_each(?3)) OR (stanje = 'zavrnjeno' AND COALESCE(preverjen, oddan) <= ?4)`;
  const PREPOVED = `stanje <> 'zavrnjeno' AND igralec IN (SELECT id FROM igralci WHERE prepoved = 1)`;
  const r = await D.batch([
    D.prepare('DELETE FROM omejitve WHERE konec <= ?1').bind(now),
    zapisiPoti(env, `stanje = 'caka' AND oddan <= ?1`, now - CAKA_MS),
    D.prepare(`UPDATE casi SET stanje = 'zavrnjeno', razlog = 'potekel', preverjen = ?2, duh = 0, posnetek = 0 WHERE stanje = 'caka' AND oddan <= ?1`).bind(now - CAKA_MS, now),
    zapisiPoti(env, PREPOVED),
    D.prepare(`UPDATE casi SET stanje = 'zavrnjeno', razlog = 'prepoved', preverjen = ?1, duh = 0, posnetek = 0 WHERE ${PREPOVED}`).bind(now),
    zapisiPoti(env, BRISI, stari, m0, sirote, now - ZAVRNJENO_MS),
    D.prepare(`DELETE FROM casi WHERE ${BRISI}`).bind(stari, m0, sirote, now - ZAVRNJENO_MS),
    D.prepare(`DELETE FROM prijave WHERE prijavitelj IN (${STARI}) OR prijavljen IN (${STARI})`).bind(stari, m0),
    D.prepare(`DELETE FROM igralci WHERE id IN (SELECT value FROM json_each(?1)) AND zadnjic <= ?2`).bind(stari, m0),
  ]);
  const objekti = await brisiPoti(env, { results: [...r[1].results, ...r[3].results, ...r[5].results] });
  const odv = await odvecni(env, null), obr = await obrezi(env, null);
  // the objects left from before (R2 failed, a request stopped halfway): a thousand a day
  let ostanki = 0;
  try {
    const p = (await D.prepare(`SELECT pot FROM brisanje LIMIT ${BRISANJE}`).all()).results.map(x => x.pot);
    if (p.length) { await env.R2.delete(p); await D.prepare(`DELETE FROM brisanje WHERE pot ${V_SEZNAMU}`).bind(s(p)).run(); ostanki = p.length; }
  } catch (_) { }
  const n = { omejitve: r[0].meta.changes, potekli: r[2].meta.changes, prepoved: r[4].meta.changes, casi: r[6].meta.changes, igralci: r[8].meta.changes, objekti, odvecni: odv, obrezani: obr, ostanki };
  if (n.potekli || n.prepoved || n.casi || n.igralci || odv || obr) kesBrisi(env);
  console.log(`pospravi: ${Object.entries(n).map(([k, v]) => `${k} ${v}`).join(', ')}`);
  return n;
}
