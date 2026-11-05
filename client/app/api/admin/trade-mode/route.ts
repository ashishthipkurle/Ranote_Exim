import { NextRequest, NextResponse } from "next/server";
import { getTradeSettings, setTradeSettings } from "@/lib/trade-mode";
import { getApiAuthContext } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = getTradeSettings();
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to get trade mode" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { auth } = await getApiAuthContext(request);
    
    // Allow ADMIN or EXPORTER to toggle
    if (auth && auth.role !== "ADMIN" && auth.role !== "EXPORTER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const b2cActive = Boolean(body.b2cActive);

    const updated = setTradeSettings(b2cActive);

    // Optional: Also attempt syncing to DB admin profile if DB is reachable
    try {
      if (auth?.userId) {
        await prisma.user.update({
          where: { id: auth.userId },
          data: { b2cActive },
        });
      }
    } catch (dbErr) {
      // Non-fatal if DB is temporarily unreachable
      console.warn("[TradeSettings] DB user sync skipped:", dbErr);
    }

    return NextResponse.json({ success: true, ...updated });
  } catch (error: any) {
    console.error("[TradeSettings] Error updating trade mode:", error);
    return NextResponse.json({ error: error?.message || "Failed to update trade mode" }, { status: 500 });
  }
}
