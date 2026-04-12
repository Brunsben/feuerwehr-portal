import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "fw_jwt";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("FATAL: JWT_SECRET ist nicht gesetzt");
  return new TextEncoder().encode(secret);
}

async function getUser(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return {
      sub: payload.sub as string,
      app_role: payload.app_role as string,
    };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // === FK-App Routes (/fk/*) ===
  if (pathname.startsWith("/fk")) {
    const fkPublicRoutes = [
      "/fk/login",
      "/fk/api/health",
      "/fk/api/backup",
      "/fk/datenschutz-einwilligung",
      "/fk/passwort-aendern",
    ];
    const isFkPublic =
      pathname === "/fk" || fkPublicRoutes.some((r) => pathname.startsWith(r));

    const user = await getUser(req);
    const isLoggedIn = !!user;

    if (isFkPublic) {
      if (isLoggedIn && pathname === "/fk/login") {
        return NextResponse.redirect(new URL("/fk/dashboard", req.url));
      }
      return NextResponse.next();
    }

    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/fk/login", req.url));
    }

    // FK admin-Prüfung erfolgt intern über fkAuth()
    return NextResponse.next();
  }

  // === Portal Routes ===
  const publicRoutes = ["/login", "/setup", "/api/auth"];
  const isPublic = publicRoutes.some((r) => pathname.startsWith(r));

  const user = await getUser(req);
  const isLoggedIn = !!user;

  if (isPublic) {
    // Wenn eingeloggt und auf /login → Dashboard redirect
    if (isLoggedIn && pathname === "/login") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Geschützte Routes — Login erforderlich
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Admin-only Routes
  const isAdmin = user.app_role === "Admin";
  if (
    (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) &&
    !isAdmin
  ) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Nicht berechtigt" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/|theme-init\\.js|error-backend\\.html).*)",
  ],
};
