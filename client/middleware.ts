import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  authRateLimit,
  orderRateLimit,
  documentRateLimit,
  searchRateLimit,
  defaultRateLimit
} from '@/lib/redis';
import { fallbackLng, languages, cookieName } from './lib/i18n/config';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? '127.0.0.1';
  const path = request.nextUrl.pathname;

  // 1. i18n Language Detection
  let lng = request.cookies.get(cookieName)?.value;
  if (!lng) {
    const acceptLanguage = request.headers.get('accept-language');
    if (acceptLanguage) {
      lng = languages.find(l => acceptLanguage.includes(l));
    }
  }
  if (!lng) lng = fallbackLng;

  // 2. Rate Limiting Logic
  try {
    let limitResult;
    if (path.startsWith('/api/auth')) {
      limitResult = await authRateLimit.limit(ip);
    } else if (path.startsWith('/api/orders')) {
      limitResult = await orderRateLimit.limit(ip);
    } else if (path.startsWith('/api/documents')) {
      limitResult = await documentRateLimit.limit(ip);
    } else if (path.startsWith('/api/search/products')) {
      limitResult = await searchRateLimit.limit(ip);
    } else if (path.startsWith('/api/')) {
      limitResult = await defaultRateLimit.limit(ip);
    }

    if (limitResult && !limitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        {
          status: 429,
          headers: {
            'Retry-After': limitResult.reset.toString(),
            'X-RateLimit-Limit': limitResult.limit.toString(),
            'X-RateLimit-Remaining': limitResult.remaining.toString()
          }
        }
      );
    }
  } catch (err) {
    console.error('Rate limit error:', err);
    // Fail open if Redis is down
  }

  // 3. Supabase Auth Session Updating
  // The updateSession utility checks the token and refreshes it if needed,
  // attaching the new cookies to the response automatically.
  let response;
  let supabase;
  let sessionUser = null;
  
  try {
    const sessionUpdate = await updateSession(request);
    response = sessionUpdate.supabaseResponse;
    supabase = sessionUpdate.supabase;
    sessionUser = sessionUpdate.user;
  } catch (err) {
    console.error("[Middleware] Supabase updateSession error:", err);
    response = NextResponse.next();
  }

  // Set language cookie if not present or different
  if (request.cookies.get(cookieName)?.value !== lng) {
    response.cookies.set(cookieName, lng, { path: '/' });
  }

  // Route protection for dashboard
  if (path.startsWith('/dashboard')) {
    if (!sessionUser) {
      console.log("[Middleware] Unauthenticated access to /dashboard, redirecting to /login");
      const redirectResponse = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.getAll().forEach(c => redirectResponse.cookies.set(c.name, c.value));
      return redirectResponse;
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|assets|favicon.ico|sw.js).*)',
  ],
};
