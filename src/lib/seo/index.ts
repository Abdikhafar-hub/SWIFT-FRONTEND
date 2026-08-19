/**
 * Swift Doc — SEO Utilities Barrel Export
 */

export { SEO_CONFIG } from "./seo-config";
export { getCanonicalUrl, isIndexablePath } from "./canonical";
export {
  createPageMetadata,
  createServiceMetadata,
  createArticleMetadata,
} from "./metadata";
export type {
  PageMetadataOptions,
  ServiceMetadataInput,
  ArticleMetadataInput,
} from "./metadata";
export {
  createOrganizationSchema,
  createWebSiteSchema,
  createLocalBusinessSchema,
  createServiceSchema,
  createBreadcrumbSchema,
  createFaqSchema,
  createArticleSchema,
  createCollectionPageSchema,
} from "./schema";
export type {
  BreadcrumbItem,
  FaqItem,
  ServiceSchemaInput,
  ArticleSchemaInput,
  LocalBusinessInput,
} from "./schema";
