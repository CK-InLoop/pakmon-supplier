'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

function normalizeCategoryValue(value: string) {
    return value.normalize('NFKC').replace(/\s+/g, ' ').trim().toLocaleLowerCase();
}

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

        // Check for duplicate: same company name in the same subcategory (email duplicates are allowed)
        const existingSupplier = await prisma.suppliers.findFirst({
            where: {
                AND: [
                    { companyName: { equals: companyName, mode: 'insensitive' } },
                    { subCategory: subCategory || '' }
                ]
            }
        });

        if (existingSupplier) {
            return { success: false, error: 'A supplier with this company name already exists in this subcategory.' };
        }

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
        // Category values come from database-backed navigation/dropdowns.
        if (filters?.category) {
            where.category = filters.category;
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

        // Prisma's MongoDB case-insensitive mode treats characters such as
        // parentheses as regex syntax. Compare subcategories in application
        // code so long/symbol-heavy names match literally while retaining
        // compatibility with older records that differ only by case/spacing.
        const filteredSuppliers = filters?.subCategory
            ? suppliers.filter(supplier =>
                supplier.subCategory &&
                normalizeCategoryValue(supplier.subCategory) === normalizeCategoryValue(filters.subCategory!)
            )
            : suppliers;

        return { success: true, suppliers: filteredSuppliers };
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
