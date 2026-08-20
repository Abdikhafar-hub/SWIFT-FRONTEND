"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Sliders, Shield, Mail, Smartphone, Radio, CheckCircle2 } from "lucide-react";
import { PageShell } from "@/components/ui/layout-primitives";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table-primitives";
import { Skeleton, ErrorState, EmptyState } from "@/components/ui/feedback-primitives";
import { notificationsApi } from "@/lib/api/notifications";
import { formatDate } from "@/lib/utils/format";
import type { Notification } from "@/types";

export default function AdminNotificationsPage() {
  const queryClient = useQueryClient();
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);

  // 1. Fetch live administrative notifications
  const {
    data: notifications = [],
    isLoading: isNotifsLoading,
    error: notifsError,
    refetch: refetchNotifs,
  } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: () => notificationsApi.getNotifications(),
  });

  // 2. Fetch live notification preferences
  const {
    data: preferences,
    isLoading: isPrefsLoading,
  } = useQuery({
    queryKey: ["admin-notification-preferences"],
    queryFn: () => notificationsApi.getPreferences(),
  });

  // 3. Mark single notification as read
  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    },
  });

  // 4. Mark all as read
  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    },
  });

  // 5. Update notification preferences
  const updatePrefMutation = useMutation({
    mutationFn: (payload: {
      emailEnabled?: boolean;
      smsEnabled?: boolean;
      inAppEnabled?: boolean;
      marketingEnabled?: boolean;
    }) => notificationsApi.updatePreferences(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notification-preferences"] });
    },
  });

  const filteredNotifications = filterUnreadOnly
    ? notifications.filter((n) => n.status !== "READ")
    : notifications;

  const unreadCount = notifications.filter((n) => n.status !== "READ").length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER SECTION */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            System Telemetry &amp; Administrative Notifications
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Live operational event stream, statutory queue alerts, SLA escalations, and automated channel routing preferences.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 shrink-0 self-start sm:self-auto disabled:opacity-50"
          >
            <CheckCheck className="size-3.5" />
            <span>Mark All Read ({unreadCount})</span>
          </button>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. CONTENT GRID */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Notification Routing Preferences */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200/60 pb-3">
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/60">
                <Sliders className="size-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Officer Alert Routing Channels
              </h3>
            </div>

            {isPrefsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 bg-slate-100 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <p className="text-slate-500 text-[11px] font-medium leading-relaxed">
                  Configure which dispatch channels receive automated notifications for statutory QC reviews, SLA risks, and registry status changes.
                </p>

                <div className="space-y-3 pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences?.inAppEnabled ?? true}
                      onChange={(e) =>
                        updatePrefMutation.mutate({
                          inAppEnabled: e.target.checked,
                        })
                      }
                      className="mt-0.5 size-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500/20"
                    />
                    <div>
                      <span className="font-bold text-slate-800 text-xs block">In-App Command Feed</span>
                      <span className="text-[11px] text-slate-500 block font-medium">Direct alerts on administrative navigation and dashboard.</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences?.emailEnabled ?? true}
                      onChange={(e) =>
                        updatePrefMutation.mutate({
                          emailEnabled: e.target.checked,
                        })
                      }
                      className="mt-0.5 size-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500/20"
                    />
                    <div>
                      <span className="font-bold text-slate-800 text-xs block">Transactional Email Alerts</span>
                      <span className="text-[11px] text-slate-500 block font-medium">Dispatch critical SLA breaches to officer email.</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences?.smsEnabled ?? false}
                      onChange={(e) =>
                        updatePrefMutation.mutate({
                          smsEnabled: e.target.checked,
                        })
                      }
                      className="mt-0.5 size-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500/20"
                    />
                    <div>
                      <span className="font-bold text-slate-800 text-xs block">SMS Emergency Broadcasts</span>
                      <span className="text-[11px] text-slate-500 block font-medium">Safaricom / Africa&apos;s Talking SMS for critical incidents.</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences?.marketingEnabled ?? false}
                      onChange={(e) =>
                        updatePrefMutation.mutate({
                          marketingEnabled: e.target.checked,
                        })
                      }
                      className="mt-0.5 size-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500/20"
                    />
                    <div>
                      <span className="font-bold text-slate-800 text-xs block">Gazette &amp; Regulatory Digests</span>
                      <span className="text-[11px] text-slate-500 block font-medium">Weekly Kenyan statutory registry bulletins and fee updates.</span>
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Operational Alert Stream */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Operational Notification Feed</h3>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80">
                {unreadCount} Unread
              </span>
            </div>

            <button
              onClick={() => setFilterUnreadOnly(!filterUnreadOnly)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                filterUnreadOnly
                  ? "bg-amber-600 text-white border-amber-600"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {filterUnreadOnly ? "Showing Unread Only" : "Show All Notifications"}
            </button>
          </div>

          {isNotifsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-slate-100 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : notifsError ? (
            <div className="p-8 text-center space-y-3 bg-white rounded-xl border border-slate-200/80">
              <p className="text-xs font-bold text-rose-600">Failed to load notifications.</p>
              <button
                onClick={() => refetchNotifs()}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                Retry Loading
              </button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-12 text-center space-y-3 bg-white rounded-xl border border-slate-200/80">
              <Bell className="size-8 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No notifications in queue</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                {filterUnreadOnly
                  ? "All operational notices have been acknowledged."
                  : "No system or case notifications recorded yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredNotifications.map((notif: Notification) => (
                <div
                  key={notif.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
                    notif.status !== "READ"
                      ? "border-amber-200 bg-amber-50/50 shadow-xs"
                      : "border-slate-200/80 bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full ${
                        notif.status !== "READ"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Bell className="size-3.5" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-slate-900">{notif.title}</span>
                        {notif.type && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {notif.type}
                          </span>
                        )}
                        {notif.status !== "READ" && (
                          <span className="size-2 rounded-full bg-amber-500 inline-block" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 font-medium">{notif.message}</p>
                      <span className="text-[10px] text-slate-400 font-mono block pt-0.5">
                        {formatDate(notif.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 shrink-0">
                    {notif.status !== "READ" && (
                      <button
                        disabled={markReadMutation.isPending}
                        onClick={() => markReadMutation.mutate(notif.id)}
                        className="bg-white border border-slate-200 text-slate-700 font-bold text-xs px-2.5 py-1 rounded-lg hover:bg-slate-50 transition-all flex items-center gap-1 shadow-xs"
                      >
                        <CheckCheck className="size-3 text-slate-500" />
                        <span>Acknowledge</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
