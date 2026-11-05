import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getApiAuthContext } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

// GET /api/dashboard/directory — Trading partners for the authenticated user
export async function GET(request: NextRequest) {
 try {
 const { auth, error: authError } = await getApiAuthContext(request);
 if (authError || !auth) {
 return authError || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 }

 const { searchParams } = new URL(request.url);
 const search = searchParams.get('search') || '';
 const page = parseInt(searchParams.get('page') || '1');
 const limit = parseInt(searchParams.get('limit') || '20');

 if (auth.role === 'EXPORTER' || auth.role === 'ADMIN') {
 // All Importers on the platform, with trade stats if they exist
 const partners = await prisma.$queryRaw`
 SELECT 
 u.id,
 u.name,
 u."businessName",
 u.country,
 u."verificationStatus",
 u.avatar,
 COUNT(DISTINCT o.id) as "orderCount",
 COALESCE(SUM(o."totalPrice"), 0) as "totalValue",
 (SELECT COUNT(*)::int FROM messages m WHERE m."senderId" = u.id AND m."receiverId" = ${auth.userId} AND m."isRead" = false) as "unreadCount"
 FROM users u
 LEFT JOIN orders o ON o."buyerId" = u.id AND o."sellerId" = ${auth.userId}
 WHERE u.role = 'IMPORTER'
 AND (
 ${search} = '' 
 OR u.name ILIKE '%' || ${search} || '%' 
 OR u."businessName" ILIKE '%' || ${search} || '%'
 OR u.country ILIKE '%' || ${search} || '%'
 )
 GROUP BY u.id, u.name, u."businessName", u.country, u."verificationStatus", u.avatar
 ORDER BY "orderCount" DESC, "totalValue" DESC, u.name ASC
 LIMIT ${limit} OFFSET ${(page - 1) * limit}
 ` as Array<{
 id: string;
 name: string;
 businessName: string | null;
 country: string | null;
 verificationStatus: string;
 avatar: string | null;
 orderCount: bigint;
 totalValue: number;
 unreadCount: number;
 }>;

 const totalResult = await prisma.$queryRaw`
 SELECT COUNT(*) as count
 FROM users u
 WHERE u.role = 'IMPORTER'
 AND (
 ${search} = '' 
 OR u.name ILIKE '%' || ${search} || '%' 
 OR u."businessName" ILIKE '%' || ${search} || '%'
 OR u.country ILIKE '%' || ${search} || '%'
 )
 ` as Array<{ count: bigint }>;

 return NextResponse.json({
 partners: partners.map((p) => ({
 id: p.id,
 name: p.name,
 businessName: p.businessName,
 country: p.country,
 verificationStatus: p.verificationStatus,
 avatar: p.avatar,
 orderCount: Number(p.orderCount),
 totalValue: Number(p.totalValue),
 unreadCount: p.unreadCount,
 })),
 pagination: {
 page,
 limit,
 total: Number(totalResult?.[0]?.count ?? 0),
 },
 });
 }

 if (auth.role === 'IMPORTER') {
 // All Exporters on the platform, with trade stats if they exist
 const partners = await prisma.$queryRaw`
 SELECT 
 u.id,
 u.name,
 u."businessName",
 u.country,
 u."verificationStatus",
 u.avatar,
 COUNT(DISTINCT o.id) as "orderCount",
 COALESCE(SUM(o."totalPrice"), 0) as "totalValue",
 (SELECT COUNT(*)::int FROM messages m WHERE m."senderId" = u.id AND m."receiverId" = ${auth.userId} AND m."isRead" = false) as "unreadCount"
 FROM users u
 LEFT JOIN orders o ON o."sellerId" = u.id AND o."buyerId" = ${auth.userId}
 WHERE u.role = 'EXPORTER'
 AND (
 ${search} = '' 
 OR u.name ILIKE '%' || ${search} || '%' 
 OR u."businessName" ILIKE '%' || ${search} || '%'
 OR u.country ILIKE '%' || ${search} || '%'
 )
 GROUP BY u.id, u.name, u."businessName", u.country, u."verificationStatus", u.avatar
 ORDER BY "orderCount" DESC, "totalValue" DESC, u.name ASC
 LIMIT ${limit} OFFSET ${(page - 1) * limit}
 ` as Array<{
 id: string;
 name: string;
 businessName: string | null;
 country: string | null;
 verificationStatus: string;
 avatar: string | null;
 orderCount: bigint;
 totalValue: number;
 unreadCount: number;
 }>;

 const totalResult = await prisma.$queryRaw`
 SELECT COUNT(*) as count
 FROM users u
 WHERE u.role = 'EXPORTER'
 AND (
 ${search} = '' 
 OR u.name ILIKE '%' || ${search} || '%' 
 OR u."businessName" ILIKE '%' || ${search} || '%'
 OR u.country ILIKE '%' || ${search} || '%'
 )
 ` as Array<{ count: bigint }>;

 return NextResponse.json({
 partners: partners.map((p) => ({
 id: p.id,
 name: p.name,
 businessName: p.businessName,
 country: p.country,
 verificationStatus: p.verificationStatus,
 avatar: p.avatar,
 orderCount: Number(p.orderCount),
 totalValue: Number(p.totalValue),
 unreadCount: p.unreadCount,
 })),
 pagination: {
 page,
 limit,
 total: Number(totalResult?.[0]?.count ?? 0),
 },
 });
 }

 if (auth.role === 'SUPPLIER') {
 // Suppliers view Exporters as partners
 const partners = await prisma.$queryRaw`
 SELECT 
 u.id,
 u.name,
 u."businessName",
 u.country,
 u."verificationStatus",
 u.avatar,
 0 as "orderCount",
 0 as "totalValue",
 (SELECT COUNT(*)::int FROM messages m WHERE m."senderId" = u.id AND m."receiverId" = ${auth.userId} AND m."isRead" = false) as "unreadCount"
 FROM users u
 WHERE u.role = 'EXPORTER'
 AND (
 ${search} = '' 
 OR u.name ILIKE '%' || ${search} || '%' 
 OR u."businessName" ILIKE '%' || ${search} || '%'
 OR u.country ILIKE '%' || ${search} || '%'
 )
 ORDER BY u.name ASC
 LIMIT ${limit} OFFSET ${(page - 1) * limit}
 ` as Array<{
 id: string;
 name: string;
 businessName: string | null;
 country: string | null;
 verificationStatus: string;
 avatar: string | null;
 orderCount: number;
 totalValue: number;
 unreadCount: number;
 }>;

 const totalResult = await prisma.$queryRaw`
 SELECT COUNT(*) as count
 FROM users u
 WHERE u.role = 'EXPORTER'
 ` as Array<{ count: bigint }>;

 return NextResponse.json({
 partners: partners.map((p) => ({
 id: p.id,
 name: p.name,
 businessName: p.businessName,
 country: p.country,
 verificationStatus: p.verificationStatus,
 avatar: p.avatar,
 orderCount: Number(p.orderCount),
 totalValue: Number(p.totalValue),
 unreadCount: p.unreadCount,
 })),
 pagination: {
 page,
 limit,
 total: Number(totalResult?.[0]?.count ?? 0),
 },
 });
 }

 return NextResponse.json({ error: 'Invalid role for directory' }, { status: 400 });
 } catch (error) {
 console.error('Directory error:', error);
 return NextResponse.json({ error: 'Failed to fetch directory' }, { status: 500 });
 }
}
