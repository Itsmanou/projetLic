import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  try {
    const { db } = await connectToDatabase();

    // Get total products
    const totalProducts = await db.collection('products').countDocuments({ isActive: { $ne: false } });

    // Get total categories
    const categories = await db.collection('products').distinct('category', { isActive: { $ne: false } });
    const totalCategories = categories.length;

    // Get total orders
    const totalOrders = await db.collection('orders').countDocuments();

    // Calculate average rating (if you have ratings)
    const ratingsResult = await db.collection('products').aggregate([
      { $match: { isActive: { $ne: false }, rating: { $exists: true } } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]).toArray();

    const averageRating = ratingsResult.length > 0 ? Math.round(ratingsResult[0].avgRating * 10) / 10 : 4.8;

    return NextResponse.json({
      success: true,
      data: {
        totalProducts,
        totalCategories,
        totalOrders,
        averageRating
      }
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}