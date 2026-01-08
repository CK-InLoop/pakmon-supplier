'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getCarouselImages() {
    try {
        const images = await prisma.carouselImages.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' },
        });
        return { success: true, images };
    } catch (error: any) {
        console.error('Error fetching carousel images:', error);
        return { success: false, error: error.message || 'Failed to fetch carousel images.' };
    }
}

export async function getAllCarouselImages() {
    try {
        const images = await prisma.carouselImages.findMany({
            orderBy: { order: 'asc' },
        });
        return { success: true, images };
    } catch (error: any) {
        console.error('Error fetching carousel images:', error);
        return { success: false, error: error.message || 'Failed to fetch carousel images.' };
    }
}

export async function addCarouselImage(data: {
    imageUrl: string;
    title?: string;
    description?: string;
    link?: string;
}) {
    try {
        // Get the highest order number
        const lastImage = await prisma.carouselImages.findFirst({
            orderBy: { order: 'desc' },
        });
        const nextOrder = (lastImage?.order || 0) + 1;

        const newImage = await prisma.carouselImages.create({
            data: {
                imageUrl: data.imageUrl,
                title: data.title || '',
                description: data.description || '',
                link: data.link || '/products',
                order: nextOrder,
                isActive: true,
            },
        });

        revalidatePath('/dashboard');
        revalidatePath('/dashboard/carousel');
        return { success: true, image: newImage };
    } catch (error: any) {
        console.error('Error adding carousel image:', error);
        return { success: false, error: error.message || 'Failed to add carousel image.' };
    }
}

export async function deleteCarouselImage(id: string) {
    try {
        await prisma.carouselImages.delete({
            where: { id },
        });

        revalidatePath('/dashboard');
        revalidatePath('/dashboard/carousel');
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting carousel image:', error);
        return { success: false, error: error.message || 'Failed to delete carousel image.' };
    }
}

export async function toggleCarouselImageActive(id: string, isActive: boolean) {
    try {
        const updatedImage = await prisma.carouselImages.update({
            where: { id },
            data: { isActive },
        });

        revalidatePath('/dashboard');
        revalidatePath('/dashboard/carousel');
        return { success: true, image: updatedImage };
    } catch (error: any) {
        console.error('Error updating carousel image:', error);
        return { success: false, error: error.message || 'Failed to update carousel image.' };
    }
}

export async function getCarouselImagesCount() {
    try {
        const count = await prisma.carouselImages.count({
            where: { isActive: true },
        });
        return { success: true, count };
    } catch (error: any) {
        console.error('Error counting carousel images:', error);
        return { success: false, count: 0 };
    }
}
