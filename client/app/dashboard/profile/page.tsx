import { redirect } from "next/navigation";
import { getServerAuthContext } from "@/lib/auth-server";

/**
 * Generic /dashboard/profile dispatcher
 * Consolidates profile into the unified Profile & Settings dashboard
 */
export default async function DashboardProfilePage() {
  const auth = await getServerAuthContext();

  if (!auth) {
    redirect("/login?redirect=/dashboard/importer/settings");
  }

  const role = auth.role?.toUpperCase();

  switch (role) {
    case "ADMIN":
    case "EXPORTER":
      redirect("/dashboard/exporter/settings");
    case "SUPPLIER":
      redirect("/dashboard/supplier/settings");
    case "IMPORTER":
    default:
      redirect("/dashboard/importer/settings");
  }
}

