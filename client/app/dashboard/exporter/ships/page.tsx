"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Ship, Plus, Trash2, Anchor, Wind, Truck, Loader2, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type TransportMethod = {
  id: string;
  name: string;
  type: "OCEAN" | "AIR" | "LAND";
  capacity?: string;
  trackingUrl?: string;
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
      await axios.post("/api/transport-methods", { name, type, capacity, trackingUrl, originRegion, destinationRegion }, { withCredentials: true });
      toast.success("Added successfully");
      setIsAdding(false);
      setName("");
      setCapacity("");
      setOriginRegion("");
      setDestinationRegion("");
      setTrackingUrl("");
      fetchMethods();
    } catch (err: any) {
      if (!err.response) {
        toast.error("Network error: Please check your internet connection.");
      } else {
        toast.error(err.response?.data?.error || "Failed to add method");
      }
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
      if (!err.response) {
        toast.error("Network error: Please check your internet connection.");
      } else {
        toast.error(err.response?.data?.error || "Failed to delete");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto relative">
      <div className="w-full px-8 pb-12 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Logistics & Fleet</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage your global ships, airlines, and local delivery partners.
            </p>
          </div>
          <Button
            onClick={() => setIsAdding(!isAdding)}
            className="bg-primary text-primary-foreground font-semibold"
          >
            {isAdding ? "Cancel" : <><Plus className="w-4 h-4 mr-2" /> Add New</>}
          </Button>
        </div>

        {isAdding && (
          <form onSubmit={handleAdd} className="bg-card border border-border p-6 rounded-xl space-y-4">
            <h2 className="font-semibold text-sm">Add New Transport Method</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase">Name / Vessel *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Maersk Alpha, DHL Express"
                  className="w-full mt-1 px-4 py-2 bg-muted/30 border border-border rounded-lg text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase">Type *</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as any)}
                  className="w-full mt-1 px-4 py-2 bg-muted/30 border border-border rounded-lg text-sm"
                >
                  <option value="OCEAN">Ocean (Ship)</option>
                  <option value="AIR">Air (Plane)</option>
                  <option value="LAND">Land / Local Courier (e.g. eKart)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase">Capacity / Details</label>
                <input
                  type="text"
                  value={capacity}
                  onChange={e => setCapacity(e.target.value)}
                  placeholder="e.g. 5000 TEU, Boeing 747"
                  className="w-full mt-1 px-4 py-2 bg-muted/30 border border-border rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase">Origin (From)</label>
                  <input
                    type="text"
                    value={originRegion}
                    onChange={e => setOriginRegion(e.target.value)}
                    placeholder="e.g. India, Mumbai"
                    className="w-full mt-1 px-4 py-2 bg-muted/30 border border-border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase">Destination (To)</label>
                  <input
                    type="text"
                    value={destinationRegion}
                    onChange={e => setDestinationRegion(e.target.value)}
                    placeholder="e.g. USA, New York"
                    className="w-full mt-1 px-4 py-2 bg-muted/30 border border-border rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase">Tracking API URL (Optional)</label>
                <input
                  type="text"
                  value={trackingUrl}
                  onChange={e => setTrackingUrl(e.target.value)}
                  placeholder="e.g. https://api.dhl.com/track"
                  className="w-full mt-1 px-4 py-2 bg-muted/30 border border-border rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={submitting} className="bg-primary text-black">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />} Save Method
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
        ) : methods.length === 0 ? (
          <div className="text-center py-20 bg-card border border-border rounded-xl">
            <Ship className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-semibold">No Logistics Partners Added</p>
            <p className="text-sm text-muted-foreground">Add your delivery methods to assign them to orders.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tabs Navigation */}
            <div className="flex items-center gap-4 border-b border-border">
              <button
                onClick={() => setActiveTab('GLOBAL')}
                className={`pb-3 px-2 text-sm font-semibold transition-colors border-b-2 ${
                  activeTab === 'GLOBAL' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Overseas / Global Shipping
              </button>
              <button
                onClick={() => setActiveTab('DOMESTIC')}
                className={`pb-3 px-2 text-sm font-semibold transition-colors border-b-2 ${
                  activeTab === 'DOMESTIC' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                In-Country Delivery Partners
              </button>
            </div>

            {/* Global Transport Section */}
            {activeTab === 'GLOBAL' && (
              <div className="animate-in fade-in duration-300">
                {methods.filter(m => m.type === 'OCEAN' || m.type === 'AIR').length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {methods.filter(m => m.type === 'OCEAN' || m.type === 'AIR').map(method => (
                      <div key={method.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all flex flex-col">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                              {method.type === 'OCEAN' ? <Anchor className="w-5 h-5" /> : <Wind className="w-5 h-5" />}
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground text-sm">{method.name}</h3>
                              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{method.type}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setMethodToDelete(method)}
                            className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete Method"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="space-y-3 flex-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Active Shipments:</span>
                            <span className="font-semibold text-foreground">{method._count?.shipments || 0}</span>
                          </div>
                          {(method.originRegion || method.destinationRegion) && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Route:</span>
                              <span className="font-medium text-foreground text-right">
                                {method.originRegion || "Anywhere"} → {method.destinationRegion || "Anywhere"}
                              </span>
                            </div>
                          )}
                          {method.capacity && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Details:</span>
                              <span className="font-medium text-foreground text-right">{method.capacity}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-muted/20 border border-dashed border-border rounded-xl">
                    <p className="text-sm text-muted-foreground">No overseas transport methods added yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* Domestic Transport Section */}
            {activeTab === 'DOMESTIC' && (
              <div className="animate-in fade-in duration-300">
                {methods.filter(m => m.type === 'LAND').length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {methods.filter(m => m.type === 'LAND').map(method => (
                      <div key={method.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all flex flex-col">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                              <Truck className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground text-sm">{method.name}</h3>
                              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">LOCAL COURIER</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setMethodToDelete(method)}
                            className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete Method"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="space-y-3 flex-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Active Deliveries:</span>
                            <span className="font-semibold text-foreground">{method._count?.shipments || 0}</span>
                          </div>
                          {(method.originRegion || method.destinationRegion) && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Coverage:</span>
                              <span className="font-medium text-foreground text-right">
                                {method.originRegion || "Anywhere"} → {method.destinationRegion || "Anywhere"}
                              </span>
                            </div>
                          )}
                          {method.capacity && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Details:</span>
                              <span className="font-medium text-foreground text-right">{method.capacity}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-muted/20 border border-dashed border-border rounded-xl">
                    <p className="text-sm text-muted-foreground">No local delivery partners added yet. Select 'Land / Local Courier' when adding a new method.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {methodToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border shadow-2xl rounded-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-2">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <button onClick={() => setMethodToDelete(null)} className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <h3 className="text-xl font-bold text-foreground mb-2">Delete Transport Method?</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Are you sure you want to delete <strong>{methodToDelete.name}</strong>? This action cannot be undone.
              {methodToDelete._count?.shipments > 0 && (
                <span className="block mt-2 text-red-500 font-medium">
                  Warning: You currently have {methodToDelete._count.shipments} active shipment(s) on this method. You cannot delete it until they are delivered.
                </span>
              )}
            </p>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setMethodToDelete(null)}
                disabled={submitting}
                className="font-semibold"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                disabled={submitting || methodToDelete._count?.shipments > 0}
                className="bg-red-500 text-white hover:bg-red-600 font-semibold border-0"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Delete Method
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
