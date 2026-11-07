export const dynamic = 'force-dynamic';

import SupplierSidebar from "@/components/supplier/SupplierSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { SidebarProvider } from "@/components/ui/sidebar";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import PageTransition from "@/components/ui/PageTransition";

import { DashboardScaler } from "@/components/dashboard/DashboardScaler";
import DashboardCallWrapper from "@/components/session/DashboardCallWrapper";

import { redirect } from "next/navigation";
import { getServerAuthContext } from "@/lib/auth-server";

export default async function SupplierLayout({ children }: { children: React.ReactNode }) {
  const auth = await getServerAuthContext();

  // Guard: Must be logged in AND have SUPPLIER or ADMIN role
  if (!auth) {
    redirect("/login");
  }

  if (auth.role !== "SUPPLIER" && auth.role !== "ADMIN") {
    console.warn(`[Auth Guard] Wrong role for supplier dashboard: ${auth.role}. Redirecting...`);
    redirect("/dashboard");
  }

  return (
    <DashboardCallWrapper>
      <SidebarProvider>
        <div className="app h-screen flex flex-col bg-[#F4F4F7] overflow-hidden" style={{ height: "100vh" }}>
          <DashboardHeader />

          <div className="body flex-1 min-h-0 flex relative">
            <SupplierSidebar basePath="/dashboard/supplier" />
            <main className="main flex-1 min-w-0 min-h-0 overflow-y-auto p-3 md:pt-4 md:pr-5 md:pb-5 md:pl-0 custom-scrollbar">
              <div className="page-card flex flex-col gap-6">
                <Breadcrumbs />
                <PageTransition>
                  {children}
                </PageTransition>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </DashboardCallWrapper>
  );
}
