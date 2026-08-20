"use client";

import React, { useEffect, useRef } from "react";
import { ShieldAlert, Clock, LogOut, RefreshCw } from "lucide-react";

interface SessionTimeoutModalProps {
  isOpen: boolean;
  countdownSeconds: number;
  onStaySignedIn: () => void;
  onLogout: () => void;
}

export function SessionTimeoutModal({
  isOpen,
  countdownSeconds,
  onStaySignedIn,
  onLogout,
}: SessionTimeoutModalProps) {
  const stayButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      stayButtonRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isCritical = countdownSeconds <= 10;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-timeout-title"
    >
      <div className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl shadow-amber-500/10 p-6 md:p-8 space-y-6 text-slate-100 relative overflow-hidden">
        {/* Decorative Top Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />

        <div className="flex items-center space-x-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 shrink-0">
            <Clock className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <h2 id="session-timeout-title" className="text-xl font-bold text-slate-50 tracking-tight">
              Session Inactivity Warning
            </h2>
            <p className="text-xs text-amber-400 font-medium uppercase tracking-wider mt-0.5">
              Swift Doc Security Protocol
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">
          You have been inactive for over 4 minutes. For security and document protection, your session will automatically expire unless extended.
        </p>

        {/* Live Countdown Badge */}
        <div className="flex items-center justify-between p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
          <span className="text-sm font-medium text-slate-400">Time Remaining:</span>
          <div className="flex items-center space-x-2">
            <span
              className={`text-3xl font-extrabold font-mono tracking-tight transition-colors ${
                isCritical ? "text-red-400 animate-bounce" : "text-amber-400"
              }`}
            >
              00:{countdownSeconds < 10 ? `0${countdownSeconds}` : countdownSeconds}
            </span>
            <span className="text-xs text-slate-500 uppercase font-semibold">sec</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            ref={stayButtonRef}
            onClick={onStaySignedIn}
            className="flex-1 inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 transition-all transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Stay Signed In</span>
          </button>
          <button
            onClick={onLogout}
            className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
