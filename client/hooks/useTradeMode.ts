"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

export function useTradeMode() {
  const [b2cActive, setB2cActive] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchTradeMode = async () => {
    try {
      const res = await fetch("/api/admin/trade-mode");
      if (res.ok) {
        const data = await res.json();
        setB2cActive(Boolean(data.b2cActive));
      }
    } catch (e) {
      console.error("Failed to load trade mode:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTradeMode();
    const handleUpdate = () => fetchTradeMode();
    window.addEventListener("trade-mode-updated", handleUpdate);
    return () => window.removeEventListener("trade-mode-updated", handleUpdate);
  }, []);

  const toggleTradeMode = async (enableB2C: boolean) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/trade-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ b2cActive: enableB2C }),
      });
      if (res.ok) {
        setB2cActive(enableB2C);
        window.dispatchEvent(new Event("trade-mode-updated"));
        toast.success(
          enableB2C
            ? "B2C Mode Enabled: Public prices and retail checkout are now active."
            : "B2B Only Mode Active: Public prices and retail checkout are now hidden."
        );
      } else {
        toast.error("Failed to update trade mode.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error communicating with server.");
    } finally {
      setLoading(false);
    }
  };

  return { b2cActive, loading, toggleTradeMode, refresh: fetchTradeMode };
}

