'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createSupplier(data: {
    name: string;
    companyName: string;
    email: string;
    phone: string;
    address?: string;
    category?: string;
    subCategory?: string;
    profileImage?: string;
}) {
    try {
        const { name, companyName, email, phone, address, category, subCategory, profileImage } = data;

        // Create Supplier as a standalone record (no user account needed)
        const newSupplier = await prisma.suppliers.create({
            data: {
                name,
                email,
                companyName,
                phone,
                address,
                category,
                subCategory,
                profileImage,
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
        // Use case-insensitive matching for category and subCategory
        if (filters?.category) {
            where.category = { equals: filters.category, mode: 'insensitive' };
        }
        if (filters?.subCategory) {
            where.subCategory = { equals: filters.subCategory, mode: 'insensitive' };
        }

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

export async function getSupplierById(id: string) {
    try {
        const supplier = await prisma.suppliers.findUnique({
            where: { id },
        });

        if (!supplier) {
            return { success: false, error: 'Supplier not found.' };
        }

        return { success: true, supplier };
    } catch (error: any) {
        console.error('Error fetching supplier:', error);
        return { success: false, error: error.message || 'Failed to fetch supplier.' };
    }
}

export async function updateSupplier(id: string, data: {
    name?: string;
    companyName?: string;
    email?: string;
    phone?: string;
    address?: string;
    category?: string;
    subCategory?: string;
    profileImage?: string;
}) {
    try {
        const { name, companyName, email, phone, address, category, subCategory, profileImage } = data;

        const updatedSupplier = await prisma.suppliers.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(companyName && { companyName }),
                ...(email && { email }),
                ...(phone && { phone }),
                ...(address !== undefined && { address }),
                ...(category && { category }),
                ...(subCategory && { subCategory }),
                ...(profileImage !== undefined && { profileImage }),
            },
        });

        revalidatePath('/dashboard/suppliers');
        return { success: true, supplier: updatedSupplier };
    } catch (error: any) {
        console.error('Error updating supplier:', error);
        return { success: false, error: error.message || 'Failed to update supplier.' };
    }
}

export async function deleteSupplier(id: string) {
    try {
        // First delete all products associated with this supplier
        await prisma.products.deleteMany({
            where: { supplierId: id }
        });

        // Then delete the supplier
        await prisma.suppliers.delete({
            where: { id }
        });

        revalidatePath('/dashboard/suppliers');
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting supplier:', error);
        return { success: false, error: error.message || 'Failed to delete supplier.' };
    }
}
