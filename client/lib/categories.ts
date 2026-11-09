/**
 * Centralized Category, Sub-Category & Company Definitions & Helpers
 * Ensures 100% parity across Admin Inventory, Marketplace, and Quotation pages.
 */

export interface CategoryMeta {
  key: string;       // Normalized URL query value, e.g. "AGRICULTURE", "AUTOMOTIVE", "PACKAGING", "CUSTOM_CAT:Areca Leaf"
  label: string;     // Friendly display name, e.g. "Agriculture", "Automotive", "Packaging", "Areca Leaf"
  icon: string;      // Material symbol name, e.g. "agriculture", "directions_car", "inventory_2"
  dbEnum: string;    // Prisma ProductCategory enum value
}

export const CATEGORY_DEFINITIONS: Record<string, CategoryMeta> = {
  AGRICULTURE: { key: "AGRICULTURE", label: "Agriculture", icon: "agriculture", dbEnum: "Agri" },
  AGRI: { key: "AGRICULTURE", label: "Agriculture", icon: "agriculture", dbEnum: "Agri" },
  FOOD: { key: "FOOD", label: "Food & Beverage", icon: "restaurant", dbEnum: "Food" },
  TEXTILES: { key: "TEXTILES", label: "Textiles & Apparel", icon: "texture", dbEnum: "Textiles" },
  HANDICRAFTS: { key: "HANDICRAFTS", label: "Handicrafts", icon: "brush", dbEnum: "Handicrafts" },
  PACKAGING: { key: "PACKAGING", label: "Packaging & Disposables", icon: "inventory_2", dbEnum: "Packaging" },
  CHEMICALS: { key: "CHEMICALS", label: "Chemicals", icon: "science", dbEnum: "Chemicals" },
  MACHINES: { key: "MACHINES", label: "Machinery & Equipment", icon: "precision_manufacturing", dbEnum: "Machines" },
  MACHINERY: { key: "MACHINES", label: "Machinery & Equipment", icon: "precision_manufacturing", dbEnum: "Machines" },
  ELECTRONICS: { key: "ELECTRONICS", label: "Electronics & Tech", icon: "devices", dbEnum: "Electronics" },
  MEDICAL: { key: "MEDICAL", label: "Medical & Pharma", icon: "medical_services", dbEnum: "Medical" },
  AUTOMOTIVE: { key: "AUTOMOTIVE", label: "Automotive & Spare Parts", icon: "directions_car", dbEnum: "Automotive" },
  CONSTRUCTION: { key: "CONSTRUCTION", label: "Construction", icon: "architecture", dbEnum: "Construction" },
  COSMETICS: { key: "COSMETICS", label: "Cosmetics & Care", icon: "spa", dbEnum: "Cosmetics" },
  PLASTICS: { key: "PLASTICS", label: "Plastics & Polymers", icon: "recycling", dbEnum: "Plastics" },
  ENERGY: { key: "ENERGY", label: "Energy & Solar", icon: "bolt", dbEnum: "Energy" },
  LOGISTICS: { key: "LOGISTICS", label: "Logistics & Shipping", icon: "local_shipping", dbEnum: "Logistics" },
  METALS: { key: "METALS", label: "Metals & Alloys", icon: "handyman", dbEnum: "Metals" },
  LEATHER: { key: "LEATHER", label: "Leather & Goods", icon: "shopping_bag", dbEnum: "Leather" },
  FURNITURE: { key: "FURNITURE", label: "Furniture & Decor", icon: "chair", dbEnum: "Furniture" },
  TOYS: { key: "TOYS", label: "Toys & Games", icon: "smart_toy", dbEnum: "Toys" },
  SPORTS: { key: "SPORTS", label: "Sports & Fitness", icon: "sports_soccer", dbEnum: "Sports" },
  RAW_MATERIALS: { key: "RAW_MATERIALS", label: "Raw Materials", icon: "inventory", dbEnum: "RawMaterials" },
  RAWMATERIALS: { key: "RAW_MATERIALS", label: "Raw Materials", icon: "inventory", dbEnum: "RawMaterials" },
  CONSUMER_GOODS: { key: "CONSUMER_GOODS", label: "Consumer Goods", icon: "storefront", dbEnum: "ConsumerGoods" },
  CONSUMERGOODS: { key: "CONSUMER_GOODS", label: "Consumer Goods", icon: "storefront", dbEnum: "ConsumerGoods" },
  OTHER: { key: "OTHER", label: "Other", icon: "grid_view", dbEnum: "Other" },
};

