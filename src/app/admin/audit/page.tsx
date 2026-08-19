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
    <PageShell
      eyebrow="REGULATORY COMPLIANCE & SECURITY"
      title="Immutable Security & Audit Ledger"
      description="Cryptographically structured, tamper-evident audit trails for administrative state transitions, document QC approvals, and financial transactions."
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3 max-w-md">
          <Input
            placeholder="Search by action type, resource ID, or keyword..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            leftAddon={<Search className="size-4" />}
          />
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={resourceFilter}
            onChange={(e) => {
              setResourceFilter(e.target.value);
              setPage(1);
            }}
            className="w-48 text-xs"
            options={[
              { value: "", label: "All Audit Resources" },
              { value: "APPLICATION", label: "Application Lifecycle" },
              { value: "DOCUMENT", label: "Document QA & Uploads" },
              { value: "PAYMENT", label: "Payment & Settlement" },
              { value: "CLIENT", label: "Client Records" },
              { value: "USER", label: "Admin Officers" },
              { value: "SYSTEM", label: "Automated System Sweeps" },
            ]}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : error ? (
        <ErrorState onRetry={() => refetch()} />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="size-7" />}
          title="No audit logs found"
          description="No security audit events matched your search query."
        />
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Action</TableHead>
                <TableHead>Resource Target</TableHead>
                <TableHead>Actor / Origin</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead className="text-right">Inspection</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Badge tone="gold" size="sm">
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-foreground">
                    <span className="font-semibold">{log.resource}</span>
                    {log.resourceId && (
                      <span className="text-muted-foreground ml-1 text-[11px]">
                        (#{String(log.resourceId).slice(0, 8)})
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-foreground">
                    {log.actorEmail || log.actorId || "SYSTEM (Autonomous)"}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {log.ipAddress || "127.0.0.1"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(log.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="xs"
                      leftIcon={<Eye className="size-3.5" />}
                      onClick={() => setInspectingLog(log)}
                    >
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {pagination && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              pageSize={pagination.limit}
              onPageChange={(p: number) => setPage(p)}
            />
          )}
        </div>
      )}

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
            <div className="grid grid-cols-2 gap-3 rounded-xs border border-border bg-muted/20 p-3">
              <div>
                <span className="text-muted-foreground block text-[11px]">Action</span>
                <strong className="text-foreground">{inspectingLog.action}</strong>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Resource Target</span>
                <strong className="text-foreground">{inspectingLog.resource}: {inspectingLog.resourceId || "N/A"}</strong>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Actor</span>
                <span className="text-foreground">{inspectingLog.actorEmail || inspectingLog.actorId || "SYSTEM"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">IP & User Agent</span>
                <span className="font-mono text-muted-foreground text-[10px] block truncate">
                  {inspectingLog.ipAddress || "127.0.0.1"} • {inspectingLog.userAgent || "Internal"}
                </span>
              </div>
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px] font-semibold mb-1">
                Forensic Payload Metadata:
              </span>
              <pre className="rounded-xs border border-border bg-card p-3 font-mono text-[11px] text-foreground overflow-x-auto max-h-60">
                {JSON.stringify(inspectingLog.metadata || {}, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </PageShell>
  );
}
