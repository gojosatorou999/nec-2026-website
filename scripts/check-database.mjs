import { loadEnvFile } from "node:process";
import { Database, TABLES } from "../server/database.js";
try {
  loadEnvFile();
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
const db = new Database();
try {
  await db.ready();
  const rows = [];
  for (const table of TABLES) {
    const result = await db.query(
      "SELECT count(*)::int AS count FROM expo." + table,
    );
    rows.push({ table, records: result.rows[0].count });
  }
  console.table(rows);
  console.log("Supabase connection and all tables verified.");
} finally {
  await db.close();
}
