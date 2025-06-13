// src/app/api/admin/users/[id]/route.ts - Individual user operations
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyToken, isAdmin } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

// GET - Get specific user by ID
export async function GET(
req: NextRequest,
{ params }: { params: { id: string } }
) {
try {
  // Verify authentication
  const authResult = await verifyToken(req);
  
  if (!authResult.success || !authResult.user) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  // Check admin privileges
  if (!isAdmin(authResult.user)) {
    return NextResponse.json(
      { success: false, error: 'Admin privileges required' },
      { status: 403 }
    );
  }
  
  const { id } = params;
  
  // Validate ObjectId
  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { success: false, error: 'Invalid user ID format' },
      { status: 400 }
    );
  }
  
  // Connect to database
  const { db } = await connectToDatabase();
  
  // Find user
  const user = await db.collection('users').findOne(
    { _id: new ObjectId(id) },
    { projection: { password: 0, resetToken: 0, resetTokenExpiry: 0 } }
  );
  
  if (!user) {
    return NextResponse.json(
      { success: false, error: 'User not found' },
      { status: 404 }
    );
  }
  
  return NextResponse.json({
    success: true,
    data: user,
    message: 'User fetched successfully'
  });
  
} catch (error) {
  console.error('Error in GET /api/admin/users/[id]:', error);
  return NextResponse.json(
    { success: false, error: 'Failed to fetch user' },
    { status: 500 }
  );
}
}

// PUT - Update user
export async function PUT(
req: NextRequest,
{ params }: { params: { id: string } }
) {
try {
  // Verify authentication
  const authResult = await verifyToken(req);
  
  if (!authResult.success || !authResult.user) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  // Check admin privileges
  if (!isAdmin(authResult.user)) {
    return NextResponse.json(
      { success: false, error: 'Admin privileges required' },
      { status: 403 }
    );
  }
  
  const { id } = params;
  
  // Validate ObjectId
  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { success: false, error: 'Invalid user ID format' },
      { status: 400 }
    );
  }
  
  // Parse request body
  const updateData = await req.json();
  const { name, email, password, role, isActive } = updateData;
  
  // Connect to database
  const { db } = await connectToDatabase();
  
  // Check if user exists
  const existingUser = await db.collection('users').findOne({ _id: new ObjectId(id) });
  
  if (!existingUser) {
    return NextResponse.json(
      { success: false, error: 'User not found' },
      { status: 404 }
    );
  }
  
  // Prepare update object
  const updateObject: any = {
    updatedAt: new Date(),
    updatedBy: authResult.user.id
  };
  
  // Update name if provided
  if (name && name.trim() !== '') {
    updateObject.name = name.trim();
  }
  
  // Update email if provided
  if (email && email.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    // Check if email is already taken by another user
    const emailExists = await db.collection('users').findOne({
      email: email.toLowerCase(),
      _id: { $ne: new ObjectId(id) }
    });
    
    if (emailExists) {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 409 }
      );
    }
    
    updateObject.email = email.toLowerCase().trim();
  }
  
  // Update password if provided
  if (password && password.trim() !== '') {
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }
    updateObject.password = await bcrypt.hash(password, 12);
  }
  
  // Update role if provided
  if (role !== undefined) {
    updateObject.role = role === 'admin' ? 'admin' : 'user';
  }
  
  // Update active status if provided
  if (isActive !== undefined) {
    updateObject.isActive = Boolean(isActive);
  }
  
  // Update user
  const result = await db.collection('users').updateOne(
    { _id: new ObjectId(id) },
    { $set: updateObject }
  );
  
  if (result.matchedCount === 0) {
    return NextResponse.json(
      { success: false, error: 'User not found' },
      { status: 404 }
    );
  }
  
  // Fetch updated user
  const updatedUser = await db.collection('users').findOne(
    { _id: new ObjectId(id) },
    { projection: { password: 0, resetToken: 0, resetTokenExpiry: 0 } }
  );
  
  return NextResponse.json({
    success: true,
    data: updatedUser,
    message: 'User updated successfully'
  });
  
} catch (error) {
  console.error('Error in PUT /api/admin/users/[id]:', error);
  return NextResponse.json(
    { success: false, error: 'Failed to update user' },
    { status: 500 }
  );
}
}

// DELETE - Delete user (soft delete)
export async function DELETE(
req: NextRequest,
{ params }: { params: { id: string } }
) {
try {
  // Verify authentication
  const authResult = await verifyToken(req);
  
  if (!authResult.success || !authResult.user) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  // Check admin privileges
  if (!isAdmin(authResult.user)) {
    return NextResponse.json(
      { success: false, error: 'Admin privileges required' },
      { status: 403 }
    );
  }
  
  const { id } = params;
  
  // Validate ObjectId
  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { success: false, error: 'Invalid user ID format' },
      { status: 400 }
    );
  }
  
  // Prevent admin from deleting themselves
  if (id === authResult.user.id) {
    return NextResponse.json(
      { success: false, error: 'You cannot delete your own account' },
      { status: 400 }
    );
  }
  
  // Connect to database
  const { db } = await connectToDatabase();
  
  // Check if user exists
  const existingUser = await db.collection('users').findOne({ _id: new ObjectId(id) });
  
  if (!existingUser) {
    return NextResponse.json(
      { success: false, error: 'User not found' },
      { status: 404 }
    );
  }
  
  // Perform soft delete (set isActive to false and add deletion info)
  const result = await db.collection('users').updateOne(
    { _id: new ObjectId(id) },
    { 
      $set: { 
        isActive: false,
        deletedAt: new Date(),
        deletedBy: authResult.user.id
      }
    }
  );
  
  if (result.matchedCount === 0) {
    return NextResponse.json(
      { success: false, error: 'User not found' },
      { status: 404 }
    );
  }
  
  return NextResponse.json({
    success: true,
    message: 'User deleted successfully'
  });
  
} catch (error) {
  console.error('Error in DELETE /api/admin/users/[id]:', error);
  return NextResponse.json(
    { success: false, error: 'Failed to delete user' },
    { status: 500 }
  );
}
}