"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, Save, Loader2, Plus, X, 
  Info, Image as ImageIcon, Tag, 
  DollarSign, Package, Globe, ShieldCheck,
  LayoutGrid, FileText, Building2, Layers
} from "lucide-react";
import { authFetch } from "@/lib/api-utils";
import Link from "next/link";
import { toast } from "sonner";
import ImageUploader from "./ImageUploader";
import { useTranslation } from "@/lib/i18n/client";
import { getSuggestedSubCategories, getSuggestedCompanies } from "@/lib/categories";

const CATEGORIES = [
  { value: "AGRICULTURE", label: "Agriculture & Farming", icon: Globe },
  { value: "AUTOMOTIVE", label: "Automotive & Spare Parts", icon: LayoutGrid },
  { value: "PACKAGING", label: "Packaging & Disposables", icon: Package },
  { value: "HANDICRAFTS", label: "Handicrafts & Decor", icon: Tag },
  { value: "TEXTILES", label: "Textiles & Apparel", icon: Tag },
  { value: "FOOD", label: "Food & Beverages", icon: LayoutGrid },
  { value: "CHEMICALS", label: "Chemicals & Raw Materials", icon: ShieldCheck },
  { value: "MACHINES", label: "Machinery & Equipment", icon: Package },
  { value: "ELECTRONICS", label: "Electronics & Tech", icon: LayoutGrid },
  { value: "MEDICAL", label: "Medical & Pharmaceuticals", icon: ShieldCheck },
  { value: "CONSTRUCTION", label: "Construction", icon: LayoutGrid },
  { value: "COSMETICS", label: "Cosmetics & Care", icon: Tag },
  { value: "PLASTICS", label: "Plastics & Polymers", icon: LayoutGrid },
  { value: "METALS", label: "Metals & Alloys", icon: ShieldCheck },
  { value: "LEATHER", label: "Leather & Goods", icon: Tag },
  { value: "FURNITURE", label: "Furniture & Wood", icon: LayoutGrid },
  { value: "LOGISTICS", label: "Logistics & Shipping", icon: Package },
  { value: "ENERGY", label: "Energy & Power", icon: ShieldCheck },
  { value: "TOYS", label: "Toys & Games", icon: LayoutGrid },
  { value: "SPORTS", label: "Sports & Fitness", icon: LayoutGrid },
  { value: "RAW_MATERIALS", label: "Raw Materials", icon: Package },
  { value: "CONSUMER_GOODS", label: "Consumer Goods", icon: LayoutGrid },
  { value: "OTHER", label: "Other (Custom...)", icon: Plus },
];

type ProductData = {
  id?: string;
  name: string;
  category: string;
  description: string;
  price: number;
  regularPrice: number;
  minOrderQty: number;
  unit: string;
  originCountry: string;
  hsCode: string;
  images: string[];
  certifications: string[];
  quantity: number;
  available?: boolean;
};

const defaultProduct: ProductData = {
  name: "",
  category: "AUTOMOTIVE",
  description: "",
  price: 0,
  regularPrice: 0,
  minOrderQty: 1,
  unit: "pcs",
  originCountry: "India",
  hsCode: "",
  images: [],
  certifications: [],
  quantity: 100,
};

const UNITS = [
  { value: "pcs", label: "Pieces (pcs)" },
  { value: "units", label: "Units (units)" },
  { value: "sets", label: "Sets / Kits" },
  { value: "kg", label: "Kilograms (kg)" },
  { value: "g", label: "Grams (g)" },
  { value: "tons", label: "Metric Tons" },
  { value: "lbs", label: "Pounds (lbs)" },
  { value: "liters", label: "Liters (L)" },
  { value: "boxes", label: "Boxes" },
  { value: "cartons", label: "Cartons" },
  { value: "pallets", label: "Pallets" },
  { value: "containers", label: "Containers" },
];

const VALID_CATEGORIES = new Set([
  "CHEMICALS", "MACHINES", "TEXTILES", "MEDICAL", "HANDICRAFTS",
  "FOOD", "ELECTRONICS", "AUTOMOTIVE", "CONSTRUCTION", "AGRICULTURE", 
  "COSMETICS", "PLASTICS", "ENERGY", "LOGISTICS", "PACKAGING", 
  "METALS", "LEATHER", "FURNITURE", "TOYS", "SPORTS", "OTHER",
]);

