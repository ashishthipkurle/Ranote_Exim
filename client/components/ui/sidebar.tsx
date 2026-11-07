"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { PanelLeftIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type SidebarContextProps = {
  state: "expanded" | "collapsed";
  open: boolean;
  isRail: boolean;
  isMobile: boolean;
  openMobile: boolean;
  setOpen: (open: boolean) => void;
  setOpenMobile: (open: boolean) => void;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextProps | null>(null);

const defaultSidebarContext: SidebarContextProps = {
  state: "expanded",
  open: false,
  isRail: false,
  isMobile: false,
  openMobile: false,
  setOpen: () => {},
  setOpenMobile: () => {},
  toggleSidebar: () => {},
};

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    return defaultSidebarContext;
  }
  return context;
}

function SidebarProvider({
  children,
  defaultOpen = true,
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [windowWidth, setWindowWidth] = React.useState<number | null>(null);
  const [manualCollapsed, setManualCollapsed] = React.useState(!defaultOpen);
  const [openMobile, setOpenMobile] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setWindowWidth(w);
      if (w >= 768) {
        setOpenMobile(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth !== null ? windowWidth < 768 : false;
  // Breakpoints:
  // >= 1100px: full sidebar (236px), unless user manually collapsed.
  // 768 to 1099px: icon-only rail (76px wide).
  // < 768px: mobile drawer.
  const isRail = windowWidth !== null
    ? (windowWidth >= 768 && windowWidth < 1100) || (windowWidth >= 1100 && manualCollapsed)
    : false;

  const open = !isRail && !isMobile;
  const state: "expanded" | "collapsed" = open ? "expanded" : "collapsed";

  const toggleSidebar = React.useCallback(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setOpenMobile((prev) => !prev);
    } else {
      setManualCollapsed((prev) => !prev);
    }
  }, []);

  // Lock body scroll when mobile drawer is open, and handle Escape key
  React.useEffect(() => {
    if (openMobile) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setOpenMobile(false);
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [openMobile]);

  const value = React.useMemo<SidebarContextProps>(
    () => ({
      state,
      open,
      isRail,
      isMobile,
      openMobile,
      setOpen: (val: boolean) => setManualCollapsed(!val),
      setOpenMobile,
      toggleSidebar,
    }),
    [state, open, isRail, isMobile, openMobile, toggleSidebar]
  );

  return (
    <SidebarContext.Provider value={value}>
      <TooltipProvider delayDuration={100}>
        {children}
      </TooltipProvider>
    </SidebarContext.Provider>
  );
}

function Sidebar({
  className,
  children,
  variant,
  side,
  collapsible,
  ...props
}: React.ComponentProps<"aside"> & {
  variant?: string;
  side?: "left" | "right";
  collapsible?: "offcanvas" | "icon" | "none";
}) {
  const { isRail, openMobile, setOpenMobile } = useSidebar();

  return (
    <>
      {/* ── Desktop & Tablet Sidebar (>= 768px): Transparent, no border, sticky ── */}
      <aside
        data-state={isRail ? "collapsed" : "expanded"}
        className={cn(
          "hidden md:flex flex-col shrink-0 sticky top-[68px] h-[calc(100vh-68px)] bg-transparent transition-[width] duration-200 ease-linear z-20 select-none overflow-hidden",
          isRail ? "w-[76px]" : "w-[236px]",
          className
        )}
        {...props}
      >
        {children}
      </aside>

      {/* ── Mobile Drawer (< 768px): Fixed, 280px, warm shadow, backdrop blur ── */}
      <div className="md:hidden">
        {/* Backdrop: rgba(20,18,11,.40) with light blur */}
        <div
          className={cn(
            "fixed inset-0 bg-[#14120B]/40 backdrop-blur-sm z-40 transition-opacity duration-220",
            openMobile ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          )}
          onClick={() => setOpenMobile(false)}
        />

        {/* Drawer Container: 280px wide, #fff, box-shadow: var(--shadow-pop), pt-[68px] */}
        <div
          className={cn(
            "fixed left-0 top-0 bottom-0 w-[280px] bg-white z-50 pt-[68px] flex flex-col shadow-[0_24px_60px_-20px_rgba(20,18,11,0.35)] transition-transform duration-220 ease-out",
            openMobile ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {children}
        </div>
      </div>
    </>
  );
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  const { isRail } = useSidebar();
  return (
    <div
      data-slot="sidebar-content"
      className={cn(
        "flex-1 overflow-y-auto no-scrollbar flex flex-col gap-[2px]",
        isRail ? "p-[20px_10px]" : "p-[20px_14px]",
        className
      )}
      {...props}
    />
  );
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  const { isRail } = useSidebar();
  return (
    <div
      data-slot="sidebar-footer"
      className={cn(
        "shrink-0 flex flex-col",
        isRail ? "p-[10px_10px_20px]" : "p-[10px_14px_20px]",
        className
      )}
      {...props}
    />
  );
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  );
}

function SidebarSeparator({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-separator"
      className={cn("h-px bg-[#E4E2EA] mx-2 mb-2", className)}
      {...props}
    />
  );
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      className={cn("flex w-full min-w-0 flex-col gap-[2px]", className)}
      {...props}
    />
  );
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-item"
      className={cn("group/menu-item relative list-none", className)}
      {...props}
    />
  );
}

function SidebarMenuButton({
  asChild = false,
  isActive = false,
  tooltip,
  className,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean;
  isActive?: boolean;
  tooltip?: string | React.ComponentProps<typeof TooltipContent>;
}) {
  const Comp = asChild ? Slot : "button";
  const { isRail } = useSidebar();

  const button = (
    <Comp
      data-slot="sidebar-menu-button"
      data-active={isActive}
      className={cn(
        "h-[44px] rounded-[14px] text-[15px] font-[600] flex items-center transition-colors duration-150 outline-none select-none",
        isRail ? "w-[44px] px-0 justify-center mx-auto" : "w-full px-[14px] py-[10px] gap-3",
        isActive
          ? "bg-[#FBF1D6] text-[#7A560A] font-[700] shadow-none"
          : "text-[#4A483F] hover:bg-[rgba(251,241,214,0.55)] hover:text-[#15130D]",
        className
      )}
      {...props}
    />
  );

  if (!tooltip || !isRail) {
    return button;
  }

  const tooltipProps = typeof tooltip === "string" ? { children: tooltip } : tooltip;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent
        side="right"
        align="center"
        className="bg-[#15130D] text-white text-xs font-[600] px-2.5 py-1.5 rounded-lg shadow-lg z-50 border-none"
        {...tooltipProps}
      />
    </Tooltip>
  );
}

