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
  Shield,
  CheckCircle2,
} from "lucide-react";
import { PageShell } from "@/components/ui/layout-primitives";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { notificationsApi } from "@/lib/api/notifications";
import { formatRelativeTime } from "@/lib/utils/format";
import type { Notification } from "@/types";

export default function ClientNotificationsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"ALL" | "UNREAD" | "PREFERENCES">("ALL");

  const {
    data: notifications = [],
    isLoading,
    error,
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
    <PageShell
      eyebrow="SYSTEM UPDATES"
      title="Notifications & Registry Alerts"
      description="Real-time statutory status transitions, document approval notices, payment receipts, and SLA milestone notifications."
      actions={
        unreadCount > 0 ? (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<CheckCheck className="size-3.5" />}
            onClick={() => markAllMutation.mutate()}
            isLoading={markAllMutation.isPending}
          >
            Mark All Read ({unreadCount})
          </Button>
        ) : undefined
      }
    >
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-px mb-6 text-xs">
        <button
          onClick={() => setFilter("ALL")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 font-bold transition-all ${
            filter === "ALL"
              ? "border-gold text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Bell className="size-3.5" />
          <span>All Alerts ({notifications.length})</span>
        </button>

        <button
          onClick={() => setFilter("UNREAD")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 font-bold transition-all ${
            filter === "UNREAD"
              ? "border-gold text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="size-2 rounded-full bg-gold" />
          <span>Unread ({unreadCount})</span>
        </button>

        <button
          onClick={() => setFilter("PREFERENCES")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 font-bold transition-all ${
            filter === "PREFERENCES"
              ? "border-gold text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sliders className="size-3.5" />
          <span>Delivery Channels</span>
        </button>
      </div>

      {filter === "PREFERENCES" ? (
        <div className="max-w-2xl space-y-4">
          <Card padding="md">
            <h3 className="font-display text-base font-bold text-foreground mb-1">
              Statutory Alert Channels
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Configure how Swift Doc and compliance officers notify you regarding registry progress and document queries.
            </p>

            <div className="space-y-4 divide-y divide-border/60 text-xs">
              <div className="flex items-center justify-between pt-3">
                <div className="flex items-center gap-3">
                  <Mail className="size-4 text-gold" />
                  <div>
                    <span className="font-bold text-foreground block">Email Notifications</span>
                    <span className="text-muted-foreground text-[11px]">
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
                  className="size-4 rounded-xs border-border text-gold focus:ring-gold"
                />
              </div>

              <div className="flex items-center justify-between pt-3">
                <div className="flex items-center gap-3">
                  <Smartphone className="size-4 text-emerald-600" />
                  <div>
                    <span className="font-bold text-foreground block">SMS Urgent Alerts</span>
                    <span className="text-muted-foreground text-[11px]">
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
                  className="size-4 rounded-xs border-border text-gold focus:ring-gold"
                />
              </div>
            </div>
          </Card>
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : error ? (
        <ErrorState onRetry={() => refetch()} />
      ) : filteredNotifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="size-8" />}
          title={filter === "UNREAD" ? "No unread alerts" : "All caught up"}
          description="You have no notifications in this category."
        />
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
                className={`flex items-start gap-4 rounded-sm border p-4 transition-all duration-150 cursor-pointer ${
                  isUnread
                    ? "border-gold/60 bg-gold/5 shadow-xs"
                    : "border-border bg-card hover:border-border/80"
                }`}
              >
                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-xs mt-0.5 ${
                    isUnread ? "bg-gold/20 text-gold-dark dark:text-gold" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Info className="size-4" />
                </div>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-display text-sm font-bold text-foreground">
                        {notif.title}
                      </h4>
                      {isUnread && (
                        <span className="size-2 rounded-full bg-gold shrink-0" />
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground shrink-0 font-mono">
                      {formatRelativeTime(notif.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {notif.message}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
