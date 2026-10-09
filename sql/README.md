# Supabase setup

This project uses the **new Supabase project's PostgreSQL database** through the Express server. Browsers never receive database credentials. The private `expo` schema has row-level security and no access for Supabase's `anon` or `authenticated` roles. Do not add `expo` to the exposed Data API schemas.

## 1. Create the tables

Open the new project's SQL Editor and run **001_supabase_schema.sql** in full. It is safe to rerun: it does not drop tables or clear records. Then run **002_verify.sql** to inspect the tables, RLS and counts.

Alternatively, set the connection below and run `npm run db:setup`.

## 2. Configure the server

Copy `.env.example` to `.env`. In Supabase, click **Connect** and copy the PostgreSQL **Session pooler** connection string (IPv4), or the direct connection string if your host supports IPv6. Set:

`SUPABASE_DB_URL=postgresql://postgres.PROJECT_REF:ENCODED_PASSWORD@POOLER_HOST:5432/postgres`

Use your actual new project's connection string. Percent-encode special characters in the database password. This is a PostgreSQL URI, not the Supabase API URL or public anon key. Never use a `VITE_` prefix for secrets. TLS certificate verification is enabled; if your Supabase connection needs its downloadable CA certificate, set `SUPABASE_SSL_CA_FILE` to that local file. Do not disable verification. `DATABASE_LOCAL_TEST` must remain false for Supabase.

Official references: [database connections](https://supabase.com/docs/guides/database/connecting-to-postgres), [securing data](https://supabase.com/docs/guides/database/secure-data), [row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security).

## 3. Check the connection

1. Run `npm run db:setup` (or run the SQL manually).
2. Run `npm run db:check` and inspect the verified counts.
3. Run `npm run dev`. `/api/health` must return HTTP 200 with `ready: true` and `storage: supabase`.
4. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` **before the first launch against an empty database** — startup creates the first organizer account from them. They are ignored once an account exists and never reset an existing password. Sign in at `/idea-box.html#admin`.

If you point the server at a database that already holds expo data, the existing accounts, sessions, applications and founder tracking codes are used as they are.

## Data map

| Table                  | Data                                                                                               |
| ---------------------- | -------------------------------------------------------------------------------------------------- |
| users                  | Organizer accounts and password hashes                                                             |
| sessions               | Hashed session tokens, expiry and organizer reference                                              |
| startup_applications   | Complete application including all answers, logo, uploads, private tracking hash, notes and status |
| startup_members        | Each additional team member, including private contact details                                     |
| startup_products       | Product details and images from current or earlier forms                                           |
| startup_requirements   | Display plans, equipment and other stall needs                                                     |
| startups               | Explicitly approved public profile only                                                            |
| stall_assignments      | One unique case-insensitive stall number per assignment                                            |
| feedback               | Every visitor feedback submission, including historical feedback                                   |
| idea_submissions       | Original ideas                                                                                     |
| rapid_fire_submissions | Challenge responses                                                                                |
| join_interests         | Team introductions                                                                                 |
| problem_statements     | Organizer challenges                                                                               |
| submission_receipts    | Retry keys, request fingerprints and confirmed responses                                           |
| audit_events           | Submission/review change metadata (no password or file contents)                                   |
| schema_migrations      | Applied SQL version                                                                                |

The complete submitted JSON is the canonical record, so changing form fields cannot silently discard older answers. Searchable generated columns and indexes expose status, email, names and relationships. Logos and document bytes remain in the application JSON as validated data URLs; they are saved in the **same Supabase transaction**, with no separate upload that could be left unlinked. Each upload is limited to 2 MB. Private file downloads and report exports go through authenticated admin access.

## Reliability behavior

- A submission is successful only after PostgreSQL commits its complete application, related rows and receipt.
- Repeated or concurrent requests using the same retry key return the same reference and tracking code; changed payloads cannot reuse that key.
- Form data and retry keys stay only in current-page memory. The browser writes no drafts or submissions to localStorage or IndexedDB. A confirmed submission is saved in Supabase.
- Approval, public profile and stall assignment update atomically. A database unique index prevents simultaneous duplicate stall assignments.
- Admin queries use PostgreSQL directly with no 1,000-row Data API cap. The dashboard refreshes every 20 seconds while visible and offers manual refresh. Failed refreshes show errors and do not claim a new sync time.
- Without Supabase configuration, the API reports unavailability and accepts no submissions.
- Unsubmitted forms are not persisted. Keep the page open until a successful response, then save the reference and tracking code yourself.

## Hosting and backups

The backend runs on Vercel through api/index.js or on a Node 24+ service. Use the production variables in VERCEL_ENV.md and COOKIE_SECURE=true behind HTTPS. Vercel builds the live frontend and deploys the API in the same project.

Configure Supabase backups / point-in-time recovery according to your project plan and test restoration. Application transactions and retry receipts prevent partial/duplicate writes; they are not a guarantee against database deletion or loss of device-only drafts. No external project, backup schedule or hosted environment is configured by the SQL file itself.

## Tests

Use an isolated **local** PostgreSQL instance and set `TEST_DATABASE_URL` in `.env.test`. Example: `postgresql://test_user:password@127.0.0.1:5432/postgres`. The test user needs permission to create temporary databases and a temporary `anon` test role. `npm test` creates and removes isolated test databases; it never uses `SUPABASE_DB_URL` as its test target. `npm run test:unit` runs checks that do not need a database.