function SidebarTrigger({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon"
      className={cn("size-11 rounded-[14px] border border-[#ECE7DA]", className)}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <PanelLeftIcon className="w-5 h-5 text-[#7A560A]" />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
}

function SidebarRail({ className, ...props }: React.ComponentProps<"button">) {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn("hidden", className)}
      {...props}
    />
  );
}

function SidebarInset({ className, children, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn("flex-1 min-w-0 min-h-0 overflow-y-auto p-3 md:pt-4 md:pr-5 md:pb-5 md:pl-0 custom-scrollbar", className)}
      {...props}
    >
      <div className="page-card flex flex-col gap-6">
        {children}
      </div>
    </main>
  );
}

function SidebarInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="sidebar-input"
      className={cn("bg-background h-8 w-full shadow-none", className)}
      {...props}
    />
  );
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group"
      className={cn("relative flex w-full min-w-0 flex-col", className)}
      {...props}
    />
  );
}

function SidebarGroupLabel({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "div";
  return (
    <Comp
      data-slot="sidebar-group-label"
      className={cn("text-xs font-[700] text-[#6B6A66] uppercase tracking-[0.14em] px-2 py-1.5", className)}
      {...props}
    />
  );
}

function SidebarGroupAction({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="sidebar-group-action"
      className={cn("absolute right-2 top-2 size-6 rounded-md hover:bg-[#FBF1D6]", className)}
      {...props}
    />
  );
}

function SidebarGroupContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-content"
      className={cn("w-full text-sm", className)}
      {...props}
    />
  );
}

function SidebarMenuAction({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="sidebar-menu-action"
      className={cn("absolute right-1 top-1.5 size-7 rounded-md", className)}
      {...props}
    />
  );
}

function SidebarMenuBadge({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-menu-badge"
      className={cn("pointer-events-none absolute right-2 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold", className)}
      {...props}
    />
  );
}

function SidebarMenuSkeleton({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-menu-skeleton"
      className={cn("flex h-8 items-center gap-2 rounded-md px-2", className)}
      {...props}
    >
      <Skeleton className="size-4 rounded-md" />
      <Skeleton className="h-4 flex-1" />
    </div>
  );
}

function SidebarMenuSub({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      className={cn("flex flex-col gap-1 pl-6", className)}
      {...props}
    />
  );
}

function SidebarMenuSubItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li data-slot="sidebar-menu-sub-item" className={cn("list-none", className)} {...props} />;
}

function SidebarMenuSubButton({
  asChild = false,
  className,
  ...props
}: React.ComponentProps<"a"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "a";
  return (
    <Comp
      data-slot="sidebar-menu-sub-button"
      className={cn("flex h-7 items-center gap-2 rounded-md px-2 text-xs", className)}
      {...props}
    />
  );
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
};
