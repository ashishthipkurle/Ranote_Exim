"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
  Zap,
  Eye,
  EyeOff,
  AlertCircle,
  Users,
  KeyRound,
  Calendar,
  Globe,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import axios from "axios";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { countries } from "@/lib/countries";
import { cn } from "@/lib/utils";
import { FormError } from "@/components/form/FormError";
import { FcGoogle } from "react-icons/fc";
import { FaLinkedin } from "react-icons/fa";

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleOAuthSignIn = async (provider: "google" | "linkedin") => {
    try {
      setOauthLoading(provider);
      const res = await axios.get(`/api/auth/oauth?provider=${provider}`);
      const { providerUrl } = res.data;
      if (providerUrl) {
        window.location.href = providerUrl;
      } else {
        toast.error("Failed to get sign-in URL. Please try again.");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || `Failed to sign in with ${provider}`);
      setOauthLoading(null);
    }
  };

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "IMPORTER",
      businessName: "",
      country: "IN",
      phone: "",
      website: "",
    },
    mode: "onChange",
  });

  const [countryCode, setCountryCode] = useState("IN");

  const selectedCountry = useMemo(() =>
    countries.find(c => c.code === countryCode) || countries.find(c => c.code === "IN"),
    [countryCode]
  );

  const dialCode = selectedCountry?.dial || "91";
  const samplePhone = selectedCountry?.sample || "99004 78962";

  const handleCountryChange = (val: string) => {
    setCountryCode(val);
    form.setValue("country", val);
  };

  const [showOtpStep, setShowOtpStep] = useState(false);
  const [registerData, setRegisterData] = useState<RegisterInput | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  const onSubmit = async (data: RegisterInput) => {
    // Check if phone number is valid before showing OTP
    if (!data.phone) {
      toast.error("Please enter a valid phone number.");
      return;
    }
    
    // Send a real OTP to the user's email
    setIsLoading(true);
    try {
      const res = await axios.post("/api/auth/send-otp", {
        email: data.email,
        purpose: "REGISTER",
      });
      setRegisterData(data);
      setShowOtpStep(true);
      setMfaCode("");
      toast.success("Verification code sent to your email!");
      if (res.data.devCode) {
        console.log("[Dev] OTP Code:", res.data.devCode);
        setMfaCode(res.data.devCode);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to send verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtpAndRegister = async () => {
    if (!registerData) return;
    setIsLoading(true);

    try {
      // 1. Verify OTP
      const verifyRes = await axios.post("/api/auth/verify-otp", {
        email: registerData.email,
        code: mfaCode,
        purpose: "REGISTER",
      });

      if (!verifyRes.data.verified) {
        toast.error("Invalid verification code.");
        setIsLoading(false);
        return;
      }

      // 2. Proceed with registration
      const fullPhone = registerData.phone ? `+${dialCode} ${registerData.phone}` : "";

      const response = await axios.post("/api/auth/register", {
        ...registerData,
        phone: fullPhone,
      });

      if (response.data?.user) {
        // Log legal consent acceptance (Terms + Privacy Policy v1.2.0)
        void axios.post("/api/legal/consent", {
          userId: response.data.user.id,
          document: "TERMS",
          version: "1.2.0",
        }).catch(() => {});
        void axios.post("/api/legal/consent", {
          userId: response.data.user.id,
          document: "PRIVACY_POLICY",
          version: "1.2.0",
        }).catch(() => {});

        await refreshUser();
        toast.success("Registration successful! Welcome aboard!");
        const role = response.data.user.role;
        if (role === "USER" || role === "CONSUMER") {
          router.push("/products");
        } else {
          router.push(`/dashboard/${role.toLowerCase()}`);
        }
      } else {
        toast.success(response.data?.message ?? "Registration successful. Please log in.");
        router.push("/login");
      }
    } catch (error: any) {
      const resp = error.response;
      if (resp?.data?.details?.length) {
        resp.data.details.forEach((d: any) => toast.error(d.message));
      } else {
        toast.error(resp?.data?.error || "Registration failed");
      }
      setShowOtpStep(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh w-full overflow-x-hidden">
      <div className="flex min-h-dvh w-full flex-col lg:flex-row">
        {/* Left: cinematic panel */}
        <div className="relative hidden lg:flex lg:w-5/12 xl:w-5/12 overflow-hidden items-center justify-center border-r border-border bg-muted">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(var(--primary)/0.18)_0%,_transparent_65%)]" />
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative z-10 px-12 text-left max-w-xl">
            <div className="mb-8 inline-flex items-center gap-3 px-4 py-2 rounded-full bg-background/60 border border-border backdrop-blur">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary/40 animate-ping" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
              </span>
              <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground">
                Verified counterparties • Secure onboarding
              </span>
            </div>

            <h1 className="text-4xl xl:text-6xl font-black tracking-tight leading-none mb-6">
              Build your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                trade identity.
              </span>
            </h1>

            <p className="text-md text-muted-foreground max-w-md font-light leading-relaxed mb-10">
              Join exporters and importers worldwide with a secure, role-based account and enterprise-grade tooling.
            </p>
          </div>
        </div>

        {/* Right: form */}
        <div className="flex-1 flex flex-col items-center justify-start p-6 sm:p-12 lg:p-16 relative bg-background overflow-y-auto">
          <div className="absolute top-6 right-6">
            <ThemeToggle />
          </div>

          <div className="w-full max-w-2xl">
            <div className="flex items-center justify-between mb-8">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shadow-sm">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="text-xl font-black tracking-tight">
                  Ranote<span className="text-primary">Exim</span>
                </span>
              </Link>

              <div className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Secured
              </div>
            </div>

            <div className="flex p-1 bg-muted rounded-lg mb-8 w-fit border border-border">
              <Link href="/login" className="px-6 py-2 rounded-lg text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
                Login
              </Link>
              <Link href="/register" className="px-6 py-2 rounded-lg text-sm font-bold bg-background shadow-sm">
                Sign Up
              </Link>
            </div>

            <div className="space-y-2 mb-8">
              <h1 className="text-2xl font-extrabold tracking-tight">Create Account</h1>
              <p className="text-muted-foreground text-sm">Join the Ranote Exim global trade network.</p>
            </div>

            {showOtpStep ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h1 className="text-3xl font-extrabold tracking-tight">Email Verification</h1>
                  <p className="text-muted-foreground">Enter the 6-digit code sent to your email.</p>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Verification Code</label>
                  <Input
                    type="text"
                    placeholder="123456"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    className="h-14 text-center text-2xl font-black tracking-widest rounded-lg bg-slate-100/50 dark:bg-muted/30 border-border"
                  />
                </div>
                <Button 
                  onClick={verifyOtpAndRegister} 
                  disabled={isLoading || mfaCode.length < 6}
                  size="lg" 
                  className="h-14 w-full rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all"
                >
                  {isLoading ? <Loader2 className="animate-spin size-5" /> : "Verify & Complete Registration"}
                </Button>
                
                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    variant="outline"
                    disabled={isLoading}
                    onClick={() => registerData && onSubmit(registerData)}
                    className="w-full h-12 text-xs font-bold uppercase tracking-wider"
                  >
                    Resend Verification Code
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowOtpStep(false)}
                    className="w-full text-xs font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    Back to Registration
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-8 w-full">
                  <div className="flex flex-col gap-3 mb-6">
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={!!oauthLoading}
                      onClick={() => handleOAuthSignIn("google")}
                      className="h-[46px] font-medium text-foreground bg-background dark:bg-card border border-border hover:bg-muted transition-all rounded-lg shadow-sm text-sm"
                    >
                      {oauthLoading === "google" ? (
                        <Loader2 className="size-5 mr-3 animate-spin" />
                      ) : (
                        <FcGoogle className="size-5 mr-3" />
                      )}
                      Sign up with Google
                    </Button>

                    <Button
                      type="button"
                      disabled={!!oauthLoading}
                      onClick={() => handleOAuthSignIn("linkedin")}
                      className="h-[46px] font-medium text-white bg-[#0A66C2] hover:bg-[#0A66C2]/90 border-0 transition-all rounded-lg shadow-sm text-sm"
                    >
                      {oauthLoading === "linkedin" ? (
                        <Loader2 className="size-5 mr-3 animate-spin" />
                      ) : (
                        <FaLinkedin className="size-5 mr-3" />
                      )}
                      Sign up with LinkedIn
                    </Button>
                  </div>

                  <div className="flex items-center gap-3 mb-8 w-full">
                    <hr className="flex-1 border-border" />
                    <span className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider">Or email registration</span>
                    <hr className="flex-1 border-border" />
                  </div>
                </div>

                <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-x-6 gap-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name *</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors w-4 h-4" />
                            <Input {...field} placeholder="John Doe" className="pl-11 h-12 rounded-lg bg-slate-100/50 dark:bg-muted/30 border-border focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60 text-foreground" />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[10px] uppercase font-bold" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address *</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors w-4 h-4" />
                            <Input {...field} type="email" placeholder="you@company.com" className="pl-11 h-12 rounded-lg bg-slate-100/50 dark:bg-muted/30 border-border focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60 text-foreground" />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[10px] uppercase font-bold" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Password *</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors w-4 h-4" />
                            <Input {...field} type={showPassword ? "text" : "password"} placeholder="••••••••" className="pl-11 pr-11 h-12 rounded-lg bg-slate-100/50 dark:bg-muted/30 border-border focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60 text-foreground" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-[10px] uppercase font-bold" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Confirm Password *</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors w-4 h-4" />
                            <Input {...field} type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" className="pl-11 pr-11 h-12 rounded-lg bg-slate-100/50 dark:bg-muted/30 border-border focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60 text-foreground" />
                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-[10px] uppercase font-bold" />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-1.5">
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Phone Number *</FormLabel>
                    <div className="flex h-12 rounded-lg border border-border bg-slate-100/50 dark:bg-muted/30 focus-within:ring-2 focus-within:ring-primary/20 overflow-hidden transition-all">
                      <Select value={countryCode} onValueChange={handleCountryChange}>
                        <SelectTrigger className="w-[80px] h-full border-0 bg-transparent rounded-none focus:ring-0 px-3">
                          <SelectValue>
                            <img src={`https://flagcdn.com/w20/${selectedCountry?.code.toLowerCase()}.png`} width="20" alt={selectedCountry?.code} />
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {countries.map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                              <div className="flex items-center gap-2">
                                <img src={`https://flagcdn.com/w20/${c.code.toLowerCase()}.png`} width="20" alt={c.code} />
                                <span className="text-sm">{c.name}</span>
                                <span className="text-xs text-muted-foreground ml-auto">+{c.dial}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="w-[1px] h-6 bg-border my-auto" />
                      <div className="flex items-center px-3 text-sm font-bold text-muted-foreground">
                        +{dialCode}
                      </div>
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormControl>
                            <Input
                              type="tel"
                              {...field}
                              placeholder={samplePhone}
                              className="h-full border-0 bg-transparent rounded-none focus-visible:ring-0 px-2 text-sm font-medium"
                            />
                          </FormControl>
                        )}
                      />
                    </div>
                    <FormMessage className="text-[10px] uppercase font-bold" />
                  </div>

                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem className="hidden">
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Business Name</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors w-4 h-4" />
                            <Input {...field} placeholder="Acme Global Trade" className="pl-11 h-12 rounded-lg bg-slate-100/50 dark:bg-muted/30 border-border focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60 text-foreground" />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[10px] uppercase font-bold" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Required Legal Consent Checkbox */}
                <div className="flex items-start gap-3 py-2">
                  <input
                    type="checkbox"
                    id="legal-terms-privacy"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 size-4 rounded border-border bg-muted/50 text-primary focus:ring-primary/30 cursor-pointer"
                  />
                  <label htmlFor="legal-terms-privacy" className="text-xs text-muted-foreground leading-relaxed cursor-pointer select-none">
                    I agree to the{" "}
                    <Link
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary font-bold hover:underline"
                    >
                      Terms &amp; Conditions
                    </Link>{" "}
                    and have read the{" "}
                    <Link
                      href="/privacy-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary font-bold hover:underline"
                    >
                      Privacy Policy
                    </Link>
                    . <span className="text-destructive font-bold">*</span>
                  </label>
                </div>

                {/* Optional Marketing Checkbox */}
                <div className="flex items-start gap-3 pb-2">
                  <input
                    type="checkbox"
                    id="marketing-optin"
                    checked={marketingOptIn}
                    onChange={(e) => setMarketingOptIn(e.target.checked)}
                    className="mt-0.5 size-4 rounded border-border bg-muted/50 text-primary focus:ring-primary/30 cursor-pointer"
                  />
                  <label htmlFor="marketing-optin" className="text-xs text-muted-foreground leading-relaxed cursor-pointer select-none">
                    Keep me updated with global trade intelligence, market alerts, and platform announcements (optional).
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !form.formState.isValid || !agreedToTerms}
                  size="lg"
                  className="h-14 w-full rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin size-5" />
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                    </>
                  )}
                </Button>

                <p className="text-center text-sm text-muted-foreground pt-4">
                  Already have an account?{" "}
                  <Link href="/login" className="text-primary font-bold hover:underline">
                    Sign in
                  </Link>
                  .
                </p>
              </form>
            </Form>
            </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterForm() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin size-8 text-primary" /></div>}>
      <RegisterFormContent />
    </Suspense>
  );
}
