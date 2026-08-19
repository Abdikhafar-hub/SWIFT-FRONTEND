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
    <PageShell
      eyebrow="COMMUNICATIONS & OPERATIONAL ALERTS"
      title="System Telemetry & Administrative Notifications"
      description="Live operational event stream, statutory queue alerts, SLA escalations, and automated channel routing preferences."
      actions={
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<CheckCheck className="size-4" />}
              isLoading={markAllReadMutation.isPending}
              onClick={() => markAllReadMutation.mutate()}
            >
              Mark All Read ({unreadCount})
            </Button>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Notification Routing Preferences */}
        <div className="lg:col-span-1 space-y-6">
          <Card padding="md">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                <Sliders className="size-4 text-gold" />
                <span>Officer Alert Routing Channels</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isPrefsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <p className="text-muted-foreground text-[11px]">
                    Configure which dispatch channels receive automated notifications for statutory QC reviews, SLA risks, and registry status changes.
                  </p>

                  <div className="space-y-3 pt-2">
                    <Checkbox
                      label="In-App Command Feed"
                      description="Direct alerts on administrative navigation and dashboard."
                      checked={preferences?.inAppEnabled ?? true}
                      onChange={(e) =>
                        updatePrefMutation.mutate({
                          inAppEnabled: (e.target as HTMLInputElement).checked,
                        })
                      }
                    />

                    <Checkbox
                      label="Transactional Email Alerts"
                      description="Dispatch critical SLA breaches to officer email."
                      checked={preferences?.emailEnabled ?? true}
                      onChange={(e) =>
                        updatePrefMutation.mutate({
                          emailEnabled: (e.target as HTMLInputElement).checked,
                        })
                      }
                    />

                    <Checkbox
                      label="SMS Emergency Broadcasts"
                      description="Safaricom / Africa's Talking SMS for critical incidents."
                      checked={preferences?.smsEnabled ?? false}
                      onChange={(e) =>
                        updatePrefMutation.mutate({
                          smsEnabled: (e.target as HTMLInputElement).checked,
                        })
                      }
                    />

                    <Checkbox
                      label="Gazette & Regulatory Digests"
                      description="Weekly Kenyan statutory registry bulletins and fee updates."
                      checked={preferences?.marketingEnabled ?? false}
                      onChange={(e) =>
                        updatePrefMutation.mutate({
                          marketingEnabled: (e.target as HTMLInputElement).checked,
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Operational Alert Stream */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground">Operational Notification Feed</h3>
              <Badge tone={unreadCount > 0 ? "gold" : "neutral"} size="sm">
                {unreadCount} Unread
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={filterUnreadOnly ? "gold" : "outline"}
                size="xs"
                onClick={() => setFilterUnreadOnly(!filterUnreadOnly)}
              >
                {filterUnreadOnly ? "Showing Unread Only" : "Show All Notifications"}
              </Button>
            </div>
          </div>

          {isNotifsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : notifsError ? (
            <ErrorState onRetry={() => refetchNotifs()} />
          ) : filteredNotifications.length === 0 ? (
            <EmptyState
              icon={<Bell className="size-7 text-muted-foreground" />}
              title="No notifications in queue"
              description={
                filterUnreadOnly
                  ? "All operational notices have been acknowledged."
                  : "No system or case notifications recorded yet."
              }
            />
          ) : (
            <div className="space-y-2">
              {filteredNotifications.map((notif: Notification) => (
                <div
                  key={notif.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xs border transition-all ${
                    notif.status !== "READ"
                      ? "border-gold/40 bg-gold/5 shadow-xs"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full ${
                        notif.status !== "READ"
                          ? "bg-gold/20 text-gold-dark dark:text-gold"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Bell className="size-3.5" />
                    </div>
                    <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-foreground">{notif.title}</span>
                        {notif.type && (
                          <Badge tone="neutral" size="sm">
                            {notif.type}
                          </Badge>
                        )}
                        {notif.status !== "READ" && (
                          <span className="size-2 rounded-full bg-gold inline-block" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{notif.message}</p>
                      <span className="text-[10px] text-muted-foreground block pt-0.5">
                        {formatDate(notif.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 shrink-0">
                    {notif.status !== "READ" && (
                      <Button
                        variant="ghost"
                        size="xs"
                        leftIcon={<CheckCheck className="size-3" />}
                        isLoading={markReadMutation.isPending}
                        onClick={() => markReadMutation.mutate(notif.id)}
                      >
                        Acknowledge
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
