"use client";

/**
 * Swift Doc — FAQ Accordion Component
 * Reusable FAQ section with optional FAQPage JSON-LD.
 */

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface FaqItemData {
  question: string;
  answer: string;
}

interface FaqSectionProps {
  faqs: FaqItemData[];
  title?: string;
  className?: string;
}

export function FaqSection({
  faqs,
  title = "Frequently Asked Questions",
  className,
}: FaqSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (faqs.length === 0) return null;

  return (
    <section className={cn("space-y-6", className)} id="faqs">
      <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
        {title}
      </h2>
      <div className="divide-y divide-border rounded-xs border border-border overflow-hidden">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={index} className="bg-card">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-foreground hover:bg-muted/40 transition-colors"
                aria-expanded={isOpen}
              >
                <span>{faq.question}</span>
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                    isOpen && "rotate-180"
                  )}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-3">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
