/**
 * Database Diagnostic and Seeding Script
 * 
 * This script verifies connectivity to MongoDB via Prisma and 
 * seeds dummy data based on the schema.
 * 
 * Run with: npx tsx scripts/db-diagnostic.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Starting Database Diagnostic...\n');

    try {
        // 1. Connection Test
        console.log('📡 Testing connection to database...');
        await prisma.$connect();
        console.log('✅ Connected successfully!\n');

        // 2. Current State Report
        console.log('📊 Current Data Status:');
        const [userCount, supplierCount, productCount] = await Promise.all([
            prisma.users.count(),
            prisma.suppliers.count(),
            prisma.products.count(),
        ]);
        console.log(`- Users: ${userCount}`);
        console.log(`- Suppliers: ${supplierCount}`);
        console.log(`- Products: ${productCount}\n`);

        // 3. Seeding Dummy Data
        console.log('🌱 Seeding Dummy Data...');

        const timestamp = Date.now();
        const testEmail = `diagnostic-${timestamp}@example.com`;
        const testPassword = 'password123';
        const hashedPassword = await bcrypt.hash(testPassword, 10);

        // A. Create User
        console.log(`- Creating user: ${testEmail}`);
        const user = await prisma.users.create({
            data: {
                name: 'Diagnostic User',
                email: testEmail,
                password: hashedPassword,
                role: 'SUPPLIER',
                emailVerified: new Date(),
            }
        });

        // B. Create Supplier
        console.log(`- Creating supplier profile for user: ${user.id}`);
        const supplier = await prisma.suppliers.create({
            data: {
                userId: user.id,
                name: 'Diagnostic Supplier',
                email: testEmail,
                password: hashedPassword,
                companyName: 'Diagnostic Dairy Solutions Ltd.',
                phone: '+91 9999999999',
                address: '123 Tech Park, Phase 1, Gurgaon',
                status: 'APPROVED',
                verified: true,
            }
        });

        // C. Create Products
        console.log(`- Creating dummy products for supplier: ${supplier.id}`);
        const product1 = await prisma.products.create({
            data: {
                supplierId: supplier.id,
                name: 'Automated Milking System X1',
                title: 'AMS X1 - Precision Milking',
                category: 'Equipment',
                description: 'High-precision automated milking system with health monitoring.',
                shortDescription: 'Precision milking robot with smart sensing.',
                fullDescription: 'The AMS X1 provides full automation for your dairy farm, including teat cleanup, attachment, and performance analytics.',
                specifications: 'Capacity: 60 cows/day, Power: 5kW, Material: Stainless Steel',
                tags: ['milking', 'automation', 'dairy'],
                status: 'APPROVED',
                price: 1250000,
                availability: 'available',
            }
        });

        const product2 = await prisma.products.create({
            data: {
                supplierId: supplier.id,
                name: 'Dairy Cooling Tank 5000L',
                title: '5000L Bulk Milk Cooler',
                category: 'Storage',
                description: 'Stainless steel bulk milk cooler with rapid cooling technology.',
                shortDescription: '5000L capacity cooler for fresh milk storage.',
                fullDescription: 'Equipped with dual compressors and digital temperature control for optimal milk preservation.',
                specifications: 'Volume: 5000L, Cooling time: <3 hours, material: SS-304',
                tags: ['cooling', 'storage', 'stainless-steel'],
                status: 'PENDING',
                price: 450000,
                availability: 'available',
            }
        });

        console.log(`✅ Dummy products created: ${product1.id}, ${product2.id}\n`);

        // 4. Verification Check
        console.log('🧪 Verifying data integrity...');
        const verifiedSupplier = await prisma.suppliers.findUnique({
            where: { id: supplier.id },
            include: {
                products: true,
                user: true
            }
        });

        if (verifiedSupplier && verifiedSupplier.products.length === 2) {
            console.log('✅ Data integrity verified: Supplier has linked user and 2 products.');
        } else {
            console.log('⚠️ Data integrity check failed: Could not find all linked records.');
        }

        console.log('\n✨ Diagnostic and Seeding Complete!');
        console.log('-----------------------------------');
        console.log(`Login Email:    ${testEmail}`);
        console.log(`Password:       ${testPassword}`);
        console.log('-----------------------------------');
        console.log('You can now log in with these credentials to check the dashboard.');

    } catch (error) {
        console.error('\n❌ Diagnostic Failed!');
        console.error(error);
        process.exit(1);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
