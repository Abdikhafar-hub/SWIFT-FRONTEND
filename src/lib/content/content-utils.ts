/**
 * Swift Doc — File-System Content Utilities
 * Reads MDX/markdown content files from /content directory.
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { ContentFrontmatter, ContentItem, ContentType } from "./content-types";

const CONTENT_DIR = path.join(process.cwd(), "content");

/**
 * Get the directory path for a content type.
 */
function getContentDir(type: ContentType): string {
  return path.join(CONTENT_DIR, type);
}

/**
 * List all published (non-draft) content items of a type.
 * Sorted by publishedAt descending.
 */
export function getAllContent(type: ContentType): ContentItem[] {
  const dir = getContentDir(type);
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));

  const items: ContentItem[] = files
    .map((filename) => {
      const filePath = path.join(dir, filename);
      const raw = fs.readFileSync(filePath, "utf-8");
      const { data, content } = matter(raw);
      const slug = filename.replace(/\.mdx?$/, "");

      return {
        frontmatter: {
          ...data,
          slug: (data.slug as string) || slug,
        } as ContentFrontmatter,
        content,
        slug: (data.slug as string) || slug,
      };
    })
    .filter((item) => !item.frontmatter.draft);

  // Sort by publishedAt descending
  items.sort((a, b) => {
    const dateA = new Date(a.frontmatter.publishedAt || "2000-01-01").getTime();
    const dateB = new Date(b.frontmatter.publishedAt || "2000-01-01").getTime();
    return dateB - dateA;
  });

  return items;
}

/**
 * Get a single content item by slug.
 */
export function getContentBySlug(
  type: ContentType,
  slug: string
): ContentItem | null {
  const dir = getContentDir(type);
  const extensions = [".mdx", ".md"];

  for (const ext of extensions) {
    const filePath = path.join(dir, `${slug}${ext}`);
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      const { data, content } = matter(raw);
      return {
        frontmatter: {
          ...data,
          slug: (data.slug as string) || slug,
        } as ContentFrontmatter,
        content,
        slug: (data.slug as string) || slug,
      };
    }
  }

  return null;
}

/**
 * Get all content slugs for a type (for generateStaticParams).
 */
export function getAllContentSlugs(type: ContentType): string[] {
  const items = getAllContent(type);
  return items.map((item) => item.slug);
}

/**
 * Find related content by matching tags.
 */
export function getRelatedContent(
  type: ContentType,
  tags: string[],
  currentSlug: string,
  limit: number = 3
): ContentItem[] {
  const all = getAllContent(type);
  const tagSet = new Set(tags.map((t) => t.toLowerCase()));

  return all
    .filter((item) => item.slug !== currentSlug)
    .map((item) => {
      const matchCount = (item.frontmatter.tags || []).filter((t) =>
        tagSet.has(t.toLowerCase())
      ).length;
      return { item, matchCount };
    })
    .filter(({ matchCount }) => matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount)
    .slice(0, limit)
    .map(({ item }) => item);
}

/**
 * Get content items by category.
 */
export function getContentByCategory(
  type: ContentType,
  category: string
): ContentItem[] {
  return getAllContent(type).filter(
    (item) =>
      item.frontmatter.category.toLowerCase() === category.toLowerCase()
  );
}

/**
 * Get all unique categories for a content type.
 */
export function getAllCategories(type: ContentType): string[] {
  const items = getAllContent(type);
  const cats = new Set(items.map((item) => item.frontmatter.category));
  return Array.from(cats).sort();
}

/**
 * Convert markdown content to simple HTML.
 * Uses remark for processing.
 */
export async function markdownToHtml(markdown: string): Promise<string> {
  const { remark } = await import("remark");
  const remarkHtml = (await import("remark-html")).default;

  const result = await remark().use(remarkHtml).process(markdown);
  return result.toString();
}
