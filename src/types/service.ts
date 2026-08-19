/**
 * Swift Doc Service Catalog Domain Types
 */

import type { RequirementType } from "./requirement";

export interface ServiceCategory {
  id: string;
  organizationId?: string;
  code: string;
  slug: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  displayOrder: number;
  active: boolean;
  services?: Service[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceRequirement {
  id: string;
  serviceId: string;
  code: string;
  name: string;
  description?: string | null;
  type: RequirementType;
  required: boolean;
  options?: string[] | { label: string; value: string }[] | null;
  fileTypes?: string[] | null;
  maxFileSizeMb: number;
  displayOrder: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Service {
  id: string;
  organizationId?: string;
  categoryId: string;
  code: string;
  slug: string;
  name: string;
  description?: string | null;
  active: boolean;
  publiclyVisible: boolean;
  estimatedDuration?: string | null;
  slaHours: number;
  requiresGovernmentProcess: boolean;
  requiresDocumentReview: boolean;
  requiresPayment: boolean;
  governmentFee: number | string;
  serviceFee: number | string;
  totalFee?: number | string;
  basePrice?: number | string;
  authority?: string | null;
  estimatedTurnaroundDays?: number | string;
  currency: string;
  displayOrder: number;
  defaultGovernmentAgency?: string | null;
  defaultGovernmentPlatform?: string | null;
  requiresFullPaymentBeforeSubmission: boolean;
  requiresGovernmentTrackingNumber: boolean;
  requiresFinalDocument: boolean;
  pauseSlaOnGovernmentProcessing: boolean;
  pauseSlaOnClientAction: boolean;
  expiryValidityMonths?: number | null;
  createdAt?: string;
  updatedAt?: string;
  category?: ServiceCategory;
  requirements?: ServiceRequirement[];
}
