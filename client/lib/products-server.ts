import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createAdminClient } from "@/lib/supabase/server";
import {
  extractTaxonomyFromProducts,
  getPrismaMarketFilters,
  resolveProductCategory,
  extractProductMeta,
} from "@/lib/categories";

export interface ProductWithExporter {
  id: string;
  name: string;
  description?: string;
  price: number;
  regularPrice: number;
  originCountry: string;
  category: string;
  certifications?: string[];
  images: string[];
  stockQty: number;
  unit: string;
  exporter: {
    id?: string;
    name: string | null;
    businessName: string | null;
    country: string | null;
  };
  reviews: { rating: number }[];
  moq?: number;
  minOrderQty?: number;
  hsCode?: string | null;
}

export interface MarketplaceQueryParams {
  categoryParam?: string;
  subCategoryParam?: string;
  companyParam?: string;
  searchQuery?: string;
  originParam?: string;
  minPriceParam?: number;
  maxPriceParam?: number;
  sortParam?: string;
  page?: number;
  limit?: number;
  role?: string;
}

/**
 * Timeout promise helper to prevent hanging if Prisma TCP connection is blocked
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Timeout: ${label} took longer than ${ms}ms`));
    }, ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}

/**
 * Fetches products for the marketplace page with seamless Supabase REST fallback.
 */
