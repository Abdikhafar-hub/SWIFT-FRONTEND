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
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Brand Header */}
      <div className="flex h-12 items-center justify-between border-b border-border/70 px-3 shrink-0">
        {!collapsed ? (
          <Link href={role === "ADMIN" ? "/admin" : "/client"} className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-xs bg-ink text-gold font-serif font-black text-sm border border-gold/40 shadow-xs">
              SD
            </div>
            <div className="flex flex-col">
              <span className="font-display text-xs font-extrabold tracking-tight text-foreground leading-none">
                SWIFT DOC
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-gold mt-0.5">
                {role === "ADMIN" ? "Ops Command" : "Client Portal"}
              </span>
            </div>
          </Link>
        ) : (
          <div className="mx-auto flex size-7 items-center justify-center rounded-xs bg-ink text-gold font-serif font-black text-sm border border-gold/40">
            SD
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden xl:flex size-5 items-center justify-center rounded-xs border border-border bg-background text-muted-foreground hover:text-foreground hover:border-gold transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="size-3" /> : <ChevronLeft className="size-3" />}
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto scrollbar-none px-2 py-2 space-y-2">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-0.5">
            {!collapsed && section.title && (
              <div className="px-2 pt-1 pb-0.5 text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground/80">
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
                    "group relative flex items-center gap-2.5 rounded-xs px-2 py-1 text-[11px] font-semibold leading-tight transition-all duration-150",
                    active
                      ? "bg-gold/15 text-gold-dark dark:text-gold font-bold shadow-xs"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    collapsed && "justify-center px-1.5"
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-r-xs bg-gold" />
                  )}

                  <NavIcon
                    name={item.iconName}
                    className={cn(
                      "size-3.5 shrink-0 transition-colors",
                      active ? "text-gold" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />

                  {!collapsed && (
                    <span className="truncate">{item.title}</span>
                  )}

                  {!collapsed && item.badge !== undefined && (
                    <span className="ml-auto rounded-full bg-gold/20 px-1 py-0.1 text-[9px] font-bold text-gold-dark dark:text-gold">
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
      <div className="border-t border-border/70 p-2 bg-muted/20 shrink-0">
        {!collapsed ? (
          <div className="flex items-center justify-between gap-2">
            <Link
              href={role === "ADMIN" ? "/admin/settings" : "/client/profile"}
              className="flex items-center gap-2 overflow-hidden group hover:opacity-90 transition-opacity"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={displayName}
                  className="size-7 shrink-0 rounded-xs object-cover border border-gold/40"
                />
              ) : (
                <div className="flex size-7 shrink-0 items-center justify-center rounded-xs bg-gold/20 text-[11px] font-bold text-gold">
                  {displayName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col overflow-hidden text-left leading-tight">
                <span className="truncate text-xs font-bold text-foreground group-hover:text-gold transition-colors">
                  {displayName}
                </span>
                <span className="truncate text-[9px] text-muted-foreground">
                  {user?.email || "user@swiftdoc.co.ke"}
                </span>
              </div>
            </Link>

            <button
              onClick={() => logout()}
              className="p-1 rounded-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Sign Out"
              aria-label="Sign out"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <Link
              href={role === "ADMIN" ? "/admin/settings" : "/client/profile"}
              title="Account Settings"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={displayName}
                  className="size-6 rounded-xs object-cover border border-gold/40"
                />
              ) : (
                <div className="flex size-6 items-center justify-center rounded-xs bg-gold/20 text-[10px] font-bold text-gold">
                  {displayName.slice(0, 1).toUpperCase()}
                </div>
              )}
            </Link>
            <button
              onClick={() => logout()}
              className="p-1 rounded-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Sign Out"
              aria-label="Sign out"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
