import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getApiAuthContext } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { auth, error: authError } = await getApiAuthContext(req);
    if (authError || !auth) {
      return authError || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (auth.role !== 'EXPORTER' && auth.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Exporter or Admin required.' }, { status: 403 });
    }

    const body = await req.json();
    const { partnerId, productId, quantity, unitPrice, totalPrice, currency, notes } = body;

    if (!partnerId) {
      return NextResponse.json({ error: 'Partner ID (Buyer) is required' }, { status: 400 });
    }
    if (!productId) {
      return NextResponse.json({ error: 'Product is required' }, { status: 400 });
    }

    const numQty = parseInt(quantity) || 1;
    const numTotal = parseFloat(totalPrice) || 0;
    const numUnit = parseFloat(unitPrice) || (numQty > 0 ? numTotal / numQty : 0);

    // Verify buyer
    const buyer = await prisma.user.findUnique({
      where: { id: partnerId },
      select: { id: true, name: true, email: true },
    });
    if (!buyer) {
      return NextResponse.json({ error: 'Buyer node not found in registry' }, { status: 404 });
    }

    // Verify product
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, images: true, unit: true, category: true },
    });
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Generate unique order number
    const orderNumber = `QTE-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

    // Create the B2B Quoted Order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        orderType: 'B2B',
        buyerId: buyer.id,
        sellerId: auth.userId,
        productId: product.id,
        quantity: numQty,
        unitPrice: numUnit,
        totalPrice: numTotal,
        currency: currency || 'INR',
        orderStatus: 'QUOTE_REQUESTED',
        paymentStatus: 'PENDING',
        notes: notes || null,
      },
      include: {
        product: { select: { id: true, name: true, images: true, unit: true } },
      },
    });

    // Structure the quotation offer payload for chat
    const offerPayload = {
      type: 'QUOTATION_OFFER',
      orderId: order.id,
      orderNumber: order.orderNumber,
      productId: product.id,
      productName: product.name,
      productImage: product.images?.[0] || null,
      quantity: numQty,
      unit: product.unit || 'units',
      unitPrice: numUnit,
      totalPrice: numTotal,
      currency: currency || 'INR',
      notes: notes || '',
      createdAt: new Date().toISOString(),
    };

    // Post to chat messages
    const message = await prisma.message.create({
      data: {
        senderId: auth.userId,
        receiverId: buyer.id,
        orderId: order.id,
        body: `[QUOTATION_OFFER:${JSON.stringify(offerPayload)}]`,
      },
    });

    return NextResponse.json({
      success: true,
      order,
      message,
    });
  } catch (error: any) {
    console.error('Send Quotation Offer Error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to send quotation offer' }, { status: 500 });
  }
}
