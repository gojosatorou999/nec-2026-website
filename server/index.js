/* Local runner for the Idea Box API.

   `npm run dev` does not need this — vite.config.js mounts the same Express app
   on /api inside the Vite dev server. This file serves a production build
   (`npm run build && npm start`) the way Vercel does: the built pages from
   dist/ plus the API. On Vercel itself, api/index.js is the entry point. */
import { loadEnvFile } from "node:process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
try {
  loadEnvFile();
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const { default: app } = await import("./app.js");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
// Multi-page site: /idea-box resolves to dist/idea-box.html, like Vercel's
// cleanUrls. Unknown paths fall back to the home page.
app.use(express.static(dist, { extensions: ["html"] }));
app.get("/{*path}", (req, res) => res.sendFile(path.join(dist, "index.html")));
const port = Number(process.env.PORT || 5173);
app.listen(port, "0.0.0.0", () =>
  console.log("NEC 2026 site + Idea Box API at http://localhost:" + port),
);
