CREATE TABLE ajk_interest (
  id TEXT PRIMARY KEY, created_at TEXT NOT NULL, name TEXT NOT NULL, role TEXT NOT NULL,
  masjid_name TEXT NOT NULL, venue_type TEXT NOT NULL, area TEXT NOT NULL, state TEXT NOT NULL,
  phone TEXT NOT NULL, email TEXT, needs TEXT NOT NULL, congregation_size TEXT, notes TEXT,
  consent_at TEXT NOT NULL, ip_hash TEXT NOT NULL, user_agent TEXT, source TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','onboarded','declined'))
);
CREATE INDEX ajk_interest_created ON ajk_interest(created_at);
CREATE INDEX ajk_interest_ip ON ajk_interest(ip_hash, created_at);
CREATE INDEX ajk_interest_duplicate ON ajk_interest(phone, masjid_name, created_at);
-- Count accepted attempts, including invalid and duplicate submissions, independently of leads.
CREATE TABLE ajk_interest_attempts (id TEXT PRIMARY KEY, ip_hash TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE INDEX ajk_interest_attempt_ip ON ajk_interest_attempts(ip_hash, created_at);
-- Random daily salts are shared by isolates, never derived from the public date alone.
CREATE TABLE ajk_interest_salts (day TEXT PRIMARY KEY, salt TEXT NOT NULL);
