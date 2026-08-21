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
  | "DRAFT"
  | "PENDING_APPROVAL"
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
  reasonCategory?: string | null;
  refundMethod?: PaymentMethod | string;
  status: RefundStatus;
  
  recipientPhone?: string | null;
  bankName?: string | null;
  accountHolder?: string | null;
  accountNumber?: string | null;
  referenceDetails?: string | null;

  internalNotes?: string | null;
  supportingDocumentUrl?: string | null;
  clientExplanation?: string | null;

  requestedById: string;
  approvedById?: string | null;
  approvedAt?: string | null;
  processingStartedAt?: string | null;
  processedAt?: string | null;
  completedById?: string | null;
  completedAt?: string | null;
  rejectedById?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  cancelledById?: string | null;
  cancelledAt?: string | null;
  failedAt?: string | null;
  failureReason?: string | null;
  externalReference?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt?: string;

  requestedBy?: User;
  approvedBy?: User | null;
  completedBy?: User | null;
  rejectedBy?: User | null;
  client?: ClientProfile | null;
  payment?: Payment | null;
  transaction?: PaymentTransaction | null;
  auditLogs?: any[];
  financialSummary?: {
    invoiceTotal: number | string;
    amountPaid: number | string;
    previousRefundsTotal: number | string;
    currentRefundAmount: number | string;
    remainingRefundableBalance: number | string;
  };
}

export interface EligibleRefundSource {
  paymentId: string;
  invoiceNumber: string;
  totalAmount: number | string;
  amountPaid: number | string;
  amountDue: number | string;
  previouslyRefunded: number | string;
  remainingRefundable: number | string;
  client: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    clientNumber?: string;
  };
  application?: {
    id: string;
    applicationNumber: string;
    service?: { title: string };
  };
  transactions: Array<{
    id: string;
    transactionNumber: string;
    paymentMethod: PaymentMethod;
    amount: number | string;
    paidAt?: string;
    externalReference?: string;
    phoneNumber?: string;
  }>;
  refunds: Array<{
    id: string;
    amount: number | string;
    status: RefundStatus;
  }>;
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

export type UpdateDraftInvoicePayload = Partial<CreateInvoicePayload>;

export interface IssueInvoicePayload {
  notes?: string;
  dueAt?: string;
}

export interface CancelInvoicePayload {
  reason: string;
}

export interface FinancialAdjustmentPayload {
  paymentId?: string;
  adjustmentType?: AdjustmentType;
  type?: AdjustmentType;
  amount: number;
  reason: string;
}

export interface FinancialSummaryData {
  totalRevenue?: number | string;
  totalCollected?: number | string;
  totalOutstanding?: number | string;
  totalOverdue?: number | string;
  totalPending?: number | string;
  byMethod?: Record<string, number>;
  metrics: {
    totalInvoiced: number | string;
    totalInvoices: number;
    totalCollected: number | string;
    totalOutstanding: number | string;
    totalOverdue: number | string;
    overdueInvoicesCount: number;
    totalRefunded: number | string;
    netRevenue: number | string;
    breakdown?: {
      governmentFees?: number | string;
      serviceFees?: number | string;
      tax?: number | string;
      discounts?: number | string;
    };
  };
}

export interface FinancialCollectionsData {
  collectionsByMethod?: Array<{
    method: PaymentMethod;
    transactionCount: number;
    totalAmount: number | string;
  }>;
  aging?: any;
  collectionRate?: any;
}

export interface OutstandingInvoicesQuery {
  page?: number;
  limit?: number;
  agingBucket?: AgingBucket;
  search?: string;
}

export interface ReverseTransactionPayload {
  transactionId?: string;
  reason: string;
  notes?: string;
}

export interface IngestStatementPayload {
  bankName?: string;
  fileUrl?: string;
  rawText?: string;
  entries?: any[];
  reference?: string;
  amount?: number;
  provider?: string;
  notes?: string;
}

export interface ManualResolvePayload {
  reconciliationId?: string;
  resolution?: string;
  status?: string;
  transactionId?: string;
  matchedTransactionId?: string;
  resolutionStatus?: string;
  resolvedTransactionId?: string;
  notes?: string;
}


export interface InitiateRefundPayload {
  paymentId: string;
  transactionId: string;
  amount: number;
  reason: string;
  reasonCategory?: string;
  refundMethod?: PaymentMethod;
  recipientPhone?: string;
  bankName?: string;
  accountHolder?: string;
  accountNumber?: string;
  referenceDetails?: string;
  internalNotes?: string;
  supportingDocumentUrl?: string;
  clientExplanation?: string;
}

export type RequestRefundPayload = InitiateRefundPayload;

export interface ApproveRefundPayload {
  notes?: string;
}

export interface ProcessRefundPayload {
  notes?: string;
  externalReference?: string;
}

export interface CompleteRefundPayload {
  notes?: string;
  externalReference?: string;
}

export interface RejectRefundPayload {
  reason: string;
}

export interface CancelRefundPayload {
  reason?: string;
}

export type AgingBucket = string;

export interface OutstandingInvoice extends Payment {
  daysOverdue?: number;
  agingBucket?: AgingBucket;
  outstandingBalance?: number;
  balanceRemaining?: number;
}

