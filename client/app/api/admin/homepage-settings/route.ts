import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getHomepageSettings, updateHomepageSettings } from "@/lib/homepage-settings";
import { getApiAuthContext } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = getHomepageSettings();
    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("[HomepageSettings API] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch homepage settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const { auth, error: authError } = await getApiAuthContext(req, ["ADMIN"]);
    
    // Allow master emails or admin role
    if (authError || !auth) {
      const isMasterEmail = auth?.email?.toLowerCase() === "exporter@gmail.com" || auth?.email?.toLowerCase() === "admin@gmail.com";
      const isAuthorizedRole = auth?.role === "ADMIN";

      if (!isMasterEmail && !isAuthorizedRole) {
        return NextResponse.json(
          { error: "Unauthorized: Admin clearance required" },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const { showHeroVideo } = body;

    if (typeof showHeroVideo !== "boolean") {
      return NextResponse.json(
        { error: "Invalid parameter: showHeroVideo must be a boolean" },
        { status: 400 }
      );
    }

    const updated = updateHomepageSettings({ showHeroVideo });

    // Purge cached server render of homepage
    try {
      revalidatePath("/");
    } catch (e) {
      console.warn("[HomepageSettings API] revalidatePath warning:", e);
    }

    return NextResponse.json({
      success: true,
      message: `Hero video is now ${showHeroVideo ? "enabled" : "disabled"}.`,
      settings: updated,
    });
  } catch (error) {
    console.error("[HomepageSettings API] POST error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
