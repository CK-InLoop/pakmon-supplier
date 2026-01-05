/**
 * Basic MongoDB Connection Test
 * 
 * This script bypasses Prisma to test the raw MongoDB connection.
 * Useful if the Prisma engine is crashing or locked.
 * 
 * Run with: npx tsx scripts/mongo-test.ts
 */

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

const url = process.env.DATABASE_URL;

async function main() {
    console.log('🔍 Starting Raw MongoDB Diagnostic...');

    if (!url) {
        console.error('❌ Error: DATABASE_URL is not set in .env');
        process.exit(1);
    }

    console.log('📡 Testing connection to:', url.replace(/:([^:@]{1,})@/, ':****@'));

    const client = new MongoClient(url);

    try {
        await client.connect();
        console.log('✅ Connected successfully to MongoDB!');

        const db = client.db();
        const collections = await db.listCollections().toArray();
        console.log('📊 Collections found:', collections.map(c => c.name).join(', ') || 'None (Empty DB)');

        if (collections.length > 0) {
            for (const col of collections) {
                const count = await db.collection(col.name).countDocuments();
                console.log(`- ${col.name}: ${count} documents`);
            }
        }

    } catch (error) {
        console.error('❌ MongoDB Connection failed:');
        console.error(error);
    } finally {
        await client.close();
    }
}

main().catch(console.error);
