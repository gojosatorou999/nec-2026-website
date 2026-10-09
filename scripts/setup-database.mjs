import { loadEnvFile } from "node:process";
import { readFile } from "node:fs/promises";
import { Database } from "../server/database.js";
try {
  loadEnvFile();
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
const db = new Database();
try {
  if (!db.configured) throw Error("Set SUPABASE_DB_URL in .env first.");
  await db.query(
    await readFile(
      new URL("../sql/001_supabase_schema.sql", import.meta.url),
      "utf8",
    ),
  );
  await db.ready();
  console.log("Supabase schema is ready.");
} finally {
  await db.close();
}
