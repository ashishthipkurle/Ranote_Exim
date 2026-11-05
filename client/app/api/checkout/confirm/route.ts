import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyRazorpaySignature } from '@/lib/razorpay';
import { getApiAuthContext } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { auth, error: authError } = await getApiAuthContext(req);
    if (authError || !auth) {
      return authError || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId, // Quoted Order ID if present
      validatedItems,
      shippingAddress,
      phone,
    } = body;

    if (!razorpay_order_id) {
      return NextResponse.json({ error: 'Razorpay Order ID is required' }, { status: 400 });
    }

    // Verify Razorpay signature (skip in dev mode when no secret is configured)
    if (process.env.RAZORPAY_KEY_SECRET && razorpay_order_id && razorpay_payment_id && razorpay_signature) {
      const isValid = verifyRazorpaySignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );

      if (!isValid) {
        console.error('Razorpay signature verification failed');
        return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
      }
    } else if (!process.env.RAZORPAY_KEY_SECRET) {
      console.warn('RAZORPAY_KEY_SECRET not set — skipping payment signature verification (dev mode)');
    }

    // Check if this is a payment for an existing Quoted B2B Order
    const existingQuotedOrder = await prisma.order.findFirst({
      where: {
        OR: [
          ...(orderId ? [{ id: orderId }] : []),
          { razorpayOrderId: razorpay_order_id },
        ],
      },
      include: { product: true, seller: true },
    });

    if (existingQuotedOrder) {
      if (existingQuotedOrder.paymentStatus === 'PAID') {
        return NextResponse.json({ success: true, message: 'Already confirmed', orderId: existingQuotedOrder.id });
      }

      await prisma.order.update({
        where: { id: existingQuotedOrder.id },
        data: {
          orderStatus: 'QUOTE_CONFIRMED',
          paymentStatus: 'PAID',
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id || `mock_${Date.now()}`,
          notes: shippingAddress
            ? `${existingQuotedOrder.notes ? existingQuotedOrder.notes + ' | ' : ''}Ship to: ${shippingAddress}${phone ? ` | Phone: ${phone}` : ''}`
            : existingQuotedOrder.notes,
        },
      });

      // Post confirmation notification message into chat channel
      try {
        await prisma.message.create({
          data: {
            senderId: auth.userId,
            receiverId: existingQuotedOrder.sellerId,
            orderId: existingQuotedOrder.id,
            body: `[PAYMENT_CONFIRMED] Quoted Order #${existingQuotedOrder.orderNumber} has been paid successfully (${existingQuotedOrder.currency} ${existingQuotedOrder.totalPrice}). Exporter will now process shipment.`,
          },
        });
      } catch (e) {
        console.error('Error posting chat payment message:', e);
      }

      return NextResponse.json({
        success: true,
        orderId: existingQuotedOrder.id,
        orderNumber: existingQuotedOrder.orderNumber,
        isQuotedOrder: true,
      });
    }

    // Flow B: Standard Cart Checkout
    if (!validatedItems || !Array.isArray(validatedItems) || validatedItems.length === 0) {
      return NextResponse.json({ error: 'Order items are required' }, { status: 400 });
    }

    // Check if orders already exist for this Razorpay order (idempotency)
    const existingOrders = await prisma.order.findMany({
      where: { razorpayOrderId: razorpay_order_id },
    });

    if (existingOrders.length > 0) {
      if (existingOrders[0].paymentStatus === 'PAID') {
        return NextResponse.json({ success: true, message: 'Already confirmed' });
      }
    }

    // Payment verified — now create orders and decrement inventory in a single transaction
    await prisma.$transaction(async (tx) => {
      for (const item of validatedItems) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        const unitPrice = auth.role === 'IMPORTER' 
          ? (product.b2bPrice ?? product.price) 
          : (product.regularPrice ?? product.price);
        const itemTotal = unitPrice * item.quantity;

        await tx.order.create({
          data: {
            orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            orderType: auth.role === 'IMPORTER' ? 'B2B' : 'B2C',
            buyerId: auth.userId,
            sellerId: item.sellerId,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: unitPrice,
            totalPrice: itemTotal,
            currency: item.currency,
            orderStatus: 'QUOTE_CONFIRMED',
            paymentStatus: 'PAID',
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id || null,
            stripePaymentIntentId: razorpay_order_id,
            notes: shippingAddress
              ? `Ship to: ${shippingAddress}${phone ? ` | Phone: ${phone}` : ''}`
              : null,
          },
        });

        if (product.stockQty >= item.quantity) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stockQty: { decrement: item.quantity } },
          });
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified and orders confirmed',
    });
  } catch (error: any) {
    console.error('Payment confirmation error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process payment confirmation' },
      { status: 500 }
    );
  }
}
