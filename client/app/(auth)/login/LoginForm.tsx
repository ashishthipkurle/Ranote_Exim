"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Lock,
  Mail,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  Zap,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import axios from "axios";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FcGoogle } from "react-icons/fc";
import { FaLinkedin } from "react-icons/fa";

export default function LoginForm() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [mfaData, setMfaData] = useState<{ factors: any[], user: any } | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange",
  });

  const [showOtpStep, setShowOtpStep] = useState(false);
  const [loginData, setLoginData] = useState<LoginInput | null>(null);

  const onSubmit = async (data: LoginInput) => {
    // Master admin bypass
    if (data.email.toLowerCase() === "exporter@gmail.com" || data.email.toLowerCase() === "admin@gmail.com") {
      setIsLoading(true);
      try {
        const response = await axios.post("/api/auth/login", data);
        await refreshUser();
        toast.success("Login successful!");
        const role = response.data.user?.role || "IMPORTER";
        if (role.toUpperCase() === "USER") {
          router.push("/products");
        } else if (role.toUpperCase() === "ADMIN") {
          router.push("/dashboard/exporter");
        } else {
          router.push(`/dashboard/${role.toLowerCase()}`);
        }
      } catch (error: any) {
        toast.error(error.response?.data?.error || "Login failed");
        setIsLoading(false);
      }
      return;
    }

    // Normal user logic - Send a real OTP
    setIsLoading(true);
    try {
      const res = await axios.post("/api/auth/send-otp", {
        email: data.email,
        purpose: "LOGIN",
      });
      setLoginData(data);
      setShowOtpStep(true);
      setMfaCode("");
      toast.success("Verification code sent to your email!");
      // In dev mode, show the code from response if SMTP isn't configured
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

  const verifyOtpAndLogin = async () => {
    if (!loginData) return;
    setIsLoading(true);

    try {
      // 1. Verify the OTP code against the database
      const verifyRes = await axios.post("/api/auth/verify-otp", {
        email: loginData.email,
        code: mfaCode,
        purpose: "LOGIN",
      });

      if (!verifyRes.data.verified) {
        toast.error("Invalid verification code.");
        setIsLoading(false);
        return;
      }

      // 2. Proceed with actual login
      const response = await axios.post("/api/auth/login", loginData);

      if (response.data.mfaRequired) {
        setMfaData(response.data);
        setIsLoading(false);
        setShowOtpStep(false);
        toast.info("Multi-Factor Authentication required");
        return;
      }

      await refreshUser();
      toast.success("Login successful!");

      const role = response.data.user.role;
      if (role.toUpperCase() === "USER") {
        router.push("/products");
      } else if (role.toUpperCase() === "ADMIN") {
        router.push("/dashboard/exporter");
      } else {
        router.push(`/dashboard/${role.toLowerCase()}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Verification failed");
      setIsLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await axios.post("/api/auth/mfa/verify", {
        factorId: mfaData!.factors[0].id,
        code: mfaCode,
      });

      await refreshUser();
      toast.success("MFA verified. Login complete.");
      router.push("/dashboard");

    } catch (error: unknown) {
      toast.error("MFA verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh w-full overflow-x-hidden">
      <div className="flex min-h-dvh w-full flex-col lg:flex-row">
        {/* Left: cinematic panel */}
        <div className="relative hidden lg:flex lg:w-7/12 xl:w-8/12 overflow-hidden items-center justify-center border-r border-border bg-muted">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(var(--primary)/0.18)_0%,_transparent_65%)]" />
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative z-10 px-16 xl:px-20 text-left max-w-3xl">
            <div className="mb-8 inline-flex items-center gap-3 px-4 py-2 rounded-full bg-background/60 border border-border backdrop-blur">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary/40 animate-ping" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
              </span>
              <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground">
                Network Live: 14.2ms latency
              </span>
            </div>

            <h1 className="text-5xl xl:text-7xl font-black tracking-tight leading-none mb-6">
              Trade with <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                institutional speed.
              </span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl font-light leading-relaxed mb-10">
              Secure authentication, verified counterparties, and real-time trade operations — all in one terminal.
            </p>

            <div className="flex gap-12 mt-14">
              <div>
                <div className="text-3xl font-bold">$4.2B+</div>
                <div className="text-sm text-muted-foreground uppercase tracking-widest font-semibold mt-1">
                  Volume 24H
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold">99.99%</div>
                <div className="text-sm text-muted-foreground uppercase tracking-widest font-semibold mt-1">
                  Uptime SLA
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold">256-bit</div>
                <div className="text-sm text-muted-foreground uppercase tracking-widest font-semibold mt-1">
                  Encryption
                </div>
              </div>
            </div>

            {/* <div className="absolute bottom-10 right-10 opacity-70">
              <div className="p-5 rounded-lg bg-background/60 backdrop-blur border border-border shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">FX / USD</div>
                    <div className="font-bold text-lg">Realtime Feed</div>
                  </div>
                </div>
                <div className="h-2 w-36 bg-primary/10 rounded-full relative overflow-hidden">
                  <div className="absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-primary to-primary/60 opacity-70" />
                </div>
              </div>
            </div> */}
          </div>
        </div>

        {/* Right: form */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 lg:p-16 relative bg-background">
          <div className="absolute top-6 right-6">
            <ThemeToggle />
          </div>

          <div className="w-full max-w-[440px]">
            {/* Brand */}
            <div className="flex items-center justify-between mb-10">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shadow-sm">
                  <Zap className="w-5 h-5" />
                </div>
                <span className="text-2xl font-black tracking-tight">
                  Ranote<span className="text-primary">Exim</span>
                </span>
              </Link>

              <div className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Secured
              </div>
            </div>

            {/* Toggle */}
            <div className="flex p-1 bg-muted rounded-lg mb-8 w-fit border border-border">
              <Link href="/login" className="px-6 py-2 rounded-lg text-sm font-bold bg-background shadow-sm">
                Login
              </Link>
              <Link href="/register" className="px-6 py-2 rounded-lg text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
                Sign Up
              </Link>
            </div>

            <Form {...form}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="space-y-6"
              >
                {showOtpStep ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h1 className="text-3xl font-extrabold tracking-tight">Email Verification</h1>
                      <p className="text-muted-foreground">Enter the 6-digit code sent to your email.</p>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">OTP Code</label>
                      <Input
                        type="text"
                        placeholder="123456"
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value)}
                        className="h-14 text-center text-2xl font-black tracking-widest rounded-lg bg-slate-100/50 dark:bg-muted/30 border-border"
                      />
                    </div>
                    <Button 
                      onClick={verifyOtpAndLogin} 
                      disabled={isLoading || mfaCode.length < 6}
                      size="lg" 
                      className="h-14 w-full rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all"
                    >
                      {isLoading ? <Loader2 className="animate-spin size-5" /> : "Verify & Login"}
                    </Button>
                    <div className="flex flex-col gap-2 pt-2">
                      <Button
                        variant="outline"
                        disabled={isLoading}
                        onClick={() => loginData && onSubmit(loginData)}
                        className="w-full h-12 text-xs font-bold uppercase tracking-wider"
                      >
                        Resend Verification Code
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setShowOtpStep(false)}
                        className="w-full text-xs font-bold uppercase tracking-wider text-muted-foreground"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : !mfaData ? (
                  <>
                    <div className="space-y-2">
                      <h1 className="text-3xl font-extrabold tracking-tight">Access Terminal</h1>
                      <p className="text-muted-foreground">
                        Welcome back. Enter your credentials to continue.
                      </p>
                    </div>

                    <div className="w-full">
                      <div className="flex flex-col gap-3 mb-5">
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
                          Sign in with Google
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
                          Sign in with LinkedIn
                        </Button>
                      </div>

                      <div className="flex items-center gap-3 mb-6 w-full">
                        <hr className="flex-1 border-border" />
                        <span className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider">Or continue with email</span>
                        <hr className="flex-1 border-border" />
                      </div>
                    </div>

                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-sm font-semibold text-muted-foreground ml-1">Email</FormLabel>
                            <FormControl>
                              <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors w-5 h-5" />
                                <Input {...field} type="email" placeholder="you@company.com" className="pl-12 h-12 bg-slate-100/50 dark:bg-muted/30 border-border rounded-lg focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/60 text-foreground" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                              <FormLabel className="text-sm font-semibold text-muted-foreground">Password</FormLabel>
                              <Link href="/forgot-password" className="text-xs font-bold text-primary hover:underline">
                                Lost key?
                              </Link>
                            </div>
                            <FormControl>
                              <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors w-5 h-5" />
                                <Input {...field} type={showPassword ? "text" : "password"} placeholder="••••••••" className="pl-12 pr-11 h-12 bg-slate-100/50 dark:bg-muted/30 border-border rounded-lg focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/60 text-foreground" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />



                      <Button type="submit" disabled={isLoading || !form.formState.isValid} size="lg" className="h-14 w-full rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 group">
                        {isLoading ? (
                          <Loader2 className="animate-spin size-5" />
                        ) : (
                          <>
                            Join the Network
                            <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                          </>
                        )}
                      </Button>
                    </form>
                  </>
                ) : (
                <>
                  <div className="space-y-2">
                    <h1 className="text-3xl font-extrabold tracking-tight">Security Check</h1>
                    <p className="text-muted-foreground">
                      Two-factor authentication is enabled for this account.
                    </p>
                  </div>

                  <form onSubmit={handleMfaSubmit} className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                        <Smartphone className="w-5 h-5 text-primary" />
                        <div className="text-sm">
                          <span className="font-bold">Authenticator App</span>
                          <p className="text-muted-foreground text-xs">Verified device</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-muted-foreground ml-1">
                          Verification Code
                        </label>
                        <input
                          className="w-full px-4 py-4 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-center text-2xl font-black tracking-[0.5em] placeholder:text-muted-foreground/30"
                          placeholder="000000"
                          type="text"
                          required
                          maxLength={6}
                          value={mfaCode}
                          onChange={(e) => setMfaCode(e.target.value)}
                        />
                      </div>
                    </div>

                    <Button type="submit" disabled={isLoading || mfaCode.length !== 6} size="lg" className="w-full">
                      {isLoading ? "Verifying..." : "Verify Identity"}
                    </Button>

                    <button
                      type="button"
                      className="w-full text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
                      onClick={() => setMfaData(null)}
                    >
                      Cancel and go back
                    </button>
                  </form>
                </>
              )}

              <p className="text-center text-sm text-muted-foreground">
                New here?{" "}
                <Link href="/register" className="text-primary font-semibold hover:underline">
                  Create an account
                </Link>
                .
              </p>
            </motion.div>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
