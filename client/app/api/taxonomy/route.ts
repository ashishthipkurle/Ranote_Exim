import { NextRequest, NextResponse } from "next/server";
import { getAllTaxonomy, saveTaxonomyEntryToFile } from "@/lib/custom-taxonomy-server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || undefined;
    const taxonomy = await getAllTaxonomy(category);
    return NextResponse.json(taxonomy);
  } catch (error) {
    console.error("GET /api/taxonomy error:", error);
    return NextResponse.json(
      {
        subCategories: [],
        brands: [],
        allSubCategoriesByCategory: {},
        allBrandsByCategory: {},
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, subCategory, brand } = body;

    if (!category) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }

    const updated = saveTaxonomyEntryToFile(category, subCategory, brand);
    return NextResponse.json({ success: true, taxonomy: updated });
  } catch (error) {
    console.error("POST /api/taxonomy error:", error);
    return NextResponse.json({ error: "Failed to save taxonomy" }, { status: 500 });
  }
}

