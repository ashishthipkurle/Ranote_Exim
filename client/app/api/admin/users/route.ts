import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiAuthContext } from "@/lib/auth-server";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
 try {
 // 1. Resolve identity via Nhost
 const { auth, error } = await getApiAuthContext(req);
 
 if (error) return error;

 // 2. Protocol Guard for Master Admin
 const userEmail = auth?.email;
 const isMaster = auth?.role === "ADMIN" || userEmail?.toLowerCase() === "exporter@gmail.com";
 if (!userEmail || !isMaster) {
 return NextResponse.json({ 
 error: `Access Denied: Master Clearance Required (Detected: ${userEmail || 'No Session'})` 
 }, { status: 403 });
 }

 // 3. Data Retrieval
 const searchParams = req.nextUrl.searchParams;
 const page = parseInt(searchParams.get("page") || "1");
 const pageSize = parseInt(searchParams.get("pageSize") || "20");
 const search = searchParams.get("q") || "";
 const role = searchParams.get("role") || "";
 const verified = searchParams.get("verified");
 const country = searchParams.get("country");

 const where: any = {};

 if (search) {
 where.OR = [
 { name: { contains: search, mode: "insensitive" } },
 { email: { contains: search, mode: "insensitive" } },
 { businessName: { contains: search, mode: "insensitive" } },
 { phone: { contains: search, mode: "insensitive" } },
 ];
 }

 if (role) {
 where.role = role;
 }

 if (verified !== null && verified !== undefined && verified !== "") {
 where.verificationStatus = verified === "true" ? "VERIFIED" : "PENDING";
 }

 if (country) {
 where.country = country;
 }

 const [users, total] = await Promise.all([
 prisma.user.findMany({
 where,
 skip: (page - 1) * pageSize,
 take: pageSize,
 orderBy: { createdAt: "desc" },
 select: {
 id: true,
 name: true,
 email: true,
 role: true,
 businessName: true,
 country: true,
 verificationStatus: true,
 createdAt: true,
 phone: true,
 phoneVerified: true,
 address: true,
 },
 }),
 prisma.user.count({ where }),
 ]);

 return NextResponse.json({
 users,
 total,
 page,
 totalPages: Math.ceil(total / pageSize),
 });
 } catch (error) {
 console.error("Admin users fetch error:", error);
 return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
 }
}

export async function POST(req: NextRequest) {
 try {
 const { auth, error } = await getApiAuthContext(req);
 if (error) return error;

 const userEmail = auth?.email;
 const isMaster = auth?.role === "ADMIN" || userEmail?.toLowerCase() === "exporter@gmail.com";
 if (!userEmail || !isMaster) {
 return NextResponse.json({ error: "Access Denied: Master Clearance Required" }, { status: 403 });
 }

 const body = await req.json();
 const { userId, action, role } = body;

 if (!userId || !action) {
 return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
 }

 let updatedUser;

 switch (action) {
 case "verify":
      updatedUser = await prisma.user.update({ where: { id: userId }, data: { verificationStatus: "VERIFIED" } });
      await prisma.notification.create({ data: { userId, title: "KYC Verified", message: "Your verification documents have been approved.", type: "VERIFICATION_OUTCOME" } });
      break;
    case "reject":
      updatedUser = await prisma.user.update({ where: { id: userId }, data: { verificationStatus: "REJECTED" } });
      await prisma.notification.create({ data: { userId, title: "KYC Rejected", message: "Your verification documents were rejected.", type: "VERIFICATION_OUTCOME" } });
      break;
 case "unverify":
 updatedUser = await prisma.user.update({
 where: { id: userId },
 data: { verificationStatus: "PENDING" },
 });
 break;
 case "changeRole":
 if (!role) return NextResponse.json({ error: "Role is required" }, { status: 400 });
 updatedUser = await prisma.user.update({
 where: { id: userId },
 data: { role: role as any },
 });
 break;
 case "delete":
 await prisma.user.delete({
 where: { id: userId },
 });
 return NextResponse.json({ message: "User deleted successfully" });
 default:
 return NextResponse.json({ error: "Invalid action" }, { status: 400 });
 }

 return NextResponse.json({ message: "Action successful", user: updatedUser });
 } catch (error) {
 console.error("Admin user action error:", error);
 return NextResponse.json({ error: "Failed to perform action" }, { status: 500 });
 }
}

