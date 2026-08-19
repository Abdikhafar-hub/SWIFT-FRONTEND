"use client";

import React from "react";
import Link from "next/link";
import { Phone, Shield, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_CONFIG } from "@/lib/constants/config";
import { useAuth } from "@/lib/auth/auth-context";

export function PublicHeader() {
  const { isAuthenticated, role } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/90 backdrop-blur-md">
      {/* Top microbar */}
      <div className="border-b border-border/40 bg-ink px-4 py-1.5 text-xs text-white sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4 text-[11px] text-white/80">
            <span className="flex items-center gap-1.5">
              <Shield className="size-3 text-gold" />
              Official Kenyan Document & Registration Specialists
            </span>
            <span className="hidden md:inline text-white/40">|</span>
            <span className="hidden md:inline">Unga House, Westlands, Nairobi</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <a
              href={`tel:${APP_CONFIG.supportPhone.replace(/\s+/g, "")}`}
              className="flex items-center gap-1 font-bold text-gold hover:underline"
            >
              <Phone className="size-3" />
              <span>{APP_CONFIG.supportPhone}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xs bg-ink text-gold font-serif font-black text-xl border border-gold/40 shadow-xs">
            SD
          </div>
          <div className="flex flex-col">
            <span className="font-display text-base font-extrabold tracking-tight text-foreground">
              SWIFT DOC
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Statutory Services
            </span>
          </div>
        </Link>

        {/* Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-foreground/80">
          <Link href="/services" className="hover:text-gold transition-colors">
            Services
          </Link>
          <Link href="/blog" className="hover:text-gold transition-colors">
            Blog
          </Link>
          <Link href="/guides" className="hover:text-gold transition-colors">
            Guides
          </Link>
          <Link href="/about" className="hover:text-gold transition-colors">
            About
          </Link>
          <Link href="/contact" className="hover:text-gold transition-colors">
            Contact
          </Link>
        </nav>

        {/* Auth CTAs */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              href={role === "ADMIN" ? "/admin" : "/client"}
              className="inline-flex items-center gap-2 rounded-xs bg-gold px-4 py-2 text-xs font-bold text-ink hover:bg-gold-dark transition-all shadow-xs"
            >
              <span>{role === "ADMIN" ? "Ops Command" : "Client Portal"}</span>
              <ArrowRight className="size-3.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center text-xs font-bold text-foreground hover:text-gold transition-colors px-3 py-2"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xs bg-gold px-4 py-2 text-xs font-bold text-ink hover:bg-gold-dark transition-all shadow-xs"
              >
                <span>Client Registration</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-ink text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xs bg-card text-gold font-serif font-black text-xl border border-gold/40">
                SD
              </div>
              <span className="font-display text-lg font-bold tracking-tight text-white">
                SWIFT DOC
              </span>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              {APP_CONFIG.legalName}. Kenyan company registrations, tax compliance, statutory filings, and government documentation.
            </p>
            <p className="text-xs text-white/50">{APP_CONFIG.address}</p>
          </div>

          <div>
            <h4 className="font-display text-xs font-bold uppercase tracking-wider text-gold mb-4">
              Statutory Services
            </h4>
            <ul className="space-y-2 text-xs text-white/70">
              <li><Link href="/services/company-registration" className="hover:text-gold">Company Registration</Link></li>
              <li><Link href="/services/kra-services" className="hover:text-gold">KRA PIN & Tax Services</Link></li>
              <li><Link href="/services/tax-compliance" className="hover:text-gold">Tax Compliance Certificate</Link></li>
              <li><Link href="/services/nssf-services" className="hover:text-gold">NSSF Services</Link></li>
              <li><Link href="/services/sha-services" className="hover:text-gold">SHA Services</Link></li>
              <li><Link href="/services" className="hover:text-gold">View All Services →</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-xs font-bold uppercase tracking-wider text-gold mb-4">
              Resources & Company
            </h4>
            <ul className="space-y-2 text-xs text-white/70">
              <li><Link href="/blog" className="hover:text-gold">Blog</Link></li>
              <li><Link href="/guides" className="hover:text-gold">Guides</Link></li>
              <li><Link href="/faqs" className="hover:text-gold">FAQs</Link></li>
              <li><Link href="/about" className="hover:text-gold">About Swift Doc</Link></li>
              <li><Link href="/contact" className="hover:text-gold">Contact & Location</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-gold">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-gold">Terms of Service</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-xs font-bold uppercase tracking-wider text-gold mb-4">
              Client Support
            </h4>
            <p className="text-xs text-white/70 leading-relaxed">
              Assistance available Monday through Friday, 8:00 AM to 5:00 PM EAT.
            </p>
            <p className="mt-2 text-xs font-bold text-gold">{APP_CONFIG.supportPhone}</p>
            <p className="text-xs text-white/70">{APP_CONFIG.supportEmail}</p>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-white/50">
          <p>© {new Date().getFullYear()} {APP_CONFIG.legalName}. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Compliant with Kenya Data Protection Act 2019</p>
        </div>
      </div>
    </footer>
  );
}

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
