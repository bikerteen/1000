// Shared by proxy.ts and server actions, so Web Crypto only (no node:crypto).

export const AUTH_COOKIE = "k1000";
export const AUTH_MAX_AGE = 60 * 60 * 24 * 365;

const enc = new TextEncoder();

/** Cookie value for a password. Changing SITE_PASSWORD signs everyone out. */
export async function passToken(password: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode("1000-rejections:v1"));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function isAuthed(cookie: string | undefined) {
  const password = process.env.SITE_PASSWORD;
  if (!password || !cookie) return false;
  return cookie === (await passToken(password));
}
