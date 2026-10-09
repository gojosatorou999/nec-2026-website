import { DatabaseSync, backup } from "node:sqlite";
import { loadEnvFile } from "node:process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { Database, TABLES } from "../server/database.js";
import { canonical } from "../server/submission-store.js";
try {
  loadEnvFile();
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
const sourcePath = path.resolve(process.argv[2] || ".data/expo.sqlite");
const db = new Database();
if (!db.configured)
  throw Error("Set SUPABASE_DB_URL for the NEW project before importing.");
const source = new DatabaseSync(sourcePath, { readOnly: true });
const backupDir = path.resolve(".data/backups");
await mkdir(backupDir, { recursive: true });
const snapshot = path.join(
  backupDir,
  "expo-before-supabase-" + Date.now() + ".sqlite",
);
const sourceVersion = source.prepare("PRAGMA data_version").get().data_version;
await backup(source, snapshot);
const saved = new DatabaseSync(snapshot, { readOnly: true });
try {
  await db.ready();
  const available = saved
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
    )
    .all()
    .map((r) => r.name);
  const unknown = available.filter((t) => !TABLES.includes(t));
  if (unknown.length)
    throw Error(
      "Unrecognized source tables; nothing imported: " + unknown.join(", "),
    );
  const summary = await db.transaction(async (tx) => {
    await tx.query(
      "SELECT pg_advisory_xact_lock(hashtextextended('expo-sqlite-import',0))",
    );
    const results = [];
    for (const table of TABLES.filter((t) => available.includes(t))) {
      const rows = saved
        .prepare('SELECT id,data,created_at FROM "' + table + '"')
        .all();
      let inserted = 0;
      for (const row of rows) {
        const payload = JSON.parse(row.data);
        const existing = (
          await tx.query("SELECT data FROM expo." + table + " WHERE id=$1", [
            row.id,
          ])
        ).rows[0];
        if (existing) {
          if (canonical(existing.data) !== canonical(payload))
            throw Error(
              "Conflict in " +
                table +
                " / " +
                row.id +
                ". Nothing was overwritten.",
            );
        } else {
          await tx.query(
            "INSERT INTO expo." +
              table +
              " (id,data,created_at) VALUES($1,$2::jsonb,$3::timestamptz)",
            [
              row.id,
              JSON.stringify(payload),
              row.created_at
                ? row.created_at.includes("T")
                  ? row.created_at
                  : row.created_at.replace(" ", "T") + "Z"
                : new Date().toISOString(),
            ],
          );
          inserted++;
        }
      }
      // Verify every row and every field, not only counts. Transaction rolls back on any mismatch.
      for (const row of rows) {
        const target = (
          await tx.query("SELECT data FROM expo." + table + " WHERE id=$1", [
            row.id,
          ])
        ).rows[0];
        if (
          !target ||
          canonical(target.data) !== canonical(JSON.parse(row.data))
        )
          throw Error("Verification failed for " + table + " / " + row.id);
      }
      results.push({
        table,
        source: rows.length,
        inserted,
        verified: rows.length,
      });
    }
    if (
      source.prepare("PRAGMA data_version").get().data_version !== sourceVersion
    )
      throw Error(
        "The source database changed during import. Stop the old server and rerun; this import was rolled back.",
      );
    return results;
  }, "sqlite_import");
  console.table(summary);
  console.log(
    "Every source row verified. Original SQLite file preserved. Backup: " +
      snapshot,
  );
} finally {
  saved.close();
  source.close();
  await db.close();
}
