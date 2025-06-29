const { connectToDatabase } = require('./src/lib/mongodb.ts');

async function checkStock() {
  try {
    console.log('Connecting to database...');
    const { db } = await connectToDatabase();
    
    console.log('=== ALL PRODUCTS AND THEIR STOCK LEVELS ===');
    const products = await db.collection('products').find({}, { 
      projection: { name: 1, stock: 1, _id: 0 } 
    }).toArray();
    
    console.log('Products in database:');
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}: ${product.stock} units`);
    });
    
    console.log(`\nTotal products: ${products.length}`);
    
    const lowStock = await db.collection('products').countDocuments({
      stock: { $lte: 15 }
    });
    console.log(`Products with stock <= 15: ${lowStock}`);
    
    const mediumStock = await db.collection('products').countDocuments({
      stock: { $gt: 15, $lt: 50 }
    });
    console.log(`Products with stock 16-49: ${mediumStock}`);
    
    const highStock = await db.collection('products').countDocuments({
      stock: { $gte: 50 }
    });
    console.log(`Products with stock >= 50: ${highStock}`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkStock();
