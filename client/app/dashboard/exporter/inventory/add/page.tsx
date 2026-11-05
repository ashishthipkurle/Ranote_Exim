import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import CategoryDirectory from "../CategoryDirectory";
import { getAllCustomCategories } from "@/lib/custom-categories-server";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AddProductPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const isSelected = resolvedParams?.action === "new";
  const backHref = isSelected ? "/dashboard/exporter/inventory/add" : "/dashboard/exporter/inventory";

  let customCategories: string[] = [];
  try {
    customCategories = await getAllCustomCategories();
  } catch (error) {
    console.error("Failed to fetch custom categories:", error);
    customCategories = ["Areca Leaf", "Automobile spare parts"];
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <header className="flex-shrink-0 p-8 lg:px-12 border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-6 max-w-7xl mx-auto w-full">
          <Link
            href={backHref}
            className="p-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/10 transition-all text-slate-500 hover:text-primary group shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Publish New Product</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Follow the steps to list your asset on the global marketplace
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 lg:p-12">
        <div className="max-w-7xl mx-auto">
          <CategoryDirectory customCategories={customCategories} />
        </div>
      </div>
    </div>
  );
}
