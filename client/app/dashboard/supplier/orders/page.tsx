"use client";

import React, { useState } from "react";
import { 
  FolderTree, 
  Search, 
  Package, 
  ArrowRight,
  Handshake,
  Download,
} from "lucide-react";
import { formatCurrency } from "@/lib/api-utils";

interface SupplyOrder {
  id: string;
  orderNumber: string;
  productName: string;
  exporterName: string;
  quantity: number;
  totalValue: number;
  status: "PROCESSED" | "SHIPPED" | "DELIVERED" | "PENDING";
  date: string;
}

export default function SupplierOrdersPage() {
  const [search, setSearch] = useState("");
  
  const [orders] = useState<SupplyOrder[]>([
    { id: "1", orderNumber: "SO-98211", productName: "Premium Raw Silicon", exporterName: "Tech-Ex General", quantity: 2000, totalValue: 45000, status: "SHIPPED", date: "2024-03-18" },
    { id: "2", orderNumber: "SO-98105", productName: "Industrial Grade Copper", exporterName: "Global Trade Corp", quantity: 5000, totalValue: 68500, status: "DELIVERED", date: "2024-02-25" },
    { id: "3", orderNumber: "SO-98442", productName: "Grade-A Textile Fiber", exporterName: "SilkWay Exporters", quantity: 3000, totalValue: 15000, status: "PENDING", date: "2024-03-22" },
  ]);

  const filtered = orders.filter(o => 
    o.orderNumber.toLowerCase().includes(search.toLowerCase()) || 
    o.productName.toLowerCase().includes(search.toLowerCase()) ||
    o.exporterName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 w-full">
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#F0ECE0]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] bg-[#FBF1D6] text-[#7A560A]">
              Supplier Ledger
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66]">
              Distribution Node
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#15130D]">
            Supply Orders
          </h1>
          <p className="text-sm text-[#6B6A66] mt-0.5">
            Track wholesale supply fulfillment and dispatch sequences to partner exporters.
          </p>
        </div>

        <button className="btn-cream-secondary">
          <Download className="w-4 h-4 stroke-[1.8]" />
          Manifest Report
        </button>
      </div>

      {/* ─── Search Bar ─── */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6A66] stroke-[1.8]" />
        <input
          type="text"
          placeholder="Filter supply logs by order #, product, or exporter..."
          className="w-full h-11 bg-[#F4F4F7] border border-[#F0ECE0] rounded-full pl-11 pr-4 text-sm text-[#15130D] placeholder:text-[#6B6A66] focus:outline-none focus:border-[#C4912A] transition-colors"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ─── Orders List ─── */}
      <div className="space-y-3">
        {filtered.map((order) => (
          <div
            key={order.id}
            className="rounded-[24px] border border-[#F0ECE0] bg-gradient-to-b from-white to-[#FFFBF0] p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Order Info */}
              <div className="flex items-center gap-4 lg:w-[25%] shrink-0">
                <div className="w-12 h-12 rounded-[16px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center shrink-0">
                  <Package className="w-6 h-6 stroke-[1.8]" />
                </div>
                <div>
                  <h3 className="font-extrabold uppercase text-sm text-[#15130D]">
                    {order.orderNumber}
                  </h3>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66]">
                    {order.date}
                  </p>
                </div>
              </div>

              {/* Product & Exporter */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66]">
                    Product Specification
                  </p>
                  <p className="font-bold text-sm text-[#15130D] mt-0.5">
                    {order.productName}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66]">
                    Destination Exporter
                  </p>
                  <p className="font-bold text-sm text-[#15130D] mt-0.5 flex items-center gap-1.5">
                    <Handshake className="w-4 h-4 text-[#C4912A] stroke-[1.8]" />
                    {order.exporterName}
                  </p>
                </div>
              </div>

              {/* Qty & Value */}
              <div className="flex items-center gap-8 lg:w-[20%] shrink-0">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66]">
                    Qty
                  </p>
                  <p className="text-base font-extrabold text-[#15130D] mt-0.5">
                    {order.quantity.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66]">
                    Value
                  </p>
                  <p className="text-base font-extrabold text-[#0B7A57] mt-0.5">
                    {formatCurrency(order.totalValue)}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between lg:w-[15%] lg:justify-end gap-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] ${
                  order.status === "DELIVERED" ? "bg-[#E2F5EE] text-[#0B7A57]" :
                  order.status === "SHIPPED" ? "bg-[#FBF1D6] text-[#7A560A]" :
                  order.status === "PENDING" ? "bg-[#FFFBF0] border border-[#F0ECE0] text-[#6B6A66]" :
                  "bg-[#F7F5F0] text-[#15130D]"
                }`}>
                  {order.status}
                </span>
                <button className="w-10 h-10 rounded-full border border-[#F0ECE0] bg-white hover:bg-[#FBF1D6] text-[#15130D] flex items-center justify-center transition-colors">
                  <ArrowRight className="w-4 h-4 stroke-[2]" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
