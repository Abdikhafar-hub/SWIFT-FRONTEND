"use client";

/**
 * Swift Doc — Table of Contents Component
 * Auto-generated TOC with smooth scrolling.
 */

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { List } from "lucide-react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  headings: TocItem[];
  className?: string;
}

export function TableOfContents({ headings, className }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-80px 0px -80% 0px" }
    );

    headings.forEach((heading) => {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav
      aria-label="Table of Contents"
      className={cn(
        "rounded-xs border border-border bg-card p-5 space-y-3",
        className
      )}
    >
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold">
        <List className="size-3.5" />
        <span>In this article</span>
      </div>
      <ul className="space-y-1.5 text-sm">
        {headings.map((heading) => (
          <li
            key={heading.id}
            style={{ paddingLeft: `${(heading.level - 2) * 12}px` }}
          >
            <a
              href={`#${heading.id}`}
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(heading.id);
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
              className={cn(
                "block py-1 text-muted-foreground hover:text-gold transition-colors",
                activeId === heading.id &&
                  "text-gold font-semibold border-l-2 border-gold pl-2 -ml-[2px]"
              )}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
