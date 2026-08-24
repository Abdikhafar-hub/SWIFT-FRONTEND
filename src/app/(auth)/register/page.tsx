"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  ShieldCheck,
  Mail,
  Lock,
  User,
  Phone,
  Building,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  FileText,
  MapPin,
  Sparkles,
  RefreshCw,
  Clock,
  Smartphone,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { authApi } from "@/lib/api/auth";
import { profileApi } from "@/lib/api/profile";
import {
  accountIdentitySchema,
  otpVerificationSchema,
  clientProfileStepSchema,
  type AccountIdentityFormData,
  type OtpVerificationFormData,
  type ClientProfileStepFormData,
} from "@/lib/validation/auth";
import { parseApiError } from "@/lib/utils/error";
import { notify } from "@/lib/notify";

type Step = 1 | 2 | 3 | 4;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerAuth, user, client, refreshSession } = useAuth();

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [serverError, setServerError] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string>("");
  const [assignedClientNumber, setAssignedClientNumber] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP Timer State
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [otpNotice, setOtpNotice] = useState<string | null>(null);

  // Step 1: Account Identity Form
  const step1Form = useForm<AccountIdentityFormData>({
    resolver: zodResolver(accountIdentitySchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Step 2: OTP Verification Form
  const step2Form = useForm<OtpVerificationFormData>({
    resolver: zodResolver(otpVerificationSchema),
    defaultValues: {
      code: "",
    },
  });

  // Step 3: Client Profile Form
  const step3Form = useForm<ClientProfileStepFormData>({
    resolver: zodResolver(clientProfileStepSchema),
    defaultValues: {
      clientType: "INDIVIDUAL",
      nationalId: "",
      passportNumber: "",
      businessName: "",
      registrationNumber: "",
      businessEmail: "",
      businessPhone: "",
      kraPin: "",
      address: "",
      county: "Nairobi",
      city: "Nairobi",
      preferredChannel: "EMAIL",
    },
  });

  const selectedClientType = step3Form.watch("clientType");

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Handle Step 1 Submission: Account Identity
  const onStep1Submit = async (data: AccountIdentityFormData) => {
    setServerError(null);
    notify.loading("Creating account...", { id: "auth-register" });
    try {
      const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`;
      const res = await registerAuth({
        fullName,
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim(),
        password: data.password,
        clientType: "INDIVIDUAL",
      });

      setRegisteredEmail(data.email);
      if (res.client?.clientNumber) {
        setAssignedClientNumber(res.client.clientNumber);
      }
      setResendCooldown(60);
      notify.success("Account created! Verification code sent to your email.", { id: "auth-register" });
      setCurrentStep(2);
    } catch (err: unknown) {
      const parsed = parseApiError(err);
      setServerError(parsed.message);
      notify.error(err, { id: "auth-register", title: "Registration Failed" });
    }
  };

  // Handle Step 2 Submission: Verification OTP
  const onStep2Submit = async (data: OtpVerificationFormData) => {
    setServerError(null);
    notify.loading("Verifying code...", { id: "auth-verify" });
    try {
      await authApi.verifyOtp(data.code);
      await refreshSession();
      setOtpNotice("Email verified successfully!");
      notify.success("Email verified successfully!", { id: "auth-verify" });
      setTimeout(() => {
        setOtpNotice(null);
        setCurrentStep(3);
      }, 500);
    } catch (err: unknown) {
      const parsed = parseApiError(err);
      setServerError(parsed.message);
      notify.error(err, { id: "auth-verify", title: "Verification Failed" });
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setServerError(null);
    notify.loading("Sending new verification code...", { id: "auth-resend" });
    try {
      const res = await authApi.resendOtp();
      const msg = res.message || "A new 6-digit code has been sent.";
      setOtpNotice(msg);
      notify.success(msg, { id: "auth-resend" });
      setResendCooldown(60);
    } catch (err: unknown) {
      const parsed = parseApiError(err);
      setServerError(parsed.message);
      notify.error(err, { id: "auth-resend", title: "Resend Failed" });
    } finally {
      setIsResending(false);
    }
  };

  // Handle Step 3 Submission: Client Profile Configuration
  const onStep3Submit = async (data: ClientProfileStepFormData) => {
    setServerError(null);
    notify.loading("Saving client profile...", { id: "auth-profile" });
    try {
      await profileApi.updateProfile({
        clientType: data.clientType,
        businessName: data.clientType !== "INDIVIDUAL" ? data.businessName : undefined,
        nationalId: data.clientType === "INDIVIDUAL" ? data.nationalId : undefined,
        passportNumber: data.clientType === "INDIVIDUAL" ? data.passportNumber : data.registrationNumber,
        kraPin: data.kraPin || undefined,
        address: data.address || undefined,
        county: data.county || undefined,
        city: data.city || undefined,
        preferredCommunicationChannel: data.preferredChannel,
      });

      await refreshSession();
      notify.success("Client profile configured successfully!", { id: "auth-profile" });
      setCurrentStep(4);
    } catch (err: unknown) {
      const parsed = parseApiError(err);
      setServerError(parsed.message);
      notify.error(err, { id: "auth-profile", title: "Profile Setup Failed" });
    }
  };

  // Step Indicators
  const stepsList = [
    { number: 1, label: "Account Identity" },
    { number: 2, label: "Verification" },
    { number: 3, label: "Client Profile" },
    { number: 4, label: "Complete" },
  ];

  return (
    <div className="min-h-screen lg:h-screen w-full flex flex-col lg:flex-row bg-[#faf8f5] text-slate-900 overflow-y-auto lg:overflow-hidden">
      {/* =========================================================================
          LEFT 50%: Product Showcase / Marketing Visual (Desktop Only: hidden lg:flex)
         ========================================================================= */}
      <div className="hidden lg:flex lg:w-1/2 p-6 sm:p-8 lg:p-10 xl:p-12 flex-col justify-between relative bg-[#faf8f5] overflow-hidden lg:h-full">
        {/* Background Decorative Circular Glow */}
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl pointer-events-none -z-0" />
        
        {/* Background Dotted Matrix Pattern */}
        <div className="absolute top-8 right-12 opacity-30 pointer-events-none hidden sm:block">
          <svg width="140" height="140" fill="none" viewBox="0 0 140 140">
            <pattern id="dots-reg" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="2" fill="#d97706" />
            </pattern>
            <rect width="140" height="140" fill="url(#dots-reg)" />
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
          <div className="max-w-xl mb-5 xl:mb-7">
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl xl:text-[42px] font-semibold leading-[1.15] text-slate-900 tracking-tight">
              Create your account.
              <br />
              <span className="text-amber-600 font-serif">Join Swift Doc today.</span>
            </h1>
            <p className="mt-2 text-xs xl:text-sm text-slate-600 max-w-md leading-relaxed">
              Get secure access to your statutory applications, documents vault, and M-Pesa receipts — all in one trusted portal.
            </p>
          </div>

          {/* Grid Layout for Features + Mockups */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Features List (Left side of Showcase) */}
            <div className="lg:col-span-6 space-y-3 sm:space-y-3.5">
              {/* Feature 1 */}
              <div className="flex items-start gap-3 group">
                <div className="size-9 xl:size-10 shrink-0 rounded-xl bg-amber-500/5 border border-amber-500/25 flex items-center justify-center text-amber-600 shadow-2xs group-hover:bg-amber-500/10 transition-colors">
                  <ShieldCheck className="size-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-xs xl:text-sm">Secure &amp; Compliant</h3>
                  <p className="text-[10px] xl:text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Your data is protected with enterprise grade security and encryption.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-start gap-3 group">
                <div className="size-9 xl:size-10 shrink-0 rounded-xl bg-amber-500/5 border border-amber-500/25 flex items-center justify-center text-amber-600 shadow-2xs group-hover:bg-amber-500/10 transition-colors">
                  <FileText className="size-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-xs xl:text-sm">All Your Documents</h3>
                  <p className="text-[10px] xl:text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Manage, store and access your statutory documents in one place.
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
                    View and download all your M-Pesa payment receipts instantly.
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="flex items-start gap-3 group">
                <div className="size-9 xl:size-10 shrink-0 rounded-xl bg-amber-500/5 border border-amber-500/25 flex items-center justify-center text-amber-600 shadow-2xs group-hover:bg-amber-500/10 transition-colors">
                  <Clock className="size-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-xs xl:text-sm">Real-time Access</h3>
                  <p className="text-[10px] xl:text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Access your information and updates anytime, anywhere.
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
            <span>Protected by 256-bit SSL &amp; Data Protection Act 2019</span>
          </div>
        </div>

        {/* Flowing Golden Wave SVG near bottom */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none opacity-20">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-12 text-amber-500 fill-none stroke-current stroke-1">
            <path d="M0,0 C150,90 350,-40 500,60 C650,160 900,10 1200,40 L1200,120 L0,120 Z" />
          </svg>
        </div>
      </div>

      {/* =========================================================================
          RIGHT 50%: Registration Form Card Container
         ========================================================================= */}
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
        <div className="w-full max-w-[500px] xl:max-w-[540px] bg-white rounded-2xl sm:rounded-[28px] p-5 sm:p-8 xl:p-9 shadow-xl shadow-slate-200/50 border border-slate-100 relative z-10">
          {/* Stepper Progress Bar */}
          <div className="mb-5 xl:mb-7 relative z-10">
            <div className="relative flex items-center justify-between">
              {/* Line connector */}
              <div className="absolute left-6 right-6 top-3.5 -translate-y-1/2 h-[2px] bg-slate-200 -z-0" />
              <div
                className="absolute left-6 top-3.5 -translate-y-1/2 h-[2px] bg-amber-500 transition-all duration-500 -z-0"
                style={{ width: `calc(${((currentStep - 1) / 3) * 100}% * 0.85)` }}
              />

              {stepsList.map((st) => {
                const isCompleted = currentStep > st.number;
                const isCurrent = currentStep === st.number;
                return (
                  <div key={st.number} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`size-7 sm:size-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isCurrent
                          ? "bg-amber-600 text-white ring-4 ring-amber-500/20 shadow-md shadow-amber-500/30"
                          : isCompleted
                          ? "bg-amber-500 text-white"
                          : "bg-slate-100 border border-slate-200 text-slate-400"
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="size-3.5" /> : st.number}
                    </div>
                    <span
                      className={`mt-1.5 text-[10px] xl:text-[11px] tracking-tight text-center ${
                        isCurrent ? "text-slate-900 font-bold" : "text-slate-400 font-medium"
                      }`}
                    >
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Header */}
          <div className="mb-4 xl:mb-5">
            <h2 className="font-serif text-xl sm:text-2xl xl:text-3xl font-bold text-slate-900 tracking-tight">
              {currentStep === 1 && "Create Your Account"}
              {currentStep === 2 && "Verify Email Address"}
              {currentStep === 3 && "Client Profile Setup"}
              {currentStep === 4 && "Registration Complete"}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {currentStep === 1 && "Enter your personal credentials to create your Swift Doc statutory account."}
              {currentStep === 2 && "Secure your account by entering the 6-digit code sent to your email."}
              {currentStep === 3 && "Configure your statutory entity details to accelerate Kenyan business and tax filings."}
              {currentStep === 4 && "Your Swift Doc account and statutory client dossier are ready for official filings."}
            </p>
          </div>

          {serverError && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              <AlertCircle className="size-4 shrink-0 mt-0.5 text-red-600" />
              <div className="flex flex-col">
                <span className="font-bold">Attention</span>
                <span className="mt-0.5 leading-relaxed">{serverError}</span>
              </div>
            </div>
          )}

          {otpNotice && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
              <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-600" />
              <div className="flex flex-col">
                <span className="font-bold">Status Update</span>
                <span className="mt-0.5 leading-relaxed">{otpNotice}</span>
              </div>
            </div>
          )}

          {/* =========================================================================
              STEP 1: Account Identity Form
             ========================================================================= */}
          {currentStep === 1 && (
            <form onSubmit={step1Form.handleSubmit(onStep1Submit)} className="space-y-3.5">
              {/* Row 1: First Name & Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-700 tracking-wider mb-1.5 block uppercase">
                    FIRST NAME <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="size-3.5" />
                    </div>
                    <input
                      type="text"
                      placeholder="John"
                      autoComplete="given-name"
                      className={`w-full pl-9 pr-3 py-2.5 rounded-xl border ${
                        step1Form.formState.errors.firstName ? "border-red-400 bg-red-50/20" : "border-slate-200 bg-slate-50/40"
                      } text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-xs sm:text-sm font-medium transition-all outline-none`}
                      {...step1Form.register("firstName")}
                    />
                  </div>
                  {step1Form.formState.errors.firstName && (
                    <p className="text-[10px] text-red-600 font-medium mt-0.5">{step1Form.formState.errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-700 tracking-wider mb-1.5 block uppercase">
                    LAST NAME <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="size-3.5" />
                    </div>
                    <input
                      type="text"
                      placeholder="Doe"
                      autoComplete="family-name"
                      className={`w-full pl-9 pr-3 py-2.5 rounded-xl border ${
                        step1Form.formState.errors.lastName ? "border-red-400 bg-red-50/20" : "border-slate-200 bg-slate-50/40"
                      } text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-xs sm:text-sm font-medium transition-all outline-none`}
                      {...step1Form.register("lastName")}
                    />
                  </div>
                  {step1Form.formState.errors.lastName && (
                    <p className="text-[10px] text-red-600 font-medium mt-0.5">{step1Form.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>

              {/* Row 2: Email & Phone Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-700 tracking-wider mb-1.5 block uppercase">
                    EMAIL ADDRESS <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="size-3.5" />
                    </div>
                    <input
                      type="email"
                      placeholder="user@example.co.ke"
                      autoComplete="email"
                      className={`w-full pl-9 pr-3 py-2.5 rounded-xl border ${
                        step1Form.formState.errors.email ? "border-red-400 bg-red-50/20" : "border-slate-200 bg-slate-50/40"
                      } text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-xs sm:text-sm font-medium transition-all outline-none`}
                      {...step1Form.register("email")}
                    />
                  </div>
                  {step1Form.formState.errors.email && (
                    <p className="text-[10px] text-red-600 font-medium mt-0.5">{step1Form.formState.errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-700 tracking-wider mb-1.5 block uppercase">
                    KENYAN PHONE NUMBER <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone className="size-3.5" />
                    </div>
                    <input
                      type="tel"
                      placeholder="0712345678"
                      autoComplete="tel"
                      className={`w-full pl-9 pr-3 py-2.5 rounded-xl border ${
                        step1Form.formState.errors.phone ? "border-red-400 bg-red-50/20" : "border-slate-200 bg-slate-50/40"
                      } text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-xs sm:text-sm font-medium transition-all outline-none`}
                      {...step1Form.register("phone")}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">e.g. 0712345678</p>
                  {step1Form.formState.errors.phone && (
                    <p className="text-[10px] text-red-600 font-medium mt-0.5">{step1Form.formState.errors.phone.message}</p>
                  )}
                </div>
              </div>

              {/* Row 3: Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-700 tracking-wider mb-1.5 block uppercase">
                    PASSWORD <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="size-3.5" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••••••••"
                      autoComplete="new-password"
                      className={`w-full pl-9 pr-9 py-2.5 rounded-xl border ${
                        step1Form.formState.errors.password ? "border-red-400 bg-red-50/20" : "border-slate-200 bg-slate-50/40"
                      } text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-xs sm:text-sm font-medium transition-all outline-none`}
                      {...step1Form.register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Min 8 chars, 1 uppercase &amp; 1 number</p>
                  {step1Form.formState.errors.password && (
                    <p className="text-[10px] text-red-600 font-medium mt-0.5">{step1Form.formState.errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-700 tracking-wider mb-1.5 block uppercase">
                    CONFIRM PASSWORD <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="size-3.5" />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••••••••••"
                      autoComplete="new-password"
                      className={`w-full pl-9 pr-9 py-2.5 rounded-xl border ${
                        step1Form.formState.errors.confirmPassword ? "border-red-400 bg-red-50/20" : "border-slate-200 bg-slate-50/40"
                      } text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-xs sm:text-sm font-medium transition-all outline-none`}
                      {...step1Form.register("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </button>
                  </div>
                  {step1Form.formState.errors.confirmPassword && (
                    <p className="text-[10px] text-red-600 font-medium mt-0.5">{step1Form.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              {/* Primary Submit Button */}
              <button
                type="submit"
                disabled={step1Form.formState.isSubmitting}
                className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-sm shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed mt-3"
              >
                {step1Form.formState.isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin size-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </span>
                ) : (
                  <>
                    <span>Create Account &amp; Continue</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>

              {/* Divider & Login Link */}
              <div className="mt-4 border-t border-slate-200/80 pt-3.5 text-center text-xs text-slate-500 font-medium">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-bold text-amber-600 hover:text-amber-700 transition-colors hover:underline"
                >
                  Sign In
                </Link>
              </div>
            </form>
          )}

          {/* =========================================================================
              STEP 2: OTP Verification Form
             ========================================================================= */}
          {currentStep === 2 && (
            <form onSubmit={step2Form.handleSubmit(onStep2Submit)} className="space-y-5">
              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 text-center">
                <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 mb-2.5">
                  <Mail className="size-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">Verify Your Email Address</h3>
                <p className="mt-1 text-xs text-slate-600">
                  We sent a 6-digit verification code to{" "}
                  <strong className="text-slate-900">{registeredEmail || user?.email || "your email"}</strong>.
                </p>
                <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-0.5 text-[10px] text-slate-600 border border-slate-200 shadow-2xs">
                  <KeyRound className="size-3 text-amber-600" />
                  <span>Enter code from your email inbox</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-700 tracking-wider mb-1.5 block uppercase text-center">
                  6-DIGIT VERIFICATION CODE
                </label>
                <input
                  type="text"
                  placeholder="123456"
                  maxLength={8}
                  className="w-full text-center text-lg tracking-[0.3em] font-mono py-2.5 rounded-xl border border-slate-200 bg-slate-50/40 text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-bold transition-all outline-none"
                  autoFocus
                  {...step2Form.register("code")}
                />
                {step2Form.formState.errors.code && (
                  <p className="text-[10px] text-red-600 font-medium mt-1 text-center">{step2Form.formState.errors.code.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-slate-500">Didn&apos;t receive the code?</span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || isResending}
                  className="inline-flex items-center gap-1.5 font-semibold text-amber-600 hover:underline disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`size-3.5 ${isResending ? "animate-spin" : ""}`} />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                </button>
              </div>

              <button
                type="submit"
                disabled={step2Form.formState.isSubmitting}
                className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-sm shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {step2Form.formState.isSubmitting ? "Verifying..." : "Verify Email & Continue →"}
              </button>
            </form>
          )}

          {/* =========================================================================
              STEP 3: Statutory Profile & Business Setup
             ========================================================================= */}
          {currentStep === 3 && (
            <form onSubmit={step3Form.handleSubmit(onStep3Submit)} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  SELECT CLIENT ENTITY TYPE <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => step3Form.setValue("clientType", "INDIVIDUAL")}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedClientType === "INDIVIDUAL"
                        ? "border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <User className={`size-3.5 ${selectedClientType === "INDIVIDUAL" ? "text-amber-600" : "text-slate-400"}`} />
                      <span className="font-bold text-xs text-slate-900">Individual / Sole Proprietor</span>
                    </div>
                    <span className="mt-0.5 text-[10px] text-slate-500 leading-snug">
                      Personal applications, individual KRA PIN, and personal certificates.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => step3Form.setValue("clientType", "BUSINESS")}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedClientType === "BUSINESS" || selectedClientType === "ORGANIZATION"
                        ? "border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building className={`size-3.5 ${selectedClientType !== "INDIVIDUAL" ? "text-amber-600" : "text-slate-400"}`} />
                      <span className="font-bold text-xs text-slate-900">Company / Organization</span>
                    </div>
                    <span className="mt-0.5 text-[10px] text-slate-500 leading-snug">
                      Kenyan registered companies, BRS filings, CR12s, SMEs, and NGOs.
                    </span>
                  </button>
                </div>
              </div>

              {/* Dynamic Entity Form */}
              {selectedClientType !== "INDIVIDUAL" ? (
                <div className="space-y-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200">
                    <Building className="size-3.5 text-amber-600" />
                    <span className="text-xs font-bold text-slate-900">Company Statutory Credentials</span>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-700 tracking-wider mb-1 block uppercase">
                      LEGAL BUSINESS NAME <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Apex Technologies Limited"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-medium focus:border-amber-500 outline-none"
                      {...step3Form.register("businessName")}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 tracking-wider mb-1 block uppercase">COMPANY KRA PIN</label>
                      <input
                        type="text"
                        placeholder="P051234567Z"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-medium uppercase focus:border-amber-500 outline-none"
                        {...step3Form.register("kraPin")}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 tracking-wider mb-1 block uppercase">REGISTRATION NO.</label>
                      <input
                        type="text"
                        placeholder="CPR/2026/12345"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-medium focus:border-amber-500 outline-none"
                        {...step3Form.register("registrationNumber")}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200">
                    <User className="size-3.5 text-amber-600" />
                    <span className="text-xs font-bold text-slate-900">Individual Credentials</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 tracking-wider mb-1 block uppercase">NATIONAL ID NUMBER</label>
                      <input
                        type="text"
                        placeholder="12345678"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-medium focus:border-amber-500 outline-none"
                        {...step3Form.register("nationalId")}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 tracking-wider mb-1 block uppercase">PERSONAL KRA PIN</label>
                      <input
                        type="text"
                        placeholder="A012345678Z"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-medium uppercase focus:border-amber-500 outline-none"
                        {...step3Form.register("kraPin")}
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={step3Form.formState.isSubmitting}
                className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-sm shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {step3Form.formState.isSubmitting ? "Saving profile..." : "Save Profile & Complete Registration →"}
              </button>
            </form>
          )}

          {/* =========================================================================
              STEP 4: Registration Complete & Launchpad
             ========================================================================= */}
          {currentStep === 4 && (
            <div className="space-y-4 text-center py-2">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 ring-8 ring-emerald-500/5">
                <CheckCircle2 className="size-7" />
              </div>

              <div>
                <h3 className="font-serif text-xl font-bold text-slate-900">
                  Welcome to Swift Doc!
                </h3>
                <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Your client account has been created and initialized. You can now track applications,
                  manage document deliveries, and initiate new government filings.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-left space-y-2 text-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                  <span className="text-slate-500">Official Client Number</span>
                  <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                    {assignedClientNumber || client?.clientNumber || "SD-CL-0001"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Account Holder:</span>
                  <span className="font-semibold text-slate-900">
                    {user?.fullName || client?.fullName || step1Form.getValues("firstName") + " " + step1Form.getValues("lastName")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Account Verification:</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="size-3.5" /> Verified
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => router.push("/client")}
                  className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-sm shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Go to Client Dashboard</span>
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Right Security Message */}
        <div className="mt-4 xl:mt-6 flex items-center justify-center gap-2 text-center text-[11px] text-slate-500 font-medium">
          <ShieldCheck className="size-3.5 text-slate-500" />
          <span>Protected by 256-bit SSL &amp; Data Protection Act 2019</span>
        </div>
      </div>
    </div>
  );
}

