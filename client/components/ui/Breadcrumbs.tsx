'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs() {
  const pathname = usePathname();
  
  if (!pathname || pathname === '/') return null;

  const paths = (pathname || '').split('/').filter(Boolean);
  if (!paths || paths.length === 0) return null;

  return (
    <nav className="flex items-center gap-2 text-[13px] font-[600] text-[#6B6A66] mb-2">
      <Link 
        href="/" 
        className="flex items-center gap-1.5 text-[#6B6A66] hover:text-[#C4912A] transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
        <span className="sr-only">Home</span>
      </Link>

      {paths.map((path, index) => {
        if (!path) return null;
        const href = `/${paths.slice(0, index + 1).join('/')}`;
        const isLast = index === paths.length - 1;
        const label = String(path || '')
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase());

        return (
          <div key={path} className="flex items-center gap-2">
            <ChevronRight className="w-3.5 h-3.5 text-[#ECE7DA]" />
            {isLast ? (
              <span className="text-[#7A560A] font-[600] truncate max-w-[200px]">{label}</span>
            ) : (
              <Link 
                href={href} 
                className="hover:text-[#C4912A] transition-colors whitespace-nowrap"
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
