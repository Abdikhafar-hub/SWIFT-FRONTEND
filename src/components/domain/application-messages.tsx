"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, MessageSquare, Shield, User as UserIcon, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { applicationsApi } from "@/lib/api/applications";
import { Button } from "@/components/ui/button";
import type { ApplicationMessage } from "@/types";

interface ApplicationMessagesProps {
  applicationId: string;
  className?: string;
}

export function ApplicationMessages({ applicationId, className }: ApplicationMessagesProps) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["application-messages", applicationId],
    queryFn: () => applicationsApi.getMessages(applicationId),
    refetchInterval: 5000, // Poll every 5s for live conversation updates
  });

  const sendMutation = useMutation({
    mutationFn: (msg: string) => applicationsApi.sendMessage(applicationId, msg),
    onSuccess: () => {
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["application-messages", applicationId] });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || sendMutation.isPending) return;
    sendMutation.mutate(content.trim());
  };

  return (
    <div className={cn("flex flex-col rounded-sm border border-border bg-card shadow-xs", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/70 px-5 py-3.5 bg-muted/20">
        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
          <MessageSquare className="size-4 text-gold" />
          <span>Direct Compliance Officer Communication</span>
        </div>
        <span className="text-[11px] text-muted-foreground">
          Assigned Registry Team
        </span>
      </div>

      {/* Message Thread */}
      <div className="flex-1 min-h-[280px] max-h-[420px] overflow-y-auto p-4 sm:p-5 space-y-4">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Loading communication thread...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8 text-muted-foreground space-y-2">
            <MessageSquare className="size-8 text-muted-foreground/40" />
            <p className="text-xs">
              No messages exchanged yet. Have questions regarding this filing? Send a message directly to your compliance officer below.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOfficer = msg.senderRole === "ADMIN" || (msg.senderRole as any) === "OFFICER";

            return (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col max-w-[85%] rounded-xs p-3 text-xs space-y-1.5",
                  isOfficer
                    ? "mr-auto bg-muted/50 border border-border text-foreground"
                    : "ml-auto bg-gold/15 border border-gold/30 text-foreground"
                )}
              >
                <div className="flex items-center justify-between gap-3 text-[10px] text-muted-foreground">
                  <span className="font-bold flex items-center gap-1">
                    {isOfficer ? (
                      <>
                        <Shield className="size-3 text-gold" />
                        <span className="text-gold-dark dark:text-gold">Compliance Officer</span>
                      </>
                    ) : (
                      <>
                        <UserIcon className="size-3 text-muted-foreground" />
                        <span>You (Client)</span>
                      </>
                    )}
                  </span>
                  <span className="font-mono">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <p className="text-xs leading-relaxed whitespace-pre-wrap">
                  {msg.message}
                </p>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSend} className="border-t border-border/70 p-3 bg-muted/20 flex gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message or inquiry to your compliance officer..."
          rows={1}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
          }}
          className="flex-1 resize-none rounded-xs border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold"
        />
        <Button
          type="submit"
          size="sm"
          disabled={!content.trim() || sendMutation.isPending}
          isLoading={sendMutation.isPending}
          className="bg-gold hover:bg-gold-light text-ink font-bold px-3 shrink-0"
        >
          <Send className="size-3.5" />
        </Button>
      </form>
    </div>
  );
}
