import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import jwt from 'jsonwebtoken';

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token manquant' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Token invalide' },
        { status: 401 }
      );
    }

    const { db } = await connectToDatabase();

    // Get current date for calculations
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Parallel database queries for better performance
    const [
      totalProducts,
      totalUsers,
      activeUsers,
      recentUsers,
      lastMonthUsers,
      topProducts,
      totalRevenue,
      weeklyRevenue,
      recentOrders
    ] = await Promise.all([
      // Total products
      db.collection('products').countDocuments(),
      
      // Total users
      db.collection('users').countDocuments(),
      
      // Active users (logged in within last 30 days)
      db.collection('users').countDocuments({
        isActive: true,
        lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }),
      
      // Users registered this month
      db.collection('users').countDocuments({
        createdAt: { $gte: startOfMonth }
      }),
      
      // Users registered last month
      db.collection('users').countDocuments({
        createdAt: { $gte: lastMonth, $lt: startOfMonth }
      }),
      
      // Top 5 products by stock (assuming higher stock = more popular for demo)
      db.collection('products').find()
        .sort({ stock: -1 })
        .limit(5)
        .toArray(),
      
      // Real total revenue from paid orders
      db.collection('orders').aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]).toArray(),
      
      // Real weekly revenue from paid orders
      db.collection('orders').aggregate([
        { 
          $match: { 
            paymentStatus: 'paid',
            createdAt: { $gte: startOfWeek }
          } 
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]).toArray(),
      
      // Recent orders count (last 30 days)
      db.collection('orders').countDocuments({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
    ]);

    // Calculate growth percentages
    const userGrowth = lastMonthUsers > 0 
      ? ((recentUsers - lastMonthUsers) / lastMonthUsers * 100) 
      : 0;

    // Use real data instead of mock data
    const realTotalRevenue = totalRevenue[0]?.total || 0;
    const realWeeklyRevenue = weeklyRevenue[0]?.total || 0;

    // Prepare response data
    const dashboardStats = {
      totalProducts,
      totalUsers,
      totalRevenue: realTotalRevenue,
      activeUsers,
      recentOrders: recentOrders,
      monthlyGrowth: Math.round(userGrowth * 10) / 10,
      weeklyRevenue: realWeeklyRevenue
    };

    // Get real top selling products from orders
    const realTopProducts = await db.collection('orders').aggregate([
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
      { $limit: 5 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      {
        $addFields: {
          productInfo: { $arrayElemAt: ['$productInfo', 0] }
        }
      }
    ]).toArray();

    // Transform top products data with real sales data
    const transformedTopProducts = realTopProducts.length > 0 
      ? realTopProducts.map((product: any) => ({
          id: product._id.toString(),
          name: product.productName || product.productInfo?.name || 'Produit inconnu',
          sales: product.totalSold,
          revenue: product.revenue,
          stock: product.productInfo?.stock || 0
        }))
      : topProducts.map((product: any, index: number) => ({
          id: product._id.toString(),
          name: product.name,
          sales: 0, // No sales data available
          revenue: 0, // No revenue data available
          stock: product.stock
        }));

    return NextResponse.json({
      success: true,
      data: {
        stats: dashboardStats,
        topProducts: transformedTopProducts
      }
    });

  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}