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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/form-primitives";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
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

type Step = 1 | 2 | 3 | 4;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerAuth, user, client, refreshSession } = useAuth();

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [serverError, setServerError] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string>("");
  const [assignedClientNumber, setAssignedClientNumber] = useState<string>("");

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
      setResendCooldown(30);
      setCurrentStep(2);
    } catch (err: unknown) {
      const parsed = parseApiError(err);
      setServerError(parsed.message);
    }
  };

  // Handle Step 2 Submission: Verification OTP
  const onStep2Submit = async (data: OtpVerificationFormData) => {
    setServerError(null);
    try {
      await authApi.verifyOtp(data.code);
      await refreshSession();
      setOtpNotice("Email verified successfully!");
      setTimeout(() => {
        setCurrentStep(3);
      }, 500);
    } catch (err: unknown) {
      const parsed = parseApiError(err);
      setServerError(parsed.message);
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setServerError(null);
    try {
      const res = await authApi.resendOtp();
      setOtpNotice(res.message || "A new 6-digit code has been sent.");
      setResendCooldown(45);
    } catch (err: unknown) {
      const parsed = parseApiError(err);
      setServerError(parsed.message);
    } finally {
      setIsResending(false);
    }
  };

  // Handle Step 3 Submission: Client Profile Configuration
  const onStep3Submit = async (data: ClientProfileStepFormData) => {
    setServerError(null);
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
      setCurrentStep(4);
    } catch (err: unknown) {
      const parsed = parseApiError(err);
      setServerError(parsed.message);
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
    <div className="flex min-h-screen flex-col justify-center bg-background py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="flex size-10 items-center justify-center rounded-xs bg-ink text-gold font-serif font-black text-xl border border-gold/40 shadow-xs">
            SD
          </div>
          <span className="font-display text-xl font-extrabold tracking-tight text-foreground">
            SWIFT DOC
          </span>
        </Link>

        {/* Dynamic Header Titles */}
        {currentStep === 1 && (
          <>
            <Heading level="h2" className="mt-4 text-2xl font-bold tracking-tight">
              Create Your Account
            </Heading>
            <Text variant="muted" className="mt-1 text-xs">
              Enter your personal credentials to create your Swift Doc statutory account.
            </Text>
          </>
        )}
        {currentStep === 2 && (
          <>
            <Heading level="h2" className="mt-4 text-2xl font-bold tracking-tight">
              Verify Account Email
            </Heading>
            <Text variant="muted" className="mt-1 text-xs">
              Secure your account by entering the 6-digit code sent to your email.
            </Text>
          </>
        )}
        {currentStep === 3 && (
          <>
            <Heading level="h2" className="mt-4 text-2xl font-bold tracking-tight">
              Statutory Profile & Business Setup
            </Heading>
            <Text variant="muted" className="mt-1 text-xs">
              Configure your statutory entity details to accelerate Kenyan business and tax filings.
            </Text>
          </>
        )}
        {currentStep === 4 && (
          <>
            <Heading level="h2" className="mt-4 text-2xl font-bold tracking-tight">
              Registration Completed
            </Heading>
            <Text variant="muted" className="mt-1 text-xs">
              Your Swift Doc account and statutory client dossier are ready for official filings.
            </Text>
          </>
        )}
      </div>

      {/* Stepper Progress Bar */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0">
        <div className="relative flex items-center justify-between pb-6">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-border/80 -z-0" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-gold transition-all duration-500 -z-0"
            style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
          />

          {stepsList.map((st) => {
            const isCompleted = currentStep > st.number;
            const isCurrent = currentStep === st.number;
            return (
              <div key={st.number} className="relative z-10 flex flex-col items-center">
                <div
                  className={`flex size-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    isCompleted
                      ? "bg-gold text-ink"
                      : isCurrent
                      ? "bg-primary text-primary-foreground ring-4 ring-gold/20"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="size-4" /> : st.number}
                </div>
                <span
                  className={`mt-1.5 hidden text-[11px] font-medium sm:block ${
                    isCurrent ? "text-foreground font-semibold" : "text-muted-foreground"
                  }`}
                >
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Main Card */}
        <div className="rounded-xs border border-border bg-card p-6 sm:p-8 shadow-xs">
          {serverError && (
            <div className="mb-6 flex items-start gap-3 rounded-xs border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive-foreground">
              <AlertCircle className="size-4 shrink-0 mt-0.5 text-destructive" />
              <div className="flex flex-col">
                <span className="font-bold">Attention</span>
                <span className="mt-0.5 leading-relaxed">{serverError}</span>
              </div>
            </div>
          )}

          {otpNotice && (
            <div className="mb-6 flex items-start gap-3 rounded-xs border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-500" />
              <div className="flex flex-col">
                <span className="font-bold">Status Update</span>
                <span className="mt-0.5 leading-relaxed">{otpNotice}</span>
              </div>
            </div>
          )}

          {/* =========================================================================
              STEP 1: Account Identity Creation
             ========================================================================= */}
          {currentStep === 1 && (
            <form onSubmit={step1Form.handleSubmit(onStep1Submit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label="First Name"
                  required
                  error={step1Form.formState.errors.firstName?.message}
                >
                  <Input
                    placeholder="Abdikhafar"
                    autoComplete="given-name"
                    leftAddon={<User className="size-4" />}
                    {...step1Form.register("firstName")}
                  />
                </FormField>

                <FormField
                  label="Last Name"
                  required
                  error={step1Form.formState.errors.lastName?.message}
                >
                  <Input
                    placeholder="Mohamed"
                    autoComplete="family-name"
                    leftAddon={<User className="size-4" />}
                    {...step1Form.register("lastName")}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label="Email Address"
                  required
                  error={step1Form.formState.errors.email?.message}
                >
                  <Input
                    type="email"
                    placeholder="user@example.co.ke"
                    autoComplete="email"
                    leftAddon={<Mail className="size-4" />}
                    {...step1Form.register("email")}
                  />
                </FormField>

                <FormField
                  label="Kenyan Phone Number"
                  required
                  hint="e.g. 0712345678"
                  error={step1Form.formState.errors.phone?.message}
                >
                  <Input
                    type="tel"
                    placeholder="0712345678"
                    autoComplete="tel"
                    leftAddon={<Phone className="size-4" />}
                    {...step1Form.register("phone")}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label="Password"
                  required
                  hint="Min 8 chars, 1 uppercase & 1 number"
                  error={step1Form.formState.errors.password?.message}
                >
                  <Input
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    leftAddon={<Lock className="size-4" />}
                    {...step1Form.register("password")}
                  />
                </FormField>

                <FormField
                  label="Confirm Password"
                  required
                  error={step1Form.formState.errors.confirmPassword?.message}
                >
                  <Input
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    leftAddon={<Lock className="size-4" />}
                    {...step1Form.register("confirmPassword")}
                  />
                </FormField>
              </div>

              <div className="pt-3">
                <Button
                  type="submit"
                  variant="gold"
                  size="md"
                  fullWidth
                  isLoading={step1Form.formState.isSubmitting}
                  rightIcon={<ArrowRight className="size-4" />}
                >
                  Create Account & Continue
                </Button>
              </div>

              <div className="mt-6 border-t border-border/70 pt-6 text-center text-xs text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-bold text-foreground hover:text-gold transition-colors"
                >
                  Sign In
                </Link>
              </div>
            </form>
          )}

          {/* =========================================================================
              STEP 2: OTP Verification
             ========================================================================= */}
          {currentStep === 2 && (
            <form onSubmit={step2Form.handleSubmit(onStep2Submit)} className="space-y-6">
              <div className="rounded-xs border border-primary/20 bg-primary/5 p-4 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-gold mb-3">
                  <Mail className="size-6" />
                </div>
                <h3 className="font-semibold text-sm text-foreground">Verify Your Email Address</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  We sent a 6-digit verification code to{" "}
                  <strong className="text-foreground">{registeredEmail || user?.email || "your email"}</strong>.
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-[11px] text-muted-foreground border border-border">
                  <KeyRound className="size-3 text-gold" />
                  <span>Dev & Demo helper code: <strong>123456</strong></span>
                </div>
              </div>

              <FormField
                label="6-Digit Verification Code"
                required
                error={step2Form.formState.errors.code?.message}
                hint="Enter the 6-digit OTP code sent to your email"
              >
                <Input
                  placeholder="123456"
                  maxLength={8}
                  className="text-center text-lg tracking-widest font-mono"
                  autoFocus
                  {...step2Form.register("code")}
                />
              </FormField>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Didn&apos;t receive the code?</span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || isResending}
                  className="inline-flex items-center gap-1.5 font-semibold text-gold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`size-3.5 ${isResending ? "animate-spin" : ""}`} />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                </button>
              </div>

              <div className="space-y-3 pt-2">
                <Button
                  type="submit"
                  variant="gold"
                  size="md"
                  fullWidth
                  isLoading={step2Form.formState.isSubmitting}
                  rightIcon={<ArrowRight className="size-4" />}
                >
                  Verify Email & Continue
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  fullWidth
                  onClick={() => setCurrentStep(3)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Skip verification for now
                </Button>
              </div>
            </form>
          )}

          {/* =========================================================================
              STEP 3: Statutory Profile & Business Configuration
             ========================================================================= */}
          {currentStep === 3 && (
            <form onSubmit={step3Form.handleSubmit(onStep3Submit)} className="space-y-5">
              {/* Entity Type Card Selector */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-2">
                  Select Client Entity Type <span className="text-destructive">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => step3Form.setValue("clientType", "INDIVIDUAL")}
                    className={`flex flex-col items-start p-4 rounded-xs border text-left transition-all ${
                      selectedClientType === "INDIVIDUAL"
                        ? "border-gold bg-gold/5 ring-2 ring-gold/20"
                        : "border-border bg-card/50 hover:border-border/80"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <User className={`size-4 ${selectedClientType === "INDIVIDUAL" ? "text-gold" : "text-muted-foreground"}`} />
                      <span className="font-semibold text-xs text-foreground">Individual / Sole Proprietor</span>
                    </div>
                    <span className="mt-1 text-[11px] text-muted-foreground">
                      Personal applications, individual KRA PIN, and personal certificates.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => step3Form.setValue("clientType", "BUSINESS")}
                    className={`flex flex-col items-start p-4 rounded-xs border text-left transition-all ${
                      selectedClientType === "BUSINESS" || selectedClientType === "ORGANIZATION"
                        ? "border-gold bg-gold/5 ring-2 ring-gold/20"
                        : "border-border bg-card/50 hover:border-border/80"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building className={`size-4 ${selectedClientType !== "INDIVIDUAL" ? "text-gold" : "text-muted-foreground"}`} />
                      <span className="font-semibold text-xs text-foreground">Company / Organization</span>
                    </div>
                    <span className="mt-1 text-[11px] text-muted-foreground">
                      Kenyan registered companies, BRS filings, CR12s, SMEs, and NGOs.
                    </span>
                  </button>
                </div>
              </div>

              {/* Dynamic Form for Company / Organization */}
              {selectedClientType !== "INDIVIDUAL" && (
                <div className="space-y-4 rounded-xs border border-border/80 bg-muted/20 p-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                    <Building className="size-4 text-gold" />
                    <span className="text-xs font-bold text-foreground">Company Statutory Credentials</span>
                  </div>

                  <FormField
                    label="Legal Business Name"
                    required
                    error={step3Form.formState.errors.businessName?.message}
                    hint="Official registered name as per BRS Certificate of Incorporation"
                  >
                    <Input
                      placeholder="e.g. Apex Technologies Limited"
                      leftAddon={<Building className="size-4" />}
                      {...step3Form.register("businessName")}
                    />
                  </FormField>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      label="Company KRA PIN"
                      hint="Format: P000000000X"
                      error={step3Form.formState.errors.kraPin?.message}
                    >
                      <Input
                        placeholder="P051234567Z"
                        className="uppercase"
                        {...step3Form.register("kraPin")}
                      />
                    </FormField>

                    <FormField
                      label="Registration Number"
                      hint="e.g. CPR/2026/12345 or BN-XXXXXX"
                      error={step3Form.formState.errors.registrationNumber?.message}
                    >
                      <Input
                        placeholder="CPR/2026/12345"
                        leftAddon={<FileText className="size-4" />}
                        {...step3Form.register("registrationNumber")}
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      label="Business Email"
                      hint="Official corporate email"
                      error={step3Form.formState.errors.businessEmail?.message}
                    >
                      <Input
                        type="email"
                        placeholder="info@company.co.ke"
                        leftAddon={<Mail className="size-4" />}
                        {...step3Form.register("businessEmail")}
                      />
                    </FormField>

                    <FormField
                      label="Business Phone"
                      hint="Official corporate phone"
                      error={step3Form.formState.errors.businessPhone?.message}
                    >
                      <Input
                        type="tel"
                        placeholder="0700112233"
                        leftAddon={<Phone className="size-4" />}
                        {...step3Form.register("businessPhone")}
                      />
                    </FormField>
                  </div>

                  <FormField
                    label="Registered Physical Address / Headquarters"
                    hint="Building, Street, Floor, Suite"
                    error={step3Form.formState.errors.address?.message}
                  >
                    <Input
                      placeholder="e.g. Westlands Commercial Center, 4th Floor, Ring Rd"
                      leftAddon={<MapPin className="size-4" />}
                      {...step3Form.register("address")}
                    />
                  </FormField>
                </div>
              )}

              {/* Dynamic Form for Individual */}
              {selectedClientType === "INDIVIDUAL" && (
                <div className="space-y-4 rounded-xs border border-border/80 bg-muted/20 p-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                    <User className="size-4 text-gold" />
                    <span className="text-xs font-bold text-foreground">Individual Statutory Credentials</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      label="National ID Number"
                      hint="Kenyan National ID Number"
                      error={step3Form.formState.errors.nationalId?.message}
                    >
                      <Input
                        placeholder="12345678"
                        leftAddon={<User className="size-4" />}
                        {...step3Form.register("nationalId")}
                      />
                    </FormField>

                    <FormField
                      label="Passport Number (Optional)"
                      hint="If applying for cross-border services"
                      error={step3Form.formState.errors.passportNumber?.message}
                    >
                      <Input
                        placeholder="AK123456"
                        className="uppercase"
                        {...step3Form.register("passportNumber")}
                      />
                    </FormField>
                  </div>

                  <FormField
                    label="Personal KRA PIN"
                    hint="Format: A000000000X"
                    error={step3Form.formState.errors.kraPin?.message}
                  >
                    <Input
                      placeholder="A012345678Z"
                      className="uppercase"
                      {...step3Form.register("kraPin")}
                    />
                  </FormField>

                  <FormField
                    label="Residential / Physical Address"
                    hint="Estate, Street, House / Apartment Number"
                    error={step3Form.formState.errors.address?.message}
                  >
                    <Input
                      placeholder="e.g. Kilimani, Argwings Kodhek Rd, Apt 4B"
                      leftAddon={<MapPin className="size-4" />}
                      {...step3Form.register("address")}
                    />
                  </FormField>
                </div>
              )}

              {/* Shared Location & Communication Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="County" error={step3Form.formState.errors.county?.message}>
                  <Select {...step3Form.register("county")}>
                    <option value="Nairobi">Nairobi County</option>
                    <option value="Mombasa">Mombasa County</option>
                    <option value="Kiambu">Kiambu County</option>
                    <option value="Nakuru">Nakuru County</option>
                    <option value="Kisumu">Kisumu County</option>
                    <option value="Uasin Gishu">Uasin Gishu County</option>
                    <option value="Machakos">Machakos County</option>
                    <option value="Kajiado">Kajiado County</option>
                    <option value="Other">Other County</option>
                  </Select>
                </FormField>

                <FormField label="City / Town" error={step3Form.formState.errors.city?.message}>
                  <Input placeholder="Nairobi" {...step3Form.register("city")} />
                </FormField>
              </div>

              <FormField label="Preferred Notification Channel">
                <Select {...step3Form.register("preferredChannel")}>
                  <option value="EMAIL">Email Notifications</option>
                  <option value="SMS">SMS Alerts</option>
                  <option value="WHATSAPP">WhatsApp Updates</option>
                  <option value="IN_APP">Portal Only</option>
                </Select>
              </FormField>

              <div className="space-y-3 pt-3">
                <Button
                  type="submit"
                  variant="gold"
                  size="md"
                  fullWidth
                  isLoading={step3Form.formState.isSubmitting}
                  rightIcon={<ArrowRight className="size-4" />}
                >
                  Save Profile & Complete Registration
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  fullWidth
                  onClick={() => setCurrentStep(4)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Skip and complete profile later
                </Button>
              </div>
            </form>
          )}

          {/* =========================================================================
              STEP 4: Registration Complete & Service Launchpad
             ========================================================================= */}
          {currentStep === 4 && (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 ring-8 ring-emerald-500/5">
                <CheckCircle2 className="size-8" />
              </div>

              <div>
                <Heading level="h3" className="text-xl font-bold text-foreground">
                  Welcome to Swift Doc!
                </Heading>
                <Text variant="muted" className="mt-1.5 text-xs max-w-md mx-auto">
                  Your client account has been created and initialized. You can now track applications,
                  manage document deliveries, and initiate new government filings.
                </Text>
              </div>

              {/* Dossier Card */}
              <div className="rounded-xs border border-border bg-muted/20 p-4 text-left space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <span className="text-xs text-muted-foreground">Official Client Number</span>
                  <Badge tone="gold" size="sm">
                    {assignedClientNumber || client?.clientNumber || "SD-CL-0001"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Account Holder:</span>
                  <span className="font-semibold text-foreground">
                    {user?.fullName || client?.fullName || step1Form.getValues("firstName") + " " + step1Form.getValues("lastName")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Registered Email:</span>
                  <span className="font-mono text-foreground">
                    {registeredEmail || user?.email}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Account Verification:</span>
                  <span className="text-emerald-500 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="size-3.5" /> Active & Verified
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <Button
                  type="button"
                  variant="gold"
                  size="lg"
                  fullWidth
                  onClick={() => router.push("/client")}
                  rightIcon={<ArrowRight className="size-4" />}
                >
                  Go to Client Dashboard
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  fullWidth
                  onClick={() => router.push("/client/services")}
                  leftIcon={<Sparkles className="size-4 text-gold" />}
                >
                  Browse Service Catalog & Start Filing
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Security & Compliance Footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
          <ShieldCheck className="size-4 text-gold" />
          <span>Compliant with Kenya Data Protection Act 2019</span>
        </div>
      </div>
    </div>
  );
}
