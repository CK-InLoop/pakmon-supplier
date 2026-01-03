/**
 * Migration script to fix emailVerified field type mismatch
 * 
 * Problem: Some records have emailVerified as boolean (true/false)
 * Expected: emailVerified should be DateTime or null
 * 
 * Run with: npx tsx scripts/fix-email-verified.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔧 Fixing emailVerified field type mismatch...\n');

    try {
        // Fix records where emailVerified is boolean true -> convert to current date
        const resultTrue = await prisma.$runCommandRaw({
            update: 'users',
            updates: [
                {
                    q: { emailVerified: true },
                    u: { $set: { emailVerified: new Date() } },
                    multi: true,
                },
            ],
        });
        console.log('✅ Updated records with emailVerified: true ->', resultTrue);

        // Fix records where emailVerified is boolean false -> convert to null
        const resultFalse = await prisma.$runCommandRaw({
            update: 'users',
            updates: [
                {
                    q: { emailVerified: false },
                    u: { $set: { emailVerified: null } },
                    multi: true,
                },
            ],
        });
        console.log('✅ Updated records with emailVerified: false ->', resultFalse);

        console.log('\n🎉 Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
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

