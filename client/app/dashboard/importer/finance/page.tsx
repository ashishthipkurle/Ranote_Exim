"use client";

import { useEffect, useState } from "react";
import {
  authFetch,
  formatCurrency,
  formatDate
} from "@/lib/api-utils";
import {
  CreditCard,
  TrendingUp,
  Download,
  Plus,
  Wallet,
  ArrowUpRight,
  AlertCircle,
  BarChart3,
  FileText,
  ShieldCheck,
  Globe
} from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";

interface FinanceData {
  totalBalance: number;
  pendingPayouts: number;
  estTaxLiability: number;
  monthlyBudget: number;
  currentMonthSpending: number;
  spendingHistory: { month: string; amount: number }[];
  recentInvoices: {
    id: string;
    orderNumber?: string;
    amount: number;
    currency?: string;
    status: string;
    orderStatus?: string;
    orderType?: string;
    product: string;
    category?: string;
    hsCode?: string;
    seller: string;
    sellerCountry?: string;
    incoterms?: string;
    date: string;
  }[];
}

function downloadAsFile(html: string, filename: string) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}

function buildCustomsTaxHTML(data: FinanceData): string {
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const rows = (data.recentInvoices || []).map(inv => {
    const dutyVal = inv.amount * 0.1;
    return `
    <tr>
      <td style="padding: 12px 16px; border-bottom: 1px solid #F0ECE0; font-family: monospace; font-weight: bold;">#${inv.orderNumber || inv.id.slice(0, 8)}</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #F0ECE0;">
        <div style="font-weight: 600;">${inv.seller}</div>
        <div style="font-size: 11px; color: #6B6A66;">Origin: ${inv.sellerCountry || 'India'}</div>
      </td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #F0ECE0;">
        <div>${inv.product}</div>
        <div style="font-size: 11px; color: #7A560A; font-family: monospace;">HS: ${inv.hsCode || '—'}</div>
      </td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #F0ECE0; font-size: 12px;">${inv.incoterms || 'FOB / CIF'}</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #F0ECE0; text-align: right; font-weight: bold;">$${inv.amount.toLocaleString()}</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #F0ECE0; text-align: right; font-weight: bold; color: #7A560A;">$${dutyVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
    </tr>
  `;
  }).join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Ranote Exim - Customs & Duty Assessment Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #15130D; margin: 40px; background: #fff; line-height: 1.4; }
    .header { border-bottom: 3px solid #C4912A; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
    h1 { margin: 0; color: #15130D; font-size: 24px; text-transform: uppercase; font-weight: 800; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    th { text-align: left; padding: 12px 16px; background: #FFFBF2; font-size: 11px; text-transform: uppercase; letter-spacing: 0.14em; color: #6B6A66; border-bottom: 2px solid #F0ECE0; }
    .summary { margin-top: 30px; padding: 24px; background: #FFFBF2; border-radius: 16px; border: 1px solid #F0ECE0; display: flex; justify-content: space-between; align-items: center; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; background: #E2F5EE; color: #0B7A57; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <span class="badge">B2B Import Customs & Duty Assessment</span>
      <h1 style="margin-top: 8px;">Ranote Exim · Import Tariff Report</h1>
      <p style="margin: 4px 0 0; color: #6B6A66; font-size: 12px;">Tariff reserves, customs classifications, and import disbursements · ${dateStr}</p>
    </div>
    <div style="text-align: right; font-size: 12px; color: #6B6A66;">
      <div>Platform License: <strong>RANOTE-EXIM-GLOBAL</strong></div>
      <div>Standard Tariff Assessment: <strong>~10% Harmonized Duty</strong></div>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>PO / Order #</th>
        <th>Exporter / Supplier</th>
        <th>Commodity & HS Code</th>
        <th>Incoterms</th>
        <th style="text-align: right;">CIF Invoice Value</th>
        <th style="text-align: right;">Est. Tariff / Duty (10%)</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="summary">
    <div>
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.14em; color: #6B6A66; font-weight: bold;">Total Assessed Procurement</div>
      <div style="font-size: 24px; font-weight: 800; color: #15130D; margin-top: 2px;">$${(data.totalBalance || 0).toLocaleString()}</div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.14em; color: #6B6A66; font-weight: bold;">Estimated Duty Liability Reserve</div>
      <div style="font-size: 28px; font-weight: 800; color: #7A560A; margin-top: 2px;">$${(data.estTaxLiability || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
    </div>
  </div>
</body>
</html>`;
}

export default function ImporterFinancePage() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [newBudget, setNewBudget] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await authFetch<FinanceData>("/api/dashboard/finance");
      setData(res);
      setNewBudget((res.monthlyBudget || 0).toString());
    } catch {
      toast.error("Failed to load financial data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateBudget = async () => {
    const amount = parseFloat(newBudget);
    if (isNaN(amount)) return toast.error("Invalid amount");

    try {
      await authFetch("/api/dashboard/finance", {
        method: "PUT",
        body: JSON.stringify({ monthlyBudget: amount }),
      });
      toast.success("Procurement budget updated successfully");
      setIsBudgetModalOpen(false);
      fetchData();
    } catch {
      toast.error("Failed to update procurement budget");
    }
  };

  const budgetProgress = data?.monthlyBudget ? (data.currentMonthSpending / data.monthlyBudget) * 100 : 0;
  const isOverBudget = budgetProgress > 100;

  const handleDownloadTaxReport = () => {
    if (!data) return;
    const html = buildCustomsTaxHTML(data);
    downloadAsFile(html, `Customs_Tax_Report_${new Date().toISOString().slice(0, 10)}.html`);
    toast.success("Tax & Duty Assessment report downloaded");
  };

  return (
    <div className="space-y-6 w-full">
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#F0ECE0]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] bg-[#FBF1D6] text-[#7A560A]">
              Procurement Treasury
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66]">
              Trade Allocation & Duties
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#15130D]">
            Procurement Finance
          </h1>
          <p className="text-sm text-[#6B6A66] mt-0.5">
            Procurement allocations, verified supplier disbursements, and customs liability reserves
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadTaxReport}
            className="btn-cream-secondary"
          >
            <FileText className="w-4 h-4 stroke-[1.8]" />
            Tax & Duty Report
          </button>
        </div>
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Total Spent */}
        <div className="rounded-[24px] border border-[#F0ECE0] bg-gradient-to-b from-white to-[#FFFBF0] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-[14px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center">
              <Wallet className="w-5 h-5 stroke-[1.8]" />
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] bg-[#E2F5EE] text-[#0B7A57]">
              LIVE
            </span>
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66] mb-1">
            PROCUREMENT OUTLAY
          </p>
          <div className="text-[34px] md:text-[40px] font-extrabold leading-none text-[#15130D]">
            {loading ? "..." : formatCurrency(data?.totalBalance ?? 0)}
          </div>
          <p className="text-xs text-[#0B7A57] mt-3 font-semibold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 stroke-[2]" />
            Settled Trade Capital
          </p>
        </div>

        {/* Pending Payments */}
        <div className="rounded-[24px] border border-[#F0ECE0] bg-gradient-to-b from-white to-[#FFFBF0] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-[14px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 stroke-[1.8]" />
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] bg-[#FBF1D6] text-[#7A560A]">
              PENDING
            </span>
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66] mb-1">
            PENDING ESCROW / CLEARANCE
          </p>
          <div className="text-[34px] md:text-[40px] font-extrabold leading-none text-[#15130D]">
            {loading ? "..." : formatCurrency(data?.pendingPayouts ?? 0)}
          </div>
          <p className="text-xs text-[#6B6A66] mt-3">
            In-transit awaiting port clearance
          </p>
        </div>

        {/* Tax Estimate */}
        <div className="rounded-[24px] border border-[#F0ECE0] bg-gradient-to-b from-white to-[#FFFBF0] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-[14px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center">
              <AlertCircle className="w-5 h-5 stroke-[1.8]" />
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] bg-[#F7F5F0] text-[#6B6A66]">
              ESTIMATE
            </span>
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66] mb-1">
            DUTIES & TARIFFS RESERVE
          </p>
          <div className="text-[34px] md:text-[40px] font-extrabold leading-none text-[#15130D]">
            {loading ? "..." : formatCurrency(data?.estTaxLiability ?? 0)}
          </div>
          <p className="text-xs text-[#6B6A66] mt-3">
            Customs duty estimated ~10% CIF
          </p>
        </div>

        {/* Monthly Budget */}
        <div className="rounded-[24px] border border-[#F0ECE0] bg-gradient-to-b from-white to-[#FFFBF0] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-[14px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center">
                <CreditCard className="w-5 h-5 stroke-[1.8]" />
              </div>
              <button
                onClick={() => setIsBudgetModalOpen(true)}
                className="w-8 h-8 rounded-full bg-[#FBF1D6] text-[#7A560A] hover:bg-[#C4912A] hover:text-white flex items-center justify-center transition-colors"
                title="Edit Procurement Allocation"
              >
                <Plus className="w-4 h-4 stroke-[2]" />
              </button>
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66] mb-1">
              MONTHLY ALLOCATION
            </p>
            <div className="text-[34px] md:text-[40px] font-extrabold leading-none text-[#15130D]">
              {loading ? "..." : formatCurrency(data?.monthlyBudget ?? 0)}
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-1">
              <span className="text-[#6B6A66]">Allocation Used</span>
              <span className={isOverBudget ? "text-red-500" : "text-[#7A560A]"}>
                {budgetProgress.toFixed(1)}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-[#F0ECE0] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isOverBudget ? "bg-red-500" : "bg-gradient-to-r from-[#C4912A] to-[#EBC964]"
                }`}
                style={{ width: `${Math.min(budgetProgress, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Charts & Invoices Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Spending History Chart */}
        <section className="lg:col-span-8 rounded-[24px] border border-[#F0ECE0] bg-gradient-to-b from-white to-[#FFFBF0] p-6 md:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xs md:text-sm font-extrabold tracking-wider uppercase text-[#15130D] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#C4912A] stroke-[1.8]" />
                PROCUREMENT HISTORY
              </h3>
              <p className="text-xs text-[#6B6A66] mt-0.5">Monthly procurement capital deployed over last 6 cycles</p>
            </div>
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#6B6A66]">
              {loading ? "..." : data?.spendingHistory?.length ? `${data.spendingHistory[0].month} - ${data.spendingHistory[data.spendingHistory.length - 1].month}` : ''}
            </div>
          </div>

          <div className="flex items-end justify-between gap-4 h-60 px-2 pb-2">
            {data?.spendingHistory.map((sh, i) => {
              const maxAmt = Math.max(...data.spendingHistory.map(h => h.amount), 1);
              const height = Math.max((sh.amount / maxAmt) * 100, 6);
              const isLast = i === (data.spendingHistory.length - 1);
              return (
                <div key={sh.month} className="flex-1 flex flex-col items-center gap-2 group/bar relative h-full justify-end">
                  <div className="w-full relative h-[calc(100%-24px)] flex items-end">
                    <div
                      className={`w-full rounded-t-xl transition-all duration-500 ${
                        isLast
                          ? "bg-gradient-to-t from-[#C4912A] to-[#EBC964]"
                          : "bg-[#FBF1D6] hover:bg-[#f3e5be]"
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#6B6A66]">
                    {sh.month}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Recent Invoices */}
        <section className="lg:col-span-4 rounded-[24px] border border-[#F0ECE0] bg-gradient-to-b from-white to-[#FFFBF0] p-6 md:p-8 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs md:text-sm font-extrabold tracking-wider uppercase text-[#15130D]">
              TRADE INVOICES
            </h3>
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7A560A]">
              Verified B2B
            </span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[320px] custom-scrollbar pr-1">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-14 bg-[#F4F4F7] rounded-xl animate-pulse" />
              ))
            ) : !data?.recentInvoices?.length ? (
              <div className="text-center py-12 text-xs text-[#6B6A66]">
                No trade invoices recorded yet.
              </div>
            ) : (
              data.recentInvoices.map((inv) => (
                <div key={inv.id} className="p-3.5 bg-white border border-[#F0ECE0] rounded-[18px] transition-colors flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-[12px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center shrink-0">
                      <CreditCard className="w-4 h-4 stroke-[1.8]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#15130D] truncate">
                          #{inv.orderNumber || inv.id.slice(0, 8)}
                        </span>
                        <span className="text-[9px] font-extrabold bg-[#F4F4F7] text-[#7A560A] px-1.5 py-0.2 rounded">
                          {inv.orderType || "B2B"}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#6B6A66] truncate mt-0.5">
                        {inv.seller} · {inv.sellerCountry || "India"} · {inv.product}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-extrabold text-[#15130D]">
                      {formatCurrency(inv.amount)}
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#0B7A57]">
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* ─── Modal for Setting Budget ─── */}
      <Modal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        title="Update Monthly Procurement Allocation"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#6B6A66]">
            Set your target wholesale procurement allocation for the month. We will notify you when total purchase order commitments approach 90%.
          </p>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66] block mb-1">
              Monthly Procurement Budget (USD)
            </label>
            <input
              type="number"
              value={newBudget}
              onChange={(e) => setNewBudget(e.target.value)}
              className="w-full h-11 px-4 bg-[#F4F4F7] border border-[#F0ECE0] rounded-xl text-sm text-[#15130D] focus:outline-none focus:border-[#C4912A]"
              placeholder="e.g. 50000"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setIsBudgetModalOpen(false)}
              className="btn-cream-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateBudget}
              className="btn-gold-primary"
            >
              Update Allocation
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
