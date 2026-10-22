// Shared by proxy.ts, the page and server actions, so Web Crypto only (no node:crypto).
//
// Nothing is remembered between visits:
// - Unlocking sets a short-lived "door" cookie that admits exactly one page load
//   (proxy.ts deletes it as the page is served), so a reload or new visit asks again.
// - That page load gets a "session" token held only in the tab's memory, which
//   server actions require. It dies with the tab.

export const DOOR_COOKIE = "k1000";
/** proxy.ts forwards the spent door token to the page on this request header. */
export const DOOR_HEADER = "x-k1000-door";
export const DOOR_TTL = 120; // seconds — just long enough to get from the door to the page
const SESSION_TTL = 12 * 60 * 60;

type Kind = "door" | "session";
const enc = new TextEncoder();

async function hmac(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** `<expiry>.<signature>`, keyed on SITE_PASSWORD — changing it invalidates everything. */
async function sign(kind: Kind, ttl: number) {
  const password = process.env.SITE_PASSWORD;
  if (!password) return null;
  const exp = Math.floor(Date.now() / 1000) + ttl;
  return `${exp}.${await hmac(password, `${kind}:v2:${exp}`)}`;
}

async function verify(kind: Kind, token: string | undefined) {
  const password = process.env.SITE_PASSWORD;
  if (!password || !token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  return sig === (await hmac(password, `${kind}:v2:${exp}`));
}

export const doorToken = () => sign("door", DOOR_TTL);
export const isDoorOpen = (token: string | undefined) => verify("door", token);
export const sessionToken = () => sign("session", SESSION_TTL);
export const isSessionValid = (token: string | undefined) => verify("session", token);