export interface IndustryTaxonomy {
  subCategories: string[];
  companies: string[];
}

export const INDUSTRY_TAXONOMY: Record<string, IndustryTaxonomy> = {
  AUTOMOTIVE: {
    subCategories: [
      "Engine & Transmission",
      "Brake Systems & Pads",
      "Suspension & Steering",
      "Electrical & Lighting",
      "Filters & Fluids",
      "Body Panels & Bumpers",
      "Exhaust & Emissions",
      "Wheels & Tires",
      "Cooling & Climate Control",
      "Sensors & Electronics",
      "Interior & Accessories",
    ],
    companies: [
      "Bosch",
      "Brembo",
      "Denso",
      "Valeo",
      "Delphi",
      "Tata Motors",
      "Mahindra",
      "TVS",
      "Motherson Sumi",
      "Uno Minda",
      "MRF",
      "Apollo",
      "OEM / Generic",
    ],
  },
  PACKAGING: {
    subCategories: [
      "Areca Leaf Plates & Bowls",
      "Paper & Corrugated Boxes",
      "Biodegradable & Compostable Bags",
      "Food Containers & Meal Trays",
      "Wooden & Bamboo Cutlery",
      "Bottles, Jars & Caps",
      "Industrial Films & Strapping",
    ],
    companies: [
      "Ranote Eco",
      "Chuk Eco",
      "BioGreen",
      "Evergreen Earth",
      "Ecolife",
      "Pappco Greenware",
      "Generic / OEM",
    ],
  },
  AGRICULTURE: {
    subCategories: [
      "Spices & Condiments",
      "Grains & Cereals",
      "Pulses & Lentils",
      "Tea, Coffee & Cocoa",
      "Fresh Fruits & Vegetables",
      "Oilseeds & Cold-Pressed Oils",
      "Herbs & Botanicals",
      "Dry Fruits & Nuts",
    ],
    companies: [
      "Ranote Agro",
      "Organic India",
      "24 Mantra Organic",
      "Catch",
      "Everest",
      "MDH",
      "Farm Direct / Cooperative",
    ],
  },
  MACHINES: {
    subCategories: [
      "Industrial Processing",
      "Packaging Machinery",
      "Agricultural Equipment",
      "Spare Parts & Tooling",
      "Pumps, Valves & Hydraulics",
      "CNC & Metalworking",
      "Generators & Power Units",
    ],
    companies: [
      "Bosch Rexroth",
      "Siemens",
      "Kirloskar",
      "Larsen & Toubro",
      "Caterpillar",
      "Schneider Electric",
      "ABB",
      "OEM / Custom",
    ],
  },
  TEXTILES: {
    subCategories: [
      "Raw Cotton & Yarns",
      "Woven & Knitted Fabrics",
      "Ready-made Garments",
      "Home Textiles & Linens",
      "Technical & Medical Textiles",
      "Silk & Traditional Weaves",
    ],
    companies: [
      "Arvind Mills",
      "Welspun",
      "Raymond",
      "Vardhman",
      "Trident Group",
      "Alok Industries",
      "Custom Mill / Artisan",
    ],
  },
  CHEMICALS: {
    subCategories: [
      "Industrial Chemicals",
      "Polymers & Resins",
      "Pigments, Dyes & Coatings",
      "Agro-chemicals & Fertilizers",
      "Specialty & Lab Reagents",
      "Cleaning & Sanitation",
    ],
    companies: [
      "Tata Chemicals",
      "UPL",
      "Aarti Industries",
      "Deepak Nitrite",
      "BASF",
      "Dow",
      "Custom Synthesizer",
    ],
  },
  ELECTRONICS: {
    subCategories: [
      "Printed Circuit Boards (PCB)",
      "Semiconductors & ICs",
      "Cables & Connectors",
      "Power Supplies & Inverters",
      "Industrial Automation & PLCs",
      "LED & Solid State Lighting",
      "Audio & Telecom Modules",
    ],
    companies: [
      "Havells",
      "Schneider",
      "Texas Instruments",
      "Samsung Electronics",
      "Polycab",
      "Foxconn",
      "OEM",
    ],
  },
  CONSTRUCTION: {
    subCategories: [
      "Ceramics, Tiles & Sanitaryware",
      "Structural Steel & Rebars",
      "Cement, Concrete & Mortars",
      "Pipes, Fittings & Plumbing",
      "Glass, Aluminum & Facades",
      "Paints, Coatings & Sealants",
    ],
    companies: [
      "UltraTech Cement",
      "Tata Steel",
      "JSW Steel",
      "Kajaria Ceramics",
      "Asian Paints",
      "Supreme Industries",
      "Astral",
    ],
  },
  FOOD: {
    subCategories: [
      "Processed Foods & Snacks",
      "Edible Oils & Ghee",
      "Beverages, Juices & Concentrates",
      "Dairy & Milk Derivatives",
      "Sugar, Jaggery & Sweeteners",
      "Flours, Bakery & Pasta",
    ],
    companies: [
      "Amul",
      "Haldiram's",
      "Patanjali",
      "Britannia",
      "Nestle",
      "ITC",
      "Organic Harvest",
    ],
  },
  MEDICAL: {
    subCategories: [
      "Medical Consumables & PPE",
      "Surgical Instruments & Sets",
      "Active Pharmaceutical Ingredients (API)",
      "Diagnostic Kits & Equipment",
      "Orthopedic Implants & Supports",
      "Ayurvedic & Herbal Formulations",
    ],
    companies: [
      "Sun Pharma",
      "Cipla",
      "Dr. Reddy's",
      "Hindustan Syringes (HMD)",
      "Lupin",
      "Apollo Pharmacy",
    ],
  },
};

