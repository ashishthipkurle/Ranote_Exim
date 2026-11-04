"use client";

import Image from "next/image";
import loadingGif from "@/assests/Transparent loading gif.gif";

interface GifLoaderProps {
  text?: string;
  className?: string;
  showText?: boolean;
}

export default function GifLoader({ 
  text, 
  className = "",
  showText = true 
}: GifLoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="flex flex-col items-center justify-center">
        <Image
          src={loadingGif}
          alt="Loading..."
          className="w-40 h-40 md:w-56 md:h-56 object-contain animate-in fade-in duration-500"
          priority
          unoptimized
        />
        {showText && text && (
          <h2 className="-mt-6 md:-mt-10 text-lg md:text-xl font-sans font-bold tracking-widest uppercase text-[#D4AF37] animate-pulse">
            {text}
          </h2>
        )}
      </div>
    </div>
  );
}
