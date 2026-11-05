export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getApiAuthContext } from '@/lib/auth-server';
import { productSchema } from '@/lib/validations';
import { Prisma } from '@prisma/client';
import * as fs from 'fs';
import { z } from 'zod';

const LOG_FILE = 'api_debug.log';

function logToFile(message: string) {
  const timestamp = new Date().toISOString();
  try {
    fs.appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`);
  } catch (err) {
    console.error('Failed to log to file:', err);
  }
}

const productCategorySchema = z.enum([
  'CHEMICALS',
  'MACHINES',
  'TEXTILES',
  'MEDICAL',
  'HANDICRAFTS',
  'FOOD',
  'ELECTRONICS',
  'AUTOMOTIVE',
  'CONSTRUCTION',
  'AGRICULTURE',
  'COSMETICS',
  'PLASTICS',
  'ENERGY',
  'LOGISTICS',
  'PACKAGING',
  'METALS',
  'LEATHER',
  'FURNITURE',
  'TOYS',
  'SPORTS',
  'OTHER',
]);

// GET /api/products - Get all products (with filtering)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const subCategory = searchParams.get('subCategory');
    const company = searchParams.get('company');
    const country = searchParams.get('country');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const search = searchParams.get('search');
    const exporterId = searchParams.get('exporterId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    const { auth } = await getApiAuthContext(request);
    const role = auth?.role || 'USER';

    const where: Prisma.ProductWhereInput = { available: true };

    if (category) {
      const parsed = productCategorySchema.safeParse(category);
      if (parsed.success) {
        where.category = parsed.data as any;
      }
    }

    const certFilters: string[] = [];
    if (subCategory && subCategory.trim()) {
      certFilters.push(`SUB_CAT:${subCategory.trim()}`);
    }
    if (company && company.trim()) {
      certFilters.push(`COMPANY:${company.trim()}`);
    }
    if (certFilters.length > 0) {
      where.certifications = {
        hasSome: certFilters,
      };
    }

    if (country) where.originCountry = country;
    if (minPrice || maxPrice) {
      const price: Prisma.FloatFilter = {};
      if (minPrice) price.gte = parseFloat(minPrice);
      if (maxPrice) price.lte = parseFloat(maxPrice);
      where.price = price;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (exporterId) {
      if (exporterId === 'me' && auth?.userId) {
        where.exporterId = auth.userId;
      } else {
        where.exporterId = exporterId;
      }
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          exporter: {
            select: {
              id: true,
              name: true,
              businessName: true,
              country: true,
              verificationStatus: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    const displayProducts = products.map((p: any) => ({
      ...p,
      price: role === 'IMPORTER' ? p.price : (p.regularPrice || p.price)
    }));

    return NextResponse.json({
      products: displayProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/products - Create new product (Exporters only)
export async function POST(request: NextRequest) {
  try {
    const { auth, error: authError } = await getApiAuthContext(request);

    if (authError || !auth) {
      return authError || NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (auth.role !== 'EXPORTER' && auth.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied. Exporters only.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    logToFile(`[POST /api/products] Body: ${JSON.stringify(body, null, 2)}`);
    const validatedData = productSchema.parse(body);

    const product = await prisma.$transaction(async (tx) => {
      const { quantity, category, subCategory, company, brand, ...restOfData } = validatedData as any;

      // Map frontend uppercase categories to Prisma schema ENUM
      const categoryMap: Record<string, string> = {
        'CHEMICALS': 'Chemicals',
        'MACHINES': 'Machines',
        'TEXTILES': 'Textiles',
        'MEDICAL': 'Medical',
        'ELECTRONICS': 'Electronics',
        'AGRICULTURE': 'Agri',
        'CONSTRUCTION': 'Construction',
        'HANDICRAFTS': 'Handicrafts',
        'FOOD': 'Food',
        'AUTOMOTIVE': 'Automotive',
        'COSMETICS': 'Cosmetics',
        'PLASTICS': 'Plastics',
        'ENERGY': 'Energy',
        'LOGISTICS': 'Logistics',
        'PACKAGING': 'Packaging',
        'METALS': 'Metals',
        'LEATHER': 'Leather',
        'FURNITURE': 'Furniture',
        'TOYS': 'Toys',
        'SPORTS': 'Sports',
        'OTHER': 'Other',
      };

      const prismaCategory = categoryMap[category] || "Other";

      // Ensure subCategory and company are encoded in certifications array
      let certs: string[] = Array.isArray(restOfData.certifications) ? [...restOfData.certifications] : [];
      if (subCategory && subCategory.trim() && !certs.some(c => c.startsWith("SUB_CAT:"))) {
        certs.push(`SUB_CAT:${subCategory.trim()}`);
      }
      const companyVal = (company || brand)?.trim();
      if (companyVal && !certs.some(c => c.startsWith("COMPANY:") || c.startsWith("BRAND:"))) {
        certs.push(`COMPANY:${companyVal}`);
      }

      const newProduct = await tx.product.create({
        data: {
          ...restOfData,
          certifications: certs,
          category: prismaCategory,
          stockQty: quantity,
          exporterId: auth.userId,
        } as any,
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
      });

      // Record initial price in history
      await tx.priceHistory.create({
        data: {
          productId: newProduct.id,
          price: newProduct.price,
          currency: "USD",
        } as any,
      });

      return newProduct;
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error: any) {
    console.error('Create product error:', error);
    logToFile(`[POST /api/products] ERROR 500: ${error.message || String(error)}`);
    if (error?.code) logToFile(`[POST /api/products] ERROR CODE: ${error.code}`);
    if (error?.meta) logToFile(`[POST /api/products] ERROR META: ${JSON.stringify(error.meta)}`);

    if (error instanceof z.ZodError) {
      logToFile(`[POST /api/products] Zod Error: ${JSON.stringify(error.errors, null, 2)}`);
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
