export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { email, code, purpose = "LOGIN" } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and code are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanCode = String(code).trim();

    // Find the most recent unused, unexpired OTP for this email+purpose
    let otpRecord: { id: string; code: string } | null = null;

    try {
      otpRecord = await prisma.otpCode.findFirst({
        where: {
          email: normalizedEmail,
          purpose,
          used: false,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
      });
    } catch (prismaErr: any) {
      console.warn("[verify-otp] Prisma query failed, using Supabase REST fallback...", prismaErr?.message);
      try {
        const adminSupabase = createAdminClient();
        const { data, error } = await adminSupabase
          .from("otp_codes")
          .select("id, code")
          .eq("email", normalizedEmail)
          .eq("purpose", purpose)
          .eq("used", false)
          .gt("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (data && !error) {
          otpRecord = {
            id: data.id,
            code: data.code,
          };
        }
      } catch (fallbackErr) {
        console.error("[verify-otp] Supabase fallback error:", fallbackErr);
      }
    }

    if (!otpRecord) {
      return NextResponse.json(
        { error: "No valid verification code found. Please request a new one." },
        { status: 400 }
      );
    }

    if (otpRecord.code !== cleanCode) {
      return NextResponse.json(
        { error: "Invalid verification code. Please check and try again." },
        { status: 400 }
      );
    }

    // Mark as used
    try {
      await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { used: true },
      });
    } catch {
      try {
        const adminSupabase = createAdminClient();
        await adminSupabase.from("otp_codes").update({ used: true }).eq("id", otpRecord.id);
      } catch {}
    }

    // Clean up old OTP records for this email (non-critical cleanup)
    try {
      await prisma.otpCode.deleteMany({
        where: {
          email: normalizedEmail,
          OR: [
            { used: true },
            { expiresAt: { lt: new Date() } },
          ],
          id: { not: otpRecord.id },
        },
      });
    } catch {}

    return NextResponse.json({
      message: "Verification successful",
      verified: true,
    });
  } catch (error: any) {
    console.error("[verify-otp] Error:", error?.message || error);
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}
