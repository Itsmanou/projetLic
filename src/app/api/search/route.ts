// src/app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const category = searchParams.get('category');
    const minPrice = parseFloat(searchParams.get('minPrice') || '0');
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '999999');
    const inStock = searchParams.get('inStock') === 'true';
    const prescriptionRequired = searchParams.get('prescriptionRequired');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const sortBy = searchParams.get('sortBy') || 'relevance';

    const { db } = await connectToDatabase();

    // Build search filter
    const filter: any = { isActive: true };

    // Text search
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { brand: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } },
        { activeIngredients: { $in: [new RegExp(query, 'i')] } }
      ];
    }

    // Category filter
    if (category && category !== 'all') {
      filter.category = category;
    }

    // Price range filter
    filter.price = { $gte: minPrice, $lte: maxPrice };

    // Stock filter
    if (inStock) {
      filter.stock = { $gt: 0 };
    }

    // Prescription filter
    if (prescriptionRequired !== null && prescriptionRequired !== undefined) {
      filter.prescriptionRequired = prescriptionRequired === 'true';
    }

    // Build sort criteria
    let sortCriteria: any = {};
    switch (sortBy) {
      case 'price_asc':
        sortCriteria = { price: 1 };
        break;
      case 'price_desc':
        sortCriteria = { price: -1 };
        break;
      case 'name_asc':
        sortCriteria = { name: 1 };
        break;
      case 'name_desc':
        sortCriteria = { name: -1 };
        break;
      case 'newest':
        sortCriteria = { createdAt: -1 };
        break;
      case 'oldest':
        sortCriteria = { createdAt: 1 };
        break;
      default:
        // Relevance sort (by stock, then by name)
        sortCriteria = { stock: -1, name: 1 };
    }

    const skip = (page - 1) * limit;

    // Execute search
    const products = await db.collection('products')
      .find(filter)
      .sort(sortCriteria)
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db.collection('products').countDocuments(filter);

    // Get search suggestions if query is provided
    interface Product {
      _id?: string;
      name: string;
      description?: string;
      brand?: string;
      tags?: string[];
      activeIngredients?: string[];
      category?: string;
      price: number;
      stock?: number;
      isActive: boolean;
      prescriptionRequired?: boolean;
      createdAt?: Date;
    }

    interface Suggestion {
      name: string;
    }

    let suggestions: Suggestion[] = [];
    if (query && products.length < 5) {
      suggestions = await db.collection('products')
        .find({
          isActive: true,
          $or: [
            { name: { $regex: query.substring(0, 3), $options: 'i' } },
            { tags: { $in: [new RegExp(query.substring(0, 3), 'i')] } }
          ]
        })
        .limit(5)
        .project({ name: 1, _id: 0 })
        .toArray() as Suggestion[];
    }

    return NextResponse.json({
      success: true,
      data: {
        products,
        suggestions: suggestions.map(s => s.name),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
       // src/app/api/search/route.ts (continued)
        filters: {
          query,
          category,
          minPrice,
          maxPrice,
          inStock,
          prescriptionRequired,
          sortBy
        }
      }
    });

  } catch (error) {
    console.error('Error searching products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search products' },
      { status: 500 }
    );
  }
}
