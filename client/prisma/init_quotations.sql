-- Create quotation_requests table
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
);

-- Create quotation_items table
CREATE TABLE IF NOT EXISTS "quotation_items" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "quotationRequestId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    CONSTRAINT "quotation_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "quotation_items_quotationRequestId_fkey" FOREIGN KEY ("quotationRequestId") REFERENCES "quotation_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "quotation_items_quotationRequestId_idx" ON "quotation_items"("quotationRequestId");
CREATE INDEX IF NOT EXISTS "quotation_requests_createdAt_idx" ON "quotation_requests"("createdAt" DESC);

