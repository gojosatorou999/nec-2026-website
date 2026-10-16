import { categories } from "./schema.js";

export const IDEA_TITLE_MAX = 90;
export const IDEA_BRIEF_MAX = 200;

const clean = (value) =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
/* Cut at a word boundary so a clipped title never ends mid-word. */
const clip = (text, max) => {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return (space > max * 0.6 ? cut.slice(0, space) : cut).trimEnd() + "…";
};
const sentences = (text) =>
  clean(text)
    .match(/[^.!?]+[.!?]*(?=\s|$)/g)
    ?.map((s) => s.trim())
    .filter(Boolean) || [];
const terminate = (s) => (/[.!?…]$/.test(s) ? s : s + ".");

/* Ideas submitted before the form asked for a title are named after the
   product the student named ("called DeadlineMate", "propose CampusConnect"),
   else a shortened first sentence, so the showcase never shows an untitled card. */
const PRODUCT = [
  /\b(?:called|named|titled|propose|proposing|introduce|introducing)\s+["“'‘]?([A-Z][A-Za-z0-9]{2,})/,
  /\b([A-Z][a-z0-9]+(?:[A-Z][a-z0-9]+)+)\b/,
];
const LEAD =
  /^(?:(?:i|we)\s+)?(?:(?:want|would like|plan|propose|suggest)s?\s+)?(?:to\s+)?(?:(?:develop|build|create|make|design|introduce|implement)\s+)?(?:(?:a|an|the)\s+)?/i;
function derivedTitle(record) {
  for (const text of [clean(record.solution), clean(record.problem)])
    for (const pattern of PRODUCT) {
      const name = text.match(pattern)?.[1];
      if (name) return { text: name, product: true };
    }
  const first = sentences(record.solution)[0] || clean(record.solution);
  const plain = first.replace(/[.!?]+$/, "").replace(LEAD, "");
  const text = clip(plain.charAt(0).toUpperCase() + plain.slice(1), 64);
  return { text, product: false };
}
export function ideaTitle(record) {
  const chosen = clean(record.showcase?.title) || clean(record.title);
  if (chosen) return clip(chosen, IDEA_TITLE_MAX);
  return derivedTitle(record).text || "Untitled idea";
}

/* The public card carries a short brief, never the full write-up. Older ideas
   without one get the problem and the first line of the solution, or just the
   problem when both would not fit. */
export function ideaBrief(record) {
  const chosen = clean(record.showcase?.brief) || clean(record.brief);
  if (chosen) return clip(chosen, IDEA_BRIEF_MAX);
  const first = sentences(record.problem)[0];
  const problem = first && first.length >= 25 ? first : "";
  const solution = sentences(record.solution)[0];
  const both = [problem, solution].filter(Boolean).map(terminate).join(" ");
  if (both.length <= IDEA_BRIEF_MAX) return both;
  return clip(problem ? terminate(problem) : terminate(solution || ""), IDEA_BRIEF_MAX);
}

/* Keyword guess so older ideas land in a filterable category. It is a
   suggestion only: organizers confirm it before anything is published. */
const KEYWORDS = {
  "AI / ML": ["ai", "artificial intelligence", "machine learning", "ml", "neural", "chatbot", "computer vision", "nlp", "deep learning", "predict", "recommendation"],
  FinTech: ["payment", "upi", "bank", "loan", "wallet", "finance", "invest", "insurance", "credit", "budget", "expense", "savings"],
  EdTech: ["learning", "education", "course", "tutor", "exam", "study", "teach", "classroom", "curriculum", "quiz", "notes"],
  HealthTech: ["health", "medical", "patient", "doctor", "hospital", "medicine", "fitness", "mental", "wellness", "diagnos"],
  ConstructionTech: ["construction", "civil", "architect", "cement", "contractor", "infrastructure", "building material"],
  Sustainability: ["waste", "recycl", "solar", "energy", "carbon", "climate", "environment", "plastic", "sustainab", "compost", "pollution", "water saving"],
  Consumer: ["food", "delivery", "fashion", "travel", "shopping", "canteen", "hostel", "rent", "marketplace", "mess"],
  SaaS: ["dashboard", "software", "automation", "workflow", "crm", "api", "saas", "management system"],
  Hardware: ["sensor", "iot", "arduino", "device", "robot", "drone", "embedded", "circuit", "wearable", "hardware"],
};
export function suggestCategory(record) {
  const text = " " + [record.title, record.problem, record.solution, record.targetUsers, record.why, record.skills].map(clean).join(" ").toLowerCase();
  let best = "";
  let top = 0;
  for (const category of categories) {
    const score = (KEYWORDS[category] || []).filter((word) =>
      // Short keywords ("ai", "ml", "rent") must be whole words, not the start of another word.
      new RegExp("[^a-z]" + word.replace(/[/\\^$*+?.()|[\]{}]/g, "\\$&") + (word.length <= 4 ? "(?![a-z])" : "")).test(text),
    ).length;
    if (score > top) [best, top] = [category, score];
  }
  // One stray keyword is a coin toss, so leave the category for an organizer to choose.
  return top >= 2 ? best : "";
}

/* Students type their details in all sorts of ways ("YATHAM VIGNESH", "Cse",
   "2rd"); show them consistently. */
export function tidyName(value) {
  return clean(value)
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + (w === w.toUpperCase() && w.length > 2 ? w.slice(1).toLowerCase() : w.slice(1)))
    .join(" ");
}
export function tidyDepartment(value) {
  const text = clean(value);
  return /^[A-Za-z]{2,5}$/.test(text) ? text.toUpperCase() : text;
}
export function tidyYear(value) {
  const text = clean(value);
  const n = text.match(/^([1-6])/)?.[1];
  if (!n) return text;
  return n + ({ 1: "st", 2: "nd", 3: "rd" }[n] || "th") + " year";
}

