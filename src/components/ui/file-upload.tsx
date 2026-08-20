"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileText, X, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatFileSize } from "@/lib/utils/format";

export interface FileUploadProps {
  onFileSelect?: (file: File | null) => void;
  accept?: string;
  maxSizeMb?: number;
  label?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
  uploadProgress?: number | null;
  className?: string;
}

export function FileUpload({
  onFileSelect,
  accept = ".pdf,.jpg,.jpeg,.png,.docx",
  maxSizeMb = 15,
  label = "Upload Legal Document",
  hint = "PDF, JPEG, PNG or DOCX up to 15MB",
  error: propError,
  disabled = false,
  uploadProgress,
  className,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const error = propError || localError;

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file) return;

    // Validate size
    if (file.size > maxSizeMb * 1024 * 1024) {
      setLocalError(`File size exceeds maximum allowed limit of ${maxSizeMb}MB.`);
      setSelectedFile(null);
      onFileSelect?.(null);
      return;
    }

    setLocalError(null);
    setSelectedFile(file);
    onFileSelect?.(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setLocalError(null);
    if (inputRef.current) inputRef.current.value = "";
    onFileSelect?.(null);
  };

  return (
    <div className={cn("w-full flex flex-col gap-2", className)}>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center p-4 sm:p-6 border-2 border-dashed rounded-xs transition-all duration-200 cursor-pointer bg-card/50",
          dragActive
            ? "border-gold bg-gold/5 scale-[1.01]"
            : "border-border hover:border-gold/60 hover:bg-gold/5",
          disabled && "cursor-not-allowed opacity-60 bg-muted/40",
          error && "border-destructive/80 bg-destructive/5"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          disabled={disabled}
          onChange={handleChange}
          className="sr-only"
        />

        {selectedFile ? (
          <div className="flex w-full items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xs bg-gold/15 text-gold">
                <FileText className="size-4 sm:size-5" />
              </div>
              <div className="flex flex-col overflow-hidden text-left min-w-0">
                <span className="truncate text-xs sm:text-sm font-semibold text-foreground">
                  {selectedFile.name}
                </span>
                <span className="text-[11px] sm:text-xs text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={removeFile}
                className="p-1 rounded-xs hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
                aria-label="Remove file"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className="mb-2 sm:mb-3 flex size-10 sm:size-12 items-center justify-center rounded-full bg-gold/10 text-gold">
              <UploadCloud className="size-5 sm:size-6" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-foreground">{label}</span>
            <span className="mt-1 text-[11px] sm:text-xs text-muted-foreground">{hint}</span>
            <span className="mt-2.5 sm:mt-3 inline-block rounded-xs bg-muted px-2.5 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Tap or Select File
            </span>
          </div>
        )}

        {typeof uploadProgress === "number" && (
          <div className="mt-4 w-full">
            <div className="flex justify-between text-xs font-semibold text-muted-foreground mb-1">
              <span>Uploading to secure Cloudinary storage...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-gold transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
