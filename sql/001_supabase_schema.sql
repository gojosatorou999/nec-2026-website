-- MGIT Expo: run this entire file in the Supabase SQL Editor.
-- Idempotent, non-destructive setup. Private schema, accessed only by the Node server.
BEGIN;
CREATE SCHEMA IF NOT EXISTS expo;
REVOKE ALL ON SCHEMA expo FROM PUBLIC;
CREATE TABLE IF NOT EXISTS expo.schema_migrations (version integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS expo.users (
  id text PRIMARY KEY,
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE expo.users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON expo.users FROM PUBLIC;
CREATE TABLE IF NOT EXISTS expo.startup_applications (
  id text PRIMARY KEY,
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE expo.startup_applications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON expo.startup_applications FROM PUBLIC;
CREATE TABLE IF NOT EXISTS expo.startups (
  id text PRIMARY KEY,
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE expo.startups ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON expo.startups FROM PUBLIC;
CREATE TABLE IF NOT EXISTS expo.startup_members (
  id text PRIMARY KEY,
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE expo.startup_members ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON expo.startup_members FROM PUBLIC;
CREATE TABLE IF NOT EXISTS expo.startup_products (
  id text PRIMARY KEY,
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE expo.startup_products ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON expo.startup_products FROM PUBLIC;
CREATE TABLE IF NOT EXISTS expo.startup_requirements (
  id text PRIMARY KEY,
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE expo.startup_requirements ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON expo.startup_requirements FROM PUBLIC;
CREATE TABLE IF NOT EXISTS expo.feedback (
  id text PRIMARY KEY,
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE expo.feedback ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON expo.feedback FROM PUBLIC;
CREATE TABLE IF NOT EXISTS expo.idea_submissions (
  id text PRIMARY KEY,
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE expo.idea_submissions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON expo.idea_submissions FROM PUBLIC;
CREATE TABLE IF NOT EXISTS expo.rapid_fire_submissions (
  id text PRIMARY KEY,
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE expo.rapid_fire_submissions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON expo.rapid_fire_submissions FROM PUBLIC;
CREATE TABLE IF NOT EXISTS expo.stall_assignments (
  id text PRIMARY KEY,
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE expo.stall_assignments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON expo.stall_assignments FROM PUBLIC;
CREATE TABLE IF NOT EXISTS expo.join_interests (
  id text PRIMARY KEY,
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE expo.join_interests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON expo.join_interests FROM PUBLIC;
CREATE TABLE IF NOT EXISTS expo.sessions (
  id text PRIMARY KEY,
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE expo.sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON expo.sessions FROM PUBLIC;
CREATE TABLE IF NOT EXISTS expo.problem_statements (
  id text PRIMARY KEY,
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE expo.problem_statements ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON expo.problem_statements FROM PUBLIC;
CREATE TABLE IF NOT EXISTS expo.submission_receipts (
  id text PRIMARY KEY,
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE expo.submission_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON expo.submission_receipts FROM PUBLIC;
CREATE TABLE IF NOT EXISTS expo.audit_events (
  id text PRIMARY KEY,
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE expo.audit_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON expo.audit_events FROM PUBLIC;

-- Generated columns keep every original form field while adding searchable, constrained relationships.
ALTER TABLE expo.users ADD COLUMN IF NOT EXISTS email text GENERATED ALWAYS AS (lower(data->>'email')) STORED;
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON expo.users(email);
ALTER TABLE expo.startup_applications ADD COLUMN IF NOT EXISTS status text GENERATED ALWAYS AS (data->>'status') STORED;
ALTER TABLE expo.startup_applications ADD COLUMN IF NOT EXISTS email text GENERATED ALWAYS AS (lower(data->>'email')) STORED;
ALTER TABLE expo.startup_applications ADD COLUMN IF NOT EXISTS startup_name text GENERATED ALWAYS AS (data->>'name') STORED;
ALTER TABLE expo.startups ADD COLUMN IF NOT EXISTS status text GENERATED ALWAYS AS (data->>'status') STORED;
ALTER TABLE expo.stall_assignments ADD COLUMN IF NOT EXISTS stall text GENERATED ALWAYS AS (lower(btrim(data->>'stall'))) STORED;
CREATE UNIQUE INDEX IF NOT EXISTS stalls_unique ON expo.stall_assignments(stall) WHERE stall IS NOT NULL AND stall <> '';
ALTER TABLE expo.sessions ADD COLUMN IF NOT EXISTS user_id text GENERATED ALWAYS AS (data->>'userId') STORED;
ALTER TABLE expo.sessions ADD COLUMN IF NOT EXISTS expires_at_ms bigint GENERATED ALWAYS AS ((data->>'expires')::bigint) STORED;
CREATE INDEX IF NOT EXISTS sessions_expiry ON expo.sessions(expires_at_ms);
CREATE INDEX IF NOT EXISTS applications_status ON expo.startup_applications(status,created_at DESC,id);
CREATE INDEX IF NOT EXISTS applications_email ON expo.startup_applications(email);
CREATE INDEX IF NOT EXISTS startups_status ON expo.startups(status);
ALTER TABLE expo.startup_members ADD COLUMN IF NOT EXISTS application_id text GENERATED ALWAYS AS (data->>'applicationId') STORED;
CREATE INDEX IF NOT EXISTS startup_members_application ON expo.startup_members(application_id);
DO $block$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='startup_members_application_fk' AND conrelid='expo.startup_members'::regclass) THEN
 ALTER TABLE expo.startup_members ADD CONSTRAINT startup_members_application_fk FOREIGN KEY (application_id) REFERENCES expo.startup_applications(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;
 END IF;
END $block$;
ALTER TABLE expo.startup_products ADD COLUMN IF NOT EXISTS application_id text GENERATED ALWAYS AS (data->>'applicationId') STORED;
CREATE INDEX IF NOT EXISTS startup_products_application ON expo.startup_products(application_id);
DO $block$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='startup_products_application_fk' AND conrelid='expo.startup_products'::regclass) THEN
 ALTER TABLE expo.startup_products ADD CONSTRAINT startup_products_application_fk FOREIGN KEY (application_id) REFERENCES expo.startup_applications(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;
 END IF;
END $block$;
ALTER TABLE expo.startup_requirements ADD COLUMN IF NOT EXISTS application_id text GENERATED ALWAYS AS (data->>'applicationId') STORED;
CREATE INDEX IF NOT EXISTS startup_requirements_application ON expo.startup_requirements(application_id);
DO $block$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='startup_requirements_application_fk' AND conrelid='expo.startup_requirements'::regclass) THEN
 ALTER TABLE expo.startup_requirements ADD CONSTRAINT startup_requirements_application_fk FOREIGN KEY (application_id) REFERENCES expo.startup_applications(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;
 END IF;
END $block$;
CREATE INDEX IF NOT EXISTS feedback_startup ON expo.feedback((data->>'startupId'),created_at DESC,id);
CREATE INDEX IF NOT EXISTS join_interests_startup ON expo.join_interests((data->>'startupId'),created_at DESC,id);
CREATE INDEX IF NOT EXISTS users_created ON expo.users(created_at DESC,id);
CREATE INDEX IF NOT EXISTS startup_applications_created ON expo.startup_applications(created_at DESC,id);
CREATE INDEX IF NOT EXISTS startups_created ON expo.startups(created_at DESC,id);
CREATE INDEX IF NOT EXISTS startup_members_created ON expo.startup_members(created_at DESC,id);
CREATE INDEX IF NOT EXISTS startup_products_created ON expo.startup_products(created_at DESC,id);
CREATE INDEX IF NOT EXISTS startup_requirements_created ON expo.startup_requirements(created_at DESC,id);
CREATE INDEX IF NOT EXISTS feedback_created ON expo.feedback(created_at DESC,id);
CREATE INDEX IF NOT EXISTS idea_submissions_created ON expo.idea_submissions(created_at DESC,id);
CREATE INDEX IF NOT EXISTS rapid_fire_submissions_created ON expo.rapid_fire_submissions(created_at DESC,id);
CREATE INDEX IF NOT EXISTS stall_assignments_created ON expo.stall_assignments(created_at DESC,id);
CREATE INDEX IF NOT EXISTS join_interests_created ON expo.join_interests(created_at DESC,id);
CREATE INDEX IF NOT EXISTS sessions_created ON expo.sessions(created_at DESC,id);
CREATE INDEX IF NOT EXISTS problem_statements_created ON expo.problem_statements(created_at DESC,id);
CREATE INDEX IF NOT EXISTS submission_receipts_created ON expo.submission_receipts(created_at DESC,id);
CREATE INDEX IF NOT EXISTS audit_events_created ON expo.audit_events(created_at DESC,id);

CREATE OR REPLACE FUNCTION expo.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog AS $body$
BEGIN NEW.updated_at = now(); RETURN NEW; END $body$;
CREATE OR REPLACE FUNCTION expo.audit_change() RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog AS $body$
BEGIN
 INSERT INTO expo.audit_events(id,data) VALUES(gen_random_uuid()::text,jsonb_build_object('table',TG_TABLE_NAME,'recordId',NEW.id,'operation',TG_OP,'actor',coalesce(nullif(current_setting('expo.actor',true),''),'server'),'status',NEW.data->>'status'));
 RETURN NEW;
END $body$;
DROP TRIGGER IF EXISTS touch_updated_at ON expo.users;
CREATE TRIGGER touch_updated_at BEFORE UPDATE ON expo.users FOR EACH ROW EXECUTE FUNCTION expo.touch_updated_at();
DROP TRIGGER IF EXISTS touch_updated_at ON expo.startup_applications;
CREATE TRIGGER touch_updated_at BEFORE UPDATE ON expo.startup_applications FOR EACH ROW EXECUTE FUNCTION expo.touch_updated_at();
DROP TRIGGER IF EXISTS touch_updated_at ON expo.startups;
CREATE TRIGGER touch_updated_at BEFORE UPDATE ON expo.startups FOR EACH ROW EXECUTE FUNCTION expo.touch_updated_at();
DROP TRIGGER IF EXISTS touch_updated_at ON expo.startup_members;
CREATE TRIGGER touch_updated_at BEFORE UPDATE ON expo.startup_members FOR EACH ROW EXECUTE FUNCTION expo.touch_updated_at();
DROP TRIGGER IF EXISTS touch_updated_at ON expo.startup_products;
CREATE TRIGGER touch_updated_at BEFORE UPDATE ON expo.startup_products FOR EACH ROW EXECUTE FUNCTION expo.touch_updated_at();
DROP TRIGGER IF EXISTS touch_updated_at ON expo.startup_requirements;
CREATE TRIGGER touch_updated_at BEFORE UPDATE ON expo.startup_requirements FOR EACH ROW EXECUTE FUNCTION expo.touch_updated_at();
DROP TRIGGER IF EXISTS touch_updated_at ON expo.feedback;
CREATE TRIGGER touch_updated_at BEFORE UPDATE ON expo.feedback FOR EACH ROW EXECUTE FUNCTION expo.touch_updated_at();
DROP TRIGGER IF EXISTS touch_updated_at ON expo.idea_submissions;
CREATE TRIGGER touch_updated_at BEFORE UPDATE ON expo.idea_submissions FOR EACH ROW EXECUTE FUNCTION expo.touch_updated_at();
DROP TRIGGER IF EXISTS touch_updated_at ON expo.rapid_fire_submissions;
CREATE TRIGGER touch_updated_at BEFORE UPDATE ON expo.rapid_fire_submissions FOR EACH ROW EXECUTE FUNCTION expo.touch_updated_at();
DROP TRIGGER IF EXISTS touch_updated_at ON expo.stall_assignments;
CREATE TRIGGER touch_updated_at BEFORE UPDATE ON expo.stall_assignments FOR EACH ROW EXECUTE FUNCTION expo.touch_updated_at();
DROP TRIGGER IF EXISTS touch_updated_at ON expo.join_interests;
CREATE TRIGGER touch_updated_at BEFORE UPDATE ON expo.join_interests FOR EACH ROW EXECUTE FUNCTION expo.touch_updated_at();
DROP TRIGGER IF EXISTS touch_updated_at ON expo.sessions;
CREATE TRIGGER touch_updated_at BEFORE UPDATE ON expo.sessions FOR EACH ROW EXECUTE FUNCTION expo.touch_updated_at();
DROP TRIGGER IF EXISTS touch_updated_at ON expo.problem_statements;
CREATE TRIGGER touch_updated_at BEFORE UPDATE ON expo.problem_statements FOR EACH ROW EXECUTE FUNCTION expo.touch_updated_at();
DROP TRIGGER IF EXISTS touch_updated_at ON expo.submission_receipts;
CREATE TRIGGER touch_updated_at BEFORE UPDATE ON expo.submission_receipts FOR EACH ROW EXECUTE FUNCTION expo.touch_updated_at();
DROP TRIGGER IF EXISTS audit_change ON expo.startup_applications;
CREATE TRIGGER audit_change AFTER INSERT OR UPDATE ON expo.startup_applications FOR EACH ROW EXECUTE FUNCTION expo.audit_change();
DROP TRIGGER IF EXISTS audit_change ON expo.startups;
CREATE TRIGGER audit_change AFTER INSERT OR UPDATE ON expo.startups FOR EACH ROW EXECUTE FUNCTION expo.audit_change();
DROP TRIGGER IF EXISTS audit_change ON expo.feedback;
CREATE TRIGGER audit_change AFTER INSERT OR UPDATE ON expo.feedback FOR EACH ROW EXECUTE FUNCTION expo.audit_change();
DROP TRIGGER IF EXISTS audit_change ON expo.join_interests;
CREATE TRIGGER audit_change AFTER INSERT OR UPDATE ON expo.join_interests FOR EACH ROW EXECUTE FUNCTION expo.audit_change();
DROP TRIGGER IF EXISTS audit_change ON expo.idea_submissions;
CREATE TRIGGER audit_change AFTER INSERT OR UPDATE ON expo.idea_submissions FOR EACH ROW EXECUTE FUNCTION expo.audit_change();
DROP TRIGGER IF EXISTS audit_change ON expo.rapid_fire_submissions;
CREATE TRIGGER audit_change AFTER INSERT OR UPDATE ON expo.rapid_fire_submissions FOR EACH ROW EXECUTE FUNCTION expo.audit_change();
DROP TRIGGER IF EXISTS audit_change ON expo.stall_assignments;
CREATE TRIGGER audit_change AFTER INSERT OR UPDATE ON expo.stall_assignments FOR EACH ROW EXECUTE FUNCTION expo.audit_change();
DROP TRIGGER IF EXISTS audit_change ON expo.problem_statements;
CREATE TRIGGER audit_change AFTER INSERT OR UPDATE ON expo.problem_statements FOR EACH ROW EXECUTE FUNCTION expo.audit_change();

-- Supabase browser roles receive no schema/table/function access, even if expo is accidentally exposed.
DO $block$ DECLARE role_name text; BEGIN
 FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=role_name) THEN
   EXECUTE format('REVOKE ALL ON SCHEMA expo FROM %I',role_name);
   EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA expo FROM %I',role_name);
   EXECUTE format('REVOKE ALL ON ALL FUNCTIONS IN SCHEMA expo FROM %I',role_name);
  END IF;
 END LOOP;
END $block$;
ALTER TABLE expo.schema_migrations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA expo FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA expo REVOKE ALL ON TABLES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA expo REVOKE ALL ON FUNCTIONS FROM PUBLIC;
INSERT INTO expo.schema_migrations(version) VALUES(1) ON CONFLICT DO NOTHING;
COMMIT;
