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

