const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDirectProducts() {
  try {
    console.log('\n=== Checking Direct Products ===\n');
    
    const allProducts = await prisma.products.findMany({
      where: {
        supplierId: null
      },
      select: {
        id: true,
        title: true,
        name: true,
        category: true,
        subCategory: true,
        supplierId: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    console.log(`Found ${allProducts.length} direct products (without supplier):\n`);
    
    if (allProducts.length === 0) {
      console.log('❌ No direct products found in database!\n');
    } else {
      allProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.title || product.name}`);
        console.log(`   ID: ${product.id}`);
        console.log(`   Category: ${product.category}`);
        console.log(`   SubCategory: ${product.subCategory}`);
        console.log(`   Created: ${product.createdAt}`);
        console.log('');
      });
    }

    // Also check for the specific category
    const factoryProducts = await prisma.products.findMany({
      where: {
        supplierId: null,
        category: 'Factories for SALE'
      }
    });

    console.log(`\nProducts in "Factories for SALE" category: ${factoryProducts.length}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDirectProducts();