/**
 * Returns suggested sub-categories for a given category key
 */
export function getSuggestedSubCategories(categoryKey: string): string[] {
  if (!categoryKey) return [];
  const upper = categoryKey.toUpperCase().replace("CUSTOM_CAT:", "").trim();
  if (INDUSTRY_TAXONOMY[upper]) {
    return INDUSTRY_TAXONOMY[upper].subCategories;
  }
  // Check partial key matches
  for (const [key, tax] of Object.entries(INDUSTRY_TAXONOMY)) {
    if (upper.includes(key) || key.includes(upper)) {
      return tax.subCategories;
    }
  }
  return [
    "General / Standard",
    "Spare Parts & Accessories",
    "Finished Goods",
    "Raw Materials",
  ];
}

/**
 * Returns suggested brands/companies for a given category key
 */
export function getSuggestedCompanies(categoryKey: string): string[] {
  if (!categoryKey) return [];
  const upper = categoryKey.toUpperCase().replace("CUSTOM_CAT:", "").trim();
  if (INDUSTRY_TAXONOMY[upper]) {
    return INDUSTRY_TAXONOMY[upper].companies;
  }
  // Check partial key matches
  for (const [key, tax] of Object.entries(INDUSTRY_TAXONOMY)) {
    if (upper.includes(key) || key.includes(upper)) {
      return tax.companies;
    }
  }
  return [
    "OEM / Generic",
    "Ranote Sourced",
    "Custom Manufacturer",
  ];
}

export interface ExtractedCategory {
  key: string;
  label: string;
  icon: string;
  count: number;
}

export interface ProductMeta {
  categoryKey: string;
  categoryLabel: string;
  categoryIcon: string;
  subCategory: string | null;
  company: string | null;
  customCategory: string | null;
}

/**
 * Extracts all taxonomy metadata (category, sub-category, company) from a product.
 */
