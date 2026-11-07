"use client";

import React, { useState, useRef } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  Sun,
  Moon,
  ChevronDown,
  HomeIcon,
  LogOut,
  LayoutDashboard,
  ListOrdered,
  Package,
  Heart,
  Settings,
  Menu
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTranslation } from "@/lib/i18n/client";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { useTheme } from "next-themes";
import CartSheet from "@/components/cart/CartSheet";
import { toast } from "sonner";
import NotificationBell from "@/components/notifications/NotificationBell";
import RanoteLogo from "@/components/ui/RanoteLogo";
import { getWishlist } from "@/lib/wishlist";

export default function DashboardHeader() {
  const { t } = useTranslation();
  const { open, toggleSidebar } = useSidebar();
  const { user, loading, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  const isMarketplace = pathname === "/products" || pathname.startsWith("/products/") || pathname === "/quotation" || ["/cart", "/checkout", "/wishlist", "/orders", "/profile"].includes(pathname);
  const isProductDetails = pathname.startsWith("/products/") && pathname !== "/products";
  const isExporter = pathname.startsWith("/dashboard/exporter");
  const isImporter = pathname.startsWith("/dashboard/importer");
  const isLegal = pathname === "/privacy-policy" || pathname === "/terms" || pathname?.startsWith("/terms") || pathname?.startsWith("/privacy");

  const [wishlistCount, setWishlistCount] = useState(0);

  React.useEffect(() => {
    setMounted(true);
    
    const updateWishlist = () => {
      setWishlistCount(getWishlist().length);
    };
    updateWishlist();
    window.addEventListener("renote-wishlist-updated", updateWishlist);

    // Handle clicks outside dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("renote-wishlist-updated", updateWishlist);
    };
  }, []);

  return (
    <>
      <header className={`sticky top-0 z-40 border-b border-[#ECE7DA] bg-white transition-all duration-300 w-full h-[68px] shrink-0`}>
        <div className="flex h-full items-center px-4 md:pl-6 md:pr-4 lg:pr-8">

          {/* LEFT SECTION */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center flex-shrink-0" aria-label="Ranote Exim Home">
              <RanoteLogo className="h-7 md:h-10 w-auto" />
            </Link>

            {/* Sidebar Toggle */}
            {!isLegal && !isProductDetails && pathname !== "/cart" && pathname !== "/checkout" && pathname !== "/wishlist" && pathname !== "/orders" && pathname !== "/profile" && (
              <button
                onClick={toggleSidebar}
                className="size-11 rounded-[14px] bg-[#F7F5F0] hover:bg-[#FBF1D6] text-[#7A560A] flex items-center justify-center transition-colors border border-[#ECE7DA]"
                title={open ? "Collapse Sidebar" : "Expand Sidebar"}
              >
                <Menu className="w-5 h-5 md:hidden" />
                <div className="hidden md:block">
                  {open ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </div>
              </button>
            )}
          </div>

          {/* SPACER */}
          <div className="flex-1 min-w-[1rem]" />

          {/* RIGHT SECTION: SEARCH + ACTIONS */}
          <div className="flex flex-shrink-0 items-center gap-1.5 md:gap-2.5">
            {/* SEARCH BAR (Pushed to Right, fills space on mobile) */}
            <div className="flex-1 max-w-[140px] sm:max-w-[180px] md:max-w-[200px] lg:max-w-xs relative group mr-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6B6A66] group-focus-within:text-[#C4912A] transition-colors" />
              <input
                type="text"
                placeholder={t("search_placeholder", "Search...")}
                className="w-full bg-[#F7F5F0] border border-[#ECE7DA] focus:border-[#C4912A] rounded-full pl-8 pr-3 py-2 md:pl-9 md:pr-4 md:py-2 text-xs text-[#15130D] outline-none transition-all focus:bg-white shadow-inner"
              />
            </div>

            {/* ALWAYS VISIBLE (Language & Theme) */}
            <div className="flex flex-shrink-0 items-center gap-1">
              <LanguageSwitcher />
              {/* Theme Toggle */}
              {mounted && (
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="size-8 md:size-9 rounded-full bg-[#F7F5F0] hover:bg-[#FBF1D6] flex items-center justify-center text-[#6B6A66] hover:text-[#7A560A] transition-all active:scale-95 border border-[#ECE7DA]"
                >
                  {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>

            {/* DESKTOP ONLY ACTIONS (Orders, Wishlist, Cart, Notifications) */}
            <div className="hidden md:flex items-center gap-1">
              {/* Orders — hidden for exporters and importers */}
              {!isExporter && !isImporter && (
                <Link
                  href="/orders"
                  className="size-8 md:size-9 flex items-center justify-center rounded-full bg-[#F7F5F0] hover:bg-[#FBF1D6] text-[#6B6A66] hover:text-[#7A560A] transition-all border border-[#ECE7DA] group"
                  title="Orders"
                >
                  <Package className="w-3.5 h-3.5" />
                </Link>
              )}

              {/* Wishlist — hidden for exporters */}
              {!isExporter && (
                <Link
                  href="/wishlist"
                  className="size-8 md:size-9 flex items-center justify-center rounded-full bg-[#F7F5F0] hover:bg-[#FBF1D6] text-[#6B6A66] hover:text-[#7A560A] transition-all border border-[#ECE7DA] group relative"
                  title="Wishlist"
                >
                  <Heart className="w-3.5 h-3.5" />
                  {mounted && wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#C4912A] text-white font-black text-[9px] flex items-center justify-center rounded-full animate-in zoom-in shadow-lg">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Cart — hidden for exporters */}
              {!isExporter && (
                <div className="size-8 md:size-9 flex items-center justify-center rounded-full bg-[#F7F5F0] hover:bg-[#FBF1D6] text-[#6B6A66] hover:text-[#7A560A] transition-all border border-[#ECE7DA] group">
                  <CartSheet />
                </div>
              )}

              {/* Notifications */}
              <div className="scale-90 origin-right">
                <NotificationBell />
              </div>
            </div>

            <div className="h-5 w-px bg-[#ECE7DA] mx-1 xs:block" />

            {/* PROFILE DROPDOWN OR SIGN IN */}
            {mounted && (
              <div className="hidden md:block relative" ref={dropdownRef}>
                {loading ? (
                  <div className="size-10 rounded-[16px] bg-[#FBF1D6]/60 animate-pulse border border-[#ECE7DA]" />
                ) : user ? (
                  <>
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="h-auto p-0.5 gap-2 flex items-center rounded-2xl hover:bg-[#FBF1D6] transition-all active:scale-95 group"
                    >
                      <div className="size-10 rounded-[16px] bg-gradient-to-br from-[#EBC964] to-[#C4912A] text-[#7A560A] font-extrabold shadow-sm overflow-hidden flex items-center justify-center text-sm border border-[#C4912A]/30">
                        {user.avatar ? (
                          <Image src={user.avatar as string} alt="Avatar" width={40} height={40} className="w-full h-full object-cover" unoptimized />
                        ) : (
                          user.name?.[0]?.toUpperCase() || <User className="w-4 h-4 text-[#7A560A]" />
                        )}
                      </div>
                      <ChevronDown className={`h-4 w-4 text-[#6B6A66] group-hover:text-[#7A560A] transition-transform ${isProfileOpen ? 'rotate-180 text-[#7A560A]' : ''}`} />
                    </button>

                    {isProfileOpen && (
                      <div className="absolute right-0 mt-2 w-64 p-2 rounded-2xl border border-[#F0ECE0] bg-white shadow-xl animate-in fade-in zoom-in-95 z-50">
                        <div className="p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-bold leading-none truncate text-[#15130D]">
                              {user.businessName || user.name || (user.role === "EXPORTER" ? "Exporter Account" : user.role === "ADMIN" ? "Admin Account" : user.role === "IMPORTER" ? "Importer Account" : "User")}
                            </p>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#FBF1D6] text-[#7A560A] border border-[#C4912A]/20 shrink-0">
                              {user.role}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-[#6B6A66] truncate mt-1.5">{user.email}</p>
                        </div>

                        <div className="h-px bg-[#F0ECE0] my-1" />

                        <div className="p-1 space-y-1">
                          <Link href="/" className="flex items-center rounded-xl cursor-pointer py-2 px-3 text-[#15130D] hover:bg-[#FBF1D6] hover:text-[#7A560A] transition-colors" onClick={() => setIsProfileOpen(false)}>
                            <HomeIcon className="mr-3 h-4 w-4 text-[#6B6A66]" />
                            <span className="text-sm font-medium">{t("home", "Home")}</span>
                          </Link>
                          <Link
                            href={
                              user.role?.toUpperCase() === "ADMIN" || user.role?.toUpperCase() === "EXPORTER"
                                ? "/dashboard/exporter"
                                : user.role?.toUpperCase() === "IMPORTER"
                                ? "/dashboard/importer"
                                : user.role?.toUpperCase() === "SUPPLIER"
                                ? "/dashboard/supplier"
                                : "/dashboard"
                            }
                            className="flex items-center rounded-xl cursor-pointer py-2 px-3 text-[#15130D] hover:bg-[#FBF1D6] hover:text-[#7A560A] transition-colors"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <LayoutDashboard className="mr-3 h-4 w-4 text-[#6B6A66]" />
                            <span className="text-sm font-medium">{t("dashboard", "Dashboard")}</span>
                          </Link>
                          <Link
                            href={
                              user.role?.toUpperCase() === "ADMIN" || user.role?.toUpperCase() === "EXPORTER"
                                ? "/dashboard/exporter/settings"
                                : user.role?.toUpperCase() === "SUPPLIER"
                                ? "/dashboard/supplier/settings"
                                : "/dashboard/importer/settings"
                            }
                            className="flex items-center rounded-xl cursor-pointer py-2 px-3 text-[#15130D] hover:bg-[#FBF1D6] hover:text-[#7A560A] transition-colors"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <Settings className="mr-3 h-4 w-4 text-[#6B6A66]" />
                            <span className="text-sm font-medium">Profile & Settings</span>
                          </Link>
                        </div>

                        <div className="h-px bg-[#F0ECE0] my-1" />

                        <div className="p-1">
                          <button
                            onClick={() => { setIsProfileOpen(false); logout(); }}
                            className="w-full flex items-center rounded-xl cursor-pointer py-2 px-3 text-[#B42318] hover:bg-[#FEE4E2] transition-colors"
                          >
                            <LogOut className="mr-3 h-4 w-4" />
                            <span className="text-sm font-bold">{t("signout", "Log out")}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="h-10 px-5 bg-gradient-to-r from-[#C4912A] to-[#EBC964] text-[#15130D] font-bold rounded-full text-xs md:text-sm hover:shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5 rotate-180" />
                    <span>{t("signin", "Sign In")}</span>
                  </Link>
                )}
              </div>
            )}

          </div>
        </div>
      </header>
    </>
  );
}

