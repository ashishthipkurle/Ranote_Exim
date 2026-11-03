"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateQuotationStatus(id: string, status: string) {
  try {
    await prisma.quotationRequest.update({
      where: { id },
      data: { status },
    });
    revalidatePath("/dashboard/exporter/quotations");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update quotation status:", error);
    return { success: false, error: error?.message || "Failed to update quotation" };
  }
}

export async function initQuotationsTable() {
  try {
    // 1. Create tables if they do not exist
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "quotation_requests" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "clientName" TEXT NOT NULL,
        "clientEmail" TEXT NOT NULL,
        "clientPhone" TEXT,
        "businessName" TEXT,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "quotation_requests_pkey" PRIMARY KEY ("id")
      )
    `);

    // Ensure all required columns exist (in case the table already existed with an older schema)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "quotation_requests" ADD COLUMN IF NOT EXISTS "clientPhone" TEXT
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "quotation_requests" ADD COLUMN IF NOT EXISTS "businessName" TEXT
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "quotation_items" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "quotationRequestId" TEXT NOT NULL,
        "productName" TEXT NOT NULL,
        "quantity" INTEGER NOT NULL,
        CONSTRAINT "quotation_items_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "quotation_items_quotationRequestId_fkey" FOREIGN KEY ("quotationRequestId") REFERENCES "quotation_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "quotation_items_quotationRequestId_idx" ON "quotation_items"("quotationRequestId")
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "quotation_requests_createdAt_idx" ON "quotation_requests"("createdAt" DESC)
    `);

    revalidatePath("/dashboard/exporter/quotations");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to auto-init table:", error);
    return { success: false, error: error?.message || "Failed to initialize table" };
  }
}
