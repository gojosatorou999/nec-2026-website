import { test } from "node:test";
import assert from "node:assert/strict";
import { createApi } from "../src/idea-box/api.js";
test("admin login always calls the live API", async () => {
  const api = createApi({
    fetcher: async (url, options) => {
      assert.equal(url, "/api/login");
      assert.equal(options.credentials, "same-origin");
      return Response.json({ email: "admin@example.com" });
    },
  });
  assert.equal(
    (
      await api("/login", {
        method: "POST",
        body: { email: "admin@example.com", password: "test" },
      })
    ).email,
    "admin@example.com",
  );
});
test("text and HTML deployment errors return readable service errors", async () => {
  for (const [body, type] of [
    ["The page could not be found", "text/plain"],
    ["<!doctype html><html></html>", "text/html"],
  ]) {
    const api = createApi({
      fetcher: async () =>
        new Response(body, { status: 404, headers: { "content-type": type } }),
    });
    await assert.rejects(api("/startups"), /Expo service is unavailable/);
  }
});
test("malformed JSON is handled and API errors are preserved", async () => {
  const malformed = createApi({
    fetcher: async () =>
      new Response("not json", {
        headers: { "content-type": "application/json" },
      }),
  });
  await assert.rejects(malformed("/startups"), /unreadable response/);
  const denied = createApi({
    fetcher: async () =>
      Response.json({ error: "Please sign in." }, { status: 401 }),
  });
  await assert.rejects(denied("/admin"), /Please sign in/);
});
test("live mode never replaces empty showcases with demo data", async () => {
  const api = createApi({ fetcher: async () => Response.json([]) });
  assert.deepEqual(await api("/startups"), []);
});

test("submission retry keys survive a failed request in memory without browser storage", async () => {
  const keys = [];
  const api = createApi({
    fetcher: async (_url, options) => {
      keys.push(options.headers["Idempotency-Key"]);
      if (keys.length === 1) throw Error("offline");
      return Response.json({ id: "MGIT-SAVED" });
    },
  });
  const options = { method: "POST", body: { name: "Example" } };
  await assert.rejects(api("/applications", options), /Unable to reach/);
  assert.equal((await api("/applications", options)).id, "MGIT-SAVED");
  assert.equal(keys[0], keys[1]);
  await api("/applications", { ...options, body: { name: "Changed" } });
  assert.notEqual(keys[1], keys[2]);
});
