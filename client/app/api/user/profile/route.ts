import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getApiAuthContext } from '@/lib/auth-server';
import { createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// GET /api/user/profile — Get current user profile
export async function GET(request: NextRequest) {
  try {
    const { auth, error: authError } = await getApiAuthContext(request);
    if (authError || !auth) {
      return authError || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Try Supabase REST first (fast & reliable over HTTPS port 443)
    try {
      const admin = createAdminClient();
      const { data: sbUser, error: sbErr } = await admin
        .from('users')
        .select('*')
        .eq('id', auth.userId)
        .maybeSingle();

      if (sbUser) {
        return NextResponse.json({ user: sbUser });
      }
    } catch (sbErr) {
      console.warn('[Profile GET] Supabase REST error, trying Prisma:', sbErr);
    }

    // 2. Prisma fallback
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        businessName: true,
        country: true,
        phone: true,
        phoneVerified: true,
        address: true,
        avatar: true,
        verificationStatus: true,
        preferredCurrency: true,
        b2bActive: true,
        b2cActive: true,
        contactInfo: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  businessName: z.string().max(200).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  phoneVerified: z.boolean().optional(),
  address: z.string().max(500).optional().nullable(),
  avatar: z.string().optional().nullable(),
  preferredCurrency: z.string().max(10).optional(),
  website: z.string().max(200).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  socialLinks: z.record(z.any()).optional().nullable(),
  businessType: z.string().max(100).optional().nullable(),
  taxId: z.string().max(100).optional().nullable(),
});

// PATCH /api/user/profile — Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const { auth, error: authError } = await getApiAuthContext(request);
    if (authError || !auth) {
      return authError || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Remove undefined fields
    const data: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(parsed.data)) {
      if (value !== undefined) {
        data[key] = value;
      }
    }

    // 1. Try Supabase REST update
    try {
      const admin = createAdminClient();
      const { data: updatedSb, error: sbErr } = await admin
        .from('users')
        .update(data)
        .eq('id', auth.userId)
        .select('*')
        .maybeSingle();

      if (updatedSb) {
        return NextResponse.json({ user: updatedSb });
      }
    } catch (sbErr) {
      console.warn('[Profile PATCH] Supabase REST update error, trying Prisma:', sbErr);
    }

    // 2. Prisma fallback
    const user = await prisma.user.update({
      where: { id: auth.userId },
      data: data as any,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        businessName: true,
        country: true,
        phone: true,
        phoneVerified: true,
        address: true,
        avatar: true,
        verificationStatus: true,
        preferredCurrency: true,
        b2bActive: true,
        b2cActive: true,
        contactInfo: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Profile PATCH error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

// DELETE /api/user/profile — Delete user account
export async function DELETE(request: NextRequest) {
  try {
    const { auth, error: authError } = await getApiAuthContext(request);
    if (authError || !auth) {
      return authError || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Cascade deletion is handled at the DB level via schema.prisma onDelete: Cascade
    await prisma.user.delete({
      where: { id: auth.userId },
    });

    return NextResponse.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Profile DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
