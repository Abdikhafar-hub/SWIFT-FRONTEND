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
  Briefcase,
  Users,
  Clock,
  Building2,
  Globe,
  HeartHandshake,
  Award,
  BookOpen,
  UserCheck,
  ClipboardCheck,
  Sparkles,
  Zap,
  Handshake,
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

// Configurable Trust Statistics Data
const TRUST_STATS = [
  {
    icon: Briefcase,
    value: "10,000+",
    label: "Documents Processed",
  },
  {
    icon: Users,
    value: "5,000+",
    label: "Happy Clients",
  },
  {
    icon: ShieldCheck,
    value: "98%",
    label: "First-Time Approval Rate",
  },
  {
    icon: Clock,
    value: "10+ Years",
    label: "Industry Experience",
  },
];

// Configurable Core Services List
const CORE_SERVICES = [
  {
    icon: Building2,
    title: "Business Registration",
    description: "Company, Business Name, Partnerships & More",
  },
  {
    icon: FileText,
    title: "KRA Services",
    description: "PIN Registration, Tax Returns, Compliance",
  },
  {
    icon: Globe,
    title: "Visa & Immigration",
    description: "Visa Applications, Work Permits & Passports",
  },
  {
    icon: HeartHandshake,
    title: "NGO Registration",
    description: "NGO, CBO, Societies & Trusts Registration",
  },
  {
    icon: Award,
    title: "Licensing & Permits",
    description: "County & National Licenses, NEMA, NHIF",
  },
  {
    icon: BookOpen,
    title: "Civil Registry",
    description: "Birth, Marriage, Death Certificates & More",
  },
  {
    icon: UserCheck,
    title: "Document Legalisation",
    description: "Notarisation, Apostille & Embassy Attestation",
  },
  {
    icon: ClipboardCheck,
    title: "Compliance & Filings",
    description: "Statutory Returns, Renewals & Filings",
  },
];

// Configurable Value Propositions
const VALUE_PROPOSITIONS = [
  {
    icon: ShieldCheck,
    title: "Expert Documentation",
    subtitle: "100% Accuracy",
  },
  {
    icon: Sparkles,
    title: "Regulatory Compliance",
    subtitle: "Always Up-to-Date",
  },
  {
    icon: Zap,
    title: "Faster Processing",
    subtitle: "Save Time & Avoid Delays",
  },
  {
    icon: Handshake,
    title: "End-to-End Support",
    subtitle: "From Start to Approval",
  },
];