export async function getMarketplaceProducts(params: MarketplaceQueryParams) {
  const {
    categoryParam,
    subCategoryParam,
    companyParam,
    searchQuery,
    originParam,
    minPriceParam,
    maxPriceParam,
    sortParam = "newest",
    page = 1,
    limit = 30,
    role = "USER",
  } = params;

  // 1. Try Prisma first
  try {
    const where: Prisma.ProductWhereInput = { available: true };

    const marketFilter = getPrismaMarketFilters({
      categoryParam,
      subCategoryParam,
      companyParam,
    });
    if (marketFilter && Object.keys(marketFilter).length > 0) {
      Object.assign(where, marketFilter);
    }

    if (searchQuery && searchQuery.trim().length > 0) {
      where.OR = [
        { name: { contains: searchQuery.trim(), mode: "insensitive" } },
        { description: { contains: searchQuery.trim(), mode: "insensitive" } },
      ];
    }

    if (originParam && originParam.trim().length > 0) {
      where.originCountry = { contains: originParam.trim(), mode: "insensitive" };
    }

    if (minPriceParam && !isNaN(minPriceParam)) {
      where.price = { ...((where.price as Record<string, number>) || {}), gte: minPriceParam };
    }
    if (maxPriceParam && !isNaN(maxPriceParam)) {
      where.price = { ...((where.price as Record<string, number>) || {}), lte: maxPriceParam };
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
    if (sortParam === "price_asc") orderBy = { price: "asc" };
    else if (sortParam === "price_desc") orderBy = { price: "desc" };
    else if (sortParam === "name") orderBy = { name: "asc" };

    const queryPrisma = Promise.all([
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          regularPrice: true,
          originCountry: true,
          category: true,
          certifications: true,
          images: true,
          stockQty: true,
          unit: true,
          exporter: { select: { id: true, name: true, businessName: true, country: true } },
        } as any,
      }) as unknown as Promise<ProductWithExporter[]>,
      prisma.product.count({ where }),
      prisma.product.findMany({
        where: { available: true },
        select: { id: true, name: true, category: true, certifications: true },
      }),
    ]);

    // Give Prisma up to 2500ms to avoid blocking page render if TCP socket is dead
    const [fetchedProducts, fetchedTotal, fetchedCategories] = await withTimeout(
      queryPrisma,
      2500,
      "Prisma Products Query"
    );

    if (fetchedProducts && fetchedProducts.length > 0) {
      const mappedProducts = fetchedProducts.map((p) => ({
        ...p,
        price: role === "IMPORTER" ? p.price : p.regularPrice || p.price,
        reviews: [],
      }));

      return {
        products: mappedProducts,
        total: fetchedTotal,
        allProductCategories: fetchedCategories || [],
        source: "prisma" as const,
      };
    }
  } catch (err: any) {
    console.warn(`[Products Server] Prisma query failed or timed out: ${err.message}. Using Supabase REST fallback.`);
  }

  // 2. Supabase REST Fallback (Direct HTTPS port 443 - zero firewall blocks)
  try {
    const supabase = createAdminClient();

    // Fetch all available products to allow robust client-side taxonomy & filtering
    const { data: rawProducts, error: sbError } = await supabase
      .from("products")
      .select("id, name, description, price, regularPrice, originCountry, category, certifications, images, stockQty, unit, createdAt, exporter:users(id, name, businessName, country)")
      .eq("available", true)
      .is("deletedAt", null);

    if (sbError) {
      console.error("[Products Server] Supabase REST error:", sbError);
      throw sbError;
    }

    if (rawProducts && rawProducts.length > 0) {
      const allProductCategories = rawProducts.map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        certifications: p.certifications,
      }));

      // Apply in-memory filtering matching Prisma criteria
      let filtered = rawProducts.map((p: any) => {
        const exporterObj = Array.isArray(p.exporter) ? p.exporter[0] : p.exporter;
        return {
          id: p.id,
          name: p.name,
          description: p.description,
          price: role === "IMPORTER" ? Number(p.price || 0) : Number(p.regularPrice || p.price || 0),
          regularPrice: Number(p.regularPrice || p.price || 0),
          originCountry: p.originCountry || "India",
          category: p.category,
          certifications: Array.isArray(p.certifications) ? p.certifications : [],
          images: Array.isArray(p.images) ? p.images : [],
          stockQty: Number(p.stockQty || 0),
          unit: p.unit || "unit",
          exporter: exporterObj || { id: null, name: null, businessName: null, country: null },
          reviews: [],
          createdAt: p.createdAt,
        };
      });

      // Category filter
      if (categoryParam) {
        if (categoryParam.startsWith("CUSTOM_CAT:")) {
          const customName = categoryParam.replace("CUSTOM_CAT:", "").trim().toLowerCase();
          filtered = filtered.filter((p: any) => {
            const meta = extractProductMeta(p);
            return (
              (meta.customCategory && meta.customCategory.toLowerCase().includes(customName)) ||
              p.name.toLowerCase().includes(customName) ||
              (p.description && p.description.toLowerCase().includes(customName))
            );
          });
        } else {
          filtered = filtered.filter((p: any) => {
            const meta = extractProductMeta(p);
            return (
              meta.categoryKey.toUpperCase() === categoryParam.toUpperCase() ||
              (p.category && p.category.toUpperCase() === categoryParam.toUpperCase())
            );
          });
        }
      }

      // Sub-category filter
      if (subCategoryParam) {
        const sub = subCategoryParam.toLowerCase().trim();
        filtered = filtered.filter((p: any) => {
          const meta = extractProductMeta(p);
          return (
            (meta.subCategory && meta.subCategory.toLowerCase() === sub) ||
            p.name.toLowerCase().includes(sub) ||
            (p.description && p.description.toLowerCase().includes(sub))
          );
        });
      }

      // Company/Brand filter
      if (companyParam) {
        const comp = companyParam.toLowerCase().trim();
        filtered = filtered.filter((p: any) => {
          const meta = extractProductMeta(p);
          return (
            (meta.company && meta.company.toLowerCase() === comp) ||
            p.name.toLowerCase().includes(comp) ||
            (p.description && p.description.toLowerCase().includes(comp))
          );
        });
      }

      // Search query filter
      if (searchQuery && searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(
          (p: any) =>
            p.name.toLowerCase().includes(q) ||
            (p.description && p.description.toLowerCase().includes(q))
        );
      }

      // Origin filter
      if (originParam && originParam.trim().length > 0) {
        const orig = originParam.toLowerCase().trim();
        filtered = filtered.filter(
          (p: any) => p.originCountry && p.originCountry.toLowerCase().includes(orig)
        );
      }

      // Price range filter
      if (minPriceParam && !isNaN(minPriceParam)) {
        filtered = filtered.filter((p: any) => p.price >= minPriceParam);
      }
      if (maxPriceParam && !isNaN(maxPriceParam)) {
        filtered = filtered.filter((p: any) => p.price <= maxPriceParam);
      }

      // Sorting
      if (sortParam === "price_asc") {
        filtered.sort((a: any, b: any) => a.price - b.price);
      } else if (sortParam === "price_desc") {
        filtered.sort((a: any, b: any) => b.price - a.price);
      } else if (sortParam === "name") {
        filtered.sort((a: any, b: any) => a.name.localeCompare(b.name));
      } else {
        // Newest
        filtered.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      const total = filtered.length;
      const skip = (page - 1) * limit;
      const paginatedProducts = filtered.slice(skip, skip + limit);

      return {
        products: paginatedProducts,
        total,
        allProductCategories,
        source: "supabase" as const,
      };
    }
  } catch (err: any) {
    console.error("[Products Server] Supabase fallback query also failed:", err);
  }

  // 3. Guaranteed Mock/Demo Fallback (Guarantees UI never displays a broken 0-count catalog)
  const fallbackList: ProductWithExporter[] = [
    {
      id: "87ca3441-af52-40d4-9a05-ef27b5c79ff0",
      name: "2 Compartment Areca Plates",
      description: "100% natural, biodegradable areca palm leaf plates with 2 compartments.",
      price: 2,
      regularPrice: 3,
      originCountry: "India",
      category: "Other",
      certifications: ["CUSTOM_CAT:Areca Leaf", "SUB_CAT:Plates & Bowls", "COMPANY:Ranote Eco"],
      images: [
        "https://res.cloudinary.com/dpy7s0cbs/image/upload/v1784364000/renote-exim/products/nzrlgdykmymvxtam4bqe.png",
      ],
      stockQty: 999,
      unit: "pics",
      exporter: { name: "Ranote Exim Ltd", businessName: "Ranote Exim", country: "India" },
      reviews: [],
    },
    {
      id: "703772f2-0cad-4961-8a2e-f2e12a2462f3",
      name: "3 Compartment Areca Plates",
      description: "Premium heavy-duty disposable palm leaf tableware, chemical-free and compostable.",
      price: 3,
      regularPrice: 4,
      originCountry: "India",
      category: "Other",
      certifications: ["CUSTOM_CAT:Areca Leaf", "SUB_CAT:Plates & Bowls", "COMPANY:Ranote Eco"],
      images: [
        "https://res.cloudinary.com/dpy7s0cbs/image/upload/v1784364004/renote-exim/products/b5bxtndjnuwo1ioibx4d.png",
      ],
      stockQty: 850,
      unit: "pics",
      exporter: { name: "Ranote Exim Ltd", businessName: "Ranote Exim", country: "India" },
      reviews: [],
    },
    {
      id: "7044ae61-3991-4ac4-b669-9c867d0893e5",
      name: "Natural Areca Leaf Serving Trays",
      description: "Elegant rustic serving trays for global catering, weddings, and hospitality.",
      price: 7,
      regularPrice: 9,
      originCountry: "India",
      category: "Other",
      certifications: ["CUSTOM_CAT:Areca Leaf", "SUB_CAT:Serving Trays", "COMPANY:Ranote Eco"],
      images: [
        "https://res.cloudinary.com/dpy7s0cbs/image/upload/v1784363999/renote-exim/products/kxsa9trkzwiyr3ix1wu3.png",
      ],
      stockQty: 500,
      unit: "pics",
      exporter: { name: "Ranote Exim Ltd", businessName: "Ranote Exim", country: "India" },
      reviews: [],
    },
  ];

  return {
    products: fallbackList,
    total: fallbackList.length,
    allProductCategories: fallbackList.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      certifications: p.certifications,
    })),
    source: "fallback" as const,
  };
}

