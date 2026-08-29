const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProduct() {
  try {
    console.log('\n=== Checking LABSA Factory Products ===\n');
    
    // Check all products in this subcategory
    const allProducts = await prisma.products.findMany({
      where: {
        category: 'Factories for SALE',
        subCategory: {
          contains: 'LABSA',
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        title: true,
        name: true,
        supplierId: true,
        category: true,
        subCategory: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Found ${allProducts.length} total products in LABSA subcategory:\n`);
    
    allProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.title || product.name}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   Supplier ID: ${product.supplierId || 'NULL (Direct Product)'}`);
      console.log(`   SubCategory: ${product.subCategory}`);
      console.log(`   Created: ${product.createdAt}`);
      console.log('');
    });

    // Check direct products specifically
    const directProducts = allProducts.filter(p => p.supplierId === null);
    console.log(`\n✓ Direct products (without supplier): ${directProducts.length}`);
    
    const supplierProducts = allProducts.filter(p => p.supplierId !== null);
    console.log(`✓ Supplier products: ${supplierProducts.length}`);

    // Check the most recent product
    if (allProducts.length > 0) {
      const latest = allProducts[0];
      console.log(`\n📌 Most recent product:`);
      console.log(`   ${latest.title || latest.name}`);
      console.log(`   Type: ${latest.supplierId ? 'Under Supplier' : 'Direct Product'}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProduct();
