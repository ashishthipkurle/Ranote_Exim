import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getApiAuthContext } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

type ImporterRow = {
  id: string;
  name: string | null;
  businessName: string | null;
  country: string | null;
  avatar: string | null;
  orderCount: bigint | number;
  totalValue: bigint | number | string;
  lastOrderAt: Date | null;
};

export async function GET(request: NextRequest) {
  try {
    const { auth, error: authError } = await getApiAuthContext(request);
    if (authError || !auth) {
      return authError || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (auth.role !== "EXPORTER" && auth.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("q") || "").trim();
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const limit = Math.min(60, Math.max(1, Number(searchParams.get("limit") || "20")));

    const exporterId = auth.userId;

    const rows = (await prisma.$queryRaw<ImporterRow[]>`
      SELECT 
        u.id,
        u.name,
        u."businessName",
        u.country,
        u.avatar,
        COUNT(DISTINCT o.id) AS "orderCount",
        COALESCE(SUM(o."totalPrice"), 0) AS "totalValue",
        MAX(o."createdAt") AS "lastOrderAt"
      FROM users u
      INNER JOIN orders o ON o."buyerId" = u.id
      INNER JOIN products p ON p.id = o."productId"
      WHERE p."exporterId" = ${exporterId}
        AND (
          ${search} = '' 
          OR COALESCE(u.name, '') ILIKE '%' || ${search} || '%'
          OR COALESCE(u."businessName", '') ILIKE '%' || ${search} || '%'
          OR COALESCE(u.country, '') ILIKE '%' || ${search} || '%'
        )
      GROUP BY u.id, u.name, u."businessName", u.country, u.avatar
      ORDER BY MAX(o."createdAt") DESC
      LIMIT ${limit} OFFSET ${(page - 1) * limit}
    `) as ImporterRow[];

    const totalResult = await prisma.$queryRaw<Array<{ count: bigint | number }>>`
      SELECT COUNT(DISTINCT u.id) AS count
      FROM users u
      INNER JOIN orders o ON o."buyerId" = u.id
      INNER JOIN products p ON p.id = o."productId"
      WHERE p."exporterId" = ${exporterId}
        AND (
          ${search} = '' 
          OR COALESCE(u.name, '') ILIKE '%' || ${search} || '%'
          OR COALESCE(u."businessName", '') ILIKE '%' || ${search} || '%'
          OR COALESCE(u.country, '') ILIKE '%' || ${search} || '%'
        )
    `;

    const total = Number(totalResult[0]?.count ?? 0);

    return NextResponse.json({
      importers: rows.map((row: ImporterRow) => ({
        id: row.id,
        name: row.name,
        businessName: row.businessName,
        country: row.country,
        avatar: row.avatar,
        orderCount: Number(row.orderCount),
        totalValue: Number(row.totalValue),
        lastOrderAt: row.lastOrderAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error("Importer directory for calls error:", error);
    return NextResponse.json({ error: "Failed to fetch importer list" }, { status: 500 });
  }
}
