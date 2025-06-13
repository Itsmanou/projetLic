// src/app/api/admin/users/route.ts - Main users endpoint
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyToken, isAdmin } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

// GET - Fetch all users (Admin only)
export async function GET(req: NextRequest) {
console.log('GET /api/admin/users - Starting request processing');

try {
  // Step 1: Verify authentication
  const authResult = await verifyToken(req);
  
  if (!authResult.success || !authResult.user) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  // Step 2: Check admin privileges
  if (!isAdmin(authResult.user)) {
    return NextResponse.json(
      { success: false, error: 'Admin privileges required' },
      { status: 403 }
    );
  }
  
  // Step 3: Parse query parameters
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const search = searchParams.get('search');
  const role = searchParams.get('role');
  const status = searchParams.get('status');
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
  
  console.log('Query parameters:', { page, limit, search, role, status, sortBy });
  
  // Step 4: Connect to database
  const { db } = await connectToDatabase();
  
  // Step 5: Build filter query
  const filter: any = {};
  
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (role && role !== 'all') {
    filter.role = role;
  }
  
  if (status === 'active') {
    filter.isActive = true;
  } else if (status === 'inactive') {
    filter.isActive = false;
  }
  
  console.log('Filter applied:', filter);
  
  // Step 6: Calculate skip value for pagination
  const skip = (page - 1) * limit;
  
  // Step 7: Get total count
  const totalUsers = await db.collection('users').countDocuments(filter);
  
  // Step 8: Fetch users with pagination and sorting
  const users = await db.collection('users')
    .find(filter, { 
      projection: { 
        password: 0, // Exclude password from results
        resetToken: 0,
        resetTokenExpiry: 0
      } 
    })
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit)
    .toArray();
  
  // Step 9: Calculate pagination info
  const totalPages = Math.ceil(totalUsers / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;
  
  console.log(`Found ${users.length} users out of ${totalUsers} total`);
  
  return NextResponse.json({
    success: true,
    data: users,
    pagination: {
      currentPage: page,
      totalPages,
      totalUsers,
      hasNextPage,
      hasPrevPage,
      limit
    },
    message: 'Users fetched successfully'
  });
  
} catch (error) {
  console.error('Error in GET /api/admin/users:', error);
  return NextResponse.json(
    { 
      success: false, 
      error: 'Failed to fetch users',
      details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    },
    { status: 500 }
  );
}
}

// POST - Create new user (Admin only)
export async function POST(req: NextRequest) {
console.log('POST /api/admin/users - Starting request processing');

try {
  // Step 1: Verify authentication
  const authResult = await verifyToken(req);
  
  if (!authResult.success || !authResult.user) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  // Step 2: Check admin privileges
  if (!isAdmin(authResult.user)) {
    return NextResponse.json(
      { success: false, error: 'Admin privileges required' },
      { status: 403 }
    );
  }
  
  // Step 3: Parse request body
  const { name, email, password, role = 'user' } = await req.json();
  
  // Step 4: Validate required fields
  if (!name || !email || !password) {
    return NextResponse.json(
      { success: false, error: 'Name, email, and password are required' },
      { status: 400 }
    );
  }
  
  // Step 5: Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { success: false, error: 'Invalid email format' },
      { status: 400 }
    );
  }
  
  // Step 6: Validate password strength
  if (password.length < 6) {
    return NextResponse.json(
      { success: false, error: 'Password must be at least 6 characters long' },
      { status: 400 }
    );
  }
  
  // Step 7: Connect to database
  const { db } = await connectToDatabase();
  
  // Step 8: Check if user already exists
  const existingUser = await db.collection('users').findOne({ email: email.toLowerCase() });
  
  if (existingUser) {
    return NextResponse.json(
      { success: false, error: 'User with this email already exists' },
      { status: 409 }
    );
  }
  
  // Step 9: Hash password
  const hashedPassword = await bcrypt.hash(password, 12);
  
  // Step 10: Create user object
  const newUser = {
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    role: role === 'admin' ? 'admin' : 'user',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: authResult.user.id
  };
  
  // Step 11: Insert user
  const result = await db.collection('users').insertOne(newUser);
  
  // Step 12: Return user without password
  const { password: _, ...userWithoutPassword } = newUser;
  
  console.log('User created successfully:', result.insertedId);
  
  return NextResponse.json({
    success: true,
    data: { ...userWithoutPassword, _id: result.insertedId },
    message: 'User created successfully'
  }, { status: 201 });
  
} catch (error) {
  console.error('Error in POST /api/admin/users:', error);
  return NextResponse.json(
    { 
      success: false, 
      error: 'Failed to create user',
      details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    },
    { status: 500 }
  );
}
}