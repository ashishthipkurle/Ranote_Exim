"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { Loader2 } from "lucide-react";

/**
 * Unified Profile Redirect Dispatcher
 * Automatically routes all user roles to their consolidated Profile & Settings dashboard:
 * - Admin / Exporter -> /dashboard/exporter/settings
 * - Importer -> /dashboard/importer/settings
 * - Supplier -> /dashboard/supplier/settings
 */
export default function ProfileRedirectPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login?redirect=/dashboard/importer/settings");
      return;
    }

    const role = user.role?.toUpperCase();
    if (role === "ADMIN" || role === "EXPORTER") {
      router.replace("/dashboard/exporter/settings");
    } else if (role === "SUPPLIER") {
      router.replace("/dashboard/supplier/settings");
    } else {
      router.replace("/dashboard/importer/settings");
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F5F0]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-[#C4912A] animate-spin" />
        <p className="text-sm font-semibold text-[#6B6A66]">Opening Profile & Settings...</p>
      </div>
    </div>
  );
}
