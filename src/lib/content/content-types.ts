/**
 * Swift Doc — Content System Type Definitions
 */

export interface ContentFrontmatter {
  title: string;
  slug: string;
  description: string;
  excerpt: string;
  author: string;
  authorRole?: string;
  publishedAt: string;
  updatedAt?: string;
  reviewedAt?: string;
  category: string;
  tags: string[];
  featuredImage?: string;
  canonicalUrl?: string;
  readingTime?: string;
  relatedServices?: string[];
  relatedArticles?: string[];
  draft?: boolean;
  seoTitle?: string;
  seoDescription?: string;
}

export interface ContentItem {
  frontmatter: ContentFrontmatter;
  content: string;
  slug: string;
}

export type ContentType = "blog" | "guides" | "resources";
