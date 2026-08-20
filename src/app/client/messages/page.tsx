"use client";

import React, { useState } from "react";
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
  AlertCircle,
  Tag,
  Filter,
} from "lucide-react";
import { messagesApi, MessageThread, ApplicationMessageItem } from "@/lib/api/messages";
import { applicationsApi } from "@/lib/api/applications";
import { formatDate } from "@/lib/utils/format";
import type { Application } from "@/types";

export default function ClientMessagesPage() {
  const queryClient = useQueryClient();

  // State
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
  const [composeAppId, setComposeAppId] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeMessage, setComposeMessage] = useState("");
  const [composeSendEmail, setComposeSendEmail] = useState(true);
  const [composeSendSms, setComposeSendSms] = useState(false);

  // 1. Fetch Threads
  const {
    data: threads = [],
    isLoading: isThreadsLoading,
    refetch: refetchThreads,
  } = useQuery({
    queryKey: ["client-message-threads", folder, search],
    queryFn: () => messagesApi.getClientThreads(folder, search),
    refetchInterval: 15000,
  });

  // 2. Fetch Client Applications for Compose Dropdown
  const { data: appsData } = useQuery({
    queryKey: ["client-applications-compose"],
    queryFn: () => applicationsApi.getApplications({ page: 1, limit: 50 }),
  });
  const rawApps = appsData as any;
  const applications: Application[] = Array.isArray(rawApps) ? rawApps : rawApps?.items || [];

  // Filter threads by channel
  const filteredThreads = threads.filter((t) => {
    if (channelFilter === "ALL") return true;
    return t.latestChannel === channelFilter;
  });

  // Active Thread DTO
  const activeThread = threads.find((t) => t.id === activeThreadId) || null;

  // 3. Fetch Messages in Active Thread
  const {
    data: threadMessages = [],
    isLoading: isMessagesLoading,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ["client-thread-messages", activeThreadId],
    queryFn: () => (activeThreadId ? messagesApi.getClientThreadMessages(activeThreadId) : Promise.resolve([])),
    enabled: Boolean(activeThreadId),
  });

  // 4. Send Message Mutation (Reply)
  const sendReplyMutation = useMutation({
    mutationFn: () =>
      messagesApi.sendClientMessage({
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

  // 5. Compose New Thread Mutation
  const composeMutation = useMutation({
    mutationFn: () =>
      messagesApi.sendClientMessage({
        applicationId: composeAppId || (applications[0]?.id ?? ""),
        subject: composeSubject.trim() || undefined,
        message: composeMessage.trim(),
        channel: composeSendEmail ? "EMAIL" : composeSendSms ? "SMS" : "IN_APP",
        sendEmail: composeSendEmail,
        sendSms: composeSendSms,
      }),
    onSuccess: (newMsg) => {
      setIsComposeOpen(false);
      setComposeSubject("");
      setComposeMessage("");
      refetchThreads();
      if (newMsg.applicationId) {
        setActiveThreadId(newMsg.applicationId);
      }
    },
  });

  // Star Toggle Mutation
  const starMutation = useMutation({
    mutationFn: ({ appId, msgId }: { appId: string; msgId: string }) =>
      messagesApi.toggleStar(appId, msgId, false),
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

  // Unread Total
  const totalUnread = threads.reduce((acc, t) => acc + t.unreadCount, 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 text-slate-800">
      {/* 1. TOP HEADER & BAR */}
      <div className="max-w-7xl mx-auto mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Mail className="size-5 text-[#C5A059]" />
              <span>Officer Messages Hub</span>
            </h1>
            {totalUnread > 0 && (
              <span className="px-2 py-0.5 bg-[#C5A059] text-white text-[11px] font-bold rounded-full">
                {totalUnread} new
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Gmail-styled multi-channel communication engine with compliance officers via In-App, Email & SMS.
          </p>
        </div>

        {/* Top Search & Actions */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-72">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search mail, case #, subject..."
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
            onClick={() => {
              if (applications.length > 0) setComposeAppId(applications[0].id);
              setIsComposeOpen(true);
            }}
            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:opacity-95 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs shadow-sm transition-all"
          >
            <Plus className="size-4 stroke-[2.5]" />
            <span>Compose</span>
          </button>
        </div>
      </div>

      {/* 2. GMAIL 3-PANE CONTAINER */}
      <div className="max-w-7xl mx-auto bg-white rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden min-h-[620px] flex flex-col md:flex-row">
        {/* PANE 1: GMAIL SIDEBAR (Folders & Channels) */}
        <div className="w-full md:w-56 bg-slate-50/70 border-b md:border-b-0 md:border-r border-slate-200/80 p-3 shrink-0 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Compose Button in Sidebar */}
            <button
              onClick={() => {
                if (applications.length > 0) setComposeAppId(applications[0].id);
                setIsComposeOpen(true);
              }}
              className="w-full py-2.5 px-4 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all"
            >
              <Plus className="size-4 text-[#C5A059]" />
              <span>Compose Message</span>
            </button>

            {/* Folders List */}
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
                  <span>Inbox</span>
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
                  <span>Case Threads</span>
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
                  <span>Sent</span>
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

          {/* Officer Quick Help Card */}
          <div className="mt-4 p-3 bg-[#0F172A] rounded-xl text-white space-y-2">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
              <Shield className="size-3.5" />
              <span>Assigned Officer SLAs</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-snug">
              Messages logged here dispatch directly to your compliance manager and KRA/BRS processing team.
            </p>
          </div>
        </div>

        {/* PANE 2 & 3 MAIN AREA */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          {activeThread ? (
            /* THREAD VIEW (Gmail Email Chain View) */
            <div className="flex-1 flex flex-col h-full min-h-[580px]">
              {/* Thread Header */}
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
                    <div className="flex items-center gap-2">
                      <h2 className="text-xs font-bold text-slate-900 font-mono">
                        #{activeThread.applicationNumber}
                      </h2>
                      <span className="px-2 py-0.5 bg-slate-200/70 text-slate-700 text-[10px] font-bold rounded-md">
                        {activeThread.status}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800">{activeThread.subject}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/client/applications/${activeThread.applicationId}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#C5A059] hover:underline"
                  >
                    <span>View Dossier 360</span>
                    <ExternalLink className="size-3" />
                  </Link>
                </div>
              </div>

              {/* Thread Email Chain Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[420px] bg-slate-50/30">
                {isMessagesLoading ? (
                  <div className="p-8 text-center text-xs text-slate-500">Loading case messages...</div>
                ) : threadMessages.length === 0 ? (
                  <div className="p-12 text-center text-xs text-slate-500">No messages in thread yet.</div>
                ) : (
                  threadMessages.map((msg: ApplicationMessageItem) => {
                    const isClientSender = msg.senderRole === "CLIENT";
                    return (
                      <div
                        key={msg.id}
                        className={`rounded-xl border p-4 space-y-2 transition-all ${
                          isClientSender
                            ? "bg-white border-slate-200/90 shadow-sm ml-4"
                            : "bg-[#0F172A] border-slate-800 text-white mr-4 shadow-md"
                        }`}
                      >
                        {/* Header line */}
                        <div className="flex items-start justify-between gap-2 border-b border-slate-200/40 dark:border-slate-800 pb-2">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`size-7 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${
                                isClientSender
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-[#C5A059] text-slate-950"
                              }`}
                            >
                              {isClientSender ? <User className="size-4" /> : <Shield className="size-4" />}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold ${isClientSender ? "text-slate-900" : "text-white"}`}>
                                  {isClientSender ? "You (Client)" : "Swift Doc Officer"}
                                </span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                                  isClientSender ? "bg-slate-100 text-slate-600" : "bg-slate-800 text-amber-400"
                                }`}>
                                  {msg.channel || "IN_APP"}
                                </span>
                              </div>
                              <p className={`text-[10px] ${isClientSender ? "text-slate-500" : "text-slate-300"}`}>
                                {msg.sender?.email || "compliance@swiftdoc.co.ke"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-mono ${isClientSender ? "text-slate-400" : "text-slate-400"}`}>
                              {formatDate(msg.createdAt)}
                            </span>
                            <button
                              onClick={() => starMutation.mutate({ appId: activeThread.applicationId, msgId: msg.id })}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                            >
                              <Star className={`size-3.5 ${msg.isStarred ? "text-amber-500 fill-amber-500" : "text-slate-400"}`} />
                            </button>
                          </div>
                        </div>

                        {/* Subject if exists */}
                        {msg.subject && (
                          <p className={`text-xs font-bold ${isClientSender ? "text-slate-900" : "text-amber-400"}`}>
                            {msg.subject}
                          </p>
                        )}

                        {/* Body content */}
                        <p className={`text-xs leading-relaxed whitespace-pre-wrap ${isClientSender ? "text-slate-700" : "text-slate-200"}`}>
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
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[11px] font-medium hover:underline"
                              >
                                <Paperclip className="size-3 text-slate-500" />
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

              {/* Inline Gmail Quick Reply Drawer */}
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
                      <span>Email Officer</span>
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
                    placeholder={`Reply to compliance team on #${activeThread.applicationNumber}...`}
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
            /* THREAD LIST VIEW (Gmail Inbox List) */
            <div className="flex-1 flex flex-col h-full min-h-[580px]">
              {/* Inbox List Header */}
              <div className="px-4 py-3 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>
                  Showing {filteredThreads.length} conversation threads ({folder.toUpperCase()})
                </span>
                <span className="text-[11px] text-slate-400">Click a thread to inspect email chain</span>
              </div>

              {/* Threads Rows List */}
              <div className="flex-1 divide-y divide-slate-100 overflow-y-auto">
                {isThreadsLoading ? (
                  <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                    <RefreshCw className="size-4 animate-spin mx-auto text-[#C5A059]" />
                    <p>Loading officer communications...</p>
                  </div>
                ) : filteredThreads.length === 0 ? (
                  <div className="p-16 text-center space-y-3">
                    <Inbox className="size-10 text-slate-300 mx-auto" />
                    <h3 className="text-sm font-bold text-slate-800">No messages in this folder</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Use the &quot;Compose&quot; button to open a direct messaging thread with your assigned statutory compliance manager.
                    </p>
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
                        {/* Left Info */}
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
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {thread.lastSenderRole === "ADMIN" ? "Swift Doc Compliance Officer" : "You (Client)"}
                              </span>
                              <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 text-[10px] font-bold rounded font-mono shrink-0">
                                #{thread.applicationNumber}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 bg-amber-50 text-amber-700 rounded font-semibold shrink-0">
                                {thread.latestChannel}
                              </span>
                              {thread.unreadCount > 0 && (
                                <span className="px-1.5 py-0.2 bg-[#C5A059] text-white text-[10px] font-bold rounded-full shrink-0">
                                  {thread.unreadCount} new
                                </span>
                              )}
                            </div>

                            <p className="text-xs font-semibold text-slate-800 truncate">{thread.subject}</p>
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

      {/* 3. FLOATING GMAIL COMPOSE MODAL */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-4 py-3 bg-[#0F172A] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="size-4 text-[#C5A059]" />
                <span className="text-xs font-bold">Compose Compliance Message</span>
              </div>
              <button
                onClick={() => setIsComposeOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleComposeSubmit} className="p-4 space-y-3">
              {/* Select Case Application */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Select Statutory Dossier / Application *
                </label>
                <select
                  value={composeAppId || applications[0]?.id || ""}
                  onChange={(e) => setComposeAppId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#C5A059]"
                >
                  {applications.length === 0 ? (
                    <option value="">No active dossiers found</option>
                  ) : (
                    applications.map((app) => (
                      <option key={app.id} value={app.id}>
                        #{app.applicationNumber} — {app.service?.name || "Statutory Service"} ({app.status})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  placeholder="e.g. Clarification on CR12 / KRA PIN submission..."
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#C5A059]"
                />
              </div>

              {/* Delivery Channels */}
              <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Dispatch Channels:</span>
                <div className="flex items-center gap-3 text-slate-600 font-medium">
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
                    <span>SMS Alert</span>
                  </label>
                </div>
              </div>

              {/* Message Body */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Message Content *
                </label>
                <textarea
                  rows={4}
                  placeholder="Type your message to the assigned compliance officer..."
                  value={composeMessage}
                  onChange={(e) => setComposeMessage(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#C5A059] resize-none"
                />
              </div>

              {/* Modal Footer */}
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
                  <span>Send Message</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
