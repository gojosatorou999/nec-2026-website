import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { Pool } from "pg";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { validateApplication } from "../shared/schema.js";

const dir = mkdtempSync(path.join(tmpdir(), "mgit-expo-test-"));
const base = "http://localhost:5199/api";
let server, cookie, application, testPool, adminPool, testDatabaseUrl;
const testDatabaseName = "expo_test_" + randomUUID().replaceAll("-", "");
const pixel =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6VAAAAABJRU5ErkJggg==";
const valid = {
  founderName: "Test Founder",
  email: "founder@example.com",
  phone: "+91 9876543210",
  organization: "Test College",
  address: "Hyderabad",
  declaration: true,
  department: "CSE",
  year: "3rd year",
  teamSize: "1",
  collegeEmail: "founder@college.edu",
  name: "Test venture",
  tagline: "A real integration test",
  category: "SaaS",
  stage: "MVP",
  logo: { name: "logo.png", data: pixel },
  problem: "A problem",
  targetUsers: "Students",
  alternatives: "Spreadsheets",
  solution: "A solution",
  value: "Unique value",
  productDescription: "A product",
  productStatus: "Live product",
  businessModel: "Subscription",
  revenueModel: "Monthly",
  customers: "10",
  market: "Student teams",
  display: ["Demo"],
  members: [],
  hiring: true,
  requiredRoles: ["Developers"],
  requiredSkills: "JavaScript",
  openings: 1,
  opportunity: "Build with us",
};
async function request(
  route,
  { body, method = "GET", auth = false, headers = {} } = {},
) {
  const r = await fetch(base + route, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(auth ? { Cookie: cookie } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: r.status, data: await r.json(), headers: r.headers };
}
before(async () => {
  if (!process.env.TEST_DATABASE_URL)
    throw new Error(
      "Set TEST_DATABASE_URL to a dedicated local PostgreSQL test instance. Tests never use SUPABASE_DB_URL.",
    );
  const baseUrl = new URL(process.env.TEST_DATABASE_URL);
  if (!["localhost", "127.0.0.1"].includes(baseUrl.hostname))
    throw new Error("Integration tests require local PostgreSQL.");
  adminPool = new Pool({ connectionString: baseUrl.toString() });
  await adminPool.query(`CREATE DATABASE ${testDatabaseName}`);
  baseUrl.pathname = "/" + testDatabaseName;
  testDatabaseUrl = baseUrl.toString();
  testPool = new Pool({ connectionString: testDatabaseUrl });
  await testPool.query(readFileSync("sql/001_supabase_schema.sql", "utf8"));
  server = spawn(process.execPath, ["tests/fixtures/serverless.mjs"], {
    env: {
      ...process.env,
      PORT: "5199",
      DATA_DIR: dir,
      SUPABASE_DB_URL: testDatabaseUrl,
      DATABASE_LOCAL_TEST: "true",
      ADMIN_EMAIL: "test@mgit.ac.in",
      ADMIN_PASSWORD: "test-only-password",
      SEED_DEMO: "false",
    },
    stdio: "pipe",
  });
  for (let i = 0; i < 60; i++) {
    try {
      await fetch(base + "/startups");
      return;
    } catch {
      await delay(200);
    }
  }
  throw new Error("Test server failed to start");
});
after(async () => {
  server?.kill();
  await delay(400);
  await testPool?.end();
  if (adminPool) {
    await adminPool.query(
      `DROP DATABASE IF EXISTS ${testDatabaseName} WITH (FORCE)`,
    );
    await adminPool.end();
  }
  if (!path.resolve(dir).startsWith(path.resolve(tmpdir()) + path.sep))
    throw new Error("Unsafe test cleanup path");
  rmSync(dir, { recursive: true, force: true });
});
test("registration validator rejects missing fields, invalid URLs and incomplete teams", () => {
  assert.equal(Object.keys(validateApplication(valid)).length, 0);
  assert.ok(validateApplication({}).founderName);
  assert.ok(
    validateApplication({ ...valid, relevantLinks: "javascript:alert(1)" })
      .relevantLinks,
  );
  assert.equal(
    validateApplication({ ...valid, members: [] }).members,
    undefined,
  );
  assert.ok(
    validateApplication({ ...valid, collegeEmail: "invalid" }).collegeEmail,
  );
  assert.ok(validateApplication({ ...valid, teamSize: "0" }).teamSize);
  assert.ok(validateApplication({ ...valid, logo: null }).logo);
  assert.ok(
    validateApplication({ ...valid, relevantLinks: "javascript:alert(1)" })
      .relevantLinks,
  );
  assert.ok(validateApplication({ ...valid, requiredRoles: [] }).requiredRoles);
  assert.ok(validateApplication({ ...valid, name: 42 }).name);
  assert.ok(validateApplication({ ...valid, members: [null] }).members);
  assert.ok(validateApplication({ ...valid, images: [1, 2, 3, 4] }).images);
});
test("private organizer endpoints require authentication", async () => {
  assert.equal((await request("/admin")).status, 401);
  assert.equal((await request("/admin/export")).status, 401);
  assert.equal(
    (
      await request("/login", {
        method: "POST",
        body: { email: "test@mgit.ac.in", password: "wrong" },
      })
    ).status,
    401,
  );
});
test("incomplete applications and disguised files are rejected", async () => {
  assert.equal(
    (
      await request("/applications", {
        method: "POST",
        body: { name: "Partial" },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request("/applications", {
        method: "POST",
        body: {
          ...valid,
          logo: { name: "bad.png", data: "data:image/png;base64,SGVsbG8=" },
        },
      })
    ).status,
    400,
  );
});
test("application lifecycle, stall collision, private feedback, ideas and logout", async () => {
  const created = await request("/applications", {
    method: "POST",
    body: valid,
  });
  assert.equal(created.status, 201);
  application = created.data;
  assert.match(application.id, /^MGIT-/);
  assert.ok(application.token);
  assert.equal((await request("/startups")).data.length, 0);
  assert.equal(
    (await request("/applications/" + application.id + "/status")).status,
    404,
  );
  assert.equal(
    (
      await request("/applications/" + application.id + "/status", {
        headers: { "x-tracking-token": application.token },
      })
    ).data.status,
    "Submitted",
  );
  const login = await request("/login", {
    method: "POST",
    body: { email: "test@mgit.ac.in", password: "test-only-password" },
  });
  assert.equal(login.status, 200);
  cookie = login.headers.get("set-cookie").split(";")[0];
  assert.match(login.headers.get("set-cookie"), /HttpOnly/);
  assert.equal(
    (await request("/admin", { auth: true })).data.applications[0].trackingHash,
    undefined,
  );
  assert.equal(
    (
      await request("/admin/applications/" + application.id, {
        method: "PATCH",
        auth: true,
        body: {
          status: "Approved",
          stall: "A-01",
          notes: "Private review note",
        },
      })
    ).status,
    200,
  );
  const profile = (await request("/startups")).data[0];
  assert.equal(profile.name, valid.name);
  assert.equal(profile.stall, "A-01");
  assert.equal(profile.founderName, valid.founderName);
  assert.equal(profile.organization, valid.organization);
  assert.equal(profile.members[0].name, valid.founderName);
  assert.deepEqual(profile.logo, valid.logo);
  assert.deepEqual(profile.display, valid.display);
  for (const key of ["email", "phone", "notes", "trackingHash"])
    assert.equal(profile[key], undefined);
  const feedback = await request("/feedback", {
    method: "POST",
    body: {
      startupId: application.id,
      overall: "Promising",
      problem: "Student operations",
      interesting: "The design",
      suggestions: "More integrations",
      questions: "When is launch?",
      visitorType: "Faculty",
    },
  });
  assert.equal(feedback.status, 201);
  const join = await request("/join", {
    method: "POST",
    body: {
      startupId: application.id,
      name: "Interested student",
      email: "student@example.com",
      skills: "React",
      message: "Happy to help",
    },
  });
  assert.equal(join.status, 201);
  const tracked = (
    await request("/applications/" + application.id + "/status", {
      headers: { "x-tracking-token": application.token },
    })
  ).data;
  assert.equal(tracked.feedback.length, 1);
  assert.equal(tracked.interests.length, 1);
  const other = (
    await request("/applications", {
      method: "POST",
      body: { ...valid, name: "Second venture" },
    })
  ).data;
  assert.equal(
    (
      await request("/admin/applications/" + other.id, {
        method: "PATCH",
        auth: true,
        body: { status: "Approved", stall: "A-01" },
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await request("/ideas", {
        method: "POST",
        body: {
          mode: "idea",
          name: "Student",
          email: "student@example.com",
          department: "CSE",
          year: "2",
          problem: "Waste",
          solution: "Reuse",
          targetUsers: "Campus",
          why: "Less waste",
          skills: "Design",
        },
      })
    ).status,
    201,
  );
  const problem = (
    await request("/admin/problems", {
      method: "POST",
      auth: true,
      body: {
        title: "Improve campus recycling",
        description: "Make recycling easier to access.",
      },
    })
  ).data;
  assert.equal((await request("/problems")).data.length, 1);
  assert.equal(
    (
      await request("/ideas", {
        method: "POST",
        body: {
          mode: "rapid",
          name: "Student",
          email: "student@example.com",
          department: "CSE",
          year: "2",
          problemId: problem.id,
          solution: "Smart bins",
          explanation: "Better placement",
        },
      })
    ).status,
    201,
  );
  await request("/admin/problems/" + problem.id, {
    method: "PATCH",
    auth: true,
    body: { active: false },
  });
  assert.equal((await request("/problems")).data.length, 0);
  const admin = (await request("/admin", { auth: true })).data;
  assert.equal(admin.ideas.length, 1);
  assert.equal(admin.rapid.length, 1);
  assert.equal(admin.applications.length, 2);
  await request("/admin/applications/" + application.id, {
    method: "PATCH",
    auth: true,
    body: { status: "Rejected", notes: "Needs revision", stall: "" },
  });
  assert.equal((await request("/startups")).data.length, 0);
  assert.equal(
    (
      await request("/feedback", {
        method: "POST",
        body: { startupId: application.id },
      })
    ).status,
    404,
  );
  const csv = await fetch(base + "/admin/export", {
    headers: { Cookie: cookie },
  });
  assert.equal(csv.status, 200);
  assert.ok((await csv.text()).includes("Test venture"));
  await request("/logout", { method: "POST", auth: true });
  assert.equal((await request("/admin", { auth: true })).status, 401);
});
test("applications and private feedback survive a server restart", async () => {
  server.kill();
  await delay(400);
  server = spawn(process.execPath, ["server/index.js", "--production"], {
    env: {
      ...process.env,
      PORT: "5199",
      DATA_DIR: dir,
      SUPABASE_DB_URL: testDatabaseUrl,
      DATABASE_LOCAL_TEST: "true",
    },
    stdio: "pipe",
  });
  let response;
  for (let i = 0; i < 60; i++) {
    try {
      response = await request("/applications/" + application.id + "/status", {
        headers: { "x-tracking-token": application.token },
      });
      break;
    } catch {
      await delay(200);
    }
  }
  assert.equal(response.status, 200);
  assert.equal(response.data.status, "Rejected");
  assert.equal(response.data.feedback.length, 1);
  assert.equal(response.data.interests.length, 1);
});

test("short applications accept documents without removed fields and keep uploads private", async () => {
  const short = Object.fromEntries(
    [
      "founderName",
      "email",
      "phone",
      "organization",
      "address",
      "name",
      "tagline",
      "category",
      "stage",
      "teamSize",
      "collegeEmail",
      "display",
      "logo",
      "declaration",
    ].map((key) => [key, valid[key]]),
  );
  short.documents = [
    {
      name: "pitch.pdf",
      data:
        "data:application/pdf;base64," +
        Buffer.from("%PDF-1.4\n%%EOF").toString("base64"),
    },
  ];
  short.relevantLinks = "https://example.com\nhttps://example.com/demo";
  assert.deepEqual(validateApplication(short), {});
  const created = await request("/applications", {
    method: "POST",
    body: short,
  });
  assert.equal(created.status, 201);
  const login = await request("/login", {
    method: "POST",
    body: { email: "test@mgit.ac.in", password: "test-only-password" },
  });
  cookie = login.headers.get("set-cookie").split(";")[0];
  const saved = (
    await request("/admin", { auth: true })
  ).data.applications.find((a) => a.id === created.data.id);
  assert.deepEqual(saved.documents, short.documents);
  assert.equal(saved.address, short.address);
  assert.equal(
    (
      await request("/admin/applications/" + created.data.id, {
        method: "PATCH",
        auth: true,
        body: { status: "Approved" },
      })
    ).status,
    200,
  );
  const profile = (await request("/startups")).data.find(
    (s) => s.id === created.data.id,
  );
  for (const key of [
    "address",
    "documents",
    "preferences",
    "declaration",
    "relevantLinks",
  ])
    assert.equal(profile[key], undefined);
  for (const documents of [
    Array(4).fill(short.documents[0]),
    [{ name: "bad.pdf", data: "data:application/pdf;base64,SGVsbG8=" }],
    [
      {
        name: "large.pdf",
        data:
          "data:application/pdf;base64," +
          Buffer.from("%PDF-" + "x".repeat(2 * 1024 * 1024)).toString("base64"),
      },
    ],
  ]) {
    assert.equal(
      (
        await request("/applications", {
          method: "POST",
          body: { ...short, documents },
        })
      ).status,
      400,
    );
  }
});

test("display choices, required logo and conditional team contacts are validated", async () => {
  for (const display of [[], ["Invalid"], "Demo", {}])
    assert.ok(validateApplication({ ...valid, display }).display);
  assert.ok(
    validateApplication({ ...valid, display: ["Other"], displayOther: " " })
      .displayOther,
  );
  assert.deepEqual(
    validateApplication({
      ...valid,
      display: ["Poster", "Other"],
      displayOther: "Model",
    }),
    {},
  );
  for (const teamSize of ["0", "-1", "1.5", "101", "two", "", true])
    assert.ok(validateApplication({ ...valid, teamSize }).teamSize);
  const member = {
    name: "Teammate",
    phone: "9876543210",
    email: "member@example.com",
    organization: "College",
    role: "Designer",
  };
  const team = {
    ...valid,
    teamSize: "2",
    members: [member],
    stallRequirements: ["Table", "Power socket", "Wall space for posters"],
  };
  assert.deepEqual(validateApplication(team), {});
  assert.ok(validateApplication({ ...team, members: [] }).members);
  assert.ok(
    validateApplication({ ...team, members: [{ ...member, email: "invalid" }] })
      .members,
  );
  assert.ok(
    validateApplication({ ...team, members: [{ ...member, phone: "abc" }] })
      .members,
  );
  assert.ok(
    validateApplication({ ...team, stallRequirements: ["Unknown"] })
      .stallRequirements,
  );
  for (const body of [
    { ...valid, logo: undefined },
    { ...team, members: [] },
    { ...valid, collegeEmail: "" },
    { ...valid, display: ["Other"] },
  ])
    assert.equal(
      (await request("/applications", { method: "POST", body })).status,
      400,
    );
  const created = await request("/applications", {
    method: "POST",
    body: team,
  });
  assert.equal(created.status, 201);
  const saved = (
    await request("/admin", { auth: true })
  ).data.applications.find((a) => a.id === created.data.id);
  assert.deepEqual(saved.members, [member]);
  assert.equal(saved.table, true);
  assert.equal(saved.electricity, true);
  assert.equal(saved.wallSpace, true);
  assert.equal(saved.collegeEmail, valid.collegeEmail);
  assert.equal(
    (
      await request("/admin/applications/" + created.data.id, {
        method: "PATCH",
        auth: true,
        body: { status: "Approved" },
      })
    ).status,
    200,
  );
  const profile = (await request("/startups")).data.find(
    (a) => a.id === created.data.id,
  );
  assert.equal(profile.collegeEmail, undefined);
  assert.equal(profile.teamSize, 2);
  assert.equal(profile.members.length, 2);
  assert.equal(profile.members[0].name, valid.founderName);
  assert.equal(profile.members[1].name, member.name);
  for (const publicMember of profile.members) {
    assert.equal(publicMember.email, undefined);
    assert.equal(publicMember.phone, undefined);
  }
});

test("admin downloads include complete details and require authentication", async () => {
  const login = await request("/login", {
    method: "POST",
    body: { email: "test@mgit.ac.in", password: "test-only-password" },
  });
  cookie = login.headers.get("set-cookie").split(";")[0];
  const records = (await request("/admin", { auth: true })).data;
  for (const kind of [
    "applications",
    "ideas",
    "rapid",
    "feedback",
    "interests",
  ]) {
    const record =
      kind === "applications"
        ? records.applications.find((a) => a.teamSize === "2")
        : records[kind][0];
    assert.ok(record, kind + " fixture exists");
    const route =
      base + "/admin/submissions/" + kind + "/" + record.id + "/export";
    for (const format of ["md", "pdf"]) {
      assert.equal((await fetch(route + "?format=" + format)).status, 401);
      const response = await fetch(route + "?format=" + format, {
        headers: { Cookie: cookie },
      });
      assert.equal(response.status, 200);
      assert.match(response.headers.get("content-disposition"), /attachment/);
      if (format === "md") {
        assert.match(response.headers.get("content-type"), /text\/markdown/);
        const text = await response.text();
        assert.ok(text.includes("Submission overview"));
        assert.ok(text.includes("Reference"));
        assert.ok(!text.includes("trackingHash"));
        if (kind === "applications") {
          assert.ok(text.includes("Team member 2"));
          assert.ok(text.includes("member@example"));
        }
      } else {
        assert.match(response.headers.get("content-type"), /application\/pdf/);
        const bytes = Buffer.from(await response.arrayBuffer());
        assert.equal(bytes.subarray(0, 5).toString(), "%PDF-");
        assert.ok(bytes.length > 1000);
      }
    }
  }
  assert.equal(
    (
      await fetch(
        base + "/admin/submissions/applications/missing/export?format=md",
        { headers: { Cookie: cookie } },
      )
    ).status,
    404,
  );
  assert.equal(
    (
      await fetch(
        base +
          "/admin/submissions/applications/" +
          application.id +
          "/export?format=html",
        { headers: { Cookie: cookie } },
      )
    ).status,
    400,
  );
});

test("submission retries return one durable receipt even when requests race", async () => {
  const headers = { "Idempotency-Key": "retry_application_123456789" };
  const body = { ...valid, name: "Retry venture" };
  const results = await Promise.all([
    request("/applications", { method: "POST", body, headers }),
    request("/applications", { method: "POST", body, headers }),
  ]);
  assert.equal(results[0].status, 201);
  assert.deepEqual(results[0].data, results[1].data);
  assert.equal(
    (
      await testPool.query(
        "SELECT count(*)::int AS n FROM expo.startup_applications WHERE data->>'name'='Retry venture'",
      )
    ).rows[0].n,
    1,
  );
  assert.equal(
    (
      await request("/applications", {
        method: "POST",
        body: { ...body, name: "Changed" },
        headers,
      })
    ).status,
    409,
  );
  const receipt = (
    await request("/applications", { method: "POST", body, headers })
  ).data;
  assert.equal(receipt.token, results[0].data.token);
});
test("a failed child write rolls back the application and its receipt", async () => {
  await testPool.query(
    `CREATE FUNCTION expo.fail_test_product() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.data->>'description'='ROLLBACK_TEST' THEN RAISE EXCEPTION 'test failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER fail_test BEFORE INSERT ON expo.startup_products FOR EACH ROW EXECUTE FUNCTION expo.fail_test_product();`,
  );
  try {
    const result = await request("/applications", {
      method: "POST",
      body: {
        ...valid,
        name: "Must roll back",
        productDescription: "ROLLBACK_TEST",
      },
      headers: { "Idempotency-Key": "rollback_application_123456" },
    });
    assert.equal(result.status, 500);
    assert.equal(
      (
        await testPool.query(
          "SELECT count(*)::int AS n FROM expo.startup_applications WHERE data->>'name'='Must roll back'",
        )
      ).rows[0].n,
      0,
    );
    assert.equal(
      (
        await testPool.query(
          "SELECT count(*)::int AS n FROM expo.startup_products WHERE data->>'description'='ROLLBACK_TEST'",
        )
      ).rows[0].n,
      0,
    );
  } finally {
    await testPool.query(
      "DROP TRIGGER fail_test ON expo.startup_products; DROP FUNCTION expo.fail_test_product();",
    );
  }
});
test("admin returns all submissions beyond the Supabase Data API default page size", async () => {
  await testPool.query(
    "INSERT INTO expo.idea_submissions(id,data) SELECT 'bulk-'||n,jsonb_build_object('name','Bulk idea '||n,'email','test@example.com','solution','Complete answer') FROM generate_series(1,1005) n",
  );
  const admin = (await request("/admin", { auth: true })).data;
  assert.equal(
    admin.ideas.filter((i) => i.id.startsWith("bulk-")).length,
    1005,
  );
});
test("schema reruns preserve records and anonymous roles cannot read submissions", async () => {
  const before = (
    await testPool.query(
      "SELECT count(*)::int AS n FROM expo.startup_applications",
    )
  ).rows[0].n;
  await testPool.query(
    "DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF; END $$;",
  );
  await testPool.query(readFileSync("sql/001_supabase_schema.sql", "utf8"));
  assert.equal(
    (
      await testPool.query(
        "SELECT count(*)::int AS n FROM expo.startup_applications",
      )
    ).rows[0].n,
    before,
  );
  const connection = await testPool.connect();
  try {
    await connection.query("SET ROLE anon");
    await assert.rejects(
      connection.query("SELECT * FROM expo.startup_applications"),
      /permission denied/,
    );
  } finally {
    await connection.query("RESET ROLE");
    connection.release();
  }
});
test("SQLite import verifies every record, preserves uploads and can rerun safely", async () => {
  const file = path.join(dir, "migration.sqlite");
  const source = new DatabaseSync(file);
  for (const table of [
    "users",
    "startup_applications",
    "startup_members",
    "feedback",
    "idea_submissions",
    "rapid_fire_submissions",
    "startup_products",
    "startup_requirements",
    "join_interests",
    "problem_statements",
    "sessions",
    "stall_assignments",
    "startups",
  ])
    source.exec(
      "CREATE TABLE " +
        table +
        " (id TEXT PRIMARY KEY,data TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP)",
    );
  const legacy = {
    ...valid,
    name: "Legacy import",
    status: "Submitted",
    trackingHash: "preserved-hash",
    logo: valid.logo,
  };
  source
    .prepare("INSERT INTO startup_applications(id,data) VALUES(?,?)")
    .run("MGIT-LEGACY", JSON.stringify(legacy));
  source.prepare("INSERT INTO feedback(id,data) VALUES(?,?)").run(
    "legacy-feedback",
    JSON.stringify({
      startupId: "historical-profile",
      overall: "Do not omit historical records",
    }),
  );
  source.close();
  const exec = promisify(execFile),
    options = {
      env: {
        ...process.env,
        SUPABASE_DB_URL: testDatabaseUrl,
        DATABASE_LOCAL_TEST: "true",
      },
    };
  await exec(process.execPath, ["scripts/migrate-sqlite.mjs", file], options);
  assert.deepEqual(
    (
      await testPool.query(
        "SELECT data FROM expo.startup_applications WHERE id='MGIT-LEGACY'",
      )
    ).rows[0].data,
    legacy,
  );
  await exec(process.execPath, ["scripts/migrate-sqlite.mjs", file], options);
  assert.equal(
    (
      await testPool.query(
        "SELECT count(*)::int AS n FROM expo.feedback WHERE id='legacy-feedback'",
      )
    ).rows[0].n,
    1,
  );
  await testPool.query(
    "UPDATE expo.startup_applications SET data=jsonb_set(data,'{name}','\"Changed in Supabase\"') WHERE id='MGIT-LEGACY'",
  );
  await assert.rejects(
    exec(process.execPath, ["scripts/migrate-sqlite.mjs", file], options),
    /Conflict/,
  );
  assert.equal(
    (
      await testPool.query(
        "SELECT data->>'name' AS name FROM expo.startup_applications WHERE id='MGIT-LEGACY'",
      )
    ).rows[0].name,
    "Changed in Supabase",
  );
});

test("media links keep listings small and enforce public approval and admin access", async () => {
  const login = await request("/login", {
    method: "POST",
    body: { email: "test@mgit.ac.in", password: "test-only-password" },
  });
  cookie = login.headers.get("set-cookie").split(";")[0];
  const records = (
    await request("/admin", {
      auth: true,
      headers: { "X-Expo-Media": "links" },
    })
  ).data;
  const record = records.applications.find((a) => a.logo?.data);
  assert.ok(record.logo.data.startsWith("/api/admin/files/"));
  const logoUrl = "http://localhost:5199" + record.logo.data;
  assert.equal((await fetch(logoUrl)).status, 401);
  const logo = await fetch(logoUrl, { headers: { Cookie: cookie } });
  assert.equal(logo.status, 200);
  assert.ok(logo.headers.get("content-type").includes("image/png"));
  const publicRecords = (
    await request("/startups", { headers: { "X-Expo-Media": "links" } })
  ).data;
  const profile = publicRecords.find((a) => a.logo?.data);
  assert.ok(profile.logo.data.startsWith("/api/startups/"));
  assert.equal(
    (await fetch("http://localhost:5199" + profile.logo.data)).status,
    200,
  );
  assert.equal(
    (
      await fetch(
        "http://localhost:5199/api/startups/" + application.id + "/files/logo",
      )
    ).status,
    404,
  );
});
