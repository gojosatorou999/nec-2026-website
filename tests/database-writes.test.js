import { test } from "node:test";
import assert from "node:assert/strict";
import { Database } from "../server/database.js";

// Stub out the network: only the SQL that would be sent matters here.
const capture = () => {
  const db = new Database(null);
  const calls = [];
  db.query = async (text, values) => calls.push({ text, values });
  return { db, calls };
};

test("putMany writes every row in a single round trip", async () => {
  const { db, calls } = capture();
  await db.putMany([
    ["startup_applications", "MGIT-1", { id: "x", name: "Releaf" }],
    ["startup_members", "m-1", { applicationId: "MGIT-1", name: "Ravi" }],
    ["startup_products", "MGIT-1", { applicationId: "MGIT-1" }],
  ]);
  assert.equal(calls.length, 1);
  const { text, values } = calls[0];
  assert.match(text, /^WITH w0 AS \(INSERT INTO expo\.startup_applications/);
  assert.match(text, /w1 AS \(INSERT INTO expo\.startup_members/);
  assert.match(text, /w2 AS \(INSERT INTO expo\.startup_products/);
  assert.match(text, /SELECT 1$/);
  // ids and JSON are bound parameters, never interpolated into the SQL
  assert.deepEqual(values.filter((_, i) => i % 2 === 0), ["MGIT-1", "m-1", "MGIT-1"]);
  assert.equal(JSON.parse(values[1]).id, undefined, "the id column is not duplicated into data");
  assert.equal(JSON.parse(values[1]).name, "Releaf");
  assert.ok(!text.includes("Releaf") && !text.includes("Ravi"));
});

test("putMany refuses unknown tables and ignores an empty list", async () => {
  const { db, calls } = capture();
  await db.putMany([]);
  assert.equal(calls.length, 0);
  await assert.rejects(() => db.putMany([["users; DROP TABLE x", "1", {}]]), /Unknown table/);
});
