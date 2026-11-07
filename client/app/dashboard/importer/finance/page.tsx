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
  FileText
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
    amount: number;
    status: string;
    product: string;
    seller: string;
    date: string;
  }[];
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
      setNewBudget(res.monthlyBudget.toString());
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
      toast.success("Budget updated");
      setIsBudgetModalOpen(false);
      fetchData();
    } catch {
      toast.error("Failed to update budget");
    }
  };

  const budgetProgress = data?.monthlyBudget ? (data.currentMonthSpending / data.monthlyBudget) * 100 : 0;
  const isOverBudget = budgetProgress > 100;

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
              Budget & Expenses
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#15130D]">
            Finance Overview
          </h1>
          <p className="text-sm text-[#6B6A66] mt-0.5">
            Budget tracking, verified disbursements, and payment receipts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => toast.success("Generating tax report...")}
            className="btn-cream-secondary"
          >
            <FileText className="w-4 h-4 stroke-[1.8]" />
            Tax Report
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
            TOTAL SPENT
          </p>
          <div className="text-[34px] md:text-[40px] font-extrabold leading-none text-[#15130D]">
            {loading ? "..." : formatCurrency(data?.totalBalance ?? 0)}
          </div>
          <p className="text-xs text-[#0B7A57] mt-3 font-semibold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 stroke-[2]" />
            Active Trade Capital
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
            PENDING PAYMENTS
          </p>
          <div className="text-[34px] md:text-[40px] font-extrabold leading-none text-[#15130D]">
            {loading ? "..." : formatCurrency(data?.pendingPayouts ?? 0)}
          </div>
          <p className="text-xs text-[#6B6A66] mt-3">
            Awaiting order clearance
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
            TAX ESTIMATE
          </p>
          <div className="text-[34px] md:text-[40px] font-extrabold leading-none text-[#15130D]">
            {loading ? "..." : formatCurrency(data?.estTaxLiability ?? 0)}
          </div>
          <p className="text-xs text-[#6B6A66] mt-3">
            Customs & duty estimated ~10%
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
                title="Edit Budget"
              >
                <Plus className="w-4 h-4 stroke-[2]" />
              </button>
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66] mb-1">
              MONTHLY BUDGET
            </p>
            <div className="text-[34px] md:text-[40px] font-extrabold leading-none text-[#15130D]">
              {loading ? "..." : formatCurrency(data?.monthlyBudget ?? 0)}
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-1">
              <span className="text-[#6B6A66]">Utilization</span>
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
                SPENDING HISTORY
              </h3>
              <p className="text-xs text-[#6B6A66] mt-0.5">Monthly procurement outlay over last 6 cycles</p>
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
              RECENT INVOICES
            </h3>
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7A560A]">
              Verified
            </span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[320px] custom-scrollbar pr-1">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-14 bg-[#F4F4F7] rounded-xl animate-pulse" />
              ))
            ) : !data?.recentInvoices?.length ? (
              <div className="text-center py-12 text-xs text-[#6B6A66]">
                No invoices recorded yet.
              </div>
            ) : (
              data.recentInvoices.map((inv) => (
                <div key={inv.id} className="p-3.5 bg-white border border-[#F0ECE0] rounded-[18px] transition-colors flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-[12px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center shrink-0">
                      <CreditCard className="w-4 h-4 stroke-[1.8]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#15130D] truncate">
                        {inv.id}
                      </div>
                      <div className="text-[10px] text-[#6B6A66] truncate mt-0.5">
                        {inv.seller}
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
        title="Update Monthly Procurement Budget"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#6B6A66]">
            Set your target maximum procurement limit for the month. We will notify you when total checkout commitments approach 90%.
          </p>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66] block mb-1">
              Monthly Budget (USD)
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
              Update Budget
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