export default function LoginPage() {
  return (
    <div className="min-h-screen lg:h-screen w-full flex flex-col lg:flex-row bg-[#faf8f5] text-slate-900 overflow-y-auto lg:overflow-hidden select-none">
      {/* LEFT 50%: Product Showcase / Marketing Hero Panel */}
      <div className="hidden lg:flex lg:w-1/2 p-5 xl:p-8 2xl:p-10 flex-col justify-between relative bg-[#FAF8F5] overflow-hidden lg:h-full border-r border-amber-900/5">
        {/* Background Radial Glow */}
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-amber-200/25 rounded-full blur-3xl pointer-events-none -z-0" />
        
        {/* Background Dotted Matrix Pattern (Top Right) */}
        <div className="absolute top-6 right-8 opacity-40 pointer-events-none z-0">
          <svg width="120" height="120" fill="none" viewBox="0 0 120 120">
            <pattern id="dots" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="2" fill="#d97706" />
            </pattern>
            <rect width="120" height="120" fill="url(#dots)" />
          </svg>
        </div>

        {/* Decorative Background Contour Wave (Bottom Left) */}
        <div className="absolute bottom-16 left-0 opacity-15 pointer-events-none z-0">
          <svg width="400" height="200" fill="none" viewBox="0 0 400 200">
            <path
              d="M-50 150 C100 50, 200 220, 450 100"
              stroke="#d97706"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M-50 180 C120 80, 220 250, 450 130"
              stroke="#d97706"
              strokeWidth="1.5"
              fill="none"
            />
          </svg>
        </div>

        {/* Hero Visual Imagery Layer (Background Overlay Right Center) */}
        <div className="absolute top-0 right-0 h-full w-[55%] xl:w-[60%] pointer-events-none z-0 overflow-hidden">
          <img
            src="/images/hero-documents-kenya.png"
            alt="Kenyan Official Documents & Nairobi Context"
            className="w-full h-full object-cover object-right opacity-95 mix-blend-multiply"
          />
          {/* Smooth gradient fade overlay to ensure zero text overlap and 100% legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#FAF8F5] via-[#FAF8F5]/70 to-transparent w-3/4 h-full pointer-events-none" />
        </div>

        {/* Top Header & Logo */}
        <div className="relative z-10">
          <Link href="/" className="inline-block group">
            <img
              src="/swift-logo.png"
              alt="Swift Doc"
              className="h-12 xl:h-14 2xl:h-16 w-auto max-w-[280px] object-contain"
            />
          </Link>
          <div className="mt-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/60 border border-amber-300/50 text-amber-800 text-[10px] font-extrabold tracking-[0.2em] uppercase shadow-2xs backdrop-blur-xs">
              <Sparkles className="size-3 text-amber-600" />
              YOUR REGULATORY PARTNER
            </span>
          </div>
        </div>

        {/* Main Center Content Section */}
        <div className="relative z-10 my-auto py-2 xl:py-4 space-y-4 xl:space-y-6">
          {/* Main Headline */}
          <div className="max-w-xl">
            <h1 className="font-serif text-2xl xl:text-3xl 2xl:text-4xl font-bold leading-[1.18] text-slate-900 tracking-tight">
              We Prepare, Process
              <br />
              & Perfect Your
              <br />
              <span className="text-amber-600 font-serif italic">Official Documents.</span>
            </h1>
            <p className="mt-2.5 text-xs xl:text-sm text-slate-700 max-w-lg leading-relaxed font-medium">
              Swift Doc Documentation Services Ltd is a premier documentation consultancy based in Westlands, Nairobi. We specialise in preparing, lodging and expediting regulatory registrations, statutory compliances, licensing and official certifications.
            </p>
          </div>

          {/* Value Propositions Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 xl:gap-3 max-w-2xl">
            {VALUE_PROPOSITIONS.map((prop, idx) => {
              const IconComp = prop.icon;
              return (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded-xl bg-white/70 border border-slate-200/60 shadow-2xs backdrop-blur-xs"
                >
                  <div className="size-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                    <IconComp className="size-3.5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[10px] xl:text-[11px] font-bold text-slate-900 truncate leading-tight">
                      {prop.title}
                    </h4>
                    <p className="text-[9px] xl:text-[10px] text-slate-500 truncate mt-0.5">
                      {prop.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Section Label: Our Core Services */}
          <div className="flex items-center gap-3 pt-1">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-300 to-transparent"></div>
            <div className="flex items-center gap-1.5 text-amber-600 font-bold text-[10px] xl:text-xs tracking-widest uppercase">
              <span className="size-1 rounded-full bg-amber-500"></span>
              <span>Our Core Services</span>
              <span className="size-1 rounded-full bg-amber-500"></span>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-300 to-transparent"></div>
          </div>

          {/* Core Services Cards Grid (2 rows x 4 cols) */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5 xl:gap-3">
            {CORE_SERVICES.map((service, idx) => {
              const IconComp = service.icon;
              return (
                <div
                  key={idx}
                  className="p-2.5 xl:p-3 rounded-xl bg-white/90 border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-amber-400/50 transition-all flex flex-col justify-between group backdrop-blur-xs"
                >
                  <div className="size-7 xl:size-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shrink-0 mb-1.5 group-hover:scale-105 transition-transform">
                    <IconComp className="size-3.5 xl:size-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-[11px] xl:text-xs leading-tight group-hover:text-amber-700 transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-[9px] xl:text-[10px] text-slate-500 leading-snug mt-0.5 line-clamp-2">
                      {service.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Dark Navy Statistics Strip */}
        <div className="relative z-10 mt-2 xl:mt-4 rounded-2xl bg-[#0B1527] border border-slate-800 p-3 xl:p-4 shadow-xl text-white">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 divide-x-0 sm:divide-x divide-slate-800/80">
            {TRUST_STATS.map((stat, idx) => {
              const IconComp = stat.icon;
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-2.5 ${
                    idx !== 0 ? "sm:pl-3" : ""
                  }`}
                >
                  <div className="size-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                    <IconComp className="size-4" />
                  </div>
                  <div>
                    <span className="font-extrabold text-amber-400 text-sm xl:text-base tracking-tight block leading-tight">
                      {stat.value}
                    </span>
                    <span className="text-[9px] xl:text-[10px] text-slate-300 font-medium block mt-0.5 leading-none">
                      {stat.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT 50%: Login Form Container */}
      <div className="w-full lg:w-1/2 p-4 sm:p-8 lg:p-10 xl:p-12 flex flex-col justify-center items-center bg-[#f8f7f4] relative min-h-screen lg:h-full lg:overflow-y-auto xl:overflow-hidden">
        {/* Mobile Top Branding Header (Visible only on < lg viewports) */}
        <div className="lg:hidden mb-5 flex flex-col items-center justify-center shrink-0">
          <Link href="/" className="inline-flex items-center group">
            <img
              src="/swift-logo.png"
              alt="Swift Doc"
              className="h-12 w-auto max-w-[220px] object-contain"
            />
          </Link>
          <span className="mt-2 text-[10px] font-bold text-amber-600 tracking-[0.2em] uppercase">
            YOUR REGULATORY PARTNER
          </span>
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


