import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Check if accessing protected routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    try {
      // Check for session cookie
      const sessionCookie = request.cookies.get('better-auth.session_token');
      
      if (!sessionCookie) {
        return NextResponse.redirect(new URL('/sign-in', request.url));
      }
      
      // For now, let the page component handle full session verification
      // This middleware just checks for presence of session cookie
    } catch (error) {
      console.error("Session check failed:", error);
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/protected/:path*',
  ],
};