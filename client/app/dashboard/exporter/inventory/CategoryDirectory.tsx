"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  Search, ChevronRight, LayoutGrid, Globe, Package, Tag, ShieldCheck, 
  ShoppingCart, Zap, Apple, Shirt, FlaskConical, Settings, Laptop, 
  Truck, Construction, HeartPulse, Hammer, Sparkles, ArrowLeft,
  Edit2, Trash2, Filter, MoreHorizontal, Eye, Box, AlertCircle,
  CheckCircle2, PauseCircle, Loader2, ArrowRight, Car, Layers
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
  { id: "AUTOMOTIVE", name: "Automotive & Spare Parts", icon: Car, color: "bg-blue-600/10 text-blue-600" },
  { id: "PACKAGING", name: "Packaging & Disposables", icon: Package, color: "bg-emerald-600/10 text-emerald-600" },
  { id: "AGRICULTURE", name: "Agriculture", icon: Apple, color: "bg-emerald-500/10 text-emerald-600" },
  { id: "FOOD", name: "Food & Beverage", icon: ShoppingCart, color: "bg-orange-500/10 text-orange-600" },
  { id: "TEXTILES", name: "Textiles", icon: Shirt, color: "bg-cyan-500/10 text-cyan-600" },
  { id: "CHEMICALS", name: "Chemicals", icon: FlaskConical, color: "bg-purple-500/10 text-purple-600" },
  { id: "MACHINES", name: "Machinery", icon: Settings, color: "bg-slate-500/10 text-slate-600" },
  { id: "ELECTRONICS", name: "Electronics", icon: Laptop, color: "bg-indigo-500/10 text-indigo-600" },
  { id: "MEDICAL", name: "Medical", icon: HeartPulse, color: "bg-rose-500/10 text-rose-600" },
  { id: "CONSTRUCTION", name: "Construction", icon: Construction, color: "bg-amber-500/10 text-amber-600" },
  { id: "HANDICRAFTS", name: "Handicrafts", icon: Hammer, color: "bg-amber-800/10 text-amber-800" },
  { id: "LOGISTICS", name: "Logistics", icon: Truck, color: "bg-sky-500/10 text-sky-600" },
  { id: "COSMETICS", name: "Cosmetics", icon: Sparkles, color: "bg-pink-500/10 text-pink-600" },
];

const SUB_INDUSTRIES = [
  "Abrasives", "Adhesives", "Aerospace Parts", "Agricultural Machinery", "Air Conditioning", "Aluminum Products",
  "Antibiotics", "Apparel Accessories", "Art Supplies", "Automotive Components", "Baby Products", "Bakery Equipment",
  "Batteries", "Bearings", "Beauty Supplements", "Bicycles", "Biofuels", "Biomass Energy", "Building Materials", "Cables",
  "Cameras", "Camping Gear", "Ceramics", "Circuit Boards", "Cleaning Supplies", "Clocks", "Coffee", "Compressors",
  "Computer Hardware", "Confectionery", "Control Systems", "Cooking Oil", "Cosmetic Tools", "Cotton Fabrics", "Cranes",
  "Dairy Products", "Data Storage", "Dental Equipment", "Detergents", "Diagnostic Tools", "Digital Cameras", "Disinfectants",
  "Doors", "Drilling Equipment", "Dyes", "Earthmoving Machinery", "Electric Motors", "Electronic Components", "Engines",
  "Essential Oils", "Excavators", "Fabricated Metals", "Fasteners", "Feed Additives", "Fertilizers", "Filtering Equipment",
  "Fire Extinguishers", "Fish Products", "Floor Covers", "Flour", "Flowers", "Footwear", "Forestry Equipment", "Frames",
  "Fruit", "Fungicides", "Furnaces", "Garden Tools", "Gaskets", "Gears", "Generators", "Glass Products", "Glassware",
  "Gloves", "Grain", "Greenhouse Equipment", "Grinding Tools", "Hair Care", "Hand Tools", "Handling Equipment", "Hats",
  "Hay", "Heaters", "Herbicides", "Herbal Products", "Honey", "Hospital Furniture", "Household Appliances", "Hydraulic Equipment",
  "Industrial Boilers", "Industrial Chemicals", "Ink", "Insecticides", "Instrumentation", "Insulation", "Iron Products",
  "Irrigation Systems", "Jewelry", "Juice", "Kitchenware", "Knitted Fabrics", "Laboratory Equipment", "Lamps", "Leather Goods",
  "Lenses", "Light Fixtures", "Linens", "Lubricants", "Luggage", "Lumber", "Machine Tools", "Maintenance Supplies", "Mapping Equipment",
  "Marine Engines", "Material Handling", "Measuring Tools", "Medical Disposables", "Metals", "Milk Products", "Milling Machines",
  "Mining Equipment", "Mixers", "Mobile Phones", "Musical Instruments", "Network Hardware", "Office Furniture", "Office Supplies",
  "Oil Seeds", "Optical Fibers", "Organic Chemicals", "Packaging Machinery", "Paints", "Paper Products", "Perfume",
  "Personal Computers", "Pesticides", "Pet Food", "Pharmaceutical Ingredients", "Pigments", "Pipes", "Plastic Products",
  "Power Tools", "Precision Instruments", "Prepared Foods", "Printers", "Printing Inks", "Protective Clothing", "Pumps",
  "Raw Materials", "Refrigeration", "Renewable Energy", "Robotics", "Safety Equipment", "Sand", "Scales", "School Supplies",
  "Scientific Instruments", "Seeds", "Semiconductors", "Sensors", "Shipbuilding", "Signals", "Signs", "Silk Fabrics",
  "Software", "Solar Energy", "Spices", "Sporting Goods", "Stainless Steel", "Stationery", "Steel Products", "Surgical Instruments",
  "Synthetic Fibers", "Tableware", "Tea", "Technical Fabrics", "Telecommunications", "Testing Equipment", "Tiles", "Tools",
  "Tractors", "Transformers", "Trucks", "Turbines", "Valves", "Vegetables", "Vehicle Parts", "Vessels", "Video Equipment",
  "Warehouse Equipment", "Washing Equipment", "Waste Management", "Watch Components", "Water Filtration", "Wearables",
  "Weather Systems", "Welding Equipment", "Windows", "Wood Products", "Workwear", "Woven Fabrics", "Yarn", "Zinc Products"
];

