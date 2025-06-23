import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyToken, isAdmin } from '@/lib/auth';
import cloudinary from '@/lib/cloudinary';

// Helper function to upload prescription file to Cloudinary
async function uploadPrescriptionToCloudinary(file: File, orderId: string): Promise<string> {
  try {
    console.log('☁️ Uploading prescription to Cloudinary...');

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${base64}`;

    // Upload to Cloudinary with prescription-specific settings
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'pharmashop/prescriptions', // Organize prescriptions in their own folder
      public_id: `prescription_${orderId}_${Date.now()}`, // Unique filename
      transformation: [
        { width: 1200, height: 1600, crop: 'limit' }, // Keep prescriptions readable
        { quality: 'auto' }, // Auto optimize quality
        { format: 'auto' } // Auto choose best format
      ],
      resource_type: 'auto', // Support images and PDFs
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'webp']
    });

    console.log('✅ Prescription uploaded successfully to Cloudinary:', result.secure_url);
    return result.secure_url;
  } catch (error) {
    console.error('❌ Error uploading prescription to Cloudinary:', error);
    throw new Error('Failed to upload prescription file');
  }
}

// GET /api/orders - Get user's orders or all orders (admin)
export async function GET(req: NextRequest) {
  console.log('🔍 Orders API called');

  try {
    // Step 1: Test authentication
    console.log('🔐 Testing authentication...');
    const authResult = await verifyToken(req);
    console.log('🔐 Auth result:', { success: authResult.success, userId: authResult.user?.id });

    if (!authResult.success || !authResult.user) {
      console.log('❌ Authentication failed:', authResult.error);
      return NextResponse.json(
        { success: false, error: authResult.error || 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('✅ Authentication successful, user ID:', authResult.user.id);

    // Step 2: Test database connection
    console.log('🗄️ Testing database connection...');
    const { db } = await connectToDatabase();
    console.log('✅ Database connected');

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');

    // Step 3: Build filter with proper ObjectId handling
    console.log('🔍 Building filter...');
    let filter: any = {};

    if (!isAdmin(authResult.user)) {
      // Handle user ID conversion safely
      try {
        const userId = authResult.user.id;
        console.log('👤 Converting user ID to ObjectId:', userId);

        // Check if it's already a valid ObjectId string
        if (ObjectId.isValid(userId)) {
          filter.userId = new ObjectId(userId);
        } else {
          // If not valid ObjectId, try to extract from string or use as is
          console.warn('⚠️ User ID is not a valid ObjectId:', userId);
          filter.userId = userId; // Use as string if ObjectId conversion fails
        }

        console.log('👤 User filter applied:', filter.userId);
      } catch (userIdError) {
        console.error('💥 Error converting user ID:', userIdError);
        return NextResponse.json(
          { success: false, error: 'Invalid user ID format' },
          { status: 400 }
        );
      }
    } else {
      console.log('👑 Admin access - no user filter');
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    console.log('🔍 Final filter:', filter);

    const skip = (page - 1) * limit;

    // Step 4: Test simple query first
    console.log('📊 Testing simple count query...');
    const total = await db.collection('orders').countDocuments(filter);
    console.log('📊 Total orders found:', total);

    if (total === 0) {
      console.log('📋 No orders found for this user/filter');
      return NextResponse.json({
        success: true,
        data: {
          orders: [],
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0
          }
        }
      });
    }

    // Step 5: Fetch orders with user information using proper type conversion
    console.log('📋 Fetching orders with user details...');
    const orders = await db.collection('orders')
      .aggregate([
        { $match: filter },
        {
          $addFields: {
            // Convert userId to ObjectId if it's a string
            userIdAsObjectId: {
              $cond: {
                if: { $eq: [{ $type: "$userId" }, "string"] },
                then: { $toObjectId: "$userId" },
                else: "$userId"
              }
            }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userIdAsObjectId',
            foreignField: '_id',
            as: 'userDetails'
          }
        },
        {
          $addFields: {
            userInfo: {
              $cond: {
                if: { $gt: [{ $size: '$userDetails' }, 0] },
                then: {
                  name: { $arrayElemAt: ['$userDetails.name', 0] },
                  email: { $arrayElemAt: ['$userDetails.email', 0] },
                  phone: { $arrayElemAt: ['$userDetails.phone', 0] }
                },
                else: {
                  name: 'Utilisateur non trouvé',
                  email: '',
                  phone: ''
                }
              }
            }
          }
        },
        { $project: { userDetails: 0, userIdAsObjectId: 0 } }, // Remove temporary fields
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit }
      ])
      .toArray();

    console.log('📋 Orders fetched with user info:', orders.length);
    if (orders.length > 0) {
      console.log('📋 First order user info:', orders[0].userInfo);
    }

    return NextResponse.json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('💥 Detailed error in orders API:', error);
    if (error instanceof Error) {
      console.error('💥 Error stack:', error.stack);
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch orders',
        details: typeof error === 'object' && error !== null && 'message' in error ? (error as { message: string }).message : String(error),
        stack: process.env.NODE_ENV === 'development' && typeof error === 'object' && error !== null && 'stack' in error ? (error as { stack?: string }).stack : undefined
      },
      { status: 500 }
    );
  }
}


// POST /api/orders - Create new order with Cloudinary prescription upload
export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyToken(req);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if request is FormData (file upload) or JSON
    const contentType = req.headers.get('content-type');
    let orderData: any;
    let prescriptionFile: File | null = null;

    if (contentType?.includes('multipart/form-data')) {
      // Handle FormData (with file upload)
      const formData = await req.formData();
      const orderDataString = formData.get('orderData') as string;

      if (!orderDataString) {
        return NextResponse.json(
          { success: false, error: 'Order data is required' },
          { status: 400 }
        );
      }

      orderData = JSON.parse(orderDataString);
      prescriptionFile = formData.get('prescriptionFile') as File | null;
    } else {
      // Handle regular JSON request (backward compatibility)
      orderData = await req.json();
    }

    const {
      items,
      shippingAddress,
      totalAmount,
      paymentMethod = 'cash_on_delivery',
      prescriptionData = {},
      notes = ''
    } = orderData;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order items are required' },
        { status: 400 }
      );
    }

    // Validate shipping address
    if (!shippingAddress) {
      return NextResponse.json(
        { success: false, error: 'Shipping address is required' },
        { status: 400 }
      );
    }

    const requiredFields = ['fullName', 'address', 'city', 'country'];
    const missingFields = requiredFields.filter(field => !shippingAddress[field] || shippingAddress[field].trim() === '');

    if (missingFields.length > 0) {
      return NextResponse.json(
        { success: false, error: `Complete shipping address is required. Missing: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    if (!totalAmount || totalAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid total amount is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // 🔧 FIXED: Handle user ID conversion for orders
    let userId: ObjectId;
    try {
      const userIdString = authResult.user.id;
      console.log('🔍 Original user ID from auth:', userIdString);

      if (!ObjectId.isValid(userIdString)) {
        console.error('❌ Invalid user ID format:', userIdString);
        return NextResponse.json(
          { success: false, error: 'Invalid user ID format' },
          { status: 400 }
        );
      }

      userId = new ObjectId(userIdString); // Always store as ObjectId
      console.log('✅ User ID converted to ObjectId:', userId.toString());

    } catch (error) {
      console.error('💥 Error converting user ID:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // 🔧 FIXED: Get user information for the order (userId is already ObjectId)
    console.log('🔍 Looking up user with ObjectId:', userId.toString());
    const user = await db.collection('users').findOne({ _id: userId });
    if (!user) {
      console.error('❌ User not found with ID:', userId.toString());
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('✅ User found:', { name: user.name, email: user.email });

    // Validate products and check stock
    const productIds = items.map((item: any) => new ObjectId(item.productId));
    const products = await db.collection('products')
      .find({ _id: { $in: productIds }, isActive: { $ne: false } })
      .toArray();

    if (products.length !== items.length) {
      return NextResponse.json(
        { success: false, error: 'Some products are not available' },
        { status: 400 }
      );
    }

    // Check stock and calculate total
    let calculatedTotal = 0;
    const orderItems = [];
    let requiresPrescription = false;

    for (const item of items) {
      const product = products.find(p => p._id.toString() === item.productId);

      if (!product) {
        return NextResponse.json(
          { success: false, error: `Product ${item.productId} not found` },
          { status: 400 }
        );
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { success: false, error: `Insufficient stock for ${product.name}. Available: ${product.stock}` },
          { status: 400 }
        );
      }

      if (product.prescriptionRequired) {
        requiresPrescription = true;
      }

      const itemPrice = item.price || product.price;
      const itemTotal = itemPrice * item.quantity;
      calculatedTotal += itemTotal;

      orderItems.push({
        productId: new ObjectId(item.productId),
        name: product.name,
        price: itemPrice,
        quantity: item.quantity,
        subtotal: itemTotal,
        imageUrl: product.imageUrl || ''
      });
    }

    const shippingCost = 2000;
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Prepare prescription data
    let prescriptionInfo: any = {
      clinicName: prescriptionData.clinicName || '',
      prescriptionFile: null,
      uploadedAt: null
    };

    // Handle prescription file upload to Cloudinary if present
    if (prescriptionFile && prescriptionFile.size > 0) {
      try {
        console.log('📁 Processing prescription file upload to Cloudinary...');
        const cloudinaryUrl = await uploadPrescriptionToCloudinary(prescriptionFile, orderNumber);
        prescriptionInfo.prescriptionFile = cloudinaryUrl;
        prescriptionInfo.uploadedAt = new Date();
        prescriptionInfo.originalFileName = prescriptionFile.name;
        prescriptionInfo.fileSize = prescriptionFile.size;
        prescriptionInfo.fileType = prescriptionFile.type;
        console.log('✅ Prescription file uploaded to Cloudinary:', cloudinaryUrl);
      } catch (fileError) {
        console.error('❌ Error uploading prescription file:', fileError);
        return NextResponse.json(
          { success: false, error: 'Failed to upload prescription file' },
          { status: 500 }
        );
      }
    }

    // 🔧 FIXED: Create order with proper ObjectId userId
    const newOrder = {
      userId, // This is now guaranteed to be an ObjectId
      orderNumber,
      items: orderItems,
      subtotal: calculatedTotal,
      shippingCost: shippingCost,
      totalAmount: totalAmount,
      status: 'pending',
      paymentMethod,
      paymentStatus: 'pending',
      // User information (from logged-in account)
      userInfo: {
        name: user.name || user.email || 'Utilisateur',
        email: user.email,
        phone: user.phone || ''
      },
      // Shipping address (delivery information - "Livré à")
      shippingAddress: {
        fullName: shippingAddress.fullName, // This is "Livré à"
        address: shippingAddress.address,
        city: shippingAddress.city,
        postalCode: shippingAddress.postalCode || '',
        country: shippingAddress.country,
        phone: shippingAddress.phone || ''
      },
      // Prescription information
      prescription: prescriptionInfo,
      prescriptionImages: [], // Keep for backward compatibility
      notes,
      requiresPrescription,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('💾 Creating order with data:', {
      orderNumber,
      userId: userId.toString(),
      userName: user.name,
      userEmail: user.email,
      deliverTo: shippingAddress.fullName,
      hasFile: !!prescriptionFile,
      clinicName: prescriptionData.clinicName
    });

    const result = await db.collection('orders').insertOne(newOrder);

    // Update product stock
    for (const item of items) {
      await db.collection('products').updateOne(
        { _id: new ObjectId(item.productId) },
        {
          $inc: { stock: -item.quantity },
          $set: { updatedAt: new Date() }
        }
      );
    }

    // 🔧 FIXED: Clear user's cart (userId is already ObjectId)
    try {
      await db.collection('carts').updateOne(
        { userId }, // Use ObjectId directly
        {
          $set: {
            items: [],
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );
      console.log('✅ Cart cleared for user:', userId.toString());
    } catch (cartError) {
      console.warn('⚠️ Could not clear cart:', cartError);
    }

    console.log('✅ Order created successfully:', orderNumber);

    return NextResponse.json({
      success: true,
      data: { ...newOrder, _id: result.insertedId },
      message: 'Order created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('💥 Error creating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

// PUT /api/orders - Update order status (unchanged)
export async function PUT(req: NextRequest) {
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

    const { orderId, status, paymentStatus, notes } = await req.json();

    if (!orderId || !status) {
      return NextResponse.json(
        { success: false, error: 'Order ID and status are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid order status' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    if (paymentStatus && validPaymentStatuses.includes(paymentStatus)) {
      updateData.paymentStatus = paymentStatus;
    }

    if (notes) {
      updateData.adminNotes = notes;
    }

    const result = await db.collection('orders').updateOne(
      { _id: new ObjectId(orderId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully'
    });

  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
      { status: 500 }
    );
  }
}