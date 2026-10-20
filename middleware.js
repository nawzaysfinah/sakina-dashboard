import { NextResponse } from 'next/server';

export function middleware(request) {
  const auth = request.cookies.get('dash_auth');
  if (auth?.value !== process.env.DASHBOARD_TOKEN) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/dashboard/:path*'] };
