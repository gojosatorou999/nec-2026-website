import { uploadLinks, sendUpload } from "./upload-links.js";
import express from "express";
import { Database, StorageUnavailable } from "./database.js";
import {
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { validateApplication } from "../shared/schema.js";
import { submissionMarkdown } from "../shared/submissions.js";
import { submissionPdf } from "./submission-pdf.js";
import { publicStartup } from "./public-startup.js";
import { submitOnce, replaySavedSubmission } from "./submission-store.js";

const db = new Database();
const hash = (s) => createHash("sha256").update(s).digest("hex");
let initialization;
async function initialize() {
  if (!initialization) {
    initialization = (async () => {
      await db.ready();
      await db.transaction(async (tx) => {
        await tx.query(
          "SELECT pg_advisory_xact_lock(hashtextextended('expo-admin-bootstrap',0))",
        );
        if (!(await tx.all("users")).length) {
          const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
          const password = process.env.ADMIN_PASSWORD;
          if (!email || !password)
            throw new Error(
              "Configure ADMIN_EMAIL and ADMIN_PASSWORD before the first launch.",
            );
          const salt = randomBytes(16).toString("hex");
          await tx.put("users", randomUUID(), {
            email,
            salt,
            passwordHash: scryptSync(password, salt, 64).toString("hex"),
            role: "organizer",
          });
        }
      });
    })().catch((error) => {
      initialization = null;
      throw error;
    });
  }
  return initialization;
}
const app = express();
app.disable("x-powered-by");
app.get("/api/health", async (req, res) => {
  try {
    await db.ready();
    res.json({ ready: true, storage: "supabase" });
  } catch {
    res.status(503).json({
      ready: false,
      storage: "supabase",
      error: "Database is not connected. Submissions are paused.",
    });
  }
});
app.use(express.json({ limit: "4mb" }));
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  if (req.path.startsWith("/api")) res.setHeader("Cache-Control", "no-store");
  if (
    !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
    req.headers.origin &&
    new URL(req.headers.origin).host !== req.headers.host
  )
    return res
      .status(403)
      .json({ error: "This request must come from the Expo website." });
  next();
});
app.use("/api", async (req, res, next) => {
  await initialize();
  next();
});
app.use(replaySavedSubmission(db));
const limits = new Map();
app.use("/api", (req, res, next) => {
  if (req.method === "GET") return next();
  const key = req.ip + req.path;
  const now = Date.now();
  const bucket = limits.get(key) || { time: now, count: 0 };
  if (now - bucket.time > 60000) {
    bucket.time = now;
    bucket.count = 0;
  }
  bucket.count++;
  limits.set(key, bucket);
  if (bucket.count > 40)
    return res
      .status(429)
      .json({ error: "Too many requests. Please try again in a minute." });
  next();
});
setInterval(() => {
  for (const [k, v] of limits)
    if (Date.now() - v.time > 60000) limits.delete(k);
}, 60000).unref();
const auth = async (req, res, next) => {
  const token = req.headers.cookie
    ?.split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("expo_session="))
    ?.split("=")[1];
  const session = token ? await db.get("sessions", hash(token)) : null;
  if (!session || session.expires < Date.now())
    return res.status(401).json({ error: "Please sign in as an organizer." });
  req.user = await db.get("users", session.userId);
  if (!req.user || req.user.role !== "organizer")
    return res.status(401).json({ error: "Session expired." });
  next();
};
app.post("/api/login", async (req, res) => {
  const user = (await db.all("users")).find(
    (u) => u.email === String(req.body.email).trim().toLowerCase(),
  );
  const candidate = scryptSync(
    String(req.body.password || "").slice(0, 256),
    user?.salt || "missing",
    64,
  );
  if (
    !user ||
    !timingSafeEqual(candidate, Buffer.from(user.passwordHash, "hex"))
  )
    return res.status(401).json({ error: "Email or password is incorrect." });
  const token = randomBytes(32).toString("hex");
  await db.put("sessions", hash(token), {
    userId: user.id,
    expires: Date.now() + 86400000,
  });
  res
    .cookie("expo_session", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.COOKIE_SECURE === "true",
      maxAge: 86400000,
      path: "/",
    })
    .json({ email: user.email });
});
app.post("/api/logout", auth, async (req, res) => {
  const token = req.headers.cookie
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("expo_session="))
    ?.split("=")[1];
  if (token) await db.remove("sessions", hash(token));
  res.clearCookie("expo_session").json({ ok: true });
});
app.get("/api/me", auth, async (req, res) =>
  res.json({ email: req.user.email }),
);
app.get("/api/startups", async (req, res) =>
  res.json(
    (await db.all("startups"))
      .filter((s) => s.status === "Approved" && !s.isDemo)
      .map((s) =>
        req.get("X-Expo-Media") === "links"
          ? uploadLinks(s, "/api/startups/" + s.id + "/files")
          : s,
      ),
  ),
);
app.get("/api/startups/:id/files/:field{/:index}", async (req, res) => {
  const startup = await db.get("startups", req.params.id);
  if (
    !startup ||
    startup.status !== "Approved" ||
    startup.isDemo ||
    !["logo", "images"].includes(req.params.field)
  )
    return res.status(404).json({ error: "File not found." });
  sendUpload(res, startup, req.params.field, req.params.index);
});
app.get("/api/problems", async (req, res) =>
  res.json((await db.all("problem_statements")).filter((p) => p.active)),
);

