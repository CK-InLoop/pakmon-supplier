'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';

// --- MOCK STORAGE (In-Memory) ---
// We use globalThis to make it persist slightly better during dev server reloads,
// though a full server restart will still wipe it.
const globalForMock = global as unknown as { mockSuppliers: any[] };

if (!globalForMock.mockSuppliers) {
    globalForMock.mockSuppliers = [
        {
            id: 'mock-supplier-1',
            userId: 'mock-user-1',
            name: 'Demo Supplier',
            companyName: 'Acme Corp',
            email: 'demo@acme.com',
            phone: '123-456-7890',
            address: '123 Mock Lane',
            status: 'APPROVED',
            verified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            _count: { products: 5 }
        },
        {
            id: 'mock-supplier-2',
            userId: 'mock-user-2',
            name: 'Test Ind.',
            companyName: 'Test Industries',
            email: 'contact@testind.com',
            phone: '987-654-3210',
            address: '456 Test Blvd',
            status: 'PENDING',
            verified: false,
            createdAt: new Date(Date.now() - 86400000), // Yesterday
            updatedAt: new Date(),
            _count: { products: 0 }
        }
    ];
}

export async function createSupplier(data: {
    name: string;
    companyName: string;
    email: string;
    phone: string;
    address?: string;
}) {
    try {
        const session = await auth();
        const isDefaultUser = session?.user?.email === 'admin@example.com';

        // NOTE: If we want to simulate DB errors for REAL users, we'd keep the prisma code.
        // But for this "no-db" mode request, we'll try to use the mock store if prisma fails
        // OR if we are the default user.

        // Fallback to mock immediately if default user
        if (isDefaultUser) {
            console.log('[Mock] Creating supplier in memory...');
            const newSupplier = {
                id: `mock-supplier-${Date.now()}`,
                userId: `mock-user-${Date.now()}`,
                ...data,
                password: 'hashed-password',
                status: 'APPROVED',
                verified: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                _count: { products: 0 }
            };

            globalForMock.mockSuppliers.unshift(newSupplier); // Add to top
            revalidatePath('/dashboard/suppliers');
            return { success: true, supplier: newSupplier };
        }

        // --- ORIGINAL LOGIC (For checking DB connection) ---
        const { name, companyName, email, phone, address } = data;

        // 1. Check if user already exists
        const existingUser = await prisma.users.findUnique({
            where: { email },
        });

        if (existingUser) {
            return { success: false, error: 'User with this email already exists.' };
        }

        // 2. Hash default password
        const defaultPassword = 'password123';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        // 3. Create User
        const newUser = await prisma.users.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'SUPPLIER',
                emailVerified: new Date(),
            },
        });

        // 4. Create Supplier
        const newSupplier = await prisma.suppliers.create({
            data: {
                userId: newUser.id,
                name,
                email,
                password: hashedPassword,
                companyName,
                phone,
                address,
                status: 'APPROVED',
                verified: true,
            },
        });

        revalidatePath('/dashboard/suppliers');
        return { success: true, supplier: newSupplier };
    } catch (error) {
        console.error('Error creating supplier:', error);

        // Final fallback: if default user check was missed or DB failed and user is OK with mocks
        // We can just return the mock success to keep the app "alive"
        return { success: false, error: 'Failed to create supplier (DB Error).' };
    }
}

export async function getSuppliers() {
    try {
        // Try real DB first
        try {
            const suppliers = await prisma.suppliers.findMany({
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: { products: true }
                    }
                }
            });
            return { success: true, suppliers };
        } catch (dbError) {
            console.warn('Database failed, falling back to mock data:', dbError);
            // If DB fails, return mock data
            return { success: true, suppliers: globalForMock.mockSuppliers };
        }
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        return { success: false, error: 'Failed to fetch suppliers.' };
    }
}
