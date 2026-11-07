"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  Search, ChevronRight, Package, ShieldCheck, 
  ShoppingCart, Zap, Apple, Shirt, FlaskConical, Settings, Laptop, 
  Truck, Construction, HeartPulse, Hammer, Sparkles, ArrowLeft,
  Trash2, Loader2, ArrowRight, Car, Layers, CheckCircle2
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import ProductForm from "@/components/dashboard/ProductForm";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

function getCategoryIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("auto") || lower.includes("car") || lower.includes("spare") || lower.includes("part") || lower.includes("vehic")) return Car;
  if (lower.includes("leaf") || lower.includes("pack") || lower.includes("box") || lower.includes("plate") || lower.includes("dispos")) return Package;
  if (lower.includes("food") || lower.includes("spic") || lower.includes("tea") || lower.includes("grain") || lower.includes("agro") || lower.includes("fruit")) return Apple;
  if (lower.includes("cloth") || lower.includes("text") || lower.includes("wear") || lower.includes("yarn")) return Shirt;
  if (lower.includes("chem") || lower.includes("pharm") || lower.includes("oil")) return FlaskConical;
  if (lower.includes("tool") || lower.includes("machin") || lower.includes("equip")) return Settings;
  if (lower.includes("elec") || lower.includes("tech") || lower.includes("wire")) return Laptop;
  if (lower.includes("cosmet") || lower.includes("beauty")) return Sparkles;
  return Layers;
}

const MAJOR_CATEGORIES = [
  { id: "AUTOMOTIVE", name: "Automotive & Spare Parts", icon: Car },
  { id: "PACKAGING", name: "Packaging & Disposables", icon: Package },
  { id: "AGRICULTURE", name: "Agriculture", icon: Apple },
  { id: "FOOD", name: "Food & Beverage", icon: ShoppingCart },
  { id: "TEXTILES", name: "Textiles", icon: Shirt },
  { id: "CHEMICALS", name: "Chemicals", icon: FlaskConical },
  { id: "MACHINES", name: "Machinery", icon: Settings },
  { id: "ELECTRONICS", name: "Electronics", icon: Laptop },
  { id: "MEDICAL", name: "Medical", icon: HeartPulse },
  { id: "CONSTRUCTION", name: "Construction", icon: Construction },
  { id: "HANDICRAFTS", name: "Handicrafts", icon: Hammer },
  { id: "LOGISTICS", name: "Logistics", icon: Truck },
  { id: "COSMETICS", name: "Cosmetics", icon: Sparkles },
];

const SUB_INDUSTRIES = [
  "Abrasives", "Adhesives", "Aerospace Parts", "Agricultural Machinery", "Air Conditioning", "Aluminum Products",
  "Antibiotics", "Apparel Accessories", "Art Supplies", "Automotive Components", "Baby Products", "Bakery Equipment",
  "Batteries", "Bearings", "Beauty Supplements", "Bicycles", "Biofuels", "Biomass Energy", "Building Materials", "Cables",
  "Cameras", "Camping Gear", "Ceramics", "Circuit Boards", "Cleaning Supplies", "Clocks", "Coffee", "Compressors",
  "Computer Hardware", "Confectionery", "Control Systems", "Cooking Oil", "Cosmetic Tools", "Cotton Fabrics", "Cranes",
];

