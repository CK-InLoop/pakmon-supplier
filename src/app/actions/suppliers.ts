'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';

import { mockStore } from '@/lib/mock-store';

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

            mockStore.suppliers.unshift(newSupplier); // Add to top
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
        const session = await auth();
        const isDefaultUser = session?.user?.email === 'admin@example.com';

        let dbSuppliers: any[] = [];
        try {
            dbSuppliers = await prisma.suppliers.findMany({
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: { products: true }
                    }
                }
            });
        } catch (dbError) {
            console.warn('Database failed while fetching suppliers:', dbError);
        }

        // If not default user and DB succeeded/failed, handle accordingly
        if (!isDefaultUser) {
            if (dbSuppliers.length > 0) return { success: true, suppliers: dbSuppliers };
            // If DB failed (length 0 due to catch) or is just empty, return what we have
            return { success: true, suppliers: dbSuppliers };
        }

        // For Default User (Admin), always merge with mock data
        // Calculate dynamic product counts for mock suppliers
        const enrichedMockSuppliers = mockStore.suppliers.map(s => ({
            ...s,
            _count: {
                products: mockStore.products.filter(p => p.supplierId === s.id).length
            }
        }));

        // Combine DB and Mock, avoiding duplicates if any (by ID)
        const combined = [...dbSuppliers];
        enrichedMockSuppliers.forEach(ms => {
            if (!combined.find(ds => ds.id === ms.id)) {
                combined.push(ms);
            }
        });

        // Sort by createdAt desc
        combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return { success: true, suppliers: combined };
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        return { success: false, error: 'Failed to fetch suppliers.' };
    }
}
