"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MessageSquare,
  Search,
  Send,
  User,
  Shield,
  Clock,
  CheckCircle2,
  FileText,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { PageShell } from "@/components/ui/layout-primitives";
import { Card, StatCard } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/form-primitives";
import { EmptyState, Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { adminApi } from "@/lib/api/admin";
import { formatDate } from "@/lib/utils/format";
import type { Application } from "@/types";

export default function AdminCommunicationsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");

  // Query applications to list active communication threads
  const {
    data: appsData,
    isLoading: isAppsLoading,
    error: appsError,
    refetch: refetchApps,
  } = useQuery({
    queryKey: ["admin-applications-threads"],
    queryFn: () => adminApi.getApplications({ page: 1, limit: 100 }),
  });

  const applications: Application[] = appsData?.items || [];

  // Filter applications by search
  const filteredApps = applications.filter((app) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const matchNum = app.applicationNumber?.toLowerCase().includes(q);
    const matchClient =
      app.client?.fullName?.toLowerCase().includes(q) ||
      app.client?.businessName?.toLowerCase().includes(q);
    const matchService = app.service?.name?.toLowerCase().includes(q);
    return matchNum || matchClient || matchService;
  });

  // Automatically select first application if none selected
  const activeApp =
    applications.find((a) => a.id === selectedAppId) || filteredApps[0] || null;

  // Query messages for active application
  const {
    data: messages,
    isLoading: isMessagesLoading,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ["admin-application-messages", activeApp?.id],
    queryFn: () => (activeApp ? adminApi.getApplicationMessages(activeApp.id) : Promise.resolve([])),
    enabled: Boolean(activeApp?.id),
  });

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: () =>
      adminApi.sendApplicationMessage(activeApp!.id, {
        message: messageInput.trim(),
      }),
    onSuccess: () => {
      setMessageInput("");
      refetchMessages();
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeApp) return;
    sendMutation.mutate();
  };

  return (
    <PageShell
      eyebrow="CLIENT OPERATIONS"
      title="Communications & Case Messaging"
      description="Direct statutory client messages, official compliance dispatches, and case-level communication threads."
    >
      {/* 1. METRICS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Active Case Threads"
          value={applications.length}
          subtitle="Dossiers with client messaging"
          icon={<MessageSquare className="size-5 text-navy dark:text-gold" />}
        />

        <StatCard
          title="Selected Case Dossier"
          value={activeApp ? `#${activeApp.applicationNumber}` : "None"}
          subtitle={activeApp?.service?.name || "Select a case"}
          icon={<FileText className="size-5 text-gold-dark dark:text-gold" />}
        />

        <StatCard
          title="Messages in Thread"
          value={messages?.length || 0}
          subtitle="Audited communications"
          icon={<CheckCircle2 className="size-5 text-emerald-600" />}
        />
      </div>

      {/* 2. DUAL PANE MESSAGING CENTER */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[580px]">
        {/* Left Column: Application Selector (4 cols) */}
        <Card padding="none" className="lg:col-span-4 flex flex-col border border-border overflow-hidden">
          <div className="p-3 border-b border-border bg-muted/20">
            <Input
              placeholder="Search case #, client, service..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftAddon={<Search className="size-4" />}
            />
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border/60 max-h-[500px]">
            {isAppsLoading ? (
              <div className="p-4 space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : filteredApps.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No matching applications found.
              </div>
            ) : (
              filteredApps.map((app) => {
                const isSelected = activeApp?.id === app.id;
                return (
                  <button
                    key={app.id}
                    onClick={() => setSelectedAppId(app.id)}
                    className={`w-full text-left p-3 transition-colors flex items-center justify-between ${
                      isSelected
                        ? "bg-gold/10 border-l-2 border-gold font-semibold"
                        : "hover:bg-muted/40"
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-navy dark:text-gold">
                          #{app.applicationNumber}
                        </span>
                        <Badge tone="neutral" size="sm">
                          {app.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-foreground font-semibold truncate">
                        {app.service?.name}
                      </p>
                      <span className="text-[11px] text-muted-foreground truncate block">
                        {app.client?.fullName || app.client?.businessName || "Client Entity"}
                      </span>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                  </button>
                );
              })
            )}
          </div>
        </Card>

        {/* Right Column: Interactive Chat / Message View (8 cols) */}
        <Card padding="none" className="lg:col-span-8 flex flex-col border border-border overflow-hidden">
          {activeApp ? (
            <>
              {/* Thread Header */}
              <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-navy dark:text-gold">
                      Case #{activeApp.applicationNumber}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs font-semibold text-foreground">
                      {activeApp.client?.fullName || activeApp.client?.businessName || "Client"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{activeApp.service?.name}</p>
                </div>

                <Link
                  href={`/admin/applications/${activeApp.id}`}
                  className="text-xs font-semibold text-gold-dark dark:text-gold hover:underline flex items-center gap-1"
                >
                  <span>Dossier 360</span>
                  <ExternalLink className="size-3.5" />
                </Link>
              </div>

              {/* Thread Messages Scroll Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[400px] bg-background/50">
                {isMessagesLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-14 w-3/4 ml-auto" />
                    <Skeleton className="h-14 w-3/4" />
                  </div>
                ) : !messages || messages.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <MessageSquare className="size-8 text-muted-foreground mx-auto" />
                    <p className="text-xs font-semibold text-foreground">No statutory messages recorded</p>
                    <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                      Send a message below to dispatch an official notice or request clarification from the client.
                    </p>
                  </div>
                ) : (
                  messages.map((msg: any) => {
                    const isAdmin = msg.senderRole === "ADMIN" || msg.senderType === "ADMIN";
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-2.5 max-w-[85%] ${
                          isAdmin ? "ml-auto flex-row-reverse" : "mr-auto"
                        }`}
                      >
                        <div
                          className={`size-7 rounded-full flex items-center justify-center shrink-0 ${
                            isAdmin
                              ? "bg-navy text-gold dark:bg-gold dark:text-navy"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          {isAdmin ? <Shield className="size-3.5" /> : <User className="size-3.5" />}
                        </div>

                        <div
                          className={`rounded-xs p-3 text-xs space-y-1 ${
                            isAdmin
                              ? "bg-gold/15 border border-gold/30 text-foreground"
                              : "bg-muted/40 border border-border text-foreground"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <span className="font-bold text-[11px]">
                              {isAdmin ? "Swift Doc Compliance Officer" : activeApp.client?.fullName || "Client"}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {formatDate(msg.createdAt)}
                            </span>
                          </div>
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Composer Footer */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-border bg-card flex gap-2">
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={`Send official dispatch on #${activeApp.applicationNumber}...`}
                  className="flex-1 text-xs"
                />
                <Button
                  type="submit"
                  variant="gold"
                  size="sm"
                  isLoading={sendMutation.isPending}
                  disabled={!messageInput.trim()}
                  leftIcon={<Send className="size-3.5" />}
                >
                  Send
                </Button>
              </form>
            </>
          ) : (
            <div className="p-12 text-center">
              <EmptyState
                icon={<MessageSquare className="size-8" />}
                title="Select a Case Application"
                description="Select an application thread from the left panel to inspect or dispatch messages."
              />
            </div>
          )}
        </Card>
      </div>
    </PageShell>
  );
}
