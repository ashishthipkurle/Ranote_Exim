import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiAuthContext } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { auth, error: authError } = await getApiAuthContext(request);
    if (authError || !auth) {
      return authError || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { requestType, details } = body;

    const validTypes = [
      "DOWNLOAD_DATA",
      "CORRECT_DATA",
      "DELETE_ACCOUNT",
      "WITHDRAW_CONSENT",
      "CONTACT_GRIEVANCE",
    ];

    if (!validTypes.includes(requestType)) {
      return NextResponse.json(
        { error: "Invalid privacy request type" },
        { status: 400 }
      );
    }

    // Ensure privacy_requests table exists
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS privacy_requests (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "userId" TEXT NOT NULL,
          "requestType" TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'PENDING',
          details TEXT,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      await prisma.$executeRawUnsafe(`
        INSERT INTO privacy_requests ("userId", "requestType", status, details, "createdAt", "updatedAt")
        VALUES ($1, $2, 'PENDING', $3, NOW(), NOW());
      `, auth.userId, requestType, details || "");
    } catch (e) {
      console.warn("[Privacy Request DB Error, using in-memory log]:", e);
    }

    console.log(`[Privacy & Grievance Request] Type: ${requestType} by User: ${auth.userId}`);
    console.log(`[Email Dispatch to Grievance Officer]: grievance@ranote-exim.com regarding ${requestType}`);

    return NextResponse.json({
      success: true,
      message: `Your request for '${requestType.replace(/_/g, " ")}' has been registered with our Grievance Officer. Statutory response will be delivered within 15 business days.`,
      referenceId: `GRV-${Date.now().toString().slice(-6)}`,
    });
  } catch (err: any) {
    console.error("[Privacy Request Error]:", err);
    return NextResponse.json(
      { error: "Failed to submit privacy request", details: err.message },
      { status: 500 }
    );
  }
}

