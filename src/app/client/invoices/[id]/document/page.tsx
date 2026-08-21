"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Printer, Download, FileText, ShieldAlert, Loader2 } from "lucide-react";
import { InvoiceDocument } from "@/components/domain/invoice-document";
import { Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { paymentsApi } from "@/lib/api/payments";
import { useAuth } from "@/lib/auth/auth-context";
import { downloadElementAsPdf, printInvoiceDocument } from "@/lib/utils/pdf";

export default function ClientInvoiceDocumentPage() {
  const params = useParams();
  const id = String(params.id);
  const { client, user } = useAuth();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const {
    data: invoice,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["client-invoice", id],
    queryFn: () => paymentsApi.getInvoiceById(id),
  });

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    setIsGeneratingPdf(true);
    const invoiceNum = invoice.invoiceNumber || `INV-${invoice.id.slice(0, 8).toUpperCase()}`;
    await downloadElementAsPdf("invoice-document-element", `SwiftDoc-Invoice-${invoiceNum}.pdf`);
    setIsGeneratingPdf(false);
  };

  const handlePrint = () => {
    printInvoiceDocument();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 p-6 flex flex-col items-center justify-center space-y-4">
        <Skeleton className="h-12 w-96 rounded-xl" />
        <Skeleton className="h-[297mm] w-[210mm] rounded-none shadow-xl" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-slate-100 p-6 max-w-4xl mx-auto">
        <ErrorState
          title="Invoice Record Not Found"
          message="Could not retrieve the requested invoice document."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  // ------------------------------------------------------------------
  // IDOR & CLIENT SECURITY CHECK
  // Verify that the logged-in client owns this invoice
  // ------------------------------------------------------------------
  const currentClientId = client?.id || user?.id;
  const isOwner =
    invoice.clientId === currentClientId ||
    invoice.user?.id === currentClientId ||
    (invoice.client && (invoice.client.id === currentClientId || invoice.client.userId === currentClientId)) ||
    (invoice.user && invoice.user.id === currentClientId);

  if (!isOwner) {
    return (
      <div className="min-h-screen bg-slate-100 p-6 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl border border-rose-200 shadow-xl max-w-md text-center space-y-4 font-sans">
          <div className="size-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="size-8" />
          </div>
          <h2 className="text-lg font-black text-slate-900">Access Denied (Security Alert)</h2>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            You do not have authorization to view this invoice. Invoices are strictly restricted to the owning client entity.
          </p>
          <Link href="/client/payments">
            <button className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm">
              Return to My Payments
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const invoiceNum = invoice.invoiceNumber || `INV-${invoice.id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-slate-200/80 text-slate-900 flex flex-col font-sans print:bg-white print:p-0">
      {/* 1. DOCUMENT TOOLBAR */}
      <header className="sticky top-0 z-30 bg-slate-950 text-white px-4 sm:px-8 py-3 shadow-md print:hidden">
        <div className="max-w-[210mm] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link href="/client/payments">
              <button className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 border border-slate-700">
                <ArrowLeft className="size-3.5 text-slate-400" />
                <span>My Payments</span>
              </button>
            </Link>
            <div className="h-4 w-px bg-slate-800 hidden sm:block" />
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-amber-400" />
              <span className="text-xs font-mono font-bold text-slate-200">
                Commercial Invoice #{invoiceNum}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={handlePrint}
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 border border-slate-700 shadow-xs"
            >
              <Printer className="size-3.5 text-slate-300" />
              <span>Print</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-1.5 rounded-lg transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="size-3.5" />
                  <span>Download PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 2. A4 DOCUMENT PREVIEW CANVAS */}
      <main className="flex-1 py-8 px-4 sm:px-6 flex justify-center overflow-x-auto print:p-0 print:py-0">
        <InvoiceDocument
          invoice={invoice}
          onDownloadPdf={handleDownloadPdf}
          isDownloadingPdf={isGeneratingPdf}
          onPrint={handlePrint}
        />
      </main>

      {/* 3. PRINT STYLES */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            background-color: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          header, nav, sidebar, footer {
            display: none !important;
          }
          #invoice-document-element {
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 15mm !important;
          }
        }
      `}</style>
    </div>
  );
}