function normalizeCategory(value: string | null): string {
  if (!value) return "AUTOMOTIVE";
  if (value.startsWith("CUSTOM_CAT:")) return value;
  const upper = value.trim().toUpperCase();
  if (VALID_CATEGORIES.has(upper)) return upper;
  
  if (upper === "MACHINERY" || upper === "MACHINES & EQUIPMENT" || upper === "MACHINE") {
    return "MACHINES";
  }

  return "OTHER";
}

export default function ProductForm({
  initialData,
  isEdit = false,
  hideHeader = false,
}: {
  initialData?: ProductData;
  isEdit?: boolean;
  hideHeader?: boolean;
}) {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [form, setForm] = useState<ProductData>(() => {
    if (initialData) {
      let cat = initialData.category;
      const customCert = initialData.certifications?.find(c => c && c.startsWith("CUSTOM_CAT:"));
      if (customCert) {
        cat = customCert;
      }
      return { ...initialData, category: cat };
    }
    const cat = searchParams.get("category");
    const custom = searchParams.get("customCategory");
    return {
      ...defaultProduct,
      category: custom ? `CUSTOM_CAT:${custom}` : normalizeCategory(cat),
    };
  });

  const [customCategory, setCustomCategory] = useState(() => {
    if (initialData?.certifications) {
      const custom = initialData.certifications.find(c => c && c.startsWith("CUSTOM_CAT:"));
      return custom ? custom.replace("CUSTOM_CAT:", "") : (searchParams.get("customCategory") || "");
    }
    return searchParams.get("customCategory") || "";
  });

  // Sub-Category State
  const [subCategory, setSubCategory] = useState(() => {
    if (initialData?.certifications) {
      const found = initialData.certifications.find(c => c && c.startsWith("SUB_CAT:"));
      if (found) return found.replace("SUB_CAT:", "").trim();
    }
    return searchParams.get("subCategory") || "";
  });

  // Company / Brand / Manufacturer State
  const [company, setCompany] = useState(() => {
    if (initialData?.certifications) {
      const found = initialData.certifications.find(c => c && (c.startsWith("COMPANY:") || c.startsWith("BRAND:")));
      if (found) return found.replace(/^COMPANY:|^BRAND:/, "").trim();
    }
    return searchParams.get("company") || searchParams.get("brand") || "";
  });

  const [availableCustomCategories, setAvailableCustomCategories] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/categories/custom")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data?.categories)) {
          setAvailableCustomCategories(data.categories);
        }
      })
      .catch(() => {});
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newCertification, setNewCertification] = useState("");

  // Dynamic suggested presets based on chosen category
  const activeCategoryKey = form.category.startsWith("CUSTOM_CAT:") ? "OTHER" : form.category;
  const suggestedSubCategories = useMemo(() => getSuggestedSubCategories(activeCategoryKey), [activeCategoryKey]);
  const suggestedCompanies = useMemo(() => getSuggestedCompanies(activeCategoryKey), [activeCategoryKey]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setErrors((prev) => ({ ...prev, [name]: "" }));

    if (name === "category") {
      if (value === "CUSTOM") {
        const defaultName = customCategory || "Automobile Spare Parts";
        setCustomCategory(defaultName);
        setForm((prev) => ({ ...prev, category: `CUSTOM_CAT:${defaultName}` }));
        return;
      } else if (value.startsWith("CUSTOM_CAT:")) {
        const rawName = value.replace("CUSTOM_CAT:", "");
        setCustomCategory(rawName);
        setForm((prev) => ({ ...prev, category: value }));
        return;
      }
    }

    if (type === "number") {
      setForm((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const addCertification = () => {
    const cert = newCertification.trim();
    if (!cert) return;
    setForm((prev) => ({ ...prev, certifications: [...prev.certifications, cert] }));
    setNewCertification("");
  };

  const removeCertification = (index: number) => {
    setForm((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index),
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.name || form.name.length < 3) newErrors.name = "Product name is too short (min 3 chars)";
    if (!form.description || form.description.length < 20)
      newErrors.description = "Description should be more detailed (min 20 chars)";
    if (form.price !== undefined && form.price < 0) newErrors.price = "Price cannot be negative";
    if (!form.minOrderQty || form.minOrderQty <= 0) newErrors.minOrderQty = "MOQ must be at least 1";
    if (!form.unit) newErrors.unit = "Unit is required";
    if (!form.originCountry) newErrors.originCountry = "Origin country is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please check the form for errors");
      return;
    }

    try {
      setIsSubmitting(true);
      const apiUrl = isEdit ? `/api/products/${form.id}` : "/api/products";
      const method = isEdit ? "PUT" : "POST";

      // Filter out internal tags
      let certs = form.certifications.filter(c => 
        !c.startsWith("CUSTOM_CAT:") && 
        !c.startsWith("SUB_CAT:") && 
        !c.startsWith("COMPANY:") && 
        !c.startsWith("BRAND:")
      );
      let finalCategory = form.category;
      
      if (form.category.startsWith("CUSTOM_CAT:") || form.category === "CUSTOM") {
        const catName = customCategory.trim() || form.category.replace("CUSTOM_CAT:", "").trim() || "Custom";
        certs.push(`CUSTOM_CAT:${catName}`);
        finalCategory = "OTHER";

        // Persist new custom category for both client & server
        try {
          fetch("/api/categories/custom", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: catName }),
          }).catch(() => {});

          const stored = JSON.parse(localStorage.getItem("renote_custom_categories") || "[]");
          if (!stored.some((s: string) => s.toLowerCase() === catName.toLowerCase())) {
            localStorage.setItem("renote_custom_categories", JSON.stringify([...stored, catName]));
          }
        } catch {}
      }

      if (subCategory.trim()) {
        certs.push(`SUB_CAT:${subCategory.trim()}`);
      }

      if (company.trim()) {
        certs.push(`COMPANY:${company.trim()}`);
      }

      const body = {
        ...form,
        category: finalCategory,
        subCategory: subCategory.trim(),
        company: company.trim(),
        certifications: certs,
      };

      await authFetch(apiUrl, {
        method,
        body: JSON.stringify(body),
      });

      toast.success(isEdit ? "Product updated successfully!" : "Product listed successfully!");
      router.push("/dashboard/exporter/inventory");
      router.refresh();
    } catch (e: any) {
      if (e.details) {
        const issues = e.details;
        toast.error(`Validation failed: ${issues[0]?.message || 'Check form fields'}`);
      } else if (e.response?.data?.details) {
        const issues = e.response.data.details;
        toast.error(`Validation failed: ${issues[0]?.message || 'Check form fields'}`);
      } else {
        toast.error(e.message || "Failed to save product");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm";
  const sectionClass = "bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl shadow-sm overflow-hidden mb-6";
  const labelClass = "block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2";

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl mx-auto pb-20">
      {/* Header section */}
      {!hideHeader && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/exporter/inventory"
              className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors text-slate-500"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {isEdit ? "Edit Product Listing" : "Create New Product Listing"}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Configure category, sub-category, manufacturer brand & specifications for global buyers
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2.5 border border-slate-200 dark:border-white/10 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isEdit ? "Update Product" : "Publish Listing"}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Basic Information */}
          <div className={sectionClass}>
            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-slate-800 dark:text-slate-200">Basic Information & Categorization</h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className={labelClass}>Product Name *</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Front Disc Brake Pad Set, Organic Areca Round Plate, CNC Milling Head..."
                  className={inputClass}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Primary Category *</label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <optgroup label="Standard Categories">
                      {CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </optgroup>
                    {availableCustomCategories.length > 0 && (
                      <optgroup label="Saved Custom Categories">
                        {availableCustomCategories.map(c => (
                          <option key={c} value={`CUSTOM_CAT:${c}`}>{c} (Custom)</option>
                        ))}
                      </optgroup>
                    )}
                    {customCategory && !availableCustomCategories.some(c => c.toLowerCase() === customCategory.toLowerCase()) && (
                      <option value={`CUSTOM_CAT:${customCategory}`}>{customCategory} (Custom)</option>
                    )}
                    <optgroup label="Other">
                      <option value="CUSTOM">+ Enter New Custom Category</option>
                    </optgroup>
                  </select>
                  {(form.category.startsWith("CUSTOM_CAT:") || form.category === "CUSTOM") && (
                    <div className="mt-3">
                      <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-1.5">
                        Custom Category Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Automobile Spare Parts, Eco Packaging, Industrial Pumps..."
                        value={customCategory}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomCategory(val);
                          setForm((prev) => ({
                            ...prev,
                            category: val.trim() ? `CUSTOM_CAT:${val.trim()}` : "CUSTOM",
                          }));
                        }}
                        className={inputClass}
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Origin Country *</label>
                  <input
                    name="originCountry"
                    value={form.originCountry}
                    onChange={handleChange}
                    placeholder="e.g. India, Germany, Japan, USA..."
                    className={inputClass}
                  />
                  {errors.originCountry && <p className="text-xs text-red-500 mt-1">{errors.originCountry}</p>}
                </div>
              </div>

              {/* Sub-Category and Company / Brand fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100 dark:border-white/5">
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Layers className="w-3.5 h-3.5 text-primary" />
                    <label className={labelClass + " !mb-0"}>Sub-Category / Product Line</label>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Brake Systems & Pads, Engine & Transmission..."
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    className={inputClass}
                    list="subcategory-suggestions"
                  />
                  <datalist id="subcategory-suggestions">
                    {suggestedSubCategories.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                  {suggestedSubCategories.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Suggestions:</span>
                      {suggestedSubCategories.slice(0, 4).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSubCategory(s)}
                          className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                            subCategory.toLowerCase() === s.toLowerCase()
                              ? "bg-primary text-white"
                              : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Helps buyers filter by exact part or sub-segment.
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Building2 className="w-3.5 h-3.5 text-primary" />
                    <label className={labelClass + " !mb-0"}>Company / Brand / OEM</label>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Bosch, Brembo, Denso, Tata Motors..."
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className={inputClass}
                    list="company-suggestions"
                  />
                  <datalist id="company-suggestions">
                    {suggestedCompanies.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                  {suggestedCompanies.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Suggestions:</span>
                      {suggestedCompanies.slice(0, 4).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCompany(c)}
                          className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                            company.toLowerCase() === c.toLowerCase()
                              ? "bg-primary text-white"
                              : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Differentiates parts made by different manufacturers.
                  </p>
                </div>
              </div>

              <div>
                <label className={labelClass}>Product Description & Specifications *</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe technical specifications, compatibility, material composition, dimensions, and grade..."
                  rows={6}
                  className={inputClass + " resize-none"}
                />
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
              </div>
            </div>
          </div>

          {/* Section 2: Pricing & Inventory */}
          <div className={sectionClass}>
             <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-slate-800 dark:text-slate-200">Wholesale Quotation & Inventory</h2>
              </div>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                B2B Trade Model
              </span>
            </div>
            <div className="p-6">
              <div className="p-3 mb-6 bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/30 rounded-lg text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2.5">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="leading-relaxed">
                  <strong>B2B Quotation Pricing:</strong> In B2B wholesale trade, buyers request a formal quotation directly from their cart. The wholesale price below acts as a benchmark reference rate or can be set to <strong>$0</strong> for <em>&quot;Price on Request / Quote on Demand&quot;</em>.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <label className={labelClass}>Catalog List / Reference Price (USD)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      name="regularPrice"
                      type="number"
                      value={form.regularPrice || ""}
                      onChange={handleChange}
                      placeholder="0.00"
                      className={inputClass + " pl-8"}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Optional manufacturer MSRP or standard retail reference.</p>
                </div>
                <div>
                  <label className={labelClass}>Wholesale Benchmark Rate (USD)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      name="price"
                      type="number"
                      value={form.price || ""}
                      onChange={handleChange}
                      placeholder="0.00 (or leave 0 for Quote on Demand)"
                      className={inputClass + " pl-8 border-primary/30"}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Optional benchmark rate. Leave 0 for &quot;Quote on Demand&quot;.</p>
                  {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div>
                  <label className={labelClass}>Minimum Order Qty (MOQ) *</label>
                  <input
                    name="minOrderQty"
                    type="number"
                    value={form.minOrderQty || ""}
                    onChange={handleChange}
                    className={inputClass}
                  />
                  {errors.minOrderQty && <p className="text-xs text-red-500 mt-1">{errors.minOrderQty}</p>}
                </div>
                <div>
                  <label className={labelClass}>Measurement Unit *</label>
                  <select
                    name="unit"
                    value={form.unit}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="" disabled>Select unit</option>
                    {UNITS.map(u => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                  {errors.unit && <p className="text-xs text-red-500 mt-1">{errors.unit}</p>}
                </div>
                <div>
                  <label className={labelClass}>Stock / Production Capacity</label>
                  <input
                    name="quantity"
                    type="number"
                    value={form.quantity || 0}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Extra Specifications */}
          <div className={sectionClass}>
             <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-slate-800 dark:text-slate-200">Compliance & Certifications</h2>
            </div>
            <div className="p-6 space-y-6">
               <div>
                <label className={labelClass}>HS Code (Harmonized System)</label>
                <div className="flex gap-2">
                  <input
                    name="hsCode"
                    value={form.hsCode}
                    onChange={handleChange}
                    placeholder="e.g. 8708.30 (Brakes), 4419.90 (Areca Tableware)..."
                    className={inputClass}
                  />
                   <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-lg text-slate-400" title="The Harmonized System classifies traded goods for customs and duties.">
                    <Info className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClass}>Certifications & Standards</label>
                <div className="flex gap-2 mb-4">
                  <input
                    value={newCertification}
                    onChange={(e) => setNewCertification(e.target.value)}
                    placeholder="e.g. ISO/TS 16949, CE Mark, TUV, IATF, FDA Compliant..."
                    className={inputClass}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
                  />
                  <button
                    type="button"
                    onClick={addCertification}
                    className="px-4 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.certifications.filter(c => 
                    !c.startsWith("CUSTOM_CAT:") && 
                    !c.startsWith("SUB_CAT:") && 
                    !c.startsWith("COMPANY:") && 
                    !c.startsWith("BRAND:")
                  ).map((cert, i) => (
                    <span key={i} className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                      {cert}
                      <X className="w-3 h-3 cursor-pointer hover:scale-125 transition-transform" onClick={() => removeCertification(form.certifications.indexOf(cert))} />
                    </span>
                  ))}
                  {form.certifications.filter(c => 
                    !c.startsWith("CUSTOM_CAT:") && 
                    !c.startsWith("SUB_CAT:") && 
                    !c.startsWith("COMPANY:") && 
                    !c.startsWith("BRAND:")
                  ).length === 0 && (
                    <p className="text-xs text-slate-400 italic">No certifications added yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar Column */}
        <div className="space-y-6">
          {/* Media Section */}
          <div className={sectionClass}>
             <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex items-center gap-3">
              <ImageIcon className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-slate-800 dark:text-slate-200">Product Media</h2>
            </div>
            <div className="p-6">
              <ImageUploader
                images={form.images}
                onChange={(urls) => setForm(prev => ({ ...prev, images: urls }))}
                maxFiles={5}
              />
              <p className="text-[11px] text-slate-400 mt-4 leading-relaxed">
                <Info className="w-3 h-3 inline-block mr-1 mb-0.5" />
                Upload up to 5 high-resolution photos of the part/product, packaging, and manufacturer branding.
              </p>
            </div>
          </div>

          {/* Quick Preview Card */}
          <div className={sectionClass + " p-5"}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Live Listing Summary</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-white/5">
                <span className="text-slate-500">Category:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                  {form.category.startsWith("CUSTOM_CAT:") ? customCategory || "Custom" : form.category}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-white/5">
                <span className="text-slate-500">Sub-Category:</span>
                <span className="font-semibold text-primary truncate max-w-[150px]">
                  {subCategory || "—"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-white/5">
                <span className="text-slate-500">Brand / Company:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate max-w-[150px]">
                  {company || "—"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-white/5">
                <span className="text-slate-500">Trade Pricing:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {form.price && form.price > 0 ? `$${form.price} / ${form.unit}` : "Quote on Demand"}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">MOQ:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {form.minOrderQty} {form.unit}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {hideHeader && (
        <div className="mt-8 flex items-center justify-end gap-4 border-t border-slate-200 dark:border-white/10 pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-slate-200 dark:border-white/10 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-primary text-white rounded-lg text-sm font-semibold shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isEdit ? "Update Product" : "Publish Listing"}
            </button>
        </div>
      )}
    </form>
  );
}
