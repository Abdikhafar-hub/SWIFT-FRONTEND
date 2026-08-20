"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  FolderLock,
  Download,
  FileText,
  Upload,
  Plus,
  X,
  Filter,
  AlertCircle,
} from "lucide-react";
import { FileUpload } from "@/components/ui/file-upload";
import { DocumentStatusBadge } from "@/components/domain/status-badges";
import { documentsApi } from "@/lib/api/documents";
import { formatDate, formatFileSize } from "@/lib/utils/format";
import type { Document } from "@/types";

export default function ClientDocumentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [docTitle, setDocTitle] = useState("");
  const [docType, setDocType] = useState("STATUTORY_DOCUMENT");
  const [docNumber, setDocNumber] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["client-documents", page, search, statusFilter],
    queryFn: () =>
      documentsApi.getDocuments({
        page,
        limit: 10,
        status: statusFilter || undefined,
      }),
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error("Please select a document file.");
      if (!docTitle.trim()) throw new Error("Document title is required.");

      return await documentsApi.uploadDocument({
        title: docTitle.trim(),
        documentType: docType,
        documentNumber: docNumber.trim() || undefined,
        file: selectedFile,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-documents"] });
      setIsUploadModalOpen(false);
      setDocTitle("");
      setDocNumber("");
      setSelectedFile(null);
      setUploadError(null);
    },
    onError: (err: any) => {
      setUploadError(err.message || "Failed to upload document.");
    },
  });

  const handleDownload = async (doc: Document) => {
    try {
      const res = await documentsApi.getDownloadUrl(doc.id);
      if (res.downloadUrl) {
        window.open(res.downloadUrl, "_blank", "noopener,noreferrer");
      }
    } catch {
      if (doc.currentVersion?.secureUrl) {
        window.open(doc.currentVersion.secureUrl, "_blank", "noopener,noreferrer");
      }
    }
  };

  const documents = (data?.items || []).filter((doc) => {
    if (!search) return true;
    return (
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.documentType?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const meta = data?.meta;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER SECTION */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Verified Document Vault
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            256-bit encrypted vault for certified IDs, business registrations, KRA PIN records, and registry output certificates.
          </p>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:from-[#b49049] hover:to-[#c39e26] text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
        >
          <Plus className="size-3.5 stroke-[3]" />
          <span>Upload to Vault</span>
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. SEARCH & FILTER BAR */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search documents by title or category..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-slate-800 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="size-3.5 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-52 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-semibold text-slate-700"
          >
            <option value="">All Document Statuses</option>
            <option value="APPROVED">Approved &amp; Verified</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="UPLOADED">Uploaded</option>
            <option value="REJECTED">Rejected / Action Needed</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. TABLE CONTAINER */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-xs font-bold text-rose-600">Failed to load vault documents.</p>
            <button
              onClick={() => refetch()}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <FolderLock className="size-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Document vault is empty</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {search || statusFilter
                  ? "No documents match your search filters."
                  : "Uploaded compliance files and official government receipts will be securely stored here."}
              </p>
            </div>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="mt-2 bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-white font-bold text-xs px-4 py-2 rounded-xl"
            >
              Upload First Document
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Document Record</th>
                  <th className="py-3 px-4">Document Category</th>
                  <th className="py-3 px-4">Verification Status</th>
                  <th className="py-3 px-4">Doc / Reg #</th>
                  <th className="py-3 px-4">Date Uploaded</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700 shrink-0">
                          <FileText className="size-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-xs group-hover:text-amber-700 transition-colors">
                            {doc.title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {doc.currentVersion ? formatFileSize(doc.currentVersion.fileSize) : "Cloudinary Encrypted"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 font-bold uppercase text-[10px]">
                      {doc.documentType}
                    </td>
                    <td className="py-3 px-4">
                      <DocumentStatusBadge status={doc.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                      {doc.documentNumber || "—"}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-medium">
                      {formatDate(doc.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDownload(doc)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Download className="size-3.5 text-slate-500" />
                        <span>Download</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta && (meta.totalPages ?? 0) > 1 && (
          <div className="px-4 py-3 bg-slate-50/60 border-t border-slate-200/80 flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>
              Showing Page {meta.page ?? 1} of {meta.totalPages ?? 1} ({meta.total ?? 0} total documents)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={(meta.page ?? 1) <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
              >
                Previous
              </button>
              <button
                disabled={(meta.page ?? 1) >= (meta.totalPages ?? 1)}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. UPLOAD MODAL */}
      {/* ------------------------------------------------------------------ */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 bg-slate-50">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <FolderLock className="size-4 text-amber-600" />
                <span>Upload Document to Secure Vault</span>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Document Title
                </label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g. National ID Card / KRA Certificate"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Document Category
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-semibold text-slate-700"
                  >
                    <option value="NATIONAL_ID">National ID / Passport</option>
                    <option value="KRA_PIN_CERTIFICATE">KRA PIN Certificate</option>
                    <option value="TAX_COMPLIANCE">Tax Compliance (TCC)</option>
                    <option value="BUSINESS_REGISTRATION">CR12 / Business Certificate</option>
                    <option value="POWER_OF_ATTORNEY">Power of Attorney</option>
                    <option value="STATUTORY_DOCUMENT">Other Statutory Document</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Document # (Optional)
                  </label>
                  <input
                    type="text"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    placeholder="e.g. ID # or PIN #"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono text-slate-800"
                  />
                </div>
              </div>

              <div>
                <FileUpload
                  onFileSelect={(file) => setSelectedFile(file)}
                  label="Select Compliance Document"
                  hint="PDF, JPEG, or PNG up to 15MB"
                />
              </div>

              {uploadError && (
                <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 font-semibold">
                  <AlertCircle className="size-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  disabled={uploadMutation.isPending}
                  className="px-3.5 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => uploadMutation.mutate()}
                  disabled={!selectedFile || !docTitle.trim() || uploadMutation.isPending}
                  className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-white font-bold text-xs px-4 py-2 rounded-lg shadow-xs hover:from-[#b49049] hover:to-[#c39e26] transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Upload className="size-3.5" />
                  <span>{uploadMutation.isPending ? "Uploading..." : "Save to Secure Vault"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
