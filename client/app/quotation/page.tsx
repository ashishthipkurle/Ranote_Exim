import { prisma } from "@/lib/prisma";
import QuotationClient from "./QuotationClient";
import { getServerAuthContext } from "@/lib/auth-server";
import { extractCategoriesFromProducts } from "@/lib/categories";

export const dynamic = "force-dynamic";

export default async function QuotationPage() {
  const auth = await getServerAuthContext();
  const isLoggedIn = !!auth;
  const user = auth?.user
    ? {
        name: auth.user.name,
        email: auth.user.email,
        phone: auth.user.phone,
        businessName: auth.user.businessName,
      }
    : null;

  let products: any[] = [];
  let fetchedCategories: any[] = [];

  try {
    const [p, c] = await Promise.all([
      prisma.product.findMany({
        where: { available: true },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          price: true,
          images: true,
          category: true,
          certifications: true,
          originCountry: true,
        },
      }),
      prisma.product.findMany({
        where: { available: true },
        select: { category: true, certifications: true },
      }),
    ]);
    products = p;
    fetchedCategories = c;
  } catch (err) {
    console.error("Failed to fetch products for quotation page:", err);
  }

  const categories = extractCategoriesFromProducts(fetchedCategories);

  return (
    <QuotationClient
      products={products as any[]}
      categories={categories}
      isLoggedIn={isLoggedIn}
      user={user}
    />
  );
}
