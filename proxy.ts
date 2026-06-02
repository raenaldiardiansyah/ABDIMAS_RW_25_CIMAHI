import { NextRequest, NextResponse } from "next/server";
// import { getSessionCookie } from "better-auth/cookies";

// BYPASS: Allow all routes without authentication
export function proxy(req: NextRequest) {
  return NextResponse.next();

  // --- ORIGINAL AUTH LOGIC (uncomment to restore) ---
  // const pathname = req.nextUrl.pathname;
  // const isProtected = pathname.startsWith("/warga") || pathname.startsWith("/admin") || pathname.startsWith("/status");
  // if (!isProtected) return NextResponse.next();
  //
  // const token = getSessionCookie(req.headers);
  // if (token) return NextResponse.next();
  //
  // const url = req.nextUrl.clone();
  // url.pathname = "/sign-in";
  // url.searchParams.set("next", pathname);
  // return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/warga/:path*", "/admin/:path*", "/status/:path*"],
};

