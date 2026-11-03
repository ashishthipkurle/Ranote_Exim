import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result: any = {};

  try {
    // Add clientPhone if missing
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "quotation_requests" ADD COLUMN IF NOT EXISTS "clientPhone" TEXT;
    `);
    result.columnAdded = true;
  } catch (e: any) {
    result.columnAddError = e.message;
  }

  try {
    const rawTables = await prisma.$queryRawUnsafe(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name IN ('quotation_requests', 'quotation_items');
    `);
    result.columns = rawTables;
  } catch (e: any) {
    result.rawQueryError = e.message;
  }

  try {
    const quotes = await prisma.quotationRequest.findMany({
      include: { items: true },
      take: 5,
    });
    result.quotes = quotes;
    result.prismaSuccess = true;
  } catch (e: any) {
    result.prismaSuccess = false;
    result.prismaError = e.message;
    result.prismaCode = e.code;
  }

  return NextResponse.json(result);
}
