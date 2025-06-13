// src/app/api/products/route.ts - Complete CRUD operations with Cloudinary
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyToken, isAdmin } from '@/lib/auth';
import { uploadImageToCloudinary, deleteImageFromCloudinary } from '@/lib/cloudinary';
import { ObjectId } from 'mongodb';

// GET - Fetch all products with filtering and pagination (unchanged)
export async function GET(req: NextRequest) {
  console.log('GET /api/products - Starting request processing');

  try {
    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    const activeOnly = searchParams.get('activeOnly') !== 'false';
    
    console.log('Query parameters:', { page, limit, category, search, sortBy, activeOnly });
    
    // Connect to database
    const { db } = await connectToDatabase();
    
    // Build filter query
    const filter: any = {};
    
    if (activeOnly) {
      filter.isActive = true;
    }
    
    if (category && category !== 'all') {
      filter.category = { $regex: category, $options: 'i' };
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }
    
    console.log('Filter applied:', filter);
    
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;
    
    // Get total count for pagination
    const totalProducts = await db.collection('products').countDocuments(filter);
    
    // Fetch products with pagination and sorting
    const products = await db.collection('products')
      .find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalProducts / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    console.log(`Found ${products.length} products out of ${totalProducts} total`);
    
    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        hasNextPage,
        hasPrevPage,
        limit
      },
      message: 'Products fetched successfully'
    });
    
  } catch (error) {
    console.error('Error in GET /api/products:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch products',
        details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// POST - Create new product with Cloudinary integration
export async function POST(req: NextRequest) {
  console.log('POST /api/products - Starting request processing');

  try {
    // Step 1: Verify authentication
    console.log('Step 1: Verifying authentication...');
    const authResult = await verifyToken(req);
    
    if (!authResult.success || !authResult.user) {
      console.log('Authentication failed:', authResult.error);
      return NextResponse.json(
        { success: false, error: authResult.error || 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Step 2: Check admin privileges
    console.log('Step 2: Checking admin privileges...');
    if (!isAdmin(authResult.user)) {
      console.log('Admin privileges check failed');
      return NextResponse.json(
        { success: false, error: 'Admin privileges required' },
        { status: 403 }
      );
    }
    
    // Step 3: Parse FormData
    console.log('Step 3: Parsing FormData...');
    let formData;
    try {
      formData = await req.formData();
      console.log('FormData parsed successfully');
    } catch (parseError) {
      console.error('FormData parsing error:', parseError);
      return NextResponse.json(
        { success: false, error: 'Invalid FormData in request' },
        { status: 400 }
      );
    }
    
    // Step 4: Extract and validate fields from FormData
    console.log('Step 4: Extracting fields from FormData...');
    const name = formData.get('name')?.toString().trim();
    const description = formData.get('description')?.toString().trim();
    const priceStr = formData.get('price')?.toString();
    const stockStr = formData.get('stock')?.toString();
    const category = formData.get('category')?.toString().trim() || '';
    const brand = formData.get('brand')?.toString().trim() || 'Generic';
    const imageFile = formData.get('image') as File | null;
    
    console.log('Extracted fields:', {
      name,
      description,
      price: priceStr,
      stock: stockStr,
      category,
      hasImage: !!imageFile,
      imageSize: imageFile?.size
    });
    
    // Validate required fields
    const missingFields = [];
    if (!name) missingFields.push('name');
    if (!description) missingFields.push('description');
    if (!priceStr) missingFields.push('price');
    if (!stockStr) missingFields.push('stock');
    if (!imageFile || imageFile.size === 0) missingFields.push('image');
    
    if (missingFields.length > 0) {
      console.log('Missing required fields:', missingFields);
      return NextResponse.json(
        { success: false, error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Parse numeric values
    const price = parseFloat(priceStr!);
    const stock = parseInt(stockStr!);
    
    if (isNaN(price) || price <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid price is required' },
        { status: 400 }
      );
    }
    
    if (isNaN(stock) || stock < 0) {
      return NextResponse.json(
        { success: false, error: 'Valid stock quantity is required' },
        { status: 400 }
      );
    }

    // Validate image file
    if (imageFile!.size > 10 * 1024 * 1024) { // 10MB limit
      return NextResponse.json(
        { success: false, error: 'Image file size must be less than 10MB' },
        { status: 400 }
      );
    }

    if (!imageFile!.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'Only image files are allowed' },
        { status: 400 }
      );
    }
    
    // Step 5: Upload image to Cloudinary
    console.log('Step 5: Uploading image to Cloudinary...');
    let imageUrl = '';
    try {
      imageUrl = await uploadImageToCloudinary(imageFile!);
      console.log('Image uploaded successfully to Cloudinary:', imageUrl);
    } catch (uploadError) {
      console.error('Cloudinary upload failed:', uploadError);
      return NextResponse.json(
        { success: false, error: 'Failed to upload image. Please try again.' },
        { status: 500 }
      );
    }
    
    // Step 6: Connect to database
    console.log('Step 6: Connecting to database...');
    const { db } = await connectToDatabase();
    
    // Step 7: Create product object
    const sku = `${category.toUpperCase() || 'GEN'}-${Date.now()}`;
    
    const newProduct = {
      name,
      description,
      price,
      stock,
      category,
      brand,
      imageUrl, // This is now the Cloudinary URL
      sku,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: authResult.user.id
    };
    
    console.log('Product object created:', { name: newProduct.name, sku: newProduct.sku, imageUrl: newProduct.imageUrl });
    
    // Step 8: Insert into database
    try {
      const result = await db.collection('products').insertOne(newProduct);
      console.log('Product inserted successfully:', result.insertedId);
      
      return NextResponse.json({
        success: true,
        data: { ...newProduct, _id: result.insertedId },
        message: 'Product created successfully'
      }, { status: 201 });
    } catch (dbError) {
      // If database insert fails, delete the uploaded image from Cloudinary
      console.error('Database insert failed, cleaning up Cloudinary image...');
      await deleteImageFromCloudinary(imageUrl);
      throw dbError;
    }
    
  } catch (error) {
    console.error('Unexpected error in POST /api/products:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// PUT - Update existing product with Cloudinary integration
export async function PUT(req: NextRequest) {
  console.log('PUT /api/products - Starting request processing');

  try {
    // Step 1: Verify authentication
    const authResult = await verifyToken(req);
    
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Authentication required' },
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
    let updateData;
    const contentType = req.headers.get('content-type');
    
    if (contentType?.includes('multipart/form-data')) {
      // Handle FormData (for image updates)
      const formData = await req.formData();
      const productId = formData.get('id')?.toString();
      
      if (!productId) {
        return NextResponse.json(
          { success: false, error: 'Product ID is required' },
          { status: 400 }
        );
      }
      
      updateData = {
        id: productId,
        name: formData.get('name')?.toString().trim(),
        description: formData.get('description')?.toString().trim(),
        price: formData.get('price') ? parseFloat(formData.get('price')!.toString()) : undefined,
        stock: formData.get('stock') ? parseInt(formData.get('stock')!.toString()) : undefined,
        category: formData.get('category')?.toString().trim(),
        brand: formData.get('brand')?.toString().trim(),
        isActive: formData.get('isActive') === 'true',
        imageFile: formData.get('image') as File | null
      };
    } else {
      // Handle JSON data
      updateData = await req.json();
    }
    
    const { id, imageFile, ...fieldsToUpdate } = updateData;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }
    
    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID format' },
        { status: 400 }
      );
    }
    
    // Step 4: Connect to database
    const { db } = await connectToDatabase();
    
    // Step 5: Check if product exists
    const existingProduct = await db.collection('products').findOne({ _id: new ObjectId(id) });
    
    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Step 6: Prepare update object
    const updateObject: any = {
      updatedAt: new Date(),
      updatedBy: authResult.user.id
    };
    
    // Only include fields that are provided and valid
    Object.keys(fieldsToUpdate).forEach(key => {
      const value = fieldsToUpdate[key];
      if (value !== undefined && value !== null && value !== '') {
        if (key === 'price' && (isNaN(value) || value <= 0)) {
          return; // Skip invalid price
        }
        if (key === 'stock' && (isNaN(value) || value < 0)) {
          return; // Skip invalid stock
        }
        updateObject[key] = value;
      }
    });
    
    // Step 7: Handle image upload if provided
    if (imageFile && imageFile.size > 0) {
      console.log('Processing new image file:', imageFile.name);
      
      // Validate image file
      if (imageFile.size > 10 * 1024 * 1024) { // 10MB limit
        return NextResponse.json(
          { success: false, error: 'Image file size must be less than 10MB' },
          { status: 400 }
        );
      }

      if (!imageFile.type.startsWith('image/')) {
        return NextResponse.json(
          { success: false, error: 'Only image files are allowed' },
          { status: 400 }
        );
      }
      
      try {
        // Upload new image to Cloudinary
        const newImageUrl = await uploadImageToCloudinary(imageFile);
        updateObject.imageUrl = newImageUrl;
        console.log('New image uploaded successfully:', newImageUrl);
        
        // Delete old image from Cloudinary (if it exists and is a Cloudinary URL)
        if (existingProduct.imageUrl) {
          await deleteImageFromCloudinary(existingProduct.imageUrl);
          console.log('Old image deleted from Cloudinary');
        }
      } catch (uploadError) {
        console.error('Failed to upload new image:', uploadError);
        return NextResponse.json(
          { success: false, error: 'Failed to upload new image. Please try again.' },
          { status: 500 }
        );
      }
    }
    
    // Step 8: Update product
    const result = await db.collection('products').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateObject }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Step 9: Fetch updated product
    const updatedProduct = await db.collection('products').findOne({ _id: new ObjectId(id) });
    
    console.log('Product updated successfully:', id);
    
    return NextResponse.json({
      success: true,
      data: updatedProduct,
      message: 'Product updated successfully'
    });
    
  } catch (error) {
    console.error('Error in PUT /api/products:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update product',
        details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete product with Cloudinary cleanup
export async function DELETE(req: NextRequest) {
  console.log('DELETE /api/products - Starting request processing');

  try {
    // Step 1: Verify authentication
    const authResult = await verifyToken(req);
    
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Authentication required' },
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
    
    // Step 3: Get product ID from query params or body
    const { searchParams } = new URL(req.url);
    let productId = searchParams.get('id');
    
    if (!productId) {
      try {
        const body = await req.json();
        productId = body.id;
      } catch {
        // If JSON parsing fails, continue with null productId
      }
    }
    
    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }
    
    // Validate ObjectId
    if (!ObjectId.isValid(productId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID format' },
        { status: 400 }
      );
    }
    
    // Step 4: Connect to database
    const { db } = await connectToDatabase();
    
    // Step 5: Check if product exists and get image URL
    const existingProduct = await db.collection('products').findOne({ _id: new ObjectId(productId) });
    
    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Step 6: Perform soft delete (set isActive to false)
    const result = await db.collection('products').updateOne(
      { _id: new ObjectId(productId) },
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
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Step 7: Delete image from Cloudinary (optional - you might want to keep for recovery)
    // Uncomment the following lines if you want to delete images immediately
    /*
    if (existingProduct.imageUrl) {
      try {
        await deleteImageFromCloudinary(existingProduct.imageUrl);
        console.log('Image deleted from Cloudinary:', existingProduct.imageUrl);
      } catch (error) {
        console.error('Failed to delete image from Cloudinary:', error);
        // Don't fail the request if image deletion fails
      }
    }
    */
    
    console.log('Product soft deleted successfully:', productId);
    
    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });
    
  } catch (error) {
    console.error('Error in DELETE /api/products:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete product',
        details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
}