"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  ShieldCheck,
  Mail,
  Lock,
  AlertCircle,
  Eye,
  EyeOff,
  User,
  FileText,
  Smartphone,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { loginSchema, type LoginFormData } from "@/lib/validation/auth";
import { parseApiError } from "@/lib/utils/error";
import { notify } from "@/lib/notify";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const { login, isAuthenticated, role, isLoading } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Redirect if already authenticated
  React.useEffect(() => {
    if (!isLoading && isAuthenticated && role) {
      if (role === "ADMIN") {
        router.replace("/admin");
      } else {
        router.replace("/client");
      }
    }
  }, [isLoading, isAuthenticated, role, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@swiftdoc.co.ke",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    notify.loading("Authenticating credentials...", { id: "auth-login" });
    try {
      const authResult = await login(data);
      const userRole = authResult.role || authResult.user?.role;
      notify.success("Welcome back! Signed in successfully.", { id: "auth-login" });

      if (redirectParam) {
        const decoded = decodeURIComponent(redirectParam);
        if (userRole === "ADMIN" && decoded.startsWith("/client")) {
          router.push("/admin");
        } else if (userRole === "CLIENT" && decoded.startsWith("/admin")) {
          router.push("/client");
        } else {
          router.push(decoded);
        }
      } else {
        if (userRole === "ADMIN") {
          router.push("/admin");
        } else {
          router.push("/client");
        }
      }
    } catch (err: unknown) {
      const parsed = parseApiError(err);
      setServerError(parsed.message);
      notify.error(err, { id: "auth-login", title: "Login Failed" });
    }
  };

  return (
    <div className="w-full max-w-[480px] bg-white rounded-2xl sm:rounded-[28px] p-5 sm:p-10 shadow-xl shadow-slate-200/50 border border-slate-100 relative z-10">
      {/* Header */}
      <div className="mb-6">
        <span className="text-[11px] font-bold text-amber-600 tracking-[0.22em] uppercase block mb-1">
          WELCOME BACK
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Sign in to your account
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
          Enter your credentials to access your portal.
        </p>
      </div>

      {serverError && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800">
          <AlertCircle className="size-4 shrink-0 mt-0.5 text-red-600" />
          <div className="flex flex-col">
            <span className="font-bold">Authentication Failed</span>
            <span className="mt-0.5 leading-relaxed">{serverError}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* EMAIL FIELD */}
        <div>
          <label className="text-[11px] font-bold text-slate-700 tracking-wider mb-2 block uppercase">
            EMAIL ADDRESS
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="size-4" />
            </div>
            <input
              type="email"
              placeholder="admin@swiftdoc.co.ke"
              autoComplete="email"
              className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
                errors.email ? "border-red-400 bg-red-50/20" : "border-slate-200 bg-slate-50/40"
              } text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-sm font-medium transition-all outline-none`}
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-[11px] text-red-600 font-medium mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* PASSWORD FIELD */}
        <div>
          <label className="text-[11px] font-bold text-slate-700 tracking-wider mb-2 block uppercase">
            PASSWORD
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="size-4" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••••••••"
              autoComplete="current-password"
              className={`w-full pl-10 pr-11 py-3 rounded-xl border ${
                errors.password ? "border-red-400 bg-red-50/20" : "border-slate-200 bg-slate-50/40"
              } text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-sm font-medium transition-all outline-none`}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-[11px] text-red-600 font-medium mt-1">{errors.password.message}</p>
          )}
        </div>

        {/* REMEMBER ME / FORGOT ROW */}
        <div className="flex items-center justify-between text-xs font-medium py-1">
          <label className="flex items-center gap-2 cursor-pointer text-slate-600 hover:text-slate-900">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="size-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500/30 accent-amber-600 cursor-pointer"
            />
            <span>Remember me</span>
          </label>
          <Link
            href="/forgot-password"
            className="text-amber-600 hover:text-amber-700 font-semibold hover:underline transition-colors"
          >
            Forgot your password?
          </Link>
        </div>

        {/* PRIMARY SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-sm shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
        >
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <svg className="animate-spin size-4 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Signing in...
            </span>
          ) : (
            <>
              <span>Sign In to Dashboard</span>
              <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </form>

      {/* DIVIDER */}
      <div className="relative flex py-5 items-center justify-center">
        <div className="w-full border-t border-slate-200/80"></div>
        <span className="absolute bg-white px-3 text-[11px] font-bold text-slate-400 tracking-wider uppercase">
          OR
        </span>
      </div>

      {/* CREATE ACCOUNT BUTTON */}
      <Link
        href="/register"
        className="w-full py-3 px-6 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs group"
      >
        <User className="size-4 text-slate-600 group-hover:text-slate-900 transition-colors" />
        <span>Create a new account</span>
      </Link>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen lg:h-screen w-full flex flex-col lg:flex-row bg-[#faf8f5] text-slate-900 overflow-y-auto lg:overflow-hidden">
      {/* LEFT 50%: Product Showcase / Marketing Visual (Desktop Only: hidden lg:flex) */}
      <div className="hidden lg:flex lg:w-1/2 p-6 sm:p-8 lg:p-10 xl:p-12 flex-col justify-between relative bg-[#faf8f5] overflow-hidden lg:h-full">
        {/* Background Decorative Circular Glow */}
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl pointer-events-none -z-0" />
        
        {/* Background Dotted Matrix Pattern */}
        <div className="absolute top-8 right-12 opacity-30 pointer-events-none hidden sm:block">
          <svg width="140" height="140" fill="none" viewBox="0 0 140 140">
            <pattern id="dots" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="2" fill="#d97706" />
            </pattern>
            <rect width="140" height="140" fill="url(#dots)" />
          </svg>
        </div>

        {/* Top Header Logo */}
        <div className="relative z-10 mb-4 xl:mb-6">
          <Link href="/" className="inline-flex items-center group">
            <img
              src="/swift-logo.png"
              alt="Swift Doc"
              className="h-14 xl:h-16 w-auto max-w-[260px] object-contain"
            />
          </Link>
        </div>

        {/* Main Section: Headline + Features & Mockups Grid */}
        <div className="relative z-10 flex-1 flex flex-col justify-center my-auto">
          {/* Main Headline */}
          <div className="max-w-xl mb-6 xl:mb-8">
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl xl:text-[44px] font-semibold leading-[1.15] text-slate-900 tracking-tight">
              All your documents.
              <br />
              <span className="text-amber-600 font-serif">One secure portal.</span>
            </h1>
            <p className="mt-2.5 text-xs xl:text-sm text-slate-600 max-w-md leading-relaxed">
              Access your statutory applications, documents vault, and M-Pesa receipts — anytime, anywhere.
            </p>
          </div>

          {/* Grid Layout for Features + Mockups */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Features List (Left side of Showcase) */}
            <div className="lg:col-span-6 space-y-3 sm:space-y-4">
              {/* Feature 1 */}
              <div className="flex items-start gap-3 group">
                <div className="size-9 xl:size-10 shrink-0 rounded-xl bg-amber-500/5 border border-amber-500/25 flex items-center justify-center text-amber-600 shadow-2xs group-hover:bg-amber-500/10 transition-colors">
                  <FileText className="size-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-xs xl:text-sm">Statutory Applications</h3>
                  <p className="text-[10px] xl:text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Manage and track all your statutory applications in one place.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-start gap-3 group">
                <div className="size-9 xl:size-10 shrink-0 rounded-xl bg-amber-500/5 border border-amber-500/25 flex items-center justify-center text-amber-600 shadow-2xs group-hover:bg-amber-500/10 transition-colors">
                  <ShieldCheck className="size-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-xs xl:text-sm">Secure Documents Vault</h3>
                  <p className="text-[10px] xl:text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Store, organize and access your important documents securely.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-start gap-3 group">
                <div className="size-9 xl:size-10 shrink-0 rounded-xl bg-amber-500/5 border border-amber-500/25 flex items-center justify-center text-amber-600 shadow-2xs group-hover:bg-amber-500/10 transition-colors">
                  <Smartphone className="size-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-xs xl:text-sm">M-Pesa Receipts</h3>
                  <p className="text-[10px] xl:text-[11px] text-slate-500 mt-0.5 leading-snug">
                    View and download all your M-Pesa payment receipts.
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="flex items-start gap-3 group">
                <div className="size-9 xl:size-10 shrink-0 rounded-xl bg-amber-500/5 border border-amber-500/25 flex items-center justify-center text-amber-600 shadow-2xs group-hover:bg-amber-500/10 transition-colors">
                  <TrendingUp className="size-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-xs xl:text-sm">Real-time Access</h3>
                  <p className="text-[10px] xl:text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Access your data and updates anytime, anywhere.
                  </p>
                </div>
              </div>
            </div>

            {/* Mockups Container (Right side of Showcase) */}
            <div className="lg:col-span-6 relative mt-4 lg:mt-0 flex justify-center items-center">
              {/* Laptop Graphic */}
              <div className="relative w-full max-w-[360px] xl:max-w-[420px] drop-shadow-2xl">
                {/* Outer Laptop Bezel */}
                <div className="relative rounded-t-xl bg-slate-900 p-2 border border-slate-800 shadow-2xl">
                  {/* Camera */}
                  <div className="absolute top-1 left-1/2 -translate-x-1/2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                  </div>
                  
                  {/* Screen Content */}
                  <div className="overflow-hidden rounded-md bg-slate-50 border border-slate-200/60 aspect-[16/10] text-[8px] sm:text-[9px] select-none">
                    {/* App Navbar */}
                    <div className="bg-white border-b border-slate-200/80 px-2 py-1 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <img
                          src="/swift-logo.png"
                          alt="Swift Doc"
                          className="h-3.5 w-auto object-contain"
                        />
                      </div>
                      <div className="flex items-center gap-2 text-[7px] text-slate-400 font-medium">
                        <span className="text-amber-600 font-bold border-b border-amber-600 pb-0.5">Dashboard</span>
                        <span>Documents</span>
                        <span>Receipts</span>
                      </div>
                    </div>

                    {/* App Main Area */}
                    <div className="p-2 space-y-1.5 bg-[#faf9f6]/80">
                      <div className="font-bold text-slate-900 text-[9px]">Dashboard</div>
                      
                      {/* Stat Cards */}
                      <div className="grid grid-cols-3 gap-1.5">
                        <div className="bg-white p-1 rounded-lg border border-slate-200/70 shadow-2xs">
                          <span className="text-[7px] text-slate-400 font-medium block">Applications</span>
                          <span className="text-xs font-extrabold text-slate-900 block leading-tight mt-0.5">12</span>
                          <span className="text-[6px] text-slate-500">Active</span>
                        </div>
                        <div className="bg-white p-1 rounded-lg border border-slate-200/70 shadow-2xs">
                          <span className="text-[7px] text-slate-400 font-medium block">Documents</span>
                          <span className="text-xs font-extrabold text-slate-900 block leading-tight mt-0.5">48</span>
                          <span className="text-[6px] text-slate-500">Total</span>
                        </div>
                        <div className="bg-white p-1 rounded-lg border border-slate-200/70 shadow-2xs">
                          <span className="text-[7px] text-slate-400 font-medium block">Receipts</span>
                          <span className="text-xs font-extrabold text-slate-900 block leading-tight mt-0.5">24</span>
                          <span className="text-[6px] text-slate-500">This Month</span>
                        </div>
                      </div>

                      {/* Recent Applications Table */}
                      <div className="bg-white rounded-lg border border-slate-200/70 p-1.5 shadow-2xs">
                        <span className="text-[8px] font-bold text-slate-800 block mb-0.5">Recent Applications</span>
                        <div className="space-y-0.5 text-[7px]">
                          <div className="flex items-center justify-between py-0.5 border-b border-slate-100">
                            <span className="font-medium text-slate-700">Company Annual Return</span>
                            <span className="px-1 py-0.2 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[6px]">Submitted</span>
                          </div>
                          <div className="flex items-center justify-between py-0.5 border-b border-slate-100">
                            <span className="font-medium text-slate-700">Change of Directors</span>
                            <span className="px-1 py-0.2 rounded-full bg-amber-50 text-amber-700 font-semibold text-[6px]">In Review</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Laptop Keyboard Base */}
                <div className="relative h-2 bg-gradient-to-b from-slate-700 to-slate-900 rounded-b-lg px-8 flex justify-center border-t border-slate-600">
                  <div className="w-12 h-0.5 bg-slate-600 rounded-b-md"></div>
                </div>
              </div>

              {/* Smartphone Graphic (Overlapping Laptop) */}
              <div className="absolute -bottom-3 left-0 sm:-left-2 w-32 sm:w-36 bg-slate-900 p-1 rounded-[20px] border border-slate-700 shadow-2xl z-20 transform -rotate-2">
                <div className="relative overflow-hidden rounded-[16px] bg-white border border-slate-200 aspect-[9/18] text-[7px] select-none">
                  {/* Speaker Notch */}
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-2 bg-slate-900 rounded-full z-30 flex items-center justify-center">
                    <div className="w-1.5 h-0.5 rounded-full bg-slate-700"></div>
                  </div>

                  {/* Phone Screen Content */}
                  <div className="pt-4 p-1.5 space-y-1 bg-[#fdfbf7]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-[8px]">M-Pesa Receipts</span>
                    </div>

                    {/* Total Paid Card */}
                    <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-1.5 rounded-md shadow-xs">
                      <span className="text-[6px] font-medium text-amber-100 block">Total Paid</span>
                      <span className="text-[9px] font-extrabold block">KES 12,450</span>
                    </div>

                    {/* Receipts List */}
                    <div className="space-y-0.5 pt-0.5">
                      <div className="bg-white p-0.5 px-1 rounded border border-slate-100 shadow-2xs">
                        <div className="flex items-center justify-between font-bold text-slate-800 text-[6px]">
                          <span>Payment to KRA</span>
                          <span className="text-amber-600">KES 5,000</span>
                        </div>
                      </div>

                      <div className="bg-white p-0.5 px-1 rounded border border-slate-100 shadow-2xs">
                        <div className="flex items-center justify-between font-bold text-slate-800 text-[6px]">
                          <span>Payment to NSSF</span>
                          <span className="text-amber-600">KES 3,200</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Left Security Badge + Decorative Wave */}
        <div className="relative z-10 mt-4 xl:mt-6 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/50 border border-slate-300/40 text-[11px] text-slate-600 font-medium backdrop-blur-xs">
            <ShieldCheck className="size-3.5 text-amber-600" />
            <span>Protected by 256-bit SSL & Data Protection Act 2019</span>
          </div>
        </div>

        {/* Flowing Golden Wave SVG near bottom */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none opacity-20">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-12 text-amber-500 fill-none stroke-current stroke-1">
            <path d="M0,0 C150,90 350,-40 500,60 C650,160 900,10 1200,40 L1200,120 L0,120 Z" />
          </svg>
        </div>
      </div>

      {/* RIGHT 50%: Login Form Container */}
      <div className="w-full lg:w-1/2 p-4 sm:p-8 lg:p-10 xl:p-12 flex flex-col justify-center items-center bg-[#f8f7f4] relative min-h-screen lg:h-full lg:overflow-y-auto xl:overflow-hidden">
        {/* Mobile Top Branding Header (Visible only on < lg viewports) */}
        <div className="lg:hidden mb-5 flex items-center justify-center shrink-0">
          <Link href="/" className="inline-flex items-center group">
            <img
              src="/swift-logo.png"
              alt="Swift Doc"
              className="h-12 w-auto max-w-[220px] object-contain"
            />
          </Link>
        </div>

        <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading form...</div>}>
          <LoginForm />
        </Suspense>

        {/* Bottom Right Security Message */}
        <div className="mt-4 xl:mt-6 flex items-center justify-center gap-2 text-center text-[11px] text-slate-500 font-medium">
          <ShieldCheck className="size-3.5 text-slate-500" />
          <span>Protected by 256-bit SSL & Data Protection Act 2019</span>
        </div>
      </div>
    </div>
  );
}

