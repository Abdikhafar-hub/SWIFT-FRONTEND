"use client";

import React, { useEffect } from "react";
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

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isActiveRoute = (href: string, exact = false) => {
    if (exact) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <div className="fixed inset-0 z-50 flex lg:hidden animate-in fade-in duration-200">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-ink-deep/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative flex w-4/5 max-w-xs flex-1 flex-col bg-card border-r border-border p-4 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/70 pb-4">
          <Link href={role === "ADMIN" ? "/admin" : "/client"} onClick={onClose} className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xs bg-ink text-gold font-serif font-black text-base border border-gold/40">
              SD
            </div>
            <div className="flex flex-col">
              <span className="font-display text-sm font-bold text-foreground">SWIFT DOC</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gold">
                {role === "ADMIN" ? "Ops Command" : "Client Portal"}
              </span>
            </div>
          </Link>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
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
                <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const active = isActiveRoute(item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-xs px-3 py-2.5 text-xs font-semibold transition-colors relative",
                      active
                        ? "bg-gold/15 text-gold-dark dark:text-gold font-bold shadow-xs"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-xs bg-gold" />
                    )}
                    <NavIcon name={item.iconName} className={cn("size-4 shrink-0", active ? "text-gold" : "")} />
                    <span className="truncate">{item.title}</span>
                    {item.badge !== undefined && (
                      <span className="ml-auto rounded-full bg-gold/20 px-1.5 py-0.25 text-[10px] font-bold text-gold-dark dark:text-gold shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-border/70 pt-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-foreground truncate">
                {displayName}
              </span>
              <span className="text-[10px] text-muted-foreground truncate">
                {user?.email}
              </span>
            </div>
            <button
              onClick={() => {
                onClose();
                logout();
              }}
              className="p-2 rounded-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 transition-colors"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