export function extractProductMeta(product: {
  name?: string | null;
  category?: string | null;
  certifications?: string[] | null;
}): ProductMeta {
  const cat = resolveProductCategory(product);
  let subCategory: string | null = null;
  let company: string | null = null;
  let customCategory: string | null = null;

  if (product.certifications && Array.isArray(product.certifications)) {
    for (const cert of product.certifications) {
      if (!cert || typeof cert !== "string") continue;
      if (cert.startsWith("CUSTOM_CAT:")) {
        customCategory = cert.replace("CUSTOM_CAT:", "").trim();
      } else if (cert.startsWith("SUB_CAT:")) {
        subCategory = cert.replace("SUB_CAT:", "").trim();
      } else if (cert.startsWith("COMPANY:")) {
        company = cert.replace("COMPANY:", "").trim();
      } else if (cert.startsWith("BRAND:")) {
        company = cert.replace("BRAND:", "").trim();
      }
    }
  }

  return {
    categoryKey: cat.key,
    categoryLabel: cat.label,
    categoryIcon: cat.icon,
    subCategory,
    company,
    customCategory,
  };
}

/**
 * Resolves an individual product's category to canonical { key, label, icon }
 */
export function resolveProductCategory(product: {
  name?: string | null;
  category?: string | null;
  certifications?: string[] | null;
}): { key: string; label: string; icon: string } {
  // Check for custom category in certifications first
  if (product.certifications && Array.isArray(product.certifications)) {
    const customCert = product.certifications.find((c) => c && typeof c === "string" && c.startsWith("CUSTOM_CAT:"));
    if (customCert) {
      const label = customCert.replace("CUSTOM_CAT:", "").trim();
      return {
        key: customCert,
        label: label || "Custom",
        icon: label.toLowerCase().includes("areca") ? "eco" : "category",
      };
    }
  }

  const raw = (product.category || "").trim();
  const upper = raw.toUpperCase();

  if (CATEGORY_DEFINITIONS[upper] && upper !== "OTHER") {
    const meta = CATEGORY_DEFINITIONS[upper];
    return {
      key: meta.key,
      label: meta.label,
      icon: meta.icon,
    };
  }

  // If category is OTHER or unset, check if product name has a known specialty keyword (e.g. Areca Leaf)
  if (upper === "OTHER" || !upper) {
    const nameLower = (product.name || "").toLowerCase();
    if (nameLower.includes("areca")) {
      return {
        key: "CUSTOM_CAT:Areca Leaf",
        label: "Areca Leaf",
        icon: "eco",
      };
    }
  }

  if (raw && upper !== "OTHER") {
    return {
      key: upper,
      label: raw,
      icon: "grid_view",
    };
  }

  return {
    key: "OTHER",
    label: "Other",
    icon: "grid_view",
  };
}

/**
 * Extracts distinct categories that actually exist on products created by admin in the database.
 */
export function extractCategoriesFromProducts(
  products: Array<{ id?: string; name?: string | null; category?: string | null; certifications?: string[] | null }>
): ExtractedCategory[] {
  if (!products || !Array.isArray(products)) return [];
  const map = new Map<string, ExtractedCategory>();

  for (const p of products) {
    const resolved = resolveProductCategory(p);
    const existing = map.get(resolved.key);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(resolved.key, {
        key: resolved.key,
        label: resolved.label,
        icon: resolved.icon,
        count: 1,
      });
    }
  }

  // Sort categories: Standard first (alphabetical), then Custom categories, then "OTHER" at the end
  return Array.from(map.values()).sort((a, b) => {
    if (a.key === "OTHER") return 1;
    if (b.key === "OTHER") return -1;
    const aIsCustom = a.key.startsWith("CUSTOM_CAT:");
    const bIsCustom = b.key.startsWith("CUSTOM_CAT:");
    if (aIsCustom && !bIsCustom) return 1;
    if (!aIsCustom && bIsCustom) return -1;
    return a.label.localeCompare(b.label);
  });
}

