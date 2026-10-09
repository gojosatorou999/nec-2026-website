import { safeUrl } from "../shared/schema.js";
export function publicStartup(application, stall = null) {
  const keys = [
    "name",
    "tagline",
    "category",
    "stage",
    "logo",
    "problem",
    "solution",
    "targetUsers",
    "value",
    "productDescription",
    "productStatus",
    "images",
    "businessModel",
    "hiring",
    "requiredRoles",
    "requiredSkills",
    "openings",
    "opportunity",
    "founderName",
    "organization",
    "display",
    "displayOther",
  ];
  const profile = Object.fromEntries(
    keys
      .filter((key) => application[key] !== undefined)
      .map((key) => [key, application[key]]),
  );
  for (const key of ["website", "social", "demo", "prototype", "video"])
    if (safeUrl(application[key])) profile[key] = application[key];
  const members = (
    Array.isArray(application.members) ? application.members : []
  )
    .filter((m) => m && typeof m.name === "string" && m.name.trim())
    .map(({ name, role, skills, profile }) => ({
      name,
      role: role || "Team member",
      ...(skills ? { skills } : {}),
      ...(safeUrl(profile) ? { profile } : {}),
    }));
  if (
    application.founderName &&
    !members.some(
      (m) =>
        m.name.trim().toLowerCase() ===
        application.founderName.trim().toLowerCase(),
    )
  )
    members.unshift({
      name: application.founderName,
      role: "Founder / Team leader",
    });
  return {
    ...profile,
    members,
    teamSize: Number(application.teamSize) || members.length || undefined,
    status: "Approved",
    stall: stall || null,
    theme: "sky",
    symbol: "spark",
    isDemo: false,
  };
}
