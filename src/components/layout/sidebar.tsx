"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { NavIcon } from "./icon-resolver";
import { CLIENT_NAV_SECTIONS, ADMIN_NAV_SECTIONS, type NavSection } from "@/lib/constants/navigation";
import { useAuth } from "@/lib/auth/auth-context";

export function Sidebar({ role }: { role: "CLIENT" | "ADMIN" }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { user, client, logout } = useAuth();

  const displayName = client?.fullName || (role === "ADMIN" ? "Operations Admin" : user?.email?.split("@")[0] || "User");
  const sections: NavSection[] = role === "ADMIN" ? ADMIN_NAV_SECTIONS : CLIENT_NAV_SECTIONS;

  const isActiveRoute = (href: string, exact = false) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "relative hidden lg:flex flex-col border-r border-border bg-card transition-all duration-300 ease-in-out shrink-0 select-none z-30 h-screen sticky top-0",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-border/70 px-4">
        {!collapsed ? (
          <Link href={role === "ADMIN" ? "/admin" : "/client"} className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xs bg-ink text-gold font-serif font-black text-lg border border-gold/40 shadow-xs">
              SD
            </div>
            <div className="flex flex-col">
              <span className="font-display text-sm font-extrabold tracking-tight text-foreground">
                SWIFT DOC
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gold">
                {role === "ADMIN" ? "Ops Command" : "Client Portal"}
              </span>
            </div>
          </Link>
        ) : (
          <div className="mx-auto flex size-9 items-center justify-center rounded-xs bg-ink text-gold font-serif font-black text-lg border border-gold/40">
            SD
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden xl:flex size-6 items-center justify-center rounded-xs border border-border bg-background text-muted-foreground hover:text-foreground hover:border-gold transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {!collapsed && section.title && (
              <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                {section.title}
              </div>
            )}

            {section.items.map((item) => {
              const active = isActiveRoute(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.title : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xs px-3 py-2.5 text-xs font-semibold transition-all duration-150",
                    active
                      ? "bg-gold/15 text-gold-dark dark:text-gold font-bold shadow-xs"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    collapsed && "justify-center px-2"
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-xs bg-gold" />
                  )}

                  <NavIcon
                    name={item.iconName}
                    className={cn(
                      "size-4 shrink-0 transition-colors",
                      active ? "text-gold" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />

                  {!collapsed && (
                    <span className="truncate">{item.title}</span>
                  )}

                  {!collapsed && item.badge !== undefined && (
                    <span className="ml-auto rounded-full bg-gold/20 px-1.5 py-0.25 text-[10px] font-bold text-gold-dark dark:text-gold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* User Footer Profile */}
      <div className="border-t border-border/70 p-3 bg-muted/20">
        {!collapsed ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xs bg-gold/20 text-xs font-bold text-gold">
                {displayName.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col overflow-hidden text-left">
                <span className="truncate text-xs font-bold text-foreground">
                  {displayName}
                </span>
                <span className="truncate text-[10px] text-muted-foreground">
                  {user?.email || "user@swiftdoc.co.ke"}
                </span>
              </div>
            </div>

            <button
              onClick={() => logout()}
              className="p-1.5 rounded-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Sign Out"
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={() => logout()}
              className="p-2 rounded-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Sign Out"
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
