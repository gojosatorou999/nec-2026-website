import { test } from "node:test";
import assert from "node:assert/strict";
import { publicStartup } from "../server/public-startup.js";
test("accepted profiles restore leader and logo while keeping contact information private", () => {
  const profile = publicStartup(
    {
      name: "New startup",
      tagline: "A useful idea",
      founderName: "Leader",
      organization: "MGIT",
      teamSize: "2",
      logo: { name: "logo.png", data: "data:image/png;base64,abc" },
      display: ["Demo", "Other"],
      displayOther: "Working model",
      members: [
        { name: "Teammate", email: "private@example.com", phone: "9876543210" },
      ],
      email: "leader@example.com",
      collegeEmail: "leader@college.edu",
      phone: "9876543211",
      notes: "Private",
      documents: [{ name: "secret.pdf" }],
      stallRequirements: ["Power socket"],
      website: "javascript:alert(1)",
    },
    "A-03",
  );
  assert.equal(profile.founderName, "Leader");
  assert.equal(profile.members[0].name, "Leader");
  assert.equal(profile.members[1].role, "Team member");
  assert.equal(profile.teamSize, 2);
  assert.equal(profile.stall, "A-03");
  assert.equal(profile.displayOther, "Working model");
  assert.equal(profile.logo.name, "logo.png");
  for (const key of [
    "email",
    "collegeEmail",
    "phone",
    "notes",
    "documents",
    "stallRequirements",
    "website",
  ])
    assert.equal(profile[key], undefined);
  assert.ok(profile.members.every((m) => !m.email && !m.phone));
});
test("older team rosters do not duplicate the leader", () => {
  const profile = publicStartup({
    founderName: "Leader",
    members: [{ name: "Leader", role: "Founder", skills: "Design" }],
  });
  assert.equal(profile.members.length, 1);
  assert.equal(profile.teamSize, 1);
  assert.equal(profile.members[0].skills, "Design");
});
