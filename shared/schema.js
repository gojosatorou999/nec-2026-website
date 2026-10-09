export const categories = [
  "AI / ML",
  "FinTech",
  "EdTech",
  "HealthTech",
  "ConstructionTech",
  "Sustainability",
  "Consumer",
  "SaaS",
  "Hardware",
  "Other",
];
export const stages = [
  "Idea",
  "Prototype",
  "MVP",
  "Early Users",
  "Revenue Generating",
  "Scaling",
];
export const roles = [
  "Co-founders",
  "Developers",
  "Designers",
  "Marketing",
  "Operations",
  "Other",
];
export const steps = [
  {
    title: "Startup & display",
    caption: "Introduce your startup and what you’ll bring to the expo.",
    fields: [
      ["name", "Startup name", "text", true],
      ["tagline", "One-line idea", "text", true],
      [
        "display",
        "What is used for the display?",
        "checks",
        true,
        ["Prototype", "Poster", "Demo", "Other"],
      ],
      ["displayOther", "Other response", "text", true],
      ["logo", "Startup logo", "file", true],
    ],
  },
  {
    title: "Leader & team",
    caption:
      "Team size includes the founder / team leader. Add contact details for each additional member.",
    fields: [
      ["founderName", "Founder/Team leader name", "text", true],
      ["email", "Email ID", "email", true],
      ["organization", "College/organization", "text", true],
      ["phone", "Contact number (WhatsApp preferred)", "tel", true],
      ["collegeEmail", "College email", "email", true],
      ["teamSize", "Team size", "text", true],
      ["members", "Additional team members", "members"],
    ],
  },
  {
    title: "Stall requirements",
    caption: "Let us know what your team needs at the stall.",
    fields: [
      [
        "stallRequirements",
        "Stall requirements",
        "checks",
        false,
        ["Table", "Power socket", "Wall space for posters"],
      ],
      ["otherRequirements", "Other stall requirements", "textarea"],
    ],
  },
  {
    title: "Review & submit",
    caption: "Check your startup, team and stall details before submitting.",
    fields: [],
  },
];
export const fieldVisible = (key, data) =>
  key === "displayOther"
    ? Array.isArray(data.display) && data.display.includes("Other")
    : key === "members"
      ? Number(data.teamSize) > 1
      : true;
