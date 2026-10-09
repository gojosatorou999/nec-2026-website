import { steps } from "./schema.js";
const labels = Object.fromEntries(
  steps.flatMap((s) => s.fields).map(([key, label]) => [key, label]),
);
Object.assign(labels, {
  id: "Reference",
  createdAt: "Received at",
  submittedAt: "Submitted at",
  notes: "Internal notes",
  stall: "Assigned stall",
  founderCount: "Number of founders",
  relevantLinks: "Relevant links",
  productDescription: "Product description",
  targetUsers: "Target users",
  why: "Why this idea matters",
  startupId: "Startup reference",
  problemId: "Challenge reference",
  trackingHash: "",
});
const privateKeys = new Set([
  "trackingHash",
  "token",
  "password",
  "passwordHash",
  "salt",
]);
export const fieldLabel = (key) =>
  labels[key] ||
  key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());
export const isUpload = (value) =>
  value &&
  typeof value === "object" &&
  typeof value.data === "string" &&
  (/^data:(image\/(png|jpeg|webp)|application\/pdf);base64,/.test(value.data) ||
    (value.data.startsWith("/api/admin/files/") &&
      /^(image\/(png|jpeg|webp)|application\/pdf)$/.test(value.mimeType)));
export function submissionSections(record) {
  const isApplication =
    record.founderName !== undefined || String(record.id).startsWith("MGIT-");
  const sections = [],
    used = new Set();
  const valueText = (value) => {
    if (value === null || value === undefined || value === "")
      return "Not provided";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (isUpload(value)) return value.name || "Uploaded file";
    if (Array.isArray(value))
      return value.length ? value.map(valueText).join(", ") : "None";
    if (typeof value === "object")
      return Object.entries(value)
        .filter(([k]) => !privateKeys.has(k) && k !== "data")
        .map(([k, v]) => fieldLabel(k) + ": " + valueText(v))
        .join("\n");
    return String(value);
  };
  const add = (title, keys) => {
    const fields = keys
      .filter(
        (key) =>
          !used.has(key) && !privateKeys.has(key) && record[key] !== undefined,
      )
      .map((key) => {
        used.add(key);
        return {
          key,
          label: key === "name" && !isApplication ? "Name" : fieldLabel(key),
          value: valueText(record[key]),
        };
      });
    if (fields.length) sections.push({ title, fields });
  };
  add("Submission overview", [
    "id",
    "status",
    "submittedAt",
    "createdAt",
    "stall",
  ]);
  if (!isApplication)
    add("Contact details", [
      "name",
      "email",
      "phone",
      "organization",
      "department",
      "year",
      "visitorType",
    ]);
  if (isApplication)
    for (const step of steps.slice(0, -1))
      add(
        step.title,
        step.fields.map(([key]) => key).filter((key) => key !== "members"),
      );
  if (Array.isArray(record.members)) {
    used.add("members");
    record.members.forEach((member, i) => {
      if (!member || typeof member !== "object") return;
      sections.push({
        title: "Team member " + (record.teamSize ? i + 2 : i + 1),
        fields: Object.entries(member)
          .filter(([key]) => !privateKeys.has(key) && key !== "data")
          .map(([key, value]) => ({
            key,
            label:
              key === "name"
                ? "Full name"
                : key === "phone"
                  ? "Contact number"
                  : fieldLabel(key),
            value: valueText(value),
          })),
      });
    });
  }
  add(
    "Additional submitted details",
    Object.keys(record).filter((key) => key !== "notes"),
  );
  add("Organizer notes", ["notes"]);
  return sections;
}
export function submissionMarkdown(record, kind = "Application") {
  const escape = (value) =>
    String(value).replace(/[\\`*_{}[\]()#+.!|<>~-]/g, "\\$&");
  return (
    "# " +
    escape(kind) +
    " - " +
    escape(record.name || record.id) +
    "\n\n" +
    submissionSections(record)
      .map(
        (section) =>
          "## " +
          escape(section.title) +
          "\n\n" +
          section.fields
            .map(
              (field) =>
                "**" +
                escape(field.label) +
                "**\n\n" +
                escape(field.value) +
                "\n",
            )
            .join("\n"),
      )
      .join("\n") +
    "\nUploaded files are listed by name. Download the original files from the admin review page.\n"
  );
}
