"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/api-utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { User, Globe, ShieldCheck, Mail, Building, Phone, Link2, Linkedin, Twitter, FileText, Zap, Camera } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TradeModeToggle from "@/components/admin/TradeModeToggle";

interface ProfileData {
 id: string;
 name: string;
 email: string;
 businessName: string | null;
 country: string | null;
 phone: string | null;
 website: string | null;
 avatar: string | null;
 description: string | null;
 socialLinks: Record<string, string> | null;
 businessHours: Record<string, any> | null;
 role: string;
}

export default function ExporterSettingsPage() {
 const { refreshUser } = useAuth();
 const [profile, setProfile] = useState<ProfileData | null>(null);
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

 const [form, setForm] = useState({
 name: "",
 businessName: "",
 country: "",
 phone: "",
 website: "",
 description: "",
 linkedin: "",
 twitter: "",
 });

 useEffect(() => {
 authFetch<{ user: ProfileData }>("/api/user/profile")
 .then((res) => {
 const d = res.user;
 setProfile(d);
 setForm({
 name: d.name || "",
 businessName: d.businessName || "",
 country: d.country || "",
 phone: d.phone || "",
 website: d.website || "",
 description: d.description || "",
 linkedin: (d.socialLinks as any)?.linkedin || "",
 twitter: (d.socialLinks as any)?.twitter || "",
 });
 })
 .catch(() => { })
 .finally(() => setLoading(false));
 }, []);

 const handleSave = async () => {
 setSaving(true);
 setMsg(null);
 try {
 const payload = {
 ...form,
 socialLinks: {
 linkedin: form.linkedin,
 twitter: form.twitter,
 },
 };
 const res = await authFetch<{ user: ProfileData }>("/api/user/profile", {
 method: "PATCH",
 body: JSON.stringify(payload),
 });
 setProfile(res.user);
 setMsg({ type: "ok", text: "IDENTITY_UPDATE_SUCCESS" });
 refreshUser();
 } catch {
 setMsg({ type: "err", text: "IDENTITY_UPDATE_FAILURE" });
 } finally {
 setSaving(false);
 }
 };

 const fields: { label: string; key: keyof typeof form; type?: string; placeholder: string; icon: any }[] = [
 { label: "Identity Name", key: "name", placeholder: "NODE_ALPHA_ADMIN", icon: User },
 { label: "Registry Company", key: "businessName", placeholder: "SECURE_EXPORTS_INC", icon: Building },
 { label: "Origin Node", key: "country", placeholder: "GLOBAL_SYSTEM", icon: Globe },
 { label: "Signal Comms", key: "phone", type: "tel", placeholder: "+00 0000000000", icon: Phone },
 { label: "Network URL", key: "website", type: "url", placeholder: "HTTPS://NODE.NETWORK", icon: Link2 },
 { label: "LinkedIn_Link", key: "linkedin", type: "url", placeholder: "LINKEDIN_URI", icon: Linkedin },
 { label: "X_Telemetry", key: "twitter", type: "url", placeholder: "X_SIGNAL_URI", icon: Twitter },
 ];

 if (loading) return (
 <div className="h-screen flex flex-col items-center justify-center bg-card dark:bg-[#0a0a0a]">
 <div className="flex flex-col items-center gap-6 opacity-40">
 <div className="p-8 rounded-lg bg-black/5 dark:bg-white/10 border border-border dark:border-white/10 animate-pulse">
 <ShieldCheck className="w-12 h-12 text-foreground dark:text-white animate-spin-slow" />
 </div>
 <p className="text-[10px] font-black text-foreground dark:text-white uppercase tracking-[0.4em] ">Indexing Profile Data...</p>
 </div>
 </div>
 );

 return (
 <div className="h-full overflow-hidden flex flex-col bg-background selection:bg-primary selection:text-primary-foreground">
 {/* ── Header ── */}
 <header className="flex-shrink-0 px-10 py-10 border-b border-border dark:border-white/5 bg-background/40 backdrop-blur-3xl z-40">
 <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10">
 <div>
 <h1 className="text-5xl font-black tracking-tighter text-foreground dark:text-white uppercase ">Account Intel</h1>
 <p className="text-muted-foreground/40 mt-3 text-[10px] font-black uppercase tracking-[0.3em] ">
 Registry Configuration: IDENTITY_SOURCE_NODE // {profile?.id?.slice(0, 12).toUpperCase()}
 </p>
 </div>
 <div className="flex items-center gap-5">
 <div className="px-6 py-4 rounded-lg bg-black/5 dark:bg-white/10 border border-border dark:border-white/10 text-foreground dark:text-white text-[9px] font-black uppercase tracking-[0.2em] shadow-xl dark:shadow-2xl">
 Level: Verified_Exporter
 </div>
 </div>
 </div>
 </header>

 <div className="flex-1 overflow-y-auto p-10 space-y-16 custom-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20">
 <div className="max-w-[1200px] mx-auto space-y-10">
 <TradeModeToggle />

 {/* Identity Header Card */}
 <div className="bg-card/40 dark:bg-white/5 backdrop-blur-3xl border border-border dark:border-white/5 rounded-lg p-10 flex flex-col md:flex-row items-center gap-10 shadow-xl dark:shadow-2xl group">
 <div className="relative">
 <div className="w-32 h-32 rounded-lg bg-black/5 dark:bg-white/10 border border-border dark:border-white/10 flex items-center justify-center text-foreground dark:text-white font-black text-4xl shadow-2xl shadow-white/5 overflow-hidden group-hover:border-white/30 transition-all duration-700">
 {profile?.avatar ? (
 <img src={profile.avatar} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
 ) : (
 form.name ? form.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) : "ID"
 )}
 </div>
 <button className="absolute -bottom-3 -right-3 size-12 bg-primary text-primary-foreground p-3 rounded-lg shadow-xl dark:shadow-2xl active:scale-90 transition-transform flex items-center justify-center">
 <Camera className="w-5 h-5 font-black" />
 </button>
 </div>
 <div className="text-center md:text-left flex-1">
 <div className="text-3xl font-black text-foreground dark:text-white tracking-tighter uppercase group-hover:translate-x-1 transition-transform mb-2">
 {profile?.name || "NULL_IDENTITY"}
 </div>
 <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-muted-foreground/30 text-[10px] font-black uppercase tracking-widest group-hover:text-muted-foreground/60 transition-colors">
 <span className="flex items-center gap-2 underline underline-offset-4 decoration-white/10">{profile?.email}</span>
 <span className="size-1.5 rounded-full bg-black/10 dark:bg-white/15" />
 <span className="flex items-center gap-2"><Globe className="w-3 h-3" /> {profile?.country || "GLOBAL_NODE"}</span>
 </div>
 </div>
 <div className="px-8 py-4 rounded-lg bg-white/[0.02] border border-border dark:border-white/5 flex items-center gap-4 group-hover:border-border dark:border-white/20 transition-all">
 <ShieldCheck className="w-6 h-6 text-foreground dark:text-white opacity-20" />
 <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] ">SECURE_ID_LOCK: ON</div>
 </div>
 </div>

 {/* Configuration Grid */}
 <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
 {/* Primary Source Data */}
 <div className="xl:col-span-12 bg-card/40 dark:bg-white/5 backdrop-blur-3xl border border-border dark:border-white/5 rounded-lg p-12 shadow-xl dark:shadow-2xl space-y-12">
 <div className="flex items-center gap-4 border-b border-border dark:border-white/5 pb-8">
 <User className="w-5 h-5 text-foreground dark:text-white" />
 <h3 className="text-[10px] font-black text-foreground dark:text-white uppercase tracking-[0.3em] opacity-40">Identity_Telemetry_Buffer</h3>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
 {fields.map((f) => (
 <div key={f.key} className="group/field">
 <label className="block text-[9px] font-black text-muted-foreground/20 uppercase tracking-[0.3em] mb-4 ml-2 group-focus-within/field:text-foreground dark:text-white transition-colors">
 {f.label}
 </label>
 <div className="relative">
 <f.icon className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/20 group-focus-within/field:text-foreground dark:text-white transition-colors" />
 <input
 type={f.type || "text"}
 value={form[f.key]}
 onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
 placeholder={f.placeholder}
 className="w-full bg-white/[0.02] border border-border dark:border-white/5 focus:border-border dark:border-white/20 rounded-lg px-16 py-4.5 text-[11px] text-foreground dark:text-white font-black uppercase tracking-widest placeholder:text-muted-foreground/10 focus:outline-none transition-all shadow-inner "
 />
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Global Description */}
 <div className="xl:col-span-12 bg-card/40 dark:bg-white/5 backdrop-blur-3xl border border-border dark:border-white/5 rounded-lg p-12 shadow-xl dark:shadow-2xl space-y-12">
 <div className="flex items-center gap-4 border-b border-border dark:border-white/5 pb-8">
 <FileText className="w-5 h-5 text-foreground dark:text-white" />
 <h3 className="text-[10px] font-black text-foreground dark:text-white uppercase tracking-[0.3em] opacity-40">Market_Position_Manifesto</h3>
 </div>
 <div className="group/field">
 <textarea
 value={form.description}
 onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
 placeholder="Broadcast your node's operational history, production telemetry, and global scaling values..."
 rows={6}
 className="w-full bg-white/[0.02] border border-border dark:border-white/5 focus:border-border dark:border-white/20 rounded-lg px-10 py-8 text-[11px] text-foreground dark:text-white font-black uppercase tracking-widest placeholder:text-muted-foreground/10 focus:outline-none transition-all shadow-inner resize-none leading-relaxed"
 />
 </div>
 </div>
 </div>

 {/* Final Protocol Action */}
 <div className="flex flex-col items-center gap-10 py-10">
 <AnimatePresence>
 {msg && (
 <motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: 10 }}
 className={`text-[10px] font-black uppercase tracking-[0.3em] px-10 py-4 rounded-lg shadow-xl dark:shadow-2xl flex items-center gap-4 ${msg.type === "ok" ? "bg-black/10 dark:bg-white/15 border border-border dark:border-white/20 text-foreground dark:text-white shadow-white/5" : "bg-black/5 dark:bg-white/10 border border-border dark:border-white/5 text-muted-foreground/20"}`}
 >
 <div className="size-2 rounded-full bg-primary animate-pulse" />
 {msg.text}
 </motion.div>
 )}
 </AnimatePresence>

 <button
 onClick={handleSave}
 disabled={saving}
 className="group relative px-16 py-5 bg-primary hover:bg-primary/90 disabled:opacity-20 text-primary-foreground font-black text-[10px] uppercase tracking-[0.4em] rounded-lg shadow-2xl shadow-white/5 transition-all active:scale-95 overflow-hidden "
 >
 <span className="relative z-10 flex items-center gap-4">
 {saving ? "SYNCING..." : "COMMIT_IDENTITY_UPDATE"}
 <Zap className="w-4 h-4 group-hover:scale-125 transition-transform" />
 </span>
 <div className="absolute inset-0 bg-white/2 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
 </button>

 <div className="flex items-center gap-6 opacity-20">
 <div className="h-px w-20 bg-primary" />
 <p className="text-[8px] font-black text-foreground dark:text-white uppercase tracking-[0.5em] ">End Registry Session</p>
 <div className="h-px w-20 bg-primary" />
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
