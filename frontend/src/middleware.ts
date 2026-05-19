import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "rxpanel_token";
const PUBLIC_PATHS = ["/login"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Sin sesión y ruta protegida → login
  if (!token && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Con sesión intentando ir a /login → al panel
  if (token && isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/sitios";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico)$).*)"],
};
