-- Svetovna lestvica: the database (D1, SQLite; docs/svetovna-lestvica.md, »Kaj se shrani«). Times in ms since 1970 (sent0: s, the
-- player's clock as signed). Made once: npx wrangler d1 execute lestvica --remote --file schema.sql (IF NOT EXISTS: running it again is safe).

-- a player: the id (the first 12 characters of base64url(SHA-256(pub))), the public key, the nickname; ustvarjen: the first request;
-- sent0: the signed time of the first request (an older signed request is not taken: a copied one cannot delete a player made anew);
-- zadnjic: made or the last run sent (a player with no run in 24 months is deleted); skrit: the nickname hidden (reports, the admin);
-- prepoved: banned (the admin)
CREATE TABLE IF NOT EXISTS igralci (
  id TEXT PRIMARY KEY,
  pub TEXT NOT NULL UNIQUE,
  ime TEXT NOT NULL,
  ustvarjen INTEGER NOT NULL,
  sent0 INTEGER NOT NULL,
  zadnjic INTEGER NOT NULL,
  skrit INTEGER NOT NULL DEFAULT 0,
  prepoved INTEGER NOT NULL DEFAULT 0
) WITHOUT ROWID;

-- a run: kljuc the board (the game's record key, e.g. harju@cs), ms the time (the checked one once ok), ms0 the time as sent, vmes the
-- times at the checkpoints (JSON, ms), avto the car's id, nad the upgrades (JSON { motor, gume, zavore, aero }), pomoc the assist,
-- zig the stamps (JSON { igra, jedro }), eng the engine (V8, JSC, Gecko; tel on a phone), n the record's steps, fs the finish step,
-- s0 and s1 the steps of the timed part; stanje caka (waits for the check), ok, sumljivo (for the admin), zavrnjeno; razlog why;
-- priblizno the check agreed only roughly (»preverjeno približno«); oddan, preverjen: when; poskusi: checks that could not be made;
-- duh, posnetek: the ghost, the record are in R2 (posnetki/<kljuc>/<st>.duh, .vnos)
CREATE TABLE IF NOT EXISTS casi (
  st INTEGER PRIMARY KEY AUTOINCREMENT,
  kljuc TEXT NOT NULL,
  igralec TEXT NOT NULL,
  ms INTEGER NOT NULL,
  ms0 INTEGER NOT NULL,
  vmes TEXT NOT NULL,
  avto TEXT NOT NULL,
  nad TEXT NOT NULL,
  pomoc INTEGER NOT NULL,
  zig TEXT NOT NULL,
  eng TEXT NOT NULL,
  n INTEGER NOT NULL,
  fs INTEGER,
  s0 INTEGER NOT NULL,
  s1 INTEGER NOT NULL,
  stanje TEXT NOT NULL,
  razlog TEXT,
  priblizno INTEGER NOT NULL DEFAULT 0,
  oddan INTEGER NOT NULL,
  preverjen INTEGER,
  poskusi INTEGER NOT NULL DEFAULT 0,
  duh INTEGER NOT NULL DEFAULT 0,
  posnetek INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS casi_lestvica ON casi (kljuc, stanje, ms, oddan);
CREATE INDEX IF NOT EXISTS casi_igralec ON casi (igralec, kljuc);
CREATE INDEX IF NOT EXISTS casi_stanje ON casi (stanje, oddan);

-- a report of a nickname (one per reporter and player; three not yet reviewed hide it until the admin looks)
CREATE TABLE IF NOT EXISTS prijave (
  prijavitelj TEXT NOT NULL,
  prijavljen TEXT NOT NULL,
  cas INTEGER NOT NULL,
  pregledana INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (prijavitelj, prijavljen)
) WITHOUT ROWID;
CREATE INDEX IF NOT EXISTS prijave_prijavljen ON prijave (prijavljen, pregledana);

-- the limits of sending: k = <what>:<who>:<window>, n the requests in the window, konec its end (the clean-up deletes the ended ones;
-- who is a player's id or the hashed IP, so a hash lives at most two days); also the mark of a deleted player, k = izbrisan:<id>, n the
-- signed time of the deletion (s), konec 3 days on (a request signed before it cannot make the player again)
CREATE TABLE IF NOT EXISTS omejitve (
  k TEXT PRIMARY KEY,
  n INTEGER NOT NULL,
  konec INTEGER NOT NULL
) WITHOUT ROWID;

-- objects in R2 to delete: written with the change that drops them (one batch), forgotten once R2 deleted them; the clean-up deletes the
-- ones left (R2 failed, or the request stopped halfway)
CREATE TABLE IF NOT EXISTS brisanje (
  pot TEXT PRIMARY KEY
) WITHOUT ROWID;
