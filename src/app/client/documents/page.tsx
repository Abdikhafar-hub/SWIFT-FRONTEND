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
  ExternalLink,
  ShieldCheck,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { PageShell } from "@/components/ui/layout-primitives";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Pagination,
} from "@/components/ui/table-primitives";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { DocumentStatusBadge } from "@/components/domain/status-badges";
import { EmptyState, Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
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

  const { data, isLoading, error, refetch } = useQuery({
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
    <PageShell
      eyebrow="DOCUMENT VAULT"
      title="Verified Compliance Documents"
      description="Bank-grade 256-bit encrypted storage for certified national IDs, business certificates, KRA PIN records, and registry output documents."
      actions={
        <Button
          variant="gold"
          size="sm"
          leftIcon={<Plus className="size-4" />}
          onClick={() => setIsUploadModalOpen(true)}
        >
          Upload to Vault
        </Button>
      }
    >
      {/* Search and Filters Bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3 max-w-md">
          <Input
            placeholder="Search documents by title or type..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            leftAddon={<Search className="size-4" />}
            className="text-xs"
          />
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-48 text-xs font-medium"
          >
            <option value="">All Document Statuses</option>
            <option value="APPROVED">Approved & Verified</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="UPLOADED">Uploaded</option>
            <option value="REJECTED">Rejected / Action Needed</option>
            <option value="EXPIRED">Expired</option>
          </Select>
        </div>
      </div>

      {/* Main Documents Table */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : error ? (
        <ErrorState onRetry={() => refetch()} />
      ) : documents.length === 0 ? (
        <EmptyState
          icon={<FolderLock className="size-8" />}
          title="Document vault is empty"
          description={
            search || statusFilter
              ? "No compliance documents matched your search filters."
              : "Uploaded KYC records and government-issued certificates will be securely indexed here."
          }
          action={
            <Button
              variant="gold"
              size="sm"
              leftIcon={<Upload className="size-3.5" />}
              onClick={() => setIsUploadModalOpen(true)}
            >
              Upload First Document
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document Record</TableHead>
                <TableHead>Document Category</TableHead>
                <TableHead>Verification Status</TableHead>
                <TableHead>Document / Reg #</TableHead>
                <TableHead>Date Uploaded</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-xs bg-gold/15 text-gold shrink-0">
                        <FileText className="size-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground text-xs">{doc.title}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {doc.currentVersion ? formatFileSize(doc.currentVersion.fileSize) : "Cloudinary Encrypted"}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground uppercase">
                    {doc.documentType}
                  </TableCell>
                  <TableCell>
                    <DocumentStatusBadge status={doc.status} size="sm" />
                  </TableCell>
                  <TableCell className="font-mono text-xs text-foreground">
                    {doc.documentNumber || "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(doc.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleDownload(doc)}
                      className="gap-1.5 text-xs font-semibold"
                    >
                      <Download className="size-3.5" />
                      <span>Download</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {meta && (
            <Pagination
              currentPage={meta.page || 1}
              totalPages={meta.totalPages || 1}
              totalItems={meta.total || 0}
              pageSize={meta.limit || 10}
              onPageChange={(p) => setPage(p)}
            />
          )}
        </div>
      )}

      {/* Upload Document Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-sm border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/70 px-6 py-4 bg-muted/30">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <FolderLock className="size-4 text-gold" />
                <span>Upload Document to Vault</span>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 rounded-xs text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label="Close modal"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-foreground">
                  Document Title
                </label>
                <Input
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g. National ID Card / KRA Certificate"
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-foreground">
                    Document Category
                  </label>
                  <Select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="text-xs font-medium"
                  >
                    <option value="NATIONAL_ID">National ID / Passport</option>
                    <option value="KRA_PIN_CERTIFICATE">KRA PIN Certificate</option>
                    <option value="TAX_COMPLIANCE">Tax Compliance (TCC)</option>
                    <option value="BUSINESS_REGISTRATION">CR12 / Business Certificate</option>
                    <option value="POWER_OF_ATTORNEY">Power of Attorney</option>
                    <option value="STATUTORY_DOCUMENT">Other Statutory Document</option>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-foreground">
                    Document # (Optional)
                  </label>
                  <Input
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    placeholder="e.g. ID # or PIN #"
                    className="text-xs font-mono"
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
                <div className="flex items-start gap-2 rounded-xs border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsUploadModalOpen(false)}
                  disabled={uploadMutation.isPending}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => uploadMutation.mutate()}
                  isLoading={uploadMutation.isPending}
                  disabled={!selectedFile || !docTitle.trim() || uploadMutation.isPending}
                  className="bg-gold hover:bg-gold-light text-ink font-bold text-xs gap-1.5"
                >
                  <Upload className="size-3.5" />
                  <span>Save to Secure Vault</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
