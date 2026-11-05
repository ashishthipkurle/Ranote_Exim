import CategoryDirectory from "../CategoryDirectory";
import { getAllCustomCategories } from "@/lib/custom-categories-server";

export const dynamic = "force-dynamic";

export default async function AddProductPage() {
  let customCategories: string[] = [];
  try {
    customCategories = await getAllCustomCategories();
  } catch (error) {
    console.error("Failed to fetch custom categories:", error);
    customCategories = ["Areca Leaf", "Automobile spare parts"];
  }

  return <CategoryDirectory customCategories={customCategories} />;
}
