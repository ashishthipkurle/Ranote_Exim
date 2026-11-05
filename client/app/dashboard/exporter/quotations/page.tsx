import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { getServerAuthContext } from "@/lib/auth-server";
import QuotationStatusButtons from "./QuotationStatusButtons";
import InitTableButton from "./InitTableButton";

export const dynamic = "force-dynamic";

export default async function QuotationsAdminPage() {
  const auth = await getServerAuthContext();
  if (!auth) redirect("/login");
  if (auth.role !== "EXPORTER" && auth.role !== "ADMIN") {
    redirect(`/dashboard/${auth.role.toLowerCase()}`);
  }

  let quotations: any[] = [];
  let dbError: string | null = null;

  try {
    quotations = await prisma.quotationRequest.findMany({
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (error: any) {
    console.error("Error fetching quotation requests:", error);
    dbError = error?.message || "Could not query quotation requests.";
  }

  return (
    <div className="px-8 pb-12 w-full min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quotation Requests</h1>
          <p className="text-muted-foreground mt-1">
            Manage and view all incoming quotation requests from the website.
          </p>
        </div>
      </div>

      {dbError && (
        <div className="mb-6 p-5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm space-y-3">
              <div>
                <p className="font-semibold text-amber-800 dark:text-amber-300 text-base">
                  Database Table Setup Required
                </p>
                <p className="mt-1 opacity-90 text-sm">
                  The <code className="px-1.5 py-0.5 bg-amber-500/20 rounded font-mono text-xs">quotation_requests</code> table has not been created in Supabase yet.
                </p>
                {dbError && (
                  <p className="mt-2 text-xs font-mono text-red-600 dark:text-red-400 bg-red-500/10 p-2 rounded border border-red-500/20 break-all">
                    Details: {dbError}
                  </p>
                )}
              </div>

              <div>
                <InitTableButton />
              </div>

              <div className="pt-2 border-t border-amber-500/20">
                <p className="text-xs font-medium text-amber-800 dark:text-amber-300 mb-1.5">
                  Or run this SQL in your Supabase SQL Editor:
                </p>
                <div className="p-3 bg-black/50 text-amber-100 rounded-lg font-mono text-xs overflow-x-auto select-all">
                  {`CREATE TABLE IF NOT EXISTS "quotation_requests" (
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

CREATE TABLE IF NOT EXISTS "quotation_items" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "quotationRequestId" TEXT NOT NULL,
  "productName" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  CONSTRAINT "quotation_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "quotation_items_quotationRequestId_fkey" FOREIGN KEY ("quotationRequestId") REFERENCES "quotation_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "quotation_items_quotationRequestId_idx" ON "quotation_items"("quotationRequestId");
CREATE INDEX IF NOT EXISTS "quotation_requests_createdAt_idx" ON "quotation_requests"("createdAt" DESC);`}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-semibold border-b border-border">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Client Name</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Products Requested</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y border-border">
              {quotations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No quotation requests found.
                  </td>
                </tr>
              ) : (
                quotations.map((quote) => (
                  <tr key={quote.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-foreground font-medium">
                      {quote.createdAt ? format(new Date(quote.createdAt), "MMM d, yyyy") : "-"}
                      <div className="text-xs text-muted-foreground font-normal">
                        {quote.createdAt ? format(new Date(quote.createdAt), "h:mm a") : ""}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-foreground">
                      <div className="font-semibold">{quote.clientName}</div>
                      {quote.businessName && (
                        <div className="text-xs text-muted-foreground flex items-center mt-1">
                          <span className="material-symbols-outlined text-[14px] mr-1">business</span>
                          {quote.businessName}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <a
                        href={`mailto:${quote.clientEmail}`}
                        className="hover:text-primary transition-colors flex items-center mb-1"
                      >
                        <span className="material-symbols-outlined text-[14px] mr-1">mail</span>
                        {quote.clientEmail}
                      </a>
                      {quote.clientPhone && (
                        <a
                          href={`tel:${quote.clientPhone}`}
                          className="hover:text-primary transition-colors flex items-center"
                        >
                          <span className="material-symbols-outlined text-[14px] mr-1">call</span>
                          {quote.clientPhone}
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {quote.items && quote.items.length > 0 ? (
                          quote.items.map((item: any) => (
                            <div
                              key={item.id}
                              className="flex items-center text-xs bg-muted px-2 py-1 rounded"
                            >
                              <span
                                className="font-medium text-foreground max-w-[150px] truncate mr-2"
                                title={item.productName}
                              >
                                {item.productName}
                              </span>
                              <span className="text-primary font-bold ml-auto">
                                x{item.quantity}
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">No specific products</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            quote.status === "PENDING"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-500"
                              : quote.status === "RESPONDED"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-500"
                              : "bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-500"
                          }`}
                        >
                          {quote.status === "PENDING" && <Clock className="w-3 h-3 mr-1" />}
                          {quote.status !== "PENDING" && <CheckCircle className="w-3 h-3 mr-1" />}
                          {quote.status}
                        </span>
                      </div>

                      <QuotationStatusButtons quoteId={quote.id} currentStatus={quote.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
