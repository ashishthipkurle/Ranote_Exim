import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getSuggestedSubCategories, getSuggestedCompanies } from "@/lib/categories";

const DATA_FILE = path.join(process.cwd(), "data", "custom-taxonomy.json");

export interface TaxonomyFileStructure {
  subCategories: Record<string, string[]>;
  brands: Record<string, string[]>;
}

const DEFAULT_TAXONOMY: TaxonomyFileStructure = {
  subCategories: {
    "CUSTOM_CAT:Automobile spare parts": [
      "Two Wheeler Spare Parts",
      "Four Wheeler Spare Parts",
      "Engine & Transmission",
      "Brake Systems & Pads",
      "Suspension & Steering",
      "Electrical & Lighting"
    ],
    "CUSTOM_CAT:Areca Leaf": [
      "Areca Plates",
      "Areca Bowls",
      "Areca Spoons & Cutlery",
      "Eco Tableware Sets"
    ]
  },
  brands: {
    "CUSTOM_CAT:Automobile spare parts": [
      "All brands available",
      "Bosch",
      "Brembo",
      "Denso",
      "Tata Motors",
      "Minda",
      "OEM Genuine"
    ],
    "CUSTOM_CAT:Areca Leaf": [
      "All brands available",
      "Ranote Eco",
      "GreenLeaf Tableware"
    ]
  }
};

function normalizeKey(key: string): string {
  if (!key) return "OTHER";
  const trimmed = key.trim();
  if (trimmed.startsWith("CUSTOM_CAT:")) {
    return trimmed;
  }
  return trimmed.toUpperCase();
}

export function getCustomTaxonomyFromFile(): TaxonomyFileStructure {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return {
          subCategories: parsed.subCategories || {},
          brands: parsed.brands || {},
        };
      }
    }
  } catch (e) {
    console.error("Error reading custom taxonomy file:", e);
  }
  return DEFAULT_TAXONOMY;
}

export function saveTaxonomyEntryToFile(
  category: string,
  subCategory?: string,
  brand?: string
): TaxonomyFileStructure {
  const fileData = getCustomTaxonomyFromFile();
  const catKey = normalizeKey(category);

  let updated = false;

  if (subCategory && subCategory.trim().length > 0) {
    const cleanSub = subCategory.trim();
    if (!fileData.subCategories[catKey]) {
      fileData.subCategories[catKey] = [];
    }
    const exists = fileData.subCategories[catKey].some(
      (s) => s.toLowerCase() === cleanSub.toLowerCase()
    );
    if (!exists) {
      fileData.subCategories[catKey].push(cleanSub);
      updated = true;
    }
  }

  if (brand && brand.trim().length > 0) {
    const cleanBrand = brand.trim();
    if (!fileData.brands[catKey]) {
      fileData.brands[catKey] = [];
    }
    const exists = fileData.brands[catKey].some(
      (b) => b.toLowerCase() === cleanBrand.toLowerCase()
    );
    if (!exists) {
      fileData.brands[catKey].push(cleanBrand);
      updated = true;
    }
  }

  if (updated) {
    try {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify(fileData, null, 2), "utf-8");
    } catch (e) {
      console.error("Error writing custom taxonomy file:", e);
    }
  }

  return fileData;
}

