"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  Package, Search, Edit2, Trash2, Filter, 
  MoreHorizontal, Eye, Box, AlertCircle,
  CheckCircle2, PauseCircle, Loader2,
  ArrowLeft, ArrowRight, Building2, Layers
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { authFetch } from "@/lib/api-utils";
import { extractProductMeta } from "@/lib/categories";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  minOrderQty: number;
  originCountry: string;
  category: string;
  available: boolean;
  stockQty: number;
  images: string[];
  certifications?: string[];
};

export default function InventoryTable({
  products,
  availableCategories = []
}: {
  products: Product[],
  availableCategories?: string[]
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "ALL");

  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters();
  };

  const updateFilters = () => {
    const params = new URLSearchParams(searchParams);
    if (searchQuery) params.set("search", searchQuery);
    else params.delete("search");

    if (categoryFilter) params.set("category", categoryFilter);
    else params.delete("category");

    if (statusFilter && statusFilter !== "ALL") params.set("status", statusFilter);
    else params.delete("status");

    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  const deleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      setIsDeletingId(id);
      await authFetch(`/api/products/${id}`, { method: "DELETE" });
      toast.success("Product removed from inventory");
      startTransition(() => router.refresh());
    } catch (e: any) {
      toast.error(e.message || "Failed to delete product");
    } finally {
      setIsDeletingId(null);
    }
  };

  const inputClass = "pl-11 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm w-full";

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-950 p-4 border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm">
        <form onSubmit={handleSearch} className="relative w-full lg:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by part, company, or sub-category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={inputClass}
          />
        </form>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setTimeout(updateFilters, 0);
            }}
            className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-sm outline-none cursor-pointer hover:bg-slate-50 transition-colors w-full lg:w-auto"
          >
            <option value="">All Categories</option>
            {availableCategories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setTimeout(updateFilters, 0);
            }}
            className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-sm outline-none cursor-pointer hover:bg-slate-50 transition-colors w-full lg:w-auto"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Halted</option>
          </select>

          {(searchQuery || categoryFilter || statusFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setCategoryFilter("");
                setStatusFilter("ALL");
                startTransition(() => router.push("?"));
              }}
              className="text-xs font-semibold text-primary hover:underline px-2 whitespace-nowrap"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden relative">
        {isPending && (
          <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-[2px] z-20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Product Details & Brand</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">B2B Rate</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Stock</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                    No products found in inventory matching your criteria.
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const meta = extractProductMeta(product);
                  return (
                    <tr key={product.id} className={`group hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors ${isDeletingId === product.id ? "opacity-30 pointer-events-none" : ""}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden bg-slate-100 dark:bg-white/5 flex-shrink-0 flex items-center justify-center p-1">
                            {product.images?.[0] ? (
                              <img src={product.images[0]} alt="" className="max-w-full max-h-full object-contain drop-shadow-sm" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <Package className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 max-w-md">
                            <div className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
                              {product.name}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              {meta.company && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                                  <Building2 className="w-3 h-3 text-emerald-600" /> {meta.company}
                                </span>
                              )}
                              {meta.subCategory && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[10px] font-semibold border border-blue-200 dark:border-blue-800">
                                  <Layers className="w-3 h-3 text-blue-600" /> {meta.subCategory}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 uppercase tracking-wide">
                                Origin: {product.originCountry}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          {meta.categoryLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {product.price > 0 ? (
                          <>
                            <div className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(product.price)}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-tighter">Per {product.unit} (Ref)</div>
                          </>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 text-[10px] font-bold border border-amber-200 dark:border-amber-800">
                            Quote on Demand
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{product.stockQty}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-tighter">{product.unit}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          {product.available ? (
                            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Active
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                              <PauseCircle className="w-3.5 h-3.5" /> Halted
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/dashboard/exporter/inventory/${product.id}/edit`}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-primary"
                            title="Edit Details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => deleteProduct(product.id, product.name)}
                            disabled={isDeletingId === product.id}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors text-slate-400 hover:text-red-500"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
