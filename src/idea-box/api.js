// Retry keys live only in this page's memory. Submitted records live in Supabase.
export function createApi({ fetcher = (...args) => fetch(...args) } = {}) {
  const retries = new Map();
  return async function api(url, options = {}) {
    const method = (options.method || "GET").toUpperCase();
    const body = options.body ? JSON.stringify(options.body) : undefined;
    if (body && new TextEncoder().encode(body).length > 4 * 1024 * 1024)
      throw new Error(
        "This submission is too large. Reduce the uploaded files and try again.",
      );
    const submission =
      method === "POST" &&
      ["/applications", "/ideas", "/feedback", "/join"].includes(url);
    let fingerprint, key;
    if (submission) {
      const digest = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(url + "|" + body),
      );
      fingerprint = Array.from(new Uint8Array(digest), (b) =>
        b.toString(16).padStart(2, "0"),
      ).join("");
      key = retries.get(fingerprint) || crypto.randomUUID();
      retries.set(fingerprint, key);
    }
    let response;
    try {
      response = await fetcher("/api" + url, {
        ...options,
        credentials: "same-origin",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "X-Expo-Media": "links",
          ...options.headers,
          ...(key ? { "Idempotency-Key": key } : {}),
        },
        body,
      });
    } catch {
      throw new Error(
        "Unable to reach the Expo service. Keep this page open, check your connection and try again.",
      );
    }
    if (!response.headers.get("content-type")?.includes("application/json"))
      throw new Error(
        "The Expo service is unavailable. Please try again later.",
      );
    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error(
        "The Expo service returned an unreadable response. Please try again later.",
      );
    }
    if (!response.ok) {
      if (fingerprint && response.status < 500 && response.status !== 429)
        retries.delete(fingerprint);
      throw new Error(data?.error || "Something went wrong. Please try again.");
    }
    return data;
  };
}
export const api = createApi();
