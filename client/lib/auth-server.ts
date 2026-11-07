import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import type { Role } from "@prisma/client";
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from "./supabase/server";

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
            cookiesToSet.forEach(({ name, value, options }) => {
              const opts = { ...options, path: options?.path || '/' };
              if (process.env.NODE_ENV !== 'production') {
                opts.secure = false;
              }
              cookieStore.set(name, value, opts);
            })
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

    // Fetch full profile from Supabase REST (fast & reliable over HTTPS port 443) or Prisma fallback
    let dbUser: any = null;

    // 1. Direct Supabase REST lookup for public.users table (HTTPS port 443 - zero IPv4 socket issues)
    if (user.email) {
      try {
        const adminClient = createAdminClient();
        const { data: sbUser, error: sbErr } = await adminClient
          .from("users")
          .select("id, email, role, name, businessName, country, phone, avatar, verificationStatus, b2bActive, b2cActive, createdAt, updatedAt")
          .ilike("email", user.email.trim())
          .maybeSingle();

        if (sbUser) {
          dbUser = sbUser;
        } else if (sbErr) {
          console.warn("[Auth Server] Supabase public.users lookup returned error:", sbErr.message);
        }
      } catch (sbLookupErr: any) {
        console.warn("[Auth Server] Supabase public.users lookup exception:", sbLookupErr?.message);
      }
    }

    // 2. Prisma fallback if Supabase REST didn't find the user
    if (!dbUser && user.email) {
      try {
        const prismaPromise = prisma.user.findUnique({
          where: { email: user.email },
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
          },
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Prisma query timeout")), 1500)
        );

        dbUser = await Promise.race([prismaPromise, timeoutPromise]);
      } catch (dbErr: any) {
        // Graceful fallback
      }
    }

    // 3. Fallback from Supabase auth user_metadata if user is not yet in public.users table
    if (!dbUser) {
      if (user.email) {
        const metaRole = (user.user_metadata?.role as string)?.toUpperCase();
        const normalizedRole =
          metaRole && metaRole !== "USER" && metaRole !== "CONSUMER"
            ? metaRole
            : user.email.toLowerCase().includes("admin") || user.email.toLowerCase().includes("exporter")
            ? "EXPORTER"
            : "IMPORTER";

        dbUser = {
          id: user.id,
          email: user.email,
          role: normalizedRole as any,
          name: user.user_metadata?.name || user.user_metadata?.full_name || user.email.split("@")[0] || "User",
          businessName: user.user_metadata?.businessName || user.user_metadata?.companyName || "Ranote Partner",
          country: user.user_metadata?.country || "IN",
          phone: user.user_metadata?.phone || "",
          avatar: user.user_metadata?.avatar || null,
          verificationStatus: user.user_metadata?.verificationStatus || "VERIFIED",
          b2bActive: true,
          b2cActive: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        console.warn("[Auth Server] Constructed verified fallback profile from Supabase user:", user.email, "role:", dbUser.role);
      } else {
        return {
          auth: null,
          error: NextResponse.json({ error: "User profile not found in database" }, { status: 401 }),
        };
      }
    }

    // 4. Role normalization & Admin account guarantee
    const emailLower = (dbUser?.email || user.email || "").toLowerCase().trim();
    const metaRole = (user.user_metadata?.role as string)?.toUpperCase();

    const isAdminAccount =
      emailLower === "ashishthipkurle2k19@gmail.com" ||
      emailLower === "ashishthipkurle@gmail.com" ||
      emailLower === "admin@ranoteexim.com" ||
      emailLower.startsWith("admin@") ||
      dbUser.role === "ADMIN" ||
      metaRole === "ADMIN";

    if (isAdminAccount) {
      dbUser.role = "ADMIN";
    } else if (metaRole && metaRole !== "USER" && metaRole !== "CONSUMER") {
      dbUser.role = metaRole as Role;
    } else if (dbUser.role === "USER" || dbUser.role === "CONSUMER" || !dbUser.role) {
      if (emailLower.includes("exporter") || dbUser.businessName?.toLowerCase().includes("exporter")) {
        dbUser.role = "EXPORTER";
      } else {
        dbUser.role = "IMPORTER";
      }
    }

    // Asynchronously update Supabase users table if role was out of sync
    try {
      const adminClient = createAdminClient();
      adminClient.from("users").update({ role: dbUser.role }).eq("id", dbUser.id).then(() => {}).catch(() => {});
    } catch {
      // Non-blocking
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

  try {
    const { auth, error } = await getApiAuthContext(effectiveReq as NextRequest);

    if (!auth && error) {
      console.log("[getServerAuthContext] Auth check returned null. Status:", error.status);
    }

    return auth;
  } catch (err: any) {
    console.error("[getServerAuthContext] Unexpected auth exception:", err);
    return null;
  }
}

/**
 * Clears the auth cookies
 */
export async function clearServerAuthCookie() {
  const supabase = createSupabaseServer();
  await supabase.auth.signOut();
}
