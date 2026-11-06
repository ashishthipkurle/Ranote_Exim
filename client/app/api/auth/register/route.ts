export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { registerSchema } from "@/lib/validations";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Default new client accounts to IMPORTER so they get full Importer Dashboard access
    const userRole = (!validatedData.role || validatedData.role === "USER" || (validatedData.role as string) === "CONSUMER")
      ? "IMPORTER"
      : validatedData.role;

    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    console.log("[Register] Attempting Supabase sign-up for:", validatedData.email, "as role:", userRole);

    const { data, error } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          name: validatedData.name,
          role: userRole,
          businessName: validatedData.businessName,
          country: validatedData.country,
          phone: validatedData.phone,
        },
      },
    });

    if (error) {
      console.error("[Register] Supabase threw:", error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const userId = data.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Registration failed, no user returned" }, { status: 400 });
    }

    // Auto-sync with Prisma Database
    try {
      await prisma.user.upsert({
        where: { email: validatedData.email },
        update: {
          name: validatedData.name,
          role: userRole as any,
          businessName: validatedData.businessName || null,
          country: validatedData.country,
          phone: validatedData.phone || null,
        },
        create: {
          id: userId,
          email: validatedData.email,
          name: validatedData.name,
          role: userRole as any,
          businessName: validatedData.businessName || null,
          country: validatedData.country,
          phone: validatedData.phone || null,
          verificationStatus: "VERIFIED", 
        },
      });

      // Welcome notification
      await prisma.notification.create({
        data: {
          userId: userId,
          type: "ORDER_UPDATE",
          title: "Welcome to Ranote Exim!",
          message: `Welcome ${validatedData.name ?? ""}! Your importer account has been created successfully.`,
        },
      });
    } catch (e: any) {
      console.warn("Prisma sync failed during registration:", e.message);
    }

    // If auto login succeeded during signup
    if (data.session?.access_token) {
      return NextResponse.json(
        {
          message: "Registration successful",
          user: { id: userId, name: validatedData.name, email: validatedData.email, role: userRole },
          token: data.session.access_token,
        },
        { status: 201 }
      );
    }

    // If require email verification was turned on
    return NextResponse.json(
      { message: "Registration successful. Please check your email to verify your account or log in." },
      { status: 201 }
    );

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Registration error:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
