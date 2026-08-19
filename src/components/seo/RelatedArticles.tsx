/**
 * Swift Doc — Related Articles Component
 * Internal linking block that displays related blog/guide cards.
 */

import React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, FileText } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface RelatedArticleItem {
  slug: string;
  title: string;
  description: string;
  type: "blog" | "guides";
  readingTime?: string;
}

interface RelatedArticlesProps {
  articles: RelatedArticleItem[];
  title?: string;
  className?: string;
}

export function RelatedArticles({
  articles,
  title = "Related Articles",
  className,
}: RelatedArticlesProps) {
  if (articles.length === 0) return null;

  return (
    <section className={cn("space-y-4", className)}>
      <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground">
        {title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {articles.map((article) => (
          <Link
            key={article.slug}
            href={`/${article.type}/${article.slug}`}
            className="group flex flex-col rounded-xs border border-border bg-card p-4 hover:border-gold hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gold mb-2">
              {article.type === "blog" ? (
                <FileText className="size-3" />
              ) : (
                <BookOpen className="size-3" />
              )}
              <span>{article.type === "blog" ? "Blog" : "Guide"}</span>
            </div>
            <h3 className="text-sm font-bold text-foreground group-hover:text-gold transition-colors line-clamp-2">
              {article.title}
            </h3>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed line-clamp-2 flex-1">
              {article.description}
            </p>
            <div className="mt-3 flex items-center justify-between text-xs">
              {article.readingTime && (
                <span className="text-muted-foreground">
                  {article.readingTime}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-gold font-semibold group-hover:gap-2 transition-all">
                Read <ArrowRight className="size-3" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
