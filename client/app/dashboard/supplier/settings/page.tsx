"use client";

import React, { useState, useEffect } from "react";
import { 
  Settings, 
  User, 
  Shield, 
  Building,
  Mail,
  Lock, 
  CheckCircle2,
  ShieldCheck,
  Loader2,
  KeyRound,
  Eye,
  EyeOff,
  BadgeCheck,
  Phone,
  Globe,
  Camera,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { authFetch } from "@/lib/api-utils";
import { toast } from "sonner";

export default function SupplierSettingsPage() {
  const { user, refreshUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "kyc" | "security">("profile");

  const [form, setForm] = useState({
    name: user?.name || "",
    businessName: user?.businessName || "",
    country: user?.country || "India",
    phone: user?.phone || "",
    website: user?.website || "",
    avatar: user?.avatar || "",
  });

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    authFetch<{ user: any }>("/api/user/profile")
      .then(({ user: u }) => {
        if (u) {
          setForm({
            name: u.name || "",
            businessName: u.businessName || "",
            country: u.country || "India",
            phone: u.phone || "",
            website: u.website || "",
            avatar: u.avatar || "",
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await authFetch("/api/user/profile", {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      toast.success("Supplier account parameters updated.");
      refreshUser();
    } catch {
      toast.error("Failed to update profile settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setChangingPassword(true);
    try {
      await authFetch("/api/user/change-password", {
        method: "POST",
        body: JSON.stringify({ newPassword: passwordForm.newPassword }),
      });
      toast.success("Password updated successfully");
      setPasswordForm({ newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast.error(err?.message || "Failed to update password");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-6xl pb-16">
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#F0ECE0]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] bg-[#FBF1D6] text-[#7A560A]">
              Supplier Account
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66]">
              Distribution Credentials
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#15130D]">
            Profile & Settings
          </h1>
          <p className="text-sm text-[#6B6A66] mt-0.5">
            Configure your registered supplier profile, wholesale contacts, and security access
          </p>
        </div>

        <button 
          onClick={handleSave} 
          disabled={saving}
          className="btn-gold-primary !py-2.5 !px-5"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4 stroke-[2]" />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* ─── Tabs Bar ─── */}
      <div className="flex items-center gap-2 border-b border-[#F0ECE0] pb-3">
        {[
          { id: "profile", label: "Profile Persona", icon: User },
          { id: "kyc", label: "Supplier KYC", icon: ShieldCheck },
          { id: "security", label: "Security & Access", icon: Lock },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-[0.14em] transition-all ${
                isActive
                  ? "bg-[#FBF1D6] text-[#7A560A] shadow-sm border border-[#C4912A]/30"
                  : "text-[#6B6A66] hover:bg-[#F4F4F7]"
              }`}
            >
              <tab.icon className="w-4 h-4 stroke-[1.8]" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── Tab 1: Profile Persona ─── */}
      {activeTab === "profile" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="rounded-[24px] border border-[#F0ECE0] bg-gradient-to-b from-white to-[#FFFBF0] p-6 md:p-8 shadow-sm flex flex-col sm:flex-row items-center gap-6">
            <div className="w-20 h-20 rounded-[20px] bg-gradient-to-br from-[#EBC964] to-[#C4912A] text-[#7A560A] font-extrabold text-2xl flex items-center justify-center shrink-0 shadow-md">
              {form.avatar ? (
                <img src={form.avatar} alt="" className="w-full h-full object-cover rounded-[20px]" />
              ) : (
                form.name ? form.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2) : "SU"
              )}
            </div>
            <div className="text-center sm:text-left flex-1 min-w-0">
              <h2 className="text-xl font-extrabold text-[#15130D] truncate">
                {form.businessName || form.name || "Supplier Node"}
              </h2>
              <p className="text-xs text-[#6B6A66] mt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span>{user?.email}</span>
                <span>•</span>
                <span>{form.country || "India"}</span>
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] bg-[#E2F5EE] text-[#0B7A57]">
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2]" />
              Verified Supplier
            </span>
          </div>

          <div className="rounded-[24px] border border-[#F0ECE0] bg-gradient-to-b from-white to-[#FFFBF0] p-6 md:p-8 shadow-sm space-y-6">
            <h3 className="text-xs md:text-sm font-extrabold tracking-wider uppercase text-[#15130D]">
              SUPPLIER IDENTIFICATION
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66] block mb-1.5">
                  Full Name / Contact Person
                </label>
                <input 
                  type="text" 
                  className="w-full h-11 bg-[#F4F4F7] border border-[#F0ECE0] rounded-xl px-4 text-sm text-[#15130D] focus:outline-none focus:border-[#C4912A] transition-colors"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66] block mb-1.5">
                  Business Entity / Trading Name
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Apex Mineral Suppliers"
                  className="w-full h-11 bg-[#F4F4F7] border border-[#F0ECE0] rounded-xl px-4 text-sm text-[#15130D] focus:outline-none focus:border-[#C4912A] transition-colors"
                  value={form.businessName}
                  onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66] block mb-1.5">
                  Phone Number
                </label>
                <input 
                  type="tel" 
                  className="w-full h-11 bg-[#F4F4F7] border border-[#F0ECE0] rounded-xl px-4 text-sm text-[#15130D] focus:outline-none focus:border-[#C4912A] transition-colors"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66] block mb-1.5">
                  Operating Country
                </label>
                <input 
                  type="text" 
                  className="w-full h-11 bg-[#F4F4F7] border border-[#F0ECE0] rounded-xl px-4 text-sm text-[#15130D] focus:outline-none focus:border-[#C4912A] transition-colors"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[#F0ECE0]">
              <button 
                onClick={handleSave} 
                disabled={saving}
                className="btn-gold-primary"
              >
                <ShieldCheck className="w-4 h-4 stroke-[2]" />
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Tab 2: KYC Verification ─── */}
      {activeTab === "kyc" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="rounded-[24px] border border-[#0B7A57]/30 bg-[#E2F5EE] p-6 md:p-8 flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-sm">
              <BadgeCheck className="w-7 h-7 text-[#0B7A57]" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[#0B7A57]">
                Supplier Verification Active
              </h2>
              <p className="text-xs text-[#4A483F] mt-1 max-w-xl leading-relaxed">
                Your supplier and distribution credentials are certified. Global exporters can connect and contract with your node directly.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Tab 3: Security & Access ─── */}
      {activeTab === "security" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="rounded-[24px] border border-[#F0ECE0] bg-gradient-to-b from-white to-[#FFFBF0] p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-[#F0ECE0]">
              <div className="w-10 h-10 rounded-[14px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center">
                <Lock className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div>
                <h3 className="text-xs md:text-sm font-extrabold tracking-wider uppercase text-[#15130D]">
                  CHANGE SUPPLIER PASSWORD
                </h3>
                <p className="text-xs text-[#6B6A66]">
                  Update your authentication credentials for dealer and quotation operations
                </p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-5 max-w-lg">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66] block mb-1.5">
                  New Password (minimum 8 characters)
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Enter secure new password"
                    className="w-full h-11 bg-[#F4F4F7] border border-[#F0ECE0] rounded-xl pl-4 pr-11 text-sm text-[#15130D] focus:outline-none focus:border-[#C4912A]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B6A66] hover:text-[#15130D]"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66] block mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Repeat new password"
                    className="w-full h-11 bg-[#F4F4F7] border border-[#F0ECE0] rounded-xl pl-4 pr-11 text-sm text-[#15130D] focus:outline-none focus:border-[#C4912A]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B6A66] hover:text-[#15130D]"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={changingPassword}
                className="btn-gold-primary !mt-6"
              >
                {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4 stroke-[2]" />}
                {changingPassword ? "Updating Password..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