export const isPublished = (record) =>
  record.showcase?.published === true && record.showcaseConsent === true;

const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const PHONE = /(?:\+?\d[\s-]?){10,}/;
const JUNK = /^(test|testing|asdf|qwerty|abc|xyz|hello|hi|demo|sample)\b/i;
const words = (record) =>
  new Set(
    [record.problem, record.solution]
      .map(clean)
      .join(" ")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 3),
  );
const overlap = (a, b) => {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const w of a) if (b.has(w)) shared++;
  return shared / Math.min(a.size, b.size);
};

/* One idea, as the organizers should see it before publishing: the draft that
   would go public plus everything worth a second look. `block` issues stop
   publishing; `warn` issues are a nudge. `others` finds near-duplicates. */
export function reviewIdea(record, others = []) {
  const draft = {
    title: ideaTitle(record),
    brief: ideaBrief(record),
    category: categories.includes(record.category) ? record.category : suggestCategory(record),
  };
  const issues = [];
  const body = [record.problem, record.solution].map(clean).join(" ");
  if (record.showcaseConsent !== true)
    issues.push({ level: "block", text: "No permission to show this publicly yet" });
  if (!EMAIL.test(clean(record.email)))
    issues.push({ level: "block", text: "No valid email, so nobody could contact the owner" });
  if (body.length < 40 || JUNK.test(clean(record.problem)) || JUNK.test(clean(record.solution)))
    issues.push({ level: "warn", text: "Very short or looks like a test entry" });
  if (EMAIL.test(draft.brief + " " + draft.title) || PHONE.test(draft.brief + " " + draft.title))
    issues.push({ level: "block", text: "The title or brief contains contact details" });
  const mine = words(record);
  if (!clean(record.showcase?.title) && !clean(record.title))
    issues.push({ level: "warn", text: "The title was drafted automatically, so check the wording" });
  for (const other of others) {
    if (other.id === record.id) continue;
    if (overlap(mine, words(other)) >= 0.7 && mine.size >= 5)
      issues.push({ level: "warn", text: `Very similar to ${other.id}` });
    else if (ideaTitle(other).toLowerCase() === draft.title.toLowerCase())
      issues.push({ level: "warn", text: `Same title as ${other.id}, so give one of them a more specific title` });
  }
  return {
    id: record.id,
    draft,
    issues,
    ready: !issues.some((i) => i.level === "block"),
    published: isPublished(record),
  };
}

/* The email an organizer sends to ask a student if their idea may be shown.
   It repeats exactly what would go public so the consent is informed. */
export function permissionRequest(record, draft = reviewIdea(record).draft) {
  const first = tidyName(record.name).split(" ")[0] || "there";
  const classLine = [tidyDepartment(record.department), tidyYear(record.year)].filter(Boolean).join(", ");
  return {
    to: clean(record.email),
    subject: `Can we feature your idea “${draft.title}” in the Idea Box showcase?`,
    body: [
      `Hi ${first},`,
      "",
      "Thank you for sharing your idea with the Idea Incubator at MGIT. We liked it and would like to feature it in the public Idea Box showcase.",
      "",
      "This is all that would be shown:",
      `  Title: ${draft.title}`,
      `  Brief: ${draft.brief}`,
      draft.category ? `  Category: ${draft.category}` : null,
      `  Owner: ${tidyName(record.name)}${classLine ? ", " + classLine : ""}`,
      `  Contact: ${clean(record.email)} (so interested people can reach you)`,
      "",
      "Your full idea stays private with the organizers. If you are happy for this to go live, just reply “Yes”. If you would like the wording changed, or would rather not be featured, tell us and we will respect that.",
      "",
      "Idea Incubator, MGIT",
    ]
      .filter((line) => line !== null)
      .join("\n"),
  };
}

/* The only fields a visitor ever receives: the brief plus the owner's name,
   class and email so interested people can get in touch. The full idea, phone
   numbers, team notes and everything else stay with the organizers. */
export function publicIdea(record) {
  return {
    id: record.id,
    title: ideaTitle(record),
    brief: ideaBrief(record),
    category: categories.includes(record.category) ? record.category : "",
    name: tidyName(record.name),
    department: tidyDepartment(record.department),
    year: tidyYear(record.year),
    email: clean(record.email),
    publishedAt: record.showcase?.publishedAt || record.createdAt,
  };
}
