/**
 * Swift Doc Financial, Invoices, Receipts & Payments API Client
 */

import { apiClient } from "./client";
import type {
  ApiResponse,
  PaginatedResult,
  QueryPaginationParams,
  Payment,
  PaymentTransaction,
  Receipt,
  Refund,
  InitiateMpesaStkPayload,
  RecordManualPaymentPayload,
} from "@/types";

export interface InvoiceStatusResponse {
  id: string;
  invoiceNumber: string;
  status: string;
  subtotal: number | string;
  tax: number | string;
  totalAmount: number | string;
  amountPaid: number | string;
  amountDue: number | string;
  isPaid: boolean;
  paidAt?: string | null;
  transactions?: PaymentTransaction[];
}

export const paymentsApi = {
  /**
   * Fetch invoices for authenticated client
   */
  async getInvoices(
    params?: QueryPaginationParams & { status?: string; search?: string }
  ): Promise<PaginatedResult<Payment>> {
    const res = await apiClient.get<ApiResponse<PaginatedResult<Payment>>>("/client/invoices", {
      params,
    });
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch invoices");
    }
    return res.data.data;
  },

  /**
   * Fetch a single invoice with line items, transactions, and receipts
   */
  async getInvoiceById(id: string): Promise<Payment> {
    const res = await apiClient.get<ApiResponse<Payment>>(`/client/invoices/${id}`);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch invoice details");
    }
    return res.data.data;
  },

  /**
   * Fetch transactions for a specific invoice
   */
  async getInvoiceTransactions(id: string): Promise<PaymentTransaction[]> {
    const res = await apiClient.get<ApiResponse<PaymentTransaction[]>>(
      `/client/invoices/${id}/transactions`
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch invoice transactions");
    }
    return res.data.data;
  },

  /**
   * Trigger M-Pesa STK Push on an invoice
   */
  async payInvoiceMpesa(
    invoiceId: string,
    payload: { phoneNumber: string; amount?: number; idempotencyKey?: string }
  ): Promise<{ transactionId?: string; checkoutRequestId?: string; customerMessage?: string; status?: string }> {
    const res = await apiClient.post<ApiResponse<any>>(
      `/client/invoices/${invoiceId}/pay-mpesa`,
      payload
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to initiate M-Pesa STK push");
    }
    return res.data.data;
  },

  /**
   * Check real-time settlement status & balance of an invoice
   */
  async getInvoiceStatus(id: string): Promise<InvoiceStatusResponse> {
    const res = await apiClient.get<ApiResponse<InvoiceStatusResponse>>(
      `/client/invoices/${id}/status`
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to check invoice status");
    }
    return res.data.data;
  },

  /**
   * Fetch receipts for authenticated client
   */
  async getReceipts(params?: QueryPaginationParams): Promise<PaginatedResult<Receipt> | Receipt[]> {
    const res = await apiClient.get<ApiResponse<any>>("/client/receipts", { params });
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch receipts");
    }
    return res.data.data?.items || res.data.data || [];
  },

  /**
   * Fetch a single receipt by ID
   */
  async getReceiptById(id: string): Promise<Receipt> {
    const res = await apiClient.get<ApiResponse<Receipt>>(`/client/receipts/${id}`);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch receipt details");
    }
    return res.data.data;
  },

  /**
   * Fetch client payment transactions history
   */
  async getTransactions(
    params?: QueryPaginationParams & { status?: string; search?: string }
  ): Promise<PaginatedResult<PaymentTransaction>> {
    const res = await apiClient.get<ApiResponse<PaginatedResult<PaymentTransaction>>>(
      "/client/payments",
      { params }
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch transactions");
    }
    return res.data.data;
  },

  /**
   * Legacy alias: Fetch all payments
   */
  async getPayments(
    params?: QueryPaginationParams & { clientId?: string; status?: string }
  ): Promise<PaginatedResult<Payment>> {
    return this.getInvoices(params);
  },

  /**
   * Legacy alias: Fetch single payment
   */
  async getPaymentById(id: string): Promise<Payment> {
    return this.getInvoiceById(id);
  },

  /**
   * Legacy alias: Initiate M-Pesa STK
   */
  async initiateMpesaStk(payload: InitiateMpesaStkPayload): Promise<PaymentTransaction> {
    const result = await this.payInvoiceMpesa(payload.paymentId, {
      phoneNumber: payload.phoneNumber,
      amount: payload.amount,
      idempotencyKey: `stk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    });
    return result as unknown as PaymentTransaction;
  },

  /**
   * Record manual payment (Bank transfer / Cash / Admin override)
   */
  async recordManualPayment(payload: RecordManualPaymentPayload): Promise<PaymentTransaction> {
    const res = await apiClient.post<ApiResponse<PaymentTransaction>>(
      `/admin/payments/record`,
      payload
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to record manual payment");
    }
    return res.data.data;
  },

  /**
   * Fetch refunds list
   */
  async getRefunds(params?: { clientId?: string; paymentId?: string }): Promise<Refund[]> {
    const res = await apiClient.get<ApiResponse<Refund[]>>("/refunds", { params });
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch refunds");
    }
    return res.data.data;
  },

  /**
   * Request a refund
   */
  async requestRefund(payload: {
    paymentId: string;
    transactionId: string;
    amount: number;
    reason: string;
  }): Promise<Refund> {
    const res = await apiClient.post<ApiResponse<Refund>>("/refunds", payload);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to request refund");
    }
    return res.data.data;
  },
};
