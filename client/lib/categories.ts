/**
 * Centralized Category Definitions & Helpers
 * Ensures 100% parity across Admin Inventory, Marketplace, and Quotation pages.
 */

export interface CategoryMeta {
  key: string;       // Normalized URL query value, e.g. "AGRICULTURE", "HANDICRAFTS", "PACKAGING", "CUSTOM_CAT:Areca Leaf"
  label: string;     // Friendly display name, e.g. "Agriculture", "Handicrafts", "Packaging", "Areca Leaf"
  icon: string;      // Material symbol name, e.g. "agriculture", "brush", "inventory_2"
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
  MACHINES: { key: "MACHINES", label: "Machinery", icon: "precision_manufacturing", dbEnum: "Machines" },
  MACHINERY: { key: "MACHINES", label: "Machinery", icon: "precision_manufacturing", dbEnum: "Machines" },
  ELECTRONICS: { key: "ELECTRONICS", label: "Electronics", icon: "devices", dbEnum: "Electronics" },
  MEDICAL: { key: "MEDICAL", label: "Medical & Pharma", icon: "medical_services", dbEnum: "Medical" },
  AUTOMOTIVE: { key: "AUTOMOTIVE", label: "Automotive", icon: "directions_car", dbEnum: "Automotive" },
  CONSTRUCTION: { key: "CONSTRUCTION", label: "Construction", icon: "architecture", dbEnum: "Construction" },
  COSMETICS: { key: "COSMETICS", label: "Cosmetics & Care", icon: "spa", dbEnum: "Cosmetics" },
  PLASTICS: { key: "PLASTICS", label: "Plastics", icon: "recycling", dbEnum: "Plastics" },
  ENERGY: { key: "ENERGY", label: "Energy", icon: "bolt", dbEnum: "Energy" },
  LOGISTICS: { key: "LOGISTICS", label: "Logistics", icon: "local_shipping", dbEnum: "Logistics" },
  METALS: { key: "METALS", label: "Metals", icon: "handyman", dbEnum: "Metals" },
  LEATHER: { key: "LEATHER", label: "Leather", icon: "shopping_bag", dbEnum: "Leather" },
  FURNITURE: { key: "FURNITURE", label: "Furniture", icon: "chair", dbEnum: "Furniture" },
  TOYS: { key: "TOYS", label: "Toys", icon: "smart_toy", dbEnum: "Toys" },
  SPORTS: { key: "SPORTS", label: "Sports", icon: "sports_soccer", dbEnum: "Sports" },
  RAW_MATERIALS: { key: "RAW_MATERIALS", label: "Raw Materials", icon: "inventory", dbEnum: "RawMaterials" },
  RAWMATERIALS: { key: "RAW_MATERIALS", label: "Raw Materials", icon: "inventory", dbEnum: "RawMaterials" },
  CONSUMER_GOODS: { key: "CONSUMER_GOODS", label: "Consumer Goods", icon: "storefront", dbEnum: "ConsumerGoods" },
  CONSUMERGOODS: { key: "CONSUMER_GOODS", label: "Consumer Goods", icon: "storefront", dbEnum: "ConsumerGoods" },
  OTHER: { key: "OTHER", label: "Other", icon: "grid_view", dbEnum: "Other" },
};

export interface ExtractedCategory {
  key: string;
  label: string;
  icon: string;
  count: number;
}

/**
 * Resolves an individual product's category to canonical { key, label, icon }
 */
export function resolveProductCategory(product: {
  category?: string | null;
  certifications?: string[] | null;
}): { key: string; label: string; icon: string } {
  // Check for custom category in certifications first
  if (product.certifications && Array.isArray(product.certifications)) {
    const customCert = product.certifications.find((c) => c && c.startsWith("CUSTOM_CAT:"));
    if (customCert) {
      const label = customCert.replace("CUSTOM_CAT:", "").trim();
      return {
        key: customCert,
        label: label || "Custom",
        icon: "category",
      };
    }
  }

  const raw = (product.category || "").trim();
  const upper = raw.toUpperCase();

  if (CATEGORY_DEFINITIONS[upper]) {
    const meta = CATEGORY_DEFINITIONS[upper];
    return {
      key: meta.key,
      label: meta.label,
      icon: meta.icon,
    };
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
  products: Array<{ category?: string | null; certifications?: string[] | null }>
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

/**
 * Translates a categoryParam string from the URL into a Prisma where filter
 */
export function getPrismaCategoryFilter(categoryParam?: string): any {
  if (!categoryParam) return {};

  if (categoryParam.startsWith("CUSTOM_CAT:")) {
    return {
      certifications: { has: categoryParam },
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