export default function CategoryDirectory({ customCategories = [] }: { customCategories?: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [isSavingCustom, setIsSavingCustom] = useState(false);

  // Dynamic local state of custom categories (persisted across additions)
  const [customCats, setCustomCats] = useState<string[]>(() => {
    const list = [...customCategories];
    if (!list.some(c => c.toLowerCase() === "areca leaf")) {
      list.push("Areca Leaf");
    }
    return list;
  });

  // Sync with local storage and fetch latest from API
  useEffect(() => {
    try {
      const stored = localStorage.getItem("renote_custom_categories");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setCustomCats(prev => {
            const combined = new Set([...prev, ...parsed]);
            return Array.from(combined);
          });
        }
      }
    } catch {}

    // Fetch latest from API
    fetch("/api/categories/custom")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data?.categories)) {
          setCustomCats(prev => {
            const combined = new Set([...prev, ...data.categories]);
            return Array.from(combined);
          });
        }
      })
      .catch(() => {});
  }, []);

  const isSelected = searchParams.get("action") === "new";
  const selectedCategory = searchParams.get("category");
  const selectedCustom = searchParams.get("customCategory");

  // Search through custom categories as well as standard industries
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
    const url = `/dashboard/exporter/inventory/add?action=new&category=${categoryId}${customCategoryName ? `&customCategory=${encodeURIComponent(customCategoryName)}` : ""}`;
    router.push(url, { scroll: false });
  };

  const handleCreateCustomCategory = async (proceedToForm: boolean = false) => {
    const name = customInput.trim();
    if (!name) return;

    setIsSavingCustom(true);

    // 1. Immediately update local state so the card appears in the UI
    setCustomCats(prev => {
      if (prev.some(c => c.toLowerCase() === name.toLowerCase())) return prev;
      return [...prev, name];
    });

    // 2. Persist to localStorage
    try {
      const stored = JSON.parse(localStorage.getItem("renote_custom_categories") || "[]");
      if (!stored.some((s: string) => s.toLowerCase() === name.toLowerCase())) {
        localStorage.setItem("renote_custom_categories", JSON.stringify([...stored, name]));
      }
    } catch {}

    // 3. Persist to server
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

    // 4. Optionally proceed to listing creation for this new category
    if (proceedToForm) {
      handleSelect("OTHER", name);
    }
  };

  const handleDeleteCustomCategory = async (name: string) => {
    // 1. Immediately update local state
    setCustomCats(prev => prev.filter(c => c.toLowerCase() !== name.toLowerCase()));

    // 2. Remove from localStorage
    try {
      const stored = JSON.parse(localStorage.getItem("renote_custom_categories") || "[]");
      const filtered = stored.filter((s: string) => s.toLowerCase() !== name.toLowerCase());
      localStorage.setItem("renote_custom_categories", JSON.stringify(filtered));
    } catch {}

    // 3. Remove from server
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
    <div className="min-h-[600px] w-full">
      <AnimatePresence mode="wait">
        {!isSelected ? (
          <motion.div
            key="selector"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-10"
          >
            {/* Search Header */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-2xl p-8 shadow-sm">
              <div className="max-w-2xl mx-auto text-center space-y-4 mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Choose a Product Sector</h2>
                <p className="text-slate-500 text-sm">Select the most relevant category to begin your listing</p>
              </div>
              
              <div className="max-w-xl mx-auto relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Search for specific industries (e.g. Automobile, Spare Parts, Areca, Spices...)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                />
                
                {/* Search Dropdown */}
                <AnimatePresence>
                  {search.trim() && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
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
                            className="w-full px-6 py-3.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-white/5 border-b border-slate-100 dark:border-white/5 last:border-0 flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-slate-800 dark:text-slate-200 font-medium">{item.name}</span>
                              {"isCustom" in item && (
                                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                  Custom Sector
                                </span>
                              )}
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-sm text-slate-500 text-center">
                          <p>No exact matches for &quot;{search}&quot;.</p>
                          <button
                            onClick={() => {
                              setCustomInput(search.trim());
                              setIsAddingCustom(true);
                              setSearch("");
                            }}
                            className="mt-2 text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                          >
                            + Create &quot;{search}&quot; as a new Custom Category
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {/* Major Industry Categories */}
              {MAJOR_CATEGORIES.map((cat, i) => (
                <motion.button
                  key={cat.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => handleSelect(cat.id)}
                  className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-2xl hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all group active:scale-95"
                >
                  <div className={`w-14 h-14 ${cat.color} rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <cat.icon className="w-7 h-7" />
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200 text-center leading-tight">
                    {cat.name}
                  </span>
                </motion.button>
              ))}

              {/* Dynamically Created Custom Categories */}
              {customCats.map((customName, i) => {
                const IconComp = getCategoryIcon(customName);
                return (
                  <motion.div
                    key={`custom_${customName}_${i}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="relative group"
                  >
                    <button
                      onClick={() => handleSelect("OTHER", customName)}
                      className="w-full h-full flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-950 border border-primary/20 dark:border-primary/30 rounded-2xl hover:border-primary hover:shadow-lg hover:shadow-primary/10 transition-all group-active:scale-95 text-center relative overflow-hidden"
                    >
                      <div className="absolute top-2 left-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                          Custom
                        </span>
                      </div>
                      <div className="w-14 h-14 bg-gradient-to-tr from-primary/15 to-amber-500/10 text-primary rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <IconComp className="w-7 h-7" />
                      </div>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100 text-center leading-tight truncate max-w-full">
                        {customName}
                      </span>
                    </button>
                    <button
                      type="button"
                      title={`Remove "${customName}" from sector list`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCustomCategory(customName);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 opacity-0 group-hover:opacity-100 transition-all z-10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                );
              })}

              {/* Add Custom Category Card */}
              <motion.button
                key="add_custom"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                onClick={() => setIsAddingCustom(true)}
                className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-950 border border-dashed border-slate-300 dark:border-white/20 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all group active:scale-95"
              >
                <div className="w-14 h-14 bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 group-hover:text-primary transition-all">
                  <span className="material-symbols-outlined text-3xl">add</span>
                </div>
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400 text-center group-hover:text-primary transition-colors leading-tight">
                  Add Custom Category
                </span>
              </motion.button>
            </div>

            {/* Custom Category Creation Modal */}
            <AnimatePresence>
              {isAddingCustom && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsAddingCustom(false)}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10"
                  >
                    <div className="p-8">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                        <Layers className="w-6 h-6" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Create Custom Category</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
                        Enter a unique product category name (e.g. <em>Automobile spare parts</em>, <em>Eco Packaging</em>, <em>Spices</em>). It will be permanently added to the product sector directory.
                      </p>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 block">
                            Category Name *
                          </label>
                          <input
                            type="text"
                            autoFocus
                            placeholder="e.g. Automobile spare parts"
                            value={customInput}
                            onChange={(e) => setCustomInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && customInput.trim()) {
                                e.preventDefault();
                                handleCreateCustomCategory(false);
                              }
                            }}
                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white placeholder:text-slate-400 transition-all font-medium text-sm"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-white/5 flex flex-wrap gap-3 justify-end items-center">
                      <button
                        type="button"
                        onClick={() => setIsAddingCustom(false)}
                        className="px-5 py-2.5 font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/5 rounded-xl transition-all text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCreateCustomCategory(false)}
                        disabled={!customInput.trim() || isSavingCustom}
                        className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-slate-100 font-bold rounded-xl transition-all flex items-center gap-1.5 text-sm disabled:opacity-50"
                      >
                        + Add to Sector List
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCreateCustomCategory(true)}
                        disabled={!customInput.trim() || isSavingCustom}
                        className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center gap-2 text-sm"
                      >
                        {isSavingCustom ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                          </>
                        ) : (
                          <>
                            Continue to Listing <ArrowRight className="w-5 h-5" />
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Quick Trust Badges */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-10 py-10 opacity-60">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <ShieldCheck className="w-4 h-4" /> Trusted by 5000+ Exporters
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <Zap className="w-4 h-4" /> Fast Listing Protocol
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <Globe className="w-4 h-4" /> Global Market Distribution
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="mb-6 flex justify-end">
              <div className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider">
                Listing in: {selectedCustom || selectedCategory}
              </div>
            </div>
            
            <ProductForm hideHeader={true} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
