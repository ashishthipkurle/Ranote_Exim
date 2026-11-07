export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getApiAuthContext } from "@/lib/auth-server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * POST /api/user/change-password
 * Changes the password for the currently authenticated user via Supabase.
 */
export async function POST(request: NextRequest) {
  try {
    const { auth, error: authError } = await getApiAuthContext(request);
    if (authError || !auth) {
      return authError || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { newPassword } = await request.json();

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { error: updateError } = await admin.auth.admin.updateUserById(
      auth.userId,
      { password: newPassword }
    );

    if (updateError) {
      console.error("[ChangePassword] Supabase update error:", updateError);
      return NextResponse.json(
        { error: updateError.message || "Failed to change password" },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: "Password changed successfully" });
  } catch (error: any) {
    console.error("[ChangePassword] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