export async function getAllTaxonomy(activeCategory?: string): Promise<{
  subCategories: string[];
  brands: string[];
  allSubCategoriesByCategory: Record<string, string[]>;
  allBrandsByCategory: Record<string, string[]>;
}> {
  const fileData = getCustomTaxonomyFromFile();
  const subCatMap: Record<string, Set<string>> = {};
  const brandMap: Record<string, Set<string>> = {};

  // 1. Populate from file storage
  for (const [cat, subs] of Object.entries(fileData.subCategories)) {
    const norm = normalizeKey(cat);
    if (!subCatMap[norm]) subCatMap[norm] = new Set();
    subs.forEach((s) => s && subCatMap[norm].add(s.trim()));
  }

  for (const [cat, brands] of Object.entries(fileData.brands)) {
    const norm = normalizeKey(cat);
    if (!brandMap[norm]) brandMap[norm] = new Set();
    brands.forEach((b) => b && brandMap[norm].add(b.trim()));
  }

  // 2. Query Prisma database to collect any subcategories and brands already used in products
  try {
    const products = await prisma.product.findMany({
      where: { deletedAt: null },
      select: { category: true, certifications: true },
    });

    for (const p of products) {
      let pCat = p.category ? normalizeKey(p.category) : "OTHER";
      let pSubCat: string | null = null;
      let pBrand: string | null = null;

      if (p.certifications && Array.isArray(p.certifications)) {
        for (const cert of p.certifications) {
          if (!cert || typeof cert !== "string") continue;
          if (cert.startsWith("CUSTOM_CAT:")) {
            pCat = cert.trim();
          } else if (cert.startsWith("SUB_CAT:")) {
            pSubCat = cert.replace("SUB_CAT:", "").trim();
          } else if (cert.startsWith("COMPANY:") || cert.startsWith("BRAND:")) {
            pBrand = cert.replace(/^COMPANY:|^BRAND:/, "").trim();
          }
        }
      }

      if (pSubCat) {
        if (!subCatMap[pCat]) subCatMap[pCat] = new Set();
        subCatMap[pCat].add(pSubCat);
      }
      if (pBrand) {
        if (!brandMap[pCat]) brandMap[pCat] = new Set();
        brandMap[pCat].add(pBrand);
      }
    }
  } catch (err) {
    console.warn("Could not query products for taxonomy:", err);
  }

  // 3. Merge industry presets
  const standardKey = activeCategory ? normalizeKey(activeCategory) : "OTHER";
  const standardSubs = getSuggestedSubCategories(standardKey);
  const standardBrands = getSuggestedCompanies(standardKey);

  if (!subCatMap[standardKey]) subCatMap[standardKey] = new Set();
  standardSubs.forEach((s) => subCatMap[standardKey].add(s));

  if (!brandMap[standardKey]) brandMap[standardKey] = new Set();
  standardBrands.forEach((b) => brandMap[standardKey].add(b));

  // Convert sets to arrays
  const allSubCategoriesByCategory: Record<string, string[]> = {};
  for (const [cat, set] of Object.entries(subCatMap)) {
    allSubCategoriesByCategory[cat] = Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  const allBrandsByCategory: Record<string, string[]> = {};
  for (const [cat, set] of Object.entries(brandMap)) {
    allBrandsByCategory[cat] = Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  // Determine current active subCategories & brands
  let subCategories: string[] = [];
  let brands: string[] = [];

  if (activeCategory) {
    const key = normalizeKey(activeCategory);
    // Exact or custom match
    const matchingKey = Object.keys(allSubCategoriesByCategory).find(
      (k) => k.toLowerCase() === key.toLowerCase() ||
             k.replace("CUSTOM_CAT:", "").toLowerCase() === key.replace("CUSTOM_CAT:", "").toLowerCase()
    );
    subCategories = matchingKey ? allSubCategoriesByCategory[matchingKey] || [] : [];

    const matchingBrandKey = Object.keys(allBrandsByCategory).find(
      (k) => k.toLowerCase() === key.toLowerCase() ||
             k.replace("CUSTOM_CAT:", "").toLowerCase() === key.replace("CUSTOM_CAT:", "").toLowerCase()
    );
    brands = matchingBrandKey ? allBrandsByCategory[matchingBrandKey] || [] : [];
  } else {
    // Collect all unique
    const subSet = new Set<string>();
    Object.values(allSubCategoriesByCategory).forEach((arr) => arr.forEach((s) => subSet.add(s)));
    subCategories = Array.from(subSet).sort((a, b) => a.localeCompare(b));

    const brandSet = new Set<string>();
    Object.values(allBrandsByCategory).forEach((arr) => arr.forEach((b) => brandSet.add(b)));
    brands = Array.from(brandSet).sort((a, b) => a.localeCompare(b));
  }

  return {
    subCategories,
    brands,
    allSubCategoriesByCategory,
    allBrandsByCategory,
  };
}

