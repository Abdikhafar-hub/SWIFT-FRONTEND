/**
 * Swift Doc Financial & Payment Domain Types
 * Invoicing, M-Pesa STK push, Receipts, Refunds, Reconciliation
 */

import type { User, ClientProfile } from "./auth";

export type PaymentMethod = "MPESA" | "CASH" | "BANK" | "CARD" | "OTHER";

export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED"
  | "REVERSED"
  | "DRAFT"
  | "ISSUED"
  | "PAYMENT_UNDER_REVIEW"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "VOID";

export type PaymentTransactionStatus = PaymentStatus;

export type TransactionType = "PAYMENT" | "REVERSAL" | "REFUND";

export type RefundStatus =
  | "REQUESTED"
  | "APPROVED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "REJECTED";

export type ReconciliationStatus =
  | "MATCHED"
  | "UNMATCHED"
  | "DUPLICATE"
  | "SUSPICIOUS"
  | "REVERSED"
  | "RESOLVED"
  | "DISCREPANCY";

export type InvoiceLineItemCategory =
  | "GOVERNMENT_FEE"
  | "SERVICE_FEE"
  | "EXPEDITED_FEE"
  | "COURIER_FEE"
  | "DOCUMENT_AUTHENTICATION"
  | "ADDITIONAL_SERVICE"
  | "TAX"
  | "DISCOUNT"
  | "OTHER";

