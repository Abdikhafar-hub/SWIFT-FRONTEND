"use client";

import React, { useState } from "react";
import { AuthGuard } from "@/lib/auth/auth-guard";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { MobileDrawer } from "./mobile-drawer";

export function ClientShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <AuthGuard allowedRoles={["CLIENT"]}>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        {/* Desktop Sidebar */}
        <Sidebar role="CLIENT" />

        {/* Mobile Navigation Drawer */}
        <MobileDrawer
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          role="CLIENT"
        />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <Topbar role="CLIENT" onMenuClick={() => setMobileMenuOpen(true)} />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
