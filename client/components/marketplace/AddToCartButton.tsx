"use client";

import { useState } from "react";
import { ShoppingCart, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { addToCart } from "@/lib/cart";

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

  const handleClick = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setLoading(true);
    try {
      addToCart(productId, quantity);
      toast.success("Added to quotation cart");
    } catch (err) {
      toast.error("Failed to add to cart. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      className={className}
      disabled={loading}
      onClick={handleClick}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
      ) : (
        <ShoppingCart className="h-4 w-4 mr-1.5" />
      )}
      {loading ? "Adding..." : label}
    </Button>
  );
}
