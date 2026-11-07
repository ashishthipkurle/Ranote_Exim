"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { StoredUser } from "@/lib/auth-client";
import axios from "axios";
import { clearAllCartData } from "@/lib/cart";
import { clearAllWishlistData } from "@/lib/wishlist";

type AuthContextType = {
  user: StoredUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(null);

  const [loading, setLoading] = useState(true);

  // Hydrate from localStorage AFTER mount to avoid server/client mismatch
  useEffect(() => {
    const cached = window.localStorage.getItem("user_profile");
    if (cached) {
      try {
        setUser(JSON.parse(cached));
        setLoading(false);
      } catch (e) {
        setLoading(true);
      }
    }
  }, []);

  const supabase = createClient();

  const fetchUserFromDB = useCallback(async () => {
    try {
      const res = await axios.get(`/api/auth/me?t=${Date.now()}`);
      if (res.data.user) {
        setUser(res.data.user);
        window.localStorage.setItem("user_profile", JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.error("[AuthProvider] DB fetch failed", err);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    setLoading(true);
    await fetchUserFromDB();
    setLoading(false);
  }, [fetchUserFromDB]);

  const logout = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      await axios.post("/api/auth/logout").catch(() => {});
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("user_profile");
        // Clear all user-scoped data to prevent leaks between accounts
        clearAllCartData();
        clearAllWishlistData();
        window.localStorage.removeItem("renote_local_orders");
        window.localStorage.removeItem("renote_product_reviews");
      }
      setUser(null);
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check active session and refresh to guarantee up-to-date roles from database
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await fetchUserFromDB();
      } else {
        // Fallback: Check server session via /api/auth/me before assuming logged out
        try {
          const res = await axios.get(`/api/auth/me?t=${Date.now()}`);
          if (res.data?.user) {
            setUser(res.data.user);
            window.localStorage.setItem("user_profile", JSON.stringify(res.data.user));
            setLoading(false);
            return;
          }
        } catch {
          // Genuinely logged out
        }
        setUser(null);
        window.localStorage.removeItem("user_profile");
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[AuthProvider] Auth state changed:", event);
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await fetchUserFromDB();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          window.localStorage.removeItem("user_profile");
          clearAllCartData();
          clearAllWishlistData();
          window.localStorage.removeItem("renote_local_orders");
          window.localStorage.removeItem("renote_product_reviews");
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth, fetchUserFromDB]);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
