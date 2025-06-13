// src/app/api/admin/users/[id]/activate/route.ts - Activate user
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyToken, isAdmin } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function PUT(
req: NextRequest,
{ params }: { params: { id: string } }
) {
try {
  const authResult = await verifyToken(req);
  
  if (!authResult.success || !authResult.user) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  if (!isAdmin(authResult.user)) {
    return NextResponse.json(
      { success: false, error: 'Admin privileges required' },
      { status: 403 }
    );
  }
  
  const { id } = params;
  
  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { success: false, error: 'Invalid user ID format' },
      { status: 400 }
    );
  }
  
  const { db } = await connectToDatabase();
  
  const result = await db.collection('users').updateOne(
    { _id: new ObjectId(id) },
    { 
      $set: { 
        isActive: true,
        updatedAt: new Date(),
        updatedBy: authResult.user.id
      },
      $unset: {
        deletedAt: "",
        deletedBy: ""
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
    message: 'User activated successfully'
  });
  
} catch (error) {
  console.error('Error activating user:', error);
  return NextResponse.json(
    { success: false, error: 'Failed to activate user' },
    { status: 500 }
  );
}
}