export interface ExtractedCompany {
  name: string;
  categoryKey: string;
  count: number;
}

export interface ExtractedTaxonomy {
  categories: ExtractedCategory[];
  subCategories: Array<{ name: string; categoryKey: string; count: number }>;
  companies: Array<{ name: string; categoryKey: string; count: number }>;
}

/**
 * Extracts full taxonomy (Categories, Sub-Categories, and Companies/Brands) from all products.
 */
export function extractTaxonomyFromProducts(
  products: Array<{ id?: string; name?: string | null; category?: string | null; certifications?: string[] | null }>
): ExtractedTaxonomy {
  const categories = extractCategoriesFromProducts(products);
  const subCatMap = new Map<string, { name: string; categoryKey: string; count: number }>();
  const companyMap = new Map<string, { name: string; categoryKey: string; count: number }>();

  if (Array.isArray(products)) {
    for (const p of products) {
      const meta = extractProductMeta(p);

      if (meta.subCategory) {
        const cleanSub = meta.subCategory.trim();
        const key = `${meta.categoryKey}:::${cleanSub.toLowerCase()}`;
        const existing = subCatMap.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          subCatMap.set(key, {
            name: cleanSub,
            categoryKey: meta.categoryKey,
            count: 1,
          });
        }
      }

      if (meta.company) {
        const cleanCompany = meta.company.trim();
        const key = `${meta.categoryKey}:::${cleanCompany.toLowerCase()}`;
        const existing = companyMap.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          companyMap.set(key, {
            name: cleanCompany,
            categoryKey: meta.categoryKey,
            count: 1,
          });
        }
      }
    }
  }

  const subCategories = Array.from(subCatMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  const companies = Array.from(companyMap.values()).sort((a, b) => a.name.localeCompare(b.name));

  return {
    categories,
    subCategories,
    companies,
  };
}

/**
 * Translates a categoryParam string from the URL into a Prisma where filter
 */
export function getPrismaCategoryFilter(categoryParam?: string): any {
  if (!categoryParam) return {};

  if (categoryParam.startsWith("CUSTOM_CAT:")) {
    const customName = categoryParam.replace("CUSTOM_CAT:", "").trim();
    return {
      OR: [
        { certifications: { has: categoryParam } },
        { name: { contains: customName, mode: "insensitive" } },
        { description: { contains: customName, mode: "insensitive" } },
      ],
    };
  }

  const upper = categoryParam.toUpperCase().trim();
  if (CATEGORY_DEFINITIONS[upper]) {
    const dbEnum = CATEGORY_DEFINITIONS[upper].dbEnum;
    return {
      category: dbEnum,
    };
  }

  return {
    category: categoryParam,
  };
}

/**
 * Translates Category, Sub-Category, and Company/Brand URL params into Prisma filters
 */
export function getPrismaMarketFilters({
  categoryParam,
  subCategoryParam,
  companyParam,
}: {
  categoryParam?: string;
  subCategoryParam?: string;
  companyParam?: string;
}): any {
  const andClauses: any[] = [];

  if (categoryParam) {
    andClauses.push(getPrismaCategoryFilter(categoryParam));
  }

  if (subCategoryParam && subCategoryParam.trim().length > 0) {
    const subCat = subCategoryParam.trim();
    andClauses.push({
      OR: [
        { certifications: { has: `SUB_CAT:${subCat}` } },
        { name: { contains: subCat, mode: "insensitive" } },
        { description: { contains: subCat, mode: "insensitive" } },
      ],
    });
  }

  if (companyParam && companyParam.trim().length > 0) {
    const comp = companyParam.trim();
    andClauses.push({
      OR: [
        { certifications: { has: `COMPANY:${comp}` } },
        { certifications: { has: `BRAND:${comp}` } },
        { name: { contains: comp, mode: "insensitive" } },
        { description: { contains: comp, mode: "insensitive" } },
      ],
    });
  }

  if (andClauses.length === 0) return {};
  if (andClauses.length === 1) return andClauses[0];
  return { AND: andClauses };
}
