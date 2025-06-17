import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyToken, isAdmin } from '@/lib/auth';

// PUT /api/orders/[id]/cancel - Cancel order (user or admin)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Authenticate
    const authResult = await verifyToken(req);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const orderId = params.id;
    if (!orderId || !ObjectId.isValid(orderId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Find the order
    const order = await db.collection('orders').findOne({ _id: new ObjectId(orderId) });
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Only the owner or admin can cancel
    const isOwner = order.userId?.toString() === authResult.user.id;
    if (!isOwner && !isAdmin(authResult.user)) {
      return NextResponse.json(
        { success: false, error: 'You are not allowed to cancel this order' },
        { status: 403 }
      );
    }

    // Only allow cancelling from certain statuses
    const canCancel = ['pending', 'confirmed'].includes(order.status);
    if (!canCancel) {
      return NextResponse.json(
        { success: false, error: 'Order cannot be cancelled at this stage' },
        { status: 400 }
      );
    }

    // Update order status
    const now = new Date();
    await db.collection('orders').updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          status: 'cancelled',
          updatedAt: now
        }
      }
    );

    // Optionally: Restore product stock (if needed)
    // for (const item of order.items) {
    //   await db.collection('products').updateOne(
    //     { _id: new ObjectId(item.productId) },
    //     { $inc: { stock: item.quantity }, $set: { updatedAt: now } }
    //   );
    // }

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel order' },
      { status: 500 }
    );
  }
}