-- Test s prijatelji, 12. 11. 2026: a base made with the first schema.sql gets the car, the seconds by place, and loses the wrong place 1
-- of the races left before their end (the counter turned a missing place into 1). Once: wrangler d1 execute <base> --file migracija-1.sql
ALTER TABLE seje ADD COLUMN s_proga INTEGER NOT NULL DEFAULT 0;
ALTER TABLE seje ADD COLUMN s_meni INTEGER NOT NULL DEFAULT 0;
ALTER TABLE seje ADD COLUMN s_garaza INTEGER NOT NULL DEFAULT 0;
ALTER TABLE dirke ADD COLUMN avto TEXT;
UPDATE dirke SET mesto = NULL WHERE izid = 'zapustil' OR nacin IN ('policija', 'police');
