import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyToken, isAdmin } from '@/lib/auth';

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

    // Step 5: Test orders query with simplified approach first
    console.log('📋 Fetching orders (simplified query)...');
    const orders = await db.collection('orders')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    console.log('📋 Orders fetched:', orders.length);

    // Step 6: If we need user details, do a separate query (optional)
    // For now, let's skip the complex aggregation and just return orders
    
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
    console.error('💥 Error stack:', error.stack);
    
    // Return more detailed error info for debugging
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch orders',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create new order (unchanged)
export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyToken(req);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const {
      items,
      shippingAddress,
      totalAmount,
      paymentMethod = 'cash_on_delivery',
      prescriptionImages = [],
      notes = ''
    } = await req.json();

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
    
    // Handle user ID conversion for orders
    let userId;
    try {
      userId = ObjectId.isValid(authResult.user.id) 
        ? new ObjectId(authResult.user.id) 
        : authResult.user.id;
    } catch (error) {
      console.error('Error converting user ID:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }

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

    // Check prescription requirement
    if (requiresPrescription && prescriptionImages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Prescription images are required for prescription medicines' },
        { status: 400 }
      );
    }

    const shippingCost = 2000;
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const newOrder = {
      userId,
      orderNumber,
      items: orderItems,
      subtotal: calculatedTotal,
      shippingCost: shippingCost,
      totalAmount: totalAmount,
      status: 'pending',
      paymentMethod,
      paymentStatus: 'pending',
      shippingAddress: {
        fullName: shippingAddress.fullName,
        address: shippingAddress.address,
        city: shippingAddress.city,
        postalCode: shippingAddress.postalCode || '',
        country: shippingAddress.country,
        phone: shippingAddress.phone || ''
      },
      prescriptionImages,
      notes,
      requiresPrescription,
      createdAt: new Date(),
      updatedAt: new Date()
    };

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

    // Clear user's cart
    try {
      await db.collection('carts').updateOne(
        { userId },
        {
          $set: {
            items: [],
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );
    } catch (cartError) {
      console.warn('Could not clear cart:', cartError);
    }

    return NextResponse.json({
      success: true,
      data: { ...newOrder, _id: result.insertedId },
      message: 'Order created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

// PUT method unchanged...
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