import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyToken, isAdmin } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

// GET - Fetch admin settings
export async function GET(req: NextRequest) {
  console.log('🔍 GET /api/admin/settings - Fetching admin settings');
  
  try {
    const authResult = await verifyToken(req);
    
    if (!authResult.success || !authResult.user) {
      console.log('❌ Authentication failed');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!isAdmin(authResult.user)) {
      console.log('❌ Not admin');
      return NextResponse.json(
        { success: false, error: 'Admin privileges required' },
        { status: 403 }
      );
    }

    const { db } = await connectToDatabase();
    
    // Fetch admin profile with additional settings
    const admin = await db.collection('users').findOne(
      { _id: new ObjectId(authResult.user.id) },
      { 
        projection: { 
          password: 0,
          __v: 0
        } 
      }
    );

    if (!admin) {
      console.log('❌ Admin not found');
      return NextResponse.json(
        { success: false, error: 'Admin not found' },
        { status: 404 }
      );
    }

    console.log('✅ Admin settings fetched successfully');
    return NextResponse.json({
      success: true,
      data: {
        _id: admin._id,
        nom: admin.name || admin.nom,
        email: admin.email,
        phone: admin.phone || '',
        address: admin.address || '',
        role: admin.role,
        isActive: admin.isActive,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
        lastLogin: admin.lastLogin,
        // Admin-specific settings
        settings: admin.settings || {
          emailNotifications: true,
          smsNotifications: false,
          loginAlerts: true,
          theme: 'light',
          language: 'fr',
          timezone: 'Europe/Paris'
        }
      }
    });

  } catch (error) {
    console.error('💥 Error fetching admin settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch admin settings' },
      { status: 500 }
    );
  }
}

// PUT - Update admin settings
export async function PUT(req: NextRequest) {
  console.log('🔄 PUT /api/admin/settings - Updating admin settings');
  
  try {
    const authResult = await verifyToken(req);
    
    if (!authResult.success || !authResult.user) {
      console.log('❌ Authentication failed');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!isAdmin(authResult.user)) {
      console.log('❌ Not admin');
      return NextResponse.json(
        { success: false, error: 'Admin privileges required' },
        { status: 403 }
      );
    }

    // Parse request body
    let requestBody;
    try {
      const bodyText = await req.text();
      requestBody = JSON.parse(bodyText);
      console.log('📋 Request body received');
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { 
      nom, 
      email, 
      phone, 
      address, 
      currentPassword, 
      password,
      settings 
    } = requestBody;

    // Validation
    if (!nom || !email) {
      return NextResponse.json(
        { success: false, error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    
    // Check if admin exists
    const existingAdmin = await db.collection('users').findOne({
      _id: new ObjectId(authResult.user.id)
    });

    if (!existingAdmin) {
      console.log('❌ Admin not found');
      return NextResponse.json(
        { success: false, error: 'Admin not found' },
        { status: 404 }
      );
    }

    // Check email uniqueness
    const emailExists = await db.collection('users').findOne({
      email: email,
      _id: { $ne: new ObjectId(authResult.user.id) }
    });

    if (emailExists) {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      name: nom,
      nom: nom,
      email: email,
      phone: phone || '',
      address: address || '',
      updatedAt: new Date()
    };

    // Update settings if provided
    if (settings) {
      updateData.settings = {
        ...existingAdmin.settings,
        ...settings
      };
    }

    // Handle password change
    if (password && password.trim() !== '') {
      console.log('🔐 Password change requested');
      
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, error: 'Current password is required to change password' },
          { status: 400 }
        );
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, existingAdmin.password);
      if (!isCurrentPasswordValid) {
        console.log('❌ Current password is incorrect');
        return NextResponse.json(
          { success: false, error: 'Current password is incorrect' },
          { status: 400 }
        );
      }

      if (password.length < 6) {
        return NextResponse.json(
          { success: false, error: 'New password must be at least 6 characters long' },
          { status: 400 }
        );
      }

      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      updateData.password = hashedPassword;
      
      console.log('✅ Password updated successfully');
    }

    // Update admin profile
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(authResult.user.id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Admin not found' },
        { status: 404 }
      );
    }

    // Fetch updated admin data
    const updatedAdmin = await db.collection('users').findOne(
      { _id: new ObjectId(authResult.user.id) },
      { 
        projection: { 
          password: 0,
          __v: 0
        } 
      }
    );

    console.log('✅ Admin settings updated successfully');
    return NextResponse.json({
      success: true,
      message: password ? 'Profile and password updated successfully' : 'Profile updated successfully',
      data: {
        _id: updatedAdmin._id,
        nom: updatedAdmin.name || updatedAdmin.nom,
        email: updatedAdmin.email,
        phone: updatedAdmin.phone || '',
        address: updatedAdmin.address || '',
        role: updatedAdmin.role,
        updatedAt: updatedAdmin.updatedAt,
        settings: updatedAdmin.settings
      }
    });

  } catch (error) {
    console.error('💥 Error updating admin settings:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update admin settings',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}