// lib/auth.ts - Enhanced with better error handling
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export interface User {
id: string;
email: string;
role: string;
name?: string;
}

export interface AuthResult {
success: boolean;
user?: User;
error?: string;
}

export async function verifyToken(req: NextRequest): Promise<AuthResult> {
try {
  // Get token from Authorization header or cookies
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') 
    ? authHeader.substring(7)
    : req.cookies.get('token')?.value;

  console.log('Token found:', !!token); // Debug log

  if (!token) {
    return {
      success: false,
      error: 'No token provided'
    };
  }

  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    console.error('JWT_SECRET not configured');
    return {
      success: false,
      error: 'Server configuration error'
    };
  }

  // Verify token
  const decoded = jwt.verify(token, JWT_SECRET) as any;
  console.log('Token decoded successfully:', decoded.email); // Debug log

  const user: User = {
    id: decoded.id || decoded.userId,
    email: decoded.email,
    role: decoded.role || 'user',
    name: decoded.name
  };

  return {
    success: true,
    user
  };

} catch (error) {
  console.error('Token verification error:', error);
  
  if (error instanceof jwt.JsonWebTokenError) {
    return {
      success: false,
      error: 'Invalid token'
    };
  }
  
  if (error instanceof jwt.TokenExpiredError) {
    return {
      success: false,
      error: 'Token expired'
    };
  }

  return {
    success: false,
    error: 'Authentication failed'
  };
}
}

export function isAdmin(user: User): boolean {
return user.role === 'admin' || user.role === 'administrator';
}