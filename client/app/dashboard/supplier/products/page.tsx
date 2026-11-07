"use client";

import React, { useState } from "react";
import { 
  Boxes, 
  Plus, 
  Search, 
  Package, 
  ArrowRight,
  Handshake
} from "lucide-react";

interface SupplyProduct {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  status: "ACTIVE" | "PENDING" | "FULFILLED";
  lastSupplyDate: string;
  exporterName: string;
}

export default function SupplierProductsPage() {
  const [search, setSearch] = useState("");
  
  const [products] = useState<SupplyProduct[]>([
    { id: "1", name: "Premium Raw Silicon", category: "Raw Materials", quantity: 5000, unit: "kg", status: "ACTIVE", lastSupplyDate: "2024-03-15", exporterName: "Tech-Ex General" },
    { id: "2", name: "Industrial Grade Copper", category: "Raw Materials", quantity: 12000, unit: "kg", status: "FULFILLED", lastSupplyDate: "2024-02-10", exporterName: "Global Trade Corp" },
    { id: "3", name: "Grade-A Textile Fiber", category: "Textiles", quantity: 8000, unit: "meters", status: "PENDING", lastSupplyDate: "2024-03-20", exporterName: "SilkWay Exporters" },
  ]);

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 w-full">
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#F0ECE0]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] bg-[#FBF1D6] text-[#7A560A]">
              Distribution Catalog
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66]">
              Supply Inventory
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#15130D]">
            Supply Items
          </h1>
          <p className="text-sm text-[#6B6A66] mt-0.5">
            Manage your raw material stock, inventory batches, and committed supply quotas
          </p>
        </div>

        <button className="btn-gold-primary">
          <Plus className="w-4 h-4 stroke-[2]" />
          Register Supply Item
        </button>
      </div>

      {/* ─── Search ─── */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6A66] stroke-[1.8]" />
        <input
          type="text"
          placeholder="Search supply items by name, category..."
          className="w-full h-11 bg-[#F4F4F7] border border-[#F0ECE0] rounded-full pl-11 pr-4 text-sm text-[#15130D] placeholder:text-[#6B6A66] focus:outline-none focus:border-[#C4912A] transition-colors"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ─── Grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((product) => (
          <div
            key={product.id}
            className="rounded-[24px] border border-[#F0ECE0] bg-gradient-to-b from-white to-[#FFFBF0] p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-[16px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center">
                  <Package className="w-6 h-6 stroke-[1.8]" />
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] ${
                  product.status === "ACTIVE" ? "bg-[#E2F5EE] text-[#0B7A57]" :
                  product.status === "FULFILLED" ? "bg-[#FBF1D6] text-[#7A560A]" :
                  "bg-[#F7F5F0] text-[#6B6A66]"
                }`}>
                  {product.status}
                </span>
              </div>

              <h3 className="text-base font-extrabold text-[#15130D] mb-1">
                {product.name}
              </h3>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66] mb-3">
                {product.category}
              </p>

              <div className="p-3 bg-white border border-[#F0ECE0] rounded-[16px] mb-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B6A66]">
                  Available Stock
                </p>
                <p className="text-lg font-extrabold text-[#15130D] mt-0.5">
                  {product.quantity.toLocaleString()} {product.unit}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#F0ECE0] flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B6A66]">Contracted Exporter</p>
                <p className="text-xs font-bold text-[#15130D] flex items-center gap-1 mt-0.5">
                  <Handshake className="w-3.5 h-3.5 text-[#C4912A]" />
                  {product.exporterName}
                </p>
              </div>
              <button className="w-9 h-9 rounded-full border border-[#F0ECE0] bg-white hover:bg-[#FBF1D6] text-[#15130D] flex items-center justify-center transition-colors">
                <ArrowRight className="w-4 h-4 stroke-[2]" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
