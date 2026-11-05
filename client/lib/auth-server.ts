import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import type { Role } from "@prisma/client";
import { createServerClient } from '@supabase/ssr'

export type AuthContext = {
  userId: string;
  role: Role;
  email: string;
  user: any;
};

// Supabase uses its own cookies internally via the SSR client,
// but we keep these exported constants for legacy code compatibility if needed.
export const AUTH_COOKIE_NAME = "sb-access-token";
export const REFRESH_COOKIE_NAME = "sb-refresh-token";

/**
 * Creates a Supabase server client that works with App Router API routes
 * or Server Actions.
 */
function createSupabaseServer(req?: NextRequest) {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // Middleware handles refreshing.
          }
        },
      },
    }
  )
}

/**
 * Gets the current authenticated user context on the server side using Supabase.
 * Replaces the old Nhost implementation.
 */
export async function getApiAuthContext(
  request: NextRequest,
  allowedRoles?: Role[]
): Promise<{ auth: AuthContext | null; error: NextResponse | null }> {
  try {
    const supabase = createSupabaseServer(request)

    // Verify token with Supabase (automatically handles refresh via SSR client if needed)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("[Auth Server] Supabase auth failed or no user.");
      return {
        auth: null,
        error: NextResponse.json({ error: "Missing or invalid authentication token" }, { status: 401 }),
      };
    }

    // PII Redacted
    // console.log("[Auth] Verified Supabase User:", user.id, user.email);

    // Fetch full profile from Prisma to get the Role and other metadata
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email }, // Join by email since Supabase UUID might differ from old Nhost UUIDs if migrating
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        businessName: true,
        country: true,
        phone: true,
        avatar: true,
        verificationStatus: true,
        b2bActive: true,
        b2cActive: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!dbUser) {
      // PII Redacted
      // console.warn("[Auth] User in Supabase but missing in Prisma:", user.email);
      return {
        auth: null,
        error: NextResponse.json({ error: "User profile not found in database" }, { status: 401 }),
      };
    }

    // Role-based access control check
    if (allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(dbUser.role)) {
        console.warn("[Auth] Role mismatch. Required:", allowedRoles, "Has:", dbUser.role);
        return {
          auth: null,
          error: NextResponse.json(
            { error: "Forbidden: You do not have the required permissions" },
            { status: 403 }
          ),
        };
      }
    }

    return {
      auth: {
        userId: dbUser.id,
        role: dbUser.role,
        email: dbUser.email,
        user: dbUser,
      },
      error: null,
    };
  } catch (e: any) {
    if (e?.digest === 'DYNAMIC_SERVER_USAGE' || e?.message?.includes('Dynamic server usage')) {
      throw e;
    }
    console.error("[Auth] Fatal error in getApiAuthContext:", e);
    
    const errMsg = e?.message?.toLowerCase() || "";
    if (
      errMsg.includes("fetch") || 
      errMsg.includes("network") || 
      errMsg.includes("connect") || 
      errMsg.includes("reach database") || 
      errMsg.includes("database server") ||
      e?.code === "ECONNREFUSED" ||
      e?.code === "P1001" ||
      e?.name === "PrismaClientInitializationError"
    ) {
      return {
        auth: null,
        error: NextResponse.json({ error: "Network error: Unable to connect to the database. Please check your internet connection." }, { status: 503 }),
      };
    }

    return {
      auth: null,
      error: NextResponse.json({ error: "Internal server error during authentication" }, { status: 500 }),
    };
  }
}

/**
 * Shorthand for simple getServerAuthContext (legacy support)
 */
export async function getServerAuthContext(req?: NextRequest): Promise<AuthContext | null> {
  // If no request is provided (called from layouts), create a minimal request-like
  // object that carries the headers from the current request context.
  let effectiveReq = req;
  if (!effectiveReq) {
    try {
      const { headers: getHeaders } = await import("next/headers");
      const headersList = getHeaders();
      effectiveReq = {
        headers: {
          get: (name: string) => headersList.get(name),
        },
      } as unknown as NextRequest;
    } catch (e) {
      // Fallback if headers() isn't available
    }
  }

  const { auth, error } = await getApiAuthContext(effectiveReq as NextRequest);

  if (!auth && error) {
    if (error.status === 503 || error.status === 500) {
      console.error("[getServerAuthContext] Network or Database error. Throwing NETWORK_ERROR to prevent false logout.");
      throw new Error("NETWORK_ERROR");
    }
    console.log("[getServerAuthContext] Auth failed, returning null.");
  }

  return auth;
}

/**
 * Clears the auth cookies
 */
export async function clearServerAuthCookie() {
  const supabase = createSupabaseServer();
  await supabase.auth.signOut();
}
