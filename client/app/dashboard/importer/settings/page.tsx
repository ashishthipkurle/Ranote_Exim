"use client";

import { useEffect, useState, useRef } from "react";
import { authFetch } from "@/lib/api-utils";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  User,
  Building2,
  Globe,
  Phone,
  Mail,
  ShieldCheck,
  Lock,
  Briefcase,
  FileText,
  CheckCircle2,
  Loader2,
  Camera,
  KeyRound,
  Eye,
  EyeOff,
  Upload,
  BadgeCheck,
  Smartphone,
  Save,
  Check,
  AlertTriangle,
  Clock,
  Link2,
} from "lucide-react";
import { toast } from "sonner";
import PrivacyGovernanceSection from "@/components/legal/PrivacyGovernanceSection";
import axios from "axios";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  businessName: string | null;
  country: string | null;
  phone: string | null;
  phoneVerified?: boolean;
  website: string | null;
  businessType: string | null;
  taxId: string | null;
  address: string | null;
  avatar: string | null;
  role: string;
  verificationStatus?: string;
}

export default function ImporterSettingsPage() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "business" | "security">("profile");

  // Avatar upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState({
    name: "",
    businessName: "",
    country: "",
    phone: "",
    website: "",
    businessType: "",
    taxId: "",
    address: "",
    avatar: "",
  });

  // Phone OTP
  const [showPhoneOTP, setShowPhoneOTP] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState("");
  const [verifyingPhoneOtp, setVerifyingPhoneOtp] = useState(false);

  // Password State
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    authFetch<{ user: ProfileData }>("/api/user/profile")
      .then(({ user: u }) => {
        setProfile(u);
        setForm({
          name: u.name || "",
          businessName: u.businessName || "",
          country: u.country || "",
          phone: u.phone || "",
          website: u.website || "",
          businessType: u.businessType || "",
          taxId: u.taxId || "",
          address: u.address || "",
          avatar: u.avatar || "",
        });
        setIsDirty(false);
      })
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const handleFieldChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!isDirty && !avatarUploading) return;
    setSaving(true);
    try {
      const res = await authFetch<{ user: ProfileData }>("/api/user/profile", {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      setProfile(res.user);
      setIsDirty(false);
      setSaveSuccess(true);
      toast.success("Profile settings updated successfully");
      refreshUser();
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch {
      toast.error("Failed to update profile settings");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError(null);

    if (file.size > 2 * 1024 * 1024) {
      setAvatarError("File size exceeds 2 MB limit. Please select a smaller image.");
      toast.error("Image file too large (2 MB limit)");
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setAvatarError("Unsupported format. Please select a JPG, PNG, or WebP image.");
      toast.error("Unsupported image format");
      return;
    }

    setAvatarUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setForm((prev) => ({ ...prev, avatar: result }));
      setIsDirty(true);
      setAvatarUploading(false);
      toast.success("Profile photo loaded. Click 'Save Changes' to apply.");
    };
    reader.onerror = () => {
      setAvatarUploading(false);
      setAvatarError("Failed to read image file.");
      toast.error("Failed to read file.");
    };
    reader.readAsDataURL(file);
  };

  const handleRequestPhoneOTP = async () => {
    if (!form.phone) {
      toast.error("Please enter a phone number first.");
      return;
    }
    try {
      toast.loading("Sending verification code to your email...");
      const res = await axios.post("/api/auth/send-otp", {
        email: profile?.email || user?.email,
        purpose: "PHONE_VERIFY",
      });
      toast.dismiss();
      setShowPhoneOTP(true);
      toast.success("Verification code dispatched to your registered email!");
      if (res.data?.devCode) {
        setPhoneOtp(res.data.devCode);
      }
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.response?.data?.error || "Failed to dispatch verification code");
    }
  };

  const handleVerifyPhoneOTP = async () => {
    if (!phoneOtp) {
      toast.error("Please enter the 6-digit verification code");
      return;
    }
    setVerifyingPhoneOtp(true);
    try {
      const verifyRes = await axios.post("/api/auth/verify-otp", {
        email: profile?.email || user?.email,
        code: phoneOtp,
        purpose: "PHONE_VERIFY",
      });

      if (!verifyRes.data?.verified) {
        toast.error("Invalid verification code.");
        setVerifyingPhoneOtp(false);
        return;
      }

      const response = await authFetch<{ user: ProfileData }>("/api/user/profile", {
        method: "PATCH",
        body: JSON.stringify({ phoneVerified: true, phone: form.phone }),
      });
      setProfile(response.user);
      setShowPhoneOTP(false);
      setPhoneOtp("");
      toast.success("Phone number verified successfully!");
      refreshUser();
    } catch {
      toast.error("Verification failed. Please try again.");
    } finally {
      setVerifyingPhoneOtp(false);
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
      toast.success("Password changed successfully");
      setPasswordForm({ newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast.error(err?.message || "Failed to update password");
    } finally {
      setChangingPassword(false);
    }
  };

  const passwordMismatch =
    passwordForm.confirmPassword.length > 0 &&
    passwordForm.newPassword !== passwordForm.confirmPassword;

  const kycStatus = profile?.verificationStatus?.toUpperCase() || "VERIFIED";

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 md:px-8 py-6 space-y-7 pb-20 font-sans selection:bg-[#C4912A] selection:text-white">
      {/* ─── 1. PAGE HEADER ─── */}
      <div className="pb-5 border-b border-[#F0ECE0] space-y-3">
        {/* Row 1: Cream pill + Micro-label */}
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-[800] tracking-[0.1em] uppercase bg-[#FBF1D6] text-[#7A560A]">
            ACCOUNT PROFILE
          </span>
          <span className="text-[11px] font-[800] tracking-[0.1em] uppercase text-[#6B6A66]">
            IMPORTER CREDENTIALS
          </span>
        </div>

        {/* Row 2: Title & Right Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-[38px] font-[800] tracking-tight text-[#15130D] leading-tight">
              Profile &amp; Settings
            </h1>
            <p className="text-[15px] text-[#4A483F] mt-1">
              Configure your global procurement entity, billing address, KYC credentials, and security protocols
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            {/* Status Pill */}
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-[800] bg-[#E2F5EE] text-[#0B7A57] border border-[#BFE8D9] shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
              VERIFIED IMPORTER
            </span>

            {/* ONE Gold Gradient Button in Header */}
            <button
              type="button"
              onClick={handleSave}
              disabled={!isDirty || saving}
              className="h-[48px] px-6 rounded-[14px] bg-gradient-to-r from-[#C4912A] to-[#EBC964] text-[#15130D] font-[800] text-sm shadow-sm hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0 w-full sm:w-auto"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saveSuccess ? (
                <Check className="w-4 h-4 stroke-[3]" />
              ) : (
                <Save className="w-4 h-4 stroke-[2]" />
              )}
              {saving ? "Saving Changes..." : saveSuccess ? "Saved" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      {/* ─── 2. TABS: Segmented Bar ─── */}
      <div className="bg-[#F7F5F0] rounded-[18px] p-[6px] flex items-center gap-2 overflow-x-auto custom-scrollbar">
        {[
          { id: "profile", label: "Profile persona", icon: User },
          { id: "business", label: "Corporate entity & KYC", icon: Building2 },
          { id: "security", label: "Security & access", icon: Lock },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id as any)}
              className={`h-[44px] px-5 rounded-[13px] flex items-center gap-2 text-[14px] font-[700] transition-all shrink-0 cursor-pointer ${
                isActive
                  ? "bg-white text-[#7A560A] shadow-[0_2px_8px_rgba(196,145,42,0.08)]"
                  : "text-[#4A483F] hover:text-[#15130D] hover:bg-white/50"
              }`}
            >
              <tab.icon className="w-[18px] h-[18px] stroke-[1.8]" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: Profile Persona ─── */}
      {activeTab === "profile" && (
        <div className="space-y-7 animate-in fade-in duration-300">
          {/* 3. PROFILE HEADER CARD */}
          <div className="bg-gradient-to-b from-[#FFFDF7] to-[#FFF4D6] p-5 sm:p-7 md:p-[28px] rounded-[24px] border border-[#F0ECE0] shadow-[0_4px_20px_rgba(21,19,13,0.04)] flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar 88px, radius 26, camera button */}
            <div className="relative shrink-0">
              <div className="w-[88px] h-[88px] rounded-[26px] bg-gradient-to-br from-[#EBC964] to-[#C4912A] text-[#3D2802] font-[800] text-[32px] flex items-center justify-center shadow-md overflow-hidden">
                {form.avatar ? (
                  <img src={form.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  form.name ? form.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) : "IM"
                )}
              </div>

              {/* Camera Button 36px dark circle with 3px #FFF8E6 ring */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="w-[36px] h-[36px] rounded-full bg-[#15130D] text-white flex items-center justify-center absolute -bottom-1 -right-1 shadow-md ring-[3px] ring-[#FFF8E6] hover:scale-105 transition-transform cursor-pointer"
                title="Upload Profile Photo (Max 2 MB)"
              >
                {avatarUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleAvatarFileSelected}
                className="hidden"
              />
            </div>

            {/* Name, Role Pill, and Meta */}
            <div className="text-center sm:text-left flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h2 className="text-[26px] font-[800] text-[#15130D] truncate leading-tight">
                  {profile?.businessName || profile?.name || "Global Importer"}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-[800] bg-[#F1DFAE] text-[#7A560A] uppercase tracking-wider">
                  IMPORTER
                </span>
              </div>

              <div className="text-[13px] text-[#4A483F] mt-1.5 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span>{profile?.email || user?.email}</span>
                <span>•</span>
                <span>{profile?.country || "International"}</span>
                <span>•</span>
                <span className="text-[#0B7A57] font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                  Verified Buyer
                </span>
              </div>

              {avatarError && (
                <p className="text-[12px] text-[#B42318] font-medium mt-1.5">
                  {avatarError}
                </p>
              )}
            </div>

            {/* Right Status Pill */}
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-[800] bg-[#E2F5EE] text-[#0B7A57] border border-[#BFE8D9] shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 stroke-[2]" />
              VERIFIED IMPORTER
            </span>
          </div>

          {/* 4. FORM CARD: Contact Details */}
          <div className="bg-gradient-to-b from-white to-[#FFFBF0] border border-[#F0ECE0] rounded-[24px] p-5 sm:p-7 md:p-[28px] shadow-[0_4px_20px_rgba(21,19,13,0.04)] space-y-6">
            <div className="flex items-center gap-3.5 pb-4 border-b border-[#F0ECE0]">
              <div className="w-[48px] h-[48px] rounded-[14px] bg-[#FBF1D6] text-[#7A560A] flex items-center justify-center shrink-0 shadow-xs">
                <User className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div>
                <h3 className="text-[18px] font-[800] uppercase tracking-wide text-[#15130D]">
                  CONTACT DETAILS
                </h3>
                <p className="text-[14px] text-[#4A483F] mt-0.5">
                  Liaison profile and official contact routing for international procurement
                </p>
              </div>
            </div>

            {/* 2-Column Grid (gap 20px 24px) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <label className="text-[13px] font-[700] text-[#3A382F] block mb-2">
                  Display name
                </label>
                <div className="relative">
                  <User className="w-[18px] h-[18px] text-[#6B6A66] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full h-[52px] rounded-[14px] bg-[#F7F5F0] border border-[#F0ECE0] pl-11 pr-4 text-[15px] text-[#15130D] placeholder:text-[#6B6A66] transition-all focus:border-[#C4912A] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[rgba(196,145,42,0.18)]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[13px] font-[700] text-[#3A382F] block mb-2">
                  Account email
                </label>
                <div className="relative">
                  <Lock className="w-[18px] h-[18px] text-[#6B6A66] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    readOnly
                    value={profile?.email || user?.email || ""}
                    className="w-full h-[52px] rounded-[14px] bg-[#F1F0EC] border border-[#E8E4DA] pl-11 pr-4 text-[15px] text-[#6B6A66] cursor-not-allowed opacity-80"
                  />
                </div>
              </div>

              <div>
                <label className="text-[13px] font-[700] text-[#3A382F] block mb-2">
                  Website URL
                </label>
                <div className="relative">
                  <Link2 className="w-[18px] h-[18px] text-[#6B6A66] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="url"
                    value={form.website}
                    onChange={(e) => handleFieldChange("website", e.target.value)}
                    placeholder="https://company.com"
                    className="w-full h-[52px] rounded-[14px] bg-[#F7F5F0] border border-[#F0ECE0] pl-11 pr-4 text-[15px] text-[#15130D] placeholder:text-[#6B6A66] transition-all focus:border-[#C4912A] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[rgba(196,145,42,0.18)]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[13px] font-[700] text-[#3A382F] block mb-2">
                  Phone number
                </label>
                <div className="relative">
                  <Phone className="w-[18px] h-[18px] text-[#6B6A66] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handleFieldChange("phone", e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full h-[52px] rounded-[14px] bg-[#F7F5F0] border border-[#F0ECE0] pl-11 pr-4 text-[15px] text-[#15130D] placeholder:text-[#6B6A66] transition-all focus:border-[#C4912A] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[rgba(196,145,42,0.18)]"
                  />
                </div>
                {/* OTP Link / Status under field */}
                <div className="mt-2">
                  {profile?.phoneVerified ? (
                    <span className="text-[12px] font-[700] text-[#0B7A57] flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                      Phone verified
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRequestPhoneOTP}
                      className="text-[12px] font-[700] text-[#7A560A] hover:underline flex items-center gap-1.5 cursor-pointer"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      Verify phone via OTP
                    </button>
                  )}
                </div>

                {/* Inline OTP block */}
                {showPhoneOTP && (
                  <div className="mt-3 p-3.5 rounded-xl border border-[#C4912A]/30 bg-[#FFFDF7] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-[700] text-[#7A560A]">
                        Enter 6-digit OTP code sent to your email
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowPhoneOTP(false)}
                        className="text-xs text-[#6B6A66] hover:text-[#15130D]"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="text"
                        maxLength={6}
                        value={phoneOtp}
                        onChange={(e) => setPhoneOtp(e.target.value)}
                        placeholder="Enter OTP"
                        className="h-10 w-36 bg-white border border-[#C4912A] rounded-lg px-3 text-sm text-center font-mono font-bold tracking-widest text-[#15130D] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyPhoneOTP}
                        disabled={verifyingPhoneOtp}
                        className="h-10 px-4 rounded-lg bg-[#C4912A] hover:bg-[#7A560A] text-white font-[700] text-xs transition-colors"
                      >
                        {verifyingPhoneOtp ? "Verifying..." : "Confirm Code"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Per-Card Footer: Soft Save Button */}
            <div className="flex justify-end pt-4 border-t border-[#F0ECE0]">
              <button
                type="button"
                onClick={handleSave}
                disabled={!isDirty || saving}
                className="bg-[#FBF1D6] text-[#7A560A] hover:bg-[#F5E6BF] border border-[#C4912A]/30 font-bold rounded-xl px-5 h-11 text-xs transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : saveSuccess ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                  <Save className="w-4 h-4 stroke-[2]" />
                )}
                {saving ? "Saving..." : saveSuccess ? "Saved" : "Save Contact Details"}
              </button>
            </div>
          </div>

          {/* 7. PRIVACY & DATA GOVERNANCE */}
          <PrivacyGovernanceSection userEmail={profile?.email || user?.email} />
        </div>
      )}

      {/* ─── TAB 2: Corporate Entity & KYC ─── */}
      {activeTab === "business" && (
        <div className="space-y-7 animate-in fade-in duration-300">
          {/* 6. KYC STATE BANNERS (Verified / Not Verified / Rejected / Pending) */}
          {kycStatus === "VERIFIED" && (
            <div className="bg-[#E2F5EE] border border-[#BFE8D9] rounded-[24px] p-6 md:p-[26px_28px] flex items-start gap-4">
              <div className="w-[48px] h-[48px] rounded-[14px] bg-white text-[#0B5E43] flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
              </div>
              <div className="flex-1">
                <h2 className="text-[20px] font-[800] text-[#0B5E43] leading-snug">
                  Corporate KYC Verification Active
                </h2>
                <p className="text-[14px] text-[#2F5D4E] mt-1.5 leading-relaxed max-w-3xl">
                  Your international importer tax identification and company profile are platform verified. Wholesale procurement contracts and international quotation pricing are fully enabled.
                </p>
              </div>
            </div>
          )}

          {kycStatus === "PENDING" && (
            <div className="bg-[#F7F5F0] border border-[#E8E4DA] rounded-[24px] p-6 md:p-[26px_28px] flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-[48px] h-[48px] rounded-[14px] bg-white text-[#7A560A] flex items-center justify-center shrink-0 shadow-xs">
                  <Clock className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-[20px] font-[800] text-[#15130D] leading-snug">
                    KYC Verification Under Review
                  </h2>
                  <p className="text-[14px] text-[#4A483F] mt-1.5 leading-relaxed">
                    Our compliance desk is currently validating your corporate tax documents. Standard processing time is 24–48 hours.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-[800] uppercase tracking-wider bg-white text-[#7A560A] border border-[#F0ECE0] shrink-0">
                Under review
              </span>
            </div>
          )}

          {kycStatus === "REJECTED" && (
            <div className="bg-[#FEE4E2] border border-[#FECDCA] rounded-[24px] p-6 md:p-[26px_28px] flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-[48px] h-[48px] rounded-[14px] bg-white text-[#B42318] flex items-center justify-center shrink-0 shadow-xs">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-[20px] font-[800] text-[#B42318] leading-snug">
                    KYC Verification Resubmission Required
                  </h2>
                  <p className="text-[14px] text-[#7A271A] mt-1.5 leading-relaxed">
                    Tax registry address did not match the incorporated entity. Please update the details below and resubmit.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => toast.info("Please update the fields below and click Save Corporate KYC to resubmit.")}
                className="h-[40px] px-5 rounded-[12px] bg-[#B42318] text-white font-[800] text-xs hover:bg-[#912018] transition-colors shrink-0"
              >
                Resubmit
              </button>
            </div>
          )}

          {kycStatus !== "VERIFIED" && kycStatus !== "PENDING" && kycStatus !== "REJECTED" && (
            <div className="bg-[#FFF4D6] border border-[#F1DFAE] rounded-[24px] p-6 md:p-[26px_28px] flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-[48px] h-[48px] rounded-[14px] bg-white text-[#7A560A] flex items-center justify-center shrink-0 shadow-xs">
                  <FileText className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-[20px] font-[800] text-[#7A560A] leading-snug">
                    Submit Corporate KYC Verification
                  </h2>
                  <p className="text-[14px] text-[#4A483F] mt-1.5 leading-relaxed">
                    Submit your legal entity registration and tax number to activate cross-border escrow and bulk wholesale quotation contracts.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSave}
                className="h-[40px] px-5 rounded-[12px] bg-[#C4912A] text-white font-[800] text-xs hover:bg-[#7A560A] transition-colors shrink-0"
              >
                Submit KYC
              </button>
            </div>
          )}

          {/* Corporate Entity & Tax Registration Card */}
          <div className="bg-gradient-to-b from-white to-[#FFFBF0] border border-[#F0ECE0] rounded-[24px] p-5 sm:p-7 md:p-[28px] shadow-[0_4px_20px_rgba(21,19,13,0.04)] space-y-6">
            <div className="flex items-center gap-3.5 pb-4 border-b border-[#F0ECE0]">
              <div className="w-[48px] h-[48px] rounded-[14px] bg-[#FBF1D6] text-[#7A560A] flex items-center justify-center shrink-0 shadow-xs">
                <Building2 className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div>
                <h3 className="text-[18px] font-[800] uppercase tracking-wide text-[#15130D]">
                  CORPORATE IDENTITY &amp; TAX REGISTRATION
                </h3>
                <p className="text-[14px] text-[#4A483F] mt-0.5">
                  Official incorporation credentials and customs delivery endpoints
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              {/* Legal Entity / Company Name (Spans 2 columns) */}
              <div className="md:col-span-2">
                <label className="text-[13px] font-[700] text-[#3A382F] block mb-2">
                  Legal entity / company name
                </label>
                <div className="relative">
                  <Building2 className="w-[18px] h-[18px] text-[#6B6A66] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={form.businessName}
                    onChange={(e) => handleFieldChange("businessName", e.target.value)}
                    placeholder="e.g. Acme Global Trading Inc."
                    className="w-full h-[52px] rounded-[14px] bg-[#F7F5F0] border border-[#F0ECE0] pl-11 pr-4 text-[15px] text-[#15130D] placeholder:text-[#6B6A66] transition-all focus:border-[#C4912A] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[rgba(196,145,42,0.18)]"
                  />
                </div>
              </div>

              {/* Business Classification */}
              <div>
                <label className="text-[13px] font-[700] text-[#3A382F] block mb-2">
                  Business classification
                </label>
                <div className="relative">
                  <Briefcase className="w-[18px] h-[18px] text-[#6B6A66] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={form.businessType}
                    onChange={(e) => handleFieldChange("businessType", e.target.value)}
                    placeholder="e.g. Wholesale / Retail Distributor"
                    className="w-full h-[52px] rounded-[14px] bg-[#F7F5F0] border border-[#F0ECE0] pl-11 pr-4 text-[15px] text-[#15130D] placeholder:text-[#6B6A66] transition-all focus:border-[#C4912A] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[rgba(196,145,42,0.18)]"
                  />
                </div>
              </div>

              {/* Tax ID / VAT / EIN */}
              <div>
                <label className="text-[13px] font-[700] text-[#3A382F] block mb-2">
                  Tax identification number / VAT / EIN
                </label>
                <div className="relative">
                  <FileText className="w-[18px] h-[18px] text-[#6B6A66] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={form.taxId}
                    onChange={(e) => handleFieldChange("taxId", e.target.value)}
                    placeholder="e.g. TAX-894-332"
                    className="w-full h-[52px] rounded-[14px] bg-[#F7F5F0] border border-[#F0ECE0] pl-11 pr-4 text-[15px] text-[#15130D] placeholder:text-[#6B6A66] transition-all focus:border-[#C4912A] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[rgba(196,145,42,0.18)]"
                  />
                </div>
              </div>

              {/* Headquarters Address (Spans 2 columns) */}
              <div className="md:col-span-2">
                <label className="text-[13px] font-[700] text-[#3A382F] block mb-2">
                  Headquarters &amp; customs delivery address
                </label>
                <div className="relative">
                  <Globe className="w-[18px] h-[18px] text-[#6B6A66] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => handleFieldChange("address", e.target.value)}
                    placeholder="e.g. 450 Trade Boulevard, Suite 100"
                    className="w-full h-[52px] rounded-[14px] bg-[#F7F5F0] border border-[#F0ECE0] pl-11 pr-4 text-[15px] text-[#15130D] placeholder:text-[#6B6A66] transition-all focus:border-[#C4912A] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[rgba(196,145,42,0.18)]"
                  />
                </div>
              </div>

              {/* Operating Country */}
              <div>
                <label className="text-[13px] font-[700] text-[#3A382F] block mb-2">
                  Operating country
                </label>
                <div className="relative">
                  <Globe className="w-[18px] h-[18px] text-[#6B6A66] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={form.country}
                    onChange={(e) => handleFieldChange("country", e.target.value)}
                    placeholder="e.g. United States, Germany, UAE"
                    className="w-full h-[52px] rounded-[14px] bg-[#F7F5F0] border border-[#F0ECE0] pl-11 pr-4 text-[15px] text-[#15130D] placeholder:text-[#6B6A66] transition-all focus:border-[#C4912A] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[rgba(196,145,42,0.18)]"
                  />
                </div>
              </div>
            </div>

            {/* Per-Card Footer: Soft Save Button */}
            <div className="flex justify-end pt-4 border-t border-[#F0ECE0]">
              <button
                type="button"
                onClick={handleSave}
                disabled={!isDirty || saving}
                className="bg-[#FBF1D6] text-[#7A560A] hover:bg-[#F5E6BF] border border-[#C4912A]/30 font-bold rounded-xl px-5 h-11 text-xs transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : saveSuccess ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                  <Save className="w-4 h-4 stroke-[2]" />
                )}
                {saving ? "Saving..." : saveSuccess ? "Saved" : "Save Corporate KYC"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: Security & Access ─── */}
      {activeTab === "security" && (
        <div className="space-y-7 animate-in fade-in duration-300">
          {/* Change Importer Password Card */}
          <div className="bg-gradient-to-b from-white to-[#FFFBF0] border border-[#F0ECE0] rounded-[24px] p-5 sm:p-7 md:p-[28px] shadow-[0_4px_20px_rgba(21,19,13,0.04)] space-y-6">
            <div className="flex items-center gap-3.5 pb-4 border-b border-[#F0ECE0]">
              <div className="w-[48px] h-[48px] rounded-[14px] bg-[#FBF1D6] text-[#7A560A] flex items-center justify-center shrink-0 shadow-xs">
                <Lock className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div>
                <h3 className="text-[18px] font-[800] uppercase tracking-wide text-[#15130D]">
                  CHANGE IMPORTER PASSWORD
                </h3>
                <p className="text-[14px] text-[#4A483F] mt-0.5">
                  Update your authentication credentials for quotation and customs escrow operations
                </p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-5 max-w-lg">
              {/* New Password */}
              <div>
                <label className="text-[13px] font-[700] text-[#3A382F] block mb-2">
                  New password
                </label>
                <div className="relative">
                  <Lock className="w-[18px] h-[18px] text-[#6B6A66] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Enter secure new password"
                    className="w-full h-[52px] rounded-[14px] bg-[#F7F5F0] border border-[#F0ECE0] pl-11 pr-12 text-[15px] text-[#15130D] placeholder:text-[#6B6A66] transition-all focus:border-[#C4912A] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[rgba(196,145,42,0.18)]"
                  />
                  <button
                    type="button"
                    aria-pressed={showNewPassword}
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="w-[44px] h-[44px] flex items-center justify-center absolute right-1 top-1/2 -translate-y-1/2 text-[#6B6A66] hover:text-[#15130D]"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[12px] text-[#6B6A66] mt-1.5">
                  Use at least 8 characters
                </p>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="text-[13px] font-[700] text-[#3A382F] block mb-2">
                  Confirm new password
                </label>
                <div className="relative">
                  <Lock className="w-[18px] h-[18px] text-[#6B6A66] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Repeat new password"
                    className={`w-full h-[52px] rounded-[14px] bg-[#F7F5F0] border pl-11 pr-12 text-[15px] text-[#15130D] placeholder:text-[#6B6A66] transition-all focus:bg-white focus:outline-none focus:ring-4 ${
                      passwordMismatch
                        ? "border-[#B42318] focus:border-[#B42318] focus:ring-[#B42318]/20"
                        : "border-[#F0ECE0] focus:border-[#C4912A] focus:ring-[rgba(196,145,42,0.18)]"
                    }`}
                  />
                  <button
                    type="button"
                    aria-pressed={showConfirmPassword}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="w-[44px] h-[44px] flex items-center justify-center absolute right-1 top-1/2 -translate-y-1/2 text-[#6B6A66] hover:text-[#15130D]"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordMismatch && (
                  <p className="text-[12px] text-[#B42318] font-medium mt-1.5">
                    Passwords do not match
                  </p>
                )}
              </div>

              {/* ONE Gold Gradient Button in Security Tab */}
              <button
                type="submit"
                disabled={changingPassword || passwordMismatch || passwordForm.newPassword.length < 8}
                className="h-[48px] px-6 rounded-[14px] bg-gradient-to-r from-[#C4912A] to-[#EBC964] text-[#15130D] font-[800] text-sm shadow-sm hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 !mt-6"
              >
                {changingPassword ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <KeyRound className="w-4 h-4 stroke-[2]" />
                )}
                {changingPassword ? "Updating Password..." : "Update Password"}
              </button>
            </form>
          </div>

          {/* Access Security Audit Card */}
          <div className="bg-gradient-to-b from-white to-[#FFFBF0] border border-[#F0ECE0] rounded-[24px] p-5 sm:p-7 md:p-[28px] shadow-[0_4px_20px_rgba(21,19,13,0.04)] space-y-4">
            <h3 className="text-[18px] font-[800] uppercase tracking-wide text-[#15130D]">
              ENTERPRISE SECURITY &amp; ACCESS AUDIT
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-[18px] border border-[#F0ECE0] bg-white">
                <span className="text-[10px] font-[800] uppercase tracking-wider text-[#6B6A66] block">
                  Encryption standard
                </span>
                <span className="text-[15px] font-[800] text-[#0B7A57] mt-1 block">
                  TLS 1.3 / AES-256
                </span>
                <span className="text-[12px] text-[#6B6A66] mt-0.5 block">Customs escrow secured</span>
              </div>

              <div className="p-4 rounded-[18px] border border-[#F0ECE0] bg-white">
                <span className="text-[10px] font-[800] uppercase tracking-wider text-[#6B6A66] block">
                  Authentication engine
                </span>
                <span className="text-[15px] font-[800] text-[#15130D] mt-1 block">
                  Supabase Auth 2.0
                </span>
                <span className="text-[12px] text-[#6B6A66] mt-0.5 block">JWT tokenized sessions</span>
              </div>

              <div className="p-4 rounded-[18px] border border-[#F0ECE0] bg-white">
                <span className="text-[10px] font-[800] uppercase tracking-wider text-[#6B6A66] block">
                  Regulatory compliance
                </span>
                <span className="text-[15px] font-[800] text-[#7A560A] mt-1 block">
                  DPDP Act 2023 &amp; GDPR
                </span>
                <span className="text-[12px] text-[#6B6A66] mt-0.5 block">Statutory audit logged</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
