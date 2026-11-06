export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/auth/oauth/sync-user
 * Ensures that a user who authenticated via OAuth (Google/LinkedIn)
 * has a corresponding record in our Prisma database.
 * This is called after the OAuth callback successfully exchanges tokens.
 */
export async function POST(request: NextRequest) {
  try {
    const { id, email, displayName, avatarUrl } = await request.json();

    if (!id || !email) {
      return NextResponse.json(
        { error: "Missing required fields: id, email" },
        { status: 400 }
      );
    }

    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (existingUser) {
      // User already exists, optionally update avatar if missing
      if (!existingUser.avatar && avatarUrl) {
        await prisma.user.update({
          where: { id },
          data: { avatar: avatarUrl },
        });
      }
      return NextResponse.json({
        message: "User already exists",
        user: existingUser,
      });
    }

    // Create the user in our database
    const newUser = await prisma.user.create({
      data: {
        id,
        email,
        name: displayName || email.split("@")[0],
        avatar: avatarUrl || null,
        role: "IMPORTER", // Default role for OAuth sign-ups (Importers)
      },
    });

    console.log("[OAuth Sync] Created new user:", newUser.id, newUser.email);

    return NextResponse.json({
      message: "User created",
      user: newUser,
    });
  } catch (error: any) {
    // Handle unique constraint violations gracefully (race condition)
    if (error.code === "P2002") {
      console.log("[OAuth Sync] User already exists (unique constraint):", error.meta?.target);
      return NextResponse.json({ message: "User already exists" });
    }

    console.error("[OAuth Sync] Error syncing user:", error);
    return NextResponse.json(
      { error: "Failed to sync user" },
      { status: 500 }
    );
  }
}

