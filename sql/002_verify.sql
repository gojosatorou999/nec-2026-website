-- Read-only verification after setup/import. Every table must have RLS enabled.
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='expo' ORDER BY tablename;
SELECT version, applied_at FROM expo.schema_migrations;
SELECT 'startup_applications' AS table_name,count(*) FROM expo.startup_applications
UNION ALL SELECT 'startup_members',count(*) FROM expo.startup_members
UNION ALL SELECT 'feedback',count(*) FROM expo.feedback
UNION ALL SELECT 'idea_submissions',count(*) FROM expo.idea_submissions
UNION ALL SELECT 'rapid_fire_submissions',count(*) FROM expo.rapid_fire_submissions
UNION ALL SELECT 'join_interests',count(*) FROM expo.join_interests
UNION ALL SELECT 'submission_receipts',count(*) FROM expo.submission_receipts;
-- Private audit history (contains action metadata, never credentials or file data).
SELECT id,data,created_at FROM expo.audit_events ORDER BY created_at DESC LIMIT 50;
