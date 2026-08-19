"use client";

/**
 * Swift Doc — Service Detail Client Component
 * Handles interactive elements on individual service pages.
 */

import React from "react";
import Link from "next/link";
import { ArrowRight, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { FaqSection } from "@/components/seo/FaqSection";
import type { ServiceSeoData } from "@/../content/services";
import { trackServiceCtaClick } from "@/lib/analytics/analytics";

interface ServiceDetailClientProps {
  service: ServiceSeoData;
}

export function ServiceDetailClient({ service }: ServiceDetailClientProps) {
  return (
    <div className="space-y-12">
      {/* Introduction */}
      <section id="overview">
        <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-3">
          About {service.name}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {service.introduction}
        </p>
      </section>

      {/* Who Is It For */}
      <section id="who-is-it-for">
        <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-3">
          Who Is This Service For?
        </h2>
        <ul className="space-y-2">
          {service.whoIsItFor.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="size-4 text-emerald-brand shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* What It Involves */}
      <section id="what-it-involves">
        <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-3">
          What Does {service.name} Involve?
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {service.whatItInvolves}
        </p>
      </section>

      {/* Requirements */}
      <section id="requirements">
        <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-3">
          Documents & Requirements
        </h2>
        <div className="rounded-xs border border-border bg-card p-5">
          <ul className="space-y-2.5">
            {service.requirements.map((req, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold text-[10px] font-bold mt-0.5">
                  {i + 1}
                </span>
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Process / Steps */}
      <section id="process">
        <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-3">
          Process & Steps
        </h2>
        <div className="space-y-4">
          {service.process.map((step) => (
            <div key={step.step} className="flex gap-4">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xs bg-ink text-gold font-display font-bold text-sm border border-gold/40">
                {step.step}
              </div>
              <div className="flex-1 pt-0.5">
                <h3 className="text-sm font-bold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Government / Statutory Body */}
      <section id="government-body">
        <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-3">
          Government & Statutory Authority
        </h2>
        <div className="rounded-xs border border-border bg-sand p-5">
          <p className="text-sm text-foreground">
            This service is processed through the{" "}
            <strong>{service.governmentBody}</strong>
            {service.governmentPlatform && (
              <> via the <strong>{service.governmentPlatform}</strong> platform</>
            )}
            .
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Swift Doc prepares and manages the application process on behalf of
            clients. All submissions are made through official government
            channels.
          </p>
        </div>
      </section>

      {/* Fees */}
      {service.fees && service.fees.length > 0 && (
        <section id="fees">
          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-3">
            Fees & Cost Information
          </h2>
          <div className="space-y-3">
            {service.fees.map((fee, i) => (
              <div key={i} className="rounded-xs border border-border bg-card p-4">
                <p className="text-sm text-foreground">{fee.description}</p>
                {fee.note && (
                  <p className="mt-1 text-xs text-muted-foreground italic">
                    {fee.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Common Mistakes */}
      <section id="common-mistakes">
        <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-3">
          Common Mistakes to Avoid
        </h2>
        <div className="rounded-xs border border-destructive/20 bg-destructive/5 p-5">
          <ul className="space-y-2.5">
            {service.commonMistakes.map((mistake, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <AlertTriangle className="size-4 text-destructive shrink-0 mt-0.5" />
                <span>{mistake}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQs */}
      {service.faqs.length > 0 && (
        <FaqSection faqs={service.faqs} />
      )}

      {/* CTA */}
      <div className="rounded-xs bg-ink p-8 sm:p-10 text-center space-y-4 border border-gold/30">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
          Ready to start your {service.name.toLowerCase()}?
        </h2>
        <p className="text-sm text-white/70 max-w-lg mx-auto">
          Create your Swift Doc account and begin your statutory filing.
          Our team will guide you through the process.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link href="/register">
            <Button
              variant="gold"
              size="md"
              rightIcon={<ArrowRight className="size-4" />}
              onClick={() => trackServiceCtaClick(service.slug)}
            >
              Start Your Filing
            </Button>
          </Link>
          <Link href="/contact">
            <Button
              variant="outline"
              size="md"
              className="border-white/30 text-white hover:bg-white/10 hover:border-gold"
            >
              Contact Swift Doc
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
