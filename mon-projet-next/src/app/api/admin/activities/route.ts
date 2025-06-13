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
    
    const { db } = await connectToDatabase();

    // Get recent activities from different collections
    const recentActivities: Activity[] = [];

    // Recent user registrations (last 5)
    const recentUsers = await db.collection('users')
      .find({})
      .sort({ createdAt: -1 })
      .limit(3)
      .toArray();

    // Recent products added (last 3)
    const recentProducts = await db.collection('products')
      .find({})
      .sort({ createdAt: -1 })
      .limit(2)
      .toArray();

    // Add user registration activities
    recentUsers.forEach((user: any) => {
      recentActivities.push({
        id: `user_${user._id}`,
        type: 'user_registered',
        message: `Nouvel utilisateur: ${user.name}`,
        timestamp: user.createdAt,
        status: 'success'
      });
    });

    // Add product addition activities
    recentProducts.forEach((product: any) => {
      recentActivities.push({
        id: `product_${product._id}`,
        type: 'product_added',
        message: `Nouveau produit ajouté: ${product.name}`,
        timestamp: product.createdAt || product.updatedAt,
        status: 'info'
      });
    });

    // Check for low stock products
    const lowStockProducts = await db.collection('products')
      .find({ stock: { $lte: 5 } })
      .limit(3)
      .toArray();

    lowStockProducts.forEach((product: any) => {
      recentActivities.push({
        id: `stock_${product._id}`,
        type: 'stock_low',
        message: `Stock faible: ${product.name} (${product.stock} unités restantes)`,
        timestamp: new Date().toISOString(),
        status: 'warning'
      });
    });

    // Sort activities by timestamp (most recent first)
    interface Activity {
      id: string;
      type: 'user_registered' | 'product_added' | 'stock_low';
      message: string;
      timestamp: string | Date;
      status: 'success' | 'info' | 'warning';
    }

    recentActivities.sort((a: Activity, b: Activity) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Return top 10 most recent activities
    return NextResponse.json({
      success: true,
      data: recentActivities.slice(0, 10)
    });

  } catch (error: any) {
    console.error('Dashboard activities error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}