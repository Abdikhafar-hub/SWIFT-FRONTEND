"use client";

import React from "react";
import { AlertCircle, ArrowRight, UploadCloud, FileText, CreditCard, Info } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils/format";
import type { ClientAction } from "@/types";

export interface ClientActionCardProps {
  action: ClientAction;
  onActionClick?: (action: ClientAction) => void;
  className?: string;
}

export function ClientActionCard({ action, onActionClick, className }: ClientActionCardProps) {
  const getActionIcon = () => {
    switch (action.type) {
      case "UPLOAD_DOCUMENT":
      case "REPLACE_DOCUMENT":
        return <UploadCloud className="size-5 text-gold" />;
      case "MAKE_PAYMENT":
        return <CreditCard className="size-5 text-gold" />;
      case "PROVIDE_INFORMATION":
      case "CONFIRM_INFORMATION":
        return <Info className="size-5 text-gold" />;
      case "APPROVE_DECLARATION":
      case "SIGN_DECLARATION":
        return <FileText className="size-5 text-gold" />;
      default:
        return <AlertCircle className="size-5 text-gold" />;
    }
  };

  const getButtonText = () => {
    switch (action.type) {
      case "UPLOAD_DOCUMENT":
      case "REPLACE_DOCUMENT":
        return "Upload Document";
      case "MAKE_PAYMENT":
        return "Pay via M-Pesa";
      case "PROVIDE_INFORMATION":
        return "Submit Information";
      default:
        return "Complete Action";
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xs border border-gold/40 bg-gold/5 shadow-xs transition-all hover:border-gold hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xs bg-gold/20 text-gold">
          {getActionIcon()}
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gold-dark dark:text-gold">
              Urgent Attention Required
            </span>
            {action.dueAt && (
              <span className="text-[11px] text-muted-foreground">
                • Due {formatRelativeTime(action.dueAt)}
              </span>
            )}
          </div>
          <h4 className="mt-0.5 font-display text-sm font-bold text-foreground">
            {action.title}
          </h4>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            {action.description}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center">
        <Button
          variant="gold"
          size="sm"
          onClick={() => onActionClick?.(action)}
          rightIcon={<ArrowRight className="size-3.5" />}
        >
          {getButtonText()}
        </Button>
      </div>
    </div>
  );
}
