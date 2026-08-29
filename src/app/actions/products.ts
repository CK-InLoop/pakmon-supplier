'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createDirectProduct(data: {
    title: string;
    shortDescription: string;
    fullDescription: string;
    specifications?: string;
    category: string;
    subCategory: string;
    priceRange?: string;
    capacity?: string;
    tags?: string[];
    images?: string[];
    pdfFiles?: string[];
    youtubeUrl?: string;
}) {
    try {
        const {
            title,
            shortDescription,
            fullDescription,
            specifications,
            category,
            subCategory,
            priceRange,
            capacity,
            tags,
            images,
            pdfFiles,
            youtubeUrl
        } = data;

        // Validation
        if (!title || !shortDescription || !fullDescription || !category || !subCategory) {
            return {
                success: false,
                error: 'Title, descriptions, category, and subcategory are required.'
            };
        }

        // Create product without supplier (directly under subcategory)
        const newProduct = await prisma.products.create({
            data: {
                name: title,
                title,
                shortDescription,
                fullDescription,
                description: shortDescription,
                specifications,
                category,
                subCategory,
                priceRange,
                capacity,
                tags: tags || [],
                images: images || [],
                pdfFiles: pdfFiles || [],
                youtubeUrl,
                availability: 'available',
            },
        });

        revalidatePath('/dashboard/suppliers');
        revalidatePath('/dashboard/products');
        return { success: true, product: newProduct };
    } catch (error: any) {
        console.error('Error creating direct product:', error);
        return {
            success: false,
            error: error.message || 'Failed to create product.'
        };
    }
}

export async function getProducts(filters?: {
    category?: string;
    subCategory?: string;
    supplierId?: string;
}) {
    try {
        const where: any = {};

        if (filters?.supplierId) {
            where.supplierId = filters.supplierId;
        }

        if (filters?.category) {
            where.category = filters.category;
        }

        if (filters?.subCategory) {
            where.subCategory = filters.subCategory;
        }

        const products = await prisma.products.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                supplier: {
                    select: {
                        id: true,
                        name: true,
                        companyName: true,
                    }
                }
            }
        });

        return { success: true, products };
    } catch (error: any) {
        console.error('Error fetching products:', error);
        return {
            success: false,
            error: error.message || 'Failed to fetch products.'
        };
    }
}

export async function getProductById(id: string) {
    try {
        const product = await prisma.products.findUnique({
            where: { id },
            include: {
                supplier: {
                    select: {
                        id: true,
                        name: true,
                        companyName: true,
                    }
                }
            }
        });

        if (!product) {
            return { success: false, error: 'Product not found.' };
        }

        return { success: true, product };
    } catch (error: any) {
        console.error('Error fetching product:', error);
        return {
            success: false,
            error: error.message || 'Failed to fetch product.'
        };
    }
}

export async function updateProduct(id: string, data: {
    title?: string;
    shortDescription?: string;
    fullDescription?: string;
    specifications?: string;
    category?: string;
    subCategory?: string;
    priceRange?: string;
    capacity?: string;
    tags?: string[];
    images?: string[];
    pdfFiles?: string[];
    youtubeUrl?: string;
}) {
    try {
        const updatedProduct = await prisma.products.update({
            where: { id },
            data: {
                ...(data.title && { name: data.title, title: data.title }),
                ...(data.shortDescription && { shortDescription: data.shortDescription, description: data.shortDescription }),
                ...(data.fullDescription && { fullDescription: data.fullDescription }),
                ...(data.specifications !== undefined && { specifications: data.specifications }),
                ...(data.category && { category: data.category }),
                ...(data.subCategory && { subCategory: data.subCategory }),
                ...(data.priceRange !== undefined && { priceRange: data.priceRange }),
                ...(data.capacity !== undefined && { capacity: data.capacity }),
                ...(data.tags && { tags: data.tags }),
                ...(data.images && { images: data.images }),
                ...(data.pdfFiles && { pdfFiles: data.pdfFiles }),
                ...(data.youtubeUrl !== undefined && { youtubeUrl: data.youtubeUrl }),
            },
        });

        revalidatePath('/dashboard/suppliers');
        revalidatePath('/dashboard/products');
        return { success: true, product: updatedProduct };
    } catch (error: any) {
        console.error('Error updating product:', error);
        return {
            success: false,
            error: error.message || 'Failed to update product.'
        };
    }
}

export async function deleteProduct(id: string) {
    try {
        await prisma.products.delete({
            where: { id },
        });

        revalidatePath('/dashboard/suppliers');
        revalidatePath('/dashboard/products');
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting product:', error);
        return {
            success: false,
            error: error.message || 'Failed to delete product.'
        };
    }
}
