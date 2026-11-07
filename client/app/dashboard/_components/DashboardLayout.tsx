"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  MessageSquare,
  FileText,
  Bell,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import RanoteLogo from "@/components/ui/RanoteLogo";
import { useTranslation } from "@/lib/i18n/client";

interface DashboardLayoutProps {
  children: ReactNode;
  role: "exporter" | "importer" | "admin";
}

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigationByRole = {
    exporter: [
      { icon: LayoutDashboard, label: t("sidebar.dashboard", "Dashboard"), href: "/dashboard/exporter" },
      { icon: Package, label: t("sidebar.my_products", "My Products"), href: "/dashboard/exporter/products" },
      { icon: ShoppingCart, label: t("sidebar.orders", "Orders"), href: "/dashboard/exporter/orders" },
      { icon: Truck, label: t("sidebar.shipments", "Shipments"), href: "/dashboard/exporter/orders" },
      { icon: MessageSquare, label: t("sidebar.messages", "Messages"), href: "/dashboard/exporter/messages" },
      { icon: FileText, label: t("sidebar.documents", "Documents"), href: "/dashboard/exporter/documents" },
    ],
    importer: [
      { icon: LayoutDashboard, label: t("sidebar.dashboard", "Dashboard"), href: "/dashboard/importer" },
      { icon: Package, label: t("sidebar.browse_products", "Browse Products"), href: "/dashboard/importer/browse" },
      { icon: ShoppingCart, label: t("sidebar.my_orders", "My Orders"), href: "/dashboard/importer/orders" },
      { icon: Truck, label: t("sidebar.shipments", "Shipments"), href: "/dashboard/importer/orders" },
      { icon: MessageSquare, label: t("sidebar.messages", "Messages"), href: "/dashboard/importer/messages" },
      { icon: FileText, label: t("sidebar.documents", "Documents"), href: "/dashboard/importer/documents" },
    ],
    admin: [
      { icon: LayoutDashboard, label: t("sidebar.dashboard", "Dashboard"), href: "/dashboard/admin" },
      { icon: Package, label: t("sidebar.all_products", "All Products"), href: "/dashboard/admin/products" },
      { icon: ShoppingCart, label: t("sidebar.all_orders", "All Orders"), href: "/dashboard/admin/orders" },
      { icon: Truck, label: t("sidebar.shipments", "Shipments"), href: "/dashboard/admin/shipments" },
      { icon: BarChart3, label: t("sidebar.analytics", "Analytics"), href: "/dashboard/admin/analytics" },
      { icon: FileText, label: t("sidebar.users", "Users"), href: "/dashboard/admin/users" },
      { icon: Bell, label: t("sidebar.notifications", "Notifications"), href: "/dashboard/admin/notifications" },
      { icon: SlidersHorizontal, label: t("sidebar.homepage_changes", "Homepage Changes"), href: "/dashboard/exporter/homepage-changes" },
    ],
  };

  const navigation = navigationByRole[role];

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    document.cookie = "auth_token=; path=/; max-age=0";
    localStorage.removeItem("user");
    localStorage.removeItem("user_profile");
    localStorage.removeItem("renote_local_orders");
    localStorage.removeItem("renote_product_reviews");
    // Clear all user-scoped cart/wishlist keys
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("ranote_cart_v1") || key.startsWith("ranote_wishlist_v1"))) {
        localStorage.removeItem(key);
      }
    }
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur border-b border-border z-30">
        <div className="h-full px-4 flex items-center justify-between">
          {/* Left */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 hover:bg-accent rounded-lg"
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <Link href="/" className="flex items-center gap-2" aria-label="Ranote Exim Home">
              <RanoteLogo className="h-8 md:h-10 w-auto" />
            </Link>
          </div>

          {/* Right */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button className="relative p-2 hover:bg-accent rounded-lg">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full"></span>
            </button>
            <Link href="/dashboard/settings">
              <button className="p-2 hover:bg-accent rounded-lg">
                <Settings size={20} />
              </button>
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-destructive/10 text-destructive rounded-lg"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed top-16 left-0 bottom-0 w-64 bg-background border-r border-border z-20 transition-transform lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <nav className="p-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-accent text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </motion.div>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pt-16">
        <div className="p-6">{children}</div>
      </main>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-10 lg:hidden"
        />
      )}
    </div>
  );
}
