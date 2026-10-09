import { Pool } from "pg";
import { readFileSync } from "node:fs";
export const TABLES = [
  "users",
  "startup_applications",
  "startups",
  "startup_members",
  "startup_products",
  "startup_requirements",
  "feedback",
  "idea_submissions",
  "rapid_fire_submissions",
  "stall_assignments",
  "join_interests",
  "sessions",
  "problem_statements",
  "submission_receipts",
  "audit_events",
];
const allowed = new Set(TABLES);
const tableName = (name) => {
  if (!allowed.has(name)) throw new Error("Unknown table");
  return "expo." + name;
};
const unpack = (row) =>
  row
    ? {
        ...row.data,
        id: row.id,
        createdAt: row.data.createdAt || new Date(row.created_at).toISOString(),
      }
    : null;
export class StorageUnavailable extends Error {
  constructor() {
    super(
      "The service is temporarily unavailable. Keep this page open and try again shortly.",
    );
    this.status = 503;
  }
}
export function databaseConfig(env = process.env) {
  if (!env.SUPABASE_DB_URL) return null;
  const url = new URL(env.SUPABASE_DB_URL);
  if (!["postgres:", "postgresql:"].includes(url.protocol))
    throw new Error("SUPABASE_DB_URL must be a PostgreSQL connection string.");
  const local =
    env.DATABASE_LOCAL_TEST === "true" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  // Prevent connection-string options from disabling certificate verification.
  for (const key of ["sslmode", "sslcert", "sslkey", "sslrootcert"])
    url.searchParams.delete(key);
  return {
    connectionString: url.toString(),
    ssl: local
      ? false
      : {
          rejectUnauthorized: true,
          ...(env.SUPABASE_SSL_CA
            ? { ca: env.SUPABASE_SSL_CA.replace(/\\n/g, "\n") }
            : env.SUPABASE_SSL_CA_FILE
              ? { ca: readFileSync(env.SUPABASE_SSL_CA_FILE, "utf8") }
              : {}),
        },
    max: 5,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    statement_timeout: 30000,
  };
}
export class Database {
  constructor(config = databaseConfig()) {
    this.configured = !!config;
    this.pool = config ? new Pool(config) : null;
    this.pool?.on("error", () =>
      console.error("Database connection interrupted."),
    );
  }
  async query(text, values = []) {
    if (!this.pool) throw new StorageUnavailable();
    return this.pool.query(text, values);
  }
  async all(table) {
    return (
      await this.query(
        "SELECT id,data,created_at FROM " +
          tableName(table) +
          " ORDER BY created_at DESC,id",
      )
    ).rows.map(unpack);
  }
  async get(table, id, { lock = false } = {}) {
    return unpack(
      (
        await this.query(
          "SELECT id,data,created_at FROM " +
            tableName(table) +
            " WHERE id=$1" +
            (lock ? " FOR UPDATE" : ""),
          [id],
        )
      ).rows[0],
    );
  }
  async put(table, id, data, { createdAt } = {}) {
    const clean = { ...data };
    delete clean.id;
    await this.query(
      "INSERT INTO " +
        tableName(table) +
        " (id,data,created_at) VALUES ($1,$2::jsonb,COALESCE($3::timestamptz,now())) ON CONFLICT(id) DO UPDATE SET data=excluded.data",
      [id, JSON.stringify(clean), createdAt || null],
    );
  }
  async remove(table, id) {
    await this.query("DELETE FROM " + tableName(table) + " WHERE id=$1", [id]);
  }
  async transaction(work, actor = "server") {
    if (!this.pool) throw new StorageUnavailable();
    const client = await this.pool.connect();
    const tx = Object.create(this);
    tx.query = (text, values = []) => client.query(text, values);
    try {
      await client.query("BEGIN");
      await client.query("SELECT set_config('expo.actor',$1,true)", [actor]);
      const result = await work(tx);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  }
  async ready() {
    const result = await this.query(
      "SELECT version FROM expo.schema_migrations WHERE version=1",
    );
    if (!result.rowCount)
      throw new Error(
        "Run sql/001_supabase_schema.sql before starting the app.",
      );
  }
  async close() {
    await this.pool?.end();
  }
}
