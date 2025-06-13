// src/app/api/cart/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyToken } from '@/lib/auth';

// GET /api/cart - Get user's cart
export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyToken(req);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { db } = await connectToDatabase();
    
    // Get user's cart
    const cart = await db.collection('carts').findOne({ 
      userId: new ObjectId(authResult.user.id) 
    });

    if (!cart) {
      return NextResponse.json({
        success: true,
        data: { items: [], totalAmount: 0, totalItems: 0 }
      });
    }

    // Get product details for cart items
    const productIds = cart.items.map((item: any) => new ObjectId(item.productId));
    const products = await db.collection('products')
      .find({ _id: { $in: productIds } })
      .toArray();

    // Merge cart items with product details
    const cartItems = cart.items.map((item: any) => {
      const product = products.find(p => p._id.toString() === item.productId);
      return {
        ...item,
        product: product || null,
        subtotal: item.quantity * item.price
      };
    }).filter((item: any) => item.product !== null);

    const totalAmount = cartItems.reduce((sum: number, item: any) => sum + item.subtotal, 0);
    const totalItems = cartItems.reduce((sum: number, item: any) => sum + item.quantity, 0);

    return NextResponse.json({
      success: true,
      data: {
        items: cartItems,
        totalAmount,
        totalItems
      }
    });

  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}

// POST /api/cart - Add item to cart
export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyToken(req);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { productId, quantity = 1 } = await req.json();

    if (!productId || quantity < 1) {
      return NextResponse.json(
        { success: false, error: 'Valid product ID and quantity required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Check if product exists and is available
    const product = await db.collection('products').findOne({ 
      _id: new ObjectId(productId),
      isActive: true
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found or unavailable' },
        { status: 404 }
      );
    }

    if (product.stock < quantity) {
      return NextResponse.json(
        { success: false, error: 'Insufficient stock' },
        { status: 400 }
      );
    }

    const userId = new ObjectId(authResult.user.id);

    // Check if cart exists
    let cart = await db.collection('carts').findOne({ userId });

    if (!cart) {
      // Create new cart
      cart = {
        userId,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await db.collection('carts').insertOne(cart);
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item: any) => item.productId === productId
    );

    if (existingItemIndex > -1) {
      // Update quantity
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      
      if (product.stock < newQuantity) {
        return NextResponse.json(
          { success: false, error: 'Insufficient stock for requested quantity' },
          { status: 400 }
        );
      }

      await db.collection('carts').updateOne(
        { userId },
        {
          $set: {
            [`items.${existingItemIndex}.quantity`]: newQuantity,
            updatedAt: new Date()
          }
        }
      );
    } else {
      // Add new item
      const newItem = {
        productId,
        quantity,
        price: product.price,
        addedAt: new Date()
      };

      await db.collection('carts').updateOne(
        { userId },
        {
          $push: { items: newItem },
          $set: { updatedAt: new Date() }
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Item added to cart successfully'
    });

  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add item to cart' },
      { status: 500 }
    );
  }
}

// PUT /api/cart - Update cart item quantity
export async function PUT(req: NextRequest) {
  try {
    const authResult = await verifyToken(req);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { productId, quantity } = await req.json();

    if (!productId || quantity < 0) {
      return NextResponse.json(
        { success: false, error: 'Valid product ID and quantity required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const userId = new ObjectId(authResult.user.id);

    if (quantity === 0) {
      // Remove item from cart
      await db.collection('carts').updateOne(
        { userId },
        {
          $pull: { items: { productId } },
          $set: { updatedAt: new Date() }
        }
      );
    } else {
      // Check stock availability
      const product = await db.collection('products').findOne({ 
        _id: new ObjectId(productId) 
      });

      if (!product || product.stock < quantity) {
        return NextResponse.json(
          { success: false, error: 'Insufficient stock' },
          { status: 400 }
        );
      }

      // Update quantity
      await db.collection('carts').updateOne(
        { userId, "items.productId": productId },
        {
          $set: {
            "items.$.quantity": quantity,
            "items.$.price": product.price,
            updatedAt: new Date()
          }
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Cart updated successfully'
    });

  } catch (error) {
    console.error('Error updating cart:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update cart' },
      { status: 500 }
    );
  }
}

// DELETE /api/cart - Clear cart
export async function DELETE(req: NextRequest) {
  try {
    const authResult = await verifyToken(req);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { db } = await connectToDatabase();
    const userId = new ObjectId(authResult.user.id);

    await db.collection('carts').updateOne(
      { userId },
      {
        $set: {
          items: [],
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Cart cleared successfully'
    });

  } catch (error) {
    console.error('Error clearing cart:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear cart' },
      { status: 500 }
    );
  }
}