export interface InvoiceLineItem {
  id: string;
  paymentId: string;
  description: string;
  category: InvoiceLineItemCategory;
  quantity: number;
  unitAmount: number | string;
  totalAmount: number | string;
  isGovernmentFee: boolean;
  isTaxable: boolean;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface PaymentTransaction {
  id: string;
  paymentId: string;
  organizationId?: string;
  clientId: string;
  applicationId?: string | null;
  transactionNumber: string;
  transactionType: TransactionType;
  paymentMethod: PaymentMethod;
  channel?: string;
  amount: number | string;
  currency: string;
  status: PaymentStatus;
  idempotencyKey: string;
  externalReference?: string | null;
  providerReference?: string | null;
  providerRef?: string | null;
  transactionRef?: string | null;
  reference?: string | null;
  checkoutRequestId?: string | null;
  mpesaReceiptNumber?: string | null;
  phoneNumber?: string | null;
  payerPhone?: string | null;
  paidAt?: string | null;
  completedAt?: string | null;
  reversalReason?: string | null;
  reversedAt?: string | null;
  reversedBy?: any | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  client?: ClientProfile | null;
  payment?: Payment | null;
  application?: any | null;
}

export interface Receipt {
  id: string;
  organizationId?: string;
  clientId: string;
  applicationId: string;
  paymentId: string;
  transactionId: string;
  receiptNumber: string;
  amount: number | string;
  currency: string;
  paymentMethod: PaymentMethod;
  transactionReference?: string | null;
  payerName: string;
  amountPaid: number | string;
  remainingBalance: number | string;
  issuedAt: string;
  createdAt: string;
  client?: ClientProfile | null;
  payment?: Payment | null;
  transaction?: PaymentTransaction | null;
}

export interface Refund {
  id: string;
  organizationId?: string;
  clientId: string;
  paymentId: string;
  transactionId: string;
  refundNumber: string;
  amount: number | string;
  currency: string;
  reason: string;
  status: RefundStatus;
  requestedById: string;
  approvedById?: string | null;
  rejectionReason?: string | null;
  paymentMethod?: PaymentMethod | string;
  processedAt?: string | null;
  createdAt: string;
  requestedBy?: User;
  approvedBy?: User | null;
  client?: ClientProfile | null;
  payment?: Payment | null;
  transaction?: PaymentTransaction | null;
}

export interface ReconciliationRecord {
  id: string;
  organizationId?: string;
  reference: string;
  statementReference?: string | null;
  statementAmount?: number | string | null;
  statementDescription?: string | null;
  statementDate?: string | null;
  accountNumber?: string | null;
  bankName?: string | null;
  ledgerAmount?: number | string | null;
  difference?: number | null;
  description?: string | null;
  transactionId?: string | null;
  amount: number | string;
  currency: string;
  provider: string;
  status: ReconciliationStatus;
  reconciledAt?: string | null;
  reconciledById?: string | null;
  notes?: string | null;
  createdAt: string;
  transaction?: PaymentTransaction | null;
}

export interface Payment {
  id: string;
  organizationId?: string;
  clientId: string;
  applicationId: string;
  invoiceNumber: string;
  currency: string;
  subtotal: number | string;
  governmentFee: number | string;
  serviceFee: number | string;
  otherFee: number | string;
  discount: number | string;
  tax: number | string;
  totalAmount: number | string;
  amountPaid: number | string;
  amountDue: number | string;
  status: PaymentStatus;
  isOverdue: boolean;
  notes?: string | null;
  issuedAt?: string | null;
  dueAt?: string | null;
  paidAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  amount?: number | string;
  paidAmount?: number | string;
  balanceRemaining?: number | string;
  dueDate?: string | null;
  description?: string | null;
  registryFee?: number | string;
  convenienceFee?: number | string;
  user?: any;
  lineItems?: InvoiceLineItem[];
  transactions?: PaymentTransaction[];
  receipts?: Receipt[];
  refunds?: Refund[];
  application?: any;
  client?: ClientProfile | null;
}

export interface InitiateMpesaStkPayload {
  paymentId: string;
  phoneNumber: string;
  amount?: number;
}

export interface RecordManualPaymentPayload {
  paymentId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  externalReference?: string;
  notes?: string;
}

export type AdjustmentType = "DISCOUNT" | "PENALTY" | "WAIVER" | "ROUNDING" | "OTHER";

export interface CreateInvoiceLineItemInput {
  description: string;
  category?: InvoiceLineItemCategory;
  quantity?: number;
  unitAmount: number;
  isGovernmentFee?: boolean;
  isTaxable?: boolean;
  metadata?: Record<string, unknown>;
}

export interface CreateInvoicePayload {
  applicationId: string;
  clientId?: string;
  lineItems?: CreateInvoiceLineItemInput[];
  governmentFee?: number;
  serviceFee?: number;
  otherFee?: number;
  discount?: number;
  tax?: number;
  dueAt?: string;
  notes?: string;
  status?: PaymentStatus;
}

export interface UpdateDraftInvoicePayload {
  lineItems?: CreateInvoiceLineItemInput[];
  discount?: number;
  tax?: number;
  dueAt?: string;
  notes?: string;
}

export interface IssueInvoicePayload {
  dueAt?: string;
  notes?: string;
}

export interface CancelInvoicePayload {
  reason: string;
}

export interface FinancialAdjustmentPayload {
  type: AdjustmentType;
  amount: number;
  reason: string;
}

export interface FinancialSummaryMetrics {
  totalInvoices: number;
  totalInvoiced: string;
  totalCollected: string;
  totalOutstanding: string;
  totalOverdue: string;
  overdueInvoicesCount: number;
  totalRefunded: string;
  refundCount: number;
  netRevenue: string;
  breakdown: {
    governmentFees: string;
    serviceFees: string;
    tax: string;
    discounts: string;
  };
}

export interface FinancialSummaryData {
  metrics: FinancialSummaryMetrics;
  statusDistribution: Record<string, number>;
  totalCollected?: string | number;
  totalInvoiced?: string | number;
  totalOutstanding?: string | number;
  totalRevenue?: string | number;
  totalPending?: string | number;
  totalOverdue?: string | number;
  byMethod?: Record<string, number>;
  recentTransactions: Array<{
    id: string;
    transactionNumber: string;
    paymentMethod: PaymentMethod;
    amount: string | number;
    externalReference?: string | null;
    paidAt?: string | null;
    client?: { fullName: string; clientNumber?: string | null };
    payment?: { invoiceNumber: string };
  }>;
}

export interface FinancialCollectionsData {
  collectionsByMethod?: Array<{
    method: PaymentMethod;
    totalAmount: string;
    transactionCount: number;
  }>;
  aging?: {
    under30Days?: { count: number; amount: number | string };
    days30To60?: { count: number; amount: number | string };
    days60To90?: { count: number; amount: number | string };
    over90Days?: { count: number; amount: number | string };
    totalOutstanding?: { count: number; amount: number | string };
    [key: string]: any;
  };
  collectionRate?: number | string;
  totalCollected?: number | string;
  totalOutstanding?: number | string;
}

export interface OutstandingInvoice extends Payment {
  daysOverdue: number;
  agingBucket: string;
  outstandingBalance?: number | string;
  balanceRemaining?: number | string;
  amount?: number | string;
  dueDate?: string | null;
}

export type AgingBucket =
  | "1-7"
  | "8-14"
  | "15-30"
  | "30+"
  | "CURRENT"
  | "30_TO_60"
  | "60_TO_90"
  | "OVER_90"
  | string;

export interface OutstandingInvoicesQuery {
  page?: number;
  limit?: number;
  agingBucket?: AgingBucket;
  search?: string;
}

export interface ReverseTransactionPayload {
  reason: string;
}

export interface RequestRefundPayload {
  paymentId: string;
  transactionId: string;
  amount: number;
  reason: string;
}

export interface ApproveRefundPayload {
  notes?: string;
}

export interface RejectRefundPayload {
  reason: string;
}

export interface IngestStatementPayload {
  reference: string;
  amount: number;
  provider?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface ManualResolvePayload {
  transactionId?: string;
  matchedTransactionId?: string;
  notes?: string;
  status?: ReconciliationStatus;
}

