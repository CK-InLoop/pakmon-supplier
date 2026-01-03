/**
 * Seed script to create a default user and supplier
 * 
 * Run with: npx tsx scripts/seed-user.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding default user...\n');

    const email = 'supplier@pakmon.com'; // Default email
    const password = 'password123';         // Default password
    const name = 'Pakmon Supplier';

    try {
        // 1. Check if user already exists
        const existingUser = await prisma.users.findUnique({
            where: { email },
        });

        if (existingUser) {
            console.log('⚠️ User already exists. Skipping creation.');
            return;
        }

        // 2. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Create user
        const newUser = await prisma.users.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'SUPPLIER',
                emailVerified: new Date(),
            },
        });
        console.log(`✅ Created user: ${newUser.id} (${newUser.email})`);

        // 4. Create associated supplier record
        // Note: Supplier schema has a mandatory password field too, so we populate it.
        const newSupplier = await prisma.suppliers.create({
            data: {
                userId: newUser.id,
                name,
                email,
                password: hashedPassword, // Storing here as well per schema requirement
                status: 'APPROVED',
                verified: true,
                companyName: 'Pakmon Default Company',
            },
        });
        console.log(`✅ Created supplier profile: ${newSupplier.id}`);

        console.log('\n🎉 Seed completed successfully!');
        console.log('-----------------------------------');
        console.log(`Email:    ${email}`);
        console.log(`Password: ${password}`);
        console.log('-----------------------------------');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        throw error;
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
