import { NextRequest, NextResponse } from 'next/server';
import { getRazorpayClient } from '@/lib/razorpay';
import { prisma } from '@/lib/prisma';
import { getApiAuthContext } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { auth, error: authError } = await getApiAuthContext(req);
    if (authError || !auth) {
      return authError || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const existingOrderId = body.orderId;
    const items = body.items || [];
    const shippingAddress = body.shippingAddress || '';
    const phone = body.phone || '';

    // Flow A: Quoted B2B Order Payment
    if (existingOrderId) {
      const order = await prisma.order.findUnique({
        where: { id: existingOrderId },
        include: { product: true },
      });

      if (!order) {
        return NextResponse.json({ error: 'Quoted order not found' }, { status: 404 });
      }

      if (order.buyerId !== auth.userId && auth.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized to pay for this quotation' }, { status: 403 });
      }

      if (order.paymentStatus === 'PAID') {
        return NextResponse.json({ error: 'Quotation has already been paid' }, { status: 400 });
      }

      const totalAmount = order.totalPrice;
      const amountInPaise = Math.max(100, Math.round(totalAmount * 100));
      let razorpayOrderId = `rz_mock_${Date.now()}`;
      const isDev = !process.env.RAZORPAY_KEY_ID;

      if (!isDev) {
        const razorpay = getRazorpayClient();
        const rzOrder = await razorpay.orders.create({
          amount: amountInPaise,
          currency: order.currency || 'INR',
          receipt: `rcpt_${order.orderNumber.replace(/[^a-zA-Z0-9]/g, '_')}`,
        });
        razorpayOrderId = rzOrder.id;
      }

      // Link Razorpay Order ID to the existing order
      await prisma.order.update({
        where: { id: order.id },
        data: { razorpayOrderId },
      });

      return NextResponse.json({
        razorpayOrderId,
        amount: amountInPaise,
        currency: order.currency || 'INR',
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
        orderId: order.id,
        isDev,
        isQuotedOrder: true,
        buyerId: auth.userId,
        buyerRole: auth.role,
        shippingAddress,
        phone,
      });
    }
    
    // Flow B: Standard Cart Checkout
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items or orderId are required' }, { status: 400 });
    }

    // Calculate total amount without creating orders
    let totalAmount = 0;
    const validatedItems: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      itemTotal: number;
      sellerId: string;
      currency: string;
    }> = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 404 });
      }

      const unitPrice = auth.role === 'IMPORTER' 
        ? (product.b2bPrice ?? product.price) 
        : (product.regularPrice ?? product.price);
      const itemTotal = unitPrice * item.quantity;
      totalAmount += itemTotal;

      validatedItems.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice,
        itemTotal,
        sellerId: product.exporterId,
        currency: product.currency || 'INR',
      });
    }

    // Create Razorpay Order only (no DB orders yet)
    const amountInPaise = Math.max(100, Math.round(totalAmount * 100));
    let razorpayOrderId = `rz_mock_${Date.now()}`;
    const isDev = !process.env.RAZORPAY_KEY_ID;

    if (!isDev) {
      const razorpay = getRazorpayClient();
      const rzOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `rcpt_${Date.now()}`,
      });
      razorpayOrderId = rzOrder.id;
    }

    return NextResponse.json({
      razorpayOrderId,
      amount: amountInPaise,
      currency: 'INR',
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
      orderId: razorpayOrderId,
      isDev,
      isQuotedOrder: false,
      // Pass validated items back so the confirm endpoint can create orders
      validatedItems,
      buyerId: auth.userId,
      buyerRole: auth.role,
      shippingAddress,
      phone,
    });
  } catch (error: any) {
    console.error('Razorpay Order Creation Error:', error);
    const errorMsg = error?.error?.description || error?.message || 'Failed to communicate with payment gateway';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
