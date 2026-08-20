"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CheckCheck,
  Info,
  Sliders,
  Mail,
  Smartphone,
} from "lucide-react";
import { notificationsApi } from "@/lib/api/notifications";
import { formatRelativeTime } from "@/lib/utils/format";

export default function ClientNotificationsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"ALL" | "UNREAD" | "PREFERENCES">("ALL");

  const {
    data: notifications = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["client-notifications"],
    queryFn: () => notificationsApi.getNotifications(),
  });

  const { data: preferences } = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: () => notificationsApi.getPreferences(),
    enabled: filter === "PREFERENCES",
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["client-dashboard-overview"] });
    },
  });

  const markSingleMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["client-dashboard-overview"] });
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: (payload: any) => notificationsApi.updatePreferences(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
    },
  });

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "UNREAD") return n.status !== "READ" && !n.readAt;
    return true;
  });

  const unreadCount = notifications.filter((n) => n.status !== "READ" && !n.readAt).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER SECTION */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Notifications &amp; Registry Alerts
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time status transitions, document approvals, payment receipts, and SLA milestone alerts.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="px-3.5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-slate-800 transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-auto disabled:opacity-50"
          >
            <CheckCheck className="size-3.5" />
            <span>Mark All Read ({unreadCount})</span>
          </button>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. TABS NAVIGATION */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-px text-xs">
        <button
          onClick={() => setFilter("ALL")}
          className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 font-bold transition-all ${
            filter === "ALL"
              ? "border-amber-500 text-amber-700 bg-amber-50/40 rounded-t-lg"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Bell className="size-3.5" />
          <span>All Alerts ({notifications.length})</span>
        </button>

        <button
          onClick={() => setFilter("UNREAD")}
          className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 font-bold transition-all ${
            filter === "UNREAD"
              ? "border-amber-500 text-amber-700 bg-amber-50/40 rounded-t-lg"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <span className="size-2 rounded-full bg-amber-500" />
          <span>Unread ({unreadCount})</span>
        </button>

        <button
          onClick={() => setFilter("PREFERENCES")}
          className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 font-bold transition-all ${
            filter === "PREFERENCES"
              ? "border-amber-500 text-amber-700 bg-amber-50/40 rounded-t-lg"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Sliders className="size-3.5" />
          <span>Delivery Channels</span>
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. TAB CONTENT */}
      {/* ------------------------------------------------------------------ */}
      {filter === "PREFERENCES" ? (
        <div className="max-w-2xl space-y-4">
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Statutory Alert Channels
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure how Swift Doc and compliance officers notify you regarding registry progress and document queries.
              </p>
            </div>

            <div className="space-y-3 border-t border-slate-100 pt-3 text-xs">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                    <Mail className="size-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">Email Notifications</span>
                    <span className="text-slate-500 text-[11px]">
                      Receive detailed filing milestone reports and official PDF receipts.
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences?.emailEnabled ?? true}
                  onChange={(e) =>
                    updatePreferencesMutation.mutate({ emailEnabled: e.target.checked })
                  }
                  className="size-4 rounded text-amber-600 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-between py-2 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <Smartphone className="size-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">SMS Urgent Alerts</span>
                    <span className="text-slate-500 text-[11px]">
                      Instant SMS when a compliance officer requires document replacement or government grants approval.
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences?.smsEnabled ?? true}
                  onChange={(e) =>
                    updatePreferencesMutation.mutate({ smsEnabled: e.target.checked })
                  }
                  className="size-4 rounded text-amber-600 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-8 text-center space-y-3">
          <p className="text-xs font-bold text-rose-800">Failed to load alerts.</p>
          <button
            onClick={() => refetch()}
            className="px-3 py-1.5 bg-white border border-rose-300 text-rose-700 text-xs font-bold rounded-lg hover:bg-rose-100 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center space-y-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
            <Bell className="size-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            {filter === "UNREAD" ? "No unread alerts" : "All caught up"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You have no notifications in this category.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => {
            const isUnread = notif.status !== "READ" && !notif.readAt;

            return (
              <div
                key={notif.id}
                onClick={() => {
                  if (isUnread) markSingleMutation.mutate(notif.id);
                }}
                className={`flex items-start gap-3.5 rounded-xl p-4 transition-all duration-150 cursor-pointer border ${
                  isUnread
                    ? "border-amber-300/80 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
                    : "border-slate-200/80 bg-white hover:border-slate-300 shadow-2xs opacity-80"
                }`}
              >
                <div
                  className={`size-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    isUnread ? "bg-amber-50 text-amber-700 border border-amber-200/80" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <Info className="size-4" />
                </div>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">
                        {notif.title}
                      </h4>
                      {isUnread && (
                        <span className="size-2 rounded-full bg-amber-500 shrink-0" />
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {formatRelativeTime(notif.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed font-medium">
                    {notif.message}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
