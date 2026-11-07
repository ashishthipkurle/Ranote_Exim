export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiAuthContext } from "@/lib/auth-server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/messaging/unread-categories
 * Returns unread message counts grouped by UI category with Supabase REST fallback.
 */
export async function GET(req: NextRequest) {
  try {
    const { auth, error: authError } = await getApiAuthContext(req);

    if (authError || !auth) {
      return authError || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const counts = {
      buyers: 0,
      dealers: 0,
      sellers: 0,
      exporters: 0,
    };

    let unreadMessages: any[] = [];

    // 1. Try Supabase REST first (HTTPS port 443 - zero socket issues)
    try {
      const adminClient = createAdminClient();
      const { data: sbMessages, error: sbErr } = await adminClient
        .from("messages")
        .select("senderId, isRead, sender:users!messages_senderId_fkey(role)")
        .eq("receiverId", auth.userId)
        .eq("isRead", false);

      if (sbMessages && !sbErr) {
        unreadMessages = sbMessages.map((m: any) => ({
          senderId: m.senderId,
          sender: Array.isArray(m.sender) ? m.sender[0] : m.sender || { role: "USER" },
        }));
      }
    } catch {
      // Supabase REST fallback failed, try Prisma
    }

    // 2. Fallback to Prisma if Supabase REST had no messages or was bypassed
    if (unreadMessages.length === 0) {
      try {
        unreadMessages = await Promise.race([
          prisma.message.findMany({
            where: {
              receiverId: auth.userId,
              isRead: false,
            },
            select: {
              senderId: true,
              sender: {
                select: {
                  role: true,
                },
              },
            },
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Prisma timeout")), 1500)),
        ]) as any[];
      } catch {
        unreadMessages = [];
      }
    }

    if (auth.role === "EXPORTER" || auth.role === "ADMIN") {
      let dealerIds = new Set<string>();
      try {
        const adminClient = createAdminClient();
        const { data: sups } = await adminClient
          .from("suppliers")
          .select("importerId")
          .eq("exporterId", auth.userId);
        if (sups) {
          dealerIds = new Set(sups.map((s: any) => s.importerId).filter(Boolean));
        }
      } catch {
        dealerIds = new Set();
      }

      unreadMessages.forEach((msg) => {
        if (dealerIds.has(msg.senderId)) {
          counts.dealers++;
        } else if (msg.sender?.role === "IMPORTER") {
          counts.buyers++;
        }
      });
    } else if (auth.role === "IMPORTER") {
      unreadMessages.forEach((msg) => {
        if (msg.sender?.role === "EXPORTER" || msg.sender?.role === "ADMIN") {
          counts.sellers++;
        }
      });
    } else if (auth.role === "SUPPLIER") {
      unreadMessages.forEach((msg) => {
        if (msg.sender?.role === "EXPORTER" || msg.sender?.role === "ADMIN") {
          counts.exporters++;
        }
      });
    }

    return NextResponse.json(counts);
  } catch (error: any) {
    console.error("Unread Categories API Error:", error?.message);
    return NextResponse.json({ buyers: 0, dealers: 0, sellers: 0, exporters: 0 });
  }
}
