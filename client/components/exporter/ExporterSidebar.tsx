"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  CreditCard,
  FolderTree,
  LayoutDashboard,
  LineChart,
  MessageSquare,
  PhoneCall,
  Settings,
  Users,
  Handshake,
  FileText,
  Globe,
  ShieldCheck,
  Ship,
  Monitor,
  SlidersHorizontal,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTranslation } from "@/lib/i18n/client";
import { useUnreadCategories } from "@/hooks/useUnreadCategories";

interface NavItem {
  href: string;
  labelKey: string;
  defaultLabel: string;
  icon: ComponentType<{ className?: string }>;
  badgeCount?: number;
}

export default function ExporterSidebar({ basePath }: { basePath: string }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { user } = useAuth();
  const { counts } = useUnreadCategories();
  const isAdmin = user?.role === "ADMIN";
  const { setOpenMobile } = useSidebar();

  const nav: NavItem[] = [
    { href: basePath, labelKey: "sidebar.dashboard", defaultLabel: "Dashboard", icon: LayoutDashboard },
    { href: `${basePath}/inventory`, labelKey: "sidebar.inventory", defaultLabel: "Inventory", icon: Boxes },
    { href: `${basePath}/orders`, labelKey: "sidebar.orders", defaultLabel: "Orders", icon: FolderTree },
    { href: `${basePath}/quotations`, labelKey: "sidebar.quotations", defaultLabel: "Quotations", icon: FileText },
    { href: `${basePath}/ships`, labelKey: "sidebar.ships", defaultLabel: "Logistics", icon: Ship },
    { href: `${basePath}/feedback`, labelKey: "sidebar.feedback", defaultLabel: "Reviews", icon: MessageSquare },
    { href: `${basePath}/directory`, labelKey: "sidebar.buyers", defaultLabel: "Buyers", icon: Users, badgeCount: counts.buyers },
    ...(isAdmin ? [
      { href: `${basePath}/users`, labelKey: "sidebar.registry", defaultLabel: "Registry", icon: ShieldCheck },
      { href: `${basePath}/showcase`, labelKey: "sidebar.showcase", defaultLabel: "Showcase", icon: Monitor },
      { href: `${basePath}/homepage-changes`, labelKey: "sidebar.homepage_changes", defaultLabel: "Home Page Changes", icon: SlidersHorizontal },
    ] : []),
    { href: `${basePath}/suppliers`, labelKey: "sidebar.dealers", defaultLabel: "Dealers", icon: Handshake, badgeCount: counts.dealers },
    { href: `${basePath}/analytics`, labelKey: "sidebar.analytics", defaultLabel: "Analytics", icon: LineChart },
    { href: `${basePath}/finance`, labelKey: "sidebar.finance", defaultLabel: "Finance", icon: CreditCard },
  ];

  const isActive = (href: string) =>
    pathname === href || (href !== basePath && pathname.startsWith(href + "/"));

  return (
    <Sidebar variant="inset" className="border-r-0">
      <SidebarContent className="px-3 pt-4">
        <SidebarMenu>
          {nav.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.href)}
                tooltip={t(item.labelKey, item.defaultLabel)}
                className={cn(
                  "rounded-xl transition-all duration-300 relative",
                  isActive(item.href)
                    ? "bg-black/10 dark:bg-white/10 text-[#D4AF37] dark:text-[#D4AF37] hover:bg-black/15 dark:hover:bg-white/15"
                    : "text-slate-500 dark:text-muted-foreground hover:bg-slate-100 dark:hover:bg-white/5 hover:text-[#D4AF37] dark:hover:text-[#D4AF37]"
                )}
              >
                <Link href={item.href} className="flex items-center gap-3 w-full" onClick={() => setOpenMobile(false)}>
                  <item.icon className="size-5 transition-colors" />
                  <span className="font-semibold text-sm flex-1">{t(item.labelKey, item.defaultLabel)}</span>
                  {item.badgeCount && item.badgeCount > 0 ? (
                    <span className="bg-[#D4AF37] text-black text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                      {item.badgeCount > 9 ? "9+" : item.badgeCount}
                    </span>
                  ) : null}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="px-6 pt-4 pb-2 space-y-4">
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive(`${basePath}/settings`)}
              tooltip={t("sidebar.settings", "Settings")}
              className={cn(
                "rounded-xl transition-all duration-300",
                isActive(`${basePath}/settings`)
                  ? "bg-black/10 dark:bg-white/10 text-[#D4AF37] dark:text-[#D4AF37] hover:bg-black/15 dark:hover:bg-white/15"
                  : "text-slate-500 dark:text-muted-foreground hover:bg-slate-100 dark:hover:bg-white/5 hover:text-[#D4AF37] dark:hover:text-[#D4AF37]"
              )}
            >
              <Link href={`${basePath}/settings`} className="flex items-center gap-3 w-full" onClick={() => setOpenMobile(false)}>
                <Settings className="size-5 transition-colors" />
                <span className="font-semibold text-sm">{t("sidebar.settings", "Settings")}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
