import { createHash, randomUUID } from "node:crypto";
export const canonical = (value) =>
  JSON.stringify(value, (_key, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(
          Object.keys(v)
            .sort()
            .map((k) => [k, v[k]]),
        )
      : v,
  );
const digest = (value) => createHash("sha256").update(value).digest("hex");
export async function submitOnce(db, req, work) {
  const key = req.get("Idempotency-Key") || randomUUID();
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(key)) {
    const e = new Error("Invalid submission retry key.");
    e.status = 400;
    throw e;
  }
  const id = digest(req.path + "|" + key),
    fingerprint = req.submissionFingerprint || digest(canonical(req.body));
  return db.transaction(async (tx) => {
    await tx.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [
      id,
    ]);
    const receipt = await tx.get("submission_receipts", id);
    if (receipt) {
      if (receipt.fingerprint !== fingerprint) {
        const e = new Error(
          "This retry belongs to an earlier version of the form. Please submit the updated form again.",
        );
        e.status = 409;
        throw e;
      }
      return receipt.response;
    }
    const response = await work(tx);
    await tx.put("submission_receipts", id, {
      route: req.path,
      fingerprint,
      response,
    });
    return response;
  }, "public_submission");
}

export function replaySavedSubmission(db) {
  return async (req, res, next) => {
    if (
      req.method !== "POST" ||
      ![
        "/api/applications",
        "/api/ideas",
        "/api/feedback",
        "/api/join",
      ].includes(req.path)
    )
      return next();
    req.submissionFingerprint = digest(canonical(req.body));
    const key = req.get("Idempotency-Key");
    if (!key) return next();
    if (!/^[A-Za-z0-9_-]{16,128}$/.test(key))
      return res.status(400).json({ error: "Invalid submission retry key." });
    const receipt = await db.get(
      "submission_receipts",
      digest(req.path + "|" + key),
    );
    if (!receipt) return next();
    if (receipt.fingerprint !== req.submissionFingerprint)
      return res
        .status(409)
        .json({ error: "This retry key belongs to a different submission." });
    return res.status(201).json(receipt.response);
  };
}
