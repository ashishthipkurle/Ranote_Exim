"use client";

import React, { ComponentType, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Boxes,
  Truck,
  LineChart,
  CreditCard,
  Settings,
  Users,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useUnreadCategories } from "@/hooks/useUnreadCategories";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTranslation } from "@/lib/i18n/client";

interface NavItem {
  href: string;
  labelKey: string;
  defaultLabel: string;
  icon: ComponentType<{ className?: string }>;
  badgeCount?: number;
}

export default function ImporterSidebar({ basePath, children }: { basePath: string; children?: React.ReactNode }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { counts } = useUnreadCategories();
  const { isRail, setOpenMobile } = useSidebar();

  const nav: NavItem[] = [
    { href: basePath, labelKey: "sidebar.dashboard", defaultLabel: "Dashboard", icon: LayoutDashboard },
    { href: `${basePath}/directory`, labelKey: "sidebar.sellers", defaultLabel: "Sellers", icon: Users, badgeCount: counts.sellers },
    { href: `${basePath}/orders`, labelKey: "sidebar.orders", defaultLabel: "Orders", icon: Truck },
    { href: `${basePath}/inventory`, labelKey: "sidebar.inventory", defaultLabel: "Inventory", icon: Boxes },
    { href: `${basePath}/analytics`, labelKey: "sidebar.analytics", defaultLabel: "Analytics", icon: LineChart },
    { href: `${basePath}/finance`, labelKey: "sidebar.finance", defaultLabel: "Finance", icon: CreditCard },
  ];

  const isActive = (href: string) =>
    pathname === href || (href !== basePath && pathname.startsWith(href + "/"));

  const isMarketplace =
    pathname === "/products" ||
    pathname.startsWith("/products/") ||
    pathname === "/quotation" ||
    pathname.startsWith("/quotation/");

  if (isMarketplace) {
    return (
      <Sidebar className="bg-transparent border-none">
        <SidebarContent className="bg-transparent px-3 pt-3 no-scrollbar overflow-y-auto">
          {children}
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <Sidebar className="bg-transparent border-none">
      <SidebarContent className="bg-transparent px-3 pt-3 no-scrollbar overflow-y-auto">
        <SidebarMenu className="space-y-[2px]">
          {nav.map((item) => {
            const active = isActive(item.href);
            const label = t(item.labelKey, item.defaultLabel);
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  tooltip={label}
                  className={cn(
                    "h-[44px] rounded-[14px] text-[15px] font-[600] transition-colors duration-150 shadow-none",
                    isRail ? "w-[44px] justify-center px-0 mx-auto" : "w-full px-[14px] py-[10px]",
                    active
                      ? "bg-[#FBF1D6] text-[#7A560A] font-[700]"
                      : "text-[#4A483F] hover:bg-[rgba(251,241,214,0.55)] hover:text-[#15130D]"
                  )}
                >
                  <Link
                    href={item.href}
                    className={cn("flex items-center", isRail ? "justify-center" : "gap-3 w-full")}
                    onClick={() => setOpenMobile(false)}
                  >
                    <item.icon
                      className={cn(
                        "size-[18px] stroke-[1.8] shrink-0 transition-colors",
                        active ? "text-[#C4912A]" : "text-[#4A483F]"
                      )}
                    />
                    {!isRail && (
                      <span className="font-[600] text-[15px] leading-tight flex-1 whitespace-nowrap overflow-hidden text-ellipsis">
                        {label}
                      </span>
                    )}
                    {!isRail && item.badgeCount && item.badgeCount > 0 ? (
                      <span className="bg-[#E2F5EE] text-[#0B7A57] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#0B7A57]/20 shrink-0">
                        {item.badgeCount > 9 ? "9+" : item.badgeCount}
                      </span>
                    ) : null}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>

        {children && (
          <div className="mt-2 mb-4">
            {children}
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="bg-transparent px-3 pt-2 pb-3">
        <div className="h-px bg-[#E4E2EA] mx-2 mb-2" />
        <SidebarMenu>
          <SidebarMenuItem>
            {(() => {
              const active = isActive(`${basePath}/settings`);
              const label = t("sidebar.settings", "Settings");
              return (
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  tooltip={label}
                  className={cn(
                    "h-[44px] rounded-[14px] text-[15px] font-[600] transition-colors duration-150 shadow-none",
                    isRail ? "w-[44px] justify-center px-0 mx-auto" : "w-full px-[14px] py-[10px]",
                    active
                      ? "bg-[#FBF1D6] text-[#7A560A] font-[700]"
                      : "text-[#4A483F] hover:bg-[rgba(251,241,214,0.55)] hover:text-[#15130D]"
                  )}
                >
                  <Link
                    href={`${basePath}/settings`}
                    className={cn("flex items-center", isRail ? "justify-center" : "gap-3 w-full")}
                    onClick={() => setOpenMobile(false)}
                  >
                    <Settings
                      className={cn(
                        "size-[18px] stroke-[1.8] shrink-0 transition-colors",
                        active ? "text-[#C4912A]" : "text-[#4A483F]"
                      )}
                    />
                    {!isRail && (
                      <span className="font-[600] text-[15px] leading-tight flex-1 whitespace-nowrap">
                        {label}
                      </span>
                    )}
                  </Link>
                </SidebarMenuButton>
              );
            })()}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
