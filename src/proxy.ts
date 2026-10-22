import { NextResponse, type NextRequest } from "next/server";
import { DOOR_COOKIE, DOOR_HEADER, isDoorOpen } from "@/lib/auth";

const noStore = (res: NextResponse) => {
  res.headers.set("Cache-Control", "no-store");
  return res;
};

/** Everything sits behind the password, every visit. See src/lib/auth.ts. */
export async function proxy(req: NextRequest) {
  if (req.nextUrl.pathname === "/unlock") return noStore(NextResponse.next());

  // Server actions carry the tab's session token and verify it themselves.
  if (req.method === "POST" && req.headers.has("next-action")) return NextResponse.next();

  const door = req.cookies.get(DOOR_COOKIE)?.value;
  if (door && (await isDoorOpen(door))) {
    // One look per unlock: burn the door cookie as the page is served. Deleting it
    // also strips it from the request the page sees, so hand the token over on a
    // header (the page re-verifies it, so a forged header gets nowhere).
    const headers = new Headers(req.headers);
    headers.set(DOOR_HEADER, door);
    const res = NextResponse.next({ request: { headers } });
    res.cookies.delete(DOOR_COOKIE);
    return noStore(res);
  }
  return NextResponse.redirect(new URL("/unlock", req.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
