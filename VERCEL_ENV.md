# Vercel environment settings

The Idea Box API reads its Supabase connection, CA certificate and admin credentials from environment variables. Locally they live in `.env` (Git-ignored — never commit it). On Vercel they must be added to the project settings below; `.env` is not deployed.

**Live deployment:** vercel.json builds the production frontend and deploys the Express API through api/index.js. Add the production variables below and redeploy. The same Supabase admin credentials work from any device.

## Variables to add

| Name                | Value / purpose                                                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SUPABASE_DB_URL     | Saved Supabase PostgreSQL session-pooler connection string. Mark as sensitive.                                                                         |
| SUPABASE_SSL_CA     | Saved Supabase PEM certificate. The server accepts actual line breaks or literal \n sequences.                                                         |
| ADMIN_EMAIL         | Saved admin email address.                                                                                                                             |
| ADMIN_PASSWORD      | Saved current admin password. Mark as sensitive. Only provisions a new account when the database has no users; it does not reset an existing password. |
| COOKIE_SECURE       | true for HTTPS deployments.                                                                                                                            |
| DATABASE_LOCAL_TEST | false.                                                                                                                                                 |
| NODE_ENV            | production.                                                                                                                                            |

The hosted certificate value replaces the local `SUPABASE_SSL_CA_FILE` setting; do not upload a Windows certificate path. Vercel manages the listening port, so do not copy the local `PORT=5173` setting. Do not prefix any of these variables with `VITE_`.

## Add in Vercel

1. Open the project’s **Settings → Environment Variables**.
2. Add each name and value from your `.env`, using the production values below. When copying individual values, omit the surrounding double quotes. The certificate’s literal \n sequences are accepted by the server.
3. Select **Production**. Only apply these live-database credentials to Preview if preview deployments should access the same data.
4. Save, then redeploy this repository. Variable changes apply to new deployments, so redeploy after changing them.
5. Verify `/api/health` returns HTTP 200 with `ready: true` and `storage: supabase`, then verify admin login and submission publication.

References: [Vercel environment variables](https://vercel.com/docs/environment-variables/managing-environment-variables), [Sensitive variables](https://vercel.com/docs/environment-variables/sensitive-environment-variables), [Express on Vercel](https://vercel.com/docs/frameworks/backend/express).
