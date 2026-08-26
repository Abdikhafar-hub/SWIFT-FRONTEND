"use client";

import React from "react";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { SEO_CONFIG } from "@/lib/seo/seo-config";
import type { Payment, InvoiceLineItem } from "@/types";

export interface InvoiceDocumentProps {
  invoice: Payment;
  companyInfo?: {
    name?: string;
    legalName?: string;
    email?: string;
    phone?: string;
    address?: string;
    kraPin?: string;
  };
  onDownloadPdf?: () => void;
  isDownloadingPdf?: boolean;
  onPrint?: () => void;
}

export function InvoiceDocument({
  invoice,
  companyInfo,
  onDownloadPdf,
  isDownloadingPdf = false,
  onPrint,
}: InvoiceDocumentProps) {
  const org = SEO_CONFIG.organization;

  // Resolve dynamic or configured company details
  const companyName = companyInfo?.legalName || org.legalName;
  const companyEmail = companyInfo?.email || org.email;
  const companyPhone = companyInfo?.phone || org.phone;
  const companyAddress = companyInfo?.address || `${org.address.streetAddress}, ${org.address.addressLocality}`;
  const companyKraPin = companyInfo?.kraPin || "P052189421Z";

  // Resolve Client details
  const clientName =
    invoice.client?.fullName ||
    invoice.client?.businessName ||
    invoice.user?.fullName ||
    invoice.user?.businessName ||
    "Valued Client";
  const clientEmail = invoice.client?.email || invoice.user?.email || "—";
  const clientPhone = invoice.client?.phone || invoice.user?.phone || "—";
  const clientRefNumber = invoice.client?.clientNumber || invoice.clientId?.slice(0, 8).toUpperCase() || "—";

  // Resolve Linked Application Details
  const appNumber = invoice.application?.applicationNumber || invoice.applicationId?.slice(0, 8).toUpperCase();
  const serviceName = invoice.application?.service?.name || invoice.description || "Statutory Document Service";

  // Financial figures strictly derived from authoritative persisted invoice
  const subtotal = Number(invoice.subtotal || invoice.amount || 0);
  const governmentFee = Number(invoice.governmentFee || 0);
  const serviceFee = Number(invoice.serviceFee || 0);
  const tax = Number(invoice.tax || 0);
  const discount = Number(invoice.discount || 0);
  const totalAmount = Number(invoice.totalAmount || invoice.amount || 0);
  const amountPaid = Number(invoice.amountPaid || (invoice.status === "PAID" ? totalAmount : 0));
  const amountDue = Number(
    invoice.amountDue !== undefined
      ? invoice.amountDue
      : invoice.balanceRemaining !== undefined
      ? invoice.balanceRemaining
      : Math.max(0, totalAmount - amountPaid)
  );

  const isPaid = invoice.status === "PAID" || amountDue <= 0;
  const isOverdue = invoice.status === "OVERDUE";
  const isCancelled = invoice.status === "CANCELLED" || invoice.status === "VOID";

  // Resolve Line Items (Fallback to synthetic line items if backend returned flat structure)
  const lineItems: InvoiceLineItem[] =
    invoice.lineItems && invoice.lineItems.length > 0
      ? invoice.lineItems
      : [
          ...(governmentFee > 0
            ? [
                {
                  id: "item-gov",
                  description: `${serviceName} - Official Government Registry Fee`,
                  category: "GOVERNMENT_FEE",
                  quantity: 1,
                  unitAmount: governmentFee,
                  totalAmount: governmentFee,
                  isGovernmentFee: true,
                } as InvoiceLineItem,
              ]
            : []),
          {
            id: "item-srv",
            description: `${serviceName} - Document Verification & Professional Facilitation`,
            category: "SERVICE_FEE",
            quantity: 1,
            unitAmount: serviceFee > 0 ? serviceFee : subtotal,
            totalAmount: serviceFee > 0 ? serviceFee : subtotal,
            isGovernmentFee: false,
          } as InvoiceLineItem,
        ];

  const invoiceNum = invoice.invoiceNumber || `INV-${invoice.id.slice(0, 8).toUpperCase()}`;
  const issueDateStr = invoice.issuedAt
    ? formatDate(invoice.issuedAt)
    : invoice.createdAt
    ? formatDate(invoice.createdAt)
    : formatDate(new Date().toISOString());
  const dueDateStr = invoice.dueAt
    ? formatDate(invoice.dueAt)
    : invoice.dueDate
    ? formatDate(invoice.dueDate)
    : "Immediate Settlement";

  return (
    <div className="w-full max-w-[210mm] mx-auto text-slate-900 font-sans">
      {/* Document Paper Container */}
      <div
        id="invoice-document-element"
        className="bg-white p-8 sm:p-12 border border-slate-200/90 shadow-xl rounded-none print:shadow-none print:border-none print:p-0 print:m-0 space-y-8 min-h-[297mm] flex flex-col justify-between"
      >
        <div className="space-y-8">
          {/* 1. DOCUMENT HEADER */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b-2 border-slate-900/90 pb-6">
            {/* Left: Brand Identity */}
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="size-10 bg-slate-950 rounded-lg flex items-center justify-center font-extrabold text-amber-400 text-sm tracking-wider shadow-sm border border-amber-400/30">
                  SD
                </div>
                <div>
                  <h1 className="text-xl font-black text-slate-950 tracking-tight leading-none uppercase font-display">
                    Swift Doc
                  </h1>
                  <span className="text-[10px] font-bold text-amber-700 tracking-wider uppercase block mt-0.5">
                    Document &amp; Statutory Services
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-600 font-medium pt-1 max-w-xs leading-relaxed">
                {companyName}
                <br />
                {companyAddress}
                <br />
                Phone: {companyPhone} | Email: {companyEmail}
                <br />
                <span className="font-mono text-[11px] text-slate-500 font-bold">KRA PIN: {companyKraPin}</span>
              </p>
            </div>

            {/* Right: Commercial Invoice Metadata */}
            <div className="text-left sm:text-right space-y-1.5 sm:self-auto">
              <div className="inline-block bg-slate-950 text-white px-3 py-1 text-xs font-black uppercase tracking-widest rounded-xs font-mono">
                Commercial Invoice
              </div>
              <div className="font-mono font-bold text-lg text-slate-900 pt-1">
                #{invoiceNum}
              </div>
              <div className="text-xs text-slate-600 font-medium space-y-0.5">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Issue Date: </span>
                  <span className="font-mono font-semibold text-slate-800">{issueDateStr}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Due Date: </span>
                  <span className="font-mono font-semibold text-slate-800">{dueDateStr}</span>
                </div>
              </div>
              <div className="pt-1">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md border ${
                    isPaid
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                      : isCancelled
                      ? "bg-slate-100 text-slate-600 border-slate-300"
                      : isOverdue
                      ? "bg-rose-50 text-rose-800 border-rose-300"
                      : "bg-amber-50 text-amber-800 border-amber-300"
                  }`}
                >
                  Status: {invoice.status || (isPaid ? "PAID" : "ISSUED")}
                </span>
              </div>
            </div>
          </div>

          {/* 2. ISSUED BY & BILL TO GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs bg-slate-50/80 p-4 rounded-lg border border-slate-200/80">
            {/* Bill To Client Entity */}
            <div className="space-y-1.5 border-b sm:border-b-0 sm:border-r border-slate-200/80 pb-4 sm:pb-0 sm:pr-4">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 block">
                Billed To (Client Entity)
              </span>
              <h3 className="text-sm font-bold text-slate-950 font-display">{clientName}</h3>
              <div className="text-slate-600 space-y-0.5 leading-snug font-medium">
                <p>Email: {clientEmail}</p>
                <p>Phone: {clientPhone}</p>
                <p className="font-mono text-[11px] text-slate-500">Client Ref #: {clientRefNumber}</p>
              </div>
            </div>

            {/* Linked Application Context */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 block">
                Statutory Application Reference
              </span>
              {appNumber ? (
                <div className="font-mono font-bold text-slate-950 text-xs">
                  Dossier #{appNumber}
                </div>
              ) : null}
              <div className="text-slate-700 font-bold text-xs">{serviceName}</div>
              <p className="text-[11px] text-slate-500 font-medium">
                Official filing and compliance management handled under Swift Doc statutory workflow protocols.
              </p>
            </div>
          </div>

          {/* 3. ITEMIZED CHARGES TABLE */}
          <div className="space-y-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Itemized Fee Schedule &amp; Disbursements
            </h3>

            <div className="border border-slate-200/90 rounded-md overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-white text-[10px] font-extrabold uppercase tracking-wider">
                    <th className="py-2.5 px-3 w-10 text-center border-r border-slate-800">#</th>
                    <th className="py-2.5 px-4 border-r border-slate-800">Description &amp; Particulars</th>
                    <th className="py-2.5 px-3 border-r border-slate-800">Category</th>
                    <th className="py-2.5 px-3 text-center border-r border-slate-800 w-14">Qty</th>
                    <th className="py-2.5 px-4 text-right border-r border-slate-800 w-28">Unit Price</th>
                    <th className="py-2.5 px-4 text-right w-32">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80">
                  {lineItems.map((item, idx) => {
                    const qty = Number(item.quantity || 1);
                    const unitPrice = Number(item.unitAmount || 0);
                    const lineTotal = Number(item.totalAmount || qty * unitPrice);

                    return (
                      <tr
                        key={item.id || idx}
                        className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}
                      >
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-500 border-r border-slate-200/60">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 border-r border-slate-200/60 font-medium text-slate-900">
                          <div>{item.description}</div>
                          {item.isGovernmentFee && (
                            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block mt-0.5">
                              • Statutory Registry Disbursement
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 border-r border-slate-200/60 text-[11px] font-semibold text-slate-600 uppercase">
                          {item.category ? item.category.replace(/_/g, " ") : "SERVICE FEE"}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-semibold text-slate-700 border-r border-slate-200/60">
                          {qty}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700 border-r border-slate-200/60">
                          {formatCurrency(unitPrice)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-950">
                          {formatCurrency(lineTotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. TOTALS FINANCIAL BREAKDOWN */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-2">
            {/* Payment Summary / Status Callout */}
            <div className="w-full sm:w-1/2 space-y-3">
              {isPaid ? (
                <div className="rounded-md border border-emerald-300 bg-emerald-50/80 p-4 space-y-1.5 text-xs text-emerald-900">
                  <div className="flex items-center gap-2 text-emerald-800 font-extrabold uppercase tracking-wider text-[11px]">
                    <svg className="size-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Payment Status: Paid in Full</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 font-medium">
                    This commercial invoice has been fully settled and reconciled against the client ledger.
                  </p>
                  <div className="text-[11px] font-mono font-bold text-emerald-900 pt-1">
                    Amount Paid: {formatCurrency(amountPaid)}
                  </div>
                </div>
              ) : (
                <div className="rounded-md border border-amber-300 bg-amber-50/70 p-4 space-y-2 text-xs text-amber-950">
                  <div className="font-extrabold uppercase tracking-wider text-[11px] text-amber-900">
                    Payment Instructions — Safaricom M-Pesa Express
                  </div>
                  <p className="text-[11px] text-amber-900 font-medium leading-relaxed">
                    Settle securely via the Swift Doc Client Portal or use Safaricom M-Pesa:
                  </p>
                  <div className="bg-white p-2.5 rounded border border-amber-200/80 font-mono text-[11px] space-y-1">
                    <div>
                      <span className="text-slate-500 font-sans font-semibold">Paybill Number: </span>
                      <strong className="text-slate-900">408 9210</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 font-sans font-semibold">Account Number: </span>
                      <strong className="text-amber-800">{invoiceNum}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Financial Calculations Box */}
            <div className="w-full sm:w-1/2 space-y-1.5 text-xs font-medium text-slate-700 border-t sm:border-t-0 pt-4 sm:pt-0">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Subtotal (Itemized):</span>
                <span className="font-mono text-slate-900 font-semibold">{formatCurrency(subtotal)}</span>
              </div>

              {governmentFee > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Government Registry Fees:</span>
                  <span className="font-mono text-slate-900 font-semibold">{formatCurrency(governmentFee)}</span>
                </div>
              )}

              {tax > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Tax / VAT (16%):</span>
                  <span className="font-mono text-slate-900 font-semibold">{formatCurrency(tax)}</span>
                </div>
              )}

              {discount > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-700">
                  <span>Applied Discount / Credit:</span>
                  <span className="font-mono font-semibold">-{formatCurrency(discount)}</span>
                </div>
              )}

              <div className="flex justify-between py-2 border-t-2 border-slate-900 font-extrabold text-slate-950 text-sm">
                <span>TOTAL INVOICE AMOUNT:</span>
                <span className="font-mono text-slate-950">{formatCurrency(totalAmount)}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-700 font-semibold">
                <span>Amount Settled to Date:</span>
                <span className="font-mono">{formatCurrency(amountPaid)}</span>
              </div>

              <div className="flex justify-between py-2 bg-slate-950 text-white px-3 rounded font-extrabold text-sm mt-1">
                <span>BALANCE REMAINING DUE:</span>
                <span className="font-mono text-amber-400">{formatCurrency(amountDue)}</span>
              </div>
            </div>
          </div>

          {/* 5. COMMERCIAL NOTES & TERMS */}
          {invoice.notes && (
            <div className="pt-2 border-t border-slate-200/80 text-xs space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Notes &amp; Commercial Terms
              </span>
              <p className="text-slate-600 bg-slate-50 p-3 rounded border border-slate-200/60 leading-relaxed italic">
                {invoice.notes}
              </p>
            </div>
          )}
        </div>

        {/* 6. DOCUMENT FOOTER */}
        <div className="pt-6 border-t border-slate-200 text-center text-[10px] text-slate-500 space-y-1 font-medium">
          <p className="font-bold text-slate-700">Thank you for choosing Swift Documentation &amp; Statutory Services.</p>
          <p>
            This commercial invoice is an electronically authenticated document issued by Swift Doc Compliance Engine.
          </p>
          <div className="flex items-center justify-between pt-2 text-slate-400 font-mono text-[9px] uppercase border-t border-slate-100">
            <span>Invoice Ref: #{invoiceNum}</span>
            <span>Page 1 of 1</span>
            <span>www.swiftdoc.co.ke</span>
          </div>
        </div>
      </div>
    </div>
  );
}
