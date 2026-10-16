import { test } from "node:test";
import assert from "node:assert/strict";
import {
  IDEA_BRIEF_MAX,
  IDEA_TITLE_MAX,
  ideaBrief,
  ideaTitle,
  isPublished,
  permissionRequest,
  publicIdea,
  reviewIdea,
  suggestCategory,
  tidyDepartment,
  tidyName,
  tidyYear,
} from "../shared/ideas.js";

const submitted = {
  id: "IDEA-1A2B3C4D",
  mode: "idea",
  name: "Asha Rao",
  email: "asha@example.com",
  department: "CSE",
  year: "3rd year",
  title: "Smart recycling bins",
  brief: "Bins that sort waste on campus.",
  category: "Sustainability",
  problem: "Campus waste is mixed together.",
  solution: "Sensors sort waste at the bin. Then data guides collection.",
  targetUsers: "Campus staff",
  why: "Less landfill",
  skills: "IoT",
  members: "Ravi, ravi@example.com",
  notes: "Private organizer note",
  showcaseConsent: true,
  showcase: { published: true, publishedAt: "2026-10-01T00:00:00.000Z" },
};

test("a published idea exposes only the brief and the owner's contact details", () => {
  const card = publicIdea(submitted);
  assert.deepEqual(Object.keys(card).sort(), [
    "brief",
    "category",
    "department",
    "email",
    "id",
    "name",
    "publishedAt",
    "title",
    "year",
  ]);
  assert.equal(card.email, "asha@example.com");
  assert.equal(card.brief, "Bins that sort waste on campus.");
  for (const hidden of ["problem", "solution", "why", "targetUsers", "skills", "members", "notes"])
    assert.equal(card[hidden], undefined);
});

test("an idea is only public when an organizer published it and the student agreed", () => {
  assert.equal(isPublished(submitted), true);
  assert.equal(isPublished({ ...submitted, showcaseConsent: false }), false);
  assert.equal(isPublished({ ...submitted, showcaseConsent: undefined }), false);
  assert.equal(isPublished({ ...submitted, showcase: { published: false } }), false);
  assert.equal(isPublished({ ...submitted, showcase: undefined }), false);
});

test("organizer edits override the student's title and brief", () => {
  const edited = { ...submitted, showcase: { published: true, title: "Sorting bins", brief: "Short." } };
  assert.equal(ideaTitle(edited), "Sorting bins");
  assert.equal(ideaBrief(edited), "Short.");
});

test("older ideas without a title or brief still get tidy, bounded text", () => {
  const old = { ...submitted, title: undefined, brief: undefined };
  assert.equal(ideaTitle(old), "Sensors sort waste at the bin");
  assert.equal(ideaBrief(old), "Campus waste is mixed together. Sensors sort waste at the bin.");
  const long = { solution: "word ".repeat(100), problem: "long ".repeat(100) };
  assert.ok(ideaTitle(long).length <= IDEA_TITLE_MAX);
  assert.ok(ideaBrief(long).length <= IDEA_BRIEF_MAX);
  assert.equal(ideaTitle({}), "Untitled idea");
});

test("unknown categories are dropped", () => {
  assert.equal(publicIdea({ ...submitted, category: "<script>" }).category, "");
});

test("a legacy brief joins the problem and the first line of the solution", () => {
  const legacy = { ...submitted, title: undefined, brief: undefined };
  assert.equal(ideaBrief(legacy), "Campus waste is mixed together. Sensors sort waste at the bin.");
  const long = { problem: "A ".repeat(150) + "problem.", solution: "Fix it." };
  assert.ok(ideaBrief(long).length <= IDEA_BRIEF_MAX);
});

test("categories are suggested from the text and left blank when nothing fits", () => {
  assert.equal(suggestCategory(submitted), "Sustainability");
  assert.equal(suggestCategory({ problem: "Patients wait too long at the hospital", solution: "Queue app for doctors" }), "HealthTech");
  assert.equal(suggestCategory({ problem: "Hmm", solution: "Something" }), "");
});

