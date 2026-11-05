import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

const DATA_FILE = path.join(process.cwd(), "data", "custom-categories.json");

export function getCustomCategoriesFromFile(): string[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        return list.filter(Boolean).map((s) => String(s).trim());
      }
    }
  } catch (e) {
    console.error("Error reading custom categories file:", e);
  }
  return [];
}

export function saveCustomCategoryToFile(name: string): string[] {
  const trimmed = (name || "").trim();
  if (!trimmed) return getCustomCategoriesFromFile();

  const current = getCustomCategoriesFromFile();
  const exists = current.some((c) => c.toLowerCase() === trimmed.toLowerCase());
  if (!exists) {
    current.push(trimmed);
    try {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify(current, null, 2), "utf-8");
    } catch (e) {
      console.error("Error writing custom categories file:", e);
    }
  }
  return current;
}

export function deleteCustomCategoryFromFile(name: string): string[] {
  const trimmed = (name || "").trim().toLowerCase();
  if (!trimmed) return getCustomCategoriesFromFile();

  const current = getCustomCategoriesFromFile();
  const updated = current.filter((c) => c.toLowerCase() !== trimmed);
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(updated, null, 2), "utf-8");
  } catch (e) {
    console.error("Error updating custom categories file:", e);
  }
  return updated;
}

export async function getAllCustomCategories(): Promise<string[]> {
  const fileCategories = getCustomCategoriesFromFile();
  const catSet = new Set<string>();

  // Add from file first
  fileCategories.forEach((c) => {
    if (c) catSet.add(c);
  });

  // Query database for products that have custom categories
  try {
    const products = await prisma.product.findMany({
      select: { certifications: true },
    });
    products.forEach((p) => {
      p.certifications?.forEach((c) => {
        if (c.startsWith("CUSTOM_CAT:")) {
          const val = c.replace("CUSTOM_CAT:", "").trim();
          if (val) catSet.add(val);
        }
      });
    });
  } catch (err) {
    console.warn("Could not fetch custom categories from DB:", err);
  }

  // Ensure initial defaults if empty
  if (catSet.size === 0) {
    catSet.add("Areca Leaf");
    catSet.add("Automobile spare parts");
  }

  return Array.from(catSet);
}
