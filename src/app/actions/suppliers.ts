'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

export async function createSupplier(data: {
    name: string;
    companyName: string;
    email: string;
    phone: string;
    address?: string;
}) {
    try {
        const { name, companyName, email, phone, address } = data;

        // 1. Check if user already exists
        const existingUser = await prisma.users.findUnique({
            where: { email },
        });

        if (existingUser) {
            return { success: false, error: 'User with this email already exists.' };
        }

        // 2. Hash default password
        // In a real app, we might email this to them, or have them set it on first login.
        // For now, setting a predictable default or random one.
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
                password: hashedPassword, // Schema requires this
                companyName,
                phone,
                address,
                status: 'APPROVED', // Auto-approve for now
                verified: true,
            },
        });

        revalidatePath('/dashboard/suppliers');
        return { success: true, supplier: newSupplier };
    } catch (error) {
        console.error('Error creating supplier:', error);
        return { success: false, error: 'Failed to create supplier.' };
    }
}

export async function getSuppliers() {
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
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        return { success: false, error: 'Failed to fetch suppliers.' };
    }
}
