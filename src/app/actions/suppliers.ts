'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';

export async function createSupplier(data: {
    name: string;
    companyName: string;
    email: string;
    phone: string;
    address?: string;
    category?: string;
    subCategory?: string;
}) {
    try {
        const { name, companyName, email, phone, address, category, subCategory } = data;

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
                category,
                subCategory,
                status: 'APPROVED',
                verified: true,
            },
        });

        revalidatePath('/dashboard/suppliers');
        return { success: true, supplier: newSupplier };
    } catch (error: any) {
        console.error('Error creating supplier:', error);
        return { success: false, error: error.message || 'Failed to create supplier (DB Error).' };
    }
}

export async function getSuppliers(filters?: { category?: string; subCategory?: string }) {
    try {
        const where: any = {};
        if (filters?.category) where.category = filters.category;
        if (filters?.subCategory) where.subCategory = filters.subCategory;

        const suppliers = await prisma.suppliers.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { products: true }
                }
            }
        });

        return { success: true, suppliers };
    } catch (error: any) {
        console.error('Error fetching suppliers:', error);
        return { success: false, error: error.message || 'Failed to fetch suppliers.' };
    }
}
