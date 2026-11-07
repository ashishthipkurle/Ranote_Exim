import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getApiAuthContext } from '@/lib/auth-server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/dashboard/categories — Product categories with stats
export async function GET(request: NextRequest) {
  try {
    const { auth, error: authError } = await getApiAuthContext(request);
    if (authError || !auth) {
      return authError || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    if (auth.role === 'EXPORTER' || auth.role === 'ADMIN') {
      try {
        let query = supabase.from('products').select('id, category, price').is('deletedAt', null);
        if (auth.role !== 'ADMIN') {
          query = query.eq('exporterId', auth.userId);
        }
        const { data: prods = [] } = await query;
        const catMap = new Map<string, { count: number; rev: number }>();
        prods?.forEach((p: any) => {
          const c = p.category || 'Other';
          const cur = catMap.get(c) || { count: 0, rev: 0 };
          cur.count++;
          cur.rev += Number(p.price) || 0;
          catMap.set(c, cur);
        });

        const categories = Array.from(catMap.entries()).map(([cat, val]) => ({
          name: cat,
          category: cat,
          productCount: val.count,
          revenue: val.rev,
        })).sort((a, b) => b.productCount - a.productCount);

        return NextResponse.json({ categories });
      } catch (err) {
        return NextResponse.json({ categories: [] });
      }
    }

    if (auth.role === 'IMPORTER') {
      try {
        const { data: prods = [] } = await supabase.from('products').select('category').eq('available', true).is('deletedAt', null);
        const catMap = new Map<string, number>();
        prods?.forEach((p: any) => {
          const c = p.category || 'Other';
          catMap.set(c, (catMap.get(c) || 0) + 1);
        });

        const categories = Array.from(catMap.entries()).map(([cat, count]) => ({
          name: cat,
          category: cat,
          productCount: 0,
          totalAvailable: count,
          spent: 0,
          isPreferred: false,
        }));

        return NextResponse.json({
          role: 'IMPORTER',
          preferredCategories: [],
          categories,
        });
      } catch (err) {
        return NextResponse.json({ role: 'IMPORTER', preferredCategories: [], categories: [] });
      }
    }

    return NextResponse.json({ categories: [] });
  } catch (error) {
    console.error('Categories error:', error);
    return NextResponse.json({ categories: [] });
  }
}

// POST /api/dashboard/categories — Toggle category preference
export async function POST(request: NextRequest) {
  try {
    const { auth, error: authError } = await getApiAuthContext(request);
    if (authError || !auth || (auth.role !== 'IMPORTER' && auth.role !== 'ADMIN')) {
      return authError || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { category } = await request.json();
    if (!category) return NextResponse.json({ error: 'Category required' }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { contactInfo: true },
    }).catch(() => null);

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const contact = (user.contactInfo as Record<string, any>) || {};
    const preferences: string[] = Array.isArray(contact.preferredCategories) ? contact.preferredCategories : [];
    const updatedPreferences = preferences.includes(category)
      ? preferences.filter((c: string) => c !== category)
      : [...preferences, category];

    await prisma.user.update({
      where: { id: auth.userId },
      data: {
        contactInfo: {
          ...contact,
          preferredCategories: updatedPreferences,
        },
      },
    }).catch(() => null);

    return NextResponse.json({ isPreferred: updatedPreferences.includes(category), preferredCategories: updatedPreferences });
  } catch (error) {
    console.error('Category toggle error:', error);
    return NextResponse.json({ error: 'Failed to toggle preference' }, { status: 500 });
  }
}
