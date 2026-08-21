"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Eye,
  Download,
  UploadCloud,
  X,
  Building,
  User,
  Plus,
  Filter,
  Check,
  Loader2,
  Calendar,
  FileCheck,
  Tag,
  Shield,
  FileSpreadsheet,
} from "lucide-react";
import { documentsApi } from "@/lib/api/documents";
import { adminApi } from "@/lib/api/admin";
import { formatDate } from "@/lib/utils/format";
import type { Document, DocumentStatus } from "@/types";

type ViewTab = "ALL" | "MANUAL" | "SUBMITTED" | "APPROVED" | "REJECTED" | "EXPIRED";

export default function AdminDocumentsPage() {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<ViewTab>("ALL");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  // Expiry sweep banner state
  const [sweepResult, setSweepResult] = useState<any | null>(null);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Upload Modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    clientId: "",
    applicationId: "",
    documentType: "NATIONAL_ID",
    title: "",
    documentNumber: "",
    issuingAuthority: "",
    expiresAt: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewName, setFilePreviewName] = useState<string>("");

  // Review Modal state
  const [reviewingDoc, setReviewingDoc] = useState<Document | null>(null);
  const [reviewStatus, setReviewStatus] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [reviewNotes, setReviewNotes] = useState("");

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // 1. Query Vault Documents from documents API
  const {
    data: docsData,
    isLoading: isLoadingDocs,
    error: docsError,
    refetch: refetchDocs,
  } = useQuery({
    queryKey: ["admin-documents-vault"],
    queryFn: async () => {
      const res = await documentsApi.getDocuments({ limit: 100 });
      return res?.items || (Array.isArray(res) ? res : []);
    },
  });

  // 2. Query Clients list for Upload Modal selector
  const { data: clientsData } = useQuery({
    queryKey: ["admin-clients-list-for-docs"],
    queryFn: () => adminApi.getClients({ limit: 100 }),
    enabled: isUploadModalOpen,
  });

  // 3. Query Applications list for Upload Modal selector
  const { data: appsData } = useQuery({
    queryKey: ["admin-applications-list-for-docs"],
    queryFn: () => adminApi.getApplications({ limit: 100 }),
    enabled: isUploadModalOpen,
  });

  const documentsList: Document[] = docsData || [];
  const clientsList = clientsData?.items || [];
  const appsList = appsData?.items || [];

  // Expiry sweep mutation
  const sweepMutation = useMutation({
    mutationFn: () => adminApi.triggerExpiryCheck(),
    onSuccess: (data) => {
      setSweepResult(data);
      refetchDocs();
      showToast("success", `Expiry sweep completed. Evaluated ${data.evaluatedCount || 0} documents.`);
    },
    onError: (err: any) => {
      showToast("error", err.message || "Failed to trigger expiry sweep.");
    },
  });

  // Upload document mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error("Please select a document file to upload.");
      if (!uploadForm.title.trim()) throw new Error("Please provide a document title.");

      return await documentsApi.uploadDocument({
        clientId: uploadForm.clientId || undefined,
        applicationId: uploadForm.applicationId || undefined,
        documentType: uploadForm.documentType,
        title: uploadForm.title.trim(),
        file: selectedFile,
        documentNumber: uploadForm.documentNumber.trim() || undefined,
        issuingAuthority: uploadForm.issuingAuthority.trim() || undefined,
        expiresAt: uploadForm.expiresAt ? new Date(uploadForm.expiresAt).toISOString() : undefined,
      });
    },
    onSuccess: () => {
      showToast("success", "Document uploaded successfully to vault!");
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      setFilePreviewName("");
      setUploadForm({
        clientId: "",
        applicationId: "",
        documentType: "NATIONAL_ID",
        title: "",
        documentNumber: "",
        issuingAuthority: "",
        expiresAt: "",
      });
      refetchDocs();
    },
    onError: (err: any) => {
      showToast("error", err.message || "Document upload failed.");
    },
  });

  // Review document mutation
  const reviewMutation = useMutation({
    mutationFn: async () => {
      if (!reviewingDoc) return;
      return await documentsApi.reviewDocument(reviewingDoc.id, {
        status: reviewStatus,
        reviewNotes: reviewNotes.trim() || undefined,
      });
    },
    onSuccess: () => {
      showToast("success", `Document status updated to ${reviewStatus}`);
      setReviewingDoc(null);
      setReviewNotes("");
      refetchDocs();
    },
    onError: (err: any) => {
      showToast("error", err.message || "Failed to review document.");
    },
  });

  // Secure download handler
  const handleDownload = async (docId: string, docTitle: string) => {
    try {
      const res = await documentsApi.getDownloadUrl(docId);
      if (res?.downloadUrl) {
        window.open(res.downloadUrl, "_blank");
      } else {
        showToast("error", "Secure download link is unavailable.");
      }
    } catch (err: any) {
      showToast("error", err.message || "Failed to generate download URL.");
    }
  };

  // Helper to categorize manual uploads vs requirement uploads
  const isManualDoc = (doc: Document) => {
    return !doc.applicationRequirementId || doc.documentType?.startsWith("MANUAL_") || doc.documentType?.includes("CUSTOM");
  };

  // Filter documents based on active tab, search, and status dropdown
  const filteredDocuments = documentsList.filter((doc) => {
    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = doc.title?.toLowerCase().includes(q);
      const matchType = doc.documentType?.toLowerCase().includes(q);
      const matchDocNum = doc.documentNumber?.toLowerCase().includes(q);
      const matchApp = doc.application?.applicationNumber?.toLowerCase().includes(q);
      const matchClient =
        doc.client?.fullName?.toLowerCase().includes(q) ||
        doc.client?.businessName?.toLowerCase().includes(q) ||
        doc.client?.email?.toLowerCase().includes(q);
      if (!matchTitle && !matchType && !matchDocNum && !matchApp && !matchClient) return false;
    }

    // Dropdown status filter
    if (statusFilter !== "ALL" && doc.status !== statusFilter) return false;

    // View Tabs
    if (activeTab === "MANUAL") {
      return isManualDoc(doc);
    }
    if (activeTab === "SUBMITTED") {
      return doc.status === "PENDING_REVIEW" || doc.status === "UPLOADED";
    }
    if (activeTab === "APPROVED") {
      return doc.status === "APPROVED";
    }
    if (activeTab === "REJECTED") {
      return doc.status === "REJECTED";
    }
    if (activeTab === "EXPIRED") {
      return doc.isExpired || (doc.expiresAt && new Date(doc.expiresAt) < new Date());
    }

    return true;
  });

  // Metrics
  const totalCount = documentsList.length;
  const manualCount = documentsList.filter(isManualDoc).length;
  const approvedCount = documentsList.filter((d) => d.status === "APPROVED").length;
  const pendingCount = documentsList.filter((d) => d.status === "PENDING_REVIEW" || d.status === "UPLOADED").length;
  const rejectedCount = documentsList.filter((d) => d.status === "REJECTED").length;
  const expiredCount = documentsList.filter((d) => d.isExpired || (d.expiresAt && new Date(d.expiresAt) < new Date())).length;

  const pageSize = 10;
  const totalPages = Math.ceil(filteredDocuments.length / pageSize) || 1;
  const paginatedDocs = filteredDocuments.slice((page - 1) * pageSize, page * pageSize);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        showToast("error", "File size exceeds maximum 15MB limit.");
        return;
      }
      setSelectedFile(file);
      setFilePreviewName(`${file.name} (${Math.round(file.size / 1024)} KB)`);
      if (!uploadForm.title) {
        // Auto-fill title from filename without extension
        const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
        setUploadForm((prev) => ({ ...prev, title: nameWithoutExt }));
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER SECTION */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Central Document Vault &amp; Expiry Monitor
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage statutory client identity documents, manually uploaded filings, registry certificates, and automated expiry sweeps.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 transform hover:-translate-y-0.5"
          >
            <UploadCloud className="size-3.5 text-amber-400" />
            <span>Upload Document</span>
          </button>

          <button
            onClick={() => sweepMutation.mutate()}
            disabled={sweepMutation.isPending}
            className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:from-[#b49049] hover:to-[#c39e26] text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 transform hover:-translate-y-0.5"
          >
            <RefreshCw className={`size-3.5 ${sweepMutation.isPending ? "animate-spin" : ""}`} />
            <span>Run Expiry Sweep</span>
          </button>
        </div>
      </div>

      {/* TOAST ALERTS */}
      {toastMessage && (
        <div
          className={`flex items-center justify-between rounded-xl border p-3 text-xs font-semibold shadow-xs animate-in fade-in ${
            toastMessage.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="size-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="size-4 text-rose-600" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-xs opacity-70 hover:opacity-100">
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 2. METRICS OVERVIEW CARDS */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Vault Docs</span>
            <span className="text-xl font-extrabold text-slate-900 font-mono mt-0.5 block">{totalCount}</span>
            <span className="text-[10px] text-slate-500 font-medium">Repository total</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
            <FileText className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Manually Uploaded</span>
            <span className="text-xl font-extrabold text-amber-700 font-mono mt-0.5 block">{manualCount}</span>
            <span className="text-[10px] text-slate-500 font-medium">Officer filings</span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60">
            <UploadCloud className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Verified &amp; Approved</span>
            <span className="text-xl font-extrabold text-emerald-600 font-mono mt-0.5 block">{approvedCount}</span>
            <span className="text-[10px] text-slate-500 font-medium">Compliance checked</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60">
            <CheckCircle2 className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Pending Review</span>
            <span className="text-xl font-extrabold text-amber-600 font-mono mt-0.5 block">{pendingCount}</span>
            <span className="text-[10px] text-slate-500 font-medium">Requires audit</span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
            <Clock className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between col-span-2 lg:col-span-1">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Expired / Flagged</span>
            <span className="text-xl font-extrabold text-rose-600 font-mono mt-0.5 block">{expiredCount}</span>
            <span className="text-[10px] text-slate-500 font-medium">Needs renewal</span>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200/60">
            <AlertTriangle className="size-4" />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. TABS BAR & FILTERS */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl p-1.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-wrap items-center justify-between gap-2">
        {/* Tab Pills */}
        <div className="flex overflow-x-auto gap-1 scrollbar-none py-0.5">
          <button
            onClick={() => {
              setActiveTab("ALL");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === "ALL"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <FileText className="size-3.5" />
            All Vault Documents
            <span className="ml-1 rounded-md bg-slate-800 px-1.5 py-0.2 text-[10px] font-mono text-slate-300">
              {totalCount}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab("MANUAL");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === "MANUAL"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <UploadCloud className="size-3.5 text-amber-500" />
            Manually Uploaded Docs
            <span className="ml-1 rounded-md bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-mono text-amber-700 font-extrabold">
              {manualCount}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab("SUBMITTED");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === "SUBMITTED"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Clock className="size-3.5" />
            Pending Review
            <span className="ml-1 rounded-md bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-mono text-amber-700 font-bold">
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab("APPROVED");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === "APPROVED"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <CheckCircle2 className="size-3.5 text-emerald-400" />
            Approved
            <span className="ml-1 rounded-md bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-mono text-emerald-700 font-bold">
              {approvedCount}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab("EXPIRED");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === "EXPIRED"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <AlertTriangle className="size-3.5 text-rose-400" />
            Expired / Flagged
            <span className="ml-1 rounded-md bg-rose-500/20 px-1.5 py-0.2 text-[10px] font-mono text-rose-700 font-bold">
              {expiredCount}
            </span>
          </button>
        </div>

        {/* Search & Status Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search title, type, doc #, client..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium text-slate-800 placeholder-slate-400"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-44 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-semibold text-slate-700"
          >
            <option value="ALL">All States</option>
            <option value="UPLOADED">Uploaded</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. DOCUMENTS VAULT & MANUALLY UPLOADED LIST TABLE */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
        {isLoadingDocs ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : docsError ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-xs font-bold text-rose-600">Failed to load document vault data.</p>
            <button
              onClick={() => refetchDocs()}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              Retry Loading Vault
            </button>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-50 border border-amber-200 text-amber-700">
              <FileText className="size-6" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">No documents found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
              {activeTab === "MANUAL"
                ? "No manually uploaded documents have been recorded yet. Click 'Upload Document' above to upload a filing."
                : "No vault documents matching the search criteria were found."}
            </p>
            {activeTab === "MANUAL" && (
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-white rounded-xl text-xs font-bold shadow-xs hover:from-[#b49049] hover:to-[#c39e26] transition-all"
              >
                <Plus className="size-4" /> Upload Manual Filing Now
              </button>
            )}
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Document Title / Type</th>
                    <th className="py-3 px-4">Origin / Source</th>
                    <th className="py-3 px-4">Client Entity</th>
                    <th className="py-3 px-4">Dossier / Case</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Expiry Date</th>
                    <th className="py-3 px-4">Upload Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {paginatedDocs.map((doc) => {
                    const isManual = isManualDoc(doc);
                    const latestVersion = doc.versions?.[0] || doc.currentVersion;
                    const isExpired = doc.isExpired || (doc.expiresAt && new Date(doc.expiresAt) < new Date());

                    return (
                      <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors group">
                        {/* Title & Type */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-xs text-slate-900 group-hover:text-amber-700 transition-colors flex items-center gap-2">
                            <span>{doc.title || "Statutory Document"}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[10px] text-slate-400">
                              {doc.documentType?.replace(/_/g, " ")}
                            </span>
                            {doc.documentNumber && (
                              <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                                #{doc.documentNumber}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Origin Source */}
                        <td className="py-3 px-4">
                          {isManual ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200/70 px-2 py-0.5 text-[10px] font-extrabold text-amber-800 font-mono">
                              <UploadCloud className="size-3 text-amber-600" /> Officer Upload
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 border border-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-600 font-mono">
                              <FileCheck className="size-3 text-slate-500" /> Client Requirement
                            </span>
                          )}
                        </td>

                        {/* Client Entity */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-xs text-slate-800">
                            {doc.client?.fullName || doc.client?.businessName || "Verified Client"}
                          </div>
                          {doc.client?.email && (
                            <div className="text-[10px] text-slate-400 font-medium">{doc.client.email}</div>
                          )}
                        </td>

                        {/* Application / Case */}
                        <td className="py-3 px-4">
                          {doc.application?.applicationNumber ? (
                            <Link
                              href={`/admin/applications/${doc.application.id}`}
                              className="font-mono text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline"
                            >
                              #{doc.application.applicationNumber}
                            </Link>
                          ) : (
                            <span className="text-slate-400 text-[11px] font-medium font-mono">General Vault</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                              doc.status === "APPROVED"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                                : doc.status === "REJECTED"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : doc.status === "PENDING_REVIEW" || doc.status === "UPLOADED"
                                ? "bg-amber-50 text-amber-800 border-amber-200/80"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {doc.status}
                          </span>
                        </td>

                        {/* Expiry Date */}
                        <td className="py-3 px-4 font-mono text-[11px]">
                          {doc.expiresAt ? (
                            <span
                              className={
                                isExpired ? "text-rose-600 font-bold flex items-center gap-1" : "text-slate-600 font-medium"
                              }
                            >
                              {isExpired && <AlertTriangle className="size-3 text-rose-500 shrink-0" />}
                              {formatDate(doc.expiresAt)}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>

                        {/* Upload Date */}
                        <td className="py-3 px-4 text-xs text-slate-500 font-medium">
                          {formatDate(doc.createdAt)}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleDownload(doc.id, doc.title)}
                              className="bg-white border border-slate-200 text-slate-700 font-bold text-xs px-2.5 py-1 rounded-lg hover:bg-slate-50 transition-all inline-flex items-center gap-1"
                              title="Download Secure File"
                            >
                              <Download className="size-3 text-slate-500" />
                              <span>Download</span>
                            </button>

                            {(doc.status === "PENDING_REVIEW" || doc.status === "UPLOADED") && (
                              <button
                                onClick={() => {
                                  setReviewingDoc(doc);
                                  setReviewStatus("APPROVED");
                                  setReviewNotes("");
                                }}
                                className="bg-slate-900 text-white font-bold text-xs px-2.5 py-1 rounded-lg hover:bg-slate-800 transition-all inline-flex items-center gap-1"
                              >
                                <Check className="size-3 text-amber-400" />
                                <span>Audit</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* PAGINATION FOOTER */}
            {totalPages > 1 && (
              <div className="px-4 py-3 bg-slate-50/60 border-t border-slate-200/80 flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>
                  Showing page {page} of {totalPages} ({filteredDocuments.length} total items)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 5. UPLOAD MANUAL DOCUMENT MODAL */}
      {/* ------------------------------------------------------------------ */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-xl rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsUploadModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
                <UploadCloud className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Upload Manual Document / Filing</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Attach statutory certificates, registry filings, or client identity docs directly to the vault.
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                uploadMutation.mutate();
              }}
              className="space-y-3.5 text-xs"
            >
              {/* Client Selection */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  Select Client Entity <span className="text-slate-400 font-normal">(Optional if unlinked)</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 size-4 text-slate-400" />
                  <select
                    value={uploadForm.clientId}
                    onChange={(e) => setUploadForm({ ...uploadForm, clientId: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-semibold text-slate-800"
                  >
                    <option value="">-- No Client Selected (General Officer Upload) --</option>
                    {clientsList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName || c.businessName} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Linked Application Selection */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  Link to Application Dossier <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 size-4 text-slate-400" />
                  <select
                    value={uploadForm.applicationId}
                    onChange={(e) => setUploadForm({ ...uploadForm, applicationId: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-semibold text-slate-800"
                  >
                    <option value="">-- No Specific Dossier --</option>
                    {appsList.map((app) => (
                      <option key={app.id} value={app.id}>
                        #{app.applicationNumber} - {app.service?.name} ({app.client?.fullName || app.client?.businessName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Document Type */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">
                    Document Category / Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={uploadForm.documentType}
                    onChange={(e) => setUploadForm({ ...uploadForm, documentType: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-semibold text-slate-800"
                  >
                    <option value="NATIONAL_ID">National ID / Passport</option>
                    <option value="KRA_PIN">KRA PIN Certificate</option>
                    <option value="CR12_FORM">CR12 / Official Registry Search</option>
                    <option value="CERTIFICATE">Statutory Certificate</option>
                    <option value="WORK_PERMIT">Work Permit / Visa</option>
                    <option value="TAX_COMPLIANCE">Tax Compliance Certificate</option>
                    <option value="MANUAL_FILING">Manual Registry Filing</option>
                    <option value="CUSTOM_ATTACHMENT">Other Attachment</option>
                  </select>
                </div>

                {/* Document Title */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">
                    Document Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                    placeholder="e.g. KRA PIN Certificate 2026"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium text-slate-800"
                  />
                </div>
              </div>

              {/* File Upload Dropzone */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  Select File <span className="text-rose-500">*</span>
                </label>
                <div className="border-2 border-dashed border-slate-200 hover:border-amber-400 bg-slate-50/50 rounded-xl p-4 text-center transition-colors">
                  <input
                    type="file"
                    id="manual-doc-upload"
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="manual-doc-upload" className="cursor-pointer block space-y-1.5">
                    <UploadCloud className="size-7 mx-auto text-amber-500" />
                    <span className="text-xs font-bold text-slate-800 block">
                      {filePreviewName ? filePreviewName : "Click to browse or drag document file here"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium block">
                      Supports PDF, PNG, JPG, WebP, DOCX up to 15MB
                    </span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Document Number */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Document Number</label>
                  <input
                    type="text"
                    value={uploadForm.documentNumber}
                    onChange={(e) => setUploadForm({ ...uploadForm, documentNumber: e.target.value })}
                    placeholder="e.g. A012345678Z"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono font-medium text-slate-800"
                  />
                </div>

                {/* Issuing Authority */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Issuing Authority</label>
                  <input
                    type="text"
                    value={uploadForm.issuingAuthority}
                    onChange={(e) => setUploadForm({ ...uploadForm, issuingAuthority: e.target.value })}
                    placeholder="e.g. KRA / BRS / DCI"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium text-slate-800"
                  />
                </div>

                {/* Expiry Date */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Expiry Date</label>
                  <input
                    type="date"
                    value={uploadForm.expiresAt}
                    onChange={(e) => setUploadForm({ ...uploadForm, expiresAt: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium text-slate-800"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadMutation.isPending || !selectedFile}
                  className="px-4 py-2 text-xs font-bold text-white rounded-xl bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:from-[#b49049] hover:to-[#c39e26] shadow-xs flex items-center gap-1.5 disabled:opacity-50 transition-all"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" /> Uploading...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="size-3.5" /> Confirm &amp; Save to Vault
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 6. AUDIT / REVIEW DOCUMENT MODAL */}
      {/* ------------------------------------------------------------------ */}
      {reviewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setReviewingDoc(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X className="size-4" />
            </button>

            <div className="text-center space-y-1">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-50 border border-amber-200 text-amber-700">
                <FileCheck className="size-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Audit Document Compliance</h3>
              <p className="text-xs text-slate-500 font-medium">
                Reviewing <strong>{reviewingDoc.title}</strong>
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                reviewMutation.mutate();
              }}
              className="space-y-3.5 text-xs"
            >
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Compliance Audit Decision</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewStatus("APPROVED")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      reviewStatus === "APPROVED"
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800 ring-2 ring-emerald-500/20"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <CheckCircle2 className="size-3.5 text-emerald-600" /> Approve
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewStatus("REJECTED")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      reviewStatus === "REJECTED"
                        ? "bg-rose-50 border-rose-300 text-rose-800 ring-2 ring-rose-500/20"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <AlertTriangle className="size-3.5 text-rose-600" /> Reject / Defect
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  Reviewer Notes / Rejection Reason {reviewStatus === "REJECTED" && <span className="text-rose-500">*</span>}
                </label>
                <textarea
                  rows={3}
                  required={reviewStatus === "REJECTED"}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder={
                    reviewStatus === "APPROVED"
                      ? "Optional notes (e.g. Verified against official registry)"
                      : "Provide detailed rejection reason for client..."
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium text-slate-800"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewingDoc(null)}
                  className="flex-1 py-2 text-xs font-bold text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-white rounded-xl bg-slate-900 hover:bg-slate-800 shadow-xs disabled:opacity-50"
                >
                  {reviewMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5 text-amber-400" />}
                  Submit Audit Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
