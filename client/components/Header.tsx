"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, User, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useAuth } from "@/components/auth/AuthProvider";
import RanoteLogo from "@/components/ui/RanoteLogo";

export default function Header() {
 const [isMenuOpen, setIsMenuOpen] = useState(false);
 const { user, loading, logout } = useAuth();

 const navLinks = [
 { href: "/", label: "Home" },
 { href: "/about", label: "About" },
 { href: "/products", label: "Products" },
 { href: "/contact", label: "Contact" },
 ];

 return (
 <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
 <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="flex items-center justify-between h-16">
 {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group pl-2" aria-label="Ranote Exim Home">
            <RanoteLogo className="h-9 md:h-11 w-auto" />
          </Link>

 {/* Desktop Navigation */}
 <div className="hidden md:flex items-center gap-8">
 {navLinks.map((link) => (
 <Link
 key={link.href}
 href={link.href}
 className="text-muted-foreground hover:text-primary transition-colors relative group"
 >
 {link.label}
 <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
 </Link>
 ))}
 </div>

 {/* Auth Buttons */}
 <div className="hidden md:flex items-center gap-2">
 <ThemeToggle />
 {loading ? (
 <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
 ) : user ? (
 <div className="flex items-center gap-2">
 <Link href={user.role?.toUpperCase() === "USER" ? "/products" : user.role?.toUpperCase() === "ADMIN" ? "/dashboard/exporter" : `/dashboard/${user.role?.toLowerCase()}`}>
 <Button variant="ghost" className="gap-2">
 {user.avatar ? (
 <Image src={user.avatar as string} alt="Avatar" width={32} height={32} className="w-8 h-8 rounded-full object-cover" unoptimized />
 ) : (
 <User className="w-4 h-4" />
 )}
 Dashboard
 </Button>
 </Link>
 <Button variant="ghost" size="icon" onClick={() => logout()}>
 <LogOut className="w-4 h-4" />
 </Button>
 </div>
 ) : (
 <>
 <Link href="/login">
 <Button variant="ghost">Login</Button>
 </Link>
 <Link href="/register">
 <Button>Get Started</Button>
 </Link>
 </>
 )}
 </div>

 {/* Mobile Menu Button */}
 <button
 onClick={() => setIsMenuOpen(!isMenuOpen)}
 className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
 >
 {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
 </button>
 </div>
 </nav>

 {/* Mobile Menu */}
 <AnimatePresence>
 {isMenuOpen && (
 <motion.div
 initial={{ opacity: 0, height: 0 }}
 animate={{ opacity: 1, height: "auto" }}
 exit={{ opacity: 0, height: 0 }}
 transition={{ duration: 0.2 }}
 className="md:hidden bg-background border-t border-border"
 >
 <div className="px-4 py-4 space-y-3">
 <div className="flex items-center justify-between">
 <span className="text-sm font-medium text-muted-foreground">Theme</span>
 <ThemeToggle />
 </div>
 {navLinks.map((link) => (
 <Link
 key={link.href}
 href={link.href}
 className="block py-2 text-muted-foreground hover:text-primary transition-colors"
 onClick={() => setIsMenuOpen(false)}
 >
 {link.label}
 </Link>
 ))}
 <div className="pt-4 space-y-2 border-t border-border">
 {!loading && (
 user ? (
 <>
 <Link href={user.role?.toUpperCase() === "USER" ? "/products" : user.role?.toUpperCase() === "ADMIN" ? "/dashboard/exporter" : `/dashboard/${user.role?.toLowerCase()}`} className="block">
 <Button className="w-full gap-2">
 <User className="w-4 h-4" /> Dashboard
 </Button>
 </Link>
 <Button variant="ghost" className="w-full gap-2" onClick={() => logout()}>
 <LogOut className="w-4 h-4" /> Logout
 </Button>
 </>
 ) : (
 <>
 <Link href="/login" className="block">
 <Button variant="ghost" className="w-full">
 Login
 </Button>
 </Link>
 <Link href="/register" className="block">
 <Button className="w-full">Get Started</Button>
 </Link>
 </>
 )
 )}
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </header>
 );
}
