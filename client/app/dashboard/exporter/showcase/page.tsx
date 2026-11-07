"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { ProductCategory } from "@prisma/client";
import {
  Plus, Trash2, LayoutTemplate, Star, MonitorSmartphone, PackageSearch,
  Activity, ChevronUp, ChevronDown, Search, X, Eye, EyeOff, Pencil,
  Check, GripVertical, Sparkles, Hash, Loader2
} from "lucide-react";
import { toast } from "sonner";

interface ShowcaseItem {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  category: ProductCategory;
  desc: string;
  image: string;
  orderIndex: number;
  isActive: boolean;
}

export default function AdminShowcasePage() {
  const [items, setItems] = useState<ShowcaseItem[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ subtitle: "", tag: "", desc: "" });
  const [deleteModalItem, setDeleteModalItem] = useState<ShowcaseItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/exporter/showcase");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      } else {
        toast.error("Failed to load showcase items.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products?limit=100&exporterId=me");
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        }
      } catch (err) {
        console.error("Failed to fetch products for showcase", err);
      }
    };
    fetchProducts();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedProduct = products.find(p => p.id === selectedProductId);

  const filteredProducts = useMemo(() => {
    const availableProducts = products.filter(
      p => !items.some(item => item.title.toLowerCase() === p.name?.toLowerCase())
    );

    if (!searchQuery.trim()) return availableProducts;
    
    const q = searchQuery.toLowerCase();
    return availableProducts.filter(p =>
      p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q)
    );
  }, [products, searchQuery, items]);

  const handleAddShowcase = async () => {
    if (!selectedProduct) return;
    setIsSaving(true);
    
    try {
      const form = {
        title: selectedProduct.name,
        subtitle: "Featured Pick",
        tag: selectedProduct.category || "Highlight",
        category: selectedProduct.category || "Other",
        desc: selectedProduct.description || "Discover premium quality and unparalleled reliability.",
        image: selectedProduct.images && selectedProduct.images.length > 0 ? selectedProduct.images[0] : "",
        orderIndex: items.length,
        isActive: true,
      };

      const res = await fetch("/api/exporter/showcase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setSelectedProductId("");
        setSearchQuery("");
        toast.success("Successfully added to the homepage showcase!");
        fetchItems();
      } else {
        const errData = await res.json().catch(() => null);
        toast.error(errData?.error || "Failed to add item. Please try again.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to connect to the server.");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteModalItem) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/exporter/showcase/${deleteModalItem.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Item removed from the showcase.");
        setDeleteModalItem(null);
        fetchItems();
      } else {
        toast.error("Failed to remove item.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server connection error.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (item: ShowcaseItem) => {
    try {
      const res = await fetch(`/api/exporter/showcase/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      if (res.ok) {
        toast.success(item.isActive ? "Item hidden from homepage." : "Item is now live!");
        fetchItems();
      } else {
        toast.error("Failed to update item.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server connection error.");
    }
  };

  const handleReorder = async (item: ShowcaseItem, direction: "up" | "down") => {
    const idx = items.findIndex(i => i.id === item.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= items.length) return;

    const otherItem = items[swapIdx];

    try {
      await Promise.all([
        fetch(`/api/exporter/showcase/${item.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderIndex: otherItem.orderIndex }),
        }),
        fetch(`/api/exporter/showcase/${otherItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderIndex: item.orderIndex }),
        }),
      ]);
      fetchItems();
    } catch (err) {
      console.error(err);
      toast.error("Failed to reorder items.");
    }
  };

  const startEditing = (item: ShowcaseItem) => {
    setEditingItemId(item.id);
    setEditForm({ subtitle: item.subtitle, tag: item.tag, desc: item.desc });
  };

  const handleSaveEdit = async () => {
    if (!editingItemId) return;
    try {
      const res = await fetch(`/api/exporter/showcase/${editingItemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        toast.success("Item updated.");
        setEditingItemId(null);
        fetchItems();
      } else {
        toast.error("Failed to update item.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server connection error.");
    }
  };

  const activeCount = items.filter(i => i.isActive).length;

  return (
    <div className="space-y-6">
      {/* ── Page Header: Title + Subtitle ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#15130D] uppercase flex items-center gap-2.5">
            <MonitorSmartphone className="w-7 h-7 text-[#C4912A]" />
            Homepage Showcase
          </h1>
          <p className="text-sm text-[#6B6A66] mt-1">
            Curate the featured products displayed on the landing page of your platform.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#E2F5EE] text-[#0B7A57] border border-[#0B7A57]/20">
            <span className="size-1.5 rounded-full bg-[#0B7A57]" />
            {activeCount} Live
          </span>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#F7F5F0] text-[#6B6A66] border border-[#ECE7DA]">
            {items.length} Total
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Add Product Section */}
        <div className="bg-gradient-to-b from-white to-[#FFFBF0] border border-[#F0ECE0] rounded-[24px] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#F0ECE0] flex items-center gap-3">
            <div className="size-10 rounded-[14px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center">
              <Star className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[#15130D] uppercase tracking-wider">Highlight a Product</h2>
              <p className="text-xs text-[#6B6A66]">Select a product from the catalog to instantly feature it.</p>
            </div>
          </div>

            <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
              {/* Product Selector */}
              <div className="flex-1 space-y-4">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Select Product
                </label>
                
                {/* Searchable Product Picker */}
                <div className="relative" ref={dropdownRef}>
                  <div
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl py-3.5 px-4 text-slate-800 dark:text-slate-200 font-medium cursor-pointer transition-all hover:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary flex items-center gap-3"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    {selectedProduct ? (
                      <div className="flex items-center justify-between flex-1 min-w-0">
                        <span className="truncate">{selectedProduct.name}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProductId("");
                            setSearchQuery("");
                          }}
                          className="ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <input
                        type="text"
                        placeholder="Search products by name or category..."
                        className="bg-transparent outline-none flex-1 placeholder-slate-400"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setIsDropdownOpen(true);
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </div>

                  {/* Dropdown Results */}
                  {isDropdownOpen && !selectedProduct && (
                    <div className="absolute z-50 mt-2 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl shadow-slate-200/50 dark:shadow-black/40 max-h-64 overflow-y-auto overscroll-contain custom-scrollbar">
                      {filteredProducts.length > 0 ? (
                        filteredProducts.map(p => (
                          <button
                            type="button"
                            key={p.id}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-white/5 last:border-b-0"
                            onClick={() => {
                              setSelectedProductId(p.id);
                              setSearchQuery("");
                              setIsDropdownOpen(false);
                            }}
                          >
                            {p.images?.[0] ? (
                              <img
                                src={p.images[0]}
                                alt=""
                                className="w-10 h-10 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 flex-shrink-0"
                                onError={(e) => (e.currentTarget.style.display = "none")}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                                <PackageSearch className="w-5 h-5 text-slate-400" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{p.name}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{p.category}</p>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center text-sm text-slate-500">
                          <PackageSearch className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                          No products found for &ldquo;{searchQuery}&rdquo;
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {selectedProduct ? (
                  <button 
                    onClick={handleAddShowcase}
                    disabled={isSaving}
                    className="w-full mt-6 bg-primary hover:bg-primary/90 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-primary/25 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <Activity className="w-5 h-5 animate-pulse" />
                    ) : (
                      <Plus className="w-5 h-5" />
                    )}
                    {isSaving ? "Adding..." : "Add to Homepage Showcase"}
                  </button>
                ) : (
                  <div className="mt-6 p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-center text-slate-500 text-sm">
                    Select a product above to preview it.
                  </div>
                )}
              </div>

              {/* Preview Card */}
              {selectedProduct && (
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
                    Live Preview
                  </label>
                  <div className="bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative group">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10"></div>
                    <img 
                      src={selectedProduct.images?.[0] || "/placeholder.png"} 
                      alt="Preview" 
                      className="w-full h-[280px] object-cover transition-transform duration-700 group-hover:scale-105"
                      onError={(e) => (e.currentTarget.src = "https://placehold.co/600x400?text=No+Image")}
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                      <div className="mb-2">
                        <span className="bg-primary/20 text-primary border border-primary/20 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                          {selectedProduct.category}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-1">{selectedProduct.name}</h3>
                      <p className="text-white/70 text-sm line-clamp-2 leading-relaxed">
                        {selectedProduct.description}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Existing Items */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                <LayoutTemplate className="w-6 h-6 text-slate-400" />
                Active Showcase Items
              </h2>
              {items.length > 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Drag or use arrows to reorder items
                </p>
              )}
            </div>
            
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse rounded-2xl overflow-hidden">
                    <div className="bg-slate-200 dark:bg-slate-800 h-48"></div>
                    <div className="bg-white dark:bg-slate-900 p-5 space-y-3">
                      <div className="bg-slate-200 dark:bg-slate-800 h-4 w-2/3 rounded"></div>
                      <div className="bg-slate-200 dark:bg-slate-800 h-3 w-1/2 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length > 0 ? (
              <div className="space-y-4">
                {items.map((item, idx) => {
                  const isEditing = editingItemId === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`group relative bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border transition-all duration-300 ${
                        item.isActive
                          ? "border-slate-200 dark:border-white/10 shadow-sm hover:shadow-xl"
                          : "border-dashed border-slate-300 dark:border-slate-700 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <div className="flex flex-col md:flex-row">
                        {/* Image + Order Controls */}
                        <div className="relative w-full md:w-56 h-48 md:h-auto bg-slate-100 dark:bg-slate-950 overflow-hidden flex-shrink-0">
                          <img 
                            src={item.image} 
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            onError={(e) => (e.currentTarget.src = "https://placehold.co/400x300?text=No+Image")}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/60 to-transparent"></div>
                          
                          {/* Order badge */}
                          <div className="absolute top-3 left-3 w-8 h-8 bg-black/50 backdrop-blur-md rounded-lg flex items-center justify-center text-white text-xs font-black">
                            {idx + 1}
                          </div>
                          
                          {/* Reorder arrows */}
                          <div className="absolute top-3 right-3 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleReorder(item, "up")}
                              disabled={idx === 0}
                              className="w-7 h-7 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                              title="Move up"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReorder(item, "down")}
                              disabled={idx === items.length - 1}
                              className="w-7 h-7 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                              title="Move down"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-5 md:p-6 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <span className="text-[10px] font-black uppercase tracking-wider text-primary/80 mb-1 block">
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={editForm.tag}
                                      onChange={(e) => setEditForm({ ...editForm, tag: e.target.value })}
                                      className="bg-primary/5 border border-primary/20 rounded px-2 py-0.5 text-primary text-[10px] font-black uppercase tracking-wider w-full max-w-[200px]"
                                    />
                                  ) : (
                                    item.tag
                                  )}
                                </span>
                                <h4 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                                  {item.title}
                                </h4>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editForm.subtitle}
                                    onChange={(e) => setEditForm({ ...editForm, subtitle: e.target.value })}
                                    className="mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 w-full"
                                    placeholder="Subtitle"
                                  />
                                ) : (
                                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{item.subtitle}</p>
                                )}
                              </div>
                            </div>
                            {isEditing ? (
                              <textarea
                                value={editForm.desc}
                                onChange={(e) => setEditForm({ ...editForm, desc: e.target.value })}
                                className="mt-2 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-600 dark:text-slate-400 resize-none"
                                rows={2}
                                placeholder="Description"
                              />
                            ) : (
                              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">{item.desc}</p>
                            )}
                          </div>

                          {/* Actions Bar */}
                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-2">
                              {/* Status */}
                              <div className="flex items-center gap-2 mr-3">
                                {item.isActive ? (
                                  <>
                                    <span className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Live</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="relative flex h-2 w-2">
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-400"></span>
                                    </span>
                                    <span className="text-xs font-semibold text-slate-500">Hidden</span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {/* Edit / Save */}
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={handleSaveEdit}
                                    className="h-9 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white flex items-center justify-center gap-1.5 text-xs font-semibold transition-all"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingItemId(null)}
                                    className="h-9 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-xs font-semibold transition-all"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => startEditing(item)}
                                  className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-all"
                                  title="Edit details"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                              )}

                              {/* Toggle Visibility */}
                              <button
                                onClick={() => handleToggleActive(item)}
                                className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all ${
                                  item.isActive
                                    ? "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-500"
                                    : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100"
                                }`}
                                title={item.isActive ? "Hide from homepage" : "Show on homepage"}
                              >
                                {item.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>

                              {/* Delete */}
                              <button 
                                onClick={() => setDeleteModalItem(item)}
                                className="h-9 w-9 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                                title="Remove from showcase"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-3xl py-20 flex flex-col items-center justify-center text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl flex items-center justify-center text-primary">
                    <Sparkles className="w-10 h-10" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary/20 rounded-full animate-ping"></div>
                </div>
                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">No items featured yet</h3>
                <p className="text-slate-500 max-w-md leading-relaxed">
                  Select products from your catalog above to feature them on the platform&apos;s homepage showcase. Featured items will appear prominently to all visitors.
                </p>
              </div>
            )}
          </div>

        </div>

      {/* Delete Confirmation Modal - Portaled to document.body so header & sidebar sink in */}
      {mounted && deleteModalItem && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
            onClick={() => !isDeleting && setDeleteModalItem(null)}
          />

          {/* Dialog Card */}
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-6 overflow-hidden z-[10000] animate-in zoom-in-95 fade-in duration-200">
            <button
              onClick={() => !isDeleting && setDeleteModalItem(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1 pr-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Remove from Showcase
                </h3>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Are you sure you want to remove <span className="font-semibold text-slate-900 dark:text-white">&ldquo;{deleteModalItem.title}&rdquo;</span> from the homepage showcase?
                </p>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  This product will remain in your inventory and can be featured again anytime.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteModalItem(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all shadow-sm shadow-red-600/30 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Remove Item
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
