import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, Mail, Phone, Building2 } from "lucide-react";
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
    <div className="space-y-6">
      {/* ── Page Header: Title + Subtitle ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#15130D] uppercase">
            Quotation Requests
          </h1>
          <p className="text-sm text-[#6B6A66] mt-1">
            Manage and view all incoming quotation requests from the website.
          </p>
        </div>
      </div>

      {dbError && (
        <div className="p-5 rounded-[20px] border border-amber-500/40 bg-amber-500/10 text-amber-950">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm space-y-3">
              <div>
                <p className="font-semibold text-amber-900 text-base">
                  Database Table Setup Required
                </p>
                <p className="mt-1 opacity-90 text-sm">
                  The <code className="px-1.5 py-0.5 bg-amber-500/20 rounded font-mono text-xs">quotation_requests</code> table has not been created in Supabase yet.
                </p>
                {dbError && (
                  <p className="mt-2 text-xs font-mono text-red-600 bg-red-500/10 p-2 rounded border border-red-500/20 break-all">
                    Details: {dbError}
                  </p>
                )}
              </div>

              <div>
                <InitTableButton />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Quotations Table Card ── */}
      <div className="bg-gradient-to-b from-white to-[#FFFBF0] rounded-[24px] border border-[#F0ECE0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#F0ECE0] text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66]">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Client Name</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Products Requested</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0ECE0] text-xs">
              {quotations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#6B6A66]">
                    No quotation requests found.
                  </td>
                </tr>
              ) : (
                quotations.map((quote) => (
                  <tr key={quote.id} className="hover:bg-[#FFFBF2] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-[#15130D]">
                      {quote.createdAt ? format(new Date(quote.createdAt), "MMM d, yyyy") : "-"}
                      <div className="text-[10px] text-[#6B6A66] font-normal">
                        {quote.createdAt ? format(new Date(quote.createdAt), "h:mm a") : ""}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#15130D]">
                      <div className="font-bold">{quote.clientName}</div>
                      {quote.businessName && (
                        <div className="text-[11px] text-[#6B6A66] flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3.5 h-3.5" />
                          {quote.businessName}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-[#6B6A66]">
                      <a
                        href={`mailto:${quote.clientEmail}`}
                        className="hover:text-[#C4912A] transition-colors flex items-center gap-1.5 mb-1"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        {quote.clientEmail}
                      </a>
                      {quote.clientPhone && (
                        <a
                          href={`tel:${quote.clientPhone}`}
                          className="hover:text-[#C4912A] transition-colors flex items-center gap-1.5"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {quote.clientPhone}
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        {quote.items && quote.items.length > 0 ? (
                          quote.items.map((item: any) => (
                            <div
                              key={item.id}
                              className="flex items-center text-xs bg-white border border-[#F0ECE0] px-3 py-1.5 rounded-full"
                            >
                              <span
                                className="font-semibold text-[#15130D] max-w-[160px] truncate mr-2"
                                title={item.productName}
                              >
                                {item.productName}
                              </span>
                              <span className="text-[#C4912A] font-bold ml-auto">
                                x{item.quantity}
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-[#6B6A66]">No specific products</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit ${
                            quote.status === "PENDING"
                              ? "bg-[#FBF1D6] text-[#7A560A] border border-[#C4912A]/20"
                              : quote.status === "RESPONDED"
                              ? "bg-[#E2F5EE] text-[#0B7A57] border border-[#0B7A57]/20"
                              : "bg-[#F7F5F0] text-[#6B6A66] border border-[#ECE7DA]"
                          }`}
                        >
                          {quote.status}
                        </span>
                        <QuotationStatusButtons
                          quotationId={quote.id}
                          currentStatus={quote.status}
                          clientEmail={quote.clientEmail}
                        />
                      </div>
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
