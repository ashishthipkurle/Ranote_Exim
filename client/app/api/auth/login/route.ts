export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { loginSchema } from "@/lib/validations";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    const cookieStore = cookies();
    const cookiesToSetList: Array<{ name: string; value: string; options?: any }> = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              try {
                cookieStore.set(name, value, options);
              } catch {
                // Non-blocking in route handler
              }
              cookiesToSetList.push({ name, value, options });
            });
          },
        },
      }
    );

    // PII Redacted
    // console.log("[Login] Attempting Supabase sign-in for:", validatedData.email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    });

    if (error || !data.user || !data.session) {
      console.error("[Login] Supabase SDK threw error:", error?.message);
      return NextResponse.json(
        { error: error?.message || "Invalid email or password" }, 
        { status: 401 }
      );
    }

    // Fetch the user from our database (Prisma or Supabase REST fallback)
    let dbUser: any = null;
    try {
      dbUser = await Promise.race([
        prisma.user.findUnique({
          where: { email: validatedData.email },
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Prisma timeout")), 2000)),
      ]);
    } catch (err: any) {
      console.warn("[Login] Prisma lookup failed or timed out:", err?.message);
    }

    if (!dbUser) {
      try {
        const adminClient = createAdminClient();
        const { data: sbUser } = await adminClient
          .from("users")
          .select("id, email, role, name, businessName")
          .ilike("email", validatedData.email.trim())
          .maybeSingle();

        if (sbUser) {
          dbUser = sbUser;
        }
      } catch (sbErr: any) {
        console.warn("[Login] Supabase users lookup error:", sbErr?.message);
      }
    }

    if (!dbUser) {
      // Fallback from auth user metadata
      const metaRole = (data.user.user_metadata?.role as string)?.toUpperCase();
      dbUser = {
        id: data.user.id,
        email: data.user.email,
        role: metaRole && metaRole !== "USER" && metaRole !== "CONSUMER" ? metaRole : "IMPORTER",
      };
    }

    // Role normalization & Admin guarantee
    const emailLower = (dbUser?.email || validatedData.email || "").toLowerCase().trim();
    const metaRole = (data.user.user_metadata?.role as string)?.toUpperCase();

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
      dbUser.role = metaRole;
    } else if (dbUser.role === "USER" || dbUser.role === "CONSUMER" || !dbUser.role) {
      if (emailLower.includes("exporter") || dbUser.businessName?.toLowerCase().includes("exporter")) {
        dbUser.role = "EXPORTER";
      } else {
        dbUser.role = "IMPORTER";
      }
    }

    const profile = {
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
    };

    const response = NextResponse.json({
      message: "Login successful",
      user: profile,
      token: data.session.access_token,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        expires_in: data.session.expires_in,
        token_type: data.session.token_type,
        user: data.session.user,
      },
    });

    // Explicitly attach auth cookies to the response
    cookiesToSetList.forEach(({ name, value, options }) => {
      const opts = { ...options, path: options?.path || "/" };
      if (process.env.NODE_ENV !== "production") {
        opts.secure = false;
      }
      response.cookies.set(name, value, opts);
    });

    return response;

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Login error:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
