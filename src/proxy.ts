import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, isAuthed } from "@/lib/auth";

/** Everything sits behind the password except the unlock screen itself. */
export async function proxy(req: NextRequest) {
  const authed = await isAuthed(req.cookies.get(AUTH_COOKIE)?.value);
  const atUnlock = req.nextUrl.pathname === "/unlock";

  if (authed) {
    return atUnlock ? NextResponse.redirect(new URL("/", req.url)) : NextResponse.next();
  }
  if (atUnlock) return NextResponse.next();
  return NextResponse.redirect(new URL("/unlock", req.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
