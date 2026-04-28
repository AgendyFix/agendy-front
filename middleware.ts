// ============================================
// MIDDLEWARE - Route Protection
// ============================================

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get token from cookies or we could check localStorage in the client
  // Since middleware runs on the server, we'll check for the token in cookies
  // For now, we'll implement a basic check
  
  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/blog", "/"];
  
  // Check if the current path is public
  const isPublicRoute =
    pathname === "/" ||
    publicRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );
  
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // For protected routes, we'll let the client-side handle the redirect
  // since we're using localStorage for tokens
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};