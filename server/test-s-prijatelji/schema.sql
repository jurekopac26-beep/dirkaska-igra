-- Test s prijatelji: the counter's tables (Cloudflare D1, SQLite). Times in ms since 1970 (UTC), the server's clock.
CREATE TABLE IF NOT EXISTS seje (
  id TEXT PRIMARY KEY,          -- the client's random id of one visit (no link to a person or device)
  koda TEXT NOT NULL,           -- the tester's code (T1 .. T30)
  zacetek INTEGER NOT NULL,     -- the first event of the visit
  zadnji INTEGER NOT NULL,      -- the last event (start, beat every minute while the game is seen, end)
  naprava TEXT, os TEXT, brskalnik TEXT, zig TEXT
);
CREATE INDEX IF NOT EXISTS seje_koda ON seje (koda, zacetek);
CREATE TABLE IF NOT EXISTS dirke (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  seja TEXT NOT NULL, koda TEXT NOT NULL,
  cas INTEGER NOT NULL,         -- when the race ended (the server's clock)
  proga TEXT, nacin TEXT, vreme TEXT,
  trajanje REAL,                -- seconds from the start of the race to its end
  izid TEXT,                    -- cilj | odstop | zapustil
  mesto INTEGER
);
CREATE INDEX IF NOT EXISTS dirke_koda ON dirke (koda, cas);
