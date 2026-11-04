"use client";

import React, { ComponentType, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
 Home,
 Boxes,
 Truck,
 LineChart,
 Wallet,
 Settings,
 FileText,
  Users,
  ShoppingBag
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
import { useUnreadCategories } from "@/hooks/useUnreadCategories";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTheme } from "next-themes";
import Image from "next/image";
import LogoLight from "@/assests/LOGO_TEXT.png";
import LogoDark from "@/assests/Logo-2-without-circle.png";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import CartSheet from "@/components/cart/CartSheet";
import NotificationBell from "@/components/notifications/NotificationBell";
import { Sun, Moon, Package, Heart, LogOut, User, Bell } from "lucide-react";


interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  badgeCount?: number;
}

export default function ImporterSidebar({ basePath, children }: { basePath: string; children?: React.ReactNode }) {
 const pathname = usePathname();
 const { counts } = useUnreadCategories();
 const { user, logout } = useAuth();
 const { theme, setTheme } = useTheme();
 const [mounted, setMounted] = useState(false);
 const { setOpenMobile } = useSidebar();

 useEffect(() => {
   setMounted(true);
 }, []);

 const LogoImg = mounted && theme === "dark" ? LogoDark : LogoLight;

 const nav: NavItem[] = [
    { href: basePath, label: "Dashboard", icon: Home },
    { href: `${basePath}/directory`, label: "Sellers", icon: Users, badgeCount: counts.sellers },
    { href: `${basePath}/orders`, label: "Orders", icon: Truck },
    { href: `${basePath}/inventory`, label: "Inventory", icon: Boxes },
    { href: `${basePath}/analytics`, label: "Analytics", icon: LineChart },
    { href: `${basePath}/finance`, label: "Finance", icon: Wallet },
  ];

 const isActive = (href: string) =>
 pathname === href || (href !== basePath && pathname.startsWith(href + "/"));

 const isMarketplace = pathname === "/products" || pathname.startsWith("/products/") || pathname === "/quotation" || pathname.startsWith("/quotation/");

 return (
 <Sidebar variant="inset" className="border-r-0">
 <SidebarContent className="px-3 pt-4">
 
 {/* Mobile Only: Logo & Profile */}
 <div className="md:hidden mb-6 mt-2 space-y-6">
   <div className="flex items-center justify-center">
     <Link href="/" className="flex items-center flex-shrink-0" onClick={() => setOpenMobile(false)}>
       <Image
         src={LogoImg}
         alt="Ranote Exim Logo"
         className="h-10 w-auto object-contain"
         unoptimized
       />
     </Link>
   </div>
   
   {user ? (
     <div className="flex flex-col items-center justify-center px-4 pt-4 pb-2">
       <div className="relative mb-3 group">
         <div className="absolute inset-0 bg-primary/20 rounded-full blur-md transition-all" />
         <div className="relative size-20 rounded-full bg-gradient-to-tr from-primary/10 to-primary/5 p-1 border border-primary/20 shadow-xl flex items-center justify-center text-foreground font-bold">
           {user.avatar ? (
             <Image src={user.avatar as string} alt="Avatar" width={80} height={80} className="w-full h-full object-cover rounded-full" unoptimized />
           ) : (
             <span className="text-2xl text-primary">{user.name?.[0] || <User className="w-8 h-8" />}</span>
           )}
         </div>
       </div>
       <div className="flex flex-col items-center text-center">
         <span className="text-lg font-black tracking-tight text-foreground">{user.name || "User"}</span>
         <span className="text-xs text-muted-foreground font-medium mt-0.5">{user.email}</span>
       </div>
     </div>
   ) : (
     <div className="flex justify-center w-full px-4 pt-4">
       <Link href="/login" className="text-sm font-bold text-primary bg-primary/10 py-2 px-6 rounded-full w-full text-center" onClick={() => setOpenMobile(false)}>Sign In</Link>
     </div>
   )}
 </div>

 {!isMarketplace && (
 <SidebarMenu>
 {nav.map((item) => (
 <SidebarMenuItem key={item.href}>
 <SidebarMenuButton
 asChild
 isActive={isActive(item.href)}
 tooltip={item.label}
 className={cn(
 "rounded-xl transition-all duration-300 relative",
 isActive(item.href)
 ? "bg-black/10 dark:bg-white/10 text-[#D4AF37] dark:text-[#D4AF37] hover:bg-black/15 dark:hover:bg-white/15"
 : "text-slate-500 dark:text-muted-foreground hover:bg-slate-100 dark:hover:bg-white/5 hover:text-[#D4AF37] dark:hover:text-[#D4AF37]"
 )}
 >
 <Link href={item.href} className="flex items-center gap-3 w-full" onClick={() => setOpenMobile(false)}>
 <item.icon className="size-5 transition-colors" />
 <span className="font-semibold text-sm flex-1">{item.label}</span>
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
 )}

 {/* Mobile Vertical Actions */}
 <div className="md:hidden mt-2 mb-4">
   <SidebarMenu>
     {user && (
       <SidebarMenuItem>
         <SidebarMenuButton asChild className="text-slate-500 dark:text-muted-foreground hover:bg-slate-100 dark:hover:bg-white/5 hover:text-[#D4AF37] dark:hover:text-[#D4AF37] transition-all duration-300 rounded-xl px-2 py-3">
           <Link href="/dashboard" className="flex items-center gap-3 w-full" onClick={() => setOpenMobile(false)}>
             <Home className="size-5 transition-colors" />
             <span className="font-bold text-sm flex-1 tracking-tight">Dashboard</span>
           </Link>
         </SidebarMenuButton>
       </SidebarMenuItem>
     )}
     <SidebarMenuItem>
       <SidebarMenuButton asChild className="text-slate-500 dark:text-muted-foreground hover:bg-slate-100 dark:hover:bg-white/5 hover:text-[#D4AF37] dark:hover:text-[#D4AF37] transition-all duration-300 rounded-xl px-2 py-3">
         <Link href="/orders" className="flex items-center gap-3 w-full" onClick={() => setOpenMobile(false)}>
           <Package className="size-5 transition-colors" />
           <span className="font-bold text-sm flex-1 tracking-tight">Orders</span>
         </Link>
       </SidebarMenuButton>
     </SidebarMenuItem>
     <SidebarMenuItem>
       <SidebarMenuButton asChild className="text-slate-500 dark:text-muted-foreground hover:bg-slate-100 dark:hover:bg-white/5 hover:text-[#D4AF37] dark:hover:text-[#D4AF37] transition-all duration-300 rounded-xl px-2 py-3">
         <Link href="/wishlist" className="flex items-center gap-3 w-full" onClick={() => setOpenMobile(false)}>
           <Heart className="size-5 transition-colors" />
           <span className="font-bold text-sm flex-1 tracking-tight">Wishlist</span>
         </Link>
       </SidebarMenuButton>
     </SidebarMenuItem>
     <SidebarMenuItem>
       <CartSheet customTrigger={
         <SidebarMenuButton className="text-slate-500 dark:text-muted-foreground hover:bg-slate-100 dark:hover:bg-white/5 hover:text-[#D4AF37] dark:hover:text-[#D4AF37] transition-all duration-300 rounded-xl px-2 py-3 w-full flex items-center gap-3 justify-start cursor-pointer font-sans">
           <ShoppingBag className="size-5 transition-colors" />
           <span className="font-bold text-sm flex-1 tracking-tight">Cart</span>
         </SidebarMenuButton>
       } />
     </SidebarMenuItem>
     <SidebarMenuItem>
       <NotificationBell customTrigger={
         <SidebarMenuButton className="text-slate-500 dark:text-muted-foreground hover:bg-slate-100 dark:hover:bg-white/5 hover:text-[#D4AF37] dark:hover:text-[#D4AF37] transition-all duration-300 rounded-xl px-2 py-3 w-full flex items-center gap-3 justify-start cursor-pointer font-sans">
           <Bell className="size-5 transition-colors" />
           <span className="font-bold text-sm flex-1 tracking-tight">Notifications</span>
         </SidebarMenuButton>
       } />
     </SidebarMenuItem>
   </SidebarMenu>
 </div>
      {children && (
        <div className="mt-2 mb-4">
          {children}
        </div>
      )}
    </SidebarContent>

 {!isMarketplace && (
 <SidebarFooter className="px-6 pt-4 pb-2 space-y-4">
 <SidebarSeparator />
 <SidebarMenu>
 <SidebarMenuItem>
 <SidebarMenuButton
 asChild
 isActive={isActive(`${basePath}/settings`)}
 tooltip="Settings"
 className={cn(
 "rounded-xl transition-all duration-300",
 isActive(`${basePath}/settings`)
 ? "bg-black/10 dark:bg-white/10 text-[#D4AF37] dark:text-[#D4AF37] hover:bg-black/15 dark:hover:bg-white/15"
 : "text-slate-500 dark:text-muted-foreground hover:bg-slate-100 dark:hover:bg-white/5 hover:text-[#D4AF37] dark:hover:text-[#D4AF37]"
 )}
 >
 <Link href={`${basePath}/settings`} className="flex items-center gap-3 w-full" onClick={() => setOpenMobile(false)}>
 <Settings className="size-5 transition-colors" />
 <span className="font-semibold text-sm">Settings</span>
 </Link>
 </SidebarMenuButton>
 </SidebarMenuItem>
 </SidebarMenu>
 </SidebarFooter>
 )}

 {/* Mobile Only: Sign Out at Bottom */}
 {user && (
   <div className="md:hidden p-4 mt-auto w-full">
     <button onClick={logout} className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-red-500 hover:text-red-600 bg-red-500/10 hover:bg-red-500/20 font-bold transition-all active:scale-95 shadow-sm border border-red-500/20">
       <LogOut className="size-5" />
       <span>Sign Out</span>
     </button>
   </div>
 )}
 </Sidebar>
 );
}
