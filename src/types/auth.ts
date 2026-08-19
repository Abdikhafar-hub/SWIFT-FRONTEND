/**
 * Swift Doc Authentication & User Profile Types
 * Exactly two roles supported: CLIENT and ADMIN
 */

export type UserRole = "CLIENT" | "ADMIN";

export type ClientType = "INDIVIDUAL" | "BUSINESS" | "ORGANIZATION";

export type CommunicationChannel = "EMAIL" | "SMS" | "IN_APP" | "WHATSAPP";

export interface OrganizationInfo {
  id: string;
  name: string;
  slug: string;
  currency: string;
}

export interface ClientProfile {
  id: string;
  organizationId?: string;
  userId?: string | null;
  clientNumber: string;
  clientType: ClientType;
  fullName: string;
  businessName?: string | null;
  email: string;
  phone: string;
  alternatePhone?: string | null;
  nationality?: string;
  nationalId?: string | null;
  idNumber?: string | null;
  passportNumber?: string | null;
  kraPin?: string | null;
  address?: string | null;
  county?: string | null;
  city?: string | null;
  postalAddress?: string | null;
  preferredCommunicationChannel?: CommunicationChannel;
  isDuplicateFlagged?: boolean;
  duplicateReason?: string | null;
  isReviewed?: boolean;
  reviewedAt?: string | null;
  reviewedById?: string | null;
  reviewNotes?: string | null;
  reviewedBy?: { id: string; email: string; fullName?: string } | null;
  user?: {
    id: string;
    email: string;
    isEmailVerified: boolean;
    lastLoginAt?: string | null;
    createdAt?: string;
  } | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  organizationId?: string;
  email: string;
  fullName?: string | null;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
  organization?: OrganizationInfo;
  clientProfile?: ClientProfile | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn?: string;
}

export interface LoginResponseData {
  user: User;
  client: ClientProfile | null;
  tokens: AuthTokens;
}

export interface RegisterResponseData {
  user: User;
  client: ClientProfile;
  tokens: AuthTokens;
}

export interface RefreshResponseData {
  tokens: AuthTokens;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  clientType?: ClientType;
  businessName?: string;
  nationalId?: string;
  passportNumber?: string;
  kraPin?: string;
  address?: string;
  county?: string;
  city?: string;
  preferredChannel?: CommunicationChannel;
}

export interface PasswordResetRequestPayload {
  email: string;
}

export interface PasswordResetConfirmPayload {
  token: string;
  newPassword: string;
}

export interface UpdateClientProfilePayload {
  clientType?: ClientType;
  fullName?: string;
  businessName?: string | null;
  phone?: string;
  alternatePhone?: string | null;
  nationality?: string;
  nationalId?: string | null;
  passportNumber?: string | null;
  kraPin?: string | null;
  address?: string | null;
  county?: string | null;
  city?: string | null;
  postalAddress?: string | null;
  preferredCommunicationChannel?: CommunicationChannel;
}

export interface VerifyOtpPayload {
  code: string;
}

export interface VerifyOtpResponseData {
  success: boolean;
  isEmailVerified: boolean;
  message: string;
}

export interface AuthState {
  user: User | null;
  client: ClientProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: UserRole | null;
}

