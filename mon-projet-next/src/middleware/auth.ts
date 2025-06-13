import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export async function isAuthenticated(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authenticated: false };
    }
    
    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      email: string;
      role: string;
    };
    
    const client = await clientPromise;
    const db = client.db("pharmashop");
    
    const user = await db.collection("users").findOne({
      _id: new ObjectId(decoded.id)
    });
    
    if (!user) {
      return { authenticated: false };
    }
    
    return {
      authenticated: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
  } catch (error) {
    return { authenticated: false };
  }
}

export function isAdmin(user: any) {
  return user?.role === 'admin';
}