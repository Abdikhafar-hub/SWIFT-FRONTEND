/**
 * Swift Doc — Article Author & Date Display
 * E-E-A-T compliance: shows author, publication date, and update date.
 */

import React from "react";
import { Calendar, RefreshCw, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ArticleAuthorProps {
  author: string;
  authorRole?: string;
  publishedAt: string;
  updatedAt?: string;
  reviewedAt?: string;
  className?: string;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-KE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function ArticleAuthor({
  author,
  authorRole,
  publishedAt,
  updatedAt,
  className,
}: ArticleAuthorProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground",
        className
      )}
    >
      <div className="flex items-center gap-1.5">
        <User className="size-3.5" />
        <span className="font-semibold text-foreground">{author}</span>
        {authorRole && (
          <span className="text-muted-foreground/70">· {authorRole}</span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <Calendar className="size-3.5" />
        <time dateTime={publishedAt}>
          Published {formatDate(publishedAt)}
        </time>
      </div>

      {updatedAt && updatedAt !== publishedAt && (
        <div className="flex items-center gap-1.5">
          <RefreshCw className="size-3.5" />
          <time dateTime={updatedAt}>
            Updated {formatDate(updatedAt)}
          </time>
        </div>
      )}
    </div>
  );
}
