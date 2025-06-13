import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyToken, isAdmin } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('🔥 DISACTIVATE ENDPOINT HIT');
  console.log('📅 Timestamp:', new Date().toISOString());
  console.log('📝 Request details:', {
    method: req.method,
    url: req.url,
    userId: params?.id,
    headers: {
      authorization: req.headers.get('authorization') ? 'Bearer [PRESENT]' : 'MISSING',
      contentType: req.headers.get('content-type')
    }
  });

  try {
    // Step 1: Verify token
    console.log('🔐 Step 1: Verifying token...');
    const authResult = await verifyToken(req);
    console.log('🔐 Auth result:', { 
      success: authResult.success, 
      hasUser: !!authResult.user,
      userRole: authResult.user?.role 
    });
    
    if (!authResult.success || !authResult.user) {
      console.log('❌ Authentication failed');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Step 2: Check admin privileges
    console.log('👑 Step 2: Checking admin privileges...');
    if (!isAdmin(authResult.user)) {
      console.log('❌ Not admin - User role:', authResult.user.role);
      return NextResponse.json(
        { success: false, error: 'Admin privileges required' },
        { status: 403 }
      );
    }
    
    // Step 3: Validate user ID
    console.log('🆔 Step 3: Validating user ID...');
    const { id } = params;
    console.log('🆔 User ID to disactivate:', id);
    
    if (!id) {
      console.log('❌ No user ID provided');
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    if (!ObjectId.isValid(id)) {
      console.log('❌ Invalid ObjectId format:', id);
      return NextResponse.json(
        { success: false, error: 'Invalid user ID format' },
        { status: 400 }
      );
    }
    
    // Step 4: Check self-disactivation
    console.log('👤 Step 4: Checking self-disactivation...');
    console.log('👤 Current user ID:', authResult.user.id);
    console.log('👤 Target user ID:', id);
    
    if (id === authResult.user.id) {
      console.log('❌ Self-disactivation attempt blocked');
      return NextResponse.json(
        { success: false, error: 'You cannot disactivate your own account' },
        { status: 400 }
      );
    }
    
    // Step 5: Connect to database
    console.log('🗄️ Step 5: Connecting to database...');
    const { db } = await connectToDatabase();
    console.log('✅ Database connected successfully');
    
    // Step 6: Check if user exists
    console.log('🔍 Step 6: Checking if user exists...');
    const existingUser = await db.collection('users').findOne({ _id: new ObjectId(id) });
    console.log('🔍 User lookup result:', {
      found: !!existingUser,
      userId: existingUser?._id,
      currentStatus: existingUser?.isActive,
      userName: existingUser?.name,
      userEmail: existingUser?.email
    });
    
    if (!existingUser) {
      console.log('❌ User not found in database');
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Step 7: Update user status
    console.log('💾 Step 7: Updating user status...');
    const updateData = {
      isActive: false,
      updatedAt: new Date(),
      updatedBy: authResult.user.id
    };
    console.log('💾 Update data:', updateData);
    
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    console.log('💾 Update result:', {
      acknowledged: result.acknowledged,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      upsertedCount: result.upsertedCount
    });
    
    if (result.matchedCount === 0) {
      console.log('❌ No documents matched for update');
      return NextResponse.json(
        { success: false, error: 'User not found for update' },
        { status: 404 }
      );
    }
    
    if (result.modifiedCount === 0) {
      console.log('⚠️ No documents were modified (user might already be inactive)');
    }
    
    // Step 8: Verify the update
    console.log('✅ Step 8: Verifying update...');
    const updatedUser = await db.collection('users').findOne({ _id: new ObjectId(id) });
    console.log('✅ User after update:', {
      userId: updatedUser?._id,
      isActive: updatedUser?.isActive,
      updatedAt: updatedUser?.updatedAt
    });
    
    console.log('🎉 User disactivated successfully');
    return NextResponse.json({
      success: true,
      message: 'User disactivated successfully',
      data: {
        userId: id,
        isActive: false,
        updatedAt: new Date()
      }
    });
    
  } catch (error: any) {
    console.error('💥 CRITICAL ERROR in disactivate endpoint:');
    console.error('💥 Error type:', error?.constructor?.name);
    console.error('💥 Error message:', error?.message);
    console.error('💥 Error stack:', error?.stack);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to disactivate user',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}