export default function CategoryDirectory({ customCategories = [] }: { customCategories?: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [customInput, setCustomInput] = useState("");
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [isSavingCustom, setIsSavingCustom] = useState(false);

  const [customCats, setCustomCats] = useState<string[]>(() => {
    let localStored: string[] = [];
    if (typeof window !== "undefined") {
      try {
        localStored = JSON.parse(localStorage.getItem("renote_custom_categories") || "[]");
      } catch {}
    }
    const combined = Array.from(new Set([...customCategories, ...localStored]));
    return combined;
  });

  useEffect(() => {
    if (customCategories && customCategories.length > 0) {
      setCustomCats(prev => Array.from(new Set([...prev, ...customCategories])));
    }
  }, [customCategories]);

  const [localSelection, setLocalSelection] = useState<{ category: string; customCategory?: string } | null>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("action") === "new") {
        return {
          category: params.get("category") || "OTHER",
          customCategory: params.get("customCategory") || undefined,
        };
      }
    }
    if (searchParams.get("action") === "new") {
      return {
        category: searchParams.get("category") || "OTHER",
        customCategory: searchParams.get("customCategory") || undefined,
      };
    }
    return null;
  });

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get("action") === "new") {
        setLocalSelection({
          category: params.get("category") || "OTHER",
          customCategory: params.get("customCategory") || undefined,
        });
      } else {
        setLocalSelection(null);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const isSelected = localSelection !== null;
  const selectedCategory = localSelection?.category || "";
  const selectedCustom = localSelection?.customCategory || "";

  const handleBack = () => {
    if (isSelected) {
      handleBackToDirectory();
    } else {
      router.push("/dashboard/exporter/inventory");
    }
  };

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase().trim();

    const matchedCustom = customCats
      .filter(c => c.toLowerCase().includes(q))
      .map(c => ({ name: c, isCustom: true }));

    const matchedMajor = MAJOR_CATEGORIES
      .filter(m => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q))
      .map(m => ({ name: m.name, id: m.id, isMajor: true }));

    const matchedSub = SUB_INDUSTRIES
      .filter(i => i.toLowerCase().includes(q))
      .slice(0, 6)
      .map(i => ({ name: i, isSub: true }));

    return [...matchedCustom, ...matchedMajor, ...matchedSub].slice(0, 10);
  }, [search, customCats]);

  const handleSelect = (categoryId: string, customCategoryName?: string) => {
    setLocalSelection({ category: categoryId, customCategory: customCategoryName });
    const url = `/dashboard/exporter/inventory/add?action=new&category=${categoryId}${customCategoryName ? `&customCategory=${encodeURIComponent(customCategoryName)}` : ""}`;
    window.history.pushState(null, "", url);
  };

  const handleBackToDirectory = () => {
    setLocalSelection(null);
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", "/dashboard/exporter/inventory/add");
    }
    router.replace("/dashboard/exporter/inventory/add");
  };

  const handleCreateCustomCategory = async (proceedToForm: boolean = false) => {
    const name = customInput.trim();
    if (!name) return;

    setIsSavingCustom(true);
    setCustomCats(prev => {
      if (prev.some(c => c.toLowerCase() === name.toLowerCase())) return prev;
      return [...prev, name];
    });

    try {
      const stored = JSON.parse(localStorage.getItem("renote_custom_categories") || "[]");
      if (!stored.some((s: string) => s.toLowerCase() === name.toLowerCase())) {
        localStorage.setItem("renote_custom_categories", JSON.stringify([...stored, name]));
      }
    } catch {}

    try {
      await fetch("/api/categories/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
    } catch (e) {
      console.warn("Could not save custom category to server:", e);
    } finally {
      setIsSavingCustom(false);
      setIsAddingCustom(false);
      setCustomInput("");
    }

    toast.success(`Category "${name}" added to Product Sectors!`);

    if (proceedToForm) {
      handleSelect("OTHER", name);
    }
  };

  const handleDeleteCustomCategory = async (name: string) => {
    setCustomCats(prev => prev.filter(c => c.toLowerCase() !== name.toLowerCase()));

    try {
      const stored = JSON.parse(localStorage.getItem("renote_custom_categories") || "[]");
      const filtered = stored.filter((s: string) => s.toLowerCase() !== name.toLowerCase());
      localStorage.setItem("renote_custom_categories", JSON.stringify(filtered));
    } catch {}

    try {
      await fetch(`/api/categories/custom?name=${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
      toast.success(`Category "${name}" removed`);
    } catch (e) {
      console.warn("Could not delete custom category from server:", e);
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#F0ECE0]">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleBack}
            className="w-10 h-10 rounded-full border border-[#F0ECE0] bg-white hover:bg-[#FBF1D6] text-[#15130D] flex items-center justify-center transition-colors shrink-0 shadow-sm"
            title={isSelected ? "Back to category selection" : "Back to inventory"}
          >
            <ArrowLeft className="w-5 h-5 stroke-[2]" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] bg-[#FBF1D6] text-[#7A560A]">
                Listing Creator
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66]">
                Global Inventory
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#15130D]">
              Publish New Product
            </h1>
            <p className="text-sm text-[#6B6A66] mt-0.5">
              {isSelected
                ? `Enter listing specifications for ${selectedCustom || selectedCategory}`
                : "Select an export sector or define a custom category to list your asset"}
            </p>
          </div>
        </div>

        {isSelected && (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] bg-[#E2F5EE] text-[#0B7A57]">
            <CheckCircle2 className="w-3.5 h-3.5 stroke-[2]" />
            Listing in: {selectedCustom || selectedCategory}
          </span>
        )}
      </div>

      {/* ─── Content ─── */}
      <AnimatePresence mode="wait">
        {!isSelected ? (
          <motion.div
            key="selector"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Sector Search Card */}
            <div className="rounded-[24px] border border-[#F0ECE0] bg-gradient-to-b from-white to-[#FFFBF0] p-6 md:p-8 shadow-sm">
              <div className="max-w-xl mx-auto text-center space-y-2 mb-6">
                <h2 className="text-lg font-extrabold text-[#15130D]">Choose an Export Sector</h2>
                <p className="text-xs text-[#6B6A66]">Select the most relevant vertical to start your catalog listing</p>
              </div>
              
              <div className="max-w-lg mx-auto relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6A66] stroke-[1.8]" />
                <input
                  type="text"
                  placeholder="Search industries (e.g. Automobile, Areca Leaf, Chemicals, Spices...)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-11 bg-white border border-[#F0ECE0] rounded-full pl-11 pr-4 text-sm text-[#15130D] placeholder:text-[#6B6A66] focus:outline-none focus:border-[#C4912A] transition-colors"
                />
                
                {/* Search Dropdown */}
                <AnimatePresence>
                  {search.trim() && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#F0ECE0] rounded-[18px] shadow-xl z-50 overflow-hidden"
                    >
                      {searchResults.length > 0 ? (
                        searchResults.map((item, idx) => (
                          <button
                            key={`${item.name}_${idx}`}
                            onClick={() => {
                              if ("isMajor" in item && item.id) {
                                handleSelect(item.id);
                              } else {
                                handleSelect("OTHER", item.name);
                              }
                            }}
                            className="w-full px-5 py-3 text-left text-sm hover:bg-[#FFFBF0] border-b border-[#F0ECE0] last:border-0 flex items-center justify-between transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#15130D]">{item.name}</span>
                              {"isCustom" in item && (
                                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#FBF1D6] text-[#7A560A]">
                                  Custom Sector
                                </span>
                              )}
                            </div>
                            <ChevronRight className="w-4 h-4 text-[#6B6A66]" />
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-xs text-[#6B6A66] text-center">
                          <p>No matches for &quot;{search}&quot;.</p>
                          <button
                            onClick={() => {
                              setCustomInput(search.trim());
                              setIsAddingCustom(true);
                              setSearch("");
                            }}
                            className="mt-2 text-xs font-bold text-[#7A560A] hover:underline"
                          >
                            + Add &quot;{search}&quot; as a new Custom Category
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {MAJOR_CATEGORIES.map((cat, i) => (
                <button
                  key={cat.id}
                  onClick={() => handleSelect(cat.id)}
                  className="rounded-[20px] border border-[#F0ECE0] bg-gradient-to-b from-white to-[#FFFBF0] p-5 shadow-sm hover:shadow-md hover:border-[#C4912A] transition-all flex flex-col items-center justify-center text-center group active:scale-95"
                >
                  <div className="w-12 h-12 rounded-[16px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <cat.icon className="w-6 h-6 stroke-[1.8]" />
                  </div>
                  <span className="text-xs font-bold text-[#15130D] leading-tight">
                    {cat.name}
                  </span>
                </button>
              ))}

              {customCats.map((customName, i) => {
                const IconComp = getCategoryIcon(customName);
                return (
                  <div key={`custom_${customName}_${i}`} className="relative group">
                    <button
                      onClick={() => handleSelect("OTHER", customName)}
                      className="w-full h-full rounded-[20px] border border-[#F0ECE0] bg-gradient-to-b from-white to-[#FFFBF0] p-5 shadow-sm hover:shadow-md hover:border-[#C4912A] transition-all flex flex-col items-center justify-center text-center active:scale-95"
                    >
                      <div className="w-12 h-12 rounded-[16px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center mb-3">
                        <IconComp className="w-6 h-6 stroke-[1.8]" />
                      </div>
                      <span className="text-xs font-bold text-[#15130D] leading-tight truncate max-w-full">
                        {customName}
                      </span>
                    </button>
                    <button
                      type="button"
                      title={`Remove "${customName}"`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCustomCategory(customName);
                      }}
                      className="absolute top-2 right-2 p-1 rounded-full bg-white border border-[#F0ECE0] text-[#6B6A66] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}

              {/* Add Custom Category Card */}
              <button
                onClick={() => setIsAddingCustom(true)}
                className="rounded-[20px] border border-dashed border-[#F0ECE0] bg-[#FFFBF2] p-5 shadow-sm hover:border-[#C4912A] transition-all flex flex-col items-center justify-center text-center group active:scale-95"
              >
                <div className="w-12 h-12 rounded-[16px] bg-[#FBF1D6] text-[#7A560A] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <span className="text-2xl font-bold leading-none">+</span>
                </div>
                <span className="text-xs font-bold text-[#7A560A] leading-tight">
                  Add Custom Category
                </span>
              </button>
            </div>

            {/* Custom Category Modal */}
            <AnimatePresence>
              {isAddingCustom && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    className="relative w-full max-w-md bg-white border border-[#F0ECE0] rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-6 md:p-8"
                  >
                    <h3 className="text-xl font-extrabold text-[#15130D] mb-1">Create Custom Category</h3>
                    <p className="text-xs text-[#6B6A66] mb-5">
                      Enter a custom industry sector (e.g. <em>Areca Palm Plates</em>, <em>Spices</em>).
                    </p>
                    <input
                      type="text"
                      autoFocus
                      placeholder="e.g. Automobile Spare Parts"
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      className="w-full h-11 bg-[#F4F4F7] border border-[#F0ECE0] rounded-xl px-4 text-sm text-[#15130D] focus:outline-none focus:border-[#C4912A] mb-5"
                    />
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setIsAddingCustom(false)}
                        className="btn-cream-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCreateCustomCategory(true)}
                        disabled={!customInput.trim() || isSavingCustom}
                        className="btn-gold-primary"
                      >
                        {isSavingCustom ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4 stroke-[2]" />}
                        Continue to Listing
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
          >
            <ProductForm
              key={selectedCustom || selectedCategory || "default"}
              hideHeader={true}
              onCancel={handleBackToDirectory}
              initialCategory={selectedCategory || undefined}
              initialCustomCategory={selectedCustom || undefined}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
