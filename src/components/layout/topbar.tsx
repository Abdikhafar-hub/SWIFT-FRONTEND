"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu, User, LogOut, ChevronRight, Phone } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/auth-context";
import { APP_CONFIG } from "@/lib/constants/config";

export function Topbar({
  role,
  onMenuClick,
}: {
  role: "CLIENT" | "ADMIN";
  onMenuClick?: () => void;
}) {
  const pathname = usePathname();
  const { user, client, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  const displayName = client?.fullName || (role === "ADMIN" ? "Operations Admin" : user?.email?.split("@")[0] || "User");

  // Generate breadcrumb items from pathname
  const pathSegments = pathname.split("/").filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = "/" + pathSegments.slice(0, index + 1).join("/");
    const label = segment
      .replace(/-/g, " ")
      .replace(/^([a-z])/, (m) => m.toUpperCase());
    return { href, label };
  });

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-border/80 bg-card/80 px-4 backdrop-blur-md sm:px-6">
      {/* Left: Mobile Menu + Breadcrumbs */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="flex lg:hidden p-2 rounded-xs border border-border text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors shrink-0"
          aria-label="Open mobile navigation"
        >
          <Menu className="size-5" />
        </button>

        {/* Mobile Page Title */}
        <div className="flex sm:hidden font-display text-xs font-bold text-foreground truncate max-w-[130px]">
          {breadcrumbs[breadcrumbs.length - 1]?.label || (role === "ADMIN" ? "Ops Command" : "Client Portal")}
        </div>

        {/* Desktop Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs truncate">
          <Link
            href={role === "ADMIN" ? "/admin" : "/client"}
            className="font-bold text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            {role === "ADMIN" ? "Ops Command" : "Swift Doc"}
          </Link>
          {breadcrumbs.map((bc, idx) => (
            <React.Fragment key={bc.href}>
              <ChevronRight className="size-3 text-muted-foreground/60 shrink-0" />
              <Link
                href={bc.href}
                className={cn(
                  "capitalize transition-colors truncate",
                  idx === breadcrumbs.length - 1
                    ? "font-bold text-foreground pointer-events-none"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {bc.label}
              </Link>
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right: Quick Actions, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Support Help Contact */}
        <a
          href={`tel:${APP_CONFIG.supportPhone.replace(/\s+/g, "")}`}
          className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-gold transition-colors py-1.5 px-2.5 rounded-xs border border-border/60 bg-muted/20"
        >
          <Phone className="size-3.5 text-gold" />
          <span>{APP_CONFIG.supportPhone}</span>
        </a>

        {/* Notifications Icon */}
        <Link
          href={role === "ADMIN" ? "/admin/notifications" : "/client/notifications"}
          className="relative p-2 rounded-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          aria-label="View notifications"
        >
          <Bell className="size-4" />
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-gold animate-pulse" />
        </Link>

        {/* User Profile Pill */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 rounded-xs border border-border/80 bg-card p-1 sm:p-1.5 sm:pr-3 hover:border-gold/60 transition-colors"
          >
            <div className="flex size-7 items-center justify-center rounded-xs bg-gold/20 text-xs font-bold text-gold shrink-0">
              {displayName.slice(0, 1).toUpperCase()}
            </div>
            <span className="hidden sm:inline text-xs font-bold text-foreground max-w-[120px] truncate">
              {displayName.split(" ")[0]}
            </span>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-52 sm:w-56 max-w-[calc(100vw-2rem)] rounded-xs border border-border bg-card p-2 shadow-lg z-50 animate-fadeIn">
              <div className="border-b border-border/60 px-3 py-2">
                <p className="text-xs font-bold text-foreground truncate">{displayName}</p>
                <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                <span className="mt-1 inline-block text-[10px] font-extrabold uppercase tracking-wider text-gold">
                  {role === "ADMIN" ? "Operations Admin" : "Verified Client"}
                </span>
              </div>

              <div className="py-1">
                <Link
                  href={role === "ADMIN" ? "/admin" : "/client/profile"}
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 rounded-xs px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
                >
                  <User className="size-3.5 text-muted-foreground" />
                  <span>Profile & Security</span>
                </Link>
              </div>

              <div className="border-t border-border/60 pt-1">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-xs px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="size-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
