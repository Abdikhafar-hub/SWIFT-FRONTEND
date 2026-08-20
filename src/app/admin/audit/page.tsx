"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Lock, Activity, Search, Eye, Filter } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Skeleton, ErrorState, EmptyState } from "@/components/ui/feedback-primitives";
import { adminApi } from "@/lib/api/admin";
import { formatDate } from "@/lib/utils/format";
import type { AuditLog } from "@/types";

export default function AdminAuditPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [resourceFilter, setResourceFilter] = useState("");
  const [inspectingLog, setInspectingLog] = useState<AuditLog | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-audit-logs", page, search, resourceFilter],
    queryFn: () =>
      adminApi.getAuditLogs({
        page,
        limit: 15,
        resource: resourceFilter || undefined,
        action: search || undefined,
      }),
  });

  const logs = data?.items || [];
  const pagination = data?.pagination;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER SECTION */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Immutable Security &amp; Audit Ledger
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Cryptographically structured, tamper-evident audit trails for administrative state transitions, document QC approvals, and financial transactions.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 shrink-0 self-start sm:self-auto">
          <ShieldCheck className="size-4 text-emerald-600" />
          <span>Audit Log Protocol Active</span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. FILTERS & SEARCH */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by action type, resource ID, or keyword..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-slate-800 placeholder-slate-400"
          />
        </div>

        <select
          value={resourceFilter}
          onChange={(e) => {
            setResourceFilter(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-56 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-semibold text-slate-700"
        >
          <option value="">All Audit Resources</option>
          <option value="APPLICATION">Application Lifecycle</option>
          <option value="DOCUMENT">Document QA &amp; Uploads</option>
          <option value="PAYMENT">Payment &amp; Settlement</option>
          <option value="CLIENT">Client Records</option>
          <option value="USER">Admin Officers</option>
          <option value="SYSTEM">Automated System Sweeps</option>
        </select>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. AUDIT LOGS TABLE */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-xs font-bold text-rose-600">Failed to load security audit logs.</p>
            <button
              onClick={() => refetch()}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              Retry Loading
            </button>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <ShieldCheck className="size-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No audit logs found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No security audit events matched your search query or filter.
            </p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Event Action</th>
                    <th className="py-3 px-4">Resource Target</th>
                    <th className="py-3 px-4">Actor / Origin</th>
                    <th className="py-3 px-4">IP Address</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4 text-right">Inspection</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-900 font-bold">
                        <span>{log.resource}</span>
                        {log.resourceId && (
                          <span className="text-slate-400 ml-1 text-[10px]">
                            (#{String(log.resourceId).slice(0, 8)})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs font-bold text-slate-800">
                        {log.actorEmail || log.actorId || "SYSTEM (Autonomous)"}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-500 font-medium">
                        {log.ipAddress || "127.0.0.1"}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 font-medium">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setInspectingLog(log)}
                          className="bg-white border border-slate-200 text-slate-700 font-bold text-xs px-2.5 py-1 rounded-lg hover:bg-slate-50 transition-all inline-flex items-center gap-1"
                        >
                          <Eye className="size-3 text-slate-500" />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="px-4 py-3 bg-slate-50/60 border-t border-slate-200/80 flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} total items)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    disabled={pagination.page >= pagination.totalPages}
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

      {/* AUDIT LOG DETAIL INSPECTOR MODAL */}
      <Modal
        isOpen={Boolean(inspectingLog)}
        onClose={() => setInspectingLog(null)}
        title="Audit Event Forensics"
        description={`Audit Log ID: ${inspectingLog?.id}`}
        footer={
          <div className="flex items-center justify-end">
            <Button variant="ghost" size="sm" onClick={() => setInspectingLog(null)}>
              Close
            </Button>
          </div>
        }
      >
        {inspectingLog && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div>
                <span className="text-slate-500 block text-[10px] font-semibold uppercase">Action</span>
                <strong className="text-slate-900">{inspectingLog.action}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-semibold uppercase">Resource Target</span>
                <strong className="text-slate-900">{inspectingLog.resource}: {inspectingLog.resourceId || "N/A"}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-semibold uppercase">Actor</span>
                <span className="text-slate-900 font-bold">{inspectingLog.actorEmail || inspectingLog.actorId || "SYSTEM"}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-semibold uppercase">IP &amp; User Agent</span>
                <span className="font-mono text-slate-600 text-[10px] block truncate font-medium">
                  {inspectingLog.ipAddress || "127.0.0.1"} • {inspectingLog.userAgent || "Internal"}
                </span>
              </div>
            </div>

            <div>
              <span className="text-slate-600 block text-[11px] font-bold mb-1">
                Forensic Payload Metadata:
              </span>
              <pre className="rounded-xl border border-slate-200 bg-slate-900 text-amber-400 p-3 font-mono text-[11px] overflow-x-auto max-h-60">
                {JSON.stringify(inspectingLog.metadata || {}, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
