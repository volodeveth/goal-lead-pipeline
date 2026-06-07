import { NextResponse, type NextRequest } from "next/server";
import { verifyBasicAuth } from "@/lib/basicAuth";

export const config = {
  matcher: ["/admin/:path*", "/api/leads"],
  runtime: "nodejs",
};

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname === "/api/leads" && req.method !== "GET") {
    return NextResponse.next();
  }

  const user = process.env.ADMIN_USER ?? "admin";
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return new NextResponse("Admin disabled (ADMIN_PASSWORD not set)", { status: 503 });
  }

  const ok = verifyBasicAuth(req.headers.get("authorization"), { user, password });
  if (!ok) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Ciel Admin", charset="UTF-8"' },
    });
  }
  return NextResponse.next();
}
