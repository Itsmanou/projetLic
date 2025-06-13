// src/app/api/admin/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyToken, isAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyToken(req);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!isAdmin(authResult.user)) {
      return NextResponse.json(
        { success: false, error: 'Admin privileges required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '30'; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const { db } = await connectToDatabase();

    // Get overview statistics
    const [
      totalProducts,
      totalUsers,
      totalOrders,
      totalRevenue,
      lowStockProducts,
      recentOrders,
      topProducts,
      salesByCategory,
      ordersOverTime
    ] = await Promise.all([
      // Total products
      db.collection('products').countDocuments({ isActive: true }),
      
      // Total users
      db.collection('users').countDocuments({ role: 'user' }),
      
      // Total orders in period
      db.collection('orders').countDocuments({
        createdAt: { $gte: startDate }
      }),
      
      // Total revenue in period
      db.collection('orders').aggregate([
        { $match: { createdAt: { $gte: startDate }, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]).toArray(),
      
      // Low stock products
      db.collection('products').find({
        isActive: true,
        $expr: { $lte: ['$stock', '$minStock'] }
      }).limit(10).toArray(),
      
      // Recent orders
      db.collection('orders').aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $addFields: {
            user: { $arrayElemAt: ['$user', 0] }
          }
        },
        {
          $project: {
            orderNumber: 1,
            totalAmount: 1,
            status: 1,
            createdAt: 1,
            'user.name': 1,
            'user.email': 1
          }
        },
        { $sort: { createdAt: -1 } },
        { $limit: 10 }
      ]).toArray(),
      
      // Top selling products
      db.collection('orders').aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.productId',
            totalSold: { $sum: '$items.quantity' },
            revenue: { $sum: '$items.subtotal' },
            productName: { $first: '$items.name' }
          }
        },
        { $sort: { totalSold: -1 } },
        { $limit: 10 }
      ]).toArray(),
      
      // Sales by category
      db.collection('orders').aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'products',
            localField: 'items.productId',
            foreignField: '_id',
            as: 'product'
          }
        },
        {
          $addFields: {
            product: { $arrayElemAt: ['$product', 0] }
          }
        },
        {
          $group: {
            _id: '$product.category',
            totalSales: { $sum: '$items.quantity' },
            revenue: { $sum: '$items.subtotal' }
          }
        },
        { $sort: { revenue: -1 } }
      ]).toArray(),
      
      // Orders over time (daily for last 30 days)
      db.collection('orders').aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            count: { $sum: 1 },
            revenue: { $sum: '$totalAmount' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]).toArray()
    ]);

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalProducts,
          totalUsers,
          totalOrders,
          totalRevenue: totalRevenue[0]?.total || 0,
          lowStockCount: lowStockProducts.length
        },
        lowStockProducts,
        recentOrders,
        topProducts,
        salesByCategory,
        ordersOverTime: ordersOverTime.map(item => ({
          date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
          orders: item.count,
          revenue: item.revenue
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}