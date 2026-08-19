# Swift Doc Frontend — Phase 4: Financial Operations, Reconciliation & Executive Reporting

## 1. Overview & Architecture

Phase 4 delivers an enterprise-grade financial command and reconciliation operations frontend for the Swift Doc statutory compliance platform. It connects directly with the backend financial microservices (`FinancialAnalyticsService`, `PaymentService`, `ReconciliationEngine`, `ReceiptService`, `RefundService`).

### Non-Negotiable Financial Rule
> **Backend as Authoritative Truth Source**: All money calculations, itemized sums, tax calculations, discounts, aging buckets, and reconciliation statuses are calculated on the backend. The frontend strictly consumes and formats backend-computed figures using standard Kenyan Shilling (KES) formatting rules.

---

## 2. Architecture & Directory Layout

```
Frontend/src/
├── app/
│   └── admin/
│       ├── payments/
│       │   └── page.tsx              # Financial Command Center (KPIs, Invoices, Tx, Receipts, Refunds, Aging)
│       ├── reconciliation/
│       │   └── page.tsx              # Reconciliation & Settlement Register (Auto-recon, Ingest, Discrepancy Resolution)
│       └── applications/[id]/
│           └── page.tsx              # Application 360 Dossier (Interactive Financials tab with line items & adjustments)
├── components/
│   └── domain/
│       ├── admin/
│       │   ├── admin-create-invoice-modal.tsx       # Dynamic itemized fee creation modal (Gov vs Service fee breakdown)
│       │   ├── admin-invoice-detail-modal.tsx       # Full 360 invoice dossier (line items, adjustments, transactions, vouchers)
│       │   ├── admin-financial-adjustment-modal.tsx # Discounts, waivers, penalties, and roundings with audit justification
│       │   ├── admin-reverse-transaction-modal.tsx  # Transaction reversal with audit log tracking
│       │   ├── admin-receipt-detail-modal.tsx       # Statutory Kenyan compliance receipt voucher modal
│       │   ├── admin-refund-modals.tsx              # Request refund claim & audit approval/rejection review loop
│       │   └── admin-manual-payment-modal.tsx       # Direct cash, bank wire, and offline settlement modal
│       └── status-badges.tsx                        # Payment and financial status indicators
├── lib/
│   ├── api/
│   │   ├── admin.ts                 # Full admin financial endpoints client
│   │   └── payments.ts              # Payments client API
│   └── utils/
│       └── format.ts                # Kenyan phone, currency, and date formatters
├── types/
│   └── payment.ts                   # Financial interfaces, aging buckets, queries, and adjustment payloads
└── test/
    └── financial.test.tsx           # Comprehensive unit tests for financial UI & schemas
```

---

## 3. Financial Command Center (`/admin/payments`)

The Command Center provides 5 distinct operational tabs:

1. **Invoices Directory**:
   - Filter by status (`DRAFT`, `ISSUED`, `PENDING`, `PARTIALLY_PAID`, `PAID`, `OVERDUE`, `CANCELLED`).
   - Create Commercial Invoices with dynamic itemized fee lines.
   - Click invoice to open `AdminInvoiceDetailModal` dossier.
   - Quick inline actions: Dossier, Adjust, Settle/Pay.

2. **Payment Transactions**:
   - Comprehensive audit log of all M-Pesa STK callbacks, Paybill C2B payments, and bank wires.
   - Reversal workflow (`AdminReverseTransactionModal`) with mandatory auditor reason.
   - Refund claim dispatch (`AdminRequestRefundModal`).

3. **Statutory Receipts**:
   - Register of all statutory receipt vouchers generated upon settlement.
   - Click to preview `AdminReceiptDetailModal` with Kenyan statutory compliance metadata (Payer name, KRA PIN compliance notes, breakdown).

4. **Refunds & Adjustments**:
   - Lifecycle tracking of refund requests (`REQUESTED`, `APPROVED`, `PROCESSING`, `COMPLETED`, `FAILED`, `CANCELLED`).
   - Settle/Review workflow (`AdminRefundReviewModal`) allowing auditors to approve or reject claims.

5. **Aging & Collections Analytics**:
   - Accounts Receivable Aging Schedule broken into buckets: `Current`, `1-7 Days`, `8-14 Days`, `15-30 Days`, and `30+ Days Overdue`.
   - Collections distribution categorized by payment channel (M-Pesa, Bank Wire, Pesapal, Cash).

---

## 4. Reconciliation Engine Workspace (`/admin/reconciliation`)

- **Automated Recon Sweep**: Triggers the backend `ReconciliationEngine` to scan unallocated transactions against open invoices with real-time feedback and cache synchronization.
- **Statement Ingest Modal**: Ingests statement entries from M-Pesa C2B, RTGS/EFT bank wires, and card gateways.
- **Discrepancy Resolution**: Auditor workflow to manually resolve unmatched, duplicate, suspicious, or reversed statement items with mandatory audit narrative.

---

## 5. Application 360 Financial Integration

Inside `app/admin/applications/[id]/page.tsx`:
- The **Financials & Settlement** tab displays all invoices tied to the application.
- Supports inline actions to **Create New Invoice**, **View Full Dossier & Line Items**, **Add Adjustments**, and **Record Manual Payment**.
- Dynamic line item summary breaks out statutory disbursements from agency service fees.

---

## 6. Testing & Type Safety Verification

- **TypeScript Compilation**: `npm run typecheck` passes cleanly with zero errors.
- **Unit & Component Testing**: `npm test` runs 27 passing Vitest tests across formatting, status badges, and financial payload structures.
- **Next.js Production Build**: `npm run build` compiles all 25 routes into an optimized static and server-rendered bundle.
