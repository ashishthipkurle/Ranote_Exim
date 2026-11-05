"use client";

import { useState } from "react";
import { ShoppingCart, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { addToCart } from "@/lib/cart";
import { cn } from "@/lib/utils";

export default function AddToCartButton({
  productId,
  quantity = 1,
  className,
  label = "Add to cart",
}: {
  productId: string;
  quantity?: number;
  className?: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const handleClick = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (loading || justAdded) return;

    setLoading(true);
    try {
      addToCart(productId, quantity);
      toast.success("Added to quotation cart");

      // Brief minimum spinner duration so user visibly perceives the confirmation
      await new Promise((resolve) => setTimeout(resolve, 250));
      setLoading(false);
      setJustAdded(true);

      // Keep in "Added!" state for 1.2s to block multi-clicks
      setTimeout(() => {
        setJustAdded(false);
      }, 1200);
    } catch {
      toast.error("Failed to add to cart. Please try again.");
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      className={cn(
        className,
        justAdded && "bg-emerald-600 hover:bg-emerald-600 text-white border-emerald-600 shadow-sm"
      )}
      disabled={loading || justAdded}
      onClick={handleClick}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
      ) : justAdded ? (
        <Check className="h-4 w-4 mr-1.5" />
      ) : (
        <ShoppingCart className="h-4 w-4 mr-1.5" />
      )}
      {loading ? "Adding..." : justAdded ? "Added to Quote" : label}
    </Button>
  );
}