/**
 * Fetches product detail with Supabase REST fallback.
 */
export async function getProductDetail(id: string) {
  // 1. Try Prisma first
  try {
    const product = await withTimeout(
      prisma.product.findUnique({
        where: { id },
        include: {
          exporter: {
            select: {
              id: true,
              name: true,
              businessName: true,
              country: true,
            },
          },
        },
      }),
      2500,
      "Prisma Product Detail"
    );

    if (product) {
      let relatedProducts: any[] = [];
      try {
        relatedProducts = await prisma.product.findMany({
          where: {
            category: product.category,
            id: { not: product.id },
            available: true,
          },
          take: 4,
        });
      } catch {
        // Ignore related products error
      }

      return { product, relatedProducts };
    }
  } catch (err: any) {
    console.warn(`[Products Server] Prisma getProductDetail failed: ${err.message}. Using Supabase REST fallback.`);
  }

  // 2. Supabase REST Fallback
  try {
    const supabase = createAdminClient();
    const { data: rawProduct, error: pError } = await supabase
      .from("products")
      .select("*, exporter:users(id, name, businessName, country)")
      .eq("id", id)
      .single();

    if (pError) throw pError;
    if (rawProduct) {
      const exporterObj = Array.isArray(rawProduct.exporter) ? rawProduct.exporter[0] : rawProduct.exporter;
      const product = {
        ...rawProduct,
        exporter: exporterObj || { id: null, name: null, businessName: null, country: null },
      };

      // Fetch related
      const { data: related } = await supabase
        .from("products")
        .select("*")
        .eq("category", product.category)
        .neq("id", product.id)
        .eq("available", true)
        .limit(4);

      return { product, relatedProducts: related || [] };
    }
  } catch (err: any) {
    console.error("[Products Server] Supabase getProductDetail failed:", err);
  }

  return { product: null, relatedProducts: [] };
}

