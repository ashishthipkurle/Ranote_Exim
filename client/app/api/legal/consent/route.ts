import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiAuthContext } from "@/lib/auth-server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { document, version } = body;

    if (!document || !version) {
      return NextResponse.json(
        { error: "Document type and version are required" },
        { status: 400 }
      );
    }

    const { auth } = await getApiAuthContext(request);
    const userId = auth?.userId || body.userId || null;
    const userEmail = auth?.email || body.userEmail || null;

    // Hash client IP with SHA-256 for privacy compliance
    const forwardedFor = request.headers.get("x-forwarded-for") || "";
    const ip = forwardedFor.split(",")[0]?.trim() || "127.0.0.1";
    const ipHash = crypto.createHash("sha256").update(ip + "RANOTE_SALT").digest("hex").slice(0, 32);

    const userAgent = request.headers.get("user-agent") || "unknown";

    // Attempt to record in legal_consents table if exists, or log
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS legal_consents (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "userId" TEXT,
          "userEmail" TEXT,
          document TEXT NOT NULL,
          version TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'APPROVED',
          "acceptedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "ipHash" TEXT,
          "userAgent" TEXT
        );
      `);

      await prisma.$executeRawUnsafe(`
        INSERT INTO legal_consents ("userId", "userEmail", document, version, status, "acceptedAt", "ipHash", "userAgent")
        VALUES ($1, $2, $3, $4, 'APPROVED', NOW(), $5, $6);
      `, userId, userEmail, document, version, ipHash, userAgent);

      // Also ensure user's contactInfo in users table reflects legalStatus: APPROVED
      if (userId) {
        await prisma.$executeRawUnsafe(`
          UPDATE users
          SET "contactInfo" = jsonb_set(
            jsonb_set(
              COALESCE("contactInfo", '{}'::jsonb),
              '{termsAccepted}',
              'true'::jsonb
            ),
            '{legalStatus}',
            '"APPROVED"'::jsonb
          )
          WHERE id = $1;
        `, userId);
      }
    } catch (dbErr) {
      console.warn("[Consent Log] Fallback logging:", {
        userId,
        userEmail,
        document,
        version,
        status: "APPROVED",
        acceptedAt: new Date().toISOString(),
        ipHash,
        userAgent,
      });
    }

    return NextResponse.json({
      success: true,
      logged: {
        userId,
        userEmail,
        document,
        version,
        status: "APPROVED",
        acceptedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[Consent Log Error]:", error);
    return NextResponse.json(
      { error: "Failed to record legal consent", details: error.message },
      { status: 500 }
    );
  }
}

// GET: Check if authenticated user has accepted latest versions
export async function GET(request: NextRequest) {
  try {
    const { auth, error: authError } = await getApiAuthContext(request);
    if (authError || !auth) {
      return NextResponse.json({ accepted: true }); // Unauthenticated
    }

    // Check latest consent records for current user
    let consents: Array<{ document: string; version: string }> = [];
    try {
      consents = await prisma.$queryRawUnsafe(`
        SELECT DISTINCT ON (document) document, version
        FROM legal_consents
        WHERE "userId" = $1
        ORDER BY document, "acceptedAt" DESC;
      `, auth.userId) as any[];
    } catch (e) {
      return NextResponse.json({ accepted: true });
    }

    const consentMap: Record<string, string> = {};
    (consents || []).forEach((c) => {
      consentMap[c.document] = c.version;
    });

    return NextResponse.json({
      userId: auth.userId,
      consents: consentMap,
    });
  } catch (err: any) {
    return NextResponse.json({ accepted: true });
  }
}

