/* Review the Idea Box submissions already in the database.

     node scripts/review-ideas.mjs               report only, changes nothing
     node scripts/review-ideas.mjs --apply       save the drafted title, brief and category
     node scripts/review-ideas.mjs --requests    also print the permission email for each student

   --apply only fills in drafts for ideas that have none yet. It never
   publishes an idea and never records permission: those stay organizer
   decisions made in the dashboard (or after the student replies). */
import { loadEnvFile } from "node:process";
import { Database } from "../server/database.js";
import { permissionRequest, reviewIdea, tidyDepartment, tidyName, tidyYear } from "../shared/ideas.js";

try {
  loadEnvFile();
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
const flags = new Set(process.argv.slice(2));
const apply = flags.has("--apply");
const requests = flags.has("--requests");

const db = new Database();
try {
  await db.ready();
  const ideas = await db.all("idea_submissions");
  if (!ideas.length) {
    console.log("No idea submissions yet.");
  } else {
    const reviews = ideas.map((idea) => reviewIdea(idea, ideas));
    console.table(
      reviews.map((r) => ({
        id: r.id,
        title: r.draft.title,
        category: r.draft.category || "—",
        status: r.published ? "In showcase" : r.ready ? "Ready to publish" : "Needs attention",
        notes: r.issues.map((i) => i.text).join("; ") || "—",
      })),
    );

    for (const idea of ideas) {
      const review = reviews.find((r) => r.id === idea.id);
      console.log(`\n${idea.id} · ${tidyName(idea.name)} · ${[tidyDepartment(idea.department), tidyYear(idea.year)].filter(Boolean).join(", ")} · ${idea.email}`);
      console.log(`  Title:    ${review.draft.title}`);
      console.log(`  Brief:    ${review.draft.brief}`);
      console.log(`  Category: ${review.draft.category || "(none suggested)"}`);
      for (const issue of review.issues) console.log(`  ${issue.level === "block" ? "✗" : "!"} ${issue.text}`);
      if (requests && idea.showcaseConsent !== true && idea.email) {
        const mail = permissionRequest(idea, review.draft);
        console.log(`\n  --- Permission email to ${mail.to} ---\n  Subject: ${mail.subject}\n`);
        console.log(mail.body.replace(/^/gm, "  "));
      }
    }

    if (apply) {
      let saved = 0;
      for (const idea of ideas) {
        if (idea.showcase?.title || idea.showcase?.brief) continue; // keep an organizer's own wording
        const { draft } = reviews.find((r) => r.id === idea.id);
        await db.transaction(async (tx) => {
          const current = await tx.get("idea_submissions", idea.id, { lock: true });
          if (!current || current.showcase?.title || current.showcase?.brief) return;
          await tx.put("idea_submissions", idea.id, {
            ...current,
            category: current.category || draft.category,
            showcase: {
              published: current.showcase?.published === true,
              title: draft.title,
              brief: draft.brief,
              publishedAt: current.showcase?.publishedAt || null,
            },
          });
          saved++;
        }, "review-ideas");
      }
      console.log(`\nSaved drafts for ${saved} idea${saved === 1 ? "" : "s"}. Nothing was published.`);
    } else {
      console.log("\nReport only. Run with --apply to save these drafts. Nothing is published either way.");
    }
  }
} finally {
  await db.close();
}
