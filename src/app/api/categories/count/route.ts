import { NextResponse } from 'next/server';
import { getCategoriesCount } from '@/app/actions/categories';

export async function GET() {
    const result = await getCategoriesCount();
    return NextResponse.json({ count: result.count });
}
