import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req) {
  const isAuth = req.cookies.get("galleryAccess")?.value === "true";
  const url = req.nextUrl.clone();

  // Korunan rota
  if (req.nextUrl.pathname.startsWith("/gallery") && !isAuth) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/gallery"],
};
