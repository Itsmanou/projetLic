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
      lowStockProducts,
      recentUsers,
      lastMonthUsers,
      topProducts
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
      
      // Low stock products (stock <= 10)
      db.collection('products').countDocuments({
        stock: { $lte: 10 }
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
        .toArray()
    ]);

    // Calculate growth percentages
    const userGrowth = lastMonthUsers > 0 
      ? ((recentUsers - lastMonthUsers) / lastMonthUsers * 100) 
      : 0;

    // Mock revenue data (you can replace with actual order data when available)
    const mockRevenue = 125000;
    const mockWeeklyRevenue = 18500;
    const mockRecentOrders = 156;

    // Prepare response data
    const dashboardStats = {
      totalProducts,
      totalUsers,
      totalRevenue: mockRevenue, // Replace with real revenue calculation
      activeUsers,
      lowStockProducts,
      recentOrders: mockRecentOrders, // Replace with real order count
      monthlyGrowth: Math.round(userGrowth * 10) / 10,
      weeklyRevenue: mockWeeklyRevenue // Replace with real weekly revenue
    };

    // Transform top products data
    const transformedTopProducts = topProducts.map((product: any, index: number) => ({
      id: product._id.toString(),
      name: product.name,
      sales: Math.floor(Math.random() * 1000) + 100, // Mock sales data
      revenue: product.price * Math.floor(Math.random() * 100 + 50), // Mock revenue
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