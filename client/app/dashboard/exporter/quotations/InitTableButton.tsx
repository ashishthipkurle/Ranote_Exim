"use client";

import { useState } from "react";
import { initQuotationsTable } from "./actions";
import { Loader2, Database } from "lucide-react";
import { toast } from "sonner";

export default function InitTableButton() {
  const [loading, setLoading] = useState(false);

  const handleInit = async () => {
    setLoading(true);
    try {
      const res = await initQuotationsTable();
      if (res?.success) {
        toast.success("Database tables created successfully! Reloading...");
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        toast.error(res?.error || "Failed to initialize tables");
      }
    } catch (err: any) {
      toast.error(err?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleInit}
      disabled={loading}
      className="inline-flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow transition-colors disabled:opacity-50 cursor-pointer"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Creating Tables in Supabase...
        </>
      ) : (
        <>
          <Database className="w-4 h-4 mr-2" />
          1-Click Setup: Create Tables Automatically
        </>
      )}
    </button>
  );
}
