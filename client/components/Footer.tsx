import Link from "next/link";
import { Globe2, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram, Code2, ExternalLink } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Globe2 className="text-white" size={24} />
              </div>
              <span className="text-xl font-bold text-white">
                Ranote <span className="text-blue-400">Exim</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-6">
              Your trusted partner for global import-export operations. Connecting businesses
              worldwide since 2020.
            </p>
            <div className="flex gap-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors">
                <Facebook size={20} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-blue-400 transition-colors">
                <Twitter size={20} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors">
                <Linkedin size={20} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-pink-600 transition-colors">
                <Instagram size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="hover:text-blue-400 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-blue-400 transition-colors">
                  Products
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-blue-400 transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-blue-400 transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-blue-400 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-white font-bold mb-4">Services</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/export-process" className="hover:text-blue-400 transition-colors">
                  Export Services
                </Link>
              </li>
              <li>
                <Link href="/sourcing" className="hover:text-blue-400 transition-colors">
                  Import Services
                </Link>
              </li>
              <li>
                <Link href="/sourcing" className="hover:text-blue-400 transition-colors">
                  Logistics Support
                </Link>
              </li>
              <li>
                <Link href="/export-process" className="hover:text-blue-400 transition-colors">
                  Compliance Management
                </Link>
              </li>
              <li>
                <Link href="/markets" className="hover:text-blue-400 transition-colors">
                  Trade Analytics
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-bold mb-4">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin size={20} className="text-blue-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm">
                  123 Trade Center, Global Business District, Mumbai 400001, India
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={20} className="text-blue-400 flex-shrink-0" />
                <a href="tel:+919370366075" className="text-sm hover:text-blue-400 transition-colors">
                  +91 9370366075
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={20} className="text-blue-400 flex-shrink-0" />
                <a href="mailto:support@ranoteexim.com" className="text-sm hover:text-blue-400 transition-colors">
                  support@ranoteexim.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-400">
              © {currentYear} Ranote Exim. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <Link href="/privacy-policy" className="text-sm text-slate-400 hover:text-blue-400 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-slate-400 hover:text-blue-400 transition-colors">
                Terms of Service
              </Link>
              <Link href="/cookies" className="text-sm text-slate-400 hover:text-blue-400 transition-colors">
                Cookie Policy &amp; Settings
              </Link>
              <a
                href="https://ashish-thipkurle.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 hover:bg-blue-600 text-blue-400 hover:text-white font-bold text-xs transition-all border border-blue-500/20 group"
                title="Developed by Ashish Thipkurle - View Portfolio"
              >
                <Code2 className="w-3.5 h-3.5 stroke-[2.2]" />
                <span>Developer</span>
                <ExternalLink className="w-3 h-3 opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
