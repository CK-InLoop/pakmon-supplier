/**
 * Setup Fixed Admin User Script
 * 
 * This script creates or updates a fixed admin/supplier user with 
 * known credentials that work consistently.
 * 
 * Run with: npx tsx scripts/setup-user.ts
 * 
 * Login Credentials:
 *   Email: sales@pakmon.com
 *   Password: PakmonSales@123
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Fixed credentials - use these to login
const ADMIN_EMAIL = 'sales@pakmon.com';
const ADMIN_PASSWORD = 'PakmonSales@123';
const ADMIN_NAME = 'Pakmon Admin';

async function main() {
    console.log('🔧 Setting up fixed admin user...\n');

    try {
        await prisma.$connect();
        console.log('✅ Connected to database\n');

        // Hash the password
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
        console.log('🔐 Password hashed successfully');

        // Check if user exists
        const existingUser = await prisma.users.findUnique({
            where: { email: ADMIN_EMAIL },
        });

        let userId: string;

        if (existingUser) {
            console.log('📝 User already exists, updating password...');
            await prisma.users.update({
                where: { email: ADMIN_EMAIL },
                data: {
                    password: hashedPassword,
                    name: ADMIN_NAME,
                    role: 'SUPPLIER',
                    emailVerified: new Date(),
                },
            });
            userId = existingUser.id;
            console.log('✅ User password updated');
        } else {
            console.log('➕ Creating new user...');
            const newUser = await prisma.users.create({
                data: {
                    name: ADMIN_NAME,
                    email: ADMIN_EMAIL,
                    password: hashedPassword,
                    role: 'SUPPLIER',
                    emailVerified: new Date(),
                },
            });
            userId = newUser.id;
            console.log('✅ User created');
        }

        // Check if supplier exists for this user
        const existingSupplier = await prisma.suppliers.findFirst({
            where: { userId: userId },
        });

        if (existingSupplier) {
            console.log('📝 Supplier profile exists, updating password...');
            await prisma.suppliers.update({
                where: { id: existingSupplier.id },
                data: {
                    password: hashedPassword,
                    name: ADMIN_NAME,
                    email: ADMIN_EMAIL,
                    status: 'APPROVED',
                    verified: true,
                },
            });
            console.log('✅ Supplier password updated');
        } else {
            console.log('➕ Creating supplier profile...');
            await prisma.suppliers.create({
                data: {
                    userId: userId,
                    name: ADMIN_NAME,
                    email: ADMIN_EMAIL,
                    password: hashedPassword,
                    companyName: 'Pakmon Dairy Solutions',
                    phone: '+91 9876543210',
                    address: 'Mumbai, India',
                    status: 'APPROVED',
                    verified: true,
                    category: 'Dairy & Food',
                    subCategory: 'Dairy plants',
                },
            });
            console.log('✅ Supplier profile created');
        }

        console.log('\n========================================');
        console.log('🎉 SETUP COMPLETE!');
        console.log('========================================');
        console.log(`📧 Email:    ${ADMIN_EMAIL}`);
        console.log(`🔑 Password: ${ADMIN_PASSWORD}`);
        console.log('========================================');
        console.log('You can now login with these credentials.\n');

    } catch (error) {
        console.error('\n❌ Setup Failed!');
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
