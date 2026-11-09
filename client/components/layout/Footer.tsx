'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Globe, Shield, Mail, Phone, Twitter, Linkedin, Github } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();

  // Only show footer on the homepage
  if (pathname !== '/') return null;

  return (
    <footer className="bg-slate-950 border-t border-slate-900 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Section */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">Ranote Exim</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              The world&apos;s most advanced B2B platform for global trade. Connecting verified exporters and importers with seamless trade tools.
            </p>
            <div className="flex items-center gap-4">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-900 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-900 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-900 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Marketplace */}
          <div>
            <h4 className="text-white font-semibold mb-6">Marketplace</h4>
            <ul className="space-y-4">
              <li><Link href="/products" className="text-slate-400 hover:text-blue-400 text-sm transition-colors">Browse Products</Link></li>
              <li><Link href="/products?category=TEXTILES" className="text-slate-400 hover:text-blue-400 text-sm transition-colors">Textiles &amp; Apparel</Link></li>
              <li><Link href="/products?category=MACHINES" className="text-slate-400 hover:text-blue-400 text-sm transition-colors">Industrial Machines</Link></li>
              <li><Link href="/products?category=AGRICULTURE" className="text-slate-400 hover:text-blue-400 text-sm transition-colors">Agriculture</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-6">Company</h4>
            <ul className="space-y-4">
              <li><Link href="/about" className="text-slate-400 hover:text-blue-400 text-sm transition-colors">About Us</Link></li>
              <li><Link href="/faq" className="text-slate-400 hover:text-blue-400 text-sm transition-colors">Pricing Plans</Link></li>
              <li><Link href="/faq" className="text-slate-400 hover:text-blue-400 text-sm transition-colors">How it Works</Link></li>
              <li><Link href="/faq" className="text-slate-400 hover:text-blue-400 text-sm transition-colors">Contact Support</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-6">Direct Support</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <Mail className="w-4 h-4 text-blue-500" />
                <a href="mailto:support@ranoteexim.com" className="hover:text-blue-400 transition-colors">support@ranoteexim.com</a>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <Phone className="w-4 h-4 text-blue-500" />
                <a href="tel:+919370366075" className="hover:text-blue-400 transition-colors">+91 9370366075</a>
              </div>
              <div className="mt-6 flex items-center gap-2 p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                <Shield className="w-4 h-4 text-blue-400" />
                <span className="text-[12px] text-blue-300 font-medium">Verified Safe Trade Platform</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <p className="text-slate-500 text-[12px]">
              &copy; {new Date().getFullYear()} Ranote Exim Platform. All rights reserved.
            </p>
            <p className="text-slate-500 text-[11px]">
              Grievance Officer: <strong className="text-slate-400">Siddharth Ranote</strong> · <a href="mailto:grievance@ranote-exim.com" className="text-amber-500/90 hover:underline">grievance@ranote-exim.com</a>
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link href="/privacy-policy" className="text-slate-400 hover:text-white text-[12px] transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-slate-400 hover:text-white text-[12px] transition-colors">Terms &amp; Conditions</Link>
            <Link href="/cookies" className="text-slate-400 hover:text-white text-[12px] transition-colors">Cookie Policy &amp; Settings</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
