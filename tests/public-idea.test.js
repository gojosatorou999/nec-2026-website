import { test } from "node:test";
import assert from "node:assert/strict";
import {
  IDEA_BRIEF_MAX,
  IDEA_TITLE_MAX,
  ideaBrief,
  ideaTitle,
  isPublished,
  publicIdea,
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
  assert.equal(ideaBrief(old), "Campus waste is mixed together.");
  const long = { solution: "word ".repeat(100), problem: "long ".repeat(100) };
  assert.ok(ideaTitle(long).length <= IDEA_TITLE_MAX);
  assert.ok(ideaBrief(long).length <= IDEA_BRIEF_MAX);
  assert.equal(ideaTitle({}), "Untitled idea");
});

test("unknown categories are dropped", () => {
  assert.equal(publicIdea({ ...submitted, category: "<script>" }).category, "");
});
