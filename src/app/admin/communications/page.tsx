"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Inbox,
  Send,
  Star,
  FileText,
  Search,
  RefreshCw,
  Plus,
  Paperclip,
  CheckCircle2,
  Clock,
  Shield,
  User,
  ChevronLeft,
  Mail,
  MessageSquare,
  Smartphone,
  ExternalLink,
  X,
  Filter,
  Check,
  Building2,
  UserCheck,
} from "lucide-react";
import { messagesApi, MessageThread, ApplicationMessageItem } from "@/lib/api/messages";
import { adminApi } from "@/lib/api/admin";
import { formatDate } from "@/lib/utils/format";
import type { Application } from "@/types";

export default function AdminCommunicationsPage() {
  const queryClient = useQueryClient();

  // Navigation / Filter State
  const [folder, setFolder] = useState<"inbox" | "starred" | "all" | "sent">("inbox");
  const [channelFilter, setChannelFilter] = useState<"ALL" | "IN_APP" | "EMAIL" | "SMS">("ALL");
  const [search, setSearch] = useState("");
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  // Reply form state
  const [replyMessage, setReplyMessage] = useState("");
  const [replySendEmail, setReplySendEmail] = useState(true);
  const [replySendSms, setReplySendSms] = useState(false);

  // Compose modal state
  const [recipientSearch, setRecipientSearch] = useState("");
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [composeSubject, setComposeSubject] = useState("");
  const [composeMessage, setComposeMessage] = useState("");
  const [composeSendInApp, setComposeSendInApp] = useState(true);
  const [composeSendEmail, setComposeSendEmail] = useState(true);
  const [composeSendSms, setComposeSendSms] = useState(false);

  // 1. Fetch Admin Message Threads
  const {
    data: threads = [],
    isLoading: isThreadsLoading,
    refetch: refetchThreads,
  } = useQuery({
    queryKey: ["admin-message-threads", folder, search],
    queryFn: () => messagesApi.getAdminThreads(folder, search),
    refetchInterval: 15000,
  });

  // 2. Fetch Admin Applications for Recipient / Case Selector
  const { data: appsData } = useQuery({
    queryKey: ["admin-applications-compose"],
    queryFn: () => adminApi.getApplications({ page: 1, limit: 100 }),
  });
  const rawApps = appsData as any;
  const applications: Application[] = useMemo(() => {
    if (Array.isArray(rawApps)) return rawApps;
    return rawApps?.items || [];
  }, [rawApps]);

  // Filter threads by channel filter selection
  const filteredThreads = useMemo(() => {
    return threads.filter((t) => {
      if (channelFilter === "ALL") return true;
      return t.latestChannel === channelFilter;
    });
  }, [threads, channelFilter]);

  // Active Thread DTO
  const activeThread = useMemo(() => {
    return threads.find((t) => t.id === activeThreadId) || null;
  }, [threads, activeThreadId]);

  // 3. Fetch Messages in Active Thread
  const {
    data: threadMessages = [],
    isLoading: isMessagesLoading,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ["admin-thread-messages", activeThreadId],
    queryFn: () => (activeThreadId ? messagesApi.getAdminThreadMessages(activeThreadId) : Promise.resolve([])),
    enabled: Boolean(activeThreadId),
  });

  // Filter applications for the compose modal recipient selector
  const searchedApplications = useMemo(() => {
    if (!recipientSearch.trim()) return applications;
    const q = recipientSearch.toLowerCase();
    return applications.filter((app) => {
      const clientName = (app.client?.fullName || app.client?.businessName || "").toLowerCase();
      const clientEmail = (app.client?.email || "").toLowerCase();
      const clientPhone = (app.client?.phone || "").toLowerCase();
      const appNum = (app.applicationNumber || "").toLowerCase();
      const serviceName = (app.service?.name || "").toLowerCase();
      return (
        clientName.includes(q) ||
        clientEmail.includes(q) ||
        clientPhone.includes(q) ||
        appNum.includes(q) ||
        serviceName.includes(q)
      );
    });
  }, [applications, recipientSearch]);

  // 4. Send Reply Mutation
  const sendReplyMutation = useMutation({
    mutationFn: () =>
      messagesApi.sendAdminMessage({
        applicationId: activeThreadId!,
        message: replyMessage.trim(),
        channel: replySendEmail ? "EMAIL" : replySendSms ? "SMS" : "IN_APP",
        sendEmail: replySendEmail,
        sendSms: replySendSms,
      }),
    onSuccess: () => {
      setReplyMessage("");
      refetchMessages();
      refetchThreads();
    },
  });

  // 5. Compose New Thread / Multi-Channel Dispatch Mutation
  const composeMutation = useMutation({
    mutationFn: () => {
      const appId = selectedApp?.id || applications[0]?.id;
      if (!appId) throw new Error("Please select a target client application.");
      
      // Primary channel determination
      let primaryChannel: "IN_APP" | "EMAIL" | "SMS" = "IN_APP";
      if (composeSendEmail && !composeSendInApp) primaryChannel = "EMAIL";
      if (composeSendSms && !composeSendInApp && !composeSendEmail) primaryChannel = "SMS";

      return messagesApi.sendAdminMessage({
        applicationId: appId,
        subject: composeSubject.trim() || undefined,
        message: composeMessage.trim(),
        channel: primaryChannel,
        sendEmail: composeSendEmail,
        sendSms: composeSendSms,
      });
    },
    onSuccess: (newMsg) => {
      setIsComposeOpen(false);
      setComposeSubject("");
      setComposeMessage("");
      setRecipientSearch("");
      setSelectedApp(null);
      refetchThreads();
      if (newMsg.applicationId) {
        setActiveThreadId(newMsg.applicationId);
      }
    },
  });

  // Star Toggle Mutation
  const starMutation = useMutation({
    mutationFn: ({ appId, msgId }: { appId: string; msgId: string }) =>
      messagesApi.toggleStar(appId, msgId, true),
    onSuccess: () => {
      refetchThreads();
      if (activeThreadId) refetchMessages();
    },
  });

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !activeThreadId) return;
    sendReplyMutation.mutate();
  };

  const handleComposeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeMessage.trim()) return;
    composeMutation.mutate();
  };

  // Open Compose modal pre-configured
  const handleOpenCompose = (targetApp?: Application) => {
    if (targetApp) {
      setSelectedApp(targetApp);
    } else if (applications.length > 0) {
      setSelectedApp(applications[0]);
    }
    setIsComposeOpen(true);
  };

  // Total Unread Count
  const totalUnread = useMemo(() => {
    return threads.reduce((acc, t) => acc + (t.unreadCount || 0), 0);
  }, [threads]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 text-slate-800">
      {/* 1. TOP HEADER & BAR */}
      <div className="max-w-7xl mx-auto mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Mail className="size-5 text-[#C5A059]" />
              <span>Admin Communications</span>
            </h1>
            {totalUnread > 0 && (
              <span className="px-2 py-0.5 bg-[#C5A059] text-white text-[11px] font-bold rounded-full">
                {totalUnread} unread
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Official multi-channel communications with clients via In-App, Email &amp; SMS.
          </p>
        </div>

        {/* Top Search & Actions */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-72">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search case #, client name, subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200/90 rounded-lg text-xs font-medium placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#C5A059]"
            />
          </div>
          <button
            onClick={() => refetchThreads()}
            title="Refresh inbox"
            className="p-2 bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors"
          >
            <RefreshCw className="size-3.5" />
          </button>
          <button
            onClick={() => handleOpenCompose()}
            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:opacity-95 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs shadow-sm transition-all"
          >
            <Plus className="size-4 stroke-[2.5]" />
            <span>Dispatch Message</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN 3-PANE MESSAGING CONTAINER */}
      <div className="max-w-7xl mx-auto bg-white rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden min-h-[620px] flex flex-col md:flex-row">
        {/* PANE 1: LEFT SIDEBAR (Folders & Channels) */}
        <div className="w-full md:w-56 bg-slate-50/70 border-b md:border-b-0 md:border-r border-slate-200/80 p-3 shrink-0 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Primary Compose / Dispatch CTA in Sidebar */}
            <button
              onClick={() => handleOpenCompose()}
              className="w-full py-2.5 px-4 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all"
            >
              <Plus className="size-4 text-[#C5A059]" />
              <span>Dispatch Message</span>
            </button>

            {/* Mail Folders Section */}
            <div className="space-y-1">
              <span className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Mail Folders
              </span>

              <button
                onClick={() => {
                  setFolder("inbox");
                  setActiveThreadId(null);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  folder === "inbox"
                    ? "bg-[#C5A059]/15 text-[#9E7B32] font-bold"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Inbox className="size-4 text-slate-500" />
                  <span>Client Inbox</span>
                </div>
                {totalUnread > 0 && (
                  <span className="px-1.5 py-0.5 bg-[#C5A059] text-white text-[10px] font-extrabold rounded-full">
                    {totalUnread}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setFolder("starred");
                  setActiveThreadId(null);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  folder === "starred"
                    ? "bg-[#C5A059]/15 text-[#9E7B32] font-bold"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Star className="size-4 text-amber-500" />
                  <span>Starred</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setFolder("all");
                  setActiveThreadId(null);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  folder === "all"
                    ? "bg-[#C5A059]/15 text-[#9E7B32] font-bold"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-slate-500" />
                  <span>All Client Cases</span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">{threads.length}</span>
              </button>

              <button
                onClick={() => {
                  setFolder("sent");
                  setActiveThreadId(null);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  folder === "sent"
                    ? "bg-[#C5A059]/15 text-[#9E7B32] font-bold"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Send className="size-4 text-slate-500" />
                  <span>Sent Dispatches</span>
                </div>
              </button>
            </div>

            {/* Delivery Channel Filters */}
            <div className="space-y-1 pt-2 border-t border-slate-200/70">
              <span className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Channel Filter</span>
                <Filter className="size-3 text-slate-400" />
              </span>

              {[
                { label: "All Channels", value: "ALL", icon: Mail },
                { label: "In-App Portal", value: "IN_APP", icon: MessageSquare },
                { label: "Email (Resend)", value: "EMAIL", icon: Mail },
                { label: "SMS (AfricasTalking)", value: "SMS", icon: Smartphone },
              ].map((ch) => {
                const Icon = ch.icon;
                const active = channelFilter === ch.value;
                return (
                  <button
                    key={ch.value}
                    onClick={() => setChannelFilter(ch.value as any)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      active
                        ? "bg-slate-200/70 text-slate-900 font-bold"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="size-3.5 text-slate-500" />
                    <span>{ch.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Officer SLA & System Telemetry Card */}
          <div className="mt-4 p-3 bg-[#0F172A] rounded-xl text-white space-y-2">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
              <Shield className="size-3.5" />
              <span>Multi-Channel Engine</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-snug">
              Every message dispatched here communicates with clients via In-App Portal, Resend Email &amp; Africa&apos;s Talking SMS.
            </p>
          </div>
        </div>

        {/* PANE 2 & 3: MAIN MESSAGING WORKSPACE */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          {activeThread ? (
            /* THREAD / CONVERSATION VIEW */
            <div className="flex-1 flex flex-col h-full min-h-[580px]">
              {/* Thread Header Bar */}
              <div className="px-4 py-3 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveThreadId(null)}
                    className="p-1 hover:bg-slate-200/60 rounded-lg text-slate-600 transition-colors"
                    title="Back to inbox"
                  >
                    <ChevronLeft className="size-4" />
                  </button>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 font-mono">
                        #{activeThread.applicationNumber}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-200/70 text-slate-700 text-[10px] font-bold rounded-md uppercase">
                        {activeThread.status}
                      </span>
                      <span className="text-xs text-slate-600 font-medium">
                        Client: <strong className="text-slate-900">{activeThread.clientName}</strong> ({activeThread.clientEmail})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-bold text-[#C5A059]">[{activeThread.serviceName}]</span>
                      <span className="text-xs font-semibold text-slate-800">{activeThread.subject}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/admin/applications/${activeThread.applicationId}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#C5A059]/10 text-[#9E7B32] hover:bg-[#C5A059]/20 rounded-lg text-xs font-bold transition-all"
                  >
                    <span>Inspect Dossier 360</span>
                    <ExternalLink className="size-3" />
                  </Link>
                </div>
              </div>

              {/* Thread Conversation Stream */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[420px] bg-slate-50/30">
                {isMessagesLoading ? (
                  <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                    <RefreshCw className="size-4 animate-spin mx-auto text-[#C5A059]" />
                    <p>Loading conversation messages...</p>
                  </div>
                ) : threadMessages.length === 0 ? (
                  <div className="p-12 text-center space-y-3">
                    <MessageSquare className="size-8 text-slate-300 mx-auto" />
                    <h4 className="text-xs font-bold text-slate-700">No messages in this thread yet.</h4>
                    <p className="text-xs text-slate-500">Start the conversation with this client below.</p>
                  </div>
                ) : (
                  threadMessages.map((msg: ApplicationMessageItem) => {
                    const isAdminSender = msg.senderRole === "ADMIN";
                    return (
                      <div
                        key={msg.id}
                        className={`rounded-xl border p-4 space-y-2 transition-all ${
                          isAdminSender
                            ? "bg-[#0F172A] border-slate-800 text-white ml-4 shadow-md"
                            : "bg-white border-slate-200/90 text-slate-900 mr-4 shadow-sm"
                        }`}
                      >
                        {/* Header line */}
                        <div className="flex items-start justify-between gap-2 border-b border-slate-200/40 dark:border-slate-800 pb-2">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`size-7 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${
                                isAdminSender
                                  ? "bg-[#C5A059] text-slate-950"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {isAdminSender ? <Shield className="size-4" /> : <User className="size-4" />}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold ${isAdminSender ? "text-white" : "text-slate-900"}`}>
                                  {isAdminSender ? "Compliance Officer (You)" : activeThread.clientName}
                                </span>
                                <span
                                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                                    isAdminSender ? "bg-slate-800 text-amber-400" : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {msg.channel || "IN_APP"}
                                </span>
                              </div>
                              <p className={`text-[10px] ${isAdminSender ? "text-slate-300" : "text-slate-500"}`}>
                                {msg.sender?.email || (isAdminSender ? "compliance@swiftdoc.co.ke" : activeThread.clientEmail)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-slate-400">
                              {formatDate(msg.createdAt)}
                            </span>
                            <button
                              onClick={() => starMutation.mutate({ appId: activeThread.applicationId, msgId: msg.id })}
                              className="p-1 hover:bg-slate-800/40 rounded transition-colors"
                            >
                              <Star
                                className={`size-3.5 ${
                                  msg.isStarred ? "text-amber-500 fill-amber-500" : "text-slate-400"
                                }`}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Subject line if present */}
                        {msg.subject && (
                          <p className={`text-xs font-bold ${isAdminSender ? "text-amber-400" : "text-slate-900"}`}>
                            {msg.subject}
                          </p>
                        )}

                        {/* Message body */}
                        <p
                          className={`text-xs leading-relaxed whitespace-pre-wrap ${
                            isAdminSender ? "text-slate-200" : "text-slate-700"
                          }`}
                        >
                          {msg.message}
                        </p>

                        {/* Attachments */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="pt-2 flex flex-wrap gap-2">
                            {msg.attachments.map((att) => (
                              <a
                                key={att.id}
                                href={att.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 rounded-lg text-[11px] font-medium text-slate-200 hover:underline"
                              >
                                <Paperclip className="size-3 text-slate-400" />
                                <span className="truncate max-w-xs">{att.fileName}</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Quick Dispatch / Reply Drawer */}
              <form onSubmit={handleSendReply} className="p-3 border-t border-slate-200/80 bg-white space-y-2">
                <div className="flex items-center justify-between gap-3 text-[11px]">
                  <span className="font-bold text-slate-700">Dispatch Channels:</span>
                  <div className="flex items-center gap-4 text-slate-600 font-medium">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={replySendEmail}
                        onChange={(e) => setReplySendEmail(e.target.checked)}
                        className="rounded text-[#C5A059] focus:ring-[#C5A059]"
                      />
                      <span>Email Officer Dispatch</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={replySendSms}
                        onChange={(e) => setReplySendSms(e.target.checked)}
                        className="rounded text-[#C5A059] focus:ring-[#C5A059]"
                      />
                      <span>SMS Alert</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-end gap-2">
                  <textarea
                    rows={2}
                    placeholder={`Write official dispatch on #${activeThread.applicationNumber}...`}
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#C5A059] resize-none"
                  />
                  <button
                    type="submit"
                    disabled={!replyMessage.trim() || sendReplyMutation.isPending}
                    className="px-4 py-2 bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:opacity-95 text-slate-950 font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5 disabled:opacity-40 transition-all shrink-0"
                  >
                    <Send className="size-3.5" />
                    <span>Send</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* MAIN INBOX LIST VIEW */
            <div className="flex-1 flex flex-col h-full min-h-[580px]">
              {/* Inbox List Header */}
              <div className="px-4 py-3 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>
                  Showing {filteredThreads.length} client conversation threads ({folder.toUpperCase()})
                </span>
                <span className="text-[11px] text-slate-400">Click a thread to inspect message chain</span>
              </div>

              {/* Thread Rows Stream */}
              <div className="flex-1 divide-y divide-slate-100 overflow-y-auto">
                {isThreadsLoading ? (
                  <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                    <RefreshCw className="size-4 animate-spin mx-auto text-[#C5A059]" />
                    <p>Loading client communications...</p>
                  </div>
                ) : filteredThreads.length === 0 ? (
                  <div className="p-16 text-center space-y-3">
                    <Inbox className="size-10 text-slate-300 mx-auto" />
                    <h3 className="text-sm font-bold text-slate-800">No messages in this folder</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Click the &quot;+ Dispatch Message&quot; button to initiate multi-channel communications with any registered client.
                    </p>
                    <button
                      onClick={() => handleOpenCompose()}
                      className="px-4 py-2 bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:opacity-95 text-slate-950 text-xs font-bold rounded-lg shadow-sm inline-flex items-center gap-1.5 transition-all"
                    >
                      <Plus className="size-3.5 stroke-[2.5]" />
                      <span>+ Dispatch Message</span>
                    </button>
                  </div>
                ) : (
                  filteredThreads.map((thread) => {
                    return (
                      <div
                        key={thread.id}
                        onClick={() => setActiveThreadId(thread.id)}
                        className={`group px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                          thread.unreadCount > 0 ? "bg-[#C5A059]/5 font-bold" : ""
                        }`}
                      >
                        {/* Left Content */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (thread.lastMessageSnippet) {
                                // Star toggle
                              }
                            }}
                            className="p-1 hover:bg-slate-200/60 rounded transition-colors shrink-0"
                          >
                            <Star
                              className={`size-4 ${
                                thread.isStarred
                                  ? "text-amber-500 fill-amber-500"
                                  : "text-slate-300 group-hover:text-slate-400"
                              }`}
                            />
                          </button>

                          <div className="min-w-0 flex-1 space-y-0.5">
                            {/* Client & Case Details Header */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {thread.clientName}
                              </span>
                              <span className="text-xs text-slate-400 truncate">
                                ({thread.clientEmail})
                              </span>
                              <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 text-[10px] font-bold rounded font-mono shrink-0">
                                #{thread.applicationNumber}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 bg-amber-50 text-amber-700 rounded font-semibold shrink-0 uppercase">
                                {thread.latestChannel}
                              </span>
                              {thread.unreadCount > 0 && (
                                <span className="px-1.5 py-0.2 bg-[#C5A059] text-white text-[10px] font-bold rounded-full shrink-0">
                                  {thread.unreadCount} unread
                                </span>
                              )}
                            </div>

                            {/* Service Category & Subject */}
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="text-xs font-bold text-[#C5A059] shrink-0">
                                [{thread.serviceName}]
                              </span>
                              <span className="text-xs font-semibold text-slate-800 truncate">
                                {thread.subject}
                              </span>
                            </div>

                            {/* Snippet */}
                            <p className="text-xs text-slate-500 truncate">{thread.lastMessageSnippet}</p>
                          </div>
                        </div>

                        {/* Right Timestamp */}
                        <div className="text-right shrink-0">
                          <span className="text-[11px] text-slate-400 font-mono">
                            {formatDate(thread.lastMessageAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. MULTI-CLIENT ENTERPRISE DISPATCH MODAL */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-4 py-3 bg-[#0F172A] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="size-4 text-[#C5A059]" />
                <span className="text-xs font-bold">Dispatch Message to Client</span>
              </div>
              <button
                onClick={() => setIsComposeOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleComposeSubmit} className="p-4 space-y-3.5">
              {/* Recipient Search & Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  To (Search Client Name, Email, Phone, Application #) *
                </label>
                
                {selectedApp ? (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-7 rounded-full bg-[#C5A059]/20 text-[#9E7B32] flex items-center justify-center font-bold text-xs shrink-0">
                        <User className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {selectedApp.client?.fullName || selectedApp.client?.businessName || "Client"}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono truncate">
                          {selectedApp.client?.email} &bull; #{selectedApp.applicationNumber} [{selectedApp.service?.name}]
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedApp(null)}
                      className="text-xs font-bold text-slate-400 hover:text-red-600 px-2 py-1 transition-colors"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="relative">
                      <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search client name, email, application #..."
                        value={recipientSearch}
                        onChange={(e) => setRecipientSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#C5A059]"
                      />
                    </div>

                    <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white">
                      {searchedApplications.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-500">No matching clients found</div>
                      ) : (
                        searchedApplications.map((app) => (
                          <button
                            key={app.id}
                            type="button"
                            onClick={() => setSelectedApp(app)}
                            className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center justify-between gap-2 transition-colors"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">
                                {app.client?.fullName || app.client?.businessName || "Client Entity"}
                              </p>
                              <p className="text-[10px] text-slate-500 truncate font-mono">
                                {app.client?.email} &bull; #{app.applicationNumber}
                              </p>
                            </div>
                            <span className="text-[10px] font-bold text-[#C5A059] shrink-0">
                              {app.service?.name || "Service"}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Subject */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  placeholder="e.g. Statutory Requirement: Resubmission of CR12 form..."
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#C5A059]"
                />
              </div>

              {/* Multi-Channel Dispatch Controls */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Dispatch Channels
                </label>
                <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Select Channels:</span>
                  <div className="flex items-center gap-3 text-slate-600 font-medium">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={composeSendInApp}
                        onChange={(e) => setComposeSendInApp(e.target.checked)}
                        className="rounded text-[#C5A059] focus:ring-[#C5A059]"
                      />
                      <span>In-App Portal</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={composeSendEmail}
                        onChange={(e) => setComposeSendEmail(e.target.checked)}
                        className="rounded text-[#C5A059] focus:ring-[#C5A059]"
                      />
                      <span>Email</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={composeSendSms}
                        onChange={(e) => setComposeSendSms(e.target.checked)}
                        className="rounded text-[#C5A059] focus:ring-[#C5A059]"
                      />
                      <span>SMS</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Message Body */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Message Content *
                </label>
                <textarea
                  rows={4}
                  placeholder="Write official officer communication to client..."
                  value={composeMessage}
                  onChange={(e) => setComposeMessage(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#C5A059] resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200/70">
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!composeMessage.trim() || composeMutation.isPending}
                  className="px-4 py-1.5 bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:opacity-95 text-slate-950 text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 disabled:opacity-40 transition-all"
                >
                  <Send className="size-3.5" />
                  <span>Dispatch Message</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
