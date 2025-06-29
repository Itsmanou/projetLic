// src/app/api/payments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyToken } from '@/lib/auth';

// POST /api/payments/initiate - Initiate payment
export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyToken(req);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { orderId, paymentMethod, phoneNumber } = await req.json();

    if (!orderId || !paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'Order ID and payment method are required' },
        { status: 400 }
      );
    }

    if (['mtn_money', 'orange_money'].includes(paymentMethod) && !phoneNumber) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required for mobile money payments' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Get order details
    const order = await db.collection('orders').findOne({
      _id: new ObjectId(orderId),
      userId: new ObjectId(authResult.user.id)
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.paymentStatus === 'paid') {
      return NextResponse.json(
        { success: false, error: 'Order is already paid' },
        { status: 400 }
      );
    }

    // Create payment record
    const payment = {
      orderId: new ObjectId(orderId),
      userId: new ObjectId(authResult.user.id),
      amount: order.totalAmount,
      paymentMethod,
      phoneNumber,
      status: 'pending',
      transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('payments').insertOne(payment);

    // Simulate payment processing based on method
    let paymentResponse;
    
    if (paymentMethod === 'mtn_money') {
      paymentResponse = await processMTNPayment(payment);
    } else if (paymentMethod === 'orange_money') {
      paymentResponse = await processOrangePayment(payment);
    } else if (paymentMethod === 'cash_on_delivery') {
      paymentResponse = {
        success: true,
        status: 'pending',
        message: 'Cash on delivery order confirmed'
      };
    }

    // Update payment status
    await db.collection('payments').updateOne(
      { _id: result.insertedId },
      {
        $set: {
          status: paymentResponse?.status ?? 'pending',
          response: paymentResponse ?? {},
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        paymentId: result.insertedId,
        transactionId: payment.transactionId,
        status: paymentResponse?.status ?? 'pending',
        message: paymentResponse?.message ?? 'Payment processing'
      }
    });

  } catch (error) {
    console.error('Error initiating payment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initiate payment' },
      { status: 500 }
    );
  }
}

// POST /api/payments/callback - Payment callback (webhook)
export async function PUT(req: NextRequest) {
  try {
    const { transactionId, status, externalTransactionId } = await req.json();

    if (!transactionId || !status) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID and status are required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Find payment
    const payment = await db.collection('payments').findOne({ transactionId });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Update payment status
    await db.collection('payments').updateOne(
      { _id: payment._id },
      {
        $set: {
          status,
          externalTransactionId,
          updatedAt: new Date()
        }
      }
    );

    // Update order payment status
    const orderPaymentStatus = status === 'success' ? 'paid' : 
                              status === 'failed' ? 'failed' : 'pending';

    await db.collection('orders').updateOne(
      { _id: payment.orderId },
      {
        $set: {
          paymentStatus: orderPaymentStatus,
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Payment status updated successfully'
    });

  } catch (error) {
    console.error('Error processing payment callback:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process payment callback' },
      { status: 500 }
    );
  }
}

// Simulate MTN Mobile Money payment processing
async function processMTNPayment(payment: any) {
  // In a real implementation, you would integrate with MTN Mobile Money API
  // For demo purposes, we'll simulate a response
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Simulate success/failure (90% success rate for demo)
  const isSuccess = Math.random() > 0.1;
  
  return {
    success: isSuccess,
    status: isSuccess ? 'success' : 'failed',
    message: isSuccess 
      ? `Payment of ${payment.amount} FCFA initiated successfully via MTN Mobile Money to ${payment.phoneNumber}`
      : 'Payment failed. Please try again or contact customer support.',
    provider: 'MTN_MOBILE_MONEY',
    externalTransactionId: isSuccess ? `MTN-${Date.now()}` : null
  };
}

// Simulate Orange Money payment processing
async function processOrangePayment(payment: any) {
  // In a real implementation, you would integrate with Orange Money API
  // For demo purposes, we'll simulate a response
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Simulate success/failure (90% success rate for demo)
  const isSuccess = Math.random() > 0.1;
  
  return {
    success: isSuccess,
    status: isSuccess ? 'success' : 'failed',
    message: isSuccess 
      ? `Payment of ${payment.amount} FCFA initiated successfully via Orange Money to ${payment.phoneNumber}`
      : 'Payment failed. Please try again or contact customer support.',
    provider: 'ORANGE_MONEY',
    externalTransactionId: isSuccess ? `OM-${Date.now()}` : null
  };
}