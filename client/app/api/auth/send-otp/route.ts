export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOtpCode, sendOtpEmail } from "@/lib/otp-email";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { email, purpose = "LOGIN" } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Rate limit check: max 5 OTP requests per email per 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    try {
      const recentCount = await prisma.otpCode.count({
        where: {
          email: normalizedEmail,
          createdAt: { gte: tenMinutesAgo },
        },
      });

      if (recentCount >= 5) {
        return NextResponse.json(
          { error: "Too many OTP requests. Please wait a few minutes." },
          { status: 429 }
        );
      }
    } catch (countErr) {
      console.warn("[send-otp] Rate limit check warning (continuing gracefully):", countErr);
    }

    // Generate a 6-digit numeric OTP code
    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store in database with automatic Supabase REST fallback if Prisma connection is cold
    let saved = false;
    try {
      await prisma.otpCode.create({
        data: {
          email: normalizedEmail,
          code,
          purpose,
          expiresAt,
        },
      });
      saved = true;
    } catch (prismaErr: any) {
      console.warn("[send-otp] Prisma write failed, falling back to Supabase REST...", prismaErr?.message);
      try {
        const adminSupabase = createAdminClient();
        const { error: supaErr } = await adminSupabase.from("otp_codes").insert({
          email: normalizedEmail,
          code,
          purpose,
          expires_at: expiresAt.toISOString(),
          used: false,
        });
        if (!supaErr) {
          saved = true;
        } else {
          console.error("[send-otp] Supabase fallback error:", supaErr);
        }
      } catch (fallbackErr) {
        console.error("[send-otp] Supabase fallback exception:", fallbackErr);
      }
    }

    if (!saved) {
      // Re-try Prisma once more after brief delay before failing
      await new Promise((r) => setTimeout(r, 250));
      await prisma.otpCode.create({
        data: {
          email: normalizedEmail,
          code,
          purpose,
          expiresAt,
        },
      });
    }

    // Send the email (or log to console in dev mode)
    const sent = await sendOtpEmail(normalizedEmail, code, purpose as any);

    if (!sent) {
      return NextResponse.json(
        { error: "Failed to send verification code. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Verification code sent successfully",
      // In dev mode without SMTP, include the code so the dev can test
      ...((!process.env.SMTP_USER || !process.env.SMTP_PASS) && { devCode: code }),
    });
  } catch (error: any) {
    console.error("[send-otp] Error:", error?.message || error);
    return NextResponse.json(
      { error: "Failed to send OTP. Please try again." },
      { status: 500 }
    );
  }
}
