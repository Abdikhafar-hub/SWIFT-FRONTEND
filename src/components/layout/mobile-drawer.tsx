"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, LogOut } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { NavIcon } from "./icon-resolver";
import { CLIENT_NAV_SECTIONS, ADMIN_NAV_SECTIONS, type NavSection } from "@/lib/constants/navigation";
import { useAuth } from "@/lib/auth/auth-context";

export function MobileDrawer({
  isOpen,
  onClose,
  role,
}: {
  isOpen: boolean;
  onClose: () => void;
  role: "CLIENT" | "ADMIN";
}) {
  const pathname = usePathname();
  const { user, client, logout } = useAuth();
  const displayName = client?.fullName || (role === "ADMIN" ? "Operations Admin" : user?.email?.split("@")[0] || "User");
  const sections: NavSection[] = role === "ADMIN" ? ADMIN_NAV_SECTIONS : CLIENT_NAV_SECTIONS;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex lg:hidden">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-ink-deep/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative flex w-4/5 max-w-xs flex-1 flex-col bg-card border-r border-border p-4 shadow-xl z-10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/70 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xs bg-ink text-gold font-serif font-black text-base border border-gold/40">
              SD
            </div>
            <div className="flex flex-col">
              <span className="font-display text-sm font-bold text-foreground">SWIFT DOC</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gold">
                {role === "ADMIN" ? "Ops Command" : "Client Portal"}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-xs text-muted-foreground hover:text-foreground"
            aria-label="Close navigation"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {section.title && (
                <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-xs px-3 py-2.5 text-xs font-semibold transition-colors",
                      active
                        ? "bg-gold/15 text-gold-dark dark:text-gold font-bold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <NavIcon name={item.iconName} className="size-4" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-border/70 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-foreground truncate max-w-[160px]">
                {displayName}
              </span>
              <span className="text-[10px] text-muted-foreground truncate max-w-[160px]">
                {user?.email}
              </span>
            </div>
            <button
              onClick={() => {
                onClose();
                logout();
              }}
              className="p-2 rounded-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