function checkFile(file) {
  if (
    !file ||
    typeof file.data !== "string" ||
    !/^data:image\/(png|jpeg|webp);base64,/.test(file.data)
  )
    throw new Error("Upload a PNG, JPEG or WebP image.");
  const b = Buffer.from(file.data.split(",")[1], "base64");
  if (b.length > 2 * 1024 * 1024)
    throw new Error("Each image must be smaller than 2 MB.");
  const valid =
    b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
    (b[0] === 255 && b[1] === 216 && b[2] === 255) ||
    (b.toString("ascii", 0, 4) === "RIFF" &&
      b.toString("ascii", 8, 12) === "WEBP");
  if (!valid) throw new Error("This image file is invalid.");
  return { name: String(file.name || "image").slice(0, 100), data: file.data };
}
function checkDocument(file) {
  if (
    !file ||
    typeof file.name !== "string" ||
    !file.name.trim() ||
    typeof file.data !== "string"
  )
    throw new Error("Choose a valid PDF or image document.");
  if (file.data.startsWith("data:image/")) return checkFile(file);
  if (!/^data:application\/pdf;base64,[A-Za-z0-9+/]+={0,2}$/.test(file.data))
    throw new Error("Documents must be PDF, PNG, JPEG or WebP files.");
  const bytes = Buffer.from(file.data.split(",")[1], "base64");
  if (
    bytes.length > 2 * 1024 * 1024 ||
    bytes.toString("ascii", 0, 5) !== "%PDF-"
  )
    throw new Error("Upload a valid PDF under 2 MB.");
  return { name: file.name.slice(0, 100), data: file.data };
}
app.post("/api/applications", async (req, res) => {
  const data = req.body;
  const errors = validateApplication(data);
  if (Object.keys(errors).length)
    return res
      .status(400)
      .json({ error: "Please complete all required information.", errors });
  try {
    data.logo = checkFile(data.logo);
    data.table = data.stallRequirements?.includes("Table") || false;
    data.electricity =
      data.stallRequirements?.includes("Power socket") || false;
    data.wallSpace =
      data.stallRequirements?.includes("Wall space for posters") || false;
    if (!data.display.includes("Other")) data.displayOther = "";
    data.documents = (data.documents || []).map(checkDocument);
    data.members = data.members || [];
    data.images = (data.images || []).slice(0, 3).map(checkFile);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
  const result = await submitOnce(db, req, async (tx) => {
    const id = "MGIT-" + randomBytes(5).toString("hex").toUpperCase();
    const token = randomBytes(24).toString("hex");

    await tx.put("startup_applications", id, {
      ...data,
      status: "Submitted",
      trackingHash: hash(token),
      notes: "",
      submittedAt: new Date().toISOString(),
    });
    for (const m of data.members)
      await tx.put("startup_members", randomUUID(), {
        applicationId: id,
        ...m,
      });
    await tx.put("startup_products", id, {
      applicationId: id,
      description: data.productDescription,
      status: data.productStatus,
      images: data.images,
      demo: data.demo,
      prototype: data.prototype,
      video: data.video,
    });
    await tx.put("startup_requirements", id, {
      applicationId: id,
      ...Object.fromEntries(
        [
          "display",
          "displayOther",
          "stallRequirements",
          "wallSpace",
          "demonstration",
          "electricity",
          "table",
          "monitor",
          "internet",
          "otherRequirements",
        ].map((k) => [k, data[k]]),
      ),
    });
    return { id, token, status: "Submitted" };
  });
  res.status(201).json(result);
});
app.get("/api/applications/:id/status", async (req, res) => {
  const a = await db.get("startup_applications", req.params.id);
  if (!a || hash(req.headers["x-tracking-token"] || "") !== a.trackingHash)
    return res.status(404).json({
      error:
        "Application not found. Check your reference ID and private access code.",
    });
  res.json({
    id: a.id,
    name: a.name,
    status: a.status,
    stall: (await db.get("stall_assignments", a.id))?.stall,
    feedback: (await db.all("feedback")).filter((f) => f.startupId === a.id),
    interests: (await db.all("join_interests")).filter(
      (f) => f.startupId === a.id,
    ),
  });
});
const requiredText = (data, keys) =>
  keys.every(
    (k) =>
      typeof data[k] === "string" && data[k].trim() && data[k].length <= 6000,
  );
app.post("/api/feedback", async (req, res) => {
  const d = req.body;
  const s = await db.get("startups", d.startupId);
  if (!s || s.status !== "Approved")
    return res.status(404).json({ error: "Startup not found." });
  if (
    !requiredText(d, [
      "overall",
      "problem",
      "interesting",
      "suggestions",
      "questions",
      "visitorType",
    ]) ||
    !["Student", "Faculty", "Industry", "Other"].includes(d.visitorType)
  )
    return res
      .status(400)
      .json({ error: "Please complete every feedback question." });
  const result = await submitOnce(db, req, async (tx) => {
    const id = randomUUID();
    await tx.put("feedback", id, { ...d, createdAt: new Date().toISOString() });
    return { ok: true, id };
  });
  res.status(201).json(result);
});
app.post("/api/join", async (req, res) => {
  const d = req.body;
  const s = await db.get("startups", d.startupId);
  if (!s || s.status !== "Approved" || !s.hiring)
    return res.status(400).json({
      error: "This startup is not currently looking for team members.",
    });
  if (
    !requiredText(d, ["name", "email", "skills", "message"]) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)
  )
    return res
      .status(400)
      .json({ error: "Complete your details with a valid email address." });
  const result = await submitOnce(db, req, async (tx) => {
    const id = randomUUID();
    await tx.put("join_interests", id, d);
    return { ok: true, id };
  });
  res.status(201).json(result);
});
app.post("/api/ideas", async (req, res) => {
  const d = req.body;
  const keys = ["name", "email", "department", "year", "solution"];
  if (d.mode === "rapid") keys.push("problemId", "explanation");
  else keys.push("problem", "targetUsers", "why", "skills");
  if (!requiredText(d, keys) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email))
    return res.status(400).json({
      error: "Please complete the required fields with a valid email.",
    });
  if (
    d.mode === "rapid" &&
    !(await db.get("problem_statements", d.problemId))?.active
  )
    return res
      .status(400)
      .json({ error: "Choose an active NEC problem statement." });
  const result = await submitOnce(db, req, async (tx) => {
    const id = "IDEA-" + randomBytes(4).toString("hex").toUpperCase();
    await tx.put(
      d.mode === "rapid" ? "rapid_fire_submissions" : "idea_submissions",
      id,
      d,
    );
    return { id };
  });
  res.status(201).json(result);
});
app.get("/api/admin", auth, async (req, res) =>
  res.json({
    applications: (await db.all("startup_applications")).map(
      ({ trackingHash, ...a }) =>
        req.get("X-Expo-Media") === "links"
          ? uploadLinks(a, "/api/admin/files/applications/" + a.id)
          : a,
    ),
    startups: (await db.all("startups")).map((s) =>
      req.get("X-Expo-Media") === "links"
        ? uploadLinks(s, "/api/startups/" + s.id + "/files")
        : s,
    ),
    feedback: await db.all("feedback"),
    ideas: await db.all("idea_submissions"),
    rapid: await db.all("rapid_fire_submissions"),
    interests: await db.all("join_interests"),
    problems: await db.all("problem_statements"),
  }),
);
const submissionKinds = {
  applications: ["startup_applications", "Startup application"],
  ideas: ["idea_submissions", "Original idea"],
  rapid: ["rapid_fire_submissions", "Rapid-fire submission"],
  feedback: ["feedback", "Visitor feedback"],
  interests: ["join_interests", "Team introduction"],
};
app.get(
  "/api/admin/files/:kind/:id/:field{/:index}",
  auth,
  async (req, res) => {
    const config = Object.hasOwn(submissionKinds, req.params.kind)
      ? submissionKinds[req.params.kind]
      : null;
    if (!config) return res.status(404).json({ error: "File not found." });
    sendUpload(
      res,
      await db.get(config[0], req.params.id),
      req.params.field,
      req.params.index,
    );
  },
);
app.get("/api/admin/submissions/:kind/:id/export", auth, async (req, res) => {
  const config = Object.hasOwn(submissionKinds, req.params.kind)
    ? submissionKinds[req.params.kind]
    : null;
  if (!config)
    return res.status(404).json({ error: "Submission type not found." });
  if (!["md", "pdf"].includes(req.query.format))
    return res.status(400).json({ error: "Choose Markdown or PDF." });
  const record = await db.get(config[0], req.params.id);
  if (!record) return res.status(404).json({ error: "Submission not found." });
  if (req.params.kind === "applications")
    record.stall =
      (await db.get("stall_assignments", record.id))?.stall || "Not assigned";
  const filename =
    req.params.kind +
    "-" +
    record.id.replace(/[^a-zA-Z0-9_-]/g, "_") +
    "." +
    req.query.format;
  const body =
    req.query.format === "pdf"
      ? await submissionPdf(record, config[1])
      : submissionMarkdown(record, config[1]);
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="' + filename + '"',
  );
  res
    .type(
      req.query.format === "pdf"
        ? "application/pdf"
        : "text/markdown; charset=utf-8",
    )
    .send(body);
});
app.patch("/api/admin/applications/:id", auth, async (req, res) => {
  const { status, notes, stall } = req.body;
  if (
    !["Draft", "Submitted", "Under Review", "Approved", "Rejected"].includes(
      status,
    )
  )
    return res.status(400).json({ error: "Invalid status." });
  if (
    stall &&
    (typeof stall !== "string" || !/^[a-zA-Z0-9 -]{1,16}$/.test(stall))
  )
    return res.status(400).json({ error: "Choose a valid stall number." });
  await db.transaction(async (tx) => {
    const a = await tx.get("startup_applications", req.params.id, {
      lock: true,
    });
    if (!a) {
      const e = new Error("Application not found.");
      e.status = 404;
      throw e;
    }
    await tx.put("startup_applications", a.id, {
      ...a,
      status,
      notes: String(notes || "").slice(0, 6000),
    });
    if (stall)
      await tx.put("stall_assignments", a.id, {
        applicationId: a.id,
        stall: stall.trim(),
      });
    else await tx.remove("stall_assignments", a.id);
    if (status === "Approved")
      await tx.put("startups", a.id, publicStartup(a, stall));
    else {
      const profile = await tx.get("startups", a.id);
      if (profile) await tx.put("startups", a.id, { ...profile, status });
    }
  }, req.user.id);
  res.json({ ok: true });
});
app.post("/api/admin/problems", auth, async (req, res) => {
  if (!requiredText(req.body, ["title", "description"]))
    return res.status(400).json({ error: "Add a title and description." });
  const id = randomUUID();
  await db.put("problem_statements", id, {
    title: req.body.title,
    description: req.body.description,
    active: true,
  });
  res.status(201).json({ id });
});
app.patch("/api/admin/problems/:id", auth, async (req, res) => {
  const p = await db.get("problem_statements", req.params.id);
  if (!p) return res.status(404).json({ error: "Not found." });
  await db.put("problem_statements", p.id, { ...p, active: !!req.body.active });
  res.json({ ok: true });
});
app.delete("/api/admin/demo", auth, async (req, res) => {
  for (const s of (await db.all("startups")).filter((s) => s.isDemo))
    await db.remove("startups", s.id);
  res.json({ ok: true });
});
app.get("/api/admin/export", auth, async (req, res) => {
  const fields = [
    "id",
    "name",
    "status",
    "category",
    "stage",
    "founderName",
    "email",
    "phone",
    "organization",
    "department",
    "year",
    "address",
    "teamSize",
    "collegeEmail",
    "displayOther",
    "stallRequirements",
    "wallSpace",
    "relevantLinks",
    "preferences",
    "declaration",
    "display",
    "electricity",
    "table",
    "monitor",
    "internet",
    "notes",
  ];
  const escape = (v) =>
    '"' +
    String(v ?? "")
      .replace(/^[=+@-]/, "'$&")
      .replaceAll('"', '""') +
    '"';
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="mgit-startup-applications.csv"',
  );
  res
    .type("text/csv")
    .send(
      "\uFEFF" +
        [
          fields,
          ...(await db.all("startup_applications")).map((a) =>
            fields.map((k) => a[k]),
          ),
        ]
          .map((r) => r.map(escape).join(","))
          .join("\r\n"),
    );
});
app.use("/api", async (req, res) =>
  res.status(404).json({ error: "Endpoint not found." }),
);
app.use((error, req, res, next) => {
  if (error.code === "23505")
    return res.status(409).json({
      error: "That stall is already assigned. Choose another stall number.",
    });
  if (
    error instanceof StorageUnavailable ||
    ["ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND", "57P01", "08006"].includes(
      error.code,
    )
  )
    return res.status(503).json({ error: new StorageUnavailable().message });
  console.error("Request failed:", error.code || error.name);
  res.status(error.status || 500).json({
    error:
      error.type === "entity.too.large"
        ? "This submission is too large. Keep each file under 2 MB and the complete submission under 4 MB."
        : error.status && error.status < 500
          ? error.message
          : "We could not confirm your submission. Keep this page open and retry.",
  });
});
export default app;
