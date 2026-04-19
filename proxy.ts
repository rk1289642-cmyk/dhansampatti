import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes — always allow
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('ds_session')?.value;
  const session = token ? await verifyToken(token) : null;

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Role-based route guard
  if (pathname.startsWith('/dashboard/admin') && session.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard/cp', request.url));
  }
  if (pathname.startsWith('/dashboard/cp') && session.role !== 'channel_partner') {
    return NextResponse.redirect(new URL('/dashboard/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
