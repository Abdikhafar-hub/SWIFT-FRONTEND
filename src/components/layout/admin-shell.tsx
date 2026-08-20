"use client";

import React, { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { AuthGuard } from "@/lib/auth/auth-guard";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { MobileDrawer } from "./mobile-drawer";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <AuthGuard allowedRoles={["ADMIN"]}>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        {/* Desktop Sidebar */}
        <Sidebar role="ADMIN" />

        {/* Mobile Navigation Drawer */}
        <MobileDrawer
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          role="ADMIN"
        />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          {/* Operational clearance banner */}
          <div className="flex items-center justify-between bg-ink px-3 py-1 text-[10px] sm:text-[11px] text-white sm:px-6 shrink-0">
            <div className="flex items-center gap-1.5 sm:gap-2 font-bold tracking-wide min-w-0">
              <ShieldCheck className="size-3.5 text-gold shrink-0" />
              <span className="truncate">SWIFT DOC OPS COMMAND & COMPLIANCE</span>
            </div>
            <span className="hidden sm:inline font-mono text-[10px] text-white/70 shrink-0">
              AUDIT LOGGING ACTIVE
            </span>
          </div>

          <Topbar role="ADMIN" onMenuClick={() => setMobileMenuOpen(true)} />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
