import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const count = await (prisma as any).carouselImages.count({
            where: { isActive: true },
        });
        return NextResponse.json({ count });
    } catch (error: any) {
        console.error('Error counting carousel images:', error);
        return NextResponse.json({ count: 0 });
    }
}
