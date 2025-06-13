// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, isAdmin } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyToken(req);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'product', 'prescription', 'avatar'

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size too large. Maximum 5MB allowed.' },
        { status: 400 }
      );
    }

    // Check permissions for product images
    if (type === 'product' && !isAdmin(authResult.user)) {
      return NextResponse.json(
        { success: false, error: 'Admin privileges required for product images' },
        { status: 403 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = path.extname(file.name);
    const filename = `${timestamp}-${randomString}${extension}`;

    // Determine upload directory based on type
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', type || 'general');
    
    // Create directory if it doesn't exist
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Write file
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // Generate public URL
    const publicUrl = `/uploads/${type || 'general'}/${filename}`;

    return NextResponse.json({
      success: true,
      data: {
        filename,
        url: publicUrl,
        size: file.size,
        type: file.type
      },
      message: 'File uploaded successfully'
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

// DELETE /api/upload - Delete uploaded file
export async function DELETE(req: NextRequest) {
  try {
    const authResult = await verifyToken(req);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const filename = searchParams.get('filename');
    const type = searchParams.get('type') || 'general';

    if (!filename) {
      return NextResponse.json(
        { success: false, error: 'Filename is required' },
        { status: 400 }
      );
    }

    // Check permissions
    if (type === 'product' && !isAdmin(authResult.user)) {
      return NextResponse.json(
        { success: false, error: 'Admin privileges required' },
        { status: 403 }
      );
    }

    const filePath = path.join(process.cwd(), 'public', 'uploads', type, filename);

    try {
      const fs = require('fs').promises;
      await fs.unlink(filePath);

      return NextResponse.json({
        success: true,
        message: 'File deleted successfully'
      });
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'File not found or already deleted' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}