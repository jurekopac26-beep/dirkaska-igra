// The world leaderboard's keeper (Svetovna lestvica, seja 3; docs/svetovna-lestvica.md, »Vzdevki«, »Izbris podatkov«; streznik/svetovna-lestvica/
// README.md, »Skrbnik«): the reported nicknames, the suspicious runs and the banned players listed; a nickname hidden or shown again, a player
// banned or allowed, a suspicious run taken or a run rejected, a player deleted with everything (a request by e-mail, GDPR). Works on the
// server's D1 through wrangler with the same Cloudflare key as the deployment; no other password. The objects in R2 of a rejected run or a
// deleted player are written to brisanje and the daily clean-up deletes them (pospravi.js); a board's answers are kept 60 s.
//   node tools/lestvica-skrbnik.mjs seznam | preglej <id> | skrij <id> | pokazi <id> | prepovej <id> | dovoli <id>
//                                   | sprejmi <st> | zavrni <st> [razlog] | izbrisi <id>   [--suho] [--lokalno]
// --suho: only the SQL printed; --lokalno: the local D1 of `wrangler dev` (--local) instead of the server's (--remote)
import url from 'node:url';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ID_RE = /^[\w-]{12}$/, ST_RE = /^[1-9]\d{0,14}$/, RAZLOG_RE = /^[\w .,:;()%-]{1,80}$/;   // (src/ovoj.js ID_RE, src/preveri.js RAZLOG_RE)
const DAY = 864e5, IZBRISAN_MS = 3 * DAY;   // (src/zahtevki.js: a deleted player's mark, 3 days)
const MAPA = path.join(path.dirname(url.fileURLToPath(import.meta.url)), '..', 'streznik', 'svetovna-lestvica');
export const UKAZI = ['seznam', 'preglej', 'skrij', 'pokazi', 'prepovej', 'dovoli', 'sprejmi', 'zavrni', 'izbrisi'];
const RABA = 'raba: node tools/lestvica-skrbnik.mjs ' + UKAZI.join(' | ') + ' [id | st] [razlog] [--suho] [--lokalno]';

// a value checked before it goes into the SQL (only ids, numbers and the reason's letters: nothing to escape)
const q = (s) => `'${s}'`;
function idIz(v) { if (typeof v !== 'string' || !ID_RE.test(v)) throw new Error(`id igralca: 12 znakov (A-Z, a-z, 0-9, _ -)\n${RABA}`); return q(v); }
function stIz(v) { if (typeof v !== 'string' || !ST_RE.test(v)) throw new Error(`st časa: celo število od 1\n${RABA}`); return v; }
// the objects of the runs that pogoj picks written to brisanje (the same statement as src/skupno.js zapisiPoti)
const poti = (pogoj) => `INSERT OR REPLACE INTO brisanje (pot) SELECT 'posnetki/' || kljuc || '/' || st || '.vnos' FROM casi WHERE posnetek = 1 AND (${pogoj}) UNION ALL SELECT 'posnetki/' || kljuc || '/' || st || '.duh' FROM casi WHERE duh = 1 AND (${pogoj})`;
const pregledane = (id) => `UPDATE prijave SET pregledana = 1 WHERE prijavljen = ${id}`;

