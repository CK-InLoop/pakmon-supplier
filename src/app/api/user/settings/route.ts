import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const user = await prisma.users.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ user });
    } catch (error: any) {
        console.error('Get user settings error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch user settings' },
            { status: 500 }
        );
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { name, email } = body;

        // Validate inputs
        if (!name && !email) {
            return NextResponse.json(
                { error: 'Name or email is required' },
                { status: 400 }
            );
        }

        // Check if email is already taken by another user
        if (email) {
            const existingUser = await prisma.users.findFirst({
                where: {
                    email: { equals: email, mode: 'insensitive' },
                    NOT: { id: session.user.id }
                }
            });

            if (existingUser) {
                return NextResponse.json(
                    { error: 'This email is already in use' },
                    { status: 400 }
                );
            }
        }

        // Update user
        const updateData: any = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;

        const updatedUser = await prisma.users.update({
            where: { id: session.user.id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
            },
        });

        return NextResponse.json({
            message: 'Settings updated successfully',
            user: updatedUser,
        });
    } catch (error: any) {
        console.error('Update user settings error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update settings' },
            { status: 500 }
        );
    }
}
