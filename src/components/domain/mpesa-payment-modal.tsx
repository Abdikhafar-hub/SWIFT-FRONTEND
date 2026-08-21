"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  Lock,
  X,
  Search,
} from "lucide-react";
import { paymentsApi } from "@/lib/api/payments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatKES } from "@/lib/utils/format";
import { normalizeKenyanPhone, isValidKenyanPhone } from "@/lib/utils/phone";

interface MpesaPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: {
    id: string;
    invoiceNumber: string;
    totalAmount: number | string;
    amountDue: number | string;
    amountPaid?: number | string;
    currency?: string;
  };
  clientPhone?: string;
  onPaymentSuccess?: () => void;
}

type PaymentStep = "INPUT" | "POLLING" | "SUCCESS" | "FAILED";

export function MpesaPaymentModal({
  isOpen,
  onClose,
  invoice,
  clientPhone = "",
  onPaymentSuccess,
}: MpesaPaymentModalProps) {
  const queryClient = useQueryClient();

  const dueAmountNumber = Math.max(0, Number(invoice.amountDue) || Number(invoice.totalAmount));

  const [step, setStep] = useState<PaymentStep>("INPUT");
  const [phoneNumber, setPhoneNumber] = useState(clientPhone ? normalizeKenyanPhone(clientPhone) : "");
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingQuery, setLoadingQuery] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(60);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (clientPhone) {
      setPhoneNumber(normalizeKenyanPhone(clientPhone));
    }
    setStep("INPUT");
    setErrorMessage(null);
    setCheckoutRequestId(null);
  }, [clientPhone, invoice.amountDue, invoice.totalAmount, dueAmountNumber, isOpen]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  const stopPolling = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  };

  const triggerSuccess = () => {
    stopPolling();
    setStep("SUCCESS");
    queryClient.invalidateQueries({ queryKey: ["client-invoices"] });
    queryClient.invalidateQueries({ queryKey: ["client-invoice", invoice.id] });
    queryClient.invalidateQueries({ queryKey: ["client-payments"] });
    queryClient.invalidateQueries({ queryKey: ["client-dashboard-overview"] });
    queryClient.invalidateQueries({ queryKey: ["client-applications"] });
    onPaymentSuccess?.();
  };

  const startPolling = (invoiceId: string, currentCheckoutId?: string) => {
    setSecondsRemaining(60);
    setStep("POLLING");

    // 1. Countdown timer
    countdownIntervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          stopPolling();
          setStep("FAILED");
          setErrorMessage("Payment prompt timed out. If you received the M-Pesa prompt, click 'Check Status' below.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 2. Poll invoice status every 2.5s
    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await paymentsApi.getInvoiceStatus(invoiceId);
        if (res.isPaid || Number(res.amountDue) <= 0 || res.status === "PAID") {
          triggerSuccess();
        } else if (currentCheckoutId) {
          // Check STK push query directly
          const qRes = await paymentsApi.queryStkStatus(currentCheckoutId).catch(() => null);
          if (qRes && (qRes.status === "COMPLETED" || qRes.status === "PAID")) {
            triggerSuccess();
          }
        }
      } catch {
        // Continue polling silently
      }
    }, 2500);
  };

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const normalized = normalizeKenyanPhone(phoneNumber);
    if (!isValidKenyanPhone(normalized)) {
      setErrorMessage("Please enter a valid Safaricom phone number (e.g. 0712345678 or 254712345678).");
      return;
    }

    if (dueAmountNumber <= 0) {
      setErrorMessage("Invoice is already fully settled.");
      return;
    }

    setLoading(true);
    try {
      const res = await paymentsApi.payInvoiceMpesa(invoice.id, {
        phoneNumber: normalized,
        amount: dueAmountNumber,
        idempotencyKey: `mpesa_${invoice.id}_${Date.now()}`,
      });

      if (res.checkoutRequestId) {
        setCheckoutRequestId(res.checkoutRequestId);
      }

      setLoading(false);
      startPolling(invoice.id, res.checkoutRequestId);
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err.message || "Failed to trigger M-Pesa STK Push. Please try again.");
    }
  };

  const handleManualStatusQuery = async () => {
    if (!checkoutRequestId) {
      setErrorMessage("No active Checkout Request ID found.");
      return;
    }

    setLoadingQuery(true);
    try {
      const qRes = await paymentsApi.queryStkStatus(checkoutRequestId);
      if (qRes.status === "COMPLETED" || qRes.status === "PAID") {
        triggerSuccess();
      } else {
        setErrorMessage(`Transaction status: ${qRes.status} (${qRes.resultDesc || "Pending PIN entry"})`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Could not query Daraja STK status.");
    } finally {
      setLoadingQuery(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-[calc(100vw-2rem)] max-w-md max-h-[90vh] flex flex-col rounded-sm border border-border bg-card shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/70 px-4 sm:px-5 py-3.5 sm:py-4 bg-muted/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xs bg-emerald-600 text-white font-black text-xs">
              M
            </div>
            <div>
              <h3 className="font-display text-sm font-bold text-foreground">
                Lipa na M-Pesa Online
              </h3>
              <p className="text-[10px] text-muted-foreground font-mono">
                Invoice #{invoice.invoiceNumber}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopPolling();
              onClose();
            }}
            className="p-1 rounded-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close modal"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6">
          {/* STEP 1: FORM INPUT */}
          {step === "INPUT" && (
            <form onSubmit={handleInitiatePayment} className="space-y-4">
              {/* Billing Summary Box - Strict Server Derived Amount */}
              <div className="rounded-xs border border-emerald-500/30 bg-emerald-500/5 p-3.5 space-y-2">
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>Total Invoice Amount:</span>
                  <span className="font-semibold text-foreground font-mono">
                    {formatKES(invoice.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center font-bold text-foreground pt-1.5 border-t border-emerald-500/20">
                  <span className="text-xs uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    Amount Payable:
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-mono text-base font-extrabold">
                    {formatKES(dueAmountNumber)}
                  </span>
                </div>
                <span className="block text-[10px] text-muted-foreground">
                  Calculated automatically from invoice outstanding balance.
                </span>
              </div>

              {/* Phone Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-foreground">
                  Safaricom M-Pesa Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                    <Smartphone className="size-4 text-emerald-600" />
                  </div>
                  <Input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0712 345 678 or 2547..."
                    className="pl-9 font-mono text-sm"
                    required
                    disabled={loading}
                  />
                </div>
                <span className="block text-[11px] text-muted-foreground">
                  The M-Pesa STK Push prompt will be sent to this phone.
                </span>
              </div>

              {errorMessage && (
                <div className="flex items-start gap-2 rounded-xs border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Action Button */}
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 gap-2 shadow-xs"
                isLoading={loading}
                disabled={loading}
              >
                <Lock className="size-3.5" />
                <span>Send M-Pesa STK Push ({formatKES(dueAmountNumber)})</span>
                <ArrowRight className="size-4 ml-auto" />
              </Button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground pt-1">
                <Lock className="size-3 text-emerald-600" />
                <span>Safaricom Daraja Verified Gateway</span>
              </div>
            </form>
          )}

          {/* STEP 2: POLLING / WAITING FOR STK CONFIRMATION */}
          {step === "POLLING" && (
            <div className="flex flex-col items-center text-center py-4 space-y-4">
              <div className="relative flex size-20 items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-ping" />
                <div className="flex size-16 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg animate-bounce">
                  <Smartphone className="size-8" />
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-display text-base font-bold text-foreground">
                  Check Your Phone
                </h4>
                <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                  An M-Pesa PIN prompt for <strong className="text-foreground">{formatKES(dueAmountNumber)}</strong> has been sent to{" "}
                  <strong className="text-foreground font-mono">{phoneNumber}</strong>.
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-full bg-muted/60 px-3 py-1 text-xs font-mono font-bold text-foreground">
                <Clock className="size-3.5 text-gold" />
                <span>Awaiting PIN Entry: {secondsRemaining}s</span>
              </div>

              <div className="w-full rounded-xs border border-border bg-card p-3 text-[11px] text-muted-foreground text-left space-y-1">
                <div className="font-semibold text-foreground">Instructions:</div>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>Unlock your phone screen.</li>
                  <li>Enter your secret 4-digit M-Pesa PIN.</li>
                  <li>Press <strong>OK</strong> to approve payment.</li>
                </ol>
              </div>

              {checkoutRequestId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManualStatusQuery}
                  isLoading={loadingQuery}
                  disabled={loadingQuery}
                  className="w-full text-xs font-semibold gap-1.5 border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
                >
                  <Search className="size-3.5" />
                  <span>Query M-Pesa Status Now</span>
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  stopPolling();
                  setStep("INPUT");
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel or Use Different Phone Number
              </Button>
            </div>
          )}

          {/* STEP 3: SUCCESS */}
          {step === "SUCCESS" && (
            <div className="flex flex-col items-center text-center py-4 space-y-4 animate-in zoom-in-95">
              <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-10" />
              </div>

              <div className="space-y-1">
                <h4 className="font-display text-base font-bold text-foreground">
                  Payment Verified & Completed
                </h4>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Your payment of <strong className="text-foreground">{formatKES(dueAmountNumber)}</strong> has been verified. Official immutable receipt generated.
                </p>
              </div>

              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                onClick={() => {
                  stopPolling();
                  onClose();
                }}
              >
                Done & View Receipts
              </Button>
            </div>
          )}

          {/* STEP 4: TIMEOUT / FAILED */}
          {step === "FAILED" && (
            <div className="flex flex-col items-center text-center py-4 space-y-4">
              <div className="flex size-14 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                <AlertCircle className="size-8" />
              </div>

              <div className="space-y-1">
                <h4 className="font-display text-base font-bold text-foreground">
                  Verification Pending / Timeout
                </h4>
                <p className="text-xs text-muted-foreground max-w-xs">
                  {errorMessage || "We could not automatically detect your M-Pesa PIN confirmation within 60 seconds."}
                </p>
              </div>

              {checkoutRequestId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManualStatusQuery}
                  isLoading={loadingQuery}
                  disabled={loadingQuery}
                  className="w-full text-xs font-semibold gap-1.5 border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
                >
                  <Search className="size-3.5" />
                  <span>Check Payment Status with M-Pesa</span>
                </Button>
              )}

              <div className="flex w-full gap-2 pt-1">
                <Button
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={() => {
                    stopPolling();
                    onClose();
                  }}
                >
                  Close
                </Button>
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5"
                  onClick={() => {
                    setStep("INPUT");
                    setErrorMessage(null);
                  }}
                >
                  <RefreshCw className="size-3.5" />
                  <span>Retry STK Push</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
