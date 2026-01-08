import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch all active carousel images (public endpoint for reusable-template)
export async function GET() {
    try {
        const images = await (prisma as any).carouselImages.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' },
            select: {
                id: true,
                imageUrl: true,
                title: true,
                description: true,
                link: true,
                order: true,
            },
        });

        return NextResponse.json({
            success: true,
            images,
        });
    } catch (error: any) {
        console.error('Error fetching carousel images:', error);
        return NextResponse.json({
            success: false,
            images: [],
            error: error.message
        });
    }
}
