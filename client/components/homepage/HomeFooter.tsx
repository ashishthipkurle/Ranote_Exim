"use client";

import Link from "next/link";
import { Linkedin, Instagram, Facebook, MapPin, Phone, Mail, Globe, Code2, ExternalLink } from "lucide-react";

export default function HomeFooter() {
  return (
    <footer className="bg-background border-t border-border pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 mb-12">
          {/* Company Info */}
          <div className="col-span-1 lg:col-span-2">
            <h3 className="text-2xl font-bold tracking-wide text-foreground mb-4">
              RANOTE EXIM PRIVATE LIMITED
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed font-semibold mb-1">
              Indian Merchant Exporter & Global Sourcing Partner
            </p>
            <p className="text-primary text-sm font-bold mb-6 italic">
              Where Standards Reach Higher
            </p>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Kolhapur, Maharashtra, India</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-primary" />
                <span>+91 9370366075</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-primary" />
                <span>connect@ranoteexim.com</span>
              </div>
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-primary" />
                <span>ranoteexim.com</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
            <h4 className="text-lg font-semibold text-foreground mb-6">Quick Links</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
              <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/products" className="hover:text-primary transition-colors">Products</Link></li>
              <li><Link href="/sourcing" className="hover:text-primary transition-colors">Sourcing</Link></li>
              <li><Link href="/export-process" className="hover:text-primary transition-colors">Export Process</Link></li>
              <li><Link href="/markets" className="hover:text-primary transition-colors">Markets</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Social & Legal */}
          <div className="col-span-1 flex flex-col justify-between">
            <div>
              <h4 className="text-lg font-semibold text-foreground mb-6">Social</h4>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-white transition-colors" aria-label="LinkedIn">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-white transition-colors" aria-label="Instagram">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-white transition-colors" aria-label="Facebook">
                  <Facebook className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div className="mt-8 md:mt-0">
              <h4 className="text-lg font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-primary transition-colors">Terms &amp; Conditions</Link></li>
                <li><Link href="/cookies" className="hover:text-primary transition-colors">Cookie Policy &amp; Settings</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="space-y-1 text-center md:text-left">
            <p>© {new Date().getFullYear()} Ranote Exim Private Limited. All rights reserved.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 sm:gap-4 text-xs">
            <Link href="/privacy-policy" className="hover:text-primary transition-colors">Privacy</Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
            <span>·</span>
            <Link href="/cookies" className="hover:text-primary transition-colors">Cookies</Link>
            <span>·</span>
            <a
              href="https://ashish-thipkurle.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FBF1D6] hover:bg-[#C4912A] text-[#7A560A] hover:text-white font-bold text-xs transition-all shadow-xs group"
              title="Developed by Ashish Thipkurle - View Portfolio"
            >
              <Code2 className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>Developer</span>
              <ExternalLink className="w-3 h-3 opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
