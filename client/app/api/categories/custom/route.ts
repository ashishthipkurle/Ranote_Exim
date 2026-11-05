import { NextRequest, NextResponse } from "next/server";
import { getAllCustomCategories, saveCustomCategoryToFile, deleteCustomCategoryFromFile } from "@/lib/custom-categories-server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await getAllCustomCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("GET /api/categories/custom error:", error);
    return NextResponse.json({ categories: ["Areca Leaf", "Automobile spare parts"] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = (body.name || "").trim();
    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const updated = saveCustomCategoryToFile(name);
    return NextResponse.json({ success: true, categories: updated });
  } catch (error) {
    console.error("POST /api/categories/custom error:", error);
    return NextResponse.json({ error: "Failed to save category" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name") || "";
    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const updated = deleteCustomCategoryFromFile(name);
    return NextResponse.json({ success: true, categories: updated });
  } catch (error) {
    console.error("DELETE /api/categories/custom error:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
