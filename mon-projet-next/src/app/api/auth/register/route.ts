// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '@/lib/mongodb';

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password validation function (matching frontend requirements)
function validatePassword(password: string): { isValid: boolean; message?: string } {
if (password.length < 6) {
  return { isValid: false, message: 'Le mot de passe doit contenir au moins 6 caractères' };
}
// Optional: Add more password strength requirements
if (!/(?=.*[a-z])/.test(password)) {
  return { isValid: false, message: 'Le mot de passe doit contenir au moins une lettre minuscule' };
}
if (!/(?=.*[A-Z])/.test(password)) {
  return { isValid: false, message: 'Le mot de passe doit contenir au moins une lettre majuscule' };
}
if (!/(?=.*\d)/.test(password)) {
  return { isValid: false, message: 'Le mot de passe doit contenir au moins un chiffre' };
}
return { isValid: true };
}

export async function POST(request: NextRequest) {
try {
  const { name, email, password, confirmPassword, phone, address } = await request.json();
  console.log('=== REGISTRATION ATTEMPT ===');
  console.log('Name:', name);
  console.log('Email:', email);
  console.log('Phone:', phone);
  console.log('Address:', address);
  console.log('Password provided:', !!password);
  console.log('Confirm password provided:', !!confirmPassword);

  // Validate required fields (matching frontend validation)
  if (!name || !email || !password || !confirmPassword) {
    console.log('❌ Missing required fields');
    return NextResponse.json(
      { success: false, error: 'Tous les champs obligatoires sont requis' },
      { status: 400 }
    );
  }

  // Validate name length (matching frontend)
  if (name.trim().length < 2) {
    console.log('❌ Name too short');
    return NextResponse.json(
      { success: false, error: 'Le nom doit contenir au moins 2 caractères' },
      { status: 400 }
    );
  }

  // Validate email format
  if (!emailRegex.test(email.trim())) {
    console.log('❌ Invalid email format');
    return NextResponse.json(
      { success: false, error: 'Veuillez entrer une adresse email valide' },
      { status: 400 }
    );
  }

  // Validate password length (matching frontend - 6 characters minimum)
  if (password.length < 6) {
    console.log('❌ Password too short');
    return NextResponse.json(
      { success: false, error: 'Le mot de passe doit contenir au moins 6 caractères' },
      { status: 400 }
    );
  }

  // Validate password confirmation (matching frontend)
  if (password !== confirmPassword) {
    console.log('❌ Passwords do not match');
    return NextResponse.json(
      { success: false, error: 'Les mots de passe ne correspondent pas' },
      { status: 400 }
    );
  }

  // Validate phone if provided (matching frontend)
  if (phone && phone.trim() && phone.trim().length < 8) {
    console.log('❌ Phone number too short');
    return NextResponse.json(
      { success: false, error: 'Le numéro de téléphone doit contenir au moins 8 chiffres' },
      { status: 400 }
    );
  }

  // Optional: Enhanced password validation
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    console.log('❌ Password validation failed:', passwordValidation.message);
    return NextResponse.json(
      { success: false, error: passwordValidation.message },
      { status: 400 }
    );
  }

  // Connect to MongoDB using the same method as login
  const { db } = await connectToDatabase();
  console.log('✅ Connected to database');

  // Check if user already exists (case-insensitive email search)
  const existingUser = await db.collection('users').findOne({ 
    email: email.toLowerCase().trim()
  });

  if (existingUser) {
    console.log('❌ User already exists with email:', email);
    return NextResponse.json(
      { success: false, error: 'Cette adresse email est déjà utilisée' },
      { status: 409 }
    );
  }

  // Hash password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  console.log('✅ Password hashed successfully');

  // Prepare user data
  const userData = {
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    phone: phone?.trim() || '',
    address: address?.trim() || '',
    role: 'user', // Default role
    isActive: true,
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLogin: null
  };

  // Insert user into database
  const result = await db.collection('users').insertOne(userData);
  console.log('✅ User created with ID:', result.insertedId);

  // Check JWT_SECRET
  const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
  if (!process.env.JWT_SECRET) {
    console.warn('⚠️ Using fallback JWT secret - set JWT_SECRET in environment');
  }

  // Create token (matching login API format)
  const tokenPayload = {
    userId: result.insertedId.toString(),
    email: userData.email,
    role: userData.role
  };

  const token = jwt.sign(
    tokenPayload,
    jwtSecret,
    { expiresIn: '7d' } // Add expiration for security
  );

  // Prepare user response (without password, matching login API format)
  const userResponse = {
    _id: result.insertedId,
    name: userData.name,
    email: userData.email,
    phone: userData.phone,
    address: userData.address,
    role: userData.role,
    isActive: userData.isActive,
    emailVerified: userData.emailVerified,
    createdAt: userData.createdAt,
    lastLogin: userData.lastLogin
  };

  console.log('✅ Registration successful for:', userData.email);

  return NextResponse.json({
    success: true,
    message: 'Inscription réussie!',
    data: {
      user: userResponse,
      token
    }
  });

} catch (error: any) {
  console.error('❌ Registration error:', error);
  
  // Handle specific MongoDB errors
  if (error.code === 11000) {
    return NextResponse.json(
      { success: false, error: 'Cette adresse email est déjà utilisée' },
      { status: 409 }
    );
  }

  // Handle specific error types that frontend expects
  let errorMessage = 'Une erreur est survenue lors de l\'inscription';
  
  if (error.message.includes('email')) {
    errorMessage = 'Cette adresse email est déjà utilisée';
  } else if (error.message.includes('password')) {
    errorMessage = 'Le mot de passe ne respecte pas les critères requis';
  } else if (error.message.includes('name')) {
    errorMessage = 'Le nom fourni n\'est pas valide';
  } else if (error.message.includes('MongoDB')) {
    errorMessage = 'Erreur de connexion à la base de données';
  }

  return NextResponse.json(
    { 
      success: false, 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    },
    { status: 500 }
  );
}
}