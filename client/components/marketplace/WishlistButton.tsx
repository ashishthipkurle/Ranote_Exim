"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { isInWishlist, toggleWishlist } from "@/lib/wishlist";
import { cn } from "@/lib/utils";

export default function WishlistButton({
  productId,
  className,
  iconOnly = false,
}: {
  productId: string;
  className?: string;
  iconOnly?: boolean;
}) {
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    setLiked(isInWishlist(productId));

    const handleUpdate = () => {
      setLiked(isInWishlist(productId));
    };

    window.addEventListener("renote-wishlist-updated", handleUpdate);
    return () => window.removeEventListener("renote-wishlist-updated", handleUpdate);
  }, [productId]);

  const handleToggle = () => {
    toggleWishlist(productId);
  };

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
        liked
          ? "text-red-500 hover:text-red-600 bg-red-50 border-red-200"
          : "text-[#6B6A66] hover:text-red-500 hover:bg-red-50",
        className
      )}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleToggle();
      }}
      title={liked ? "Saved to wishlist" : "Add to wishlist"}
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-all duration-300",
          liked ? "fill-current text-red-500 scale-110" : "scale-100"
        )}
      />
      {!iconOnly && <span>{liked ? "Saved" : "Wishlist"}</span>}
    </button>
  );
}
