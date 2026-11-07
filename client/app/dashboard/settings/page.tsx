import { redirect } from "next/navigation";
import { getServerAuthContext } from "@/lib/auth-server";

/**
 * Generic /dashboard/settings dispatcher
 * Redirects user to their role-specific Profile & Settings dashboard
 */
export default async function DashboardSettingsPage() {
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

