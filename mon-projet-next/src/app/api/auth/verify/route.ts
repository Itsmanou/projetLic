import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Token manquant' },
        { status: 401 }
      );
    }
    
    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    
    // Verify token (since you removed expiresIn, this won't check expiration)
    const decoded = jwt.verify(token, jwtSecret) as {
      userId: string;
      email: string;
      role: string;
    };
    
    // Get user from database to make sure they still exist and are active
    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({
      _id: new ObjectId(decoded.userId)
    });
    
    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé ou désactivé' },
        { status: 401 }
      );
    }
    
    // Return success with user info
    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
    
  } catch (error: any) {
    console.log('❌ Token verification failed:', error.message);
    
    // Return specific error messages for debugging
    let errorMessage = 'Token invalide';
    if (error.name === 'JsonWebTokenError') {
      errorMessage = 'Token malformé';
    } else if (error.name === 'TokenExpiredError') {
      errorMessage = 'Token expiré';
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 401 }
    );
  }
}