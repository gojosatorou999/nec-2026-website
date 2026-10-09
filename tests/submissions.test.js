import { test } from "node:test";
import assert from "node:assert/strict";
import {
  submissionSections,
  submissionMarkdown,
} from "../shared/submissions.js";
test("reports retain legacy answers and exclude private access secrets", () => {
  const record = {
    id: "MGIT-test",
    name: "A **startup**",
    logo: { name: "logo.png", data: "data:image/png;base64,abc" },
    businessModel: "Legacy details",
    documents: [{ name: "pitch.pdf", data: "data:application/pdf;base64,abc" }],
    teamSize: "2",
    members: [
      {
        name: "Member",
        email: "member@example.com",
        phone: "9876543210",
        password: "secret",
      },
    ],
    trackingHash: "private-hash",
    notes: "Organizer notes",
  };
  const sections = submissionSections(record);
  const text = submissionMarkdown(record);
  assert.ok(
    sections.some((s) => s.fields.some((f) => f.value === "Legacy details")),
  );
  assert.ok(text.includes("pitch"));
  assert.ok(text.includes("Member"));
  assert.ok(text.includes("Organizer notes"));
  assert.ok(!text.includes("private-hash"));
  assert.ok(!text.includes("secret"));
  assert.ok(!text.includes("base64"));
  assert.ok(!text.includes("A **startup**"));
});
