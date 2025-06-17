import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

// GET - Fetch user profile
export async function GET(req: NextRequest) {
  console.log('🔍 GET /api/user/profile - Fetching user profile');
  
  try {
    const authResult = await verifyToken(req);
    
    if (!authResult.success || !authResult.user) {
      console.log('❌ Authentication failed');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { db } = await connectToDatabase();
    
    // Fetch user profile (exclude password)
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(authResult.user.id) },
      { 
        projection: { 
          password: 0,
          __v: 0
        } 
      }
    );

    if (!user) {
      console.log('❌ User not found');
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('✅ Profile fetched successfully for user:', user.email);
    return NextResponse.json({
      success: true,
      data: {
        _id: user._id,
        nom: user.name || user.nom,
        email: user.email,
        phone: user.phone || '',
        address: user.address || '',
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('💥 Error fetching profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PUT - Update user profile
export async function PUT(req: NextRequest) {
  console.log('🔄 PUT /api/user/profile - Updating user profile');
  
  try {
    const authResult = await verifyToken(req);
    
    if (!authResult.success || !authResult.user) {
      console.log('❌ Authentication failed');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('👤 Authenticated user ID:', authResult.user.id);
    console.log('👤 Authenticated user email:', authResult.user.email);

    // Parse request body
    let requestBody;
    try {
      const bodyText = await req.text();
      requestBody = JSON.parse(bodyText);
      console.log('📋 Request body received:', { 
        nom: requestBody.nom,
        email: requestBody.email,
        phone: requestBody.phone,
        address: requestBody.address,
        hasCurrentPassword: !!requestBody.currentPassword,
        hasNewPassword: !!requestBody.password,
        currentPasswordLength: requestBody.currentPassword?.length || 0,
        newPasswordLength: requestBody.password?.length || 0
      });
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { nom, email, phone, address, currentPassword, password } = requestBody;

    // Validation
    if (!nom || !email) {
      console.log('❌ Missing required fields');
      return NextResponse.json(
        { success: false, error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Invalid email format:', email);
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    
    // Check if user exists WITH password for verification
    const existingUser = await db.collection('users').findOne({
      _id: new ObjectId(authResult.user.id)
    });

    if (!existingUser) {
      console.log('❌ User not found in database');
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('🔍 Found existing user:', {
      id: existingUser._id,
      email: existingUser.email,
      name: existingUser.name || existingUser.nom,
      hasPassword: !!existingUser.password,
      passwordType: typeof existingUser.password,
      passwordLength: existingUser.password?.length || 0,
      passwordStartsWith: existingUser.password?.substring(0, 10) || 'N/A'
    });

    // Check if email is already taken by another user
    const emailExists = await db.collection('users').findOne({
      email: email,
      _id: { $ne: new ObjectId(authResult.user.id) }
    });

    if (emailExists) {
      console.log('❌ Email already exists:', email);
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      name: nom,
      nom: nom, // Keep both for compatibility
      email: email,
      phone: phone || '',
      address: address || '',
      updatedAt: new Date()
    };

    // Handle password change
    if (password && password.trim() !== '') {
      console.log('🔐 Password change requested');
      
      // Validate current password is provided
      if (!currentPassword) {
        console.log('❌ Current password not provided');
        return NextResponse.json(
          { success: false, error: 'Current password is required to change password' },
          { status: 400 }
        );
      }

      // Check if user has a password in database
      if (!existingUser.password) {
        console.log('❌ User has no password in database');
        return NextResponse.json(
          { success: false, error: 'User account has no password set' },
          { status: 400 }
        );
      }

      console.log('🔐 Verifying current password...');
      console.log('🔐 Current password provided:', currentPassword);
      console.log('🔐 Stored password hash starts with:', existingUser.password.substring(0, 20));

      // First, let's check if the stored password is actually hashed
      const isHashedPassword = existingUser.password.startsWith('$2a$') || existingUser.password.startsWith('$2b$');
      console.log('🔐 Is stored password hashed?', isHashedPassword);

      let isCurrentPasswordValid = false;

      if (isHashedPassword) {
        // Password is hashed, use bcrypt.compare
        console.log('🔐 Using bcrypt.compare for hashed password');
        isCurrentPasswordValid = await bcrypt.compare(currentPassword, existingUser.password);
        console.log('🔐 bcrypt.compare result:', isCurrentPasswordValid);
      } else {
        // Password might be stored as plain text (for testing)
        console.log('🔐 Comparing plain text passwords');
        isCurrentPasswordValid = currentPassword === existingUser.password;
        console.log('🔐 Plain text comparison result:', isCurrentPasswordValid);
        
        // Also try bcrypt compare in case it's a different hash format
        if (!isCurrentPasswordValid) {
          console.log('🔐 Trying bcrypt.compare as fallback');
          try {
            isCurrentPasswordValid = await bcrypt.compare(currentPassword, existingUser.password);
            console.log('🔐 Fallback bcrypt.compare result:', isCurrentPasswordValid);
          } catch (err) {
            if (err && typeof err === 'object' && 'message' in err) {
              console.log('🔐 Fallback bcrypt.compare failed:', (err as { message: string }).message);
            } else {
              console.log('🔐 Fallback bcrypt.compare failed with unknown error:', err);
            }
          }
        }
      }

      if (!isCurrentPasswordValid) {
        console.log('❌ Current password verification failed');
        console.log('❌ Provided password:', currentPassword);
        console.log('❌ Stored password (first 50 chars):', existingUser.password.substring(0, 50));
        
        return NextResponse.json(
          { success: false, error: 'Current password is incorrect' },
          { status: 400 }
        );
      }

      console.log('✅ Current password verified successfully');

      // Validate new password
      if (password.length < 6) {
        console.log('❌ New password too short');
        return NextResponse.json(
          { success: false, error: 'New password must be at least 6 characters long' },
          { status: 400 }
        );
      }

      // Hash new password
      console.log('🔐 Hashing new password...');
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      updateData.password = hashedPassword;
      
      console.log('✅ New password hashed successfully');
      console.log('🔐 New hash starts with:', hashedPassword.substring(0, 20));
    }

    // Update user profile
    console.log('💾 Updating user profile...');
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(authResult.user.id) },
      { $set: updateData }
    );

    console.log('💾 Update result:', {
      acknowledged: result.acknowledged,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    });

    if (result.matchedCount === 0) {
      console.log('❌ No user found to update');
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch updated user data (exclude password)
    const updatedUser = await db.collection('users').findOne(
      { _id: new ObjectId(authResult.user.id) },
      { 
        projection: { 
          password: 0,
          __v: 0
        } 
      }
    );

    if (!updatedUser) {
      console.log('❌ Updated user not found after update');
      return NextResponse.json(
        { success: false, error: 'Failed to fetch updated user profile' },
        { status: 500 }
      );
    }

    console.log('✅ Profile updated successfully');
    return NextResponse.json({
      success: true,
      message: password ? 'Profile and password updated successfully' : 'Profile updated successfully',
      data: {
        _id: updatedUser._id,
        nom: updatedUser.name || updatedUser.nom,
        email: updatedUser.email,
        phone: updatedUser.phone || '',
        address: updatedUser.address || '',
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        updatedAt: updatedUser.updatedAt
      }
    });

  } catch (error) {
    console.error('💥 Error updating profile:', error);
    if (error instanceof Error) {
      console.error('💥 Error stack:', error.stack);
    } else {
      console.error('💥 Error stack: unknown error type');
    }
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update profile',
        details: process.env.NODE_ENV === 'development'
          ? (error instanceof Error ? error.message : String(error))
          : undefined
      },
      { status: 500 }
    );
  }
}