test("review flags missing permission, bad email, test entries and duplicates", () => {
  const old = { ...submitted, showcaseConsent: undefined, showcase: undefined };
  const review = reviewIdea(old);
  assert.equal(review.ready, false);
  assert.ok(review.issues.some((i) => i.level === "block" && /permission/i.test(i.text)));
  assert.equal(reviewIdea(submitted).ready, true);
  assert.equal(reviewIdea({ ...submitted, email: "nope" }).ready, false);
  assert.ok(reviewIdea({ ...submitted, problem: "test", solution: "test" }).issues.some((i) => /test entry/i.test(i.text)));
  const twin = { ...submitted, id: "IDEA-DUPLICAT" };
  assert.ok(reviewIdea(submitted, [submitted, twin]).issues.some((i) => /Very similar to IDEA-DUPLICAT/.test(i.text)));
  assert.equal(reviewIdea(submitted, [submitted]).issues.length, 0);
  assert.ok(reviewIdea({ ...submitted, brief: "Call me on 9876543210", showcase: undefined }).issues.some((i) => /contact details/.test(i.text)));
});

test("the permission email repeats exactly what would go public and nothing private", () => {
  const mail = permissionRequest(submitted);
  assert.equal(mail.to, "asha@example.com");
  assert.match(mail.subject, /Smart recycling bins/);
  assert.match(mail.body, /Hi Asha,/);
  assert.match(mail.body, /Brief: Bins that sort waste on campus\./);
  assert.match(mail.body, /Owner: Asha Rao, CSE, 3rd year/);
  for (const secret of ["Private organizer note", "IoT", "Campus staff", "Ravi"]) assert.ok(!mail.body.includes(secret));
});

test("legacy titles use the product name the student chose, else a tidy short sentence", () => {
  const named = (solution) => ideaTitle({ solution });
  assert.equal(named("Develop a web application called DeadlineMate where students track deadlines."), "DeadlineMate");
  assert.equal(named("propose CampusConnect, a simple web-based lost and found."), "CampusConnect");
  assert.equal(named("CampusConnect is a platform for reporting problems."), "CampusConnect");
  assert.equal(named("To develop a website to report cybercrimes."), "Website to report cybercrimes");
  assert.ok(named("To develop a website to report any type of cybercrimes in remote areas and for students to learn about it.").length <= 64);
});

test("owner details are shown consistently", () => {
  assert.equal(tidyName("YATHAM VIGNESH "), "Yatham Vignesh");
  assert.equal(tidyName("M.Akshara reddy"), "M.Akshara Reddy");
  assert.equal(tidyDepartment("Cse"), "CSE");
  assert.equal(tidyDepartment("Computer Science"), "Computer Science");
  assert.equal(tidyYear("2rd"), "2nd year");
  assert.equal(tidyYear("2nd year- sem 1"), "2nd year");
  assert.equal(tidyYear("3rd year"), "3rd year");
  assert.equal(tidyYear("Final year"), "Final year");
  const card = publicIdea({ ...submitted, name: "ASHA RAO", department: "Cse", year: "2rd" });
  assert.deepEqual([card.name, card.department, card.year], ["Asha Rao", "CSE", "2nd year"]);
});

test("two ideas with the same title are flagged so one can be renamed", () => {
  const a = { ...submitted, id: "A", title: undefined, showcase: undefined, solution: "CampusConnect finds lost items." , problem: "Students lose belongings around campus often."};
  const b = { ...submitted, id: "B", title: undefined, showcase: undefined, solution: "CampusConnect reports broken facilities.", problem: "Broken lights and leaking taps go unreported for weeks." };
  assert.ok(reviewIdea(a, [a, b]).issues.some((i) => /Same title as B/.test(i.text)));
});