// a command's statements, in the order they run (a stop halfway leaves nothing that the clean-up does not find) → { sql: [...], opis }
export function ukaz(args, now = Date.now()) {
  const [u, a, ...r] = args;
  switch (u) {
    case 'seznam': return { opis: 'prijavljeni vzdevki (nepregledane prijave), sumljivi časi, prepovedani igralci', sql: [
      `SELECT g.id, g.ime, g.skrit, g.prepoved, COUNT(*) prijav FROM prijave p JOIN igralci g ON g.id = p.prijavljen WHERE p.pregledana = 0 GROUP BY g.id ORDER BY prijav DESC, g.id LIMIT 100`,
      `SELECT c.st, c.kljuc, c.igralec, g.ime, c.ms, c.razlog, c.oddan FROM casi c JOIN igralci g ON g.id = c.igralec WHERE c.stanje = 'sumljivo' ORDER BY c.oddan, c.st LIMIT 100`,
      `SELECT id, ime, skrit FROM igralci WHERE prepoved = 1 ORDER BY id LIMIT 100`,
    ] };
    case 'preglej': { const id = idIz(a); return { opis: 'igralec, njegovi časi in prijave', sql: [
      `SELECT id, ime, skrit, prepoved, ustvarjen, zadnjic FROM igralci WHERE id = ${id}`,
      `SELECT st, kljuc, ms, stanje, razlog, priblizno, oddan, preverjen FROM casi WHERE igralec = ${id} ORDER BY kljuc, st LIMIT 200`,
      `SELECT prijavitelj, cas, pregledana FROM prijave WHERE prijavljen = ${id} ORDER BY cas LIMIT 200`,
    ] }; }
    case 'skrij': { const id = idIz(a); return { opis: 'vzdevek skrit (»Voznik #…«), prijave pregledane', sql: [`UPDATE igralci SET skrit = 1 WHERE id = ${id}`, pregledane(id)] }; }
    case 'pokazi': { const id = idIz(a); return { opis: 'vzdevek spet viden, prijave pregledane', sql: [`UPDATE igralci SET skrit = 0 WHERE id = ${id}`, pregledane(id)] }; }
    case 'prepovej': { const id = idIz(a); return { opis: 'oddaja prepovedana; časi izginejo z lestvic zdaj, pospravljanje jih zavrne (prepoved)', sql: [`UPDATE igralci SET prepoved = 1 WHERE id = ${id}`, pregledane(id)] }; }
    case 'dovoli': { const id = idIz(a); return { opis: 'oddaja spet dovoljena (zavrnjeni časi ostanejo zavrnjeni)', sql: [`UPDATE igralci SET prepoved = 0 WHERE id = ${id}`] }; }
    case 'sprejmi': { const st = stIz(a); return { opis: 'sumljiv čas sprejet; počasnejše čase igralca pospravljanje izbriše', sql: [
      `UPDATE casi SET stanje = 'ok', razlog = NULL, preverjen = ${now} WHERE st = ${st} AND stanje = 'sumljivo'`,
    ] }; }
    case 'zavrni': {
      const st = stIz(a), raz = r.length ? r.join(' ') : 'skrbnik';
      if (!RAZLOG_RE.test(raz)) throw new Error(`razlog: do 80 znakov (črke, številke, presledek in .,:;()%-)\n${RABA}`);
      const pogoj = `st = ${st} AND stanje <> 'zavrnjeno'`;
      return { opis: 'čas zavrnjen, posnetek in duh gresta v brisanje', sql: [
        poti(pogoj), `UPDATE casi SET stanje = 'zavrnjeno', razlog = ${q(raz)}, preverjen = ${now}, duh = 0, posnetek = 0 WHERE ${pogoj}`,
      ] };
    }
    case 'izbrisi': { const id = idIz(a); return { opis: 'igralec izbrisan z vsemi časi in prijavami; zahtevek, podpisan prej, ga ne naredi znova', sql: [
      poti(`igralec = ${id}`),
      `DELETE FROM casi WHERE igralec = ${id}`,
      `DELETE FROM prijave WHERE prijavitelj = ${id} OR prijavljen = ${id}`,
      `DELETE FROM igralci WHERE id = ${id}`,
      `INSERT INTO omejitve (k, n, konec) VALUES ('izbrisan:' || ${id}, ${Math.floor(now / 1000)}, ${now + IZBRISAN_MS}) ON CONFLICT(k) DO UPDATE SET n = MAX(n, excluded.n), konec = MAX(konec, excluded.konec)`,
    ] }; }
    default: throw new Error(RABA);
  }
}

if (import.meta.url === url.pathToFileURL(process.argv[1] || '').href) {
  const args = process.argv.slice(2), suho = args.includes('--suho'), lok = args.includes('--lokalno');
  let u;
  try { u = ukaz(args.filter(x => x !== '--suho' && x !== '--lokalno')); } catch (e) { console.error(e.message); process.exit(2); }
  console.log(u.opis);
  if (suho) { for (const s of u.sql) console.log(s + ';'); process.exit(0); }
  const r = spawnSync('npx', ['wrangler', 'd1', 'execute', 'lestvica', lok ? '--local' : '--remote', '--json', '--command', u.sql.join('; ')], { cwd: MAPA, encoding: 'utf8', maxBuffer: 1 << 26 });
  if (r.status !== 0) { console.error((r.stderr || r.stdout || 'wrangler ni uspel').slice(-2000)); process.exit(1); }
  let out; try { out = JSON.parse(r.stdout); } catch (_) { console.log(r.stdout.slice(-4000)); process.exit(0); }
  for (const [i, x] of (Array.isArray(out) ? out : [out]).entries()) {
    const rows = x.results || [], ch = x.meta && x.meta.changes;
    if (rows.length) { console.log(`— ${i + 1}: ${rows.length} vrstic`); for (const v of rows) console.log(JSON.stringify(v)); }
    else console.log(`— ${i + 1}: ${ch != null ? `spremenjenih ${ch}` : 'nič'}`);
  }
}
