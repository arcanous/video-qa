import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if user is trying to access protected routes
  if (pathname.startsWith('/upload') || pathname.startsWith('/ask')) {
    const authCookie = request.cookies.get('demo-auth');
    
    if (!authCookie) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/upload', '/ask']
};
