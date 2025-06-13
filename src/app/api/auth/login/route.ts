// src/app/api/auth/login/route.ts - Fixed to match register API
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
try {
  const { email, password } = await request.json();
  console.log('=== LOGIN ATTEMPT ===');
  console.log('Email:', email);
  console.log('Password provided:', !!password);

  // Validate input
  if (!email || !password) {
    console.log('❌ Missing email or password');
    return NextResponse.json(
      { success: false, error: 'Email et mot de passe requis' },
      { status: 400 }
    );
  }

  // Connect to MongoDB using the same method as register
  const { db } = await connectToDatabase();
  console.log('✅ Connected to database');

  // Check total users count for debugging
  const totalUsers = await db.collection('users').countDocuments();
  console.log('Total users in database:', totalUsers);

  // List first few users for debugging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    const sampleUsers = await db.collection('users').find({}, { 
      projection: { email: 1, name: 1, role: 1, isActive: 1 },
      limit: 5
    }).toArray();
    console.log('Sample users in database:', sampleUsers);
  }

  // Find user (case-insensitive email search, matching register logic)
  const user = await db.collection('users').findOne({ 
    email: email.toLowerCase().trim()
  });
  
  console.log('User search result:', user ? {
    id: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    hasPassword: !!user.password
  } : 'No user found');

  if (!user) {
    console.log('❌ User not found for email:', email);
    return NextResponse.json(
      { success: false, error: 'Identifiants invalides' },
      { status: 401 }
    );
  }

  // Check if user is active
  if (!user.isActive) {
    console.log('❌ User account is deactivated');
    return NextResponse.json(
      { success: false, error: 'Compte désactivé' },
      { status: 401 }
    );
  }

  // Verify password
  if (!user.password) {
    console.log('❌ User has no password set');
    return NextResponse.json(
      { success: false, error: 'Identifiants invalides' },
      { status: 401 }
    );
  }

  const isValid = await bcrypt.compare(password, user.password);
  console.log('Password verification result:', isValid);

  if (!isValid) {
    console.log('❌ Invalid password');
    return NextResponse.json(
      { success: false, error: 'Identifiants invalides' },
      { status: 401 }
    );
  }

  // Check JWT_SECRET
  const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
  if (!process.env.JWT_SECRET) {
    console.warn('⚠️ Using fallback JWT secret - set JWT_SECRET in environment');
  }

  // Create token (matching register API format)
  const tokenPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role
  };

  const token = jwt.sign(
    tokenPayload,
    jwtSecret
  );

  // Update last login
  await db.collection('users').updateOne(
    { _id: user._id },
    { 
      $set: { 
        lastLogin: new Date(),
        updatedAt: new Date()
      }
    }
  );

  // Prepare user response (matching register API format, without password)
  const userResponse = {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    address: user.address || '',
    role: user.role,
    isActive: user.isActive,
    emailVerified: user.emailVerified || false,
    createdAt: user.createdAt,
    lastLogin: new Date()
  };

  console.log('✅ Login successful for:', user.email);

  return NextResponse.json({
    success: true,
    message: 'Connexion réussie',
    data: {
      user: userResponse,
      token
    }
  });

} catch (error: any) {
  console.error('❌ Login error:', error);
  return NextResponse.json(
    { 
      success: false, 
      error: 'Erreur interne du serveur',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    },
    { status: 500 }
  );
}
}