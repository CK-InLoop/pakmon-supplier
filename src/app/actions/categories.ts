'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Get all active categories with their subcategories (for sidebar/forms)
export async function getCategories() {
    try {
        const categories = await prisma.category.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' },
            include: {
                subCategories: {
                    where: { isActive: true },
                    orderBy: { order: 'asc' },
                },
            },
        });
        return { success: true, categories };
    } catch (error: any) {
        console.error('Error fetching categories:', error);
        return { success: false, error: error.message || 'Failed to fetch categories.' };
    }
}

// Get all categories (including inactive) for admin management
export async function getAllCategories() {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { order: 'asc' },
            include: {
                subCategories: {
                    orderBy: { order: 'asc' },
                },
            },
        });
        return { success: true, categories };
    } catch (error: any) {
        console.error('Error fetching categories:', error);
        return { success: false, error: error.message || 'Failed to fetch categories.' };
    }
}

// Create a new category
export async function createCategory(data: { name: string; icon?: string }) {
    try {
        // Get the highest order number
        const lastCategory = await prisma.category.findFirst({
            orderBy: { order: 'desc' },
        });
        const nextOrder = (lastCategory?.order || 0) + 1;

        const newCategory = await prisma.category.create({
            data: {
                name: data.name,
                icon: data.icon || 'Package',
                order: nextOrder,
                isActive: true,
            },
        });

        revalidatePath('/dashboard');
        revalidatePath('/dashboard/categories');
        return { success: true, category: newCategory };
    } catch (error: any) {
        console.error('Error creating category:', error);
        if (error.code === 'P2002') {
            return { success: false, error: 'A category with this name already exists.' };
        }
        return { success: false, error: error.message || 'Failed to create category.' };
    }
}

// Update a category
export async function updateCategory(id: string, data: { name?: string; icon?: string; order?: number; isActive?: boolean }) {
    try {
        const updatedCategory = await prisma.category.update({
            where: { id },
            data,
        });

        revalidatePath('/dashboard');
        revalidatePath('/dashboard/categories');
        return { success: true, category: updatedCategory };
    } catch (error: any) {
        console.error('Error updating category:', error);
        if (error.code === 'P2002') {
            return { success: false, error: 'A category with this name already exists.' };
        }
        return { success: false, error: error.message || 'Failed to update category.' };
    }
}

// Delete a category (cascades to subcategories)
export async function deleteCategory(id: string) {
    try {
        await prisma.category.delete({
            where: { id },
        });

        revalidatePath('/dashboard');
        revalidatePath('/dashboard/categories');
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting category:', error);
        return { success: false, error: error.message || 'Failed to delete category.' };
    }
}

// Toggle category active status
export async function toggleCategoryActive(id: string, isActive: boolean) {
    try {
        const updatedCategory = await prisma.category.update({
            where: { id },
            data: { isActive },
        });

        revalidatePath('/dashboard');
        revalidatePath('/dashboard/categories');
        return { success: true, category: updatedCategory };
    } catch (error: any) {
        console.error('Error toggling category:', error);
        return { success: false, error: error.message || 'Failed to toggle category.' };
    }
}

// Create a new subcategory
export async function createSubCategory(data: {
    categoryId: string;
    name: string;
    isHeading?: boolean
}) {
    try {
        // Get the highest order number for this category
        const lastSubCategory = await prisma.subCategory.findFirst({
            where: { categoryId: data.categoryId },
            orderBy: { order: 'desc' },
        });
        const nextOrder = (lastSubCategory?.order || 0) + 1;

        const newSubCategory = await prisma.subCategory.create({
            data: {
                categoryId: data.categoryId,
                name: data.name,
                isHeading: data.isHeading || false,
                order: nextOrder,
                isActive: true,
            },
        });

        revalidatePath('/dashboard');
        revalidatePath('/dashboard/categories');
        return { success: true, subCategory: newSubCategory };
    } catch (error: any) {
        console.error('Error creating subcategory:', error);
        return { success: false, error: error.message || 'Failed to create subcategory.' };
    }
}

// Update a subcategory
export async function updateSubCategory(id: string, data: {
    name?: string;
    order?: number;
    isHeading?: boolean;
    isActive?: boolean
}) {
    try {
        const updatedSubCategory = await prisma.subCategory.update({
            where: { id },
            data,
        });

        revalidatePath('/dashboard');
        revalidatePath('/dashboard/categories');
        return { success: true, subCategory: updatedSubCategory };
    } catch (error: any) {
        console.error('Error updating subcategory:', error);
        return { success: false, error: error.message || 'Failed to update subcategory.' };
    }
}

// Delete a subcategory
export async function deleteSubCategory(id: string) {
    try {
        await prisma.subCategory.delete({
            where: { id },
        });

        revalidatePath('/dashboard');
        revalidatePath('/dashboard/categories');
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting subcategory:', error);
        return { success: false, error: error.message || 'Failed to delete subcategory.' };
    }
}

// Toggle subcategory active status
export async function toggleSubCategoryActive(id: string, isActive: boolean) {
    try {
        const updatedSubCategory = await prisma.subCategory.update({
            where: { id },
            data: { isActive },
        });

        revalidatePath('/dashboard');
        revalidatePath('/dashboard/categories');
        return { success: true, subCategory: updatedSubCategory };
    } catch (error: any) {
        console.error('Error toggling subcategory:', error);
        return { success: false, error: error.message || 'Failed to toggle subcategory.' };
    }
}

// Reorder categories
export async function reorderCategories(orderedIds: string[]) {
    try {
        const updates = orderedIds.map((id, index) =>
            prisma.category.update({
                where: { id },
                data: { order: index },
            })
        );
        await prisma.$transaction(updates);

        revalidatePath('/dashboard');
        revalidatePath('/dashboard/categories');
        return { success: true };
    } catch (error: any) {
        console.error('Error reordering categories:', error);
        return { success: false, error: error.message || 'Failed to reorder categories.' };
    }
}

// Reorder subcategories within a category
export async function reorderSubCategories(categoryId: string, orderedIds: string[]) {
    try {
        const updates = orderedIds.map((id, index) =>
            prisma.subCategory.update({
                where: { id },
                data: { order: index },
            })
        );
        await prisma.$transaction(updates);

        revalidatePath('/dashboard');
        revalidatePath('/dashboard/categories');
        return { success: true };
    } catch (error: any) {
        console.error('Error reordering subcategories:', error);
        return { success: false, error: error.message || 'Failed to reorder subcategories.' };
    }
}

// Get categories count
export async function getCategoriesCount() {
    try {
        const count = await prisma.category.count({
            where: { isActive: true },
        });
        return { success: true, count };
    } catch (error: any) {
        console.error('Error counting categories:', error);
        return { success: false, count: 0 };
    }
}
