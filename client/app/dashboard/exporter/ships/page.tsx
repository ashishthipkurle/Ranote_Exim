"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Ship, Plus, Trash2, Anchor, Wind, Truck, Loader2, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type TransportMethod = {
  id: string;
  name: string;
  type: "OCEAN" | "AIR" | "LAND";
  capacity?: string;
  trackingUrl?: string;
  originRegion?: string;
  destinationRegion?: string;
  _count: { shipments: number };
};

export default function ShipsPage() {
  const [methods, setMethods] = useState<TransportMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'GLOBAL' | 'DOMESTIC'>('GLOBAL');

  // New form state
  const [name, setName] = useState("");
  const [type, setType] = useState<"OCEAN" | "AIR" | "LAND">("OCEAN");
  const [capacity, setCapacity] = useState("");
  const [originRegion, setOriginRegion] = useState("");
  const [destinationRegion, setDestinationRegion] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [methodToDelete, setMethodToDelete] = useState<TransportMethod | null>(null);

  const fetchMethods = async () => {
    try {
      const res = await axios.get("/api/transport-methods", { withCredentials: true });
      setMethods(res.data.transportMethods || []);
    } catch (err) {
      toast.error("Failed to load ships and delivery methods.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Name is required");

    setSubmitting(true);
    try {
      await axios.post(
        "/api/transport-methods",
        { name, type, capacity, trackingUrl, originRegion, destinationRegion },
        { withCredentials: true }
      );
      toast.success("Added successfully");
      setIsAdding(false);
      setName("");
      setCapacity("");
      setOriginRegion("");
      setDestinationRegion("");
      setTrackingUrl("");
      fetchMethods();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to add method");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!methodToDelete) return;
    setSubmitting(true);
    try {
      await axios.delete(`/api/transport-methods/${methodToDelete.id}`, { withCredentials: true });
      toast.success("Deleted successfully");
      fetchMethods();
      setMethodToDelete(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header: Title + Subtitle + Action Button ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#15130D] uppercase">
            Logistics & Fleet
          </h1>
          <p className="text-sm text-[#6B6A66] mt-1">
            Manage your global ships, airlines, and local delivery partners.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="h-11 px-6 rounded-full bg-gradient-to-r from-[#C4912A] to-[#EBC964] text-[#15130D] font-bold text-xs uppercase tracking-wider shadow-[0_4px_14px_rgba(196,145,42,0.25)] hover:shadow-[0_6px_20px_rgba(196,145,42,0.35)] transition-all flex items-center gap-2 active:scale-95"
        >
          {isAdding ? (
            <>
              <X className="w-4 h-4" /> Cancel
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" /> Add Transport Method
            </>
          )}
        </button>
      </div>

      {/* Add New Transport Method Form */}
      {isAdding && (
        <form
          onSubmit={handleAdd}
          className="bg-gradient-to-b from-white to-[#FFFBF0] border border-[#F0ECE0] p-6 rounded-[24px] shadow-sm space-y-4"
        >
          <h2 className="text-sm font-extrabold text-[#15130D] uppercase tracking-wider">
            Register Transport Line
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66]">
                Name / Vessel *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maersk Alpha, DHL Express"
                className="w-full mt-1 px-4 py-2.5 bg-[#F7F5F0] border border-[#ECE7DA] rounded-full text-xs font-semibold text-[#15130D] outline-none focus:border-[#C4912A]"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66]">
                Type *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full mt-1 px-4 py-2.5 bg-[#F7F5F0] border border-[#ECE7DA] rounded-full text-xs font-semibold text-[#15130D] outline-none focus:border-[#C4912A]"
              >
                <option value="OCEAN">Ocean (Ship)</option>
                <option value="AIR">Air (Plane)</option>
                <option value="LAND">Land / Local Courier (e.g. eKart)</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66]">
                Capacity / Details
              </label>
              <input
                type="text"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="e.g. 5000 TEU, Boeing 747"
                className="w-full mt-1 px-4 py-2.5 bg-[#F7F5F0] border border-[#ECE7DA] rounded-full text-xs font-semibold text-[#15130D] outline-none focus:border-[#C4912A]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66]">
                  Origin
                </label>
                <input
                  type="text"
                  value={originRegion}
                  onChange={(e) => setOriginRegion(e.target.value)}
                  placeholder="e.g. India, Mumbai"
                  className="w-full mt-1 px-4 py-2.5 bg-[#F7F5F0] border border-[#ECE7DA] rounded-full text-xs font-semibold text-[#15130D] outline-none focus:border-[#C4912A]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66]">
                  Destination
                </label>
                <input
                  type="text"
                  value={destinationRegion}
                  onChange={(e) => setDestinationRegion(e.target.value)}
                  placeholder="e.g. USA, New York"
                  className="w-full mt-1 px-4 py-2.5 bg-[#F7F5F0] border border-[#ECE7DA] rounded-full text-xs font-semibold text-[#15130D] outline-none focus:border-[#C4912A]"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66]">
                Tracking API URL (Optional)
              </label>
              <input
                type="text"
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                placeholder="https://api.dhl.com/track"
                className="w-full mt-1 px-4 py-2.5 bg-[#F7F5F0] border border-[#ECE7DA] rounded-full text-xs font-semibold text-[#15130D] outline-none focus:border-[#C4912A]"
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="h-10 px-6 rounded-full bg-gradient-to-r from-[#C4912A] to-[#EBC964] text-[#15130D] font-bold text-xs uppercase tracking-wider flex items-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Save Method
            </button>
          </div>
        </form>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#F0ECE0] pb-2">
        <button
          onClick={() => setActiveTab('GLOBAL')}
          className={cn(
            "h-10 px-5 rounded-full text-xs font-bold uppercase tracking-wider transition-all",
            activeTab === 'GLOBAL'
              ? "bg-[#FBF1D6] text-[#7A560A] shadow-sm border border-[#C4912A]/30"
              : "text-[#6B6A66] hover:bg-[#F7F5F0]"
          )}
        >
          Overseas / Global Shipping
        </button>
        <button
          onClick={() => setActiveTab('DOMESTIC')}
          className={cn(
            "h-10 px-5 rounded-full text-xs font-bold uppercase tracking-wider transition-all",
            activeTab === 'DOMESTIC'
              ? "bg-[#FBF1D6] text-[#7A560A] shadow-sm border border-[#C4912A]/30"
              : "text-[#6B6A66] hover:bg-[#F7F5F0]"
          )}
        >
          Domestic Delivery Partners
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#C4912A]" />
        </div>
      ) : methods.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-b from-white to-[#FFFBF0] border border-[#F0ECE0] rounded-[24px]">
          <div className="size-16 rounded-[20px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center mx-auto mb-4">
            <Ship className="w-8 h-8" />
          </div>
          <p className="text-sm font-extrabold uppercase tracking-wider text-[#15130D]">
            No Logistics Partners Added
          </p>
          <p className="text-xs text-[#6B6A66] mt-1">
            Add your shipping routes to assign them to orders.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {methods
            .filter((m) => (activeTab === 'GLOBAL' ? m.type === 'OCEAN' || m.type === 'AIR' : m.type === 'LAND'))
            .map((method) => (
              <div
                key={method.id}
                className="bg-gradient-to-b from-white to-[#FFFBF0] border border-[#F0ECE0] rounded-[24px] p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="size-12 rounded-[16px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center">
                        {method.type === 'OCEAN' ? (
                          <Anchor className="w-5 h-5" />
                        ) : method.type === 'AIR' ? (
                          <Wind className="w-5 h-5" />
                        ) : (
                          <Truck className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-[#15130D]">{method.name}</h3>
                        <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#F7F5F0] text-[#6B6A66] border border-[#ECE7DA] mt-0.5">
                          {method.type}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setMethodToDelete(method)}
                      className="size-8 rounded-full bg-[#F7F5F0] hover:bg-[#FEE4E2] text-[#6B6A66] hover:text-[#B42318] flex items-center justify-center transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#6B6A66]">Active Shipments:</span>
                      <span className="font-extrabold text-[#15130D]">
                        {method._count?.shipments || 0}
                      </span>
                    </div>
                    {(method.originRegion || method.destinationRegion) && (
                      <div className="flex justify-between">
                        <span className="text-[#6B6A66]">Route:</span>
                        <span className="font-semibold text-[#15130D]">
                          {method.originRegion || "Any"} → {method.destinationRegion || "Any"}
                        </span>
                      </div>
                    )}
                    {method.capacity && (
                      <div className="flex justify-between">
                        <span className="text-[#6B6A66]">Capacity:</span>
                        <span className="font-semibold text-[#15130D]">{method.capacity}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#F0ECE0] flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#0B7A57]">
                    <span className="size-1.5 rounded-full bg-[#0B7A57]" /> Verified Route
                  </span>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {methodToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[24px] border border-[#F0ECE0] p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="font-extrabold text-base text-[#15130D]">Delete Transport Method</h3>
            <p className="text-xs text-[#6B6A66]">
              Are you sure you want to delete <span className="font-bold text-[#15130D]">{methodToDelete.name}</span>?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setMethodToDelete(null)}
                className="h-10 px-4 rounded-full bg-[#F7F5F0] hover:bg-[#ECE7DA] text-[#6B6A66] font-semibold text-xs uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={submitting}
                className="h-10 px-4 rounded-full bg-[#FEE4E2] hover:bg-[#FCD4D0] text-[#B42318] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
