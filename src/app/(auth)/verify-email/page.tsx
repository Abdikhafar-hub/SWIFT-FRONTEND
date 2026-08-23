"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { authApi } from "@/lib/api/auth";
import {
  ShieldCheck,
  Mail,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { parseApiError } from "@/lib/utils/error";
import { notify } from "@/lib/notify";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refreshSession } = useAuth();

  const [emailToDisplay, setEmailToDisplay] = useState<string>("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(0);
  const [mockOtpHint, setMockOtpHint] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmailToDisplay(emailParam);
    } else if (user?.email) {
      setEmailToDisplay(user.email);
    } else if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("swift_doc_user");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed?.email) setEmailToDisplay(parsed.email);
        } catch {
          // ignore
        }
      }
    }
  }, [searchParams, user]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setErrorMessage(null);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length > 0) {
      const newOtp = ["", "", "", "", "", ""];
      for (let i = 0; i < pasted.length; i++) {
        newOtp[i] = pasted[i];
      }
      setOtp(newOtp);
      const nextIndex = Math.min(pasted.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) {
      setErrorMessage("Please enter all 6 digits of your verification code.");
      notify.warning("Please enter all 6 digits of your verification code.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    notify.loading("Verifying code...", { id: "verify-code" });

    try {
      const res = await authApi.verifyOtp(code);
      if (res.success) {
        setIsVerified(true);
        setSuccessMessage("Email address verified successfully! Initializing account launchpad...");
        notify.success("Email verified successfully!", { id: "verify-code" });
        await refreshSession();
        setTimeout(() => {
          router.push("/client");
        }, 1500);
      }
    } catch (err: any) {
      const parsed = parseApiError(err);
      setErrorMessage(parsed.message);
      notify.error(err, { id: "verify-code", title: "Verification Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (cooldown > 0 || isResending) return;

    setIsResending(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    notify.loading("Sending new verification code...", { id: "resend-code" });

    try {
      const res = await authApi.resendOtp();
      const msg = res.message || "A new 6-digit verification code has been sent.";
      setSuccessMessage(msg);
      notify.success(msg, { id: "resend-code" });
      if (res.mockOtp) {
        setMockOtpHint(res.mockOtp);
      }
      setCooldown(60);
    } catch (err: any) {
      const parsed = parseApiError(err);
      setErrorMessage(parsed.message);
      notify.error(err, { id: "resend-code", title: "Resend Failed" });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <div className="size-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 font-bold font-serif text-xl">
            SD
          </div>
          <span className="font-serif text-2xl font-bold tracking-tight text-white">
            Swift<span className="text-amber-500">Doc</span>
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl shadow-2xl backdrop-blur-xl p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-3">
              <Mail className="size-6" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Verify Your Email Address
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
              Enter the 6-digit verification code sent to{" "}
              <strong className="text-amber-400 font-medium">
                {emailToDisplay || "your registered email"}
              </strong>
            </p>
          </div>

          {/* Dev Mock OTP Hint if active */}
          {mockOtpHint && (
            <div className="p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-center text-xs text-amber-300 font-mono">
              Dev OTP Code: <strong>{mockOtpHint}</strong>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-300">
              <AlertCircle className="size-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-300">
              <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {isVerified ? (
            <div className="text-center space-y-3 py-4">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 ring-8 ring-emerald-500/10">
                <CheckCircle2 className="size-8" />
              </div>
              <p className="text-sm font-bold text-white">Verification Complete!</p>
              <p className="text-xs text-slate-400">Redirecting to your client dashboard...</p>
            </div>
          ) : (
            <form onSubmit={handleVerify} className="space-y-6">
              {/* 6-Digit Code Input */}
              <div className="flex justify-center gap-2 sm:gap-2.5">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { inputRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={handlePaste}
                    className="size-11 sm:size-12 rounded-xl border border-slate-700 bg-slate-950 text-center font-mono text-lg font-bold text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || otp.join("").length !== 6}
                className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="size-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Account Email</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                <span className="text-slate-400 font-medium">Didn't receive the code?</span>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={cooldown > 0 || isResending}
                  className="font-bold text-amber-500 hover:text-amber-400 hover:underline disabled:opacity-50 disabled:no-underline flex items-center gap-1 cursor-pointer"
                >
                  {isResending ? (
                    <span>Sending...</span>
                  ) : cooldown > 0 ? (
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock className="size-3" /> Resend in {cooldown}s
                    </span>
                  ) : (
                    <span>Resend Code</span>
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="pt-2 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5 font-medium">
            <ShieldCheck className="size-3.5 text-slate-400" />
            <span>Official Swift Doc Identity Verification Platform</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#090D16] flex items-center justify-center text-slate-400 text-xs">
          Loading verification portal...
        </div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}
