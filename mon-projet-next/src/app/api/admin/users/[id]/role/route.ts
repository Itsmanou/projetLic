import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyToken, isAdmin } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('🔥 ROLE UPDATE ENDPOINT HIT');
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
      userRole: authResult.user?.role,
      userId: authResult.user?.id 
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
    console.log('🆔 Target user ID:', id);
    
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
    
    // Step 4: Parse request body
    console.log('📋 Step 4: Parsing request body...');
    let requestBody;
    let role;
    
    try {
      const bodyText = await req.text();
      console.log('📋 Raw request body:', bodyText);
      
      if (!bodyText || bodyText.trim() === '') {
        console.log('❌ Empty request body');
        return NextResponse.json(
          { success: false, error: 'Request body is required' },
          { status: 400 }
        );
      }
      
      requestBody = JSON.parse(bodyText);
      console.log('📋 Parsed request body:', requestBody);
      
      role = requestBody.role;
      console.log('📋 Extracted role:', role);
      
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      console.error('❌ Parse error details:', {
        error: parseError,
        message: (parseError as any)?.message,
        stack: (parseError as any)?.stack
      });
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    // Step 5: Validate role
    console.log('✅ Step 5: Validating role...');
    if (!role) {
      console.log('❌ No role provided');
      return NextResponse.json(
        { success: false, error: 'Role is required' },
        { status: 400 }
      );
    }
    
    if (!['user', 'admin'].includes(role)) {
      console.log('❌ Invalid role value:', role);
      return NextResponse.json(
        { success: false, error: 'Invalid role. Must be "user" or "admin"' },
        { status: 400 }
      );
    }
    
    // Step 6: Check self-role-removal
    console.log('👤 Step 6: Checking self-role-removal...');
    console.log('👤 Current user ID:', authResult.user.id);
    console.log('👤 Target user ID:', id);
    console.log('👤 New role:', role);
    
    if (id === authResult.user.id && role === 'user') {
      console.log('❌ Self-role-removal attempt blocked');
      return NextResponse.json(
        { success: false, error: 'You cannot remove your own admin privileges' },
        { status: 400 }
      );
    }
    
    // Step 7: Connect to database
    console.log('🗄️ Step 7: Connecting to database...');
    const { db } = await connectToDatabase();
    console.log('✅ Database connected successfully');
    
    // Step 8: Check if user exists
    console.log('🔍 Step 8: Checking if user exists...');
    const existingUser = await db.collection('users').findOne({ _id: new ObjectId(id) });
    console.log('🔍 User lookup result:', {
      found: !!existingUser,
      userId: existingUser?._id,
      currentRole: existingUser?.role,
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
    
    // Step 9: Check if role is already the same
    if (existingUser.role === role) {
      console.log('ℹ️ User already has this role:', role);
      return NextResponse.json({
        success: true,
        message: `User already has the role: ${role}`,
        data: {
          userId: id,
          role: role,
          unchanged: true
        }
      });
    }
    
    // Step 10: Update user role
    console.log('💾 Step 10: Updating user role...');
    const updateData = {
      role: role,
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
    
    // Step 11: Verify the update
    console.log('✅ Step 11: Verifying update...');
    const updatedUser = await db.collection('users').findOne({ _id: new ObjectId(id) });
    console.log('✅ User after update:', {
      userId: updatedUser?._id,
      newRole: updatedUser?.role,
      updatedAt: updatedUser?.updatedAt,
      updatedBy: updatedUser?.updatedBy
    });
    
    console.log('🎉 User role updated successfully');
    const responseData = {
      success: true,
      message: `User role updated to ${role} successfully`,
      data: {
        userId: id,
        oldRole: existingUser.role,
        newRole: role,
        updatedAt: new Date(),
        updatedBy: authResult.user.id
      }
    };
    
    console.log('📤 Sending response:', responseData);
    return NextResponse.json(responseData);
    
  } catch (error: any) {
    console.error('💥 CRITICAL ERROR in role update endpoint:');
    console.error('💥 Error type:', error?.constructor?.name);
    console.error('💥 Error message:', error?.message);
    console.error('💥 Error stack:', error?.stack);
    
    // Make sure we always return valid JSON
    try {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to update user role',
          details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    } catch (jsonError) {
      console.error('💥 Failed to create JSON response:', jsonError);
      // Last resort - return plain text
      return new Response('Internal Server Error', { status: 500 });
    }
  }
}