export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getApiAuthContext } from '@/lib/auth-server';
import { productSchema } from '@/lib/validations';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export async function GET(
 request: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
 const { id } = await params;
 const auth = await getApiAuthContext(request).then(res => res.auth);
 const role = auth?.role || 'USER';

 const product = await prisma.product.findUnique({
 where: { id },
 include: {
 exporter: {
 select: {
 id: true,
 name: true,
 businessName: true,
 country: true,
 verificationStatus: true,
 email: true,
 phone: true,
 },
 },
 },
 });

 if (!product) {
 return NextResponse.json(
 { error: 'Product not found' },
 { status: 404 }
 );
 }

 const displayProduct = {
 ...product,
 price: role === 'IMPORTER' ? (product.b2bPrice || product.price) : (product.b2cPrice || product.price)
 };

 return NextResponse.json({ product: displayProduct });
 } catch (error) {
 console.error('Get product error:', error);
  return NextResponse.json(
  { error: 'Failed to fetch product', details: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined },
  { status: 500 }
  );
 }
}

export async function PUT(
 request: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
 const { id } = await params;
 const { auth, error: authError } = await getApiAuthContext(request);

 if (authError || !auth) {
 return authError || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 }

 const existingProduct = await prisma.product.findUnique({
 where: { id },
 });

 if (!existingProduct) {
 return NextResponse.json(
 { error: 'Product not found' },
 { status: 404 }
 );
 }

 if (existingProduct.exporterId !== auth.userId && auth.role !== 'ADMIN') {
 return NextResponse.json(
 { error: 'Access denied' },
 { status: 403 }
 );
 }

  const body = await request.json();
  console.log("PUT /api/products/[id] received body:", JSON.stringify(body, null, 2));

  let validatedData;
  try {
    validatedData = productSchema.partial().parse(body);
  } catch (parseError: any) {
    console.error("Zod Parsing Error:", parseError);
    return NextResponse.json(
      { 
        error: `Validation failed: ${parseError.errors?.[0]?.message || parseError.message}`, 
        details: parseError.errors 
      },
      { status: 400 }
    );
  }

  // Map frontend 'quantity' field to Prisma 'stockQty'
  const prismaData: any = { ...validatedData };
  if (prismaData.quantity !== undefined) {
    prismaData.stockQty = prismaData.quantity;
    delete prismaData.quantity;
  }

  const subCatVal = prismaData.subCategory !== undefined ? (prismaData.subCategory?.trim() || "") : undefined;
  const compVal = (prismaData.company !== undefined || prismaData.brand !== undefined) 
    ? ((prismaData.company || prismaData.brand)?.trim() || "") 
    : undefined;
  delete prismaData.subCategory;
  delete prismaData.company;
  delete prismaData.brand;

  if (prismaData.certifications !== undefined || subCatVal !== undefined || compVal !== undefined) {
    let certs: string[] = Array.isArray(prismaData.certifications)
      ? [...prismaData.certifications]
      : [...(existingProduct.certifications || [])];

    if (subCatVal !== undefined) {
      certs = certs.filter(c => !c.startsWith("SUB_CAT:"));
      if (subCatVal) certs.push(`SUB_CAT:${subCatVal}`);
    }

    if (compVal !== undefined) {
      certs = certs.filter(c => !c.startsWith("COMPANY:") && !c.startsWith("BRAND:"));
      if (compVal) certs.push(`COMPANY:${compVal}`);
    }

    prismaData.certifications = certs;
  }

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

  if (prismaData.category) {
    prismaData.category = categoryMap[prismaData.category] || "Other";
  }

  const product = await prisma.$transaction(async (tx) => {
    const updatedProduct = await tx.product.update({
      where: { id },
      data: prismaData,
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

    if (validatedData.price !== undefined && validatedData.price !== existingProduct.price) {
      await tx.priceHistory.create({
        data: {
          productId: updatedProduct.id,
          price: validatedData.price,
          currency: existingProduct.currency || "USD",
        },
      });
    }

    return updatedProduct;
  });

  return NextResponse.json({ product });
 } catch (error: unknown) {
  console.error('Update product error:', error);
  return NextResponse.json(
    { error: 'Failed to update product', details: error instanceof Error ? error.message : String(error) },
    { status: 500 }
  );
 }
}

export async function DELETE(
 request: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
 const { id } = await params;
 const { auth, error: authError } = await getApiAuthContext(request);

 if (!auth) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 }

 const existingProduct = await prisma.product.findUnique({
 where: { id },
 });

 if (!existingProduct) {
 return NextResponse.json(
 { error: 'Product not found' },
 { status: 404 }
 );
 }

 if (existingProduct.exporterId !== auth.userId && auth.role !== 'ADMIN') {
 return NextResponse.json(
 { error: 'Access denied' },
 { status: 403 }
 );
 }

 await prisma.product.delete({
 where: { id },
 });

 return NextResponse.json({ message: 'Product deleted successfully' });
 } catch (error) {
 console.error('Delete product error:', error);
 return NextResponse.json(
 { error: 'Failed to delete product' },
 { status: 500 }
 );
 }
}