export const memberFields = [
  ["name", "Full name", "text", true],
  ["phone", "Contact number", "tel", true],
  ["email", "Email ID", "email", true],
  ["organization", "College/organization", "text"],
  ["role", "Role in the startup", "text"],
];
export const safeUrl = (value) => {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};
export function validateApplication(data) {
  const errors = {};
  if (!data || typeof data !== "object" || Array.isArray(data))
    return { application: "Submit a valid application." };
  for (const step of steps)
    for (const [key, label, type, required, options] of step.fields) {
      if (!fieldVisible(key, data)) continue;
      const v = data[key];
      if (
        type === "checks" &&
        ((required && (!Array.isArray(v) || !v.length)) ||
          (v !== undefined &&
            (!Array.isArray(v) || v.some((item) => !options.includes(item)))))
      )
        errors[key] = required
          ? "Choose at least one listed option."
          : "Choose only listed options.";
      if (
        type === "file" &&
        required &&
        (!v ||
          typeof v.data !== "string" ||
          !/^data:image\/(png|jpeg|webp);base64,/.test(v.data))
      )
        errors[key] = "Upload your startup logo (PNG, JPEG or WebP).";
      if (
        v !== undefined &&
        v !== null &&
        ["text", "email", "tel", "url", "textarea", "select"].includes(type) &&
        typeof v !== "string"
      ) {
        errors[key] = `${label} must be text.`;
        continue;
      }
      if (type === "boolean" && required && v !== true) {
        errors[key] = "Please confirm the declaration before continuing.";
        continue;
      }
      if (type === "boolean" && v !== undefined && typeof v !== "boolean") {
        errors[key] = "Choose yes or no.";
        continue;
      }
      if (
        required &&
        (v === undefined || v === null || (typeof v === "string" && !v.trim()))
      )
        errors[key] = `${label} is required.`;
      if (v && type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
        errors[key] = "Enter a valid email address.";
      if (v && type === "url" && !safeUrl(v))
        errors[key] = "Enter a complete http:// or https:// URL.";
      if (v && type === "tel" && !/^\+?[\d\s()-]{8,20}$/.test(v))
        errors[key] = "Enter a valid phone number.";
      if (v && type === "select" && !options.includes(v))
        errors[key] = "Choose a listed option.";
      if (
        v !== undefined &&
        v !== "" &&
        type === "number" &&
        (!Number.isInteger(Number(v)) || Number(v) < 1 || Number(v) > 100)
      )
        errors[key] = "Enter a whole number between 1 and 100.";
      if (typeof v === "string" && v.length > 6000)
        errors[key] = "Keep this answer under 6,000 characters.";
    }
  if (
    typeof data.teamSize !== "string" ||
    !/^\d+$/.test(data.teamSize.trim()) ||
    Number(data.teamSize) < 1 ||
    Number(data.teamSize) > 100
  )
    errors.teamSize =
      "Enter a whole number from 1 to 100, including the team leader.";
  if (
    Array.isArray(data.display) &&
    data.display.includes("Other") &&
    (typeof data.displayOther !== "string" || !data.displayOther.trim())
  )
    errors.displayOther = "Tell us what else you will display.";
  const expectedMembers = Number(data.teamSize) - 1;
  if (
    Number.isInteger(expectedMembers) &&
    expectedMembers >= 0 &&
    expectedMembers < 100
  ) {
    if (
      (expectedMembers > 0 || data.members !== undefined) &&
      (!Array.isArray(data.members) || data.members.length !== expectedMembers)
    ) {
      errors.members =
        "Add details for all " + expectedMembers + " additional team members.";
    } else {
      for (const [index, member] of (data.members || []).entries()) {
        for (const [key, label, type, required] of memberFields) {
          const value = member?.[key];
          if (
            (required && (typeof value !== "string" || !value.trim())) ||
            (value !== undefined &&
              (typeof value !== "string" || value.length > 500)) ||
            (value &&
              type === "email" &&
              !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) ||
            (value && type === "tel" && !/^\+?[\d\s()-]{8,20}$/.test(value))
          ) {
            errors.members =
              "Team member " +
              (index + 2) +
              ": enter a valid " +
              label.toLowerCase() +
              ".";
            break;
          }
        }
        if (errors.members) break;
      }
    }
  }
  if (
    data.images !== undefined &&
    (!Array.isArray(data.images) || data.images.length > 3)
  )
    errors.images = "Upload no more than three product images.";
  if (data.hiring)
    for (const key of [
      "requiredRoles",
      "requiredSkills",
      "openings",
      "opportunity",
    ])
      if (!data[key] || (Array.isArray(data[key]) && !data[key].length))
        errors[key] = "Complete this field when looking for team members.";
  if (
    data.requiredRoles &&
    (!Array.isArray(data.requiredRoles) ||
      data.requiredRoles.some((r) => !roles.includes(r)))
  )
    errors.requiredRoles = "Choose valid team roles.";
  if (
    typeof data.relevantLinks === "string" &&
    data.relevantLinks.trim() &&
    data.relevantLinks
      .split(/\r?\n/)
      .filter((link) => link.trim())
      .some((link) => !safeUrl(link.trim()))
  )
    errors.relevantLinks =
      "Enter one complete http:// or https:// link per line.";
  if (
    data.documents !== undefined &&
    (!Array.isArray(data.documents) || data.documents.length > 3)
  )
    errors.documents = "Upload up to 3 documents.";
  return errors;
}
