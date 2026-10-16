import { categories } from "./schema.js";

export const IDEA_TITLE_MAX = 90;
export const IDEA_BRIEF_MAX = 200;
const clip = (text, max) =>
  text.length <= max ? text : text.slice(0, max - 1).trimEnd() + "…";
const clean = (value) =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

/* Ideas submitted before the form asked for a title are named after the first
   sentence of the solution, so the showcase never shows an untitled card. */
export function ideaTitle(record) {
  const chosen = clean(record.showcase?.title) || clean(record.title);
  if (chosen) return clip(chosen, IDEA_TITLE_MAX);
  const solution = clean(record.solution);
  const sentence = solution.match(/^.+?[.!?](?=\s|$)/)?.[0] || solution;
  return clip(sentence.replace(/[.!?]$/, ""), IDEA_TITLE_MAX) || "Untitled idea";
}

/* The public card carries a short brief, never the full write-up. Older ideas
   without one get the opening of their problem statement. */
export function ideaBrief(record) {
  const chosen = clean(record.showcase?.brief) || clean(record.brief);
  return clip(
    chosen || clean(record.problem) || clean(record.solution),
    IDEA_BRIEF_MAX,
  );
}

export const isPublished = (record) =>
  record.showcase?.published === true && record.showcaseConsent === true;

/* The only fields a visitor ever receives: the brief plus the owner's name,
   class and email so interested people can get in touch. The full idea, phone
   numbers, team notes and everything else stay with the organizers. */
export function publicIdea(record) {
  return {
    id: record.id,
    title: ideaTitle(record),
    brief: ideaBrief(record),
    category: categories.includes(record.category) ? record.category : "",
    name: clean(record.name),
    department: clean(record.department),
    year: clean(record.year),
    email: clean(record.email),
    publishedAt: record.showcase?.publishedAt || record.createdAt,
  };
}
