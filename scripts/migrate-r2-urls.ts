/**
 * Migration script to update existing R2 URLs in the database
 * from old domain to new custom domain (cdn.flavidairysolution.com)
 * 
 * Usage: npx tsx scripts/migrate-r2-urls.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Old domain patterns to replace
const OLD_DOMAINS = [
  'https://pub-',
  'https://pub-b72d1fe979ef43129be869dee88b50fc.r2.dev',
  'https://pub-your-r2-public-domain.r2.dev',
  // Add any other old domain patterns here
];

// New domain
const NEW_DOMAIN = 'https://cdn.flavidairysolution.com';

async function migrateR2Urls() {
  console.log('Starting R2 URL migration...\n');

  try {
    // Get all products
    const products = await prisma.product.findMany({
      select: {
        id: true,
        title: true,
        images: true,
        pdfFiles: true,
      },
    });

    console.log(`Found ${products.length} products to check\n`);

    let updatedCount = 0;
    let totalImagesUpdated = 0;
    let totalPdfsUpdated = 0;

    for (const product of products) {
      let needsUpdate = false;
      const updatedImages = [...product.images];
      const updatedPdfs = [...product.pdfFiles];

      // Check and update images
      for (let i = 0; i < updatedImages.length; i++) {
        const oldUrl = updatedImages[i];
        const newUrl = migrateUrl(oldUrl);
        if (newUrl !== oldUrl) {
          updatedImages[i] = newUrl;
          needsUpdate = true;
          totalImagesUpdated++;
        }
      }

      // Check and update PDFs
      for (let i = 0; i < updatedPdfs.length; i++) {
        const oldUrl = updatedPdfs[i];
        const newUrl = migrateUrl(oldUrl);
        if (newUrl !== oldUrl) {
          updatedPdfs[i] = newUrl;
          needsUpdate = true;
          totalPdfsUpdated++;
        }
      }

      // Update product if URLs changed
      if (needsUpdate) {
        await prisma.product.update({
          where: { id: product.id },
          data: {
            images: updatedImages,
            pdfFiles: updatedPdfs,
          },
        });

        updatedCount++;
        console.log(`✓ Updated product: ${product.title} (${product.id})`);
      }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Total products checked: ${products.length}`);
    console.log(`Products updated: ${updatedCount}`);
    console.log(`Total images updated: ${totalImagesUpdated}`);
    console.log(`Total PDFs updated: ${totalPdfsUpdated}`);
    console.log('\nMigration completed successfully!');

  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

function migrateUrl(url: string): string {
  // Check if URL needs migration
  for (const oldDomain of OLD_DOMAINS) {
    if (url.includes(oldDomain)) {
      // Extract the path/key from the old URL
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      
      // Construct new URL with custom domain
      return `${NEW_DOMAIN}${path}`;
    }
  }

  // If URL already uses new domain or doesn't match old patterns, return as-is
  return url;
}

// Run migration
migrateR2Urls()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

